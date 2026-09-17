# Governance Map

## Traceability model

```
Requirement → Design → Implementation → Test → Evidence → Status
```

Example (from the governance plan, §15):

```
ADM-REQ-004
  → Projects CMS design
  → /admin/projects + API + persistent storage
  → TEST-ADM-004
  → test/database evidence
  → VERIFIED
```

Code existence alone is never `VERIFIED`. A record only reaches `VERIFIED` when independently reproduced or inspected evidence (see the evidence-class rule in `PROJECT_GOVERNANCE.md` and `TEST_LEDGER.md`) supports it — implementer-reported evidence alone caps a record at `IMPLEMENTED`.

## Status vocabulary

`NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`

## Current requirement status

The full requirement catalog (`WEB-REQ-*`, `ADM-REQ-*`, `DESIGN-*`, `WEB-SEC-*`) is defined in `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §§9–11, 13. This table records only the current, evidence-based status of each *group* as of the Phase 1 baseline. Individual requirement rows will be broken out as each is designed/implemented in a later phase — fabricating per-requirement `VERIFIED` status ahead of that work would misrepresent the record.

| Requirement group | Design | Implementation | Test | Evidence | Status |
|---|---|---|---|---|---|
| `WEB-REQ-001`…`008` (public website) | Existing (`app/page.js` renders `getPublicContent()` output) | Implemented for the current homepage-only scope | `tests/content.test.mjs` (content-boundary only, not rendering/perf/mobile) | Implementer-reported: `npm test` 27/27, `npm run build` success (Phase 0 handoff) | `IMPLEMENTED` — not `VERIFIED` (Architect has not independently reproduced build/test output; see `TEST_LEDGER.md`) |
| `ADM-REQ-001`…`016` (admin portal) | Not designed | Not implemented — confirmed `ADMIN STATUS: NOT IMPLEMENTED` (no `/admin` route in `app/`) | None exist | None | `NOT STARTED` |
| `DESIGN-001`…`014` (admin design controls) | Not designed | Not implemented (no admin surface to host them) | None | None | `NOT STARTED` |
| `WEB-SEC-001`…`012` (auth/security boundary) | Not designed | Not implemented — no auth code, no `process.env` usage, no `.env` files in source (confirmed by direct search in Phase 0) | None | None | `NOT STARTED` — explicitly **not** "not applicable"; these remain real, open requirements once an admin/auth surface is built |
| Content contract (`data/site.js` → `schema.mjs` → `public.mjs` → `local.mjs`) | Existing, documented in `docs/CONTENT.md` and `PROJECT_GOVERNANCE.md` | Implemented | `tests/content.test.mjs` (27 tests: filtering, ordering, schema rejection, unsafe-link/HTML rejection, unpublished-root rejection) | Implementer-reported pass; not yet Architect-reproduced | `IMPLEMENTED` |
| Journal | Not designed | Not implemented — no `journal` field in `lib/content/schema.mjs`, no journal route/component | None | None | `NOT STARTED` |

## Requirement ID reservation

This bootstrap does not invent new requirement IDs. Future phases that design and implement specific `ADM-REQ-*`/`DESIGN-*`/`WEB-SEC-*` items should add rows here (or a per-domain sub-table) at the point of design, not before, and must cite the implementing file(s) and the test(s) that exercise them.
