# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-010 — Product Build Pack Remediation Cycle 2 Verification

Cycle: `MAISOGLABS-PRODUCT-BUILD-PACK`
Review mode: `POST-REMEDIATION ARCHITECTURE SYNC / CROSS-ARTIFACT CONSISTENCY REVIEW`
Authority chain: `D-020 → D-021 → ML-DEVOS-AS-010`
Reviewed Builder remediation commit: `646ec537c3184650b44039a9dc5111b116cddb9a`
Builder remediation base: `00241a1bc6b72879e686b5e0e9b897bdc7726f81`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

## Review discipline performed

Before issuing this verdict, the Architect:

1. pulled the live governance branch and current `coordination/STATE.md`;
2. confirmed live HEAD is exactly Builder remediation commit `646ec537...`;
3. inspected the exact Builder handoff and prior Architect Sync;
4. independently compared `00241a1... → 646ec537...`;
5. read the remediated Product Build Pack artifacts from the exact Builder commit;
6. rechecked the previously resolved AS-010 findings for regression;
7. checked publication isolation across entity rows, revision rows, media relationships, and design settings;
8. checked table/entity ownership against the dependency-ordered `WEB-INC-*` plan;
9. checked the durable handoff's changed-file count against the exact Git diff;
10. checked for scope drift, hidden implementation authorization, S3 work, deployment, or main-merge authorization.

## Exact Builder remediation diff

GitHub compare `00241a1bc6b72879e686b5e0e9b897bdc7726f81 → 646ec537c3184650b44039a9dc5111b116cddb9a` reports:

- exactly **1 Builder commit**;
- exactly **7 changed files**:
  - `coordination/IMPLEMENTER_HANDOFF.md`
  - `coordination/STATE.md`
  - `docs/product/APP_FLOW.md`
  - `docs/product/BUILD_PLAN.md`
  - `docs/product/DATA_BACKEND_SPEC.md`
  - `docs/product/TECHNICAL_DESIGN.md`
  - `docs/product/UI_UX_SPEC.md`

No application/runtime/config/deployment/DevOS/brain/project-registry path changed.

`docs/product/PRD.md` remained untouched.

## Prior findings — independently verified

### AS10-R001 — RESOLVED / PRESERVED

Sentinel classification and authorization routing remains present before implementation.

### AS10-R002 — RESOLVED / PRESERVED

The stable-ID catalog remains separate from the dependency-ordered sequence:

`001 → 005 → 002 → 008 → 003 → 004 → 006 → 007`.

### AS10-R003 — RESOLVED / PRESERVED

Every current structured content domain remains explicitly mapped.

### AS10-R004 — RESOLVED / PRESERVED

Media relationships remain relational junction tables rather than an array falsely described as a database foreign key.

### AS10-R005 — RESOLVED FOR CORE EDITORIAL ENTITIES

The published/draft pointer model remains consistent for normal editorial entities and public published-only reads.

### AS10-R006 — RESOLVED / PRESERVED

The protected admin/editorial read path remains correctly dependent on a protected server-side substrate.

### AS10-R007 — RESOLVED / PRESERVED

Authoritative website-plan section references remain corrected.

### AS10-R008 — PARTIALLY RESOLVED; one remaining immutability gap

The remediation successfully fixes the main publication-isolation problems:

- base editorial entities now contain identity + immutable creation metadata + revision pointers;
- `order` moved into revision rows;
- `lifecycle_state` was removed;
- slug semantics are explicit and immutable after creation;
- `sections` now has `section_revisions`;
- theme/design changes now follow draft → preview → publish;
- project/journal media associations are keyed to the content revision rather than the base entity.

However, the new binding invariant says:

> every mutable value that can affect public presentation is sourced from published revision/state only.

The current target model still leaves two classes of public-affecting records without an explicit immutability rule:

1. **`media` rows** — `storage_key`, `content_type`, and especially `alt_text` are public-affecting values read through a published revision's media association, but the spec does not say they are immutable after upload. If a referenced `media` row is edited in place, public output can change without publishing a new project/journal revision.
2. **`project_media` / `journal_media` junction rows** — keying them to a revision is correct, but `role` and `order` are still mutable columns. If a junction row attached to the currently published revision is edited in place, the published output can change without a new publish operation.

Required final remediation:

- declare media asset records immutable after creation/upload for every public-affecting field, with replacements/alt-text changes creating a new media record (or introduce media revisions, if preferred);
- declare junction rows immutable association snapshots once attached to a revision;
- any attachment/reorder/role change must occur on the draft revision's own junction rows and become public only when that draft revision is published;
- make `APP_FLOW.md` / `DATA_BACKEND_SPEC.md` consistent with that rule;
- then the publication invariant will be literally true for the whole proposed public read graph.

No exact SQL is required.

### AS10-R009 — RESOLVED

`BUILD_PLAN.md` now provides a clear ownership matrix.

Independent review confirms the intended split is coherent:

- `WEB-INC-005` — current-content storage/revision substrate;
- `WEB-INC-008` — append-only audit substrate;
- `WEB-INC-003` — mutation behavior and audit-integration proof;
- `WEB-INC-004` — media + project-media schema/integration;
- `WEB-INC-006` — journal + journal-media;
- `WEB-INC-007` — theme/design settings.

The dependency order remains topologically valid.

### AS10-R010 — NOT FULLY RESOLVED — current handoff repeats the file-count defect

The remediation correctly repairs the **historical Cycle 1** count and explicitly records that the prior handoff's six-file statement was wrong.

But the new Cycle 2 handoff itself says:

> “Exactly 6 files”

under `Exact changed-file list (this cycle)`.

The exact Git compare independently shows **7 changed files**, because `coordination/STATE.md` was modified in the same commit.

The handoff then acknowledges that state was updated, but excluding it from an “exact changed-file list” still makes the count factually wrong.

Required final remediation:

- change the Cycle 2 exact changed-file count to **7**;
- include `coordination/STATE.md` in that exact list;
- retain the historical Cycle 1 correction;
- do not call a list “exact” while excluding a file present in the commit diff.

This remains a provenance issue, not a product/runtime failure.

## What independently passes

The following now pass and should not be reopened unless the final corrections require local consistency edits:

- documentation-only authorized scope;
- brownfield/current-vs-target truth discipline;
- source-of-truth precedence;
- one-document/one-concern ownership;
- five-actor Sentinel model;
- website vs Sentinel phase taxonomy separation;
- `WEB-INC-*` namespace isolation;
- governance routing before implementation;
- complete current-domain migration mapping;
- revision model for editorial content;
- section visibility/order revisioning;
- design-setting draft/preview/publish flow;
- table/entity ownership matrix;
- secure protected editorial read path;
- no unsupported implementation claims;
- no S3, project onboarding, CI/rulesets, deployment, or protected/main merge.

## Evidence disposition

Builder assertions remain `ACTOR_REPORTED`.

The Architect independently inspected the exact Git diff and relevant repository artifacts. This review is `INDEPENDENTLY_INSPECTED`.

No runtime behavior changed, so no runtime reproduction is claimed.

## Verdict

`ML-DEVOS-AS-010: CHANGES_REQUESTED — REMEDIATION CYCLE 3 (FINAL ALLOWED CYCLE)`

Cycle 2 resolves `AS10-R009` and the major body of `AS10-R008`, and correctly repairs the historical part of `AS10-R010`.

Two tightly bounded corrections remain:

1. close the media/junction immutability hole so the public-rendering invariant is truly end-to-end;
2. make the current Cycle 2 durable handoff's exact diff count truthful.

This is the final configured remediation cycle under `MAX_REMEDIATION_CYCLES: 3`.

## Authorized Remediation Cycle 3 scope

Claude may modify only:

- `docs/product/APP_FLOW.md` if needed for media/attachment publication wording;
- `docs/product/DATA_BACKEND_SPEC.md`;
- `docs/product/BUILD_PLAN.md` only if a local ownership/acceptance wording adjustment is required by the media immutability correction;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

`PRD.md`, `TECHNICAL_DESIGN.md`, and `UI_UX_SPEC.md` should remain unchanged unless the final correction exposes a direct contradiction.

No application/runtime/config/deployment/DevOS/brain/project-registry file may be changed.

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

## Current Architecture Sync status

`ML-DEVOS-AS-010: CHANGES_REQUESTED — CLAUDE REMEDIATION CYCLE 3 (FINAL)`
