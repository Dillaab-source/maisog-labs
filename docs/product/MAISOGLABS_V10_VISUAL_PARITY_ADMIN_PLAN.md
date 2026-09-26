# MaisogLabs V10 Visual Parity + Admin Architecture Plan

Status: `BUILDER PLAN — PENDING ARCHITECT REVIEW`. It grants no implementation, migration, media-integration, merge or deploy authority.

- **Authority:** `D-087` (planning only).
- **Directive:** `DIR-WEB-V10-PLAN-0001`.
- **Controlling review:** `ML-DEVOS-AS-116`.
- **Evidence class:** `ACTOR_REPORTED` unless a claim cites an accepted record.

## 1. Authority and provenance

| Item | Value |
|---|---|
| Owner instruction | "V10 IS THE WEBSITE DESIGN TARGET." (D-087). This is the highest authority for design direction. |
| Reference commit | `98a26e2d05f1056806994ea80716ed84960e3e39`: owner-authored, adds only `design-references/claude-v10/**` (204 files: the 202 archive entries plus README and `.gitattributes`) |
| Package | `Maisog Labs website design.zip`, SHA-256 `79f0a455967b808780cde89c2dcde821c7d7d99e7700ee60dc7aba4cb9c61c2a`. **Owner-reported:** only the extracted entries are in the repository, so the ZIP itself cannot be re-hashed here. |
| Primary artifact | `design-references/claude-v10/source/Maisog Labs Home v10.dc.html`, SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab` — **VERIFIED** |
| Planning base | governance `7ec56d117e215c300cf3f55ce328e7075a23286e` (D-087 directive); main `aebc881e8890c00090d714602591138a045bd3b0` |
| Design context (not authority) | the package `CLAUDE.md`, `uploads/MAISOGLABS_DESIGN_PANEL_SKILL_v2.md`; v1–v9 files are historical only |

**Context tiers used:**
- **T0:** Protocol V2, D-087 and the hard boundaries.
- **T1:** STATE, AS-116, D-087, the V10 identity and main.
- **T2:**
  - RFC-010 fail-safe clauses (§§ "Fail-safe baseline", "default bootstrap parity");
  - the V2A plan;
  - `app/DesignRuntime.js`, `app/admin/DesignControls.js`, `components/site/**`, `app/globals.css`;
  - `data/site.js` → `lib/content/**`;
  - `worker/public/{design,journal}.mjs`;
  - the Design Panel skill.
- **T3:** retrieved once, to answer "does Journal carry image metadata?". It does: `worker/public/journal.mjs` projects `media` (id, content type, alt text, role, order).

## 2. Current-state summary

- **Production:** WEB-REL-002 is live as Version `a667fc09…` (AS-116). It is the Website Redesign V1 spatial site plus the V2A admin.
- **Known incident:** `/api/design` and `/api/journal` return HTTP 500 / 1101. It is open and temporarily accepted.
- **Current composition** (local render, desktop 1440×900):
  - Entry uses the V1 hand-and-robot-arm cosmic plate, a serif `MAISOG LABS` wordmark with an elliptical ring, and a four-card destination grid.
  - The surfaces are hash-routed (`#systems`, `#projects`, `#research`, `#contact`).
- **Content:**
  - `data/site.js` publishes 4 projects (ClinicFlow, Automation Hub, Cybersecurity Lab, Experimental Projects), contact `hello@maisoglabs.com`, and 6 spatial disciplines.
  - Research reads the real `/api/journal`.
- **Design runtime:**
  - `DesignRuntime` fetches `/api/design` and sets fixed `data-*` enum attributes. On any failure it keeps the static CSS baseline.
  - This fail-safe *mechanism* works in production today (AS-116: "DesignRuntime falls back rather than blanking the site"). The *baseline it falls back to* is V1/V3, not V10.

## 3. Exact V10 contract

V10 is authored in the Claude Design `dc` runtime: `support.js` loads React 18.3.1, ReactDOM 18.3.1 and Babel 7.29.0 from `unpkg.com`, and the markup uses `<x-dc>`, `sc-if` and `sc-for`. **The runtime is not part of the contract. The rendered output is.** Production must reproduce V10 in the existing Next.js static-export component architecture, and must not ship `support.js`, `image-slot.js`, Babel or CDN React.

### 3.1 Assets referenced by V10 (proposed for eventual integration, pending an implementation decision)

| Asset | SHA-256 | Bytes | Use |
|---|---|---|---|
| `assets/plate-hero-v4.png` (1672×941) | `afb05bc4ccb5cfd00577e20c236670cb4769faca8e046816822ba341ba5c4ec4` | 2,407,344 | Entry background plate; also note-1 placeholder image |
| `assets/logo-mark.mp4` | `ac6124585dc489d88f38ac57a2b8729863486c78b51e59a64ec8ab0734225ed4` | 3,736,250 | Animated mark, two-element crossfade loop |
| `assets/logo-mark-poster.png` (960×960) | `931e2fc037832c27b084bcca0df5a683c9c28376ac78b77cbbe24db8ecd9c851` | 373,851 | Mark poster / still-mode frame |
| `assets/plate-aqueduct-v4.png` (1672×941) | `285ac4b3b2f4be7033bfc3e3b32f7d6b0397aca9f197702c780f071f2fe21928` | 2,593,327 | note-3 placeholder image only |
| `assets/favicon.svg` | `b34acfe1395e080c2d551982d6e5c550171b6b877ec535de4f4dc60ae3676d04` | 8,384 | Favicon (production favicon currently 404; AS-116 cosmetic) |
| `assets/icons/01-ai.svg` | `380672cca0e810d1f213dd1150f587c210e5937f22260c9563c8fccfd6e9537d` | 11,492 | Systems node icon |
| `assets/icons/02-automation.svg` | `7ca3b747160b5734e15a8a53a071cc1347efb96f90e4c7b455bdf903e147df6c` | 13,232 | Systems node icon |
| `assets/icons/03-security.svg` | `c1e5481fdbb6086ec71d579e30da5a8bd5d2b8f749bfcb11f6b01bb47a95bb95` | 11,080 | Systems node icon |
| `assets/icons/04-research.svg` | `ea27af84196270fd74df9880c95879a44f49533c73959f89a7361bc7d560316f` | 11,175 | Systems node icon |
| `assets/icons/05-systems.svg` | `be8373dc0c2d9618fbeeb0b91555416ef249c38ae036ebbdf81eed8d30f3e05d` | 12,472 | Systems node icon |
| `assets/icons/08-strategy.svg` | `2b55c4fd582a6064a48fc5e226874175047f0483f1016f9a02d7908d6f9b1b8a` | 11,668 | Systems node icon ("Architecture") |

**Other dependencies:**
- **Fonts:** Google Fonts (Montserrat 300/400/500/600, Inter 400/500, IBM Plex Mono 400/500). They are not in the package.
- **Runtime (not integrated):** `support.js` (`8fe7df74…`) and `image-slot.js` (`fff26d08…`).
- **Unreferenced by default:** `plate-hero-loop.mp4`, reachable only through the free-text `plateVideo` prop.

The three MEDIA_GAP items deferred at Gate D (`plate-hero-v4.png`, `logo-mark.mp4`, the logo-mark poster) are **exactly the V10 assets above**, and are now available as reference.

### 3.2 Behaviour contract

- **Entry** (a fixed full-viewport header):
  - **Background:**
    - the plate at `center 78%` with a 38 s `scale 1.1→1.145` push loop;
    - horizontal, top, bottom and bottom-left radial dim layers;
    - a 50% overlay that fades in when a panel opens.
  - **Nav:** `MAISOG`+`LABS` (blue) in 14px/.28em Montserrat 500; links at 11px/.24em uppercase, with the active link underlined by a 1px `#3B82F6` bar.
  - **Kicker:** `00 / Entry` in IBM Plex Mono 11px.
  - **Stage:** `min(40vh,440px)`, square, holding:
    - a glow and the two-video crossfaded mark (screen blend, radial mask);
    - a tilted orbit ellipse with a node on a 48 s circuit;
    - an optional arch SVG, hidden by default (`heroArch=false`).
  - **Wordmark:** `h1` `MAISOGLABS`, Montserrat 300, `clamp(28px,5.2vw,84px)`, letter-spacing .34em.
  - **Tagline:** a pill reading "Ideas in orbit", with rules on both sides.
  - **Footer:**
    - bottom-left descriptor: "The independent technology laboratory of Paulo Maisog, building AI automation, research systems, and experimental software.";
    - bottom-right: "Humanity / Orbits / Higher".
  - **Pointer parallax:** Full motion only, and never on touch.
  - **Entry reveal:** staged at delays 0 / 350 / 700 / 1150 / 1550 ms.
- **Floating panel model:**
  - Four `section`s are absolutely positioned inside a fixed layer (`top: clamp(72px,11vh,96px)`), with max-width 1360px.
  - Panel style: background `rgba(3,9,26,.9)`, border `1px rgba(147,180,255,.16)`, radius 6px, shadow `0 30px 80px rgba(0,0,0,.45)`.
  - Open transition: opacity plus an 18px rise at 0.45–0.7 s, with a 260 ms delay before focus moves.
  - The Entry scales to .86 and dims to .22 opacity behind the open panel.
  - Each panel has its own internal scroll.
- **Systems:**
  - `01 / Systems` with a trajectory rule;
  - "Six disciplines, / one working system.";
  - a roving-tab discipline list;
  - a radial diagram: the active node enlarges to the centre, linked nodes glow, and project diamonds link to Projects;
  - a detail column with "Connects to" and "Used in projects".
- **Projects:**
  - numbered list with roving keys;
  - a detail panel: number, name, status, tagline, description, discipline pills;
  - a "How it works" 4-step system-flow figure on a grid background, with "A person decides" marked;
  - previous/next controls and a connector line between list and panel.
- **Research (`id="journal"`):**
  - "Research Notes" with filters All / Research / Build / Thoughts;
  - a grid of 16:9 image cards;
  - "More notes →".
  - **V10 notes are placeholders**, hard-coded with image slots.
- **Contact:**
  - "Humanity / orbits higher." at `clamp(44px,6vw,92px)`;
  - a trajectory line to a node;
  - "Correspondence" with a mailto link (`maisog36@gmail.com`) and "Copy address";
  - the line "For work that expands what people can understand, create, and explore."
- **Routing:**
  - the hash selects one of `systems | projects | journal | contact`; anything else goes to Entry;
  - `Escape` or the wordmark returns to Entry, via `pushState`;
  - focus moves to the opened section.
- **Motion modes:** `Full | Calm | Still`. `prefers-reduced-motion` forces **Still**, which stops videos at frame 0, disables parallax and the push loop, and applies instant transitions.
- **Responsive:** narrow is `max-width: 699px`. Selectors become horizontal scrollers, and the system-flow figure becomes vertical.
- **Colours:** `#020918`, `#0A1433`, `#050B1F`, `#F8FAFF`, `#3B82F6`, `#6EA8FF`, `#93B4FF`, `#9AA8CC`, `#7F8DB5`, `#C9D5F5`, `#E4EAFB`.

### 3.3 V10 defects observed at 390×844 (local render, ACTOR_REPORTED)

These are candidate deliberate divergences and need Paulo's approval (§13):
1. The nav overflows horizontally: "RESEARCH" and "CONTACT" are clipped, with no menu. The page itself does not overflow (390 = 390).
2. In the Systems radial diagram, node captions overlap ("Infrastructure and data" / "Safe, responsible use").

## 4. Architectural conflicts / supersessions

| # | Record | Conflict with V10 | Resolution (recommended) |
|---|---|---|---|
| C1 | **ML-DEVOS-RFC-010**: "preserve V3 composition"; the fail-safe baseline is "V3 + UI-PATCH-001"; "default bootstrap parity with current V3 + soft geometry"; screenshot evidence for the default baseline | V10 is a different canonical composition. Its fail-safe must be V10. | **A new bounded RFC, `ML-DEVOS-RFC-021 — V10 Canonical Visual Baseline`,** that explicitly supersedes only RFC-010's baseline/composition/parity clauses. It retains RFC-010's allowlist security model, draft/preview/publish lifecycle, stale-write protection, positive-allowlist serialization, public projection and "no arbitrary CSS/HTML/JS/URL" rules. Accepted RFCs are immutable, so an amendment in place would rewrite reviewed text. Treating V10 "under" RFC-010 would silently reinterpret it. |
| C2 | **Spatial Design Controls V2A plan** (AS-107/AS-112): "presentation only", no public structural or runtime redesign, DesignRuntime untouched | V10 changes the public structure and the runtime baseline. | V10 is **not V2A**. V2A stays accepted as it was. V10-B (admin remapping) is a new increment that reuses the V2A vocabulary (Entry/Systems/Projects/Contact, Draft/Preview/Publish/Deployment). |
| C3 | **Website Redesign V1** (D-076/AS-104/AS-106): the accepted V1 composition and `#research` hash | V10 replaces the V1 visual composition, and its Research panel id is `journal`. | RFC-021 supersedes the V1 *visual* composition. It keeps the V1 accessibility and routing guarantees that V10 also satisfies. The hash decision goes to the owner (§16 Q3). |
| C4 | **Content boundary** (`data/site.js` → `lib/content/*` → `app/page.js`) | V10 hard-codes different facts: 5 projects (Sentinel/DevOS, SU, ClinicFlow, Maisog Kilat, Maisog Guild), discipline copy, system flows, statuses, the email `maisog36@gmail.com`, and placeholder notes. | **CONTENT PROVIDES FACTS.** V10's copy is design intent, not approved content. Implementation binds the V10 layout to the content source. Which facts to publish is an owner decision (§16 Q1–Q2). |
| C5 | DesignRuntime and the remote-asset rule ("never loads a remote font/asset") | V10 loads Google Fonts at runtime. | The code-owned baseline self-hosts the three typefaces (OFL). No runtime remote font. |

## 5. V10 vs current parity matrix

| V10 trait | Current state | Classification | Required change | Owner | Risk | Test / evidence |
|---|---|---|---|---|---|---|
| Information architecture (Entry + 4 panels) | Entry + 4 hash surfaces | DIRECT MATCH (structure) | none structurally | code | low | route tests |
| Navigation (wordmark + 4 uppercase links, underline active) | serif wordmark + ring, numbered links, 760px menu | PARTIAL | restyle to V10; keep the narrow menu to fix §3.3-1 (divergence D1) | code | med | screenshots, keyboard |
| Entry composition (plate, mark video, orbit, wordmark, tagline, corners) | V1 hand/robot plate, serif mark, destination cards | CONFLICT | replace with V10 Entry | code | high (visual) | parity diff |
| Hero media `plate-hero-v4.png` | `maisog-v4-cosmic-background.webp` | GAP | integrate an optimized derivative (source hash recorded) | code + media decision | med (weight 2.4 MB) | hash + perf budget |
| Logo animation (`logo-mark.mp4` crossfade, poster) | none | GAP | integrate video + poster, Still → poster | code + media decision | med (3.7 MB) | motion capture |
| Imagery (note images) | none on Research | GAP | bind to Journal `media` where present; else no image (placeholder slots are not content) | content | med | journal fixture |
| Typography (Montserrat / Inter / IBM Plex Mono) | Georgia serif + Inter + SF Mono | CONFLICT | self-host V10 fonts | code | med (font sourcing) | render diff |
| Panel geometry (6px radius, .9 navy, 1px .16 border) | UI-PATCH-001 soft glass cards | CONFLICT | V10 panel tokens | code | low | parity diff |
| Spacing (clamp-based, 1360 max) | V1 spacing | PARTIAL | adopt V10 values | code | low | parity diff |
| Systems (radial diagram, detail column) | V1 discipline graph | PARTIAL | port the V10 diagram; relationships stay derived from content | code + content | med | graph unit tests |
| Projects (list + detail + system-flow figure) | V1 selector + detail | PARTIAL / GAP (flow figure) | port V10; flow steps become content fields | code + content (schema) | med | schema tests |
| Journal / Research (filters, card grid) | real Journal list, text-only | PARTIAL | V10 card grid over real Journal; filters from Journal categories/tags (GAP if absent) | code + content | med | journal fixtures |
| Contact (statement, trajectory, mailto + copy) | statement + mailto | PARTIAL | port V10; email from content (§16 Q2) | code + content | low | e2e |
| Responsive (699px breakpoint, horizontal selectors) | 760px breakpoint + MENU | PARTIAL | V10 layout, plus divergences D1/D2 | code | med | 390/768 renders |
| Motion (Full/Calm/Still, 48 s orbit, 38 s push, staged reveal) | calm/minimal/off enum | PARTIAL | implement V10 modes; map the existing enum (§7) | code | low | reduced-motion capture |
| Reduced motion (forces Still) | forces off | DIRECT MATCH (policy) | keep | code | low | media-query test |
| Accessibility (roving lists, aria-pressed, aria-live, focus on open, Esc) | equivalent V1 patterns | DIRECT MATCH / PARTIAL | keep the V1 skip-link and inert-Entry guarantees | code | med | keyboard + axe (new) |
| Content source | `data/site.js` + validators | CONFLICT (facts differ) | owner decides the facts; the schema gains project flow/status fields | content | med | schema fail-closed |
| Admin-control compatibility | 15 theme fields, V3-era presets | CONFLICT (several presets redefine the look) | remap per §7 | admin | med | admin tests |
| Fail-safe | falls back to the static V1/V3 CSS | CONFLICT | static baseline = V10 (§8) | code | high | API-down test |

## 6. Ownership model

**CODE OWNS V10. ADMIN OPERATES V10. CONTENT PROVIDES FACTS. SENTINEL GOVERNS AUTHORITY/EXECUTION.**

| Category | Examples |
|---|---|
| **A. CODE-LOCKED** | composition, panel model, route/hash semantics, Esc/wordmark return, focus rules, typography families and scale, colour tokens, geometry, the orbit/diagram/flow-figure drawings, breakpoints, reduced-motion policy, asset set (fixed source-controlled allowlist) |
| **B. ADMIN-EDITABLE BOUNDED PRESET** | motion intensity (Full/Calm/Still), panel opacity/border/radius within tight V10-centred ranges, environment dim strength, Project selector scroll behaviour on narrow screens, managed-surface visibility and relative order (Systems/Projects/Contact) |
| **C. CONTENT-EDITABLE** | the Entry descriptor, disciplines (name, caption, description, links), projects (name, status, tagline, description, discipline tags, 4-step flow and human step, optional URL), the contact email and line, Journal entries and their media |
| **D. NOT EDITABLE** | brand identity, wordmark, accent colour, fonts, arbitrary media, `heroArch`, free-text `plateVideo`, any CSS/HTML/JS/selector/URL/asset path |

**The rule:** a bounded admin control may *vary* V10. It may not *redefine* V10. Every admin default equals V10 exactly.

## 7. V10 admin-control matrix

| Existing control (payload key) | V10 relation | Disposition | Notes |
|---|---|---|---|
| Entry background (`heroBackgroundPreset`: cinematic-v3/deep-night/minimal-orbit) | V10 has one approved plate | **REMOVE FROM UI** | Runtime ignores the value. The field stays in the schema (no migration). More plates would be a future allowlist decision. |
| Environment overlay (`overlayIntensity` 40–85) | V10 dim layers | **REMAP** | Scales V10's dim layers. The default maps to exact V10 opacities. |
| Accent (`accentPreset`: cobalt/teal/violet) | `#3B82F6` is brand | **REMOVE FROM UI** | Teal/violet would redefine V10. |
| Surface / card style (`cardStylePreset`) | one panel treatment | **REMOVE FROM UI** | |
| Surface glass (`panelPreset`) | one panel treatment | **REMOVE FROM UI** | |
| Spatial density (`layoutDensityPreset`) | V10 clamp spacing | **REMOVE FROM UI** | |
| Surface opacity (`panelOpacityPct` 55–90) | V10 = 90 | **REMAP** | UI-limited to 80–90 (a client clamp). The server range is unchanged. |
| Border intensity (`borderIntensityPct` 10–45) | V10 = 16 | **REMAP** | UI-limited to 10–25. |
| Radius (`radiusScalePct` 80–120) | V10 = 6px × 1.0 | **KEEP** | Default 100 = V10. |
| Typography (`typographyPreset`) | V10 families | **REMOVE FROM UI** | |
| Heading scale (`headingScalePreset`) | V10 clamp scale | **REMOVE FROM UI** | |
| Motion (`animationPreset` calm/minimal/off) | V10 Full/Calm/Still | **REMAP** | calm → Full, minimal → Calm, off → Still, with friendly labels. Existing enum values are submitted (V2A pattern). |
| Reduced motion (`reducedMotionMode`) | forces Still | **KEEP** | |
| Project selector scrolling (`projectRailMode`) | narrow horizontal selector | **REMAP** | snap / free-scroll on the narrow selector only. |
| Journal index layout (`journalCardMode` stack/rail) | V10 card grid | **REMOVE FROM UI** | |
| Visibility / order (home/process/projects/about) | V10 panels | **KEEP** | Entry remains visibility-only. Research stays unmanaged (V2A). |
| `heroArch` (V10 prop) | default off | **NOT EDITABLE** | code-locked off |
| `plateVideo` (V10 free-text URL) | arbitrary URL | **NOT EDITABLE** | A fixed-allowlist `plate-hero-loop` would **REQUIRE A NEW BOUNDED CONTROL** (a schema enum plus a migration), deferred to a separate decision. |

**Schema/API determination:**
- **V10-A and V10-B need no D1 migration and no API-shape change.** Removed controls stay valid persisted fields that the runtime ignores. Remaps change only admin labels, client clamps and runtime mapping.
- **A migration is needed only if** Paulo later wants a new bounded control (for example a plate-video allowlist) or a new enum value. That is out of scope here.
- *(STRONGLY SUPPORTED: every existing key and range contains the V10 value.)*

## 8. Fail-safe architecture

- **The V10 baseline is static, compiled into the build.** It covers components, CSS tokens, self-hosted fonts and local assets. It needs neither D1 nor `/api/design`.
- **`/api/design` becomes optional, bounded V10 overrides.** It is not a baseline source.
  - If the API is unavailable, 5xx, malformed or invalid, DesignRuntime applies nothing and the page is exactly V10.
  - This is already how the mechanism behaves (VERIFIED in production by AS-116); only the static baseline changes.
- **Removed-from-UI keys are ignored** by the runtime mapping, even if a stored value differs. So an old published `accentPreset: violet` cannot produce a non-V10 site.
- **Seeded and default values equal V10.** A test asserts that `default payload ⇒ no visual delta`.
- **Research** degrades to an explicit "journal could not be loaded" state inside the V10 panel. The layout never changes.
- **Chosen mechanism:** optional overrides, not versioned V10 settings. Versioning adds schema without a demonstrated need (SU alternative check, §17).

## 9. API-incident separation

The incident is a **separate track**, never mixed into V10 increments.

**API-DIAG (read-only; must run from a session with authenticated Cloudflare access):**
1. Capture the exact Worker exception for `GET /api/design` (for example `wrangler tail` during one GET, or the Workers Logs dashboard).
2. Capture the exact Worker exception for `GET /api/journal`.
3. Verify the live D1 binding's identity and existence for Worker `maisog-labs` (binding name `DB`, database id/name) from the deployed version's metadata.
4. Inventory the production D1 tables and schema read-only (for example `wrangler d1 execute <db> --remote --command "SELECT name FROM sqlite_master"`), with no writes.

**Hypothesis (PLAUSIBLE, not verified):**
- Both handlers return 503 only when the binding is absent, and they have no try/catch around the queries (`worker/public/design.mjs:111-114`).
- A 500/1101 is therefore consistent with a bound but unmigrated or empty production D1 ("no such table").
- `wrangler.jsonc` declares `remote: false` with no `database_id`.

**API-FIX:** proposed only after API-DIAG evidence, and under its own decision. It may involve an owner-authorized remote migration, which is not authorized now.

## 10. Proposed implementation increments

1. **RFC-021 (docs):** the V10 Canonical Visual Baseline RFC, which partially supersedes RFC-010 as in §4. It goes to Architect review, then Paulo.
2. **API-DIAG (read-only, parallel):** as in §9. Requires a Cloudflare-authenticated session.
3. **V10-A: canonical code-owned V10 baseline.**
   - components and CSS;
   - self-hosted fonts;
   - approved local asset derivatives with the source hashes recorded;
   - routes;
   - content binding;
   - fail-safe;
   - DesignRuntime mapping made baseline-neutral.

   It requires the owner's content decisions (Q1–Q3) and a media-integration authorization.
4. **V10-B: bounded admin mappings and preview semantics** (§7). No schema change.
5. **API-FIX:** only if API-DIAG establishes a concrete remediation.
6. **V10-RELEASE:** visual acceptance → PR (Gate B) → merge (Gate C) → production promotion (Gate D) → runtime verification. This is the WEB-REL-002 pattern.

**Recommended order:**
- RFC-021 and API-DIAG in parallel;
- then V10-A;
- then V10-B;
- API-FIX whenever its evidence is ready;
- then V10-RELEASE.

## 11. Exact files expected per increment

- **RFC-021:**
  - `devos/changes/rfcs/ML-DEVOS-RFC-021.md`;
  - `devos/changes/rfcs/README.md` (index row).
- **API-DIAG:** coordination/evidence records only. No repository code.
- **V10-A:**
  - `app/layout.js` (fonts, favicon);
  - `app/page.js`;
  - `app/globals.css`, or a new `app/v10.css`;
  - `components/site/{SpatialShell,SystemsSurface,ProjectsSurface,ResearchSurface,ContactSurface,useListKeys}.js`;
  - `components/site/routes.mjs`;
  - new `components/site/{EntryStage,LogoMark}.js`;
  - `data/site.js` and `lib/content/schema.mjs` (project flow/status/tagline fields, per the owner's content decision);
  - `app/DesignRuntime.js` (ignore removed keys; V10 mapping);
  - `public/v10/**` (optimized derivatives, fonts, icons, favicon);
  - `tests/v10-*.test.mjs`;
  - `docs/product/{UI_UX_SPEC,DESIGN_REFERENCE_WORKFLOW}.md`;
  - `docs/product/evidence/v10/**`.
- **V10-B:**
  - `app/admin/DesignControls.js`;
  - `tests/spatial-design-controls-v2.test.mjs` (or a new `v10-admin` test);
  - docs.
- **Never, in these increments:** `worker/**`, `migrations/**`, `wrangler.jsonc`, `package*.json`. A font or asset dependency would need explicit approval; self-hosted font files are preferred to any npm dependency.

## 12. Test / evidence plan

- **Unit tests:**
  - route and hash resolution, including aliases;
  - discipline-graph derivation;
  - fail-closed content schemas (new project fields);
  - a DesignRuntime mapping test: removed keys ignored, and the default payload gives no delta;
  - motion-mode mapping.
- **Fail-safe tests:** a render with `/api/design` returning 404, 500 and malformed JSON must equal the default render.
- **Research tests:** Journal success, empty and failure fixtures inside the V10 panel.
- **Security and scope tests:**
  - no remote font, script or asset requests at runtime (a network-log assertion);
  - no `support.js`, Babel or CDN React in `out/`.
- **Asset tests:** every asset in `out/` appears in the allowlist manifest, with the source hash of its reference asset.
- **Build checks:** full `npm test`, `npm run build`, and a bundle-size and performance budget (LCP media sizes).

## 13. Visual parity acceptance method

- **Reference:** the V10 HTML at SHA `6e47ffca…`, rendered by a pinned local harness:
  - React 18.3.1, ReactDOM 18.3.1 and Babel 7.29.0 served locally from the npm tarballs;
  - the same self-hosted fonts as the implementation, so typography is compared like for like.
- **Candidate:** the `npm run build` static export.
- **Captures,** at 1440×900 (DPR 1) and 390×844 (DPR 2):
  - Entry and each panel (Systems, Projects, Research, Contact), with Research fed identical fixture notes;
  - `reducedMotion: reduce` screenshots to freeze motion (Still mode);
  - Full-mode frame captures at fixed timestamps for motion (orbit position, push scale, reveal order, mark crossfade).
- **Comparison:**
  - side-by-side plus a per-pixel diff with a documented threshold, and a region list for any residual difference;
  - every residual difference must appear in the **Divergence Register** with a reason and **Paulo's approval**.
- **Not acceptable as evidence:** "same vibe", "inspired by", or "close direction".
- **Initial Divergence Register candidates** (each requires Paulo's approval):
  - **D1:** a narrow-screen menu to fix nav clipping (§3.3-1).
  - **D2:** Systems caption collision fix at 390px (§3.3-2).
  - **D3:** real Journal content and images instead of V10 placeholders (content, not design).
  - **D4:** content facts per Q1–Q2.

## 14. Mobile / accessibility acceptance

- No horizontal page overflow at 320, 390 and 768px.
- Every nav destination reachable at 390px.
- Tap targets of at least 44px.
- **Keyboard:**
  - the roving lists (Home/End/arrows);
  - `Esc` returns to Entry;
  - focus moves to the opened panel heading and returns on close;
  - the skip link targets the active panel;
  - Entry is `inert` while a panel is open.
- **Reduced motion:** Still mode with no autoplaying video (the poster shows); nothing moves.
- **Contrast:** checks on muted texts (`#7F8DB5` and `#9AA8CC` on `#030A1A`) to be measured.
- **New automated gate:** axe (or equivalent) with zero serious or critical violations.

## 15. Release-gate sequence

1. Architect review of this plan.
2. Paulo decisions: RFC-021 drafting, API-DIAG, and content Q1–Q3.
3. RFC-021 Architect review.
4. V10-A authorization (including media integration), then implementation, then Architect review with the visual-parity evidence.
5. V10-B authorization, then implementation, then review.
6. **Gate B:** release PR; CI green on the exact head.
7. **Gate C:** protected merge, preceded by fresh Cloudflare build-command and active-version checks.
8. **Gate D:** promote the exact Version, then runtime verification.

API-FIX is independent, but it should precede or accompany Gate D so that Research is not shipped broken again.

## 16. Risks / unresolved questions

- **Q1 (owner, content):** publish V10's project set (Sentinel/DevOS, SU, ClinicFlow, Maisog Kilat, Maisog Guild) and its copy, or the current four projects laid out in V10 form? **UNRESOLVED.**
- **Q2 (owner, content):** contact email: `maisog36@gmail.com` (V10) or `hello@maisoglabs.com` (current)? **UNRESOLVED.**
- **Q3 (owner):** canonical Research hash: `#journal` (V10) with `#research` as an alias, or keep `#research`? The recommendation is V10's `#journal` with `#research` kept as a permanent alias.
- **Q4:** approve divergences D1 and D2.
- **Q5:** font sourcing. Self-hosted OFL files are to be added to the repository; the source and licence need recording.
- **Q6:** media optimization targets (AVIF/WebP plate, H.264/WebM mark) and a byte budget.
- **Q7:** Research filters. Journal needs a category or tag to support All/Research/Build/Thoughts; otherwise hide the filters (a divergence).

**Risks:**

| Risk | Level |
|---|---|
| Visual regression presented as "parity" without a diff | high; mitigated by §13 |
| Page weight from the 2.4 MB plate and 3.7 MB video | med |
| Content drift if V10 placeholder copy ships as fact | high; mitigated by C4 |
| Incident coupling if V10 ships while the APIs still fail | med |

## 17. SU evidence verdict

Mode `BOUNDED_CONTRADICTION`. Primary evidence (the artifact, the repository and the accepted records) was sufficient, and no web research was needed.

| Claim | Class |
|---|---|
| The V10 HTML is the exact approved artifact (hash) | VERIFIED |
| The V10 assets and hashes in §3.1 | VERIFIED (local) |
| RFC-010's baseline clauses conflict with V10 | VERIFIED (text) |
| DesignRuntime's failure path keeps the static baseline | VERIFIED (code + AS-116 production observation) |
| All V10 values fit the existing keys and ranges, so no migration is needed for V10-A/B | STRONGLY SUPPORTED |
| The API 500 is an unmigrated or empty production D1 | PLAUSIBLE |
| The ZIP hash `79f0a455…` | owner-reported (not re-hashable here) |
| V10 is correct at mobile | CONTRADICTED by render (§3.3) |

**Checks performed:**
- **Contradiction search:** V10 content vs the published content (C4); V10's Google Fonts vs the no-remote-asset rule (C5); V10's mobile defects vs the "pixel parity" demand (§13 register).
- **Alternatives considered:**
  - (a) amend RFC-010 in place — rejected (immutability);
  - (b) versioned V10 settings in D1 — rejected (schema cost, no need);
  - (c) embed the `dc` runtime — rejected (CDN/Babel/runtime-eval);
  - (d) a selective V10 under V2A — rejected (V2A prohibits structural change).
- **Minority finding preserved:** strict pixel parity with V10 would *reproduce* its mobile nav clipping. The owner may prefer exact parity, so D1/D2 are requests, not assumptions.
- **Escalation check:** not escalated. No claim depends on current external evidence.

## 18. SENTINEL execution contract

| Plane | Contract |
|---|---|
| **Authority** | D-087 (planning), then future Paulo decisions per §15. Directives are transport only. |
| **Context** | T0–T2 per §1. T3 is used only for a named question. |
| **Capability** | Reading a Cloudflare, D1 or R2 capability is not permission to use it. API-DIAG requires its own read-only authorization and an authenticated session. |
| **Execution** | Every increment runs one directive, publishes a return, and gets an Architect review. No combined V10-A + API-FIX commits. |
| **Evidence** | Builder renders, diffs and runtime probes are `ACTOR_REPORTED`. Architect reproduction is recorded separately. Production observations are a separate class. |

**Standing boundaries** hold throughout: S6 parked (AS-103), O1/O2 open, D-068 suspended, PR #7/#10 not merged, no V2B.

## 19. Design Panel verdict (Design Panel skill v2 passes)

| Pass | Result |
|---|---|
| **Product / UX** | APPROVE the plan. The panel model is clear. Q1 must be answered before content ships. |
| **Brand / visual system** | APPROVE. V10 matches the skill's "Roman engineering + orbital science + research lab" direction. Keep `#3B82F6` and the three typefaces code-locked. |
| **Accessibility** | APPROVE WITH REQUIREMENTS: D1 (mobile nav), D2 (caption collision), contrast measurement, and an axe gate. |
| **Engineering feasibility** | APPROVE. Port to Next components, with no `dc` runtime. Static export is compatible. The media weight needs derivatives. |
| **Independent Critic** | "Does the proposed implementation actually preserve V10, or did engineering convenience quietly produce another different website?" The plan answers this only through §13's pixel-diff and divergence register. Any increment returning without that evidence must be rejected. The removed admin presets exist precisely so admin cannot drift the site away from V10. |
| **Layperson / first-time visitor** | Entry communicates "an independent technology lab by Paulo Maisog" through the descriptor. The four destinations are plain words. The risk is that placeholder copy (for example unexplained "SU" and "Kilat" project names) reads as jargon; Q1 must settle the facts and plain-language taglines. |

**Overall:** `APPROVE PLAN — IMPLEMENTATION NOT AUTHORIZED`.

## 20. Recommended next Paulo decision

Authorize, as separate bounded decisions:
1. **RFC-021 drafting** (V10 Canonical Visual Baseline, partially superseding RFC-010 as in §4). Docs only.
2. **API-DIAG**, read-only, from a Cloudflare-authenticated session (§9). No writes.
3. **Content answers Q1–Q3** (project set and copy, contact email, Research hash), plus the D1/D2 divergence approval.

V10-A implementation (including media integration) should follow only after RFC-021 is accepted and Q1–Q3 are answered.
