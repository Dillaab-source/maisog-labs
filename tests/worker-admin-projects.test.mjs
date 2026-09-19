// WEB-INC-003 (ML-DEVOS-RFC-006 / ML-DEVOS-AS-020 / D-027) bounded project
// mutation capability tests. Every D1 database used here is a local
// Wrangler/Miniflare simulation (`getPlatformProxy({ remoteBindings:
// false })`) persisted to a throwaway temp directory per test — no test in
// this file can reach a real Cloudflare resource (AS20-F018).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { handleRequest, ACCESS_ASSERTION_HEADER } from "../worker/auth.mjs";
import { handleAdminDispatch, buildDashboardPayload, DASHBOARD_PATH } from "../worker/admin/dashboard.mjs";
import { applyAllMigrations, ALL_PRODUCT_TABLE_NAMES } from "../worker/d1/schema.mjs";

const WRANGLER_CONFIG_PATH = path.join(import.meta.dirname, "..", "wrangler.jsonc");
const ORIGIN = "https://maisoglabs.example";

const TEAM_DOMAIN = "test-team.cloudflareaccess.com";
const ISSUER = `https://${TEAM_DOMAIN}`;
const AUDIENCE = "test-audience-aud-tag";
const ALG = "ES256";
const KID = "test-key-1";

async function buildTestIdentity() {
  const { publicKey, privateKey } = await generateKeyPair(ALG);
  const jwk = await exportJWK(publicKey);
  jwk.kid = KID;
  jwk.alg = ALG;
  const jwks = createLocalJWKSet({ keys: [jwk] });
  return { privateKey, jwks };
}

// `sub` defaults to a non-empty identity-based subject; pass `sub: null` to
// omit the claim entirely, simulating a service-token-style assertion
// (AS20-F003). (An explicit `sub: undefined` would not work here — object
// destructuring defaults treat an explicitly-undefined property the same
// as an absent one, so `null` is the sentinel this helper checks instead.)
async function signToken(privateKey, { sub = "test-admin-subject", ...overrides } = {}) {
  const now = Math.floor(Date.now() / 1000);
  let builder = new SignJWT({ email: "admin@example.com", ...(sub !== null ? { sub } : {}) })
    .setProtectedHeader({ alg: ALG, kid: KID })
    .setIssuedAt(overrides.iat ?? now)
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(overrides.audience ?? AUDIENCE)
    .setExpirationTime(overrides.exp ?? now + 3600);
  return builder.sign(privateKey);
}

function fakeAssets(response = new Response("admin shell", { status: 200 })) {
  const calls = [];
  return {
    calls,
    fetch(request) {
      calls.push(request.url);
      return response;
    },
  };
}

function dbSpy() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return {
        bind() {
          return this;
        },
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => ({}),
      };
    },
    batch: async statements => {
      calls.push(`BATCH(${statements.length})`);
      return statements.map(() => ({}));
    },
  };
}

async function openTestDb() {
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-003-d1-test-"));
  const proxy = await getPlatformProxy({
    configPath: WRANGLER_CONFIG_PATH,
    persist: { path: statePath },
    remoteBindings: false,
  });
  await applyAllMigrations(proxy.env.DB);
  return {
    db: proxy.env.DB,
    async cleanup() {
      await proxy.dispose();
      fs.rmSync(statePath, { recursive: true, force: true });
    },
  };
}

// Wraps a real, already-migrated db so every read still works but every
// `batch()` call rejects — simulates a genuine mid-transaction storage
// failure without needing to know which statement "failed" (AS20-F009,
// AS20-F011).
function batchFailingDb(realDb, message = "SIMULATED_BATCH_FAILURE") {
  return {
    prepare: sql => realDb.prepare(sql),
    batch: () => Promise.reject(new Error(message)),
  };
}

// WEB-INC-003 Remediation Cycle 1 (ML-DEVOS-AS-021 AS21-F007): deterministic
// TOCTOU/interleaving simulation. Wraps a real db so the *first* call to the
// project-mutation pre-read query (`readProjectForMutation`'s exact SQL)
// returns a caller-supplied stale snapshot, while every other statement —
// including the mutation's own db.batch() and any later re-read — executes
// against the real, already-migrated database. This faithfully models "a
// competing pointer change commits after the handler's pre-read but before
// its batch executes": the handler proceeds as if the stale snapshot were
// still current, then the commit-time guard in worker/d1/projects.mjs must
// independently catch the mismatch against the row's true live state.
function interleavingDb(realDb, { staleRow }) {
  let projectReadCallCount = 0;
  return {
    prepare(sql) {
      if (sql.startsWith("SELECT id, slug, published_revision_id, draft_revision_id FROM projects")) {
        projectReadCallCount += 1;
        if (projectReadCallCount === 1) {
          return {
            bind() {
              return this;
            },
            first: async () => staleRow,
          };
        }
      }
      return realDb.prepare(sql);
    },
    batch: statements => realDb.batch(statements),
  };
}

function mutationRequest(pathname, { method, token, origin = ORIGIN, contentType = "application/json", body } = {}) {
  const headers = { Origin: origin, "Content-Type": contentType };
  if (token) headers[ACCESS_ASSERTION_HEADER] = token;
  return new Request(`${ORIGIN}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

function readRequest(pathname, { token } = {}) {
  const headers = {};
  if (token) headers[ACCESS_ASSERTION_HEADER] = token;
  return new Request(`${ORIGIN}${pathname}`, { method: "GET", headers });
}

async function callAdmin(request, { db, jwks } = {}) {
  const spyAssets = fakeAssets();
  const response = await handleRequest(request, {
    assets: spyAssets,
    teamDomain: TEAM_DOMAIN,
    audience: AUDIENCE,
    getJWKS: () => jwks,
    dispatch: ({ request, url, assets, sub }) => handleAdminDispatch({ request, url, assets, db, sub }),
  });
  return { response, assets: spyAssets };
}

function validProjectPayload(overrides = {}) {
  return {
    id: "project-atomic-lab",
    slug: "atomic-lab",
    order: 1,
    category: "RESEARCH",
    title: "Atomic Lab",
    summary: "A bounded test project.",
    stack: ["Test"],
    accent: "gold",
    icon: "lab",
    featured: false,
    ...overrides,
  };
}

async function countRows(db, table, whereSql = "", ...params) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table} ${whereSql}`).bind(...params).first();
  return row.n;
}

// --- AS20-F002/F003: zero D1/mutation before valid auth ---

const MUTATING_ROUTES = [
  { method: "POST", path: "/admin/api/projects", body: validProjectPayload() },
  { method: "PUT", path: "/admin/api/projects/project-x/draft", body: { ...validProjectPayload(), expectedPublishedRevisionId: null, expectedDraftRevisionId: null } },
  { method: "POST", path: "/admin/api/projects/project-x/publish", body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: 1 } },
  { method: "POST", path: "/admin/api/projects/project-x/unpublish", body: { expectedPublishedRevisionId: 1, expectedDraftRevisionId: null } },
];

for (const route of MUTATING_ROUTES) {
  test(`unauthenticated ${route.method} ${route.path} is rejected with zero D1 invocation`, async () => {
    const { jwks } = await buildTestIdentity();
    const spy = dbSpy();
    const request = mutationRequest(route.path, { method: route.method, body: route.body });
    const { response } = await callAdmin(request, { db: spy, jwks });
    assert.equal(response.status, 401);
    assert.equal(spy.calls.length, 0);
  });
}

test("unauthenticated GET .../preview is rejected with zero D1 invocation", async () => {
  const { jwks } = await buildTestIdentity();
  const spy = dbSpy();
  const { response } = await callAdmin(readRequest("/admin/api/projects/project-x/preview"), { db: spy, jwks });
  assert.equal(response.status, 401);
  assert.equal(spy.calls.length, 0);
});

// --- AS20-F003: empty/missing sub cannot mutate, but can still preview ---

for (const route of MUTATING_ROUTES) {
  test(`a valid Access token with no usable subject cannot ${route.method} ${route.path} (403, zero D1 invocation)`, async () => {
    const { privateKey, jwks } = await buildTestIdentity();
    const serviceToken = await signToken(privateKey, { sub: null });
    const spy = dbSpy();
    const request = mutationRequest(route.path, { method: route.method, token: serviceToken, body: route.body });
    const { response } = await callAdmin(request, { db: spy, jwks });
    assert.equal(response.status, 403);
    assert.equal(spy.calls.length, 0);
  });
}

test("a valid Access token with no usable subject can still read preview", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: "creator" });
    const serviceToken = await signToken(privateKey, { sub: null });
    await callAdmin(mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }), { db, jwks });

    const { response } = await callAdmin(readRequest("/admin/api/projects/project-atomic-lab/preview", { token: serviceToken }), {
      db,
      jwks,
    });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

// --- AS21-F008 (Remediation Cycle 1): bounded mutation subject ---

test("an empty-string subject cannot mutate (403, zero D1 invocation)", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, { sub: "" });
  const spy = dbSpy();
  const { response } = await callAdmin(
    mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }),
    { db: spy, jwks }
  );
  assert.equal(response.status, 403);
  assert.equal(spy.calls.length, 0);
});

test("a whitespace-only subject cannot mutate (403, zero D1 invocation)", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, { sub: "   \t\n  " });
  const spy = dbSpy();
  const { response } = await callAdmin(
    mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }),
    { db: spy, jwks }
  );
  assert.equal(response.status, 403);
  assert.equal(spy.calls.length, 0);
});

test("an oversized subject (91 chars, one past the 90-char bound) cannot mutate (403, zero D1 invocation)", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, { sub: "s".repeat(91) });
  const spy = dbSpy();
  const { response } = await callAdmin(
    mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }),
    { db: spy, jwks }
  );
  assert.equal(response.status, 403);
  assert.equal(spy.calls.length, 0);
});

test("the maximum accepted subject (exactly 90 chars) completes a normal mutation and produces a valid bounded cf-access:<sub> audit actor", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const maxSubject = "s".repeat(90);
    const token = await signToken(privateKey, { sub: maxSubject });
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }),
      { db, jwks }
    );
    assert.equal(response.status, 201);

    const auditRow = await db
      .prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_create_draft'")
      .bind("project-atomic-lab")
      .first();
    const expectedActor = `cf-access:${maxSubject}`;
    assert.equal(expectedActor.length, 100, "sanity check: exactly ADR-005's ACTOR_PATTERN upper bound");
    assert.equal(auditRow.actor, expectedActor);
    assert.equal(auditRow.result, "success");
  } finally {
    await cleanup();
  }
});

// --- AS20-F004: same-origin + JSON + bounded body ---

test("a mutating request with a missing/mismatched Origin is rejected (403) before any D1 access", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  for (const origin of [undefined, "https://evil.example"]) {
    const spy = dbSpy();
    const request = mutationRequest("/admin/api/projects", { method: "POST", token, origin, body: validProjectPayload() });
    if (origin === undefined) request.headers.delete("Origin");
    const { response } = await callAdmin(request, { db: spy, jwks });
    assert.equal(response.status, 403);
    assert.equal(spy.calls.length, 0);
  }
});

test("a mutating request with a non-JSON content type is rejected (415) before any D1 access", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = mutationRequest("/admin/api/projects", {
    method: "POST",
    token,
    contentType: "application/x-www-form-urlencoded",
    body: "id=x&slug=y",
  });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 415);
  assert.equal(spy.calls.length, 0);
});

test("an oversized mutating request body is rejected (413) before any D1 access", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const oversizedSummary = "x".repeat(64 * 1024);
  const request = mutationRequest("/admin/api/projects", {
    method: "POST",
    token,
    body: validProjectPayload({ summary: oversizedSummary }),
  });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 413);
  assert.equal(spy.calls.length, 0);
});

test("AS21-F009: a declared Content-Length over the budget is rejected (413) as an early reject, before the body is read", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = new Request(`${ORIGIN}/admin/api/projects`, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "Content-Length": String(64 * 1024),
      [ACCESS_ASSERTION_HEADER]: token,
    },
    body: JSON.stringify(validProjectPayload()),
  });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 413);
  assert.equal(spy.calls.length, 0);
});

test("AS21-F009: a multibyte body that exceeds the 32 KiB byte budget is rejected (413) even though its JS string length is well under 32768", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();

  // Each "あ" is 1 UTF-16 code unit (JS string length) but 3 bytes in UTF-8.
  // 11000 repetitions: JS length ~11000 (far under the old, buggy
  // character-counted 32768 threshold) but real UTF-8 byte length = 33000+
  // (over the true 32 KiB = 32768-byte budget). A character-count-based
  // check would have wrongly accepted this; a byte-accurate check must not.
  const multibyteChar = "あ"; // "あ"
  const rawBody = JSON.stringify({ note: multibyteChar.repeat(11000) });
  assert.ok(rawBody.length < 32768, "sanity check: JS string length stays under the old buggy threshold");
  assert.ok(Buffer.byteLength(rawBody, "utf8") > 32768, "sanity check: real UTF-8 byte length exceeds the true budget");

  const request = mutationRequest("/admin/api/projects", { method: "POST", token, body: rawBody });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 413);
  assert.equal(spy.calls.length, 0);
});

test("a malformed JSON mutating request body is rejected (400) before any D1 access", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = mutationRequest("/admin/api/projects", { method: "POST", token, body: "{not-json" });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 400);
  assert.equal(spy.calls.length, 0);
});

// --- create draft (AS20-F005) ---

test("POST /admin/api/projects creates one project + one immutable revision + one success audit row, atomically", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: "creator-1" });
    const request = mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() });
    const { response } = await callAdmin(request, { db, jwks });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.id, "project-atomic-lab");
    assert.equal(body.slug, "atomic-lab");
    assert.equal(body.state, "draft");
    assert.equal(body.publishedRevisionId, null);
    assert.ok(Number.isInteger(body.draftRevisionId));
    assert.equal(body.revisionId, body.draftRevisionId);

    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.slug, "atomic-lab");
    assert.equal(projectRow.published_revision_id, null);
    assert.equal(projectRow.draft_revision_id, body.draftRevisionId);

    const revisionRows = (
      await db.prepare("SELECT * FROM project_revisions WHERE project_id = ?").bind("project-atomic-lab").all()
    ).results;
    assert.equal(revisionRows.length, 1);
    assert.equal(revisionRows[0].revision_number, 1);
    assert.equal(revisionRows[0].title, "Atomic Lab");

    const auditRows = (await db.prepare("SELECT * FROM audit_log WHERE entity_id = ?").bind("project-atomic-lab").all())
      .results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].action, "project_create_draft");
    assert.equal(auditRows[0].entity_type, "project");
    assert.equal(auditRows[0].result, "success");
    assert.equal(auditRows[0].revision_id, body.draftRevisionId);
    assert.equal(auditRows[0].actor, "cf-access:creator-1");
  } finally {
    await cleanup();
  }
});

test("create-draft rejects a duplicate id/slug with 409, zero new rows, and a failure audit event", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await callAdmin(mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }), { db, jwks });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }),
      { db, jwks }
    );
    assert.equal(response.status, 409);

    assert.equal(await countRows(db, "projects", "WHERE id = ?", "project-atomic-lab"), 1);
    assert.equal(await countRows(db, "project_revisions", "WHERE project_id = ?", "project-atomic-lab"), 1);

    const auditRows = (await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? ORDER BY id").bind("project-atomic-lab").all())
      .results;
    assert.equal(auditRows.length, 2);
    assert.equal(auditRows[0].result, "success");
    assert.equal(auditRows[1].result, "failure");
    assert.equal(auditRows[1].action, "project_create_draft");
  } finally {
    await cleanup();
  }
});

test("create-draft rejects invalid content with 400, writes no project/revision row, and records a bounded failure audit", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload({ accent: "not-a-real-accent" }) }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "projects"), 0);
    assert.equal(await countRows(db, "project_revisions"), 0);

    const auditRows = (await db.prepare("SELECT * FROM audit_log WHERE entity_id = ?").bind("project-atomic-lab").all()).results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].result, "failure");
  } finally {
    await cleanup();
  }
});

test("create-draft with an unusable id records the bounded 'unassigned' audit sentinel, never a raw invalid value", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload({ id: "Not A Valid Id!" }) }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
    const auditRows = (await db.prepare("SELECT * FROM audit_log WHERE action = 'project_create_draft'").all()).results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].entity_id, "unassigned");
  } finally {
    await cleanup();
  }
});

// --- edit draft (AS20-F005, AS20-F006) ---

async function createProject(db, jwks, token, overrides = {}) {
  const { response } = await callAdmin(
    mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload(overrides) }),
    { db, jwks }
  );
  return response.json();
}

test("PUT .../draft creates a new immutable revision, moves only draft_revision_id, and leaves revision 1 untouched", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: "editor-1" });
    const created = await createProject(db, jwks, token);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Atomic Lab v2" }),
          expectedPublishedRevisionId: created.publishedRevisionId,
          expectedDraftRevisionId: created.draftRevisionId,
        },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.notEqual(body.draftRevisionId, created.draftRevisionId);
    assert.equal(body.publishedRevisionId, null);

    const revisionRows = (
      await db.prepare("SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number").bind("project-atomic-lab").all()
    ).results;
    assert.equal(revisionRows.length, 2);
    assert.equal(revisionRows[0].title, "Atomic Lab", "revision 1 content is untouched");
    assert.equal(revisionRows[1].title, "Atomic Lab v2");

    const auditRows = (
      await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_update_draft'").bind("project-atomic-lab").all()
    ).results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].result, "success");
    assert.equal(auditRows[0].revision_id, body.draftRevisionId);
  } finally {
    await cleanup();
  }
});

test("PUT .../draft with a stale expectedDraftRevisionId is rejected (409) with zero content/pointer change", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validProjectPayload({ title: "Should Not Apply" }), expectedPublishedRevisionId: null, expectedDraftRevisionId: 999999 },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 409);

    assert.equal(await countRows(db, "project_revisions", "WHERE project_id = ?", "project-atomic-lab"), 1);
    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.draft_revision_id, created.draftRevisionId, "pointer unchanged");
  } finally {
    await cleanup();
  }
});

test("PUT .../draft on an unknown project returns 404 with a bounded failure audit", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/does-not-exist/draft", {
        method: "PUT",
        token,
        body: { ...validProjectPayload(), expectedPublishedRevisionId: null, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 404);
    const auditRows = (await db.prepare("SELECT * FROM audit_log WHERE entity_id = 'does-not-exist'").all()).results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].result, "failure");
  } finally {
    await cleanup();
  }
});

test("PUT .../draft without expectedPublishedRevisionId/expectedDraftRevisionId is rejected (400)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await createProject(db, jwks, token);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", { method: "PUT", token, body: validProjectPayload() }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
  } finally {
    await cleanup();
  }
});

// --- preview (AS20-F014) ---

test("GET .../preview returns 404 when no draft exists and never falls back to published content", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    // Published, no draft now.
    const { response } = await callAdmin(readRequest("/admin/api/projects/project-atomic-lab/preview", { token }), { db, jwks });
    assert.equal(response.status, 404);
  } finally {
    await cleanup();
  }
});

test("GET .../preview reads only the current draft content, distinct from published content, and writes no audit row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Draft-Only Title" }),
          expectedPublishedRevisionId: created.draftRevisionId,
          expectedDraftRevisionId: null,
        },
      }),
      { db, jwks }
    );

    const auditCountBefore = await countRows(db, "audit_log");
    const { response } = await callAdmin(readRequest("/admin/api/projects/project-atomic-lab/preview", { token }), { db, jwks });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.title, "Draft-Only Title");
    assert.equal(body.state, "published_with_draft");
    const auditCountAfter = await countRows(db, "audit_log");
    assert.equal(auditCountAfter, auditCountBefore, "preview writes no audit event");
  } finally {
    await cleanup();
  }
});

// --- publish (AS20-F007) ---

test("POST .../publish atomically promotes the draft, clears the draft pointer, preserves history, and appends one success audit row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: "publisher-1" });
    const created = await createProject(db, jwks, token);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.publishedRevisionId, created.draftRevisionId);
    assert.equal(body.draftRevisionId, null);
    assert.equal(body.state, "published");

    assert.equal(await countRows(db, "project_revisions", "WHERE project_id = ?", "project-atomic-lab"), 1, "no revision deleted");

    const auditRows = (
      await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_publish'").bind("project-atomic-lab").all()
    ).results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].result, "success");
    assert.equal(auditRows[0].revision_id, created.draftRevisionId);
    assert.equal(auditRows[0].actor, "cf-access:publisher-1");
  } finally {
    await cleanup();
  }
});

test("POST .../publish with no current draft is rejected (409) with zero pointer change", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 409);
  } finally {
    await cleanup();
  }
});

test("POST .../publish with a stale expected pointer is rejected (409) with zero pointer change", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: 999999, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 409);
    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.published_revision_id, null);
    assert.equal(projectRow.draft_revision_id, created.draftRevisionId);
  } finally {
    await cleanup();
  }
});

test("POST .../publish fully revalidates the persisted draft and refuses to promote corrupted stored content", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    // Simulate corrupted/out-of-band-altered stored draft content that
    // could never have passed this same server's own write-time
    // validation — proves publish re-validates the persisted row rather
    // than trusting that a prior write remains valid (AS20-F007). Uses
    // stack_json (no DB-level CHECK constraint of its own) rather than a
    // CHECK-constrained column so this UPDATE itself succeeds, letting the
    // corruption surface only when the application re-validates it.
    await db
      .prepare("UPDATE project_revisions SET stack_json = ? WHERE id = ?")
      .bind("not-valid-json", created.draftRevisionId)
      .run();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 500);
    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.published_revision_id, null, "corrupted draft was never promoted");

    const auditRows = (
      await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_publish'").bind("project-atomic-lab").all()
    ).results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].result, "failure");
  } finally {
    await cleanup();
  }
});

// --- unpublish (AS20-F008) ---

test("POST .../unpublish atomically clears the published pointer, preserves history/draft, and appends one success audit row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: "unpublisher-1" });
    const created = await createProject(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    // A later, independent draft edit after publish.
    const { response: editResponse } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Independent Draft" }),
          expectedPublishedRevisionId: created.draftRevisionId,
          expectedDraftRevisionId: null,
        },
      }),
      { db, jwks }
    );
    const editedBody = await editResponse.json();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/unpublish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: editedBody.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.publishedRevisionId, null);
    assert.equal(body.draftRevisionId, editedBody.draftRevisionId, "independent draft pointer preserved");
    assert.equal(body.state, "draft");

    assert.equal(await countRows(db, "project_revisions", "WHERE project_id = ?", "project-atomic-lab"), 2, "no revision deleted");

    const auditRows = (
      await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_unpublish'").bind("project-atomic-lab").all()
    ).results;
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].result, "success");
    assert.equal(auditRows[0].revision_id, created.draftRevisionId);
    assert.equal(auditRows[0].actor, "cf-access:unpublisher-1");
  } finally {
    await cleanup();
  }
});

test("POST .../unpublish with nothing published is rejected (409) with zero pointer change", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/unpublish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 409);
  } finally {
    await cleanup();
  }
});

// --- AS21-F007 (Remediation Cycle 1): commit-time stale-write enforcement ---
// These deterministically simulate a competing pointer change that commits
// *after* the handler's pre-read but *before* its batch executes, using
// interleavingDb (see helper above) — a pre-read-only guard would miss
// every one of these; the commit-time guard in worker/d1/projects.mjs must
// catch them independently.

test("edit vs a competing draft change: the stale edit is rejected (409), the competing draft survives, no orphan revision, no success audit", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    // The "competing" edit — a genuinely separate, successful request that
    // commits for real before the stale request's batch runs.
    const { response: competingResponse } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Competing Edit" }),
          expectedPublishedRevisionId: created.publishedRevisionId,
          expectedDraftRevisionId: created.draftRevisionId,
        },
      }),
      { db, jwks }
    );
    const competing = await competingResponse.json();
    assert.notEqual(competing.draftRevisionId, created.draftRevisionId);

    // The stale request's pre-read is forced to see the pre-competing-edit
    // snapshot, exactly as if it had read the row a moment before the
    // competing edit committed.
    const staleRow = { id: created.id, slug: created.slug, published_revision_id: null, draft_revision_id: created.draftRevisionId };
    const staleDb = interleavingDb(db, { staleRow });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Stale Edit Must Not Apply" }),
          expectedPublishedRevisionId: null,
          expectedDraftRevisionId: created.draftRevisionId,
        },
      }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);

    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.draft_revision_id, competing.draftRevisionId, "the competing edit's draft pointer survives untouched");

    const revisionRows = (
      await db.prepare("SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number").bind("project-atomic-lab").all()
    ).results;
    assert.equal(revisionRows.length, 2, "no orphan revision row from the stale attempt");
    assert.equal(revisionRows[1].title, "Competing Edit", "the competing edit's content, not the stale request's, is what exists");

    const successAudits = (
      await db
        .prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_update_draft' AND result = 'success'")
        .bind("project-atomic-lab")
        .all()
    ).results;
    assert.equal(successAudits.length, 1, "exactly the competing edit's success row — none for the stale attempt");
  } finally {
    await cleanup();
  }
});

test("publish vs a competing draft change: the stale publish is rejected (409), the competing draft survives unpublished, no success audit", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    // Competing edit moves the draft pointer after the stale request would
    // have read the original draft.
    const { response: competingResponse } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Competing Edit Before Publish" }),
          expectedPublishedRevisionId: null,
          expectedDraftRevisionId: created.draftRevisionId,
        },
      }),
      { db, jwks }
    );
    const competing = await competingResponse.json();

    const staleRow = { id: created.id, slug: created.slug, published_revision_id: null, draft_revision_id: created.draftRevisionId };
    const staleDb = interleavingDb(db, { staleRow });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);

    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.published_revision_id, null, "the stale publish never took effect");
    assert.equal(projectRow.draft_revision_id, competing.draftRevisionId, "the competing draft pointer survives untouched");

    const successAudits = (
      await db
        .prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_publish' AND result = 'success'")
        .bind("project-atomic-lab")
        .all()
    ).results;
    assert.equal(successAudits.length, 0, "no success audit row for the stale publish attempt");
  } finally {
    await cleanup();
  }
});

test("unpublish vs a competing pointer change: the stale unpublish is rejected (409), the competing state survives, no success audit", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );

    // Competing edit creates a new independent draft after publish, which
    // the stale unpublish request's pre-read snapshot predates.
    const { response: competingResponse } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Competing Draft After Publish" }),
          expectedPublishedRevisionId: created.draftRevisionId,
          expectedDraftRevisionId: null,
        },
      }),
      { db, jwks }
    );
    const competing = await competingResponse.json();

    const staleRow = {
      id: created.id,
      slug: created.slug,
      published_revision_id: created.draftRevisionId,
      draft_revision_id: null,
    };
    const staleDb = interleavingDb(db, { staleRow });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/unpublish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: null },
      }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);

    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.published_revision_id, created.draftRevisionId, "the stale unpublish never took effect");
    assert.equal(projectRow.draft_revision_id, competing.draftRevisionId, "the competing draft pointer survives untouched");

    const successAudits = (
      await db
        .prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'project_unpublish' AND result = 'success'")
        .bind("project-atomic-lab")
        .all()
    ).results;
    assert.equal(successAudits.length, 0, "no success audit row for the stale unpublish attempt");
  } finally {
    await cleanup();
  }
});

// --- AS20-F009/F010: real D1 atomicity/rollback proof ---

test("a forced audit-statement failure inside a create-draft-shaped batch rolls back the project/revision insert too", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const id = "project-atomic-rollback";
    const createdAt = "2026-01-01T00:00:00.000Z";
    const statements = [
      db.prepare("INSERT INTO projects (id, slug, created_at) VALUES (?, ?, ?)").bind(id, "atomic-rollback", createdAt),
      db
        .prepare(
          "INSERT INTO project_revisions (project_id, revision_number, sort_order, category, title, summary, stack_json, accent, icon, featured, created_at, created_by) " +
            "VALUES (?, 1, 1, 'TEST', 'Title', 'Summary', '[]', 'gold', 'lab', 0, ?, ?)"
        )
        .bind(id, createdAt, "cf-access:test-actor"),
      db
        .prepare(
          "UPDATE projects SET draft_revision_id = (SELECT id FROM project_revisions WHERE project_id = ? AND revision_number = 1) WHERE id = ?"
        )
        .bind(id, id),
      // Deliberately invalid `result` forces a genuine SQL-level CHECK
      // violation on the audit statement specifically, proving the whole
      // batch — including the two otherwise-valid inserts and the pointer
      // update above — rolls back together (D1 batch() is transactional).
      db
        .prepare(
          "INSERT INTO audit_log (occurred_at, actor, action, entity_type, entity_id, revision_id, result) " +
            "VALUES (?, ?, ?, ?, ?, (SELECT id FROM project_revisions WHERE project_id = ? AND revision_number = 1), 'not-a-real-result')"
        )
        .bind(createdAt, "cf-access:test-actor", "project_create_draft", "project", id, id),
    ];

    await assert.rejects(() => db.batch(statements), /CHECK|CONSTRAINT/i);

    assert.equal(await db.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first(), null);
    assert.equal((await db.prepare("SELECT * FROM project_revisions WHERE project_id = ?").bind(id).all()).results.length, 0);
    assert.equal((await db.prepare("SELECT * FROM audit_log WHERE entity_id = ?").bind(id).all()).results.length, 0);
  } finally {
    await cleanup();
  }
});

test("a simulated storage failure during publish returns a generic 500, changes nothing, and never reports success", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    const failing = batchFailingDb(db);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db: failing, jwks }
    );
    assert.equal(response.status, 500);
    const text = await response.text();
    assert.ok(!text.includes("SIMULATED_BATCH_FAILURE"));

    const projectRow = await db.prepare("SELECT * FROM projects WHERE id = ?").bind("project-atomic-lab").first();
    assert.equal(projectRow.published_revision_id, null, "no partial publish occurred");
  } finally {
    await cleanup();
  }
});

// --- AS20-F002: no delete route, unknown sub-routes, fail-closed methods ---

test("DELETE is never an accepted method on any project route", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);

    for (const path of [
      "/admin/api/projects",
      `/admin/api/projects/${created.id}/draft`,
      `/admin/api/projects/${created.id}/publish`,
      `/admin/api/projects/${created.id}/unpublish`,
    ]) {
      const { response } = await callAdmin(mutationRequest(path, { method: "DELETE", token, body: {} }), { db, jwks });
      assert.equal(response.status, 405, `${path} must reject DELETE`);
    }
  } finally {
    await cleanup();
  }
});

test("an unrecognized /admin/api/projects/* sub-route returns protected 404 with zero D1 invocation", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const { response } = await callAdmin(readRequest("/admin/api/projects/some-id/delete", { token }), { db: spy, jwks });
  assert.equal(response.status, 404);
  assert.equal(spy.calls.length, 0);
});

test("GET /admin/api/projects (wrong method on the create route) returns 405 with zero D1 invocation", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const { response } = await callAdmin(readRequest("/admin/api/projects", { token }), { db: spy, jwks });
  assert.equal(response.status, 405);
  assert.equal(spy.calls.length, 0);
});

// --- AS21-F010 (Remediation Cycle 1): route/method classification precedes the DB-binding requirement ---

test("an unrecognized project sub-route returns 404, not 503, even when DB is absent", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const { response } = await callAdmin(readRequest("/admin/api/projects/some-id/delete", { token }), { db: undefined, jwks });
  assert.equal(response.status, 404);
});

test("a wrong method on a recognized project route returns 405, not 503, even when DB is absent", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const { response } = await callAdmin(readRequest("/admin/api/projects", { token }), { db: undefined, jwks });
  assert.equal(response.status, 405);
});

test("a recognized project route+method returns 503 when DB is absent", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const { response } = await callAdmin(
    mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }),
    { db: undefined, jwks }
  );
  assert.equal(response.status, 503);
});

// --- headers / no leakage ---

test("every project route response carries Cache-Control: no-store, and mutation JSON carries nosniff with no permissive CORS", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", { method: "POST", token, body: validProjectPayload() }),
      { db, jwks }
    );
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
    assert.match(response.headers.get("Content-Type") ?? "", /^application\/json/);
  } finally {
    await cleanup();
  }
});

test("a generic internal error never leaks D1/SQL detail, subject, or claims", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: "SHOULD_NOT_LEAK_SUBJECT" });
    const created = await createProject(db, jwks, token);
    const failing = batchFailingDb(db);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db: failing, jwks }
    );
    const text = await response.text();
    assert.ok(!text.toLowerCase().includes("select"));
    assert.ok(!text.includes("SHOULD_NOT_LEAK_SUBJECT"));
    assert.ok(!text.includes(token));
  } finally {
    await cleanup();
  }
});

// --- regression: schema unchanged, dashboard unchanged ---

test("the current schema remains exactly 17 product tables after project mutation activity", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await createProject(db, jwks, token);

    const tableRows = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    const tables = tableRows.results
      .map(row => row.name)
      .filter(name => !name.startsWith("_cf_") && !name.startsWith("sqlite_") && name !== "d1_migrations");
    assert.equal(tables.length, 17);
    assert.deepEqual(tables, [...ALL_PRODUCT_TABLE_NAMES].sort());
  } finally {
    await cleanup();
  }
});

test("GET /admin/api/dashboard remains unchanged (same 7 keys, no audit/mutation data) after project mutation activity", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );

    const payload = await buildDashboardPayload(db);
    assert.deepEqual(Object.keys(payload).sort(), [
      "foundations",
      "navigation",
      "processSteps",
      "projects",
      "services",
      "sections",
      "siteSettings",
    ].sort());
    const rawText = JSON.stringify(payload);
    assert.ok(!rawText.toLowerCase().includes("audit"));

    const { response } = await callAdmin(readRequest(DASHBOARD_PATH, { token }), { db, jwks });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

// --- WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029): project
// create/edit media-snapshot integration ---

async function insertActiveMedia(db, overrides = {}) {
  const id = overrides.id ?? crypto.randomUUID();
  await db
    .prepare("INSERT INTO media (id, storage_key, content_type, size_bytes, alt_text, uploaded_at, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(
      id,
      overrides.storageKey ?? `media/${id}.jpg`,
      overrides.contentType ?? "image/jpeg",
      overrides.sizeBytes ?? 1024,
      overrides.altText ?? "alt",
      overrides.uploadedAt ?? new Date().toISOString(),
      overrides.uploadedBy ?? "cf-access:seed"
    )
    .run();
  return id;
}

async function projectMediaRows(db, revisionId) {
  const result = await db
    .prepare("SELECT media_id, role, sort_order FROM project_media WHERE project_revision_id = ? ORDER BY sort_order")
    .bind(revisionId)
    .all();
  return result.results.map(row => ({ mediaId: row.media_id, role: row.role, order: row.sort_order }));
}

test("POST /admin/api/projects accepts an optional media snapshot for the new revision (AS23-F012)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db, { contentType: "image/jpeg", altText: "cover shot" });
    const galleryId = await insertActiveMedia(db, { contentType: "image/png", altText: "gallery shot" });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", {
        method: "POST",
        token,
        body: {
          ...validProjectPayload(),
          media: [
            { mediaId: coverId, role: "cover", order: 0 },
            { mediaId: galleryId, role: "gallery", order: 1 },
          ],
        },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 201);
    const created = await response.json();

    assert.deepEqual(await projectMediaRows(db, created.draftRevisionId), [
      { mediaId: coverId, role: "cover", order: 0 },
      { mediaId: galleryId, role: "gallery", order: 1 },
    ]);

    const { response: previewResponse } = await callAdmin(
      readRequest("/admin/api/projects/project-atomic-lab/preview", { token }),
      { db, jwks }
    );
    const preview = await previewResponse.json();
    assert.equal(preview.media.length, 2);
    assert.equal(preview.media[0].contentType, "image/jpeg");
    assert.equal(preview.media[0].altText, "cover shot");
    assert.equal(preview.media[0].role, "cover");
    assert.equal(preview.media[1].role, "gallery");
    // Positive projection only — no storage key ever leaves this route.
    assert.equal(preview.media[0].storageKey, undefined);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/projects omitting media commits an empty snapshot, never an implicit copy", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createProject(db, jwks, token);
    assert.deepEqual(await projectMediaRows(db, created.draftRevisionId), []);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/projects rejects a media snapshot referencing a missing media id, and commits no project/revision/project_media row (AS23-F012)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", {
        method: "POST",
        token,
        body: { ...validProjectPayload(), media: [{ mediaId: "00000000-0000-0000-0000-000000000000", role: "cover", order: 0 }] },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "projects"), 0);
    assert.equal(await countRows(db, "project_revisions"), 0);
    assert.equal(await countRows(db, "project_media"), 0);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/projects rejects a media snapshot with a duplicate (mediaId, role) entry, and commits nothing (AS23-F012)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", {
        method: "POST",
        token,
        body: {
          ...validProjectPayload(),
          media: [
            { mediaId: coverId, role: "cover", order: 0 },
            { mediaId: coverId, role: "cover", order: 1 },
          ],
        },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "projects"), 0);
  } finally {
    await cleanup();
  }
});

test("PUT .../draft omitting media inherits the source revision's association snapshot; the prior revision's rows are untouched (AS23-F012)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const { response: createResponse } = await callAdmin(
      mutationRequest("/admin/api/projects", {
        method: "POST",
        token,
        body: { ...validProjectPayload(), media: [{ mediaId: coverId, role: "cover", order: 0 }] },
      }),
      { db, jwks }
    );
    const created = await createResponse.json();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Text-Only Edit" }),
          expectedPublishedRevisionId: created.publishedRevisionId,
          expectedDraftRevisionId: created.draftRevisionId,
        },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const updated = await response.json();
    assert.notEqual(updated.draftRevisionId, created.draftRevisionId);

    const inherited = [{ mediaId: coverId, role: "cover", order: 0 }];
    assert.deepEqual(await projectMediaRows(db, updated.draftRevisionId), inherited, "the new revision inherits the source snapshot");
    assert.deepEqual(await projectMediaRows(db, created.draftRevisionId), inherited, "the prior revision's own rows are untouched");
  } finally {
    await cleanup();
  }
});

test("PUT .../draft with an explicit media array fully replaces the new revision's snapshot; the prior revision's rows are unchanged (AS23-F012)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const galleryId = await insertActiveMedia(db);
    const { response: createResponse } = await callAdmin(
      mutationRequest("/admin/api/projects", {
        method: "POST",
        token,
        body: { ...validProjectPayload(), media: [{ mediaId: coverId, role: "cover", order: 0 }] },
      }),
      { db, jwks }
    );
    const created = await createResponse.json();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Replaced Media" }),
          expectedPublishedRevisionId: created.publishedRevisionId,
          expectedDraftRevisionId: created.draftRevisionId,
          media: [{ mediaId: galleryId, role: "gallery", order: 0 }],
        },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const updated = await response.json();

    assert.deepEqual(await projectMediaRows(db, updated.draftRevisionId), [{ mediaId: galleryId, role: "gallery", order: 0 }]);
    assert.deepEqual(
      await projectMediaRows(db, created.draftRevisionId),
      [{ mediaId: coverId, role: "cover", order: 0 }],
      "the prior revision's own project_media rows are immutable and unchanged"
    );
  } finally {
    await cleanup();
  }
});

test("GET .../preview returns exact-draft media metadata only, never falling back to the published revision's associations (AS23-F014)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const publishedMediaId = await insertActiveMedia(db, { altText: "published photo" });
    const draftMediaId = await insertActiveMedia(db, { altText: "draft photo" });

    const { response: createResponse } = await callAdmin(
      mutationRequest("/admin/api/projects", {
        method: "POST",
        token,
        body: { ...validProjectPayload(), media: [{ mediaId: publishedMediaId, role: "cover", order: 0 }] },
      }),
      { db, jwks }
    );
    const created = await createResponse.json();

    await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );

    const { response: editResponse } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "New Draft" }),
          expectedPublishedRevisionId: created.draftRevisionId,
          expectedDraftRevisionId: null,
          media: [{ mediaId: draftMediaId, role: "cover", order: 0 }],
        },
      }),
      { db, jwks }
    );
    const edited = await editResponse.json();

    const { response: previewResponse } = await callAdmin(
      readRequest("/admin/api/projects/project-atomic-lab/preview", { token }),
      { db, jwks }
    );
    const preview = await previewResponse.json();
    assert.equal(preview.media.length, 1);
    assert.equal(preview.media[0].altText, "draft photo", "preview shows the exact draft's media, not the published revision's");

    assert.deepEqual(
      await projectMediaRows(db, created.draftRevisionId),
      [{ mediaId: publishedMediaId, role: "cover", order: 0 }],
      "the published revision's own association snapshot is unchanged by the later draft edit"
    );
    assert.notEqual(edited.draftRevisionId, created.draftRevisionId);
  } finally {
    await cleanup();
  }
});

test("a D1 batch failure during create-with-media leaves no project, revision, or project_media row behind (AS23-F013)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects", {
        method: "POST",
        token,
        body: { ...validProjectPayload(), media: [{ mediaId: coverId, role: "cover", order: 0 }] },
      }),
      { db: batchFailingDb(db), jwks }
    );
    assert.equal(response.status, 409);
    assert.equal(await countRows(db, "projects"), 0);
    assert.equal(await countRows(db, "project_revisions"), 0);
    assert.equal(await countRows(db, "project_media"), 0);
  } finally {
    await cleanup();
  }
});

test("a stale edit carrying an explicit media snapshot is still rejected (409) by the existing commit-time guard; no project_media row from the rejected attempt survives (AS23-F013/F016)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const created = await createProject(db, jwks, token);

    const { response: competingResponse } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Competing Edit" }),
          expectedPublishedRevisionId: created.publishedRevisionId,
          expectedDraftRevisionId: created.draftRevisionId,
        },
      }),
      { db, jwks }
    );
    const competing = await competingResponse.json();

    const staleRow = { id: created.id, slug: created.slug, published_revision_id: null, draft_revision_id: created.draftRevisionId };
    const staleDb = interleavingDb(db, { staleRow });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/projects/project-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validProjectPayload({ title: "Stale Edit Must Not Apply" }),
          expectedPublishedRevisionId: null,
          expectedDraftRevisionId: created.draftRevisionId,
          media: [{ mediaId: coverId, role: "cover", order: 0 }],
        },
      }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);

    const revisionRows = (
      await db.prepare("SELECT id FROM project_revisions WHERE project_id = ? ORDER BY revision_number").bind("project-atomic-lab").all()
    ).results;
    assert.equal(revisionRows.length, 2, "no orphan revision row from the stale attempt");
    assert.equal(await countRows(db, "project_media", "WHERE media_id = ?", coverId), 0, "the stale attempt's media snapshot never committed");
    assert.deepEqual(await projectMediaRows(db, competing.draftRevisionId), [], "the competing edit's own (empty) snapshot is unaffected");
  } finally {
    await cleanup();
  }
});
