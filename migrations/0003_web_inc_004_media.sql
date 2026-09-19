-- WEB-INC-004 local media subsystem (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 /
-- D-029). Local-only migration, applied strictly after
-- 0001_web_inc_005_init.sql and 0002_web_inc_008_audit_log.sql, neither of
-- which this file modifies (AS23-F003, AS23-F016).
--
-- Adds exactly two new product tables: media and project_media. The current
-- local product schema after this migration is exactly 17 tables — the 15
-- existing tables plus these two (AS23-F003).
--
-- media (AS23-F004): a flat catalog of uploaded objects. storage_key/
-- content_type/size_bytes/alt_text/uploaded_at/uploaded_by are immutable
-- once a row exists — changing file bytes or alt text means uploading a new
-- media row, never editing this one. Only the bookkeeping `state` column may
-- structurally change; no code path in this increment ever changes it, but
-- the schema leaves that column as the sole exception so a future,
-- separately authorized capability would not have to alter this migration
-- to do so. `media_reject_immutable_field_update` enforces the immutable
-- set at the database layer regardless of what any future caller attempts.
-- `media_reject_delete` unconditionally blocks DELETE — no admin behavior in
-- this repository ever deletes a media row, and historical media/reference
-- integrity must be preserved (AS23-F004).
--
-- project_media (AS23-F005): a revision-scoped, immutable junction between
-- one project_revisions row and the media it references. It belongs to
-- project_revisions.id, never to the base projects row, so a changed
-- attachment set is represented only by a new revision's new snapshot rows
-- — never an in-place update of an existing association. Both
-- `project_media_reject_update` and `project_media_reject_delete`
-- unconditionally block mutation of an existing row; the only authorized
-- write path is a fresh INSERT as part of a new revision's own snapshot
-- (worker/d1/media.mjs).
--
-- role is a closed, bounded enum for this increment: 'cover' (a single
-- primary image) or 'gallery' (any supporting image), matching the plan's
-- {mediaId, role, order} snapshot entry shape.

PRAGMA foreign_keys = ON;

-- 15. media
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  alt_text TEXT NOT NULL CHECK (length(alt_text) <= 300),
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active'))
);

CREATE TRIGGER IF NOT EXISTS media_reject_immutable_field_update
BEFORE UPDATE OF id, storage_key, content_type, size_bytes, alt_text, uploaded_at, uploaded_by ON media
BEGIN
  SELECT RAISE(ABORT, 'media: immutable field cannot be updated');
END;

CREATE TRIGGER IF NOT EXISTS media_reject_delete
BEFORE DELETE ON media
BEGIN
  SELECT RAISE(ABORT, 'media: rows are not deletable');
END;

-- 16. project_media
CREATE TABLE IF NOT EXISTS project_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_revision_id INTEGER NOT NULL,
  media_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cover', 'gallery')),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  UNIQUE (project_revision_id, media_id, role),
  FOREIGN KEY (project_revision_id) REFERENCES project_revisions (id),
  FOREIGN KEY (media_id) REFERENCES media (id)
);

CREATE TRIGGER IF NOT EXISTS project_media_reject_update
BEFORE UPDATE ON project_media
BEGIN
  SELECT RAISE(ABORT, 'project_media: rows are immutable');
END;

CREATE TRIGGER IF NOT EXISTS project_media_reject_delete
BEFORE DELETE ON project_media
BEGIN
  SELECT RAISE(ABORT, 'project_media: rows are not deletable');
END;
