# ML-DEVOS-AS-011 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `301c7a0df877ac6be71010f85da6a59809966144`
- file blob: `86572d1a9d740c0f9a6eca3744669d8739c583d9`

Archive method:
- The fenced block below reproduces the concluding `coordination/ARCHITECT_REVIEW.md` snapshot from the cited commit byte-for-byte.
- Explanatory metadata is outside the fenced block.
- This durable archive is created only after `ML-DEVOS-AS-011` concluded.

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION RECORDED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-011 — WEB-INC-001 Authentication Boundary Architecture Sync

Cycle: `MAISOGLABS-WEB-INC-001-AUTH`
Reviewed proposal: `ML-DEVOS-RFC-002`
RFC commit: `8dbf5c6350de153caaf5d0016989963e1be321da`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Product specification baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`

## Classification

`ARCHITECTURE`

The classification in `ML-DEVOS-RFC-002` is correct.

`WEB-INC-001` introduces:

- the first server-executed request boundary into a currently asset-only website deployment;
- a new authentication trust boundary for `/admin`;
- a Worker script + static Assets routing model where the current repository has static assets only;
- a reusable protected-path seam later admin capabilities will depend on.

That is a product-architecture change rather than a mere local implementation detail.

No Sentinel constitutional/core rule changes.

## Repository-grounded compatibility review

### Current deployment

Repository evidence confirms:

- Next.js static export;
- `out/` deployed through Wrangler Static Assets;
- current `wrangler.jsonc` has no Worker script entrypoint;
- no database;
- no server-side app dependency;
- no authentication/session/identity-provider implementation;
- no `/admin` route today.

Therefore an authenticated `/admin` cannot be truthfully implemented as only a client-side route guard.

### Existing content boundary

The RFC preserves the current governed public-content chain:

`data/site.js → lib/content/local.mjs → lib/content/schema.mjs → lib/content/public.mjs → app/page.js`

`WEB-INC-001` does not replace it and does not introduce D1/private editorial reads.

### Dependency order

The Product Build Pack requires:

`WEB-INC-001 → WEB-INC-005 → WEB-INC-002 → ...`

The RFC respects that order.

It introduces authentication only. It does not pull storage or dashboard/data behavior forward.

## External architecture check

Current Cloudflare documentation independently supports the key technical assumptions used by the RFC:

- Cloudflare Access applications can protect specific paths rather than an entire hostname;
- Access self-hosted applications are deny-by-default unless a user matches an Allow policy;
- Cloudflare sends the Access application assertion in `Cf-Access-Jwt-Assertion`, and documents server-side JWT validation;
- Workers Static Assets supports selective `assets.run_worker_first` path patterns and explicitly lists authentication checks as a use case.

These external facts support technical feasibility only. They do not grant Sentinel authority.

## Findings

### AS11-F001 — PASS — selective Worker-first routing preserves public static path

The proposed use of:

- `/admin`
- `/admin/*`

as the only Worker-first paths is compatible with the current static/public deployment.

Binding implementation constraint:

- ordinary public routes/assets must remain asset-first;
- Builder must not set global `run_worker_first: true` unless separately reviewed and authorized.

### AS11-F002 — PASS — fail-closed server-side JWT verification is required

The RFC correctly rejects client-only authentication.

For protected paths, the Worker must reject requests when the Access assertion is:

- absent;
- malformed;
- expired/not yet valid;
- signed by an untrusted key;
- issued for the wrong Access team/domain;
- carrying the wrong application audience.

A successful token check must be required before serving the admin asset.

### AS11-F003 — PASS WITH CONSTRAINT — production Access configuration remains separate

Repository implementation and production Cloudflare Access configuration are separate operations.

This authorization covers only the repository-side WEB-INC-001 implementation/test work.

It does **not** authorize:

- creation/modification of a production Cloudflare Access application;
- identity-provider configuration;
- adding an administrator identity to a real Access policy;
- production deployment.

Those remain future sensitive operations requiring a concrete Decision Packet and explicit Paulo authorization.

### AS11-F004 — PASS — minimal admin placeholder is acceptable

A minimal static `/admin` placeholder may be added solely to prove the boundary.

It must not become `WEB-INC-002` by scope creep.

No:

- D1;
- private editorial data;
- content mutation;
- project/journal controls;
- media upload;
- theme controls.

### AS11-F005 — REQUIRED IMPLEMENTATION EVIDENCE

Before Architect approval of Builder output, Builder must provide:

- exact implementation commit/diff;
- build result;
- focused auth test results;
- missing-token rejection;
- malformed-token rejection;
- wrong-audience rejection;
- expired-token rejection;
- valid signed test-token acceptance;
- evidence ordinary public routes retain asset-first behavior;
- explicit secret scan / confirmation that no production credential or admin identity was committed.

Builder evidence remains `ACTOR_REPORTED` until independently reviewed.

The Architect should independently reproduce the deterministic local auth tests where practical.

### AS11-F006 — REQUIRED TEST-DESIGN CONSTRAINT

Tests must not depend on real production Cloudflare identity configuration.

Use deterministic test keys/JWKS and test audience/issuer values.

Production runtime verification is impossible and must not be claimed until a separately authorized production Access application and deployment exist.

### AS11-F007 — PASS — rollback remains bounded

Because this increment writes no content/database state, repository rollback is bounded:

- revert Worker/auth/admin-placeholder implementation;
- restore the previous asset-only Wrangler contract.

No content migration rollback is involved.

## Security / trust-boundary verdict

The proposed boundary is compatible with Sentinel and with the verified Product Build Pack provided all implementation constraints above are followed.

Critical invariant:

`NO VALID SERVER-VERIFIED ACCESS IDENTITY → NO ADMIN ASSET`

Capability ≠ Authority remains intact.

## Scope approved for Builder

Builder may implement exactly `ML-DEVOS-RFC-002` subject to this Architect Sync.

Expected allowed implementation surface:

- bounded Worker/auth helper files;
- `wrangler.jsonc`;
- minimal `app/admin/page.js` or equivalent static placeholder;
- `package.json` / lockfile only for dependencies actually needed;
- focused auth tests;
- architecture/product-tech documentation updates that describe what actually became implemented;
- relevant risk/test/governance traceability updates;
- normal `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`.

Builder must stop if implementation requires:

- D1/R2;
- external production Cloudflare resource mutation;
- a different identity model;
- broader Worker-first routing;
- new persistent admin/session storage;
- any later `WEB-INC-*`;
- S3;
- CI/rulesets;
- deployment/main merge.

That would require a new classification/review decision.

## Verdict

`ML-DEVOS-AS-011: ARCHITECT_APPROVED — WEB-INC-001 RFC-002 COMPATIBLE FOR BOUNDED IMPLEMENTATION`

Paulo's instruction `Proceed with authorizations` is treated as authorization to advance the next dependency-ordered Product Build Pack increment through its required Sentinel authorization chain. The corresponding implementation decision is recorded separately in `brain/DECISION_LOG.md`.

## Deployment authority

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Next review rule

After Builder handoff, Architect must pull the live branch/state, inspect the exact implementation commit, compare it against:

- `ML-DEVOS-RFC-002`;
- this `ML-DEVOS-AS-011`;
- the implementation decision;
- `docs/product/BUILD_PLAN.md`;
- current repository architecture/security constraints;

and independently reproduce the deterministic auth tests where practical before issuing PASS / CHANGES_REQUESTED.

```
