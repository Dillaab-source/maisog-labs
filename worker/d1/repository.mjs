// WEB-INC-005 (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024) bounded
// server-side D1 data-access module.
//
// AS13-F012 / RFC-003 §10 boundary: this module exposes only
//   - published-revision reads,
//   - explicitly named draft-revision reads (for trusted server-side code
//     only — there is no admin session/UI in this increment to call them),
//   - reconstruction of the legacy published-content shape for parity
//     testing.
// It does NOT expose an HTTP route, dashboard, CRUD, or publish/unpublish
// handler, and nothing here is imported by app/ or by worker/index.mjs
// (which continues to serve only the WEB-INC-001 auth boundary). D1 access
// stays entirely server-side/Node-tooling-only in this increment.

const COLLECTIONS = {
  navigation: {
    entityTable: "navigation",
    revisionsTable: "navigation_revisions",
    entityIdColumn: "navigation_id",
    map: row => ({ id: row.entity_id, label: row.label, href: row.href, order: row.sort_order }),
  },
  foundations: {
    entityTable: "foundations",
    revisionsTable: "foundation_revisions",
    entityIdColumn: "foundation_id",
    map: row => ({ id: row.entity_id, icon: row.icon, label: row.label, href: row.href, text: row.text, order: row.sort_order }),
  },
  projects: {
    entityTable: "projects",
    revisionsTable: "project_revisions",
    entityIdColumn: "project_id",
    extraBaseColumns: ["slug"],
    map: row => ({
      id: row.entity_id,
      slug: row.slug,
      category: row.category,
      title: row.title,
      summary: row.summary,
      stack: JSON.parse(row.stack_json),
      accent: row.accent,
      icon: row.icon,
      order: row.sort_order,
      featured: Boolean(row.featured),
    }),
  },
  services: {
    entityTable: "services",
    revisionsTable: "service_revisions",
    entityIdColumn: "service_id",
    map: row => ({ id: row.entity_id, title: row.title, summary: row.summary, order: row.sort_order }),
  },
  processSteps: {
    entityTable: "process_steps",
    revisionsTable: "process_step_revisions",
    entityIdColumn: "process_step_id",
    map: row => ({ id: row.entity_id, icon: row.icon, title: row.title, text: row.text, order: row.sort_order }),
  },
  sections: {
    entityTable: "sections",
    revisionsTable: "section_revisions",
    entityIdColumn: "section_id",
    map: row => ({ id: row.entity_id, order: row.sort_order, visible: Boolean(row.visible) }),
  },
};

function sortRecords(records) {
  return [...records].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

async function readByPointer(db, collectionKey, pointerColumn) {
  const collection = COLLECTIONS[collectionKey];
  if (!collection) throw new Error(`Unknown collection: ${collectionKey}`);
  const extraColumns = (collection.extraBaseColumns ?? []).map(column => `e.${column} AS ${column}`);
  const sql = `
    SELECT e.id AS entity_id, ${extraColumns.length ? extraColumns.join(", ") + "," : ""} r.*
    FROM ${collection.entityTable} e
    JOIN ${collection.revisionsTable} r
      ON r.id = e.${pointerColumn} AND r.${collection.entityIdColumn} = e.id
  `;
  const result = await db.prepare(sql).all();
  return sortRecords(result.results.map(collection.map));
}

// Published-only reads — the only path the legacy public projection and any
// future public renderer may use.
export function readPublishedCollection(db, collectionKey) {
  return readByPointer(db, collectionKey, "published_revision_id");
}

// Explicit draft reads. Named distinctly from the published read above so a
// caller must deliberately choose it; there is no admin session boundary in
// this increment, so the only current callers are this repository's own
// tests exercising the substrate directly (AS13-F012).
export function readDraftCollectionForTrustedServerCode(db, collectionKey) {
  return readByPointer(db, collectionKey, "draft_revision_id");
}

const SITE_SETTINGS_COLUMNS = `
  schema_version, content_version, locale, updated_at,
  site_name, site_location, site_timezone, site_tagline,
  seo_title, seo_description, seo_canonical_url,
  hero_eyebrow, hero_title_json, hero_description, hero_primary_action_json, hero_secondary_action_json,
  hero_bridge_label, hero_bridge_statement,
  process_kicker, process_title,
  about_kicker, about_title_json, about_body, about_quote, about_quote_attribution,
  contact_header_label, contact_email, contact_call_to_action,
  project_section_kicker, project_section_title, project_section_description, project_section_empty_message,
  footer_statement, footer_copyright
`;

function mapSiteSettingsRow(row) {
  if (!row) return null;
  return {
    meta: {
      schemaVersion: row.schema_version,
      contentVersion: row.content_version,
      locale: row.locale,
      updatedAt: row.updated_at,
    },
    site: { name: row.site_name, location: row.site_location, timezone: row.site_timezone, tagline: row.site_tagline },
    seo: { title: row.seo_title, description: row.seo_description, canonicalUrl: row.seo_canonical_url },
    hero: {
      eyebrow: row.hero_eyebrow,
      title: JSON.parse(row.hero_title_json),
      description: row.hero_description,
      primaryAction: JSON.parse(row.hero_primary_action_json),
      secondaryAction: JSON.parse(row.hero_secondary_action_json),
      bridgeLabel: row.hero_bridge_label,
      bridgeStatement: row.hero_bridge_statement,
    },
    process: { kicker: row.process_kicker, title: row.process_title },
    about: {
      kicker: row.about_kicker,
      title: JSON.parse(row.about_title_json),
      body: row.about_body,
      quote: row.about_quote,
      quoteAttribution: row.about_quote_attribution,
    },
    contact: { headerLabel: row.contact_header_label, email: row.contact_email, callToAction: row.contact_call_to_action },
    projectSection: {
      kicker: row.project_section_kicker,
      title: row.project_section_title,
      description: row.project_section_description,
      emptyMessage: row.project_section_empty_message,
    },
    footer: { statement: row.footer_statement, copyright: row.footer_copyright },
  };
}

async function readSiteSettingsByPointer(db, pointerColumn) {
  const sql = `
    SELECT ${SITE_SETTINGS_COLUMNS}
    FROM site_settings e
    JOIN site_settings_revisions r ON r.id = e.${pointerColumn} AND r.site_settings_id = e.id
  `;
  const row = await db.prepare(sql).first();
  return mapSiteSettingsRow(row);
}

export function readPublishedSiteSettings(db) {
  return readSiteSettingsByPointer(db, "published_revision_id");
}

export function readDraftSiteSettingsForTrustedServerCode(db) {
  return readSiteSettingsByPointer(db, "draft_revision_id");
}

// Reconstructs the legacy `projectPublishedContent(siteContent)` shape
// entirely from published D1 revisions, for parity testing only
// (AS13-F010, AS13-F013). This function is never imported by app/page.js or
// lib/content/local.mjs — the legacy static path remains the sole
// authoritative public source in this increment.
export async function reconstructPublishedLegacyProjection(db) {
  const siteSettings = await readPublishedSiteSettings(db);
  if (!siteSettings) throw new Error("site_settings has no published revision");

  const [navigation, foundations, projects, services, processSteps] = await Promise.all([
    readPublishedCollection(db, "navigation"),
    readPublishedCollection(db, "foundations"),
    readPublishedCollection(db, "projects"),
    readPublishedCollection(db, "services"),
    readPublishedCollection(db, "processSteps"),
  ]);

  return {
    meta: siteSettings.meta,
    site: siteSettings.site,
    seo: siteSettings.seo,
    navigation,
    hero: siteSettings.hero,
    foundations,
    projects,
    services,
    process: { kicker: siteSettings.process.kicker, title: siteSettings.process.title, steps: processSteps },
    about: siteSettings.about,
    contact: siteSettings.contact,
    footer: siteSettings.footer,
    projectSection: siteSettings.projectSection,
  };
}

// Verified separately from the legacy parity projection above (AS13-F010's
// "the sections substrate is not an extra key in the legacy parity
// projection"). Returns the four bootstrap sections in their published
// order.
export function reconstructPublishedSections(db) {
  return readPublishedCollection(db, "sections");
}

// WEB-INC-002 (ML-DEVOS-RFC-004 / ML-DEVOS-AS-015 / D-025) bounded dashboard
// status reads. These return every base entity row (regardless of pointer
// state — including archived, where both pointers are null) alongside
// whatever published/draft revision content exists, via LEFT JOIN so a
// missing pointer simply yields null columns rather than omitting the row.
// This is still a plain read-only SELECT — no INSERT/UPDATE/DELETE, no
// caller-controlled SQL/table/column selection (AS15-F006). The caller
// (worker/admin/dashboard.mjs) is responsible for turning these raw rows
// into the allowlisted dashboard projection; nothing here is returned
// directly to a client (AS15-F004).
const DASHBOARD_LABEL_COLUMN = {
  navigation: "label",
  foundations: "label",
  projects: "title",
  services: "title",
  processSteps: "title",
  sections: null,
};

const DASHBOARD_EXTRA_COLUMNS = {
  sections: ["sort_order", "visible"],
};

export async function readDashboardStatusRows(db, collectionKey) {
  const collection = COLLECTIONS[collectionKey];
  if (!collection) throw new Error(`Unknown collection: ${collectionKey}`);

  const labelColumn = DASHBOARD_LABEL_COLUMN[collectionKey];
  const extraColumns = DASHBOARD_EXTRA_COLUMNS[collectionKey] ?? [];
  const extraBaseColumns = (collection.extraBaseColumns ?? []).map(column => `e.${column} AS ${column}`);

  const selectParts = [
    "e.id AS entity_id",
    ...extraBaseColumns,
    "e.published_revision_id AS published_revision_id",
    "e.draft_revision_id AS draft_revision_id",
    ...(labelColumn ? [`pub.${labelColumn} AS published_label`, `draft.${labelColumn} AS draft_label`] : []),
    ...extraColumns.flatMap(column => [`pub.${column} AS published_${column}`, `draft.${column} AS draft_${column}`]),
  ];

  const sql = `
    SELECT ${selectParts.join(", ")}
    FROM ${collection.entityTable} e
    LEFT JOIN ${collection.revisionsTable} pub ON pub.id = e.published_revision_id AND pub.${collection.entityIdColumn} = e.id
    LEFT JOIN ${collection.revisionsTable} draft ON draft.id = e.draft_revision_id AND draft.${collection.entityIdColumn} = e.id
    ORDER BY e.id
  `;
  const result = await db.prepare(sql).all();
  return result.results;
}

export async function readSiteSettingsStatusRow(db) {
  const [pointerRow, published, draft] = await Promise.all([
    db.prepare("SELECT id, published_revision_id, draft_revision_id FROM site_settings WHERE id = 'default'").first(),
    readPublishedSiteSettings(db),
    readDraftSiteSettingsForTrustedServerCode(db),
  ]);
  if (!pointerRow) return null;
  return {
    id: pointerRow.id,
    publishedRevisionId: pointerRow.published_revision_id ?? null,
    draftRevisionId: pointerRow.draft_revision_id ?? null,
    publishedLabel: published?.site?.name ?? null,
    draftLabel: draft?.site?.name ?? null,
  };
}

export { COLLECTIONS };
