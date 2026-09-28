# Current Directive — RFC-022 Gate C for the D-111 remediation (D-112)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-GATE-C-0002
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 9abb5f61cd6d18ca836cfc254df7a8236cc105ae
target_turn: CLAUDE
authority_ref: D-112
applicable_review_id: ML-DEVOS-AS-138
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-112 and `ML-DEVOS-AS-138`.

## Objective

Execute RFC-022 Gate C for the D-111 remediation accepted by AS-138: merge `governance/maisoglabs-v0.1` into `main` through one fresh protected PR, without production promotion. Prove production traffic is unchanged, and record the AS138-F001 Access policy identity check.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MAIN_MERGE_AUTHORIZED` is the only `YES` flag.
- `main` is `fda42e04d18b960d8212d49616f96b657a5c6bf3`.
- The accepted implementation is `fde97b6..9abb5f6`. The final PR head is this directive's publication commit.
- The homepage SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- The expected active production version is `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.

## Governing references

- **T0:** Protocol V2; D-112; live STATE; `ML-DEVOS-AS-138`.
- **T1:** `ML-DEVOS-RFC-022` §10 / §10.1 (CB-R); D-111; D-109 (Gate C precedent); D-106 (canonical admin identity).

## Exact execution scope

Allowed:
- open one fresh PR `governance/maisoglabs-v0.1 → main`;
- read CI, the PR and Cloudflare deployment state (read-only);
- read the `maisoglabs.com/admin` Access application's policies (read-only);
- one merge of that PR (`merge_method: merge`, `sha` = final head);
- observe the Workers Build;
- one Protocol V2 Builder return on `governance/maisoglabs-v0.1`.

Not allowed:
- Gate D; `wrangler versions deploy`; promotion; traffic change; rollback;
- any production D1 write; content, `site_settings` or email changes;
- Access policy, DNS, R2, binding, secret or environment changes;
- direct push to `main`; force; squash; rebase; auto-merge; protection bypass;
- PR #7 or PR #10.

## SENTINEL Sync

- **Authority:** D-112 (Paulo).
- **Context:** AS-138 accepted the D-111 remediation and recorded AS138-F001.
- **Capability:** one protected merge plus read-only checks.
- **Execution:** Gate C only.
- **Evidence:** final-head CI, the merge commit, the Workers Build, pre-merge active version = post-merge active version, and the Access policy identity result.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- The merge triggers a `main` Workers Build that uploads an inactive version (`versions upload`), as at D-109. A changed active version is a stop condition, reported without remediation.
- An AS138-F001 mismatch does not stop Gate C. It makes Gate D NOT READY, and is reported, not fixed.

## Instructions

1. Bootstrap.
2. Open the PR. Wait for `test-and-build` SUCCESS on the exact final head.
3. Re-check mergeability, `main`, the release scope and the homepage hash. Run the AS138-F001 check. Record `PRE_MERGE_ACTIVE_VERSION_ID`.
4. Merge with a normal merge commit, pinned to the final head.
5. Observe the Workers Build. Record `POST_MERGE_ACTIVE_VERSION_ID` and compare.
6. Publish the return.

## Validation and evidence

- The final head SHA and its CI result.
- The merge commit SHA and its parents; the release diff.
- The Workers Build ID and the new version ID.
- Pre- and post-merge active version, and whether they are equal.
- `main` after the merge; the homepage hash.
- The Access policy's allowed identities compared with `paulo.maisog@maisoglabs.com`.

## Stop conditions

- Any CI failure on the final head, `main` has moved, a merge conflict, or an unexpected release-scope difference.
- The post-merge active version differs from the pre-merge one: stop and report, without remediating.
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-RFC022-GATE-C-0002`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
