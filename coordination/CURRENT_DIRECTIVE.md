```yaml
schema_version: 1
directive_id: DIR-WEB-D093-GATE-C-0001
cycle_id: MAISOGLABS_WEB_D093_GATE_C
issue_parent_commit: f2c13aa3dbc65b3829f1a8f64437a929392369a5
target_turn: CLAUDE
authority_ref: D-094
applicable_review_id: ML-DEVOS-AS-120
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

## Objective

Perform D-094 Gate C only: create a fresh release PR from `governance/maisoglabs-v0.1` to `main`, validate its exact final head, merge it through the normal protected GitHub merge-commit path, observe the resulting Workers version upload, and prove production traffic did not move.

## Preconditions

Freshly require:

- Protocol V2 bootstrap/checker passes;
- authoritative governance branch is the transition head produced from `f2c13aa3dbc65b3829f1a8f64437a929392369a5`;
- `main` has not unexpectedly moved from the reviewed baseline;
- working tree is clean;
- `stash@{0}` is untouched;
- canonical homepage artifact remains SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`;
- Cloudflare production branch remains `main`;
- Version command remains `npx wrangler versions upload`;
- active production Version ID is freshly captured immediately before merge;
- PR #7 is excluded;
- PR #10 is not merged;
- D-068 is untouched;
- S6/S7 remain parked.

## Governing references

- D-093.
- D-094.
- ML-DEVOS-AS-120.
- Protocol V2 / RFC-020.
- H-WEB-HOMEPAGE-ARTIFACT-0001 archived evidence.

## Exact execution scope

Allowed:

- one fresh `governance/maisoglabs-v0.1 -> main` release PR;
- PR metadata, diff, checks, review, protection and ruleset reads;
- GitHub Linux CI;
- normal protected merge commit;
- read-only Cloudflare build, version and deployment observation;
- Protocol V2 return publication.

`MAIN_MERGE_AUTHORIZED: YES` applies only to that exact Gate C PR after all preconditions pass. No product or runtime code modification is authorized.

## SENTINEL Sync

`CLEAR` only for the bounded Gate C path. Authority, capability and execution remain separated. Main merge authority does not imply deployment authority.

## SU Contradiction Check

`CLEAR_WITH_NOTES`. Treat any SHA drift, artifact drift, CI failure, build-command ambiguity, active-production change or unexpected PR content as a stop condition.

## Instructions

Create exactly one fresh PR from `governance/maisoglabs-v0.1` to `main`. Do not reuse PR #13.

Record the PR number, exact base, exact final head, complete release diff, mergeability, unresolved review conversations, and protection/ruleset state. Require exact-final-head Linux `test-and-build` SUCCESS. If bookkeeping advances the governance head, the final new head must pass CI.

Immediately before merge, re-read `main`, the PR head, the active production Version ID, the bounded release diff, and the applicable Cloudflare Version command evidence.

Merge only through the normal GitHub PR path with merge method `merge`. No squash, rebase, auto-merge, force, bypass, or direct push to `main`.

Wait for the resulting `main` Workers Build. Record its Build ID and uploaded Worker Version ID, then re-read the active production deployment. The post-merge active Version ID at 100% must equal the pre-merge active Version ID at 100%.

## Validation and evidence

Required success evidence:

- exact-final-head Linux CI;
- PR merge commit SHA;
- `main` points to the expected merge;
- Workers main build success;
- new uploaded Worker version identified and inactive;
- pre/post active production Version ID equality;
- canonical artifact SHA remains approved;
- no production promotion command was run.

## Stop conditions

Stop without repair if the governance or main identity unexpectedly moves; the artifact hash changes; final-head CI is not green; the PR contains unapproved runtime/product changes; the normal protection path cannot be used; Cloudflare configuration becomes ambiguous; production active Version changes unexpectedly; the build unexpectedly promotes traffic; any request would require `wrangler versions deploy`; or any D1/R2/Access/DNS/secret/environment mutation becomes necessary.

No automatic rollback is authorized.

## Next action

On successful Gate C, publish the Builder return; archive and deselect this directive; reset action flags to `NO`; and route to `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`. Gate D remains unauthorized.
