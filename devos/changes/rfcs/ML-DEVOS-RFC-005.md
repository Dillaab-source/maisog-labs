# ML-DEVOS-RFC-005: MaisogLabs WEB-INC-008 Append-Only Audit Substrate

Status: `ACCEPTED`

Proposed change class: `ARCHITECTURE`

Product increment: `WEB-INC-008`

Repository-grounded base: `cd73e410dfb96e57fefdb71f18cbd9506e6b4562`

## Baselines

- Frozen Sentinel architecture: `ML-DEVOS-ARCH-001 / v1.2.0`
- Active Sentinel governance-capability baseline: `v1.4.0`
- Product Build Pack: `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`
- Authentication boundary: `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- Local D1 revision substrate: `ML-DEVOS-AS-014: ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- Read-only dashboard boundary: `ML-DEVOS-AS-016: ARCHITECT_APPROVED — WEB-INC-002 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- Adopted product architecture: `ML-DEVOS-ADR-003`, `ML-DEVOS-ADR-004`

## Problem

MaisogLabs now has an authenticated read-only admin boundary and a local D1 revision substrate, but no audit storage exists.

The verified Product Build Pack intentionally places `WEB-INC-008` before the first editorial mutation increment so that write capabilities do not arrive before an append-only audit substrate is available.

Current repository truth:

- there is no `audit_log` table;
- the accepted WEB-INC-005 schema contains exactly 14 product tables;
- the protected admin route is read-only;
- there is no create/edit/publish/unpublish/delete/upload endpoint;
- there is no application session, role table, persistent admin identity table, or editorial identity binding;
- remote/production D1 does not exist and is not authorized.

Without a separately governed audit substrate, later mutation work would either have to invent audit semantics inside the mutation increment or temporarily introduce write behavior without an already-reviewed audit boundary.

## Motivation

The Product Build Pack requires `WEB-INC-008` before `WEB-INC-003`.

Relevant requirements:

- `ADM-REQ-012` — important admin actions are auditable;
- `WEB-SEC-009` — important admin changes are recorded in audit history;
- `ADM-REQ-016` / `WEB-SEC-012` — failed writes never silently appear successful.

The goal of this increment is not to introduce a real admin mutation. It is to establish and independently prove the audit storage/write primitive that later mutation increments must call.

## Classification

`ARCHITECTURE`.

The Product Build Plan listed `CAPABILITY` as the likely minimum classification. The concrete grounded change is elevated to `ARCHITECTURE` because it would:

1. expand the accepted WEB-INC-005 product schema from exactly 14 tables to 15;
2. introduce the first persistent application-side D1 write path after WEB-INC-005's migration tooling;
3. establish the append-only data model and failure semantics every later mutation capability depends on;
4. introduce a new durable trust boundary: trusted server code may append audit history but may never edit/delete it;
5. evolve the accepted storage architecture recorded by `ML-DEVOS-ADR-003`.

The stronger route applies:

`RFC → Architect Sync → Paulo Decision → Implementation → post-review ADR`.

This is MaisogLabs product architecture only. It does not change Sentinel core architecture or the active Sentinel governance-capability version.

## Proposed architecture

### 1. One new product table only

Add exactly one new product table:

`audit_log`

The accepted product-table inventory after this increment becomes exactly 15:

- the existing 14 WEB-INC-005 tables, unchanged;
- `audit_log`.

No media, journal, theme, identity/session, role/permission, deployment, or other future table is authorized.

The existing migration `migrations/0001_web_inc_005_init.sql` remains immutable historical implementation evidence.

WEB-INC-008 must use a new ordered migration, expected:

`migrations/0002_web_inc_008_audit_log.sql`

or an equivalent separately versioned migration file. Do not rewrite `0001`.

### 2. Audit row model

`audit_log` is append-only event history, not editorial content. It has no revision pair and no published/draft pointers.

Required logical fields:

- `id` — database-assigned immutable audit event ID;
- `occurred_at` — server-generated event timestamp;
- `actor` — opaque trusted-server identity reference;
- `action` — validated action name;
- `entity_type` — validated logical entity type;
- `entity_id` — logical stable entity reference;
- `revision_id` — nullable revision reference when the event is revision-scoped;
- `result` — exactly `success` or `failure`.

The audit row must not contain:

- JWTs or Access assertion tokens;
- passwords, secrets, credentials;
- raw request bodies;
- full content snapshots;
- arbitrary stack traces / SQL errors;
- unrestricted client-supplied metadata blobs.

### 3. Identity boundary

WEB-INC-008 does **not** create a persistent identity/session subsystem.

`actor` is an opaque server-supplied reference only.

This increment does not decide or implement the future editorial identity-binding mechanism. A later mutation increment must separately prove that its `actor` value is derived from an authorized verified identity boundary.

Tests may use deterministic non-secret fixture actor references.

No Access/JWT claim is exposed to browser code or persisted merely to satisfy this substrate test.

### 4. Append-only invariant

Audit history is immutable after insertion.

The implementation must enforce append-only behavior at both levels:

- application API: expose append only; no update/delete helper;
- database: direct `UPDATE audit_log ...` and `DELETE FROM audit_log ...` must be rejected, preferably through migration-defined SQLite/D1 triggers or an equivalently strong database-level control.

No admin/user-facing edit or delete route for audit history may exist.

### 5. Bounded audit writer

Trusted server code may receive one narrow internal primitive, conceptually:

`appendAuditEvent(db, event)`

The writer must:

- validate the complete event before insertion;
- construct a fixed INSERT itself;
- accept no caller-provided SQL, table name, column name, or arbitrary storage object;
- generate/own the event timestamp rather than trusting a browser timestamp;
- reject malformed `actor`, `action`, `entity_type`, `entity_id`, `revision_id`, or `result`;
- propagate storage failure to the caller.

There is no HTTP audit-write endpoint in this increment.

There is no browser/client import of the audit writer or D1 binding.

### 6. Failure semantics — precise, non-recursive rule

The Product Build Pack states that a failed write must be recorded as `result: failure`.

For WEB-INC-008 that means:

- a simulated failed **future business/admin operation** can be represented by calling the internal audit writer with `result: "failure"`;
- that call must persist a failure audit event and must never turn it into `success`.

It does **not** mean an audit append failure must recursively audit its own failed audit append. That is impossible without an infinite/failing recursion.

The audit writer's own failure rule is instead fail-closed:

- if the audit INSERT fails, the writer rejects/throws;
- callers must not receive a success result from the audit writer;
- a later mutation increment must define whether the business mutation and audit append are one transaction / batch or what compensating control is required.

WEB-INC-008 does not authorize or implement that future mutation/audit transaction.

### 7. Logical references, not cascading foreign ownership

`audit_log` references entities outward logically.

No existing entity table gets a foreign key into `audit_log`.

Deleting or changing an entity in a future authorized increment must never cascade-delete or rewrite prior audit history.

Because future audited entity types are not all created yet, this increment must not create future product tables solely to satisfy audit foreign keys.

### 8. No audit exposure in WEB-INC-002

WEB-INC-002 remains exactly read-only status scope.

Do not:

- add `audit_log` to `GET /admin/api/dashboard`;
- create `GET /admin/api/audit`;
- create any new admin API route;
- expose actor/action/history to the current dashboard.

Audit read UI/API is a separate future capability unless explicitly authorized.

### 9. Local-only execution

All implementation/evidence work remains repository/local only.

Allowed after Paulo authorization:

- local D1 migration apply;
- local audit table/write tests;
- local Wrangler simulation;
- local direct D1 assertions in tests.

Not authorized:

- `wrangler d1 create`;
- real `database_id`;
- `remote: true`;
- remote D1 query/migration/import/export;
- production Access changes;
- deployment;
- public D1 cutover.

## Scope

Authorized implementation, if Paulo later approves this RFC, may include only what is reasonably necessary for WEB-INC-008:

- one new ordered D1 migration for `audit_log` and append-only controls;
- a bounded server-only audit writer/validator;
- local-only schema/test helpers required to apply WEB-INC-005 + WEB-INC-008 state;
- focused audit tests;
- narrow updates to current-state governance/product/test documentation;
- Builder handoff/state.

Historical WEB-INC-005 behavior and tests must remain truthful. A new current-schema inventory test may assert 15 tables without rewriting history to pretend WEB-INC-005 originally owned 15.

## Non-goals

This RFC does not authorize:

- project/content mutation;
- create/edit/save/delete;
- publish/unpublish;
- media/R2;
- journal;
- theme/design mutation;
- application sessions;
- admin/user tables;
- roles/permissions;
- identity persistence;
- an audit read API/UI;
- a generic admin API;
- public D1 reads;
- public D1 cutover;
- remote/production D1;
- production Cloudflare Access mutation;
- deployment;
- protected/main merge;
- WEB-INC-003 or any later WEB-INC;
- Sentinel S3+;
- CI/workflows/rulesets.

## Affected components

Expected implementation surfaces may include:

- new `migrations/0002_web_inc_008_audit_log.sql`;
- a narrow `worker/d1/audit.mjs` / `worker/d1/audit-validate.mjs` or equivalent;
- narrow schema/test helper changes where required;
- focused tests such as `tests/d1-audit.test.mjs`;
- current-state documentation/handoff/state.

Expected unchanged surfaces:

- `migrations/0001_web_inc_005_init.sql`;
- `worker/auth.mjs` except if a test-only import-free regression check requires no code change;
- `worker/admin/dashboard.mjs`;
- `app/admin/*`;
- `app/page.js`;
- `data/site.js`;
- public content loaders/projections;
- `wrangler.jsonc` remote/local authority shape;
- package dependencies unless independently justified and separately reviewed.

## Affected rules

No Sentinel constitutional/core rule is modified or weakened.

Relevant existing principles remain binding:

- `CAPABILITY != AUTHORITY`;
- no actor invents authorization;
- Builder cannot self-approve;
- evidence provenance must be explicit;
- remote/deploy/main-merge gates remain human-authorized.

## Alternatives considered

### Treat WEB-INC-008 as CAPABILITY only

Not selected.

That was the Build Plan's likely minimum classification, but the grounded implementation changes persistent storage architecture and establishes the first persistent application-side D1 write boundary. The stronger `ARCHITECTURE` path is appropriate.

### Add audit behavior inside WEB-INC-003

Rejected.

That would collapse audit substrate design and real mutation integration into one larger change and would violate the dependency order the Product Build Pack intentionally established.

### Keep audit history in ordinary logs only

Rejected.

Process/runtime logs are not a durable product-level audit history with the required entity/action/result semantics.

### Make audit rows editable/deletable by admins

Rejected.

That defeats audit integrity.

### Add an audit API/UI now

Rejected.

WEB-INC-008 is storage/write substrate only. Read/display capability is not needed to prove the substrate and would widen scope.

### Store complete content/request snapshots in audit_log

Rejected.

That creates unnecessary confidentiality and retention risk and violates the bounded metadata-only audit purpose.

## Risks and controls

### Audit tampering

Control: database-level update/delete rejection plus no application mutation helper for audit rows.

### Audit omission

Control: later mutation work may not claim completion until it proves every introduced mutation emits audit history. WEB-INC-008 proves only the append primitive and failure-result representation.

### Audit append failure misreported as success

Control: audit writer rejects/throws on INSERT failure. Tests must force a storage failure and prove no success result is returned.

### Sensitive identity/content leakage

Control: actor is an opaque reference; no token/claim/raw-body/content snapshot fields; no HTTP audit read endpoint.

### Schema-scope creep

Control: exactly one new product table; existing 14 WEB-INC-005 tables remain unchanged; no future-only table creation.

### Public/admin read regression

Control: existing WEB-INC-001/002 tests remain mandatory; current dashboard response shape must remain unchanged.

## Migration impact

The local product schema evolves from exactly 14 WEB-INC-005 tables to exactly 15 current product tables.

This is additive only.

No existing table is dropped, recreated, renamed, or structurally modified by this increment unless the Builder stops and returns for a new Architect decision.

The migration must be repeat-safe under the repository's local migration mechanism.

## Security / trust impact

This introduces a new persistent write capability, but only for append-only audit history.

Critical boundary:

`AUDIT APPEND CAPABILITY ≠ EDITORIAL MUTATION AUTHORITY`

Even after a future Paulo authorization for WEB-INC-008:

- `MUTATION_AUTHORIZED` for editorial/content mutation remains `NO`;
- remote D1 remains `NO`;
- deployment remains `NO`;
- main merge remains `NO`.

The coordination state should use a distinct audit-write gate if needed, e.g. `AUDIT_APPEND_AUTHORIZED`, rather than overloading editorial mutation authority.

## Evidence requirements

Builder handoff must provide at minimum:

1. exact base/result commit and exact changed-file list;
2. exact migration file inventory and proof `0001` is unchanged;
3. exact current product-table inventory: existing 14 + `audit_log` only;
4. exact `audit_log` schema and constraints;
5. successful append of a valid `success` event;
6. successful append of a valid `failure` event;
7. malformed-event rejection coverage;
8. database-level direct UPDATE rejection;
9. database-level direct DELETE rejection;
10. audit-writer INSERT/storage failure propagates and cannot report success;
11. proof no audit read/write HTTP endpoint was introduced;
12. proof WEB-INC-002 dashboard response remains unchanged and contains no audit history;
13. proof no JWT/token/raw sensitive payload is stored by the audit writer;
14. existing WEB-INC-001 auth regression suite;
15. existing WEB-INC-005 D1 migration/parity/integrity suite;
16. existing WEB-INC-002 dashboard suite;
17. full `npm test`;
18. successful `npm run build`;
19. local-only Wrangler/D1 migration evidence;
20. Wrangler config/bundle validation without remote mutation;
21. secret/config scan;
22. explicit confirmation no remote D1, deployment, public cutover, content mutation, later WEB-INC, or main merge occurred.

Builder runtime/test results remain `ACTOR_REPORTED` until independently reproduced. Exact committed code/diff can be `INDEPENDENTLY_INSPECTED`.

## Rollout

If Paulo later authorizes implementation:

1. Builder pulls the exact authorized governance HEAD.
2. Builder implements only this bounded local/repository audit substrate.
3. Builder runs required evidence.
4. Builder writes handoff and returns control to Architect.
5. Architect independently reviews exact diff and evidence.
6. Because this is `ARCHITECTURE`, accepted implementation is followed by a post-review ADR.
7. WEB-INC-003 remains separately gated.

## Rollback

Before any public/remote deployment exists, rollback is repository-local:

- revert the WEB-INC-008 implementation commit(s);
- discard/recreate local D1 test state as needed;
- do not rewrite WEB-INC-005 migration history.

No production rollback procedure is claimed because production deployment is not authorized.

## Compatibility

Compatible with:

- WEB-INC-001 fail-closed Access authentication;
- WEB-INC-005 local D1 revision substrate;
- WEB-INC-002 protected read-only dashboard;
- ADR-003 / ADR-004;
- Product Build Pack dependency order.

Not compatible with silently adding editorial mutation, remote D1, or audit UI/API under this authorization.

## Version impact

No Sentinel version bump.

This is product architecture under the active Sentinel `v1.4.0` governance-capability baseline.

## Architect Sync requirement

Required.

## Paulo decision requirement

Required.

No implementation authority exists until Paulo explicitly authorizes this exact bounded WEB-INC-008 architecture after Architect review.
