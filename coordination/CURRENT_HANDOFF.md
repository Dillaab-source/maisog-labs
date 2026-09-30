# Current Handoff — D-130 Gate C (protected merge only)

```yaml
schema_version: 1
handoff_id: H-WEB-D130-GATE-C-0001
cycle_id: MAISOGLABS_WEB_D129_HOMEPAGE_COPY
input_base_commit: 75d8267168ec9892ff072a9fdef56e8a3d10a952
review_target_commit: 75d8267168ec9892ff072a9fdef56e8a3d10a952
applicable_review_id: ML-DEVOS-AS-157
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Evidence is `ACTOR_REPORTED`, from live GitHub and Cloudflare API calls made in this session; Cloudflare calls were GET only.

## Objective

Execute `DIR-WEB-D130-GATE-C-0001` (D-130 and Paulo's retry-only clarification): merge the AS-157-accepted, owner-accepted D-129 homepage candidate into `main` through one protected PR pinned to `FINAL_GATE_C_HEAD`, with no production deployment or traffic change.

## Changed files

- This return: `coordination/STATE.md` (`MAIN_MERGE_AUTHORIZED` reset to `NO`), this handoff, and the directive archive `coordination/archive/directives/DIR-WEB-D130-GATE-C-0001.{md,provenance.json}` plus its index row.
- Outside this commit: the PR #19 merge on `main`. No product, test, script or data file changed after `FINAL_GATE_C_HEAD`.

## Tests and evidence

**Result: Gate C complete. Production unchanged.**

| Item | Value |
|---|---|
| `FINAL_GATE_C_HEAD` (D-130 publication) | `75d8267168ec9892ff072a9fdef56e8a3d10a952` (parent `a5af6f4…`, the AS-157 publication). The governance branch did not move before the merge |
| PR | [Dillaab-source/maisog-labs#19](https://github.com/Dillaab-source/maisog-labs/pull/19), `governance/maisoglabs-v0.1` → `main`, opened ready for review, head `75d8267…`, base `97ca982…` |
| Merge | `ab1296de8a1832291b2f4df97b726755d17c42bd`: a normal merge commit by GitHub, 02:53:43Z, `merge_method: merge`, `expectedHeadSha: 75d8267…`. Parents `97ca982c9e8f1e306aaa8c8a5198f43f8e00629e` and `75d8267168ec9892ff072a9fdef56e8a3d10a952` |
| `main` after merge | `ab1296de…`; tree `9db261c…`, identical to `FINAL_GATE_C_HEAD`'s tree |
| Homepage on `main` | `public/index.html` SHA-256 `f60179dd6f9e71c9f94d72eb66ac4686bb119a9a5dc781d315803f59df4d2fe3`, 20,857 bytes; entry `entry.e184fa740d43.js`; bridge `f60179dd…` / `20857` / `20116` |
| Production before merge | deployment `b0f11606-80e3-4980-b617-e76bbacbf57c`, version `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` @ 100%, read 02:53:36Z (7 s before the merge) |
| Production after merge | the same deployment and version @ 100%, still 10 deployments, read 02:55:09Z. A public `GET https://maisoglabs.com/` returned a response byte-identical to the pre-merge read (still `entry.7995859f655d.js`) |
| `main` Workers Build | `0588b13b-caf0-40cd-968b-ee68f0e21659`, `success`; it uploaded **inactive** version `666b7bef-9d41-47d0-b5ca-00b8351f9a29` (#912, alias `main`, `version_upload`). This version carries the D-129 homepage |

**D-130 pre-merge checks, all passed immediately before the merge:**
1. `main` = `97ca982…`.
2. PR head = `FINAL_GATE_C_HEAD`.
3. `a6cdb11` is an ancestor, and the implementation files are unchanged since then.
4. Homepage SHA `f60179dd…`.
5. Bridge values as bound.
6. `entry.e184fa740d43.js`.
7. Live projects ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat, in order, from a public GET of the bridged page.
8. No `migrations/`, `data/`, `wrangler.jsonc`, package or `.github/` change. The only `worker/` file is `bridge/inject.mjs`, and only its constant changed.
9. `mergeable_state: clean`.
10. Ruleset `23740878` `main-protection` active on `refs/heads/main` (deletion, non_fast_forward, pull_request, required `test-and-build`). Its single PR-mode bypass actor was not used.
11. `test-and-build` green on the exact head (see CI below).
12. Changed-file set inspected: 130 files, all D-129, V2.1 governance or coordination records.
13. Production version recorded (above).

**Merge preflight:** `git merge-tree --write-tree 97ca982 75d8267` has no conflicts and yields the governance tree. `main`'s tree equals the merge base's tree (`b99353e`), so the merge cannot regress `main`.

**CI on `FINAL_GATE_C_HEAD`:**
- PR run `36660368744` (job `109713559549`): success, 978/978, build ok.
- Push run `36660341521`, attempt 1 (job `109713477158`): **failed 977/978** on test 421, `tests/execution-permits.test.mjs:81` (expected `QUIESCE_UNPROVEN`, actual `LEASE_EXPIRED`). I stopped and reported.
- Paulo authorized exactly one retry. Attempt 2 (check `109717582927`): **success**. Only then was the merge performed.

## Unresolved findings and limitations

1. **S6 timing defect (pre-existing, not fixed; S6 work is not authorized).** In `tests/execution-permits.test.mjs:81`, the fake clock is `Date.now() + offset`, with `offset = 10 min − 1 s` against a 10-minute S4 lease. The test therefore fails whenever more than about 1 s of real time passes inside it; it took 1,367 ms on the failing runner. It will recur on slow runners. A one-line fix (for example, `− 60 s` slack) needs its own decision.
2. **Branch divergence count.** D-130 cites "23 ahead / 7 behind". A full-history count gives 23 ahead and 48 behind, because `main` holds earlier pre-governance history that is already contained content-wise. It was not a blocker: the merge was clean and non-regressing.
3. **Branch placement.** Merge commit `ab1296de` exists only on `main` (same pattern as PRs #12–#18). This return is published on the governance branch after Gate C.
4. **Inactive preview uploads.** Cloudflare's Git integration uploads an inactive preview version for pushed branches. That includes this session's mirror pushes to `claude/intelligent-turing-imuike` (#910). None receives traffic.
5. **Gate D not performed.** Serving the D-129 homepage requires deploying `666b7bef…` under a separate Paulo decision. Its bridge is pinned to `f60179dd…`, which only its own assets satisfy.

## Governing references

D-130 (and Paulo's retry-only clarification); `ML-DEVOS-AS-157`; D-129; D-122 / `H-WEB-V101-GATE-C-0001` (precedent); `ML-DEVOS-RFC-022`; `coordination/OPERATIVE_OBLIGATIONS.md` (`OBL-017`, `OBL-023`).

## Evidence locations

- PR #19; merge `ab1296de…`.
- CI runs `36660368744` and `36660341521` (attempts 1 and 2).
- Cloudflare: build `0588b13b…`; versions `666b7bef…` (inactive, `main`) and `8fd31f47…` (active, deployment `b0f11606…`).

## Next action

Architect review of Gate C. Gate D (a production deploy of `666b7bef…` with live verification) needs a separate Paulo decision.
