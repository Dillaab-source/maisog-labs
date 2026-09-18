# Sentinel Versioning Policy

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel). Formalizes `ML-DEVOS-AS-003` "Versioning" and `D-012`'s versioning direction.

## Semantic version intent

- **PATCH** — clarification or non-breaking correction. Does not change what any rule requires or what any actor may do.
- **MINOR** — a backwards-compatible new subsystem or governance capability (e.g. adding a new template, a new rule class's tooling, a new specification) that does not change existing rules' meaning.
- **MAJOR** — a breaking constitutional or architecture-generation change (e.g. changing the actor model, changing the source-of-truth rule, changing what "frozen" means).

## The binding rule

**A version bump must never happen silently.** It is only ever applied as part of a recorded change: an RFC (for `MINOR`/`MAJOR`), an Architect Sync confirming compatibility or flagging a breaking change, an explicit Decision, and — once implemented — an ADR recording what changed and why. A `PATCH` may be recorded with a lighter version of this chain (per `../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1's `PATCH` row), but even a patch version number change must be an explicit, repository-recorded act, never inferred retroactively from "well, several small things changed."

Every material change should retain, at minimum: the RFC (if any), the Architect Sync, the Decision, the ADR, the effective version it produced, and what (if anything) it superseded.

## Current Sentinel version

The product name itself already establishes the current architecture generation: **MaisogLabs DevOS v1.2.0 — SENTINEL**.

**Corrected in remediation cycle 2 (S1-F007):** the prior text here claimed `devos/governance/rules/core-rules.json` records `effective_version: "1.2.0"` for *every* rule. That is no longer accurate and should not be read as ever having meant every rule regardless of origin. The registry now explicitly distinguishes two provenance groups (per `RULE_RECORD_SCHEMA.md`'s "Status/version consistency" section):

- **S0-origin rules** (`CORE-001`–`CORE-007`, `CORE-010`–`CORE-015` — thirteen rules extracted unweakened from the frozen S0 architecture) carry `status: "ACTIVE"` and `effective_version: "1.2.0"`, since their substance did not change between the S0 freeze and this S1 extraction — only their representation did.
- **S1-origin rules** (`CORE-008`, `CORE-009`, `CORE-016`, `CORE-017`, `CORE-018` — five rules genuinely introduced by `D-012`/`ML-DEVOS-AS-003` and this remediation's evidence-model split of `CORE-007`) carry `status: "PROPOSED"`, `effective_version: null`, and `proposed_effective_version: "1.3.0"`. They are not yet effective under any released version.

## S1's own version assessment — proposed, not applied

Per this cycle's explicit instruction to "identify any proposed version bump without applying it": introducing the Governance Kernel (change classes, rule registry, RFC/ADR/waiver system, Decision Packet, Governance Bundle spec) is a new, backwards-compatible governance **capability** — it does not change any existing constitutional rule's meaning, does not change the actor model, and does not change the source-of-truth rule. Under the scheme above, this would be assessed as a **MINOR** version bump, from `1.2.0` to a hypothetical `1.3.0`, once and if this S1 cycle is Architect-approved.

**This version bump is not applied in this commit.** `core-rules.json` still records `effective_version: "1.2.0"` only for the thirteen S0-origin rules and `null` for the five S1-origin rules, exactly as the status/version consistency rule requires — no rule anywhere in the registry declares itself effective at `1.3.0`. Applying a `1.3.0` designation to "the Sentinel architecture as a whole" is a decision for Paulo/the Architect to make explicitly at S1's closure — this document only supplies the assessment the versioning policy itself requires before that decision can be made, per the binding rule above ("never silently").

## S1 bootstrap transition into the RFC/ADR system (S1-F007, remediation cycle 2)

S1 itself was authorized, and is being remediated, **before** the RFC/ADR mechanism it defines existed as repository-committed process. Applying the ordinary `CORE_POLICY`/`ARCHITECTURE`-class change path retroactively to S1's own authorization would be incoherent — that path (RFC → Architect Sync → Decision → Implementation → ADR) is exactly what S1 is in the process of creating. This is disclosed explicitly, not silently treated as "S1 followed its own rules from the start":

- `brain/DECISION_LOG.md` `D-012` (Paulo's decision to adopt `ML-DEVOS-AS-003` and authorize the S1 Governance Kernel) and `ML-DEVOS-AS-003` itself (the Architect Sync defining the target change-governance architecture) are the **pre-RFC bootstrap authorization and design records** for S1. They stand in for the RFC/Architect-Sync steps that had no mechanism to exist in yet, exactly as `D-010`/`AS0-*` served the same bootstrap role for the S0 freeze.
- No ADR has been filed for the Governance Kernel as of this remediation cycle. `adr_id: null` on every rule in `core-rules.json` reflects this honestly — it is expected, not an omission to silently paper over.
- **Required at final S1 closure** (not performed in this remediation cycle): the repository must create the **first durable ADR** recording the Governance Kernel as adopted architecture — what was built, why, alternatives considered, and that it supersedes no prior ADR (since none existed before it) — and must explicitly record the `1.2.0 → 1.3.0` version transition as a repository-committed act, tying the ADR, the version bump, and the newly `ACTIVE` status of the S1-origin rules together in one recorded closure event. Until that closure ADR exists, S1 remains a candidate under Architect stage-gate review, not a completed governance cycle.

### The `CORE_POLICY` rules introduced by S1 are not self-activating

`CORE-016`, `CORE-017`, and `CORE-018` are themselves classified `CORE_POLICY` in their own `class` field. Per `CHANGE_GOVERNANCE_POLICY.md` §1's `CORE_POLICY` row, a `CORE_POLICY`-class change requires an Architect-reviewed proposal **and explicit Paulo authorization** — an Architect stage-gate `APPROVED` verdict alone is not that authorization. Concretely:

- the Architect's stage-gate approval of S1 (once granted) confirms these three rules are architecturally sound and internally consistent — it does **not**, by itself, activate them or apply the `1.3.0` version;
- activating `CORE-016`/`CORE-017`/`CORE-018` (flipping their `status` from `PROPOSED` to `ACTIVE` and their `effective_version` from `null` to `1.3.0`) requires a Paulo decision that either explicitly covers these exact candidate rules, or is newly issued at S1 closure for this exact purpose;
- this remediation cycle does not perform that activation, and does not treat the Architect's cycle-1 or cycle-2 review verdicts as if they already had — the class's own Paulo gate is a separate, later step from the Architect stage gate that precedes it.
