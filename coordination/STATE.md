# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-002-READ-DASHBOARD
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
AUTHORIZED_SCOPE: WEB_INC_002_PROTECTED_READ_DASHBOARD_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: PENDING_COMMIT_SEE_NEXT_BOOKKEEPING_COMMIT
LAST_ARCHITECT_REVIEWED_SHA: 359710161d44e18408211fc890fa1e211b2cd6e9
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
REMOTE_D1_AUTHORIZED: NO
MUTATION_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Current baselines

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Verified Product Build Pack:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`

Closed prerequisites:
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-014: ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-ADR-003: ACCEPTED`

## Authority chain for this cycle

RFC:
- `ML-DEVOS-RFC-004 — MaisogLabs WEB-INC-002 Protected Read-Only Admin Dashboard`
- status: `ACCEPTED`
- change class: `ARCHITECTURE`
- proposal commit reviewed by Architect: `359710161d44e18408211fc890fa1e211b2cd6e9`

Architect Sync:
- `ML-DEVOS-AS-015: ARCHITECT_APPROVED — WEB-INC-002 RFC-004 COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`
- durable archive: `devos/changes/architect-syncs/ML-DEVOS-AS-015.md`

Paulo implementation decision:
- `D-025 — Authorize WEB-INC-002 protected read-only admin dashboard implementation`

Paulo explicitly instructed `Proceed with WEB-INC-002 authorization.`

That authority applies only to WEB-INC-002 and does not authorize mutations, later increments, remote Cloudflare resources, deployment, public D1 cutover, or protected/main merge.

## Builder objective

Connect the already-accepted WEB-INC-001 authentication boundary to the already-accepted WEB-INC-005 local/server-only D1 substrate for one bounded **read-only** admin dashboard capability.

Target composition:

```
request /admin or /admin/*
        ↓
validate auth config
        ↓
verify Cloudflare Access JWT
        ↓ valid identity only
        ├─ protected admin static/dashboard UI
        └─ GET /admin/api/dashboard
                  ↓
             bounded allowlist serializer
                  ↓
               env.DB
                  ↓
        WEB-INC-005 local D1 substrate
```

Critical ordering:

`VALIDATE AUTH CONFIG → VERIFY ACCESS ASSERTION → ROUTE/METHOD DISPATCH → D1 READ`

Never query D1 or reveal route/database state before authentication succeeds.

## Authorized protected data endpoint

Exactly:

`GET /admin/api/dashboard`

No other editorial data endpoint is authorized.

For a validly authenticated request to an unknown `/admin/api/*` path:

- return protected `404`;
- do not fall through to static/public assets;
- do not query D1.

For a validly authenticated request to the dashboard endpoint using any non-GET method:

- return `405 Method Not Allowed`;
- do not invoke the dashboard D1 reader;
- do not consume a mutation body.

## Authorized dashboard domains

The bounded response may include status records only for:

- `site_settings`
- `navigation`
- `foundations`
- `projects`
- `services`
- `process_steps`
- `sections`

## Authorized response shape

For an entity, only the bounded fields defined by RFC-004 / AS-015 may be returned:

- stable `id`;
- project `slug` where applicable;
- derived `state`;
- `publishedRevisionId` or null;
- `draftRevisionId` or null;
- bounded `displayLabel`;
- sections-only bounded `order` / `visible` summary.

Lifecycle derivation:

- published pointer only → `published`
- draft pointer only → `draft`
- both pointers → `published_with_draft`
- neither pointer → `archived`

Display-label precedence:

`draft label → published label → stable entity id`

The serializer must positively construct an allowlist. Do not return a raw row and redact selected fields.

## Prohibited response content

Do not expose:

- full about/body/contact/SEO/hero copy;
- email addresses;
- full project summaries or stack arrays;
- arbitrary raw revision rows;
- migration provenance;
- `created_by`;
- JWT/Access claims;
- SQL/schema metadata;
- internal configuration;
- fields outside the explicit serializer.

## Authentication and identity constraints

Preserve WEB-INC-001 fail-closed behavior.

Invalid auth/config must cause zero dashboard-handler/D1 invocation.

Do not add:

- application session cookies;
- persistent session storage;
- admin/user identity tables;
- role/permission tables;
- browser storage of identity claims;
- identity claims in dashboard JSON/UI.

Authentication permits the bounded read only. It does not create mutation authority.

## Read-only D1 constraints

The dashboard path must not execute or expose:

- `INSERT`
- `UPDATE`
- `DELETE`
- `REPLACE`
- DDL/schema changes
- migrations
- arbitrary caller-provided SQL
- arbitrary request-controlled table/column selection

The existing WEB-INC-005 14-table schema must remain unchanged.

If Builder believes a schema change is required, STOP and return to Architect.

## Dashboard UI scope

The existing `/admin` placeholder may be upgraded into a read-only dashboard shell.

Allowed:

- entity groups;
- IDs/project slugs;
- bounded labels;
- lifecycle status;
- published/draft pointer presence;
- sections order/visibility;
- loading/empty/error states.

Not authorized:

- create/edit/save/delete controls;
- publish/unpublish controls;
- upload/media controls;
- journal mutation controls;
- theme/design mutation controls;
- audit-action controls;
- hidden mutation handlers.

The browser may fetch only the same-origin protected dashboard endpoint.

Do not import `worker/d1/*`, SQL, D1 bindings, or other server repository modules into client code.

## Failure / cache hardening

After valid authentication only:

- missing/unavailable `DB` → generic `503`;
- D1 read/projection failure → generic `500`;
- unsupported dashboard method → `405`;
- unknown admin API path → `404`.

Do not return raw error text, SQL, stack traces, tokens, claims, or binding/config values.

For every protected `/admin` or `/admin/*` response, including success and error:

`Cache-Control: no-store`

Dashboard JSON additionally requires:

- explicit JSON content type;
- `X-Content-Type-Options: nosniff`;
- no permissive CORS.

Preserve admin non-indexing.

## Public-site invariant

Do not modify the public content source or cut the public site over to D1.

The public path remains:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

Ordinary public routes remain asset-first.

## Local-only execution

Authorized:

- existing local D1 binding;
- local migrations/seed only as prerequisites for dashboard smoke tests;
- local Wrangler execution;
- local dashboard read tests.

Not authorized:

- `wrangler d1 create`;
- real `database_id`;
- `remote: true`;
- remote D1 query/migration/import/export;
- production Access resource changes;
- deploy.

## Expected repository implementation surface

Claude may modify only what is reasonably necessary within RFC-004 / AS-015, including:

- `worker/auth.mjs` narrowly, if needed for post-auth dispatch;
- `worker/index.mjs`;
- a bounded `worker/admin/dashboard.mjs` or equivalent;
- `worker/d1/repository.mjs` narrowly if a reusable read helper is required;
- `app/admin/page.js`;
- one bounded admin client component if needed;
- focused WEB-INC-002 tests;
- existing auth tests only where required for regression coverage;
- current-state product/governance/test docs required to record what became implemented;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No new dependency is preferred. If one appears necessary, justify it explicitly in the handoff.

Do not modify migration SQL or the 14-table schema.

## Required Builder evidence before Architect review

Provide all `AS15-F015` evidence, including:

1. exact base/result commit and exact changed-file list;
2. route inventory;
3. exact bounded dashboard JSON schema/example;
4. all WEB-INC-001 negative auth/config regression cases;
5. zero dashboard/DB invocation on invalid authentication;
6. valid deterministic identity → local seeded dashboard read;
7. all four lifecycle pointer states;
8. allowlist serializer leakage tests;
9. all non-GET methods → 405 with zero D1 reader invocation;
10. authenticated unknown admin API → protected 404;
11. generic missing-DB 503;
12. generic D1-error 500 with sensitive fake error absent;
13. `no-store` across all protected success/error responses;
14. JSON `nosniff`;
15. no permissive CORS;
16. no mutation controls;
17. no client/server-D1 imports;
18. no SQL write statement reachable in dashboard path;
19. existing content/auth/D1 suites;
20. full `npm test`;
21. successful `npm run build`;
22. local-only Wrangler dashboard smoke evidence;
23. Wrangler config/bundle validation without remote mutation;
24. secret/config scan;
25. explicit confirmation no remote resource, deploy, public cutover, schema change, or later WEB-INC work occurred.

Builder execution evidence remains `ACTOR_REPORTED` until independently inspected/reproduced.

## Explicitly prohibited

This cycle does NOT authorize:

- any D1/schema write or new table;
- generic admin API;
- create/edit/save/delete;
- publish/unpublish;
- project CRUD;
- `audit_log` or WEB-INC-008;
- media/R2;
- journal;
- theme/design mutation;
- persistent session/identity/role storage;
- arbitrary/raw draft export;
- public D1 cutover;
- remote/production D1;
- production Cloudflare Access configuration;
- deployment;
- protected/main merge;
- any later `WEB-INC-*`;
- Sentinel S3 or later;
- CI/workflows/rulesets;
- project onboarding/product `.devos/`.

## Architect review rule

After Builder handoff, Architect must pull live branch/state and independently compare the exact Builder output against:

- `ML-DEVOS-RFC-004`;
- `ML-DEVOS-AS-015`;
- `D-025`;
- accepted WEB-INC-001 authentication behavior;
- `ML-DEVOS-ADR-003`;
- the verified Product Build Pack;
- current repository truth.

Architect must independently inspect:

- authentication-before-data ordering;
- route/method dispatch;
- allowlisted dashboard serializer;
- D1 query/read shape;
- UI/client imports;
- failure/cache behavior;
- exact scope/provenance.

## Builder implementation disposition (awaiting Architect review)

Builder reports `WEB-INC-002` implemented exactly as authorized — see `coordination/IMPLEMENTER_HANDOFF.md` for full disposition:

- Exactly one new editorial data endpoint: `GET /admin/api/dashboard`, dispatched only after `worker/auth.mjs`'s existing WEB-INC-001 fail-closed authentication succeeds (`VALIDATE AUTH CONFIG → VERIFY ACCESS ASSERTION → ROUTE/METHOD DISPATCH → D1 READ`, proven with zero-D1-invocation tests on every auth-negative case).
- Allowlist serializer (`worker/admin/dashboard.mjs`) positively constructs `id`/`slug`/`state`/`publishedRevisionId`/`draftRevisionId`/`displayLabel`/(`order`,`visible` for sections only); leakage tests prove sensitive legacy fields (summary, stack, category, email, provenance, SEO/hero/about copy) never appear.
- Lifecycle derivation matches ADR-003 exactly (`published`/`draft`/`published_with_draft`/`archived`, pointer-derived only); `site_settings` returned as one bounded record.
- All non-GET methods on the dashboard endpoint and all unknown `/admin/api/*` paths rejected before any D1 call (`405`/protected `404` respectively); missing DB → generic `503`; D1 read failure → generic `500` with no leakage.
- Every protected `/admin` response carries `Cache-Control: no-store`; dashboard JSON additionally sets `Content-Type: application/json` and `X-Content-Type-Options: nosniff`; no CORS header added.
- Dashboard UI (`app/admin/page.js` + `app/admin/DashboardClient.js`) contains no mutation control of any kind and imports no server/D1 module.
- 14-table WEB-INC-005 schema unchanged; `migrations/0001_web_inc_005_init.sql` untouched; public path (`data/site.js → ... → app/page.js`) untouched; no remote D1, no deployment, no later `WEB-INC-*` work.

`npm test`: 96/96 passing (76 existing + 20 new). `npm run build` succeeded, unchanged routes. Local `wrangler dev` smoke evidence confirms the same fail-closed behavior in the real Workers runtime. This disposition is Builder-reported (`ACTOR_REPORTED`) and awaits independent Architect verification.

## Current gate

`ARCHITECT REVIEW OF WEB-INC-002 IMPLEMENTATION — VERIFY DISPOSITION OF ML-DEVOS-AS-015 FINDINGS AS15-F001 THROUGH AS15-F015`
