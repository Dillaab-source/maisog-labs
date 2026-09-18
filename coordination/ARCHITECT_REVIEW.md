# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-018 — WEB-INC-008 Implementation Review / Remediation Cycle 1

Cycle: `MAISOGLABS-WEB-INC-008-AUDIT-SUBSTRATE`  
Review mode: `FINAL ARCHITECTURE / APPEND-ONLY DATA / EVIDENCE REVIEW`  
Authority chain: `ML-DEVOS-RFC-005 → ML-DEVOS-AS-017 → D-026 → ML-DEVOS-AS-018`  
Authorized implementation base: `d96ca8a1c6244d07185db2e225ad11741a1f4eef`  
Builder implementation commit: `d4791b945d2853067d51f20fca11db3846a1cf1e`  
Builder bookkeeping HEAD reviewed: `26f305b7a7c10c4aedb2531e785cadabb0e936bd`

Frozen architecture baseline:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

## Review discipline performed

Before issuing this verdict, the Architect:

1. live-checked the authoritative governance branch;
2. read current `coordination/STATE.md` and `coordination/IMPLEMENTER_HANDOFF.md`;
3. compared exact implementation range `d96ca8a1... → d4791b94...`;
4. separately compared bookkeeping range `d4791b94... → 26f305b7...`;
5. independently inspected:
   - `migrations/0002_web_inc_008_audit_log.sql`;
   - `worker/d1/audit.mjs`;
   - `worker/d1/schema.mjs`;
   - `tests/d1-audit.test.mjs`;
   - changed current-state product/governance/test documents;
6. compared the implementation against RFC-005, AS-017, D-026, ADR-003/004, and the accepted WEB-INC-005/002 boundaries;
7. attempted independent runtime reproduction from the public branch, but the Architect execution environment cannot resolve `github.com`; therefore Builder command/test execution remains `ACTOR_REPORTED`.

## Exact provenance — PASS

Implementation compare:

`d96ca8a1c6244d07185db2e225ad11741a1f4eef → d4791b945d2853067d51f20fca11db3846a1cf1e`

contains exactly **1 implementation commit** and exactly **10 changed files**:

New:
- `migrations/0002_web_inc_008_audit_log.sql`
- `worker/d1/audit.mjs`
- `tests/d1-audit.test.mjs`

Modified:
- `worker/d1/schema.mjs`
- `brain/GOVERNANCE_MAP.md`
- `brain/IMPLEMENTATION_STATUS.md`
- `brain/RISK_REGISTER.md`
- `brain/TEST_LEDGER.md`
- `docs/product/BUILD_PLAN.md`
- `docs/product/DATA_BACKEND_SPEC.md`

Bookkeeping compare:

`d4791b945d2853067d51f20fca11db3846a1cf1e → 26f305b7a7c10c4aedb2531e785cadabb0e936bd`

contains exactly **1 bookkeeping commit** and exactly **2 changed files**:
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

No runtime/product code is hidden in the bookkeeping commit.

## Finding dispositions

### AS18-F001 — PASS — scope and table ownership

Exactly one new product table is introduced:

`audit_log`

The existing WEB-INC-005 14-table ownership model remains intact and the current schema helper defines:

`14 existing tables + audit_log = 15`

No later-increment table is created.

### AS18-F002 — PASS — migration history preserved

`migrations/0001_web_inc_005_init.sql` is not part of the implementation diff.

WEB-INC-008 uses a separate ordered migration:

`migrations/0002_web_inc_008_audit_log.sql`

Historical WEB-INC-005 `AUTHORIZED_TABLE_NAMES` / `applySchema()` semantics remain preserved; current 15-table semantics are introduced through new additive exports.

### AS18-F003 — PASS — bounded audit row model

The committed table contains only:

- `id`;
- `occurred_at`;
- `actor`;
- `action`;
- `entity_type`;
- `entity_id`;
- `revision_id`;
- `result`.

No JWT/token/body/content snapshot/stack/SQL-error/metadata-blob column exists.

`result` is DB-constrained to exactly `success` or `failure`.

### AS18-F004 — PASS — append-only enforcement exists at both layers

Application layer:

`worker/d1/audit.mjs` exports a validator and one append primitive; it exposes no audit UPDATE/DELETE helper.

Database layer:

`audit_log_reject_update` and `audit_log_reject_delete` are unconditional BEFORE triggers using `RAISE(ABORT, ...)`.

Focused tests issue raw UPDATE/DELETE directly against D1, bypassing the writer, and assert rejection plus preserved row state.

### AS18-F005 — PASS — writer is fixed-SQL, server-only, fail-closed

`appendAuditEvent(db, event)`:

- validates the complete event;
- rejects unknown fields;
- generates `occurred_at` internally;
- issues one fixed parameterized INSERT;
- accepts no caller SQL/table/column input;
- contains no catch/fallback capable of turning INSERT failure into success.

A forced rejecting DB stub is covered by a focused regression test.

### AS18-F006 — PASS — business failure semantics remain distinct from audit-storage failure

A valid `result: failure` event persists as `failure`.

Audit INSERT failure rejects/throws.

No recursive self-auditing path exists.

This matches AS17-F007 / D-026.

### AS18-F007 — PASS — identity subsystem was not introduced

No identity/session/admin/role table was created.

No browser identity storage was introduced.

`actor` remains a bounded opaque server-supplied value for this substrate only.

The current format is not treated as final editorial identity binding; WEB-INC-003 or another separately authorized identity/mutation design must still define how a real actor reference is derived.

### AS18-F008 — PASS — no HTTP/client audit exposure

The implementation diff does not modify:
- `worker/index.mjs`;
- `worker/auth.mjs`;
- `worker/admin/dashboard.mjs`;
- `app/admin/*`.

No audit HTTP route/UI is introduced.

The focused test seeds audit rows and verifies the WEB-INC-002 dashboard payload remains exactly its seven existing top-level domains with no audit data exposure.

### AS18-F009 — PASS — no ownership/cascade coupling

`audit_log` declares no foreign key.

Existing product tables gain no FK into `audit_log`.

Entity/revision references are logical only, preserving audit history independently.

### AS18-F010 — PASS — public/read-only boundaries preserved

No public renderer/source path changed.

No editorial mutation code was introduced.

WEB-INC-002 remains read-only.

No WEB-INC-003 work appears in the implementation diff.

### AS18-F011 — PASS — local-only authority preserved structurally

`wrangler.jsonc` is unchanged.

No real `database_id`, `remote: true`, production Access change, deployment artifact, or public D1 cutover appears in the committed diff.

Builder-reported local Wrangler/D1 commands are retained as actor-reported evidence.

### AS18-F012 — PASS — focused validation coverage is substantive

The committed 16-test audit suite covers:

- exact 15-table current inventory;
- success append;
- failure append;
- writer-owned timestamp;
- unknown-field rejection;
- invalid actor;
- invalid action/entity type;
- invalid entity ID;
- invalid revision ID;
- invalid result;
- JWT-shaped/oversized actor fixture rejection;
- raw UPDATE rejection;
- raw DELETE rejection;
- forced INSERT/storage failure propagation;
- no audit foreign key;
- unchanged dashboard/no audit leakage.

### AS18-F013 — PASS WITH EVIDENCE-PROVENANCE LIMITATION

Independently inspected:
- exact diff/provenance;
- migration DDL;
- append-only triggers;
- validator/writer implementation;
- schema helper separation;
- focused test source;
- absence of route/client/public changes.

Retained as `ACTOR_REPORTED`:
- `npm test`: 112/112;
- `npm run build`;
- local Wrangler migration application;
- direct local D1 trigger probes;
- dry-run bundle/config validation;
- secret/config scan.

Independent execution was attempted but the Architect environment could not resolve `github.com`, so no runtime reproduction is claimed.

### AS18-F014 — CHANGES_REQUESTED — required migration repeat evidence is missing

This is the only blocking finding.

The authorized Builder evidence in `coordination/STATE.md` explicitly requires:

`local-only migration apply/repeat behavior`

RFC-005 also states that the migration must be repeat-safe under the repository's local migration mechanism.

The handoff proves a **first** successful fresh local migration application, but it does not record:

- a second `wrangler d1 migrations apply DB --local` against the same local database showing no pending/reapplied migration; or
- a focused regression proving `applyCurrentSchema(db)` may be invoked twice against the same DB without schema failure/data destruction.

Static source inspection strongly suggests repeat safety because the table/triggers use `IF NOT EXISTS`, but the required runtime/test evidence was explicitly part of the authorized acceptance contract and cannot be silently waived by the Architect.

## Required remediation — cycle 1 only

No architecture or product redesign is requested.

Builder must perform only this bounded evidence remediation:

1. Add one focused regression test proving the current schema is repeat-safe:
   - apply `applyCurrentSchema(db)`;
   - preserve/insert a representative audit row;
   - apply `applyCurrentSchema(db)` again;
   - assert no error;
   - assert exactly the same 15 product tables remain;
   - assert the two append-only triggers remain;
   - assert existing audit data is not destroyed or duplicated by schema reapplication.

2. Run the focused audit test file and full `npm test`.

3. Run `npx wrangler d1 migrations apply DB --local` twice against the same fresh local state/database and record the second-run result proving no migration is reapplied destructively.

4. Update only the evidence/test-ledger/handoff/state records necessary to report this remediation.

5. Do **not** change the accepted audit schema/writer unless the repeat-safety test actually exposes a defect. If a runtime defect is exposed, stop and report it instead of expanding scope.

6. Return control to Architect with exact remediation commit SHA and changed-file list.

## Gates remain

`AUDIT_APPEND_AUTHORIZED: YES` — only for this bounded remediation/current increment.

`MUTATION_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

No WEB-INC-003 or later work is authorized.

## Verdict

`ML-DEVOS-AS-018: CHANGES_REQUESTED — WEB-INC-008 REMEDIATION CYCLE 1 LIMITED TO MIGRATION REPEAT-SAFETY EVIDENCE`

The runtime/schema design is otherwise acceptable based on current independent code inspection.

No post-review ADR may be created until this evidence gap is closed and the implementation receives final Architect approval.
