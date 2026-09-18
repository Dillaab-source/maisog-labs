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

The full requirement catalog (`WEB-REQ-*`, `ADM-REQ-*`, `DESIGN-*`, `WEB-SEC-*`) is defined in `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §§9–11, 13. `WEB-REQ-001`…`008` are broken out individually below because they do not all share the same status or evidence (Architect finding F1-003: an earlier draft of this table aggregated them under a single `IMPLEMENTED` label, which incorrectly implied `WEB-REQ-004` — admin-managed editing without source-code changes — was implemented when no Admin surface exists). As of `WEB-INC-001` (`ML-DEVOS-RFC-002`/`ML-DEVOS-AS-011`/`D-023`), `ADM-REQ-001` and `WEB-SEC-001`/`002`/`011` are likewise broken out individually, for the same reason: they no longer share the same status as the rest of their groups. `ADM-REQ-002`…`016`, `DESIGN-001`…`014`, and `WEB-SEC-003`…`010`/`012` remain aggregated because every requirement in each of those groups genuinely still shares the same status and evidence today: nothing in any of them is designed or implemented yet. They will be broken out individually as each is designed/implemented in a later increment — fabricating per-requirement `VERIFIED` status ahead of that work would misrepresent the record.

| Requirement | Design | Implementation | Test | Evidence | Status |
|---|---|---|---|---|---|
| `WEB-REQ-001` Public website remains available and usable | Existing (`app/page.js` renders `getPublicContent()` output) | Implemented for the current homepage-only scope | `tests/content.test.mjs` (content-boundary only) | Implementer-reported: `npm run build` success | `IMPLEMENTED` — not `VERIFIED` (no independently reproduced production/runtime availability check) |
| `WEB-REQ-002` Existing content must not disappear during unrelated changes | No automated safeguard designed | Upheld only by manual Git-diff review during each cycle (this cycle's own validation step) | None | This cycle's `git diff`/`git status` review before commit | `NOT STARTED` as an enforced technical control — currently a process practice, not a tested guarantee |
| `WEB-REQ-003` Mobile experience remains usable | Existing responsive CSS (`app/globals.css`) | Implemented, unverified | No automated mobile/visual test exists; `docs/CHANGE_LEDGER.md` records only past manual QA | Implementer-reported code inspection only | `IMPLEMENTED` (code exists) — not `VERIFIED`; matches `TEST-WEB-003: NOT IMPLEMENTED` in `TEST_LEDGER.md` |
| `WEB-REQ-004` Admin-managed public content must not require source-code edits | Not designed | **Not implemented.** Content edits currently require a direct edit to `data/site.js` and a rebuild/redeploy — the opposite of this requirement | None | An auth-only `/admin` placeholder now exists under `WEB-INC-001` (`worker/index.mjs`, `worker/auth.mjs`, `app/admin/page.js`), but it has no content-editing, persistence, CRUD, or publish controls of any kind. Public content still requires a direct source edit and rebuild/redeploy, exactly as before this increment | `NOT STARTED` |
| `WEB-REQ-005` Website renders content from a structured content layer | Existing, documented in `PROJECT_GOVERNANCE.md` | Implemented (`data/site.js → schema.mjs → public.mjs → local.mjs → app/page.js`) | `tests/content.test.mjs` | Implementer-reported: 27/27 passing | `IMPLEMENTED` |
| `WEB-REQ-006` Site remains visually consistent with MaisogLabs branding | Existing (`app/globals.css`, `components/Logo.js`) | Implemented | No automated design-consistency test | Implementer-reported code inspection only | `IMPLEMENTED` — not `VERIFIED` (no independent design review) |
| `WEB-REQ-007` Site remains lightweight/performance-conscious | Existing (static export, optimized WebP asset per `docs/CHANGE_LEDGER.md`) | Implemented | No automated performance/Lighthouse test exists | Implementer-reported: static build succeeds; no perf budget test | `IMPLEMENTED` — not `VERIFIED` |
| `WEB-REQ-008` Public site never exposes admin-only controls/data | `lib/content/schema.mjs` rejects unknown fields (e.g. an `adminEmail`-style field) | Implemented | `tests/content.test.mjs` — "rejects unknown admin field" | Implementer-reported PASS | `IMPLEMENTED` |
| `ADM-REQ-001` `/admin` requires authentication | `ML-DEVOS-RFC-002` § "Add a minimal Worker authentication boundary" | Implemented (`worker/index.mjs`, `worker/auth.mjs`) — fail-closed Cloudflare Access JWT verification gates `/admin`, `/admin/*`; Remediation Cycle 1 (`ML-DEVOS-AS-012`) additionally makes the auth configuration itself fail closed and pins/proves alternate-URL canonicalization | `tests/worker-auth.test.mjs` (30 tests) | Implementer-reported: 57/57 passing (full suite); local `wrangler dev` smoke test confirms `GET /admin` → 401 without a token and `GET /admin.html` → redirect → 401, never direct admin content | `IMPLEMENTED` — not `VERIFIED` (no Architect-reproduced or production/runtime evidence yet; no production Cloudflare Access application exists) |
| `ADM-REQ-002`…`016` (admin portal, remaining) | Not designed | Not implemented — no session/editorial/mutation/media/theme/audit capability exists | None exist | None | `NOT STARTED` |
| `DESIGN-001`…`014` (admin design controls) | Not designed | Not implemented — no admin design-control/editing surface exists; `WEB-INC-001` provides authentication only (an auth-only admin surface existing is not the same as an admin design-control/editing capability existing) | None | None | `NOT STARTED` |
| `WEB-SEC-001` `/admin` requires authenticated access | `ML-DEVOS-RFC-002` §§1–2 | Implemented — Worker-first routing restricted to `/admin`/`/admin/*` only (`wrangler.jsonc` `assets.run_worker_first`); ordinary routes remain asset-first, confirmed unchanged; alternate URL forms (`/admin.html`, `/admin/index.html`) confirmed non-bypassing via pinned `html_handling` (`AS12-F003`) | `tests/worker-auth.test.mjs` ("serves ordinary public routes asset-first..."); local `wrangler dev`: `GET /` → 200, `GET /nope` → 404, `GET /admin.html` → 307 redirect (no content) → 401, unchanged/confirmed | Implementer-reported PASS; local dev smoke test | `IMPLEMENTED` — not `VERIFIED` |
| `WEB-SEC-002` Authorization checked server-side | `ML-DEVOS-RFC-002` § "Add a minimal Worker authentication boundary" | Implemented — JWT verified server-side in the Worker (`jose`), never trusting a client-supplied claim; Remediation Cycle 1 additionally validates the server-side auth configuration itself before any verification is attempted (`AS12-F001`) | `tests/worker-auth.test.mjs` | Implementer-reported PASS | `IMPLEMENTED` — not `VERIFIED` |
| `WEB-SEC-011` Authentication failure fails closed | `ML-DEVOS-AS-011` `AS11-F002`, critical invariant "NO VALID SERVER-VERIFIED ACCESS IDENTITY → NO ADMIN ASSET"; extended by `ML-DEVOS-AS-012` `AS12-F001` to cover configuration itself | Implemented — missing/malformed/expired/wrong-audience/wrong-issuer/untrusted-key assertions **and** missing/blank/placeholder/malformed team-domain/audience configuration all return `401` before any asset is served or any JWKS/network lookup is attempted | `tests/worker-auth.test.mjs` (7 token-level + 9 config-level negative-path cases) | Implementer-reported PASS; local `wrangler dev`: `GET /admin` with no token and with a garbage token both → 401 | `IMPLEMENTED` — not `VERIFIED` |
| `WEB-SEC-003`…`010`, `012` (remaining auth/security boundary) | Not designed | Not implemented — no session storage, no mutation endpoint, no media upload, no audit log exists yet | None | None | `NOT STARTED` — explicitly **not** "not applicable"; these remain real, open requirements once the corresponding surface is built |
| Content contract (`data/site.js` → `schema.mjs` → `public.mjs` → `local.mjs`) | Existing, documented in `docs/CONTENT.md` and `PROJECT_GOVERNANCE.md` | Implemented | `tests/content.test.mjs` (27 tests: filtering, ordering, schema rejection, unsafe-link/HTML rejection, unpublished-root rejection) | Implementer-reported pass; not yet Architect-reproduced | `IMPLEMENTED` |
| Journal | Not designed | Not implemented — no `journal` field in `lib/content/schema.mjs`, no journal route/component | None | None | `NOT STARTED` |

## Requirement ID reservation

This bootstrap does not invent new requirement IDs. Future phases that design and implement specific `ADM-REQ-*`/`DESIGN-*`/`WEB-SEC-*` items should add rows here (or a per-domain sub-table) at the point of design, not before, and must cite the implementing file(s) and the test(s) that exercise them.
