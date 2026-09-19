# Architect Review

Status: `ARCHITECT_APPROVED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-022 — WEB-INC-003 Final Remediation Review

Cycle: `MAISOGLABS-WEB-INC-003-PROJECT-MUTATION`  
Review mode: `FINAL REMEDIATION / MUTATION / CONCURRENCY / AUTH REVIEW`  
Authority chain: `ML-DEVOS-RFC-006 → ML-DEVOS-AS-020 → D-027 → ML-DEVOS-AS-021 → ML-DEVOS-AS-022`

Original authorized implementation base:
- `5ba7c496a05d2541324c5ecc565c1937ca023b1e`

Original implementation:
- `a016cc2aafea494ad00ecfd79b545ccdcb0c1221`

Original bookkeeping handoff:
- `f3623c8666205336ffa13a023c6f8c32e637d36b`

Remediation authorization base:
- `5f2991f1c26c79bdda687ff6b4adba4c8e00c50b`

Remediation implementation:
- `a1ff241c5c4f912564627ee13824496ecf9b197b`

Remediation bookkeeping handoff:
- `0db78351307b563ee558adeef37f7c4cd21f6cc0`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

## Review discipline performed

Before issuing this final verdict, the Architect:

1. live-checked the authoritative governance branch;
2. independently compared:
   - `5f2991f1... → a1ff241c...` remediation implementation;
   - `a1ff241c... → 0db78351...` remediation bookkeeping;
3. independently inspected:
   - `worker/auth.mjs`;
   - `worker/admin/projects.mjs`;
   - `worker/d1/projects.mjs`;
   - `tests/worker-admin-projects.test.mjs`;
   - remediation evidence in `brain/TEST_LEDGER.md`;
4. rechecked the original implementation review AS-021 and the binding RFC-006 / AS-020 / D-027 contract;
5. verified that no migration/schema/public-source/package/remote-resource file changed in remediation;
6. cross-checked the commit-time guard mechanism against current Cloudflare D1 batch semantics and SQLite UPDATE/CHECK semantics.

## Exact remediation provenance — PASS

Remediation implementation compare:

`5f2991f1c26c79bdda687ff6b4adba4c8e00c50b → a1ff241c5c4f912564627ee13824496ecf9b197b`

contains exactly **1 implementation commit** and exactly **5 changed files**:

- `worker/d1/projects.mjs`
- `worker/auth.mjs`
- `worker/admin/projects.mjs`
- `tests/worker-admin-projects.test.mjs`
- `brain/TEST_LEDGER.md`

Remediation bookkeeping compare:

`a1ff241c5c4f912564627ee13824496ecf9b197b → 0db78351307b563ee558adeef37f7c4cd21f6cc0`

contains exactly **1 bookkeeping commit** and exactly **2 changed files**:

- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

No product/runtime code is hidden in the bookkeeping commit.

## AS-021 remediation findings

### AS22-F001 — PASS — commit-time stale-write enforcement is now inside the atomic mutation boundary

AS21-F007 is closed.

Every edit/publish/unpublish pointer UPDATE now evaluates the request's expected published/draft pointer state **inside the same SQL UPDATE statement that performs the mutation**.

The guard uses:

```sql
slug = CASE
  WHEN published_revision_id IS ?
   AND draft_revision_id IS ?
  THEN slug
  ELSE 'home'
END
```

The existing `projects.slug` CHECK forbids `home`.

Therefore:

- if live pointers still match the request's expected values, the slug expression is a no-op and the intended pointer transition proceeds;
- if live pointers no longer match, the UPDATE attempts the forbidden sentinel slug and the statement fails;
- because the UPDATE is inside the same D1 `batch()` transaction as the new revision (where applicable) and success audit event, the entire success transaction rolls back.

Current D1 documentation states that batched statements execute sequentially as one transaction and a failing statement aborts/rolls back the whole sequence.

SQLite's documented UPDATE semantics state that right-hand scalar expressions referring to the row are evaluated from the row's values before assignments are made, which makes the live-pointer guard evaluate against the pre-update row state.

The existing CHECK constraint is enforced on UPDATE.

This closes the TOCTOU hole identified in AS21-F007.

### AS22-F002 — PASS — deterministic interleaving regressions prove the guard, not merely pre-read rejection

The new test suite contains explicit stale interleaving simulations for:

- edit vs competing draft change;
- publish vs competing draft change;
- unpublish vs competing pointer change.

Each test intentionally makes the handler's pre-read see an older pointer snapshot while letting the real database retain the newer competing state before the batch executes.

The tests assert:

- stale response is `409`;
- competing/newer pointer state survives;
- stale edit creates no orphan revision;
- no stale success audit survives.

These tests specifically fail to be satisfied by the former pre-read-only design and therefore directly cover the original race.

### AS22-F003 — PASS — bounded mutation subject is enforced before project D1 access

AS21-F008 is closed.

Mutation identity reduction now:

- requires `sub` to be a string;
- trims it;
- rejects empty/whitespace-only;
- rejects length > 90;
- rejects non-printable ASCII.

Because audit actor format is:

`cf-access:<sub>`

and the prefix is 10 characters, a 90-character subject produces an actor exactly at ADR-005's 100-character upper bound.

Tests cover:

- empty subject → 403 / zero D1;
- whitespace-only subject → 403 / zero D1;
- 91-character subject → 403 / zero D1;
- 90-character subject → successful mutation and valid 100-character audit actor.

The full JWT/email/claims object remains unpersisted.

### AS22-F004 — PASS — request body budget is byte-accurate and bounded while reading

AS21-F009 is closed.

The mutation reader now:

- checks declared `Content-Length` early when present;
- reads the request body as a byte stream;
- accumulates actual byte counts;
- cancels reading as soon as the running total exceeds 32 KiB;
- decodes accepted bytes as strict UTF-8;
- no longer uses JavaScript `String.length` as a byte proxy.

Tests cover:

- over-limit declared Content-Length;
- a multibyte UTF-8 body whose JavaScript character count remains below the old threshold while its true byte size exceeds 32 KiB.

Both reject with `413` and zero D1 access.

### AS22-F005 — PASS — route/method classification precedes DB binding requirement

AS21-F010 is closed.

The project dispatcher now classifies exact route + method before checking `db`.

Tests prove with `db: undefined`:

- unknown project sub-route → `404`;
- wrong method → `405`;
- recognized route/method that requires D1 → `503`.

This restores the same fail-closed routing discipline used by the accepted read-only admin boundary.

## Previously passing findings — remain PASS

AS21-F001 through AS21-F006 remain accepted:

- exact route allowlist;
- auth-before-mutation dispatch;
- immutable revision model;
- mutation + success-audit batching;
- bounded audit surface;
- unchanged schema/public-source boundary.

No remediation change invalidates those findings.

## Known limitation — accepted, explicitly recorded

### AS22-L001 — stale-write guard depends on the existing reserved-slug CHECK

The commit-time concurrency guard intentionally reuses the existing:

`CHECK (slug NOT IN ('home', 'projects', 'process', 'about', 'main-content'))`

as an abort mechanism by assigning `home` only when live pointer preconditions fail.

This is technically effective and bounded under the current schema, but it creates a coupling between:

- project slug reserved-word policy; and
- the WEB-INC-003 stale-write abort mechanism.

Therefore:

- a future change to the reserved-slug constraint must explicitly account for this dependency;
- the guard must not be silently removed by a slug-policy change;
- if the project schema is later evolved, a purpose-built compare-and-swap/version/precondition mechanism should be preferred over retaining this coupling indefinitely.

This limitation does **not** block the current local/repository capability because:

- the schema is unchanged and currently enforces the required CHECK;
- the guard is explicit in code;
- local D1 tests exercise the actual failure/rollback path;
- D1 transaction rollback semantics support the design;
- no remote/production deployment is authorized in this cycle.

## Evidence disposition

`INDEPENDENTLY_INSPECTED`:

- exact original implementation diff;
- exact remediation implementation diff;
- exact bookkeeping diff;
- mutation/auth/audit route code;
- commit-time guard SQL;
- interleaving regression source;
- bounded-subject implementation/tests;
- byte-budget implementation/tests;
- route/DB-ordering implementation/tests;
- unchanged migration/schema/public-source/package surfaces.

`ACTOR_REPORTED`:

- remediation focused project suite: 51/51;
- remediation full suite: 164/164;
- successful `npm run build`;
- local migration application;
- local 15-table CLI check;
- local empirical guard scratch probe;
- Wrangler dry-run;
- secret/config scan.

No independent runtime reproduction of Claude's local npm/Wrangler environment is claimed.

## Security / capability conclusion

The accepted WEB-INC-003 capability boundary is:

```
valid Access configuration
        ↓
verified Access JWT
        ↓
bounded non-empty mutation subject
        ↓
same-origin + JSON + byte-bounded mutation request
        ↓
server-side project validation
        ↓
expected pointer state
        ↓
commit-time stale-state guard
        ↓
atomic project transition + success audit
        ↓
local D1 only
```

Critical invariants remain:

`CAPABILITY != AUTHORITY`

`D1 PUBLISHED != PRODUCTION WEBSITE LIVE`

`PROJECT MUTATION CAPABILITY != OTHER CONTENT-DOMAIN MUTATION AUTHORITY`

## Final verdict

`ML-DEVOS-AS-022: ARCHITECT_APPROVED — WEB-INC-003 REPOSITORY/LOCAL PROJECT MUTATION CAPABILITY ACCEPTED / REMEDIATION CLOSED`

No further WEB-INC-003 remediation is required.

## Change-record consequence

WEB-INC-003 is classified `CAPABILITY`, not `ARCHITECTURE`.

Under the active Sentinel Change Governance Policy:

`Capability-change proposal → Decision → (future) capability registry entry`

No ADR is required for this change class.

The repository explicitly states that the executable capability registry/gateway is not implemented yet and that `devos/capabilities/` is reserved for future S5 work.

Therefore this cycle closes through:

- RFC-006;
- AS-020;
- D-027;
- implementation;
- AS-021 remediation;
- AS-022 final acceptance;
- durable governance history / closed STATE.

No fake capability-registry artifact will be created before S5.

## Authority reset on closure

Implementation authority does not carry forward.

On closure:

`MUTATION_AUTHORIZED: NO`

`AUDIT_APPEND_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

The project-mutation capability remains implemented in the repository, but future expansion/use under a new increment requires that increment's explicit authority context.

## Next dependency-ordered candidate

The Product Build Plan identifies:

`WEB-INC-004 — Media subsystem`

as the next dependency-ordered candidate after WEB-INC-003.

It is not authorized by this verdict.

Its own cycle must freshly determine whether its media/R2 work is `ARCHITECTURE`, `CAPABILITY`, or a stronger composed path.

## Current Architect Sync status

`ML-DEVOS-AS-022: ARCHITECT_APPROVED — WEB-INC-003 REPOSITORY/LOCAL PROJECT MUTATION CAPABILITY ACCEPTED / REMEDIATION CLOSED`
