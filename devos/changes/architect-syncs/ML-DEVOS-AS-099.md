# Architect Review — SENTINEL S6 RFC-019 Integrity-Hardening Amendment

Architect Sync: ML-DEVOS-AS-099
Status: CHANGES_REQUESTED — DESIGN REMEDIATION REQUIRED
Review mode: CHANGE REVIEW — D-073 RFC-019 INTEGRITY-HARDENING AMENDMENT
Cycle: SENTINEL_S6_INTEGRITY_HARDENING_RFC
Authority: D-073 / ML-DEVOS-AS-098
Reviewed design commit: 82c8d59523094facbc5eb5230ef2e3911a1a5619
Reviewed coordination tip: 1231634df7fdefe198ac86b956643c242a61f56f
Target design: ML-DEVOS-RFC-019
Sentinel baseline: v1.8.0

## Verdict

`CHANGES_REQUESTED — DESIGN REMEDIATION REQUIRED`

The RFC-019 integrity-hardening amendment requires one bounded correction inside the
existing S6 architecture. The overall S6 architecture is not reopened, and S6
implementation remains paused.

## AS99-F001 — unresolved execution must continue reserving the active S6 task slot

**Severity:** BLOCKING SAFETY / EXECUTION-ISOLATION

A permit may be `CLAIMED`, the host may crash before a verified Execution Report
arrives, and recovery may quarantine the instance as `QUIESCE_UNPROVEN`.

RFC-019 currently permits the active-instance slot to be released for a quarantined
instance when no `PENDING` publication exists. That could permit a second S6
environment while execution originating from the first environment has not been
proven terminated.

The active-instance rule must be corrected to:

`ACTIVE = lifecycle_can_progress OR unresolved_external_influence`

An equivalent simpler formulation is acceptable only if it preserves the same safety
property. A quarantined instance with a `CLAIMED`, unreported execution must continue
reserving the task slot.

Execution uncertainty clears only after termination is proven and no other reservation
remains, or through an explicit audited operator-resolution path. Elapsed time alone is
not proof of termination.

## Late-report rule

A late verified Execution Report may establish liveness obligations. It must not:

- restore the instance;
- un-quarantine the instance; or
- make the instance publishable.

The task slot may be released only after the late report and liveness proof establish
the required obligations and process termination is confirmed, with no other
reservation remaining, or after the explicit audited operator-resolution path.

## Required reference-model and crash-matrix coverage

The reference model and crash matrix must include:

`CLAIMED`
→ crash before report
→ recovery quarantine
→ second create attempt

Expected result:

`SECOND CREATE BLOCKED`

The model must also cover successful release after:

`verified late report + liveness proof + confirmed process termination`

A mutant that releases `active_instance_id` merely because the instance becomes
`QUARANTINED` must fail.

## Scope of correction

This is a bounded correction inside the existing S6 integrity-hardening architecture.
Correct only AS99-F001 in RFC-019 and the directly necessary design cross-references,
reference model, crash matrix, and acceptance language.

Do not reopen the overall S6 architecture. Do not begin S6 implementation. Do not
modify executable tests or fixtures for suspended D-068.

## Evidence disposition

INDEPENDENTLY_INSPECTED:

- the live RFC-019 amendment and its one-active-environment rule;
- the `CLAIMED` permit and Execution Report boundary;
- quarantine and late-report semantics;
- the reference-model and crash-matrix requirements;
- the Builder handoff's explicit design choice that a quarantined claimed-but-unreported
  instance would not block a new instance.

ACTOR_REPORTED evidence in the Builder handoff is not upgraded by this review.

No executable S6 file, runtime behavior, deployment, or production state is approved
or verified by this review.

## Hard boundaries

No `devos/execution/**` mutation.
No executable tests or fixtures for suspended D-068.
No S3/S4/S5 implementation mutation.
No S7+.
No manifest closure or version mutation.
No production or deployment resources.
No PR #10 or `main` mutation.
All mutation, remote-resource, deployment, and main-merge flags remain `NO`.

S6 implementation remains paused.

## Routing

This review deselects and archives `H-S6-INTEGRITY-RFC-DRAFT-0001` byte-for-byte with
provenance.

Only AS99-F001 RFC-019 design remediation is authorized. The Builder must return a new
bounded handoff for independent Architect review. No Paulo decision is required for
this remediation cycle.

Route:

- `CYCLE_ID: SENTINEL_S6_INTEGRITY_HARDENING_RFC`
- `TURN: CLAUDE`
- `STATUS: CHANGES_REQUESTED`
- `AUTHORIZED_SCOPE: D073_AS99_F001_RFC019_DESIGN_REMEDIATION_ONLY`
- `ARCHITECT_ACTION_REQUIRED: NO`
- `IMPLEMENTER_ACTION_REQUIRED: YES`
- `PAULO_DECISION_REQUIRED: NO`
- `CURRENT_REMEDIATION_CYCLE: 1`
- `MAX_REMEDIATION_CYCLES: 2`
- `PROTOCOL_VERSION: 1`
- `CURRENT_HANDOFF: NONE`

The handoff selector fields are empty. All mutation, remote-resource, deployment, and
main-merge flags remain `NO`.
