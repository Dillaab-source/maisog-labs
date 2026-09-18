# Sentinel Versioning Policy

Status: `ACTIVE` (S1 Governance Kernel — adopted `2026-09-18` per Paulo decision `D-013` and Architect Sync `ML-DEVOS-AS-004`'s final `ARCHITECT_APPROVED` verdict; see `ML-DEVOS-ADR-001`). Formalizes `ML-DEVOS-AS-003` "Versioning" and `D-012`'s versioning direction.

## Semantic version intent

- **PATCH** — clarification or non-breaking correction. Does not change what any rule requires or what any actor may do.
- **MINOR** — a backwards-compatible new subsystem or governance capability (e.g. adding a new template, a new rule class's tooling, a new specification) that does not change existing rules' meaning.
- **MAJOR** — a breaking constitutional or architecture-generation change (e.g. changing the actor model, changing the source-of-truth rule, changing what "frozen" means).

## The binding rule

**A version bump must never happen silently.** It is only ever applied as part of a recorded change: an RFC (for `MINOR`/`MAJOR`), an Architect Sync confirming compatibility or flagging a breaking change, an explicit Decision, and — once implemented — an ADR recording what changed and why. A `PATCH` may be recorded with a lighter version of this chain (per `../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1's `PATCH` row), but even a patch version number change must be an explicit, repository-recorded act, never inferred retroactively from "well, several small things changed."

Every material change should retain, at minimum: the RFC (if any), the Architect Sync, the Decision, the ADR, the effective version it produced, and what (if anything) it superseded.

## Current Sentinel version

**Sentinel's active governance-capability baseline is `v1.3.0`, as of `2026-09-18` (`D-013`, `ML-DEVOS-ADR-001`).** This is the version of the *Governance Kernel layer* S1 added — it is distinct from, and does not alter, the frozen S0 architecture document `devos/architecture/ML-DEVOS-ARCH-001.md`, whose own title/identity as **MaisogLabs DevOS v1.2.0 — SENTINEL** remains its permanent, unedited historical name. `v1.3.0` sits on top of that unchanged S0 baseline; it does not rewrite it.

`devos/governance/rules/core-rules.json` now records two provenance groups, both fully effective (per `RULE_RECORD_SCHEMA.md`'s "Status/version consistency" section):

- **S0-origin rules** (`CORE-001`–`CORE-007`, `CORE-010`–`CORE-015` — thirteen rules extracted unweakened from the frozen S0 architecture) carry `status: "ACTIVE"` and `effective_version: "1.2.0"`, unchanged by S1 closure — their substance never changed, only their representation.
- **S1-origin rules** (`CORE-008`, `CORE-009`, `CORE-016`, `CORE-017`, `CORE-018` — five rules genuinely introduced by `D-012`/`ML-DEVOS-AS-003` and the evidence-model split of `CORE-007`) now carry `status: "ACTIVE"`, `effective_version: "1.3.0"`, and `proposed_effective_version: null` — activated by `D-013`/`ML-DEVOS-ADR-001`. They are no longer merely proposed.

## S1's version assessment — applied at closure

Introducing the Governance Kernel (change classes, rule registry, RFC/ADR/waiver system, Decision Packet, Governance Bundle spec) was a new, backwards-compatible governance **capability** — it did not change any existing constitutional rule's meaning, the actor model, or the source-of-truth rule. Per the scheme above, this was assessed as a **MINOR** version bump, `1.2.0` → `1.3.0`.

**This version bump is now applied**, per `D-013` and `ML-DEVOS-ADR-001`, after the Architect's technical stage-gate approval (`ML-DEVOS-AS-004`, three remediation cycles resolving `S1-F001`…`S1-F009`) and Paulo's explicit activation decision — exactly the sequence the binding rule above requires ("never silently"): Architect Sync (compatibility confirmed across three cycles) → explicit Paulo Decision (`D-013`) → ADR (`ML-DEVOS-ADR-001`, recording what changed and why) → effective version (`1.3.0`, now recorded in `core-rules.json`).

## S1 bootstrap transition into the RFC/ADR system — CLOSED (`D-013`, `ML-DEVOS-ADR-001`)

S1 itself was authorized, and remediated across three cycles, **before** the RFC/ADR mechanism it defines existed as repository-committed process. Applying the ordinary `CORE_POLICY`/`ARCHITECTURE`-class change path retroactively to S1's own authorization would have been incoherent — that path (RFC → Architect Sync → Decision → Implementation → ADR) is exactly what S1 built. This was disclosed explicitly throughout remediation, not silently treated as "S1 followed its own rules from the start":

- `brain/DECISION_LOG.md` `D-012` (Paulo's decision to adopt `ML-DEVOS-AS-003` and authorize the S1 Governance Kernel) and `ML-DEVOS-AS-003` itself (the Architect Sync defining the target change-governance architecture) are the **pre-RFC bootstrap authorization and design records** for S1. They stand in for the RFC/Architect-Sync steps that had no mechanism to exist in yet, exactly as `D-010`/`AS0-*` served the same bootstrap role for the S0 freeze.
- The **first durable ADR**, `devos/changes/adrs/ML-DEVOS-ADR-001.md`, now exists, recording the Governance Kernel as adopted architecture — what was built, why, alternatives considered, and that it supersedes no prior ADR (since none existed before it) — and explicitly records the `1.2.0 → 1.3.0` version transition as a repository-committed act, tying the ADR, the version bump, and the newly `ACTIVE` status of the S1-origin rules together in one recorded closure event (`D-013`). S1 is now a completed governance cycle, not a candidate under Architect stage-gate review.
- A future material change to Sentinel governance follows the full path this ADR helps establish: RFC → Architect Sync → Decision → Implementation → ADR. This closure does not retroactively require one for S1's own bootstrap authorization, per the disclosure above.

### The `CORE_POLICY` rules introduced by S1 — activation closed

`CORE-016`, `CORE-017`, and `CORE-018` are themselves classified `CORE_POLICY` in their own `class` field. Per `CHANGE_GOVERNANCE_POLICY.md` §1's `CORE_POLICY` row, a `CORE_POLICY`-class change requires an Architect-reviewed proposal **and explicit Paulo authorization** — an Architect stage-gate `APPROVED` verdict alone was never that authorization, and did not by itself activate them. That gate has now been satisfied:

- the Architect's final stage-gate approval (`ML-DEVOS-AS-004`, `SENTINEL S1 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`) confirmed `CORE-016`/`CORE-017`/`CORE-018` are architecturally sound and internally consistent;
- Paulo then explicitly authorized their activation and the `1.3.0` version transition (`D-013`), naming these exact five rules;
- `core-rules.json` now reflects that activation: `status: "ACTIVE"`, `effective_version: "1.3.0"`, `proposed_effective_version: null`, `adr_id: "ML-DEVOS-ADR-001"` for all five S1-origin rules.

No later Sentinel phase (S2+) is authorized by this closure. `D-013` and `ML-DEVOS-ADR-001` are both explicit that S1 closure and any future S2 authorization are separate decisions.
