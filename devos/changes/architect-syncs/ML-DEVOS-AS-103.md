# Architect Review — SENTINEL S6 Hardened-Core Implementation Acceptance

Architect Sync: ML-DEVOS-AS-103
Status: ARCHITECT_APPROVED — S6 CORE IMPLEMENTATION ACCEPTED; PAULO NEXT-GATE DECISION REQUIRED
Review mode: FINAL D-074 IMPLEMENTATION REVIEW
Cycle: SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION
Authority: D-074 / ML-DEVOS-AS-101 / ML-DEVOS-AS-102
Reviewed coordination tip: ea6401d8358dc8386cf7e246b7e1dd1aefb46d87
Reviewed handoff: H-S6-CORE-HARDEN-REM1-0001
Implementation base: 3f0fdafa62b4c58b42ef6da3e425c1afdfbcddaa
Remediation base: 37a4ff9140680b98d84e438604a0d69e89dabccf
Target design: ML-DEVOS-RFC-019
Sentinel baseline: v1.8.0
Current remediation cycle: 1 of 2
S6 closure status: NOT AUTHORIZED

## Verdict

`ARCHITECT_APPROVED — S6 CORE IMPLEMENTATION ACCEPTED; PAULO NEXT-GATE DECISION REQUIRED`

The D-074 bounded S6-core integrity-hardening implementation is accepted at the reviewed implementation boundary.

AS102-F001 is CLOSED.

No further D-074 implementation remediation is required.

This approval applies to the hardened S6 core only.

It is not S6 closure.

It does not authorize a real execution driver.

It does not authorize S7.

## AS102-F001 — CLOSED

The runtime now preserves RFC-019 §13.6 I5 for lazy unclaimed permit expiry.

For every permit transitioned:

`ISSUED -> EXPIRED_UNCLAIMED`

`persistExpiries()` now appends a corresponding:

`PERMIT_EXPIRED`

journal entry for the exact permit in the same mutable TaskStore draft.

Because that draft is committed once through the shared transaction wrapper, the permit-state transition and its justifying journal evidence share the same committed TaskStore version.

The event records:

- `permit_id`;
- `permit_digest`;
- `reason: CLAIM_DEADLINE_PASSED`;
- deterministic `claim_deadline`.

Multiple permits expiring in one transaction each receive their own journal event.

`CLAIMED` permits remain excluded from lazy expiry.

Claim execution-uncertainty reservations are unchanged.

No separate mutable expiry store was introduced.

## Runtime / model correspondence

The reference model retains its explicit:

`expire`

transition, which commits the permit terminal state together with an `EXPIRE` model record.

The runtime now has the corresponding evidence-bearing transition through `PERMIT_EXPIRED`.

The Architect finds the previously identified runtime/model I5 mismatch corrected.

## Falsification

The remediation adds:

`M49-expiry-without-journal-evidence`

which removes the new journal write while preserving the expiry state transition.

The focused E1 test is intended to kill that mutant because state expiry without its matching journal evidence violates the expected result.

The previous M03 claimed-permit-expiry mutant was re-anchored to the revised expiry loop rather than weakened.

The Architect inspected the mutation definitions and finds their targets consistent with AS102-F001.

## Remediation scope

The remediation commit is exactly one commit above the AS-102 publication commit.

Its executable changes are bounded to:

- `devos/execution/host.mjs`;
- new focused `tests/execution-expiry.test.mjs`;
- the directly necessary mutation-test updates.

The remaining changed files are coordination return records and deterministic traceability regeneration.

No RFC architecture amendment occurred.

No platform-scope rewrite occurred.

No PENDING operator-recovery design was introduced.

No real execution driver was introduced.

No S7 implementation occurred.

## D-074 hardened-core acceptance

The Architect preserves the AS-102 inspection findings for the broader D-074 implementation.

At the reviewed source boundary, the implementation provides the accepted hardened-core structure:

- one per-task TaskStore transaction boundary;
- per-task writer serialization and version CAS;
- immutable content-addressed bodies;
- prepare -> effect -> reconcile for external effects;
- one ACTIVE S6 environment per task;
- explicit claim execution-uncertainty reservations;
- explicit per-group liveness obligations;
- atomic late-report supersession;
- exact-target proof/operator resolution;
- fail-closed PENDING attribution;
- closed production mutation surface;
- bounded reference model;
- crash/interleaving and mutation-test surfaces;
- deterministic Isolation Provenance projection;
- explicit S6/S7 ownership boundary.

The runtime no longer has the AS102-F001 defect identified in the prior review.

No additional implementation blocker was found in this remediation review.

## Evidence classification

The Architect independently inspected:

- authoritative branch state;
- commit ancestry;
- exact remediation file scope;
- `persistExpiries()`;
- TaskStore transaction placement;
- `PERMIT_EXPIRED` evidence fields;
- CLAIMED-permit exclusion;
- focused E1/E2/E3 test source;
- M49;
- re-anchored M03;
- unchanged carry-forward O1/O2 boundaries.

The following remain `ACTOR_REPORTED` because this Architect session did not execute the Builder's local test environment:

- focused expiry suite 4/4;
- all S6 suite counts;
- mutation suite 51/51;
- `npm test` 852/852;
- validator exit codes;
- traceability regeneration result.

Source inspection supports acceptance of AS102-F001 without upgrading those execution claims to independently reproduced evidence.

## Carry-forward O1 — platform atomicity evidence

O1 remains OPEN.

The hardened TaskStore currently relies on proven replace-atomicity only for the tested Linux profile.

The implementation explicitly refuses unsupported/unproven store platforms rather than silently degrading.

The Builder reports:

- Linux: RUN / process-crash evidence;
- macOS: NOT RUN;
- Windows: NOT RUN.

RFC-019 §16 still describes broader V1 profiles.

Therefore no later S6 integrated Stage Gate or closure may claim macOS/Windows hardened-store conformance without additional evidence or a separately governed platform/backend decision.

AS-103 does not resolve or alter this issue.

## Carry-forward O2 — unattributable PENDING exceptional recovery

O2 remains OPEN.

The current implementation correctly fails closed when a `PENDING` publication cannot be attributed.

Lifecycle mutation remains blocked task-wide.

However, the exceptional audited operator recovery mechanism mentioned by RFC-019 for this damaged/tampered state does not yet have complete implemented transition semantics.

AS-103 does not invent those semantics.

This remains an integrated-stage / pre-closure concern.

## Real execution driver boundary

The real execution driver remains outside the accepted S6 core.

D-069 requires actual actor/tool-selected execution to remain behind a distinct execution-driver boundary.

D-074 explicitly excluded a real driver.

The current implementation therefore remains fake-driver / fixed-fixture validated.

Before real execution can be introduced, a separately reviewed driver design and explicit Paulo implementation authorization are required.

No generic arbitrary-command surface may be introduced.

## S6 status

S6 remains:

`status: NOT_IMPLEMENTED`

with:

`executable_runtime_present: false`

and no:

`closure_ref`.

Sentinel remains:

`v1.8.0`.

The hardened core being accepted does not by itself satisfy integrated S6 closure.

## Next owner decision

The D-074 hardened-core implementation cycle is complete.

Paulo must choose the next S6 governance action.

The Architect recommends that the next S6 work, when Paulo chooses to resume it, be treated as a separate bounded gate rather than as another D-074 remediation.

Before eventual S6 closure, the remaining integrated path includes:

- deciding and reviewing the real execution-driver design before implementation;
- separately authorizing any real-driver implementation;
- resolving or formally disposing O1 platform evidence;
- resolving or formally disposing O2 exceptional unattributable-PENDING recovery;
- performing an integrated S6 Stage Gate;
- only then considering the normal S6 closure lifecycle.

These are future owner-gated steps.

AS-103 grants none of them.

## Parking rule

Because the hardened core is now accepted and no Builder remediation remains active, Paulo may also choose to park S6 at this clean governance boundary and open an unrelated bounded project cycle, including website design work.

Parking S6 does not close it and does not waive O1, O2, the real-driver boundary or future Stage Gate requirements.

## Routing

Archive and deselect:

`H-S6-CORE-HARDEN-REM1-0001`

Route:

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: D074_S6_HARDENED_CORE_ACCEPTED_PAULO_NEXT_GATE_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`

`CURRENT_REMEDIATION_CYCLE: 1`

`MAX_REMEDIATION_CYCLES: 2`

`CURRENT_HANDOFF: NONE`

with empty selector fields.

All action-specific mutation, remote-resource, deployment and main-merge flags remain `NO`.

No Builder work begins until Paulo publishes a new explicit owner decision.
