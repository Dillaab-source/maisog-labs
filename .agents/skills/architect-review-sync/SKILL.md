---
name: architect-review-sync
description: Conduct a Sentinel Architect Sync review of a Builder's CURRENT_HANDOFF and diff against the four defined review modes (Change/Stage Gate/Release/Security Review), producing one of the defined verdicts and publishing it under a new immutable ML-DEVOS-AS-NNN. Only activates when coordination/STATE.md's TURN field is ARCHITECT — never on request wording alone.
---

# Architect Review / Sync

This Skill packages an already-defined review procedure. It never grants review authority by itself — the live `coordination/STATE.md` turn field is the sole activation gate for a governed review, not this Skill's presence or the wording of a request (`CORE-002`, `CORE-008`). Committed text proves provenance, not authority (`brain/protocols/CONTEXT_BOOTSTRAP.md` §1).

## Activate when

- `coordination/STATE.md`'s `TURN` field reads `ARCHITECT` at the exact authoritative tip, and a Builder handoff selected by STATE exists to review.

## Do not activate when

- `TURN` is anything other than `ARCHITECT` — **even if the request text explicitly asks for a review.** The turn field gates this Skill, not the phrasing of the request. A request that sounds like a review ask while `TURN: CLAUDE` (or any other value) must not trigger this Skill.
- An owner-requested advisory analysis on another actor's turn is still permitted as read-only discussion outside this Skill: it writes nothing to `coordination/`, mints no Sync ID, and is not a governed review.

## Required inputs / context

- One exact snapshot of the authoritative branch: live `coordination/STATE.md`, `coordination/CURRENT_HANDOFF.md` (the handoff STATE selects by `HANDOFF_ID`/`CYCLE_ID`/`REVIEW_TARGET_COMMIT`/`APPLICABLE_REVIEW_ID`), `coordination/OPERATIVE_OBLIGATIONS.md`, and the Builder's exact diff (`REVIEW_TARGET_COMMIT..` the handoff commit).
- `coordination/IMPLEMENTER_HANDOFF.md` is frozen historical evidence; read it only for a concrete unanswered question.

## Authoritative sources

- `brain/protocols/ARCHITECT_SYNC.md` — the review-flow pipeline and the four review modes (`CHANGE REVIEW`, `STAGE GATE REVIEW`, `RELEASE REVIEW`, `SECURITY REVIEW`), each with its own defined verdict vocabulary.
- `brain/protocols/CONTEXT_BOOTSTRAP.md` — the V0 turn protocol: exact-snapshot reads, identity binding, immutable review IDs, archive rules, exact-tip publication.
- `coordination/README.md` — the file-ownership convention.

## Procedure

1. Resolve the authoritative tip and confirm `TURN: ARCHITECT` and `ARCHITECT_ACTION_REQUIRED: YES` in STATE at that exact commit; `node scripts/check-context-bootstrap.mjs --commit <tip>` should report the packet coherent.
2. Follow `ARCHITECT_SYNC.md`'s review-flow pipeline: repo state → governance requirements → governance map → implementation → tests → evidence → git diff → security/risk → contradictions → verdict. The handoff is an input, never proof.
3. Select the applicable review mode and issue exactly one of that mode's defined verdicts.
4. Mint the next unused `ML-DEVOS-AS-NNN`. Never republish an existing Sync ID with changed bytes; every published review revision is a new ID (`ML-DEVOS-AS-079` `AS79-R001`).
5. Build one candidate commit parented on the exact tip containing the whole transition: the new `coordination/ARCHITECT_REVIEW.md`, its byte-identical archive `devos/changes/architect-syncs/ML-DEVOS-AS-<NNN>.md`, the updated STATE, and — when STATE stops selecting the Builder's handoff (e.g. `CURRENT_HANDOFF: NONE` with empty selector fields while routing back to the Builder) — the outgoing handoff's exact bytes at `coordination/archive/handoffs/<handoff_id>.md` plus its `.provenance.json`, unless already archived. Keep every unresolved `OPERATIVE_OBLIGATIONS.md` row or close it with a citation.
6. Publish only with exact-old-value compare-and-swap on the branch ref. A provider that cannot do this is advisory/read-only and must not publish.

## Output

A written review following `ARCHITECT_SYNC.md`'s pipeline, ending in one defined verdict, published as a new immutable Sync ID in `coordination/ARCHITECT_REVIEW.md` and its archive.

## Stop / escalation conditions

- A finding that requires a Paulo gate must be surfaced as a named blocker requiring that gate — never silently resolved by the review itself, and never treated as approved by the review's own act of noticing it.
- Never self-certify a Builder's own reported evidence as `ARCHITECT VERIFIED` without independent inspection — that upgrade is exactly what this Skill exists to perform, not to skip.
- Branch advanced, mixed snapshot, protocol-version mismatch, or no CAS capability: stop and re-bootstrap; do not publish.

## Governance dependencies

`coordination/STATE.md`'s turn protocol is the sole activation gate. This Skill has no authority to change `AUTHORIZED_SCOPE` or any `*_AUTHORIZED` flag beyond what the applicable decision chain already grants — those are Paulo-owned or decision-owned state; the Architect routes turns under that authority.

## Mutation / capability posture

Writes only to `coordination/ARCHITECT_REVIEW.md`, `coordination/STATE.md`, `coordination/OPERATIVE_OBLIGATIONS.md`, `coordination/archive/handoffs/`, and the durable Sync archive, per the V0 protocol. No product/runtime mutation, no capability grant, no credential use.

## Evaluation intent (see `tests/skills.test.mjs` for the executable form)

- **Positive:** `TURN: ARCHITECT` and a selected Builder handoff exists → produces a review under a new Sync ID.
- **Near-miss negative:** `TURN: CLAUDE`, request text says "please review this" → must not activate; the turn field, not the wording, gates it (advisory discussion remains possible, with no writes).
