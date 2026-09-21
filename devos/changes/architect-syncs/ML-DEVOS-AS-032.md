# ML-DEVOS-AS-032 — Durable Architect Sync Archive

Status: `CONCLUDED — CHANGES_REQUESTED / WEB-INC-007 REMEDIATION CYCLE 1`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `66d716656b2efbf045ed2228307dca346a57075b`
- file blob: `4472a58af58f2eebdc51f699128f2622401a9d2e`

## Concluding snapshot

```markdown
# Architect Review

Status: `CHANGES_REQUESTED — WEB-INC-007 REMEDIATION CYCLE 1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-032 — WEB-INC-007 Implementation Review / Remediation 1

Authority chain:
- `ML-DEVOS-RFC-010`
- `ML-DEVOS-AS-030`
- `D-032`
- `ML-DEVOS-AS-031`
- `D-033`

Implementation base:
- `ac2666860195a6e1c151ae363f7d176b61c12cde`

Builder implementation:
- `17577838d1007210cd1893fdb71ea8063d764fa8`

Builder handoff/state:
- `07a30cbcaadf793550b30ced208bd2bf34e7e021`

## Independent review performed

The Architect independently inspected:

- implementation vs bookkeeping commit separation;
- migration 0005;
- theme/section D1 mutation helpers;
- validation vocabulary/ranges;
- design admin dispatcher;
- public design API;
- Access/public route separation;
- Worker-first routing;
- DesignRuntime fixed mappings;
- DesignControls;
- homepage section wiring;
- CSS design variants;
- focused preview/test source;
- Builder handoff evidence.

Builder test/build/CLI/screenshot evidence remains `ACTOR_REPORTED`.

## Findings

### AS32-F001 — PASS — implementation/bookkeeping separation is correct

Implementation commit changes exactly 25 runtime/test/config files.

The following bookkeeping commit changes only:

- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

The apparent 27-file full compare is therefore not an evidence discrepancy.

### AS32-F002 — PASS — schema/table scope is correct

Migration 0005 adds exactly:

- `theme_settings`;
- `theme_settings_revisions`.

The local product-table target is:

`20 → 22`

Theme revision enums/ranges are constrained at DB level.

Theme revision rows reject UPDATE and DELETE.

Pointer ownership uses the established composite-FK model.

### AS32-F003 — PASS — design input is structurally bounded

Application validation and DB constraints restrict the theme to fixed enum values and bounded integers.

No arbitrary:

- CSS;
- JS;
- HTML;
- URL;
- arbitrary color string;
- selector;
- class;
- font URL;
- R2 key

is accepted through the design mutation surface.

### AS32-F004 — PASS — public design read is narrow and published-only

The new public route is exactly:

`GET /api/design`

No wildcard public design API exists.

It reads only:

- `theme_settings.published_revision_id`;
- each managed section's `published_revision_id`.

It does not read draft pointers for the public projection.

Unsupported methods reject before D1 access.

### AS32-F005 — PASS — admin/public auth separation is preserved

`/api/design` is classified before Access because it is intentionally public/read-only.

`/admin/api/design*` remains behind the existing Access boundary.

No admin mutation path is opened publicly.

### AS32-F006 — PASS — screenshot-reference controls are deterministic

The admin surface exposes fixed selects, bounded ranges, section visibility/order, Save Draft, Publish, and Preview-state retrieval.

There are no free-text CSS/HTML/JS/URL inputs.

This is compatible with Architect-generated Design Reference Plans.

### AS32-F007 — PASS — public runtime uses fixed mappings only

`app/DesignRuntime.js`:

- revalidates enum values client-side;
- bounds numeric values before applying CSS variables;
- targets only fixed `data-*` attributes;
- targets exactly four fixed section selectors;
- does not use `dangerouslySetInnerHTML`;
- does not construct arbitrary CSS;
- does not evaluate code;
- does not load remote design assets.

### AS32-F008 — PASS — section draft/public isolation is preserved

DESIGN-002/003 reuse the existing section revision model.

Public runtime receives only published section state.

Draft section mutations do not directly alter public state before publish.

### AS32-F009 — PASS — local/release authority remains closed

D1/R2 remain `remote: false`.

No deployment or main merge was performed.

The Builder's local raw-SQL seeding for visual validation is accepted as test/setup activity under local D1 simulation authority; it is not an authorized production/admin workflow and creates no direct-DB operational authority.

---

## Blockers

### AS32-B001 — BLOCKER — “Preview” is data-only, not a visual draft preview

The required screenshot-reference workflow is:

`REFERENCE → ANALYSIS → CONTROL MAPPING → DRAFT → PREVIEW → PAULO REVIEW → PUBLISH`

`docs/product/DESIGN_REFERENCE_WORKFLOW.md` specifically requires the Architect to compare the preview against:

- the reference screenshot;
- Brand V3;
- soft geometry;
- responsive behavior;
- readability/contrast;
- reduced-motion compatibility.

The current implementation cannot satisfy that operating workflow.

Current behavior:

- `GET /admin/api/design/preview` correctly returns draft-if-present design data;
- `app/admin/DesignControls.js` renders that data only as formatted JSON in a `<pre>`.

There is no authenticated visual surface that applies draft theme/section state to the actual public presentation before publish.

Therefore Paulo cannot visually review a screenshot-reference design draft before making it public.

#### Required remediation outcome

Provide an authenticated **visual draft preview** using the existing bounded design vocabulary.

A preferred low-complexity solution is:

- retain `GET /admin/api/design/preview` as the protected draft-state source;
- allow an explicit preview mode on the real static public surfaces (for example `/?design-preview=1` and `/journal?design-preview=1`);
- in preview mode, authenticated browsers fetch the protected preview endpoint and apply its returned draft-if-present state through the same fixed-mapping runtime;
- unauthenticated preview attempts must not receive draft data and must fall back safely to published/baseline presentation;
- add obvious admin controls such as “Open Homepage Preview” and “Open Journal Preview”.

An equivalent bounded implementation is acceptable if it provides a real visual preview without new public draft APIs or SSR.

Must remain true:

- `/api/design` stays published-only;
- no draft state becomes public;
- no new arbitrary CSS/JS/HTML capability;
- no source-code-per-reference bypass;
- no new remote/deploy authority.

#### Required remediation evidence

At minimum:

1. visual preview of an unpublished theme draft;
2. visual preview of unpublished section order/visibility;
3. proof public `GET /api/design` remains unchanged/published-only;
4. proof unauthenticated preview cannot retrieve draft data;
5. source inspection showing preview still uses fixed design mappings;
6. screenshot evidence showing draft visual state before publish;
7. default/public presentation remains unchanged until publish.

---

### AS32-B002 — BLOCKER — DESIGN-008 range saturates above the baseline

RFC-010 authorizes:

`overlay_intensity: 40..85`

The current runtime computes:

`--design-overlay-opacity = overlayIntensity / 68`

and CSS applies that value to the standard `opacity` property.

At the baseline value:

`68 / 68 = 1`

which correctly preserves the pre-increment baseline.

However CSS opacity clamps values above 1.

Therefore:

- 68 → 1;
- 70 → >1 → effectively 1;
- 85 → 1.25 → effectively 1.

The upper portion of the advertised control range is functionally saturated and cannot produce increasing overlay intensity.

The source comment explicitly acknowledges this clamp.

That means DESIGN-008 is validated as 40–85 but is not meaningfully implemented across that full range.

#### Required remediation outcome

Make the complete allowed range `40..85` produce a bounded, monotonic, meaningful visual effect while preserving:

- value 68 as the current V3/UI-PATCH-001 baseline;
- no arbitrary CSS input;
- fixed CSS/runtime mapping;
- fail-safe default behavior.

A valid approach may use separate bounded variables for below-baseline opacity and above-baseline darkening, or another fixed pre-authored mapping.

The Architect does not require a particular formula, but:

- 40, 68, and 85 must produce meaningfully distinct outputs;
- increasing values must not become no-ops because of CSS property clamping;
- 68 must remain visually equivalent to the accepted baseline.

#### Required remediation evidence

At minimum:

1. source-level mapping inspection;
2. boundary tests at 40, 68, 85;
3. evidence that 40 < 68 < 85 in actual visual effect;
4. screenshot comparison at the three values or equivalent deterministic visual evidence;
5. baseline 68 remains equivalent to the accepted default.

---

## Non-blocking observations

### AS32-L001 — Preview fallback semantics are acceptable

The protected preview endpoint uses:

`draft if present, otherwise published`

for both theme and sections.

This is a reasonable interpretation for partial screenshot-reference design sessions and is accepted, provided AS32-B001 adds an actual visual preview surface.

### AS32-L002 — Admin control styling is utilitarian

The authenticated control UI is deliberately plain and not V3-styled.

This is not a blocker for WEB-INC-007.

Usability/contrast should still be kept functional, but public visual styling is not required for the internal control panel.

## Remediation verdict

`ML-DEVOS-AS-032: CHANGES_REQUESTED — TWO BOUNDED PRESENTATION BLOCKERS`

Remediation Cycle 1 is limited to:

1. visual authenticated draft preview;
2. full-range overlay-intensity behavior;
3. tests/evidence directly needed for those two fixes;
4. coordination handoff/state bookkeeping.

Do not reopen:

- schema/table architecture;
- public route scope beyond what the visual preview safely needs;
- design vocabularies/ranges;
- media architecture;
- content CMS scope;
- remote resources;
- deployment;
- main merge;
- Sentinel S3+.

After remediation, return to Architect for final review.
```
