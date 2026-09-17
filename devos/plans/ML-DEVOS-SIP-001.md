# ML-DEVOS-SIP-001 — Sentinel Implementation Plan — S0–S14 Roadmap

Status: `CANDIDATE FREEZE — PENDING ARCHITECT APPROVAL`. Companion to `../architecture/ML-DEVOS-ARCH-001.md`. **[Remediates S0-F001]**

**Provenance disclosure, updated for remediation cycle 1:** the named phases and Alpha/Beta/RC1 milestone groupings below were disclosed in the prior candidate (commit `2bd7263`) as `[CYCLE-SUPPLIED]`. `coordination/ARCHITECT_REVIEW.md`'s `ML-DEVOS-AS-002` disposition has since explicitly accepted "the S0–S14 roadmap names and Alpha/Beta/RC1 milestone groupings" as part of the Sentinel target architecture — this gap is resolved; these names are now **[REPO-VERIFIED: AS0-002 disposition]**, subject to the S0-F002 correction below (which restores implementation outcomes that the prior candidate had incorrectly reduced to design-only wording).

Only **S0** is authorized. Per `coordination/STATE.md`'s "Current gate": no later Sentinel phase is authorized. **Restoring implementation outcomes for S1–S14 (below) does not authorize any of them — it only corrects what each phase is ultimately meant to produce. No phase below S0 may be marked `IMPLEMENTED` until it is separately authorized, worked, and Architect-reviewed.**

**[Remediates S0-F002 — restores implementation outcomes for S1–S14, which the prior candidate incorrectly reduced to "design (not build)" wording. Naming the intended outcome does not authorize building it: every phase below stays `NOT STARTED` until it is separately authorized by Paulo, actually worked, and closed by its own Architect review.]**

| Phase | Name | Intended implementation outcome | Status |
|---|---|---|---|
| **S0** | Architecture Freeze | Freeze `ML-DEVOS-ARCH-001`; produce this roadmap and the other S0 artifacts; commit them into the repurposed monorepo. No runtime code. | `IN PROGRESS` (this cycle) |
| S1 | Governance Kernel | Extract and formalize reusable governance policy (roles, trust boundaries, evidence rules) into a form later phases' Task Engine/Policy Engine can actually consume. | `NOT STARTED` |
| S2 | DevOS Repository Foundation | Establish the concrete DevOS core / project-registry foundation inside the now-canonical monorepo. | `NOT STARTED` |
| S3 | Typed Task Contracts | Implement machine-readable Task Contracts — schema and validation for what evidence class each kind of claim requires (`ML-DEVOS-ARCH-001` §6). | `NOT STARTED` |
| S4 | State Machine Kernel | Implement the authoritative task lifecycle/state machine (`ML-DEVOS-ARCH-001` §10): ownership, locks/leases, retries, timeouts, idempotency. | `NOT STARTED` |
| S5 | Capability & Permission Gateway | Implement enforcement of scoped role/tool permissions, making "Capability ≠ Authority" technically true rather than procedural. | `NOT STARTED` |
| S6 | Isolated Execution | Implement task-scoped branch/worktree/sandbox isolation for Builder/QA work. | `NOT STARTED` |
| S7 | Evidence & QA Plane | Implement structured evidence packets and the Evidence Store, plus deterministic QA execution. | `NOT STARTED` |
| S8 | Orchestrator MVP | Implement bounded coordination of Architect → Builder → QA → Reviewer work dispatch. | `NOT STARTED` |
| S9 | Independent Review & Evidence Gate | Implement the fresh-context review process and the Evidence Gate's actual deterministic acceptance logic. | `NOT STARTED` |
| S10 | GitHub Enforcement | Implement PR/required-check/ruleset/protected-`main` enforcement that makes TB-7 real. | `NOT STARTED` |
| S11 | Memory & Observability | Implement the five separated memory/evidence stores (`ML-DEVOS-ARCH-001` §11) plus run/task health telemetry. | `NOT STARTED` |
| S12 | Project Overlay System | Implement reusable governance across multiple projects/repositories via the `.devos/` overlay (`../governance/REPOSITORY_OVERLAY_TOPOLOGY.md`), preserving cross-repository governance rather than requiring source to move into this monorepo. | `NOT STARTED` |
| S13 | Release & Runtime Verification | Implement `MERGED → RELEASE_READY → DEPLOYED → VERIFIED` with actual `RUNTIME_OBSERVED` evidence (`ML-DEVOS-ARCH-001` §7, §10). | `NOT STARTED` |
| S14 | Sentinel Production Pilot | Run one real, end-to-end governed task through the full Sentinel pipeline built by S1–S13. | `NOT STARTED` |

## Milestones

**[REPO-VERIFIED: AS0-002 disposition — explicitly accepted]**

- **Sentinel Alpha — Kernel:** S0–S4
- **Sentinel Beta — Controlled Agents:** S5–S9
- **Sentinel RC1 — Enforced DevOS:** S10–S14

## Rules governing this roadmap

1. This is a naming/sequencing scaffold, not a design. Each phase's actual design happens only when separately authorized, following the pattern S0 itself followed: Paulo authorization → Architect Sync → frozen documents → Architect review → next-phase authorization.
2. Do not mark any phase past S0 `IMPLEMENTED`. A phase's row in the table above stays `NOT STARTED` until that phase is actually authorized and worked, and stays `IN PROGRESS` (never `IMPLEMENTED`/`VERIFIED`) until its own Architect review closes it.
3. Once this freeze commit is Architect-approved, this file (living in the now-authoritative `maisog-labs` repository, per `ML-DEVOS-ARCH-001` §9) is itself subject to the bootstrap/source-of-truth rule: a future chat instruction cannot silently renumber or rename these phases without going through the same freeze/sync/authorization pattern.
4. This roadmap does not authorize skipping ahead. A future request to start any phase past S0 should be checked against `coordination/STATE.md`'s live `AUTHORIZED_SCOPE`, exactly as every phase transition in this session has been checked so far.
