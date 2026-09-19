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
- **G4 — Journal/case-study publishing (IMPLEMENTED — LOCAL/REPOSITORY).** `WEB-REQ-009` is implemented by `WEB-INC-006` and accepted by `ML-DEVOS-AS-029` / `ML-DEVOS-ADR-008`: revisioned Journal content, authenticated lifecycle APIs, published-only public read APIs, and a static `/journal` shell. Production/remote verification is not claimed.
- **G5 — Safe, auditable admin surface (PROPOSED TARGET).** If/when an admin surface is built, it must satisfy the existing `ADM-REQ-*` and `WEB-SEC-*` catalog (see below) — not a new, competing requirement set.

## Non-goals (this document and this cycle)

- This PRD does not itself authorize additional implementation, deployment, remote resources, or production cutover. `/admin`, local D1, local R2, project/media/journal APIs, and the public Journal read path now exist only under their separately accepted WEB increments; future work still requires its own Paulo/governance gate.
- This PRD does not redesign the current public site or its visual direction (Brand V3 remains authoritative, see `UI_UX_SPEC.md`).
- This PRD is not a Sentinel architecture change, version bump, or project-onboarding record (`AS10-F002`): it is `LOCAL_RULE` project documentation for the legacy MaisogLabs website project.

## Personas

| Persona | Description | Current support | Target support |
|---|---|---|---|
| Public visitor | Anyone browsing the public site | Static homepage plus the repository/local Journal reading surface (`/journal` + published-only `/api/journal*`); production Journal verification is not yet claimed | Preserve published-only behavior; production cutover/verification remains separately gated |
| Admin (Paulo, or a future authorized operator) | Edits site content and settings | Authenticated `/admin` status dashboard plus bounded local project, media, and Journal API capabilities exist; there is still no complete admin editing UI and the homepage still reads `data/site.js` | Complete governed admin UX and remaining Theme/Design controls, each separately authorized |

## Requirements catalog (referenced, not duplicated)

The authoritative requirement catalog already exists in `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §§9–11, 13–14, with live status tracked in `brain/GOVERNANCE_MAP.md`, `brain/RISK_REGISTER.md`, and `brain/TEST_LEDGER.md`. This PRD reuses those IDs rather than restating their prose (`AS10-F010`):

- `WEB-REQ-001`…`008` — public website requirements. Current status: see `brain/GOVERNANCE_MAP.md` (`WEB-REQ-001`, `003`, `005`–`008` = `IMPLEMENTED`; `WEB-REQ-002` = process practice, not an enforced control; `WEB-REQ-004` = `NOT STARTED`).
- `WEB-REQ-009` — **Public journal browsing.** Public journal reads expose only entries whose `published_revision_id` resolves to a valid published revision; index results are ordered newest-published first; detail lookup uses the immutable journal slug; draft-only/unpublished entries and non-published revisions must never be returned. Owner: this PRD. Status: `IMPLEMENTED` at repository/local level by `WEB-INC-006`; accepted by `ML-DEVOS-AS-029`; no production/remote verification claimed.
- `ADM-REQ-001`…`016` — admin portal/capability requirements. Current status is mixed: authentication, read-only dashboard, project mutation, media, audit, and Journal capabilities have implemented subsets; Theme/Design controls and a complete editing UI remain open. `brain/GOVERNANCE_MAP.md` is authoritative for per-requirement status.
- `DESIGN-001`…`014` — future admin-exposed design controls. Current status: `NOT STARTED` — an auth-only admin surface existing (`WEB-INC-001`) is not the same as a design-control/editing capability existing (`ML-DEVOS-AS-013`).
- `WEB-SEC-001`…`012` — admin/API security requirements. Several controls are now implemented across the accepted auth, project, audit, media, and Journal increments; others remain open. `brain/GOVERNANCE_MAP.md` and the accepted Architect Syncs are authoritative rather than this summary.
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
| Admin surface (`/admin`) | `CURRENTLY IMPLEMENTED` as an authenticated read-only status UI plus bounded local APIs for project mutation, media, and Journal lifecycle; no complete editing UI exists | Remaining governed UI/editor workflows and Theme/Design controls |
| Authentication | `CURRENTLY IMPLEMENTED` at repository level (`WEB-INC-001`: `worker/index.mjs`/`worker/auth.mjs`, fail-closed Cloudflare Access JWT verification for `/admin`/`/admin/*`) — not production-verified, no production Cloudflare Access application exists | Unchanged in this cycle; production verification remains `PROPOSED TARGET` |
| Database (D1) | `IMPLEMENTED` locally through the 20-table WEB-INC-006 schema. Protected admin reads/writes exist for bounded domains, and Journal has a local published-only public D1 read path. Homepage/projects still use static `data/site.js` | Remote/production D1, broader public cutover, and production verification remain separately gated |
| Media (R2) | `IMPLEMENTED` as local-only R2 simulation under `WEB-INC-004` / `ML-DEVOS-ADR-007`; no public object-serving route | Remote/production R2 and any public object-serving design remain separately gated |
| Journal | `IMPLEMENTED` at repository/local level under `WEB-INC-006` / `ML-DEVOS-AS-029` / `ML-DEVOS-ADR-008`; published-only API + static `/journal` | Production/remote verification remains separately gated |

## Role model for future governed work (`AS10-F006`)

Future governed work on this product uses Sentinel's current five-actor model — **Paulo, Architect, Builder, QA, Independent Reviewer** (`devos/governance/ROLE_RESPONSIBILITY_MATRIX.md`) — not the combined "Architect / Independent Reviewer" three-role model recorded in `brain/PROJECT_GOVERNANCE.md`. The three-role model remains valid as historical/current-pilot context for the already-closed website-governance cycles; it is not carried forward as the target model, and `brain/PROJECT_GOVERNANCE.md` is not rewritten by this cycle.

## Context-efficiency note (`AS10-F011`)

This PRD intentionally does not reproduce the full requirement catalog, the full risk register, or Sentinel governance text. See `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`, `brain/GOVERNANCE_MAP.md`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, and `brain/DECISION_LOG.md` for the durable record.
