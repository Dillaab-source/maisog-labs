# MaisogLabs Technical Design

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK` — **`WEB-INC-001` Remediation Cycle 1** (resolves `AS12-F002`: converges current-state wording — dependency list, deployment contract, runtime flow, "None of the following exists" — with the actual `jose`/Worker/auth implementation)

Owns **HOW**. Requirements/rationale live in `PRD.md`; UI/UX detail lives in `UI_UX_SPEC.md`; state transitions live in `APP_FLOW.md`; data contracts live in `DATA_BACKEND_SPEC.md`. Source-of-truth precedence and brownfield classification follow `PRD.md` exactly (`AS10-F003`, `AS10-F005`).

## Current technical architecture — `CURRENTLY IMPLEMENTED`

Runtime flow (`docs/ARCHITECTURE.md`): ordinary public routes remain visitor → Cloudflare Worker static assets (asset-first) → statically generated Next.js site, unchanged by `WEB-INC-001`. `/admin` and `/admin/*` only: visitor → Worker (`worker/index.mjs`) → fail-closed Cloudflare Access verification (`worker/auth.mjs`) → the same Assets binding. **There is now one server-executed request path** (the `/admin`/`/admin/*` auth boundary) — this is narrower than, and must not be conflated with, the separate and still-true statement that **there is no database and no persistent application state**: no D1/R2, no session storage, no editorial read, no mutation, and no content served through any code path other than the two above.

```
data/site.js  →  lib/content/local.mjs  →  lib/content/schema.mjs  →  lib/content/public.mjs  →  app/page.js
   (source)      (build/server-only          (validation,             (published-only            (consumer;
                  async reader — a             unknown-field            projection, drops           renders only
                  seam for a future            rejection, link/         internal `state`            the projection)
                  D1 implementation,           HTML-injection           field)
                  not a live connection)       guards)
```

This is the governed content boundary (`brain/PROJECT_GOVERNANCE.md` § "Current storage model", `brain/DECISION_LOG.md` D-007). This design does not replace it; a future admin/CMS increment must either preserve it or replace it through an explicit `ARCHITECTURE`-class decision (per `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`), never silently.

**System boundaries (existing, `docs/ARCHITECTURE.md`):**
- `app/` — routing and page composition (currently one route: `/`, plus Next's generated `/_not-found`).
- `components/` — reusable presentation units (`Logo.js`, `ProjectRail.js` — the only client component — `BlueprintIcon.js`).
- `data/` — structured editable content (`site.js`).
- `lib/content/` — validation/projection layer (`schema.mjs`, `public.mjs`, `local.mjs`).
- `public/` — static assets.
- `docs/` — human/AI-maintainer documentation.

**Dependencies (`package.json`):** `next@16.3.5`, `react`/`react-dom@19.2.4`; `wrangler@^4.35.0` (dev); `jose@^6.2.12` — the maintained JWT verification library `WEB-INC-001` added, used only by `worker/auth.mjs`/`worker/index.mjs` for Cloudflare Access assertion verification. No ORM/DB client and no upload/storage SDK is present anywhere in the dependency tree.

**Deployment contract (`CURRENTLY IMPLEMENTED`):** `next build` with static export → `out/` → served by Wrangler via a Worker script (`worker/index.mjs`, `wrangler.jsonc`'s `main`) plus a static Assets binding (`assets.directory: "./out"`, `not_found_handling: "404-page"`, `html_handling: "auto-trailing-slash"`; `package.json`: `"deploy": "wrangler deploy"`). This is no longer "asset-only mode" — Worker-first routing is selectively enabled for `/admin`/`/admin/*` only (`assets.run_worker_first`); every other route is still served asset-first, exactly as the prior asset-only contract was. `brain/DECISION_LOG.md` D-006 remains the canonical record of the pre-`WEB-INC-001` asset-only baseline this extends, not replaces, for non-admin routes.

## Public/admin boundary — current

`ADMIN STATUS: AUTHENTICATION BOUNDARY ONLY IMPLEMENTED (WEB-INC-001)`. As of `WEB-INC-001` (`ML-DEVOS-RFC-002`, `ML-DEVOS-AS-011`, `D-023`), `/admin` and `/admin/*` are routed to a Worker (`worker/index.mjs`, `worker/auth.mjs`) that fail-closed-verifies a Cloudflare Access JWT assertion before serving the static admin placeholder (`app/admin/page.js`) through the same Assets binding — see `docs/ARCHITECTURE.md` § "Runtime flow". This is authentication only: there is still no session/cookie mechanism, no editorial/private data read, no mutation, and no database access anywhere in `app/`, `components/`, `data/`, `lib/`, or `worker/`. `brain/PROJECT_GOVERNANCE.md` § "Current admin/auth status" is updated to match; every byte outside `/admin`/`/admin/*` remains public and unauthenticated, exactly as before this increment.

**Production caveat:** the `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` values in `wrangler.jsonc` are placeholders; no production Cloudflare Access application exists yet (`ML-DEVOS-AS-011` `AS11-F003`). The auth boundary is repository-implemented and locally/deterministically tested (`tests/worker-auth.test.mjs`), not production-verified — see `coordination/IMPLEMENTER_HANDOFF.md` for the exact evidence class of every claim.

## Proposed target architecture — `PROPOSED TARGET / NOT IMPLEMENTED`

The existing website governance plan already records a Worker/D1/R2/auth direction as the preferred future shape if compatible with Sentinel (`docs/ARCHITECTURE.md` § "Planned evolution"; `AS10-F012`). This document restates that direction at design level only. **Authentication is the one item below already implemented, as of `WEB-INC-001` — see its entry for exact scope; every other item remains fully unimplemented.** Creating or updating this document does not provision D1/R2, create APIs, activate an admin portal, or migrate current static content (`AS10-F012`).

- **Cloudflare Worker API routes** — server-side endpoints for admin mutations, sitting alongside (not replacing) the existing static-asset Worker.
- ~~**Authentication boundary**~~ — **`CURRENTLY IMPLEMENTED` as of `WEB-INC-001`**, not proposed target any longer; see § "Public/admin boundary — current" above. Still fully `PROPOSED TARGET / NOT IMPLEMENTED`: session/cookie state beyond the per-request Access assertion check, and gating any future mutation endpoint (no mutation endpoint exists yet to gate).
- **D1** — structured storage for `site_settings`, `navigation`, `sections`, `foundations`, `projects`, `services`, `process_steps`, `journal_entries`, `theme_settings`, `audit_log`, plus each one's companion `_revisions` table and the revision-scoped junction tables (`project_media`, `journal_media`) described below (contracts owned by `DATA_BACKEND_SPEC.md`, not this file). Every base entity carries only identity and revision pointers; every public-affecting value (including ordering, section visibility, and media attachment order) lives in the revision/junction rows (`AS10-R008`).
- **R2** — media storage, introduced only after content/authorization boundaries are tested (`docs/ARCHITECTURE.md`).
- **Protected editorial read path** — a server-side data-access layer that can read `draft`/unpublished editorial state on behalf of an authenticated admin. This does **not** exist today and cannot be approximated by exposing anything from the current static `out/` assets or `data/site.js` at request time — `WEB-INC-001`'s server-executed path proves *identity*, not *data access*: `worker/index.mjs` performs no content read, no database query, and no editorial-state lookup of any kind. Any admin-facing read of non-public state still requires its own substrate to exist first (see `AS10-R006` disposition in `coordination/IMPLEMENTER_HANDOFF.md` and `APP_FLOW.md` §2b/§2e).
- **Public read path** — the public site would continue to read only a published-only projection, analogous to today's `projectPublishedContent()` (`lib/content/public.mjs`), but sourced from D1 instead of `data/site.js`, following each entity's `published_revision_id` pointer (see `DATA_BACKEND_SPEC.md` § "Publication / revision model").

A future implementation increment for any of the above requires its own bounded authorization and independent Architect review (`AS10-F012`) — this document grants none.

## Security constraints

Current (`CURRENTLY IMPLEMENTED`):
- No secrets in source: no `process.env` usage, no `.env` files in the repository, and `wrangler.jsonc`'s `vars` carry only inert placeholder strings, never a real Access team domain/audience (verified by search, `brain/RISK_REGISTER.md` `RISK-WEB-004`).
- `worker/auth.mjs` fail-closed-verifies the Cloudflare Access assertion **and** its own required configuration for `/admin`/`/admin/*`: a missing, blank, placeholder, or malformed team domain/audience is rejected before any JWKS/network lookup is attempted and before the admin asset can be served (`AS12-F001`) — a misconfigured deployment cannot accidentally authorize a request.
- `lib/content/schema.mjs` rejects unknown fields, control characters, and unsafe link targets (`href()` allowlists in-page anchors and validated `mailto:` only) — mitigates `RISK-WEB-011` for the current content-editing surface.
- Draft/archived records are filtered from the public projection at build time (`lib/content/public.mjs`) — but this is **not** confidentiality: the Git source, including drafts, remains public (`docs/CONTENT.md`, `RISK-WEB-013`).

Future (`PROPOSED TARGET`, tracked against the existing `WEB-SEC-001`…`012` catalog — not restated here, see `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §13 and `brain/GOVERNANCE_MAP.md`):
- Server-side authorization checks on every mutation (`WEB-SEC-002`, `007`, `008`).
- Server-side input validation reusing the existing schema-validation pattern (`WEB-SEC-004`, `006`).
- Media upload validation before any R2 write exists (`WEB-SEC-005`).
- Audit history for admin mutations (`WEB-SEC-009`).
- Fail-closed auth and non-misleading write failures (`WEB-SEC-011`, `012` — see `APP_FLOW.md` "write failure").

## Known gaps

- No automated production/runtime availability check exists (`WEB-REQ-001` is `IMPLEMENTED`, not `VERIFIED`).
- No automated mobile/visual regression test exists (`TEST-WEB-003: NOT IMPLEMENTED`).
- No automated backup/rollback mechanism beyond Git history (`RISK-WEB-003`).
- No dev/prod parity test (`RISK-WEB-009`).
- The async reader in `lib/content/local.mjs` is explicitly a seam for a future D1 implementation, not a live connection — it must not be mistaken for partial backend implementation.

## Context-efficiency note

Sentinel architecture, governance kernel, and change-policy text are not reproduced here. See `devos/architecture/ML-DEVOS-ARCH-001.md` and `devos/governance/*` for that record.
