# ML-DEVOS-AS-030 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED / WEB-INC-007 DESIGN-CONTROL ARCHITECTURE`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `d5ad4bfc253a4a17772d6107c3a5713c1819454b`
- file blob: `3cf818fa0f096db12554a96c15cff5a3a97bb1de`

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — WEB-INC-007 IMPLEMENTATION MAY PROCEED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-030 — WEB-INC-007 Theme / Design Controls Architecture Sync

RFC:
- `ML-DEVOS-RFC-010`

Product increment:
- `WEB-INC-007 — Theme / Design Controls`

Change class:
- `ARCHITECTURE`

Repository-grounded RFC base:
- `d41dc1c3c3203ebab1b009d94bdfac17f490bd22`

Current reviewed governance HEAD:
- `22882030db10286af984b1807f832f6ae4fbe9b6`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.5.0`

## Repository-grounded context

The Architect independently confirmed:

- all dependency-ordered WEB increments before WEB-INC-007 are closed;
- UI-PATCH-001 is closed and defines the accepted soft-geometry baseline;
- current local schema contains 20 product tables;
- no `theme_settings` table exists yet;
- `sections` / `section_revisions` already own section visibility/order state;
- current Worker-first public API widening is Journal-only;
- no public `/api/design` path exists;
- admin dashboard has no design-control UI;
- `globals.css` already exposes stable presentation tokens and the V3/soft-geometry baseline;
- static export remains the current site deployment model.

## Findings

### AS30-F001 — PASS — ARCHITECTURE classification is correct

RFC-010 is not only an admin capability.

It adds:
- two persistent tables;
- a public published-only Worker→D1 design read path;
- a new Worker-first route;
- a client runtime that applies published design state to static output;
- mutation behavior against existing section revisions.

The stronger architecture path is appropriate.

### AS30-F002 — PASS — table ownership is bounded

WEB-INC-007 owns exactly:

- `theme_settings`;
- `theme_settings_revisions`.

Target table count is exactly:

`20 → 22`

Existing `sections` / `section_revisions` remain the owner of DESIGN-002/003 state.

No duplicate section table or generic settings table is authorized.

### AS30-F003 — PASS — DESIGN-001 does not create an unauthorized public media-serving dependency

The RFC deliberately constrains hero/background selection to approved static/CSS presets.

It does not accept:

- arbitrary URLs;
- R2 keys;
- upload identifiers;
- data URIs;
- free-form CSS background values.

Therefore WEB-INC-007 does not silently authorize public R2 object serving or remote media infrastructure.

### AS30-F004 — PASS — DESIGN-014 is structurally bounded

Theme state is represented by:

- fixed enums;
- bounded integers;
- fixed preset identifiers.

No admin-controlled:

- CSS text;
- JS;
- HTML;
- selector;
- custom property name;
- arbitrary color string;
- font URL;
- asset URL

is accepted.

This satisfies the core safety intent of DESIGN-014 and WEB-SEC-010/013-adjacent controls.

### AS30-F005 — PASS — draft/publish isolation is preserved

Theme changes follow:

`published_revision_id / draft_revision_id`

exactly like the accepted content model.

Section design changes continue to use existing section revision pointers.

Public reads follow only published pointers.

Preview reads draft state only behind authentication.

No draft can reach the public design API before publish.

### AS30-F006 — PASS — static-export architecture is preserved

The proposed public integration is:

- static page markup;
- small client design runtime;
- published-only `GET /api/design`.

The RFC does not authorize:

- SSR conversion;
- Next server components reading D1;
- build-time D1 dependency;
- dynamic HTML generation from D1.

The site remains statically exported.

### AS30-F007 — PASS — fail-safe baseline is explicit

The existing V3 + UI-PATCH-001 presentation remains the default before design data loads and when the public design API fails.

A D1/API failure must not blank or materially break the public site.

This is especially important because design state affects the presentation layer.

### AS30-F008 — PASS — public design route is narrow

The only new public API is:

`GET /api/design`

No wildcard `/api/design/*` route is authorized.

Unsupported methods must reject before D1 access.

The response is published-only and positive-allowlist only.

### AS30-F009 — PASS — admin design API is bounded

The protected route family is limited to:

- design status;
- draft preview;
- theme draft edit;
- theme publish;
- fixed-section draft edit;
- fixed-section publish.

No generic key/value mutation API is introduced.

No delete or arbitrary new section creation is authorized.

### AS30-F010 — PASS — section scope is fixed

Only:

- `home`
- `projects`
- `process`
- `about`

may be controlled by DESIGN-002/003.

No arbitrary DOM id, selector, or section name is accepted.

The order range is bounded.

### AS30-F011 — PASS — reduced-motion safety is one-way protective

Allowed modes are:

- `respect-system`;
- `always-reduced`.

There is no setting that disables or overrides a user's reduced-motion preference.

The existing `prefers-reduced-motion` CSS behavior must remain intact.

### AS30-F012 — PASS — UI scope is appropriate for the final core increment

WEB-INC-007 may add a real authenticated design-control UI because that is the explicit purpose of DESIGN-001…014.

The UI remains bounded to:

- selects;
- toggles;
- range controls;
- fixed section controls;
- save/preview/publish feedback.

It does not authorize a visual-code editor or generic CMS expansion.

### AS30-F013 — PASS — audit integration is bounded

The RFC authorizes only fixed call-site literals:

- `theme_edit_draft`;
- `theme_publish`;
- `section_design_edit_draft`;
- `section_design_publish`.

No caller-supplied audit action is accepted.

### AS30-F014 — PASS — local resource authority remains bounded

D1 and R2 remain:

`remote: false`

No:
- remote D1;
- remote R2;
- production resource provisioning;
- public bucket/domain;
- production Access configuration;
- deployment;
- main merge

is authorized.

### AS30-F015 — PASS — CORE-019/020 posture is appropriate

Because the increment is local-only, no real remote-resource authority is created.

Because design state can affect public presentation, the RFC appropriately requires:

- source/diff inspection;
- validation boundaries;
- public draft-non-disclosure;
- visual evidence;
- full regression/build evidence.

Runtime/CLI/visual claims remain `ACTOR_REPORTED` until review.

### AS30-F016 — PASS — final-core-increment status does not create release authority

Closing WEB-INC-007 would complete the current dependency-ordered core WEB roadmap.

It would **not** automatically authorize:

- deployment;
- remote resources;
- production verification;
- main merge;
- homepage/project D1 cutover.

Those remain separate release/operations decisions.

## Paulo gate

Paulo explicitly instructed:

`Okay proceed`

after WEB-INC-006 closure and documentation reconciliation, with WEB-INC-007 identified as the sole remaining core increment.

That is sufficient bounded product/risk authorization to proceed with RFC-010 exactly as reviewed.

It is not blanket authority beyond RFC-010.

## Verdict

`ML-DEVOS-AS-030: ARCHITECT_APPROVED — WEB-INC-007 THEME / DESIGN CONTROLS COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`

Builder implementation may proceed after:

1. RFC-010 status is changed to `ACCEPTED`;
2. D-032 records Paulo's authorization;
3. `coordination/STATE.md` opens the exact Builder turn with all remote/release gates closed.

Because this is `ARCHITECTURE`, final acceptance requires:

- independent Architect implementation review;
- durable concluding Architect Sync archive;
- post-acceptance ADR.

No deployment, remote-resource, production, main-merge, or Sentinel S3+ authority is created by this approval.
```
