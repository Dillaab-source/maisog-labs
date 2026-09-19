# MaisogLabs Data & Backend Spec

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK — PROPOSED TARGET / NOT IMPLEMENTED (except where marked current)` — **Remediation Cycle 3 (final)** (resolves `AS10-R011` against `ML-DEVOS-AS-010`; preserves Cycle 1's `AS10-R003`/`AS10-R004`/`AS10-R007` and Cycle 2's `AS10-R008` resolutions)

Owns proposed data/API/storage contracts at **design/specification level only**. This document does not provision D1, does not provision R2, does not create an API, and does not migrate `data/site.js` (`AS10-F012`). Everything under "Proposed entities" is `PROPOSED TARGET / NOT IMPLEMENTED` unless explicitly marked otherwise.

## Public rendering invariant (binding, `AS10-R008`, closed end-to-end per `AS10-R011`)

> Every mutable value that can affect public presentation is sourced from published revision/state only. Draft changes cannot alter public output before publish.

Restated precisely, so it covers the whole public read graph, not only content-revision fields (`AS10-R011`):

> Every mutable value that can affect public presentation is either (A) contained inside a revision, or (B) immutable once referenced by that revision. Therefore draft changes cannot alter public output before publish.

Every entity definition and relationship below is designed to make this literally true. Cycle 1 introduced the `published_revision_id`/`draft_revision_id` pointer pattern but left several public-affecting fields (ordering, section visibility, an entity-level lifecycle flag, junction-table attachment order) on the base/logical row, outside the revision boundary. Cycle 2 closed that for ordinary entities by defining the base/logical entity as **identity + immutable metadata + revision pointers only**, and re-keyed the `project_media`/`journal_media` junction tables to the revision. One hole remained after Cycle 2: a `media` row or an existing revision's junction row could still be **edited in place**, changing what a published revision displays without any publish step at all — the value would still technically be "reached through" a revision, but nothing stopped it from being mutated after the fact. This cycle closes that hole by declaring both classes of record immutable once they are load-bearing for a revision (see "Media immutability" and "Junction-row immutability" below) — option (B) above.

## Current storage model — `CURRENTLY IMPLEMENTED`

Three-way model, current as of `WEB-INC-005` (`brain/PROJECT_GOVERNANCE.md` § "Current storage model"):

1. **Public authoritative source/read path** — Local, Git-backed content only. `data/site.js` (`siteContent`), validated by `lib/content/schema.mjs` and projected by `lib/content/public.mjs` through `lib/content/local.mjs`/`app/page.js`, remains the sole source the actual public build reads. Unchanged by `WEB-INC-005`.
2. **Local/repository D1 substrate** — `IMPLEMENTED`, local-only, under `WEB-INC-005` (`ML-DEVOS-RFC-003`/`ML-DEVOS-AS-013`/`D-024`): `migrations/0001_web_inc_005_init.sql` (exactly the 14 entity/revision tables in the mapping table below), `worker/d1/*`. Migration/parity/integrity-tested against source (1) above; not read by any public/admin code path.
3. **Remote/production D1** — does **not** exist and is not authorized (`REMOTE_D1_AUTHORIZED: NO`).

No R2/media storage exists in any of the three.

The entire current *public* data contract is one exported JS object (`data/site.js`, `siteContent`), validated by `lib/content/schema.mjs` and projected by `lib/content/public.mjs`. Its existing shape (field names, types, and constraints) is the baseline any proposed entity below must be able to represent without silently dropping capability, unless a future `ARCHITECTURE`-class decision explicitly changes that (`brain/DECISION_LOG.md` D-007). No-cutover invariant, unchanged: `D1 EXISTS LOCALLY ≠ D1 IS PUBLIC SOURCE` (`ML-DEVOS-AS-013`) — nothing in this document authorizes or describes a completed cutover.

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

**`WEB-INC-005` implementation note (`ML-DEVOS-RFC-003` → `ML-DEVOS-AS-013` → `D-024`):** the `site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, and `sections` entity/revision pairs below are now `IMPLEMENTED` as local-only D1 tables — see `migrations/0001_web_inc_005_init.sql` and `worker/d1/*` — with the base-entity shape, derived-status model, and cross-entity pointer-ownership rule in this section all enforced exactly as specified (the latter via a composite foreign key `(id, published_revision_id) REFERENCES <entity>_revisions(<entity>_id, id)`, since a plain per-column foreign key cannot express it). `journal_entries`/`journal_entry_revisions`/`journal_media`, `media`/`project_media`, and `theme_settings`/`theme_settings_revisions` remain `PROPOSED TARGET / NOT IMPLEMENTED`, owned by their own later increments per `BUILD_PLAN.md` §C. `audit_log` is now `IMPLEMENTED` as a local-only append-only substrate under `WEB-INC-008` (`ML-DEVOS-RFC-005` → `ML-DEVOS-AS-017` → `D-026`) — see its own entity section below for the exact scope of what that does and does not mean. This local substrate is not yet the public source of truth — see `brain/PROJECT_GOVERNANCE.md` § "Current storage model".

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
Required for `ADM-REQ-012`, `WEB-SEC-009`. Append-only event record, not editorial content, so no revision pair — an audit row is immutable history the moment it is written, which already satisfies the spirit of "immutable metadata only" without needing pointers at all.
- `id`, `occurred_at`
- `actor` (admin identity reference)
- `action` (e.g. `create`, `update`, `publish`, `unpublish`, `delete`, `upload`)
- `entity_type`, `entity_id`, `revision_id` (nullable — set when the action is revision-scoped, e.g. `publish`)
- `result` (`success`/`failure`) — a failed write must be logged as failed, never silently omitted or logged as success (`ADM-REQ-016`, `WEB-SEC-012`)
- append-only; audit rows are not user-editable or user-deletable through the admin surface

**`WEB-INC-008` implementation note (`ML-DEVOS-RFC-005` → `ML-DEVOS-AS-017` → `D-026`):** this table is now `IMPLEMENTED` as a local-only D1 table exactly as specified above — see `migrations/0002_web_inc_008_audit_log.sql` and `worker/d1/audit.mjs`. Append-only is enforced at both layers: the application exposes only a bounded writer (`appendAuditEvent(db, event)`, which always validates via `validateAuditEvent` and always generates `occurred_at` itself) with no update/delete helper of any kind, and the database itself rejects any direct `UPDATE`/`DELETE` against `audit_log` via `BEFORE UPDATE`/`BEFORE DELETE` triggers that unconditionally `RAISE(ABORT, ...)` — proven both by `tests/d1-audit.test.mjs` and by a direct `wrangler d1 execute --local` probe (see `coordination/IMPLEMENTER_HANDOFF.md`). Implementing this substrate does **not** mean any admin action is auditable yet: `WEB-INC-008` proves only that the substrate itself works in isolation, since no admin mutation/action capability exists to call it (`MUTATION_AUTHORIZED: NO`; see `brain/RISK_REGISTER.md` `RISK-WEB-014`, still `NOT YET APPLICABLE`). Proving that a real mutation emits a row into this table is `WEB-INC-003`'s acceptance criterion, not this increment's.

### Admin identity references

As of `WEB-INC-001` (`ML-DEVOS-RFC-002`/`ML-DEVOS-AS-011`/`D-023`), a Cloudflare Access JWT assertion **authentication boundary** is `IMPLEMENTED` at repository level (`worker/index.mjs`/`worker/auth.mjs`, fail-closed-verified for `/admin`/`/admin/*`) — this is not `NOT IMPLEMENTED` in the blanket sense this section previously stated. What remains `NOT IMPLEMENTED`, and is what this section actually scopes, is narrower:

- a **persistent admin identity/session representation** (no identity/session table or record exists anywhere in this repository, including the `WEB-INC-005` D1 substrate — the verified Cloudflare Access assertion is checked per-request and nothing about the requester is stored);
- **editorial identity binding for future writes** (a future mutation capability's `created_by`/`actor` values binding to a verified admin identity, as opposed to `WEB-INC-005`'s migration-only textual provenance `migration:web-inc-005` — see "Publication / revision model" above);
- a **production Cloudflare Access application** (no production Access application, policy, or identity-provider configuration has been configured or verified; only the repository-level fail-closed check has been implemented and locally tested).

This spec only records that every revision row above carries a `created_by` reference (and `media`/`audit_log` their own `uploaded_by`/`actor`) to whatever that future verified-identity mechanism ultimately is, so auditability (`ADM-REQ-012`) is possible from day one of any future implementation rather than retrofitted later. Nothing in this section implies a persistent session store or admin identity database exists today — none does. Base entity rows no longer carry an `updated_by` (removed per the base-entity-shape rule above) — "who last changed this" is answered by the latest revision's `created_by`, not a duplicated base-row column.

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

Two distinct capabilities, not one — do not conflate them:

- **Authentication boundary:** `IMPLEMENTED` at repository level under `WEB-INC-001` — a Cloudflare Access JWT assertion is fail-closed-verified server-side for `/admin`/`/admin/*` (`worker/index.mjs`/`worker/auth.mjs`).
- **Mutation/editorial authorization capability:** `IMPLEMENTED` for `projects` only, as of `WEB-INC-003` (`ML-DEVOS-RFC-006`/`ML-DEVOS-AS-020`/`D-027`) — `NOT IMPLEMENTED` for every other content domain (navigation, foundations, services, process steps, sections, site settings), and no delete/upload path exists anywhere in this repository. Every mutation path is gated server-side by its own authorization check (a bounded non-empty verified Access `sub`, checked after the existing fail-closed authentication) — never a client-side check alone (`WEB-SEC-002`, `007`, `008`) — and the authentication boundary itself never substituted for that authorization; `WEB-INC-003` adds the authorization check as its own explicit gate.

Read access to any `draft_revision_id` content must be restricted to authenticated admins; the public read path must only ever follow `published_revision_id`, exactly as `lib/content/public.mjs` already guarantees for the current single-file model. The current reality, precisely, as of `WEB-INC-003` (`ML-DEVOS-RFC-006`/`ML-DEVOS-AS-020`/`D-027`):

`AUTH BOUNDARY EXISTS` + `LOCAL SERVER-SIDE D1 SUBSTRATE EXISTS` + `BOUNDED READ-ONLY DASHBOARD ENDPOINT EXISTS` + `BOUNDED PROJECT MUTATION CAPABILITY EXISTS` ≠ `REMOTE/PRODUCTION D1 EXISTS` ≠ `PUBLIC D1 CUTOVER EXISTS`

- the deployment is **not** globally asset-only: `/admin`/`/admin/*` has a selective Worker-first auth path (`WEB-INC-001`);
- `WEB-INC-005` (`ML-DEVOS-RFC-003`/`ML-DEVOS-AS-013`/`D-024`) added a **local, server-only D1 repository/data-access substrate** (`worker/d1/repository.mjs`) capable of reading published/draft revisions and reconstructing the current-content projection;
- `WEB-INC-002` (`ML-DEVOS-RFC-004`/`ML-DEVOS-AS-015`/`D-025`) connected that substrate to exactly one authenticated, read-only editorial data endpoint — `GET /admin/api/dashboard` (`worker/admin/dashboard.mjs`) — that returns an explicit allowlisted status projection (id, slug where applicable, derived lifecycle state, published/draft revision IDs, a bounded display label, and a sections-only order/visible summary) for `site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, and `sections`. Authentication is verified before any route/method dispatch or D1 read; every non-GET method and every unrecognized `/admin/api/*` path is rejected before any D1 call. This endpoint remains **read-only, unchanged by `WEB-INC-003`**;
- `WEB-INC-008` (`ML-DEVOS-RFC-005`/`ML-DEVOS-AS-017`/`D-026`) added the append-only `audit_log` substrate;
- `WEB-INC-003` (`ML-DEVOS-RFC-006`/`ML-DEVOS-AS-020`/`D-027`) composes all three into the first bounded editorial write capability: `worker/admin/projects.mjs` + `worker/d1/projects.mjs` expose exactly `POST /admin/api/projects`, `PUT /admin/api/projects/:id/draft`, `GET /admin/api/projects/:id/preview`, `POST /admin/api/projects/:id/publish`, `POST /admin/api/projects/:id/unpublish` — no delete, no generic mutation API, no other content-domain mutation. Every successful mutation commits atomically with a success `audit_log` row;
- public rendering still reads only `data/site.js` (unchanged by `WEB-INC-001`, `WEB-INC-005`, `WEB-INC-002`, `WEB-INC-008`, or `WEB-INC-003`) — a local D1 "publish" does not change what the public site serves (`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE`, `AS20-F015`);
- remote/production D1 does not exist and is not authorized (`REMOTE_D1_AUTHORIZED: NO`); no public D1 cutover, project delete, or other content-domain mutation, CRUD, media, journal, or theme capability exists. `MUTATION_AUTHORIZED: YES` applies only to this exact bounded `WEB-INC-003` project capability (`AS20-F020`) and resets to `NO` on cycle closure.

This does not broaden any implementation claim beyond what now exists: the dashboard read endpoint is bounded and allowlisted, it is not a general-purpose draft/content export or admin API, and it does not itself grant, or substitute for, future mutation authorization.

## Auditability

`audit_log` is the target mechanism for `ADM-REQ-012`/`WEB-SEC-009`. As of `WEB-INC-008` (`ML-DEVOS-RFC-005` → `ML-DEVOS-AS-017` → `D-026`), the append-only substrate itself exists (`migrations/0002_web_inc_008_audit_log.sql`, `worker/d1/audit.mjs`) and is proven append-only/fail-closed in isolation. As of `WEB-INC-003` (`ML-DEVOS-RFC-006` → `ML-DEVOS-AS-020` → `D-027`), real admin actions now call it: every successful project create-draft/edit-draft/publish/unpublish appends exactly one `result: success` row atomically with the business mutation, and bounded authenticated failures append a `result: failure` row when a safe entity reference exists. `brain/RISK_REGISTER.md` `RISK-WEB-014` accordingly moves from `NOT YET APPLICABLE` to `MITIGATED` for this exact mutation set — auditability for every other admin action (media, journal, theme, project delete) remains `NOT YET APPLICABLE` until its own increment exists.

## Migration considerations

- **From:** `data/site.js` (single Git-committed JS object, validated at build time, deployed via static rebuild).
- **To:** D1-backed tables above (`PROPOSED TARGET`).
- A migration must preserve every currently `published` record's visible content and ordering (`TEST-DATA-001`, `RISK-WEB-015`) and must not accidentally publish anything currently `draft`/`archived` (`TEST-DATA-002`). Concretely: every current `published` record becomes a revision (carrying its current `order`) with `published_revision_id` pointing at it; every current `draft` record becomes a revision with only `draft_revision_id` set; every current `archived` record's last known content is preserved as a revision row for history, with **both** `published_revision_id` and `draft_revision_id` left null on the base entity (per "Entity status is derived, not stored" above — there is no separate `lifecycle_state: archived` value to set).
- Every current domain listed in the mapping table above must have a target representation before migration can be considered complete — `foundations`, `services`, and `process.steps` are not optional/deferrable parts of that migration (`AS10-R003`); nor is `sections`' revision pair, now that section visibility/order is revisioned (`AS10-R008`).
- Git history remains the rollback mechanism for the current model (`RISK-WEB-003`); a database-backed model needs its own explicit backup/rollback design before it can claim equivalent safety — this document does not assume D1 automatically inherits Git's rollback property.
- During the original Product Build Pack documentation cycle that authored this section, no migration was authorized or performed — this section was, at that time, purely a design constraint list for whichever future increment might later propose the actual migration. That remains true as history and is not erased here.
- Since then, `WEB-INC-005` was separately authorized (`ML-DEVOS-RFC-003` → `ML-DEVOS-AS-013` → `D-024`) and implemented and locally exercised exactly this migration mechanism: `worker/d1/migrate.mjs` maps every current domain (including `services`) into the D1 revision substrate per the state-mapping rule above, deterministically and repeatably (`tests/d1-migration.test.mjs`). This migration is **local/repository only** — no remote D1 migration has occurred, no production D1 migration has occurred, and no public read-path cutover has occurred. `data/site.js` remains the actual public source; this section's constraint list still governs any future increment that would extend this migration toward a remote/production/public-cutover scope.

## Rollback / data-loss considerations

- A future write path must never report success on a failed write (`ADM-REQ-016`, `WEB-SEC-012` — see `APP_FLOW.md` §2h).
- The revision model itself is the primary rollback mechanism for editorial content going forward: publishing never deletes a prior revision, and unpublish is a pointer change, not a delete (`RISK-WEB-003`/`RISK-WEB-007`).
- Media and junction-row immutability (`AS10-R011`) extends the same rollback property to media: because an existing `media` row and its junction rows are never edited in place, rolling back to a prior revision (were that ever supported by a future increment) automatically restores the exact media/role/order that revision originally shipped with — there is no shared mutable state between revisions to reconcile.
- **Current state, precisely** (not the blanket "until D1/R2 exist" this sentence previously said — a local-only D1 revision substrate already exists under `WEB-INC-005`):
  - **Local D1 controls — implemented at repository/local level only, not production-verified:** the local D1 revision substrate, deterministic migration/seed, whole-run migration preflight, the all-or-nothing batched write phase, exact revision-pointer/provenance repeat-run equivalence checks, schema/integrity constraints (composite foreign keys, uniqueness, reserved-slug rejection), and local parity/integrity evidence (`tests/d1-migration.test.mjs`) all exist and are evidenced locally. None of this is production-verified, and none of it has been exercised against a real Cloudflare D1 resource.
  - **R2/media controls — `NOT IMPLEMENTED`:** R2 does not exist. Media storage, media mutation, media auditability, and media rollback controls remain future design/implementation work.
  - **Remote/production D1 — `NOT IMPLEMENTED`:** no remote/production D1 resource exists, no production migration has run, and no public site cutover to D1 has occurred.
  - **Admin mutation controls — `IMPLEMENTED` for `projects` only (`WEB-INC-003`):** create/edit-draft/publish/unpublish exist behind `worker/admin/projects.mjs`; no delete/rename/other-content-domain mutation and no admin media workflow exist. Rollback safety for this mutation set comes from the same revision-immutability property described above: publish/unpublish are pointer changes only, never a delete, and a failed mutation is proven (real-D1 test) to leave no partial state.
  - **Admin audit controls — `IMPLEMENTED` for the `WEB-INC-003` mutation set:** the append-only `audit_log` table and bounded writer (`WEB-INC-008`) are now called by every project create/edit/publish/unpublish (`WEB-INC-003`), atomically with the business mutation. Auditability for every other future admin action remains its own increment's responsibility.
  - The above controls are genuinely evidenced rollback/integrity mitigations, but only at the local D1 substrate's own scope: `LOCAL D1 EXISTS` ≠ `REMOTE/PRODUCTION D1 EXISTS` ≠ `PUBLIC CUTOVER COMPLETE` ≠ `ADMIN MUTATION/AUDIT CAPABILITY EXISTS`. Each of the latter three remains a design intention, not an evidenced mitigation, until its own separately authorized increment implements and evidences it.

## Context-efficiency note

This spec does not restate the full `ADM-REQ-*`/`DESIGN-*`/`WEB-SEC-*` prose; see `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §10 (`ADM-REQ-*`), §11 (`DESIGN-*`), §13 (`WEB-SEC-*`) (`AS10-R007`). It does not restate Sentinel evidence-class or governance rules; see `devos/governance/*`.
