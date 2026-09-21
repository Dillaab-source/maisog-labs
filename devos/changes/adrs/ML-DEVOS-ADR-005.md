# ADR-005: Adopt the WEB-INC-008 append-only audit substrate

Status: `ACCEPTED`

Related RFC:
- `ML-DEVOS-RFC-005`

Architect Syncs:
- `ML-DEVOS-AS-017` — proposal architecture compatibility
- `ML-DEVOS-AS-018` — implementation review / remediation request
- `ML-DEVOS-AS-019` — final implementation/remediation acceptance

Paulo decision:
- `D-026`

Implementation evidence:
- `d4791b945d2853067d51f20fca11db3846a1cf1e` — original WEB-INC-008 implementation
- `7fa8cf62b8238f4874e842752838fbd0920498b3` — bounded repeat-safety remediation
- `ML-DEVOS-AS-019` final verdict — `ARCHITECT_APPROVED`

Effective version:
- Sentinel governance-capability baseline remains `v1.4.0`
- frozen Sentinel architecture remains `ML-DEVOS-ARCH-001 / v1.2.0`
- no Sentinel version bump

## Decision

MaisogLabs adopts the WEB-INC-008 **append-only audit substrate** as accepted product architecture.

The accepted composition is:

```
trusted server code
        ↓
validate bounded audit event
        ↓
appendAuditEvent(db, event)
        ↓
fixed parameterized INSERT
        ↓
audit_log
        ↓
immutable local audit history
```

The accepted current local product schema is:

`14 existing WEB-INC-005 product tables + audit_log = 15 product tables`

WEB-INC-008 adds exactly one new product table:

`audit_log`

through a separate ordered migration:

`migrations/0002_web_inc_008_audit_log.sql`

The historical WEB-INC-005 migration remains unchanged:

`migrations/0001_web_inc_005_init.sql`

## Binding invariants

`AUDIT APPEND CAPABILITY ≠ EDITORIAL MUTATION AUTHORITY`

`LOCAL D1 EXISTS ≠ REMOTE D1 EXISTS`

`LOCAL D1 EXISTS ≠ D1 IS PUBLIC SOURCE`

`AUDIT SUBSTRATE EXISTS ≠ AUDIT HTTP API/UI EXISTS`

`AUDIT SUBSTRATE EXISTS ≠ WEB-INC-003 IS AUTHORIZED`

## Accepted audit model

Each audit row is bounded to:

- immutable database-assigned `id`;
- server-owned `occurred_at`;
- opaque trusted-server `actor`;
- validated `action`;
- validated `entity_type`;
- logical `entity_id`;
- nullable logical `revision_id`;
- `result` exactly `success` or `failure`.

The accepted architecture does not persist:

- JWTs;
- Cloudflare Access assertion tokens;
- passwords/credentials/secrets;
- raw request bodies;
- full content snapshots;
- stack traces;
- SQL error strings;
- arbitrary metadata blobs.

## Append-only enforcement

Audit history is immutable after insertion.

Application-level enforcement:
- the audit module exposes append behavior only;
- no audit UPDATE or DELETE helper exists;
- the writer accepts no caller-provided SQL/table/column selector.

Database-level enforcement:
- `audit_log_reject_update` rejects direct UPDATE;
- `audit_log_reject_delete` rejects direct DELETE.

The append-only guarantee therefore does not rely only on application convention.

## Failure semantics

A business/admin operation may later be represented with:

`result: failure`

The substrate preserves that result exactly.

If the audit INSERT itself fails:
- the append primitive rejects/throws;
- no success result is returned;
- no recursive attempt is made to audit the audit failure.

Future atomicity/compensation between a real business mutation and its corresponding audit append is not decided by this ADR. That belongs to the separately authorized mutation increment that integrates with this substrate.

## Identity boundary

The `actor` field is an opaque trusted-server reference only.

WEB-INC-008 does not create:
- application session persistence;
- admin/user tables;
- role/permission tables;
- browser identity storage;
- a final editorial identity-binding design.

A future mutation increment must independently prove how a real authorized identity becomes the audit actor reference.

## Read / UI boundary

WEB-INC-008 does not create:
- an audit HTTP write endpoint;
- an audit read endpoint;
- an audit UI;
- any additional admin API route.

The accepted WEB-INC-002 endpoint remains unchanged:

`GET /admin/api/dashboard`

and does not expose audit history.

## Public-source boundary

The public site remains on:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

WEB-INC-008 does not make D1 the public content source.

## Migration repeat-safety

The final accepted implementation includes evidence that:
- `applyCurrentSchema(db)` may be applied repeatedly against the same local DB;
- the same 15 product tables remain;
- both audit append-only triggers remain;
- existing audit data remains unchanged;
- direct audit UPDATE/DELETE remain rejected after reapplication.

Builder also reported that the second:

`npx wrangler d1 migrations apply DB --local`

against the same local database returned:

`No migrations to apply!`

That runtime evidence remains actor-reported, while the committed repeat-safety regression source was independently inspected by the Architect.

## Alternatives considered

### Add audit history only when WEB-INC-003 begins

Rejected.

The Product Build Pack intentionally orders the audit substrate before the first real editorial mutation so that mutation work integrates into an already-reviewed audit boundary.

### Use ordinary runtime/process logs

Rejected.

Operational logs are not a durable product-level audit history with explicit actor/action/entity/result semantics.

### Allow audit rows to be edited or deleted

Rejected.

Editable audit history would defeat the integrity property the substrate exists to provide.

### Add audit UI/API in the same increment

Rejected.

That would unnecessarily widen scope and browser/server exposure. WEB-INC-008 is storage/write substrate only.

### Store full request/content snapshots

Rejected.

That would create unnecessary confidentiality, retention, and leakage risk.

### Treat the change as CAPABILITY only

Rejected after grounding.

The increment expands persistent product schema and introduces the first persistent application-side D1 write primitive, so `ARCHITECTURE` was the appropriate stronger classification.

## Consequences

### Enabled

- MaisogLabs has a bounded append-only local audit-history primitive.
- Future authorized mutation increments can call an already-reviewed audit writer.
- Both success and failure business events can be represented.
- Audit data survives future logical entity changes because references are non-owning/logical.
- Current local schema contains 15 product tables.

### Still unavailable / unauthorized

- project/content create/edit/save/delete;
- publish/unpublish;
- WEB-INC-003;
- persistent identity/session/role subsystem;
- audit read UI/API;
- media/R2;
- journal;
- theme/design mutation;
- remote/production D1;
- public D1 cutover;
- production Cloudflare Access changes;
- deployment;
- protected/main merge;
- Sentinel S3+.

## Evidence provenance

Independently inspected by Architect:
- exact implementation and remediation diffs;
- migration DDL;
- append-only triggers;
- audit validator/writer;
- schema helper separation;
- focused audit tests;
- repeat-safety regression;
- absence of HTTP/client/public mutation exposure;
- no schema/writer redesign during remediation.

Retained as Builder `ACTOR_REPORTED`:
- original `npm test`: 112/112;
- remediation focused suite: 17/17;
- remediation full `npm test`: 113/113;
- successful `npm run build`;
- local Wrangler migrations;
- second migration application returning no pending migrations;
- direct local D1 trigger/data probes;
- Wrangler dry-run;
- secret/config scan.

No independent runtime reproduction of Claude's local Wrangler/npm environment is claimed.

## Related records

- `ML-DEVOS-RFC-005 — WEB-INC-008 Append-Only Audit Substrate`
- `ML-DEVOS-AS-017 — proposal architecture sync`
- `D-026 — authorize WEB-INC-008 implementation`
- `ML-DEVOS-AS-018 — bounded repeat-safety remediation request`
- `ML-DEVOS-AS-019 — final implementation/remediation approval`
- `ML-DEVOS-ADR-003 — local D1 revision substrate`
- `ML-DEVOS-ADR-004 — authenticated read-only admin dashboard boundary`

## Effective version

No Sentinel version bump.

This ADR records MaisogLabs product architecture only.

The active Sentinel governance-capability baseline remains `v1.4.0`.

The frozen Sentinel architecture remains `ML-DEVOS-ARCH-001 / v1.2.0`.

## Supersedes / superseded by

Supersedes: none.

This ADR extends ADR-003 by adding one accepted append-only audit table/write primitive to the local D1 architecture. It does not supersede ADR-003 or ADR-004.

Superseded by: none as of acceptance.
