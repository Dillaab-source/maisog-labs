# Risk Register

Seeded from `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §14. Traceability: `Risk → Control → Test → Evidence → Status`.

Status values used here: `NOT STARTED` (no control/mitigation work has begun — typically because the risk's subject system doesn't exist yet), `NOT YET APPLICABLE` (the risk cannot materialize yet because its preconditions don't exist, e.g. no admin surface to bypass), `OPEN` (the risk's subject system exists and the risk is not yet mitigated/verified), `MITIGATED` (a control exists and is evidenced), `VERIFIED` (independently reproduced/inspected evidence supports the mitigation).

A future risk being `NOT YET APPLICABLE` is never recorded as resolved or mitigated — it becomes `OPEN` the moment the relevant feature (e.g. admin) is designed, and must be tracked from there.

| ID | Risk | Control | Test | Evidence | Status |
|---|---|---|---|---|---|
| RISK-WEB-001 | Production outage after deployment | Not designed | None | None | `NOT STARTED` |
| RISK-WEB-002 | Admin authorization bypass | Not designed (no admin exists) | None | None | `NOT YET APPLICABLE` |
| RISK-WEB-003 | Content/data loss | Git history is the only current rollback mechanism (`docs/CHANGE_LEDGER.md` records prior rollback SHAs) | None automated | `docs/CHANGE_LEDGER.md` | `OPEN` — a real, already-applicable risk today since content lives only in Git, with no automated backup/rollback tooling |
| RISK-WEB-004 | Secret exposure | No secrets exist in source; `.gitignore` excludes env/log files; no `process.env` usage found | Manual grep, this cycle: `grep -rn "process.env"` across `app/ components/ data/ lib/ tests/` → no matches; `find . -iname ".env*"` → none found | This handoff's evidence log | `MITIGATED` for the current (no-secrets) surface; will need re-evaluation the moment server-side config/secrets are introduced |
| RISK-WEB-005 | Mobile UI regression | `docs/CHANGE_LEDGER.md` records manual desktop/mobile QA as part of past releases | No automated mobile/visual test exists | `docs/CHANGE_LEDGER.md` (manual QA notes only) | `OPEN` — no automated coverage |
| RISK-WEB-006 | Broken production routing | Single static route (`/`) plus Next's generated `/_not-found`; `wrangler.jsonc` sets `not_found_handling: "404-page"` | `npm run build` succeeds and emits `out/404.html`, `out/index.html` | This cycle's `npm run build` re-run (see `TEST_LEDGER.md`) | `IMPLEMENTED`, not independently (Architect) verified yet |
| RISK-WEB-007 | Admin changes fail to persist | Not designed (no admin exists) | None | None | `NOT YET APPLICABLE` |
| RISK-WEB-008 | Invalid content breaks rendering | `lib/content/schema.mjs` rejects invalid/unknown content at build time; `projectPublishedContent` throws before render | `tests/content.test.mjs` — 22 "rejects ..." cases plus the unpublished-root test | Implementer-reported: 27/27 passing (Phase 0 + Phase 1 re-run) | `IMPLEMENTED`, implementer-reported evidence only |
| RISK-WEB-009 | Development/production behavior diverges | Static export means dev (`next dev`) and prod (`next build` + Worker) share the same content pipeline, but dev is not statically exported | No automated parity test | None beyond code inspection | `OPEN` |
| RISK-WEB-010 | Deployment succeeds but UI is materially broken | No automated post-deploy check exists | None | `docs/CHANGE_LEDGER.md` notes past manual verification only | `OPEN` |
| RISK-WEB-011 | Unsafe design input introduces XSS/code execution | `lib/content/schema.mjs`'s `text()` validator rejects control characters and angle brackets; `href()` allowlists in-page anchors and validated `mailto:` only | `tests/content.test.mjs`: "rejects HTML", "rejects javascript link", "rejects protocol-relative link", "rejects email header injection" | Implementer-reported test pass | `IMPLEMENTED` for the current content-editing surface (no admin exists yet to introduce a new injection surface) |
| RISK-WEB-012 | Media upload abuse | Not designed (no upload path exists) | None | None | `NOT YET APPLICABLE` |
| RISK-WEB-013 | Draft/private content becomes public | Draft/archived records are filtered from the build-time public projection (`lib/content/public.mjs`) | `tests/content.test.mjs`: "all record collections filter drafts and archives before serialization" | Implementer-reported test pass. **Important caveat, carried from `docs/CONTENT.md`:** this filtering is not confidentiality — the Git source itself, including drafts, remains public in this public repository. | `OPEN` despite the passing test — the residual risk (public Git source) is architectural, not something the current test can close |
| RISK-WEB-014 | Admin actions are not auditable | Not designed (no admin/mutation surface exists) | None | None | `NOT YET APPLICABLE` |
| RISK-WEB-015 | Static-to-database migration loses existing content | No migration has been designed or performed | None | Current content boundary recorded in `PROJECT_GOVERNANCE.md` as the pre-migration baseline | `NOT STARTED` |

## Register maintenance rule

Do not close or mark `MITIGATED`/`VERIFIED` any risk whose control has not been evidenced in this table or a linked test. When a future phase introduces the admin/auth/storage surface these `NOT YET APPLICABLE` risks anticipate, flip them to `OPEN` in the same commit that introduces the surface, not after.
