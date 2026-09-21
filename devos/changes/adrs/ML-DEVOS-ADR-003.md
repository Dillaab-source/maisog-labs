# ADR-003: Adopt the WEB-INC-005 local D1 revision substrate alongside the existing public content source

Status: `ACCEPTED`

Related RFC: `ML-DEVOS-RFC-003`
Architect Sync: `ML-DEVOS-AS-013` (proposal compatibility) and `ML-DEVOS-AS-014` (implementation/remediation review)
Paulo decision: `D-024`
Implementation evidence:
- `e0304a89ddfb5595866f1990cd9fca161e78ae2b` — initial WEB-INC-005 implementation
- `eb159131e4712ede9e2cd8c385d3a9efeb1b0d9b` — remediation cycle 1
- `84014db2c13c170ce14fbf1a55fa17b407947d3b` — remediation cycle 2
- `03ab9d896bd0169cbcfb3e4aa62aa83ec9adf72f` — remediation cycle 3 (final)
- `ML-DEVOS-AS-014` final verdict — `ARCHITECT_APPROVED`
Effective version: `1.4.0` active Sentinel governance-capability baseline; no Sentinel version bump

## Decision

MaisogLabs adopts the WEB-INC-005 **local/repository D1 revision substrate** as accepted product architecture, in parallel with — and not replacing — the existing Git-backed public content source.

The architecture is now:

```
CURRENT PUBLIC SOURCE
data/site.js
  → lib/content/schema.mjs
  → lib/content/public.mjs
  → lib/content/local.mjs
  → app/page.js

PARALLEL LOCAL D1 SUBSTRATE
  → exactly 14 WEB-INC-005-owned entity/revision tables
  → deterministic current-content migration/seed
  → pointer-derived published/draft/archive state
  → typed successor validation
  → exact repeat-run/provenance integrity checks
  → server-only repository/read layer
```

The binding invariant is:

`LOCAL D1 EXISTS ≠ REMOTE D1 EXISTS ≠ D1 IS PUBLIC SOURCE ≠ ADMIN WRITE CAPABILITY EXISTS`.

D-007's governed content-boundary decision is therefore **evolved, not replaced**. The public build continues to read `data/site.js`; WEB-INC-005 establishes a separately governed local D1 successor substrate that later protected-read and mutation increments may build on only through their own authorization paths.

The accepted table inventory is exactly:

- `site_settings`
- `site_settings_revisions`
- `navigation`
- `navigation_revisions`
- `foundations`
- `foundation_revisions`
- `projects`
- `project_revisions`
- `services`
- `service_revisions`
- `process_steps`
- `process_step_revisions`
- `sections`
- `section_revisions`

No audit, media, journal, theme, or persistent admin-identity/session table is part of this ADR.

## Context

Before WEB-INC-005, all governed website content was stored in `data/site.js`, validated by `lib/content/schema.mjs`, projected by `lib/content/public.mjs`, and consumed by the static public build. That model remained intentionally authoritative under D-007 unless a later explicit architecture decision replaced or evolved it.

The verified Product Build Pack placed `WEB-INC-005` immediately after the accepted WEB-INC-001 authentication boundary. The purpose of WEB-INC-005 was to establish the storage/revision substrate required by later protected admin reads and writes without prematurely moving public rendering onto D1.

`ML-DEVOS-RFC-003` proposed that staged architecture. `ML-DEVOS-AS-013` approved it for bounded local/repository implementation, and Paulo authorized implementation through `D-024`.

Claude implemented the initial substrate at `e0304a8...`. Architect review `ML-DEVOS-AS-014` then found five classes of issues: whole-run migration atomicity, exact repeat-run pointer/provenance equivalence, validator parity, current-state documentation convergence, and exact-diff provenance. Three remediation cycles resolved those findings. The final review at `ML-DEVOS-AS-014` concluded:

`ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`.

## Alternatives considered

### Immediate public cutover to D1

Rejected.

The public build had a functioning, governed, schema-validated source path. Switching public rendering to D1 in the same increment would have combined storage introduction, migration, runtime-read cutover, and production behavior change into one high-risk transition. It also would have made rollback materially harder and violated the bounded scope accepted in RFC-003.

### Keep `data/site.js` indefinitely with no persistent revision substrate

Rejected.

That would preserve the current public site but leave later admin/read/write increments without the revision/pointer persistence model already specified by the Product Build Pack.

### Store the complete content document as one opaque JSON blob in D1

Rejected.

The current content contract is field-validated. A single free-form blob would weaken that model, obscure revision ownership, and make later draft/published isolation less structurally explicit.

### Create remote/production D1 immediately

Rejected.

Remote provisioning was not needed to implement and validate the repository architecture. Local-only D1 allowed schema, migration, parity, integrity, and server-side repository behavior to be developed without creating a live Cloudflare resource or expanding deployment scope.

### Per-entity migration batches without whole-run preflight

Rejected during implementation review.

The initial implementation could have left earlier entities written if a later entity conflicted. Remediation changed the design to preflight the entire run and then execute the create phase as a single D1 batch.

### Loose repeat-run equivalence

Rejected during implementation review.

Pointer truthiness was insufficient. The accepted architecture requires exact pointer identity and immutable migration provenance/creation metadata for deterministic no-op behavior.

## Rationale

The staged architecture preserves the reliability of the current public site while establishing the exact data model later admin capabilities need.

It separates four concerns that must not be conflated:

1. **public source of truth** — still `data/site.js`;
2. **local persistent revision substrate** — now implemented and accepted;
3. **remote/production D1** — not provisioned;
4. **admin protected-read/write capability** — not yet implemented.

That separation keeps rollback simple, limits blast radius, and preserves clear authority boundaries. It also lets migration and data-integrity behavior be validated before any production database or public read-path cutover exists.

The accepted revision model places public-affecting mutable values behind revision pointers, derives lifecycle from pointer state, keeps project slug immutable on the base entity, and prevents cross-entity pointer assignment. The migration design is deterministic and side-effect bounded across the whole run.

## Consequences

**What this enables:**

- `WEB-INC-002` can later build a protected read-only admin/dashboard layer on top of an already defined server-side D1 repository substrate.
- Later write/publish increments can use the accepted revision/pointer model instead of inventing storage semantics during UI work.
- The current content source has a deterministic migration path into the D1 model.
- Draft, published, and archived states have explicit storage semantics.
- Current content validation has a typed successor in the D1 substrate.
- Local D1 parity/integrity behavior can be tested without a production database.

**What remains intentionally unavailable:**

- remote/production D1;
- public-site D1 rendering;
- authenticated D1 dashboard/read endpoint;
- CRUD or mutation APIs;
- publish/unpublish handlers;
- `audit_log`;
- R2/media storage;
- journal;
- theme/design settings;
- persistent admin identity/session storage;
- production deployment or verification.

**Operational consequence:**

The repository temporarily has two content representations with different roles:

- `data/site.js` is the authoritative public source;
- local D1 is the accepted successor substrate for later governed capabilities.

That duplication is deliberate and must not be silently collapsed. A future public D1 cutover requires a separate architecture/authorization decision.

## Related RFC

`ML-DEVOS-RFC-003 — MaisogLabs WEB-INC-005 D1 Revision Substrate and Current-Content Migration`

See:

`devos/changes/rfcs/ML-DEVOS-RFC-003.md`

## Architect Sync

- `ML-DEVOS-AS-013` — approved RFC-003 as compatible for bounded local/repository implementation.
- `ML-DEVOS-AS-014` — independently reviewed the implementation and three remediation cycles and concluded:
  `ARCHITECT_APPROVED — WEB-INC-005 REPOSITORY/LOCAL IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`.

Durable sync archives live under:

`devos/changes/architect-syncs/`

## Paulo decision

`D-024 — Authorize WEB-INC-005 D1 revision-substrate implementation`.

D-024 authorized exactly this bounded local/repository architecture and explicitly withheld remote D1, deployment, public cutover, later WEB-INC work, and protected/main merge authority.

## Implementation evidence

`INDEPENDENTLY_INSPECTED` by the Architect:

- `e0304a89ddfb5595866f1990cd9fca161e78ae2b` — initial implementation;
- `eb159131e4712ede9e2cd8c385d3a9efeb1b0d9b` — whole-run migration safety, exact pointer/provenance equivalence, validator parity, and documentation/provenance remediation;
- `84014db2c13c170ce14fbf1a55fa17b407947d3b` — documentation/provenance convergence;
- `03ab9d896bd0169cbcfb3e4aa62aa83ec9adf72f` — final current-state convergence;
- exact table ownership, migration/data-access structure, validation predicates, regression-test source, local-only configuration shape, and public-path non-cutover were inspected in `ML-DEVOS-AS-014`.

`ACTOR_REPORTED` Builder evidence retained in the handoff/test ledger:

- 76/76 tests passing;
- successful build;
- fresh and repeated local D1 migration execution;
- exact local table inventory;
- Wrangler dry-run;
- local D1 batch rollback probe;
- secret/config scan.

No `RUNTIME_OBSERVED`, `CI_ATTESTED`, remote-D1, production-deployment, or production-verification evidence is claimed.

## Effective version

The active Sentinel governance-capability baseline remains `v1.4.0`.

This ADR records a **product architecture** decision. It does not change Sentinel core architecture or governance capability and therefore causes **no Sentinel version bump**.

The frozen Sentinel architecture remains `ML-DEVOS-ARCH-001 / v1.2.0`.

## Supersedes / superseded by

Supersedes: none.

This ADR does not supersede D-007. It records an explicit, authorized evolution of D-007's content-boundary architecture: the existing public source remains in force while a local D1 successor substrate now exists in parallel.

Superseded by: none as of acceptance.
