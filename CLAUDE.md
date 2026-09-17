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

## Stop condition

After producing the Phase 0 report, **STOP** and wait for Paulo's authorization and Architect review before beginning Phase 1.
