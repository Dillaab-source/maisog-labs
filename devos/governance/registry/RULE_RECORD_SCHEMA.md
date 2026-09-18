# Sentinel Rule Record Schema

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel, remediation cycle 1). Human-readable specification for the machine-readable schema at `./rule-record.schema.json`. Companion to `../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1 and `ML-DEVOS-AS-003` "Rule and policy representation."

**S1-F004 correction:** the canonical, machine-readable rule registry is now **JSON** (`../rules/core-rules.json`), not YAML. The prior YAML representation required a hand-rolled, incomplete parser to validate; JSON has a native, deterministic, fail-closed parser (`JSON.parse`) built into every JavaScript runtime, eliminating the need for any custom parsing code. This document, and the schema it describes, remain human-readable references — nothing here implements a Policy Engine or runtime enforcement.

## Fields

| Field | Type | Required | Meaning |
|---|---|---|---|
| `rule_id` | string | Yes | Stable, unique identifier. Convention: `CORE-NNN` for constitutional/core rules extracted from S0; `<PROJECT>-NNN` for project-scoped rules once a project overlay exists. Never reused, even if a rule is superseded. |
| `title` | string | Yes | Short human-readable name. |
| `description` | string | Yes | Full statement of the rule, precise enough that a violation is checkable in principle. |
| `class` | enum | Yes | One of the eight change classes in `CHANGE_GOVERNANCE_POLICY.md` §1: `PATCH`, `LOCAL_RULE`, `CORE_POLICY`, `CAPABILITY`, `ARCHITECTURE`, `CONSTITUTIONAL`, `WAIVER`, `PROJECT_ONBOARDING`. A rule's class determines what it takes to change the rule itself, not what the rule regulates. |
| `scope` | enum | Yes | `sentinel-wide` or `project`. |
| `project` | string \| null | Yes (null if `sentinel-wide`) | Which project the rule applies to, if scoped. |
| `risk` | enum | Yes | `low`, `medium`, `high`, `highest`. **Must meet or exceed the class minimum below (S1-F001) — never below.** |
| `status` | enum | Yes | `ACTIVE`, `SUPERSEDED`, `WAIVED`, `PROPOSED`, `REJECTED`. See "Status/version consistency" below (S1-F007). |
| `authority.owner` | string | Yes | Who owns changes to this rule — usually `Paulo`, sometimes a named project owner for `LOCAL_RULE`. |
| `authority.architect_sync_required` | boolean | Yes | Whether changing this rule requires an Architect Sync. **Must be `true` if the class minimum requires it (S1-F001).** |
| `authority.paulo_approval_required` | boolean | Yes | Whether changing this rule requires explicit Paulo approval. **Must be `true` if the class minimum requires it (S1-F001).** |
| `applies_when` | string | Yes | Plain-language condition describing when the rule is in effect. |
| `waivable` | boolean | **Yes** | Whether this rule may ever be the target of a `WAIVER` record. **New in remediation cycle 1 (S1-F003).** If `true`, any waiver against it requires authority at least equal to this rule's own `authority` fields — a waiver can never grant itself more authority than the rule it targets required to establish. Several foundational constitutional rules are `waivable: false` — see `../rules/core-rules.json`'s per-rule rationale. |
| `requires.evidence` | object `{ all_of: [...], any_of: [...] }` | No | The **minimum** evidence combination always required for `applies_when`, with explicit AND/OR semantics (**S1-F002, remediation cycle 2**). `all_of` lists evidence classes that are ALL independently required; `any_of` lists evidence classes where AT LEAST ONE satisfies the requirement (empty means no OR-set is imposed). A flat array could not distinguish "both required" from "either satisfies" — e.g. `CORE-016`'s MAIN-eligibility claim is satisfiable by reproduced tests *or* CI (`any_of`), while `CORE-018`'s VERIFIED claim strictly requires `RUNTIME_OBSERVED` (`all_of`). Never a claim that this is the complete, universal evidence requirement for every claim under this rule — see `requires.evidence_note` and `EVIDENCE_PROVENANCE_MODEL.md`. |
| `requires.evidence_note` | string | No | **New in remediation cycle 1 (S1-F002).** Free-text clarification of when stronger or different evidence applies beyond the baseline `evidence` array. Exists because a flat evidence array cannot express "documentation claims need X, executable claims need Y" — full claim-specific binding is a Task Contract (S1-F002/S3) concern; this field records the intent honestly in the meantime. |
| `requires.qa` | boolean | No | Whether independent QA execution is required. |
| `requires.independent_review` | boolean | No | Whether fresh-context Independent Review is required. |
| `requires.evidence_gate` | boolean | No | Whether a (future) Evidence Gate check is required — recorded as intent; no gate exists yet. |
| `exceptions` | array of strings | No | Built-in exceptions the rule itself always had. **Distinct from a `WAIVER` record** (S1-F003 clarification) — a waiver is a time-boxed departure filed as its own record under `../../changes/waivers/`, validated by `validate-waivers.mjs`, never by this file's fields. |
| `introduced_by` | string | Yes | The decision or sync that introduced this rule (e.g. `D-010`, `AS0-002`). |
| `decision_id` | string \| null | Yes | The `brain/DECISION_LOG.md` entry that authorized this rule, if any. |
| `adr_id` | string \| null | Yes | The ADR that recorded this rule as architecture, if one exists. `null` is expected for every rule as of this cycle — the ADR system exists (`../../templates/ADR_TEMPLATE.md`) but no ADR has actually been filed yet. |
| `effective_version` | string \| null | Yes | Semantic version this rule became/becomes effective in. **`null` only when `status: PROPOSED`** (S1-F007) — non-null and required for every other status. |
| `proposed_effective_version` | string \| null | Yes | **New in remediation cycle 1 (S1-F007).** The version this rule would take effect at if/when its authorizing cycle is approved. **Required (non-null) when `status: PROPOSED`; must be `null` for every other status.** |
| `supersedes` | string \| null | Yes | `rule_id` of a prior rule this one replaces, if any. |
| `created_at` | date (`YYYY-MM-DD`) | Yes | |
| `updated_at` | date (`YYYY-MM-DD`) | Yes | |

## Class-level minimum authority/risk invariants (S1-F001)

A rule record's `risk` and `authority` fields must meet or exceed its `class`'s floor below. **A record may be stricter than its class floor; it may never be weaker.** This table is enforced by `./validate-rules.mjs`, which is the authoritative check — this table is its human-readable mirror.

| Class | Minimum risk | `architect_sync_required` floor | `paulo_approval_required` floor |
|---|---|---|---|
| `PATCH` | `low` | `false` | `false` |
| `LOCAL_RULE` | `low` | `false` | `false` |
| `CORE_POLICY` | `medium` | `true` | `true` |
| `CAPABILITY` | `medium` | `false` | `true` |
| `ARCHITECTURE` | `high` | `true` | `true` |
| `CONSTITUTIONAL` | `highest` | `true` | `true` |
| `WAIVER` | `low` | `false` | `true` |
| `PROJECT_ONBOARDING` | `medium` | `true` | `true` |

These floors derive directly from `../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1's authority/risk columns. The remediation in this cycle found five rules recorded below their class's floor (`CORE-005`, `CORE-006`, `CORE-013`, `CORE-014`, `CORE-015`) and corrected each upward to at least the floor — never downward, and never by relaxing the policy table itself.

## Status/version consistency (S1-F007)

- `status: PROPOSED` ⟹ `effective_version: null` **and** `proposed_effective_version` is a non-null semver string.
- `status: ACTIVE` / `SUPERSEDED` / `WAIVED` / `REJECTED` ⟹ `effective_version` is a non-null semver string **and** `proposed_effective_version: null`.

This distinguishes rules already effective under the frozen S0 baseline (`1.2.0`) from rules genuinely introduced during S1 (`D-012`/`ML-DEVOS-AS-003`), which remain `PROPOSED` with a `proposed_effective_version` of `1.3.0` until S1 itself is Architect-approved and Paulo explicitly applies that version (`../specifications/VERSIONING_POLICY.md`). Conflating the two — as the prior candidate did for `CORE-008`/`CORE-009` — would misrepresent unapproved governance as already-effective S0 architecture.

## Non-goals of this schema

- It does not define how a rule is *checked* — that is a Policy Engine's job (S5+, not authorized).
- It does not define storage/versioning infrastructure for the registry itself beyond plain Git history — that is a Governance Bundle's job (`../bundles/GOVERNANCE_BUNDLE_SPEC.md`), also not implemented at runtime in S1.
- It is not itself a Task Contract (`ML-DEVOS-SIP-001` S3) — a Task Contract decides what evidence a specific *task* needs; a rule record documents what a *standing rule* requires in general, at a baseline level (`requires.evidence`/`requires.evidence_note`).

## Validation

`./validate-rules.mjs` (Node, zero dependencies, run manually — not wired into any CI or git hook) parses every `*.json` file in `../rules/` with native `JSON.parse` and checks the full shape this document declares: a valid top-level `rules` array (a missing/non-array `rules` is a hard failure, not a silent empty-list pass); every field required by `rule-record.schema.json` present and **correctly typed/formatted** — `rule_id`'s regex, non-empty-string minimums, `authority`/`requires`/`requires.evidence`'s nested object shapes, `additionalProperties: false` at every object level, `created_at`/`updated_at`'s date format, `effective_version`/`proposed_effective_version`'s semver format; `class`/`scope`/`risk`/`status`/evidence-class enums valid; `scope`/`project` mutual consistency; no duplicate `rule_id`; every non-null `supersedes` resolves to an existing `rule_id`; every rule's authority/risk metadata meets its class's minimum; and `status`/`effective_version`/`proposed_effective_version` are mutually consistent (**S1-F004, remediation cycle 2**: the prior version of this validator claimed this level of enforcement but did not actually perform most of it — the validator was rewritten in cycle 2 so its claims and the schema's declared shape do not silently diverge). See the script's own header comment for the exact "what this proves / does not prove" list, also reproduced in this cycle's handoff.

Waiver *instances* (not rule records) are validated separately by `./validate-waivers.mjs` against `./waiver-record.schema.json` — see `../../changes/waivers/README.md`.
