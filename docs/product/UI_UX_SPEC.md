# MaisogLabs UI/UX Spec

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK`

Owns experience/design rules. Does not restate Brand V3 — it references it (`AS10-F011`). Requirements/rationale live in `PRD.md`; implementation detail lives in `TECHNICAL_DESIGN.md`; transitions live in `APP_FLOW.md`.

## Brand reference (not duplicated here)

- `brand/V3/README.md` — core identity, brand balance, color palette, typography.
- `brand/V3/guidelines/V3_DIRECTION.md` — implementation rules for the V3 direction.
- `brand/V3/DESIGN_MAP.md` — approved landing-page composition (background, header, hero, floating-system, project, process-dock layout, non-negotiables).
- `brand/V3/design-tokens/design-tokens.json`, `brand/V3/design-tokens/brand-colors.css` — machine-readable tokens.
- `brand/V3/logos/` — canonical SVG masters. **Do not redesign or substitute the orbital logo** without an intentional, separately approved brand redesign.

Anything this spec says about visual identity is subordinate to those files. If this spec and Brand V3 ever conflict, Brand V3 wins (source-of-truth precedence, `PRD.md`).

## Interaction principles — current, `CURRENTLY IMPLEMENTED`

- Single-page, anchor-navigated experience: header nav and foundation dock link to in-page sections (`#home`, `#projects`, `#process`, `#about`) — the only navigation targets `lib/content/schema.mjs`'s `href()` validator allows, plus `mailto:` contact links.
- `ProjectRail` (`components/ProjectRail.js`) is the only client-interactive component; the rest of the page is statically rendered server output.
- A skip-link (`Skip to content` → `#main-content`) is present for keyboard/screen-reader users (`app/page.js`).

## Responsive / mobile — current, `CURRENTLY IMPLEMENTED` (code exists), not independently `VERIFIED`

Responsive behavior is owned by `app/globals.css` (`WEB-REQ-003`). No automated mobile/visual regression test exists yet (`TEST-WEB-003: NOT IMPLEMENTED`, `brain/TEST_LEDGER.md`); status is implementer-reported code inspection only, matching `brain/GOVERNANCE_MAP.md`.

## Accessibility — current, `CURRENTLY IMPLEMENTED` (partial, not comprehensively audited)

- Skip link to main content.
- `aria-hidden="true"` applied to decorative-only elements (cosmic background, blueprint grid/frame, coordinate labels, contact signal).
- `aria-label`s on the primary navigation, the foundation dock, and the header brand link.
- No automated accessibility (e.g. axe/Lighthouse) test currently exists in `tests/` — this is a known gap, not a claimed pass.

## Reduced motion

`app/globals.css` owns reduced-motion behavior per `docs/ARCHITECTURE.md` ("V4 foundation presentation layer" item 2). This spec does not duplicate the CSS; any future admin-exposed animation control must respect the same reduced-motion contract (`DESIGN-011` "Reduced-motion compatibility" — currently `NOT STARTED` because no admin surface exists to host the control).

## Loading / empty / error / success / unauthorized states

These states are tracked against existing requirement IDs rather than invented fresh (`AS10-F010`):

| State | Current | Target |
|---|---|---|
| Empty (no featured projects) | `CURRENTLY IMPLEMENTED` — `projectSection.emptyMessage` is rendered when the published, featured project list is empty (`data/site.js`, `lib/content/schema.mjs` `projectSection` field, `app/page.js`) | Unchanged |
| Loading | `NOT APPLICABLE today` — the public page is fully static/server-rendered with no client data fetch that needs a loading state | `PROPOSED TARGET` — a future admin dashboard/editor will need explicit loading states for save/publish operations (`ADM-REQ-010`, `015`) |
| Error (invalid content) | `CURRENTLY IMPLEMENTED` at build time — `validateContent()` throws and fails the build (`lib/content/schema.mjs`, `tests/content.test.mjs`); there is no runtime/user-facing error UI because there is no runtime write path | `PROPOSED TARGET` — a future admin surface must show inline validation errors without a build (`ADM-REQ-011`, `WEB-SEC-004`) |
| Success | `NOT IMPLEMENTED` — no save/publish action exists to confirm | `PROPOSED TARGET` — explicit save/publish confirmation (`ADM-REQ-015`) |
| Write failure | `NOT IMPLEMENTED` — no write path exists | `PROPOSED TARGET` — a failed write must never appear successful (`ADM-REQ-016`, `WEB-SEC-012`) |
| Unauthorized | `NOT IMPLEMENTED` — there is nothing to authorize against | `PROPOSED TARGET` — unauthenticated/unauthorized access to `/admin` or any mutation must fail closed (`ADM-REQ-001`, `WEB-SEC-001`, `002`, `011`) |

## Design controls (`WEB-INC-007` DESIGNED / IMPLEMENTATION PENDING)

The `DESIGN-001`…`014` catalog is now concretely designed by `ML-DEVOS-RFC-010` for `WEB-INC-007`. Controls are fixed presets/enums plus bounded numeric ranges only; arbitrary CSS/JS/HTML, arbitrary colors, selectors, font/image URLs, and R2 object keys remain prohibited. Section visibility/order continue to use `sections`/`section_revisions`; theme values use `theme_settings`/`theme_settings_revisions`. Public presentation follows only published theme/section revisions through the bounded public `GET /api/design` projection, with the existing V3 + UI-PATCH-001 presentation as the fail-safe fallback. Brand V3 non-negotiables remain in force. Implementation is still pending until the authorized Builder turn completes and passes Architect review.

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
