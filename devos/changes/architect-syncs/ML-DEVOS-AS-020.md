# ML-DEVOS-AS-020 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `23db231cc99725fd00637a18bd11ea37d2ef862c`
- file blob: `953026aa353c21267e2e21a5bedaf027a5e12771`

Archive method:
- The fenced block below reproduces the concluding ML-DEVOS-AS-020 rolling review snapshot byte-for-byte.
- Paulo subsequently authorized the bounded implementation through D-027.

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION REQUIRED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-020 — WEB-INC-003 Project Mutation Capability Architecture Sync

Cycle: `MAISOGLABS-WEB-INC-003-PROJECT-MUTATION`  
Reviewed proposal: `ML-DEVOS-RFC-006`  
RFC proposal commit: `32a305971c623c82d2048969acc530b97c295499`  
Grounded pre-proposal repository HEAD: `f2f2247934b931744223787b5a49aabce47ba624`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Accepted dependencies:
- `ML-DEVOS-AS-012` — WEB-INC-001 auth boundary
- `ML-DEVOS-AS-014` / `ML-DEVOS-ADR-003` — local D1 revision substrate
- `ML-DEVOS-AS-016` / `ML-DEVOS-ADR-004` — protected read-only dashboard
- `ML-DEVOS-AS-019` / `ML-DEVOS-ADR-005` — append-only audit substrate

## Grounding performed

Before issuing this proposal verdict, the Architect live-checked and inspected:

- closed WEB-INC-008 `coordination/STATE.md`;
- verified Product Build Plan WEB-INC-003 scope;
- active Sentinel Change Governance Policy;
- Capability Change Specification;
- current WEB-INC-001 auth implementation;
- current WEB-INC-002 admin dispatcher;
- existing project/revision D1 schema;
- WEB-INC-008 audit writer;
- current D1 repository helpers;
- APP_FLOW create/edit/draft/preview/publish/unpublish design;
- DATA_BACKEND_SPEC project revision/pointer model;
- current Decision Log;
- current RFC/Architect Sync numbering.

External implementation constraints were also checked against current Cloudflare documentation:

- Access application tokens produced through identity authentication carry a principal `sub`;
- Access service-token application tokens carry empty `sub`;
- D1 `batch()` is transactional and rolls back the sequence if a statement fails.

Those facts support the proposal's human-subject mutation gate and atomic mutation+success-audit requirement.

## Classification

`CAPABILITY`

### AS20-F001 — PASS / BINDING — sensitive write capability, not new architecture

WEB-INC-003 does not create a new storage subsystem or table.

It composes already-accepted architecture:

`verified Access identity → project revision substrate → audit substrate`

into the first authenticated editorial write capability.

Because that new capability crosses the current read-only trust boundary, Architect Sync and explicit Paulo authorization are required.

No Sentinel version bump is implied.

## Binding findings

### AS20-F002 — REQUIRED — exact route allowlist only

Only these additional protected routes may be introduced:

- `POST /admin/api/projects`
- `PUT /admin/api/projects/:id/draft`
- `GET /admin/api/projects/:id/preview`
- `POST /admin/api/projects/:id/publish`
- `POST /admin/api/projects/:id/unpublish`

No generic admin mutation endpoint.

No project DELETE route.

Unknown authenticated `/admin/api/*` remains protected `404`.

Unsupported methods remain `405` with zero unintended mutation.

### AS20-F003 — REQUIRED — verified human subject required for mutation

Authentication must remain:

`VALIDATE AUTH CONFIG → VERIFY ACCESS ASSERTION → ROUTE/METHOD DISPATCH → MUTATION`

The verified JWT payload may be reduced server-side to a bounded subject reference for mutation.

Mutation requires:

- identity-based Access token;
- non-empty bounded `sub`.

A service-token-style Access token with empty `sub` may authenticate to the boundary where policy allows it, but it is **not mutation-authorized** in WEB-INC-003.

Do not persist:
- full JWT;
- email;
- complete claims object.

Audit actor should derive only from the verified subject, within ADR-005 bounds.

### AS20-F004 — REQUIRED — browser mutation request hardening

Every mutating endpoint must:

- require same-origin `Origin`;
- require JSON content type;
- bound request body size;
- reject unsupported media type before mutation;
- retain `Cache-Control: no-store`;
- set JSON `X-Content-Type-Options: nosniff`;
- set no permissive CORS.

No form-encoded mutation requests.

### AS20-F005 — REQUIRED — immutable revision model

Create:
- creates one base project row;
- creates one immutable revision;
- points `draft_revision_id` to it;
- keeps `published_revision_id = null`.

Edit:
- creates a **new** revision row;
- moves only `draft_revision_id`;
- never updates an existing revision content row;
- never changes `published_revision_id`.

Slug is immutable after create.

No revision/project delete capability.

### AS20-F006 — REQUIRED — stale-write protection

Every existing-project mutation must carry:

- `expectedPublishedRevisionId`;
- `expectedDraftRevisionId`.

Stale pointer state must produce bounded `409 Conflict`.

A stale request must make no pointer/content change.

The implementation must not silently overwrite a newer draft/publish/unpublish decision.

### AS20-F007 — REQUIRED — publish semantics

Publish requires a current draft.

Before pointer transition:
- reload the exact persisted draft;
- fully revalidate it server-side.

Success must:
- point `published_revision_id` to the exact draft revision;
- clear `draft_revision_id`;
- preserve prior published/history revisions;
- append exactly one `project_publish / success` audit event.

### AS20-F008 — REQUIRED — unpublish semantics

Unpublish success must:
- set `published_revision_id = null`;
- preserve the revision row;
- preserve any independent `draft_revision_id`;
- append exactly one `project_unpublish / success` audit event.

No content/history deletion.

### AS20-F009 — REQUIRED — atomic success transition + audit

A successful state-changing business operation and its success audit event must be one atomic D1 transaction/batch.

Cloudflare D1 currently documents `batch()` as transactional: if a statement in the sequence fails, the sequence aborts/rolls back.

The Builder must prove the concrete implementation has no partial state on forced audit failure.

The Builder may add a narrow internal prepared audit-statement helper if needed for one transaction, provided:
- audit validation remains binding;
- SQL is fixed;
- no arbitrary table/column/SQL surface appears;
- no audit update/delete route appears.

### AS20-F010 — REQUIRED — revision-ID allocation must be proven, not assumed

The current revision schema uses integer autoincrement IDs.

The Builder must not depend on undocumented connection-scoped behavior to connect:
- a newly inserted revision;
- the entity's pointer;
- the audit revision ID;

inside the required atomic transition.

A safe implementation strategy must be demonstrated with local D1 tests.

If the existing schema/D1 API cannot satisfy atomic mutation+audit semantics without:
- schema change;
- undocumented `last_insert_rowid()` behavior;
- race-prone preallocation;
- weakening pointer/audit atomicity;

the Builder must **STOP and return to Architect**.

No schema change is authorized under this capability.

### AS20-F011 — REQUIRED — failure audit semantics

When storage remains available, authenticated valid mutation attempts that fail due to:

- validation;
- not-found;
- uniqueness/state conflict;
- stale pointers;
- publish revalidation;

must produce a bounded `result: failure` audit event where a safe entity reference is available.

For transaction/storage failure:
- no partial business mutation survives;
- server may attempt failure audit after rollback;
- if audit storage itself is unavailable, request still fails;
- never report success merely because failure auditing also failed.

No recursive audit-of-audit requirement.

### AS20-F012 — REQUIRED — audit action allowlist

Only:

- `project_create_draft`
- `project_update_draft`
- `project_publish`
- `project_unpublish`

for entity type:

`project`

No arbitrary caller-controlled action/entity type.

### AS20-F013 — REQUIRED — bounded errors and positive response construction

Expected bounded status classes include:

- 400 validation/malformed
- 401 existing auth failure
- 403 no mutation-eligible subject
- 404 project/route not found
- 405 unsupported method
- 409 conflict/stale state
- 413 oversized body
- 415 unsupported media type
- 500 generic internal/storage failure
- 503 missing DB after valid authentication

Never leak:
- raw D1/SQL;
- stack;
- token/claims;
- subject;
- internal config/schema.

Responses must be positive allowlists.

### AS20-F014 — REQUIRED — preview remains protected and draft-only

`GET /admin/api/projects/:id/preview`:

- runs only after Access verification;
- reads only the entity's exact `draft_revision_id`;
- exposes validated project presentation fields only;
- is not public;
- does not mutate;
- produces no mutation audit event.

No draft pointer means bounded failure, not fallback to published content.

### AS20-F015 — REQUIRED — current public source remains unchanged

Critical limitation:

`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE`

The public site remains:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

WEB-INC-003 must not perform D1 public cutover.

Admin UI wording must not imply that local D1 publish has deployed/changed production.

### AS20-F016 — REQUIRED — exactly 15 product tables remain

No migration/schema change.

Do not modify:
- `migrations/0001_web_inc_005_init.sql`
- `migrations/0002_web_inc_008_audit_log.sql`

No new table.

If implementation needs schema evolution, stop and return to Architect.

### AS20-F017 — REQUIRED — project-only UI scope

Protected admin UI may add project-only:

- new;
- edit draft;
- preview;
- publish;
- unpublish.

It must not add:
- project delete;
- media;
- journal;
- theme/design;
- general site-content editor;
- generic mutation console.

### AS20-F018 — REQUIRED — local/repository only

Allowed after Paulo implementation authorization:

- local D1 mutation tests;
- local Worker/Wrangler simulation;
- local authenticated route testing;
- local forced failure/rollback evidence;
- build/test/dry-run.

Not allowed:

- remote D1;
- real database_id;
- `remote: true`;
- production Access mutation;
- deployment;
- public D1 cutover;
- protected/main merge.

### AS20-F019 — REQUIRED EVIDENCE

Builder handoff must satisfy RFC-006's complete evidence list, including at minimum:

- exact base/result and changed files;
- unchanged schema + exactly 15 tables;
- zero writes before auth;
- empty-sub mutation refusal;
- Origin/JSON/body bounds;
- create/edit/preview/publish/unpublish success/failure;
- stale conflict protection;
- immutable revision history;
- atomic success mutation + audit;
- forced audit failure rollback;
- failure audit behavior;
- no delete;
- route/method fail-closed behavior;
- error/header/CORS controls;
- all prior auth/D1/dashboard/audit regressions;
- full tests/build;
- local-only validation;
- explicit no remote/deploy/cutover/later-increment confirmation.

Execution remains `ACTOR_REPORTED` until independently reproduced.

### AS20-F020 — REQUIRED — capability authority ends with the cycle

If Paulo later authorizes implementation:

`MUTATION_AUTHORIZED: YES`

applies only to the exact WEB-INC-003 project mutation capability.

It does not authorize:
- other entities;
- remote/production resources;
- cutover/deploy;
- subsequent WEB-INC work.

On cycle closure, mutation authority resets to `NO`.

The implemented capability may remain in code, but future use/expansion requires the next explicit authority context.

## Compatibility conclusion

RFC-006 is compatible with the accepted Sentinel/product architecture subject to AS20-F001 through AS20-F020.

The proposal does not require:
- Sentinel architecture change;
- Sentinel version bump;
- database schema change;
- remote resource provisioning;
- public source cutover.

## Verdict

`ML-DEVOS-AS-020: ARCHITECT_APPROVED — WEB-INC-003 PROJECT MUTATION CAPABILITY COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`

This approves capability design compatibility only.

It does **not** authorize Claude to implement.

## Current authority gates

`MUTATION_AUTHORIZED: NO`

`AUDIT_APPEND_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Paulo gate

Because RFC-006 materially defines the first editorial write capability after the user's authorization to begin the governance cycle, Paulo must explicitly authorize implementation of this exact bounded proposal after this Architect Sync.

Until then:
- Builder action is prohibited;
- no project mutation code may be added;
- no prior increment authority carries forward.

## Current Architect Sync status

`ML-DEVOS-AS-020: ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION REQUIRED`
```
