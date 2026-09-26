# Architect Review — SENTINEL S6 RFC-019 Final Integrity-Hardening Remediation

Architect Sync: ML-DEVOS-AS-100
Status: CHANGES_REQUESTED — FINAL BOUNDED DESIGN REMEDIATION
Review mode: CHANGE REVIEW / SU ADVERSARIAL CROSS-CHECK
Cycle: SENTINEL_S6_INTEGRITY_HARDENING_RFC
Authority: D-073 / ML-DEVOS-AS-099
Reviewed coordination tip: fe73dab3a584c3e17e6d18ab583e37deabd050f9
Reviewed handoff: H-S6-INTEGRITY-RFC-REM1-0001
Target design: ML-DEVOS-RFC-019
Sentinel baseline: v1.8.0
Implementation under review: NONE — S6 implementation remains paused
Current remediation cycle: 2 of 2

## Verdict

The AS99-F001 remediation correctly fixes the primary active-slot defect.

The reviewed design now correctly establishes that:

- `QUARANTINED` is not evidence that execution stopped;
- unresolved execution continues reserving the task slot;
- elapsed time does not prove termination;
- a late report does not restore, un-quarantine or make the instance publishable;
- the reference model and crash matrix cover the claim → crash → quarantine → second-create sequence;
- release-on-quarantine is explicitly falsified.

One bounded state-model contradiction remains.

`AS100-F001` is the only blocking finding.

No broader S6 redesign is required.

No executable S6 implementation is authorized by this review.

## AS100-F001 — historical CLAIMED state and execution-uncertainty reservation are conflated

RFC-019 currently defines unresolved external influence to include:

`a CLAIMED permit with no verified Execution Report`

The same design also permits an explicit audited operator resolution to clear execution uncertainty when termination cannot otherwise be proven.

However, audited operator resolution:

- does not manufacture a verified Execution Report;
- does not rewrite what historically happened to the permit;
- leaves the permit historically `CLAIMED`.

Therefore, under the current normative ACTIVE definition, the permit remains literally a `CLAIMED` permit with no verified report and still qualifies as unresolved external influence.

Q5 nevertheless expects audited operator resolution to permit eventual active-slot release.

Those rules are internally inconsistent.

The defect is not in the overall S6 architecture. It is in conflating two facts:

1. historical permit lifecycle; and
2. whether the execution-uncertainty reservation created by that claim remains unresolved.

## Required correction

Preserve historical truth.

If a permit was claimed, its historical permit lifecycle may remain:

`permit.status = CLAIMED`

Do not invent a verified report.

Do not treat operator attestation as proof.

Instead, represent the claim's execution-uncertainty reservation as a bounded fact distinct from historical permit status.

Semantics must be equivalent to:

`permit.status = CLAIMED`

plus:

`claim_execution_resolution = OPEN`

while that execution uncertainty remains unresolved.

A resolution may transition that bounded fact to an equivalent of:

`PROOF_RESOLVED`

or:

`OPERATOR_RESOLVED`

The exact field and enum names are implementation-design choices.

The semantic separation is mandatory.

## ACTIVE derivation

§13.4 must not define every historical `CLAIMED` permit as unresolved forever.

The unresolved-external-influence rule must instead be equivalent to:

`a CLAIMED permit whose execution-uncertainty reservation remains OPEN`

constitutes unresolved external influence.

The task-slot release invariant remains:

`release active_instance_id`

only when both are true:

`lifecycle_can_progress == false`

AND

`unresolved_external_influence == empty`

A historical `CLAIMED` permit may therefore remain in the audit history after its exact execution-uncertainty reservation has been explicitly resolved without continuing to reserve the task slot.

## Late verified report

A verified late report must not create a safety gap.

The transition must atomically establish the equivalent of:

`CLAIMED + execution uncertainty OPEN`

→ verified Execution Report accepted

→ permit lifecycle becomes `REPORTED`

→ claim-level uncertainty is no longer the controlling unresolved reservation

→ all reported process groups are registered as liveness obligations

The report transaction must not commit an intermediate state where the claim reservation has been retired but the corresponding liveness obligations have not yet been registered.

The instance remains `QUARANTINED`.

It remains non-publishable.

The task slot remains reserved while the resulting liveness obligations or any other unresolved influence remain open.

## Proof resolution

The proof path must resolve only what it actually proves.

A successful proof-based resolve requires the normative liveness proof required by RFC-019.

It may close the exact execution/liveness uncertainty proven resolved.

It must not clear unrelated publication, push, cleanup, create or other reservations.

Proof resolution remains evidence-backed resolution rather than operator attestation.

## Audited operator resolution

Audited operator resolution must target the exact execution-uncertainty reservation being overridden.

The committed resolution record must identify at minimum:

- the exact permit / claim;
- operator identity;
- reason;
- evidence reference;
- evidence disposition equivalent to `ACTOR_REPORTED`.

Operator resolution is an explicit attestation / override.

It is not independent proof that execution terminated.

The transaction must:

- atomically close only the specifically targeted execution-uncertainty reservation;
- preserve the historical permit lifecycle;
- leave unrelated claims untouched;
- leave liveness obligations untouched unless they are the exact separately authorized target;
- leave publication, push, cleanup, create and other reservations untouched;
- never restore the instance;
- never un-quarantine the instance;
- never make the instance publishable.

If any other unresolved external influence remains after the targeted resolution, the task's active slot remains reserved.

## Reference-model requirement

The reference model must treat these as independently represented facts where applicable:

- permit lifecycle;
- per-claim execution-uncertainty resolution;
- registered liveness obligations;
- other open reservations;
- instance lifecycle;
- active task slot.

Preserve I11.

Clarify I12, or add only the minimum directly necessary invariant, so the model distinguishes:

`historical permit status`

from:

`whether the execution-uncertainty reservation remains open`.

The model must make it impossible for an operator-resolution journal/audit record alone to release the slot unless the exact targeted execution-uncertainty reservation was atomically closed.

## Required Q5 sequence

Q5 must explicitly cover:

`ATTACHED`

→ permit becomes `CLAIMED`

→ claim execution-uncertainty reservation is `OPEN`

→ crash before report

→ recovery to `QUARANTINED / QUIESCE_UNPROVEN`

→ no late report

→ trusted time advances

→ execution-uncertainty reservation remains `OPEN`

→ second create is BLOCKED

Then:

→ audited `OPERATOR_RESOLUTION` targeting that exact claim

→ that exact claim execution-uncertainty reservation becomes `OPERATOR_RESOLVED`

→ historical permit remains `CLAIMED`

→ no other unresolved external influence remains

→ active task slot is released

→ a later otherwise-valid create may succeed.

If any other unresolved influence remains, slot release is forbidden.

Elapsed time never changes the claim execution-resolution state.

## Falsification requirements

Preserve the AS99 falsification:

### Mutant A — release on quarantine

A mutant that releases the active task slot merely because the instance becomes `QUARANTINED` must fail Q1 / I11.

Add:

### Mutant B — audit record without reservation closure

A mutant that records `OPERATOR_RESOLUTION` but leaves the targeted claim execution-uncertainty reservation `OPEN`, while nevertheless releasing the task slot, must fail Q5.

Add:

### Mutant C — over-broad resolution

A mutant where resolution of claim A also clears claim B, a different liveness obligation, publication reservation, push reservation, cleanup reservation or another unrelated unresolved influence must fail.

Resolution must be exact-target and bounded.

## SU adversarial disposition

The SU contradiction/falsification pass independently confirms AS100-F001.

The smallest coherent correction is separation of:

- historical permit lifecycle; and
- the reservation representing unresolved execution influence.

Rejected alternatives:

- adding a synthetic permit lifecycle state merely to encode operator intervention;
- manufacturing a verified report;
- treating operator attestation as termination proof;
- removing the operational escape path and forcing indefinite permanent blocking;
- another S6 architecture redesign;
- introducing TLA+, a new database, service, agent or consensus subsystem.

No new architecture-class defect was identified in this pass.

## Accepted portions of the AS99 remediation

The following are accepted at design level and must not be reopened except where directly necessary to correct AS100-F001:

- `ACTIVE = lifecycle_can_progress OR unresolved_external_influence`;
- quarantine does not itself resolve execution;
- time and claim expiry do not establish termination;
- late report does not restore/un-quarantine/make publishable;
- unresolved influence reserves the task slot independent of lifecycle state;
- I11;
- Q1–Q4;
- release-on-quarantine falsification;
- the existing prepare → effect → reconcile architecture;
- the S6/S7 boundary;
- the accepted AS-098 integrity-hardening architecture.

## Authorized remediation scope

Only directly necessary RFC-019 design surfaces may change:

- §13.1;
- §13.3;
- §13.4;
- §13.6;
- §15;
- §18;
- directly necessary summary wording;
- directly necessary residual-risk wording;
- directly necessary acceptance / Architect-Sync wording;
- deterministic traceability outputs if required;
- coordination files required to return the bounded handoff.

No executable S6 mutation.

No `devos/execution/**`.

No executable tests or fixtures.

No S3/S4/S5 implementation mutation.

No S7+.

No manifest closure or version mutation.

No remote D1/R2.

No deployment.

No protected/main merge.

No PR #10 merge.

## Remediation cap

This is:

`CURRENT_REMEDIATION_CYCLE: 2`

of:

`MAX_REMEDIATION_CYCLES: 2`

The Builder may perform exactly this bounded final design remediation and return it for independent Architect review.

The Builder must not self-approve it.

If AS100-F001 remains unresolved after cycle 2, no autonomous third remediation cycle is authorized.

The next route in that case is Paulo decision required.

## Routing

Route exactly one bounded final RFC-019 design remediation.

Required resulting header fields:

`CYCLE_ID: SENTINEL_S6_INTEGRITY_HARDENING_RFC`

`TURN: CLAUDE`

`STATUS: CHANGES_REQUESTED`

`AUTHORIZED_SCOPE: D073_AS100_F001_RFC019_FINAL_DESIGN_REMEDIATION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: YES`

`PAULO_DECISION_REQUIRED: NO`

`CURRENT_REMEDIATION_CYCLE: 2`

`MAX_REMEDIATION_CYCLES: 2`

`PROTOCOL_VERSION: 1`

`CURRENT_HANDOFF: NONE`

The handoff selector fields are empty.

All mutation, remote-resource, deployment and main-merge flags remain `NO`.

S6 implementation remains paused.

After the bounded correction, return:

`TURN: ARCHITECT`

`STATUS: READY_FOR_ARCHITECT`

for the final independent design gate.
