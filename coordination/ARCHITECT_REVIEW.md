# Architect Builder Brief — WEB-REL-001 Gate A

Status: AUTHORIZED IMPLEMENTATION
Cycle: MAISOGLABS_WEB_OPERATIONAL_BASELINE_GATE_A
Authority: D-052
Source readiness packet: docs/release/WEB_REL_001_READINESS_REPORT.md
Precondition: S4 fully closed by ML-DEVOS-AS-068

## Objective

Implement only the first production-readiness gate already designed by WEB-REL-001:

1. minimal CI on the governed branch;
2. observe one real green CI run;
3. apply minimum GitHub technical protection to main using the observed live check name;
4. return evidence to Architect.

This does NOT merge or deploy the website.

## LEAN / DELTA-ONLY reads

Read first:
1. coordination/STATE.md
2. this brief
3. docs/release/WEB_REL_001_READINESS_REPORT.md §§11–13 and §21 Gate A only
4. package.json / package-lock.json only as needed to confirm commands/runtime
5. live GitHub branch/workflow/ruleset state

Do not reread the full Sentinel history.

## Repository mutation authorized

Create:
- `.github/workflows/ci.yml`

Minimal workflow:
- name: `ci`
- pull_request -> main
- push -> governance/maisoglabs-v0.1
- one job suitable for becoming the required status check
- ubuntu-latest
- actions/checkout
- actions/setup-node with Node 22
- npm ci
- npm test
- npm run build

No secrets and no deployment steps.

Update only as required for deterministic derived traceability and the compact coordination handoff/state.

## GitHub remote mutation authorized

After the workflow has completed successfully at least once on the governed branch:

Configure one active ruleset/protection policy targeting exactly `main`:
- require PR before merge;
- zero required approving reviews for the current single-owner repository;
- block force-push/non-fast-forward;
- block deletion;
- require the exact observed successful CI status-check context;
- bypass limited to repository owner/admin only, as narrowly as supported.

Do not guess the status-check context before the successful run exists.

If GitHub administration permission is unavailable, STOP. Do not substitute a weaker design.

## Verification

Return evidence for:
- exact input HEAD;
- exact workflow commit HEAD;
- workflow run ID/url/commit and final conclusion;
- job/check name actually reported by GitHub;
- ruleset/protection ID and effective target;
- exact active rules relevant to PR/force-push/deletion/status checks/bypass;
- live confirmation main HEAD did not change during Gate A;
- traceability fingerprint if repository-derived outputs changed;
- exact changed files.

Evidence from Builder remains ACTOR_REPORTED until independently inspected.

## Write boundary

Allowed repository files:
- .github/workflows/ci.yml
- deterministic traceability outputs only if regeneration changes them
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

brain/DECISION_LOG.md is already updated by Architect: do not edit it.

## Hard prohibitions

No PR to main.
No merge/main push.
No Cloudflare mutation.
No D1/R2/Access resources.
No credentials/secrets.
No deploy/DNS/production write.
No website feature/product mutation.
No S5+.
No Skills V0.2.
No PR #10 merge.

## Return gate

After Gate A:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- AUTHORIZED_SCOPE: WEB_REL_001_GATE_A_REVIEW_ONLY
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO
- all Cloudflare/remote/deploy/main-merge flags remain NO

Then stop.
