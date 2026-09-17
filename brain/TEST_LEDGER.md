# Test Ledger

Seeded from `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §18. Status values: `REQUIRED`, `NOT IMPLEMENTED`, `PASS`, `FAIL`, `BLOCKED`.

## Evidence-class rule

Every result below is labeled with exactly one evidence class. Never upgrade a class silently:

- **Implementer-reported** — Claude ran the command and reports the output. Not yet independently checked.
- **Architect-reproduced** — the Architect independently ran or inspected the same evidence.
- **Production/runtime evidence** — observed from the actual deployed system.

As of this Phase 1 cycle, no ledger entry has Architect-reproduced or production/runtime evidence; the Architect's Phase 0 review explicitly recorded the Phase 0 test/build claims as "implementer-reported... not independently reproduced" (`coordination/ARCHITECT_REVIEW.md`). This ledger preserves that distinction rather than upgrading it.

## Existing tests (already present in the repository)

| Test | Covers | Result | Evidence class |
|---|---|---|---|
| `tests/content.test.mjs` — "local source validates and adapter returns independent data" | `getPublicContent()` returns an independent copy | Implementer-reported PASS (part of 27/27) | Implementer-reported |
| `tests/content.test.mjs` — "all record collections filter drafts and archives before serialization" | Draft/archived filtering across all record collections | Implementer-reported PASS | Implementer-reported |
| `tests/content.test.mjs` — "stable ordering and empty collections" | Deterministic ordering; empty-collection handling | Implementer-reported PASS | Implementer-reported |
| `tests/content.test.mjs` — 22 × "rejects `<case>`" | Schema rejection of unknown fields, unsafe links/HTML, duplicate/reserved slugs, malformed email/date/URL, wrong types, etc. | Implementer-reported PASS (all 22) | Implementer-reported |
| `tests/content.test.mjs` — "unpublished root cannot produce a public build" | Root `meta.state` gating of the entire public build | Implementer-reported PASS | Implementer-reported |

Command: `npm test` (`node --test tests/*.test.mjs`). Result recorded in Phase 0 (`# pass 27, # fail 0`) and re-run for this Phase 1 cycle with the same result — see "Phase 1 command evidence" below.

## Plan-defined test IDs — current status

| ID | Description | Status | Notes |
|---|---|---|---|
| TEST-WEB-001 | Production homepage availability | `NOT IMPLEMENTED` | No automated check; no production access from this session |
| TEST-WEB-002 | Desktop rendering | `NOT IMPLEMENTED` | No automated visual test; `docs/CHANGE_LEDGER.md` records past manual QA only |
| TEST-WEB-003 | Mobile rendering | `NOT IMPLEMENTED` | Same as above |
| TEST-WEB-004 | Build succeeds | `PASS` | Implementer-reported: `npm run build` succeeded this cycle (Turbopack, static export to `out/`) |
| TEST-WEB-005 | Existing projects remain intact | `PASS` (indirect) | Implementer-reported: `data/site.js` unchanged this cycle; `tests/content.test.mjs` project-related assertions pass |
| TEST-ADM-001 | Unauthorized user cannot access admin | `NOT IMPLEMENTED` | No admin route exists to test |
| TEST-ADM-002 | Authorized admin can access admin | `NOT IMPLEMENTED` | No admin route exists |
| TEST-ADM-003 | Content write persists | `NOT IMPLEMENTED` | No write path exists |
| TEST-ADM-004 | Project CRUD/publish works | `NOT IMPLEMENTED` | No admin CRUD exists |
| TEST-ADM-005 | Journal CRUD/publish works | `NOT IMPLEMENTED` | No Journal feature exists at all |
| TEST-ADM-006 | Invalid content is rejected (at the Admin write boundary) | `NOT IMPLEMENTED` | No Admin surface or write API exists, so `TEST-ADM-006` itself cannot be exercised and must not be marked `PASS` under that ID (Architect finding F1-004). The existing build-time content-schema rejection (`lib/content/schema.mjs` + `tests/content.test.mjs`, 22 "rejects ..." cases, listed under "Existing tests" above) is real, passing, and separately evidenced — but it is content-layer/build-time validation, not the future Admin/write-API validation this test ID describes. `TEST-ADM-006` stays `NOT IMPLEMENTED` until that Admin/write boundary exists and is actually tested. |
| TEST-ADM-007 | Failed write does not report success | `NOT IMPLEMENTED` | No write path exists |
| TEST-ADM-008 | Media upload validation works | `NOT IMPLEMENTED` | No upload path exists |
| TEST-ADM-009 | Theme settings remain within allowed values | `NOT IMPLEMENTED` | No theme-settings feature exists |
| TEST-ADM-010 | Public users cannot perform admin mutations | `NOT IMPLEMENTED` | No mutation endpoint exists to attempt |
| TEST-DATA-001 | Existing static content migration preserves data | `NOT IMPLEMENTED` | No migration has occurred; nothing to test yet |
| TEST-DATA-002 | Draft content remains unpublished | `PASS` | Implementer-reported: covered by "all record collections filter drafts and archives before serialization" and "unpublished root cannot produce a public build" |
| TEST-DEP-001 | Deployment succeeds | `NOT IMPLEMENTED` | No deployment was performed or authorized this cycle |
| TEST-DEP-002 | Production verification succeeds after deployment | `NOT IMPLEMENTED` | Same reason |

## Phase 1 command evidence (implementer-reported)

| Command | Result |
|---|---|
| `npm test` | 27 passed, 0 failed (re-run this cycle; identical to Phase 0 result) |
| `npm run build` | Succeeded; static pages generated for `/` and `/_not-found`; `out/` populated |
| `npm audit` | 0 vulnerabilities |
| `git status --short` after the above | Only `package-lock.json` metadata churn from `npm install`, reverted with `git checkout -- package-lock.json` before committing, matching the Phase 0 handling |

Do not represent any `NOT IMPLEMENTED` row above as `PASS` in a future handoff without the actual feature and test existing first.
