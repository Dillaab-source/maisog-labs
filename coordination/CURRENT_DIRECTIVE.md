# Current Directive — D-098 Hardening Gate C Protected Main Release

```yaml
schema_version: 1
directive_id: DIR-WEB-D098-GATE-C-0001
cycle_id: MAISOGLABS_WEB_D098_GATE_C
issue_parent_commit: d2ed608139265dc58e75963e01634726fd7b2254
target_turn: CLAUDE
authority_ref: D-099
applicable_review_id: ML-DEVOS-AS-126
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-099 and `ML-DEVOS-AS-126`.

## Objective

Release the AS-126-accepted D-098 hardening tree from `governance/maisoglabs-v0.1` to `main` through one fresh protected PR with a normal merge commit. The `main` Workers Build may upload a new inactive version. Production traffic must not move.

## Preconditions

Immediately before the merge, all of the following must hold:
- Protocol V2 bootstrap passes, and STATE selects this directive with only `MAIN_MERGE_AUTHORIZED: YES`.
- `main` is `7d22a96d10b5e24f5296795c2b049f77093386c3`.
- The PR head equals the published D-099 transition head, and the governance branch has not moved.
- The release diff contains only the eight AS-126-accepted files plus governance/audit records. `migrations/**`, the homepage artifact, `package.json` and the lockfile are unchanged. The homepage SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- `npm test`, `npm run build` and `git diff --check` pass on the exact head.
- Exact-final-head `test-and-build` reports SUCCESS, and the Cloudflare Workers check succeeds if it runs.
- Active production is `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100% (`OWNER_REPORTED` by Paulo).
- The worktree is clean apart from the untouched D-068 draft.

## Governing references

- **T0:** Protocol V2; D-099; live STATE; `ML-DEVOS-AS-126`.
- **T1:** D-098; `coordination/archive/handoffs/H-WEB-AS116-HARDENING-0001.md`; D-094 Gate C precedent (`coordination/archive/handoffs/H-WEB-D093-GATE-C-0001.md`); `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed:
- one new PR from governance to `main`;
- read-only GitHub reads (PR, checks, protection);
- local tests and build;
- one merge through the GitHub PR merge API with `merge_method=merge` and the expected head SHA pinned;
- observing the `main` Workers Build;
- one Protocol V2 Builder return.

Not allowed:
- `wrangler versions deploy`, promotion, traffic changes or rollback;
- any D1, R2, binding, Access, DNS, secret or environment action;
- creating, deleting or renaming resources;
- squash, rebase, direct push, force, auto-merge or bypassing protection;
- reusing an old PR;
- PR #7, PR #10, S6/S7 or D-068.

## SENTINEL Sync

- **Authority:** D-099 (Paulo).
- **Context:** tree accepted by AS-126; `main` and production baseline bound.
- **Capability:** one protected merge only.
- **Execution:** PR, then CI, then the owner's pre-merge reading, then the merge, then the build, then the owner's post-merge reading.
- **Evidence:** GitHub PR, checks and merge (reproducible); production readings `OWNER_REPORTED`.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.

- The `main` build uploads a version with `DB.database_id` pinned. That equals the database production already binds, and uploading does not activate anything.
- If the build output were to indicate a deploy or promotion rather than `versions upload`, stop and report.

## Instructions

1. Bootstrap fresh and verify the preconditions.
2. Open the PR and record its number, base, head, mergeability, files, threads and checks.
3. Run the local tests and build on the exact head, and wait for exact-head CI.
4. Obtain Paulo's pre-merge production reading, then re-read `main`, the governance branch and the PR head.
5. Merge with a merge commit and the head pinned.
6. Confirm the merge SHA and tree equivalence, and wait for the `main` Workers Build.
7. Obtain Paulo's post-merge reading; it must equal the pre-merge reading at 100%.
8. Publish the return.

## Validation and evidence

PR identity, CI, merge commit, tree equivalence, release diff, Workers Build ID, new version ID, pre and post active version. Builder evidence is `ACTOR_REPORTED`; production readings are `OWNER_REPORTED`.

## Stop conditions

Stop without merging if:
- `main` or the governance branch moves unexpectedly;
- the diff contains unapproved files, or `migrations/**` or the homepage hash change;
- tests, the build or CI fail or are stale;
- a normal protected merge is unavailable;
- the Cloudflare build behavior is ambiguous;
- production is not on the expected single version at 100%;
- any production mutation would be needed.

## Next action

Publish the return `H-WEB-D098-GATE-C-0001`. Archive and deselect this directive, reset `MAIN_MERGE_AUTHORIZED` and every flag to `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`. Gate D remains unauthorized.
