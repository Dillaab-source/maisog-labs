// WEB-INC-005 (ML-DEVOS-RFC-003 / ML-DEVOS-AS-013 / D-024) field-by-field
// validation for D1 revision content.
//
// This is a direct, D1-scoped validation successor to
// lib/content/schema.mjs's per-field validation philosophy (AS13-F004):
// every typed JSON substructure stored in site_settings_revisions, and every
// content field stored on any other *_revisions row, is validated field by
// field here, with unknown fields explicitly rejected. lib/content/schema.mjs
// itself is not imported or modified — it remains the untouched legacy
// validation contract for the existing `data/site.js` read path
// (AS13-F001) — but every predicate below intentionally mirrors its rules
// (text/lines/action/email/canonical) so the two validators agree on what
// "valid content" means.

function hasControlOrAngleBracketChar(value) {
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code <= 0x1f || ch === "<" || ch === ">") return true;
  }
  return false;
}

const text = (max = 500) => value =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max && !hasControlOrAngleBracketChar(value);

const email = value =>
  typeof value === "string" && value.length <= 254 && /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);

const canonical = value => {
  try {
    const url = new URL(value);
    return (
      typeof value === "string" &&
      value.length <= 2048 &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      !/[\s\\]/u.test(value)
    );
  } catch {
    return false;
  }
};

const href = value =>
  typeof value === "string" &&
  (["#home", "#projects", "#process", "#about"].includes(value) || (value.startsWith("mailto:") && email(value.slice(7))));

function assertNoUnknownFields(value, allowedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: expected object`);
  }
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) throw new Error(`${label}.${key}: unknown field`);
  }
}

function assertField(value, predicate, label) {
  if (!predicate(value)) throw new Error(`${label}: invalid value`);
}

// {label, href} — mirrors schema.mjs's `action` shape.
export function validateAction(value, label) {
  assertNoUnknownFields(value, ["label", "href"], label);
  assertField(value.label, text(100), `${label}.label`);
  assertField(value.href, href, `${label}.href`);
  return value;
}

// Exactly two short lines — mirrors schema.mjs's `lines` shape.
export function validateLines(value, label) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(text(120))) {
    throw new Error(`${label}: expected exactly two valid lines`);
  }
  return value;
}

export function validateStack(value, label) {
  if (!Array.isArray(value) || value.length > 20 || !value.every(text(60))) {
    throw new Error(`${label}: expected a list of short strings`);
  }
  return value;
}

const SITE_SETTINGS_FIELDS = [
  "schemaVersion",
  "contentVersion",
  "locale",
  "updatedAt",
  "site",
  "seo",
  "hero",
  "process",
  "about",
  "contact",
  "projectSection",
  "footer",
];

// Validates the assembled site-settings content object field by field,
// substructure by substructure, rejecting any unknown top-level or nested
// field (AS13-F004). Does not accept or store the field set as one opaque
// JSON blob — every leaf is checked against its own predicate.
export function validateSiteSettingsContent(value) {
  assertNoUnknownFields(value, SITE_SETTINGS_FIELDS, "siteSettings");
  assertField(value.schemaVersion, v => v === "1.0.0", "siteSettings.schemaVersion");
  assertField(value.contentVersion, text(80), "siteSettings.contentVersion");
  assertField(value.locale, v => v === "en-PH", "siteSettings.locale");
  assertField(
    value.updatedAt,
    v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)),
    "siteSettings.updatedAt"
  );

  assertNoUnknownFields(value.site, ["name", "location", "timezone", "tagline"], "siteSettings.site");
  assertField(value.site.name, text(100), "siteSettings.site.name");
  assertField(value.site.location, text(160), "siteSettings.site.location");
  assertField(value.site.timezone, text(30), "siteSettings.site.timezone");
  assertField(value.site.tagline, text(200), "siteSettings.site.tagline");

  assertNoUnknownFields(value.seo, ["title", "description", "canonicalUrl"], "siteSettings.seo");
  assertField(value.seo.title, text(160), "siteSettings.seo.title");
  assertField(value.seo.description, text(320), "siteSettings.seo.description");
  assertField(value.seo.canonicalUrl, canonical, "siteSettings.seo.canonicalUrl");

  assertNoUnknownFields(
    value.hero,
    ["eyebrow", "title", "description", "primaryAction", "secondaryAction", "bridgeLabel", "bridgeStatement"],
    "siteSettings.hero"
  );
  assertField(value.hero.eyebrow, text(160), "siteSettings.hero.eyebrow");
  validateLines(value.hero.title, "siteSettings.hero.title");
  assertField(value.hero.description, text(800), "siteSettings.hero.description");
  validateAction(value.hero.primaryAction, "siteSettings.hero.primaryAction");
  validateAction(value.hero.secondaryAction, "siteSettings.hero.secondaryAction");
  assertField(value.hero.bridgeLabel, text(100), "siteSettings.hero.bridgeLabel");
  assertField(value.hero.bridgeStatement, text(500), "siteSettings.hero.bridgeStatement");

  assertNoUnknownFields(value.process, ["kicker", "title"], "siteSettings.process");
  assertField(value.process.kicker, text(160), "siteSettings.process.kicker");
  assertField(value.process.title, text(200), "siteSettings.process.title");

  assertNoUnknownFields(value.about, ["kicker", "title", "body", "quote", "quoteAttribution"], "siteSettings.about");
  assertField(value.about.kicker, text(100), "siteSettings.about.kicker");
  validateLines(value.about.title, "siteSettings.about.title");
  assertField(value.about.body, text(3000), "siteSettings.about.body");
  assertField(value.about.quote, text(800), "siteSettings.about.quote");
  assertField(value.about.quoteAttribution, text(160), "siteSettings.about.quoteAttribution");

  assertNoUnknownFields(value.contact, ["email", "callToAction", "headerLabel"], "siteSettings.contact");
  assertField(value.contact.email, email, "siteSettings.contact.email");
  assertField(value.contact.callToAction, text(160), "siteSettings.contact.callToAction");
  assertField(value.contact.headerLabel, text(100), "siteSettings.contact.headerLabel");

  assertNoUnknownFields(
    value.projectSection,
    ["kicker", "title", "description", "emptyMessage"],
    "siteSettings.projectSection"
  );
  assertField(value.projectSection.kicker, text(100), "siteSettings.projectSection.kicker");
  assertField(value.projectSection.title, text(200), "siteSettings.projectSection.title");
  assertField(value.projectSection.description, text(800), "siteSettings.projectSection.description");
  assertField(value.projectSection.emptyMessage, text(300), "siteSettings.projectSection.emptyMessage");

  assertNoUnknownFields(value.footer, ["statement", "copyright"], "siteSettings.footer");
  assertField(value.footer.statement, text(200), "siteSettings.footer.statement");
  assertField(value.footer.copyright, text(160), "siteSettings.footer.copyright");

  return value;
}

export function validateNavigationRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "label", "href"], "navigationRevision");
  assertField(value.order, v => Number.isSafeInteger(v) && v >= 0, "navigationRevision.order");
  assertField(value.label, text(100), "navigationRevision.label");
  assertField(value.href, href, "navigationRevision.href");
  return value;
}

export function validateFoundationRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "icon", "label", "href", "text"], "foundationRevision");
  assertField(value.order, v => Number.isSafeInteger(v) && v >= 0, "foundationRevision.order");
  assertField(value.icon, text(40), "foundationRevision.icon");
  assertField(value.label, text(100), "foundationRevision.label");
  assertField(value.href, href, "foundationRevision.href");
  assertField(value.text, text(160), "foundationRevision.text");
  return value;
}

export function validateProjectRevisionContent(value) {
  assertNoUnknownFields(
    value,
    ["order", "category", "title", "summary", "stack", "accent", "icon", "featured"],
    "projectRevision"
  );
  assertField(value.order, v => Number.isSafeInteger(v) && v >= 0, "projectRevision.order");
  assertField(value.category, text(100), "projectRevision.category");
  assertField(value.title, text(160), "projectRevision.title");
  assertField(value.summary, text(800), "projectRevision.summary");
  validateStack(value.stack, "projectRevision.stack");
  assertField(value.accent, v => ["gold", "blue", "red", "violet"].includes(v), "projectRevision.accent");
  assertField(value.icon, text(40), "projectRevision.icon");
  assertField(value.featured, v => typeof v === "boolean", "projectRevision.featured");
  return value;
}

export function validateServiceRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "title", "summary"], "serviceRevision");
  assertField(value.order, v => Number.isSafeInteger(v) && v >= 0, "serviceRevision.order");
  assertField(value.title, text(160), "serviceRevision.title");
  assertField(value.summary, text(800), "serviceRevision.summary");
  return value;
}

export function validateProcessStepRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "icon", "title", "text"], "processStepRevision");
  assertField(value.order, v => Number.isSafeInteger(v) && v >= 0, "processStepRevision.order");
  assertField(value.icon, text(40), "processStepRevision.icon");
  assertField(value.title, text(100), "processStepRevision.title");
  assertField(value.text, text(500), "processStepRevision.text");
  return value;
}

export function validateSectionRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "visible"], "sectionRevision");
  assertField(value.order, v => Number.isSafeInteger(v) && v >= 0, "sectionRevision.order");
  assertField(value.visible, v => typeof v === "boolean", "sectionRevision.visible");
  return value;
}

export const RESERVED_SLUGS = ["home", "projects", "process", "about", "main-content"];

export function validateProjectSlug(slug) {
  if (typeof slug !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(slug)) {
    throw new Error("project slug: invalid format");
  }
  if (RESERVED_SLUGS.includes(slug)) {
    throw new Error("project slug: reserved slug");
  }
  return slug;
}
