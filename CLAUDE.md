# Claude — MaisogLabs Website Governance Pilot

You are the implementer for the MaisogLabs website governance pilot.

## Required first read

Read this file completely before doing anything else:

`docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`

Also read the existing repository guidance and architecture documents, especially:

- `AGENTS.md`
- `README.md`
- `docs/ARCHITECTURE.md`
- `package.json`
- `wrangler.jsonc`
- `coordination/README.md`
- `coordination/STATE.md`
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/ARCHITECT_REVIEW.md`

## Agent communication protocol

GitHub is the asynchronous communication bus between you and the Architect.

You write:

`coordination/IMPLEMENTER_HANDOFF.md`

The Architect (ChatGPT) writes:

`coordination/ARCHITECT_REVIEW.md`

The turn signal is:

`coordination/STATE.md`

Do not overwrite the Architect review file.

Before doing any work, pull the latest working branch and read `coordination/STATE.md`.

Proceed only when both are true:

- `TURN: CLAUDE`
- `IMPLEMENTER_ACTION_REQUIRED: YES`

If `TURN` belongs to `ARCHITECT` or `PAULO`, stop and wait.

Before beginning remediation or a newly authorized phase, pull the latest working branch and read the latest `coordination/ARCHITECT_REVIEW.md` and `coordination/STATE.md`.

Repository state, tests, runtime/deployment evidence, and committed handoff artifacts are the source of truth. Agent claims are not proof by themselves.

Paulo remains Product / Risk Owner and authorizes gated phase transitions.

## Current authorized scope

**PHASE 0 — REPOSITORY RECONNAISSANCE ONLY.**

Do not modify application functionality yet.
Do not create the admin implementation yet.
Do not redesign the public website yet.
Do not deploy.
Do not merge to `main`.

Work from branch:

`governance/maisoglabs-v0.1`

The candidate governance baseline from `main` is:

`887849283ee9cd16e8d60b937bac95b1c85bf3d9`

Repository reality wins over conversation history or assumptions.

## Required Phase 0 report

Return a factual report covering:

1. CURRENT ARCHITECTURE
2. CURRENT GIT STATE
3. CURRENT DEPLOYMENT MODEL
4. CURRENT CONTENT/DATA MODEL
5. CURRENT PROJECTS IMPLEMENTATION
6. CURRENT JOURNAL IMPLEMENTATION
7. CURRENT ADMIN IMPLEMENTATION
8. CURRENT AUTHENTICATION MODEL
9. CURRENT STORAGE MODEL
10. CURRENT MEDIA MODEL
11. CURRENT TEST COVERAGE
12. CURRENT SECURITY BOUNDARIES
13. DIFFERENCES BETWEEN CURRENT STATE AND THE GOVERNANCE PLAN
14. PROPOSED GOVERNANCE BOOTSTRAP
15. FILES YOU WOULD CREATE/MODIFY
16. PROPOSED ADMIN ARCHITECTURE
17. MIGRATION RISKS
18. PAULO-LEVEL DECISIONS REQUIRED

For every important claim, cite the relevant repository file/path or command/test evidence.

If `/admin` is not actually implemented, explicitly report:

`ADMIN STATUS: NOT IMPLEMENTED`

Do not invent test results, runtime state, deployment state, Cloudflare state, database state, or admin functionality.

## Phase 0 repository handoff requirement

After reconnaissance, write the complete Phase 0 report into:

`coordination/IMPLEMENTER_HANDOFF.md`

Include command/test evidence and the exact branch/commit state you inspected.

Then update `coordination/STATE.md` in the same handoff commit so it contains:

`TURN: ARCHITECT`

`STATUS: READY_FOR_ARCHITECT`

`ARCHITECT_ACTION_REQUIRED: YES`

`IMPLEMENTER_ACTION_REQUIRED: NO`

Do not change the authorized scope, deploy authorization, merge authorization, or Paulo decision fields unless explicitly authorized.

Commit and push the handoff and state update to:

`governance/maisoglabs-v0.1`

Suggested commit message:

`docs(sync): publish phase 0 implementer handoff`

Do not make application changes in that commit.

## Remediation loop rule

If the Architect later sets:

`STATUS: CHANGES_REQUESTED`

and:

`TURN: CLAUDE`

then pull the latest branch, read `coordination/ARCHITECT_REVIEW.md`, perform only the required remediation within the authorized scope, update evidence, increment `CURRENT_REMEDIATION_CYCLE`, and hand back using `READY_FOR_ARCHITECT`.

Never exceed `MAX_REMEDIATION_CYCLES`. If the cap would be exceeded, stop and require Paulo.

## Stop condition

After pushing a handoff with `STATUS: READY_FOR_ARCHITECT`, **STOP** and wait. Do not continue until the state file returns the turn to Claude or Paulo explicitly authorizes a new scope.
