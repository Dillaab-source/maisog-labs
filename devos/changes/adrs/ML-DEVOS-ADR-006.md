# ADR-006: Adopt Sentinel risk escalation rules

Status: `ACCEPTED`

Related RFC:
- `ML-DEVOS-RFC-008`

Architect Syncs:
- `ML-DEVOS-AS-024` — proposal/core-policy compatibility
- `ML-DEVOS-AS-025` — implementation acceptance

Paulo decision:
- `D-028`

Implementation range:
- base after decision: `1017be3ff8b8eb86387ebc34433567d2d72089c0`
- reviewed implementation head: `4d1437a72b56f181414802368ab52508e4b7244c`

Effective version:
- Sentinel governance-capability baseline: `v1.5.0`
- frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`

## Decision

Sentinel adopts three new active CORE_POLICY rules:

1. `CORE-019 — Remote Resource Authority Must Be Explicitly Scoped`
2. `CORE-020 — Evidence Sufficiency Escalates With Consequence`
3. `CORE-021 — First Protected-Main / Production Operation Triggers Technical-Protection Review`

These rules strengthen governance at the exact points where operational consequence rises without changing the actor model or implementing later runtime-control phases.

## CORE-019 — Remote Resource Gate

Before any real remote/cloud authority is granted, the authorization must identify a bounded resource scope, environment, allowed/denied operations, acting identity/credential class, lifetime/revocation, public/production/sensitive status, rollback/revocation path, and evidence expectations.

Broad provider-level authority is insufficient.

This rule never grants authority by itself.

Local simulation that cannot touch real remote resources does not activate this rule merely because it emulates the provider API.

## CORE-020 — Consequence-sensitive evidence

Evidence sufficiency remains claim-specific and provenance-aware.

Remote/production writes, destructive actions, credential/security changes, and public cutovers may not close solely on Builder `ACTOR_REPORTED` evidence.

Existing exact stage rules remain authoritative:
- CORE-016 — MAIN
- CORE-017 — DEPLOYED
- CORE-018 — VERIFIED

Low-risk repository/documentation work does not gain irrelevant CI/runtime requirements.

## CORE-021 — Merge/production technical-protection trigger

Before a project's first protected-main merge or real production deployment/infrastructure mutation under Sentinel, a focused review must determine the minimum appropriate technical protections.

Possible protections include review separation, required checks, bypass controls, rulesets/branch protections, deployment-environment controls, and rollback/revocation expectations.

This trigger does not automatically implement the full S10 phase.

## Version consequence

This is a backwards-compatible governance-capability addition:

`v1.4.0 → v1.5.0`

No constitutional meaning changed.

The frozen S0 architecture document remains unchanged.

## Explicitly not implemented

This ADR does not implement or authorize:

- S3 Typed Task Contracts;
- S4 State Machine Kernel;
- S5 Capability & Permission Gateway;
- S6 isolated execution;
- S7 Evidence & QA Plane;
- S8 Orchestrator;
- S9 executable Evidence Gate;
- S10 full GitHub Enforcement;
- S11 Memory & Observability;
- S12–S14;
- CI workflows;
- GitHub rulesets;
- Task Engine / Policy Engine;
- capability broker;
- automated credential issuance/revocation;
- telemetry pipeline.

Those remain separately governed future work.

## WEB-INC-004 separation

This governance update does not authorize WEB-INC-004 implementation.

Its current product gate remains separate, and remote R2/D1, deployment, public cutover, and main merge remain unauthorized.

## Supersession

Supersedes: none.

This ADR extends the active governance-capability baseline created by ADR-001/ADR-002.

Superseded by: none as of acceptance.
