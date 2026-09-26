# MaisogLabs V10 homepage implementation contract

Status: Builder implementation contract under **D-092** (controlled clean replacement). Facts per **D-088**. It supersedes the D-090 V10-A contract that previously occupied this file (see Git history before `snapshot/pre-v10-clean-replacement`, commit `146f645`).

## Source of truth

`design-references/claude-v10/source/Maisog Labs Home v10.dc.html`, SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`. Differences from it are listed in `V10_DIVERGENCE_REGISTER.md` (D-092 section).

## Structure

- `components/v10/V10Home.js`: a client component. Its markup is generated from the V10 template by `docs/product/evidence/v10/clean/harness/v10conv.py` and keeps V10's inline styles verbatim (`css()` reproduces the dc runtime's style parsing); its class is V10's `Component` logic. Edits against V10 are made by `harness/v10assemble.py` as exact asserted replacements and marked `D-092` in the source.
- `app/page.js`: a static server component. It reads the governed content boundary (`data/site.js` → `lib/content/local.mjs` → `lib/content/schema.mjs` → `lib/content/public.mjs`) plus `v10Content` (validated fail-closed by `validateV10Content`) and passes plain props.
- `app/globals.css`: V10's own `<style>` rules, its two hover classes, self-hosted `@font-face` for Montserrat / Inter / IBM Plex Mono (`public/v10/fonts`, SIL OFL), and the D1/D2/N2 rules.
- `app/journal/journal.css`: the pre-V10 stylesheet, loaded by `/journal` only.
- Assets: `public/v10/assets/**` (hashed in `public/v10/ASSET_MANIFEST.md`), unchanged.

No dc runtime (`support.js`), `image-slot.js`, Babel, CDN React, remote font or remote asset is shipped.

## Runtime requests

The homepage makes one API request: `GET /api/journal`, the first time the Research panel opens (and again on reopening after an error). Failure, a non-2xx status or a malformed body shows "The journal could not be loaded right now." inside the V10 panel; the rest of the page is unaffected. It does not request `/api/design`.

## Content

- Projects: the eight published projects, in order, from `siteContent.projects`; presentation fields from `v10Content.projectProfiles`.
- Disciplines: V10's six, with V10's captions, descriptions and links, from `v10Content.disciplines`.
- Contact: `siteContent.contact.email` (`paulo.maisog@maisoglabs.com`).
- Research: published Journal entries (title, summary, published date).

## Routes

Hash-routed single screen as in V10: `#systems`, `#projects`, `#journal`, `#contact`; aliases `#research`, `#process`, `#about`; any other hash is Entry; Escape and the wordmark return to Entry. `/journal` and `/admin` are unchanged pages.

## Tests

`tests/v10-home.test.mjs`: pinned reference hash, D-088 facts, fail-closed validator, page/layout wiring, runtime request surface, no remote/runtime dependencies, asset existence and hashes, routing aliases, Research data rules, D1/D2 presence, stylesheet scoping. Browser evidence: `docs/product/evidence/v10/clean/`.
