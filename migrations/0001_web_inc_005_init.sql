-- WEB-INC-005 D1 revision substrate (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024).
-- Local-only migration. Exactly the 14 authorized tables below; no other
-- product table may be added here without a separately authorized increment
-- (AS13-F002). Applied via `wrangler d1 migrations apply DB --local` and via
-- this repository's own Node migration tooling (scripts/d1-migrate.mjs),
-- which reads this exact file so there is a single source of truth for the
-- schema in both paths.
--
-- Base-entity rule (AS13 base entity / revision pointer integrity, D-024
-- "Data-model constraints"): every base/logical entity table below carries
-- only stable identity, immutable `created_at`, an immutable `slug` where
-- applicable, and the two nullable revision pointers. No `order`, visibility,
-- lifecycle flag, or other public-affecting/mutable content lives on a base
-- row; all of that lives on the corresponding `_revisions` row.
--
-- Cross-entity pointer integrity (AS13-F003): each base table's
-- `published_revision_id`/`draft_revision_id` is declared as a COMPOSITE
-- foreign key `(id, <pointer>) REFERENCES <entity>_revisions(<entity>_id, id)`.
-- This makes it a database-level impossibility for a pointer to reference a
-- revision owned by a different entity: the referenced revision row's own
-- `<entity>_id` column must equal the base row's `id`, or the insert/update
-- is rejected by SQLite's foreign-key enforcement. A negative test exercises
-- this rejection directly (tests/d1-migration.test.mjs).
--
-- The `sort_order` column name is used instead of the content model's
-- `order` field name because `order` is a reserved SQL keyword; the D1
-- data-access layer (worker/d1/repository.mjs) maps `sort_order` back to
-- `order` when reconstructing the legacy content shape.

PRAGMA foreign_keys = ON;

-- 1. site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES site_settings_revisions (site_settings_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES site_settings_revisions (site_settings_id, id)
);

-- 2. site_settings_revisions
-- Typed, individually validated substructures only (AS13-F004) — never an
-- opaque whole-document JSON blob. The *_json columns hold small, explicitly
-- typed, field-by-field validated substructures (worker/d1/validate.mjs)
-- mirroring lib/content/schema.mjs's `lines`/`action` shapes, not free-form
-- documents.
CREATE TABLE IF NOT EXISTS site_settings_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_settings_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  schema_version TEXT NOT NULL,
  content_version TEXT NOT NULL,
  locale TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  site_name TEXT NOT NULL,
  site_location TEXT NOT NULL,
  site_timezone TEXT NOT NULL,
  site_tagline TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  seo_canonical_url TEXT NOT NULL,
  hero_eyebrow TEXT NOT NULL,
  hero_title_json TEXT NOT NULL,
  hero_description TEXT NOT NULL,
  hero_primary_action_json TEXT NOT NULL,
  hero_secondary_action_json TEXT NOT NULL,
  hero_bridge_label TEXT NOT NULL,
  hero_bridge_statement TEXT NOT NULL,
  process_kicker TEXT NOT NULL,
  process_title TEXT NOT NULL,
  about_kicker TEXT NOT NULL,
  about_title_json TEXT NOT NULL,
  about_body TEXT NOT NULL,
  about_quote TEXT NOT NULL,
  about_quote_attribution TEXT NOT NULL,
  contact_header_label TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_call_to_action TEXT NOT NULL,
  project_section_kicker TEXT NOT NULL,
  project_section_title TEXT NOT NULL,
  project_section_description TEXT NOT NULL,
  project_section_empty_message TEXT NOT NULL,
  footer_statement TEXT NOT NULL,
  footer_copyright TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (site_settings_id, id),
  UNIQUE (site_settings_id, revision_number),
  FOREIGN KEY (site_settings_id) REFERENCES site_settings (id)
);

-- 3. navigation
CREATE TABLE IF NOT EXISTS navigation (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES navigation_revisions (navigation_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES navigation_revisions (navigation_id, id)
);

-- 4. navigation_revisions
CREATE TABLE IF NOT EXISTS navigation_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  navigation_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (navigation_id, id),
  UNIQUE (navigation_id, revision_number),
  FOREIGN KEY (navigation_id) REFERENCES navigation (id)
);

-- 5. foundations
CREATE TABLE IF NOT EXISTS foundations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES foundation_revisions (foundation_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES foundation_revisions (foundation_id, id)
);

-- 6. foundation_revisions
CREATE TABLE IF NOT EXISTS foundation_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  foundation_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  icon TEXT NOT NULL,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (foundation_id, id),
  UNIQUE (foundation_id, revision_number),
  FOREIGN KEY (foundation_id) REFERENCES foundations (id)
);

-- 7. projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug NOT IN ('home', 'projects', 'process', 'about', 'main-content')),
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES project_revisions (project_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES project_revisions (project_id, id)
);

-- 8. project_revisions
CREATE TABLE IF NOT EXISTS project_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  stack_json TEXT NOT NULL,
  accent TEXT NOT NULL CHECK (accent IN ('gold', 'blue', 'red', 'violet')),
  icon TEXT NOT NULL,
  featured INTEGER NOT NULL CHECK (featured IN (0, 1)),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (project_id, id),
  UNIQUE (project_id, revision_number),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

-- 9. services
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES service_revisions (service_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES service_revisions (service_id, id)
);

-- 10. service_revisions
CREATE TABLE IF NOT EXISTS service_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (service_id, id),
  UNIQUE (service_id, revision_number),
  FOREIGN KEY (service_id) REFERENCES services (id)
);

-- 11. process_steps
CREATE TABLE IF NOT EXISTS process_steps (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES process_step_revisions (process_step_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES process_step_revisions (process_step_id, id)
);

-- 12. process_step_revisions
CREATE TABLE IF NOT EXISTS process_step_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  process_step_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (process_step_id, id),
  UNIQUE (process_step_id, revision_number),
  FOREIGN KEY (process_step_id) REFERENCES process_steps (id)
);

-- 13. sections
-- Bootstrap-only substrate for home/projects/process/about (AS13-F005).
-- `main-content` is intentionally never a row here — it is a skip-link
-- target inside the hero markup, not a managed section.
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES section_revisions (section_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES section_revisions (section_id, id)
);

-- 14. section_revisions
CREATE TABLE IF NOT EXISTS section_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  visible INTEGER NOT NULL CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (section_id, id),
  UNIQUE (section_id, revision_number),
  FOREIGN KEY (section_id) REFERENCES sections (id)
);
