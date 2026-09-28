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

The D1 snapshot read in this measurement used a provisional `node:sqlite` stand-in (see Verification environment). Real Workers CPU and latency, including D1, must be measured before release (RFC-022 §7 test 11), under CB-R.

## Verification environment

The initial implementation session could not reach `registry.npmjs.org`, so it ran the D1-backed suites against local, uncommitted stand-ins for `wrangler` (`node:sqlite`) and `jose`. Those stand-ins are superseded. In a session with registry access, the following all ran against the real dependencies from `npm ci`: `jose` 6.2.12, `wrangler` 4.131.1, `miniflare` 5.20260911.0-alpha, `next` 16.3.5, `react`/`react-dom` 19.2.4.
- `npm test`: 934 tests; 934 pass, 0 fail, 0 skipped. The D1 suites used real local Miniflare D1 through `getPlatformProxy({ remoteBindings: false })`, with every migration through `0006`.
- `npm run build` succeeded (static `/admin`, `/journal`).
- Both evidence scripts reran and passed. The screenshots and `report.json` in this folder come from that run; only render timings changed.

The `GET /` performance figures above still come from the provisional run and are local proxies only. Real Workers CPU/D1 latency is a CB-R release item.

## Admin Content UI (`admin-ui-report.json`, `admin-ui-*.png`)

Produced by `node scripts/rfc022-admin-ui-evidence.mjs` after `npm run build`. It runs the same checks in Chromium against two renderers, each with an in-page mock API that records every request:
- `component` (`admin-ui-*.png`): the real `app/admin/ContentClient.js` with React 18.3.1 and Babel standalone, decoded from the artifact's bundle;
- `nextjs` (`admin-ui-nextjs-*.png`): the real `next build` static export, `out/admin.html` served at `/admin` (Next 16.3.5 with its bundled React 19). This is the built page the Worker serves after Access.

Both variants passed every check, with 0 console/page errors:
- the homepage count and AS132-F002 gate status are shown;
- a legacy project with a blank V10 section saves with `v10: null` (kept editable without homepage fields);
- a new project saves a complete `v10` group (4 flow steps, sorted discipline indices);
- publish sends the expected pointers, and a `HOMEPAGE_LIMIT` 409 is explained;
- the contact "Publish email" button stays disabled until the deliverability box is ticked, then sends `confirmDeliverability: true`;
- the Profile / Home, About and Navigation tabs show deferral notices, with no inputs inside the Content section.

The Tier 2 check is scoped to the Content section because the built page also contains the Design controls.

Found only by the built-page run: the site's dark body theme (`#020918`) applies on `/admin`, and `ContentClient`'s hard-coded light-theme note color and message tones were nearly unreadable there. They now use `DesignControls`' existing values (`inherit` at 0.8 opacity; `#e0564f` / `#3fa66a`).
