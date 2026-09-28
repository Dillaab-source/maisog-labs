# Current Handoff — AS-133 Remediation Cycle 1 (D-107)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-TIER1-REM1-0001
cycle_id: MAISOGLABS_WEB_RFC022_TIER1_IMPL
input_base_commit: a70efb321a26b4810f262f0b1214ca62ea27d0f5
review_target_commit: a70efb321a26b4810f262f0b1214ca62ea27d0f5
applicable_review_id: ML-DEVOS-AS-133
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result here is `ACTOR_REPORTED` and local. Nothing here is preview, remote or production evidence.

## Objective

Execute `DIR-WEB-RFC022-TIER1-REM1-0001` (D-107) and remediate AS133-F001:
- the AS132-F002 exact D-105 five-project/order check becomes a CB-R release-readiness check only;
- public `/` renders any valid published RFC-022 project group of 1..5.

## Result

AS133-F001 is remediated in this return commit (its diff against `a70efb3`, the AS-133/D-107 publication). This is remediation cycle 1 of 2. `public/index.html` SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`, unchanged.

No new table, migration, migration field, runtime activation flag, API route or architecture change.

## Change

- **`worker/bridge/payload.mjs`:**
  - `buildBridgePayload` no longer takes `applyActivationGate`. A valid 1..5 group is always used; an invalid group is still dropped as a whole.
  - The `INITIAL_ACTIVATION_GATE` constant is removed.
  - `passesInitialActivationGate` is replaced by `initialReleaseReadiness(projects)`. It returns true only for a valid group that is exactly the D-105 five in order (ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat).
  - `INITIAL_ACTIVATION_PROJECT_NAMES` is kept. The helper is not used by the public bridge.
- **`worker/public/home.mjs`:** the public `/` call no longer applies the five-name gate (one line).
- **`worker/admin/content.mjs`:**
  - the preview call drops the removed parameter;
  - in the `homepage` status object of the existing `GET /admin/api/content` response, `activationGate {enabled, requiredNames, passes}` becomes `releaseReadiness {check: "AS132-F002", requiredNames, ready}`;
  - `live.projects` now reports runtime bridge validity only.
- **`app/admin/ContentClient.js`:** the status line now reads "First production release readiness … Status: ready / not yet. This is a release check only; it does not change what the homepage shows now." "Live on the homepage now" stays separate.
- **`docs/ARCHITECTURE.md`, evidence `README.md`:** wording aligned with AS133-F001.
- **`scripts/rfc022-admin-ui-evidence.mjs`:** the mock status uses the new shape; the check is renamed `releaseReadinessShown` and also asserts the "does not change what the homepage shows now" wording.

## Tests and evidence

### AS-133 regression evidence

| Item | Test | Result |
|---|---|---|
| 1. The exact five pass initial release readiness | `rfc022-bridge` "AS133-F001 item 1"; `worker-rfc022-content` "item 4" (`releaseReadiness.ready === true` with the five published, on Miniflare D1) | pass |
| 2. A wrong or incomplete set fails | `rfc022-bridge` "AS133-F001 item 2": reordered, first four only, one wrong name, an invalid member (3 flow stages), six projects, empty, `null` | pass |
| 3. A valid 1..5 group renders through public `/` | `rfc022-bridge` "item 3": n = 1..5 with non-D-105 names. `worker-rfc022-content` "item 3": publishes five non-D-105 projects one by one; after each, `/` carries exactly those k projects with a span-only body, `live.projects` is true and readiness is false. The existing "publishing the initial five" test now asserts that `/` shows 1..4 of the D-105 set before the fifth. | pass |
| 4. Unpublishing one of five active projects leaves four visible | `worker-rfc022-content` "item 4": the five are published and readiness is true. Eternal Eggs is then removed through the governed `POST /admin/api/projects/v10-2/unpublish` with expected pointers. `/` is then not the artifact, the body is span-only, and the island holds the other four in order. `live.projects` stays true; readiness is false and gates nothing. | pass |
| 5. Existing tests still pass | artifact fallback (tests 2, 3), draft isolation (test 6), max-five (test 8), AS132-F001 headers, D-093 artifact tests | pass |

**Negative control:** with the old runtime gate temporarily restored in `worker/public/home.mjs` only (not committed), three tests fail: items 3 and 4, and the updated initial-five test. With the fix, all pass.

### Checks

| Check | Result |
|---|---|
| `check-context-bootstrap.mjs --commit a70efb3… --session-protocol 2` | `ok: true` |
| `npm test` (full) | 938 tests; 938 pass, 0 fail, 0 skipped. D1 suites on real local Miniflare. (The previous 934, minus 1 replaced gate test, plus 3 unit and 2 D1 tests.) |
| `npm run build` | exit 0 |
| `node scripts/rfc022-browser-evidence.mjs` | exit 0; 4/4 runs non-blank with 0 errors |
| `node scripts/rfc022-admin-ui-evidence.mjs` | exit 0; 10/10 checks, 0 errors, on both the component (React 18.3.1) and the built `out/admin.html` (Next 16.3.5, bundled React 19) |
| `git diff --check` | clean |
| Scope audit (AS132-F003 manual inspection) | changed files are only those listed above plus regenerated evidence screenshots/reports and the coordination files. No `public/`, migration, schema or route change. |

## Changed files

- **Product and tests:**
  - `worker/bridge/payload.mjs`, `worker/public/home.mjs`, `worker/admin/content.mjs`, `app/admin/ContentClient.js`;
  - `tests/rfc022-bridge.test.mjs`, `tests/worker-rfc022-content.test.mjs`.
- **Docs and evidence:**
  - `docs/ARCHITECTURE.md`;
  - `docs/product/evidence/rfc022-tier1/` (README, `report.json`, `admin-ui-report.json`, regenerated screenshots);
  - `scripts/rfc022-admin-ui-evidence.mjs`.
- **Coordination:**
  - `coordination/STATE.md`, this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-TIER1-REM1-0001.{md,provenance.json}` and the index row.
  - `coordination/OPERATIVE_OBLIGATIONS.md` is unchanged.

## Unresolved findings and limitations

- **What now carries the AS132-F002 guarantee.** "Until the initial activation condition passes, public `/` must retain the artifact's project data" is no longer enforced at runtime (AS133-F001; D-107 forbids a runtime flag). It now depends on CB-R running `initialReleaseReadiness` (or the admin `releaseReadiness.ready` status) against production D1 before the first release. If any valid homepage group were published in production before that check, `/` would show it. CB-R must therefore include this check; the Architect should confirm this is the intended reading.
- **Status field change.** The `homepage.activationGate` status object in the existing `GET /admin/api/content` response is renamed to `releaseReadiness`. This is an admin status change allowed by AS-133, not a new route. The admin UI is the only consumer.
- **Unchanged from `H-WEB-RFC022-TIER1-IMPL-0001`:**
  - RFC-022 §7 test 11 (Workers CPU/latency) is still a CB-R item;
  - the admin UI evidence uses a recording mock API;
  - the traceability validator's 3 pre-existing ERRORs and DRIFT are still present;
  - AS132-F003 is still open.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- `docs/product/evidence/rfc022-tier1/`: `README.md`, `report.json`, `admin-ui-report.json`, screenshots.
- Tests: `tests/rfc022-bridge.test.mjs`, `tests/worker-rfc022-content.test.mjs`.

## Governing references

- **T0:** Protocol V2; D-107; `ML-DEVOS-AS-133`.
- **T1:** D-106; D-105; `ML-DEVOS-RFC-022`; `ML-DEVOS-AS-132`; the archived `H-WEB-RFC022-TIER1-IMPL-0001`.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-TIER1-REM1-0001.md`.

## Next action

The Architect independently re-reviews this remediation under the next unused immutable Sync ID after `ML-DEVOS-AS-133`. Nothing here authorizes CB-R, remote D1/R2, Access wiring, production content, deployment or a `main` merge.
