# Current Directive — Spatial Design Controls V2A — Admin UX Alignment

```yaml
schema_version: 1
directive_id: DIR-SPATIAL-DESIGN-V2A-0001
cycle_id: MAISOGLABS_SPATIAL_DESIGN_CONTROLS_V2A_IMPLEMENTATION
issue_parent_commit: 030ba0e095cf117aeda260ce4d75745378fe032e
target_turn: CLAUDE
authority_ref: D-082
applicable_review_id: ML-DEVOS-AS-107
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of:
- live `coordination/STATE.md`;
- `D-082`;
- `ML-DEVOS-AS-107`;
- `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md`;
- this directive.

Anything outside that intersection is a stop condition. The Builder published this directive as mechanical publisher of Paulo's `D-082` authorization; there is no separate Architect-authored directive.

## Objective

Implement `SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT`. Make the existing WEB-INC-007 Design Controls admin UI speak the spatial website's language, as V2A plan §§5–15 and §§21–22 describe, without creating any new backend capability.

## Preconditions

- Fresh Protocol V2 bootstrap from the exact tip that publishes this directive.
- Live STATE reads `TURN: CLAUDE`, `IMPLEMENTER_ACTION_REQUIRED: YES`, `PROTOCOL_VERSION: 2`, `CURRENT_DIRECTIVE: ACTIVE`, and a selector bound to this header.
- The suspended D-068 local draft stays untracked and untouched.

## Governing references

- **Authority:** `D-082`.
- **Architecture review:** `ML-DEVOS-AS-107`.
- **Plan:** `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md` (§25 scope, §26 evidence).
- **Protocol:** `ML-DEVOS-AS-111` (V2 verified), `ML-DEVOS-RFC-020`, `brain/protocols/CONTEXT_BOOTSTRAP.md` §10.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Mutation is allowed only in:
- `app/admin/DesignControls.js`;
- `tests/spatial-design-controls-v2.test.mjs` (the plan's §25 name), plus other directly necessary V2-focused test files;
- `docs/product/DESIGN_REFERENCE_WORKFLOW.md` and `docs/product/UI_UX_SPEC.md`, only where directly necessary;
- the Protocol V2 return records: `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`, `coordination/archive/directives/**` and evidence files.

Everything in `D-082`'s hard-boundary list is excluded, including:
- `app/DesignRuntime.js`, `components/site/**`, `worker/**` and migrations;
- API shape, new theme fields and arbitrary-input capability;
- a new preview endpoint or iframe;
- drag/drop, V2B, S6/S7 and D-068;
- deployment and merges.

## SENTINEL Sync

Snapshot `030ba0e095cf117aeda260ce4d75745378fe032e`, taken with a fresh `--session-protocol 2` bootstrap (exit 0).

**Live state:**
- `TURN: PAULO`, `STATUS: ARCHITECT_APPROVED`;
- scope `AS111_RFC020_STAGE_B_CLOSED_PAULO_FIRST_V2_TASK_DECISION_ONLY`;
- `PROTOCOL_VERSION: 2`, `CURRENT_DIRECTIVE: NONE`, `CURRENT_HANDOFF: NONE`;
- all action flags NO.

**Checks:**
- **Authority chain:** `D-082` → `ML-DEVOS-AS-107` (the V2A plan approved as ready for Paulo) and `ML-DEVOS-AS-111` (V2 verified).
- **Obligations:** OBL-017/018 (release gating, PR #10) stay OPEN and are untouched by this admin-only scope. No obligation is closed by this directive.
- **Surface against the repository:**
  - `app/admin/DesignControls.js` holds legacy labels (`home: "Home"`, `process: "Process"`, `about: "About"`), a generic Order input for all four sections and two preview links.
  - The server allowlists (`worker/admin/design.mjs`, `worker/d1/validate.mjs`) already enumerate every enum and range V2A needs.
  - The public shell already routes `#systems`, `#projects`, `#research` and `#contact`.
  - No contradiction with the repository.
- **Protected boundaries:** Worker, D1, DesignRuntime, migrations and `components/site/**` need no change.
- **Protocol risk:** first V2 directive, and the session protocol is 2. Disposition `CLEAR`.

## SU Contradiction Check

Mode `BOUNDED_CONTRADICTION`. None of the RFC-020 §12 escalation triggers apply: no architecture/schema/protocol change, no capability widening and no external action. Disposition `CLEAR_WITH_NOTES`.

**Challenges and answers:**
- **Hidden scope expansion:** none. Labels, grouping and preview links are client-only, and submitted payload keys and values stay the exact server enums.
- **Duplicate capability:** the new preview links reuse the existing `?design-preview=1` mechanism in DesignRuntime, so no new endpoint is added.
- **Missing stop condition:** covered below.

**Notes:**
1. The admin UI runs only behind Access-protected Worker routes. Local browser evidence therefore uses fixture responses for `/admin/api/design` and is `ACTOR_REPORTED` UI evidence, not runtime evidence.
2. Tests cannot import the JSX client component under `node --test`. Focused tests assert on the source text and on the server allowlists, and must not add a build step or dependency.
3. Entry's stored `order` must pass through unchanged on save, so Entry drafts still submit the existing `order`.

## Instructions

1. Add static, source-controlled alias metadata:
   - `home`→Entry, `process`→Systems, `projects`→Projects, `about`→Contact;
   - show the rows in spatial order: Entry, Systems, Projects, Contact.
   - Keep submitting backend IDs.
2. Regroup the theme controls as plan §9 sets out: Atmosphere, Surfaces, Typography, Motion and Collections. Use the §9 labels, and semantic grouping (fieldset/legend) with associated labels.
3. Add friendly option labels for the existing enum values (plan §10). The `value` attribute must stay the server enum.
4. Entry:
   - show "Entry content" with Visible;
   - explain that Entry is the base spatial state;
   - show no order input, and preserve the stored order on save.
5. Systems, Projects and Contact:
   - relabel the bounded order input "Navigation order", with the plan §7 help text;
   - make no range change.
6. Relabel the scope-explicit buttons:
   - "Save Theme Draft" and "Publish Theme";
   - "Save <Surface> Draft" and "Publish <Surface>".
7. Lifecycle wording:
   - show lifecycle state in plain words (plan §12);
   - add the persistent Draft / Preview / Publish / Deployment explanation;
   - include the sentence: "Publish activates these design settings. It does not deploy code or publish website content."
8. Spatial Preview:
   - add the six fixed shortcuts exactly as listed in `D-082`;
   - mark Research "preview only; fixed destination".
9. Move raw preview data into a collapsed "Technical preview data" disclosure. Keep the endpoint.
10. Responsive behaviour: one column at narrow widths, wrapping buttons, stacking surface rows, and no horizontal overflow from raw data.
11. Add `tests/spatial-design-controls-v2.test.mjs` covering the plan §25 test list.
12. Update the two docs only where directly necessary.

## Validation and evidence

- **Tests and checks:** the focused V2A tests, full `npm test`, `npm run build`, `git diff --check` and the applicable validators.
- **Diff checks:**
  - exact changed-file scope;
  - `git diff` empty for `worker/`, `app/DesignRuntime.js`, `components/site/`, `migrations/` and `wrangler.jsonc`;
  - source evidence that there is no arbitrary-input control.
- **Browser evidence:** desktop and narrow/mobile admin screenshots, and fixed Spatial Preview link evidence.
- **Checker:** a Context Bootstrap check-only run before publishing.
- **Evidence class:** all of it is `ACTOR_REPORTED`.

## Stop conditions

Stop and return the gap, without widening scope, if any of these arises:
- a change needed outside the execution scope;
- any API, Worker, D1, DesignRuntime, migration or `components/site/**` change;
- a new theme field or enum value;
- an arbitrary input;
- a new preview endpoint;
- a Research visibility/order mutation;
- drag/drop;
- a failed Context Bootstrap check;
- a stale or moved tip;
- a protocol mismatch;
- any request to deploy or merge.

## Next action

The Builder implements under this directive. It then publishes one Protocol V2 return commit containing:
- the implementation and evidence;
- `CURRENT_HANDOFF`;
- this directive archived under `coordination/archive/directives/`;
- `CURRENT_DIRECTIVE: NONE` with the selector cleared;
- `TURN: ARCHITECT`.

Then it stops.
