# MaisogLabs Data & Backend Spec

Status: `DRAFT — DOCUMENTATION-ONLY PRODUCT BUILD PACK — PROPOSED TARGET / NOT IMPLEMENTED (except where marked current)`

Owns proposed data/API/storage contracts at **design/specification level only**. This document does not provision D1, does not provision R2, does not create an API, and does not migrate `data/site.js` (`AS10-F012`). Everything under "Proposed entities" is `PROPOSED TARGET / NOT IMPLEMENTED` unless explicitly marked otherwise.

## Current storage model — `CURRENTLY IMPLEMENTED`

Local, Git-backed content only. There is no database, no D1, no R2, no external persistence layer today (`brain/PROJECT_GOVERNANCE.md` § "Current storage model"). The entire current data contract is one exported JS object (`data/site.js`, `siteContent`), validated by `lib/content/schema.mjs` and projected by `lib/content/public.mjs`. Its existing shape (field names, types, and constraints) is the baseline any proposed entity below must be able to represent without silently dropping capability, unless a future `ARCHITECTURE`-class decision explicitly changes that (`brain/DECISION_LOG.md` D-007).

Existing validated fields, for reference (not restated in full — see `lib/content/schema.mjs`): `meta` (schemaVersion, contentVersion, state, locale, updatedAt), `site`, `seo`, `navigation[]`, `hero`, `foundations[]`, `projects[]`, `services[]`, `process`, `about`, `contact`, `projectSection`, `footer`. Every record-like collection already carries `id`, `order`, and `state` (`draft`/`published`/`archived`).

## Proposed entities — `PROPOSED TARGET / NOT IMPLEMENTED`

All entities below are design proposals for a future D1 schema. Field lists are illustrative and derived from the current `data/site.js` shape plus the `ADM-REQ-*`/`DESIGN-*` catalog they must support — a future `TECHNICAL_DESIGN.md`/RFC-equivalent still needs to finalize exact column types, indexes, and migrations before implementation.

### `site_settings`
Singleton row (or key/value table) analogous to today's `site`, `seo`, `hero`, `about`, `contact`, `footer`, `projectSection` groups.
- `id` (fixed singleton key)
- `schema_version`, `content_version`, `state` (`draft`/`published`) — successor to `meta.schemaVersion`/`contentVersion`/`state`
- `updated_at` (timestamp), `updated_by` (admin identity reference, see below)
- domain fields mirroring `site`/`seo`/`hero`/`about`/`contact`/`footer`/`projectSection` (not enumerated field-by-field here; see `lib/content/schema.mjs` for the current authoritative field list to preserve or deliberately supersede)

### `navigation`
Successor to `navigation[]`.
- `id` (stable slug, matches current `id` pattern `^[a-z][a-z0-9-]{0,79}$`)
- `order` (integer)
- `label`, `href` (href must remain constrained the way `lib/content/schema.mjs`'s `href()` constrains it today — anchor targets and validated `mailto:` only, or an explicitly widened, re-validated allowlist)
- `state` (`draft`/`published`/`archived`)

### `sections`
New concept, not present in the current schema as a first-class entity (today, section identity is implicit in `navigation`/`foundations`/`projectSection`/`process`). Represents admin-controlled section visibility/order (`DESIGN-002`, `DESIGN-003`).
- `id` (matches an existing anchor/section key, e.g. `home`, `projects`, `process`, `about`)
- `order`
- `visible` (boolean)

### `projects`
Successor to `projects[]`.
- `id`, `slug` (unique; must remain disjoint from reserved section slugs — `home`, `projects`, `process`, `about`, `main-content` — exactly as `lib/content/schema.mjs`'s `validateContent()` already enforces)
- `order`, `state` (`draft`/`published`/`archived`)
- `category`, `title`, `summary`, `stack[]`, `accent`, `icon`, `featured` (boolean) — mirrors current fields
- `created_at`, `updated_at`, `updated_by`
- `media_ids[]` (foreign keys into `media`, once media exists — `NOT IMPLEMENTED` today, no field like this exists in the current schema)

### `journal_entries`
Entirely new — `NOT IMPLEMENTED`, no equivalent exists in `data/site.js` or `lib/content/schema.mjs` today (`brain/GOVERNANCE_MAP.md` row "Journal": `NOT STARTED`).
- `id`, `slug` (unique, same disjointness rule as `projects.slug`)
- `order` or `published_at`-based ordering, `state` (`draft`/`published`/`archived`)
- `title`, `summary`, `body` (format — markdown/rich text/etc. — undecided, owned by a future design decision, not fixed here)
- `media_ids[]`
- `created_at`, `updated_at`, `updated_by`

### `media`
Entirely new — `NOT IMPLEMENTED`. Backing store target: R2 (`NOT IMPLEMENTED`, per `docs/ARCHITECTURE.md` "after the content and authorization boundaries are tested").
- `id`
- `storage_key` (R2 object key), `content_type`, `size_bytes`, `alt_text`
- `uploaded_at`, `uploaded_by`
- `state` (e.g. `active`/`archived` — an unused, orphaned media item should be distinguishable from one actively referenced by a project/journal entry)

### `theme_settings`
Successor concept for `DESIGN-001`…`014`. Not present as a first-class entity today.
- `id` (singleton or versioned row)
- one field per `DESIGN-*` control, each constrained to a validated/allowed range or enum — never free-form CSS/JS (`DESIGN-014`, mirrors the current pattern in `lib/content/schema.mjs` where every field has an explicit validator)
- `state` (`draft`/`published`), `updated_at`, `updated_by`

### `audit_log`
Entirely new — `NOT IMPLEMENTED`. Required for `ADM-REQ-012`, `WEB-SEC-009`.
- `id`, `occurred_at`
- `actor` (admin identity reference)
- `action` (e.g. `create`, `update`, `publish`, `unpublish`, `delete`, `upload`)
- `entity_type`, `entity_id`
- `result` (`success`/`failure`) — a failed write must be logged as failed, never silently omitted or logged as success (`ADM-REQ-016`, `WEB-SEC-012`)
- append-only; audit rows are not user-editable or user-deletable through the admin surface

### Admin identity references

The exact identity/authentication mechanism (provider, session format) is `NOT IMPLEMENTED` and out of this document's scope (owned by `TECHNICAL_DESIGN.md`'s future work, gated by its own authorization). This spec only records that every mutable entity above carries an `updated_by`/`uploaded_by`/`actor` reference to whatever that identity mechanism ultimately is, so auditability (`ADM-REQ-012`) is possible from day one of any future implementation rather than retrofitted later.

## Relationships

```
site_settings (singleton)
sections (1) ──ordered/visible── (referenced by nav/home composition)
navigation (many)
projects (many) ──media_ids──> media (many)
journal_entries (many) ──media_ids──> media (many)
theme_settings (singleton or versioned)
audit_log (many) ──entity_type/entity_id──> any of the above
```

No entity above has a foreign key into `audit_log`; `audit_log` references outward, never the reverse, so deleting an audited entity must not be allowed to delete its audit trail (append-only invariant).

## IDs, states, timestamps

- **IDs:** reuse the existing constraint — `^[a-z][a-z0-9-]{0,79}$` (`lib/content/schema.mjs`'s `id` validator) — for every stable identifier, unless a future decision explicitly changes the ID scheme.
- **States:** reuse the existing three-state model (`draft`/`published`/`archived`) as the default for every content-like entity above; `audit_log` uses `success`/`failure` instead, since it is a record of an event, not an editable content item.
- **Timestamps:** every mutable entity gets `created_at`/`updated_at` (or `occurred_at` for `audit_log`); `meta.updatedAt`'s current `YYYY-MM-DD` granularity (`lib/content/schema.mjs`) is likely insufficient for an audit-grade timestamp and should become a full ISO 8601 timestamp in any real implementation — this is a design note, not a decision.

## Validation

Any future implementation must extend the existing validation philosophy rather than inventing a weaker one: reject unknown fields, reject unsafe/uncontrolled link targets and HTML/control characters, enforce enum/range constraints per field, enforce slug uniqueness and reserved-slug exclusion, and validate the entire record server-side even if a client already validated it (`WEB-SEC-004`, `006`; mirrors `lib/content/schema.mjs`'s current `validateContent()` behavior, which must remain authoritative for anything it already covers unless deliberately superseded).

## Authorization boundaries

Every mutation path (create/update/publish/unpublish/delete/upload) must be gated server-side by the (currently nonexistent) authentication/authorization boundary — never trust a client-side check alone (`WEB-SEC-002`, `007`, `008`). Read access to `draft`/`archived` records must be restricted to authenticated admins; the public read path must only ever see `published` records, exactly as `lib/content/public.mjs` already guarantees for the current single-file model.

## Auditability

`audit_log` is the target mechanism for `ADM-REQ-012`/`WEB-SEC-009`. Until it exists, there is no auditability for admin actions because there are no admin actions — this is `NOT YET APPLICABLE`, not `MITIGATED` (`brain/RISK_REGISTER.md` `RISK-WEB-014`).

## Migration considerations

- **From:** `data/site.js` (single Git-committed JS object, validated at build time, deployed via static rebuild).
- **To:** D1-backed tables above (`PROPOSED TARGET`).
- A migration must preserve every currently `published` record's visible content and ordering (`TEST-DATA-001`, `RISK-WEB-015`) and must not accidentally publish anything currently `draft`/`archived` (`TEST-DATA-002`).
- Git history remains the rollback mechanism for the current model (`RISK-WEB-003`); a database-backed model needs its own explicit backup/rollback design before it can claim equivalent safety — this document does not assume D1 automatically inherits Git's rollback property.
- No migration is authorized or performed by this cycle. This section is a design constraint list for whichever future increment proposes the actual migration.

## Rollback / data-loss considerations

- A future write path must never report success on a failed write (`ADM-REQ-016`, `WEB-SEC-012` — see `APP_FLOW.md` §2h).
- A future publish/unpublish action should be reversible (e.g. via `audit_log` + previous-state retention or soft-delete) rather than a hard, irreversible overwrite, to bound `RISK-WEB-003`/`RISK-WEB-007` once the admin surface exists.
- Until D1/R2 exist, none of the above risk controls can be implemented — they remain design intentions here, not evidenced mitigations.

## Context-efficiency note

This spec does not restate the full `ADM-REQ-*`/`WEB-SEC-*`/`DESIGN-*` prose; see `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §§10–11. It does not restate Sentinel evidence-class or governance rules; see `devos/governance/*`.
