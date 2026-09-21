-- WEB-INC-006 local Journal subsystem (WEB-REQ-009 / ML-DEVOS-RFC-009 /
-- ML-DEVOS-AS-028 / D-031). Local-only migration, applied strictly after
-- 0001_web_inc_005_init.sql, 0002_web_inc_008_audit_log.sql, and
-- 0003_web_inc_004_media.sql, none of which this file modifies (AS28-F002).
--
-- Adds exactly three new product tables: journal_entries,
-- journal_entry_revisions, and journal_media. The current local product
-- schema after this migration is exactly 20 tables — the 17 existing tables
-- plus these three (AS28-F002).
--
-- journal_entries: base entity containing only identity, immutable
-- metadata, and revision pointers, exactly like `projects`
-- (migrations/0001_web_inc_005_init.sql). `slug` is immutable and excludes
-- both the existing reserved public-section names and the two new
-- journal-specific reserved names ('journal', the public page route, and
-- 'api', the public API prefix) so a journal entry's slug can never collide
-- with a real route segment. The composite foreign keys mirror `projects`'
-- exact pointer-ownership technique: a pointer can only reference a
-- revision row whose own `journal_entry_id` equals this base row's `id`.
--
-- journal_entry_revisions: unlike every other `_revisions` table in this
-- repository, this one is immutable-by-trigger rather than merely by
-- application convention (AS28-F007) — `journal_entry_revisions_guard`
-- rejects any UPDATE except the one narrow, explicit transition RFC-009
-- authorizes: `published_at` moving from NULL to a non-null value, with
-- every other column (including `published_at` itself, once already
-- non-null) required to stay byte-identical. `title`/`summary` follow the
-- exact same "value must already equal its own trim(), and be non-empty
-- and bounded" invariant as `media.alt_text` (migrations/0003, AS26-F009) —
-- the application layer (`worker/d1/validate.mjs`) trims and validates
-- before this constraint is ever reached; it exists as an independent
-- database-level backstop. `body` is plain text only (no HTML/Markdown
-- execution is ever attempted anywhere in this repository): the CHECK
-- bounds it to 1-20000 characters and rejects any embedded carriage-return
-- byte, since the application layer normalizes all line endings to a bare
-- `\n` before storing — a stray `\r` reaching this constraint would mean
-- that normalization was bypassed.
--
-- journal_media: revision-scoped junction table, byte-for-byte the same
-- shape and the same two independent UNIQUE constraints (association +
-- display-slot) and the same two immutability/non-delete triggers as
-- `project_media` (migrations/0003_web_inc_004_media.sql, AS23-F005,
-- AS26-F010) — only the parent revision table and foreign key differ.

PRAGMA foreign_keys = ON;

-- 18. journal_entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug NOT IN ('home', 'projects', 'process', 'about', 'main-content', 'journal', 'api')),
  created_at TEXT NOT NULL,
  published_revision_id INTEGER,
  draft_revision_id INTEGER,
  FOREIGN KEY (id, published_revision_id) REFERENCES journal_entry_revisions (journal_entry_id, id),
  FOREIGN KEY (id, draft_revision_id) REFERENCES journal_entry_revisions (journal_entry_id, id)
);

-- 19. journal_entry_revisions
CREATE TABLE IF NOT EXISTS journal_entry_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL CHECK (revision_number >= 1),
  title TEXT NOT NULL CHECK (title = trim(title) AND length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (summary = trim(summary) AND length(summary) BETWEEN 1 AND 800),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 20000 AND instr(body, char(13)) = 0),
  published_at TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (journal_entry_id, id),
  UNIQUE (journal_entry_id, revision_number),
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries (id)
);

-- AS28-F007: every column is immutable except the one-time
-- `published_at: NULL -> timestamp` transition. The WHEN clause is
-- satisfied (and the UPDATE therefore rejected) whenever any of the
-- always-immutable columns differ, or `published_at` changes in any way
-- other than a true no-op or that exact one-time transition.
CREATE TRIGGER IF NOT EXISTS journal_entry_revisions_guard
BEFORE UPDATE ON journal_entry_revisions
WHEN NOT (
  OLD.id = NEW.id AND
  OLD.journal_entry_id = NEW.journal_entry_id AND
  OLD.revision_number = NEW.revision_number AND
  OLD.title = NEW.title AND
  OLD.summary = NEW.summary AND
  OLD.body = NEW.body AND
  OLD.created_at = NEW.created_at AND
  OLD.created_by = NEW.created_by AND
  (
    OLD.published_at IS NEW.published_at
    OR (OLD.published_at IS NULL AND NEW.published_at IS NOT NULL)
  )
)
BEGIN
  SELECT RAISE(ABORT, 'journal_entry_revisions: only a one-time NULL -> timestamp published_at transition is permitted');
END;

CREATE TRIGGER IF NOT EXISTS journal_entry_revisions_reject_delete
BEFORE DELETE ON journal_entry_revisions
BEGIN
  SELECT RAISE(ABORT, 'journal_entry_revisions: rows are not deletable');
END;

-- 20. journal_media
CREATE TABLE IF NOT EXISTS journal_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_revision_id INTEGER NOT NULL,
  media_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cover', 'gallery')),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  UNIQUE (journal_entry_revision_id, media_id, role),
  UNIQUE (journal_entry_revision_id, role, sort_order),
  FOREIGN KEY (journal_entry_revision_id) REFERENCES journal_entry_revisions (id),
  FOREIGN KEY (media_id) REFERENCES media (id)
);

CREATE TRIGGER IF NOT EXISTS journal_media_reject_update
BEFORE UPDATE ON journal_media
BEGIN
  SELECT RAISE(ABORT, 'journal_media: rows are immutable');
END;

CREATE TRIGGER IF NOT EXISTS journal_media_reject_delete
BEFORE DELETE ON journal_media
BEGIN
  SELECT RAISE(ABORT, 'journal_media: rows are not deletable');
END;
