# ADR-013: Adopt Sentinel S3 Typed Task Contracts

Status: `ACCEPTED`

Related RFC:
- `ML-DEVOS-RFC-013`

Architect Syncs:
- `ML-DEVOS-AS-038` — design compatibility review
- `ML-DEVOS-AS-053` — S3 reopening under preserved `D-037`/`AS-038` authority
- `ML-DEVOS-AS-054` — remediation cycle 1 (evidence-guarantee semantics, empty-string structural parity, DEPLOYED floor-not-ceiling)
- `ML-DEVOS-AS-055` — `ARCHITECT_APPROVED — S3 TECHNICAL STAGE GATE`
- `ML-DEVOS-AS-056` — closure discrepancy review (identified the reserved-root lifecycle gap `ML-DEVOS-RFC-015` resolves)
- `ML-DEVOS-AS-060` — RFC-015 implementation acceptance (provides the closure-lifecycle mechanism this ADR uses)
- `ML-DEVOS-AS-061` — D.1 Pre-decision Closure Preflight, `PASS`, over this coordinated closure

Paulo decisions:
- `D-037` — the actual S3 implementation authorization (queued behind `SENTINEL-TRACEABILITY-V1`)
- `D-042` — sequential reopening authority only (authorized the Architect to reopen the already-preserved `D-037`/`AS-038` authority after Skills/Treasury V0.1 acceptance, without a second Paulo approval)
- `D-046` — coordinated closure authorization (this ADR's creation, `devos/contracts/` → `IMPLEMENTED`, and the `v1.6.0` release)

Implementation range:
- final independently accepted implementation head: `61803ffc15ce88a61ccead71fa7e41f5a9ff2efd`

Effective version:
- Sentinel governance-capability baseline: `v1.6.0` (this ADR is the release-closing ADR for the coordinated boundary; see "Version consequence" below)
- frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`

## Decision

Sentinel adopts Typed Task Contracts as active S3 architecture:

- `devos/contracts/task-contract.schema.json` (JSON Schema draft-07) and `devos/contracts/TASK_CONTRACT_SPEC.md`;
- `devos/contracts/validate-task-contract.mjs`, a zero-third-party-dependency structural + semantic validator enforcing `CORE-016` (MAIN), `CORE-017` (DEPLOYED), `CORE-018` (VERIFIED), and `CORE-020` (consequence-sensitive escalation) exactly as already active, inventing no new evidence policy;
- bounded valid/invalid example fixtures under `devos/contracts/examples/` and focused tests (`tests/task-contract.test.mjs`);
- the reserved root `devos/contracts/` moves to `status: IMPLEMENTED` in `devos/devos-manifest.json`, with `closure_ref` naming this ADR, `executable_runtime_present` remaining `false`.

A Task Contract remains strictly descriptive of already-authorized scope. It never itself grants tool access, credentials, remote-resource access, merge approval, deployment approval, or task acceptance (`CORE-001`, `CORE-002`) — every contract instance carries this as a fixed, schema-`const`-enforced `authority_disclaimer` field that no instance may reword.

## Context

`ML-DEVOS-RFC-013` proposed S3 after `ML-DEVOS-AS-038` reviewed it for design compatibility; `D-037` authorized implementation, queued behind `SENTINEL-TRACEABILITY-V1`'s closure. Implementation was paused during the MaisogLabs Skills Foundation V0.1 cycle (`D-038` reprioritization) and reopened by `ML-DEVOS-AS-053` under `D-042`'s sequential-authorization clause once Skills/Treasury V0.1 was independently accepted — `D-042` itself never re-authorized S3 implementation from scratch; it only permitted the Architect to resume the already-preserved `D-037`/`AS-038` authority without a second Paulo approval.

Implementation proceeded through one remediation cycle (`ML-DEVOS-AS-054`), correcting three defects: MAIN/DEPLOYED evidence validation that checked "an acceptable class appears somewhere" rather than guaranteeing it on every satisfiable `all_of`/`any_of` path; a structural validator that did not enforce the schema's `minLength: 1` item rule; and an invented, stricter-than-required prohibition on `DEPLOYED` claims carrying additional `RUNTIME_OBSERVED` evidence (`CORE-017` is a floor, not a ceiling). `ML-DEVOS-AS-055` then gave final technical stage-gate approval.

A subsequent discrepancy review, `ML-DEVOS-AS-056`, found that the manifest schema could not yet represent an implemented reserved root, that `ML-DEVOS-RFC-013`'s status banner was stale, that `devos/contracts/README.md` misattributed `D-042` as the implementation authorization rather than the correct `D-037`, and that the Skills/Treasury cycle lacked its own closure ADR. `ML-DEVOS-RFC-015` (`ML-DEVOS-ADR-012`) resolved the schema gap and provided the D.1/D.2 closure-lifecycle mechanism this ADR is the first real closure to use; `ML-DEVOS-ADR-011` resolves the Skills/Treasury closure debt in the same coordinated cycle. `ML-DEVOS-AS-061`'s D.1 preflight confirmed this coordinated package was sound before Paulo's `D-046` authorization.

## Alternatives considered

See `ML-DEVOS-RFC-013`'s own "Alternatives considered": continuing prose-only task briefs (rejected — no deterministic schema validation); building the full Task Engine now (rejected — collapses S3 into S4/S8/S9); requiring a large specification for every task (rejected — small, low-risk tasks should stay cheap to describe); adopting CUE immediately (rejected for V0.1 — JSON Schema plus a small zero-dependency Node validator is sufficient; CUE remains a future option if contract composition grows complex enough to justify it).

## Rationale

A compact, machine-readable Task Contract format lets later work consume a stable, schema-checked description of scope/claims/evidence instead of reconstructing task intent from prose scattered across RFCs, Architect Syncs, Decisions, and handoffs — without prematurely implementing S4's lifecycle ownership, S7's evidence storage, or S9's Evidence Gate. Reusing the exact five-class evidence vocabulary and the `all_of`/`any_of` shape `rule-record.schema.json` already established keeps S3 from inventing a parallel policy grammar.

## Consequences

This adoption makes it possible to describe a task's authorized scope, acceptance criteria, and evidence requirements in a form a deterministic validator can check, and makes S4 (when separately proposed) able to consume a stable contract format rather than defining one from scratch. It makes it harder to close a future task on under-specified evidence, since the validator fails closed on any evidence requirement that does not guarantee the required class on every satisfiable path.

It does not implement task lifecycle/state ownership, locks/leases/retries/timeouts/idempotency (S4); capability/tool/credential enforcement (S5); sandbox/worktree execution (S6); evidence artifact storage or QA execution (S7); orchestration/agent dispatch (S8); Evidence Gate acceptance logic (S9); CI/rulesets/protected-main enforcement (S10); telemetry/memory (S11); project overlays (S12); release/runtime verification machinery (S13); or the end-to-end production pilot (S14). `devos/contracts/`'s `executable_runtime_present` remains `false`: nothing here owns operational state, executes lifecycle transitions, dispatches actors, or brokers capabilities — the schema, spec, validator, and tests are repository-local static tooling, per `ML-DEVOS-RFC-015`'s behavior-based definition this ADR's `IMPLEMENTED` status relies on.

## Version consequence

This is a backwards-compatible new Sentinel governance capability — the first implemented Typed Task Contract mechanism (schema, specification, deterministic validator, evidence-policy semantic validation, examples/tests). Per `VERSIONING_POLICY.md`'s MINOR criterion and `ML-DEVOS-AS-056`'s (`AS56-F005`) recommendation:

`v1.5.0 → v1.6.0`

Per `D-046`'s explicit single-release/multiple-ADR rule, this transition is **co-released** with `ML-DEVOS-RFC-015`'s adoption (`ML-DEVOS-ADR-012`) under one coordinated Sentinel release boundary — both ADRs are independently effective at `v1.6.0`. This ADR is the ordered, release-closing ADR of that boundary: `devos/devos-manifest.json`'s `sentinel_capability_baseline.adr` names this ADR, while `ML-DEVOS-ADR-012` remains separately, durably recorded in `closure_history` as co-effective at the same version.

No `CORE-*` rule changes. The frozen S0 architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`, unchanged.

## Explicitly not implemented

This ADR does not implement or authorize:

- S4 State Machine Kernel, S5 Capability Gateway, S6 isolation, S7 Evidence/QA Plane, S8 Orchestrator, S9 Evidence Gate, S10 CI/rulesets, S11–S14;
- any `CORE-*` rule change;
- product/runtime changes, remote resources, credentials, deployment, protected/main merge, or production writes;
- a Sentinel `manifest_version` semantic change (`manifest_version` remains exactly `"1"`).

`S4` remains wholly unauthorized. This ADR's adoption, `devos/contracts/`'s `IMPLEMENTED` status, and the `v1.6.0` transition are not, individually or together, S4 authority.

## Supersession

Supersedes: none.

Fulfills, without redefining ownership of, the `devos/contracts/` reserved root established by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`).

Superseded by: none as of acceptance.

## Related RFC

`ML-DEVOS-RFC-013` — status updated to `IMPLEMENTED AND CLOSED` by this ADR's adoption; its proposal text is preserved unedited.

## Architect Sync

`ML-DEVOS-AS-038` (design), `ML-DEVOS-AS-053` (reopening), `ML-DEVOS-AS-054` (remediation), `ML-DEVOS-AS-055` (`ARCHITECT_APPROVED — S3 TECHNICAL STAGE GATE`), `ML-DEVOS-AS-056` (discrepancy review), `ML-DEVOS-AS-060` (RFC-015 mechanism this closure uses), `ML-DEVOS-AS-061` (this coordinated closure's own D.1 preflight, `PASS`).

## Paulo decision

`D-037` authorized the actual S3 implementation (queued behind Traceability V1). `D-042` authorized only the Architect's sequential reopening of that preserved authority — it did not itself re-authorize implementation from scratch. `D-046` authorized this coordinated closure, including this ADR's creation, `devos/contracts/`'s `IMPLEMENTED` transition, and the `v1.6.0` release.

## Implementation evidence

Final independently accepted implementation head `61803ffc15ce88a61ccead71fa7e41f5a9ff2efd`, reviewed and given final technical stage-gate approval by `ML-DEVOS-AS-055`. Evidence class: `INDEPENDENTLY_INSPECTED`/`INDEPENDENTLY_REPRODUCED` for the deterministic schema/validator/evidence-policy invariants `ML-DEVOS-AS-055` verified directly; `ACTOR_REPORTED` for Builder-run test counts not independently re-executed by the Architect. No `RUNTIME_OBSERVED` evidence exists or is claimed — S3 makes no production/runtime claim.

## Effective version

`v1.6.0`, the release-closing ADR of the coordinated boundary shared with `ML-DEVOS-ADR-012`. Frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`.

## Supersedes / superseded by

Supersedes: none. Superseded by: none as of acceptance.
