# ML-DEVOS-RFC-006: MaisogLabs WEB-INC-003 Project Mutation Capability

Status: `ACCEPTED`

Change class: `CAPABILITY`

Product increment: `WEB-INC-003 — Project mutation lifecycle`

Repository-grounded base: `f2f2247934b931744223787b5a49aabce47ba624`

## Baselines

- Frozen Sentinel architecture: `ML-DEVOS-ARCH-001 / v1.2.0`
- Active Sentinel governance-capability baseline: `v1.4.0`
- Product Build Pack: `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`
- Authentication boundary: `ML-DEVOS-AS-012`
- Local D1 revision substrate: `ML-DEVOS-AS-014` / `ML-DEVOS-ADR-003`
- Read-only admin dashboard: `ML-DEVOS-AS-016` / `ML-DEVOS-ADR-004`
- Append-only audit substrate: `ML-DEVOS-AS-019` / `ML-DEVOS-ADR-005`

## Problem

MaisogLabs now has:

1. a fail-closed authenticated `/admin` boundary;
2. a local D1 entity+revision storage model for projects;
3. a protected read-only dashboard;
4. an accepted append-only audit substrate.

It still has no authorized editorial write path.

The next dependency-ordered Product Build Pack item is `WEB-INC-003`: bounded project create/edit/draft/preview/publish/unpublish behavior against the already-existing `projects` / `project_revisions` tables.

## Classification

`CAPABILITY`.

This is a sensitive capability change because it introduces the first authenticated editorial mutation API/write permission.

It does **not** introduce a new database subsystem, new product table, new storage architecture, remote resource, or new public source-of-truth architecture. It composes already-accepted architecture:

`WEB-INC-001 auth → WEB-INC-005 revision storage → WEB-INC-008 audit substrate`

into a bounded project write capability.

Because it changes the trust boundary from authenticated read-only access to authenticated project mutation, the active Sentinel policy requires Architect Sync and an explicit Paulo gate.

`CAPABILITY != AUTHORITY` remains binding.

This proposal does not itself authorize Builder implementation.

## Capability-change record

```yaml
capability_id: MAISOGLABS-WEB-INC-003-PROJECT-MUTATION
provider: MaisogLabs Worker + local Cloudflare D1 binding
tool: bounded authenticated project mutation API
roles_allowed:
  - Builder: implementation/testing only after exact Paulo authorization
  - QA: future independent execution/reproduction only
  - Architect: inspection/review only, not product mutation authority
projects_scopes:
  - Dillaab-source/maisog-labs
permission_level: write
credentials_secrets:
  - name: Cloudflare Access assertion
    held_where: request/runtime boundary only; never persisted or committed
  - name: D1 binding
    held_where: Worker runtime binding; no real database_id or remote resource authorized
sensitive_operations:
  - create project draft
  - create replacement project draft revision
  - publish project draft
  - unpublish project
human_approval_requirements: explicit Paulo authorization after Architect Sync
audit_requirements: every authorized mutation attempt must use WEB-INC-008 audit semantics; successful state transitions must commit with a success audit event atomically
evidence_requirements:
  - ACTOR_REPORTED
  - INDEPENDENTLY_INSPECTED
revocation_procedure: end of WEB-INC-003 cycle resets MUTATION_AUTHORIZED to NO; later increments receive no inherited authority
```

## Scope

WEB-INC-003 may implement only the project mutation lifecycle against the existing:

- `projects`
- `project_revisions`
- `audit_log`

tables.

No new product table is authorized.

No existing migration may be rewritten.

No media, journal, theme, site settings, navigation, foundations, services, process-step, or section mutation is authorized.

## Exact protected routes

The capability must expose only these additional authenticated admin routes:

### Create project draft

`POST /admin/api/projects`

Creates:
- one new `projects` base row;
- one new immutable `project_revisions` row;
- `draft_revision_id` pointing to that revision;
- `published_revision_id = null`;
- corresponding audit success/failure semantics.

No project is public merely because this succeeds.

### Replace/edit project draft

`PUT /admin/api/projects/:id/draft`

Creates a **new immutable revision row** and moves `draft_revision_id` to the new revision.

It must never update an existing `project_revisions` content row in place.

It must never alter `published_revision_id`.

### Preview project draft

`GET /admin/api/projects/:id/preview`

Returns a positively constructed authenticated preview projection for the current draft revision only.

If no draft exists, return a bounded not-found/conflict response.

Preview remains private and must never become a public route.

Preview is a read operation and does not itself require an audit mutation event.

### Publish project draft

`POST /admin/api/projects/:id/publish`

Requires a current draft.

Server must revalidate the full persisted draft.

A successful publish must atomically:

1. set `published_revision_id := draft_revision_id`;
2. clear `draft_revision_id`;
3. preserve every older revision row;
4. append a `success` audit event.

No revision row is overwritten/deleted.

### Unpublish project

`POST /admin/api/projects/:id/unpublish`

A successful unpublish must atomically:

1. set `published_revision_id := null`;
2. preserve the previously published revision row;
3. leave any separate draft pointer unchanged;
4. append a `success` audit event.

No delete endpoint is authorized.

## No generic mutation API

Unknown authenticated:

`/admin/api/*`

must continue to fail closed with protected `404`.

Methods/routes not explicitly listed in this RFC are not mutation authority.

No generic table/entity/SQL mutation endpoint may exist.

## Authentication and actor identity

All WEB-INC-003 routes remain downstream of the accepted WEB-INC-001 authentication order:

`VALIDATE AUTH CONFIG → VERIFY ACCESS ASSERTION → ROUTE/METHOD DISPATCH → MUTATION/READ`

No project/D1 mutation may occur before JWT verification succeeds.

For mutation requests, the verified Cloudflare Access JWT payload must be reduced server-side to one bounded mutation identity value.

Binding rule:

- use the verified Access `sub` claim as the principal identifier;
- do not persist the full JWT;
- do not persist email;
- do not pass the full claims object into repository/write helpers;
- mutation requires a non-empty bounded `sub`;
- a token form with no usable subject (including a service-token-style empty `sub`) is not authorized for editorial mutation in this increment.

The audit actor may be a bounded opaque value derived from the verified subject, e.g.:

`cf-access:<sub>`

provided it satisfies the accepted WEB-INC-008 audit validation.

The existing read-only dashboard need not change its identity behavior merely to support this write capability.

## Request hardening / CSRF boundary

Mutation routes are browser-admin operations and must not accept cross-site form-style writes.

For every mutating route:

- require same-origin `Origin` matching the request origin;
- require JSON request content;
- reject unsupported/missing mutation content types before D1 writes;
- keep permissive CORS absent;
- bound request body size;
- return `Cache-Control: no-store` via the existing protected boundary;
- return JSON with `X-Content-Type-Options: nosniff`.

No mutation endpoint may accept arbitrary form-encoded requests.

## Project identity and immutable fields

Create requires bounded validated project identity:

- stable `id`;
- immutable `slug`.

Slug remains immutable after creation.

WEB-INC-003 does not implement slug rename.

Reserved-slug and uniqueness constraints already defined by the accepted data model remain binding.

## Draft revision model

Every editable content change creates a new `project_revisions` row.

A project revision contains the existing accepted project fields:

- `order`;
- `category`;
- `title`;
- `summary`;
- `stack`;
- `accent`;
- `icon`;
- `featured`.

All authoritative validation is server-side.

The client may provide hints, but client validation is never trusted as authority.

A draft revision may coexist with a published revision.

Editing a draft must never mutate the currently published revision row.

## Optimistic concurrency / stale-write protection

Existing-entity mutation requests must carry explicit expected pointer state:

- `expectedPublishedRevisionId`;
- `expectedDraftRevisionId`.

The server must reject stale pointer state with a bounded `409 Conflict` rather than silently overwriting a newer edit/publish/unpublish decision.

The implementation must prove that stale requests cannot advance either pointer.

A repeated request after a successful state transition must therefore become a bounded conflict/no-op, not create an accidental duplicate transition.

If the existing D1 APIs cannot implement this invariant safely under the accepted schema, Builder must stop and return to Architect rather than weakening the requirement.

## Transaction and audit semantics

### Successful state-changing mutation

A successful business state transition and its `result: success` audit append must commit as one atomic D1 transaction/batch.

The implementation may extend the accepted server-only audit module with a narrow validated/fixed prepared audit INSERT helper solely to participate in the same transaction.

It must not:
- expose arbitrary SQL;
- expose caller-selected table/columns;
- weaken audit validation;
- add audit update/delete behavior;
- add an audit HTTP route.

If the audit statement fails, the business mutation must not commit.

### Failed mutation attempt

For a valid authenticated mutation route:

- validation failure;
- not-found;
- uniqueness/conflict;
- stale-pointer conflict;
- revalidation failure;

must leave project state unchanged and should append a `result: failure` audit event when D1 remains available and a bounded entity reference can be recorded.

For a storage/transaction failure:
- no partial project mutation may survive;
- the server may attempt a separate failure audit after rollback;
- if the underlying audit storage is also unavailable, the request must still return failure and must never claim success.

This preserves ADR-005's accepted distinction:

`BUSINESS FAILURE AUDITABLE WHEN STORAGE IS AVAILABLE ≠ AUDIT STORAGE FAILURE MUST RECURSIVELY AUDIT ITSELF`

## Audit actions

Use a fixed allowlist of action names, expected to include only:

- `project_create_draft`;
- `project_update_draft`;
- `project_publish`;
- `project_unpublish`.

No caller-provided arbitrary audit action name.

Entity type:

`project`

Audit entity ID:

the project stable ID, or a bounded sentinel such as `unassigned` only when a rejected create request cannot yield a safe project ID.

Revision ID:
- new/current revision ID when meaningful;
- null when unavailable for a failed pre-write request.

## Error semantics

Responses must not expose:

- SQL;
- raw D1 error messages;
- stack traces;
- JWT claims;
- Access token;
- actor subject;
- binding/config values;
- internal migration/schema details.

Expected bounded response classes:

- `400` malformed/validation failure;
- `401` authentication failure at existing auth boundary;
- `403` valid Access assertion without a mutation-eligible non-empty subject;
- `404` unknown project/route where appropriate;
- `405` unsupported method;
- `409` stale pointer/uniqueness/state conflict;
- `413` request body too large;
- `415` unsupported media type;
- `500` generic internal/storage failure;
- `503` missing required local DB binding after valid authentication.

No error response may falsely report mutation success.

## Response boundary

Mutation responses must be positively constructed.

They may return only bounded mutation status fields such as:

- `id`;
- `slug`;
- derived lifecycle `state`;
- `publishedRevisionId`;
- `draftRevisionId`;
- newly created revision ID where applicable.

They must not return:
- raw D1 rows;
- SQL/schema;
- JWT claims;
- audit actor identity;
- full audit events;
- internal error detail.

The authenticated preview endpoint may return the validated project draft presentation fields needed to render preview, but only from the exact draft revision selected by `draft_revision_id`.

## UI scope

The protected `/admin` UI may gain bounded project-only controls for:

- new project;
- edit current draft / create next draft revision;
- preview draft;
- publish;
- unpublish.

It must not add:
- delete;
- media upload;
- journal;
- theme/design controls;
- site-wide content controls;
- generic entity editor.

Dangerous transitions must require explicit user action; no automatic publish.

The UI must distinguish local editorial state from production-live state.

## Critical public-source limitation

WEB-INC-003 does **not** authorize public D1 cutover.

The current public site continues to read:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

Therefore, in this local/repository increment:

`D1 published ≠ production website live`

The admin UI must not falsely label a D1 publish as a production deployment.

A separately governed future cutover/deployment decision is required before D1 editorial publish state can drive the live public site.

## Existing schema remains unchanged

No migration or table change is authorized.

The current local schema remains exactly 15 product tables:

- 14 WEB-INC-005 tables;
- `audit_log`.

Do not modify:
- `migrations/0001_web_inc_005_init.sql`;
- `migrations/0002_web_inc_008_audit_log.sql`.

If WEB-INC-003 appears to require schema changes, Builder must stop and return to Architect.

## Local-only authority

Implementation/evidence remains local/repository only.

Allowed after explicit implementation authorization:
- local D1 mutation tests;
- local Wrangler simulation;
- local authenticated-route tests;
- local transaction/audit failure simulation;
- build/test/dry-run validation.

Not authorized:
- remote D1 creation/query/migration/mutation;
- real `database_id`;
- `remote: true`;
- production Cloudflare Access changes;
- deployment;
- public D1 cutover;
- protected/main merge.

## Required evidence

Builder handoff must provide at minimum:

1. exact authorized base/result SHA and changed-file list;
2. proof no migration/schema file changed;
3. proof current table inventory remains exactly 15;
4. auth-negative tests proving zero mutation/D1 write before valid Access verification;
5. mutation-subject tests proving empty/unusable `sub` cannot mutate;
6. same-origin/JSON/body-size request hardening tests;
7. create-draft success;
8. create uniqueness/conflict failure;
9. edit-draft creates a new immutable revision and leaves published revision unchanged;
10. stale edit conflict leaves pointers/data unchanged;
11. preview reads only `draft_revision_id`;
12. publish fully revalidates draft;
13. publish pointer swap + draft clear + audit success are atomic;
14. failed publish cannot partially update pointers;
15. unpublish preserves revision history and any separate draft;
16. unpublish + audit success are atomic;
17. every successful mutation produces exactly one expected audit success row;
18. validation/not-found/conflict mutation failures produce bounded audit failure rows when storage remains available;
19. forced audit failure prevents a successful business commit;
20. forced business transaction failure leaves no partial mutation;
21. audit-storage failure never returns success;
22. no project revision content row is UPDATEd in place;
23. no delete project/revision behavior exists;
24. unknown admin API routes remain protected 404;
25. unsupported methods are 405 with zero unintended writes;
26. generic error non-leakage;
27. `Cache-Control: no-store`, JSON `nosniff`, and no permissive CORS across new protected API responses;
28. existing WEB-INC-001 auth suite passes;
29. existing WEB-INC-005 D1 suite passes;
30. existing WEB-INC-002 dashboard suite passes;
31. existing WEB-INC-008 audit suite passes;
32. full `npm test`;
33. successful `npm run build`;
34. local Wrangler/dry-run validation only;
35. secret/config scan;
36. explicit confirmation no schema change, remote D1, public cutover, deployment, later WEB-INC, or protected/main merge occurred.

Builder runtime results remain `ACTOR_REPORTED` until independently reproduced.

Exact committed diff/code can be `INDEPENDENTLY_INSPECTED`.

## Expected implementation surface

If Paulo later grants exact implementation authority, expected surfaces may include:

- `worker/auth.mjs` — minimal verified-subject handoff to post-auth dispatch;
- `worker/index.mjs` — bounded authenticated dispatch wiring;
- a project mutation handler/module under `worker/admin/`;
- project-specific mutation repository/validation helpers under `worker/d1/`;
- narrow audit prepared-statement support if required for transaction atomicity;
- project mutation tests;
- admin UI project controls/preview;
- current-state docs/handoff/state.

Unexpected schema, remote-resource, public-read, or unrelated domain changes require Architect return.

## Non-goals

Not authorized by this proposal:

- project delete;
- slug rename;
- other content-domain mutation;
- media/R2;
- journal;
- theme/design controls;
- application session database;
- roles/permissions database;
- audit UI/API;
- public D1 cutover;
- production deployment;
- remote D1;
- production Access mutation;
- main merge;
- later WEB-INC work;
- Sentinel S3+;
- CI/workflows/rulesets.

## Security / trust impact

This is the first editorial mutation capability.

Accepted trust composition if implemented:

```
valid Access configuration
       ↓
verified identity-based Access JWT
       ↓
bounded non-empty subject
       ↓
same-origin + JSON mutation request
       ↓
project validation + stale-state preconditions
       ↓
atomic project transition + audit success
       ↓
local D1 only
```

This capability is sensitive and must remain tightly scoped.

## Version impact

No Sentinel version bump proposed.

No Sentinel architecture change proposed.

This is a project-scoped sensitive capability under the active `v1.4.0` governance-capability baseline.

## Architect Sync requirement

Required because the capability introduces a new authenticated write trust boundary.

## Paulo decision requirement

Required.

The user's authorization to begin the WEB-INC-003 governance cycle does not, by itself, grant Builder implementation authority over this newly specified capability.

Builder implementation may begin only after this exact proposal receives Architect approval and Paulo explicitly authorizes the resulting bounded scope.
