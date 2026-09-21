#!/usr/bin/env node
// WEB-INC-005 (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024) local-only
// migration/seed CLI.
//
// Local-only by construction: `getPlatformProxy` is called with
// `remoteBindings: false` and the `DB` binding in wrangler.jsonc has
// `remote: false` with no database_id — there is no code path here capable
// of reaching a real Cloudflare D1 resource (AS13-F008). Persists to
// `.wrangler/state/v3` by default, the same local state Wrangler itself
// uses, unless overridden with the WEB_INC_005_D1_STATE_DIR env var (used by
// the test suite to get an isolated state directory per test run).
import { getPlatformProxy } from "wrangler";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { applySchema, listProductTables, AUTHORIZED_TABLE_NAMES } from "../worker/d1/schema.mjs";
import { migrateCurrentContent } from "../worker/d1/migrate.mjs";
import { siteContent } from "../data/site.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");

export async function runMigration({ statePath } = {}) {
  const proxy = await getPlatformProxy({
    configPath: path.join(REPO_ROOT, "wrangler.jsonc"),
    persist: statePath ? { path: statePath } : true,
    remoteBindings: false,
  });
  try {
    const db = proxy.env.DB;
    await applySchema(db);
    const summary = await migrateCurrentContent(db, siteContent);
    const tables = await listProductTables(db);
    return { summary, tables };
  } finally {
    await proxy.dispose();
  }
}

async function main() {
  const { summary, tables } = await runMigration();
  console.log(`WEB-INC-005 local D1 migration complete.`);
  console.log(`Product tables (${tables.length}): ${tables.join(", ")}`);
  console.log(`Exactly the 14 authorized tables: ${JSON.stringify(tables) === JSON.stringify([...AUTHORIZED_TABLE_NAMES].sort())}`);
  console.log(`Entities created this run: ${summary.createdCount}`);
  console.log(`Entities already migrated (no-op) this run: ${summary.noopCount}`);
  for (const result of summary.results) {
    console.log(`  [${result.action}] ${result.table}.${result.entityId}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}
