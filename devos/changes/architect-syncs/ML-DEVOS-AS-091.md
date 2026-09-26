# Architect Review — SENTINEL S6 Execution-Boundary Amendment Remediation 1

Architect Sync: ML-DEVOS-AS-091
Status: CHANGES_REQUESTED — FINAL REMEDIATION CYCLE 2 OF 2
Review mode: ARCHITECTURE STAGE GATE — AS-090 REMEDIATION RE-REVIEW
Cycle: SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT
Authority: D-069 / ML-DEVOS-AS-090
Reviewed remediation commit: ccdbbc754ee45769f3da16c7bbdba27641b67084
Reviewed remediation parent: a0936ec09e9cd5aa3b2e8dda6f0ba05d58af6eaf
Target RFC: ML-DEVOS-RFC-019
Prior review: ML-DEVOS-AS-090
Remediation cycle: 1 of 2

## Verdict

AS90-F001: CLOSED
AS90-F002: CLOSED
AS90-F003: CLOSED
RFC-019 D-069 DIRECTION: ACCEPTED
RFC-019 AMENDED DESIGN: CHANGES_REQUESTED
D-068 executable implementation: REMAINS SUSPENDED
S6 executable implementation: NOT AUTHORIZED
Real execution driver: NOT AUTHORIZED
Scope compliance: PASS
Traceability: KNOWN CORE-022 / WEB-REQ-009 DEBT PRESERVED

The Cycle 1 remediation correctly closes all three AS-090 findings. One new cross-system
correctness blocker remains: the amended permit can be issued under a valid S5 ALLOW and
then claimed later without another S5 evaluation. That is inconsistent with the closed
S5 contract's live revocation and trusted-time expiry semantics.

This is the final ordinary remediation cycle available under the live cap.

## Independent review basis

The Architect independently inspected authoritative commit
`ccdbbc754ee45769f3da16c7bbdba27641b67084`, direct parent
`a0936ec09e9cd5aa3b2e8dda6f0ba05d58af6eaf`, the exact six-file delta,
RFC-019 §8/§13/§13.1/§15/§18, the live turn packet, and the accepted S5 design/ADR.

The remediation stays inside D-069 / AS-090 scope. No executable S6 source, driver,
manifest/root mutation, S3/S4/S5 implementation/interface change, closure/version
change, deployment, remote resource mutation, main merge, or PR #10 merge is present.

Builder test/validator execution remains ACTOR_REPORTED. This review claims
INDEPENDENTLY_INSPECTED for source/design/diff and the cross-check against S5.

## AS90-F001 — CLOSED

The permit lifecycle now correctly distinguishes unclaimed expiry from claimed execution.

- `ISSUED` may become terminal `EXPIRED_UNCLAIMED` or `REVOKED` before claim.
- time never moves `CLAIMED` to a safe state;
- a claimed permit without a verified report blocks quiesce/completion as
  `QUIESCE_UNPROVEN`;
- recovery quarantines a claimed/unreported instance rather than inferring process
  termination;
- later evidence cannot silently un-quarantine it;
- the focused test plan covers claimed-driver-crash, claimed-expiry and unclaimed-expiry.

This closes the false-quiescence gap.

## AS90-F002 — CLOSED

`(instance_id, request_id)` now has one durable immutable binding and one generated
`permit_id`.

- exact replay returns the existing permit/state and never mints a second permit;
- conflicting reuse fails `MALFORMED_REQUEST`;
- binding/permit creation is one exclusive, durable step before response;
- crash-before-response resolves by replay;
- terminal/uncertain states require a new request_id for a new execution attempt;
- the test plan covers exact/conflicting/concurrent replay and crash retry.

This closes the duplicate-logical-execution gap at permit minting.

## AS90-F003 — CLOSED

The RFC now accurately reflects the closed S5 interface.

- S5 V1 is explicitly not argv-aware;
- S5 gates `shell.exec` at its canonical request axes;
- S6 binds exact command content independently through `argv_digest`;
- the immutable permit binds the canonical presented S5 request intent, its digests,
  returned decision fields and the argv digest;
- caller/driver supplied decisions are not accepted;
- claim/report re-check the permit digest;
- command-content-aware CAN policy is correctly deferred to a future S5 architecture
  change, not smuggled into this amendment.

This closes the CAN/argv overclaim and decision-substitution gap.

## AS91-F001 — issued permit can outlive live S5 revocation or descriptor expiry

**Severity:** BLOCKING

The current flow evaluates S5 only when the permit is first issued.

An exact request replay returns that stored permit with no new S5 call, and the Claim
step checks permit integrity, `claim_deadline`, argv binding and S4 fencing, but does
not re-evaluate S5 before the driver may execute.

That creates this sequence:

1. S6 calls S5 and receives ALLOW; permit becomes `ISSUED`.
2. Before claim, the descriptor is emergency-revoked, or its expiry passes.
3. Driver claims the still-unexpired permit.
4. Driver executes without S5 seeing the current revocation list/current trusted time.

That conflicts with the accepted S5 contract:

- the attempt remains policy-version pinned;
- **revocation is live, never pinned**;
- the caller fetches the current revocation list on every evaluation call;
- descriptor expiry is checked against trusted evaluation time and is never cached;
- S5's accepted consequence is that an in-flight attempt remains reachable by emergency
  revocation.

A short S6 `claim_deadline` is not a substitute for S5's revocation/expiry semantics.

### Required correction

Preserve the current permit/idempotency design, but add a **claim-time S5 recheck**:

- Permit issuance still performs the initial S5 evaluation and stores its canonical
  request binding.
- Immediately before changing `ISSUED -> CLAIMED`, S6 MUST call the public S5 shell
  adapter again using the permit's exact pinned canonical request intent axes.
- That call gets fresh trusted time and the live revocation list through the existing S5
  adapter; no S5 interface change is needed.
- The policy version stays the permit's pinned version. Ordinary supersession therefore
  does not destabilize the attempt, matching S5 §6.
- Claim proceeds only on a fresh ALLOW whose canonical presented request intent matches
  the permit's stored S5 binding.
- `REVOKED`, `EXPIRED`, any other DENY, trusted-source failure, or binding mismatch
  MUST prevent claim/execution and leave the permit in a terminal non-executable state
  (reusing `REVOKED` is acceptable if the RFC defines it as capability-invalidated,
  otherwise choose an existing fail-closed permit status without changing the S6 reason
  vocabulary).
- Journal the claim-time S5 decision/check separately. Do not rewrite the immutable
  permit body merely to insert a later decision.
- An exact replay may still return the existing permit without an S5 call because replay
  itself has no execution effect; **claim is the mandatory freshness boundary**.
- After a successful claim, the later driver execution is the same already-admitted
  attempt; this finding does not require continuous polling while a command is running.
- Keep argv binding in S6. Do not add argv to S5.

### Required tests

Add design requirements proving:

- issue ALLOW -> revoke descriptor -> claim is blocked, no execution;
- issue ALLOW -> advance trusted time beyond descriptor expiry -> claim is blocked;
- ordinary policy supersession without revocation does not invalidate the pinned,
  unexpired descriptor;
- exact replay of an ISSUED permit mints nothing and does not itself execute, but a
  subsequent claim still performs the fresh S5 check;
- claim-time presented-intent substitution/mismatch is blocked;
- a trusted-source-unavailable failure at claim fails closed.

## Evidence disposition

INDEPENDENTLY_INSPECTED:
- authoritative commit/parent and bounded changed-file set;
- AS90-F001/F002/F003 remediation text;
- S5 RFC-017 §6 revocation/expiry/policy pinning semantics;
- S5 ADR-015 accepted live-revocation consequence;
- live turn packet and D-069 scope.

ACTOR_REPORTED:
- Builder npm/test/validator execution;
- Builder clean-worktree and local-draft preservation claims.

No RUNTIME_OBSERVED evidence is claimed.

## Final remediation scope — Cycle 2 of 2

Claude / Builder is authorized to correct **only AS91-F001** while preserving all closed
AS-090 findings and the accepted D-069 execution-driver separation.

Allowed writes remain:
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`;
- `devos/changes/rfcs/README.md` only if factual status/index wording requires it;
- deterministic traceability outputs;
- normal STATE/CURRENT_HANDOFF return records.

No executable S6 source or driver may be implemented.

## Hard boundaries

No safety-control bypass or permission expansion.
No S6 executable implementation.
No generic command-execution implementation.
No real execution-driver implementation.
No manifest/root mutation.
No S3/S4/S5 implementation/interface mutation.
No S6 closure or Sentinel version bump.
No live S6 remote transport or credentials.
No S7+.
No remote D1/R2.
No Cloudflare production/deployment mutation.
No protected/main merge.
No PR #10 merge.

## Routing

This review deselects and archives `H-S6-EXECBOUNDARY-REM1-0001` byte-for-byte with
provenance.

Route:
- TURN: CLAUDE
- STATUS: AUTHORIZED
- CURRENT_REMEDIATION_CYCLE: 2
- MAX_REMEDIATION_CYCLES: 2
- IMPLEMENTER_ACTION_REQUIRED: YES
- ARCHITECT_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO

Claude returns a fresh handoff for final independent re-review under the next unused
Architect Sync after AS-091.

If a further blocker remains after Cycle 2, the remediation budget is exhausted and the
matter routes to Paulo rather than opening an unapproved third cycle.

D-068 remains suspended regardless of this remediation result.
