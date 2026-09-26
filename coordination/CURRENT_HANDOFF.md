# Current Handoff — D-093 Gate C Protected Main Merge (D-094)

```yaml
schema_version: 1
handoff_id: H-WEB-D093-GATE-C-0001
cycle_id: MAISOGLABS_WEB_D093_GATE_C
input_base_commit: 753493afb9ce71f856365eedf58bc699e2b5b7f5
review_target_commit: 753493afb9ce71f856365eedf58bc699e2b5b7f5
applicable_review_id: ML-DEVOS-AS-120
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

**Evidence classes:**
- GitHub and Git facts: read by the Builder.
- Cloudflare active-deployment readings: owner-reported by Paulo from the Cloudflare dashboard, because this cloud session cannot reach the Cloudflare API.
- Workers Builds build and version IDs: read from the Cloudflare GitHub App check runs.

## Objective

Execute `DIR-WEB-D093-GATE-C-0001` (D-094):
1. merge the reviewed D-093 homepage release candidate into `main` through a fresh protected release PR with a normal merge commit;
2. observe the resulting `main` Workers Build version upload;
3. prove production traffic did not move.

Gate C only. No production promotion.

## Result

**Gate C completed. Production did not move.**

| Item | Value |
|---|---|
| D-094 / directive publication | `753493afb9ce71f856365eedf58bc699e2b5b7f5` (Paulo, `docs(sync): authorize D-093 Gate C transition`) |
| Architect acceptance | `ML-DEVOS-AS-120` (`READY TO COMMIT: YES`), published in the same commit |
| Reviewed implementation candidate | `f2c13aa3dbc65b3829f1a8f64437a929392369a5` |
| Release PR | **#14** (fresh; PR #13 not reused) |
| PR base (exact) | `main` `aebc881e8890c00090d714602591138a045bd3b0` |
| PR final head (exact) | `753493afb9ce71f856365eedf58bc699e2b5b7f5` |
| Merge commit on `main` | `7d22a96d10b5e24f5296795c2b049f77093386c3`, parents `aebc881` and `753493a`, merge method `merge`, merged with expected head pinned |
| Merge tree | identical to `753493a`: `git diff 753493a 7d22a96` is empty |
| Homepage artifact SHA-256 on `main` | `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` (approved) |
| **PRE_MERGE_ACTIVE_VERSION_ID** (owner-read immediately before merge) | `a667fc09-12d1-4fde-a75d-5d660729baa3` @ **100%** |
| `main` Workers Build | `8abe1ba1-4b7d-45d3-84b8-97f2beea8cfe`: success (check run `108500903744`, completed 2026-09-26T22:35:18Z) |
| New uploaded Worker Version | `f473c170-b39c-4d7b-85ad-a99c5208d539`. Owner-reported: version 758, alias `main`, trigger `version_upload`, preview URL `https://f473c170-maisog-labs.paulomaisog284.workers.dev`, **inactive** |
| **POST_MERGE_ACTIVE_VERSION_ID** (owner-read after the build) | `a667fc09-12d1-4fde-a75d-5d660729baa3` @ **100%** |
| Pre = post | **identical** |

## Changed files

Gate C changed no website, runtime or artifact file. `main` received the already-reviewed tree of `753493a` through the merge commit `7d22a96` (its tree is identical to `753493a`). This Builder return commit changes only:

- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to `TURN: ARCHITECT`, with every action flag `NO`.
- `coordination/archive/directives/DIR-WEB-D093-GATE-C-0001.md` and `.provenance.json`: the byte-identical archive of the executed directive.
- `coordination/archive/directives/README.md`: the archive index row.

## Preconditions verified before the merge

1. **Protocol V2 bootstrap:** passed at `753493a`. STATE selected `DIR-WEB-D093-GATE-C-0001`, `TURN: CLAUDE`, `MAIN_MERGE_AUTHORIZED: YES`, every other flag `NO`.
2. **Governance head:** `753493a`. Its only commit after `f2c13aa` is the governance transition, with no runtime or product file changed after `f2c13aa`.
3. **`main`:** unchanged at `aebc881`. It is not an ancestor of the governance head, but its tree equals the PR #13 head `7ee4312` (the merge base), so the merge was clean.
4. **Release diff:** 433 files and 23 commits.
   - Runtime-facing changes: the homepage (`public/index.html`, `public/assets/**`, `public/v10/**`, removal of `app/page.js` and `components/site/**`), `app/journal/journal.css`, `app/layout.js`, `app/globals.css`, `data/site.js`, `lib/content/schema.mjs`, and tests.
   - Everything else is governance, evidence and design-reference records.
   - No changes to `worker/**`, `migrations/**`, `wrangler.jsonc`, `package*.json` or `.github/**`.
5. **Cloudflare build configuration (owner-verified read-only, recorded in D-094):** production branch `main`; version command `npx wrangler versions upload`.
6. **PR #14 state:**
   - `mergeable_state: clean`.
   - No review threads.
   - One comment, from `cloudflare-workers-and-pages[bot]`, reporting the preview upload.
   - `main` is protected. Its ruleset details are not readable with the Builder's tools; GitHub reported no blocking requirement.
7. **Exact-final-head CI on `753493a`:**
   - `test-and-build` (`npm ci`, `npm test`, `npm run build`): SUCCESS on the pull-request run (job `108499140938`) and the push run (job `108498734102`).
   - Workers preview build `85426f99…`: success.
8. **Immediately before the merge:** `main`, the PR head and the governance head were re-read and matched `aebc881` / `753493a` / `753493a`. Paulo's independent re-read reported the same values.
9. PR #7 was not touched. PR #10 was not merged.
10. D-068 untracked files were untouched. S6 and S7 were untouched.

**Owner-clone notes:**
- The directive's "working tree clean" and "`stash@{0}` untouched" preconditions refer to Paulo's local clone. This cloud session did not touch that clone.
- AS-120 records that the Windows CRLF difference seen in that clone is a checkout representation only.

## Production invariant

No `wrangler versions deploy`, promotion, traffic shift, rollback or Cloudflare configuration change was run or requested. The `main` build only uploaded a version. Active production remained `a667fc09-12d1-4fde-a75d-5d660729baa3` at 100% before and after the merge.

## Tests and evidence

- GitHub Linux CI on the exact final head: `test-and-build` SUCCESS (PR run and push run).
- The GitHub merge API response confirmed the merge commit `7d22a96d10b5e24f5296795c2b049f77093386c3`.
- `main` re-read after the merge: `7d22a96`. Tree diff against `753493a`: empty.
- `public/index.html` on `main`: SHA-256 `2417f7e5…f9f9`.
- `main` check runs on `7d22a96`: an earlier `Workers Builds: maisog-labs` run (`108500789037`) stayed `in_progress` and was superseded. The completed run `108500903744` reported build `8abe1ba1…` and version `f473c170…`. That stale in-progress run is a GitHub status artifact, not a failed build.
- The Cloudflare active-deployment readings (pre and post) and the version-history entry are owner-reported.

## Unresolved findings and limitations

1. **Unverified by the Builder:** the Cloudflare active-deployment state was not read directly. The Builder has no Cloudflare API access in this environment. Pre and post readings are Paulo's dashboard observations, not Builder- or Architect-reproduced evidence.
2. **Branch protection:** `main` ruleset contents were not readable. The merge went through the normal PR merge API without bypass, with the expected head pinned.
3. **Production still serves the pre-merge version** `a667fc09…`. The D-093 homepage artifact is on `main` and in inactive version `f473c170…`, but it is not live until Gate D.
4. **Carried forward:**
   - AS-116 production `/api/journal` incident open;
   - D-093 artifact-native limitations (prototype content, mobile nav clipping, React development builds with in-browser Babel) accepted by AS-120;
   - S6 parked at ML-DEVOS-AS-103, O1 and O2 open;
   - D-068 held;
   - PR #7 and PR #10 unmerged.

## Evidence locations

- PR #14: `https://github.com/Dillaab-source/maisog-labs/pull/14`.
- Merge commit `7d22a96d10b5e24f5296795c2b049f77093386c3` on `main`.
- Check run `108500903744` (`main` Workers Build `8abe1ba1-4b7d-45d3-84b8-97f2beea8cfe`).
- CI job `108499140938` (PR head) and `108498734102` (push).
- `coordination/archive/directives/DIR-WEB-D093-GATE-C-0001.md`.

## Governing references

- **Authority:** D-094 (Gate C), D-093 (artifact).
- **Directive:** DIR-WEB-D093-GATE-C-0001 (archived).
- **Review:** ML-DEVOS-AS-120.
- **Related:** D-057 (merge and promotion are separate gates).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews the Gate C return under the next unused immutable Architect Sync ID after ML-DEVOS-AS-120.

Gate D (production promotion of a `main` version, e.g. `f473c170-b39c-4d7b-85ad-a99c5208d539`) is **not authorized**. It requires a separate explicit Paulo decision. The exact candidate operation, not performed:
1. re-read active production (expected `a667fc09…` @ 100%);
2. `npx wrangler versions deploy f473c170-b39c-4d7b-85ad-a99c5208d539@100% --yes` (single allocation, no `force`);
3. verify production read-only;
4. rollback target: `a667fc09-12d1-4fde-a75d-5d660729baa3`.
