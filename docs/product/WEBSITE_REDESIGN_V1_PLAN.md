# MaisogLabs Website Redesign V1 — Spatial Lab Interface

Status: `ARCHITECT-APPROVED DESIGN PROPOSAL — IMPLEMENTATION NOT AUTHORIZED`

Architect Sync: `ML-DEVOS-AS-104`

Owner: Paulo — Product / Risk Owner

Architect / Design reviewer: ChatGPT

Authority: `D-075`

Reviewed repository tip:

`eb2cb0a8e40425e0d54db073cf9846ded3182f82`

## 1. Design decision

Website Redesign V1 adopts a **single persistent MaisogLabs spatial environment** derived from the Claude v10 design reference.

The public experience becomes:

`00 ENTRY`

with four primary destinations:

`SYSTEMS · PROJECTS · RESEARCH · CONTACT`

The four destinations open as bounded spatial work surfaces over the persistent cinematic environment rather than becoming one long generic SaaS-style scrolling page.

This is a deliberate Brand / Composition Change.

The Claude artifact is design/reference evidence.

It is not repository authority and must not be copied blindly.

The implementation must conform to the accepted MaisogLabs brand, content, accessibility, governance and evidence boundaries in this plan.

## 2. Why this direction survives the Design Panel

The single-environment model gives MaisogLabs a clearer identity than the current long-scroll composition.

It reinforces the core idea that MaisogLabs is a laboratory of connected systems rather than a list of services.

The retained strengths are:

- one recognizable cinematic environment;
- canonical orbital identity as the visual center;
- systems/trajectory language that has informational meaning;
- project exploration based on relationships rather than generic cards;
- Research presented as actual lab evidence;
- Contact treated as the end of the same trajectory instead of a detached SaaS conversion block;
- restrained spatial interaction instead of decorative page transitions.

The redesign must remain a website first and a visual experience second.

Meaning, clarity, proof and interaction outrank atmosphere.

## 3. Design Panel synthesis

### Brand / Art Direction

APPROVE the spatial/cinematic concept.

Preserve:

- the canonical MaisogLabs orbital identity;
- deep-space / architectural visual tension;
- dark/night surfaces;
- warm-ivory primary text;
- cobalt/tech-blue primary interaction language;
- restrained architecture;
- restrained space/exploration imagery;
- soft-edged engineered geometry;
- functional rather than decorative system graphics.

Reject:

- generic SaaS card grids as the primary composition;
- bright cyberpunk;
- excessive glow;
- random planets or architecture added only for spectacle;
- generic AI brains/robots;
- gaming-HUD overload;
- decorative metrics or invented telemetry.

### Information Architecture / UX

APPROVE:

`Entry → Systems / Projects / Research / Contact`

The Entry surface must answer, without requiring interaction:

1. what MaisogLabs is;
2. who is behind it;
3. what kind of work it builds;
4. what the four destinations contain.

The primary navigation must therefore use explicit words:

- Systems
- Projects
- Research
- Contact

Do not substitute coded labels that require prior knowledge.

The numeric spatial labels such as `00 / Entry` and `01 / Systems` may remain as secondary technical metadata.

### Interaction / Motion

APPROVE hash-addressable spatial panels.

Required behaviors:

- `#systems`
- `#projects`
- `#research`
- `#contact`
- no hash means Entry;
- browser Back / Forward preserves navigation;
- Escape returns an open surface to Entry;
- activating the wordmark returns to Entry;
- focus moves into a newly opened surface;
- focus returns predictably when the surface closes;
- keyboard interaction is equivalent to pointer interaction;
- hover never contains essential information.

Motion must be calm and explain state.

Motion is not required to understand content.

### Frontend Feasibility

The redesign does not require:

- a new backend;
- a new D1 schema;
- a new R2 runtime architecture;
- a new authentication path;
- a generic visual builder;
- arbitrary styling input;
- a website-resident AI model.

The spatial experience can remain inside the existing Next.js/public presentation layer.

Existing public content remains the factual source.

Existing public Journal APIs remain the factual source for Research.

WEB-INC-007 remains the bounded theme/settings layer.

### Responsive / Accessibility

The desktop navigation from the reference is not accepted unchanged for narrow viewports.

At narrow/mobile widths use:

- compact canonical wordmark;
- explicit `MENU` / `LAB MENU` control;
- four large touch-accessible destinations;
- clear active state;
- minimum practical touch targets;
- no interaction that depends on hover.

Each work surface must become a deliberate mobile layout rather than a squeezed desktop panel.

Reduced-motion preference remains binding.

Visible focus remains binding.

### Independent Critic

The spatial concept is strong enough to retain.

The critic rejects the following failure modes:

- dark full-screen rectangles that erase the cinematic environment completely;
- blueprint diagrams that communicate no real information;
- invented technical facts added to make a project look sophisticated;
- excessive route animation;
- continuous unseen animation behind an opaque panel;
- ornamental linework that exceeds the information it communicates;
- treating the prototype as strong merely because it looks polished.

Every diagram must explain something.

Every motion must communicate state.

Every public factual claim must come from approved content or a real public data source.

### Layperson / First-Time Visitor

A visitor with no MaisogLabs context must be able to understand the site from Entry alone.

Required first-visit message:

MaisogLabs is Paulo Maisog's independent technology lab.

The visitor should understand that the lab works with AI/automation, research, software/systems and security-related engineering work.

The exact final sentence may be refined during implementation using already-approved content, but it must remain plain language.

The visitor must not have to understand:

- Sentinel terminology;
- internal governance IDs;
- agent architecture;
- unexplained project acronyms;
- research jargon

before knowing what the site is.

## 4. Entry surface

Entry remains the only visual world/background.

Required hierarchy:

1. canonical MaisogLabs orbital identity;
2. MAISOG LABS name;
3. `Ideas in orbit` or the currently accepted tagline treatment;
4. plain first-visit descriptor;
5. primary navigation;
6. restrained location/system metadata where useful.

The large animated mark may be used only if it remains faithful to the canonical orbital identity.

A still fallback is mandatory.

Do not place essential UI text inside the background image/video.

## 5. Hero composition change

The Claude `plate-hero-v4` composition is recommended as the new V3 spatial website plate.

This is a deliberate change from the previous V3.1 Earth-left / architecture-right composition.

The accepted new composition may use:

- Earth horizon as the lower spatial anchor;
- classical architecture at the lateral edges;
- open central sky/space as negative space;
- restrained orbital/system trajectories;
- deep-blue night atmosphere.

If Paulo authorizes implementation, the relevant Brand V3 composition/asset source-of-truth documents must be updated so the repository no longer claims the superseded V3.1 placement map is the active website composition.

This is a composition change, not a brand-identity replacement.

## 6. Systems surface

Systems is the conceptual map of MaisogLabs.

V1 discipline vocabulary:

- AI
- Automation
- Research
- Security
- Systems
- Architecture

Desktop may use the Claude-style relationship/orbit diagram.

The selected discipline must also have a plain-text representation containing:

- discipline name;
- short explanation;
- connected disciplines;
- related projects only when that relationship is explicitly represented in approved content.

No relationship may be invented merely to fill the diagram.

On mobile:

- textual discipline selection is primary;
- relationship information stacks vertically;
- the orbit diagram may simplify substantially;
- all information represented visually must remain accessible textually.

## 7. Projects surface

Projects becomes a typography-led project explorer rather than a generic card carousel.

Use the existing published project content as factual baseline.

The selected project may show:

- title;
- category;
- summary;
- approved tags/technologies;
- approved status where available;
- approved destination URL where available;
- an optional system-flow figure.

The system-flow figure is allowed only when explicit flow data exists.

Do not infer or fabricate process stages.

If no approved flow exists, omit the flow figure or show a neutral absence state.

The Claude prototype project set and descriptions must not automatically replace repository-published project facts.

Publication of new project names, statuses, descriptions or technical claims requires explicit owner-approved content.

## 8. Research surface

Research must use real MaisogLabs Journal data.

Reuse the existing public read-only Journal API:

- `GET /api/journal`
- `GET /api/journal/:slug`

Do not ship the prototype's example research notes/dates as production facts.

Research surface requirements:

- real published entries only;
- newest-first behavior consistent with the public Journal contract;
- loading state;
- empty state;
- error state;
- accessible entry selection;
- detail reading view or explicit link into the existing Journal detail experience.

The existing `/journal` page remains valid.

The homepage Research surface is a presentation/integration layer, not a replacement database.

## 9. Contact surface

Contact is the visual end of the site trajectory.

Retain the restrained concept:

`Humanity orbits higher.`

Use the repository-approved contact address from public content.

Do not replace the repository address with a prototype/reference address without a separate owner-approved content change.

Contact may include:

- email action;
- Copy address;
- short invitation;
- small copyright/location/legal line.

Do not turn Contact into a large conversion funnel.

## 10. Process treatment

There is no separate scrolling Process section in the spatial design.

The existing process principles are not discarded.

They move into places where they carry meaning:

- Systems relationships;
- optional real project flow;
- Research methodology/evidence;
- project descriptions.

Do not manufacture a decorative four-step process solely to preserve the old layout.

## 11. About treatment

There is no large standalone About section.

Paulo is introduced once in the Entry first-visit descriptor.

A short identity statement may appear in Contact.

Avoid repeated biography.

## 12. Footer treatment

There is no large conventional footer below the site because the spatial site does not depend on long vertical scrolling.

Required footer/legal information may appear as a restrained Entry or Contact edge treatment.

Do not repeat the full animated mark in the footer.

## 13. Typography

Do not introduce Montserrat as a new brand font in this implementation.

Retain existing Brand V3 typography roles:

- editorial/display role;
- Inter or existing approved UI sans role;
- IBM Plex Mono / approved mono role.

The Claude reference may guide:

- scale;
- spacing;
- letter spacing;
- hierarchy;
- weight relationships.

It may not silently replace the approved type system.

## 14. Geometry

Use MaisogLabs soft geometry.

Spatial work surfaces should feel like large operating surfaces rather than hard modal boxes.

Target:

- restrained radius;
- thin low-contrast borders;
- controlled glass/opaque-night surfaces;
- significant breathing room;
- background atmosphere visible around the surface where practical.

Avoid:

- sharp HUD boxes;
- excessive pill shapes;
- over-rounded consumer-app panels.

## 15. Motion model

Map motion onto existing WEB-INC-007 behavior.

### Calm / normal

Allowed:

- gentle route transition;
- small trajectory draw;
- restrained logo motion;
- very low parallax on hover-capable desktop;
- selected-node transitions.

### Minimal

Allow:

- opacity/position state transition only;
- no continuous orbit motion;
- no pointer parallax.

### Off / reduced motion

Use static states.

No auto route motion.

No parallax.

No continuous decorative animation.

### Runtime lifecycle

When any major work surface is open:

- pause nonessential Entry video;
- stop/request no unnecessary background animation frames;
- freeze pointer-depth work;
- retain only the minimum state transition needed for continuity.

Also pause relevant media when the document is not visible.

## 16. Mobile model

Breakpoint behavior must be designed explicitly.

At narrow/mobile widths:

### Header

Show:

- canonical compact wordmark;
- one menu trigger.

Menu opens a simple vertical route list:

- Systems
- Projects
- Research
- Contact

### Entry

Prioritize:

- identity;
- tagline;
- plain descriptor;
- menu.

Do not squeeze desktop trajectory graphics around the text.

### Systems

Use a horizontal or vertical discipline selector.

Textual relationship information is primary.

Diagram may reduce to a simpler network.

### Projects

Selector becomes:

- horizontally scrollable route/list;
- or stacked previous/next control.

Selected project content becomes one vertical column.

### Research

One-column entries.

### Contact

One-column correspondence surface.

No horizontal overflow.

No content hidden behind the mobile browser chrome.

## 17. Accessibility requirements

Implementation acceptance requires:

- semantic navigation;
- skip path to meaningful content;
- visible focus;
- route surface headings;
- `aria-current` where appropriate;
- `aria-pressed` for selectors;
- Escape behavior;
- deterministic focus entry/return;
- browser Back/Forward behavior;
- keyboard selection of discipline/project lists;
- no hover-only content;
- reduced-motion compliance;
- appropriate decorative `aria-hidden`;
- readable contrast;
- touch-accessible controls.

The project must not claim comprehensive accessibility certification merely from implementation.

## 18. WEB-INC-007 mapping

### DIRECT MATCH

Existing WEB-INC-007 can directly support:

- cinematic/deep-night background vocabulary;
- cobalt accent;
- panel opacity;
- border intensity;
- radius scaling;
- layout density influence;
- animation preset;
- reduced-motion mode;
- card/panel surface vocabulary;
- typography-role presets where compatible.

### APPROXIMATION

Existing controls can approximate:

- Claude panel darkness;
- glass level;
- visual density;
- selected-state emphasis;
- heading scale;
- research-card surface treatment.

### GAP

The following require bounded source/component work:

- single-screen spatial route shell;
- hash-addressable work surfaces;
- focus/history/Escape route behavior;
- mobile route menu;
- Systems relationship visualization;
- project selector/detail workspace;
- optional real system-flow figure;
- homepage Research integration;
- Contact trajectory endpoint;
- cinematic media lifecycle;
- v10-specific responsive composition;
- new approved cinematic hero plate;
- approved animated canonical-mark media.

No GAP may be implemented as arbitrary runtime CSS/HTML/JS input.

## 19. WEB-INC-007 compatibility contract

WEB-INC-007 must continue to operate.

No D1 schema or mutation API change is required for Website Redesign V1.

The existing four managed section IDs remain:

- `home`
- `projects`
- `process`
- `about`

Spatial presentation mapping:

- `home` → Entry content;
- `projects` → Projects route/surface;
- `process` → Systems route/surface;
- `about` → Contact route/surface.

Research remains outside managed section visibility/order, consistent with the Journal being a separate public feature today.

`DesignRuntime` may be minimally adapted so a fixed managed section ID can apply its existing published visibility/order value to the directly corresponding route trigger and route surface.

This must remain fixed/hardcoded.

Do not accept arbitrary selectors or server-provided CSS.

Visibility must hide both the relevant route trigger and its surface.

A direct hash to a hidden managed surface must fail safely back to Entry.

Existing section order must influence the managed route trigger order without changing backend semantics.

No D1 migration is required.

## 20. Content integrity

Production V1 must not publish prototype-only evidence as fact.

Specifically:

- no fake research entries;
- no fake publication dates;
- no invented project status;
- no invented metrics;
- no invented stacks;
- no invented external URLs;
- no invented project flow;
- no invented security/research claims.

Use:

- repository-approved public content;
- public Journal API data;
- owner-approved future content.

## 21. Asset map

Recommended new production assets after owner authorization:

### Entry cinematic plate

Source reference:

`plate-hero-v4.png`

Purpose:

single Entry environmental plate.

Must remain decorative and contain no baked-in essential UI text.

### Animated canonical mark

Source reference:

`logo-mark.mp4`

Purpose:

hero/Entry mark motion only.

Requirements:

- canonical identity preserved;
- muted;
- inline playback where supported;
- still-poster fallback;
- reduced-motion static mode;
- lifecycle pause rules.

### Logo-mark poster

Purpose:

still/reduced-motion/loading fallback.

### Wide lockup animation

Not required for Website Redesign V1.

Do not add redundant motion merely because an asset exists.

Existing canonical SVG assets remain required for static identity and fallback usage.

## 22. Brand source-of-truth updates required if implementation is accepted

If Paulo accepts this composition for implementation, the implementation cycle should update only the directly affected design-source documents:

- `brand/V3/DESIGN_MAP.md`
- `brand/V3/ASSET_MAP.json`
- `brand/V3/guidelines/V3_DIRECTION.md`
- `docs/product/UI_UX_SPEC.md`

The Brand V3 identity itself remains V3.

The composition may be recorded as the next approved V3 spatial website composition rather than creating a new brand identity/version unnecessarily.

## 23. Exact proposed implementation boundary

A later owner implementation decision may authorize only directly necessary changes in:

### Public presentation

- `app/page.js`
- `app/globals.css`
- `app/DesignRuntime.js`
- `components/site/**`
- `components/Logo.js` only if directly necessary to restore/use the canonical identity correctly

### Public content contract where directly necessary

- `data/site.js`
- `lib/content/schema.mjs`
- `tests/content.test.mjs`

Any schema extension must be local static-content schema only.

No D1 schema migration is authorized by this proposal.

### Design source documentation

- `brand/V3/DESIGN_MAP.md`
- `brand/V3/ASSET_MAP.json`
- `brand/V3/guidelines/V3_DIRECTION.md`
- `docs/product/UI_UX_SPEC.md`

### New public media

Only approved Website Redesign V1 assets under bounded `public/` paths:

- cinematic hero plate;
- canonical mark motion file;
- canonical mark poster/fallback.

### Tests

- directly necessary website-redesign tests;
- directly necessary DesignRuntime regression tests;
- existing content tests where schema/content changes require updates.

No implementation authority exists until Paulo explicitly authorizes it.

## 24. Explicitly excluded implementation scope

Do not modify as part of Website Redesign V1 implementation:

- Worker authentication;
- D1 schema;
- migrations;
- remote D1;
- remote R2;
- admin mutation authorization;
- arbitrary design fields;
- Sentinel/S6/S7;
- Context Plane;
- deployment configuration;
- Cloudflare production;
- protected/main;
- PR #10 merge.

Do not perform a public content cutover or production publish merely because local UI implementation succeeds.

## 25. Implementation acceptance evidence

Before Architect acceptance, Builder should provide:

### Code/build

- repository test suite;
- production/static build;
- `git diff --check`;
- applicable validators.

### Desktop visual evidence

At minimum:

- Entry;
- Systems;
- Projects;
- Research;
- Contact.

### Mobile visual evidence

At minimum:

- Entry/menu;
- Systems;
- Projects;
- Research;
- Contact.

### Interaction matrix

Verify:

- direct hash;
- Entry return;
- Escape;
- browser Back;
- browser Forward;
- keyboard route navigation;
- Systems keyboard selection;
- Projects keyboard selection;
- focus entry;
- focus return;
- hidden managed route behavior;
- Copy address;
- Journal loading/empty/error/success.

### Motion matrix

Verify:

- normal motion;
- WEB-INC-007 minimal;
- WEB-INC-007 off;
- `prefers-reduced-motion`;
- nonessential media paused behind an open surface;
- hidden-tab media pause.

### Content-integrity check

Verify no prototype-only:

- research article;
- date;
- status;
- metric;
- project technical fact;
- URL;
- contact address

was promoted without approved source.

## 26. Deployment boundary

Website Redesign V1 implementation acceptance is not production deployment authority.

Normal future sequence:

`PAULO IMPLEMENTATION AUTHORIZATION`

→ `CLAUDE IMPLEMENTATION`

→ `ARCHITECT REVIEW`

→ `PAULO PREVIEW/PUBLISH DECISION`

→ separate production/deployment authority where required.

## 27. Design Panel verdict

`APPROVE WEBSITE REDESIGN V1 FOR OWNER IMPLEMENTATION DECISION`

The Claude v10 spatial concept is accepted as the primary design direction subject to this plan.

The reference is not accepted byte-for-byte.

The accepted result is:

**MaisogLabs as one cinematic lab environment with evidence-bearing Systems, Projects, Research and Contact work surfaces.**

Implementation remains unauthorized until Paulo explicitly opens the next bounded cycle.
