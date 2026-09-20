# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
AUTHORIZED_SCOPE: SKILLS_FOUNDATION_V0_1_DISCOVERY_ARCHITECTURE_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: NO
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Product / Risk Owner priority

`D-038 — Skills Foundation discovery is the immediate priority.`

## S3 status

`S3 — Typed Task Contracts: PAUSED / QUEUED — AUTHORITY PRESERVED`

Preserved authority:
- `ML-DEVOS-RFC-013`
- `ML-DEVOS-AS-038`
- `D-037`

No S3 implementation is authorized while this discovery cycle is active.

## Governing principles

`GOVERNANCE > SKILLS`

`CURRENT AUTHORIZATION > SKILL CAPABILITY`

`CAPABILITY != AUTHORITY`

A skill, task contract, prompt, plugin, connected tool, or technical capability never grants authority on its own.

## Authorized discovery

- inspect existing reusable procedures;
- create `ML-DEVOS-RFC-014 — MaisogLabs Skills Foundation V0.1 Discovery`;
- analyze duplication/overlap;
- propose canonical skill location;
- propose smallest coherent initial skill set;
- design SKILL CHECK routing;
- analyze provider-adapter exposure;
- design external-skill security policy;
- design skill evaluations;
- map Skills Foundation into existing Sentinel traceability;
- identify any narrow S3 integration requirement;
- update normal discovery handoff/bookkeeping.

## Hard boundaries

No:
- actual executable skill library;
- `devos/skills/` creation;
- provider adapter directories;
- S3 implementation;
- S4+ / S5 capability machinery;
- product/runtime/public-site changes;
- remote resources;
- credentials;
- production writes;
- deployment;
- main merge;
- frozen-rule/governance weakening;
- external skill installation/execution.

## Separate open debt

`TRACE-DEBT-001 — WEB-REQ-009 missing canonical requirement` remains open and out of scope.

## Return gate

When discovery is complete:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

Builder must provide the complete discovery/RFC handoff defined in `coordination/ARCHITECT_REVIEW.md` and must not self-authorize implementation or S3 resumption.

## Discovery complete — full evidence in coordination/IMPLEMENTER_HANDOFF.md

See the "MAISOGLABS Skills Foundation V0.1 — Discovery Handoff" section at the end of `coordination/IMPLEMENTER_HANDOFF.md`, and `devos/changes/rfcs/ML-DEVOS-RFC-014.md` (new, `DRAFT`). Summary: existing-procedure inventory across all required files; a Skill-vs-Governance/Brain/ADR/Capability definition boundary; `devos/skills/` proposed as canonical location (not created); a 5-skill smallest-coherent initial set derived from already-proven repository procedures (Governance/Traceability Audit, Architect Review/Sync, Implementation Handoff, Project Orientation/State Recovery, Knowledge/Realization Capture); Project Health, Research-Before-Architectural-Decisions, and Public/Private Classification explicitly evaluated and rejected for V0.1 with reasons; external-skill security model and evaluation strategy designed; no S3 amendment needed; S3 pause confirmed clean (zero abandoned implementation). Only `ML-DEVOS-RFC-014.md` and the `rfcs/README.md` index were created/modified — no skill file, canonical directory, or provider-adapter directory exists.
