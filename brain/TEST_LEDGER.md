# Test Ledger

Seeded from `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §18. Status values: `REQUIRED`, `NOT IMPLEMENTED`, `PASS`, `FAIL`, `BLOCKED`.

## Evidence-class rule

Every result below is labeled with exactly one evidence class. Never upgrade a class silently:

- **Implementer-reported** — Claude ran the command and reports the output. Not yet independently checked.
- **Architect-reproduced** — the Architect independently ran or inspected the same evidence.
- **Production/runtime evidence** — observed from the actual deployed system.

As of this Phase 1 cycle, no ledger entry has Architect-reproduced or production/runtime evidence; the Architect's Phase 0 review explicitly recorded the Phase 0 test/build claims as "implementer-reported... not independently reproduced" (`coordination/ARCHITECT_REVIEW.md`). This ledger preserves that distinction rather than upgrading it.

## Existing tests (already present in the repository)

| Test | Covers | Result | Evidence class |
|---|---|---|---|
| `tests/content.test.mjs` — "local source validates and adapter returns independent data" | `getPublicContent()` returns an independent copy | Implementer-reported PASS (part of 27/27) | Implementer-reported |
| `tests/content.test.mjs` — "all record collections filter drafts and archives before serialization" | Draft/archived filtering across all record collections | Implementer-reported PASS | Implementer-reported |
| `tests/content.test.mjs` — "stable ordering and empty collections" | Deterministic ordering; empty-collection handling | Implementer-reported PASS | Implementer-reported |
| `tests/content.test.mjs` — 22 × "rejects `<case>`" | Schema rejection of unknown fields, unsafe links/HTML, duplicate/reserved slugs, malformed email/date/URL, wrong types, etc. | Implementer-reported PASS (all 22) | Implementer-reported |
| `tests/content.test.mjs` — "unpublished root cannot produce a public build" | Root `meta.state` gating of the entire public build | Implementer-reported PASS | Implementer-reported |
| `tests/worker-auth.test.mjs` — `isProtectedPath` matching (7 assertions) | Only `/admin`/`/admin/*` are treated as protected | Implementer-reported PASS | Implementer-reported |
| `tests/worker-auth.test.mjs` — `verifyAccessAssertion` negative paths (missing/malformed/expired/not-yet-valid/wrong-audience/wrong-issuer/untrusted-key, 7 tests) | Fail-closed JWT verification | Implementer-reported PASS (all 7) | Implementer-reported |
| `tests/worker-auth.test.mjs` — `verifyAccessAssertion` accepts a correctly signed token | Valid deterministic test-token acceptance | Implementer-reported PASS | Implementer-reported |
| `tests/worker-auth.test.mjs` — `handleRequest` routing/rejection (8 tests: public routes asset-first with/without a token, protected-path rejection for no/malformed/expired/wrong-audience token, protected-path acceptance for a valid token) | End-to-end request handling for `WEB-INC-001` | Implementer-reported PASS (all 8) | Implementer-reported |
| `tests/worker-auth.test.mjs` — `isValidTeamDomain`/`isValidAudience`/`isValidAuthConfig` unit tests (5 tests) | Config values themselves are rejected when missing/blank/placeholder/malformed (`ML-DEVOS-AS-012` `AS12-F001`) | Implementer-reported PASS (all 5) | Implementer-reported |
| `tests/worker-auth.test.mjs` — `handleRequest` config-failure cases (9 tests: 4 bad team-domain forms, 3 bad audience forms, a valid token against invalid config, and a spy proving `getJWKS` is never called) | Auth configuration itself fails closed, with no JWKS/network lookup attempted when invalid (`AS12-F001`) | Implementer-reported PASS (all 9) | Implementer-reported |
| `tests/d1-migration.test.mjs` — "schema migration creates exactly the 14 authorized tables" | Table-inventory proof (`AS13-F002`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "fresh migration of real siteContent achieves deep parity with `projectPublishedContent(siteContent)`" | Deep semantic parity across every current domain, including `services` (`AS13-F010`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "sections substrate is bootstrapped separately and is not part of the legacy parity projection" | Sections isolation from the legacy parity shape (`AS13-F005`, `AS13-F010`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "second migration run of unchanged content is a deterministic no-op" | Repeat-run determinism, no duplicate revisions/pointer drift (`AS13-F009`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "migration refuses to overwrite an entity whose stored content differs ... with no partial write" | Explicit safe-refusal path, no partial write (`AS13-F009`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "published/draft/archived source fixtures map to the correct pointer state" | Published/draft/archived pointer-mapping fixtures (`AS13-F011`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "a draft reorder does not affect the published projection/order" | Draft/published isolation under reorder (`AS13-F011`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "a base-entity pointer cannot successfully reference another entity's revision" | Cross-entity pointer rejection (`AS13-F003`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "project slug uniqueness is enforced" | Slug uniqueness (`AS13-F011`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "reserved project slugs are rejected at the database layer and by the JS validator" | Reserved-slug enforcement, DB + JS layer (`AS13-F011`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "revision-number uniqueness per entity is enforced" | Revision-number uniqueness (`AS13-F011`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "a revision row cannot reference a non-existent base entity" | Foreign-key/integrity failure handling (RFC-003 §13) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "a late-processing conflicting entity causes zero partial writes across the whole migration run" | Whole-run migration atomicity: a conflict discovered late (process steps, the last collection processed) leaves zero rows from every earlier entity (`AS14-F001`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "migration refuses (rather than reporting noop) when a pointer targets a different same-entity revision" | Exact pointer-identity no-op equivalence, not mere truthiness (`AS14-F002`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "migration refuses when existing creation provenance/metadata has been altered" | Immutable creation metadata (`created_at`/`created_by`) is part of no-op equivalence (`AS14-F002`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "D1 validator order boundary matches the current content contract exactly: 0..10000" | D1 validator/legacy `lib/content/schema.mjs` contract convergence (`AS14-F003`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "D1 validator icon enum matches the current content contract exactly" | D1 validator/legacy contract convergence (`AS14-F003`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "D1 validator date validity matches the current content contract exactly, rejecting impossible calendar dates" | D1 validator/legacy contract convergence (`AS14-F003`) | Implementer-reported PASS | Implementer-reported |
| `tests/d1-migration.test.mjs` — "D1 validator project stack capacity matches the current content contract exactly: up to 100 entries" | D1 validator/legacy contract convergence (`AS14-F003`) | Implementer-reported PASS | Implementer-reported |

Command: `npm test` (`node --test tests/*.test.mjs`). Result recorded in Phase 0 (`# pass 27, # fail 0`); re-run for Phase 1 with the same result; re-run for `WEB-INC-001` with `tests/worker-auth.test.mjs` added (`# pass 43`); re-run for `WEB-INC-001` Remediation Cycle 1 with 14 new config-validation tests added — `# pass 57, # fail 0` (27 existing `content.test.mjs` + 30 `worker-auth.test.mjs`) — see "`WEB-INC-001` Remediation Cycle 1 command evidence" below; re-run for `WEB-INC-005` with `tests/d1-migration.test.mjs` added — `# pass 69, # fail 0` (27 `content.test.mjs` + 30 `worker-auth.test.mjs` + 12 `d1-migration.test.mjs`) — see "`WEB-INC-005` command evidence" below; re-run for `WEB-INC-005` Remediation Cycle 1 (`ML-DEVOS-AS-014`) with 7 new tests added — `# pass 76, # fail 0` (27 `content.test.mjs` + 30 `worker-auth.test.mjs` + 19 `d1-migration.test.mjs`) — see "`WEB-INC-005` Remediation Cycle 1 command evidence" below.

## Plan-defined test IDs — current status

| ID | Description | Status | Notes |
|---|---|---|---|
| TEST-WEB-001 | Production homepage availability | `NOT IMPLEMENTED` | No automated check; no production access from this session |
| TEST-WEB-002 | Desktop rendering | `NOT IMPLEMENTED` | No automated visual test; `docs/CHANGE_LEDGER.md` records past manual QA only |
| TEST-WEB-003 | Mobile rendering | `NOT IMPLEMENTED` | Same as above |
| TEST-WEB-004 | Build succeeds | `PASS` | Implementer-reported: `npm run build` succeeded this cycle (Turbopack, static export to `out/`); re-run for `WEB-INC-001` — now emits `/`, `/_not-found`, and `/admin` (`out/admin.html`) |
| TEST-WEB-005 | Existing projects remain intact | `PASS` (indirect) | Implementer-reported: `data/site.js` unchanged this cycle; `tests/content.test.mjs` project-related assertions pass |
| TEST-ADM-001 | Unauthorized user cannot access admin | `PASS` | `WEB-INC-001` + Remediation Cycle 1: `tests/worker-auth.test.mjs` covers missing/malformed/expired/wrong-audience tokens against `/admin`, plus missing/blank/placeholder/malformed auth configuration itself (`AS12-F001`); local `wrangler dev` smoke test: `GET /admin` (no token) → `401`, `GET /admin` (garbage token) → `401`, `GET /admin.html` (no token) → `307` redirect to `/admin` with an empty body, followed → `401`, `GET /admin/index.html` (no token) → `401` (`AS12-F003`). Implementer-reported; not yet Architect-reproduced |
| TEST-ADM-002 | Authorized admin can access admin | `PASS` | `WEB-INC-001`: `tests/worker-auth.test.mjs` "handleRequest allows a correctly signed token to reach the admin asset" using a deterministic test key/JWKS (never a production credential). Implementer-reported; not yet Architect-reproduced |
| TEST-ADM-003 | Content write persists | `NOT IMPLEMENTED` | No write path exists |
| TEST-ADM-004 | Project CRUD/publish works | `NOT IMPLEMENTED` | No admin CRUD exists |
| TEST-ADM-005 | Journal CRUD/publish works | `NOT IMPLEMENTED` | No Journal feature exists at all |
| TEST-ADM-006 | Invalid content is rejected (at the Admin write boundary) | `NOT IMPLEMENTED` | No Admin surface or write API exists, so `TEST-ADM-006` itself cannot be exercised and must not be marked `PASS` under that ID (Architect finding F1-004). The existing build-time content-schema rejection (`lib/content/schema.mjs` + `tests/content.test.mjs`, 22 "rejects ..." cases, listed under "Existing tests" above) is real, passing, and separately evidenced — but it is content-layer/build-time validation, not the future Admin/write-API validation this test ID describes. `TEST-ADM-006` stays `NOT IMPLEMENTED` until that Admin/write boundary exists and is actually tested. |
| TEST-ADM-007 | Failed write does not report success | `NOT IMPLEMENTED` | No write path exists |
| TEST-ADM-008 | Media upload validation works | `NOT IMPLEMENTED` | No upload path exists |
| TEST-ADM-009 | Theme settings remain within allowed values | `NOT IMPLEMENTED` | No theme-settings feature exists |
| TEST-ADM-010 | Public users cannot perform admin mutations | `NOT IMPLEMENTED` | No mutation endpoint exists to attempt |
| TEST-DATA-001 | Existing static content migration preserves data | `PASS` (local-only substrate) | `WEB-INC-005`: `tests/d1-migration.test.mjs` "fresh migration ... achieves deep parity with `projectPublishedContent(siteContent)`" — deep-equal across every domain including `services`. This is a local D1 revision-substrate migration, not yet the public system's cutover migration; the risk this test ID tracks (`RISK-WEB-015`) remains `MITIGATED`, not `VERIFIED`, until Architect-reproduced |
| TEST-DATA-002 | Draft content remains unpublished | `PASS` | Implementer-reported: covered by "all record collections filter drafts and archives before serialization" and "unpublished root cannot produce a public build" |
| TEST-DEP-001 | Deployment succeeds | `NOT IMPLEMENTED` | No deployment was performed or authorized this cycle |
| TEST-DEP-002 | Production verification succeeds after deployment | `NOT IMPLEMENTED` | Same reason |

## Phase 1 command evidence (implementer-reported)

| Command | Result |
|---|---|
| `npm test` | 27 passed, 0 failed (re-run this cycle; identical to Phase 0 result) |
| `npm run build` | Succeeded; static pages generated for `/` and `/_not-found`; `out/` populated |
| `npm audit` | 0 vulnerabilities |
| `git status --short` after the above | Only `package-lock.json` metadata churn from `npm install`, reverted with `git checkout -- package-lock.json` before committing, matching the Phase 0 handling |

## `WEB-INC-001` command evidence (implementer-reported)

| Command | Result |
|---|---|
| `npm test` | 43 passed, 0 failed (27 existing `content.test.mjs` + 16 new `worker-auth.test.mjs`) |
| `npm run build` | Succeeded; static pages generated for `/`, `/_not-found`, `/admin`; `out/` populated including `out/admin.html` |
| `npx wrangler deploy --dry-run` | Succeeded; confirms `wrangler.jsonc`, `worker/index.mjs` (importing `jose`), and the Assets binding all parse/bundle correctly; no external Cloudflare resource created or modified |
| `wrangler dev` (local, background) + `curl` | `GET /` → `200` (unauthenticated, public homepage content present); `GET /nope` → `404`; `GET /admin` (no token) → `401 Unauthorized`; `GET /admin` (`Cf-Access-Jwt-Assertion: garbage`) → `401 Unauthorized` |
| Secret scan | `grep` for `process.env`, PEM/private-key markers, and secret/credential keyword patterns across `worker/`, `app/admin/`, `wrangler.jsonc`, `tests/worker-auth.test.mjs`; `find` for `.env*` files — no matches beyond explanatory comments stating that no secret exists |

## `WEB-INC-001` Remediation Cycle 1 command evidence (implementer-reported, `ML-DEVOS-AS-012`)

| Command | Result |
|---|---|
| `npm test` | 57 passed, 0 failed (27 existing `content.test.mjs` + 30 `worker-auth.test.mjs`, 14 of them new config-fail-closed tests for `AS12-F001`) |
| `npm run build` | Succeeded, unchanged routes (`/`, `/_not-found`, `/admin`) |
| `npx wrangler deploy --dry-run` | Succeeded with `wrangler.jsonc`'s new `assets.html_handling: "auto-trailing-slash"` pin added (`AS12-F003`); confirms config/bundle validity, no external Cloudflare resource created or modified |
| `wrangler dev` (local) + `curl` — canonical/public paths | `GET /` → `200` (unchanged); `GET /nope` → `404` (unchanged); `GET /admin` → `401` (no token); `GET /admin/` → `401` (no token) |
| `wrangler dev` (local) + `curl` — alternate admin URL forms (`AS12-F003`) | `GET /admin.html` (no token, no redirect follow) → `307 Temporary Redirect`, `Location: /admin`, **empty response body** (no admin content leaked); `GET /admin.html` (`-L`, following the redirect) → final response `401 Unauthorized` at `/admin`; `GET /admin.html` with a garbage `Cf-Access-Jwt-Assertion` header → still `307` with an empty body (config/token state cannot change the redirect-only behavior of a file-style URL); `GET /admin/index.html` (no token) → `401` directly |
| Secret scan (re-run) | `grep` for `process.env`, PEM/private-key markers, secret/credential keyword patterns across `worker/`, `wrangler.jsonc`, `tests/worker-auth.test.mjs` — no matches beyond explanatory comments |

This local `wrangler dev` evidence (both cycles) is still implementer-reported and local-only — it is not production/runtime evidence, since no production Cloudflare Access application or deployment exists (`ML-DEVOS-AS-011` `AS11-F006`). The `/admin.html` redirect-then-401 behavior is Wrangler's local Static Assets simulation of `html_handling`, not a guarantee of the exact production edge behavior — it is the best deterministic evidence available without a production deployment, and the Architect's independent review of the pinned config/Cloudflare documentation is required before any stronger claim.

## `WEB-INC-005` command evidence (implementer-reported, `ML-DEVOS-AS-013`)

| Command | Result |
|---|---|
| `npm test` | 69 passed, 0 failed (27 `content.test.mjs` + 30 `worker-auth.test.mjs`, both unchanged and still passing, + 12 new `d1-migration.test.mjs`) |
| `npm run build` | Succeeded, unchanged routes (`/`, `/_not-found`, `/admin`) — confirms `app/page.js`/`lib/content/local.mjs` are unmodified and unaffected |
| `node scripts/d1-migrate.mjs` (fresh local D1 state) | 23 entities created, 0 no-op; exactly the 14 authorized product tables reported present |
| `node scripts/d1-migrate.mjs` (second run, same local D1 state) | 0 entities created, 23 no-op — deterministic repeat-run confirmed (`AS13-F009`) |
| `npx wrangler d1 migrations list DB --local` | `Resource location: local`; lists `0001_web_inc_005_init.sql` as pending — confirms the CLI targets the local database only |
| `npx wrangler d1 migrations apply DB --local` | `Resource location: local`; "16 commands executed successfully"; migration applied and recorded `✅` — no `--remote` flag used |
| `npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' ..."` | Returned exactly the 14 authorized tables plus Wrangler's own `d1_migrations` bookkeeping table and SQLite/D1-internal `_cf_METADATA`/`sqlite_sequence` (excluded from the product-table count by convention, same filter `worker/d1/schema.mjs`'s `listProductTables` applies) |
| `npx wrangler deploy --dry-run` | Succeeded; confirms `wrangler.jsonc`'s new `d1_databases` binding (`env.DB`, database `maisog-labs-web-inc-005-local`, no `database_id`) parses/bundles correctly alongside the existing Assets/`ACCESS_*` bindings; "--dry-run: exiting now." — no external Cloudflare resource created or modified |
| Secret/config scan | `grep` for `process.env`, PEM/private-key markers, and secret/credential/token/account-id keyword patterns across `worker/`, `migrations/`, `scripts/`, `tests/worker-auth.test.mjs`, `tests/d1-migration.test.mjs`, `wrangler.jsonc` — no matches beyond explanatory comments and an unrelated `url.password` property-name check; no `.env*` files found; no `database_id` present in `wrangler.jsonc` |

Every D1 CLI command above used `--local` explicitly, or (for `wrangler deploy --dry-run`) performed no resource mutation at all; none used `--remote`, and `wrangler.jsonc`'s D1 binding carries no `database_id` and `remote: false`, so there is no configuration path by which any of these commands could have reached a real Cloudflare D1 resource. This local `wrangler`/D1 evidence, like the `WEB-INC-001` `wrangler dev` evidence above, remains implementer-reported until the Architect independently reproduces or inspects it.

## `WEB-INC-005` Remediation Cycle 1 command evidence (implementer-reported, `ML-DEVOS-AS-014`)

| Command | Result |
|---|---|
| `npm test` | 76 passed, 0 failed (27 `content.test.mjs` + 30 `worker-auth.test.mjs`, both unchanged and still passing, + 19 `d1-migration.test.mjs` — 12 preserved + 7 new for `AS14-F001`/`F002`/`F003`) |
| `npm run build` | Succeeded, unchanged routes (`/`, `/_not-found`, `/admin`) |
| `node scripts/d1-migrate.mjs` (fresh local D1 state) | 23 entities created, 0 no-op |
| `node scripts/d1-migrate.mjs` (second run, same local D1 state) | 0 entities created, 23 no-op — deterministic repeat-run confirmed under the new exact pointer-identity/provenance equivalence check (`AS14-F002`) |
| `npx wrangler deploy --dry-run` | Succeeded; same bindings as before; "--dry-run: exiting now." — no external Cloudflare resource created or modified |
| `npx wrangler d1 migrations apply DB --local` (fresh local database) | `Resource location: local`; "16 commands executed successfully"; migration applied and recorded `✅` |
| `npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' ..."` | Returned exactly the 14 authorized tables plus `d1_migrations`/`_cf_METADATA`/`sqlite_sequence` — table set unchanged by this remediation |
| Manual probe: a same-`db.batch()` call containing one valid `INSERT` followed by one `UNIQUE`-violating `INSERT` | The batch threw `D1_ERROR: UNIQUE constraint failed`, and a subsequent `SELECT * FROM projects` returned zero rows — confirms the write-phase's single `db.batch()` call is a genuine all-or-nothing D1 transaction, independent of and in addition to the preflight-refusal path the automated regression test exercises (`AS14-F001`) |
| Secret/config scan | Re-run over `worker/`, `migrations/`, `scripts/`, `tests/worker-auth.test.mjs`, `tests/d1-migration.test.mjs`, `wrangler.jsonc` — no matches beyond explanatory comments and the unrelated `url.password` property-name check; no `.env*` files; no `database_id` in `wrangler.jsonc` |

No `migrations/0001_web_inc_005_init.sql`, `worker/d1/repository.mjs`, `worker/d1/schema.mjs`, `scripts/d1-migrate.mjs`, or `wrangler.jsonc` change was needed for this remediation cycle — the composite foreign-key design and table set already satisfied `AS14-F001`/`F002`/`F003`'s requirements once `worker/d1/migrate.mjs` and `worker/d1/validate.mjs` were corrected.

Do not represent any `NOT IMPLEMENTED` row above as `PASS` in a future handoff without the actual feature and test existing first.
