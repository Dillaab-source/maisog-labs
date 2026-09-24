# MaisogLabs Agent Coordination State

CYCLE_ID: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: SENTINEL_S6_ISOLATED_EXECUTION_PROPOSAL_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
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

`D-066` authorizes the next sequential Sentinel phase, **S6 — Isolated Execution**, for discovery, architecture proposal, and audit only.

Allocate:
`ML-DEVOS-RFC-019`

Roadmap target:
task-scoped branch/worktree/sandbox isolation for Builder and QA work.

This is **proposal-only authority**. No executable S6 behavior is authorized.

## Builder design turn

Use LEAN / DELTA-ONLY reads.

Prepare RFC-019 as an ARCHITECTURE-class proposal covering:

- task/repository/base-ref/branch/worktree/sandbox identity;
- isolation threat model and explicit V1 non-goals;
- clean-base/freshness and stale-worktree handling;
- writable/read-only/path/symlink/escape boundaries;
- process/environment/dependency/cache/secret isolation expectations;
- concurrent-task collision and cross-task contamination prevention;
- create/claim/use/renew/cleanup/recovery lifecycle;
- idempotency, retries, crash/orphan recovery, rollback/cleanup;
- Windows/POSIX portability;
- deterministic failure modes;
- evidence/provenance and failure-injection/mutation test plan;
- composition with S3 scope, S4 ownership/leases/fencing, S5 capability decisions, and independent QA;
- an explicit canonical-home recommendation, noting that no dedicated S6 manifest root currently exists.

Do not implement the design.

Authorized proposal surfaces:

- devos/changes/rfcs/ML-DEVOS-RFC-019.md
- devos/changes/rfcs/README.md
- deterministic traceability outputs if changed
- normal Context Bootstrap coordination/handoff evidence required to return for review

On completion, publish a new CURRENT_HANDOFF and return:

`TURN: ARCHITECT`
`STATUS: READY_FOR_ARCHITECT`
`ARCHITECT_ACTION_REQUIRED: YES`

for independent architecture review after ML-DEVOS-AS-085.

## Hard boundaries

No S6 executable implementation.
No executable S6 root or manifest-status change.
No S3/S4/S5 implementation/interface mutation.
No S5 runtime wiring.
No S7+.
No CP-4+.
No Model Router implementation.
No dynamic plugin discovery.
No credentials or secret values.
No remote D1/R2.
No Cloudflare Access/DNS/domain/deployment/rollback/production mutation.
No production-data writes.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.

All remote/deploy/main/mutation flags remain NO.

Known traceability debt CORE-022 and WEB-REQ-009 remains visible unless separately and legitimately resolved.
