# Architect Review — ML-DEVOS-RFC-016 S4 State Machine Kernel

Status: ARCHITECT_APPROVED — PAULO IMPLEMENTATION DECISION REQUIRED
Review mode: STAGE GATE REVIEW
Cycle: SENTINEL_S4_STATE_MACHINE_PROPOSAL
Final reviewed HEAD: e084699212d0aeca9ad3ae2827127d51df4bd5b5
Original proposal HEAD: 4e9b6aeacd2977051f08c450eeef966ab43b17c4
Remediation authorities: D-048, D-049
Proposed durable sync ID on conclusion: ML-DEVOS-AS-065

## Final independent review

The S4 State Machine Kernel proposal is architecturally compatible and implementation-ready as a design, subject to Paulo's separate implementation/policy decision below.

### Findings disposition

- AS65-F001 — persistence/CAS/single-writer correctness: CLOSED.
  - Normal writers are serialized by exclusive-create lock acquisition.
  - revision validation occurs inside the lock-held read/validate/mutate/persist boundary.
  - automatic age-based stale-lock stealing has been removed.
  - an existing/suspected orphan lock now fails closed; ordinary mutation does not unlink or bypass it.
- AS65-F002 — cross-role ownership handoff deadlock: CLOSED.
- AS65-F003 — task retry policy coupled to bootstrap coordination state: CLOSED.
- AS65-F004 — mutating-operation idempotency semantics: CLOSED.
- Four prior non-blocking clarifications: CLOSED.

No executable S4 implementation exists yet. All implementation-mapping rows remain NOT STARTED.

## Micro-remediation review — D-049

The cycle-2 delta is accepted.

On ordinary mutation, EEXIST no longer leads to timestamp-age inspection or lock stealing. The RFC now returns deterministic LOCK_HELD / LOCK_RECOVERY_REQUIRED with no state mutation. A genuinely orphaned lock may be cleared only through a distinct, out-of-band operator/admin maintenance path after independently confirming no active writer remains.

This closes the two-writer safety failure identified in the prior review. The accepted V1 trade-off is availability over unsafe autonomous recovery: one crashed writer may temporarily block one task, but the kernel never regains availability by creating two possible authoritative writers.

The planned test mapping now explicitly requires an orphan-lock test proving that lock age never causes ordinary mutation to auto-unlink the lock.

## Architect resolutions of RFC-016 open questions

### Q1 — FAILED / ABANDONED terminal states

Architect position: ACCEPTABLE DESIGN, BUT REQUIRES EXPLICIT PAULO ADOPTION.

FAILED and ABANDONED solve real lifecycle gaps and are compatible with the intended state-machine architecture. However, they add states to the frozen ML-DEVOS-ARCH-001 §10 lifecycle. Architect approval of RFC-016 recommends the amendment; it does not by itself rewrite frozen architecture.

Before implementation, Paulo's implementation Decision must explicitly adopt these two additive terminal states for S4. ML-DEVOS-ARCH-001 itself is not edited during this design review.

### Q2 — passive sweep_expired_leases boundary

Architect decision: ACCEPTED FOR V1.

S4 remains a deterministic state kernel rather than an active scheduler. sweep_expired_leases() is a passive query; autonomous polling/dispatch remains S8 Orchestrator territory. No S4 daemon or autonomous timeout transition is introduced.

### Q3 — Task Policy retry-ceiling scope

Architect decision: PER-PROJECT FOR V1.

Use one versioned S4 Task Policy for Dillaab-source/maisog-labs rather than adding retry policy to each S3 Task Contract. This avoids reopening the S3 schema and keeps policy separate from task description.

The actual numeric build/QA/review retry ceiling is intentionally unresolved and must be explicitly set by Paulo before implementation. Builder may not invent the number.

### Q4 — transition history boundary

Architect decision: ACCEPTED INSIDE TASK ENGINE STATE FOR V1.

A compact, bounded transition-provenance history may remain inside each task-state record when limited to state-change metadata such as from/to, actor/reference, timestamp, idempotency reference and evidence reference. Raw commands, logs, failures, token/cost/timing telemetry and execution narrative remain future Run History / S11 concerns.

### Q5 — force_clear_lock authorization

Architect decision: AUTHORIZATION MUST BE EXPLICIT BEFORE IMPLEMENTATION.

force_clear_lock (or equivalent) is not part of ordinary Builder/task mutation and must never be implicitly available merely because a process can access the filesystem.

V1 implementation must treat it as a separate maintenance capability:
- ordinary claim/renew/release/transition paths cannot invoke it;
- invocation requires a Paulo-authorized operator/admin role or explicit Decision reference;
- caller/operator identity and reason are recorded;
- the operator must confirm out-of-band that no writer remains;
- it grants no general task-transition, merge, deployment or remote-resource authority.

The exact code/API shape may be chosen during bounded S4 implementation, but this authority boundary is part of the accepted design.

## Traceability / scope audit

Independently inspected:
- exact D-049 delta from 7ef86f35336857d10a5ce4f01f41371a500e959c to e084699212d0aeca9ad3ae2827127d51df4bd5b5;
- changed-file set: RFC-016, two deterministic traceability outputs, coordination STATE and IMPLEMENTER_HANDOFF only;
- generated TRACEABILITY_INDEX.md reports 249 scanned files, 2 errors, 15 warnings, 253 canonical definitions;
- remaining ERROR fingerprint is the known pre-existing CORE-022 + WEB-REQ-009 pair;
- no executable S4 file under devos/state/ was introduced.

Builder's command execution remains ACTOR_REPORTED; this Architect review independently inspected the resulting artifacts/diff. No executable behavior exists to independently reproduce yet.

## Stage-gate verdict

S4 DESIGN STAGE GATE: ARCHITECT_APPROVED
RFC-016 DESIGN: ACCEPTED FOR BOUNDED IMPLEMENTATION
READY TO IMPLEMENT: REQUIRES PAULO DECISION
S4 IMPLEMENTATION AUTHORITY: NOT YET GRANTED

This approval is a technical recommendation only. Capability != authority remains unchanged.

## Paulo decision package required before Builder implementation

A single explicit Paulo decision may now:
1. authorize bounded S4 implementation of the accepted RFC-016 design;
2. explicitly adopt FAILED and ABANDONED as additive S4 lifecycle terminal states;
3. set the V1 per-project retry ceiling values (build / QA / review);
4. authorize the bounded operator/admin force-clear-lock maintenance capability and its required provenance;
5. preserve all remote/deploy/protected-main prohibitions;
6. return implementation to Architect for independent review before closure.

No implementation begins until those items are explicit.

## LEAN / DELTA-ONLY BUILDER MODE — STANDING RULE

Future Claude Builder turns remain lean:
- read STATE.md, ARCHITECT_REVIEW.md and exact authorized mutation files first;
- read additional repository sources only when an active finding or implementation requirement requires them;
- do not reread full governance history;
- do not restate prior-cycle narrative;
- smallest coherent delta only;
- only relevant tests/checks;
- compact IMPLEMENTER_HANDOFF;
- one commit where practical;
- return gate then stop.

This efficiency rule changes context consumption only, never authority or evidence requirements.
