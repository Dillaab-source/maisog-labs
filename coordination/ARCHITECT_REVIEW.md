# Architect Review

Status: `ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION MAY BE RECORDED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-013 — WEB-INC-005 D1 Revision Substrate Architecture Sync

Cycle: `MAISOGLABS-WEB-INC-005-D1-SUBSTRATE`
Reviewed proposal: `ML-DEVOS-RFC-003`
RFC commit: `d6daeca63e0fcfdd5d7a1625ef98098c37e8eb7f`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Product specification baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`

Dependency baseline:
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`

## Classification

`ARCHITECTURE`

The classification in `ML-DEVOS-RFC-003` is correct.

WEB-INC-005:

- introduces D1 as the first persistent product data subsystem;
- creates the revision/pointer storage architecture later admin reads/writes depend on;
- establishes a second, future-source-of-truth representation beside the current Git-backed content model;
- implements the explicit D-007 requirement that the current governed content boundary may only be evolved/replaced through a separately recorded architecture decision.

No Sentinel constitutional/core authority rule changes.

## Repository-grounded compatibility review

### Current public content path

The repository still builds public content from:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`.

That current path remains valid and must remain authoritative for the actual public build during WEB-INC-005.

The RFC's staged approach is therefore compatible with D-007 and safer than an immediate cutover:

`CURRENT STATIC SOURCE`
`        +`
`PARALLEL LOCAL D1 REVISION SUBSTRATE`
`        ↓`
`PARITY / INTEGRITY EVIDENCE`
`        ↓`
`FUTURE SEPARATELY AUTHORIZED CUTOVER`

### Dependency order

The verified Product Build Pack orders:

`WEB-INC-001 → WEB-INC-005 → WEB-INC-002 → WEB-INC-008 → WEB-INC-003 → WEB-INC-004 → WEB-INC-006 → WEB-INC-007`.

WEB-INC-001 is closed at repository level.

WEB-INC-005 is therefore the correct next product increment.

### Current source data

The current `data/site.js` source includes:

- all singleton current domains defined by the Product Build Pack;
- navigation, foundations, projects, services, and process-step collections;
- published/draft/archived state vocabulary;
- project slugs;
- deterministic editorial order.

The RFC maps these to the already-reviewed target model without deleting any domain.

## External D1 feasibility check

Current Cloudflare D1 documentation supports the key technical assumptions:

- Wrangler supports a local-only D1 simulation for local development;
- local D1 migrations/queries can be run against local state;
- remote D1 operations are distinct from local development;
- D1 bindings are exposed to Workers through environment bindings;
- migration files are a first-class Wrangler/D1 mechanism.

These facts establish technical feasibility only. They do not authorize remote D1 creation, remote migration, or deployment.

## Findings / binding constraints

### AS13-F001 — PASS — staged migration preserves public behavior

The RFC correctly keeps the existing Git/static public path authoritative during this increment.

Binding constraint:

- do not change `getPublicContent()` or `app/page.js` to read D1;
- do not delete/retire `data/site.js`;
- do not claim D1 is the public production source of truth after this increment;
- parity evidence is preparation for a later cutover, not cutover authority.

### AS13-F002 — PASS — table ownership is bounded

The RFC permits exactly 14 WEB-INC-005-owned tables:

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

No audit/media/journal/theme/admin-identity table may appear in the implementation.

The D1 migration should fail review if a later-increment table is created early.

### AS13-F003 — PASS WITH CONSTRAINT — base entity / revision pointer integrity

The Product Build Pack's base-entity rule remains binding:

- identity + immutable creation metadata + pointers only;
- project slug is immutable identity metadata;
- public/editable presentation fields live on revision rows.

Additional implementation constraint:

A base entity's `published_revision_id` or `draft_revision_id` must never successfully reference a revision belonging to a different base entity.

SQLite/D1 does not automatically prove this ownership relationship merely because both IDs are individually valid foreign keys.

Therefore Builder must explicitly enforce and test owner consistency, either through:

- a database representation/constraint that makes cross-entity ownership impossible; or
- a bounded data-access validation layer executed before pointer assignment.

A negative test must demonstrate rejection.

### AS13-F004 — PASS — site_settings must remain typed

The current singleton domains may be grouped into `site_settings_revisions`, but not as an opaque whole-document JSON blob.

A small number of explicitly typed JSON substructures is acceptable only if each structure is schema-validated field-by-field and unknown fields are rejected.

The implementation must preserve a direct validation successor to today's `lib/content/schema.mjs`.

### AS13-F005 — PASS — sections bootstrap is compatible

The RFC's initial section rows are correct for the current rendered structure:

- `home`
- `projects`
- `process`
- `about`

`main-content` remains a skip-link target, not a managed section.

No section mutation UI or endpoint is authorized.

### AS13-F006 — PASS — no new root site-live flag

The RFC correctly does not invent a second D1 root-level publication switch.

While the public build still comes from `data/site.js`, current `meta.state` keeps governing that build.

Future public D1 cutover must separately resolve any whole-site availability semantic if one is still required.

### AS13-F007 — PASS WITH CLARIFICATION — migration provenance may be textual

WEB-INC-005 must not invent an admin identity/session table.

For this increment:

- revision `created_by` is a bounded textual provenance field;
- migrated current content uses a deterministic sentinel such as `migration:web-inc-005`;
- the value is history/provenance, not authorization;
- future admin-write identity binding is deferred to the separately authorized mutation capability;
- migrated provenance must not later be silently rewritten.

### AS13-F008 — REQUIRED — local D1 configuration must be structurally safe

No real remote D1 resource is authorized.

Builder must use a repository-valid local configuration approach without creating a production database merely to obtain a real ID.

Acceptable strategies include:

- a local/preview D1 binding configuration supported by Wrangler;
- a dedicated local-only Wrangler configuration/environment;
- another repository-local configuration shape that Wrangler validates and that cannot silently target a production D1 database.

Binding constraints:

- no real production D1 database ID in tracked source;
- no `remote: true` D1 binding;
- no `wrangler d1 create`;
- no remote migration/query/import/export;
- every Builder D1 command in evidence must be local-only;
- if a placeholder remote ID would make normal `wrangler deploy --dry-run` or config validation invalid, Builder must not work around that by creating a remote database; use a separate local config/environment and document the distinction.

### AS13-F009 — REQUIRED — migration must be deterministic and side-effect bounded

The seed/migration routine must have an explicit repeated-run contract.

Allowed examples:

- idempotent no-op after successful identical seed;
- deterministic upsert that produces the same rows/pointers;
- explicit refusal if already seeded, without partial writes.

Not allowed:

- silently generating a second revision set on each run;
- incrementing revisions on a migration rerun;
- mutating published pointers unpredictably;
- partially applying before reporting failure.

The test must inspect resulting row counts, revision counts, and pointers after a second invocation.

### AS13-F010 — REQUIRED — deep parity is semantic, not serialization-order dependent

The parity contract is:

`D1 reconstructed current-content published projection`
`deep-equals`
`projectPublishedContent(siteContent)`

after normalizing only representation details that do not change the content contract.

Do not treat object/SQL row serialization order as a meaningful content difference.

The reconstructed projection must contain the same current public/content domains and values, including `services`, even where a domain is not currently rendered by `app/page.js`.

The WEB-INC-005-only `sections` substrate is not an extra key in this legacy parity projection; it is separately verified against the current page structure.

### AS13-F011 — REQUIRED — fixture safety tests must exercise state mapping

Because the live source is currently published, Builder must add controlled migration fixtures for:

- published;
- draft;
- archived.

Tests must prove:

- draft → `draft_revision_id` only;
- archived → revision preserved, both pointers null;
- published → `published_revision_id`;
- a draft reorder does not alter the published projection/order;
- cross-entity pointer assignment is rejected;
- project slug uniqueness/reserved-slug rules survive migration/storage validation;
- revision-number uniqueness per entity is enforced.

### AS13-F012 — REQUIRED — D1 is server-only substrate

No browser/client bundle may receive a D1 binding or raw draft data.

No new HTTP editorial-read endpoint is authorized.

The data layer may expose server-side functions used by tests and later Worker/server code, but WEB-INC-005 must stop short of WEB-INC-002's authenticated dashboard/read surface.

### AS13-F013 — REQUIRED — no public-read cutover by convenience

If implementation discovers that parity testing would be easier by changing `lib/content/local.mjs` or `app/page.js` to D1, Builder must not do so.

Instead:

- keep the legacy public path;
- implement a separate D1 projection/reconstruction function for tests;
- return to Architect/Paulo if a public cutover is actually required.

### AS13-F014 — REQUIRED EVIDENCE

Before Architect approval, Builder handoff must include:

- exact implementation commit and exact changed-file list;
- exact migration/table inventory;
- migration SQL review summary;
- proof D1 commands were local-only;
- fresh local migration result;
- deterministic second-run result;
- parity test result;
- fixture state-isolation result;
- cross-entity pointer rejection;
- slug uniqueness/reserved-slug validation;
- revision-number uniqueness;
- all existing content tests;
- all existing WEB-INC-001 auth tests;
- full test-suite count/result;
- successful build;
- config/bundle validation that does not mutate remote Cloudflare;
- secret/config scan;
- explicit confirmation no remote Cloudflare D1 resource was created or modified;
- explicit confirmation public rendering still reads `data/site.js`;
- known limitations.

Builder evidence remains `ACTOR_REPORTED` until independently reviewed.

## Expected Builder scope

Claude may implement exactly `ML-DEVOS-RFC-003` subject to this Architect Sync.

Expected repository surface may include:

- D1 migration SQL under `migrations/` or a comparably explicit directory;
- bounded D1 repository/data-access modules;
- local seed/migration/parity tooling;
- D1-specific tests;
- local-safe D1 Wrangler configuration;
- documentation/traceability updates that describe what actually became implemented;
- normal Builder handoff/state records.

No ORM is required or preferred for this increment.

## Explicitly out of scope

No:

- remote D1 creation;
- remote D1 migration/query/import/export;
- production D1 ID;
- public D1 cutover;
- deletion of `data/site.js`;
- admin dashboard/read API;
- content mutation API;
- `audit_log`;
- media/R2;
- journal;
- theme settings;
- persistent admin identity/session table;
- production Cloudflare Access configuration;
- deployment;
- protected/main merge;
- later `WEB-INC-*`;
- Sentinel S3 or later;
- CI/rulesets;
- project onboarding/product `.devos/`.

## Security / trust-boundary verdict

Compatible with Sentinel and the verified Product Build Pack under the binding constraints above.

The architecture deliberately creates storage capability without yet exposing it as a public/admin capability.

Critical invariants:

`D1 EXISTS LOCALLY ≠ D1 IS PUBLIC SOURCE`

`D1 CAPABILITY ≠ AUTHORITY TO PROVISION OR MUTATE REMOTE D1`

`DRAFT DATA EXISTS ≠ DRAFT DATA IS PUBLICLY REACHABLE`

## Verdict

`ML-DEVOS-AS-013: ARCHITECT_APPROVED — WEB-INC-005 RFC-003 COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`

Paulo's instruction `Proceed with WEB-INC-005 authorization.` supplies the required Product/Risk Owner approval to advance this exact next increment through its architecture authorization chain. The implementation decision must bind Claude to RFC-003 + this sync and must preserve the separate remote-Cloudflare gate.

## Deployment / remote-resource authority

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Next review rule

After Builder handoff, Architect must pull live branch/state and compare the exact implementation diff against:

- `ML-DEVOS-RFC-003`;
- this `ML-DEVOS-AS-013`;
- the WEB-INC-005 implementation decision;
- verified Product Build Pack data/backend and build-plan contracts;
- current D-007 content-boundary decision;
- current repository behavior.

Architect must independently inspect migration SQL, table inventory, data-access code, parity evidence, and migration-state tests before issuing PASS / CHANGES_REQUESTED.
