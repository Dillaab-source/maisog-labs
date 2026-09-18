# Implementer Handoff

Status: `READY_FOR_ARCHITECT` (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

## Cycle / Change ID

`MAISOGLABS-WEB-INC-002-READ-DASHBOARD` — **AUTHORIZED IMPLEMENTATION**

Authority chain: `ML-DEVOS-RFC-004` → `ML-DEVOS-AS-015` (`ARCHITECT_APPROVED — WEB-INC-002 RFC-004 COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`) → `D-025` (Paulo: "Proceed with WEB-INC-002 authorization.").

## Objective

Connect the accepted `WEB-INC-001` authentication boundary to the accepted `WEB-INC-005` local D1 substrate for exactly one bounded, read-only, authenticated admin status endpoint (`GET /admin/api/dashboard`), with authentication strictly preceding all routing/data access, an explicit allowlist serializer, and no mutation capability of any kind.

## Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `ac3c883aba55e69d85b3ec38171462cae350d68a` — matches exactly the SHA the request required.
- Read in full before any edit: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-015`, all 15 findings `AS15-F001`–`F015`), `devos/changes/rfcs/ML-DEVOS-RFC-004.md` (full proposed architecture), `devos/changes/architect-syncs/ML-DEVOS-AS-015.md` (durable archive, confirmed byte-identical in substance to the rolling review), `brain/DECISION_LOG.md` `D-025`, `devos/changes/adrs/ML-DEVOS-ADR-003.md` (the WEB-INC-005 storage-architecture ADR this increment builds on). Also read the existing `worker/auth.mjs`, `worker/index.mjs`, `worker/d1/repository.mjs`, `app/admin/page.js`, `tests/worker-auth.test.mjs`, and `wrangler.jsonc` to understand the exact accepted behavior this increment must preserve.

## Exact changed-file list — 17 files

To avoid repeating the exact undercounting defect an earlier increment's Architect review caught (`ML-DEVOS-AS-014` `AS14-F005` — a Builder handoff that named every substantive path correctly but miscounted the heading by omitting the two coordination files from the same commit), this count explicitly includes `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`, since both are part of this same implementation commit: **15 substantive implementation/config/documentation paths + 2 coordination paths = 17 total.**

**New (3):**
- `worker/admin/dashboard.mjs` — the bounded post-authentication route dispatcher: `GET /admin/api/dashboard` handler, allowlist serializer, lifecycle/display-label derivation, protected-404/405/503/500 handling
- `app/admin/DashboardClient.js` — the one bounded client component (fetches the same-origin dashboard endpoint, renders status only)
- `tests/worker-admin-dashboard.test.mjs` — 20 new tests

**Modified, substantive (12):**
- `worker/auth.mjs` — `handleRequest` gained an optional `dispatch({ request, url, assets })` callback, invoked only after authentication succeeds (default behavior unchanged when omitted — every existing caller/test that doesn't pass `dispatch` behaves exactly as before); every protected-path response (success or failure) now gets `Cache-Control: no-store` via a single `withNoStore()` wrapper
- `worker/index.mjs` — wires `handleAdminDispatch` as the `dispatch` callback, passing `env.DB`
- `worker/d1/repository.mjs` — added `readDashboardStatusRows(db, collectionKey)` and `readSiteSettingsStatusRow(db)`: bounded, read-only `SELECT`-only projections (LEFT JOIN across both pointers so every entity appears regardless of lifecycle state, including archived)
- `app/admin/page.js` — upgraded from the WEB-INC-001 authentication-only placeholder into the dashboard shell, rendering `DashboardClient`
- `brain/GOVERNANCE_MAP.md`, `brain/IMPLEMENTATION_STATUS.md`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, `docs/ARCHITECTURE.md`, `docs/product/PRD.md`, `docs/product/BUILD_PLAN.md`, `docs/product/DATA_BACKEND_SPEC.md` — current-state documentation updated to record what actually became implemented, resolving the "no authenticated D1 dashboard/protected-read endpoint exists" statements that this increment would otherwise leave stale, without overclaiming mutation/session/remote-D1 capability

**Modified, coordination (2):**
- `coordination/IMPLEMENTER_HANDOFF.md` (this file)
- `coordination/STATE.md`

**Not touched, exactly as required:** `migrations/0001_web_inc_005_init.sql` (schema unchanged — confirmed identical table set via `wrangler d1 execute`), `worker/d1/schema.mjs`, `worker/d1/migrate.mjs`, `worker/d1/validate.mjs`, `scripts/d1-migrate.mjs`, `wrangler.jsonc`, `tests/content.test.mjs`, `tests/d1-migration.test.mjs`, `tests/worker-auth.test.mjs`, `data/site.js`, `lib/content/*`, `app/page.js`, `components/`, `package.json`, `package-lock.json`. Confirmed by `git diff --stat` against every one of these paths returning empty.

No new dependency was added (`package.json`/`package-lock.json` unchanged).

## Route inventory

| Route | Method | Auth required | Behavior |
|---|---|---|---|
| `/admin`, `/admin/*` (non-API) | any | yes (`WEB-INC-001`) | unchanged: serves the protected static dashboard shell via the Assets binding |
| `GET /admin/api/dashboard` | GET | yes | returns the bounded allowlisted JSON status projection (200) |
| `/admin/api/dashboard` | POST/PUT/PATCH/DELETE/other | yes | `405`, zero D1 invocation |
| `/admin/api/*` (any other path) | any | yes | protected `404`, zero D1 invocation, never falls through to static assets |
| any `/admin`/`/admin/*` path | any | invalid/missing auth | `401`, exactly as `WEB-INC-001` already behaved — dispatch is never reached |

Exactly one new editorial data endpoint exists: `GET /admin/api/dashboard`. No generic `/admin/api/*` service was created.

## Dashboard JSON schema (exact, with example)

```json
{
  "siteSettings": {
    "id": "default",
    "state": "published",
    "publishedRevisionId": 1,
    "draftRevisionId": null,
    "displayLabel": "Maisog Labs"
  },
  "navigation": [
    {
      "id": "nav-projects",
      "state": "published",
      "publishedRevisionId": 1,
      "draftRevisionId": null,
      "displayLabel": "Projects"
    }
  ],
  "foundations": [ /* same shape as navigation, no slug/section fields */ ],
  "projects": [
    {
      "id": "project-clinicflow",
      "slug": "clinicflow",
      "state": "published",
      "publishedRevisionId": 5,
      "draftRevisionId": null,
      "displayLabel": "ClinicFlow"
    }
  ],
  "services": [ /* same shape as navigation */ ],
  "processSteps": [ /* same shape as navigation */ ],
  "sections": [
    {
      "id": "home",
      "state": "published",
      "publishedRevisionId": 1,
      "draftRevisionId": null,
      "displayLabel": "home",
      "order": 1,
      "visible": true
    }
  ]
}
```

`state` is always one of `published` / `draft` / `published_with_draft` / `archived`, derived purely from `publishedRevisionId`/`draftRevisionId` (never a stored column). `slug` appears only on `projects` entries; `order`/`visible` appear only on `sections` entries. No other key exists on any object at any level.

## Allowlist serializer (`AS15-F004`)

`worker/admin/dashboard.mjs`'s `serializeEntityRow`/`serializeSiteSettings` positively construct every field from a named source value — there is no raw-row pass-through and no "delete a few sensitive fields from the rest" pattern. A new column added to any `*_revisions` table in the future cannot become visible through this endpoint without an explicit code change to these two functions. Verified by the "the dashboard response excludes every non-allowlisted field, including sensitive legacy content" test, which seeds `project_revisions`/`service_revisions`/`site_settings_revisions` rows containing deliberately distinctive `SECRET_*_SHOULD_NOT_LEAK` values (summary, category, stack, SEO/hero/about copy, email, provenance) and asserts none of them — nor the raw column names `stack_json`/`created_by`/`summary`/`category`/`accent`/`featured`/`body`/`contact`/`email` — appear anywhere in the raw response text, then asserts every object's key set is a subset of the allowed keys.

## Authentication-first ordering (`AS15-F002`, `AS15-F003`)

`worker/auth.mjs`'s `handleRequest` is structured so that `dispatch` (and therefore any D1 access) is invoked only after the existing config-validation and JWT-verification steps both succeed — the same code path and the same fail-closed checks as `WEB-INC-001`, completely unmodified in logic. Proven directly:

- "unauthenticated GET /admin/api/dashboard is rejected with zero D1 invocation" — a `db` spy that records every `prepare()` call shows zero calls after a 401.
- "malformed/expired/wrong-audience assertions against the dashboard endpoint cause zero D1 invocation" — same spy, same result, across three distinct token-level failure modes.
- "invalid auth configuration causes zero D1 invocation even with a validly signed token" — a valid token cannot compensate for invalid config, exactly as `WEB-INC-001` already required, and this now additionally covers the dashboard path specifically.
- All 30 pre-existing `tests/worker-auth.test.mjs` tests (unmodified) continue to pass unchanged, proving default (`dispatch` omitted) behavior for ordinary `/admin` asset requests is byte-for-byte the same as before this increment.

## Read-only D1 construction (`AS15-F006`, `AS15-F013`)

`worker/d1/repository.mjs`'s two new functions are plain `SELECT ... LEFT JOIN ...` statements built from a fixed per-collection table/column configuration — no caller-supplied SQL, table name, or column name is ever accepted. The "the dashboard path performs no INSERT/UPDATE/DELETE/REPLACE/DDL — only SELECT statements" test wraps the real seeded database's `prepare()` to record every SQL string `buildDashboardPayload` issues and asserts each one matches `/^SELECT\b/i`. The 14-table WEB-INC-005 schema (`migrations/0001_web_inc_005_init.sql`) is untouched; no table was added.

## Lifecycle/display-label semantics (`AS15-F010`, `AS15-F011`)

Verified against a hand-built fixture covering all four states on `navigation` (published, draft, published_with_draft, archived): published-pointer-only → `published`; draft-pointer-only → `draft`; both → `published_with_draft` (display label prefers the draft label); neither → `archived` (display label falls back to the stable id, per `AS15-F010`'s explicit allowance — no historical-revision lookup is attempted). `site_settings` is returned as exactly one bounded record (`AS15-F011`), never exploded into per-field entities.

## Failure/cache/header hardening (`AS15-F007`, `AS15-F008`)

- Missing/undefined `db` → generic `503`, zero D1 call (checked before any repository function is invoked).
- A `db` whose reads reject with a deliberately sensitive fake error (`SENSITIVE_FAKE_SQL_ERROR_MUST_NOT_LEAK: SELECT * FROM secrets`) → generic `500`; the test asserts the response body neither contains that literal string nor the word "select" in any case.
- Every protected `/admin`/`/admin/*` response — the 401 from `worker/auth.mjs`, the static admin asset 200, and every dashboard-path response (200/404/405/500/503) — carries `Cache-Control: no-store`, enforced once at the `handleRequest` boundary rather than per-handler.
- Dashboard JSON additionally sets `Content-Type: application/json` and `X-Content-Type-Options: nosniff`.
- No `Access-Control-Allow-Origin` (or any other CORS) header is ever set — verified by asserting its absence.

## UI scope (`AS15-F009`)

`app/admin/DashboardClient.js` is a plain `"use client"` React component using `fetch`/`useState`/`useEffect` only. It imports no `worker/d1/*`, no server repository module, no SQL, and no D1 binding — confirmed by direct inspection (no such import exists anywhere under `app/`). It renders loading/error/data states and a read-only list per domain; it contains no button, form, or handler for create/edit/save/delete/publish/unpublish/upload/theme/journal/audit actions, hidden or visible.

## Test results

`npm test`: **96 passed, 0 failed** — 27 `tests/content.test.mjs` (unchanged) + 30 `tests/worker-auth.test.mjs` (unchanged) + 19 `tests/d1-migration.test.mjs` (unchanged) + 20 new `tests/worker-admin-dashboard.test.mjs`.

`npm run build`: succeeded, same three routes (`/`, `/_not-found`, `/admin`) as before this increment.

## Local-only evidence — full command log

| Command | Result |
|---|---|
| `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` | Fast-forwarded to `ac3c883...` before any file was touched |
| `npm test` | 96 passed, 0 failed |
| `npm run build` | Succeeded, unchanged routes |
| `npx wrangler deploy --dry-run` | Succeeded; binding table unchanged (`env.DB`, `env.ASSETS`, `env.ACCESS_TEAM_DOMAIN`, `env.ACCESS_AUD`); "--dry-run: exiting now."; no external Cloudflare resource created or modified |
| `node scripts/d1-migrate.mjs` (fresh local D1 state) | 23 entities created, 0 no-op — unchanged migration behavior |
| `npx wrangler dev --local` + `curl` (real Workers/Miniflare runtime, unauthenticated) | `GET /` → `200`; `GET /admin` → `401` + `Cache-Control: no-store`; `GET /admin/api/dashboard` → `401` + `Cache-Control: no-store`; `GET /admin/api/nope` → `401`; `POST /admin/api/dashboard` → `401` — every protected path fails closed before any route dispatch, reproduced in the actual local Workers runtime, not only the Node unit-test harness |
| `curl http://localhost:8799/cdn-cgi/local/explorer/api/d1/database` (local `wrangler dev` introspection) | Confirmed the `DB` binding is live in the running local Worker |
| `npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' ..."` | Exactly the same 14 authorized tables as before this increment — no schema change |
| Secret/config scan | `grep` for `process.env`, PEM/private-key markers, secret/credential/token/account-id keyword patterns across `worker/`, `app/admin/`, `tests/worker-admin-dashboard.test.mjs`, `wrangler.jsonc` — no matches beyond explanatory comments and deliberate `SECRET_*_SHOULD_NOT_LEAK` test-fixture placeholders used to prove non-leakage; no `.env*` files; no `database_id` in `wrangler.jsonc`; `package.json`/`package-lock.json` diff empty |

Every command above is `--local`, non-mutating (`--dry-run`), or a pure read-only local introspection call; none used `--remote`. `wrangler.jsonc` was not modified — no `database_id`, `remote: false` unchanged.

## Known limitations

- The authenticated-success dashboard read path is proven by the deterministic Node test suite (local D1 via `getPlatformProxy({ remoteBindings: false })` and a locally-generated test JWKS/key pair), not by an authenticated `wrangler dev` HTTP round trip — no real Cloudflare Access application exists to drive one, exactly the same limitation `WEB-INC-001`'s evidence already carried.
- The dashboard client component has not been visually verified in a browser (no browser available in this environment); its correctness is verified at the HTTP/JSON contract level via the test suite, not via UI screenshot.
- `worker/auth.mjs`'s new `dispatch` parameter is additive and optional; no test exercises a third-party caller supplying a malformed `dispatch` function, since `worker/index.mjs` is the only production caller and always supplies a well-formed one.
- This evidence remains `ACTOR_REPORTED` until independently reviewed.

## Explicit confirmations

- **No remote Cloudflare resource was created or modified.** No `wrangler d1 create`; every D1 command is `--local` or non-mutating; `wrangler.jsonc` unchanged (`remote: false`, no `database_id`); no production Cloudflare Access configuration touched.
- **No deployment occurred.**
- **No public D1 cutover occurred.** `app/page.js`, `lib/content/local.mjs`, `lib/content/public.mjs`, `lib/content/schema.mjs`, `data/site.js` are byte-identical to the base commit; `npm run build` output unchanged.
- **No D1/schema change occurred.** `migrations/0001_web_inc_005_init.sql` is byte-identical to the base commit; the table inventory is unchanged (verified via `wrangler d1 execute`).
- **No later `WEB-INC-*` work began.** No CRUD, publish/unpublish, audit substrate, media/R2, journal, or theme/design mutation code exists anywhere in this diff.
- **`REMOTE_D1_AUTHORIZED`, `MUTATION_AUTHORIZED`, `DEPLOY_AUTHORIZED`, `MAIN_MERGE_AUTHORIZED` remain `NO`** — unchanged by this cycle.

## Commit

Files above are committed to `governance/maisoglabs-v0.1` (and mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`) on top of base `ac3c883aba55e69d85b3ec38171462cae350d68a`. Exact resulting commit SHA recorded in `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA` (a commit cannot self-reference its own hash within the same commit, so this file states the base SHA here and `STATE.md` carries the resulting SHA, corrected into both files by an immediately following documentation-only bookkeeping commit, consistent with the pattern established across the `WEB-INC-005` cycles).
