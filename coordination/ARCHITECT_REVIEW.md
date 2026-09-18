# Architect Review

Status: `ARCHITECT_APPROVED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-010 — Product Build Pack / Architect Output Consistency Sync

Cycle: `MAISOGLABS-PRODUCT-BUILD-PACK`
Review mode: `PRE-BUILD ARCHITECTURE SYNC / CROSS-ARTIFACT CONSISTENCY REVIEW`
Requested by: Paulo
Live branch reviewed: `governance/maisoglabs-v0.1`
Live branch head at review start: `597389e2771f4e09221434766d819bc2e4261a8a`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Current Builder authorization:
- `D-020` — Product Build Pack direction
- `D-021` — Product Build Pack documentation implementation only

## Scope

This sync reviews the Architect-owned outputs produced after S2 closure that materially affect the current Product Build Pack cycle:

- `ML-DEVOS-AS-009` final legacy-archive closure;
- `D-020` Product Build Pack direction;
- `D-021` Product Build Pack documentation authorization;
- the current `coordination/STATE.md` Builder handoff;
- the Product Build Pack structure and lifecycle previously communicated to Paulo.

Older S0/S1/S2 decisions are not reopened. They are used as constraints through the frozen architecture, active Governance Kernel, ADRs, current state, and source-of-truth rules.

No Builder-owned product document or runtime/application artifact is implemented by this sync.

## Repository evidence compared

The Architect independently inspected:

- `coordination/STATE.md`;
- `coordination/ARCHITECT_REVIEW.md`;
- `brain/DECISION_LOG.md`;
- `devos/architecture/ML-DEVOS-ARCH-001.md`;
- `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`;
- `devos/governance/rules/core-rules.json`;
- `devos/governance/ROLE_RESPONSIBILITY_MATRIX.md`;
- `devos/governance/BOOTSTRAP_SOURCE_OF_TRUTH.md`;
- `devos/governance/TRUST_BOUNDARIES.md`;
- `devos/governance/specifications/VERSIONING_POLICY.md`;
- `devos/plans/ML-DEVOS-SIP-001.md`;
- `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`;
- `brain/PROJECT_GOVERNANCE.md`.

## External research consulted

Fresh public research was used as design input, not as authority over Sentinel:

1. GitHub Spec Kit current SDD guidance:
   - https://github.com/github/spec-kit/blob/main/README.md
   - https://github.com/github/spec-kit/blob/main/docs/quickstart.md
   - https://github.github.com/spec-kit/reference/agentic-sdd.html
   - https://github.github.com/spec-kit/guides/existing-projects.html
   - https://github.github.com/spec-kit/guides/evolving-specs.html
2. Community discussions on SDD, drift, documentation bloat, and fresh-context review:
   - Reddit r/ClaudeCode discussions on spec-driven development and documentation drift;
   - Hacker News discussions on AI SDLC scaffolds, lean specs, context-window discipline, and drift checking.

The recurring external pattern is compatible with Sentinel: ground against repository reality, separate intent from implementation, resolve ambiguity before planning, break work into dependency-ordered increments, analyze cross-artifact consistency before build, independently review output, and close the loop by checking implementation against the spec.

## Findings

### AS10-F001 — PASS — role and authority separation is preserved

`D-021` authorizes documentation/specification work only and explicitly prohibits application/runtime implementation, backend provisioning, S3 work, deployment, and main merge.

That is compatible with:

- TB-2 Builder execution boundary;
- TB-3 Architect review boundary;
- CORE-001 human authority;
- CORE-002 Capability != Authority;
- CORE-003 Builder cannot self-certify.

The Architect remains review/design authority only. Claude remains Builder.

### AS10-F002 — REQUIRED INTERPRETATION — classify the Product Build Pack as project-local documentation/process, not Sentinel architecture

The Product Build Pack itself does not change the Sentinel constitution, actor model, trust boundaries, core policy, version, or DevOS subsystem topology.

For the current cycle, the change is classified as:

`LOCAL_RULE — legacy MaisogLabs website project documentation/process layer`

This classification covers the project-specific working convention:

`Product Spec → consistency check → acceptance criteria → bounded work → evidence → review`.

It does **not** constitute formal Sentinel project onboarding and does not create a `.devos/` overlay.

If a Product Build Pack document later attempts to change Sentinel core, Sentinel trust boundaries, the website's relationship to Sentinel, or another higher-authority rule, that proposed change must stop and route through the stronger class required by `CHANGE_GOVERNANCE_POLICY.md`.

No Sentinel version bump is produced by this documentation-only Product Build Pack cycle.

### AS10-F003 — REQUIRED — brownfield truth must outrank retroactive specification

MaisogLabs is an existing codebase.

The Product Build Pack must not pretend that newly authored documents retroactively define every existing behavior.

Every material statement must be distinguishable as one of:

- `CURRENTLY IMPLEMENTED` — supported by repository evidence;
- `CURRENTLY PLANNED` / `PROPOSED TARGET` — design intent only;
- `NOT IMPLEMENTED`;
- `FUTURE OPTION`.

The current codebase remains implementation evidence. The pack defines current product intent and future target direction; it does not erase repository reality.

This matches GitHub Spec Kit's current brownfield guidance: adopt against an existing reviewable baseline and use the workflow for bounded changes rather than recreating the whole existing system from invented specs.

### AS10-F004 — REQUIRED — one owner per kind of truth

To prevent duplication and spec drift, each Product Build Pack document owns one concern:

- `PRD.md` — WHAT / WHY: goals, personas, requirements, non-goals, acceptance outcomes;
- `TECHNICAL_DESIGN.md` — HOW candidate: architecture/design approach and constraints;
- `UI_UX_SPEC.md` — interaction/visual/accessibility rules, referencing Brand V3;
- `APP_FLOW.md` — user/admin states, transitions, failure paths, authorization flows;
- `DATA_BACKEND_SPEC.md` — proposed data/API/storage contracts and migration constraints;
- `BUILD_PLAN.md` — dependency-ordered future implementation increments only.

Downstream files must reference requirement IDs and source sections instead of copying requirement prose.

No Product Build Pack document may redefine Sentinel governance, evidence classes, actors, or authority.

### AS10-F005 — REQUIRED — explicit source-of-truth precedence

The Product Build Pack must state this precedence:

1. Frozen Sentinel Architecture + active Governance Kernel + Decisions/ADRs + current durable Architect Syncs/current state;
2. approved website/product governance decisions and current repository evidence;
3. Brand/design/content-schema artifacts within their existing domains;
4. Product Build Pack current-intent documents;
5. derived build tasks/increments;
6. conversation or agent narrative.

A lower item may clarify or derive from a higher item but may not silently contradict it.

### AS10-F006 — REQUIRED — resolve the legacy role-model collision by precedence, not rewriting history

`brain/PROJECT_GOVERNANCE.md` is a legacy website-pilot artifact that still combines `Architect / Independent Reviewer` into one role.

Current Sentinel architecture explicitly defines five actors and separates:

- Architect;
- Builder;
- QA;
- Independent Reviewer;
- Paulo.

Product Build Pack documents must use the current five-actor Sentinel model when describing future governed work.

They may cite the legacy three-role website pilot only as historical/current-pilot context and must not copy it forward as the universal target role model.

Do not rewrite the legacy file in this cycle.

### AS10-F007 — REQUIRED — distinguish the two phase taxonomies

Two unrelated numbered roadmaps exist:

- the legacy Website Governance/Admin Plan has `PHASE 0 ... PHASE 14`;
- Sentinel has `S0 ... S14`.

They must never be merged or treated as the same lifecycle.

`BUILD_PLAN.md` must use a separate product-increment namespace, for example:

- `WEB-INC-001`
- `WEB-INC-002`

or another clearly non-Sentinel naming scheme.

Do not use `S3`, `S4`, etc. for website implementation increments.

### AS10-F008 — REQUIRED — do not treat the frozen S0 roadmap status column as live phase state

`ML-DEVOS-SIP-001.md` is a frozen S0 roadmap baseline. Its original phase-status table is historical architecture intent, not the live execution-state authority after later closures.

For live state, use:

- `coordination/STATE.md`;
- closure Decisions/ADRs;
- current durable Architect Syncs;
- active manifest/version records.

The Product Build Pack may reference the roadmap for phase names/intended outcomes, but must not infer current phase authorization from its old `NOT STARTED` rows.

### AS10-F009 — REQUIRED — strengthen the future spec-to-build lifecycle with clarification, consistency analysis, and convergence

The earlier lifecycle is directionally correct but can be improved using the current external evidence.

The future product workflow encoded in `BUILD_PLAN.md` should be:

```text
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

These are process stages, not new authority actors.

They do not authorize implementation by themselves.

### AS10-F010 — REQUIRED — traceability must use stable IDs, not duplicated prose

Reuse existing requirement IDs wherever they already exist:

- `WEB-REQ-*`;
- `ADM-REQ-*`;
- `WEB-SEC-*`;
- `DESIGN-*`;
- existing test/risk IDs.

When the pack genuinely needs a new requirement, give it a stable ID and identify the owning document.

`APP_FLOW.md`, `DATA_BACKEND_SPEC.md`, and `BUILD_PLAN.md` should reference those IDs.

Future build tasks should trace:

`Requirement ID → design section → task/increment → test/evidence → review status`.

This is compatible with Sentinel's existing:

`Requirement → Design → Implementation → Test → Evidence → Status`.

### AS10-F011 — REQUIRED — documentation must be context-efficient

External community feedback repeatedly flags documentation bloat and context rot as failure modes.

Therefore:

- do not paste full Sentinel governance text into product documents;
- use short summaries plus repository links/paths;
- avoid recording every agent action in the Product Build Pack;
- keep durable decisions in Decision Log/ADR/Architect Sync, not duplicated in all six files;
- keep the Product Build Pack focused on current product intent and target design;
- let Git preserve document history.

The pack should act as a navigable context layer, not a second copy of the repository's governance corpus.

### AS10-F012 — REQUIRED — target backend/UI architecture remains proposed until separately adopted

`TECHNICAL_DESIGN.md` and `DATA_BACKEND_SPEC.md` may describe a future Worker/D1/R2/auth/audit design because the existing website governance plan already records that as a preferred direction if compatible.

But the pack must label that architecture `PROPOSED TARGET / NOT IMPLEMENTED`.

Creating these documents does not:

- provision D1/R2;
- create APIs;
- implement authentication;
- activate an admin portal;
- migrate current static content;
- authorize a future implementation increment.

A future implementation still needs its own bounded authorization and review.

### AS10-F013 — PASS — Product Build Pack direction is useful if it remains a consolidation layer

The six-document structure is compatible with Sentinel **only because** it is not another governance system.

Its job is to compress product intent into a usable working context while Sentinel continues to own:

- authority;
- scope gates;
- evidence;
- change classification;
- independent review;
- architecture/governance history.

That separation should remain explicit.

## External research synthesis

The web/forum research points to four practical solutions that Sentinel should adopt for this product layer:

1. **Ground first.** Verify references against the repository or label them new/proposed; do not let an agent invent endpoints/tables/capabilities.
2. **Use bounded, dependency-ordered increments.** Large one-shot implementations increase context drift; small independently reviewable slices are safer.
3. **Analyze before and after build.** Check spec/plan/task consistency before implementation, then compare the resulting code back against intent after implementation.
4. **Keep context lean.** Stable architecture/governance stays in canonical files; feature/product docs reference it instead of duplicating it.

These are consistent with Sentinel rather than replacements for Sentinel.

## Verdict

`ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK MAY PROCEED WITH REQUIRED GUARDRAILS`

No new Paulo decision is required to continue the already-authorized documentation-only Builder cycle.

The Builder must read this sync before creating the Product Build Pack and treat AS10-F003 through AS10-F012 as binding acceptance constraints for the documentation handoff.

## Explicit boundaries remain

- no S3 proposal or implementation;
- no application/runtime code changes;
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

`ML-DEVOS-AS-010: ARCHITECT_APPROVED — ACTIVE BUILD CONSTRAINTS FOR D-021`
