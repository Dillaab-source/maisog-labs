import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import {
  isProtectedPath,
  verifyAccessAssertion,
  handleRequest,
  isValidTeamDomain,
  isValidAudience,
  isValidAuthConfig,
  ACCESS_ASSERTION_HEADER,
  PLACEHOLDER_TEAM_DOMAIN,
  PLACEHOLDER_AUD,
} from "../worker/auth.mjs";

const TEAM_DOMAIN = "test-team.cloudflareaccess.com";
const ISSUER = `https://${TEAM_DOMAIN}`;
const AUDIENCE = "test-audience-aud-tag";
const ALG = "ES256";
const KID = "test-key-1";

// Deterministic, ephemeral test-only key material. Never a production credential.
async function buildTestIdentity(kid = KID) {
  const { publicKey, privateKey } = await generateKeyPair(ALG);
  const jwk = await exportJWK(publicKey);
  jwk.kid = kid;
  jwk.alg = ALG;
  const jwks = createLocalJWKSet({ keys: [jwk] });
  return { privateKey, kid, jwks };
}

async function signToken(privateKey, kid, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: "admin@example.com" })
    .setProtectedHeader({ alg: ALG, kid })
    .setIssuedAt(overrides.iat ?? now)
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(overrides.audience ?? AUDIENCE)
    .setExpirationTime(overrides.exp ?? now + 3600)
    .sign(privateKey);
}

function fakeAssets(response = new Response("asset", { status: 200 })) {
  const calls = [];
  return {
    calls,
    fetch(request) {
      calls.push(request.url);
      return response;
    },
  };
}

// Spies on getJWKS so tests can assert it was never called — the required
// AS12-F001 evidence that invalid config never reaches JWKS/network resolution.
function jwksSpy(jwks) {
  const calls = [];
  return {
    calls,
    getJWKS(teamDomain) {
      calls.push(teamDomain);
      return jwks;
    },
  };
}

test("isProtectedPath matches only /admin and /admin/*", () => {
  assert.equal(isProtectedPath("/admin"), true);
  assert.equal(isProtectedPath("/admin/"), true);
  assert.equal(isProtectedPath("/admin/settings"), true);
  assert.equal(isProtectedPath("/adminfoo"), false);
  assert.equal(isProtectedPath("/"), false);
  assert.equal(isProtectedPath("/foo"), false);
  assert.equal(isProtectedPath("/projects"), false);
});

// --- AS12-F001: auth configuration itself must fail closed --------------

test("isValidTeamDomain rejects missing/blank/placeholder/malformed values", () => {
  assert.equal(isValidTeamDomain(undefined), false);
  assert.equal(isValidTeamDomain(null), false);
  assert.equal(isValidTeamDomain(""), false);
  assert.equal(isValidTeamDomain("   "), false);
  assert.equal(isValidTeamDomain(PLACEHOLDER_TEAM_DOMAIN), false);
  assert.equal(isValidTeamDomain("https://test-team.cloudflareaccess.com"), false); // scheme not allowed
  assert.equal(isValidTeamDomain("test team.cloudflareaccess.com"), false); // whitespace
  assert.equal(isValidTeamDomain("not-a-domain"), false); // no dot
  assert.equal(isValidTeamDomain("test-team.cloudflareaccess.com/extra"), false); // path not allowed
});

test("isValidTeamDomain accepts a well-formed bare team domain", () => {
  assert.equal(isValidTeamDomain(TEAM_DOMAIN), true);
});

test("isValidAudience rejects missing/blank/placeholder values", () => {
  assert.equal(isValidAudience(undefined), false);
  assert.equal(isValidAudience(null), false);
  assert.equal(isValidAudience(""), false);
  assert.equal(isValidAudience("   "), false);
  assert.equal(isValidAudience(PLACEHOLDER_AUD), false);
});

test("isValidAudience accepts a well-formed audience", () => {
  assert.equal(isValidAudience(AUDIENCE), true);
});

test("isValidAuthConfig requires both team domain and audience to be independently valid", () => {
  assert.equal(isValidAuthConfig({ teamDomain: TEAM_DOMAIN, audience: AUDIENCE }), true);
  assert.equal(isValidAuthConfig({ teamDomain: undefined, audience: AUDIENCE }), false);
  assert.equal(isValidAuthConfig({ teamDomain: TEAM_DOMAIN, audience: undefined }), false);
  assert.equal(isValidAuthConfig({ teamDomain: PLACEHOLDER_TEAM_DOMAIN, audience: AUDIENCE }), false);
  assert.equal(isValidAuthConfig({ teamDomain: TEAM_DOMAIN, audience: PLACEHOLDER_AUD }), false);
  assert.equal(isValidAuthConfig({ teamDomain: "", audience: "" }), false);
});

for (const [label, badTeamDomain] of [
  ["missing", undefined],
  ["blank", "   "],
  ["placeholder", PLACEHOLDER_TEAM_DOMAIN],
  ["malformed (scheme)", "https://team.cloudflareaccess.com"],
]) {
  test(`handleRequest fails closed on /admin with ${label} team domain, without calling getJWKS or assets`, async () => {
    const { jwks } = await buildTestIdentity();
    const assets = fakeAssets();
    const spy = jwksSpy(jwks);
    const response = await handleRequest(
      new Request("https://maisoglabs.example/admin"),
      { assets, teamDomain: badTeamDomain, audience: AUDIENCE, getJWKS: spy.getJWKS },
    );
    assert.equal(response.status, 401);
    assert.equal(assets.calls.length, 0);
    assert.equal(spy.calls.length, 0, "getJWKS must never be called when config is invalid");
  });
}

for (const [label, badAudience] of [
  ["missing", undefined],
  ["blank", "   "],
  ["placeholder", PLACEHOLDER_AUD],
]) {
  test(`handleRequest fails closed on /admin with ${label} audience, without calling getJWKS or assets`, async () => {
    const { jwks } = await buildTestIdentity();
    const assets = fakeAssets();
    const spy = jwksSpy(jwks);
    const response = await handleRequest(
      new Request("https://maisoglabs.example/admin"),
      { assets, teamDomain: TEAM_DOMAIN, audience: badAudience, getJWKS: spy.getJWKS },
    );
    assert.equal(response.status, 401);
    assert.equal(assets.calls.length, 0);
    assert.equal(spy.calls.length, 0, "getJWKS must never be called when config is invalid");
  });
}

test("handleRequest fails closed on /admin with invalid config even when a validly signed token is presented", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, kid);
  const assets = fakeAssets();
  const spy = jwksSpy(jwks);
  const response = await handleRequest(
    new Request("https://maisoglabs.example/admin", { headers: { [ACCESS_ASSERTION_HEADER]: token } }),
    { assets, teamDomain: PLACEHOLDER_TEAM_DOMAIN, audience: PLACEHOLDER_AUD, getJWKS: spy.getJWKS },
  );
  assert.equal(response.status, 401);
  assert.equal(assets.calls.length, 0);
  assert.equal(spy.calls.length, 0, "a valid token must not compensate for invalid config, and must not trigger JWKS lookup");
});

test("handleRequest does not validate config for ordinary public routes (no gate to check)", async () => {
  const assets = fakeAssets(new Response("home", { status: 200 }));
  const spy = jwksSpy(undefined);
  const response = await handleRequest(new Request("https://maisoglabs.example/"), {
    assets, teamDomain: undefined, audience: undefined, getJWKS: spy.getJWKS,
  });
  assert.equal(response.status, 200);
  assert.equal(assets.calls.length, 1);
  assert.equal(spy.calls.length, 0);
});

// --- verifyAccessAssertion: preserved token-level tests ------------------

test("verifyAccessAssertion rejects a missing token", async () => {
  const { jwks } = await buildTestIdentity();
  await assert.rejects(() => verifyAccessAssertion(undefined, { jwks, issuer: ISSUER, audience: AUDIENCE }));
  await assert.rejects(() => verifyAccessAssertion("", { jwks, issuer: ISSUER, audience: AUDIENCE }));
  await assert.rejects(() => verifyAccessAssertion(null, { jwks, issuer: ISSUER, audience: AUDIENCE }));
});

test("verifyAccessAssertion rejects a malformed token", async () => {
  const { jwks } = await buildTestIdentity();
  await assert.rejects(() => verifyAccessAssertion("not-a-jwt", { jwks, issuer: ISSUER, audience: AUDIENCE }));
});

test("verifyAccessAssertion rejects an expired token", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const now = Math.floor(Date.now() / 1000);
  const token = await signToken(privateKey, kid, { iat: now - 7200, exp: now - 3600 });
  await assert.rejects(() => verifyAccessAssertion(token, { jwks, issuer: ISSUER, audience: AUDIENCE }));
});

test("verifyAccessAssertion rejects a not-yet-valid token", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ email: "admin@example.com" })
    .setProtectedHeader({ alg: ALG, kid })
    .setIssuedAt(now)
    .setNotBefore(now + 3600)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(now + 7200)
    .sign(privateKey);
  await assert.rejects(() => verifyAccessAssertion(token, { jwks, issuer: ISSUER, audience: AUDIENCE }));
});

test("verifyAccessAssertion rejects the wrong audience", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, kid, { audience: "wrong-audience" });
  await assert.rejects(() => verifyAccessAssertion(token, { jwks, issuer: ISSUER, audience: AUDIENCE }));
});

test("verifyAccessAssertion rejects the wrong issuer/team", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, kid, { issuer: "https://attacker-team.cloudflareaccess.com" });
  await assert.rejects(() => verifyAccessAssertion(token, { jwks, issuer: ISSUER, audience: AUDIENCE }));
});

test("verifyAccessAssertion rejects a token signed by an untrusted key (same kid, different key)", async () => {
  const trusted = await buildTestIdentity(KID);
  const untrusted = await buildTestIdentity(KID); // same kid, unrelated key pair
  const token = await signToken(untrusted.privateKey, KID);
  await assert.rejects(() => verifyAccessAssertion(token, { jwks: trusted.jwks, issuer: ISSUER, audience: AUDIENCE }));
});

test("verifyAccessAssertion accepts a correctly signed token with the expected issuer/audience", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, kid);
  const payload = await verifyAccessAssertion(token, { jwks, issuer: ISSUER, audience: AUDIENCE });
  assert.equal(payload.iss, ISSUER);
  assert.equal(payload.aud, AUDIENCE);
});

// --- handleRequest: preserved end-to-end routing/rejection tests ---------

test("handleRequest serves ordinary public routes asset-first with no token check", async () => {
  const { jwks } = await buildTestIdentity();
  const assets = fakeAssets(new Response("home", { status: 200 }));
  const response = await handleRequest(new Request("https://maisoglabs.example/"), {
    assets, teamDomain: TEAM_DOMAIN, audience: AUDIENCE, getJWKS: () => jwks,
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "home");
  assert.equal(assets.calls.length, 1);
});

test("handleRequest serves an ordinary non-admin path asset-first even with a token present", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, kid);
  const assets = fakeAssets(new Response("projects", { status: 200 }));
  const response = await handleRequest(
    new Request("https://maisoglabs.example/projects", { headers: { [ACCESS_ASSERTION_HEADER]: token } }),
    { assets, teamDomain: TEAM_DOMAIN, audience: AUDIENCE, getJWKS: () => jwks },
  );
  assert.equal(response.status, 200);
  assert.equal(assets.calls.length, 1);
});

test("handleRequest rejects /admin with no token and never calls assets", async () => {
  const { jwks } = await buildTestIdentity();
  const assets = fakeAssets();
  const response = await handleRequest(new Request("https://maisoglabs.example/admin"), {
    assets, teamDomain: TEAM_DOMAIN, audience: AUDIENCE, getJWKS: () => jwks,
  });
  assert.equal(response.status, 401);
  assert.equal(assets.calls.length, 0);
});

test("handleRequest rejects /admin/* with a malformed token", async () => {
  const { jwks } = await buildTestIdentity();
  const assets = fakeAssets();
  const response = await handleRequest(
    new Request("https://maisoglabs.example/admin/settings", { headers: { [ACCESS_ASSERTION_HEADER]: "garbage" } }),
    { assets, teamDomain: TEAM_DOMAIN, audience: AUDIENCE, getJWKS: () => jwks },
  );
  assert.equal(response.status, 401);
  assert.equal(assets.calls.length, 0);
});

test("handleRequest rejects /admin with an expired token", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const now = Math.floor(Date.now() / 1000);
  const token = await signToken(privateKey, kid, { iat: now - 7200, exp: now - 3600 });
  const assets = fakeAssets();
  const response = await handleRequest(
    new Request("https://maisoglabs.example/admin/", { headers: { [ACCESS_ASSERTION_HEADER]: token } }),
    { assets, teamDomain: TEAM_DOMAIN, audience: AUDIENCE, getJWKS: () => jwks },
  );
  assert.equal(response.status, 401);
  assert.equal(assets.calls.length, 0);
});

test("handleRequest rejects /admin with the wrong audience", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, kid, { audience: "wrong-audience" });
  const assets = fakeAssets();
  const response = await handleRequest(
    new Request("https://maisoglabs.example/admin/settings", { headers: { [ACCESS_ASSERTION_HEADER]: token } }),
    { assets, teamDomain: TEAM_DOMAIN, audience: AUDIENCE, getJWKS: () => jwks },
  );
  assert.equal(response.status, 401);
  assert.equal(assets.calls.length, 0);
});

test("handleRequest allows a correctly signed token to reach the admin asset", async () => {
  const { privateKey, kid, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, kid);
  const assets = fakeAssets(new Response("admin placeholder", { status: 200 }));
  const response = await handleRequest(
    new Request("https://maisoglabs.example/admin", { headers: { [ACCESS_ASSERTION_HEADER]: token } }),
    { assets, teamDomain: TEAM_DOMAIN, audience: AUDIENCE, getJWKS: () => jwks },
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "admin placeholder");
  assert.equal(assets.calls.length, 1);
});
