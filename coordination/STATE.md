# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-005-D1-SUBSTRATE
TURN: CLAUDE
STATUS: CHANGES_REQUESTED
AUTHORIZED_SCOPE: WEB_INC_005_D1_SUBSTRATE_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: e0304a89ddfb5595866f1990cd9fca161e78ae2b
LAST_ARCHITECT_REVIEWED_SHA: e0304a89ddfb5595866f1990cd9fca161e78ae2b
CURRENT_REMEDIATION_CYCLE: 1
MAX_REMEDIATION_CYCLES: 3
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

Closed dependency:
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`

## Authority chain for this cycle

RFC:
- `ML-DEVOS-RFC-003 — MaisogLabs WEB-INC-005 D1 Revision Substrate and Current-Content Migration`
- status: `ACCEPTED`
- change class: `ARCHITECTURE`

Architect Sync:
- `ML-DEVOS-AS-013: ARCHITECT_APPROVED — WEB-INC-005 RFC-003 COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`
- durable archive: `devos/changes/architect-syncs/ML-DEVOS-AS-013.md`

Paulo implementation decision:
- `D-024 — Authorize WEB-INC-005 D1 revision-substrate implementation`

Paulo explicitly instructed `Proceed with WEB-INC-005 authorization.` This authority applies to WEB-INC-005 only and does not authorize later increments or remote Cloudflare operations.

## Builder review state

Architect review of implementation commit `e0304a89ddfb5595866f1990cd9fca161e78ae2b` and bookkeeping HEAD `4e5d631f88cadb7166c73efb8dec9481f3bde219` returned:

- `ML-DEVOS-AS-014: CHANGES_REQUESTED — WEB-INC-005 REMEDIATION CYCLE 1`

Required remediation:

1. `AS14-F001` — make migration failure side-effect bounded across the **whole migration run**, not merely per entity. A late conflict must leave the database unchanged.
2. `AS14-F002` — no-op equivalence must validate the exact expected revision pointer and preserved provenance/creation metadata, not just pointer truthiness.
3. `AS14-F003` — align D1 validators with the current content contract:
   - order max 10000;
   - exact icon enum;
   - exact YYYY-MM-DD validity;
   - project stack capacity consistent with the current schema.
4. `AS14-F004` — converge stale current-state docs:
   - WEB-INC-001 auth-only `/admin` and JWT boundary exist;
   - no content-editing admin dashboard exists;
   - local-only D1 substrate exists;
   - public source path is still `data/site.js`;
   - remote/production D1 does not exist.
5. `AS14-F005` — correct Builder exact-diff provenance from 17 to 19 paths and record the 2-commit handoff sequence truthfully.

Preserve PASS findings:
- exact 14-table ownership;
- staged public path;
- composite cross-entity pointer protection;
- server-only D1 boundary;
- local-only / no-remote D1 configuration.

No later increment, remote D1 operation, deployment, main merge, Sentinel S3, CI, or ruleset work is authorized.

## Builder objective

Implement the current-content D1 entity/revision substrate and deterministic migration/parity tooling locally in the repository while preserving the existing public build path.

Current public path remains authoritative during this increment:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

D1 is introduced in parallel and must prove parity. No public cutover is authorized.

## Authorized table inventory — exactly these 14

1. `site_settings`
2. `site_settings_revisions`
3. `navigation`
4. `navigation_revisions`
5. `foundations`
6. `foundation_revisions`
7. `projects`
8. `project_revisions`
9. `services`
10. `service_revisions`
11. `process_steps`
12. `process_step_revisions`
13. `sections`
14. `section_revisions`

No other product table is authorized.

## Authorized repository implementation

Claude / Builder may:

- add D1 migration SQL for the 14 authorized tables;
- add a local-safe D1 binding/configuration shape;
- add deterministic local seed/migration tooling;
- add bounded server-side D1 data-access and projection/reconstruction modules;
- add D1 parity, integrity, migration-state, repeat-run, and negative-path tests;
- add local scripts necessary to exercise migrations and parity;
- update architecture/data/product/governance/test documentation only to record what actually became implemented;
- update `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`.

Prefer existing Wrangler/D1 tooling and no ORM/new dependency unless genuinely necessary.

Exact changed paths must be reported in the Builder handoff.

## Binding storage model

Base entity rows contain only:

- stable identity;
- immutable `created_at`;
- immutable project `slug` where applicable;
- nullable `published_revision_id`;
- nullable `draft_revision_id`.

Do not place `order`, visibility, lifecycle/publication state, mutable public content, or other public-affecting editable values on base rows.

Revision ownership must be preserved: a base entity pointer must not successfully target another entity's revision.

Entity status remains derived from the two pointers.

## Current-content migration contract

Current record collections map to:

- `navigation[]` → navigation pair;
- `foundations[]` → foundations pair;
- `projects[]` → projects pair;
- `services[]` → services pair;
- `process.steps[]` → process-steps pair.

Singleton current domains map into a typed/schema-validated `site_settings_revisions` representation.

Do not store the whole current content document as an opaque free-form JSON blob.

Migration state mapping:

- source `published` → published revision pointer;
- source `draft` → draft revision pointer only;
- source `archived` → revision preserved with both pointers null.

Project slug remains immutable on the base row.

## Sections bootstrap

Create published/visible section revisions for:

1. `home`
2. `projects`
3. `process`
4. `about`

`main-content` is not a managed section.

No section-editing UI or mutation endpoint is authorized.

## Migration provenance

Do not create an admin identity/session table.

For imported current content, revision `created_by` uses deterministic textual provenance such as:

`migration:web-inc-005`

or an equivalently explicit stable value.

This is provenance, not authorization.

## Local-only D1 rule

All implementation/evidence work is local/repository only.

Allowed:

- local Wrangler D1 simulation;
- local migration apply;
- local seed;
- local query/parity/integrity tests.

Not allowed:

- `wrangler d1 create`;
- remote D1 migration/query/import/export;
- a real production D1 ID in tracked source;
- `remote: true` D1 binding;
- any remote Cloudflare D1 mutation;
- Worker deployment.

If a placeholder remote ID makes Wrangler configuration invalid, use a separate local-only config/environment rather than creating a remote database.

Every D1 command recorded as Builder evidence must be demonstrably local-only.

## Public behavior invariant

Do not switch:

- `lib/content/local.mjs`;
- `app/page.js`;
- the actual public render path

to D1 in this increment.

Do not delete or retire `data/site.js`.

The D1 published projection exists for parity/testing only at this stage.

If implementation appears to require a public cutover, STOP and return for a new decision.

## Data-access boundary

A bounded server-side data layer may:

- read current published revisions;
- read draft revisions only when explicitly requested by trusted server-side code;
- reconstruct the current-content model for parity testing.

Do not add:

- an HTTP editorial-read endpoint;
- admin dashboard UI;
- mutation endpoint;
- publish/unpublish handler;
- client/browser D1 access.

## Required Builder tests/evidence

Before returning to Architect, provide:

1. exact implementation commit and exact changed-file list;
2. exact D1 table inventory proving only the 14 authorized tables exist;
3. migration SQL summary;
4. fresh local migration-apply result;
5. deterministic seed/migration result;
6. second-run behavior proving no duplicate/corrupt revisions or pointers;
7. deep semantic parity:
   `D1 reconstructed published projection == projectPublishedContent(siteContent)`;
8. parity includes all current domains, including `services`;
9. sections substrate verified separately against current page structure;
10. published/draft/archived fixture mapping;
11. draft reorder cannot affect published projection/order;
12. cross-entity revision-pointer assignment is rejected;
13. project slug uniqueness/reserved-slug enforcement;
14. revision-number uniqueness per entity;
15. foreign-key/integrity behavior;
16. all existing content tests;
17. all existing WEB-INC-001 auth tests;
18. full `npm test` count/result;
19. successful `npm run build`;
20. Wrangler config/bundle validation with no remote mutation;
21. exact command log proving D1 commands were local-only;
22. secret/config scan;
23. explicit confirmation no remote Cloudflare D1 resource was created/modified;
24. explicit confirmation public rendering still reads `data/site.js`;
25. known limitations.

Builder evidence remains `ACTOR_REPORTED` until independently verified.

## Explicitly prohibited

This cycle does NOT authorize:

- any table outside the 14 listed above;
- `audit_log`;
- media or R2;
- journal;
- theme settings;
- persistent admin identity/session tables;
- `WEB-INC-002` or any later `WEB-INC-*`;
- admin dashboard/read API;
- content CRUD;
- publish/unpublish APIs;
- public D1 cutover;
- deletion/retirement of `data/site.js`;
- production D1 creation/provisioning;
- remote D1 operations;
- production Cloudflare Access changes;
- deployment;
- protected/main merge;
- Sentinel S3 or later;
- project onboarding/product `.devos/`;
- CI/workflows;
- GitHub rulesets/branch protection.

## Architect review rule

After Builder handoff, Architect must pull the live branch/state and independently compare the exact Builder commit against:

- `ML-DEVOS-RFC-003`;
- `ML-DEVOS-AS-013`;
- `D-024`;
- `D-007`;
- `docs/product/DATA_BACKEND_SPEC.md`;
- `docs/product/BUILD_PLAN.md`;
- current repository behavior.

Architect must independently inspect migration SQL, table inventory, data-access code, parity strategy, repeat-run behavior, and state/integrity tests before issuing PASS / CHANGES_REQUESTED.

## Current gate

`CLAUDE WEB-INC-005 REMEDIATION CYCLE 1 — SUBJECT TO ML-DEVOS-AS-014`
