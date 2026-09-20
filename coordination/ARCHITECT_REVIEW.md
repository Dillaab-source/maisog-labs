# Architect Builder Brief — S4 Closure D.2 Candidate

Status: AUTHORIZED CLOSURE
Cycle: SENTINEL_S4_STATE_MACHINE_CLOSURE
Authority: D-051
D.1 preflight: ML-DEVOS-AS-067 — PASS
Technical acceptance: ML-DEVOS-AS-066
Closure ADR allocation: ML-DEVOS-ADR-014
Release: v1.6.0 → v1.7.0 MINOR

## Objective

Execute exactly the S4 closure package authorized by D-051, then return it for D.2 Post-decision Closure Verification.

Do not implement new S4 behavior. Do not start S5 or website/product work.

## LEAN / DELTA-ONLY reads

Read first:
1. coordination/STATE.md
2. this brief
3. ML-DEVOS-AS-067 only for exact D.1 package details
4. ML-DEVOS-AS-066 only for accepted implementation/evidence facts
5. exact closure files below

Do not reread full governance history.

## Required closure mutations

1. Create `devos/changes/adrs/ML-DEVOS-ADR-014.md` adopting S4.
2. Add ADR-014 to ADR README.
3. Mark RFC-016 `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-014 / D-051`; preserve its proposal body/history.
4. Update RFC README's RFC-016 one-line description to closed/implemented truth.
5. Update `devos/state/README.md` to closed/implemented truth.
6. Update `devos/devos-manifest.json`:
   - devos/state status IMPLEMENTED
   - closure_ref ML-DEVOS-ADR-014
   - executable_runtime_present false
   - sentinel baseline v1.7.0 / ADR-014 / D-051 / ADR-014 document
   - append S4 closure_history entry using ML-DEVOS-AS-066
   - updated_at 2026-09-21
   - manifest_version remains "1"
7. Update `VERSIONING_POLICY.md` current baseline to v1.7.0 and add the S4 MINOR transition record.
8. Narrowly amend `ML-DEVOS-ARCH-001` §10 only:
   - add FAILED / ABANDONED as S4 terminal states;
   - no outgoing transition from FAILED/ABANDONED/VERIFIED;
   - terminal recovery opens a new task;
   - cite RFC-016 / AS-065 / D-050 / AS-066 / AS-067 / D-051 / ADR-014;
   - architecture id/version/status remain ML-DEVOS-ARCH-001 / 1.2.0 / FROZEN.
9. Regenerate deterministic traceability outputs.
10. Update compact IMPLEMENTER_HANDOFF and STATE for D.2 review.

## ADR-014 must preserve

- accepted implementation HEAD 72cd84a8fedb581306c023ee88e1b0f1c4d5293c
- Task Policy build=2 / qa=2 / review=2
- fail-closed lock recovery, Paulo-only default force-clear operator
- expectedRevision replay-identity correction
- NOT_CURRENT_OWNER vs REVISION_CONFLICT diagnostic split
- claim revision prose/API discrepancy
- Builder suite remains ACTOR_REPORTED
- Architect independently inspected source/diff and spot-executed critical remediation invariants
- S5/S7/S8/S9/S13 absent
- runtime flag false because no active operational Sentinel runtime invokes this library

## Exact write whitelist

- brain/DECISION_LOG.md: DO NOT EDIT — D-051 is already recorded
- devos/changes/adrs/ML-DEVOS-ADR-014.md
- devos/changes/adrs/README.md
- devos/changes/rfcs/ML-DEVOS-RFC-016.md
- devos/changes/rfcs/README.md
- devos/state/README.md
- devos/devos-manifest.json
- devos/governance/specifications/VERSIONING_POLICY.md
- devos/architecture/ML-DEVOS-ARCH-001.md
- devos/governance/traceability/traceability-index.json
- devos/governance/traceability/TRACEABILITY_INDEX.md
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

No other file.

## Verification

Run:
- devos manifest validator;
- focused manifest tests;
- traceability generate + validate;
- any deterministic architecture/RFC/ADR index checks already present and directly relevant;
- exact diff whitelist.

Expected traceability baseline before closure:
CORE-022 + WEB-REQ-009 only (2 errors / 14 warnings).

After closure:
- no new unexpected ERROR;
- derived index no drift;
- baseline findings remain unless legitimately resolved by the closure diff.

Do not rerun unrelated application tests.

## Return gate

When closure candidate is complete:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- AUTHORIZED_SCOPE: S4_CLOSURE_D2_VERIFICATION_ONLY
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO
- all remote/deploy/main flags NO

Then stop. S4 is not workflow-final until Architect D.2 verification passes.
