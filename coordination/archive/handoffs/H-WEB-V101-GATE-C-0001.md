# Current Handoff — V10.1 Gate C (D-122)

```yaml
schema_version: 1
handoff_id: H-WEB-V101-GATE-C-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: b99353e923607e63fb9677e22a54608d5e3e38cb
review_target_commit: b99353e923607e63fb9677e22a54608d5e3e38cb
applicable_review_id: ML-DEVOS-AS-146
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Evidence class: `ACTOR_REPORTED`, from live GitHub and Cloudflare API calls made in this session. Cloudflare reads were GET only.

## Objective

Execute `DIR-WEB-V101-GATE-C-0001` (D-122): merge the AS-146-accepted V10.1 promotion into `main` through one fresh protected release PR pinned to `FINAL_GATE_C_HEAD`, without any production deployment or traffic change.

## Result

**Gate C complete. Every D-122 bound value matched before the merge. The active production version is unchanged.**

| Item | Value |
|---|---|
| `FINAL_GATE_C_HEAD` (D-122 publication) | **`b99353e923607e63fb9677e22a54608d5e3e38cb`** (parent `a9351c6…`, the AS-146 publication) |
| PR | [Dillaab-source/maisog-labs#18](https://github.com/Dillaab-source/maisog-labs/pull/18), `governance/maisoglabs-v0.1 → main`, opened ready for review, merged |
| Final PR head | `b99353e923607e63fb9677e22a54608d5e3e38cb` |
| Base before merge | `main` `405375998392e936b71181de387ae395b7d46e40` (as bound) |
| Merge commit | **`97ca982c9e8f1e306aaa8c8a5198f43f8e00629e`**: a normal merge commit with parents `405375998392e936b71181de387ae395b7d46e40` and `b99353e923607e63fb9677e22a54608d5e3e38cb`, committed by GitHub 2026-09-29T19:57:40Z. Merged with `merge_method: merge` and `expectedHeadSha: b99353e…` |
| `main` after merge | `97ca982c9e8f1e306aaa8c8a5198f43f8e00629e`. Its tree `45eeb31a…` is identical to `FINAL_GATE_C_HEAD`'s tree |
| Homepage on `main` | `public/index.html` SHA-256 `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`, 20,857 bytes; bridge `220ce809…` / `20857` / `20116` |
| `PRE_MERGE_ACTIVE_VERSION_ID` | `862dc45e-9ad7-4324-80ae-912adbb6ce82` @ 100%, deployment `3fa32ba9-ae42-4023-9b8f-53c5178c2290`, read 19:57:29Z (11 s before the merge) |
| `main` Workers Build | `4eae04e3-02f3-4094-86bc-abc5f69b14d2`. Branch `main`, commit `97ca982c…`, source `push_event`, outcome `success`, 19:57:44–19:58:31Z. Deploy command `npx wrangler versions upload` |
| New inactive version | `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` (#867), alias `main`, `workers/triggered_by: version_upload`, created 19:58:24Z |
| `POST_MERGE_ACTIVE_VERSION_ID` | `862dc45e-9ad7-4324-80ae-912adbb6ce82` @ 100%, deployment `3fa32ba9…` (created 2026-09-28T21:09:06Z, unchanged), read 20:08:24Z |
| Pre = post | **YES**. The deployments list has 10 entries before and after, and the latest is unchanged |

## Tests and evidence

### Pre-merge verification (D-122 list)

| D-122 condition | Result |
|---|---|
| `main` is exactly `405375998392…` | yes. Re-read immediately before the merge, and GitHub's PR base SHA matched |
| PR head is exactly `FINAL_GATE_C_HEAD` | yes. PR #18 head `b99353e…`; `governance/maisoglabs-v0.1` was re-read as `b99353e…` immediately before the merge. The branch did not move between D-122 publication and the merge |
| Changes after `49984e7` are governance-only | yes. `49984e7..b99353e` touches only 9 files: `brain/DECISION_LOG.md`, `coordination/{ARCHITECT_REVIEW,CURRENT_DIRECTIVE,STATE}.md`, the `H-WEB-V101-PROMOTION-PREP-0001` archive, provenance and index row, and `devos/changes/architect-syncs/{ML-DEVOS-AS-146.md,README.md}` |
| `public/index.html` = `220ce809…` | yes, at `b99353e` (20,857 bytes, `</head>` at 20,116) |
| Bridge values `220ce809…` / 20857 / 20116 | yes, at `b99353e` |
| Cleanly mergeable | yes. GitHub `mergeable_state: clean`; `git merge-tree --write-tree` has no conflicts, and the merged tree equals the final head's tree |
| `main-protection` ruleset applicable | yes. Ruleset `23740878` `main-protection` is `enforcement: active` on `refs/heads/main`. Rules: `deletion`, `non_fast_forward`, `pull_request` (0 required approvals), `required_status_checks` `test-and-build` (integration 15368). It was read through GitHub's public rules API. It lists one bypass actor (repository role, `pull_request` mode); **no bypass was used** |
| `test-and-build` on the exact `FINAL_GATE_C_HEAD` | **success** on both runs. Push trigger: run `36622429425` / job `109590911046`, 19:53:33–19:56:11Z. Pull-request trigger: run `36622493451` / job `109591128272`, 19:54:08–19:56:50Z. Both `head_sha` are `b99353e…` |
| AS132-F003 changed-file inspection | done; see below |
| Active production version recorded before merge | yes: `862dc45e…` @ 100% |

Branch Workers Build of `b99353e`: `9016bfbc-a41a-4cb2-8417-3f6c36983b06`, `success`. It is a non-production branch upload (`2a507d0c…`, #866, alias `governance-maisoglabs-v0-1`), not a deployment.

### AS132-F003 — release changed-file inspection (`405375998392..b99353e`)

The release covers 21 commits, 170 files, +10,902/−639. Every file is added or modified; nothing is deleted or renamed.
- **V10.1 promotion:**
  - `public/index.html`; `public/v101/assets/*` (34);
  - `public/robots.txt`, `public/sitemap.xml`, `public/_headers`;
  - `worker/bridge/inject.mjs`, the only `worker/` file.
- **Tests:** `tests/homepage-artifact.test.mjs`, `tests/rfc022-bridge.test.mjs`, `tests/v101-candidate.test.mjs`.
- **Candidate and tooling (D-120):**
  - `candidates/v10.1/**`: `README.md`, `build-report.json`, `site/` including 34 assets, `vendor/`, and `evidence/` (harness, results, 32 screenshots);
  - `scripts/build-v101-candidate.mjs`.
- **Governance records:**
  - `brain/DECISION_LOG.md`; `coordination/{STATE,CURRENT_HANDOFF,CURRENT_DIRECTIVE,ARCHITECT_REVIEW}.md`;
  - directive and handoff archives with provenance and index rows (AS-139..AS-146 period);
  - `devos/changes/architect-syncs/ML-DEVOS-AS-139..146.md` and `README.md`.
- **Untouched:** `wrangler.jsonc`; `package.json` and the lockfile; `migrations/`; `app/`; every `worker/` file except `inject.mjs`; `.github/`.

### Post-merge production (Cloudflare API, GET only)

- **Active deployment:** unchanged, as recorded above. Public `https://maisoglabs.com/` at 20:08:30Z returned 200, 1,969,988 bytes, SHA-256 `2417f7e5…`: production still serves V10. `/v101/assets/data.f804d6673bf6.js` returns 404 there, because V10.1 is not live.
- **Inactive version:** the new `main` version `8fd31f47…` holds the V10.1 code. It receives no traffic.

### CI on `main`

`.github/workflows/ci.yml` triggers on `pull_request` → `main` and `push` → `governance/maisoglabs-v0.1` only. The merge commit's only check run is `Workers Builds: maisog-labs` (`109592890681`, success). The required `test-and-build` ran on the exact PR head, as the ruleset requires. The merged tree is identical to it.

### No Gate D

The Builder ran none of the following:
- `wrangler versions deploy`, deploy, promotion, rollback or traffic change;
- a D1 or R2 read or write; project publication or activation;
- a contact, `site_settings` or email change;
- an Access, DNS, binding, secret or environment change; a schema or migration change.

There was no direct push, force push, squash, rebase, auto-merge or bypass, and no PR #7 or PR #10 action. PR #10 is still open and draft with base `sentinel-handoff-base`; its head is the governance branch by design.

The only production-side effects are the automatic Workers Builds version uploads (`2a507d0c…` branch, `8fd31f47…` `main`). Both are inactive.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-V101-GATE-C-0001.{md,provenance.json}` (byte-for-byte, unchanged since issue at `b99353e`) and the index row.
- **Unchanged:** `coordination/OPERATIVE_OBLIGATIONS.md`.
- **Outside this commit:** the PR #18 merge (`main` → `97ca982c…`). No product, test or migration change in this return.

## Unresolved findings and limitations

- **V10.1 is not live.** The inactive `main` version `8fd31f47…` carries V10.1 with matching bridge constants. Serving it needs a separately authorized Gate D.
- **Deploying `8fd31f47…` changes the bridge pin.** Its RFC-022 bridge is pinned to `220ce809…`. Only that version's own static assets can satisfy it, and they do, because the version upload includes `public/` as built.
- **Branch relationship:** `main` now carries the merge commit `97ca982c`, which is not on `governance/maisoglabs-v0.1` (the same pattern as PRs #12–#17). This return is published on the governance branch after Gate C, as D-122 allows.
- **Ruleset bypass actor:** the `main-protection` ruleset permits one repository-role bypass in `pull_request` mode. It was not used. This is recorded for the Architect's awareness only.
- **Carried forward:**
  - AS-146 non-blocking findings: the candidate build script fails safely; the `worker/bridge/payload.mjs` comment debt; no Firefox/WebKit/real-device/live-D1 evidence; mobile and `og:image` deferred;
  - AS132-F002 applies at initial activation; AS132-F003 remains open (inspection performed above);
  - the traceability validator's pre-existing 3 ERRORs and DRIFT.
- **Publication attempt keys:** D-122 was published with `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-122`. The local ledger was not edited.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged. `OBL-017` (separate production deploy gate) holds: Gate C is not a production release.

## Evidence locations

- PR: https://github.com/Dillaab-source/maisog-labs/pull/18 (merged as `97ca982c…`).
- CI: runs `36622429425` and `36622493451` (jobs `109590911046`, `109591128272`).
- Ruleset: `23740878` `main-protection`.
- Cloudflare builds:
  - `4eae04e3-02f3-4094-86bc-abc5f69b14d2` (`main`);
  - `9016bfbc-a41a-4cb2-8417-3f6c36983b06` (branch).
- Versions: `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` (`main`, inactive); `2a507d0c-8f66-41fd-9586-2d04fa4c9ab7` (branch, inactive); active `862dc45e-9ad7-4324-80ae-912adbb6ce82` (deployment `3fa32ba9-ae42-4023-9b8f-53c5178c2290`).

## Governing references

- **T0:** Protocol V2; D-122; `ML-DEVOS-AS-146`.
- **T1:** D-121; `ML-DEVOS-AS-145` (atomic promotion invariant); D-112 / PR #17 (Gate C precedent); `OBL-017`.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-V101-GATE-C-0001.md`.

## Next action

The Architect reviews the Gate C return under a new immutable `ML-DEVOS-AS-NNN`. Gate D (deploying `8fd31f47…`), initial activation, contact email and mobile each need separate Paulo authorization.
