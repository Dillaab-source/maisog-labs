# D-140 Gate C — Protected Merge Directive

```yaml
schema_version: 1
directive_id: DIR-WEB-D140-GATE-C-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
issue_parent_commit: 4654af016ef9bcc8784cd1305c187f305c7ccb09
target_turn: CLAUDE
authority_ref: D-141
applicable_review_id: ML-DEVOS-AS-168
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

## Objective

Execute Paulo's D-141 Gate C authorization for the AS-168-accepted D-140 implementation: complete the protected PR review and, only when every required precondition is verified, merge the exact final PR head into `main` through the normal protected path. Then return evidence to the Architect. Stop before Gate D.

## Preconditions

- This directive and D-141 are selected together by Protocol V2 STATE at publication.
- The D-141 publication commit is the exact authorized Gate C source head. Any movement of `governance/maisoglabs-v0.1` after publication and before merge voids this exact-head authorization; stop for a new Owner decision.
- The accepted implementation is `d0bf93ee6951279180c97e5d4a10635be6c68339`, accepted by `ML-DEVOS-AS-168`. Confirm it is an ancestor of the exact PR head and its approved corrections are present.
- Read the exact PR head and current `main` baseline from GitHub immediately before review and merge.
- Confirm the PR is open, not draft, targets `main`, and uses `governance/maisoglabs-v0.1` as its source.

## Governing references

- D-141, Gate C only; exact-head authorization.
- ML-DEVOS-AS-168, acceptance of D-140 F001/F002.
- D-140 and its implementation commit `d0bf93ee6951279180c97e5d4a10635be6c68339`.
- `coordination/OPERATIVE_OBLIGATIONS.md`, including OBL-017 and OBL-023.
- Protocol V2: `brain/protocols/CONTEXT_BOOTSTRAP.md`, `brain/protocols/ARCHITECT_SYNC.md`, and `ML-DEVOS-RFC-020`; BC-4 mechanical publication requirements under `ML-DEVOS-RFC-023`.

## Exact execution scope

- Locate or create one pull request from `governance/maisoglabs-v0.1` to `main` for the exact D-141 publication head.
- Inspect the complete PR diff and changed-file list. Confirm it contains the accepted D-140 implementation and only the related governed history/records accumulated for this change; stop on unrelated or unexplained product changes.
- Read the actual `main` branch protection/ruleset and required review/check requirements. Do not infer protection from a successful past merge.
- Require every currently configured required check, including `test-and-build` when configured, to succeed on the exact final PR head. Confirm mergeability and every required approval/review condition.
- If and only if all preconditions pass, merge by the normal GitHub PR path as a normal merge commit, passing the exact PR head as the expected head. Do not use auto-merge.
- Verify the PR's merged state, merge commit, its parents, resulting `main` SHA, and accepted implementation presence on `main`.
- Publish one evidence-complete Builder handoff and route to the Architect. Reset all action flags to `NO` in the return transition.

## SENTINEL Sync

Disposition: `CLEAR_WITH_NOTES`.

The merge is explicitly authorized for one accepted source candidate through protected review. The production boundary remains separate: do not deploy, promote a Worker version, apply migration 0007 remotely, mutate production D1/R2, or change Cloudflare production configuration. The additive migration is source content only in this Gate C; production execution requires later, separate Owner authority.

## SU Contradiction Check

Mode: `BOUNDED_CONTRADICTION`.

Disposition: `CLEAR_WITH_NOTES`.

The accepted implementation and Paulo's Gate C authorization are consistent. The merge permission is limited to the exact final PR head; deployment and remote migration remain prohibited. No contradiction authorizes work beyond this PR and protected merge.

## Instructions

1. Confirm fresh governance and `main` refs; run the Protocol V2 checker at the published directive state.
2. Confirm the governance branch still equals the D-141 publication head. If it moved, stop; do not rebuild or extend the authorization.
3. Locate/create the single correctly based PR. Read its exact head, base SHA, changed files, commits, review state, checks and mergeability.
4. Inspect branch protection/rulesets and required checks/reviews. If any requirement is unavailable, unmet, failing, or ambiguous, stop without merging and return the blocker.
5. Confirm the complete diff is within D-140 implementation and its associated governance records. Confirm F001 and F002 corrections and generated fingerprints are included unchanged from the accepted implementation.
6. Wait for all required checks on the exact final PR head to complete successfully. Prior CI run `37419973994` is evidence for the accepted implementation commit, not a substitute for fresh required checks on the final PR head.
7. Merge only through GitHub's normal protected PR operation as a normal merge commit, with the exact PR head pinned. Never bypass protections or directly push to `main`.
8. Read back PR, merge commit and `main`; verify the accepted implementation is present. Do not perform or imply any production action.
9. Publish the bounded Gate C Builder handoff to the Architect with all requested evidence and all action flags reset to `NO`.

## Validation and evidence

Record the starting governance SHA, D-141 and directive IDs, PR number/URL, exact reviewed PR head, `main` baseline, complete changed-file list, branch-protection/review requirements, exact-head check names and results, merge method, merge commit and parents, resulting `main` SHA, and the governance return publication SHA. Distinguish direct GitHub observations from derived conclusions. Verify that production/deployment/migration flags remain `NO`.

## Stop conditions

Stop before merge if governance moves from the exact D-141 publication head; the accepted implementation is absent or altered; the PR includes unrelated changes; a required check/review/protection cannot be verified; any required check fails or is pending; mergeability is not clean; normal merge is unavailable; or any production/deployment action would be needed. Do not weaken, retry around, or bypass a failed gate.

## Next action

After a verified normal protected merge, publish the Gate C result and evidence to the Architect in one Protocol V2 Builder handoff, clear this directive, archive it byte-for-byte with provenance/index update, and reset every action-specific flag to `NO`. Stop. Gate D requires a separate Paulo decision.
