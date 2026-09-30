# Current Handoff — D-129 homepage copy (two strings)

```yaml
schema_version: 1
handoff_id: H-WEB-D129-HOMEPAGE-COPY-0001
cycle_id: MAISOGLABS_WEB_D129_HOMEPAGE_COPY
input_base_commit: 08d192276d89d96de3553ebe3a5487f00465b7c4
review_target_commit: 08d192276d89d96de3553ebe3a5487f00465b7c4
applicable_review_id: ML-DEVOS-AS-156
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. All results are `ACTOR_REPORTED` (Builder-run, cloud container, local headless Chromium); nothing is deployed and production is unchanged.

## Objective

Under `DIR-WEB-D129-HOMEPAGE-COPY-0001` (D-129): apply exactly two homepage copy edits at the canonical V10.1 source level, regenerate through the existing V10.1 build path, and verify on desktop. The result is a repository-local candidate only: no merge or deploy.

## Changed files

The candidate commit is this return commit, parented on the issue commit `08d1922`, which published D-129 and the directive.

**Source (the only hand edit):** `scripts/build-v101-candidate.mjs`.
- Where V10.1 lives: it is defined by this script, as the canonical V10 artifact plus exact-match patches. The strings are code-owned JSX literals in the Entry panel, not D1/admin/`site_settings` data.
- `patchEntry` gains two exact-match patches:
  - the lower-left `<p>` text becomes the identity line, `<br />`, then the supporting line (same element, same style);
  - the three stack `<span>`s become AI, AUTOMATION, SYSTEMS.
- The script now also accepts the pinned V10 artifact as an explicit input path (SHA-256 `2417f7e5…` still verified), because `public/` holds the promoted V10.1 page.

**Direct build outputs:**

| File | Change |
|---|---|
| `candidates/v10.1/site/v101/assets/entry.7995859f655d.js` → `entry.e184fa740d43.js` | Replaced (7,485 → 7,563 bytes) |
| `candidates/v10.1/site/index.html` | One line: the entry `<script src>` |
| `candidates/v10.1/build-report.json` | Index SHA, entry file name and size, asset total |
| `public/index.html`, `public/v101/assets/entry.e184fa740d43.js` | Byte copies of `site/`; old entry asset removed; all 34 assets byte-identical to `site/` |

No other asset changed. `design-system`, `data`, the panels, fonts, vendor, `robots.txt`, `sitemap.xml` and `_headers` are byte-identical.

**Pinned constants that follow mechanically from the new index hash:**
- `worker/bridge/inject.mjs`: `ARTIFACT_SHA256` and its comment. `ARTIFACT_LENGTH` (20,857) and `INSERTION_OFFSET` (20,116) are unchanged.
- The one pinned SHA line in `tests/homepage-artifact.test.mjs` and in `tests/v101-candidate.test.mjs`.
- `candidates/v10.1/README.md`: the table values and a D-129 note.

**Evidence:** `candidates/v10.1/evidence/d129/` (`serve.mjs`, `run.cjs`, `summary.txt`, `shots/results.json`, 30 JPEG screenshots).

**Bookkeeping:** STATE, this handoff, and the directive archive (entry, provenance, index row).

## Tests and evidence

**Strings.**

| | Before | After |
|---|---|---|
| Lower-left | "The independent technology laboratory of Paulo Maisog, building AI automation, research systems, and experimental software." | "Paulo Maisog — AI Automation & Technical Systems Builder" (identity line), then "Building practical AI workflows, cloud automation, and technical systems for real-world business processes." (supporting line) |
| Lower-right stack | Humanity / Orbits / Higher | AI / AUTOMATION / SYSTEMS |

The stack keeps its existing uppercase letter-spaced style; no punctuation was added.

**Artifacts.**

| | Old | New |
|---|---|---|
| Homepage `index.html` SHA-256 | `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc` | `f60179dd6f9e71c9f94d72eb66ac4686bb119a9a5dc781d315803f59df4d2fe3` |
| `index.html` bytes | 20,857 | 20,857 (unchanged) |
| Entry asset | `entry.7995859f655d.js` (SHA-256 `7995859f655d54b8…`) | `entry.e184fa740d43.js` (SHA-256 `e184fa740d4309d9…`) |

**Build path.**
- Toolchain: `npm ci`, then Node 22.22.2 and esbuild 0.28.1, the same versions recorded for D-120.
- Rebuilding from the pinned V10 artifact **without** the D-129 patches reproduced the committed V10.1 bytes exactly: `220ce809…`, all 34 assets, and `public/` identical to `site/`.
- **With** the patches, only the entry asset, its reference and the derived hashes change.
- An unminified comparison of the Entry panel before and after shows exactly the two string changes. The minified bundle also shows single-letter identifier renames, which is esbuild's name allocation, not a behavior change.

**RFC-022 compatibility: no substantive change.**
- The bridge logic, payload, data script (`data.f804d6673bf6.js`), `MLData` keys, head (script-free) and `</head>` offset 20,116 are unchanged.
- Only the pinned artifact SHA moves to the new index, the mechanical consequence AS-150 anticipated.
- Verified in the browser with the unchanged `buildBridgeSpan` and the five D-115 projects: ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat.
- Without the bridge, the candidate falls back to the artifact's built-in data, the same fallback behavior as before.

**Desktop verification** (`evidence/d129/summary.txt`; 1440×900 and 1280×720; baseline = pre-D-129 V10.1 plus bridge, candidate = D-129 plus the same bridge, and raw):

| # | Check | Result |
|---|---|---|
| 1–2 | Identity and supporting lines | Render exactly (5 lines at both viewports; natural wrapping: "Technical / Systems Builder", and at 1440 "real- / world") |
| 3 | Stack | Renders as AI / AUTOMATION / SYSTEMS in the three-line treatment; computed style identical to baseline |
| 4 | Clipping | None (`scrollWidth`/`scrollHeight` within the element box; both blocks inside the viewport) |
| 5 | Horizontal overflow | None (`scrollWidth` = `innerWidth` on the entry view and every panel) |
| 6 | Overlap | None between either block and the wordmark, logo stage or tagline |
| 7 | "Ideas in Orbit" | Unchanged; the wordmark is unchanged |
| 8–12 | Navigation, Systems, Projects (all five, same order and text), Research, Contact | Text identical to baseline at both viewports; Escape returns to the entry view |
| 13 | Console | 0 errors and 0 warnings. The two `logo-mark.mp4 net::ERR_ABORTED` requests occur identically in the baseline, so they are pre-existing and not attributable |

**Tests:**
- Full `npm test` with the locked dependencies installed: 978/978. The Worker/D1 suites that previously failed for missing packages now run and pass.
- After the README update: the homepage/bridge suites (`homepage-artifact`, `v101-candidate`, `rfc022-bridge`, `worker-rfc022-content`) 45/45.
- Traceability: unchanged from baseline (3 pre-existing errors, 13 warnings; RFC projection 0 errors).
- Checker `--check-only`: every check ok before `--publish`.

**Manual changed-file inspection (`OBL-023`):** the diff contains only the files listed above. No `data/`, `lib/`, `worker/` logic beyond the constant, migrations, D1/R2, `wrangler.jsonc`, governance or RFC file.

## Unresolved findings and limitations

1. **Hero shift (for your judgment).** The lower-left block grew from 3–4 lines to 5, so the centred hero column (logo, wordmark, tagline) moves up without resizing:
   - 1440×900: 14 px (logo top 172 → 158);
   - 1280×720: 25 px (147 → 122).

   There is no overlap, and the gap from tagline to text is 100 px and 57 px respectively. I judged this natural wrapping, not a redesign, and the hero was not touched to compensate.
2. **Presentation.** The identity line and the supporting line share the paragraph's existing style, separated only by a line break; nothing was added to distinguish them (D-129: no embellishment). The Architect or Paulo may prefer a visual distinction; that would be a design change beyond D-129.
3. **Retained duplicate.** `design-system.c349f854986d.js` still carries an earlier duplicate `Entry` with the old strings. `entry.js` overwrites it at load, and it is never rendered (the DOM check confirms no old copy). It is left unchanged because editing it would change a second asset beyond D-129's minimal scope. The separate closing line "Humanity / orbits higher." in the design-system and contact bundles is also unchanged, since it was not covered by D-129.
4. **Mobile** was not verified (deferred by D-129).
5. **Evidence class.** Screenshots and checks are local and headless, with no production observation, as authorized.

## Governing references

D-129; `ML-DEVOS-AS-156`; D-126 (otherwise in force); D-120/D-121 and `candidates/v10.1/README.md`; `ML-DEVOS-RFC-022`, `worker/bridge/inject.mjs`; `ML-DEVOS-AS-150`; `coordination/OPERATIVE_OBLIGATIONS.md` (`OBL-023`).

## Evidence locations

- `candidates/v10.1/evidence/d129/summary.txt`, `shots/results.json` and `shots/*.jpg`:
  - `candidate-bridge-1440x900-entry.jpg`, `candidate-bridge-1280x720-entry.jpg`;
  - the baseline equivalents, and all panels.
- Reproduce:

  ```
  git show f2c13aa:public/index.html > /tmp/v10.html
  node scripts/build-v101-candidate.mjs /tmp/v10.html
  ```

  Then run `node serve.mjs` and `node run.cjs` in `evidence/d129/`.

## Next action

Architect review of the D-129 candidate. Merge and deployment need a separate Paulo decision after acceptance.
