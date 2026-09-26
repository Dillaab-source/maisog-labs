# V10-A local visual evidence

Evidence class: `ACTOR_REPORTED`. Captured locally on 2026-09-26 from the static `out/` export served at `http://localhost:3000`. This is repository-local implementation evidence, not production verification.

## Captures

| File | View | SHA-256 |
|---|---|---|
| `entry-desktop-1440x900.png` | Entry, 1440 × 900 | `499b98d9e11c1cf22cbd7f65b6c15da0e5f8bf499014341a93305568ee9be984` |
| `projects-desktop-1440x900.png` | Projects, 1440 × 900 | `36a44e65bdf5490227e765dc1b07e4e82e50175ac0e01c688368535969906a56` |
| `systems-narrow-500x900.png` | Systems, compact navigation breakpoint, 500 × 900 | `b6ee4c475fe853d6fe16631849b0976eaf351ca0b190544fea7612861422c3e3` |

The desktop Entry and Projects captures verify the cinematic plate, wordmark, route treatment, panel geometry, eight-project rail, and repository-backed project presentation. The narrow Systems capture verifies D1/D2: compact navigation and a contained, readable diagram with a horizontally scrollable selector whose native scrollbar is visually suppressed.

Interactive inspection also covered Systems, Research/Journal, Contact, the compact menu, canonical hashes, and the contact mail link. The static local server correctly showed the Journal error state because `/api/journal` is a separate Worker/D1 runtime path and no Worker was started for this evidence pass.

## Validation

- `npm run build`: PASS; Next.js static export generated `/`, `/admin`, and `/journal`.
- Focused V10/design/routing suite: PASS, 35/35.
- Content and D1 compatibility suite: PASS, 46/46.
- `git diff --check`: PASS.
- Full `npm test`: attempted; not green on this Windows host. Failures are outside the V10-A surfaces and include the repository's fail-closed S6 Windows isolation checks, child fixtures that intentionally launch with an empty environment and therefore cannot locate `git`, and existing skill-frontmatter/bridge assertions. V10, content, D1 compatibility, public routing, and build checks above pass. No S6, governance-skill, Worker, migration, package, or lockfile file was changed to bypass those failures.

## Deliberate differences

The accepted D1–D5 differences are recorded in `docs/product/V10_DIVERGENCE_REGISTER.md`. No production, Cloudflare, D1, R2, Access, DNS, main-branch, or deployment evidence is claimed.

## Remediation cycle 1 evidence (D-091 / ML-DEVOS-AS-119)

Evidence class: `ACTOR_REPORTED`. Captured 2026-09-26 on Linux (cloud session) with Playwright 1.56.1 and Chromium from `/opt/pw-browsers`, against the static `out/` export of the remediated tree. The three captures above are the earlier D-090 evidence and are kept unchanged; they are superseded by `rem1/`.

Every file under `rem1/` is listed in `rem1/SHA256SUMS` (`sha256sum -c SHA256SUMS` from inside `rem1/`). `rem1/results.json` holds every measurement below. `rem1/harness/rem1-evidence.mjs` is the harness that produced them; it takes the reference directory, candidate `out/`, pre-remediation `out/`, output directory and an `axe.min.js` path, plus `V10_UMD_DIR` for the pinned React/Babel copies.

### Method

- **Reference:** `design-references/claude-v10/source/Maisog Labs Home v10.dc.html` (SHA-256 `6e47ffca…`), rendered locally with React 18.3.1, ReactDOM 18.3.1 and `@babel/standalone` 7.29.0 fetched from the npm registry and served in place of `unpkg.com`. Google Fonts requests are answered with the same self-hosted font files the candidate ships (`public/v10/fonts/`). No reference file was modified.
- **Candidate:** `out/` from `npm run build`. `/api/design` answers 404 (no D1), and `/api/journal` answers a fixed three-entry fixture. Every non-local candidate request is recorded and refused.
- **Views:** Entry, Systems, Projects, Research (`#journal`), Contact; at 1440×900 and 390×844 (device scale 1).
- **Modes:** Still = `prefers-reduced-motion: reduce`. Full = no reduced motion, Playwright clock installed at `2026-09-26T00:00:00Z`, advanced, then every CSS animation paused at 3000 ms and every video paused and seeked to its first frame.
- **Comparison:** per pixel; a pixel differs when any RGB channel differs by more than 32; a view passes when at most 1.0% of pixels differ. `rem1/compare/*.jpg` shows candidate | reference | diff (red = differing pixel), downscaled 50% at desktop.
- **Repeatability:** every candidate view was captured twice; all 20 pairs were pixel-identical.
- **Accessibility:** axe-core 4.10.3 (`npm pack` tarball SHA-256 `0f2b4d7dcdf7d1219df8d1959ad68e565f51d14c3f0d88bb71cd59abeb956292`), tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, run on Entry and every panel at both viewports in Still mode.

### Results

| Check | Result |
|---|---|
| Parity (20 views, threshold 1.0%) | **FAIL, 0/20.** Mismatch ratios: desktop Still 3.5–20.5%, desktop Full 3.4–20.8%, mobile Still 7.8–24.5%, mobile Full 7.3–26.9%. Per-view values are in `results.json`. The residual differences are structural as well as content-driven; see `V10_DIVERGENCE_REGISTER.md` "Residual differences observed in remediation cycle 1". |
| CSS consolidation (AS119-F001) | Pre- vs post-remediation candidate, tolerance 0: 16/20 views pixel-identical. The 4 Research views differ only where the removed Journal-entry thumbnails were (AS119-F003). |
| F1 in browser | 28/28 PASS: network failure, 404, 500, malformed JSON, two invalid payloads, and an explicit default V10 theme all render pixel-identical (tolerance 0) to the no-API baseline, for Entry and Projects at both viewports. |
| Automated audit | **FAIL:** 2 serious findings, both `color-contrast` on `.contact-legal` (Contact, both viewports): `#6d7687` on `#040a1d`, 4.3:1 against the required 4.5:1, 9.28px text. No critical findings. No other violations. axe also reported `incomplete` (needs manual review) `color-contrast` items on every view (text over the plate/gradient) and one `aria-prohibited-attr` on Projects; these are listed in `results.json` and were not manually resolved. |
| Contrast measurement (Systems panel over `rgb(3,9,26)`) | title 19.02:1, kicker 9.66:1, unselected selector 8.37:1, selected selector 19.02:1, detail copy 11.41:1. |
| Keyboard/focus | PASS: opening a panel focuses its title; Escape returns to Entry, clears the hash and returns focus to the trigger. |
| D1 (390×844) | PASS: Menu button 44px; four destinations, each 63px tall, none clipped; desktop links hidden. |
| D2 (390×844 Systems) | PASS: 6 diagram labels, 0 overlapping boxes. No horizontal page overflow. |
| F3 routing | PASS: `#systems`, `#research` → `#journal`, `#process` → `#systems`, `#about` → `#contact`, unknown hash → Entry with no panel open. In-page links are `#main-content`, `#systems`, `#projects`, `#journal`, `#contact`; none use `#research`. |
| Runtime network (R2) | PASS: 25 distinct candidate requests across all captures, all to the local origin, 0 external. `out/` has no `support.js`, `image-slot.js`, `@babel/standalone`, `unpkg.com` or Google Fonts reference. |

The Journal fixture and the 404 design API are local test stand-ins; no production, Cloudflare, D1, R2 or Worker evidence is claimed.
