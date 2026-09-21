Status: `DURABLE RECORD` (archived in S1 remediation cycle 1, per finding S1-F008, from `coordination/ARCHITECT_REVIEW.md` as it read at the time this file was written — verbatim, not paraphrased)

Architect: ChatGPT
Cycle context: authorized as part of `brain/DECISION_LOG.md` `D-012`, adopting this sync as the basis for `S1 — Governance Kernel`.

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

## Archival note (added by this durable copy, not part of the original sync text above)

This is a verbatim archive of `ML-DEVOS-AS-003` as it appeared in `coordination/ARCHITECT_REVIEW.md` when this file was written during S1 remediation cycle 1 (finding `S1-F008`). `ML-DEVOS-AS-001` and `ML-DEVOS-AS-002`'s full original findings text is **not** archived here, because by the time this durable-archive mechanism was created, the rolling `coordination/ARCHITECT_REVIEW.md` file had already been overwritten by later cycles and no longer contained their full original text — only summary closure statements for `AS0-001`…`AS0-012`/`AS0-001A`/`S0-F001`…`S0-F008` remain live. Reconstructing them from this session's own conversational memory would violate the same "conversation cannot silently supersede the repository" principle (`CORE-011`) this archival mechanism exists to serve — a memory-based reconstruction is not independently verifiable against the current repository the way this file's contents (extracted from the current live file, at the time of extraction) are. This gap is disclosed, not silently left implicit, in this cycle's handoff.
