# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-007-THEME-DESIGN-CONTROLS
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
AUTHORIZED_SCOPE: WEB_INC_007_THEME_DESIGN_CONTROLS_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: 9773d76641bef0b9f57b94d78087438f4d2ffc15
LAST_ARCHITECT_REVIEWED_SHA: 17577838d1007210cd1893fdb71ea8063d764fa8
CURRENT_REMEDIATION_CYCLE: 1
MAX_REMEDIATION_CYCLES: 3
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: YES
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Current baselines

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.5.0`

## Authority chain

- `ML-DEVOS-RFC-010 — ACCEPTED`
- `ML-DEVOS-AS-030 — ARCHITECT_APPROVED`
- `D-032 — Paulo-authorized implementation`
- `ML-DEVOS-AS-031 — screenshot-reference workflow approved`
- `D-033 — screenshot-reference workflow required`

## Authorized Builder scope

Claude may implement only WEB-INC-007 as specified by RFC-010:

- migration `0005_web_inc_007_theme.sql`;
- exactly two new product tables: `theme_settings`, `theme_settings_revisions`;
- target exactly 22 product tables;
- bounded theme draft/edit/publish lifecycle;
- bounded section visibility/order draft/publish lifecycle for home/projects/process/about;
- bounded authenticated design-control UI;
- authenticated design preview;
- fixed design audit actions;
- public GET-only `/api/design`;
- published-only public design runtime using fixed mappings and bounded numeric CSS variables;
- local-only tests/build/Wrangler/visual evidence.

## Screenshot-reference operating workflow

WEB-INC-007 must support the workflow defined in:

- `docs/product/DESIGN_REFERENCE_WORKFLOW.md`
- `ML-DEVOS-AS-031`
- `D-033`

Required operational flow:

`Paulo screenshot → ChatGPT Architect analysis → structured control plan → Claude applies through authenticated design UI/API → Preview → Paulo review → Publish`

Builder implication:

- control names/options/ranges must be deterministic and inspectable;
- Save Draft / Preview / Publish must be explicit;
- reference-driven application must not require raw CSS/JS/HTML or direct D1 edits;
- unsupported reference details must surface as gaps rather than triggering silent code changes.

No AI/image-analysis runtime inside MaisogLabs is required or authorized by this workflow.

## Critical design boundaries

Admin input must never accept:

- arbitrary CSS;
- arbitrary JS;
- arbitrary HTML;
- arbitrary color strings;
- arbitrary font names/URLs;
- arbitrary image URLs;
- R2 object keys;
- arbitrary selectors/classes;
- custom CSS property names.

DESIGN-001 is preset-only and may not create public media-object serving.

DESIGN-002/003 must reuse existing section revision tables.

Existing V3 + UI-PATCH-001 presentation is the fail-safe fallback.

Existing `prefers-reduced-motion` behavior must remain effective.

## Absolute gates

`MEDIA_MUTATION_AUTHORIZED: NO`

No media upload/archive/replace capability is created by WEB-INC-007.

`MUTATION_AUTHORIZED: YES`

Only for exact theme/section design mutations in RFC-010.

`AUDIT_APPEND_AUTHORIZED: YES`

Only for the four exact design audit actions in RFC-010.

`REMOTE_R2_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Explicitly not authorized

- arbitrary visual-code editor;
- general-purpose key/value settings;
- general CMS expansion;
- homepage/projects public D1 content cutover;
- public R2 object serving;
- remote resources;
- production Access changes;
- SSR conversion;
- deployment;
- protected/main merge;
- Sentinel S3+;
- CI/rulesets/Capability Gateway/Task Engine/Orchestrator.

## Required handoff

Builder must provide the full RFC-010 evidence set, including:

- exact base/result SHA and changed files;
- 20→22 table evidence;
- migration 0001–0004 byte identity;
- enum/range/injection rejection tests;
- theme/section pointer isolation and stale-write evidence;
- draft preview/public published-only non-disclosure;
- design runtime fixed-mapping evidence;
- reduced-motion/responsive evidence;
- TEST-ADM-009;
- full test/build/local Wrangler/visual/config evidence;
- explicit no remote/deploy/main confirmation.

Then set:

`TURN: ARCHITECT`

`STATUS: READY_FOR_ARCHITECT`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`ARCHITECT_ACTION_REQUIRED: YES`

Commit, push, and stop.

## Builder handoff

WEB-INC-007 implementation is complete and submitted for Architect review. See `coordination/IMPLEMENTER_HANDOFF.md`, section "WEB-INC-007 — Theme / Design Controls", for the complete evidence set.

- Base SHA: `ac2666860195a6e1c151ae363f7d176b61c12cde`
- Implementation commit: `17577838d1007210cd1893fdb71ea8063d764fa8` (25 files: 9 new, 16 modified — migration 0005 + bootstrap, theme/section-design D1 helpers, admin design API, public design API, dashboard integration, DesignRuntime + DesignControls, CSS variant system)
- Documentation/bookkeeping commit: this commit (updates `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md` only)
- Tests: 49 new admin-design tests + 13 new public-design tests, full suite 331/331 passing; `npm run build` succeeded with `/`, `/journal`, `/admin` all prerendered static
- Local Wrangler smoke test performed for protected design routes, public `/api/design` (default and non-default theme), and static `/`/`/journal`; visual screenshots confirm default-baseline pixel parity and a genuinely different non-default rendered theme
- `TEST-ADM-009` now `PASS` (was `NOT IMPLEMENTED`)
- All runtime/test/visual evidence remains `ACTOR_REPORTED` — no self-certification made
- `DEPLOY_AUTHORIZED: NO` and `MAIN_MERGE_AUTHORIZED: NO` unchanged; no remote D1/R2 touched
- This closes the dependency-ordered core WEB roadmap (RFC-010) but creates no deploy/remote-resource/main-merge authority by itself (AS30-F016)

## Remediation Cycle 1

Architect review:
- `ML-DEVOS-AS-032 — CHANGES_REQUESTED`

Builder must remediate only:

1. `AS32-B001` — provide an authenticated real visual draft preview suitable for screenshot-reference review while keeping public design reads published-only;
2. `AS32-B002` — make overlay intensity 40..85 meaningful across the entire range while preserving 68 as the current baseline.

No other scope expansion is authorized.

### Remediation Cycle 1 — Builder handoff

Both blockers are remediated and submitted for Architect review. See `coordination/IMPLEMENTER_HANDOFF.md`, section "WEB-INC-007 — Remediation Cycle 1 (ML-DEVOS-AS-032)", for the complete evidence set.

- Remediation base: `a78a33bd7b910bbe17862085abbdaf9611836b0a` (the Architect's `CHANGES_REQUESTED` review commit)
- Remediation commit: `9773d76641bef0b9f57b94d78087438f4d2ffc15` (5 files: 2 new, 3 modified — no server/worker/schema/routing file changed)
- `AS32-B001`: `app/DesignRuntime.js` recognizes `?design-preview=1` and fetches the existing protected `GET /admin/api/design/preview` (no new public API) through the same fixed-mapping application functions; falls back safely to the published projection on any failure. `app/admin/DesignControls.js` adds "Open Homepage Preview"/"Open Journal Preview" links. Evidence: Playwright route-interception sessions proving both the authenticated-draft-applied case and the unauthenticated-falls-back-to-baseline case, plus a full-page screenshot proving a hidden draft section is genuinely absent from the render.
- `AS32-B002`: new pure module `lib/design/overlay.mjs` splits the 40..85 range into an unchanged 40..68 opacity mapping and a new, independent 68..85 `--design-overlay-boost` darkening layer (`app/globals.css`'s new `.cinematic-background::before`) that cannot be clamped away — 68 remains byte-identical to the prior baseline. Evidence: 7 new unit tests plus real seeded-published-theme screenshots at 40/68/85 showing a clear, monotonic darkening progression.
- Tests: 7 new (`tests/design-overlay.test.mjs`); full suite 338/338 passing; `npm run build` still produces four static routes.
- All runtime/test/visual evidence remains `ACTOR_REPORTED` — no self-certification made.
- `DEPLOY_AUTHORIZED: NO` and `MAIN_MERGE_AUTHORIZED: NO` unchanged; no remote D1/R2 touched; no schema/table/route/vocabulary/range scope reopened.

## Current gate

`WEB-INC-007 REMEDIATION CYCLE 1 SUBMITTED — READY_FOR_ARCHITECT REVIEW`
