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
| Admin portal (`/admin`) | `IMPLEMENTED` (read-only status dashboard) — content-editing/mutation dashboard `NOT STARTED` | `WEB-INC-001` (`ML-DEVOS-RFC-002`/`ML-DEVOS-AS-011`/`D-023`) established the auth-only placeholder; `WEB-INC-002` (`ML-DEVOS-RFC-004`/`ML-DEVOS-AS-015`/`D-025`) upgraded it into a read-only status dashboard (`app/admin/page.js`, `app/admin/DashboardClient.js`) fetching the one authorized endpoint `GET /admin/api/dashboard` (`worker/admin/dashboard.mjs`). No content-editing UI, no CRUD, no publish/unpublish controls exist. `AUTH-ONLY/READ-ONLY ADMIN SURFACE EXISTS ≠ ADMIN DESIGN-CONTROL/EDITING/MUTATION CAPABILITY EXISTS` (`ML-DEVOS-AS-013`, `ML-DEVOS-AS-015`). |
| Admin dashboard read endpoint (`GET /admin/api/dashboard`) | `IMPLEMENTED` (local-only, read-only) | `WEB-INC-002` (`ML-DEVOS-RFC-004`/`ML-DEVOS-AS-015`/`D-025`): `worker/admin/dashboard.mjs` reads the `WEB-INC-005` local D1 substrate via `worker/d1/repository.mjs` only after WEB-INC-001 authentication succeeds; returns an explicit allowlisted projection; non-GET methods and unknown `/admin/api/*` paths are rejected before any D1 call; `Cache-Control: no-store` on every protected response. `tests/worker-admin-dashboard.test.mjs` (20/20 passing, implementer-reported). `MUTATION_AUTHORIZED: NO` — no write path exists. |
| Authentication | `IMPLEMENTED` (repository level; not production-verified) | `WEB-INC-001`: `worker/index.mjs`/`worker/auth.mjs` fail-closed-verify a Cloudflare Access JWT assertion (via `jose`) for `/admin`/`/admin/*` only; `tests/worker-auth.test.mjs` (30/30 passing, implementer-reported). No production Cloudflare Access application exists yet, so this is not production/runtime-verified. No session/cookie mechanism and no editorial/mutation capability exist. |
| Persistent storage — D1 current-content revision substrate | `IMPLEMENTED` (local-only) | `WEB-INC-005` (`ML-DEVOS-RFC-003`/`ML-DEVOS-AS-013`/`D-024`), remediated per `ML-DEVOS-AS-014` Remediation Cycle 1: `migrations/0001_web_inc_005_init.sql` (exactly 14 tables), `worker/d1/{schema,validate,migrate,repository}.mjs`, `scripts/d1-migrate.mjs`; `tests/d1-migration.test.mjs` (19/19 passing, implementer-reported), covering whole-run atomicity, exact pointer/provenance no-op equivalence, and legacy-content-contract-aligned validation boundaries. Local Wrangler/D1 simulation only — no remote/production D1 resource exists; not the public source of truth (`app/page.js`/`lib/content/local.mjs` unchanged, still read `data/site.js`). |
| Persistent storage — media (R2) | `NOT STARTED` | No object-storage integration exists. |
| Media management/upload | `NOT STARTED` | Static assets only, hand-placed under `public/`; no upload path exists. |
| Audit logging | `NOT STARTED` | No mutation surface exists yet, so no audit trail exists or is meaningful yet. |
| Deployment-wording contradiction (Architect finding F-003) | `IMPLEMENTED` | `AGENTS.md` and `README.md` updated this cycle to describe the Cloudflare Worker/Wrangler asset deployment instead of "Cloudflare Pages," matching `docs/ARCHITECTURE.md` and `wrangler.jsonc`. No infrastructure changed. |
| Legacy branch inventory (Architect finding F-004) | `IMPLEMENTED` | Recorded in `PROJECT_GOVERNANCE.md` § "Legacy / non-governance branch inventory," classified `UNINSPECTED LEGACY/EXPERIMENTAL`. No branch content was reviewed or merged. |

## Explicit non-claims

This document does not claim, and neither the Phase 1 cycle, `WEB-INC-005`, nor `WEB-INC-002` performed:

- Any change to public-facing functionality or visual design.
- Any admin content-editing/mutation dashboard, or any upload implementation. (Authentication, an auth-only `/admin` placeholder, and a bounded read-only status dashboard already exist from the accepted `WEB-INC-001`/`WEB-INC-002` — see the table above; this document does not claim more than that boundary provides — no create/edit/save/delete/publish/unpublish capability exists anywhere.)
- Any remote/production D1 resource creation, migration, query, or mutation, or any deployment or production verification.
- Any change to `app/page.js`, `lib/content/local.mjs`, or the public read path — it still reads only `data/site.js`; `data/site.js` was not deleted or retired.
- Any merge to `main`.
- Independent (Architect-reproduced) verification of the test/build evidence cited above — those remain implementer-reported until the Architect inspects them (see `TEST_LEDGER.md`).
