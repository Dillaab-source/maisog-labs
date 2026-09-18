// WEB-INC-005 (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024) D1 schema loader.
//
// This module's job is only to apply migrations/0001_web_inc_005_init.sql
// against a D1 binding — it reads the SQL file rather than duplicating its
// text, so the CLI migration path (`wrangler d1 migrations apply --local`)
// and this repository's own Node tooling/tests stay byte-identical to a
// single source of truth.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unstable_splitSqlQuery } from "wrangler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_SQL_PATH = path.join(__dirname, "..", "..", "migrations", "0001_web_inc_005_init.sql");

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
