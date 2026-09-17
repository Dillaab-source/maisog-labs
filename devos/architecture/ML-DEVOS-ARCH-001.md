# ML-DEVOS-ARCH-001 — MaisogLabs DevOS v1.2.0 "SENTINEL" — Frozen Architecture Specification

Status: `FROZEN (S0)` — committed to the repurposed Sentinel monorepo, pending independent Architect review of this exact commit.

Authority chain: Paulo authorization → `brain/DECISION_LOG.md` `D-010` (original freeze authorization) → `D-011` (monorepo repurpose, superseding `D-010` K-1 only) → `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-001` findings `AS0-001`…`AS0-012`, amendment `AS0-001A`) → `coordination/STATE.md` (`CYCLE_ID: SENTINEL-S0-ARCHITECTURE-FREEZE`) → this document.

**Provenance disclosure (read before trusting any single line of this document):** this cycle's authorizing instruction references a "Latest Architecture Sync: `ML-DEVOS-AS-002`" and specifies substantially more architectural detail than `D-010`/`D-011`/`AS0-001`…`AS0-012` contain verbatim — specifically the full lifecycle state diagram (§10), the detailed memory-boundary sub-taxonomy (§11), the named S0–S14 roadmap phases and Alpha/Beta/RC1 milestones (`ML-DEVOS-SIP-001`), and the fully drawn integration/Evidence-Gate order (§7). A repository-wide search at commit `ad4cd84` found **no file containing `ML-DEVOS-AS-002` or this level of detail** — only the two-sync-old `AS0-001`…`AS0-012` findings and the `AS0-001A` amendment are present as committed, independently-reviewable Architect Sync content. This document freezes the detail as instructed, because producing it is this cycle's authorized work, but every item below is marked either **[REPO-VERIFIED]** (traceable to a specific `D-010`/`D-011`/`AS0-00x` citation) or **[CYCLE-SUPPLIED]** (introduced by this cycle's authorizing instruction only, not yet independently found in any committed Architect Sync record). This mirrors, and does not repeat, the earlier disclosed gap over `ML-DEVOS-AS-001` itself — that one has since been resolved by `AS0-001`…`AS0-012` actually landing in `coordination/ARCHITECT_REVIEW.md`; this document flags the same kind of gap now existing one cycle later, for the same reason: repository state, not conversation, is the source of truth, and the Architect should know exactly which of these lines it is being asked to independently confirm versus already has.

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

See `../governance/REPOSITORY_OVERLAY_TOPOLOGY.md` for the full topology diagram.

## 3. Actors (five — not six)

**[REPO-VERIFIED: D-010 K-4, AS0-002]** Evidence Gate is a system mechanism, not a decision-authority actor. It cannot accept risk, invent scope, authorize deployment, or override Paulo. The actors are:

1. **Paulo** — Owner / final Product-Risk authority. Approves scope, phase transitions, accepted risk, deployment, and merges. The only actor who may authorize bounded delegation (§9) or move a gate. **[REPO-VERIFIED]**
2. **Architect** — owns requirements → design → architecture → risk → constraints. Independent review, no execution capability, no self-approval, no deployment/merge authority. **[REPO-VERIFIED: AS0-007]**
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

**[CYCLE-SUPPLIED framing, consistent with REPO-VERIFIED AS0-008 separation]**

- **Governance determines what MAY be done** — the authorized-scope, role, and policy layer (Paulo, Architect, Policy Engine).
- **Capability Registry/Gateway determines what CAN technically be done** — the tool/credential/access layer.
- These are independent axes. An actor may have the *capability* to push to `main` while having no *governance* authority to do so (Trust Boundary TB-7, `../governance/TRUST_BOUNDARIES.md`). Neither axis substitutes for the other; a Capability Gateway restricting what a Builder can invoke does not by itself constitute governance review, and a governance policy permitting an action does not grant the technical capability to perform it if the Capability Gateway withholds it.

## 6. Evidence provenance model (provider-independent)

**[REPO-VERIFIED: D-010 "additional freeze corrections", AS0-003]** Five classes, describing **provenance — how evidence was produced — not an absolute universal quality ranking**:

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

**[REPO-VERIFIED base ordering: AS0-004 — "Git branch/PR plus CI and independent review produce evidence; the Evidence Gate consumes that evidence before merge eligibility." CYCLE-SUPPLIED: the fully elaborated diagram below, including Evidence Packet, Paulo gate placement, and the post-merge Release Gate/Deployment/Runtime Verification stages, which AS0-004 does not spell out to this level of detail.]**

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

**The Evidence Gate never occurs before PR/CI evidence exists.** It consumes evidence that CI and the Independent Reviewer have already produced; it does not itself generate evidence, and it cannot be checked before there is a Pull Request for it to gate. This ordering constraint is explicit specifically to prevent a future implementation from short-circuiting review by gating on a Builder's own `ACTOR_REPORTED` claim alone.

## 8. Traceability model (universal, carried forward)

```
Requirement → Design → Implementation → Test → Evidence → Status
```

Status vocabulary: `NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`. Code existence alone is never `VERIFIED`; reaching `VERIFIED` requires `INDEPENDENTLY_REPRODUCED` or stronger evidence (§6). **[REPO-VERIFIED — proven pattern from the website pilot's `brain/GOVERNANCE_MAP.md`]**

## 9. Bootstrap / source-of-truth rule (AMENDED)

See `../governance/BOOTSTRAP_SOURCE_OF_TRUTH.md` for the full normative statement. Summary: before a first approved S0 freeze baseline, bootstrap authority = Paulo authorization + approved Architect Sync + the S0 freeze documents. **After this freeze commit is independently Architect-approved, `Dillaab-source/maisog-labs` itself — not a separate repository — becomes the authoritative Sentinel source of truth** (`D-011`, superseding the prior `maisoglabs-devos`-as-source-of-truth statement). After that point, conversation alone must never silently supersede the repository architecture; changes require a recorded amendment/RFC/decision process, exactly as `D-011` itself was recorded before this cycle acted on it. **[REPO-VERIFIED: D-011 "Source of truth amendment"]**

Paulo may define bounded pre-authorization for low-risk work; Sentinel may never invent its own delegation authority; architecture, security-boundary changes, material risk acceptance, governance changes, and production deployment remain Paulo-gated unless Paulo explicitly defines a different policy. **[REPO-VERIFIED: D-010 "additional freeze corrections", AS0-012]**

## 10. Intended lifecycle (conceptual target — NOT implemented in S0)

**[CYCLE-SUPPLIED in full — no lifecycle state diagram of any granularity exists in `D-010`, `D-011`, or `AS0-001`…`AS0-012`/`AS0-001A` as committed. This is new content this cycle's authorizing instruction asked to be frozen; it is recorded here as a conceptual target only, per that same instruction's own item 20.]**

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

**[REPO-VERIFIED at the top level: D-010 "additional freeze corrections" — "Memory, task state, run history, and Evidence Store remain distinct." CYCLE-SUPPLIED: the specific five-way split and every sub-bullet below; D-010 does not itemize these.]**

| Store | Contains |
|---|---|
| **Architectural Memory** | ADRs, decisions, supersession history |
| **Project Memory** | requirements, stable facts, risk history |
| **Run History** | agent/task execution, commands, failures, cost/timing |
| **Task Engine State** | locks, leases, current stage, owner, retries |
| **Evidence Store** | tests, CI attestations, artifacts, deployment proof, runtime observations |

**Task State is not generic memory. Evidence Store is not generic memory.** Each store answers a different question (what was decided vs. what is stably true about a project vs. what actually ran vs. what stage a task is currently in vs. what evidence backs a claim) and conflating them defeats the traceability model in §8 by making it impossible to tell, later, which kind of fact a given record actually is.

## 12. Known gaps (disclosed, not implemented in S0)

1. No technical enforcement of any trust boundary exists anywhere — see `../governance/TRUST_BOUNDARIES.md` TB-7.
2. No Capability Gateway, Policy Engine, Task Engine, Orchestrator, Evidence Gate, or CI exists as code, anywhere, in this or any repository.
3. `ML-DEVOS-AS-002` is referenced by this cycle's authorizing instruction but is not an inspectable repository artifact as of commit `ad4cd84` (see the provenance disclosure at the top of this document).
4. The lifecycle diagram (§10) and memory sub-taxonomy (§11) are frozen as intent only; no schema, storage, or code implements either.
5. PUSAKAL and ClinicFlow (named in `D-010` K-2 as future Sentinel-governed projects) remain entirely unknown to this session.
6. `SENTINEL-MIGRATION-DEBT-001` — the website's actual content-flow ordering (`../governance/REPOSITORY_OVERLAY_TOPOLOGY.md`) is recorded as migration debt, not resolved, in this cycle.
