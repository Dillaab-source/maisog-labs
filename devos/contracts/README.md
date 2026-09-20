# devos/contracts/ — S3 Typed Task Contracts

`STATUS: IMPLEMENTED — repository-local schema/spec/validator/examples only (S3 V1)`

Canonical owning phase: **S3 — Typed Task Contracts**

Authority: `ML-DEVOS-RFC-013` (ACCEPTED) / `ML-DEVOS-AS-038` (ARCHITECT_APPROVED design) / `D-042` (Paulo S3 implementation authorization) / `ML-DEVOS-AS-053` (S3 reopening after Skills Foundation V0.1 acceptance).

See `TASK_CONTRACT_SPEC.md` for the full specification: contract shape, the bounded evidence/claim-kind vocabularies, and the `CORE-016`/`017`/`018`/`020` semantic rules `validate-task-contract.mjs` enforces.

## What exists here

- `task-contract.schema.json` — structural JSON Schema (draft-07).
- `TASK_CONTRACT_SPEC.md` — human-readable specification.
- `validate-task-contract.mjs` — zero-third-party-dependency structural + semantic validator.
- `examples/valid/` and `examples/invalid/` — bounded fixtures, each proving a specific pass/fail-closed rule; see the spec's worked-examples table.

Focused tests: `tests/task-contract.test.mjs` (repository root, alongside `tests/skills.test.mjs` and `tests/traceability.test.mjs`).

## What still does not exist (S3 non-goals, unchanged from `ML-DEVOS-RFC-013`)

No task-lifecycle/state ownership, locks/leases/retries/timeouts/idempotency (S4); no capability/tool/credential enforcement (S5); no sandbox/worktree execution (S6); no evidence artifact storage or QA execution (S7); no orchestration/agent dispatch (S8); no Evidence Gate acceptance logic (S9); no CI/rulesets/protected-main enforcement (S10); no telemetry/memory (S11); no project overlays (S12); no release/runtime verification machinery (S13); no end-to-end production pilot (S14). A Task Contract describes already-authorized scope; it never itself grants authority (`CORE-001`, `CORE-002`) — see every instance's fixed `authority_disclaimer` field.

This directory was reserved by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`) before S3 existed; that reservation is now fulfilled by the contents above, not superseded by them. See `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path — updating that manifest entry's `status`/`executable_runtime_present` fields to reflect S3 acceptance, and any accompanying governance-capability version transition, is deferred to the post-acceptance S3 ADR per `ML-DEVOS-RFC-013`'s rollout plan, not done by this implementation cycle.

Redefining this root's ownership (as opposed to filling it, which S3 does) still requires a separately governed `ARCHITECTURE`-class change.
