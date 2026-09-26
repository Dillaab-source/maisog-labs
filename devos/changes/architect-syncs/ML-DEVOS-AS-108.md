# Architect Review — Canonical Directive / Agent Transport Protocol Planning

Architect Sync: ML-DEVOS-AS-108
Status: ARCHITECT_APPROVED — RFC-020 CONTEXT BOOTSTRAP V2 PROPOSAL READY FOR PAULO STAGE-A IMPLEMENTATION DECISION
Review mode: D-078 ARCHITECTURE / GOVERNANCE PROTOCOL PLANNING
Cycle: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_PLANNING
Authority: D-078
Reviewed repository tip: 1ea92e3798dfa2401dfcf95077f4d1fe896bccc8
Proposal: devos/changes/rfcs/ML-DEVOS-RFC-020.md
Implementation authority: NOT GRANTED
Protocol activation: NOT AUTHORIZED
Live protocol remains: PROTOCOL_VERSION 1

## Verdict

`ARCHITECT_APPROVED — RFC-020 CONTEXT BOOTSTRAP V2 PROPOSAL READY FOR PAULO STAGE-A IMPLEMENTATION DECISION`

The D-078 planning objective is complete.

The Architect recommends a repository-native:

`coordination/CURRENT_DIRECTIVE.md`

for exact Owner/Architect-to-Builder execution transport while preserving:

`coordination/CURRENT_HANDOFF.md`

for Builder-to-Architect evidence/reporting.

## Core architecture

The accepted model is:

`AUTHORITY -> STATE / DECISIONS / ARCHITECT SYNCS`

`DIRECTIVE -> OWNER/ARCHITECT-TO-BUILDER CONTEXT`

`HANDOFF -> BUILDER-TO-ARCHITECT EVIDENCE`

`CAPABILITY != AUTHORITY`

A directive may reference authority but never create or expand it.

## Protocol version finding

The Architect recommends:

`PROTOCOL_VERSION: 2`

at activation.

Keeping Version 1 while making CURRENT_DIRECTIVE mandatory would leave a stale V1 session with no mechanical reason to stop before ignoring the new selector.

The version bump therefore closes a real stale-session compatibility gap.

The live repository remains Version 1 until a separately authorized Stage B activation.

## V2 selector design

V2 STATE adds:

- CURRENT_DIRECTIVE
- DIRECTIVE_ID
- DIRECTIVE_ISSUE_PARENT
- DIRECTIVE_AUTHORITY_REF
- DIRECTIVE_APPLICABLE_REVIEW_ID

An ACTIVE directive is legal only on a Builder turn with implementation action required.

Architect and Paulo turns require no active directive.

Normal V2 operation never selects CURRENT_DIRECTIVE and CURRENT_HANDOFF simultaneously.

## Directive binding

CURRENT_DIRECTIVE uses an immutable YAML header containing:

- schema version;
- directive ID;
- cycle ID;
- issue-parent commit;
- target turn;
- primary authority reference;
- applicable review ID;
- SENTINEL disposition;
- SU mode;
- SU disposition.

STATE/header mismatch fails closed.

The issue-parent value is bound to the parent of the commit that first publishes the directive bytes, avoiding self-reference while preventing stale issuance.

## SENTINEL requirement

Every governed Builder directive is preceded by a fresh SENTINEL sync.

The receiving Architect also performs a fresh independent SENTINEL sync on every Builder handoff before acceptance/remediation.

The Builder's own mechanical pre-handoff checks remain actor-reported and do not become independent Architect verification.

## SU requirement

Every governed execution cycle includes SU contradiction/falsification before an ACTIVE directive is issued.

Default:

`BOUNDED_CONTRADICTION`

Escalate to:

`ESCALATED_RESEARCH`

for architecture/protocol/schema changes, security/capability widening, high-consequence external action, destructive action, unresolved evidence/authority conflict, material uncertainty, current-external-evidence dependence, or explicit owner request.

SU remains advisory and grants no authority.

The current D-078 architecture cycle met the escalation trigger and used external research as advisory evidence.

## SU adversarial result

The following alternatives were challenged:

### Keep Protocol Version 1

REJECT.

It creates a stale-reader ambiguity because V1 does not require directive awareness.

### Replace CURRENT_HANDOFF with one bidirectional file

REJECT.

It mixes instruction/context and evidence/reporting roles and makes provenance/lifecycle harder to reason about.

### Put the full authority text into CURRENT_DIRECTIVE

REJECT.

It duplicates authority and creates drift risk.

### Require deep web research on every turn

REJECT.

It wastes tokens and can introduce unnecessary external noise into mechanical work.

### Allow Builder turns without a directive when the Architect review is clear enough

REJECT FOR V2.

It recreates the exact chat/reconstruction ambiguity the mechanism is intended to remove.

### Rename all role tokens during the same cutover

DEFER.

Provider-neutral semantics are desirable, but changing TURN vocabulary is not required to solve directive transport and would widen migration scope unnecessarily.

## External advisory evidence

The Architect considered current public guidance showing:

- agent context is finite and benefits from small high-signal, just-in-time retrieval;
- durable artifacts improve continuity across long-running sessions;
- handoffs benefit from short concrete descriptions and structured outputs;
- incompatible interface semantics should cross a version boundary;
- exact expected-value Git leases support compare-and-swap publication;
- fixed structured fields should use positive allowlists.

These sources support the chosen direction but do not govern MaisogLabs.

## Token/context finding

At the D-078 planning tip, the files explicitly listed by current CLAUDE.md as mandatory first reads, excluding conditional CURRENT_HANDOFF, total approximately:

`85,625 bytes`

RFC-020 changes the target model to:

small bootstrap + STATE + CURRENT_DIRECTIVE + OPERATIVE_OBLIGATIONS + checker

followed by just-in-time retrieval of exact governing references.

Stage A must measure the post-change mandatory startup set before activation.

Target:

at least 50% reduction in ordinary Builder mandatory startup bytes without removing safety-critical checks.

## Implementation staging

The Architect rejects a one-step V2 cutover.

### Stage A

Implement dual-version V1/V2 support while live STATE remains:

`PROTOCOL_VERSION: 1`

Stage A may add the directive format/archive/checker/tests/docs/skills and dual-mode bootstrap guidance.

It may not activate CURRENT_DIRECTIVE.

### Review

Architect independently verifies V1 non-regression and V2 synthetic behavior.

### Stage B

Requires a separate Paulo activation decision.

One atomic activation changes:

`PROTOCOL_VERSION: 1 -> 2`

and introduces live V2 directive selector fields with:

`CURRENT_DIRECTIVE: NONE`.

Activation routes to a non-Builder gate.

The first real V2 directive happens only after activation verification.

## Rollback

Rollback is forward recovery only.

A return from V2 to V1 requires an explicit owner decision, no selected directive, preserved V2 history and a new forward commit.

Never rewind the branch.

## Exact proposed Stage-A implementation scope

A future owner authorization may permit directly necessary changes in:

- brain/protocols/CONTEXT_BOOTSTRAP.md
- brain/protocols/ARCHITECT_SYNC.md
- coordination/README.md
- coordination/CURRENT_DIRECTIVE.md scaffolding/template only
- coordination/archive/directives/**
- scripts/check-context-bootstrap.mjs
- tests/context-bootstrap.test.mjs
- directly necessary protocol/coordination tests
- canonical .agents/skills coordination sources
- deterministically regenerated .claude/skills bridges
- CLAUDE.md
- AGENTS.md
- brain/00_HOME.md
- brain/PROJECT_GOVERNANCE.md only if directly necessary
- RFC/review/coordination records required by the cycle.

No product/admin/site/runtime implementation.

No S6/S7 or D-068.

No D1/R2 or migration.

No deployment/public cutover.

No protected/main or PR #10 merge.

## V2A disposition

Spatial Design Controls V2A remains Architect-approved under ML-DEVOS-AS-107.

Its implementation decision remains deferred while the protocol change is being resolved.

RFC-020 does not modify the V2A technical plan.

## Next owner decision

Paulo must decide whether to authorize:

`RFC-020 STAGE A — DUAL-VERSION CANONICAL DIRECTIVE PROTOCOL IMPLEMENTATION`

under live Protocol Version 1.

AS-108 itself grants no implementation or activation authority.

## Routing

Route:

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: D078_RFC020_CONTEXT_BOOTSTRAP_V2_PROPOSAL_ACCEPTED_PAULO_STAGE_A_IMPLEMENTATION_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`

`CURRENT_HANDOFF: NONE`

All action-specific authorization flags remain NO.

`PROTOCOL_VERSION` remains `1`.
