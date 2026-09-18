# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-010 — Product Build Pack Remediation Cycle 1 Verification

Cycle: `MAISOGLABS-PRODUCT-BUILD-PACK`
Review mode: `POST-REMEDIATION ARCHITECTURE SYNC / CROSS-ARTIFACT CONSISTENCY REVIEW`
Authority chain: `D-020 → D-021 → ML-DEVOS-AS-010`
Reviewed Builder remediation commit: `ffec06778a9b297eedf16d27efacc334daa81abd`
Builder remediation base: `a5fd502611b54da62a264404a4282081af4d03b4`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

## Review discipline performed

Before issuing this verdict, the Architect:

1. pulled the live governance branch and current state;
2. confirmed the live branch contains Builder remediation commit `ffec067...`;
3. noted that live HEAD is now one later Architect-owned planning commit, `c5f1fc8...` (`D-022`), which changes only `brain/DECISION_LOG.md` and is outside the Builder remediation diff;
4. independently compared exact Builder range `a5fd502... → ffec067...`;
5. read the remediated Product Build Pack artifacts and current handoff/state from the exact Builder commit;
6. compared the governance-routing text with active `CHANGE_GOVERNANCE_POLICY.md`;
7. independently checked the seven prior findings `AS10-R001` through `AS10-R007`;
8. checked cross-document publication semantics, increment boundaries, provenance accuracy, scope drift, and hidden implementation authorization.

## Exact Builder remediation diff

GitHub compare `a5fd502611b54da62a264404a4282081af4d03b4 → ffec06778a9b297eedf16d27efacc334daa81abd` reports:

- exactly **1 Builder commit**;
- exactly **7 changed files**:
  - `coordination/IMPLEMENTER_HANDOFF.md`
  - `coordination/STATE.md`
  - `docs/product/APP_FLOW.md`
  - `docs/product/BUILD_PLAN.md`
  - `docs/product/DATA_BACKEND_SPEC.md`
  - `docs/product/TECHNICAL_DESIGN.md`
  - `docs/product/UI_UX_SPEC.md`

No application/runtime/config/deployment/DevOS/brain/project-registry path changed in the Builder remediation commit.

Scope remains within the authorized documentation-only remediation boundary.

## Prior findings — independently verified

### AS10-R001 — RESOLVED

`BUILD_PLAN.md` now restores Sentinel's active classification/authorization spine before implementation:

`CLASSIFY → required record/proposal → Architect Sync where required → Paulo gate where required → AUTHORIZED → build`.

All eight active change classes are represented, and the plan correctly states that a `WEB-INC-*` identifier is planning metadata rather than authority.

### AS10-R002 — RESOLVED

`BUILD_PLAN.md` now separates:

- an unordered stable-ID candidate catalog; and
- a dependency-ordered execution sequence.

The execution sequence is mechanically present as:

`001 → 005 → 002 → 008 → 003 → 004 → 006 → 007`.

The prior `WEB-INC-003`-before-`WEB-INC-005` contradiction is removed.

### AS10-R003 — RESOLVED

`DATA_BACKEND_SPEC.md` now maps all current structured content domains, including the previously omitted:

- `foundations[]`;
- `services[]`;
- `process.steps[]`.

The mapping is typed rather than an unbounded catch-all blob, and `services[]` is explicitly preserved unless a future decision retires it.

### AS10-R004 — RESOLVED

The proposed relational target now uses:

- `project_media`;
- `journal_media`;

as junction tables instead of describing a JSON/array value as a database foreign key.

Historical references to the old `media_ids[]` design are explanatory only and do not remain as the target relationship model.

### AS10-R005 — PARTIALLY RESOLVED; new isolation defect found

The central revision-pointer model is now present:

- `published_revision_id`;
- `draft_revision_id`;
- companion `<entity>_revisions` tables;
- public reads follow published revisions;
- draft edits do not overwrite the published revision;
- preview follows the authenticated draft revision;
- publish is an atomic pointer swap.

`APP_FLOW.md` is consistent with that model for normal editorial content.

However, independent cross-document review found that **not every public-affecting mutable value is actually revision-isolated**. See `AS10-R008` below.

### AS10-R006 — RESOLVED

The read-only admin dashboard no longer assumes private editorial state can be obtained from the current static asset deployment.

`BUILD_PLAN.md`, `TECHNICAL_DESIGN.md`, and `APP_FLOW.md` consistently require a protected server-side editorial read substrate before draft/archived data can be shown to an authenticated dashboard.

### AS10-R007 — RESOLVED

The reviewed source citations now use the correct authoritative website-plan sections:

- §9 — `WEB-REQ-*`
- §10 — `ADM-REQ-*`
- §11 — `DESIGN-*`
- §13 — `WEB-SEC-*`
- §14 — `RISK-WEB-*`

The prior section-number errors in Technical Design, UI/UX, Data/Backend, and the handoff mapping are corrected.

## New findings from independent remediation review

### AS10-R008 — BLOCKER — publication isolation is incomplete for public-affecting base fields

The remediation introduces a good revision-pointer model, but several values that directly affect public output remain on the logical/base entity instead of inside the published/draft revision boundary.

Examples in `DATA_BACKEND_SPEC.md` include:

- `navigation.order`;
- `foundations.order`;
- `projects.order`;
- `projects.slug`;
- `services.order`;
- `process_steps.order`;
- `journal_entries.order` / `published_at`;
- entity-level `lifecycle_state` where it can affect visibility;
- `sections.order` and `sections.visible`, which are explicitly public design controls but have **no revision pair at all**.

This creates a contradiction with the stated invariant that public rendering follows only `published_revision_id` while drafts are isolated.

For example, changing an entity's `order` while editing a draft could change public ordering even though the published revision itself was not changed. Likewise, changing `sections.visible` or `sections.order` can alter the public site without going through the same draft/preview/publish boundary.

Required remediation:

- define the logical/base entity as identity + stable immutable metadata + revision pointers only;
- move every mutable public-affecting value into the revision record **or** explicitly define it as immutable after creation;
- specifically resolve ordering semantics for navigation/foundations/projects/services/process steps/journal;
- resolve slug semantics: either immutable stable identity, or revisioned with uniqueness validation at publish time;
- make section visibility/order revision-aware, either through `sections + section_revisions` or by folding those controls into an already revisioned settings entity;
- update `APP_FLOW.md` §2l so design-setting changes are staged as a draft/preview/publish operation rather than “persist and apply on next render” directly;
- ensure public rendering can be described truthfully as consuming only the published revision/state for all mutable public presentation values.

Exact SQL remains out of scope.

### AS10-R009 — REQUIRED — increment boundaries remain ambiguous around WEB-INC-005 and later feature increments

`WEB-INC-005` currently says its bounded scope is to:

> “stand up the D1-backed entities and revision tables in DATA_BACKEND_SPEC.md”

Taken literally, that includes future-only entities such as journal, theme settings, media/audit-related structures, while later increments `WEB-INC-004`, `006`, `007`, and `008` are separately defined to introduce those capabilities/data structures.

That weakens the claimed bounded-increment model and creates uncertainty over which increment actually owns each schema/table.

Required remediation:

- give every proposed target table/entity one clear owning `WEB-INC-*`;
- narrow `WEB-INC-005` to the storage/revision substrate and migration of **current** content domains needed for the protected read path and later mutation work;
- assign future-only schema to the increment that introduces that feature, unless a clearly justified shared-foundation table must exist earlier;
- make `WEB-INC-006` unambiguous about whether it creates `journal_entries/journal_entry_revisions` or merely adds behavior to tables already created elsewhere;
- make `WEB-INC-004` own media/R2 and its junction tables at the point their referenced entities exist;
- make `WEB-INC-008` independently reviewable: schema/append-only audit substrate may be reviewed before first mutation, while mutation-to-audit integration evidence belongs to the first mutation increment or an explicitly atomic combined release gate;
- preserve the topological sequence while making ownership non-overlapping.

### AS10-R010 — REQUIRED — Builder handoff provenance is factually inaccurate

The exact Git compare independently reports **7 changed files**.

But `coordination/IMPLEMENTER_HANDOFF.md` states:

> “Exactly 6 files”

and its “Exact changed-file list” omits `docs/product/DATA_BACKEND_SPEC.md`, even though that file contains the largest substantive remediation in this cycle and is present in the exact commit diff.

The user's summary correctly said seven; the durable Builder handoff does not.

Required remediation:

- correct the handoff to exactly 7 changed files;
- include `docs/product/DATA_BACKEND_SPEC.md` in the exact list;
- keep its evidence class `ACTOR_REPORTED`; the Architect's exact diff remains `INDEPENDENTLY_INSPECTED`.

This is a provenance correction, not a runtime/product failure.

## What remains independently PASS

The remediation continues to preserve:

- exact docs-only scope;
- no application/runtime/config/deployment change;
- brownfield truth labeling;
- one-document/one-concern ownership;
- source-of-truth precedence;
- Sentinel five-actor model;
- Website `PHASE 0..14` vs Sentinel `S0..S14` separation;
- `WEB-INC-*` namespace isolation;
- no hidden implementation authorization;
- Worker/D1/R2/auth/admin remain `PROPOSED TARGET / NOT IMPLEMENTED`;
- no S3, project onboarding, CI/rulesets, deployment, or main merge.

## Evidence disposition

Builder assertions remain `ACTOR_REPORTED`.

The Architect independently inspected the exact Builder diff and relevant repository artifacts. The dispositions in this review are therefore `INDEPENDENTLY_INSPECTED`.

No runtime behavior changed, so no runtime reproduction is claimed.

## Verdict

`ML-DEVOS-AS-010: CHANGES_REQUESTED — REMEDIATION CYCLE 2`

Remediation Cycle 1 successfully resolves `AS10-R001`, `R002`, `R003`, `R004`, `R006`, and `R007`, and materially improves `R005`.

The Product Build Pack is close to closure, but it should not become the implementation baseline until:

1. the revision boundary covers all mutable public-affecting state;
2. schema/table ownership across `WEB-INC-*` is unambiguous and bounded;
3. the durable Builder handoff accurately records the exact diff.

## Authorized Remediation Cycle 2 scope

Claude may modify only:

- `docs/product/TECHNICAL_DESIGN.md` if consistency wording is needed;
- `docs/product/UI_UX_SPEC.md` if design-state wording is needed;
- `docs/product/APP_FLOW.md`;
- `docs/product/DATA_BACKEND_SPEC.md`;
- `docs/product/BUILD_PLAN.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

`docs/product/PRD.md` should remain unchanged unless the new remediation exposes a genuine PRD-level contradiction.

No application/runtime/config/deployment/DevOS/brain/project-registry file is authorized for Builder modification.

## Explicit boundaries remain

- no `WEB-INC-*` implementation;
- no S3 proposal or implementation;
- no website/admin/backend runtime work;
- no D1/R2/API provisioning;
- no project onboarding;
- no project-registry population;
- no product `.devos/` overlay;
- no CI/workflows;
- no GitHub rulesets/branch protection;
- no deployment;
- no protected/main merge.

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Branch-head note

The exact Builder remediation under review is `ffec067...`.

Live branch HEAD is one later Architect-owned planning-record commit, `c5f1fc8...` (`D-022`). That later Decision Log change is separate from and does not contaminate this Builder-diff verdict.

## Current Architecture Sync status

`ML-DEVOS-AS-010: CHANGES_REQUESTED — CLAUDE REMEDIATION CYCLE 2`
