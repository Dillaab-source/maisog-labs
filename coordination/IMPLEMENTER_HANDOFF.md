# Implementer Handoff

Status: `READY_FOR_ARCHITECT` (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

## Cycle / Change ID

`MAISOGLABS-PRODUCT-BUILD-PACK` — **Remediation Cycle 1**

Authority chain: `D-020` → `D-021` → `ML-DEVOS-AS-010` (`CHANGES_REQUESTED — REMEDIATION CYCLE 1`, findings `AS10-R001`–`AS10-R007`).

## Objective

Resolve all seven Remediation Cycle 1 findings against the Product Build Pack without regressing anything the Architect's review already passed, and without any runtime/product/backend implementation.

## Branch / Commit State

- Base for this cycle: `origin/governance/maisoglabs-v0.1` HEAD `a5fd502611b54da62a264404a4282081af4d03b4` (`docs(sync): return Product Build Pack remediation to Claude`), fetched and fast-forwarded before any file was touched; confirmed by direct `git rev-parse HEAD` after checkout, matching the exact SHA the request required.
- `coordination/STATE.md` at base SHA confirmed by direct read: `CYCLE_ID: MAISOGLABS-PRODUCT-BUILD-PACK`, `TURN: CLAUDE`, `STATUS: CHANGES_REQUESTED`, `CURRENT_REMEDIATION_CYCLE: 1`, `AUTHORIZED_SCOPE: MAISOGLABS_PRODUCT_BUILD_PACK_DOCS_ONLY` — matched required preconditions before any action was taken.
- `coordination/ARCHITECT_REVIEW.md` read in full: `ML-DEVOS-AS-010`'s Remediation Cycle 1 review of Builder commit `da91051b0e7c2c228748ece25859b12a33fa1009`, all seven findings `AS10-R001`–`AS10-R007`, and the "What passed independently" list.
- `brain/DECISION_LOG.md`, `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`, and `devos/governance/ROLE_RESPONSIBILITY_MATRIX.md` read in full for this cycle (the latter two specifically to ground `AS10-R001`'s change-classification table and per-class routing, and to reconfirm the five-actor model before restating it).
- **Remediation commit SHA:** not yet known at the time this section is written (a commit cannot record its own resulting hash in advance) — see `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA` note; the Architect will read it from the actual pushed HEAD.

## Exact changed-file list

Exactly 6 files, all within the Architect's Remediation Cycle 1 authorized-scope list (`coordination/ARCHITECT_REVIEW.md` § "Authorized remediation scope"):

- `docs/product/TECHNICAL_DESIGN.md` (citation fix + proposed-architecture consistency updates)
- `docs/product/UI_UX_SPEC.md` (citation fix)
- `docs/product/APP_FLOW.md` (revision-model and protected-read-path consistency updates, §§2b–2f, §3)
- `docs/product/BUILD_PLAN.md` (governance-routing section added, candidate catalog/execution-sequence split)
- `coordination/IMPLEMENTER_HANDOFF.md` (this file)
- `coordination/STATE.md`

**Not touched:** `docs/product/PRD.md` (no cross-document wording change was needed there — its precedence/role-model/requirement-catalog content was not implicated by any of the seven findings); every application/runtime/config/deployment file (`app/`, `components/`, `data/`, `lib/`, `public/`, `tests/`, `next.config.mjs`, `wrangler.jsonc`, `package.json`, `package-lock.json`); every `devos/` file; `projects/`; every `brain/*.md` file; any CI/workflow or GitHub configuration (none exists in this repository). Confirmed by `git diff --stat HEAD -- app/ components/ data/ lib/ public/ tests/ next.config.mjs wrangler.jsonc package.json package-lock.json devos/ projects/ brain/ .github/` returning empty.

## Per-finding `AS10-R001`–`AS10-R007` disposition

### `AS10-R001` — Governance routing — **RESOLVED**

`BUILD_PLAN.md` now has a new binding section, "Governance routing — binding correction to `AS10-F009` (`AS10-R001`)", placed immediately after the roadmap-taxonomy rule and before the candidate catalog. It:
- states explicitly, per the Architect's own review, that this corrects an Architect-origin gap in `AS10-F009`, not Builder drift;
- reproduces the exact `IDEA / CHANGE NEED → … → NEXT GATE` chain from the request, sourced from `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §4's target lifecycle;
- explains how `AS10-F009`'s original finer-grained stages nest inside this chain rather than being discarded;
- states per-class routing for all eight change classes (`PATCH`, `LOCAL_RULE`, `CORE_POLICY`, `CAPABILITY`, `ARCHITECTURE`, `CONSTITUTIONAL`, `WAIVER`, `PROJECT_ONBOARDING`), grounded in `CHANGE_GOVERNANCE_POLICY.md` §1's table (read in full this cycle, not assumed from memory);
- states the binding rule verbatim in substance: a `WEB-INC-*` ID is a planning identifier only, and Paulo naming/approving one is not by itself sufficient where the active change class requires a stronger record.
- Every candidate increment in the catalog now carries a "Likely change class" line applying this rule concretely (e.g. `WEB-INC-005` is flagged `ARCHITECTURE`, citing `D-007`'s requirement, and explicitly states that approving its ID alone does not satisfy that requirement).

### `AS10-R002` — True dependency order — **RESOLVED**

`BUILD_PLAN.md`'s "Candidate increments" section is replaced with two explicitly separated sections:
- **§A "Candidate increment catalog (unordered)"** — all eight `WEB-INC-*` entries, explicitly labeled "IDs are permanent identifiers, not chronology," each with scope/requirements/change-class, no ordering claim.
- **§B "Dependency-ordered execution sequence"** — the actual topologically valid build order: `001 → 005 → 002 → 008 → 003 → 004 → 006 → 007`. Every step cites only earlier steps in this same list as its dependency (`WEB-INC-003` now depends on `WEB-INC-005`, which precedes it in §B — the exact contradiction the Architect flagged is gone, even though `WEB-INC-003`'s ID number is lower).
- The audit-timing ambiguity (`WEB-INC-008`) is explicitly resolved rather than left open: audit must land no later than, and is intended to ship atomically with, the first mutation increment (`WEB-INC-003`) — stated in both the catalog entry and §B step 4.
- The storage-vs-mutation ambiguity is explicitly resolved: `WEB-INC-005` (storage) precedes `WEB-INC-003` (mutation) in §B, and the catalog entry for `WEB-INC-003` states this plainly rather than leaving it as an "open dependency question," which is what the Architect flagged as contradicting the plan's own stated invariant.

### `AS10-R003` — Complete current→target data mapping — **RESOLVED**

`DATA_BACKEND_SPEC.md` gained a new "Current → target domain mapping" table mapping **every** current top-level schema domain (`meta`, `site`, `seo`, `navigation[]`, `hero`, `foundations[]`, `projects[]`, `services[]`, `process`, `process.steps[]`, `about`, `contact`, `projectSection`, `footer`) to an explicit target representation:
- Records-array domains (`navigation`, `foundations`, `projects`, `services`, `process.steps`) each get their own dedicated entity+revisions pair — `foundations`/`foundation_revisions`, `services`/`service_revisions`, and `process_steps`/`process_step_revisions` are newly added entities in this cycle, closing the exact three gaps the Architect named.
- Singleton content groups (`site`, `seo`, `hero`, `about`, `contact`, `projectSection`, `process`) each become an explicitly typed, individually validated substructure inside `site_settings` — never an untyped/free-form JSON blob, satisfying the request's explicit prohibition on that shortcut.
- `services` is explicitly flagged: it is preserved by default (currently validated though not rendered), and retiring it instead would require a separate, explicit future architecture/product decision — it is not silently dropped.
- The "Migration considerations" section now states plainly that `foundations`, `services`, and `process.steps` are not optional/deferrable parts of a future migration.

### `AS10-R004` — Truthful D1 relationships — **RESOLVED**

`DATA_BACKEND_SPEC.md`'s `projects` and `journal_entries` entities no longer describe `media_ids[]` as a foreign key. Two new junction-table entities are added — `project_media` (`project_id`, `media_id`, `role`, `order`) and `journal_media` (`journal_entry_id`, `media_id`, `role`, `order`) — as the proposed relational target, exactly the pattern the request named. The relationship diagram is updated to show `projects (many) ──via project_media──> media (many)` / `journal_entries (many) ──via journal_media──> media (many)` instead of an array-as-foreign-key arrow. The spec also states the fallback rule explicitly: if a future increment chooses a JSON-array column instead, it must say integrity is application-enforced, not a database foreign key.

### `AS10-R005` — Draft/published revision model — **RESOLVED**

`DATA_BACKEND_SPEC.md` gained a new "Publication / revision model" section defining the generic `logical entity (published_revision_id, draft_revision_id) + <entity>_revisions` pattern requested, and stating exactly how public rendering, admin editing, preview, publish, and unpublish each interact with it (public reads only `published_revision_id`; editing writes a new/updated `<entity>_revisions` row and repoints only `draft_revision_id`, leaving the published row untouched; preview reads `draft_revision_id` under authentication; publish atomically swaps the pointer and re-validates in full; unpublish nulls the pointer without deleting history). This pattern is applied to every entity that currently carries the `draft`/`published`/`archived` model: `navigation`, `foundations`, `projects`, `services`, `process_steps`, `journal_entries`, `site_settings`, `theme_settings`. `APP_FLOW.md` §§2c–2f are rewritten in the same cycle to describe transitions in these exact terms (see below) — the request's explicit "make sure `APP_FLOW.md` agrees with this model" is satisfied, not left as a dangling cross-reference.

### `AS10-R006` — Secure admin read path — **RESOLVED**

Chosen option: move the protected dashboard after a protected server-side data-access substrate exists (the first of the two preferred options the request offered), rather than scoping it to public-only data. Concretely:
- `BUILD_PLAN.md`'s `WEB-INC-002` catalog entry and §B execution sequence now state its dependency is `WEB-INC-001` **and** `WEB-INC-005` (or an explicitly authorized equivalent substrate) — not `WEB-INC-001` alone.
- `TECHNICAL_DESIGN.md`'s "Proposed target architecture" gained an explicit "Protected editorial read path" bullet stating this substrate does not exist today and cannot be approximated from the current static/asset-only deployment.
- `APP_FLOW.md` §2b gained a "Read path correction (`AS10-R006`)" paragraph stating the dashboard reads through the protected substrate, never draft/archived content sourced directly from `data/site.js`/`out/`.
- `DATA_BACKEND_SPEC.md`'s "Authorization boundaries" section cross-references the same constraint.
All three documents are now consistent, per the request's explicit requirement.

### `AS10-R007` — Fix source-section citations — **RESOLVED**

Corrected:
- `TECHNICAL_DESIGN.md`: `WEB-SEC-*` citation changed from §11 to §13.
- `UI_UX_SPEC.md`: `DESIGN-*` citation changed from §10 to §11.
- `DATA_BACKEND_SPEC.md`: its context-efficiency-note citation changed from "§§10–11" to explicit "§10 (`ADM-REQ-*`), §11 (`DESIGN-*`), §13 (`WEB-SEC-*`)".
- `coordination/IMPLEMENTER_HANDOFF.md` (this file, § "Requirement / source mapping" below): `WEB-REQ-*`→§9, `ADM-REQ-*`→§10, `DESIGN-*`→§11, `WEB-SEC-*`→§13, `RISK-WEB-*`→§14.

A full-pack search (`grep -n "§9\|§10\|§11\|§13\|§14\|§§"`) was re-run after all edits; the only remaining citations are `PRD.md`'s `§§9–11, 13–14` (correct — it covers all five sections 9, 10, 11, 13, 14 in one range-and-list notation) and `BUILD_PLAN.md`'s two references to `TECHNICAL_DESIGN.md`/`DATA_BACKEND_SPEC.md` **document sections** (not plan §-numbers, so not in scope for this correction).

## Requirement / source mapping (corrected, `AS10-R007`)

| Requirement family | Owning source section |
|---|---|
| `WEB-REQ-001`…`008` | `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §9 |
| `ADM-REQ-001`…`016` | same plan §10 |
| `DESIGN-001`…`014` | same plan §11 |
| `WEB-SEC-001`…`012` | same plan §13 |
| `RISK-WEB-001`…`015` | same plan §14 |

## Migration mapping summary

Every current top-level schema domain now has an explicit target representation (`AS10-R003`, see `DATA_BACKEND_SPEC.md` § "Current → target domain mapping" for the full table): records-array domains → dedicated entity+revisions pairs (`navigation`, `foundations`, `projects`, `services`, `process_steps` — the last three newly modeled this cycle); singleton content groups → individually typed substructures inside `site_settings` (`site`, `seo`, `hero`, `about`, `contact`, `projectSection`, `process`); the root `meta.state` build-gate is flagged as having no direct one-to-one target equivalent once revisioning is per-entity, with an explicit open design note (not a silent drop) for a future increment to resolve. No domain is represented as an untyped/free-form JSON blob.

## Dependency-order summary

`BUILD_PLAN.md` §B: `WEB-INC-001` (auth) → `WEB-INC-005` (storage substrate + migration, its own `ARCHITECTURE`-class gate) → `WEB-INC-002` (dashboard, now correctly dependent on both) → `WEB-INC-008` (audit, resolved to ship no later than/atomically with the next step) → `WEB-INC-003` (project mutations) → `WEB-INC-004` (media) → `WEB-INC-006` (journal) → `WEB-INC-007` (theme). IDs remain stable/permanent per `AS10-R002`; §A (the unordered catalog) and §B (the execution order) are now explicitly separate sections.

## Publication-revision model summary

`DATA_BACKEND_SPEC.md` § "Publication / revision model" (`AS10-R005`): every editorial entity gets `published_revision_id`/`draft_revision_id` pointers into a companion `<entity>_revisions` table. Public reads follow `published_revision_id` only; edits write new revision rows and move only `draft_revision_id`; publish is an atomic pointer swap with full re-validation; unpublish nulls the published pointer without deleting revision history. `APP_FLOW.md` §§2c–2f and §3 restate the same model in flow terms so the two documents agree, as required.

## Evidence / checks performed

- `git fetch origin governance/maisoglabs-v0.1` + `git merge --ff-only` before any file was touched; `git rev-parse HEAD` confirmed against the exact required SHA.
- Direct reads (not assumed from the request text) of `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md`, `brain/DECISION_LOG.md`, `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`, `devos/governance/ROLE_RESPONSIBILITY_MATRIX.md` before drafting any remediation text.
- Full re-read of all six product documents in their pre-remediation state before editing, to scope changes precisely to the seven findings.
- `grep` sweep across all six documents for `§9`/`§10`/`§11`/`§13`/`§14`/`§§` citations after editing, to confirm no other incorrect section reference remained (`AS10-R007`'s explicit "search the full six-document pack" instruction).
- `grep` sweep for `media_ids` to confirm no remaining foreign-key mischaracterization.
- `grep` sweep for bare `S[0-9]` tokens in `BUILD_PLAN.md` to confirm no Sentinel-phase number was used for a website increment.
- `git status --short` and `git diff --stat` against every application/runtime/config/deployment/DevOS/brain/project-registry path, confirmed empty.

## Known limitations

- This handoff's own claims are `ACTOR_REPORTED` until the Architect independently reproduces them, per `devos/governance/ROLE_RESPONSIBILITY_MATRIX.md`'s evidence-class rule.
- The root `meta.state` build-gate's target equivalent (see "Migration mapping summary" above) is explicitly left as an open design note for a future increment, not resolved in this cycle — disclosed, not silently dropped.
- Each candidate increment's "Likely change class" annotation in `BUILD_PLAN.md` is a planning-time estimate; the actual binding classification happens at that increment's own future `CLASSIFY CHANGE UNDER SENTINEL` step, not in this document.
- `PRD.md` was not modified this cycle; if the Architect finds a cross-document wording gap there stemming from these fixes, that would be a new finding, not a re-opening of `AS10-R001`–`R007`.

## Explicit confirmation that no implementation was started

Confirmed: no website/admin/backend implementation; no application/runtime code changes; no D1/R2/API provisioning; no Cloudflare resource creation; no database migration; no project onboarding; no project-registry population; no product `.devos/` overlay; no CI/workflow; no GitHub ruleset/branch-protection change; no production deployment; no protected-branch/`main` merge; no S3 proposal or implementation; no `WEB-INC-001` or any other increment build work. `DEPLOY_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` remain `NO`. This cycle produced documentation remediation only: five product documents edited plus the two required coordination-record updates.
