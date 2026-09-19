# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-003-PROJECT-MUTATION
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
AUTHORIZED_SCOPE: WEB_INC_003_PROJECT_MUTATION_CAPABILITY_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: a1ff241c5c4f912564627ee13824496ecf9b197b
LAST_ARCHITECT_REVIEWED_SHA: 8307fcc70b29294db5637118ab9120e51f0435ff
CURRENT_REMEDIATION_CYCLE: 1
MAX_REMEDIATION_CYCLES: 3
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: YES
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Remediation Cycle 1 — exact authorized scope

Architect review:
- `ML-DEVOS-AS-021: CHANGES_REQUESTED — WEB-INC-003 REMEDIATION CYCLE 1 LIMITED TO COMMIT-TIME STALE-WRITE ENFORCEMENT, BOUNDED MUTATION IDENTITY, TRUE BODY-SIZE BOUNDING, AND ROUTE/DB ORDERING`
- Architect review commit: `8307fcc70b29294db5637118ab9120e51f0435ff`

Claude is authorized only to remediate:

1. **Commit-time stale-write enforcement**
   - expected published/draft pointer state must be enforced inside the atomic mutation boundary, not only by a pre-read;
   - concurrent/interleaved stale edit/publish/unpublish must fail with bounded `409`;
   - no stale business mutation or success audit may survive.

2. **Bounded mutation identity**
   - verified Access `sub` must be non-empty and explicitly bounded before project D1 access;
   - whitespace-only / oversized subjects must be rejected with `403` and zero project D1 access;
   - accepted maximum subject must still produce a valid ADR-005 audit actor.

3. **True body-size bounding**
   - enforce the 32 KiB budget in bytes, not JavaScript character count;
   - use declared Content-Length as an early reject when available;
   - add multibyte coverage proving the limit cannot be bypassed.

4. **Route/method classification before DB requirement**
   - unsupported route/method returns 404/405 without requiring DB;
   - only a recognized route that needs D1 returns 503 when DB is absent.

Required regression tests:
- deterministic interleaving/TOCTOU tests for edit, publish, and unpublish;
- subject boundary tests;
- multibyte body-limit test;
- missing-DB 404/405/503 ordering tests.

Do not:
- redesign WEB-INC-003;
- change migrations/schema;
- add tables;
- add routes;
- add project delete;
- mutate other content domains;
- touch remote D1/deployment/public cutover;
- begin later WEB-INC work.

If commit-time stale enforcement cannot be implemented safely with the existing schema and documented D1 behavior:

`STOP → RETURN TO ARCHITECT`

Absolute gates remain:

`MUTATION_AUTHORIZED: YES` — only for this bounded remediation.

`AUDIT_APPEND_AUTHORIZED: YES` — only as required by WEB-INC-003.

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

After remediation:
- run focused project tests;
- run all prior WEB-INC regression suites;
- run full `npm test`;
- run build;
- update handoff/state;
- return exact remediation SHA and changed-file list to Architect.

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

## Builder handoff (original implementation cycle)

Implementation commit: `a016cc2aafea494ad00ecfd79b545ccdcb0c1221` on base `5ba7c496a05d2541324c5ecc565c1937ca023b1e`. Summary: exactly the five authorized routes implemented (`worker/admin/projects.mjs` + `worker/d1/projects.mjs`); mutation requires a bounded non-empty verified Access `sub`; same-origin/JSON/bounded-body request hardening; create/edit each write one new immutable `project_revisions` row; existing-project mutations require `expectedPublishedRevisionId`/`expectedDraftRevisionId`; every successful mutation and its success audit row commit as one `db.batch()` transaction; schema unchanged. `npm test`: 152/152 passing. Reviewed by `ML-DEVOS-AS-021`: 6 of 10 findings `PASS`, two (`AS21-F007`, `AS21-F008`) `BLOCKING` and two (`AS21-F009`, `AS21-F010`) `REQUIRED REMEDIATION`.

## Builder handoff (Remediation Cycle 1 — this cycle)

Remediation commit: `a1ff241c5c4f912564627ee13824496ecf9b197b` on remediation base `5f2991f1c26c79bdda687ff6b4adba4c8e00c50b`. Full detail, exact mechanism explanation, and the complete evidence log required above are in `coordination/IMPLEMENTER_HANDOFF.md`'s "WEB-INC-003 Remediation Cycle 1" section. Summary: closes `AS21-F007`–`F010` only.

- **`AS21-F007`** (commit-time stale-write enforcement): `worker/d1/projects.mjs`'s edit/publish/unpublish pointer `UPDATE` statements now enforce `expectedPublishedRevisionId`/`expectedDraftRevisionId` inside the same atomic batch via a self-referential `CASE` guard evaluated against the row's live state; on mismatch, the guard's false branch writes the literal `'home'` into `slug`, which the existing unmodified `CHECK` constraint rejects — aborting the whole `db.batch()` transaction so no stale mutation and no false-success audit row can commit. Proven by three deterministic `interleavingDb`-based TOCTOU tests (edit/publish/unpublish vs a competing change) that would have passed silently under the old pre-read-only guard. The mechanism was empirically probed against a real local D1 instance first, which also ruled out SQLite's `changes()` function as unsuitable for this purpose.
- **`AS21-F008`** (bounded mutation subject): `worker/auth.mjs`'s `extractMutationSubject` now trims and rejects empty/whitespace-only/oversized (`>90` chars)/non-printable-ASCII subjects before dispatch, guaranteeing the resulting `cf-access:<sub>` audit actor always fits `ACTOR_PATTERN`'s 100-char bound.
- **`AS21-F009`** (true byte-limit): `worker/admin/projects.mjs`'s new `readBoundedBodyBytes` streams and counts real bytes (with an early `Content-Length` reject), replacing the old `String.length`-based check that multibyte content could bypass.
- **`AS21-F010`** (route/DB ordering): `handleProjectsDispatch` now classifies route/method before checking for the DB binding, so unsupported routes/methods return `404`/`405` without requiring DB.

`tests/worker-admin-projects.test.mjs` adds 12 tests (51 total). `npm test`: 164/164 passing. No schema/migration/route/domain change. Changed files this commit: `worker/d1/projects.mjs`, `worker/auth.mjs`, `worker/admin/projects.mjs`, `tests/worker-admin-projects.test.mjs`, `brain/TEST_LEDGER.md`. The Implementer has not self-certified this as `ARCHITECT VERIFIED`.

## Current gate

`WEB-INC-003 REMEDIATION CYCLE 1 HANDED OFF — TURN: ARCHITECT — INDEPENDENT REVIEW OF THE FOUR FIXES REQUIRED AGAINST AS-021 BEFORE ANY CLOSURE OR POST-REVIEW ADR`
