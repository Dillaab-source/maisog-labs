# Sentinel Rule Registry

Static, machine-readable rule records live here as YAML files. Schema: `../registry/RULE_RECORD_SCHEMA.md` (human-readable) and `../registry/rule-record.schema.json` (JSON Schema).

## Files

- `core-rules.yaml` — the constitutional/core rules extracted from the frozen S0 architecture (`../../architecture/ML-DEVOS-ARCH-001.md`). Extraction only — no rule here changes S0's meaning.

## Adding a project-scoped rule file

Once a project is onboarded (`../specifications/PROJECT_ONBOARDING_SPEC.md`), its `LOCAL_RULE`-class rules belong in a new file here named `<project>-rules.yaml`, using the same schema, with `scope: project` and `project: <project-id>` set. A project rule file may never redefine a `rule_id` already used in `core-rules.yaml`, and per `CORE-009` may not weaken any core rule it references.

## Validation

Run `node ../registry/validate-rules.mjs` from the repository root (or any working directory — the script resolves paths relative to itself) to structurally validate every `*.yaml` file in this directory. This is static governance-data linting only — it does not enforce anything at runtime and is not wired into CI (none exists) or a git hook.
