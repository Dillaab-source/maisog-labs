# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_PLANNING
TURN: PAULO
STATUS: ARCHITECT_APPROVED
AUTHORIZED_SCOPE: D078_RFC020_CONTEXT_BOOTSTRAP_V2_PROPOSAL_ACCEPTED_PAULO_STAGE_A_IMPLEMENTATION_DECISION_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: YES
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

D-078 is the completed Canonical Directive / Agent Transport planning authorization.

ML-DEVOS-AS-108 is the controlling Architect planning review.

ML-DEVOS-RFC-020 is the Architect-approved Context Bootstrap V2 proposal.

ML-DEVOS-AS-107 remains the accepted Spatial Design Controls V2 planning review.

## Planning result

D-078 planning is complete.

Recommended protocol:

`CONTEXT BOOTSTRAP V2`

New transport surface:

`coordination/CURRENT_DIRECTIVE.md`

Direction:

`Owner / Architect -> Builder`

Existing:

`coordination/CURRENT_HANDOFF.md`

remains:

`Builder -> Architect`

## Core invariant

CURRENT_DIRECTIVE is transport/context, not authority.

Authority remains in:

- Product / Risk Owner decisions;
- STATE;
- Architect Syncs;
- governing RFC/specifications;
- action-specific authorization flags.

Capability remains separate from authority.

## Protocol-version result

RFC-020 recommends a future:

`PROTOCOL_VERSION: 1 -> 2`

cutover.

That cutover is NOT AUTHORIZED yet.

Live protocol remains:

`PROTOCOL_VERSION: 1`

No CURRENT_DIRECTIVE selector exists in live STATE yet.

## SENTINEL / SU result

Every governed execution cycle under V2 will require:

- fresh SENTINEL sync before directive issuance;
- SU advisory contradiction/falsification before directive issuance;
- bounded SU by default;
- escalated research only on defined architecture/security/consequence/evidence triggers;
- fresh Architect SENTINEL/SU review of returned Builder work.

Neither SENTINEL nor SU grants authority.

## Implementation staging

Recommended:

### Stage A

Implement dual-version V1/V2 support while live protocol stays V1.

No V2 activation.

### Stage A review

Independent Architect review.

### Stage B

Separate Paulo activation decision.

Atomic switch to Protocol V2 with CURRENT_DIRECTIVE initially NONE.

First real directive only after activation verification.

## Proposed Stage-A scope

A future owner decision may authorize directly necessary protocol-only changes in:

- Context Bootstrap / Architect Sync protocol docs;
- coordination README;
- CURRENT_DIRECTIVE scaffolding/template;
- directive archive/provenance/index;
- context-bootstrap checker;
- protocol tests;
- canonical coordination Skills;
- generated Claude Skill bridges;
- CLAUDE.md / AGENTS.md / orientation guidance;
- directly necessary governance map text;
- RFC/review/coordination records.

No Stage-A implementation authority exists yet.

## Token objective

Current declared mandatory Claude startup set, excluding conditional CURRENT_HANDOFF:

approximately `85,625 bytes`.

Stage A must measure the new mandatory startup set.

Target:

at least 50% reduction for ordinary Builder startup while preserving safety-critical checks.

## V2A disposition

Spatial Design Controls V2A remains Architect-approved.

Its implementation decision remains deferred until the directive-protocol decision is resolved.

## Website / S6 boundaries

Website Redesign V1 remains accepted.

Website MEDIA_GAP remains separate.

S6 remains parked at ML-DEVOS-AS-103.

O1 and O2 remain open.

The real execution driver remains unauthorized.

D-068 remains untouched/untracked.

## Hard boundaries

No Stage-A implementation.
No Protocol V2 activation.
No CURRENT_DIRECTIVE implementation.
No checker mutation.
No skill mutation.
No product/admin/site mutation.
No media mutation.
No D1/R2 mutation.
No migration.
No deployment.
No public cutover.
No S6/S7 work.
No protected/main merge.
No PR #10 merge or auto-merge.

All action-specific flags remain NO.

## Next transition

TURN: PAULO

Paulo must decide whether to authorize:

`RFC-020 STAGE A — DUAL-VERSION CANONICAL DIRECTIVE PROTOCOL IMPLEMENTATION`

AS-108 itself grants no implementation or activation authority.
