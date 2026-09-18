// WEB-INC-005 (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024) D1 revision
// substrate tests. Every database used here is a local Wrangler/Miniflare
// D1 simulation (`getPlatformProxy({ remoteBindings: false })`) persisted to
// a throwaway temp directory per test — no test in this file can reach a
// real Cloudflare resource (AS13-F008).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { siteContent } from "../data/site.js";
import { projectPublishedContent } from "../lib/content/public.mjs";
import { applySchema, listProductTables, AUTHORIZED_TABLE_NAMES } from "../worker/d1/schema.mjs";
import { migrateCurrentContent, SECTION_BOOTSTRAP, MIGRATION_PROVENANCE } from "../worker/d1/migrate.mjs";
import {
  reconstructPublishedLegacyProjection,
  reconstructPublishedSections,
  readPublishedCollection,
  readDraftCollectionForTrustedServerCode,
} from "../worker/d1/repository.mjs";
import { validateProjectSlug } from "../worker/d1/validate.mjs";

const WRANGLER_CONFIG_PATH = path.join(import.meta.dirname, "..", "wrangler.jsonc");

async function openTestDb() {
  const statePath = fs.mkdtempSync(path.join(os.tmpdir(), "web-inc-005-d1-test-"));
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

function buildFixtureContent({ navigationStates } = {}) {
  const states = navigationStates ?? ["published", "draft", "archived"];
  return {
    meta: { schemaVersion: "1.0.0", contentVersion: "test-1.0.0", state: "published", locale: "en-PH", updatedAt: "2026-01-01" },
    site: { name: "Fixture Lab", location: "Nowhere", timezone: "UTC+00", tagline: "Test tagline" },
    seo: { title: "Fixture", description: "Fixture description", canonicalUrl: "https://example.com" },
    navigation: states.map((state, index) => ({
      id: `nav-${state}-${index}`,
      label: `Nav ${index}`,
      href: "#home",
      order: index + 1,
      state,
    })),
    hero: {
      eyebrow: "EYEBROW",
      title: ["Line one", "Line two"],
      description: "Hero description",
      primaryAction: { label: "Go", href: "#home" },
      secondaryAction: { label: "Contact", href: "mailto:hello@example.com" },
      bridgeLabel: "BRIDGE",
      bridgeStatement: "Bridge statement",
    },
    foundations: [{ id: "foundation-fixture", icon: "foundation", label: "Foundation", text: "Text", href: "#home", order: 1, state: "published" }],
    projects: [
      { id: "project-fixture", slug: "fixture-project", category: "TEST", title: "Fixture", summary: "Summary", stack: ["Test"], accent: "gold", icon: "lab", order: 1, featured: true, state: "published" },
    ],
    services: [{ id: "service-fixture", title: "Service", summary: "Summary", order: 1, state: "published" }],
    process: {
      kicker: "KICKER",
      title: "Title",
      steps: [{ id: "process-fixture", icon: "lab", title: "Step", text: "Text", order: 1, state: "published" }],
    },
    about: { kicker: "ABOUT", title: ["Line one", "Line two"], body: "Body", quote: "Quote", quoteAttribution: "Fixture" },
    contact: { headerLabel: "Header", email: "hello@example.com", callToAction: "Call to action" },
    projectSection: { kicker: "KICKER", title: "Title", description: "Description", emptyMessage: "Empty" },
    footer: { statement: "Statement", copyright: "Copyright" },
  };
}

test("schema migration creates exactly the 14 authorized tables", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const tables = await listProductTables(db);
    assert.deepEqual(tables, [...AUTHORIZED_TABLE_NAMES].sort());
  } finally {
    await cleanup();
  }
});

test("fresh migration of real siteContent achieves deep parity with projectPublishedContent(siteContent)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const summary = await migrateCurrentContent(db, siteContent);
    assert.equal(summary.noopCount, 0);
    assert.ok(summary.createdCount > 0);

    const expected = projectPublishedContent(siteContent);
    const actual = await reconstructPublishedLegacyProjection(db);
    assert.deepEqual(actual, expected);
  } finally {
    await cleanup();
  }
});

test("sections substrate is bootstrapped separately and is not part of the legacy parity projection", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await migrateCurrentContent(db, siteContent);
    const sections = await reconstructPublishedSections(db);
    assert.deepEqual(
      sections,
      SECTION_BOOTSTRAP.map(s => ({ id: s.id, order: s.order, visible: s.visible })).sort((a, b) => a.order - b.order)
    );

    const legacyProjection = await reconstructPublishedLegacyProjection(db);
    assert.ok(!Object.hasOwn(legacyProjection, "sections"));
  } finally {
    await cleanup();
  }
});

test("second migration run of unchanged content is a deterministic no-op (no duplicate revisions, no pointer changes)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const first = await migrateCurrentContent(db, siteContent);
    const snapshotBefore = await dumpAllRows(db);

    const second = await migrateCurrentContent(db, siteContent);
    const snapshotAfter = await dumpAllRows(db);

    assert.equal(second.createdCount, 0);
    assert.equal(second.noopCount, first.createdCount);
    assert.deepEqual(snapshotAfter, snapshotBefore);
  } finally {
    await cleanup();
  }
});

test("migration refuses to overwrite an entity whose stored content differs from the intended target, with no partial write", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const fixtureA = buildFixtureContent();
    await migrateCurrentContent(db, fixtureA);
    const before = await dumpAllRows(db);

    const fixtureB = buildFixtureContent();
    fixtureB.site.tagline = "Changed tagline";
    await assert.rejects(() => migrateCurrentContent(db, fixtureB), /migration refusal/);

    const after = await dumpAllRows(db);
    assert.deepEqual(after, before);
  } finally {
    await cleanup();
  }
});

test("published/draft/archived source fixtures map to the correct pointer state", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const fixture = buildFixtureContent();
    await migrateCurrentContent(db, fixture);

    const rows = (await db.prepare("SELECT id, published_revision_id, draft_revision_id FROM navigation ORDER BY id").all()).results;
    const byId = Object.fromEntries(rows.map(r => [r.id, r]));

    const published = fixture.navigation.find(n => n.state === "published");
    const draft = fixture.navigation.find(n => n.state === "draft");
    const archived = fixture.navigation.find(n => n.state === "archived");

    assert.ok(byId[published.id].published_revision_id);
    assert.equal(byId[published.id].draft_revision_id, null);

    assert.equal(byId[draft.id].published_revision_id, null);
    assert.ok(byId[draft.id].draft_revision_id);

    assert.equal(byId[archived.id].published_revision_id, null);
    assert.equal(byId[archived.id].draft_revision_id, null);
    const archivedRevisionCount = (
      await db.prepare("SELECT COUNT(*) AS n FROM navigation_revisions WHERE navigation_id = ?").bind(archived.id).first()
    ).n;
    assert.equal(archivedRevisionCount, 1);

    const publishedProjection = await readPublishedCollection(db, "navigation");
    assert.ok(publishedProjection.some(item => item.id === published.id));
    assert.ok(!publishedProjection.some(item => item.id === draft.id));
    assert.ok(!publishedProjection.some(item => item.id === archived.id));
  } finally {
    await cleanup();
  }
});

test("a draft reorder does not affect the published projection/order", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    const fixture = buildFixtureContent({ navigationStates: ["published", "published"] });
    await migrateCurrentContent(db, fixture);
    const [first] = fixture.navigation;

    // Simulate an out-of-band draft reorder for the already-published entity:
    // insert revision_number 2 with a different sort_order and point
    // draft_revision_id at it, leaving published_revision_id untouched.
    await db.batch([
      db
        .prepare(
          "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) " +
            "VALUES (?, 2, 99, ?, ?, ?, ?)"
        )
        .bind(first.id, first.label, first.href, fixture.meta.updatedAt, MIGRATION_PROVENANCE),
      db
        .prepare(
          "UPDATE navigation SET draft_revision_id = " +
            "(SELECT id FROM navigation_revisions WHERE navigation_id = ? AND revision_number = 2) WHERE id = ?"
        )
        .bind(first.id, first.id),
    ]);

    const published = await readPublishedCollection(db, "navigation");
    const draft = await readDraftCollectionForTrustedServerCode(db, "navigation");

    assert.equal(published.find(item => item.id === first.id).order, first.order);
    assert.equal(draft.find(item => item.id === first.id).order, 99);
  } finally {
    await cleanup();
  }
});

test("a base-entity pointer cannot successfully reference another entity's revision (cross-entity rejection)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await db.batch([
      db.prepare("INSERT INTO navigation (id, created_at) VALUES ('nav-one', '2026-01-01')"),
      db
        .prepare(
          "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) " +
            "VALUES ('nav-one', 1, 1, 'One', '#home', '2026-01-01', ?)"
        )
        .bind(MIGRATION_PROVENANCE),
      db.prepare("INSERT INTO navigation (id, created_at) VALUES ('nav-two', '2026-01-01')"),
      db
        .prepare(
          "INSERT INTO navigation_revisions (navigation_id, revision_number, sort_order, label, href, created_at, created_by) " +
            "VALUES ('nav-two', 1, 2, 'Two', '#projects', '2026-01-01', ?)"
        )
        .bind(MIGRATION_PROVENANCE),
    ]);
    const otherRevision = await db
      .prepare("SELECT id FROM navigation_revisions WHERE navigation_id = 'nav-two' AND revision_number = 1")
      .first();

    await assert.rejects(
      () => db.prepare("UPDATE navigation SET published_revision_id = ? WHERE id = 'nav-one'").bind(otherRevision.id).run(),
      /FOREIGN KEY/
    );
  } finally {
    await cleanup();
  }
});

test("project slug uniqueness is enforced", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await db.prepare("INSERT INTO projects (id, slug, created_at) VALUES ('project-a', 'shared-slug', '2026-01-01')").run();
    await assert.rejects(
      () => db.prepare("INSERT INTO projects (id, slug, created_at) VALUES ('project-b', 'shared-slug', '2026-01-01')").run(),
      /UNIQUE/
    );
  } finally {
    await cleanup();
  }
});

test("reserved project slugs are rejected at the database layer and by the JS validator", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await assert.rejects(
      () => db.prepare("INSERT INTO projects (id, slug, created_at) VALUES ('project-c', 'home', '2026-01-01')").run(),
      /CHECK/
    );
    for (const reserved of ["home", "projects", "process", "about", "main-content"]) {
      assert.throws(() => validateProjectSlug(reserved), /reserved slug/);
    }
    assert.equal(validateProjectSlug("clinicflow"), "clinicflow");
  } finally {
    await cleanup();
  }
});

test("revision-number uniqueness per entity is enforced", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await db.prepare("INSERT INTO services (id, created_at) VALUES ('service-a', '2026-01-01')").run();
    await db
      .prepare(
        "INSERT INTO service_revisions (service_id, revision_number, sort_order, title, summary, created_at, created_by) " +
          "VALUES ('service-a', 1, 1, 'Title', 'Summary', '2026-01-01', ?)"
      )
      .bind(MIGRATION_PROVENANCE)
      .run();
    await assert.rejects(
      () =>
        db
          .prepare(
            "INSERT INTO service_revisions (service_id, revision_number, sort_order, title, summary, created_at, created_by) " +
              "VALUES ('service-a', 1, 2, 'Title Two', 'Summary Two', '2026-01-01', ?)"
          )
          .bind(MIGRATION_PROVENANCE)
          .run(),
      /UNIQUE/
    );
  } finally {
    await cleanup();
  }
});

test("a revision row cannot reference a non-existent base entity (foreign-key integrity fails safely)", async () => {
  const { db, cleanup } = await openTestDb();
  try {
    await assert.rejects(
      () =>
        db
          .prepare(
            "INSERT INTO service_revisions (service_id, revision_number, sort_order, title, summary, created_at, created_by) " +
              "VALUES ('service-does-not-exist', 1, 1, 'Title', 'Summary', '2026-01-01', ?)"
          )
          .bind(MIGRATION_PROVENANCE)
          .run(),
      /FOREIGN KEY/
    );
  } finally {
    await cleanup();
  }
});

async function dumpAllRows(db) {
  const dump = {};
  for (const table of AUTHORIZED_TABLE_NAMES) {
    const result = await db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
    dump[table] = result.results;
  }
  return dump;
}
