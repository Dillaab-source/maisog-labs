# Architect Review — SENTINEL S6 Isolated Execution Design Remediation 1

Architect Sync: ML-DEVOS-AS-087
Status: CHANGES_REQUESTED — REMEDIATION CYCLE 2
Review mode: ARCHITECTURE REMEDIATION RE-REVIEW
Cycle: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
Authority: D-066
Reviewed remediation commit: 9295823272574a1c72762ae76cef60d7acddd3e0
Reviewed remediation parent: 4d8b403168e6c4f3425a3219bf9fb79e8deb192c
Target RFC: ML-DEVOS-RFC-019
Prior review: ML-DEVOS-AS-086
Remediation cycle: 2 of 2

## Verdict

S6 RFC-019 REMEDIATION 1: CHANGES REQUESTED
AS86-F001: CLOSED
AS86-F002: CLOSED IN ARCHITECTURE DIRECTION, SUBJECT TO AS87-F001 PAYLOAD CORRECTION
AS86-F003: CLOSED
AS86-F004: CLOSED
Overall architecture direction: PASS WITH ONE REMAINING EXECUTABLE-CONTRACT BLOCKER
S6 executable implementation: NOT AUTHORIZED
Manifest/root reservation: NOT AUTHORIZED
S5 runtime wiring: NOT AUTHORIZED
S7+: NOT AUTHORIZED
Deployment / production mutation / protected-main merge / PR #10 merge: NOT AUTHORIZED

Remediation Cycle 1 materially corrected the four AS-086 findings. One remaining
contract mismatch would nevertheless make the proposed Builder publication transition
fail against the already-implemented S4 kernel every time. That mismatch must be fixed
before RFC-019 can be approved.

## Independent review basis

The Architect independently inspected authoritative commit
`9295823272574a1c72762ae76cef60d7acddd3e0`, its exact parent, its bounded six-file
design/remediation delta, RFC-019, the S4 kernel/lifecycle implementation, S3 scope
semantics, CORE-019/CORE-020, and the committed traceability index.

The proposal remains design-only. No S6 executable code, S3/S4/S5 implementation or
interface mutation, manifest/root reservation, product/runtime change, deployment,
protected/main merge, or later-phase implementation was introduced.

Traceability remains 339 scanned files / 2 errors / 14 warnings / 297 canonical
definitions, with the error fingerprint exactly CORE-022 and WEB-REQ-009.

## Disposition of AS-086 findings

### AS86-F001 — CLOSED

RFC-019 now correctly separates:

- immutable Execution Identity with an immutable `anchor_revision`; and
- mutable S4-derived Fencing Checkpoint with `current_revision`.

The checkpoint is not a second counter. It adopts only values S4 actually returned,
requires a gap-free +1 advance for the same task/owner, confirms immediately through
`getState()`, and permanently stales the instance on unexplained revision movement.
This matches S4's accepted rule that every successful mutation increments the unified
revision exactly once.

### AS86-F002 — CLOSED IN DIRECTION, PAYLOAD DETAIL REMAINS UNDER AS87-F001

The new S6-owned Result Transfer Record removes the false assumption that S4
`getState()` exposes `evidenceRef` or a result commit.

The write-ahead PENDING → COMMITTED/ABORTED mapping, exact-SHA QA reconstruction,
S4-fenced publication, idempotent transition replay, and QA gap-free S4 chain are a
coherent way to preserve S4 as lifecycle authority without reading S4 internals or
implementing S7 early.

One field in the actual S4 transition call remains missing; that is isolated below as
AS87-F001.

### AS86-F003 — CLOSED

RFC-019 now distinguishes existing-path verification from non-existent-tail creation.
It canonicalizes the nearest existing ancestor, validates literal future path segments,
creates one segment at a time, revalidates identities/canonical paths after creation,
fails closed where race safety cannot be proven, and keeps creation separate from
no-follow deletion. This resolves the prior impossible "realpath before creation"
requirement without changing S5.

### AS86-F004 — CLOSED

RFC-019 now explicitly classifies task-branch Git fetch/push as separately governed
execution transport rather than task-selected remote-resource scope, requires a
CORE-019-complete transport authorization, preserves the S3 task-scope boundary,
narrows S5 use to actual bounded provider decisions, and keeps credentials host-side.

CORE-020 still applies to evidence sufficiency for consequential remote actions; the
transport classification does not create authority or evidence sufficiency by itself.
A future S6 implementation/transport authorization remains separately Paulo-gated.

## AS87-F001 — BLOCKER — S4 publication transition omits mandatory evidenceClass

RFC-019 §7.1 step 3 currently specifies the Builder publication call as:

- `BUILDING → READY_FOR_QA`;
- `expectedRevision = pre_revision`;
- `idempotencyKey = transfer_id`;
- `evidenceRef` carrying `transfer_id` and `result_commit_sha`.

The implemented S4 transition contract has an explicit evidence guard for
`BUILDING->READY_FOR_QA`.

`devos/state/lifecycle.mjs` accepts that edge only when:

`evidenceRef.evidenceClass`

is present and is one of the five bounded evidence classes. Without that property,
`transition()` returns `ILLEGAL_TRANSITION`.

Therefore the RFC-019 call as presently specified cannot perform its own publication
step.

### Required remediation

Keep S4 unchanged.

In RFC-019, define the exact Builder publication `evidenceRef` shape so it satisfies
the existing S4 public contract. At minimum it must include:

- `evidenceClass: "ACTOR_REPORTED"` for the Builder-produced publication evidence;
- the Result Transfer Record reference/identifier (for example `transfer_id`);
- `result_commit_sha` and any other already-specified provenance/digest fields needed
  by S6.

Use exactly the same evidenceRef bytes/content on crash-recovery replay so S4's
idempotency binding remains identical.

Do not upgrade Builder publication evidence above ACTOR_REPORTED merely because S6
proved isolation. Independent QA and later S7/S9 evidence handling remain separate.

Update the lifecycle/complete prose, test plan, and any summary/index text only where
directly necessary so there is one unambiguous payload contract.

This is a design correction only. Do not modify S4 implementation or add S7 behavior.

## Evidence disposition

INDEPENDENTLY_INSPECTED:

- authoritative remediation commit and exact parent;
- bounded changed-file surface;
- all four AS-086 remediation sections;
- S4 revision and idempotency behavior;
- S4 BUILDING→READY_FOR_QA evidence-class guard;
- S3 consequence flags;
- CORE-019 / CORE-020;
- traceability fingerprint.

ACTOR_REPORTED:

- Builder 606/606 test execution;
- validators and traceability regeneration;
- platform/tool versions.

No RUNTIME_OBSERVED evidence is claimed.

## Routing

Open Remediation Cycle 2 of the live maximum 2.

This publication deselects `H-S6-RFC019-REM1-0001`, archives it byte-for-byte with
provenance, publishes this review as immutable `ML-DEVOS-AS-087`, sets
CURRENT_HANDOFF NONE, and routes:

- TURN: CLAUDE
- STATUS: CHANGES_REQUESTED
- CURRENT_REMEDIATION_CYCLE: 2
- IMPLEMENTER_ACTION_REQUIRED: YES

Builder authority is limited to AS87-F001 and directly necessary RFC/index,
traceability, coordination and handoff evidence.

After remediation, Builder must return TURN: ARCHITECT / READY_FOR_ARCHITECT for the
final design review.

No S6 implementation, devos/execution root creation, manifest mutation, S5 runtime
wiring, transport authorization, S7+, CP-4+, Model Router, remote D1/R2, deployment,
production mutation, protected/main merge, or PR #10 merge is authorized.
