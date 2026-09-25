# Current Handoff — Website Redesign V1 Implementation (D-076, AS-104)

```yaml
schema_version: 1
handoff_id: H-WEB-REDESIGN-V1-IMPL-0001
cycle_id: MAISOGLABS_WEBSITE_REDESIGN_V1_IMPLEMENTATION
input_base_commit: 0f3ad64e590d3c68acc21eb139b0316aa9c8a869
review_target_commit: 0f3ad64e590d3c68acc21eb139b0316aa9c8a869
applicable_review_id: ML-DEVOS-AS-104
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result below is `ACTOR_REPORTED`.

## Objective

Implement Website Redesign V1 as one bounded frontend and public-presentation cycle under scope `D076_AS104_WEBSITE_REDESIGN_V1_IMPLEMENTATION_ONLY`. The target experience is `Entry → Systems / Projects / Research / Contact`, per `ML-DEVOS-AS-104` and `docs/product/WEBSITE_REDESIGN_V1_PLAN.md`.

Provenance:
- **Implementation and review base:** the published D-076 owner-transition commit `0f3ad64e590d3c68acc21eb139b0316aa9c8a869`. Its sole parent is `ae43ab4` (AS-104).
- **Implementation tip:** the commit that publishes this handoff. Its sole parent is the base. Implementation, evidence, this handoff and the STATE return gate are one commit.
- **Bootstrap:** a fresh Context Bootstrap from `0f3ad64`, with reads in the D-076 order.
- **D-068:** the suspended local draft was not touched, staged, committed or imported.

## What was built

- **Spatial shell** (`components/site/SpatialShell.js`):
  - one persistent environment;
  - Entry (no hash) plus four bounded work surfaces at `#systems`, `#projects`, `#research` and `#contact`;
  - route triggers are plain hash links, so browser Back and Forward work natively;
  - Escape and the wordmark return to Entry;
  - focus moves to the opened surface's heading and returns to the closed route's trigger (the `MENU` control on narrow screens);
  - unknown hashes stay on Entry; legacy `#process` and `#about` resolve to Systems and Contact.
- **Entry:**
  - the canonical primary lockup SVG, including `IDEAS INTO SYSTEMS.`;
  - the approved first-visit sentence, verbatim;
  - the four destinations, each with a one-line explanation;
  - restrained location metadata.
- **Header:** the compact canonical icon and `MAISOG LABS` wordmark, plus explicit route words on desktop. At 760px and below this becomes one `MENU` control that opens a vertical four-destination list with targets of at least 44px.
- **Systems** (`SystemsSurface.js`):
  - AI, Automation, Research, Security, Systems and Architecture, as an `aria-pressed` button group with Arrow, Home and End selection;
  - an `aria-hidden` informational orbit diagram, with the same information in text: explanation, connected disciplines and related projects;
  - relationships come only from `components/site/routes.mjs` `disciplineGraph`. A project relates to a discipline only when its published category or a stack tag exactly names one of the discipline's terms, and two disciplines connect only through a project related to both;
  - Architecture has no relationship and says so.
- **Projects** (`ProjectsSurface.js`):
  - a typography-led selector over the published, featured repository projects;
  - it shows category, title, summary and stack only;
  - there is no status, URL or flow figure, because the approved content has none (plan §7 and §20).
- **Research** (`ResearchSurface.js`):
  - uses only the existing `GET /api/journal` and `GET /api/journal/:slug`, fetched when the surface is first opened;
  - explicit loading, empty and error (with retry) states;
  - the API's own newest-first order;
  - the body is rendered as plain text;
  - links to `/journal?slug=` and `/journal`. The existing `/journal` page is unchanged;
  - there are no fallback articles.
- **Contact** (`ContactSurface.js`):
  - `Humanity orbits higher.`;
  - the existing `contact.callToAction`;
  - the existing `about.title` as the short identity statement;
  - the repository address `hello@maisoglabs.com` as a `mailto:` link, plus Copy address with a status message and a fallback;
  - the restrained legal line.
- **Motion** (plan §15):
  - `data-motion` resolves to calm, minimal or off from `prefers-reduced-motion` and the published `animationPreset` / `reducedMotionMode` (`routes.mjs` `motionMode`);
  - calm has a slow trajectory drift, a gentle mark float, the `surface-in` transition and very low pointer parallax, driven by one rAF per frame and only on hover-capable fine pointers;
  - minimal keeps only an opacity-only surface fade;
  - off has no motion;
  - ambient animation and parallax stop, with the listener removed and the frame cancelled, whenever a surface is open or the document is hidden.
- **WEB-INC-007** (`app/DesignRuntime.js`):
  - the same fixed `MANAGED_SECTION_IDS` now mark every element presenting that section: `home` → Entry content, `projects` → Projects, `process` → Systems, `about` → Contact. Research is unmanaged;
  - visibility hides every trigger and the surface;
  - published order only permutes the three managed route triggers among their default slots 1, 2 and 4 (`managedTriggerSlots`); Research stays at slot 3, and surfaces never get an order;
  - after applying, the runtime dispatches a data-free `maisog:design-applied` event so the shell re-checks its route (a hidden route fails safe to Entry) and its motion mode;
  - there is still one selector, built only from the fixed list, and no new control, CSS string, HTML, selector or URL input.
- **Content** (`data/site.js`, `lib/content/schema.mjs`):
  - the spatial copy is a **separate local-static document**, `spatialContent`, validated fail-closed by the new `validateSpatialContent`. The shared structural walker was extracted unchanged;
  - it is deliberately **not** part of `siteContent`. An earlier attempt added it to `siteContent`, and the existing D1 migration/parity tests correctly failed (7 tests), because D1 mirrors that document. Storing the copy there would need a D1 schema change, which D-076 forbids. The legacy document, `validateContent` behaviour and D1 parity are unchanged;
  - discipline text restates already-published copy, and a test enforces this.
- **Styles** (`app/globals.css`):
  - the dead long-scroll homepage rules (hero, dock, rail, process, about, footer) were removed;
  - the `/journal` header and section rules were kept;
  - the WEB-INC-007 preset blocks were retargeted at the spatial surfaces, using the same fixed vocabulary;
  - there is no new font family, colour token or radius scale.
- **Brand and UX docs:**
  - `brand/V3/DESIGN_MAP.md` now names the AS-104 spatial composition as active and keeps the V3.1 Earth-left / architecture-right map as **superseded (provenance only)**;
  - `brand/V3/ASSET_MAP.json`, `brand/V3/guidelines/V3_DIRECTION.md` and `docs/product/UI_UX_SPEC.md` were updated to match;
  - the identity is still V3.

## Changed files

Diff against `0f3ad64e590d3c68acc21eb139b0316aa9c8a869`:
- **App:**
  - `app/page.js`, `app/globals.css`, `app/DesignRuntime.js`;
  - `components/site/`: `SpatialShell.js`, `SystemsSurface.js`, `ProjectsSurface.js`, `ResearchSurface.js`, `ContactSurface.js`, `useListKeys.js`, `routes.mjs`.
- **Content:** `data/site.js` (the added `spatialContent` export only), `lib/content/schema.mjs`.
- **Tests:** `tests/website-redesign.test.mjs` (new).
- **Docs:** `brand/V3/DESIGN_MAP.md`, `brand/V3/ASSET_MAP.json`, `brand/V3/guidelines/V3_DIRECTION.md`, `docs/product/UI_UX_SPEC.md`.
- **Evidence:** `docs/product/evidence/website-redesign-v1/`, containing `README.md`, `interaction-motion-results.json`, `capture-harness.mjs` and 11 JPEG screenshots.
- **Coordination:** `coordination/CURRENT_HANDOFF.md` (this file) and `coordination/STATE.md` (header routing fields only). The outgoing `H-S6-CORE-HARDEN-REM1-0001` was already archived by the AS-103 transition.

Not changed:
- `components/Logo.js`, `lib/content/local.mjs`, `lib/content/public.mjs`, any `worker/**` file, any migration, `wrangler.jsonc`, `package.json` / lockfile, the plan, `ARCHITECT_REVIEW.md`, S6/S7 and D-068;
- no public media was added, because of the MEDIA_GAP;
- no new dependency was added.

## Tests and evidence

| Check | Result | Exit |
|---|---|---|
| `npm test` (whole repository) | 862 tests, 862 pass, 0 fail (base 852, plus 10 in `website-redesign`) | 0 |
| Focused `tests/website-redesign.test.mjs` | 10/10 | 0 |
| `npm run build` (static export: `/`, `/journal`, `/admin`, `/_not-found`) | compiled, 5/5 pages | 0 |
| `git diff --check` | clean | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | all examples as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | all bridges OK | 0 |
| `validate-traceability.mjs` | 2 errors (`CORE-022`, `WEB-REQ-009`, known debt) and 14 warnings. The ERROR/WARNING set is **identical to the base** `0f3ad64`. `DRIFT` was already present at the base (from the D-076 transition). The index was **not** regenerated because `devos/governance/traceability/**` is outside the D-076 authorized paths | 1 |
| Browser harness (`capture-harness.mjs` against the built `out/`) | **72/72** checks pass | 0 |
| `check-context-bootstrap --check-only` on this candidate | exit 0 (recorded at publication) | 0 |

Platform: Linux x86_64, Node v22.22.2, Chromium 141.0.7390.37, Playwright 1.56.1 (environment-global; not a repository dependency).

### Visual evidence

`docs/product/evidence/website-redesign-v1/screenshots/`:
- **Desktop 1440×900:** Entry, Systems, Projects, Research, Contact.
- **Mobile 390×844 (DPR 2):** Entry, Menu, Systems, Projects, Research, Contact.

All screenshots are of the actual local build; none is a reference or mockup image. The Research screenshots show **labelled local fixture** Journal entries ("[Local fixture] …"). The harness intercepted `/api/journal` because the live API was not reachable (proxy 403) and a static export has no Worker. These are not content.

### Interaction matrix (all pass)

- **Direct hash:** `#projects` opens Projects and focuses its heading. `#nonsense` stays on Entry. `#process` resolves to `#systems`.
- **Entry return:** the wordmark returns to Entry and clears the hash.
- **Escape:** returns to Entry.
- **Back / Forward:** Back goes projects → systems → Entry; Forward goes Entry → systems.
- **Route keyboard navigation:** Tab order is skip link, wordmark, Systems, Projects, Research, Contact. Enter opens a route and moves focus into it.
- **Systems keyboard:** ArrowDown and End work; Architecture shows its explicit "no published project" text.
- **Projects keyboard:** ArrowRight and Home work.
- **Focus:** focus moves into the opened surface; on close it returns to the header trigger on desktop and to `MENU` on mobile.
- **Mobile menu:** Escape closes the menu and restores focus; widening past the breakpoint closes it.
- **Hidden managed route:** `process` hidden hides all three Systems triggers and the surface, and `#systems` then fails safe to Entry with the hash cleared. Published order `about(2) < process(5) < projects(9)` gives visible order Contact, Research, Projects. Surfaces receive no order.
- **Copy address:** copies `hello@maisoglabs.com`, and the status reads "Address copied.".
- **Journal states:** loading, empty, error (retry succeeds), and success (API order, plain-text body with no HTML interpretation, correct `/journal?slug=` link).
- **Overflow:** no horizontal overflow on any desktop or mobile surface.
- **Errors:** no page or console errors.
- **Regression:** `/journal` still lists entries.

### Motion matrix (31/31 pass)

The modes tested were calm, WEB-INC-007 `minimal`, `off`, `always-reduced`, and `prefers-reduced-motion`. For each mode, the harness checked:
- the resolved `data-motion` value;
- whether Entry ambient animation is running;
- whether parallax is on or off;
- the expected surface transition;
- that an open surface stops ambient motion and parallax;
- that a hidden document stops ambient motion and parallax;
- that motion resumes on a visible Entry (calm only);
- that no `<video>` element ships.

**Hidden-document behaviour was simulated** by overriding `document.visibilityState` and dispatching `visibilitychange`, because headless Chromium does not change page visibility.

### Content-integrity result

- Entry uses the approved D-076 sentence verbatim.
- Contact uses the repository address (`hello@maisoglabs.com`). No prototype address appears.
- Projects shows only published repository fields. No status, metric, URL or flow is invented.
- Research uses only the Journal API. No article or date is hardcoded; a test scans `components/site/**` for emails, external URLs, ISO dates and HTML/eval injection surfaces.
- Systems relationships are mechanically derived from published project names, and a test proves each edge is justified. Discipline copy restates published copy, which a test also checks.
- `Humanity orbits higher.` is the plan §9 approved concept.

## MEDIA_GAP

The D-076-approved `plate-hero-v4.png`, `logo-mark.mp4` and the logo-mark poster were **not available** in this session. The Claude v10 reference files were not available either; the only design artifact in the account is an unrelated earlier light-theme concept, which was not used.

Per D-076, nothing was generated or reinterpreted:
- Entry uses the existing canonical static background `public/images/maisog-v4-cosmic-background.webp`. Its imagery predates AS-104 and is not the approved `plate-hero-v4` composition.
- Entry and the header use the canonical SVGs.
- No motion mark ships. Media pause behind surfaces or on a hidden page is therefore not applicable yet, and `ASSET_MAP.json` records both media as `MEDIA_GAP`.

The implementation was built from the controlling AS-104 plan text, not from the v10 visuals.

## Unresolved findings and limitations

1. **Visual fidelity to v10 is unverified.** It is not compared against the v10 reference, which was unavailable. The fallback plate shows the earlier V4 hand/robot imagery.
2. **Spatial copy is local static only.** It is not in the D1 content model and not admin-editable, by design, because no D1 change is authorized.
3. **Reordered triggers keep DOM order.** When WEB-INC-007 reorders managed triggers, their visual order changes but keyboard Tab order stays in DOM order.
4. **No no-JS route fallback.** Without JavaScript, only Entry is usable, although the surfaces' content is present in the static HTML.
5. **Leftover code and content from the old homepage:**
   - `components/ProjectRail.js` and `components/BlueprintIcon.js` are now unused. They are outside the authorized paths, so they were not deleted;
   - `/journal` still uses the older `Logo.js` signature lockup, which was left unchanged;
   - legacy `siteContent` fields (`navigation`, `hero`, `foundations`, `process.steps`, `services`) stay validated and D1-mirrored but are no longer rendered on `/`.
6. **Header icon legibility is marginal.** The canonical icon SVG's thin ivory orbit is faint at header size. It was enlarged but not altered.
7. **No automated accessibility audit.** No axe or Lighthouse audit was run, and no accessibility certification is claimed.
8. **Evidence limits:** all browser evidence is Chromium-only headless evidence, and Journal states come from fixtures.
9. **Traceability index not regenerated.** Base `DRIFT` persists because the index is outside the authorized paths.

## Carry-forward, not changed

- S6 remains parked at `ML-DEVOS-AS-103`.
- O1, O2 and the execution-driver boundary are unchanged.
- Every `coordination/OPERATIVE_OBLIGATIONS.md` row is carried forward, none closed.
- `DEPLOY_AUTHORIZED`, `REMOTE_D1_AUTHORIZED`, `REMOTE_R2_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` remain `NO`.
- No deploy, publish, remote D1/R2 or `main` / PR #10 action was taken.

## Evidence locations

- The commit diff against `0f3ad64e590d3c68acc21eb139b0316aa9c8a869`.
- `docs/product/evidence/website-redesign-v1/`: `README.md` (method and fixture disclosure), `interaction-motion-results.json` (all 72 checks with details), `capture-harness.mjs` (re-runnable), and `screenshots/` (desktop and mobile).
- `tests/website-redesign.test.mjs`; the unchanged `tests/content.test.mjs` and `tests/d1-migration.test.mjs` (D1 parity).
- Source: `components/site/**`, `app/page.js`, `app/DesignRuntime.js` `applySections`, `app/globals.css` (the spatial layer and the retargeted WEB-INC-007 blocks).

## Governing references

- **Authority:** `D-076`; `D-075` (planning, complete).
- **Review:** `ML-DEVOS-AS-104`.
- **Plan:** `docs/product/WEBSITE_REDESIGN_V1_PLAN.md`.
- **Brand:** `brand/V3/**`.
- **WEB-INC-007:** `ML-DEVOS-RFC-010`.
- **Journal:** `ML-DEVOS-RFC-009`.

## Next action

The Architect independently reviews this implementation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-104`. No further Builder action is authorized, and deployment remains a separate, unauthorized decision.
