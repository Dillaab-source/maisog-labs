# V10 Admin Content Bridge — Architecture Plan (D-104)

Status: **PLANNING ONLY.** Nothing here is implemented or authorized.

- **Authority:** D-104, under `DIR-WEB-V10-CONTENT-BRIDGE-PLAN-0001`.
- **Controlling review:** `ML-DEVOS-AS-130`.
- **Companion RFC:** `devos/changes/rfcs/ML-DEVOS-RFC-022.md` (`DRAFT`).
- **Drafting base:**
  - governance `b7d0284c1853eae5887a6fdc6148987c68895345`;
  - `main` `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`;
  - `public/index.html` SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- **Evidence class:** Builder repository reading and local read-only decoding of the artifact (`ACTOR_REPORTED`).

**Governing rule: CODE OWNS THE V10 DESIGN. ADMIN OWNS APPROVED CONTENT FIELDS.**

## 0. Summary

**The decisive fact.** The D-093 homepage is a self-unpacking bundle. All of its project, flow, research-note and contact-email facts live in one embedded plain-script resource, `window.MLData = {…}`, which every panel reads at render time. The rest of its visible copy is JSX literals inside compiled-at-runtime components.

**Recommended architecture: an MLData-seam published-content bridge.**
1. On `GET /`, the Worker serves the unmodified artifact file.
2. When, and only when, a valid published content snapshot exists, the Worker splices one fixed, code-owned element pair into the outer document head: a JSON data island and a fixed hook script.
3. The hook merges validated, allowlisted published values into `window.MLData` at the moment the artifact assigns it, before React renders.
4. On any absence, error, timeout or validation failure, the response is **byte-identical** to the artifact.

Properties of this design:
- The artifact file is never edited.
- No deployment is needed for a copy edit.
- There is no extra request and no content flash.
- The homepage never depends on D1 availability.

**What it can edit without any artifact change (Tier 1):**
- project facts (name, kind, status, tagline, description, discipline tags, four-step flow);
- the contact email.

**What it cannot edit (Tier 2)** until Paulo supplies a revised Design System artifact that sources copy from `MLData` (the D-093 route for artifact changes):
- the hero intro, section captions and headings, contact heading, description and CTA text, and navigation labels.

About and CTA buttons do not exist in the V10 artifact at all. Adding them is a design change, not content.

**Storage:** reuse the existing D1 revision model.
- Projects extend `project_revisions` by one migration of four nullable columns, and reuse `featured` for homepage inclusion.
- Site copy reuses `site_settings_revisions` (which already has `contact_email`, `hero_description`, `about_*` and `contact_*`) with no schema change.
- There is no second CMS and no snapshot table.

**Paulo's candidate** (static artifact plus a runtime `/api/site-content` read) is **not** selected as the primary path: the unmodified artifact cannot call an API, and a fetch race causes a visible content swap. See §3.

## 1. Current-state architecture

**Homepage `/`:** `public/index.html`, byte-identical to `publish/index.html` in the D-093 ZIP (`docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md`; `tests/homepage-artifact.test.mjs`).
- The Next.js static export has no `/` route (`app/page.js` was removed), so `out/index.html` is the artifact.
- It is served asset-first. `wrangler.jsonc` `run_worker_first` is exactly `["/admin", "/admin/*", "/api/journal", "/api/journal/*", "/api/design"]`, pinned by `tests/homepage-artifact.test.mjs`.

**Artifact internals** (decoded locally, read-only):
- The outer document holds a loader script plus `__bundler/manifest` (34 base64/gzip resources) and `__bundler/template`.
- On `DOMContentLoaded`, the loader:
  1. parses the template;
  2. calls `document.documentElement.replaceWith(...)`;
  3. re-creates each script in order, awaiting `onload`: React, ReactDOM, Babel standalone, the DS bundle (`window.MaisogLabsDesignSystem_a728bd`), **the `window.MLData` plain script**, then six `text/babel` components (`Entry`, `Overlay`, `SystemsPanel`, `ProjectsPanel`, `ResearchPanel`, `ContactPanel`) and the inline `App`, which renders.
- `window` state survives the document swap; DOM nodes injected into the served document do not.
- `window.MLData` keys:
  - `SLOTS` (5 discipline orbit slots);
  - `PSLOTS` (5 project orbit slots);
  - `DISC` (6 disciplines: `name`, `icon`, `cap`, `desc`, `links`);
  - `PROJ` (5 projects: `name`, `kind`, `status`, `tags` as DISC indices, `tag`, `desc`);
  - `FLOW` (5 × 4 stage strings; stage index 3 is the human step);
  - `NOTES` (3 placeholder research notes);
  - `EMAIL`.
- **Structural invariants the components assume:**
  - `SystemsPanel` destructures `PS[j]` for every project, so more than 5 projects throws and unmounts the app (a blank page).
  - `ProjectsPanel` reads `FLOW[shown][3]`, so every project needs exactly 4 stages.
  - `D[k].name` requires every tag to be a valid DISC index.
  - `ResearchPanel` filters `NOTES` by `cat` ∈ {Research, Build, Thoughts}.
- **Literal (non-MLData) copy:**
  - Entry intro ("The independent technology laboratory of Paulo Maisog, …");
  - nav labels (`secs` in `Entry`, and overlay labels in `App`);
  - section captions and headings ("Six disciplines, one working system.", "From research to real-world impact", "Research Notes", "Humanity orbits higher.", "For work that expands what people can understand, create, and explore.");
  - the Contact "Correspondence" and "Copy address" labels.
- The `Wordmark`, `Tagline` and `MarkVideo` brand components are code-owned.

**Admin and Worker** (`worker/index.mjs`, `worker/auth.mjs`, `worker/admin/*`, `worker/public/*`):
- Access-JWT fail-closed on `/admin*` (production placeholders mean it currently always fails closed; AS-129 F-6).
- Admin APIs: dashboard (read), projects (create-draft, edit-draft, preview, publish, unpublish, with expected-pointer stale-write guards and atomic audit), media, journal, design.
- Public APIs: `/api/journal` and `/api/design` (published-only, positive allowlist).
- **Nothing on `/` consumes any of them since D-093.**

**D1** (`migrations/0001`–`0005`):
- The revision substrate: `site_settings(_revisions)`, `navigation(_revisions)`, `foundations`, `projects(_revisions)`, `services`, `process_steps`, `sections`, `audit_log`, `media`, `project_media`, `journal_entries(_revisions)`, `journal_media`, `theme_settings(_revisions)`.
- Every base row carries `published_revision_id` / `draft_revision_id` with composite foreign keys.

**Legacy content path:** `data/site.js` → `lib/content/*` now feeds only `/journal`, admin and the migration seed, not `/`.

## 2. D-093 supersession analysis

| Earlier assumption (V10 plan, RFC-021 §6/§8) | Status after D-093 |
|---|---|
| The homepage renders through `app/page.js` / `components/v10/**` from `data/site.js` | **Superseded.** `/` is the static artifact; `app/page.js` and `components/v10/**` were deleted |
| `/api/design` drives V10 runtime presentation (RFC-021 §7) | **Superseded in effect.** The artifact never fetches it; the endpoint remains valid server data with no homepage consumer |
| Content facts from `data/site.js` (RFC-021 §6 C1–C3: eight projects, `paulo.maisog@maisoglabs.com`) | **Unresolved conflict**, recorded by D-093. The artifact shows 5 projects and `maisog36@gmail.com`. The bridge is the first mechanism that can resolve facts without editing the artifact, but only within the artifact's structure (max 5 projects; §6) |
| The admin project lifecycle affects the public site | **False since D-093.** It affects nothing public until a bridge exists |
| Fail-safe = the static V10 baseline | **Preserved and strengthened.** The fail-safe is now "the exact artifact bytes" |
| RFC-021 visual baseline, accessibility and parity method | Still the design intent. The artifact is the concrete baseline |

**D-093 owner instruction (binding):** "preserved byte-for-byte and never manually edited; … adapt the environment around it". The bridge adapts the environment (the Worker response), not the file.

**This is the primary owner decision (Q1):** does "byte-for-byte" bind the stored and exported file only (the bridge is compliant), or also every served response (the bridge would need a D-093 amendment)? With no published content, the served response stays byte-identical in either reading.

## 3. Alternative architectures compared

| # | Mechanism | Artifact edit? | Deploy per copy edit? | Flash or layout shift | D1 as homepage dependency | Complexity | Verdict |
|---|---|---|---|---|---|---|---|
| A | Static artifact + client `fetch('/api/site-content')` (Paulo's candidate) | **Yes**: the artifact has no fetch; the hook must be injected (it becomes E+fetch) or the artifact re-exported | No | **Yes**: published text arrives after the first render (a race with the loader), so the old copy flashes and is then swapped; gating the render requires monkey-patching React | No, if it fails closed | Medium | Rejected as primary; the endpoint is optional (§9) |
| B | Request-time HTML text rewriting (HTMLRewriter over rendered markup) | No | No | — | — | — | **Not possible:** there is no rendered copy in the HTML. Text lives in gzipped base64 bundle resources rendered client-side |
| C | Return to React / Next components | Replaces the artifact | Build | None | Depends | High | **Rejected:** D-093 says "do not rebuild, recreate in React"; this re-opens the parity risk D-093 closed |
| D | Build/deploy on publish (re-encode `MLData` inside the manifest at build) | **Yes** (the served file differs from the approved artifact) | **Yes**: every copy edit needs Gate C and Gate D, and preview URLs are now disabled (AS-130) | None | No | High operational cost | Rejected |
| E | **MLData-seam data injection:** the Worker splices a JSON island plus a fixed hook into the outer head; the hook merges on `MLData` assignment | **No** (the file is untouched; the response is augmented only when content is published) | No | **None:** data is present before the first render | **No:** any failure yields unmodified bytes | Low–medium | **Selected** |
| F | Post-render DOM text replacement | No | No | Yes; React re-renders overwrite it | No | Fragile | Rejected |
| G | New Design System artifact from Paulo with a built-in adapter and copy moved into `MLData` | New artifact (D-093-compliant route) | One release per artifact | None | No | Owner-side effort | **Complementary:** required for Tier 2; delivery still uses E |

## 4. Selected architecture and rationale

```
/admin (Access + Worker JWT, same-origin writes)
  → bounded editors: Projects (Tier 1), Contact email (Tier 1); Profile/Nav/Contact copy (Tier 2)
  → existing D1 revision lifecycle: draft → preview → publish (expected-pointer guarded, audited)
  → publish = move published_revision_id pointers (no snapshot table)

GET /  (becomes Worker-first, exact path only)
  → buildPublishedSnapshot(db)   one D1 batch read of published pointers, 250 ms budget, isolate memo ≤ 30 s
  → validateBridgePayload()      artifact-invariant validation, all-or-nothing per group
  → if payload empty/invalid/error → return env.ASSETS.fetch(request)   (bytes === artifact)
  → else splice at the fixed, verified offset (just before the first <script> in the outer <head>):
        <script type="application/json" id="ml-published">…escaped JSON…</script>
        <script>/* fixed hook, code constant */</script>
  → hook: capture JSON at parse time; define window.MLData setter; on the artifact's assignment,
          merge allowlisted keys into a copy of the artifact value; on any problem keep the artifact value
```

**Rationale:**
- It is the only option that edits nothing in the artifact, needs no deploy for copy, has no race and flash, and keeps a byte-identical fallback.
- It uses the artifact's own data seam instead of fighting its rendering.
- The splice is a fixed-offset byte insertion guarded by a size and SHA precondition. A streaming HTML parse of 2 MB is avoided for CPU reasons (§19).

## 5. Content ownership model

| Class | Owned by | Examples |
|---|---|---|
| **Content-editable (Tier 1, now)** | Admin (Paulo) | project `name`, `kind`, `status`, `tagline`, `description`, discipline tags, 4 flow stages, homepage inclusion and order (≤ 5); contact email |
| **Content-editable (Tier 2, after artifact v2)** | Admin | entry intro, contact heading/description/CTA text, nav labels (fixed destinations), section captions |
| **Bounded design controls** | Admin, existing RFC-010/021 `/api/design` data | Not wired to the artifact. Remains server data; no new design control is proposed |
| **Code-locked V10 presentation** | Code / artifact | composition, panels, orbit geometry (`SLOTS`/`PSLOTS`), disciplines (`DISC`: count, icons, links), Wordmark/Tagline/MarkVideo, motion, assets, colors, typography, hash destinations, the human-step index, the section set |

The admin never edits HTML, CSS, JS, selectors, asset paths, scripts, URLs (except the validated email), layout or counts beyond the artifact's bounds.

## 6. Field-level public schema (bridge payload, `schemaVersion: 1`)

```json
{
  "schemaVersion": 1,
  "projects": [
    { "name": "…", "kind": "…", "status": "Active", "tagline": "…", "description": "…",
      "disciplines": [0, 2], "flow": ["…", "…", "…", "…"] }
  ],
  "contact": { "email": "name@example.com" }
}
```

| Path | MLData target | Rule |
|---|---|---|
| `projects` (group) | `PROJ` + `FLOW` (replaced together) | array length **1..5** (PSLOTS bound); all-or-nothing |
| `projects[].name` | `PROJ[i].name` | text 1..40; no control chars, `<` or `>`; unique case-insensitively |
| `projects[].kind` | `PROJ[i].kind` | text 1..40 |
| `projects[].status` | `PROJ[i].status` | `""` or `"Active"` (the artifact's observed vocabulary); an enum, extendable only by code |
| `projects[].tagline` | `PROJ[i].tag` | text 1..160 |
| `projects[].description` | `PROJ[i].desc` | text 1..400 |
| `projects[].disciplines` | `PROJ[i].tags` | integers, unique, each 0..5 (DISC indices, code-owned names), length 1..6 |
| `projects[].flow` | `FLOW[i]` | exactly 4 strings, each text 1..60; stage 4 is the human step (code-fixed) |
| `contact.email` | `EMAIL` | the existing `validate.mjs` email rule, ≤ 254 |

**Never in the payload:** ids, slugs, revision numbers, timestamps, `created_by`, audit data, draft data, storage keys, media, URLs, HTML, style values.

Groups are independent: an invalid `projects` group is dropped while a valid `contact` group still applies. An empty payload means no injection.

**Tier 2 (reserved, `schemaVersion: 2`, only with artifact v2):**
- `profile.intro` → `hero_description`;
- `contact.heading`, `contact.description`, `contact.cta` → `contact_header_label` / new fields;
- `navigation[]` → labels for the fixed ids `systems`, `projects`, `journal`, `contact`.

## 7. Admin editing model

`/admin` gains a **Content** area with five tabs, each showing its tier honestly:

1. **Profile / Home:** Tier 2. Read-only notice until artifact v2.
2. **Projects:** Tier 1. The list shows lifecycle state; "On homepage" (`featured`) with order; the editor has the V10 fields plus existing fields.
3. **About:** no V10 surface. Shows "not part of the V10 design; requires a design decision".
4. **Navigation:** Tier 2. Labels only; destinations fixed and displayed, not editable.
5. **Contact:** email (Tier 1); heading, description and CTA (Tier 2).

Every editable domain shows **Draft → Preview → Publish**, with the current published and draft revision numbers, an "Unpublish/revert to artifact default" action, and conflict messaging on 409.

Design controls stay on the existing Design page, visually separated. There is no mixed "settings" form.

## 8. Draft / preview / publish lifecycle

- **Projects:** reuse `worker/admin/projects.mjs` routes unchanged in shape. The `draft` / `preview` / `publish` / `unpublish` payloads gain the V10 fields (§12).
- **Site copy:** a new `worker/admin/site.mjs` mirrors the projects pattern for the singleton `site_settings` row:
  - `GET /admin/api/site`;
  - `PUT /admin/api/site/draft` (expected pointers);
  - `GET /admin/api/site/preview`;
  - `POST /admin/api/site/publish`;
  - `POST /admin/api/site/unpublish`.

  A draft carries the full `site_settings_revisions` row. Fields the editor does not own are copied from the base revision unchanged.
- **Homepage preview:** `GET /admin/preview/home` (under `/admin/*`, already Access and Worker-first). It serves the artifact spliced with a payload built from **draft** pointers, falling back per entity to published. This is the only way to see drafts; nothing public ever reads a draft pointer.
  - The artifact's relative asset paths (`../../assets/…`) resolve to `/assets/…` from that URL.
- **Homepage inclusion:** published projects with `featured = 1`, ordered by `sort_order`. Publishing a sixth featured project is rejected with 409 `HOMEPAGE_LIMIT`.

## 9. Public read contract

- `GET /` (exact path) is the only public consumer. The snapshot is read from published pointers only.
- **Optional, deferred:** `GET /api/site-content` returning the same payload.
  - It is not needed for the homepage and adds public surface, so it is recommended only if a second consumer appears.
  - If added, it is GET-only, `Cache-Control: public, max-age=30`, uses the same serializer, and returns `{}` rather than an error when empty.
- The response to `/` keeps the asset's `Content-Type`. When injected, it sets `Cache-Control: no-cache` so a publish is visible within the memo window.

## 10. Static fallback contract

- **F-1:** any of the following yields `env.ASSETS.fetch(request)` returned untouched, so **the body is byte-identical to the artifact** (SHA `2417f7e5…`):
  - no published site or projects content;
  - a D1 error or a timeout over 250 ms;
  - payload validation failure;
  - a splice precondition failure (the asset length or SHA differs from the build constant);
  - any exception.
- **F-2:** the hook never throws past a `try/catch`. On bad JSON, a bad shape or an unexpected `MLData` shape, it leaves the artifact's own assignment intact.
- **F-3:** the outermost `/` handler is wrapped so a Worker bug cannot produce 1101 on `/` (the AS-116 lesson). An exception in the bridge path falls back to the asset.
- **F-4:** there is no dependency on JavaScript beyond what the artifact already requires.

**Deterministic tests:**
- with no content, `sha256(response) === ARTIFACT_SHA256`;
- with content, removing the inserted span yields exactly the artifact bytes, and the span is the fixed hook plus escaped JSON only.

## 11. Validation rules

- **Server side** (`worker/d1/validate.mjs` extension, and a new `worker/bridge/payload.mjs`):
  - reuse `text(max)` (trims; rejects control characters, `<` and `>`) and the email rule;
  - add artifact-invariant rules: project count 1..5; 4 flow stages; DISC index bounds; status enum; unique names;
  - `assertNoUnknownFields` everywhere.
- **Validation runs three times:** at draft write, at publish (full revalidation, as in projects today), and again at snapshot build. The last run is defence against stale or legacy rows.
- **Client hook:** re-checks types and lengths (defence in depth) and copies only the allowlisted keys into a fresh object. It never evaluates anything.
- **JSON island escaping:** `<`, `>`, `&`, U+2028 and U+2029 are escaped as `\uXXXX`, so the island cannot terminate the script element even if validation regressed.

## 12. Stale-write / idempotency rules

- Every mutation carries `expectedPublishedRevisionId` and `expectedDraftRevisionId`, using the existing `readExpectedPointers` / `pointersMatch` / commit-time guard (`worker/admin/projects.mjs`, `worker/d1/projects.mjs`). A mismatch returns 409 and changes nothing.
- A replayed request is safe: its expectations are stale after the first success, so it gets 409. No idempotency-key table is added.
- Publishing the homepage limit is checked inside the same batch guard (count of featured published after the change ≤ 5).
- Site-settings writes use the same pattern on the singleton row.

## 13. Audit requirements

- Reuse `worker/d1/audit.mjs` (append-only).
- New actions: `site_settings_create_draft`, `site_settings_update_draft`, `site_settings_publish`, `site_settings_unpublish`. The existing `project_*` actions cover V10 fields.
- Success rows are written atomically in the business batch. Failure rows are best-effort, as today.
- The actor is `cf-access:<sub>`. There is never an email, JWT or content body in audit rows.
- The public payload never exposes audit data.

## 14. Security / threat analysis

| Threat | Control |
|---|---|
| Admin copy becomes code (XSS) | Typed fields only; `<`/`>`/control characters rejected; JSON island escaped; the hook is a code constant; React renders strings as text nodes; the only URL-bearing value is the validated email in `mailto:` |
| **Editable content becomes editable design/code** (SENTINEL test) | Payload keys are a closed allowlist mapping to data, never components; no style, path, selector or count beyond artifact bounds; geometry, DISC and slots stay locked; the hook merges into a copy and never adds keys the artifact does not read; tests reject unknown keys and out-of-bounds arrays |
| Content blanks the homepage | Artifact invariants enforced at write, publish, build and hook (§11); all-or-nothing per group |
| Homepage availability now depends on the Worker | Exact-path Worker-first for `/` only; outer try/catch falls back to the asset; no D1 dependency (timeout, then the asset); the CPU-light splice |
| Draft leakage | Public path reads published pointers only; preview lives under `/admin/*` (Access plus Worker JWT) |
| Unauthorized writes | Existing fail-closed Access JWT, same-origin checks, bounded bodies, verified `sub` for mutation |
| Secret exposure | No new secrets or bindings; the payload has no internal data |
| Cache poisoning / stale content | No shared cache of injected HTML; isolate memo ≤ 30 s keyed only by the snapshot; `no-cache` on injected responses |

## 15. Exact files likely affected by implementation

- **New:**
  - `worker/bridge/payload.mjs` (serializer and validator);
  - `worker/bridge/inject.mjs` (splice, hook constant, escaping);
  - `worker/public/home.mjs` (the `/` handler);
  - `worker/admin/site.mjs` (site-settings lifecycle);
  - `worker/admin/preview-home.mjs`;
  - `migrations/0006_v10_project_fields.sql`;
  - `app/admin/ContentClient.js` (and small subcomponents);
  - tests: `tests/bridge-payload.test.mjs`, `tests/bridge-inject.test.mjs`, `tests/worker-public-home.test.mjs`, `tests/worker-admin-site.test.mjs`, `tests/bridge-browser.test.mjs` (Playwright).
- **Modified:**
  - `worker/index.mjs` and `worker/auth.mjs` (classify exact `/` as a public route before the admin check);
  - `worker/admin/dashboard.mjs` (dispatch `site` and preview);
  - `worker/admin/projects.mjs`, `worker/d1/projects.mjs`, `worker/d1/validate.mjs`, `worker/d1/repository.mjs` (V10 fields, homepage limit);
  - `wrangler.jsonc` (`run_worker_first` gains exact `"/"`);
  - `tests/homepage-artifact.test.mjs` (routing contract update; the artifact hash test stays);
  - `app/admin/page.js` / `DashboardClient.js` (Content area);
  - `docs/ARCHITECTURE.md`, `docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md`.
- **Never modified:** `public/index.html`, `public/assets/**`, the design-reference ZIP.

## 16. Migration determination

- **Tier 1 email:** no migration. `site_settings_revisions.contact_email` exists. It needs the site lifecycle routes only.
- **Tier 1 projects:** **one migration**, `0006`, adding nullable columns to `project_revisions`:

  | Column | Justification |
  |---|---|
  | `tagline TEXT NULL` | V10 `tag`; distinct from `summary` in length and role |
  | `status TEXT NULL CHECK (status IS NULL OR status IN ('', 'Active'))` | V10 status dot; no existing column |
  | `disciplines_json TEXT NULL` | DISC indices; typed, validated array. `stack_json` is a different concept (tech stack), and reusing it would corrupt its meaning |
  | `flow_json TEXT NULL` | exactly 4 stages; no existing column |

  They are nullable so existing revisions stay valid. A featured project missing any V10 field makes the whole projects group fall back to the artifact default.
- **Reused as-is:** `title` → `name`, `category` → `kind`, `summary` → `description`, `featured` → homepage inclusion, `sort_order` → order. `accent`, `icon` and `stack` stay required legacy fields that V10 does not render.
- **No snapshot or publication table:** the published pointers already define the published state, and a single D1 batch gives a consistent read.
- **Tier 2:** `site_settings_revisions` covers the intro and some contact fields. A later migration may add V10-specific captions only after artifact v2 defines them. That is deferred.

## 17. Test strategy

1. **Unit, pure:**
   - payload validator (every bound, unknown keys, the 6-project rejection, bad DISC index, 3 or 5 flow stages, `<` in text, bad email);
   - serializer allowlist (no ids or audit data);
   - escaping (`</script>`, U+2028);
   - splice (exact offset; precondition mismatch leads to no splice).
2. **Hook, in a Node `vm` sandbox:** simulate the artifact's `window.MLData = {…}` assignment. Assert:
   - the merged result;
   - untouched keys (SLOTS, PSLOTS, DISC, NOTES) are identity-equal;
   - a malformed island leaves the original;
   - the hook never throws.
3. **Worker, Miniflare/wrangler, following the existing `tests/worker-*.test.mjs` pattern:**
   - `/` with an empty D1 returns the byte-identical SHA;
   - `/` with published content has only the island and hook inserted;
   - a D1 throw or timeout yields byte-identical output;
   - draft-only content is not injected;
   - `/admin/preview/home` requires auth and shows drafts;
   - site lifecycle stale-write returns 409 with audit rows;
   - a sixth featured project returns 409.
4. **Browser, Playwright with the preinstalled Chromium:** render a spliced file and the original.
   - The DOM shows the published project names and email.
   - There are no console errors, and all four panels open.
   - Screenshots of the entry view match the original at 1440 and 390 px (content-only diff).
   - With the island removed, the DOM equals the original's.
5. **Regression:** the existing suite unchanged, including the artifact hash tests.

**Note:** this session could not install npm dependencies (registry 403), so the 11 `wrangler`/`jose`-dependent suites could not run here. 602 of 613 tests pass locally (§21).

## 18. Local preview strategy

- **Without Cloudflare:** a script (`scripts/bridge-preview.mjs`) takes a JSON fixture, runs the real `inject.mjs` against `public/index.html`, and writes `out/preview-home.html` for Playwright or a browser.
- **With Worker:** `wrangler dev --local` with local D1 migrations and a seed, then visit `/admin/preview/home` (a local Access bypass exists only in tests, never in config).
- Preview URLs on `workers.dev` are disabled (AS-130). Pre-production verification therefore uses local Miniflare and Playwright evidence, plus a post-promotion production read-only check.

## 19. Production / release implications

- **`/` becomes Worker-first** (exact path). Every homepage view invokes the Worker, adding requests (Free plan: 100k/day) and CPU.
  - A fixed-offset splice (no HTML parse) plus one D1 batch keeps CPU low. The 2 MB body is streamed from `ASSETS` with a prefix insertion.
  - This needs measurement in local benchmarking before release.
- **Served bytes change only when content is published.** Production checks that assert the served SHA equals `2417f7e5…` must become "equals, or equals after removing the bridge span". This is part of Q1.
- **Remote D1:** migration `0006` on production D1 needs `REMOTE_D1_AUTHORIZED` (D-097 precedent). The current state of production D1 `site_settings` and `projects` rows is **unknown**: no data reads were allowed. A read-only check is needed before release.
- **Access wiring:** the production admin is unusable while `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN` are placeholders (AS-129 F-6). Editing in production requires that separate decision (A-9 area).
- **Release:** Gate C (`main`) and Gate D (promotion) as usual, with a redesigned pre-promotion check because previews are off (AS-130 tradeoff).
- **A-3 remainder:** branch pushes still upload versions (no public URL).

## 20. Bounded implementation increments

| Inc | Scope | Needs |
|---|---|---|
| **CB-0** | Owner decisions Q1–Q5 (§22); RFC-022 review and acceptance | Paulo, Architect |
| **CB-1** | `worker/bridge/*` pure library, hook and splice, with unit and `vm` tests; no routing change | MUTATION (repo) |
| **CB-2** | Migration `0006`, V10 project fields, homepage limit, admin project API extension, with tests (local D1 only) | MUTATION (repo) |
| **CB-3** | `worker/admin/site.mjs` lifecycle (email Tier 1) with audit and stale-write tests | MUTATION (repo) |
| **CB-4** | `/admin/preview/home` and the admin Content area UI (Projects, Contact; Tier 2 tabs read-only) | MUTATION (repo) |
| **CB-5** | Public wiring: exact `/` Worker-first, `worker/public/home.mjs`, routing-contract test update, Playwright evidence | MUTATION (repo) |
| **CB-R** | Release: Gate C, a read-only production D1 check, the remote `0006` migration, Gate D, a production smoke | separate DEPLOY / REMOTE_D1 / MAIN_MERGE decisions |
| **CB-6** (optional) | Journal → Research `NOTES` bridge (published journal entries, category mapping) | owner decision |
| **CB-7** | Tier 2 after artifact v2: profile, nav and contact copy | a new artifact from Paulo |

Each increment is independently reviewable, and CB-1 to CB-5 change no production state.

## 21. Evidence from this planning cycle

- **Artifact:** `public/index.html` SHA-256 `2417f7e5…9f9` (unchanged). Decoded locally (read-only) into 34 resources, the template and the outer loader. Findings as in §1.
- **Test suite:** `npm test` gave 613 tests, 602 pass and 11 fail. All 11 failures are `Cannot find package 'wrangler'` / `'jose'`, because `npm ci` received a 403 from the environment's registry proxy. `tests/homepage-artifact.test.mjs` passes 5/5.
- No runtime, product, Cloudflare or data change was made.

## 22. SENTINEL sync, SU check, open questions

### SENTINEL (bounded)

- **Authority:** D-104, planning only. Implementation, migration and release each need separate decisions. `CLEAR`.
- **Context:** D-093 changed the homepage. The prior plan is superseded where it assumed React rendering (§2). `CLEAR`.
- **Capability:** the design deliberately caps admin capability at typed data behind a closed allowlist. **Editable-content → editable-code/design test:**
  - Can the admin add a field the artifact renders as code? No.
  - Change a count beyond the geometry? No (≤ 5 projects, 4 stages, fixed DISC).
  - Supply a URL, path or style? No (email only).
  - Change what the hook does? No (a code constant).
  - Change which panels exist? No.

  Residual: projects could be emptied to one entry, or copy could be poor. That is editorial, not structural. `CLEAR`.
- **Execution:** increments CB-1 to CB-5 are repository-only with local tests. Production steps are isolated in CB-R. `CLEAR`.
- **Evidence:** repository and decoded-artifact citations; browser evidence is deferred to CB-5. `CLEAR_WITH_NOTES`.
- **Risk:** the new homepage runtime dependency on the Worker is bounded by F-3. The served-bytes semantics need an owner decision (Q1). `OPEN → owner`.

**Disposition:** `CLEAR_WITH_ACTIONS` (Q1–Q5).

### SU contradiction check (bounded)

1. **Runtime hydration causes layout shift?** For fetch-based hydration (A): yes, a content swap after first paint. For the selected E: no. The data exists before `App` renders. Differences in text length render natively, as if the artifact had shipped that text.
2. **Worker HTML rewriting is unnecessarily complex?** Parse-based rewriting of the rendered content (B) is impossible. Injecting at a fixed offset is simpler than HTMLRewriter and is guarded by a precondition. The complexity is concentrated in about 150 lines of pure, testable code.
3. **Returning to React undermines D-093?** Yes. Explicitly prohibited by the owner instruction. Rejected.
4. **Publish-triggered rebuilds are too expensive?** Yes, under current governance. Each copy change would require Gate C and Gate D, and it edits the served artifact. Rejected.
5. **The D1 model duplicates existing storage?** No. It reuses `project_revisions`, `site_settings_revisions`, pointers, the lifecycle and audit. One migration adds four justified nullable columns. There is no snapshot table and no second CMS.
6. **The content API becomes a homepage availability dependency?** Not for D1: timeout and error return the asset. The **Worker** does become a dependency for `/`, which is new. It is mitigated by the outer catch, exact-path scoping and tests. This is accepted only if Paulo accepts Q1/Q2.

**SU disposition:** `CLEAR_WITH_NOTES`.

### Open questions for Paulo

- **Q1 (D-093 semantics):** may the served `/` response differ from the artifact, only by the bounded bridge span and only when content is published, while the file stays byte-identical? If no, only option G (artifact v2 with its own fetch) remains, with flash risk.
- **Q2:** accept that `/` becomes Worker-first (exact path) with a byte-identical fallback?
- **Q3 (facts):** RFC-021 C1 wants 8 projects; the artifact supports at most 5 on the homepage. Which 5, and which email: `maisog36@gmail.com` (the artifact) or `paulo.maisog@maisoglabs.com` (C3)?
- **Q4 (Tier 2 / About / CTAs):** will Paulo commission artifact v2 from Claude Design that reads copy from `MLData` (with the current copy as defaults), and does V10 need an About section or CTAs? Both are design changes.
- **Q5:** is `/api/site-content` wanted at all (§9), and is the Journal → Research notes bridge (CB-6) wanted?
