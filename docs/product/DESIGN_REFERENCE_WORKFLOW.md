# Design Reference Workflow

Status: `AUTHORIZED WORKFLOW — WEB-INC-007 SUPPORT REQUIREMENT`

Owner: Paulo  
Architect: ChatGPT  
Builder / Applier: Claude

## Purpose

MaisogLabs should support a practical reference-driven design workflow:

```
Paulo uploads a UI screenshot to ChatGPT
        ↓
Architect analyzes the visual system
        ↓
Architect produces a structured Design Reference Plan
        ↓
Plan is mapped to the bounded WEB-INC-007 controls
        ↓
Claude applies the mapped settings through the authenticated admin design controls
        ↓
Preview is generated/reviewed
        ↓
Paulo approves or requests changes
        ↓
Only then is the design published
```

This workflow is intended to make the admin design system useful for real-world inspiration without turning it into an unrestricted visual-code editor.

## Important architectural boundary

The uploaded screenshot is **reference input to the Architect**, not executable site content.

The screenshot does not need to be:

- uploaded into D1;
- stored as theme data;
- converted into arbitrary CSS;
- passed to a website-resident AI model;
- committed to the repository unless Paulo explicitly asks.

The MaisogLabs application stores only the validated design settings already authorized by WEB-INC-007.

Therefore this workflow does **not** require an LLM subscription or image-analysis model inside MaisogLabs itself.

## Architect responsibilities

When Paulo supplies a reference screenshot, the Architect should analyze at least:

- composition and hierarchy;
- spacing/density;
- card and panel geometry;
- background treatment;
- typography character and scale;
- border/shadow/glass treatment;
- accent usage;
- section order and visibility;
- project-card/rail behavior;
- Journal-card behavior;
- motion cues that can be reasonably inferred from a still image;
- responsive implications where inferable;
- elements that must remain unchanged because of MaisogLabs Brand V3 constraints.

The Architect must distinguish:

1. **DIRECT MATCH** — expressible with an existing WEB-INC-007 control;
2. **APPROXIMATION** — expressible only approximately with the existing presets/ranges;
3. **GAP** — not expressible by the currently authorized design controls.

A GAP must not be silently converted into a source-code edit.

## Design Reference Plan format

The Architect's plan should provide a bounded mapping such as:

- Reference objective
- Surfaces affected
- Preserve
- Theme controls
  - hero background preset
  - card style
  - density
  - typography
  - heading scale
  - overlay intensity
  - panel preset
  - animation preset
  - reduced-motion mode
  - project rail mode
  - Journal card mode
  - accent preset
  - panel opacity
  - border intensity
  - radius scale
- Section controls
  - home visibility/order
  - projects visibility/order
  - process visibility/order
  - about visibility/order
- Direct matches
- Approximations
- Gaps
- Preview acceptance criteria
- Publish decision

The plan must use only values allowed by the active WEB-INC-007 contract.

## Claude application rule

Claude should apply an approved Design Reference Plan through:

1. the authenticated admin design-control UI; or
2. the exact same bounded authenticated design APIs that back that UI, if browser interaction is unavailable.

Claude must not bypass the control layer by:

- directly updating D1;
- editing theme rows by raw SQL;
- injecting CSS/JS/HTML;
- changing `app/globals.css` merely to reproduce a screenshot;
- changing components/layout code;
- adding arbitrary presets;
- adding new public routes.

Any required source-code expansion is a separate proposed product/design patch and requires a new governance decision.

## Draft-first rule

A screenshot-driven design application is draft-first.

Claude may:

- enter the mapped controls;
- save a draft;
- generate/use the authenticated preview;
- collect before/after evidence.

Claude must not treat a screenshot match as automatically approved for public publication.

The normal expected flow is:

`APPLY DRAFT → PREVIEW → PAULO REVIEW → PUBLISH`

## Preview review

The Architect should compare the preview against:

- the reference screenshot's relevant visual characteristics;
- MaisogLabs Brand V3 non-negotiables;
- the approved soft-geometry direction;
- responsive behavior;
- readability/contrast;
- reduced-motion compatibility.

The review should state what matched, what was approximated, and what remains outside the control system.

## Third-party reference hygiene

A reference screenshot may inspire:

- layout relationships;
- spacing;
- hierarchy;
- geometry;
- visual density;
- color relationships;
- interaction patterns.

Do not intentionally reproduce third-party:

- logos;
- brand marks;
- proprietary copy;
- unique illustrations;
- photography;
- trademarked identity elements

unless Paulo has rights to use them.

## No-silent-expansion rule

If Paulo requests a screenshot-driven result that WEB-INC-007 cannot express, the Architect must say so clearly and classify the missing capability.

The next step may be:

- accept an approximation;
- propose a new bounded preset;
- propose a separate presentation patch;
- propose a future visual-builder capability.

It must never silently bypass governance by turning the screenshot into arbitrary production code.

## WEB-INC-007 implementation implication

The Builder should ensure the final WEB-INC-007 admin design UI and APIs are sufficiently deterministic that an Architect-generated Design Reference Plan can be applied repeatably.

This requires:

- clear control names;
- visible allowed values;
- stable ranges;
- deterministic draft state;
- explicit Preview;
- explicit Publish;
- clear validation errors;
- no hidden/unstructured design fields.

No additional table, public route, free-form styling capability, remote resource, or AI runtime is authorized by this workflow.
