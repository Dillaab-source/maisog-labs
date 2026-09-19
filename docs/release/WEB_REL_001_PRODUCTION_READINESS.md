# WEB-REL-001 — Production Release Readiness

Status: `AUTHORIZED FOR ASSESSMENT ONLY`

## Purpose

Prepare MaisogLabs for its first governed production release after completion of the eight-increment core WEB roadmap.

This phase is a **readiness assessment**, not a deployment.

## Current release facts

Authoritative governed branch:
- `governance/maisoglabs-v0.1`

Current governed HEAD at phase opening:
- `aeb335f43cfd95d81bd550231a88d48ec47cb8ad`

Default branch:
- `main`

Current main HEAD:
- `887849283ee9cd16e8d60b937bac95b1c85bf3d9`

At phase opening, the governed branch is 355 commits ahead of `main`.

GitHub technical protection at phase opening:
- repository rulesets: none
- `main` protected: false
- governance branch protected: false
- GitHub Actions workflows: none
- workflow runs: none

Tracked Cloudflare configuration remains non-production:
- Access team domain: placeholder
- Access application AUD: placeholder
- D1: local-only, `remote: false`, no production `database_id`
- R2: local-only, `remote: false`
- no production resource identifier is committed

## Governance trigger

CORE-021 applies because the next eventual steps would be the project's first governed protected-main merge and/or first production deployment under this architecture.

CORE-020 requires stronger evidence before merge/release than Builder-only actor reports.

CORE-019 requires any later real remote/cloud authorization to identify exact provider/resource/environment/operations/identity/rollback/evidence scope.

## Assessment outputs

Claude must produce a release-readiness packet that includes:

1. exact governed HEAD and main HEAD;
2. current main↔governance compare status;
3. release-diff inventory grouped into:
   - runtime/application;
   - schema/migrations;
   - tests;
   - Cloudflare config;
   - governance/docs;
4. independently useful command log for:
   - `npm test`;
   - `npm run build`;
   - `npx wrangler deploy --dry-run`;
   - `npm audit`;
   - local D1 fresh migration/table-count check;
   - relevant local route smoke;
5. current static route inventory;
6. confirmation that migrations 0001–0005 apply from a fresh local database;
7. exact 22-product-table inventory;
8. current public/admin Worker-first route inventory;
9. production configuration gaps:
   - Cloudflare Access team domain;
   - Access application AUD;
   - production D1 database;
   - production R2 bucket;
   - Worker deployment/domain attachment assumptions;
10. GitHub technical-protection gap assessment;
11. minimum recommended GitHub release protections;
12. a proposed minimal CI check design for test + build, **without implementing or activating it in this phase**;
13. a proposed protected-main PR/merge process;
14. production D1 initialization/migration plan;
15. production R2 provisioning/binding plan;
16. production Access configuration plan;
17. production Worker deployment sequence;
18. rollback plan for:
   - bad Worker deploy;
   - bad D1 migration;
   - bad Access config;
   - public Journal/design API regression;
19. post-deploy runtime-verification checklist;
20. list of unresolved blockers and exact next Paulo gates required.

## Minimum GitHub protection recommendation to assess

At minimum, evaluate:

- PR required for `main`;
- no direct push to `main`;
- block force pushes;
- block branch deletion;
- required test/build status check once a separately authorized CI workflow exists;
- bypass restricted to Paulo/repository administration as narrowly as GitHub supports;
- whether an approval requirement is practical for the current single-owner operating model without fabricating a reviewer.

Do not claim these protections exist until independently observed after configuration.

## Production release sequence to assess

Target sequence:

```
RELEASE READINESS
→ TECHNICAL PROTECTION APPROVAL
→ PROTECTION/CI SETUP
→ INDEPENDENT TEST/BUILD EVIDENCE
→ DRAFT/REVIEW PR TO MAIN
→ PAULO MAIN-MERGE GATE
→ MERGE
→ PRODUCTION RESOURCE AUTHORIZATION
→ D1/R2/ACCESS SETUP
→ PAULO DEPLOY GATE
→ DEPLOY
→ RUNTIME OBSERVATION
→ VERIFIED OR ROLLBACK
```

The ordering may be refined by the readiness assessment, but MAIN, DEPLOYED, and VERIFIED must remain distinct.

## Explicitly not authorized

WEB-REL-001 does not authorize:

- GitHub ruleset creation/modification;
- branch protection mutation;
- GitHub Actions workflow activation;
- merging or pushing directly to `main`;
- remote D1 creation/mutation;
- remote R2 creation/mutation;
- production Access configuration;
- credential creation or storage;
- Cloudflare deployment;
- DNS/domain mutation;
- public R2 object serving;
- production data writes;
- homepage/projects D1 cutover;
- any new product feature;
- Sentinel S3+ implementation.

## Evidence classification

All Claude command/runtime claims remain `ACTOR_REPORTED`.

This assessment can be Architect-inspected for completeness, but it cannot by itself satisfy the stronger evidence required for an actual merge or deployment.

## Completion condition

WEB-REL-001 closes when the Architect has reviewed a complete readiness packet and can identify:

- what is ready;
- what is blocked;
- which technical protections are needed;
- which exact remote resources would later need Paulo authorization;
- the next safe release decision.

No production action occurs as part of closing this assessment.
