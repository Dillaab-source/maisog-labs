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

## Current state

`projects/registry.json` is **currently empty** (`"projects": []`). No project — not the existing MaisogLabs website, not PUSAKAL, not ClinicFlow, not any other product — is currently onboarded or registered. This emptiness is the **standing pre-onboarding invariant**: it holds until a separately authorized `PROJECT_ONBOARDING` decision permits population, independent of any phase's closure. S2 (`ML-DEVOS-RFC-001`'s acceptance criteria) established/reaffirmed this invariant at its own closure, but S2 closure is not the current-time qualifier for it — the invariant remains standing today for the same reason it held at S2 closure, not because S2 has not yet closed. Creating this directory and its empty registry was repository-foundation work, not project onboarding or migration.

`devos/schemas/validate-project-registry.mjs` mechanically enforces this emptiness as a standing pre-onboarding invariant, on top of the schema's own structural checks — see that script's header comment for exactly what it proves and does not prove.

## Adding a project (future)

Once `PROJECT_ONBOARDING_SPEC.md`'s process completes and Paulo explicitly authorizes an onboarding decision, a project entry may be added with at minimum: a globally unique `project_id`, a repository locator, a human owner, `status`, an `overlay` (location + mode), and a non-empty `onboarding_decision_id` once `status` is `ACTIVE`. This is future work — no such entry currently exists or is currently authorized.
