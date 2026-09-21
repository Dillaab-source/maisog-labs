# ADR-004: Adopt the WEB-INC-002 authenticated read-only admin dashboard boundary

Status: `ACCEPTED`

Related RFC: `ML-DEVOS-RFC-004`  
Architect Sync: `ML-DEVOS-AS-015` (proposal compatibility) and `ML-DEVOS-AS-016` (implementation review)  
Paulo decision: `D-025`  
Implementation evidence:
- `fc962fd033df9b5409246e8052e547f4a08e0767` — WEB-INC-002 implementation
- `ML-DEVOS-AS-016` final verdict — `ARCHITECT_APPROVED`

Effective version: `1.4.0` active Sentinel governance-capability baseline; no Sentinel version bump

## Decision

MaisogLabs adopts the WEB-INC-002 **authenticated read-only admin dashboard boundary** as accepted product architecture.

The accepted composition is:

```
request /admin or /admin/*
        ↓
validate auth configuration
        ↓
verify Cloudflare Access JWT server-side
        ↓
post-authenticated dispatch
        ├─ protected admin static/dashboard shell
        └─ GET /admin/api/dashboard
                  ↓
          positive allowlist serializer
                  ↓
          local/server-only D1 reads
                  ↓
          WEB-INC-005 revision substrate
```

The binding invariants are:

`AUTHENTICATED ≠ AUTHORIZED TO MUTATE`

and

`PROTECTED READ EXISTS ≠ WRITE AUTHORITY ≠ REMOTE D1 EXISTS ≠ PUBLIC D1 CUTOVER`.

Exactly one editorial data endpoint is part of this architecture:

`GET /admin/api/dashboard`

Its response is a bounded status view only. It may expose stable IDs, project slug where applicable, pointer-derived lifecycle state, published/draft revision IDs, a bounded display label, and sections-only order/visibility status. It does not expose raw revision rows, full editorial copy, administrator identity claims, SQL/schema details, configuration, or mutation capability.

The public site remains on the existing governed source path:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

WEB-INC-002 does not make D1 the public source of truth.

## Context

WEB-INC-001 established the fail-closed Cloudflare Access authentication boundary for `/admin` and `/admin/*`.

WEB-INC-005 then established the accepted local/server-only D1 revision substrate while deliberately preserving `data/site.js` as the public source.

The verified Product Build Pack placed WEB-INC-002 after those two prerequisites so that the first protected editorial read could be built only after both identity verification and the revision substrate existed.

`ML-DEVOS-RFC-004` proposed composing those two accepted subsystems. Because this created the first authenticated HTTP data boundary across WEB-INC-001 and WEB-INC-005, `ML-DEVOS-AS-015` classified the change as `ARCHITECTURE`, not merely a generic capability addition. Paulo authorized that bounded implementation through `D-025`.

Claude implemented WEB-INC-002 at `fc962fd...`. `ML-DEVOS-AS-016` independently inspected the exact diff, authentication ordering, dispatcher, serializer, D1 read shape, client/server separation, error/cache behavior, local-only configuration, unchanged schema, and unchanged public render path, and concluded:

`ARCHITECT_APPROVED — WEB-INC-002 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`.

## Alternatives considered

### Keep /admin as an authentication-only placeholder

Rejected.

That would preserve the identity boundary but would not deliver the dependency-ordered WEB-INC-002 product increment: a protected view of current published/draft/archive status from the accepted D1 substrate.

### Read protected status from static public assets

Rejected.

The static public deployment is not an appropriate protected source for draft/archive status. WEB-INC-002 must read through the protected server-side D1 substrate established by WEB-INC-005.

### Add a generic /admin/api service

Rejected.

A generic editorial API would widen the exposed server surface before write/audit semantics exist. The accepted architecture deliberately implements one exact read endpoint only.

### Return raw D1 rows and redact sensitive fields

Rejected.

Redaction is not future-safe: a newly added database column could become exposed accidentally. The accepted serializer positively constructs only explicitly approved response fields.

### Trust browser-provided identity or create an application session

Rejected.

Cloudflare Access verification remains server-side and fail-closed. WEB-INC-002 does not introduce persistent application identity/session storage or browser persistence of Access claims.

### Combine read-only dashboard work with mutation or publish actions

Rejected.

Authentication proves identity; it does not grant write authority. Mutation, publish/unpublish, and audit integration are separate future increments with separate authorization requirements.

### Provision remote/production D1 as part of this increment

Rejected.

Remote D1 was unnecessary to validate the protected read architecture and was explicitly outside D-025. The accepted implementation remains repository/local only.

## Rationale

The selected design creates the smallest useful protected data surface while preserving existing trust boundaries.

Authentication is completed before route classification or D1 access, preventing unauthenticated callers from learning DB availability or protected route behavior.

The endpoint is read-only by construction:
- fixed method and path;
- fixed internal table/domain allowlist;
- SELECT-only repository helpers;
- no caller-provided SQL or table/column selector;
- no mutation UI or hidden mutation handler.

The serializer is also disclosure-bounded by construction. It returns only lifecycle/status information and does not make raw revision content available to the browser.

Centralized `Cache-Control: no-store` handling at the protected Worker boundary keeps protected success and error responses non-cacheable, while the dashboard JSON uses explicit JSON content type and `nosniff`.

This architecture therefore composes the accepted WEB-INC-001 and WEB-INC-005 foundations without silently advancing into write authority, remote resources, deployment, or public-source cutover.

## Consequences

**What this enables:**

- an authenticated administrator can view bounded current content lifecycle/status through one protected server-side endpoint;
- later governed increments can build on an established authenticated request-to-D1 composition rather than inventing that boundary during mutation work;
- published, draft, published-with-draft, and archived state are surfaced from the accepted pointer model;
- the public site remains operationally isolated from the local D1 dashboard read path.

**What remains intentionally unavailable:**

- create/edit/save/delete;
- publish/unpublish;
- project CRUD;
- `audit_log` / WEB-INC-008;
- media/R2;
- journal;
- theme/design mutation;
- persistent application identity/session/role storage;
- generic admin API;
- remote/production D1;
- production Cloudflare Access configuration;
- public D1 cutover;
- deployment;
- protected/main merge;
- any later WEB-INC implementation.

The next dependency-ordered Product Build Pack item is `WEB-INC-008`, but this ADR does **not** authorize it.

## Security boundary

The accepted protected-read trust path is:

`SERVER-VERIFIED ACCESS IDENTITY → POST-AUTH ROUTE DISPATCH → BOUNDED READ-ONLY D1 STATUS VIEW`

Invalid auth/config never reaches the dashboard/D1 path.

After valid authentication:
- non-GET dashboard methods are rejected;
- unknown admin API paths are rejected;
- missing D1 is a generic service-unavailable failure;
- query/projection errors are generic internal errors;
- protected responses are `no-store`.

No identity claim is returned or persisted by the dashboard.

## Evidence provenance

`INDEPENDENTLY_INSPECTED` by the Architect in `ML-DEVOS-AS-016`:

- exact implementation diff and changed-path inventory;
- authentication-before-dispatch/data ordering;
- endpoint/method dispatch;
- allowlist serializer;
- lifecycle derivation;
- SELECT-only D1 query shape;
- client/server import boundary and absence of mutation controls;
- failure/cache/content-type/CORS behavior;
- local-only Wrangler configuration;
- unchanged WEB-INC-005 schema;
- unchanged public render/source path;
- focused regression-test source.

Retained as `ACTOR_REPORTED` Builder evidence:

- `npm test`: 96/96 passing;
- successful `npm run build`;
- local Wrangler smoke tests;
- local D1 runtime/table introspection;
- Wrangler dry-run;
- secret/config scan.

No independent reproduction of the Builder's local npm/Wrangler execution is claimed by this ADR.

## Related records

- `ML-DEVOS-RFC-004 — MaisogLabs WEB-INC-002 Protected Read-Only Admin Dashboard`
- `ML-DEVOS-AS-015 — WEB-INC-002 proposal architecture sync`
- `D-025 — Authorize WEB-INC-002 protected read-only admin dashboard implementation`
- `ML-DEVOS-AS-016 — WEB-INC-002 final implementation review`
- `ML-DEVOS-ADR-003 — WEB-INC-005 local D1 revision substrate`

## Effective version

The active Sentinel governance-capability baseline remains `v1.4.0`.

This ADR records a **MaisogLabs product architecture** decision. It does not change Sentinel core architecture, governance authority, or governance capability, so no Sentinel version bump occurs.

The frozen Sentinel architecture remains `ML-DEVOS-ARCH-001 / v1.2.0`.

## Supersedes / superseded by

Supersedes: none.

This ADR builds on `ML-DEVOS-ADR-003` by adding an accepted protected read-only application/data boundary over the local D1 substrate. It does not supersede ADR-003 and does not change the existing public source-of-truth role.

Superseded by: none as of acceptance.
