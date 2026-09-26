# Homepage artifact — local acceptance evidence (D-093)

Evidence class: `ACTOR_REPORTED`. Captured 2026-09-26 on Linux against `npx wrangler dev --local` (wrangler 4.131.1, local simulation only; the D1/R2 bindings are `remote: false`, no migration applied) serving the `out/` export, with Playwright 1.56.1 and Chromium. Not preview or production evidence.

`harness/art-accept.mjs` produced `acceptance.json` and the screenshots. Playwright's open-source Chromium has **no H.264 decoder**, so the harness answers the artifact's `/assets/video/logo-mark.mp4` request with a VP9 transcode of the same 5.04 s clip (made with a scratch static ffmpeg; not committed, not shipped). The shipped MP4 (H.264 Main, 960×960, 24 fps) is unchanged and plays natively in Chrome, Edge, Safari and Firefox with platform codecs; that was not observable here.

| # | Check | Result |
|---|---|---|
| 1 | Artifact SHA-256: ZIP entry = `public/index.html` = `out/index.html` = bytes served at `/` | PASS, `2417f7e5…f9f9` |
| 2 | JavaScript executes | PASS: page rendered, no bundle or Design System load errors |
| 3 | Logo animation plays | PASS: video `currentTime` 2.41 → 3.92 s in 1.5 s, playing, ready |
| 4 | Logo crossfade loop | PASS: opacity hands over between the two videos near the clip end (samples in `acceptance.json`) |
| 5 | Full motion | PASS: plate push animation active (1), orbit node moving, parallax transform applied on pointer move |
| 6 | Calm (`?motion=Calm`) | PASS: `MLMotion = Calm`, orbit static, logo video kept |
| 7 | Still / reduced motion | PASS: `MLMotion = Still`, no video elements, poster image shown, 0 running animations |
| 8 | Orbital motion | PASS: node moved (−313.8, 79.5) → (−399.1, 67.3) |
| 9 | Panels and interactions | PASS: all four panels open visible from the nav, Escape returns to Entry, discipline select, project pager, Research filter, mailto |
| 10 | Mobile 390×844 | renders, no horizontal overflow; **Research and Contact nav links run off-screen** (artifact behaviour) |
| 11 | `/journal` | PASS: HTTP 200, page renders; shows its load-error line because the local D1 is empty (unchanged behaviour) |
| 12 | `/admin`, `/admin/api/dashboard` | PASS: 401 from the Access check |
| 13 | Worker API routes | unchanged: `/api/journal`, `/api/design` return 500 against the empty local D1, exactly as before this change; `wrangler.jsonc` untouched |
| 14 | External runtime dependency | none: all requests same-origin (`/` plus the 10 mapped media) or `blob:`/`data:`; the only console warning is Babel's in-browser-transformer notice |
| 15 | Production | not promoted; no deploy, merge or remote action |

Other routes: `/index.html` 307 → `/`, unknown path 404, `/v10/assets/*` still served.
