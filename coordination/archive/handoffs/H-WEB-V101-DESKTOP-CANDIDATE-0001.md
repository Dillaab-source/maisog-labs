# Current Handoff — V10.1 desktop remediation candidate (D-120)

```yaml
schema_version: 1
handoff_id: H-WEB-V101-DESKTOP-CANDIDATE-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: 5d2b46b276c38d30486518a5689ce3bef0ce28be
review_target_commit: 5d2b46b276c38d30486518a5689ce3bef0ce28be
applicable_review_id: ML-DEVOS-AS-144
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence class: **`ACTOR_REPORTED`, local only.** Every build, test and headless-browser result below was produced in the Builder's container. Nothing here is production evidence. No remote resource was read or mutated for this work.

## Objective

Execute `DIR-WEB-V101-DESKTOP-CANDIDATE-0001` (D-120, `ML-DEVOS-AS-144`): one reviewable, repository-local V10.1 desktop candidate that keeps the V10 identity and fixes the bounded desktop issues D-120 lists. The canonical artifact stays canonical.

## Result

**Candidate built, deterministic and tested. Runtime hardening: IMPLEMENTED.**

- **Canonical artifact unchanged:** `public/index.html` is still SHA-256 `2417f7e5…`, and the Next build still emits it byte-identically as `out/index.html`.
- **Suite:** 958/958 pass, including 8 new candidate tests. The Next build is green.
- **Browser checks:** 1440×900 and 1280×720, six variants, all pass.

The review diff is `5d2b46b..` this return commit.

## Return items (D-120)

### 1. Files changed

See **Changed files** below.

### 2. Candidate commit SHA

This return commit. It carries both the candidate and the return, as with D-111 at `9abb5f6`. A commit cannot name its own SHA; the publication result and the governance branch tip record it. The candidate is identified independently by its content hash (item 3).

### 3. Candidate artifact SHA-256

| Item | Value |
|---|---|
| `candidates/v10.1/site/index.html` | **`220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`**, 20,857 bytes (V10: 1,969,988) |
| `</head>` byte offset (bridge insertion point) | 20,116 |
| Assets | 34 files, 725,925 bytes; each file name carries its SHA-256 prefix, checked by the test |
| React / ReactDOM (vendored) | `d949f1c3687aedadcedac85261865f29b17cd273997e7f6b2bfc53b2f9d4c4dd` / `35f4f974f4b2bcd44da73963347f8952e341f83909e4498227d4e26b98f66f0d`, unmodified from the npm tarballs; both tarball integrity values verified against the registry |

Two consecutive builds produced identical bytes (Node 22.22.2; esbuild 0.28.1 through the locked `wrangler` dependency). The D-093 artifact stays canonical; this is a review candidate only.

### 4. Screenshots

`candidates/v10.1/evidence/screenshots/`, at 1440×900 and 1280×720:
- **After:** `candidate-bridge-*`, with the five D-115 projects spliced through the unchanged bridge. Entry, keyboard focus, Systems, projects 1–5, Research, Contact, Contact focus.
- **Before:** `baseline-bridge-*`, the canonical artifact with the same splice. Entry, Research, Contact.
- **Long address:** `*-longemail-*-contact`.

### 5. Tests

See **Tests and evidence** below.

### 6. Research: before and after

| | V10 | V10.1 |
|---|---|---|
| Heading | "Research Notes" | **"Research Previews"** |
| "More notes →" | `<a href="#">` (dead) | **"Notes in preparation"**: a plain `<span>`, not focusable, not a link |
| Note cards | `<a href="#">`, tabbable, hover underline and arrow | **`<article>`**, not links: `NoteCard` renders `<a>` only when given a destination and has no default `"#"`; underline and arrow only for links |
| Filters | work | unchanged, work |

### 7. Document and SEO

- **Document:**
  - `<html lang="en-PH">`; one `<main id="main">` landmark around the app;
  - meta description; canonical `https://maisoglabs.com/`;
  - Open Graph `type`, `site_name`, `title`, `description`, `url` and `locale en_PH`; Twitter `summary` card with title and description;
  - heading order (h1 → h2 → h3) and the `:focus-visible` rule are unchanged and verified.
- **Metadata now survives load.** In V10 none of it existed after load: the unpacker replaces the whole document, and the headless check found `lang`, description, canonical and OG all null. In V10.1 it is present after load.
- **No `og:image`:** no approved share image exists. It is deferred as a content decision.
- **SEO files:**
  - `robots.txt`: `User-agent: *`, `Disallow: /admin`, plus the sitemap URL;
  - `sitemap.xml`: `/` and `/journal`; both return a public 200 today.

### 8. Contact wrapping

This is a desktop presentation change only: no email publication and no `site_settings` change. The data source is unchanged: `MLData.EMAIL`, or the RFC-022 contact override.

The patch:
- address font `clamp(18px,2.2vw,30px)` → `clamp(16px,1.75vw,26px)`;
- column `min(360px,62vw)` → `min(440px,62vw)`;
- a `<wbr>` before "@";
- `overflowWrap:anywhere` kept only as a last resort.

| Address | V10 | V10.1 |
|---|---|---|
| Current artifact address, 1440×900 | 30px, **2 lines** (broke mid-address) | 25.2px, **1 line** |
| Current artifact address, 1280×720 | 28.16px, 1 line | 22.4px, 1 line |
| 50-character synthetic address (`correspondence.long-address@maisoglabs-example.com`, local only), 1440 / 1280 | 4 / 3 lines, arbitrary breaks | 2 lines, broken only at "@"; no clipping or overflow |

An intermediate `white-space: nowrap` attempt clipped the long address off-screen. It was measured, rejected, and is not in the candidate.

### 9. Runtime hardening: **IMPLEMENTED**

This stays within the D-120 stop rule: no replatforming and no new build system. There is one Node script and no new dependency.

- No self-unpacking bundle.
- No in-browser Babel and no `text/babel`: the six JSX panels and the mount script are precompiled with esbuild, using the same classic `React.createElement` transform.
- React and ReactDOM are the 18.3.1 **production** UMD builds; the headless check confirmed production mode.
- All scripts sit at the end of `<body>`, in the original order; the head is script-free.
- Fonts, the icon and the scripts are content-fingerprinted files under `/v101/assets/`.
- **Caching quick win:** `_headers` sets `/v101/assets/*` to `Cache-Control: public, max-age=31536000, immutable`. `index.html` keeps the default.

### 10. RFC-022 bridge compatibility

The seam is compatible; the constants must change at promotion.

- **Seam holds:**
  - The candidate head is script-free, and `</head>` is at byte 20,116.
  - The unchanged `buildBridgeSpan`, spliced there, installs the `window.MLData` setter before the data script runs.
  - The data script is byte-identical to V10, so the merged keys are unchanged: `DISC` (6), `PROJ`, `FLOW`, `PSLOTS`, `EMAIL`.
- **Browser proof:**
  - With the payload built by the unchanged `buildBridgePayload` from the five D-115 projects, the candidate renders exactly ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU and Maisog Kilat.
  - Its project text, pager and `MLData` are identical to the canonical artifact under the same splice.
  - The contact override also applies (long-email variant).
- **Constants pin V10:** `ARTIFACT_SHA256`, `ARTIFACT_LENGTH` and `INSERTION_OFFSET` in `worker/bridge/inject.mjs` pin the canonical bytes, so the current Worker cannot bridge the candidate.
  - If `public/index.html` were replaced without updating them, `worker/public/home.mjs` would fall back to the unbridged asset. That fails closed, but the bridge would not apply.
  - Promotion must update the constants and the artifact tests in the same commit.

### 11. Promotion steps (not authorized)

1. A Paulo decision naming this candidate SHA (`220ce809…`).
2. Copy `candidates/v10.1/site/index.html` to `public/index.html`, and copy `site/v101/`, `robots.txt`, `sitemap.xml` and `_headers` into `public/`.
3. In the same commit:
   - set `ARTIFACT_SHA256` = `220ce809…`, `ARTIFACT_LENGTH` = 20857 and `INSERTION_OFFSET` = 20116;
   - rewrite `tests/homepage-artifact.test.mjs`, which asserts the V10 bundle structure, and update the bridge tests.
4. Full suite and build; Gate C (`main` merge); Gate D (deploy), with pre/post checks of `/` (bridged and unbridged) and `/v101/assets/*` headers.
5. Rollback: the previous Worker version restores the V10 artifact and constants together.

Mobile remediation stays deferred.

## Changed files

- **New — candidate:**
  - `scripts/build-v101-candidate.mjs` (the build);
  - `candidates/v10.1/`: `README.md`, `build-report.json`, `site/` (`index.html`, `robots.txt`, `sitemap.xml`, `_headers`, `v101/assets/` with 34 files), `vendor/` (React 18.3.1 production UMD and license).
- **New — evidence:** `candidates/v10.1/evidence/`: `harness/serve.mjs`, `harness/run.cjs`, `browser-results.json`, `browser-summary.txt`, `screenshots/` (32 JPEGs).
- **New — test:** `tests/v101-candidate.test.mjs`.
- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-V101-DESKTOP-CANDIDATE-0001.{md,provenance.json}` (byte-for-byte, unchanged since issue at `5d2b46b`) and its index row.
- **Unchanged:**
  - `public/index.html`; `worker/**` (including the bridge constants); `wrangler.jsonc`; `package.json`/lockfile; `.gitignore`;
  - `coordination/OPERATIVE_OBLIGATIONS.md`.

## Tests and evidence

- **`npm test`: 958/958 pass.** The new `tests/v101-candidate.test.mjs` (8 tests) checks:
  - the canonical artifact is unchanged and still bridge-pinned;
  - the candidate equals its build report;
  - the head is script-free, with `</head>` at the reported offset, and the hook precedes the data script;
  - no Babel, development React or unpacker;
  - the metadata is present;
  - every asset fingerprint matches its content;
  - no dead `#` links;
  - the SEO files and cache header are exact.
- **`npm run build`:** green; `out/index.html` = `2417f7e5…`.
- **Headless Chromium** (`evidence/harness`, rerun from the repository copy):
  - variants: canonical and candidate, each plain, with the D-115 bridge span, and with the span plus a long synthetic email;
  - viewports: 1440×900 and 1280×720.

| Check (D-120) | Candidate result at both viewports |
|---|---|
| Entry / landing renders | yes; `h1` wordmark, hero, nav |
| Systems works | yes; text identical to V10 |
| All five projects render and navigate | yes, through the index list and 5× "Next" in the pager. Plain: V10's own data. Bridged: ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat |
| Research filters work | yes. Research / Build / Thoughts / All → 1 / 1 / 1 / 3 cards, `aria-pressed` true; identical to V10 |
| Research has no dead links | yes. V10 has 4 `a[href="#"]` in Research (+1 wordmark); V10.1 has 0 anywhere |
| Contact works visually | yes; see item 8 |
| Keyboard focus visible | yes. First Tab lands on the wordmark link, `:focus-visible`, `outline: solid 2px`; the mailto link is also `:focus-visible` |
| No new console errors | yes. 0 errors and 0 warnings, apart from the logo-video codec limitation below; V10 also logs the in-browser Babel warning |
| No desktop horizontal overflow | yes. `scrollWidth == innerWidth` on every view |
| Project content unchanged | yes. The project text, pager order, Systems text and `MLData` are identical between V10 and V10.1, both plain and bridged |
| RFC-022 MLData compatibility | yes; see item 10 |

**Environment limitation:** `/assets/video/logo-mark.mp4` (H.264) fails to load in Playwright's Chromium, which has no proprietary codecs. It fails identically for V10 and V10.1, and the poster image shows. It is not a regression.

**Local render timing** (navigation to the rendered `h1`; indicative only, local server):
- V10: about 1.13–1.20 s;
- V10.1: about 0.30–0.34 s.

## Unresolved findings and limitations

- **Not performed:**
  - no promotion; `public/index.html` not replaced; bridge constants unchanged;
  - no Gate C, `main` merge or deploy;
  - no production D1/R2/Access/DNS/binding/secret/environment action;
  - no project content edit, publication or activation; no contact/`site_settings` change; no mobile work.
- **Evidence limits:**
  - all evidence is local headless Chromium; there was no real-device or Safari/Firefox check;
  - the logo video cannot play in this Chromium (codec), for V10 and V10.1 alike;
  - render timings are indicative only.
- **Build reproducibility** depends on esbuild 0.28.1 (transitive, locked). A different version could change the minified bytes; the build report and tests would detect it.
- **Unused code:** the design-system bundle keeps its own unused UI-kit panel copies, overridden by the page panels as in V10. Only `NoteCard` was patched there.
- **`og:image`** is deferred until an image is approved.
- **Publication attempt keys:** this return uses the default attempt key. The local ledger was not edited.
- **Carried forward:**
  - AS132-F002 applies at initial activation; AS132-F003 remains open;
  - the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- **Candidate:**
  - `candidates/v10.1/site/`; `candidates/v10.1/build-report.json`;
  - `candidates/v10.1/README.md` (provenance, integrity, promotion, deferred items).
- **Build:** `scripts/build-v101-candidate.mjs`.
- **Tests:** `tests/v101-candidate.test.mjs`.
- **Browser evidence:**
  - `candidates/v10.1/evidence/browser-results.json` (full per-variant results);
  - `candidates/v10.1/evidence/browser-summary.txt`;
  - `candidates/v10.1/evidence/screenshots/`.
- **Harness:** `candidates/v10.1/evidence/harness/`.
- **Canonical references:**
  - `public/index.html` (`2417f7e5…`);
  - `worker/bridge/inject.mjs`, `worker/bridge/payload.mjs`, `worker/public/home.mjs`;
  - `brain/DECISION_LOG.md` § D-115 (content used for the bridged runs), § D-120.

## Governing references

- **T0:** Protocol V2; D-120; `ML-DEVOS-AS-144`.
- **T1:** `ML-DEVOS-RFC-022` §5.1, §5.2, §5.4; D-093; D-115.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-V101-DESKTOP-CANDIDATE-0001.md`.

## Next action

The Architect reviews the V10.1 candidate under a new immutable `ML-DEVOS-AS-NNN`. Promotion, Gate C, deploy, initial activation and mobile each need separate Paulo authorization.
