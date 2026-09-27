# Current Handoff — D-098 Hardening Gate C Protected Main Release (D-099)

```yaml
schema_version: 1
handoff_id: H-WEB-D098-GATE-C-0001
cycle_id: MAISOGLABS_WEB_D098_GATE_C
input_base_commit: 21a80b5bbb3deaeb7f20f626bab8b0df8e707ac7
review_target_commit: 21a80b5bbb3deaeb7f20f626bab8b0df8e707ac7
applicable_review_id: ML-DEVOS-AS-126
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. GitHub and local evidence is `ACTOR_REPORTED`. The two production allocation readings were supplied by Paulo from the Cloudflare dashboard and are `OWNER_REPORTED`: this cloud session cannot reach the Cloudflare API.

## Objective

Execute `DIR-WEB-D098-GATE-C-0001` (D-099): release the D-098 hardening that `ML-DEVOS-AS-126` accepted to `main`. That means one fresh protected PR and a normal merge commit, then observing the `main` version upload and proving that production traffic did not move. Gate D is not part of this cycle.

## Result

**Gate C complete. PR #15 merged; the new version was uploaded and is inactive; production is unchanged.**

| Item | Value |
|---|---|
| D-099 / directive publication | `21a80b5bbb3deaeb7f20f626bab8b0df8e707ac7` (after `ML-DEVOS-AS-126` at `d2ed608139265dc58e75963e01634726fd7b2254`) |
| Release PR | #15, `governance/maisoglabs-v0.1` → `main`, freshly opened; no other PR was used |
| Base / final head | `7d22a96d10b5e24f5296795c2b049f77093386c3` / `21a80b5bbb3deaeb7f20f626bab8b0df8e707ac7` |
| Mergeability at merge | open, not draft, `mergeable: true` (`clean`); no reviews, no review threads; the only comment was the Cloudflare preview bot |
| Merge | GitHub PR merge API, `merge_method=merge`, `expectedHeadSha=21a80b5…` |
| **Merge commit** | `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`, parents `7d22a96…` and `21a80b5…`; `main` points to it |
| Tree equivalence | merge tree `8ca2a36c2e87b766d80e478cd67da060d9683e24` = the tree of `21a80b5`; `git diff 21a80b5 6e14077` is empty |
| **main Workers Build** | check run `108607242213` SUCCESS; Build ID `e2a2d328-76d0-4361-816e-3b74c0c7b5c7` |
| **New uploaded version** | `53137101-afb8-456c-ab83-d8b7b934df01` (alias `main`); listed and **inactive** (owner-read) |
| **PRE_MERGE_ACTIVE_VERSION_ID** | `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100% (owner-read immediately before merge) |
| **POST_MERGE_ACTIVE_VERSION_ID** | `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100% (owner-read after the build) |
| Pre = post | **yes**: same version, same 100%, no split |

## Changed files

This Builder return commit changes only:

- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to `TURN: ARCHITECT`, directive deselected, every action flag `NO`.
- `coordination/archive/directives/DIR-WEB-D098-GATE-C-0001.{md,provenance.json}`: byte-identical archive of the executed directive (blob `2836fffc4daa1a57af6233377b3ac04bab7b4f78`, publication `21a80b5`), plus its index row.

**Release diff merged into `main`** (`7d22a96..21a80b5`, 42 files):

- Runtime/config (AS-126 accepted): `wrangler.jsonc`, `worker/public/journal.mjs`, `worker/public/design.mjs`, `scripts/d1-migrate.mjs`, `docs/ARCHITECTURE.md`, `tests/cloudflare-bindings-config.test.mjs`, `tests/worker-public-journal.test.mjs`, `tests/worker-public-design.test.mjs`.
- Governance and audit records only, everything else:
  - `brain/DECISION_LOG.md`
  - `coordination/ARCHITECT_REVIEW.md`
  - `coordination/CURRENT_DIRECTIVE.md`
  - `coordination/CURRENT_HANDOFF.md`
  - `coordination/STATE.md`
  - `coordination/archive/directives/DIR-WEB-AS116-HARDENING-0001.md`
  - `coordination/archive/directives/DIR-WEB-AS116-HARDENING-0001.provenance.json`
  - `coordination/archive/directives/DIR-WEB-AS116-STAGE-A-0001.md`
  - `coordination/archive/directives/DIR-WEB-AS116-STAGE-A-0001.provenance.json`
  - `coordination/archive/directives/DIR-WEB-AS116-STAGE-B-0001.md`
  - `coordination/archive/directives/DIR-WEB-AS116-STAGE-B-0001.provenance.json`
  - `coordination/archive/directives/DIR-WEB-D093-GATE-C-0001.md`
  - `coordination/archive/directives/DIR-WEB-D093-GATE-C-0001.provenance.json`
  - `coordination/archive/directives/DIR-WEB-D093-GATE-D-0001.md`
  - `coordination/archive/directives/DIR-WEB-D093-GATE-D-0001.provenance.json`
  - `coordination/archive/directives/README.md`
  - `coordination/archive/handoffs/H-WEB-AS116-HARDENING-0001.md`
  - `coordination/archive/handoffs/H-WEB-AS116-HARDENING-0001.provenance.json`
  - `coordination/archive/handoffs/H-WEB-AS116-STAGE-A-0001.md`
  - `coordination/archive/handoffs/H-WEB-AS116-STAGE-A-0001.provenance.json`
  - `coordination/archive/handoffs/H-WEB-AS116-STAGE-B-0001.md`
  - `coordination/archive/handoffs/H-WEB-AS116-STAGE-B-0001.provenance.json`
  - `coordination/archive/handoffs/H-WEB-D093-GATE-C-0001.md`
  - `coordination/archive/handoffs/H-WEB-D093-GATE-C-0001.provenance.json`
  - `coordination/archive/handoffs/H-WEB-D093-GATE-D-0001.md`
  - `coordination/archive/handoffs/H-WEB-D093-GATE-D-0001.provenance.json`
  - `coordination/archive/handoffs/README.md`
  - `devos/changes/architect-syncs/ML-DEVOS-AS-121.md`
  - `devos/changes/architect-syncs/ML-DEVOS-AS-122.md`
  - `devos/changes/architect-syncs/ML-DEVOS-AS-123.md`
  - `devos/changes/architect-syncs/ML-DEVOS-AS-124.md`
  - `devos/changes/architect-syncs/ML-DEVOS-AS-125.md`
  - `devos/changes/architect-syncs/ML-DEVOS-AS-126.md`
  - `devos/changes/architect-syncs/README.md`

No `migrations/**`, `package.json`, lockfile, `public/**` (homepage artifact), `app/**`, `components/**` or `.github/**` change. The homepage SHA-256 on `main` is still `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

## Tests and evidence

- **Exact-head CI on `21a80b5`:** `test-and-build` jobs `108542038668` and `108542097566` SUCCESS; `Workers Builds: maisog-labs` `108542189339` SUCCESS. The PR preview build `8b97665b-7389-4efc-94f8-0abc3d68e0df` produced preview version `ab12e2ab…`, which is not production. An earlier in-progress Workers Builds run, `108542057871`, was superseded by `108542189339`.
- **Local, on the exact head `21a80b5`:** `npm test` 914/914 (exit 0); `npm run build` exit 0; `git diff --check` clean; `out/index.html` SHA-256 `2417f7e5…9f9`.
- **Re-checked immediately before merge:** bootstrap exit 0; governance `21a80b5`; `main` `7d22a96`; PR head `21a80b5`, `clean`; exact-head checks all SUCCESS; no reviews or threads; 42 files.
- **Main build output:** the Workers Builds check on `6e14077` reports Build `e2a2d328…` and Version `53137101…` with preview alias `main-maisog-labs.paulomaisog284.workers.dev`, the upload-only pattern also seen at the D-094 Gate C.

## Unresolved findings and limitations

1. **Production allocation is owner-read:** both readings are `OWNER_REPORTED` and are not reproduced by the Builder, because this session has no Cloudflare API access.
2. **Hardening not in production:** the D-098 hardening is on `main` and in the inactive version `53137101…`, but production still serves `f473c170…`. Activating it would be Gate D, which needs a separate owner decision.
3. **Protection internals not read:** the merge went through the normal PR path with the head pinned; the ruleset configuration itself was not read.
4. Carried forward: S6 parked at ML-DEVOS-AS-103; O1 and O2 open; D-068 held (its untracked draft was never staged); `stash@{0}` lives in Paulo's local clone and was not touched.

## Confirmations

- No `wrangler versions deploy`, `wrangler deploy`, promotion, traffic change or rollback was run.
- No D1, R2, binding, Access, DNS, secret or environment change; no resource created, deleted or renamed.
- No squash, rebase, direct push, force push, auto-merge or protection bypass.
- PR #7 and PR #10 were not touched. S6/S7 and D-068 were not touched.

## Evidence locations

- PR #15; merge commit `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- Check runs `108542038668`, `108542097566`, `108542189339` (head) and `108607242213` (main).
- Cloudflare build `e2a2d328-76d0-4361-816e-3b74c0c7b5c7`; versions `53137101-afb8-456c-ab83-d8b7b934df01` (inactive) and `f473c170-b39c-4d7b-85ad-a99c5208d539` (active).
- `coordination/archive/directives/DIR-WEB-D098-GATE-C-0001.md`.

## Governing references

- **Authority:** D-099.
- **Directive:** DIR-WEB-D098-GATE-C-0001 (archived).
- **Reviews:** ML-DEVOS-AS-126 (hardening acceptance), ML-DEVOS-AS-125.
- **Decisions:** D-098 (hardening), D-094 (Gate C precedent).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews this Gate C return under the next unused immutable Architect Sync ID after ML-DEVOS-AS-126. Gate D (promoting `53137101-afb8-456c-ab83-d8b7b934df01`) is not authorized and needs a separate Paulo decision.
