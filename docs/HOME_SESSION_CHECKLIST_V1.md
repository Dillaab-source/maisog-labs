# Maisog Labs — Home Session Checklist V1

Purpose: define the exact work to perform once a controlled PC and Cloudflare account access are available. This checklist prevents ad-hoc production changes.

## Pre-flight

- [ ] Pull/fetch the latest `master-plan-v1` branch.
- [ ] Read `docs/MAISOG_LABS_MASTER_PLAN_V1.md`.
- [ ] Read `docs/MASTER_PLAN_CHANGELOG.md`.
- [ ] Read `docs/MASTER_PLAN_IMPLEMENTATION_V1.md`.
- [ ] Confirm working tree is clean before changes.
- [ ] Confirm no secrets are present in tracked files.
- [ ] Confirm changes will remain on a non-production branch until reviewed.

## 1. Verify current Cloudflare deployment — read only first

Record facts before modifying anything:

- [ ] Which Cloudflare product currently serves `maisoglabs.com`?
- [ ] Current Worker/Pages project name.
- [ ] Current routes/custom domains.
- [ ] Current build/deploy settings.
- [ ] Current environment variables/secrets names (do not copy secret values into Git/docs/chat).
- [ ] Existing D1 databases.
- [ ] Existing R2 buckets.
- [ ] Existing bindings.

Decision rule:
- If live state differs from Master Plan assumptions, STOP and log the difference before changing it.

## 2. Verify Cloudflare Access

Read and record:

- [ ] Access application protecting admin paths exists.
- [ ] Application covers intended admin routes.
- [ ] Exact allowed owner identity is `paulo@maisoglabs.com`.
- [ ] No unintended Allow/Bypass policy can grant admin access.
- [ ] Session duration is reviewed.
- [ ] MFA/independent MFA requirement is enabled or deliberately configured before production mutations.
- [ ] Access application audience value is recorded securely for Worker configuration.
- [ ] Team domain/issuer information needed for JWT validation is confirmed.

Do not store tokens, cookies, client secrets, or private key material in repository files or this checklist.

## 3. Dependency security baseline

Before adding backend functionality:

- [ ] Check current official security advisories for Next.js.
- [ ] Check current official security advisories for React/React DOM.
- [ ] Check current supported Wrangler release.
- [ ] Choose patched compatible versions based on the current official state at implementation time.
- [ ] Upgrade only on a working branch.
- [ ] Generate/commit `package-lock.json`.
- [ ] Perform clean `npm ci`.
- [ ] Run `npm run build`.
- [ ] Confirm static export remains successful unless an approved architecture change says otherwise.
- [ ] Record exact versions and results in `docs/MASTER_PLAN_CHANGELOG.md`.

If the build fails, STOP and resolve before backend work.

## 4. First backend milestone: identity proof only

Implement only:

`GET /api/admin/me`

It must:

- [ ] validate the Cloudflare Access JWT cryptographically using the official supported approach
- [ ] validate issuer
- [ ] validate audience
- [ ] validate expiry/not-before semantics as applicable
- [ ] obtain identity from the validated token/session context
- [ ] authorize only `paulo@maisoglabs.com`
- [ ] return minimal identity/status data
- [ ] return `Cache-Control: no-store`
- [ ] reveal no token or security-sensitive claim values unnecessarily

Negative tests:

- [ ] no token/session
- [ ] random token
- [ ] forged email/header
- [ ] expired token
- [ ] wrong audience
- [ ] validly authenticated but unauthorized identity
- [ ] malformed request

STOP GATE:
No D1 write API until all identity tests pass.

## 5. D1 staging setup — only after identity gate

- [ ] Confirm/create staging database using the `maisog-cms` naming convention.
- [ ] Add staging binding `DB`.
- [ ] Do not bind production writes until staging tests pass.
- [ ] Add migration files to Git.
- [ ] Apply migrations to staging.
- [ ] Verify schema.
- [ ] Test prepared/bound statements.
- [ ] Test recovery procedure.
- [ ] Log results.

## 6. R2 staging setup — only after protected API foundation

- [ ] Confirm/create staging bucket using the `maisog-media` naming convention.
- [ ] Add staging binding `MEDIA`.
- [ ] Keep bucket private.
- [ ] Test Worker-mediated upload only.
- [ ] No public/admin storage credentials in browser code.
- [ ] Validate size, approved format, actual file validity/signature where feasible, and generated object key.
- [ ] Test partial R2/D1 failure cleanup.

## 7. Production decision checkpoint

Before any production mutation capability, complete panel review:

- Systems architecture: PASS / HOLD
- Security: PASS / HOLD
- Data integrity/recovery: PASS / HOLD
- Dependency/build: PASS / HOLD
- UX/operations: PASS / HOLD
- Rollback path: VERIFIED / NOT VERIFIED
- Owner approval: YES / NO

Any security-critical HOLD means STOP.

## Rule for the session

Read first, record second, change third, test fourth, promote last.

Never use production as the first test environment.