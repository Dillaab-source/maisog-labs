# Architect Review — SENTINEL S6 Core Exceptional Remediation Re-review

Architect Sync: ML-DEVOS-AS-097
Status: CHANGES_REQUESTED — EXCEPTIONAL CYCLE EXHAUSTED / PAULO DECISION REQUIRED
Review mode: IMPLEMENTATION STAGE GATE — D-072 / AS96-F001 EXCEPTIONAL REMEDIATION RE-REVIEW
Cycle: SENTINEL_S6_CORE_IMPLEMENTATION
Authority: D-072 / D-071 / ML-DEVOS-AS-096
Reviewed remediation commit: 1bf18efba855ffadf5c6b6f7b6183d594d2b1d32
Reviewed remediation parent: eb79c40a1cbb5ac5fddd3171e040ad66ebba3ad5
Target design: ML-DEVOS-RFC-019 as approved by ML-DEVOS-AS-093
Remediation cycle: 3 of 3 — maximum reached

## Verdict

AS94-F001/F002/F003/F004: remain CLOSED
AS95-F001/F002: remain CLOSED
AS96-F001: MATERIAL CORE FIX PRESENT, BUT NOT CLOSED
S6 CORE IMPLEMENTATION: CHANGES_REQUESTED
REMEDIATION BUDGET: EXHAUSTED — OWNER DECISION REQUIRED
REAL GENERIC EXECUTION DRIVER: NOT PRESENT
LIVE REMOTE TRANSPORT / CREDENTIALS: NOT PRESENT
S6 MANIFEST: remains NOT_IMPLEMENTED
S6 CLOSURE: NOT READY

The D-072 remediation correctly introduces an active PENDING-publication reservation,
blocks the named incompatible lifecycle operations, keeps the S4 transition outside the
local task lock, distinguishes transient from definitive S4 failures, and preserves
quarantine and replay semantics.

One fail-closed integrity gap remains in how the reservation determines whether a
PENDING RTR belongs to an instance. The gap appears exactly when the RTR evidence is
missing or inconsistent, which is when the system must be most conservative.

Because D-072 explicitly caps this exceptional cycle at 3 of 3, the Architect does not
open Cycle 4. Paulo must decide whether to authorize one further narrowly bounded
micro-remediation or require a broader redesign/review.

## Independent review basis

The Architect independently inspected authoritative commit
`1bf18efba855ffadf5c6b6f7b6183d594d2b1d32`, parent
`eb79c40a1cbb5ac5fddd3171e040ad66ebba3ad5`, the exact Cycle-3 delta,
`host.mjs`, the publication-focused tests, mutation suite, S4 kernel/store error
semantics, and the RFC-019 RTR recovery/integrity contract.

The changed-file set remains within D-072 scope. The manifest is unchanged. No
S3/S4/S5 source/interface mutation, generic execution driver, live transport,
credential, closure/version mutation, deployment, main merge or PR #10 merge is
present.

Builder runtime evidence remains ACTOR_REPORTED. This review is
INDEPENDENTLY_INSPECTED for source/diff/protocol semantics; no independent runtime
reproduction is claimed.

## What the D-072 remediation gets right

- unresolved PENDING is used as a durable reservation across the unlocked external S4
  effect window;
- finishWithoutPublication, cleanup, adoptRenewal and quiesce are blocked while a
  proven PENDING for that instance exists; attach retains its existing guard;
- complete can resume the same stored transfer;
- publish/resolvePending remain the only resolution paths;
- quarantine is not reversed by a later successful publication;
- transient S4 errors such as LOCK_HELD leave the RTR PENDING;
- only actual record-based S4 refusals may produce ABORTED;
- COMMITTED/ABORTED remain monotonic;
- deterministic publication-vs-finish/cleanup, transient failure, quarantine,
  idempotency and concurrent-resolver tests are present;
- M32-M37 mutation cases target the intended reservation boundary.

## AS97-F001 — unprovable PENDING body can disappear from the reservation scan

**Severity:** BLOCKING FAIL-CLOSED / EVIDENCE-INTEGRITY

The reservation helper is currently:

`pendingPublications(record) -> list PENDING statuses -> read body -> JSON.parse(body ?? "{}") -> compare builder_identity_digest`.

That means the helper decides that a PENDING record is unrelated to the current
instance *before proving the PENDING record's own body integrity and identity binding*.

Two concrete cases violate the intended fail-closed reservation invariant:

1. **Missing body file.**
   `readRtrBody(...)` returns null. The helper substitutes `"{}"`, parses it
   successfully, sees no `builder_identity_digest`, and silently excludes the PENDING
   record.
2. **Body tampered but still valid JSON.**
   If `builder_identity_digest` is altered to another value, the helper silently
   excludes the PENDING record even though the status remains PENDING and its stored
   `rtr_digest` no longer matches the body.

In either case `finishWithoutPublication()`, `cleanup()`, `adoptRenewal()` or
`quiesce()` can stop seeing the active reservation and may proceed, while
`resolvePending()` correctly treats that same record as unproven.

This creates an inconsistent safety rule:

- recovery says: evidence missing/tampered -> RESULT_TRANSFER_UNPROVEN / PENDING;
- lifecycle guard says: evidence missing/tampered -> reservation may disappear.

RFC-019's recovery contract explicitly treats missing or digest-invalid stored bytes as
`RESULT_TRANSFER_UNPROVEN` and waits for explicit audited resolution. D-072 likewise
requires an unresolved PENDING RTR to remain an active durable reservation. Therefore
the reservation lookup itself must not fail open when its evidence cannot be trusted.

The handoff's statement that a permanently unresolvable PENDING (for example a
missing/tampered body) blocks the instance is not supported by the current helper for
the cases above.

### Required correction if Paulo authorizes another exceptional micro-remediation

Do not redesign the RTR or publication flow. Correct only PENDING reservation
membership/integrity:

- a PENDING RTR may be treated as unrelated to an instance **only after** its immutable
  body is proven sufficiently intact to trust that attribution;
- for each PENDING status, before using `builder_identity_digest`:
  - body bytes must exist;
  - body bytes must parse;
  - SHA-256(body bytes) must equal the status `rtr_digest`;
  - the body must name the same `transfer_id` / task expected by the registry entry;
  - the existing RTR/journal adjacency proof should be reused where practical so a
    body/status pair cannot both drift away from the recorded PENDING evidence;
- if any PENDING record cannot pass those checks, lifecycle reservation queries must
  fail closed with `RESULT_TRANSFER_UNPROVEN` rather than treating it as unrelated.
  Because attribution itself is untrusted at that point, a conservative task-scoped
  block is acceptable;
- only after integrity is proven may the helper compare
  `builder_identity_digest` and decide whether the PENDING belongs to this instance;
- preserve every D-072 behavior already implemented: external S4 transition outside the
  lock, definitive-only ABORTED, crash replay, quarantine semantics, and all closed
  AS94/AS95 findings.

### Required focused tests

At minimum:

- PENDING status + missing body -> finish/cleanup/renew/quiesce fail
  RESULT_TRANSFER_UNPROVEN and no lifecycle mutation occurs;
- PENDING status + malformed body JSON -> same;
- PENDING status + valid JSON body whose bytes no longer match `rtr_digest` -> same;
- PENDING status + altered `builder_identity_digest` with digest mismatch -> cannot
  bypass the reservation;
- intact PENDING belonging to another provable instance is not falsely attributed to
  this instance;
- mutation removing the body/digest/integrity proof is killed;
- all D-072 publication tests and all AS94/AS95 tests remain passing.

This is a narrow implementation correction. No S3/S4/S5 or RFC architecture change is
required unless the Builder finds the current durable RTR shape cannot support the
fail-closed lookup.

## Evidence disposition

INDEPENDENTLY_INSPECTED:
- authoritative Cycle-3 commit and parent;
- exact changed-file set;
- PENDING reservation implementation and operation classification;
- S4 definitive/transient error semantics;
- publication/recovery tests and mutation cases;
- registry `readRtrBody` behavior;
- reservation helper's null-body fallback and identity comparison before integrity
  proof;
- absence of missing/tampered-body reservation tests.

ACTOR_REPORTED:
- 784/784 Builder test run;
- 39/39 mutation suite;
- validators and traceability;
- Linux runtime execution.

No RUNTIME_OBSERVED or INDEPENDENTLY_REPRODUCED claim is made.

## Owner gate — Cycle 3 of 3 exhausted

D-072 authorized exactly one exceptional Cycle 3 of 3. That authority is now exhausted.

The Architect recommends, but does not authorize, one further **AS97-F001-only**
micro-remediation because the remaining defect is narrowly confined to fail-closed
PENDING membership/integrity checking.

Paulo may:
1. authorize one AS97-F001-only exceptional implementation micro-remediation; or
2. keep S6 unclosed and require broader redesign/review.

Until Paulo decides, no Builder action is authorized. No Cycle 4 is opened by AS-097.

## Post-S6 / pre-S7 direction

The pre-S7 readiness checkpoint remains queued only after S6 technical
acceptance/closure. AS97-F001 reinforces the lesson that transaction reservations must
remain fail-closed even when the evidence identifying the reservation is itself damaged.

No S7 work is authorized.

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

This review deselects and archives `H-S6-CORE-IMPL-REM3-0001` byte-for-byte with
provenance.

Route:
- TURN: PAULO
- STATUS: PAULO_DECISION_REQUIRED
- CURRENT_REMEDIATION_CYCLE: 3
- MAX_REMEDIATION_CYCLES: 3
- IMPLEMENTER_ACTION_REQUIRED: NO
- ARCHITECT_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: YES

No Cycle 4 is opened by AS-097.
