// WEB-INC-005 (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024) D1 schema loader.
//
// This module's job is only to apply migrations/0001_web_inc_005_init.sql
// against a D1 binding — it reads the SQL file rather than duplicating its
// text, so the CLI migration path (`wrangler d1 migrations apply --local`)
// and this repository's own Node tooling/tests stay byte-identical to a
// single source of truth.
//
// WEB-INC-008 (ML-DEVOS-RFC-005 / ML-DEVOS-AS-017 / D-026) adds the
// audit_log substrate via a second, separately ordered migration file
// (0002_web_inc_008_audit_log.sql). Per AS17-F003/F015, the exports above
// this point (MIGRATION_SQL_PATH, AUTHORIZED_TABLE_NAMES, readMigrationSql,
// applySchema, listProductTables) are WEB-INC-005 historical evidence and
// must not be modified or repurposed to describe the current 15-table
// schema — tests/d1-migration.test.mjs asserts exactly the 14
// WEB-INC-005-owned tables from applySchema() alone, and that must keep
// passing unchanged. Everything the current (15-table) schema needs is
// therefore added as new, separate exports below instead.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unstable_splitSqlQuery } from "wrangler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_SQL_PATH = path.join(__dirname, "..", "..", "migrations", "0001_web_inc_005_init.sql");
const AUDIT_MIGRATION_SQL_PATH = path.join(__dirname, "..", "..", "migrations", "0002_web_inc_008_audit_log.sql");
const MEDIA_MIGRATION_SQL_PATH = path.join(__dirname, "..", "..", "migrations", "0003_web_inc_004_media.sql");
const JOURNAL_MIGRATION_SQL_PATH = path.join(__dirname, "..", "..", "migrations", "0004_web_inc_006_journal.sql");
const THEME_MIGRATION_SQL_PATH = path.join(__dirname, "..", "..", "migrations", "0005_web_inc_007_theme.sql");

// Exactly the 14 tables authorized by D-024 / ML-DEVOS-AS-013 (AS13-F002).
// Order matches the authorized inventory in coordination/STATE.md.
export const AUTHORIZED_TABLE_NAMES = [
  "site_settings",
  "site_settings_revisions",
  "navigation",
  "navigation_revisions",
  "foundations",
  "foundation_revisions",
  "projects",
  "project_revisions",
  "services",
  "service_revisions",
  "process_steps",
  "process_step_revisions",
  "sections",
  "section_revisions",
];

export function readMigrationSql() {
  return fs.readFileSync(MIGRATION_SQL_PATH, "utf8");
}

// Applies the schema to a D1 binding. CREATE TABLE IF NOT EXISTS statements
// make this call idempotent/safe to run repeatedly against an already
// migrated database (AS13-F009) — it never drops or redefines an existing
// table.
export async function applySchema(db) {
  const statements = unstable_splitSqlQuery(readMigrationSql()).filter(statement => statement.trim().length > 0);
  await db.batch(statements.map(statement => db.prepare(statement)));
}

// Returns the set of user-created table names currently in the database,
// excluding D1/SQLite's own internal bookkeeping tables
// (`_cf_*`, `sqlite_*`, and Wrangler's own `d1_migrations` tracking table if
// the CLI migration runner was used against this database). Used by the
// table-inventory test to prove exactly the 14 authorized tables exist and
// no later-increment table was created early (AS13-F002).
export async function listProductTables(db) {
  const result = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
  return result.results
    .map(row => row.name)
    .filter(name => !name.startsWith("_cf_") && !name.startsWith("sqlite_") && name !== "d1_migrations");
}

// WEB-INC-008 (AS17-F002): exactly one new product table, audit_log. The
// current product schema is the 14 WEB-INC-005 tables plus this one — 15
// tables total.
export const AUDIT_TABLE_NAMES = ["audit_log"];

export const CURRENT_PRODUCT_TABLE_NAMES = [...AUTHORIZED_TABLE_NAMES, ...AUDIT_TABLE_NAMES];

export function readAuditMigrationSql() {
  return fs.readFileSync(AUDIT_MIGRATION_SQL_PATH, "utf8");
}

// Applies only the WEB-INC-008 audit migration (0002). Callers that need
// the full current schema should use applyCurrentSchema(db) below, which
// applies 0001 then 0002 in order; this narrower export exists so a test
// can apply the audit migration on top of a database that already ran
// applySchema() without re-running 0001.
export async function applyAuditMigration(db) {
  const statements = unstable_splitSqlQuery(readAuditMigrationSql()).filter(statement => statement.trim().length > 0);
  await db.batch(statements.map(statement => db.prepare(statement)));
}

// Applies the full current schema (0001 then 0002, in order) to a D1
// binding. Like applySchema(), every statement is CREATE TABLE/TRIGGER IF
// NOT EXISTS, so this is idempotent/safe to run repeatedly (AS13-F009).
export async function applyCurrentSchema(db) {
  await applySchema(db);
  await applyAuditMigration(db);
}

// WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029) addition
// (AS23-F003): exactly two new product tables, media and project_media. Per
// AS23-F016, this does not touch AUTHORIZED_TABLE_NAMES / AUDIT_TABLE_NAMES
// / CURRENT_PRODUCT_TABLE_NAMES / applySchema / applyAuditMigration /
// applyCurrentSchema above — those remain the exact byte-for-byte 15-table
// evidence that tests/d1-migration.test.mjs and tests/d1-audit.test.mjs
// already assert against. The current (17-table) schema gets its own,
// separately named exports instead.
export const MEDIA_TABLE_NAMES = ["media", "project_media"];

export const ALL_PRODUCT_TABLE_NAMES = [...CURRENT_PRODUCT_TABLE_NAMES, ...MEDIA_TABLE_NAMES];

export function readMediaMigrationSql() {
  return fs.readFileSync(MEDIA_MIGRATION_SQL_PATH, "utf8");
}

// Applies only the WEB-INC-004 media migration (0003). Callers that need the
// full current schema should use applyAllMigrations(db) below, which applies
// 0001, 0002, then 0003 in order; this narrower export exists so a test can
// apply the media migration on top of a database that already ran
// applyCurrentSchema() without re-running 0001/0002.
export async function applyMediaMigration(db) {
  const statements = unstable_splitSqlQuery(readMediaMigrationSql()).filter(statement => statement.trim().length > 0);
  await db.batch(statements.map(statement => db.prepare(statement)));
}

// Applies the full 17-table schema (0001, 0002, then 0003, in order) to a D1
// binding. Like applySchema()/applyCurrentSchema(), every statement is
// CREATE TABLE/TRIGGER IF NOT EXISTS, so this is idempotent/safe to run
// repeatedly (AS13-F009).
export async function applyAllMigrations(db) {
  await applyCurrentSchema(db);
  await applyMediaMigration(db);
}

// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// addition (AS28-F002): exactly three new product tables, journal_entries,
// journal_entry_revisions, and journal_media. Per AS28-F002/the RFC's
// "migrations 0001-0003 must remain byte-identical" requirement, this does
// not touch any export above — those remain the exact byte-for-byte
// 17-table evidence that tests/worker-admin-projects.test.mjs and
// tests/worker-admin-media.test.mjs already assert against via
// ALL_PRODUCT_TABLE_NAMES/applyAllMigrations. The full (20-table) schema
// gets its own, separately named exports instead.
export const JOURNAL_TABLE_NAMES = ["journal_entries", "journal_entry_revisions", "journal_media"];

export const FULL_PRODUCT_TABLE_NAMES = [...ALL_PRODUCT_TABLE_NAMES, ...JOURNAL_TABLE_NAMES];

export function readJournalMigrationSql() {
  return fs.readFileSync(JOURNAL_MIGRATION_SQL_PATH, "utf8");
}

// Applies only the WEB-INC-006 journal migration (0004). Callers that need
// the full current schema should use applyFullSchema(db) below, which
// applies 0001, 0002, 0003, then 0004 in order; this narrower export exists
// so a test can apply the journal migration on top of a database that
// already ran applyAllMigrations() without re-running 0001-0003.
export async function applyJournalMigration(db) {
  const statements = unstable_splitSqlQuery(readJournalMigrationSql()).filter(statement => statement.trim().length > 0);
  await db.batch(statements.map(statement => db.prepare(statement)));
}

// Applies the full 20-table schema (0001, 0002, 0003, then 0004, in order)
// to a D1 binding. Like every apply* export above, every statement is
// CREATE TABLE/TRIGGER IF NOT EXISTS, so this is idempotent/safe to run
// repeatedly (AS13-F009).
export async function applyFullSchema(db) {
  await applyAllMigrations(db);
  await applyJournalMigration(db);
}

// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032) addition
// (AS30-F002): exactly two new product tables, theme_settings and
// theme_settings_revisions. Per the RFC's "migrations 0001-0004 must remain
// byte-identical" requirement, this does not touch any export above — those
// remain the exact byte-for-byte 20-table evidence that existing tests
// already assert against via FULL_PRODUCT_TABLE_NAMES/applyFullSchema. The
// complete (22-table) schema gets its own, separately named exports
// instead.
export const THEME_TABLE_NAMES = ["theme_settings", "theme_settings_revisions"];

export const COMPLETE_PRODUCT_TABLE_NAMES = [...FULL_PRODUCT_TABLE_NAMES, ...THEME_TABLE_NAMES];

export function readThemeMigrationSql() {
  return fs.readFileSync(THEME_MIGRATION_SQL_PATH, "utf8");
}

// Applies only the WEB-INC-007 theme migration (0005), including its
// deterministic bootstrap data. Callers that need the complete schema
// should use applyCompleteSchema(db) below, which applies 0001-0004 then
// 0005 in order; this narrower export exists so a test can apply the theme
// migration on top of a database that already ran applyFullSchema()
// without re-running 0001-0004.
export async function applyThemeMigration(db) {
  const statements = unstable_splitSqlQuery(readThemeMigrationSql()).filter(statement => statement.trim().length > 0);
  await db.batch(statements.map(statement => db.prepare(statement)));
}

// Applies the complete 22-table schema (0001 through 0005, in order) to a D1
// binding. Like every apply* export above, every DDL statement is CREATE
// TABLE/TRIGGER IF NOT EXISTS and every bootstrap DML statement is written
// to be idempotent (INSERT OR IGNORE / guarded UPDATE), so this is safe to
// run repeatedly (AS13-F009).
export async function applyCompleteSchema(db) {
  await applyFullSchema(db);
  await applyThemeMigration(db);
}
