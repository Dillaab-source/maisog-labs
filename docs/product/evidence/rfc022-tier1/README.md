# RFC-022 Tier 1 — local browser and performance evidence (D-106)

Produced by `node scripts/rfc022-browser-evidence.mjs` with Chromium from the environment's global Playwright install. Evidence class: `ACTOR_REPORTED`.

**Test-fixture content only.** The bridged variant uses placeholder copy ("Test fixture …", `fixture-contact@example.com`) built through the real `worker/bridge` library. It is not production content, and no Eternal Eggs copy or email status is implied (AS132-F002 remains a release gate).

## Browser render (`report.json`, screenshots)

| Variant | Viewports | Non-blank | Console/page errors | MLData after render |
|---|---|---|---|---|
| `artifact` (untouched `public/index.html`) | 1440×900, 390×844 | yes | 0 | the artifact's own five projects, `maisog36@gmail.com` |
| `bridged` (artifact + one bridge span) | 1440×900, 390×844 | yes | 0 | ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat; 4 flow stages each; fixture email shown in the Contact panel |

- The bridged body is the artifact plus 3,766 bytes (the span), inserted before the outer `</head>`.
- The V10 composition, panels, orbit, flow figure and navigation are unchanged in the screenshots; only data-driven text differs.

## Local performance of `GET /` (Node 22, 4 vCPU; a proxy for Workers CPU, not a Workers measurement)

| Path | Median | p90 |
|---|---|---|
| No published content → untouched asset | 1.54 ms | 4.03 ms |
| Bridged, 5 projects, full handler (artifact digest memoized by ETag) | 4.88 ms | 7.89 ms |
| Full SHA-256 verification of the 2 MB artifact (first request per isolate / unseen ETag) | 6.08 ms | 7.45 ms |
| Splice | 0.39 ms | 0.45 ms |

The D1 snapshot read in this measurement used a provisional `node:sqlite` stand-in (see below). Real Workers CPU and latency, including D1, must be measured before release (RFC-022 §7 test 11), under CB-R.

## Provisional-environment note

This session's network policy blocked `registry.npmjs.org`, so `wrangler`, `jose` and `next` could not be installed. The D1-backed suites were therefore run provisionally against:
- local, uncommitted stand-ins for `wrangler` (`getPlatformProxy` backed by `node:sqlite`);
- a minimal ES256 `jose`.

The full suite, `npm run build`, and these suites against real Miniflare D1 must be re-run in a session with registry access before the D-106 return is published.
