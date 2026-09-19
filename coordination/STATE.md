# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-004-MEDIA-SUBSYSTEM
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: WEB_INC_004_LOCAL_MEDIA_SUBSYSTEM_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: a1ff241c5c4f912564627ee13824496ecf9b197b
LAST_ARCHITECT_REVIEWED_SHA: 787b632c903eb497ea2b75f42ae30401d74e5b60
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
MEDIA_MUTATION_AUTHORIZED: YES
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: YES
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Current baselines

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.5.0`

Closed dependencies:
- `ML-DEVOS-AS-012` — authentication boundary
- `ML-DEVOS-AS-014` / `ML-DEVOS-ADR-003` — local D1 revision substrate
- `ML-DEVOS-AS-019` / `ML-DEVOS-ADR-005` — append-only audit substrate
- `ML-DEVOS-AS-022` — project mutation capability accepted

## WEB-INC-004 proposal

RFC:
- `ML-DEVOS-RFC-007 — MaisogLabs WEB-INC-004 Local Media Subsystem`
- change class: `ARCHITECTURE`
- proposal commit: `787b632c903eb497ea2b75f42ae30401d74e5b60`

Architect Sync:
- `ML-DEVOS-AS-023 — WEB-INC-004 Local Media Subsystem Architecture Sync`
- review commit: `55685940b35527af32ecdb64f2f85746def6188d`
- verdict:
  `ARCHITECT_APPROVED — WEB-INC-004 LOCAL MEDIA SUBSYSTEM COMPATIBLE FOR BOUNDED REPOSITORY/LOCAL IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`

No Builder authority exists yet.

## Proposed implementation scope

If Paulo explicitly authorizes implementation, Claude may build only:

- new `media` D1 table;
- new `project_media` D1 table;
- local simulated R2 binding;
- `POST /admin/api/media` validated upload;
- `GET /admin/api/media` protected metadata list;
- optional complete media-selection snapshots on new project revisions created through existing project create/edit;
- exact-draft preview media metadata;
- required audit integration and local-only tests.

## Schema target

Current product-table count:
- 15

Proposed target:
- 17

New migration only:
- `migrations/0003_web_inc_004_media.sql`

Existing migrations must remain byte-identical.

No `journal_media`, journal, or theme table is authorized.

## Media boundary

Allowed types only:
- image/jpeg
- image/png
- image/webp

Forbidden:
- SVG;
- arbitrary files;
- archives;
- remote URL ingestion.

Maximum upload:
- 5 MiB actual bytes.

Server must validate both declared type and file signature.

Server generates:
- media ID;
- storage key.

Client filename/path must not control storage location.

## Immutability

Existing media public-affecting metadata is immutable.

Changing file or alt text means new media row.

Existing project_media associations are immutable.

Changing project media means a new project revision with its own association snapshot.

No media DELETE or UPDATE API.

## Local R2 only

This cycle may use only local Wrangler/R2 simulation.

`REMOTE_R2_AUTHORIZED: NO`

Do not configure:
- `remote: true`;
- real bucket provisioning;
- public bucket;
- custom domain;
- production resource credentials/IDs.

## Cross-store failure behavior

Successful upload:
1. validate;
2. write object to local R2;
3. D1 batch inserts media metadata + success audit;
4. return success.

R2 failure:
- no D1 success.

D1 failure after object write:
- attempt compensating delete of new local object;
- no media metadata/success audit survives;
- return failure.

Compensation failure:
- still fail request;
- do not fabricate D1 state.

## Project integration

Project create/edit may optionally provide a complete media snapshot for the new revision.

If omitted on edit:
- inherit/copy the source revision media snapshot.

If supplied:
- it fully defines the new revision's associations.

All referenced media must exist and be active.

Project revision + association rows + pointer transition + existing project success audit must remain one D1 atomic batch.

WEB-INC-003 stale-write protections remain binding.

## Public boundary

`LOCAL R2 OBJECT + D1 MEDIA ROW != PUBLIC WEBSITE MEDIA`

No public R2/D1 path.
No cutover.
No deployment.

## Sentinel review-note disposition

The canonical Sentinel review note was consulted.

Because this cycle uses local R2 simulation only and no real remote cloud authority, it does not justify prematurely implementing S3–S7, CI, rulesets, a Capability Gateway, Task Engine, or Orchestrator.

Keep the build simple.

## Absolute gates

`MEDIA_MUTATION_AUTHORIZED: NO`

`MUTATION_AUTHORIZED: NO`

`AUDIT_APPEND_AUTHORIZED: NO`

`REMOTE_R2_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Explicitly not authorized

- real/remote R2;
- remote D1;
- public bucket/custom domain;
- public media route;
- D1/R2 public cutover;
- media delete API;
- SVG/arbitrary file upload;
- journal/journal_media;
- theme/design;
- production Access changes;
- deployment;
- protected/main merge;
- later WEB-INC;
- Sentinel S3+;
- CI/rulesets/Task Engine/Capability Gateway/Orchestrator.



## D-029 implementation authorization

Paulo authorized bounded local/repository implementation under:

- `ML-DEVOS-RFC-007`
- `ML-DEVOS-AS-023`
- `D-029`
- active Sentinel governance-capability baseline `v1.5.0`

Claude may implement only the WEB-INC-004 scope described above.

Required handoff:
- exact base/result SHA;
- exact changed files;
- all RFC-007 / AS23-F018 evidence;
- explicit statement that no real/remote R2 or D1 was touched;
- explicit statement that no public bucket, deployment, cutover, main merge, later WEB-INC, or Sentinel S3+ work occurred.

Because WEB-INC-004 is `ARCHITECTURE`, accepted implementation requires:
- independent Architect implementation review;
- durable Architect Sync archive;
- post-acceptance ADR before cycle closure.

## Current gate

`WEB-INC-004 LOCAL IMPLEMENTATION AUTHORIZED — CLAUDE TO BUILD AND HAND OFF FOR ARCHITECT REVIEW`
