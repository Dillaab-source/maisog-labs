# Current Directive — D-132 Gate D (D-129 homepage production promotion only)

```yaml
schema_version: 1
directive_id: DIR-WEB-D132-GATE-D-0001
cycle_id: MAISOGLABS_WEB_D129_HOMEPAGE_COPY
issue_parent_commit: 38fefb4bcc67d5b0472b150d8d630894250db56b
target_turn: CLAUDE
authority_ref: D-132
applicable_review_id: ML-DEVOS-AS-159
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-132 and `ML-DEVOS-AS-159`. Claude/Builder prepared it as mechanical publisher of D-132.

## Objective

Promote exactly Worker version `666b7bef-9d41-47d0-b5ca-00b8351f9a29` to 100% of production traffic, once, after a fresh preflight passes. Then verify production and return. At most one rollback to `8fd31f47…@100%`, only on a qualifying new material failure caused by this release.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `DEPLOY_AUTHORIZED: YES` and every other action flag `NO`.
- The read-only preflight run before issue (03:23–03:24Z) passed:
  - `main` is `ab1296de…`. At `main`:
    - `public/index.html` SHA-256 is `f60179dd…`, 20,857 bytes, and references `entry.e184fa740d43.js`;
    - `public/v101/assets/entry.e184fa740d43.js` is present;
    - `worker/bridge/inject.mjs` pins `f60179dd…` / `20857` / `20116`.
  - Active production is deployment `b0f11606…` with `8fd31f47…` @ 100%, one version, no split. It is the latest deployment (D-123), so nothing has been deployed since.
  - Target `666b7bef…` (#912) exists: `wrangler` `version_upload`, alias `main`, created 02:54:37Z. It is in no deployment, so it is inactive. Build `0588b13b…` ran on branch `main`, commit `ab1296de…`, outcome `success`.
  - Target and production bindings are identical: `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `ASSETS`, `DB` → `45b87574…`, `MEDIA` → `maisog-labs-web-inc-004-local`; compat date `2026-09-11`.
  - `/admin` and `/admin/api/content` return 302 to the Access login (`jolly-disk-0469.cloudflareaccess.com`).
  - Baseline: `/` 200 (old entry `entry.7995859f655d.js`); `/api/journal` 200; `/api/design` 200; `/journal` 200.

## Governing references

- **T0:** D-132; live STATE; `ML-DEVOS-AS-159`.
- **T1:** D-130 / `ML-DEVOS-AS-158` (Gate C); D-123 / `H-WEB-V101-GATE-D-0001` (Gate D precedent, API-equivalent promotion); `ML-DEVOS-RFC-022`; `OBL-017`.

## Exact execution scope

Allowed:
- Cloudflare GET reads, and read-only GraphQL analytics.
- Public HTTP GETs of `maisoglabs.com`.
- Exactly one promotion `POST …/workers/scripts/maisog-labs/deployments`: `strategy: "percentage"`, `versions: [{ version_id: "666b7bef-9d41-47d0-b5ca-00b8351f9a29", percentage: 100 }]`. This is the API equivalent of `npx wrangler versions deploy 666b7bef…@100% --yes`; Wrangler is not authenticated in the container.
- At most one conditional rollback in the same form to `8fd31f47…`.
- One Protocol V2 Builder return.

Not allowed:
- `wrangler deploy`; uploading or rebuilding; another version; a canary or split;
- routes or triggers; D1, R2, Access, DNS, bindings, secrets or environment changes;
- project, `site_settings` or contact changes; changes to `main` or the homepage;
- AS158-F001; S6; V2.1 Revision 2; any PR merge.

## SENTINEL Sync

- **Authority:** D-132 (Paulo), after `ML-DEVOS-AS-159` and D-130.
- **Context:** the D-129 candidate is accepted and merged; production serves `8fd31f47…`.
- **Capability:** the Cloudflare API through the connected MCP connector, with one deployment write (plus one conditional rollback).
- **Execution:** re-read the preflight → promote → verify → return.
- **Evidence:**
  - deployments before and after; the target identity;
  - live homepage copy, Entry stack and entry asset; section, project, API and Journal smoke tests;
  - `/admin` Access; Worker analytics.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- D-132 names the Wrangler command as the intended operation. The container cannot authenticate Wrangler, so the API equivalent is used, as at D-114/D-123 (accepted in `ML-DEVOS-AS-148`). The Builder note in D-132 records this. The target, the traffic percentage and the single-promotion limit are unchanged.
- The target's asset bundle cannot be fetched before promotion (preview URLs are disabled). Its identity rests on the build link (`0588b13b…` → `main` `ab1296de…`) and the `main` tree. After promotion it is confirmed live: homepage SHA `f60179dd…` (on the unbridged path) or the D-129 copy, plus the entry asset.

## Instructions

1. Bootstrap.
2. Re-read deployments and target immediately before promotion. Stop on any drift.
3. Promote once.
4. Verify post-deploy D-132 items 1–12.
5. Roll back only on a qualifying failure.
6. Publish the return: reset `DEPLOY_AUTHORIZED` to `NO`, archive and deselect this directive, route `TURN: ARCHITECT`, scope `D132_GATE_D_ARCHITECT_REVIEW_ONLY`.

## Validation and evidence

Everything D-132 lists for the Builder return.

## Stop conditions

- Any preflight value differs, or the target identity is ambiguous: stop without deploying.
- A qualifying failure after promotion: one rollback, verify, stop. No hotfix.
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-D132-GATE-D-0001` and route to the Architect.
