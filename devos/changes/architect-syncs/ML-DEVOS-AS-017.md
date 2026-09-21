# ML-DEVOS-AS-017 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `106fab3885eff3a35b46f9a7648e66bb4d0f89ad`
- file blob: `96860bb5350d867850551100358f17c1755a3d1f`

Archive method:
- The fenced block below reproduces the concluding `coordination/ARCHITECT_REVIEW.md` snapshot from the cited commit byte-for-byte.
- Explanatory metadata is outside the fenced block.
- This durable archive is created after Paulo authorization D-026; the archived verdict itself remains the Architect's pre-authorization compatibility judgment.

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION REQUIRED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-017 — WEB-INC-008 Append-Only Audit Substrate Architecture Sync

Cycle: `MAISOGLABS-WEB-INC-008-AUDIT-SUBSTRATE`  
Reviewed proposal: `ML-DEVOS-RFC-005`  
RFC proposal commit: `9b1e6d721ad82bdcac3b165ebaca10f36f8cfbf9`  
Grounded pre-proposal repository HEAD: `cd73e410dfb96e57fefdb71f18cbd9506e6b4562`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Verified product baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`

Accepted dependencies:
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-014: ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-016: ARCHITECT_APPROVED — WEB-INC-002 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`
- `ML-DEVOS-ADR-003: ACCEPTED`
- `ML-DEVOS-ADR-004: ACCEPTED`

## Architect grounding performed

Before issuing this proposal verdict, the Architect live-checked the authoritative GitHub branch and independently inspected:

- current `coordination/STATE.md`;
- current `coordination/ARCHITECT_REVIEW.md`;
- current `coordination/IMPLEMENTER_HANDOFF.md`;
- Product Build Pack `WEB-INC-008` scope/dependency order;
- active Sentinel Change Governance Policy;
- Sentinel Capability-Change Specification;
- current D1 schema loader and migration arrangement;
- current WEB-INC-005 14-table inventory test;
- current `DATA_BACKEND_SPEC.md` `audit_log` target model;
- `ADM-REQ-012`, `ADM-REQ-016`, `WEB-SEC-009`, `WEB-SEC-012`;
- current risk/test ledgers;
- accepted WEB-INC-002 closure state.

Current repository truth is:

- WEB-INC-002 is closed;
- current product schema is exactly the 14 WEB-INC-005-owned tables;
- no `audit_log` exists;
- no editorial mutation endpoint exists;
- no persistent application identity/session model exists;
- the current protected admin API remains read-only;
- remote/production D1 is absent and unauthorized.

## Classification

`ARCHITECTURE`

### AS17-F001 — PASS / BINDING — stronger class than Build Plan's tentative CAPABILITY

The Build Plan recorded `CAPABILITY` as the likely minimum class.

The grounded proposal correctly elevates WEB-INC-008 to `ARCHITECTURE` because it would:

- expand the accepted product schema from 14 to 15 tables;
- establish the first persistent application-side D1 write primitive;
- define immutable audit-history semantics later mutations depend on;
- create a new persistent trust boundary: server code may append but may not alter/delete history;
- evolve the storage architecture recorded by ADR-003.

Required lifecycle:

`RFC → Architect Sync → Paulo Decision → Implementation → post-review ADR`

No Sentinel core rule or governance-capability version changes.

## Binding Architect findings / constraints

### AS17-F002 — REQUIRED — exactly one new product table

If Paulo authorizes implementation, WEB-INC-008 may add exactly:

`audit_log`

The resulting current local product-table inventory must be exactly:

`14 existing WEB-INC-005 tables + audit_log = 15`

No media, journal, theme, identity/session, role/permission, or other future table may be created.

### AS17-F003 — REQUIRED — never rewrite WEB-INC-005 migration history

`migrations/0001_web_inc_005_init.sql` must remain unchanged.

WEB-INC-008 must use a new ordered migration, expected:

`migrations/0002_web_inc_008_audit_log.sql`

or an equivalent separately versioned migration artifact.

Historical WEB-INC-005 tests/evidence must remain truthful. A new current-schema test may assert 15 tables; do not rewrite history to claim WEB-INC-005 itself owned 15.

### AS17-F004 — REQUIRED — audit rows are metadata-only immutable events

The accepted logical audit row is bounded to:

- DB-assigned immutable `id`;
- server-owned `occurred_at`;
- opaque trusted-server `actor` reference;
- validated `action`;
- validated `entity_type`;
- `entity_id`;
- nullable `revision_id`;
- `result` exactly `success` or `failure`.

Do not store:

- JWTs or Access assertion tokens;
- credentials/secrets;
- full request bodies;
- complete content snapshots;
- raw stack traces;
- SQL error strings;
- unrestricted metadata blobs.

### AS17-F005 — REQUIRED — append-only at application AND database layers

It is not enough to simply omit update/delete methods.

Implementation must prove both:

1. the application/server API exposes append only;
2. direct database UPDATE and DELETE against `audit_log` are rejected by a database-level control such as triggers or an equivalently strong mechanism.

No audit edit/delete admin route exists in this increment.

### AS17-F006 — REQUIRED — bounded internal writer only

A narrow trusted-server primitive such as `appendAuditEvent(db, event)` is acceptable.

It must:

- validate the complete event;
- build fixed SQL internally;
- accept no arbitrary SQL/table/column input;
- generate/own `occurred_at`;
- reject malformed fields;
- propagate database failure.

No audit-write HTTP endpoint is authorized.

No browser/client code may import the audit writer, SQL, repository write modules, or D1 binding.

### AS17-F007 — REQUIRED — failure semantics are non-recursive and fail-closed

The phrase “a failed write must be logged as failure” applies to the future **business/admin operation being audited**.

WEB-INC-008 must prove that a test event with:

`result: failure`

is persisted as a failure event and is never transformed into success.

An audit INSERT failure is not required to recursively audit itself.

Instead:

- audit append failure must reject/throw;
- no success result may be returned;
- no hidden fallback may report success.

Future mutation/audit atomicity or compensation belongs to the separately authorized mutation increment.

### AS17-F008 — REQUIRED — no identity subsystem is smuggled into this increment

`actor` is an opaque trusted-server reference.

WEB-INC-008 does not authorize:

- application sessions;
- admin/user tables;
- role/permission tables;
- persistent Access/JWT claims;
- browser identity storage;
- a final editorial identity-binding design.

Tests may use deterministic non-secret fixture actor values.

A future mutation capability must separately prove how its actor reference is derived from an authorized identity boundary.

### AS17-F009 — REQUIRED — audit references never own or cascade product entities

No existing product table gets a foreign key into `audit_log`.

Audit history must survive future entity changes/deletion.

Do not create future tables merely to satisfy audit foreign keys.

Logical outward references are sufficient for this substrate.

### AS17-F010 — REQUIRED — WEB-INC-002 remains read-only and unchanged

WEB-INC-008 must not:

- add audit history to `GET /admin/api/dashboard`;
- create `GET /admin/api/audit`;
- create any new admin API route;
- add mutation controls to `/admin`;
- modify the existing authenticated read-only contract.

Tests must prove the dashboard response shape remains unchanged and contains no audit history.

### AS17-F011 — REQUIRED — audit append authority is distinct from editorial mutation authority

Critical invariant:

`AUDIT APPEND CAPABILITY ≠ EDITORIAL MUTATION AUTHORITY`

If Paulo later authorizes WEB-INC-008, coordination should distinguish the narrow audit-write permission from the existing editorial gate.

Recommended state vocabulary:

- `AUDIT_APPEND_AUTHORIZED: YES` only for the authorized WEB-INC-008 Builder cycle;
- `MUTATION_AUTHORIZED: NO` remains in force for editorial/content mutations.

No prior authorization carries forward to WEB-INC-003.

### AS17-F012 — REQUIRED — local-only boundary remains absolute

No Builder action under WEB-INC-008 may:

- create remote D1;
- add a real `database_id`;
- set `remote: true`;
- run remote D1 query/migration/import/export;
- mutate production Cloudflare Access;
- deploy;
- perform public D1 cutover;
- merge protected/main.

### AS17-F013 — REQUIRED — public source remains untouched

The public content path remains:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

WEB-INC-008 must not make audit state part of public rendering or make D1 the public content source.

### AS17-F014 — REQUIRED — no real admin mutation integration yet

Do not create a fake/project mutation merely to demonstrate auditing.

WEB-INC-008 proves the substrate in isolation.

WEB-INC-003 later owns proof that its real mutations emit audit rows, including failure events.

### AS17-F015 — REQUIRED — migration/helper changes must preserve provenance

Current Node tooling is WEB-INC-005-specific and applies `0001` only.

Builder may introduce narrow ordered-current-schema or WEB-INC-008-specific helpers, but must preserve:

- WEB-INC-005 historical 14-table evidence;
- current-schema 15-table evidence separately;
- local-only execution by construction.

Any proposal requiring destructive changes to existing schema helpers or rewriting prior migration semantics must stop and return to Architect.

### AS17-F016 — REQUIRED EVIDENCE

Builder handoff, if Paulo authorizes implementation, must provide at minimum:

1. exact authorized base SHA, result SHA, and changed-file list;
2. proof `0001_web_inc_005_init.sql` is byte-unchanged;
3. exact new migration inventory;
4. exact current product-table inventory: 15 and only 15;
5. exact audit schema/constraints;
6. valid `success` audit append;
7. valid `failure` audit append;
8. malformed-event rejection;
9. database-level UPDATE rejection;
10. database-level DELETE rejection;
11. forced audit INSERT failure propagates and cannot report success;
12. proof no audit HTTP endpoint exists;
13. proof WEB-INC-002 dashboard JSON remains unchanged / no audit data exposure;
14. proof no JWT/token/raw sensitive payload is stored;
15. existing WEB-INC-001 auth suite;
16. existing WEB-INC-005 D1 suite;
17. existing WEB-INC-002 dashboard suite;
18. full `npm test`;
19. successful `npm run build`;
20. local-only D1 migration/apply evidence;
21. Wrangler config/bundle validation with no remote mutation;
22. secret/config scan;
23. explicit confirmation no editorial mutation, remote D1, deploy, public cutover, later WEB-INC, or protected/main merge occurred.

Builder execution evidence remains `ACTOR_REPORTED` until independently reproduced.

### AS17-F017 — REQUIRED — post-implementation review and ADR

Because this change is `ARCHITECTURE`, Builder completion is not closure.

After Builder handoff:

- Architect must independently inspect the exact implementation diff;
- issue PASS / CHANGES_REQUESTED;
- if accepted, record the required post-review ADR;
- close the cycle;
- return authority to Paulo.

No automatic transition to WEB-INC-003 is allowed.

## Compatibility verdict

RFC-005 is architecturally compatible with:

- the frozen Sentinel architecture;
- active v1.4.0 governance capability baseline;
- ADR-003 local D1 substrate;
- ADR-004 authenticated read-only dashboard;
- the verified Product Build Pack dependency order;

subject to AS17-F001 through AS17-F017.

## Security / trust conclusion

The proposed trust boundary is appropriately narrow:

`TRUSTED SERVER CODE → VALIDATED APPEND-ONLY AUDIT WRITER → LOCAL D1 AUDIT HISTORY`

It does not authorize:

- editorial content mutation;
- remote resources;
- public D1 use;
- deployment;
- audit UI/API;
- identity/session persistence.

## Verdict

`ML-DEVOS-AS-017: ARCHITECT_APPROVED — WEB-INC-008 RFC-005 COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`

This verdict approves architecture compatibility only.

It does **not** authorize Claude to build.

## Authority gates

`AUDIT_APPEND_AUTHORIZED: NO`

`MUTATION_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Paulo gate

Paulo must explicitly decide whether to authorize Claude to implement the exact bounded WEB-INC-008 scope in RFC-005 subject to every binding AS17 finding.

Until that explicit decision exists:

- Builder action is prohibited;
- RFC-005 remains under the governance authorization chain;
- no audit migration/table/write code may be implemented.

## Current Architect Sync status

`ML-DEVOS-AS-017: ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION REQUIRED`
```
