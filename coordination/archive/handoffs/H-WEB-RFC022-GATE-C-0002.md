# Current Handoff — RFC-022 Gate C for the D-111 remediation (D-112)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-GATE-C-0002
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: dfae2a59278a761a4157155178f7ed94955c2926
review_target_commit: dfae2a59278a761a4157155178f7ed94955c2926
applicable_review_id: ML-DEVOS-AS-138
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Evidence class: `ACTOR_REPORTED`, from live GitHub and Cloudflare API calls made in this session (Cloudflare reads were GET only).

## Objective

Execute `DIR-WEB-RFC022-GATE-C-0002` (D-112): merge the D-111 remediation accepted by AS-138 into `main` through one fresh protected PR, without production promotion; prove production traffic is unchanged; record the AS138-F001 Access policy identity check.

## Result

**Gate C complete. Production traffic unchanged. AS138-F001: MISMATCH — Gate D NOT READY.**

| Item | Value |
|---|---|
| D-112 publication (final PR head) | `dfae2a59278a761a4157155178f7ed94955c2926` (parent `9abb5f6…`, the end of the AS-138 reviewed implementation) |
| PR | [Dillaab-source/maisog-labs#17](https://github.com/Dillaab-source/maisog-labs/pull/17), opened ready for review, merged |
| Base before merge | `main` `fda42e04d18b960d8212d49616f96b657a5c6bf3` (unchanged since D-109) |
| Merge commit | `405375998392e936b71181de387ae395b7d46e40`, a normal merge commit with parents `fda42e04…` and `dfae2a59…`, merged with `merge_method: merge` and `expectedHeadSha: dfae2a59…` |
| `main` after merge | `40537599…`. Its tree (`5cd4e710…`) is identical to the final head's |
| `PRE_MERGE_ACTIVE_VERSION_ID` | `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%, deployment `3bf053d6-56b8-4412-a96a-a587588f8521`, read 2026-09-28T20:36:43Z |
| `main` Workers Build | `ded31be5-394e-4674-95d9-88d904e784aa`, branch `main`, commit `40537599…`, outcome `success`, stopped 20:37:35Z; deploy command `npx wrangler versions upload` |
| New inactive version | `862dc45e-9ad7-4324-80ae-912adbb6ce82` (#828), alias `main`, `workers/triggered_by: version_upload`, created 20:37:30Z |
| `POST_MERGE_ACTIVE_VERSION_ID` | `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%, deployment `3bf053d6…` (created 07:21:06Z, unchanged), read 20:38:52Z |
| Pre = post | **YES** |

## Tests and evidence

### Pre-merge checks on the final head `dfae2a59…`

- **`test-and-build` (GitHub Actions):**
  - run `36479666981` / job `109121922346`: `success` (20:30:23–20:32:40Z);
  - run `36479769693` / job `109122250362`: `success` (20:31:12–20:33:51Z).

  These are the push and pull-request triggers.
- **`Workers Builds: maisog-labs`:** `success` on both branch uploads of `dfae2a5`:
  - `52879440…` (`governance/maisoglabs-v0.1`);
  - `d2a701b1…` (the Builder's session branch).

  Both use the "Deploy non-production branches" trigger (`npx wrangler versions upload`), so neither is a deployment.
- **Mergeability:** GitHub `mergeable_state: clean`. `git merge-tree --write-tree main dfae2a5` has no conflicts, and the merged tree equals the final head.
- **`main` unchanged:** `fda42e04…`, re-read immediately before the merge.
- **Release scope:**
  - AS-138 reviewed end `9abb5f6…` → final head `dfae2a5…` changes only the AS-138/D-112 governance records: `brain/DECISION_LOG.md`, `coordination/{ARCHITECT_REVIEW,CURRENT_DIRECTIVE,STATE}.md`, the `H-WEB-RFC022-CBR-REM1-0001` archive and index, and `devos/changes/architect-syncs/{ML-DEVOS-AS-138.md,README.md}`.
  - The full release diff `fda42e0..40537599` is 34 files, +2109/−183: the D-111 remediation plus the governance records since PR #16.
- **Homepage artifact:** SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` at the final head and on `main` after the merge.

### AS138-F001 — Access policy identity (read-only)

- **Source:** `GET /accounts/{id}/access/apps/b80acca4-ecff-4d9a-ba1b-cedff87cb25b` and `…/policies`. The application `maisoglabs.com/admin` has exactly one policy:
  - `460d0315-1e4b-414a-8845-c656f1f04c79`, "Maisog Labs Admin V1 — Canonical Administrator";
  - `decision: allow`, precedence 1, `reusable: true`;
  - `include`: a single `email` rule; no `exclude` or `require`.
- **Comparison:** the allowed identity is a single personal `gmail.com` address. It is **not** the D-106 identity `paulo.maisog@maisoglabs.com`. The exact address was reported to Paulo in the session and is deliberately not committed here.
- **Consequence:** **Gate D is NOT READY.** Under AS-138/D-112 this does not block Gate C. The policy is reusable (shared), so changing it may affect other Access applications that reference it. Any change needs a separate Paulo authorization. No Access mutation was made.

### Production (Cloudflare API, GET only)

- **Deployments list:** 10 entries before and after. The latest is still `3bf053d6…` from 07:21:06Z, so no deployment was created during Gate C.
- **New inactive version `862dc45e…`** carries the D-111 configuration:
  - `ACCESS_TEAM_DOMAIN` `jolly-disk-0469.cloudflareaccess.com`;
  - `ACCESS_AUD` `ef44d36e…0cea22`;
  - `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523`;
  - `MEDIA` → `maisog-labs-web-inc-004-local`;
  - `ASSETS`.

  The active `53137101…` still carries the placeholders, so production `/admin` stays fail-closed (401).

### No Gate D

The Builder ran:
- no `wrangler versions deploy`, deploy, promotion, traffic change or rollback;
- no D1 query or write;
- no content, `site_settings` or email change;
- no Access, DNS, R2, binding, secret or environment change;
- no direct push to `main`.

The only production-side effects are the automatic Workers Builds version uploads, which are inactive.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-GATE-C-0002.{md,provenance.json}` (byte-for-byte, blob `c8cd80d…`) and the index row;
  - `coordination/OPERATIVE_OBLIGATIONS.md` is unchanged.
- **Outside this commit:** the PR #17 merge (`main` → `40537599…`). No product, test or migration change in this return.

## Unresolved findings and limitations

- **AS138-F001 open:** the Access policy allows a different identity than D-106's. Gate D NOT READY until Paulo separately decides the Access policy change, or amends the D-106 identity.
- **Remaining activation prerequisites (after Gate D, each separately authorized):**
  - owner-approved project copy for the five, including Eternal Eggs;
  - the initial activation itself;
  - the contact draft/publish with confirmed deliverability.

  RFC-022 §7 test 11 still needs production measurements.
- **The new version is not deployed.** `862dc45e…` (`main`) carries the D-111 code and real Access values but receives no traffic. Remote `0006` is already applied, so the schema is ready for it.
- **Branch relationship:** `main` now carries the merge commit `40537599`, which is not on `governance/maisoglabs-v0.1` (the same pattern as PRs #12–#17). This return is published on the governance branch, not `main`.
- **Publication attempts:** the D-112 issue transition was recorded as attempt 3 of the checker's local per-transition limit. Its attempt key (cycle, no handoff, `CLAUDE`) was shared with the D-110 and D-111 issue transitions, and none of the three was a failed push. The limit is local to this clone. A further directive issue in this cycle from this clone would need a fresh bootstrap (`PUBLICATION_ATTEMPTS_EXHAUSTED`).
- **Carried forward:** AS132-F003 remains open; the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged. `OBL-017` (separate production deploy gate) still holds: Gate C is not a production release.

## Evidence locations

- PR: https://github.com/Dillaab-source/maisog-labs/pull/17 (merged as `40537599…`).
- CI jobs: `109121922346`, `109122250362`.
- Cloudflare builds:
  - `ded31be5-394e-4674-95d9-88d904e784aa` (`main`);
  - `52879440-28b3-41b1-ac70-aba7d015635a`, `d2a701b1-33ba-40c5-b04a-79c0402d0056` (branch).
- Versions: `862dc45e-9ad7-4324-80ae-912adbb6ce82` (`main`, inactive); active `53137101-afb8-456c-ab83-d8b7b934df01`.
- Access: application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`, policy `460d0315-1e4b-414a-8845-c656f1f04c79`.

## Governing references

- **T0:** Protocol V2; D-112; `ML-DEVOS-AS-138`.
- **T1:** `ML-DEVOS-RFC-022` §10 / §10.1 (CB-R); D-111; D-109 (Gate C precedent); D-106 (canonical admin identity).
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-GATE-C-0002.md`.

## Next action

The Architect reviews the Gate C return. The following each need separate Paulo authorization:
- the AS138-F001 Access policy change;
- Gate D / promotion;
- production content, initial activation and email publication.
