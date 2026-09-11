# Maisog Labs Master Plan V1 — Implementation Tracker

Purpose: turn the Master Plan into ordered, auditable work without performing live infrastructure changes prematurely.

Status legend:
- `[x]` completed on non-production branch
- `[ ]` pending
- `BLOCKED-HOME` requires controlled PC/Cloudflare access
- `STOP-GATE` later work must not proceed until the gate passes

## A. Safe work that can be done now

These changes do not alter production runtime or Cloudflare infrastructure.

- [x] Create isolated branch `master-plan-v1` from `main`.
- [x] Add `docs/MAISOG_LABS_MASTER_PLAN_V1.md`.
- [x] Add `docs/MASTER_PLAN_CHANGELOG.md`.
- [x] Confirm canonical admin identity in the plan: `paulo@maisoglabs.com`.
- [x] Add `.dev.vars` / `.dev.vars.*` to Git ignore rules.
- [x] Update AI-agent repository guidance so future changes must follow the Master Plan and change log.
- [x] Add this implementation tracker.
- [x] Review current repository files for architecture drift and record findings only in `docs/ARCHITECTURE_AUDIT_V1.md`; no production behavior modified.
- [x] Prepare the dependency/build verification checklist in `docs/HOME_SESSION_CHECKLIST_V1.md`; no package versions changed yet.
- [x] Prepare the Cloudflare verification checklist in `docs/HOME_SESSION_CHECKLIST_V1.md`.

### Current safe-stop boundary

**SAFE-NOW PREPARATION COMPLETE. STOP HERE UNTIL CONTROLLED PC/CLOUDFLARE ACCESS IS AVAILABLE.**

Do NOT yet:
- create production write APIs
- add real Cloudflare secrets to the repository
- add D1/R2 production bindings
- run production D1 migrations
- enable CMS publishing
- expose MCP
- merge this branch to `main`
- upgrade dependencies without the local build/test environment

## B. Home session — Phase 1: verify identity/security boundary

Status: `BLOCKED-HOME`

1. Connect/inspect Cloudflare from the controlled PC.
2. Verify the Access application protecting `/admin*` and future `/api/admin/*`.
3. Verify the allow identity is exactly `paulo@maisoglabs.com`.
4. Verify or enable MFA requirement before production mutations.
5. Record Access issuer/team-domain and application audience values needed for token validation.
6. Confirm no unintended bypass/allow policies exist.
7. Implement only `GET /api/admin/me` on the working branch.
8. Validate JWT signature, issuer, audience, expiry, and exact email authorization.
9. Test: no token, invalid token, expired token, wrong audience, forged email/header, unauthorized identity.

`STOP-GATE 1`: No D1 write endpoint until all Phase 1 tests pass.

## C. Phase 2: dependency and build baseline

Status: `BLOCKED-HOME`

1. Check current supported/patched Next.js, React, React DOM, and Wrangler releases against official advisories/docs at implementation time.
2. Upgrade on a non-production branch only.
3. Generate/commit `package-lock.json`.
4. Use `npm ci` for reproducible validation.
5. Run clean build and local smoke tests.
6. Re-check static-export compatibility.
7. Record exact versions and validation outcome in the change log.

`STOP-GATE 2`: No backend production deployment on an unreviewed dependency baseline.

## D. Phase 3: staging data foundation

Status: PENDING AFTER GATES 1–2

1. Verify/create staging D1 database based on `maisog-cms` naming convention.
2. Add staging `DB` binding.
3. Implement migrations for:
   - `site_content`
   - `projects`
   - `media`
   - `admin_events`
4. Use prepared/bound SQL for variable values.
5. Test migrations on staging.
6. Test D1 recovery/rollback procedure.

`STOP-GATE 3`: No production D1 migration until staging passes.

## E. Phase 4: protected application/service API

Status: PENDING

1. Implement centralized authorization service/middleware.
2. Add structured request validation.
3. Add request/body size limits.
4. Add strict CORS policy.
5. Add same-origin/CSRF defenses for browser mutation requests.
6. Add security headers and `no-store` where sensitive.
7. Add audit-event helper.
8. Add draft-only site/project endpoints.
9. Test SQL injection, XSS, authorization bypass, cross-origin mutation, malformed input, and rate-limit behavior.

`STOP-GATE 4`: No production mutation endpoint until adversarial API tests pass.

## F. Phase 5: staging media foundation

Status: PENDING

1. Verify/create staging R2 bucket based on `maisog-media` naming convention.
2. Add staging `MEDIA` binding.
3. Keep bucket private.
4. Implement validated image upload.
5. Accept only explicitly approved formats.
6. Reject SVG in V1 unless a sanitizer is separately reviewed.
7. Validate size, signature/decodability where feasible, and safe generated keys.
8. Implement cleanup/reconciliation for R2-success/D1-failure cases.
9. Test unsupported file, oversized file, MIME mismatch, malformed image, and orphan cleanup.

`STOP-GATE 5`: No public media publishing until upload-abuse tests pass.

## G. Phase 6: Admin CMS integration

Status: PENDING

1. Connect Admin V1 UI to protected APIs.
2. Preserve draft vs published state.
3. Keep publish disabled while integration is being tested.
4. Test desktop/mobile admin behavior.
5. Verify public routes cannot read drafts.

## H. Phase 7: human-controlled publish

Status: PENDING

1. Implement explicit publish action.
2. Use D1 transactional operations for D1 publish state.
3. Publish only references media already present/approved in R2.
4. Record publish audit event.
5. Test partial failures and rollback/recovery.

`STOP-GATE 6`: Production CMS writes only after end-to-end security and recovery testing passes.

## I. Phase 8: MCP read-only

Status: FUTURE

1. Add OAuth-authenticated remote MCP endpoint using the current supported Cloudflare/MCP approach at implementation time.
2. Reuse the same authorization/service layer.
3. Start read-only.
4. Test token validation, scope enforcement, prompt injection resilience, and tool misuse.

## J. Phase 9: MCP draft-write

Status: FUTURE

1. Add narrowly scoped draft creation/editing.
2. Add approved media upload if security tests justify it.
3. Keep autonomous publishing disabled.
4. Keep infrastructure/auth administration outside MCP.

## Panel checkpoint template

Every phase review should record:

- Systems architecture: PASS / HOLD
- Security: PASS / HOLD
- Data integrity/recovery: PASS / HOLD
- Compatibility/build: PASS / HOLD
- UX/operations: PASS / HOLD
- Rollback path verified: YES / NO
- Owner approval required: YES / NO
- Final phase decision: PROCEED / HOLD

A single `HOLD` on a security-critical item blocks progression.