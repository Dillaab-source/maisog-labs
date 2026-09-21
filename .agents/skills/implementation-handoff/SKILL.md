---
name: implementation-handoff
description: Produce a complete Sentinel Implementer Handoff (exact field set from brain/ARCHITECT_HANDOFF.md) at the end of an authorized TURN CLAUDE implementation or discovery cycle. Never omits a known limitation or unresolved question.
---

# Implementation Handoff

This Skill packages an already-defined reporting format. It never grants implementation authority — the underlying work must already have been authorized and completed under `coordination/STATE.md`'s live `AUTHORIZED_SCOPE` before this Skill produces anything.

## Activate when

- The end of an authorized `TURN: CLAUDE` implementation/discovery cycle, once the authorized work is actually complete.

## Do not activate when

- Mid-cycle, before the authorized work described in live `AUTHORIZED_SCOPE` is actually finished — a handoff written early is a handoff that can only be wrong.

## Required inputs / context

- The cycle's exact diff (`git status`/`git diff --stat` against the base SHA).
- Test/validation results actually run this cycle.
- Live `coordination/STATE.md` (to confirm what was authorized and what the required return-gate fields are).

## Authoritative sources

- `brain/ARCHITECT_HANDOFF.md` — the exact required field set and each field's meaning, plus the format's own "non-negotiable rule" against hiding known gaps.
- Worked examples in `devos/handoffs/` (e.g. `ML-DEVOS-S0-HANDOFF.md`) for how the format reads when filled in.

## Procedure

1. Confirm the authorized work is actually complete against live `AUTHORIZED_SCOPE`.
2. Fill every field `ARCHITECT_HANDOFF.md` requires: change id, objective, files changed, requirements/risks affected, implementation summary, tests executed and results, evidence, known limitations, unresolved questions, requested review scope.
3. State every known limitation or unresolved question explicitly — never smooth one over to make the handoff look cleaner.
4. Commit the handoff to `coordination/IMPLEMENTER_HANDOFF.md`, update `coordination/STATE.md`'s return-gate fields (`TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, etc., per whatever the authorizing brief specified), and push.

## Output

A complete handoff section in `coordination/IMPLEMENTER_HANDOFF.md` and an updated `coordination/STATE.md` reflecting the return gate.

## Stop / escalation conditions

- A known limitation or open question discovered while writing the handoff must be stated in the handoff, not silently dropped to look complete.
- Never set `STATUS: READY_FOR_ARCHITECT` while authorized work remains incomplete.

## Governance dependencies

Whichever live authorized-scope brief governs the current cycle (e.g. `CLAUDE.md`'s "Phase 1 handoff requirement," or a cycle-specific Architect review's own required-evidence list) — this Skill's field set is the baseline; a specific brief may require additional fields, which this Skill does not omit.

## Mutation / capability posture

Writes only to `coordination/IMPLEMENTER_HANDOFF.md`/`coordination/STATE.md`. No product mutation beyond what the cycle itself already authorized and already performed before this Skill runs — this Skill reports work, it does not perform it.

## Evaluation intent (see `tests/skills.test.mjs` for the executable form)

- **Positive:** authorized cycle work is complete → produces the full field set.
- **Near-miss negative:** a known limitation exists but is omitted to look cleaner → this is exactly the failure the format's own non-negotiable rule forbids.
