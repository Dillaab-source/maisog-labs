# MaisogLabs Agent Coordination State

CYCLE_ID: SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION
TURN: CLAUDE
STATUS: CHANGES_REQUESTED
AUTHORIZED_SCOPE: D074_AS102_F001_S6_EXPIRY_JOURNAL_REMEDIATION_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 1
MAX_REMEDIATION_CYCLES: 2
PROTOCOL_VERSION: 1
CURRENT_HANDOFF: NONE
HANDOFF_ID:
REVIEW_TARGET_COMMIT:
APPLICABLE_REVIEW_ID:
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: NO
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-074 remains the owner implementation authority.

`ML-DEVOS-AS-102` is the controlling Architect implementation review.

Only AS102-F001 expiry-journal remediation is authorized.

This is remediation cycle 1 of 2.

## Builder objective

Correct the runtime/model I5 mismatch for lazy unclaimed permit expiry.

An `ISSUED -> EXPIRED_UNCLAIMED` transition must commit its justifying journal evidence in the same TaskStore transaction.

Preserve all accepted D-074 hardening behavior.

## Required correction

For every permit transitioned by lazy expiry:

- keep the historical terminal state `EXPIRED_UNCLAIMED`;
- append an explicit expiry journal event for that exact permit;
- commit state and evidence atomically;
- do not expire `CLAIMED` permits;
- do not alter execution-uncertainty reservations;
- do not create a separately mutable evidence file.

Add focused runtime/model and falsification coverage.

## Authorized writes

Only directly necessary:

- `devos/execution/host.mjs`;
- directly necessary S6 helper code;
- directly necessary `tests/execution-*.test.mjs`;
- narrowly necessary fixed execution fixtures;
- factual S6 README text if necessary;
- deterministic traceability outputs if required;
- `coordination/STATE.md`;
- `coordination/CURRENT_HANDOFF.md`.

## Carry-forward — do not modify

The following remain explicit carry-forward concerns, not this remediation's scope:

1. Linux is the only transaction-store platform with supplied runtime atomicity evidence; macOS and Windows remain NOT RUN / refused.
2. The explicit exceptional operator recovery semantics for an unattributable PENDING publication remain incomplete.

Do not silently solve, suppress or redefine either item in AS102-F001 remediation.

## Return gate

After the bounded remediation:

TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 1
MAX_REMEDIATION_CYCLES: 2

Return a fresh bounded handoff.

## Hard boundaries

No architecture redesign.
No platform-scope rewrite.
No PENDING-operator-recovery redesign.
No real execution driver.
No generic executor.
No S3/S4/S5 implementation mutation.
No S7+.
No S8/S9.
No CP-4+.
No Model Router.
No dynamic plugin discovery.
No remote D1/R2.
No production deployment.
No manifest closure/version promotion.
No protected/main merge.
No PR #10 merge or auto-merge.

All action-specific flags remain NO.

The suspended D-068 local draft remains untouched.
