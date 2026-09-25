# Current Handoff — Spatial Design Controls V2A — Admin UX Alignment (D-082)

```yaml
schema_version: 1
handoff_id: H-SPATIAL-DESIGN-V2A-0001
cycle_id: MAISOGLABS_SPATIAL_DESIGN_CONTROLS_V2A_IMPLEMENTATION
input_base_commit: 29733fc14dc1f6203e69e4da09889a27a940c9b9
review_target_commit: 29733fc14dc1f6203e69e4da09889a27a940c9b9
applicable_review_id: ML-DEVOS-AS-111
```

This is the first real Protocol V2 Builder return. It is evidence, not authority: routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve, and every result here is `ACTOR_REPORTED`.

`applicable_review_id` names the live review (`ML-DEVOS-AS-111`), as the handoff checker requires. The V2A architecture review is `ML-DEVOS-AS-107`, which is the directive's review.

## Objective

Implement `SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT` under:
- `D-082`;
- `DIR-SPATIAL-DESIGN-V2A-0001`;
- `ML-DEVOS-AS-107` and the V2A plan.

**Base:** `29733fc14dc1f6203e69e4da09889a27a940c9b9`, the directive-issue commit, reached by a fresh `--session-protocol 2` bootstrap (exit 0).

**Result:** the commit that publishes this handoff, whose sole parent is the base. It carries:
- the implementation, the tests, the docs and the evidence;
- this handoff;
- the byte-exact directive archive;
- STATE set to `CURRENT_DIRECTIVE: NONE` and `TURN: ARCHITECT`.

The suspended D-068 local draft was not touched.

## What changed (presentation only)

`app/admin/DesignControls.js` now uses static, source-controlled metadata. Nothing is read from D1 or caller input.

- **Managed surfaces:**
  - shown in spatial order: Entry (`home`), Systems (`process`), Projects (`projects`), Contact (`about`);
  - requests still use the backend ids.
- **Entry:**
  - titled "Entry content" with Visible only, plus the text "Entry is the base spatial state, so it has no navigation order";
  - no order input;
  - its stored `order` is submitted unchanged.
- **Systems, Projects and Contact:**
  - the existing 0–20 input is relabelled "Navigation order";
  - it carries the plan §7 help text.
- **Theme:**
  - regrouped into fieldsets: Atmosphere, Surfaces, Typography, Motion, Collections;
  - relabelled per plan §9;
  - friendly option labels per plan §10, while every `<option value>` stays the raw server enum;
  - the Motion group states that the OS reduced-motion setting is always honoured;
  - the Collections group states that Journal layout does not show, hide or move Research.
- **Buttons are scope-explicit:**
  - `Save Theme Draft` / `Publish Theme`;
  - `Save <Surface> Draft` / `Publish <Surface>`.
- **Plain-language status:**
  - lifecycle labels: Published, Draft, Published + Draft, No published setting;
  - a persistent "How changes go live" note defines Draft, Preview, Publish and Deployment, including "Publish activates these design settings. It does not deploy code or publish website content."
- **Spatial Preview:**
  - six fixed shortcuts, exactly as listed in `D-082`;
  - Research is labelled "preview only; fixed destination".
- **Raw preview JSON:** moved into a collapsed "Technical preview data" `<details>`. The endpoint is unchanged.
- **Accessibility and layout:**
  - `id`/`htmlFor` labels throughout, and `role="status"` live messages;
  - an `auto-fit` grid collapses to one column on narrow screens;
  - buttons and rows wrap, and targets are at least 2.25–2.5rem;
  - raw JSON wraps, so it causes no horizontal overflow.
- **Contrast:** admin text colours inherit, because the site's global dark theme also applies to `/admin`. The first capture showed a light note box and `#555` hint text that were unreadable on the dark background. I corrected both before the final capture.

## Changed files

Diff against the base:
- `app/admin/DesignControls.js`
- `tests/spatial-design-controls-v2.test.mjs` (new, 10 tests)
- `docs/product/DESIGN_REFERENCE_WORKFLOW.md`: section-control vocabulary, Spatial Preview shortcuts, and the Publish ≠ deployment note.
- `docs/product/UI_UX_SPEC.md`: a new "Spatial Design Controls V2A — admin vocabulary" subsection.
- `docs/product/evidence/spatial-design-controls-v2a/README.md` and `screenshots/` (8 JPEGs).
- `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`.
- `coordination/archive/directives/DIR-SPATIAL-DESIGN-V2A-0001.md`, its `.provenance.json`, and the index row in `coordination/archive/directives/README.md`.

`coordination/CURRENT_DIRECTIVE.md` is left byte-identical to its archive and is inert under `CURRENT_DIRECTIVE: NONE`.

## Tests and evidence

| Command | Result | Exit |
|---|---|---|
| `node --test tests/spatial-design-controls-v2.test.mjs` | 10/10 | 0 |
| `npm test` | 919 tests, 919 pass, 0 fail (909 before + 10 new) | 0 |
| `npm run build` | compiled; static routes `/`, `/admin`, `/journal`, `/_not-found` | 0 |
| `git diff --check` | clean | 0 |
| rules / waivers / skills-bridge / capability-policy / task-contract / devos-manifest / project-registry / task-state validators | all pass | 0 each |
| `validate-traceability.mjs` | the same 2 pre-existing ERRORs as the base (`CORE-022`, `WEB-REQ-009`); one base warning (the D-082 orphan) resolved by the new doc references | 1 |
| `git diff <base> -- worker app/DesignRuntime.js components/site migrations wrangler.jsonc package.json package-lock.json` | empty | 0 |
| `check-context-bootstrap --publish --check-only --session-protocol 2` on this candidate | recorded at publication | — |

Platform: Linux x86_64, Node v22.22.2.

**Focused tests:** the suite evaluates the component's plain-JS metadata slice, which is asserted to contain no JSX, and checks it against the server's own allowlists in `worker/d1/validate.mjs`. It covers:
- **Vocabulary and scope:**
  - the exact id→label mapping, in spatial order;
  - the section-id set equals the server's;
  - Research is preview-only;
  - the theme groups cover exactly the 15 payload keys, once each.
- **Controls:**
  - Entry has no order control, and its stored order passes through;
  - the order range 0–20 matches `sectionDesignOrder`;
  - every server enum value has a friendly label, and the options submit the raw value.
- **Preview:** the six fixed same-origin preview paths.
- **Capability boundary:**
  - no arbitrary-input capability (input types limited to range, number, checkbox and button; no textarea, contenteditable, iframe, `dangerouslySetInnerHTML` or drag/drop);
  - `fetch`/`submitJson` targets limited to the four existing design endpoints plus status and preview.
- **Wording:** the Draft/Preview/Publish/Deployment definitions, the scope-explicit buttons, the lifecycle labels, and the collapsed technical disclosure.

**Browser evidence:** `docs/product/evidence/spatial-design-controls-v2a/README.md` (desktop 1440×900 and mobile 390×844, with fixture admin API responses). It records:
- only bounded native controls;
- zero unlabelled controls;
- order inputs only for Systems, Projects and Contact;
- the Entry draft submitted `order: 7` unchanged under backend id `home`;
- theme payload keys and values unchanged;
- no mobile horizontal overflow (390 = 390);
- each of the six shortcuts opening its intended surface, with the existing authenticated preview fetch.

## Unresolved findings and limitations

- **Evidence limits:**
  - The admin UI evidence uses fixture responses for `/admin/api/*`, because Access and the Worker are not available to a static export. The real authenticated preview behaviour stays with the existing, unchanged `app/DesignRuntime.js` and Worker tests.
  - No automated accessibility audit (axe/Lighthouse) was run.
- **Source-assertion tests:** the focused tests assert on source text for the JSX portion, since the repository has no JSX test runtime and no dependency was added. Rendered behaviour is covered by the browser harness, which is not committed (`AS105-F001` precedent).
- **Build output:** `npm run build` regenerated `out/`, which is untracked, as before.
- **Stale comment:** the `scripts/check-context-bootstrap.mjs` header-comment debt (AS-111, non-blocking) is unchanged.
- **Traceability:** the debt is unchanged and was not regenerated.
- **Obligations:** every `coordination/OPERATIVE_OBLIGATIONS.md` row is carried forward unchanged.
- **Not done:** V2B, Research management, new fields, deployment.

## Evidence locations

- The commit diff against `29733fc14dc1f6203e69e4da09889a27a940c9b9`.
- `tests/spatial-design-controls-v2.test.mjs`.
- `docs/product/evidence/spatial-design-controls-v2a/`.
- `coordination/archive/directives/DIR-SPATIAL-DESIGN-V2A-0001.*`.

## Governing references

- **Authority:** `D-082`.
- **Directive:** `DIR-SPATIAL-DESIGN-V2A-0001` (archived).
- **Architecture:** `ML-DEVOS-AS-107`, `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md`.
- **Protocol:** `ML-DEVOS-AS-111`, `ML-DEVOS-RFC-020`, `brain/protocols/CONTEXT_BOOTSTRAP.md` §10.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect independently reviews this V2A return under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-111`, performing its own SENTINEL sync. No deployment is authorized, and no further Builder action is authorized.
