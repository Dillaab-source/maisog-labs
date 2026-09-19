// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032) bounded public
// design read API tests. Every D1 database used here is a local
// Wrangler/Miniflare simulation (`getPlatformProxy({ remoteBindings: false
// })`) persisted to a throwaway temp directory per test — no test in this
// file can reach a real Cloudflare resource.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { handleRequest, ACCESS_ASSERTION_HEADER, isPublicDesignApiPath } from "../worker/auth.mjs";
import { handleAdminDispatch } from "../worker/admin/dashboard.mjs";
import { handlePublicDesignDispatch } from "../worker/public/design.mjs";
import { applyCompleteSchema } from "../worker/d1/schema.mjs";

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
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-007-public-d1-test-"));
  const proxy = await getPlatformProxy({ configPath: WRANGLER_CONFIG_PATH, persist: { path: statePath }, remoteBindings: false });
  await applyCompleteSchema(proxy.env.DB);
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
    publicDispatch: ({ request, url }) => handlePublicDesignDispatch({ request, url, db }),
  });
}

function publicRequest(pathname, { method = "GET", token } = {}) {
  const headers = {};
  if (token) headers[ACCESS_ASSERTION_HEADER] = token;
  return new Request(`${ORIGIN}${pathname}`, { method, headers });
}

async function seedSection(db, id, revisionId, { order, visible, published = true }) {
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO sections (id, created_at) VALUES (?, ?)").bind(id, now).run();
  await db
    .prepare("INSERT INTO section_revisions (id, section_id, revision_number, sort_order, visible, created_at, created_by) VALUES (?, ?, 1, ?, ?, ?, ?)")
    .bind(revisionId, id, order, visible ? 1 : 0, now, "seed")
    .run();
  if (published) {
    await db.prepare("UPDATE sections SET published_revision_id = ? WHERE id = ?").bind(revisionId, id).run();
  }
}

// Seeds a published theme draft (revision 2) on top of the migration
// bootstrap's published revision 1, plus all four managed sections — one
// with only a draft (never published, must not leak) and three published.
async function seedFixture(db) {
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO theme_settings_revisions (id, theme_settings_id, revision_number, hero_background_preset, card_style_preset, layout_density_preset, typography_preset, heading_scale_preset, overlay_intensity, panel_preset, animation_preset, reduced_motion_mode, project_rail_mode, journal_card_mode, accent_preset, panel_opacity_pct, border_intensity_pct, radius_scale_pct, created_at, created_by) VALUES (2, 'default', 2, 'minimal-orbit','solid-night','spacious','system','display',80,'opaque-night','off','always-reduced','free-scroll','rail','violet',85,40,110,?, 'seed')"
    )
    .bind(now)
    .run();
  await db.prepare("UPDATE theme_settings SET published_revision_id = 2 WHERE id = 'default'").run();
  // A draft revision that must never leak into the public projection.
  await db
    .prepare(
      "INSERT INTO theme_settings_revisions (id, theme_settings_id, revision_number, hero_background_preset, card_style_preset, layout_density_preset, typography_preset, heading_scale_preset, overlay_intensity, panel_preset, animation_preset, reduced_motion_mode, project_rail_mode, journal_card_mode, accent_preset, panel_opacity_pct, border_intensity_pct, radius_scale_pct, created_at, created_by) VALUES (3, 'default', 3, 'cinematic-v3','soft-glass','comfortable','cinematic','standard',68,'soft-glass','calm','respect-system','snap','stack','cobalt',74,25,100,?, 'seed')"
    )
    .bind(now)
    .run();
  await db.prepare("UPDATE theme_settings SET draft_revision_id = 3 WHERE id = 'default'").run();

  await seedSection(db, "home", 101, { order: 1, visible: true });
  await seedSection(db, "projects", 102, { order: 2, visible: false });
  await seedSection(db, "process", 103, { order: 3, visible: true });
  // "about" has only a draft (never published) — must not appear as published.
  await seedSection(db, "about", 104, { order: 4, visible: true, published: false });
}

// --- isPublicDesignApiPath unit matching ---

test("isPublicDesignApiPath matches exactly /api/design and nothing else", () => {
  assert.equal(isPublicDesignApiPath("/api/design"), true);
  assert.equal(isPublicDesignApiPath("/api/design/"), false);
  assert.equal(isPublicDesignApiPath("/api/design/x"), false);
  assert.equal(isPublicDesignApiPath("/api/designs"), false);
  assert.equal(isPublicDesignApiPath("/admin/api/design"), false);
});

// --- routing separation (classified before Access auth) ---

test("GET /api/design is served with no Access token at all", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await callWorker(publicRequest("/api/design"), { db, jwks: undefined });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

test("GET /api/design is served even when getJWKS/admin dispatch are wired to throw if called at all", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await handleRequest(publicRequest("/api/design"), {
      assets: fakeAssets(),
      teamDomain: TEAM_DOMAIN,
      audience: AUDIENCE,
      getJWKS: () => {
        throw new Error("getJWKS must never be called for a public design request");
      },
      dispatch: () => {
        throw new Error("admin dispatch must never be called for a public design request");
      },
      publicDispatch: ({ request, url }) => handlePublicDesignDispatch({ request, url, db }),
    });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});

test("/admin/api/design still requires Access (401 with no token), unaffected by the new public branch", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await callWorker(publicRequest("/admin/api/design"), { db, jwks: undefined });
    assert.equal(response.status, 401);
  } finally {
    await cleanup();
  }
});

test("a valid Access token grants no special treatment on the public design path — same response either way", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const withToken = await callWorker(publicRequest("/api/design", { token }), { db, jwks });
    const withoutToken = await callWorker(publicRequest("/api/design"), { db, jwks: undefined });
    assert.equal(withToken.status, 200);
    assert.equal(withoutToken.status, 200);
    assert.deepEqual(await withToken.json(), await withoutToken.json());
  } finally {
    await cleanup();
  }
});

// --- published-only, positive allowlist ---

test("GET /api/design returns exactly the published theme values and published section visibility/order", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedFixture(db);
    const response = await callWorker(publicRequest("/api/design"), { db, jwks: undefined });
    assert.equal(response.status, 200);
    const body = await response.json();

    assert.deepEqual(body.theme, {
      heroBackgroundPreset: "minimal-orbit",
      cardStylePreset: "solid-night",
      layoutDensityPreset: "spacious",
      typographyPreset: "system",
      headingScalePreset: "display",
      overlayIntensity: 80,
      panelPreset: "opaque-night",
      animationPreset: "off",
      reducedMotionMode: "always-reduced",
      projectRailMode: "free-scroll",
      journalCardMode: "rail",
      accentPreset: "violet",
      panelOpacityPct: 85,
      borderIntensityPct: 40,
      radiusScalePct: 110,
    });

    assert.deepEqual(body.sections, {
      home: { order: 1, visible: true },
      projects: { order: 2, visible: false },
      process: { order: 3, visible: true },
      about: null, // never published — draft-only, must not leak (see below)
    });
  } finally {
    await cleanup();
  }
});

test("GET /api/design never exposes the draft theme revision or the draft-only section's content", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedFixture(db);
    const response = await callWorker(publicRequest("/api/design"), { db, jwks: undefined });
    const rawText = await response.text();
    // Revision 3 (the draft) has the bootstrap default values — assert its
    // distinguishing published_at-free created_by marker never appears, and
    // that no draft-only pointer field exists anywhere in the response.
    assert.ok(!rawText.includes("draftRevisionId"));
    assert.ok(!rawText.includes("draft_revision_id"));
    assert.ok(!rawText.includes("createdBy"));
    assert.ok(!rawText.includes("created_by"));
  } finally {
    await cleanup();
  }
});

test("GET /api/design uses a positive allowlist — no id, created_at/by, audit, or storage/config identifier is ever present", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedFixture(db);
    const response = await callWorker(publicRequest("/api/design"), { db, jwks: undefined });
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["theme", "sections"].sort());
    assert.deepEqual(Object.keys(body.theme).sort(), [
      "heroBackgroundPreset",
      "cardStylePreset",
      "layoutDensityPreset",
      "typographyPreset",
      "headingScalePreset",
      "overlayIntensity",
      "panelPreset",
      "animationPreset",
      "reducedMotionMode",
      "projectRailMode",
      "journalCardMode",
      "accentPreset",
      "panelOpacityPct",
      "borderIntensityPct",
      "radiusScalePct",
    ].sort());
    for (const id of ["home", "projects", "process"]) {
      assert.deepEqual(Object.keys(body.sections[id]).sort(), ["order", "visible"].sort());
    }
  } finally {
    await cleanup();
  }
});

test("GET /api/design returns theme: null when no valid published theme exists (fail-safe shape, not an error)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await db.prepare("UPDATE theme_settings SET published_revision_id = NULL WHERE id = 'default'").run();
    const response = await callWorker(publicRequest("/api/design"), { db, jwks: undefined });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.theme, null);
  } finally {
    await cleanup();
  }
});

test("GET /api/design returns null for every unpublished/nonexistent managed section, without erroring", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const response = await callWorker(publicRequest("/api/design"), { db, jwks: undefined });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.sections, { home: null, projects: null, process: null, about: null });
  } finally {
    await cleanup();
  }
});

// --- fail-closed: method/route classification before D1 ---

test("POST/PUT/DELETE on /api/design are rejected (405) with zero D1 access", async () => {
  const spy = dbSpy();
  for (const method of ["POST", "PUT", "DELETE"]) {
    const response = await callWorker(publicRequest("/api/design", { method }), { db: spy, jwks: undefined });
    assert.equal(response.status, 405, method);
  }
  assert.equal(spy.calls.length, 0);
});

test("missing DB binding returns 503 for /api/design, not a crash", async () => {
  const response = await callWorker(publicRequest("/api/design"), { db: undefined, jwks: undefined });
  assert.equal(response.status, 503);
});

test("/api/design/anything is not classified as the public design path and never reaches the design dispatcher (no wildcard authorized)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    assert.equal(isPublicDesignApiPath("/api/design/anything"), false);
    // Falls through to ordinary asset serving (not protected, not public
    // design) since it is neither /admin* nor the exact /api/design path.
    const response = await callWorker(publicRequest("/api/design/anything"), { db, jwks: undefined });
    assert.equal(response.status, 200); // fakeAssets() default "public shell" response
    const text = await response.text();
    assert.equal(text, "public shell");
  } finally {
    await cleanup();
  }
});
