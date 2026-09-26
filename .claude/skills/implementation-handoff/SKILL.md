---
name: implementation-handoff
description: Produce the bounded Sentinel CURRENT_HANDOFF (identity header plus required sections from brain/protocols/CONTEXT_BOOTSTRAP.md) at the end of an authorized TURN CLAUDE implementation or discovery cycle, and publish it atomically with STATE. Never omits a known limitation or unresolved question.
---

# Implementation Handoff

This Skill packages an already-defined reporting format. It never grants implementation authority — the underlying work must already have been authorized and completed under `coordination/STATE.md`'s live `AUTHORIZED_SCOPE` before this Skill produces anything. The handoff itself never grants authority.

## Activate when

- The end of an authorized `TURN: CLAUDE` implementation/discovery cycle, once the authorized work is actually complete.

## Do not activate when

- Mid-cycle, before the authorized work described in live `AUTHORIZED_SCOPE` is actually finished — a handoff written early is a handoff that can only be wrong.

## Required inputs / context

- The exact authoritative tip the handoff will be published on (re-resolved immediately before publication).
- The cycle's exact diff against that tip and the test/validation results actually run this cycle.
- Live `coordination/STATE.md` (what was authorized and the required return-gate fields) and the live review's Sync ID in `coordination/ARCHITECT_REVIEW.md`.

## Authoritative sources

- `brain/protocols/CONTEXT_BOOTSTRAP.md` — the CURRENT_HANDOFF identity header, required sections, archive and obligation rules, and the exact-tip publication transaction.
- `brain/ARCHITECT_HANDOFF.md` — field meanings and the format's "non-negotiable rule" against hiding known gaps.

## Procedure

1. Confirm the authorized work is actually complete against live `AUTHORIZED_SCOPE`.
2. Mint a new immutable `handoff_id` (`H-...`); never reuse one.
3. Write `coordination/CURRENT_HANDOFF.md`: the ```yaml header (`schema_version`, `handoff_id`, `cycle_id`, `input_base_commit`, `review_target_commit` = the exact tip this commit will sit on, `applicable_review_id` = the live review's `ML-DEVOS-AS-NNN`) and every required section, stating every known limitation or unresolved question explicitly. Record evidence here only; `coordination/IMPLEMENTER_HANDOFF.md` is frozen and is never written.
4. In the same candidate commit: archive the outgoing handoff's exact bytes to `coordination/archive/handoffs/<handoff_id>.md` with provenance if not already archived; carry every unresolved `coordination/OPERATIVE_OBLIGATIONS.md` row forward unchanged or close it with a citation; set STATE's selector fields to the matching tuple and its return-gate fields (`TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, etc., per the authorizing brief).
4a. **Protocol V2 only** (`ML-DEVOS-RFC-020`; active since `D-080`). The same return commit also:
   - sets `CURRENT_DIRECTIVE: NONE` with empty directive selector values;
   - archives the outgoing `coordination/CURRENT_DIRECTIVE.md` byte-for-byte with `archiveDirective()` (entry, `.provenance.json` and index row under `coordination/archive/directives/`).

   A V2 handoff never leaves a directive selected. Under V1 there is no directive selector, and CURRENT_DIRECTIVE is not touched.
5. Commit on the exact tip and publish with `node scripts/check-context-bootstrap.mjs --publish --candidate <sha>` (all transition checks, then exact-old-value CAS; at most `MAX_PUBLICATION_ATTEMPTS = 3`). On rejection, rebuild from a fresh snapshot; on an ambiguous result, read back before anything else.

## Output

One published commit containing `coordination/CURRENT_HANDOFF.md` and the matching `coordination/STATE.md` return gate, plus any required archive/inventory updates.

## Stop / escalation conditions

- A known limitation or open question discovered while writing the handoff must be stated in the handoff, not silently dropped to look complete.
- Never set `STATUS: READY_FOR_ARCHITECT` while authorized work remains incomplete.
- Checker failure, branch advancement, retry exhaustion, or protocol-version mismatch: stop and disclose; never force.

## Governance dependencies

Whichever live authorized-scope brief governs the current cycle (live `coordination/STATE.md` and the applicable Architect review's required-evidence list) — this Skill's sections are the baseline; a specific brief may require additional content, which this Skill does not omit.

## Mutation / capability posture

Writes only to `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`, `coordination/OPERATIVE_OBLIGATIONS.md`, and `coordination/archive/handoffs/`. No product mutation beyond what the cycle itself already authorized and already performed before this Skill runs — this Skill reports work, it does not perform it.

## Evaluation intent (see `tests/skills.test.mjs` for the executable form)

- **Positive:** authorized cycle work is complete → produces a bound CURRENT_HANDOFF with every required section, published atomically with STATE.
- **Near-miss negative:** a known limitation exists but is omitted to look cleaner → this is exactly the failure the format's own non-negotiable rule forbids.
