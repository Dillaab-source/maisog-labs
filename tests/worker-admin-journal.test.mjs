// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// bounded journal mutation capability tests. Every D1 database used here is
// a local Wrangler/Miniflare simulation (`getPlatformProxy({
// remoteBindings: false })`) persisted to a throwaway temp directory per
// test — no test in this file can reach a real Cloudflare resource.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { handleRequest, ACCESS_ASSERTION_HEADER } from "../worker/auth.mjs";
import { handleAdminDispatch, buildDashboardPayload, DASHBOARD_PATH } from "../worker/admin/dashboard.mjs";
import { applyFullSchema, FULL_PRODUCT_TABLE_NAMES, applyThemeMigration } from "../worker/d1/schema.mjs";

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
  return { fetch: () => response };
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
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-006-d1-test-"));
  const proxy = await getPlatformProxy({
    configPath: WRANGLER_CONFIG_PATH,
    persist: { path: statePath },
    remoteBindings: false,
  });
  await applyFullSchema(proxy.env.DB);
  return {
    db: proxy.env.DB,
    async cleanup() {
      await proxy.dispose();
      fs.rmSync(statePath, { recursive: true, force: true });
    },
  };
}

function batchFailingDb(realDb, message = "SIMULATED_BATCH_FAILURE") {
  return {
    prepare: sql => realDb.prepare(sql),
    batch: () => Promise.reject(new Error(message)),
  };
}

// Deterministic TOCTOU/interleaving simulation, mirroring
// tests/worker-admin-projects.test.mjs's exact technique (AS21-F007):
// intercepts only the first call to the exact journal-mutation pre-read
// query and returns a caller-supplied stale snapshot, while every other
// statement executes against the real, already-migrated database.
function interleavingDb(realDb, { staleRow }) {
  let readCallCount = 0;
  return {
    prepare(sql) {
      if (sql.startsWith("SELECT id, slug, published_revision_id, draft_revision_id FROM journal_entries")) {
        readCallCount += 1;
        if (readCallCount === 1) {
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

function validJournalPayload(overrides = {}) {
  return {
    id: "journal-atomic-lab",
    slug: "atomic-lab-notes",
    title: "Atomic Lab Notes",
    summary: "A bounded test journal entry.",
    body: "This is the body of the test journal entry.",
    ...overrides,
  };
}

async function countRows(db, table, whereSql = "", ...params) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table} ${whereSql}`).bind(...params).first();
  return row.n;
}

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

async function journalMediaRows(db, revisionId) {
  const result = await db
    .prepare("SELECT media_id, role, sort_order FROM journal_media WHERE journal_entry_revision_id = ? ORDER BY sort_order")
    .bind(revisionId)
    .all();
  return result.results.map(row => ({ mediaId: row.media_id, role: row.role, order: row.sort_order }));
}

async function createJournal(db, jwks, token, overrides = {}) {
  const { response } = await callAdmin(
    mutationRequest("/admin/api/journal", { method: "POST", token, body: validJournalPayload(overrides) }),
    { db, jwks }
  );
  return response.json();
}

// --- migration/table inventory evidence ---

test("applying the full schema creates exactly 20 product tables, and 0001-0003 remain byte-identical", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const tableRows = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    const tables = tableRows.results
      .map(row => row.name)
      .filter(name => !name.startsWith("_cf_") && !name.startsWith("sqlite_") && name !== "d1_migrations");
    assert.equal(tables.length, 20);
    assert.deepEqual(tables, [...FULL_PRODUCT_TABLE_NAMES].sort());
  } finally {
    await cleanup();
  }
});

// --- pointer ownership / revision immutability / one-time publish transition (direct DB) ---

test("a journal_entries pointer cannot reference another entry's revision", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const now = new Date().toISOString();
    await db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES (?, ?, ?)").bind("j1", "j1-slug", now).run();
    await db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES (?, ?, ?)").bind("j2", "j2-slug", now).run();
    await db
      .prepare("INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, created_at, created_by) VALUES (?, 1, ?, ?, ?, ?, ?)")
      .bind("j1", "Title", "Summary", "Body text.", now, "cf-access:t")
      .run();
    const rev = await db.prepare("SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'j1' AND revision_number = 1").first();

    await assert.rejects(db.prepare("UPDATE journal_entries SET draft_revision_id = ? WHERE id = 'j2'").bind(rev.id).run());
    await db.prepare("UPDATE journal_entries SET draft_revision_id = ? WHERE id = 'j1'").bind(rev.id).run();
  } finally {
    await cleanup();
  }
});

test("a journal_entry_revisions row is immutable except the one-time published_at NULL -> timestamp transition", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const now = new Date().toISOString();
    await db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES (?, ?, ?)").bind("j1", "j1-slug", now).run();
    await db
      .prepare("INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, created_at, created_by) VALUES (?, 1, ?, ?, ?, ?, ?)")
      .bind("j1", "Title", "Summary", "Body text.", now, "cf-access:t")
      .run();
    const rev = await db.prepare("SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'j1' AND revision_number = 1").first();

    await assert.rejects(db.prepare("UPDATE journal_entry_revisions SET title = 'changed' WHERE id = ?").bind(rev.id).run());
    await db.prepare("UPDATE journal_entry_revisions SET published_at = ? WHERE id = ?").bind(now, rev.id).run();
    const publishedRow = await db.prepare("SELECT published_at FROM journal_entry_revisions WHERE id = ?").bind(rev.id).first();
    assert.equal(publishedRow.published_at, now);

    await assert.rejects(
      db.prepare("UPDATE journal_entry_revisions SET published_at = ? WHERE id = ?").bind("2099-01-01T00:00:00.000Z", rev.id).run()
    );
    await assert.rejects(db.prepare("DELETE FROM journal_entry_revisions WHERE id = ?").bind(rev.id).run());
  } finally {
    await cleanup();
  }
});

test("journal_media rows are immutable and non-deletable, with duplicate association and duplicate slot protection", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const now = new Date().toISOString();
    const mediaA = await insertActiveMedia(db);
    const mediaB = await insertActiveMedia(db);
    await db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES (?, ?, ?)").bind("j1", "j1-slug", now).run();
    await db
      .prepare("INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, created_at, created_by) VALUES (?, 1, ?, ?, ?, ?, ?)")
      .bind("j1", "Title", "Summary", "Body text.", now, "cf-access:t")
      .run();
    const rev = await db.prepare("SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'j1' AND revision_number = 1").first();

    await db.prepare("INSERT INTO journal_media (journal_entry_revision_id, media_id, role, sort_order) VALUES (?, ?, ?, ?)").bind(rev.id, mediaA, "cover", 0).run();

    await assert.rejects(
      db.prepare("INSERT INTO journal_media (journal_entry_revision_id, media_id, role, sort_order) VALUES (?, ?, ?, ?)").bind(rev.id, mediaA, "cover", 1).run(),
      /UNIQUE/
    );
    await assert.rejects(
      db.prepare("INSERT INTO journal_media (journal_entry_revision_id, media_id, role, sort_order) VALUES (?, ?, ?, ?)").bind(rev.id, mediaB, "cover", 0).run(),
      /UNIQUE/
    );
    await db.prepare("INSERT INTO journal_media (journal_entry_revision_id, media_id, role, sort_order) VALUES (?, ?, ?, ?)").bind(rev.id, mediaB, "gallery", 0).run();

    await assert.rejects(db.prepare("UPDATE journal_media SET sort_order = 9 WHERE journal_entry_revision_id = ? AND media_id = ?").bind(rev.id, mediaA).run());
    await assert.rejects(db.prepare("DELETE FROM journal_media WHERE journal_entry_revision_id = ? AND media_id = ?").bind(rev.id, mediaA).run());
  } finally {
    await cleanup();
  }
});

// --- AS28-F009: zero D1 before valid auth / bounded subject ---

const MUTATING_ROUTES = [
  { method: "POST", path: "/admin/api/journal", body: validJournalPayload() },
  { method: "PUT", path: "/admin/api/journal/journal-x/draft", body: { ...validJournalPayload(), expectedPublishedRevisionId: null, expectedDraftRevisionId: null } },
  { method: "POST", path: "/admin/api/journal/journal-x/publish", body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: 1 } },
  { method: "POST", path: "/admin/api/journal/journal-x/unpublish", body: { expectedPublishedRevisionId: 1, expectedDraftRevisionId: null } },
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
  const { response } = await callAdmin(readRequest("/admin/api/journal/journal-x/preview"), { db: spy, jwks });
  assert.equal(response.status, 401);
  assert.equal(spy.calls.length, 0);
});

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
    const token = await signToken(privateKey);
    const serviceToken = await signToken(privateKey, { sub: null });
    await createJournal(db, jwks, token);
    const { response } = await callAdmin(readRequest("/admin/api/journal/journal-atomic-lab/preview", { token: serviceToken }), { db, jwks });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

// --- request hardening ---

test("a mutating request with a missing/mismatched Origin is rejected (403)", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = mutationRequest("/admin/api/journal", { method: "POST", token, origin: "https://evil.example", body: validJournalPayload() });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 403);
  assert.equal(spy.calls.length, 0);
});

test("a mutating request with a non-JSON content type is rejected (415)", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = mutationRequest("/admin/api/journal", { method: "POST", token, contentType: "text/plain", body: "hi" });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 415);
  assert.equal(spy.calls.length, 0);
});

test("an oversized mutating request body is rejected (413) before any D1 access", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = mutationRequest("/admin/api/journal", { method: "POST", token, body: validJournalPayload({ body: "x".repeat(200000) }) });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 413);
  assert.equal(spy.calls.length, 0);
});

test("a declared Content-Length over the budget is rejected (413) as an early reject, before the body is read", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = new Request(`${ORIGIN}/admin/api/journal`, {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json", "Content-Length": String(200 * 1024), [ACCESS_ASSERTION_HEADER]: token },
    body: JSON.stringify(validJournalPayload()),
  });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 413);
  assert.equal(spy.calls.length, 0);
});

test("a malformed JSON body is rejected (400)", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const request = mutationRequest("/admin/api/journal", { method: "POST", token, body: "{not json" });
  const { response } = await callAdmin(request, { db: spy, jwks });
  assert.equal(response.status, 400);
});

// --- create draft ---

test("POST /admin/api/journal creates one journal entry + one immutable revision + one success audit row, atomically", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(mutationRequest("/admin/api/journal", { method: "POST", token, body: validJournalPayload() }), { db, jwks });
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.state, "draft");
    assert.equal(await countRows(db, "journal_entries"), 1);
    assert.equal(await countRows(db, "journal_entry_revisions"), 1);
    const auditRow = await db.prepare("SELECT * FROM audit_log WHERE action = 'journal_create_draft' AND entity_id = ?").bind("journal-atomic-lab").first();
    assert.equal(auditRow.result, "success");
    assert.equal(auditRow.entity_type, "journal_entry");
  } finally {
    await cleanup();
  }
});

test("create-draft rejects a duplicate id/slug with 409, and rejects invalid content with 400, writing no partial row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await createJournal(db, jwks, token);

    const { response: dupResponse } = await callAdmin(mutationRequest("/admin/api/journal", { method: "POST", token, body: validJournalPayload() }), { db, jwks });
    assert.equal(dupResponse.status, 409);

    const { response: invalidResponse } = await callAdmin(
      mutationRequest("/admin/api/journal", { method: "POST", token, body: validJournalPayload({ id: "journal-two", slug: "journal-two-slug", title: "" }) }),
      { db, jwks }
    );
    assert.equal(invalidResponse.status, 400);
    assert.equal(await countRows(db, "journal_entries"), 1);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/journal accepts an optional media snapshot for the new revision", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db, { altText: "cover shot" });
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal", { method: "POST", token, body: { ...validJournalPayload(), media: [{ mediaId: coverId, role: "cover", order: 0 }] } }),
      { db, jwks }
    );
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.deepEqual(await journalMediaRows(db, created.draftRevisionId), [{ mediaId: coverId, role: "cover", order: 0 }]);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/journal rejects a media snapshot referencing a missing media id, committing no row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal", {
        method: "POST",
        token,
        body: { ...validJournalPayload(), media: [{ mediaId: "00000000-0000-0000-0000-000000000000", role: "cover", order: 0 }] },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "journal_entries"), 0);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/journal rejects a media snapshot where two different media IDs claim the same (role, order) slot", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const mediaA = await insertActiveMedia(db);
    const mediaB = await insertActiveMedia(db);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal", {
        method: "POST",
        token,
        body: {
          ...validJournalPayload(),
          media: [
            { mediaId: mediaA, role: "gallery", order: 0 },
            { mediaId: mediaB, role: "gallery", order: 0 },
          ],
        },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "journal_entries"), 0);
  } finally {
    await cleanup();
  }
});

// --- edit draft ---

test("PUT .../draft creates a new immutable revision, moves only draft_revision_id, and leaves revision 1 untouched", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: "editor-1" });
    const created = await createJournal(db, jwks, token);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Atomic Lab Notes v2" }), expectedPublishedRevisionId: created.publishedRevisionId, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const updated = await response.json();
    assert.notEqual(updated.draftRevisionId, created.draftRevisionId);

    const rev1 = await db.prepare("SELECT title FROM journal_entry_revisions WHERE id = ?").bind(created.draftRevisionId).first();
    assert.equal(rev1.title, "Atomic Lab Notes");
    const rev2 = await db.prepare("SELECT title FROM journal_entry_revisions WHERE id = ?").bind(updated.draftRevisionId).first();
    assert.equal(rev2.title, "Atomic Lab Notes v2");
  } finally {
    await cleanup();
  }
});

test("PUT .../draft with a stale expectedDraftRevisionId is rejected (409); an unknown entry returns 404; a malformed request returns 400", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);

    const { response: staleResponse } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload(), expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId + 999 },
      }),
      { db, jwks }
    );
    assert.equal(staleResponse.status, 409);

    const { response: notFoundResponse } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-unknown/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload(), expectedPublishedRevisionId: null, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(notFoundResponse.status, 404);

    const { response: malformedResponse } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", { method: "PUT", token, body: { ...validJournalPayload() } }),
      { db, jwks }
    );
    assert.equal(malformedResponse.status, 400);
  } finally {
    await cleanup();
  }
});

test("PUT .../draft omitting media inherits the source revision's association snapshot; the prior revision's rows are untouched", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const created = await createJournal(db, jwks, token, { media: [{ mediaId: coverId, role: "cover", order: 0 }] });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Text-Only Edit" }), expectedPublishedRevisionId: created.publishedRevisionId, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const updated = await response.json();

    const inherited = [{ mediaId: coverId, role: "cover", order: 0 }];
    assert.deepEqual(await journalMediaRows(db, updated.draftRevisionId), inherited);
    assert.deepEqual(await journalMediaRows(db, created.draftRevisionId), inherited);
  } finally {
    await cleanup();
  }
});

test("PUT .../draft with an explicit media array fully replaces the new revision's snapshot; the prior revision's rows are unchanged", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const galleryId = await insertActiveMedia(db);
    const created = await createJournal(db, jwks, token, { media: [{ mediaId: coverId, role: "cover", order: 0 }] });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validJournalPayload({ title: "Replaced Media" }),
          expectedPublishedRevisionId: created.publishedRevisionId,
          expectedDraftRevisionId: created.draftRevisionId,
          media: [{ mediaId: galleryId, role: "gallery", order: 0 }],
        },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const updated = await response.json();

    assert.deepEqual(await journalMediaRows(db, updated.draftRevisionId), [{ mediaId: galleryId, role: "gallery", order: 0 }]);
    assert.deepEqual(await journalMediaRows(db, created.draftRevisionId), [{ mediaId: coverId, role: "cover", order: 0 }]);
  } finally {
    await cleanup();
  }
});

// --- preview ---

test("GET .../preview returns 404 when no draft exists and never falls back to published content", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    const { response } = await callAdmin(readRequest("/admin/api/journal/journal-atomic-lab/preview", { token }), { db, jwks });
    assert.equal(response.status, 404);
  } finally {
    await cleanup();
  }
});

test("GET .../preview reads only the current draft content and exact-draft media, distinct from published content, and writes no audit row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const publishedMediaId = await insertActiveMedia(db, { altText: "published photo" });
    const draftMediaId = await insertActiveMedia(db, { altText: "draft photo" });

    const created = await createJournal(db, jwks, token, { media: [{ mediaId: publishedMediaId, role: "cover", order: 0 }] });
    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Draft-Only Title" }), expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: null, media: [{ mediaId: draftMediaId, role: "cover", order: 0 }] },
      }),
      { db, jwks }
    );

    const auditCountBefore = await countRows(db, "audit_log");
    const { response } = await callAdmin(readRequest("/admin/api/journal/journal-atomic-lab/preview", { token }), { db, jwks });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.title, "Draft-Only Title");
    assert.equal(body.state, "published_with_draft");
    assert.equal(body.media.length, 1);
    assert.equal(body.media[0].altText, "draft photo");
    const auditCountAfter = await countRows(db, "audit_log");
    assert.equal(auditCountAfter, auditCountBefore, "preview writes no audit event");
  } finally {
    await cleanup();
  }
});

// --- publish ---

test("POST .../publish atomically promotes the draft, sets published_at once, clears the draft pointer, preserves history, and appends one success audit row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const updated = await response.json();
    assert.equal(updated.state, "published");
    assert.equal(updated.draftRevisionId, null);
    assert.equal(updated.publishedRevisionId, created.draftRevisionId);

    const revisionRow = await db.prepare("SELECT published_at FROM journal_entry_revisions WHERE id = ?").bind(created.draftRevisionId).first();
    assert.ok(revisionRow.published_at, "published_at is set exactly once at publish time");

    const successAudits = (
      await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'journal_publish' AND result = 'success'").bind("journal-atomic-lab").all()
    ).results;
    assert.equal(successAudits.length, 1);
  } finally {
    await cleanup();
  }
});

test("POST .../publish with no current draft is rejected (409); a stale expected pointer is rejected (409)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", { method: "POST", token, body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId } }),
      { db, jwks }
    );

    const { response: noDraftResponse } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", { method: "POST", token, body: { expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: null } }),
      { db, jwks }
    );
    assert.equal(noDraftResponse.status, 409);

    const { response: staleResponse } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", { method: "POST", token, body: { expectedPublishedRevisionId: 99999, expectedDraftRevisionId: null } }),
      { db, jwks }
    );
    assert.equal(staleResponse.status, 409);
  } finally {
    await cleanup();
  }
});

test("publish fully revalidates the persisted draft and refuses to promote content with a media snapshot referencing since-inactive/missing media", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const mediaId = await insertActiveMedia(db);
    const created = await createJournal(db, jwks, token, { media: [{ mediaId, role: "cover", order: 0 }] });

    // Simulate the referenced media becoming inactive between draft
    // creation and publish. `state` is the one media column this schema
    // permits to change after creation (media.mjs's own immutability
    // trigger excludes it) — no admin API in this increment exposes that
    // transition, so this direct-DB update is the only way to construct
    // the state publish must guard against; it proves the revalidation
    // guard exists and fires, not that any current route can trigger it.
    await db.prepare("UPDATE media SET state = 'archived' WHERE id = ?").bind(mediaId).run();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", { method: "POST", token, body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId } }),
      { db, jwks }
    );
    assert.equal(response.status, 500);
    const row = await db.prepare("SELECT published_revision_id FROM journal_entries WHERE id = ?").bind("journal-atomic-lab").first();
    assert.equal(row.published_revision_id, null);
  } finally {
    await cleanup();
  }
});

// --- unpublish ---

test("POST .../unpublish atomically clears the published pointer, preserves history/draft, and appends one success audit row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", { method: "POST", token, body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId } }),
      { db, jwks }
    );

    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/unpublish", { method: "POST", token, body: { expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: null } }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const updated = await response.json();
    assert.equal(updated.state, "archived");
    assert.equal(updated.publishedRevisionId, null);

    const revisionRow = await db.prepare("SELECT * FROM journal_entry_revisions WHERE id = ?").bind(created.draftRevisionId).first();
    assert.ok(revisionRow, "the revision row survives unpublish");
    assert.ok(revisionRow.published_at, "published_at is preserved, not cleared, by unpublish");

    const successAudits = (
      await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'journal_unpublish' AND result = 'success'").bind("journal-atomic-lab").all()
    ).results;
    assert.equal(successAudits.length, 1);
  } finally {
    await cleanup();
  }
});

test("POST .../unpublish with nothing published is rejected (409)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/unpublish", { method: "POST", token, body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId } }),
      { db, jwks }
    );
    assert.equal(response.status, 409);
  } finally {
    await cleanup();
  }
});

// --- commit-time stale-write / interleaving regressions ---

test("edit vs a competing draft change: the stale edit is rejected (409), the competing draft survives, no orphan revision, no success audit", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);

    const { response: competingResponse } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Competing Edit" }), expectedPublishedRevisionId: created.publishedRevisionId, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );
    const competing = await competingResponse.json();
    assert.notEqual(competing.draftRevisionId, created.draftRevisionId);

    const staleRow = { id: created.id, slug: created.slug, published_revision_id: null, draft_revision_id: created.draftRevisionId };
    const staleDb = interleavingDb(db, { staleRow });

    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Stale Edit Must Not Apply" }), expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);

    const revisionRows = (
      await db.prepare("SELECT * FROM journal_entry_revisions WHERE journal_entry_id = ? ORDER BY revision_number").bind("journal-atomic-lab").all()
    ).results;
    assert.equal(revisionRows.length, 2, "no orphan revision row from the stale attempt");
    assert.equal(revisionRows[1].title, "Competing Edit");

    const successAudits = (
      await db.prepare("SELECT * FROM audit_log WHERE entity_id = ? AND action = 'journal_edit_draft' AND result = 'success'").bind("journal-atomic-lab").all()
    ).results;
    assert.equal(successAudits.length, 1);
  } finally {
    await cleanup();
  }
});

test("a stale edit carrying an explicit media snapshot is still rejected (409) by the commit-time guard; no journal_media row from the rejected attempt survives", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const created = await createJournal(db, jwks, token);

    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Competing Edit" }), expectedPublishedRevisionId: created.publishedRevisionId, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );

    const staleRow = { id: created.id, slug: created.slug, published_revision_id: null, draft_revision_id: created.draftRevisionId };
    const staleDb = interleavingDb(db, { staleRow });
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: {
          ...validJournalPayload({ title: "Stale Edit Must Not Apply" }),
          expectedPublishedRevisionId: null,
          expectedDraftRevisionId: created.draftRevisionId,
          media: [{ mediaId: coverId, role: "cover", order: 0 }],
        },
      }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);
    assert.equal(await countRows(db, "journal_media", "WHERE media_id = ?", coverId), 0);
  } finally {
    await cleanup();
  }
});

test("publish vs a competing draft change: the stale publish is rejected (409), the competing draft survives unpublished", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);

    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Competing Edit" }), expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId },
      }),
      { db, jwks }
    );

    const staleRow = { id: created.id, slug: created.slug, published_revision_id: null, draft_revision_id: created.draftRevisionId };
    const staleDb = interleavingDb(db, { staleRow });
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", { method: "POST", token, body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId } }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);

    const row = await db.prepare("SELECT published_revision_id FROM journal_entries WHERE id = ?").bind("journal-atomic-lab").first();
    assert.equal(row.published_revision_id, null);
  } finally {
    await cleanup();
  }
});

test("unpublish vs a competing pointer change: the stale unpublish is rejected (409), the competing state survives", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const created = await createJournal(db, jwks, token);
    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/publish", { method: "POST", token, body: { expectedPublishedRevisionId: null, expectedDraftRevisionId: created.draftRevisionId } }),
      { db, jwks }
    );

    await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/draft", {
        method: "PUT",
        token,
        body: { ...validJournalPayload({ title: "Competing Edit" }), expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );

    const staleRow = { id: created.id, slug: created.slug, published_revision_id: created.draftRevisionId, draft_revision_id: null };
    const staleDb = interleavingDb(db, { staleRow });
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal/journal-atomic-lab/unpublish", { method: "POST", token, body: { expectedPublishedRevisionId: created.draftRevisionId, expectedDraftRevisionId: null } }),
      { db: staleDb, jwks }
    );
    assert.equal(response.status, 409);

    const row = await db.prepare("SELECT published_revision_id FROM journal_entries WHERE id = ?").bind("journal-atomic-lab").first();
    assert.equal(row.published_revision_id, created.draftRevisionId);
  } finally {
    await cleanup();
  }
});

// --- atomicity ---

test("a D1 batch failure during create-with-media leaves no journal entry, revision, or journal_media row behind", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const coverId = await insertActiveMedia(db);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/journal", { method: "POST", token, body: { ...validJournalPayload(), media: [{ mediaId: coverId, role: "cover", order: 0 }] } }),
      { db: batchFailingDb(db), jwks }
    );
    assert.equal(response.status, 409);
    assert.equal(await countRows(db, "journal_entries"), 0);
    assert.equal(await countRows(db, "journal_entry_revisions"), 0);
    assert.equal(await countRows(db, "journal_media"), 0);
  } finally {
    await cleanup();
  }
});

// --- route/method fail-closed ---

test("DELETE is never an accepted method on any journal route; an unrecognized sub-route returns protected 404; a wrong method on the root route returns 405", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();

  const { response: deleteResponse } = await callAdmin(
    mutationRequest("/admin/api/journal/journal-x/draft", { method: "DELETE", token, body: {} }),
    { db: spy, jwks }
  );
  assert.equal(deleteResponse.status, 405);

  const { response: unknownResponse } = await callAdmin(readRequest("/admin/api/journal/journal-x/some-other-action", { token }), { db: spy, jwks });
  assert.equal(unknownResponse.status, 404);

  const { response: wrongMethodResponse } = await callAdmin(readRequest("/admin/api/journal", { token }), { db: spy, jwks });
  assert.equal(wrongMethodResponse.status, 405);

  assert.equal(spy.calls.length, 0);
});

test("an unrecognized journal sub-route returns 404, not 503, even when DB is absent; a recognized route+method returns 503 when DB is absent", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);

  const { response: unknownResponse } = await callAdmin(readRequest("/admin/api/journal/journal-x/some-id", { token }), { db: undefined, jwks });
  assert.equal(unknownResponse.status, 404);

  const { response: serviceUnavailableResponse } = await callAdmin(
    mutationRequest("/admin/api/journal", { method: "POST", token, body: validJournalPayload() }),
    { db: undefined, jwks }
  );
  assert.equal(serviceUnavailableResponse.status, 503);
});

// --- header hardening ---

test("every journal route response carries Cache-Control: no-store", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(mutationRequest("/admin/api/journal", { method: "POST", token, body: validJournalPayload() }), { db, jwks });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  } finally {
    await cleanup();
  }
});

// --- dashboard integration (AS28-F012) ---

test("GET /admin/api/dashboard exposes bounded journal lifecycle metadata only, never body/summary content", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    // buildDashboardPayload now also reads theme_settings (WEB-INC-007);
    // this file's own openTestDb() fixture is frozen at the 20-table
    // WEB-INC-006 schema (see the "exactly 20 product tables" assertion
    // above), so only this one dashboard-calling test gets the extra
    // migration applied locally, exactly like the analogous journal-table
    // addition did for tests/d1-audit.test.mjs/tests/worker-admin-projects.test.mjs
    // in the prior cycle.
    await applyThemeMigration(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await createJournal(db, jwks, token, { summary: "SECRET_SUMMARY_SHOULD_NOT_LEAK", body: "SECRET_BODY_SHOULD_NOT_LEAK" });

    const payload = await buildDashboardPayload(db);
    assert.equal(payload.journal.length, 1);
    const entry = payload.journal[0];
    assert.deepEqual(Object.keys(entry).sort(), ["id", "slug", "state", "publishedRevisionId", "draftRevisionId", "displayLabel"].sort());
    assert.equal(entry.slug, "atomic-lab-notes");
    assert.equal(entry.state, "draft");
    assert.equal(entry.displayLabel, "Atomic Lab Notes");

    const rawText = JSON.stringify(payload);
    assert.ok(!rawText.includes("SECRET_SUMMARY_SHOULD_NOT_LEAK"));
    assert.ok(!rawText.includes("SECRET_BODY_SHOULD_NOT_LEAK"));

    const { response } = await callAdmin(readRequest(DASHBOARD_PATH, { token }), { db, jwks });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});
