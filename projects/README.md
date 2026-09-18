# Projects — Registry Index

Introduced in **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`).

`projects/registry.json`, conforming to `../devos/schemas/project-registry.schema.json`, is an **index of governed-project registrations** — nothing more.

## What this is

A pointer table: which projects are registered under Sentinel, where their repository/overlay lives, who owns them, and what onboarding decision authorized them.

## What this is NOT

- **Not** authoritative project memory, task state, run history, or evidence — those remain in the project's own repository / `.devos/` overlay.
- **Not** project requirements, risks, or capability state — same as above.
- **Not** local project governance — a project's own overlay carries its own `LOCAL_RULE`-class rules, per `CORE-009` (project overlays may narrow the project's own actions, never shrink a Sentinel-wide rule's reach).
- **Not** a signal that any project's application source has moved into this monorepo. Per `CORE-015`, a governed project may remain a fully independent repository with its own `.devos/` overlay.
- **Not** itself an onboarding mechanism. Registering a project here happens only *after* the active `PROJECT_ONBOARDING` process (`devos/governance/specifications/PROJECT_ONBOARDING_SPEC.md`) and explicit Paulo authorization — never by editing this file directly.

## Current state — S2

`projects/registry.json` is **empty** (`"projects": []`) and **must remain empty through S2 closure**, per `ML-DEVOS-RFC-001`'s acceptance criteria. No project — not the existing MaisogLabs website, not PUSAKAL, not ClinicFlow, not any other product — is onboarded, registered, or implied to be registered by S2's existence. Creating this directory and its empty registry is repository-foundation work, not project onboarding or migration.

`devos/schemas/validate-project-registry.mjs` mechanically enforces this emptiness as an S2-scope closure invariant, on top of the schema's own structural checks — see that script's header comment for exactly what it proves and does not prove.

## Adding a project (future, not S2)

Once `PROJECT_ONBOARDING_SPEC.md`'s process completes and Paulo explicitly authorizes an onboarding decision, a project entry may be added with at minimum: a globally unique `project_id`, a repository locator, a human owner, `status`, an `overlay` (location + mode), and a non-empty `onboarding_decision_id` once `status` is `ACTIVE`. This is future work — no such entry exists or is authorized as of S2.
