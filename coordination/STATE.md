# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-007-THEME-DESIGN-CONTROLS
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: WEB_INC_007_THEME_DESIGN_CONTROLS_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: cdc8f84cbdb2c5a76336512b6c0e5111030d3e4e
LAST_ARCHITECT_REVIEWED_SHA: cdc8f84cbdb2c5a76336512b6c0e5111030d3e4e
CURRENT_REMEDIATION_CYCLE: 0
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

## Current gate

`WEB-INC-007 AUTHORIZED — CLAUDE TO IMPLEMENT BOUNDED LOCAL THEME / DESIGN CONTROLS AND HAND OFF FOR ARCHITECT REVIEW`
