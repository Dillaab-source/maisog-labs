# Sentinel Change Governance Policy

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel). Formalizes `ML-DEVOS-AS-003` and `brain/DECISION_LOG.md` `D-012` into repository-owned policy. Companion to `../../architecture/ML-DEVOS-ARCH-001.md` (frozen S0 baseline) — this document governs how that baseline may change, not what it currently says.

**Constitutional principle carried from AS-003, verbatim in force:** *"Frozen does not mean immutable. Frozen means changes must be explicit, versioned, reviewed, attributable, and reversible where technically possible."* Project rules may extend or strengthen Sentinel core requirements; they may never silently weaken constitutional/core rules (`D-012` overlay rule).

## 1. Change classes

Every change to Sentinel governance, architecture, capabilities, or a project's relationship to Sentinel must be classified into exactly one of eight classes before it proceeds. The classification is not cosmetic — it mechanically determines everything in the table below.

| Class | Typical example | Authority required | Risk | Architect Sync required | Paulo gate required | Required evidence | Allowed delegation | Scope | Change record type |
|---|---|---|---|---|---|---|---|---|---|
| `PATCH` | Typo, broken reference, non-semantic clarification | Builder, reviewed | Low | No | No | `INDEPENDENTLY_INSPECTED` | May be bounded-pre-authorized by Paulo policy once one exists | Single artifact | Implementation note only — no RFC/ADR required |
| `LOCAL_RULE` | Project-specific operating rule that doesn't touch core | Project owner / Builder within project scope | Low–Medium | No (unless it touches a core rule's applicability) | No, unless it narrows a Paulo-gated action | `INDEPENDENTLY_INSPECTED`; `INDEPENDENTLY_REPRODUCED` if executable | Project-level, per project overlay policy | Single project | Project overlay change (see `../specifications/PROJECT_ONBOARDING_SPEC.md`) |
| `CORE_POLICY` | Retry ceiling, QA/evidence requirement | Architect-reviewed proposal, Paulo-authorized | Medium | **Yes** | **Yes** | `INDEPENDENTLY_INSPECTED` minimum; `INDEPENDENTLY_REPRODUCED`/`CI_ATTESTED` if the policy governs executable behavior | None invented; only what Paulo's policy explicitly pre-authorizes | Sentinel-wide or named projects | RFC → Architect Sync → Decision → ADR |
| `CAPABILITY` | New tool/API/write permission | Capability owner proposal, Architect risk/permission review, Paulo approval for sensitive operations | Medium–High | Yes, when it changes trust boundaries | **Yes**, for sensitive operations (per `../specifications/CAPABILITY_CHANGE_SPEC.md`) | `INDEPENDENTLY_INSPECTED` of the capability proposal; audit/evidence requirements per that spec | None invented; Capability ≠ Authority always applies | Named roles/projects | Capability-change proposal → Decision → (future) capability registry entry |
| `ARCHITECTURE` | New subsystem, cross-cutting design | RFC author, Architect Sync, Paulo gate | High | **Yes** | **Yes** | `INDEPENDENTLY_INSPECTED` of the RFC and ADR; runtime claims need stronger evidence per `EVIDENCE_PROVENANCE_MODEL.md` | None | Sentinel-wide | RFC → Architect Sync → Decision → Implementation → ADR |
| `CONSTITUTIONAL` | Actor authority, trust boundary, source-of-truth, delegation | RFC author, Architect Sync, **explicit** Paulo approval | Highest | **Yes** | **Yes, explicit and named** | `INDEPENDENTLY_INSPECTED` of the full RFC/ADR chain | **None — ever.** No actor or mechanism may invent constitutional delegation | Sentinel-wide, binds all projects | RFC → Architect Sync → explicit Decision → Implementation → ADR |
| `WAIVER` | Temporary exception to an existing rule | Explicit approver (Paulo, or Paulo-delegated per policy), scoped and time-boxed | Varies by waived rule | Only if waiving a `CONSTITUTIONAL`/`ARCHITECTURE`-class rule | Yes, for anything waiving a `CORE_POLICY` rule or stronger | Compensating-control evidence per `../../templates/WAIVER_TEMPLATE.md` | None beyond the waiver's own explicit terms | As scoped in the waiver | Waiver record (see `WAIVER_TEMPLATE.md`) — never silent |
| `PROJECT_ONBOARDING` | Bring a new product/repository under Sentinel | Project owner proposal, Architect review of overlay compatibility, Paulo approval to onboard | Medium | Yes | Yes | `INDEPENDENTLY_INSPECTED` of the project contract/overlay | None for onboarding itself; the project's own overlay may carry its own delegation policy, bounded by rule 2 below | The onboarding project only | Project-onboarding proposal → Decision → project `.devos/` overlay |

## 2. Two rules the table above cannot override

1. **No class ever grants an actor or mechanism the ability to invent its own authority or delegation.** A `PATCH` cannot escalate its own scope; a `WAIVER` cannot waive itself into a `CONSTITUTIONAL` change; an Evidence Gate passing does not become authorization by itself (`ML-DEVOS-ARCH-001` §5, Trust Boundary TB-6/TB-7).
2. **A weaker-scoped record can never silently override a stronger-scoped one.** A `LOCAL_RULE` or `PROJECT_ONBOARDING` overlay may strengthen or narrow what a `CORE_POLICY` or `CONSTITUTIONAL` rule permits within its own scope, but it may not contradict or weaken that rule's substance. Any genuine weakening of a constitutional/core rule requires going through that same rule's own class and authority level — i.e., a `CONSTITUTIONAL` change requires the full `CONSTITUTIONAL` path, never a project overlay quietly redefining it. (`D-012` overlay rule; `AS-003`.)

## 3. RFC / Architect Sync / Authorization / Implementation / ADR — kept distinct

These five records answer five different questions and must never be conflated (`ML-DEVOS-AS-003`):

| Record | Question it answers | Where it lives |
|---|---|---|
| **RFC** | What is being proposed, and why? | `../../changes/rfcs/` — see `../../templates/RFC_TEMPLATE.md` |
| **Architect Sync** | Is it architecturally compatible? What must be corrected? | `coordination/ARCHITECT_REVIEW.md` is the rolling, current-turn working surface. **`../../changes/architect-syncs/ML-DEVOS-AS-<NNN>.md` is the durable, immutable archive once a sync concludes (S1-F008)** — the rolling file alone is not sufficient long-term history, since it is overwritten each cycle. |
| **Authorization / Decision** | Is it allowed to proceed? | `brain/DECISION_LOG.md` (current bootstrap convention) |
| **Implementation** | What was actually changed? | The commit(s) themselves, cited by SHA in the handoff | 
| **ADR** | What became architecture, and why — with alternatives, consequences, and supersession history? | `../../changes/adrs/` — see `../../templates/ADR_TEMPLATE.md` |

**Binding rule:** an accepted RFC is never, by itself, evidence that implementation occurred. A rejected RFC remains a historical proposal, never architecture. An ADR is written only after implementation exists and has been reviewed — an ADR is not a design doc, it is a *record of what actually happened and why it was accepted*.

## 4. Change lifecycle (target, not yet enforced)

```
IDEA → CLASSIFY → RFC/RULE/PROJECT PROPOSAL → ARCHITECT SYNC → REQUIRED PAULO GATE →
AUTHORIZED → TASK CONTRACT → BUILD → QA → INDEPENDENT REVIEW → EVIDENCE GATE →
MERGE/RELEASE → RUNTIME VERIFICATION (when applicable) → ADR/GOVERNANCE HISTORY
```

**[REPO-VERIFIED: AS-003 "Change lifecycle"]** This is the target shape. As of S1, no Task Engine, Evidence Gate, or CI exists to enforce any transition mechanically — every step above is currently performed manually by the actors involved (Paulo, Architect, Builder), exactly as this Sentinel bootstrap itself has been conducted. The path is risk- and task-specific: a documentation-only `PATCH` does not need a CI or runtime-verification step it has no meaningful content for; a `CONSTITUTIONAL` change needs every step.

## 5. Versioning

See `../specifications/VERSIONING_POLICY.md` for the full policy. Summary: architecture/governance changes carry semantic version intent (patch/minor/major), but **no version bump happens silently** — it must be explicit, repository-recorded, and tied to the RFC/Sync/Decision/ADR chain that produced it. S1 does not bump the Sentinel architecture version; see the S1 handoff for the proposed-but-not-applied assessment.

## 6. Relationship to frozen S0 rules

The constitutional/core rules this policy exists to protect are extracted, unweakened, into `../rules/core-rules.json` (schema: `../registry/RULE_RECORD_SCHEMA.md`). This policy document is the human-readable law; that registry is its progressively machine-readable expression. Where the two ever appear to disagree, the frozen `ML-DEVOS-ARCH-001` document itself is authoritative over both, until a `CONSTITUTIONAL`-class change updates all three together.

## 7. What this policy does not do

Per `D-012`'s explicit S1 scope: this policy does not implement a Policy Engine, does not enforce anything at runtime, does not create CI or GitHub rulesets, and does not itself authorize any change — it only defines how a change *would* be classified and routed once actually proposed. No RFC, ADR, or waiver has been filed under this policy as part of S1; the registry, templates, and specifications exist so that the *next* proposed change — of any class — has a defined path to follow.
