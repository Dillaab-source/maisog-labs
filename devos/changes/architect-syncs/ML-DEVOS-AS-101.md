# Architect Review — SENTINEL S6 RFC-019 Integrity-Hardening Final Design Gate

Architect Sync: ML-DEVOS-AS-101
Status: ARCHITECT_APPROVED — DESIGN ACCEPTED; PAULO IMPLEMENTATION DECISION REQUIRED
Review mode: FINAL DESIGN GATE / SU PRE-IMPLEMENTATION FALSIFICATION PASS
Cycle: SENTINEL_S6_INTEGRITY_HARDENING_RFC
Authority: D-073 / ML-DEVOS-AS-100
Reviewed coordination tip: 7f6099b60735473ac4cc7219081a3011a318fc1b
Reviewed handoff: H-S6-INTEGRITY-RFC-REM2-0001
Target design: ML-DEVOS-RFC-019
Sentinel baseline: v1.8.0
Current remediation cycle: 2 of 2
S6 implementation status: PAUSED — NOT APPROVED BY THIS REVIEW

## Verdict

`ARCHITECT_APPROVED — DESIGN ACCEPTED; PAULO IMPLEMENTATION DECISION REQUIRED`

The final AS100-F001 remediation is accepted.

The D-073 RFC-019 integrity-hardening design is now internally coherent at the reviewed design level.

No further autonomous S6 architecture-hardening cycle is required or authorized by this review.

The anti-bloat exit condition in RFC-019 is satisfied.

S6 implementation remains separately gated by Paulo.

## AS100-F001 — CLOSED AT DESIGN LEVEL

The reviewed RFC now correctly separates:

1. historical Execution Permit lifecycle; and
2. the execution-uncertainty reservation that determines whether a historical claim still exerts unresolved external influence.

The correction satisfies the AS-100 requirement.

### Claim transaction

A claim creates:

`permit.status = CLAIMED`

and, in the same transaction:

`claim execution-uncertainty reservation = OPEN`

The historical permit status and the unresolved-influence fact are therefore distinct.

### ACTIVE derivation

RFC-019 now defines unresolved execution influence using:

`CLAIMED permit whose claim execution-uncertainty reservation is OPEN`

rather than every permit historically marked `CLAIMED`.

A historical `CLAIMED` permit whose exact reservation is `OPERATOR_RESOLVED` therefore no longer reserves the task slot merely because of its historical status.

The controlling invariant remains:

`ACTIVE = lifecycle_can_progress OR unresolved_external_influence`

and task-slot release occurs only when:

`lifecycle_can_progress == false`

and:

`unresolved_external_influence == empty`.

### Late verified report

The verified report transition is atomic.

One transaction performs the equivalent of:

`CLAIMED -> REPORTED`

plus:

`claim reservation OPEN -> SUPERSEDED_BY_REPORT`

plus:

registration of every reported process group as an `OPEN` liveness obligation.

There is no committed gap in which the claim reservation is closed while the report-derived liveness obligations are absent.

A late report after quarantine does not restore, un-quarantine or make the instance publishable.

### Proof resolution

Proof resolution closes only liveness obligations actually proven terminated.

It does not synthesize proof for an unreported claim.

Unproven obligations remain `OPEN`.

### Audited operator resolution

Operator resolution names exactly one target:

- one claim reservation; or
- one specific liveness obligation.

The committed resolution records:

- the exact target;
- operator identity;
- reason;
- evidence reference;
- `ACTOR_REPORTED` evidence class.

The targeted reservation becomes `OPERATOR_RESOLVED` in the same transaction.

The resolution is attestation / override, not proof.

It does not rewrite historical permit status.

It does not clear any unrelated claim, obligation, publication, push, cleanup, create or other reservation.

It applies only to a quarantined instance and therefore cannot restore normal lifecycle progress or publication eligibility.

### Reference model

The reference model now represents independently:

- permit lifecycle;
- per-claim execution-uncertainty reservation;
- per-group liveness obligations;
- other open reservations;
- instance lifecycle;
- active task slot.

I11 is preserved.

I12 now defines execution uncertainty in terms of explicit reservations rather than historical permit status.

I13 enforces exact-target bounded resolution and requires slot release to derive from the actual unresolved set rather than from the mere presence of an audit record.

### Required sequences

Q5 now covers:

`CLAIMED`
→ claim reservation `OPEN`
→ crash
→ quarantine
→ time advance
→ second create BLOCKED
→ exact audited operator resolution
→ reservation `OPERATOR_RESOLVED`
→ historical permit still `CLAIMED`
→ no other unresolved influence
→ slot release
→ later create succeeds.

Q5a preserves the slot if another reservation remains.

Q5b preserves the slot indefinitely when no valid resolution occurs.

### Falsification

The accepted design requires all three mutants to fail:

- Mutant A: release merely because lifecycle becomes `QUARANTINED`;
- Mutant B: write `OPERATOR_RESOLUTION` without closing the named reservation, yet release the slot;
- Mutant C: resolution of one target clears unrelated reservations.

The Architect finds these sufficient for AS99-F001 / AS100-F001 design falsification.

## Integrity-hardening exit condition

The Architect accepts all four RFC-019 hardening pillars:

1. the transaction and reservation model of §13.2–§13.4;
2. the crash/interleaving matrix and bounded reference model of §13.6 / §18;
3. the closed public-surface boundary of §13.5;
4. the deterministic Isolation Provenance / S7 boundary of §17.

The RFC's anti-bloat stopping rule now applies.

A future defect discovered while implementing this accepted design is an implementation defect unless evidence shows that an invariant in the accepted design cannot actually be satisfied.

Do not reopen architecture merely because implementation is difficult.

## Scope inspection

The Builder's cycle-2 commit is exactly one commit above the AS-100 publication parent.

The design-remediation diff is bounded to:

- RFC-019;
- coordination STATE / CURRENT_HANDOFF;
- deterministic traceability regeneration.

No executable S6, S7, S3, S4 or S5 source was changed in this remediation.

No manifest closure or version change occurred.

No deployment or protected/main merge occurred.

## Evidence disposition

### Independently inspected by Architect

The Architect independently inspected:

- the authoritative live branch tip;
- live STATE and CURRENT_HANDOFF;
- the exact commit ancestry;
- the exact changed-file set;
- RFC-019 §13.1 execution-uncertainty reservation semantics;
- §13.3 reservation interactions;
- §13.4 ACTIVE / slot-release derivation;
- §13.6 I11–I13 and Q5/Q5a/Q5b;
- §15 recovery behavior;
- §18 Mutants A–C and crash/interleaving requirements;
- §20.1 storage alternatives;
- the integrity-hardening anti-bloat exit condition.

### ACTOR_REPORTED only

The following remain Builder-reported and are not upgraded by this review:

- `npm test`: 784/784;
- manifest / capability / task-contract / rules / waiver / bridge validator results;
- `git diff --check`;
- traceability regeneration;
- the reported two pre-existing traceability errors and fourteen warnings.

No executable S6 behavior is approved or independently reproduced by this design review.

## SU pre-implementation falsification pass

SU was invoked as an advisory planning/falsification layer before any implementation authorization.

It found no new architecture-class blocker.

The preferred course is to implement the accepted architecture rather than introduce another design round.

### SU implementation guard 1 — prove storage substrate first

RFC-019's preferred minimal V1 store is a crash-atomic per-task envelope plus immutable content-addressed blobs.

Before the hardened implementation relies on that backend, its replace-atomicity requirements must be demonstrated for the supported implementation platform/profile.

If the required transaction semantics cannot be demonstrated, STOP.

Do not quietly return to independently mutable multi-file state.

Do not silently adopt SQLite.

Route a separate backend decision instead.

### SU implementation guard 2 — reference model early

Implement the bounded pure reference model early enough that the hardened runtime can be checked against it.

The implementation must cover I1–I13 and required sequences Q1–Q5b.

Mutants A–C must demonstrably fail.

### SU implementation guard 3 — harden the authoritative tracked S6 core

The implementation target is the authoritative tracked S6 subsystem on the live branch.

A suspended or untracked local D-068 draft is not authoritative input and must not be imported merely because it exists locally.

### SU implementation guard 4 — no real execution driver

The next bounded S6-core hardening implementation remains fake-driver / fixture driven.

No generic executor.

No real execution driver.

The execution driver remains separately governed under D-069.

### SU implementation guard 5 — preserve subsystem boundaries

No S7 evidence-store implementation.

No S8 orchestration.

No S9 evidence gate.

No CP-4+.

No Model Router.

No dynamic plugin discovery.

No deployment.

No closure/version promotion.

The goal is hardened S6 core capability delivery against the accepted RFC, not broader platform expansion.

## Implementation recommendation to Paulo

The Architect recommends that Paulo may now consider one bounded S6-core hardening implementation authorization against the AS-101-accepted RFC-019 design.

That future owner decision should explicitly bind implementation to:

- the authoritative tracked `devos/execution/**` S6 core;
- directly necessary focused S6 tests / fixtures;
- the accepted §13.2–§13.6 transaction, reservation and reference-model semantics;
- §18 crash/interleaving, mutation and model-replay requirements;
- S5 consumption only through already accepted public interfaces;
- fake-driver / fixture execution only.

It should explicitly exclude:

- a real execution driver;
- generic command execution;
- S7+;
- remote D1/R2;
- deployment;
- manifest closure / Sentinel version promotion;
- protected/main merge;
- PR #10 merge.

This review does not itself grant that authority.

## Existing implementation disposition

The tracked S6 implementation predates the D-073 integrity-hardening transaction model.

Its existence is not evidence of conformance.

It must be treated as implementation to harden and review against the accepted design.

The final implementation review must independently inspect the resulting source and independently reproduce or otherwise obtain qualified evidence for the security-adjacent test obligations where feasible.

## Residual risks

RFC-019's disclosed V1 residual risks remain accepted as risks, not silently resolved.

In particular:

- L3 is not hostile-process containment;
- the S6 host and execution driver remain trust assumptions;
- operator resolution is attested, not proof;
- a mistaken/dishonest operator may release a slot while execution continues;
- the bounded reference model is not an exhaustive proof over every possible state;
- the preferred envelope backend still requires implementation evidence for its platform atomicity assumptions.

These risks do not block the design gate because they are explicitly bounded and fail-closed where the RFC requires.

## No further remediation cycle

The configured remediation maximum has been reached:

`CURRENT_REMEDIATION_CYCLE: 2`

`MAX_REMEDIATION_CYCLES: 2`

The final finding is closed.

No third autonomous design-remediation cycle is required.

## Routing

The Builder handoff is deselected and archived.

Route to Paulo for the owner implementation decision.

Required STATE header after this Architect publication:

`CYCLE_ID: SENTINEL_S6_INTEGRITY_HARDENING_RFC`

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: D073_S6_RFC019_FINAL_DESIGN_ACCEPTED_PAULO_IMPLEMENTATION_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`

`CURRENT_REMEDIATION_CYCLE: 2`

`MAX_REMEDIATION_CYCLES: 2`

`PROTOCOL_VERSION: 1`

`CURRENT_HANDOFF: NONE`

The handoff selector fields are empty.

All mutation, remote-resource, deployment and main-merge flags remain `NO`.

No S6 implementation may begin until Paulo publishes a fresh explicit owner decision and routing transition.
