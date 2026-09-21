# Knowledge / Principles Ledger

Authority: `ML-DEVOS-RFC-014` (ACCEPTED) / `ML-DEVOS-AS-050` (ARCHITECT_APPROVED) / `D-042`.

## Purpose

This is the residual canonical destination for **reusable engineering lessons** discovered through the `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md` procedure that do not correctly belong anywhere else:

- **not Governance** (a rule/authority/boundary — those go through `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`'s RFC/Decision path);
- **not current STATE** (`coordination/STATE.md` / other `brain/*.md` status tables);
- **not ADR/RFC** (an architecture choice — `devos/changes/adrs/` / `devos/changes/rfcs/`);
- **not evidence/test results** (`brain/TEST_LEDGER.md` / `brain/RISK_REGISTER.md`);
- **not Journal/public copy** (the public Journal, `WEB-INC-006`, via its own publish approval);
- **not secret storage** (credentials/tokens/keys never belong here or anywhere in Git — see `PORTABLE_KNOWLEDGE_TREASURY.md` §5).

Only a lesson that genuinely has no other home lands here. This ledger is deliberately narrow — most durable insight already has a better-fitting destination (see the Treasury protocol's destination table), and this file is not meant to grow large.

## No new ID namespace (`ML-DEVOS-AS-050` constraint)

This ledger does not invent a new formal ID scheme or extend Sentinel Traceability V1 in V0.1. Entries are referenced by their table row (date + short title) until/unless a future, separately authorized change finds a pre-existing convention that applies cleanly.

## Entry format

Each row should carry, per `PORTABLE_KNOWLEDGE_TREASURY.md` §8's provenance model:

| Field | Meaning |
|---|---|
| Date | When the lesson was captured |
| Lesson | The reusable insight itself, stated concretely |
| Source / context | Which cycle, session, or AI (ChatGPT/Claude/Codex/other) it came from |
| Why it matters | Which durable-value reason applied (§1 of the Treasury protocol) |
| Confidence / evidence class | Reusing the existing 5-class `devos/governance/EVIDENCE_PROVENANCE_MODEL.md` — no sixth class is invented |
| Expected reuse | Where this is expected to help next (skill improvement / checklist / test / risk control / design guideline / onboarding / research shortcut / other) |
| Related IDs | Any related requirement/risk/decision/skill/RFC id |
| Supersedes / superseded by | Reusing the same field convention already used by `core-rules.json` rule records and the ADR template |

## Ledger

| Date | Lesson | Source / context | Why it matters | Confidence | Expected reuse | Related IDs | Supersedes |
|---|---|---|---|---|---|---|---|
| 2026-09-20 | **Closure is a reconciliation boundary, not bookkeeping.** A phase can be technically correct while its RFC banner, manifest status, ADR/version disposition, handoff text, and derived traceability outputs drift behind live authority. Closure should reconcile these surfaces before the next phase opens. | S3 closure discrepancy review + external architecture/GitOps/ADR/schema-evolution research | Prevents repeated phase-closure drift and reduces rediscovery/review cost. | `INDEPENDENTLY_INSPECTED` repository evidence + externally corroborated design principle | Architect Sync closure-preflight design; future phase closures | `ML-DEVOS-AS-055`, `ML-DEVOS-AS-056`, proposed `ML-DEVOS-RFC-015` | — |
| 2026-09-20 | **Bootstrap invariants and permanent lifecycle invariants must be separated explicitly.** Rules that are correct during foundation/bootstrap (for example, "later roots are NOT_IMPLEMENTED") should not be encoded as permanent semantics if later phases are expected to transition legitimately. | S2 manifest assumptions exposed by first real S3 closure | Prevents foundational validators from becoming accidental blockers or false authorities as the system matures. | `INDEPENDENTLY_INSPECTED` | Manifest/schema lifecycle design; future foundation work | `ML-DEVOS-RFC-001`, `ML-DEVOS-AS-056`, proposed `ML-DEVOS-RFC-015` | — |
| 2026-09-20 | **Improvements should surface at natural lifecycle checkpoints, not as constant governance noise.** Architect/Builder may raise non-binding improvement suggestions when a real review, failure, closure, incident, or repeated friction exposes them. A suggestion does not grant authority; it is promoted only when it has durable reuse value and follows the applicable RFC/Decision path. | Paulo directive after S3 discrepancy review + Portable Knowledge Treasury principles | Preserves continuous improvement without turning Sentinel into paperwork or allowing conversational suggestions to become silent policy. | `INDEPENDENTLY_INSPECTED` + Paulo directive | Architect Review, Implementation Handoff, Treasury capture, future RFC candidates | `D-042`, `ML-DEVOS-RFC-014`, proposed `D-043` / `ML-DEVOS-RFC-015` | — |

| 2026-09-20 | **Governance hardening needs an exit condition back to capability delivery.** When a concrete defect exposes a governance gap, fix the class of defect once, add the smallest reusable guardrail, then return to the capability roadmap. Do not turn "make governance more complete" into an open-ended workstream. | Overall Sentinel direction review after RFC-015 design acceptance; Paulo authorization in D-045 | Prevents Sentinel from becoming stuck governing itself and keeps governance proportional to real implementation risk. | `INDEPENDENTLY_INSPECTED` repository direction + Paulo directive | Future stage-gate reviews, roadmap sequencing, anti-bloat decisions | `D-045`, `ML-DEVOS-RFC-015`, `ML-DEVOS-AS-059` | — |
| 2026-09-20 | **Release boundaries and architecture-decision boundaries are different axes.** Multiple separately reviewed ADRs may intentionally ship under one explicit capability-version release when the changes form one coherent milestone; version numbers should represent release/capability boundaries, not mechanically count ADRs. | RFC-015/S3 sequencing review; Paulo's preferred coordinated v1.6.0 closure direction | Avoids artificial version churn while preserving independent decision provenance and reviewability. | `INDEPENDENTLY_INSPECTED` + Paulo directive | Version/closure planning; future multi-change Sentinel milestones | `D-045`, `ML-DEVOS-RFC-015`, `ML-DEVOS-AS-055` | — |

These are prospective retained lessons from the current governed cycle, not a bulk backfill of historical chats.
