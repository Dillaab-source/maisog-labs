# ADR-002: Adopt the S2 DevOS Repository Foundation and close the v1.3.0 → v1.4.0 transition

Status: `ACCEPTED`

Related RFC: `ML-DEVOS-RFC-001`
Architect Sync: `ML-DEVOS-AS-006` (RFC review), `ML-DEVOS-AS-007` (implementation review) — both archived durably at `devos/changes/architect-syncs/`
Paulo decision: `D-017` (`brain/DECISION_LOG.md`), following `D-015` (proposal authorization) and `D-016` (implementation authorization)
Implementation evidence: `c76bf6a6390581963d2ded2e5db18d96b4a346b4` (S2 implementation, `ARCHITECT_APPROVED` by `ML-DEVOS-AS-007`) — `INDEPENDENTLY_INSPECTED` by the Architect; this ADR's own commit — `ACTOR_REPORTED` until independently inspected.
Effective version: `1.4.0`

## Decision

The S2 DevOS Repository Foundation — the static manifest, reserved subsystem-root boundaries, and empty project registry defined by `ML-DEVOS-RFC-001` and implemented at `c76bf6a` — is adopted as part of the active Sentinel governance-capability baseline. Sentinel's governance-capability baseline transitions from `v1.3.0` to `v1.4.0`.

This decision does not activate, imply, or pre-authorize S3 or any later Sentinel phase, any runtime enforcement mechanism, project onboarding, a product `.devos/` overlay, website migration, or any application/deployment/CI change. It closes S2 as a documentation/static-governance milestone only, exactly as `D-013`/`ML-DEVOS-ADR-001` closed S1.

## Context

S1 closed the Governance Kernel at `v1.3.0` (`D-013`, `ML-DEVOS-ADR-001`). `D-015` then authorized the S2 proposal process — a repository-foundation phase establishing where DevOS core artifacts, project registry metadata, and later-phase subsystem roots belong, so that S3 (Typed Task Contracts) and beyond do not need to invent directory ownership ad hoc.

`ML-DEVOS-RFC-001` proposed this foundation in four parts: a static DevOS manifest keeping the frozen S0 architecture baseline and the active Sentinel capability baseline distinct; reserved subsystem roots (`contracts/`→S3, `state/`→S4, `capabilities/`→S5, `evidence/`→S7 consumed by S9, `orchestration/`→S8, `memory/`→S11) each declared `NOT IMPLEMENTED` with exactly one canonical owner; an empty project registry as an index only; and mandatory deterministic static validation for both JSON artifacts, including an S2-scope invariant that the registry stays empty through closure.

The RFC went through one Architect Sync remediation round (`ML-DEVOS-AS-006`): the initial review (`CHANGES_REQUESTED`) raised seven required corrections (`S2-F001`…`S2-F007` — baseline separation, source-of-truth precedence, registry-as-index semantics, mandatory validation, root ownership disambiguation, `projects/` topology clarification, testable placeholder-vs-implementation criteria), all resolved in the synchronized RFC, which the Architect then approved (`ARCHITECT_APPROVED — PAULO S2 IMPLEMENTATION DECISION REQUIRED`). Paulo authorized implementation as `D-016`.

Claude/Builder implemented the approved shape at `c76bf6a`, adding exactly the manifest, six `NOT IMPLEMENTED` reserved-root READMEs, the `FOUNDATION_ACTIVE` `devos/schemas/` root (S2's own), the empty registry and its schema, and two zero-dependency static validators. The Architect's implementation review (`ML-DEVOS-AS-007`) passed all nine findings (`S2-I001`…`S2-I009`) on first review — no remediation cycle was required — with one disclosed, accepted validator limitation (the manifest validator does not mechanically cross-check every reserved root's README against the filesystem; the Architect verified this by direct inspection instead). The Architect issued `SENTINEL S2 TECHNICAL STAGE GATE: ARCHITECT_APPROVED` and, per the same `CORE_POLICY`-gate discipline established at S1 closure, explicitly did not itself activate the closure or apply `v1.4.0` — it routed that decision to Paulo, who approved it as `D-017`, authorizing this ADR.

## Alternatives considered

- **Leave S2 as an Architect-approved-but-unclosed candidate indefinitely.** Rejected: an implementation that has passed every technical finding with no remediation needed, and that Paulo has explicitly reviewed and approved for closure, provides no real foundation for S3 while left uncommitted as a "candidate" — later phases would still lack a settled place to build on.
- **Apply `v1.4.0` and mark S2 closed without a durable ADR.** Rejected: `VERSIONING_POLICY.md`'s binding rule ("a version bump must never happen silently") and the precedent this repository already set at S1 closure both require an ADR tying the version bump to what was actually built and why. Skipping it here would treat S1's own closure discipline as optional the very next time it applied.
- **Retroactively fold S2 into a single combined S1+S2 ADR.** Rejected: `ML-DEVOS-ADR-001` already exists as a closed, non-rewritable durable record (`CORE-011`); S2 is its own separately proposed (`RFC-001`), separately reviewed (`AS-006`/`AS-007`), and separately authorized (`D-015`/`D-016`/`D-017`) change and deserves its own ADR, not a retroactive edit to the first one.
- **Defer the version bump until S3 also closes, bundling both into one v1.5.0 transition.** Rejected: `ML-DEVOS-RFC-001`'s own version-impact section proposed `v1.3.0 → v1.4.0` specifically for S2, independent of whatever S3 eventually proposes; bundling would misattribute S2's own backwards-compatible capability addition to a future, not-yet-existing phase, and would violate "never silently" by delaying an already-decided, already-authorized transition for administrative convenience.

## Rationale

Given the alternatives above, closing S2 now — with the foundation adopted, the version transition applied, and a durable ADR recording it — is the only option consistent with `CORE-006` (evidence-backed status claims, never silently upgraded) and the same reasoning `ML-DEVOS-ADR-001` already established for S1: the foundation has been independently reviewed, every technical finding is resolved, and Paulo has explicitly authorized exactly this closure in the form the Architect requested. `ML-DEVOS-RFC-001`'s own acceptance criteria and rollout plan (steps 6–8: Architect review, ADR creation, version transition "only at closure") anticipated exactly this sequence.

## Consequences

**This makes possible / easier:**
- S3 (Typed Task Contracts) and every later phase now have a settled, machine-readable answer to "where do my artifacts belong and who owns this root" — `devos/devos-manifest.json`'s `reserved_subsystem_roots` — without needing to invent or renegotiate directory ownership.
- The project registry foundation exists and is validated, so a future, separately authorized `PROJECT_ONBOARDING` decision has a real place to register a project without conflating registration with migration.
- Future phase closures have a second working example (alongside S1's) of the RFC → Architect Sync → Decision → Implementation → ADR → version-transition sequence, reinforcing it as the repository's actual practice rather than a one-off.

**This makes harder / does not solve:**
- None of this is runtime-enforced. A reserved root's `NOT IMPLEMENTED` boundary, and the registry's emptiness, are only as reliable as the static validators and human/Architect review that check them — nothing stops a future edit from violating either outside of that review discipline.
- The manifest validator's disclosed limitation (no mechanical README-existence/ownership cross-check) is not resolved by this closure — it remains an accepted, documented gap, exactly as `ML-DEVOS-AS-007` accepted it, not a defect this ADR silently papers over.
- This ADR does not authorize, and must not be read as implying authorization for, S3 or any later phase, any runtime engine, CI/workflow, GitHub ruleset, website/admin change, project onboarding, `.devos/` overlay, website migration, deployment, or protected-branch/`main` merge. S3 remains a wholly separate, not-yet-requested authorization, exactly as S2 was after S1 closed.

## Related RFC

`ML-DEVOS-RFC-001` — see `devos/changes/rfcs/ML-DEVOS-RFC-001.md`.

## Architect Sync

`ML-DEVOS-AS-006` (RFC review, `ARCHITECT_APPROVED`) and `ML-DEVOS-AS-007` (implementation review, `SENTINEL S2 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`), both archived durably at `devos/changes/architect-syncs/ML-DEVOS-AS-006.md` and `ML-DEVOS-AS-007.md`.

## Paulo decision

`D-017` (`brain/DECISION_LOG.md`) — explicit approval of S2 closure and the `v1.3.0 → v1.4.0` version transition, quoted verbatim in that entry.

## Implementation evidence

- `c76bf6a6390581963d2ded2e5db18d96b4a346b4` — S2 implementation. `INDEPENDENTLY_INSPECTED` by the Architect (`ML-DEVOS-AS-007`: exact diff scope verified via GitHub compare, every artifact independently inspected against `D-016`/`ML-DEVOS-RFC-001`/`ML-DEVOS-AS-006`). Builder's own validator command output remains `ACTOR_REPORTED`.
- This ADR's own commit — adopts S2 into the active baseline, updates `devos/devos-manifest.json`'s `sentinel_capability_baseline` and `closure_history`, and records the `v1.4.0` transition. `ACTOR_REPORTED` until independently inspected by the Architect.

No `RUNTIME_OBSERVED` or `CI_ATTESTED` evidence is claimed — S2, like S1, is a static documentation/governance-data cycle with no deployed runtime and no CI.

## Effective version

`1.4.0` — the Sentinel governance-capability baseline, as of this ADR. This does not alter the frozen S0 architecture document `devos/architecture/ML-DEVOS-ARCH-001.md` (still `v1.2.0`, its own permanent historical identity) nor the S1 closure record (`ML-DEVOS-ADR-001`, still `v1.3.0` as the version S1 itself took effect at) — `v1.4.0` describes the next layer added on top, exactly as `v1.3.0` described the layer S1 added on top of the unchanged S0 baseline.

## Supersedes / superseded by

Supersedes: none. Does not supersede `ML-DEVOS-ADR-001` — that record remains the accurate, unedited history of S1's own closure at `v1.3.0`; this ADR records the separate, subsequent S2 closure at `v1.4.0`.
Superseded by: none, as of this cycle.
