# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_PLANNING
TURN: ARCHITECT
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: D078_CANONICAL_DIRECTIVE_PROTOCOL_PLANNING_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2
PROTOCOL_VERSION: 1
CURRENT_HANDOFF: NONE
HANDOFF_ID:
REVIEW_TARGET_COMMIT:
APPLICABLE_REVIEW_ID:
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: NO
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-078 is the controlling Product / Risk Owner planning authorization.

ML-DEVOS-AS-107 remains the accepted Spatial Design Controls V2 planning review.

ML-DEVOS-AS-106 remains the accepted Website Redesign V1 implementation review.

## Current objective

Perform one bounded architecture/governance planning cycle for a repository-native canonical directive transport between Owner/Architect and Builder.

The planned surface is provisionally:

`coordination/CURRENT_DIRECTIVE.md`

The planning cycle must determine its exact schema, binding, lifecycle, archival, protocol-version and checker requirements.

No directive/protocol implementation is authorized yet.

## Core invariant

A directive is context/transport, not authority.

It may reference authority.

It may not grant, widen, replace or contradict authority.

STATE, owner decisions, Architect Syncs, governing RFC/specifications and action-specific authorization flags retain their existing authority roles unless a later owner-approved protocol change explicitly modifies the model.

## Coordination model under study

Current:

- STATE -> authoritative turn/routing flags
- ARCHITECT_REVIEW -> current Architect review
- CURRENT_HANDOFF -> Builder-to-Architect evidence/report
- OPERATIVE_OBLIGATIONS -> unresolved carry-forward obligations

Proposed additional transport:

- CURRENT_DIRECTIVE -> Owner/Architect-to-Builder exact instruction packet

The planning cycle must test whether this is the smallest safe model.

## Required SENTINEL behavior

Every governed directive/handoff cycle should include a fresh SENTINEL sync appropriate to the turn.

At minimum evaluate:

- exact authoritative tip;
- current STATE and authority chain;
- current turn;
- action-specific flags;
- directive/handoff identity coherence;
- applicable obligations;
- protected boundaries;
- capability expansion;
- contradictory repository evidence;
- stale-session/protocol-version risk.

SENTINEL findings do not themselves grant authority.

## Required SU behavior

Every governed directive/handoff cycle should include an SU advisory contradiction/falsification pass.

Default mode:

`BOUNDED_CONTRADICTION`

Escalate only when predefined triggers justify deeper research/evaluation.

Candidate escalation triggers to evaluate include:

- architecture/protocol change;
- security/capability widening;
- high-consequence external action;
- unresolved authority/evidence contradiction;
- meaningful uncertainty;
- insufficient repository evidence;
- need for current external evidence.

SU never grants authority.

## Planning questions

Determine:

1. whether the protocol should remain Version 1 or cut over to a new protocol version;
2. the exact directive header/schema;
3. STATE selector fields required to identify a current directive;
4. how source/base commit and target role bind to the exact snapshot;
5. how a directive references applicable owner/review authority without becoming authority;
6. how directives are archived and indexed;
7. how duplicate IDs or changed bytes fail closed;
8. how outgoing directives are preserved;
9. how Builder completion deselects/archives a directive while publishing CURRENT_HANDOFF;
10. how Architect remediation directives are published;
11. how Paulo-originated directives are represented;
12. how the checker validates directive mechanics;
13. how stale sessions react to a protocol-version change;
14. how skills/bootstrap/read order change;
15. how generated Claude skill bridges are regenerated;
16. how rollback/fallback works;
17. how token reduction is measured;
18. how SENTINEL and SU results are represented without granting authority;
19. how unresolved contradictions force STOP rather than execution.

## Token-efficiency requirement

The directive should be delta-based.

It should reference exact governing artifacts rather than restating large project history.

The planning proposal should identify the minimum startup/read set required for a normal Builder turn under the new mechanism and compare it with the current Context Bootstrap model where practical.

## V2A disposition

Spatial Design Controls V2A remains Architect-approved under ML-DEVOS-AS-107.

Its owner implementation decision is deferred while this protocol planning cycle is active.

D-078 does not alter the AS-107 technical plan.

## Authorized planning writes

Only directly necessary future planning/review artifacts and normal coordination records may be proposed under D-078.

No protocol implementation write is authorized by this STATE.

## No implementation authority

Do not create or implement CURRENT_DIRECTIVE yet.

Do not modify:

- brain/protocols/**
- scripts/check-context-bootstrap.mjs
- tests/context-bootstrap.test.mjs
- coordination protocol implementation files
- canonical or generated skills
- CLAUDE.md
- AGENTS.md
- app/**
- components/**
- worker/**
- migrations/**
- public/**
- D1/R2 resources
- deployment configuration

except for later exact planning artifacts/Architect review/STATE transition separately published under the D-078 Architect planning turn.

## Website / S6 boundaries

Website Redesign V1 remains accepted.

The Website MEDIA_GAP remains separate.

S6 remains parked at ML-DEVOS-AS-103.

O1 and O2 remain open.

The real execution driver remains unauthorized.

D-068 remains untouched and untracked.

## Hard boundaries

Planning only.
No CURRENT_DIRECTIVE implementation.
No protocol-version mutation.
No checker implementation.
No skill mutation.
No product/admin/site mutation.
No media mutation.
No D1/R2 mutation.
No migration.
No deployment.
No public cutover.
No protected/main merge.
No PR #10 merge or auto-merge.
No S6/S7 work.

All action-specific flags remain NO.

## Return gate

When the canonical directive protocol proposal is complete:

route to:

TURN: PAULO

with:

ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: YES
CURRENT_HANDOFF: NONE

The Architect must state the exact future implementation/cutover scope.

No Builder protocol implementation begins automatically.
