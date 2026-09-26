# MaisogLabs V10-A implementation contract

Status: Builder implementation contract under D-090. Governing architecture: accepted `ML-DEVOS-RFC-021`. Controlling review: `ML-DEVOS-AS-118`.

## Static baseline

The compiled public application is the V10 baseline. It uses repository components, CSS, local fonts, and the fixed asset allowlist in `public/v10/ASSET_MANIFEST.md`. It does not ship or call the Claude Design `dc` runtime, `support.js`, `image-slot.js`, Babel, CDN React, remote fonts, or remote media.

If `/api/design` is missing, returns an error, or returns malformed data, the runtime applies no caller-controlled presentation. The static result remains V10.

## Content and routes

- Projects, exactly once each and in owner-approved order: Sentinel/DevOS; SU; ClinicFlow; Maisog Kilat; Maisog Guild; Automation Hub; Cybersecurity Lab; Experimental Projects.
- Contact: `paulo.maisog@maisoglabs.com`.
- Canonical hashes: `#systems`, `#projects`, `#journal`, `#contact`.
- Compatibility aliases: `#research` → `#journal`, `#process` → `#systems`, `#about` → `#contact`.
- New public links use the canonical hashes.

The project copy is fail-closed and plain-language. Where a project has no repository source record beyond its approved name, the public profile says that details await a verified source record instead of publishing prototype claims.

## Bounded design mapping

Only these persisted fields may affect the V10 public presentation:

| Input | Effective rule | V10 default |
|---|---|---:|
| `overlayIntensity` | finite values `round` then clamp to `40..85`; invalid values use 68 | 68 |
| `panelOpacityPct` | finite values `round` then clamp to `80..90`; invalid values use 90 | 90 |
| `borderIntensityPct` | finite values `round` then clamp to `10..25`; invalid values use 16 | 16 |
| `radiusScalePct` | finite values `round` then clamp to `80..120`; invalid values use 100 | 100 |
| `animationPreset` | `calm` → Full; `minimal` → Calm; `off` → Still; invalid → Full | Full |
| `reducedMotionMode` | `always-reduced` forces Still; otherwise respect the user preference | respect system |
| `projectRailMode` | `snap` or `free-scroll`; invalid → snap | snap |

`heroBackgroundPreset`, `accentPreset`, `cardStylePreset`, `panelPreset`, `layoutDensityPreset`, `typographyPreset`, `headingScalePreset`, and `journalCardMode` are deliberately ignored.

## AS118-F001 overlay lock

The exact V10 overlay point is input **68**, producing `{ opacity: 1, boost: 0 }`.

- `40..68`: `opacity = normalized / 68`, `boost = 0`.
- `68..85`: `opacity = 1`, `boost = (normalized - 68) / 17`.
- Finite out-of-range input clamps to 40 or 85.
- Missing, string, null, `NaN`, and infinite input falls back to 68.
- The combined layer weight is monotonic over every integer from 40 through 85.

The deterministic implementation is `lib/design/overlay.mjs`; the tests are `tests/design-overlay.test.mjs`, `tests/v10-theme.test.mjs` and `tests/v10-runtime-matrix.test.mjs` (AS119-F004: the F1 404/500/malformed/invalid matrix, every listed clamp input, every allowed and unknown ignored-field value, and monotonicity at each integer from 40 through 85).

## Accessibility and responsive requirements

- D1: at widths below 700px, the desktop links become a labelled, keyboard-operable Menu with 44px minimum targets; every destination remains reachable.
- D2: the Systems diagram uses contained labels with smaller narrow-screen typography and a separate readable text column, preventing the V10 prototype's label collision.
- Escape returns to Entry, focus moves to the active panel heading and back to its trigger, the skip link follows the active route, and Entry becomes inert while a panel is open.
- `prefers-reduced-motion: reduce` and the stored reduced-motion override force Still. Still renders the logo poster and no autoplaying video elements.
