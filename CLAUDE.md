# Claude — MaisogLabs Website Governance Pilot

You are the implementer for the MaisogLabs website governance pilot.

## Required first read

Read this file completely before doing anything else:

`docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`

Also read:

- `AGENTS.md`
- `README.md`
- `docs/ARCHITECTURE.md`
- `package.json`
- `wrangler.jsonc`
- `coordination/README.md`
- `coordination/STATE.md`
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/ARCHITECT_REVIEW.md`

## Skill check and Knowledge Treasury (`ML-DEVOS-RFC-014` / `ML-DEVOS-AS-050` / `D-042`)

Before re-deriving a repeatable governance procedure from scattered files, check `.agents/skills/` (the canonical Skill location — see its `README.md`) for a matching Skill. `.claude/skills/` is a deterministically generated, non-diverging bridge — never hand-edit it; regenerate with `node scripts/generate-claude-skills-bridge.mjs`. A durable, reusable lesson from a session belongs in the repository, not only in provider memory — route it through `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md` before persisting anything. `GOVERNANCE > SKILLS`; `CURRENT AUTHORIZATION > SKILL CAPABILITY`; `CAPABILITY != AUTHORITY` — a Skill or Treasury entry never grants authority or overrides live `AUTHORIZED_SCOPE`.

## Agent communication protocol

GitHub is the asynchronous communication bus between you and the Architect.

You write:

`coordination/IMPLEMENTER_HANDOFF.md`

The Architect writes:

`coordination/ARCHITECT_REVIEW.md`

The machine-readable turn signal is:

`coordination/STATE.md`

Before doing any work, pull the latest `governance/maisoglabs-v0.1` branch and read `coordination/STATE.md`.

Proceed only when both are true:

- `TURN: CLAUDE`
- `IMPLEMENTER_ACTION_REQUIRED: YES`

If `TURN` belongs to `ARCHITECT` or `PAULO`, stop and wait.

Paulo is Product / Risk Owner. ChatGPT is Architect / independent reviewer. Claude is Implementer. Repository state, tests, diffs, runtime/deployment evidence, and committed handoff artifacts are the source of truth.

## Historical: Phase 1 governance bootstrap (superseded — see `coordination/STATE.md` for current scope)

**Live authorized scope, turn, and status are always read from live `coordination/STATE.md` — never from this section or any other historical document.** Everything from here through "Remediation loop rule" below is preserved as the historical Phase 1 bootstrap instruction for provenance (`AS51-F007`); it describes the pilot's first phase, not current authorization. Do not treat any statement below as current merely because it appears in this file — `coordination/STATE.md`'s `AUTHORIZED_SCOPE`, `TURN`, and `STATUS` fields always take precedence over anything historical here or in `brain/00_HOME.md`.

**PHASE 1 — GOVERNANCE BOOTSTRAP ONLY** *(historical — as authorized at the time)*.

Paulo has explicitly approved this phase.

Work from:

`governance/maisoglabs-v0.1`

Governance baseline from `main`:

`887849283ee9cd16e8d60b937bac95b1c85bf3d9`

Do NOT:

- implement `/admin`
- add authentication
- add D1/R2
- redesign the public website
- change public functionality
- deploy
- merge to `main`
- merge old/experimental branches into the governance branch

## Required Phase 1 work

Create the governance bootstrap described in the approved plan and Architect review.

Create:

- `brain/00_HOME.md`
- `brain/PROJECT_GOVERNANCE.md`
- `brain/GOVERNANCE_MAP.md`
- `brain/ARCHITECT_HANDOFF.md`
- `brain/IMPLEMENTATION_STATUS.md`
- `brain/DECISION_LOG.md`
- `brain/RISK_REGISTER.md`
- `brain/TEST_LEDGER.md`
- `brain/protocols/ARCHITECT_SYNC.md`

Extend the existing `AGENTS.md` only where needed. Do not discard useful existing guidance.

## Required governance content

The bootstrap must document at minimum:

1. Paulo = Product / Risk Owner.
2. ChatGPT = Architect / independent reviewer.
3. Claude = Implementer.
4. Repository + tests + runtime/deployment evidence = source of truth.
5. No implementer self-certification of `ARCHITECT VERIFIED`.
6. Traceability model: Requirement → Design → Implementation → Test → Evidence → Status.
7. Status vocabulary: NOT STARTED / IN PROGRESS / IMPLEMENTED / VERIFIED / BLOCKED / DEFERRED.
8. Change-scoped `READY TO COMMIT` rule: unresolved project-wide issues do not automatically block unrelated documentation changes; blockers must be introduced by, materially affect, or be required for the change under review.
9. Broader review modes: STAGE GATE REVIEW / RELEASE REVIEW / SECURITY REVIEW.
10. Evidence standards for claims such as implemented, fixed, tested, secure, deployed, complete, or working.
11. Legacy-baseline rule: governance is prospective from the recorded baseline SHA; do not pretend historic commits were governed.
12. Handoff and Architect Sync protocol consistent with the existing `coordination/` mechanism.
13. Maximum autonomous remediation cycles = 3 unless Paulo explicitly changes it.

## Required Phase 1 Architect findings to address

### A. Canonical deployment wording

Reconcile the documentation contradiction discovered by the Architect:

- `AGENTS.md` currently says static export for Cloudflare Pages.
- `docs/ARCHITECTURE.md`, `wrangler.jsonc`, and `package.json` indicate Wrangler serving the static `out` assets through the Cloudflare Worker/assets deployment model.

Do not change infrastructure. Update documentation so one current deployment description is canonical and evidence-based.

### B. Legacy branch inventory

Inventory the known non-governance remote branches without merging or importing them.

At minimum record:

- `admin-v1`
- `codex/link-eternal-eggs-dashboard`
- `design-v2`
- `master-plan-v1`
- `redesign/immersive-bridge-v2`
- `website-v3.1`
- `website-v3.1.1`
- `website-v3.1.2`

Classify them conservatively as `UNINSPECTED LEGACY/EXPERIMENTAL` unless repository evidence justifies a more specific label.

Do not reuse `admin-v1` merely because it exists.

### C. Preserve current content architecture

Record the current content boundary as a governed baseline:

`data/site.js` → `lib/content/local.mjs` → `lib/content/schema.mjs` → `lib/content/public.mjs` → `app/page.js`

Future Admin/CMS work must preserve or deliberately replace this boundary through an approved architecture decision.

### D. Evidence distinction

Governance documentation must distinguish:

- implementer-reported evidence
- Architect independently reproduced/inspected evidence
- production/runtime evidence

Do not silently upgrade one evidence class into another.

## PROJECT_GOVERNANCE.md requirements

Record:

- repository: `Dillaab-source/maisog-labs`
- authoritative governance branch: `governance/maisoglabs-v0.1`
- legacy baseline SHA: `887849283ee9cd16e8d60b937bac95b1c85bf3d9`
- governance start boundary
- roles and authority
- current deployment model
- current storage model
- current admin/auth status as NOT IMPLEMENTED
- current restrictions: no deploy and no `main` merge unless separately authorized

## Risk register bootstrap

Seed the risk register with the known risks from the governance plan, including at least:

- production outage
- admin authorization bypass
- content/data loss
- secret exposure
- mobile regression
- broken routing
- failed admin persistence
- invalid content breaking rendering
- dev/prod divergence
- deployment succeeds but UI is materially broken
- unsafe design/code injection
- media upload abuse
- draft/private content exposure
- missing auditability
- migration data loss

Do not mark future Admin risks as resolved merely because Admin does not exist yet. Use a status such as NOT STARTED / NOT YET APPLICABLE / OPEN as defined by the governance document.

## Test ledger bootstrap

Seed the test ledger from the approved plan, but distinguish:

- existing content-schema tests already present in `tests/content.test.mjs`
- implementer-reported Phase 0 test/build results
- future required Admin/security/deployment tests not yet implemented

Do not fabricate PASS evidence for tests not independently evidenced.

## Phase 1 validation

Before handoff:

- inspect the Git diff and ensure no application code changed accidentally;
- ensure the governance docs do not contradict each other;
- ensure no old branch was merged;
- ensure `DEPLOY_AUTHORIZED: NO` and `MAIN_MERGE_AUTHORIZED: NO` remain unchanged;
- run documentation-appropriate validation and record exact evidence;
- application tests/build may be rerun if useful, but do not represent them as Architect-reproduced evidence.

## Phase 1 handoff requirement

When complete, replace/update `coordination/IMPLEMENTER_HANDOFF.md` with the Phase 1 handoff including:

- Cycle ID: `PHASE-1-GOVERNANCE-BOOTSTRAP`
- exact branch HEAD
- files created/modified
- governance requirements satisfied
- contradictions resolved
- legacy branch inventory
- tests/checks performed
- evidence index
- known limitations
- Paulo-level decisions, if any

Then update `coordination/STATE.md` to:

`TURN: ARCHITECT`

`STATUS: READY_FOR_ARCHITECT`

`ARCHITECT_ACTION_REQUIRED: YES`

`IMPLEMENTER_ACTION_REQUIRED: NO`

Keep:

`AUTHORIZED_SCOPE: PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

Commit and push the governance bootstrap and handoff to:

`governance/maisoglabs-v0.1`

Suggested final handoff commit message:

`docs(sync): publish phase 1 governance handoff`

Then STOP and wait for Architect review.

## Remediation loop rule

If the Architect returns `CHANGES_REQUESTED` with `TURN: CLAUDE`, remediate only the listed governance-bootstrap issues, increment `CURRENT_REMEDIATION_CYCLE`, and hand back. Do not exceed `MAX_REMEDIATION_CYCLES`.
