# MaisogLabs homepage artifact contract (D-093)

Status: Builder implementation contract under **D-093**. It supersedes, for `/` only, the D-092 V10 homepage (`V10_IMPLEMENTATION_CONTRACT.md`).

## What `/` is

`public/index.html` is `publish/index.html` from `design-references/maisoglabs-design-system/Maisog Labs Design System.zip`, byte-for-byte (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`). It is never edited; changes come only as a new artifact from Paulo.

## How it is built and served

- The Next.js app has **no `/` route** (`app/page.js` removed). The static export (`output: "export"`) copies `public/` into `out/`, so `out/index.html` is the artifact unchanged. No build script or package change is involved, so the same holds for any build command (`npm run build`, `next build`, Workers Builds).
- Cloudflare Workers static assets serve `out/`; `html_handling: auto-trailing-slash` serves `/` from `index.html`. `wrangler.jsonc` and the Worker are unchanged: `/admin*`, `/api/journal*` and `/api/design` stay Worker-first.
- The artifact's media resolve to `/assets/…`, served by byte-identical copies of the approved V10 assets (`design-references/maisoglabs-design-system/README.md`).
- `/journal` and `/admin` are unchanged Next.js pages using `app/layout.js`.

## Tests

`tests/homepage-artifact.test.mjs`: ZIP and artifact hashes (the ZIP entry is re-extracted and compared), absence of a Next.js `/` route, every media path the decoded artifact requests is mapped to a byte-identical approved asset, the artifact loads no network script/stylesheet/font/icon (all embedded), and the Worker routing contract is unchanged. Browser/runtime evidence: `docs/product/evidence/homepage-artifact/`.

## Known consequences (recorded in D-093)

The homepage shows the artifact's own content and behaviour: five projects, `Sentinel / DevOS`, `maisog36@gmail.com`, three placeholder Research notes with category filters (not real Journal data), no `#research`/`#process`/`#about` aliases, no compact mobile navigation (Research/Contact links run off-screen at 390px), React development builds with in-browser Babel (about 2 MB HTML).
