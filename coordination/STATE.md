# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-003-PROJECT-MUTATION
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: WEB_INC_003_PROJECT_MUTATION_CAPABILITY_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: 7fa8cf62b8238f4874e842752838fbd0920498b3
LAST_ARCHITECT_REVIEWED_SHA: 32a305971c623c82d2048969acc530b97c295499
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: YES
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Current baselines

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Accepted dependencies:
- `ML-DEVOS-AS-012` — WEB-INC-001 authentication boundary
- `ML-DEVOS-AS-014` / `ML-DEVOS-ADR-003` — local D1 revision substrate
- `ML-DEVOS-AS-016` / `ML-DEVOS-ADR-004` — protected read-only admin dashboard
- `ML-DEVOS-AS-019` / `ML-DEVOS-ADR-005` — append-only audit substrate

## Authority chain

RFC:
- `ML-DEVOS-RFC-006 — MaisogLabs WEB-INC-003 Project Mutation Capability`
- status: `ACCEPTED`
- class: `CAPABILITY`

Architect Sync:
- `ML-DEVOS-AS-020: ARCHITECT_APPROVED — WEB-INC-003 PROJECT MUTATION CAPABILITY COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`

Paulo decision:
- `D-027 — Authorize WEB-INC-003 project mutation capability implementation`

This authorization is bounded to the exact RFC-006 / AS-020 / D-027 scope.

## Builder start rule

Before editing anything, Claude must:

1. pull / fast-forward `governance/maisoglabs-v0.1`;
2. record the exact live branch HEAD as the implementation base SHA;
3. read in full:
   - `coordination/STATE.md`;
   - `coordination/ARCHITECT_REVIEW.md` (AS-020);
   - `devos/changes/rfcs/ML-DEVOS-RFC-006.md`;
   - `devos/changes/architect-syncs/ML-DEVOS-AS-020.md`;
   - `brain/DECISION_LOG.md` D-027;
   - `devos/changes/adrs/ML-DEVOS-ADR-003.md`;
   - `devos/changes/adrs/ML-DEVOS-ADR-004.md`;
   - `devos/changes/adrs/ML-DEVOS-ADR-005.md`;
   - relevant Product Build Pack / APP_FLOW / DATA_BACKEND_SPEC / test / risk docs;
4. inspect the current auth, admin dispatch, project/revision D1, and audit modules before editing;
5. stop and return to Architect if the required behavior appears to need schema changes or any authority outside this state.

The authorized implementation base is the live governance branch HEAD containing this authorization state. Claude must record that exact SHA before the first implementation edit.

## Exact authorized routes

Only:

- `POST /admin/api/projects`
- `PUT /admin/api/projects/:id/draft`
- `GET /admin/api/projects/:id/preview`
- `POST /admin/api/projects/:id/publish`
- `POST /admin/api/projects/:id/unpublish`

No generic mutation API.
No project DELETE route.

## Authentication / mutation identity

All routes remain downstream of WEB-INC-001 fail-closed Access verification.

Mutation additionally requires a bounded non-empty verified Access `sub`.

A valid Access token with empty `sub` is not mutation-authorized.

Do not persist:
- full Access JWT;
- email;
- complete claims object.

Audit actor must derive only from the verified subject and stay within ADR-005 validation bounds.

## Request hardening

Every mutating route must:
- require same-origin `Origin`;
- require JSON content;
- enforce a bounded body size;
- reject unsupported content type before D1 mutation;
- expose no permissive CORS;
- retain protected `Cache-Control: no-store`;
- return JSON with `X-Content-Type-Options: nosniff`.

No form-encoded mutation route.

## Project mutation semantics

### Create draft

Creates:
- one `projects` base row;
- one immutable `project_revisions` row;
- `draft_revision_id` → new revision;
- `published_revision_id = null`;
- one bounded success audit event in the same successful atomic operation.

### Edit draft

Creates a new immutable revision row and moves `draft_revision_id`.

Never:
- update existing project revision content in place;
- change `published_revision_id`;
- rename slug.

### Preview

Reads exactly the current `draft_revision_id` after auth.

No draft means bounded failure; do not fall back to published.

Preview is read-only and not a public route.

### Publish

Requires current draft and exact expected pointer state.

Server must re-read and fully revalidate the persisted draft.

Success atomically:
- sets `published_revision_id := draft_revision_id`;
- clears `draft_revision_id`;
- preserves all prior revision rows;
- appends exactly one `project_publish / success` audit event.

### Unpublish

Success atomically:
- sets `published_revision_id := null`;
- preserves prior published revision row;
- preserves any independent draft pointer;
- appends exactly one `project_unpublish / success` audit event.

No deletion.

## Stale-write protection

Existing-project mutations must carry:
- `expectedPublishedRevisionId`;
- `expectedDraftRevisionId`.

Stale state must return bounded `409`.

No stale request may alter content/pointers.

## Atomicity requirement

Successful state-changing mutation + success audit must commit as one local D1 transaction/batch.

Forced audit failure must prevent the business mutation from committing.

### Stop condition

Current revision IDs are integer autoincrement.

Do not rely on:
- undocumented connection-local revision-ID behavior;
- race-prone preallocation;
- schema changes.

If a safe documented local D1 strategy cannot connect the new revision, pointer update, and audit event atomically:

`STOP → RETURN TO ARCHITECT`

No schema evolution is authorized.

## Failure audit behavior

When audit storage remains available, bounded authenticated failures from:
- validation;
- not-found;
- uniqueness/state conflict;
- stale pointers;
- publish revalidation;

should write `result: failure` with a safe bounded entity reference.

For transaction/storage failure:
- no partial business mutation survives;
- failure audit may occur only after rollback;
- audit-storage failure must still produce request failure;
- never report success after failed business/audit storage.

## Audit allowlist

Only:
- `project_create_draft`
- `project_update_draft`
- `project_publish`
- `project_unpublish`

Entity type:
- `project`

Audit append authority in this state exists **only** to support these WEB-INC-003 mutation operations. It is not generic audit-write authority.

## Schema invariant

Exactly 15 product tables remain.

Do not modify:
- `migrations/0001_web_inc_005_init.sql`;
- `migrations/0002_web_inc_008_audit_log.sql`.

No new migration.
No new product table.

## Public-source invariant

`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE`

Public rendering remains:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

No public D1 cutover.

Admin UI must not claim local D1 publish means production-live/deployed.

## UI scope

Allowed project-only controls:
- new project;
- edit/create next draft revision;
- protected draft preview;
- publish;
- unpublish.

Not allowed:
- project delete;
- media;
- journal;
- theme/design;
- generic site/content editor.

## Required Builder evidence

The Builder handoff must satisfy the full RFC-006 / AS20-F019 evidence list, including:

- exact base/result SHA and exact changed files;
- unchanged migrations/schema and exactly 15 tables;
- zero writes before valid auth;
- empty-sub mutation refusal;
- same-origin/JSON/body-limit tests;
- create/edit/preview/publish/unpublish tests;
- stale-pointer conflict tests;
- immutable revision-history proof;
- publish/unpublish + audit atomicity;
- forced audit-failure rollback;
- failure-audit behavior;
- no delete path;
- protected 404 / 405 behavior;
- generic error non-leakage;
- no-store / nosniff / no permissive CORS;
- prior WEB-INC-001/005/002/008 regression suites;
- full `npm test`;
- successful `npm run build`;
- local-only Wrangler/dry-run;
- secret/config scan;
- explicit no schema/remote/cutover/deploy/later-WEB-INC/main-merge confirmation.

Builder runtime evidence remains `ACTOR_REPORTED` until independently reproduced.

## Absolute limits

`MUTATION_AUTHORIZED: YES` only for WEB-INC-003 project mutation.

`AUDIT_APPEND_AUTHORIZED: YES` only as required by the exact WEB-INC-003 project mutation operations.

Still prohibited:

- project delete;
- slug rename;
- mutation of other content domains;
- schema changes;
- media/R2;
- journal;
- theme/design;
- persistent session/role tables;
- audit UI/API;
- remote/production D1;
- production Access mutation;
- public D1 cutover;
- deployment;
- protected/main merge;
- later WEB-INC work;
- Sentinel S3+;
- CI/workflows/rulesets.

## Return rule

When implementation/testing is complete:

1. commit the bounded implementation;
2. update `coordination/IMPLEMENTER_HANDOFF.md` with exact SHA/diff/evidence/limitations;
3. set `coordination/STATE.md` to return control to Architect;
4. stop.

Claude must not self-approve and must not begin the next increment.

## Current gate

`WEB-INC-003 AUTHORIZED — CLAUDE MAY IMPLEMENT ONLY THE BOUNDED LOCAL/REPOSITORY PROJECT MUTATION CAPABILITY UNDER RFC-006 / AS-020 / D-027`
