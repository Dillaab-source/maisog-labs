# RFC-<NNN>: <Title>

<!--
Numbering convention: ML-DEVOS-RFC-001, ML-DEVOS-RFC-002, ... — sequential,
never reused, assigned when an RFC is actually filed under devos/changes/rfcs/.
No RFC has been filed as of S1; this template establishes the convention and
shape. See devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md §3.
-->

Status: `DRAFT` | `UNDER_ARCHITECT_SYNC` | `ACCEPTED` | `REJECTED` | `SUPERSEDED`

Proposed change class (see `../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §1): `PATCH` / `LOCAL_RULE` / `CORE_POLICY` / `CAPABILITY` / `ARCHITECTURE` / `CONSTITUTIONAL` / `WAIVER` / `PROJECT_ONBOARDING`

## Problem

What problem does this solve? Be specific — not "improve governance," but the concrete gap or friction observed.

## Motivation

Why does this matter now? What happens if this RFC is not accepted?

## Proposed change

Exactly what is being proposed. Precise enough that an Architect Sync can assess compatibility without guessing.

## Scope

What this RFC does and does not cover. Which projects/repositories are affected.

## Non-goals

Explicitly out of scope, so reviewers don't assume more was proposed than actually was.

## Affected components

Which files, subsystems, or repositories this touches.

## Affected rules

Which `rule_id`s (`../governance/rules/*.json`) this RFC would add, modify, or supersede. State explicitly whether any `CONSTITUTIONAL`/`CORE_POLICY` rule is touched, and if so, confirm this RFC is proceeding through **that rule's own change class and authority level** (e.g. a `CONSTITUTIONAL` rule needs the full RFC + Architect Sync + explicit Paulo approval path). **S1-F005 correction:** a fully authorized RFC at the correct authority level *may* propose an actual weakening or substantive change to a core/constitutional rule — Sentinel is intentionally evolvable (`CORE-011`), and freezing does not mean immutable. What is forbidden is reaching that outcome through a *lower*-authority path (a `LOCAL_RULE`, `PATCH`, or project overlay never weakens a `CONSTITUTIONAL`/`CORE_POLICY` rule — `CORE-009`) — not proposing it at all through the rule's own legitimate route.

## Alternatives considered

What else was considered, and why this approach over those.

## Risks

What could go wrong if this is accepted, and how severe.

## Migration impact

What existing state (data, rules, projects) needs to change if this is accepted.

## Security / trust impact

Does this change any trust boundary (`../governance/TRUST_BOUNDARIES.md`)? Does it touch `Capability != Authority`?

## Evidence requirements

What evidence class(es) (`../governance/EVIDENCE_PROVENANCE_MODEL.md`) will be required to confirm this RFC was correctly implemented.

## Rollout

How this change would be introduced.

## Rollback

How this change would be undone if it needs to be reversed.

## Compatibility

What this RFC is and is not compatible with in the current frozen architecture.

## Version impact

Per `../governance/specifications/VERSIONING_POLICY.md`: `PATCH` / `MINOR` / `MAJOR`, and why.

## Architect Sync requirement

Is an Architect Sync required before this can be authorized? (Per the change class table, `CORE_POLICY` and above always require one.)

## Paulo decision requirement

Is explicit Paulo approval required? (Per the change class table, `CORE_POLICY` and above always require one; `CONSTITUTIONAL` requires it named explicitly.)
