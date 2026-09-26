# Current Handoff — Homepage Artifact Integration (D-093)

```yaml
schema_version: 1
handoff_id: H-WEB-HOMEPAGE-ARTIFACT-0001
cycle_id: MAISOGLABS_WEB_HOMEPAGE_ARTIFACT
input_base_commit: c4703e66e27871ab47ac7f33a92e9c11a8e157ca
review_target_commit: c4703e66e27871ab47ac7f33a92e9c11a8e157ca
applicable_review_id: ML-DEVOS-AS-119
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve, and every result here is `ACTOR_REPORTED`. Nothing here is preview or production evidence: this session cannot reach Cloudflare or `*.workers.dev`.

## Objective

Serve the published Design System artifact byte-for-byte as the homepage `/` (`DIR-WEB-HOMEPAGE-ARTIFACT-0001`, D-093), with its media resolving to the approved V10 assets, keeping `/journal`, `/admin`, the Worker APIs and all bindings unchanged, up to a non-production preview.

**SHAs:**
- base `c4703e66e27871ab47ac7f33a92e9c11a8e157ca` (D-093 + directive);
- result: the commit publishing this handoff;
- rollback: `3a8bb779ddb7ecf6daca2655f0844986c3b81aa8` (D-092 homepage) and branch `snapshot/pre-v10-clean-replacement` (`146f645`);
- main `aebc881e8890c00090d714602591138a045bd3b0` (unchanged).

## Canonical artifact

- **Uploaded ZIP:** `design-references/maisoglabs-design-system/Maisog Labs Design System.zip`, SHA-256 `3ff9fbbaaf40f61fc9b82babafac4e33e9cdc5b723ed78157ef1b2068da6ead2`, stored unchanged.
- **Its only entry:** `publish/index.html`, SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- **Served file:** `public/index.html`, byte-identical and never edited. The same hash was verified in `out/index.html` after `npm run build`, and on the bytes `wrangler dev` serves at `/`.

## Build integration method

`app/page.js` (the only Next.js `/` route) was removed. With `output: "export"`, Next.js copies `public/` into `out/`, so `out/index.html` is the artifact itself.
- There is no build script, package, Worker or Wrangler change, so the result does not depend on which build command runs (`npm run build`, `next build` or Workers Builds).
- Workers static assets serve `/` from `out/index.html` (`html_handling: auto-trailing-slash`).

## Changed files

**Homepage artifact:**
- `public/index.html` (the artifact).
- `design-references/maisoglabs-design-system/{Maisog Labs Design System.zip, README.md}`.

**Media mapping:** byte-identical copies under `public/assets/` (same Git blobs as the originals):

| Served path | Copy of |
|---|---|
| `public/assets/plates/plate-hero-v4.png` | `public/v10/assets/plate-hero-v4.png` |
| `public/assets/plates/plate-aqueduct-v4.png` | `public/v10/assets/plate-aqueduct-v4.png` |
| `public/assets/video/logo-mark.mp4` | `public/v10/assets/logo-mark.mp4` |
| `public/assets/video/logo-mark-poster.png` | `public/v10/assets/logo-mark-poster.png` |
| `public/assets/icons/{01-ai,02-automation,03-security,04-research,05-systems,08-strategy}.svg` | `public/v10/assets/icons/*` |

**Removed (superseded homepage code):**
- `app/page.js`;
- `components/v10/V10Home.js`;
- `v10Content` from `data/site.js`;
- `validateV10Content` from `lib/content/schema.mjs`;
- `tests/v10-home.test.mjs`.

**Added tests:** `tests/homepage-artifact.test.mjs` (5 tests).

**Docs:**
- `docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md` (new);
- `docs/product/V10_IMPLEMENTATION_CONTRACT.md` (a superseded-for-`/` note only);
- `docs/product/evidence/homepage-artifact/**` (screenshots, `acceptance.json`, harness, `SHA256SUMS`).

**Coordination:**
- `CURRENT_HANDOFF.md`, `STATE.md`;
- `archive/directives/DIR-WEB-HOMEPAGE-ARTIFACT-0001.{md,provenance.json}` and the index row (bytes compared identical).

**Untouched:** `worker/**`, `migrations/**`, `wrangler.jsonc`, `package*.json`, `app/admin/**`, `app/journal/**`, `app/layout.js`, `app/globals.css`, every existing `public/**` file, `.github/**`, and all governance/SENTINEL/DevOS records except the D-093 entry. No D1/R2/Access/DNS/secret action.

## Tests and evidence

- `tests/homepage-artifact.test.mjs`: 5/5 PASS. It re-extracts the ZIP entry and compares hashes, decodes the artifact's manifest to confirm every requested media path is mapped to a byte-identical approved asset, confirms every script, stylesheet, font and icon is embedded, and checks that the Worker routing contract is unchanged.
- Full `npm test`: **906/906 PASS**, exit 0. That is 913 − 12 (removed V10 suite) + 5.
- `npm run build`: PASS. Routes `/_not-found`, `/admin` and `/journal`; `/` is the copied artifact.
- `git diff --check`: clean. Evidence `SHA256SUMS`: OK.
- **Local Workers runtime** (`wrangler dev --local`, local simulation only):

  | Route | Status |
  |---|---|
  | `/` | 200, bytes = artifact |
  | `/index.html` | 307 |
  | `/journal` | 200 |
  | `/admin`, `/admin/api/dashboard` | 401 (Access) |
  | `/assets/*` and `/v10/assets/*` | 200 |
  | unknown path | 404 |
  | `/api/journal`, `/api/design` | 500 against the empty local D1 (unchanged from before) |

- **Browser acceptance** (`docs/product/evidence/homepage-artifact/README.md`): checks 1–9 and 11–15 PASS.
  - Check 10 (mobile): renders with no horizontal overflow, but the Research and Contact nav links run off-screen. This is the artifact's own behaviour.
  - Logo playback and crossfade were verified with a VP9 stand-in for the H.264 MP4 in the harness only, because Playwright's Chromium has no H.264 decoder.
  - The only console message is Babel's in-browser-transformer warning.

## Preview

The push of this commit triggers the existing Workers Builds non-production branch build (`npx wrangler versions upload`, no promotion).
- **Stable alias:** `https://governance-maisoglabs-v0-1-maisog-labs.paulomaisog284.workers.dev`.
- **Version ID and per-version URL:** in the "Workers Builds: maisog-labs" check run on this commit.
- **Verification:** preview verification, including native H.264 logo playback, is owner-run.

## Unresolved findings and limitations

1. **Content contradicts D-088** (recorded in D-093; not fixable without editing the artifact):
   - five projects, not the eight approved ones;
   - `Sentinel / DevOS`;
   - `maisog36@gmail.com`;
   - three placeholder Research notes with a category filter and plate images, instead of real Journal entries;
   - "More notes" links to `#`, so the homepage no longer links to `/journal`.
2. **Routing and mobile:**
   - no `#research`/`#process`/`#about` aliases (they open Entry);
   - no compact mobile navigation (V10's clipping returns);
   - the D-092 D1/D2 accessibility fixes do not apply to `/`.
3. **Runtime weight:** about 2 MB of HTML carrying React **development** builds and Babel, which compiles the page in the browser on every visit. Expect slower first render on mobile and a console warning. RFC-021 R2 is superseded for `/`.
4. **Codec:** the logo uses H.264. Native playback was not observed here. Major browsers support it, but a browser without H.264 shows only the poster through the video element.
5. **Favicon:** the artifact's embedded favicon hash differs from `public/v10/assets/favicon.svg`, probably only in its C2PA metadata. It is used as-is.
6. **Leftover code:** `app/globals.css` still carries the D-092 homepage rules. They are harmless, left untouched per "no unrelated cleanup", and are candidates for removal later.
7. **Carried forward:**
   - AS-116 production `/api/journal` incident;
   - S6 parked at ML-DEVOS-AS-103, O1 and O2 open;
   - D-068 held;
   - PR #7 and PR #10 unmerged;
   - the Architect's Design System reconciliation analysis was superseded before completion.

## Evidence locations

- `docs/product/evidence/homepage-artifact/`.
- `design-references/maisoglabs-design-system/`.
- `docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md`.
- `tests/homepage-artifact.test.mjs`.
- `coordination/archive/directives/DIR-WEB-HOMEPAGE-ARTIFACT-0001.md`.

## Governing references

- **Authority:** D-093.
- **Directive:** DIR-WEB-HOMEPAGE-ARTIFACT-0001 (archived).
- **Superseded:** H-WEB-V10-CLEAN-0001 review (archived), D-092 for `/`, RFC-021 R2 for `/`.
- **Related:** D-088, D-057, D-055.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews the artifact integration and the recorded D-088 and RFC-021 contradictions under the next unused immutable Architect Sync ID after ML-DEVOS-AS-119. Paulo verifies the Workers Builds preview.

The exact next production step, which is neither performed nor authorized:
1. A separate owner decision to merge `governance/maisoglabs-v0.1` at the reviewed SHA into `main`.
2. Workers Builds uploads a `main` version (no promotion).
3. Re-read the active deployment for the rollback target.
4. Promote with `npx wrangler versions deploy <MAIN_VERSION_ID>@100% --yes` (a single allocation, no `force`).
5. Verify read-only.
6. Rollback: `npx wrangler versions deploy <PREVIOUS_ACTIVE_VERSION_ID>@100% --yes`.
