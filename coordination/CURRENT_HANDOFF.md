# Current Handoff — RFC-022 Tier 1 Implementation (D-106)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-TIER1-IMPL-0001
cycle_id: MAISOGLABS_WEB_RFC022_TIER1_IMPL
input_base_commit: f884e6e2917cf7e598cb00add083470115e5e5b6
review_target_commit: f884e6e2917cf7e598cb00add083470115e5e5b6
applicable_review_id: ML-DEVOS-AS-132
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result here is `ACTOR_REPORTED` and local. Nothing here is preview, remote or production evidence.

## Objective

Execute `DIR-WEB-RFC022-TIER1-IMPL-0001` (D-106): implement RFC-022 Tier 1, CB-1..CB-5, in the repository with local evidence only, and return it for Architect review.

## Result

CB-1..CB-5 are implemented and all were verified locally against the real dependencies.
- **Reviewed change:** this return commit's diff against `f884e6e` (the D-106 authorization). It carries the implementation and the coordination transition together, as the D-093 return `f2c13aa` did.
- **Unsquashed Builder history:** available for provenance on `claude/jose-npm-registry-check-w2vxoo`:
  - `8a5559e`: implementation (session 1, npm blocked);
  - `c226d96`: legacy-project edit fix and the Content UI evidence script;
  - `e3d644b`: real-dependency verification and the fix below.
- **`public/index.html`:** SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`, unchanged. No file under `public/` changed.

## Implementation by increment (RFC-022 §10)

- **CB-1** (`worker/bridge/`):
  - `payload.mjs`: bounded payload contract; the five-project limit; exactly four flow stages; hostile-value rejection; the AS132-F002 activation gate (the exact D-105 set, in order).
  - `inject.mjs`: the approved-artifact SHA precondition; one bounded span spliced at a fixed offset before the outer `</head>`; escaping of `< > &` U+2028 and U+2029; the MLData hook; AS132-F001 transformed-response headers.
  - `snapshot.mjs`: the published-only D1 read.
- **CB-2:** `migrations/0006_rfc022_v10_project_fields.sql` adds four nullable, CHECK-bounded `project_revisions` columns: `tagline`, `status`, `disciplines_json`, `flow_json`. In the project lifecycle (`worker/d1/projects.mjs`, `worker/admin/projects.mjs`, `worker/d1/validate.mjs`, `worker/d1/schema.mjs`):
  - the `v10` group is optional and all-or-nothing;
  - the homepage limit of five is enforced by a pre-check and a commit-time guard;
  - an edit that omits `v10` inherits it;
  - legacy projects stay publishable.
- **CB-3** (`worker/d1/site.mjs`, `worker/admin/content.mjs`, `worker/d1/audit.mjs`): contact email draft/publish. Publishing requires `confirmDeliverability: true`, stale writes fail, and the audit append is atomic.
- **CB-4:**
  - `/admin/api/content` and the Access-protected `/admin/preview/home`, where drafts are visible only to an admin;
  - `app/admin/ContentClient.js`: Projects and Contact tabs; Profile / Home, About and Navigation show deferral notices with no inputs; no HTML, CSS, JS, URL, selector or asset input.
- **CB-5:**
  - exact `/` is Worker-first (`wrangler.jsonc`, `worker/index.mjs`, `worker/public/home.mjs`), and every failure falls back to the untouched artifact;
  - `docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md` records the D-105 Q1 bounded amendment, and `docs/ARCHITECTURE.md` is updated;
  - Playwright evidence scripts are added.

## Changed files

- **Product and tests:**
  - `app/admin/ContentClient.js` (new), `app/admin/page.js`;
  - `worker/bridge/{inject,payload,snapshot}.mjs` (new), `worker/public/home.mjs` (new), `worker/d1/site.mjs` (new), `worker/admin/content.mjs` (new);
  - `worker/admin/{dashboard,projects}.mjs`, `worker/d1/{audit,projects,schema,validate}.mjs`, `worker/index.mjs`;
  - `migrations/0006_rfc022_v10_project_fields.sql` (new), `wrangler.jsonc` (adds exactly `"/"` to `run_worker_first`);
  - `tests/rfc022-bridge.test.mjs` (new), `tests/worker-rfc022-content.test.mjs` (new), `tests/homepage-artifact.test.mjs`.
- **Docs and evidence:**
  - `docs/ARCHITECTURE.md`, `docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md`;
  - `docs/product/evidence/rfc022-tier1/` (README, `report.json`, `admin-ui-report.json`, 18 screenshots);
  - `scripts/rfc022-browser-evidence.mjs`, `scripts/rfc022-admin-ui-evidence.mjs`.
- **Coordination:**
  - `coordination/STATE.md`, this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-TIER1-IMPL-0001.{md,provenance.json}` and the index row.
  - The outgoing `H-WEB-RFC022-AMEND-0001` was already archived. `OPERATIVE_OBLIGATIONS.md` is unchanged: every row is carried forward as is.

## Fix made during verification

**Dark theme (in scope, CB-4).** The site's dark body theme (`#020918`) applies on `/admin`. On the built page, `ContentClient`'s light-theme note color (`#444`) and message tones (`#1b5e20` / `#b00020`) were nearly unreadable. They now use `DesignControls`' existing values (`inherit` at 0.8 opacity; `#3fa66a` / `#e0564f`). This affects style only. Only the Next.js-build check could show it, because the React 18 harness has no site CSS.

**Admin evidence script.** `scripts/rfc022-admin-ui-evidence.mjs` now runs the same checks against both renderers. Its Tier 2 "no inputs" check is scoped to the Content section, because the built page also contains the Design controls.

## Tests and evidence

**Environment:** real dependencies from `npm ci`:
- `jose` 6.2.12;
- `wrangler` 4.131.1;
- `miniflare` 5.20260911.0-alpha;
- `next` 16.3.5;
- `react`/`react-dom` 19.2.4;
- Chromium from the global Playwright install.

| Check | Result |
|---|---|
| `node scripts/check-context-bootstrap.mjs --commit f884e6e… --session-protocol 2` | `ok: true` |
| `npm ci` | exit 0; 0 vulnerabilities |
| `npm test` (full suite) | 934 tests; 934 pass, 0 fail, 0 skipped, 0 cancelled. D1 suites on real local Miniflare D1 (`getPlatformProxy({ remoteBindings: false })`), migrations through `0006`. Run twice: before and after the fix. |
| `npm run build` | exit 0; static `/admin`, `/journal`, `/_not-found`. Run before and after the fix. |
| `wrangler d1 migrations apply DB --local --persist-to <scratch>` | `0001`–`0006` all ✅. `project_revisions` then has `tagline`, `status`, `disciplines_json`, `flow_json`. Local only, in a throwaway directory. |
| `node scripts/rfc022-browser-evidence.mjs` | exit 0. Artifact and bridged variants at 1440×900 and 390×844: all non-blank, 0 console/page errors. The bridged variant shows the fixture projects and email; the body delta is 3,766 bytes. |
| `node scripts/rfc022-admin-ui-evidence.mjs` | exit 0. 10/10 checks, 0 errors, for both the `component` variant (React 18.3.1) and the `nextjs` variant (built `out/admin.html`: Next 16.3.5 with its bundled React `19.3.0-canary-cbb046ab-20260731`) |
| `git diff --check` over the full range from `f884e6e` | clean |
| Scope audit of the changed-file set (AS132-F003 manual inspection) | no file under `public/`, `devos/execution/` or `tests/fixtures/execution/`; no `/api/site-content` |

### RFC-022 §7 / AS-131 acceptance mapping

| # | Requirement | Evidence |
|---|---|---|
| 1 | artifact SHA unchanged | `rfc022-bridge` "approved D-093 bytes (test 1)"; `sha256sum` above |
| 2 | no-published-content `/` byte-identical | `worker-rfc022-content` "(test 2)"; seeded legacy content ignored |
| 3 | D1 error/timeout byte-identical | `worker-rfc022-content` "(test 3)" |
| 4 | injected response differs only by the span | `rfc022-bridge` "splice … (test 4)"; `worker-rfc022-content` "publishing the initial five … (tests 4, 11-header)" |
| 5 | hostile data cannot execute | `rfc022-bridge` "(test 5)", serialization escaping, hook robustness; `worker-rfc022-content` "(tests 5, 9)" |
| 6 | drafts never reach `/` | `worker-rfc022-content` "(test 6)"; contact draft not public |
| 7 | stale mutations fail without partial publication | `worker-rfc022-content` "(test 7)"; contact stale writes |
| 8 | >5 homepage projects rejected before publication | `rfc022-bridge` "(test 8)"; `worker-rfc022-content` "(test 8)" |
| 9 | exactly four flow stages | `rfc022-bridge` "(test 9)"; `worker-rfc022-content` "(tests 5, 9)" |
| 10 | no console error, no blank page | `report.json`: 4/4 runs non-blank with 0 errors |
| 11 | `/` Worker CPU and latency measured before release | **Not met; release item.** Local Node proxies only; see limitations |
| 12 | D-093 artifact hash tests still pass | `tests/homepage-artifact.test.mjs` passes in the full suite |
| AS132-F001 | transformed responses drop body-identity validators and are `no-store` | `rfc022-bridge` "AS132-F001 …"; `worker-rfc022-content` "(tests 4, 11-header)" |

## Unresolved findings and limitations

- **RFC-022 §7 test 11 is not met.** The only `GET /` figures are local Node proxies (median 4.88 ms bridged, 1.54 ms fallback). Their D1 read came from the first session's `node:sqlite` stand-in and was not re-measured on Miniflare. Real Workers CPU and D1 latency need a deployed Worker and belong to CB-R.
- **AS132-F002 is still an open release gate.** The activation gate is implemented and tested, but no Eternal Eggs copy or email deliverability status exists or was invented. Evidence uses placeholder fixture content only.
- **Mock API in the admin UI evidence.** Both admin UI variants run against an in-page API that records requests, not against the Worker behind Access. The Worker handlers themselves are covered by the Miniflare D1 suite, For `/admin/preview/home`, the authenticated path is driven post-auth through `handleAdminDispatch`. An unauthenticated request is shown to get a 401 through `handleRequest`, with a stub JWKS and without reaching dispatch. No real Access was involved.
- **React version on the built page.** `/admin` runs the React that Next 16.3.5 bundles for the App Router (`19.3.0-canary-cbb046ab-20260731`), not the `react@19.2.4` package. This is standard Next behavior and is recorded as observed.
- **Miniflare version.** `wrangler` 4.131.1 resolves `miniflare` `5.20260911.0-alpha` under the existing `^4.35.0` range. The lockfile was not changed.
- **Squashed history.** Governed publication requires one candidate commit on the exact tip, so the three Builder commits are squashed here. Their originals are named above.
- **Traceability validator (pre-existing).** `validate-traceability.mjs` exits 1 with the same 3 ERRORs (`CORE-022`, `D-000`, `WEB-REQ-009`) and the same generated-index DRIFT, both at the tip `f884e6e` and with this change. The ERRORs relate to `OBL-015`. This cycle introduces none of them and, being out of scope, regenerates nothing.
- **AS132-F003** (Protocol V2 checker gap) remains open. This publication was inspected manually, as the Result section records.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged. This cycle closes none.

## Evidence locations

- `docs/product/evidence/rfc022-tier1/`: `README.md`, `report.json`, `admin-ui-report.json`, `artifact-*`, `bridged-*`, `admin-ui-*`, `admin-ui-nextjs-*` screenshots.
- Tests: `tests/rfc022-bridge.test.mjs`, `tests/worker-rfc022-content.test.mjs`, `tests/homepage-artifact.test.mjs`.

## Governing references

- **T0:** Protocol V2; D-106; `ML-DEVOS-RFC-022`; `ML-DEVOS-AS-132`.
- **T1:** D-105; `ML-DEVOS-AS-131`; `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md`; `coordination/OPERATIVE_OBLIGATIONS.md`.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-TIER1-IMPL-0001.md`.

## Next action

The Architect independently reviews this return under the next unused immutable Sync ID after `ML-DEVOS-AS-132`. Nothing here authorizes CB-R, remote D1/R2, Access wiring, production content, deployment or a `main` merge.
