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
import { applyProjectCaseStudyMigrations } from "../worker/d1/schema.mjs";
import { migrateCurrentContent, canonicalSiteSettingsRevisionColumns } from "../worker/d1/migrate.mjs";
import { buildPublishBatch } from "../worker/d1/projects.mjs";
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
  await applyProjectCaseStudyMigrations(proxy.env.DB);
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
    v10: { tagline: `${name} tagline.`, status: i === 1 ? "Active" : "", disciplines: [0, 2], flow: ["Stage one", "Stage two", "Stage three", "Person reviews"], caseStudyEnabled: false },
    ...overrides,
  };
}

async function createAndPublish(db, name, i, overrides) {
  const created = await admin(db, "POST", "/admin/api/projects", projectBody(name, i, overrides));
  assert.equal(created.status, 201, `create ${name}`);
  const { draftRevisionId } = await created.json();
  return admin(db, "POST", `/admin/api/projects/v10-${i}/publish`, { expectedPublishedRevisionId: null, expectedDraftRevisionId: draftRevisionId });
}

async function createDraft(db, name, i, overrides) {
  const created = await admin(db, "POST", "/admin/api/projects", projectBody(name, i, overrides));
  assert.equal(created.status, 201, `create ${name}`);
  return (await created.json()).draftRevisionId;
}

// D-111 (AS137-F001): the entries for POST /admin/api/projects/initial-activation.
async function activationEntries(db, ids) {
  const entries = [];
  for (const id of ids) {
    const row = await db.prepare("SELECT published_revision_id, draft_revision_id FROM projects WHERE id = ?").bind(id).first();
    entries.push({ id, expectedPublishedRevisionId: row.published_revision_id, expectedDraftRevisionId: row.draft_revision_id });
  }
  return entries;
}

function activate(db, projects) {
  return admin(db, "POST", "/admin/api/projects/initial-activation", { projects });
}

const INITIAL_IDS = INITIAL_ACTIVATION_PROJECT_NAMES.map((_, i) => `v10-${i + 1}`);

// Drafts the D-105 five (v10-1..v10-5, in order) and activates them.
async function activateInitialFive(db) {
  for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.entries()) await createDraft(db, name, i + 1);
  const response = await activate(db, await activationEntries(db, INITIAL_IDS));
  assert.equal(response.status, 200, "initial activation");
  return response;
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

test("activating the initial five activates /, with a span-only body and AS132-F001 headers (tests 4, 11-header)", async () => {
  const { db, cleanup } = await openDb();
  try {
    for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.entries()) await createDraft(db, name, i + 1);
    const [{ id: _first, ...firstPointers }] = await activationEntries(db, ["v10-1"]);
    const lone = await admin(db, "POST", "/admin/api/projects/v10-1/publish", firstPointers);
    assert.equal(lone.status, 409, "D-111: no individual first activation");
    assert.equal((await lone.json()).reason, "INITIAL_ACTIVATION_REQUIRED");
    assert.equal(sha(await bytesOf(await publicHome(db))), ARTIFACT_SHA256, "/ stays the artifact before activation");

    const activated = await activate(db, await activationEntries(db, INITIAL_IDS));
    assert.equal(activated.status, 200);
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

async function homepageStatus(db) {
  const response = await admin(db, "GET", "/admin/api/content");
  assert.equal(response.status, 200);
  return (await response.json()).homepage;
}

test("AS133-F001 item 3: after initial activation, any valid published group of 1..5 renders through public /", async () => {
  const { db, cleanup } = await openDb();
  try {
    await activateInitialFive(db);
    const assertRenders = async (names, label) => {
      const { restSha, island } = spanOf(await bytesOf(await publicHome(db)));
      assert.equal(restSha, ARTIFACT_SHA256, "span-only transformation");
      assert.deepEqual(island.projects.map(p => p.name), names, label);
      const status = await homepageStatus(db);
      assert.equal(status.live.projects, true, "runtime bridge is valid");
      assert.equal(status.initialActivation.done, true);
      return status;
    };
    await assertRenders([...INITIAL_ACTIVATION_PROJECT_NAMES], "5 projects render");

    // Unpublish from the end: groups of 4, 3, 2 and 1 still render (no runtime five-project gate).
    for (let k = INITIAL_ACTIVATION_PROJECT_NAMES.length; k > 1; k--) {
      const [{ id, ...pointers }] = await activationEntries(db, [`v10-${k}`]);
      assert.equal((await admin(db, "POST", `/admin/api/projects/${id}/unpublish`, pointers)).status, 200);
      const status = await assertRenders(INITIAL_ACTIVATION_PROJECT_NAMES.slice(0, k - 1), `${k - 1} project(s) render`);
      assert.equal(status.releaseReadiness.ready, false, "release readiness is independent of runtime validity");
    }

    // After activation, a new homepage project publishes individually.
    const published = await createAndPublish(db, "Fixture Six", 6);
    assert.equal(published.status, 200, "individual homepage publish works after initial activation");
    await assertRenders(["ClinicFlow", "Fixture Six"], "2 projects render");
  } finally {
    await cleanup();
  }
});

test("AS133-F001 item 4: after the D-105 five are active, unpublishing one leaves the other four visible", async () => {
  const { db, cleanup } = await openDb();
  try {
    await activateInitialFive(db);
    const before = await homepageStatus(db);
    assert.equal(before.releaseReadiness.ready, true, "AS132-F002 initial release readiness passes");
    assert.deepEqual(before.releaseReadiness.requiredNames, [...INITIAL_ACTIVATION_PROJECT_NAMES]);

    const row = await db.prepare("SELECT published_revision_id, draft_revision_id FROM projects WHERE id = 'v10-2'").first();
    const unpublished = await admin(db, "POST", "/admin/api/projects/v10-2/unpublish", {
      expectedPublishedRevisionId: row.published_revision_id,
      expectedDraftRevisionId: row.draft_revision_id,
    });
    assert.equal(unpublished.status, 200);

    const bytes = await bytesOf(await publicHome(db));
    assert.notEqual(sha(bytes), ARTIFACT_SHA256, "does not revert to the artifact's project data");
    const { restSha, island } = spanOf(bytes);
    assert.equal(restSha, ARTIFACT_SHA256);
    assert.deepEqual(
      island.projects.map(p => p.name),
      INITIAL_ACTIVATION_PROJECT_NAMES.filter(name => name !== "Eternal Eggs"),
    );
    const after = await homepageStatus(db);
    assert.equal(after.live.projects, true);
    assert.equal(after.releaseReadiness.ready, false, "the release check reflects the changed set, but gates nothing");
  } finally {
    await cleanup();
  }
});

test("a sixth homepage project is rejected before publication (test 8); legacy projects stay publishable", async () => {
  const { db, cleanup } = await openDb();
  try {
    await activateInitialFive(db);
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

// --- D-111 (AS137-F001): initial-only atomic homepage activation ----------

async function publishedHomepageCount(db) {
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS n FROM projects p JOIN project_revisions r ON r.id = p.published_revision_id AND r.project_id = p.id " +
        "WHERE r.featured = 1 AND r.tagline IS NOT NULL AND r.status IS NOT NULL AND r.disciplines_json IS NOT NULL AND r.flow_json IS NOT NULL"
    )
    .first();
  return row.n;
}

async function activationMarkers(db) {
  return (await db.prepare("SELECT result FROM audit_log WHERE action = 'homepage_initial_activation' ORDER BY id").all()).results.map(r => r.result);
}

async function assertNotActivated(db, label) {
  assert.equal(await publishedHomepageCount(db), 0, `${label}: zero published homepage projects`);
  assert.equal((await activationMarkers(db)).includes("success"), false, `${label}: no activation marker`);
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'project_publish' AND result = 'success'").first()).n,
    0,
    `${label}: no success publish audit`
  );
  const response = await publicHome(db);
  assert.equal(sha(await bytesOf(response)), ARTIFACT_SHA256, `${label}: / is the untouched artifact`);
  assert.equal((await homepageStatus(db)).initialActivation.done, false, `${label}: status reports not activated`);
}

// Runs `sql` against the real database immediately before the next batch,
// simulating a competing write that commits between the handler's pre-read
// and its atomic batch.
function racingDb(db, sql) {
  let raced = false;
  return {
    prepare: (...args) => db.prepare(...args),
    async batch(statements) {
      if (!raced) {
        raced = true;
        await db.prepare(sql).run();
      }
      return db.batch(statements);
    },
  };
}

test("D-111: zero published projects is the artifact fallback, before and after activation", async () => {
  const { db, cleanup } = await openDb();
  try {
    await assertNotActivated(db, "fresh");
    await activateInitialFive(db);
    for (const id of INITIAL_IDS) {
      const [{ id: _id, ...pointers }] = await activationEntries(db, [id]);
      assert.equal((await admin(db, "POST", `/admin/api/projects/${id}/unpublish`, pointers)).status, 200);
    }
    assert.equal(await publishedHomepageCount(db), 0);
    assert.equal(sha(await bytesOf(await publicHome(db))), ARTIFACT_SHA256, "all unpublished after activation: artifact fallback");
    assert.equal((await homepageStatus(db)).initialActivation.done, true, "activation stays recorded");
  } finally {
    await cleanup();
  }
});

test("D-111: one or four individual homepage publishes cannot create a first activation", async () => {
  const { db, cleanup } = await openDb();
  try {
    for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.slice(0, 4).entries()) {
      await createDraft(db, name, i + 1);
      const [{ id, ...pointers }] = await activationEntries(db, [`v10-${i + 1}`]);
      const response = await admin(db, "POST", `/admin/api/projects/${id}/publish`, pointers);
      assert.equal(response.status, 409, name);
      assert.equal((await response.json()).reason, "INITIAL_ACTIVATION_REQUIRED", name);
      const row = await db.prepare("SELECT published_revision_id, draft_revision_id FROM projects WHERE id = ?").bind(id).first();
      assert.equal(row.published_revision_id, null, `${name}: not published`);
      assert.equal(row.draft_revision_id, pointers.expectedDraftRevisionId, `${name}: draft kept`);
    }
    const four = await activate(db, await activationEntries(db, INITIAL_IDS.slice(0, 4)));
    assert.equal(four.status, 400, "initial activation requires exactly five");
    await assertNotActivated(db, "after one-by-one and four-project attempts");

    // A non-homepage (legacy) project is still publishable before activation.
    assert.equal((await createAndPublish(db, "Legacy", 7, { v10: undefined })).status, 200);
    assert.equal(await publishedHomepageCount(db), 0);
  } finally {
    await cleanup();
  }
});

test("D-111: the individual publish guard also holds at commit time before activation", async () => {
  const { db, cleanup } = await openDb();
  try {
    const draftRevisionId = await createDraft(db, "ClinicFlow", 1);
    await assert.rejects(
      db.batch(
        buildPublishBatch(db, {
          id: "v10-1",
          draftRevisionId,
          expectedPublishedRevisionId: null,
          expectedDraftRevisionId: draftRevisionId,
          actor: "cf-access:test-subject",
          homepageLimit: 5,
        })
      ),
      "the guarded UPDATE rejects a homepage publish without the activation marker"
    );
    await assertNotActivated(db, "commit-time guard");
  } finally {
    await cleanup();
  }
});

test("D-111: the exact D-105 five activate atomically, once, with audit evidence", async () => {
  const { db, cleanup } = await openDb();
  try {
    const response = await activateInitialFive(db);
    const body = await response.json();
    assert.deepEqual(body.initialActivation, { done: true });
    assert.deepEqual(body.projects.map(p => [p.id, p.state]), INITIAL_IDS.map(id => [id, "published"]));

    assert.equal(await publishedHomepageCount(db), 5);
    const { island } = spanOf(await bytesOf(await publicHome(db)));
    assert.deepEqual(island.projects.map(p => p.name), [...INITIAL_ACTIVATION_PROJECT_NAMES], "rendered in the D-105 order");

    const audit = (await db.prepare("SELECT actor, action, entity_type, entity_id, revision_id, result FROM audit_log WHERE result = 'success' ORDER BY id").all()).results;
    const tail = audit.slice(-6);
    assert.deepEqual(
      tail.map(r => [r.action, r.entity_type, r.entity_id]),
      [...INITIAL_IDS.map(id => ["project_publish", "project", id]), ["homepage_initial_activation", "homepage", "home"]]
    );
    assert.ok(tail.every(r => r.actor === `cf-access:${SUB}`));
    for (const r of tail.slice(0, 5)) {
      const row = await db.prepare("SELECT published_revision_id FROM projects WHERE id = ?").bind(r.entity_id).first();
      assert.equal(r.revision_id, row.published_revision_id, `${r.entity_id}: audit names the published revision`);
    }
    assert.deepEqual(await activationMarkers(db), ["success"]);

    const again = await activate(db, await activationEntries(db, INITIAL_IDS));
    assert.equal(again.status, 409);
    assert.equal((await again.json()).reason, "INITIAL_ACTIVATION_ALREADY_DONE");
    assert.deepEqual(await activationMarkers(db), ["success", "failure"], "a rejected repeat is audited as a failure only");

    const marker = await db.prepare("SELECT id FROM audit_log WHERE action = 'homepage_initial_activation' AND result = 'success'").first();
    await assert.rejects(db.prepare("DELETE FROM audit_log WHERE id = ?").bind(marker.id).run(), "the marker is append-only");
  } finally {
    await cleanup();
  }
});

test("D-111: failed initial activations publish nothing", async () => {
  const { db, cleanup } = await openDb();
  try {
    for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.entries()) await createDraft(db, name, i + 1);
    const entries = await activationEntries(db, INITIAL_IDS);

    const swapped = [entries[1], entries[0], ...entries.slice(2)];
    const outOfOrder = await activate(db, swapped);
    assert.equal(outOfOrder.status, 400, "request order must be the D-105 order");
    assert.equal((await outOfOrder.json()).reason, "INITIAL_SET_MISMATCH");

    const duplicate = await activate(db, [...entries.slice(0, 4), entries[0]]);
    assert.equal(duplicate.status, 400, "duplicate entries are rejected");

    const stale = await activate(db, [...entries.slice(0, 4), { ...entries[4], expectedDraftRevisionId: entries[4].expectedDraftRevisionId + 99 }]);
    assert.equal(stale.status, 409, "stale expected pointers are rejected");

    const extraKey = await activate(db, entries.map(e => ({ ...e, featured: true })));
    assert.equal(extraKey.status, 400, "no fields beyond id and expected pointers");
    await assertNotActivated(db, "validation failures");

    // A wrong name (not the exact D-105 set).
    const wrongNameDraft = await admin(db, "PUT", "/admin/api/projects/v10-4/draft", { ...projectBody("S.U.", 4), expectedPublishedRevisionId: null, expectedDraftRevisionId: entries[3].expectedDraftRevisionId });
    assert.equal(wrongNameDraft.status, 200);
    const wrongName = await activate(db, await activationEntries(db, INITIAL_IDS));
    assert.equal(wrongName.status, 400);
    assert.equal((await wrongName.json()).reason, "INITIAL_SET_MISMATCH");
    await assertNotActivated(db, "wrong name");

    // Complete names again, but one draft without V10 fields.
    const [su] = await activationEntries(db, ["v10-4"]);
    assert.equal((await admin(db, "PUT", "/admin/api/projects/v10-4/draft", { ...projectBody("SU", 4, { v10: null }), expectedPublishedRevisionId: null, expectedDraftRevisionId: su.expectedDraftRevisionId })).status, 200);
    const ineligible = await activate(db, await activationEntries(db, INITIAL_IDS));
    assert.equal(ineligible.status, 409);
    assert.equal((await ineligible.json()).reason, "NOT_HOMEPAGE_ELIGIBLE");
    await assertNotActivated(db, "incomplete project");

    // Valid set again; a competing change to the LAST project lands between
    // the pre-read and the batch. The whole batch, including the first four
    // publications, rolls back.
    const [su2] = await activationEntries(db, ["v10-4"]);
    assert.equal((await admin(db, "PUT", "/admin/api/projects/v10-4/draft", { ...projectBody("SU", 4), expectedPublishedRevisionId: null, expectedDraftRevisionId: su2.expectedDraftRevisionId })).status, 200);
    const valid = await activationEntries(db, INITIAL_IDS);
    const raced = racingDb(db, "UPDATE projects SET draft_revision_id = NULL WHERE id = 'v10-5'");
    const racedResponse = await handleAdminDispatch({
      request: new Request(`${ORIGIN}/admin/api/projects/initial-activation`, { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json" }, body: JSON.stringify({ projects: valid }) }),
      url: new URL(`${ORIGIN}/admin/api/projects/initial-activation`),
      assets: artifactAssets(),
      db: raced,
      media: null,
      sub: SUB,
    });
    assert.equal(racedResponse.status, 409, "a concurrent change is a conflict");
    await assertNotActivated(db, "commit-time rollback");
    for (const id of INITIAL_IDS.slice(0, 4)) {
      const row = await db.prepare("SELECT published_revision_id FROM projects WHERE id = ?").bind(id).first();
      assert.equal(row.published_revision_id, null, `${id}: rolled back with the batch`);
    }
    assert.ok((await activationMarkers(db)).every(result => result === "failure"), "only failure audits were recorded");
  } finally {
    await cleanup();
  }
});

test("D-111: initial activation refuses a non-empty homepage and non-POST methods", async () => {
  const { db, cleanup } = await openDb();
  try {
    for (const [i, name] of INITIAL_ACTIVATION_PROJECT_NAMES.entries()) await createDraft(db, name, i + 1);
    // A homepage-eligible row published outside the admin lifecycle (for example a hand-seeded database).
    await createDraft(db, "Stray", 9);
    await db.prepare("UPDATE projects SET published_revision_id = draft_revision_id, draft_revision_id = NULL WHERE id = 'v10-9'").run();
    const response = await activate(db, await activationEntries(db, INITIAL_IDS));
    assert.equal(response.status, 409);
    assert.equal((await response.json()).reason, "HOMEPAGE_NOT_EMPTY");
    assert.equal((await activationMarkers(db)).includes("success"), false);
    assert.equal((await admin(db, "GET", "/admin/api/projects/initial-activation")).status, 405);
  } finally {
    await cleanup();
  }
});

// --- D-111: site_settings first contact-draft bootstrap -----------------

test("D-111: the first contact draft initializes site_settings atomically and does not publish", async () => {
  const { db, cleanup } = await openDb();
  try {
    const before = (await (await admin(db, "GET", "/admin/api/content")).json()).contact;
    assert.deepEqual(before, { initialized: false, publishedRevisionId: null, draftRevisionId: null, published: null, draft: null });

    const drafted = await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "owner@example.com", expectedPublishedRevisionId: null, expectedDraftRevisionId: null });
    assert.equal(drafted.status, 200);
    const { contact } = await drafted.json();
    assert.equal(contact.initialized, true);
    assert.equal(contact.publishedRevisionId, null, "nothing is published");
    assert.equal(contact.draft.email, "owner@example.com");
    assert.equal(contact.draft.setThroughAdmin, true);

    const row = await db.prepare("SELECT * FROM site_settings WHERE id = 'default'").first();
    assert.equal(row.published_revision_id, null);
    const revisions = (await db.prepare("SELECT * FROM site_settings_revisions").all()).results;
    assert.equal(revisions.length, 1);
    const [revision] = revisions;
    assert.equal(revision.id, row.draft_revision_id);
    assert.equal(revision.revision_number, 1);
    assert.equal(revision.created_by, `cf-access:${SUB}`);
    const canonical = canonicalSiteSettingsRevisionColumns(siteContent);
    for (const [column, value] of Object.entries(canonical)) {
      assert.equal(revision[column], column === "contact_email" ? "owner@example.com" : value, column);
    }

    const audit = (await db.prepare("SELECT action, revision_id, result FROM audit_log WHERE entity_type = 'site_settings' ORDER BY id").all()).results;
    assert.deepEqual(audit, [
      { action: "site_settings_bootstrap", revision_id: revision.id, result: "success" },
      { action: "site_settings_contact_update_draft", revision_id: revision.id, result: "success" },
    ]);

    assert.equal(sha(await bytesOf(await publicHome(db))), ARTIFACT_SHA256, "a draft email never reaches /");

    // The normal attested publish then works on the bootstrapped row.
    const expected = { expectedPublishedRevisionId: null, expectedDraftRevisionId: revision.id };
    assert.equal((await admin(db, "POST", "/admin/api/content/contact/publish", { ...expected, confirmDeliverability: true })).status, 200);
    assert.deepEqual(spanOf(await bytesOf(await publicHome(db))).island, { schemaVersion: 1, contact: { email: "owner@example.com" } });
  } finally {
    await cleanup();
  }
});

test("D-111: stale or conflicting site_settings bootstrap attempts fail safely", async () => {
  const { db, cleanup } = await openDb();
  try {
    const wrongPointers = await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "owner@example.com", expectedPublishedRevisionId: 1, expectedDraftRevisionId: null });
    assert.equal(wrongPointers.status, 409, "an uninitialized row must be addressed with null pointers");
    const invalid = await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "not an email", expectedPublishedRevisionId: null, expectedDraftRevisionId: null });
    assert.equal(invalid.status, 400);
    assert.equal(await db.prepare("SELECT id FROM site_settings").first(), null, "no row after rejected attempts");

    // A competing bootstrap commits between the pre-read and the batch.
    const racer = racingDb(
      db,
      "INSERT INTO site_settings (id, created_at) VALUES ('default', '2026-09-28T00:00:00.000Z')"
    );
    const racedRequest = new Request(`${ORIGIN}/admin/api/content/contact/draft`, {
      method: "PUT",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@example.com", expectedPublishedRevisionId: null, expectedDraftRevisionId: null }),
    });
    const raced = await handleAdminDispatch({ request: racedRequest, url: new URL(racedRequest.url), assets: artifactAssets(), db: racer, media: null, sub: SUB });
    assert.equal(raced.status, 409);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM site_settings_revisions").first()).n, 0, "the losing batch left no revision");
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE entity_type = 'site_settings' AND result = 'success'").first()).n,
      0,
      "and no success audit"
    );
    await db.prepare("DELETE FROM site_settings WHERE id = 'default'").run();

    // First bootstrap wins; a second one still addressed as uninitialized is stale.
    assert.equal((await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "first@example.com", expectedPublishedRevisionId: null, expectedDraftRevisionId: null })).status, 200);
    const second = await admin(db, "PUT", "/admin/api/content/contact/draft", { email: "second@example.com", expectedPublishedRevisionId: null, expectedDraftRevisionId: null });
    assert.equal(second.status, 409);
    const revisions = (await db.prepare("SELECT contact_email FROM site_settings_revisions ORDER BY id").all()).results;
    assert.deepEqual(revisions.map(r => r.contact_email), ["first@example.com"]);
    assert.equal((await db.prepare("SELECT published_revision_id FROM site_settings WHERE id = 'default'").first()).published_revision_id, null);
  } finally {
    await cleanup();
  }
});
