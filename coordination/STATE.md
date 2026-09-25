# MaisogLabs Agent Coordination State
CYCLE_ID: MAISOGLABS_SPATIAL_DESIGN_CONTROLS_V2_PLANNING
TURN: ARCHITECT
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: D077_SPATIAL_DESIGN_CONTROLS_V2_PLANNING_ONLY
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
D-077 is the controlling Product / Risk Owner planning authorization.
ML-DEVOS-AS-106 is the accepted Website Redesign V1 implementation review.
Website Redesign V1 remains accepted and is not reopened by this planning cycle.
## Current objective
Perform one bounded Spatial Design Controls V2 architecture/design planning cycle.
The objective is to make the admin design system naturally control the accepted spatial website while preserving a code-owned structural canvas and bounded validated admin controls.
This is planning only.
No V2 implementation is authorized.
## Current architecture
Public spatial composition:
- Entry
- Systems
- Projects
- Research
- Contact
Existing WEB-INC-007 managed section IDs:
- home
- projects
- process
- about
Current presentation mapping:
- home -> Entry
- projects -> Projects
- process -> Systems
- about -> Contact
Research remains outside the managed four-section contract.
## Architecture principle
Preserve four responsibility planes:
1. CODE-OWNED STRUCTURE
2. ADMIN-EDITABLE PRESENTATION
3. CONTENT-OWNED FACTS
4. OWNER-GATED PUBLICATION
The planning cycle must make each proposed capability belong to exactly one primary plane and identify cross-plane effects.
## V2 planning questions
Determine:
- whether admin-facing labels can match Entry / Systems / Projects / Contact while fixed backend IDs remain unchanged;
- whether any current WEB-INC-007 controls need spatially clearer grouping/naming;
- whether the existing Preview experience adequately previews the real spatial canvas;
- whether any additional bounded preset/range is genuinely needed;
- whether Research needs any design-control integration;
- whether any proposal requires schema/API/storage change;
- whether any proposal unnecessarily widens security/capability scope.
## Existing controls
Audit at minimum:
- hero background preset;
- card style preset;
- layout density preset;
- typography preset;
- heading scale preset;
- panel/glass preset;
- animation preset;
- reduced-motion mode;
- project rail mode;
- Journal card mode;
- accent preset;
- overlay intensity;
- panel opacity;
- border intensity;
- radius scale;
- managed section visibility;
- managed section order;
- Draft;
- Preview;
- Publish;
- revision/conflict behavior.
## Design-control boundary
Do not propose unrestricted:
- CSS;
- HTML;
- JavaScript;
- selectors;
- class names;
- asset URLs;
- font URLs;
- colors outside approved bounded vocabulary;
- XY coordinates;
- drag/drop structural mutation;
- arbitrary component creation;
- arbitrary route creation.
A richer visual-builder capability, if ever justified, is a separate future governance subject.
## Research boundary
Research is not automatically added to the managed-section contract.
The Architect must provide evidence of a real user/product need before recommending expansion.
## Reference workflow
Preserve:
REFERENCE
-> ANALYZE
-> MAP
-> DRAFT
-> PREVIEW
-> REVIEW
-> PUBLISH
Use:
- DIRECT MATCH
- APPROXIMATION
- GAP
for design-reference mapping.
A GAP is not implementation authority.
## Design Panel
Review with at minimum:
1. Product / Admin UX
2. Frontend Architecture
3. Design Systems
4. Security / Capability Boundary
5. Accessibility / Responsive
6. Independent Critic
7. Layperson / Admin User
SU may advise/falsify but grants no authority.
## Required output
Produce a coherent Spatial Design Controls V2 planning proposal covering:
- current-state audit;
- ownership model;
- existing-control mapping;
- admin vocabulary/alias design;
- proposed V2 control catalog;
- Research disposition;
- preview workflow;
- Draft/Preview/Publish workflow;
- data/API/storage impact;
- security/capability boundaries;
- responsive/accessibility requirements;
- dependency/migration assessment;
- phased implementation recommendation;
- test/evidence requirements;
- unresolved choices;
- exact bounded future implementation scope.
## Authorized planning writes
Only directly necessary:
- `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md` or equivalent planning artifact;
- `coordination/ARCHITECT_REVIEW.md`;
- `devos/changes/architect-syncs/**` for the resulting Architect planning review;
- normal coordination/archive/state artifacts required for the planning transition.
No production source mutation.
## No implementation authority
Do not modify:
- app/admin/**
- app/DesignRuntime.js
- public website implementation
- worker/**
- migrations/**
- D1 schema/data
- R2
- production design settings
- production content
- media
- deployment configuration
No V2 code implementation is authorized.
## Website Redesign V1
The accepted Website Redesign V1 remains intact.
Do not reopen its implementation findings.
The existing MEDIA_GAP remains separate from this planning cycle.
## S6 parked boundary
S6 remains parked at ML-DEVOS-AS-103.
O1 and O2 remain open.
The real execution driver remains unauthorized.
D-068 remains untouched.
No S6/S7 authority is active.
## Return gate
When the V2 planning proposal is coherent:
route to:
TURN: PAULO
with:
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: YES
CURRENT_HANDOFF: NONE
The Architect must state the exact bounded implementation scope proposed for a future owner decision.
No Builder implementation begins from D-077 alone.
## Hard boundaries
No V2 implementation.
No website mutation.
No admin/runtime mutation.
No D1/R2 mutation.
No migration.
No deployment.
No public cutover.
No free-form visual builder.
No arbitrary CSS/HTML/JS.
No new route/component generator.
No logo redesign.
No S6/S7 work.
No protected/main merge.
No PR #10 merge or auto-merge.
All action-specific flags remain NO.
