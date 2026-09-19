# ML-DEVOS-RFC-009: MaisogLabs WEB-INC-006 Local Journal Subsystem

Status: `ACCEPTED`

Change class: `ARCHITECTURE`

Product increment: `WEB-INC-006 — Journal`

Repository-grounded base: `ec51e08f7ec69b313e661036b6197a0d759dfd9c`

## Baselines

- Frozen Sentinel architecture: `ML-DEVOS-ARCH-001 / v1.2.0`
- Active Sentinel governance-capability baseline: `v1.5.0`
- Authentication boundary: closed
- Local D1 revision substrate: closed
- Read-only dashboard: closed
- Append-only audit substrate: closed
- Project mutation lifecycle: closed
- Local media subsystem: `ML-DEVOS-AS-027 / ML-DEVOS-ADR-007`
- Public journal requirement: `WEB-REQ-009`

## Problem

MaisogLabs now has authenticated local admin mutation patterns and a local media subsystem, but no journal/case-study content type exists.

WEB-INC-006 must add a revisioned Journal capability while preserving:

- published-only public reads;
- immutable journal identity/slug;
- immutable historical revisions and revision-scoped media snapshots;
- authenticated admin-only writes;
- append-only mutation audit;
- local-only D1/R2 execution;
- no production/public D1 cutover;
- no deployment or protected/main merge.

## Classification

`ARCHITECTURE`.

The increment reuses established mutation patterns, but it also:

1. adds three persistent product tables;
2. introduces a new public content type and public read API;
3. widens `assets.run_worker_first` beyond the admin boundary for the first time;
4. creates a new public Worker → D1 read path;
5. adds journal-specific publication timestamp semantics.

The public Worker boundary change makes the stronger architecture path appropriate.

## Scope

WEB-INC-006 owns exactly:

- `journal_entries`
- `journal_entry_revisions`
- `journal_media`
- authenticated journal create/edit/preview/publish/unpublish APIs
- journal lifecycle status in the authenticated dashboard
- published-only public journal index/detail read APIs
- a static public `/journal` shell that consumes the published-only API
- revision-scoped journal media metadata
- required audit integration
- local-only tests and build validation

It does not own or authorize:

- WEB-INC-007 theme/design controls
- public media-object serving
- remote D1
- remote R2
- production Cloudflare resource provisioning
- public D1 cutover for existing homepage/projects/content
- deployment
- protected/main merge
- Sentinel S3+

## Requirement

`WEB-REQ-009`:

- public journal index returns published entries only;
- newest-published first;
- detail lookup uses immutable slug;
- draft-only/unpublished entries never appear publicly;
- public detail resolves exactly the current `published_revision_id`, never another historical or draft revision.

## D1 migration

Add exactly:

`migrations/0004_web_inc_006_journal.sql`

Existing migrations `0001`–`0003` must remain byte-identical.

Current product-table count:

`17`

Target:

`20`

Exactly three new product tables are allowed.

### journal_entries

Required shape:

- `id TEXT PRIMARY KEY`
- `slug TEXT NOT NULL UNIQUE`
- `created_at TEXT NOT NULL`
- `published_revision_id INTEGER NULL`
- `draft_revision_id INTEGER NULL`

Rules:

- id uses the same bounded stable entity-id pattern as projects;
- slug uses the same bounded slug rules/reserved-slug exclusion as projects plus reserved journal/public route names;
- slug is immutable after creation;
- base row contains identity/immutable metadata/pointers only;
- published/draft pointers may reference only revisions owned by the same journal entry.

### journal_entry_revisions

Required shape:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `journal_entry_id TEXT NOT NULL`
- `revision_number INTEGER NOT NULL`
- `title TEXT NOT NULL`
- `summary TEXT NOT NULL`
- `body TEXT NOT NULL`
- `published_at TEXT NULL`
- `created_at TEXT NOT NULL`
- `created_by TEXT NOT NULL`

Constraints:

- `revision_number >= 1`;
- unique `(journal_entry_id, revision_number)`;
- title target: trimmed 1–160 chars;
- summary target: trimmed 1–800 chars;
- body format for this increment: **plain text only**, normalized line endings, non-empty, bounded to 20,000 characters;
- no HTML/Markdown execution/interpolation;
- `published_at` is server-controlled and cannot be supplied or edited by the admin request.

Revision content is immutable after insert.

One narrow system transition is allowed:

`published_at: NULL → server-generated timestamp`

when that exact revision is first published.

After non-null, `published_at` is immutable.

Database constraints/triggers must reject mutation outside that one allowed transition.

### journal_media

Revision-scoped association:

- `journal_entry_revision_id INTEGER NOT NULL`
- `media_id TEXT NOT NULL`
- `role TEXT NOT NULL`
- `sort_order INTEGER NOT NULL`

Foreign keys:

- journal revision → `journal_entry_revisions.id`
- media → `media.id`

Role enum for this increment:

- `cover`
- `gallery`

Rules:

- `sort_order >= 0`;
- preserve duplicate-association protection;
- prevent duplicate `(role, order)` slots within one revision;
- rows are immutable/non-deletable once created;
- media changes are represented only by a new journal revision snapshot;
- all referenced media must exist and be `active`.

## Admin routes

Add exactly:

- `POST /admin/api/journal`
- `PUT /admin/api/journal/:id/draft`
- `GET /admin/api/journal/:id/preview`
- `POST /admin/api/journal/:id/publish`
- `POST /admin/api/journal/:id/unpublish`

No delete route.
No generic mutation route.
No slug rename route.

The existing Cloudflare Access boundary runs first.

Mutation requirements mirror the accepted project lifecycle:

- bounded non-empty subject;
- same-origin for mutations;
- JSON only;
- bounded request bytes;
- server-side field validation;
- explicit expected pointer values on edit/publish/unpublish;
- commit-time stale-write protection;
- failure must never appear successful.

### Create draft

Creates:

- base journal entry;
- revision 1;
- optional complete journal_media snapshot;
- draft pointer;
- success audit

as one D1 batch.

Published pointer remains null.

### Edit draft

Creates a new immutable revision.

Source for content/media inheritance:

- current draft if present;
- otherwise current published revision.

If media selection is omitted:
- inherit/copy source revision journal_media snapshot.

If supplied:
- supplied list fully defines the new revision's journal_media snapshot.

Old revisions/junction rows remain unchanged.

### Preview

Authenticated only.

Returns exactly the current draft revision and its bounded media metadata.

Never falls back to public output when a draft is expected.

### Publish

Before publish:

- re-read and fully revalidate the persisted draft;
- verify referenced media remain valid/active;
- apply commit-time expected-pointer stale guard.

Atomic D1 batch must:

1. set the draft revision's `published_at` if and only if currently null;
2. move `published_revision_id := draft_revision_id`;
3. clear `draft_revision_id`;
4. append success audit.

Prior published revision remains historical.

### Unpublish

Atomic D1 batch:

- `published_revision_id := NULL`;
- keep every revision/media association row;
- append success audit.

## Audit actions

Extend the accepted audit action allowlist only with:

- `journal_create_draft`
- `journal_edit_draft`
- `journal_publish`
- `journal_unpublish`

Success events are atomic with the business mutation.

Bounded failure paths append `result: failure` where a safe entity reference exists, following the accepted project pattern.

No audit update/delete API.

## Dashboard

Extend the authenticated read-only dashboard to include journal lifecycle status.

The dashboard projection may expose bounded metadata only, e.g.:

- id
- slug
- derived lifecycle state
- published revision id
- draft revision id

It must not expose full body content by default.

## Public Worker boundary

Current Worker-first paths are admin-only.

WEB-INC-006 may widen `wrangler.jsonc > assets.run_worker_first` only for:

- `/api/journal`
- `/api/journal/*`

The public journal API is deliberately unauthenticated **read-only**.

The Worker entrypoint must classify these exact public routes before the admin Access-auth dispatch.

No other public path becomes Worker-first.

No public write method is allowed.

### Public API

Add exactly:

- `GET /api/journal`
- `GET /api/journal/:slug`

For both:

- read from local D1 only;
- join from `journal_entries.published_revision_id` to exactly that owned revision;
- never inspect/fall back to `draft_revision_id`;
- never return unpublished entries;
- never return historical revisions except the currently published pointer target;
- list ordered `published_at DESC` with deterministic tie-break;
- positive allowlist response fields only.

Public metadata may include bounded journal media metadata:

- media id
- content type
- alt text
- role
- order

Do not expose:

- R2 storage key;
- uploaded_by;
- draft revision ids;
- internal audit data;
- Worker/config/resource identifiers.

No public R2 object-serving route is authorized.

## Public /journal presentation

Add a statically exported `/journal` shell.

Because D1 is runtime/local-only in this increment, the static shell must not import D1 modules or attempt build-time D1 access.

A small client component may:

- fetch `GET /api/journal`;
- display published journal cards newest first;
- fetch `GET /api/journal/:slug` for selected/detail view;
- use a query parameter or in-page state for detail selection.

No dynamic Next.js server route/SSR conversion is authorized.

Body is rendered as escaped plain text; no `dangerouslySetInnerHTML`.

The V3/soft-geometry visual language remains authoritative.

## Local-only resource boundary

D1 remains:

`remote: false`

R2 remains:

`remote: false`

No real remote resource may be touched.

No `database_id`, production bucket, public R2 domain, credential, deployment, or cutover is authorized.

## Evidence requirements

Builder handoff must provide at minimum:

1. exact base/result SHA;
2. exact changed files;
3. migration/table inventory proving 17 → 20 product tables;
4. proof migrations 0001–0003 are byte-identical;
5. table/pointer ownership constraints;
6. journal revision immutability / one-time published_at transition tests;
7. journal_media immutability/duplicate-slot tests;
8. create/edit inheritance/replace semantics;
9. stale-write/interleaving tests;
10. publish-time full revalidation;
11. public index published-only/newest-first evidence;
12. public detail exact-published-revision evidence;
13. draft/unpublished non-disclosure tests;
14. auth-before-admin-D1 tests;
15. public GET route classification with no Access requirement;
16. wrong-method/unknown-route fail-closed tests;
17. audit success/failure evidence;
18. dashboard journal status evidence;
19. `npm test`;
20. `npm run build`;
21. local Wrangler smoke for protected admin + public journal APIs;
22. config/secret scan;
23. explicit confirmation of no remote D1/R2, deploy, main merge, WEB-INC-007, or Sentinel S3+.

## Non-goals

This RFC does not authorize:

- public serving of media object bytes;
- Markdown/HTML/rich-text execution;
- comments/likes/search/tags/categories;
- journal deletion;
- slug rename/redirect history;
- admin UI forms beyond existing API/dashboard surfaces;
- remote Cloudflare resources;
- production deployment;
- main merge;
- theme controls;
- AI generation.

## Acceptance

Implementation may proceed only after:

1. Architect Sync approves this RFC;
2. Paulo authorization is recorded;
3. `coordination/STATE.md` explicitly gives Claude the bounded Builder turn.

Because this is `ARCHITECTURE`, accepted implementation requires final Architect review and a post-acceptance ADR.
