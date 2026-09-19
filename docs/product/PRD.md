# MaisogLabs Product Requirements Document (PRD)

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK`

Authority chain: `D-020` (Product Build Pack direction) → `D-021` (documentation implementation authorization) → `ML-DEVOS-AS-010` (binding acceptance constraints, findings `AS10-F001`–`AS10-F013`).

This document owns **WHAT and WHY** only. It does not own HOW (`TECHNICAL_DESIGN.md`), experience detail (`UI_UX_SPEC.md`), state transitions (`APP_FLOW.md`), data contracts (`DATA_BACKEND_SPEC.md`), or implementation sequencing (`BUILD_PLAN.md`). Each of those documents is referenced, not duplicated, here.

## Source-of-truth precedence (binding, `AS10-F005`)

1. Frozen Sentinel Architecture (`devos/architecture/ML-DEVOS-ARCH-001.md`) + active Governance Kernel (`devos/governance/*`) + Decisions/ADRs (`brain/DECISION_LOG.md`, `devos/changes/adrs/`) + durable Architect Syncs (`devos/changes/architect-syncs/`) + current `coordination/STATE.md`.
2. Approved MaisogLabs website/product governance (`docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`, `brain/PROJECT_GOVERNANCE.md`, `brain/GOVERNANCE_MAP.md`) + actual repository implementation evidence.
3. Existing Brand V3 / design / content-schema artifacts within their own domains (`brand/V3/*`, `lib/content/schema.mjs`).
4. Product Build Pack documents (this set of six files).
5. Derived future implementation increments/tasks (`BUILD_PLAN.md` items).
6. Conversation or agent narrative.

A lower item may clarify a higher item. It may never silently override it. This PRD does not redefine Sentinel governance, evidence classes, actors, or authority (`AS10-F004`).

## Brownfield notice

MaisogLabs is an existing, shipped codebase, not a greenfield product being specified for the first time. Every material claim below is classified as one of: **CURRENTLY IMPLEMENTED** (repository-evidenced), **CURRENTLY PLANNED**, **PROPOSED TARGET**, **NOT IMPLEMENTED**, or **FUTURE OPTION**. This PRD does not retroactively redefine existing behavior (`AS10-F003`).

## Product goals

- **G1 — Public presence (CURRENTLY IMPLEMENTED).** Present MaisogLabs' identity, foundations, projects, process, and contact path as a fast, static, branded public site. Evidence: `app/page.js`, `app/globals.css`, `data/site.js` → `lib/content/*` → `app/page.js` boundary (`brain/PROJECT_GOVERNANCE.md` § "Current storage model").
- **G2 — Structured, validated content (CURRENTLY IMPLEMENTED).** Content is a versioned, schema-validated document rather than free-form markup. Evidence: `lib/content/schema.mjs`, `tests/content.test.mjs` (27 tests).
- **G3 — Admin-managed content without source edits (NOT IMPLEMENTED / PROPOSED TARGET).** Let an authorized admin change site content without a code change and rebuild/redeploy cycle. This is `WEB-REQ-004`, currently `NOT STARTED` per `brain/GOVERNANCE_MAP.md`.
- **G4 — Journal/case-study publishing (AUTHORIZED FOR WEB-INC-006, NOT YET IMPLEMENTED).** `WEB-REQ-009` now owns the published-only public-read contract. Repository implementation remains pending until WEB-INC-006 completes Builder handoff and Architect review.
- **G5 — Safe, auditable admin surface (PROPOSED TARGET).** If/when an admin surface is built, it must satisfy the existing `ADM-REQ-*` and `WEB-SEC-*` catalog (see below) — not a new, competing requirement set.

## Non-goals (this document and this cycle)

- This PRD does not authorize building `/admin`, authentication, D1, R2, or any backend API. That remains gated by future explicit Paulo decisions (see `brain/DECISION_LOG.md` D-020/D-021 boundary clauses).
- This PRD does not redesign the current public site or its visual direction (Brand V3 remains authoritative, see `UI_UX_SPEC.md`).
- This PRD is not a Sentinel architecture change, version bump, or project-onboarding record (`AS10-F002`): it is `LOCAL_RULE` project documentation for the legacy MaisogLabs website project.

## Personas

| Persona | Description | Current support | Target support |
|---|---|---|---|
| Public visitor | Anyone browsing the public site | Full — static homepage, project rail, process, about, contact (`app/page.js`) | Unchanged; may gain a journal/case-study reading path (`FUTURE OPTION`) |
| Admin (Paulo, or a future authorized operator) | Edits site content and settings | **NOT IMPLEMENTED** — content changes require a direct `data/site.js` edit + rebuild + redeploy by whoever has repository/deploy access | `PROPOSED TARGET`: authenticated admin surface per `ADM-REQ-*`, gated by `WEB-SEC-*` |

## Requirements catalog (referenced, not duplicated)

The authoritative requirement catalog already exists in `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §§9–11, 13–14, with live status tracked in `brain/GOVERNANCE_MAP.md`, `brain/RISK_REGISTER.md`, and `brain/TEST_LEDGER.md`. This PRD reuses those IDs rather than restating their prose (`AS10-F010`):

- `WEB-REQ-001`…`008` — public website requirements. Current status: see `brain/GOVERNANCE_MAP.md` (`WEB-REQ-001`, `003`, `005`–`008` = `IMPLEMENTED`; `WEB-REQ-002` = process practice, not an enforced control; `WEB-REQ-004` = `NOT STARTED`).
- `WEB-REQ-009` — **Public journal browsing.** Public journal reads expose only entries whose `published_revision_id` resolves to a valid published revision; index results are ordered newest-published first; detail lookup uses the immutable journal slug; draft-only/unpublished entries and non-published revisions must never be returned. Owner: this PRD. Status: `NOT STARTED` until WEB-INC-006 is independently accepted.
- `ADM-REQ-001`…`016` — future admin portal requirements. Current status: `ADM-REQ-001` (`/admin` requires authentication) = `IMPLEMENTED` per the accepted `WEB-INC-001`; `ADM-REQ-002`…`016` (session/editorial/mutation/media/theme/audit capability) remain `NOT STARTED` — see `brain/GOVERNANCE_MAP.md`.
- `DESIGN-001`…`014` — future admin-exposed design controls. Current status: `NOT STARTED` — an auth-only admin surface existing (`WEB-INC-001`) is not the same as a design-control/editing capability existing (`ML-DEVOS-AS-013`).
- `WEB-SEC-001`…`012` — auth/security boundary requirements for the future admin surface. Current status: `WEB-SEC-001`, `002`, `011` (authenticated access, server-side authorization check, fail-closed) = `IMPLEMENTED` per `WEB-INC-001`; `WEB-SEC-003`…`010`, `012` remain `NOT STARTED` — explicitly not "not applicable"; these become live requirements the moment the corresponding admin/mutation surface is authorized.
- `RISK-WEB-001`…`015` — see `brain/RISK_REGISTER.md` for current status per risk (mix of `OPEN`, `MITIGATED`, `NOT YET APPLICABLE`, `NOT STARTED`).

If a genuinely new requirement is needed that no existing ID covers, it must be assigned a stable ID, given an owning document, and justified. No new requirement ID is introduced by this cycle — the existing catalog above already covers the Product Build Pack's scope.

## Success / acceptance outcomes

Traceability model (reused from `brain/GOVERNANCE_MAP.md`, unchanged): `Requirement → Design → Implementation → Test → Evidence → Status`, using the shared status vocabulary `NOT STARTED / IN PROGRESS / IMPLEMENTED / VERIFIED / BLOCKED / DEFERRED`.

- The public site continues to satisfy `WEB-REQ-001`, `003`, `005`–`008` at their current evidenced status; no Product Build Pack document may claim a higher status than `brain/GOVERNANCE_MAP.md` currently records without new evidence.
- Any future admin increment is accepted only when its specific `ADM-REQ-*`/`WEB-SEC-*`/`DESIGN-*` IDs move from `NOT STARTED` to `IMPLEMENTED` with cited test/evidence, and to `VERIFIED` only after independent Architect reproduction/inspection — never implementer self-certified (`brain/PROJECT_GOVERNANCE.md` "No implementer self-certification").
- A future increment is "done" only when `BUILD_PLAN.md`'s per-increment acceptance checklist for that increment is satisfied and independently reviewed — this PRD does not itself close any increment.

## Current vs. target state (summary)

| Area | Current | Target |
|---|---|---|
| Public site | `CURRENTLY IMPLEMENTED` — static Next.js export via Cloudflare Worker assets | Unchanged in this cycle |
| Content authoring | `CURRENTLY IMPLEMENTED` as a Git-edited, schema-validated document (`data/site.js`) | `PROPOSED TARGET` — admin-managed authoring without source edits |
| Admin read-only status dashboard (`/admin`) | `CURRENTLY IMPLEMENTED` (`WEB-INC-001` auth boundary + `WEB-INC-002` read-only dashboard, `ML-DEVOS-RFC-004`/`ML-DEVOS-AS-015`/`D-025`) — a route exists, gated by server-side auth, rendering a bounded lifecycle/status view fetched from `GET /admin/api/dashboard`; no editing capability | Admin content-editing/design-control/mutation surface remains `PROPOSED TARGET` — see `TECHNICAL_DESIGN.md`, `APP_FLOW.md`, `DATA_BACKEND_SPEC.md` |
| Authentication | `CURRENTLY IMPLEMENTED` at repository level (`WEB-INC-001`: `worker/index.mjs`/`worker/auth.mjs`, fail-closed Cloudflare Access JWT verification for `/admin`/`/admin/*`) — not production-verified, no production Cloudflare Access application exists | Unchanged in this cycle; production verification remains `PROPOSED TARGET` |
| Database (D1) — current-content revision substrate | `IMPLEMENTED` (local-only; `WEB-INC-005`, `ML-DEVOS-RFC-003`/`ML-DEVOS-AS-013`/`D-024`) — not yet public source of truth, not Architect-verified | Remote/production D1 and any public read/write path remain `PROPOSED TARGET`, contingent on their own separate future authorization |
| Media (R2) | `NOT IMPLEMENTED` | `PROPOSED TARGET`, contingent on a separate future authorization (`AS10-F012`) |
| Journal | `NOT IMPLEMENTED` | `FUTURE OPTION` |

## Role model for future governed work (`AS10-F006`)

Future governed work on this product uses Sentinel's current five-actor model — **Paulo, Architect, Builder, QA, Independent Reviewer** (`devos/governance/ROLE_RESPONSIBILITY_MATRIX.md`) — not the combined "Architect / Independent Reviewer" three-role model recorded in `brain/PROJECT_GOVERNANCE.md`. The three-role model remains valid as historical/current-pilot context for the already-closed website-governance cycles; it is not carried forward as the target model, and `brain/PROJECT_GOVERNANCE.md` is not rewritten by this cycle.

## Context-efficiency note (`AS10-F011`)

This PRD intentionally does not reproduce the full requirement catalog, the full risk register, or Sentinel governance text. See `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`, `brain/GOVERNANCE_MAP.md`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, and `brain/DECISION_LOG.md` for the durable record.
