# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-010 — Product Build Pack Delivery Review / Remediation Cycle 1

Cycle: `MAISOGLABS-PRODUCT-BUILD-PACK`
Review mode: `POST-BUILD ARCHITECTURE SYNC / CROSS-ARTIFACT CONSISTENCY REVIEW`
Authority chain: `D-020 → D-021 → ML-DEVOS-AS-010`
Reviewed Builder commit: `da91051b0e7c2c228748ece25859b12a33fa1009`
Builder base: `ed1220f6127e70b67cfe52ac41461cc825866df3`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

## Required review discipline performed

Before issuing this verdict, the Architect:

1. pulled the live governance branch and current `coordination/STATE.md`;
2. read the current `ML-DEVOS-AS-010` constraints, `D-020`, and `D-021`;
3. inspected the exact Builder handoff commit `da91051...`;
4. independently compared `ed1220f... → da91051...`;
5. read all six Product Build Pack files in the exact Builder commit;
6. compared material claims against repository evidence including `docs/ARCHITECTURE.md`, `docs/CONTENT.md`, `package.json`, `wrangler.jsonc`, `lib/content/schema.mjs`, `lib/content/public.mjs`, `lib/content/local.mjs`, `app/page.js`, `brain/GOVERNANCE_MAP.md`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, Brand V3 artifacts, and Sentinel's role/change-governance records;
7. checked the output for scope drift, unsupported CURRENTLY IMPLEMENTED claims, phase-taxonomy collisions, hidden implementation authorization, data-model loss, and governance-routing contradictions.

## Exact Builder diff — PASS

GitHub compare `ed1220f6127e70b67cfe52ac41461cc825866df3 → da91051b0e7c2c228748ece25859b12a33fa1009` reports:

- exactly **1 Builder commit**;
- exactly **8 changed files**;
- 6 new Product Build Pack documents;
- 2 coordination files;
- no application/runtime/config/deployment/DevOS/project-registry file changed.

Changed files:

- `docs/product/PRD.md`
- `docs/product/TECHNICAL_DESIGN.md`
- `docs/product/UI_UX_SPEC.md`
- `docs/product/APP_FLOW.md`
- `docs/product/DATA_BACKEND_SPEC.md`
- `docs/product/BUILD_PLAN.md`
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

This is within `D-021` scope.

## Findings

### AS10-R001 — BLOCKER — Architect workflow omission discovered; Builder reproduced it correctly

The prior Architect constraint `AS10-F009` gave this future workflow:

`GROUND → SPECIFY → CLARIFY → ARCHITECT/CONSTITUTION CHECK → PLAN → CHECKLIST → TASKS → ANALYZE → BUILD → EVIDENCE → REVIEW → CONVERGENCE`.

The Builder reproduced that workflow exactly, as instructed.

However, independent comparison against the **active** Sentinel Change Governance Policy shows that the workflow omitted a load-bearing governance step before implementation:

`CLASSIFY → appropriate RFC/RULE/PROPOSAL → Architect Sync when required → Paulo gate when required`.

The active policy's target lifecycle is:

`IDEA → CLASSIFY → RFC/RULE/PROJECT PROPOSAL → ARCHITECT SYNC → REQUIRED PAULO GATE → AUTHORIZED → TASK CONTRACT → BUILD ...`

Therefore this is primarily an **Architect-origin defect in AS10-F009**, not Builder drift.

Required remediation:

- amend `BUILD_PLAN.md` so every future `WEB-INC-*` passes through Sentinel change classification before authorization;
- state that `PATCH`/`LOCAL_RULE` may use their lighter policy path, while `CORE_POLICY`, `CAPABILITY`, `ARCHITECTURE`, `CONSTITUTIONAL`, `WAIVER`, and `PROJECT_ONBOARDING` follow their required change records/gates;
- make clear that “Paulo names a WEB-INC ID” is **not by itself sufficient** where the active change class requires RFC/Architect Sync or another stronger route.

This correction must be treated as an explicit AS-010 amendment, not silently blamed on the Builder.

### AS10-R002 — BLOCKER — BUILD_PLAN is not actually dependency-ordered

`D-021` requires a dependency-ordered plan.

`BUILD_PLAN.md` says:

> “Ordered by dependency. An increment is listed here only if its prerequisites are also listed at or before it.”

But:

- `WEB-INC-003` is listed before `WEB-INC-005`;
- `WEB-INC-003` explicitly says it depends on `WEB-INC-005`;
- the Builder handoff itself discloses this as an unresolved sequencing question.

That contradicts the plan's own invariant and `D-021`.

Required remediation:

- make the candidate increment sequence topologically valid, or explicitly separate an unordered candidate catalog from a dependency-ordered execution sequence;
- if IDs are retained while display order changes, state clearly that IDs are stable identifiers, not chronology;
- resolve the storage prerequisite before any mutation increment is presented as build-ready.

### AS10-R003 — BLOCKER — proposed data model does not map all current content domains

`DATA_BACKEND_SPEC.md` correctly states that the current `data/site.js`/schema shape must remain representable without silent capability loss.

But the proposed target entities do not define a storage representation for several current schema domains, including:

- `foundations[]` — currently rendered;
- `process` / `process.steps[]` — currently rendered;
- `services[]` — currently validated and retained even though not rendered today.

The spec lists those current domains, then omits a target mapping for them.

This is incompatible with the migration requirement to preserve current content capability and with `RISK-WEB-015`.

Required remediation:

- add an explicit current→target migration mapping for **every** top-level/current structured content domain;
- either introduce typed target entities for foundations/services/process steps or explicitly define a validated typed representation under an existing entity;
- no free-form catch-all JSON may silently weaken current validation guarantees;
- identify any intentionally retired domain as a future explicit architecture/product decision, not an omission.

### AS10-R004 — REQUIRED — D1 relationship model must be structurally truthful

`DATA_BACKEND_SPEC.md` describes `media_ids[]` as “foreign keys into `media`.”

For a D1/SQLite relational target, an array value cannot itself provide ordinary database-enforced foreign-key integrity.

Required remediation:

- use explicit junction entities/tables such as `project_media` and `journal_media`, **or**
- explicitly label a JSON-array representation as application-enforced rather than a database foreign key.

The relationship diagram and migration notes must match whichever model is chosen.

### AS10-R005 — REQUIRED — draft/published coexistence semantics are under-specified

The proposed entities generally have a single `state: draft/published/archived` field.

That does not explain how an admin edits a currently published record as a draft **without removing or mutating the currently published version** before approval.

This matters to:

- `ADM-REQ-010` preview;
- `ADM-REQ-014` draft vs published;
- `WEB-REQ-001` availability;
- `WEB-REQ-008` public/admin separation;
- `RISK-WEB-003` data loss;
- `RISK-WEB-013` draft exposure.

Required remediation:

- specify the publication/revision model at design level;
- acceptable patterns include immutable revisions plus a published-version pointer, separate draft/published revisions, or another explicitly defined equivalent;
- public reads must continue using the last published revision while a new draft is edited;
- preview must read the authorized draft revision without making it public.

Exact SQL is not required in this docs-only cycle.

### AS10-R006 — REQUIRED — WEB-INC-002 secure read path is ambiguous

`WEB-INC-002` proposes an authenticated dashboard that lists published/draft/archived content from the current `data/site.js`-backed model before new storage exists.

The current production deployment is asset-only/static. The plan does not explain how that dashboard obtains non-public editorial state server-side without baking it into public static assets or otherwise adding a protected read path.

Required remediation:

- either move the dashboard after a protected server-side data-access substrate exists;
- or scope `WEB-INC-002` to published/public projection only;
- or explicitly define the protected read mechanism and classify the architecture/capability change it requires.

Do not imply that static source-backed draft/archived data automatically becomes safely available to an authenticated runtime dashboard.

### AS10-R007 — CORRECTION — several source-section citations are wrong

The authoritative website plan sections are:

- §9 — `WEB-REQ-*`;
- §10 — `ADM-REQ-*`;
- §11 — `DESIGN-*`;
- §13 — `WEB-SEC-*`;
- §14 — `RISK-WEB-*`.

Corrections required:

- `TECHNICAL_DESIGN.md` cites `WEB-SEC-*` as §11; it should be §13.
- `UI_UX_SPEC.md` cites `DESIGN-*` as §10; it should be §11.
- `DATA_BACKEND_SPEC.md` points readers to §§10–11 for `ADM-REQ-*`/`WEB-SEC-*`/`DESIGN-*`; it must include §13 for `WEB-SEC-*`.
- `coordination/IMPLEMENTER_HANDOFF.md` maps `ADM-REQ-*` to §9, `DESIGN-*` to §10, and `WEB-SEC-*` to §11; those must be corrected to §§10, 11, and 13 respectively.

This is a provenance/traceability correction, not a product-architecture rejection.

## What passed independently

The following parts of the Builder output are aligned and should be preserved unless remediation requires local edits:

- exact authorized file scope;
- brownfield/current-vs-target labeling discipline;
- one-document/one-concern ownership;
- six-level source-of-truth precedence;
- five-actor Sentinel role model for future work;
- legacy Website `PHASE 0..14` vs Sentinel `S0..S14` separation;
- `WEB-INC-*` namespace separation from Sentinel phases;
- explicit warning that frozen `ML-DEVOS-SIP-001` status rows are not live authorization;
- context-efficient references instead of wholesale governance duplication;
- Worker/D1/R2/auth/admin architecture consistently labeled `PROPOSED TARGET / NOT IMPLEMENTED`;
- no hidden runtime implementation, deployment, project onboarding, S3 work, or main merge.

## Evidence disposition

Builder-reported local checks remain `ACTOR_REPORTED`.

The Architect independently inspected the exact repository artifacts and exact commit diff. Scope, document contents, repository-source claims, and the findings above are therefore `INDEPENDENTLY_INSPECTED`.

No executable/runtime behavior was changed in this cycle, so `INDEPENDENTLY_REPRODUCED` runtime evidence is not required for this docs-only review.

## Verdict

`ML-DEVOS-AS-010: CHANGES_REQUESTED — REMEDIATION CYCLE 1`

The Product Build Pack is directionally aligned with Sentinel and contains no runtime/code scope drift, but it is **not yet Architect-approved** because the dependency ordering, governance-routing lifecycle, migration coverage, and data-contract issues above must be corrected.

This verdict does not revoke `D-021`. It returns the same documentation-only cycle to Claude for bounded remediation.

## Authorized remediation scope

Claude may modify only:

- `docs/product/PRD.md` if cross-document wording must change;
- `docs/product/TECHNICAL_DESIGN.md`;
- `docs/product/UI_UX_SPEC.md`;
- `docs/product/APP_FLOW.md` if publication/read-flow wording must change;
- `docs/product/DATA_BACKEND_SPEC.md`;
- `docs/product/BUILD_PLAN.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No application/runtime/config/deployment/DevOS/project-registry/brain file may be changed.

## Explicit boundaries remain

- no S3 proposal or implementation;
- no application/runtime code;
- no website/admin/backend implementation;
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

`ML-DEVOS-AS-010: CHANGES_REQUESTED — CLAUDE REMEDIATION CYCLE 1`
