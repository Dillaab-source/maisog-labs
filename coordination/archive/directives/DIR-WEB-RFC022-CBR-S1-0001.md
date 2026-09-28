# Current Directive — RFC-022 CB-R Stage 1 Readiness (D-108)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-CBR-S1-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: b2b88c7b4bca0c3d92b62d4054c06b8ab0f419d9
target_turn: CLAUDE
authority_ref: D-108
applicable_review_id: ML-DEVOS-AS-134
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-108 and `ML-DEVOS-AS-134`.

## Objective

Produce CB-R Stage 1 release-readiness evidence for RFC-022 Tier 1 without executing Gate C:
- one fresh release PR with exact-head CI;
- read-only release-state checks;
- a read-only production D1 inspection;
- AS132-F002 readiness and the content prerequisites.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; every action flag is `NO`.
- `main` is `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`, unless the readiness check reports otherwise.
- `public/index.html` SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

## Governing references

- **T0:** Protocol V2; D-108; live STATE; `ML-DEVOS-AS-134`.
- **T1:** `ML-DEVOS-RFC-022` §7 and §10 (CB-R); `ML-DEVOS-AS-132` (AS132-F002); D-102 (read-only Cloudflare precedent); D-094/D-099 (Gate C shape, for reference only).

## Exact execution scope

Allowed:
- open one `governance/maisoglabs-v0.1 → main` release PR and read its exact-head CI;
- read-only GitHub checks;
- read-only production D1 queries (SELECT and PRAGMA only) on database `45b87574-e573-4e0f-9bb6-fbba2df29523`;
- one Protocol V2 Builder return.

Not allowed:
- merging the PR (Gate C);
- any D1 write or remote migration;
- content publication;
- Cloudflare, Access or DNS changes; deployment; Gate D; promotion;
- PR #7 or PR #10 action.

## SENTINEL Sync

- **Authority:** D-108 (Paulo).
- **Context:** AS-134 accepted the implementation; CB-R is a separate release decision.
- **Capability:** read-only production inspection plus one release PR.
- **Execution:** Stage 1 readiness only.
- **Evidence:** exact-head CI, production schema/content state, AS132-F002 status, and the content prerequisites.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- In this repository "Gate C" means the protected `main` merge. D-108 authorizes Gate C readiness only; the merge is a separate Paulo authorization.
- The release PR's head is the governance branch, so publishing the return advances the PR head. The return reports the CI result for both the reviewed head and the final head.

## Instructions

1. Bootstrap.
2. Open the release PR and record its exact-head CI.
3. Run the read-only checks, including production D1.
4. Evaluate AS132-F002 and the content prerequisites. Anything missing is `NOT READY`.
5. Publish the return.

## Validation and evidence

- The PR number and head SHA; the CI result on that exact head.
- `main` SHA; the diff summary; `public/index.html` SHA.
- Production D1: applied migrations, the `0006` column state, published projects, and contact settings.
- AS132-F002: `READY` or `NOT READY`, with reasons.
- Eternal Eggs copy and email deliverability: found or `NOT READY`.

## Stop conditions

- Any check would require a write, a migration, a merge or a Cloudflare change.
- Production state contradicts the repository in a way that would require action.

## Next action

Publish the Stage 1 readiness handoff. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`.
