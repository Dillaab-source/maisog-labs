# Current Directive — D-130 Gate C (protected merge only)

```yaml
schema_version: 1
directive_id: DIR-WEB-D130-GATE-C-0001
cycle_id: MAISOGLABS_WEB_D129_HOMEPAGE_COPY
issue_parent_commit: a5af6f43bc2046c4111b25959904423ebe2f9fe9
target_turn: CLAUDE
authority_ref: D-130
applicable_review_id: ML-DEVOS-AS-157
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-130 and `ML-DEVOS-AS-157`. Claude/Builder prepared it as mechanical publisher of D-130.

## Objective

Open one protected release PR `governance/maisoglabs-v0.1` → `main` with head `FINAL_GATE_C_HEAD` (the commit publishing this directive). Merge it with one normal merge commit pinned to that head, only if every D-130 pre-merge check passes. Verify that production is unchanged, and return.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MAIN_MERGE_AUTHORIZED: YES` and every other action flag `NO`.
- Read-only preflight at `a5af6f4`, before issue:
  - `main` = `97ca982c…`; merge base `b99353e…`.
  - `git merge-tree --write-tree main governance` has no conflicts. The merged tree `f15b966…` equals the governance tree, and `main`'s tree equals the merge base's tree (`45eeb31…`), so the merge cannot regress `main`.
  - Active production: deployment `b0f11606…`, version `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` @ 100%.

## Governing references

- **T0:** D-130; live STATE; `ML-DEVOS-AS-157`.
- **T1:** D-129; D-122 / `H-WEB-V101-GATE-C-0001` (Gate C precedent); `ML-DEVOS-RFC-022` / `worker/bridge/inject.mjs`; `OBL-017`, `OBL-018`, `OBL-023`.

## Exact execution scope

Allowed:
- Create one PR (ready for review) and read PR, CI and ruleset status.
- Cloudflare GET reads of deployments, versions and builds.
- One `merge_method: merge` with `expectedHeadSha` = `FINAL_GATE_C_HEAD`.
- One Protocol V2 Builder return on the governance branch, after the merge.

Not allowed:
- any push to the governance branch between `FINAL_GATE_C_HEAD` and the merge;
- rebase, reset, force push, squash, cherry-pick, direct push to `main`, auto-merge, protection bypass;
- Gate D, deploy, traffic change; D1/R2; content, project, `site_settings`; DNS, Access, bindings, secrets, migrations;
- any change to the D-129 candidate; PR #7 or PR #10 actions.

## SENTINEL Sync

- **Authority:** D-130 (Paulo), after `ML-DEVOS-AS-157`.
- **Context:** the D-129 candidate is accepted and visually accepted; production serves `8fd31f47…`.
- **Capability:** GitHub PR and merge through the connected integration; Cloudflare GET only.
- **Execution:** issue → CI on the head → the 13 pre-merge checks → pinned merge → post-merge verification → return.
- **Evidence:** PR, CI runs, merge commit and parents, the `main` tree, homepage and bridge values, production version before and after.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **Divergence count:** D-130 records the Architect's "23 ahead / 7 behind". A full-history count gives 23 ahead and 48 behind: `main` carries earlier pre-governance history that is already contained content-wise, since `main`'s tree equals the merge base's tree. This is not a stop condition; the merge is clean and non-regressing.
- **Merge commit placement:** the merge commit will exist only on `main`; the return is published on the governance branch afterwards, as in D-122.

## Instructions

1. Bootstrap. Confirm this commit is `FINAL_GATE_C_HEAD` and the branch has not moved.
2. Open the PR; wait for `test-and-build` on the exact head.
3. Run the 13 D-130 pre-merge checks immediately before merging; record the active production version.
4. Merge (pinned); verify post-merge; confirm production is unchanged.
5. Publish the return with `MAIN_MERGE_AUTHORIZED: NO`.

## Validation and evidence

D-130 § Pre-merge checks and § Post-merge verify in full.

## Stop conditions

- Any pre-merge check fails.
- The PR is not cleanly mergeable, or the merged tree differs from the expected tree.
- The governance branch moves before the merge.
- Production traffic changes.

## Next action

Publish `H-WEB-D130-GATE-C-0001`. Archive and deselect this directive, reset `MAIN_MERGE_AUTHORIZED` to `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.
