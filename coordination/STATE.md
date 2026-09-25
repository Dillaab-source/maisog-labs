# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_WEBSITE_REDESIGN_V1_IMPLEMENTATION
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: D076_AS104_WEBSITE_REDESIGN_V1_IMPLEMENTATION_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2
PROTOCOL_VERSION: 1
CURRENT_HANDOFF: NONE
HANDOFF_ID:
REVIEW_TARGET_COMMIT:
APPLICABLE_REVIEW_ID:
MEDIA_MUTATION_AUTHORIZED: YES
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-076 is the controlling Product / Risk Owner implementation decision.

ML-DEVOS-AS-104 and:

`docs/product/WEBSITE_REDESIGN_V1_PLAN.md`

are the controlling Architect design and implementation-boundary references.

D-075 planning authority is complete and is not standing implementation authority.

## Current objective

Implement Website Redesign V1 as one bounded frontend/public-presentation cycle.

Target experience:

`Entry → Systems / Projects / Research / Contact`

using the approved MaisogLabs spatial/cinematic direction.

This is implementation authority, not deployment authority.

## Primary reference

The supplied Claude v10 design is the primary visual/interactivity reference.

It is not authoritative where it conflicts with:

1. D-076;
2. ML-DEVOS-AS-104;
3. docs/product/WEBSITE_REDESIGN_V1_PLAN.md;
4. current repository factual content;
5. Brand V3 identity;
6. accessibility/reduced-motion requirements;
7. existing WEB-INC-007 safety boundaries.

Do not blindly copy prototype content.

## Authorized code paths

Directly necessary implementation mutation is authorized only within:

- app/page.js
- app/globals.css
- app/DesignRuntime.js
- components/site/**
- components/Logo.js only where directly necessary
- data/site.js
- lib/content/schema.mjs
- tests/*.test.mjs directly necessary to Website Redesign V1
- brand/V3/DESIGN_MAP.md
- brand/V3/ASSET_MAP.json
- brand/V3/guidelines/V3_DIRECTION.md
- docs/product/UI_UX_SPEC.md
- docs/product/evidence/website-redesign-v1/**
- bounded Website Redesign V1 media paths under public/images/** and public/brand/**

Do not mutate unrelated files merely because they are nearby.

## Authorized media

Only these supplied Website Redesign V1 reference assets are authorized as new production media:

- plate-hero-v4.png
- logo-mark.mp4
- logo-mark poster/fallback supplied with the Claude design

Use the supplied bytes.

Do not regenerate or reinterpret them.

The wide lockup animation is not authorized.

If an authorized media source is unavailable, use the existing canonical static fallback and report MEDIA_GAP.

## Identity

The canonical orbital MaisogLabs identity remains locked.

No logo redesign.

No new brand identity.

No new font family.

Static canonical repository SVGs remain authoritative identity/fallback assets.

## Content integrity

Repository-approved public content and real Journal API data are factual authority.

Prototype/reference content is not factual authority.

Do not promote unsupported:

- research entries;
- dates;
- statuses;
- metrics;
- stacks;
- URLs;
- project flows;
- technical claims;
- contact addresses.

Public copy may be changed only as required by the AS-104 first-visit narrative and spatial information architecture.

## Entry

Entry must clearly explain that MaisogLabs is Paulo Maisog's independent technology lab.

The approved first-visit formulation is:

`MaisogLabs is Paulo Maisog's independent technology lab, building practical AI automation, research systems, software, and security-focused experiments.`

Minor tightening is allowed without changing the meaning or adding claims.

## Systems

Use:

- AI
- Automation
- Research
- Security
- Systems
- Architecture

The relationship visualization must remain informational.

Do not invent implementation relationships or project evidence.

Textual equivalents are required.

## Projects

Use current validated repository project content as the factual baseline.

A system-flow figure is optional and may appear only where its stages are explicitly supported.

Do not infer hidden architecture.

## Research

Use only existing public read-only Journal APIs and actual published Journal data.

Preserve the existing /journal feature.

No fake fallback articles.

Provide real loading, empty and error states.

## Contact

Use the validated repository contact email.

Copy address is authorized.

Do not use the prototype email if it differs from repository content.

## Spatial routing

Implement:

- #systems
- #projects
- #research
- #contact

No hash means Entry.

Required:

- browser Back;
- browser Forward;
- Escape to Entry;
- wordmark to Entry;
- deterministic focus entry;
- deterministic focus return;
- keyboard operation;
- safe handling of direct hashes.

## Mobile

Mobile is a first-class composition.

Use a compact brand header plus an explicit menu control.

The menu exposes:

- Systems
- Projects
- Research
- Contact

Do not squeeze the desktop navigation into the mobile viewport.

No horizontal content overflow.

No hover-only meaning.

## Motion

Motion must remain calm and purposeful.

WEB-INC-007 and prefers-reduced-motion remain binding.

When a major surface is open:

- pause nonessential Entry video;
- stop unnecessary animation-frame loops;
- stop pointer parallax;
- retain only necessary state transition behavior.

Pause relevant media when the document is hidden.

## WEB-INC-007

Preserve the current bounded runtime model.

Existing managed IDs remain:

- home
- projects
- process
- about

Presentation mapping:

- home -> Entry
- projects -> Projects
- process -> Systems
- about -> Contact

Research is not a managed section.

The mapping must be fixed/hardcoded.

No arbitrary selector.

No arbitrary CSS.

No arbitrary HTML.

No arbitrary JS.

No arbitrary asset/font URL.

A hidden managed route must hide both its trigger and surface.

A direct hash to a hidden managed route must fail safely to Entry.

Existing managed order may affect corresponding route-trigger order only.

No backend semantic expansion.

## Backend boundary

No new backend is required or authorized.

No D1 schema change.

No migration.

No new mutation API.

No Worker/authentication change.

No new admin capability.

No generic scene engine.

## Brand documentation

Because D-076 authorizes the AS-104 spatial composition change, update the directly affected Brand V3 composition documentation so it no longer identifies the superseded Earth-left / architecture-right placement map as the active public-home composition.

Brand identity remains V3.

## Visual evidence

Capture actual local implementation evidence under:

`docs/product/evidence/website-redesign-v1/`

Bound it to:

- desktop Entry;
- desktop Systems;
- desktop Projects;
- desktop Research;
- desktop Contact;
- mobile Entry/menu;
- mobile Systems;
- mobile Projects;
- mobile Research;
- mobile Contact;
- one concise evidence manifest/readme if useful.

Do not commit reference/mockup screenshots as implementation evidence.

## Required validation

At minimum run and report exact exit codes for:

- npm test
- npm run build
- git diff --check
- applicable Context Bootstrap/repository validators
- directly necessary focused Website Redesign tests

Do not add dependencies solely to create screenshots or animations.

## Required interaction verification

Verify and report:

- direct hash navigation;
- Entry return;
- Escape;
- Back;
- Forward;
- route keyboard navigation;
- Systems keyboard navigation;
- Projects keyboard navigation;
- focus entry;
- focus return;
- hidden managed route behavior;
- Copy address;
- Journal loading;
- Journal empty;
- Journal error;
- Journal success.

## Required motion verification

Verify:

- normal/calm;
- WEB-INC-007 minimal;
- WEB-INC-007 off;
- prefers-reduced-motion;
- media pause behind open surface;
- hidden-document media pause.

## Evidence classification

Builder-generated test, browser and screenshot evidence is:

ACTOR_REPORTED

until independent Architect review.

## Reasoning guidance

Use high reasoning for:

- initial decomposition;
- responsive/accessibility architecture;
- WEB-INC-007 compatibility;
- content-integrity review;
- final pre-handoff falsification.

Use ordinary implementation reasoning for straightforward bounded code/CSS/media copying.

SU is not required unless a genuinely new architecture/reliability question appears.

## Stop conditions

STOP and return to Architect/Paulo rather than widening scope if:

- the implementation requires a new backend;
- a D1 schema/migration appears necessary;
- a new dependency is materially required;
- a generic styling/scene capability appears necessary;
- approved media must be regenerated or replaced;
- required behavior conflicts with the accepted AS-104 architecture;
- a factual content need cannot be supported by approved content.

Implementation difficulty alone does not grant scope expansion.

## Return gate

After bounded implementation and validation:

create a fresh Builder handoff.

Expected handoff identity:

`H-WEB-REDESIGN-V1-IMPL-0001`

unless repository protocol requires another unused deterministic ID.

The handoff must identify:

- the published D-076 owner-transition SHA as the implementation/review base;
- ML-DEVOS-AS-104 as the applicable Architect design review;
- exact implementation tip;
- exact changed paths;
- exact tests/exit codes;
- desktop/mobile visual evidence;
- interaction evidence;
- motion evidence;
- content-integrity result;
- any MEDIA_GAP;
- any remaining known limitation.

Then route:

TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_HANDOFF: ACTIVE

with matching handoff selector fields.

No deployment follows automatically.

## S6 parked boundary

S6 remains parked at ML-DEVOS-AS-103.

Do not modify:

- S6 core;
- manifest/root status;
- O1;
- O2;
- execution-driver work;
- S7+;
- Sentinel version;
- closure.

D-068 remains untouched and non-authoritative.

## Hard boundaries

No production deployment.
No production publish/cutover.
No remote D1.
No remote R2.
No migration.
No Worker/auth change.
No arbitrary styling capability.
No new typography family.
No logo redesign.
No unsupported prototype facts.
No S6/S7 work.
No protected/main merge.
No PR #10 merge or auto-merge.

DEPLOY_AUTHORIZED remains NO.
REMOTE_D1_AUTHORIZED remains NO.
REMOTE_R2_AUTHORIZED remains NO.
MAIN_MERGE_AUTHORIZED remains NO.
