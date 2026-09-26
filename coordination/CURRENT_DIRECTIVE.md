# Current Directive — WEB-REL-002 Gate C: Protected Merge Without Promotion

```yaml
schema_version: 1
directive_id: DIR-WEB-REL-002-GATE-C-0001
cycle_id: MAISOGLABS_WEB_REL_002_GATE_C
issue_parent_commit: 7e911f3480eae7df9777140d4850398ba90a32ca
target_turn: CLAUDE
authority_ref: D-085
applicable_review_id: ML-DEVOS-AS-114
sentinel_disposition: CLEAR
su_mode: ESCALATED_RESEARCH
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, `D-085`, `ML-DEVOS-AS-114`, the AS-113 release shape and this directive. Anything outside that intersection is a stop condition.

## Objective

Execute WEB-REL-002 Gate C for PR #13: perform only the minimum draft-to-ready transition, then merge the freshly verified exact final head through the normal protected GitHub pull-request path using a merge commit. Verify that the merge may upload a Worker version but does not promote it.

## Preconditions

- Protocol V2 checker passes on exact authoritative tip `7e911f3480eae7df9777140d4850398ba90a32ca`.
- PR #13 is open, draft and unmerged; pre-directive head is `7e911f3480eae7df9777140d4850398ba90a32ca`.
- `main` is `882ad253b5dbec06b209d1ee1a2a54b21b392e2e`.
- Exact-head `test-and-build` is successful.
- `main-protection` remains active on `refs/heads/main`, requires a pull request and `test-and-build`, and blocks deletion and non-fast-forward updates.
- Fresh live Cloudflare evidence is exactly as recorded below.
- Release-scope drift after AS-114 is governance-only; no protected product/runtime path changed.

## Governing references

- **Authority:** `D-085`.
- **Gate B acceptance:** `ML-DEVOS-AS-114`.
- **Release shape:** `ML-DEVOS-AS-113`, `docs/release/WEB_REL_002_RELEASE_SCOPE_REVIEW.md`.
- **Protocol:** `ML-DEVOS-RFC-020`, `brain/protocols/CONTEXT_BOOTSTRAP.md` §10.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`, including OBL-017 and OBL-018.

## Exact execution scope

**Allowed:**
- the Protocol V2 directive-issue and return commits on `governance/maisoglabs-v0.1`;
- read-only GitHub and Cloudflare verification;
- PR #13 transition from draft to ready for review;
- one normal protected PR #13 merge, method `merge`, guarded by the freshly verified exact final head SHA;
- observation of the resulting Cloudflare Workers build, uploaded inactive version and active deployment.

**Not allowed:**
- no auto-merge, ruleset bypass, force push, squash or rebase merge;
- no Worker version promotion, deployment, rollback or configuration mutation;
- no D1, R2, Access, DNS, domain or production-data mutation;
- no product/runtime implementation change;
- no V2B, S6/S7 resumption or D-068 mutation;
- no action on PR #7 or PR #10.

## SENTINEL Sync

Fresh evidence at issue parent `7e911f3480eae7df9777140d4850398ba90a32ca`:

- STATE: Protocol V2, `TURN: PAULO`, AS-114 controlling, no current directive or handoff, all action flags NO.
- PR #13: open, draft, unmerged; head `7e911f3480eae7df9777140d4850398ba90a32ca`; base/main `882ad253b5dbec06b209d1ee1a2a54b21b392e2e`; `mergeable: true`; `mergeable_state: clean`; 272 changed files; no inline review threads; no reviews; auto-merge null.
- CI: `test-and-build` completed successfully on exact head `7e911f3480eae7df9777140d4850398ba90a32ca`.
- Protection: active `main-protection` ruleset, ID `23740878`, includes `refs/heads/main`, requires PR and `test-and-build`, blocks deletion and non-fast-forward updates. A pull-request bypass capability exists and must not be used.
- Cloudflare Worker build configuration, read live through the authenticated Cloudflare API for script tag `e263291dd91d4697bcc772fff88fc8f7`: GitHub repository `Dillaab-source/maisog-labs`, production branch `main`; production trigger includes `main` and all paths; production build `npm run build`; production deploy command exactly `npx wrangler versions upload`; non-production trigger includes all branches except `main` and also uses `npx wrangler versions upload`; previews disabled. No configured command promotes traffic.
- Pre-merge active deployment `e51d40d4-a063-47c5-a46f-70beeee4c03e`: Version `a28ee2e9-a9a0-4528-b89f-07e0c827be2b`, 100% traffic, created `2026-09-21T01:37:48.044696Z`.
- Latest relevant inactive upload before merge: Version `84dd8596-3fa1-4d95-9968-b5436894b513` (number 728), created `2026-09-25T23:48:22.588573Z`, triggered by `version_upload` for alias `governance-maisoglabs-v0-1`.
- Post-AS-114 delta `6bcda7683ffe0d761ff02d497ed3ed2290c36816..7e911f3480eae7df9777140d4850398ba90a32ca` is the AS-114/coordination publication only; none of `app/**`, `components/**`, `data/**`, `lib/**`, `worker/**`, `migrations/**`, `public/**`, `.github/workflows/**`, `wrangler.jsonc`, `package.json`, `package-lock.json`, or `next.config.mjs` changed.
- PR #7 remains open and unmerged on its own branch. PR #10 remains open, draft and DO NOT MERGE. S6 remains parked at AS-103, O1/O2 remain open and D-068 remains suspended.

Disposition: `CLEAR`.

## SU Contradiction Check

Mode `ESCALATED_RESEARCH` because this action merges into protected `main` and triggers the production-branch Worker build.

Disposition `CLEAR_WITH_NOTES`:

1. The directive-issue commit necessarily advances the PR head. Merge authority is not bound to the stale pre-directive head; it becomes effective only after the new exact head passes CI, mergeability, unchanged-main and release-scope rechecks.
2. The Cloudflare production trigger will run after merge. Its exact deploy command is `npx wrangler versions upload`, which uploads a version without promoting active traffic.
3. The GitHub identity can bypass in pull-request mode. This capability must not be used.
4. If active production traffic changes after merge, classify a release-governance incident and stop without rollback or repair.

## Instructions

1. Publish this directive as one Protocol V2 coordination commit parented on the issue parent.
2. Re-bootstrap at the new exact PR head. Confirm the only delta from the issue parent is Gate C decision/directive/state bookkeeping.
3. Mark PR #13 ready for review. Do not enable auto-merge or edit unrelated PR content.
4. Re-read PR #13. Wait for `test-and-build` success on the new exact head; require clean mergeability, unchanged main, no new reviews/threads requiring disposition, auto-merge null, and unchanged release scope.
5. Immediately before merge, freshly re-read the active Cloudflare production Version ID and require `a28ee2e9-a9a0-4528-b89f-07e0c827be2b` at 100%.
6. Merge PR #13 using the normal protected PR path, method `merge`, with the expected exact-head guard. Do not use bypass. If the head or main changes, stop and re-verify.
7. Record merged status, merged head, merge commit, new main, protection state, resulting Cloudflare build and uploaded Version ID.
8. Freshly re-read the active production Version ID. It must still be `a28ee2e9-a9a0-4528-b89f-07e0c827be2b` at 100%.
9. If the active Version ID changed, classify a release-governance incident and stop. Do not rollback, deploy, promote or repair.
10. If successful, publish the Protocol V2 return required below.

## Validation and evidence

- GitHub PR, review-thread, review, check-run, workflow-run and ruleset API reads.
- Cloudflare Workers Builds configuration/triggers API reads.
- Cloudflare Worker deployments and versions API reads immediately before and after merge.
- Exact Git diffs from AS-114 reviewed head, directive issue parent and final PR head.
- Protocol V2 checker before both publications.

## Stop conditions

Stop if any of these occurs:

- the live production deploy command differs from or is ambiguous relative to `npx wrangler versions upload`;
- PR #13 head or main changes outside the bounded Gate C bookkeeping;
- product/runtime release content changed after AS-114 acceptance;
- exact-final-head `test-and-build` is not successful;
- PR #13 is not cleanly mergeable through the normal protected path;
- the merge would require bypass, auto-merge, force push, squash or rebase;
- the pre-merge active Version ID changes;
- post-merge active Version ID differs from the pre-merge baseline;
- any forbidden production/resource action would be required;
- stale tip, protocol mismatch or checker failure.

## Next action

On successful merge and invariant verification, publish one Protocol V2 return commit containing:

- a bounded `CURRENT_HANDOFF` with exact pre/post evidence;
- this directive archived byte-for-byte with provenance and index entry;
- `CURRENT_DIRECTIVE: NONE` and empty directive selectors;
- `MAIN_MERGE_AUTHORIZED: NO` and every other action flag NO;
- `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`, `IMPLEMENTER_ACTION_REQUIRED: NO`, `PAULO_DECISION_REQUIRED: NO`.

Then stop.
