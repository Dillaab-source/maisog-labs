# Implementer Handoff

Status: `READY_FOR_ARCHITECT` (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

## Cycle / Change ID

`MAISOGLABS-WEB-INC-005-D1-SUBSTRATE` — **Remediation Cycle 3 (FINAL)** (`CURRENT_REMEDIATION_CYCLE: 3` / `MAX_REMEDIATION_CYCLES: 3`)

Authority chain: `ML-DEVOS-RFC-003` → `ML-DEVOS-AS-013` → `D-024` → `ML-DEVOS-AS-014` (Remediation Cycle 3 verdict: `CHANGES_REQUESTED — WEB-INC-005 REMEDIATION CYCLE 3 (FINAL)`, `AS14-F004` "PARTIALLY RESOLVED — one final current-state convergence defect remains"; `AS14-F005` `RESOLVED`; `AS14-F001`–`F003` and `AS14-F006`–`F010` already `RESOLVED`/`PASS` and preserved). This is the final configured remediation cycle under `MAX_REMEDIATION_CYCLES: 3`.

## Remediation Cycle 3 (FINAL) objective

Resolve the last remaining `AS14-F004` current-state wording defects in `docs/product/DATA_BACKEND_SPEC.md`: the blanket "Until D1/R2 exist..." rollback/data-loss statement, and the stale "No migration is authorized or performed by this cycle..." migration-considerations statement. Narrow, documentation/provenance-only — no runtime, migration, validator, test, migration-SQL, Wrangler-config, or package file is touched, and no technical implementation is reopened.

## Remediation Cycle 3 (FINAL) branch / commit state

- Cycle 3 base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `c32dd2c034d0c372de532963fc6f3629f33d2c6c`. This SHA carries the Architect's Remediation Cycle 2 verification (`ML-DEVOS-AS-014: CHANGES_REQUESTED — WEB-INC-005 REMEDIATION CYCLE 3 (FINAL)`) into `coordination/ARCHITECT_REVIEW.md` and the Cycle 3 state into `coordination/STATE.md`, on top of the Remediation Cycle 2 base `13bdf2a364a8210e1ae84997655168ea4cf505cd`.
- Read in full before any edit: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-014` Remediation Cycle 2 verification — `AS14-F001`–`F003` `RESOLVED`/`PRESERVED`, `AS14-F004` `PARTIALLY RESOLVED` with exactly two remaining sentences named, `AS14-F005` `RESOLVED`, `AS14-F006`–`F010` `PASS`/`PRESERVED`), `coordination/IMPLEMENTER_HANDOFF.md` (the prior Cycle 2 handoff, confirmed byte-identical to what this session last wrote — `git diff` against the previous commit returned empty), `docs/product/DATA_BACKEND_SPEC.md`.

## Exact Cycle 3 changed-file list — 3 files

- `docs/product/DATA_BACKEND_SPEC.md` (final `AS14-F004` corrections)
- `coordination/IMPLEMENTER_HANDOFF.md` (this file — this Cycle 3 section)
- `coordination/STATE.md`

No other file was modified. Confirmed by `git status --short` and `git diff --stat` showing exactly these 3 paths.

## Final `AS14-F004` disposition (Cycle 3) — RESOLVED

**Problem (Architect's Remediation Cycle 2 verification):** Cycle 2 correctly fixed the "Admin identity references" and "Authorization boundaries" sections, but an independent full-file sweep found two more stale current-state sentences elsewhere in `docs/product/DATA_BACKEND_SPEC.md`:

1. Under **"Rollback / data-loss considerations"**: `Until D1/R2 exist, none of the above risk controls can be implemented — they remain design intentions here, not evidenced mitigations.` — stale, since a local-only D1 revision substrate and several migration/integrity controls already exist under `WEB-INC-005`.
2. Under **"Migration considerations"**: `No migration is authorized or performed by this cycle. This section is a design constraint list for whichever future increment proposes the actual migration.` — stale as *current* state (though historically accurate for the Product Build Pack documentation cycle that originally wrote it), since `WEB-INC-005` has since implemented and locally exercised exactly this migration mechanism.

**Fix:**

- **Rollback/data-loss:** the blanket sentence is replaced with a four-way scoped breakdown: (A) local D1 controls — the local revision substrate, deterministic migration/seed, whole-run preflight, the all-or-nothing batched write phase, exact pointer/provenance repeat-run equivalence, schema/integrity constraints, and local parity/integrity evidence — all exist and are evidenced **at repository/local level only**, explicitly **not** called production-verified; (B) R2/media controls — `NOT IMPLEMENTED`, R2 does not exist; (C) remote/production D1 — `NOT IMPLEMENTED`, no remote resource, no production migration, no public cutover; (D) admin mutation/audit controls — `NOT IMPLEMENTED`, no mutation API, no publish/unpublish endpoint, no `audit_log`, no admin media workflow. The section closes with the invariant chain `LOCAL D1 EXISTS ≠ REMOTE/PRODUCTION D1 EXISTS ≠ PUBLIC CUTOVER COMPLETE ≠ ADMIN MUTATION/AUDIT CAPABILITY EXISTS`.
- **Migration considerations:** the single stale sentence is replaced with two sentences that preserve history rather than erase it: the first states plainly that *during the original Product Build Pack documentation cycle*, no migration was authorized or performed, and that this section was, at that time, a pure design constraint list — this historical fact is unchanged. The second adds the current fact: `WEB-INC-005` was *later* separately authorized (`ML-DEVOS-RFC-003 → ML-DEVOS-AS-013 → D-024`) and implemented and locally exercised this exact migration mechanism (`worker/d1/migrate.mjs`, tested by `tests/d1-migration.test.mjs`), and that this migration is **local/repository only** — no remote D1 migration, no production D1 migration, and no public read-path cutover has occurred; `data/site.js` remains the actual public source.

Neither correction claims a production migration is complete, nor that D1 is now the public source of truth — both explicitly state the opposite alongside the corrected "a local migration mechanism now exists" claim.

## Confirmation: `AS14-F005` remains `RESOLVED`

Not touched this cycle. The Remediation Cycle 1 exact-diff heading still reads 9 files (7 substantive + 2 coordination = 9 total), the historical 17→19 original-implementation correction is unchanged, and the Cycle 2 exact-diff heading still reads 3 files — all exactly as the Architect's Cycle 2 verification confirmed `RESOLVED`.

## Confirmation: `AS14-F001`–`F003` and `AS14-F006`–`F010` remain untouched this cycle

- `worker/d1/migrate.mjs`, `worker/d1/validate.mjs`, `tests/d1-migration.test.mjs`, `migrations/0001_web_inc_005_init.sql`, `worker/d1/repository.mjs`, `worker/d1/schema.mjs`, `scripts/d1-migrate.mjs`, `wrangler.jsonc` are all byte-identical to the Cycle 3 base (`git diff --stat` against every one of these paths returns empty) — so `AS14-F001` (whole-run atomicity), `AS14-F002` (exact pointer/provenance equivalence), `AS14-F003` (validator contract), `AS14-F006` (14-table inventory), `AS14-F007` (staged public path), `AS14-F008` (composite cross-entity pointer protection), `AS14-F009` (server-only boundary), and `AS14-F010` (local/remote configuration boundary) remain exactly as previously `RESOLVED`/`PASS`.
- `app/`, `components/`, `data/`, `lib/`, `public/`, `next.config.mjs`, `package.json`, `package-lock.json`, `worker/index.mjs`, `worker/auth.mjs`, `tests/content.test.mjs`, `tests/worker-auth.test.mjs`, `brain/RISK_REGISTER.md`, `docs/product/PRD.md`, `docs/product/BUILD_PLAN.md`, `docs/ARCHITECTURE.md`, `brain/IMPLEMENTATION_STATUS.md`, `brain/TEST_LEDGER.md` are likewise untouched this cycle — outside this cycle's 3-file authorized scope.

## Explicit confirmation: no runtime/data/test/config code changed

This cycle's diff is exactly 2 Markdown-prose corrections in `docs/product/DATA_BACKEND_SPEC.md` plus the normal 2 coordination-file updates (this file, `coordination/STATE.md`). No `.mjs`, `.sql`, `.jsonc`, or `.json` file was modified. No technical implementation was reopened. The prior Remediation Cycle 1 results — 76/76 tests passing, successful build — remain the current, unregressed state, since nothing this cycle touches test or build inputs.

## Explicit confirmation: no remote Cloudflare resource changed

No tool capable of any external operation was used this cycle — only Markdown edits, `git`, and read-only inspection commands. No `wrangler d1 create`, no remote D1 migration/query/mutation, no production Cloudflare Access configuration, no deployment. `wrangler.jsonc` was not touched (still no `database_id`, still `remote: false`). `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, and `MAIN_MERGE_AUTHORIZED` remain `NO`.

---

# Remediation Cycle 2 record (preserved)

## Remediation Cycle 2 objective

Resolve exactly the two remaining findings from the Architect's Remediation Cycle 1 verification: finish `docs/product/DATA_BACKEND_SPEC.md`'s current-state convergence (`AS14-F004`), and correct this handoff's Remediation Cycle 1 exact-diff count from 7 to 9 (`AS14-F005`). Narrow, documentation/provenance-only — no runtime, migration, validator, test, migration-SQL, or Wrangler-config file is touched.

## Remediation Cycle 2 branch / commit state

- Cycle 2 base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `13bdf2a364a8210e1ae84997655168ea4cf505cd`. This SHA carries the Architect's Remediation Cycle 1 verification (`ML-DEVOS-AS-014: CHANGES_REQUESTED — WEB-INC-005 REMEDIATION CYCLE 2`) into `coordination/ARCHITECT_REVIEW.md` and the Cycle 2 state into `coordination/STATE.md`, on top of the Remediation Cycle 1 base `cd2b854ffe5d2e5edbdc72bd383d5ba636b99ae2`.
- Read in full before any edit: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-014` Remediation Cycle 1 verification — findings `AS14-F001`–`F003` `RESOLVED`, `AS14-F004`/`F005` `PARTIALLY RESOLVED`, `AS14-F006`–`F010` `PASS`/preserved), `coordination/IMPLEMENTER_HANDOFF.md` (the prior Cycle 1 handoff, corrected in place below), `docs/product/DATA_BACKEND_SPEC.md`.

## Exact Cycle 2 changed-file list — 3 files

- `docs/product/DATA_BACKEND_SPEC.md` (`AS14-F004`)
- `coordination/IMPLEMENTER_HANDOFF.md` (this file — `AS14-F005`, plus this Cycle 2 section)
- `coordination/STATE.md`

No other file was modified. Confirmed by `git status --short` and `git diff --stat` showing exactly these 3 paths.

## `AS14-F004` disposition (Cycle 2) — RESOLVED

**Problem (Architect's Remediation Cycle 1 verification):** `docs/product/DATA_BACKEND_SPEC.md` had already been corrected at the headline level (three-way public/local-D1/remote-D1 storage-model distinction) in Remediation Cycle 1, but two subsections still carried stale pre-`WEB-INC-001` wording: "Admin identity references" said the authentication mechanism itself was `NOT IMPLEMENTED` (too broad — the boundary exists), and "Authorization boundaries" called the authentication/authorization boundary "currently nonexistent" and described the deployment as "static/asset-only," both stale since `WEB-INC-001`.

**Fix:**

- **"Admin identity references"** now states the `WEB-INC-001` Cloudflare Access JWT authentication boundary is `IMPLEMENTED` at repository level, and narrows the section's actual `NOT IMPLEMENTED` scope to exactly three things: a persistent admin identity/session representation, editorial identity binding for future writes (as distinct from `WEB-INC-005`'s migration-only textual provenance), and a production Cloudflare Access application. It explicitly states no persistent session or admin identity database exists.
- **"Authorization boundaries"** now opens by distinguishing two capabilities: the authentication boundary (`IMPLEMENTED` under `WEB-INC-001`) and the mutation/editorial authorization capability (`NOT IMPLEMENTED`, and not granted or substituted for by the authentication boundary existing). It restates the invariant `AUTH BOUNDARY EXISTS` + `LOCAL SERVER-SIDE D1 SUBSTRATE EXISTS` ≠ `PROTECTED D1 ADMIN READ ENDPOINT EXISTS`, and corrects the deployment/protected-read wording: the deployment is not globally asset-only (`/admin` has a selective Worker auth path); the `WEB-INC-005` local server-side D1 repository/data-access substrate exists; no authenticated D1 dashboard/protected editorial-read endpoint exists yet; `WEB-INC-002` still owns that capability; public rendering still reads only `data/site.js`; remote/production D1 does not exist.

Neither correction implies a mutation-authorization capability, a persistent identity/session store, or a protected D1 read endpoint exists — each explicitly states the opposite alongside the corrected "boundary exists" claim.

## `AS14-F005` disposition (Cycle 2) — RESOLVED

**Problem:** this handoff's "Exact Remediation Cycle 1 changed-file list" heading said **7** files, while the Architect's exact Git compare of the Remediation Cycle 1 commit (`cd2b854... → eb15913...`) found **9** changed paths. The list content itself already named all 9 paths (7 substantive + 2 coordination), so this was a count/label defect, not missing provenance.

**Fix:** the heading now reads "— 9 files," with an explicit correction note (see that section below) naming the original "7" as `ACTOR_REPORTED` and the corrected "9" as `INDEPENDENTLY_INSPECTED`, and a "7 substantive + 2 coordination = 9 total" breakdown. The already-correct historical provenance correction for the *original implementation* (17 reported by Builder → 19 found by Architect) is left completely untouched — this Cycle 2 fix only corrects the Remediation Cycle 1 count, not the original-implementation count, and does not alter that separate historical record.

## Confirmation: `AS14-F001`–`F003` and `AS14-F006`–`F010` not touched this cycle

- `worker/d1/migrate.mjs`, `worker/d1/validate.mjs`, `tests/d1-migration.test.mjs`, `migrations/0001_web_inc_005_init.sql`, `worker/d1/repository.mjs`, `worker/d1/schema.mjs`, `scripts/d1-migrate.mjs`, `wrangler.jsonc` are all byte-identical to the Cycle 2 base (`git diff --stat` against every one of these paths returns empty) — so the `AS14-F001` whole-run-atomicity fix, the `AS14-F002` exact-equivalence fix, the `AS14-F003` validator-contract fix, the `AS14-F006` 14-table inventory, the `AS14-F007` staged public path, the `AS14-F008` composite cross-entity pointer protection, the `AS14-F009` server-only boundary, and the `AS14-F010` local/remote configuration boundary are all unchanged from their already-`RESOLVED`/`PASS` Remediation Cycle 1 state.
- `app/`, `components/`, `data/`, `lib/`, `public/`, `next.config.mjs`, `package.json`, `package-lock.json`, `worker/index.mjs`, `worker/auth.mjs`, `tests/content.test.mjs`, `tests/worker-auth.test.mjs`, `brain/RISK_REGISTER.md`, `docs/product/BUILD_PLAN.md`, `docs/ARCHITECTURE.md`, `brain/IMPLEMENTATION_STATUS.md`, `docs/product/PRD.md`, `brain/TEST_LEDGER.md` are likewise untouched this cycle — outside this cycle's 3-file authorized scope and not needed to resolve `AS14-F004`/`F005`.

## Explicit confirmation: no runtime/data/test/config code changed

This cycle's diff is exactly 2 Markdown-prose corrections (`docs/product/DATA_BACKEND_SPEC.md`) plus the normal 2 coordination-file updates (this file, `coordination/STATE.md`). No `.mjs`, `.sql`, `.jsonc`, or `.json` file was modified. `npm test` and `npm run build` were not expected to change and were not re-run against new code (no code changed); the prior Remediation Cycle 1 results — 76/76 tests passing, successful build — remain the current, unregressed state, since nothing this cycle touches test or build inputs.

## Explicit confirmation: no remote Cloudflare resource changed

No tool capable of any external operation was used this cycle — only Markdown edits, `git`, and read-only inspection commands. No `wrangler d1 create`, no remote D1 migration/query/mutation, no production Cloudflare Access configuration, no deployment. `wrangler.jsonc` was not touched (still no `database_id`, still `remote: false`). `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, and `MAIN_MERGE_AUTHORIZED` remain `NO`.

---

# Remediation Cycle 1 record (preserved, with the `AS14-F005` count correction applied in place)

## Exact Remediation Cycle 1 changed-file list — 9 files

**Corrected in Remediation Cycle 2 (`AS14-F005`):** this heading originally read "Exact Remediation Cycle 1 changed-file list — 7 files." That count was wrong — it named all 9 paths in the list below, but the heading itself only counted the 7 substantive remediation files and undercounted the 2 coordination files that were part of the same remediation commit. The Architect's exact Git compare of `cd2b854ffe5d2e5edbdc72bd383d5ba636b99ae2 → eb159131e4712ede9e2cd8c385d3a9efeb1b0d9b` (`INDEPENDENTLY_INSPECTED`) reported **9** changed paths. The heading is corrected here, not silently rewritten: the Builder's original "7" was `ACTOR_REPORTED`; the corrected "9" is `INDEPENDENTLY_INSPECTED`, restated by the Builder in this correction rather than re-earning that evidence class on its own.

**7 substantive remediation paths:**

- `worker/d1/migrate.mjs` (`AS14-F001`, `AS14-F002`)
- `worker/d1/validate.mjs` (`AS14-F003`)
- `tests/d1-migration.test.mjs` (regression tests for `AS14-F001`/`F002`/`F003`)
- `brain/IMPLEMENTATION_STATUS.md` (`AS14-F004`)
- `docs/product/PRD.md` (`AS14-F004`)
- `docs/product/DATA_BACKEND_SPEC.md` (`AS14-F004`)
- `brain/TEST_LEDGER.md` (record the new tests/evidence — not itself a cited finding, but required to keep the test ledger truthful about what now exists)

**+ 2 coordination paths:**

- `coordination/IMPLEMENTER_HANDOFF.md` (this file, `AS14-F005`)
- `coordination/STATE.md`

**= 9 total changed paths.** This is the same 9-path list `ML-DEVOS-AS-014`'s Remediation Cycle 2 review independently verified — no path is added or removed by this correction, only the heading's count and the explicit substantive/coordination breakdown.

This is separate from, and does not alter, the **historical** provenance correction already recorded for the *original* WEB-INC-005 implementation (not this remediation): the Builder originally reported **17** files for implementation commit `e0304a89ddfb5595866f1990cd9fca161e78ae2b`; the Architect's exact Git compare found **19**. That correction (see `AS14-F005` disposition below) stands exactly as previously recorded.

**Not touched, exactly as the Architect's authorized scope allows but does not require:** `migrations/0001_web_inc_005_init.sql`, `worker/d1/repository.mjs`, `worker/d1/schema.mjs`, `scripts/d1-migrate.mjs`, `wrangler.jsonc`, `brain/RISK_REGISTER.md`, `docs/product/BUILD_PLAN.md`, `docs/ARCHITECTURE.md`. None of these needed a change to resolve `AS14-F001`–`F005`: the composite foreign-key design and table set already satisfied the integrity findings, and no additional current-state contradiction was found in the untouched governance/architecture docs. **Not touched, as required:** `app/`, `components/`, `data/`, `lib/`, `public/`, `next.config.mjs`, `package.json`, `package-lock.json`, `worker/index.mjs`, `worker/auth.mjs`, `tests/content.test.mjs`, `tests/worker-auth.test.mjs`. Confirmed by `git diff --stat` against every path in both lists returning empty except the 9 files above.

## `AS14-F001` disposition — RESOLVED

**Problem:** `migrateCurrentContent()` committed one `db.batch()` per entity, so a conflict discovered late in processing order could leave earlier entities already written.

**Fix:** `worker/d1/migrate.mjs` is restructured into two phases:

1. **Preflight** (`planEntity`, read-only): for every entity — `site_settings`, then each `navigation`/`foundations`/`projects`/`services`/`process_steps` item, then each bootstrap section — decide `create` / `noop` / `refuse` purely from `SELECT`s. For a `create` decision, the statement set is *built* (`buildCreateStatements`) but not executed. No `INSERT`/`UPDATE` runs during this phase.
2. **Decide-then-write**: after every entity has a decision, if **any** decision is `refuse`, `migrateCurrentContent` throws immediately, before the write phase ever starts — so a refusal discovered on the very last entity processed still leaves zero writes from every entity processed before it. Only if there are zero refusals does the write phase run, and it runs as **one single `db.batch()` call** containing every `create` entity's statements together — the entire write phase is one D1 transaction, genuinely all-or-nothing.

**Regression test added:** "a late-processing conflicting entity causes zero partial writes across the whole migration run" (`tests/d1-migration.test.mjs`) — pre-inserts a conflicting `process_steps` row (the *last* collection `migrateCurrentContent` processes) with content that will not match the fixture, then runs the full migration and asserts: the run throws `/migration refusal/`; `dumpAllRows` before and after are byte-identical; and, specifically, `site_settings`/`navigation`/`foundations`/`projects`/`services`/`sections` all have **zero** rows after the failed run (they would all have succeeded under the old per-entity-batch design, since none of them conflict).

**Additional manual verification (not an automated test, recorded as evidence):** a standalone probe issued one `db.batch()` containing a valid `INSERT` followed by a `UNIQUE`-violating `INSERT`; the batch threw and a subsequent `SELECT` returned zero rows — confirming D1's local `batch()` is a genuine transaction, which is the mechanism the write phase now relies on for atomicity independent of what preflight itself can foresee (see `brain/TEST_LEDGER.md` § "`WEB-INC-005` Remediation Cycle 1 command evidence").

## `AS14-F002` disposition — RESOLVED

**Problem:** the no-op check used `Boolean(existingEntity.published_revision_id) === intendedPublished` — pointer *truthiness*, not pointer *identity* — so an entity repointed at a different same-entity revision (or with corrupted provenance) could be silently reported `noop`.

**Fix:** `planEntity`'s equivalence check now requires, for a `noop` decision:

- **Exact pointer identity**: for `published`/`draft` state, the corresponding pointer column must equal `existingRevision.id` (the fetched revision-1 row's own id) exactly, and the *other* pointer column must be exactly `null`. For `archived`, both pointer columns must be exactly `null`.
- **Exact immutable provenance**: `existingEntity.created_at === createdAt`, `existingRevision.created_at === createdAt`, and `existingRevision.created_by === createdBy` — all three must match byte-for-byte.
- **Exact content**: unchanged from before — every revision column matches (normalizing only JS-boolean-vs-SQLite-integer representation).

Any mismatch in any of these — content, pointer identity, or provenance — is a `refuse`, not a `noop`.

**Regression tests added:**

- "migration refuses (rather than reporting noop) when a pointer targets a different same-entity revision" — creates a content-identical revision 2 for an already-migrated entity, repoints `published_revision_id` at it (leaving revision 1 intact and content-matching), and asserts the rerun throws rather than reporting `noop`.
- "migration refuses when existing creation provenance/metadata has been altered" — mutates an existing revision's `created_by` to a non-provenance value and asserts the rerun throws.

The pre-existing "second migration run of unchanged content is a deterministic no-op" test continues to pass under the new, stricter equivalence check (verified — see test results below), since a genuinely unchanged run satisfies content, pointer, and provenance equivalence simultaneously.

## `AS14-F003` disposition — RESOLVED

**Problem:** `worker/d1/validate.mjs` claimed to mirror `lib/content/schema.mjs` but diverged on four points.

**Fix**, each corrected to the exact legacy predicate:

| Constraint | Before | After |
|---|---|---|
| `order` range | safe integer `>= 0`, no upper bound | safe integer in `[0, 10000]`, matching `lib/content/schema.mjs`'s `record.order` |
| `icon` | arbitrary text up to 40 chars | closed enum `foundation, experience, systems, security, automation, lab, contact, arrow`, matching `lib/content/schema.mjs`'s `icon` choice |
| `updatedAt` | regex-shaped + `Number.isFinite(Date.parse(v))` (accepts `2026-02-30`, silently normalized) | added the exact legacy round-trip check `new Date(value).toISOString().slice(0, 10) === value`, which rejects any date `Date`'s normalization would silently correct |
| project `stack` capacity | narrowed to 20 entries | restored to 100 entries, matching `lib/content/schema.mjs`'s generic array-field cap (no per-field override exists for `stack` in the legacy schema) |

The shared `order`/`icon`/`isoDate` predicates are now defined once in `worker/d1/validate.mjs` and reused by every per-revision validator that has that field, so there is a single point of truth for each boundary rather than one inline predicate per call site.

**No change was made to the actual migrated content** — `data/site.js`'s real values were already legacy-valid (orders ≤ 10000, valid icons, a valid `updatedAt`, stacks well under 100 entries), so this correction only tightens the D1 validator itself; the fresh-migration and parity tests continue to pass unchanged.

**Regression tests added** (all in `tests/d1-migration.test.mjs`): order `10000` accepted / `10001` rejected (both via the raw predicate and via `validateNavigationRevisionContent`); a valid icon accepted / an unknown icon rejected (both via the raw predicate and via `validateFoundationRevisionContent`); `2026-02-28` accepted / `2026-02-30` rejected (via the raw `isoDate` predicate); a 100-entry stack accepted / a 101-entry stack rejected (via `validateStack`).

## `AS14-F004` disposition — RESOLVED

Converged three current-state documentation surfaces on the three-way distinction the Architect specified (public source / local D1 substrate / remote D1):

- **`brain/IMPLEMENTATION_STATUS.md`**: the `Admin portal (/admin)` row no longer says "No route under `app/`" — it now states the `WEB-INC-001` auth-only placeholder exists, with content-editing/mutation still `NOT STARTED`. The `Authentication` row no longer says "No auth library..." — it now states the `WEB-INC-001` server-side JWT boundary is `IMPLEMENTED` at repository level, not production-verified. The D1 substrate row's test count was refreshed to 19/19. The "Explicit non-claims" bullet no longer implies authentication/admin-placeholder don't exist.
- **`docs/product/PRD.md`**: the "Current vs. target state" table's `Admin surface`/`Authentication` rows were split from a flat `NOT IMPLEMENTED` into "auth-only placeholder / authentication `CURRENTLY IMPLEMENTED`" vs. "content-editing/design-control surface `PROPOSED TARGET`". The requirements narrative was corrected: `ADM-REQ-001` and `WEB-SEC-001`/`002`/`011` are now stated as `IMPLEMENTED` per `WEB-INC-001` (matching `brain/GOVERNANCE_MAP.md`'s own already-correct per-requirement breakout), while the remaining `ADM-REQ-*`/`WEB-SEC-*` IDs remain explicitly `NOT STARTED`.
- **`docs/product/DATA_BACKEND_SPEC.md`**: the `## Current storage model — CURRENTLY IMPLEMENTED` section no longer says "There is no database, no D1... today." It now states the three-way model explicitly: (1) public authoritative source = `data/site.js`, unchanged; (2) local/repository D1 substrate = `IMPLEMENTED` under `WEB-INC-005`; (3) remote/production D1 = does not exist, not authorized. The no-cutover invariant (`D1 EXISTS LOCALLY ≠ D1 IS PUBLIC SOURCE`) is restated explicitly in the same section.

No document was made to overclaim a full admin portal or a production D1 resource — every correction states the auth-only/local-only boundary explicitly alongside the corrected "exists" claim.

## `AS14-F005` disposition — RESOLVED

**Builder initially reported:** "Exact changed-file list — 17 files" in the original `coordination/IMPLEMENTER_HANDOFF.md`.

**Architect exact Git compare (`INDEPENDENTLY_INSPECTED`) found:** the implementation commit `7122c9d9887e5801a9c3ec03285db7273f1529c8 → e0304a89ddfb5595866f1990cd9fca161e78ae2b` changed exactly **19** files — the Builder's 17 substantive implementation/config/documentation paths were correctly identified, but the list omitted `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`, which were also part of that same implementation commit.

**The durable record is now corrected, not silently rewritten:** this paragraph states plainly that the original count was wrong and by how much, rather than quietly presenting 19 as if it had always been reported. For the historical record:

- Implementation commit `e0304a89ddfb5595866f1990cd9fca161e78ae2b` (base `7122c9d9887e5801a9c3ec03285db7273f1529c8`): **19 changed paths** — the 17 substantive paths the original handoff listed, **plus** `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`.
- Bookkeeping commit `4e5d631f88cadb7166c73efb8dec9481f3bde219` (on top of `e0304a8...`): **2 changed paths** — `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md` again, this time to record the implementation SHA into both files (a commit cannot self-reference its own hash, which is why this second commit existed at all).
- Full base-to-that-point sequence: **19 unique changed paths across 2 commits** — exactly what `ML-DEVOS-AS-014` independently found.

**Evidence classes, preserved distinctly:** the original "17 files" count was `ACTOR_REPORTED` (Builder self-report, not independently checked at the time); the corrected "19 files" figure is `INDEPENDENTLY_INSPECTED` (the Architect's own exact Git compare). This handoff does not upgrade its own restatement of "19" to `INDEPENDENTLY_INSPECTED` merely by repeating it — that evidence class belongs to the Architect's inspection, not to the Builder correcting its own prior report.

## Preserved-pass findings — not regressed

- **`AS14-F006`** (exactly 14 product tables): unchanged; re-verified this cycle (`npx wrangler d1 execute DB --local` table inventory, `tests/d1-migration.test.mjs` "schema migration creates exactly the 14 authorized tables" — still passing).
- **`AS14-F007`** (staged public path): `app/page.js`, `lib/content/local.mjs`, `lib/content/public.mjs`, `lib/content/schema.mjs`, `data/site.js` remain outside this remediation's diff (confirmed by the empty `git diff --stat` above).
- **`AS14-F008`** (composite cross-entity pointer protection): `migrations/0001_web_inc_005_init.sql` was not modified; the composite foreign keys are unchanged; the cross-entity-rejection test still passes.
- **`AS14-F009`** (server-only boundary): `worker/d1/repository.mjs` was not modified; no import of `worker/d1/*` exists in `app/`, `worker/index.mjs`, or any client path.
- **`AS14-F010`** (local/remote boundary): `wrangler.jsonc` was not modified — no `database_id`, `remote: false` unchanged; `scripts/d1-migrate.mjs`/`tests/d1-migration.test.mjs` continue to call `getPlatformProxy({ remoteBindings: false })`.

## Test results

`npm test`: **76 passed, 0 failed** — 27 `tests/content.test.mjs` (unchanged) + 30 `tests/worker-auth.test.mjs` (unchanged) + 19 `tests/d1-migration.test.mjs` (the 12 from the original implementation, all still passing under the new stricter logic, plus 7 new: 1 for `AS14-F001`, 2 for `AS14-F002`, 4 for `AS14-F003`).

`npm run build`: succeeded, same three routes (`/`, `/_not-found`, `/admin`) as before this remediation.

## Local D1 command log (this remediation cycle)

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `cd2b854...` before any file was touched |
| `node scripts/d1-migrate.mjs` (fresh local state) | 23 created, 0 no-op |
| `node scripts/d1-migrate.mjs` (second run) | 0 created, 23 no-op — under the new exact-equivalence check |
| `npx wrangler deploy --dry-run` | Succeeded; same bindings; no external resource created/modified |
| `npx wrangler d1 migrations apply DB --local` (fresh local database) | `Resource location: local`; 16 commands executed; `✅` |
| `npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master ..."` | Exactly the 14 authorized tables + `d1_migrations`/`_cf_METADATA`/`sqlite_sequence` |
| Manual probe: one `db.batch()` with a valid insert then a `UNIQUE` violation | Batch threw; zero rows persisted — confirms transactional write-phase fallback |
| Secret/config scan | No matches beyond explanatory comments; no `.env*`; no `database_id` |

Every command above is `--local` or non-mutating; none used `--remote`. Full detail recorded in `brain/TEST_LEDGER.md` § "`WEB-INC-005` Remediation Cycle 1 command evidence."

## Known limitations (carried forward, unchanged by this remediation)

- This remains a local-only revision substrate; Miniflare's local D1 simulation is not a guarantee of exact production D1 edge behavior.
- The real `data/site.js` content is entirely `published`, so state-mapping/no-op-equivalence tests still rely on constructed fixtures for the draft/archived/repointed/corrupted-provenance branches.
- No admin/mutation code calls `worker/d1/*` yet (by design — reserved for `WEB-INC-002`/`WEB-INC-003`).
- This evidence remains `ACTOR_REPORTED` until independently reproduced or inspected.

## Explicit confirmations

- **No remote Cloudflare D1 resource was created or modified.** No `wrangler d1 create`; every D1 command is `--local` or non-mutating; `wrangler.jsonc` unchanged (`remote: false`, no `database_id`).
- **Public rendering still reads `data/site.js`.** `app/page.js`/`lib/content/local.mjs`/`lib/content/public.mjs`/`lib/content/schema.mjs`/`data/site.js` are byte-identical to the remediation base; `npm run build` output unchanged.
- **No later `WEB-INC-*` work began.** No dashboard, mutation endpoint, media/R2, journal, theme, or audit-log code exists anywhere in this diff.
- **`REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.

## Commit (Remediation Cycle 1)

Files above are committed to `governance/maisoglabs-v0.1` (and mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`) as commit `eb159131e4712ede9e2cd8c385d3a9efeb1b0d9b` on top of remediation base `cd2b854ffe5d2e5edbdc72bd383d5ba636b99ae2` — also recorded in `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA`. A second, immediately following documentation-only commit records this exact SHA into both files (a commit cannot self-reference its own hash).

---

## Commit (Remediation Cycle 2)

The 3 Cycle 2 files above are committed to `governance/maisoglabs-v0.1` (and mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`) as commit `84014db2c13c170ce14fbf1a55fa17b407947d3b` on top of Cycle 2 base `13bdf2a364a8210e1ae84997655168ea4cf505cd` — also recorded in `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA`. A second, immediately following documentation-only commit records this exact SHA into both files (a commit cannot self-reference its own hash), consistent with the Cycle 1 pattern above.

---

## Commit (Remediation Cycle 3, FINAL)

The 3 Cycle 3 files above are committed to `governance/maisoglabs-v0.1` (and mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`) as commit `03ab9d896bd0169cbcfb3e4aa62aa83ec9adf72f` on top of Cycle 3 base `c32dd2c034d0c372de532963fc6f3629f33d2c6c` — also recorded in `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA`. A second, immediately following documentation-only commit records this exact SHA into both files (a commit cannot self-reference its own hash), consistent with the Cycle 1/Cycle 2 pattern above. This is the final Builder handoff for `WEB-INC-005` under `MAX_REMEDIATION_CYCLES: 3`; the Architect will perform the final closure review.
