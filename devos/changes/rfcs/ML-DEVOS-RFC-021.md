# ML-DEVOS-RFC-021: V10 Canonical Visual Baseline

Status: `DRAFT` — drafted under `D-088` for Architect review. It is not accepted, and it grants no implementation authority.

Proposed change class: `ARCHITECTURE`

**Authority:**
- `D-088`: Paulo's V10 content, routing, divergence and runtime-safeguard decisions, and authorization to draft this RFC only.
- `ML-DEVOS-AS-117`: the independent review of the V10 plan and the source of the runtime-enforced range requirement.
- `D-087` / `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`: the planning record.

**Repository-grounded drafting base:** `4c436a8a1f8768ea2fdbf377ef22f9717ccfb810`. Main is `aebc881e8890c00090d714602591138a045bd3b0`.

**Design source of truth (Paulo, D-087):** `design-references/claude-v10/source/Maisog Labs Home v10.dc.html`, SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`.

## 1. Problem

Paulo has made V10 the website design target. The accepted design-control architecture, `ML-DEVOS-RFC-010`, fixes a different visual baseline:
- "preserve Brand V3 and the approved soft-geometry direction";
- fail-safe to "the static V3 + soft-geometry baseline";
- "Preserve: V3 composition; soft-geometry baseline";
- default bootstrap parity with "current V3 + soft geometry".

Implementing V10 under RFC-010 as written would either violate those accepted clauses or silently reinterpret them. Accepted RFCs are immutable, so the conflict needs an explicit, narrow supersession.

RFC-010's older server ranges and presets are also wider than V10's accepted visual range. Without a runtime rule, a stale persisted value or a direct API submission that is legal under RFC-010 could drift the public site away from V10 (AS-117).

## 2. Decision summary

**CODE OWNS V10. ADMIN OPERATES V10. CONTENT PROVIDES FACTS. SENTINEL GOVERNS AUTHORITY/EXECUTION.**

- V10 becomes the **static, code-owned, fail-safe visual baseline**. It must render correctly without D1 and without `/api/design`.
- `/api/design` becomes a source of **optional, bounded variations** of V10. It never defines the baseline.
- A bounded admin control may *vary* V10. It may not *redefine* V10.
- This RFC supersedes RFC-010 **only** where RFC-010 fixes the V3/soft-geometry visual baseline, composition and default-parity target (§4). Every RFC-010 safety and lifecycle invariant is preserved (§3).

## 3. RFC-010 invariants preserved unchanged

RFC-021 does not alter any of the following. Each remains normative exactly as RFC-010 states it:

| # | Preserved RFC-010 invariant | RFC-010 location |
|---|---|---|
| P1 | Authentication: protected admin design APIs require the Access-verified admin path; Access-before-admin-D1 | "Protected admin APIs"; Evidence 11 |
| P2 | Positive allowlists: fixed enums and bounded integers only, with unknown-field rejection | "Approved control values"; Evidence 8–9 |
| P3 | Stale-write protection: expected-pointer checks on theme and section mutations | "Theme mutation lifecycle"; "Section mutation lifecycle"; Evidence 12–13 |
| P4 | Immutable revisions: `theme_settings_revisions` / section revisions immutable; singleton pointer ownership | "Data ownership"; Evidence 5–6 |
| P5 | Draft → preview → publish lifecycle; authenticated preview reads draft-if-present; drafts never public | "Theme mutation lifecycle"; Evidence 14–19 |
| P6 | Public published-only projection: `GET /api/design` is unauthenticated, GET-only, read-only, published-only, positive-allowlist; wrong method rejected before D1 | "Public design API"; "Worker routing"; Evidence 17–20 |
| P7 | Prohibition of arbitrary CSS, HTML, JavaScript, URLs, selectors, colors, fonts, object keys, and asset inputs from admin or D1 | "Approved control values"; "Public runtime application"; "Explicit non-goals" |
| P8 | Runtime application only through fixed `data-*` enum attributes, numeric custom properties from validated fields, and fixed local mappings; no injected CSS, no `dangerouslySetInnerHTML`, no eval, no remote fonts/assets | "Public runtime application" |
| P9 | "A design API failure must not blank the site." | "Fail-safe baseline" |
| P10 | Static export preserved; no SSR conversion; homepage content not D1-driven | "Section visibility/order" |
| P11 | Audit actions and local-only resource boundary; migrations 0001–0005 stay byte-identical | "Audit actions"; "Local-only resource boundary" |
| P12 | Focus-visible behavior, responsive breakpoints as re-specified by V10, `prefers-reduced-motion` behavior, contrast/readability | "CSS implementation" (non-visual-baseline items) |

**Server contract unchanged.** RFC-021 changes no server enum, range, table, migration or API shape. Every RFC-010 value remains *accepted and persisted* by the server. RFC-021 changes only how the public runtime *interprets* those values (§7).

## 4. RFC-010 clauses narrowly superseded

Each clause below is superseded **only to the extent that it fixes the V3/soft-geometry visual baseline, composition or default-parity target**. All other text in those sections stays in force.

| # | RFC-010 clause (verbatim anchor) | Superseded by |
|---|---|---|
| S1 | Problem: "preserve Brand V3 and the approved soft-geometry direction" | The V10 visual direction (§5). Brand V3 identity continuity is expressed through V10's approved wordmark, mark and palette. |
| S2 | Bootstrap: "one published revision matching the currently accepted V3 + UI-PATCH-001 baseline" | The migration-seeded revision stays valid stored data (migration 0005 is immutable, P11). It no longer defines the canonical look. It is interpreted through §7, and §7.4 governs its effective presentation. |
| S3 | Public design API: "If no valid published theme exists, public runtime must safely fall back to the static V3 + soft-geometry baseline." | "…must safely fall back to the static **V10** baseline." |
| S4 | Fail-safe baseline: "…the site must retain the existing approved V3 + UI-PATCH-001 baseline." | "…the site must retain the static **V10** baseline." (P9 retained.) |
| S5 | CSS implementation: "Preserve: V3 composition; soft-geometry baseline" | "Preserve: **V10 composition; V10 baseline**". The remaining items there are preserved (P12). |
| S6 | Evidence 7: "default bootstrap parity with current V3 + soft geometry" | Default and fail-safe parity with V10 under the §9 visual-acceptance method. |
| S7 | Evidence 30: "visual screenshot evidence for at least the default baseline and one non-default approved preset" | The §9 method: V10 parity for the default and fail-safe paths, plus at least one non-default *active* control inside its V10 range. |

**Also superseded as a visual composition:** the Website Redesign V1 composition (`D-076` / `ML-DEVOS-AS-104` / `ML-DEVOS-AS-106`). V1's accessibility and routing guarantees that V10 also satisfies are kept (§6, §8).

**Spatial Design Controls V2A** (`ML-DEVOS-AS-107`, `ML-DEVOS-AS-112`) remains **historical accepted work**. It is not redefined. V10 admin remapping is a new increment (V10-B), not V2A.

## 5. V10 canonical baseline contract

The canonical visual reference is the rendered output of the V10 HTML at SHA `6e47ffca…`. Its prototype runtime (`support.js`, `image-slot.js`, CDN React/ReactDOM/Babel), Google Fonts loading, placeholder copy, placeholder notes and designer props (`heroArch`, free-text `plateVideo`, `motion`) are **design evidence, not runtime authority** (AS-117).

The baseline is specified in plan §3.2. In summary:
- the Entry composition: the plate, dim layers, crossfaded mark video, orbit, wordmark, tagline and corner copy;
- the floating-panel model with its tokens: background `rgba(3,9,26,.9)`, border `1px rgba(147,180,255,.16)`, radius 6px;
- the Systems, Projects, Research and Contact panel structures;
- motion modes and reduced-motion behaviour;
- the colour tokens and typography (Montserrat, Inter, IBM Plex Mono).

**Normative requirements for any future implementation:**

- **R1:** The V10 baseline is compiled into the static build (components, CSS, fonts, assets). It requires neither D1 nor `/api/design`.
- **R2:** The production site must not load `support.js`, `image-slot.js`, Babel, CDN React, or any remote font or asset at runtime (P7, P8). Fonts are self-hosted from source-controlled files, with their source and licence recorded.
- **R3:** V10 media and icons are integrated only as a **fixed, source-controlled asset allowlist**. Each shipped file records the SHA-256 of its reference asset (plan §3.1). Optimized derivatives are allowed, and each records its source hash. No asset path, URL or media choice is admin-editable.
- **R4:** Research notes, images and filters come from the real Journal (`/api/journal` and its `media` projection). V10's placeholder notes and images are never shipped as content.

## 6. Content decisions (D-088)

**CONTENT PROVIDES FACTS.** Public facts come from the repository content source (`data/site.js` → `lib/content/*`) or the Journal. They never come from V10 prototype copy merely because it appears in V10.

- **C1: projects.** Publish exactly these **eight unique** projects, each exactly once:
  1. Sentinel/DevOS
  2. SU
  3. ClinicFlow
  4. Maisog Kilat
  5. Maisog Guild
  6. Automation Hub
  7. Cybersecurity Lab
  8. Experimental Projects

  ClinicFlow appears once; there is no duplicate between V10's list and the current content.
- **C2: copy.** Public copy must be factual, plain-language and backed by the content source. Prototype taglines, descriptions, system-flow steps and statuses are not approved content until they are recorded in the content source.
- **C3: contact.** The contact address is exactly `paulo.maisog@maisoglabs.com`.
- **C4: schema.** Any new content fields V10's layout needs (for example a project tagline, status, four-step flow with a marked human step, or discipline tags) are added fail-closed in `lib/content/schema.mjs`. This is content-schema work in V10-A, not a D1 migration.

## 7. Design-runtime interpretation

### 7.1 Fields ignored by the public runtime

The runtime mapping **ignores** these fields, including stale persisted values and direct API-shaped values. They produce no visual effect, and the V10 baseline applies:
- `heroBackgroundPreset`
- `accentPreset`
- `cardStylePreset`
- `panelPreset`
- `layoutDensityPreset`
- `typographyPreset`
- `headingScalePreset`
- `journalCardMode`

These fields remain valid server data (§3).

### 7.2 Runtime normalization and clamping (D-088, AS-117)

For each numeric field, the runtime applies this normalization before any visual effect, whatever the source (the published API, the authenticated preview, a stale persisted value, or a direct API-shaped payload):

| Field | V10 canonical | Runtime-effective range | Normalization |
|---|---|---|---|
| `panelOpacityPct` | 90 | **80..90** | a missing, non-numeric or non-finite value → 90; otherwise `clamp(round(v), 80, 90)` |
| `borderIntensityPct` | 16 | **10..25** | a missing, non-numeric or non-finite value → 16; otherwise `clamp(round(v), 10, 25)` |
| `radiusScalePct` | 100 | 80..120 (RFC-010 range) | invalid → 100; otherwise `clamp(round(v), 80, 120)` |
| `overlayIntensity` | V10 dim layers | 40..85 (RFC-010 range) | invalid → the value mapped to exact V10 opacities; otherwise it scales V10's dim layers monotonically, with the V10-exact point documented |

Values legal under RFC-010's older ranges but outside these ranges (for example `panelOpacityPct: 55` or `borderIntensityPct: 45`) are clamped to the nearest bound and **cannot drift V10**. The admin UI should offer only the runtime-effective ranges (V10-B), but correctness never depends on the UI.

### 7.3 Enum mappings

| Field | Mapping |
|---|---|
| `animationPreset` | `calm` → Full; `minimal` → Calm; `off` → Still |
| `reducedMotionMode` | `respect-system` → Still only when the user prefers reduced motion; `always-reduced` → Still. `prefers-reduced-motion: reduce` always forces Still. |
| `projectRailMode` | `snap` / `free-scroll` affects only the narrow-screen project selector's scroll behaviour |
| Section visibility/order (`home`/`process`/`projects`/`about`) | Unchanged from V2A semantics. Entry is visibility-only. Systems/Projects/Contact order permutes managed navigation positions. Research is unmanaged. |

Unknown enum values → the V10 default.

### 7.4 Migration-seeded revision (disclosed consequence)

RFC-010's bootstrap revision stores `panelOpacityPct: 74` and `borderIntensityPct: 25`.
- **Under §7.2**, it presents as 80/25, which is inside the approved range but **not** V10-exact 90/16.
- **When the design API fails,** the presentation is V10-exact (§8).
- **Remedy:** the canonical V10 point can be restored without a migration by publishing a new theme revision with 90/16 through the normal RFC-010 draft → preview → publish path. That publish is a separate owner-authorized admin action, not part of any code increment.

## 8. Fail-safe and routing

- **F1:** If `/api/design` is unavailable, returns a non-2xx status, is malformed, fails validation, or times out, the runtime applies nothing and the page renders the static V10 baseline exactly. There is no fallback to any V1/V3 appearance.
- **F2:** The Research panel degrades to an explicit "could not be loaded" state inside the V10 panel when `/api/journal` fails. The layout does not change.
- **F3: canonical routes.** The canonical panel hashes are `#systems`, `#projects`, `#journal` and `#contact`.
  - `#research` is a **compatibility alias** that opens the same Research/Journal surface.
  - Existing legacy aliases stay: `#process` → Systems, `#about` → Contact.
  - All new links, including navigation, Entry and cross-panel links, use `#journal`.
  - Unknown hashes resolve to Entry.
  - `Escape` and the wordmark return to Entry.
  - Focus moves to the opened panel and returns on close.

## 9. Visual acceptance method and divergence register

**Reference:** the V10 HTML at SHA `6e47ffca…`, rendered by a pinned local harness:
- React 18.3.1, ReactDOM 18.3.1 and Babel 7.29.0 served locally, with no CDN;
- the same self-hosted fonts as the candidate;
- identical fixture content (Journal notes, and the §6 projects) supplied to both.

**Captures:**
- at 1440×900 and 390×844;
- Entry and every panel;
- Still-mode captures;
- Full-mode frame captures at fixed timestamps.

**Comparison:**
- a per-pixel diff with a documented threshold, plus side-by-side output;
- every residual difference is recorded in the **Divergence Register** with a reason and Paulo's approval;
- "same vibe", "inspired by" or "close direction" is not acceptable evidence.

**Pre-approved divergences (D-088)** that must appear in the register:
- **D1: accessible compact/mobile navigation.** It replaces V10's clipped narrow-screen nav, so every destination is reachable at 390px with targets of at least 44px, Escape/close focus handling, and no clipping.
- **D2: narrow-width Systems label collision fix.** Diagram node captions must not overlap at 390px.

**Content divergences** that follow from §6 (C1–C3), and real Journal data in place of placeholders, are recorded in the register as content-driven differences.

## 10. Non-goals

This RFC authorizes none of the following:
- V10-A or V10-B implementation;
- application, admin, Worker, runtime, migration, package, public-asset or media changes;
- API-DIAG or any API fix;
- D1/R2/Access/DNS/domain/secret/environment mutation;
- main merge, deployment, promotion or rollback;
- publishing a theme revision;
- PR #7/#10 merge;
- V2B, S6/S7 or D-068 work.

API-DIAG stays a separate, unauthorized track.

## 11. Alternatives considered

- **Amend RFC-010 in place:** rejected, because accepted RFCs are immutable.
- **Treat V10 as within RFC-010:** rejected, because it silently reinterprets S1–S7.
- **Versioned V10 settings in D1:** rejected, because it adds schema without need, and the baseline must not depend on D1.
- **Tighten the server ranges with a migration:** rejected for now. Runtime clamping meets AS-117 with no schema change; a later server tightening is possible under its own decision.
- **Embed the V10 `dc` runtime:** rejected, because of the CDN, Babel and runtime-eval violations of P7 and P8.

## 12. Risks

| Risk | Level | Mitigation |
|---|---|---|
| Visual drift presented as parity | high | the §9 diff and register |
| Stored legacy values presenting off-canonical | medium | §7.2 and the §7.4 remedy |
| Page weight from the V10 media | medium | R3 derivatives with a byte budget |
| Content drift from placeholder copy | high | C2 |
| Coupling with the open API incident | medium | F1/F2; API-FIX tracked separately |

## 13. Evidence requirements for future V10 implementation acceptance

Every V10 implementation acceptance packet must include:
1. exact base/result SHAs and changed files, with none under `worker/**`, `migrations/**`, `wrangler.jsonc` or `package*.json` unless separately authorized;
2. tests proving P1–P12 unchanged (existing suites green);
3. **§7.2 tests** with stale-stored and direct API-shaped values at and beyond the boundaries:
   - `panelOpacityPct` values 55, 79, 80, 90, 91, `"x"`, missing → effective 80/80/80/90/90/90/90;
   - `borderIntensityPct` values 9, 10, 25, 26, 45, `"x"`, missing → 10/10/25/25/25/16/16;
4. §7.1 tests showing each ignored field with every allowed and unknown value produces no visual change;
5. F1 tests: `/api/design` 404, 500, malformed and invalid payloads all render the default V10 exactly;
6. F3 routing tests for `#journal`, `#research`, `#process`, `#about` and unknown hashes, and for new links using `#journal`;
7. C1–C3 content tests: eight unique projects with ClinicFlow once, and the exact contact email;
8. an R2 network assertion showing no remote font/script/asset requests, and that `out/` contains no `support.js`, Babel or CDN React;
9. an R3 asset manifest with source hashes;
10. the §9 parity evidence with the Divergence Register, including D1 and D2;
11. accessibility evidence: keyboard, focus, reduced-motion Still, a contrast measurement, and an automated audit with zero serious or critical findings;
12. full `npm test`, `npm run build`, and `git diff --check`.

Builder evidence is `ACTOR_REPORTED` until it is independently reproduced.

## 14. Acceptance

This RFC becomes `ACCEPTED` only after:
- an independent Architect review;
- a separate Paulo acceptance decision.

V10-A and V10-B implementation each require their own owner authorization after acceptance.
