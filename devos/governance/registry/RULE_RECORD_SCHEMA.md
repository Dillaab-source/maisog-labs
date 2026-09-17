# Sentinel Rule Record Schema

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel). Human-readable specification for the machine-readable schema at `./rule-record.schema.json`. Companion to `../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1 and `ML-DEVOS-AS-003` "Rule and policy representation."

This schema defines the shape of one rule record. It does **not** implement a Policy Engine — nothing reads this schema at runtime to enforce anything. It exists so that rules are recorded consistently now, and so a future, separately authorized Policy Engine (S5+) has a stable format to consume rather than needing to reinterpret prose.

## Fields

| Field | Type | Required | Meaning |
|---|---|---|---|
| `rule_id` | string | Yes | Stable, unique identifier. Convention: `CORE-NNN` for constitutional/core rules extracted from S0; `<PROJECT>-NNN` for project-scoped rules once a project overlay exists. Never reused, even if a rule is superseded. |
| `title` | string | Yes | Short human-readable name. |
| `description` | string | Yes | Full statement of the rule, precise enough that a violation is checkable in principle. |
| `class` | enum | Yes | One of the eight change classes in `CHANGE_GOVERNANCE_POLICY.md` §1: `PATCH`, `LOCAL_RULE`, `CORE_POLICY`, `CAPABILITY`, `ARCHITECTURE`, `CONSTITUTIONAL`, `WAIVER`, `PROJECT_ONBOARDING`. A rule's class determines what it takes to change the rule itself, not what the rule regulates. |
| `scope` | enum | Yes | `sentinel-wide` or `project`. |
| `project` | string \| null | Yes (null if `sentinel-wide`) | Which project the rule applies to, if scoped. |
| `risk` | enum | Yes | `low`, `medium`, `high`, `highest`. |
| `status` | enum | Yes | `ACTIVE`, `SUPERSEDED`, `WAIVED`, `PROPOSED`, `REJECTED`. |
| `authority.owner` | string | Yes | Who owns changes to this rule — usually `Paulo`, sometimes a named project owner for `LOCAL_RULE`. |
| `authority.architect_sync_required` | boolean | Yes | Whether changing this rule requires an Architect Sync. |
| `authority.paulo_approval_required` | boolean | Yes | Whether changing this rule requires explicit Paulo approval. |
| `applies_when` | string | Yes | Plain-language condition describing when the rule is in effect (e.g. "whenever an actor proposes a protected-branch merge"). |
| `requires.evidence` | array of evidence classes | No | Which `EVIDENCE_PROVENANCE_MODEL.md` classes are required to demonstrate compliance, if applicable. |
| `requires.qa` | boolean | No | Whether independent QA execution is required. |
| `requires.independent_review` | boolean | No | Whether fresh-context Independent Review is required. |
| `requires.evidence_gate` | boolean | No | Whether a (future) Evidence Gate check is required — recorded as intent; no gate exists yet. |
| `exceptions` | array of strings | No | Known, currently-accepted exceptions or explicitly out-of-scope cases. Distinct from a `WAIVER` record — this field documents built-in exceptions the rule itself always had, not a time-boxed departure from it. |
| `introduced_by` | string | Yes | The decision or sync that introduced this rule (e.g. `D-010`, `AS0-002`). |
| `decision_id` | string \| null | Yes | The `brain/DECISION_LOG.md` entry that authorized this rule, if any. |
| `adr_id` | string \| null | Yes | The ADR that recorded this rule as architecture, if one exists. `null` is expected and correct for every S0-era constitutional rule, since the ADR system did not exist before S1 — see the S1 handoff's honesty note on this. |
| `effective_version` | string | Yes | Semantic version of the Sentinel architecture generation this rule became effective in (see `../specifications/VERSIONING_POLICY.md`). |
| `supersedes` | string \| null | Yes | `rule_id` of a prior rule this one replaces, if any. |
| `created_at` | date (`YYYY-MM-DD`) | Yes | |
| `updated_at` | date (`YYYY-MM-DD`) | Yes | |

## Non-goals of this schema

- It does not define how a rule is *checked* — that is a Policy Engine's job (S5+, not authorized).
- It does not define storage/versioning infrastructure for the registry itself beyond plain Git history — that is a Governance Bundle's job (`../bundles/GOVERNANCE_BUNDLE_SPEC.md`), also not implemented at runtime in S1.
- It is not itself a Task Contract (`ML-DEVOS-SIP-001` S3) — a Task Contract decides what evidence a specific *task* needs; a rule record documents what a *standing rule* requires in general.

## Validation

A static structural validator exists at `./validate-rules.mjs` (Node, zero dependencies, run manually — not wired into any CI or git hook, since none is authorized in S1). It checks: valid YAML, all required fields present, `class`/`scope`/`risk`/`status` values are from the allowed enums, no duplicate `rule_id`, every non-null `supersedes` value actually points at an existing `rule_id` in the same registry, and every `WAIVER`-class-referencing exception carries an expiry (per `../../templates/WAIVER_TEMPLATE.md`). This is static governance-data validation only — it makes no runtime decisions and blocks nothing outside a manual `node` invocation.
