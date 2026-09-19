# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-021 — WEB-INC-003 Implementation Review / Remediation Cycle 1

Cycle: `MAISOGLABS-WEB-INC-003-PROJECT-MUTATION`  
Review mode: `FINAL CAPABILITY / MUTATION / AUTH / AUDIT REVIEW`  
Authority chain: `ML-DEVOS-RFC-006 → ML-DEVOS-AS-020 → D-027 → ML-DEVOS-AS-021`

Authorized implementation base:
- `5ba7c496a05d2541324c5ecc565c1937ca023b1e`

Builder implementation commit:
- `a016cc2aafea494ad00ecfd79b545ccdcb0c1221`

Builder bookkeeping HEAD:
- `f3623c8666205336ffa13a023c6f8c32e637d36b`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

## Review discipline performed

Before issuing this verdict, the Architect:

1. live-checked the authoritative governance branch;
2. read current `coordination/STATE.md` and `coordination/IMPLEMENTER_HANDOFF.md`;
3. compared exact implementation range `5ba7c496... → a016cc2a...`;
4. separately compared bookkeeping range `a016cc2a... → f3623c86...`;
5. independently inspected:
   - `worker/auth.mjs`;
   - `worker/index.mjs`;
   - `worker/admin/dashboard.mjs`;
   - `worker/admin/projects.mjs`;
   - `worker/d1/projects.mjs`;
   - `worker/d1/audit.mjs`;
   - `worker/d1/validate.mjs`;
   - `tests/worker-admin-projects.test.mjs`;
   - the modified dashboard regression test;
6. compared implementation behavior against RFC-006, AS-020, D-027, ADR-003/004/005, and the accepted WEB-INC-001/005/002/008 boundaries.

Builder runtime/test evidence remains `ACTOR_REPORTED` unless independently reproduced.

## Exact provenance — PASS

Implementation compare:

`5ba7c496a05d2541324c5ecc565c1937ca023b1e → a016cc2aafea494ad00ecfd79b545ccdcb0c1221`

contains exactly **1 implementation commit** and exactly **15 changed files**:

New:
- `worker/admin/projects.mjs`
- `worker/d1/projects.mjs`
- `tests/worker-admin-projects.test.mjs`

Substantive modified:
- `worker/d1/audit.mjs`
- `worker/d1/validate.mjs`
- `worker/auth.mjs`
- `worker/index.mjs`
- `worker/admin/dashboard.mjs`
- `tests/worker-admin-dashboard.test.mjs`

Documentation modified:
- `brain/GOVERNANCE_MAP.md`
- `brain/IMPLEMENTATION_STATUS.md`
- `brain/RISK_REGISTER.md`
- `brain/TEST_LEDGER.md`
- `docs/product/BUILD_PLAN.md`
- `docs/product/DATA_BACKEND_SPEC.md`

Bookkeeping compare:

`a016cc2aafea494ad00ecfd79b545ccdcb0c1221 → f3623c8666205336ffa13a023c6f8c32e637d36b`

contains exactly **1 bookkeeping commit** and exactly **2 changed files**:
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

No runtime/product code is hidden in the bookkeeping commit.

## Finding dispositions

### AS21-F001 — PASS — authorized route surface is bounded

The committed dispatcher exposes only:

- `POST /admin/api/projects`
- `PUT /admin/api/projects/:id/draft`
- `GET /admin/api/projects/:id/preview`
- `POST /admin/api/projects/:id/publish`
- `POST /admin/api/projects/:id/unpublish`

No DELETE path or generic mutation route exists.

### AS21-F002 — PASS — authentication remains before mutation dispatch

The verified Access assertion is still processed before post-auth dispatch.

The implementation passes only a reduced subject value downstream rather than the full JWT payload.

No mutation path is reachable before the existing WEB-INC-001 verification succeeds.

### AS21-F003 — PASS — immutable revision model is structurally respected

Create/edit behavior inserts new `project_revisions` rows.

No project revision content row is updated in place.

Slug is not accepted by edit.

No project/revision delete behavior is introduced.

### AS21-F004 — PASS — success mutation + audit batching is structurally sound

Create/edit/publish/unpublish success paths place business state statements and the success audit INSERT in the same `db.batch()`.

The create/edit revision-ID correlation uses a bounded project+revision_number subquery against the existing UNIQUE constraint rather than `last_insert_rowid()` or ID preallocation.

The committed test suite contains a real local-D1 rollback test that deliberately causes the audit statement to fail and asserts the preceding business statements roll back.

### AS21-F005 — PASS — audit surface remains bounded

The new audit helper remains fixed-SQL and server-only.

The project-specific revision lookup is hardcoded to `project_revisions`.

No arbitrary table/column/SQL surface, audit HTTP route, audit UPDATE, or audit DELETE capability is added.

### AS21-F006 — PASS — public/schema boundaries remain intact

No migration file changed.

No schema helper changed.

No public content-source file changed.

The accepted 15-table schema remains the intended inventory.

`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE` remains true.

### AS21-F007 — BLOCKING — stale-write enforcement is pre-read only and has a TOCTOU window

This is the primary blocker.

RFC-006 / AS20-F006 require stale pointer state to prevent mutation rather than silently overwrite a newer edit/publish/unpublish decision.

Current implementation performs:

1. `readProjectForMutation(...)`;
2. compares expected pointers in JavaScript;
3. later executes an atomic batch whose project pointer UPDATE is **unconditional with respect to the expected pointer state**.

Examples:

`buildPublishBatch`:
```sql
UPDATE projects
SET published_revision_id = ?, draft_revision_id = NULL
WHERE id = ?
```

`buildUnpublishBatch`:
```sql
UPDATE projects
SET published_revision_id = NULL
WHERE id = ?
```

Edit similarly moves the draft pointer without including the expected published/draft state in the commit-time mutation.

Therefore a concurrent state transition can occur after the pre-read but before this batch executes.

Example failure mode:

1. Request A reads `published=null, draft=10` and passes its expected-pointer check.
2. Request B creates/moves the draft pointer to revision 11 and commits.
3. Request A then executes its previously-built publish batch.
4. Because the UPDATE checks only `id`, Request A can publish revision 10 and clear draft revision 11, overwriting the newer decision despite the stale-write contract.

The current stale tests prove only requests that are **already stale before the pre-read**.

There is no test that introduces a competing pointer change between the pre-read and the batch execution.

#### Required remediation

The expected pointer condition must be enforced **inside the same atomic commit boundary** as the mutation and success audit.

A pre-read may remain for bounded responses/revalidation, but it cannot be the sole concurrency guard.

The implementation must ensure:

- edit/publish/unpublish commit only if both current pointer values still equal the request's expected values at transaction execution time;
- a commit-time stale condition aborts the success transaction;
- no success audit row survives;
- no pointer/content mutation survives;
- the response is bounded `409 Conflict`, not false success and not an undifferentiated success path.

Builder may use a bounded SQL/D1 precondition/guard compatible with the existing schema.

No schema change is authorized.

If documented D1 behavior cannot satisfy this requirement with the existing schema, STOP and return to Architect.

#### Required tests

Add deterministic interleaving tests that simulate a competing state change **after handler pre-read and before batch execution**, at minimum:

- edit vs competing draft change;
- publish vs competing draft change;
- unpublish vs competing pointer change.

Each must prove:
- response `409`;
- competing/newer state remains intact;
- no stale request revision/pointer mutation survives;
- no `success` audit row is written for the stale request;
- one bounded failure audit may be recorded after rollback where storage remains available.

### AS21-F008 — BLOCKING — mutation subject is non-empty but not bounded

AS20-F003 requires a **bounded non-empty** verified Access `sub`.

Current `extractMutationSubject(payload)` accepts any non-empty string:

```js
typeof payload?.sub === "string" && payload.sub.trim().length > 0
```

It does not enforce the bound required by the capability contract.

The downstream audit actor is:

`cf-access:<sub>`

and ADR-005's audit validator limits actor length to 100 characters.

As a result, an oversized subject may pass the mutation-identity gate and reach later D1/read/build logic, only to fail indirectly when constructing the audit event.

That is not equivalent to a bounded mutation authorization decision.

#### Required remediation

At the auth identity-reduction boundary:

- normalize/trim as appropriate;
- enforce an explicit maximum compatible with the `cf-access:` audit prefix and ADR-005 actor bound;
- reject unusable/oversized mutation subject before any project D1 access;
- mutation route must return bounded `403`;
- preview may retain the existing authenticated-read semantics.

Add tests proving:
- missing/empty subject → 403, zero D1;
- whitespace-only subject → 403, zero D1;
- oversized subject → 403, zero D1;
- maximum accepted bounded subject can complete a normal mutation and produce a valid bounded actor.

### AS21-F009 — REQUIRED REMEDIATION — request-body limit is character-counted after full buffering

The code names the limit `MAX_MUTATION_BODY_BYTES`, but enforces:

```js
const rawBody = await request.text();
if (rawBody.length > MAX_MUTATION_BODY_BYTES)
```

`String.length` is not UTF-8 byte length, and the full body is buffered before the size decision.

The existing test uses ASCII only, so it does not prove the stated byte-bound behavior.

#### Required remediation

Enforce a real bounded request-body budget.

At minimum:
- reject an over-limit declared `Content-Length` before body parsing when available;
- enforce the actual body budget in bytes, not JavaScript character count;
- do not permit multibyte content to bypass the 32 KiB budget.

A streaming bounded read is preferred where practical so the limit also constrains buffering.

Add a multibyte regression demonstrating the byte limit cannot be bypassed.

### AS21-F010 — REQUIRED REMEDIATION — route/method classification should precede DB-binding requirement

`handleProjectsDispatch` currently begins:

```js
if (!db) return jsonResponse(503, ...)
```

before route/method classification.

That means an authenticated wrong-method or unknown project API request can return `503` when DB is absent instead of the capability's bounded `404/405` behavior, despite requiring zero D1 access.

For consistency with the accepted WEB-INC-002 dispatcher and AS20-F002:

- classify exact project route/method first;
- return 404/405 for unsupported route/method without requiring DB;
- only a recognized route that actually needs D1 should require the DB binding and return 503 when absent.

Add missing-DB tests for:
- unknown project sub-route → 404;
- wrong method → 405;
- recognized valid project route → 503.

## Evidence provenance

Independently inspected:
- exact implementation/bookkeeping ranges;
- auth subject handoff;
- route dispatcher;
- request hardening implementation;
- mutation repository statements;
- audit prepared-statement helpers;
- stale pointer pre-read implementation;
- atomic batch shapes;
- focused test source;
- unchanged schema/public paths from exact diff.

Builder `ACTOR_REPORTED`:
- `npm test`: 152/152;
- `npm run build`;
- local Wrangler/D1 command evidence;
- dry-run/config/secret scans.

No runtime reproduction is claimed by this review.

## Required remediation — Cycle 1

Remediation is bounded to AS21-F007 through AS21-F010.

Do not redesign WEB-INC-003.

Do not add schema/migrations.

Do not expand routes or product domains.

Builder must:

1. move stale-state enforcement into the atomic mutation boundary;
2. add interleaving/TOCTOU regression tests;
3. bound mutation `sub` before any project D1 access and add boundary tests;
4. enforce the request-body budget in bytes with multibyte coverage;
5. classify unsupported route/method before requiring DB and add missing-DB regressions;
6. run focused project tests;
7. run all prior WEB-INC regression suites;
8. run full `npm test` and build;
9. update only necessary implementation/tests/evidence/handoff/state;
10. return exact remediation SHA/diff to Architect.

If fixing AS21-F007 requires schema evolution or undocumented D1 semantics:

`STOP → RETURN TO ARCHITECT`

## Gates remain

`MUTATION_AUTHORIZED: YES` — only for this bounded WEB-INC-003 remediation.

`AUDIT_APPEND_AUTHORIZED: YES` — only as required by WEB-INC-003.

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

No later WEB-INC work is authorized.

## Verdict

`ML-DEVOS-AS-021: CHANGES_REQUESTED — WEB-INC-003 REMEDIATION CYCLE 1 LIMITED TO COMMIT-TIME STALE-WRITE ENFORCEMENT, BOUNDED MUTATION IDENTITY, TRUE BODY-SIZE BOUNDING, AND ROUTE/DB ORDERING`

No final capability acceptance is issued yet.
