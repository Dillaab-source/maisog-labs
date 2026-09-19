# ML-DEVOS-RFC-008: Sentinel Risk Escalation Rules

Status: `ACCEPTED`

Change class: `CORE_POLICY`

Proposed Sentinel governance-capability transition: `v1.4.0 → v1.5.0`

Repository-grounded base: `51aa8ac8393975d15a005e9db09a8eb66422bb13`

## Purpose

Adopt the smallest Sentinel-wide governance improvements justified by the 2026 cross-source review without implementing later enforcement phases prematurely.

This RFC adds exactly three governance rules:

1. **Remote Resource Gate**
2. **Risk-Based Evidence Escalation**
3. **Merge / Production Protection Trigger**

It adds no runtime enforcement subsystem.

## Design principle

Preserve:

`BUILD VALUE FIRST — ADD CONTROL WHEN RISK JUSTIFIES IT`

`CAPABILITY != AUTHORITY`

`EVIDENCE, NOT AGENT ASSERTION, MOVES STATE FORWARD`

## CORE-019 — Remote Resource Authority Must Be Explicitly Scoped

Before any agent or mechanism receives authority to perform a real remote/cloud action, the authorization record must identify at minimum:

- provider/service;
- exact resource or bounded resource scope;
- environment;
- allowed operations;
- explicitly denied/destructive operations where relevant;
- acting identity / credential class;
- credential lifetime or end-of-cycle revocation rule;
- whether the resource/data is public, production, or sensitive;
- rollback/revocation path;
- audit/evidence expectation.

Broad authorization such as `Cloudflare authorized` is insufficient.

This rule does not itself authorize any remote action.

## CORE-020 — Evidence Sufficiency Escalates With Consequence

Evidence requirements scale with the impact of the claim/action.

- Low-risk/local repository claims may rely on `ACTOR_REPORTED` execution plus `INDEPENDENTLY_INSPECTED` review where appropriate.
- Executable/integration behavior should use `INDEPENDENTLY_REPRODUCED` and/or `CI_ATTESTED` where feasible before stronger merge/release claims.
- Remote/production writes, destructive operations, credential/security changes, or public cutovers must not close solely on Builder `ACTOR_REPORTED` evidence; require an independent/deterministic evidence class appropriate to the claim.
- `DEPLOYED` remains governed by CORE-017.
- `VERIFIED` remains governed by CORE-018 and requires `RUNTIME_OBSERVED`.

This supplements CORE-006/016/017/018; it does not impose irrelevant CI/runtime checks on low-risk documentation changes.

## CORE-021 — First Protected-Main / Production Operation Triggers Technical-Protection Review

Before Sentinel authorizes a project's first:

- protected/main merge under agent-assisted development; or
- real production deployment / production infrastructure mutation;

perform a focused review of minimum technical enforcement.

The review determines whether to enable, where supported:

- pull-request requirement;
- reviewer other than the last pusher / Builder;
- required executable checks;
- restricted bypass/dismissal authority;
- branch/ruleset protections;
- deployment-environment protections;
- rollback/revocation expectations.

This is a trigger for minimum appropriate controls, **not** authorization to implement all of S10.

## Explicitly still unimplemented

This RFC does not implement or authorize:

- S3 Typed Task Contracts;
- S4 State Machine Kernel;
- S5 Capability & Permission Gateway;
- S6 isolated execution/sandbox subsystem;
- S7 Evidence & QA Plane;
- S8 Orchestrator;
- S9 executable Evidence Gate;
- S10 full GitHub Enforcement phase;
- S11 Memory & Observability;
- S12–S14;
- CI workflows;
- GitHub rulesets;
- Policy Engine;
- Task Engine;
- capability broker;
- automated credential issuance/revocation;
- telemetry pipeline.

Those remain separately governed future work.

## Implementation surfaces

If accepted:

- `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`
- `devos/governance/EVIDENCE_PROVENANCE_MODEL.md`
- `devos/governance/rules/core-rules.json`
- `devos/governance/specifications/VERSIONING_POLICY.md`
- `devos/devos-manifest.json`
- `docs/SENTINEL_REVIEW_NOTES.md`
- durable RFC/Architect Sync/Decision/ADR indexes

No product/runtime application code.

## Version impact

This is a backwards-compatible Sentinel governance-capability addition.

Proposed impact:

`MINOR`

`v1.4.0 → v1.5.0`

Frozen architecture identity remains:

`ML-DEVOS-ARCH-001 / v1.2.0`

## Interaction with WEB-INC-004

WEB-INC-004 remains at its existing Paulo implementation gate.

These rules do not authorize WEB-INC-004.

Its proposed local simulated R2 is not a real remote resource and therefore does not itself activate CORE-019.

## Success criteria

- CORE-019/020/021 active and aligned between human-readable policy and rule registry;
- evidence model records the escalation rule;
- v1.5.0 recorded explicitly in version policy and manifest;
- durable Decision and ADR exist;
- future S3–S14 plans remain explicitly `NOT_IMPLEMENTED`;
- WEB-INC-004 authority state is unchanged.
