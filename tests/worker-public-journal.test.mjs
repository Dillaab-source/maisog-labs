// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// bounded public journal read API tests. Every D1 database used here is a
// local Wrangler/Miniflare simulation (`getPlatformProxy({ remoteBindings:
// false })`) persisted to a throwaway temp directory per test — no test in
// this file can reach a real Cloudflare resource.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { handleRequest, ACCESS_ASSERTION_HEADER, isPublicJournalApiPath } from "../worker/auth.mjs";
import { handleAdminDispatch } from "../worker/admin/dashboard.mjs";
import { handlePublicJournalDispatch } from "../worker/public/journal.mjs";
import { applyFullSchema } from "../worker/d1/schema.mjs";

const WRANGLER_CONFIG_PATH = path.join(import.meta.dirname, "..", "wrangler.jsonc");
const ORIGIN = "https://maisoglabs.example";
const TEAM_DOMAIN = "test-team.cloudflareaccess.com";
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

async function signToken(privateKey) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: "admin@example.com", sub: "test-admin-subject" })
    .setProtectedHeader({ alg: ALG, kid: KID })
    .setIssuedAt(now)
    .setIssuer(`https://${TEAM_DOMAIN}`)
    .setAudience(AUDIENCE)
    .setExpirationTime(now + 3600)
    .sign(privateKey);
}

function fakeAssets(response = new Response("public shell", { status: 200 })) {
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
    batch: async statements => statements.map(() => ({})),
  };
}

async function openTestDb() {
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-006-public-d1-test-"));
  const proxy = await getPlatformProxy({ configPath: WRANGLER_CONFIG_PATH, persist: { path: statePath }, remoteBindings: false });
  await applyFullSchema(proxy.env.DB);
  return {
    db: proxy.env.DB,
    async cleanup() {
      await proxy.dispose();
      fs.rmSync(statePath, { recursive: true, force: true });
    },
  };
}

async function callWorker(request, { db, jwks } = {}) {
  return handleRequest(request, {
    assets: fakeAssets(),
    teamDomain: TEAM_DOMAIN,
    audience: AUDIENCE,
    getJWKS: () => jwks,
    dispatch: ({ request, url, assets, sub }) => handleAdminDispatch({ request, url, assets, db, sub }),
    publicDispatch: ({ request, url }) => handlePublicJournalDispatch({ request, url, db }),
  });
}

// Seeds one published entry, one draft-only entry (must never be visible),
// and one archived (unpublished, has a historical revision) entry, plus a
// media row attached to the published revision.
async function seedJournalFixture(db) {
  const t0 = "2026-01-01T00:00:00.000Z";
  const t1 = "2026-01-02T00:00:00.000Z";
  const t2 = "2026-01-03T00:00:00.000Z";

  await db.prepare("INSERT INTO media (id, storage_key, content_type, size_bytes, alt_text, uploaded_at, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind("11111111-1111-1111-1111-111111111111", "media/cover.jpg", "image/jpeg", 1000, "cover alt text", t0, "cf-access:seed")
    .run();

  const statements = [
    // published entry
    db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES ('journal-published', 'published-entry', ?)").bind(t0),
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, published_at, created_at, created_by) VALUES ('journal-published', 1, 'Published Entry', 'Published summary.', 'Published body text.', ?, ?, ?)"
      )
      .bind(t1, t0, "cf-access:seed"),
    db.prepare(
      "UPDATE journal_entries SET published_revision_id = (SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'journal-published' AND revision_number = 1) WHERE id = 'journal-published'"
    ),
    db
      .prepare("INSERT INTO journal_media (journal_entry_revision_id, media_id, role, sort_order) VALUES ((SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'journal-published' AND revision_number = 1), ?, 'cover', 0)")
      .bind("11111111-1111-1111-1111-111111111111"),

    // a second, more-recently-published entry (for newest-first ordering)
    db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES ('journal-newer', 'newer-entry', ?)").bind(t0),
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, published_at, created_at, created_by) VALUES ('journal-newer', 1, 'Newer Entry', 'Newer summary.', 'Newer body text.', ?, ?, ?)"
      )
      .bind(t2, t0, "cf-access:seed"),
    db.prepare(
      "UPDATE journal_entries SET published_revision_id = (SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'journal-newer' AND revision_number = 1) WHERE id = 'journal-newer'"
    ),

    // draft-only entry: must never appear publicly
    db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES ('journal-draft-only', 'draft-only-entry', ?)").bind(t0),
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, created_at, created_by) VALUES ('journal-draft-only', 1, 'Draft Only Entry', 'SECRET_DRAFT_SUMMARY_SHOULD_NOT_LEAK', 'SECRET_DRAFT_BODY_SHOULD_NOT_LEAK', ?, ?)"
      )
      .bind(t0, "cf-access:seed"),
    db.prepare(
      "UPDATE journal_entries SET draft_revision_id = (SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'journal-draft-only' AND revision_number = 1) WHERE id = 'journal-draft-only'"
    ),

    // published-then-unpublished entry (archived): must never appear publicly
    db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES ('journal-archived', 'archived-entry', ?)").bind(t0),
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, published_at, created_at, created_by) VALUES ('journal-archived', 1, 'Archived Entry', 'SECRET_ARCHIVED_SUMMARY_SHOULD_NOT_LEAK', 'SECRET_ARCHIVED_BODY_SHOULD_NOT_LEAK', ?, ?, ?)"
      )
      .bind(t0, t0, "cf-access:seed"),
    // published_revision_id intentionally left NULL — this row is a
    // historical (previously-published, since-unpublished) revision.

    // published entry with a superseded draft: public detail must resolve
    // exactly the published pointer, never the newer draft.
    db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES ('journal-with-draft', 'with-draft-entry', ?)").bind(t0),
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, published_at, created_at, created_by) VALUES ('journal-with-draft', 1, 'Published Half', 'Published half summary.', 'Published half body.', ?, ?, ?)"
      )
      .bind(t0, t0, "cf-access:seed"),
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, created_at, created_by) VALUES ('journal-with-draft', 2, 'Draft Half SECRET_SHOULD_NOT_LEAK', 'Draft half summary SECRET_SHOULD_NOT_LEAK.', 'Draft half body SECRET_SHOULD_NOT_LEAK.', ?, ?)"
      )
      .bind(t0, "cf-access:seed"),
    db.prepare(
      "UPDATE journal_entries SET " +
        "published_revision_id = (SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'journal-with-draft' AND revision_number = 1), " +
        "draft_revision_id = (SELECT id FROM journal_entry_revisions WHERE journal_entry_id = 'journal-with-draft' AND revision_number = 2) " +
        "WHERE id = 'journal-with-draft'"
    ),
  ];

  await db.batch(statements);
}

function publicRequest(pathname, { method = "GET" } = {}) {
  return new Request(`${ORIGIN}${pathname}`, { method });
}

// --- routing classification (AS28-F003/F010) ---

test("isPublicJournalApiPath matches exactly /api/journal and /api/journal/*, nothing else", () => {
  assert.equal(isPublicJournalApiPath("/api/journal"), true);
  assert.equal(isPublicJournalApiPath("/api/journal/"), true);
  assert.equal(isPublicJournalApiPath("/api/journal/some-slug"), true);
  assert.equal(isPublicJournalApiPath("/api/journalabc"), false);
  assert.equal(isPublicJournalApiPath("/api/journals"), false);
  assert.equal(isPublicJournalApiPath("/admin/api/journal"), false);
  assert.equal(isPublicJournalApiPath("/"), false);
});

test("GET /api/journal requires no Cloudflare Access assertion at all — it is classified and served before any auth check", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await callWorker(publicRequest("/api/journal"), { db, jwks: undefined });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

test("public journal routes are dispatched even when getJWKS would throw — proving the admin auth path is never reached", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await handleRequest(publicRequest("/api/journal"), {
      assets: fakeAssets(),
      teamDomain: TEAM_DOMAIN,
      audience: AUDIENCE,
      getJWKS: () => {
        throw new Error("getJWKS must never be called for public journal routes");
      },
      dispatch: () => {
        throw new Error("admin dispatch must never be called for public journal routes");
      },
      publicDispatch: ({ request, url }) => handlePublicJournalDispatch({ request, url, db }),
    });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

test("admin /admin/api/* routes still require Cloudflare Access even though public journal routing exists", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await callWorker(new Request(`${ORIGIN}/admin/api/dashboard`, { method: "GET" }), { db, jwks: undefined });
    assert.equal(response.status, 401);
  } finally {
    await cleanup();
  }
});

test("a valid Access token grants no special treatment on the public journal path — same response either way", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const withToken = new Request(`${ORIGIN}/api/journal`, { method: "GET", headers: { [ACCESS_ASSERTION_HEADER]: token } });
    const response = await callWorker(withToken, { db, jwks });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

// --- index: published-only, newest-first ---

test("GET /api/journal returns only published entries, newest-published-first, and never draft-only or archived entries", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedJournalFixture(db);
    const response = await callWorker(publicRequest("/api/journal"), { db, jwks: undefined });
    assert.equal(response.status, 200);
    const body = await response.json();

    const slugs = body.entries.map(entry => entry.slug);
    assert.deepEqual(slugs, ["newer-entry", "published-entry", "with-draft-entry"]);
    assert.ok(!slugs.includes("draft-only-entry"));
    assert.ok(!slugs.includes("archived-entry"));

    const rawText = JSON.stringify(body);
    assert.ok(!rawText.includes("SECRET_DRAFT_SUMMARY_SHOULD_NOT_LEAK"));
    assert.ok(!rawText.includes("SECRET_ARCHIVED_SUMMARY_SHOULD_NOT_LEAK"));
    assert.ok(!rawText.includes("SECRET_SHOULD_NOT_LEAK"));
  } finally {
    await cleanup();
  }
});

test("GET /api/journal index entries use a positive allowlist, including bounded media metadata, and never expose storage key/uploaded_by/draft ids", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedJournalFixture(db);
    const response = await callWorker(publicRequest("/api/journal"), { db, jwks: undefined });
    const body = await response.json();
    const published = body.entries.find(entry => entry.slug === "published-entry");
    assert.deepEqual(Object.keys(published).sort(), ["slug", "title", "summary", "publishedAt", "media"].sort());
    assert.equal(published.media.length, 1);
    assert.deepEqual(Object.keys(published.media[0]).sort(), ["id", "contentType", "altText", "role", "order"].sort());
    assert.equal(published.media[0].altText, "cover alt text");

    const rawText = JSON.stringify(body);
    assert.ok(!rawText.includes("storage_key"));
    assert.ok(!rawText.includes("media/cover.jpg"));
    assert.ok(!rawText.includes("uploaded_by"));
    assert.ok(!rawText.includes("cf-access"));
    assert.ok(!rawText.toLowerCase().includes("draftrevisionid"));
  } finally {
    await cleanup();
  }
});

test("GET /api/journal returns an empty list, not an error, when no entry is published", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await callWorker(publicRequest("/api/journal"), { db, jwks: undefined });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.entries, []);
  } finally {
    await cleanup();
  }
});

// --- detail: exact published pointer only ---

test("GET /api/journal/:slug resolves exactly the published revision, including its media, for a published entry", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedJournalFixture(db);
    const response = await callWorker(publicRequest("/api/journal/published-entry"), { db, jwks: undefined });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.title, "Published Entry");
    assert.equal(body.body, "Published body text.");
    assert.equal(body.media.length, 1);
    assert.equal(body.media[0].role, "cover");
  } finally {
    await cleanup();
  }
});

test("GET /api/journal/:slug resolves exactly published_revision_id, never draft_revision_id, when both exist", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedJournalFixture(db);
    const response = await callWorker(publicRequest("/api/journal/with-draft-entry"), { db, jwks: undefined });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.title, "Published Half");
    assert.ok(!JSON.stringify(body).includes("SECRET_SHOULD_NOT_LEAK"));
  } finally {
    await cleanup();
  }
});

test("GET /api/journal/:slug returns 404 for a draft-only entry, an archived (unpublished) entry, and an unknown slug", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedJournalFixture(db);
    for (const slug of ["draft-only-entry", "archived-entry", "does-not-exist"]) {
      const response = await callWorker(publicRequest(`/api/journal/${slug}`), { db, jwks: undefined });
      assert.equal(response.status, 404, `expected 404 for slug '${slug}'`);
    }
  } finally {
    await cleanup();
  }
});

test("GET /api/journal/:slug detail uses a positive allowlist and never exposes storage key/uploaded_by/draft ids/audit internals", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedJournalFixture(db);
    const response = await callWorker(publicRequest("/api/journal/published-entry"), { db, jwks: undefined });
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["slug", "title", "summary", "body", "publishedAt", "media"].sort());
    const rawText = JSON.stringify(body);
    assert.ok(!rawText.includes("storage_key"));
    assert.ok(!rawText.includes("uploaded_by"));
    assert.ok(!rawText.toLowerCase().includes("audit"));
    assert.ok(!rawText.toLowerCase().includes("draftrevisionid"));
  } finally {
    await cleanup();
  }
});

// --- fail-closed: wrong method / unknown route / missing DB ---

test("POST/PUT/DELETE on /api/journal are rejected (405) with zero D1 access", async () => {
  const { jwks } = await buildTestIdentity();
  for (const method of ["POST", "PUT", "DELETE"]) {
    const spy = dbSpy();
    const response = await callWorker(publicRequest("/api/journal", { method }), { db: spy, jwks });
    assert.equal(response.status, 405);
    assert.equal(spy.calls.length, 0);
  }
});

test("POST on /api/journal/:slug is rejected (405) with zero D1 access", async () => {
  const spy = dbSpy();
  const response = await callWorker(publicRequest("/api/journal/some-slug", { method: "POST" }), { db: spy, jwks: undefined });
  assert.equal(response.status, 405);
  assert.equal(spy.calls.length, 0);
});

test("an unrecognized /api/journal/x/y sub-path returns 404 with zero D1 access", async () => {
  const spy = dbSpy();
  const response = await callWorker(publicRequest("/api/journal/some-slug/extra"), { db: spy, jwks: undefined });
  assert.equal(response.status, 404);
  assert.equal(spy.calls.length, 0);
});

test("missing DB binding returns 503 for both public journal routes, not a crash", async () => {
  const indexResponse = await callWorker(publicRequest("/api/journal"), { db: undefined, jwks: undefined });
  assert.equal(indexResponse.status, 503);
  const detailResponse = await callWorker(publicRequest("/api/journal/some-slug"), { db: undefined, jwks: undefined });
  assert.equal(detailResponse.status, 503);
});
