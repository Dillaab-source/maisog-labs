# Current Handoff — MaisogLabs V10 Controlled Clean Replacement (D-092)

```yaml
schema_version: 1
handoff_id: H-WEB-V10-CLEAN-0001
cycle_id: MAISOGLABS_WEB_V10_CLEAN
input_base_commit: 8dd34c8b09d0ad6ef15fbafc0096dc8c9bccfe64
review_target_commit: 8dd34c8b09d0ad6ef15fbafc0096dc8c9bccfe64
applicable_review_id: ML-DEVOS-AS-119
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve, and every result here is `ACTOR_REPORTED`. Nothing here is preview or production evidence: this session cannot reach Cloudflare or `*.workers.dev`.

## Objective

Replace the public homepage presentation with a faithful implementation of the V10 reference (SHA-256 `6e47ffca…6dab`) carrying the D-088 facts, preserve all backend/runtime infrastructure, verify locally, and obtain a non-production preview through the Workers Builds branch build (`DIR-WEB-V10-CLEAN-0001`, D-092).

**SHAs:**
- rollback point: branch `snapshot/pre-v10-clean-replacement` → `146f645390fd24099426c3cb8ab8a511eafb12db` (created through the GitHub API; the session proxy refused a tag push);
- base `8dd34c8b09d0ad6ef15fbafc0096dc8c9bccfe64` (D-092 + directive);
- result: the commit publishing this handoff;
- main `aebc881e8890c00090d714602591138a045bd3b0` (unchanged).

## Approach

V10 is a Claude Design `dc` file: one template with inline styles and `{{ }}` bindings plus one React class (`Component extends DCLogic`), rendered in the browser by `support.js` with CDN React and Babel. It makes no API calls; its projects, disciplines, notes and email are hardcoded.

Rather than re-implement it by hand, a one-off converter turned the template into JSX with the dc runtime's exact semantics (whole-binding values, string joins, `cssToObj` style parsing, `style-hover` as `!important` hover classes, the runtime's whitespace rules), and V10's class became a React class component. Every edit against V10 is an exact, asserted replacement in `harness/v10assemble.py` and is marked `D-092` in the source.

## Changed files

**Replaced / added:**
- `components/v10/V10Home.js` (new; 662 lines; SHA-256 `5c9a1958…a15d2706`): the V10 homepage.
- `app/page.js`: renders `V10Home` from the governed content boundary plus `v10Content` (validated fail-closed).
- `app/globals.css`: now V10's own style rules, hover classes, self-hosted Montserrat / Inter / IBM Plex Mono faces, and the D1/D2/N2 rules (1.4 KB built).
- `app/layout.js`: `DesignRuntime` removed.
- `app/journal/journal.css`: the previous `app/globals.css`, moved byte-for-byte (`git mv`) and imported by `app/journal/page.js` only.
- `data/site.js`: `spatialContent` replaced by `v10Content` (entry descriptor, V10's six disciplines, eight project profiles). `siteContent` unchanged, so D1 migration parity is unchanged.
- `lib/content/schema.mjs`: `validateSpatialContent` replaced by `validateV10Content`.
- `tests/v10-home.test.mjs` (new, 12 tests).

**Removed (superseded by V10):** `app/DesignRuntime.js`; `components/site/**` (9 files); `lib/design/overlay.mjs`, `lib/design/v10-theme.mjs`; their suites `tests/website-redesign.test.mjs`, `tests/v10-baseline.test.mjs`, `tests/v10-theme.test.mjs`, `tests/v10-runtime-matrix.test.mjs`, `tests/design-overlay.test.mjs`.

**Docs/evidence:** `docs/product/V10_IMPLEMENTATION_CONTRACT.md` (rewritten for D-092), `docs/product/V10_DIVERGENCE_REGISTER.md` (D-092 section added), `docs/product/evidence/v10/clean/**` (new, 12 MB, `SHA256SUMS`).

**Coordination:** `CURRENT_HANDOFF.md`, `STATE.md`, `archive/directives/DIR-WEB-V10-CLEAN-0001.{md,provenance.json}` and the index row (blob `509c5f0a…`, compared byte-identical).

## Preserved (untouched)

`worker/**`, `migrations/**`, `wrangler.jsonc`, `package.json`, `package-lock.json`, `app/admin/**`, `app/journal/JournalClient.js`, `public/**`, `.github/**`, `components/Logo.js`, and all governance/SENTINEL/DevOS records outside `coordination/`. `components/ProjectRail.js` and `components/BlueprintIcon.js` are unused legacy files outside D-092's surfaces and are left in place. No D1/R2/Access/DNS/secret/environment action; no production data touched.

## V10 dependencies discovered

| V10 file | Class | Outcome |
|---|---|---|
| `Maisog Labs Home v10.dc.html` template | application source (markup, inline styles) | converted to JSX |
| its `data-dc-script` class | interactive JavaScript | ported as a React class |
| its `<style>` block | styles | `app/globals.css` |
| Google Fonts (Montserrat, Inter, IBM Plex Mono) | fonts | self-hosted from `public/v10/fonts` |
| `support.js` (dc runtime), CDN React 18.3.1 / ReactDOM / Babel 7.29.0 | runtime/build | not shipped; the app's React 19 renders the port |
| `image-slot.js` | authoring widget (image drop slots) | not shipped |
| `assets/plate-hero-v4.png`, `logo-mark.mp4`, `logo-mark-poster.png`, `favicon.svg`, `icons/01-ai, 02-automation, 03-security, 04-research, 05-systems, 08-strategy.svg` | static assets / animation | reused from `public/v10/**` (hashes unchanged) |
| `assets/plate-aqueduct-v4.png` | note placeholder image | not used |
| API/runtime assumptions | none (all content hardcoded) | real data only via `/api/journal` |
| build configuration | none (browser-compiled) | existing Next.js static export |

The earlier `components/site/**`, `DesignRuntime` and `lib/design/**` were not needed by V10.

## Backend / API classification

| Surface | Class | Handling |
|---|---|---|
| `GET /api/journal`, `/api/journal/:slug` | **A — required** (D-088 real Journal) | homepage calls the index once per Research open; `/journal` page unchanged; fails safe |
| `GET /api/design` | **C — not used by V10** | no longer requested by any public page; Worker route kept unchanged (Worker is out of scope) |
| `/admin` + `/admin/api/*` (dashboard, design, projects, journal, media) | **C — not used by V10** | preserved unchanged; admin design controls and `?design-preview=1` no longer affect the public homepage (V10-B would re-map them) |
| D1 `DB` binding | A indirectly (Journal); C for design | untouched |
| R2 `MEDIA` binding | C | untouched; no public media route exists, so Journal images are not shown |
| Cloudflare Access vars | C | untouched |
| `run_worker_first` list | unchanged | `/api/design` stays Worker-first; harmless |

## Tests and evidence

- `node --test tests/v10-home.test.mjs`: **12/12 PASS**.
- Full `npm test` (Linux, Node v22.22.2): **913/913 PASS**, exit 0 (the count dropped from 936 because the five suites for deleted code were removed with it).
- `npm run build`: **PASS**; static `/`, `/_not-found`, `/admin`, `/journal`.
- `git diff --check`: clean. `sha256sum -c SHA256SUMS` in `clean/`: OK.
- **Parity against the pinned V10 reference** (1.0% threshold, channel tolerance 32), in % of pixels differing:

  | View | Desktop Still | Desktop Full | Mobile Still | Mobile Full |
  |---|---|---|---|---|
  | Entry | 0.00 | 0.02 | 2.21 | 2.15 |
  | Systems | 0.73 | 0.58 | 1.86 | 1.78 |
  | Projects | 0.59 | 0.47 | 0.94 | 0.85 |
  | Research | 8.39 | 7.86 | 12.98 | 12.89 |
  | Contact | 0.41 | 0.34 | 3.00 | 2.46 |

  **9/20 within threshold**, including desktop Entry pixel-identical. The previous implementation measured 3.4–26.9% on every view.
- **Repeatability:** Still ≤ 4 px. Full up to 2,432 px (video frame decode).
- **Errors:** no page errors and no console errors or warnings in any candidate capture.
- **axe:** **0 violations** (0 serious, 0 critical) on all 10 views. Only `incomplete` items remain.
- **Routing, keyboard and interaction checks:** routing incl. aliases, Escape, focus, project roving keys, `08 / 08` counter, discipline select, mailto, Journal links, D1 menu (44px, Escape, navigate-and-close), D2 (0 overlapping visible labels): all PASS.
- **Network:** no external requests; the only API path is `/api/journal`; no forbidden runtime strings in `out/`.
- **Local Workers runtime** (`wrangler dev --local`, wrangler 4.131.1, local simulation only):
  - `/` and `/journal` return 200; `/admin` returns 401; assets 200; unknown path 404.
  - `/api/journal` and `/api/design` return **500** with `D1_ERROR: no such table: journal_entries` / `theme_settings` against the empty local D1.
  - In the browser: no exception; Research shows "The journal could not be loaded right now."; `/api/design` is never requested.

## Preview

The push of this commit triggers the existing Workers Builds non-production branch build (`npx wrangler versions upload`, no promotion; D-055 / `ML-DEVOS-AS-074`).
- **Stable branch alias:** `https://governance-maisoglabs-v0-1-maisog-labs.paulomaisog284.workers.dev` (from the check run on `146f645`).
- **Version ID and per-version URL:** appear in the "Workers Builds: maisog-labs" check run on this commit.
- **Verification:** this session cannot open either URL. Preview verification is Paulo's to run and record.

## SU adversarial pass

| Challenge | Finding |
|---|---|
| Missing V10 assets | none: every referenced asset/font exists (test) and loads (no 404 / console error); `plate-aqueduct` intentionally unused |
| Old CSS contaminating V10 | none: the homepage loads only the 1.4 KB V10 stylesheet; the old stylesheet is route-scoped to `/journal` (its built chunk hash is unchanged) |
| Hidden dependency on removed code | none found: build, 913 tests and a repo-wide search pass; admin only mentions `DesignRuntime` in comments |
| Static preview vs Cloudflare runtime | local `wrangler dev` serves the same `out/` with the same `html_handling`/`run_worker_first`; routes and fail-safe behave the same. **Not proven on Cloudflare itself.** |
| Broken routes | none locally (`/`, `/journal`, `/admin`, 404, redirects). The hash routes are client-side and were verified. |
| Client-only interactions after deployment | verified on the built static output and under workerd; not on the preview host |
| D1/env binding differences | **open risk:** production `/api/journal` has returned 500/1101 since Gate D (AS-116). The local runtime reproduces it exactly with a bound but unmigrated D1 (`no such table`), which now **strongly supports** that hypothesis. `wrangler.jsonc` carries no `database_id`, so how production's D1 is bound is **unresolved**. Until it is fixed, V10's Research panel shows its error line in preview and production. |
| Mobile breakage | none found at 390×844: no horizontal overflow, D1/D2 pass; 2–3% residuals are attributed |
| Animation failures | Full-mode captures show V10's entry, orbit, video crossfade and panel transitions; entry pre-render flash guarded (N2) with a fail-safe reveal |
| Stale cache/assets | Next chunks are content-hashed; `/v10/*` asset names and hashes unchanged; HTML is served by the assets binding. A CDN edge cache of old HTML is possible until revalidation. **Not verifiable here.** |
| Data loss | none possible from this change: no Worker, migration, binding or data operation |
| Local-only features | none: no dev-only code path; the fixture Journal is harness-only |

## Unresolved findings and limitations

1. **Fidelity differences** (full list: `V10_DIVERGENCE_REGISTER.md`, D-092 section):
   - C1–C6: eight projects and the 8-slot ring; approved spelling; three projects without flow or description; approved email; real Journal cards without images or tags; no filter row;
   - D1 and D2 (approved);
   - N1: hash aliases;
   - N2: pre-render reveal guard;
   - N3: fixed design-tool defaults;
   - N4: `/journal` keeps its pre-V10 design;
   - N5: `/api/design` no longer used.

   The PROPOSED items need Architect review and owner approval.
2. **Content provenance:** V10's copy for Sentinel/DevOS, SU, ClinicFlow, Maisog Kilat and Maisog Guild (taglines, descriptions, flows) is used as owner-supplied under D-092. D-090's V10-A had withheld Kilat/Guild details pending verified records (its D5). Paulo should confirm this copy.
3. **Architecture:** removing the public `/api/design` layer supersedes RFC-021 §7 for the homepage. The Architect should decide whether this needs an RFC-021 amendment. Admin design controls now have no public effect.
4. **Accessibility:** axe `incomplete` items (contrast over imagery, the decorative video's captions) are not manually triaged.
5. **Preview/production verification** is owner-run; this session has no Cloudflare or `workers.dev` access.
6. Unused `components/ProjectRail.js`, `components/BlueprintIcon.js` and `public/v10/assets/plate-aqueduct-v4.png` remain, because they are outside D-092's surfaces.
7. **Carried forward:**
   - AS-116 production API incident open;
   - S6 parked at ML-DEVOS-AS-103, O1 and O2 open;
   - D-068 held;
   - PR #7 and PR #10 unmerged.

## Remaining production risks

1. Research panel error line in production until the `/api/journal` D1 defect (AS-116) is fixed. This is now strongly supported as an unmigrated production D1; the fix is a separate owner-authorized remote D1 migration or binding action.
2. Divergences C3, C5, C6 and N2–N5 are not yet owner-approved.
3. Behaviour on the real Cloudflare edge (cache, headers, Access on `/admin`) is not verified by the Builder.
4. `/journal` still shows the pre-V10 design, so the site has two visual languages until a V10 Journal page is designed.

## Exact production promotion operation (not performed; not authorized)

Governed path (D-057: merge and promotion are separate gates; same shape as Gate D):
1. Separate owner decisions for (a) merging `governance/maisoglabs-v0.1` → `main` at an exact reviewed SHA and (b) production promotion.
2. After the merge, Workers Builds runs `npx wrangler versions upload` for `main`. Record the new Version ID, whose provenance must be alias `main` / `version_upload`.
3. From an authenticated session, re-read the active deployment, since the rollback target is whatever is active then (Gate D promoted `a667fc09-12d1-4fde-a75d-5d660729baa3`). Then promote exactly one allocation, without `force`:
   `npx wrangler versions deploy <MAIN_VERSION_ID>@100% --yes`
   (equivalently, the Cloudflare deployment API with that single 100% allocation).
4. Verify production read-only: Entry, the four panels, aliases, 404, `/admin` → Access, `/journal`, and the Research state.
5. **Rollback:** `npx wrangler versions deploy <PREVIOUS_ACTIVE_VERSION_ID>@100% --yes`.

Promoting the governance-branch preview version directly (`versions deploy <PREVIEW_VERSION_ID>@100%`) is technically possible. It would bypass the main-merge gate, so it is not recommended.

## Evidence locations

- `docs/product/evidence/v10/clean/` (README, `results.json`, captures, compares, harness, `SHA256SUMS`).
- `docs/product/V10_DIVERGENCE_REGISTER.md`, `docs/product/V10_IMPLEMENTATION_CONTRACT.md`.
- `tests/v10-home.test.mjs`.
- `coordination/archive/directives/DIR-WEB-V10-CLEAN-0001.md`; rollback branch `snapshot/pre-v10-clean-replacement`.

## Governing references

- **Authority:** D-092 (with D-088).
- **Directive:** DIR-WEB-V10-CLEAN-0001 (archived).
- **Review context:** ML-DEVOS-AS-119 (superseded re-review), ML-DEVOS-AS-116 (incident).
- **Related:** ML-DEVOS-RFC-021, ML-DEVOS-RFC-010, D-057, D-055.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect independently reviews this replacement under the next unused immutable Architect Sync ID after ML-DEVOS-AS-119, including the PROPOSED divergences and the RFC-021 §7 consequence. Paulo verifies the Workers Builds preview for this commit. Main merge, production promotion, the D1 fix and any rollback are separate owner decisions.
