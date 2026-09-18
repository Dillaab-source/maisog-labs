# ML-DEVOS-RFC-003: MaisogLabs WEB-INC-005 D1 Revision Substrate and Current-Content Migration

Status: `UNDER_ARCHITECT_SYNC`

Proposed change class: `ARCHITECTURE`

Product increment: `WEB-INC-005`

Product baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `docs/product/BUILD_PLAN.md`
- `docs/product/DATA_BACKEND_SPEC.md`

## Problem

MaisogLabs still stores all governed content in the Git-tracked `data/site.js` object. That source is validated and projected correctly for the current static public site, but it cannot provide the protected persistent revision substrate required by the next admin increments.

The verified Product Build Pack places `WEB-INC-005` immediately after the completed authentication boundary. It requires a D1-backed revision model for **current content only**, plus deterministic migration/parity evidence, without pulling later dashboard, mutation, media, audit, journal, theme, or production-deployment work forward.

`brain/DECISION_LOG.md` D-007 explicitly requires any replacement/evolution of the governed content boundary to go through a new architecture decision rather than occurring silently. This RFC is that explicit proposal.

## Classification

`ARCHITECTURE`.

Reason:

- introduces D1 as a new persistent data subsystem;
- introduces a revision/pointer storage architecture parallel to the existing Git-backed content boundary;
- establishes the data substrate later protected admin reads and mutations depend on;
- changes the long-term source-of-truth shape for website content;
- defines the staged migration relationship between `data/site.js` and D1.

This RFC does **not** change Sentinel core architecture, actor authority, or governance-capability version.

## Proposed architecture decision

### 1. Staged migration, not immediate public cutover

`WEB-INC-005` will introduce the D1 schema, migration/seed path, and repository data-access substrate **in parallel** with the current static public content path.

During this increment:

`data/site.js → schema.mjs → public.mjs → local.mjs → app/page.js`

remains the authoritative path used to produce the public static site.

The new D1 substrate is populated from that governed source and must prove parity, but `app/page.js` / `getPublicContent()` will **not** be switched to D1 in this increment.

Therefore:

- current rendered output must remain unchanged;
- `data/site.js` must not be deleted or retired;
- no production visitor depends on D1 yet;
- a later separately authorized cutover may replace the public read source only after parity and deployment architecture are independently reviewed.

This is the explicit D-007 architecture evolution: D1 is introduced as the future governed persistence substrate without silently replacing the current public-read boundary before evidence exists.

### 2. Tables owned by WEB-INC-005 only

The increment may create exactly these logical entity/revision pairs:

- `site_settings`
- `site_settings_revisions`
- `navigation`
- `navigation_revisions`
- `foundations`
- `foundation_revisions`
- `projects`
- `project_revisions`
- `services`
- `service_revisions`
- `process_steps`
- `process_step_revisions`
- `sections`
- `section_revisions`

No other product table is authorized.

Explicitly excluded:

- `audit_log`
- `media`
- `project_media`
- `journal_entries`
- `journal_entry_revisions`
- `journal_media`
- `theme_settings`
- `theme_settings_revisions`
- any new admin identity/session table.

Those remain owned by later increments exactly as defined by the Product Build Pack ownership matrix.

### 3. Binding entity/revision model

For every WEB-INC-005 base entity, the base row carries only:

- stable identity;
- immutable `created_at`;
- immutable `slug` only where the entity has a slug (`projects`);
- nullable `published_revision_id`;
- nullable `draft_revision_id`.

No base row may carry:

- `order`;
- visibility;
- lifecycle/publication state;
- editable content;
- mutable public presentation data.

Public-affecting/editable values live in revision rows.

The effective lifecycle remains pointer-derived:

- published pointer set → live;
- only draft pointer set → draft-only;
- both pointers null → archived/removed.

The Builder must preserve the rule that a revision pointer cannot point to a revision belonging to another logical entity. This may be enforced by database constraints, application validation, or both, but it must be explicitly tested.

### 4. Site-settings representation

Current singleton domains:

- `meta`
- `site`
- `seo`
- `hero`
- `process` header/kicker
- `about`
- `contact`
- `projectSection`
- `footer`

must map into a typed `site_settings_revisions` representation.

The implementation must not store the entire current document as one opaque/free-form JSON blob.

A fixed, schema-validated representation is required so the current per-field contract has a direct successor.

### 5. Current collection migration

Current record collections migrate as follows:

- `navigation[]` → `navigation` + `navigation_revisions`
- `foundations[]` → `foundations` + `foundation_revisions`
- `projects[]` → `projects` + `project_revisions`
- `services[]` → `services` + `service_revisions`
- `process.steps[]` → `process_steps` + `process_step_revisions`

For migrated current records:

- a current `published` record becomes a revision referenced by `published_revision_id`;
- a current `draft` record becomes a revision referenced only by `draft_revision_id`;
- a current `archived` record preserves its historical revision but leaves both pointers null;
- current `order` moves into the revision;
- project `slug` remains immutable on the base `projects` row.

The seed/migration code must be deterministic. Re-running it must not silently duplicate revisions or corrupt pointer state; a safe no-op, explicit refusal on already-seeded state, or otherwise deterministic idempotent strategy is acceptable if documented and tested.

### 6. Sections bootstrap

The current site has no persisted `sections[]` collection, but the verified Product Build Pack assigns the sections visibility/order substrate to WEB-INC-005.

Seed the current rendered section anchors as published/visible section revisions:

1. `home`
2. `projects`
3. `process`
4. `about`

with their current order and `visible = true`.

`main-content` is a skip-link target inside the hero, not an independently managed section, and must not be seeded as a section entity.

No section-editing UI or mutation route is authorized.

### 7. No root-level site-live flag in this increment

The current `meta.state` whole-document build gate is not recreated as a separate mutable root-level D1 flag in WEB-INC-005.

The D1 target uses per-entity published/draft pointers as designed in `DATA_BACKEND_SPEC.md`.

Because the public site remains on the existing static content path during this increment, the existing `meta.state` validation continues to govern the actual public build until a future cutover decision.

### 8. Revision provenance before a persistent admin identity schema exists

WEB-INC-001 established request authentication, but it did not create a persistent identity/session database schema.

WEB-INC-005 therefore must **not invent an admin identity/session table**.

Revision `created_by` fields in this increment use a stable textual provenance reference rather than a foreign key to a nonexistent identity table.

For imported current content, use a deterministic migration actor reference such as:

`migration:web-inc-005`

or an equivalently explicit, documented sentinel value.

Future real admin writes must bind provenance to verified admin identity under the separately authorized write-capability increment. Existing migration provenance must remain preserved.

### 9. Local D1 first; no remote Cloudflare resource mutation

Repository implementation may:

- add SQL migration files;
- add the D1 binding/configuration shape required for local development;
- add local seed/migration tooling;
- add a D1 data-access/repository module;
- use Wrangler's local D1 simulation;
- run migrations and parity checks with explicit `--local` behavior.

Repository implementation must **not**:

- run `wrangler d1 create`;
- run remote D1 migrations;
- execute writes against a remote D1 database;
- auto-provision a remote database;
- deploy a Worker;
- create or modify any production Cloudflare resource.

If `wrangler.jsonc` requires a D1 binding declaration, tracked configuration must use a non-secret/non-production placeholder for any real remote database identifier and a clearly local/preview identifier where appropriate.

All Builder evidence for D1 during this increment must be local-only.

Cloudflare's current documentation confirms that D1 is locally simulated by Wrangler and that migrations may be applied with `--local`; remote provisioning/migration is a separate operation. This RFC intentionally confines Builder work to the local/repository side.

### 10. Protected data-access substrate, but no dashboard/API route

WEB-INC-005 must create enough server-side data-access code for the next increment to consume D1 safely.

The repository should expose bounded data-access functions capable of:

- reading current published revisions;
- reading current draft revisions when explicitly requested by trusted server-side code;
- reconstructing the current-content domain model from D1 for parity tests.

It must **not** add:

- an admin dashboard;
- an HTTP editorial-read endpoint;
- content mutation endpoints;
- publish/unpublish handlers;
- client-side D1 access.

No D1 content may become publicly reachable merely because the substrate exists.

### 11. Validation and migration parity

The existing `lib/content/schema.mjs` validation remains the minimum current-content contract.

The migration must preserve every current domain and must not weaken:

- ID constraints;
- project slug uniqueness/reserved-slug rules;
- link/email/canonical URL validation;
- enum/range validation;
- published/draft/archived isolation;
- stable ordering.

Required parity evidence:

1. validate the current `data/site.js` source;
2. migrate/seed a fresh local D1 database;
3. reconstruct the D1 **published projection**;
4. compare it deeply against the current `projectPublishedContent(siteContent)` result;
5. verify all currently visible content and ordering are identical;
6. verify no additional public content appears.

The parity comparison must cover all current domains, including domains not currently rendered, such as `services`.

### 12. Draft/archive isolation tests

Current production data happens to be published, so migration safety cannot be demonstrated from current data alone.

Tests must include controlled fixture cases proving:

- draft record → only `draft_revision_id`, never public projection;
- archived record → revision preserved, both pointers null;
- published record → `published_revision_id`;
- draft reorder cannot change published order;
- cross-entity revision pointer is rejected;
- project slug uniqueness/reserved rules remain enforced.

### 13. Foreign keys / integrity

D1/SQLite foreign-key integrity must be enabled and exercised where applicable.

At minimum, tests must prove:

- revision rows reference their owning entity;
- published/draft pointers reference valid revision rows;
- cross-entity pointer assignment cannot be accepted silently;
- project slug uniqueness is enforced;
- revision number uniqueness per entity is enforced.

If an invariant cannot be expressed directly as a D1 constraint, the implementation must enforce it in the data-access layer and test the failure path explicitly.

### 14. Public behavior remains unchanged

This increment must not change the user-visible public website.

Required evidence includes:

- existing content tests continue to pass;
- existing WEB-INC-001 auth tests continue to pass;
- `npm run build` succeeds;
- the current static public content projection is byte/structure-equivalent to the D1 published projection for the migrated source;
- `data/site.js`, `lib/content/local.mjs`, and the public render path remain authoritative for the actual build unless a separate Architect finding requires a narrowly scoped compatibility edit. Any proposed cutover must stop and return for a new decision rather than being implemented silently.

## Expected repository change surface

Builder implementation may reasonably touch:

- `migrations/` or a comparably named D1 migration directory;
- bounded D1 data-access modules under `worker/` or `lib/`;
- deterministic migration/seed tooling under `scripts/`;
- D1-focused tests under `tests/`;
- `wrangler.jsonc` only for the local/repository D1 binding shape;
- `package.json` / lockfile only if a dependency is genuinely necessary (prefer existing Wrangler/D1 tooling and zero new ORM);
- architecture/data/product documentation only to record what actually became implemented;
- governance map/risk/test ledger as required;
- normal `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`.

Exact paths must be reported in the Builder handoff.

## Explicit non-goals

Not authorized:

- production D1 creation/provisioning;
- remote D1 migration or seed;
- production database IDs/secrets;
- public-site D1 cutover;
- deletion/retirement of `data/site.js`;
- D1-backed public rendering;
- admin dashboard (`WEB-INC-002`);
- audit table (`WEB-INC-008`);
- project mutation lifecycle (`WEB-INC-003`);
- media/R2 (`WEB-INC-004`);
- journal (`WEB-INC-006`);
- theme settings (`WEB-INC-007`);
- content CRUD;
- publish/unpublish APIs;
- persistent admin identity/session schema;
- production Cloudflare Access changes;
- deployment;
- protected/main merge;
- Sentinel S3 or later;
- project onboarding / product `.devos/`;
- CI/workflows/rulesets.

## Acceptance evidence required from Builder

Before Architect review:

- exact Git diff and exact changed-file list;
- schema/table inventory proving only WEB-INC-005-owned tables exist;
- fresh local D1 migration apply result;
- deterministic seed/migration result;
- proof rerun cannot silently duplicate/corrupt;
- deep parity result against current published projection;
- draft/archive isolation results;
- cross-entity pointer rejection result;
- slug/revision-number uniqueness checks;
- existing content tests;
- existing auth tests;
- full `npm test`;
- `npm run build`;
- `npx wrangler deploy --dry-run` or equivalent config/bundle check that performs no remote mutation;
- explicit command log proving D1 commands used `--local` only;
- secret/config scan;
- explicit confirmation no remote Cloudflare resource was created/modified;
- explicit known limitations.

Builder evidence remains `ACTOR_REPORTED` until independently reviewed.

## Rollback

Repository rollback:

- revert the bounded WEB-INC-005 implementation commit;
- current public site remains on `data/site.js`, so no public-content rollback is required.

Local D1 rollback:

- discard/recreate local Wrangler D1 state and reapply migrations/seeding.

Production rollback is not applicable because production D1 provisioning, remote migration, public cutover, and deployment are not authorized.

## Security / trust impact

This increment introduces persistent local/repository data architecture but no new public or admin HTTP capability.

Trust boundary remains:

`authenticated request boundary exists`

but D1 content is not yet exposed through a new route.

Future protected reads and writes must pass through separately authorized capabilities.

## Version impact

Product architecture change only.

No Sentinel architecture/governance-capability version bump.

Frozen Sentinel remains `ML-DEVOS-ARCH-001 / v1.2.0`.
Active governance-capability baseline remains `v1.4.0`.

## Architect Sync requirement

Required because this change is `ARCHITECTURE`.

## Paulo decision requirement

Required.

Paulo explicitly instructed:

`Proceed with WEB-INC-005 authorization.`

That instruction authorizes this next dependency-ordered increment to advance through its required RFC → Architect Sync → Paulo decision chain. Builder implementation becomes authorized only after the Architect Sync approves this bounded proposal and the exact implementation decision is recorded.

## External references reviewed

Current Cloudflare documentation was checked for D1 local-development assumptions:

- D1 bindings are locally simulated by Wrangler during local development;
- local D1 migrations/queries use explicit `--local`;
- remote D1 creation/migration is a distinct operation.

These external facts support feasibility only and do not grant authority or authorize any remote Cloudflare action.
