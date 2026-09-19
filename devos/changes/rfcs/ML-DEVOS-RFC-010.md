# ML-DEVOS-RFC-010: MaisogLabs WEB-INC-007 Theme / Design Controls

Status: `ACCEPTED`

Change class: `ARCHITECTURE`

Product increment: `WEB-INC-007 — Theme / Design Controls`

Repository-grounded base: `d41dc1c3c3203ebab1b009d94bdfac17f490bd22`

## Baselines

- Frozen Sentinel architecture: `ML-DEVOS-ARCH-001 / v1.2.0`
- Active Sentinel governance-capability baseline: `v1.5.0`
- Dependency-ordered WEB increments 001/005/002/008/003/004/006: closed
- UI-PATCH-001 soft geometry: closed
- Current local product-table count: `20`
- D1/R2: local-only, `remote: false`
- Current public D1 read paths: Journal only

## Problem

The final core WEB increment must implement `DESIGN-001`…`DESIGN-014` without turning the admin into an unrestricted visual-code editor.

The controls must:

- preserve Brand V3 and the approved soft-geometry direction;
- use draft → preview → publish isolation;
- persist safely in D1;
- let section visibility/order use the already-owned `sections/section_revisions` model;
- apply published design state to the statically exported public site;
- keep arbitrary CSS/JS/HTML/URLs/selectors/object keys out of admin input;
- preserve reduced-motion behavior;
- remain local/repository-only.

## Classification

`ARCHITECTURE`.

The build plan previously described this increment as likely `CAPABILITY`, but the final repository-grounded design crosses an architecture boundary because it:

1. adds two persistent product tables;
2. introduces a new public published-only Worker→D1 read path;
3. widens `assets.run_worker_first` for that exact public path;
4. adds a runtime design-application layer to otherwise static pages;
5. extends mutation behavior to the existing section revision substrate.

That warrants the stronger architecture path.

## Requirement ownership

This increment implements:

- `DESIGN-001` Hero background/media selection
- `DESIGN-002` Section visibility
- `DESIGN-003` Section order
- `DESIGN-004` Card style preset
- `DESIGN-005` Layout density preset
- `DESIGN-006` Typography preset from approved set
- `DESIGN-007` Heading scale preset
- `DESIGN-008` Background overlay intensity
- `DESIGN-009` Glass/panel presentation preset
- `DESIGN-010` Animation preset
- `DESIGN-011` Reduced-motion compatibility
- `DESIGN-012` Project rail/card behavior
- `DESIGN-013` Journal card behavior
- `DESIGN-014` Theme tokens constrained to validated ranges

It also advances the already-existing admin requirements needed to operate those controls:

- `ADM-REQ-007`
- `ADM-REQ-008`
- `ADM-REQ-009`
- `ADM-REQ-010`
- `ADM-REQ-011`
- `ADM-REQ-012`
- `ADM-REQ-013`
- `ADM-REQ-014`
- `ADM-REQ-015`
- `ADM-REQ-016`

## Data ownership

Add exactly one migration:

`migrations/0005_web_inc_007_theme.sql`

Add exactly two product tables:

- `theme_settings`
- `theme_settings_revisions`

Product-table count:

`20 → 22`

Migrations 0001–0004 must remain byte-identical.

### theme_settings

Singleton base entity:

- `id TEXT PRIMARY KEY`, exactly `default`
- `created_at TEXT NOT NULL`
- `published_revision_id INTEGER NULL`
- `draft_revision_id INTEGER NULL`

Pointers must reference only revisions owned by the same singleton through composite foreign keys.

No delete route.
No second theme entity.
No rename.

### theme_settings_revisions

Required fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `theme_settings_id TEXT NOT NULL`
- `revision_number INTEGER NOT NULL`
- `hero_background_preset TEXT NOT NULL`
- `card_style_preset TEXT NOT NULL`
- `layout_density_preset TEXT NOT NULL`
- `typography_preset TEXT NOT NULL`
- `heading_scale_preset TEXT NOT NULL`
- `overlay_intensity INTEGER NOT NULL`
- `panel_preset TEXT NOT NULL`
- `animation_preset TEXT NOT NULL`
- `reduced_motion_mode TEXT NOT NULL`
- `project_rail_mode TEXT NOT NULL`
- `journal_card_mode TEXT NOT NULL`
- `accent_preset TEXT NOT NULL`
- `panel_opacity_pct INTEGER NOT NULL`
- `border_intensity_pct INTEGER NOT NULL`
- `radius_scale_pct INTEGER NOT NULL`
- `created_at TEXT NOT NULL`
- `created_by TEXT NOT NULL`

Constraints:

- `revision_number >= 1`
- unique `(theme_settings_id, revision_number)`
- unique `(theme_settings_id, id)`
- revision rows immutable and non-deletable after insert

## Approved control values

### DESIGN-001 — hero background/media

For v1, this is an **approved static presentation preset**, not an arbitrary upload/object-key control.

Allowed:

- `cinematic-v3` — current approved cosmic architecture asset
- `deep-night` — CSS-only deep-night fallback
- `minimal-orbit` — CSS-only restrained orbital/gradient treatment

No arbitrary URL, R2 key, path, data URI, CSS background string, or uploaded object is accepted.

Public media-object serving remains unauthorized.

### DESIGN-004 — card style

Allowed:

- `soft-glass`
- `quiet-border`
- `solid-night`

### DESIGN-005 — layout density

Allowed:

- `compact`
- `comfortable`
- `spacious`

### DESIGN-006 — typography

Allowed:

- `cinematic`
- `editorial`
- `system`

These map only to already-approved local/system font stacks. No font upload or remote font URL.

### DESIGN-007 — heading scale

Allowed:

- `compact`
- `standard`
- `display`

### DESIGN-008 — overlay intensity

Integer:

`40..85`

No raw opacity/CSS string.

### DESIGN-009 — panel/glass preset

Allowed:

- `soft-glass`
- `clear-glass`
- `opaque-night`

### DESIGN-010 — animation preset

Allowed:

- `calm`
- `minimal`
- `off`

### DESIGN-011 — reduced motion

Allowed:

- `respect-system`
- `always-reduced`

There is deliberately no `ignore-system` mode.

Existing `@media (prefers-reduced-motion: reduce)` behavior must remain intact.

### DESIGN-012 — project rail/card behavior

Allowed:

- `snap`
- `free-scroll`

No autoplay.

### DESIGN-013 — Journal card behavior

Allowed:

- `stack`
- `rail`

No autoplay.

### DESIGN-014 — constrained theme tokens

Allowed accent preset:

- `cobalt`
- `teal`
- `violet`

Numeric ranges:

- `panel_opacity_pct: 55..90`
- `border_intensity_pct: 10..45`
- `radius_scale_pct: 80..120`

No arbitrary color string, CSS value, style object, selector, HTML, JS, class name, URL, or custom property name is accepted from admin input.

## Bootstrap

Migration 0005 must deterministically bootstrap:

- `theme_settings.id = 'default'`
- one published revision matching the currently accepted V3 + UI-PATCH-001 baseline

Default revision values:

- hero background: `cinematic-v3`
- card: `soft-glass`
- density: `comfortable`
- typography: `cinematic`
- heading scale: `standard`
- overlay intensity: `68`
- panel: `soft-glass`
- animation: `calm`
- reduced motion: `respect-system`
- project rail: `snap`
- journal cards: `stack`
- accent: `cobalt`
- panel opacity: `74`
- border intensity: `25`
- radius scale: `100`

Bootstrap provenance:

`migration:web-inc-007`

No draft revision is created by bootstrap.

## DESIGN-002 / DESIGN-003 — sections

Do not duplicate section visibility/order inside theme revisions.

Use the existing:

- `sections`
- `section_revisions`

Managed section IDs remain exactly:

- `home`
- `projects`
- `process`
- `about`

Each new section design edit creates a new immutable `section_revisions` row.

No in-place edit of a historical section revision.

No new section IDs.
No deletion.
No arbitrary selector/id input.

## Protected admin APIs

Add a bounded design dispatch family under:

`/admin/api/design`

Allowed routes:

- `GET /admin/api/design`
- `GET /admin/api/design/preview`
- `PUT /admin/api/design/theme/draft`
- `POST /admin/api/design/theme/publish`
- `PUT /admin/api/design/sections/:id/draft`
- `POST /admin/api/design/sections/:id/publish`

No delete.
No generic key/value update route.
No free-form theme token route.
No CSS/JS/HTML endpoint.
No media upload through this API.

All mutating routes inherit the accepted controls:

- Access verification first;
- bounded non-empty `sub`;
- same-origin;
- JSON only;
- bounded actual request bytes;
- explicit field allowlists;
- server-side enum/range validation;
- expected pointer inputs;
- commit-time stale-write protection;
- atomic mutation + success audit;
- bounded failure audit;
- no false-success response.

## Theme mutation lifecycle

### GET status

Returns bounded current:

- published revision id;
- draft revision id;
- derived lifecycle state;
- positive-allowlist published/draft values as appropriate;
- allowed preset/range metadata may be returned from fixed server constants.

No raw SQL/schema/config.

### Edit theme draft

Input contains the complete theme control object plus:

- `expectedPublishedRevisionId`
- `expectedDraftRevisionId`

Creates a new immutable theme revision and moves only `draft_revision_id`.

Existing published revision remains untouched.

### Theme preview

Authenticated only.

Returns exactly the current draft theme revision plus current draft/published section design states needed for preview.

No public route can access draft theme or draft sections.

### Publish theme

Re-read and fully revalidate the persisted draft, then atomically:

- `published_revision_id := draft_revision_id`
- `draft_revision_id := NULL`
- append success audit

No existing revision row is rewritten.

## Section mutation lifecycle

### Edit section draft

For one fixed section id:

- require expected published/draft pointers;
- validate `visible` boolean and bounded `order`;
- create one new immutable `section_revisions` row;
- move only that section's `draft_revision_id`;
- append success audit atomically.

Order range:

`0..20`

### Publish section

For one fixed section id:

- re-read exact persisted draft;
- validate id/order/visibility;
- require expected pointers;
- atomically set published pointer to draft, clear draft, append success audit.

No section delete/unpublish route is added.

## Audit actions

Add only these fixed call-site action literals:

- `theme_edit_draft`
- `theme_publish`
- `section_design_edit_draft`
- `section_design_publish`

No caller-controlled action name.

## Admin UI

WEB-INC-007 is the first increment authorized to add **actual design controls** to the existing authenticated admin dashboard UI.

Preferred shape:

- new bounded client component, e.g. `app/admin/DesignControls.js`;
- dashboard remains the parent shell;
- form controls are selects/ranges/toggles generated from fixed allowed values;
- section controls expose only the four managed section IDs;
- explicit Save Draft / Preview / Publish actions;
- clear success/error/loading/conflict feedback;
- no raw text field for CSS/HTML/JS/URLs/selectors/object keys;
- draft preview must be admin-only and must not mutate the public document.

The existing project/media/Journal APIs are not to be given a broad new generic editor in this increment.

## Public design API

Add exactly:

`GET /api/design`

This is the only new public Worker-first path.

It is:

- unauthenticated;
- GET-only;
- read-only;
- published-only;
- positive-allowlist only;
- local D1 only.

It returns:

- the current published theme revision values;
- published section visibility/order for exactly home/projects/process/about.

It must never read or return:

- theme `draft_revision_id`;
- draft theme revision;
- section draft pointers/revisions;
- created_by;
- audit data;
- database ids not required by the public shape;
- raw CSS/JS/HTML;
- storage keys;
- resource/binding configuration.

If no valid published theme exists, public runtime must safely fall back to the static V3 + soft-geometry baseline.

## Worker routing

Widen `assets.run_worker_first` only with:

`/api/design`

No wildcard design path is authorized.

Public design classification must occur before Access auth, exactly like public Journal routing.

Unsupported method:

- `405`
- zero D1 access before rejection

Unknown design subpaths remain asset/404 behavior and must not become generic API routes.

## Public runtime application

Add a small bounded client runtime, e.g.:

`app/DesignRuntime.js`

It may fetch only:

`GET /api/design`

It must apply published design state using:

- fixed `data-*` enum attributes;
- numeric CSS custom properties derived from validated numeric fields;
- fixed local mappings for accent/background/font presets.

It must not:

- inject a server-returned CSS string;
- create `<style>` from arbitrary server text;
- use `dangerouslySetInnerHTML`;
- evaluate code;
- load remote fonts/assets;
- use arbitrary selectors/URLs from D1.

### Section visibility/order

Homepage managed sections must be structurally identifiable by the four fixed ids.

The implementation may add a minimal wrapper/data attributes so the published section design projection can control:

- visibility;
- order.

Do not convert the site to SSR.

Do not make the entire homepage content D1-driven.

Static Git-backed homepage text/project content remains the current source.

### Fail-safe baseline

Before design data is available, and whenever `GET /api/design` fails or returns invalid/unexpected data, the site must retain the existing approved V3 + UI-PATCH-001 baseline.

A design API failure must not blank the site.

## CSS implementation

Theme behavior must be implemented as pre-authored CSS variants keyed by the fixed data attributes/numeric custom properties.

Preserve:

- V3 composition;
- soft-geometry baseline;
- focus-visible behavior;
- responsive breakpoints;
- `prefers-reduced-motion` behavior;
- contrast/readability.

Do not replace `globals.css` with dynamically generated CSS.

## Dashboard integration

Extend `GET /admin/api/dashboard` only with bounded theme lifecycle status if useful.

Do not expose complete theme revision contents through the generic dashboard status projection; the design endpoint owns control values.

## Local-only resource boundary

Keep:

- D1 `remote: false`
- R2 `remote: false`

No production resource creation.
No public R2 object serving.
No Access production configuration.
No deployment.
No main merge.

## Evidence requirements

Builder handoff must include at minimum:

1. exact base/result SHA;
2. exact changed files;
3. migration inventory proving `20 → 22` product tables;
4. migrations 0001–0004 byte-identical;
5. singleton pointer ownership constraints;
6. theme revision immutability tests;
7. default bootstrap parity with current V3 + soft geometry;
8. every enum/range boundary test;
9. unknown-field rejection;
10. explicit raw CSS/JS/HTML/URL/token-injection rejection;
11. Access-before-admin-D1 tests;
12. theme stale-write/interleaving tests;
13. section stale-write/interleaving tests;
14. theme edit draft/publish isolation;
15. section visibility/order draft/publish isolation;
16. preview reads draft only and is authenticated;
17. public `GET /api/design` published-only evidence;
18. proof theme drafts do not leak publicly;
19. proof section drafts do not leak publicly;
20. wrong-method public design route rejects before D1;
21. admin control UI source inspection evidence;
22. DesignRuntime source inspection showing fixed mappings only;
23. reduced-motion preservation tests/source evidence;
24. responsive/mobile design-control regression evidence;
25. audit success/failure evidence;
26. `TEST-ADM-009` passes;
27. `npm test`;
28. `npm run build`;
29. local Wrangler smoke for protected design endpoints and public `/api/design`;
30. visual screenshot evidence for at least the default baseline and one non-default approved preset;
31. dry-run/config scan;
32. explicit no remote D1/R2, no deploy, no main merge, no public R2 serving, no Sentinel S3+.

## Explicit non-goals

Not authorized:

- free-form CSS;
- free-form JS;
- free-form HTML;
- arbitrary colors;
- arbitrary font names/URLs;
- arbitrary image URLs or R2 object keys;
- uploaded hero media serving;
- visual drag/drop builder;
- arbitrary component/block creation;
- project/Journal content editing UI expansion;
- homepage/project public D1 content cutover;
- SSR conversion;
- remote resources;
- deployment;
- main merge;
- Sentinel S3+.

## Acceptance

Implementation may begin only after:

1. Architect Sync approves RFC-010;
2. Paulo's `proceed` authorization is recorded as a bounded WEB-INC-007 decision;
3. `coordination/STATE.md` gives Claude the exact Builder turn.

Because this increment is `ARCHITECTURE`, final acceptance requires:

- independent Architect implementation review;
- durable concluding Architect Sync archive;
- post-acceptance ADR.
