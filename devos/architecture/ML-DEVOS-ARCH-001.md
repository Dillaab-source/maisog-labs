# ML-DEVOS-ARCH-001 — MaisogLabs DevOS v1.2.0 "SENTINEL" — Candidate Architecture Freeze

Status: `CANDIDATE FREEZE — PENDING ARCHITECT APPROVAL` — committed to the repurposed Sentinel monorepo. Only an Architect-approved version of this document may be labeled `FROZEN`. **[Remediates S0-F001: candidate documents must not call themselves frozen before approval]**

Authority chain: Paulo authorization → `brain/DECISION_LOG.md` `D-010` (original freeze authorization) → `D-011` (monorepo repurpose, superseding `D-010` K-1 only) → `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-001` findings `AS0-001`…`AS0-012`, amendment `AS0-001A`; `ML-DEVOS-AS-002` findings `S0-F001`…`S0-F008`) → `coordination/STATE.md` (`CYCLE_ID: SENTINEL-S0-ARCHITECTURE-FREEZE`, remediation cycle 1) → this document.

**Provenance disclosure, updated for remediation cycle 1:** the prior candidate (commit `2bd7263`) disclosed that several concepts — the task lifecycle, the memory sub-taxonomy, the named S0–S14 roadmap, and the full integration diagram — were `[CYCLE-SUPPLIED]` rather than independently reviewed. `coordination/ARCHITECT_REVIEW.md`'s `ML-DEVOS-AS-002` disposition has since **independently reviewed and accepted** those concepts as part of the Sentinel target architecture (subject to the S0-F001…S0-F008 corrections applied throughout this document), making `ML-DEVOS-AS-002` itself a durable, repository-visible Architect Sync record — the gap disclosed in the prior candidate is resolved. Tags below are updated accordingly: **[REPO-VERIFIED: AS0-002 disposition]** now covers everything the Architect's disposition explicitly accepted; **[CYCLE-SUPPLIED]** is retained only where this document still states detail (specific worked examples, specific prose) that the disposition accepted in substance but did not itself spell out verbatim. This document remains a **candidate**, not a frozen architecture, until this remediation cycle passes Architect re-review.

---

## 1. Purpose

SENTINEL is the cross-project governance and control-plane architecture for MaisogLabs DevOS. It lets AI implementers (Builders) do real engineering work across multiple MaisogLabs projects while keeping architecture, security, risk, deployment, and governance decisions under continuous human (Paulo) and independent-review (Architect) authority — with evidence, not agent assertion, moving state forward. **[REPO-VERIFIED: D-010]**

## 2. Repository topology — AMENDED (supersedes prior freeze)

**[REPO-VERIFIED: D-011, AS0-001A]** `Dillaab-source/maisog-labs` is now the canonical Sentinel/DevOS monorepo. The prior requirement for a separate `Dillaab-source/maisoglabs-devos` repository (`D-010` K-1, `AS0-001`) is superseded. This supersedes **K-1 and AS0-001 only** — every other K-2…K-7 decision and AS0-002…AS0-012 finding remains in force.

**Repurpose invariants (binding, not optional):**
1. Repurpose means a governance/repository-purpose conversion, **not** a destructive rewrite. **[REPO-VERIFIED: D-011]**
2. Existing website code, Git history, tests, content, deployment configuration, `brain/`, and `coordination/` remain intact and preserved during S0. **[REPO-VERIFIED: D-011, coordination/STATE.md "Explicitly prohibited"]**
3. No application/runtime file may be moved, deleted, or rewritten merely to make the repository look like a monorepo. **[REPO-VERIFIED: D-011]**
4. The repository is not "fully migrated to Sentinel" merely because S0 documents exist; website migration into any new structure is a later, separately authorized task. **[REPO-VERIFIED: AS0-001A repurpose invariant 4]**
5. `brain/` and `coordination/` remain bootstrap/legacy governance surfaces until an explicit later migration or retirement decision. **[REPO-VERIFIED: D-011]**
6. Sentinel's cross-project scope is **not** limited to projects that live inside this monorepo. `Dillaab-source/maisog-labs` is the Sentinel core monorepo and co-locates the current website during transition, but future products (e.g. those named in `D-010` K-2) may remain independent repositories, each with its own `.devos/` overlay, registered and governed by Sentinel without moving their application source here. **[Remediates S0-F006 — REPO-VERIFIED: AS0-002 disposition "preserving cross-repository project overlays"]**

See `../governance/REPOSITORY_OVERLAY_TOPOLOGY.md` for the full topology diagram, including the corrected cross-repository model.

## 3. Actors (five — not six)

**[REPO-VERIFIED: D-010 K-4, AS0-002]** Evidence Gate is a system mechanism, not a decision-authority actor. It cannot accept risk, invent scope, authorize deployment, or override Paulo. The actors are:

1. **Paulo** — Owner / final Product-Risk authority. Owns the merge/deployment authorization *policy*: protected-branch/main merge and production deployment remain Paulo-gated during the current bootstrap. Future low-risk merge automation may exist only if Paulo explicitly pre-authorizes it in policy **and** the required Evidence Gate/ruleset conditions pass — no actor or mechanism may invent its own delegation. The only actor who may define such bounded delegation (§9) or move a gate. **[REPO-VERIFIED: S0-F003 correction, reconciling human control with the bounded-delegation rule already accepted in AS0-012]**
2. **Architect** — owns requirements → design → architecture → risk → constraints. Has no Builder implementation authority and no deployment/merge authority — but may inspect evidence, independently reproduce checks when appropriate, and write architecture/review/governance records. This is itself an example of Capability ≠ Authority (§5): the Architect's capability to run or reproduce a check does not make it a Builder, and does not grant it deployment/merge authority. **[REPO-VERIFIED: AS0-007; S0-F007 correction — capability and authority were previously conflated by the phrase "no execution capability"]**
3. **Builder** (Claude, or any future implementer) — implementation within explicitly authorized scope only. Produces `ACTOR_REPORTED` evidence (§6). **Never self-certifies** approval of its own work. **[REPO-VERIFIED: established rule, restated in this cycle item 15]**
4. **QA** — independent/deterministic validation; executes checks itself rather than trusting the Builder's report of having done so. **[REPO-VERIFIED: D-010 K-4]**
5. **Independent Reviewer** — fresh-context, **post-implementation integration review**. Must not simply inherit the Builder's reasoning — it reviews the result, not the Builder's narrative of the result. Distinct from the Architect specifically by (a) timing (post-implementation vs. pre/during-design) and (b) having no prior conversational memory of how the change was built. **[REPO-VERIFIED: AS0-007; "must not inherit Builder reasoning" is CYCLE-SUPPLIED elaboration, consistent with but not verbatim in AS0-007]**

## 4. System mechanisms (not actors — cannot hold authority)

**[REPO-VERIFIED: D-010 K-4, AS0-002, AS0-008, AS0-009]**

- **Evidence Gate** — deterministic checkpoint; blocks (fail-closed) on failing evidence; cannot grant authority, accept risk, or invent/expand scope.
- **Policy Engine** — encodes the rules the Evidence Gate enforces. Policy changes are a governance action, not Builder-editable config.
- **Task Engine** — tracks requirement → design → implementation → test → evidence → status (§8) across projects.
- **Orchestrator** — dispatches work to actors. A scheduler; holds no approval authority.
- **Capability Registry / Gateway** — determines what CAN technically be done, as distinct from Governance, which determines what MAY be done (§5). **[CYCLE-SUPPLIED framing of "Governance = MAY / Capability = CAN"; the underlying separation itself is REPO-VERIFIED: AS0-008]**
- **CI** — executes QA's deterministic checks; produces `CI_ATTESTED` evidence.
- **GitHub Rules** (branch protection, required checks/reviews) — the technical backstop that would make enforcement real rather than procedural. **[REPO-VERIFIED: AS0-011 — "current GitHub technical enforcement is absent and remains a later-phase concern"]**

**Skills, MCP tools, GitHub, Cloudflare, n8n, shell, browser, and future APIs belong to the Capability subsystem, not Governance.** **[REPO-VERIFIED: D-010 "additional freeze corrections", AS0-008]**

## 5. Governance vs. Capability

**[REPO-VERIFIED: AS0-002 disposition — "Governance (MAY) separated from Capability (CAN)" explicitly accepted; the underlying separation itself traces further back to AS0-008]**

- **Governance determines what MAY be done** — the authorized-scope, role, and policy layer (Paulo, Architect, Policy Engine).
- **Capability Registry/Gateway determines what CAN technically be done** — the tool/credential/access layer.
- These are independent axes. An actor may have the *capability* to push to `main` while having no *governance* authority to do so (Trust Boundary TB-7, `../governance/TRUST_BOUNDARIES.md`). Neither axis substitutes for the other; a Capability Gateway restricting what a Builder can invoke does not by itself constitute governance review, and a governance policy permitting an action does not grant the technical capability to perform it if the Capability Gateway withholds it.

## 6. Evidence provenance model (provider-independent)

**[REPO-VERIFIED: D-010 "additional freeze corrections", AS0-003, AS0-002 disposition — provider-independent evidence taxonomy explicitly accepted]** Five classes, describing **provenance — how evidence was produced — not an absolute universal quality ranking**:

| Class | Definition | Example **[CYCLE-SUPPLIED examples, consistent with REPO-VERIFIED class definitions]** |
|---|---|---|
| `ACTOR_REPORTED` | An actor ran/observed something and reports the result; unchecked by anyone else. | Claude runs `npm test` and reports 27/27 passing. |
| `INDEPENDENTLY_INSPECTED` | A different actor examined the artifact itself without re-executing it. | Architect reads a diff or test-output log. |
| `INDEPENDENTLY_REPRODUCED` | A different actor/process re-ran the same check independently. | QA independently reruns the same test suite. |
| `CI_ATTESTED` | A deterministic, non-human CI system executed the check and recorded the result. | GitHub Actions runs the suite on a specific commit SHA. |
| `RUNTIME_OBSERVED` | Observed directly from an actual running/deployed system. | A production health check succeeds. |

**The Task Contract decides which evidence class is required for each claim** — not a blanket rule that every claim needs the strongest class. **[CYCLE-SUPPLIED — no Task Contract concept/mechanism exists yet; this is a forward-looking statement of intent, not a describable current mechanism]**

**Binding rules (REPO-VERIFIED, carried from D-010 and the website pilot):** never silently upgrade one class to another; code existence alone is never `VERIFIED` status; claims of `implemented`/`fixed`/`tested`/`secure`/`deployed`/`working`/`complete` require a cited evidence class.

## 7. Integration / Evidence-Gate order

**[REPO-VERIFIED base ordering: AS0-004, accepted further per AS0-002 disposition ("PR/required-check/reviewer evidence feeding a deterministic Evidence Gate"). The specific diagram layout (Evidence Packet, Paulo gate placement, post-merge Release Gate/Deployment/Runtime Verification stages) remains CYCLE-SUPPLIED presentation of an accepted concept.]**

The diagram below describes the **code/repository merge-task flow specifically** — see the corrected general rule beneath it for tasks (e.g. documentation-only) that have no meaningful CI check. **[Remediates S0-F005]**

```
Builder
  ↓
Git branch
  ↓
Pull Request
  ↓
CI / deterministic QA  +  Independent Reviewer
  ↓
Evidence Packet
  ↓
Evidence Gate
  ↓
merge eligibility
  ↓
Paulo gate (where policy requires it)
  ↓
MAIN
  ↓
Release Gate
  ↓
Deployment
  ↓
Runtime Verification
```

**For code/repository merge tasks**, the normal flow is: branch → PR → required CI/QA plus independent review → Evidence Gate → merge eligibility. The Evidence Gate consumes evidence that CI and the Independent Reviewer have already produced for that flow; it does not itself generate evidence.

**More generally, the Task Contract/policy (§6) defines what evidence a given task actually requires.** A documentation-only or governance task may have no meaningful CI check, and the Evidence Gate must not demand irrelevant CI for it. What the Gate must never do, for any task, is accept a bare Builder `ACTOR_REPORTED` claim where the Task Contract requires independent evidence — the binding constraint is "don't short-circuit *required* review," not "every task must pass through an identical CI-shaped pipeline." **[REPO-VERIFIED: S0-F005 correction]**

## 8. Traceability model (universal, carried forward)

```
Requirement → Design → Implementation → Test → Evidence → Status
```

Status vocabulary: `NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`. Code existence alone is never `VERIFIED`. **Evidence sufficiency for `VERIFIED` is claim-specific, not a fixed ranking** (§6–§7):

- documentation/architecture correctness may be established by `INDEPENDENTLY_INSPECTED` evidence;
- executable behavior normally requires `INDEPENDENTLY_REPRODUCED` and/or `CI_ATTESTED` evidence, as the Task Contract/policy defines;
- production behavior requires the relevant `RUNTIME_OBSERVED` evidence.

**[REPO-VERIFIED: S0-F004 correction — removes the prior generic "or stronger" ranking language, which contradicted §6's own provenance-not-ranking rule; base pattern proven in the website pilot's `brain/GOVERNANCE_MAP.md`]**

## 9. Bootstrap / source-of-truth rule (AMENDED)

See `../governance/BOOTSTRAP_SOURCE_OF_TRUTH.md` for the full normative statement. Summary: before a first approved S0 freeze baseline, bootstrap authority = Paulo authorization + approved Architect Sync + the S0 freeze documents. **After this freeze commit is independently Architect-approved, `Dillaab-source/maisog-labs` itself — not a separate repository — becomes the authoritative Sentinel source of truth** (`D-011`, superseding the prior `maisoglabs-devos`-as-source-of-truth statement). After that point, conversation alone must never silently supersede the repository architecture; changes require a recorded amendment/RFC/decision process, exactly as `D-011` itself was recorded before this cycle acted on it. **[REPO-VERIFIED: D-011 "Source of truth amendment"]**

Paulo may define bounded pre-authorization for low-risk work; Sentinel may never invent its own delegation authority; architecture, security-boundary changes, material risk acceptance, governance changes, and production deployment remain Paulo-gated unless Paulo explicitly defines a different policy. **[REPO-VERIFIED: D-010 "additional freeze corrections", AS0-012]**

This applies identically to merge authorization (§3): Paulo owns the policy; protected-branch/`main` merge is Paulo-gated during the current bootstrap; any future low-risk merge automation exists only via explicit Paulo pre-authorization in policy plus passing Evidence Gate/ruleset conditions. **[REPO-VERIFIED: S0-F003 correction]**

## 10. Intended lifecycle (conceptual target — NOT implemented in S0)

**[REPO-VERIFIED: AS0-002 disposition — "the conceptual task lifecycle and the constitutional distinction `MAIN != DEPLOYED != VERIFIED`" explicitly accepted as part of the Sentinel target architecture. The specific diagram layout below is the presentation of that accepted concept, not itself separately reviewed line-by-line.]**

```
CREATED
  ↓
PLANNING
  ↓
READY_FOR_BUILD
  ↓
BUILDING
  ↓
READY_FOR_QA
  ↓
QA
  ↓
READY_FOR_REVIEW
  ↓
REVIEW
  ├── CHANGES_REQUESTED → BUILDING
  ├── PAULO_DECISION_REQUIRED
  └── APPROVED
          ↓
      MERGE_READY
          ↓
        MERGED
          ↓
     RELEASE_READY
          ↓
       DEPLOYED
          ↓
       VERIFIED
```

**Exact implementation of this lifecycle belongs to later, separately authorized phases (see `ML-DEVOS-SIP-001` — the state-machine kernel is S4), not S0.** Freezing this diagram records intent; it does not create a Task Engine, does not bind any current code, and must not be cited as evidence that a state machine exists.

`MAIN ≠ DEPLOYED ≠ VERIFIED` — a commit reaching `MAIN` is not thereby `DEPLOYED`, and a `DEPLOYED` system is not thereby `VERIFIED` without `RUNTIME_OBSERVED` evidence (§6). **[REPO-VERIFIED — restated principle already established in this session's prior S0 review and consistent with the traceability model, §8]**

## 11. Memory boundaries

**[REPO-VERIFIED: D-010 "additional freeze corrections" — "Memory, task state, run history, and Evidence Store remain distinct" — and AS0-002 disposition, which explicitly accepted "the separation of Architectural Memory, Project Memory, Run History, Task Engine State, and Evidence Store" by this exact five-way split.]**

| Store | Contains |
|---|---|
| **Architectural Memory** | ADRs, decisions, supersession history |
| **Project Memory** | requirements, stable facts, risk history |
| **Run History** | agent/task execution, commands, failures, cost/timing |
| **Task Engine State** | locks, leases, current stage, owner, retries |
| **Evidence Store** | tests, CI attestations, artifacts, deployment proof, runtime observations |

**Task State is not generic memory. Evidence Store is not generic memory.** Each store answers a different question (what was decided vs. what is stably true about a project vs. what actually ran vs. what stage a task is currently in vs. what evidence backs a claim) and conflating them defeats the traceability model in §8 by making it impossible to tell, later, which kind of fact a given record actually is.

## 12. Known gaps (disclosed, not implemented in S0)

1. No technical enforcement of any trust boundary exists anywhere in this reviewed repository (`Dillaab-source/maisog-labs`) — see `../governance/TRUST_BOUNDARIES.md` TB-7.
2. No Capability Gateway, Policy Engine, Task Engine, Orchestrator, Evidence Gate, or CI exists as code anywhere in this reviewed repository; no other repository has been inspected. **[Remediates S0-F008 — scoped to inspected evidence, not a claim about every possible repository]**
3. ~~`ML-DEVOS-AS-002` is referenced but not inspectable~~ — **RESOLVED this cycle:** `ML-DEVOS-AS-002` is now a durable, repository-visible Architect Sync record in `coordination/ARCHITECT_REVIEW.md`, disposing of the concepts this document previously marked `[CYCLE-SUPPLIED]`. See the provenance disclosure at the top of this document.
4. The lifecycle diagram (§10) and memory sub-taxonomy (§11) are Architect-accepted as target architecture, but remain intent only — no schema, storage, or code implements either in this reviewed repository.
5. PUSAKAL and ClinicFlow (named in `D-010` K-2 as future Sentinel-governed projects) remain entirely unknown to this session — no repository, code, or architecture information for either has been inspected.
6. `SENTINEL-MIGRATION-DEBT-001` — the website's actual content-flow ordering (`../governance/REPOSITORY_OVERLAY_TOPOLOGY.md`) is recorded as migration debt, not resolved, in this cycle.
7. The remediation in this cycle (S0-F001…S0-F008) is itself `ACTOR_REPORTED` evidence (Claude's own diff and cross-reference checks) until the Architect independently inspects it — see `../handoffs/ML-DEVOS-S0-HANDOFF.md`.
