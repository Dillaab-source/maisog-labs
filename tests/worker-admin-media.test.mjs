// WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029) local media
// subsystem tests. Every D1 database and R2 bucket used here is a local
// Wrangler/Miniflare simulation (`getPlatformProxy({ remoteBindings:
// false })`) persisted to a throwaway temp directory per test — no test in
// this file can reach a real Cloudflare resource (AS23-F018).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { handleRequest, ACCESS_ASSERTION_HEADER } from "../worker/auth.mjs";
import { handleAdminDispatch } from "../worker/admin/dashboard.mjs";
import { applyAllMigrations } from "../worker/d1/schema.mjs";
import { detectImageContentType } from "../worker/media/signature.mjs";

const WRANGLER_CONFIG_PATH = path.join(import.meta.dirname, "..", "wrangler.jsonc");
const ORIGIN = "https://maisoglabs.example";

const TEAM_DOMAIN = "test-team.cloudflareaccess.com";
const ISSUER = `https://${TEAM_DOMAIN}`;
const AUDIENCE = "test-audience-aud-tag";
const ALG = "ES256";
const KID = "test-key-1";

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 1, 2, 3, 4, 5, 6, 7, 8]);
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);
function webpBytes() {
  const bytes = new Uint8Array(20);
  const riff = "RIFF";
  const webp = "WEBP";
  for (let i = 0; i < 4; i += 1) bytes[i] = riff.charCodeAt(i);
  bytes[4] = 0;
  bytes[5] = 0;
  bytes[6] = 0;
  bytes[7] = 0;
  for (let i = 0; i < 4; i += 1) bytes[8 + i] = webp.charCodeAt(i);
  return bytes;
}
const SVG_BYTES = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");

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

async function openTestEnv() {
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-004-media-test-"));
  const proxy = await getPlatformProxy({
    configPath: WRANGLER_CONFIG_PATH,
    persist: { path: statePath },
    remoteBindings: false,
  });
  await applyAllMigrations(proxy.env.DB);
  return {
    db: proxy.env.DB,
    media: proxy.env.MEDIA,
    async cleanup() {
      await proxy.dispose();
      fs.rmSync(statePath, { recursive: true, force: true });
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

function mediaSpy() {
  const calls = [];
  return {
    calls,
    put: async (key, bytes) => {
      calls.push(`PUT(${key},${bytes.byteLength})`);
      return {};
    },
    get: async key => {
      calls.push(`GET(${key})`);
      return null;
    },
    delete: async key => {
      calls.push(`DELETE(${key})`);
    },
  };
}

// Wraps a real, already-migrated db so `batch()` always rejects while every
// other call (prepare/first/all/run — used by the upload route's own
// pre-checks and by the compensating failure-audit append) still runs
// against the real database. Mirrors tests/worker-admin-projects.test.mjs's
// batchFailingDb, duplicated here rather than imported so this file stays
// fully decoupled from that one (mirrors the same design choice made for
// worker/admin/media.mjs's own bounded-body reader).
function batchFailingDb(realDb, message = "SIMULATED_BATCH_FAILURE") {
  return {
    prepare: sql => realDb.prepare(sql),
    batch: () => Promise.reject(new Error(message)),
  };
}

function throwingMedia(overrides = {}) {
  return {
    put: overrides.put ?? (() => Promise.reject(new Error("SIMULATED_R2_PUT_FAILURE"))),
    get: overrides.get ?? (async () => null),
    delete: overrides.delete ?? (() => Promise.reject(new Error("SIMULATED_R2_DELETE_FAILURE"))),
  };
}

function uploadRequest({ token, origin = ORIGIN, contentType, altText, body, contentLength } = {}) {
  const headers = { Origin: origin };
  if (contentType !== undefined) headers["Content-Type"] = contentType;
  if (altText !== undefined) headers["X-Media-Alt-Text"] = encodeURIComponent(altText);
  if (token) headers[ACCESS_ASSERTION_HEADER] = token;
  if (contentLength !== undefined) headers["Content-Length"] = String(contentLength);
  return new Request(`${ORIGIN}/admin/api/media`, { method: "POST", headers, body });
}

function listRequest({ token } = {}) {
  const headers = {};
  if (token) headers[ACCESS_ASSERTION_HEADER] = token;
  return new Request(`${ORIGIN}/admin/api/media`, { method: "GET", headers });
}

async function callAdmin(request, { db, media, jwks }) {
  return handleRequest(request, {
    assets: fakeAssets(),
    teamDomain: TEAM_DOMAIN,
    audience: AUDIENCE,
    getJWKS: () => jwks,
    dispatch: ({ request, url, assets, sub }) => handleAdminDispatch({ request, url, assets, db, media, sub }),
  });
}

async function countRows(db, table) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
  return row.n;
}

// --- AS23-F006: auth/origin/subject boundary, zero D1/R2 before them ---

test("unauthenticated POST /admin/api/media is rejected with zero D1/R2 invocation", async () => {
  const { jwks } = await buildTestIdentity();
  const dbSpyInstance = dbSpy();
  const mediaSpyInstance = mediaSpy();
  const response = await callAdmin(uploadRequest({ contentType: "image/jpeg", altText: "alt", body: JPEG_BYTES }), {
    db: dbSpyInstance,
    media: mediaSpyInstance,
    jwks,
  });
  assert.equal(response.status, 401);
  assert.equal(dbSpyInstance.calls.length, 0);
  assert.equal(mediaSpyInstance.calls.length, 0);
});

test("unauthenticated GET /admin/api/media is rejected with zero D1 invocation", async () => {
  const { jwks } = await buildTestIdentity();
  const dbSpyInstance = dbSpy();
  const response = await callAdmin(listRequest(), { db: dbSpyInstance, media: mediaSpy(), jwks });
  assert.equal(response.status, 401);
  assert.equal(dbSpyInstance.calls.length, 0);
});

test("a valid Access token with no usable subject is rejected (403) from uploading, zero D1/R2 invocation", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const serviceToken = await signToken(privateKey, { sub: null });
  const dbSpyInstance = dbSpy();
  const mediaSpyInstance = mediaSpy();
  const response = await callAdmin(
    uploadRequest({ token: serviceToken, contentType: "image/jpeg", altText: "alt", body: JPEG_BYTES }),
    { db: dbSpyInstance, media: mediaSpyInstance, jwks }
  );
  assert.equal(response.status, 403);
  assert.equal(dbSpyInstance.calls.length, 0);
  assert.equal(mediaSpyInstance.calls.length, 0);
});

test("a valid Access token with no usable subject can still list media", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const serviceToken = await signToken(privateKey, { sub: null });
    const response = await callAdmin(listRequest({ token: serviceToken }), { db, media, jwks });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

test("a cross-origin POST /admin/api/media is rejected (403) before any D1/R2 access", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const dbSpyInstance = dbSpy();
  const mediaSpyInstance = mediaSpy();
  const response = await callAdmin(
    uploadRequest({ token, origin: "https://evil.example", contentType: "image/jpeg", altText: "alt", body: JPEG_BYTES }),
    { db: dbSpyInstance, media: mediaSpyInstance, jwks }
  );
  assert.equal(response.status, 403);
  assert.equal(dbSpyInstance.calls.length, 0);
  assert.equal(mediaSpyInstance.calls.length, 0);
});

// --- AS23-F007: allowed types, byte limit, signature validation ---

for (const [label, bytes, contentType] of [
  ["JPEG", JPEG_BYTES, "image/jpeg"],
  ["PNG", PNG_BYTES, "image/png"],
  ["WebP", webpBytes(), "image/webp"],
]) {
  test(`POST /admin/api/media accepts a valid ${label} upload and writes exactly one object + one media row + one success audit row`, async () => {
    const { db, media, cleanup } = await openTestEnv();
    try {
      const { privateKey, jwks } = await buildTestIdentity();
      const token = await signToken(privateKey);
      const response = await callAdmin(uploadRequest({ token, contentType, altText: "a photo", body: bytes }), { db, media, jwks });
      assert.equal(response.status, 201);
      const parsed = await response.json();
      assert.equal(parsed.contentType, contentType);
      assert.equal(parsed.sizeBytes, bytes.byteLength);
      assert.equal(parsed.altText, "a photo");
      assert.ok(typeof parsed.id === "string" && parsed.id.length > 0);
      // Positive projection only — no storage key or uploader identity ever
      // leaves this handler (AS23-F008 key generation stays server-internal).
      assert.equal(parsed.storageKey, undefined);
      assert.equal(parsed.uploadedBy, undefined);

      assert.equal(await countRows(db, "media"), 1);
      const row = await db.prepare("SELECT * FROM media WHERE id = ?").bind(parsed.id).first();
      assert.equal(row.content_type, contentType);
      assert.equal(row.uploaded_by, "cf-access:test-admin-subject");
      // Server-generated storage key, never derived from client input
      // (AS23-F008) — this upload request carried no filename/path at all.
      assert.ok(row.storage_key.startsWith("media/"));

      const stored = await media.get(row.storage_key);
      assert.ok(stored, "the object was actually written to local R2");

      const auditRow = await db
        .prepare("SELECT * FROM audit_log WHERE action = 'media_upload' AND entity_id = ?")
        .bind(parsed.id)
        .first();
      assert.equal(auditRow.result, "success");
      assert.equal(auditRow.entity_type, "media");
    } finally {
      await cleanup();
    }
  });
}

test("POST /admin/api/media rejects SVG content outright (415), before any D1/R2 access", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const response = await callAdmin(uploadRequest({ token, contentType: "image/svg+xml", altText: "alt", body: SVG_BYTES }), {
      db,
      media,
      jwks,
    });
    assert.equal(response.status, 415);
    assert.equal(await countRows(db, "media"), 0);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/media rejects a body whose signature does not match its declared Content-Type (400)", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    // Declares PNG but sends JPEG-signed bytes.
    const response = await callAdmin(uploadRequest({ token, contentType: "image/png", altText: "alt", body: JPEG_BYTES }), {
      db,
      media,
      jwks,
    });
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "media"), 0);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/media rejects an unsupported/arbitrary signature disguised with an allowed Content-Type (400)", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const arbitraryBytes = new TextEncoder().encode("not an image at all, just some arbitrary text bytes");
    const response = await callAdmin(uploadRequest({ token, contentType: "image/jpeg", altText: "alt", body: arbitraryBytes }), {
      db,
      media,
      jwks,
    });
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "media"), 0);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/media rejects a zero-byte body (400)", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const response = await callAdmin(uploadRequest({ token, contentType: "image/jpeg", altText: "alt", body: new Uint8Array(0) }), {
      db,
      media,
      jwks,
    });
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "media"), 0);
  } finally {
    await cleanup();
  }
});

test("a declared Content-Length over the 5 MiB budget is rejected (413) as an early reject, before the body is read", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const dbSpyInstance = dbSpy();
  const mediaSpyInstance = mediaSpy();
  const response = await callAdmin(
    uploadRequest({ token, contentType: "image/jpeg", altText: "alt", body: JPEG_BYTES, contentLength: 5 * 1024 * 1024 + 1 }),
    { db: dbSpyInstance, media: mediaSpyInstance, jwks }
  );
  assert.equal(response.status, 413);
  assert.equal(dbSpyInstance.calls.length, 0);
  assert.equal(mediaSpyInstance.calls.length, 0);
});

test("a body actually exceeding the 5 MiB budget is rejected (413) even without a declared Content-Length", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
    oversized.set(JPEG_BYTES, 0);
    const response = await callAdmin(uploadRequest({ token, contentType: "image/jpeg", altText: "alt", body: oversized }), {
      db,
      media,
      jwks,
    });
    assert.equal(response.status, 413);
    assert.equal(await countRows(db, "media"), 0);
  } finally {
    await cleanup();
  }
});

test("POST /admin/api/media rejects a missing alt-text header (400)", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const response = await callAdmin(uploadRequest({ token, contentType: "image/jpeg", body: JPEG_BYTES }), { db, media, jwks });
    assert.equal(response.status, 400);
    assert.equal(await countRows(db, "media"), 0);
  } finally {
    await cleanup();
  }
});

// --- AS23-F009: cross-store compensation ---

test("an R2 object write failure leaves no media row and no success audit row", async () => {
  const { db, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const response = await callAdmin(uploadRequest({ token, contentType: "image/jpeg", altText: "alt", body: JPEG_BYTES }), {
      db,
      media: throwingMedia(),
      jwks,
    });
    assert.equal(response.status, 500);
    assert.equal(await countRows(db, "media"), 0);
    const failureRow = await db.prepare("SELECT * FROM audit_log WHERE action = 'media_upload' AND result = 'failure'").first();
    assert.ok(failureRow, "a failure audit row was recorded");
  } finally {
    await cleanup();
  }
});

test("an R2 write success followed by a D1 batch failure triggers a compensating delete; no media row survives", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const deletedKeys = [];
    const compensatingMedia = {
      put: (key, bytes) => media.put(key, bytes),
      get: key => media.get(key),
      delete: key => {
        deletedKeys.push(key);
        return media.delete(key);
      },
    };
    const response = await callAdmin(uploadRequest({ token, contentType: "image/jpeg", altText: "alt", body: JPEG_BYTES }), {
      db: batchFailingDb(db),
      media: compensatingMedia,
      jwks,
    });
    assert.equal(response.status, 500);
    assert.equal(deletedKeys.length, 1, "a compensating delete was attempted for exactly the just-created object");
    const stillThere = await media.get(deletedKeys[0]);
    assert.equal(stillThere, null, "the orphaned object was actually removed from local R2");
    assert.equal(await countRows(db, "media"), 0, "no D1 media row survives the failed batch");
    const failureRow = await db.prepare("SELECT * FROM audit_log WHERE action = 'media_upload' AND result = 'failure'").first();
    assert.ok(failureRow, "a failure audit row was recorded after the batch failure");
  } finally {
    await cleanup();
  }
});

test("a D1 batch failure whose compensating R2 delete also fails still fails the request, without crashing", async () => {
  const { db, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const mediaWithFailingDelete = {
      put: async () => ({}),
      get: async () => null,
      delete: () => Promise.reject(new Error("SIMULATED_R2_DELETE_FAILURE")),
    };
    const response = await callAdmin(uploadRequest({ token, contentType: "image/jpeg", altText: "alt", body: JPEG_BYTES }), {
      db: batchFailingDb(db),
      media: mediaWithFailingDelete,
      jwks,
    });
    // AS23-F009: request still fails; no fabricated D1 consistency. The
    // orphaned R2 object in this scenario is a documented operational
    // limitation (coordination/IMPLEMENTER_HANDOFF.md), not a crash.
    assert.equal(response.status, 500);
    assert.equal(await countRows(db, "media"), 0);
  } finally {
    await cleanup();
  }
});

// --- AS23-F011: protected, positive-projection listing only ---

test("GET /admin/api/media returns exactly the active media rows as a positive metadata projection", async () => {
  const { db, media, cleanup } = await openTestEnv();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await callAdmin(uploadRequest({ token, contentType: "image/jpeg", altText: "first", body: JPEG_BYTES }), { db, media, jwks });
    await callAdmin(uploadRequest({ token, contentType: "image/png", altText: "second", body: PNG_BYTES }), { db, media, jwks });

    const response = await callAdmin(listRequest({ token }), { db, media, jwks });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.media.length, 2);
    for (const entry of body.media) {
      assert.ok(["id", "contentType", "sizeBytes", "altText", "uploadedAt"].every(key => key in entry));
      assert.equal(entry.storageKey, undefined);
      assert.equal(entry.uploadedBy, undefined);
      assert.equal(entry.state, undefined);
    }
  } finally {
    await cleanup();
  }
});

test("GET /admin/api/media with a non-GET/POST method is rejected (405) with zero D1 access", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const dbSpyInstance = dbSpy();
  const request = new Request(`${ORIGIN}/admin/api/media`, { method: "DELETE", headers: { [ACCESS_ASSERTION_HEADER]: token } });
  const response = await callAdmin(request, { db: dbSpyInstance, media: mediaSpy(), jwks });
  assert.equal(response.status, 405);
  assert.equal(dbSpyInstance.calls.length, 0);
});

test("an unrecognized /admin/api/media/* sub-path is protected 404, not the upload/list route", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const dbSpyInstance = dbSpy();
  const request = new Request(`${ORIGIN}/admin/api/media/some-id`, { method: "GET", headers: { [ACCESS_ASSERTION_HEADER]: token } });
  const response = await callAdmin(request, { db: dbSpyInstance, media: mediaSpy(), jwks });
  assert.equal(response.status, 404);
  assert.equal(dbSpyInstance.calls.length, 0);
});

// --- pure signature-detection unit coverage ---

test("detectImageContentType matches exactly the three allowed signatures and nothing else", () => {
  assert.equal(detectImageContentType(JPEG_BYTES), "image/jpeg");
  assert.equal(detectImageContentType(PNG_BYTES), "image/png");
  assert.equal(detectImageContentType(webpBytes()), "image/webp");
  assert.equal(detectImageContentType(SVG_BYTES), null);
  assert.equal(detectImageContentType(new Uint8Array(0)), null);
  assert.equal(detectImageContentType(new Uint8Array([0, 1, 2])), null);
});
