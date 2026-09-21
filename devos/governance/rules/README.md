# Sentinel Rule Registry

Static, machine-readable rule records live here as **JSON** files. Schema: `../registry/RULE_RECORD_SCHEMA.md` (human-readable, including the S1-F001 class-minimum authority/risk invariant table) and `../registry/rule-record.schema.json` (JSON Schema).

**S1-F004 correction:** the canonical format is JSON, not YAML, specifically so `JSON.parse` — a native, deterministic, fail-closed parser — can validate syntax with zero custom code. A prior YAML version of this registry existed in an earlier S1 cycle and required a hand-rolled parser; it has been replaced entirely.

## Files

- `core-rules.json` — the constitutional/core rules extracted from the frozen S0 architecture (`../../architecture/ML-DEVOS-ARCH-001.md`), plus a small number of rules genuinely introduced during S1 remediation (see the file's own header comment for exactly which, and why their `status`/version fields differ). Extraction is faithful — no rule here changes S0's meaning; where S1-F001 required an authority/risk correction, it was always corrected upward (stricter), never weakened.

## Adding a project-scoped rule file

Once a project is onboarded (`../specifications/PROJECT_ONBOARDING_SPEC.md`), its `LOCAL_RULE`-class rules belong in a new file here named `<project>-rules.json`, using the same schema, with `scope: "project"` and `project: "<project-id>"` set. A project rule file may never redefine a `rule_id` already used in `core-rules.json`, and per `CORE-009` may not shrink the applicability of, or otherwise weaken, any core rule it references — it may only narrow the *project's own* permitted actions or add stricter local requirements.

## Validation

Run `node ../registry/validate-rules.mjs` (from any working directory — the script resolves paths relative to itself) to structurally and semantically validate every `*.json` file in this directory: JSON syntax, required fields, enum validity, no duplicate IDs, resolvable `supersedes` references, class-minimum authority/risk compliance (S1-F001), and status/version-field consistency (S1-F007). This is static governance-data linting only — it does not enforce anything at runtime and is not wired into CI (none exists) or a git hook. See the script's own header comment, or `../registry/RULE_RECORD_SCHEMA.md`, for exactly what it does and does not prove.

Waiver *instances* (not rule records) are validated separately — see `../../changes/waivers/README.md`.
