# Current Directive — RFC-023 / V2.1 Cycle B (D-128)

```yaml
schema_version: 1
directive_id: DIR-DEVOS-RFC023-CYCLE-B-0001
cycle_id: MAISOGLABS_DEVOS_RFC023_V21_CYCLE_B
issue_parent_commit: 1e5a8a5bacb7e60cab7df4cb226613a8f72ace01
target_turn: CLAUDE
authority_ref: D-128
applicable_review_id: ML-DEVOS-AS-155
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-128 and `ML-DEVOS-AS-155`. Claude/Builder prepared it as mechanical publisher of D-128, as for D-125 and D-127.

## Objective

Implement `ML-DEVOS-RFC-023` BC-12 (the attempt-ledger chain) and BC-10 (the RFC lifecycle-projection checks), plus the AS-155 §6a one-line wording reconciliation, with tests. Then return.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `CURRENT_REMEDIATION_CYCLE: 0`; every action flag is `NO`.
- The existing attempt ledger is left untouched.

## Governing references

- **T0:** D-128; `ML-DEVOS-AS-155` (follow-ups A and C); live STATE.
- **T1:** `ML-DEVOS-RFC-023` BC-10, BC-12, BC-4 and §6 (tests); `brain/protocols/CONTEXT_BOOTSTRAP.md` §3 item 7, §6a, §8; `OBL-023`.

## Exact execution scope

Allowed:
- **B1.** `scripts/check-context-bootstrap.mjs` and `tests/context-bootstrap.test.mjs` (`tests/context-bootstrap-v2.test.mjs` only if the existing test organization genuinely needs it).
- **B2.** `devos/governance/traceability/validate-traceability.mjs` and `tests/traceability.test.mjs`.
- **B3.** `brain/protocols/CONTEXT_BOOTSTRAP.md` §6a, one sentence only.
- One Protocol V2 Builder return.

Not allowed: `generate-traceability.mjs` (stop and report if it appears necessary); regenerated traceability output; unrelated traceability debt; editing, resetting or deleting the ledger; RFC-023 redesign; STATE schema or `PROTOCOL_VERSION`; any envelope; product, production, deploy, `main`, D1/R2, Access/DNS/bindings/secrets/environment; S6/S7; D-068; mobile.

## SENTINEL Sync

- **Authority:** D-128 (Paulo), after `ML-DEVOS-AS-155`.
- **Context:** Cycle A is accepted and closed. BC-10 and BC-12 were adopted but left unimplemented.
- **Capability:** repository code and tests only, with hermetic fixtures.
- **Evidence:** the three governance suites, the Skills suite, the checker, the validator delta against the Cycle A baseline, and a manual changed-file inspection.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **B3 vs §3 item 7:** §3 item 7 describes the old default key as current "until the separately authorized Cycle B implements BC-12". That wording is self-expiring and stays accurate once B1 lands, so D-128's §6a-only limit holds and §3 is not edited.

## Instructions

1. Bootstrap on the issue commit.
2. Implement B1 with the eight RFC-023 ledger tests plus the chain-boundary test.
3. Implement B2 with the ten BC-10 tests on hermetic fixtures.
4. Apply B3.
5. Validate and collect the evidence D-128 § Validation lists; publish the return.

## Validation and evidence

D-128 § Validation in full, including the before/after D-112 regression, the ledger entry shape, example chains, live RFC-projection findings and the global traceability delta.

## Stop conditions

- `generate-traceability.mjs` or any file outside the allowed set appears necessary.
- A required behavior would change `UNKNOWN_OUTCOME` or read-back semantics.
- Any existing test fails for a reason other than this cycle's intended change.

## Next action

Publish `H-DEVOS-RFC023-CYCLE-B-0001`. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.
