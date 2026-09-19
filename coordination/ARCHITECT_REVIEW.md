# Architect Review

Status: `ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION REQUIRED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-023 — WEB-INC-004 Local Media Subsystem Architecture Sync

Cycle: `MAISOGLABS-WEB-INC-004-MEDIA-SUBSYSTEM`  
Reviewed proposal: `ML-DEVOS-RFC-007`  
RFC proposal commit: `787b632c903eb497ea2b75f42ae30401d74e5b60`  
Grounded pre-proposal repository HEAD: `25fd64dfa0e76662cf7d098b3ca7f044c7c77231`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline at AS-023 review time:
- `v1.4.0`

Current active Sentinel governance-capability baseline after `D-028` / `ML-DEVOS-ADR-006`:
- `v1.5.0`
- this later governance update does not change AS-023's WEB-INC-004 verdict or authority gates

Accepted dependencies:
- `ML-DEVOS-AS-012` — authentication boundary
- `ML-DEVOS-AS-014` / `ML-DEVOS-ADR-003` — local D1 revision substrate
- `ML-DEVOS-AS-019` / `ML-DEVOS-ADR-005` — append-only audit substrate
- `ML-DEVOS-AS-022` — project mutation capability

## Grounding performed

The Architect live-checked:

- current closed `coordination/STATE.md`;
- Product Build Plan WEB-INC-004 scope and dependency order;
- APP_FLOW media flow;
- DATA_BACKEND_SPEC media and project_media invariants;
- current migrations / table inventory;
- current `wrangler.jsonc`;
- current test inventory;
- active change-governance policy;
- canonical `SENTINEL_REVIEW_NOTES.md` remote-resource trigger.

Current Cloudflare documentation was also checked to confirm that R2 can be exercised through local Wrangler simulation without authorizing or touching remote R2 resources, while remote bindings are separately explicit.

## Classification

`ARCHITECTURE`

### AS23-F001 — PASS / BINDING — stronger architecture class governs

WEB-INC-004 introduces:

- two new persistent product tables;
- a new object-storage subsystem/binding;
- cross-store consistency semantics between D1 and object storage;
- project-revision media snapshot semantics.

The upload permission itself is a sensitive capability, but the stronger `ARCHITECTURE` path governs the increment.

No Sentinel architecture/version change is implied; this is MaisogLabs product architecture.

## Binding findings

### AS23-F002 — REQUIRED — local R2 only

This cycle may configure and exercise only a locally simulated R2 binding.

Binding may be named:

`MEDIA`

or an explicitly equivalent stable name.

Must not introduce:

- `remote: true`;
- real bucket provisioning;
- remote R2 credentials;
- public bucket;
- custom domain;
- production resource identifier;
- deployment.

Local object-store simulation is allowed only for repository/local tests.

### AS23-F003 — REQUIRED — exactly two new product tables

Add only:

- `media`
- `project_media`

through a new ordered migration:

`migrations/0003_web_inc_004_media.sql`

The existing migrations remain byte-identical.

Expected product-table inventory becomes:

`15 → 17`

No `journal_media` or journal/theme table is authorized.

### AS23-F004 — REQUIRED — immutable media public-affecting fields

On an existing media row, these fields are immutable:

- storage_key;
- content_type;
- size_bytes;
- alt_text;
- uploaded_at;
- uploaded_by.

Only bookkeeping `state` may structurally change.

No media update endpoint is authorized.

Changing file bytes or alt text means creating a **new media row**.

Database enforcement must reject direct UPDATE attempts against immutable media fields.

Historical media records must not be deletable through admin behavior, and database-level DELETE protection should preserve historical-reference integrity.

### AS23-F005 — REQUIRED — revision-scoped immutable junction snapshots

`project_media` belongs to `project_revisions.id`, never the base project row.

Existing association rows are immutable.

No in-place update of:

- media_id;
- role;
- order.

No free-standing association mutation endpoint.

A changed attachment set is represented only as the new project's **new revision snapshot**.

Older revision junction rows remain unchanged.

### AS23-F006 — REQUIRED — upload route exactly bounded

Only one media mutation route is introduced:

`POST /admin/api/media`

Required boundary:

`VALID ACCESS → BOUNDED SUBJECT → SAME ORIGIN → MEDIA VALIDATION → LOCAL R2/D1 WRITE`

No generic upload endpoint.

No multipart requirement.

No client-selected storage key/path.

No client-selected media ID.

No remote URL import.

No archive/ZIP upload.

### AS23-F007 — REQUIRED — media types and byte limits

Only:

- `image/jpeg`
- `image/png`
- `image/webp`

are allowed.

SVG is explicitly forbidden.

Maximum payload:

`5 MiB actual bytes`

Reject:

- zero-byte bodies;
- over-limit bodies;
- MIME/signature mismatches;
- unsupported signatures/types.

Do not trust `Content-Type` by itself.

Use bounded file-signature validation.

### AS23-F008 — REQUIRED — generated object identity

The server generates both:

- media ID;
- storage key.

The key must not incorporate an untrusted original filename.

A deterministic or random server-generated path is acceptable provided it is bounded and collision-safe.

File extension is derived from the validated media type.

### AS23-F009 — REQUIRED — cross-store compensation

R2 and D1 cannot be treated as one distributed transaction.

The accepted success ordering is:

1. validate;
2. generate ID/key;
3. write object to local R2;
4. run one D1 batch containing media-row insert + `media_upload / success` audit;
5. return success.

If object write fails:
- no D1 success state.

If object write succeeds and the D1 batch fails:
- attempt compensating delete of that just-created object;
- do not leave a D1 media row;
- no success audit survives;
- request fails.

If compensating object delete also fails:
- request still fails;
- do not fabricate D1 consistency;
- record the orphan as an operational limitation/evidence.

This cycle does not require a distributed transaction mechanism.

### AS23-F010 — REQUIRED — media upload audit

Fixed action:

`media_upload`

Entity type:

`media`

Success audit commits in the same D1 batch as the media metadata row.

Failure audit may be appended after failure when D1 remains available.

No arbitrary caller-controlled audit action/type.

### AS23-F011 — REQUIRED — protected media listing only

Add exactly:

`GET /admin/api/media`

It is authenticated read-only.

Return a positive metadata projection.

Do not expose credentials, bucket configuration, uploader identity, or raw internal D1 details.

No public media list route.

### AS23-F012 — REQUIRED — project create/edit may accept media snapshots

Extend only:

- `POST /admin/api/projects`
- `PUT /admin/api/projects/:id/draft`

with an optional complete media snapshot for the **new revision**.

Each entry:

- mediaId;
- role;
- order.

Referenced media must exist and be active.

If edit omits media selection, copy/inherit the source revision's associations so text-only edits do not silently drop media.

If supplied, the provided list is the complete new-revision snapshot.

No older revision association is mutated.

### AS23-F013 — REQUIRED — atomic project-revision media snapshot

For create/edit project operations, the same D1 batch must cover:

- project revision creation;
- new revision's project_media inserts;
- draft pointer movement;
- existing project mutation success audit.

A failure in any new junction insert must roll back the new revision/pointer/success audit.

WEB-INC-003 stale-write enforcement remains binding.

### AS23-F014 — REQUIRED — preview is exact-draft metadata only

Existing project preview may include media metadata for the exact current `draft_revision_id`.

Do not fall back to published revision associations.

Do not expose raw bucket/object credentials.

A raw media-byte preview route is not required by this cycle.

### AS23-F015 — REQUIRED — public boundary remains unchanged

Critical invariant:

`LOCAL R2 OBJECT + D1 MEDIA ROW != PUBLIC WEBSITE MEDIA`

The public site continues to use the existing static source path.

No public D1/R2 media serving.

No cutover.

No deployment.

### AS23-F016 — REQUIRED — existing WEB-INC-003 accepted limitation must not be accidentally broken

WEB-INC-003 currently has the accepted `AS22-L001` dependency on the project slug CHECK for commit-time stale-write abort behavior.

The new migration must not alter that CHECK or project-table semantics.

Any proposed project schema rewrite requires return to Architect.

### AS23-F017 — REQUIRED — no premature Sentinel enforcement build

The canonical review note says remote resources are a review trigger, not an automatic requirement to build S3–S7.

Because this cycle is local-only and does not grant real remote R2, there is no justification to implement new Sentinel enforcement machinery merely for this increment.

Do not start:

- S3+;
- CI/rulesets;
- Capability Gateway;
- Task Engine;
- Orchestrator;
- sandbox subsystem.

### AS23-F018 — REQUIRED EVIDENCE

Builder handoff must satisfy RFC-007's evidence contract, including:

- exact base/result SHA;
- exact changed files;
- 17-table inventory;
- old migration immutability;
- media/project_media DB constraints;
- direct DB immutability checks;
- local R2 config only;
- auth/origin/subject boundary tests;
- JPEG/PNG/WebP signature validation;
- mismatch/SVG/oversize/empty rejection;
- generated key/id proof;
- R2 failure behavior;
- D1-after-R2 failure compensation;
- successful object + metadata + audit path;
- media list projection;
- project create/edit media snapshot behavior;
- inheritance when omitted;
- complete replacement when supplied;
- inactive/missing media rejection;
- atomic project revision + junction + pointer + audit behavior;
- stale edit regression;
- exact draft preview media;
- unchanged published-revision associations;
- all previous regression suites;
- full tests/build;
- local-only Wrangler/R2 validation;
- dry-run/config/secret scan;
- explicit no remote R2/D1, cutover, deploy, later increment, main merge.

Builder runtime evidence remains `ACTOR_REPORTED` unless independently reproduced.

## Compatibility conclusion

RFC-007 is compatible with current MaisogLabs/Sentinel architecture subject to AS23-F001 through AS23-F018.

The local-only design avoids the remote-resource threshold that would otherwise trigger a stronger question about advancing Sentinel enforcement.

## Verdict

`ML-DEVOS-AS-023: ARCHITECT_APPROVED — WEB-INC-004 LOCAL MEDIA SUBSYSTEM COMPATIBLE FOR BOUNDED REPOSITORY/LOCAL IMPLEMENTATION, PAULO AUTHORIZATION REQUIRED`

This approves architecture compatibility only.

It does **not** authorize Claude to implement yet.

## Current gates

`MEDIA_MUTATION_AUTHORIZED: NO`

`MUTATION_AUTHORIZED: NO`

`AUDIT_APPEND_AUTHORIZED: NO`

`REMOTE_R2_AUTHORIZED: NO`

`REMOTE_D1_AUTHORIZED: NO`

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Paulo gate

The user message `Proceed with the build` authorized opening this WEB-INC-004 governance/build cycle.

Because RFC-007 / AS-023 now define the exact local-media architecture and security boundary, explicit implementation authorization of this bounded scope is required before Builder work.

## Current Architect Sync status

`ML-DEVOS-AS-023: ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION REQUIRED`
