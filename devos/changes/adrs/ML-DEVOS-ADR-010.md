# ML-DEVOS-ADR-010: Adopt Sentinel Traceability V1

Status: `ACCEPTED`

Related RFC: `ML-DEVOS-RFC-012`  
Architect Sync: `ML-DEVOS-AS-037`, `ML-DEVOS-AS-039`, `ML-DEVOS-AS-040`, `ML-DEVOS-AS-041`  
Paulo decision: `D-036`  
Implementation evidence: Builder implementation/remediation commits on `governance/maisoglabs-v0.1`; final artifact review `INDEPENDENTLY_INSPECTED` by Architect; Builder test execution remains `ACTOR_REPORTED`  
Effective version: `1.5.0` (explicitly no capability-baseline bump)

## Decision

Sentinel adopts Traceability V1 as a repository-local, derived, non-authoritative traceability integrity subsystem.

It discovers canonical governance identifiers from existing authoritative records, scans durable semantic reference surfaces, detects missing canonical targets and duplicate canonical definitions, reports historical/intentional exceptions visibly, detects orphaned records as warnings, and emits deterministic JSON/Markdown traceability indexes.

Rolling coordination and Traceability V1's own tooling surfaces do not feed hard missing-target findings.

## Context

Before this change, Sentinel already had the frozen universal traceability model:

`Requirement → Design → Implementation → Test → Evidence → Status`

but cross-reference integrity was primarily human/agent reviewed.

The first implementation correctly found genuine gaps but also exposed two parser-boundary problems:
1. an intentional statement that a proposed rule must not exist was treated as a missing target;
2. rolling review/handoff text discussing findings recursively created new findings.

Both were corrected before adoption.

## Alternatives considered

- one giant manually maintained traceability matrix — rejected as a second source of truth;
- paid requirements tooling — rejected for current scale;
- immediate full semantic graph parsing — rejected as excessive for V1;
- scanning all repository text equally — rejected after remediation because rolling/tooling surfaces create self-referential false positives.

## Rationale

The adopted design keeps authoritative records where they already live and derives a deterministic integrity view from them.

A narrow durable-reference boundary makes the mechanism useful without pretending every textual mention is a durable semantic reference.

## Consequences

Positive:
- durable broken references can be detected mechanically;
- orphan records are visible;
- generated indexes are deterministic;
- tool output is explicitly non-authoritative;
- the system already surfaced a genuine missing website requirement record.

Negative / limitations:
- V1 is textual and ID-pattern based, not a full semantic graph;
- explicit exception configuration is required for intentional noncanonical mentions;
- rolling/tooling surfaces are excluded from hard reference extraction;
- the genuine `WEB-REQ-009` gap remains unresolved.

## Related RFC

`ML-DEVOS-RFC-012`

## Architect Sync

`ML-DEVOS-AS-037` approved the architecture.  
`ML-DEVOS-AS-039` and `ML-DEVOS-AS-040` required bounded remediation.  
`ML-DEVOS-AS-041` accepted the final implementation.

## Paulo decision

`D-036`

## Implementation evidence

Final accepted implementation includes:
- deterministic generator;
- validator;
- bounded config;
- generated JSON/Markdown indexes;
- explicit historical/reference exception handling;
- durable/rolling reference-surface separation;
- focused tests.

Builder reports `14/14` focused tests and `352/352` full-suite tests. These are `ACTOR_REPORTED`.

The Architect independently inspected the final implementation/diff and accepted its architecture and boundary behavior as `INDEPENDENTLY_INSPECTED`.

## Effective version

`1.5.0`.

No version transition is applied. Traceability V1 operationalizes the frozen traceability model without changing CORE policy, authority, trust boundaries, deployment rules, or remote-resource rules.

## Supersedes / superseded by

None.
