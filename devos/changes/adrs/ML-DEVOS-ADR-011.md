# ADR-011: Adopt MaisogLabs Skills Foundation V0.1 + Portable Knowledge Treasury

Status: `ACCEPTED`

Related RFC:
- `ML-DEVOS-RFC-014`

Architect Syncs:
- `ML-DEVOS-AS-050` — bounded V0.1 design acceptance, implementation authorized
- `ML-DEVOS-AS-053` — final implementation acceptance (`IMPLEMENTED / REPOSITORY-VERIFIED`)

Paulo decisions:
- `D-042` — architecture acceptance + bounded V0.1 implementation authorization
- `D-046` — coordinated closure authorization (this ADR's creation)

Implementation range:
- final independently accepted implementation head: `3a83c83174c8a0f369cfd189b1e76256183efec5`

Effective version:
- Sentinel governance-capability baseline: **remains `v1.5.0` — no bump**
- frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`

## Decision

Sentinel adopts the MaisogLabs Skills Foundation V0.1 and the Portable Knowledge Treasury as active repository architecture:

- exactly four canonical Skills under `.agents/skills/` (Governance/Traceability Audit, Architect Review/Sync, Implementation Handoff, Project Orientation/State Recovery);
- `.agents/skills/` as the canonical Skill payload location, with a deterministic, byte-identical, non-diverging `.claude/skills/` bridge (`scripts/generate-claude-skills-bridge.mjs` / `scripts/validate-claude-skills-bridge.mjs`);
- the manual Portable Knowledge Treasury procedure (`brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md`) — a routing/classification discipline over existing canonical destinations, never a fifth Skill and never a store of its own;
- `brain/KNOWLEDGE_PRINCIPLES.md`, created empty at V0.1 per `ML-DEVOS-AS-050`'s explicit no-bulk-import instruction, as the lightweight residual home for durable engineering-lesson entries with no other canonical destination.

None of these Skills, and no part of the Treasury procedure, grants tool access, credentials, remote-resource authority, or standing capability beyond what is already authorized elsewhere (`CORE-001`, `CORE-002`). `GOVERNANCE > SKILLS`; `CURRENT AUTHORIZATION > SKILL CAPABILITY`; `CAPABILITY != AUTHORITY` remain the governing principles, unweakened by this adoption.

## Context

Before this cycle, Sentinel had no repeatable-procedure packaging mechanism and no durable, cross-session engineering-lesson capture discipline beyond ad hoc entries in `brain/DECISION_LOG.md`. `ML-DEVOS-RFC-014` proposed both: a bounded, four-Skill V0.1 (explicitly rejecting a fifth "Knowledge Capture" Skill, `AS42-F004`) and a manual Treasury routing procedure over already-existing canonical destinations, corrected during design review for a materially false external compatibility claim (`AS45-F007`) and for the repository's private-visibility disclosure/storage boundary (`AS47`, `D-041`).

`ML-DEVOS-AS-050` accepted the design and authorized bounded V0.1 implementation. Implementation proceeded through one remediation cycle (`ML-DEVOS-AS-051`, correcting a Claude Code bridge frontmatter defect, a Treasury `INTERNAL` access-control gap, and stale Phase-1 scope wording) and one scope-cleanup cycle (`ML-DEVOS-AS-052`, removing an out-of-scope generated-bridge README). `ML-DEVOS-AS-053` then independently accepted the final implementation as `IMPLEMENTED / REPOSITORY-VERIFIED` and reopened S3 under previously preserved authority (`D-037`/`ML-DEVOS-AS-038`) without requiring a second Paulo approval, per `D-042`'s explicit sequential-authorization clause.

This ADR closes the governance debt `ML-DEVOS-AS-056` (`AS56-F004`) identified: the implementation had been independently accepted but had never received its own closure ADR or an explicit post-implementation version disposition, unlike every other closed Sentinel phase.

## Alternatives considered

See `ML-DEVOS-RFC-014`'s own "Alternatives considered" for the discovery-stage analysis (canonical Skill location, external-skill trust tiering, Knowledge Capture as a Skill vs. a procedure, Treasury as a store vs. a routing protocol). Nothing new was considered at closure; this ADR records the outcome of that already-reviewed design, not a new architectural choice.

## Rationale

The four Skills are thin, non-authoritative wrappers around already-proven repository procedures (governance traceability auditing, Architect review/sync, implementation handoff, and orientation/state recovery) — packaging them reduces re-derivation cost without inventing new authority. The Treasury procedure routes durable lessons to their correct existing canonical destination (a decision, a risk entry, a protocol document) rather than creating a parallel, competing store, which was the explicit design goal `ML-DEVOS-AS-044`'s "TREASURY = LIGHTWEIGHT GOVERNED PROCEDURE" direction settled on.

## Consequences

This adoption makes it easier to invoke a repeatable governance procedure consistently (via SKILL CHECK) and to capture a genuinely durable engineering lesson without it disappearing into a single session's context. It makes it harder to justify re-deriving a procedure from scattered files when a matching Skill already exists, and it establishes the precedent that a "reusable idea surfaced in a review" must be classified and routed through a governed procedure before it can be treated as durable knowledge, rather than becoming ambient assumed practice.

It does not make external-skill adoption easier — the consequence-tiered `REFERENCE-ONLY/PROCEDURAL` vs. `CAPABILITY-ADJACENT/EXECUTABLE` model (`AS42-F005`/`AS44-J`) remains the full gate for that, unrelated to and unweakened by this internal adoption. `RISK-WEB-013` remains open and untouched by this ADR — this closure does not resolve, close, or reassess it.

## Version consequence

This is deliberately **not** a version-bump event. Per `ML-DEVOS-AS-056`'s (`AS56-F004`) recommendation, restated and adopted here as an explicit decision rather than a silent omission:

- no `CORE-*` rule's meaning changed;
- no actor's authority changed;
- no trust boundary was granted or widened;
- no remote/deploy/main authority changed;
- Skills are explicitly non-authoritative procedure wrappers, and the Treasury is a manual routing/classification discipline over records that already existed and were already canonical.

The implementation operationalizes existing governance practice rather than changing Sentinel's constitutional/governance semantics — the same reasoning `SENTINEL-TRACEABILITY-V1`'s own no-bump closure used.

`devos/devos-manifest.json`'s `sentinel_capability_baseline` is **not** touched by this ADR. The baseline remains `v1.5.0` immediately before, and independent of, the separate `v1.5.0 → v1.6.0` transition this same coordinated closure applies via `ML-DEVOS-ADR-013`'s S3 adoption (see that ADR; `ML-DEVOS-ADR-012` records RFC-015's own co-effective adoption at the same `v1.6.0` boundary). This ADR's own effective version is `v1.5.0` — it changes nothing about the baseline number.

## Explicitly not implemented

This ADR does not implement or authorize:

- a fifth "Knowledge Capture" Skill (explicitly rejected, `AS42-F004`);
- S3 Typed Task Contracts (recorded separately in `ML-DEVOS-ADR-013`);
- S4 State Machine Kernel, S5 Capability Gateway, S6 isolation, S7 Evidence/QA Plane, S8 Orchestrator, S9 Evidence Gate, S10 CI/rulesets, S11–S14;
- external Skill installation, provider-account/chat scraping, or chat-history archival;
- product/runtime changes, remote resources, credentials, deployment, or protected/main merge.

## Supersession

Supersedes: none.

Superseded by: none as of acceptance.

## Related RFC

`ML-DEVOS-RFC-014` — status updated to `IMPLEMENTED AND CLOSED` by this ADR's adoption; its proposal text is preserved unedited, per `CHANGE_GOVERNANCE_POLICY.md` §3's rule that an accepted RFC is never itself rewritten into an ADR.

## Architect Sync

`ML-DEVOS-AS-050` (bounded V0.1 design/implementation authorization) and `ML-DEVOS-AS-053` (`ARCHITECT_ACCEPTED — SKILLS FOUNDATION V0.1 + PORTABLE KNOWLEDGE TREASURY IMPLEMENTED / REPOSITORY-VERIFIED`).

## Paulo decision

`D-042` authorized the architecture and bounded V0.1 implementation. `D-046` authorized this coordinated closure, including this ADR's creation.

## Implementation evidence

Final independently accepted implementation head `3a83c83174c8a0f369cfd189b1e76256183efec5`, reviewed and accepted by `ML-DEVOS-AS-053`. Evidence class: `INDEPENDENTLY_INSPECTED` / `INDEPENDENTLY_REPRODUCED` for the deterministic bridge/Skill invariants `ML-DEVOS-AS-053` verified directly; `ACTOR_REPORTED` for Builder-run test counts not independently re-executed by the Architect.

## Effective version

`v1.5.0` — no Sentinel capability-baseline transition. Frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`.

## Supersedes / superseded by

Supersedes: none. Superseded by: none as of acceptance.
