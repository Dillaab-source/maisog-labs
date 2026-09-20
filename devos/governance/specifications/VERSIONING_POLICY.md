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

**Sentinel's active governance-capability baseline is `v1.6.0`, as of `2026-09-21` (`D-046`, `ML-DEVOS-ADR-013`).** This is the version of the *DevOS Repository Foundation layer* S2 added on top of the Governance Kernel S1 closed at `v1.3.0` (`D-013`, `ML-DEVOS-ADR-001`) — it is distinct from, and does not alter, the frozen S0 architecture document `devos/architecture/ML-DEVOS-ARCH-001.md`, whose own title/identity as **MaisogLabs DevOS v1.2.0 — SENTINEL** remains its permanent, unedited historical name. Each Sentinel-capability version sits on top of the unchanged S0 baseline and the version(s) before it; none rewrites what came before. See "Coordinated v1.6.0 release — RFC-015 + S3 Typed Task Contracts applied" below for the full record of this latest transition, including the immediately preceding Skills Foundation V0.1 + Portable Knowledge Treasury closure, which remained effective at `v1.5.0` with an explicit no-bump disposition.

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

## S2 closure — v1.4.0 applied (`D-017`, `ML-DEVOS-ADR-002`)

S2 — DevOS Repository Foundation followed the same explicit, non-silent path this policy requires, this time with the RFC/ADR system S1 built already in place, not as a bootstrap exception:

- **RFC:** `ML-DEVOS-RFC-001` proposed the static foundation manifest, reserved subsystem-root boundaries, and empty project registry.
- **Architect Sync:** `ML-DEVOS-AS-006` reviewed the RFC (one remediation round: `S2-F001`…`S2-F007` resolved), then `ML-DEVOS-AS-007` reviewed the implementation at `c76bf6a`, passing all nine findings (`S2-I001`…`S2-I009`) with one disclosed, accepted validator limitation. Both are archived durably at `devos/changes/architect-syncs/`.
- **Decision:** `D-015` authorized the proposal process; `D-016` authorized implementation; `D-017` authorized closure and the version transition, after the Architect's technical stage-gate approval and explicit routing of the closure/activation decision to Paulo — the same `CORE_POLICY`-gate discipline established at S1 closure (Architect approval is never itself activation).
- **Implementation:** `c76bf6a6390581963d2ded2e5db18d96b4a346b4`.
- **ADR:** `devos/changes/adrs/ML-DEVOS-ADR-002.md`, the second durable ADR, records adoption of the S2 foundation and the `v1.3.0 → v1.4.0` transition.

At S2 closure, `devos/devos-manifest.json`'s `sentinel_capability_baseline` advanced in place to `version: "1.4.0"`, `adr: "ML-DEVOS-ADR-002"`, `decision: "D-017"` — updated from the S1-era values, since this field always tracks the *current* active baseline, not a history. It later advanced again to `version: "1.5.0"` under `D-028` / `ML-DEVOS-ADR-006` (see "Risk-escalation core-policy update — v1.5.0 applied" below); `1.4.0` is not the field's current value. The manifest's `closure_history` array is the append-only ledger of phase closures: it preserves this S2 `v1.4.0` event as its first entry (and does not backfill a fabricated S1 entry, since the manifest did not exist during S1's own closure — S1's closure remains recorded, unedited, in `D-013` and `ML-DEVOS-ADR-001`), followed by the later `v1.5.0` entry.

`ML-DEVOS-RFC-001` proposed no new `CORE-*` rule, so no rule in `devos/governance/rules/core-rules.json` changes status or `adr_id` at S2 closure — S2's closure is entirely a repository-foundation/manifest-level event, distinct from S1's rule-activation event.

No later Sentinel phase (S3+) is authorized by this closure. `D-017` and `ML-DEVOS-ADR-002` are both explicit that S2 closure and any future S3 authorization are separate decisions, exactly as `D-016` kept S2's own implementation authorization separate from its closure.


## Risk-escalation core-policy update — v1.5.0 applied

RFC-008 added three backwards-compatible Sentinel-wide CORE_POLICY rules:

- CORE-019 — Remote Resource Authority Must Be Explicitly Scoped
- CORE-020 — Evidence Sufficiency Escalates With Consequence
- CORE-021 — First Protected-Main / Production Operation Triggers Technical-Protection Review

The change followed:

`ML-DEVOS-RFC-008 → ML-DEVOS-AS-024 → D-028 → implementation → ML-DEVOS-AS-025 → ML-DEVOS-ADR-006`

Semantic impact: **MINOR**.

`v1.4.0 → v1.5.0`

This update adds governance policy only. It does not implement S3–S14, CI, rulesets, a Task/Policy Engine, Capability Gateway, sandbox, Orchestrator, executable Evidence Gate, credential broker, or telemetry pipeline.

The frozen S0 architecture identity remains:

`ML-DEVOS-ARCH-001 / v1.2.0`

## Skills Foundation V0.1 + Portable Knowledge Treasury closure — explicit no-bump, `v1.5.0` remains effective

MaisogLabs Skills Foundation V0.1 and the Portable Knowledge Treasury (`ML-DEVOS-RFC-014`) were independently accepted as implemented (`ML-DEVOS-AS-053`, `IMPLEMENTED / REPOSITORY-VERIFIED`) without, at that time, an explicit post-implementation version disposition or closure ADR — a governance-closure gap `ML-DEVOS-AS-056` (`AS56-F004`) identified. That gap is now closed by `ML-DEVOS-ADR-011`, `D-046`:

Semantic impact: **explicit NO SENTINEL CAPABILITY-BASELINE BUMP.**

Effective baseline immediately before, and unaffected by, this closure: `v1.5.0`.

Rationale: no `CORE-*` rule's meaning changed, no actor's authority changed, no trust boundary was granted or widened, and no remote/deploy/main authority changed. The four Skills are non-authoritative procedure wrappers and the Treasury is a manual routing/classification discipline over already-canonical records — the implementation operationalizes existing governance practice rather than changing Sentinel's constitutional/governance semantics, the same reasoning `SENTINEL-TRACEABILITY-V1`'s own no-bump closure used. `RISK-WEB-013` remains open and untouched.

This is an **explicit** no-bump decision, recorded here and in `ML-DEVOS-ADR-011`, not a silent omission.

## Coordinated `v1.6.0` release — RFC-015 + S3 Typed Task Contracts applied

`ML-DEVOS-RFC-015` (Reserved Subsystem Lifecycle and Closure Reconciliation) and `ML-DEVOS-RFC-013` (S3 Typed Task Contracts) are adopted together under **one coordinated Sentinel release boundary**, per `D-046`'s explicit single-release/multiple-ADR rule: **`one release != one ADR`.**

The change followed:

`ML-DEVOS-RFC-015 → ML-DEVOS-AS-057/058/059 → D-044 → D-045 → implementation → ML-DEVOS-AS-060 → ML-DEVOS-ADR-012`

and, co-released:

`ML-DEVOS-RFC-013 → ML-DEVOS-AS-038 → D-037 → implementation → ML-DEVOS-AS-053/054/055/056 → ML-DEVOS-ADR-013`

with the coordinated closure itself gated by `ML-DEVOS-AS-061`'s D.1 Pre-decision Closure Preflight (`PASS`) and authorized by `D-046`.

Semantic impact: **MINOR** for each capability independently (a new reserved-root lifecycle status/fail-closed linkage mechanism, and the first implemented Typed Task Contract mechanism, respectively — neither changes any existing rule's meaning or any actor's existing authority).

`v1.5.0 → v1.6.0`

**Separate ADR provenance, one release boundary:** `ML-DEVOS-ADR-012` (RFC-015) and `ML-DEVOS-ADR-013` (S3) are both independently effective at `v1.6.0` and both durably recorded in `devos/devos-manifest.json`'s `closure_history`. The manifest's single `sentinel_capability_baseline.adr` pointer names `ML-DEVOS-ADR-013` as the ordered, release-closing ADR of this boundary — this is a pointer-field convention, not a claim that `ML-DEVOS-ADR-012` is any less adopted or any less effective at `v1.6.0`.

This update adds governance policy/capability only. It does not implement S4–S14, CI, rulesets, a Task/Policy Engine, Capability Gateway, sandbox, Orchestrator, executable Evidence Gate, credential broker, or telemetry pipeline. `devos/contracts/`'s `executable_runtime_present` remains `false`. `manifest_version` remains exactly `"1"`, untouched by this transition.

The frozen S0 architecture identity remains:

`ML-DEVOS-ARCH-001 / v1.2.0`
