# Architect Review

Status: `S3 ACTIVE — TYPED TASK CONTRACTS IMPLEMENTATION AUTHORIZED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# S3 — Typed Task Contracts Activation

Authority chain:
- `ML-DEVOS-RFC-013`
- `ML-DEVOS-AS-038`
- `D-037`

Precondition satisfied:
- `SENTINEL-TRACEABILITY-V1` closed by `ML-DEVOS-AS-041`;
- adopted by `ML-DEVOS-ADR-010`;
- no confirmed governance breach;
- current Sentinel capability baseline remains `v1.5.0`.

## Authorized S3 scope

Builder may implement only the approved S3 Typed Task Contracts subsystem under `devos/contracts/`, focused fixtures/tests, and normal handoff bookkeeping.

Required outputs:

1. `TASK_CONTRACT_SPEC.md` or equivalent human-readable spec;
2. machine-readable JSON Schema;
3. semantic validator;
4. valid/invalid examples;
5. focused tests;
6. at least one low-risk repository-only task example;
7. negative examples proving MAIN / DEPLOYED / VERIFIED evidence rules fail closed when misdeclared.

## Binding contract semantics

A Task Contract may describe:
- task identity/provenance;
- already-authorized scope;
- explicit prohibited scope/actions;
- acceptance criteria;
- intended claims;
- required evidence provenance;
- traceability references.

A Task Contract may **not**:
- grant authority;
- grant capability/tool access;
- grant credentials;
- accept risk;
- waive policy;
- decide merge/deploy eligibility;
- certify evidence;
- mutate state automatically.

## Evidence policy alignment

Semantic validation must remain compatible with:
- `CORE-016` — MAIN;
- `CORE-017` — DEPLOYED;
- `CORE-018` — VERIFIED;
- `CORE-020` — consequence-sensitive evidence.

Evidence classes remain exactly:
- `ACTOR_REPORTED`
- `INDEPENDENTLY_INSPECTED`
- `INDEPENDENTLY_REPRODUCED`
- `CI_ATTESTED`
- `RUNTIME_OBSERVED`

## Explicitly not authorized

No:
- S4 State Machine Kernel;
- S5 Capability Gateway;
- S6 isolated execution;
- S7 Evidence & QA Plane;
- S8 Orchestrator;
- S9 Evidence Gate;
- S10 GitHub enforcement/CI/rulesets;
- S11–S14;
- product runtime changes;
- project onboarding;
- remote resources;
- credential creation/storage;
- production writes;
- deployment;
- protected/main merge;
- Sentinel version bump.

## Separate open traceability debt

`TRACE-DEBT-001 / WEB-REQ-009` remains open and is not part of S3 implementation.

Builder must not edit canonical website requirement records merely to make Traceability V1 green.

## Builder return gate

When S3 implementation is complete:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

Handoff must include exact SHA, changed files, schema/validator behavior, focused/full test results, negative-fixture evidence, and explicit proof no S4+ behavior was implemented.
