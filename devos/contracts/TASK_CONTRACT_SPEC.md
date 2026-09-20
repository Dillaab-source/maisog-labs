# Sentinel Task Contract Specification (S3 V1)

Authority: `ML-DEVOS-RFC-013` / `ML-DEVOS-AS-038` / `D-042` (S3 implementation authorization) / `ML-DEVOS-AS-053` (S3 reopening) / `ML-DEVOS-AS-054` (implementation review, remediation cycle 1).

Status: `IMPLEMENTED — repository-local schema/spec/validator/examples only`. No task-lifecycle, orchestration, or evidence-acceptance mechanism exists in S3; see "What S3 is not" below.

## Purpose

A Task Contract is a compact, typed, machine-validateable description of a single already-authorized task's scope, acceptance criteria, and claim/evidence expectations. It exists so later work can consume a stable, schema-checked contract instead of reconstructing task intent from prose scattered across RFCs, Architect Syncs, Decisions, handoffs, and `coordination/STATE.md`.

## What a Task Contract is not

- **It is not authority.** A Task Contract *describes* scope already authorized elsewhere (an RFC, Architect Sync, Decision, or `coordination/STATE.md`'s live `AUTHORIZED_SCOPE`). It never grants tool access, credentials, remote-resource access, merge approval, deployment approval, or risk acceptance (`CORE-001`, `CORE-002`). Every contract instance carries this as a fixed, non-reword-able field: `authority_disclaimer`.
- **It is not an Evidence Gate.** `validate-task-contract.mjs` checks that a contract's *declared* evidence requirements are internally consistent and compliant with active policy (`CORE-016`/`017`/`018`/`020`). It never inspects any actually-produced evidence artifact and never decides whether a task is complete, accepted, merged, or deployed. That is an S9 Evidence Gate concern (not implemented) and, until then, an Architect/Paulo judgment call outside this file's scope.
- **It is not a task-lifecycle engine.** No state transitions, locks, leases, retries, timeouts, or idempotency machinery exist here — that is S4.
- **It does not retroactively rewrite history.** S3 does not fabricate Task Contracts for prior work; the bundled examples are clearly labeled illustrative examples, never claimed historical authority.

## File layout

```
devos/contracts/
├── README.md                        — S2-era reserved-root boundary notice (still accurate; S3 fills the root, does not redefine its ownership)
├── TASK_CONTRACT_SPEC.md             — this file
├── task-contract.schema.json         — structural JSON Schema (draft-07)
├── validate-task-contract.mjs        — structural + semantic validator (zero third-party deps)
└── examples/
    ├── valid/                        — fixtures that must pass validate-task-contract.mjs
    └── invalid/                      — fixtures that must be REJECTED, each proving one fail-closed rule
```

Focused tests live at the repository's normal test location: `tests/task-contract.test.mjs`, following the same convention as `tests/skills.test.mjs` and `tests/traceability.test.mjs`.

## Contract shape

### Identity / provenance

| Field | Required | Notes |
|---|---|---|
| `contract_schema_version` | yes | `MAJOR.MINOR.PATCH` — the schema version this instance targets, not the Sentinel governance-capability version. |
| `task_id` | yes | Stable identifier, `^[A-Z][A-Z0-9_-]*$`, at least 3 characters. |
| `title` | yes | Non-empty string. |
| `project` | yes | Repository/project scope, e.g. `Dillaab-source/maisog-labs`. |
| `change_class` | yes | Reuses `devos/governance/registry/rule-record.schema.json`'s existing class vocabulary (`PATCH`/`LOCAL_RULE`/`CORE_POLICY`/`CAPABILITY`/`ARCHITECTURE`/`CONSTITUTIONAL`/`WAIVER`/`PROJECT_ONBOARDING`) rather than inventing a second taxonomy. |
| `authorization_references` | yes, non-empty | IDs (RFC/Architect Sync/Decision/ADR) that already authorized this task. A contract with none would itself look like self-granted authority, which `CORE-001`/`CORE-002` forbid. |
| `requirement_references` / `risk_references` / `design_references` | no | Optional arrays of reference IDs. Traceability V1 may later index these without owning their semantics (`ML-DEVOS-RFC-013` §"Compatibility"). |

### Scope

`scope` is an object with `allowed_paths` (non-empty array — bounded repository paths/artifact domains) plus optional `prohibited_paths`/`prohibited_actions`, and five required boolean flags:

- `remote_resources_involved`
- `protected_main_or_deploy_in_scope`
- `production_write_in_scope`
- `credential_or_security_in_scope`
- `destructive_actions_in_scope`

These five flags are how the semantic validator determines whether `CORE-020`'s consequence-sensitive evidence escalation applies to this contract, without re-deriving that judgment from prose each time. `scope` **describes** already-authorized scope; declaring `allowed_paths` here does not itself grant write access to those paths.

### Acceptance criteria

A non-empty array of `{ criterion_id: "AC-N", statement: "..." }`. A criterion states an *expected outcome*; its presence never certifies the outcome occurred — that is what claims/evidence are for.

### Claims and evidence

A non-empty array of claims, each `{ claim_id: "CLAIM-N", claim_kind, statement, evidence: { all_of: [...], any_of: [...] } }`.

**Claim kinds (V1 bounded vocabulary — adding a new one requires a future governed extension, not an ad hoc schema edit):**

- `DOCUMENTATION_CORRECTNESS`
- `IMPLEMENTATION_PRESENT`
- `TESTED_BEHAVIOR`
- `SECURITY_OR_TRUST_BOUNDARY`
- `MAIN`
- `DEPLOYED`
- `VERIFIED`

**Evidence vocabulary (exactly, reused unchanged from `EVIDENCE_PROVENANCE_MODEL.md` — never a parallel/second vocabulary):**

- `ACTOR_REPORTED`
- `INDEPENDENTLY_INSPECTED`
- `INDEPENDENTLY_REPRODUCED`
- `CI_ATTESTED`
- `RUNTIME_OBSERVED`

`evidence.all_of` lists classes that are ALL independently required (AND). `evidence.any_of` lists classes where at least one satisfies the requirement (OR), when non-empty. This is the exact `all_of`/`any_of` shape `rule-record.schema.json` already uses for `CORE-*` rules — S3 reuses it rather than inventing a second evidence-combination grammar. No implicit evidence upgrade is ever allowed: satisfying a weaker class never silently counts as satisfying a stronger one.

### `authority_disclaimer`

A required field whose value is fixed by the schema's `const` to the exact sentence:

> This Task Contract describes already-authorized scope. It does not itself grant authority, tool access, credentials, remote-resource access, merge approval, deployment approval, or risk acceptance (CORE-001, CORE-002). Satisfying this contract's acceptance criteria and evidence requirements does not certify task success or accept the task; that judgment belongs to the Architect/Paulo review that consumes this contract's evidence, not to the contract or its validator.

No instance may soften, omit, or reword this (`ML-DEVOS-AS-038` `AS38-F002`). `tests/task-contract.test.mjs` and the bundled `examples/invalid/reworded-authority-disclaimer.contract.json` fixture both exercise this directly.

## Binding semantic validation (`validate-task-contract.mjs`)

The validator enforces **existing active policy**, never new policy of its own invention.

Central to rules 1–2 below is a **guarantee check**, not a mere presence check (`ML-DEVOS-AS-054` `AS54-F003`). Because `evidence.all_of`/`evidence.any_of` is an AND/OR grammar (every `all_of` class is required, PLUS at least one `any_of` alternative), asking "does an acceptable class appear *somewhere* in `all_of` or `any_of`" is insufficient: if `any_of` mixes an acceptable class with an unrelated one (e.g. `any_of: ["CI_ATTESTED", "RUNTIME_OBSERVED"]` for a `MAIN` claim), the unrelated branch alone can close the claim without ever providing the required class. The validator instead asks whether a required set `R` is **guaranteed** on every satisfiable path: `all_of` already contains a member of `R` (unconditionally present regardless of which `any_of` branch is picked), **or** `any_of` is non-empty and *every* alternative in it belongs to `R` (so whichever branch is taken, it's a required class).

1. **`MAIN` claims must be compatible with `CORE-016`:**
   - the evidence requirement must **guarantee** `INDEPENDENTLY_REPRODUCED` or `CI_ATTESTED` on every satisfiable path (not merely offer one somewhere);
   - `RUNTIME_OBSERVED` must never be an unconditional (`all_of`) requirement for a `MAIN` claim — it cannot exist before deployment (`ML-DEVOS-RFC-013`).

2. **`DEPLOYED` claims must be compatible with `CORE-017`:**
   - the evidence requirement must **guarantee** `ACTOR_REPORTED` or `CI_ATTESTED` on every satisfiable path;
   - `CORE-017` is an evidence **floor, not a ceiling** (`ML-DEVOS-AS-054` `AS54-F005`): a `DEPLOYED` claim that guarantees `ACTOR_REPORTED`/`CI_ATTESTED` and *additionally* requires unconditional `RUNTIME_OBSERVED` is stronger than `CORE-017`'s minimum, not incompatible with it, and is never rejected merely for demanding extra evidence. It still does not become a `VERIFIED` claim by doing so — `VERIFIED` remains a distinct `claim_kind` governed by rule 3.

3. **`VERIFIED` claims must be compatible with `CORE-018`:**
   - `RUNTIME_OBSERVED` must be an unconditional (`all_of`) requirement. No weaker evidence class ever substitutes, including one offered as one option among several in `any_of`.

4. **Consequence-sensitive contracts must be compatible with `CORE-020`:** if any of the five `scope` flags is `true`, no claim of a kind *other than* `MAIN`/`DEPLOYED`/`VERIFIED` may be satisfiable using `ACTOR_REPORTED` alone. `MAIN`/`DEPLOYED`/`VERIFIED` claims are excluded from this extra check because `CORE-020`'s own text says "existing MAIN, DEPLOYED, and VERIFIED evidence rules remain authoritative for those exact claims" — `CORE-017` deliberately permits `ACTOR_REPORTED` for `DEPLOYED` even in a consequence-sensitive contract, and `CORE-020` must not silently re-restrict that.

5. **Every claim's evidence requirement must be non-trivial:** `all_of` and `any_of` may not both be empty — an empty requirement is meaningless and would trivially defeat every check above.

6. **Structural shape** must match `task-contract.schema.json` exactly: unknown fields, missing required fields, invalid enum/pattern values, and empty-string items in any array field the schema marks `minLength: 1` (`authorization_references`, `requirement_references`, `risk_references`, `design_references`, `scope.allowed_paths`, `scope.prohibited_paths`, `scope.prohibited_actions`) are all hard failures (`additionalProperties: false` throughout, mirroring `devos/governance/registry/rule-record.schema.json`'s convention). The hand-written structural validator and the declared JSON Schema must never disagree about what is structurally valid (`ML-DEVOS-AS-054` `AS54-F004`).

The validator never infers that a passing result grants merge, deployment, remote-resource, risk-acceptance, or any other Paulo-gated authority. A `PASS` means "structurally and semantically valid as a Task Contract" — nothing more.

## Worked examples

| Fixture | Expectation | What it proves |
|---|---|---|
| `examples/valid/low-risk-doc-fix.contract.json` | PASS | A low-risk, repository-only task may close its claims on `ACTOR_REPORTED`/`INDEPENDENTLY_INSPECTED` alone — `CORE-020`'s documentation/repository-only exception is not defeated by irrelevant CI/runtime demands. |
| `examples/valid/full-lifecycle-main-deployed-verified.contract.json` | PASS | Correct `MAIN`/`DEPLOYED`/`VERIFIED` evidence declarations coexist in one consequence-sensitive contract, including `DEPLOYED` legitimately closing on `ACTOR_REPORTED` per `CORE-017` despite the contract being consequence-sensitive. |
| `examples/valid/deployed-claim-stronger-with-runtime-observed.contract.json` | PASS | `CORE-017` is a floor, not a ceiling (`AS54-F005`): a `DEPLOYED` claim guaranteeing `ACTOR_REPORTED` in `all_of` plus an *additional* unconditional `RUNTIME_OBSERVED` requirement is never rejected merely for being stronger than the floor. |
| `examples/invalid/main-claim-actor-reported-only.contract.json` | REJECTED | `CORE-016` fails closed: a `MAIN` claim cannot close on `ACTOR_REPORTED` alone. |
| `examples/invalid/main-claim-mixed-branch-bypass.contract.json` | REJECTED | `AS54-F003`'s guarantee check: `any_of: ["ACTOR_REPORTED", "CI_ATTESTED"]` does not *guarantee* `CI_ATTESTED` for a `MAIN` claim, since the `ACTOR_REPORTED` branch alone would also satisfy it. |
| `examples/invalid/main-claim-over-requires-runtime-observed.contract.json` | REJECTED | A `MAIN` claim cannot demand `RUNTIME_OBSERVED` — that would make `MAIN` permanently unsatisfiable before deployment. |
| `examples/invalid/deployed-claim-wrong-evidence.contract.json` | REJECTED | `CORE-017` fails closed: a `DEPLOYED` claim must guarantee `ACTOR_REPORTED` or `CI_ATTESTED`. |
| `examples/invalid/deployed-claim-mixed-branch-bypass.contract.json` | REJECTED | `AS54-F003`'s guarantee check for `DEPLOYED`: `any_of: ["ACTOR_REPORTED", "RUNTIME_OBSERVED"]` does not guarantee `ACTOR_REPORTED`, since the `RUNTIME_OBSERVED` branch alone would also satisfy it. |
| `examples/invalid/deployed-claim-runtime-observed-alone-not-guaranteed.contract.json` | REJECTED | A `DEPLOYED` claim requiring only `RUNTIME_OBSERVED` never guarantees `ACTOR_REPORTED`/`CI_ATTESTED` — the failure reason is the missing guaranteed class, never a ban on `RUNTIME_OBSERVED` itself (contrast with the valid stronger-with-runtime-observed fixture above, `AS54-F005`). |
| `examples/invalid/verified-claim-missing-runtime-observed.contract.json` | REJECTED | `CORE-018` fails closed: a `VERIFIED` claim without unconditional `RUNTIME_OBSERVED` is rejected even if it offers other strong-looking evidence. |
| `examples/invalid/consequence-sensitive-actor-reported-only.contract.json` | REJECTED | `CORE-020` fails closed: a destructive/production-write contract cannot let a non-lifecycle claim close on `ACTOR_REPORTED` alone. |
| `examples/invalid/empty-evidence-requirement.contract.json` | REJECTED | A claim with no evidence requirement at all is rejected as meaningless. |
| `examples/invalid/reworded-authority-disclaimer.contract.json` | REJECTED | The `authority_disclaimer` field cannot be softened or reworded. |
| `examples/invalid/schema-violation-missing-field.contract.json` | REJECTED | Structural validation fails closed on a missing required top-level field. |
| `examples/invalid/unknown-evidence-class.contract.json` | REJECTED | Structural validation fails closed on an evidence class outside the bounded five-class vocabulary. |

Run the bundled self-check:

```
node devos/contracts/validate-task-contract.mjs
```

Validate a specific contract file:

```
node devos/contracts/validate-task-contract.mjs path/to/some.contract.json
```

## What S3 is not (non-goals, unchanged from `ML-DEVOS-RFC-013`)

S3 does not implement: task lifecycle/state ownership or locks/leases/retries/timeouts/idempotency (S4); capability/tool/credential enforcement (S5); sandbox/worktree execution (S6); evidence artifact storage or QA execution (S7); orchestration/agent dispatch (S8); Evidence Gate acceptance logic (S9); CI/rulesets/protected-main enforcement (S10); telemetry/memory stores (S11); project overlays (S12); release/runtime verification machinery (S13); the end-to-end Sentinel production pilot (S14). It does not create remote/cloud resources, change product runtime, deploy, merge to `main`, automatically accept risk, or automatically change task status.
