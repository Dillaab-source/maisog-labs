# MaisogLabs Technical Design

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK`

Owns **HOW**. Requirements/rationale live in `PRD.md`; UI/UX detail lives in `UI_UX_SPEC.md`; state transitions live in `APP_FLOW.md`; data contracts live in `DATA_BACKEND_SPEC.md`. Source-of-truth precedence and brownfield classification follow `PRD.md` exactly (`AS10-F003`, `AS10-F005`).

## Current technical architecture — `CURRENTLY IMPLEMENTED`

Runtime flow (`docs/ARCHITECTURE.md`): visitor → Cloudflare Worker static assets → statically generated Next.js site. No database, no server-side application dependency.

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

**Dependencies (`package.json`):** `next@16.3.5`, `react`/`react-dom@19.2.4`; `wrangler@^4.35.0` (dev). No auth library, no ORM/DB client, no upload/storage SDK is present anywhere in the dependency tree.

**Deployment contract (`CURRENTLY IMPLEMENTED`):** `next build` with static export → `out/` → served by a Cloudflare Worker in asset-only mode via Wrangler (`wrangler.jsonc`: `assets.directory: "./out"`, `not_found_handling: "404-page"`; `package.json`: `"deploy": "wrangler deploy"`). This is the canonical deployment description (`brain/DECISION_LOG.md` D-006); this Product Build Pack changes no deployment configuration.

## Public/admin boundary — current

`ADMIN STATUS: NOT IMPLEMENTED`. No `/admin` route, authentication library, session/cookie/JWT logic, or identity-provider integration exists in `app/`, `components/`, `data/`, `lib/`, or `tests/` (`brain/PROJECT_GOVERNANCE.md` § "Current admin/auth status", re-verified at each governance cycle). Every byte the current build serves is public; there is no private/authenticated code path at all today.

## Proposed target architecture — `PROPOSED TARGET / NOT IMPLEMENTED`

The existing website governance plan already records a Worker/D1/R2/auth direction as the preferred future shape if compatible with Sentinel (`docs/ARCHITECTURE.md` § "Planned evolution"; `AS10-F012`). This document restates that direction at design level only. **None of the following exists.** Creating this document does not provision D1/R2, create APIs, implement authentication, activate an admin portal, or migrate current static content (`AS10-F012`).

- **Cloudflare Worker API routes** — server-side endpoints for admin mutations, sitting alongside (not replacing) the existing static-asset Worker.
- **Authentication boundary** — a server-side session/identity check gating `/admin` and all mutation endpoints. Must fail closed (`WEB-SEC-011`).
- **D1** — structured storage for `site_settings`, `navigation`, `sections`, `projects`, `journal_entries`, `theme_settings`, `audit_log` (contracts owned by `DATA_BACKEND_SPEC.md`, not this file).
- **R2** — media storage, introduced only after content/authorization boundaries are tested (`docs/ARCHITECTURE.md`).
- **Public read path** — the public site would continue to read only a published-only projection, analogous to today's `projectPublishedContent()` (`lib/content/public.mjs`), but sourced from D1 instead of `data/site.js`.

A future implementation increment for any of the above requires its own bounded authorization and independent Architect review (`AS10-F012`) — this document grants none.

## Security constraints

Current (`CURRENTLY IMPLEMENTED`):
- No secrets in source: no `process.env` usage, no `.env` files in the repository (verified by search, `brain/RISK_REGISTER.md` `RISK-WEB-004`).
- `lib/content/schema.mjs` rejects unknown fields, control characters, and unsafe link targets (`href()` allowlists in-page anchors and validated `mailto:` only) — mitigates `RISK-WEB-011` for the current content-editing surface.
- Draft/archived records are filtered from the public projection at build time (`lib/content/public.mjs`) — but this is **not** confidentiality: the Git source, including drafts, remains public (`docs/CONTENT.md`, `RISK-WEB-013`).

Future (`PROPOSED TARGET`, tracked against the existing `WEB-SEC-001`…`012` catalog — not restated here, see `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §11 and `brain/GOVERNANCE_MAP.md`):
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
