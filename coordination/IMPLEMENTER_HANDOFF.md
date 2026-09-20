# Implementer Handoff

Status: `READY_FOR_ARCHITECT` — MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

**MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY update:** see the "MAISOGLABS Skills Foundation V0.1 — Discovery Handoff" section at the very end of this document for the current cycle's exact scope and evidence. Everything above that section (including "SENTINEL-TRACEABILITY-V1 — Remediation Cycle 2 (ML-DEVOS-AS-040 / AS40-F001)," "SENTINEL-TRACEABILITY-V1 — Remediation Cycle 1 (ML-DEVOS-AS-039 / AS39-F008)," the original "SENTINEL-TRACEABILITY-V1 — Static Traceability Graph / Validator" implementation, "SENTINEL-BASELINE-CLEANUP-001 — Active-baseline metadata cleanup," "WEB-REL-001 — Production Release Readiness," "WEB-INC-007 — Remediation Cycle 1 (ML-DEVOS-AS-032)," "WEB-INC-007 — Theme / Design Controls," "WEB-INC-006 — Local Journal Subsystem," "UI-PATCH-001 — Soft Geometry Pass," "WEB-INC-004 Remediation Cycle 1," the original "WEB-INC-004 — Local Media Subsystem," and "WEB-INC-003 Remediation Cycle 1") describes prior, already-closed cycles (Sentinel Traceability V1 is fully closed per `ML-DEVOS-AS-041`) and remains accurate as historical record. Sentinel S3 — Typed Task Contracts is `PAUSED / QUEUED — AUTHORITY PRESERVED` per `D-038`; this discovery cycle does not resume it.

---

## Cycle / Change ID

`MAISOGLABS-WEB-INC-003-PROJECT-MUTATION` — **AUTHORIZED IMPLEMENTATION**

Authority chain: `ML-DEVOS-RFC-006` → `ML-DEVOS-AS-020` (`ARCHITECT_APPROVED — WEB-INC-003 PROJECT MUTATION CAPABILITY COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`) → `D-027` (Paulo: "Proceed with WEB-INC-003 implementation authorization. Authorize Claude to implement WEB-INC-003 — Project Mutation Capability exactly within ML-DEVOS-RFC-006 and every binding constraint in ML-DEVOS-AS-020.").

## Objective

Implement the first authenticated editorial mutation capability, bounded to `projects`: create-draft, edit-draft, protected preview, publish, and unpublish — composing the already-accepted `WEB-INC-001` auth boundary, `WEB-INC-005` revision substrate, and `WEB-INC-008` audit substrate into one bounded write capability. No new table, no schema change, no other content-domain mutation, no project delete.

## Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `5ba7c496a05d2541324c5ecc565c1937ca023b1e` — matches exactly the SHA the request required.
- Result SHA (implementation commit): `a016cc2aafea494ad00ecfd79b545ccdcb0c1221`
- Read in full before any edit: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-020`, all 20 findings `AS20-F001`–`F020`), `devos/changes/rfcs/ML-DEVOS-RFC-006.md` (full proposed architecture), `brain/DECISION_LOG.md` `D-027`, `devos/changes/adrs/ML-DEVOS-ADR-003.md`/`004.md`/`005.md`. Also read `worker/auth.mjs`, `worker/index.mjs`, `worker/admin/dashboard.mjs`, `worker/d1/repository.mjs`, `worker/d1/validate.mjs`, `worker/d1/audit.mjs`, `worker/d1/migrate.mjs`, and `migrations/0001_web_inc_005_init.sql`'s `projects`/`project_revisions` DDL in full to plan an implementation that reuses the exact already-accepted revision/pointer/audit patterns rather than inventing new ones.

## Exact changed-file list — 15 files

**New (3):**
- `worker/admin/projects.mjs` — the HTTP dispatcher for the five authorized routes: request hardening (origin/content-type/body-size), the `sub`-based mutation gate, response construction, best-effort failure-audit recording
- `worker/d1/projects.mjs` — the D1-facing mutation helpers: read-only pre-checks and the `db.batch()` statement builders for create/edit/publish/unpublish
- `tests/worker-admin-projects.test.mjs` — 39 new tests

**Modified, substantive (6):**
- `worker/d1/audit.mjs` — purely additive: `buildAuditAppendStatement(db, event)` (returns an unexecuted prepared statement so a caller can include it in its own `db.batch()`; `appendAuditEvent` now calls this internally, unchanged behavior) and `buildProjectRevisionAuditStatement(db, {...})` (a narrow, hardcoded-to-`project_revisions` builder that resolves `revision_id` via a same-transaction subquery instead of a literal, for the one case — a brand-new revision — where the id isn't known in JS yet). Every pre-existing export's observable behavior is unchanged — confirmed by `tests/d1-audit.test.mjs`'s 17 tests all still passing unmodified.
- `worker/d1/validate.mjs` — purely additive: `validateProjectId(id)`.
- `worker/auth.mjs` — `handleRequest` now reduces the verified Access JWT payload to a bounded `sub` (via a new internal `extractMutationSubject`) and passes it to `dispatch(...)`; default (no-`dispatch`) behavior and every existing caller/test unaffected.
- `worker/index.mjs` — forwards `sub` from `dispatch` into `handleAdminDispatch`.
- `worker/admin/dashboard.mjs` — `jsonResponse` is now exported (for reuse, no behavior change) and `handleAdminDispatch` routes `/admin/api/projects`/`/admin/api/projects/*` to the new dispatcher, inserted between the unchanged `DASHBOARD_PATH` check and the unchanged generic `/admin/api/*` → `404` fallback. `GET /admin/api/dashboard`'s own behavior is untouched — proven by the full existing 20-test dashboard suite still passing and by a new dedicated regression test.
- `tests/worker-admin-dashboard.test.mjs` — one pre-existing test's fixture path corrected: "authenticated GET to an unknown /admin/api/* path returns protected 404" used `/admin/api/projects` as its example of an *unknown* path; that path is now a real, authorized route (`AS20-F002`), so the fixture was changed to `/admin/api/nope` (already used elsewhere in the file for the same purpose). The test's assertions and intent are unchanged.

**Modified, documentation (6):**
- `brain/GOVERNANCE_MAP.md`, `brain/IMPLEMENTATION_STATUS.md`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, `docs/product/BUILD_PLAN.md`, `docs/product/DATA_BACKEND_SPEC.md` — updated to record the capability without overclaiming public-site impact (`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE`, `AS20-F015`) or other-content-domain mutation.

**Not part of this commit, added in the immediately following bookkeeping commit (2):**
- `coordination/IMPLEMENTER_HANDOFF.md` (this file)
- `coordination/STATE.md`

**Not touched, exactly as required (confirmed empty via `git diff --stat` against every path):** `migrations/0001_web_inc_005_init.sql`, `migrations/0002_web_inc_008_audit_log.sql`, `worker/d1/schema.mjs`, `worker/d1/repository.mjs`, `worker/d1/migrate.mjs`, `wrangler.jsonc`, `package.json`, `package-lock.json`, `app/page.js`, `app/admin/*`, `data/site.js`, `lib/content/*`, `tests/content.test.mjs`, `tests/worker-auth.test.mjs`, `tests/d1-migration.test.mjs`, `tests/d1-audit.test.mjs`.

No new dependency was added (`package.json`/`package-lock.json` unchanged).

## Route inventory (exact, `AS20-F002`)

| Route | Method | Auth | Sub required | Behavior |
|---|---|---|---|---|
| `POST /admin/api/projects` | POST | yes | yes | create draft (201) |
| `PUT /admin/api/projects/:id/draft` | PUT | yes | yes | edit draft (200) |
| `GET /admin/api/projects/:id/preview` | GET | yes | no (read-only) | preview current draft (200) |
| `POST /admin/api/projects/:id/publish` | POST | yes | yes | publish (200) |
| `POST /admin/api/projects/:id/unpublish` | POST | yes | yes | unpublish (200) |
| any of the above, wrong method | — | yes | — | `405`, zero D1 access |
| `/admin/api/projects/*` unrecognized sub-route | any | yes | — | protected `404`, zero D1 access |
| any of the above | any | invalid/missing auth | — | `401` (dispatch never reached, exactly as `WEB-INC-001` already behaved) |

No `DELETE` route exists on any path; no generic `/admin/api/*` mutation route exists. `GET /admin/api/dashboard` is unmodified.

## Mutation identity boundary (`AS20-F003`)

`worker/auth.mjs`'s `handleRequest` now derives `sub` from the verified JWT payload (`typeof payload?.sub === "string" && payload.sub.trim().length > 0 ? payload.sub : undefined`) and passes it to `dispatch`. Every mutating handler in `worker/admin/projects.mjs` checks `if (!sub) return jsonResponse(403, ...)` **before** reading the request body or touching D1. Preview does not require `sub` (it is a read, not a mutation). The audit `actor` is `` `cf-access:${sub}` `` — a bounded opaque value; the full JWT, email, and claims object are never persisted or passed into any repository/write helper.

## Request hardening (`AS20-F004`)

`worker/admin/projects.mjs`'s `readAndValidateMutationRequest` runs before any D1 access on every mutating route: requires `Origin` to equal the request's own origin (`403` otherwise), requires `Content-Type: application/json` (`415` otherwise), bounds the raw body to 32 KiB (`413` otherwise), and requires valid JSON object syntax (`400` otherwise). No permissive CORS header is ever set (inherited from `jsonResponse`); `Cache-Control: no-store` is applied uniformly by the existing `withNoStore` wrapper in `worker/auth.mjs`; JSON responses carry `X-Content-Type-Options: nosniff`.

## Revision model (`AS20-F005`)

Create writes one `projects` base row (no pointers) + one immutable `project_revisions` row (`revision_number = 1`) + a pointer `UPDATE` that sets only `draft_revision_id`. Edit writes a **new** `project_revisions` row (`revision_number = ` current max `+ 1`, computed via a plain read) and moves only `draft_revision_id` — no existing revision row is ever `UPDATE`d, and `published_revision_id` is never touched by edit. Slug is validated once at create and is never accepted as an edit field. No project/revision delete capability exists anywhere in this diff.

## Stale-write protection (`AS20-F006`)

Every existing-project mutation (edit/publish/unpublish) requires `expectedPublishedRevisionId`/`expectedDraftRevisionId` in the request body (both keys must be present; each must be `null` or a positive safe integer, or the request is `400`). The handler reads the project's current pointers and compares them against the expected values **before** building or running any `db.batch()` call; on mismatch it returns `409` having touched D1 only for that one read — zero content/pointer mutation. Proven directly: "PUT .../draft with a stale expectedDraftRevisionId is rejected (409) with zero content/pointer change" and the equivalent publish/unpublish tests.

## Publish / unpublish (`AS20-F007`, `AS20-F008`)

Publish requires `draft_revision_id` to be set (`409` otherwise), re-reads the exact persisted draft row, and re-runs it through the same `validateProjectRevisionContent` used at write time (`worker/d1/projects.mjs`'s `revisionRowToDomainFields` + `worker/d1/validate.mjs`) before promoting it — proven by a test that corrupts the stored draft's `stack_json` out-of-band and confirms publish refuses to promote it (`500`, published pointer untouched, `result: failure` audit recorded). On success, `worker/d1/projects.mjs`'s `buildPublishBatch` atomically sets `published_revision_id := draftRevisionId`, clears `draft_revision_id`, and appends one `project_publish`/`success` audit row. Unpublish's `buildUnpublishBatch` atomically clears `published_revision_id` (preserving the revision row and any independent draft pointer) and appends one `project_unpublish`/`success` audit row.

## Atomicity and revision-ID correlation (`AS20-F009`, `AS20-F010`)

Every successful state-changing mutation's business statements and its success `audit_log` INSERT are included in the **same** `db.batch()` array, so they commit as one D1 transaction. For create/edit, where the new revision's autoincrement `id` is not known in JS until after the `INSERT` runs, the pointer `UPDATE` and the audit `INSERT`'s `revision_id` both resolve it via the identical, already-accepted same-transaction subquery pattern `worker/d1/migrate.mjs` uses — `(SELECT id FROM project_revisions WHERE project_id = ? AND revision_number = ?)`, keyed on the existing `UNIQUE (project_id, revision_number)` constraint — never `last_insert_rowid()`, never id preallocation, and no schema change. This satisfied the stop condition: a safe, documented-behavior strategy existed, so no STOP-and-return was necessary.

Proof of genuine atomicity: "a forced audit-statement failure inside a create-draft-shaped batch rolls back the project/revision insert too" issues the exact same four-statement batch shape directly against a real local D1 instance, with the audit statement's `result` deliberately set to a value that violates the column's `CHECK` constraint, and asserts (a) `db.batch()` rejects and (b) zero `projects`/`project_revisions`/`audit_log` rows exist afterward. A second test ("a simulated storage failure during publish...") proves the HTTP layer returns a generic `500` and changes nothing when `db.batch()` rejects for any reason.

## Failure audit semantics (`AS20-F011`)

`worker/admin/projects.mjs`'s `tryAppendFailureAudit` is called, after the primary error response is already decided, for every validation/not-found/conflict/stale/revalidation failure where a safe bounded entity id exists (an unusable client-supplied `id` records the RFC-006-specified sentinel `"unassigned"` instead of the raw value). Its own failure is swallowed — it can never change the response already returned or crash the request. No recursive self-audit is attempted.

## Audit action allowlist (`AS20-F012`)

Only `project_create_draft`, `project_update_draft`, `project_publish`, `project_unpublish` are ever passed as `action`, and `entityType` is hardcoded to `"project"` in every call site — never caller-controlled.

## Bounded errors / no leakage (`AS20-F013`)

Status codes used: `400` (malformed/validation), `401` (existing auth boundary, unchanged), `403` (Origin mismatch or no mutation-eligible subject), `404` (unknown project/route), `405` (unsupported method), `409` (stale/conflict/no-draft-to-publish/nothing-published), `413` (oversized body), `415` (wrong content type), `500` (generic internal/storage failure), `503` (missing `DB` binding). "a generic internal error never leaks D1/SQL detail, subject, or claims" asserts a forced-storage-failure response body contains neither `SELECT`, the verified subject, nor the raw Access token.

## Preview (`AS20-F014`)

`GET /admin/api/projects/:id/preview` runs only after Access verification, reads only the entity's exact `draft_revision_id` (never falls back to `published_revision_id` when no draft exists — proven by a dedicated test), returns only validated presentation fields, is never public, mutates nothing, and writes no audit event (proven by an audit-row-count-unchanged assertion around the call).

## Public-source / schema invariants (`AS20-F015`, `AS20-F016`)

`app/page.js`, `lib/content/*`, and `data/site.js` are byte-identical to the base commit; `npm run build` output unchanged (same three routes). `migrations/0001_web_inc_005_init.sql` and `migrations/0002_web_inc_008_audit_log.sql` are byte-identical to the base commit; the table inventory remains exactly 15 (`tests/worker-admin-projects.test.mjs`'s "the current schema remains exactly 15 product tables after project mutation activity", plus direct CLI confirmation below).

## Test results

`npm test`: **152 passed, 0 failed** — 27 `tests/content.test.mjs` (unchanged) + 30 `tests/worker-auth.test.mjs` (unchanged) + 19 `tests/d1-migration.test.mjs` (unchanged) + 17 `tests/d1-audit.test.mjs` (unchanged) + 20 `tests/worker-admin-dashboard.test.mjs` (one fixture-path correction, still 20/20 passing) + 39 new `tests/worker-admin-projects.test.mjs`.

`npm run build`: succeeded, same three routes (`/`, `/_not-found`, `/admin`) as before this increment.

## Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `5ba7c496a...` before any file was touched |
| `node --test tests/worker-admin-projects.test.mjs` (isolated) | 39 passed, 0 failed |
| `npm test` (full suite) | 152 passed, 0 failed |
| `npm run build` | Succeeded, unchanged routes |
| `npx wrangler d1 migrations apply DB --local` (fresh local database) | `Resource location: local`; `0001_web_inc_005_init.sql` → 16 commands executed successfully; `0002_web_inc_008_audit_log.sql` → 5 commands executed successfully; both recorded `✅` — unmodified migrations reapplied cleanly |
| `npx wrangler d1 execute DB --local --command "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' ..."` | `n: 15` — unchanged |
| `npx wrangler dev --local` + `curl` (real Workers/Miniflare runtime, unauthenticated) | `GET /` → `200` (public unaffected); `POST /admin/api/projects` (no token) → `401` + `Cache-Control: no-store`; `GET /admin/api/projects/foo/preview` (no token) → `401`; `POST /admin/api/projects/foo/publish` (no token) → `401`; `DELETE /admin/api/projects` (no token) → `401` — every new route fails closed before any route/method dispatch, reproduced in the real local Workers runtime |
| `npx wrangler deploy --dry-run` | Succeeded; binding table unchanged (`env.DB` → `maisog-labs-web-inc-005-local`, `env.ASSETS`, `env.ACCESS_TEAM_DOMAIN`, `env.ACCESS_AUD`) — no new binding, no `database_id`, no `remote: true`; "--dry-run: exiting now." |
| Secret/config scan | `grep` for JWT/PEM/private-key markers, `Bearer` tokens, `database_id`, AWS-style key patterns across every new/changed `worker/*` file and `tests/worker-admin-projects.test.mjs` — zero matches of any kind; no `.env*` files; no `database_id` in `wrangler.jsonc`; `package.json`/`package-lock.json` diff empty |
| `git diff --stat` against every "not touched" path listed above | Empty for every path |
| `git diff worker/d1/audit.mjs` | Confirms every pre-existing export's behavior is unchanged — only additions (`buildAuditAppendStatement`, `buildProjectRevisionAuditStatement`, the internal `validateCoreFields` refactor) |

Every D1/Wrangler command above used `--local` explicitly or performed no resource mutation at all (`--dry-run`); none used `--remote`. `wrangler.jsonc` was not modified.

## Known limitations

- The stale-write pre-check (`readProjectForMutation` read, then compare, then build/run the batch) is a check-then-act pattern, not a database-enforced compare-and-swap — a true concurrent overlapping request between the check and the batch's execution is not defended against beyond what `worker/d1/migrate.mjs`'s existing accepted preflight-then-batch pattern already relies on. This repository's local/single-actor execution model (Wrangler local dev, and the deterministic sequential Node test suite) does not exercise or require true concurrent-transaction serializability, and no schema change was available to add stronger locking without violating the schema-change prohibition.
- `edit-draft`'s `revision_number` is computed via a plain read (`COALESCE(MAX(revision_number), 0) + 1`) rather than inside the same atomic batch; two genuinely concurrent edits to the same project could compute the same next `revision_number` and collide on the existing `UNIQUE (project_id, revision_number)` constraint — a safe, fail-closed outcome (the whole batch aborts, no corruption), not a silent one, but not exercised by an automated test given the single-threaded local execution model.
- No admin UI control for any of these five routes was added (`app/admin/DashboardClient.js` is unmodified). RFC-006/AS-020 permit but do not require UI in this increment; this is deferred, not overlooked.
- The authenticated-success mutation paths are proven by the deterministic Node test suite (local D1 via `getPlatformProxy({ remoteBindings: false })` and a locally-generated test JWKS/key pair), not by an authenticated `wrangler dev` HTTP round trip — no real Cloudflare Access application exists to drive one, the same limitation every prior increment's evidence in this repository already carries.
- This evidence remains `ACTOR_REPORTED` until independently reviewed.

## Explicit confirmations

- **No remote Cloudflare resource was created or modified.** No `wrangler d1 create`; every D1 command is `--local` or non-mutating; `wrangler.jsonc` unchanged (`remote: false`, no `database_id`); no production Cloudflare Access configuration touched.
- **No deployment occurred.**
- **No public D1 cutover occurred.** `app/page.js`, `lib/content/*`, `data/site.js` are byte-identical to the base commit; `npm run build` output unchanged. A local D1 "publish" does not change what the public site serves.
- **No schema/migration change occurred.** `migrations/0001_web_inc_005_init.sql` and `migrations/0002_web_inc_008_audit_log.sql` are byte-identical to the base commit; the table inventory remains exactly 15.
- **`GET /admin/api/dashboard` is unchanged.** `worker/admin/dashboard.mjs`'s own dashboard-path logic was not modified; its full existing 20-test suite still passes unmodified, and a new regression test confirms its response is unaffected by project-mutation/audit activity.
- **No project delete, slug rename, or other content-domain mutation exists.** Only `projects` create-draft/edit-draft/preview/publish/unpublish exist anywhere in this diff.
- **No persistent admin/user/session/role table was created.** The audit `actor` remains a bounded opaque value derived only from the verified Access `sub`.
- **No audit HTTP API and no audit UI exist.**
- **No admin UI control was added** for any of these five routes.
- **No `WEB-INC-004`/`006`/`007` or any later increment's work began.**
- **`MUTATION_AUTHORIZED: YES`** and **`AUDIT_APPEND_AUTHORIZED: YES`** apply only to this exact bounded `WEB-INC-003` project capability (`AS20-F020`) **; `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.
- **The Implementer has not self-certified this implementation as `ARCHITECT VERIFIED`** and has not begun any next increment.

## Commit

Implementation files above are committed to `governance/maisoglabs-v0.1` as commit `a016cc2aafea494ad00ecfd79b545ccdcb0c1221` on top of base `5ba7c496a05d2541324c5ecc565c1937ca023b1e`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md` (a commit cannot self-reference its own hash), consistent with the pattern established across every prior cycle in this engagement. Both commits are mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## WEB-INC-003 Remediation Cycle 1

Authority: `ML-DEVOS-AS-021: CHANGES_REQUESTED — WEB-INC-003 REMEDIATION CYCLE 1 LIMITED TO COMMIT-TIME STALE-WRITE ENFORCEMENT, BOUNDED MUTATION IDENTITY, TRUE BODY-SIZE BOUNDING, AND ROUTE/DB ORDERING` (Architect review commit `8307fcc70b29294db5637118ab9120e51f0435ff`).

### Blocking/required findings addressed

- **`AS21-F007` (blocking)** — stale-write enforcement was pre-read-only and had a TOCTOU window: a competing pointer change could commit between the handler's pre-read and the mutation batch's execution, letting a stale request overwrite it.
- **`AS21-F008` (blocking)** — the verified Access `sub` was accepted as mutation-authorizing whenever non-empty, with no explicit upper bound, so an oversized subject could reach project D1 access before failing indirectly at audit-construction time.
- **`AS21-F009` (required)** — the 32 KiB request-body budget was enforced via `String.prototype.length` (UTF-16 code units) after fully buffering the body, not real UTF-8 byte length, so multibyte content could exceed the true byte budget while passing the check.
- **`AS21-F010` (required)** — `handleProjectsDispatch` checked for the DB binding before classifying the route/method, so an unsupported route or wrong method could return `503` instead of the capability's bounded `404`/`405` even though it needs no D1 access at all.

All 6 non-blocking findings from the original review (`AS21-F001`–`F006`) were `PASS` and are unaffected by this remediation.

### Base / result SHA

- Remediation base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `5f2991f1c26c79bdda687ff6b4adba4c8e00c50b` — matches exactly the SHA the request required.
- Remediation result SHA (implementation commit): `a1ff241c5c4f912564627ee13824496ecf9b197b`

### Exact changed-file list — 5 files (this commit)

- `worker/d1/projects.mjs` — `buildEditDraftBatch`/`buildPublishBatch`/`buildUnpublishBatch` now accept `expectedPublishedRevisionId`/`expectedDraftRevisionId` and enforce them inside the same pointer-`UPDATE` statement via a new `stalePointerGuardedSlugAssignment()` helper (`AS21-F007`)
- `worker/auth.mjs` — `extractMutationSubject` now trims and bounds the verified `sub` (`AS21-F008`)
- `worker/admin/projects.mjs` — threads the expected pointers into the batch builders, adds `classifyMutationBatchFailure` (409 vs 500 after a rejected batch), replaces the character-counted body check with `readBoundedBodyBytes` (`AS21-F009`), and reorders `handleProjectsDispatch` to classify route/method before checking for `db` (`AS21-F010`)
- `tests/worker-admin-projects.test.mjs` — 12 new tests (51 total in the file)
- `brain/TEST_LEDGER.md` — new test rows plus a "`WEB-INC-003` Remediation Cycle 1 command evidence" section

**No other file changed.** In particular: no migration/schema file, no new route, no product-domain expansion, no admin UI change. `git diff --stat` against `migrations/0001_web_inc_005_init.sql`, `migrations/0002_web_inc_008_audit_log.sql`, `worker/d1/schema.mjs`, `wrangler.jsonc`, `package.json`, `app/*`, `data/site.js`, `lib/content/*` is empty for every path.

### `AS21-F007` fix — the commit-time stale-write guard, exactly

Every stale-check-bearing pointer `UPDATE` (edit/publish/unpublish) now includes:

```sql
slug = CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? THEN slug ELSE 'home' END
```

bound to the request's `expectedPublishedRevisionId`/`expectedDraftRevisionId`, evaluated against the row's **live** value at the moment the statement executes — not the handler's earlier pre-read snapshot. When the guard holds, every column (including `slug`) evaluates to a true no-op or the intended new value. When it fails, `slug` is set to the literal `'home'`, which `projects`' existing, unmodified `CHECK (slug NOT IN ('home', 'projects', 'process', 'about', 'main-content'))` constraint (`migrations/0001_web_inc_005_init.sql`) rejects outright — the `UPDATE` statement itself fails, and because `db.batch()` is one transaction, every other statement in the same batch (the new revision `INSERT` for edit; the success audit `INSERT` for all three) rolls back with it. A validated project's `slug` can never legitimately be `'home'` (`validateProjectSlug` rejects reserved slugs at create time), so the guard-holds branch never collides with the poison value.

This was chosen only after ruling out an unsafe alternative: an empirical scratch probe against a real local D1 instance (not committed; see `TEST_LEDGER.md`'s Remediation Cycle 1 evidence section) confirmed that SQLite's `changes()` function reports a row as "changed" whenever the `UPDATE`'s `WHERE id = ?` matches it — **even when a self-referential `CASE` guard made every actual value a no-op** — so `changes()` cannot distinguish "the guard held" from "the guard failed but the row still matched by id." The slug-poison technique was verified to genuinely abort the whole batch before being adopted.

After a rejected batch, `worker/admin/projects.mjs`'s new `classifyMutationBatchFailure` re-reads the row (now provably unchanged, since the transaction rolled back) and compares it against the same expected values: if they still don't match, the guard fired → `409`; if they do match, some other failure occurred → `500`. Either way a bounded failure audit may be recorded per the existing `AS20-F011` behavior, unmodified by this fix.

### `AS21-F007` test evidence — deterministic TOCTOU simulation

`tests/worker-admin-projects.test.mjs` adds a `interleavingDb(realDb, { staleRow })` helper: it intercepts only the **first** call to the exact project-mutation pre-read query and returns a caller-supplied stale snapshot, while every other statement (including the mutation's own `db.batch()` and any later re-read) executes against the real, already-migrated database. This faithfully simulates "a competing pointer change commits after the pre-read but before the batch executes" without relying on real concurrency. Three tests, each proving `409`, the competing state surviving untouched, no orphan revision, and zero success audit rows for the stale attempt:

- "edit vs a competing draft change ..." — a real competing edit moves the draft pointer; a stale edit (built against the pre-competing-edit snapshot) is rejected.
- "publish vs a competing draft change ..." — a real competing edit moves the draft pointer; a stale publish (targeting the now-superseded draft) is rejected, and the competing draft remains un-published.
- "unpublish vs a competing pointer change ..." — after a real publish, a real competing edit creates an independent new draft; a stale unpublish (built against the pre-competing-edit snapshot) is rejected, and the competing draft pointer survives.

All three would have passed silently (i.e., failed to catch the race) under the previous pre-read-only implementation — the pre-read there was the sole guard, and these tests are specifically constructed so the pre-read alone cannot observe the competing change.

### `AS21-F008` fix and evidence

`worker/auth.mjs`'s `extractMutationSubject` now: rejects non-string `sub`; trims; rejects empty (post-trim) length; rejects length `> 90` (so `` `cf-access:${sub}` `` never exceeds `worker/d1/audit.mjs`'s `ACTOR_PATTERN` 100-character bound); rejects any character outside printable ASCII (`0x20`–`0x7e`). All of this happens in `worker/auth.mjs`, before `dispatch` is ever called — an oversized/malformed subject becomes `undefined` at the authentication boundary itself, so every mutating handler's existing `if (!sub) return jsonResponse(403, ...)` check rejects it with **zero** project D1 access. Four new tests: empty-string subject, whitespace-only subject, oversized (91-char) subject — each `403` with zero D1 calls — and an exactly-90-char subject, which completes a normal create-draft and produces the audit actor `` `cf-access:${"s".repeat(90)}` `` (exactly 100 characters, `ACTOR_PATTERN`'s exact upper bound).

### `AS21-F009` fix and evidence

`worker/admin/projects.mjs`'s new `readBoundedBodyBytes` reads `request.body` via `getReader()`, accumulating real byte counts and aborting (cancelling the reader) the moment the running total exceeds 32 KiB — never buffering an oversized body in full. It also checks a declared `Content-Length` header up front, rejecting immediately when present and over-budget, before any body read begins. Two new tests: one sets `Content-Length: 65536` on a request whose actual body is small, proving the early-reject path fires (`413`, zero D1 calls); the other builds a body from 11,000 repetitions of a 3-byte-UTF-8 character (`"あ"`) — real UTF-8 byte length ~33,000 (over budget) while the JS string's `.length` is ~11,000 (an order of magnitude under the *old* buggy 32768-character threshold) — proving the new byte-accurate check rejects it (`413`, zero D1 calls) where the old character-counted check would not have.

### `AS21-F010` fix and evidence

`handleProjectsDispatch` now checks route/method first for every branch, returning `404`/`405` immediately when unmatched, and only checks `if (!db) return jsonResponse(503, ...)` for a route+method combination it actually recognizes and is about to call into D1 for. Three new tests, each passing `db: undefined`: an unrecognized sub-route (`.../some-id/delete`) → `404`; a wrong method on a recognized route (`GET /admin/api/projects`) → `405`; a recognized route+method (`POST /admin/api/projects`) → `503`.

### Test results

- `node --test tests/worker-admin-projects.test.mjs` (isolated): **51 passed, 0 failed** (39 preserved + 12 new).
- `npm test` (full suite): **164 passed, 0 failed** (27 `content.test.mjs` + 30 `worker-auth.test.mjs` + 19 `d1-migration.test.mjs` + 20 `worker-admin-dashboard.test.mjs` + 17 `d1-audit.test.mjs`, all unchanged and still passing, + 51 `worker-admin-projects.test.mjs`).

### Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `5f2991f1c...` before any file was touched |
| Empirical scratch probe of the guard mechanism against a real local D1 instance (not committed) | Confirmed a self-referential `CASE` no-op works as expected; confirmed `changes()` cannot distinguish a guard-failed no-op from a genuine change when the row still matches `WHERE id = ?`; confirmed the `slug`-poison technique genuinely aborts the whole `db.batch()` transaction (`D1_ERROR: CHECK constraint failed: slug NOT IN (...)`), rolling back every other statement in the same batch |
| `node --test tests/worker-admin-projects.test.mjs` (isolated) | 51 passed, 0 failed |
| `npm test` (full suite) | 164 passed, 0 failed |
| `npm run build` | Succeeded, unchanged routes |
| `npx wrangler d1 migrations apply DB --local` (fresh local database) | `Resource location: local`; `0001_web_inc_005_init.sql` → 16 commands executed successfully; `0002_web_inc_008_audit_log.sql` → 5 commands executed successfully; both recorded `✅` — unmodified migrations reapplied cleanly |
| `npx wrangler d1 execute DB --local --command "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' ..."` | `n: 15` — unchanged |
| `npx wrangler deploy --dry-run` | Succeeded; binding table unchanged (`env.DB` → `maisog-labs-web-inc-005-local`, `env.ASSETS`, `env.ACCESS_TEAM_DOMAIN`, `env.ACCESS_AUD`); no new binding, no `database_id`, no `remote: true`; "--dry-run: exiting now." |
| Secret/config scan | `grep` for JWT/PEM/private-key markers, `Bearer` tokens, `database_id`, AWS-style key patterns across every changed file — zero matches; no `.env*` files; no `database_id` in `wrangler.jsonc`; `package.json`/`package-lock.json` diff empty |
| `git diff --stat` against every "not touched" path (`migrations/*`, `wrangler.jsonc`, `package.json`, `worker/d1/schema.mjs`, `app/*`, `data/site.js`, `lib/content/*`) | Empty for every path |

Every D1/Wrangler command above used `--local` explicitly or performed no resource mutation at all (`--dry-run`); none used `--remote`. `wrangler.jsonc` was not modified.

### Known limitations (remediation-specific; see the original handoff section above for the rest)

- The `slug`-poison technique repurposes an existing, unrelated `CHECK` constraint as a concurrency guard. It is deliberately scoped and heavily commented in `worker/d1/projects.mjs` to make this explicit and auditable, but it is a creative (if empirically verified) use of the schema rather than a purpose-built mechanism; if a future increment ever needs to change `projects.slug`'s reserved-word list, that change must account for this dependency.
- `edit`'s `revision_number` is still computed via a plain pre-batch read (`COALESCE(MAX(revision_number), 0) + 1`), unchanged from the original implementation — this remediation did not touch that (out of scope for `AS21-F007`, which is about pointer staleness, not revision-number allocation). The existing `UNIQUE (project_id, revision_number)` constraint still fails closed (batch rejects) in the event of a genuine allocation race.
- This evidence remains `ACTOR_REPORTED` until independently reviewed.

### Explicit confirmations (remediation cycle)

- **No redesign occurred.** Only the four cited findings were fixed; the route surface, revision model, audit allowlist, and public-source boundary are all unchanged from the original implementation.
- **No schema/migration change occurred.** `migrations/0001_web_inc_005_init.sql` and `migrations/0002_web_inc_008_audit_log.sql` are byte-identical to the remediation base; the guard reuses `projects.slug`'s existing `CHECK` constraint, adding no column/table/trigger.
- **No new route, no project delete, no other content-domain mutation.**
- **No remote D1, no deployment, no public D1 cutover, no protected/main merge.**
- **No `WEB-INC-004`/`006`/`007` or any later increment's work began.**
- **`MUTATION_AUTHORIZED: YES`** and **`AUDIT_APPEND_AUTHORIZED: YES`** apply only to this exact bounded `WEB-INC-003` remediation **; `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.
- **The Implementer has not self-certified this implementation as `ARCHITECT VERIFIED`.**

### Remediation commit

Remediation files above are committed to `governance/maisoglabs-v0.1` as commit `a1ff241c5c4f912564627ee13824496ecf9b197b` on top of remediation base `5f2991f1c26c79bdda687ff6b4adba4c8e00c50b`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. Both commits are mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## WEB-INC-004 — Local Media Subsystem

Cycle ID: `MAISOGLABS-WEB-INC-004-MEDIA-SUBSYSTEM`

Authority chain: `ML-DEVOS-RFC-007` → `ML-DEVOS-AS-023` (`ARCHITECT_APPROVED — WEB-INC-004 LOCAL MEDIA SUBSYSTEM COMPATIBLE FOR BOUNDED REPOSITORY/LOCAL IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`) → `D-029` (Paulo: "Okay let's keep that on record and let's proceed with the build keep Only the goods ones."). Active Sentinel governance-capability baseline at implementation time: `v1.5.0` (`D-028`/`ML-DEVOS-ADR-006`) — this does not change AS-023's verdict or gates.

### Objective

Add a locally-simulated R2 + D1 media subsystem, bounded to exactly the scope AS23-F001–F018 authorize: two new tables (`media`, `project_media`), a local-only R2 binding, `POST`/`GET /admin/api/media`, and an optional atomic media snapshot on existing project create/edit — composing the already-accepted `WEB-INC-001` auth boundary, `WEB-INC-005` revision substrate, `WEB-INC-008` audit substrate, and `WEB-INC-003` project mutation capability into one bounded new write capability. No delete/update media route, no journal/theme work, no remote R2/D1, no deployment.

### Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `281d726c348e04003b9226ebb766cab50b86439c` — matches exactly the SHA the request required.
- Result SHA (implementation commit): `ca6a93b65353968353b9ba3670e162468abdb33a`
- Read in full before any edit, in the exact required order: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-023`, all 18 findings `AS23-F001`–`F018`), `devos/changes/rfcs/ML-DEVOS-RFC-007.md` (full, 484 lines), `devos/changes/architect-syncs/ML-DEVOS-AS-023.md` (diffed against the rolling review and confirmed byte-identical substance), `brain/DECISION_LOG.md`'s `D-029` entry, `docs/SENTINEL_REVIEW_NOTES.md` (full, advisory-only). Also re-read `wrangler.jsonc`, `worker/d1/schema.mjs`, `worker/d1/projects.mjs`, `worker/admin/projects.mjs`, `worker/d1/audit.mjs`, `worker/index.mjs`, `worker/admin/dashboard.mjs`, and `migrations/0001_web_inc_005_init.sql`/`0002_web_inc_008_audit_log.sql` in full, and confirmed via `git log` that none of these paths had drifted since the last `WEB-INC-003` remediation commit.

### Exact changed-file list — 13 files

**New (5):**
- `migrations/0003_web_inc_004_media.sql` — the `media` and `project_media` tables, their `CHECK` constraints, and four immutability/DELETE-protection triggers
- `worker/media/signature.mjs` — magic-byte JPEG/PNG/WebP detection (`detectImageContentType`), plus `ALLOWED_MEDIA_CONTENT_TYPES`/`EXTENSION_FOR_CONTENT_TYPE`/`MAX_MEDIA_BYTES`
- `worker/d1/media.mjs` — D1 helpers: `readMediaRow`, `readActiveMediaRowsByIds`, `listActiveMedia`, `buildMediaUploadBatch`, `readProjectMediaSnapshot`, `validateMediaSnapshotEntries`, `buildProjectMediaInsertStatements`
- `worker/admin/media.mjs` — the HTTP dispatcher for `POST`/`GET /admin/api/media`: request hardening, magic-byte validation, R2-before-D1 write ordering with compensating delete, positive-projection list
- `tests/worker-admin-media.test.mjs` — 22 new tests

**Modified, substantive (6):**
- `worker/d1/schema.mjs` — purely additive: `MEDIA_TABLE_NAMES`, `ALL_PRODUCT_TABLE_NAMES`, `readMediaMigrationSql()`, `applyMediaMigration(db)`, `applyAllMigrations(db)`. Every pre-existing export (`AUTHORIZED_TABLE_NAMES`, `CURRENT_PRODUCT_TABLE_NAMES`, `applySchema`, `applyAuditMigration`, `applyCurrentSchema`, `listProductTables`) is byte-unchanged — confirmed by `git diff worker/d1/schema.mjs` and by `tests/d1-migration.test.mjs`/`tests/d1-audit.test.mjs` continuing to pass unmodified (`AS23-F016`).
- `worker/d1/validate.mjs` — purely additive: `validateAltText(value)`, `validateMediaRole(value)`/`MEDIA_ROLE_VALUES`, `validateMediaId(id)`.
- `worker/d1/projects.mjs` — `buildCreateDraftBatch`/`buildEditDraftBatch` gain an additive `mediaEntries = []` parameter and now also insert that new revision's `project_media` rows (via the subquery-correlation pattern, same technique as the existing audit helper) inside the same batch. `stalePointerGuardedSlugAssignment()` and `buildPublishBatch`/`buildUnpublishBatch` are byte-unchanged — confirmed by `git diff`.
- `worker/admin/projects.mjs` — `handleCreateDraft`/`handleEditDraft` accept an optional `media` field (resolve-and-validate-existence on create; inherit-from-source-revision-when-omitted on edit); `handlePreview` now also returns bounded media metadata for the exact draft revision. The existing `readBoundedBodyBytes`/`MAX_MUTATION_BODY_BYTES` byte-accurate body reader (`AS21-F009`) is untouched — confirmed by `git diff`.
- `worker/index.mjs` — threads `env.MEDIA` (the new R2 binding) into `handleAdminDispatch`, mirroring the existing `env.DB` wiring.
- `worker/admin/dashboard.mjs` — routes `/admin/api/media` to the new `handleMediaDispatch`, after the existing dashboard/projects routing and before the generic `/admin/api/*` 404 fallback.
- `wrangler.jsonc` — adds `r2_buckets: [{ binding: "MEDIA", bucket_name: "maisog-labs-web-inc-004-local", remote: false }]`.
- `tests/worker-admin-projects.test.mjs` — fixture schema application switched from `applyCurrentSchema` to `applyAllMigrations` (required once preview/create/edit unconditionally touch `project_media`); the pre-existing "schema remains exactly 15 product tables" regression test updated in place to assert 17 against `ALL_PRODUCT_TABLE_NAMES`; 9 new tests added for the media-snapshot integration surface.

**No other file changed.** In particular: `migrations/0001_web_inc_005_init.sql` and `migrations/0002_web_inc_008_audit_log.sql` are byte-identical; no journal/theme file; no admin UI file; `app/page.js`/`data/site.js`/`lib/content/*` untouched. `git diff --stat` against those paths plus `package.json` is empty for every one.

### Schema evidence (AS23-F003)

`migrations/0003_web_inc_004_media.sql` adds exactly two tables:
- `media(id, storage_key, content_type, size_bytes, alt_text, uploaded_at, uploaded_by, state)` — `content_type` `CHECK`-restricted to `image/jpeg`/`image/png`/`image/webp`; `size_bytes` `CHECK`-bounded to `(0, 5242880]`; `alt_text` `CHECK`-bounded to 300 characters; `state` `CHECK`-restricted to `'active'` (the sole exception the immutability trigger leaves open, per AS23-F004, even though no code path in this increment ever changes it); `media_reject_immutable_field_update` (`BEFORE UPDATE OF id, storage_key, content_type, size_bytes, alt_text, uploaded_at, uploaded_by`) and `media_reject_delete` (`BEFORE DELETE`, unconditional) enforce immutability/non-deletability at the database layer.
- `project_media(id, project_revision_id, media_id, role, sort_order)` — `role` `CHECK`-restricted to `'cover'`/`'gallery'`; `UNIQUE (project_revision_id, media_id, role)`; `FOREIGN KEY (project_revision_id) REFERENCES project_revisions(id)`; `FOREIGN KEY (media_id) REFERENCES media(id)`; `project_media_reject_update`/`project_media_reject_delete` (both unconditional) enforce full immutability/non-deletability.

Product-table count: `15 → 17`.

### Empirical DDL/trigger validation (before finalizing the migration)

A disposable scratch script (not committed) applied `applyAllMigrations` against a real local D1 instance via `getPlatformProxy` and confirmed: exactly 17 tables; a direct `UPDATE media SET alt_text = ...` on an existing row is rejected (`SQLITE_CONSTRAINT_TRIGGER`); a `state`-only no-op `UPDATE` succeeds; `DELETE FROM media` is rejected; an `image/svg+xml` insert is rejected by the `content_type` `CHECK`; an oversized `size_bytes` insert is rejected by its `CHECK`; a valid `project_media` insert succeeds; a direct `UPDATE`/`DELETE` against an existing `project_media` row is rejected; a `project_media` insert referencing a nonexistent `media_id` is rejected by the foreign key; an invalid `role` is rejected by its `CHECK`; re-running `applyAllMigrations` is idempotent. The script was deleted after use.

### Upload/list boundary evidence (AS23-F006/F007/F008/F009/F010/F011)

- **Boundary order**: `POST /admin/api/media` checks route/method → `sub` (403 if absent) → `Origin === url.origin` (403) → declared `Content-Type` in the allowlist (415) → alt-text header present/decodable (400) → byte-accurate bounded body read with an early `Content-Length` reject (413) → zero-byte reject (400) → magic-byte signature must match the declared type (400, rejects SVG/arbitrary content/mismatches by construction) — all before any R2/D1 call.
- **Server-generated identity (AS23-F008)**: `id = crypto.randomUUID()`, `storageKey = `media/${id}.${extension}``, extension derived from the validated content type — never from client input. (`worker/d1/validate.mjs`'s `validateMediaId` was corrected mid-implementation to accept the actual UUID shape — see "Errors caught and fixed" below.)
- **Cross-store ordering/compensation (AS23-F009)**: R2 `put` happens before the D1 batch; an R2 failure never attempts a D1 write; a D1 batch failure after a successful R2 write triggers a best-effort `media.delete(storageKey)`, and the request still fails (`500`) whether or not that compensating delete itself succeeds — proven by three dedicated tests, including one where the compensating delete also throws.
- **Audit (AS23-F010)**: the success `media_upload`/`media` audit row commits in the same D1 batch as the media row (`buildMediaUploadBatch`); a failure audit is appended separately, best-effort, after any failure path.
- **Listing (AS23-F011)**: `GET /admin/api/media` returns only `{id, contentType, sizeBytes, altText, uploadedAt}` per row — `storage_key`, `uploaded_by`, and `state` are never selected by `listActiveMedia`/`readActiveMediaRowsByIds` in the first place, not merely omitted at serialization time.

### Project integration evidence (AS23-F012/F013/F014/F016)

- Create/edit accept an optional `media: [{mediaId, role, order}]`. On create, omission means an empty snapshot (no prior revision to inherit from). On edit, omission inherits the source revision's (`expectedDraftRevisionId ?? expectedPublishedRevisionId`) exact association snapshot; supplying `media` fully replaces the new revision's snapshot. Referenced media must resolve to an active row (`readActiveMediaRowsByIds`); a missing/duplicate-role reference is rejected `400` with nothing committed.
- Atomicity: the new revision insert, its `project_media` inserts (subquery-correlated on `(project_id, revision_number)`, same pattern as the existing audit helper), the pointer move, and the success audit all run in the one existing `db.batch()` call — a forced batch failure (via a `batchFailingDb` wrapper around a real, already-migrated database) leaves zero project/revision/`project_media` rows.
- The existing `WEB-INC-003` commit-time stale-write guard (`stalePointerGuardedSlugAssignment`) is untouched; a dedicated regression test attaches a `media` field to a stale-edit attempt (via the existing `interleavingDb` TOCTOU simulation) and confirms the `409` rejection and zero `project_media` commit are unaffected (`AS23-F016`).
- Preview (`GET /admin/api/projects/:id/preview`) returns media metadata for the exact `draft_revision_id` only; a dedicated test publishes one media snapshot, edits the draft to a different one, and confirms preview shows only the draft's snapshot while the published revision's own `project_media` rows remain unchanged (`AS23-F014`).

### Errors caught and fixed during this cycle

- **`validateMediaId` UUID-shape bug**: the first draft reused `validateProjectId`'s `^[a-z][a-z0-9-]{0,79}$` pattern (requires a leading lowercase *letter*) for server-generated media ids, but `crypto.randomUUID()` frequently produces an id starting with a digit (any hex character `0`–`9a`–`f`). This was caught by `tests/worker-admin-media.test.mjs` failing non-deterministically (~62% of runs) with `400 Validation failed` instead of `201`, traced with a standalone debug script, and fixed by giving `validateMediaId` its own exact-UUID-shape pattern (`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`) instead of reusing the project-id pattern.
- **Existing-suite regression from the new `project_media` table**: after wiring `handlePreview`/create/edit to always query `project_media` (even with an empty snapshot), 7 pre-existing tests in `tests/worker-admin-projects.test.mjs` started failing with `D1_ERROR: no such table: project_media`, because that file's fixture only ran `applyCurrentSchema` (the 15-table schema). Fixed by switching the fixture to `applyAllMigrations` and updating the one test that asserted an exact 15-table count to assert 17 — a necessary, intentional consequence of this cycle's authorized schema/route extension, not a defect being papered over.

### Test results

- `node --test tests/worker-admin-media.test.mjs` (isolated): **22 passed, 0 failed**.
- `node --test tests/worker-admin-projects.test.mjs` (isolated): **60 passed, 0 failed** (51 preserved + 9 new).
- `npm test` (full suite): **195 passed, 0 failed** (27 `content.test.mjs` + 30 `worker-auth.test.mjs` + 19 `d1-migration.test.mjs` + 20 `worker-admin-dashboard.test.mjs` + 17 `d1-audit.test.mjs`, all five unchanged and still passing, + 60 `worker-admin-projects.test.mjs` + 22 new `worker-admin-media.test.mjs`).

### Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `281d726c3...` before any file was touched |
| Empirical scratch probe of the new migration's DDL/triggers against a real local D1 instance (not committed) | See "Empirical DDL/trigger validation" above — all assertions passed |
| `node --test tests/worker-admin-media.test.mjs` | 22 passed, 0 failed |
| `node --test tests/worker-admin-projects.test.mjs` | 60 passed, 0 failed |
| `npm test` (full suite) | 195 passed, 0 failed |
| `npm run build` | Succeeded, unchanged routes (`/`, `/_not-found`, `/admin`) |
| `npx wrangler d1 migrations apply DB --local` (fresh local database) | `Resource location: local`; `0001` → 16 commands, `0002` → 5 commands, `0003_web_inc_004_media.sql` → 8 commands, all three recorded `✅` — no `--remote` flag used |
| `npx wrangler d1 execute DB --local --json --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'd1_migrations' ORDER BY name;"` | Returned exactly the 15 existing tables plus `media`/`project_media` (17 product tables) alongside Wrangler's own `_cf_METADATA` bookkeeping table |
| `npx wrangler dev --local` + `curl` (unauthenticated, real Workers/Miniflare runtime) | `GET /` → `200` (public unaffected); `POST /admin/api/media` (no token) → `401` + `Cache-Control: no-store`; `GET /admin/api/media` (no token) → `401`; `DELETE /admin/api/media` (no token) → `401`; `GET /admin/api/media/whatever` (no token) → `401` |
| `npx wrangler deploy --dry-run` | Succeeded; binding table shows the new `env.MEDIA` R2 binding (`maisog-labs-web-inc-004-local`) alongside the unchanged `env.DB`/`env.ASSETS`/`env.ACCESS_TEAM_DOMAIN`/`env.ACCESS_AUD` bindings — no `remote: true`, no bucket/database production identifier; "--dry-run: exiting now." |
| Secret/config scan | `grep` for JWT/PEM/private-key markers, `Bearer` tokens, `database_id`, `bucket_name`/`remote:\s*true`, and AWS-style key patterns across every new/changed file — zero matches beyond explanatory "no secret"/"no credential" comments; no `.env*` files; `wrangler.jsonc`'s new `r2_buckets` entry is `remote: false` with no production identifier |
| `git diff --stat` against every "not touched" path (`migrations/0001_*`, `migrations/0002_*`, `app/page.js`, `data/site.js`, `lib/content/*`, `package.json`) | Empty for every path |
| `git diff worker/d1/schema.mjs` | Confirms every pre-existing export is byte-unchanged |
| `git diff worker/d1/projects.mjs` | Confirms `stalePointerGuardedSlugAssignment()`/`buildPublishBatch`/`buildUnpublishBatch` are byte-unchanged |
| `git diff worker/admin/projects.mjs` | Confirms `readBoundedBodyBytes`/`MAX_MUTATION_BODY_BYTES` are untouched |

Every D1/Wrangler/R2 command above used `--local`/local-simulation-only explicitly or performed no resource mutation at all (`--dry-run`); none used `--remote`; `wrangler.jsonc`'s new binding carries `remote: false`.

### Governance documentation updated this cycle

- `brain/IMPLEMENTATION_STATUS.md` — "Persistent storage — media (R2)" and "Media management/upload" flipped from `NOT STARTED` to `IMPLEMENTED` (local-only); "Explicit non-claims" narrowed to reflect that media/project_media now exist, with new explicit non-claims for remote R2/D1, public media routes, and Sentinel S3+ work.
- `brain/RISK_REGISTER.md` — `RISK-WEB-012` (media upload abuse) flipped from `NOT YET APPLICABLE` to `MITIGATED`, with the documented compensating-delete-failure operational limitation called out explicitly, not silently treated as resolved; `RISK-WEB-004` (secret exposure) updated to note the new R2 binding carries no credential/production identifier either.
- `brain/GOVERNANCE_MAP.md` — `ADM-REQ-006` ("Admin can upload/select approved media") broken out of the `ADM-REQ-005…009` aggregate into its own row, `IMPLEMENTED` for projects only, no admin UI.
- `brain/TEST_LEDGER.md` — `TEST-ADM-008` flipped from `NOT IMPLEMENTED` to `PASS`; `TEST-ADM-004` extended to note the media-snapshot coverage; new `tests/worker-admin-media.test.mjs` summary subsection; new "`WEB-INC-004` command evidence" section with the full command log above and the documented operational limitation.
- `docs/product/BUILD_PLAN.md`/`docs/product/DATA_BACKEND_SPEC.md` were reviewed and found already accurate (they described `WEB-INC-004`'s `media`/`project_media` ownership prospectively); no edit was needed or made.

### Known limitations

- **Orphaned R2 object on double failure (AS23-F009, accepted)**: if a D1 batch failure's own compensating R2 delete also fails, the just-written local R2 object remains orphaned — no D1 media row references it, no success audit exists for it. The request still fails (no fabricated D1 consistency), and this is exercised directly by a dedicated test. Preventing this orphan would require a distributed-transaction mechanism, which RFC-007/AS23-F009 explicitly does not require this cycle.
- **`role` enum is a scope decision, not an RFC-dictated value**: `project_media.role` is restricted to `'cover'`/`'gallery'`, a bounded closed set chosen to match the plan's `{mediaId, role, order}` snapshot-entry shape; no other role value is accepted or planned for this cycle.
- **No admin UI**: this cycle is API-only, exactly as authorized — no upload form, no media picker, no project-editor media control exists anywhere under `app/admin/`.
- This evidence remains `ACTOR_REPORTED` until independently reviewed — no self-certification is made.

### Explicit confirmations

- **No real/remote R2 was touched.** `wrangler.jsonc`'s `MEDIA` binding is `remote: false`, no `bucket_name` resembling a production identifier, no custom domain, no credentials. Every R2 operation in every test and CLI command above ran against the local Wrangler/Miniflare simulation only.
- **No real/remote D1 was touched.** The `DB` binding is unchanged (`remote: false`, no `database_id`); every D1 command above used `--local` or performed no mutation.
- **No public bucket, public media route, or public D1/R2 cutover exists.** The public site continues to read only `data/site.js`/`public/`; `app/page.js`/`lib/content/*` are byte-unchanged.
- **No deployment occurred.** `npx wrangler deploy` was run only with `--dry-run`.
- **No protected/`main` merge occurred.** All work is on `governance/maisoglabs-v0.1` (mirrored to `claude/phase-0-governance-scope-w8o3jp`).
- **No later increment's work began.** No journal/`journal_media`, no theme/design table or route, no `WEB-INC-006`/`007` work.
- **No Sentinel S3+/CI-rulesets/Capability-Gateway/Task-Engine/Orchestrator/sandbox-subsystem work began**, per `AS23-F017` and `docs/SENTINEL_REVIEW_NOTES.md`'s explicit "keep the build simple" conclusion.
- **`MEDIA_MUTATION_AUTHORIZED: YES`, `MUTATION_AUTHORIZED: YES`, `AUDIT_APPEND_AUTHORIZED: YES`** apply only to this exact bounded `WEB-INC-004` scope; **`REMOTE_R2_AUTHORIZED`, `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.
- **The Implementer has not self-certified this implementation as `ARCHITECT VERIFIED`.** Per `CORE-020`, all runtime/test results above remain `ACTOR_REPORTED` until independently reviewed.

### Implementation commit

The files above are committed to `governance/maisoglabs-v0.1` as commit `ca6a93b65353968353b9ba3670e162468abdb33a` on top of base `281d726c348e04003b9226ebb766cab50b86439c`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. Both commits will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## WEB-INC-004 Remediation Cycle 1

Cycle ID: `MAISOGLABS-WEB-INC-004-MEDIA-SUBSYSTEM` — Remediation Cycle 1

Authority chain: `ML-DEVOS-RFC-007` → `ML-DEVOS-AS-023` → `D-029` → `ML-DEVOS-AS-026` (`CHANGES_REQUESTED — WEB-INC-004 REMEDIATION CYCLE 1 LIMITED TO MEDIA STATE DOMAIN, ALT-TEXT DB/NORMALIZATION INVARIANT, AND DUPLICATE SLOT PROTECTION`).

### Objective

Fix exactly the three blocking findings from `ML-DEVOS-AS-026`'s independent implementation review of WEB-INC-004 — `AS26-F008` (media state domain), `AS26-F009` (alt-text DB/normalization invariant), and `AS26-F010` (duplicate media slot protection) — and nothing else. No redesign, no new route, no new table, no migration `0004`, no remote resource, no public media serving, no journal/theme/later-increment work, no deployment/main merge, no Sentinel S3+.

### Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `7c7e6d35c43c2e16b18d53a65c8acf06c7c3df41` — matches exactly the SHA the request required.
- Result SHA (remediation implementation commit): `681fc90dc42239c2bd5866af1c6a0d430212416a`
- Read in full before any edit, in the exact required order: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-026`, all 10 findings `AS26-F001`–`F010`, 7 PASS + 3 BLOCKING), `devos/changes/architect-syncs/ML-DEVOS-AS-026.md` (confirmed byte-identical durable archive of the concluding rolling review), `devos/changes/rfcs/ML-DEVOS-RFC-007.md` (re-read the `media`/`project_media` schema section to confirm the exact accepted contract: `state exactly active|archived`, `bounded non-empty alt text (target: trimmed 1-300 characters)`, `prevent duplicate slot/association within one revision`), `brain/DECISION_LOG.md`'s `D-029` entry (also noted `D-030`, which queues `UI-PATCH-001` but explicitly requires WEB-INC-004 to be Architect-accepted and closed first — not started this cycle), `docs/SENTINEL_REVIEW_NOTES.md` (unchanged since the initial implementation cycle, confirmed via `git log`/checksum — advisory-only, no new obligation).

### Exact changed-file list — 6 files, all modifications (no new/deleted files)

- `migrations/0003_web_inc_004_media.sql` — amended in place (not a new migration number, per `AS26-F008`'s explicit instruction since 0003 is local-only and pre-acceptance): `media.state` CHECK changed from `IN ('active')` to `IN ('active', 'archived')`; `media.alt_text` CHECK changed from `length(alt_text) <= 300` to `alt_text = trim(alt_text) AND length(alt_text) BETWEEN 1 AND 300`; `project_media` gains a second `UNIQUE (project_revision_id, role, sort_order)` constraint alongside the existing `UNIQUE (project_revision_id, media_id, role)`. Explanatory comments extended in place; no table/trigger added or removed.
- `worker/d1/validate.mjs` — `validateAltText` rewritten to trim the input first, validate the trimmed value's length (1-300) and character set, and return the trimmed value (previously it checked `value.trim().length > 0` but returned the raw untrimmed value).
- `worker/admin/media.mjs` — the upload handler now calls `validateAltText` immediately after decoding the `X-Media-Alt-Text` header, so the same normalized (trimmed) string is used for both the D1 write and the JSON response, never two different forms of the same input.
- `worker/d1/media.mjs` — `validateMediaSnapshotEntries` now tracks two independent duplicate sets: the existing `(mediaId, role)` association check, and a new `(role, order)` slot check, matching the migration's two independent `UNIQUE` constraints.
- `tests/worker-admin-media.test.mjs` — 11 new tests (33 total): empty/whitespace-only alt-text rejection, exactly-300/over-300 boundary, leading/trailing-whitespace normalization (response and stored value agree), three direct-DB alt-text rejection tests (empty/whitespace-only/untrimmed), and three direct-DB state tests (default `active`, state-only transition to `archived`, invalid state rejected).
- `tests/worker-admin-projects.test.mjs` — 3 new tests (63 total): duplicate `(role, order)` slot with two different media IDs rejected via the API, three distinct valid slots (including same-order-different-role and same-role-different-order) succeed via the API, and a direct-DB duplicate-slot rejection test.

**No other file changed.** No route added, no table added, no `wrangler.jsonc`/`worker/index.mjs`/`worker/admin/dashboard.mjs`/`worker/d1/schema.mjs`/`worker/d1/projects.mjs`/`worker/admin/projects.mjs` change — confirmed via `git diff --stat 7c7e6d3` (exactly the 6 files above) and by re-running the full previously-passing project/dashboard/auth/migration/audit suites unmodified.

### `AS26-F008` fix and evidence

`media.state`'s `CHECK` now reads `state IN ('active', 'archived')`, default unchanged at `'active'`. No archive HTTP endpoint was added — no code path in this repository can reach a state transition today; the schema simply stops forbidding a value the accepted contract requires. The existing `media_reject_immutable_field_update` trigger's `UPDATE OF id, storage_key, content_type, size_bytes, alt_text, uploaded_at, uploaded_by` column list was already correct (it excludes `state`), so a direct `UPDATE media SET state = 'archived' WHERE id = ?` was already structurally permitted once the `CHECK` allowed the value — confirmed empirically (see below) and by three new direct-DB tests: default-`active` on insert, a state-only transition to `archived` that leaves every other column byte-identical, and an invalid state value (`'deleted'`) rejected by the `CHECK`.

### `AS26-F009` fix and evidence

`validateAltText` now trims first (`value.trim()`), validates the trimmed string is 1-300 characters and free of control/angle-bracket characters, and returns the trimmed value — the exact string that gets stored and echoed back. `worker/admin/media.mjs` calls this once, immediately after decoding the alt-text header, and reuses that single normalized value for both `buildMediaUploadBatch` and the JSON response, so "stored value and returned value use the same normalized form" is structural, not incidental. The database `CHECK` independently enforces `alt_text = trim(alt_text) AND length(alt_text) BETWEEN 1 AND 300` — a value that isn't already trimmed, or is empty/whitespace-only, fails this constraint regardless of what any future caller does. New tests: empty alt-text header rejected (400), whitespace-only rejected (400), exactly-300-character accepted, over-300 rejected, leading/trailing-whitespace input normalized (response `altText` and the stored `media.alt_text` row both equal the trimmed form), and three direct-DB tests proving empty/whitespace-only/untrimmed values are rejected by the `CHECK` independently of the application layer. The upload API surface itself is unchanged — same header, same one binary-body route.

### `AS26-F010` fix and evidence

`project_media` gains `UNIQUE (project_revision_id, role, sort_order)` alongside its existing `UNIQUE (project_revision_id, media_id, role)` — both constraints are enforced together, neither replaces the other. `validateMediaSnapshotEntries` (`worker/d1/media.mjs`) now tracks two independent `Set`s during the same pass over a caller-supplied or inherited snapshot: `seenAssociations` (the original `mediaId:role` key) and `seenSlots` (a new `role:order` key), throwing a distinct error for either collision before any D1 access. New tests: an API-level request with two different media IDs both claiming `role: 'gallery', order: 0` is rejected `400` with zero project/revision/`project_media` rows committed; a request with three genuinely distinct slots (same order/different role, and same role/different order) succeeds and each row is stored exactly as submitted; a direct-DB test inserts one `project_media` row at a slot and proves a second row (different `media_id`, same `project_revision_id`/`role`/`sort_order`) is rejected by the new `UNIQUE` constraint. No new role was introduced and the media model is otherwise unchanged.

### Empirical validation against a fresh local D1 database

Per `AS26-F008`'s explicit instruction ("Validate against a fresh local database so Wrangler's prior local migration ledger cannot mask the amended migration content"), a disposable scratch script (not committed) ran `applyAllMigrations` against a brand-new `getPlatformProxy` local D1 instance (a fresh temp directory, never previously migrated) and confirmed, in order: exactly 17 tables; an `active`-state insert with default state; a state-only `UPDATE ... SET state = 'archived'` succeeding; an invalid-state `UPDATE` rejected; an empty/whitespace-only/untrimmed `alt_text` insert each rejected by the amended `CHECK`; an exactly-300-character `alt_text` insert accepted; a 301-character insert rejected; a first `project_media` slot insert succeeding; the same `(mediaId, role)` pair rejected as a duplicate association; a different `mediaId` at the same `(role, order)` rejected as a duplicate slot; and two genuinely distinct slots (`gallery@1`, `cover@0`) both succeeding. The script was deleted after use, and `npx wrangler d1 migrations apply DB --local` was separately run against another fresh `--persist-to` directory as CLI-level confirmation (see the command log below).

### Test results

- `node --test tests/worker-admin-media.test.mjs` (isolated): **33 passed, 0 failed** (22 preserved + 11 new).
- `node --test tests/worker-admin-projects.test.mjs` (isolated): **63 passed, 0 failed** (60 preserved + 3 new).
- `npm test` (full suite): **209 passed, 0 failed** (27 `content.test.mjs` + 30 `worker-auth.test.mjs` + 19 `d1-migration.test.mjs` + 20 `worker-admin-dashboard.test.mjs` + 17 `d1-audit.test.mjs`, all five unchanged and still passing, + 63 `worker-admin-projects.test.mjs` + 33 `worker-admin-media.test.mjs`).

### Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `7c7e6d3...` before any file was touched |
| Empirical scratch probe of the amended migration against a **fresh** local D1 instance (not committed) | See "Empirical validation" above — every assertion passed |
| `node --test tests/worker-admin-media.test.mjs` | 33 passed, 0 failed |
| `node --test tests/worker-admin-projects.test.mjs` | 63 passed, 0 failed |
| `npm test` (full suite) | 209 passed, 0 failed |
| `npm run build` | Succeeded, unchanged routes (`/`, `/_not-found`, `/admin`) |
| `npx wrangler d1 migrations apply DB --local` (fresh `--persist-to` directory) | `Resource location: local`; `0001` → 16 commands, `0002` → 5 commands, amended `0003_web_inc_004_media.sql` → 8 commands, all three recorded `✅` — no `--remote` flag used |
| `npx wrangler d1 execute DB --local --json --command "SELECT name FROM sqlite_master WHERE type='table' ..."` (same fresh directory) | Returned exactly the 15 existing tables plus `media`/`project_media` (17 product tables) alongside Wrangler's own `_cf_METADATA` bookkeeping table |
| `npx wrangler deploy --dry-run` | Succeeded; binding table unchanged (`env.DB`, `env.MEDIA`, `env.ASSETS`, `env.ACCESS_TEAM_DOMAIN`, `env.ACCESS_AUD`) — no new binding, no `remote: true`; "--dry-run: exiting now." |
| Secret/config scan | `grep` for JWT/PEM/private-key markers, `Bearer` tokens, `database_id`, `remote:\s*true`, and AWS-style key patterns across every changed file — zero matches beyond the pre-existing unrelated `url.password` property-name check |
| `git diff --stat 7c7e6d3` | Exactly 6 files changed, all modifications: `migrations/0003_web_inc_004_media.sql`, `worker/admin/media.mjs`, `worker/d1/media.mjs`, `worker/d1/validate.mjs`, `tests/worker-admin-media.test.mjs`, `tests/worker-admin-projects.test.mjs` |
| `git diff --stat 7c7e6d3 -- migrations/0001_web_inc_005_init.sql migrations/0002_web_inc_008_audit_log.sql` | Empty — both byte-identical |
| `git diff --stat 7c7e6d3 -- wrangler.jsonc worker/index.mjs worker/d1/schema.mjs worker/admin/dashboard.mjs worker/d1/projects.mjs worker/admin/projects.mjs` | Empty — none of these files changed |

Every D1/Wrangler command above used `--local`/local-simulation-only explicitly or performed no resource mutation at all (`--dry-run`); none used `--remote`.

### Known limitations (remediation-specific; see the original handoff section above for the rest)

- The `media.state` domain now structurally allows `archived`, but no admin capability can reach it — this remediation adds no archive endpoint, exactly as `AS26-F008` requires. A future, separately authorized increment would still need its own review before exposing that transition through any API.
- The DB-level alt-text `CHECK` relies on SQLite's built-in `trim()`, which strips ASCII spaces only (not tabs/newlines/other Unicode whitespace). The application layer's JS `.trim()` is stricter and runs first on every value that reaches the database through the admin API, so this gap is only reachable via a hypothetical future direct-SQL write path, not through any code in this repository.
- This evidence remains `ACTOR_REPORTED` until independently reviewed — no self-certification is made.

### Explicit confirmations

- **No redesign occurred.** Only the three cited findings were fixed; the route surface, revision model, audit allowlist, R2/D1 write ordering, and public-source boundary are all unchanged from the original implementation.
- **No new migration number.** `migrations/0003_web_inc_004_media.sql` was amended in place, exactly as `AS26-F008` instructed for this local-only, pre-acceptance migration. `migrations/0001_web_inc_005_init.sql` and `migrations/0002_web_inc_008_audit_log.sql` remain byte-identical.
- **No new route, no new table, no project delete, no other content-domain mutation.**
- **No real/remote R2 or D1 was touched.** `wrangler.jsonc` was not modified this cycle; both bindings remain `remote: false`.
- **No deployment occurred.** `npx wrangler deploy` was run only with `--dry-run`.
- **No protected/`main` merge occurred.** All work is on `governance/maisoglabs-v0.1` (mirrored to `claude/phase-0-governance-scope-w8o3jp`).
- **No later increment's work began**, including `UI-PATCH-001` (`D-030`), which remains explicitly queued until this cycle is Architect-accepted and closed.
- **No Sentinel S3+/CI-rulesets/Capability-Gateway/Task-Engine/Orchestrator work began.**
- **`MEDIA_MUTATION_AUTHORIZED: YES`, `MUTATION_AUTHORIZED: YES`, `AUDIT_APPEND_AUTHORIZED: YES`** apply only to this exact bounded remediation; **`REMOTE_R2_AUTHORIZED`, `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.
- **The Implementer has not self-certified this implementation as `ARCHITECT VERIFIED`.** Per `CORE-020`, all runtime/test results above remain `ACTOR_REPORTED` until independently reviewed.

### Remediation commit

The files above are committed to `governance/maisoglabs-v0.1` as commit `681fc90dc42239c2bd5866af1c6a0d430212416a` on top of remediation base `7c7e6d35c43c2e16b18d53a65c8acf06c7c3df41`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. Both commits will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## UI-PATCH-001 — Soft Geometry Pass

Cycle ID: `MAISOGLABS-UI-PATCH-001-SOFT-GEOMETRY`

Authority chain: `D-030` (Paulo, "Okay proceed" after approving the softer design direction) → active cycle authorization (`coordination/STATE.md`/`coordination/ARCHITECT_REVIEW.md`, "`UI-PATCH-001 AUTHORIZED — CLAUDE TO IMPLEMENT SOFT GEOMETRY PASS AND HAND OFF FOR ARCHITECT REVIEW`").

### Objective

Implement a bounded, presentation-only softening pass on the public site: replace the current `sharp + rigid + HUD-like + heavily technical` visual treatment with `cinematic + modern + calm + premium + soft-edged`, while preserving the approved V3 cinematic composition, content, navigation, public data source, and all application functionality exactly. No theme system, no admin design controls, no route/API/auth/Worker/D1/R2/schema/dependency change.

### Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `4fac5ecc79394f9bb073961b24a923fccf04602b` — matches exactly the SHA the request required.
- Result SHA (implementation commit): `61db9abb3c1f246fdf43850843db7967ab291645`
- Read in full before any edit, in the exact required order: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md`, `docs/product/UI_PATCH_001_SOFT_GEOMETRY.md`, `docs/product/UI_UX_SPEC.md`, `brand/V3/DESIGN_MAP.md`, `brand/V3/guidelines/V3_DIRECTION.md`, `brain/DECISION_LOG.md`'s `D-030` entry. Also read `app/globals.css` in full (the sole authorized implementation surface) before making any change.

### Exact changed-file list — 1 file

- `app/globals.css` — the only file changed. No component/class-name edit was needed anywhere (`components/ProjectRail.js`, `components/BlueprintIcon.js`, `app/page.js`, `app/layout.js` are all byte-unchanged) — every required softening was achievable purely through the existing selectors' own CSS declarations.

**No other file changed.** `git diff --stat` against `package.json`, `package-lock.json`, `wrangler.jsonc`, `worker/`, `migrations/`, `app/page.js`, `app/admin/`, `data/site.js`, `lib/content/` is empty for every path.

### Before/after summary

Introduced a small, coherent corner-radius token hierarchy in `:root` (`--radius-sm: 10px`, `--radius-md: 16px`, `--radius-lg: 22px`) instead of hardcoding one radius (or none) everywhere, then applied it by tier:

| Element | Before | After |
|---|---|---|
| `.header-action`, `.primary-action` (CTA buttons) | Hard `border-radius: 3px`; near-rectangular | `var(--radius-md)` (16px) — softly rounded, restrained, not a full pill; padding increased (17px→20px / 20px→24px horizontal) for breathing room |
| `.dock-icon`, `.panel-icon`, `.process-icon` (icon containers, shared rule) | No radius on `.panel-icon`/`.process-icon` (hard square); `.dock-icon` had `3px` | `var(--radius-sm)` (10px) applied to the shared selector — consistent soft-square icon frames across the foundation dock, project cards, and process dock |
| `.foundation-dock`, `.project-panel`, `.process-grid`, `.about-panel` (cards/panels) | No radius at all — sharp rectangular HUD boxes | `var(--radius-lg)` (22px); `.foundation-dock`/`.project-panel`/`.process-grid` also gained `overflow: hidden` so hover backgrounds and interior accents clip cleanly to the new rounded corners |
| `.project-panel::after` (inner decorative border overlay) | Sharp inset border, no radius | `calc(var(--radius-lg) - 6px)` — concentric with the now-rounded outer card |
| `.rail-controls button`, `.skip-link` | Hard square / `0.3rem` | `var(--radius-sm)` |
| `.blueprint-frame` (fixed corner overlay) | Sharp rectangle, `border` alpha 0.22 | `var(--radius-lg)`; border alpha reduced to 0.16 |
| `.blueprint-frame i` (decorative corner brackets) | 34×34px, opacity 0.7, sharp joint | 26×26px, opacity 0.45, `border-radius: 4px` on the joint — smaller, quieter, softer, per the brief's explicit "may be softened, shortened, reduced in opacity, or made less dominant" |
| Divider/border contrast (`.foundation-dock` border, `.foundation-dock a` dividers, `.process-grid article` dividers, incl. all 3 responsive-breakpoint redeclarations of the same divider color; `.dock-icon`/`.process-icon` borders) | `rgba(122, 162, 255, 0.34)` / `0.18` / `0.58` | Reduced to `0.24` / `0.12` / `0.46` respectively — gentler without losing legible separation |
| Shadows (`.foundation-dock`, `.project-panel` default + hover, `.primary-action`) | e.g. `0 24px 70px rgba(0,0,0,0.44)` | Softened alpha/spread modestly, e.g. `0 24px 60px rgba(0,0,0,0.36)` — kept the sense of depth, reduced the harshness |
| `.project-panel`, `.process-grid article` internal padding | 26px / 28px | 30px / 32px — modest extra breathing room |

Everything else (colors, typography, layout grid, composition, copy, the cinematic background asset, the orbital logo, motion timings, and the entire `@media (prefers-reduced-motion: reduce)` block) is byte-unchanged.

### Visual verification (this cycle's own evidence, beyond source inspection)

Ran `npm run build` against both the pre-change and post-change source (via `git stash`), served both `out/` directories locally, and captured headless-Chromium screenshots (Playwright, pre-installed Chromium) at desktop (1440×900) and mobile (390×844) viewports for the hero/header, foundation dock, project rail, and process/about sections. Confirmed visually:
- CTAs read as softly rounded rather than sharp rectangles;
- project cards, process dock, and the foundation dock now have clearly rounded outer corners instead of hard HUD-box edges, while interior grid dividers stay crisp (no accidental over-rounding of everything);
- icon frames are consistently softened across all three icon contexts;
- the same softening is coherent at both the 1440px and 390px viewports, including the foundation dock's 2×2 mobile grid;
- content, copy, layout positions, and the cinematic background composition are pixel-identical to before except for the intended geometry/border/shadow changes.

### Responsive / reduced-motion preservation (by source inspection)

- No media query (`max-width: 1050px` / `740px` / `540px`) redefines `border-radius`, `overflow`, or introduces a new shape rule — every softened property lives on the base (cascading) selector, so mobile/tablet inherit the same treatment automatically. The only mobile-specific edits were the 3 divider-color redeclarations inside the `740px`/`1050px`/`540px` blocks that independently hardcoded the same alpha value as the desktop rule (`rgba(122, 162, 255, 0.18)`) — these were updated to `0.12` in lockstep so desktop and mobile stay coherent, per the validation checklist.
- The `@media (prefers-reduced-motion: reduce)` block (lines 192-195 pre-change, same content post-change) was not touched — confirmed by `git diff` showing zero lines changed in or near that block.
- No animation/transition duration, timing function, or new motion was added; the only `transform`/`transition` properties already present are unchanged.

### Functional-boundary confirmation

`git diff --stat` against `package.json`, `wrangler.jsonc`, every `worker/` file, every `migrations/` file, `app/page.js`, `app/admin/`, `data/site.js`, and `lib/content/` is empty — no route, API, auth, Worker, D1, R2, schema, content, or dependency file changed. `app/globals.css` is a pure presentation file with no logic; this change cannot affect any of those boundaries by construction.

### Test results

- `npm test` (full suite): **209 passed, 0 failed** — unaffected, since no application code was touched.
- `npm run build`: succeeded, identical routes (`/`, `/_not-found`, `/admin`).

### Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `4fac5ec...` before any file was touched |
| `npm test` | 209 passed, 0 failed |
| `npm run build` | Succeeded, unchanged routes (`/`, `/_not-found`, `/admin`) |
| `git stash` + `npm run build` (pre-change) + `git stash pop` + `npm run build` (post-change) | Both succeeded; used only to produce the before/after screenshot comparison, working tree restored exactly afterward (`git status` clean except the intended `app/globals.css` change) |
| Headless-Chromium (Playwright, pre-installed browser) screenshots of both builds at 1440×900 and 390×844 | See "Visual verification" above |
| `git diff --stat` against `package.json`, `package-lock.json`, `wrangler.jsonc`, `worker/`, `migrations/`, `app/page.js`, `app/admin/`, `data/site.js`, `lib/content/` | Empty for every path |
| `git diff app/globals.css` | Confirms the `@media (prefers-reduced-motion: reduce)` block and every color/typography/layout value not listed in the before/after table above are byte-unchanged |

No deployment, no remote resource, no `wrangler` D1/R2 command of any kind was run this cycle — there was nothing to migrate, deploy, or touch remotely, since this is a pure CSS change with no runtime/data surface.

### Known limitations

- No automated visual-regression test exists in this repository (`TEST-WEB-003: NOT IMPLEMENTED`, per `brain/TEST_LEDGER.md`) — the visual verification above is this cycle's own screenshot comparison, not a permanent regression guard. This is a pre-existing gap, not something this cycle was scoped to close.
- This evidence remains `ACTOR_REPORTED` until independently reviewed — no self-certification is made.

### Explicit confirmations

- **No theme-system architecture, `theme_settings`/`theme_settings_revisions` table, or admin design control was implemented.**
- **No free-form CSS/JS input, logo redesign, or content rewrite occurred.** The canonical orbital logo assets and every piece of copy are byte-unchanged.
- **No route, API, auth, Worker, D1, R2, or schema/migration file changed.**
- **No dependency was added.** `package.json`/`package-lock.json` are unchanged.
- **No real/remote resource was touched, and no deployment occurred.** No `wrangler` command was run this cycle.
- **No protected/`main` merge occurred.** All work is on `governance/maisoglabs-v0.1` (mirrored to `claude/phase-0-governance-scope-w8o3jp`).
- **No later WEB-INC or Sentinel S3+ work began.**
- **All runtime/data authorities remain `NO`:** `MEDIA_MUTATION_AUTHORIZED`, `MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED`, `REMOTE_R2_AUTHORIZED`, `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` — unchanged by this cycle, and this cycle needed none of them.
- **The Implementer has not self-certified this implementation as `ARCHITECT VERIFIED`.** All runtime/test/visual evidence above remains `ACTOR_REPORTED` until independently reviewed.

### Implementation commit

The file above is committed to `governance/maisoglabs-v0.1` as commit `61db9abb3c1f246fdf43850843db7967ab291645` on top of base `4fac5ecc79394f9bb073961b24a923fccf04602b`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. Both commits will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## WEB-INC-006 — Local Journal Subsystem

Cycle ID: `MAISOGLABS-WEB-INC-006-JOURNAL`

Authority chain: `WEB-REQ-009` → `ML-DEVOS-RFC-009` → `ML-DEVOS-AS-028` (`ARCHITECT_APPROVED — WEB-INC-006 LOCAL JOURNAL ARCHITECTURE COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`) → `D-031` (Paulo: authorized twice via `Authorized`, with WEB-INC-006 Journal explicitly identified as the active next cycle).

### Objective

Add a locally-simulated Journal content type bounded to exactly the scope AS28-F001–F016 authorize: three new tables (`journal_entries`, `journal_entry_revisions`, `journal_media`), the protected admin journal lifecycle (create/edit/preview/publish/unpublish), bounded journal status in the authenticated dashboard, the first public/unauthenticated Worker read API (`GET /api/journal`, `GET /api/journal/:slug`), and a statically exported `/journal` shell that consumes it. No journal delete, no slug rename, no Markdown/HTML rendering, no public media-object serving, no remote resource, no deployment, no main merge, no WEB-INC-007, no Sentinel S3+.

### Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `28039221fc2b6fede35cee7ce02ff76be3dbcea0` — matches exactly the SHA the request required.
- Result SHA (implementation commit): `cdc8f84cbdb2c5a76336512b6c0e5111030d3e4e`
- Read in full before any edit, in the exact required order: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-028`, all 16 findings `AS28-F001`–`F016`), `devos/changes/rfcs/ML-DEVOS-RFC-009.md` (full, 446 lines), `devos/changes/architect-syncs/ML-DEVOS-AS-028.md` (confirmed byte-identical durable archive of the concluding rolling review), `brain/DECISION_LOG.md`'s `D-031` entry, `docs/product/PRD.md`'s `WEB-REQ-009` entry, `docs/product/BUILD_PLAN.md`'s `WEB-INC-006` ownership section, `docs/product/DATA_BACKEND_SPEC.md`'s `journal_entries`/`journal_entry_revisions`/`journal_media` sections, `docs/product/APP_FLOW.md`'s journal flow references. Also re-read `worker/d1/schema.mjs`, `worker/d1/projects.mjs`, `worker/admin/projects.mjs`, `worker/d1/media.mjs`, `worker/d1/audit.mjs`, `worker/d1/validate.mjs`, `worker/auth.mjs`, `worker/index.mjs`, `worker/admin/dashboard.mjs`, `worker/d1/repository.mjs`, `wrangler.jsonc`, `app/page.js`, `app/layout.js`, and `components/Logo.js` in full to plan an implementation that reuses every already-accepted pattern rather than inventing new ones, and confirmed via `git diff` after implementation that the historical migrations/modules stayed byte-identical where required.

### Exact changed-file list — 21 files (8 new, 13 modified)

**New (8):**
- `migrations/0004_web_inc_006_journal.sql` — `journal_entries`, `journal_entry_revisions` (immutable-by-trigger except the one-time `published_at` transition), `journal_media` (mirrors `project_media`'s immutability/duplicate-association/duplicate-slot triggers exactly)
- `worker/d1/journal.mjs` — journal mutation D1 helpers (`validateJournalRevisionContent`, `buildCreateDraftBatch`/`buildEditDraftBatch`/`buildPublishBatch`/`buildUnpublishBatch`, the commit-time stale-write guard) mirroring `worker/d1/projects.mjs`
- `worker/admin/journal.mjs` — the admin HTTP dispatcher for the five authorized routes, mirroring `worker/admin/projects.mjs`'s exact request-hardening/stale-write/revalidation conventions, extended to also revalidate referenced media at publish time
- `worker/public/journal.mjs` — the public, unauthenticated, GET-only journal read API
- `app/journal/page.js`, `app/journal/JournalClient.js` — the statically exported `/journal` shell and its client-side fetch/render component
- `tests/worker-admin-journal.test.mjs` — 44 new tests
- `tests/worker-public-journal.test.mjs` — 16 new tests

**Modified, substantive (10):**
- `worker/d1/schema.mjs` — purely additive: `JOURNAL_TABLE_NAMES`, `FULL_PRODUCT_TABLE_NAMES`, `readJournalMigrationSql()`, `applyJournalMigration(db)`, `applyFullSchema(db)`. Every pre-existing export (`AUTHORIZED_TABLE_NAMES`, `CURRENT_PRODUCT_TABLE_NAMES`, `ALL_PRODUCT_TABLE_NAMES`, `applySchema`, `applyAuditMigration`, `applyCurrentSchema`, `applyMediaMigration`, `applyAllMigrations`, `listProductTables`) is byte-unchanged.
- `worker/d1/validate.mjs` — purely additive: `validateJournalSlug`/`validateJournalId` (mirroring `validateProjectSlug`/`validateProjectId`, plus reserved `journal`/`api` names), `validateJournalTitle`/`validateJournalSummary` (the same trim-and-return-normalized pattern as `validateAltText`), `validateJournalBody` (line-ending normalization, plain-text-only character bounds).
- `worker/d1/audit.mjs` — purely additive: `buildJournalRevisionAuditStatement`, the journal equivalent of `buildProjectRevisionAuditStatement`.
- `worker/d1/media.mjs` — purely additive: `readJournalMediaSnapshot`, `buildJournalMediaInsertStatements`, the journal equivalents of the existing project-media helpers already living in this file.
- `worker/d1/repository.mjs` — purely additive: `readJournalDashboardStatusRows`, a standalone bounded query (not a new `COLLECTIONS` entry, since journal has no order/visibility concept the generic collection abstraction assumes) — `COLLECTIONS`/`readPublishedCollection`/the legacy parity projection are untouched.
- `worker/auth.mjs` — adds `isPublicJournalApiPath` and one new branch at the very top of `handleRequest`, classified before `isProtectedPath`/any Access verification, dispatching to an optional new `publicDispatch` callback. Every existing branch/behavior is unchanged for every other path.
- `worker/index.mjs` — wires `publicDispatch` to the new `handlePublicJournalDispatch`, threading `env.DB` only (no `env.MEDIA` needed for public reads).
- `worker/admin/dashboard.mjs` — routes `/admin/api/journal*` to the new `handleJournalDispatch`, and adds a `journal` key to `buildDashboardPayload`'s output (bounded lifecycle metadata only).
- `wrangler.jsonc` — widens `assets.run_worker_first` to add exactly `/api/journal` and `/api/journal/*` alongside the existing `/admin`/`/admin/*`.
- `app/globals.css` — adds a bounded set of new `.journal-*` classes for the new page, reusing the existing V3/soft-geometry color/radius tokens; no existing rule was changed.

**Modified, test-fixture-only (3):** `tests/worker-admin-dashboard.test.mjs`, `tests/d1-audit.test.mjs`, `tests/worker-admin-projects.test.mjs` — see "Test fixture updates" below.

**No other file changed.** In particular: `migrations/0001_web_inc_005_init.sql`/`0002_web_inc_008_audit_log.sql`/`0003_web_inc_004_media.sql`, `worker/d1/projects.mjs`, `worker/admin/projects.mjs`, `app/page.js`, `data/site.js`, `lib/content/*`, and `package.json`/`package-lock.json` are all byte-identical — confirmed by `git diff --stat` against every one of those paths returning empty.

### Schema evidence (AS28-F002)

`migrations/0004_web_inc_006_journal.sql` adds exactly three tables:
- `journal_entries(id, slug, created_at, published_revision_id, draft_revision_id)` — identity + immutable metadata + pointers only, exactly like `projects`; `slug` `CHECK`-excludes the existing reserved names plus `journal`/`api`; the two composite foreign keys enforce that a pointer can only reference a revision owned by the same entry.
- `journal_entry_revisions(id, journal_entry_id, revision_number, title, summary, body, published_at, created_at, created_by)` — `title`/`summary` use the exact `= trim(...) AND length(...) BETWEEN ...` backstop pattern as `media.alt_text` (1–160 / 1–800); `body` is bounded 1–20000 characters and rejects any embedded carriage-return byte (`instr(body, char(13)) = 0`), backstopping the application layer's line-ending normalization. `journal_entry_revisions_guard` (a `BEFORE UPDATE` trigger) rejects any change to any column except the one-time `published_at: NULL -> non-null` transition — a genuinely new, stronger-than-`project_revisions` immutability guarantee, per AS28-F007. `journal_entry_revisions_reject_delete` blocks all deletion.
- `journal_media(id, journal_entry_revision_id, media_id, role, sort_order)` — byte-for-byte the same shape, the same two independent `UNIQUE` constraints (`(revision_id, media_id, role)` and `(revision_id, role, sort_order)`), and the same two immutability/non-delete triggers as `project_media`.

Product-table count: `17 → 20`.

### Empirical DDL/trigger validation (before finalizing the migration)

A disposable scratch script (not committed) applied `applyFullSchema` against a real local D1 instance via `getPlatformProxy` and confirmed, in order: exactly 20 tables; a cross-entity pointer update rejected by the composite foreign key, an own-entity pointer update accepted; both new reserved slugs (`journal`, `api`) rejected by the `CHECK`; a direct `UPDATE` of `title` on an existing revision rejected; the one-time `published_at` transition accepted; a second `published_at` rewrite rejected; a true no-op update (identical values) accepted; a revision `DELETE` rejected; an untrimmed `title` insert rejected; a `body` containing a CR byte rejected; an empty `body` rejected; a duplicate `revision_number` rejected; `journal_media` duplicate-association and duplicate-slot inserts both rejected while a distinct valid slot succeeds; a direct `UPDATE`/`DELETE` against an existing `journal_media` row rejected; and a second `applyFullSchema` run confirmed idempotent. The script was deleted after use.

### Admin lifecycle evidence (AS28-F009)

- **Boundary**: identical to the accepted project lifecycle — verified Access first, bounded non-empty subject (403 if absent on any mutating route, but not on preview), same-origin, JSON-only, a byte-accurate bounded body reader (96 KiB budget — sized for a 20,000-character body at worst-case 4 bytes/char UTF-8 — implemented as its own separate copy, exactly like `worker/admin/media.mjs`'s, to avoid any risk of regressing the already-reviewed project/media byte-budget code), server-side field validation, explicit expected-pointer inputs on edit/publish/unpublish, and the same commit-time stale-write guard technique (`journalStalePointerGuardedSlugAssignment`, poisoning `slug` against the entry's own reserved-word `CHECK`) as `worker/d1/projects.mjs`'s accepted `stalePointerGuardedSlugAssignment`.
- **Create draft**: one D1 batch — base entry, revision 1, optional `journal_media` snapshot inserts, draft pointer, success audit (`journal_create_draft`).
- **Edit draft**: a new immutable revision; media omitted inherits the source revision's snapshot (current draft, else current published); media supplied fully replaces the new revision's snapshot; the prior revision and its `journal_media` rows are never touched.
- **Preview**: authenticated, draft-only, returns the exact current draft's content and bounded media metadata; never falls back to published content.
- **Publish**: fully re-reads and revalidates the persisted draft's content AND its referenced media's continued active state before promoting; atomic batch sets `published_at` (guarded `WHERE published_at IS NULL`), moves `published_revision_id`, clears `draft_revision_id`, appends success audit (`journal_publish`); the prior published revision is never deleted.
- **Unpublish**: atomic batch clears `published_revision_id` only; every revision/media row, including the now-set `published_at`, survives untouched; appends success audit (`journal_unpublish`).
- **Audit**: exactly the four authorized actions (`journal_create_draft`/`journal_edit_draft`/`journal_publish`/`journal_unpublish`), entity type `journal_entry`, success atomic with the business mutation, bounded `result: failure` rows on authenticated failure paths with a safe entity reference.

### Public API evidence (AS28-F003/F004/F010)

- **Routing separation**: `worker/auth.mjs`'s `handleRequest` classifies `isPublicJournalApiPath` as the very first branch — before `isProtectedPath`, before any `getJWKS`/Access-verification call. A dedicated test proves the public route is served even when `getJWKS` and the admin `dispatch` callback are both wired to throw if called at all; a companion test proves `/admin/api/*` still returns `401` with no token, unaffected by the new public branch.
- **Published-only, never draft**: both `GET /api/journal` and `GET /api/journal/:slug` join only through `journal_entries.published_revision_id`; `draft_revision_id` is never read by either query. A draft-only entry, a published-then-unpublished ("archived") entry, and an entry with both a published and a newer draft revision are all covered by dedicated tests — the last one proves the *published* half is what's returned, with the draft half's distinguishing content never appearing in the response.
- **Ordering**: `ORDER BY published_at DESC, id DESC` (the revision's own autoincrement id as the deterministic tie-break) — verified against a two-entry fixture.
- **Positive allowlists**: index entries are exactly `{slug, title, summary, publishedAt, media}`; detail is exactly `{slug, title, summary, body, publishedAt, media}`; media entries are exactly `{id, contentType, altText, role, order}` — `storage_key`, `uploaded_by`, and any draft-revision id are never selected by the underlying SQL in the first place, not merely omitted at serialization time. Dedicated tests grep the raw response text for `storage_key`, the literal stored object path, `uploaded_by`, `cf-access`, and `draftrevisionid`.
- **Fail-closed**: `POST`/`PUT`/`DELETE` on either route return `405` with zero D1 access; an unrecognized `/api/journal/x/y` sub-path returns `404` with zero D1 access; a missing `DB` binding returns `503` on both routes without crashing.

### Dashboard evidence (AS28-F012)

`buildDashboardPayload` gains a `journal` array using the exact same allowlisted shape (`serializeEntityRow(row, { includeSlug: true })`) every other entity collection already uses — `id`/`slug`/`state`/`publishedRevisionId`/`draftRevisionId`/`displayLabel` only. A dedicated test creates a journal entry with deliberately distinctive `summary`/`body` values and confirms neither appears anywhere in the serialized dashboard payload.

### Static `/journal` shell evidence (AS28-F011)

`npm run build` confirms `/journal` is prerendered as static content (`○ (Static)`), alongside the unchanged `/`, `/_not-found`, and `/admin` routes — no dynamic/SSR route was introduced. `app/journal/page.js` imports only `getPublicContent` (the existing static content module, unrelated to D1) and `components/Logo`; no D1 module is imported by anything under `app/`. `app/journal/JournalClient.js` is a `"use client"` component that fetches the two public API routes at runtime via `fetch()`; journal body content is rendered as a `<p>` element's plain text child — no `dangerouslySetInnerHTML` anywhere in the file (confirmed by `grep`).

### Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `2803922...` before any file was touched |
| Empirical scratch probe of the new migration's DDL/triggers against a real local D1 instance (not committed) | See "Empirical DDL/trigger validation" above — all assertions passed |
| `node --test tests/worker-admin-journal.test.mjs` | 44 passed, 0 failed |
| `node --test tests/worker-public-journal.test.mjs` | 16 passed, 0 failed |
| `npm test` (full suite) | 269 passed, 0 failed |
| `npm run build` | Succeeded; routes `/`, `/_not-found`, `/admin`, `/journal`, all static |
| `npx wrangler d1 migrations apply DB --local` (fresh `--persist-to` directory) | `Resource location: local`; `0001` → 16 commands, `0002` → 5 commands, `0003` → 8 commands, `0004` → 9 commands, all four recorded `✅` — no `--remote` flag used |
| `npx wrangler d1 execute DB --local --json --command "SELECT name FROM sqlite_master WHERE type='table' ..."` (same fresh directory) | Returned exactly the 17 existing tables plus `journal_entries`/`journal_entry_revisions`/`journal_media` (20 product tables) alongside Wrangler's own `_cf_METADATA` bookkeeping table |
| Seed one published journal entry via `wrangler d1 execute --local` (raw SQL, real CLI) | Row inserted successfully |
| `npx wrangler dev --local` + `curl` (unauthenticated, real Workers/Miniflare runtime) | `GET /` → `200` (public unaffected); `GET /journal` → `200` (static shell); `GET /api/journal` → `200` with the seeded entry; `GET /api/journal/smoke-entry` → `200` with full detail; `GET /api/journal/does-not-exist` → `404`; `POST /api/journal` → `405`; `POST /admin/api/journal` (no token) → `401`; `GET /admin/api/journal/x/preview` (no token) → `401`; `GET /admin/api/dashboard` (no token) → `401`, unaffected; `GET /nope` → `404`, unaffected — every route behaves exactly as required in the real local runtime |
| Headless-Chromium (Playwright, pre-installed browser) screenshot of `/journal` against the running `wrangler dev` instance | Index card renders the seeded entry; clicking it navigates to the query-param detail view and renders title/summary/body correctly, in the V3/soft-geometry visual language |
| `npx wrangler deploy --dry-run` | Succeeded; binding table unchanged (`env.DB`, `env.MEDIA`, `env.ASSETS`, `env.ACCESS_TEAM_DOMAIN`, `env.ACCESS_AUD`) — no new binding, no `remote: true`; "--dry-run: exiting now." |
| Secret/config scan | `grep` for JWT/PEM/private-key markers, `Bearer` tokens, `database_id`, `remote:\s*true`, and AWS-style key patterns across every new/changed file — zero matches beyond explanatory "no secret" comments and deliberate `SECRET_*_SHOULD_NOT_LEAK` negative-test fixtures |
| `git diff --stat` against every "not touched" path (`migrations/0001-0003`, `worker/d1/projects.mjs`, `worker/admin/projects.mjs`, `app/page.js`, `data/site.js`, `lib/content/*`, `package.json`) | Empty for every path |
| `git diff --stat` (overall) | 21 files changed, all additive except the 3 test-fixture updates and the routing/dispatch wiring described above |

Every D1/Wrangler command above used `--local`/local-simulation-only explicitly or performed no resource mutation at all (`--dry-run`); none used `--remote`.

### Test fixture updates (why three existing files needed a one-line addition)

`buildDashboardPayload` now unconditionally reads `journal_entries`/`journal_entry_revisions` (AS28-F012), so any test database that calls it needs those two tables to exist — a real deployment always applies all migrations together, but three existing test files each open their own database at a narrower, intentionally-frozen historical schema level:

- `tests/worker-admin-dashboard.test.mjs` (`applySchema`, migration 0001 only) — its shared `openTestDb()` now also calls `applyJournalMigration`, since this file has no frozen table-count assertion of its own to protect.
- `tests/d1-audit.test.mjs` (`applyCurrentSchema`, migrations 0001+0002) — this file's shared fixture is untouched (it protects two `assert.equal(tables.length, 15)` assertions that are `WEB-INC-008`'s own frozen evidence); only the one test that calls `buildDashboardPayload` additionally calls `applyJournalMigration(db)` locally, before that call.
- `tests/worker-admin-projects.test.mjs` (`applyAllMigrations`, migrations 0001-0003) — same surgical approach: the shared fixture is untouched (it protects an `assert.equal(tables.length, 17)` assertion that is `WEB-INC-004`'s own frozen evidence); only the one dashboard-calling test additionally calls `applyJournalMigration(db)` locally.

In all three files, the dashboard response's key-list assertions were updated to include the new `journal` key — the same kind of legitimate, intentional evolution as the `AS26-F008` remediation's 15→17-table assertion update, not a change to any file's own historical/frozen migration evidence.

### Known limitations

- No automated visual-regression test exists in this repository (pre-existing gap, `TEST-WEB-003: NOT IMPLEMENTED`) — the `/journal` page's visual verification above is this cycle's own screenshot check, not a permanent regression guard.
- The publish-time media-revalidation guard (rejecting a draft whose referenced media has since become inactive) is exercised by directly setting `media.state = 'archived'` via raw SQL in the test, since no code path in this or any prior increment can reach that transition through an API — the guard exists and is proven to fire, but the scenario it guards against is not reachable through any authorized surface today.
- This evidence remains `ACTOR_REPORTED` until independently reviewed — no self-certification is made.

### Explicit confirmations

- **No real/remote D1 or R2 was touched.** Both bindings remain `remote: false`; every D1/Wrangler command above ran `--local` or performed no mutation (`--dry-run`).
- **No public media-object serving exists.** The public journal API returns only bounded media metadata (id/contentType/altText/role/order) — never a storage key, and no route serves raw object bytes.
- **No journal delete, slug rename, or redirect-history capability exists.**
- **No Markdown/HTML/rich-text execution exists anywhere** — `journal_entry_revisions.body` is plain text only, validated/normalized server-side, and rendered client-side as escaped plain text (no `dangerouslySetInnerHTML`).
- **No homepage/projects public D1 cutover occurred.** `app/page.js`/`data/site.js`/`lib/content/*` are byte-unchanged; the public site's existing content continues to come from the same source as before this increment.
- **No deployment occurred.** `npx wrangler deploy` was run only with `--dry-run`.
- **No protected/`main` merge occurred.** All work is on `governance/maisoglabs-v0.1` (mirrored to `claude/phase-0-governance-scope-w8o3jp`).
- **No `WEB-INC-007` or later increment's work began.** No theme table, no admin design controls, no free-form CSS/JS input.
- **No Sentinel S3+/CI-rulesets/Capability-Gateway/Task-Engine/Orchestrator work began.**
- **`MEDIA_MUTATION_AUTHORIZED` remains `NO`** — this increment adds no media upload/update/archive capability of any kind; it only ever reads already-active media rows. **`MUTATION_AUTHORIZED: YES`/`AUDIT_APPEND_AUTHORIZED: YES`** apply only to this exact bounded journal-lifecycle scope; **`REMOTE_R2_AUTHORIZED`, `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.
- **The Implementer has not self-certified this implementation as `ARCHITECT VERIFIED`.** All runtime/test/visual evidence above remains `ACTOR_REPORTED` until independently reviewed.

### Implementation commit

The files above are committed to `governance/maisoglabs-v0.1` as commit `cdc8f84cbdb2c5a76336512b6c0e5111030d3e4e` on top of base `28039221fc2b6fede35cee7ce02ff76be3dbcea0`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. Both commits will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## WEB-INC-007 — Theme / Design Controls

### Objective

Implement `WEB-INC-007 — Theme / Design Controls` exactly per `ML-DEVOS-RFC-010`, `ML-DEVOS-AS-030` (architecture compatibility), `D-032` (Paulo implementation authorization), the screenshot-reference operating addendum `ML-DEVOS-AS-031`/`D-033`, and `brain/DECISION_LOG.md` D-032/D-033: a bounded, authenticated design-control system (theme presets/ranges + section visibility/order) with draft → preview → publish isolation, a narrow published-only public read API, and a fixed-mapping public runtime — never a free-form CSS/JS/HTML/URL/color/token input, never a visual-code editor, never a homepage/project public D1 cutover.

### Branch / commit state

- Base SHA (fast-forwarded before any file was touched): `ac2666860195a6e1c151ae363f7d176b61c12cde`
- Implementation SHA: `17577838d1007210cd1893fdb71ea8063d764fa8`
- Reading order followed before implementation began: `coordination/STATE.md` → `coordination/ARCHITECT_REVIEW.md` → `devos/changes/rfcs/ML-DEVOS-RFC-010.md` → `devos/changes/architect-syncs/ML-DEVOS-AS-030.md` → `devos/changes/architect-syncs/ML-DEVOS-AS-031.md` → `brain/DECISION_LOG.md` (D-032, D-033) → `docs/product/DESIGN_REFERENCE_WORKFLOW.md` → `docs/product/UI_UX_SPEC.md` → `docs/product/BUILD_PLAN.md` → `docs/product/DATA_BACKEND_SPEC.md` → `docs/product/APP_FLOW.md` → `docs/ARCHITECTURE.md`.

### Exact changed files (25: 9 new, 16 modified)

**New (9):**
- `migrations/0005_web_inc_007_theme.sql` — schema + bootstrap (see below).
- `worker/d1/theme.mjs` — theme mutation D1 helpers (edit-draft/publish batch builders, FK-poison stale-write guard).
- `worker/d1/section_design.mjs` — section design mutation D1 helpers (edit-draft/publish batch builders against the pre-existing `sections`/`section_revisions` tables, same FK-poison technique).
- `worker/admin/design.mjs` — bounded `/admin/api/design*` route dispatcher (status, preview, theme draft/publish, section draft/publish).
- `worker/public/design.mjs` — bounded public `GET /api/design` dispatcher.
- `app/DesignRuntime.js` — public design-application client runtime (fixed mappings only).
- `app/admin/DesignControls.js` — bounded authenticated design-control UI.
- `tests/worker-admin-design.test.mjs` — 49 tests.
- `tests/worker-public-design.test.mjs` — 13 tests.

**Modified (16):**
- `worker/d1/schema.mjs` — additive `THEME_TABLE_NAMES`/`COMPLETE_PRODUCT_TABLE_NAMES`/`readThemeMigrationSql`/`applyThemeMigration`/`applyCompleteSchema`; every prior export byte-unchanged.
- `worker/d1/validate.mjs` — additive theme enum/range validators (`validateThemeRevisionContent` and its exported vocabulary constants) and section-design validators (`validateManagedSectionId`, `validateSectionDesignContent`, `MANAGED_SECTION_IDS`).
- `worker/d1/audit.mjs` — additive `buildThemeRevisionAuditStatement`/`buildSectionRevisionAuditStatement` (same same-transaction-subquery pattern as the project/journal equivalents).
- `worker/d1/repository.mjs` — additive `readThemeDashboardStatusRow` (standalone query, not a `COLLECTIONS` entry).
- `worker/admin/dashboard.mjs` — imports/routes to `worker/admin/design.mjs`; `buildDashboardPayload` gains a bounded `theme` key.
- `worker/auth.mjs` — additive `isPublicDesignApiPath` (exact match, no wildcard) and its branch in `handleRequest`, classified before Access verification exactly like the Journal public path.
- `worker/index.mjs` — imports/wires the new public design dispatch; `publicDispatch` now routes between design and journal by exact path.
- `wrangler.jsonc` — `run_worker_first` widened by exactly one more entry: `/api/design` (no wildcard).
- `app/globals.css` — new theme-variant CSS keyed by fixed `data-*` attributes/CSS custom properties; `.v4-shell` becomes a flex column with default `order` on the four managed sections + footer (verified pixel-identical to the pre-increment block layout by screenshot comparison); `--line`/`--panel`/`--radius-*` become custom-property-driven with fallbacks equal to their prior literal values.
- `app/page.js` — adds exactly four `data-section="..."` attributes (home/projects/process/about); no other markup/content change.
- `app/layout.js` — mounts `<DesignRuntime />` once.
- `app/admin/page.js` — mounts `<DesignControls />` below the existing read-only dashboard; updated its own descriptive paragraph.
- `tests/worker-admin-dashboard.test.mjs` / `tests/d1-audit.test.mjs` / `tests/worker-admin-projects.test.mjs` — dashboard-key-list assertions extended with `theme`; see "Test fixture updates" below.
- `tests/worker-admin-journal.test.mjs` — one dashboard-calling test gets a local `applyThemeMigration(db)` call; see below.

**No other file changed.** In particular: `migrations/0001-0004`, `worker/d1/projects.mjs`, `worker/d1/journal.mjs`, `worker/admin/projects.mjs`, `worker/admin/journal.mjs`, `worker/public/journal.mjs`, `app/journal/page.js`, `app/journal/JournalClient.js`, `data/site.js`, `lib/content/*`, and `package.json`/`package-lock.json` are all byte-identical — confirmed by `git diff --stat` against every one of those paths returning empty.

### Schema evidence

`migrations/0005_web_inc_007_theme.sql` adds exactly two tables:
- `theme_settings(id, created_at, published_revision_id, draft_revision_id)` — singleton (`CHECK (id = 'default')`, so no second entity/rename is possible), pointers composite-FK'd to `theme_settings_revisions` exactly like every other base entity table in this schema.
- `theme_settings_revisions(id, theme_settings_id, revision_number, <15 DESIGN-* fields>, created_at, created_by)` — every enum field is `CHECK IN (...)`, every numeric field is `CHECK BETWEEN ...`, mirroring `worker/d1/validate.mjs`'s application-layer validators exactly. Immutable by DB trigger (`theme_settings_revisions_reject_update` rejects **every** UPDATE unconditionally — unlike `journal_entry_revisions`, there is no permitted transition here) and non-deletable (`theme_settings_revisions_reject_delete`).

Product-table count: `20 → 22`, confirmed by `tests/worker-admin-design.test.mjs`'s table-inventory test and by a direct `wrangler d1 execute --local` table listing during the local Wrangler smoke below.

Bootstrap: the same migration file deterministically inserts `theme_settings.id = 'default'` and one published `theme_settings_revisions` row (revision 1) matching the RFC-010 default values exactly (`cinematic-v3`/`soft-glass`/`comfortable`/`cinematic`/`standard`/`68`/`soft-glass`/`calm`/`respect-system`/`snap`/`stack`/`cobalt`/`74`/`25`/`100`), provenance `migration:web-inc-007`, no draft revision — verified by `tests/worker-admin-design.test.mjs`'s bootstrap-parity test and confirmed idempotent (re-applying the migration does not duplicate the bootstrap row).

### Empirical validation before finalizing the migration (probe-theme.mjs, not committed)

A disposable scratch script applied `applyCompleteSchema` against a real local D1 instance (`getPlatformProxy`) and confirmed, in order: exactly 22 tables matching `COMPLETE_PRODUCT_TABLE_NAMES`; bootstrap row/revision values exact; a cross-entity pointer update rejected by the composite FK; a second theme entity rejected by the `id` CHECK; invalid enum/out-of-range inserts rejected; a no-op update to the bootstrap revision rejected (fully immutable, no permitted transition); a delete rejected; the new **FK-poison stale-write guard technique** (see next section) validated both for `theme_settings` (a new table) and, separately, for the pre-existing `sections` table (migration 0001, unmodified) — confirming the technique needs no schema change to reuse against an already-shipped table. The script was deleted after use.

### The FK-poison commit-time stale-write guard (new technique, extending AS21-F007/AS28's poison-an-existing-constraint pattern)

`theme_settings` and (for DESIGN-002/003) the pre-existing `sections` table have no extra mutable column like `projects.slug`/`journal_entries.slug` to poison via a `CHECK` on guard failure. Instead, `worker/d1/theme.mjs` and `worker/d1/section_design.mjs` poison the very pointer column being written, using each table's own already-existing composite foreign key (`FOREIGN KEY (id, draft_revision_id) REFERENCES <entity>_revisions (<entity>_id, id)`) as the constraint that trips: `-1` can never be a valid `AUTOINCREMENT` revision id, so writing it when the guard's expected-pointer condition is false fails the FK check for the whole `UPDATE` statement, and because `db.batch()` is one transaction, every other statement in the same batch (the new revision INSERT, the success audit) rolls back too. This is a pure query-level technique — it required no schema change to reuse against `sections`, whose migration file (0001) remains byte-identical. Empirically validated (see above) for both the draft-edit case (poisoning `draft_revision_id`) and the publish case (poisoning `published_revision_id`, with `draft_revision_id`'s unconditional clear-to-`NULL` in the same statement rolling back together with it when the guard fails).

### Admin lifecycle evidence

- **Boundary**: identical to the accepted project/journal lifecycle — Access verified first, bounded non-empty `sub` required for every mutating route (403 otherwise, but not for the two read-only routes), same-origin, JSON-only, an 8 KiB bounded body reader (its own separate copy), server-side enum/range/unknown-field validation, explicit expected-pointer inputs on draft/publish, the FK-poison commit-time stale-write guard, atomic mutation + success audit, bounded failure audit, no false-success response.
- **Theme edit-draft** (`PUT /admin/api/design/theme/draft`): one new immutable revision; moves only `draft_revision_id`; published untouched.
- **Theme publish** (`POST /admin/api/design/theme/publish`): re-reads and fully revalidates the persisted draft, then atomically sets `published_revision_id := draft_revision_id`, clears `draft_revision_id`, appends success audit; the prior published revision is never deleted.
- **Section edit-draft/publish** (`PUT`/`POST /admin/api/design/sections/:id/draft|publish`): identical shape, restricted to exactly the four `MANAGED_SECTION_IDS` (`home`/`projects`/`process`/`about`) — any other id returns 404 before any mutation is attempted; no new section id, no delete, no rename.
- **Status** (`GET /admin/api/design`): bounded published/draft values for theme and all four sections, plus fixed server constants (`allowedValues`/`allowedRanges`) for the admin UI to render selects/ranges from — never derived from a DB read.
- **Preview** (`GET /admin/api/design/preview`): authenticated only; returns draft-if-present-else-published for both theme and each section (documented rationale: a screenshot-reference session commonly adjusts only a subset of controls in one draft cycle, and preview must remain useful for the half with no pending draft); never reachable without Access verification.
- **Audit**: exactly the four authorized actions (`theme_edit_draft`/`theme_publish`/`section_design_edit_draft`/`section_design_publish`), entity types `theme_settings`/`section`, success atomic with the business mutation, bounded `result: failure` rows on rejected attempts with a safe entity reference.
- **No caller-controlled audit action, no delete route, no generic key/value route, no free-form theme/CSS/JS/HTML endpoint, no media upload through this route family** — confirmed by dedicated tests (`no delete route exists for theme or sections`, unrecognized-subpath 404).

### Public API evidence

- **Routing separation**: `worker/auth.mjs` classifies `isPublicDesignApiPath` (exact match, never a wildcard) as part of the same first branch that already classifies public Journal paths — before `isProtectedPath`, before any Access verification. A dedicated test proves `GET /api/design` is served even when `getJWKS` and the admin `dispatch` callback are both wired to throw if called at all; a companion test proves `/admin/api/design` still 401s, unaffected.
- **Published-only, never draft**: the public projection joins only through `theme_settings.published_revision_id` and each section's own `published_revision_id`; `draft_revision_id` is never read by either query. A dedicated fixture seeds a published theme revision (2), a still-more-recent unpublished draft revision (3), three published sections, and one section with only a draft (never published) — the response contains exactly the published values and `null` for the never-published section; the raw response text is grepped for `draftRevisionId`/`draft_revision_id`/`createdBy`/`created_by` and none are found.
- **Positive allowlist**: exactly the 15 DESIGN-* theme fields and `{order, visible}` per section — no id, no `created_at`/`created_by`, no audit data, no storage key, no binding/config identifier.
- **Fail-safe shape**: if no published theme exists, `theme: null` is returned (not a 404/500) so `app/DesignRuntime.js` can safely fall back to the static baseline; an unpublished/nonexistent section resolves to `null` the same way.
- **Fail-closed**: `POST`/`PUT`/`DELETE` on `/api/design` return `405` with zero D1 access; `/api/design/anything` is not classified as the public path at all (confirmed via `isPublicDesignApiPath` unit test and an end-to-end request) and falls through to ordinary asset/404 handling — no wildcard route was created; a missing `DB` binding returns `503` without crashing.

### Public runtime evidence (`app/DesignRuntime.js`)

Source-inspected: fetches only `GET /api/design`; every enum value is independently re-validated against a hardcoded vocabulary array before being written as a `data-*` attribute (an invalid/unexpected value results in the attribute being removed, not written verbatim); every numeric value is bounds-checked before being written as a CSS custom property; section application touches only `style.order`/`style.display` on exactly the four hardcoded `[data-section="..."]` selectors. No `dangerouslySetInnerHTML`, no `<style>` construction from a server string, no `eval`/`Function`, no remote font/asset load, no arbitrary selector/URL from D1 — grepped and confirmed. A fetch failure/non-OK/malformed response is swallowed silently, leaving every attribute/property unset (fail-safe baseline).

### Admin UI evidence (`app/admin/DesignControls.js`)

Source-inspected: every control is a `<select>` populated from the server's `allowedValues`, an `<input type="range">`/`<input type="number">` bounded by the server's `allowedRanges`, or a checkbox — grepped and confirmed there is no `<input type="text">`/`<textarea>` anywhere in the file, and no raw-HTML-producing API (`dangerouslySetInnerHTML`, `innerHTML`) is used. Explicit Save Draft / Publish buttons per entity (theme + each of the four sections) and a Refresh Preview action; loading/error/success/stale-conflict states are rendered from the mutation response status (409 → conflict message + automatic reload; non-2xx → error message; 2xx → success message).

### CSS / layout evidence

- `.v4-shell` gained `display:flex; flex-direction:column` plus a hardcoded default `order` on `.hero`(1)/`.projects-section`(2)/`.process-section`(3)/`.about-section`(4)/`.site-footer`(999) — every other child of `.v4-shell` (background layers, blueprint frame, site header, skip link) is already `position:fixed`/`absolute` and therefore outside normal flow. Verified pixel-identical to the pre-increment block-layout rendering by before/after Playwright screenshot comparison at 1440×900 (no visual diff at default order).
- `--line`/`--panel` alpha channels and `--radius-sm/md/lg` are now driven by `var(--design-border-alpha, 0.25)`/`var(--design-panel-alpha, 0.74)`/`calc(var(--radius-*-base) * var(--design-radius-scale, 1))` — every fallback equals the exact prior literal, so an unmodified page (no `DesignRuntime` attribute/property set) renders byte-identically to the pre-WEB-INC-007 baseline.
- Every other DESIGN-* control (hero background, card style, density, typography, heading scale, panel/glass preset, animation, always-reduced motion, project rail mode, Journal card mode, accent) is implemented as a pre-authored `html[data-*="..."]` attribute-selector variant block — nothing is dynamically generated from a server string. `prefers-reduced-motion: reduce` remains fully independent and unconditionally in effect; `always-reduced` only ever adds the identical reduction via a separate attribute-selector mirror, never overriding or disabling the OS-level preference.

### Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `ac26668...` before any file was touched |
| Empirical scratch probe of the new migration's DDL/triggers/FK-poison guard (theme_settings and, separately, the pre-existing sections table) against a real local D1 instance (not committed) | See "Empirical validation" above — all assertions passed |
| `node --test tests/worker-admin-design.test.mjs` | 49 passed, 0 failed |
| `node --test tests/worker-public-design.test.mjs` | 13 passed, 0 failed |
| `npm test` (full suite) | 331 passed, 0 failed |
| `npm run build` | Succeeded; routes `/`, `/_not-found`, `/admin`, `/journal`, all static |
| `npx wrangler d1 migrations apply DB --local` (fresh `--persist-to` directory) | `0001`→16, `0002`→5, `0003`→8, `0004`→9, `0005`→9 commands, all five recorded `✅` — no `--remote` flag used |
| `npx wrangler d1 execute DB --local --json --command "SELECT name FROM sqlite_master ..."` | Returned exactly the 20 existing tables plus `theme_settings`/`theme_settings_revisions` (22 product tables) |
| Seed a non-default published theme revision via `wrangler d1 execute --local` (raw SQL, real CLI) | Row inserted successfully; `published_revision_id` moved to it |
| `npx wrangler dev --local` + `curl` (unauthenticated, real Workers/Miniflare runtime) | `GET /` → `200`; `GET /journal` → `200`; `GET /api/design` → `200` with the seeded non-default theme; `POST /api/design` → `405`; `GET /api/design/anything` → `404` (asset path, not the design dispatcher); `GET /admin/api/design` (no token) → `401`; `PUT /admin/api/design/theme/draft` (no token) → `401`; `GET /admin/api/dashboard` (no token) → `401`, unaffected; `GET /nope` → `404`, unaffected |
| Headless-Chromium (Playwright) screenshots of `/` against the running `wrangler dev` instance | Default published theme (revision 1) renders pixel-identical to the pre-WEB-INC-007 baseline; the seeded non-default theme (`deep-night`/`solid-night`/`spacious`/`editorial`/`display`/`opaque-night`/`minimal`/`always-reduced`/`free-scroll`/`rail`/`teal`) renders a visibly different hero background, accent color, and button styling on both `/` and `/journal` |
| `npx wrangler deploy --dry-run` | Succeeded; binding table unchanged (`env.DB`, `env.MEDIA`, `env.ASSETS`, `env.ACCESS_TEAM_DOMAIN`, `env.ACCESS_AUD`) — no new binding, no `remote: true`; "--dry-run: exiting now." |
| Secret/config scan | `grep` for JWT/PEM/private-key markers, `Bearer` tokens, `database_id`, `remote:\s*true`, and AWS-style key patterns across every new/changed file — zero matches beyond the pre-existing explanatory "no database_id" comment |
| `git diff --stat` against every "not touched" path (migrations 0001-0004, project/journal worker modules, `app/journal/*`, `data/site.js`, `lib/content/*`, `package.json`) | Empty for every path |
| `git diff --stat` (overall) | 25 files changed (9 new, 16 modified) |

Every D1/Wrangler command above used `--local`/local-simulation-only explicitly or performed no resource mutation at all (`--dry-run`); none used `--remote`.

### Test fixture updates (why four existing files needed a small addition)

`buildDashboardPayload` now unconditionally reads `theme_settings` (RFC-010 "Dashboard integration"), so any test database that calls it needs that table to exist:

- `tests/worker-admin-dashboard.test.mjs` (`applySchema` + `applyJournalMigration`, no frozen table-count assertion) — its shared `openTestDb()` now also calls `applyThemeMigration` directly.
- `tests/d1-audit.test.mjs` (frozen 15-table `applyCurrentSchema` fixture) — untouched; only the one `buildDashboardPayload`-calling test additionally calls `applyThemeMigration(db)` locally.
- `tests/worker-admin-projects.test.mjs` (frozen 17-table `applyAllMigrations` fixture) — untouched; same surgical local-call approach, plus the test's title updated from "same 8 keys" to "same 9 keys".
- `tests/worker-admin-journal.test.mjs` (frozen 20-table `applyFullSchema` fixture) — untouched; its one dashboard-calling test gets a local `applyThemeMigration(db)` call.

In all four files, dashboard-key-list assertions were updated to include the new `theme` key — the same kind of legitimate, intentional evolution as the prior cycle's `journal`-key addition, not a change to any file's own historical/frozen migration evidence.

### `TEST-ADM-009` evidence

`brain/TEST_LEDGER.md`'s `TEST-ADM-009` ("Theme settings remain within allowed values") was previously `NOT IMPLEMENTED` ("No theme-settings feature exists"). `tests/worker-admin-design.test.mjs` now directly covers this: every one of the 11 enum fields is tested against every allowed value (accepted) and one unknown value (rejected, 400); every one of the 4 numeric fields is tested at both boundary values (accepted) and one step outside either boundary (rejected, 400); plus explicit raw CSS/JS/HTML/URL/arbitrary-color/arbitrary-token injection attempts across multiple fields, all rejected. `TEST-ADM-009: PASS` (`ACTOR_REPORTED`, pending Architect review).

### Known limitations

- No automated visual-regression test exists in this repository (pre-existing gap, `TEST-WEB-003: NOT IMPLEMENTED`) — the screenshot comparisons above are this cycle's own manual checks, not a permanent regression guard.
- `app/admin/DesignControls.js`'s inline styling is minimal/utilitarian (matching the existing `DashboardClient.js`'s own plain-CSS convention) rather than styled to match the public V3 aesthetic — it is an authenticated internal tool, not a public-facing surface, and RFC-010 does not require a particular visual treatment for it.
- The `handlePreview` draft-if-present-else-published interpretation is a reasonable, documented reading of RFC-010's preview requirement rather than a literally unambiguous single reading; it is called out explicitly here for Architect review.
- This evidence remains `ACTOR_REPORTED` until independently reviewed — no self-certification is made.

### Explicit confirmations

- **No real/remote D1 or R2 was touched.** Both bindings remain `remote: false`; every D1/Wrangler command above ran `--local` or performed no mutation (`--dry-run`).
- **No public media/hero-object serving exists.** DESIGN-001 is a closed three-value preset enum (`cinematic-v3`/`deep-night`/`minimal-orbit`); no URL, R2 key, upload id, or data URI is ever accepted.
- **No arbitrary CSS/JS/HTML/color/font-URL/image-URL/selector/class-name/custom-property-name input exists anywhere in the admin design surface** — every field is a fixed enum or a bounded integer, enforced at both the application layer (`worker/d1/validate.mjs`) and the DB layer (migration 0005's `CHECK` constraints).
- **No visual drag/drop builder, no generic key/value settings, no arbitrary new preset, no new section id capability exists.**
- **No homepage/projects public D1 cutover occurred.** `app/page.js`'s only change is four `data-section` attributes; its content source remains `data/site.js` via `lib/content/local.mjs`, byte-unchanged.
- **No SSR conversion occurred.** `npm run build` confirms `/`, `/journal`, and `/admin` remain statically prerendered; no D1 module is imported by any file under `app/`.
- **No deployment occurred.** `npx wrangler deploy` was run only with `--dry-run`.
- **No protected/`main` merge occurred.** All work is on `governance/maisoglabs-v0.1` (mirrored to `claude/phase-0-governance-scope-w8o3jp`).
- **No `WEB-INC-007` scope expansion, no Sentinel S3+, no CI/rulesets/Capability-Gateway/Task-Engine/Orchestrator work began.** This closes the dependency-ordered core WEB roadmap per RFC-010, but creates no deployment/remote-resource/production-verification/main-merge authority by itself (AS30-F016).
- **`MEDIA_MUTATION_AUTHORIZED` remains `NO`** — this increment adds no media upload/update/archive capability. **`MUTATION_AUTHORIZED: YES`/`AUDIT_APPEND_AUTHORIZED: YES`** apply only to this exact bounded theme/section-design scope; **`REMOTE_R2_AUTHORIZED`, `REMOTE_D1_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.
- **The Implementer has not self-certified this implementation as `ARCHITECT VERIFIED`.** All runtime/test/visual/CLI evidence above remains `ACTOR_REPORTED` until independently reviewed.

### Implementation commit

The files above are committed to `governance/maisoglabs-v0.1` as commit `17577838d1007210cd1893fdb71ea8063d764fa8` on top of base `ac2666860195a6e1c151ae363f7d176b61c12cde`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. Both commits will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## WEB-INC-007 — Remediation Cycle 1 (ML-DEVOS-AS-032)

### Objective

Remediate exactly the two blockers `ML-DEVOS-AS-032` raised against the original WEB-INC-007 implementation (`coordination/ARCHITECT_REVIEW.md`, durably archived at `devos/changes/architect-syncs/ML-DEVOS-AS-032.md`):

- **AS32-B001** — the authenticated "Preview" surface returned formatted JSON only; there was no real visual draft preview a screenshot-reference session could use to review a draft against Brand V3/soft-geometry/responsive/contrast/reduced-motion before publish.
- **AS32-B002** — `overlay_intensity`'s advertised `40..85` range silently saturated above the `68` baseline, because the CSS `opacity` property clamps at 1 and the runtime's only mapping was `intensity / 68`.

Nine findings (`AS32-F001`–`AS32-F009`) already `PASS`ed independent review and are unaffected; per the remediation verdict, schema/table architecture, public route scope, design vocabularies/ranges, media architecture, and every resource/release gate remain out of scope for this cycle.

### Base / result SHA

- Remediation base (the prior cycle's bookkeeping commit, already Architect-reviewed): `07a30cbcaadf793550b30ced208bd2bf34e7e021`
- Fast-forwarded to the Architect's review commit before starting: `a78a33bd7b910bbe17862085abbdaf9611836b0a`
- Remediation implementation commit: `9773d76641bef0b9f57b94d78087438f4d2ffc15`

### Exact changed files (5: 2 new, 3 modified) — nothing else

**New (2):**
- `lib/design/overlay.mjs` — the pure, DOM-free `overlay_intensity -> {opacity, boost}` mapping (AS32-B002), with its own direct unit test.
- `tests/design-overlay.test.mjs` — 7 tests.

**Modified (3):**
- `app/DesignRuntime.js` — recognizes `?design-preview=1` and, only then, fetches the existing protected `GET /admin/api/design/preview` instead of the public `GET /api/design`, applying the result through the same `applyTheme`/`applySections` functions; falls back to the published projection on any failure (401 or otherwise). `applyOverlayIntensity` now delegates to `lib/design/overlay.mjs` instead of computing a single unbounded-above-1 value inline.
- `app/admin/DesignControls.js` — adds two plain links ("Open Homepage Preview", "Open Journal Preview") to `/?design-preview=1` / `/journal?design-preview=1`; no new API call in this file.
- `app/globals.css` — adds `.cinematic-background::before` as a second, independent darkening layer reading a new `--design-overlay-boost` custom property (0 at/below the 68 baseline, so invisible by default).

**No server/worker/schema/routing file changed.** `worker/admin/design.mjs` (including `handlePreview`), `worker/public/design.mjs`, `worker/d1/*`, `migrations/*`, `wrangler.jsonc`, `app/page.js`, `app/layout.js`, and `app/admin/page.js` are all byte-identical — confirmed by `git diff --stat` against every one of those paths returning empty. No new public API route was added; `GET /admin/api/design/preview`'s handler, response shape, and authentication requirement are unchanged.

### AS32-B001 remediation — visual authenticated draft preview

**Mechanism** (the "preferred low-complexity solution" from the Architect review, implemented as described): `app/DesignRuntime.js` checks `new URLSearchParams(window.location.search).get("design-preview") === "1"` on every page load. When present, it fetches `/admin/api/design/preview` (same-origin, so an admin's browser that already holds a valid Cloudflare Access session sends it automatically, exactly as it would for any other request to that path) instead of `/api/design`, and applies the draft-if-present-else-published result through the *same* `applyTheme(root, data.theme)` / `applySections(data.sections)` functions the published path already used — there is no separate/parallel application code path, so nothing new could introduce an arbitrary-CSS/JS/HTML capability. If that fetch fails for any reason (401 because the visitor has no valid Access session, a network error, a malformed response), the `.catch` falls back to fetching and applying the ordinary published `/api/design` projection instead — a signed-out visitor who opens a `?design-preview=1` link therefore sees only the ordinary published/baseline presentation, never draft data. `app/admin/DesignControls.js` adds two plain `<a>` links deep-linking to `/?design-preview=1` and `/journal?design-preview=1` (`target="_blank"`) — they make no API call themselves; the preview mechanism lives entirely in `DesignRuntime.js`.

**Required evidence:**

1. **Visual preview of an unpublished theme draft** — a Playwright session with `page.route("**/admin/api/design/preview", ...)` intercepted to return a draft payload (`minimal-orbit` background, `solid-night` cards, `violet` accent, `opaque-night` panel, `off` animation) rendered `/?design-preview=1` with the violet-accented button and the minimal-orbit background clearly visible, replacing the default cinematic-v3/cobalt baseline.
2. **Visual preview of unpublished section order/visibility** — the same intercepted draft payload set `projects.visible = false`; a full-page screenshot of the resulting render shows the page flowing directly from the hero to the Process section, with no Projects section at all (confirmed by visual inspection: the "From question to system" process heading immediately follows the hero, where "Explore the work" → Projects would otherwise appear).
3. **Proof public `GET /api/design` remains unchanged/published-only** — `worker/public/design.mjs` is byte-identical (confirmed by `git diff --stat`); `tests/worker-public-design.test.mjs`'s 13 tests (unmodified) still pass unchanged.
4. **Proof unauthenticated preview cannot retrieve draft data** — a second Playwright session with the same route intercepted to return `401 {"error":"Unauthorized"}` (simulating a visitor with no valid Cloudflare Access session, exactly like the real, unmodified `worker/admin/design.mjs` returns for an unauthenticated request) rendered `/?design-preview=1` and produced a screenshot pixel-identical in composition to the ordinary default baseline — cobalt accent button, cinematic-v3 cosmic background, no draft styling of any kind reached the page.
5. **Source inspection showing preview still uses fixed design mappings** — `applyTheme`/`applySections` (the only two functions that ever touch the DOM from fetched data) are unchanged by this remediation and are the exact same functions the published path already used; every enum value they accept is still independently re-validated against a hardcoded vocabulary array, every numeric value is still bounds-checked, and `dangerouslySetInnerHTML`/`<style>`-from-string/`eval` remain absent (grepped and confirmed).
6. **Screenshot evidence showing draft visual state before publish** — see item 1/2 above; captured while no D1 write of any kind occurred (the entire draft payload was a Playwright network-route mock, not a persisted database row), so "before publish" is unambiguous.
7. **Default/public presentation remains unchanged until publish** — item 4's screenshot demonstrates this directly; additionally, a real (non-mocked) `wrangler dev` + `curl GET /api/design` continued to return only the actual published D1 state throughout this remediation (see command log below), never anything resembling the mocked draft payload.

### AS32-B002 remediation — full-range overlay intensity

**Mechanism**: `lib/design/overlay.mjs`'s `computeOverlayLayers(value)` returns `{ opacity, boost }`. For `value <= 68`: `opacity = value / 68` (unchanged from before — 0.588 at 40, up to 1 at 68), `boost = 0`. For `value > 68`: `opacity` is pinned to exactly `1` (never re-derived from a value that could exceed 1), and `boost = (value - 68) / (85 - 68)` scales linearly 0..1 across the upper half. `app/globals.css`'s new `.cinematic-background::before { opacity: var(--design-overlay-boost, 0); background: var(--night-deep); }` is a second, wholly independent CSS property from `::after`'s own `opacity` — it cannot be clamped away by the first layer's own saturation, so 70/75/85 each add progressively more darkening instead of silently becoming no-ops. At exactly 68, `boost = 0` and the `::before` layer is fully transparent, so the render is byte-identical to the pre-remediation baseline (which had no `::before` rule at all).

**Required evidence:**

1. **Source-level mapping inspection** — `lib/design/overlay.mjs` (26 lines of pure logic, no DOM/React dependency) plus `app/globals.css`'s new `.cinematic-background::before` rule.
2. **Boundary tests at 40, 68, 85** — `tests/design-overlay.test.mjs`, 7 passing tests: baseline exactness (`68 -> {opacity:1, boost:0}`), minimum (`40 -> {opacity:0.588…, boost:0}`), maximum (`85 -> {opacity:1, boost:1}`), a monotonic "combined visual weight" (`opacity + boost`) check across 40/68/85, a strict-increase check across every value from 69 through 85 proving `boost` never plateaus, confirmation `opacity` stays exactly `1` throughout that same upper range (the property that used to silently saturate), and out-of-range/non-finite input handling.
3. **Evidence that 40 < 68 < 85 in actual visual effect** — both the unit test's "combined visual weight" assertion (`opacity + boost` strictly increases: 40 → 0.588, 68 → 1.0, 85 → 2.0) and the screenshot comparison below.
4. **Screenshot comparison at the three values** — a real (non-mocked) local Wrangler + D1 instance had its published `theme_settings_revisions.overlay_intensity` set to 40, then 68, then 85 in turn, with a fresh Playwright screenshot of `/` captured at each: 40 renders the brightest/most-visible cosmic background; 68 (the baseline) renders visibly darker at the frame edges than 40; 85 renders dramatically darker still, with the cosmic image almost entirely obscured — a clear, monotonic, unmistakable visual progression, not three visually-identical renders.
5. **Baseline 68 remains equivalent to the accepted default** — the 68 screenshot in item 4 is visually indistinguishable from the pre-remediation default-baseline screenshot already on file from the original WEB-INC-007 evidence; `computeOverlayLayers(68)` returns exactly `{opacity: 1, boost: 0}`, the same effective CSS state (`::after` at opacity 1, `::before` fully transparent) as before this fix existed.

### Local-only evidence — full command log (this remediation cycle)

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `a78a33b...` (the Architect's `CHANGES_REQUESTED` review) before any file was touched |
| `node --test tests/design-overlay.test.mjs` | 7 passed, 0 failed |
| `npm test` (full suite) | 338 passed, 0 failed |
| `npm run build` | Succeeded; routes `/`, `/_not-found`, `/admin`, `/journal`, all static |
| `npx wrangler d1 migrations apply DB --local` (fresh `--persist-to` directory) | All five migrations `✅`, no `--remote` flag used |
| Seed published `overlay_intensity = 40`, then `68` (reverted to the migration's own bootstrap row), then `85` via `wrangler d1 execute --local` (raw SQL, real CLI) | Each seed applied successfully; `curl GET /api/design` confirmed each value in turn |
| `npx wrangler dev --local` + Playwright screenshots of `/` at each of the three real seeded overlay values | See "Screenshot comparison" above — monotonic, unmistakable darkening progression |
| Playwright session with `page.route()` intercepting `/admin/api/design/preview` → `200` draft payload, `/api/design` → published baseline; navigate `/?design-preview=1` | Screenshot shows the draft theme (minimal-orbit/violet/opaque-night) applied |
| Playwright session with `/admin/api/design/preview` intercepted → `401`; navigate `/?design-preview=1` | Screenshot is pixel-composition-identical to the ordinary default baseline — no draft leakage |
| Playwright session with a hidden-`projects`-section draft payload, full-page screenshot | Confirms the Projects section is entirely absent from the render (hero flows directly into Process) |
| Secret/config scan (`grep` for JWT/PEM/private-key markers, `Bearer` tokens, across every changed file) | Zero matches |
| `git diff --stat` against every "not touched" path (`worker/*`, `migrations/*`, `wrangler.jsonc`, `app/page.js`, `app/layout.js`, `app/admin/page.js`) | Empty for every path |
| `git diff --stat` (overall, this remediation commit) | 5 files changed (2 new, 3 modified) |

Every D1/Wrangler command above used `--local`/local-simulation-only explicitly; none used `--remote`. No `wrangler deploy` was run this cycle (the prior cycle's `--dry-run` evidence stands unchanged, since no binding/config file changed).

### Why real Cloudflare Access could not be used for the "authenticated" evidence, and why the Playwright route-interception substitute is sound

`wrangler.jsonc`'s `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` remain their committed placeholder values (deliberately, per WEB-INC-001/AS12-F001) — `worker/auth.mjs`'s `isValidAuthConfig` fails closed before any JWKS lookup whenever they are unchanged, so a real local `wrangler dev` process can never actually authenticate an admin request, by design, in this repository. This is the same constraint every prior cycle's "local Wrangler smoke" evidence already worked within (their admin-route curl evidence was always the *unauthenticated*-rejection path only). The Node test suite already covers the server-side authenticated behavior of `GET /admin/api/design/preview` directly against `handleRequest`/`handleAdminDispatch`/`handleDesignDispatch` with a locally-generated JWKS (`tests/worker-admin-design.test.mjs`, unchanged and still passing) — that evidence is unaffected by this remediation, since the preview handler itself was not touched. What is genuinely new in this remediation is the *client* behavior added to `app/DesignRuntime.js`, which is exactly what the Playwright `page.route()` interception evidence above directly exercises in a real browser: it proves the client correctly calls the protected endpoint, correctly applies a successful (mocked-200) response, and correctly falls back on a failed (mocked-401) response — the full round-trip a real Access session vs. no session would produce, without needing a real Cloudflare Access deployment (which this repository is not authorized to provision).

### Known limitations (remediation-specific)

- The "authenticated" preview scenario is demonstrated via Playwright network-route interception rather than a real Cloudflare Access session, for the structural reason explained above; the underlying protected-endpoint behavior itself (401 without a valid Access assertion, 200 with one) is unchanged and already covered by the existing Node test suite.
- No visible "you are in preview mode" banner was added to the public pages; the remediation's required evidence did not call for one, and adding new UI surface beyond what AS32-B001 asked for risked exceeding this cycle's bounded scope.
- This evidence remains `ACTOR_REPORTED` until independently reviewed — no self-certification is made.

### Explicit confirmations (remediation-specific)

- **No new public API route was added.** `/api/design` is unchanged; `/admin/api/design/preview` is the same pre-existing protected endpoint, unchanged.
- **No new arbitrary CSS/JS/HTML/URL/color/token capability was introduced.** The preview mechanism reuses the exact same `applyTheme`/`applySections` fixed-mapping functions as the published path.
- **No SSR conversion, no D1 import into `app/`, no homepage/project content-source change.** `npm run build` confirms all four routes remain static.
- **No remote D1/R2, no deployment, no main merge.** `DEPLOY_AUTHORIZED: NO` and `MAIN_MERGE_AUTHORIZED: NO` remain unchanged.
- **No schema/table/route/vocabulary/range scope reopened.** Only the two named blockers (AS32-B001, AS32-B002) were remediated; `AS32-F001`–`AS32-F009` required no changes and received none.
- **The Implementer has not self-certified this remediation as `ARCHITECT VERIFIED`.** All runtime/test/visual/CLI evidence above remains `ACTOR_REPORTED` until independently reviewed.

### Remediation commit

The files above are committed to `governance/maisoglabs-v0.1` as commit `9773d76641bef0b9f57b94d78087438f4d2ffc15` on top of base `a78a33bd7b910bbe17862085abbdaf9611836b0a`. A second, immediately following documentation-only commit records this exact SHA into both `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. Both commits will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## WEB-REL-001 — Production Release Readiness

### Objective

Perform the assessment-only release-readiness work authorized by `docs/release/WEB_REL_001_PRODUCTION_READINESS.md`, `ML-DEVOS-RFC-011` (ACCEPTED), `ML-DEVOS-AS-034` (ARCHITECT_APPROVED), and `D-034` (Paulo: "Proceed"), following the eight-increment core WEB roadmap's closure (`ML-DEVOS-AS-033`, `ML-DEVOS-ADR-009`). This phase produces a release-readiness packet — it takes **no release action of any kind**.

### Base SHA / branch state

- Assessment base (fast-forwarded before any work): `b5bf2e053d1385e2b6859da506c2c2de3f7a3767`
- No implementation commit exists for this cycle — **zero application/runtime/schema files were changed**. The only artifacts produced are the readiness report and this handoff/state update.

### Deliverable

`docs/release/WEB_REL_001_READINESS_REPORT.md` — the complete packet required by the authorizing document, covering (with full detail in that file):

1. exact governed HEAD (`b5bf2e0...`) and `main` HEAD (`8878492...`);
2. main↔governance compare: 363 commits ahead, `main` is a clean ancestor (no divergence), 181 files changed;
3. a categorized diff inventory (runtime/application 30, schema/migrations 6, tests 11, Cloudflare config 3, governance/docs 131 — sums to exactly 181);
4. a full command/evidence log (`npm test` 338/338, `npm run build` 4 static routes, `npx wrangler deploy --dry-run` success with unchanged placeholder bindings, `npm audit` 0 vulnerabilities, fresh local migrations 0001–0005 all `✅`, plus three live GitHub API calls made during this assessment — `list_workflows` → 0, `.github` directory → does not exist, `list_branches`/`list_repository_collaborators` → every branch unprotected, exactly one collaborator);
5. the static route inventory (`/`, `/_not-found`, `/admin`, `/journal`, all static — unchanged since WEB-INC-001);
6. confirmation of the exact 22-product-table inventory from a fresh migration run;
7. the complete Worker-first route inventory (protected and public);
8. production configuration gaps (Access placeholders, no production D1/R2, no Worker deployment target);
9. a GitHub technical-protection gap assessment, including the single-collaborator finding that makes a required-approving-review rule impractical today;
10. a minimum GitHub protection recommendation (ruleset-based, owner-bypass-only, no fabricated reviewer) — **not applied**;
11. a proposed minimal two-step CI workflow (`npm test` + `npm run build`) — **not created or activated**;
12. a proposed protected-main PR/merge process;
13. production D1/R2/Access/Worker deployment plans, each explicitly deferred to a separate future Paulo authorization;
14. a rollback plan covering bad-deploy, bad-migration, bad-Access-config, and public-API-regression scenarios;
15. a post-deploy runtime-verification checklist;
16. a blocker table (B1–B6, all either "no GitHub technical protection" or "no production resource exists yet" — none block continued local development);
17. the exact next Paulo gates in dependency order (A: technical protection → B: draft PR → C: main merge → D: production resource authorization → E: deploy gate → F: verified-or-rollback), with merge (B/C) and deploy (D/E) kept explicitly distinct per `AS34-F006`.

### Evidence discipline this cycle

Every command/test/build/migration/route-smoke result in the report is `ACTOR_REPORTED`. Three GitHub API calls were made live against the real repository during this assessment (`list_workflows`, `get_file_contents(".github")`, `list_branches`, `list_repository_collaborators`) and are flagged in the report as independently executed this cycle rather than merely re-stated from `ML-DEVOS-AS-034`'s prior findings — but they remain Builder-session evidence, not Architect-independent evidence, and the report says so explicitly rather than upgrading their evidence class. No ruleset-read capability was available through this session's tools (no `gh` CLI, no dedicated ruleset-inspection MCP tool), so the "no rulesets exist" fact is carried forward from the Architect's own phase-opening finding, with that limitation stated plainly in the report rather than silently re-asserted as freshly verified.

### Explicit confirmations

- **No ruleset or branch protection was created or modified.**
- **No GitHub Actions workflow was created or activated.**
- **No push or merge to `main` occurred** — `main` remains at `887849283ee9cd16e8d60b937bac95b1c85bf3d9`, untouched.
- **No remote D1 or R2 resource was touched.** Every D1/Wrangler command in this cycle ran `--local` or was a `--dry-run`.
- **No Cloudflare Access production configuration, credential, or DNS/domain change was made.**
- **No deployment occurred.**
- **No production data write occurred** (no production exists).
- **No homepage/projects D1 cutover, new product feature, or Sentinel S3+ work occurred** — this cycle changed zero application/runtime files.
- **`REMOTE_R2_AUTHORIZED: NO`, `REMOTE_D1_AUTHORIZED: NO`, `DEPLOY_AUTHORIZED: NO`, `MAIN_MERGE_AUTHORIZED: NO` all remain unchanged.**
- **The Implementer has not self-certified this assessment as `ARCHITECT VERIFIED`.** All evidence above remains `ACTOR_REPORTED` until independently reviewed.

### Assessment commit

`docs/release/WEB_REL_001_READINESS_REPORT.md` is committed to `governance/maisoglabs-v0.1` alongside this same documentation commit (there is no separate implementation commit for this cycle, since no application/runtime/schema file changed). Base: `b5bf2e053d1385e2b6859da506c2c2de3f7a3767`. This commit will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## SENTINEL-BASELINE-CLEANUP-001 — Active-baseline metadata cleanup

### Objective

Execute exactly the `PATCH`-classified cleanup order in `coordination/ARCHITECT_REVIEW.md` (cycle `SENTINEL-BASELINE-CLEANUP-001`): correct four stale/contradictory descriptive-metadata findings (`SC001-F001`–`SC001-F004`) without changing any Sentinel rule, actor authority, trust boundary, architecture, capability, phase status, runtime behavior, project-onboarding authority, or release/deployment authority, and without any Sentinel version bump. Paulo additionally instructed `proceed with cleanup order with sentinel`.

### Base SHA / branch state

- Cleanup base (fast-forwarded before any work): `973022fcba712b20440b1e72fa02c7cffc20ce74`
- No separate implementation commit — this is bookkeeping-class PATCH content per the order's own "Normal Builder coordination records may also be updated" allowance; the substantive cleanup and the handoff/state update are committed together, consistent with a PATCH's lower ceremony (no RFC, no Architect Sync gate, no new Paulo gate).

### Exact changed files (3 substantive; matches the authorized scope exactly)

- `devos/devos-manifest.json`
- `devos/governance/specifications/VERSIONING_POLICY.md`
- `projects/README.md`

Plus this same documentation commit's `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md` update, both explicitly permitted by the order. **No other file changed** — confirmed by `git status --short`/`git diff --stat` showing exactly these five paths, none of them among the order's explicit non-scope list (`core-rules.json`, frozen architecture, any historical Architect Sync/Decision/ADR, S0–S2 semantics, `v1.5.0` rule substance, `projects/registry.json`, validators, application/runtime code, S3–S14, CI/workflows, GitHub rulesets, remote resources, deployment, `main` merge).

### Findings addressed

- **`SC001-F001`** (hard contradiction): `devos/devos-manifest.json`'s `source_of_truth_precedence` said the active Sentinel capability baseline is "currently v1.4.0" while the same manifest's own `sentinel_capability_baseline.version` field already said `1.5.0`. Changed only the stale wording to `v1.5.0` — a one-line, single-value edit, nothing else on that line touched.
- **`SC001-F002`** (hard contradiction): `VERSIONING_POLICY.md`'s S2-closure section stated, in the present tense, that the manifest's `sentinel_capability_baseline` "now records" `1.4.0`/`ADR-002`/`D-017` — true at S2 closure, false today. Rewrote the paragraph to be explicitly historical: the field advanced to `1.4.0` at S2 closure, then advanced again to `1.5.0` under `D-028`/`ML-DEVOS-ADR-006` (cross-referencing the policy's own later "Risk-escalation core-policy update — v1.5.0 applied" section), and that `1.4.0` is not the field's current value. The historical S2 `v1.3.0 → v1.4.0` transition statement itself, and the S1 `v1.2.0 → v1.3.0` cross-reference, are both preserved unedited.
- **`SC001-F003`** (stale current-state wording): `projects/README.md`'s "Current state — S2" section framed the registry's emptiness as an S2-closure-scoped fact ("must remain empty through S2 closure," "as of S2"). Rewrote it as "Current state" describing the registry's emptiness as the **standing pre-onboarding invariant** that holds independent of any phase's closure — S2 established/reaffirmed it, but S2 closure is not the current-time qualifier for it. The "Adding a project" section's closing line was updated the same way ("no such entry currently exists or is currently authorized," not "as of S2").
- **`SC001-F004`** (stale current-state wording): the manifest's `project_registry.note` said "No project has been onboarded as of S2 closure." Rewrote it to state the current fact directly — "No project is currently onboarded; the registry remains empty under the standing pre-onboarding invariant" — while preserving the statement that S2 closure itself granted no onboarding authority, and the requirement that a future entry needs the active `PROJECT_ONBOARDING` process plus explicit Paulo authorization.

### Builder validation (per the order's "Builder validation required")

| Check | Result |
|---|---|
| `node devos/schemas/validate-devos-manifest.mjs` | `PASS: 0 error(s) across 1 file(s)` — "OK — no structural or semantic issues found." |
| `node devos/schemas/validate-project-registry.mjs` | `PASS: 0 error(s) across 1 file(s)` — "Registry is empty, as required until a PROJECT_ONBOARDING decision permits population." |
| `sentinel_capability_baseline.version` | Confirmed exactly `"1.5.0"` (`python3 -c "import json; print(json.load(open('devos/devos-manifest.json'))['sentinel_capability_baseline']['version'])"` → `1.5.0`) |
| `projects/registry.json` | Confirmed exactly `{"schema_version": "1", "projects": []}` — unchanged, not in this cycle's authorized file scope, and not touched |
| Grep for any remaining unqualified "current baseline is/currently v1.4.0" claim | Zero matches outside `coordination/ARCHITECT_REVIEW.md`'s own quoted description of the original contradiction (that file is the Architect's document, not part of this cycle's edit scope, and correctly describes the problem in the past/quoted sense) |
| Grep for the legitimate historical transition statements | Both preserved verbatim: `v1.3.0 -> v1.4.0` / `v1.3.0 → v1.4.0` (manifest `closure_history` note + `VERSIONING_POLICY.md` S2 section) and `v1.4.0 -> v1.5.0` / `v1.4.0 → v1.5.0` (manifest `closure_history` note + `VERSIONING_POLICY.md`'s v1.5.0 section heading) |
| `npm test` (full suite, sanity check — no application code was in scope or touched) | 338 passed, 0 failed |
| `git status --short` / `git diff --stat` | Exactly the 3 authorized substantive files plus the 2 permitted coordination files; no other path touched |

### Known limitations

- This evidence remains `ACTOR_REPORTED` until independently reviewed — no self-certification is made. The order itself requires the Architect to "independently inspect the exact diff and validators before closing the PATCH."

### Explicit confirmations

- **No Sentinel version bump occurred.** `sentinel_capability_baseline.version` remains exactly `1.5.0`; this is a non-semantic PATCH correction to descriptive text, not a `v1.5.1` transition.
- **No rule, actor authority, trust boundary, architecture, capability, phase status, or runtime behavior changed.** `devos/governance/rules/core-rules.json` and the frozen `ML-DEVOS-ARCH-001` architecture were not touched.
- **No historical record was altered.** Every `closure_history` entry, ADR, Decision, and Architect Sync archive referenced by the two corrected documents is unchanged; only present-tense/current-state wording was corrected.
- **No project-onboarding state changed.** `projects/registry.json` remains exactly empty and untouched; only the descriptive text explaining that invariant was corrected.
- **No application/runtime code, CI/workflow, GitHub ruleset/branch-protection, remote D1/R2/Access resource, deployment, or `main` merge was touched.**
- **The Implementer has not self-certified this cleanup as `ARCHITECT VERIFIED`.** All evidence above remains `ACTOR_REPORTED` until independently reviewed.

### Cleanup commit

The three substantive files above, plus this same documentation update to `coordination/IMPLEMENTER_HANDOFF.md`/`coordination/STATE.md`, are committed together to `governance/maisoglabs-v0.1` on top of base `973022fcba712b20440b1e72fa02c7cffc20ce74`. This commit will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## SENTINEL-TRACEABILITY-V1 — Static Traceability Graph / Validator

### Cycle / Change ID

`SENTINEL-TRACEABILITY-V1` — **AUTHORIZED IMPLEMENTATION, now complete, handed back for Architect review.**

Authority chain: `ML-DEVOS-RFC-012` (`ACCEPTED`) → `ML-DEVOS-AS-037` (`ARCHITECT_APPROVED — TRACEABILITY V1 BOUNDED IMPLEMENTATION AUTHORIZED`, class `ARCHITECTURE`) → `D-036` (Paulo: "okay do that", accepted only for the bounded implementation envelope in `ML-DEVOS-AS-037`).

### Objective

Implement the repository-only Sentinel Traceability V1 subsystem exactly as scoped by `ML-DEVOS-AS-037`'s "Authorized implementation envelope": a deterministic generator, a referential-integrity validator, derived (non-authoritative) JSON + Markdown indexes, focused tests, a human-readable README, and a baseline findings report against this actual repository — implementing the frozen traceability model (`ML-DEVOS-ARCH-001 §8`: `Requirement → Design → Implementation → Test → Evidence → Status`) by deriving definitions from existing canonical surfaces rather than a second manually maintained matrix (AS37-F003).

### Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `affd2693f29ebac450e707e7b43140f9b36f09b8` — matches the HEAD in effect when `coordination/STATE.md` set `TURN: CLAUDE` / `STATUS: AUTHORIZED_IMPLEMENTATION` for this cycle.
- Read in full before any edit: `coordination/STATE.md`, the durable archive `devos/changes/architect-syncs/ML-DEVOS-AS-037.md` (all findings `AS37-F001`–`F012`, the authorized implementation envelope, the explicitly-not-authorized list, and the required Builder evidence list), `devos/changes/rfcs/ML-DEVOS-RFC-012.md`, `brain/DECISION_LOG.md` `D-036`, `ML-DEVOS-ARCH-001 §8`, `brain/GOVERNANCE_MAP.md`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, `docs/product/BUILD_PLAN.md`, `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`, and `devos/governance/rules/core-rules.json`, to derive the five mechanical canonical-discovery strategies actually in use by this repository rather than inventing a new convention.
- **Note on the live `coordination/ARCHITECT_REVIEW.md`:** by the time this cycle's implementation work began, the *live* rolling `ARCHITECT_REVIEW.md` had already rolled forward to `ML-DEVOS-AS-038`'s S3 Typed Task Contracts design content (a separately queued, not-yet-active cycle). Authorization for *this* cycle was read from the durable archive `devos/changes/architect-syncs/ML-DEVOS-AS-037.md`, not the live rolling file, and cross-checked against `coordination/STATE.md`'s own `CYCLE_ID: SENTINEL-TRACEABILITY-V1` / `TURN: CLAUDE` / `IMPLEMENTER_ACTION_REQUIRED: YES` state, which remained the active Builder turn.
- Result: implementation complete on the working tree; not yet committed until this handoff/state update is finalized in the same commit (small governance-tooling cycles in this session, e.g. `SENTINEL-BASELINE-CLEANUP-001`, have combined implementation and bookkeeping into one commit; this cycle follows the same pattern since it is one bounded repository-only change).

### Exact changed-file list — 7 new files, 0 modified, 0 deleted

Confirmed by `git status --porcelain` immediately before this commit: **only** the following paths are new/untracked; nothing pre-existing was modified.

- `devos/governance/traceability/traceability.config.json` (new) — bounded configuration: `scan` (12 include dirs, 4 root files, 6 extensions, 2 self-reference exclude paths), `idFamilies` (12 entries, one per governance-ID family, each naming an already-existing canonical surface and one of five discovery strategies: `file`, `heading`, `table-row`, `line-start`, `json-array-field`), `historicalExceptions` (2 entries: `ML-DEVOS-AS-008`, `ML-DEVOS-AS-009`, each with a detailed rationale).
- `devos/governance/traceability/generate-traceability.mjs` (new) — the deterministic generator. Pure exported functions (`loadConfig`, `listScannedFiles`, `buildTraceabilityReport`, `serializeReportJson`, `renderMarkdown`) never touch the filesystem for writes; the only two file writes happen in `main()`, gated by a direct-run check, so tests and the validator can exercise identical logic without side effects.
- `devos/governance/traceability/validate-traceability.mjs` (new) — the referential-integrity validator. Regenerates the report in-memory (via the generator's own exported pure functions — no duplicated logic), compares it against the on-disk generated files to detect drift, prints every ERROR/WARNING, and exits non-zero if any ERROR exists or drift is detected. Never writes or "fixes" anything itself (AS37-F008).
- `devos/governance/traceability/traceability-index.json` (new, generated) — the derived, non-authoritative machine-readable index. `nonAuthoritative: true` and a full `authorityStatement` are stamped into the schema itself.
- `devos/governance/traceability/TRACEABILITY_INDEX.md` (new, generated) — the derived, non-authoritative human-readable index, headed "Traceability Index (Derived — Non-Authoritative)" with an explicit "Do not hand-edit; regenerate instead" notice.
- `devos/governance/traceability/README.md` (new) — the subsystem README: what it is/is not, the five discovery strategies with examples, the finding-kind taxonomy, the determinism guarantee, usage for both scripts, the one disclosed limitation (JSON-array-field "line" is an array index, not a true source line — no dependency-heavy JSON line-mapping parser was added, per AS37-F010's dependency-light requirement), and the test coverage summary.
- `tests/traceability.test.mjs` (new) — 7 focused tests against small synthetic temp-directory fixtures (never the real repository): missing-reference ERROR, duplicate-canonical-definition ERROR, two-consecutive-runs byte-identical determinism, explicit historical-exception WARNING (not silently suppressed), orphan-no-inbound-reference WARNING, non-authoritative marking, and `scan` config filtering (`includeExtensions`/`excludePaths`).

**Confirmed not touched:** `brain/DECISION_LOG.md`, `docs/product/BUILD_PLAN.md`, `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, `devos/governance/rules/core-rules.json`, every existing RFC/AS/ADR file, every existing application/runtime/worker/schema/migration file — all of these were read-only inputs this cycle, exactly as the authorized envelope requires.

### Generator / validator commands and literal results

```
$ node devos/governance/traceability/generate-traceability.mjs
Wrote devos/governance/traceability/traceability-index.json and devos/governance/traceability/TRACEABILITY_INDEX.md
Scanned 192 files. Errors: 2. Warnings: 13.

$ node devos/governance/traceability/validate-traceability.mjs
Scanned 192 files across 12 ID families.
Errors: 2  Warnings: 13  Total canonical definitions: 208
ERROR [missing-canonical-target] CORE CORE-022: CORE-022 is referenced but has no canonical record in CORE's configured canonical source.
ERROR [missing-canonical-target] WEB-REQ WEB-REQ-009: WEB-REQ-009 is referenced but has no canonical record in WEB-REQ's configured canonical source.
WARNING [orphan-no-inbound-reference] D D-001 / D-002 / D-003 / D-004 / D-005 / D-009 / D-022 / D-035 (8 total)
WARNING [historical-exception-missing-canonical-record] ML-DEVOS-AS-008
WARNING [historical-exception-missing-canonical-record] ML-DEVOS-AS-009
WARNING [orphan-no-inbound-reference] WEB-SEC WEB-SEC-006 / WEB-SEC-007 / WEB-SEC-008 (3 total)
No drift: on-disk generated index matches a fresh generation run.
(exit code: 1 — non-zero because 2 ERRORs exist; this is the validator functioning exactly as designed, not a failed run)
```

### Two-consecutive-run determinism proof (required evidence item)

Ran the generator twice consecutively against the identical, final repository state (after all 7 subsystem files existed, so the subsystem's own README/validator/test file are correctly included in what it scans) and diffed the output:

```
$ sha256sum devos/governance/traceability/traceability-index.json devos/governance/traceability/TRACEABILITY_INDEX.md
92b54b3b04925b31acffc2e9c258ced743b4739b2f02d2ed68b101b3fa6e3a42  traceability-index.json
ae619e6830674f79382e72f2ee10077c191c68a4219487d7eec4c66ea1fbd12d  TRACEABILITY_INDEX.md
$ node devos/governance/traceability/generate-traceability.mjs   # second run
$ diff <run-1 copy> traceability-index.json   # no output — byte-identical
$ diff <run-1 copy> TRACEABILITY_INDEX.md     # no output — byte-identical
FINAL DETERMINISM CONFIRMED: byte-identical across two runs with the complete file set
```

An earlier pair of runs (taken before the README/validator/test files existed, when the scanned surface was 189 files) was also byte-identical to itself across two consecutive invocations, confirming determinism held at every stage of adding the remaining subsystem files, not only at the very end.

### Baseline ERROR/WARNING counts (required evidence item — first real findings from this actual repository)

- **Total canonical definitions discovered:** 208, across 12 ID families (`ADM-REQ` 16, `CORE` 21, `D` 37, `DESIGN` 14, `ML-DEVOS-ADR` 9, `ML-DEVOS-AS` 36, `ML-DEVOS-RFC` 13, `RISK-WEB` 15, `TEST` 19, `WEB-INC` 8, `WEB-REQ` 8, `WEB-SEC` 12).
- **Errors: 2** (both independently spot-checked below, neither is a generator/config bug).
- **Warnings: 13** (8 orphan `D-*`, 2 explicit historical exceptions, 3 orphan `WEB-SEC-*`).

**ERROR 1 — `CORE-022` missing canonical target.** Referenced once, in `docs/SENTINEL_REVIEW_NOTES.md:438`. Manually inspected the surrounding text: the document's own "Re-check conclusion" section explicitly states *"Do not create CORE-022 from these findings... Revisit the observations above only when their corresponding real trigger appears."* — i.e. `CORE-022` was deliberately discussed and deliberately never created. This is a genuine, correct finding: the ID is referenced in prose but has no (and, per that document, currently should have no) canonical rule entry. Reported here, not fixed — creating a `CORE-022` rule entry is explicitly out of this cycle's scope and would itself be a separate, RFC-gated Sentinel rule change.

**ERROR 2 — `WEB-REQ-009` missing canonical target.** Referenced 31 times across 22 files, including real implementation files (`worker/d1/journal.mjs`, `worker/public/journal.mjs`, `worker/admin/journal.mjs`, `app/journal/*`), tests, `ML-DEVOS-ADR-008`, two Architect Sync archives, and `docs/product/BUILD_PLAN.md`/`PRD.md` — this is the Journal feature's implicit ninth website requirement. Manually confirmed via `grep -n "WEB-REQ-009" docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` (zero matches) and `grep -n "^WEB-REQ-" ...` (confirms the canonical plan document only ever defined `WEB-REQ-001` through `WEB-REQ-008`). This is a genuine, previously-undetected traceability gap: the Journal capability (`WEB-INC-006`) was implemented and referenced against a `WEB-REQ-009` that the foundational governance-admin plan document was never updated to add. Reported here, per `AS37-F011`, rather than fixed — adding a ninth requirement to that plan document is a change to a foundational governance record and requires separate authorization, not a side effect of a traceability-tooling cycle.

Both ERRORs were verified by direct inspection to be genuine repository-content gaps, not generator defects — no unexpected/spurious finding pointed at a pattern or config mistake.

### Explicit list of exceptions and why each exists (required evidence item)

- **`ML-DEVOS-AS-008`** — referenced throughout `devos/handoffs/ML-DEVOS-S2-HANDOFF.md` and `brain/DECISION_LOG.md` as a real S2-closure-package review. No `devos/changes/architect-syncs/ML-DEVOS-AS-008.md` was ever archived (the numbering in that directory jumps `007` → `010`). Predates this repository's later discipline of always archiving every Architect Sync as its own durable file. Not fabricated or backfilled, per `AS37-F011`'s explicit non-authorization of historical-record rewrites; downgraded from ERROR to a visible, rationale-bearing WARNING instead.
- **`ML-DEVOS-AS-009`** — referenced throughout `ML-DEVOS-AS-001.md`, `-002.md`, `-004.md`, the architect-syncs `README.md`, and `brain/DECISION_LOG.md` as the real legacy-archive verbatim-claim audit (`LAA-001`–`LAA-004`) that led to `D-018`/`D-019`. Same gap, same treatment, same rationale as above.

Both exceptions are genuine historical discoveries made *by this cycle's own tooling*, not pre-known facts restated — this is itself a small piece of positive evidence that the mechanism works as intended (AS37-F005).

### Focused test results

```
$ node --test tests/traceability.test.mjs
# tests 7
# pass 7
# fail 0
```

Covers exactly the four categories `ML-DEVOS-AS-037` requires (missing reference, duplicate canonical definition, deterministic output, explicit historical-exception handling) plus three additional cases written to pin down behavior precisely: orphan-no-inbound-reference WARNING, the non-authoritative marking, and `scan` config filtering. All fixtures are synthetic temp directories (`fs.mkdtempSync`, the same pattern already used by `tests/d1-audit.test.mjs` etc.) — none depend on or mutate real repository content.

### Full suite result (sanity check — application code was not in scope and was not touched)

```
$ npm test
# tests 345
# pass 345
# fail 0
```

345 = the pre-existing 338 (last confirmed in `SENTINEL-BASELINE-CLEANUP-001`) + this cycle's 7 new `tests/traceability.test.mjs` cases. No pre-existing test was modified, and none regressed.

### Proof generated output is marked non-authoritative (required evidence item)

- `traceability-index.json`'s top-level `"nonAuthoritative": true` field, plus a full-sentence `"authorityStatement"` field naming every record class it can never override (frozen architecture, active governance kernel, `brain/DECISION_LOG.md`, ADRs, durable Architect Syncs, requirement/risk/test source records).
- `TRACEABILITY_INDEX.md`'s H1 is literally `# Traceability Index (Derived — Non-Authoritative)`, followed immediately by a sentence pointing to this README and the authority chain, and a "Do not hand-edit; regenerate instead" instruction.
- `README.md`'s "What this is not" section states this explicitly as a design principle, not just a label on the output.

### Confirmation no existing source-of-truth records were auto-rewritten (required evidence item)

`git status --porcelain` immediately before this commit shows only the 7 new untracked paths listed above (`devos/governance/traceability/` in full, plus `tests/traceability.test.mjs`) — zero modified or deleted paths. No RFC, Architect Sync, ADR, Decision Log entry, risk register row, test ledger row, `BUILD_PLAN.md`, the admin-plan `.txt`, or `core-rules.json` was touched, including for the two genuine gaps this cycle discovered (`CORE-022`, `WEB-REQ-009`) and the two historical exceptions — all four were reported, none were backfilled or silently corrected.

### Explicit confirmations

- **No S3 Typed Task Contracts, S7 Evidence Store/QA Plane, or S9 Evidence Gate implementation occurred.** The validator reports structural-integrity findings only; it does not define task lifecycle, store evidence packets, or decide merge/deploy eligibility.
- **No CI/GitHub Actions wiring, branch protection, or ruleset was created or modified.**
- **No product runtime, D1/R2/Access resource, deployment, or `main` merge occurred.**
- **No project onboarding occurred.**
- **No automatic status/authority mutation occurred** — this handoff and `coordination/STATE.md` are the only status changes, both normal Builder→Architect handoff bookkeeping.
- **No Sentinel capability-baseline version bump occurred.** `devos/devos-manifest.json`'s `sentinel_capability_baseline.version` remains exactly `1.5.0`, untouched — consistent with `AS37-F012`.
- **No existing historical RFC/AS/ADR/Decision content was edited to make the validator green.** The two genuine ERRORs (`CORE-022`, `WEB-REQ-009`) and the two historical-exception WARNINGs are reported as-is.
- **`REMOTE_R2_AUTHORIZED: NO`, `REMOTE_D1_AUTHORIZED: NO`, `DEPLOY_AUTHORIZED: NO`, `MAIN_MERGE_AUTHORIZED: NO` all remain unchanged.**
- **The Implementer has not self-certified this cycle as `ARCHITECT VERIFIED`.** Every command result above is `ACTOR_REPORTED` until independently reviewed — including the two baseline findings, which are genuine tool output but not yet Architect-inspected.

### Known limitations

- The `json-array-field` discovery strategy's recorded "line" for `CORE-*` definitions is the 1-based array index within `core-rules.json`'s `rules` array, not a true source-line number — disclosed in the README as a deliberate, dependency-light (AS37-F010) simplification, not silently presented as line-accurate.
- The two genuine baseline findings (`CORE-022`, `WEB-REQ-009`) are unresolved repository-content gaps as of this handoff. Resolving either (creating a `CORE-022` rule entry, or adding `WEB-REQ-009` to the canonical admin-plan document) is explicitly out of this cycle's scope and would require its own separate authorization.
- `S3 — Typed Task Contracts` (`ML-DEVOS-RFC-013`/`ML-DEVOS-AS-038`/`D-037`) remains queued behind this cycle's independent Architect closure, per `coordination/STATE.md`'s "Queued next phase" section and `AS38-F010`. This handoff does not begin S3 implementation.

### Implementation commit

All 7 files above, plus this same documentation update to `coordination/IMPLEMENTER_HANDOFF.md`/`coordination/STATE.md`, are committed together to `governance/maisoglabs-v0.1` on top of base `affd2693f29ebac450e707e7b43140f9b36f09b8`. This commit will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## SENTINEL-TRACEABILITY-V1 — Remediation Cycle 1 (ML-DEVOS-AS-039 / AS39-F008)

### Cycle / Change ID

`SENTINEL-TRACEABILITY-V1` — **Remediation Cycle 1, now complete, handed back for Architect review.**

Authority chain: `ML-DEVOS-RFC-012` (`ACCEPTED`) → `ML-DEVOS-AS-037` (`ARCHITECT_APPROVED`) → `D-036` (Paulo: "okay do that") → `ML-DEVOS-AS-039` (`CHANGES_REQUESTED — REMEDIATION CYCLE 1`, single blocker `AS39-F008`). `CURRENT_REMEDIATION_CYCLE: 1` of `MAX_REMEDIATION_CYCLES: 3`.

### Objective

Fix exactly `AS39-F008` and nothing else: the generator was reporting `CORE-022` as a hard `missing-canonical-target` ERROR from `docs/SENTINEL_REVIEW_NOTES.md:438`, whose exact text is `"Do not create CORE-022 from these findings."` — an intentional assertion that no such record should exist, not a semantic cross-reference. Per the review's "Required remediation," add a narrowly scoped, rationale-bearing intentional-non-reference/reference-exception mechanism that (1) keeps the occurrence visible as a WARNING, (2) does not globally suppress the ID, (3) still produces an ERROR if the same ID is genuinely referenced elsewhere, (4) has focused tests, (5) regenerates the derived indexes. `WEB-REQ-009` remains explicitly out of scope and unrepaired, per the review's "Preserve" instruction.

### Base / result state

- Base (pulled and fast-forwarded before any file was touched): `4f5c8e190b4edbfac9a4bb2cf707d500e4f9647c` — the Architect's `ML-DEVOS-AS-039` sync commit, fast-forwarded cleanly from the prior implementation commit `8106fa53925096e502235178dc691b74c288faf0`.
- Read in full before any edit: `coordination/STATE.md` (`CYCLE_ID: SENTINEL-TRACEABILITY-V1`, `TURN: CLAUDE`, `STATUS: CHANGES_REQUESTED`, `AUTHORIZED_SCOPE: SENTINEL_TRACEABILITY_V1_REMEDIATION_CYCLE_1`, `CURRENT_REMEDIATION_CYCLE: 1`) and the full `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-039`, findings `AS39-F001`–`AS39-F008`, the "Required remediation" preferred shape, "Expected post-remediation baseline," and "Non-scope during remediation").

### Exact diff — 6 files modified, 0 added, 0 deleted

Confirmed by `git status --porcelain` / `git diff --stat` immediately before this commit: exactly these 6 paths changed, all inside the already-authorized `devos/governance/traceability/` root plus its one test file — nothing else.

- `devos/governance/traceability/traceability.config.json` — added a new top-level `referenceExceptions` array (one entry: `family: "CORE"`, `id: "CORE-022"`, `file: "docs/SENTINEL_REVIEW_NOTES.md"`, `linePattern` matching the exact sentence, and a `reason`). Also added `devos/governance/traceability/traceability.config.json` itself to `scan.excludePaths` (see "Self-reference finding" below — required for the new mechanism to work correctly, not an unrelated change).
- `devos/governance/traceability/generate-traceability.mjs` — added `readSingleLine()` and `loadReferenceExceptions()`; the missing-canonical-target loop now partitions an unresolved ID's reference sites into those matching a configured `referenceException` (→ `intentional-noncanonical-mention` WARNING, listing only the matched sites) and the rest (→ `missing-canonical-target` ERROR, listing only the unmatched sites; omitted entirely if empty). Historical-exception handling (whole-ID, AS37-F005) is unchanged and unaffected. Also reworded two doc comments to avoid embedding a literal exempted ID (see "Self-reference finding" below).
- `devos/governance/traceability/traceability-index.json` / `TRACEABILITY_INDEX.md` — regenerated from the real repository (see "Regenerated baseline" below).
- `devos/governance/traceability/README.md` — documents `referenceExceptions`, its per-site (not per-ID) scoping guarantee, the new `intentional-noncanonical-mention` finding kind, and the self-reference finding below.
- `tests/traceability.test.mjs` — 3 new focused tests (see "Focused test results").

**Confirmed not touched:** `docs/SENTINEL_REVIEW_NOTES.md`, `devos/governance/rules/core-rules.json`, or any other repository-content file — `CORE-022` was not created, per the review's explicit non-scope. `WEB-REQ-009`'s source records were not touched either.

### Self-reference finding, discovered and fixed during this remediation (not requested by the review, but necessary for it to work)

The first implementation attempt added the `referenceExceptions` entry to `traceability.config.json` and regenerated — and the ERROR **did not fully clear**. Investigation showed the entry's own `id`/`reason`/`_comment` JSON string values necessarily restate `"CORE-022"` as literal text, and `traceability.config.json` was itself part of the scanned surface (same as every other `.json` file under `devos/`). The config file describing the exemption was therefore immediately reintroducing new, unexempted occurrences of the exact ID it exists to fix. Two fixes, both narrowly scoped to this subsystem:

1. Added `devos/governance/traceability/traceability.config.json` to `scan.excludePaths`, alongside the two already-excluded generated output files — the same "self-reference avoidance" rationale already documented for those two files applies identically here.
2. Reworded two doc comments in `generate-traceability.mjs` that had (for illustration) spelled out `"CORE-022"` literally, since this generator's own source file is also part of the scanned surface. The comments now describe the mechanism generically ("a document that explicitly states an id must not be created") without naming a specific ID.

This is disclosed here as part of "exact diff," not hidden — it is a real defect I introduced and caught myself during this remediation, before the Architect saw it, by actually running the generator and inspecting non-zero-but-unexpected output rather than assuming the config change alone was sufficient.

### Regenerated baseline (required evidence item)

```
$ node devos/governance/traceability/generate-traceability.mjs
Scanned 191 files. Errors: 3. Warnings: 3.
```

Full findings:

| Kind | Family | ID | Sites | 
|---|---|---|---|
| ERROR `missing-canonical-target` | `CORE` | `CORE-022` | 37 (see "New emergent findings" below) |
| ERROR `missing-canonical-target` | `ML-DEVOS-AS` | `ML-DEVOS-AS-039` | 15 (new — see below) |
| ERROR `missing-canonical-target` | `WEB-REQ` | `WEB-REQ-009` | 57 (the pre-existing, explicitly-preserved genuine gap) |
| WARNING `intentional-noncanonical-mention` | `CORE` | `CORE-022` | 1 — exactly `docs/SENTINEL_REVIEW_NOTES.md:438` |
| WARNING `historical-exception-missing-canonical-record` | `ML-DEVOS-AS` | `ML-DEVOS-AS-008` | 10 (unchanged mechanism) |
| WARNING `historical-exception-missing-canonical-record` | `ML-DEVOS-AS` | `ML-DEVOS-AS-009` | 16 (unchanged mechanism) |

(Site counts above are from the final regeneration performed immediately before commit, i.e. after this handoff section itself was written — which, per the "New emergent findings" discussion immediately below, itself further increases `CORE-022`/`ML-DEVOS-AS-039`/`WEB-REQ-009`'s site counts simply by discussing them. This is the expected, self-describing consequence of a textual pattern matcher scanning `coordination/`, not a new defect discovered after the fact.)

**The core fix works exactly as required:** `docs/SENTINEL_REVIEW_NOTES.md:438` — the exact site named in `AS39-F008` — moved from the ERROR list to a `intentional-noncanonical-mention` WARNING, with the review's own quoted reason.

**But `CORE-022` did not fully disappear from the ERROR list, and this needs to be reported plainly rather than glossed over.** Independent inspection of the remaining 21 `CORE-022` error sites shows every one of them is in `coordination/ARCHITECT_REVIEW.md`, `coordination/IMPLEMENTER_HANDOFF.md`, or `coordination/STATE.md` — i.e. the Architect's own `AS-039` review text and this Builder's own prior handoff/state bookkeeping, both of which necessarily quote the literal string `"CORE-022"` while discussing this exact finding. These are not semantic claims that a `CORE-022` rule should exist; they are meta-discussion of the finding itself, landed in the repository by the normal governance-sync process between the previous handoff and this remediation. The mechanism is doing exactly what `AS39-F008`'s "Required remediation" item 4 demands — "must not globally suppress the ID; if the same ID appears elsewhere as a genuine unresolved reference, those other occurrences must still produce a missing-target ERROR" — it is simply that the review/remediation paper trail itself is now part of "elsewhere." I did not add a broader exception to silence this, because doing so would require either excluding all of `coordination/` from scanning (which would also hide `WEB-REQ-009`'s genuine, Architect-confirmed evidence in that same directory, per `AS39-F007`) or building a quote-aware/context-sensitive parser (explicitly against `AS37-F010`'s dependency-light, purely mechanical design intent). This is reported as a known, accepted, and now-documented (in `README.md`) consequence of a textual pattern matcher applied to living coordination documents — not a defect in the fix itself.

**`ML-DEVOS-AS-039` is a new finding, also not a defect.** It is genuinely referenced (by `coordination/ARCHITECT_REVIEW.md`, `coordination/STATE.md`, and this handoff) but — correctly — has no durable archive file yet at `devos/changes/architect-syncs/ML-DEVOS-AS-039.md`, because that file is created (per this repository's established pattern, e.g. `ML-DEVOS-AS-037.md`) only once a sync concludes, and this sync is still open (`CHANGES_REQUESTED`, remediation in progress). This is a transient, structurally identical instance of the same "reference before the canonical record exists" class `WEB-REQ-009` and `CORE-022` already demonstrate — expected to resolve on its own once this cycle concludes and `ML-DEVOS-AS-039` is archived through the normal process, not something this remediation is authorized or asked to fix.

**`WEB-REQ-009` remains the pre-existing, explicitly-preserved genuine ERROR** (per the review's "Preserve" instruction) — its site count grew from 31 (prior cycle's baseline) to 57 for the same reason as `CORE-022` above (coordination bookkeeping, including this remediation's own review/handoff text, now discusses it too), not because the underlying gap changed.

### Two-consecutive-run determinism proof

```
$ node devos/governance/traceability/generate-traceability.mjs   # run 1
$ node devos/governance/traceability/generate-traceability.mjs   # run 2
$ diff <run-1 copy of traceability-index.json> traceability-index.json   # no output
$ diff <run-1 copy of TRACEABILITY_INDEX.md> TRACEABILITY_INDEX.md       # no output
$ sha256sum traceability-index.json TRACEABILITY_INDEX.md
441a68f84bd577b44ad3ce150d7dc7e46edc14388b7618fee7f11ec09ebd20a6  traceability-index.json
89826d4ad5de044d1f18def97bb7e2abd4f2e275dd6ffaf5d1c2472c3e1b7538  TRACEABILITY_INDEX.md
```

(These are the hashes of the final regeneration performed immediately before commit, i.e. after this handoff document reached its final text — matching the exact `traceability-index.json`/`TRACEABILITY_INDEX.md` committed alongside it. An intermediate regeneration performed while drafting this handoff, before its text was final, produced different site counts and a different hash — expected, per the self-describing dynamic explained above — and is superseded by this one.)

Byte-identical across two consecutive runs.

### Validator run

```
$ node devos/governance/traceability/validate-traceability.mjs
Scanned 191 files across 12 ID families.
Errors: 3  Warnings: 3  Total canonical definitions: 208
[... 3 ERROR lines, 3 WARNING lines, matching the table above ...]
No drift: on-disk generated index matches a fresh generation run.
(exit code: 1 — non-zero because genuine ERRORs remain, exactly as `AS39`'s "Expected post-remediation baseline" anticipates: "The validator is allowed to exit non-zero because a genuine repository-content traceability ERROR remains.")
```

### Focused test results — proof the exception is narrow, not global (required evidence item)

3 new tests added to `tests/traceability.test.mjs`, using synthetic fixtures (never the real repository), covering exactly the three cases `AS39`'s "Required remediation" item 5 lists:

```
$ node --test tests/traceability.test.mjs
# tests 10
# pass 10
# fail 0
```

- **"an exact intentional non-reference occurrence becomes a visible WARNING, not a hard missing-target ERROR (AS39-F008)"** — a fixture with only the matching line produces 0 errors and 1 `intentional-noncanonical-mention` warning.
- **"a second genuine reference to the same missing id still produces an ERROR alongside the exempted WARNING"** — adding a second file with a genuine, non-matching reference to the same ID produces both the WARNING (for the exempted site only) and an ERROR (for the genuine site only) — proving the exception is per-site, not per-ID.
- **"a referenceException scoped to one id does not suppress an unrelated id's genuine missing-target ERROR"** — a second, unrelated ID with no configured exception is unaffected and still produces a normal ERROR.

### Full suite result

```
$ npm test
# tests 348
# pass 348
# fail 0
```

348 = the prior 345 + these 3 new cases. No pre-existing test was modified, and none regressed.

### Explicit confirmations

- **`CORE-022` was not created.** `devos/governance/rules/core-rules.json` was not touched.
- **`WEB-REQ-009`'s source records were not touched or repaired** — it remains reported, exactly as the review's "Preserve" instruction requires.
- **No historical RFC/AS/ADR/Decision content was rewritten** to make the validator green.
- **No S3/S7/S9 implementation, CI/ruleset, runtime/application code, Sentinel version bump, remote resource, deployment, or `main` merge occurred.**
- **`REMOTE_R2_AUTHORIZED: NO`, `REMOTE_D1_AUTHORIZED: NO`, `DEPLOY_AUTHORIZED: NO`, `MAIN_MERGE_AUTHORIZED: NO` all remain unchanged.**
- **The Implementer has not self-certified this remediation as `ARCHITECT VERIFIED`.** Every result above is `ACTOR_REPORTED`, including the self-diagnosed self-reference defect and its fix, until independently reviewed.

### Known limitations / carried-forward items

- `CORE-022` still appears as an ERROR from coordination-bookkeeping sites, for the reasons explained above — this is disclosed, not hidden, and is not believed to be a mechanism defect. If the Architect judges this unacceptable, the next remediation would need to choose explicitly between reduced coordination-directory coverage and a more semantic parser, either of which is a larger design decision than this cycle's narrow mandate.
- `ML-DEVOS-AS-039` now appears as a transient ERROR pending its own eventual durable archival — expected to self-resolve through the normal process once this cycle concludes, not something this remediation touches.
- `WEB-REQ-009` remains open and unrepaired, exactly as instructed.
- `S3 — Typed Task Contracts` remains queued behind this cycle's independent Architect closure.

### Remediation commit

The 6 files above, plus this same documentation update to `coordination/IMPLEMENTER_HANDOFF.md`/`coordination/STATE.md`, are committed together to `governance/maisoglabs-v0.1` on top of base `4f5c8e190b4edbfac9a4bb2cf707d500e4f9647c`. This commit will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## SENTINEL-TRACEABILITY-V1 — Remediation Cycle 2 (ML-DEVOS-AS-040 / AS40-F001)

### Cycle / Change ID

`SENTINEL-TRACEABILITY-V1` — **Remediation Cycle 2, now complete, handed back for Architect review.**

Authority chain: `ML-DEVOS-RFC-012` (`ACCEPTED`) → `ML-DEVOS-AS-037` (`ARCHITECT_APPROVED`) → `D-036` → `ML-DEVOS-AS-039` (Remediation Cycle 1 review) → `ML-DEVOS-AS-040` (`CHANGES_REQUESTED — REMEDIATION CYCLE 2`, single blocker `AS40-F001`). `CURRENT_REMEDIATION_CYCLE: 2` of `MAX_REMEDIATION_CYCLES: 3`.

### Objective

Fix exactly `AS40-F001` and nothing else: Remediation Cycle 1's per-site `referenceExceptions` mechanism correctly resolved the original `CORE-022` false positive, but the review's independent inspection found the generator was still producing hard `missing-canonical-target` ERRORs purely because `coordination/` (the rolling handoff/review/state documents) and this subsystem's own directory necessarily *discuss* the very findings under review — a self-referential feedback loop ("finding → review text mentions finding → scanner reads review → new finding"), not a genuine durable repository gap. Required fix: separate durable reference surfaces from rolling/tooling surfaces for hard-finding purposes, without globally suppressing any ID, without touching canonical-definition discovery, and while keeping Cycle 1's site-specific mechanism intact.

### Base / result state

- Base (pulled and fast-forwarded before any file was touched): `8ee0ae2d0e6b01cb571318a1670f87912a57a498` — the Architect's `ML-DEVOS-AS-040` sync commit, fast-forwarded cleanly from the prior remediation commit `a0c3d59232dc34e5954e66f25382d09df973321b`.
- Read in full before any edit: `coordination/STATE.md` (`CYCLE_ID: SENTINEL-TRACEABILITY-V1`, `TURN: CLAUDE`, `STATUS: CHANGES_REQUESTED`, `CURRENT_REMEDIATION_CYCLE: 2`) and the full `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-040`, finding `AS40-F001`, "Required remediation" items 1–8, "Expected post-remediation baseline," "Architectural rationale," "Non-scope").

### Design decision

Canonical-definition discovery (`discoverDefinitionsForFamily`) already reads its own configured file/dir directly (e.g. `devos/changes/rfcs/`, `brain/DECISION_LOG.md`) rather than through the scanned-file list — so it was already structurally immune to this class of problem, satisfying "Keep canonical-definition discovery unchanged" (item 5) without any code change there. The fix therefore only had to touch **reference extraction**: a new `listDurableReferenceFiles(scannedFiles, config)` filters the already-computed `scannedFiles` list down to a "durable" subset by excluding any file matching a `scan.workingSurfaceExcludePaths` prefix (`coordination/`, `devos/governance/traceability/`, and — defensively, per the review's third bullet — the exact path `tests/traceability.test.mjs`). `buildTraceabilityReport` now calls `extractReferencesForFamily` with this durable-only file list instead of the full scanned-file list. This is a single, uniform change point: it correctly and consistently affects `occurrenceCount`/`inboundReferenceCount`/orphan-detection/`missing-canonical-target`/`duplicate-canonical-definition` all at once, rather than requiring two parallel reference maps — and it directly implements the review's own general framing ("Traceability V1 is a durable-reference integrity checker... The validator should respect that distinction"), not just the narrower "ERRORs only" reading. This choice is also why the review's final "Expected post-remediation baseline" bullet ("any real durable orphan warnings discovered by the corrected scan remain visible") is satisfied automatically: three new genuine orphans (`D-030`, `D-036`, `D-037`) surfaced, each because their only prior inbound reference was, in fact, coordination bookkeeping.

The exact site-specific `referenceExceptions` mechanism from Remediation Cycle 1 (item 6) is untouched — it still operates on whatever reference-site list it is given, and since `docs/SENTINEL_REVIEW_NOTES.md` is not a working surface, it still correctly matches and produces the `intentional-noncanonical-mention` WARNING.

### Exact diff — 6 files modified, 0 added, 0 deleted

Confirmed by `git status --porcelain` / `git diff --stat` immediately before this commit: exactly these 6 paths changed, all inside the already-authorized `devos/governance/traceability/` root plus its one test file — nothing else.

- `devos/governance/traceability/traceability.config.json` — added `scan.workingSurfaceExcludePaths: ["coordination/", "devos/governance/traceability/", "tests/traceability.test.mjs"]`, with an explanatory comment field. No existing config field removed or renamed; `referenceExceptions`/`historicalExceptions` from prior cycles are unchanged.
- `devos/governance/traceability/generate-traceability.mjs` — added `isWorkingSurfaceFile()` and `listDurableReferenceFiles()`; `buildTraceabilityReport` now extracts references from `durableReferenceFiles` instead of the full `scannedFiles`. The report now also exposes `durableReferenceScannedFileCount` and `workingSurfaceExcludePaths` fields for independent auditability of exactly what fed hard-finding detection. Two message strings (orphan warning, in two places) reworded from "scanned surface" to "durable scanned surface" for accuracy; no logic change to those two sites beyond the wording.
- `devos/governance/traceability/traceability-index.json` / `TRACEABILITY_INDEX.md` — regenerated from the real repository (see "Regenerated baseline" below).
- `devos/governance/traceability/README.md` — replaced the Cycle-1-era "known, accepted consequence" paragraph (which had framed the coordination self-reference problem as an intentional, permanent limitation) with a full description of the durable/rolling split, since AS-040 correctly rejected that framing as insufficient and required an actual fix rather than a documented limitation.
- `tests/traceability.test.mjs` — 4 new focused tests (see "Focused test results").

**Confirmed not touched:** `WEB-REQ-009`'s source records, `CORE-022`/`core-rules.json`, any RFC/AS/ADR/Decision file (no Architect Sync was fabricated or archived early — `ML-DEVOS-AS-040` and the still-open cycle's own sync remain un-archived exactly as they should, since the review has not concluded), or any application/runtime code.

### Regenerated baseline (required evidence item) — matches "Expected post-remediation baseline" exactly

```
$ node devos/governance/traceability/generate-traceability.mjs
Scanned 191 files. Errors: 1. Warnings: 17.
```

- `durableReferenceScannedFileCount`: 183 of the 191 scanned files fed hard-finding detection; 8 excluded as working/tooling surfaces.
- **Errors: 1** — exactly `WEB-REQ-009` (31 sites, all on durable product/runtime/test/RFC/ADR/docs surfaces outside `coordination/`), the one genuine, explicitly-preserved gap.
- **`CORE-022` no longer appears as an ERROR at all.** It appears exactly once, as the Cycle 1 `intentional-noncanonical-mention` WARNING at `docs/SENTINEL_REVIEW_NOTES.md:438` — its only durable-surface site, which the referenceException exactly consumes.
- **`ML-DEVOS-AS-039` no longer appears anywhere in the report.** Its only reference sites were all in `coordination/`, which is now excluded from hard-finding detection — exactly the review's expectation ("should no longer appear as a missing-target ERROR merely because the durable archive does not exist yet").
- **Warnings: 17** — the 2 historical exceptions (`ML-DEVOS-AS-008`, `ML-DEVOS-AS-009`, unchanged), the 1 `CORE-022` intentional-non-reference warning, and 14 orphan warnings (`D-001`–`005`, `D-009`, `D-022`, `D-030`, `D-035`–`037`, `WEB-SEC-006`–`008`). `D-030`, `D-036`, and `D-037` are **new** orphan findings versus the pre-Cycle-2 baseline — each is a genuine consequence of the corrected, durable-only scan: their only prior "inbound reference" was coordination bookkeeping discussing them, not a durable cross-reference. This is disclosed, not hidden, and is exactly what the review's final baseline bullet anticipated.

### Two-consecutive-run determinism proof

```
$ node devos/governance/traceability/generate-traceability.mjs   # run 1
$ node devos/governance/traceability/generate-traceability.mjs   # run 2
$ diff <run-1 copy> traceability-index.json   # no output
$ diff <run-1 copy> TRACEABILITY_INDEX.md     # no output
$ sha256sum traceability-index.json TRACEABILITY_INDEX.md
330a0a37b68a85a5a26a3d65de75b7c91e9e82510c3c18ddb40f3470d7029886  traceability-index.json
e38c1ff954c019d186b59d7c76f041d25cbb511a1b3b1ee99ac938a8689a76b1  TRACEABILITY_INDEX.md
```

Byte-identical across two consecutive runs. Unlike Remediation Cycle 1, this hash is stable with respect to this very handoff document's own text: `coordination/` is now a working-surface-excluded directory, so nothing this document says about `WEB-REQ-009`, `CORE-022`, or any other ID can feed back into a new finding or shift a count — the self-amplification problem observed and disclosed in Cycle 1's handoff cannot recur for `coordination/` content.

### Validator run

```
$ node devos/governance/traceability/validate-traceability.mjs
Scanned 191 files across 12 ID families.
Errors: 1  Warnings: 17  Total canonical definitions: 208
[... 1 ERROR line (WEB-REQ-009), 17 WARNING lines matching the baseline above ...]
No drift: on-disk generated index matches a fresh generation run.
(exit code: 1 — non-zero because the one genuine durable ERROR remains, exactly as the review's "Traceability V1 can still be Architect-accepted if the validator accurately reports that external gap and its own implementation is correct" anticipates.)
```

### Focused test results — proof durable references still fail closed while excluded surfaces do not (required evidence item)

4 new tests added to `tests/traceability.test.mjs`, using synthetic fixtures (never the real repository), covering exactly the three cases `AS40`'s "Required remediation" item 7 lists, plus one direct unit test of the new filter function:

```
$ node --test tests/traceability.test.mjs
# tests 14
# pass 14
# fail 0
```

- **"a missing id mentioned only on an excluded rolling/tooling surface does not create a hard ERROR"** — a fixture where the only mention of an undefined ID is on a `coordination/`-prefixed file produces 0 errors.
- **"the same missing id referenced on a durable included surface still creates an ERROR"** — adding a second, genuine mention on a non-excluded file produces exactly one ERROR, sited only at the durable file.
- **"canonical definition discovery still works even when the reference scan excludes working/tooling surfaces"** — a canonical definition is still discovered and counted correctly regardless of where (or whether) the ID is referenced; its only mention being on an excluded surface correctly yields zero inbound references and an orphan warning, proving the definition/reference layers are properly decoupled.
- **"listDurableReferenceFiles filters by working-surface path prefix"** — a direct unit test of the new pure function against a plain list of paths.

### Full suite result

```
$ npm test
# tests 352
# pass 352
# fail 0
```

352 = the prior 348 + these 4 new cases. No pre-existing test was modified, and none regressed.

### Explicit confirmations

- **`WEB-REQ-009`'s source records were not touched or repaired.**
- **`CORE-022` was not created.** `devos/governance/rules/core-rules.json` was not touched.
- **No Architect Sync was fabricated or archived before its review concluded.** `ML-DEVOS-AS-040`'s own durable archive file does not exist yet in this commit, correctly, since this review cycle is still open.
- **No historical RFC/AS/ADR/Decision content was rewritten** to make the validator green.
- **The site-specific `referenceExceptions` mechanism from Remediation Cycle 1 is unchanged and still functions correctly** (proven by `CORE-022` still resolving to its Cycle 1 WARNING).
- **No ID was globally suppressed.** The fix is a file-scope exclusion from hard-finding detection, not an ID-scope suppression — proven by the "durable surface still errors" test.
- **No S3/S7/S9 implementation, CI/ruleset, runtime/application code, Sentinel version bump, remote resource, deployment, or `main` merge occurred.**
- **`REMOTE_R2_AUTHORIZED: NO`, `REMOTE_D1_AUTHORIZED: NO`, `DEPLOY_AUTHORIZED: NO`, `MAIN_MERGE_AUTHORIZED: NO` all remain unchanged.**
- **The Implementer has not self-certified this remediation as `ARCHITECT VERIFIED`.** Every result above is `ACTOR_REPORTED` until independently reviewed.

### Known limitations / carried-forward items

- `WEB-REQ-009` remains open and unrepaired, exactly as instructed — it is the one genuine, durable, cross-referenced repository-content gap this subsystem is designed to surface.
- `D-030`, `D-036`, `D-037` are new orphan WARNINGs (not ERRORs) — each a genuine, previously-masked observation that these decisions currently have no durable inbound cross-reference outside coordination bookkeeping. No action is proposed or authorized on these; they are reported per the subsystem's design.
- `S3 — Typed Task Contracts` remains queued behind this cycle's independent Architect closure.

### Remediation commit

The 6 files above, plus this same documentation update to `coordination/IMPLEMENTER_HANDOFF.md`/`coordination/STATE.md`, are committed together to `governance/maisoglabs-v0.1` on top of base `8ee0ae2d0e6b01cb571318a1670f87912a57a498`. This commit will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.

---

## MAISOGLABS Skills Foundation V0.1 — Discovery Handoff

### Cycle / Change ID

`MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY` — **Discovery complete, handed back for Architect review.**

Authority: Paulo priority directive, `D-038` (brain/DECISION_LOG.md). Full brief: `coordination/ARCHITECT_REVIEW.md` (live at the time of this handoff — "DISCOVERY AUTHORIZED — MAISOGLABS SKILLS FOUNDATION V0.1").

### Base / result state

- Base (pulled and fast-forwarded before any file was touched): `0c69ba2118b50142a3648bb95cba5fcb359a2b27` — the commit that closed Sentinel Traceability V1 (`ML-DEVOS-AS-041`, `ML-DEVOS-ADR-010`) and pivoted the active cycle to this discovery via `D-038`.
- Read in full before any work: `coordination/STATE.md`, the full `coordination/ARCHITECT_REVIEW.md` discovery brief, `brain/DECISION_LOG.md` `D-038`, and — as required by the brief itself — every file the brief names under "Existing reusable procedures that MUST be inspected": `AGENTS.md`, `CLAUDE.md`, `brain/00_HOME.md`, `brain/protocols/ARCHITECT_SYNC.md`, `brain/ARCHITECT_HANDOFF.md`, `brain/GOVERNANCE_MAP.md`, `brain/IMPLEMENTATION_STATUS.md`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, `brain/PROJECT_GOVERNANCE.md`, `coordination/` (structure), `devos/templates/` (all 7), `devos/handoffs/` (structure + S0 in full), `devos/governance/` (all subdirectories, especially `traceability/README.md`, `rules/`, `specifications/`, `change-policy/CHANGE_GOVERNANCE_POLICY.md`), `devos/changes/` (README indexes), `docs/release/` (both `WEB_REL_001_*` files), and `brand/V3/` (`README.md`, `DESIGN_GOVERNANCE.md`). This survey was delegated to and executed by a subagent under this session's direction; its full structured report is preserved in this session's transcript and its findings are reproduced/synthesized below and in `ML-DEVOS-RFC-014.md` §"Discovery findings" material. External/provider conventions (SKILL.md frontmatter spec, progressive disclosure, provider discovery paths, official security guidance) were independently verified via live documentation fetch (`code.claude.com/docs/en/skills`, `github.com/anthropics/skills`) and web search, not asserted from training-data memory alone.

### EXISTING REUSABLE PROCEDURES FOUND

- **Architect Review / Sync** — `brain/protocols/ARCHITECT_SYNC.md` (explicit review-flow pipeline, 4 review modes with defined verdict vocabulary), `coordination/README.md` (turn-protocol mechanics), 41 worked instances in `devos/changes/architect-syncs/`.
- **Implementation Handoff** — `brain/ARCHITECT_HANDOFF.md` (exact required field list: `CHANGE ID / OBJECTIVE / FILES CHANGED / REQUIREMENTS AFFECTED / RISKS AFFECTED / IMPLEMENTATION SUMMARY / TESTS EXECUTED / RESULTS / EVIDENCE / KNOWN LIMITATIONS / UNRESOLVED QUESTIONS / REQUESTED REVIEW SCOPE`), `CLAUDE.md`'s own "Phase 1 handoff requirement," 3 worked S0/S1/S2 instances in `devos/handoffs/`.
- **Governance / Traceability Audit** — `devos/governance/traceability/` (README + deterministic generator/validator, fully implemented, tested, `ML-DEVOS-AS-041`-closed). The single most complete, "skill-ready" procedure in the repository.
- **Project Orientation** — `brain/00_HOME.md`'s numbered "read order for a new agent or reviewer."
- **Design Governance contribution checklist** — `brand/V3/DESIGN_GOVERNANCE.md` §11 (Need/Existing system/Consistency/Interaction/Responsive/Evidence checklist) — the clearest standalone checklist in the repository outside Traceability.
- **Release Readiness assessment** — `docs/release/WEB_REL_001_PRODUCTION_READINESS.md` (brief) + `WEB_REL_001_READINESS_REPORT.md` (21-section worked instance, including a post-deploy verification checklist).
- **Legacy branch inventory** — described narratively in `CLAUDE.md`/`brain/PROJECT_GOVERNANCE.md`/`D-008`, never abstracted into a standalone checklist; a completed one-off instance exists (8 branches, classified `UNINSPECTED LEGACY/EXPERIMENTAL`).
- **Change classification / RFC-ADR-Decision-Sync-Implementation lifecycle** — `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` (8 change classes, 5 distinct record types, explicit target lifecycle diagram) and the 7 fill-in `devos/templates/*_TEMPLATE.md` files.
- **Implicit "knowledge/realization capture" convention** — `SENTINEL-MIGRATION-DEBT-001` (`REPOSITORY_OVERLAY_TOPOLOGY.md`), `TRACE-DEBT-001` (`coordination/STATE.md`), the architect-syncs README's "Legacy verbatim claims — audited and corrected" writeup: a recurring pattern (assign a durable `-DEBT-NNN`/`-GAP-NNN` id, record inline, never silently fix or lose) that is real and repeated but has never been written down as a named procedure.
- **Authority-recovery check** — `devos/governance/BOOTSTRAP_SOURCE_OF_TRUTH.md`'s one-paragraph rule: before treating an instruction as authoritative, check whether a corresponding commit exists.

### DUPLICATION / OVERLAP ANALYSIS

- "Project-State Recovery" and "Project Orientation" (onboarding) are, in practice, the same procedure nowhere distinguished — `RFC-014` merges them into one candidate rather than inventing an artificial boundary.
- "Project Health" has no general procedure; the only concrete artifact (`WEB_REL_001_*`) is release-scoped, not general — treated as a separate, narrower, deferred candidate rather than force-fit into "health."
- "Research Before Architectural Decisions" and "Public/Private Information Classification" have **zero** existing procedure to deduplicate against — see PROCEDURES NOT CONVERTED TO SKILLS.
- No two of the 5 proposed initial skills (below) share an activation trigger; see `RFC-014` §7 for the full pairwise analysis.

### PROPOSED SKILL ARCHITECTURE

Full definition-boundary table, canonical-location rationale, and design constraints are in `ML-DEVOS-RFC-014.md` §§2–5. Summary: a Skill is a thin, non-authoritative wrapper around an already-authorized procedure (never a rule, a state record, an ADR, a capability grant, or a new authority); `Capability != Authority` (`CORE-002`/`CORE-008`) applies to Skills exactly as it does to tools/credentials.

### PROPOSED CANONICAL LOCATION

`devos/skills/` — consistent with the existing `devos/` subsystem-root pattern (`devos/governance/`, `devos/changes/`, `devos/templates/`, `devos/handoffs/`). Not created in this cycle; would need registration as a new `devos/devos-manifest.json` `reserved_subsystem_roots` entry at implementation time (`RFC-014` §"Migration impact").

### PROPOSED INITIAL SKILLS

5 proposed for a future, separately authorized V0.1 (none built now): **Governance/Traceability Audit**, **Architect Review/Sync**, **Implementation Handoff**, **Project Orientation/State Recovery** (merged candidate), **Knowledge/Realization Capture** (genuinely new — formalizes an existing implicit convention, does not duplicate any existing named procedure). Full rationale per skill: `ML-DEVOS-RFC-014.md` §6.

### PROCEDURES NOT CONVERTED TO SKILLS

- **Project Health** (general concept) — rejected; no general procedure exists to wrap; would require inventing new procedure content inside a skill file, which this RFC's own anti-duplication instruction implies should not happen in reverse either. A narrower future "Release Readiness Review" skill (wrapping the existing `WEB_REL_001_*` pair) is noted as a legitimate later candidate, not included in V0.1.
- **Research Before Architectural Decisions** — rejected; zero existing procedure found (only post-hoc narrative in Decision Log entries); needs its own design RFC before it could become a skill.
- **Public/Private Information Classification** — rejected; `RISK-WEB-013` already records this as an unsolved architectural risk (`OPEN despite passing tests`); a skill here risks false confidence over a repository-acknowledged open gap. Flagged as a Paulo decision item, not a Skills Foundation deliverable.

### SKILL CHECK ROUTING MODEL

Documentary convention, not new machinery: each provider's own runtime already performs progressive-disclosure activation (verified live against Claude Code's actual documented behavior — description/`when_to_use` loaded at session start, capped at 1,536 combined characters, full body loaded only on activation match). "SKILL CHECK" means an agent checks `devos/skills/` for a matching procedure before re-deriving one from scattered files — proposed as a one-line future addition to `brain/00_HOME.md`'s existing read-order list, not a new gate or engine. Full detail: `RFC-014` §4.

### PROVIDER ADAPTER STRATEGY

Deliberately left as an **open question** (see below) — external evidence shows no single dominant mechanical answer across providers (`.claude/skills/`, `.agents/skills/`, `.gemini/skills/`, dual-manifest plugin packaging all coexist). The one fixed constraint this RFC does set: `devos/skills/` remains the single canonical source; no provider directory may hold independently-diverging content. No provider-adapter directory is created in this cycle. Full detail: `RFC-014` §5.

### GOVERNANCE INTEGRATION

`GOVERNANCE > SKILLS`, `CURRENT AUTHORIZATION > SKILL CAPABILITY`, and `CAPABILITY != AUTHORITY` are carried from the authorizing brief directly into the RFC's definition boundary (§2) and every proposed skill's design constraints. Every skill's "authoritative sources" field is mandatory. No skill may claim authority to alter `ML-DEVOS-ARCH-001`, override `coordination/STATE.md`'s `AUTHORIZED_SCOPE`, or substitute for a Paulo gate.

### EXTERNAL SKILL SECURITY MODEL

`FOUND ONLINE != TRUSTED` (default). Six-item mandatory pre-adoption review (instruction review; scripts/dependencies/`allowed-tools`/dynamic-shell-injection/hooks/isolation review; overlap check; security/permission assessment; provenance/version/pinning; required authorization — treated as capability-adjacent, gated the same as a comparable tool grant). No automatic install or execution merely because a skill was discovered. Full detail and evidence basis: `RFC-014` §§8–9.

### EVALUATION STRATEGY

12 required case categories designed against the 5 proposed skills (correct activation, missed/incorrect activation, overlapping skills, governance conflict, capability without authority, unauthorized scope, frozen-baseline protection, public/private boundary [deliberately untestable — documented gap, not silently skipped], unrelated open-risk handling, missing Paulo decision, external-skill trust boundary, smallest-sufficient-match). Full table: `RFC-014` §10. No `evals/` content is built in this cycle — this is design only.

### TRACEABILITY UPDATES

None applied. No second traceability system created (per explicit instruction). A future, config-only option is recorded but not adopted: Traceability V1's existing `file`-per-id discovery strategy could cover a future `ML-DEVOS-SKILL-NNN` id family the same way it already covers RFC/AS/ADR — deferred until skills actually exist, since assigning durable IDs to non-existent artifacts would itself be a false record. `devos/governance/traceability/traceability.config.json` was not touched this cycle.

### S3 PAUSE / QUEUE RECORD

Confirmed via live repository inspection before this cycle began: the governance branch had zero implementation commits after S3 activation, and `devos/contracts/` contains only its pre-existing README — pausing creates no abandoned implementation diff. S3 status remains exactly as `D-038`/`coordination/STATE.md` record it: `PAUSED / QUEUED — AUTHORITY PRESERVED`, with `ML-DEVOS-RFC-013`/`ML-DEVOS-AS-038`/`D-037` unchanged. This discovery found no need for any S3 amendment before resumption (`RFC-014` §12) and did not touch `devos/contracts/` or any S3-related record.

### FILES CREATED

- `devos/changes/rfcs/ML-DEVOS-RFC-014.md`

### FILES MODIFIED

- `devos/changes/rfcs/README.md` — added the `ML-DEVOS-RFC-014.md` index entry, in the same one-paragraph-summary style as every other entry.
- `coordination/IMPLEMENTER_HANDOFF.md` / `coordination/STATE.md` — this handoff and the turn handback.

**Confirmed not touched:** any application/runtime file, any existing brain/devos governance record other than the two listed above, `devos/devos-manifest.json`, `devos/governance/traceability/*`, `devos/contracts/*`, and no `devos/skills/`, `.claude/skills/`, `.codex/skills/`, `.gemini/skills/`, or `.github/skills/` directory was created — confirmed by `git status --porcelain` showing exactly the 2 files above plus this documentation commit.

### OPEN QUESTIONS

1. **Provider adapter mechanism** — symlink, generated copy, or plugin/marketplace manifest for exposing `devos/skills/` content to `.claude/skills/`/`.codex/skills/`/etc.? Not resolved by this RFC (§5); needs an implementation-time decision.
2. **Durable skill IDs** — should each skill eventually get an `ML-DEVOS-SKILL-NNN` id for Traceability V1 integration, reusing the existing `file`-per-id strategy? Recorded as a viable option, not decided (§11).
3. **"Release Readiness Review" as a V0.2 skill** — worth a dedicated future evaluation once V0.1 exists and its evaluation methodology is proven.
4. **Whether/how "Research Before Architectural Decisions" ever gets a first procedure at all** — this discovery found nothing to wrap; a future RFC would need to define the procedure itself before any skill could wrap it.

### PAULO DECISIONS REQUIRED

1. Whether to accept `ML-DEVOS-RFC-014` and authorize a separate V0.1 **implementation** cycle (this discovery does not request or assume that authorization).
2. Whether/when to open a dedicated governed remediation for `RISK-WEB-013` (public/private Git-repository-level exposure) — flagged here because it blocks any future "Public/Private Information Classification" skill from being anything more than false confidence over an acknowledged open risk.
3. Whether `devos/skills/` should be registered as a new `reserved_subsystem_roots` entry in `devos/devos-manifest.json` at implementation time (not done now).

### READY FOR ARCHITECT REVIEW

Yes. This discovery cycle produced exactly the authorized files (`ML-DEVOS-RFC-014.md`, `devos/changes/rfcs/README.md` index update, and this handoff/state bookkeeping) and created no skill implementation, no canonical or provider-adapter directory, no S3 resumption, and no product/runtime/remote/deployment change. All findings above are `ACTOR_REPORTED`/the underlying file survey is `INDEPENDENTLY_INSPECTED` by this session against the real repository; external-convention claims are backed by live documentation fetch and web search performed this cycle, cited in `RFC-014` §8, not asserted from training-data memory alone. The Implementer has not self-certified this discovery as `ARCHITECT VERIFIED`.

### Discovery commit

The 3 files above are committed together to `governance/maisoglabs-v0.1` on top of base `0c69ba2118b50142a3648bb95cba5fcb359a2b27`. This commit will be mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`.
