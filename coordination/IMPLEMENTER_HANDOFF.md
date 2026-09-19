# Implementer Handoff

Status: `READY_FOR_ARCHITECT` — Remediation Cycle 1 (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

**Remediation Cycle 1 update:** see the "WEB-INC-003 Remediation Cycle 1" section at the end of this document for the current cycle's exact scope, commit, and evidence. Everything above that section describes the original (pre-remediation) implementation handoff and remains accurate except where the remediation section says otherwise.

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
