# devos/schemas/ — S2 Foundation (active)

`STATUS: FOUNDATION_ACTIVE` — this root is different from the other reserved subsystem roots: it is owned and actively populated by **S2 — DevOS Repository Foundation** itself, not reserved for a later phase.

Canonical owning phase: **S2 — DevOS Repository Foundation**

Known consuming phase(s): every later phase (`S3`–`S14`) that needs a static JSON Schema for its own artifacts may add its own schema file here, without redefining this root's ownership or the S2 foundation schemas already present.

## Current contents

- `devos-manifest.schema.json` — JSON Schema for `../devos-manifest.json`.
- `project-registry.schema.json` — JSON Schema for `../../projects/registry.json`.
- `validate-devos-manifest.mjs` — deterministic, zero-dependency static validator for the manifest.
- `validate-project-registry.mjs` — deterministic, zero-dependency static validator for the project registry, including the S2-scope closure invariant that the registry remains empty.

No executable runtime, Policy Engine, or enforcement mechanism lives here — both `.mjs` files are static structural/semantic lint tools, run manually, not wired into CI or any git hook (none exists in this repository).

## Adding a schema for a later phase

A later phase's own RFC may add its own `*.schema.json` (and, if useful, its own zero-dependency validator) here once that phase is separately proposed, reviewed, and authorized. Doing so does not require re-litigating this root's ownership — `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for `devos/schemas/` already names every phase through `S14` as an allowed future consumer, per `ML-DEVOS-RFC-001`.
