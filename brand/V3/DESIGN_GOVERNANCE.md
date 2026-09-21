# MaisogLabs V3 Design Governance

Status: `ACTIVE — PROJECT LOCAL RULE`

Design governance ID:
- `DESIGN-GOV-001`

Owner:
- Paulo — Product / Risk Owner

Architect / Design reviewer:
- ChatGPT

Applies to:
- MaisogLabs public website
- MaisogLabs authenticated admin portal
- future MaisogLabs web UI increments and presentation patches

This document governs **how the existing MaisogLabs visual language is extended**. It does not replace Brand V3, Sentinel, the product architecture, or accepted WEB-INC design-control boundaries.

---

## 1. Core rule

> **A new feature must look like MaisogLabs before it looks like the feature it is adding.**

A feature may introduce a new information or interaction pattern when the product genuinely needs it.

A feature may not silently introduce a new:

- brand identity;
- palette;
- typography system;
- spacing system;
- radius system;
- panel/card language;
- icon language;
- motion language;
- navigation language;
- arbitrary visual-code surface.

Consistency is not visual sameness. New patterns are allowed; competing design languages are not.

---

## 2. Source-of-truth hierarchy

For MaisogLabs visual decisions, use this precedence:

1. `brand/V3/README.md` — identity and brand balance.
2. `brand/V3/DESIGN_MAP.md` — approved composition and non-negotiables.
3. `brand/V3/guidelines/V3_DIRECTION.md` — V3 implementation direction.
4. `brand/V3/design-tokens/*` — brand token source.
5. this document — extension/governance rules.
6. `docs/product/UI_UX_SPEC.md` — product-specific UI/UX behavior.
7. `docs/product/DESIGN_REFERENCE_WORKFLOW.md` — screenshot/reference workflow.
8. accepted UI/WEB RFCs, Architect Syncs, ADRs, and bounded implementation records.

Where a lower item conflicts with a higher one, the higher item wins unless Paulo explicitly approves a governed change.

Existing accepted WEB-INC-007 design settings remain a bounded runtime implementation of the design system. This document does not widen those settings into arbitrary styling.

---

## 3. External design-system principles adopted

MaisogLabs adopts these general contribution principles for new reusable UI patterns:

- **Useful** — solves a real user/product need.
- **Unique** — does not duplicate an existing component or pattern.
- **Consistent** — reuses existing foundations/components where appropriate.
- **Usable** — interaction and readability are appropriate, including accessibility considerations.
- **Versatile** — reusable outside a single one-off screen where practical.

These are adapted to a single-product/single-owner project. They are not intended to add ceremony to trivial fixes.

Design foundations are treated as shared decisions—tokens, color roles, spacing, typography, border/radius, elevation, iconography, and motion—rather than values each feature invents independently.

---

## 4. MaisogLabs design character

Target feeling:

`cinematic + modern + calm + premium + engineered + soft-edged`

Avoid:

`generic SaaS + gaming HUD + neon cyberpunk + bubbly consumer app + random sci-fi`

Brand balance remains:

- technology / systems dominant;
- disciplined classical/architectural influence;
- restrained exploration/space influence.

The orbital identity remains locked unless Paulo explicitly authorizes a brand redesign.

---

## 5. Foundations

New UI should use existing foundations first.

### 5.1 Color

Use semantic roles rather than feature-specific random colors.

Current brand/runtime vocabulary includes:

- deep/night surfaces;
- warm ivory primary text;
- muted secondary text;
- cobalt/tech-blue primary accents;
- restrained teal/violet approved secondary accents;
- success/status color where semantically appropriate.

Rules:

- no new bright palette merely to distinguish a feature;
- do not use a unique color per Chronicle entry type;
- states should be distinguishable with label/icon/text as well as color;
- contrast/readability takes priority over decorative subtlety.

### 5.2 Typography

Roles:

- editorial/major display;
- UI/body sans;
- technical/metadata mono where appropriate.

A feature may not introduce another font family without a separately approved brand/composition change.

Hierarchy should be produced through defined roles, scale, weight, spacing, and composition—not ad-hoc font choices.

### 5.3 Spacing

Use a limited, repeatable spacing scale.

Feature code should prefer existing layout/card/form spacing before introducing a new value.

Small deviations needed for optical alignment are acceptable as a bounded design patch; new layout-scale values should be reusable.

### 5.4 Radius / soft geometry

Accepted hierarchy:

- controls / small interactive elements: least rounded;
- cards / editor panels: medium;
- major panels / frames: most rounded.

Current runtime baseline derives from:

- `--radius-sm-base`
- `--radius-md-base`
- `--radius-lg-base`

UI-PATCH-001 remains the approved soft-geometry direction.

Avoid:
- zero-radius hard HUD boxes unless structurally necessary;
- excessive pillification;
- cartoon/bubble aesthetics.

### 5.5 Border and elevation

Default language:

- thin;
- low-contrast;
- cool-toned;
- restrained elevation;
- glass only where it clarifies hierarchy.

Selected/focused states may increase emphasis.

Do not use heavy shadows/glow merely to make a feature feel “important.”

### 5.6 Motion

Motion must feel:

- calm;
- engineered;
- purposeful;
- short enough not to obstruct work.

Use motion for:
- transition/context;
- state change;
- hierarchy;
- subtle continuity.

Never require motion to understand content.

Existing `prefers-reduced-motion` behavior remains binding.

WEB-INC-007's `respect-system` / `always-reduced` model remains binding.

### 5.7 Focus / interaction states

Every new keyboard-interactive control must have a visible focus state.

Hover cannot be the sole way to reveal necessary meaning.

Disabled/loading/error/success/conflict states should be explicit and not inferred only through opacity/color.

### 5.8 Responsive behavior

Every meaningful new public/admin pattern must define:

- desktop composition;
- narrow/mobile composition;
- overflow behavior;
- touch target behavior;
- long-content behavior.

Do not treat mobile as “desktop but squeezed.”

---

## 6. Reusable component families

Future UI should map to an existing family before creating a new one.

### Public

- site header/navigation;
- section shell;
- glass/system panel;
- public content card;
- filter chip/tab;
- CTA/button;
- metadata label;
- status/milestone badge;
- reading/detail surface;
- empty/loading/error state.

### Admin

- admin navigation/shell;
- editor panel;
- list/record row;
- form field;
- select;
- textarea;
- range/toggle;
- status badge;
- Save Draft / Preview / Publish action group;
- validation/conflict message;
- loading/error/success state;
- bounded media selector.

### Chronicle additions

Chronicle may introduce these as reusable MaisogLabs component patterns:

- timeline spine;
- timeline node;
- Chronicle event card;
- entry-type label;
- project filter rail;
- milestone emphasis;
- Chronicle detail/read view.

They must be built from the existing foundations above.

---

## 7. Approved higher-level patterns

### 7.1 Draft → Preview → Publish

Binding for public-affecting admin content/design where supported:

`EDIT → SAVE DRAFT → PREVIEW → PAULO REVIEW → PUBLISH`

A draft is never equivalent to a public change.

### 7.2 Two-pane admin editor

For content-heavy authoring such as Chronicle:

Desktop:
`record list / filters | editor / preview actions`

Narrow/mobile:
`record list → editor → preview`

Do not force a permanent two-column layout on narrow screens.

### 7.3 Filter rail

For bounded categorical browsing:

- short explicit labels;
- clear selected state;
- keyboard accessible;
- horizontally scrollable on narrow viewports if necessary;
- avoid excessive category/color coding.

### 7.4 Timeline

A timeline is an information structure, not decorative sci-fi UI.

Use:
- restrained vertical spine;
- small cobalt/approved accent nodes;
- clear date grouping;
- cards/panels using MaisogLabs geometry;
- larger but restrained milestone nodes where hierarchy requires.

Avoid:
- constantly animated glowing lines;
- particle effects;
- gaming-HUD coordinates that do not carry information;
- decorative complexity that reduces scanability.

---

## 8. Public vs admin visual relationship

The public site and admin portal belong to the same system but have different jobs.

### Public

Priority:
- narrative;
- atmosphere;
- brand;
- readable hierarchy;
- restrained interaction.

Public pages may use the full cinematic environment.

### Admin

Priority:
- clarity;
- speed;
- density;
- confidence in state;
- obvious save/preview/publish boundaries.

The admin should feel like **MaisogLabs operating software**, not a generic unstyled form and not a theatrical public landing page.

Admin should reuse:
- color roles;
- typography roles;
- spacing/radius;
- buttons;
- panels;
- form controls;
- status badges;
- focus behavior;
- error/loading/success language.

It does not need cinematic background imagery behind every editing surface.

---

## 9. Screenshot / reference workflow

Reference screenshots are **input for analysis**, never executable styling instructions.

Required flow:

`REFERENCE → ANALYZE → MAP → DRAFT → VISUAL PREVIEW → REVIEW → PUBLISH`

Every requested visual characteristic is classified:

### DIRECT MATCH
Already expressible using accepted MaisogLabs foundations/components/settings.

### APPROXIMATION
Can be expressed safely using existing patterns but will not be pixel-identical.

### GAP
Requires a new reusable component/pattern/foundation decision.

A GAP must never silently result in:

- arbitrary CSS injection;
- direct DB styling;
- one-off ungoverned component;
- new runtime token;
- copied third-party visual identity.

A GAP is proposed through the change classes below.

Third-party references may inform:
- layout relationships;
- hierarchy;
- spacing;
- geometry;
- visual density;
- interaction patterns;
- color relationships.

Do not intentionally copy third-party:
- logos;
- proprietary copy;
- unique illustrations;
- photography;
- trademark identity

unless Paulo has rights to use them.

---

## 10. Design change classes

These are project-level classification aids. Sentinel change policy still controls governance-significant authority.

### DESIGN-PATCH

Examples:
- spacing correction;
- alignment fix;
- small radius adjustment;
- minor responsive correction;
- typography rhythm fix.

Requirements:
- bounded scope;
- preserve foundations;
- before/after evidence where visually meaningful;
- review.

Does not require a full architecture cycle unless the patch crosses another architectural/security boundary.

### COMPONENT-EXTENSION

Examples:
- Chronicle event card;
- filter-chip variant;
- admin editor row;
- reusable empty state.

Requirements:
- explain why an existing component is insufficient;
- map to existing foundations;
- responsive/accessibility behavior;
- Architect review.

### PATTERN-ADDITION

Examples:
- Chronicle timeline;
- two-pane editorial workspace;
- new major navigation pattern.

Requirements:
- explicit proposal;
- Paulo gate;
- component/foundation mapping;
- desktop + mobile evidence;
- interaction/accessibility review.

### BRAND / COMPOSITION CHANGE

Examples:
- palette replacement;
- logo change;
- new typography family;
- major homepage recomposition;
- replacement of V3 cinematic environment.

Requirements:
- explicit Paulo approval;
- governed design/architecture decision;
- revised Brand V3 source-of-truth artifacts where accepted.

No feature request implicitly grants this class of authority.

---

## 11. Contribution checklist

Before accepting a meaningful new reusable component/pattern, review:

### Need
- What user/product problem does it solve?
- Is the need real now?

### Existing system
- Can current components/tokens already express it?
- Is this actually a variant rather than a new component?

### Consistency
- Does it preserve Brand V3?
- Does it use semantic roles/tokens?
- Does it preserve soft geometry?

### Interaction
- keyboard;
- focus;
- touch;
- loading;
- error;
- success;
- conflict;
- reduced motion.

### Responsive
- desktop;
- mobile/narrow;
- long content;
- overflow.

### Evidence
For meaningful visual work:
- desktop screenshot;
- mobile screenshot;
- before/after where relevant;
- reference-to-implementation mapping if reference-driven.

---

## 12. Chronicle binding direction

Chronicle design name:

**MaisogLabs Chronicle — Cinematic Engineering Timeline**

Public header concept:

**MAISOGLABS / CHRONICLE**

`Ideas → Experiments → Problems → Decisions → Builds → Lessons`

Chronicle should use:

- existing V3 cinematic background/environment;
- existing dark/cobalt atmosphere;
- existing soft geometry;
- existing glass/panel treatment;
- existing typography roles;
- existing motion/reduced-motion behavior;
- existing runtime theme settings where applicable.

Entry types may include:

- IDEA
- BUILD
- ISSUE
- FIX
- REALIZATION
- TAKEAWAY
- MILESTONE
- NEXT
- JOURNAL

Do not assign a rainbow palette to entry types.

Differentiate primarily through:
- label;
- icon;
- hierarchy;
- small approved accent variations.

Milestones may receive:
- larger timeline node;
- slightly stronger panel emphasis;
- wider layout where appropriate.

They do not get a separate visual brand.

---

## 13. Chronicle admin direction

The Chronicle authoring UI must live in the authenticated MaisogLabs admin portal.

Target desktop pattern:

`navigation | Chronicle record list | editor / preview actions`

Target constrained implementation may collapse navigation/list/editor according to existing admin architecture, but must preserve the same information hierarchy.

Editor fields should use standard MaisogLabs admin controls.

Primary action group:

- Save Draft
- Preview
- Publish
- Unpublish where applicable

State must always be visible:
- Draft
- Published
- Published + Draft
- Archived/unpublished
- saving
- conflict
- validation error
- success

Public safety reminder should be visible near authoring:

> **PUBLIC CHRONICLE — Do not include credentials, private architecture, exploitable security detail, confidential project-brain material, or secrets.**

---

## 14. Token strategy

Existing token assets remain authoritative:

- `brand/V3/design-tokens/design-tokens.json`
- `brand/V3/design-tokens/brand-colors.css`
- semantic/runtime CSS custom properties in `app/globals.css`
- WEB-INC-007's validated runtime theme vocabulary.

Do **not** introduce a new token framework merely for standards compliance.

The Design Tokens Community Group 2025.10 format may be used as an interoperability reference if a future real workflow needs cross-tool token exchange.

Any token-format migration must:
- preserve current visual output;
- provide a concrete tooling/workflow benefit;
- be separately reviewed.

---

## 15. No-go rules

Do not:

- redesign the orbital logo without explicit brand approval;
- introduce generic AI-brain/robot imagery;
- introduce bright cyberpunk palette;
- bake UI/text into background art;
- add free-form admin styling;
- add arbitrary CSS/JS/HTML design fields;
- introduce one-off colors/radii/spacing without checking foundations;
- use motion that overrides reduced-motion preferences;
- make Chronicle/admin look like a separate product;
- copy third-party identity;
- allow a reference screenshot to bypass the design system.

---

## 16. Governance relationship

This is a **MaisogLabs project-level design Local Rule**.

It may:
- strengthen visual consistency;
- define how project UI proposals are reviewed;
- constrain feature UI implementation.

It may not:
- weaken Sentinel core rules;
- grant deployment/remote authority;
- widen WEB-INC-007's bounded design inputs;
- override Brand V3;
- authorize product implementation by itself.

Future MaisogLabs UI work should cite `DESIGN-GOV-001` when it introduces or materially changes presentation.

---

## 17. Evidence status

At adoption:

- Brand V3 artifacts: repository-grounded.
- current V3/soft-geometry/runtime design foundations: repository-grounded and accepted by prior WEB/UI cycles.
- this governance document: project Local Rule approved by Paulo and Architect.
- no runtime/code change is introduced by adopting this document.
