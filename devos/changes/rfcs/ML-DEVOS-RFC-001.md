# ML-DEVOS-RFC-001 — S2 DevOS Repository Foundation

Status: `UNDER_ARCHITECT_SYNC`

Proposed change class: `ARCHITECTURE`

Proposed by: Architect (ChatGPT), under Paulo authorization `D-015`

Target phase: `S2 — DevOS Repository Foundation`

Target baseline: Sentinel governance-capability baseline `v1.3.0`

## Problem

Sentinel has a frozen S0 architecture and an active S1 Governance Kernel, but the repository still lacks a concrete, explicit foundation for the DevOS core and project registry that later phases can build on without inventing directory ownership ad hoc.

Today, `devos/` contains architecture/governance/specification documents, while the existing website source remains co-located at repository root. There is no formal repository-level manifest that states which DevOS subsystem roots exist, which later phase owns each root, what is currently documentation/static data versus executable runtime, or how future governed projects are registered without moving their application source.

Without an S2 foundation, S3+ work risks creating incompatible paths, conflating project registration with project migration/onboarding, or accidentally treating placeholder directories as implemented runtime subsystems.

## Motivation

S3 introduces typed Task Contracts. Before S3 can safely add schemas and contract records, the repository needs a stable foundation that answers:

- where DevOS core artifacts belong;
- where project registry metadata belongs;
- which directories are reserved for later phases;
- which roots are static foundation versus runtime implementation;
- how independent product repositories remain separate;
- how the current website remains preserved without being silently migrated;
- what source-of-truth rules apply to the repository foundation itself.

If S2 is not accepted, S3 should not proceed because it would need to invent these structural decisions implicitly.

## Proposed change

Establish a non-runtime repository foundation with four parts.

### 1. DevOS foundation manifest

Create a machine-readable static manifest under `devos/`, proposed as:

`devos/devos-manifest.json`

with a schema under:

`devos/schemas/devos-manifest.schema.json`

The manifest records, at minimum:

- Sentinel baseline/version identity;
- repository identity;
- canonical DevOS root;
- source-of-truth statement;
- reserved subsystem roots;
- owning future phase for each root;
- implementation status for each root;
- whether executable runtime is present;
- project-registry location;
- legacy/bootstrap surfaces that remain active;
- explicit prohibition on treating reserved roots as implemented subsystems.

The manifest is static metadata only. It is not a Task Engine, Policy Engine, Orchestrator, runtime loader, or enforcement mechanism.

### 2. Reserved DevOS subsystem roots

Create only the directory boundaries and ownership documentation needed so later phases do not invent competing paths.

Proposed roots:

```text
devos/
├── contracts/       # S3 ownership
├── state/           # S4 ownership
├── orchestration/   # S8 ownership
├── capabilities/    # S5 ownership
├── evidence/        # S7/S9 ownership
├── memory/          # S11 ownership
└── schemas/         # shared schemas, beginning with S2 foundation schemas
```

In S2 these directories contain documentation/README boundary declarations and, where needed, static schemas only.

They MUST NOT contain executable implementations of the later phases.

A reserved directory means "this is the canonical future home," not "this subsystem exists."

### 3. Project registry foundation

Create:

`projects/README.md`

`projects/registry.json`

`devos/schemas/project-registry.schema.json`

The S2 registry is intentionally empty at activation:

```json
{
  "schema_version": "1",
  "projects": []
}
```

S2 establishes the registry shape and location only.

It does not onboard the current website, PUSAKAL, ClinicFlow, or any other product.

A future project appears in the registry only through the active `PROJECT_ONBOARDING` process and explicit Paulo authorization.

The registry schema should support future entries containing at least:

- stable `project_id`;
- repository locator;
- human owner;
- status;
- overlay location/mode;
- onboarding decision reference;
- onboarding ADR/reference where applicable.

No actual project entry is authorized in S2.

### 4. Foundation validation

S2 may add zero-dependency static validation for the two S2 JSON artifacts:

- `devos/devos-manifest.json`;
- `projects/registry.json`.

Validation may prove syntax/shape/reference invariants only.

It must not become runtime policy enforcement and must not validate or imply project onboarding that has not occurred.

## Scope

This RFC affects only the Sentinel core repository:

`Dillaab-source/maisog-labs`

Authorized S2 implementation, if later approved, may create or modify only repository-foundation/static-governance paths needed for the S2 foundation, plus coordination/handoff records.

Expected implementation paths:

```text
devos/devos-manifest.json
devos/contracts/
devos/state/
devos/orchestration/
devos/capabilities/
devos/evidence/
devos/memory/
devos/schemas/
projects/README.md
projects/registry.json
devos/handoffs/
coordination/
brain/DECISION_LOG.md
```

Existing S0/S1 governance documents may receive reference/status updates only where required to truthfully describe S2 after implementation. Their constitutional meaning is not changed by this RFC.

## Non-goals

S2 does NOT:

- implement Task Contracts;
- implement Task Engine/state-machine behavior;
- implement Policy Engine;
- implement Capability Gateway;
- implement Orchestrator;
- implement Evidence Gate;
- implement QA/CI;
- implement GitHub Actions or rulesets;
- implement worktrees/sandboxes;
- implement memory stores;
- implement runtime release/deployment verification;
- onboard any project;
- create any product `.devos/` overlay;
- migrate the website;
- move/delete/rewrite website application/runtime files;
- resolve `SENTINEL-MIGRATION-DEBT-001`;
- deploy anything;
- merge to protected/main;
- authorize S3 or any later phase.

## Affected components

Proposed new/static foundation areas:

- `devos/devos-manifest.json`;
- `devos/contracts/`;
- `devos/state/`;
- `devos/orchestration/`;
- `devos/capabilities/`;
- `devos/evidence/`;
- `devos/memory/`;
- `devos/schemas/`;
- `projects/`.

Governance/provenance records affected by implementation:

- `brain/DECISION_LOG.md`;
- `coordination/STATE.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- S2 handoff/ADR after implementation and review.

No application/runtime/deployment path is part of S2.

## Affected rules

This RFC does not propose weakening or superseding any active core rule.

It relies especially on:

- `CORE-001` — no invented authority;
- `CORE-002` — Capability != Authority;
- `CORE-006` — evidence claims require cited provenance;
- `CORE-009` — project overlays cannot silently weaken core rules;
- `CORE-011` — repository source of truth / explicit governance changes;
- `CORE-015` — projects may remain independent repositories;
- `CORE-016` / `CORE-017` / `CORE-018` — stage-specific MAIN/DEPLOYED/VERIFIED distinctions.

No rule text or authority level changes are proposed.

## Alternatives considered

### Alternative A — Let each later phase create its own directories

Rejected. This makes repository topology emerge implicitly and risks duplicate or conflicting homes for state, evidence, capabilities, and schemas.

### Alternative B — Build the full runtime skeleton now

Rejected. S2 is repository foundation, not runtime implementation. Adding executable Task/Policy/Capability/Evidence engines would skip the separately gated phases that own those subsystems.

### Alternative C — Onboard the current website in S2

Rejected. Project onboarding is independently governed and would conflate repository foundation with product migration/onboarding. S2 should establish the registry while leaving it empty.

### Alternative D — Move website source into `projects/maisoglabs-website/`

Rejected. This directly violates the non-destructive monorepo repurpose invariant and would silently perform migration work outside S2's purpose.

### Alternative E — Store the project registry under `devos/projects/`

Not preferred. The frozen topology already identifies top-level `projects/` as registry/metadata/overlay material while `devos/` is Sentinel core. Keeping the registry at top level preserves that separation and avoids implying product source belongs inside the DevOS core.

## Risks

### R-S2-001 — Reserved directories mistaken for implemented subsystems

Risk: future readers/agents may infer that a directory's existence means the subsystem exists.

Mitigation:
- manifest carries explicit status;
- each reserved root README states its owning future phase and `NOT IMPLEMENTED`;
- no executable subsystem code in S2.

### R-S2-002 — Empty registry mistaken for project onboarding

Risk: creating `projects/` may be read as website/project migration.

Mitigation:
- registry starts empty;
- README states no project is onboarded;
- no `.devos/` overlay is created;
- onboarding requires the active PROJECT_ONBOARDING path.

### R-S2-003 — Website/runtime disturbance

Risk: repository restructuring could break the existing website.

Mitigation:
- no move/delete/rename/rewrite of application/runtime/build/deploy paths;
- implementation diff must prove those paths are untouched.

### R-S2-004 — Premature S3+ implementation

Risk: foundation scaffolding becomes a backdoor for Task Contracts/state/evidence/runtime behavior.

Mitigation:
- S2 acceptance forbids executable later-phase logic;
- schemas limited to foundation manifest/project registry;
- later subsystem roots contain only boundary documentation in S2.

### R-S2-005 — Source-of-truth ambiguity

Risk: new manifest/registry compete with S0/S1 architecture/governance as constitutional authority.

Mitigation:
- manifest is descriptive foundation metadata subordinate to frozen architecture and active Governance Kernel;
- it cannot redefine authority/rules;
- constitutional changes still require their own class/path.

## Migration impact

None to product/application source.

S2 introduces new static repository-foundation artifacts only.

The current website remains in its existing root-level paths.

`brain/` and `coordination/` remain active bootstrap/legacy governance surfaces until a separately authorized migration/retirement decision.

No `.devos/` overlay is created.

## Security / trust impact

No trust boundary is changed.

S2 does not grant any tool, credential, role, write permission, secret access, deployment authority, merge authority, or project authority.

The manifest and registry are descriptive static records.

`Capability != Authority` remains unchanged.

## Evidence requirements

For S2 implementation claims:

### Required for repository-foundation structure

`INDEPENDENTLY_INSPECTED`

Architect must inspect the exact implementation diff and verify only authorized foundation/static-governance paths changed.

### Required for static validator behavior, if validators are added

Builder execution is `ACTOR_REPORTED`.

For a claim that validators behave as intended, at least one of:

- `INDEPENDENTLY_REPRODUCED`, or
- future `CI_ATTESTED`

would be stronger evidence, but S2 may close on independent code/schema inspection if the stage gate explicitly limits the claim to static implementation/schema consistency rather than independently executed behavior.

### Explicitly not applicable

`RUNTIME_OBSERVED` is not required because S2 has no deployed runtime.

## Rollout

If Paulo later approves implementation after Architect Sync:

1. Builder works only on an isolated S2 branch/worktree if available procedurally; no S6 isolation subsystem is implied.
2. Add manifest/schema and project registry/schema.
3. Add reserved roots with boundary READMEs only.
4. Add static validators only if they remain S2 foundation validation.
5. Update S2 handoff/coordination records.
6. Architect independently reviews the exact diff.
7. If accepted, create the S2 ADR.
8. Apply any explicitly authorized version transition only at closure.

No project onboarding or application migration occurs during rollout.

## Rollback

S2 is designed to be reversible because it adds only static foundation artifacts.

Rollback consists of removing the S2-created manifest, registry, schemas, reserved-root README artifacts, and related S2 documentation/provenance records, provided rollback itself follows the active governance process.

No product data migration is required because S2 moves no product source and creates no active project entry.

## Compatibility

Compatible with:

- `ML-DEVOS-ARCH-001` frozen S0 architecture;
- `ML-DEVOS-SIP-001` S2 intended outcome;
- `REPOSITORY_OVERLAY_TOPOLOGY.md`;
- active Governance Kernel v1.3.0;
- cross-repository project model;
- non-destructive monorepo repurpose invariant;
- `Capability != Authority`;
- `MAIN != DEPLOYED != VERIFIED`.

Not compatible with any interpretation that S2 itself may:

- migrate the website;
- onboard projects;
- implement later runtime subsystems;
- grant deployment/main-merge authority.

## Acceptance criteria

S2 may be considered technically complete only if all of the following are true:

1. a static DevOS foundation manifest exists and validates against its declared schema;
2. reserved subsystem roots exist with explicit future-phase ownership and `NOT IMPLEMENTED` boundaries;
3. project registry exists and is empty;
4. project registry validates against its declared schema;
5. no `.devos/` product overlay exists as a result of S2;
6. no project is marked onboarded/active by S2;
7. no website/application/runtime/build/deployment file is moved, deleted, renamed, or behaviorally modified;
8. no executable Task/Policy/Capability/Orchestrator/Evidence/CI subsystem is introduced;
9. `brain/` and `coordination/` remain live unless separately authorized;
10. implementation diff is independently inspected;
11. S2 ADR is written only after implementation and Architect approval;
12. S3 remains unauthorized at S2 closure unless separately approved.

## Version impact

Proposed: `MINOR`

If S2 is implemented and accepted, the DevOS repository foundation is a new backwards-compatible Sentinel capability. Under the active version policy, the proposed closure transition is:

`v1.3.0 → v1.4.0`

This is a proposal only. No version change occurs by filing or reviewing this RFC.

## Architect Sync requirement

Required.

`ARCHITECTURE` class changes require Architect Sync.

## Paulo decision requirement

Required.

This RFC does not authorize its own implementation. After Architect Sync, Paulo must explicitly authorize S2 implementation before Builder work begins.
