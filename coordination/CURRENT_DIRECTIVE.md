# Current Directive — RFC-022 Gate C (D-109)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-GATE-C-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 52026f7806f92e867737599fc4e5992e2ae6e8ef
target_turn: CLAUDE
authority_ref: D-109
applicable_review_id: ML-DEVOS-AS-135
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-109 and `ML-DEVOS-AS-135`.

## Objective

Execute RFC-022 Gate C: merge PR #16 into `main` through the protected PR path, without production promotion, and prove that production traffic is unchanged.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MAIN_MERGE_AUTHORIZED` is the only `YES` flag.
- `main` is `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- The reviewed PR head is `52026f7806f92e867737599fc4e5992e2ae6e8ef`. The final head is this directive's publication commit.
- The homepage SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- The expected active production version is `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.

## Governing references

- **T0:** Protocol V2; D-109; live STATE; `ML-DEVOS-AS-135`.
- **T1:** `ML-DEVOS-RFC-022` §10 (CB-R); D-108; `ML-DEVOS-AS-134`; D-094/D-099 (Gate C precedent); D-055.

## Exact execution scope

Allowed:
- mark PR #16 ready for review;
- read CI, the PR and the Cloudflare deployment state;
- one merge of PR #16 (`merge_method: merge`, `sha` = final head);
- observe the Workers Build;
- one Protocol V2 Builder return on `governance/maisoglabs-v0.1`.

Not allowed:
- Gate D; `wrangler versions deploy`; promotion; traffic change; rollback;
- remote `0006`; D1 writes; content publication; R2;
- Cloudflare binding, Access, DNS, secret or environment changes;
- direct push to `main`; force; squash; rebase; auto-merge; protection bypass;
- PR #7 or PR #10.

## SENTINEL Sync

- **Authority:** D-109 (Paulo).
- **Context:** AS-135 accepted the readiness evidence; PR #16 is the correct release PR.
- **Capability:** one protected merge.
- **Execution:** Gate C only.
- **Evidence:** final-head CI, the merge commit, the Workers Build, and pre-merge active version = post-merge active version.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- Merging to `main` triggers a `main` Workers Build that uploads a new version but, as at D-094/D-099, does not deploy it. If the post-merge active version differs from the pre-merge one, that is a stop condition and must be reported. The Builder does not roll back without authority.
- `0006` is not applied in production. That is harmless while the new version receives no traffic.

## Instructions

1. Bootstrap.
2. Mark PR #16 ready. Wait for `test-and-build` SUCCESS on the exact final head.
3. Re-check mergeability, `main`, the release scope and the homepage hash. Record `PRE_MERGE_ACTIVE_VERSION_ID`.
4. Merge with a normal merge commit, pinned to the final head.
5. Observe the Workers Build. Record `POST_MERGE_ACTIVE_VERSION_ID` and compare.
6. Publish the return.

## Validation and evidence

- The final head SHA and its CI result.
- The merge commit SHA and its parents.
- The Workers Build ID and the new version ID.
- Pre- and post-merge active version, and whether they are equal.
- `main` after the merge; the homepage hash.

## Stop conditions

- Any CI failure on the final head, `main` has moved, a merge conflict, or an unexpected release-scope difference.
- The post-merge active version differs from the pre-merge one: stop and report, without remediating.
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-RFC022-GATE-C-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
