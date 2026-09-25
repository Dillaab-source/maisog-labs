# Website Redesign V1 — implementation evidence

Evidence class: **`ACTOR_REPORTED`** (Builder-generated). It stays that way until independent Architect review.

- Authority: `D-076`
- Design review: `ML-DEVOS-AS-104`
- Plan: `docs/product/WEBSITE_REDESIGN_V1_PLAN.md`
- Handoff: `H-WEB-REDESIGN-V1-IMPL-0001`

## How it was captured

- **Site:** the actual local implementation, `npm run build` (Next.js static export, `out/`).
- **Server:** a minimal static file server inside `capture-harness.mjs`.
- **Browser:** Chromium 141.0.7390.37 (pre-installed) driven by the environment's globally installed Playwright 1.56.1. No repository dependency was added.
- **Runtime:** Node v22.22.2 on Linux.
- **Viewports:**
  - desktop: 1440×900, DPR 1;
  - mobile: 390×844, DPR 2, `isMobile`, `hasTouch`.
- **Output:** the screenshots are JPEG (quality 82).

`/api/design` and `/api/journal` are Worker routes that do not exist in a static export, so the harness intercepts them in the browser:

- `/api/design`:
  - 404 by default, which is the WEB-INC-007 fail-safe baseline;
  - explicit fixed payloads for the WEB-INC-007 cases.
- `/api/journal`:
  - **labelled local fixtures**, for example "[Local fixture] Newer test entry", used only to exercise the loading, empty, error and success states;
  - the live production API was not reachable from this environment (proxy 403);
  - these fixtures are **not** published content and are not shipped anywhere.

No reference or mockup image is included here. Every screenshot is of the implemented site.

## Screenshots (`screenshots/`)

| Viewport | Surface | File |
|---|---|---|
| Desktop | Entry | `desktop-01-entry.jpg` |
| Desktop | Systems | `desktop-02-systems.jpg` |
| Desktop | Projects | `desktop-03-projects.jpg` |
| Desktop | Research (fixture success state, entry opened) | `desktop-04-research.jpg` |
| Desktop | Contact | `desktop-05-contact.jpg` |
| Mobile | Entry | `mobile-01-entry.jpg` |
| Mobile | Menu | `mobile-02-menu.jpg` |
| Mobile | Systems | `mobile-03-systems.jpg` |
| Mobile | Projects | `mobile-04-projects.jpg` |
| Mobile | Research (fixture success state) | `mobile-05-research.jpg` |
| Mobile | Contact | `mobile-06-contact.jpg` |

## Interaction, motion and WEB-INC-007 results

`interaction-motion-results.json` records every check with its detail. The last run passed **72/72**:

| Area | Checks | Pass |
|---|---|---|
| Interaction: direct hash, unknown hash, legacy alias, wordmark, Escape, Back ×2, Forward, Copy address | 9 | 9 |
| Keyboard: Tab order, Enter on a route, Systems ArrowDown/End, Projects ArrowRight/Home | 6 | 6 |
| Focus: entry into the surface heading, return to the route trigger (desktop) or `MENU` (mobile) | 2 | 2 |
| Mobile: nav replaced by `MENU`; menu contents, focus and 44px targets; Escape; breakpoint close | 4 | 4 |
| WEB-INC-007: hidden managed route hides all triggers and the surface; direct hash to it fails safe to Entry; order permutes triggers only; surfaces get no order | 4 | 4 |
| Journal: loading, empty, error (+ retry), success (newest-first API order, plain-text body, `/journal?slug=` link) | 4 | 4 |
| Motion: calm, WEB-INC-007 `minimal`, `off`, `always-reduced`, and `prefers-reduced-motion` | 31 | 31 |
| Visual: no horizontal overflow on any desktop or mobile surface | 9 | 9 |
| Runtime: no page or console errors (desktop, mobile) | 2 | 2 |
| Regression: `/journal` still lists entries | 1 | 1 |

The motion checks cover, for each mode:

- the resolved `data-motion` value;
- whether Entry ambient animation is running;
- whether pointer parallax is on or off;
- the surface transition;
- that ambient motion and parallax stop while a surface is open;
- that ambient motion and parallax stop when the document is hidden;
- that they resume on a visible Entry (calm only);
- that no `<video>` element ships.

Hidden-document behaviour was **simulated**: the harness overrode `document.visibilityState` and dispatched `visibilitychange`, because headless Chromium does not change page visibility. The harness is re-runnable:

```
npm run build
node docs/product/evidence/website-redesign-v1/capture-harness.mjs "$PWD/out" /tmp/shots /tmp/results.json
```

## MEDIA_GAP

The D-076-approved media were not available to this implementation cycle:

- `plate-hero-v4.png`;
- `logo-mark.mp4`;
- the logo-mark poster.

The Claude v10 reference files were also not in this session. Only an unrelated earlier light-theme concept artifact exists, and it was not used.

Per D-076, nothing was generated or reinterpreted:

- **Environment plate:** Entry uses the existing canonical static background `public/images/maisog-v4-cosmic-background.webp`.
- **Identity marks:** Entry and the header use the canonical SVGs `public/brand/maisog-labs-primary-on-dark.svg` and `public/brand/maisog-labs-icon-on-dark.svg`.
- **Motion mark:** none ships. Media pause behind surfaces or on a hidden page is therefore not applicable yet; the ambient CSS animation and the parallax lifecycle are what was verified.
