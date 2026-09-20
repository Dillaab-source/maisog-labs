# Architect Review

Status: `CHANGES_REQUESTED — S3 TYPED TASK CONTRACTS REMEDIATION CYCLE 1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Builder: Claude  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-054 — S3 Typed Task Contracts Implementation Review

Authority:
- `ML-DEVOS-RFC-013`
- `ML-DEVOS-AS-038 — ARCHITECT_APPROVED / S3 IMPLEMENTATION QUEUED`
- `D-037 — Paulo S3 implementation authorization`
- `D-042 — sequential S3 reopening authority`
- `ML-DEVOS-AS-053 — S3 reopened`

Builder implementation commit reviewed:
- `0efcce866f64d821e85887fd8f8504ecff31c40b`

Base:
- `b7634f572f2be93ef3a5527a06b924dfa5212594`

## Scope review

### AS54-F001 — PASS — S3 stayed within its implementation envelope

The implementation changed only:
- `devos/contracts/`;
- `tests/task-contract.test.mjs`;
- normal `coordination/IMPLEMENTER_HANDOFF.md` / `coordination/STATE.md` bookkeeping.

No S4+, product/runtime, remote resource, credential, deployment, protected/main merge, production-write, project-onboarding, CI/ruleset, Evidence Gate, or version-bump work was introduced.

### AS54-F002 — PASS — required S3 artifacts exist

Present:
- Task Contract specification;
- JSON Schema;
- zero-third-party semantic validator;
- bounded valid/invalid fixtures;
- focused tests;
- low-risk repository-only example;
- lifecycle MAIN/DEPLOYED/VERIFIED examples;
- fixed non-authority disclaimer.

The contract remains descriptive of already-authorized scope and does not itself grant authority.

Builder-reported test counts:
- focused S3 suite: `30/30`;
- full repository suite: `422/422`.

These command-run counts remain `ACTOR_REPORTED` until independently reproduced.

## Blocking findings

### AS54-F003 — BLOCKER — MAIN/DEPLOYED evidence validation checks presence, not guaranteed satisfaction

The active rules require:

- `CORE-016 MAIN`: a valid MAIN claim must require at least one of
  `INDEPENDENTLY_REPRODUCED` or `CI_ATTESTED`;
- `CORE-017 DEPLOYED`: a valid DEPLOYED claim must require at least one of
  `ACTOR_REPORTED` or `CI_ATTESTED`.

The current validator uses `includesSomewhere(...)`, which only asks whether one acceptable class appears anywhere in `all_of` or `any_of`.

That is insufficient for an AND/OR evidence grammar.

Example accepted incorrectly by the current MAIN validator:

```json
{
  "all_of": ["INDEPENDENTLY_INSPECTED"],
  "any_of": ["ACTOR_REPORTED", "CI_ATTESTED"]
}
```

This can be satisfied by:
- `INDEPENDENTLY_INSPECTED`
- plus `ACTOR_REPORTED`

with **no** `INDEPENDENTLY_REPRODUCED` or `CI_ATTESTED`, violating CORE-016.

Another current bypass:

```json
{
  "all_of": [],
  "any_of": ["CI_ATTESTED", "RUNTIME_OBSERVED"]
}
```

The validator sees `CI_ATTESTED` "somewhere" and accepts the MAIN evidence rule, even though the OR branch could be satisfied solely by `RUNTIME_OBSERVED`.

The same defect exists for DEPLOYED. For example:

```json
{
  "all_of": ["INDEPENDENTLY_INSPECTED"],
  "any_of": ["ACTOR_REPORTED", "RUNTIME_OBSERVED"]
}
```

can close via `INDEPENDENTLY_INSPECTED + RUNTIME_OBSERVED`, with neither evidence class CORE-017 requires.

#### Required remediation

Replace "acceptable class appears somewhere" logic with a guarantee check over the `all_of` / `any_of` semantics.

Equivalent rule:

A requirement guarantees at least one class from required set `R` iff:

1. `all_of` contains at least one member of `R`; **or**
2. `any_of` is non-empty and **every** alternative in `any_of` belongs to `R`.

For MAIN:
`R = { INDEPENDENTLY_REPRODUCED, CI_ATTESTED }`

For DEPLOYED:
`R = { ACTOR_REPORTED, CI_ATTESTED }`

Add direct unit tests and bounded invalid fixtures for mixed-branch bypasses.

Keep the existing CORE-018 VERIFIED rule: `RUNTIME_OBSERVED` must remain unconditional in `all_of`.

### AS54-F004 — BLOCKER — structural validator does not fully mirror task-contract.schema.json

The validator claims:

> "The instance matches task-contract.schema.json's declared shape exactly"

but its helper:

`isStringArray(v) = Array.isArray(v) && v.every(x => typeof x === "string")`

accepts empty-string items.

The JSON Schema explicitly specifies `minLength: 1` for items in:
- `authorization_references`;
- `requirement_references`;
- `risk_references`;
- `design_references`;
- `scope.allowed_paths`;
- `scope.prohibited_paths`;
- `scope.prohibited_actions`.

Therefore, for example:

```json
"authorization_references": [""]
```

or:

```json
"allowed_paths": [""]
```

is rejected by the declared schema but accepted by the current JavaScript structural validator.

That breaks S3's core machine-validation invariant: the executable validator and declared schema cannot disagree about structural validity.

#### Required remediation

Make the hand-written structural validator enforce the schema's item-level non-empty-string rule for every affected array.

Add focused tests covering at minimum:
- empty authorization reference;
- empty allowed path;
- empty optional reference;
- empty prohibited path/action.

No new dependency or JSON Schema runtime library is required.

### AS54-F005 — BLOCKER — DEPLOYED validation currently invents a stronger prohibition than CORE-017 requires

The current validator rejects any DEPLOYED claim with `RUNTIME_OBSERVED` in `all_of`.

The active CORE-017 rule says:
- DEPLOYED requires evidence the deployment action executed;
- at least one of `ACTOR_REPORTED` or `CI_ATTESTED`;
- RUNTIME_OBSERVED is **not required** for the DEPLOYED claim and belongs to the separate VERIFIED concept.

CORE-017 does not state that a contract is invalid merely because it asks for additional runtime evidence **in addition to** a guaranteed valid DEPLOYED evidence class.

S3 is authorized to enforce existing policy, not invent a stricter maximum-evidence policy.

Therefore:

```json
{
  "all_of": ["ACTOR_REPORTED", "RUNTIME_OBSERVED"],
  "any_of": []
}
```

is stricter than CORE-017's minimum, but still guarantees the deployment-action evidence CORE-017 requires. The validator should not reject it solely because extra runtime evidence is also required.

By contrast:

```json
{
  "all_of": ["RUNTIME_OBSERVED"],
  "any_of": []
}
```

must still fail because it does not guarantee `ACTOR_REPORTED` or `CI_ATTESTED`.

#### Required remediation

Remove the blanket DEPLOYED `RUNTIME_OBSERVED in all_of` rejection unless a current active rule explicitly forbids extra runtime evidence.

Use the corrected guaranteed-satisfaction test from AS54-F003 as the governing rule.

Preserve conceptual separation:
- a DEPLOYED claim does not become VERIFIED merely because it has extra runtime evidence;
- a VERIFIED claim still separately requires `RUNTIME_OBSERVED` and remains a distinct claim/status.

Update the spec and tests accordingly.

The existing invalid `deployed-claim-silently-treated-as-verified` fixture may remain invalid if it lacks any guaranteed CORE-017 class; its failure reason should be the missing guaranteed ACTOR_REPORTED/CI_ATTESTED path, not a newly invented ban on stronger evidence.

## Non-blocking observations

### AS54-O001 — CORE-020 lifecycle interpretation is acceptable

The Builder's decision to let CORE-016/017/018 govern MAIN/DEPLOYED/VERIFIED exactly, while CORE-020's actor-only escalation applies to consequence-sensitive non-lifecycle claims, is consistent with CORE-020's current text:

> "Existing MAIN, DEPLOYED, and VERIFIED evidence rules remain authoritative for those exact claims."

No remediation required for that interpretation.

### AS54-O002 — S3 closure bookkeeping remains pending by design

`ML-DEVOS-RFC-013` still carries its older queued/draft status text, while some new S3 documentation refers to it as accepted authority.

Do not broaden this remediation merely to perform lifecycle bookkeeping.

If the validator closes cleanly, the S3 acceptance/ADR step should normalize:
- RFC-013 status;
- S3 ADR;
- `devos/devos-manifest.json` reserved-root status;
- governance-capability version decision

exactly as RFC-013's rollout sequence already requires.

## Authorized remediation cycle 1

Claude may modify only:

- `devos/contracts/validate-task-contract.mjs`;
- `devos/contracts/TASK_CONTRACT_SPEC.md`;
- `devos/contracts/examples/**` as needed for bounded new/updated fixtures;
- `devos/contracts/README.md` only if fixture/test counts or semantic summary need correction;
- `tests/task-contract.test.mjs`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

Do not modify:
- core rules;
- RFC-013;
- manifest/version;
- S4+;
- product/runtime;
- remote/deploy/main resources.

## Required evidence on return

Builder must provide:
- exact base/result SHA;
- exact changed files;
- direct tests for MAIN mixed-`any_of` bypass;
- direct tests for DEPLOYED mixed-`any_of` bypass;
- positive test proving a DEPLOYED rule with guaranteed ACTOR_REPORTED/CI_ATTESTED plus additional RUNTIME_OBSERVED is not rejected merely for being stronger;
- structural parity tests for empty-string array elements;
- focused S3 test result;
- full-suite sanity result if practical;
- confirmation no S4+/runtime/remote/deploy/main/version work occurred.

## S3 status

`S3 — IMPLEMENTED, NOT YET ARCHITECT-ACCEPTED`

No S4 proposal or implementation is authorized.

## Verdict

`ML-DEVOS-AS-054: CHANGES_REQUESTED — S3 TYPED TASK CONTRACTS REMEDIATION CYCLE 1`

## Return gate

After remediation:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`
- `CURRENT_REMEDIATION_CYCLE: 1`

Builder must not self-accept S3 or start S4.
