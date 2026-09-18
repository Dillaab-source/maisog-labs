# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-012 — WEB-INC-001 Implementation Review

Cycle: `MAISOGLABS-WEB-INC-001-AUTH`
Review mode: `POST-IMPLEMENTATION ARCHITECTURE / SECURITY REVIEW`
Authority chain: `ML-DEVOS-RFC-002 → ML-DEVOS-AS-011 → D-023`
Reviewed Builder commit: `210711c4d5043f495b44d1c3edf49e7105053d6b`
Builder base: `0a3d3831e16e520c74e391512253c57e3061916a`

## Required review discipline performed

Before issuing this verdict, the Architect:

1. pulled the live governance branch and current `coordination/STATE.md`;
2. read the current Builder handoff and the concluded `ML-DEVOS-AS-011`;
3. independently compared `0a3d383... → 210711c...`;
4. inspected the Worker/auth code, Wrangler configuration, admin placeholder, tests, architecture/product-tech docs, and governance traceability changes;
5. compared the implementation against `ML-DEVOS-RFC-002`, `D-023`, and the Product Build Pack;
6. checked current Cloudflare Workers/Access documentation and current `jose` verification semantics for the load-bearing auth assumptions;
7. attempted independent runtime reproduction in the local review sandbox. The sandbox could not resolve GitHub for cloning and did not have `jose` preinstalled, so no independent executable-test result is claimed from this review. This limitation does not replace code/config inspection.

## Exact Builder diff — PASS

GitHub compare `0a3d3831e16e520c74e391512253c57e3061916a → 210711c4d5043f495b44d1c3edf49e7105053d6b` reports exactly one Builder commit and 16 changed files:

- `.gitignore`
- `app/admin/page.js`
- `brain/GOVERNANCE_MAP.md`
- `brain/PROJECT_GOVERNANCE.md`
- `brain/RISK_REGISTER.md`
- `brain/TEST_LEDGER.md`
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/product/TECHNICAL_DESIGN.md`
- `package-lock.json`
- `package.json`
- `tests/worker-auth.test.mjs`
- `worker/auth.mjs`
- `worker/index.mjs`
- `wrangler.jsonc`

The implementation stays inside the authorized WEB-INC-001 repository boundary. No D1/R2, later WEB-INC, S3, CI/ruleset, deployment, or main-merge work is present.

## Findings

### AS12-F001 — BLOCKER — auth configuration is not itself fail-closed

The token-verification path correctly uses `jose.jwtVerify()` with issuer and audience when those values exist.

However, `worker/index.mjs` does not explicitly reject missing/blank/misconfigured `ACCESS_AUD` or `ACCESS_TEAM_DOMAIN` before constructing the verifier.

This matters because:

- Cloudflare's own current Workers example explicitly checks that the expected audience environment value exists before attempting JWT verification and rejects the request when it is missing;
- `jose`'s audience verification option is optional. If no audience option is supplied, audience validation is not performed.

Therefore a future configuration where the team domain is valid but `ACCESS_AUD` is absent could accept a validly signed token from the same issuer without enforcing the application-specific audience requirement. That violates `AS11-F002` / `D-023`'s fail-closed wrong-audience invariant.

Required remediation:

- add explicit runtime configuration validation before protected-path auth is attempted;
- missing, blank, placeholder, or malformed required auth configuration must fail closed and must never serve the admin asset;
- at minimum validate both team domain and application audience;
- invalid configuration should return a non-success response before `assets.fetch`;
- no JWKS/network lookup should be attempted when required auth configuration is invalid;
- add deterministic tests for missing/blank/placeholder audience and missing/blank/placeholder team domain;
- preserve existing wrong-audience/wrong-issuer/untrusted-key tests.

The implementation may keep the current bare-host team-domain convention or adopt Cloudflare's full-`https://...` convention, but one contract must be explicit and consistently validated.

### AS12-F002 — BLOCKER — current-state documentation contradicts the new implementation

Several current-state statements were not converged after WEB-INC-001.

Examples:

`docs/product/TECHNICAL_DESIGN.md` still says, in its current-architecture/dependency sections:

- there is no auth library;
- the deployment is asset-only;
- there is no server-side application dependency.

The same document later correctly states that WEB-INC-001 added `jose`, a Worker auth boundary, and selective Worker-first routing.

Its proposed-target introduction also still says **“None of the following exists”** even though the authentication-boundary item immediately below is now marked `CURRENTLY IMPLEMENTED`.

`brain/PROJECT_GOVERNANCE.md` likewise still describes the current deployment as asset-only and its “Current restrictions” section still contains stale Phase-1 wording saying no authentication/admin implementation is authorized, while the same file now records WEB-INC-001 as implemented.

Required remediation:

- make all current-deployment/current-dependency statements repository-truthful after WEB-INC-001;
- distinguish “no database/persistent application state” from the now-real server-executed Worker path;
- record `jose` as the current auth/JWT dependency;
- remove the stale “asset-only” description where it is no longer true;
- fix the proposed-target wording so it does not claim the already-implemented authentication boundary is nonexistent;
- replace stale Phase-1 restriction text with the current WEB-INC-001/later-increment gate;
- keep the no-deployment/no-main-merge restrictions unchanged.

This is a source-of-truth/convergence defect, not runtime scope drift.

### AS12-F003 — REQUIRED SECURITY EVIDENCE — prove alternate static admin URLs cannot bypass the Worker

The build emits `out/admin.html`, while Worker-first routing currently names `/admin` and `/admin/*`.

Cloudflare's current Static Assets documentation says the default `html_handling` is `auto-trailing-slash` and that requests to a file-style URL such as `/file.html` are redirected to the canonical extensionless path instead of serving the HTML directly.

That default appears compatible with this implementation, because `/admin.html` should redirect to `/admin`, which is protected.

But this redirect behavior is now part of the security boundary and Builder did not include it in the reported local smoke test.

Required remediation/evidence:

- explicitly pin `assets.html_handling` to the intended canonicalization mode rather than relying on an implicit default; and
- add a Wrangler-runtime smoke test or equivalent evidence showing an unauthenticated request to `/admin.html` does not return the admin asset directly and ultimately lands on the protected canonical path;
- also check the relevant `/admin/` and `/admin/index.html` canonical forms where applicable;
- do not widen Worker routing to unrelated public paths.

### AS12-F004 — PASS — core token verification logic is directionally correct

Independent code inspection confirms:

- the Access assertion header is read server-side;
- protected-path asset serving occurs only after `jwtVerify()` succeeds;
- missing/malformed/expired/not-yet-valid/wrong-audience/wrong-issuer/untrusted-key cases are covered by Builder tests;
- ordinary non-admin requests are delegated to assets without an auth check inside the pure handler;
- no content mutation/database access exists.

Cloudflare's current documentation also confirms that `Cf-Access-Jwt-Assertion` is the recommended header to validate and that issuer/audience validation with `jose` is the expected pattern.

### AS12-F005 — PASS — selective Worker-first routing is correctly scoped

`wrangler.jsonc` uses an array rather than global `true`, and the configured Worker-first paths are limited to the admin boundary.

Current Cloudflare Workers documentation confirms array-based `assets.run_worker_first` is the supported mechanism for selective authentication middleware while leaving other assets asset-first.

### AS12-F006 — PASS — Builder scope boundary held

No production Cloudflare Access application/policy, identity-provider configuration, D1/R2 resource, deployment, or main merge was created by the Builder commit.

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Evidence disposition

The exact Git diff and repository contents in this review are `INDEPENDENTLY_INSPECTED`.

Cloudflare/JWT behavior cited above is independently corroborated against current vendor/library documentation.

Builder test/build/dry-run/local-Wrangler results remain `ACTOR_REPORTED` in this review because the Architect sandbox could not install/execute the repo dependencies. No `INDEPENDENTLY_REPRODUCED` execution claim is made.

## Verdict

`ML-DEVOS-AS-012: CHANGES_REQUESTED — WEB-INC-001 REMEDIATION CYCLE 1`

The implementation is close and remains within the authorized increment, but the authentication boundary should not be accepted until:

1. required auth configuration itself fails closed;
2. the repository's current-state documents converge on the actual Worker/auth implementation;
3. alternate static admin URL canonicalization is explicitly pinned/tested as part of the security boundary.

## Authorized remediation scope

Claude may modify only what is necessary to resolve the findings above, including:

- `worker/index.mjs`;
- `worker/auth.mjs` if helper factoring is useful;
- `tests/worker-auth.test.mjs`;
- `wrangler.jsonc`;
- `docs/ARCHITECTURE.md`;
- `docs/product/TECHNICAL_DESIGN.md`;
- `brain/PROJECT_GOVERNANCE.md`;
- `brain/GOVERNANCE_MAP.md`, `brain/RISK_REGISTER.md`, and `brain/TEST_LEDGER.md` only if traceability wording/evidence status needs correction;
- normal `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`;
- package files only if genuinely required by the remediation (no new dependency is currently expected).

No external Cloudflare mutation, D1/R2, later WEB-INC work, deployment, main merge, S3, CI, or ruleset work is authorized.

## Current gate

`CLAUDE WEB-INC-001 REMEDIATION CYCLE 1 — SUBJECT TO ML-DEVOS-AS-012`
