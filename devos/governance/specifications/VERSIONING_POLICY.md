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

The product name itself already establishes the current architecture generation: **MaisogLabs DevOS v1.2.0 — SENTINEL**. `devos/governance/rules/core-rules.yaml` records `effective_version: "1.2.0"` for every extracted S0 constitutional rule, since none of them changed meaning between S0's freeze and this S1 extraction — they are the same rules, now in a new representation.

## S1's own version assessment — proposed, not applied

Per this cycle's explicit instruction to "identify any proposed version bump without applying it": introducing the Governance Kernel (change classes, rule registry, RFC/ADR/waiver system, Decision Packet, Governance Bundle spec) is a new, backwards-compatible governance **capability** — it does not change any existing constitutional rule's meaning, does not change the actor model, and does not change the source-of-truth rule. Under the scheme above, this would be assessed as a **MINOR** version bump, from `1.2.0` to a hypothetical `1.3.0`, once and if this S1 cycle is Architect-approved.

**This version bump is not applied in this commit.** `core-rules.yaml` still records `effective_version: "1.2.0"` for every rule, because those rules did not change. Applying a `1.3.0` designation to "the Sentinel architecture as a whole" is a decision for Paulo/the Architect to make explicitly at S1's closure — this document only supplies the assessment the versioning policy itself requires before that decision can be made, per the binding rule above ("never silently").
