# V10.1 desktop review candidate (D-120)

**Status: ACCEPTED (`ML-DEVOS-AS-145`) and PROMOTED IN THE REPOSITORY (D-121).** `public/index.html`, `public/v101/`, `public/robots.txt`, `public/sitemap.xml` and `public/_headers` are byte-for-byte copies of `site/`, and the RFC-022 bridge constants pin these bytes. Production still serves the V10 artifact (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`) until a separately authorized Gate C and Gate D. `scripts/build-v101-candidate.mjs` derives from that V10 artifact, so it no longer runs against the promoted `public/index.html`: it stops at its source-hash check and writes nothing. The accepted bytes are never regenerated.

Authority: D-120 (Paulo), `ML-DEVOS-AS-144`, directive `DIR-WEB-V101-DESKTOP-CANDIDATE-0001`. Scope is desktop only; mobile remediation is deferred.

## What it is

`scripts/build-v101-candidate.mjs` derives the candidate from the canonical artifact, so the result is reproducible:

1. It verifies the artifact SHA-256 above and decodes its self-unpacking bundle (manifest and template).
2. It applies exact-match patches. Each must match exactly once, or the build fails.
3. It writes a plain static page to `site/`.

The build is deterministic: two consecutive builds produce identical bytes. It was built with Node 22.22.2 and esbuild 0.28.1. esbuild is not a direct dependency: it comes through the locked `wrangler` dependency, so `package.json` is unchanged. A different esbuild version could change the minified bytes.

| Item | Value |
|---|---|
| `site/index.html` SHA-256 | `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc` |
| `site/index.html` bytes | 20,857 (the canonical artifact is 1,969,988) |
| `</head>` byte offset (bridge insertion point) | 20,116 |
| Fingerprinted assets | 34 files, 725,925 bytes, under `site/v101/assets/` |
| `site/robots.txt` | `801054c0c9a7cc4889073fb5e48f9817c3e8ea3f178c142f855a260a7aebe633` |
| `site/sitemap.xml` | `24b7f122047ec3951c43848a43599ee0225312e9b5bc7a47fba058e4248f7fab` |
| `site/_headers` | `4db7f4cb0bf966b81af7d897ddf734cabbcbded4de6b91a61140d4983c2a81e1` |

`build-report.json` lists every asset and its size. Each asset file name carries the first 12 hex characters of its SHA-256. `tests/v101-candidate.test.mjs` checks each fingerprint against the file's content.

## Changes from V10

Identity, layout, copy (except the two Research strings below), data and project content are unchanged.

- **Research:**
  - heading "Research Notes" → "Research Previews";
  - "More notes →" (`href="#"`) → non-interactive text "Notes in preparation";
  - note cards are no longer links: `NoteCard` renders `<a>` only when given a destination, with no default `"#"`. The hover underline and arrow appear only for links;
  - the Research / Build / Thoughts filters are unchanged and verified.
- **Wordmark home control:** `href="#"` → `href="/"`. The click handler is unchanged: it prevents navigation and returns to the entry view. With this change, no `href="#"` remains anywhere on the page.
- **Contact** (desktop wrapping only; no email or `site_settings` change):
  - the address font changes from `clamp(18px,2.2vw,30px)` to `clamp(16px,1.75vw,26px)`;
  - the column widens from `min(360px,62vw)` to `min(440px,62vw)`;
  - a `<wbr>` is added before "@";
  - `overflowWrap:anywhere` stays only as a last-resort guard;
  - result: at 1440×900 the current address no longer breaks mid-word (V10: 2 lines; V10.1: 1 line), and a 50-character test address breaks only at "@".
- **Document basics:**
  - `<html lang="en-PH">`;
  - a `<main id="main">` landmark around the application;
  - meta description, canonical `https://maisoglabs.com/`, and Open Graph tags (`type`, `site_name`, `title`, `description`, `url`, `locale en_PH`);
  - Twitter `summary` card (`card`, `title`, `description`).
  - No `og:image`: no approved share image exists, and choosing one is a separate content decision.
  - Heading order (h1 wordmark → h2 sections → h3 items) and the `:focus-visible` rule are unchanged and verified.
  - In V10 the outer-shell metadata was discarded at runtime when the unpacker replaced the document. The candidate is a real document, so its metadata persists.
- **SEO:**
  - `robots.txt`: allow everything except `/admin`, and point to the sitemap;
  - `sitemap.xml`: `/` and `/journal`, both public 200 routes.
- **Runtime hardening: IMPLEMENTED.**
  - No self-unpacking bundle, no in-browser Babel, no `text/babel` scripts.
  - The six JSX panels and the mount script are precompiled once with esbuild, using the same classic `React.createElement` transform.
  - React and ReactDOM are the 18.3.1 **production** UMD builds (`vendor/`) instead of the development builds.
  - Every script moves from `<head>` to the end of `<body>`, in the original order. The head is script-free.
- **Caching:** `_headers` gives only `/v101/assets/*` (content-fingerprinted) the header `Cache-Control: public, max-age=31536000, immutable`. `index.html` keeps the platform default.

### Vendored React (`vendor/`)

The files are taken unmodified from the npm registry tarballs; both tarball integrity values were verified against the registry:
- `react@18.3.1` (`sha512-wS+hAgJShR0KhEvPJArfuPVN1+Hz1t0Y6n5jLrGQbkb4urgPE/0Rve+1kMB1v/oWgHgm4WIcV+i7F2pTVj+2iQ==`) → `umd/react.production.min.js`, SHA-256 `d949f1c3687aedadcedac85261865f29b17cd273997e7f6b2bfc53b2f9d4c4dd`.
- `react-dom@18.3.1` (`sha512-5m4nQKp+rZRb09LNH59GM4BxTh9251/ylbKIbpe7TpGxfJ+9kv6BLkLBXIjjspbgbnIBNqlI23tRnTWT0snUIw==`) → `umd/react-dom.production.min.js`, SHA-256 `35f4f974f4b2bcd44da73963347f8952e341f83909e4498227d4e26b98f66f0d`.
- The MIT license text is in `LICENSE-react`.

## RFC-022 bridge compatibility

The bridge seam is compatible. The constants are not: they pin the canonical artifact.

- **Seam:** the bridge splices its JSON island and hook before `</head>`. The hook installs a `window.MLData` setter before any page script runs (`worker/bridge/inject.mjs`).
  - The candidate's head is script-free; every script, including the data script, runs later in `<body>`.
  - The data script is byte-identical to V10 (fingerprint `f804d6673bf6`), so the `MLData` keys the hook merges are unchanged: `DISC` (6), `PROJ`, `FLOW`, `PSLOTS`, `EMAIL`.
- **Verified in a browser** (`evidence/`): with the unchanged `buildBridgeSpan` spliced at offset 20,116 and a payload built from the five D-115 projects:
  - the candidate renders ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU and Maisog Kilat;
  - the project text, the pager order and `MLData` are identical to the canonical artifact with the same splice;
  - the contact override also applies.
- **Constants:** `ARTIFACT_SHA256`, `ARTIFACT_LENGTH` and `INSERTION_OFFSET` pin the canonical bytes. The current Worker therefore cannot bridge the candidate. If `public/index.html` were replaced without updating them, `/` would serve the new page unbridged (the fail-closed fallback), not an error.

## Evidence

- **`tests/v101-candidate.test.mjs`** (part of `npm test`):
  - canonical artifact unchanged;
  - candidate equals its build report;
  - script-free head and `</head>` at the reported offset;
  - no Babel, development React or unpacker;
  - metadata present;
  - asset fingerprints;
  - no dead `#` links;
  - SEO files and cache headers.
- **`evidence/harness/`** — local headless Chromium checks at 1440×900 and 1280×720, repeatable with `node serve.mjs` then `node run.cjs`.
  - Six variants: canonical and candidate, each plain, with the D-115 bridge span, and with the bridge span plus a long synthetic email.
  - Checks: entry, Systems, all five projects (index list and pager), Research filters and links, Contact, keyboard focus, console errors, horizontal overflow, headings, landmark and metadata.
  - Results: `evidence/browser-results.json` and `evidence/browser-summary.txt`.
- **`evidence/screenshots/`:** before (`baseline-bridge-*`) and after (`candidate-bridge-*`) JPEGs at both viewports.
- **Environment note:** the logo video (`/assets/video/logo-mark.mp4`, H.264) fails to load in Playwright's Chromium, which has no proprietary codecs. This happens identically for V10 and V10.1, and the poster image is shown. Apart from that, V10.1 produced no console errors or warnings; V10 logs the in-browser Babel warning.

## Promotion (not authorized; for a future governed step)

1. Paulo decision to promote a specific candidate SHA. The D-093 artifact stays canonical until then.
2. Copy `site/index.html` to `public/index.html`, and copy `site/v101/`, `site/robots.txt`, `site/sitemap.xml` and `site/_headers` into `public/`.
3. Update the bridge constants in the same commit:
   - in `worker/bridge/inject.mjs`, set `ARTIFACT_SHA256`, `ARTIFACT_LENGTH` and `INSERTION_OFFSET` to the values above;
   - update the artifact tests (`tests/homepage-artifact.test.mjs` and the bridge tests) to match.
4. Build and test, then pass Gate C (`main` merge) and Gate D (deploy), with a pre/post public check of `/` and `/v101/assets/*`.
5. Rollback is the previous Worker version: the V10 artifact and constants are restored together.

## Deferred

- Mobile remediation (D-120).
- `og:image`: needs an approved share image.
- The design-system bundle keeps its own unused UI-kit copies. The page panels override them, as in V10.
