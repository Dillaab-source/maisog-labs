# Current Handoff — D-132 Gate D (D-129 homepage production promotion)

```yaml
schema_version: 1
handoff_id: H-WEB-D132-GATE-D-0001
cycle_id: MAISOGLABS_WEB_D129_HOMEPAGE_COPY
input_base_commit: 9cf8ec1823ae36602bf0c205400fff9c67905161
review_target_commit: 9cf8ec1823ae36602bf0c205400fff9c67905161
applicable_review_id: ML-DEVOS-AS-159
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Evidence class: `ACTOR_REPORTED`, from live Cloudflare API/GraphQL and D1 calls through the Cloudflare MCP/API connector in this session, plus public HTTPS GETs of `maisoglabs.com`. Exactly one Cloudflare call was a write (the deployment). Every other call was a GET, a read-only GraphQL query or a read-only D1 SELECT/PRAGMA.

## Objective

Execute `DIR-WEB-D132-GATE-D-0001` (D-132): promote exactly `666b7bef-9d41-47d0-b5ca-00b8351f9a29` to 100% production once, after a fresh preflight; verify; roll back only on a qualifying failure.

## Result

**Gate D complete. `666b7bef…` is live at 100%, and it is healthy. No rollback.**

| Item | Value |
|---|---|
| D-132 publication | `9cf8ec1823ae36602bf0c205400fff9c67905161` (parent `38fefb4…`) |
| Pre-deploy active (fresh, 03:27:04.060Z, inside the promotion call) | deployment `b0f11606-80e3-4980-b617-e76bbacbf57c`, `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` @ 100%, single version, no split; the latest deployment |
| Target before deploy | `666b7bef…` exists (#912, `wrangler` `version_upload`, alias `main`, created 2026-09-30T02:54:37Z) and is in no deployment, so it was **inactive** |
| Operation | one connector call, `POST /accounts/{id}/workers/scripts/maisog-labs/deployments` with `{ strategy: "percentage", versions: [{ version_id: "666b7bef…", percentage: 100 }], annotations: { "workers/message": "D-132 D-129 homepage Gate D promotion of main ab1296de (build 0588b13b)" } }`: HTTP 200, `success: true`, 03:27:04.518Z. It is the API equivalent of `npx wrangler versions deploy 666b7bef…@100% --yes` (Wrangler is not authenticated in the Builder container; D-114/D-123 precedent; D-132 Builder note). Run once. No split, upload, rebuild or `wrangler deploy` |
| New deployment | **`cd4abd09-62a8-49aa-ac2f-73824d8a5b99`**, created 2026-09-30T03:27:04.201839Z, `source: api`, `workers/triggered_by: deployment` |
| Post-deploy active | **`666b7bef…` @ 100%**, single version, no split. Read at 03:27:12Z and re-read unchanged at 03:29:28Z |
| Rollback | **not performed**; no qualifying failure |

## Tests and evidence

### Preflight (D-132 items 1–11)

The first pass ran at 03:23–03:24Z, before D-132 was published. Items 2, 7 and 8 were re-read inside the promotion call at 03:27:04Z, which would have aborted on any drift.

1. **`main`:** `ab1296de8a1832291b2f4df97b726755d17c42bd`, re-read at 03:26:53Z.
2. **Target inactive:** `666b7bef…` exists and is in no deployment.
3. **Build link:** build `0588b13b-caf0-40cd-968b-ee68f0e21659` ran on branch `main`, commit `ab1296de…`, outcome `success`, stopped 02:54:45Z. The target version was created 02:54:37Z within that build, with alias `main`.
4. **Homepage at `main`:** `public/index.html` SHA-256 `f60179dd6f9e71c9f94d72eb66ac4686bb119a9a5dc781d315803f59df4d2fe3`, 20,857 bytes.
5. **Entry asset:** the `main` homepage references `entry.e184fa740d43.js`, and `public/v101/assets/entry.e184fa740d43.js` is present at `main`.
6. **Bridge pins:** `worker/bridge/inject.mjs` at `main` pins `f60179dd…` / `20857` / `20116`.
7. **Active production:** `8fd31f47…` @ 100%, deployment `b0f11606…`, single version.
8. **No drift:** `b0f11606…` (D-123) was the latest deployment; there was no intervening deployment.
9. **Bindings:** identical between target and production: `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` (same values), `ASSETS`, `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523`, `MEDIA` → R2 `maisog-labs-web-inc-004-local`. Compat date `2026-09-11` in both.
10. **Access:** `/admin` and `/admin/api/content` returned 302 to `jolly-disk-0469.cloudflareaccess.com/cdn-cgi/access/login/maisoglabs.com` (`kid` = `ACCESS_AUD`).
11. **No other mutation needed:** the target needs no D1/R2, DNS, Access, binding, secret or environment change (same bindings; production D1 already at `0006`).

The target's own asset bundle could not be fetched before promotion, because preview URLs are disabled. Its identity rested on the build link and the `main` tree, and after the promotion it was confirmed live (below).

### Post-deploy (D-132 items 1–12)

1. **Active version:** `666b7bef…` @ 100% (deployment `cd4abd09…`).
2. **Traffic split:** none. One version at 100%.
3. **Homepage HTTP:** `https://maisoglabs.com/` 200 `text/html`, 26,020 bytes, `cache-control: no-store` (the bridged response, AS132-F001).
   - Removing the 5,163-byte bridge span at offset 20,116 yields exactly `f60179dd6f9e71c9f94d72eb66ac4686bb119a9a5dc781d315803f59df4d2fe3`.
   - Pre-deploy, the page was 26,020 bytes referencing `entry.7995859f655d.js`.
4. **D-129 copy:**
   - `entry.e184fa740d43.js` (200, 7,563 bytes) contains "Paulo Maisog — AI Automation & Technical Systems Builder", "Building practical AI workflows, cloud automation, and technical" and "systems for real-world business processes".
   - Rendered in Chromium, the page text contains the full title and the full subtitle sentence. The copy is visible in the lower left of the Entry view (1440×900).
5. **Entry stack:** the rendered leaf elements in the lower right read "AI" (x 1272, y 809), "AUTOMATION" (y 829) and "SYSTEMS" (y 848), in that order, in the screenshot too. The other "SYSTEMS" at y 28 is the navigation link.
6. **Entry asset:** the live page references only `entry.e184fa740d43.js`, and it loaded 200. The same asset returned 404 before the deploy.
7. **Navigation:** the links are MAISOGLABS, SYSTEMS, PROJECTS, RESEARCH, CONTACT. Clicking each opened `#systems`, `#projects`, `#journal` (Research) and `#contact`, each with rendered content. Entry rendered on load.
8. **Projects:** the bridge island reads `["ClinicFlow","Eternal Eggs","Sentinel / DevOS","SU","Maisog Kilat"]`, and the rendered Projects view lists 01 ClinicFlow, 02 Eternal Eggs, 03 Sentinel / DevOS, 04 SU, 05 Maisog Kilat. ClinicFlow's four-stage flow renders.
9. **APIs and Journal:** `/api/journal` 200 `application/json` 14 bytes; `/api/design` 200 `application/json` 500 bytes; `/journal` 200 `text/html` 10,213 bytes. All identical to the pre-deploy baseline.
10. **Access:** `/admin` and `/admin/api/content` still return 302 to the Access login.
11. **Worker health:** `workersInvocationsAdaptive`, 03:00Z–03:30Z, read-only GraphQL:
    - `666b7bef…`: 4 invocations, all `success`, **0 errors**, CPU p50 3.35 ms / p99 6.94 ms;
    - `8fd31f47…` (pre-deploy): 4 invocations, all `success`, 0 errors, p50 2.78 ms / p99 6.64 ms.

    There is no Worker exception or binding failure. `/` exercised `ASSETS` and the D1 snapshot read, and `/api/*` exercised D1.
12. **No mutation:** production D1 read-only shows 6 migrations (last `0006`); `projects` 5 (5 published); `project_revisions` 11; `site_settings` 0; `site_settings_revisions` 0; `audit_log` 21; `journal_entries` 0; `media` 0. The newest audit row (id 21, `homepage_initial_activation`) is from 2026-09-29T23:12:41Z, before the promotion, and no audit row was written after it. Every D1 call reported `rows_written: 0`.

### Browser method

Chromium in this container rejects the agent proxy's CA (`ERR_CERT_AUTHORITY_INVALID`), and TLS verification was not disabled. Instead:
- every request the page made was fetched by Node with TLS verified through the proxy (`NODE_USE_ENV_PROXY=1`, `NODE_EXTRA_CA_CERTS` pointing at the proxy CA);
- Chromium rendered those exact live responses through request interception;
- all 26 responses were 200 and there were 0 console or page errors.

The only "failed" requests were two `logo-mark.mp4` media loads served 200. They are the known headless video-codec limitation, recorded at D-123, and are not a regression.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`, this file;
  - `coordination/archive/directives/DIR-WEB-D132-GATE-D-0001.{md,provenance.json}` and the index row;
  - `coordination/OPERATIVE_OBLIGATIONS.md` is unchanged.
- **Production:** the single deployment `cd4abd09…`. No product, `main`, D1, R2, Access, DNS, binding, secret, environment, project, `site_settings` or contact change.

## Unresolved findings and limitations

- **Worker traffic is light.** The analytics cover 4 post-deploy Worker invocations, all driven by these checks. They show no errors, but they are not a long-window production health signal.
- **Rendering method.** The live page was rendered from verified live bytes through interception, not by a browser connecting directly (see Browser method).
- **Unchanged items:** AS158-F001 (S6 test timing) remains, and S6 stays parked (OBL-024). The mobile, `og:image` and other deferred items are unchanged.
- **Evidence class.** The Cloudflare control-plane facts here are `ACTOR_REPORTED`.
- **Obligations.** Carried forward unchanged. OBL-017 held: this production deploy was separately authorized by D-132.

## Evidence locations

- Deployment `cd4abd09-62a8-49aa-ac2f-73824d8a5b99`; target version `666b7bef-9d41-47d0-b5ca-00b8351f9a29`; build `0588b13b-caf0-40cd-968b-ee68f0e21659`; rollback target `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` (unused).
- The readings above are quoted from the live calls. The screenshots were taken in the Builder session and are not committed.

## Governing references

- **T0:** D-132; `ML-DEVOS-AS-159`.
- **T1:** D-130 / `ML-DEVOS-AS-158`; D-123 / `H-WEB-V101-GATE-D-0001`; `ML-DEVOS-RFC-022`; OBL-017.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-D132-GATE-D-0001.md`.

## Next action

The Architect reviews `H-WEB-D132-GATE-D-0001` (scope `D132_GATE_D_ARCHITECT_REVIEW_ONLY`). `DEPLOY_AUTHORIZED` is reset to `NO`; no further production action is authorized.
