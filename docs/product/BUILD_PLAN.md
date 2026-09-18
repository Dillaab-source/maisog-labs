# MaisogLabs Build Plan

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK` — **Remediation Cycle 2** (resolves `AS10-R009` against `ML-DEVOS-AS-010`; preserves Cycle 1's `AS10-R001`, `AS10-R002` resolutions)

**This document does not authorize implementation of anything it lists.** Every increment below still requires its own explicit Paulo authorization and, after Builder implementation, independent Architect review, before it may be built (`brain/DECISION_LOG.md` D-021 "Build-plan rule": `BUILD_PLAN.md` must decompose future work into dependency-ordered, bounded increments and must not itself authorize those increments).

## Roadmap-taxonomy collision rule (`AS10-F007`, `AS10-F008`)

Two unrelated numbered roadmaps exist in this repository and must never be merged or treated as the same lifecycle:

- The legacy Website Governance/Admin Plan has `PHASE 0 … PHASE 14` (`docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`).
- Sentinel has `S0 … S14` (`devos/plans/ML-DEVOS-SIP-001.md`).

Website implementation increments in this document therefore use a third, separate namespace: **`WEB-INC-001`, `WEB-INC-002`, …** — never `S3`/`S4`/etc., and never a bare `PHASE N` without the `WEB-INC-` prefix once an increment reaches this document.

`ML-DEVOS-SIP-001.md` is a frozen S0 roadmap baseline; its original phase-status table is historical architecture intent, not live execution-state authority. Live Sentinel state comes from `coordination/STATE.md`, Decisions/ADRs, and current durable Architect Syncs — never from that frozen table's old `NOT STARTED` rows (`AS10-F008`).

## Governance routing — binding correction to `AS10-F009` (`AS10-R001`)

**Provenance note:** the Architect's review of Remediation Cycle 1 attributes this correction to a gap in the Architect's own prior constraint `AS10-F009`, not to Builder drift — the original Builder output reproduced `AS10-F009`'s workflow exactly as instructed. `AS10-F009` correctly sequenced planning/design/build stages but omitted the load-bearing governance step — Sentinel change classification and its resulting authorization route — that sits between "the plan exists" and "building may start." This section is the Architect-directed amendment that restores it; it does not accuse the prior cycle of drifting from a rule that had not yet been stated.

Before any future `WEB-INC-*` can become authorized implementation work, it must pass through Sentinel's active change-classification and routing lifecycle (`devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §§1, 4), not just the product-planning workflow:

```
IDEA / CHANGE NEED
        ↓
GROUND REPOSITORY REALITY
        ↓
SPECIFY / CLARIFY
        ↓
CLASSIFY CHANGE UNDER SENTINEL
        ↓
appropriate change record:
PATCH / LOCAL_RULE /
CORE_POLICY / CAPABILITY /
ARCHITECTURE / CONSTITUTIONAL /
WAIVER / PROJECT_ONBOARDING
        ↓
RFC / rule / proposal where required
        ↓
ARCHITECT SYNC where required
        ↓
PAULO GATE where required
        ↓
AUTHORIZED
        ↓
TASK / ACCEPTANCE CONTRACT
        ↓
BUILD
        ↓
TEST / EVIDENCE
        ↓
ARCHITECT REVIEW
        ↓
CONVERGENCE
        ↓
NEXT GATE
```

This does not discard `AS10-F009`'s finer-grained product-planning sequence — it nests inside the chain above: `AS10-F009`'s `GROUND → SPECIFY PRODUCT INTENT → CLARIFY AMBIGUITIES → ARCHITECT/CONSTITUTION CHECK → PLAN TECHNICAL+UI/UX+FLOW+DATA → REQUIREMENTS QUALITY/ACCEPTANCE CHECKLIST → DEPENDENCY-ORDERED BOUNDED TASKS → CROSS-ARTIFACT ANALYZE` is the detailed content of `GROUND REPOSITORY REALITY → SPECIFY / CLARIFY` (and feeds `TASK / ACCEPTANCE CONTRACT`) above; `AS10-F009`'s `CLAUDE BUILDS ONE AUTHORIZED INCREMENT → TESTS/EVIDENCE → ARCHITECT INDEPENDENT REVIEW → CONVERGENCE CHECK → NEXT INCREMENT OR PAULO GATE` is exactly `BUILD → TEST/EVIDENCE → ARCHITECT REVIEW → CONVERGENCE → NEXT GATE` above. What was missing, and is restored here, is the `CLASSIFY CHANGE UNDER SENTINEL → change record → RFC/Architect Sync/Paulo gate where required → AUTHORIZED` spine that must sit between planning and building.

**Per-class routing (per `CHANGE_GOVERNANCE_POLICY.md` §1's table — not restated in full, referenced here):**

- **`PATCH` / `LOCAL_RULE`** may follow their lighter policy path where the policy allows it: no Architect Sync required for `PATCH`; `LOCAL_RULE` needs no Architect Sync either unless it touches a core rule's applicability or narrows a Paulo-gated action.
- **`CORE_POLICY`** and every stronger class below it use their required governance path: Architect Sync required, Paulo gate required, RFC → Architect Sync → Decision → ADR as the change-record type.
- **`CAPABILITY`** changes follow the capability-change path (`CAPABILITY_CHANGE_SPEC.md`): Architect Sync required when it changes trust boundaries; Paulo approval required for sensitive operations; Capability ≠ Authority always applies (no capability grants itself universal authority).
- **`ARCHITECTURE`** requires the full RFC + Architect Sync + Paulo authorization path before implementation, exactly as S2's `ML-DEVOS-RFC-001` → `ML-DEVOS-AS-006` → `D-016` chain already demonstrates in this repository's own history.
- **`CONSTITUTIONAL`** requires full, explicit, and named Paulo authorization — no actor or mechanism may invent constitutional delegation, ever.
- **`PROJECT_ONBOARDING`** follows its own onboarding path (project owner proposal → Architect review of overlay compatibility → Paulo approval to onboard → project `.devos/` overlay) — not applicable to this Product Build Pack itself, which is `LOCAL_RULE` project documentation (`AS10-F002`), not an onboarding event.
- **`WAIVER`** is never implied. A waiver is an explicit, scoped, time-boxed record (`WAIVER_TEMPLATE.md`) — it is never assumed by silence, by an increment simply proceeding, or by a `WEB-INC-*` ID being named.

**Binding rule for every candidate increment below:** a `WEB-INC-*` ID is a planning identifier only. Paulo naming or approving a `WEB-INC-*` ID is **not by itself sufficient** authorization when that increment's active change class requires an RFC, an Architect Sync, or another stronger record per the table above. Each candidate increment below states its likely change class so this is concrete rather than abstract; the increment's own future `CLASSIFY CHANGE UNDER SENTINEL` step makes the binding determination, not this plan.

## Role model for this workflow (`AS10-F006`)

Future governed work uses Sentinel's five actors — **Paulo, Architect, Builder, QA, Independent Reviewer** — not the legacy combined "Architect / Independent Reviewer" website-pilot role. See `PRD.md` § "Role model for future governed work"; not restated here.

## Traceability

`Requirement ID → design section → increment → task/acceptance contract → test/evidence → review status`, consistent with Sentinel's existing `Requirement → Design → Implementation → Test → Evidence → Status` model (`brain/GOVERNANCE_MAP.md`). Increments below cite existing IDs; no new requirement ID is minted in this document.

## A. Candidate increment catalog (unordered — `AS10-R002`)

**IDs are permanent identifiers, not chronology.** This catalog lists every candidate increment once, with its scope and requirement mapping; it does not itself claim a build order. Section B below is the dependency-ordered execution sequence — consult B, not the ID numbers, for "what comes before what."

### `WEB-INC-001` — Admin authentication boundary
- **Requirements:** `ADM-REQ-001`, `WEB-SEC-001`, `002`, `011`.
- **Design refs:** `TECHNICAL_DESIGN.md` § "Proposed target architecture" (auth boundary); `APP_FLOW.md` §2a, §2i, §2j.
- **Bounded scope:** a server-side authentication check gating `/admin` and rejecting unauthenticated/unauthorized requests. No content mutation capability yet.
- **Likely change class:** at least `CAPABILITY` (introduces a new sensitive server-side capability); may rise to `ARCHITECTURE` if the auth boundary itself constitutes a new subsystem/cross-cutting design once its concrete shape is proposed. The exact classification is decided at this increment's own `CLASSIFY CHANGE UNDER SENTINEL` step, not fixed here — but it is at minimum Architect-Sync- and Paulo-gate-required either way.
- **Acceptance checklist (draft, to be finalized at authorization time):** unauthenticated request to `/admin` is rejected (`TEST-ADM-001`); authorized request succeeds (`TEST-ADM-002`); failure fails closed with no partial page/data leak.

### `WEB-INC-005` — Current-content storage/revision substrate + migration (narrowed, `AS10-R009`)
- **Requirements:** `RISK-WEB-015` mitigation; supports `WEB-REQ-004`.
- **Design refs:** `TECHNICAL_DESIGN.md` § "Proposed target architecture"; `DATA_BACKEND_SPEC.md` § "Current → target domain mapping", § "Publication / revision model", § "Migration considerations".
- **Bounded scope (narrowed, `AS10-R009`):** stand up the shared D1 revision-substrate pattern (the generic `<entity> + <entity>_revisions` shape defined in `DATA_BACKEND_SPEC.md`) and use it **only** for entities that already exist as current content today, plus the `sections` admin-visibility substrate: `site_settings`/`site_settings_revisions`, `navigation`/`navigation_revisions`, `foundations`/`foundation_revisions`, `projects`/`project_revisions`, `services`/`service_revisions`, `process_steps`/`process_step_revisions`, `sections`/`section_revisions`. Migrate the existing published content 1:1 into these tables without changing rendered output; `data/site.js` may be retired only after parity is independently verified. This increment does **not** create `journal_entries`/`journal_entry_revisions`/`journal_media` (owned by `WEB-INC-006`), `media`/`project_media` (owned by `WEB-INC-004`), `theme_settings`/`theme_settings_revisions` (owned by `WEB-INC-007`), or `audit_log` (owned by `WEB-INC-008`) — see the ownership matrix below. It does establish enough of the protected server-side read substrate for `WEB-INC-002` to read current-content published/draft state through.
- **Likely change class:** `ARCHITECTURE` — replacing the governed `data/site.js → schema.mjs → public.mjs → local.mjs` content boundary requires its own explicit `ARCHITECTURE`-class decision per `brain/DECISION_LOG.md` D-007. This increment cannot proceed on `D-021`'s documentation authorization alone, and naming/approving "`WEB-INC-005`" by itself does not satisfy D-007's requirement — the RFC + Architect Sync + Paulo path must still be completed.
- **Acceptance checklist (draft):** `TEST-DATA-001`, `002`; the current→target mapping table in `DATA_BACKEND_SPEC.md` is fully implemented, scoped exactly to current-content domains, with no domain left unmapped and no future-only table created early.

### `WEB-INC-002` — Secure authenticated read-only dashboard
- **Requirements:** `ADM-REQ-*` (dashboard framing only, no mutation `ADM-REQ-*` items yet).
- **Design refs:** `APP_FLOW.md` §2b (as corrected by `AS10-R006`).
- **Bounded scope (corrected, `AS10-R006`):** an authenticated, read-only dashboard reading published/draft revision state **through the protected server-side editorial data-access substrate** established by `WEB-INC-005` (or another explicitly authorized equivalent substrate) — never draft/archived content read directly from the current static `data/site.js`/`out/` deployment, which has no server-side code path capable of protecting such a read. No create/edit/publish action.
- **Likely change class:** `CAPABILITY` (a new authenticated read capability against the protected substrate), contingent on `WEB-INC-005`'s `ARCHITECTURE`-class substrate already existing.
- **Acceptance checklist (draft):** dashboard lists current published/draft/archived state accurately by reading the protected substrate, not static assets; no mutation controls are exposed.

### `WEB-INC-008` — Audit substrate (schema only — `AS10-R009`)
- **Requirements:** `ADM-REQ-012`; `WEB-SEC-009`.
- **Design refs:** `DATA_BACKEND_SPEC.md` § `audit_log`.
- **Bounded scope (clarified, `AS10-R009`):** this increment owns and is fully accountable for **creating and validating the append-only `audit_log` substrate only** — schema, append-only write path, and the invariant that a failed write is logged as failed, never omitted. It does **not** itself prove that any real admin mutation emits a row into it, because no mutation capability exists yet at this point in the sequence. That proof is `WEB-INC-003`'s acceptance criterion, not this increment's — see `WEB-INC-003` below. This split preserves independent reviewability: `WEB-INC-008` is reviewable purely as a data-substrate change; `WEB-INC-003` is reviewable purely as "does this mutation capability correctly call the substrate `WEB-INC-008` already proved works."
- **Likely change class:** `CAPABILITY` (adds a new, low-risk-but-sensitive write path — an append-only log).
- **Acceptance checklist (draft):** `audit_log` accepts a well-formed write and rejects a malformed one; a simulated failed write is recorded with `result: failure`, never omitted or recorded as success. Does **not** include "a real mutation produced a row" — that is `WEB-INC-003`'s checklist item.

### `WEB-INC-003` — Project mutation lifecycle (create/edit/draft/publish/unpublish)
- **Requirements:** `ADM-REQ-003`, `004`, `010`, `011`, `014`, `015`, `016`; `WEB-SEC-004`, `006`, `007`, `008`, `009`, `012`.
- **Design refs:** `APP_FLOW.md` §2c–§2h (as corrected by `AS10-R005`/`AS10-R008`); `DATA_BACKEND_SPEC.md` § `projects`/`project_revisions`, § "Publication / revision model".
- **Bounded scope:** the full projects mutation lifecycle against the `projects`/`project_revisions` tables `WEB-INC-005` already created (this increment creates no new table of its own — it adds mutation *behavior*: create/edit/draft/preview/publish/unpublish logic and the server-side handlers, not schema). Implemented against the entity+revisions pattern (`published_revision_id`/`draft_revision_id`, with `order` and all other content on the revision row) — not a flat `state` field, and not a base-row `order`. Journal, media, and theme settings are explicitly out of scope for this increment.
- **Audit integration (`AS10-R009`):** this increment owns proving that every mutation it introduces actually emits the required `audit_log` row via the substrate `WEB-INC-008` already created — `WEB-INC-008` proves the substrate works in isolation; `WEB-INC-003` proves real mutations use it correctly. Both must be true before this increment is considered complete.
- **Likely change class:** `CAPABILITY` (a new write/mutation capability), building on `WEB-INC-001`'s auth boundary, `WEB-INC-005`'s storage substrate, and `WEB-INC-008`'s audit substrate, all already gated in their own right.
- **Acceptance checklist (draft):** `TEST-ADM-003`, `004`, `006`, `007`, `010`; every publish/unpublish transitions `published_revision_id` without deleting prior revisions (per the revision model); every mutation this increment introduces produces a corresponding `audit_log` row, including failed writes (`result: failure`).

### `WEB-INC-004` — Media subsystem (owns `media`/`project_media` only — `AS10-R009`)
- **Requirements:** `ADM-REQ-006`; `WEB-SEC-005`.
- **Design refs:** `APP_FLOW.md` §2k; `DATA_BACKEND_SPEC.md` § `media`, § `project_media`.
- **Bounded scope (clarified, `AS10-R009`):** upload + validate + list/select media (`media` table), and the `project_media` junction table, keyed to `project_revisions.id` (not the base `projects` row — `AS10-R008`). Does **not** create `journal_media` — that table has a foreign key to `journal_entry_revisions`, which does not exist until `WEB-INC-006` creates it, so creating `journal_media` here would be a dependency on a not-yet-existing table. `WEB-INC-006` creates `journal_media` itself once `journal_entry_revisions` exists.
- **Likely change class:** `ARCHITECTURE` or `CAPABILITY` — provisioning R2 is a new resource/subsystem (`ARCHITECTURE`-leaning); the upload/validation capability itself is `CAPABILITY`-leaning. Exact classification is this increment's own determination.
- **Acceptance checklist (draft):** `TEST-ADM-008`.

### `WEB-INC-006` — Journal (owns `journal_entries`/`journal_entry_revisions`/`journal_media` — `AS10-R009`)
- **Requirements:** `ADM-REQ-005`; new public read requirement (no existing `WEB-REQ-*` covers journal reading — a future increment proposal must mint a stable ID for it, e.g. under `WEB-REQ-*`, and identify `PRD.md` as the owning document, at the point this increment is actually specified in detail, not before).
- **Design refs:** `APP_FLOW.md` §1c; `DATA_BACKEND_SPEC.md` § `journal_entries`/`journal_entry_revisions`, § `journal_media`.
- **Bounded scope (clarified, `AS10-R009`):** this increment creates `journal_entries`/`journal_entry_revisions` (unlike `projects`, these do **not** already exist from `WEB-INC-005`, since journal is entirely new — `AS10-R003`), plus `journal_media` (keyed to `journal_entry_revisions.id`, mirroring `project_media`'s revision-scoped design, once `media` already exists from `WEB-INC-004`), the full journal mutation lifecycle (mirroring `WEB-INC-003`'s pattern), and the new public journal read/index route.
- **Likely change class:** `CAPABILITY` (reuses `WEB-INC-003`'s established mutation pattern against a new entity type) plus a small `ARCHITECTURE`-class addition for the new public read surface (journal did not exist as a route/content type before).

### `WEB-INC-007` — Theme/design controls
- **Requirements:** `DESIGN-001`…`014`.
- **Design refs:** `APP_FLOW.md` §2l; `DATA_BACKEND_SPEC.md` § `theme_settings`/`theme_settings_revisions`; `UI_UX_SPEC.md` § "Design controls".
- **Bounded scope:** validated, range-constrained theme controls only — never free-form CSS/JS input (`DESIGN-014`).
- **Likely change class:** `CAPABILITY`.

## B. Dependency-ordered execution sequence (`AS10-R002`)

This is the topologically valid build order — the catalog above is unordered by ID; this section is authoritative for sequencing. Each step names what it depends on from earlier in this same list, never from later in it.

1. **`WEB-INC-001`** — Authentication boundary. Depends on nothing else in this plan.
2. **`WEB-INC-005`** — Current-content storage/revision substrate + migration. Depends on `WEB-INC-001` existing conceptually as the boundary the substrate will eventually be read/written through, and on its own separately authorized `ARCHITECTURE`-class decision (D-007) — this increment cannot proceed on `D-021` alone regardless of its position in this sequence. Narrowed scope (`AS10-R009`) does not change its position in this sequence.
3. **`WEB-INC-002`** — Secure authenticated read-only dashboard. Depends on `WEB-INC-001` (auth) and `WEB-INC-005` (protected substrate to read) — corrected per `AS10-R006`; this is a hard prerequisite, not a nice-to-have.
4. **`WEB-INC-008`** — Audit substrate (schema only). Depends on `WEB-INC-001`, `WEB-INC-005`. Ships no later than, and ideally atomically with, step 5 — resolved per `AS10-R002`'s explicit instruction to settle the audit-timing ambiguity now: the substrate must not trail the first mutation capability into production. Per `AS10-R009`, this step proves only that the substrate itself works — it does not and cannot yet prove any real mutation uses it, since no mutation capability exists before step 5.
5. **`WEB-INC-003`** — Project mutation lifecycle (behavior only — `projects`/`project_revisions` schema already exists from step 2). Depends on `WEB-INC-001`, `WEB-INC-002` (dashboard framing), `WEB-INC-005` (storage), and `WEB-INC-008` (audit substrate, whose real-mutation integration this step is the one to prove). **This resolves the prior cycle's contradiction**, where `WEB-INC-003` was listed before `WEB-INC-005` while depending on it — `WEB-INC-005` now precedes `WEB-INC-003` in this sequence, even though `WEB-INC-003`'s ID number is lower.
6. **`WEB-INC-004`** — Media subsystem (`media`/`project_media` only). Depends on `WEB-INC-001`; also depends on `WEB-INC-005` for `project_revisions` to exist, since `project_media` keys off `project_revisions.id`, not the base `projects` row (`AS10-R008`). Does not strictly require `WEB-INC-003`'s mutation behavior to exist first (schema can exist before projects have media attached through the UI).
7. **`WEB-INC-006`** — Journal (creates `journal_entries`/`journal_entry_revisions`/`journal_media` itself — `AS10-R009`). Depends on `WEB-INC-003` (reuses its lifecycle pattern) and `WEB-INC-005` (shares the same revision-substrate pattern, even though it creates its own tables rather than reusing `WEB-INC-005`'s). Also depends on `WEB-INC-004`, added this cycle: `journal_media` has a foreign key to `media.id`, which does not exist until `WEB-INC-004` creates it.
8. **`WEB-INC-007`** — Theme/design controls. Depends on `WEB-INC-001` and `WEB-INC-005` (shares the revision-substrate pattern; creates its own `theme_settings`/`theme_settings_revisions` tables, which `WEB-INC-005` does not own per the narrowed scope in `AS10-R009`).

This sequence is unchanged in overall order from Cycle 1 (`001 → 005 → 002 → 008 → 003 → 004 → 006 → 007`) — narrowing `WEB-INC-005`'s scope and adding the `WEB-INC-006 → WEB-INC-004` dependency (§C below) did not require reordering, since `WEB-INC-004` already preceded `WEB-INC-006` in this list. This sequence is itself a planning artifact, not an authorization — each step still requires its own pass through the governance-routing lifecycle in the section above before it may be built. A future increment's own `CLARIFY AMBIGUITIES` stage may revise this order if repository constraints discovered at that time suggest a different topologically valid sequence; any such revision must keep the same invariant this correction restores: no increment may be presented as ready to build while an earlier step in this list, or an unlisted prerequisite decision (like `WEB-INC-005`'s `ARCHITECTURE`-class gate), remains unresolved.

## C. Entity/table ownership matrix (`AS10-R009`)

One target entity/table has exactly one primary owning increment — no ambiguous dual ownership. This is the authoritative cross-reference; the per-increment "Bounded scope" text above must not be read as implying broader table ownership than this table states.

| Target entity / table | Owning `WEB-INC-*` | Created when | Notes |
|---|---|---|---|
| `site_settings` / `site_settings_revisions` | `WEB-INC-005` | Step 2 | Current-content substrate |
| `navigation` / `navigation_revisions` | `WEB-INC-005` | Step 2 | Current-content substrate |
| `foundations` / `foundation_revisions` | `WEB-INC-005` | Step 2 | Current-content substrate |
| `sections` / `section_revisions` | `WEB-INC-005` | Step 2 | Current-site admin substrate (visibility/order); schema only — the admin UI to edit it may ship incrementally, but the table itself is not split across increments |
| `projects` / `project_revisions` | `WEB-INC-005` | Step 2 | Schema only. Mutation *behavior* (create/edit/publish/unpublish logic) against this schema is `WEB-INC-003`'s ownership, not `WEB-INC-005`'s |
| `services` / `service_revisions` | `WEB-INC-005` | Step 2 | Current-content substrate |
| `process_steps` / `process_step_revisions` | `WEB-INC-005` | Step 2 | Current-content substrate |
| Admin identity/session schema | `WEB-INC-001` | Step 1 | Exact shape deferred; `DATA_BACKEND_SPEC.md` only requires every revision row carry a reference to it |
| `audit_log` | `WEB-INC-008` | Step 4 | Substrate/schema only — see `WEB-INC-003` for real-mutation integration proof |
| `media` / `project_media` | `WEB-INC-004` | Step 6 | `project_media` keys to `project_revisions.id` (exists from step 2) |
| `journal_entries` / `journal_entry_revisions` / `journal_media` | `WEB-INC-006` | Step 7 | `journal_media` keys to `journal_entry_revisions.id` and `media.id` (exists from step 6) — created here, not by `WEB-INC-004`, because `journal_entry_revisions` does not exist until this increment |
| `theme_settings` / `theme_settings_revisions` | `WEB-INC-007` | Step 8 | Not created by `WEB-INC-005` despite sharing its revision-substrate pattern |

`WEB-INC-002` and `WEB-INC-003` create no schema of their own — `WEB-INC-002` is a read-only consumer of `WEB-INC-005`'s substrate, and `WEB-INC-003` adds mutation behavior against schema `WEB-INC-005` already created. This is intentional: it keeps "who creates a table" and "who adds behavior against it" separately reviewable, per `AS10-R009`'s audit-substrate-vs-integration example generalized to every entity.

## What this plan does not do

- It does not authorize `WEB-INC-001` or any later increment for implementation.
- It does not provision D1, R2, or any Cloudflare resource.
- It does not create any API, route, or auth code.
- It does not perform project onboarding, populate `projects/registry.json`, or create a `.devos/` overlay.
- It does not propose or implement Sentinel `S3`.
- It does not authorize deployment or a `main` merge. `DEPLOY_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` remain `NO`.
- It does not substitute for the Sentinel change-classification/RFC/Architect-Sync/Paulo-gate path any increment's actual change class requires — see "Governance routing" above.

## Context-efficiency note

Per-increment acceptance checklists above are drafts to be finalized at the "REQUIREMENTS QUALITY / ACCEPTANCE CHECKLIST" stage immediately before that increment's own authorization — this plan does not attempt to fully specify eight increments' worth of test criteria in advance, which would itself violate `AS10-F011`'s context-efficiency guidance.
