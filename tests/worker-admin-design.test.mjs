// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032, screenshot-
// reference addendum ML-DEVOS-AS-031 / D-033) bounded theme/section design
// mutation capability tests. Every D1 database used here is a local
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
import { handleRequest, ACCESS_ASSERTION_HEADER } from "../worker/auth.mjs";
import { handleAdminDispatch, buildDashboardPayload, DASHBOARD_PATH } from "../worker/admin/dashboard.mjs";
import { applyCompleteSchema, COMPLETE_PRODUCT_TABLE_NAMES } from "../worker/d1/schema.mjs";

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
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-007-d1-test-"));
  const proxy = await getPlatformProxy({
    configPath: WRANGLER_CONFIG_PATH,
    persist: { path: statePath },
    remoteBindings: false,
  });
  await applyCompleteSchema(proxy.env.DB);
  return {
    db: proxy.env.DB,
    async cleanup() {
      await proxy.dispose();
      fs.rmSync(statePath, { recursive: true, force: true });
    },
  };
}

// Seeds one managed section with an initial published revision — the
// `sections`/`section_revisions` tables exist from migration 0001 but are
// only populated by WEB-INC-005's separate JS content-migration bootstrap
// (worker/d1/migrate.mjs's SECTION_BOOTSTRAP), not by any SQL migration
// file, so tests that exercise the new section design routes seed directly.
async function seedSection(db, id, { order = 1, visible = true } = {}) {
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO sections (id, created_at) VALUES (?, ?)").bind(id, now).run();
  await db
    .prepare("INSERT INTO section_revisions (id, section_id, revision_number, sort_order, visible, created_at, created_by) VALUES (?, ?, 1, ?, ?, ?, ?)")
    .bind(id === "home" ? 101 : id === "projects" ? 102 : id === "process" ? 103 : 104, id, order, visible ? 1 : 0, now, "seed")
    .run();
  await db
    .prepare("UPDATE sections SET published_revision_id = (SELECT id FROM section_revisions WHERE section_id = ? AND revision_number = 1) WHERE id = ?")
    .bind(id, id)
    .run();
}

async function seedAllSections(db) {
  await seedSection(db, "home", { order: 1, visible: true });
  await seedSection(db, "projects", { order: 2, visible: true });
  await seedSection(db, "process", { order: 3, visible: true });
  await seedSection(db, "about", { order: 4, visible: true });
}

function interleavingDb(realDb, { table, selectPrefix, staleRow }) {
  let readCallCount = 0;
  return {
    prepare(sql) {
      if (sql.startsWith(selectPrefix)) {
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

function validThemePayload(overrides = {}) {
  return {
    heroBackgroundPreset: "deep-night",
    cardStylePreset: "quiet-border",
    layoutDensityPreset: "spacious",
    typographyPreset: "editorial",
    headingScalePreset: "display",
    overlayIntensity: 50,
    panelPreset: "clear-glass",
    animationPreset: "minimal",
    reducedMotionMode: "always-reduced",
    projectRailMode: "free-scroll",
    journalCardMode: "rail",
    accentPreset: "teal",
    panelOpacityPct: 60,
    borderIntensityPct: 15,
    radiusScalePct: 90,
    ...overrides,
  };
}

async function auditRows(db, action) {
  const result = await db.prepare("SELECT * FROM audit_log WHERE action = ? ORDER BY id").bind(action).all();
  return result.results;
}

// --- migration/table inventory evidence ---

test("applying the complete schema creates exactly 22 product tables, including theme_settings/theme_settings_revisions", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const tableRows = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    const tables = tableRows.results
      .map(row => row.name)
      .filter(name => !name.startsWith("_cf_") && !name.startsWith("sqlite_") && name !== "d1_migrations");
    assert.equal(tables.length, 22);
    assert.deepEqual(tables, [...COMPLETE_PRODUCT_TABLE_NAMES].sort());
  } finally {
    await cleanup();
  }
});

// --- bootstrap parity with current V3 + soft geometry baseline ---

test("migration 0005 bootstraps theme_settings with one published revision matching the V3 + UI-PATCH-001 baseline", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const settings = await db.prepare("SELECT * FROM theme_settings WHERE id = 'default'").first();
    assert.equal(settings.published_revision_id, 1);
    assert.equal(settings.draft_revision_id, null);

    const revision = await db.prepare("SELECT * FROM theme_settings_revisions WHERE id = 1").first();
    assert.equal(revision.hero_background_preset, "cinematic-v3");
    assert.equal(revision.card_style_preset, "soft-glass");
    assert.equal(revision.layout_density_preset, "comfortable");
    assert.equal(revision.typography_preset, "cinematic");
    assert.equal(revision.heading_scale_preset, "standard");
    assert.equal(revision.overlay_intensity, 68);
    assert.equal(revision.panel_preset, "soft-glass");
    assert.equal(revision.animation_preset, "calm");
    assert.equal(revision.reduced_motion_mode, "respect-system");
    assert.equal(revision.project_rail_mode, "snap");
    assert.equal(revision.journal_card_mode, "stack");
    assert.equal(revision.accent_preset, "cobalt");
    assert.equal(revision.panel_opacity_pct, 74);
    assert.equal(revision.border_intensity_pct, 25);
    assert.equal(revision.radius_scale_pct, 100);
    assert.equal(revision.created_by, "migration:web-inc-007");
  } finally {
    await cleanup();
  }
});

test("applying the complete schema a second time is idempotent and does not duplicate the bootstrap revision", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await applyCompleteSchema(db);
    const count = await db.prepare("SELECT COUNT(*) AS n FROM theme_settings_revisions").first();
    assert.equal(count.n, 1);
  } finally {
    await cleanup();
  }
});

// --- pointer ownership / revision immutability (direct DB) ---

test("a theme_settings pointer cannot reference a nonexistent/foreign revision", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await assert.rejects(() => db.prepare("UPDATE theme_settings SET draft_revision_id = 999 WHERE id = 'default'").run());
  } finally {
    await cleanup();
  }
});

test("a second theme_settings row is rejected by the singleton CHECK constraint", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await assert.rejects(() => db.prepare("INSERT INTO theme_settings (id, created_at) VALUES ('other', ?)").bind(new Date().toISOString()).run());
  } finally {
    await cleanup();
  }
});

test("theme_settings_revisions rows are immutable (any UPDATE, including a true no-op, is rejected) and non-deletable", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await assert.rejects(() => db.prepare("UPDATE theme_settings_revisions SET hero_background_preset = 'cinematic-v3' WHERE id = 1").run());
    await assert.rejects(() => db.prepare("UPDATE theme_settings_revisions SET overlay_intensity = 70 WHERE id = 1").run());
    await assert.rejects(() => db.prepare("DELETE FROM theme_settings_revisions WHERE id = 1").run());
  } finally {
    await cleanup();
  }
});

// --- auth-before-admin-D1 (zero D1 before Access verification) ---

test("unauthenticated requests to every /admin/api/design route are rejected with zero D1 invocation", async () => {
  const spy = dbSpy();
  const routes = [
    ["GET", "/admin/api/design"],
    ["GET", "/admin/api/design/preview"],
    ["PUT", "/admin/api/design/theme/draft"],
    ["POST", "/admin/api/design/theme/publish"],
    ["PUT", "/admin/api/design/sections/home/draft"],
    ["POST", "/admin/api/design/sections/home/publish"],
  ];
  for (const [method, pathname] of routes) {
    const request = method === "GET" ? readRequest(pathname) : mutationRequest(pathname, { method, body: {} });
    const { response } = await callAdmin(request, { db: spy, jwks: undefined });
    assert.equal(response.status, 401, `${method} ${pathname}`);
  }
  assert.equal(spy.calls.length, 0);
});

test("a valid token with no bounded subject (sub missing) is rejected (403) with zero D1 invocation for every mutating design route", async () => {
  const spy = dbSpy();
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey, { sub: null });
  const routes = [
    ["PUT", "/admin/api/design/theme/draft"],
    ["POST", "/admin/api/design/theme/publish"],
    ["PUT", "/admin/api/design/sections/home/draft"],
    ["POST", "/admin/api/design/sections/home/publish"],
  ];
  for (const [method, pathname] of routes) {
    const { response } = await callAdmin(mutationRequest(pathname, { method, token, body: {} }), { db: spy, jwks });
    assert.equal(response.status, 403, `${method} ${pathname}`);
  }
  assert.equal(spy.calls.length, 0);
});

test("GET /admin/api/design and /admin/api/design/preview still work (read-only, no bounded subject required) with a valid token", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey, { sub: null });
    const { response: statusResponse } = await callAdmin(readRequest("/admin/api/design", { token }), { db, jwks });
    assert.equal(statusResponse.status, 200);
    const { response: previewResponse } = await callAdmin(readRequest("/admin/api/design/preview", { token }), { db, jwks });
    assert.equal(previewResponse.status, 200);
  } finally {
    await cleanup();
  }
});

// --- request hardening (Origin / Content-Type / body size / malformed JSON) ---

test("theme draft mutation is rejected for cross-origin, non-JSON, oversized, and malformed-JSON requests", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);

    const crossOrigin = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", { method: "PUT", token, origin: "https://evil.example", body: {} }),
      { db, jwks }
    );
    assert.equal(crossOrigin.response.status, 403);

    const wrongType = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", { method: "PUT", token, contentType: "text/plain", body: "{}" }),
      { db, jwks }
    );
    assert.equal(wrongType.response.status, 415);

    const oversized = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", { method: "PUT", token, body: "x".repeat(9 * 1024) }),
      { db, jwks }
    );
    assert.equal(oversized.response.status, 413);

    const malformed = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", { method: "PUT", token, body: "{not json" }),
      { db, jwks }
    );
    assert.equal(malformed.response.status, 400);
  } finally {
    await cleanup();
  }
});

// --- theme edit-draft / publish lifecycle, isolation, stale-write ---

test("PUT theme/draft creates a new immutable revision, moves only draft_revision_id, and leaves published untouched", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.publishedRevisionId, 1);
    assert.equal(body.state, "published_with_draft");
    assert.ok(body.draftRevisionId > 1);

    const published = await db.prepare("SELECT hero_background_preset FROM theme_settings_revisions WHERE id = 1").first();
    assert.equal(published.hero_background_preset, "cinematic-v3");
  } finally {
    await cleanup();
  }
});

test("theme draft is not visible through GET /admin/api/design's published projection, only through draft/preview", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );

    const { response } = await callAdmin(readRequest("/admin/api/design", { token }), { db, jwks });
    const body = await response.json();
    assert.equal(body.theme.published.heroBackgroundPreset, "cinematic-v3");
    assert.equal(body.theme.draft.heroBackgroundPreset, "deep-night");
  } finally {
    await cleanup();
  }
});

test("POST theme/publish moves published_revision_id to the draft, clears draft_revision_id, and never deletes the prior revision", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const draftResult = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    const draftBody = await draftResult.response.json();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/theme/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: 1, expectedDraftRevisionId: draftBody.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.publishedRevisionId, draftBody.draftRevisionId);
    assert.equal(body.draftRevisionId, null);

    const priorRevision = await db.prepare("SELECT hero_background_preset FROM theme_settings_revisions WHERE id = 1").first();
    assert.equal(priorRevision.hero_background_preset, "cinematic-v3");
  } finally {
    await cleanup();
  }
});

test("PUT theme/draft with stale expected pointers is rejected (409) and mutates nothing", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const before = await db.prepare("SELECT COUNT(*) AS n FROM theme_settings_revisions").first();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 999, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 409);
    const after = await db.prepare("SELECT COUNT(*) AS n FROM theme_settings_revisions").first();
    assert.equal(after.n, before.n);
  } finally {
    await cleanup();
  }
});

test("POST theme/publish is rejected (409) when there is no draft to publish", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/theme/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 409);
  } finally {
    await cleanup();
  }
});

test("PUT theme/draft with an interleaved competing change is rejected (409), not silently overwritten (commit-time guard)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const stale = interleavingDb(db, {
      selectPrefix: "SELECT id, published_revision_id, draft_revision_id FROM theme_settings",
      staleRow: { id: "default", published_revision_id: 1, draft_revision_id: null },
    });
    // Simulate a real competing draft committed between the handler's
    // pre-read and its batch.
    await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload({ accentPreset: "violet" }), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db: stale, jwks }
    );
    assert.equal(response.status, 409);
  } finally {
    await cleanup();
  }
});

// --- theme enum/range boundary + injection rejection ---

const THEME_ENUM_FIELDS = {
  heroBackgroundPreset: ["cinematic-v3", "deep-night", "minimal-orbit"],
  cardStylePreset: ["soft-glass", "quiet-border", "solid-night"],
  layoutDensityPreset: ["compact", "comfortable", "spacious"],
  typographyPreset: ["cinematic", "editorial", "system"],
  headingScalePreset: ["compact", "standard", "display"],
  panelPreset: ["soft-glass", "clear-glass", "opaque-night"],
  animationPreset: ["calm", "minimal", "off"],
  reducedMotionMode: ["respect-system", "always-reduced"],
  projectRailMode: ["snap", "free-scroll"],
  journalCardMode: ["stack", "rail"],
  accentPreset: ["cobalt", "teal", "violet"],
};

for (const [field, values] of Object.entries(THEME_ENUM_FIELDS)) {
  test(`theme draft accepts every allowed ${field} value and rejects an unknown one`, async () => {
    const { db, cleanup } = await openTestDb();
    try {
      const { privateKey, jwks } = await buildTestIdentity();
      const token = await signToken(privateKey);
      for (const value of values) {
        const { response } = await callAdmin(
          mutationRequest("/admin/api/design/theme/draft", {
            method: "PUT",
            token,
            body: { ...validThemePayload({ [field]: value }), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
          }),
          { db, jwks }
        );
        assert.equal(response.status, 200, `${field}=${value}`);
        // clear the draft between iterations so expectedDraftRevisionId:null keeps holding
        const row = await db.prepare("SELECT draft_revision_id FROM theme_settings WHERE id = 'default'").first();
        await db.prepare("UPDATE theme_settings SET draft_revision_id = NULL WHERE id = 'default'").run();
        void row;
      }

      const { response: rejected } = await callAdmin(
        mutationRequest("/admin/api/design/theme/draft", {
          method: "PUT",
          token,
          body: { ...validThemePayload({ [field]: "not-a-real-preset" }), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
        }),
        { db, jwks }
      );
      assert.equal(rejected.status, 400);
    } finally {
      await cleanup();
    }
  });
}

const THEME_RANGE_FIELDS = {
  overlayIntensity: { min: 40, max: 85 },
  panelOpacityPct: { min: 55, max: 90 },
  borderIntensityPct: { min: 10, max: 45 },
  radiusScalePct: { min: 80, max: 120 },
};

for (const [field, { min, max }] of Object.entries(THEME_RANGE_FIELDS)) {
  test(`theme draft accepts exactly the ${field} boundary values and rejects one step outside either side`, async () => {
    const { db, cleanup } = await openTestDb();
    try {
      const { privateKey, jwks } = await buildTestIdentity();
      const token = await signToken(privateKey);

      for (const value of [min, max]) {
        const { response } = await callAdmin(
          mutationRequest("/admin/api/design/theme/draft", {
            method: "PUT",
            token,
            body: { ...validThemePayload({ [field]: value }), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
          }),
          { db, jwks }
        );
        assert.equal(response.status, 200, `${field}=${value}`);
        await db.prepare("UPDATE theme_settings SET draft_revision_id = NULL WHERE id = 'default'").run();
      }

      for (const value of [min - 1, max + 1]) {
        const { response } = await callAdmin(
          mutationRequest("/admin/api/design/theme/draft", {
            method: "PUT",
            token,
            body: { ...validThemePayload({ [field]: value }), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
          }),
          { db, jwks }
        );
        assert.equal(response.status, 400, `${field}=${value}`);
      }
    } finally {
      await cleanup();
    }
  });
}

test("theme draft rejects an unknown field", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), customCss: "body{}", expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 400);
  } finally {
    await cleanup();
  }
});

test("theme draft rejects raw CSS/JS/HTML/URL/arbitrary-color/arbitrary-token injection attempts", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const attempts = [
      { heroBackgroundPreset: "https://evil.example/bg.png" },
      { heroBackgroundPreset: "data:image/png;base64,AAAA" },
      { cardStylePreset: "<script>alert(1)</script>" },
      { accentPreset: "#ff0000" },
      { accentPreset: "rgb(255,0,0)" },
      { typographyPreset: "url(https://evil.example/font.woff2)" },
      { panelPreset: "background: url(javascript:alert(1))" },
      { overlayIntensity: "68px" },
      { radiusScalePct: "100; DROP TABLE theme_settings_revisions;" },
    ];
    for (const attempt of attempts) {
      const { response } = await callAdmin(
        mutationRequest("/admin/api/design/theme/draft", {
          method: "PUT",
          token,
          body: { ...validThemePayload(), ...attempt, expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
        }),
        { db, jwks }
      );
      assert.equal(response.status, 400, JSON.stringify(attempt));
    }
    const count = await db.prepare("SELECT COUNT(*) AS n FROM theme_settings_revisions").first();
    assert.equal(count.n, 1);
  } finally {
    await cleanup();
  }
});

// --- section design lifecycle, isolation, stale-write, boundary ---

test("PUT sections/:id/draft creates a new immutable revision and moves only that section's draft pointer", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/sections/home/draft", {
        method: "PUT",
        token,
        body: { order: 3, visible: false, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.publishedRevisionId, 101);
    assert.ok(body.draftRevisionId > 101);

    const published = await db.prepare("SELECT sort_order, visible FROM section_revisions WHERE id = 101").first();
    assert.equal(published.sort_order, 1);
    assert.equal(published.visible, 1);

    const otherSection = await db.prepare("SELECT draft_revision_id FROM sections WHERE id = 'projects'").first();
    assert.equal(otherSection.draft_revision_id, null);
  } finally {
    await cleanup();
  }
});

test("POST sections/:id/publish moves the pointer, clears draft, and preserves the prior published revision", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const draftResult = await callAdmin(
      mutationRequest("/admin/api/design/sections/home/draft", {
        method: "PUT",
        token,
        body: { order: 3, visible: false, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    const draftBody = await draftResult.response.json();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/sections/home/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: 101, expectedDraftRevisionId: draftBody.draftRevisionId },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.publishedRevisionId, draftBody.draftRevisionId);
    assert.equal(body.draftRevisionId, null);

    const prior = await db.prepare("SELECT sort_order FROM section_revisions WHERE id = 101").first();
    assert.equal(prior.sort_order, 1);
  } finally {
    await cleanup();
  }
});

test("section draft edit/publish is rejected for an unknown section id (404) and for a non-managed id (404)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);

    const unmanaged = await callAdmin(
      mutationRequest("/admin/api/design/sections/footer/draft", {
        method: "PUT",
        token,
        body: { order: 1, visible: true, expectedPublishedRevisionId: null, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(unmanaged.response.status, 404);
  } finally {
    await cleanup();
  }
});

test("section order accepts exactly the 0..20 boundary and rejects one step outside either side", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);

    for (const order of [0, 20]) {
      const { response } = await callAdmin(
        mutationRequest("/admin/api/design/sections/home/draft", {
          method: "PUT",
          token,
          body: { order, visible: true, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
        }),
        { db, jwks }
      );
      assert.equal(response.status, 200, `order=${order}`);
      await db.prepare("UPDATE sections SET draft_revision_id = NULL WHERE id = 'home'").run();
    }

    for (const order of [-1, 21]) {
      const { response } = await callAdmin(
        mutationRequest("/admin/api/design/sections/home/draft", {
          method: "PUT",
          token,
          body: { order, visible: true, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
        }),
        { db, jwks }
      );
      assert.equal(response.status, 400, `order=${order}`);
    }
  } finally {
    await cleanup();
  }
});

test("section draft with stale expected pointers is rejected (409) and mutates nothing", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const before = await db.prepare("SELECT COUNT(*) AS n FROM section_revisions WHERE section_id = 'home'").first();

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/sections/home/draft", {
        method: "PUT",
        token,
        body: { order: 5, visible: true, expectedPublishedRevisionId: 999, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    assert.equal(response.status, 409);
    const after = await db.prepare("SELECT COUNT(*) AS n FROM section_revisions WHERE section_id = 'home'").first();
    assert.equal(after.n, before.n);
  } finally {
    await cleanup();
  }
});

test("section draft with an interleaved competing change is rejected (409), not silently overwritten", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const stale = interleavingDb(db, {
      selectPrefix: "SELECT id, published_revision_id, draft_revision_id FROM sections",
      staleRow: { id: "home", published_revision_id: 101, draft_revision_id: null },
    });

    await callAdmin(
      mutationRequest("/admin/api/design/sections/home/draft", {
        method: "PUT",
        token,
        body: { order: 2, visible: false, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );

    const { response } = await callAdmin(
      mutationRequest("/admin/api/design/sections/home/draft", {
        method: "PUT",
        token,
        body: { order: 6, visible: true, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
      }),
      { db: stale, jwks }
    );
    assert.equal(response.status, 409);
  } finally {
    await cleanup();
  }
});

// --- preview (authenticated, draft-if-present-else-published) ---

test("GET /admin/api/design/preview reflects the current draft when present, else the published state, for both theme and sections", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);

    const before = await callAdmin(readRequest("/admin/api/design/preview", { token }), { db, jwks });
    const beforeBody = await before.response.json();
    assert.equal(beforeBody.theme.heroBackgroundPreset, "cinematic-v3");
    assert.equal(beforeBody.sections.home.visible, true);

    await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    await callAdmin(
      mutationRequest("/admin/api/design/sections/home/draft", {
        method: "PUT",
        token,
        body: { order: 3, visible: false, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );

    const after = await callAdmin(readRequest("/admin/api/design/preview", { token }), { db, jwks });
    const afterBody = await after.response.json();
    assert.equal(afterBody.theme.heroBackgroundPreset, "deep-night");
    assert.equal(afterBody.sections.home.visible, false);
    assert.equal(afterBody.sections.home.order, 3);
    // Sections with no draft still resolve to their published state.
    assert.equal(afterBody.sections.projects.visible, true);
  } finally {
    await cleanup();
  }
});

// --- route/method fail-closed ---

test("unsupported methods on /admin/api/design and /admin/api/design/preview are rejected (405) with zero D1 access", async () => {
  const spy = dbSpy();
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const statusResult = await callAdmin(mutationRequest("/admin/api/design", { method: "POST", token, body: {} }), { db: spy, jwks });
  assert.equal(statusResult.response.status, 405);
  const previewResult = await callAdmin(mutationRequest("/admin/api/design/preview", { method: "POST", token, body: {} }), { db: spy, jwks });
  assert.equal(previewResult.response.status, 405);
  assert.equal(spy.calls.length, 0);
});

test("an unrecognized /admin/api/design/* sub-path returns 404 with zero D1 access", async () => {
  const spy = dbSpy();
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const { response } = await callAdmin(readRequest("/admin/api/design/not-a-real-route", { token }), { db: spy, jwks });
  assert.equal(response.status, 404);
  assert.equal(spy.calls.length, 0);
});

test("no delete route exists for theme or sections", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const themeDelete = await callAdmin(mutationRequest("/admin/api/design/theme", { method: "DELETE", token, body: {} }), { db, jwks });
    assert.equal(themeDelete.response.status, 404);
    const sectionDelete = await callAdmin(mutationRequest("/admin/api/design/sections/home", { method: "DELETE", token, body: {} }), { db, jwks });
    assert.equal(sectionDelete.response.status, 404);
  } finally {
    await cleanup();
  }
});

test("missing DB binding returns 503 for /admin/api/design routes, not a crash", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const { response } = await callAdmin(readRequest("/admin/api/design", { token }), { db: undefined, jwks });
  assert.equal(response.status, 503);
});

// --- audit success/failure evidence ---

test("theme_edit_draft and theme_publish append exactly one success audit row each, atomic with the mutation", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const draftResult = await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    const draftBody = await draftResult.response.json();
    await callAdmin(
      mutationRequest("/admin/api/design/theme/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: 1, expectedDraftRevisionId: draftBody.draftRevisionId },
      }),
      { db, jwks }
    );

    const editRows = await auditRows(db, "theme_edit_draft");
    assert.equal(editRows.length, 1);
    assert.equal(editRows[0].result, "success");
    assert.equal(editRows[0].entity_type, "theme_settings");

    const publishRows = await auditRows(db, "theme_publish");
    assert.equal(publishRows.length, 1);
    assert.equal(publishRows[0].result, "success");
    assert.equal(publishRows[0].revision_id, draftBody.draftRevisionId);
  } finally {
    await cleanup();
  }
});

test("a rejected (409) theme draft attempt records a bounded failure audit row", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 999, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    const rows = await auditRows(db, "theme_edit_draft");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].result, "failure");
    assert.equal(rows[0].entity_id, "default");
  } finally {
    await cleanup();
  }
});

test("section_design_edit_draft and section_design_publish append exactly one success audit row each", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedAllSections(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const draftResult = await callAdmin(
      mutationRequest("/admin/api/design/sections/home/draft", {
        method: "PUT",
        token,
        body: { order: 2, visible: false, expectedPublishedRevisionId: 101, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );
    const draftBody = await draftResult.response.json();
    await callAdmin(
      mutationRequest("/admin/api/design/sections/home/publish", {
        method: "POST",
        token,
        body: { expectedPublishedRevisionId: 101, expectedDraftRevisionId: draftBody.draftRevisionId },
      }),
      { db, jwks }
    );

    const editRows = await auditRows(db, "section_design_edit_draft");
    assert.equal(editRows.length, 1);
    assert.equal(editRows[0].result, "success");
    assert.equal(editRows[0].entity_type, "section");
    assert.equal(editRows[0].entity_id, "home");

    const publishRows = await auditRows(db, "section_design_publish");
    assert.equal(publishRows.length, 1);
    assert.equal(publishRows[0].result, "success");
  } finally {
    await cleanup();
  }
});

// --- header hardening ---

test("every /admin/api/design response carries Cache-Control: no-store", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callAdmin(readRequest("/admin/api/design", { token }), { db, jwks });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  } finally {
    await cleanup();
  }
});

// --- dashboard integration (bounded, no preset values leaked) ---

test("GET /admin/api/dashboard exposes bounded theme lifecycle status only, never a preset/numeric DESIGN-* value", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    await callAdmin(
      mutationRequest("/admin/api/design/theme/draft", {
        method: "PUT",
        token,
        body: { ...validThemePayload(), expectedPublishedRevisionId: 1, expectedDraftRevisionId: null },
      }),
      { db, jwks }
    );

    const payload = await buildDashboardPayload(db);
    assert.deepEqual(Object.keys(payload.theme).sort(), ["id", "state", "publishedRevisionId", "draftRevisionId", "displayLabel"].sort());
    assert.equal(payload.theme.state, "published_with_draft");
    const rawText = JSON.stringify(payload.theme);
    assert.ok(!rawText.includes("deep-night"));
    assert.ok(!rawText.includes("quiet-border"));

    const { response } = await callAdmin(readRequest(DASHBOARD_PATH, { token }), { db, jwks });
    assert.equal(response.status, 200);
  } finally {
    await cleanup();
  }
});
