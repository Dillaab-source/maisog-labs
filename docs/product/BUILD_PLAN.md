# MaisogLabs Build Plan

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK`

**This document does not authorize implementation of anything it lists.** Every increment below still requires its own explicit Paulo authorization and, after Builder implementation, independent Architect review, before it may be built (`brain/DECISION_LOG.md` D-021 "Build-plan rule": `BUILD_PLAN.md` must decompose future work into dependency-ordered, bounded increments and must not itself authorize those increments).

## Roadmap-taxonomy collision rule (`AS10-F007`, `AS10-F008`)

Two unrelated numbered roadmaps exist in this repository and must never be merged or treated as the same lifecycle:

- The legacy Website Governance/Admin Plan has `PHASE 0 … PHASE 14` (`docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`).
- Sentinel has `S0 … S14` (`devos/plans/ML-DEVOS-SIP-001.md`).

Website implementation increments in this document therefore use a third, separate namespace: **`WEB-INC-001`, `WEB-INC-002`, …** — never `S3`/`S4`/etc., and never a bare `PHASE N` without the `WEB-INC-` prefix once an increment reaches this document.

`ML-DEVOS-SIP-001.md` is a frozen S0 roadmap baseline; its original phase-status table is historical architecture intent, not live execution-state authority. Live Sentinel state comes from `coordination/STATE.md`, Decisions/ADRs, and current durable Architect Syncs — never from that frozen table's old `NOT STARTED` rows (`AS10-F008`).

## Required future workflow (`AS10-F009`)

Every future website increment must move through this sequence. These are process stages; they grant no authority by themselves.

```
GROUND / INVENTORY REPOSITORY REALITY
        ↓
SPECIFY PRODUCT INTENT / REQUIREMENTS
        ↓
CLARIFY AMBIGUITIES
        ↓
ARCHITECT / CONSTITUTION CONSISTENCY CHECK
        ↓
PLAN TECHNICAL + UI/UX + FLOW + DATA DESIGN
        ↓
REQUIREMENTS QUALITY / ACCEPTANCE CHECKLIST
        ↓
DEPENDENCY-ORDERED BOUNDED TASKS
        ↓
CROSS-ARTIFACT ANALYZE
        ↓
CLAUDE BUILDS ONE AUTHORIZED INCREMENT
        ↓
TESTS / EVIDENCE
        ↓
ARCHITECT INDEPENDENT REVIEW
        ↓
CONVERGENCE CHECK AGAINST SPEC + PLAN + TASKS
        ↓
NEXT INCREMENT OR PAULO GATE
```

This document is the output of the first six stages for the increments below, at planning granularity. "CLAUDE BUILDS ONE AUTHORIZED INCREMENT" onward happens only after a separate Paulo authorization names a specific `WEB-INC-*` ID.

## Role model for this workflow (`AS10-F006`)

Future governed work uses Sentinel's five actors — **Paulo, Architect, Builder, QA, Independent Reviewer** — not the legacy combined "Architect / Independent Reviewer" website-pilot role. See `PRD.md` § "Role model for future governed work"; not restated here.

## Traceability

`Requirement ID → design section → increment → test/evidence → review status`, consistent with Sentinel's existing `Requirement → Design → Implementation → Test → Evidence → Status` model (`brain/GOVERNANCE_MAP.md`). Increments below cite existing IDs; no new requirement ID is minted in this document.

## Candidate increments (planning only — none authorized)

Ordered by dependency. An increment is listed here only if its prerequisites are also listed at or before it.

### `WEB-INC-001` — Admin authentication boundary
- **Requirements:** `ADM-REQ-001`, `WEB-SEC-001`, `002`, `011`.
- **Depends on:** nothing else in this list (first increment; establishes the boundary everything else needs).
- **Design refs:** `TECHNICAL_DESIGN.md` § "Proposed target architecture" (auth boundary); `APP_FLOW.md` §2a, §2i, §2j.
- **Bounded scope:** a server-side authentication check gating `/admin` and rejecting unauthenticated/unauthorized requests. No content mutation capability yet.
- **Acceptance checklist (draft, to be finalized at authorization time):** unauthenticated request to `/admin` is rejected (`TEST-ADM-001`); authorized request succeeds (`TEST-ADM-002`); failure fails closed with no partial page/data leak.

### `WEB-INC-002` — Read-only admin dashboard shell
- **Requirements:** `ADM-REQ-*` (dashboard framing only, no mutation `ADM-REQ-*` items yet).
- **Depends on:** `WEB-INC-001`.
- **Design refs:** `APP_FLOW.md` §2b.
- **Bounded scope:** authenticated view of existing projects/sections (read from the current `data/site.js`-backed content, no new storage yet). No create/edit/publish action.
- **Acceptance checklist (draft):** dashboard lists current published/draft/archived projects accurately against the existing content source; no mutation controls are exposed.

### `WEB-INC-003` — Projects create/edit/draft/publish/unpublish
- **Requirements:** `ADM-REQ-003`, `004`, `010`, `011`, `014`, `015`, `016`; `WEB-SEC-004`, `006`, `007`, `008`, `009`, `012`.
- **Depends on:** `WEB-INC-001`, `WEB-INC-002`, and a storage decision (see `WEB-INC-005`) — sequencing between this and `WEB-INC-005` is itself an open dependency question to resolve at the "CLARIFY AMBIGUITIES" stage before authorization, not decided here.
- **Design refs:** `APP_FLOW.md` §2c–§2h; `DATA_BACKEND_SPEC.md` § `projects`, § `audit_log`.
- **Bounded scope:** the full projects mutation lifecycle for one entity type only. Journal, media, and theme settings are explicitly out of scope for this increment.
- **Acceptance checklist (draft):** `TEST-ADM-003`, `004`, `006`, `007`, `010`.

### `WEB-INC-004` — Media upload + library
- **Requirements:** `ADM-REQ-006`; `WEB-SEC-005`.
- **Depends on:** `WEB-INC-001`; a storage decision (R2) per `TECHNICAL_DESIGN.md`.
- **Design refs:** `APP_FLOW.md` §2k; `DATA_BACKEND_SPEC.md` § `media`.
- **Bounded scope:** upload + validate + list/select media. Does not itself attach media to projects (that is `WEB-INC-003`/journal scope, whichever lands second).
- **Acceptance checklist (draft):** `TEST-ADM-008`.

### `WEB-INC-005` — D1-backed storage migration for `site_settings`/`navigation`/`sections`/`projects`
- **Requirements:** `RISK-WEB-015` mitigation; supports `WEB-REQ-004`.
- **Depends on:** a separate `ARCHITECTURE`-class decision to actually replace the `data/site.js` boundary (per `brain/DECISION_LOG.md` D-007 — this increment cannot proceed on `D-021`'s documentation authorization alone).
- **Design refs:** `TECHNICAL_DESIGN.md` § "Proposed target architecture"; `DATA_BACKEND_SPEC.md` §§ "Migration considerations", "Rollback / data-loss considerations".
- **Bounded scope:** migrate the existing published content 1:1 into D1-backed tables without changing rendered output; `data/site.js` may be retired only after parity is independently verified.
- **Acceptance checklist (draft):** `TEST-DATA-001`, `002`.

### `WEB-INC-006` — Journal (entity, schema, admin lifecycle, public read path)
- **Requirements:** `ADM-REQ-005`; new public read requirement (no existing `WEB-REQ-*` covers journal reading — a future increment proposal must mint a stable ID for it, e.g. under `WEB-REQ-*`, and identify `PRD.md` as the owning document, at the point this increment is actually specified in detail, not before).
- **Depends on:** `WEB-INC-003` (reuses its lifecycle pattern), `WEB-INC-005` (needs `journal_entries` storage).
- **Design refs:** `APP_FLOW.md` §1c; `DATA_BACKEND_SPEC.md` § `journal_entries`.
- **Bounded scope:** full journal lifecycle, mirroring projects.

### `WEB-INC-007` — Theme/design settings
- **Requirements:** `DESIGN-001`…`014`.
- **Depends on:** `WEB-INC-001`, `WEB-INC-005` (needs `theme_settings` storage).
- **Design refs:** `APP_FLOW.md` §2l; `DATA_BACKEND_SPEC.md` § `theme_settings`; `UI_UX_SPEC.md` § "Design controls".
- **Bounded scope:** validated, range-constrained theme controls only — never free-form CSS/JS input (`DESIGN-014`).

### `WEB-INC-008` — Audit log
- **Requirements:** `ADM-REQ-012`; `WEB-SEC-009`.
- **Depends on:** at least one mutation increment (`WEB-INC-003` at minimum) to have something to audit.
- **Design refs:** `DATA_BACKEND_SPEC.md` § `audit_log`.
- **Bounded scope:** append-only audit records for admin mutations introduced by prior increments. Could be pulled earlier (e.g. built alongside `WEB-INC-003`) if the "CLARIFY AMBIGUITIES" stage at authorization time decides auditability shouldn't lag mutation capability — that sequencing choice is intentionally left open here, not fixed.

## What this plan does not do

- It does not authorize `WEB-INC-001` or any later increment for implementation.
- It does not provision D1, R2, or any Cloudflare resource.
- It does not create any API, route, or auth code.
- It does not perform project onboarding, populate `projects/registry.json`, or create a `.devos/` overlay.
- It does not propose or implement Sentinel `S3`.
- It does not authorize deployment or a `main` merge. `DEPLOY_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` remain `NO`.

## Context-efficiency note

Per-increment acceptance checklists above are drafts to be finalized at the "REQUIREMENTS QUALITY / ACCEPTANCE CHECKLIST" stage immediately before that increment's own authorization — this plan does not attempt to fully specify eight increments' worth of test criteria in advance, which would itself violate `AS10-F011`'s context-efficiency guidance.
