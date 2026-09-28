// D-098 (AS-116 post-incident hardening): the D1 binding pins the exact
// production database, and the R2 binding is identified by bucket name only.
// This reads wrangler.jsonc through Wrangler's own parser; it makes no
// Cloudflare call.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { unstable_readConfig } from "wrangler";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { handleRequest, isValidAuthConfig, ACCESS_ASSERTION_HEADER, PLACEHOLDER_TEAM_DOMAIN, PLACEHOLDER_AUD } from "../worker/auth.mjs";

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

// D-111 (AS137-F002): the Worker carries the exact non-secret values of the
// existing `maisoglabs.com/admin` Access application, not the inert
// placeholders, and authentication still fails closed with them.
const ACCESS_TEAM_DOMAIN = "jolly-disk-0469.cloudflareaccess.com";
const ACCESS_AUD = "ef44d36e676be36eedb87d5378b8f3fd1ed40cc34505b7261a990c166a0cea22";

test("the Access vars are the real maisoglabs.com/admin application values, not placeholders", () => {
  assert.deepEqual(config.vars, { ACCESS_TEAM_DOMAIN, ACCESS_AUD });
  assert.notEqual(config.vars.ACCESS_TEAM_DOMAIN, PLACEHOLDER_TEAM_DOMAIN);
  assert.notEqual(config.vars.ACCESS_AUD, PLACEHOLDER_AUD);
  assert.equal(isValidAuthConfig({ teamDomain: config.vars.ACCESS_TEAM_DOMAIN, audience: config.vars.ACCESS_AUD }), true);
});

test("no tracked Worker config still contains an Access placeholder", () => {
  const raw = readFileSync(path.join(import.meta.dirname, "..", "wrangler.jsonc"), "utf8");
  assert.equal(raw.includes("REPLACE_WITH_"), false);
});

async function accessFixture() {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  jwk.kid = "test-key";
  jwk.alg = "ES256";
  return { privateKey, jwks: createLocalJWKSet({ keys: [jwk] }) };
}

function signAccessToken(privateKey, { issuer = `https://${ACCESS_TEAM_DOMAIN}`, audience = ACCESS_AUD } = {}) {
  return new SignJWT({ email: "admin@example.com", sub: "test-subject" })
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime("1h")
    .sign(privateKey);
}

async function adminRequest(token, jwks) {
  const assetCalls = [];
  const response = await handleRequest(
    new Request("https://maisoglabs.com/admin", { headers: token ? { [ACCESS_ASSERTION_HEADER]: token } : {} }),
    {
      assets: { fetch: request => (assetCalls.push(request.url), new Response("admin", { status: 200 })) },
      teamDomain: config.vars.ACCESS_TEAM_DOMAIN,
      audience: config.vars.ACCESS_AUD,
      getJWKS: () => jwks,
    }
  );
  return { response, assetCalls };
}

test("with the configured Access values, /admin still fails closed without a valid assertion", async () => {
  const { privateKey, jwks } = await accessFixture();
  const other = await accessFixture();
  const cases = {
    missing: null,
    garbage: "not-a-jwt",
    wrongAudience: await signAccessToken(privateKey, { audience: "some-other-aud" }),
    wrongIssuer: await signAccessToken(privateKey, { issuer: "https://other-team.cloudflareaccess.com" }),
    untrustedKey: await signAccessToken(other.privateKey),
  };
  for (const [name, token] of Object.entries(cases)) {
    const { response, assetCalls } = await adminRequest(token, jwks);
    assert.equal(response.status, 401, name);
    assert.equal(response.headers.get("Cache-Control"), "no-store", name);
    assert.equal(assetCalls.length, 0, name);
  }
});

test("with the configured Access values, a correctly issued and audienced assertion is accepted", async () => {
  const { privateKey, jwks } = await accessFixture();
  const { response, assetCalls } = await adminRequest(await signAccessToken(privateKey), jwks);
  assert.equal(response.status, 200);
  assert.equal(assetCalls.length, 1);
});
