# Current Directive — WEB Release Readiness / Release-Scope Review

```yaml
schema_version: 1
directive_id: DIR-WEB-RELEASE-READINESS-0001
cycle_id: MAISOGLABS_WEB_RELEASE_READINESS_REVIEW
issue_parent_commit: 2cdbf4468d500163f84ab9a06c5232b6614f34b8
target_turn: CLAUDE
authority_ref: D-083
applicable_review_id: ML-DEVOS-AS-112
sentinel_disposition: CLEAR
su_mode: ESCALATED_RESEARCH
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of:
- live `coordination/STATE.md`;
- `D-083`;
- `ML-DEVOS-AS-112`;
- this directive.

Anything outside that intersection is a stop condition. The Builder published this directive as mechanical publisher of Paulo's `D-083` authorization.

## Objective

Produce a repository-grounded release-readiness / release-scope recommendation for the accepted website state, with the exact outputs `D-083` lists.

This is planning and inspection only.

## Preconditions

- A fresh Protocol V2 bootstrap from the tip that publishes this directive.
- STATE shows `TURN: CLAUDE`, `CURRENT_DIRECTIVE: ACTIVE` bound to this header, and all action flags `NO`.
- `origin/main` is fetched and resolved to an exact SHA at review time.
- D-068 stays untouched.

## Governing references

- **Authority:** `D-083`.
- **Controlling state:** `ML-DEVOS-AS-112`, which accepted V2A.
- **Release precedent:**
  - `D-054`–`D-057`;
  - `ML-DEVOS-AS-070`–`ML-DEVOS-AS-074` (PR #12 / WEB-REL-001, GC-F001, D-057 decoupling verification);
  - `docs/release/WEB_REL_001_*`.
- **Accepted website work:** `ML-DEVOS-AS-106` (Website Redesign V1), `ML-DEVOS-AS-112` (V2A).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`, specifically OBL-017 and OBL-018.

## Exact execution scope

**Read-only inspection:**
- git history, trees and diffs of `origin/main` and `governance/maisoglabs-v0.1`;
- `.github/workflows/**`, `wrangler.jsonc`, `package.json`, `next.config.mjs` and the build output;
- local `npm test` / `npm run build` for evidence.

**Writes:**
- one planning artifact, `docs/release/WEB_REL_002_RELEASE_SCOPE_REVIEW.md`;
- the Protocol V2 return records: `CURRENT_HANDOFF`, STATE and the directive archive.

**Not allowed:**
- no product/runtime/test/config change;
- no branch or PR creation;
- no merge, push to `main`, deploy, preview trigger, or Cloudflare/D1/R2 mutation.

## SENTINEL Sync

Snapshot `2cdbf4468d500163f84ab9a06c5232b6614f34b8`, from a fresh `--session-protocol 2` bootstrap (exit 0).

**Live state:**
- `TURN: PAULO`, `STATUS: ARCHITECT_APPROVED`;
- scope `AS112_SPATIAL_DESIGN_CONTROLS_V2A_ACCEPTED_PAULO_NEXT_DECISION_ONLY`;
- `CURRENT_DIRECTIVE: NONE`, `CURRENT_HANDOFF: NONE`;
- all flags NO.

**Checks:**
- **Main:** `origin/main` = `882ad253b5dbec06b209d1ee1a2a54b21b392e2e`. That is the PR #12 merge commit, with parents `8878492…` and `3262dba…`. Its tree equals `3262dba`, which is an ancestor of the governance tip. Governance is therefore exactly 127 commits ahead of the PR #12 release content, and main has no content absent from governance.
- **Obligations:** OBL-017 (separate production gating) and OBL-018 (PR #10) are OPEN and apply.
- **Deploy separation:** D-057's fail-closed precondition was recorded as satisfied in `ML-DEVOS-AS-074`: production Git builds use `npx wrangler versions upload`, with no promotion. The Builder cannot re-verify that Cloudflare dashboard state from here.

Disposition `CLEAR`.

## SU Contradiction Check

Mode `ESCALATED_RESEARCH`. The review touches a production/deployment path (the RFC-020 §12 trigger), though no action is taken. Disposition `CLEAR_WITH_NOTES`.

The review itself must challenge each `D-083` SU item.

**Notes:**
1. The Cloudflare build configuration is external state. The AS-074 finding is Architect evidence from 2026-09. Drift since then is unverifiable from the repository and becomes a deploy-gate precondition.
2. PR #12 established the precedent of merging the whole governance branch, so `main` already carries governance, DevOS and S5 artifacts. Selective release must be judged against that history.
3. The review must not open a PR, because opening one triggers Cloudflare preview builds (D-055).

## Instructions

1. Classify every path in `git diff origin/main <governance tip>` into the six `D-083` categories, with counts and representative paths.
2. Determine which changes can affect the production build or Worker bundle: `next build` inputs, `worker/**`, `wrangler.jsonc`, `package*.json`, workflows and assets. Separately determine which cannot.
3. Evaluate a direct governance→main merge against a bounded website-release branch, covering:
   - history/ancestry;
   - future merge divergence;
   - CI parity;
   - S6/DevOS exposure in the deployed bundle as opposed to repository history.
4. Recommend one release shape. State:
   - the included and excluded scope;
   - PR requirements;
   - the CI, merge-gate, deploy-gate and runtime-verification requirements;
   - rollback considerations;
   - blockers.
5. Write the artifact and return through Protocol V2.

## Validation and evidence

- Exact SHAs; a reproducible path classification (the command is recorded); and `npm test` / `npm run build` on the governance tip (`ACTOR_REPORTED`).
- The Worker-bundle input analysis, and a `git diff --check` of the artifact.
- A Context Bootstrap check-only run before publishing.

## Stop conditions

Stop if any of these is needed or arises:
- any merge, PR, branch push other than to the governance branch, deploy, preview, or Cloudflare/D1/R2 action;
- any product/runtime/test/config edit;
- a stale tip;
- a protocol mismatch;
- a finding that release needs implementation work. In that case record it as a blocker and return to Paulo.

## Next action

The Builder performs the review, then publishes one Protocol V2 return commit containing:
- the artifact;
- `CURRENT_HANDOFF`;
- the directive archived;
- `CURRENT_DIRECTIVE: NONE`;
- `TURN: ARCHITECT`.

Then it stops.
