# ML-DEVOS-RFC-012: Static Traceability Graph and Integrity Validator

Status: `ACCEPTED`

Proposed change class: `ARCHITECTURE`

## Problem

MaisogLabs/Sentinel already uses the universal traceability model:

`Requirement → Design → Implementation → Test → Evidence → Status`

and has durable IDs across requirements, risks, RFCs, Architect Syncs, decisions, ADRs, tests, increments, rules, and release records. However, most cross-links are currently maintained and checked by humans/agents. The recently closed `SENTINEL-BASELINE-CLEANUP-001` demonstrated the failure mode: authoritative state was correct, while duplicated descriptive text became stale elsewhere.

The repository needs a lightweight way to detect broken or missing governance references and to generate a navigable traceability view without creating a second manually maintained source of truth.

## Motivation

The goal is not "more documentation." The goal is to make existing governance records self-checking.

Without this capability:
- broken cross-references may survive until manual review;
- stale descriptive state can drift from authoritative records;
- impact analysis remains slower than necessary;
- the same relationship may be re-derived repeatedly by humans/agents;
- future growth increases the chance of orphaned governance records.

## Proposed change

Add a repository-only static traceability subsystem under:

`devos/governance/traceability/`

The subsystem will:

1. discover canonical governance records from existing authoritative surfaces;
2. extract references between stable IDs;
3. validate referential integrity;
4. detect selected orphan/duplicate-definition conditions;
5. generate derived machine-readable and human-readable traceability indexes;
6. report findings deterministically without changing any authority or status.

The generated traceability view is **derived evidence/navigation only**. It is never a source of authority and must not override the underlying records.

### Initial canonical ID families

At minimum:
- `ML-DEVOS-RFC-*`
- `ML-DEVOS-AS-*`
- `ML-DEVOS-ADR-*`
- `D-*`
- `CORE-*`
- `WEB-INC-*`
- `WEB-REQ-*`
- `ADM-REQ-*`
- `WEB-SEC-*`
- `DESIGN-*`
- `RISK-*` / existing project risk IDs
- `TEST-*`

### Initial validation behavior

The first implementation must distinguish:

**ERROR**
- reference to a durable governance ID whose canonical record does not exist;
- duplicate canonical definition where uniqueness is required;
- malformed generated index;
- generator output is nondeterministic for unchanged repository state.

**WARNING**
- canonical record with no inbound/outbound trace where historical/bootstrap exceptions may exist;
- a relationship that cannot yet be typed confidently from existing unstructured prose;
- legacy/bootstrap records that predate a given record system.

Warnings must not be silently promoted to governance blockers.

## Scope

Repository-local only.

Expected implementation surface:
- `devos/governance/traceability/README.md`
- `devos/governance/traceability/traceability.config.json` or equivalent bounded configuration
- `devos/governance/traceability/generate-traceability.mjs`
- `devos/governance/traceability/validate-traceability.mjs`
- generated `devos/governance/traceability/traceability-index.json`
- generated `devos/governance/traceability/TRACEABILITY_INDEX.md`
- focused tests for parser/integrity/determinism behavior
- normal governance/handoff records

Exact file names may vary slightly if the Builder demonstrates a simpler equivalent structure, but the subsystem must remain under `devos/governance/traceability/` and must not create a new top-level reserved subsystem root.

## Non-goals

This RFC does **not** implement:

- S3 Typed Task Contracts;
- S7 Evidence Store / QA Plane;
- S9 Evidence Gate;
- Policy Engine;
- Task Engine;
- Capability Gateway;
- Orchestrator;
- CI/GitHub Actions enforcement;
- branch protection/rulesets;
- automatic merge/deploy authorization;
- runtime application behavior;
- remote D1/R2/Cloudflare resources;
- project onboarding;
- a new human approval workflow;
- a replacement for `brain/GOVERNANCE_MAP.md`, `DECISION_LOG.md`, RFCs, ADRs, Architect Sync archives, risk register, or test ledger.

## Affected components

Governance/documentation/tooling only.

No public website route, Worker route, schema migration, product database, admin capability, authentication boundary, or production resource is affected.

## Affected rules

No `CORE-*` rule is added, modified, weakened, or superseded.

This implementation operationalizes the already-frozen traceability model in `ML-DEVOS-ARCH-001 §8` without changing its meaning.

## Alternatives considered

### 1. One giant manually maintained traceability matrix

Rejected. It creates a second source of truth and increases stale-document risk.

### 2. Paid requirements-management platform

Rejected for current scale. Adds cost and operational dependency without solving repository-local source-of-truth discipline better than a lightweight Git-native approach.

### 3. Parse every prose relationship into a strongly typed semantic graph immediately

Rejected for V1. Existing records are partly structured and partly prose. V1 should first establish reliable identity/reference integrity and deterministic derived indexes; richer typed edges can be added later through separately reviewed increments.

## Risks

- false positives from historical/bootstrap records;
- over-broad regex matching;
- accidental treatment of generated output as authoritative;
- validator complexity drifting into S3/S7/S9 responsibilities;
- maintenance burden if configuration becomes another large manual registry.

Mitigations:
- explicit canonical-definition surfaces;
- bounded ID patterns;
- allowlisted historical exceptions with rationale;
- ERROR vs WARNING separation;
- zero third-party dependencies unless separately justified;
- generated files clearly marked as derived/non-authoritative;
- Architect review of exact failure modes.

## Migration impact

None. No existing record is rewritten merely to satisfy the first validator.

If the validator discovers historical gaps, they must be classified and handled through their own governed cleanup/remediation cycle rather than silently rewritten by the generator.

## Security / trust impact

No new trust boundary.

The tool is read-only over repository files except for generating its own derived index files. It cannot grant authority, mutate product data, call remote services, deploy, merge, or change status.

`Capability != Authority` remains unchanged.

## Evidence requirements

For implementation acceptance:
- `INDEPENDENTLY_INSPECTED` exact code/diff;
- Builder-reported local execution of generator/validator;
- deterministic repeat-run proof;
- focused test coverage for missing-reference and duplicate-definition detection;
- proof that historical exceptions remain warnings/explicit exemptions rather than silently ignored;
- proof that the generated index declares itself non-authoritative.

No runtime/production evidence is required because this is repository-only governance tooling.

## Rollout

1. Implement bounded V1.
2. Run against current repository.
3. Record baseline findings without auto-remediation.
4. Architect independently inspects implementation and findings.
5. If accepted, write the ADR after implementation review.
6. Any newly discovered governance gaps become separate scoped changes.

## Rollback

Delete the traceability subsystem files and revert any generated-index references. Since source governance records are not rewritten, rollback does not alter underlying history or authority.

## Compatibility

Compatible with:
- frozen `ML-DEVOS-ARCH-001 §8` traceability model;
- current Sentinel `v1.5.0`;
- existing governance maps, decision log, RFC/ADR/AS archives, risk/test ledgers.

Must remain explicitly separate from unimplemented S3/S7/S9 runtime/enforcement systems.

## Version impact

`MINOR` candidate if adopted, because this adds a backwards-compatible governance capability/tooling subsystem without changing existing rule meaning.

No version transition is applied by this RFC or by implementation alone. A version decision occurs only after implementation review and ADR, if Paulo/Architect determine a Sentinel capability-baseline bump is warranted.

## Architect Sync requirement

Yes. `ARCHITECTURE` class.

## Paulo decision requirement

Yes.

Paulo has already instructed: `okay do that`, referring to the proposed self-checking traceability graph/index + validator after reviewing the web/practitioner research and Sentinel health discussion. This instruction is recorded as implementation authorization only within the bounded architecture accepted by `ML-DEVOS-AS-037`.
