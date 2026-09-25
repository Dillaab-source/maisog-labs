# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_WEBSITE_REDESIGN_V1_PLANNING
TURN: ARCHITECT
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: D075_WEBSITE_REDESIGN_V1_BRAND_COMPOSITION_PLANNING_ONLY
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

D-075 is the controlling owner decision.

S6 is parked at the ML-DEVOS-AS-103 accepted hardened-core boundary.

Parking S6 is not closure.

The S6 manifest/root state, Sentinel v1.8.0, O1, O2 and the separately governed real execution-driver boundary remain unchanged.

## Current objective

Perform one bounded Architect / Design Panel planning cycle for a MaisogLabs public-website redesign.

This is a BRAND / COMPOSITION CHANGE planning cycle.

No website implementation is authorized.

## Design baseline

Read and use as the current design baseline:

- brand/V3/README.md
- brand/V3/DESIGN_MAP.md
- brand/V3/guidelines/V3_DIRECTION.md
- brand/V3/DESIGN_GOVERNANCE.md
- brand/V3/design-tokens/**
- docs/product/DESIGN_REFERENCE_WORKFLOW.md
- docs/product/UI_UX_SPEC.md where applicable
- current app/page.js
- current app/globals.css
- directly relevant current components and public assets
- current WEB-INC-007 runtime design-control implementation where necessary to classify DIRECT MATCH / APPROXIMATION / GAP

Repository/live implementation truth outranks chat memory.

## Design Panel

The Architect must synthesize at minimum:

1. Brand / Art Direction
2. Information Architecture / UX
3. Interaction / Motion
4. Frontend Feasibility
5. Responsive / Accessibility
6. Independent Critic
7. Layperson / First-Time Visitor

The Independent Critic must challenge consensus rather than decorate it.

The First-Time Visitor must judge clarity without assuming prior MaisogLabs knowledge.

## Required proposal

Produce a Website Redesign V1 proposal covering:

- first-visit narrative;
- information hierarchy;
- desktop composition;
- mobile/narrow composition;
- header/navigation;
- hero;
- projects;
- process/about;
- footer;
- motion/interaction;
- accessibility/readability;
- asset map;
- WEB-INC-007 DIRECT MATCH / APPROXIMATION / GAP mapping;
- required source-code/component GAPs;
- implementation risks;
- acceptance criteria;
- exact future implementation scope.

## Brand boundaries

Preserve the canonical MaisogLabs orbital identity.

No logo redesign.

No new typography family.

No replacement brand identity.

Target character remains:

cinematic + modern + calm + premium + engineered + soft-edged.

Technology/systems remain visually dominant.

Classical architecture and space/exploration remain restrained supporting influences.

Avoid generic SaaS, gaming HUD overload, neon cyberpunk and generic AI imagery.

## Asset boundary

New visuals may be proposed during planning.

Each production visual must be an individual asset tied to an explicit section/purpose.

Do not use collage sheets as production assets.

Do not bake essential copy or UI into decorative imagery.

Actual repository media mutation requires later implementation authority.

## Authorized planning writes

Only directly necessary:

- new website-redesign planning/proposal artifacts under docs/product/;
- coordination/ARCHITECT_REVIEW.md;
- devos/changes/architect-syncs/ when the Architect publishes the planning verdict;
- deterministic traceability outputs only if required by those governed planning artifacts;
- normal coordination archive/state artifacts required for the Architect transition.

Existing Brand V3 source files are read-only in this planning cycle.

## No implementation authority

Do not modify:

- app/**;
- components/**;
- public/**;
- worker/**;
- migrations/**;
- D1 data/schema;
- R2;
- authenticated design runtime/settings;
- production content;
- production website.

Do not apply WEB-INC-007 settings to production.

Do not create a source-code approximation of a GAP.

## S6 parked boundary

Do not modify or reopen:

- S6 core;
- S6 manifest/root status;
- O1;
- O2;
- real execution-driver work;
- S7+;
- Sentinel version or closure.

D-074 is complete and supplies no standing authority.

## Return gate

When the Website Redesign V1 proposal is coherent:

TURN: PAULO
STATUS: ARCHITECT_APPROVED or PAULO_DECISION_REQUIRED as appropriate
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: YES

The Architect transition must state the exact implementation scope proposed for a later owner decision.

No Builder implementation begins from D-075 alone.

## Hard boundaries

No website implementation.
No public publish.
No production deployment.
No D1/R2 mutation.
No raw styling bypass.
No arbitrary CSS/JS/HTML design field.
No logo redesign.
No S6/S7 work.
No protected/main merge.
No PR #10 merge or auto-merge.

All action-specific flags remain NO.
