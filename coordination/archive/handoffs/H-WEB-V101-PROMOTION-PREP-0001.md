# Current Handoff — V10.1 promotion preparation (D-121)

```yaml
schema_version: 1
handoff_id: H-WEB-V101-PROMOTION-PREP-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: ab1720fd5d8dedd18b284d11ad14d9ad6eadd545
review_target_commit: ab1720fd5d8dedd18b284d11ad14d9ad6eadd545
applicable_review_id: ML-DEVOS-AS-145
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence class: **`ACTOR_REPORTED`, local only.** Every hash, test, build and headless-browser result below was produced in the Builder's container. Nothing here is production evidence. No remote resource was read or mutated for this work.

## Objective

Execute `DIR-WEB-V101-PROMOTION-PREP-0001` (D-121, `ML-DEVOS-AS-145`): one atomic repository promotion-preparation change that promotes the exact accepted V10.1 candidate. The artifact, assets, SEO files, RFC-022 bridge constants and affected tests change together.

## Result

**Promotion prepared atomically in this return commit. The artifact and the bridge constants describe exactly the same bytes.**
- `public/index.html` is the accepted candidate byte-for-byte: SHA-256 `220ce809…`, 20,857 bytes.
- The candidate bytes were copied, not rebuilt.
- Suite 958/958; the Next build is green.
- Headless verification of the promoted state passes every D-121 check at 1440×900 and 1280×720.

The review diff is `ab1720f..` this return commit. The implementation and the return are one commit, as with D-111 (`9abb5f6`) and D-120 (`67b1d02`), so the atomic invariant holds inside a single commit.

## D-121 return items

### 1. Promotion-preparation commit SHA

This return commit. A commit cannot name its own SHA; the publication result and the governance branch tip record it. It is the only commit after the D-121 publication `ab1720f`.

### 2. Changed-file set

See **Changed files** below.

### 3. SHA-256 of `public/index.html`

**`220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`**. It is byte-identical (`cmp`) to `candidates/v10.1/site/index.html` as committed at `ab1720f`, and to `out/index.html` after the build.

### 4. Artifact length and insertion offset

- **Length:** 20,857 bytes.
- **Insertion offset:** byte 20,116, where `</head>` begins. It is the only `</head>`, and the head before it contains no `<script>`.

### 5. RFC-022 bridge constants (`worker/bridge/inject.mjs`)

```
ARTIFACT_SHA256 = "220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc"
ARTIFACT_LENGTH = 20857
INSERTION_OFFSET = 20116
```

Previously `2417f7e5…` / 1969988 / 1324. `HOOK_SOURCE`, `buildBridgeSpan`, `isApprovedArtifact`, `spliceArtifact` and `worker/public/home.mjs` are unchanged. The header comment now describes the promoted artifact: scripts at the end of the body, no loader document swap.

### 6. Test and build results

See **Tests and evidence** below.

### 7. Browser and bridge verification

See **Tests and evidence** below.

### 8. D-115 project content unchanged

- No project content, revision, draft or D1 row was touched. The five production drafts stay exactly as verified in `H-WEB-RFC022-CONTENT-DRAFTS-0002`.
- Rendered through the promoted artifact and the production bridge functions, the D-115 projects appear in the approved order: ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat.
- Their project panes, pager sequence, Systems text, `MLData` and Research filters are identical to the pre-promotion V10 artifact under the same bridge payload, at both viewports.
- Each pane contains the exact D-115 tagline and summary text.
- The data script (`data.f804d6673bf6.js`) is byte-identical to the V10 data resource.

### 9. No production mutation, merge or deployment

Confirmed. The Builder performed no:
- deploy or traffic change; Gate C, `main` merge or Gate D;
- D1 or R2 read or write; project publication or initial activation; activation marker;
- contact or `site_settings` change; email publication;
- Access, DNS, binding, secret, environment, schema or migration change.

`wrangler.jsonc` is unchanged. Production keeps serving the V10 artifact through Worker `862dc45e-9ad7-4324-80ae-912adbb6ce82`.

### 10. Limitations and newly discovered findings

See **Unresolved findings and limitations** below.

## Changed files

- **Promoted artifact** (byte-for-byte copies of the committed `candidates/v10.1/site/`):
  - `public/index.html` (replaced);
  - `public/v101/assets/` (34 new files);
  - `public/robots.txt`, `public/sitemap.xml`, `public/_headers` (new).
- **Bridge constants:** `worker/bridge/inject.mjs`, the three constants and the header comment.
- **Affected tests:**
  - `tests/homepage-artifact.test.mjs`:
    - pins `220ce809…`;
    - keeps the D-093 ZIP provenance (the ZIP entry is still `2417f7e5…`, the V10.1 build source);
    - asserts `public/index.html` equals the accepted candidate;
    - media and embedding checks now read the `/v101/` fingerprinted assets instead of the V10 bundle manifest, with fingerprint = content hash and no missing or unreferenced asset.
  - `tests/rfc022-bridge.test.mjs`:
    - the hook runs against the promoted artifact's data script (`/v101/assets/data.*.js`) instead of the V10 bundle manifest;
    - test 1 is renamed for the promoted bytes;
    - the unused `zlib` import is removed.
  - `tests/v101-candidate.test.mjs`: test 1 now asserts that the promoted `public/` files (index, SEO files, `_headers`, all 34 assets) are byte-identical to `candidates/v10.1/site/`, and that the three constants match the accepted SHA, length and offset.
  - `tests/worker-rfc022-content.test.mjs` imports the constants and needed no change.
- **Documentation:** `candidates/v10.1/README.md`, status line only.
- **Evidence (new):** `candidates/v10.1/evidence/promotion/`:
  - `serve-promoted.mjs` (local server over `out/` using the production bridge functions);
  - `browser-results.json`;
  - `browser-summary.txt`.
- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-V101-PROMOTION-PREP-0001.{md,provenance.json}` (byte-for-byte, unchanged since issue at `ab1720f`) and the index row.
- **Unchanged:**
  - `candidates/v10.1/site/**` and `build-report.json`; `scripts/build-v101-candidate.mjs`;
  - `worker/**` except the file above; `wrangler.jsonc`; `package.json`/lockfile;
  - `coordination/OPERATIVE_OBLIGATIONS.md`.

## Tests and evidence

### Test suite and build

- **`npm test`: 958 tests, 958 pass, 0 fail, 0 cancelled, 0 skipped.** The affected files alone:
  - `homepage-artifact` 5/5;
  - `rfc022-bridge` plus `worker-rfc022-content` 32/32;
  - `v101-candidate` 8/8.
- **`npm run build`** (from a clean `out/`): compiled successfully; static routes `/admin`, `/journal`, `/_not-found`.
  - `out/index.html` = `220ce809…`, 20,857 bytes.
  - `out/robots.txt`, `out/sitemap.xml`, `out/_headers` and `out/v101/` are byte-identical to `public/`.

### Browser and bridge verification

Setup:
- **Harness:** `candidates/v10.1/evidence/harness/run.cjs`, served by `evidence/promotion/serve-promoted.mjs`.
- **Assets:** the server serves the build output `out/`.
- **`/` as the Worker's RFC-022 path produces it:** production `isApprovedArtifact()` with the new constants returns `true`. Production `spliceArtifact()` then inserts a payload built by the production `buildBridgePayload()` from the five D-115 projects.
- **Variants:** promoted unbridged; promoted bridged; the pre-promotion V10 artifact bridged at its old offset, for content comparison only.
- **Viewports:** 1440×900 and 1280×720.

| Check (D-121) | Promoted result at both viewports |
|---|---|
| Artifact byte-identical to the accepted SHA | yes. `/` unbridged = `220ce809…`; `isApprovedArtifact` = `true` |
| RFC-022 injects successfully | yes. Bridged `/` renders the D-115 set |
| Five D-115 projects in the approved order | yes, in the index list and in 5× pager "Next": ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat |
| Project copy and data unchanged | yes; see item 8 |
| Entry, Systems, Projects, Research, Contact functional | yes. Escape returns to entry |
| Research filters; no dead `href="#"` | Research / Build / Thoughts / All → 1 / 1 / 1 / 3 cards, `aria-pressed` true. 0 `a[href="#"]` on the page (V10: 5) |
| Keyboard focus visible | yes. Wordmark and mailto links are `:focus-visible`, `outline: solid 2px` |
| No desktop horizontal overflow | yes. `scrollWidth == innerWidth` on every view |
| No new console errors | yes: 0 errors, 0 warnings, 0 failed requests other than the codec limitation below |
| Metadata and static SEO files intact | yes: `lang="en-PH"`, one `main`, description, canonical, OG 6/6, Twitter 3/3. `robots.txt` served 200; SEO files byte-identical |
| Runtime | production React, no Babel, head script-free (2 head scripts when bridged = the span) |

**Local render timing** (navigation to the rendered `h1`; indicative only): promoted 0.36–0.41 s; V10 about 1.21–1.24 s.

## Unresolved findings and limitations

- **Evidence limits:**
  - all evidence is local headless Chromium over the Next build output; there was no real device, Firefox or WebKit;
  - the browser run exercises the production bridge splice functions, not a live Worker with D1. The Worker's D1 snapshot path is covered by `tests/worker-rfc022-content.test.mjs`, which passes with the new constants;
  - the logo video (`/assets/video/logo-mark.mp4`, H.264) does not play in Playwright's Chromium, which has no proprietary codecs. The same happens with V10; the poster shows. Not a regression.
- **Repository and production intentionally diverge.** The repository's `/` artifact is now V10.1; production still serves V10 until Gate C and Gate D. A deploy built from this branch would ship V10.1 together with its matching constants.
- **Finding (non-blocking): the candidate build script no longer runs against `public/`.**
  - `scripts/build-v101-candidate.mjs` derives V10.1 from the V10 artifact, which it reads at `public/index.html`. That file is now V10.1.
  - The script therefore stops at its source-hash check and writes nothing. It cannot silently redefine the accepted artifact, which is the safe outcome AS-145 asked for.
  - Making it rebuild again (reading the V10 source from the D-093 ZIP entry) is out of D-121 scope and is left as a follow-up.
- **Stale comment (non-blocking):** the comment at the top of `worker/bridge/payload.mjs` still calls the artifact "D-093" and describes an embedded MLData assignment. Behavior is unaffected, since the data script keeps the same MLData keys. It is left unchanged under D-121's no-unrelated-cleanup rule.
- **Still deferred:** mobile and `og:image`.
- **Publication attempt keys:** D-121 was published with `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-121`, because the default Paulo→Claude key is exhausted in this clone. This return uses the default key. The local ledger was not edited.
- **Carried forward:**
  - AS132-F002 applies at initial activation; AS132-F003 remains open;
  - the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- **Promoted artifact and assets:** `public/index.html`, `public/v101/assets/`, `public/robots.txt`, `public/sitemap.xml`, `public/_headers`.
- **Accepted source bytes:** `candidates/v10.1/site/`; `candidates/v10.1/build-report.json`.
- **Constants:** `worker/bridge/inject.mjs`.
- **Tests:** `tests/homepage-artifact.test.mjs`, `tests/rfc022-bridge.test.mjs`, `tests/worker-rfc022-content.test.mjs`, `tests/v101-candidate.test.mjs`.
- **Browser evidence:**
  - `candidates/v10.1/evidence/promotion/browser-results.json`, `browser-summary.txt`, `serve-promoted.mjs`;
  - harness `candidates/v10.1/evidence/harness/run.cjs`.
- **Content reference:** `brain/DECISION_LOG.md` § D-115, § D-121.

## Governing references

- **T0:** Protocol V2; D-121; `ML-DEVOS-AS-145` (mandatory promotion invariant).
- **T1:** `ML-DEVOS-RFC-022` §5.1, §5.2, §5.4; D-120; D-115; D-093.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-V101-PROMOTION-PREP-0001.md`.

## Next action

The Architect reviews the promotion preparation under a new immutable `ML-DEVOS-AS-NNN`. Gate C (`main` merge), Gate D (deploy), initial activation and mobile each need separate Paulo authorization.
