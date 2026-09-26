# Current Handoff — WEB-REL-002 Gate D: Promotion Succeeded, Runtime Verification Failed

```yaml
schema_version: 1
handoff_id: H-WEB-REL-002-GATE-D-0001
cycle_id: MAISOGLABS_WEB_REL_002_GATE_D
input_base_commit: 06a9ac674d462c6ad51d771d12a3b49da3ec3cae
review_target_commit: 06a9ac674d462c6ad51d771d12a3b49da3ec3cae
applicable_review_id: ML-DEVOS-AS-115
```

This handoff is evidence, not authority. Routing and capability flags live only in `coordination/STATE.md`. Every external result is `ACTOR_REPORTED` from authenticated Cloudflare API reads or read-only public runtime checks.

## Objective

Return the bounded WEB-REL-002 Gate D execution under `D-086` and `DIR-WEB-REL-002-GATE-D-0001`.

The exact production promotion succeeded, but required runtime verification found a material production defect. The Builder stopped without rollback, hotfix, code change or resource mutation and returns the incident to the Architect.

## Changed files

The Gate D directive issue commit `06a9ac674d462c6ad51d771d12a3b49da3ec3cae` changed only:

- `brain/DECISION_LOG.md`;
- `coordination/CURRENT_DIRECTIVE.md`;
- `coordination/STATE.md`.

This return commit changes only:

- `coordination/CURRENT_HANDOFF.md`;
- `coordination/STATE.md`;
- `coordination/archive/directives/DIR-WEB-REL-002-GATE-D-0001.md`;
- `coordination/archive/directives/DIR-WEB-REL-002-GATE-D-0001.provenance.json`;
- `coordination/archive/directives/README.md`.

The outgoing directive is archived byte-for-byte. `CURRENT_DIRECTIVE` is deselected, `DEPLOY_AUTHORIZED` is reset to NO, and every other action flag remains NO.

## Tests and evidence

### Pre-promotion identity and baseline

Protocol V2 passed at:

- issue parent `edd4bce5fa9fa07b28237b893c078ebbd234ba2b`;
- published Gate D directive tip `06a9ac674d462c6ad51d771d12a3b49da3ec3cae`.

Release identity was freshly verified:

| Item | Exact evidence |
|---|---|
| Main release | `aebc881e8890c00090d714602591138a045bd3b0` |
| Successful main build | `19ecd52a-b178-47dd-8d23-64b5590a61ef` |
| Target Worker Version | `a667fc09-12d1-4fde-a75d-5d660729baa3`, version 730 |
| Target provenance | alias `main`, `version_upload`, created `2026-09-26T02:16:32.836963Z` |
| Newer main release | none; later observed versions 731 and 732 were governance-branch uploads |

Immediately before promotion at `2026-09-26T03:44:36.494Z`:

| Item | Value |
|---|---|
| Active deployment | `e51d40d4-a063-47c5-a46f-70beeee4c03e` |
| Previous active Version | `a28ee2e9-a9a0-4528-b89f-07e0c827be2b` |
| Traffic | 100% |
| Target active | no |
| Refreshed `origin/main` | `aebc881e8890c00090d714602591138a045bd3b0` |

### Production promotion result

One normal Cloudflare deployment API request was made without `force` and with exactly one allocation: target `a667fc09-12d1-4fde-a75d-5d660729baa3` at 100%.

| Item | Exact evidence |
|---|---|
| Request time | `2026-09-26T03:44:48.079Z` |
| API result | success, HTTP 200 |
| New deployment ID | `ba9a3ee0-81a6-43a2-81f9-3467ec876d79` |
| Deployment created | `2026-09-26T03:44:49.060208Z` |
| Immediate verification | `2026-09-26T03:44:49.456Z` |
| Active Version | `a667fc09-12d1-4fde-a75d-5d660729baa3` |
| Traffic | 100% |

A final read at `2026-09-26T03:50:17.577Z` again found the same deployment, target Version and 100% traffic.

### Runtime verification

Read-only production checks ran against `https://maisoglabs.com` using installed Microsoft Edge in headless mode and direct GET probes. No form, admin, design or content mutation was attempted.

| Surface | Result |
|---|---|
| Entry | PASS — HTTP 200, rendered spatial Entry |
| Systems | PASS — navigation click opened `#systems` and focused its heading |
| Projects | PASS — direct `#projects` rendered project content |
| Research | **FAIL** — shell renders, but reports "The journal could not be loaded right now" |
| Contact | PASS — direct `#contact` rendered contact surface and `mailto:hello@maisoglabs.com` |
| Journal | **FAIL** — HTTP shell 200, but reports "The journal could not be loaded right now" |
| 404 | PASS — unknown route returned HTTP 404 with noindex page |
| Admin fail-closed | PASS — `/admin` and `/admin/api/dashboard` returned 302 to Cloudflare Access login; no bypass attempted |
| Design API baseline | **MATERIAL FAIL** — `GET /api/design` returned HTTP 500, Cloudflare Worker Error 1101 / owner action required |
| Journal API | **MATERIAL FAIL** — `GET /api/journal` returned HTTP 500, Cloudflare Worker Error 1101 / owner action required |

Navigation/history/layout checks:

- route links for Systems, Projects, Research and Contact were present;
- direct hashes `#projects`, `#research` and `#contact` opened their expected surfaces;
- Back changed `#projects` to `#systems` and Forward restored `#projects`;
- desktop viewport 1440×1000 and mobile viewport 390×844 reported no horizontal overflow;
- no broken images, browser runtime exceptions or network transport failures were observed;
- `/s5` and `/s6` both returned 404, with no unintended public S5/S6 surface;
- the only repeated application failures were the design and Journal API HTTP 500 responses;
- a favicon request also returned 404, recorded as a non-material cosmetic observation.

The Research implementation did attempt its real public Journal path; the production Journal API failed, so real data could not load.

### Resource-boundary confirmation

No unrelated Cloudflare/resource mutation occurred:

- no rebuild or version upload;
- no rollback or alternate-version promotion;
- no D1, R2, Access, DNS/domain, route, secret or environment-variable mutation;
- no production-data write;
- no admin publishing or design mutation;
- no repository product/runtime change and no main alteration;
- no media generation, addition, substitution, upload or integration.

## Unresolved findings and limitations

This Gate D runtime verification is **FAILED / MATERIAL PRODUCTION DEFECT**.

Production currently serves `a667fc09-12d1-4fde-a75d-5d660729baa3` at 100%. No rollback is authorized or performed.

Exact public failures:

- `GET https://maisoglabs.com/api/design` → HTTP 500, Cloudflare Error 1101;
- `GET https://maisoglabs.com/api/journal` → HTTP 500, Cloudflare Error 1101;
- Research and Journal therefore expose their designed failure messages instead of live public data.

Because the material stop condition fired, no further diagnostic mutation, code investigation, hotfix, repair or rollback was attempted. Root cause is not established by this handoff.

The accepted MEDIA_GAP remains deferred and was not involved in these failures. `plate-hero-v4.png`, `logo-mark.mp4` and the logo-mark poster/fallback were not created or changed.

S6 remains parked at `ML-DEVOS-AS-103`. O1/O2 remain open. D-068 remains suspended. PR #7 and PR #10 were untouched. All rows in `coordination/OPERATIVE_OBLIGATIONS.md` carry forward unchanged.

## Governing references

- Owner authority: `D-086`.
- Executed directive: `DIR-WEB-REL-002-GATE-D-0001`.
- Controlling review: `ML-DEVOS-AS-115`.
- Release merge: `aebc881e8890c00090d714602591138a045bd3b0`.
- Protocol: `ML-DEVOS-RFC-020` and `brain/protocols/CONTEXT_BOOTSTRAP.md`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- Cloudflare deployment `ba9a3ee0-81a6-43a2-81f9-3467ec876d79`.
- Worker Version `a667fc09-12d1-4fde-a75d-5d660729baa3`.
- Public runtime endpoints on `https://maisoglabs.com`.
- Archived `coordination/archive/directives/DIR-WEB-REL-002-GATE-D-0001.md` and provenance sidecar.

## Next action

The Architect independently reviews and classifies this Gate D production incident. Any rollback, old-version promotion, remediation, code change or renewed production action requires a separate Paulo decision. No Builder action begins automatically.
