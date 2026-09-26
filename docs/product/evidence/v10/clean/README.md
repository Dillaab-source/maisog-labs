# V10 clean replacement — local evidence (D-092)

Evidence class: `ACTOR_REPORTED`. Captured 2026-09-26 on Linux (cloud session): Playwright 1.56.1, Chromium from `/opt/pw-browsers`, Node v22.22.2. This is repository-local evidence against the static `out/` export and a local `wrangler dev --local` run. It is not preview or production evidence; this session cannot reach Cloudflare.

Every file here except this README and `SHA256SUMS` is listed in `SHA256SUMS` (`sha256sum -c SHA256SUMS` from this directory).

## Files

- `captures/candidate-<viewport>-<mode>-<view>.png`: the candidate, 20 views.
- `compare/<viewport>-<mode>-<view>.jpg`: candidate | V10 reference | diff (red = pixel differs), downscaled 50% at desktop. Reference PNG hashes are in `results.json`; the reference is reproducible from the pinned V10 file with the harness.
- `results.json`: every measurement below.
- `harness/clean-evidence.mjs`: the capture/compare/audit harness (`V10_UMD_DIR`, `AXE_PATH` env; args: reference dir, candidate `out/`, output dir).
- `harness/v10conv.py`, `harness/v10assemble.py`: the one-off converter that turned the V10 template into `components/v10/V10Home.js` and the exact, asserted edits applied to it.

## Method

- **Reference:** `design-references/claude-v10/source/Maisog Labs Home v10.dc.html` (SHA-256 `6e47ffca…`), rendered with React 18.3.1, ReactDOM 18.3.1 and `@babel/standalone` 7.29.0 from `npm pack`, served in place of `unpkg.com`; Google Fonts requests answered with the same self-hosted font files the candidate ships.
- **Candidate:** `out/` from `npm run build`. `/api/journal` answers a three-entry fixture carrying V10's own three note titles, dates and summaries, so the Research comparison isolates presentation. Every non-local request is recorded and refused.
- **Views:** Entry, Systems, Projects, Research (`#journal`), Contact at 1440×900 and 390×844.
- **Modes:** Still = `prefers-reduced-motion: reduce`. Full = Playwright clock installed at `2026-09-26T00:00:00Z`, advanced 3000 ms, every Web Animation paused at 3000 ms, videos paused and seeked to their first frame.
- **Comparison:** a pixel differs when any RGB channel differs by more than 32; a view passes at ≤ 1.0% differing pixels.
- **Accessibility:** axe-core 4.10.3 (tarball SHA-256 `0f2b4d7dcdf7d1219df8d1959ad68e565f51d14c3f0d88bb71cd59abeb956292`), tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, Still mode, Entry and every panel, both viewports.

## Results

| View | Desktop Still | Desktop Full | Mobile Still | Mobile Full | Cause of any residual |
|---|---|---|---|---|---|
| Entry | **0.000%** | 0.020% | 2.21% | 2.15% | mobile: D1 Menu button in place of the clipped link row |
| Systems | 0.73% | 0.58% | 1.86% | 1.78% | project ring has 8 slots (D-088) instead of 5; D2 captions hidden on mobile |
| Projects | 0.59% | 0.47% | 0.94% | 0.85% | 8 projects; "Sentinel/DevOS" spelling (D-088) |
| Research | 8.39% | 7.86% | 12.98% | 12.89% | no placeholder images and no category filters (real Journal data has neither) |
| Contact | 0.41% | 0.34% | 3.00% | 2.46% | longer approved address wraps at 390px |

Result: 9/20 views within the 1.0% threshold; every residual is attributed above and listed in `docs/product/V10_DIVERGENCE_REGISTER.md` (D-092 section). Before this replacement the same method measured 3.4%–26.9% on every view (`../rem1/`).

| Check | Result |
|---|---|
| Repeatability | Still: ≤ 4 px differ between two captures. Full: up to 2,432 px (video frame decode timing); reported, not hidden. |
| Page errors / console errors or warnings (candidate, all captures and interaction runs) | none |
| Automated audit | **0 violations** (0 serious, 0 critical) on all 10 views. `incomplete` (needs manual review): `color-contrast` over the plate/gradients on every view and `video-caption` on the decorative logo video; not manually triaged. |
| Routing | PASS: `#systems`, `#projects`, `#journal`, `#contact` open their panel and focus it; aliases `#research`→`#journal`, `#process`→`#systems`, `#about`→`#contact`; unknown hash → Entry; Escape → Entry. |
| Projects | PASS: 8 rows; ArrowDown and End roving keys; counter `08 / 08`; no flow figure for a project without a sourced flow. |
| Systems | PASS: selecting a discipline updates the detail column. D2: 0 overlapping visible labels at 390px. |
| Contact | PASS: `mailto:paulo.maisog@maisoglabs.com`. |
| Research | PASS: cards link to `/journal?slug=…`; "More notes" links to `/journal`. |
| D1 menu (390px) | PASS: 44px button, `aria-expanded`, four 44px destinations, none clipped, Escape closes, choosing a destination navigates and closes. No horizontal overflow. |
| Network | PASS: 23 distinct requests, all local; the only API path used is `/api/journal`; `out/` contains no `support.js`, `image-slot`, `@babel/standalone`, `unpkg.com` or Google Fonts reference. |
| Homepage CSS | one 1.4 KB stylesheet; the pre-V10 stylesheet loads on `/journal` only. |

## Workers runtime (local)

`npx wrangler dev --local` (wrangler 4.131.1; local simulation only, the D1 binding is `remote: false`; no migration applied): `/` 200, `/journal` 200, `/admin` 401 (Access), V10 assets and fonts 200, unknown path 404, `/index.html` and `/admin.html` 307. `/api/journal` and `/api/design` return **500** with `D1_ERROR: no such table: journal_entries` / `theme_settings` against the empty local D1. In a browser against that runtime the page raised no exception and the Research panel showed "The journal could not be loaded right now." inside the V10 layout; `/api/design` was never requested.
