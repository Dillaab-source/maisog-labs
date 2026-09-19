# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-003-PROJECT-MUTATION
TURN: PAULO
STATUS: PAULO_DECISION_REQUIRED
AUTHORIZED_SCOPE: NONE_PENDING_PAULO_WEB_INC_003_IMPLEMENTATION_DECISION
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: YES
LAST_IMPLEMENTER_HANDOFF_SHA: 7fa8cf62b8238f4874e842752838fbd0920498b3
LAST_ARCHITECT_REVIEWED_SHA: 32a305971c623c82d2048969acc530b97c295499
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
MUTATION_AUTHORIZED: NO
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Current baselines

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Verified Product Build Pack:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`

Closed prerequisites:
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-014: ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-016: ARCHITECT_APPROVED — WEB-INC-002 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-019: ARCHITECT_APPROVED — WEB-INC-008 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-ADR-003: ACCEPTED`
- `ML-DEVOS-ADR-004: ACCEPTED`
- `ML-DEVOS-ADR-005: ACCEPTED`

## WEB-INC-003 proposal

RFC:
- `ML-DEVOS-RFC-006 — MaisogLabs WEB-INC-003 Project Mutation Capability`
- status: `UNDER_ARCHITECT_SYNC`
- change class: `CAPABILITY`
- proposal commit: `32a305971c623c82d2048969acc530b97c295499`

Architect Sync:
- `ML-DEVOS-AS-020 — WEB-INC-003 Project Mutation Capability Architecture Sync`
- review commit: `23db231cc99725fd00637a18bd11ea37d2ef862c`
- verdict:
  `ARCHITECT_APPROVED — WEB-INC-003 PROJECT MUTATION CAPABILITY COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`

No Builder authority exists yet.

## Proposed bounded capability

If Paulo explicitly authorizes implementation after AS-020, WEB-INC-003 may implement only project:

- create draft;
- replace/edit draft by creating a new immutable revision;
- protected draft preview;
- publish;
- unpublish.

Exact additional protected routes:

- `POST /admin/api/projects`
- `PUT /admin/api/projects/:id/draft`
- `GET /admin/api/projects/:id/preview`
- `POST /admin/api/projects/:id/publish`
- `POST /admin/api/projects/:id/unpublish`

No project DELETE endpoint.
No generic mutation API.

## Mutation identity boundary

All mutation remains downstream of verified Cloudflare Access authentication.

Mutation additionally requires a bounded non-empty verified Access `sub`.

A service-token-style Access application token with empty `sub` is not mutation-authorized by WEB-INC-003.

Do not persist:
- full Access JWT;
- email;
- complete claims object.

Audit actor derives only from the verified subject within ADR-005 bounds.

## Mutation request boundary

Mutating routes must require:
- same-origin Origin;
- JSON request content;
- bounded request body;
- no permissive CORS;
- protected no-store behavior;
- JSON nosniff.

No form-encoded mutation path is authorized.

## Revision model

Create:
- one project base row;
- one immutable project revision;
- draft pointer set;
- published pointer null.

Edit:
- creates a new immutable revision;
- moves draft pointer only;
- never overwrites existing revision content;
- never changes published pointer.

Slug is immutable after creation.

## Stale-write protection

Existing-project mutations must carry:

- `expectedPublishedRevisionId`
- `expectedDraftRevisionId`

Stale pointer state must fail with bounded `409`.

No stale request may advance pointers or overwrite a newer decision.

## Publish / unpublish

Publish:
- requires current draft;
- fully revalidates persisted draft;
- atomically promotes exact draft to published;
- clears draft pointer;
- preserves all historical revisions;
- atomically writes one success audit event.

Unpublish:
- clears published pointer;
- preserves prior revision;
- preserves any independent draft pointer;
- atomically writes one success audit event.

## Atomicity gate

Successful mutation state transition + success audit must be one D1 transaction/batch.

Builder must prove forced audit failure rolls back the business mutation.

### Critical implementation stop condition

The existing revision schema uses integer autoincrement revision IDs.

Builder may not rely on undocumented connection-local ID behavior, race-prone preallocation, or a schema change to meet atomicity.

If the existing schema and documented D1 behavior cannot safely connect a newly created revision, its pointer, and its audit event inside the required atomic transition:

`STOP → RETURN TO ARCHITECT`

No schema change is authorized under this capability.

## Failure audit behavior

When storage remains available, bounded authenticated mutation failures such as validation, not-found, stale pointer, uniqueness, or publish revalidation failure should record `result: failure`.

If transaction/storage fails:
- no partial business mutation survives;
- failure audit may be attempted after rollback;
- audit-storage failure must never make the request look successful.

## Audit action allowlist

Only:
- `project_create_draft`
- `project_update_draft`
- `project_publish`
- `project_unpublish`

Entity type:
- `project`

No arbitrary audit action.

## Public-source limitation

Critical invariant:

`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE`

Public site remains:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

No public D1 cutover is authorized.

Admin UI must not describe local D1 publish as a production deployment/live-site change.

## Schema gate

Current schema must remain exactly 15 product tables.

No migration/schema file may change.

If schema evolution appears necessary, Builder must stop and return to Architect.

## Absolute gates pending Paulo decision

`MUTATION_AUTHORIZED: NO`

`AUDIT_APPEND_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

No implementation may begin.

## Explicitly not authorized

- project delete;
- slug rename;
- other entity/content mutation;
- media/R2;
- journal;
- theme/design;
- persistent session/roles database;
- audit UI/API;
- schema changes;
- remote/production D1;
- production Cloudflare Access changes;
- public D1 cutover;
- deployment;
- protected/main merge;
- WEB-INC-004/006/007 or any later increment;
- Sentinel S3+;
- CI/workflows/rulesets.

## Paulo gate

The earlier Paulo message `Authorized` opened this fresh WEB-INC-003 governance cycle.

Because RFC-006 and AS-020 subsequently defined the exact first-editorial-write trust boundary and binding implementation constraints, a fresh explicit Paulo implementation decision is required before Builder authority exists.

## Current gate

`WEB-INC-003 CAPABILITY ARCHITECT-APPROVED — PAULO IMPLEMENTATION AUTHORIZATION REQUIRED`
