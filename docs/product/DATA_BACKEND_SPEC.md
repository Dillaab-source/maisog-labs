# MaisogLabs Data & Backend Spec

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK — PROPOSED TARGET / NOT IMPLEMENTED (except where marked current)` — **Remediation Cycle 3 (final)** (resolves `AS10-R011` against `ML-DEVOS-AS-010`; preserves Cycle 1's `AS10-R003`/`AS10-R004`/`AS10-R007` and Cycle 2's `AS10-R008` resolutions)

Owns proposed data/API/storage contracts at **design/specification level only**. This document does not provision D1, does not provision R2, does not create an API, and does not migrate `data/site.js` (`AS10-F012`). Everything under "Proposed entities" is `PROPOSED TARGET / NOT IMPLEMENTED` unless explicitly marked otherwise.

## Public rendering invariant (binding, `AS10-R008`, closed end-to-end per `AS10-R011`)

> Every mutable value that can affect public presentation is sourced from published revision/state only. Draft changes cannot alter public output before publish.

Restated precisely, so it covers the whole public read graph, not only content-revision fields (`AS10-R011`):

> Every mutable value that can affect public presentation is either (A) contained inside a revision, or (B) immutable once referenced by that revision. Therefore draft changes cannot alter public output before publish.

Every entity definition and relationship below is designed to make this literally true. Cycle 1 introduced the `published_revision_id`/`draft_revision_id` pointer pattern but left several public-affecting fields (ordering, section visibility, an entity-level lifecycle flag, junction-table attachment order) on the base/logical row, outside the revision boundary. Cycle 2 closed that for ordinary entities by defining the base/logical entity as **identity + immutable metadata + revision pointers only**, and re-keyed the `project_media`/`journal_media` junction tables to the revision. One hole remained after Cycle 2: a `media` row or an existing revision's junction row could still be **edited in place**, changing what a published revision displays without any publish step at all — the value would still technically be "reached through" a revision, but nothing stopped it from being mutated after the fact. This cycle closes that hole by declaring both classes of record immutable once they are load-bearing for a revision (see "Media immutability" and "Junction-row immutability" below) — option (B) above.

## Current storage model — `CURRENTLY IMPLEMENTED`

Local, Git-backed content only. There is no database, no D1, no R2, no external persistence layer today (`brain/PROJECT_GOVERNANCE.md` § "Current storage model"). The entire current data contract is one exported JS object (`data/site.js`, `siteContent`), validated by `lib/content/schema.mjs` and projected by `lib/content/public.mjs`. Its existing shape (field names, types, and constraints) is the baseline any proposed entity below must be able to represent without silently dropping capability, unless a future `ARCHITECTURE`-class decision explicitly changes that (`brain/DECISION_LOG.md` D-007).

The current schema's top-level domains, every one of which is mapped below (`AS10-R003`): `meta`, `site`, `seo`, `navigation[]`, `hero`, `foundations[]`, `projects[]`, `services[]`, `process`, `process.steps[]`, `about`, `contact`, `projectSection`, `footer`. Every record-like collection (`navigation`, `foundations`, `projects`, `services`, `process.steps`) already carries `id`, `order`, and `state` (`draft`/`published`/`archived`).

## Current → target domain mapping (`AS10-R003`, base-entity shape corrected per `AS10-R008`)

No current domain is dropped, silently merged into a free-form blob, or left unmapped. Where a domain is a records-array today, it gets its own target entity+revisions pair (same treatment as `projects`/`navigation`, not a downgrade). Where a domain is a singleton content group, it becomes an explicitly typed, individually validated substructure inside a revisioned `site_settings` entity — never an opaque/untyped JSON field — so today's per-field validation (`lib/content/schema.mjs`) has a direct successor.

| Current domain | Target storage representation | Notes / migration rule |
|---|---|---|
| `meta` (schemaVersion, contentVersion, state, locale, updatedAt) | `schema_version`/`content_version`/`locale` move into `site_settings_revisions` (they are content-shape metadata, not entity identity, so they follow the revision boundary too); the root `state` (published-required-for-build gate) is superseded by `site_settings.published_revision_id`/`draft_revision_id` (see "Publication / revision model" below) | The current root-level "whole document must be published" gate has no direct target equivalent once revisioning is per-entity; a future increment must decide whether a root-level "site is live at all" flag is still needed, as an explicit design note, not a silent drop |
| `site` (name, location, timezone, tagline) | Typed substructure inside `site_settings_revisions` | Individually validated fields, mirroring `lib/content/schema.mjs`'s `site` group |
| `seo` (title, description, canonicalUrl) | Typed substructure inside `site_settings_revisions` | Same pattern; `canonicalUrl` keeps its current `https:`-only/no-credentials/no-query/no-fragment validator |
| `navigation[]` | `navigation` (identity + pointers only) + `navigation_revisions` (all content, including `order`) | See "Proposed entities" below |
| `hero` (eyebrow, title, description, primaryAction, secondaryAction, bridgeLabel, bridgeStatement) | Typed substructure inside `site_settings_revisions` | Preserves the current `lines`/`action` sub-shapes as typed fields, not a blob |
| `foundations[]` | `foundations` (identity + pointers only) + `foundation_revisions` (all content, including `order`) | Currently rendered (`app/page.js` foundation dock); must not be demoted to an untyped list — gets the same entity+revisions treatment as `navigation`/`projects` |
| `projects[]` | `projects` (identity + immutable `slug` + pointers only) + `project_revisions` (all content, including `order`) | See "Proposed entities" below |
| `services[]` | `services` (identity + pointers only) + `service_revisions` (all content, including `order`) | Currently validated and retained even though not rendered today (`docs/CONTENT.md`: "modeled for a later section"). Preserved by default. **If a future product decision intends to retire `services` instead of eventually rendering it, that must be a separate, explicit future architecture/product decision — this spec does not retire it silently.** |
| `process` (kicker, title) | Typed substructure inside `site_settings_revisions` | Header/kicker copy for the process section |
| `process.steps[]` | `process_steps` (identity + pointers only) + `process_step_revisions` (all content, including `order`) | Currently rendered (`app/page.js` process section); same entity+revisions treatment as `foundations` |
| `about` (kicker, title, body, quote, quoteAttribution) | Typed substructure inside `site_settings_revisions` | — |
| `contact` (email, callToAction, headerLabel) | Typed substructure inside `site_settings_revisions` | `email` keeps its current RFC-shape validator |
| `projectSection` (kicker, title, description, emptyMessage) | Typed substructure inside `site_settings_revisions` | Preserves the current empty-state message contract (`UI_UX_SPEC.md` § "Loading / empty / error / success / unauthorized states") |
| `footer` (statement, copyright) | Typed substructure inside `site_settings_revisions` | — |

No current domain is represented as an untyped/free-form JSON blob. Every records-array domain gets its own entity+revisions pair whose base row carries only identity and revision pointers — never `order`, visibility, or any other value a public visitor's experience depends on.

## Publication / revision model (`AS10-R005`, tightened per `AS10-R008`)

### Base/logical entity shape — binding rule

Every logical entity below (`site_settings`, `navigation`, `foundations`, `sections`, `projects`, `services`, `process_steps`, `journal_entries`, `theme_settings`) contains **only**:

- stable identity (`id`, and an immutable `slug` where one exists — see "Slug semantics" below);
- immutable metadata that is set once at creation and never changes (`created_at`);
- `published_revision_id` — FK to the entity's `_revisions` table, nullable;
- `draft_revision_id` — FK to the same table, nullable.

Nothing else. In particular, **no `order`, no visibility flag, no `lifecycle_state`, no `updated_at`/`updated_by`, and no other value that could influence public presentation or an admin's sense of "what changed and when" lives on the base row.** Every one of those either moves into the `_revisions` table (if it is public-affecting or editorial) or is derived rather than stored (see "Entity status is derived, not stored" below) — `created_at`/`created_by` on the latest revision row already answer "when was this last changed and by whom," so the base row does not need its own `updated_at`/`updated_by` duplicate.

### Entity status is derived, not stored (resolves the `lifecycle_state` visibility leak)

Cycle 1 gave the base entity a `lifecycle_state` (`active`/`archived`) field. Independent review correctly found this could affect public visibility while sitting outside the revision boundary. This cycle removes `lifecycle_state` entirely. An entity's effective status is derived purely from its two pointers, with no separate flag to fall out of sync:

| `published_revision_id` | `draft_revision_id` | Effective status |
|---|---|---|
| set | set or null | **Live** (publicly visible via the published revision; a pending draft may or may not also exist) |
| null | set | **Draft-only** (never published, or was unpublished and is being reworked) — not publicly visible |
| null | null | **Archived / removed** — not publicly visible, no pending edit; prior revisions remain in the `_revisions` table for history |

Archiving an entity is exactly "set `published_revision_id` to null and clear `draft_revision_id`" — the same pointer-only operation as unpublish, not a separate flag write. This is a strictly stronger guarantee than Cycle 1's model: there is no field left that could disagree with the pointers about whether the entity is public.

### Base entity + revisions shape

```
logical entity (e.g. "projects")
  id
  slug                     — where applicable; immutable, see "Slug semantics"
  created_at               — immutable, set once
  published_revision_id    — FK to <entity>_revisions, nullable
  draft_revision_id        — FK to <entity>_revisions, nullable
        ↓
<entity>_revisions (e.g. "project_revisions")
  id
  <entity>_id              — FK back to the logical entity
  revision_number
  order                    — where the entity type has an editorial order (AS10-R008)
  ...remaining content fields...
  created_at
  created_by
```

**Public rendering** reads only `published_revision_id`, resolves it to its revision row, and takes every presented value — including ordering — from that row. If `published_revision_id` is null, the entity does not appear publicly at all. This is the direct successor to today's `projectPublishedContent()` filtering on `state === "published"` (`lib/content/public.mjs`); nothing published-only about the public projection regresses.

**Admin editing** creates or updates a row in `<entity>_revisions` (including a new `order` value, if the edit changes it) and points `draft_revision_id` at it. The row `published_revision_id` points to — and every value in it, including its `order` — is never touched by this step. Reordering a draft cannot reorder the live public list; reordering only takes effect when that draft is published.

**Preview** (`ADM-REQ-010`) reads the entity's `draft_revision_id` through authenticated admin access only (`WEB-SEC-001`, `002`) — it is never reachable through the public read path.

**Publish** validates the full draft revision (never trust prior draft-time validation), then atomically sets `published_revision_id := draft_revision_id`. `draft_revision_id` is then cleared. The previously published revision remains in the `_revisions` table for history — publish does not delete prior revisions.

**Unpublish** sets `published_revision_id := null`, immediately removing the entity from the next public projection (and, per the derived-status table above, moving it to "archived" if no draft is pending), while all revision rows are preserved per a future explicit retention rule.

`media`, `audit_log`, and junction tables do not use this pattern — see their own entity definitions below for why; each states explicitly how it stays out of the public presentation path without needing one.

### Slug semantics — decision (`AS10-R008`)

**Decision: Option A — slug is immutable after entity creation.** A `projects`/`journal_entries` row's `slug` is decided and validated (uniqueness, reserved-slug exclusion — `home`, `projects`, `process`, `about`, `main-content`, exactly as `lib/content/schema.mjs`'s `validateContent()` already enforces) at the moment the entity is created, alongside its first draft revision. It is stored on the base row as immutable metadata — this is consistent with the "identity + immutable metadata + pointers only" rule above, because it is fixed at creation and never revised afterward, unlike `order`/content fields which change on every edit. No revision row ever carries a competing `slug` value, so there is no ambiguity about which one is "real."

Renaming a slug (if ever needed) is explicitly out of scope for this spec and would require its own future design decision (e.g. a new entity + redirect, or an explicit slug-history/redirect table) — it is not silently permitted by mutating `slug` in place.

### `sections` — brought under the same revision model (`AS10-R008`)

Cycle 1 gave `sections` a bare `order`/`visible` pair with no revision pair at all — exactly the kind of public-affecting bypass this cycle closes. `sections` now follows the identical entity+revisions pattern as every other records-array domain:

- `sections`: `id` (matches an existing anchor/section key, e.g. `home`, `projects`, `process`, `about`), `created_at`, `published_revision_id`, `draft_revision_id`.
- `section_revisions`: `id`, `section_id`, `revision_number`, `order`, `visible` (boolean), `created_at`, `created_by`.

Draft section changes (a pending reorder or a pending visibility toggle) live only in `section_revisions` via `draft_revision_id` and cannot affect live output. Preview may show the draft configuration to an authenticated admin. Publish atomically promotes it (`published_revision_id := draft_revision_id`), exactly like every other entity. Public reads use `sections.published_revision_id`'s revision only.

### Theme/design settings — draft → preview → publish, not "persist and apply" (`AS10-R008`)

`theme_settings` already had a revision pair in Cycle 1, but `APP_FLOW.md` §2l's flow text (`adjust setting → persist → next render`) did not actually route through it. This cycle corrects `APP_FLOW.md` §2l to read: adjust setting → validate → write/update draft revision (`theme_settings.draft_revision_id`) → preview → publish → public render follows `theme_settings.published_revision_id` only. See `APP_FLOW.md` §2l for the corrected flow, and confirm it agrees with this section exactly.

### Media immutability (`AS10-R011`)

A `media` row's public-affecting fields — at minimum `storage_key`, `content_type`, `size_bytes`, `alt_text` — are **immutable after creation/upload**. Once a `media` row exists, none of those fields is edited in place, whether or not the row is currently referenced by a published revision's junction rows. This is stricter than "immutable only while published" precisely so there is never a moment where editing an existing row is even possible for an admin workflow to reach — a single rule, not a conditional one.

- **If the underlying file changes** (a new image, a corrected asset, etc.): create a **new** `media` row with its own `id`/`storage_key`. The old row is left as-is.
- **If only `alt_text` needs to change**: also create a new `media` row (there is no partial-mutation exception carved out for `alt_text` — it is exactly as public-affecting as `storage_key`, since both are rendered to the visitor). A future implementation may instead introduce an explicit media-revision table if that proves more ergonomic, but this spec's default proposal is "new row, same as any other replacement" to avoid adding a second revisioning mechanism alongside the entity/revision pattern already defined above.
- **What may still change on an existing `media` row:** only the bookkeeping `state` field (e.g. `active` → `archived` once nothing references the row any longer). `state` is never itself consulted by public rendering (already stated in the `media` entity definition below), so this one exception does not reopen the isolation gap.
- A draft content revision's own `project_media`/`journal_media` rows may reference the new replacement `media` row immediately. The replacement becomes publicly visible only when that draft revision is published — never before.

### Junction-row immutability (`AS10-R011`)

Cycle 2 correctly keyed `project_media`/`journal_media` to the revision (`project_revisions.id`/`journal_entry_revisions.id`) rather than the base entity, but left `media_id`, `role`, and `order` on those junction rows mutable in place. This cycle declares: **a junction row belonging to a given revision is an immutable association snapshot once that revision exists.** `media_id`, `role`, and `order` on an existing `project_media`/`journal_media` row are never edited in place — this applies to a junction row attached to the currently *published* revision in particular, since that is the row the public read path is following at that moment, but the rule is the same for any revision's junction rows once created, for the same reason `media` rows are immutable unconditionally rather than only while published.

To change which media is attached, its role, or its order:

```
published revision
      │
      └─ remains untouched; its project_media/journal_media rows are not edited
      │
new/editable draft revision (draft_revision_id)
      ↓
its OWN project_media/journal_media rows are created/edited freely
(these rows belong to the draft revision, which is not yet public)
      ↓
preview (admin-session-gated) reads the draft revision's own junction rows
      ↓
publish: published_revision_id := draft_revision_id (same atomic pointer
swap as any other publish); the draft's junction row set is now the one
the public read path follows, because it is attached to the newly
published revision
      ↓
the previous revision and ITS junction rows are left exactly as they
were — historical evidence, never rewritten
```

This is not a new mechanism — it is the same content-revision publish/preview/pointer-swap semantics already defined above, applied one level down: a junction row is just another piece of revision-scoped content, keyed via the revision's `id` rather than embedded directly in the revision row's own columns.

## Proposed entities — `PROPOSED TARGET / NOT IMPLEMENTED` (except where noted `IMPLEMENTED` below)

All entities below are design proposals for a future D1 schema. Field lists are illustrative and derived from the current `data/site.js` shape plus the `ADM-REQ-*`/`DESIGN-*` catalog they must support — a future `TECHNICAL_DESIGN.md`/RFC-equivalent still needs to finalize exact column types, indexes, and migrations before implementation.

**`WEB-INC-005` implementation note (`ML-DEVOS-RFC-003` → `ML-DEVOS-AS-013` → `D-024`):** the `site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, and `sections` entity/revision pairs below are now `IMPLEMENTED` as local-only D1 tables — see `migrations/0001_web_inc_005_init.sql` and `worker/d1/*` — with the base-entity shape, derived-status model, and cross-entity pointer-ownership rule in this section all enforced exactly as specified (the latter via a composite foreign key `(id, published_revision_id) REFERENCES <entity>_revisions(<entity>_id, id)`, since a plain per-column foreign key cannot express it). `journal_entries`/`journal_entry_revisions`/`journal_media`, `media`/`project_media`, `theme_settings`/`theme_settings_revisions`, and `audit_log` remain `PROPOSED TARGET / NOT IMPLEMENTED`, owned by their own later increments per `BUILD_PLAN.md` §C. This local substrate is not yet the public source of truth — see `brain/PROJECT_GOVERNANCE.md` § "Current storage model".

### `site_settings` / `site_settings_revisions`
- `site_settings`: `id` (fixed singleton key), `created_at`, `published_revision_id`, `draft_revision_id`
- `site_settings_revisions`: `id`, `site_settings_id`, `revision_number`, `schema_version`, `content_version`, one typed substructure per mapped domain (`site`, `seo`, `hero`, `about`, `contact`, `footer`, `projectSection`, `process`), `created_at`, `created_by`

### `navigation` / `navigation_revisions`
- `navigation`: `id` (stable slug-shaped identifier, matches current `^[a-z][a-z0-9-]{0,79}$`), `created_at`, `published_revision_id`, `draft_revision_id`
- `navigation_revisions`: `id`, `navigation_id`, `revision_number`, `order`, `label`, `href` (must remain constrained the way `lib/content/schema.mjs`'s `href()` constrains it today — anchor targets and validated `mailto:` only, or an explicitly widened, re-validated allowlist), `created_at`, `created_by`

### `foundations` / `foundation_revisions`
- `foundations`: `id`, `created_at`, `published_revision_id`, `draft_revision_id`
- `foundation_revisions`: `id`, `foundation_id`, `revision_number`, `order`, `icon`, `label`, `href`, `text`, `created_at`, `created_by`

### `sections` / `section_revisions`
See "Publication / revision model" § "`sections` — brought under the same revision model" above for the full rationale.
- `sections`: `id`, `created_at`, `published_revision_id`, `draft_revision_id`
- `section_revisions`: `id`, `section_id`, `revision_number`, `order`, `visible`, `created_at`, `created_by`

### `projects` / `project_revisions`
- `projects`: `id`, `slug` (immutable after creation — see "Slug semantics" above; unique, disjoint from reserved section slugs), `created_at`, `published_revision_id`, `draft_revision_id`
- `project_revisions`: `id`, `project_id`, `revision_number`, `order`, `category`, `title`, `summary`, `stack` (typed list), `accent`, `icon`, `featured` (boolean), `created_at`, `created_by`

Media attachment is via `project_media`, keyed to the **revision**, not the base entity — see "Media relationships" below (`AS10-R004`, tightened per `AS10-R008`).

### `services` / `service_revisions`
- `services`: `id`, `created_at`, `published_revision_id`, `draft_revision_id`
- `service_revisions`: `id`, `service_id`, `revision_number`, `order`, `title`, `summary`, `created_at`, `created_by`

### `process_steps` / `process_step_revisions`
- `process_steps`: `id`, `created_at`, `published_revision_id`, `draft_revision_id`
- `process_step_revisions`: `id`, `process_step_id`, `revision_number`, `order`, `icon`, `title`, `text`, `created_at`, `created_by`

### `journal_entries` / `journal_entry_revisions`
Entirely new — `NOT IMPLEMENTED`, no equivalent exists in `data/site.js` or `lib/content/schema.mjs` today (`brain/GOVERNANCE_MAP.md` row "Journal": `NOT STARTED`). Ordering is chronological-by-publish rather than manual, so there is no `order` field here (`AS10-R008`'s "journal_entries.order / published_at" is resolved in favor of `published_at`):
- `journal_entries`: `id`, `slug` (immutable after creation, same disjointness rule as `projects.slug`), `created_at`, `published_revision_id`, `draft_revision_id`
- `journal_entry_revisions`: `id`, `journal_entry_id`, `revision_number`, `title`, `summary`, `body` (format — markdown/rich text/etc. — undecided, owned by a future design decision, not fixed here), `published_at` (set automatically by the system at the moment this revision becomes the published one — never directly admin-editable — used for "newest first" public ordering), `created_at`, `created_by`

Media attachment is via `journal_media`, keyed to the revision — see below.

### `media`
Entirely new — `NOT IMPLEMENTED`. Backing store target: R2 (`NOT IMPLEMENTED`, per `docs/ARCHITECTURE.md` "after the content and authorization boundaries are tested"). Media itself is binary content with a simple lifecycle, not editorial text needing draft/publish revisioning, so it does not use the entity+revisions pattern; its `state` field is bookkeeping (is this blob still referenced by anything) and is never itself consulted by public rendering — public rendering only ever reaches `media` rows through a published revision's `project_media`/`journal_media` rows (see below), so an orphaned-but-`active` media row is simply unreferenced, not publicly exposed. **`storage_key`, `content_type`, `size_bytes`, and `alt_text` are immutable after creation** — see "Media immutability" above; only `state` may change on an existing row.
- `id`
- `storage_key` (R2 object key), `content_type`, `size_bytes`, `alt_text` — immutable once set
- `uploaded_at`, `uploaded_by`
- `state` (e.g. `active`/`archived` — an unused, orphaned media item should be distinguishable from one actively referenced by a project/journal entry) — the one field on this row that may change after creation

### `project_media` (junction table — `AS10-R004`, revision-scoped per `AS10-R008`, immutable-once-created per `AS10-R011`)
Structurally truthful relational target for "a project revision has media." Keyed to the **revision**, not the base `projects` entity — attaching/reordering media on a draft must not change what the published revision shows, exactly like every other public-affecting value in this spec. **Once a row exists for a given revision, `media_id`/`role`/`order` are not edited in place** — see "Junction-row immutability" above; changing an attachment means creating/editing the *draft* revision's own rows, not this row.
- `project_revision_id` → `project_revisions.id`
- `media_id` → `media.id` — immutable once set for this row
- `role` (e.g. `cover`, `gallery`) — immutable once set for this row
- `order` — immutable once set for this row

### `journal_media` (junction table — `AS10-R004`, revision-scoped per `AS10-R008`, immutable-once-created per `AS10-R011`)
Same pattern as `project_media`, for journal entries.
- `journal_entry_revision_id` → `journal_entry_revisions.id`
- `media_id` → `media.id` — immutable once set for this row
- `role` — immutable once set for this row
- `order` — immutable once set for this row

If a future implementation increment chooses a JSON-array column instead of these junction tables for either relationship, that choice must say explicitly that referential integrity is **application-enforced**, not a database foreign key, and must still key the array to the revision, not the base entity, and treat each array entry as immutable once created, to preserve the publication invariant.

### `theme_settings` / `theme_settings_revisions`
Successor concept for `DESIGN-001`…`014`. A design/theme change is editorial content with the same "must not silently replace what's live" property as a project edit.
- `theme_settings`: `id` (singleton), `created_at`, `published_revision_id`, `draft_revision_id`
- `theme_settings_revisions`: `id`, `theme_settings_id`, `revision_number`, one field per `DESIGN-*` control, each constrained to a validated/allowed range or enum — never free-form CSS/JS (`DESIGN-014`, mirrors the current pattern in `lib/content/schema.mjs` where every field has an explicit validator), `created_at`, `created_by`

### `audit_log`
Entirely new — `NOT IMPLEMENTED`. Required for `ADM-REQ-012`, `WEB-SEC-009`. Append-only event record, not editorial content, so no revision pair — an audit row is immutable history the moment it is written, which already satisfies the spirit of "immutable metadata only" without needing pointers at all.
- `id`, `occurred_at`
- `actor` (admin identity reference)
- `action` (e.g. `create`, `update`, `publish`, `unpublish`, `delete`, `upload`)
- `entity_type`, `entity_id`, `revision_id` (nullable — set when the action is revision-scoped, e.g. `publish`)
- `result` (`success`/`failure`) — a failed write must be logged as failed, never silently omitted or logged as success (`ADM-REQ-016`, `WEB-SEC-012`)
- append-only; audit rows are not user-editable or user-deletable through the admin surface

### Admin identity references

The exact identity/authentication mechanism (provider, session format) is `NOT IMPLEMENTED` and out of this document's scope (owned by `TECHNICAL_DESIGN.md`'s future work, gated by its own authorization). This spec only records that every revision row above carries a `created_by` reference (and `media`/`audit_log` their own `uploaded_by`/`actor`) to whatever that identity mechanism ultimately is, so auditability (`ADM-REQ-012`) is possible from day one of any future implementation rather than retrofitted later. Base entity rows no longer carry an `updated_by` (removed per the base-entity-shape rule above) — "who last changed this" is answered by the latest revision's `created_by`, not a duplicated base-row column.

## Relationships

```
site_settings ──published/draft──> site_settings_revisions
navigation (many) ──published/draft──> navigation_revisions
foundations (many) ──published/draft──> foundation_revisions
services (many) ──published/draft──> service_revisions
process_steps (many) ──published/draft──> process_step_revisions
sections (many) ──published/draft──> section_revisions

projects (many) ──published/draft──> project_revisions
project_revisions (many) ──via project_media──> media (many)

journal_entries (many) ──published/draft──> journal_entry_revisions
journal_entry_revisions (many) ──via journal_media──> media (many)

theme_settings ──published/draft──> theme_settings_revisions

audit_log (many) ──entity_type/entity_id/revision_id──> any of the above
```

`project_media` and `journal_media` key off `project_revisions.id`/`journal_entry_revisions.id`, not the base `projects`/`journal_entries` row — this is the `AS10-R008` correction: media attachment order/role is exactly the kind of public-affecting value that must live behind the same publish boundary as everything else, so a draft's media reordering cannot change what the currently published revision displays. Per `AS10-R011`, both the junction rows and the `media` rows they point at are immutable once created, closing the remaining gap where an existing row could be edited in place regardless of which revision it belonged to. No entity above has a foreign key into `audit_log`; `audit_log` references outward, never the reverse, so deleting an audited entity must not be allowed to delete its audit trail (append-only invariant).

## IDs, states, timestamps

- **IDs:** reuse the existing constraint — `^[a-z][a-z0-9-]{0,79}$` (`lib/content/schema.mjs`'s `id` validator) — for every stable identifier, unless a future decision explicitly changes the ID scheme.
- **Slugs:** immutable after creation — see "Slug semantics" above. Never revisioned, never present on a revision row.
- **Status:** derived from `(published_revision_id, draft_revision_id)` only — no stored `lifecycle_state` or equivalent flag on any base entity (see "Entity status is derived, not stored" above). `audit_log` uses `success`/`failure`, since it is a record of an event, not editable content.
- **Ordering:** every entity type with an editorial order (`navigation`, `foundations`, `projects`, `services`, `process_steps`, `sections`, and the `project_media`/`journal_media` junction rows) carries `order` on its revision row (or, for the junction tables, on the junction row itself, which is already revision-scoped) — never on the base entity. Junction-row `order` is additionally immutable once the row is created (`AS10-R011`) — a reorder is a new draft-revision junction row, never an in-place edit.
- **Media immutability:** `media.storage_key`/`content_type`/`size_bytes`/`alt_text` and `project_media`/`journal_media`'s `media_id`/`role`/`order` are immutable once created (`AS10-R011`) — see "Media immutability" and "Junction-row immutability" above.
- **Timestamps:** base entities carry only `created_at` (immutable, set once). Revisions carry `created_at`/`created_by`. `audit_log` uses `occurred_at`. `meta.updatedAt`'s current `YYYY-MM-DD` granularity (`lib/content/schema.mjs`) is likely insufficient for an audit-grade timestamp and should become a full ISO 8601 timestamp in any real implementation — this is a design note, not a decision.

## Validation

Any future implementation must extend the existing validation philosophy rather than inventing a weaker one: reject unknown fields, reject unsafe/uncontrolled link targets and HTML/control characters, enforce enum/range constraints per field, enforce slug uniqueness and reserved-slug exclusion at creation time, and validate the entire revision server-side even if a client already validated it (`WEB-SEC-004`, `006`; mirrors `lib/content/schema.mjs`'s current `validateContent()` behavior, which must remain authoritative for anything it already covers unless deliberately superseded). A draft revision is validated at creation time against the same rules as a published one; publish re-validates in full, never trusting the draft-time result.

## Authorization boundaries

Every mutation path (create/update/publish/unpublish/delete/upload) must be gated server-side by the (currently nonexistent) authentication/authorization boundary — never trust a client-side check alone (`WEB-SEC-002`, `007`, `008`). Read access to any `draft_revision_id` content must be restricted to authenticated admins; the public read path must only ever follow `published_revision_id`, exactly as `lib/content/public.mjs` already guarantees for the current single-file model. This protected read path does not exist yet and cannot be retrofitted onto the current static/asset-only deployment without first standing up a server-side data-access substrate (see `TECHNICAL_DESIGN.md` § "Proposed target architecture" and `BUILD_PLAN.md`'s `WEB-INC-002` disposition, `AS10-R006`).

## Auditability

`audit_log` is the target mechanism for `ADM-REQ-012`/`WEB-SEC-009`. Until it exists, there is no auditability for admin actions because there are no admin actions — this is `NOT YET APPLICABLE`, not `MITIGATED` (`brain/RISK_REGISTER.md` `RISK-WEB-014`).

## Migration considerations

- **From:** `data/site.js` (single Git-committed JS object, validated at build time, deployed via static rebuild).
- **To:** D1-backed tables above (`PROPOSED TARGET`).
- A migration must preserve every currently `published` record's visible content and ordering (`TEST-DATA-001`, `RISK-WEB-015`) and must not accidentally publish anything currently `draft`/`archived` (`TEST-DATA-002`). Concretely: every current `published` record becomes a revision (carrying its current `order`) with `published_revision_id` pointing at it; every current `draft` record becomes a revision with only `draft_revision_id` set; every current `archived` record's last known content is preserved as a revision row for history, with **both** `published_revision_id` and `draft_revision_id` left null on the base entity (per "Entity status is derived, not stored" above — there is no separate `lifecycle_state: archived` value to set).
- Every current domain listed in the mapping table above must have a target representation before migration can be considered complete — `foundations`, `services`, and `process.steps` are not optional/deferrable parts of that migration (`AS10-R003`); nor is `sections`' revision pair, now that section visibility/order is revisioned (`AS10-R008`).
- Git history remains the rollback mechanism for the current model (`RISK-WEB-003`); a database-backed model needs its own explicit backup/rollback design before it can claim equivalent safety — this document does not assume D1 automatically inherits Git's rollback property.
- No migration is authorized or performed by this cycle. This section is a design constraint list for whichever future increment proposes the actual migration.

## Rollback / data-loss considerations

- A future write path must never report success on a failed write (`ADM-REQ-016`, `WEB-SEC-012` — see `APP_FLOW.md` §2h).
- The revision model itself is the primary rollback mechanism for editorial content going forward: publishing never deletes a prior revision, and unpublish is a pointer change, not a delete (`RISK-WEB-003`/`RISK-WEB-007`).
- Media and junction-row immutability (`AS10-R011`) extends the same rollback property to media: because an existing `media` row and its junction rows are never edited in place, rolling back to a prior revision (were that ever supported by a future increment) automatically restores the exact media/role/order that revision originally shipped with — there is no shared mutable state between revisions to reconcile.
- Until D1/R2 exist, none of the above risk controls can be implemented — they remain design intentions here, not evidenced mitigations.

## Context-efficiency note

This spec does not restate the full `ADM-REQ-*`/`DESIGN-*`/`WEB-SEC-*` prose; see `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §10 (`ADM-REQ-*`), §11 (`DESIGN-*`), §13 (`WEB-SEC-*`) (`AS10-R007`). It does not restate Sentinel evidence-class or governance rules; see `devos/governance/*`.
