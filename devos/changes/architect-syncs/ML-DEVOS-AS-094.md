# Architect Review — SENTINEL S6 Core Implementation

Architect Sync: ML-DEVOS-AS-094
Status: CHANGES_REQUESTED — REMEDIATION CYCLE 1 OF 2
Review mode: IMPLEMENTATION STAGE GATE — D-071 S6 CORE
Cycle: SENTINEL_S6_CORE_IMPLEMENTATION
Authority: D-071 / ML-DEVOS-AS-093
Reviewed implementation commit: f6c631f4a1671d2d04879ce1c18800881e7be5c4
Reviewed implementation parent: db73a73fab022405d0882ec75f4f40a97cc5adea
Target design: ML-DEVOS-RFC-019 as approved by ML-DEVOS-AS-093
Remediation cycle: 0 of 2 before this review

## Verdict

S6 CORE IMPLEMENTATION: CHANGES_REQUESTED
D-071 SCOPE COMPLIANCE: PASS WITH CORRECTIONS REQUIRED
REAL GENERIC EXECUTION DRIVER: NOT PRESENT
LIVE S6 REMOTE TRANSPORT / CREDENTIAL USE: NOT PRESENT
S3/S4/S5 SOURCE OR INTERFACE MUTATION: NOT PRESENT
S6 MANIFEST: CORRECTLY NOT_IMPLEMENTED / executable_runtime_present=false
S6 CLOSURE / VERSION BUMP: NOT PRESENT
Builder evidence: ACTOR_REPORTED
Architect evidence: INDEPENDENTLY_INSPECTED source/diff only

The implementation is structurally aligned with the approved S6-core architecture and
keeps the real execution driver out of scope. Four bounded implementation defects must
be corrected before technical acceptance.

## Independent review basis

The Architect independently inspected authoritative commit
`f6c631f4a1671d2d04879ce1c18800881e7be5c4`, parent
`db73a73fab022405d0882ec75f4f40a97cc5adea`, the exact changed-file set,
the S6 public entry, internal Git layer, host lifecycle, permit/S5 binding,
registry, transport, liveness/path/environment/RTR code, report schema, focused tests
and test fixtures.

The changed-file set stays within D-071. The approved manifest entry is present exactly
as `NOT_IMPLEMENTED`, has no `closure_ref`, and the Sentinel baseline remains
v1.8.0. No S3/S4/S5 implementation/interface mutation, S7+, deployment, main merge,
real generic execution driver, network remote, credential, or live GitHub transport is
introduced.

The Builder reports 711/711 repository tests passing and the required validators.
Those runtime results remain ACTOR_REPORTED; this review does not claim independent
runtime reproduction.

## AS94-F001 — claim freshness/fencing is outside the claim linearization lock

**Severity:** BLOCKING

`claimPermit()` currently:

1. reads permit status;
2. reads S4 state and checks fencing;
3. performs the fresh S5 claim-time recheck;
4. only then waits for `registry.withTaskLock()`;
5. inside the lock, re-checks only permit state and writes `CLAIMED`.

That leaves an unbounded lock-acquisition gap after both the S4 and S5 freshness checks.
During that gap another local S6 operation can hold the task lock, while S4 ownership /
revision / lease or the live S5 revocation/expiry condition can change. The permit can
then still become `CLAIMED` using checks that are no longer the last checks before the
state change.

RFC-019 §13.1 requires S4 fencing to hold and the fresh S5 check to be the **last**
check immediately before `ISSUED -> CLAIMED`.

**Required correction:**
- acquire the per-task S6 lock before the final claim checks;
- under that lock, re-read the current permit status/body;
- under that lock, obtain the current S4 state and re-check fencing/state/lease;
- then perform the fresh S5 claim-time recheck;
- with no intervening lock wait or unrelated work, write `CLAIMED` and journal the
  accepted check;
- any S4/S5 failure must leave the permit non-executable and fail closed according to
  the existing design;
- add a deterministic race/fault test that changes S4 state/revision and a separate
  test that changes the S5 live revocation condition while claim is waiting on the
  S6 task lock. The stale result must never become `CLAIMED`.

This does not require atomicity with external S4/S5 systems beyond the already-approved
freshness model; it removes the avoidable local pre-lock gap.

## AS94-F002 — permit minting is not crash-atomic with the request binding

**Severity:** BLOCKING

AS90-F002 requires one durable `(instance_id, request_id)` binding to one permit and
requires crash-before-response replay to return that same permit.

The implementation writes, in order under the task lock:

1. permit body;
2. permit status;
3. request binding;
4. journal entry.

Those are separate filesystem mutations. A process crash after (1) or (2) but before
(3) leaves a permit body/status with **no request binding**. A retry of the same
`request_id` sees no binding and may mint a second permit. Current crash tests inject
failure only after the full permit/binding sequence, so they do not exercise this
window.

**Required correction:**
- introduce one crash-recoverable durable creation protocol whose first committed
  durable point uniquely binds the request to exactly one `permit_id`;
- after any crash at any sub-step, recovery/retry must either reconstruct/replay that
  same permit or fail closed; it must never mint another permit for the same binding;
- orphan body/status files must not be interpreted as independent valid permits;
- add fault injection / process-crash tests after each durable sub-step of permit
  creation, including before the request-binding materialization;
- assert after recovery/retry that exactly one logical binding and one permit exist and
  every successful replay returns the same `permit_id`.

A single atomic transaction/source-of-truth record with reconstructable derived files is
one acceptable approach; the review does not prescribe the storage layout.

## AS94-F003 — generic argv-taking Git/test helpers violate the fixed-operation boundary

**Severity:** BLOCKING BOUNDARY

D-069/D-071 and approved RFC-019 permit fixed internal Git mechanisms and fixed test
fixtures, but prohibit a generic argv-taking execution primitive.

Current production code exports from `devos/execution/git.mjs`:

- `git(args, ...)`;
- `tryGit(args, ...)`.

Although `index.mjs` does not re-export them, they are still directly importable
module exports and execute any Git argv supplied by a caller. That is not the approved
"fixed-argv internal Git calls take no caller-supplied argv" shape.

The test harness also exports `fixtureGit(args, opts)`, despite D-071 explicitly
requiring test fixtures not to accept caller-supplied command strings/argv.

**Required correction:**
- remove argv-array-taking process-execution exports from S6 core;
- expose only closed Git operations with structured validated parameters, each building
  its literal subcommand/option argv internally;
- keep the process-spawning primitive module-private behind those closed operations;
- replace `fixtureGit(args, opts)` with a closed fixture-operation table or named
  helpers whose argv is literal in the fixture implementation;
- retain the existing fixed mutation-test runner / closed fixture-driver approach; do
  not generalize it;
- add source-level tests proving no S6-core or fixture export accepts an argv/command
  parameter that is then executed.

No real execution driver is authorized by this remediation.

## AS94-F004 — Execution Report contract is incomplete and evidence fields are discarded

**Severity:** BLOCKING EVIDENCE CONTRACT

RFC-019 §13.1 defines an Execution Report containing:

- permit and instance identity;
- argv/environment digests;
- process groups;
- `started_at` and `ended_at`;
- `exit_code` and `signal`;
- stdout/stderr digests;
- `terminated`.

The implementation/schema require only permit/instance IDs, argv/environment digests,
process groups and `terminated`. `validateReport()` does not validate the optional
timing/result/digest fields, and `recordReport()` drops `started_at`, `ended_at`
and `signal` from the stored/journaled report summary.

That means malformed or materially incomplete actor-reported execution evidence can be
accepted while the durable provenance omits fields the approved contract requires.

**Required correction:**
- make the runtime validator and JSON schema agree with the RFC-019 report contract;
- require and type-check the report fields defined by the RFC;
- validate timestamps as parseable instants and require a non-negative chronology;
- constrain stdout/stderr digests to the approved digest shape when non-null;
- constrain exit/signal values consistently and fail closed on malformed combinations;
- durably record/journal the required timing/result/signal/digest fields rather than
  dropping them;
- add positive and negative tests for missing, malformed and contradictory reports.

The fake/fixed test drivers may supply deterministic synthetic timestamps/digests; no
real generic execution driver is needed.

## Accepted implementation properties

The following are accepted and must remain intact during remediation:

- D-069 execution-driver separation;
- D-070 S5 subject ↔ S6 owner/role binding;
- AS90-F001 claimed/unreported quiescence fail-closed behavior;
- AS90-F002 logical request idempotency intent, subject to F002 crash consistency;
- AS90-F003 S5 request-intent versus S6 argv distinction;
- AS91-F001 live claim-time revocation/expiry requirement, subject to F001 placement;
- non-circular RTR prepublication provenance and stored-byte evidenceRef replay;
- local-only/synthetic transport boundary;
- host environment constructed from empty;
- dedicated-clone and path/no-follow architecture;
- manifest remains `NOT_IMPLEMENTED`;
- no S6 closure, version bump, S7+, deployment, main merge or PR #10 merge.

## Remediation scope — Cycle 1 of 2

Claude / Builder is authorized under D-071 + AS-094 to correct **only**
AS94-F001 through AS94-F004 and directly necessary tests/docs.

Allowed writes:
- `devos/execution/**`;
- `tests/execution-*.test.mjs`;
- narrowly necessary `tests/fixtures/execution/**`;
- deterministic traceability outputs if changed;
- factual RFC-019/README implementation notes only if required to describe the
  remediation, with no design or closure change;
- normal `coordination/STATE.md` / `coordination/CURRENT_HANDOFF.md` return records.

The S6 manifest entry must remain unchanged:
`NOT_IMPLEMENTED`, `executable_runtime_present: false`, no `closure_ref`.

Do not modify S3/S4/S5 source/interfaces. Do not add a real execution driver, live
remote transport, credentials, deployment, closure, version bump, S7+, main merge or
PR #10 merge.

If fixing a finding appears to require changing the AS-093-approved architecture rather
than implementing it faithfully, stop and route to Architect/Paulo instead of silently
changing the design.

## Routing

This review deselects and archives `H-S6-CORE-IMPL-0001` byte-for-byte with
provenance.

Route:
- TURN: CLAUDE
- STATUS: AUTHORIZED
- CURRENT_REMEDIATION_CYCLE: 1
- MAX_REMEDIATION_CYCLES: 2
- IMPLEMENTER_ACTION_REQUIRED: YES
- ARCHITECT_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO

Claude returns a fresh handoff for independent re-review under the next unused
Architect Sync after AS-094.
