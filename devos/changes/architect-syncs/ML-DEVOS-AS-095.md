# Architect Review — SENTINEL S6 Core Implementation Remediation 1

Architect Sync: ML-DEVOS-AS-095
Status: CHANGES_REQUESTED — FINAL REMEDIATION CYCLE 2 OF 2
Review mode: IMPLEMENTATION STAGE GATE — AS-094 REMEDIATION RE-REVIEW
Cycle: SENTINEL_S6_CORE_IMPLEMENTATION
Authority: D-071 / ML-DEVOS-AS-094
Reviewed remediation commit: f92fabe3b4b91f856a853c22cc9825e7e8b48cd1
Reviewed remediation parent: a91c509ce3e16aef02e76f873f8893159a3eda71
Target design: ML-DEVOS-RFC-019 as approved by ML-DEVOS-AS-093
Remediation cycle: 1 of 2

## Verdict

AS94-F001: CLOSED for the original pre-lock freshness gap
AS94-F002: CLOSED
AS94-F003: CLOSED
AS94-F004: CLOSED
S6 CORE IMPLEMENTATION: CHANGES_REQUESTED
CURRENT REMEDIATION BUDGET: FINAL CYCLE 2 OF 2
REAL GENERIC EXECUTION DRIVER: NOT PRESENT
LIVE REMOTE TRANSPORT / CREDENTIALS: NOT PRESENT
S6 MANIFEST: remains NOT_IMPLEMENTED

The four AS-094 corrections are materially sound. Independent review found one broader
concurrency class that the F001 fix exposed: the per-task lock is used by claim, but
other permit/instance lifecycle mutations can still modify the same state outside that
lock. A lock is not a linearization boundary unless all competing mutations honor it.

A second, narrower lifecycle issue is that quiesce mutates the S6 environment state
without first re-checking S4 fencing even though RFC-019 §8 requires every mutating S6
step to check current S4 owner/revision/lease/state.

## AS94 findings

### AS94-F001 — CLOSED

The original flaw is corrected: claim now acquires the per-task lock before re-reading
binding/status/body, re-checks S4 under that lock, performs S5 last, and then transitions
to CLAIMED without another local lock wait.

The deterministic lock-contention tests exercise S4 revision/owner/lease changes and S5
revocation/expiry while claim waits.

### AS94-F002 — CLOSED

The immutable request binding is now the first durable commit point and carries the
complete permit body. Permit body/status/journal records are reconstructable derived
artifacts. Orphan artifacts without a binding are not permits. Fault and SIGKILL tests
cover each durable sub-step and replay the same permit when a binding exists.

### AS94-F003 — CLOSED

S6 no longer exports an argv-taking Git execution helper. The child-process runner is
module-private behind a closed set of named validated Git operations. The fixture
harness likewise exposes named fixed operations rather than fixtureGit(args). Source
tests and mutation tests enforce this boundary.

### AS94-F004 — CLOSED

The Execution Report validator/schema now require the complete RFC-019 report shape,
validate chronology/result/signal/digest consistency, and durably retain the report
fields plus report_digest. Positive/negative and mutation tests cover the contract.

## AS95-F001 — permit and instance lifecycle mutations do not share one linearization boundary

**Severity:** BLOCKING CONCURRENCY / STATE INTEGRITY

Claim now uses the task lock, but competing lifecycle code does not consistently use
that same lock.

Examples in the reviewed implementation:

- `quiesce()` calls `revokeIssued()` and then changes the instance state without
  acquiring the task lock;
- lazy `ISSUED -> EXPIRED_UNCLAIMED` in `currentPermitStatus()` writes permit
  status even when reached by replay/read paths outside the task lock;
- quarantine/recovery/cleanup paths can revoke issued permits outside the claim lock;
- `recordReport()` performs `CLAIMED -> REPORTED` and can save a previously loaded
  instance record without the task lock.

Therefore a claim can hold the task lock while another local path still mutates the same
permit/instance records. In the most direct case:

1. permit is ISSUED;
2. claim acquires the task lock and reads ISSUED;
3. concurrent quiesce, which does not honor that lock, marks the permit REVOKED;
4. claim completes its already-passed checks and writes CLAIMED;
5. the terminal revocation is overwritten, violating the permit lifecycle and the
   quiescence guarantee that an issued permit cannot be claimed after quiescence begins.

A similar stale-record race can occur between report/recovery/quarantine updates.

### Required correction

Establish one explicit S6 task-state linearization discipline:

- every mutation of permit lifecycle state and mutable instance lifecycle state that can
  race with another operation MUST either run under the same per-task lock or use an
  equally strong compare-and-set mechanism that cannot overwrite a newer terminal state;
- claim, quiesce, permit expiry/revocation, report recording, quarantine/recovery
  mutations, and any other transition touching those records must have a documented
  lock/CAS rule;
- avoid nested-lock deadlocks by splitting public lock-taking operations from private
  lock-held helpers;
- under the lock, always re-read the authoritative record/status immediately before
  transition; never save a stale pre-lock record over a newer state;
- terminal permit states must be monotonic: EXPIRED_UNCLAIMED or REVOKED can never
  become CLAIMED; QUARANTINED instance state can never be overwritten by a stale
  ATTACHED/QUIESCED record;
- preserve the late-report rule: evidence may be appended after quarantine, but the
  report must never un-quarantine or overwrite the terminal instance state.

### Required deterministic tests

At minimum:

- claim vs quiesce: whichever linearizes first has the defined outcome, and no
  REVOKED -> CLAIMED resurrection is possible;
- claim vs lazy expiry/replay at the claim deadline;
- claim vs quarantine/recovery revocation;
- report vs recovery/quarantine: late report is evidence-only and cannot restore an old
  instance state;
- simultaneous quiesce/report paths remain fail-closed or serialize correctly;
- mutation tests that deliberately remove the shared lock/CAS from each competing path
  must fail.

## AS95-F002 — quiesce mutates environment state without current S4 fencing

**Severity:** BLOCKING FENCING CONSISTENCY

RFC-019 §8 says every mutating S6 step first checks current S4 owner, revision, lease
and role state. `quiesce()` currently loads the instance, revokes permits, proves
groups empty, snapshots the tree and writes `QUIESCED` without a current S4
`getState()`/fencing check.

That allows a stale/expired/superseded instance to advance its S6 environment lifecycle
to QUIESCED after S4 ownership or revision has moved.

### Required correction

As part of the same task-lock transaction used to satisfy AS95-F001:

- re-read the instance;
- obtain current S4 state;
- apply the existing deterministic fencing checks and role-state check before revoking
  permits or committing QUIESCED;
- on fencing failure, fail closed with the existing ranked reason and do not represent
  quiescence as a current-owner transition;
- do not invent a new S4 interface or reason code.

Add focused tests for owner change, revision advance, lease expiry and role-state change
immediately before quiesce.

## Pre-S7 lesson application — recommendation, not authority

The S6 work now provides enough real failure evidence to justify a bounded **pre-S7
readiness checkpoint** after S6 technical acceptance/closure and before S7 design is
authorized.

That checkpoint should not reopen S6 or create a general governance workstream. It
should convert the reusable lessons into concrete S7 design inputs:

1. **Boundary Invariant Matrix** — for every S7 boundary: authoritative owner,
   mutable state, linearization point, evidence produced, and fail-closed outcome.
2. **Concurrency / linearization map** — every state mutation names the lock/CAS or
   other mechanism that orders competing transitions.
3. **Crash matrix** — enumerate every durable multi-step protocol and expected result
   before/after each durable write.
4. **Dangerous-primitive check** — mechanically reject generic process/network/storage
   mutation helpers where a closed operation can exist.
5. **Evidence completeness contract** — durable records must retain the fields needed
   to substantiate every claim S7 intends to make.
6. **Input Integrity as a first-class evidence precondition** — evidence about a run is
   not sufficient if the dataset/source/version/coverage/lineage feeding that run is
   unproven. S7 design should distinguish execution evidence from input-integrity
   evidence rather than conflating them.
7. **Independent falsification cases** — tests derived from forbidden outcomes and
   invariants, not only expected happy-path behavior.

This should be a short owner-authorized readiness/design-input cycle after S6, then the
roadmap should return immediately to S7 capability delivery.

## Scope / evidence disposition

INDEPENDENTLY_INSPECTED:
- exact Cycle-1 remediation delta;
- claim locking and S5/S4 ordering;
- request-binding crash protocol;
- fixed Git/fixture operation boundary;
- complete Execution Report validator/schema/storage;
- lifecycle/quiesce/recovery source paths revealing AS95-F001/F002.

ACTOR_REPORTED:
- Builder 743/743 test run;
- focused tests, mutation results, validators and traceability;
- Linux runtime execution.

No independent runtime reproduction is claimed in this review.

## Remediation scope — final Cycle 2 of 2

Claude / Builder is authorized to correct only AS95-F001 and AS95-F002 and directly
necessary focused tests/docs inside the D-071 S6-core boundary.

Allowed writes remain:
- devos/execution/**;
- tests/execution-*.test.mjs;
- narrowly necessary tests/fixtures/execution/**;
- deterministic traceability outputs if changed;
- factual RFC-019 / execution README notes if needed, without changing approved design;
- coordination STATE/CURRENT_HANDOFF return records.

No real execution driver, live remote transport, S3/S4/S5 mutation, manifest status
change, closure, version bump, S7+, CP-4+, deployment, main merge or PR #10 merge.

If another blocking implementation defect remains after this final ordinary remediation
cycle, route to Paulo instead of opening an unapproved third cycle.

## Routing

This review deselects and archives `H-S6-CORE-IMPL-REM1-0001` byte-for-byte.

Route:
- TURN: CLAUDE
- STATUS: AUTHORIZED
- CURRENT_REMEDIATION_CYCLE: 2
- MAX_REMEDIATION_CYCLES: 2
- IMPLEMENTER_ACTION_REQUIRED: YES
- ARCHITECT_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO
