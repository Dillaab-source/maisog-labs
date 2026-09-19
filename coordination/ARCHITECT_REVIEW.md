# Architect Review

Status: `ARCHITECT_APPROVED — WEB-INC-007 ACCEPTED / CORE WEB ROADMAP COMPLETE`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-033 — WEB-INC-007 Final Review

Authority chain:
- `ML-DEVOS-RFC-010`
- `ML-DEVOS-AS-030`
- `D-032`
- `ML-DEVOS-AS-031`
- `D-033`
- `ML-DEVOS-AS-032`

Initial implementation:
- `17577838d1007210cd1893fdb71ea8063d764fa8`

Remediation implementation:
- `9773d76641bef0b9f57b94d78087438f4d2ffc15`

Remediation handoff/state:
- `9623a5ea0316db90dd4e8f06058c9da3e6009468`

## Independent final review

The Architect independently inspected:

- the remediation diff boundary;
- `app/DesignRuntime.js`;
- `app/admin/DesignControls.js`;
- `app/globals.css`;
- `lib/design/overlay.mjs`;
- `tests/design-overlay.test.mjs`;
- the unchanged published-only design API;
- the protected preview architecture established in the prior review.

Builder runtime/test/visual/CLI evidence remains `ACTOR_REPORTED`.

## Findings

### AS33-F001 — PASS — remediation scope is exact

The remediation implementation changes exactly five files:

- `app/DesignRuntime.js`;
- `app/admin/DesignControls.js`;
- `app/globals.css`;
- `lib/design/overlay.mjs`;
- `tests/design-overlay.test.mjs`.

The following bookkeeping commit changes only coordination handoff/state.

No schema, Worker route, migration, auth, D1 mutation module, or public API module was changed.

### AS33-F002 — PASS — AS32-B001 visual draft preview is resolved

The admin now exposes explicit:

- `Open Homepage Preview`;
- `Open Journal Preview`.

Those links open the real static pages with:

`?design-preview=1`.

In preview mode, `DesignRuntime` first requests the existing protected:

`GET /admin/api/design/preview`

and applies that draft-if-present state through the same fixed `applyTheme` / `applySections` mappings used by the published design runtime.

No new public draft API was added.

### AS33-F003 — PASS — unauthenticated preview fails safely

If the protected preview fetch fails, including Access rejection, `DesignRuntime` falls back to:

`GET /api/design`

which remains the published-only public design projection.

Therefore possession of a preview URL alone does not expose draft data.

### AS33-F004 — PASS — preview remains structurally bounded

Preview uses the exact same:

- fixed enum vocabularies;
- bounded numeric mappings;
- fixed four-section selectors

as published design application.

It does not add:

- arbitrary CSS;
- arbitrary HTML;
- arbitrary JS;
- dynamic style text;
- arbitrary selector/URL behavior;
- new design vocabulary.

The screenshot-reference workflow can therefore visually compare a real draft without bypassing governance.

### AS33-F005 — PASS — public design API remains unchanged/published-only

The remediation does not modify:

`worker/public/design.mjs`

or its routing.

Public `GET /api/design` remains published-pointer-only.

Theme and section draft state are still unavailable through the public design API.

### AS33-F006 — PASS — AS32-B002 full overlay range is resolved

The previous saturated mapping has been replaced with a two-layer bounded mapping.

For values `40..68`:

- base overlay opacity scales from `40/68` to `1`;
- boost remains `0`.

For values `68..85`:

- base overlay opacity stays exactly `1`;
- independent darkening boost scales from `0` to `1`.

At exactly `68`:

`{ opacity: 1, boost: 0 }`

preserves the accepted baseline.

The upper range no longer depends on an opacity value above 1 and therefore no longer saturates into a no-op.

### AS33-F007 — PASS — the mapping is directly testable

`lib/design/overlay.mjs` isolates the overlay mapping as a pure function.

`tests/design-overlay.test.mjs` directly covers:

- minimum 40;
- baseline 68;
- maximum 85;
- monotonic upper-range boost;
- no boost at/below baseline;
- invalid/out-of-range handling.

The source-level mapping supports the Builder's visual claim that 40 < 68 < 85 in darkening effect.

### AS33-F008 — PASS — reduced-motion and design security boundaries remain unchanged

The remediation adds no motion capability and does not weaken the existing `prefers-reduced-motion` path.

No free-form design input, dynamic code execution, remote design asset, or arbitrary style injection is introduced.

### AS33-F009 — PASS — static architecture remains intact

Preview mode is client-side on existing static pages.

No SSR conversion, D1 import into `app/`, or server-rendered draft path was introduced.

### AS33-F010 — ACCEPTED ACTOR_REPORTED evidence

Claude reports:

- `tests/design-overlay.test.mjs`: 7/7;
- full suite: `338/338`;
- `npm run build`: success;
- all routes remain static;
- fresh local migrations still produce exactly 22 product tables;
- visual draft preview of unpublished theme state;
- visual draft preview of unpublished section visibility;
- signed-out preview fallback to published/baseline;
- real local overlay screenshots at 40, 68, and 85;
- no remote D1/R2;
- no deployment;
- no main merge.

These remain `ACTOR_REPORTED`.

Independent source/diff inspection is sufficient for final local/repository acceptance under CORE-020.

## Final verdict

`ML-DEVOS-AS-033: ARCHITECT_APPROVED — WEB-INC-007 THEME / DESIGN CONTROLS ACCEPTED`

Both AS32 blockers are closed.

The screenshot-reference workflow is now supported at repository/local level:

`REFERENCE → ARCHITECT ANALYSIS → CONTROL MAPPING → DRAFT → VISUAL PREVIEW → PAULO REVIEW → PUBLISH`

## Core roadmap consequence

All eight dependency-ordered core WEB increments are now architecturally accepted at repository/local level:

1. WEB-INC-001
2. WEB-INC-005
3. WEB-INC-002
4. WEB-INC-008
5. WEB-INC-003
6. WEB-INC-004
7. WEB-INC-006
8. WEB-INC-007

This means the current **core WEB build roadmap is complete**.

It does **not** mean:

- production deployed;
- remote D1/R2 provisioned;
- production Access verified;
- protected/main merged;
- homepage/projects cut over to D1;
- public media object serving enabled.

Those remain separate future decisions.

## Post-acceptance requirement

Because WEB-INC-007 is `ARCHITECTURE`, record the final ADR and durable Architect Sync archive before cycle closure.
