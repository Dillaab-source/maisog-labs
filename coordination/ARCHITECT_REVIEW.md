# Architect Builder Brief — S4 State Machine Kernel Implementation

Status: AUTHORIZED IMPLEMENTATION
Authority: D-050
Design: ML-DEVOS-RFC-016
Design stage gate: ML-DEVOS-AS-065
Branch: governance/maisoglabs-v0.1

## Objective

Implement the smallest repository-local S4 State Machine Kernel exactly as accepted in RFC-016 and D-050. Do not perform S4 closure or any later-phase work.

## LEAN / DELTA-ONLY BUILDER MODE — REQUIRED

Read first:
1. coordination/STATE.md
2. this file
3. devos/changes/rfcs/ML-DEVOS-RFC-016.md
4. only the exact devos/state/ and tests/ files you create or modify

Read any additional repository source only when a specific RFC-016 implementation requirement requires resolving that source. Do not reread the full governance history, prior Architect Sync archive, old handoffs, all ADRs, or unrelated CORE files.

Do not restate old narrative. Do not perform unrelated cleanup. Keep the implementation and handoff compact.

## Locked Paulo policy values

Per D-050:
- Task Policy scope: per-project for Dillaab-source/maisog-labs
- retry ceiling: build = 2
- retry ceiling: qa = 2
- retry ceiling: review = 2
- FAILED and ABANDONED are adopted as additive S4 terminal states for this implementation
- force_clear_lock is NOT an ordinary kernel mutation
- Paulo is the only default authorized force-clear operator for V1
- any other operator requires a separate Paulo delegation Decision
- force-clear invocation must record operator identity, authorization reference, reason, and affirmative confirmation that no writer remains

Do not derive any retry value from coordination/STATE.md.

## Authorized implementation surfaces

Primary:
- devos/state/** required by RFC-016 implementation mapping
- focused S4 tests under tests/**

Supporting only:
- deterministic traceability outputs if regeneration changes them
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

The existing devos/state/README.md may be updated only as necessary to describe the now-present implementation truth without claiming S4 closure or manifest activation.

## Required implementation behavior

Implement:
- task-state structural schema / validator
- pure deterministic lifecycle transition logic
- CREATED through VERIFIED plus FAILED / ABANDONED
- claim / renew / release / transition / get_state / sweep_expired_leases
- exclusive-create per-task lock
- lock-held read → revision check → validation → mutation → temp-write → atomic rename → unlock critical section
- monotonically increasing revision on successful mutations
- designated cross-role handoff transitions clearing owner/lease atomically
- persisted idempotency for claim / renew / transition
- release's already-unowned safe no-op semantics
- injected clock for deterministic lease testing
- local JSON per-task persistence
- bounded state-transition provenance only; no run-history telemetry
- per-project Task Policy using D-050 values 2/2/2
- fail-closed LOCK_HELD / LOCK_RECOVERY_REQUIRED behavior
- separate force-clear maintenance operation with D-050 authority/provenance guard
- evidence-reference presence/class-label structural guards only; no S9 evidence-sufficiency engine
- fixed non-authority disclaimer

Do NOT implement orchestration, actor permission gateway, evidence artifact storage, Evidence Gate, CI/rulesets, deployment/runtime verification, remote storage, credentials, or any S5+ capability.

## Focused tests required

At minimum implement and run the RFC-016 mapped tests:
- all legal lifecycle transitions and representative illegal skips/terminal exits
- structural field rejection / Task Engine State boundary
- two real concurrent OS-level claim writers: exactly one winner
- stale revision after superseding claim: rejected
- Builder→QA, QA→Reviewer, Reviewer→Builder immediate handoffs and prior-owner fencing
- claim / renew / transition replay and conflicting idempotency-key reuse
- repeated release safe no-op vs stale release against a new owner
- retry ceiling 2/2/2 and fail-closed escalation
- prove coordination/STATE.md MAX_REMEDIATION_CYCLES does not influence S4 task retry behavior
- deterministic injected-clock behavior
- tmp-file crash recovery / corrupt final record scoped failure
- orphaned lock of any age is never auto-stolen
- force-clear requires the D-050 operator/provenance conditions
- evidence-class-label guards without evidence-content inspection
- fixed non-authority disclaimer

Use real child processes or worker threads for the concurrent writer test; two sequential calls in one event loop do not satisfy the race requirement.

## Verification

Run only focused S4 tests plus required repository-local structural checks and traceability generation/validation. Do not run unrelated application/browser/deploy tests.

Builder output remains ACTOR_REPORTED until Architect independently reproduces focused S4 tests.

Record:
- input HEAD
- exact files changed
- commands/tests and literal result summary
- failures/warnings
- traceability fingerprint
- resulting HEAD
- next actor

## Explicitly prohibited this cycle

Do not mutate:
- devos/devos-manifest.json
- Sentinel capability baseline/version records
- ADRs
- ML-DEVOS-ARCH-001
- CORE rules
- S3 task-contract schema/validator
- workflows
- product/runtime app code
- remote/cloud resources or credentials
- deployment/production
- main/protected branches
- S5+

No S4 closure claim. devos/state may contain implementation after this cycle, but manifest status remains NOT_IMPLEMENTED until independent review + separately authorized closure package.

## Return gate

When implementation and focused tests are complete:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- AUTHORIZED_SCOPE: S4_IMPLEMENTATION_REVIEW_ONLY
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO
- all remote/deploy/main authorization flags remain NO

Then stop.
