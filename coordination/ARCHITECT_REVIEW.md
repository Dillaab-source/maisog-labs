# Architect Review — ML-DEVOS-RFC-016 S4 State Machine Kernel

Status: CHANGES_REQUESTED
Review mode: STAGE GATE REVIEW
Cycle: SENTINEL_S4_STATE_MACHINE_PROPOSAL
Reviewed HEAD: e6b1700fa1d50b7ccba81342ee1d48d2b4b020ea
Reviewed proposal commit: 4e9b6aeacd2977051f08c450eeef966ab43b17c4
Authority: D-048 proposal/audit only. S4 implementation remains unauthorized.

## Scope and evidence inspected

Independently inspected:
- live coordination/STATE.md and IMPLEMENTER_HANDOFF.md;
- ML-DEVOS-RFC-016 in full;
- ML-DEVOS-ARCH-001 §10–§11;
- S3 TASK_CONTRACT_SPEC.md and validator semantics;
- active CORE evidence/authority rules;
- TRUST_BOUNDARIES.md and CHANGE_GOVERNANCE_POLICY.md;
- exact 63c03cd... → 4e9b6ae... proposal diff.

Builder traceability/test command output remains ACTOR_REPORTED in this review. No executable S4 code exists, so there is no implementation behavior to reproduce.

## Findings

### AS65-F001 — BLOCKER: proposed file persistence does not implement the claimed CAS / single-winner guarantee

RFC-016 states that two concurrent claimants racing against one expired lease will have exactly one winner, and that every mutation is protected by atomic compare-and-swap on owner_generation / expected_revision. The recommended adapter is one JSON file per task using write-temp-then-atomic-rename.

Atomic rename protects readers from torn/partial files; it does not, by itself, serialize two read-modify-write writers or make an expected_revision comparison atomic with the replacement. Two processes can both read revision N, both compute N+1, and both rename valid replacement files; the later rename can silently overwrite the earlier accepted claim. That violates the proposal's most important fencing property.

Required remediation:
- either specify a concrete local serialization/CAS primitive whose correctness can be tested under two real concurrent writers; or
- change the persistence recommendation to one that natively provides the required transaction/CAS semantics.
- Define the exact atomic boundary for read current revision → validate generation/revision → mutate → persist → record idempotency result/history.
- Update the race tests so they exercise the real persistence primitive, not merely two calls serialized in one JS event loop.

No implementation authorization until this is resolved.

### AS65-F002 — BLOCKER: ownership handoff can deadlock at READY_* states

claim() succeeds only when no owner exists or the current lease has expired. But transitions such as BUILDING → READY_FOR_QA and QA → READY_FOR_REVIEW do not say that ownership is cleared. The next row then requires QA / Reviewer to acquire a claim.

If the prior owner's lease remains active, the next actor cannot claim the task without waiting for expiry even though the task was intentionally handed off. The same issue appears on REVIEW → CHANGES_REQUESTED followed by Builder re-claim.

Required remediation:
- define ownership semantics for every cross-role transition;
- preferably make designated handoff transitions atomically clear owner/lease as part of the same state update, or explicitly require/reason about a separate release operation without introducing a race window;
- add negative/positive tests proving Builder→QA, QA→Reviewer, Reviewer→Builder remediation handoffs work immediately and stale prior owners are fenced after handoff.

### AS65-F003 — BLOCKER: task retry policy is incorrectly coupled to bootstrap coordination state

RFC-016 says task retry ceilings should read coordination/STATE.md MAX_REMEDIATION_CYCLES live and describes it as currently 3. The live reviewed STATE uses MAX_REMEDIATION_CYCLES: 1 for this proposal cycle.

More importantly, ARCH-001 §11 and RFC-016 itself distinguish Task Engine State from coordination/STATE.md. The latter is a bootstrap turn-lock/remediation control, not stable S4 task policy. Reading it at runtime would create a hidden dependency from the new kernel back into the temporary/manual coordination mechanism and could change task retry behavior simply because an unrelated Architect review cycle changes its cap.

Required remediation:
- do not read coordination/STATE.md as S4 runtime policy;
- define the retry ceiling as an explicit S4/task-policy input whose authority provenance is stable and recorded;
- because choosing a new generalized retry ceiling is policy, leave the numeric default unresolved for Paulo unless an existing canonical rule already supplies it;
- preserve the fail-closed escalation behavior without inventing a number.

### AS65-F004 — BLOCKER: idempotency coverage is incomplete for mutating operations

The RFC says each mutating request carries an idempotency key, but then scopes this to claim/transition. renew() and release() also mutate durable state. Without a defined retry/replay rule, a lost acknowledgement around renew/release can leave callers uncertain about lease state and can make subsequent recovery behavior ambiguous.

Required remediation:
- explicitly classify every public operation as read-only or mutating;
- cover claim, renew, release and transition with idempotency semantics, or document a stronger reason why an operation is safely repeatable without a persisted idempotency record;
- define request binding and conflicting-key reuse for each mutating operation.

## Required clarifications / non-blocking corrections

1. RFC-016 says "five transitions" use evidence guards, but the transition table also gates QA → READY_FOR_REVIEW, making that count inconsistent. Correct the inventory and ensure S4 does not silently become an S9 evidence-sufficiency gate.
2. expected_revision is named in the state shape but its command semantics are not actually specified. Bind it to every state-changing write, or remove it and rely on one clearly defined concurrency token.
3. The FAILED / ABANDONED additions are reasonable design candidates, but they amend the frozen §10 lifecycle. Architect review may recommend them; final adoption still requires the normal ARCHITECTURE-class Paulo gate before implementation. Do not edit ML-DEVOS-ARCH-001 during this remediation.
4. Keeping compact transition metadata inside Task Engine State is acceptable for S4 V1 if it is strictly bounded to state-change provenance and not execution telemetry. Keep raw commands/output/cost/timing in future Run History.

## What already passes design review

- clear separation of Task Engine State from coordination, architectural/project memory, run history and evidence storage;
- S3 contract references are not treated as authority grants;
- MAIN != DEPLOYED != VERIFIED remains preserved;
- stale-owner fencing via monotonically increasing owner_generation is the right conceptual mechanism, once the persistence layer actually makes the comparison atomic;
- passive timeout observation is an acceptable S4/S8 boundary for V1;
- no S5/S7/S8/S9/S13 implementation leakage is authorized;
- implementation mapping is honest: future code/tests remain NOT STARTED.

## Verdict

READY TO IMPLEMENT: NO
DESIGN STATUS: CHANGES_REQUESTED
REMEDIATION: ONE BOUNDED RFC-016 DESIGN PASS

The proposal is close, but the four blockers above are load-bearing correctness issues, not cosmetic changes.

## Authorized remediation

Claude may edit only:
- devos/changes/rfcs/ML-DEVOS-RFC-016.md;
- devos/governance/traceability/traceability-index.json and TRACEABILITY_INDEX.md by deterministic regeneration if references/line positions change;
- coordination/IMPLEMENTER_HANDOFF.md;
- coordination/STATE.md.

devos/changes/rfcs/README.md may be touched only if RFC-016's one-line index description must change to remain accurate; otherwise leave it unchanged.

Do not edit ML-DEVOS-ARCH-001, CORE rules, S3 schema/validator, manifest, ADRs, version records, workflow files, product/runtime code, devos/state/, remote resources, protected/main branches, or PR #10.

## Return gate

On completion:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- AUTHORIZED_SCOPE: S4_STATE_MACHINE_PROPOSAL_REVIEW_ONLY
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- CURRENT_REMEDIATION_CYCLE: 1
- MAX_REMEDIATION_CYCLES: 1

Preserve every mutation/remote/deploy/main prohibition flag as NO.
