# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

## S0 Final Architecture Freeze Review

Architecture: `ML-DEVOS-ARCH-001`
Plan: `ML-DEVOS-SIP-001`
Architecture Sync: `ML-DEVOS-AS-002`
Phase: `S0 — ARCHITECTURE FREEZE`

### Reviewed final remediation commit

`6e817add0e3b18d1612fcb86af96c2c269b6d58c`

The Architect independently compared the final remediation against `09b00172ec3951e3c085a534a59089b3917844d4`. The final Builder commit changes only:

- `devos/architecture/ML-DEVOS-ARCH-001.md` — one-line H1/title correction;
- `devos/handoffs/ML-DEVOS-S0-HANDOFF.md` — remediation note;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No application/runtime/deployment/configuration path changed.

### Finding closure

- `S0-F001` — RESOLVED. The premature `Frozen Architecture Specification` H1 was removed; the candidate correctly identified itself as a candidate until this approval.
- `S0-F002` — RESOLVED.
- `S0-F003` — RESOLVED.
- `S0-F004` — RESOLVED.
- `S0-F005` — RESOLVED.
- `S0-F006` — RESOLVED.
- `S0-F007` — RESOLVED.
- `S0-F008` — RESOLVED.

### S0 verdict

`SENTINEL S0 STAGE GATE: APPROVED`

The architecture content at `6e817add0e3b18d1612fcb86af96c2c269b6d58c` is approved as the S0 Sentinel architecture baseline. A post-approval documentation-only normalization may change the candidate status labels to `FROZEN (S0)` without changing architecture semantics.

From this approval onward, `Dillaab-source/maisog-labs` is the authoritative Sentinel source of truth under the bootstrap/source-of-truth rule. Conversation alone may not silently supersede committed Sentinel architecture.

No production deployment, protected-branch/main merge, or runtime/control-plane implementation is authorized by this S0 approval.

---

# ML-DEVOS-AS-003 — Future Change Governance Architecture Sync

## Purpose

Define how Sentinel itself may evolve after S0 without becoming immutable and without reverting to conversational or agent-defined governance.

## Constitutional principle

**Frozen does not mean immutable. Frozen means changes must be explicit, versioned, reviewed, attributable, and reversible where technically possible.**

**Project rules may extend or strengthen Sentinel core requirements, but may not silently weaken constitutional/core rules.**

## Change classes

Sentinel shall distinguish at least these change classes:

| Class | Typical example | Required path |
|---|---|---|
| `PATCH` | typo, broken reference, non-semantic clarification | review appropriate to affected artifact |
| `LOCAL_RULE` | project-specific operating rule | project overlay review |
| `CORE_POLICY` | retry ceiling, QA/evidence requirement | policy proposal + Architect review |
| `CAPABILITY` | new tool/API/write permission | capability + risk/permission review |
| `ARCHITECTURE` | new subsystem or cross-cutting design | RFC + Architect Sync + Paulo gate |
| `CONSTITUTIONAL` | actor authority, trust boundary, source-of-truth, delegation | RFC + Architect Sync + explicit Paulo approval |
| `WAIVER` | temporary exception | explicit scope, approver, reason, expiry |
| `PROJECT_ONBOARDING` | bring a new product/repository under Sentinel | project contract/overlay/onboarding review |

The classification determines required evidence and human gates. A low-risk patch must not require the same ceremony as an authority-boundary change.

## RFC / Decision / ADR separation

Sentinel shall keep these concepts distinct:

- **RFC** — what is proposed and why;
- **Architect Sync** — architecture compatibility, conflicts, risk, and required corrections;
- **Authorization / Decision** — whether the proposal is allowed to proceed;
- **Implementation** — what was actually changed;
- **ADR** — what became architecture, why, alternatives considered, consequences, version, and supersession history.

Accepted RFCs do not by themselves prove implementation. Rejected RFCs remain historical proposals, not architecture.

## Rule and policy representation

Core rules should progressively become machine-readable policy records while retaining human-readable rationale.

A rule record should be able to carry fields such as:

- stable rule ID;
- title and class;
- scope/project;
- risk class;
- status;
- authority owner;
- required Architect/Paulo gates;
- applicability conditions;
- required evidence;
- exception policy;
- source RFC/ADR;
- superseded rule;
- effective version.

Later implementation may package approved rules into versioned Governance Bundles with integrity/signature metadata and effective-from revision information. S1 may define the policy and manifest shape; signing/distribution/enforcement belong to later explicitly authorized phases.

## Decision Packet

Human approval for sensitive actions should bind to the actual proposed operation rather than only to an agent-authored summary.

A Decision Packet should be able to identify:

- decision/task/project IDs;
- requesting actor;
- exact action/tool/target;
- payload or payload hash;
- current state;
- expected state change;
- risk class;
- active policy/rule version;
- evidence references;
- rollback/compensation information where applicable;
- idempotency key where applicable;
- requested time;
- approver;
- decision and decision time.

The exact schema/validation mechanism belongs to later typed-contract work; the governance requirement is established here.

## Risk-based human gates

Sentinel shall avoid making Paulo a mandatory approver for every routine action.

- bounded low-risk actions may eventually proceed automatically only where Paulo has explicitly pre-authorized the policy and required evidence/gates pass;
- medium-risk handling is defined by policy/Task Contract;
- architecture, constitutional rules, security/trust-boundary changes, material risk acceptance, governance authority changes, and production deployment remain Paulo-gated unless Paulo explicitly changes that policy;
- no actor, model, rule engine, Evidence Gate, or capability may invent delegation authority.

## Capability changes

Adding a tool or connector does not grant universal authority to use it.

Capability onboarding must define, at minimum:

- which roles may invoke it;
- which projects/scopes it applies to;
- read/write/admin level;
- secret/credential requirements;
- sensitive operations requiring approval;
- evidence/audit requirements.

`Capability != Authority` remains binding.

## Project overlays

Projects may remain independent repositories and may carry their own `.devos/` overlays.

A project overlay may:

- add stricter project/domain requirements;
- add project-specific evidence gates;
- narrow capability permissions.

A project overlay may not silently weaken constitutional/core Sentinel rules. Any explicit weakening requires the same authority level as changing the core rule itself.

## Versioning

Sentinel architecture/governance should use semantic version intent:

- patch version — clarification/non-breaking correction;
- minor version — backwards-compatible subsystem/governance capability;
- major version — breaking constitutional/architecture generation change.

Every material change should preserve provenance such as source RFC, Architect Sync, decision/authorization, ADR, effective version, and superseded artifact/rule.

## Change lifecycle

Target lifecycle:

`IDEA → CLASSIFY → RFC/RULE/PROJECT PROPOSAL → ARCHITECT SYNC → REQUIRED PAULO GATE → AUTHORIZED → TASK CONTRACT → BUILD → QA → INDEPENDENT REVIEW → EVIDENCE GATE → MERGE/RELEASE → RUNTIME VERIFICATION (when applicable) → ADR/GOVERNANCE HISTORY`

The path is risk- and task-specific: irrelevant CI or runtime checks must not be demanded for documentation-only changes, while sensitive/runtime claims require evidence appropriate to those claims.

## Roadmap placement

This architecture is implemented progressively:

- **S1 Governance Kernel** — change classes, rule registry, RFC/ADR/waiver model, change-governance policy, bundle/Decision-Packet specifications;
- **S3 Typed Task Contracts** — typed schemas and validation for task/change/decision data;
- **S4 State Machine Kernel** — enforce lifecycle/state transitions;
- **S5 Capability & Permission Gateway** — enforce capability changes and scoped permissions;
- **S9 Independent Review & Evidence Gate** — enforce evidence/review acceptance;
- **S10 GitHub Enforcement** — platform-level protection from bypass.

## AS-003 verdict

`ARCHITECTURE COMPATIBILITY: PASS`

This change-governance model is compatible with `ML-DEVOS-ARCH-001` and strengthens its source-of-truth, bounded-delegation, evidence, and capability-vs-authority principles.

Implementation must still be explicitly authorized and scoped. No runtime enforcement is created by this Architect Sync alone.


---

# S1 Governance Kernel — Architect Stage-Gate Review

Status: `CHANGES_REQUESTED`

Architecture: `ML-DEVOS-ARCH-001`
Architecture Sync: `ML-DEVOS-AS-003`
Decision: `D-012`
Cycle: `SENTINEL-S1-GOVERNANCE-KERNEL`
Reviewed candidate commit: `28a110b532e202431b7371134943a5b7f385e62b`
Base: `396310b1dd9e5919233c0e720a835c50ee6c49f9`
Review mode: `STAGE GATE REVIEW / GOVERNANCE KERNEL`

## Independently verified

The candidate is one commit ahead of the S1 authorization base and changes only `devos/**` plus `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. No application/runtime/deployment/configuration path, CI workflow, GitHub ruleset, S0 architecture artifact, or website file changed. The commit is GitHub-signature verified.

The overall S1 direction is architecturally compatible with AS-003: change classes, RFC/ADR separation, static rule records, Decision Packets, capability/project templates, version policy, and a future Governance Bundle are all appropriate Governance Kernel concerns. The stage gate remains open because the machine-readable/static layer contains several contradictions that would become dangerous once later phases start consuming it.

## Findings

### S1-F001 — BLOCKER — rule registry authority fields contradict the change-class policy

`CHANGE_GOVERNANCE_POLICY.md` says `CORE_POLICY`, `ARCHITECTURE`, and `CONSTITUTIONAL` changes are Paulo-gated (constitutional explicitly), but `core-rules.yaml` contains weaker machine-readable authority metadata:

- `CORE-005` and `CORE-013`: `class: CONSTITUTIONAL`, but `paulo_approval_required: false`.
- `CORE-006` and `CORE-014`: `class: CORE_POLICY`, but `paulo_approval_required: false`.
- `CORE-015`: `class: ARCHITECTURE`, but `paulo_approval_required: false`.

There are also risk-tier inconsistencies (for example constitutional rules recorded as merely `high`, and an architecture rule as `medium`) despite the class matrix assigning stricter defaults.

**Required correction:** define and enforce class-level minimum authority/risk invariants. A rule record may be stricter than its class default, never weaker. The static validator must detect a record whose authority/risk metadata falls below the class policy.

### S1-F002 — BLOCKER — evidence metadata is not claim-specific and can deadlock the lifecycle

The frozen S0 model says evidence sufficiency is claim-specific. The candidate registry currently encodes several universal requirements that contradict that rule:

- `CORE-006` lists all five evidence classes as required for any status claim.
- `CORE-007` requires `RUNTIME_OBSERVED` whenever a change progresses through merge, deployment, or verification.
- `CORE-012` requires `CI_ATTESTED` **and** `RUNTIME_OBSERVED` when a protected-branch merge or production deployment is merely proposed. Runtime evidence cannot exist before deployment.
- `CORE-003` / `CORE-005` can be read as universally requiring independent reproduction even for documentation-only work.

**Required correction:** make the rule schema capable of expressing claim-/stage-specific evidence requirements. Do not encode `RUNTIME_OBSERVED` as a prerequisite for merge. Split lifecycle rules where necessary (merge eligibility, deployment authorization, post-deploy verification) and preserve `MAIN != DEPLOYED != VERIFIED`.

### S1-F003 — BLOCKER — waiver/exception policy can become a constitutional bypass

D-012 required an exception policy, but the rule schema has only an `exceptions: string[]` field and no explicit waivability policy. The WAIVER path currently allows a temporary exception against constitutional/architecture rules with approval, but does not encode which invariants are unwaivable or require authority equal to the target rule.

The waiver template also says the static validator enforces `expires_at`, but that validator scans rule-registry YAML under `devos/governance/rules/`; it does not validate waiver records filed under `devos/changes/waivers/`.

**Required correction:** add an explicit waiver/exception policy to rule records (for example `waivable`, required authority, maximum scope/duration, or an equivalent structured model). A waiver must never lower the authority required by the target rule, and some constitutional invariants should be marked unwaivable unless the constitution itself is changed through its full path. Either add a waiver schema/validator or state truthfully that waiver expiry is manual in S1.

### S1-F004 — BLOCKER — validator and schema are not actually equivalent

`validate-rules.mjs` explicitly uses a minimal custom YAML subset parser, not a YAML parser, yet the surrounding docs describe it as validating YAML/schema shape. It skips unsupported/continuation syntax and does not enforce several constraints present in `rule-record.schema.json` (nested required authority fields, formats, evidence enums, project/scope consistency, additional properties, etc.).

There is also a direct contradiction: the JSON Schema has `additionalProperties: false` and no `expires_at` property, while the validator requires `expires_at` for a `WAIVER`-class rule.

**Required correction:** make the machine-readable representation and validator fail-closed and mutually consistent. A clean option is to use JSON for the canonical registry so native `JSON.parse` can provide deterministic syntax validation, while keeping Markdown as human-readable policy. If YAML is retained, define a strict supported grammar and reject unsupported syntax rather than silently skipping it. Align all schema fields and semantic checks.

### S1-F005 — BLOCKER — project-overlay “narrowing” is defined in a way that can weaken core applicability

`PROJECT_ONBOARDING_SPEC.md` defines `narrows` as applying a core rule to a **smaller scope than the Sentinel-wide default**. That can reduce where a constitutional/core rule applies and therefore weaken it, despite CORE-009 saying project overlays cannot weaken core rules.

The RFC template also says affected constitutional/core rules must be “strengthening or clarifying, never weakening.” That is too absolute in the other direction: Sentinel is intentionally evolvable, so a fully authorized constitutional RFC may propose a substantive weakening/change; it simply cannot do so through a lower-authority path.

**Required correction:** overlays may narrow permissions/allowed actions or add stricter constraints, but may not shrink the applicability of Sentinel-wide constitutional/core rules. Any actual change in core-rule applicability or strength must use the target rule’s own change class and authority. Update the RFC template accordingly. Also correct the project-rules relative path in `PROJECT_ONBOARDING_SPEC.md` (`../../rules/` from the specifications directory does not point at `devos/governance/rules/`).

### S1-F006 — BLOCKER — Decision Packet schema/template are internally inconsistent and under-bind sensitive approvals

The Decision Packet concept is correct, but the static schema needs tightening:

- the template uses `decided_at: null`, while the JSON Schema allows only a date-time string if `decided_at` is present;
- `anyOf` allows both `payload` and `payload_hash`, even though the packet is intended to bind to one exact representation;
- a hash has no declared algorithm/format;
- `APPROVED` / `REJECTED` packets do not conditionally require `decided_at`;
- high/highest-risk packets may omit `evidence_refs`, even though evidence binding is part of the adopted Decision Packet requirement.

**Required correction:** make the template conform to the schema; use a mutually exclusive exact-payload vs. hashed-payload form (with hash algorithm metadata); conditionally require decision metadata after a decision; and define risk-appropriate minimum evidence binding. Keep idempotency conditional where execution semantics actually require it rather than pretending every manual packet already has runtime execution.

### S1-F007 — BLOCKER — provenance/version metadata conflates S0 rules with S1 rules

The registry header and handoff say all 15 rules are extracted from frozen S0, but at least `CORE-008` and `CORE-009` explicitly say they were introduced by `D-012 / ML-DEVOS-AS-003`, which occurred after the v1.2.0 S0 freeze.

Those post-S0 rules are also recorded as `ACTIVE` with `effective_version: "1.2.0"`, even though v1.2.0 is the already-frozen S0 baseline and the candidate itself correctly assesses the Governance Kernel as a future MINOR version.

**Required correction:** separate inherited S0 rules from S1-introduced rules in provenance/status/version metadata. The Architect accepts the semantic-version assessment: **if S1 closes successfully, the Governance Kernel should establish v1.3.0 as the new Sentinel governance/architecture capability baseline.** S0-origin rules remain effective from 1.2.0; rules introduced by D-012/AS-003 become effective with 1.3.0 (or remain explicitly proposed/pending until that closure). Do not rewrite S0 provenance.

### S1-F008 — REQUIRED — Architect Sync is still a rolling record instead of a durable per-change artifact

The new change model correctly treats RFC, Architect Sync, Decision, Implementation, and ADR as distinct records, but the candidate only creates durable homes/templates for RFCs, ADRs, and waivers. Architect Sync still points to the rolling `coordination/ARCHITECT_REVIEW.md`, which is overwritten/edited each cycle and therefore risks losing the very history the Governance Kernel is intended to preserve.

**Required correction:** define a durable per-change Architect Sync record/home/template (for example `devos/changes/architect-syncs/` plus a template). The rolling coordination file may remain a current-turn surface, but accepted syncs must have immutable/versioned repository artifacts. Preserve AS-003 durably rather than depending on a rolling file forever.

### S1-F009 — REQUIRED — handoff/bookkeeping corrections

The compare shows **22** new `devos/` files, not 21. Update the handoff/summary count.

The top-level state handed control to the Architect correctly, but `LAST_IMPLEMENTER_HANDOFF_SHA` still points to the prior S0 commit instead of `28a110b...`. This Architect state update corrects the SHA bookkeeping for the next cycle.

## Accepted without remediation

Preserve these parts:

- eight change classes as the top-level classification model;
- RFC / Architect Sync / Decision / Implementation / ADR separation;
- static Governance Kernel only — no runtime Policy/Task/Evidence/Capability engine in S1;
- Decision Packet concept and exact-operation approval principle;
- capability onboarding separated from authority;
- cross-repository project onboarding;
- Governance Bundle as specification only;
- versioning intent (patch/minor/major), with no silent version bump;
- no S0 constitutional weakening through a project-local path;
- no application/runtime/deployment/CI/ruleset changes in this candidate.

## Version disposition

`1.2.0 → 1.3.0 MINOR` is the correct version class **if and when S1 is approved**. Do not apply the bump during remediation. At final S1 closure, record the version change explicitly and set post-S0/S1-introduced rules to the appropriate effective version.

## Verdict

`SENTINEL S1 STAGE GATE: NOT APPROVED — CHANGES REQUESTED (CYCLE 1)`

The candidate has the right architecture and good separation of concerns, but the static machine-readable governance layer is not yet internally safe enough to become the foundation later engines consume.

## Authorized remediation scope

Claude may modify only S1 Governance Kernel artifacts under `devos/` plus `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md` to resolve S1-F001…S1-F009.

No S0 frozen architecture meaning may be changed. No runtime enforcement, CI/workflows, GitHub rulesets, website/admin work, project migration, protected-branch/main merge, production deployment, or S2+ work is authorized.

## Required next handoff

Claude must:

1. remediate S1-F001…S1-F009;
2. map each finding to exact changed files/sections;
3. compare against `28a110b532e202431b7371134943a5b7f385e62b`;
4. independently rerun the static validators it retains after remediation and report exactly what they validate and do **not** validate;
5. confirm only authorized S1 documentation/static-governance/coordination paths changed;
6. keep the proposed 1.3.0 bump unapplied until final Architect approval;
7. set `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `CURRENT_REMEDIATION_CYCLE: 1`;
8. keep `DEPLOY_AUTHORIZED: NO` and `MAIN_MERGE_AUTHORIZED: NO`;
9. stop for re-review.
