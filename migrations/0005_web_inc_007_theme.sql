-- WEB-INC-007 local Theme / Design Controls subsystem (ML-DEVOS-RFC-010 /
-- ML-DEVOS-AS-030 / D-032, screenshot-reference addendum ML-DEVOS-AS-031 /
-- D-033). Local-only migration, applied strictly after
-- 0001_web_inc_005_init.sql, 0002_web_inc_008_audit_log.sql,
-- 0003_web_inc_004_media.sql, and 0004_web_inc_006_journal.sql, none of
-- which this file modifies. Exactly two new product tables (20 -> 22):
-- theme_settings, theme_settings_revisions.
--
-- theme_settings is a singleton base entity (id = 'default' only, enforced
-- by CHECK, so no second theme entity/rename is possible) carrying only
-- identity/pointers, exactly like every other base entity table in this
-- schema (sections, projects, journal_entries, ...). The composite foreign
-- keys guarantee a pointer can only ever reference a revision owned by this
-- same singleton (same technique as every prior base/`_revisions` pair).
--
-- theme_settings_revisions stores exactly the RFC-010 DESIGN-001..014
-- fields as fixed enums (CHECK IN (...)) or bounded integers (CHECK
-- BETWEEN ...) — never a free-form CSS/JS/HTML/color/URL/selector value.
-- Revision rows are immutable and non-deletable at the DB level (stronger
-- than convention-only immutability, matching the precedent set by
-- journal_entry_revisions/AS28-F007): unlike journal, there is no permitted
-- one-time transition here, so the guard trigger rejects every UPDATE
-- unconditionally.
--
-- Migration 0005 also deterministically bootstraps the singleton with one
-- published revision matching the currently accepted V3 + UI-PATCH-001
-- baseline (RFC-010 "Bootstrap"), so a fresh database is never in a
-- themeless state. Every bootstrap statement is written to be safe to run
-- more than once (`INSERT OR IGNORE` keyed on an explicit id/PK, and a
-- guarded `UPDATE ... WHERE published_revision_id IS NULL`), matching the
-- idempotency contract every earlier migration in this file already keeps.

PRAGMA foreign_keys = ON;

-- 21. theme_settings
CREATE TABLE IF NOT EXISTS theme_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES theme_settings_revisions (theme_settings_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES theme_settings_revisions (theme_settings_id, id)
);

-- 22. theme_settings_revisions
CREATE TABLE IF NOT EXISTS theme_settings_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_settings_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL CHECK (revision_number >= 1),
  hero_background_preset TEXT NOT NULL CHECK (hero_background_preset IN ('cinematic-v3', 'deep-night', 'minimal-orbit')),
  card_style_preset TEXT NOT NULL CHECK (card_style_preset IN ('soft-glass', 'quiet-border', 'solid-night')),
  layout_density_preset TEXT NOT NULL CHECK (layout_density_preset IN ('compact', 'comfortable', 'spacious')),
  typography_preset TEXT NOT NULL CHECK (typography_preset IN ('cinematic', 'editorial', 'system')),
  heading_scale_preset TEXT NOT NULL CHECK (heading_scale_preset IN ('compact', 'standard', 'display')),
  overlay_intensity INTEGER NOT NULL CHECK (overlay_intensity BETWEEN 40 AND 85),
  panel_preset TEXT NOT NULL CHECK (panel_preset IN ('soft-glass', 'clear-glass', 'opaque-night')),
  animation_preset TEXT NOT NULL CHECK (animation_preset IN ('calm', 'minimal', 'off')),
  reduced_motion_mode TEXT NOT NULL CHECK (reduced_motion_mode IN ('respect-system', 'always-reduced')),
  project_rail_mode TEXT NOT NULL CHECK (project_rail_mode IN ('snap', 'free-scroll')),
  journal_card_mode TEXT NOT NULL CHECK (journal_card_mode IN ('stack', 'rail')),
  accent_preset TEXT NOT NULL CHECK (accent_preset IN ('cobalt', 'teal', 'violet')),
  panel_opacity_pct INTEGER NOT NULL CHECK (panel_opacity_pct BETWEEN 55 AND 90),
  border_intensity_pct INTEGER NOT NULL CHECK (border_intensity_pct BETWEEN 10 AND 45),
  radius_scale_pct INTEGER NOT NULL CHECK (radius_scale_pct BETWEEN 80 AND 120),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (theme_settings_id, id),
  UNIQUE (theme_settings_id, revision_number),
  FOREIGN KEY (theme_settings_id) REFERENCES theme_settings (id)
);

-- No permitted transition exists for a theme revision (unlike
-- journal_entry_revisions' one-time published_at move) — every column is
-- fixed for the life of the row, so this guard rejects any UPDATE at all.
CREATE TRIGGER IF NOT EXISTS theme_settings_revisions_reject_update
BEFORE UPDATE ON theme_settings_revisions
BEGIN
  SELECT RAISE(ABORT, 'theme_settings_revisions: rows are immutable');
END;

CREATE TRIGGER IF NOT EXISTS theme_settings_revisions_reject_delete
BEFORE DELETE ON theme_settings_revisions
BEGIN
  SELECT RAISE(ABORT, 'theme_settings_revisions: rows are not deletable');
END;

-- Bootstrap: one published revision matching the current accepted V3 +
-- UI-PATCH-001 baseline (RFC-010 "Bootstrap"). Ordered to satisfy both
-- composite foreign keys: the singleton row is created with null pointers
-- first, then the revision row (whose own FK requires the singleton to
-- already exist), then the singleton's published pointer is set to that
-- revision (whose FK requires the revision to already exist). Provenance is
-- the fixed literal 'migration:web-inc-007', matching every other
-- migration-authored row's `created_by` convention in this repository.
INSERT OR IGNORE INTO theme_settings (id, created_at, published_revision_id, draft_revision_id)
VALUES ('default', '2026-01-01T00:00:00.000Z', NULL, NULL);

INSERT OR IGNORE INTO theme_settings_revisions (
  id, theme_settings_id, revision_number,
  hero_background_preset, card_style_preset, layout_density_preset, typography_preset, heading_scale_preset,
  overlay_intensity, panel_preset, animation_preset, reduced_motion_mode, project_rail_mode, journal_card_mode,
  accent_preset, panel_opacity_pct, border_intensity_pct, radius_scale_pct,
  created_at, created_by
) VALUES (
  1, 'default', 1,
  'cinematic-v3', 'soft-glass', 'comfortable', 'cinematic', 'standard',
  68, 'soft-glass', 'calm', 'respect-system', 'snap', 'stack',
  'cobalt', 74, 25, 100,
  '2026-01-01T00:00:00.000Z', 'migration:web-inc-007'
);

UPDATE theme_settings SET published_revision_id = 1 WHERE id = 'default' AND published_revision_id IS NULL;
