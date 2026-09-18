# ML-DEVOS-RFC-004: MaisogLabs WEB-INC-002 Protected Read-Only Admin Dashboard

Status: `UNDER_ARCHITECT_SYNC`

Proposed change class: `ARCHITECTURE`

Product increment: `WEB-INC-002`

## Baselines

- Frozen Sentinel architecture: `ML-DEVOS-ARCH-001 / v1.2.0`
- Active Sentinel governance-capability baseline: `v1.4.0`
- Product Build Pack: `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`
- Authentication boundary: `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- Local D1 revision substrate: `ML-DEVOS-AS-014: ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- Adopted storage architecture: `ML-DEVOS-ADR-003`

## Problem

MaisogLabs has the two prerequisites for a protected read-only admin view, but they are intentionally not connected:

1. `WEB-INC-001` protects `/admin` and `/admin/*` with fail-closed server-side Cloudflare Access JWT verification.
2. `WEB-INC-005` provides a local/server-only D1 revision substrate and bounded repository reads.

The current `/admin` page is only an authentication-boundary placeholder. No authenticated HTTP endpoint reads D1, and no dashboard can inspect published/draft/archive revision state.

`WEB-INC-002` connects those accepted foundations for **read-only administrative visibility only**.

## Classification

`ARCHITECTURE`.

The Product Build Plan identified `CAPABILITY` as the likely minimum class. The concrete repository-grounded proposal is elevated to `ARCHITECTURE` because it:

- creates the first HTTP path capable of returning non-public editorial/D1 state;
- composes the authentication trust boundary with the D1 subsystem;
- changes the Worker from authentication-only gating to an authenticated application/data router;
- defines the protected admin-read contract later dashboard behavior depends on.

The stronger route therefore applies:

`RFC → Architect Sync → Paulo Decision → Implementation → ADR`.

This is product architecture only. It does not change Sentinel core architecture or the active Sentinel version.

## Proposed architecture

### 1. Protected read composition

```
request /admin or /admin/*
        ↓
WEB-INC-001 fail-closed JWT verification
        ↓ valid identity only
        ├── /admin + static admin assets
        │      ↓
        │   read-only dashboard UI
        │
        └── GET /admin/api/dashboard
               ↓
           bounded dashboard serializer
               ↓
           env.DB server-side only
               ↓
           WEB-INC-005 D1 substrate
```

Binding invariants:

`NO VALID SERVER-VERIFIED ACCESS IDENTITY → NO ADMIN HTML AND NO D1 READ`

and:

`AUTHENTICATED READ CAPABILITY ≠ MUTATION AUTHORITY`.

### 2. Exact protected data endpoint

The only new editorial data endpoint authorized by this increment is:

`GET /admin/api/dashboard`

No other admin API route is authorized.

For authenticated requests to unknown `/admin/api/*` paths, return a protected `404`. Do not fall through to a public/static asset response.

### 3. Method boundary

`GET` is the only authorized dashboard-data method.

All other methods against the dashboard endpoint must return `405 Method Not Allowed` after successful authentication and must perform no D1 write.

No request body is consumed.

No SQL write, mutation helper, publish/unpublish operation, or storage mutation may be reachable from this endpoint.

### 4. Authentication must precede route data access

The D1 binding/dashboard handler must never be invoked before the existing WEB-INC-001 authentication checks succeed.

All existing auth/config rejection cases remain fail-closed, including:

- missing/malformed/expired/not-yet-valid assertion;
- wrong audience;
- wrong issuer/team;
- untrusted signing key;
- missing/blank/placeholder/malformed auth configuration.

Tests must prove that these failures produce zero dashboard-handler/D1 invocation.

### 5. Fixed dashboard response model

The endpoint is a status dashboard, not a general-purpose draft/content export.

Allowed domains:

- `site_settings`
- `navigation`
- `foundations`
- `projects`
- `services`
- `process_steps`
- `sections`

For each entity, the JSON may contain only the fields required for dashboard status:

- stable entity `id`;
- project `slug` where applicable;
- derived `state`: `published`, `draft`, `published_with_draft`, or `archived`;
- `publishedRevisionId` or null;
- `draftRevisionId` or null;
- a bounded `displayLabel` derived from the draft revision when one exists, otherwise the published revision, otherwise the stable ID;
- for sections only, bounded current draft-or-published `order` and `visible` summary.

For site settings, the bounded display label may be the current site name.

The endpoint must not return:

- full body/about/contact/SEO/hero copy;
- email addresses;
- full project summaries or stack arrays;
- arbitrary raw revision rows;
- migration provenance or `created_by`;
- JWT/Access claims;
- SQL/schema internals;
- fields outside the explicit serializer.

### 6. Derived lifecycle semantics

Status remains pointer-derived:

- published pointer only → `published`;
- draft pointer only → `draft`;
- both pointers → `published_with_draft`;
- both null → `archived`.

No lifecycle column is added.

### 7. Server-only D1 read layer

WEB-INC-002 may add a bounded server-side dashboard projection module using fixed SQL/read shapes over the existing WEB-INC-005 tables.

It may reuse or narrowly extend `worker/d1/repository.mjs` when appropriate.

It must not:

- alter the 14-table schema;
- add product tables;
- add `audit_log`;
- add identity/session/media/journal/theme tables;
- write any D1 row;
- expose arbitrary SQL/table access;
- expose D1 directly to browser/client code.

### 8. Read-only dashboard UI

The existing `/admin` placeholder may become a bounded read-only dashboard shell.

It may display:

- current-content groups;
- IDs/project slugs;
- bounded labels;
- lifecycle state;
- published/draft pointer presence;
- sections order/visibility;
- loading/empty/error states.

It must not expose:

- create/edit/save/delete;
- publish/unpublish;
- upload/media controls;
- journal/theme controls;
- audit controls;
- hidden mutation handlers.

The browser obtains data only via same-origin `GET /admin/api/dashboard`.

### 9. Failure behavior and response hardening

Required protected behavior:

- invalid auth/config → existing WEB-INC-001 fail-closed response;
- valid auth + missing/unavailable `DB` → generic `503`;
- valid auth + D1 read failure → generic `500`;
- authenticated unsupported method → `405`;
- authenticated unknown `/admin/api/*` → `404`.

Do not expose stack traces, SQL, raw database errors, binding/config values, tokens, or identity claims.

Protected admin/dashboard responses must set:

`Cache-Control: no-store`

Dashboard JSON must also set:

`Content-Type: application/json`

and:

`X-Content-Type-Options: nosniff`.

Do not add permissive CORS.

The existing admin non-indexing behavior must be preserved.

### 10. Public site remains unchanged

The public content path remains:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`.

No public route may import/call the dashboard D1 reader.

Ordinary public routes remain asset-first.

WEB-INC-002 does not authorize D1 public-read cutover or retirement of `data/site.js`.

### 11. Local/repository implementation only

Implementation/testing may use the existing local D1 binding and local Wrangler environment.

Not authorized:

- `wrangler d1 create`;
- real `database_id`;
- `remote: true`;
- remote D1 query/migration/import/export;
- production Cloudflare Access changes;
- deployment;
- production runtime verification.

### 12. No new identity/session subsystem

WEB-INC-002 reuses per-request WEB-INC-001 Access JWT verification.

It does not add:

- application session cookies;
- session tables;
- admin/user account tables;
- role/permission tables;
- persistent identity records.

Future mutation/editorial authorization remains separately governed.

## Expected Builder change surface

Builder implementation may reasonably touch:

- `worker/auth.mjs` only as needed to preserve auth behavior while dispatching post-authenticated routes;
- `worker/index.mjs`;
- a bounded module such as `worker/admin/dashboard.mjs`;
- `worker/d1/repository.mjs` only for a narrowly required reusable read helper;
- `app/admin/page.js` and a bounded admin client component;
- focused tests for protected read/auth composition;
- existing auth tests when needed for regression coverage;
- current-state product/governance/test docs only to record what actually became implemented;
- normal `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`.

No new dependency is preferred.

## Required acceptance evidence

Before Architect review, Builder must provide:

1. exact implementation commit and exact changed-file list;
2. all existing WEB-INC-001 auth negative cases passing;
3. unauthenticated dashboard GET rejected with zero D1/dashboard-handler invocation;
4. malformed/expired/wrong-audience/wrong-issuer/untrusted assertion cases cannot reach D1;
5. valid deterministic test identity reaches the dashboard handler;
6. authenticated GET against a seeded local D1 returns the exact bounded model;
7. published/draft/published-with-draft/archived fixtures derive correctly;
8. serializer excludes every unapproved/raw/private field;
9. POST/PUT/PATCH/DELETE return 405 and perform zero D1 writes;
10. authenticated unknown `/admin/api/*` returns protected 404;
11. missing DB returns generic 503 without leakage;
12. D1 read failure returns generic 500 without leakage;
13. dashboard JSON is `no-store` and `nosniff`;
14. protected admin HTML is `no-store` and remains non-indexable;
15. dashboard UI contains no mutation controls;
16. browser bundle imports no D1/server repository module;
17. ordinary public routes remain unchanged;
18. public build still reads `data/site.js`;
19. existing content/auth/D1 tests and the new dashboard tests pass;
20. `npm run build` succeeds;
21. local Wrangler dashboard smoke test succeeds using local D1 only;
22. Wrangler config/bundle validation succeeds without remote mutation;
23. secret/config scan finds no credential, identity, or database ID;
24. explicit confirmation no remote Cloudflare resource was changed;
25. explicit known limitations.

Builder runtime evidence remains `ACTOR_REPORTED` until independently reviewed.

## Explicit non-goals

Not authorized:

- any D1 write;
- create/edit/save/delete;
- publish/unpublish;
- project CRUD;
- audit substrate/logging;
- R2/media;
- journal;
- theme/design controls;
- persistent admin identity/session/role storage;
- raw draft/content export;
- arbitrary D1 query endpoint;
- public D1 cutover;
- remote/production D1;
- production Cloudflare Access configuration;
- deployment;
- protected/main merge;
- `WEB-INC-008`, `WEB-INC-003`, `WEB-INC-004`, `WEB-INC-006`, `WEB-INC-007`;
- Sentinel S3 or later;
- CI/workflows/rulesets;
- project onboarding/product `.devos/`.

## Rollback

Repository rollback:

- revert the bounded WEB-INC-002 implementation;
- WEB-INC-001 auth and WEB-INC-005 D1 substrate remain intact;
- `/admin` returns to an authentication-only placeholder.

No data rollback is required because WEB-INC-002 is read-only and adds no schema/data mutation.

## Security / trust impact

The protected trust boundary changes from:

`AUTHENTICATED ADMIN ASSET`

to:

`AUTHENTICATED ADMIN ASSET + BOUNDED D1 READ`.

Critical ordering:

`AUTH VERIFY → ROUTE/METHOD CHECK → D1 READ`

never:

`D1 READ → AUTH VERIFY`.

## Version impact

Product architecture only.

No Sentinel architecture/governance-capability version bump.

Frozen Sentinel remains `ML-DEVOS-ARCH-001 / v1.2.0`.
Active Sentinel governance-capability baseline remains `v1.4.0`.

## Paulo decision requirement

Required.

Paulo explicitly instructed:

`Proceed with WEB-INC-002 authorization.`

That instruction authorizes this next dependency-ordered increment to advance through the required architecture authorization chain. Builder implementation becomes authorized only after Architect Sync approval and the exact implementation decision is recorded.
