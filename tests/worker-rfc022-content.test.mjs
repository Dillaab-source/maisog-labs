// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-105/D-106): D1-backed tests for the V10
// published-content bridge, the extended project lifecycle, the contact-email
// lifecycle and the protected homepage preview.
//
// Real local Wrangler/Miniflare D1 (`getPlatformProxy({ remoteBindings:
// false })`) with every migration through 0006, exactly like the existing
// tests/worker-*.test.mjs suites. Admin handlers are driven post-auth through
// handleAdminDispatch (as tests/worker-admin-projects.test.mjs does); the
// Access boundary for /admin/preview/home is exercised through handleRequest.
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { handleRequest } from "../worker/auth.mjs";
import { handleAdminDispatch } from "../worker/admin/dashboard.mjs";
import { handlePublicHome } from "../worker/public/home.mjs";
import { applyRfc022Schema } from "../worker/d1/schema.mjs";
import { migrateCurrentContent } from "../worker/d1/migrate.mjs";
import { siteContent } from "../data/site.js";
import { ARTIFACT_SHA256, INSERTION_OFFSET } from "../worker/bridge/inject.mjs";
import { INITIAL_ACTIVATION_PROJECT_NAMES } from "../worker/bridge/payload.mjs";

const WRANGLER_CONFIG_PATH = path.join(import.meta.dirname, "..", "wrangler.jsonc");
const ORIGIN = "https://maisoglabs.test";
const SUB = "test-subject";
const ARTIFACT = new Uint8Array(fs.readFileSync(new URL("../public/index.html", import.meta.url)));
const ARTIFACT_ETAG = '"artifact-etag"';
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

// Stand-in for env.ASSETS: serves the artifact for "/" with body-identity
// headers, and honours If-None-Match like the asset handler does.
function artifactAssets() {
  const requests = [];
  return {
    requests,
    async fetch(request) {
      requests.push(request);
      if (request.headers.get("If-None-Match") === ARTIFACT_ETAG) return new Response(null, { status: 304, headers: { ETag: ARTIFACT_ETAG } });
      return new Response(ARTIFACT, {
        status: 200,
        headers: { "Content-Type": "text/html", ETag: ARTIFACT_ETAG, "Content-Length": String(ARTIFACT.length), "Cache-Control": "public, max-age=0, must-revalidate" },
      });
    },
  };
}

async function openDb({ seed = false } = {}) {
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "rfc022-d1-test-"));
  const proxy = await getPlatformProxy({ configPath: WRANGLER_CONFIG_PATH, persist: { path: statePath }, remoteBindings: false });
  await applyRfc022Schema(proxy.env.DB);
  if (seed) await migrateCurrentContent(proxy.env.DB, siteContent);
  return {
    db: proxy.env.DB,
    async cleanup() {
      await proxy.dispose();
      fs.rmSync(statePath, { recursive: true, force: true });
    },
  };
}

const bytesOf = async response => new Uint8Array(await response.arrayBuffer());

async function publicHome(db, assets = artifactAssets(), init = {}) {
  return handlePublicHome({ request: new Request(`${ORIGIN}/`, init), assets, db });
}

function admin(db, method, pathname, body) {
  const init = { method, headers: {} };
  if (body !== undefined) {
    init.headers = { Origin: ORIGIN, "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const request = new Request(`${ORIGIN}${pathname}`, init);
  return handleAdminDispatch({ request, url: new URL(request.url), assets: artifactAssets(), db, media: null, sub: SUB });
}

function projectBody(name, i, overrides = {}) {
  return {
    id: `v10-${i}`,
    slug: `v10-${i}`,
    order: i,
    category: "Lab project",
    title: name,
    summary: `${name} description.`,
    stack: ["Cloudflare"],
    accent: "blue",
    icon: "lab",
    featured: true,
    v10: { tagline: `${name} tagline.`, status: i === 1 ? "Active" : "", disciplines: [0, 2], flow: ["Stage one", "Stage two", "Stage three", "Person reviews"] },
    ...overrides,
  };
}

async function createAndPublish(db, name, i, overrides) {
  const created = await admin(db, "POST", "/admin/api/projects", projectBody(name, i, overrides));
  assert.equal(created.status, 201, `create ${name}`);
  const { draftRevisionId } = await created.json();
  return admin(db, "POST", `/admin/api/projects/v10-${i}/publish`, { expectedPublishedRevisionId: null, expectedDraftRevisionId: draftRevisionId });
}

function spanOf(bytes) {
  const extra = bytes.length - ARTIFACT.length;
  const span = new TextDecoder().decode(bytes.subarray(INSERTION_OFFSET, INSERTION_OFFSET + extra));
  const rest = new Uint8Array(ARTIFACT.length);
  rest.set(bytes.subarray(0, INSERTION_OFFSET), 0);
  rest.set(bytes.subarray(INSERTION_OFFSET + extra), INSERTION_OFFSET);
  return { span, restSha: sha(rest), island: JSON.parse(span.match(/id="ml-published">([^<]*)<\/script>/)[1]) };
}

test("no published content: / is the untouched artifact response (test 2)", async () => {
  const { db, cleanup } = await openDb();
  try {
    const response = await publicHome(db);
    assert.equal(response.headers.get("etag"), ARTIFACT_ETAG, "untouched fallback keeps the asset headers");
    assert.equal(sha(await bytesOf(response)), ARTIFACT_SHA256);
  } finally {
    await cleanup();
  }
});

test("seeded legacy content never reaches /: seed email and legacy featured projects are ignored", async () => {
  const { db, cleanup } = await openDb({ seed: true });
  try {
    const response = await publicHome(db);
    assert.equal(sha(await bytesOf(response)), ARTIFACT_SHA256);
  } finally {
    await cleanup();
  }
});

test("D1 error and D1 timeout: / is the untouched artifact response (test 3)", async () => {
  const failing = { prepare: () => ({ bind() { return this; } }), batch: () => Promise.reject(new Error("D1 down")) };
  assert.equal(sha(await bytesOf(await publicHome(failing))), ARTIFACT_SHA256);
  const hanging = { prepare: () => ({ bind() { return this; } }), batch: () => new Promise(() => {}) };
  const started = Date.now();
  const response = await handlePublicHome({ request: new Request(`${ORIGIN}/`), assets: artifactAssets(), db: hanging, timeoutMs: 50 });
  assert.equal(sha(await bytesOf(response)), ARTIFACT_SHA256);
  assert.ok(Date.now() - started < 2000);
});

test("drafts never reach / but appear in the protected preview (test 6)", async () => {
  const { db, cleanup } = await openDb();
  try {
    for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.entries()) {
      assert.equal((await admin(db, "POST", "/admin/api/projects", projectBody(name, i + 1))).status, 201);
    }
    assert.equal(sha(await bytesOf(await publicHome(db))), ARTIFACT_SHA256, "draft-only content is not public");

    const preview = await admin(db, "GET", "/admin/preview/home");
    const bytes = await bytesOf(preview);
    const { restSha, island } = spanOf(bytes);
    assert.equal(restSha, ARTIFACT_SHA256);
    assert.deepEqual(island.projects.map(p => p.name), [...INITIAL_ACTIVATION_PROJECT_NAMES]);

    const unauthenticated = await handleRequest(new Request(`${ORIGIN}/admin/preview/home`), {
      assets: artifactAssets(),
      teamDomain: "team.cloudflareaccess.com",
      audience: "a".repeat(64),
      getJWKS: () => async () => {
        throw new Error("no keys");
      },
      dispatch: () => {
        throw new Error("dispatch must not run unauthenticated");
      },
    });
    assert.equal(unauthenticated.status, 401);
  } finally {
    await cleanup();
  }
});

test("publishing the initial five activates /, with a span-only body and AS132-F001 headers (tests 4, 11-header)", async () => {
  const { db, cleanup } = await openDb();
  try {
    for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.entries()) {
      const published = await createAndPublish(db, name, i + 1);
      assert.equal(published.status, 200, name);
      if (i < 4) assert.equal(sha(await bytesOf(await publicHome(db))), ARTIFACT_SHA256, "AS132-F002 gate holds until all five");
    }
    const response = await publicHome(db, artifactAssets(), { headers: { "If-None-Match": ARTIFACT_ETAG } });
    assert.equal(response.status, 200, "a conditional request is never answered with the artifact's 304");
    assert.equal(response.headers.get("etag"), null);
    assert.equal(response.headers.get("content-encoding"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const { span, restSha, island } = spanOf(await bytesOf(response));
    assert.equal(restSha, ARTIFACT_SHA256, "removing the span yields the artifact");
    assert.ok(span.startsWith('<script type="application/json" id="ml-published">'));
    assert.deepEqual(island.projects.map(p => p.name), [...INITIAL_ACTIVATION_PROJECT_NAMES]);
    assert.equal(island.contact, undefined, "no email until one is deliberately published");
    assert.equal(island.projects[0].status, "Active");
    assert.ok(island.projects.every(p => p.flow.length === 4));

    const head = await publicHome(db, artifactAssets(), { method: "HEAD" });
    assert.equal(head.headers.get("etag"), ARTIFACT_ETAG, "non-GET methods stay untouched");
  } finally {
    await cleanup();
  }
});

test("a sixth homepage project is rejected before publication (test 8); legacy projects stay publishable", async () => {
  const { db, cleanup } = await openDb();
  try {
    for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.entries()) assert.equal((await createAndPublish(db, name, i + 1)).status, 200);
    const created = await admin(db, "POST", "/admin/api/projects", projectBody("Maisog Guild", 6));
    const { draftRevisionId } = await created.json();
    const sixth = await admin(db, "POST", "/admin/api/projects/v10-6/publish", { expectedPublishedRevisionId: null, expectedDraftRevisionId: draftRevisionId });
    assert.equal(sixth.status, 409);
    assert.equal((await sixth.json()).reason, "HOMEPAGE_LIMIT");
    const row = await db.prepare("SELECT published_revision_id, draft_revision_id FROM projects WHERE id = 'v10-6'").first();
    assert.equal(row.published_revision_id, null);
    assert.equal(row.draft_revision_id, draftRevisionId);

    const legacy = await createAndPublish(db, "Legacy", 7, { v10: undefined });
    assert.equal(legacy.status, 200, "a featured project without V10 fields is not homepage-eligible and not blocked");
    const { island } = spanOf(await bytesOf(await publicHome(db)));
    assert.equal(island.projects.length, 5);
  } finally {
    await cleanup();
  }
});

test("V10 fields are validated on write: three flow stages, bad disciplines and oversized names are rejected (tests 5, 9)", async () => {
  const { db, cleanup } = await openDb();
  try {
    const bad = [
      { v10: { tagline: "t", status: "", disciplines: [0], flow: ["a", "b", "c"] } },
      { v10: { tagline: "t", status: "", disciplines: [7], flow: ["a", "b", "c", "d"] } },
      { v10: { tagline: "<script>", status: "", disciplines: [0], flow: ["a", "b", "c", "d"] } },
      { title: "x".repeat(41) },
      { v10: { tagline: "t", status: "Retired", disciplines: [0], flow: ["a", "b", "c", "d"] } },
    ];
    for (const [i, overrides] of bad.entries()) {
      const response = await admin(db, "POST", "/admin/api/projects", projectBody(`Bad ${i}`, 20 + i, overrides));
      assert.equal(response.status, 400, JSON.stringify(overrides));
    }
    const count = await db.prepare("SELECT COUNT(*) AS n FROM project_revisions").first();
    assert.equal(count.n, 0);
  } finally {
    await cleanup();
  }
});

test("stale project edit fails without partial publication or revision (test 7); omitted v10 is inherited", async () => {
  const { db, cleanup } = await openDb();
  try {
    const created = await admin(db, "POST", "/admin/api/projects", projectBody("ClinicFlow", 1));
    const { draftRevisionId } = await created.json();
    const stale = await admin(db, "PUT", "/admin/api/projects/v10-1/draft", {
      ...projectBody("ClinicFlow", 1),
      expectedPublishedRevisionId: null,
      expectedDraftRevisionId: draftRevisionId + 99,
    });
    assert.equal(stale.status, 409);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM project_revisions").first()).n, 1);

    const { v10, id, slug, ...legacyShape } = projectBody("ClinicFlow", 1);
    const edited = await admin(db, "PUT", "/admin/api/projects/v10-1/draft", { ...legacyShape, expectedPublishedRevisionId: null, expectedDraftRevisionId: draftRevisionId });
    assert.equal(edited.status, 200);
    const preview = await (await admin(db, "GET", "/admin/api/projects/v10-1/preview")).json();
    assert.deepEqual(preview.v10, v10, "V10 group inherited when omitted");
  } finally {
    await cleanup();
  }
});

test("contact email: draft is not public, publish needs the deliverability attestation, stale writes fail, audit is atomic", async () => {
  const { db, cleanup } = await openDb({ seed: true });
  try {
    const view = await (await admin(db, "GET", "/admin/api/content")).json();
    assert.equal(view.contact.initialized, true);
    assert.equal(view.contact.published.setThroughAdmin, false, "the seed revision is not an admin publication");
    const { publishedRevisionId } = view.contact;

    const stale = await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "owner@example.com", expectedPublishedRevisionId: publishedRevisionId + 99, expectedDraftRevisionId: null });
    assert.equal(stale.status, 409);
    const invalid = await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "javascript:alert(1)", expectedPublishedRevisionId: publishedRevisionId, expectedDraftRevisionId: null });
    assert.equal(invalid.status, 400);

    const drafted = await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "owner@example.com", expectedPublishedRevisionId: publishedRevisionId, expectedDraftRevisionId: null });
    assert.equal(drafted.status, 200);
    const { contact } = await drafted.json();
    assert.equal(contact.draft.email, "owner@example.com");
    assert.equal(sha(await bytesOf(await publicHome(db))), ARTIFACT_SHA256, "a draft email is not public");

    const expected = { expectedPublishedRevisionId: publishedRevisionId, expectedDraftRevisionId: contact.draftRevisionId };
    assert.equal((await admin(db, "POST", "/admin/api/content/contact/publish", expected)).status, 400, "attestation required");
    assert.equal((await admin(db, "POST", "/admin/api/content/contact/publish", { ...expected, confirmDeliverability: true })).status, 200);

    const { island } = spanOf(await bytesOf(await publicHome(db)));
    assert.deepEqual(island, { schemaVersion: 1, contact: { email: "owner@example.com" } });

    const audit = (await db.prepare("SELECT action, result FROM audit_log WHERE entity_type = 'site_settings' ORDER BY id").all()).results;
    assert.deepEqual(
      audit.filter(row => row.result === "success").map(row => row.action),
      ["site_settings_contact_update_draft", "site_settings_contact_publish"]
    );
    assert.ok(audit.some(row => row.result === "failure"), "rejected attempts leave failure audit rows");

    const revisions = (await db.prepare("SELECT created_by, contact_email FROM site_settings_revisions ORDER BY id").all()).results;
    assert.equal(revisions.length, 2, "exactly one new revision; the seed revision is unchanged");
    assert.equal(revisions[0].contact_email, siteContent.contact.email);
  } finally {
    await cleanup();
  }
});
