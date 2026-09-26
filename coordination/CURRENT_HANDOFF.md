# Current Handoff — MaisogLabs V10-A Remediation Cycle 1 (D-091 / AS-119)

```yaml
schema_version: 1
handoff_id: H-WEB-V10-A-REM1-0001
cycle_id: MAISOGLABS_WEB_V10_A
input_base_commit: 114d97905352b9a9424811c6905e59ef620c712c
review_target_commit: 114d97905352b9a9424811c6905e59ef620c712c
applicable_review_id: ML-DEVOS-AS-119
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve, and every result here is `ACTOR_REPORTED`.

## Objective

Remediation cycle 1 under `DIR-WEB-V10-A-REM1-0001` (D-091): close AS119-F001 and AS119-F003, add the AS119-F004 deterministic tests, and produce the AS119-F002 / RFC-021 §13 evidence matrix. Return exact results, including failures.

**Input/output SHAs:**
- base `114d97905352b9a9424811c6905e59ef620c712c` (the D-091 directive issue; its parent is `3a4b75901032e4b3bdc798dd07572cdc692bb443`);
- result: the commit publishing this handoff;
- main `aebc881e8890c00090d714602591138a045bd3b0` (unchanged; checked with `git ls-remote` before work).

**Summary:**
- **Corrections done:** F001 and F003.
- **Tests:** the F004 tests are added. Full `npm test` is green on Linux (936/936).
- **Evidence:** the F002 matrix is complete.
- **Still failing:** V10 pixel parity (0/20 views within threshold) and 2 serious axe `color-contrast` findings. Both are unresolved. Fixing either needs edits outside D-091's corrective scope, so per directive instruction 6 they are recorded, not repaired.

## Changed files

**Application (allowed surfaces only):**
- `app/globals.css`: the former `app/v10.css` rules, byte-for-byte after its two-line header, appended last under a new header comment. This keeps the cascade order the import produced. The now-dead `.research-thumb` rule is removed. SHA-256 `e3727a08…c327`.
- `app/layout.js`: removed only `import "./v10.css";`. SHA-256 `0ff78201…63d9`.
- `app/v10.css`: deleted. Its blob at base had SHA-256 `752b3700…9987`.
- `components/site/ResearchSurface.js`: removed `FIXED_NOTE_PLATES` and the per-entry `research-thumb` span. The now-unused `itemIndex` map argument is removed. No replacement media, route or fetch. SHA-256 `ff19eb3d…67bc`.

**Tests:**
- `tests/v10-runtime-matrix.test.mjs` (new, 10 tests; SHA-256 `b356fd9f…c67d`).

**Docs and evidence:**
- `docs/product/V10_IMPLEMENTATION_CONTRACT.md`: one sentence naming the new test file.
- `docs/product/V10_DIVERGENCE_REGISTER.md`: added "Residual differences observed in remediation cycle 1 (not approved)", R1–R6.
- `docs/product/evidence/v10/README.md`: added the remediation cycle 1 method and results.
- `docs/product/evidence/v10/rem1/**` (new; 63 files, about 20 MB):
  - `captures/` (20 candidate PNGs and 20 reference PNGs);
  - `compare/` (20 side-by-side/diff JPEGs);
  - `results.json` (SHA-256 `67ea1dc3…82ce`);
  - `harness/rem1-evidence.mjs` (SHA-256 `fbc774af…8a9f35`);
  - `SHA256SUMS` (SHA-256 `fe1d0736…03d2`), listing every other file.

**Coordination:**
- `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`.
- `coordination/archive/directives/DIR-WEB-V10-A-REM1-0001.{md,provenance.json}` and the index row (blob `fd1e7c1ddd28d97270874a057a7dbcf3f6225088`; bytes compared identical to `114d979:coordination/CURRENT_DIRECTIVE.md`).

**Untouched:** nothing in `worker/`, `migrations/`, `wrangler.jsonc`, `package*.json`, `lib/`, `data/`, `public/`, other components, README/ARCHITECTURE or workflows. No D1/R2/Access/DNS/secret/environment/production action, no API diagnosis, no theme publication, and no merge, deploy, promotion or rollback.

## Finding closure map

| Finding | Action | Evidence |
|---|---|---|
| AS119-F001 | CSS consolidated into `app/globals.css`; import removed; `app/v10.css` deleted | Test "V10 rules live in app/globals.css"; pixel comparison of the pre- vs post-remediation build at tolerance 0: 16/20 views identical, and the 4 Research views differ only where the thumbnails were. Minified CSS bundle 48,571 → 43,025 bytes (the minifier merges the now-single file). |
| AS119-F003 | Fixed plate thumbnails removed; no backend/media path added | Test "Research surface ships no fixed Journal-entry imagery"; `rem1/compare/*-journal.jpg` |
| AS119-F004 | New deterministic tests | The F1 matrix (404, 400/401/403/502/503, 500, malformed JSON, network failure, never-settling request → nothing applied; 11 invalid payload shapes → exactly the default V10 state, which the test ties to the static CSS fallbacks); §7.2 panel 55/79/80/90/91/"x"/missing → 80/80/80/90/90/90/90 and border 9/10/25/26/45/"x"/missing → 10/10/25/25/25/16/16, both through `normalizeV10Theme` and through the runtime; §7.1 all 8 ignored fields × every allowed value from `worker/d1/validate.mjs` plus `"unknown-value"`, `""`, `7`, `null`; overlay strictly monotonic at every integer 40→85 and applied correctly by the runtime at each. Mutation spot-checks: removing the non-2xx guard fails the F1 test; widening the opacity clamp to 55 fails the §7.2 test (both reverted). |
| AS119-F002 | Evidence matrix produced | `docs/product/evidence/v10/README.md` "Remediation cycle 1 evidence" and `rem1/` |

`DesignRuntime.js` is tested by evaluating its unmodified source with injected imports, a synchronous `useEffect` and a fake `<html>` root. This is the same slice-evaluation idiom `tests/spatial-design-controls-v2.test.mjs` uses. It is not a real DOM render; the in-browser F1 captures cover that.

## Tests and evidence

- `node --test` focused V10/design/routing set (`v10-runtime-matrix`, `v10-theme`, `v10-baseline`, `design-overlay`, `website-redesign`, `worker-public-design`, `spatial-design-controls-v2`): **58/58 PASS**.
- Content and D1 compatibility (`content`, `d1-migration`, `d1-audit`): **63/63 PASS**.
- Full `npm test` (Linux, Node v22.22.2): **936/936 PASS, exit 0**. The AS-119 Windows-host failures (S6 isolation, empty-environment git fixtures, skill frontmatter) did not reproduce here. No unrelated file was changed.
- `npm run build`: **PASS**; static `/`, `/_not-found`, `/admin`, `/journal`.
- `git diff --check`: clean. `sha256sum -c SHA256SUMS` in `rem1/`: OK.
- **Browser evidence** (Playwright 1.56.1, Chromium; method in the evidence README):
  - parity: **FAIL 0/20** at a 1.0% threshold with channel tolerance 32. Mismatch ranges 3.4%–26.9%.
  - repeatability: 20/20 candidate re-captures pixel-identical.
  - F1 in browser: **28/28** pixel-identical to the no-API baseline.
  - axe: **2 serious** (Contact `.contact-legal`, 4.3:1 vs 4.5:1, both viewports), 0 critical. Plus unreviewed `incomplete` items: `color-contrast` over imagery on every view, and one `aria-prohibited-attr` on Projects.
  - contrast (Systems): 8.37:1 to 19.02:1.
  - keyboard/Escape/focus: PASS.
  - D1 and D2: PASS.
  - F3 routing: PASS.
  - runtime network: **PASS**, 0 external requests, no forbidden runtime strings in `out/`.

## Unresolved findings and limitations

1. **V10 parity not achieved (blocks RFC-021 §9 acceptance).** All 20 views exceed the threshold. The residual differences are structural, not only content-driven. They are recorded as R1–R6 in the divergence register (OPEN, not approved), covering:
   - Entry lockup position and scale;
   - the Systems heading, list, diagram and detail tables;
   - the Projects list and detail with the "How it works" flow;
   - the Research filters and cards;
   - the two-column Contact layout;
   - the panel header treatment.

   Closing them needs changes to `components/site/{EntryStage,SystemsSurface,ProjectsSurface,ContactSurface,SpatialShell}.js` and `data/site.js`, which are outside D-091. Owner options: authorize a further bounded implementation cycle, approve some or all of R1–R6 as divergences, or both.
2. **Serious contrast finding.** `.contact-legal` (`rgba(174,184,200,.62)`, defined in `app/globals.css` since Website Redesign V1 `c93d7de`, not introduced by V10-A) measures 4.3:1. Proposed patch, not applied: raise its alpha to at least 0.7 (or use `var(--muted)`). The rule is in an allowed file, but changing it is not one of D-091's listed corrections.
3. **axe `incomplete` items** (text over the plate/gradients, and one `aria-prohibited-attr` on Projects) need manual review. They were not triaged.
4. **Reference-harness limits.** V10 hardcodes its own content, so identical fixture content could not be supplied to both sides without modifying the reference. Content differences are part of the measured mismatch. Fonts on both sides are the same self-hosted files.
5. `public/v10/assets/plate-aqueduct-v4.png` is no longer referenced by the runtime but stays in `public/` and the asset manifest (`public/` is outside D-091).
6. `results.json` was produced by the harness before its only later edit: replacing a hardcoded scratch path with the `V10_UMD_DIR` variable. Measurement logic is unchanged.
7. **Carried forward:**
   - the AS-116 production API incident remains open;
   - README/ARCHITECTURE staleness is excluded;
   - S6 stays parked at ML-DEVOS-AS-103, and O1 and O2 stay open;
   - D-068 held; PR #7 and PR #10 unmerged.

## Evidence locations

- `docs/product/evidence/v10/README.md` ("Remediation cycle 1 evidence").
- `docs/product/evidence/v10/rem1/{captures,compare,results.json,SHA256SUMS,harness/}`.
- `docs/product/V10_DIVERGENCE_REGISTER.md` (R1–R6).
- `tests/v10-runtime-matrix.test.mjs`.
- `coordination/archive/directives/DIR-WEB-V10-A-REM1-0001.md`.

## Governing references

- **Authority:** D-091 (with D-090 and accepted ML-DEVOS-RFC-021).
- **Directive:** DIR-WEB-V10-A-REM1-0001 (archived).
- **Review:** ML-DEVOS-AS-119 (AS119-F001–F004).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect independently re-reviews under the next unused immutable Architect Sync ID after ML-DEVOS-AS-119. `CURRENT_REMEDIATION_CYCLE` stays at 1 of 2.

Parity (limitation 1) and contrast (limitation 2) likely need a Paulo scope decision before V10-A can be accepted. V10-B, API work, main merge and deployment remain separate.
