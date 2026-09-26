# Architect Review — MaisogLabs Website Redesign V1

Architect Sync: ML-DEVOS-AS-104
Status: ARCHITECT_APPROVED — WEBSITE REDESIGN V1 PROPOSAL READY FOR PAULO IMPLEMENTATION DECISION
Review mode: D-075 DESIGN PANEL / BRAND-COMPOSITION PLANNING
Cycle: MAISOGLABS_WEBSITE_REDESIGN_V1_PLANNING
Authority: D-075
Reviewed coordination tip: eb2cb0a8e40425e0d54db073cf9846ded3182f82
Proposal: docs/product/WEBSITE_REDESIGN_V1_PLAN.md
Implementation authority: NOT GRANTED

## Verdict

`ARCHITECT_APPROVED — WEBSITE REDESIGN V1 PROPOSAL READY FOR PAULO IMPLEMENTATION DECISION`

The D-075 planning objective is complete.

The Claude v10 single-screen spatial concept is accepted as the primary MaisogLabs Website Redesign V1 direction with the corrections and boundaries recorded in `docs/product/WEBSITE_REDESIGN_V1_PLAN.md`.

No Builder implementation is authorized by AS-104.

## Reviewed source hierarchy

The Architect reviewed the live repository at the exact D-075 tip, including:

- Brand V3 identity and design-map sources;
- Design Governance;
- Design Reference Workflow;
- UI/UX specification;
- current `app/page.js`;
- current `app/globals.css`;
- current Logo and ProjectRail implementation;
- current DesignRuntime / WEB-INC-007 contract;
- current public content structure;
- current Journal public presentation/data contract;
- current local content validator.

The supplied Claude design/reference artifacts were reviewed as reference evidence, not authority.

Repository/live product truth outranked reference/prototype content whenever they differed.

## Design Panel result

### Brand / Art Direction

PASS WITH COMPOSITION CHANGE.

Retain the cinematic spatial environment, canonical orbital identity, system trajectory language, restrained architecture, deep-space atmosphere and cobalt interaction vocabulary.

Reject new-brand drift, excessive glow, generic cyberpunk and decorative sci-fi complexity.

### Information Architecture / UX

PASS.

Adopt:

`Entry → Systems / Projects / Research / Contact`

Entry must explain MaisogLabs in plain language before interaction.

### Interaction / Motion

PASS WITH CONDITIONS.

Retain:

- hash routes;
- browser history;
- Escape-to-Entry;
- wordmark-to-Entry;
- focus transfer;
- keyboard selection;
- restrained route transitions.

Background video/RAF work must stop when it is no longer contributing visible information.

### Frontend Feasibility

PASS.

No new backend architecture is needed.

The implementation can remain within the current public Next.js/CSS/component boundary.

Research can reuse the existing read-only Journal API.

### Responsive / Accessibility

CHANGES INCORPORATED INTO PLAN.

The desktop nav from the reference is not sufficient on narrow/mobile screens.

A dedicated compact mobile navigation model is required.

All informational diagrams require equivalent textual access.

### Independent Critic

PASS AFTER CONDITIONS.

The central risk is turning the site into polished technical theatre.

The plan therefore prohibits fake telemetry, fake project flow, fake research notes and ornamental system diagrams without meaning.

### Layperson / First-Time Visitor

PASS AFTER COPY REQUIREMENT.

The Entry surface must identify MaisogLabs as Paulo Maisog's independent technology lab and describe its work without assuming project or architecture knowledge.

## Accepted composition

The public website becomes one persistent environment.

Entry is the base state.

Systems, Projects, Research and Contact appear as bounded spatial surfaces over that environment.

This intentionally replaces the long-scroll homepage as the primary experience.

Process and About are not deleted conceptually:

- Process becomes real system/project explanation;
- About becomes concise first-visit identity context;
- legal/footer information becomes a restrained Entry/Contact treatment.

## Claude reference disposition

The Claude v10 design is:

`PRIMARY REFERENCE — NOT BYTE-FOR-BYTE IMPLEMENTATION CONTRACT`

Accepted:

- spatial single-screen model;
- numbered trajectory language;
- Systems relationship model;
- typography-led Projects selection model;
- real-evidence Research surface concept;
- trajectory-resolving Contact model;
- hash route interaction;
- calm spatial transitions.

Rejected/changed:

- prototype-only public facts;
- fake Research notes/dates;
- prototype contact address where it differs from repository content;
- automatic publication of reference project descriptions/statuses;
- Montserrat as an unapproved brand-font replacement;
- inadequate narrow-screen navigation;
- unnecessary continuous animation behind open work surfaces;
- redundant wide logo animation.

## Content integrity

Production content must come from repository-approved public content or existing real public Journal data.

The redesign must not promote prototype content into factual public claims.

## Typography decision

No new font-family authorization is included.

Use existing Brand V3 roles.

Reference typography is compositional guidance only.

## Hero asset decision

The Claude spatial hero plate is recommended as the new website composition if Paulo approves implementation.

Because it differs from the current V3.1 placement map, implementation must update the directly affected Brand V3 composition/asset documents.

This remains Brand V3 identity.

No logo redesign is authorized.

## WEB-INC-007 compatibility

WEB-INC-007 stays active.

No D1 schema change is required.

The plan defines the presentation mapping:

- `home` → Entry;
- `projects` → Projects;
- `process` → Systems;
- `about` → Contact.

Research remains outside the managed four-section contract.

A bounded `DesignRuntime` compatibility change may apply existing visibility/order values to both route triggers and spatial surfaces using only fixed managed IDs.

No arbitrary selector, CSS or HTML capability may be introduced.

## Proposed future implementation scope

If Paulo approves implementation, the bounded implementation cycle may cover only the directly necessary:

- public page composition;
- public CSS;
- bounded DesignRuntime compatibility adapter;
- new `components/site/**` spatial components;
- directly necessary canonical-logo use;
- local static content/schema extensions where required;
- approved hero/motion media assets;
- directly affected Brand V3 composition documents;
- UI/UX documentation;
- directly necessary tests.

No Worker/D1/migration/authentication change is part of the proposal.

## Evidence requirements

Future Builder handoff must include:

- full tests/build/validators;
- desktop visual evidence;
- mobile visual evidence;
- keyboard/history/focus matrix;
- reduced-motion matrix;
- WEB-INC-007 regression evidence;
- media lifecycle evidence;
- content-integrity evidence.

## Deployment boundary

Implementation acceptance will not equal deployment authority.

Production preview/publish/deployment remains separately gated.

## S6 isolation

S6 remains parked exactly at the AS-103 boundary.

AS-104 does not modify or reopen:

- S6 core;
- O1;
- O2;
- real execution-driver work;
- S7+;
- Sentinel version;
- closure.

## Next owner decision

Paulo must decide whether to authorize the Website Redesign V1 implementation defined by:

`docs/product/WEBSITE_REDESIGN_V1_PLAN.md`

A future owner decision may authorize implementation.

AS-104 itself does not.

## Routing

Route:

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: D075_WEBSITE_REDESIGN_V1_PROPOSAL_ACCEPTED_PAULO_IMPLEMENTATION_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`

`CURRENT_REMEDIATION_CYCLE: 0`

`MAX_REMEDIATION_CYCLES: 2`

`CURRENT_HANDOFF: NONE`

with empty selector fields.

All mutation, remote-resource, deployment and protected/main flags remain `NO`.

No Builder implementation begins until Paulo publishes a separate owner implementation decision.
