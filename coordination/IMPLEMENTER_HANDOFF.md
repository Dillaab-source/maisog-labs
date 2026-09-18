# Implementer Handoff

Status: `READY_FOR_ARCHITECT` (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

## Cycle / Change ID

`MAISOGLABS-PRODUCT-BUILD-PACK` — **Remediation Cycle 3 (FINAL, `MAX_REMEDIATION_CYCLES: 3`)**

Authority chain: `D-020` → `D-021` → `ML-DEVOS-AS-010` (`CHANGES_REQUESTED — REMEDIATION CYCLE 3 (FINAL ALLOWED CYCLE)`, findings `AS10-R011`, `AS10-R012`).

## Objective

Resolve the two final, tightly bounded findings — end-to-end media/junction-row publication isolation, and a second durable-handoff provenance correction — without regressing any previously resolved finding (`AS10-R001`–`AS10-R010`) or any runtime/product/backend implementation. This is the final configured remediation cycle; no fourth cycle is authorized.

## Branch / Commit State

- Base for this cycle: `origin/governance/maisoglabs-v0.1` HEAD `e46dc1e2c0fc2001644d8171d0e7bd0ed0d7a293` (`docs(sync): return Product Build Pack remediation cycle 3 to Claude`), fetched and fast-forwarded before any file was touched; confirmed by direct `git rev-parse HEAD` after checkout, matching the exact SHA the request required.
- `coordination/STATE.md` at base SHA confirmed by direct read: `CYCLE_ID: MAISOGLABS-PRODUCT-BUILD-PACK`, `TURN: CLAUDE`, `STATUS: CHANGES_REQUESTED`, `CURRENT_REMEDIATION_CYCLE: 3`, `MAX_REMEDIATION_CYCLES: 3`, `AUTHORIZED_SCOPE: MAISOGLABS_PRODUCT_BUILD_PACK_DOCS_ONLY` — matched required preconditions before any action was taken.
- `coordination/ARCHITECT_REVIEW.md` read in full: `ML-DEVOS-AS-010`'s Remediation Cycle 2 verification review of Builder commit `646ec537c3184650b44039a9dc5111b116cddb9a`, its independent re-verification of `AS10-R001`–`R010` (eight `RESOLVED`/`RESOLVED-PRESERVED`, `AS10-R008` `PARTIALLY RESOLVED`, `AS10-R010` `NOT FULLY RESOLVED`), and the two remaining findings.
- `coordination/IMPLEMENTER_HANDOFF.md` (prior, Cycle 2 version) read in full to identify the exact defect the Architect found in it before rewriting it.
- `docs/product/DATA_BACKEND_SPEC.md`, `docs/product/APP_FLOW.md`, `docs/product/BUILD_PLAN.md` read in full before editing, to scope changes precisely to the two findings.
- **Remediation commit SHA:** not yet known at the time this section is written (a commit cannot record its own resulting hash in advance) — see `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA` note; the Architect will read it from the actual pushed HEAD.

## Exact Cycle 3 changed-file list

Exactly 5 files, all within the Architect's Remediation Cycle 3 authorized-scope list:

- `docs/product/DATA_BACKEND_SPEC.md` (full `AS10-R011` remediation — media immutability, junction-row immutability, restated public rendering invariant)
- `docs/product/APP_FLOW.md` (§2k extended for the media-replacement flow; §3 restated to confirm end-to-end isolation)
- `docs/product/BUILD_PLAN.md` (local acceptance/ownership wording added to `WEB-INC-004`/`WEB-INC-006` and the §C ownership matrix, per the Architect's explicit allowance for this)
- `coordination/IMPLEMENTER_HANDOFF.md` (this file — `AS10-R012`)
- `coordination/STATE.md`

**Not touched, exactly as instructed:** `docs/product/PRD.md`, `docs/product/TECHNICAL_DESIGN.md`, `docs/product/UI_UX_SPEC.md` — checked for a direct contradiction from the media-immutability fix (none found: `TECHNICAL_DESIGN.md`'s existing D1/junction-table description and `UI_UX_SPEC.md`'s design-controls note are both already compatible with, not contradicted by, the new rule) and left unmodified. Every application/runtime/config/deployment file (`app/`, `components/`, `data/`, `lib/`, `public/`, `tests/`, `next.config.mjs`, `wrangler.jsonc`, `package.json`, `package-lock.json`); every `devos/` file; `projects/`; every `brain/*.md` file; any CI/workflow or GitHub configuration (none exists in this repository). Confirmed by `git diff --stat HEAD -- app/ components/ data/ lib/ public/ tests/ next.config.mjs wrangler.jsonc package.json package-lock.json devos/ projects/ brain/ .github/ docs/product/PRD.md docs/product/TECHNICAL_DESIGN.md docs/product/UI_UX_SPEC.md` returning empty.

## `AS10-R011` disposition — RESOLVED

`DATA_BACKEND_SPEC.md`'s "Public rendering invariant" is restated to cover the whole public read graph: *"Every mutable value that can affect public presentation is either (A) contained inside a revision, or (B) immutable once referenced by that revision. Therefore draft changes cannot alter public output before publish."*

**Media record immutability rule (new § "Media immutability"):** `media.storage_key`/`content_type`/`size_bytes`/`alt_text` are immutable after creation — none of them is ever edited in place, whether or not the row is currently referenced by a published revision (stricter than "immutable only while published," so there is no conditional code path that could edit one). A file change or an `alt_text` correction always creates a new `media` row; the old row is left untouched. The one field that may still change on an existing row is the bookkeeping `state` (`active`/`archived`), which is never itself consulted by public rendering, so this exception does not reopen the gap.

**Junction-row immutability rule (new § "Junction-row immutability"):** a `project_media`/`journal_media` row is an immutable association snapshot once created — `media_id`, `role`, and `order` are never edited in place on an existing row, for any revision (not only the currently published one, for the same "no conditional path" reasoning as media). To change an attachment: the published revision and its junction rows remain untouched; a draft revision's own junction rows are created/edited freely; preview reads the draft's rows; publish promotes the draft revision via the normal `published_revision_id := draft_revision_id` pointer swap, at which point the draft's junction row set becomes the one the public read path follows; the prior revision and its junction rows remain as untouched historical evidence.

**`APP_FLOW.md` agreement:** §2k is extended with an explicit "Replacing media on an already-published project/entry" flow — upload creates a new `media` record → attach to the entity's draft revision's own junction rows → preview → publish → only then does public output change. §3's restated invariant paragraph now names this as the closed gap. `DATA_BACKEND_SPEC.md` and `APP_FLOW.md` state the same rule in the same terms.

**`BUILD_PLAN.md` local wording (permitted by the Architect's authorized scope):** `WEB-INC-004`'s bounded scope and acceptance checklist, `WEB-INC-006`'s bounded scope, and two rows of the §C ownership matrix now name the immutability rule explicitly, so an increment that creates `media`/`project_media`/`journal_media` is reviewable against it from the start rather than needing a later correction.

No exact SQL was introduced. No runtime implementation was introduced.

## `AS10-R012` disposition — RESOLVED

**Prior handoff defect, stated plainly:** the Remediation Cycle 2 `coordination/IMPLEMENTER_HANDOFF.md` stated "Exactly 6 files" under "Exact changed-file list (this cycle)" and its list omitted `coordination/STATE.md`, even though the same handoff's own "Not touched" note acknowledged `STATE.md` was updated in that commit. The exact Git compare `00241a1bc6b72879e686b5e0e9b897bdc7726f81 → 646ec537c3184650b44039a9dc5111b116cddb9a`, independently confirmed by the Architect, shows **7 changed files**. Calling a list "exact" while excluding a file present in the commit diff was factually wrong. This is the second such count defect in this cycle's durable handoff (the first, in the Cycle 1 count, was corrected in the Cycle 2 handoff); it is being corrected the same way — as a stated fact, not silently rewritten as if the count had originally been right.

**Corrected historical record — Remediation Cycle 2's exact diff** (`00241a1b` → `646ec537`) changed exactly 7 files:
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`
- `docs/product/APP_FLOW.md`
- `docs/product/BUILD_PLAN.md`
- `docs/product/DATA_BACKEND_SPEC.md`
- `docs/product/TECHNICAL_DESIGN.md`
- `docs/product/UI_UX_SPEC.md`

**Historical Cycle 1 correction retained, not re-litigated:** Remediation Cycle 1's exact diff (`a5fd502` → `ffec067`) remains recorded as the same 7 files (`coordination/IMPLEMENTER_HANDOFF.md`, `coordination/STATE.md`, `docs/product/APP_FLOW.md`, `docs/product/BUILD_PLAN.md`, `docs/product/DATA_BACKEND_SPEC.md`, `docs/product/TECHNICAL_DESIGN.md`, `docs/product/UI_UX_SPEC.md`), as corrected in the Cycle 2 handoff.

The Cycle 2 handoff's undercount was a Builder-authored provenance defect; the Architect detected it independently by running the exact Git compare rather than trusting the Builder's stated count, exactly as with the Cycle 1 defect. **Evidence-class distinction preserved:** the Builder's own file-count claims (in the original Cycle 2 handoff and this correction) remain `ACTOR_REPORTED`; the Architect's exact Git diff inspection that caught both discrepancies is `INDEPENDENTLY_INSPECTED`, and this handoff does not claim otherwise for any cycle.

## Media immutability rule (summary)

`media` rows: `storage_key`/`content_type`/`size_bytes`/`alt_text` immutable after creation; only bookkeeping `state` may change; a replacement is always a new row.

## Junction-row immutability rule (summary)

`project_media`/`journal_media` rows: `media_id`/`role`/`order` immutable once created, for any revision. Attachment/reorder/role changes happen only on a draft revision's own junction rows, and reach the public only when that draft revision is published via the normal pointer swap.

## Checks performed

- `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` before any file was touched; `git rev-parse HEAD` confirmed against the exact required SHA `e46dc1e...`.
- Direct full reads of `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md`, `coordination/IMPLEMENTER_HANDOFF.md` (prior version), `docs/product/DATA_BACKEND_SPEC.md`, `docs/product/APP_FLOW.md`, `docs/product/BUILD_PLAN.md` before drafting any remediation text.
- `grep` sweep of `docs/product/TECHNICAL_DESIGN.md` and `docs/product/UI_UX_SPEC.md` for media-related content, confirming no direct contradiction with the new immutability rule before leaving both files unmodified.
- Re-derivation of the exact Cycle 1 (`a5fd502`→`ffec067`) and Cycle 2 (`00241a1b`→`646ec537`) 7-file lists from the Architect's own independently-inspected compares, rather than re-trusting either prior Builder count.
- `git status --short` and `git diff --stat` against every application/runtime/config/deployment/DevOS/brain/project-registry path plus `PRD.md`/`TECHNICAL_DESIGN.md`/`UI_UX_SPEC.md`, confirmed empty.

## Known limitations

- This handoff's own claims, including this cycle's own file count, are `ACTOR_REPORTED` until the Architect independently reproduces them via the exact Git compare — the same mechanism that caught both prior counting defects.
- The root `meta`/`site_settings`-level "whole site must be published" gate (flagged as an open design note in Cycle 1, retained in Cycle 2) remains an open design note in this cycle too — not resolved, not silently dropped.
- A future implementation may introduce an explicit media-revision table instead of "always create a new row" for `alt_text`-only corrections, if that proves more ergonomic — `DATA_BACKEND_SPEC.md` names this as an allowed alternative, not a required one, so as not to add a second revisioning mechanism prematurely.
- `PRD.md`, `TECHNICAL_DESIGN.md`, `UI_UX_SPEC.md` were not modified this cycle, consistent with the Architect's instruction that they remain unchanged absent a direct contradiction; none was found.

## Explicit confirmation that no implementation began

Confirmed: no website/admin/backend implementation; no application/runtime code changes; no D1/R2/API provisioning; no Cloudflare resource creation; no database migration; no project onboarding; no project-registry population; no product `.devos/` overlay; no CI/workflow; no GitHub ruleset/branch-protection change; no production deployment; no protected-branch/`main` merge; no S3 proposal or implementation; no `WEB-INC-001` or any other increment build work. `DEPLOY_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` remain `NO`. This cycle produced documentation remediation only.
