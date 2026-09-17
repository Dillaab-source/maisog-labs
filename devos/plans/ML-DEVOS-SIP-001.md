# ML-DEVOS-SIP-001 — Sentinel Implementation Plan — S0–S14 Roadmap

Status: `FROZEN (S0)`. Companion to `../architecture/ML-DEVOS-ARCH-001.md`.

**Provenance disclosure:** the named phases and Alpha/Beta/RC1 milestone groupings below are **[CYCLE-SUPPLIED]** — this specific naming does not appear in `brain/DECISION_LOG.md` or `coordination/ARCHITECT_REVIEW.md` as committed. Only the *existence* of a phased S0-onward roadmap and the S0 scope itself are **[REPO-VERIFIED]** (`D-010`, `coordination/STATE.md`). This supersedes this repository's own prior generic S0–S14 placeholder roadmap (produced in the previous cycle, before the monorepo repurpose) with these specific names, per this cycle's explicit authorization to freeze them.

Only **S0** is authorized. Per `coordination/STATE.md`'s "Current gate": no later Sentinel phase is authorized. **No phase below S0 may be marked `IMPLEMENTED` — these are roadmap targets only.**

| Phase | Name | Purpose (roadmap target — not designed) | Status |
|---|---|---|---|
| **S0** | Architecture Freeze | Freeze `ML-DEVOS-ARCH-001`; produce this roadmap and the other S0 artifacts; commit them into the repurposed monorepo. No runtime code. | `IN PROGRESS` (this cycle) |
| S1 | Governance Kernel | Formalize roles, trust boundaries, and evidence rules into whatever the future Task Engine/Policy Engine will actually consume. | `NOT STARTED` |
| S2 | DevOS Repository Foundation | Establish the concrete `devos/` internal structure and conventions beyond the S0 documentation set (e.g. schemas, templates) inside the now-canonical monorepo. | `NOT STARTED` |
| S3 | Typed Task Contracts | Define the "Task Contract" concept referenced in `ML-DEVOS-ARCH-001` §6 — what evidence class each kind of claim requires. | `NOT STARTED` |
| S4 | State Machine Kernel | Design (not build) the lifecycle state machine sketched in `ML-DEVOS-ARCH-001` §10. | `NOT STARTED` |
| S5 | Capability & Permission Gateway | Design (not build) the mechanism making "Capability ≠ Authority" technically true. | `NOT STARTED` |
| S6 | Isolated Execution | Design (not build) sandboxed/isolated execution for Builder/QA work. | `NOT STARTED` |
| S7 | Evidence & QA Plane | Design (not build) the Evidence Store and QA's independent-execution mechanism. | `NOT STARTED` |
| S8 | Orchestrator MVP | Design (not build) work dispatch across actors. | `NOT STARTED` |
| S9 | Independent Review & Evidence Gate | Design (not build) the fresh-context review process and the Evidence Gate's actual gating logic. | `NOT STARTED` |
| S10 | GitHub Enforcement | Design (not implement) branch protection / required-checks rulesets that make TB-7 enforcement real. | `NOT STARTED` |
| S11 | Memory & Observability | Design (not build) the five-store memory boundary (`ML-DEVOS-ARCH-001` §11) as actual storage. | `NOT STARTED` |
| S12 | Project Overlay System | Define the `.devos/` overlay schema (`../governance/REPOSITORY_OVERLAY_TOPOLOGY.md`) and, separately, authorize any actual project migration. | `NOT STARTED` |
| S13 | Release & Runtime Verification | Design the Release Gate / Deployment / Runtime Verification stages (`ML-DEVOS-ARCH-001` §7, §10). | `NOT STARTED` |
| S14 | Sentinel Production Pilot | A Stage Gate / Release Review assessing whether S1–S13 are sufficient to run Sentinel on a real, live project end to end. | `NOT STARTED` |

## Milestones

**[CYCLE-SUPPLIED]**

- **Sentinel Alpha — Kernel:** S0–S4
- **Sentinel Beta — Controlled Agents:** S5–S9
- **Sentinel RC1 — Enforced DevOS:** S10–S14

## Rules governing this roadmap

1. This is a naming/sequencing scaffold, not a design. Each phase's actual design happens only when separately authorized, following the pattern S0 itself followed: Paulo authorization → Architect Sync → frozen documents → Architect review → next-phase authorization.
2. Do not mark any phase past S0 `IMPLEMENTED`. A phase's row in the table above stays `NOT STARTED` until that phase is actually authorized and worked, and stays `IN PROGRESS` (never `IMPLEMENTED`/`VERIFIED`) until its own Architect review closes it.
3. Once this freeze commit is Architect-approved, this file (living in the now-authoritative `maisog-labs` repository, per `ML-DEVOS-ARCH-001` §9) is itself subject to the bootstrap/source-of-truth rule: a future chat instruction cannot silently renumber or rename these phases without going through the same freeze/sync/authorization pattern.
4. This roadmap does not authorize skipping ahead. A future request to start any phase past S0 should be checked against `coordination/STATE.md`'s live `AUTHORIZED_SCOPE`, exactly as every phase transition in this session has been checked so far.
