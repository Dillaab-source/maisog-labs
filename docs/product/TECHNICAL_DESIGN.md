# MaisogLabs Technical Design

Status: `CURRENT — RECONCILED THROUGH WEB-INC-006`

Owns **HOW**. Requirements/rationale live in `PRD.md`; UI/UX detail lives in `UI_UX_SPEC.md`; state transitions live in `APP_FLOW.md`; data contracts live in `DATA_BACKEND_SPEC.md`.

## Current technical architecture

MaisogLabs remains a statically exported Next.js application with selective Cloudflare Worker-first routing.

### Static content path

Homepage/current portfolio content remains:

```
data/site.js
  → lib/content/local.mjs
  → lib/content/schema.mjs
  → lib/content/public.mjs
  → app/page.js
```

This remains the public source for the homepage and existing project presentation.

### Worker-first paths

Exactly these route families are Worker-first:

- `/admin`
- `/admin/*`
- `/api/journal`
- `/api/journal/*`

Everything else remains asset-first unless separately authorized later.

## System boundaries

### `app/`

Current static routes include:

- `/`
- `/admin`
- `/journal`
- generated `/_not-found`

`/journal` remains static and uses a client component to fetch its runtime Journal data.

### `worker/`

Current Worker responsibilities:

- Access JWT verification for protected admin requests;
- authenticated read-only dashboard dispatch;
- bounded project mutation dispatch;
- bounded media upload/list dispatch;
- bounded Journal mutation dispatch;
- unauthenticated read-only public Journal dispatch.

Public Journal dispatch is structurally separated from the Access-authenticated admin dispatch.

### `worker/d1/`

Owns local server-side persistence helpers for:

- revision substrate;
- audit;
- projects;
- media associations;
- Journal;
- schema application;
- input validation.

The full accepted local schema is 20 product tables.

### `MEDIA` R2 binding

Local-only media object storage simulation.

No public object serving and no remote R2 authority.

## Implemented architecture increments

### WEB-INC-001 — Auth boundary

Fail-closed Cloudflare Access assertion verification for `/admin` and `/admin/*`.

### WEB-INC-005 — D1 revision substrate

Local-only D1 base revision model.

### WEB-INC-002 — Read-only dashboard

Authenticated bounded status projection.

### WEB-INC-008 — Audit substrate

Append-only audit log with DB-level UPDATE/DELETE rejection.

### WEB-INC-003 — Project mutation

Protected create/edit/preview/publish/unpublish lifecycle with immutable revisions, expected-pointer guards, and atomic success audit.

### WEB-INC-004 — Media subsystem

Local R2 + `media`/`project_media`, validated uploads, immutable media metadata/associations, revision-scoped project media snapshots.

Accepted by `ML-DEVOS-AS-027` / `ML-DEVOS-ADR-007`.

### WEB-INC-006 — Journal

Adds:

- `journal_entries`
- `journal_entry_revisions`
- `journal_media`
- protected Journal lifecycle APIs
- Journal status projection
- published-only public Journal APIs
- static `/journal` shell

Accepted by `ML-DEVOS-AS-029` / `ML-DEVOS-ADR-008`.

Journal body is plain text only in this increment.

## Public/admin boundary

### Protected admin

Every `/admin*` request is Access-gated before admin data/mutation dispatch.

Mutation-capable domains are bounded to the accepted project/media/Journal routes.

There is no generic arbitrary-table/content mutation endpoint.

### Public Journal

`GET /api/journal` and `GET /api/journal/:slug` require no Access token.

They are read-only and resolve only current published Journal revisions.

They never expose:

- draft revision IDs;
- unpublished content;
- historical revisions not currently pointed to;
- media storage keys;
- uploaded-by identities;
- audit internals;
- resource configuration.

## Publication model

Base entities carry identity/immutable metadata and revision pointers.

Public-affecting mutable content lives in immutable revision rows or immutable revision-scoped junction snapshots.

Journal adds one narrow revision transition:

`published_at: NULL → generated timestamp`

on first publication.

## Local resource policy

Tracked configuration remains:

- D1 `remote: false`
- R2 `remote: false`

No production resource identifier or secret is committed.

Current implementation evidence is repository/local only.

## Static export constraint

No accepted increment has converted the application to SSR.

The Journal page remains statically generated and fetches runtime data client-side.

Any future SSR/dynamic-server conversion requires an explicit architecture decision.

## Remaining target architecture

The only dependency-ordered core WEB increment not yet implemented is:

`WEB-INC-007 — Theme / Design Controls`

It owns:

- `theme_settings`
- `theme_settings_revisions`
- validated/range-constrained design settings
- no free-form CSS/JS

It is **not authorized** by this document or the current STATE.

## Known gaps

- no production verification of current local D1/R2/Journal capabilities;
- no production Access configuration verified;
- no automated visual regression suite;
- no complete admin editing UI for all implemented APIs;
- no general homepage/projects D1 public cutover;
- no public media-object serving;
- no WEB-INC-007 Theme/Design Controls.

## Evidence discipline

Builder runtime/test/CLI evidence remains `ACTOR_REPORTED` unless independently reproduced.

Accepted architecture/source reviews are recorded in the relevant `ML-DEVOS-AS-*` and ADR records.
