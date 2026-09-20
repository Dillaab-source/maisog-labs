# ML-DEVOS-RFC-013: S3 Typed Task Contracts

Status: `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-013 / D-046`

Proposed change class: `ARCHITECTURE`

Sentinel phase:
- `S3 — Typed Task Contracts`

## Problem

Sentinel already defines a provider-independent evidence provenance model and states that the **Task Contract decides which evidence class is required for each claim**. That rule is currently conceptual only: no machine-readable Task Contract schema, instance format, or validator exists.

As a result, current tasks still encode scope, acceptance criteria, claim/evidence expectations, and prohibitions mainly in prose across RFCs, Architect Syncs, Decisions, handoffs, and `coordination/STATE.md`.

S3 must make those task-level expectations explicit and machine-validateable without prematurely implementing later Sentinel phases.

## Motivation

Typed Task Contracts should reduce ambiguity before implementation begins:

- what exact work is authorized;
- what files/resources are in scope;
- what actions are explicitly prohibited;
- what requirements/risks/decisions the task traces to;
- what claims the task expects to make;
- what evidence provenance class each claim requires;
- what acceptance criteria must be satisfied before review.

This allows later phases to consume a stable contract instead of reconstructing task intent from prose.

The contract must stay compact. Current practitioner discussion around spec-driven AI development shows that oversized specification processes can add substantial overhead without reliably improving small, already-clear tasks. S3 therefore standardizes only the load-bearing task contract, not a universal long-form specification document.

## Proposed change

Implement a machine-readable Task Contract format under the S3-owned reserved root:

`devos/contracts/`

Initial V1 implementation should include:

- `devos/contracts/task-contract.schema.json`
- `devos/contracts/TASK_CONTRACT_SPEC.md`
- `devos/contracts/validate-task-contract.mjs`
- `devos/contracts/examples/` with bounded valid/invalid fixtures
- focused tests for schema/semantic validation

Exact filenames may vary slightly if the Builder demonstrates a simpler equivalent while preserving these responsibilities.

### Contract shape

Each Task Contract must minimally express:

#### Identity / provenance
- contract schema version;
- stable `task_id`;
- title;
- project/repository scope;
- change class;
- authorization references;
- requirement/risk/design references where applicable.

#### Scope
- allowed repository paths or bounded artifact domains;
- explicit prohibited paths/actions where material;
- whether remote resources are involved;
- whether protected-main, deploy, production-write, credential/security, or destructive actions are in scope.

The contract **describes already-authorized scope**. It never creates authority by itself.

#### Acceptance criteria
A bounded list of stable criterion IDs and concrete success statements.

Acceptance criteria describe expected outcomes; they do not themselves certify that the outcomes occurred.

#### Claims and evidence requirements
Each intended claim must declare:
- stable claim ID;
- claim kind;
- claim statement;
- required evidence provenance rule.

Evidence provenance vocabulary is exactly:
- `ACTOR_REPORTED`
- `INDEPENDENTLY_INSPECTED`
- `INDEPENDENTLY_REPRODUCED`
- `CI_ATTESTED`
- `RUNTIME_OBSERVED`

The contract may express:
- `all_of` evidence classes;
- `any_of` evidence classes.

No implicit evidence upgrade is allowed.

### Binding semantic validation

The S3 validator must enforce existing active policy rather than invent new policy.

At minimum:

1. A `MAIN` claim must be compatible with `CORE-016`:
   - at least one of `INDEPENDENTLY_REPRODUCED` or `CI_ATTESTED`;
   - `RUNTIME_OBSERVED` must not be required merely for a MAIN claim.

2. A `DEPLOYED` claim must be compatible with `CORE-017`:
   - at least one of `ACTOR_REPORTED` or `CI_ATTESTED`;
   - deployment evidence is not silently treated as runtime verification.

3. A `VERIFIED` production claim must include `RUNTIME_OBSERVED`, per `CORE-018`.

4. Consequence-sensitive contracts involving remote/production writes, destructive operations, credential/security changes, or public cutover must not specify only Builder-style `ACTOR_REPORTED` evidence for closure, consistent with `CORE-020`.

5. The validator must never infer that satisfying a Task Contract grants merge, deployment, remote-resource, risk-acceptance, or other Paulo-gated authority.

### Initial claim kinds

V1 should support a small bounded vocabulary rather than arbitrary free-form policy types:

- `DOCUMENTATION_CORRECTNESS`
- `IMPLEMENTATION_PRESENT`
- `TESTED_BEHAVIOR`
- `SECURITY_OR_TRUST_BOUNDARY`
- `MAIN`
- `DEPLOYED`
- `VERIFIED`

Additional claim kinds require a future governed extension.

## Scope

S3 is repository-local Sentinel infrastructure only.

It introduces typed contract files/schema/validation and examples.

It does not execute tasks.

## Non-goals

S3 does **not** implement:

- task lifecycle/state ownership;
- locks, leases, retries, timeouts, or idempotency machinery (S4);
- capability/tool/credential enforcement (S5);
- sandbox/worktree execution (S6);
- evidence artifact storage or QA execution (S7);
- orchestration or agent dispatch (S8);
- Evidence Gate acceptance logic (S9);
- CI/rulesets/protected-main enforcement (S10);
- telemetry or memory stores (S11);
- project overlays (S12);
- release/runtime verification machinery (S13);
- end-to-end Sentinel production pilot (S14).

It also does not:
- create remote/cloud resources;
- change product runtime;
- deploy;
- merge to `main`;
- automatically accept risk;
- automatically change task status.

## Affected components

Primary:
- `devos/contracts/`

Supporting governance records only:
- RFC / Architect Sync / Decision / ADR / handoff records as required.

No product code or database schema is affected.

## Affected rules

No `CORE-*` rule is changed.

S3 implements an existing frozen architectural intent and must validate contracts against currently active evidence rules including `CORE-016`, `CORE-017`, `CORE-018`, and `CORE-020`.

## Alternatives considered

### 1. Continue prose-only task briefs

Rejected as the final S3 outcome. Prose remains valuable for explanation but cannot provide deterministic schema validation.

### 2. Build the full Task Engine now

Rejected. That is later-phase behavior and would collapse S3 into S4/S8/S9.

### 3. Require a large specification for every task

Rejected. Small, low-risk tasks should remain cheap to describe. The contract captures only the fields required for scope, traceability, acceptance, and evidence expectations.

### 4. Adopt CUE immediately

CUE demonstrates strong modern practice for schema + policy validation and early error detection, but introducing a new language/toolchain is unnecessary for S3 V1. Sentinel can begin with JSON Schema plus a small zero-third-party Node semantic validator. A future change may reconsider CUE if contract composition becomes complex enough to justify it.

## Risks

### Over-specification
Mitigation: keep required fields minimal and use compact references instead of duplicating full RFC/design content.

### Contract becomes authority
Mitigation: schema and spec must state explicitly that Task Contract = typed description of authority already granted elsewhere; `Capability != Authority` and Paulo gates remain unchanged.

### S3 drifts into Evidence Gate
Mitigation: validator checks contract validity only. It does not inspect actual produced evidence and does not declare a task accepted.

### Policy duplication
Mitigation: semantic checks should be derived from or directly aligned to active `CORE-*` rules; the contract must not invent a parallel evidence policy.

### Stale contracts
Mitigation: each contract carries authorization/reference IDs and schema version; later S4 state machinery may govern lifecycle, but S3 itself does not.

## Migration impact

None required for historical tasks.

S3 must not retroactively create fabricated Task Contracts for all prior work.

At most, the implementation may provide clearly labeled examples based on historical patterns; they are examples, not rewritten historical authority.

## Security / trust impact

No new trust boundary.

A Task Contract cannot:
- grant tools;
- grant credentials;
- authorize remote actions;
- waive policy;
- approve merge/deployment;
- certify evidence.

It only states the contract that later actors/mechanisms must follow.

## Evidence requirements

S3 implementation acceptance should require:

- `INDEPENDENTLY_INSPECTED` review of schema/spec/validator;
- Builder-reported focused test execution;
- independent inspection that semantic rules match `CORE-016/017/018/020`;
- positive and negative fixtures;
- deterministic validator behavior;
- proof that a valid contract cannot itself grant authority;
- proof that S4+ mechanisms remain absent.

No production/runtime evidence is required for repository-only schema/validator behavior.

## Rollout

1. Complete and independently close `SENTINEL-TRACEABILITY-V1`.
2. Perform `ML-DEVOS-AS-038` over this RFC.
3. Record Paulo's S3 implementation decision.
4. Change live Sentinel state to S3.
5. Builder implements only the approved S3 contract schema/spec/validator/examples/tests.
6. Architect independently reviews.
7. After acceptance, write the S3 ADR and decide the governance-capability version transition.
8. Only then may S4 be proposed.

## Rollback

Revert the S3 implementation commit(s) and restore `devos/contracts/` to its pre-S3 reserved-root state.

No product data or remote resource rollback is involved.

## Compatibility

Compatible with:
- frozen `ML-DEVOS-ARCH-001 §6`;
- active evidence provenance model;
- current Sentinel `v1.5.0`;
- Traceability V1, which may later index Task Contract IDs without owning their semantics.

Incompatible with any implementation that treats a valid contract as sufficient authority or as an Evidence Gate result.

## Version impact

Expected `MINOR` governance-capability change if S3 is implemented and accepted.

No version bump is authorized by this RFC.

## Architect Sync requirement

Yes — `ARCHITECTURE` class and an explicit frozen roadmap phase.

## Paulo decision requirement

Yes.

Paulo has instructed `proceed to the next phase`. This records explicit authorization to advance into **S3 design/review preparation**, subject to the sequencing gate above. It does not start Builder implementation while `SENTINEL-TRACEABILITY-V1` remains active.
