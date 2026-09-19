# ML-DEVOS-AS-026 — Durable Architect Sync Archive

Status: `CONCLUDED — CHANGES_REQUESTED / REMEDIATION CYCLE 1 AUTHORIZED`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `7dc6720dcc32c5f982b32336a58596d8945aee9d`
- file blob: `8168f3915498ea6a9e3d8209acc4525e9d4b0cd0`

Archive method:
- The fenced block below reproduces the concluding ML-DEVOS-AS-026 rolling review snapshot byte-for-byte.
- Remediation is limited to AS26-F008/F009/F010.

## Concluding snapshot

```markdown
# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-026 — WEB-INC-004 Implementation Review / Remediation Cycle 1

Cycle: `MAISOGLABS-WEB-INC-004-MEDIA-SUBSYSTEM`  
Authority chain: `ML-DEVOS-RFC-007 → ML-DEVOS-AS-023 → D-029 → ML-DEVOS-AS-026`

Authorized implementation base:
- `281d726c348e04003b9226ebb766cab50b86439c`

Builder implementation:
- `ca6a93b65353968353b9ba3670e162468abdb33a`

Builder handoff/state:
- `7ee93df48f44fed70a3b03453a86354aba6494ec`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.5.0`

## Review discipline

The Architect independently:

1. live-checked branch HEAD / STATE / IMPLEMENTER_HANDOFF;
2. separated the one implementation commit from the one bookkeeping commit;
3. independently inspected the exact implementation file set;
4. inspected the new migration, upload/list handler, R2/D1 compensation path, signature validation, project-media helpers, project create/edit/preview integration, R2 binding, and focused regression source;
5. compared the implementation against RFC-007 and AS23-F001–F018;
6. kept Builder command/test claims at `ACTOR_REPORTED`.

## Exact provenance

Implementation compare:

`281d726c348e04003b9226ebb766cab50b86439c → ca6a93b65353968353b9ba3670e162468abdb33a`

contains exactly **1 implementation commit** and **13 changed files**.

Bookkeeping compare:

`ca6a93b65353968353b9ba3670e162468abdb33a → 7ee93df48f44fed70a3b03453a86354aba6494ec`

contains exactly **1 bookkeeping commit** and **6 governance/evidence files**.

No runtime code is hidden in the bookkeeping commit.

## Findings that PASS

### AS26-F001 — PASS — implementation surface is bounded

The implementation adds exactly:
- `media`;
- `project_media`;
- local R2 binding;
- protected upload/list behavior;
- project revision media snapshots;
- exact-draft preview metadata.

No journal/theme/public-media/deployment/main-merge/later-WEB-INC/Sentinel-phase implementation appears in the implementation diff.

### AS26-F002 — PASS — local-only R2 boundary

`wrangler.jsonc` adds only:

`MEDIA`

with:

`remote: false`

No public bucket/custom-domain/production credential path is introduced.

### AS26-F003 — PASS — upload boundary and file validation are structurally sound

The upload handler enforces:
- verified Access before admin dispatch;
- bounded mutation subject;
- same-origin;
- JPEG/PNG/WebP allowlist;
- actual-byte 5 MiB streaming limit;
- zero-byte rejection;
- magic/signature vs declared MIME match;
- server-generated UUID/key;
- no original filename/path input.

SVG/arbitrary content cannot match the allowlisted signature detector.

### AS26-F004 — PASS — R2/D1 compensation semantics match RFC-007

The code performs:

1. full validation;
2. local R2 put;
3. D1 batch for media row + success audit;
4. success response only after both succeed.

D1 failure after R2 put attempts compensating object deletion and never fabricates a D1 success state.

Compensation-delete failure remains a documented orphan-object limitation, as permitted by AS23-F009.

### AS26-F005 — PASS — project revision media integration is structurally atomic

Project create/edit insert the new revision's `project_media` statements into the same D1 batch as:
- revision creation;
- pointer movement;
- project success audit.

Edit omission inherits the source revision's snapshot.
Explicit media input defines the new revision's complete snapshot.
Prior revision rows are not updated/deleted.

WEB-INC-003 stale-write guard remains structurally unchanged.

### AS26-F006 — PASS — exact-draft preview boundary

Preview reads associations for exactly `draft_revision_id` and returns a positive media metadata projection.

No storage key, bucket config, uploader subject, or object credentials are exposed.

### AS26-F007 — PASS — old migrations/public source remain untouched

The implementation compare does not modify:
- `migrations/0001_web_inc_005_init.sql`;
- `migrations/0002_web_inc_008_audit_log.sql`;
- `app/page.js`;
- `data/site.js`;
- `lib/content/*`;
- package files.

The public source boundary therefore remains unchanged.

## Required remediation

### AS26-F008 — BLOCKING — media state domain contradicts RFC-007 / DATA_BACKEND_SPEC

Current migration:

```sql
state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active'))
```

Approved contract:

`state exactly active|archived`

and the DATA_BACKEND_SPEC explicitly describes `state` as the one structurally mutable bookkeeping field, e.g. `active → archived`.

The current constraint makes `archived` impossible and therefore contradicts the accepted schema contract.

Required remediation:

- change migration 0003's state constraint to exactly `active|archived`;
- keep default `active`;
- add direct D1 regression evidence:
  - valid active insert;
  - valid state-only transition to archived;
  - invalid state rejected;
- do **not** add an archive HTTP endpoint.

Because 0003 is not accepted/deployed and this is local-only pre-acceptance work, amend 0003 rather than creating a new migration. Validate against a fresh local database so Wrangler's prior local migration ledger cannot mask the amended migration content.

### AS26-F009 — BLOCKING — DB-level alt-text constraint does not enforce approved non-empty/trimmed invariant

Current migration:

```sql
alt_text TEXT NOT NULL CHECK (length(alt_text) <= 300)
```

This permits:
- `''`;
- whitespace-only values;
- untrimmed values.

The application validator rejects blank text, but RFC-007 lists bounded non-empty alt text in the media table's accepted constraints and targets trimmed 1–300 characters.

Required remediation:

- make storage normalization/invariant explicit and consistent;
- persist trimmed alt text;
- database constraint must at minimum reject empty/space-only and >300 characters;
- application response/storage value must agree after normalization;
- add focused tests for:
  - empty;
  - whitespace-only;
  - >300;
  - leading/trailing-space input normalization (or fail-closed rejection, if chosen consistently);
  - direct DB empty/space-only rejection.

Do not broaden the upload API.

### AS26-F010 — BLOCKING — duplicate media slot is not prevented

RFC-007 requires:

`prevent duplicate slot/association within one revision`

Current migration only has:

```sql
UNIQUE (project_revision_id, media_id, role)
```

and the application only deduplicates:

`(mediaId, role)`

This prevents duplicate associations but **does not prevent duplicate slots**, e.g. two different media rows both claiming:

`role='gallery', sort_order=0`

or otherwise the same role/order slot.

Required remediation:

- preserve the current duplicate-association protection;
- additionally reject duplicate `(role, order)` slots within one project revision at both:
  - application validation;
  - database constraint/index level;
- add tests proving:
  - duplicate association rejected;
  - two different media IDs using the same role/order slot rejected;
  - distinct valid slots still succeed.

Do not invent new roles or a new media model.

## Governance bookkeeping note

The live STATE header is authoritative and correctly says:

`TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT`.

However lower historical/pre-authorization prose still contains stale statements such as:

`No Builder authority exists yet`

and an old `Absolute gates` block showing local mutation/audit gates as `NO`.

This is not a runtime defect, but the live coordination file should not contain contradictory current-authority prose.

The Architect will normalize STATE as part of routing remediation; no Builder product-code scope is added by this housekeeping correction.

## Evidence disposition

`INDEPENDENTLY_INSPECTED`:
- implementation/bookkeeping commit separation;
- exact changed-file surfaces;
- migration DDL;
- upload validation/R2/D1 write ordering;
- project snapshot integration;
- preview projection;
- local-only binding configuration;
- focused test source.

`ACTOR_REPORTED`:
- media suite 22/22;
- project suite 60/60;
- full suite 195/195;
- build success;
- local migration/table inventory;
- local trigger probes;
- local Wrangler smoke;
- dry run;
- secret/config scan.

No independent runtime reproduction is claimed.

## Remediation scope

Remediation cycle 1 is limited to:

1. AS26-F008 — `active|archived` schema domain;
2. AS26-F009 — non-empty/trimmed alt-text invariant;
3. AS26-F010 — duplicate slot prevention;
4. directly related focused/regression tests/evidence;
5. handoff/state bookkeeping.

No redesign.
No new routes.
No new tables.
No new migration number.
No remote resource.
No public-media serving.
No journal/theme/later increment.
No deployment/main merge.
No Sentinel S3+.

## Verdict

`ML-DEVOS-AS-026: CHANGES_REQUESTED — WEB-INC-004 REMEDIATION CYCLE 1 LIMITED TO MEDIA STATE DOMAIN, ALT-TEXT DB/NORMALIZATION INVARIANT, AND DUPLICATE SLOT PROTECTION`

## Authority during remediation

`MEDIA_MUTATION_AUTHORIZED: YES`

`MUTATION_AUTHORIZED: YES`

`AUDIT_APPEND_AUTHORIZED: YES`

only for the exact bounded WEB-INC-004 remediation above.

`REMOTE_R2_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`
```
