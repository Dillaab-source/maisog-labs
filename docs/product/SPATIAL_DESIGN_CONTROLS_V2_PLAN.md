# MaisogLabs Spatial Design Controls V2 Plan

Status: `ARCHITECT-APPROVED PROPOSAL — IMPLEMENTATION NOT AUTHORIZED`

Architect Sync: `ML-DEVOS-AS-107`

Owner: Paulo — Product / Risk Owner

Architect: ChatGPT

Authority: `D-077`

Repository-grounded planning tip:

`cc6b34fda5e0e3f7627608969eee554f6922bb3a`

## 1. Decision summary

Spatial Design Controls V2 should preserve the accepted MaisogLabs architecture:

`CODE-OWNED SPATIAL CANVAS + BOUNDED ADMIN PRESENTATION CONTROLS + GOVERNED CONTENT + OWNER-GATED PUBLICATION`

The immediate V2 implementation should not become a page builder.

The current WEB-INC-007 storage/API/runtime substrate is sufficient for the immediate admin usability problem.

The recommended first implementation increment is therefore:

`SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT`

V2A should:

- rename legacy admin-facing section terminology to the spatial website vocabulary;
- organize the existing controls into understandable spatial/design groups;
- present friendly names for existing bounded preset values;
- clarify which settings affect Entry, surfaces, Projects, Journal and motion;
- provide direct authenticated-preview shortcuts for Entry, Systems, Projects, Research and Contact;
- clarify Draft versus Publish behavior;
- preserve all existing backend identifiers, API shapes, D1 tables, validation ranges and public-runtime mappings.

V2A requires no:

- D1 migration;
- new table;
- new API;
- Worker semantic change;
- public DesignRuntime change;
- public-site structural change;
- new dependency;
- arbitrary styling capability.

## 2. Current-state audit

The accepted public spatial website is:

`Entry -> Systems / Projects / Research / Contact`

The existing WEB-INC-007 managed backend identifiers remain:

- `home`
- `projects`
- `process`
- `about`

The accepted presentation mapping is:

- `home` -> Entry content
- `process` -> Systems
- `projects` -> Projects
- `about` -> Contact

Research has no managed-section identifier.

Research is deliberately outside the four-section visibility/order contract.

The current admin UI still presents the legacy labels:

- Home
- Projects
- Process
- About

That terminology is mechanically valid but no longer matches the accepted public information architecture.

This is an admin-usability mismatch rather than a storage/API defect.

## 3. Existing WEB-INC-007 substrate

The existing design system already provides the following bounded theme controls:

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
- radius scale.

Existing managed-section controls provide:

- visibility;
- order.

Existing workflow provides:

- Save Draft;
- authenticated Preview;
- Publish;
- immutable revisions;
- expected-pointer stale-write protection;
- fail-closed enum/range validation;
- public published-only projection.

The current control substrate is sufficient for the immediate spatial-admin use case.

## 4. Ownership model

### CODE-OWNED STRUCTURE

The following remain source-controlled and are not ordinary admin settings:

- Entry / Systems / Projects / Research / Contact route architecture;
- component hierarchy;
- hash-routing semantics;
- Browser Back / Forward behavior;
- Escape-to-Entry;
- wordmark-to-Entry;
- focus entry/return behavior;
- skip-link behavior;
- mobile menu structure;
- responsive composition;
- accessibility semantics;
- Systems relationship derivation;
- Projects component structure;
- Research Journal integration;
- Contact component structure;
- fixed managed-id-to-route mapping;
- public runtime validation/application logic.

Admin controls do not rewrite these structures.

### ADMIN-EDITABLE PRESENTATION

The admin may control only already-approved bounded values such as:

- Entry background preset;
- spatial density;
- surface treatment;
- surface glass treatment;
- surface opacity;
- surface border intensity;
- radius scale;
- approved typography role;
- heading scale;
- approved accent;
- environment overlay;
- motion preset;
- reduced-motion mode;
- Project selector behavior;
- Journal index behavior;
- visibility of already-managed surfaces/content;
- relative order of already-managed spatial route triggers.

### CONTENT-OWNED FACTS

The design controls do not become a factual-content editor.

Project facts remain in their approved source.

Journal content remains in the Journal system.

Contact data remains in approved public content.

No design setting may invent:

- project facts;
- research records;
- URLs;
- statuses;
- metrics;
- technical claims.

### OWNER-GATED PUBLICATION

Draft state is not publication.

Preview is not publication.

A design change becomes publicly active only through the existing explicit Publish action.

Code deployment remains separately governed.

## 5. Admin vocabulary alias design

Preserve backend identifiers exactly.

Do not rename:

- `home`
- `process`
- `projects`
- `about`

in D1, Worker routes, public projections or runtime contracts.

Instead create a local admin presentation mapping.

| Backend ID | Admin label | Public meaning |
|---|---|---|
| `home` | Entry | Entry content |
| `process` | Systems | Systems surface |
| `projects` | Projects | Projects surface |
| `about` | Contact | Contact surface |

The mapping must be static/source-controlled in the admin component.

Do not accept display labels from D1 or caller input.

### Recommended UI ordering

Present managed surfaces in spatial order:

1. Entry
2. Systems
3. Projects
4. Contact

Research may be shown in the Preview area as:

`Research — fixed / unmanaged`

but must not gain visibility/order mutation merely for visual symmetry.

## 6. Entry-specific semantics

The existing `home` section maps to Entry content.

Its visibility control remains valid.

Its persisted `order` field exists because it uses the generic section-revision substrate, but Entry is not a spatial route trigger.

Therefore V2A should not present Entry order as a meaningful editable navigation control.

Recommended behavior:

- show `Entry content`;
- allow `Visible`;
- explain that Entry itself is the base spatial state;
- do not expose a misleading `Navigation order` input for Entry;
- preserve the existing stored order value unchanged when saving an Entry visibility draft.

No API change is required.

## 7. Systems / Projects / Contact order semantics

For:

- Systems (`process`);
- Projects (`projects`);
- Contact (`about`);

the existing order field affects relative managed route-trigger ranking.

Research keeps its fixed unmanaged slot.

V2A should label this control more clearly.

Recommended label:

`Navigation order`

with supporting text:

`Lower values appear earlier among managed destinations. Research remains in its fixed position.`

Do not introduce drag/drop in V2A.

Do not create a new ordering API.

Do not imply that the numeric value is an absolute CSS slot.

## 8. Research disposition

Research remains outside the managed visibility/order contract for V2A.

Rationale:

1. Research already exists as a fixed spatial destination.
2. It represents the public Journal/evidence feature rather than a legacy managed homepage section.
3. No demonstrated user requirement currently requires hiding or reordering Research.
4. Adding it would widen managed ID validation, admin design status, section mutation semantics, public design projection, runtime mapping, bootstrap/data expectations, and tests.
5. Visual symmetry alone does not justify that capability expansion.

Research is still previewable.

Global bounded theme controls may continue to affect its shared visual presentation where existing CSS already does so.

If Paulo later needs Research visibility/order control, treat that as a separate bounded capability decision.

## 9. Theme-control grouping

V2A should reorganize the existing fields for human comprehension without changing payload keys.

### Atmosphere

- `heroBackgroundPreset` — admin label: `Entry background`
- `overlayIntensity` — admin label: `Environment overlay`
- `accentPreset` — admin label: `Accent`

### Surfaces

- `cardStylePreset` — admin label: `Surface / card style`
- `panelPreset` — admin label: `Surface glass`
- `layoutDensityPreset` — admin label: `Spatial density`
- `panelOpacityPct` — admin label: `Surface opacity`
- `borderIntensityPct` — admin label: `Surface border intensity`
- `radiusScalePct` — admin label: `Corner radius scale`

### Typography

- `typographyPreset` — admin label: `Typography`
- `headingScalePreset` — admin label: `Surface heading scale`

### Motion

- `animationPreset` — admin label: `Motion`
- `reducedMotionMode` — admin label: `Reduced motion`

Reduced-motion safety remains non-negotiable.

There is no admin option to ignore a user's OS-level reduced-motion preference.

### Collections

- `projectRailMode` — admin label: `Project selector scrolling`
- `journalCardMode` — admin label: `Journal index layout`

The UI should clearly state that Journal-card behavior applies to the Journal presentation and is not a Research-route visibility control.

## 10. Human-readable preset labels

The stored/server values remain unchanged.

The admin may display friendly local labels.

Examples:

- `cinematic-v3` -> `Cinematic V3`
- `deep-night` -> `Deep Night`
- `minimal-orbit` -> `Minimal Orbit`
- `soft-glass` -> `Soft Glass`
- `quiet-border` -> `Quiet Border`
- `solid-night` -> `Solid Night`
- `clear-glass` -> `Clear Glass`
- `opaque-night` -> `Opaque Night`
- `respect-system` -> `Respect system setting`
- `always-reduced` -> `Always reduced`
- `free-scroll` -> `Free scroll`

Underlying submitted values must remain the exact server-approved enum.

No friendly label is ever submitted as a new enum value.

## 11. Draft / Publish terminology

The current UI uses generic `Save Draft` and `Publish`.

V2A should make the scope explicit.

Recommended labels:

- `Save Theme Draft`
- `Publish Theme`

For managed surfaces:

- `Save Entry Draft`
- `Publish Entry`
- `Save Systems Draft`
- `Publish Systems`
- etc.

Add concise persistent explanation:

`Publish activates these design settings. It does not deploy code or publish website content.`

This avoids conflating design-setting publication, content publication, and code deployment.

No API change is required.

## 12. Lifecycle visibility

The current API already returns lifecycle state and revision pointers.

V2A may display existing state more clearly:

- Published
- Draft
- Published + Draft
- No published setting where applicable

This is display-only.

Do not expose internal revision IDs as the primary user experience.

They may remain available in technical/debug information if useful.

## 13. Spatial Preview launchpad

The existing authenticated preview mechanism already renders draft-if-present design state on the real public site.

V2A should expose direct fixed preview shortcuts:

- Entry: `/?design-preview=1`
- Systems: `/?design-preview=1#systems`
- Projects: `/?design-preview=1#projects`
- Research: `/?design-preview=1#research`
- Contact: `/?design-preview=1#contact`
- Journal: `/journal?design-preview=1`

These are fixed source-authored paths.

No caller-supplied URL field.

No database URL.

No new preview endpoint.

No iframe is required for V2A.

The real page remains the preview renderer.

## 14. Research preview without Research mutation

Research must appear in the Spatial Preview launchpad.

This does not make Research managed.

The distinction must be visible:

`Research — preview only; fixed destination`

This allows Paulo to inspect how global theme settings affect Research without expanding its visibility/order contract.

## 15. Raw preview data

The existing `Refresh raw preview data` function is useful for technical diagnosis but is not the primary design experience.

Recommended V2A presentation:

- keep the capability;
- move it under a collapsed `Technical preview data` or equivalent secondary disclosure;
- do not remove the endpoint;
- do not expose additional backend information.

The primary experience should be the actual rendered spatial preview.

## 16. Reference-driven design workflow

Preserve:

`REFERENCE -> ANALYZE -> MAP -> DRAFT -> PREVIEW -> REVIEW -> PUBLISH`

For each reference trait classify:

### DIRECT MATCH

Existing control can express it directly.

### APPROXIMATION

Existing bounded controls can express a safe approximation.

### GAP

Current controls cannot express it.

A GAP never becomes an implicit source-code mutation.

A GAP may lead to accepting the approximation, proposing one new bounded preset, proposing a separate presentation patch, or proposing a separately governed future capability.

## 17. Existing-control mapping result

### DIRECT MATCH

Existing WEB-INC-007 already covers:

- Entry background family;
- environment overlay;
- surface opacity;
- border intensity;
- radius scale;
- surface/card style;
- glass treatment;
- density;
- typography role;
- heading scale;
- accent;
- calm/minimal/off motion;
- reduced-motion policy;
- Project selector scrolling;
- Journal card/index behavior;
- managed surface visibility;
- managed route-trigger order;
- authenticated draft preview;
- explicit Publish.

### APPROXIMATION

Existing controls can approximate:

- cinematic atmosphere;
- darker/lighter spatial surfaces;
- stronger/weaker spatial hierarchy;
- softer/harder geometry;
- compact/spacious operating surfaces;
- editorial/system typography feel.

### GAP — intentionally deferred

The following are not justified for V2A:

- per-surface independent theme values;
- arbitrary background uploads;
- arbitrary image/object selection;
- arbitrary colors;
- arbitrary typography;
- arbitrary XY placement;
- free-form drag/drop;
- arbitrary component creation;
- arbitrary route creation;
- arbitrary CSS/HTML/JS;
- Research visibility/order;
- embedded full visual-builder canvas;
- automatic screenshot-to-code conversion.

## 18. No new stored controls recommendation

The Architect does not recommend adding a new theme enum or numeric range in V2A.

The current control set already covers the immediate administration need.

Adding more controls before Paulo has used the spatially aligned admin interface would increase API vocabulary, validation surface, test surface, and long-term compatibility burden without demonstrated product value.

Use V2A first. Collect actual GAPs from use. Only then consider V2B.

## 19. Data / API / storage impact

Recommended V2A:

`ZERO SCHEMA CHANGE`

`ZERO D1 MIGRATION`

`ZERO NEW TABLE`

`ZERO NEW API`

`ZERO PUBLIC PROJECTION CHANGE`

`ZERO DESIGNRUNTIME CHANGE`

Preserve all current theme/section tables, enum values, numeric bounds, API paths, stale-write protection, audit actions, public published-only projection, and current preview endpoint.

The UI alias is not data. It belongs in source.

## 20. Security / capability boundary

V2A must preserve the current positive-allowlist model.

No input for CSS, HTML, JavaScript, selectors, class names, custom property names, remote asset URLs, font URLs, arbitrary colors, arbitrary component definitions, or arbitrary route definitions.

Friendly labels must map only to existing fixed enum values.

Surface aliases must map only to existing fixed managed IDs.

Preview destinations must be source-authored fixed paths.

Do not read selectors or URLs from D1.

## 21. Accessibility

The admin control experience should use semantic grouping.

Recommended:

- headings or fieldsets for Atmosphere / Surfaces / Typography / Motion / Collections;
- associated labels for every field;
- descriptive text for non-obvious controls;
- no color-only state communication;
- keyboard-accessible native controls;
- visible focus;
- status messages available to assistive technology where practical;
- sufficiently large controls on mobile;
- no drag-only interaction;
- reduced-motion safety wording that makes its behavior understandable.

## 22. Responsive admin behavior

V2A should ensure:

- one-column control groups at narrow widths;
- buttons wrap rather than overflow;
- managed-surface rows stack cleanly;
- preview links remain tap-accessible;
- labels do not depend on large fixed widths;
- raw technical data does not force horizontal page overflow.

This is admin presentation only. It does not alter public responsive architecture.

## 23. Design Panel result

### Product / Admin UX

APPROVE V2A. The main user problem is terminology and control comprehension, not missing backend capability.

### Frontend Architecture

APPROVE V2A. Use local static metadata in `DesignControls.js`. Do not rename backend IDs. Do not touch the Worker/runtime contract.

### Design Systems

APPROVE V2A. Group existing bounded tokens by purpose. Human-readable option labels may differ from stable stored enum values.

### Security / Capability Boundary

APPROVE V2A. The current allowlisted enum/range architecture should remain intact.

### Accessibility / Responsive

APPROVE WITH IMPLEMENTATION REQUIREMENTS. Use native controls, semantic grouping, narrow-screen stacking and clear state/status language. Do not use drag/drop as the only ordering mechanism.

### Independent Critic

Do not call V2A a free-form canvas editor. Use `Spatial Design Controls` and `Spatial Preview`.

### Layperson / Admin User

A first-time admin should see Entry, Systems, Projects, Contact rather than Home, Process, Projects, About. Draft, Preview, Publish and Deployment must be clearly distinguished.

## 24. SU adversarial disposition

The planning pass challenged five broader alternatives.

### Alternative A — unrestricted visual builder

REJECT FOR V2A.

### Alternative B — rename backend IDs to spatial names

REJECT. Solve the mismatch at the UI layer.

### Alternative C — immediately add Research to managed sections

DEFER. No demonstrated product requirement justifies widening the managed-section contract.

### Alternative D — add new presets/ranges now

DEFER. No current design need requires them.

### Alternative E — embedded visual editor/iframe

DEFER. The existing authenticated real-page preview already renders the actual spatial site.

## 25. Recommended implementation increment

Name:

`SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT`

Proposed future owner-authorized implementation scope:

### Code

- `app/admin/DesignControls.js`

### Tests

Add or update directly necessary tests, preferably:

- `tests/spatial-design-controls-v2.test.mjs`

The focused tests should verify the exact backend-id -> spatial-label mapping, Entry order behavior, managed route ordering, Research preview-only status, fixed preview paths, absence of arbitrary input capabilities, friendly-label enum preservation, publish wording, and secondary raw preview data.

### Documentation

- `docs/product/DESIGN_REFERENCE_WORKFLOW.md`
- `docs/product/UI_UX_SPEC.md`

only where directly necessary.

### Explicitly excluded

Do not modify:

- `app/DesignRuntime.js`;
- public website components;
- `components/site/**`;
- `worker/**`;
- `worker/d1/**`;
- migrations;
- D1 schema/data;
- R2;
- wrangler configuration;
- public design API;
- media;
- content;
- Brand V3 identity;
- Sentinel/S6/S7;
- deployment configuration.

## 26. V2A acceptance evidence

Future Builder handoff should include:

1. exact implementation base/result SHA;
2. exact changed files;
3. focused V2 tests;
4. full `npm test`;
5. `npm run build`;
6. `git diff --check`;
7. applicable validators;
8. source evidence showing backend IDs remain unchanged;
9. source evidence showing no new API/storage fields;
10. source evidence showing no arbitrary styling inputs;
11. desktop admin screenshot;
12. narrow/mobile admin screenshot;
13. Spatial Preview launchpad evidence;
14. Entry preview behavior;
15. Systems preview behavior;
16. Projects preview behavior;
17. Research preview-only behavior;
18. Contact preview behavior;
19. lifecycle wording evidence;
20. confirmation DesignRuntime, Worker, D1 and migrations are unchanged.

Builder UI/browser evidence remains ACTOR_REPORTED until Architect review.

## 27. Migration / dependency assessment

Migration: `NOT REQUIRED`

New dependency: `NOT REQUIRED`

New Worker route: `NOT REQUIRED`

New public route: `NOT REQUIRED`

New D1 table: `NOT REQUIRED`

New runtime capability: `NOT REQUIRED`

## 28. Future V2B threshold

Do not open V2B merely because more customization is technically possible.

A future V2B should require an observed GAP from real use.

## 29. Deployment boundary

V2A implementation acceptance would still not authorize production deployment.

Design-setting publication and code deployment remain distinct operations.

## 30. Architect verdict

`APPROVE SPATIAL DESIGN CONTROLS V2 PLAN FOR PAULO IMPLEMENTATION DECISION`

Recommended implementation:

`V2A — ADMIN UX ALIGNMENT`

The key architectural decision is:

**Do not rebuild WEB-INC-007. Make the existing safe design-control system speak the language of the spatial website.**
