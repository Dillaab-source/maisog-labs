# Architect Review — SENTINEL S6 Execution-Boundary Amendment

Architect Sync: ML-DEVOS-AS-090
Status: CHANGES_REQUESTED — REMEDIATION CYCLE 1 OF 2
Review mode: ARCHITECTURE STAGE GATE — D-069 EXECUTION-BOUNDARY AMENDMENT
Cycle: SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT
Authority: D-069
Reviewed amendment commit: ac701465dd4ff055d4a36b449e4b8568a81b3deb
Reviewed amendment parent: e8bdb4241173b9b1f59c3b0d596a500bb79cc40c
Target RFC: ML-DEVOS-RFC-019
Prior accepted design review: ML-DEVOS-AS-089
Remediation cycle: 0 of 2 before this review

## Verdict

RFC-019 D-069 DIRECTION: ACCEPTED
RFC-019 AMENDED DESIGN: CHANGES_REQUESTED
D-068 executable implementation: REMAINS SUSPENDED
S6 executable implementation: NOT AUTHORIZED
Real execution driver: NOT AUTHORIZED
Scope compliance: PASS
Traceability: KNOWN CORE-022 / WEB-REQ-009 DEBT PRESERVED

The amendment correctly removes generic actor/tool command execution from S6 core and
moves that effect behind a separately authorized execution-driver boundary. The
MAY/CAN/ISOLATED separation, S4 fencing, S5 public-adapter use, dedicated-clone model,
RTR publication model and independent-QA reconstruction remain intact.

Three bounded correctness findings must be resolved before the amended design is ready
for a new Paulo implementation decision.

## Independent review basis

The Architect independently inspected authoritative commit
`ac701465dd4ff055d4a36b449e4b8568a81b3deb`, direct parent
`e8bdb4241173b9b1f59c3b0d596a500bb79cc40c`, the exact six-file delta,
`ML-DEVOS-RFC-019` §13/§13.1 and consequential §8/§10/§14/§16/§17/§18/§20
changes, the live turn packet, and the closed S5 public implementation.

The amendment delta is bounded to:
- RFC-019;
- the RFC index;
- deterministic traceability outputs;
- STATE and CURRENT_HANDOFF.

No executable S6 source, `devos/execution/`, execution tests, manifest/root mutation,
S3/S4/S5 implementation/interface mutation, ADR, closure record, version bump,
deployment, remote resource mutation, main merge, or PR #10 merge is present.

The live S5 implementation confirms an important boundary used below:
`requestIntent` is structurally limited to project/provider/action/resource/environment/
policy_version plus optional contract_ref/task_id. It has no argv field. The shell
adapter canonicalizes the resource path. Therefore S5 can gate the `shell.exec`
capability at a canonical resource under a policy, but it does not evaluate the command
argv itself.

Builder-reported test/validator execution remains ACTOR_REPORTED. This review claims
INDEPENDENTLY_INSPECTED for repository source/design/diff only.

## Accepted D-069 corrections

The amendment successfully establishes all of these required directions:

- S6 core exposes no generic `run(arbitraryCommand)` or raw actor-command
  `spawn()` surface.
- Actor/tool command execution is a distinct execution-driver responsibility.
- A real driver requires a separately reviewed design and explicit Paulo authority.
- Provider/runtime safety controls remain stop conditions and may not be bypassed.
- S6 retains identity, workspace/environment isolation, fencing, path confinement,
  journal/RTR/provenance, validation, completion/publication and QA reconstruction.
- S5 remains CAN authority and is consumed through its existing public adapter.
- The driver gains no MAY authority, S4 ownership, S5-policy authority or S6 identity.
- Fake-driver/fixed-fixture testing is separated from a future real generic driver.
- S3/S4/S5 remain byte/interface unchanged.

Those corrections remain accepted and must not be reopened by remediation.

## AS90-F001 — claimed-but-unreported permit can age into false quiescence

**Severity:** BLOCKING

§13 currently permits quiescence when every issued permit is "reported or expired".
That is safe for a permit that expired **before it was claimed**, because no execution
could have started through that permit.

It is not safe after claim.

The current flow is:

`ISSUED -> CLAIMED -> driver may start process -> REPORT`

If the driver claims the permit, starts a process, and then crashes before producing
the Execution Report, S6 does not know the process-group identity. When the permit later
expires, the current quiesce precondition can treat it as satisfied even though an
unknown process may still be running. S6 would then prove only the groups it knows
about, not the process potentially started under the claimed permit.

That contradicts the fail-closed quiescence requirement and can allow publication while
execution uncertainty remains.

**Required correction:**
- distinguish an unclaimed permit expiry from a claimed execution;
- an unclaimed permit may expire without execution;
- once a permit is claimed, time expiry MUST NOT make it quiescence-safe;
- a claimed permit without a verified terminal report remains execution-uncertain and
  MUST block quiesce/completion;
- crash/recovery semantics must state what happens to a claimed/unreported permit;
- absent independently provable termination, fail closed as `QUIESCE_UNPROVEN` (or the
  existing more-specific bounded code if the RFC can justify one) and quarantine rather
  than infer safety;
- add focused tests for claimed-then-driver-crash, claimed-then-expiry, and
  unclaimed-expiry.

No new task state machine is needed. This is permit-record lifecycle, subordinate to S4.

## AS90-F002 — request_id is named an idempotency key but has no replay contract

**Severity:** BLOCKING

The Execution Request defines `request_id` as "the caller's idempotency key", but
§13.1 mentions it nowhere else.

As written, a caller retry using the same `request_id` can pass the Permit step again
and mint another single-use permit. "Single use" prevents replay of one permit; it does
not prevent multiple permits for one logical command request. For a non-idempotent
command, that can execute the same logical request twice.

**Required correction:**
- bind `(instance_id, request_id)` immutably to the canonical request binding, at
  minimum `checkpoint_revision + argv_digest`;
- the first accepted request creates the one permit record for that binding;
- an exact replay MUST return/reference that existing permit/result state and MUST NOT
  mint a second permit;
- reuse of the same request_id with a different binding fails closed;
- specify behavior after unclaimed expiry and after claimed/reported terminal states.
  The safest V1 rule is that a new execution attempt requires a new request_id;
- define permit_id generation/retention sufficiently to make this replay deterministic
  (generated once and stored is acceptable);
- add exact-replay, conflicting-replay and retry-after-crash tests.

This is separate from S4 transition idempotency and must not be delegated to S4.

## AS90-F003 — S5 ALLOW is not argv-aware; the permit must preserve the real CAN binding

**Severity:** BLOCKING DESIGN-PRECISION / AUDITABILITY

The amendment sometimes says S5 provides an ALLOW "for" the Execution Request or that
the permit is "S5-gated" for the exact command. The latter is acceptable only with a
precise separation:

- current S5 does **not** receive or evaluate argv;
- its request intent contains provider/action/resource/environment/policy/project
  context, not command content;
- the exact argv is bound by S6's `argv_digest`, not by S5 policy evaluation.

Also, the proposed Execution Permit carries only "the S5 shell decision fields
verbatim". A closed S5 `CapabilityDecision` contains outcome/denial_reason/
descriptor_id/policy_version/non-authority disclaimer, but not provider/action/resource/
environment. The public adapter wrapper separately returns the canonical
`presented.request_intent`.

Without binding that canonical request intent (or an equivalent digest) into the
permit/journal, a later reviewer cannot prove from the permit which `shell.exec`
resource/context the ALLOW actually evaluated.

**Required correction:**
- state explicitly that S5 ALLOW gates the shell-execution capability at the canonical
  S5 request axes; it is not an argv-level command approval;
- preserve S6 `argv_digest` as the exact command binding;
- bind the permit/journal to the exact canonical S5 request intent used for the ALLOW
  (store it or a deterministic digest plus the returned decision/envelope fields);
- on claim/report verification, preserve the association between that S5 CAN decision,
  the permit and the argv digest;
- do not add argv to S5 or change any S5 interface under D-069;
- if command-content-aware capability policy is ever wanted, identify it as a future,
  separately governed S5 architecture change;
- add a focused test proving that an ALLOW obtained for a different action/resource/
  policy/context cannot be substituted into a permit.

## Scope / evidence disposition

PASS:
- D-069 write scope;
- no executable implementation;
- no safety-control bypass;
- no S3/S4/S5 mutation;
- no manifest/version/closure drift;
- D-068 remains suspended;
- local unpublished D-068 draft remains outside the governed delta.

ACTOR_REPORTED:
- Builder npm/test/validator results;
- Builder statement about clean-worktree isolation from the local draft.

INDEPENDENTLY_INSPECTED:
- authoritative commit/parent;
- exact changed-file set;
- amended §13.1 boundary and consequential RFC changes;
- current S5 request-intent and shell-adapter semantics;
- turn-packet identity and D-069 scope.

No RUNTIME_OBSERVED evidence is claimed.

## Remediation scope — Cycle 1 of 2

Claude / Builder is authorized under D-069 + AS-090 to correct **only**
AS90-F001, AS90-F002 and AS90-F003.

Allowed writes remain:
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`;
- `devos/changes/rfcs/README.md` only if factual status/index wording requires it;
- deterministic traceability outputs;
- normal STATE/CURRENT_HANDOFF return records.

Required tests/evidence are design-level descriptions plus the normal repository
regression/validators/traceability already required for this documentation cycle.

The local D-068 implementation draft remains preserved, uncommitted and unpushed.
Do not import it, execute it further, or use remediation as authority to resume
implementation.

## Hard boundaries

No executable S6 implementation.
No real execution-driver implementation.
No generic command-execution surface.
No safety-control bypass or permission expansion.
No manifest/root mutation.
No S3/S4/S5 implementation/interface mutation.
No S6 closure or version bump.
No S7+.
No live S6 remote transport or credentials.
No remote D1/R2.
No Cloudflare production/deployment mutation.
No protected/main merge.
No PR #10 merge.

## Routing

This review deselects and archives `H-S6-EXECBOUNDARY-0001` byte-for-byte with
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
Architect Sync after AS-090.

D-068 does not resume automatically even if these findings are closed.
