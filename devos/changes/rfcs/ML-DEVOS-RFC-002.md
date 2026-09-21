# ML-DEVOS-RFC-002: MaisogLabs WEB-INC-001 Authentication Boundary

Status: `ACCEPTED`

Proposed change class: `ARCHITECTURE`

Product increment: `WEB-INC-001`

Product baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`
- `docs/product/BUILD_PLAN.md`

## Problem

MaisogLabs currently has no authenticated/private request path. The production contract is a statically exported Next.js site served by a Cloudflare Worker in asset-only mode. Every byte served by the current deployment is public.

`WEB-INC-001` requires a fail-closed authentication boundary for `/admin` before any protected editorial reads or mutations are introduced.

A route hidden only by UI or client JavaScript would not satisfy `ADM-REQ-001`, `WEB-SEC-001`, `WEB-SEC-002`, or `WEB-SEC-011`.

## Motivation

`WEB-INC-001` is the first dependency in the verified Product Build Pack sequence:

`001 → 005 → 002 → 008 → 003 → 004 → 006 → 007`.

No later admin/data increment should proceed until the repository has a server-side, fail-closed authentication boundary with independently testable unauthorized and authorized behavior.

## Classification

`ARCHITECTURE`.

Reason:

- introduces the first server-executed request boundary into a currently asset-only deployment;
- changes the website deployment shape from static-assets-only to static assets plus a narrowly routed Worker script;
- establishes a new authentication trust boundary for `/admin`;
- creates the reusable authorization seam later admin/data capabilities must pass through.

This is more than a simple `CAPABILITY` addition because the change alters the product's runtime/deployment topology and trust boundary. Per the active Sentinel Change Governance Policy, `ARCHITECTURE` requires RFC → Architect Sync → Paulo gate before implementation.

This RFC does not change Sentinel core architecture or actor authority.

## Proposed change

### 1. Preserve public static delivery

The public website remains static-asset-first.

The Worker script MUST NOT run for ordinary public asset/page requests merely because the authentication boundary exists.

Wrangler will use an assets binding plus selective `assets.run_worker_first` only for:

- `/admin`
- `/admin/*`

All other current public routes continue through the static asset path.

### 2. Add a minimal Worker authentication boundary

Introduce a small Worker entrypoint dedicated to protected-path handling.

For requests matching the protected admin paths:

1. read the Cloudflare Access assertion;
2. validate the token server-side against the configured Access application audience and Cloudflare Access signing keys;
3. fail closed when the token is absent, malformed, expired, has the wrong audience/issuer, or cannot be verified;
4. after successful validation, serve the corresponding static admin asset through the Workers Assets binding;
5. perform no content mutation and no database access in this increment.

The implementation should use a maintained JWT verification library rather than handwritten cryptography. The current Cloudflare documentation uses `jose` for Access JWT validation.

### 3. Cloudflare Access as the external identity/authentication layer

The target identity boundary is a Cloudflare Access self-hosted application scoped to the MaisogLabs admin path rather than the whole public site.

Target protected paths:

- `maisoglabs.com/admin`
- `maisoglabs.com/admin/*`

The Access policy is deny-by-default and allows only identities explicitly chosen by Paulo outside the repository.

No administrator email address or identity credential is committed to the repository.

Cloudflare currently documents path-specific Access applications and deny-by-default self-hosted Access policies.

### 4. Environment/config inputs

The repository may define names/placeholders for non-secret runtime configuration needed to validate Access tokens, such as:

- Access team/domain identifier;
- Access application audience (`AUD`).

Secrets, credentials, private keys, identity-provider secrets, and administrator identity data MUST NOT be committed.

Any real environment value is configured outside tracked source.

### 5. Minimal authenticated admin surface

The increment may add a minimal static `/admin` placeholder/shell solely to prove the boundary:

- unauthenticated request is rejected before the admin asset is served;
- authenticated request can reach the placeholder;
- no content read from private storage;
- no mutation controls;
- no D1/R2/API functionality.

The placeholder is not the read-only dashboard from `WEB-INC-002`.

### 6. Tests

Required implementation evidence before Architect approval:

- `TEST-ADM-001`: missing/invalid Access token fails closed and does not return the admin page;
- `TEST-ADM-002`: a correctly signed test Access JWT with the expected issuer/audience reaches the authenticated admin placeholder;
- wrong audience fails;
- expired token fails;
- malformed token fails;
- ordinary public-page/static-asset behavior remains unchanged;
- build succeeds.

Tests may use generated test signing keys and a mocked/fixed JWKS source. Test keys are test fixtures only and must never be production credentials.

### 7. External Cloudflare configuration is a separate operation

Repository implementation of the auth boundary is authorized independently from actually creating/changing Cloudflare Zero Trust / Access resources.

This RFC does **not** by itself authorize:

- changing a production Access application;
- changing a production identity-provider policy;
- production deployment.

Before a real Cloudflare Access application/policy is created or modified, that concrete external operation must be bound to a Sentinel Decision Packet (target, policy scope, expected change, rollback, approver, evidence) and executed only through an authorized Cloudflare capability.

## Scope

Affected project:
- MaisogLabs website in `Dillaab-source/maisog-labs`.

Expected repository change surface for Builder implementation:

- a new Worker entrypoint/auth helper under a bounded `worker/` or equivalent runtime directory;
- `wrangler.jsonc` for `main`, Assets binding, and selective Worker-first routes;
- `app/admin/page.js` or equivalent minimal static admin placeholder if required for the acceptance test;
- `package.json` / lockfile only for the JWT-verification dependency and test support actually required;
- focused auth tests under `tests/`;
- `docs/ARCHITECTURE.md` and/or `docs/product/TECHNICAL_DESIGN.md` only to describe what actually became implemented;
- relevant governance/test/risk traceability records and normal handoff/state files.

Exact paths must be reported in the Builder handoff.

## Non-goals

Not authorized in this increment:

- D1 or any persistent content storage;
- R2 or media uploads;
- protected editorial reads;
- admin dashboard data;
- project/journal CRUD;
- publish/unpublish mutations;
- audit-log persistence;
- theme/design controls;
- arbitrary HTML/CSS/JS editing;
- S3 Sentinel work;
- project onboarding or `.devos/` overlay creation;
- CI/workflows or GitHub rulesets;
- production deployment;
- protected/main merge.

## Affected components

- Cloudflare Worker deployment configuration;
- new Worker auth boundary;
- minimal static admin route/shell;
- auth tests;
- architecture documentation.

The existing public content boundary `data/site.js → lib/content/local.mjs → lib/content/schema.mjs → lib/content/public.mjs → app/page.js` is not replaced by this increment.

## Affected rules

No Sentinel constitutional or core policy rule is weakened or changed.

Applicable existing rules remain:

- Capability ≠ Authority;
- secrets are never committed;
- stronger authority records outrank project-local implementation;
- runtime/security claims require evidence appropriate to the claim.

Product requirements affected:

- `ADM-REQ-001`
- `WEB-SEC-001`
- `WEB-SEC-002`
- `WEB-SEC-011`
- `RISK-WEB-002`
- `RISK-WEB-004`
- `RISK-WEB-006`

## Alternatives considered

### Client-only route guard

Rejected. Client-side checks can hide UI but do not create a security boundary.

### Custom username/password database

Rejected for this increment. It would introduce credential storage, password reset/recovery, session management, and database requirements before `WEB-INC-005`, violating dependency order and expanding the attack surface.

### Protect the entire Worker with Cloudflare Access

Rejected for the public production hostname because the public portfolio must remain publicly reachable. Path-specific protection preserves the public site while gating only `/admin`.

### Worker-level Access context only

Not selected as the sole mechanism because the current application combines static assets and Worker routing, and Cloudflare documents limitations around `ctx.access` with Static Assets. Explicit Access token validation in the protected Worker route keeps the security boundary testable and fail-closed.

## Risks

- misconfigured Worker-first routing could unintentionally route public traffic through the Worker;
- incorrect token validation could allow unauthorized access or lock out the admin;
- a production Access policy could accidentally protect the whole public site;
- `workers.dev` or alternate hostnames could become unintended bypass paths if production routing is configured incorrectly;
- secrets/identity values could leak if hardcoded.

Controls:

- selective `run_worker_first` only for admin paths;
- deny-by-default token verification;
- explicit audience/issuer validation;
- no production identity/config values in source;
- no deployment under this authorization;
- production Access configuration requires a separate Decision Packet and runtime verification.

## Migration impact

No content migration.

Deployment configuration changes from asset-only Worker configuration to a Worker script + static Assets binding, while preserving static asset-first behavior for existing public routes.

## Security / trust impact

Creates a new product trust boundary:

`public request → Cloudflare Access → protected Worker route → authenticated admin asset`.

The Worker MUST treat absence or failed verification of Access identity as unauthorized and fail closed.

Capability ≠ Authority remains unchanged: ability to configure Cloudflare does not itself authorize production Access changes or deployment.

## Evidence requirements

For repository implementation:

- exact Git diff;
- `INDEPENDENTLY_INSPECTED` architecture/security review;
- `INDEPENDENTLY_REPRODUCED` auth tests where practical;
- successful build;
- negative-path auth tests.

For later production activation:

- Decision Packet for the concrete Cloudflare Access operation;
- `RUNTIME_OBSERVED` evidence that unauthenticated `/admin` is blocked and authorized access succeeds;
- public homepage remains available;
- deployment remains separately Paulo-gated.

## Rollout

1. implement/test on the governance branch only;
2. Builder handoff;
3. independent Architect review;
4. if accepted, record what became architecture;
5. separately authorize Cloudflare Access production configuration/deployment;
6. runtime verification before any claim of production authentication.

## Rollback

Repository rollback:
- revert the bounded WEB-INC-001 implementation commit and restore the prior asset-only Wrangler configuration.

Production rollback, if later authorized:
- revert the corresponding deployed Worker/configuration and Access application/policy under an explicit rollback operation.

No content/data rollback is required because this increment writes no persistent content.

## Compatibility

Compatible with:

- verified Product Build Pack;
- current static-export public website;
- future `WEB-INC-005` storage substrate;
- future `WEB-INC-002` protected editorial read dashboard.

Incompatible with:

- treating client-side route hiding as authentication;
- storing admin credentials in tracked source;
- exposing private editorial data before `WEB-INC-005`.

## Version impact

Product architecture change only.

No Sentinel governance-capability version bump.

The frozen Sentinel architecture remains `ML-DEVOS-ARCH-001 / v1.2.0`; active governance-capability baseline remains `v1.4.0`.

## Architect Sync requirement

Required because this change is classified `ARCHITECTURE`.

## Paulo decision requirement

Required.

Paulo's instruction `Proceed with authorizations` authorizes the Architect to complete the required RFC/Architect-Sync/decision chain for the next dependency-ordered increment. Implementation authority becomes effective only if the Architect Sync approves this exact bounded RFC and the resulting decision records that exact scope.

## External references reviewed

Current Cloudflare documentation reviewed during architecture preparation:

- Cloudflare Access application paths: path-specific protection and wildcard behavior.
- Cloudflare Workers + Access: specific hostname/path protection.
- Cloudflare Access JWT validation: server-side verification of Access assertions.
- Cloudflare Workers Static Assets / Worker script routing: selective `assets.run_worker_first` for authentication middleware.

These references inform the proposal but do not override repository/Sentinel authority.
