# UI-PATCH-001 — Soft Geometry Pass

Status: `ARCHITECT_APPROVED — IMPLEMENTED`

Owner: Paulo  
Builder: Claude  
Architect/Reviewer: ChatGPT

## Intent

Soften the current MaisogLabs public presentation without changing the approved V3 cinematic composition, content model, navigation model, or public data source.

Target feel:

`cinematic + modern + calm + premium + soft-edged`

Avoid:

`sharp + rigid + HUD-like + heavily technical`

## Why this is not WEB-INC-007

This is a bounded presentation refinement only.

It does **not** implement:
- theme_settings;
- theme_settings_revisions;
- admin theme controls;
- user-editable design tokens;
- free-form CSS/JS;
- draft/preview/publish theme lifecycle.

WEB-INC-007 remains future work.

## Authorized implementation surface

Primary expected file:
- `app/globals.css`

A small component/class-name adjustment is allowed only if strictly necessary to apply the approved visual treatment consistently.

Do not change:
- public content/data source;
- routing;
- auth;
- Worker/D1/R2 behavior;
- project/media schema;
- API surface;
- copy/content;
- logo assets;
- cinematic background asset;
- overall hero/project/process composition.

## Visual changes to make

### Corners / shape language

- increase card/panel corner radii from hard 0–3px treatment toward a restrained soft range;
- use softly rounded CTA/button shapes;
- keep controls premium and architectural, not bubbly;
- soften icon containers where they currently read as hard square frames.

### Panels / glass

- reduce harsh border contrast;
- use gentler glass edges;
- soften shadows;
- preserve enough contrast for legibility;
- avoid excessive blur.

### Spacing

- slightly increase internal panel/card padding where cramped;
- add breathing room around grouped controls;
- preserve current responsive structure and hierarchy.

### Dividers / frames

- reduce the visual hardness of blueprint frames, borders, separators, and panel dividers;
- do not remove the engineered/system identity completely;
- decorative corner-frame language may be softened, shortened, reduced in opacity, or made less dominant.

### Motion

- keep current calm micro-interactions;
- no dramatic animation additions;
- preserve reduced-motion behavior.

### Typography

- do not replace font families;
- only make subtle spacing/line-height adjustments where needed to support the softer visual rhythm.

## Specific existing sharp areas to review

At minimum review:
- `.header-action`
- `.primary-action`
- `.foundation-dock`
- `.foundation-dock a`
- `.dock-icon`
- glass/system panels
- project rail/cards
- process cards/dock
- blueprint frame/corners
- status/metadata panels
- mobile equivalents of the same components

Do not mechanically round every element to the same radius.

Use a small, coherent radius hierarchy.

## Non-negotiables

- no logo redesign;
- no bright cyberpunk palette;
- no generic AI imagery;
- no major recomposition;
- no content rewrite;
- no public data-source change;
- no new dependency;
- no remote resource;
- no deployment;
- no main merge;
- no WEB-INC-007 implementation.

## Acceptance criteria

1. UI clearly reads softer at first glance.
2. Current V3 cinematic identity remains recognizable.
3. Buttons/CTAs no longer look like hard 3px rectangles.
4. Panels/cards no longer feel like sharp HUD boxes.
5. Hierarchy and contrast remain strong.
6. Mobile/responsive layout remains intact.
7. Reduced-motion behavior remains intact.
8. No route, content, API, auth, data, Worker, D1, or R2 behavior changes.
9. `npm test` remains green.
10. `npm run build` remains green.
11. Builder supplies exact before/after changed-file list.
12. Architect independently inspects the CSS/component diff before acceptance.

## Sequencing

This patch is authorized now but **must not begin until WEB-INC-004 remediation is Architect-accepted and its cycle is closed**.

The current WEB-INC-004 turn-lock remains authoritative until that closure.

After closure, UI-PATCH-001 may become the next product cycle without needing a fresh design-direction decision because Paulo explicitly authorized it on 2026-09-20.

Implementation authority does not include deployment or main merge.


## Closure

Implementation:
- `61db9abb3c1f246fdf43850843db7967ab291645`

Architect acceptance:
- `UI-PATCH-001: ARCHITECT_APPROVED`

Accepted outcome:
- softer radius hierarchy;
- softer CTA/card/panel geometry;
- reduced border/divider/shadow hardness;
- responsive/reduced-motion behavior preserved;
- no functional/data/runtime boundary change.

Builder validation:
- `npm test`: 209/209 (`ACTOR_REPORTED`)
- `npm run build`: success (`ACTOR_REPORTED`)
