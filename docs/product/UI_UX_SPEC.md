# MaisogLabs UI/UX Spec

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK`

Owns experience/design rules. Does not restate Brand V3 — it references it (`AS10-F011`). Requirements/rationale live in `PRD.md`; implementation detail lives in `TECHNICAL_DESIGN.md`; transitions live in `APP_FLOW.md`.

## Brand reference (not duplicated here)

- `brand/V3/README.md` — core identity, brand balance, color palette, typography.
- `brand/V3/guidelines/V3_DIRECTION.md` — implementation rules for the V3 direction.
- `brand/V3/DESIGN_MAP.md` — the active Website Redesign V1 spatial composition (`D-076` / `ML-DEVOS-AS-104`) and the superseded V3.1 placement map (provenance only).
- `brand/V3/design-tokens/design-tokens.json`, `brand/V3/design-tokens/brand-colors.css` — machine-readable tokens.
- `brand/V3/logos/` — canonical SVG masters. **Do not redesign or substitute the orbital logo** without an intentional, separately approved brand redesign.

Anything this spec says about visual identity is subordinate to those files. If this spec and Brand V3 ever conflict, Brand V3 wins (source-of-truth precedence, `PRD.md`).

## Interaction principles — Website Redesign V1, `IMPLEMENTED` (Builder-reported, pending Architect review)

Governed by `D-076`, `ML-DEVOS-AS-104` and `docs/product/WEBSITE_REDESIGN_V1_PLAN.md`; evidence in `docs/product/evidence/website-redesign-v1/` (`ACTOR_REPORTED`).

- One spatial environment: Entry (no hash) plus four work surfaces addressed by `#systems`, `#projects`, `#research`, `#contact` (`components/site/SpatialShell.js`, `components/site/routes.mjs`). Unknown hashes stay on Entry; legacy `#process` / `#about` resolve to Systems / Contact.
- Route triggers are plain hash links, so browser Back / Forward work; Escape and the wordmark return to Entry.
- Focus moves to the opened surface's heading and returns to the closed route's trigger (the `MENU` control on narrow screens).
- Systems and Projects selectors are button groups with `aria-pressed`, arrow-key / Home / End selection and a roving tab stop.
- Narrow screens (≤ 760px): compact wordmark + one `MENU` control opening a vertical list of the four destinations (≥ 44px targets); Escape closes it and restores focus.
- WEB-INC-007: managed ids `home` → Entry content, `projects` → Projects, `process` → Systems, `about` → Contact (fixed in `app/DesignRuntime.js`); a hidden managed route hides its triggers and surface, and a direct hash to it falls back to Entry; published order only permutes the managed route triggers. Research is unmanaged.

## Responsive / mobile — Website Redesign V1

Desktop and narrow compositions are defined separately in `app/globals.css`. Browser evidence (desktop 1440×900, mobile 390×844) is Builder-captured, not independently `VERIFIED`; there is still no automated visual-regression suite in CI (`TEST-WEB-003`).

## Accessibility — Website Redesign V1 (partial, not comprehensively audited)

- Route-aware skip link: on Entry it targets the Entry main landmark (`#main-content`); on an open surface it moves focus to that surface's own heading (`surface-<route>-title`), never to the inert Entry (`AS105-F002`). Semantic `nav` landmarks with labels; `aria-current` on the active route; surface headings (`h2`) labelled regions.
- Decorative environment, trajectories and the Systems diagram are `aria-hidden`; the diagram's information is also stated in text.
- Entry is `inert` / `aria-hidden` while a surface is open.
- No hover-only information. No automated accessibility (axe/Lighthouse) test exists — a known gap, not a claimed pass.

## Reduced motion

`app/globals.css` owns reduced-motion behavior per `docs/ARCHITECTURE.md` ("V4 foundation presentation layer" item 2). This spec does not duplicate the CSS; any future admin-exposed animation control must respect the same reduced-motion contract (`DESIGN-011` "Reduced-motion compatibility" — currently `NOT STARTED` because no admin surface exists to host the control).

## Loading / empty / error / success / unauthorized states

These states are tracked against existing requirement IDs rather than invented fresh (`AS10-F010`):

| State | Current | Target |
|---|---|---|
| Empty (no featured projects) | `CURRENTLY IMPLEMENTED` — `projectSection.emptyMessage` is rendered when the published, featured project list is empty (`data/site.js`, `lib/content/schema.mjs` `projectSection` field, `components/site/ProjectsSurface.js`); the Research surface shows an explicit empty state for zero published Journal entries and an error state with retry | Unchanged |
| Loading | `IMPLEMENTED` (Website Redesign V1) — the homepage Research surface shows an explicit loading state while it fetches `GET /api/journal` (also `/journal`) | `PROPOSED TARGET` — a future admin dashboard/editor will need explicit loading states for save/publish operations (`ADM-REQ-010`, `015`) |
| Error (invalid content) | `CURRENTLY IMPLEMENTED` at build time — `validateContent()` throws and fails the build (`lib/content/schema.mjs`, `tests/content.test.mjs`); there is no runtime/user-facing error UI because there is no runtime write path | `PROPOSED TARGET` — a future admin surface must show inline validation errors without a build (`ADM-REQ-011`, `WEB-SEC-004`) |
| Success | `NOT IMPLEMENTED` — no save/publish action exists to confirm | `PROPOSED TARGET` — explicit save/publish confirmation (`ADM-REQ-015`) |
| Write failure | `NOT IMPLEMENTED` — no write path exists | `PROPOSED TARGET` — a failed write must never appear successful (`ADM-REQ-016`, `WEB-SEC-012`) |
| Unauthorized | `NOT IMPLEMENTED` — there is nothing to authorize against | `PROPOSED TARGET` — unauthenticated/unauthorized access to `/admin` or any mutation must fail closed (`ADM-REQ-001`, `WEB-SEC-001`, `002`, `011`) |

## Design controls (`WEB-INC-007` DESIGNED / IMPLEMENTATION PENDING)

The `DESIGN-001`…`014` catalog is now concretely designed by `ML-DEVOS-RFC-010` for `WEB-INC-007`. Controls are fixed presets/enums plus bounded numeric ranges only; arbitrary CSS/JS/HTML, arbitrary colors, selectors, font/image URLs, and R2 object keys remain prohibited. Section visibility/order continue to use `sections`/`section_revisions`; theme values use `theme_settings`/`theme_settings_revisions`. Public presentation follows only published theme/section revisions through the bounded public `GET /api/design` projection, with the existing V3 + UI-PATCH-001 presentation as the fail-safe fallback. Brand V3 non-negotiables remain in force. Implementation is still pending until the authorized Builder turn completes and passes Architect review.

### Screenshot-reference workflow

WEB-INC-007 must also support the operating workflow in `docs/product/DESIGN_REFERENCE_WORKFLOW.md`: Paulo may provide a UI screenshot to ChatGPT, the Architect maps visual traits into the approved design-control vocabulary, and Claude applies that plan through the authenticated design controls/APIs. The system must expose deterministic controls and explicit Draft → Preview → Publish steps. Unsupported traits are reported as gaps; they are not silently converted into arbitrary CSS/JS or source-code edits.

## Context-efficiency note

This spec intentionally does not reproduce Brand V3's color/typography values, the full `DESIGN-*` catalog prose, or CSS implementation detail. See the files listed above.


## Paulo-approved visual refinement — softer geometry (IMPLEMENTED)

Status: `ARCHITECT_APPROVED — UI-PATCH-001`

Paulo's current visual preference is to make the interface feel **softer and less sharp** without changing the approved V3 cinematic composition.

Preserve:
- the orbital Maisog Labs identity;
- the cool-space / warm-architecture cinematic background;
- the existing overall hero/project/process composition;
- restrained glass/system-card language;
- calm, engineered motion.

Future presentation work should move toward:

- larger, softer corner radii on cards/panels;
- pill or softly rounded CTA/button shapes;
- fewer hard rectangular edges;
- thinner/lower-contrast panel borders;
- gentler glass highlights and shadows;
- slightly more internal padding and breathing room;
- softer section/card transitions instead of abrupt geometric cuts;
- reduced visual hardness in dividers, frames, and status panels;
- softer typography spacing where it improves the overall calm feel.

Avoid:
- excessive blur;
- bubbly/cartoon styling;
- over-rounded mobile-app aesthetics;
- strong neon glow;
- loss of the cinematic/system identity;
- making the interface feel vague or low-contrast.

Target feel:

`cinematic + modern + calm + premium + soft-edged`

rather than:

`sharp + rigid + HUD-like + heavily technical`

This direction was implemented as `UI-PATCH-001` in `app/globals.css` after WEB-INC-004 closed. The bounded patch softened geometry only; it did not implement the future WEB-INC-007 theme-control system.
