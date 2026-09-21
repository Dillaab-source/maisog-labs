# ML-DEVOS-AS-015 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `396a76b59c12dfdfdd285872fb75303797440714`
- file blob: `88f5bc3f784098fe88e4d0bc3f5ca030b5dc3d71`

Archive method:
- The fenced block below reproduces the concluding `coordination/ARCHITECT_REVIEW.md` snapshot from the cited commit byte-for-byte.
- Explanatory metadata is outside the fenced block.
- This durable archive is created only after `ML-DEVOS-AS-015` concluded.

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION MAY BE RECORDED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-015 — WEB-INC-002 Protected Read-Only Admin Dashboard Architecture Sync

Cycle: `MAISOGLABS-WEB-INC-002-READ-DASHBOARD`
Reviewed proposal: `ML-DEVOS-RFC-004`
RFC commit: `359710161d44e18408211fc890fa1e211b2cd6e9`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Verified product baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`

Accepted dependencies:
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-014: ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-ADR-003: ACCEPTED`

## Classification

`ARCHITECTURE`

This is the correct concrete classification.

Although the Build Plan originally identified `CAPABILITY` as the likely minimum class, the grounded proposal creates the first authenticated HTTP composition across the WEB-INC-001 identity boundary and WEB-INC-005 D1 subsystem. It therefore establishes a new protected application/data boundary rather than merely enabling an already-defined tool.

The stronger path applies:

`RFC → Architect Sync → Paulo Decision → Implementation → ADR`.

No Sentinel constitutional rule, core architecture, actor authority, or governance-capability version changes.

## Repository-grounded compatibility review

### Authentication prerequisite

Current `worker/auth.mjs` already:

- recognizes `/admin` and `/admin/*` as protected;
- validates required auth configuration before JWKS lookup;
- validates the Cloudflare Access JWT assertion server-side;
- fails closed before serving the admin asset.

WEB-INC-002 can preserve that boundary while adding a post-authenticated route dispatcher.

### D1 prerequisite

Current `worker/d1/repository.mjs` already provides server-side D1 reads and is not imported by browser/public application code.

Current `wrangler.jsonc` exposes `DB` as local-only with `remote: false` and no real `database_id`.

WEB-INC-002 can therefore add a bounded protected read route without altering the accepted schema or creating a remote database.

### Public-site prerequisite

The actual public source remains:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`.

The RFC preserves that path and does not introduce a public D1 read.

### Dependency order

The verified Product Build Pack sequence is:

`WEB-INC-001 → WEB-INC-005 → WEB-INC-002 → WEB-INC-008 → WEB-INC-003 → WEB-INC-004 → WEB-INC-006 → WEB-INC-007`.

WEB-INC-001 and WEB-INC-005 are closed, so WEB-INC-002 is the correct next product increment.

## Binding Architect findings / constraints

### AS15-F001 — PASS — exact endpoint scope is appropriately narrow

The only authorized editorial data endpoint is:

`GET /admin/api/dashboard`.

No generic `/admin/api/*` data service is authorized.

Authenticated unknown `/admin/api/*` paths must return `404` and must not fall through to static asset handling.

### AS15-F002 — REQUIRED — authentication must dominate all protected routing

The implementation must preserve one security ordering:

`VALIDATE AUTH CONFIG → VERIFY ACCESS ASSERTION → ROUTE/METHOD DISPATCH → D1 READ`.

No dashboard route classification, DB-dependent behavior, or D1 call may leak information before authentication succeeds.

In particular:

- unauthenticated requests must not reveal whether DB is configured;
- unsupported methods from unauthenticated callers must still fail at authentication first;
- unknown `/admin/api/*` routes from unauthenticated callers must still fail at authentication first.

Tests must prove the dashboard handler/DB is never invoked in the existing WEB-INC-001 negative cases.

### AS15-F003 — REQUIRED — post-auth dispatch must not weaken WEB-INC-001

If `worker/auth.mjs` is refactored to permit a post-auth callback/router, the default protected-asset behavior must remain equivalent for `/admin` and ordinary protected static paths.

The Builder must preserve:

- config fail-closed behavior;
- token fail-closed behavior;
- JWKS lookup only after config validation;
- ordinary public asset-first behavior;
- alternate admin URL canonicalization/non-bypass behavior.

Existing WEB-INC-001 regression tests remain mandatory.

### AS15-F004 — REQUIRED — dashboard response is an allowlisted projection, not a redacted raw row

The dashboard serializer must construct the response from an explicit allowlist.

It is not sufficient to:

- fetch a raw revision row/object;
- delete a few known-sensitive fields;
- return the remainder.

The implementation must positively construct only the RFC-approved fields.

This is required because future schema additions must not become visible automatically.

### AS15-F005 — REQUIRED — no identity claims in the response or browser state

The verified Access payload may be used only to prove the request passed the authentication boundary.

WEB-INC-002 must not:

- return JWT claims in JSON;
- render email/name/subject claims into the dashboard;
- store JWT claims in localStorage/sessionStorage;
- create application session state.

Identity display/persistence is outside this increment.

### AS15-F006 — REQUIRED — D1 reader must remain read-only by construction

The dashboard read module must expose fixed read functions only.

No mutation-capable DB object/helper should be intentionally surfaced to the browser layer or serialized into a generic service abstraction.

Implementation review will reject:

- `INSERT`, `UPDATE`, `DELETE`, `REPLACE`, schema DDL, or migration execution in the dashboard path;
- arbitrary SQL provided by callers;
- arbitrary table/column selection from request input.

Builder tests must show mutation methods return 405 before any dashboard D1 handler is invoked.

### AS15-F007 — REQUIRED — missing DB and DB failure remain post-auth generic failures

After valid authentication only:

- missing/unavailable `env.DB` → generic `503`;
- query/projection failure → generic `500`.

No response may contain:

- binding names beyond the public contract;
- SQL text;
- raw exception messages;
- stack traces;
- database schema details.

Tests should use deliberately sensitive fake error text and prove it is absent from the response.

### AS15-F008 — REQUIRED — protected cache policy applies to every protected response

For `/admin` and `/admin/*`, including:

- 200 admin HTML/static protected asset responses;
- 200 dashboard JSON;
- 401;
- 404;
- 405;
- 500;
- 503;

the Worker should enforce:

`Cache-Control: no-store`.

Dashboard JSON additionally requires:

- explicit JSON content type;
- `X-Content-Type-Options: nosniff`.

No permissive CORS header may be added.

This must be enforced at the Worker boundary rather than relying only on static page metadata.

### AS15-F009 — REQUIRED — UI must be data-read-only, not merely visually read-only

The UI must not contain hidden or disabled mutation controls that imply later capability.

No:

- create/edit/delete;
- save;
- publish/unpublish;
- upload;
- theme/design mutation;
- journal mutation;
- audit-action controls.

A client component may fetch/read the protected endpoint and render status only.

The client bundle must not import `worker/d1/*`, server repository modules, SQL, or D1 bindings.

### AS15-F010 — REQUIRED — dashboard lifecycle semantics must match ADR-003 exactly

Derived state is:

- published pointer only → `published`;
- draft pointer only → `draft`;
- both pointers → `published_with_draft`;
- neither pointer → `archived`.

Do not invent a stored status field.

For display-label precedence:

`draft label → published label → stable entity ID`.

For archived entities with neither pointer, returning the stable ID as the label is acceptable; do not silently query an arbitrary historical revision merely to populate a friendlier label unless separately specified.

### AS15-F011 — REQUIRED — site_settings remains a single dashboard entity

The dashboard must not explode `site_settings` into independent entities for hero/about/contact/SEO/etc.

Those are revision fields of the one site-settings entity in WEB-INC-005.

Return one bounded site-settings dashboard record.

### AS15-F012 — REQUIRED — local-only execution must remain structurally obvious

No Builder action may:

- create remote D1;
- add a real `database_id`;
- switch `remote` to true;
- run a remote D1 query/migration;
- alter production Access resources;
- deploy.

If local dashboard smoke testing requires seeded D1, use only the already-authorized local migration/seed mechanism.

### AS15-F013 — REQUIRED — no schema change is necessary for this increment

The accepted WEB-INC-005 schema is sufficient.

`migrations/0001_web_inc_005_init.sql` and the 14-table ownership model should remain unchanged.

If the Builder believes a schema change is required, stop and return to Architect rather than silently expanding WEB-INC-002.

### AS15-F014 — REQUIRED — public application boundary remains untouched

`app/page.js`, `data/site.js`, and the public content loader/projection must not switch to D1.

Ordinary public requests remain asset-first.

Any proposal to make the public site use D1 is a separate future architecture decision.

### AS15-F015 — REQUIRED EVIDENCE

Builder handoff must include:

1. exact base/result commit and exact changed-file list;
2. route inventory introduced/modified;
3. explicit dashboard JSON schema/example with only allowed keys;
4. proof all WEB-INC-001 auth/config negative cases still pass;
5. proof invalid auth causes zero dashboard/DB invocation;
6. proof authenticated GET reads seeded local D1 and returns the bounded projection;
7. lifecycle fixture coverage for all four pointer states;
8. explicit allowlist serializer leakage tests;
9. all non-GET methods rejected with zero D1 invocation;
10. authenticated unknown API path protected 404;
11. generic 503 missing-DB behavior;
12. generic 500 D1-error behavior with sensitive fake error text absent;
13. `no-store` coverage across protected success/error responses;
14. JSON `nosniff` coverage;
15. no permissive CORS;
16. no mutation controls in admin UI;
17. no client imports of server/D1 modules;
18. no SQL write statements reachable from the dashboard path;
19. existing content/auth/D1 suites;
20. full `npm test`;
21. successful `npm run build`;
22. local-only Wrangler smoke evidence;
23. Wrangler validation/dry-run without remote mutation;
24. secret/config scan;
25. explicit confirmation no remote resource, deploy, public cutover, or later WEB-INC work occurred.

Builder execution evidence remains `ACTOR_REPORTED` until independently reviewed.

## Expected Builder scope

Expected changed surfaces may include:

- `worker/auth.mjs` narrowly;
- `worker/index.mjs`;
- `worker/admin/dashboard.mjs` or an equivalent bounded module;
- `worker/d1/repository.mjs` narrowly if needed;
- `app/admin/page.js`;
- one bounded admin client component if needed;
- focused tests;
- current-state docs/traceability required to record the implementation;
- Builder handoff/state.

No new dependency is preferred.

## Explicitly out of scope

No:

- D1/schema mutation;
- mutation endpoint;
- create/edit/save/delete;
- publish/unpublish;
- generic admin API;
- audit substrate;
- media/R2;
- journal;
- theme/design controls;
- application sessions;
- admin/user tables;
- role/permission tables;
- raw content/draft export;
- arbitrary SQL;
- public D1 cutover;
- remote D1;
- production Access configuration;
- deployment;
- main merge;
- later WEB-INC;
- Sentinel S3 or later;
- CI/workflows/rulesets;
- project onboarding/product `.devos/`.

## Security / architecture verdict

Compatible with Sentinel and the accepted product architecture subject to the binding constraints above.

The change introduces a deliberately narrow new capability:

`SERVER-VERIFIED ADMIN IDENTITY → BOUNDED READ-ONLY D1 STATUS VIEW`.

It does not create write authority.

Critical invariant:

`AUTHENTICATED ≠ AUTHORIZED TO MUTATE`.

## Verdict

`ML-DEVOS-AS-015: ARCHITECT_APPROVED — WEB-INC-002 RFC-004 COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`

Paulo's explicit instruction `Proceed with WEB-INC-002 authorization.` supplies the Product/Risk Owner approval to advance this exact increment through the required architecture authorization chain.

The implementation decision must bind Claude to `ML-DEVOS-RFC-004` plus this sync and preserve all remote/deploy/write gates.

## Authority gates

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

`MUTATION_AUTHORIZED: NO`

## Next review rule

After Builder handoff, Architect must pull live branch/state and compare the exact Builder diff against:

- `ML-DEVOS-RFC-004`;
- this `ML-DEVOS-AS-015`;
- the WEB-INC-002 implementation decision;
- WEB-INC-001 accepted auth behavior;
- `ML-DEVOS-ADR-003`;
- current Product Build Pack requirements.

Architect must independently inspect auth ordering, route dispatch, dashboard projection/serializer, D1 query shape, UI/client imports, cache/error behavior, and scope before issuing PASS / CHANGES_REQUESTED.

```
