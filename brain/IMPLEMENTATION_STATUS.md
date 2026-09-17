# Implementation Status

Status vocabulary: `NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`.

Code existence alone does not justify `VERIFIED`; see `GOVERNANCE_MAP.md`.

| Area | Status | Evidence |
|---|---|---|
| Governance bootstrap (this document set) | `IMPLEMENTED` | This commit: `brain/*`, `AGENTS.md`/`README.md` deployment-wording fix. Not yet Architect-reviewed at time of writing. |
| Public homepage rendering | `IMPLEMENTED` | `app/page.js`, `app/layout.js`; builds successfully (`npm run build`, Phase 0 + Phase 1 re-run — see `TEST_LEDGER.md`). |
| Content contract / schema validation | `IMPLEMENTED` | `lib/content/schema.mjs`, `lib/content/public.mjs`, `lib/content/local.mjs`; `tests/content.test.mjs` (27/27 passing, implementer-reported). |
| Projects feature | `IMPLEMENTED` (presentation only) | `components/ProjectRail.js`, `data/site.js` project records. No create/edit/publish/delete exists — content changes require a direct source edit and redeploy. |
| Journal feature | `NOT STARTED` | No schema field, data, route, or component exists (confirmed by repository-wide search in Phase 0). |
| Admin portal (`/admin`) | `NOT STARTED` | No route under `app/`; confirmed `ADMIN STATUS: NOT IMPLEMENTED`. |
| Authentication | `NOT STARTED` | No auth library, session/cookie/JWT code, or identity-provider integration; no `process.env` usage in source; no `.env` files present. |
| Persistent storage (D1/R2) | `NOT STARTED` | No database or object-storage integration exists. Current storage is the local, Git-backed `data/site.js` module (see `PROJECT_GOVERNANCE.md`). |
| Media management/upload | `NOT STARTED` | Static assets only, hand-placed under `public/`; no upload path exists. |
| Audit logging | `NOT STARTED` | No mutation surface exists yet, so no audit trail exists or is meaningful yet. |
| Deployment-wording contradiction (Architect finding F-003) | `IMPLEMENTED` | `AGENTS.md` and `README.md` updated this cycle to describe the Cloudflare Worker/Wrangler asset deployment instead of "Cloudflare Pages," matching `docs/ARCHITECTURE.md` and `wrangler.jsonc`. No infrastructure changed. |
| Legacy branch inventory (Architect finding F-004) | `IMPLEMENTED` | Recorded in `PROJECT_GOVERNANCE.md` § "Legacy / non-governance branch inventory," classified `UNINSPECTED LEGACY/EXPERIMENTAL`. No branch content was reviewed or merged. |

## Explicit non-claims

This document does not claim, and this Phase 1 cycle did not perform:

- Any change to public-facing functionality or visual design.
- Any admin, authentication, database, or upload implementation.
- Any deployment or production verification.
- Any merge to `main`.
- Independent (Architect-reproduced) verification of the test/build evidence cited above — those remain implementer-reported until the Architect inspects them (see `TEST_LEDGER.md`).
