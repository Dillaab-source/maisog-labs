# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-014 — WEB-INC-005 Implementation Review

Cycle: `MAISOGLABS-WEB-INC-005-D1-SUBSTRATE`
Review mode: `POST-IMPLEMENTATION ARCHITECTURE / DATA-INTEGRITY / SOURCE-OF-TRUTH REVIEW`
Authority chain: `ML-DEVOS-RFC-003 → ML-DEVOS-AS-013 → D-024`
Reviewed Builder implementation commit: `e0304a89ddfb5595866f1990cd9fca161e78ae2b`
Builder implementation base: `7122c9d9887e5801a9c3ec03285db7273f1529c8`
Builder handoff-metadata HEAD: `4e5d631f88cadb7166c73efb8dec9481f3bde219`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Product baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`

## Required review discipline performed

Before issuing this verdict, the Architect:

1. pulled the live governance branch and current `coordination/STATE.md`;
2. confirmed the live branch is at Builder metadata commit `4e5d631...`, with implementation commit `e0304a8...` immediately below it;
3. read the live Builder handoff and current state;
4. independently compared:
   - `7122c9d... → e0304a8...` for the implementation commit;
   - `e0304a8... → 4e5d631...` for the handoff-SHA bookkeeping commit;
   - `7122c9d... → 4e5d631...` for the complete Builder handoff sequence;
5. inspected the D1 migration SQL, schema loader, validation layer, migration/seed logic, repository/read layer, local CLI, tests, Wrangler configuration, and the modified current-state documentation;
6. compared the implementation against `ML-DEVOS-RFC-003`, `ML-DEVOS-AS-013`, `D-024`, D-007, and the verified Product Build Pack;
7. attempted independent executable reproduction in the Architect sandbox. GitHub DNS resolution is unavailable in that sandbox, so the repository could not be cloned and the Builder's npm/Wrangler execution could not be independently rerun. No `INDEPENDENTLY_REPRODUCED` execution claim is made.

## Exact Builder diff

### Implementation commit

GitHub compare `7122c9d9887e5801a9c3ec03285db7273f1529c8 → e0304a89ddfb5595866f1990cd9fca161e78ae2b` reports:

- exactly **1 implementation commit**;
- exactly **19 changed files**.

### Metadata commit

GitHub compare `e0304a89ddfb5595866f1990cd9fca161e78ae2b → 4e5d631f88cadb7166c73efb8dec9481f3bde219` reports:

- exactly **1 documentation-only bookkeeping commit**;
- exactly **2 changed files**:
  - `coordination/IMPLEMENTER_HANDOFF.md`
  - `coordination/STATE.md`

The full base-to-live-HEAD sequence remains the same **19 changed paths**, across 2 commits.

No public application route, legacy public content source, WEB-INC-001 auth code, package dependency, later WEB-INC implementation, deployment, or protected/main merge changed.

## Finding dispositions

### AS14-F001 — BLOCKER — migration is atomic only per entity, not per migration run

`worker/d1/migrate.mjs` correctly uses one `db.batch()` for each newly created entity + revision + pointer.

However, `migrateCurrentContent()` processes the document entity-by-entity and performs a separate committed batch for each entity.

That means a failure discovered later in the migration can leave earlier entities written.

This violates the binding `AS13-F009` requirement that the migration must not partially apply before reporting failure.

The current test titled:

> “migration refuses to overwrite an entity whose stored content differs from the intended target, with no partial write”

does not prove whole-run atomicity. It changes `site.tagline`, and `site_settings` is the **first** entity checked, so the failure occurs before the migration has a chance to write any earlier entity.

Required remediation:

- make the complete migration run side-effect bounded as one logical operation;
- acceptable designs include:
  - full preflight of every entity and pointer/invariant before the first write, followed by a transactional/batched write phase; or
  - one all-or-nothing D1 transaction/batch for the complete set of writes;
- add a negative test where the conflict is deliberately **late** in the sequence (for example, a conflicting project/service after earlier entities are absent) and prove the entire database is byte/row-equivalent before vs. after the failed migration;
- a failed run must not leave newly created site settings/navigation/foundations/etc. behind.

### AS14-F002 — BLOCKER — deterministic no-op accepts the wrong same-entity revision pointer

For an existing entity, `upsertEntity()` currently checks publication state with:

`Boolean(existingEntity.published_revision_id) === intendedPublished`

and:

`Boolean(existingEntity.draft_revision_id) === intendedDraft`.

This checks only whether a pointer is non-null.

It does **not** prove the pointer targets revision 1 — the exact revision that the fixed migration snapshot created and compared.

Therefore an entity can have:

- revision 1 matching the seed;
- a second revision present;
- `published_revision_id` or `draft_revision_id` pointing at revision 2;

and the migration can incorrectly report `noop` merely because the pointer is truthy.

That violates the AS13-F009 requirement that the repeat run must not silently accept corrupted pointers.

Required remediation:

- compare pointer identity, not pointer truthiness;
- for the fixed migration snapshot, the expected pointer must equal the exact matching revision-1 ID for published/draft records;
- archived records must have both pointers exactly null;
- the no-op equivalence check should also include immutable migration provenance/creation metadata that the migration promises to preserve (`created_at` / `created_by`) rather than treating altered provenance as equivalent;
- add a test that deliberately points an entity at a second same-entity revision and proves rerun refuses rather than returning `noop`;
- add a provenance-corruption test or equivalent exact-equivalence assertion.

### AS14-F003 — REQUIRED — D1 validator does not fully preserve the current content contract

`worker/d1/validate.mjs` says its predicates intentionally mirror the current `lib/content/schema.mjs` rules, but several material constraints differ.

Independent comparison found at least:

1. **Order range**
   - legacy: safe integer `0..10000`;
   - D1 validator: safe integer `>= 0` with no upper bound.

2. **Icon enum**
   - legacy: one of `foundation, experience, systems, security, automation, lab, contact, arrow`;
   - D1 foundation/project/process-step validators: arbitrary non-empty text up to 40 chars.

3. **updatedAt calendar validity**
   - legacy requires `new Date(value).toISOString().slice(0,10) === value`;
   - D1 validator only checks regex + finite `Date.parse`, which permits normalized impossible dates such as `2026-02-30`.

4. **Project stack capacity**
   - legacy array validation allows up to 100 entries;
   - D1 validator silently narrows this to 20.

The live source is still protected by `validateContent(source)`, so the current migration happens to receive legacy-valid input. But WEB-INC-005 is creating the successor data/validation substrate, and RFC-003 explicitly forbids silently weakening or narrowing the current content contract.

Required remediation:

- align the D1 validation predicates with the exact current contract unless an explicit architecture/product decision changes a constraint;
- preserve the legacy order maximum;
- preserve the icon enum;
- preserve exact date validity;
- do not silently reduce stack capacity;
- add focused tests that prove the D1 validator and the current contract agree on these boundary cases.

### AS14-F004 — REQUIRED — current-state documentation is internally contradictory after Builder changes

Several files modified in WEB-INC-005 are current-state surfaces but still contain pre-WEB-INC-001 / pre-WEB-INC-005 claims.

Examples:

#### `brain/IMPLEMENTATION_STATUS.md`

Still says:

- `Admin portal (/admin) | NOT STARTED | No route under app/`
- `Authentication | NOT STARTED | No auth library...`
- explicit non-claim: no admin/authentication implementation

Those are false after the accepted WEB-INC-001 repository implementation.

The accurate state is:

- auth-only `/admin` placeholder exists;
- server-side JWT authentication boundary exists;
- no admin content-edit/mutation dashboard exists.

#### `docs/product/PRD.md`

The current-vs-target table still says:

- `Admin surface | NOT IMPLEMENTED`
- `Authentication | NOT IMPLEMENTED`

and the requirements narrative still describes all `ADM-REQ-*` / `WEB-SEC-*` as not started.

That contradicts the accepted WEB-INC-001 state.

#### `docs/product/DATA_BACKEND_SPEC.md`

Its `Current storage model — CURRENTLY IMPLEMENTED` section still says:

> “There is no database, no D1... today”

while the same repository now contains a local-only D1 revision substrate.

The correct distinction is:

- **actual public source/read path:** still Git-backed `data/site.js`;
- **repository/local persistence substrate:** D1 now exists locally under WEB-INC-005;
- **remote/production D1:** does not exist.

Required remediation:

- converge these current-state surfaces on that three-way distinction;
- do not overclaim a full admin portal or production D1;
- keep the accepted auth-only boundary explicit;
- keep public source-of-truth/cutover status explicit.

### AS14-F005 — REQUIRED — Builder handoff exact-diff provenance is wrong

The handoff says:

> `Exact changed-file list — 17 files`

The exact Git compare of the implementation commit shows **19 changed files**.

The handoff listed 17 substantive code/config/doc paths but omitted the two coordination files that are in the implementation commit:

- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

The immediately following bookkeeping commit modifies those same two files again to record `e0304a8...`.

Required remediation:

- correct the implementation diff count to **19 changed paths**;
- distinguish **17 substantive implementation/config/documentation paths + 2 coordination paths** if useful;
- record the two-commit handoff sequence truthfully:
  - implementation: `e0304a8...`
  - SHA-bookkeeping metadata: `4e5d631...`;
- retain evidence-class separation:
  - Builder claims = `ACTOR_REPORTED`;
  - Architect exact Git compare = `INDEPENDENTLY_INSPECTED`.

## Findings that pass / should be preserved

### AS14-F006 — PASS — table ownership

The migration SQL defines exactly the 14 authorized WEB-INC-005 product tables. No `audit_log`, media, journal, theme, or admin-identity/session table was introduced.

### AS14-F007 — PASS — staged public path

`data/site.js`, `lib/content/local.mjs`, `lib/content/public.mjs`, `lib/content/schema.mjs`, and `app/page.js` remain outside the Builder implementation diff.

The public site has not been cut over to D1.

### AS14-F008 — PASS — cross-entity pointer architecture

The composite foreign-key design is structurally appropriate for preventing a base entity pointer from targeting another entity's revision, and a negative test exists for that case.

This does not resolve AS14-F002, which concerns the **wrong revision of the same entity**.

### AS14-F009 — PASS — server-only boundary

The D1 repository layer is not wired into `worker/index.mjs`, `app/`, or a browser/client path in this increment.

No dashboard, editorial HTTP read API, CRUD, or publish/unpublish endpoint was added.

### AS14-F010 — PASS — local/remote boundary in repository configuration

Independent inspection confirms:

- no real `database_id` is tracked;
- the D1 binding is marked `remote: false`;
- the local CLI/test code explicitly requests `remoteBindings: false`;
- no remote-D1 implementation code or production cutover exists in the diff.

The Builder's command execution claims remain `ACTOR_REPORTED`; this review does not claim independent runtime reproduction.

## Evidence disposition

`INDEPENDENTLY_INSPECTED`:

- exact Git commit/diff structure;
- migration SQL;
- migration/no-op logic;
- validation predicates;
- repository/read layer;
- test source;
- local-only configuration shape;
- current-state documentation.

`ACTOR_REPORTED`:

- 69/69 tests;
- build success;
- local D1 migration execution;
- second-run command output;
- Wrangler local command output;
- Wrangler dry-run;
- secret scan.

`INDEPENDENTLY_REPRODUCED`: none in this pass. The Architect sandbox could not resolve `github.com` to clone/install the repository.

## Verdict

`ML-DEVOS-AS-014: CHANGES_REQUESTED — WEB-INC-005 REMEDIATION CYCLE 1`

The implementation has the correct overall architecture and stays within the authorized local-only D1 scope, but WEB-INC-005 cannot close while:

1. a failed full migration can leave partial earlier writes;
2. repeat-run equivalence can accept the wrong same-entity revision pointer;
3. the successor validator diverges from the current content contract;
4. current-state documentation contradicts already accepted repository reality; and
5. the durable Builder handoff misstates the exact diff.

## Authorized Remediation Cycle 1 scope

Claude may modify only what is necessary to resolve the findings above, including:

- `worker/d1/migrate.mjs`;
- `worker/d1/validate.mjs`;
- `tests/d1-migration.test.mjs`;
- `migrations/0001_web_inc_005_init.sql` only if needed to preserve/strengthen the existing content constraints;
- `brain/IMPLEMENTATION_STATUS.md`;
- `brain/RISK_REGISTER.md`;
- `brain/TEST_LEDGER.md`;
- `docs/product/PRD.md`;
- `docs/product/DATA_BACKEND_SPEC.md`;
- `docs/product/BUILD_PLAN.md` only if evidence/status wording must be corrected;
- `docs/ARCHITECTURE.md` only if a directly related current-state statement needs convergence;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

`worker/d1/repository.mjs`, `worker/d1/schema.mjs`, `scripts/d1-migrate.mjs`, and `wrangler.jsonc` should remain unchanged unless the remediation reveals a direct technical necessity.

No public app/content-path file, WEB-INC-001 auth file, package/dependency file, remote Cloudflare resource, later WEB-INC implementation, deployment, main merge, S3, CI, or ruleset work is authorized.

## Deployment / remote-resource authority

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Current gate

`CLAUDE WEB-INC-005 REMEDIATION CYCLE 1 — SUBJECT TO ML-DEVOS-AS-014`
