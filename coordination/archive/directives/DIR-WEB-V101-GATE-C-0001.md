# Current Directive — V10.1 Gate C (D-122)

```yaml
schema_version: 1
directive_id: DIR-WEB-V101-GATE-C-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: a9351c660ae4911c5f0536285560cb2c42befa65
target_turn: CLAUDE
authority_ref: D-122
applicable_review_id: ML-DEVOS-AS-146
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-122 and `ML-DEVOS-AS-146`.

## Objective

Merge the AS-146-accepted V10.1 promotion into `main` through one fresh protected release PR, pinned to `FINAL_GATE_C_HEAD` (this directive's publication commit), without any production deployment or traffic change.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MAIN_MERGE_AUTHORIZED` is the only `YES` flag.
- `main` is `405375998392e936b71181de387ae395b7d46e40`.
- `public/index.html` is SHA-256 `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc` (20,857 bytes), and `worker/bridge/inject.mjs` pins `220ce809…` / `20857` / `20116`.

## Governing references

- **T0:** Protocol V2; D-122; live STATE; `ML-DEVOS-AS-146` (Gate C readiness conditions).
- **T1:** D-121; `ML-DEVOS-AS-145` (atomic promotion invariant); D-112 / PR #17 (Gate C precedent); `OBL-017` (separate production deploy gate).

## Exact execution scope

Allowed:
- record `FINAL_GATE_C_HEAD` (the full SHA of this publication commit);
- open exactly one fresh PR `governance/maisoglabs-v0.1 → main`;
- read-only checks: GitHub (PR, CI, mergeability, ruleset) and Cloudflare (active deployment/version, Workers Builds; GET only);
- one normal merge commit through the protected PR path, pinned to `FINAL_GATE_C_HEAD`;
- one Protocol V2 Builder return on `governance/maisoglabs-v0.1` after the merge.

Not allowed:
- any governance-branch movement between `FINAL_GATE_C_HEAD` and the merge;
- PR #10 (or PR #7) use or modification;
- direct push, force push, squash, rebase, auto-merge, protection or ruleset bypass;
- Gate D; `wrangler versions deploy`; deployment, promotion, rollback or traffic change;
- any production D1/R2/Access/DNS/binding/secret/environment change; schema or migrations;
- project publication or activation; contact/`site_settings` changes; email publication;
- mobile remediation; `og:image`; unrelated cleanup.

## SENTINEL Sync

- **Authority:** D-122 (Paulo).
- **Context:** AS-146 accepted the atomic promotion preparation at `49984e7` and set the Gate C conditions.
- **Capability:** protected PR merge only.
- **Execution:** verify every bound value, merge pinned, observe production read-only.
- **Evidence:** PR, CI, merge commit and parents, `main` SHA, artifact identity, Workers Build/version, pre/post active version.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **Reviewed head vs final head:** AS-146 reviewed `49984e7`; this publication (and the AS-146 publication `a9351c6`) necessarily advance the branch. D-122 resolves this: `FINAL_GATE_C_HEAD` is bound, and the diff `49984e7..FINAL_GATE_C_HEAD` must be governance-only.
- **Merge vs production:** `main`'s Git integration uploads an inactive version (`npx wrangler versions upload`); that is not a deployment. The active production version must stay unchanged.

## Instructions

1. Bootstrap at `FINAL_GATE_C_HEAD`; record its full SHA.
2. Open the release PR; verify every D-122 pre-merge condition; inspect the changed-file set.
3. Record the active production version; merge with a normal merge commit pinned to `FINAL_GATE_C_HEAD`.
4. Record the post-merge evidence; confirm the active version is unchanged.
5. Publish the return.

## Validation and evidence

The D-122 "after merge" record list.

## Stop conditions

- Any bound value differs (main, head, artifact, constants, CI, mergeability, ruleset).
- `governance/maisoglabs-v0.1` moves after `FINAL_GATE_C_HEAD` before the merge.
- The active production version changes: stop and report without remediation.

## Next action

Publish `H-WEB-V101-GATE-C-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
