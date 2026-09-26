# Architect Review — SENTINEL S5 Capability & Permission Gateway V1 Final Implementation

Architect Sync: ML-DEVOS-AS-083
Status: ARCHITECT_APPROVED — S5 IMPLEMENTATION ACCEPTED / PAULO NEXT-STEP DECISION REQUIRED
Review mode: SECURITY / IMPLEMENTATION REVIEW
Cycle: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_IMPLEMENTATION
Authority: D-063
Reviewed remediation commit: 06b5bef3d1e495db95cd52508ea8fc8ed9d7242e
Reviewed remediation parent: f6fd5179d8a0d21e7ce0d2121dfc87f783735de3
Original implementation commit: d589a16b8256232edd029593d653335913619125
Target design: ML-DEVOS-RFC-017
Design approval: ML-DEVOS-AS-077
Prior implementation review: ML-DEVOS-AS-082
Remediation cycle: 1 of 2

## Verdict

S5 V1 IMPLEMENTATION: ARCHITECT_APPROVED / TECHNICALLY ACCEPTED
AS82-F001: CLOSED
AS82-F002: CLOSED
Scope compliance: PASS
Architecture conformance: PASS
Capability != Authority boundary: PASS
S3/S4 non-integration boundary: PASS
AS-077 descriptor-expiry reconciliation: PASS
Bootstrap Trial #1 measurement collection: ACCEPTED
Known traceability debt preservation: PASS
Manifest closure: NOT AUTHORIZED / remains NOT_IMPLEMENTED
ADR / version transition: NOT AUTHORIZED
S6+: NOT AUTHORIZED
CP-4+: NOT AUTHORIZED
Model Router V0: NOT AUTHORIZED
Remote D1/R2: NOT AUTHORIZED
Deployment / production mutation: NOT AUTHORIZED
Protected/main merge: NOT AUTHORIZED
PR #10 merge / auto-merge: NOT AUTHORIZED

No second autonomous remediation cycle is opened.

## Independent review basis

Architect independently inspected the authoritative remediation snapshot at
`06b5bef3d1e495db95cd52508ea8fc8ed9d7242e`.

The remediation is exactly one commit ahead of the AS-082 routing commit
`f6fd5179d8a0d21e7ce0d2121dfc87f783735de3`.

The changed-file surface is bounded to:

- trusted-context / static gateway construction;
- shell canonicalization and shell adapter resolution;
- directly necessary focused regression tests;
- capabilities README;
- regenerated traceability outputs;
- normal STATE / CURRENT_HANDOFF bookkeeping.

No S3/S4 integration, manifest closure, ADR, version transition, product/runtime
integration, remote-resource mutation, deployment, protected/main merge, S6+,
CP-4+, or Model Router implementation was introduced.

Builder command execution remains ACTOR_REPORTED where the Architect could not run
the exact repository snapshot in an equivalent local runtime. The Architect
independently inspected the changed implementation/test logic and separately
sanity-checked the Windows/POSIX normalization semantics under Node path behavior;
that is not represented as reproduction of the Builder's full test suite.

## AS82-F001 — CLOSED — caller-acquirable minter path removed

The prior generic `registerAdapters(factory)` surface is gone.

The remediation now keeps:

- the WeakMap brand;
- the unexported `makeMinter()`;
- gateway construction;
- the static five-adapter factory set;

inside `trusted-context.mjs`.

No production export returns a minter, accepts a registration callback for a minter,
or exposes the prior claim-first registration path.

Each configured provider receives a fresh provider-specific minter only as a direct
argument to its statically imported adapter factory. The adapter retains it only in a
closure and exposes `request()`; caller-visible values remain unbranded snapshots.

The public `index.mjs` continues not to export raw `evaluate()`.

The implementation explicitly preserves the RFC-017 V1 residual trust boundary:
this is an in-process, non-cryptographic mechanism. Pre-load source/loader/intrinsic
compromise and a lying trusted embedder/registered adapter are not claimed solved.

The new adversarial bypass tests are directly targeted at the prior defect and do
not introduce a production test-only minter hook.

Result: the concrete AS82-F001 ordinary same-process minter-acquisition bypass is
closed within the accepted V1 trust model.

## AS82-F002 — CLOSED — shell path handling is platform-aware

The shell canonicalization contract now supports three explicit canonical families:

- POSIX: `/srv/repo/a`;
- Windows drive: `C:/repo/a`;
- UNC: `//server/share/a`.

Windows drive letters are canonicalized uppercase and emitted resource strings use
`/` separators.

The adapter-side resolver uses the host/native path implementation and filesystem
realpath behavior. It preserves:

- absolute-path requirement;
- native traversal handling;
- per-component symlink resolution;
- fail-closed dangling/unresolvable paths;
- deliberate support for not-yet-existing tails;
- trusted-root confinement;
- segment-aware containment rather than string-prefix containment.

The added platform tests exercise the production resolver with `path.win32` over a
modeled Windows filesystem while existing real-filesystem POSIX behavior remains in
the gateway tests.

The handoff correctly discloses that real NTFS-specific behaviors such as junctions,
8.3 names, and device/long-path namespaces were not runtime-tested on a real Windows
host. That limitation does not reopen AS82-F002: unsupported/alternate namespace
forms are not required to be accepted, and the implemented normal drive/UNC path
contract is now platform-aware and fail-closed.

## Remaining implementation observations — non-blocking

1. Closing F001 makes several raw-core defensive branches unreachable through the
   public wrapper path. Keeping those checks as defense in depth is acceptable.
   Their reduced executable reachability does not weaken the public trusted-wrapper
   invariant.

2. A foreign provider presented to a concrete adapter is rejected at the adapter
   boundary as `MALFORMED_REQUEST`; the raw core still retains
   `UNKNOWN_PROVIDER`. This is not a new remediation regression and does not
   contradict the public adapter boundary sufficiently to block S5 V1 acceptance.

3. The V1 brand remains an in-process boundary, not sandbox/process isolation. That
   is the design accepted by RFC-017 / AS-077; stronger isolation belongs to later
   separately authorized capability work.

## Evidence disposition

### Independently inspected

- exact branch ancestry and bounded one-commit remediation delta;
- live STATE / CURRENT_HANDOFF identity binding;
- removal of the generic minter-registration export;
- static gateway-to-adapter minter flow;
- continued non-export of raw evaluate from the public entry;
- platform-aware canonical shell forms;
- native resolver/root-confinement logic;
- focused bypass and shell-platform regression-test source;
- unchanged hard boundaries outside S5 remediation;
- preservation of the known CORE-022 / WEB-REQ-009 traceability debt.

### Actor-reported execution retained as actor-reported

Builder reports:

- vulnerable pre-fix bypass reproduced;
- fixed probes: zero minters, zero bypass, zero leaked trusted contexts;
- focused S5 tests: 50/50 pass;
- mutation checks: all 15 targeted regressions killed after test strengthening;
- full repository suite: 606/606 pass;
- required validators pass;
- traceability regeneration: known CORE-022 / WEB-REQ-009 errors only, no new
  fingerprint, no drift.

These command results are not silently upgraded to independently reproduced evidence.

## Obligation disposition

Closed by this review:

- OBL-009 — Context Bootstrap V0 Trial #1 measurement collection. The initial S5
  Builder turn and Remediation Cycle 1 both recorded context/read/history/duplicate
  read/wrong-turn/stale-publication/false-blocking/missed-obligation/rework/scope
  measurements where observable, with unavailable provider-token/wall-time measures
  explicitly not invented.

Already closed:

- OBL-002 — AS-077 descriptor-expiry wording reconciliation, by ML-DEVOS-AS-082.

Remain unresolved exactly as carried forward unless separately closed:

- OBL-010 — rollback verification after several real V0 turns;
- OBL-011 — behavioral/procedural forged-authorization and hostile-evidence
  evaluation;
- OBL-012 — supported-participant exact-tip publication demonstration, including
  the GitHub-connected ChatGPT Architect connector limitation;
- OBL-015 — CORE-022 / WEB-REQ-009 traceability debt;
- every other OPEN/DEFERRED obligation not explicitly closed by an authoritative
  record.

## Technical acceptance boundary

This review accepts the bounded S5 V1 implementation technically.

It does NOT:

- change `devos/devos-manifest.json` from `NOT_IMPLEMENTED`;
- create a closure ADR;
- close RFC-017 into the Sentinel capability baseline;
- select or authorize a Sentinel version bump;
- wire S5 into S3/S4 or any runtime;
- authorize S6 or any later phase.

Under the repository's RFC-015 closure lifecycle, implementation acceptance and
phase closure are separate events. Any S5 closure package must receive its own
D.1 pre-decision closure preflight and later explicit Paulo authorization before
manifest/ADR/version closure mutation.

## Routing

This review deselects Builder handoff `H-S5-REM1-0001`.

The same atomic publication must:

- archive that outgoing CURRENT_HANDOFF byte-for-byte with provenance;
- keep `PROTOCOL_VERSION: 1`;
- set `CURRENT_HANDOFF: NONE` and clear its selector tuple;
- route `TURN: PAULO`;
- set `STATUS: PAULO_DECISION_REQUIRED`;
- keep every remote/deploy/main/mutation flag `NO`.

## Paulo decision requested

Paulo may now decide whether to proceed to the separate S5 closure lifecycle.

A "proceed" decision at this point should authorize only preparation/execution of the
repository's existing D.1 pre-decision closure process for S5; it must not be
interpreted as immediate manifest closure, ADR creation, version transition, S6
authorization, deployment, remote mutation, or main merge.

No later phase is implied by this technical acceptance.
