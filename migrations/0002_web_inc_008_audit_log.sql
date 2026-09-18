-- WEB-INC-008 append-only audit substrate (ML-DEVOS-RFC-005 / ML-DEVOS-AS-017
-- / D-026). Local-only migration, applied strictly after
-- 0001_web_inc_005_init.sql, which this file does not modify (AS17-F003).
--
-- Adds exactly one new product table: audit_log. The current local product
-- schema after this migration is exactly 15 tables — the 14 existing
-- WEB-INC-005-owned tables plus this one (AS17-F002).
--
-- audit_log is append-only immutable event history, not editorial content:
-- it has no revision pair and no published/draft pointers (RFC-005 §2). No
-- existing product table gets a foreign key into audit_log, and audit_log
-- itself declares no foreign key out to any entity table — entity_type/
-- entity_id/revision_id are logical, non-cascading outward references only,
-- since a single polymorphic log spans many different entity tables and
-- audit history must survive future entity changes/deletion (AS17-F009).
--
-- Bounded, metadata-only fields (AS17-F004): no JWT/Access token, no
-- credential/secret, no raw request body, no full content snapshot, no
-- stack trace, no SQL error string, and no unrestricted metadata blob is
-- ever a column here. `worker/d1/audit.mjs` is the only code permitted to
-- write to this table, and it always supplies every column itself
-- (AS17-F006) — there is no caller-provided SQL/table/column path.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision_id INTEGER,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure'))
);

-- Append-only enforcement at the database layer (AS17-F005): it is not
-- sufficient for the application API to simply omit update/delete helpers —
-- a direct UPDATE or DELETE issued against this table by any code path
-- (present or future) must itself be rejected by the database. These
-- triggers fire before SQLite would otherwise apply the change and abort
-- the statement unconditionally; there is no admin/user-facing route in
-- this repository capable of reaching them today, and there must never be
-- one that succeeds even if such a route were mistakenly added later.
CREATE TRIGGER IF NOT EXISTS audit_log_reject_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only: UPDATE is not permitted');
END;

CREATE TRIGGER IF NOT EXISTS audit_log_reject_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only: DELETE is not permitted');
END;
