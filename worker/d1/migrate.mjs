// WEB-INC-005 (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024) deterministic
// current-content migration/seed.
//
// Reuses lib/content/schema.mjs's validateContent() as the first validation
// gate on the source document (RFC-003 §11: "existing lib/content/schema.mjs
// remains the minimum current-content contract"). This is a read-only
// dependency in one direction only — this file imports the legacy
// validator; nothing in lib/content/*, app/page.js, or data/site.js is
// changed by this increment (AS13-F001, AS13-F013).
//
// Determinism / repeat-run contract (AS13-F009): for each logical entity,
// - if the entity does not yet exist in D1, it is created (entity row +
//   revision 1 + pointer, in one atomic db.batch call — no partial writes);
// - if it already exists with byte-identical content and the same
//   publish/draft/archived state, the run is a no-op for that entity;
// - if it already exists with DIFFERENT content or a different
//   publish/draft/archived state, migration is refused for that entity with
//   an explicit error and no write is attempted — this deterministic seed
//   migrates a fixed content snapshot once; it does not silently
//   resynchronize a changed source on rerun.
import { validateContent } from "../../lib/content/schema.mjs";
import {
  validateSiteSettingsContent,
  validateNavigationRevisionContent,
  validateFoundationRevisionContent,
  validateProjectRevisionContent,
  validateServiceRevisionContent,
  validateProcessStepRevisionContent,
  validateSectionRevisionContent,
  validateProjectSlug,
} from "./validate.mjs";

export const MIGRATION_PROVENANCE = "migration:web-inc-005";

function normalizeForComparison(value) {
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

// Inserts a brand-new entity + its first revision + pointer atomically, or
// (if the entity already exists) verifies the existing row set matches the
// intended target exactly and reports a no-op, or refuses with no write.
async function upsertEntity(db, {
  entityTable,
  revisionsTable,
  entityIdColumn,
  entityId,
  extraEntityColumns = {},
  revisionColumns,
  state, // "published" | "draft" | "archived"
  createdAt,
  createdBy,
}) {
  const existingEntity = await db.prepare(`SELECT * FROM ${entityTable} WHERE id = ?`).bind(entityId).first();

  if (existingEntity) {
    const existingRevision = await db
      .prepare(`SELECT * FROM ${revisionsTable} WHERE ${entityIdColumn} = ? AND revision_number = 1`)
      .bind(entityId)
      .first();
    if (!existingRevision) {
      throw new Error(
        `WEB-INC-005 migration refusal: '${entityId}' in ${entityTable} exists without its revision 1 row. ` +
          "Refusing to write further to avoid corrupting a partial prior run."
      );
    }
    const contentMatches = Object.entries(revisionColumns).every(
      ([column, value]) => normalizeForComparison(existingRevision[column]) === normalizeForComparison(value)
    );
    const extraMatches = Object.entries(extraEntityColumns).every(
      ([column, value]) => normalizeForComparison(existingEntity[column]) === normalizeForComparison(value)
    );
    const intendedPublished = state === "published";
    const intendedDraft = state === "draft";
    const pointerMatches =
      Boolean(existingEntity.published_revision_id) === intendedPublished &&
      Boolean(existingEntity.draft_revision_id) === intendedDraft;

    if (contentMatches && extraMatches && pointerMatches) {
      return { entityId, table: entityTable, action: "noop" };
    }
    throw new Error(
      `WEB-INC-005 migration refusal: '${entityId}' in ${entityTable} already exists with different content or ` +
        "publication state. This deterministic seed migrates a fixed source snapshot once; it does not " +
        "resynchronize changed source content on rerun."
    );
  }

  const entityColumnNames = ["id", "created_at", ...Object.keys(extraEntityColumns)];
  const entityValues = [entityId, createdAt, ...Object.values(extraEntityColumns)];
  const revisionColumnNames = Object.keys(revisionColumns);
  const revisionValues = Object.values(revisionColumns);

  const statements = [
    db
      .prepare(`INSERT INTO ${entityTable} (${entityColumnNames.join(", ")}) VALUES (${entityColumnNames.map(() => "?").join(", ")})`)
      .bind(...entityValues),
    db
      .prepare(
        `INSERT INTO ${revisionsTable} (${entityIdColumn}, revision_number, ${revisionColumnNames.join(", ")}, created_at, created_by) ` +
          `VALUES (?, 1, ${revisionColumnNames.map(() => "?").join(", ")}, ?, ?)`
      )
      .bind(entityId, ...revisionValues, createdAt, createdBy),
  ];

  if (state === "published" || state === "draft") {
    const pointerColumn = state === "published" ? "published_revision_id" : "draft_revision_id";
    statements.push(
      db
        .prepare(
          `UPDATE ${entityTable} SET ${pointerColumn} = ` +
            `(SELECT id FROM ${revisionsTable} WHERE ${entityIdColumn} = ? AND revision_number = 1) WHERE id = ?`
        )
        .bind(entityId, entityId)
    );
  }
  // state === "archived": both pointers stay null, exactly as inserted.

  await db.batch(statements);
  return { entityId, table: entityTable, action: "created", state };
}

const RECORD_COLLECTIONS = [
  {
    key: "navigation",
    entityTable: "navigation",
    revisionsTable: "navigation_revisions",
    entityIdColumn: "navigation_id",
    validate: validateNavigationRevisionContent,
    toRevisionColumns: fields => ({ sort_order: fields.order, label: fields.label, href: fields.href }),
    toDomainFields: item => ({ order: item.order, label: item.label, href: item.href }),
  },
  {
    key: "foundations",
    entityTable: "foundations",
    revisionsTable: "foundation_revisions",
    entityIdColumn: "foundation_id",
    validate: validateFoundationRevisionContent,
    toRevisionColumns: fields => ({ sort_order: fields.order, icon: fields.icon, label: fields.label, href: fields.href, text: fields.text }),
    toDomainFields: item => ({ order: item.order, icon: item.icon, label: item.label, href: item.href, text: item.text }),
  },
  {
    key: "projects",
    entityTable: "projects",
    revisionsTable: "project_revisions",
    entityIdColumn: "project_id",
    validate: validateProjectRevisionContent,
    toRevisionColumns: fields => ({
      sort_order: fields.order,
      category: fields.category,
      title: fields.title,
      summary: fields.summary,
      stack_json: JSON.stringify(fields.stack),
      accent: fields.accent,
      icon: fields.icon,
      featured: fields.featured ? 1 : 0,
    }),
    toDomainFields: item => ({
      order: item.order,
      category: item.category,
      title: item.title,
      summary: item.summary,
      stack: item.stack,
      accent: item.accent,
      icon: item.icon,
      featured: item.featured,
    }),
    extraEntityColumns: item => ({ slug: validateProjectSlug(item.slug) }),
  },
  {
    key: "services",
    entityTable: "services",
    revisionsTable: "service_revisions",
    entityIdColumn: "service_id",
    validate: validateServiceRevisionContent,
    toRevisionColumns: fields => ({ sort_order: fields.order, title: fields.title, summary: fields.summary }),
    toDomainFields: item => ({ order: item.order, title: item.title, summary: item.summary }),
  },
  {
    key: "processSteps",
    entityTable: "process_steps",
    revisionsTable: "process_step_revisions",
    entityIdColumn: "process_step_id",
    validate: validateProcessStepRevisionContent,
    toRevisionColumns: fields => ({ sort_order: fields.order, icon: fields.icon, title: fields.title, text: fields.text }),
    toDomainFields: item => ({ order: item.order, icon: item.icon, title: item.title, text: item.text }),
  },
];

async function migrateRecordItem(db, spec, item, { createdAt, createdBy }) {
  const domainFields = spec.toDomainFields(item);
  spec.validate(domainFields);
  const revisionColumns = spec.toRevisionColumns(domainFields);
  const extraEntityColumns = spec.extraEntityColumns ? spec.extraEntityColumns(item) : {};
  return upsertEntity(db, {
    entityTable: spec.entityTable,
    revisionsTable: spec.revisionsTable,
    entityIdColumn: spec.entityIdColumn,
    entityId: item.id,
    extraEntityColumns,
    revisionColumns,
    state: item.state,
    createdAt,
    createdBy,
  });
}

function buildSiteSettingsDomainObject(source) {
  return {
    schemaVersion: source.meta.schemaVersion,
    contentVersion: source.meta.contentVersion,
    locale: source.meta.locale,
    updatedAt: source.meta.updatedAt,
    site: source.site,
    seo: source.seo,
    hero: source.hero,
    process: { kicker: source.process.kicker, title: source.process.title },
    about: source.about,
    contact: source.contact,
    projectSection: source.projectSection,
    footer: source.footer,
  };
}

function flattenSiteSettingsColumns(domain) {
  return {
    schema_version: domain.schemaVersion,
    content_version: domain.contentVersion,
    locale: domain.locale,
    updated_at: domain.updatedAt,
    site_name: domain.site.name,
    site_location: domain.site.location,
    site_timezone: domain.site.timezone,
    site_tagline: domain.site.tagline,
    seo_title: domain.seo.title,
    seo_description: domain.seo.description,
    seo_canonical_url: domain.seo.canonicalUrl,
    hero_eyebrow: domain.hero.eyebrow,
    hero_title_json: JSON.stringify(domain.hero.title),
    hero_description: domain.hero.description,
    hero_primary_action_json: JSON.stringify(domain.hero.primaryAction),
    hero_secondary_action_json: JSON.stringify(domain.hero.secondaryAction),
    hero_bridge_label: domain.hero.bridgeLabel,
    hero_bridge_statement: domain.hero.bridgeStatement,
    process_kicker: domain.process.kicker,
    process_title: domain.process.title,
    about_kicker: domain.about.kicker,
    about_title_json: JSON.stringify(domain.about.title),
    about_body: domain.about.body,
    about_quote: domain.about.quote,
    about_quote_attribution: domain.about.quoteAttribution,
    contact_header_label: domain.contact.headerLabel,
    contact_email: domain.contact.email,
    contact_call_to_action: domain.contact.callToAction,
    project_section_kicker: domain.projectSection.kicker,
    project_section_title: domain.projectSection.title,
    project_section_description: domain.projectSection.description,
    project_section_empty_message: domain.projectSection.emptyMessage,
    footer_statement: domain.footer.statement,
    footer_copyright: domain.footer.copyright,
  };
}

async function migrateSiteSettings(db, source, { createdAt, createdBy }) {
  const domain = buildSiteSettingsDomainObject(source);
  validateSiteSettingsContent(domain);
  const revisionColumns = flattenSiteSettingsColumns(domain);
  return upsertEntity(db, {
    entityTable: "site_settings",
    revisionsTable: "site_settings_revisions",
    entityIdColumn: "site_settings_id",
    entityId: "default",
    revisionColumns,
    state: source.meta.state,
    createdAt,
    createdBy,
  });
}

// Sections bootstrap (RFC-003 §6, AS13-F005): four fixed, initially
// published/visible sections in the current page's structural order.
// `main-content` is intentionally excluded — it is a skip-link target
// inside the hero markup, not a managed section.
export const SECTION_BOOTSTRAP = [
  { id: "home", order: 1, visible: true },
  { id: "projects", order: 2, visible: true },
  { id: "process", order: 3, visible: true },
  { id: "about", order: 4, visible: true },
];

async function migrateSectionBootstrap(db, section, { createdAt, createdBy }) {
  const domainFields = { order: section.order, visible: section.visible };
  validateSectionRevisionContent(domainFields);
  const revisionColumns = { sort_order: domainFields.order, visible: domainFields.visible ? 1 : 0 };
  return upsertEntity(db, {
    entityTable: "sections",
    revisionsTable: "section_revisions",
    entityIdColumn: "section_id",
    entityId: section.id,
    revisionColumns,
    state: "published",
    createdAt,
    createdBy,
  });
}

// Migrates a full current-content document (the real `siteContent`, or an
// equivalent test fixture with the same shape) into the D1 revision
// substrate, plus bootstraps the four managed sections. Deterministic and
// safe to call more than once — see the repeat-run contract above.
export async function migrateCurrentContent(db, source, { provenance = MIGRATION_PROVENANCE } = {}) {
  validateContent(source);
  const createdAt = source.meta.updatedAt;
  const results = [];

  results.push(await migrateSiteSettings(db, source, { createdAt, createdBy: provenance }));

  for (const spec of RECORD_COLLECTIONS) {
    const items = spec.key === "processSteps" ? source.process.steps : source[spec.key];
    for (const item of items) {
      results.push(await migrateRecordItem(db, spec, item, { createdAt, createdBy: provenance }));
    }
  }

  for (const section of SECTION_BOOTSTRAP) {
    results.push(await migrateSectionBootstrap(db, section, { createdAt, createdBy: provenance }));
  }

  return {
    createdCount: results.filter(r => r.action === "created").length,
    noopCount: results.filter(r => r.action === "noop").length,
    results,
  };
}
