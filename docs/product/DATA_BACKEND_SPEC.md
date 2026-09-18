# MaisogLabs Data & Backend Spec

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK — PROPOSED TARGET / NOT IMPLEMENTED (except where marked current)` — **Remediation Cycle 1** (resolves `AS10-R003`, `AS10-R004`, `AS10-R005`, `AS10-R007` against `ML-DEVOS-AS-010`)

Owns proposed data/API/storage contracts at **design/specification level only**. This document does not provision D1, does not provision R2, does not create an API, and does not migrate `data/site.js` (`AS10-F012`). Everything under "Proposed entities" is `PROPOSED TARGET / NOT IMPLEMENTED` unless explicitly marked otherwise.

## Current storage model — `CURRENTLY IMPLEMENTED`

Local, Git-backed content only. There is no database, no D1, no R2, no external persistence layer today (`brain/PROJECT_GOVERNANCE.md` § "Current storage model"). The entire current data contract is one exported JS object (`data/site.js`, `siteContent`), validated by `lib/content/schema.mjs` and projected by `lib/content/public.mjs`. Its existing shape (field names, types, and constraints) is the baseline any proposed entity below must be able to represent without silently dropping capability, unless a future `ARCHITECTURE`-class decision explicitly changes that (`brain/DECISION_LOG.md` D-007).

The current schema's top-level domains, every one of which is mapped below (`AS10-R003`): `meta`, `site`, `seo`, `navigation[]`, `hero`, `foundations[]`, `projects[]`, `services[]`, `process`, `process.steps[]`, `about`, `contact`, `projectSection`, `footer`. Every record-like collection (`navigation`, `foundations`, `projects`, `services`, `process.steps`) already carries `id`, `order`, and `state` (`draft`/`published`/`archived`).

## Current → target domain mapping (`AS10-R003`)

No current domain is dropped, silently merged into a free-form blob, or left unmapped. Where a domain is a records-array today, it gets its own target table (same treatment as `projects`/`navigation`, not a downgrade). Where a domain is a singleton content group, it becomes an explicitly typed, individually validated substructure inside `site_settings` — never an opaque/untyped JSON field — so today's per-field validation (`lib/content/schema.mjs`) has a direct successor.

| Current domain | Target storage representation | Notes / migration rule |
|---|---|---|
| `meta` (schemaVersion, contentVersion, state, locale, updatedAt) | Split: `schema_version`/`content_version`/`locale` become `site_settings` columns; the root `state` (published-required-for-build gate) is superseded by `site_settings.published_revision_id`/`draft_revision_id` (see "Publication / revision model" below) | The current root-level "whole document must be published" gate has no direct target equivalent once revisioning is per-entity; a future increment must decide whether a root-level "site is live at all" flag is still needed, as an explicit design note, not a silent drop |
| `site` (name, location, timezone, tagline) | Typed substructure `site_settings.site` | Individually validated fields, mirroring `lib/content/schema.mjs`'s `site` group |
| `seo` (title, description, canonicalUrl) | Typed substructure `site_settings.seo` | Same pattern; `canonicalUrl` keeps its current `https:`-only/no-credentials/no-query/no-fragment validator |
| `navigation[]` | `navigation` + `navigation_revisions` | Specified below; now follows the entity+revisions pattern (`AS10-R005`), superseding the flat-table form from the prior Builder cycle |
| `hero` (eyebrow, title, description, primaryAction, secondaryAction, bridgeLabel, bridgeStatement) | Typed substructure `site_settings.hero` | Preserves the current `lines`/`action` sub-shapes as typed fields, not a blob |
| `foundations[]` | **New dedicated entity `foundations` + `foundation_revisions`** (entity: `id`, `order`, `lifecycle_state`, `published_revision_id`, `draft_revision_id`; revision: `icon`, `label`, `href`, `text`) | Currently rendered (`app/page.js` foundation dock); must not be demoted to an untyped list — gets the same entity+revisions treatment as `navigation`/`projects` (see "Publication / revision model" below) |
| `projects[]` | `projects` + `project_revisions` | See "Proposed entities" below |
| `services[]` | **New dedicated entity `services` + `service_revisions`** (entity: `id`, `order`, `lifecycle_state`, `published_revision_id`, `draft_revision_id`; revision: `title`, `summary`) | Currently validated and retained even though not rendered today (`docs/CONTENT.md`: "modeled for a later section"). Preserved as its own entity by default. **If a future product decision intends to retire `services` instead of eventually rendering it, that must be a separate, explicit future architecture/product decision — this spec does not retire it silently.** |
| `process` (kicker, title) | Typed substructure `site_settings.process` | Header/kicker copy for the process section |
| `process.steps[]` | **New dedicated entity `process_steps` + `process_step_revisions`** (entity: `id`, `order`, `lifecycle_state`, `published_revision_id`, `draft_revision_id`; revision: `icon`, `title`, `text`) | Currently rendered (`app/page.js` process section); same entity+revisions treatment as `foundations` |
| `about` (kicker, title, body, quote, quoteAttribution) | Typed substructure `site_settings.about` | — |
| `contact` (email, callToAction, headerLabel) | Typed substructure `site_settings.contact` | `email` keeps its current RFC-shape validator |
| `projectSection` (kicker, title, description, emptyMessage) | Typed substructure `site_settings.projectSection` | Preserves the current empty-state message contract (`UI_UX_SPEC.md` § "Loading / empty / error / success / unauthorized states") |
| `footer` (statement, copyright) | Typed substructure `site_settings.footer` | — |

No current domain is represented as an untyped/free-form JSON blob. Every `site_settings.*` substructure above is proposed as its own individually validated shape (successor to the corresponding block in `lib/content/schema.mjs`'s `schema` object), and every records-array domain gets its own entity+revisions pair with the same `id`/`order` discipline the current schema already applies, plus the `published_revision_id`/`draft_revision_id` pattern defined in "Publication / revision model" below in place of the current flat `state` field.

## Proposed entities — `PROPOSED TARGET / NOT IMPLEMENTED`

All entities below are design proposals for a future D1 schema. Field lists are illustrative and derived from the current `data/site.js` shape plus the `ADM-REQ-*`/`DESIGN-*` catalog they must support — a future `TECHNICAL_DESIGN.md`/RFC-equivalent still needs to finalize exact column types, indexes, and migrations before implementation.

### `site_settings`
Singleton logical entity for the typed substructures mapped above (`site`, `seo`, `hero`, `about`, `contact`, `footer`, `projectSection`, `process`).
- `id` (fixed singleton key)
- `schema_version`, `content_version`
- `published_revision_id`, `draft_revision_id` — see "Publication / revision model"
- `updated_at`, `updated_by`

### `site_settings_revisions`
- `id`, `site_settings_id`, `revision_number`
- one column/typed-substructure per mapped domain above (`site`, `seo`, `hero`, `about`, `contact`, `footer`, `projectSection`, `process`)
- `created_at`, `created_by`

### `navigation` / `navigation_revisions`
Successor to `navigation[]`, using the same entity+revisions pattern as `projects` (see below).
- `navigation`: `id` (stable slug, matches current `^[a-z][a-z0-9-]{0,79}$`), `order`, `lifecycle_state` (`active`/`archived`), `published_revision_id`, `draft_revision_id`
- `navigation_revisions`: `id`, `navigation_id`, `revision_number`, `label`, `href` (must remain constrained the way `lib/content/schema.mjs`'s `href()` constrains it today — anchor targets and validated `mailto:` only, or an explicitly widened, re-validated allowlist), `created_at`, `created_by`

### `foundations` / `foundation_revisions`
Successor to `foundations[]` (`AS10-R003`). Same entity+revisions pattern.
- `foundations`: `id`, `order`, `lifecycle_state`, `published_revision_id`, `draft_revision_id`
- `foundation_revisions`: `id`, `foundation_id`, `revision_number`, `icon`, `label`, `href`, `text`, `created_at`, `created_by`

### `sections`
New concept, not present in the current schema as a first-class entity (today, section identity is implicit in `navigation`/`foundations`/`projectSection`/`process`). Represents admin-controlled section visibility/order (`DESIGN-002`, `DESIGN-003`). No content body, so no revision pair is needed here — a visibility/order toggle is a single current value, not editorial content with a draft/published distinction.
- `id` (matches an existing anchor/section key, e.g. `home`, `projects`, `process`, `about`)
- `order`, `visible` (boolean)

### `projects` / `project_revisions`
Successor to `projects[]`. See "Publication / revision model" for the full pattern this follows.
- `projects`: `id`, `slug` (unique; must remain disjoint from reserved section slugs — `home`, `projects`, `process`, `about`, `main-content` — exactly as `lib/content/schema.mjs`'s `validateContent()` already enforces), `order`, `lifecycle_state` (`active`/`archived` — whether the project exists at all), `published_revision_id`, `draft_revision_id`
- `project_revisions`: `id`, `project_id`, `revision_number`, `category`, `title`, `summary`, `stack` (typed list), `accent`, `icon`, `featured` (boolean), `created_at`, `created_by`

Media attachment is via `project_media` (junction table), not an inline array — see "Media relationships" below (`AS10-R004`).

### `services` / `service_revisions`
Successor to `services[]` (`AS10-R003`). Same entity+revisions pattern as `foundations`.
- `services`: `id`, `order`, `lifecycle_state`, `published_revision_id`, `draft_revision_id`
- `service_revisions`: `id`, `service_id`, `revision_number`, `title`, `summary`, `created_at`, `created_by`

### `process_steps` / `process_step_revisions`
Successor to `process.steps[]` (`AS10-R003`). Same entity+revisions pattern as `foundations`.
- `process_steps`: `id`, `order`, `lifecycle_state`, `published_revision_id`, `draft_revision_id`
- `process_step_revisions`: `id`, `process_step_id`, `revision_number`, `icon`, `title`, `text`, `created_at`, `created_by`

### `journal_entries` / `journal_entry_revisions`
Entirely new — `NOT IMPLEMENTED`, no equivalent exists in `data/site.js` or `lib/content/schema.mjs` today (`brain/GOVERNANCE_MAP.md` row "Journal": `NOT STARTED`). Same entity+revisions pattern as `projects`.
- `journal_entries`: `id`, `slug` (unique, same disjointness rule as `projects.slug`), `order` or `published_at`-based ordering, `lifecycle_state`, `published_revision_id`, `draft_revision_id`
- `journal_entry_revisions`: `id`, `journal_entry_id`, `revision_number`, `title`, `summary`, `body` (format — markdown/rich text/etc. — undecided, owned by a future design decision, not fixed here), `created_at`, `created_by`

Media attachment is via `journal_media` (junction table) — see below.

### `media`
Entirely new — `NOT IMPLEMENTED`. Backing store target: R2 (`NOT IMPLEMENTED`, per `docs/ARCHITECTURE.md` "after the content and authorization boundaries are tested"). Media itself is binary content with simple lifecycle, not editorial text needing draft/publish revisioning, so it does not use the entity+revisions pattern.
- `id`
- `storage_key` (R2 object key), `content_type`, `size_bytes`, `alt_text`
- `uploaded_at`, `uploaded_by`
- `state` (e.g. `active`/`archived` — an unused, orphaned media item should be distinguishable from one actively referenced by a project/journal entry)

### `project_media` (junction table — `AS10-R004`)
Structurally truthful relational target for "a project has media." Replaces the prior `media_ids[]` array field, which cannot itself provide database-enforced referential integrity in D1/SQLite.
- `project_id` → `projects.id`
- `media_id` → `media.id`
- `role` (e.g. `cover`, `gallery`)
- `order`

### `journal_media` (junction table — `AS10-R004`)
Same pattern as `project_media`, for journal entries.
- `journal_entry_id` → `journal_entries.id`
- `media_id` → `media.id`
- `role`
- `order`

If a future implementation increment chooses a JSON-array column instead of these junction tables for either relationship (e.g. for a low-traffic entity where the extra join is not worth it), that choice must say explicitly that referential integrity is **application-enforced**, not a database foreign key — this spec's default proposal is the junction-table form precisely so that does not need to be true.

### `theme_settings` / `theme_settings_revisions`
Successor concept for `DESIGN-001`…`014`. Not present as a first-class entity today. Same entity+revisions pattern — a design/theme change is editorial content with the same "must not silently replace what's live" property as a project edit.
- `theme_settings`: `id` (singleton), `published_revision_id`, `draft_revision_id`, `updated_at`, `updated_by`
- `theme_settings_revisions`: `id`, `theme_settings_id`, `revision_number`, one field per `DESIGN-*` control, each constrained to a validated/allowed range or enum — never free-form CSS/JS (`DESIGN-014`, mirrors the current pattern in `lib/content/schema.mjs` where every field has an explicit validator), `created_at`, `created_by`

### `audit_log`
Entirely new — `NOT IMPLEMENTED`. Required for `ADM-REQ-012`, `WEB-SEC-009`. Append-only event record, not editorial content, so no revision pair.
- `id`, `occurred_at`
- `actor` (admin identity reference)
- `action` (e.g. `create`, `update`, `publish`, `unpublish`, `delete`, `upload`)
- `entity_type`, `entity_id`, `revision_id` (nullable — set when the action is revision-scoped, e.g. `publish`)
- `result` (`success`/`failure`) — a failed write must be logged as failed, never silently omitted or logged as success (`ADM-REQ-016`, `WEB-SEC-012`)
- append-only; audit rows are not user-editable or user-deletable through the admin surface

### Admin identity references

The exact identity/authentication mechanism (provider, session format) is `NOT IMPLEMENTED` and out of this document's scope (owned by `TECHNICAL_DESIGN.md`'s future work, gated by its own authorization). This spec only records that every mutable entity above carries an `updated_by`/`uploaded_by`/`created_by`/`actor` reference to whatever that identity mechanism ultimately is, so auditability (`ADM-REQ-012`) is possible from day one of any future implementation rather than retrofitted later.

## Publication / revision model (`AS10-R005`)

Every entity above that carries editorial content and today's `draft`/`published`/`archived` three-state model (`navigation`, `foundations`, `projects`, `services`, `process_steps`, `journal_entries`, `site_settings`, `theme_settings`) follows the same generic pattern, so an admin can edit a **currently published** record as a draft without removing or mutating the currently published version before approval:

```
logical entity (e.g. "projects")
  id
  slug (where applicable)
  lifecycle_state          — active / archived: does this thing exist at all
  published_revision_id    — FK to <entity>_revisions, nullable
  draft_revision_id        — FK to <entity>_revisions, nullable
        ↓
<entity>_revisions (e.g. "project_revisions")
  id
  <entity>_id              — FK back to the logical entity
  revision_number
  ...content fields...
  created_at
  created_by
```

**Public rendering** reads only `published_revision_id`. If it is null, the entity does not appear publicly at all — this is the direct successor to today's `projectPublishedContent()` filtering on `state === "published"` (`lib/content/public.mjs`); nothing published-only about the public projection regresses.

**Admin editing** creates or updates a new row in `<entity>_revisions` and points `draft_revision_id` at it. The row `published_revision_id` points to is never touched by this step — the live public version is unaffected while the draft is edited (resolves the coexistence gap `AS10-R005` identified).

**Preview** (`ADM-REQ-010`) reads the entity's `draft_revision_id` through authenticated admin access only (`WEB-SEC-001`, `002`) — it is never reachable through the public read path.

**Publish** validates the full draft revision (never trust prior draft-time validation), then atomically sets `published_revision_id := draft_revision_id`. `draft_revision_id` is then cleared (no pending draft) until the next edit creates a new revision row. The previously published revision remains in the `_revisions` table for history — publish does not delete prior revisions.

**Unpublish** sets `published_revision_id := null` (or a designated "retracted" marker, decided by a future increment), immediately removing the entity from the next public projection, while all revision rows are preserved according to a future explicit retention rule — unpublish is a pointer change, never a delete of revision history (`RISK-WEB-003`).

`sections` (visibility/order only, no editorial body) and `media`/`audit_log`/junction tables do not use this pattern — see their own entity definitions above for why.

`APP_FLOW.md` §§2c–2f are updated in this same remediation cycle to describe transitions in these exact terms (create/edit → new/updated draft revision; draft → `draft_revision_id` set, published untouched; preview → authenticated read of `draft_revision_id`; publish/unpublish → pointer changes, not in-place overwrites).

## Relationships

```
site_settings ──published/draft──> site_settings_revisions
navigation (many) ──published/draft──> navigation_revisions
foundations (many) ──published/draft──> foundation_revisions
services (many) ──published/draft──> service_revisions
process_steps (many) ──published/draft──> process_step_revisions
sections (many, no revisions — visibility/order only)

projects (many) ──published/draft──> project_revisions
projects (many) ──via project_media──> media (many)

journal_entries (many) ──published/draft──> journal_entry_revisions
journal_entries (many) ──via journal_media──> media (many)

theme_settings ──published/draft──> theme_settings_revisions

audit_log (many) ──entity_type/entity_id/revision_id──> any of the above
```

`project_media` and `journal_media` are ordinary junction tables (`project_id`/`journal_entry_id` + `media_id` + `role` + `order`), each pair enforceable as a database foreign-key relationship in D1 — not an array field describing itself as a foreign key (`AS10-R004`). No entity above has a foreign key into `audit_log`; `audit_log` references outward, never the reverse, so deleting an audited entity must not be allowed to delete its audit trail (append-only invariant).

## IDs, states, timestamps

- **IDs:** reuse the existing constraint — `^[a-z][a-z0-9-]{0,79}$` (`lib/content/schema.mjs`'s `id` validator) — for every stable identifier, unless a future decision explicitly changes the ID scheme.
- **States:** every revisioned entity uses `lifecycle_state` (`active`/`archived`) at the entity level plus `published_revision_id`/`draft_revision_id` pointers for editorial state, per the revision model above — this replaces a single flat `draft`/`published`/`archived` field with an equivalent-or-stronger guarantee, not a weaker one. `sections.visible` remains a plain boolean. `audit_log` uses `success`/`failure`, since it is a record of an event, not editable content.
- **Timestamps:** every mutable entity/revision gets `created_at`/`updated_at` (or `occurred_at` for `audit_log`); `meta.updatedAt`'s current `YYYY-MM-DD` granularity (`lib/content/schema.mjs`) is likely insufficient for an audit-grade timestamp and should become a full ISO 8601 timestamp in any real implementation — this is a design note, not a decision.

## Validation

Any future implementation must extend the existing validation philosophy rather than inventing a weaker one: reject unknown fields, reject unsafe/uncontrolled link targets and HTML/control characters, enforce enum/range constraints per field, enforce slug uniqueness and reserved-slug exclusion, and validate the entire record server-side even if a client already validated it (`WEB-SEC-004`, `006`; mirrors `lib/content/schema.mjs`'s current `validateContent()` behavior, which must remain authoritative for anything it already covers unless deliberately superseded). A draft revision is validated at creation time against the same rules as a published one; publish re-validates in full, never trusting the draft-time result.

## Authorization boundaries

Every mutation path (create/update/publish/unpublish/delete/upload) must be gated server-side by the (currently nonexistent) authentication/authorization boundary — never trust a client-side check alone (`WEB-SEC-002`, `007`, `008`). Read access to any `draft_revision_id` content must be restricted to authenticated admins; the public read path must only ever follow `published_revision_id`, exactly as `lib/content/public.mjs` already guarantees for the current single-file model. This protected read path does not exist yet and cannot be retrofitted onto the current static/asset-only deployment without first standing up a server-side data-access substrate (see `TECHNICAL_DESIGN.md` § "Proposed target architecture" and `BUILD_PLAN.md`'s `WEB-INC-002` disposition, `AS10-R006`).

## Auditability

`audit_log` is the target mechanism for `ADM-REQ-012`/`WEB-SEC-009`. Until it exists, there is no auditability for admin actions because there are no admin actions — this is `NOT YET APPLICABLE`, not `MITIGATED` (`brain/RISK_REGISTER.md` `RISK-WEB-014`).

## Migration considerations

- **From:** `data/site.js` (single Git-committed JS object, validated at build time, deployed via static rebuild).
- **To:** D1-backed tables above (`PROPOSED TARGET`).
- A migration must preserve every currently `published` record's visible content and ordering (`TEST-DATA-001`, `RISK-WEB-015`) and must not accidentally publish anything currently `draft`/`archived` (`TEST-DATA-002`). Concretely: every current `published` record becomes a revision with `published_revision_id` pointing at it; every current `draft` record becomes a revision with only `draft_revision_id` set; every current `archived` record becomes `lifecycle_state: archived` with its last known content preserved as a revision but no `published_revision_id`.
- Every current domain listed in the mapping table above must have a target representation before migration can be considered complete — `foundations`, `services`, and `process.steps` are not optional/deferrable parts of that migration (`AS10-R003`).
- Git history remains the rollback mechanism for the current model (`RISK-WEB-003`); a database-backed model needs its own explicit backup/rollback design before it can claim equivalent safety — this document does not assume D1 automatically inherits Git's rollback property.
- No migration is authorized or performed by this cycle. This section is a design constraint list for whichever future increment proposes the actual migration.

## Rollback / data-loss considerations

- A future write path must never report success on a failed write (`ADM-REQ-016`, `WEB-SEC-012` — see `APP_FLOW.md` §2h).
- The revision model itself is the primary rollback mechanism for editorial content going forward: publishing never deletes a prior revision, and unpublish is a pointer change, not a delete (`RISK-WEB-003`/`RISK-WEB-007`).
- Until D1/R2 exist, none of the above risk controls can be implemented — they remain design intentions here, not evidenced mitigations.

## Context-efficiency note

This spec does not restate the full `ADM-REQ-*`/`DESIGN-*`/`WEB-SEC-*` prose; see `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §10 (`ADM-REQ-*`), §11 (`DESIGN-*`), §13 (`WEB-SEC-*`) (`AS10-R007`). It does not restate Sentinel evidence-class or governance rules; see `devos/governance/*`.
