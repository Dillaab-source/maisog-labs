# Current Handoff — D-093 Gate D Exact Production Promotion (D-095)

```yaml
schema_version: 1
handoff_id: H-WEB-D093-GATE-D-0001
cycle_id: MAISOGLABS_WEB_D093_GATE_D
input_base_commit: afe9703bc78ad9b7cbcd5842d17a5a18c1248ab1
review_target_commit: afe9703bc78ad9b7cbcd5842d17a5a18c1248ab1
applicable_review_id: ML-DEVOS-AS-122
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. `applicable_review_id` names the live review at the return parent (`ML-DEVOS-AS-122`, a non-authorizing sync); the directive's controlling review is `ML-DEVOS-AS-121`.

**Evidence classes:**
- Cloudflare deployment and version readings: read by the Builder with authenticated `wrangler` (read-only) from Paulo's local clone.
- Production HTTP checks: fetched by the Builder from `https://maisoglabs.com` (read-only).
- The promotion command itself: **executed by Paulo**. Claude Code's auto-mode permission classifier blocked the Builder's attempt (`Production Deploy`), so Paulo ran the exact authorized command. Cloudflare's resulting deployment record was then read by the Builder.
- Build→version binding (`8abe1ba1…` → `f473c170…`, check run `108500903744`): Architect-verified (`ML-DEVOS-AS-122`), not Builder-reproduced.

## Objective

Execute `DIR-WEB-D093-GATE-D-0001` (D-095): promote Worker Version `f473c170-b39c-4d7b-85ad-a99c5208d539` to production at 100% with exactly one command, verify production read-only, and roll back once to `a667fc09-12d1-4fde-a75d-5d660729baa3` only for a new material failure caused by the release.

## Result

**Gate D completed. Production serves the D-093 homepage artifact. No rollback.**

| Item | Value |
|---|---|
| D-095 / directive publication | `afe9703bc78ad9b7cbcd5842d17a5a18c1248ab1` (committed and published by Paulo through the Protocol V2 checker, `PUBLISHED`, attempt 1) |
| **Pre-deploy active version** (Builder-read 2026-09-27T00:25:05Z) | `a667fc09-12d1-4fde-a75d-5d660729baa3` @ **100%** (deployment `ba9a3ee0-81a6-43a2-81f9-3467ec876d79`, 2026-09-26T03:44:49Z), no split |
| Promotion command (exact, run once, by Paulo) | `npx wrangler versions deploy f473c170-b39c-4d7b-85ad-a99c5208d539@100% --yes` |
| Resulting deployment | `fc425da6-d57f-4e9e-abc0-ac8582c2d4bf`, created 2026-09-27T00:31:22.360Z, source `wrangler` |
| **Post-deploy active version** (Builder-read 2026-09-27T00:33:04Z) | `f473c170-b39c-4d7b-85ad-a99c5208d539` @ **100%**, no split |
| Deployments since baseline | exactly one (`fc425da6…`); no other version deployed |
| Homepage `/` | 200, 1,969,988 bytes, SHA-256 **`2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`** = D-093 artifact (also with a cache-busting query and with a Googlebot user agent) |
| Rollback | **not performed**, not warranted |

## Changed files

Gate D changed no website, runtime or artifact file and no Cloudflare configuration. This Builder return commit changes only:

- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to `TURN: ARCHITECT`, directive deselected, every action flag `NO`.
- `coordination/archive/directives/DIR-WEB-D093-GATE-D-0001.md` and `.provenance.json`: byte-identical archive of the executed directive (blob `c498bb33ae3fabe11310878932cbd240f50b87b8`, publication `afe9703`).
- `coordination/archive/directives/README.md`: the archive index row.

## Preconditions verified before deployment (2026-09-27T00:25Z)

1. Protocol V2 bootstrap at `afe9703`: exit 0, no failed check; STATE selected `DIR-WEB-D093-GATE-D-0001`, `TURN: CLAUDE`, only `DEPLOY_AUTHORIZED: YES`.
2. Governance tip `afe9703bc78ad9b7cbcd5842d17a5a18c1248ab1` (remote `ls-remote`); `main` `7d22a96d10b5e24f5296795c2b049f77093386c3`.
3. Target version `f473c170-b39c-4d7b-85ad-a99c5208d539` present (created 2026-09-26T22:35:11Z, `version_upload`).
4. Active production `a667fc09-12d1-4fde-a75d-5d660729baa3` @ 100%; deployment list showed no newer deployment and no split.
5. Local working tree clean; `stash@{0}` untouched (`b68754e9406c185d21cf175492356bf1c2ad1264`).

## Tests and evidence

Production HTTP, `https://maisoglabs.com`, with `Cache-Control: no-cache`, before (00:25Z) and after (00:33Z) promotion:

| Path | Before | After | Assessment |
|---|---|---|---|
| `/` | 200, 28,027 B, SHA-256 `cb22867f…` (prior homepage) | 200, 1,969,988 B, SHA-256 `2417f7e5…9f9` | expected change: D-093 artifact live |
| `/assets/video/logo-mark.mp4` | 404 | 200 `video/mp4`, 3,736,250 B | byte-identical to `public/assets/video/logo-mark.mp4` |
| `/assets/plates/plate-hero-v4.png` | 404 | 200 `image/png`, 2,407,344 B | byte-identical to repo |
| `/assets/icons/01-ai.svg` | 404 | 200 `image/svg+xml`, 11,492 B | byte-identical to repo |
| `/journal` | 200 | 200 | unchanged behavior |
| `/admin` | 302 | 302 | unchanged (Access redirect) |
| `/api/journal` | 500 | 500 | pre-existing AS-116 incident; not a Gate D regression |

`/` returned `CF-Cache-Status: HIT` with `Cache-Control: public, max-age=0, must-revalidate`; the body is the new artifact, so the edge serves the promoted version.

**Contradiction resolved (external crawler observation):** the Architect's external fetch reported four projects and `hello@maisoglabs.com`. Direct evidence: `hello@maisoglabs.com` occurs 4 times in the pre-promotion homepage (version `a667fc09`) and 0 times in the post-promotion body; the post-promotion `<title>` is the artifact's `Maisog Labs — Ideas in Orbit` (previously `Maisog Labs — Human potential. AI possibilities.`). The crawler therefore observed stale pre-promotion content; it is not evidence of a Gate D failure. The artifact renders its own content (five projects, `maisog36@gmail.com`) client-side from a self-unpacking bundle, which a non-JavaScript crawler cannot read from the raw HTML.

## Unresolved findings and limitations

1. **Execution actor:** the promotion command was run by Paulo, not the Builder, because the Builder's attempt was blocked by Claude Code's auto-mode classifier. The Builder did not see the command's own output; the deployment record `fc425da6…` read afterwards is the evidence.
2. **Bounded verification only:** HTTP status/bytes/hashes; no in-browser rendering, motion or mobile check was run after promotion (Paulo's earlier preview check covered the same version's runtime behavior per AS-120).
3. **Build→version binding** remains Architect-verified, not Builder-reproduced (`gh` unavailable in this environment).
4. **Carried forward:** AS-116 production `/api/journal` 500 incident open; D-093 artifact-native limitations (prototype content, five projects, `maisog36@gmail.com`, mobile nav clipping, React development builds with in-browser Babel) accepted by AS-120; S6 parked at ML-DEVOS-AS-103, O1 and O2 open; D-068 held; PR #7 and PR #10 untouched.
5. **Rollback target retained:** `a667fc09-12d1-4fde-a75d-5d660729baa3` remains available; D-095's single conditional rollback was not used and lapses with this return.

## Evidence locations

- Cloudflare deployment `fc425da6-d57f-4e9e-abc0-ac8582c2d4bf` (worker `maisog-labs`), prior deployment `ba9a3ee0-81a6-43a2-81f9-3467ec876d79`.
- `https://maisoglabs.com/` and the paths above.
- `coordination/archive/directives/DIR-WEB-D093-GATE-D-0001.md`.
- D-095 in `brain/DECISION_LOG.md` at `afe9703`.

## Governing references

- **Authority:** D-095 (Gate D), D-094 (Gate C), D-093 (artifact).
- **Directive:** DIR-WEB-D093-GATE-D-0001 (archived).
- **Reviews:** ML-DEVOS-AS-121 (controlling), ML-DEVOS-AS-122 (non-authorizing sync).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect performs the independent Gate D closure review under the next unused immutable Architect Sync ID after ML-DEVOS-AS-122. No further deployment, rollback or Cloudflare action is authorized.
