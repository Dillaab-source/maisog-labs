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
