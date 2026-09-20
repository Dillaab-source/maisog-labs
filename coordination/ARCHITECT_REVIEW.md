# Architect Review — S4 State Machine Kernel Implementation

Status: ARCHITECT_APPROVED — IMPLEMENTATION ACCEPTED / CLOSURE DECISION REQUIRED
Review mode: STAGE GATE REVIEW
Cycle: SENTINEL_S4_STATE_MACHINE_IMPLEMENTATION
Final reviewed implementation HEAD: 72cd84a8fedb581306c023ee88e1b0f1c4d5293c
Implementation authority: D-050
Design authority: ML-DEVOS-RFC-016 / ML-DEVOS-AS-065
Implementation review archive ID: ML-DEVOS-AS-066
Remediation cycle used: 1 of 2

## Final verdict

S4 IMPLEMENTATION STAGE GATE: ARCHITECT_APPROVED
IMPLEMENTATION: ACCEPTED
REMEDIATION: CLOSED
READY FOR D.1 CLOSURE PREFLIGHT: YES
S4 CLOSED / MANIFEST ACTIVE: NO
PAULO CLOSURE DECISION REQUIRED: YES

The repository-local S4 State Machine Kernel is accepted as a technically sound implementation of the Architect-approved RFC-016 design, including D-050's locked Task Policy and orphan-lock recovery policy.

No manifest activation, version bump, ADR creation, architecture-baseline amendment, deployment, remote resource, main merge, or later-phase authority is granted by this review.

## Evidence reviewed

Independently inspected:
- live coordination/STATE.md and IMPLEMENTER_HANDOFF.md;
- exact remediation delta 0147e4bc451e70b4ff2d8a3185ca99e2a541d646 → 72cd84a8fedb581306c023ee88e1b0f1c4d5293c;
- devos/state/lifecycle.mjs;
- devos/state/kernel.mjs;
- devos/state/store.mjs;
- devos/state/validate-task-state.mjs;
- devos/state/task-policy.mjs;
- focused lifecycle/kernel test source;
- accepted RFC-016 transition, ownership, persistence, recovery and S5/S8/S9 boundary text;
- D-050 implementation policy.

Architect independently executed targeted spot checks against the reviewed remediation logic for:
- missing transition references fail closed;
- required decision/artifact references permit intended transitions;
- QA → BUILDING is classified as a handoff while CHANGES_REQUESTED/PAULO_DECISION_REQUIRED → BUILDING are not;
- invalid/path-like task IDs fail before task-path use;
- syntactically valid but structurally invalid records fail as scoped corruption;
- lock diagnostic metadata includes task_id.

Those targeted checks passed.

Environment limitation: the Architect execution sandbox cannot clone the private GitHub repository because outbound DNS/network access is unavailable. Therefore Claude's exact full focused-suite counts remain ACTOR_REPORTED rather than being upgraded to INDEPENDENTLY_REPRODUCED. This review does not conceal that limitation.

Builder-reported verification at final HEAD:
- state-lifecycle: 18/18 PASS;
- state-kernel: 21/21 PASS;
- state-concurrency: 2/2 PASS across 5 repeated runs;
- devos-manifest spot check: 22/22 PASS;
- traceability: 2 known errors, 14 warnings, no generated-index drift.

Implementation acceptance does not rest solely on those Builder claims: the changed source, tests, diff, governance boundaries, and critical remediated invariants were independently inspected, with the highest-risk changed invariants also independently spot-executed.

## Findings disposition

### S4I-F001 — missing transition-table guards: CLOSED

Confirmed:
- PLANNING → READY_FOR_BUILD requires an opaque artifact reference;
- REVIEW → APPROVED requires decisionRef;
- REVIEW → CHANGES_REQUESTED requires decisionRef;
- PAULO_DECISION_REQUIRED → BUILDING requires decisionRef;
- every non-terminal → ABANDONED requires decisionRef plus Architect/Paulo role gate;
- MERGED → RELEASE_READY requires an opaque release-criteria reference;
- decisionRef/evidenceRef material to legality are bound into transition idempotency comparison.

No evidence-content sufficiency logic was introduced.

### S4I-F002 — QA → BUILDING ownership handoff: CLOSED

The implementation now uses exact handoff edges rather than only destination names.

QA → BUILDING clears owner/lease atomically with the transition and revision bump. The next Builder can claim immediately and the prior QA actor is fenced.

CHANGES_REQUESTED → BUILDING, PAULO_DECISION_REQUIRED → BUILDING and READY_FOR_BUILD → BUILDING remain non-handoff edges, avoiding over-clearing ownership.

### S4I-F003 — persistence-boundary structural validation: CLOSED

Task-state validation now runs:
- after JSON parse on load;
- immediately before persistence.

Syntactically valid but schema-invalid records raise a task-scoped CorruptRecordError with structural errors. Invalid JSON remains task-scoped corruption.

### S4I-F004 — task_id path-safety: CLOSED

One task-id shape is enforced before task-derived filesystem path construction:
- ^[A-Z][A-Z0-9_-]*$
- minimum length 3.

Invalid/path-like values are rejected before path.join receives them. createTask also rejects an empty/non-string contract_ref before persistence.

### S4I-F005 — incomplete lock diagnostic metadata: CLOSED

The lock payload now contains:
- holder;
- operation;
- acquired_at;
- task_id;
- pid.

The required RFC-016 minimum diagnostic metadata is satisfied.

## Accepted implementation-discovered corrections

### Transition idempotency binding

Accepted: implementation omits server-derived from_state from the persisted replay binding and instead uses expectedRevision as the authoritative record-version identity, together with toState and material reference hashes.

Rationale: recomputing from_state after a successful transition would make a true replay appear conflicting because persisted state has already advanced. expectedRevision identifies the caller's intended source record version more precisely.

This correction must be documented in the S4 closure ADR / closure package rather than silently rewriting history.

### Owner vs revision error diagnostics

Accepted: NOT_CURRENT_OWNER and REVISION_CONFLICT remain separate failure codes. This improves diagnostics and does not weaken fencing.

## Boundary review

### S5

PASS. RFC-016 explicitly states S4 accepts a bare actor_id and performs no general actor permission check. The current implementation does not become a Capability & Permission Gateway. The narrow ABANDONED structural role gate remains part of the accepted S4 transition contract.

### S7 / S9

PASS. S4 retains opaque evidence references and class-label/presence guards only. It does not retrieve evidence artifacts or decide evidence sufficiency.

### S8

PASS. sweepExpiredLeases remains passive/read-only. No scheduler, dispatcher, timeout daemon or actor invocation exists.

### S13

PASS. DEPLOYED / VERIFIED are descriptive kernel states only. No deployment/runtime mechanism is introduced.

### Authority leakage

PASS. Task state carries the fixed non-authority disclaimer. MAIN != DEPLOYED != VERIFIED remains structurally separated. State advancement does not itself grant merge/deploy/production authority.

## Concurrency / persistence review

PASS for V1's bounded local model:
- one task file + one task lock;
- wx exclusive-create serializes the read/validate/mutate/persist critical section;
- revision provides fencing/optimistic concurrency;
- temp-write + atomic rename prevents torn committed records;
- orphaned locks fail closed and are never stolen by age;
- force-clear remains a separately guarded Paulo-authorized maintenance path;
- structural validation protects both load and persist boundaries;
- corruption blast radius remains task-local under ordinary direct task access.

The previously accepted availability trade-off remains: a genuinely orphaned lock blocks that task until explicit operator recovery.

## Scope / traceability audit

Final remediation changed only:
- devos/state/kernel.mjs
- devos/state/lifecycle.mjs
- devos/state/store.mjs
- tests/state-kernel.test.mjs
- tests/state-lifecycle.test.mjs
- deterministic traceability outputs
- coordination working surfaces

No RFC-016, manifest, frozen architecture, CORE rules, S3, ADR/version record, workflow, product/runtime, remote resource, deployment, protected/main branch, Issue #11 or PR #10 mutation occurred.

Known traceability ERROR fingerprint remains unchanged:
- CORE-022
- WEB-REQ-009

Warning count changed 15 → 14 because D-001 gained a real inbound reference. No ERROR was suppressed or fabricated away.

## Closure items that must be explicit

The later S4 closure package must record, not hide:

1. D-050's explicit adoption of FAILED and ABANDONED and the corresponding frozen-architecture lifecycle amendment disposition.
2. The accepted idempotency-binding correction: expectedRevision replaces recomputed from_state in replay identity.
3. The separate NOT_CURRENT_OWNER / REVISION_CONFLICT diagnostic correction.
4. RFC-016 prose says every mutating request presents revision while claim()'s explicit API signature does not. This remains a documented wording/API discrepancy and must be reconciled in closure records rather than silently ignored.
5. Exact evidence classification: Builder's complete focused test execution remains ACTOR_REPORTED; Architect source/diff review is INDEPENDENTLY_INSPECTED and the critical remediation invariants received independent executable spot checks, but the private-repo suite was not fully rerun by Architect.

## Recommended D.1 closure preflight

A separately authorized closure cycle should prepare, but not self-approve:
- S4 closure ADR with closure_ref;
- manifest devos/state/ transition from NOT_IMPLEMENTED to IMPLEMENTED;
- executable_runtime_present disposition consistent with the reserved-root lifecycle rules;
- Sentinel capability-baseline/version disposition under VERSIONING_POLICY;
- closure_history entry;
- any required ML-DEVOS-ARCH-001 lifecycle amendment record for FAILED / ABANDONED;
- deterministic traceability regeneration;
- D.2 post-decision verification plan.

No S5 proposal or implementation should begin until S4 closure is complete.

## Project health at this gate

S4 design: 100%
S4 implementation: 100% technically accepted
S4 closure: 0% of closure mutation — intentionally not started
S4 overall phase readiness: ~92%
Governance/scope discipline for implementation cycle: 100%
