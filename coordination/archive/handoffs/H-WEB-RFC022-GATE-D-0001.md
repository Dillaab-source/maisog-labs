# Current Handoff — RFC-022 Gate D production promotion (D-114)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-GATE-D-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: c30ef6fb9bf6709528ab3ea988cf6e6d0087d62b
review_target_commit: c30ef6fb9bf6709528ab3ea988cf6e6d0087d62b
applicable_review_id: ML-DEVOS-AS-140
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence classes (`ACTOR_REPORTED`):
- live Cloudflare API calls through the Cloudflare MCP/API connector. Exactly one was a write (the deployment); every other call was a GET, or a read-only GraphQL Analytics query;
- public HTTP GETs from this cloud session.

## Objective

Execute `DIR-WEB-RFC022-GATE-D-0001` (D-114): promote the exact `main` candidate `862dc45e…` to 100% of production in one deployment; verify health and Access; collect RFC-022 §7 test 11 evidence; roll back only on a new material failure the candidate caused.

## Result

**Gate D complete. `862dc45e…` serves 100% of production. All health checks pass. Test 11 satisfied (see limits below). Rollback NOT USED.**

| Item | Value |
|---|---|
| D-114 publication | `c30ef6fb9bf6709528ab3ea988cf6e6d0087d62b` (parent `c24f888…`, the AS-140 reviewed tip) |
| `main` | `405375998392e936b71181de387ae395b7d46e40` (Workers Build `ded31be5-394e-4674-95d9-88d904e784aa`, the only `main` build) |
| Candidate | `862dc45e-9ad7-4324-80ae-912adbb6ce82` (#828, alias `main`, created 20:37:30Z) |
| Previous production | `53137101-afb8-456c-ab83-d8b7b934df01` |
| `PRE_GATE_D` | `53137101…` @ 100%, deployment `3bf053d6-56b8-4412-a96a-a587588f8521`, re-read at 2026-09-28T21:09:06.173Z in the same call as the deployment |
| Operation | one connector call: `POST /accounts/{id}/workers/scripts/maisog-labs/deployments` with `{ strategy: "percentage", versions: [{ version_id: "862dc45e…", percentage: 100 }], annotations: { "workers/message": "D-114 RFC-022 Gate D promotion of main 40537599 (build ded31be5)" } }`; HTTP 200. The equivalent of `wrangler versions deploy 862dc45e…@100%`, run once. No split, upload, rebuild or `wrangler deploy`. |
| New deployment | `3fa32ba9-ae42-4023-9b8f-53c5178c2290`, created 21:09:06.289Z, `source: api`, `workers/triggered_by: deployment` |
| `POST_GATE_D` | `862dc45e…` @ 100% (read 21:09:13Z; re-read 21:12:56Z, unchanged) |
| Rollback | **NOT USED.** No qualifying failure occurred. |

## Tests and evidence

### Pre-promotion gate (fresh reads, 21:05Z)

1. **STATE:** selects `DIR-WEB-RFC022-GATE-D-0001` (authority D-114); `DEPLOY_AUTHORIZED` is the only `YES` flag. Protocol V2 bootstrap `ok: true` on `c30ef6f`.
2. **`main`:** `405375998…` (`git ls-remote`). The only `main` Workers Build is `ded31be5…` for that commit, so no newer `main` release exists.
3. **Candidate:** `862dc45e…` exists and is inactive. The newer versions #831–#833 are branch previews (aliases `governance-maisoglabs-v0-1`, `claude-rfc-022-cb-r-migration-0gx6b9`), not `main` releases.
4. **Candidate bindings:**
   - `ACCESS_TEAM_DOMAIN` `jolly-disk-0469.cloudflareaccess.com`;
   - `ACCESS_AUD` `ef44d36e676be36eedb87d5378b8f3fd1ed40cc34505b7261a990c166a0cea22`;
   - `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523`; `MEDIA` → `maisog-labs-web-inc-004-local`; `ASSETS`.
5. **Access application `b80acca4…`:**
   - domain `maisoglabs.com/admin`; `self_hosted_domains` and `destinations` exactly `maisoglabs.com/admin` and `maisoglabs.com/admin/*`;
   - AUD unchanged; team domain `jolly-disk-0469.cloudflareaccess.com`; IdP `169c0391…`;
   - the only policy is `62653faa…` (allow, include exactly `paulo.maisog@maisoglabs.com`, no exclude/require);
   - `updated_at 2026-09-28T20:47:05Z`, the D-113 change and nothing since.
6. **Active production:** exactly `53137101…` @ 100% on deployment `3bf053d6…`, with no split.

### HTTP smoke after promotion (21:09:28Z, unauthenticated)

| Path | Result |
|---|---|
| `/` | **200**, `text/html`, 1,969,988 bytes, SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` (the approved D-093 artifact) with the asset's own `Cache-Control: public, max-age=0, must-revalidate`. This is the RFC-022 §5.4 fallback: no bridge payload is published. |
| `/api/journal` | **200** `application/json` `{"entries":[]}` |
| `/api/design` | **200** `application/json`, the seeded theme (`heroBackgroundPreset: "cinematic-v3"`, …) |
| `/journal` | **200** `text/html` |
| `/admin` | **302** → `https://jolly-disk-0469.cloudflareaccess.com/cdn-cgi/access/login/maisoglabs.com`, `Cache-Control: private, max-age=0, no-store, …`. Intercepted by Cloudflare Access. |
| `/admin/api/content` | **302** to the same Access login. Intercepted by Cloudflare Access. |

Authentication was not weakened or bypassed. No authenticated admin request was made by the Builder.

### RFC-022 §7 test 11 — real production measurement

**Client round-trip latency, `GET https://maisoglabs.com/`:**
- 25 sequential requests per phase, each with a unique query string and `Cache-Control: no-cache`;
- measured with `curl` from this cloud session, through its egress proxy. These are client round-trip figures, **not** Worker CPU and not Worker-only latency.

| Phase | Window (UTC) | Status | Body | Total median / p95 | TTFB median / p95 |
|---|---|---|---|---|---|
| Pre (`53137101…`) | 21:05:37–21:05:46 | 25 × 200 | all `2417f7e5…` | 354.9 / 560.9 ms | 236.5 / 452.9 ms |
| Post (`862dc45e…`) | 21:09:39–21:09:50 | 25 × 200 | all `2417f7e5…` | 410.7 / 549.6 ms | 308.2 / 434.6 ms |

**Worker analytics:**
- **Source:** Cloudflare GraphQL Analytics API (`workersInvocationsAdaptive`), filtered to `scriptName: "maisog-labs"` and grouped by `scriptVersion`/`status`, read at 21:12:56Z. `cpuTime`/`wallTime` are in microseconds.
- **Pre window 21:05:00–21:09:05Z (`53137101…`): 0 invocations**, despite the 25 pre-sample requests.
  - `53137101…` was built from the pre-RFC-022 release, whose `run_worker_first` does not include `/` (`7d22a96`). `/` was therefore served asset-first and never ran the Worker.
  - The old version's Worker CPU for `GET /` is 0 by construction.
  - For context, the one earlier `53137101…` invocation in the prior hour (a non-`/` path) used 714 µs CPU.
- **Post window 21:09:00–21:12:56Z (`862dc45e…`):**
  - **28 invocations, all `status: success`, `errors: 0`**, 26 subrequests;
  - CPU p25 1.288 ms, p50 **1.858 ms**, p75 2.552 ms, p90 **4.068 ms**, p99 **5.008 ms**;
  - wall time p50 107.2 ms, p99 200.0 ms.
- **Attribution:**
  - The Builder's traffic in the window accounts for about 29 Worker invocations: 25 `/` probes, 2 `/` smoke fetches, `/api/journal` and `/api/design`. `/journal` is not Worker-first, and `/admin` is intercepted by Access before the Worker.
  - The analytics are adaptively sampled and not broken down by path, so the 28 invocations are dominated by, but not exclusively, `GET /`.
  - The figures were identical at 21:11:42Z and 21:12:56Z (settled).
- **Interpretation (evidence, not a threshold):**
  - RFC-022 makes `/` Worker-first. In artifact fallback, each request now costs about 1.9 ms CPU at p50 (≤ 5.0 ms at p99): the D1 snapshot read plus the asset fetch.
  - The client round-trip medians differ by about 56 ms total and about 72 ms TTFB, with overlapping p95s. That is within what this proxied single-client sample can resolve.

**Test 11 status:** satisfied for the artifact-fallback state (real latency sample, real Worker CPU and errors for both versions). RFC-022's bridged path (published projects spliced into `/`, including the SHA-256 artifact verification) is not yet exercised in production. Measuring it needs published content, which is out of D-114 scope.

### No other production change

- **Deployments:** 10 entries. The latest is `3fa32ba9…`, preceded by `3bf053d6…`. No second deployment and no rollback.
- **D1 (metadata only, no query):** `maisog-labs-web-inc-005-local`, `num_tables` 23, `file_size` 282624. Identical to the post-`0006` reading, so there was no D1 write.
- **Not done by the Builder:**
  - no D1 query, write, migration or restore;
  - no content, project, activation, `site_settings` or email change;
  - no R2, Access, DNS, binding, secret, environment or observability change;
  - no version upload, rebuild or `wrangler deploy`;
  - no `main` merge.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-GATE-D-0001.{md,provenance.json}` (byte-for-byte, blob `0a36d8e…`) and the index row;
  - `coordination/OPERATIVE_OBLIGATIONS.md` is unchanged.
- **Outside this commit:** the production deployment `3fa32ba9…`. No product, test or configuration file change.

## Unresolved findings and limitations

- **Latency provenance:** client latency comes from a single client behind this environment's egress proxy, run sequentially. It is not representative of end-user latency across regions. Worker CPU is the Worker-only evidence.
- **Analytics sampling:** `workersInvocationsAdaptive` is sampled, and has no per-path dimension here. The invocation count (28 vs about 29 expected) is consistent, not exact.
- **Bridged-path performance not yet measured:** the CPU cost of `/` once projects are published (digest verification and splice) remains to be measured after initial activation.
- **Admin login through the Worker:** not exercised by the Builder. Access interception is verified. An authenticated admin session as `paulo.maisog@maisoglabs.com` is the owner's step.
- **Publication attempt key:** the D-114 issue transition was published with `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-114`, as for D-113. The local ledger was not edited.
- **Remaining activation prerequisites (each separately authorized):**
  - owner-approved project copy for the five, including Eternal Eggs;
  - initial activation (AS132-F002);
  - contact draft/publish (AS-140 does not authorize email publication).
- **Carried forward:** AS132-F003 remains open; the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged. `OBL-017`'s separate production deploy gate was exercised here under D-114.

## Evidence locations

- Deployments: `3fa32ba9-ae42-4023-9b8f-53c5178c2290` (new), `3bf053d6-56b8-4412-a96a-a587588f8521` (previous).
- Versions: `862dc45e-9ad7-4324-80ae-912adbb6ce82` (active), `53137101-afb8-456c-ab83-d8b7b934df01` (rollback target, unused).
- Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`, policy `62653faa-4c3c-4b96-a53f-7545f79dbd43`.
- Account `fb7234ae9117baf1481ab3b169a9824a`; D1 `45b87574-e573-4e0f-9bb6-fbba2df29523`.

## Governing references

- **T0:** Protocol V2; D-114; `ML-DEVOS-AS-140`.
- **T1:** `ML-DEVOS-RFC-022` §5.4, §7 test 11, §10.1; D-100/D-101 (Gate D precedent); D-112/AS-139.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-GATE-D-0001.md`.

## Next action

The Architect reviews the Gate D return. The following each need separate Paulo authorization:
- production project drafts and approved copy;
- initial activation;
- contact email publication.
