<!--
  GENERATED FILE — DO NOT HAND-EDIT.
  This is a deterministic, non-diverging copy of the canonical Skill payload at:
    .agents/skills/architect-review-sync/SKILL.md
  Regenerate with: node scripts/generate-claude-skills-bridge.mjs
  Any manual edit here is detected as drift by scripts/validate-claude-skills-bridge.mjs
  (ML-DEVOS-RFC-014 / ML-DEVOS-AS-050 / D-042).
-->

---
name: architect-review-sync
description: Conduct a Sentinel Architect Sync review of a Builder's diff/handoff against the four defined review modes (Change/Stage Gate/Release/Security Review), producing one of the defined verdicts. Only activates when coordination/STATE.md's TURN field is ARCHITECT — never on request wording alone.
---

# Architect Review / Sync

This Skill packages an already-defined review procedure. It never grants review authority by itself — the live `coordination/STATE.md` turn field is the sole activation gate, not this Skill's presence or the wording of a request (`CORE-002`, `CORE-008`).

## Activate when

- `coordination/STATE.md`'s `TURN` field reads `ARCHITECT`, and a Builder diff/handoff exists to review.

## Do not activate when

- `TURN` is anything other than `ARCHITECT` — **even if the request text explicitly asks for a review.** The turn field gates this Skill, not the phrasing of the request. A request that sounds like a review ask while `TURN: CLAUDE` (or any other value) must not trigger this Skill.

## Required inputs / context

- Live `coordination/STATE.md` (to confirm the turn condition and read the authorized scope being reviewed against).
- The Builder's exact diff and `coordination/IMPLEMENTER_HANDOFF.md`.

## Authoritative sources

- `brain/protocols/ARCHITECT_SYNC.md` — the review-flow pipeline and the four review modes (`CHANGE REVIEW`, `STAGE GATE REVIEW`, `RELEASE REVIEW`, `SECURITY REVIEW`), each with its own defined verdict vocabulary.
- `coordination/README.md` — the turn-protocol mechanics and file-ownership convention (`coordination/ARCHITECT_REVIEW.md` is Architect-owned).

## Procedure

1. Confirm `TURN: ARCHITECT` in live `coordination/STATE.md` before proceeding.
2. Follow `ARCHITECT_SYNC.md`'s review-flow pipeline: repo state → governance requirements → governance map → implementation → tests → evidence → git diff → security/risk → contradictions → verdict.
3. Select the applicable review mode and issue exactly one of that mode's defined verdicts.
4. Record the review in `coordination/ARCHITECT_REVIEW.md` (the rolling surface); a concluded review is later archived verbatim to `devos/changes/architect-syncs/ML-DEVOS-AS-<NNN>.md` per the existing durable-archive convention.

## Output

A written review following `ARCHITECT_SYNC.md`'s pipeline, ending in one defined verdict, committed to `coordination/ARCHITECT_REVIEW.md`.

## Stop / escalation conditions

- A finding that requires a Paulo gate must be surfaced as a named blocker requiring that gate — never silently resolved by the review itself, and never treated as approved by the review's own act of noticing it.
- Never self-certify a Builder's own reported evidence as `ARCHITECT VERIFIED` without independent inspection — that upgrade is exactly what this Skill exists to perform, not to skip.

## Governance dependencies

`coordination/STATE.md`'s turn protocol is the sole activation gate. This Skill has no authority to change `TURN`, `AUTHORIZED_SCOPE`, or any `*_AUTHORIZED` flag — those are Paulo/Architect-owned state, read by this Skill, never set by it as a side effect of running.

## Mutation / capability posture

Writes only to `coordination/ARCHITECT_REVIEW.md`/`coordination/STATE.md`, per the existing rolling-review convention this Skill wraps. No product/runtime mutation, no capability grant, no credential use.

## Evaluation intent (see `tests/skills.test.mjs` for the executable form)

- **Positive:** `TURN: ARCHITECT` and a Builder handoff exists → produces a review.
- **Near-miss negative:** `TURN: CLAUDE`, request text says "please review this" → must not activate; the turn field, not the wording, gates it.
