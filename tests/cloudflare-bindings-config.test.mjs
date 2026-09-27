// D-098 (AS-116 post-incident hardening): the D1 binding pins the exact
// production database, and the R2 binding is identified by bucket name only.
// This reads wrangler.jsonc through Wrangler's own parser; it makes no
// Cloudflare call.
import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { unstable_readConfig } from "wrangler";

const config = unstable_readConfig({ config: path.join(import.meta.dirname, "..", "wrangler.jsonc") });

test("the DB binding pins the production D1 database by exact database_id", () => {
  assert.deepEqual(config.d1_databases, [{
    binding: "DB",
    database_name: "maisog-labs-web-inc-005-local",
    database_id: "45b87574-e573-4e0f-9bb6-fbba2df29523",
    migrations_dir: "migrations",
    remote: false,
  }]);
});

test("the MEDIA binding names its R2 bucket and carries no invented id field", () => {
  assert.deepEqual(config.r2_buckets, [{ binding: "MEDIA", bucket_name: "maisog-labs-web-inc-004-local", remote: false }]);
});
