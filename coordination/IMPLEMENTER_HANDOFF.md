# Implementer Handoff

Status: `READY_FOR_ARCHITECT` (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

## Cycle / Change ID

`MAISOGLABS-PRODUCT-BUILD-PACK` — **Remediation Cycle 2**

Authority chain: `D-020` → `D-021` → `ML-DEVOS-AS-010` (`CHANGES_REQUESTED — REMEDIATION CYCLE 2`, findings `AS10-R008`, `AS10-R009`, `AS10-R010`).

## Objective

Resolve all three Remediation Cycle 2 findings — complete publication isolation, unambiguous per-table increment ownership, and a durable-handoff provenance correction — without regressing any of Cycle 1's independently-resolved findings (`AS10-R001`–`AS10-R004`, `AS10-R006`, `AS10-R007`) or any runtime/product/backend implementation.

## Branch / Commit State

- Base for this cycle: `origin/governance/maisoglabs-v0.1` HEAD `00241a1bc6b72879e686b5e0e9b897bdc7726f81` (`docs(sync): return Product Build Pack remediation cycle 2 to Claude`), fetched and fast-forwarded before any file was touched; confirmed by direct `git rev-parse HEAD` after checkout, matching the exact SHA the request required.
- `coordination/STATE.md` at base SHA confirmed by direct read: `CYCLE_ID: MAISOGLABS-PRODUCT-BUILD-PACK`, `TURN: CLAUDE`, `STATUS: CHANGES_REQUESTED`, `CURRENT_REMEDIATION_CYCLE: 2`, `AUTHORIZED_SCOPE: MAISOGLABS_PRODUCT_BUILD_PACK_DOCS_ONLY` — matched required preconditions before any action was taken.
- `coordination/ARCHITECT_REVIEW.md` read in full: `ML-DEVOS-AS-010`'s Remediation Cycle 1 verification review of Builder commit `ffec06778a9b297eedf16d27efacc334daa81abd`, its independent re-verification of `AS10-R001`–`R007` (six `RESOLVED`, one — `R005` — `PARTIALLY RESOLVED`), and the three new findings `AS10-R008`–`R010`.
- `brain/DECISION_LOG.md` re-checked for new entries since last read; found `D-022` (cross-project reusable-pattern direction), unrelated to this cycle's authorized scope — not acted on.
- `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` re-read in full to confirm no drift in the change-classification table this cycle's edits continue to rely on.
- **Remediation commit SHA:** not yet known at the time this section is written (a commit cannot record its own resulting hash in advance) — see `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA` note; the Architect will read it from the actual pushed HEAD.

## Exact changed-file list (this cycle)

Exactly 6 files, all within the Architect's Remediation Cycle 2 authorized-scope list:

- `docs/product/TECHNICAL_DESIGN.md` (D1 entity-list note + publication-isolation cross-reference)
- `docs/product/UI_UX_SPEC.md` (draft→preview→publish note on design controls)
- `docs/product/APP_FLOW.md` (§2l rewritten; §2b, §3 updated for consistency)
- `docs/product/DATA_BACKEND_SPEC.md` (full `AS10-R008` remediation — base-entity shape, derived status, slug decision, `sections` revisioning, revision-scoped junction tables)
- `docs/product/BUILD_PLAN.md` (`AS10-R009` remediation — narrowed `WEB-INC-005`, audit/media/journal ownership split, new §C ownership matrix)
- `coordination/IMPLEMENTER_HANDOFF.md` (this file — `AS10-R010`)

**Not touched:** `docs/product/PRD.md` (no PRD-level contradiction was exposed by any of the three findings); `coordination/STATE.md` is updated in the same commit as a normal part of every cycle's handoff mechanics, per the Architect's own authorized-scope list; every application/runtime/config/deployment file (`app/`, `components/`, `data/`, `lib/`, `public/`, `tests/`, `next.config.mjs`, `wrangler.jsonc`, `package.json`, `package-lock.json`); every `devos/` file; `projects/`; every `brain/*.md` file; any CI/workflow or GitHub configuration (none exists in this repository). Confirmed by `git diff --stat HEAD -- app/ components/ data/ lib/ public/ tests/ next.config.mjs wrangler.jsonc package.json package-lock.json devos/ projects/ brain/ .github/` returning empty.

## `AS10-R008` disposition — RESOLVED

`DATA_BACKEND_SPEC.md` gained a new binding "Public rendering invariant" section stating verbatim: *"Every mutable value that can affect public presentation is sourced from published revision/state only. Draft changes cannot alter public output before publish."* Every entity definition was rewritten to make this literally true:

- **Base/logical entity shape rule (new, binding):** every entity contains only stable identity, immutable `created_at`, and the two revision pointers. `order`, visibility, and all other content fields moved to the `_revisions` table for `navigation`, `foundations`, `projects`, `services`, `process_steps`.
- **`lifecycle_state` removed entirely.** Cycle 1's `active`/`archived` flag could disagree with the revision pointers about public visibility. Entity status is now purely derived from `(published_revision_id, draft_revision_id)` — a three-row truth table (`Live` / `Draft-only` / `Archived`) replaces the separate flag, so there is no field left that could fall out of sync with actual visibility.
- **Slug semantics decided explicitly:** Option A — immutable after creation, validated (uniqueness + reserved-slug exclusion) at creation time only, never revisioned. Stated as a binding decision, not left ambiguous.
- **`sections` brought under the same revision model.** Cycle 1 left `sections.order`/`sections.visible` as bare mutable fields with no revision pair — exactly the bypass this finding named. `sections` now has a `section_revisions` companion table with the identical entity+revisions pattern as every other domain.
- **Theme/design settings flow corrected.** `APP_FLOW.md` §2l's "adjust → persist → next render" (which bypassed the revision boundary) is replaced with adjust → validate → write/update `theme_settings.draft_revision_id` → preview → publish (`theme_settings.published_revision_id := draft_revision_id`) → public render follows the published pointer only. `DATA_BACKEND_SPEC.md` and `APP_FLOW.md` now state this identically.
- **`journal_entries.order` / `published_at` resolved:** journal uses `published_at` only (set automatically by the system at publish time, never directly admin-editable, living on the revision row), not a manual `order` field — appropriate for chronological journal ordering.
- **Additional consistency fix beyond the request's explicit examples, grounded in the same invariant:** `project_media`/`journal_media` junction tables (whose `order`/`role` are exactly as public-affecting as any other ordering field) now key to `project_revisions.id`/`journal_entry_revisions.id` instead of the base `projects.id`/`journal_entries.id`, so a draft's media reordering cannot change what the published revision displays. This strengthens, and does not regress, Cycle 1's `AS10-R004` junction-table resolution — it is still an ordinary FK junction table, just keyed one level more precisely.
- `APP_FLOW.md` §3 now states the extended invariant explicitly (ordering, section visibility, and media attachment order all revision-isolated, not just "is this record published at all").

## `AS10-R009` disposition — RESOLVED

`BUILD_PLAN.md` gained a new **§C "Entity/table ownership matrix"** giving every proposed target entity/table exactly one owning `WEB-INC-*`, with a "created when" column and notes:

- **`WEB-INC-005` narrowed** to the shared revision-substrate pattern applied only to current-content domains: `site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, plus `sections` (current-site admin substrate). It explicitly no longer implies ownership of `journal_entries`, `media`, `theme_settings`, or `audit_log` — each of those is called out by name as excluded, with a pointer to its actual owner.
- **`WEB-INC-008` vs. `WEB-INC-003` audit distinction, exactly as requested:** `WEB-INC-008` creates/validates the append-only `audit_log` substrate only, proving it accepts well-formed writes and correctly records failures — it does not and cannot prove any real mutation uses it, since no mutation capability exists yet at that point in the sequence. `WEB-INC-003` owns proving that its own mutations actually emit the required rows. Both increments' "Bounded scope" and acceptance-checklist text now state this split explicitly, in both directions.
- **Media/journal ownership resolved using the request's preferred split:** `WEB-INC-004` creates `media` + `project_media` only (never `journal_media`, since `journal_entry_revisions` does not exist until `WEB-INC-006`). `WEB-INC-006` creates `journal_entries`/`journal_entry_revisions`/`journal_media` itself — avoiding a foreign key to a not-yet-existing table.
- **`WEB-INC-003` and `WEB-INC-002` now explicitly create no schema of their own** — `WEB-INC-005` already created `projects`/`project_revisions`; `WEB-INC-003` adds mutation *behavior* against that existing schema, and `WEB-INC-002` is a read-only consumer. This directly resolves the Architect's finding that `WEB-INC-005`'s scope, "taken literally," sounded like it created everything.
- **Dependency order preserved unchanged:** `001 → 005 → 002 → 008 → 003 → 004 → 006 → 007`. Narrowing `WEB-INC-005` and adding the `WEB-INC-006 → WEB-INC-004` dependency (for `journal_media`'s FK to `media`) did not require reordering, since `WEB-INC-004` already preceded `WEB-INC-006` in the existing sequence — stated explicitly in §B rather than left for the Architect to re-derive.

## `AS10-R010` disposition — RESOLVED

**Prior handoff defect, stated plainly:** the Remediation Cycle 1 `coordination/IMPLEMENTER_HANDOFF.md` stated "Exactly 6 files" and its file list omitted `docs/product/DATA_BACKEND_SPEC.md`. This was factually wrong — the exact Git compare `a5fd502611b54da62a264404a4282081af4d03b4 → ffec06778a9b297eedf16d27efacc334daa81abd`, independently confirmed by the Architect, shows **7 changed files**. This is not being rewritten as if it had originally been reported correctly; it is recorded here as a corrected fact, with the defect and its correction both stated, per `CORE-011`'s "a durable record is corrected, never silently rewritten" pattern.

**Corrected historical record, for this durable handoff going forward:** Remediation Cycle 1's exact diff (`a5fd502` → `ffec067`) changed exactly 7 files:
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`
- `docs/product/APP_FLOW.md`
- `docs/product/BUILD_PLAN.md`
- `docs/product/DATA_BACKEND_SPEC.md`
- `docs/product/TECHNICAL_DESIGN.md`
- `docs/product/UI_UX_SPEC.md`

The Cycle 1 handoff's undercount was a Builder-authored provenance defect; the Architect detected it independently by running the exact Git compare rather than trusting the Builder's stated count. **Evidence-class distinction preserved:** the Builder's own file-count claims (in both the original Cycle 1 handoff and this correction) remain `ACTOR_REPORTED`; the Architect's exact Git diff inspection that caught the discrepancy is `INDEPENDENTLY_INSPECTED`, and this handoff does not claim otherwise for either cycle.

## Entity/table ownership matrix summary

See `BUILD_PLAN.md` § C for the full table. Summary: `WEB-INC-005` owns `site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, `sections` (all + their `_revisions` companions); `WEB-INC-001` owns admin identity/session schema; `WEB-INC-008` owns `audit_log`; `WEB-INC-004` owns `media`/`project_media`; `WEB-INC-006` owns `journal_entries`/`journal_entry_revisions`/`journal_media`; `WEB-INC-007` owns `theme_settings`. `WEB-INC-002` and `WEB-INC-003` own no schema — they consume/mutate against schema owned by others.

## Publication-isolation summary

Base entities now contain only identity + `created_at` + `published_revision_id`/`draft_revision_id`. All `order`, visibility, and content fields live in `_revisions` rows. Entity status is derived from the two pointers, not stored separately. `sections` and junction-table media attachment are now revision-scoped like everything else. `APP_FLOW.md` §2l (design settings) and the dashboard/section bullets in §2b are updated to route through draft → preview → publish rather than an immediate persist-and-apply.

## Checks performed

- `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` before any file was touched; `git rev-parse HEAD` confirmed against the exact required SHA `00241a1b...`.
- Direct reads of `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (full), `brain/DECISION_LOG.md` (tail, to check for drift since last cycle), and `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` before drafting any remediation text.
- Full re-read of `DATA_BACKEND_SPEC.md`, `BUILD_PLAN.md`, `APP_FLOW.md`, `TECHNICAL_DESIGN.md`, `UI_UX_SPEC.md` in their pre-remediation state before editing.
- `grep` sweep confirming no `lifecycle_state` reference remains in any entity's base-row field list.
- `grep` sweep confirming `project_media`/`journal_media` now key to `*_revisions`, not the base entity.
- `git status --short` and `git diff --stat` against every application/runtime/config/deployment/DevOS/brain/project-registry path, confirmed empty.

## Known limitations

- This handoff's own claims are `ACTOR_REPORTED` until the Architect independently reproduces them.
- The root `meta`/`site_settings`-level "whole site must be published" gate (flagged as an open design note in Cycle 1) remains an open design note in this cycle too — not resolved, not silently dropped, still explicitly disclosed in `DATA_BACKEND_SPEC.md`'s mapping table.
- Each candidate increment's "Likely change class" annotation remains a planning-time estimate, not a binding classification — the increment's own future `CLASSIFY CHANGE UNDER SENTINEL` step decides that.
- `PRD.md` was not modified this cycle, consistent with the Architect's instruction that it remain unchanged absent a genuine PRD-level contradiction; none was found.

## Explicit confirmation that no implementation began

Confirmed: no website/admin/backend implementation; no application/runtime code changes; no D1/R2/API provisioning; no Cloudflare resource creation; no database migration; no project onboarding; no project-registry population; no product `.devos/` overlay; no CI/workflow; no GitHub ruleset/branch-protection change; no production deployment; no protected-branch/`main` merge; no S3 proposal or implementation; no `WEB-INC-001` or any other increment build work. `DEPLOY_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` remain `NO`. This cycle produced documentation remediation only.
