# ML-DEVOS-RFC-007: MaisogLabs WEB-INC-004 Local Media Subsystem

Status: `ACCEPTED`

Change class: `ARCHITECTURE`

Product increment: `WEB-INC-004 — Media subsystem`

Repository-grounded base: `25fd64dfa0e76662cf7d098b3ca7f044c7c77231`

## Baselines

- Frozen Sentinel architecture: `ML-DEVOS-ARCH-001 / v1.2.0`
- Active Sentinel governance-capability baseline: `v1.4.0`
- Project build sequence through WEB-INC-003: closed / Architect-approved
- Authentication boundary: `ML-DEVOS-AS-012`
- Local D1 revision substrate: `ML-DEVOS-AS-014` / `ML-DEVOS-ADR-003`
- Append-only audit substrate: `ML-DEVOS-AS-019` / `ML-DEVOS-ADR-005`
- Project mutation capability: `ML-DEVOS-AS-022`
- Cross-build advisory note: `docs/SENTINEL_REVIEW_NOTES.md`

## Problem

MaisogLabs can now create/edit/preview/publish/unpublish project revisions in local D1, but project revisions cannot own validated media.

WEB-INC-004 must introduce the first media subsystem while preserving:

- revision-scoped public state;
- immutable historical revisions;
- immutable media public-affecting metadata;
- authenticated admin-only writes;
- auditability;
- no public-source cutover;
- no real remote resource authority.

## Classification

`ARCHITECTURE`.

This increment is stronger than a capability-only change because it:

1. adds two persistent product tables;
2. adds a new object-storage subsystem/binding (R2 API surface);
3. creates cross-store D1 ↔ object-storage consistency rules;
4. extends project revision semantics to include revision-scoped media associations.

The upload permission itself is a sensitive capability, but the stronger `ARCHITECTURE` path governs the increment.

## Sentinel review-note disposition

The cross-build review note identifies R2/remote resources as a review trigger, not an automatic blocker.

This proposal intentionally avoids real remote R2.

Cloudflare's current local-development model supports locally simulated R2 bindings; `remote: true` is the explicit switch for remote resources.

Therefore WEB-INC-004 may proceed under the current bootstrap Sentinel workflow **only as a local/repository architecture increment**.

This RFC does not authorize S3–S14 or add new Sentinel machinery.

## Scope

WEB-INC-004 owns only:

- `media`
- `project_media`
- local simulated R2 object storage
- authenticated media upload/list behavior
- project revision media selection
- project draft preview metadata for selected media

It does not create:

- `journal_media`
- journal tables
- theme/design tables
- public media serving
- public R2 bucket
- remote R2 bucket
- public D1 cutover
- deployment

## D1 schema

Add a new ordered migration:

`migrations/0003_web_inc_004_media.sql`

Never rewrite:
- `0001_web_inc_005_init.sql`
- `0002_web_inc_008_audit_log.sql`

Current product-table count:

`15`

Accepted target after this increment:

`17`

Exactly two new product tables are allowed.

### media

Required fields:

- `id TEXT PRIMARY KEY`
- `storage_key TEXT NOT NULL UNIQUE`
- `content_type TEXT NOT NULL`
- `size_bytes INTEGER NOT NULL`
- `alt_text TEXT NOT NULL`
- `uploaded_at TEXT NOT NULL`
- `uploaded_by TEXT NOT NULL`
- `state TEXT NOT NULL DEFAULT 'active'`

Constraints:

- content type exactly one of:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- `size_bytes > 0 AND size_bytes <= 5 MiB`
- bounded non-empty alt text (target: trimmed 1–300 characters)
- state exactly `active|archived`

Public-affecting fields are immutable after insert:

- `storage_key`
- `content_type`
- `size_bytes`
- `alt_text`
- `uploaded_at`
- `uploaded_by`

No admin API may edit them.

Database triggers must reject direct UPDATE of those fields.

No media DELETE API is authorized.

A database-level direct DELETE guard should preserve historical references.

Only `state` is structurally mutable, but this increment does not need to expose an archive endpoint.

### project_media

Revision-scoped association only:

- `project_revision_id INTEGER NOT NULL`
- `media_id TEXT NOT NULL`
- `role TEXT NOT NULL`
- `sort_order INTEGER NOT NULL`

Foreign keys:

- project revision → `project_revisions.id`
- media → `media.id`

Constraints:

- role exactly `cover|gallery`
- `sort_order >= 0`
- prevent duplicate slot/association within one revision

Existing junction rows are immutable.

Database triggers must reject direct UPDATE/DELETE of historical association rows.

A media-selection change is represented by a **new project revision with its own complete junction-row snapshot**, never by rewriting the previous revision's associations.

## R2 boundary

Add one Worker R2 binding for development use.

Requirements:

- binding name: `MEDIA` (or a clearly equivalent stable name);
- explicit local-only configuration;
- no `remote: true`;
- no public bucket configuration;
- no custom domain;
- no production bucket provisioning;
- no real remote resource ID/credential in tracked source.

Cloudflare local simulation is the only authorized R2 execution environment in this increment.

## Upload API

Add exactly:

`POST /admin/api/media`

Authentication:
- existing verified Access boundary first;
- same bounded non-empty mutation subject rule accepted in WEB-INC-003.

Request model:

- binary request body, not generic multipart;
- `Content-Type` must be one of the three allowlisted image types;
- alt text supplied as one bounded, explicitly documented request metadata field/header;
- no client-provided object key/path;
- no client-provided media ID.

Maximum body:
- 5 MiB actual bytes.

Validation:

1. same-origin request;
2. exact content-type allowlist;
3. body byte bound;
4. file signature/magic check must match declared type;
5. alt text validated/bounded;
6. empty file rejected;
7. unsupported/active-content formats rejected, including SVG.

The server generates:
- media ID;
- storage key;
- file extension from validated detected type.

No original filename is trusted or used in storage paths.

This follows defense-in-depth file-upload guidance: allowlist type, verify signature, bound size, generate storage paths server-side, and do not trust client filename/content-type alone.

## Upload write ordering / compensation

R2 and D1 do not share a distributed transaction.

Required success path:

1. validate request completely;
2. generate bounded media ID/storage key;
3. write object to local R2;
4. execute one D1 batch containing:
   - insert media row;
   - append `media_upload / success` audit row;
5. return success only after both stores succeed.

If R2 write fails:
- no media row;
- no success response.

If R2 succeeds but the D1 batch fails:
- attempt compensating R2 delete of the just-created object;
- no media row may survive from the failed D1 batch;
- no success audit may survive;
- return failure;
- optionally append one bounded failure audit afterward if D1 remains available.

If compensation delete itself fails:
- still return failure;
- never invent a D1 media row to make stores appear consistent;
- the unreferenced object is an operational orphan, not public content;
- record this limitation/evidence in handoff.

No recursive audit-of-audit behavior.

## Media audit action

New fixed audit action:

`media_upload`

Entity type:

`media`

No caller-controlled action/entity type.

Project draft creation/edit continues to use the existing project mutation audit actions. Adding a media snapshot to the new project revision is part of that same project mutation transaction and does not require a second project-media audit event.

## Media list API

Add exactly:

`GET /admin/api/media`

Protected/authenticated read only.

Return a positive allowlist of media metadata, for example:

- id
- contentType
- sizeBytes
- altText
- state
- uploadedAt

Do not return:
- raw storage key unless strictly required;
- bucket name/config;
- object credentials;
- internal D1 fields;
- uploader subject.

Default list may include active media only.

No public route.

## Project media selection

Do **not** add a free-standing `project_media` mutation endpoint.

Instead extend only the already-authorized project draft creation/edit semantics:

- `POST /admin/api/projects`
- `PUT /admin/api/projects/:id/draft`

with an optional complete media-selection array for the **new revision being created**.

Each entry contains only:

- `mediaId`
- `role`
- `order`

Rules:

- media IDs must exist and be active;
- roles/order must be bounded/valid;
- referenced media rows are never modified;
- project_media rows are created for the new revision only;
- previous revision's project_media rows remain untouched;
- all project_media inserts commit atomically with the new project revision, pointer transition, and existing project success audit.

If the media selection is omitted on edit:
- inherit/copy the effective source revision's media associations into the newly created draft revision so ordinary text edits do not silently drop media.

If the media selection is supplied:
- it is the complete association snapshot for the new revision.

No in-place attachment edit.

## Preview

The existing protected project draft preview may add bounded media metadata for the exact `draft_revision_id`.

It must:
- never fall back to a different revision's media;
- never make R2 public;
- never expose storage credentials/config;
- never mutate.

Serving raw media bytes through a new preview/content route is **not required** in this increment.

## Public boundary

Critical invariant:

`LOCAL R2 OBJECT + D1 MEDIA ROW != PUBLIC WEBSITE MEDIA`

The live public site remains on:

`data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`

No D1/R2 public read path is authorized.

No bucket is public.

No R2 custom domain.

No production deployment.

## Request/security rules

All mutation routes remain behind:

`VALID AUTH CONFIG → VERIFIED ACCESS JWT → BOUNDED MUTATION SUBJECT → SAME ORIGIN → TYPE/SIZE/CONTENT VALIDATION → WRITE`

Do not accept:
- SVG;
- arbitrary MIME;
- scriptable documents;
- user-controlled storage paths;
- arbitrary metadata blobs;
- remote URL ingestion;
- ZIP/archive uploads.

No permissive CORS.

Protected responses remain `Cache-Control: no-store` and JSON responses use `nosniff`.

Uploaded bytes are not executed/interpreted by the Worker.

## Required evidence

Builder must provide at minimum:

1. exact base/result SHA and changed files;
2. old migrations byte-identical;
3. new 0003 migration only;
4. exactly 17 product tables;
5. media/project_media FK and constraint inventory;
6. direct DB UPDATE/DELETE immutability rejection;
7. repeat-safe schema/migration behavior;
8. no remote R2 configuration / no `remote: true`;
9. no public bucket/custom domain;
10. auth-negative upload/list tests;
11. empty/oversized-subject upload refusal;
12. wrong origin refusal;
13. allowed JPEG/PNG/WebP signature+MIME cases;
14. MIME/signature mismatch rejection;
15. SVG/unsupported type rejection;
16. empty body rejection;
17. >5 MiB actual-byte rejection;
18. server-generated ID/storage-key proof;
19. R2 put failure → zero media row / no success;
20. D1 failure after R2 put → compensation delete attempted / no success row;
21. successful upload → one R2 object + one media row + one success audit;
22. media list positive-projection/non-leakage;
23. create/edit project with media snapshot;
24. media omission on edit inherits source associations;
25. supplied media selection fully replaces the new revision's snapshot without changing old revision rows;
26. inactive/missing media selection rejected;
27. project revision + project_media rows + pointer + existing project audit atomicity;
28. stale project edit remains protected by WEB-INC-003 commit-time guard;
29. preview reads only draft revision media metadata;
30. prior published revision associations unchanged after draft media change;
31. public content/source path unchanged;
32. all prior WEB-INC regression suites pass;
33. full `npm test`;
34. `npm run build`;
35. local-only Wrangler/R2 simulation validation;
36. dry-run/config/secret scan;
37. explicit confirmation: no remote R2/D1, no public bucket, no public cutover, no deployment, no main merge, no journal/theme/later increment.

Runtime command claims remain `ACTOR_REPORTED` until independently reproduced.

Exact diff/source can be `INDEPENDENTLY_INSPECTED`.

## Expected implementation surface

Expected surfaces may include:

- `migrations/0003_web_inc_004_media.sql`
- additive current-schema helper changes
- `wrangler.jsonc` local R2 binding
- media validation/storage helper module
- admin media handler
- bounded changes to existing admin dispatcher
- bounded changes to project create/edit/preview for media snapshots
- audit helper/action use
- focused media tests
- prior project-mutation regression adjustments if needed
- governance/evidence/handoff/state docs

Any remote resource provisioning, public-read code, journal/theme work, or unrelated schema change requires return to Architect.

## Explicitly not authorized by this proposal

- real/remote R2 bucket creation or access;
- `remote: true`;
- public R2 bucket/custom domain;
- remote D1;
- public D1/R2 cutover;
- media delete API;
- SVG or arbitrary-file upload;
- remote URL import;
- journal / journal_media;
- theme/design controls;
- public media route;
- deployment;
- production Access changes;
- protected/main merge;
- later WEB-INC;
- Sentinel S3+;
- CI/rulesets/task/capability engines.

## Version impact

No Sentinel version bump proposed.

This is MaisogLabs product architecture, not a Sentinel architecture change.

## Architect Sync / Paulo gate

Required.

The user's `Proceed with the build` authorizes the start of this next dependency-ordered governance/build cycle.

It does not silently authorize remote R2 or implementation before this exact architecture has passed Architect Sync and the resulting implementation scope has been explicitly gated.
