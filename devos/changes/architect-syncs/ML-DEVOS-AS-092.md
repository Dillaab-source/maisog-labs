# Architect Review — SENTINEL S6 Execution-Boundary Amendment Final Re-review

Architect Sync: ML-DEVOS-AS-092
Status: CHANGES_REQUESTED — REMEDIATION BUDGET EXHAUSTED / PAULO DECISION REQUIRED
Review mode: ARCHITECTURE STAGE GATE — AS-091 FINAL REMEDIATION RE-REVIEW
Cycle: SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT
Authority: D-069 / ML-DEVOS-AS-091
Reviewed remediation commit: 5d3f0777ca82f2cf5f6890dd3319f6999255b541
Reviewed remediation parent: f8c41720fb9514014b0b2a5b55422c37c5a53ccc
Target RFC: ML-DEVOS-RFC-019
Prior review: ML-DEVOS-AS-091
Remediation cycle: 2 of 2 — maximum reached

## Verdict

AS90-F001: CLOSED
AS90-F002: CLOSED
AS90-F003: CLOSED
AS91-F001: CLOSED
RFC-019 D-069 DIRECTION: ACCEPTED
RFC-019 AMENDED DESIGN: CHANGES_REQUESTED
IMPLEMENTATION READINESS: NOT READY
D-068 executable implementation: REMAINS SUSPENDED
S6 executable implementation: NOT AUTHORIZED
Real execution driver: NOT AUTHORIZED
Scope compliance: PASS
Traceability: KNOWN CORE-022 / WEB-REQ-009 DEBT PRESERVED
Remediation budget: EXHAUSTED — OWNER DECISION REQUIRED

The final Cycle-2 correction closes the S5 live-revocation/expiry gap. One distinct
identity-binding blocker remains. Because the authorized remediation cap is already
2 of 2, the Architect does not open another cycle. Paulo must decide whether to
authorize one exceptional micro-remediation.

## Independent review basis

The Architect independently inspected authoritative commit
`5d3f0777ca82f2cf5f6890dd3319f6999255b541`, direct parent
`f8c41720fb9514014b0b2a5b55422c37c5a53ccc`, the exact five-file Cycle-2 delta,
RFC-019 §8/§13.1/§18, the accepted S5 trusted-subject/public-adapter implementation,
and the immutable S6 Execution Identity definition.

The Cycle-2 delta remains bounded to RFC-019, deterministic traceability outputs and
coordination return records. No executable S6 source, execution driver, manifest/root
mutation, S3/S4/S5 implementation/interface change, closure/version mutation, remote
resource mutation, deployment, protected/main merge, or PR #10 merge is present.

Builder test/validator execution remains ACTOR_REPORTED. This review is
INDEPENDENTLY_INSPECTED for source/design/diff and the S5/S6 identity cross-check.

## AS91-F001 — CLOSED

The final remediation now makes claim the mandatory S5 freshness boundary:

- permit issuance still gets and binds the initial S5 ALLOW;
- immediately before `ISSUED -> CLAIMED`, S6 calls the existing public S5 shell
  adapter again with the pinned canonical request intent;
- fresh trusted time and the live revocation list therefore reach the attempt;
- ordinary policy supersession does not disturb the pinned policy version;
- emergency revocation, descriptor expiry, any DENY, trusted-source failure or
  claim-time binding mismatch prevents execution and terminally invalidates the permit;
- the claim-time result is journaled separately, so the immutable permit body is not
  rewritten;
- exact replay remains side-effect-free and does not weaken the claim freshness rule;
- the test plan covers revocation, expiry, supersession, replay, mismatch and trusted
  source failure.

This matches S5 RFC-017 §6's pinned-policy/live-revocation/trusted-time semantics.

## AS92-F001 — S5 subject is not bound to the S6 execution owner/role

**Severity:** BLOCKING IDENTITY/CAPABILITY BINDING

S6's immutable Execution Identity already has:
- `owner`: the S4 owner actor ID;
- `role`: BUILDER or QA.

S5's trusted subject context independently has:
- `actor_id`;
- `actor_role`.

The amended RFC verifies the S5 request intent and decision at permit issuance. At
claim it also requires the fresh S5 subject's `actor_id`/`actor_role` to equal
"those recorded at issuance."

But the design never requires the **issuance-time S5 subject** itself to equal the S6
instance's immutable owner/role.

Therefore the same wrong-but-trusted S5 subject could theoretically be used at both
issuance and claim:
1. S6 instance is owned by actor A / role BUILDER.
2. trusted S5 host supplies actor B / another role, and S5 ALLOWs B.
3. permit issuance accepts that ALLOW because no S5-subject-to-S6-identity check exists.
4. claim-time recheck again supplies B; it matches "issuance" and is accepted.
5. the CAN decision is now bound to B while execution is fenced/published as A.

That violates the intended conjunction of S4 ownership and S5 capability. CAN must be
for the actor actually owning the S6 execution instance, not merely a subject stable
across two S5 calls.

There is also a precision defect: the permit stores
`s5_presented_digest`, not recoverable issuance `actor_id`/`actor_role` fields.
A digest of the full presented snapshot cannot serve as a field-level comparison at
claim, and evaluation time necessarily changes between issuance and claim.

### Required correction if Paulo authorizes an exceptional micro-remediation

Do not redesign S5 or S6. Correct only this binding:

- define one canonical S6->S5 role mapping for V1:
  - S6 `BUILDER` -> S5 `Builder`;
  - S6 `QA` -> S5 `QA`;
- at permit issuance, after the public S5 adapter returns and before accepting its ALLOW,
  require:
  - `presented.subject_context.actor_id == ExecutionIdentity.owner`;
  - `presented.subject_context.actor_role == canonicalRole(ExecutionIdentity.role)`;
- failure is `CAPABILITY_DENIED`; no permit/binding is created;
- bind this subject identity explicitly and inspectably into the permit/audit record
  (storing the two non-secret fields in the immutable permit body is sufficient; do not
  rely only on an opaque full-snapshot digest);
- at claim-time S5 recheck, compare the fresh subject directly to the same immutable
  Execution Identity / stored subject binding, not merely to an issuance digest;
- keep credential_class/credential_available/attestation_ref governed by S5's fresh
  trusted subject evaluation; do not copy secrets and do not add any new S5 field;
- preserve AS90-F001/F002/F003 and AS91-F001 unchanged;
- add focused design tests for wrong actor_id at issuance, wrong actor_role at issuance,
  identity drift at claim, and correct Builder/QA role mapping.

No S5 implementation/interface change is needed.

## Evidence disposition

INDEPENDENTLY_INSPECTED:
- authoritative remediation commit and parent;
- exact changed-file set;
- AS91-F001 claim-time S5 freshness correction;
- S5 trusted subject fields and wrapper semantics;
- S6 immutable Execution Identity owner/role;
- absence of a subject-to-instance identity binding in current RFC-019.

ACTOR_REPORTED:
- Builder npm/test/validator execution;
- clean-worktree and unpublished-draft preservation claims.

No RUNTIME_OBSERVED evidence is claimed.

## Owner gate — remediation budget exhausted

The ordinary remediation budget is exhausted at 2 of 2.

The Architect recommends, but does not authorize, one **exceptional micro-remediation**
limited exactly to AS92-F001. This is a small identity-binding correction; it does not
reopen the execution-driver architecture, S5 semantics, permit lifecycle, request
idempotency, claim-time revocation freshness, or any executable implementation.

Paulo may:
1. authorize one exceptional AS92-F001-only design remediation; or
2. keep the amendment paused / require broader redesign.

Until Paulo decides, no Builder action is authorized.

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

D-068 remains suspended.

## Routing

This review deselects and archives `H-S6-EXECBOUNDARY-REM2-0001` byte-for-byte with
provenance.

Route:
- TURN: PAULO
- STATUS: PAULO_DECISION_REQUIRED
- CURRENT_REMEDIATION_CYCLE: 2
- MAX_REMEDIATION_CYCLES: 2
- IMPLEMENTER_ACTION_REQUIRED: NO
- ARCHITECT_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: YES

No third remediation cycle is opened by AS-092.
