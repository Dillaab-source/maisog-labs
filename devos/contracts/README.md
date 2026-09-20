# devos/contracts/ — S3 Typed Task Contracts

`STATUS: IMPLEMENTED AND CLOSED (ML-DEVOS-ADR-013 / D-046) — devos/devos-manifest.json's reserved root for this path carries status: IMPLEMENTED with a closure_ref resolving to ML-DEVOS-ADR-013; executable_runtime_present remains false`

Canonical owning phase: **S3 — Typed Task Contracts**

Authority: `ML-DEVOS-RFC-013` (IMPLEMENTED AND CLOSED) / `ML-DEVOS-AS-038` (ARCHITECT_APPROVED design) / `D-037` (Paulo's actual S3 implementation authorization, queued behind Traceability V1) / `D-042` (Paulo's sequential authorization letting the Architect reopen the already-preserved `D-037`/`AS-038` authority after Skills Foundation V0.1 acceptance — not itself the implementation authorization; corrected per `ML-DEVOS-AS-056` `AS56-F003`) / `ML-DEVOS-AS-053` (the reopening event under that authority) / `ML-DEVOS-ADR-013` (closure ADR, `D-046`).

See `TASK_CONTRACT_SPEC.md` for the full specification: contract shape, the bounded evidence/claim-kind vocabularies, and the `CORE-016`/`017`/`018`/`020` semantic rules `validate-task-contract.mjs` enforces.

## What exists here

- `task-contract.schema.json` — structural JSON Schema (draft-07).
- `TASK_CONTRACT_SPEC.md` — human-readable specification.
- `validate-task-contract.mjs` — zero-third-party-dependency structural + semantic validator.
- `examples/valid/` and `examples/invalid/` — bounded fixtures, each proving a specific pass/fail-closed rule; see the spec's worked-examples table.

Focused tests: `tests/task-contract.test.mjs` (repository root, alongside `tests/skills.test.mjs` and `tests/traceability.test.mjs`).

## What still does not exist (S3 non-goals, unchanged from `ML-DEVOS-RFC-013`)

No task-lifecycle/state ownership, locks/leases/retries/timeouts/idempotency (S4); no capability/tool/credential enforcement (S5); no sandbox/worktree execution (S6); no evidence artifact storage or QA execution (S7); no orchestration/agent dispatch (S8); no Evidence Gate acceptance logic (S9); no CI/rulesets/protected-main enforcement (S10); no telemetry/memory (S11); no project overlays (S12); no release/runtime verification machinery (S13); no end-to-end production pilot (S14). A Task Contract describes already-authorized scope; it never itself grants authority (`CORE-001`, `CORE-002`) — see every instance's fixed `authority_disclaimer` field.

This directory was reserved by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`) before S3 existed; that reservation is now fulfilled by the contents above, not superseded by them. `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path now carries `status: IMPLEMENTED` and `closure_ref: "ML-DEVOS-ADR-013"` (per `ML-DEVOS-RFC-015`'s fail-closed lifecycle mechanism, `ML-DEVOS-AS-060`), closed under the coordinated `v1.5.0 → v1.6.0` release (`D-046`); `executable_runtime_present` remains `false`.

Redefining this root's ownership (as opposed to filling it, which S3 does) still requires a separately governed `ARCHITECTURE`-class change.
