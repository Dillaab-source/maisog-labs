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

The full requirement catalog (`WEB-REQ-*`, `ADM-REQ-*`, `DESIGN-*`, `WEB-SEC-*`) is defined in `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §§9–11, 13. `WEB-REQ-001`…`008` are broken out individually below because they do not all share the same status or evidence (Architect finding F1-003: an earlier draft of this table aggregated them under a single `IMPLEMENTED` label, which incorrectly implied `WEB-REQ-004` — admin-managed editing without source-code changes — was implemented when no Admin surface exists). The remaining groups (`ADM-REQ-*`, `DESIGN-*`, `WEB-SEC-*`) are still recorded as a single group each because every requirement in each of those groups genuinely shares the same status and evidence today: nothing in any of them is designed or implemented yet. They will be broken out individually as each is designed/implemented in a later phase — fabricating per-requirement `VERIFIED` status ahead of that work would misrepresent the record.

| Requirement | Design | Implementation | Test | Evidence | Status |
|---|---|---|---|---|---|
| `WEB-REQ-001` Public website remains available and usable | Existing (`app/page.js` renders `getPublicContent()` output) | Implemented for the current homepage-only scope | `tests/content.test.mjs` (content-boundary only) | Implementer-reported: `npm run build` success | `IMPLEMENTED` — not `VERIFIED` (no independently reproduced production/runtime availability check) |
| `WEB-REQ-002` Existing content must not disappear during unrelated changes | No automated safeguard designed | Upheld only by manual Git-diff review during each cycle (this cycle's own validation step) | None | This cycle's `git diff`/`git status` review before commit | `NOT STARTED` as an enforced technical control — currently a process practice, not a tested guarantee |
| `WEB-REQ-003` Mobile experience remains usable | Existing responsive CSS (`app/globals.css`) | Implemented, unverified | No automated mobile/visual test exists; `docs/CHANGE_LEDGER.md` records only past manual QA | Implementer-reported code inspection only | `IMPLEMENTED` (code exists) — not `VERIFIED`; matches `TEST-WEB-003: NOT IMPLEMENTED` in `TEST_LEDGER.md` |
| `WEB-REQ-004` Admin-managed public content must not require source-code edits | Not designed | **Not implemented.** Content edits currently require a direct edit to `data/site.js` and a rebuild/redeploy — the opposite of this requirement | None | Confirmed: `ADMIN STATUS: NOT IMPLEMENTED` (no `/admin` route in `app/`) | `NOT STARTED` |
| `WEB-REQ-005` Website renders content from a structured content layer | Existing, documented in `PROJECT_GOVERNANCE.md` | Implemented (`data/site.js → schema.mjs → public.mjs → local.mjs → app/page.js`) | `tests/content.test.mjs` | Implementer-reported: 27/27 passing | `IMPLEMENTED` |
| `WEB-REQ-006` Site remains visually consistent with MaisogLabs branding | Existing (`app/globals.css`, `components/Logo.js`) | Implemented | No automated design-consistency test | Implementer-reported code inspection only | `IMPLEMENTED` — not `VERIFIED` (no independent design review) |
| `WEB-REQ-007` Site remains lightweight/performance-conscious | Existing (static export, optimized WebP asset per `docs/CHANGE_LEDGER.md`) | Implemented | No automated performance/Lighthouse test exists | Implementer-reported: static build succeeds; no perf budget test | `IMPLEMENTED` — not `VERIFIED` |
| `WEB-REQ-008` Public site never exposes admin-only controls/data | `lib/content/schema.mjs` rejects unknown fields (e.g. an `adminEmail`-style field) | Implemented | `tests/content.test.mjs` — "rejects unknown admin field" | Implementer-reported PASS | `IMPLEMENTED` |
| `ADM-REQ-001`…`016` (admin portal) | Not designed | Not implemented — confirmed `ADMIN STATUS: NOT IMPLEMENTED` (no `/admin` route in `app/`) | None exist | None | `NOT STARTED` |
| `DESIGN-001`…`014` (admin design controls) | Not designed | Not implemented (no admin surface to host them) | None | None | `NOT STARTED` |
| `WEB-SEC-001`…`012` (auth/security boundary) | Not designed | Not implemented — no auth code, no `process.env` usage, no `.env` files in source (confirmed by direct search in Phase 0) | None | None | `NOT STARTED` — explicitly **not** "not applicable"; these remain real, open requirements once an admin/auth surface is built |
| Content contract (`data/site.js` → `schema.mjs` → `public.mjs` → `local.mjs`) | Existing, documented in `docs/CONTENT.md` and `PROJECT_GOVERNANCE.md` | Implemented | `tests/content.test.mjs` (27 tests: filtering, ordering, schema rejection, unsafe-link/HTML rejection, unpublished-root rejection) | Implementer-reported pass; not yet Architect-reproduced | `IMPLEMENTED` |
| Journal | Not designed | Not implemented — no `journal` field in `lib/content/schema.mjs`, no journal route/component | None | None | `NOT STARTED` |

## Requirement ID reservation

This bootstrap does not invent new requirement IDs. Future phases that design and implement specific `ADM-REQ-*`/`DESIGN-*`/`WEB-SEC-*` items should add rows here (or a per-domain sub-table) at the point of design, not before, and must cite the implementing file(s) and the test(s) that exercise them.
