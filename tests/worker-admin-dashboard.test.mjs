// WEB-INC-002 (ML-DEVOS-RFC-004 / ML-DEVOS-AS-015 / D-025) protected
// read-only admin dashboard tests. Every D1 database used here is a local
// Wrangler/Miniflare simulation (`getPlatformProxy({ remoteBindings: false
// })`) persisted to a throwaway temp directory per test — no test in this
// file can reach a real Cloudflare resource (AS15-F012).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { handleRequest, ACCESS_ASSERTION_HEADER } from "../worker/auth.mjs";
import { handleAdminDispatch, buildDashboardPayload, DASHBOARD_PATH } from "../worker/admin/dashboard.mjs";
import { applySchema } from "../worker/d1/schema.mjs";

const WRANGLER_CONFIG_PATH = path.join(import.meta.dirname, "..", "wrangler.jsonc");

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

async function signToken(privateKey, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: "admin@example.com" })
    .setProtectedHeader({ alg: ALG, kid: KID })
    .setIssuedAt(overrides.iat ?? now)
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(overrides.audience ?? AUDIENCE)
    .setExpirationTime(overrides.exp ?? now + 3600)
    .sign(privateKey);
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

// Records every `prepare()` call; never actually reachable when the caller
// expects zero D1 invocation (used to prove exactly that).
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
  };
}

// A `db` whose every read rejects with a deliberately sensitive fake error,
// to prove that text never reaches the client (AS15-F007).
function throwingDb(message) {
  const reject = () => Promise.reject(new Error(message));
  return {
    prepare() {
      return { bind() { return this; }, all: reject, first: reject, run: reject };
    },
  };
}

async function openTestDb() {
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-002-d1-test-"));
  const proxy = await getPlatformProxy({
    configPath: WRANGLER_CONFIG_PATH,
    persist: { path: statePath },
    remoteBindings: false,
  });
  await applySchema(proxy.env.DB);
  return {
    db: proxy.env.DB,
    async cleanup() {
      await proxy.dispose();
      fs.rmSync(statePath, { recursive: true, force: true });
    },
  };
}

// Seeds a small, hand-built fixture covering all four lifecycle states
// (navigation), plus one row each for the remaining collections (including
// a project with the exact "sensitive" legacy fields — summary/stack/
// category — that must never leak into the dashboard projection), plus a
// published site_settings row with a distinctive email/provenance value to
// prove those never leak either.
async function seedDashboardFixture(db) {
  const createdAt = "2026-01-01";
  const provenance = "SECRET_PROVENANCE_SHOULD_NOT_LEAK";

  const statements = [
    // navigation: four entities, one per lifecycle state.
    db.prepare("INSERT INTO navigation (id, created_at) VALUES ('nav-published', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) VALUES ('nav-published', 1, 1, 'Published Label', '#home', ?, ?)"
      )
      .bind(createdAt, provenance),
    db.prepare(
      "UPDATE navigation SET published_revision_id = (SELECT id FROM navigation_revisions WHERE navigation_id = 'nav-published' AND revision_number = 1) WHERE id = 'nav-published'"
    ),

    db.prepare("INSERT INTO navigation (id, created_at) VALUES ('nav-draft', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) VALUES ('nav-draft', 1, 2, 'Draft Label', '#projects', ?, ?)"
      )
      .bind(createdAt, provenance),
    db.prepare(
      "UPDATE navigation SET draft_revision_id = (SELECT id FROM navigation_revisions WHERE navigation_id = 'nav-draft' AND revision_number = 1) WHERE id = 'nav-draft'"
    ),

    db.prepare("INSERT INTO navigation (id, created_at) VALUES ('nav-published-with-draft', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) VALUES ('nav-published-with-draft', 1, 3, 'Published Half', '#process', ?, ?)"
      )
      .bind(createdAt, provenance),
    db
      .prepare(
        "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) VALUES ('nav-published-with-draft', 2, 4, 'Draft Half', '#about', ?, ?)"
      )
      .bind(createdAt, provenance),
    db.prepare(
      "UPDATE navigation SET published_revision_id = (SELECT id FROM navigation_revisions WHERE navigation_id = 'nav-published-with-draft' AND revision_number = 1), draft_revision_id = (SELECT id FROM navigation_revisions WHERE navigation_id = 'nav-published-with-draft' AND revision_number = 2) WHERE id = 'nav-published-with-draft'"
    ),

    db.prepare("INSERT INTO navigation (id, created_at) VALUES ('nav-archived', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) VALUES ('nav-archived', 1, 5, 'Archived Label', '#home', ?, ?)"
      )
      .bind(createdAt, provenance),
    // both pointers left null: archived.

    // foundations: one published row.
    db.prepare("INSERT INTO foundations (id, created_at) VALUES ('foundation-a', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO foundation_revisions (foundation_id, revision_number, sort_order, icon, label, href, text, created_at, created_by) VALUES ('foundation-a', 1, 1, 'lab', 'Foundation Label', '#home', 'Foundation text', ?, ?)"
      )
      .bind(createdAt, provenance),
    db.prepare(
      "UPDATE foundations SET published_revision_id = (SELECT id FROM foundation_revisions WHERE foundation_id = 'foundation-a' AND revision_number = 1) WHERE id = 'foundation-a'"
    ),

    // projects: one published row carrying the exact legacy sensitive fields.
    db.prepare("INSERT INTO projects (id, slug, created_at) VALUES ('project-a', 'fixture-project', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO project_revisions (project_id, revision_number, sort_order, category, title, summary, stack_json, accent, icon, featured, created_at, created_by) VALUES ('project-a', 1, 1, 'SECRET_CATEGORY', 'Project Title', 'SECRET_SUMMARY_SHOULD_NOT_LEAK', ?, 'gold', 'lab', 1, ?, ?)"
      )
      .bind(JSON.stringify(["SECRET_STACK_ITEM"]), createdAt, provenance),
    db.prepare(
      "UPDATE projects SET published_revision_id = (SELECT id FROM project_revisions WHERE project_id = 'project-a' AND revision_number = 1) WHERE id = 'project-a'"
    ),

    // services: one published row.
    db.prepare("INSERT INTO services (id, created_at) VALUES ('service-a', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO service_revisions (service_id, revision_number, sort_order, title, summary, created_at, created_by) VALUES ('service-a', 1, 1, 'Service Title', 'SECRET_SERVICE_SUMMARY_SHOULD_NOT_LEAK', ?, ?)"
      )
      .bind(createdAt, provenance),
    db.prepare(
      "UPDATE services SET published_revision_id = (SELECT id FROM service_revisions WHERE service_id = 'service-a' AND revision_number = 1) WHERE id = 'service-a'"
    ),

    // process_steps: one published row.
    db.prepare("INSERT INTO process_steps (id, created_at) VALUES ('process-a', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO process_step_revisions (process_step_id, revision_number, sort_order, icon, title, text, created_at, created_by) VALUES ('process-a', 1, 1, 'lab', 'Process Title', 'Process text', ?, ?)"
      )
      .bind(createdAt, provenance),
    db.prepare(
      "UPDATE process_steps SET published_revision_id = (SELECT id FROM process_step_revisions WHERE process_step_id = 'process-a' AND revision_number = 1) WHERE id = 'process-a'"
    ),

    // sections: one published, visible row.
    db.prepare("INSERT INTO sections (id, created_at) VALUES ('home', ?)").bind(createdAt),
    db
      .prepare(
        "INSERT INTO section_revisions (section_id, revision_number, sort_order, visible, created_at, created_by) VALUES ('home', 1, 1, 1, ?, ?)"
      )
      .bind(createdAt, provenance),
    db.prepare(
      "UPDATE sections SET published_revision_id = (SELECT id FROM section_revisions WHERE section_id = 'home' AND revision_number = 1) WHERE id = 'home'"
    ),

    // site_settings: one published row with a distinctive email/provenance value.
    db.prepare("INSERT INTO site_settings (id, created_at) VALUES ('default', ?)").bind(createdAt),
    db
      .prepare(
        `INSERT INTO site_settings_revisions (
          site_settings_id, revision_number, schema_version, content_version, locale, updated_at,
          site_name, site_location, site_timezone, site_tagline,
          seo_title, seo_description, seo_canonical_url,
          hero_eyebrow, hero_title_json, hero_description, hero_primary_action_json, hero_secondary_action_json,
          hero_bridge_label, hero_bridge_statement,
          process_kicker, process_title,
          about_kicker, about_title_json, about_body, about_quote, about_quote_attribution,
          contact_header_label, contact_email, contact_call_to_action,
          project_section_kicker, project_section_title, project_section_description, project_section_empty_message,
          footer_statement, footer_copyright, created_at, created_by
        ) VALUES ('default', 1, '1.0.0', 'fixture-1.0.0', 'en-PH', ?,
          'Fixture Site', 'Nowhere', 'UTC+00', 'Tagline',
          'SEO Title', 'SECRET_SEO_DESCRIPTION_SHOULD_NOT_LEAK', 'https://example.com',
          'Eyebrow', ?, 'SECRET_HERO_DESCRIPTION_SHOULD_NOT_LEAK', ?, ?,
          'Bridge', 'Bridge statement',
          'Kicker', 'Title',
          'About kicker', ?, 'SECRET_ABOUT_BODY_SHOULD_NOT_LEAK', 'Quote', 'Attribution',
          'Header', 'secret-email-should-not-leak@example.com', 'Call to action',
          'Kicker', 'Title', 'Description', 'Empty',
          'Statement', 'Copyright', ?, ?)`
      )
      .bind(
        createdAt,
        JSON.stringify(["Line one", "Line two"]),
        JSON.stringify({ label: "Go", href: "#home" }),
        JSON.stringify({ label: "Contact", href: "mailto:hello@example.com" }),
        JSON.stringify(["Line one", "Line two"]),
        createdAt,
        provenance
      ),
    db.prepare(
      "UPDATE site_settings SET published_revision_id = (SELECT id FROM site_settings_revisions WHERE site_settings_id = 'default' AND revision_number = 1) WHERE id = 'default'"
    ),
  ];

  await db.batch(statements);
  return { provenance };
}

function protectedRequest(pathname, { method = "GET", token } = {}) {
  const headers = {};
  if (token) headers[ACCESS_ASSERTION_HEADER] = token;
  return new Request(`https://maisoglabs.example${pathname}`, { method, headers });
}

async function callDashboard(request, { db, jwks } = {}) {
  const spyAssets = fakeAssets();
  const response = await handleRequest(request, {
    assets: spyAssets,
    teamDomain: TEAM_DOMAIN,
    audience: AUDIENCE,
    getJWKS: () => jwks,
    dispatch: ({ request, url, assets }) => handleAdminDispatch({ request, url, assets, db }),
  });
  return { response, assets: spyAssets };
}

// --- AS15-F002 / AS15-F015 #4,#5: zero dashboard/DB invocation on invalid auth ---

test("unauthenticated GET /admin/api/dashboard is rejected with zero D1 invocation", async () => {
  const { jwks } = await buildTestIdentity();
  const spy = dbSpy();
  const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH), { db: spy, jwks });
  assert.equal(response.status, 401);
  assert.equal(spy.calls.length, 0);
});

test("malformed/expired/wrong-audience assertions against the dashboard endpoint cause zero D1 invocation", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const now = Math.floor(Date.now() / 1000);
  const expiredToken = await signToken(privateKey, { iat: now - 7200, exp: now - 3600 });
  const wrongAudienceToken = await signToken(privateKey, { audience: "wrong-audience" });

  for (const token of ["garbage", expiredToken, wrongAudienceToken]) {
    const spy = dbSpy();
    const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), { db: spy, jwks });
    assert.equal(response.status, 401);
    assert.equal(spy.calls.length, 0);
  }
});

test("invalid auth configuration causes zero D1 invocation even with a validly signed token", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const spyAssets = fakeAssets();
  const response = await handleRequest(protectedRequest(DASHBOARD_PATH, { token }), {
    assets: spyAssets,
    teamDomain: undefined,
    audience: AUDIENCE,
    getJWKS: () => jwks,
    dispatch: ({ request, url, assets }) => handleAdminDispatch({ request, url, assets, db: spy }),
  });
  assert.equal(response.status, 401);
  assert.equal(spy.calls.length, 0);
});

// --- AS15-F015 #6,#7: authenticated GET reads seeded local D1 ---

test("authenticated GET /admin/api/dashboard reads seeded local D1 and returns the bounded projection", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), { db, jwks });

    assert.equal(response.status, 200);
    const body = await response.json();

    assert.deepEqual(Object.keys(body).sort(), [
      "foundations",
      "navigation",
      "processSteps",
      "projects",
      "services",
      "sections",
      "siteSettings",
    ].sort());

    assert.deepEqual(body.siteSettings, {
      id: "default",
      state: "published",
      publishedRevisionId: body.siteSettings.publishedRevisionId,
      draftRevisionId: null,
      displayLabel: "Fixture Site",
    });
    assert.ok(Number.isInteger(body.siteSettings.publishedRevisionId));
  } finally {
    await cleanup();
  }
});

// --- AS15-F010 / AS15-F015 #7: lifecycle fixture coverage for all four states ---

test("dashboard derives all four lifecycle states correctly from navigation fixtures", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const payload = await buildDashboardPayload(db);
    const byId = Object.fromEntries(payload.navigation.map(item => [item.id, item]));

    assert.equal(byId["nav-published"].state, "published");
    assert.equal(byId["nav-published"].displayLabel, "Published Label");
    assert.ok(byId["nav-published"].publishedRevisionId);
    assert.equal(byId["nav-published"].draftRevisionId, null);

    assert.equal(byId["nav-draft"].state, "draft");
    assert.equal(byId["nav-draft"].displayLabel, "Draft Label");
    assert.equal(byId["nav-draft"].publishedRevisionId, null);
    assert.ok(byId["nav-draft"].draftRevisionId);

    assert.equal(byId["nav-published-with-draft"].state, "published_with_draft");
    assert.equal(byId["nav-published-with-draft"].displayLabel, "Draft Half", "draft label takes precedence");
    assert.ok(byId["nav-published-with-draft"].publishedRevisionId);
    assert.ok(byId["nav-published-with-draft"].draftRevisionId);

    assert.equal(byId["nav-archived"].state, "archived");
    assert.equal(byId["nav-archived"].displayLabel, "nav-archived", "falls back to the stable id");
    assert.equal(byId["nav-archived"].publishedRevisionId, null);
    assert.equal(byId["nav-archived"].draftRevisionId, null);
  } finally {
    await cleanup();
  }
});

test("sections carry a bounded order/visible summary using the same draft-then-published precedence", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const payload = await buildDashboardPayload(db);
    const home = payload.sections.find(item => item.id === "home");
    assert.equal(home.order, 1);
    assert.equal(home.visible, true);
  } finally {
    await cleanup();
  }
});

test("projects carry their slug in the dashboard projection", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const payload = await buildDashboardPayload(db);
    const project = payload.projects.find(item => item.id === "project-a");
    assert.equal(project.slug, "fixture-project");
  } finally {
    await cleanup();
  }
});

// --- AS15-F004 / AS15-F015 #8: explicit allowlist serializer leakage tests ---

test("the dashboard response excludes every non-allowlisted field, including sensitive legacy content", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const { provenance } = await seedDashboardFixture(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), { db, jwks });
    const rawText = await response.text();

    const forbiddenSubstrings = [
      "SECRET_SUMMARY_SHOULD_NOT_LEAK",
      "SECRET_STACK_ITEM",
      "SECRET_CATEGORY",
      "SECRET_SERVICE_SUMMARY_SHOULD_NOT_LEAK",
      "SECRET_SEO_DESCRIPTION_SHOULD_NOT_LEAK",
      "SECRET_HERO_DESCRIPTION_SHOULD_NOT_LEAK",
      "SECRET_ABOUT_BODY_SHOULD_NOT_LEAK",
      "secret-email-should-not-leak@example.com",
      provenance,
      "stack_json",
      "created_by",
      "summary",
      "category",
      "accent",
      "featured",
      "body",
      "contact",
      "email",
    ];
    for (const forbidden of forbiddenSubstrings) {
      assert.ok(!rawText.includes(forbidden), `response leaked forbidden content: ${forbidden}`);
    }

    const body = JSON.parse(rawText);
    const allowedTopLevelKeys = ["siteSettings", "navigation", "foundations", "projects", "services", "processSteps", "sections"];
    assert.deepEqual(Object.keys(body).sort(), [...allowedTopLevelKeys].sort());

    const allowedEntityKeys = ["id", "slug", "state", "publishedRevisionId", "draftRevisionId", "displayLabel", "order", "visible"];
    for (const collection of ["navigation", "foundations", "projects", "services", "processSteps", "sections"]) {
      for (const item of body[collection]) {
        for (const key of Object.keys(item)) {
          assert.ok(allowedEntityKeys.includes(key), `unexpected key '${key}' in ${collection} item`);
        }
      }
    }
    const allowedSiteSettingsKeys = ["id", "state", "publishedRevisionId", "draftRevisionId", "displayLabel"];
    for (const key of Object.keys(body.siteSettings)) {
      assert.ok(allowedSiteSettingsKeys.includes(key), `unexpected key '${key}' in siteSettings`);
    }
  } finally {
    await cleanup();
  }
});

// --- AS15-F006 / AS15-F015 #9: non-GET methods -> 405, zero D1 invocation ---

for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  test(`${method} /admin/api/dashboard returns 405 after authentication with zero D1 invocation`, async () => {
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const spy = dbSpy();
    const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { method, token }), { db: spy, jwks });
    assert.equal(response.status, 405);
    assert.equal(spy.calls.length, 0);
  });
}

// --- AS15-F001 / AS15-F015 #10: authenticated unknown /admin/api/* -> protected 404 ---

test("authenticated GET to an unknown /admin/api/* path returns protected 404 with zero D1 invocation", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const spy = dbSpy();
  const { response, assets } = await callDashboard(protectedRequest("/admin/api/projects", { token }), { db: spy, jwks });
  assert.equal(response.status, 404);
  assert.equal(spy.calls.length, 0);
  assert.equal(assets.calls.length, 0, "must not fall through to static asset handling");
});

// --- AS15-F007 / AS15-F015 #11,#12: generic 503/500, no leakage ---

test("missing DB after valid authentication returns a generic 503", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), { db: undefined, jwks });
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.ok(!/DB|binding|env\./i.test(text));
});

test("a D1 read failure after valid authentication returns a generic 500 without leaking the underlying error", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const sensitiveMessage = "SENSITIVE_FAKE_SQL_ERROR_MUST_NOT_LEAK: SELECT * FROM secrets";
  const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), {
    db: throwingDb(sensitiveMessage),
    jwks,
  });
  assert.equal(response.status, 500);
  const text = await response.text();
  assert.ok(!text.includes(sensitiveMessage));
  assert.ok(!text.toLowerCase().includes("select"));
});

// --- AS15-F008 / AS15-F015 #13,#14,#15: cache/content-type/CORS hardening ---

test("every protected /admin response carries Cache-Control: no-store", async () => {
  const unauthIdentity = await buildTestIdentity();
  const unauthenticated = await callDashboard(protectedRequest(DASHBOARD_PATH), { db: dbSpy(), jwks: unauthIdentity.jwks });
  assert.equal(unauthenticated.response.headers.get("Cache-Control"), "no-store");

  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const identity = await buildTestIdentity();
    const token = await signToken(identity.privateKey);

    const okResponse = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), { db, jwks: identity.jwks });
    assert.equal(okResponse.response.headers.get("Cache-Control"), "no-store");

    const notFound = await callDashboard(protectedRequest("/admin/api/nope", { token }), { db, jwks: identity.jwks });
    assert.equal(notFound.response.headers.get("Cache-Control"), "no-store");

    const methodNotAllowed = await callDashboard(protectedRequest(DASHBOARD_PATH, { method: "POST", token }), {
      db,
      jwks: identity.jwks,
    });
    assert.equal(methodNotAllowed.response.headers.get("Cache-Control"), "no-store");

    const serviceUnavailable = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), {
      db: undefined,
      jwks: identity.jwks,
    });
    assert.equal(serviceUnavailable.response.headers.get("Cache-Control"), "no-store");

    const serverError = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), {
      db: throwingDb("boom"),
      jwks: identity.jwks,
    });
    assert.equal(serverError.response.headers.get("Cache-Control"), "no-store");
  } finally {
    await cleanup();
  }
});

test("the protected admin static asset response also carries Cache-Control: no-store", async () => {
  const { privateKey, jwks } = await buildTestIdentity();
  const token = await signToken(privateKey);
  const { response } = await callDashboard(protectedRequest("/admin", { token }), { db: dbSpy(), jwks });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("dashboard JSON sets an explicit JSON content type and X-Content-Type-Options: nosniff", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), { db, jwks });
    assert.match(response.headers.get("Content-Type") ?? "", /^application\/json/);
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  } finally {
    await cleanup();
  }
});

test("no permissive CORS header is present on any protected admin response", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const { privateKey, jwks } = await buildTestIdentity();
    const token = await signToken(privateKey);
    const { response } = await callDashboard(protectedRequest(DASHBOARD_PATH, { token }), { db, jwks });
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  } finally {
    await cleanup();
  }
});

// --- AS15-F013: no schema mutation is reachable from the dashboard path ---

test("the dashboard path performs no INSERT/UPDATE/DELETE/REPLACE/DDL — only SELECT statements", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await seedDashboardFixture(db);
    const spy = dbSpy();
    // Intercept prepare() to record SQL while still delegating reads to the
    // real seeded database, proving every statement the dashboard path
    // issues is a SELECT.
    const recording = {
      calls: spy.calls,
      prepare(sql) {
        spy.calls.push(sql);
        return db.prepare(sql);
      },
    };
    await buildDashboardPayload(recording);
    assert.ok(recording.calls.length > 0);
    for (const sql of recording.calls) {
      assert.match(sql.trim().toUpperCase(), /^SELECT\b/);
    }
  } finally {
    await cleanup();
  }
});
