# MaisogLabs App Flow

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK`

Owns states and transitions for both the public visitor experience and the (currently nonexistent) admin experience. This is the priority artifact identified by `D-020`/`D-021` alongside `DATA_BACKEND_SPEC.md`, so it is deliberately the most detailed document in this pack. Every flow below is classified `CURRENTLY IMPLEMENTED`, `PROPOSED TARGET`, or `NOT IMPLEMENTED`; nothing here invents a route, API, or runtime capability that does not exist (`AS10-F003`).

## 1. Public visitor flow — `CURRENTLY IMPLEMENTED`

```
Visitor request
      │
      ▼
Cloudflare Worker (asset-only mode, wrangler.jsonc)
      │  serves prebuilt static output from out/
      ▼
Statically generated app/page.js (single route: "/")
      │
      ├─ header: brand mark (Logo) + primary nav + mailto contact CTA
      ├─ hero (#home): eyebrow / title / description / primary+secondary actions / bridge note
      ├─ foundation dock: in-page anchor links (foundations[])
      ├─ project rail (#projects): featured, published projects only (ProjectRail.js, client component)
      ├─ process section (#process): ordered, published process steps
      ├─ about section (#about): kicker/title/body/quote
      ├─ contact CTA: mailto link
      └─ footer: statement + copyright
      │
      ▼
Rendered HTML delivered to the visitor (no further round trip)
```

There is exactly one route (`/`) plus Next's generated `/_not-found`; `wrangler.jsonc` sets `not_found_handling: "404-page"`. There is no client-side routing between "pages" — navigation is same-page anchor scrolling to sections that already exist in the single rendered document.

### 1a. Navigation — `CURRENTLY IMPLEMENTED`

Navigation targets are restricted by `lib/content/schema.mjs`'s `href()` validator to `#home`, `#projects`, `#process`, `#about`, and validated `mailto:` links. No external links, no client-side router, no dynamic route params exist. A navigation entry pointing anywhere else fails content validation and fails the build (see §7 "Validation failure").

### 1b. Project browsing — `CURRENTLY IMPLEMENTED`

Only `published` projects reach the page at all (filtered in `lib/content/public.mjs`); only `featured` published projects appear in the homepage rail (`app/page.js`: `content.projects.filter(project => project.featured)`). There is no project detail route — each project is a card within the single page, sourced from `data/site.js` fields (`slug`, `category`, `title`, `summary`, `stack`, `accent`, `icon`). A visitor cannot reach a project that is `draft` or `archived`; those states exist in the schema but are stripped before the public projection is built (`RISK-WEB-013`).

### 1c. Journal browsing — `NOT IMPLEMENTED`

No `journal` field exists in `lib/content/schema.mjs`, no journal route or component exists (`brain/GOVERNANCE_MAP.md` row "Journal": `NOT STARTED`). Any journal flow below is `FUTURE OPTION` / `PROPOSED TARGET` only:

```
[PROPOSED TARGET] Visitor → journal index (published entries, newest first)
                          → journal entry detail (published only)
```

No schema, route, or component work is authorized by naming this flow here.

## 2. Admin flow — `NOT IMPLEMENTED` end-to-end

`ADMIN STATUS: NOT IMPLEMENTED` (`brain/PROJECT_GOVERNANCE.md`). No `/admin` route exists in `app/` today. Every flow in this section is `PROPOSED TARGET` design intent, tracked against the existing `ADM-REQ-*`/`WEB-SEC-*` catalog. Naming these flows does not implement, provision, or authorize any of them (`AS10-F012`).

### 2a. Admin authentication — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Visitor requests /admin
      │
      ▼
No valid session? ──yes──▶ redirect to sign-in (ADM-REQ-001, WEB-SEC-001)
      │ no (has session)
      ▼
Session valid & authorized? ──no──▶ fail closed: unauthorized (WEB-SEC-002, 011) — see §2i
      │ yes
      ▼
Admin dashboard (§2b)
```

Authentication/session mechanism (identity provider, cookie/JWT scheme) is undecided and owned by `TECHNICAL_DESIGN.md` / `DATA_BACKEND_SPEC.md`, not this flow document.

### 2b. Dashboard — `PROPOSED TARGET`

```
[PROPOSED TARGET] Admin dashboard
      ├─ Projects (list, current state per project)
      ├─ Journal (list, current state per entry)          [depends on journal existing at all]
      ├─ Sections (visibility/order)                        (DESIGN-002, DESIGN-003)
      ├─ Design settings (theme tokens within allowed ranges) (DESIGN-001…014)
      ├─ Media library                                       (ADM-REQ-006)
      └─ Audit log (read-only)                               (WEB-SEC-009)
```

### 2c. Create / edit — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin selects "New project" / "Edit project"
      │
      ▼
Form pre-populated (edit) or blank (create), client-side hints only —
authoritative validation happens server-side (WEB-SEC-004)
      │
      ▼
Admin submits
      │
      ▼
Server validates (reusing the existing schema-validation pattern, lib/content/schema.mjs,
extended for a mutable store — see DATA_BACKEND_SPEC.md)
      │
      ├─ invalid ──▶ §2g "validation failure"
      └─ valid ──▶ persist as draft (ADM-REQ-003, ADM-REQ-014) ──▶ §2f "success"
```

### 2d. Draft — `PROPOSED TARGET`

A record persists in `draft` state (the schema already models `draft`/`published`/`archived` — `record.state` in `lib/content/schema.mjs` — but nothing today can set that state except a direct Git edit). In the target design, a draft is visible to admins only and is never part of the public projection, mirroring the existing published-only filter behavior in `lib/content/public.mjs`.

### 2e. Preview — `PROPOSED TARGET`

```
[PROPOSED TARGET] Admin opens preview for a draft record
      │
      ▼
Render using the same presentation components the public site uses,
fed by the draft record instead of the published projection
      │
      ▼
Preview is admin-session-gated; it must never be reachable by an
unauthenticated public request (WEB-SEC-001, 002, 008)
```

`ADM-REQ-010` marks preview as "where practical" — not guaranteed for every content type.

### 2f. Publish / unpublish — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin clicks "Publish" on a draft record
      │
      ▼
Server re-validates the full record (never trust prior draft validation state)
      │
      ├─ invalid ──▶ §2g
      └─ valid ──▶ state: draft → published, audit entry written (WEB-SEC-009) ──▶ success (ADM-REQ-015)
                       │
                       ▼
                 Next public build/serve reflects the change
                 (exact mechanism — rebuild-on-publish vs. live read — is a
                 TECHNICAL_DESIGN.md/DATA_BACKEND_SPEC.md decision, not fixed here)

Admin clicks "Unpublish" on a published record
      │
      ▼
State: published → archived (or a dedicated unpublished state — see DATA_BACKEND_SPEC.md),
audit entry written, record immediately excluded from the next public projection
```

### 2g. Validation failure

- **Current (`CURRENTLY IMPLEMENTED`):** at build time only. `validateContent()` (`lib/content/schema.mjs`) throws a listed set of field-level errors; `npm run build` fails; nothing is deployed. There is no runtime/user-facing validation failure today because there is no runtime write path.
- **Target (`PROPOSED TARGET`):** the admin UI must surface the same class of validation failure inline, without requiring a rebuild, and must not proceed to persist an invalid record (`ADM-REQ-011`, `WEB-SEC-004`, `006`).

### 2h. Write failure — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin submits a valid, authorized write
      │
      ▼
Persistence layer fails (network/storage/unexpected error)
      │
      ▼
UI must show an explicit failure state — never a silent success
(ADM-REQ-016, WEB-SEC-012)
```

### 2i. Unauthorized access — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Unauthenticated or under-privileged request to /admin or any mutation endpoint
      │
      ▼
Fail closed: no partial data, no partial UI, explicit unauthorized response
(ADM-REQ-001, WEB-SEC-001, 002, 007, 008, 011)
```

### 2j. Expired / failed session — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin session expires or fails mid-task
      │
      ▼
In-progress unsaved edits are not silently discarded without warning where
avoidable; next authenticated action requires re-authentication;
no mutation is accepted on an expired/invalid session (WEB-SEC-002, 011)
```

### 2k. Media concept — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin uploads media
      │
      ▼
Server-side validation (type/size/content) — no upload is trusted client-side
(ADM-REQ-006, WEB-SEC-005)
      │
      ├─ invalid ──▶ rejected, explicit error (mirrors §2g)
      └─ valid ──▶ stored (target: R2, see DATA_BACKEND_SPEC.md) ──▶ selectable in the media library (§2b)
```

No upload/write API exists today; `RISK-WEB-012` ("Media upload abuse") is `NOT YET APPLICABLE` until this flow is built.

### 2l. Design-setting concept — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin adjusts a design setting (DESIGN-001…014)
      │
      ▼
Server validates the value is within the allowed/validated range for that
setting (DESIGN-014) — arbitrary CSS/JS is never accepted
      │
      ▼
Setting persists (target: theme_settings, see DATA_BACKEND_SPEC.md) and is
applied to the public render on next build/serve
```

## 3. Public published-only rendering — `CURRENTLY IMPLEMENTED`

This is the one admin-adjacent guarantee that already exists and must not regress: `projectPublishedContent()` (`lib/content/public.mjs`) filters every record collection (`navigation`, `foundations`, `projects`, `services`, `process.steps`) to `state === "published"` before the page ever sees it, and requires the root document itself to be `published` or it throws. Any future admin/backend replacement of `data/site.js` must preserve this same guarantee at its own boundary (`brain/PROJECT_GOVERNANCE.md` D-007) — this is the acceptance bar for `WEB-REQ-008` and `RISK-WEB-013` going forward, not a new bar invented here.

## Context-efficiency note

Component/CSS implementation detail is not reproduced here; see `app/page.js`, `app/globals.css`, `components/*`. Requirement prose is not reproduced; IDs are cited against `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`.
