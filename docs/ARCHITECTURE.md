# Architecture

## Overview

Maisog Labs V4 is a statically exported Next.js portfolio served through Cloudflare Workers + Assets.

Repository/local architecture currently includes:

- static public homepage/content from `data/site.js`;
- authenticated `/admin` Worker boundary;
- local-only D1 revision/audit substrate;
- bounded project mutation APIs;
- local-only R2 media subsystem;
- bounded Journal mutation APIs;
- published-only public Journal read APIs;
- static `/journal` shell;
- no remote D1/R2 or production cutover.

Accepted architecture records include `ML-DEVOS-ADR-003`, `ADR-005`, `ADR-007`, and `ADR-008`.

## Runtime flow

### Ordinary public routes

Most public routes remain asset-first:

```
visitor → Cloudflare Assets → statically exported Next.js pages
```

The homepage and existing project presentation still read:

```
data/site.js → lib/content/local.mjs → schema.mjs → public.mjs → app/page.js
```

That path has **not** been cut over to D1.

### Public Journal routes

`WEB-INC-006` adds the first public Worker→D1 read path.

Worker-first routing is enabled only for:

- `/api/journal`
- `/api/journal/*`

These routes are:

- unauthenticated;
- GET-only;
- read-only;
- published-pointer-only;
- local/repository implemented;
- not production-verified.

The static `/journal` page is still produced by Next.js static export. Its client component fetches the public Journal API at runtime.

### Admin routes

Worker-first routing remains enabled for:

- `/admin`
- `/admin/*`

Flow:

```
request
  → worker/auth.mjs
  → validate Access configuration
  → verify Cloudflare Access assertion
  → protected admin dispatch
```

After successful Access verification, bounded admin capabilities include:

- `GET /admin/api/dashboard`
- project create/edit/preview/publish/unpublish
- media upload/list
- Journal create/edit/preview/publish/unpublish

No generic mutation route exists.

The admin UI itself remains primarily a read-only status surface; the domain mutation capabilities are API-level, not yet a complete editing UX.

## Local persistence

### D1

Local D1 is explicitly configured with:

`remote: false`

The accepted local schema contains exactly **20 product tables** after migrations 0001–0004.

Current accepted domains include:

- site/navigation/foundations/projects/services/process/sections revision substrate;
- append-only audit log;
- media + project_media;
- journal_entries + journal_entry_revisions + journal_media.

D1 is **not** the general public source of truth for the homepage/projects.

Journal is the only accepted public D1 read domain so far.

### R2

The `MEDIA` R2 binding is local-only:

`remote: false`

It supports the accepted admin media subsystem.

There is no:

- public R2 bucket/domain;
- public media-object serving route;
- production bucket provisioning;
- remote R2 authority.

## Presentation layer

- `app/page.js` — static homepage composition.
- `app/journal/page.js` — static Journal shell.
- `app/journal/JournalClient.js` — runtime client fetch for public Journal reads.
- `app/admin/*` — authenticated admin/status presentation.
- `app/globals.css` — V3 cinematic presentation plus accepted `UI-PATCH-001` soft geometry.
- `components/Logo.js`, `ProjectRail.js`, `BlueprintIcon.js` — reusable presentation units.

## Worker boundaries

- `worker/index.mjs` — top-level Worker entrypoint.
- `worker/auth.mjs` — protected admin authentication plus exact public-Journal routing separation.
- `worker/admin/dashboard.mjs` — authenticated admin dispatch/status.
- `worker/admin/projects.mjs` — project lifecycle API.
- `worker/admin/media.mjs` — media upload/list API.
- `worker/admin/journal.mjs` — Journal lifecycle API.
- `worker/public/journal.mjs` — published-only public Journal API.
- `worker/d1/*` — bounded D1 data access, schema, validation, audit, and mutation helpers.

Nothing under `worker/d1/` is imported into public client bundles.

## Deployment contract

The repository deployment shape remains:

- build: `npm run build`
- output: `out/`
- Worker entrypoint: `worker/index.mjs`
- Assets binding: `ASSETS`
- static export remains enabled
- `assets.run_worker_first` is bounded to:
  - `/admin`
  - `/admin/*`
  - `/api/journal`
  - `/api/journal/*`

Current tracked Cloudflare resource configuration remains local/inert:

- D1: `remote: false`
- R2: `remote: false`
- Access team/audience values: placeholders only

No deployment, production Access configuration, remote D1/R2, or protected/main merge is authorized by the current closed state.

## Security baseline

Current controls include:

- fail-closed Cloudflare Access verification for admin paths;
- bounded non-empty mutation subject;
- same-origin mutation requests;
- bounded actual request bytes;
- strict JSON/media validation;
- immutable revision/junction history patterns;
- stale-write protection;
- append-only audit log;
- positive allowlist public/admin projections;
- published-pointer-only Journal public reads;
- no public media storage keys;
- no secrets committed in tracked source.

## Current content boundary

Two public-content paths now coexist:

1. **Homepage / existing site content** — static Git-backed `data/site.js` path.
2. **Journal** — static shell + local published-only Worker/D1 API.

This is intentional.

`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE` remains true for homepage/projects.

No general public D1 cutover has occurred.

## Remaining core increment

The dependency-ordered WEB roadmap has one remaining core increment:

`WEB-INC-007 — Theme / Design Controls`

No authority for WEB-INC-007 exists in the current closed state.

## Production caveat

Repository/local implementation evidence is not production verification.

Remote resources, deployment, protected/main merge, and production verification remain separately gated.
