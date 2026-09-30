# Current Directive — RFC-023 Cycle A remediation 1 (AS-154-F001)

```yaml
schema_version: 1
directive_id: DIR-DEVOS-RFC023-CYCLE-A-REM1-0001
cycle_id: MAISOGLABS_DEVOS_RFC023_V21
issue_parent_commit: 0e6711b089a52a160102c1c0cba6a7a67abf30fa
target_turn: CLAUDE
authority_ref: D-127
applicable_review_id: ML-DEVOS-AS-154
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-127 and `ML-DEVOS-AS-154`. `ML-DEVOS-AS-154` instructed its issue. Claude/Builder prepared these bytes as publisher, restating only the review's "Exact remediation", "Do not change" and "Routing" sections.

## Objective

Remediate `AS-154-F001` only: propagate the BC-4 Author ≠ Publisher path consistently to `CLAUDE.md`'s write gate, `ARCHITECT_SYNC.md`'s turn protocol and the `architect-review-sync` Skill (plus its generated bridge). Then return.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `CURRENT_REMEDIATION_CYCLE: 1` of `MAX_REMEDIATION_CYCLES: 2`; every action flag is `NO`.

## Governing references

- **T0:** D-127; `ML-DEVOS-AS-154` (§ Exact remediation A–D, § Do not change, § Routing); live STATE.
- **T1:** `ML-DEVOS-RFC-023` BC-4; `OBL-012`; `OBL-023`.

## Exact execution scope

Allowed:
- **A.** `CLAUDE.md`: clarify the write gate. Builder-authored governed work needs `TURN: CLAUDE` + `IMPLEMENTER_ACTION_REQUIRED: YES`. The BC-4 mechanical-publisher exception on an Architect turn applies under the five AS-154 conditions and grants no authority to author, alter or approve.
- **B.** `brain/protocols/ARCHITECT_SYNC.md` § Turn protocol: Architect = author/reviewer; publisher = Architect if `OBL-012` is satisfied, otherwise Builder or Paulo publishes the exact bytes unchanged. The BC-4 contract itself is unchanged.
- **C.** `.agents/skills/architect-review-sync/SKILL.md`: only the passages that restate publication mechanics, per AS-154 C, preserving the listed items.
- **D.** Regenerate `.claude/skills/` with `node scripts/generate-claude-skills-bridge.mjs`.
- One Protocol V2 Builder return (handoff, STATE, directive archive; obligations carried forward unchanged).

Not allowed: `ML-DEVOS-RFC-023`; RFC lifecycle mappings or status lines; obligation changes beyond carry-forward; the attempt ledger, the traceability validator, `scripts/check-context-bootstrap.mjs`, any test; product/website files; production resources; unrelated stale wording; any reopened Cycle A judgment.

## SENTINEL Sync

- **Authority:** D-127 Cycle A, via the `ML-DEVOS-AS-154` remediation routing (cycle 1 of 2).
- **Context:** Cycle A is accepted apart from `AS-154-F001`.
- **Capability:** documentation edits; the existing bridge generator and validator.
- **Evidence:** bridge validator, `tests/skills.test.mjs`, the Context Bootstrap suites, the checker, and a manual changed-file inspection (`OBL-023`).

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR`. The finding is the contradiction itself (BC-4 vs the unqualified write gate and the Skill's "must not publish"); the remediation removes it without changing BC-4.

## Instructions

1. Bootstrap on the issue commit.
2. Apply A, B and C minimally; run D.
3. Validate as AS-154 § Routing requires.
4. Publish the return.

## Validation and evidence

Skills bridge generator and validator; `tests/skills.test.mjs`; `tests/context-bootstrap.test.mjs` and `tests/context-bootstrap-v2.test.mjs`; checker `--check-only`; manual inspection of the exact changed-file set; confirmation that no Cycle B file changed.

## Stop conditions

- Any required edit would touch a file outside A–D or the return transition.
- The bridge cannot be regenerated with the existing generator.
- Any check fails.

## Next action

Publish `H-DEVOS-RFC023-CYCLE-A-REM1-0001`. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.
