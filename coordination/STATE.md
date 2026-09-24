# MaisogLabs Agent Coordination State

CYCLE_ID: SENTINEL_S6_CORE_IMPLEMENTATION
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: SENTINEL_S6_CORE_IMPLEMENTATION_D071_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2
PROTOCOL_VERSION: 1
CURRENT_HANDOFF: NONE
HANDOFF_ID:
REVIEW_TARGET_COMMIT:
APPLICABLE_REVIEW_ID: ML-DEVOS-AS-093
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: NO
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-071 authorizes one fresh bounded S6-core implementation cycle against the
D-069 / D-070 amended ML-DEVOS-RFC-019 approved by ML-DEVOS-AS-093.

D-068 remains suspended and is not revived.

## Authorized S6-core implementation

Claude / Builder may implement the RFC-019 S6 core, including:

- immutable Execution Identity and mutable gap-free Fencing Checkpoint;
- platform profiles, path confinement, verified creation/deletion and fail-closed
  TOCTOU handling;
- dedicated-clone workspace lifecycle and validation;
- environment/config construction and secret-channel stripping;
- S6 registry, hash-chained journal and provenance;
- Result Transfer Record construction/replay/non-circular publication provenance;
- Execution Request / Permit / Report contracts and permit lifecycle;
- request_id idempotency and one-request/one-permit binding;
- S5 shell decision consumption at issuance;
- claim-time S5 live revocation/expiry/trusted-time recheck;
- S5 subject actor_id/actor_role binding to immutable S6 owner/role using:
  BUILDER -> Builder and QA -> QA;
- quiescence proof, cleanup, quarantine and crash recovery;
- completion/publication control and independent QA reconstruction;
- transport/ref/lease/provenance logic exercised only with local/synthetic transport;
- RFC-019 reason vocabulary/precedence and focused tests.

## Execution boundary

S6 core MUST NOT expose or implement:

- run(arbitraryCommand);
- raw caller-supplied spawn();
- a shell bridge;
- a generic actor/tool command executor;
- any equivalent API that executes caller-selected argv.

No real execution driver is authorized.

Permitted testing is limited to:

- injected fake drivers that execute nothing;
- fixed deterministic checked-in fixture operations with literal behavior/argv where
  RFC-019 requires real filesystem/process evidence;
- local bare Git repositories and synthetic/mocked provider results.

Test fixtures must not accept caller-supplied command strings/argv and must not evolve
into a generic driver.

If a provider/runtime safety control blocks even a bounded fixture/test operation, STOP
and return to Architect/Paulo. Do not expand permissions, wrap the blocked action, use an
alternate execution path, or otherwise route around the control.

## S3 / S4 / S5 boundary

No S3/S4/S5 implementation, interface, schema, policy semantics, persistence,
evaluator/minter or lifecycle mutation is authorized.

S4 remains task-state/fencing authority.
S5 remains CAN authority and is not argv-aware.
S6 consumes only accepted public interfaces.

## Manifest / root

Authorized:

- create canonical devos/execution/;
- add exactly the approved S6 manifest root entry:
  { "path": "devos/execution/", "owning_phase": "S6",
    "consuming_phases": ["S7","S8"], "status": "NOT_IMPLEMENTED",
    "executable_runtime_present": false }
- no closure_ref;
- narrowly update tests/devos-manifest.test.mjs only if required for this NOT_IMPLEMENTED
  root.

This is implementation-in-progress metadata, not S6 closure.

## Authorized repository writes

Only:

- devos/execution/**;
- devos/devos-manifest.json for the approved S6 root entry only;
- tests/execution-*.test.mjs;
- narrowly necessary tests/fixtures/**;
- tests/devos-manifest.test.mjs only as required by the root addition;
- ML-DEVOS-RFC-019.md and devos/changes/rfcs/README.md only for factual
  implementation-status/provenance notes that do not claim closure;
- deterministic traceability outputs;
- coordination/STATE.md and coordination/CURRENT_HANDOFF.md.

No other subsystem source/interface mutation.

## Required evidence

Builder must report exact results/exit codes for:

- applicable RFC-019 §18 S6-core focused tests;
- permit lifecycle/idempotency/freshness/subject-binding tests;
- path/environment/quiescence/recovery/failure/mutation tests;
- RTR replay/non-circular provenance and QA-reconstruction tests;
- local/synthetic transport denial/ref/lease tests;
- npm test;
- manifest validator;
- capability-policy validator;
- task-contract validator;
- rules validator;
- waiver validator;
- skills bridge validator;
- git diff --check;
- traceability generation/validation.

Platform claims must be honest: NOT RUN is required for platforms not actually executed.

All Builder evidence remains ACTOR_REPORTED pending Architect inspection/reproduction.

## Return gate

After the bounded implementation, publish a fresh CURRENT_HANDOFF and return:

TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2

The handoff must include changed files, exact test/validator exit codes, platform matrix,
failure/mutation evidence, traceability result, residual limitations, and confirmation
that no real execution driver or live S6 remote transport was introduced.

## Version / closure

Sentinel remains v1.8.0.

Do NOT:

- set S6 manifest status to IMPLEMENTED;
- add closure_ref;
- create S6 closure ADR/history;
- bump Sentinel version;
- represent implementation completion as phase closure.

Closure remains separately gated after independent implementation review.

## Hard boundaries

No safety-control bypass or permission expansion.
No generic command-execution implementation.
No real execution-driver implementation.
No standing live S6 GitHub transport authority.
No real S6 network writes or credentials.
No protected ref mutation, force push, delete, tag, PR-setting or repository-setting mutation.
No S3/S4/S5 implementation/interface mutation.
No S6 closure / closure_ref / version bump.
No S7+.
No S8 orchestration.
No S9 evidence gate.
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

All remote/deploy/main/mutation flags remain NO.
No operative obligation is closed by D-071.
