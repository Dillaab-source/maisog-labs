# Architect Review — SENTINEL S6 Core Final Ordinary Re-review

Architect Sync: ML-DEVOS-AS-096
Status: CHANGES_REQUESTED — REMEDIATION BUDGET EXHAUSTED / PAULO DECISION REQUIRED
Review mode: IMPLEMENTATION STAGE GATE — AS-095 FINAL REMEDIATION RE-REVIEW
Cycle: SENTINEL_S6_CORE_IMPLEMENTATION
Authority: D-071 / ML-DEVOS-AS-095
Reviewed remediation commit: 3b64aa68b431602fa7f78ac270260f308e896033
Reviewed remediation parent: 8e9982f6cb2925ff0364436addc7b026f834ac60
Target design: ML-DEVOS-RFC-019 as approved by ML-DEVOS-AS-093
Remediation cycle: 2 of 2 — maximum reached

## Verdict

AS95-F001: CLOSED for local permit/instance/RTR mutation serialization
AS95-F002: CLOSED
AS94-F001/F002/F003/F004: remain CLOSED
S6 CORE IMPLEMENTATION: CHANGES_REQUESTED
REMEDIATION BUDGET: EXHAUSTED — OWNER DECISION REQUIRED
REAL GENERIC EXECUTION DRIVER: NOT PRESENT
LIVE REMOTE TRANSPORT / CREDENTIALS: NOT PRESENT
S6 MANIFEST: remains NOT_IMPLEMENTED
S6 CLOSURE: NOT READY

The Cycle-2 remediation materially fixes the shared local linearization problem:
permit, instance and RTR mutations now funnel through one per-task lock, re-read
authoritative state, and use monotonic transition/CAS guards. Quiesce now performs
current S4 fencing under that same lock.

One distinct publication-reservation blocker remains at the boundary between the
locked local write-ahead record and the intentionally unlocked S4 publication
transition. Because the ordinary remediation cap is already 2 of 2, the Architect
does not open another cycle. Paulo must decide whether to authorize one exceptional
micro-remediation.

## Independent review basis

The Architect independently inspected authoritative commit
`3b64aa68b431602fa7f78ac270260f308e896033`, parent
`8e9982f6cb2925ff0364436addc7b026f834ac60`, the exact Cycle-2 delta,
`host.mjs`, `registry.mjs`, `journal.mjs`, the new linearization tests,
mutation tests, and the RFC-019 publication/lifecycle contract.

The changed-file set remains within AS-095 scope. The manifest is unchanged. No
S3/S4/S5 source/interface mutation, real execution driver, live remote transport,
credential, closure/version change, deployment, main merge or PR #10 merge is present.

Builder runtime evidence remains ACTOR_REPORTED. This review is
INDEPENDENTLY_INSPECTED for source/diff/lifecycle semantics; no independent runtime
reproduction is claimed.

## AS95-F001 — CLOSED for the authorized local mutation problem

The implementation now provides:

- one `locked(taskId,...)` entry point over the per-task registry lock;
- re-read-under-lock before mutable instance/permit/RTR transitions;
- no read-path write for lazy permit expiry;
- version CAS and legal-transition tables for mutable instance and permit state;
- monotonic terminal states;
- report/quiesce/recovery/quarantine serialization;
- a journal append lock to prevent two writers extending one chain head;
- deterministic claim/quiesce, report/recovery, expiry and quarantine interleavings;
- mutation tests that remove the lock/CAS/monotonic guards and are killed.

This closes the original AS95-F001 defect: a local REVOKED/EXPIRED permit can no
longer be resurrected to CLAIMED by a competing local mutation, and stale instance
records cannot overwrite a newer terminal state.

## AS95-F002 — CLOSED

Quiesce now:

1. acquires the per-task lock;
2. re-reads the instance;
3. obtains current S4 state;
4. applies existing owner/revision/lease/role-state fencing;
5. only after those checks revokes outstanding permits and proves quiescence;
6. commits QUIESCED under the same local lock.

Focused tests cover owner change, revision advance, lease expiry and role-state
change. No new S4 interface or reason code was introduced.

## AS96-F001 — PENDING publication does not reserve the local instance lifecycle

**Severity:** BLOCKING PUBLICATION / CONCURRENCY INVARIANT

RFC-019's Builder publication is a write-ahead protocol:

`QUIESCED local instance -> PENDING RTR -> S4 transition -> COMMITTED/ABORTED RTR`.

The PENDING record exists specifically because the S4 transition occurs outside the
local S6 task lock and must be recoverable after a crash.

The implementation correctly blocks `attach()` when `hasPendingPublication(record)`
is true. But `finishWithoutPublication()` and `cleanup()` do not consult that
reservation.

A valid interleaving therefore exists:

1. Builder instance is QUIESCED.
2. `complete()` pushes/verifies and, under the task lock, writes an RTR as PENDING.
3. It releases the task lock before the external S4 transition, as designed.
4. A concurrent `finishWithoutPublication()` acquires the task lock, sees QUIESCED,
   writes local state COMPLETED and journals FINISHED_WITHOUT_PUBLICATION.
5. `cleanup()` may then move that local instance to CLEANED.
6. The original `publish()` still calls S4 with the valid pre-revision and can
   successfully transition BUILDING -> READY_FOR_QA.
7. It then commits the RTR. Because the fresh local instance is no longer QUIESCED,
   the code deliberately does not rewrite it.

The resulting evidence is contradictory: the local lifecycle can say
FINISHED_WITHOUT_PUBLICATION / CLEANED while S4 and the COMMITTED RTR say the result
was published to READY_FOR_QA.

The same class exists earlier in completion: a competing finish can win after the
remote push but before the local pushed-sha/PENDING commit, leaving an intentionally
"finished without publication" instance with a stale pushed branch. The latter can be
treated as stale-unpublished transport residue, but once PENDING exists the publication
transaction itself needs an explicit local reservation.

### Why the Cycle-2 lock/CAS does not solve this

Every individual local mutation is serialized correctly. The problem is that the
publication transaction intentionally spans an external S4 effect while the local lock
is released. Serialization therefore also needs a **transaction reservation invariant**
across that unlocked external-effect window.

The presence of an unresolved PENDING RTR is already the natural durable reservation.
It is used for crash recovery and already blocks attach; it is not yet enforced against
all incompatible terminal local lifecycle operations.

## Required correction if Paulo authorizes one exceptional micro-remediation

Do not redesign S4, the RTR, or the publication algorithm. Correct only this
reservation boundary:

- define an unresolved PENDING RTR for an instance as an active publication
  reservation;
- while that reservation exists, incompatible local lifecycle operations MUST fail
  closed rather than move the instance to a state contradicting the pending
  publication;
- at minimum `finishWithoutPublication()` and `cleanup()` must not cross a pending
  publication;
- review the other mutable local lifecycle operations and explicitly classify them as
  either:
  1. allowed while PENDING because they cannot contradict publication/recovery; or
  2. blocked until the RTR becomes COMMITTED/ABORTED;
- preserve crash recovery: `publish()/resolvePending()` must remain able to resolve
  the same stored PENDING RTR after restart;
- preserve the accepted behavior where a publication already accepted by S4 may commit
  its RTR even if the local instance has been quarantined for independent safety
  reasons; quarantine must not be silently reversed;
- do not hold the local task lock across the external S4 transition merely to hide the
  race. The correction should preserve the write-ahead/recovery design and use the
  durable PENDING reservation.
- add deterministic interleaving tests:
  - after PENDING exists and before S4 transition, competing
    `finishWithoutPublication()` is refused and publication can resolve exactly once;
  - cleanup cannot cross an unresolved PENDING publication;
  - after ABORTED, the allowed local disposition is explicit and deterministic;
  - after COMMITTED, replay/recovery remains idempotent;
  - a mutation that removes the PENDING guard is killed.

This is a narrow S6 implementation correction. It requires no RFC architecture change
unless the Builder finds the approved write-ahead protocol itself cannot satisfy it.

## Evidence disposition

INDEPENDENTLY_INSPECTED:
- authoritative Cycle-2 commit and parent;
- exact changed-file set;
- shared task-lock/CAS implementation;
- quiesce S4-fencing correction;
- monotonic permit/instance/RTR guards;
- publication PENDING -> external S4 -> COMMITTED/ABORTED sequence;
- absence of a PENDING-publication guard in finishWithoutPublication/cleanup;
- absence of a focused publication-vs-finish/cleanup interleaving test.

ACTOR_REPORTED:
- 768/768 Builder test run;
- 33/33 mutation suite;
- validators and traceability results;
- Linux runtime execution.

No RUNTIME_OBSERVED or INDEPENDENTLY_REPRODUCED claim is made.

## Owner gate — remediation budget exhausted

The ordinary remediation budget is exhausted at 2 of 2.

The Architect recommends, but does not authorize, one exceptional micro-remediation
limited exactly to AS96-F001.

Paulo may:
1. authorize one exceptional AS96-F001-only implementation micro-remediation; or
2. keep S6 unclosed and require a broader redesign/review.

Until Paulo decides, no Builder action is authorized.

## Post-S6 / pre-S7 direction

The pre-S7 readiness checkpoint recorded in AS-095 remains recommended after S6
technical acceptance/closure. The AS96-F001 finding strengthens one of its central
lessons: a linearization map must cover **transactions spanning unlocked external
effects**, not merely individual local writes.

No S7 work is authorized by this review.

## Hard boundaries

No safety-control bypass or permission expansion.
No generic command-execution implementation.
No real execution-driver implementation.
No standing live S6 GitHub transport authority.
No real S6 network writes or credentials.
No S3/S4/S5 mutation.
No manifest status/root/closure change.
No S6 closure or Sentinel version bump.
No S7+.
No S8/S9.
No CP-4+.
No Model Router.
No dynamic plugin discovery.
No remote D1/R2.
No Cloudflare production/deployment mutation.
No production-data writes.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.
No automatic stale-branch deletion.
No L4/container/VM implementation.

## Routing

This review deselects and archives `H-S6-CORE-IMPL-REM2-0001` byte-for-byte with
provenance.

Route:
- TURN: PAULO
- STATUS: PAULO_DECISION_REQUIRED
- CURRENT_REMEDIATION_CYCLE: 2
- MAX_REMEDIATION_CYCLES: 2
- IMPLEMENTER_ACTION_REQUIRED: NO
- ARCHITECT_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: YES

No third remediation cycle is opened by AS-096.
