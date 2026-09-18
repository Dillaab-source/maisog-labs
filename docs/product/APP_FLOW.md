# MaisogLabs App Flow

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK` — **Remediation Cycle 2** (§2l and §3 updated to agree with `DATA_BACKEND_SPEC.md`'s `AS10-R008` publication-isolation fix)

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
      ├─ Projects (list, published/draft revision state per project)
      ├─ Journal (list, published/draft revision state per entry)  [depends on journal existing at all]
      ├─ Sections (visibility/order — draft/publish, see §2l)  (DESIGN-002, DESIGN-003)
      ├─ Design settings (theme tokens within allowed ranges) (DESIGN-001…014)
      ├─ Media library                                       (ADM-REQ-006)
      └─ Audit log (read-only)                               (WEB-SEC-009)
```

**Read path correction (`AS10-R006`):** the dashboard reads through the protected server-side editorial data-access substrate (`DATA_BACKEND_SPEC.md` § "Publication / revision model"; `TECHNICAL_DESIGN.md` § "Proposed target architecture"), never draft/archived content sourced directly from the current static `data/site.js`/`out/` deployment. The current production deployment is asset-only/static (`wrangler.jsonc`); it has no server-side code path that could safely gate a draft/archived read, so a dashboard cannot exist safely before that substrate does. `BUILD_PLAN.md`'s `WEB-INC-002` is scoped and sequenced accordingly: it depends on both the auth boundary (`WEB-INC-001`) and the protected data-access substrate (`WEB-INC-005` or an equivalent explicitly authorized substrate), and its acceptance criteria require the dashboard's editorial reads to come from that substrate, not from public static assets.

### 2c. Create / edit — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin selects "New project" / "Edit project"
      │
      ▼
Form pre-populated from the entity's current draft_revision_id (edit, if one exists)
or its published_revision_id (edit, if no draft exists yet) — blank (create).
Client-side hints only — authoritative validation happens server-side (WEB-SEC-004)
      │
      ▼
Admin submits
      │
      ▼
Server validates (reusing the existing schema-validation pattern, lib/content/schema.mjs,
extended for a revisioned mutable store — see DATA_BACKEND_SPEC.md § "Publication / revision model")
      │
      ├─ invalid ──▶ §2g "validation failure"
      └─ valid ──▶ create/update a row in <entity>_revisions and point draft_revision_id at it
                   (ADM-REQ-003, ADM-REQ-014). The entity's published_revision_id is
                   NOT touched by this step — the live public version is unaffected
                   while the draft is edited (AS10-R005) ──▶ §2f "success"
```

### 2d. Draft — `PROPOSED TARGET`

A draft is a row in `<entity>_revisions` that the entity's `draft_revision_id` points to (`DATA_BACKEND_SPEC.md` § "Publication / revision model"). It coexists with, and never overwrites, whatever `published_revision_id` currently points to — the currently-live public version is a separate, untouched row. This directly resolves the coexistence gap `AS10-R005` identified in the prior single-`state`-field design. (Today, the schema still only models a flat `draft`/`published`/`archived` `record.state` in `lib/content/schema.mjs`, and nothing can set it except a direct Git edit — the revision-pointer model above is the proposed successor, not a description of current behavior.) A draft is visible to admins only and is never part of the public projection, mirroring the existing published-only filter behavior in `lib/content/public.mjs`.

### 2e. Preview — `PROPOSED TARGET`

```
[PROPOSED TARGET] Admin opens preview for an entity with a pending draft
      │
      ▼
Render using the same presentation components the public site uses,
fed by the entity's draft_revision_id content instead of its published_revision_id
      │
      ▼
Preview is admin-session-gated, reading through the protected editorial
substrate (§2b, AS10-R006); it must never be reachable by an
unauthenticated public request (WEB-SEC-001, 002, 008)
```

`ADM-REQ-010` marks preview as "where practical" — not guaranteed for every content type.

### 2f. Publish / unpublish — `PROPOSED TARGET`

```
[PROPOSED TARGET]
Admin clicks "Publish" on an entity with a pending draft_revision_id
      │
      ▼
Server re-validates the full draft revision in full (never trust prior draft-time validation)
      │
      ├─ invalid ──▶ §2g
      └─ valid ──▶ published_revision_id := draft_revision_id (atomic pointer swap,
                   NOT an overwrite of the prior published revision, which remains in
                   <entity>_revisions for history); draft_revision_id is then cleared;
                   audit entry written (WEB-SEC-009) ──▶ success (ADM-REQ-015)
                       │
                       ▼
                 Next public build/serve follows the entity's (now-updated)
                 published_revision_id
                 (exact mechanism — rebuild-on-publish vs. live read — is a
                 TECHNICAL_DESIGN.md/DATA_BACKEND_SPEC.md decision, not fixed here)

Admin clicks "Unpublish" on an entity with a published_revision_id
      │
      ▼
published_revision_id := null (or a designated "retracted" marker — a future
increment decision), immediately excluding the entity from the next public
projection. All revision rows, including the one just unpublished, are
preserved per a future explicit retention rule — unpublish is a pointer
change, never a deletion of revision history (RISK-WEB-003)
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

### 2l. Design-setting concept — `PROPOSED TARGET` (corrected, `AS10-R008`)

The prior cycle's "adjust → persist → next render" flow bypassed the revision boundary — a design-setting change could reach public output without an explicit publish step, exactly the isolation gap `AS10-R008` found. The corrected flow routes through the same draft → preview → publish pattern as every other editorial content type:

```
[PROPOSED TARGET]
Admin adjusts a design setting (DESIGN-001…014)
      │
      ▼
Server validates the value is within the allowed/validated range for that
setting (DESIGN-014) — arbitrary CSS/JS is never accepted
      │
      ├─ invalid ──▶ §2g "validation failure"
      └─ valid ──▶ write/update a row in theme_settings_revisions and point
                   theme_settings.draft_revision_id at it (mirrors §2c/§2d;
                   theme_settings.published_revision_id is NOT touched)
                       │
                       ▼
                 Admin previews (§2e): render reflects
                 theme_settings.draft_revision_id only, admin-session-gated
                       │
                       ▼
                 Admin publishes (§2f): theme_settings.published_revision_id
                 := draft_revision_id (atomic pointer swap), draft cleared,
                 audit entry written (WEB-SEC-009)
                       │
                       ▼
                 Public render follows theme_settings.published_revision_id
                 only — never the draft, at any point before this step
```

Section visibility/order (`DESIGN-002`, `DESIGN-003`) follows the identical pattern against `sections`/`section_revisions` (`DATA_BACKEND_SPEC.md` § "`sections` — brought under the same revision model"): a draft reorder or visibility toggle lives only in `section_revisions` via `sections.draft_revision_id` and cannot change the live public section layout until published.

## 3. Public published-only rendering — `CURRENTLY IMPLEMENTED`

This is the one admin-adjacent guarantee that already exists and must not regress: `projectPublishedContent()` (`lib/content/public.mjs`) filters every record collection (`navigation`, `foundations`, `projects`, `services`, `process.steps`) to `state === "published"` before the page ever sees it, and requires the root document itself to be `published` or it throws. Any future admin/backend replacement of `data/site.js` must preserve this same guarantee at its own boundary (`brain/PROJECT_GOVERNANCE.md` D-007) — this is the acceptance bar for `WEB-REQ-008` and `RISK-WEB-013` going forward, not a new bar invented here. In the proposed target model (`DATA_BACKEND_SPEC.md` § "Publication / revision model"), the equivalent guarantee is: public rendering follows only each entity's `published_revision_id`, never `draft_revision_id`, and an entity with a null `published_revision_id` does not appear publicly at all — a structurally different mechanism from today's flat `state` filter, but the same guarantee it must preserve.

**Publication isolation is now complete, not just content-level (`AS10-R008`):** this guarantee extends to every value that can affect what a visitor sees, not only whether a record is shown at all. Ordering (`navigation`/`foundations`/`projects`/`services`/`process_steps`/`sections`), section visibility, and media attachment order/role (`project_media`/`journal_media`, now keyed to the revision) all live inside the same published/draft revision boundary — none of them can bypass it by living on a mutable base-entity field. `DATA_BACKEND_SPEC.md` § "Public rendering invariant" states this as a binding rule: every mutable value that can affect public presentation is sourced from published revision/state only, and draft changes cannot alter public output before publish.

## Context-efficiency note

Component/CSS implementation detail is not reproduced here; see `app/page.js`, `app/globals.css`, `components/*`. Requirement prose is not reproduced; IDs are cited against `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`.
