# MaisogLabs homepage artifact contract (D-093)

Status: Builder implementation contract under **D-093**. It supersedes, for `/` only, the D-092 V10 homepage (`V10_IMPLEMENTATION_CONTRACT.md`).

## What `/` is

`public/index.html` is `publish/index.html` from `design-references/maisoglabs-design-system/Maisog Labs Design System.zip`, byte-for-byte (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`). It is never edited; changes come only as a new artifact from Paulo.

## How it is built and served

- The Next.js app has **no `/` route** (`app/page.js` removed). The static export (`output: "export"`) copies `public/` into `out/`, so `out/index.html` is the artifact unchanged. No build script or package change is involved, so the same holds for any build command (`npm run build`, `next build`, Workers Builds).
- Cloudflare Workers static assets serve `out/`; `html_handling: auto-trailing-slash` serves `/` from `index.html`. `/admin*`, `/api/journal*` and `/api/design` stay Worker-first.

## Served response and the RFC-022 content bridge (D-105 amendment)

D-105 (Q1) narrowly amends D-093, and `ML-DEVOS-RFC-022` (accepted by `ML-DEVOS-AS-132`) defines the bridge. Implementation: D-106.

- **Unchanged:** the file `public/index.html`, and so `out/index.html`, stays byte-identical to the approved artifact (SHA-256 above). It is never edited.
- **Superseded, narrowly:** the rule that every successful served `/` response equals those bytes.
- **Replacement rule:** exact `/` is Worker-first (`wrangler.jsonc`; no other asset route). The served response differs from the artifact **only** by one bridge span, inserted immediately before the outer `</head>`, and **only** when validated published content exists (`worker/public/home.mjs`, `worker/bridge/*`):

  `<script type="application/json" id="ml-published">…</script><script>…fixed hook…</script>`

  Removing the span yields the artifact bytes exactly. Otherwise, including on any D1 error or timeout, validation failure or caught exception, `/` is the untouched `env.ASSETS.fetch(request)` response.
- **Transformed responses (AS132-F001)** carry no `ETag`, `Content-Length`, `Content-Encoding` or `Last-Modified` from the artifact, and use `Cache-Control: no-store`.
- **Residual risk (accepted by D-105 Q2):** `/` depends on successful Worker execution. A failure before the application fallback runs is not equivalent to asset-first service.
- **Production verification** of `/` therefore checks "equals the artifact, or equals it after removing the bridge span", rather than a plain SHA comparison.
- The artifact's media resolve to `/assets/…`, served by byte-identical copies of the approved V10 assets (`design-references/maisoglabs-design-system/README.md`).
- `/journal` and `/admin` are unchanged Next.js pages using `app/layout.js`.

## Tests

`tests/homepage-artifact.test.mjs`: ZIP and artifact hashes (the ZIP entry is re-extracted and compared), absence of a Next.js `/` route, every media path the decoded artifact requests is mapped to a byte-identical approved asset, the artifact loads no network script/stylesheet/font/icon (all embedded), and the Worker routing contract is unchanged. Browser/runtime evidence: `docs/product/evidence/homepage-artifact/`.

## Known consequences (recorded in D-093)

The homepage shows the artifact's own content and behaviour: five projects, `Sentinel / DevOS`, `maisog36@gmail.com`, three placeholder Research notes with category filters (not real Journal data), no `#research`/`#process`/`#about` aliases, no compact mobile navigation (Research/Contact links run off-screen at 390px), React development builds with in-browser Babel (about 2 MB HTML).
