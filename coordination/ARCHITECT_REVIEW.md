# Architect Review — S4 State Machine Kernel Implementation

Status: CHANGES_REQUESTED
Review mode: STAGE GATE REVIEW
Cycle: SENTINEL_S4_STATE_MACHINE_IMPLEMENTATION
Reviewed HEAD: 5f2377b68b600c62605fae5c94c92d5c28ce1ed8
Implementation authority: D-050
Design authority: ML-DEVOS-RFC-016 / ML-DEVOS-AS-065
Remediation cycle: 1 of 2

## Scope / evidence inspected

Independently inspected:
- live coordination/STATE.md and IMPLEMENTER_HANDOFF.md;
- exact 9146a24a55e7b51173de1289e784762e87629ca4 → 5f2377b68b600c62605fae5c94c92d5c28ce1ed8 changed-file set;
- devos/state/kernel.mjs;
- devos/state/lifecycle.mjs;
- devos/state/store.mjs;
- devos/state/task-policy.mjs;
- task-state schema + validator;
- focused lifecycle test source;
- accepted RFC-016 transition/locking/recovery requirements;
- D-050 implementation policy.

Builder-reported results remain:
- focused S4 tests: 31/31 PASS;
- full repository tests: 489/489 PASS;
- concurrency suite repeated 5/5 clean;
- traceability fingerprint: CORE-022 + WEB-REQ-009 only.

Those command totals are still ACTOR_REPORTED in this review. Architect independently reproduced a narrower executable harness against the committed lifecycle logic for the guard defect below; the full focused suite will be independently reproduced after remediation before technical acceptance.

## What passes

- exact diff remains inside the D-050 implementation surfaces;
- no manifest/version/ADR/frozen-architecture/CORE/S3/workflow/product/remote/deploy/main mutation;
- local per-task exclusive-create lock design is present;
- automatic age-based lock stealing is absent;
- revision fencing exists for owner mutations;
- idempotency/replay machinery exists for claim/renew/transition;
- per-project 2/2/2 Task Policy is statically decoupled from coordination/STATE.md;
- FAILED / ABANDONED are represented as terminal states;
- evidence-class guards for the six named evidence transitions are implemented;
- real child-process concurrency tests exist;
- non-authority disclaimer is structurally represented;
- Builder correctly disclosed two implementation-discovered deviations instead of hiding them.

## S4I-F001 — BLOCKER: accepted transition-table guards are missing

RFC-016's transition table contains guards beyond adjacency/evidence-class/retry checks. The implementation currently accepts several transitions when their required reference is absent.

Architect independently reproduced the committed lifecycle behavior in a minimal execution harness. With zero retries and no reference inputs, all of these returned `{ ok: true }`:

- `PLANNING → READY_FOR_BUILD` — RFC requires a design/plan artifact reference;
- `REVIEW → APPROVED` — RFC requires reviewer decision recorded;
- `REVIEW → CHANGES_REQUESTED` — RFC requires reviewer decision recorded;
- `PAULO_DECISION_REQUIRED → BUILDING` — RFC requires a Paulo decision reference;
- `PAULO_DECISION_REQUIRED → ABANDONED` — RFC requires a Paulo decision reference;
- `MERGED → RELEASE_READY` — RFC requires a release-criteria reference.

The existing "all legal lifecycle transitions" test actually encodes these unguarded calls as success cases, so 31/31 PASS does not prove the accepted transition contract.

Required remediation:
- enforce the missing guards using the existing transition request fields where possible;
- use `evidenceRef` as the opaque artifact/reference carrier for plan/release-criteria presence when no evidence-class judgment is required;
- use `decisionRef` for reviewer/Paulo decision-reference presence;
- any transition to `ABANDONED` must require an explicit cancellation/decision reference in addition to the existing Architect/Paulo role gate;
- bind any newly material request reference into transition idempotency comparison so reusing one idempotency key with a different decision/artifact reference conflicts rather than silently replaying;
- add negative tests proving every listed guard fails closed when its reference is absent.

Do not implement evidence-content sufficiency or S5 actor-permission evaluation; this remains presence/label structure only.

## S4I-F002 — BLOCKER: QA → BUILDING leaves QA owning a Builder-stage task

RFC-016's implementation review originally required cross-role handoffs to become immediately claimable by the next actor. The current implementation clears owner/lease only when the destination is one of five destination names. `BUILDING` is not in that set.

Therefore `QA → BUILDING` increments the QA retry counter but leaves the QA actor as owner of the now-BUILDING task. The current kernel test works around this by explicitly calling `release()` after the transition before Builder claims it. That extra release step is not part of RFC-016's QA-failure transition semantics and recreates a role-handoff seam the earlier AS65-F002 remediation was intended to remove.

Required remediation:
- preserve the five existing handoff destinations;
- additionally treat the specific edge `QA → BUILDING` as an atomic cross-role handoff: state change + revision bump + owner/lease clear in the same persisted write;
- add a positive test proving Builder can claim immediately after QA → BUILDING;
- add a negative test proving the prior QA owner is fenced immediately after that transition;
- remove the test-only manual release workaround.

Do not globally make every transition into BUILDING a handoff: `CHANGES_REQUESTED → BUILDING` and `PAULO_DECISION_REQUIRED → BUILDING` may legitimately retain the freshly claimed actor that is already the routed Builder/decision-named actor.

## S4I-F003 — BLOCKER: structural/schema validation is not on the persistence boundary

RFC-016 explicitly requires corrupted on-disk state to be detected at load time by structural/schema validation.

Current store behavior:
- `readRecordRaw()` performs only `JSON.parse`;
- `writeRecordAtomic()` serializes whatever object it receives;
- the standalone `validate-task-state.mjs` exists, but the kernel/store does not invoke it when loading or persisting records.

Consequences:
- syntactically valid but structurally invalid JSON can enter the kernel without `CORRUPT_RECORD`;
- a malformed record can be returned by `getState()` or consumed by later mutation logic;
- direct corruption tests cover invalid JSON only, not schema-invalid valid JSON.

Required remediation:
- validate every loaded task record after JSON parse;
- fail with a task-scoped corruption/invalid-record error carrying the task_id and structural errors;
- validate a new record immediately before persistence as a defense-in-depth invariant;
- add a test that replaces a valid task file with syntactically valid but schema-invalid JSON and proves the task fails scoped while an unrelated task remains readable.

No new dependency is required; reuse the existing hand-written validator.

## S4I-F004 — BLOCKER: task_id reaches filesystem paths before its declared constraints are enforced

The schema/validator restricts `task_id` to `^[A-Z][A-Z0-9_-]*$` with length >= 3, but the public kernel operations pass caller-supplied `taskId` directly into:
- `path.join(dir, `${taskId}.json`)`;
- `path.join(dir, `${taskId}.lock`)`.

`createTask()` does not run the structural validator before acquiring that path or persisting the record. This means malformed/path-like IDs are not merely "invalid schema"; they can influence filesystem path resolution before validation.

Required remediation:
- create one canonical task-id assertion matching the schema;
- apply it before every task-id-derived filesystem path operation, including ordinary mutations, reads, lock operations, and force-clear;
- ensure `createTask()` also rejects an empty/invalid contract_ref before writing;
- add negative tests for lowercase, slash/backslash/path traversal, empty/too-short IDs, and empty contract_ref;
- prove no file outside the supplied task-store directory is created/deleted by rejected IDs.

## S4I-F005 — REQUIRED SMALL CORRECTION: lock diagnostic metadata is incomplete

RFC-016's accepted fail-closed lock design says the lock diagnostic metadata contains at minimum:
`{ holder, acquired_at, task_id, operation }`.

The implementation writes holder / operation / acquired_at / pid but omits task_id.

Required remediation:
- include `task_id` in the lock-file diagnostic payload;
- add/adjust a focused test to verify it.

## Builder-disclosed design corrections — Architect disposition

1. Transition idempotency binding dropping server-derived `from_state`: ACCEPTED IN PRINCIPLE. `expectedRevision` is the stronger replay identity. During remediation, also bind any required decision/artifact reference introduced by S4I-F001.
2. Split `NOT_CURRENT_OWNER` vs `REVISION_CONFLICT`: ACCEPTED. This improves diagnostics without weakening fencing.

These implementation-discovered corrections should be carried into the eventual S4 closure/ADR documentation; do not edit the accepted RFC during this remediation unless separately authorized.

## Non-blocking discrepancy to preserve for closure documentation

RFC-016's prose says every mutating request presents the last-observed revision, while its own claim signature omits revision. The current implementation follows the explicit claim signature. This does not block this remediation because the lock still provides one-winner claim serialization, but the closure package must reconcile/document the API wording rather than silently pretending the prose is perfectly consistent.

## Verdict

S4 IMPLEMENTATION STAGE GATE: CHANGES_REQUESTED
READY FOR S4 CLOSURE PREFLIGHT: NO
CURRENT_REMEDIATION_CYCLE: 1 / 2

This is a bounded correctness remediation, not a redesign.

## LEAN / DELTA-ONLY REMEDIATION

Claude reads only:
1. coordination/STATE.md;
2. this Architect review;
3. devos/state/kernel.mjs;
4. devos/state/lifecycle.mjs;
5. devos/state/store.mjs;
6. devos/state/validate-task-state.mjs;
7. task-state.schema.json only when checking parity;
8. the three S4-focused test files + worker fixture as needed.

Do not reread full governance history.

### Authorized mutation surfaces

- devos/state/kernel.mjs
- devos/state/lifecycle.mjs
- devos/state/store.mjs
- devos/state/validate-task-state.mjs
- devos/state/task-state.schema.json only if parity actually requires a schema correction
- tests/state-lifecycle.test.mjs
- tests/state-kernel.test.mjs
- tests/state-concurrency.test.mjs only if task-id/locking coverage requires it
- tests/fixtures/state-claim-worker.mjs only if its call signature changes
- devos/state/README.md only if a statement becomes inaccurate
- deterministic traceability outputs if regeneration changes them
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

Do not touch RFC-016, manifest, architecture, CORE rules, S3, ADR/version/closure records, workflows, product/runtime, remote resources, deployment, main/protected branches, or Issue #11.

### Verification required

Run:
- focused S4 tests;
- at least 5 repeated real-process concurrency runs;
- full repository test suite only if the focused changes plausibly affect shared code (otherwise skip it under LEAN mode);
- traceability generation/validation if changed references require it;
- exact diff-whitelist check.

Return all test counts as ACTOR_REPORTED.

## Return gate

When remediation is complete:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- AUTHORIZED_SCOPE: S4_IMPLEMENTATION_REVIEW_ONLY
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO
- CURRENT_REMEDIATION_CYCLE: 1
- MAX_REMEDIATION_CYCLES: 2
- all remote/deploy/main flags remain NO

Then stop.
