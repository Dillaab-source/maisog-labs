# Current Directive — RFC-023 / Context Bootstrap V2.1 Cycle A (D-127)

```yaml
schema_version: 1
directive_id: DIR-DEVOS-RFC023-CYCLE-A-0001
cycle_id: MAISOGLABS_DEVOS_RFC023_V21
issue_parent_commit: 4e8a4789e2289477b6bf10076f86a36b1e1a04d3
target_turn: CLAUDE
authority_ref: D-127
applicable_review_id: ML-DEVOS-AS-153
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-127 and `ML-DEVOS-AS-153`. It was prepared by Claude/Builder as mechanical publisher of D-127, as for D-125.

## Objective

Carry out the accepted V2.1 policy / document / record migration (D-127 Cycle A items 1–11) without any code, checker, validator, test, STATE-schema or production change, and return one bounded handoff for Architect review.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; every action flag is `NO`.
- The Architect review records `ML-DEVOS-AS-151`, `AS-152` and `AS-153` and the D-127 record are present at the issue commit (D-127 item 1 and item 3; published in this issue transition so the directive can bind to `ML-DEVOS-AS-153`).

## Governing references

- **T0:** Protocol V2; D-127; live STATE; `ML-DEVOS-AS-153` (with `AS-151`, `AS-152`).
- **T1:** V2.1 revision 3, which becomes `ML-DEVOS-RFC-023`; `brain/protocols/CONTEXT_BOOTSTRAP.md` §3–§5, §8, §10; `brain/protocols/ARCHITECT_SYNC.md`; `ML-DEVOS-RFC-008` CORE-020; `ML-DEVOS-AS-132` AS132-F003; `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §3.

## Exact execution scope

Allowed (D-127 items 1–11):
- the three immutable Architect review records (done at issue) and the D-127 record (done at issue);
- create `devos/changes/rfcs/ML-DEVOS-RFC-023.md` from revision 3, using the canonical Status line from creation;
- amend `brain/protocols/ARCHITECT_SYNC.md`, `brain/protocols/CONTEXT_BOOTSTRAP.md`, `CLAUDE.md`;
- amend canonical Skills under `.agents/skills/` only where they actually restate changed policy, then regenerate `.claude/skills/` with the existing generator;
- `coordination/OPERATIVE_OBLIGATIONS.md`: add the STATE-only obligations first, keep OPEN/DEFERRED rows fully descriptive, compact CLOSED/SUPERSEDED rows to five-cell stubs, preserve every ID and source/closure reference;
- rewrite `devos/changes/rfcs/README.md` as the subordinate lifecycle projection, one row per RFC, restoring RFC-011 and RFC-020;
- replace line 3 of RFC-001…022 and the template's Status line with the canonical pointer;
- thin the STATE body at the return transition, after the obligations are preserved;
- one Protocol V2 Builder return.

Not allowed:
- `scripts/check-context-bootstrap.mjs`, the attempt ledger, the traceability validator, or any test (Cycle B);
- any STATE header or schema change; any `PROTOCOL_VERSION` change;
- any change to archive behavior, or to existing archive entries;
- any envelope grant;
- production, deployment, `main` merge, D1/R2, Access/DNS/bindings/secrets/environment, website/product code, Tier 2, S6/S7, D-068, mobile.

## SENTINEL Sync

- **Authority:** D-127 (Paulo), after `ML-DEVOS-AS-153`.
- **Context:** the V2.1 design passed three Architect reviews (`AS-151`, `AS-152`, `AS-153`); `AS-153` accepted revision 3 for owner adoption and confirmed BC-1 point 6.
- **Capability:** repository documentation and record edits only; the existing checker, run unchanged, and the existing Skills-bridge generator.
- **Execution:** records at issue → RFC-023 → policy text → Skills check → obligations → RFC projection and status lines → thin STATE with the return.
- **Evidence:** checker `--check-only` on each candidate; the existing test suites unchanged; mechanical status-line and index-row counts; a manual inspection of the changed-file set (AS132-F003).

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **D-126 reservation vs D-127:** D-126 reserved governance-architecture amendments for the retrospective. D-127 narrowly supersedes that reservation for RFC-023 only. The other D-126 learnings stay unadopted, and RFC-023 must not be represented as adopting them.
- **Review-record fidelity:** the first review's relay contains three elided `Pasted text` quotations. The owner decided to persist it as relayed, with the gaps disclosed (recorded in D-127).
- **Validator gap until Cycle B:** the BC-10 validator checks and the BC-12 ledger repair are adopted but not implemented. Until Cycle B, the canonical status lines and index rows are checked mechanically in the handoff, not by the validator.

## Instructions

1. Bootstrap on the issue commit; stop on any mismatch.
2. Create RFC-023 from revision 3, with a provenance section.
3. Amend the policy text and `CLAUDE.md`; check the Skills for restated policy.
4. Migrate obligations, the RFC projection, the status lines and the template.
5. Validate as D-127 § Validation requires; inspect the changed-file set manually.
6. Publish the return.

## Validation and evidence

D-127 § Validation, in full.

## Stop conditions

- Any required change would touch code, tests, the checker, the validator, the STATE schema or production.
- An exact review or record needed for fidelity cannot be recovered.
- An unresolved obligation would be dropped or rewritten.
- The checker fails, or the existing tests fail.

## Next action

Publish `H-DEVOS-RFC023-CYCLE-A-0001`. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.
