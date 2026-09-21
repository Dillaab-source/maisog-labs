# Architect Brief — Sentinel S5 Capability & Permission Gateway Proposal

Status: AUTHORIZED_PROPOSAL
Review mode: ARCHITECTURE / DISCOVERY
Cycle: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_PROPOSAL
Authority: D-058
Target RFC: ML-DEVOS-RFC-017
Branch: governance/maisoglabs-v0.1

## Objective

Produce the first governed architecture proposal for S5 — Capability & Permission Gateway.

The proposal must define how Sentinel determines what an actor can technically invoke while preserving the frozen separation:

- Governance determines what MAY be done.
- Capability determines what CAN technically be done.
- Capability never grants authority.
- Missing, malformed, stale, ambiguous, or unresolvable capability policy fails closed.

This cycle is proposal and audit only. It does not authorize executable S5 behavior.

## Required proposal content

ML-DEVOS-RFC-017 must define:

1. provider-neutral capability descriptors for actor/role, project, tool/provider, action, resource scope, environment, expiry, credential requirements, and consequence tier;
2. deterministic request, evaluation, allow/deny decision, and denial-reason contracts;
3. default-deny handling for unknown actors, tools, actions, projects, resources, environments, or policy versions;
4. explicit separation between technical capability, governance authority, and human risk acceptance;
5. least-privilege scoping, revocation, expiry, and stale-policy behavior;
6. credential and secret-reference requirements without storing, exposing, or validating secret values in repository policy;
7. sensitive-operation gates for merge, deployment, remote-resource mutation, production data, credentials, and other high-consequence actions;
8. provider adapter boundaries for shell, GitHub, Cloudflare, MCP tools, browser/UI automation, and future APIs without embedding provider-specific authority semantics in the core model;
9. audit/evidence events for evaluations and denials, with provenance classification and no claim that S7 Evidence Store or S9 Evidence Gate already exists;
10. composition with S3 Typed Task Contracts and S4 Task State without duplicating or mutating their accepted schemas or ownership;
11. idempotency, retry, concurrency, and policy-version implications;
12. threat model, trust boundaries, misuse cases, failure modes, test plan, implementation mapping, migration/compatibility analysis, and explicit non-goals.

## Required design decisions

The RFC must compare and select bounded V1 options for:

- capability policy representation and schema ownership;
- repository-local versus externally supplied configuration;
- decision API shape and stable denial codes;
- policy-version binding to a task/attempt;
- adapter registration and discovery;
- revocation/expiry evaluation time;
- audit event minimum fields;
- behavior when governance permits an action but technical capability is absent;
- behavior when capability exists but governance authority is absent.

The selected design must remain compatible with ML-DEVOS-ARCH-001 v1.2.0. Any required architecture change must be identified as a separate future governance action, not silently made in this proposal cycle.

## Authorized mutation surface

Builder may change only:

- devos/changes/rfcs/ML-DEVOS-RFC-017.md
- devos/changes/rfcs/README.md
- devos/governance/traceability/TRACEABILITY_INDEX.md, only through deterministic regeneration
- devos/governance/traceability/traceability-index.json, only through deterministic regeneration
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

## Audit requirements

Report:

- input and result commit SHAs;
- exact changed-file list;
- RFC/template and governance sources read;
- every validation/generation command and exit code;
- traceability before/after counts and exact ERROR fingerprints;
- evidence provenance;
- blockers and unresolved design questions.

Known traceability debt must remain disclosed:

- CORE-022
- WEB-REQ-009

No unexpected new hard ERROR is acceptable. Do not suppress the known baseline to manufacture a clean result.

## Return gate

Return:

- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- IMPLEMENTER_ACTION_REQUIRED: NO
- ARCHITECT_ACTION_REQUIRED: YES
- CURRENT_REMEDIATION_CYCLE: 0
- MAX_REMEDIATION_CYCLES: 2

Architect will perform the S5 design stage-gate review. Implementation remains separately Paulo-gated even if the design is approved.

## Hard boundaries

No executable S5 gateway or permission-enforcement code.
No live credential or secret access.
No manifest status, closure_ref, Sentinel version, ADR, or frozen-architecture mutation.
No S6+.
No Skills V0.2.
No application/product/runtime change.
No remote D1/R2.
No Cloudflare Access, DNS, domain, deployment, or rollback change.
No production-data write.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.
