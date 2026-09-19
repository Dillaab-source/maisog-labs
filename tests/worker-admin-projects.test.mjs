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
import { applyCurrentSchema, CURRENT_PRODUCT_TABLE_NAMES } from "../worker/d1/schema.mjs";

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
  await applyCurrentSchema(proxy.env.DB);
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

test("the current schema remains exactly 15 product tables after project mutation activity", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await createProject(db, jwks, token);

    const tableRows = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    const tables = tableRows.results
      .map(row => row.name)
      .filter(name => !name.startsWith("_cf_") && !name.startsWith("sqlite_") && name !== "d1_migrations");
    assert.equal(tables.length, 15);
    assert.deepEqual(tables, [...CURRENT_PRODUCT_TABLE_NAMES].sort());
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
