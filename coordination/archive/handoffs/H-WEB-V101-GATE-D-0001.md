# Current Handoff — V10.1 Gate D production promotion (D-123)

```yaml
schema_version: 1
handoff_id: H-WEB-V101-GATE-D-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: a44e478fe4c4cb7a1138fa0cfd76196002c191b6
review_target_commit: a44e478fe4c4cb7a1138fa0cfd76196002c191b6
applicable_review_id: ML-DEVOS-AS-147
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence classes (`ACTOR_REPORTED`):
- live Cloudflare API calls through the Cloudflare MCP/API connector. Exactly one was a write (the deployment); every other call was a GET, or a read-only GraphQL Analytics query;
- GitHub public API reads;
- public HTTP GETs and a headless-browser smoke test from this cloud session.

## Objective

Execute `DIR-WEB-V101-GATE-D-0001` (D-123): promote the exact existing version `8fd31f47…` (V10.1) to 100% of production in one deployment; verify the live state read-only; roll back to `862dc45e…` only on a new material failure V10.1 causes.

## Result

**Gate D complete. `8fd31f47…` serves 100% of production. `/` serves the V10.1 artifact `220ce809…`. Every D-123 live check passes. Rollback NOT USED.**

| Item | Value |
|---|---|
| D-123 publication | `a44e478fe4c4cb7a1138fa0cfd76196002c191b6` (parent `8d9b122…`, the AS-147 publication) |
| `main` | `97ca982c9e8f1e306aaa8c8a5198f43f8e00629e` (`git ls-remote`, re-read in the preflight) |
| Candidate | `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` (#867, alias `main`, created 2026-09-29T19:58:24Z), from Workers Build `4eae04e3-02f3-4094-86bc-abc5f69b14d2` |
| Pre-deploy production | `862dc45e-9ad7-4324-80ae-912adbb6ce82` @ 100%, deployment `3fa32ba9-ae42-4023-9b8f-53c5178c2290`. Re-read at 21:17:35.948Z in the same call as the deployment; the call would have stopped on any difference |
| Operation | one connector call: `POST /accounts/{id}/workers/scripts/maisog-labs/deployments` with `{ strategy: "percentage", versions: [{ version_id: "8fd31f47…", percentage: 100 }], annotations: { "workers/message": "D-123 V10.1 Gate D promotion of main 97ca982c (build 4eae04e3)" } }`; HTTP 200, 21:17:36Z. It is the API equivalent of `npx wrangler versions deploy 8fd31f47…@100% --yes` (Wrangler is not authenticated in the Builder container; D-114 precedent), run once. No split, upload, rebuild or `wrangler deploy` |
| New deployment | **`b0f11606-80e3-4980-b617-e76bbacbf57c`**, created 2026-09-29T21:17:36.132Z, `source: api`, `workers/triggered_by: deployment` |
| Post-deploy production | **`8fd31f47…` @ 100%**, single version, no split. Read at 21:18:00Z, re-read unchanged at 21:21:06Z |
| Rollback | **NOT USED.** No qualifying failure occurred; `862dc45e…` remains available as the rollback target |

## Tests and evidence

### Preflight (fresh reads, 21:12–21:17Z) — all six D-123 conditions PASS

1. **`main`:** exactly `97ca982c…`. The only `main` Workers Build since Gate C is `4eae04e3…` (commit `97ca982c…`), so no newer `main` release exists.
2. **Candidate:** `8fd31f47…` exists and is inactive. Versions #868–#872 are branch previews (aliases `governance-maisoglabs-v0-1` and `claude-rfc-022-cb-r-migration-0gx6b9`), not `main` releases.
3. **Build link:** the Cloudflare `Workers Builds` GitHub check on `97ca982c…` (check run `109592890681`) states "Build ID: 4eae04e3… · Version ID: 8fd31f47…". Build `4eae04e3…`: branch `main`, commit `97ca982c…`, outcome `success`, `npx wrangler versions upload`.
4. **Bindings/config:** the candidate's bindings are identical to production `862dc45e…`'s:
   - `ACCESS_TEAM_DOMAIN` `jolly-disk-0469.cloudflareaccess.com`;
   - `ACCESS_AUD` `ef44d36e676be36eedb87d5378b8f3fd1ed40cc34505b7261a990c166a0cea22`;
   - `ASSETS`; `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523`; `MEDIA` → `maisog-labs-web-inc-004-local`;
   - compatibility date `2026-09-11`.

   No other binding, secret or variable.
5. **Production:** exactly `862dc45e…` @ 100% on deployment `3fa32ba9…`, with no split.
6. **Access:**
   - application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`: `self_hosted`, domain `maisoglabs.com/admin`; `self_hosted_domains` and `destinations` are exactly `maisoglabs.com/admin` and `maisoglabs.com/admin/*`;
   - AUD unchanged; IdP `169c0391…`;
   - the only policy is `62653faa…` (allow, one `email` include in the `maisoglabs.com` domain, no exclude/require);
   - `updated_at 2026-09-28T20:47:05Z`, the D-113 change and nothing since;
   - live `/admin` returns 302 to the Access login.

### Live HTTP after promotion (21:18:00–21:18:09Z, unauthenticated)

| Path | Pre (V10, `862dc45e…`) | Post (V10.1, `8fd31f47…`) |
|---|---|---|
| `/` | 200, 1,969,988 bytes, `2417f7e5…` | **200, 20,857 bytes, `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`** (25/25 identical). This is the raw V10.1 artifact with no publication span: the RFC-022 §5.4 fallback, since nothing is published |
| `/v101/assets/data.f804d6673bf6.js` | 404 | **200** `text/javascript`, `Cache-Control: public, max-age=31536000, immutable` |
| `/v101/assets/react.production.d949f1c3687a.js` | 404 | **200**, immutable |
| `/v101/assets/react-dom.production.35f4f974f4b2.js` | — | **200**, immutable; content hash starts `35f4f974f4b2` (matches its fingerprint) |
| `/robots.txt` | 200, 1,248 bytes (Cloudflare's zone-level managed "content signals" robots.txt) | **200, 76 bytes, SHA-256 `801054c0…`** (the accepted V10.1 file) |
| `/sitemap.xml` | 404 | **200** `application/xml`, the accepted sitemap (`/`, `/journal`) |
| `/api/journal` | 200 `application/json` | **200** `application/json` (14 bytes, `{"entries":[]}`) |
| `/api/design` | 200 `application/json` | **200** `application/json` (500 bytes) |
| `/journal` | 200 `text/html` | **200** `text/html` (10,213 bytes) |
| `/admin` | 302 → Access login | **302** → `https://jolly-disk-0469.cloudflareaccess.com/cdn-cgi/access/login/maisoglabs.com…`, `Cache-Control: private, … no-store` |
| `/admin/api/content` | 302 → Access login | **302** → Access login |
| `/assets/plates/plate-hero-v4.png` | 200 | **200** |

Authentication was not weakened or bypassed. No authenticated admin request was made by the Builder.

### Live browser smoke (headless Chromium, 1440×900 and 1280×720)

- **Method:** the harness `candidates/v10.1/evidence/harness/run.cjs` against the live site. A local relay on `127.0.0.1` fetched every path from `https://maisoglabs.com` with `curl`, with TLS verified against the proxy CA. It returned the exact live bytes and content types to the browser.
  - The relay was needed because Playwright's Chromium does not trust the session's egress-proxy CA, and TLS verification was not disabled.
  - The browser therefore exercised the live V10.1 bytes, not local files.
- **Results, identical at both viewports:**
  - **Rendering:** `/` renders (`h1` wordmark). Document: `lang="en-PH"`, one `main`, description, canonical `https://maisoglabs.com/`, Open Graph 6/6, Twitter 3/3.
  - **Runtime:** production React; `window.Babel` absent; 0 `text/babel` scripts; head script-free. The old self-unpacking runtime and browser Babel are no longer served.
  - **Navigation:**
    - Systems opens; Projects list and pager navigate all five entries; Research opens; Contact opens; Escape returns to entry.
    - Projects shows the artifact's own built-in data (Sentinel / DevOS, SU, ClinicFlow, Maisog Kilat, Maisog Guild), as in V10, because nothing is published. The D-115 drafts are correctly absent.
  - **Research:** heading "Research Previews"; "Notes in preparation" non-interactive; filters Research / Build / Thoughts / All → 1 / 1 / 1 / 3 cards, `aria-pressed` true; **0 `href="#"` links** on the page.
  - **Contact:** the address is on one line (25.2 px at 1440, 22.4 px at 1280).
  - **Accessibility and layout:** keyboard focus visible (`:focus-visible`, 2 px outline) on the wordmark and mailto links; no horizontal overflow on any view.
  - **Console:** 0 errors and 0 warnings. The only failed request is `/assets/video/logo-mark.mp4` (H.264), the known Playwright-Chromium codec limitation, identical under V10. Not a regression.
  - The render time measured through the relay (2.7–3.3 s) includes the relay's per-request `curl` overhead. It is not a performance figure.

### Worker health and RFC-022 latency/CPU (pre vs post)

- **Worker analytics** (GraphQL `workersInvocationsAdaptive`, `scriptName: "maisog-labs"`, grouped by `scriptVersion`/`status`; CPU and wall time in µs; read 21:20:53Z):

  | Window | Version | Invocations | Status | Errors | CPU p50 / p90 / p99 | Wall p50 / p99 |
  |---|---|---|---|---|---|---|
  | 21:12:00–21:17:35Z (pre) | `862dc45e…` | 28 | all `success` | **0** | 2.64 / 5.58 / 6.14 ms | 117.8 / 220.2 ms |
  | 21:17:36–21:20:53Z (post) | `8fd31f47…` | 31 | all `success` | **0** | 2.85 / 4.32 / 5.07 ms | 104.0 / 249.0 ms |

  **No Worker exception and no binding failure.** `/api/journal` and `/api/design` returned 200 through D1, and `/` returned 200 through `ASSETS` and the D1 snapshot read. A second analytics query at 21:21:06Z returned no parsable result (cause not diagnosed); the figures above are the one complete read.
- **Client round-trip latency** (`GET https://maisoglabs.com/`, 25 sequential requests per phase, unique query string, `Cache-Control: no-cache`, `curl` from this session through its egress proxy; client figures, not Worker-only):

  | Phase | Window | Status | Body | Total median / p95 | TTFB median / p95 |
  |---|---|---|---|---|---|
  | Pre (`862dc45e…`) | 21:17:04–21:17:16Z | 25 × 200 | 1,969,988 B, `2417f7e5…` | 408.5 / 807.9 ms | 326.5 / 726.2 ms |
  | Post (`8fd31f47…`) | 21:18:00–21:18:09Z | 25 × 200 | 20,857 B, `220ce809…` | 315.8 / 538.1 ms | 308.8 / 537.6 ms |

  - The initial HTML payload fell from 1.97 MB to 20.9 KB. Total round-trip median improved by about 93 ms, and TTFB is comparable.
  - Worker CPU for `/` in fallback stays about 2.6–2.9 ms at p50: the D1 snapshot read plus the asset fetch.
  - The bridged-path cost (published payload splice) is still unmeasured because nothing is published.

### Separation from project activation and no other production change

- **No publication:** `/` serves the raw artifact hash (no span), so no project or contact payload is published.
- **Not done by the Builder:**
  - no D1 query or write (D1 metadata only: `maisog-labs-web-inc-005-local`, 23 tables, 282,624 bytes, unchanged);
  - no project publication or activation; no `homepage_initial_activation`; no contact-email or `site_settings` change;
  - no R2, Access, DNS, binding, secret, environment, schema or migration change;
  - no version upload, rebuild or `wrangler deploy`; no merge.
- **AS132-F002:** not consumed.
- **Deployments:** 10 entries. The latest is `b0f11606…`, preceded by `3fa32ba9…`. Exactly one new deployment, no rollback.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-V101-GATE-D-0001.{md,provenance.json}` (byte-for-byte, unchanged since issue at `a44e478`) and the index row.
- **Unchanged:** `coordination/OPERATIVE_OBLIGATIONS.md`.
- **Outside this commit:** the production deployment `b0f11606…`. No product, test or configuration file change.

## Unresolved findings and limitations

- **New finding (informational): the robots.txt source changed.**
  - Before Gate D, `/robots.txt` was Cloudflare's zone-level **managed** robots.txt: the "content signals" preamble, 1,248 bytes. V10 had no robots file.
  - V10.1 ships its own `robots.txt`, which is now served exactly (76 bytes, `801054c0…`). Cloudflare's managed content-signal declarations no longer appear in the served file.
  - This follows from the D-120 SEO item that AS-145 accepted, and is not a failure. Whether to add content-signal lines to the repository file, or rely on zone settings, is a Paulo/Architect choice. No zone setting was changed.
- **Homepage project list:** until initial activation, the live homepage shows the V10 artifact's built-in five entries, which include "Maisog Guild" and not "Eternal Eggs". This is unchanged from V10 and expected per AS-147.
- **Live browser evidence method:** a curl relay, as described above. It covers the page, assets and runtime behavior. It does not test the browser's own TLS or HTTP/2 path to Cloudflare, which the curl probes cover separately.
- **Latency provenance:** a single client behind this environment's egress proxy, run sequentially. Not representative of end-user latency. Worker CPU is the Worker-only evidence. Analytics are adaptively sampled, with no per-path dimension.
- **Not exercised:** authenticated admin through the Worker (the owner's step); the bridged `/` path.
- **Carried forward:**
  - AS-147 non-blocking items: the candidate build script fails safely; the `payload.mjs` comment debt; no Firefox/WebKit/real-device coverage; mobile and `og:image` deferred;
  - AS132-F002 pending initial activation; AS132-F003 open;
  - the traceability validator's pre-existing 3 ERRORs and DRIFT.
- **Publication attempt key:** D-123 was published with `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-123`. The local ledger was not edited.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged. `OBL-017`'s separate production deploy gate was exercised here under D-123.

## Evidence locations

- Deployments: `b0f11606-80e3-4980-b617-e76bbacbf57c` (new), `3fa32ba9-ae42-4023-9b8f-53c5178c2290` (previous).
- Versions: `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` (active); `862dc45e-9ad7-4324-80ae-912adbb6ce82` (rollback target, unused).
- Workers Build `4eae04e3-02f3-4094-86bc-abc5f69b14d2`; GitHub check run `109592890681` on `97ca982c…`.
- Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`, policy `62653faa-4c3c-4b96-a53f-7545f79dbd43`.
- Account `fb7234ae9117baf1481ab3b169a9824a`; D1 `45b87574-e573-4e0f-9bb6-fbba2df29523`.

## Governing references

- **T0:** Protocol V2; D-123; `ML-DEVOS-AS-147`.
- **T1:** D-114 / `H-WEB-RFC022-GATE-D-0001` (Gate D precedent); `ML-DEVOS-RFC-022` §5.4, §7 test 11; D-121; D-122.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-V101-GATE-D-0001.md`.

## Next action

The Architect reviews the Gate D return under a new immutable `ML-DEVOS-AS-NNN`. Each of the following needs separate Paulo authorization:
- initial project activation (AS132-F002);
- contact-email publication;
- mobile;
- `og:image`;
- any robots.txt content-signal decision.
