# Current Handoff — Cloudflare Exposure Remediation A-1 + A-4 (D-103)

```yaml
schema_version: 1
handoff_id: H-WEB-CF-EXPOSURE-REMEDIATION-0001
cycle_id: MAISOGLABS_CF_EXPOSURE_REMEDIATION
input_base_commit: dd20f25285702147e441b0c3d2e2deb4cfe52a4f
review_target_commit: dd20f25285702147e441b0c3d2e2deb4cfe52a4f
applicable_review_id: ML-DEVOS-AS-129
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Cloudflare evidence (connector reads and writes from this authenticated cloud session) and HTTP probes are `ACTOR_REPORTED`.

## Objective

Execute `DIR-WEB-CF-EXPOSURE-REMEDIATION-0001` (D-103):

- **A-1:** disable `maisog-labs` preview URLs, with `workers.dev` unchanged.
- **A-4:** disable `maisog-labs-staging` `workers.dev` and preview URLs.

Verify, and roll back only on the D-103 failure conditions.

## Result

**A-1 and A-4 complete. There were two Cloudflare writes, both succeeded, and no rollback was needed.**

| Item | Value |
|---|---|
| D-103 / directive publication | `dd20f25285702147e441b0c3d2e2deb4cfe52a4f` (parent `872f31b…`, AS-129) |
| `main` | `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4` (unchanged) |
| Pre-change read | `2026-09-28T14:56:23Z` |
| **A-1 pre** | `maisog-labs` subdomain `{"enabled": true, "previews_enabled": true}` |
| **A-1 operation** | `POST /accounts/{account}/workers/scripts/maisog-labs/subdomain`, body `{"enabled": true, "previews_enabled": false}`, at `2026-09-28T14:59:03Z`. HTTP 200, `success: true`, no errors. The API requires `enabled`; `true` re-asserted its unchanged prior value |
| **A-1 post** (immediate read-back) | `{"enabled": true, "previews_enabled": false}` |
| **A-4 pre** | `maisog-labs-staging` subdomain `{"enabled": true, "previews_enabled": true}` |
| **A-4 operation** | `POST /accounts/{account}/workers/scripts/maisog-labs-staging/subdomain`, body `{"enabled": false, "previews_enabled": false}`, at `2026-09-28T14:59:40Z`. HTTP 200, `success: true`, no errors |
| **A-4 post** (immediate read-back) | `{"enabled": false, "previews_enabled": false}` |
| Rollback | **not required**; not run |

Each write ran inside one connector call that re-read the setting immediately before the `POST`, and would have aborted had it differed from the expected pre-state.

## Tests and evidence

**Bootstrap:**
- Before D-103: tip `872f31b…`, `main` `6e14077…`; `TURN: PAULO`, `PAULO_DECISION_REQUIRED`; no handoff or directive; every flag `NO`; D-103 absent; bootstrap exit 0.
- D-103: `--check-only` exit 0, then compare-and-swap publish (attempt 1).
- After publication: bootstrap exit 0 on `dd20f25`; STATE selects the directive; `MUTATION_AUTHORIZED: YES` is the only `YES` flag.

**Unchanged across the change** (pre-read `14:56:23Z` vs post-read `14:59:52Z`):

| Setting | `maisog-labs` | `maisog-labs-staging` |
|---|---|---|
| Active deployment | `3bf053d6-56b8-4412-a96a-a587588f8521`, `53137101-afb8-456c-ab83-d8b7b934df01` @ 100% | `8e1dc39c-2f71-4411-9d52-e2fa46eba435`, `5a178e36…` @ 100% |
| Custom domain | `maisoglabs.com` (`70c1abc4…`), still bound | none, before and after; the Worker still exists |
| D1 | `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523` | `DB` → `72dfb480…` |
| R2 | `MEDIA` → `maisog-labs-web-inc-004-local` | `MEDIA` → `maisog-media` |
| Vars and other bindings | placeholder `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN`, `ASSETS` | `ASSETS` |

- Compatibility date, logpush and tail consumers are identical for both Workers.
- The account's Worker list is unchanged (5 scripts).

**Production HTTP (`https://maisoglabs.com`):**
- Before the change: `/` 200, SHA-256 `2417f7e5…9f9`.
- After A-1, and again after both actions (`15:00:08Z`): `/` 200 with SHA `2417f7e5…9f9` (the D-093 artifact, unchanged); `/api/journal` 200; `/api/design` 200; `/journal` 200; `/admin` 302 to the Access login (unchanged).

**Live exposure evidence for A-1:**
- `https://53137101-maisog-labs.paulomaisog284.workers.dev/admin` answered `401` from the Worker immediately after A-1 (propagation).
- By `15:00:08Z`, `/` and `/admin` on that host return `404` `error code: 1042`: the preview URL is no longer served.

## Unresolved findings and limitations

1. **A-4 live probe not possible:** `maisog-labs-staging.paulomaisog284.workers.dev` is outside the session network allowlist (proxy `CONNECT 403`). A-4's post-state rests on the API read-back.
2. **Build-trigger side effect (F-1 remainder, A-3 not authorized):**
   - Workers Builds still uploads a non-production version for every non-`main` push. The D-103 governance push created `maisog-labs` v789 (`1848998a…`, `14:59:29Z`); publishing this return will add more.
   - These uploads were not run by the Builder and were not deployed; the active deployment is unchanged.
   - With previews disabled, they no longer receive public preview URLs.
3. **Consequence noted in the directive:** version-preview smoke testing (as used for past Gate C/D candidates) is no longer available on `maisog-labs`. A future promotion gate needs a different pre-promotion check.
4. **Carried forward:**
   - AS-129 findings F-2, F-4, F-5, F-6, F-7 and F-8, and actions A-2, A-3, A-5, A-6, A-7, A-8 and A-9, remain open and unauthorized. For F-3, A-4 closed the exposure mechanism; the data impact is still unverified.
   - S6 parked at ML-DEVOS-AS-103; O1 and O2 open; D-068 held.
   - OBL-017/OBL-019/OBL-020 are unchanged.

## Confirmations

- Exactly two Cloudflare writes: the A-1 and A-4 subdomain `POST`s above. Everything else was a `GET`.
- `maisog-labs` `workers.dev` stays enabled. No other Worker setting changed.
- No D1/R2 access or change, and no Access, DNS, n8n, Builds-trigger, deployment, traffic, version, binding, secret or environment action.
- No Worker deleted or renamed.
- No `main`, PR #7, PR #10, S6/S7 or D-068 action. `devos/execution/`, `tests/fixtures/execution/` and `stash@{0}` were not touched.

## Changed files

This return commit changes only:

- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to `TURN: ARCHITECT`, directive deselected, `MUTATION_AUTHORIZED` reset, every flag `NO`.
- `coordination/archive/directives/DIR-WEB-CF-EXPOSURE-REMEDIATION-0001.{md,provenance.json}`: byte-identical directive archive, plus its index row.

## Evidence locations

- Cloudflare account `fb7234ae…`: Workers `maisog-labs` and `maisog-labs-staging` subdomain settings; deployments `3bf053d6…` and `8e1dc39c…`.
- `docs/security/CF_INVENTORY_EXPOSURE_REVIEW.md` (A-1, A-4, F-1, F-3).
- `coordination/archive/directives/DIR-WEB-CF-EXPOSURE-REMEDIATION-0001.md`.

## Governing references

- **Authority:** D-103.
- **Directive:** DIR-WEB-CF-EXPOSURE-REMEDIATION-0001 (archived).
- **Reviews:** ML-DEVOS-AS-129.
- **Decisions:** D-102.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews this return under the next unused immutable Architect Sync ID after ML-DEVOS-AS-129. The D-103 authority is consumed. A-3, A-6, S6, admin work and ClinicFlow do not start automatically.
