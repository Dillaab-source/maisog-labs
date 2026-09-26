# Architect Review — Spatial Design Controls V2 Planning

Architect Sync: ML-DEVOS-AS-107
Status: ARCHITECT_APPROVED — SPATIAL DESIGN CONTROLS V2A PLAN READY FOR PAULO IMPLEMENTATION DECISION
Review mode: D-077 ARCHITECTURE / ADMIN-DESIGN-CONTROL PLANNING
Cycle: MAISOGLABS_SPATIAL_DESIGN_CONTROLS_V2_PLANNING
Authority: D-077
Reviewed repository tip: cc6b34fda5e0e3f7627608969eee554f6922bb3a
Proposal: docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md
Implementation authority: NOT GRANTED

## Verdict

`ARCHITECT_APPROVED — SPATIAL DESIGN CONTROLS V2A PLAN READY FOR PAULO IMPLEMENTATION DECISION`

The D-077 planning objective is complete.

The Architect recommends:

`SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT`

No V2 implementation is authorized by AS-107.

## Repository-grounded finding

The current architecture does not require a new design backend.

The accepted WEB-INC-007 system already has bounded theme enums, bounded numeric ranges, managed visibility/order, immutable draft revisions, authenticated preview, explicit Publish, stale-write protection, positive-allowlist serialization, published-only public projection, and fixed runtime mappings.

The current problem is primarily that the admin UI still exposes legacy long-scroll terminology while the accepted site is spatial.

## Primary recommendation

Preserve the fixed backend IDs `home`, `process`, `projects`, and `about`, but present them to the admin as Entry, Systems, Projects, and Contact using local source-controlled alias metadata.

Do not rename D1 entities or API identifiers.

## Research decision

Do not add Research to the managed visibility/order contract in V2A.

Research remains a fixed spatial destination, previewable, affected by applicable existing global theme presentation, and outside managed section visibility/order.

## V2A control strategy

Reuse all existing theme keys and values.

Do not add a new theme field.

Reorganize the admin UI into Atmosphere, Surfaces, Typography, Motion, Collections, Spatial surfaces, and Spatial Preview.

Use human-readable option labels while submitting only existing allowed server enum values.

## Entry order decision

Do not present Entry's generic stored section order as an editable navigation-order setting.

Entry is the base state and is not a route trigger.

Preserve its stored order transparently when saving visibility.

## Managed route order

Systems, Projects and Contact may retain the existing bounded order input.

Research remains fixed.

No drag/drop is required.

## Preview decision

Keep the existing authenticated preview architecture.

Add fixed shortcuts for Entry, Systems, Projects, Research, Contact, and Journal using the existing `?design-preview=1` mechanism.

Do not add an iframe/editor runtime in V2A.

Do not add a new preview endpoint.

## Publish semantics

Clarify in the admin UI that Publish activates design settings only.

It does not deploy code, publish content, or authorize production deployment.

## Data/API decision

V2A requires no D1 migration, schema change, new table, Worker change, API shape change, public projection change, DesignRuntime change, or package dependency.

## Security decision

Preserve the existing positive-allowlist design.

Do not add inputs for arbitrary CSS, HTML, JavaScript, selectors, URLs, remote assets, fonts, custom classes, arbitrary colors, XY coordinates, component definitions, or route definitions.

## Design Panel

Product/Admin UX: APPROVED.

Frontend Architecture: APPROVED.

Design Systems: APPROVED.

Security/Capability Boundary: APPROVED.

Accessibility/Responsive: APPROVED WITH IMPLEMENTATION REQUIREMENTS.

Independent Critic: use `Spatial Design Controls` and `Spatial Preview`; do not call V2A a free-form canvas editor.

Layperson/Admin: use the same nouns as the public site and clearly distinguish Draft, Preview, Publish and Deployment.

## SU advisory/falsification result

No evidence justified unrestricted visual editing, backend ID migration, immediate Research management, additional stored design fields, or new preview architecture.

The smallest sufficient architecture is the strongest V2A proposal.

SU supplied advisory challenge only and granted no authority.

## Exact future implementation scope proposed

If Paulo authorizes V2A implementation, limit Builder mutation to:

- `app/admin/DesignControls.js`
- directly necessary V2-focused test file(s)
- `docs/product/DESIGN_REFERENCE_WORKFLOW.md`
- `docs/product/UI_UX_SPEC.md`
- normal coordination/evidence files required by the governed workflow

Do not authorize `app/DesignRuntime.js`, `components/site/**`, Worker code, D1 code, migrations, API changes, public-site source, media, Brand identity, content, or deployment.

## Validation required for future implementation

At minimum:

- focused V2 tests;
- full npm test;
- npm run build;
- git diff --check;
- applicable validators;
- exact changed-file scope;
- desktop admin evidence;
- narrow/mobile admin evidence;
- fixed preview-link evidence;
- no-arbitrary-input inspection;
- confirmation Worker/D1/DesignRuntime/migrations remain unchanged.

## Website Redesign V1

Website Redesign V1 remains accepted under ML-DEVOS-AS-106.

AS-107 does not reopen it.

The existing MEDIA_GAP remains independent of Spatial Design Controls V2.

## S6

S6 remains parked at ML-DEVOS-AS-103.

D-068 remains untouched.

No S6/S7 authority is active.

## Deployment

No deployment or public cutover is authorized.

## Next owner decision

Paulo must decide whether to authorize:

`SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT`

under the exact bounded scope in the planning artifact.

AS-107 itself grants no Builder implementation authority.

## Routing

Route:

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: D077_SPATIAL_DESIGN_CONTROLS_V2_PLAN_ACCEPTED_PAULO_IMPLEMENTATION_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`

`CURRENT_REMEDIATION_CYCLE: 0`

`MAX_REMEDIATION_CYCLES: 2`

`CURRENT_HANDOFF: NONE`

with empty selector fields.

All mutation, media, remote-resource, deployment and main-merge flags remain NO.
