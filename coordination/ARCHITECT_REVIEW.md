# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-014 — WEB-INC-005 Remediation Cycle 1 Verification

Cycle: `MAISOGLABS-WEB-INC-005-D1-SUBSTRATE`
Review mode: `POST-REMEDIATION ARCHITECTURE / DATA-INTEGRITY / SOURCE-OF-TRUTH REVIEW`
Authority chain: `ML-DEVOS-RFC-003 → ML-DEVOS-AS-013 → D-024 → ML-DEVOS-AS-014`
Reviewed remediation commit: `eb159131e4712ede9e2cd8c385d3a9efeb1b0d9b`
Remediation base: `cd2b854ffe5d2e5edbdc72bd383d5ba636b99ae2`
Builder handoff-metadata HEAD: `d6204805da837fac02c3e5412b37296309d8e339`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Product baseline:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`
- `ML-DEVOS-AS-012: ARCHITECT_APPROVED — WEB-INC-001 REPOSITORY IMPLEMENTATION ACCEPTED / REMEDIATION CLOSED`

## Review discipline performed

Before issuing this verdict, the Architect:

1. pulled the live governance branch and current `coordination/STATE.md`;
2. confirmed live HEAD `d620480...` and Builder remediation commit `eb15913...`;
3. read the current Builder handoff and prior `ML-DEVOS-AS-014` findings;
4. independently compared:
   - `cd2b854... → eb15913...` for Remediation Cycle 1;
   - `eb15913... → d620480...` for SHA-bookkeeping metadata;
   - `cd2b854... → d620480...` for the complete remediation sequence;
5. inspected the remediated migration planner/write phase, validator predicates, regression tests, current-state docs, test ledger, handoff, and state;
6. rechecked the preserved-pass boundaries against `ML-DEVOS-RFC-003`, `ML-DEVOS-AS-013`, and `D-024`;
7. checked current Cloudflare D1 documentation for the transaction semantics relied upon by the single-`db.batch()` write phase;
8. performed a repository-wide wording sweep within the remediated current-state documents for remaining stale authentication/storage claims.

## Exact Remediation Cycle 1 diff

GitHub compare `cd2b854ffe5d2e5edbdc72bd383d5ba636b99ae2 → eb159131e4712ede9e2cd8c385d3a9efeb1b0d9b` reports:

- exactly **1 remediation implementation commit**;
- exactly **9 changed paths**:
  - `brain/IMPLEMENTATION_STATUS.md`
  - `brain/TEST_LEDGER.md`
  - `coordination/IMPLEMENTER_HANDOFF.md`
  - `coordination/STATE.md`
  - `docs/product/DATA_BACKEND_SPEC.md`
  - `docs/product/PRD.md`
  - `tests/d1-migration.test.mjs`
  - `worker/d1/migrate.mjs`
  - `worker/d1/validate.mjs`

GitHub compare `eb159131e4712ede9e2cd8c385d3a9efeb1b0d9b → d6204805da837fac02c3e5412b37296309d8e339` reports:

- exactly **1 bookkeeping commit**;
- exactly **2 changed paths**:
  - `coordination/IMPLEMENTER_HANDOFF.md`
  - `coordination/STATE.md`

No public app/content-path file, WEB-INC-001 auth file, Wrangler D1 configuration, migration DDL, package dependency, remote Cloudflare resource, later WEB-INC implementation, deployment, or main merge changed in this remediation.

## Finding dispositions

### AS14-F001 — RESOLVED

The remediation now uses a full read-only preflight over the entire migration target before executing any write.

If any entity resolves to `refuse`, `migrateCurrentContent()` throws before the write phase.

If all plans resolve to `create` or `noop`, every create statement across the migration is flattened into one `db.batch()` call.

The late-conflict regression test deliberately pre-creates a conflicting `process_steps` entity after earlier collections would otherwise have succeeded, then proves all authorized tables are byte/row-equivalent before and after the refused run.

Cloudflare D1 documents `batch()` as transactional: if one statement in the sequence fails, the entire sequence is aborted/rolled back. This supports the all-or-nothing write-phase design the remediation now uses.

The Builder's test execution remains `ACTOR_REPORTED`; the Architect independently inspected the code/test design and the current D1 transaction contract.

### AS14-F002 — RESOLVED

The no-op equivalence logic now checks exact state rather than pointer truthiness.

Independent inspection confirms:

- published state requires `published_revision_id === revision1.id` and `draft_revision_id === null`;
- draft state requires `draft_revision_id === revision1.id` and `published_revision_id === null`;
- archived state requires both pointers exactly null;
- base `created_at`, revision `created_at`, revision `created_by`, and immutable project slug/content-equivalence state participate in the no-op decision.

Regression tests now cover:

- same-entity revision 2 repointing;
- altered migration provenance.

Both are expected to refuse rather than silently return `noop`.

### AS14-F003 — RESOLVED

The D1 validator now aligns the four identified contract divergences with `lib/content/schema.mjs`:

- `order`: safe integer `0..10000`;
- `icon`: exact existing enum;
- `updatedAt`: exact calendar-date round trip;
- project stack: up to 100 entries.

Focused boundary tests are present for each.

No legacy content-contract change was introduced.

### AS14-F004 — PARTIALLY RESOLVED — remaining stale statements in DATA_BACKEND_SPEC

The remediation correctly fixed the headline current-state surfaces:

- `brain/IMPLEMENTATION_STATUS.md` now records the auth-only `/admin` placeholder and repository-level JWT boundary;
- `docs/product/PRD.md` now distinguishes implemented authentication from the still-unimplemented editing/admin capability;
- `docs/product/DATA_BACKEND_SPEC.md` now distinguishes:
  - public authoritative `data/site.js`;
  - local/repository D1 substrate;
  - absent remote/production D1.

However, the same `DATA_BACKEND_SPEC.md` still contains stale pre-WEB-INC-001 / pre-WEB-INC-005 current-state statements:

1. Under **Admin identity references** it says:
   - `The exact identity/authentication mechanism ... is NOT IMPLEMENTED`.

   That is now too broad. WEB-INC-001 implemented the Cloudflare Access assertion/JWT authentication boundary. What remains unimplemented is the persistent admin identity/session representation and editorial identity binding.

2. Under **Authorization boundaries** it still says:
   - `the (currently nonexistent) authentication/authorization boundary`.

   The auth boundary now exists. Mutation authorization/write capability does not.

3. The same paragraph says the protected read path cannot be retrofitted onto the current:
   - `static/asset-only deployment`

   and requires first standing up a server-side data-access substrate.

   That wording is stale twice:
   - the deployment now has a selective Worker auth path from WEB-INC-001, so it is not globally asset-only;
   - WEB-INC-005 now has the local server-side D1 data-access substrate.

The correct current distinction is:

- authentication boundary: repository implementation exists;
- persistent identity/session/editorial authorization model: not implemented;
- protected D1 dashboard/read endpoint: not implemented;
- server-side D1 substrate: exists locally;
- public/static content source remains `data/site.js`;
- remote/production D1 remains absent.

Required Cycle 2 correction:

- update these stale sentences only;
- do not imply an authenticated D1 dashboard/read endpoint exists;
- do not imply mutation authorization exists;
- preserve the distinction between authentication and later authorization/session/editorial identity capabilities.

### AS14-F005 — PARTIALLY RESOLVED — historical provenance fixed, current remediation count still mislabeled

The historical WEB-INC-005 implementation provenance is now correctly repaired:

- original Builder report: 17 paths;
- Architect exact compare: 19 paths;
- the two omitted coordination files are named;
- the original implementation commit and follow-up bookkeeping commit are recorded separately;
- evidence classes remain distinct.

However, the current Remediation Cycle 1 handoff begins:

> `Exact Remediation Cycle 1 changed-file list — 7 files`

then lists seven substantive files and afterward says:

> `Plus the normal coordination/IMPLEMENTER_HANDOFF.md ... and coordination/STATE.md.`

Exact Git compare reports **9 changed paths**, not 7.

The handoff does contain all nine path names, so this is a count/label defect rather than missing provenance content, but an "exact" changed-file heading must state the exact total.

Required Cycle 2 correction:

- change the current Remediation Cycle 1 exact count from 7 to 9;
- optionally state `7 substantive remediation paths + 2 coordination paths = 9 total`;
- preserve the exact 9-path list;
- preserve the historical 19-path correction.

## Preserved-pass findings

### AS14-F006 — PASS / PRESERVED

Exactly the 14 authorized product tables remain the only WEB-INC-005 tables.

### AS14-F007 — PASS / PRESERVED

The public content path remains unchanged and authoritative:

`data/site.js → schema.mjs → public.mjs → local.mjs → app/page.js`.

No D1 public cutover occurred.

### AS14-F008 — PASS / PRESERVED

Composite cross-entity pointer protection remains unchanged.

### AS14-F009 — PASS / PRESERVED

D1 remains server-only and is not exposed through a new HTTP/admin/client path.

### AS14-F010 — PASS / PRESERVED

The local/remote boundary remains unchanged:

- no `database_id`;
- `remote: false`;
- no remote D1 implementation or deployment.

## Evidence disposition

`INDEPENDENTLY_INSPECTED`:

- exact Git remediation and metadata diffs;
- whole-run preflight/write design;
- exact pointer/provenance no-op logic;
- validator predicates;
- regression-test source;
- current-state documentation;
- preserved-scope boundaries.

`ACTOR_REPORTED`:

- 76/76 tests;
- build success;
- fresh/second-run local migration execution;
- Wrangler local commands;
- manual local `db.batch()` rollback probe;
- Wrangler dry-run;
- secret scan.

`INDEPENDENTLY_REPRODUCED`: none in this pass.

## Verdict

`ML-DEVOS-AS-014: CHANGES_REQUESTED — WEB-INC-005 REMEDIATION CYCLE 2`

The substantive migration-integrity and validation blockers are resolved.

Cycle 2 is deliberately narrow and documentation/provenance-only:

1. finish `DATA_BACKEND_SPEC.md` current-state convergence; and
2. correct the current remediation exact changed-file count from 7 to 9.

No runtime/data-layer reopening is authorized.

## Authorized Remediation Cycle 2 scope

Claude may modify only:

- `docs/product/DATA_BACKEND_SPEC.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No other file is authorized unless a direct contradiction created by these exact corrections is discovered and the Builder stops for Architect guidance.

Do not modify:

- migration/runtime code;
- validators;
- tests;
- migration SQL;
- repository/data-access modules;
- Wrangler config;
- public app/content path;
- WEB-INC-001 auth code;
- package files;
- Product PRD;
- implementation/risk/test governance files;
- later WEB-INC work.

## Deployment / remote-resource authority

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Current gate

`CLAUDE WEB-INC-005 REMEDIATION CYCLE 2 — SUBJECT TO ML-DEVOS-AS-014`
