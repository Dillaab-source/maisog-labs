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

// Exact current contract (lib/content/schema.mjs's `record.order`): a safe
// integer in [0, 10000] — not merely `>= 0` (AS14-F003). Exported directly
// (in addition to being used by every per-revision validator below) so its
// exact boundary can be tested without constructing a full revision object.
export const order = value => Number.isSafeInteger(value) && value >= 0 && value <= 10000;

// Exact current contract (lib/content/schema.mjs's `icon` choice) — a closed
// enum, never arbitrary text (AS14-F003). Exported for the same reason.
export const ICON_VALUES = ["foundation", "experience", "systems", "security", "automation", "lab", "contact", "arrow"];
export const icon = value => ICON_VALUES.includes(value);

// Exact current contract (lib/content/schema.mjs's `meta.updatedAt`): the
// value must be a real calendar date, not merely regex-shaped + parseable —
// `Date.parse`/`new Date()` silently normalize an impossible date such as
// "2026-02-30" into a different, valid one, so the round-trip through
// `toISOString().slice(0, 10)` must reproduce the exact input (AS14-F003).
// Exported for the same reason as `order`/`icon` above.
export const isoDate = value =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

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

// Exact current contract: lib/content/schema.mjs's generic array-field cap
// is 100 entries (its `visit()` rejects any array field longer than that,
// with no per-field override for `stack`), not a narrower 20 (AS14-F003).
export function validateStack(value, label) {
  if (!Array.isArray(value) || value.length > 100 || !value.every(text(60))) {
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
  assertField(value.updatedAt, isoDate, "siteSettings.updatedAt");

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
  assertField(value.order, order, "navigationRevision.order");
  assertField(value.label, text(100), "navigationRevision.label");
  assertField(value.href, href, "navigationRevision.href");
  return value;
}

export function validateFoundationRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "icon", "label", "href", "text"], "foundationRevision");
  assertField(value.order, order, "foundationRevision.order");
  assertField(value.icon, icon, "foundationRevision.icon");
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
  assertField(value.order, order, "projectRevision.order");
  assertField(value.category, text(100), "projectRevision.category");
  assertField(value.title, text(160), "projectRevision.title");
  assertField(value.summary, text(800), "projectRevision.summary");
  validateStack(value.stack, "projectRevision.stack");
  assertField(value.accent, v => ["gold", "blue", "red", "violet"].includes(v), "projectRevision.accent");
  assertField(value.icon, icon, "projectRevision.icon");
  assertField(value.featured, v => typeof v === "boolean", "projectRevision.featured");
  return value;
}

export function validateServiceRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "title", "summary"], "serviceRevision");
  assertField(value.order, order, "serviceRevision.order");
  assertField(value.title, text(160), "serviceRevision.title");
  assertField(value.summary, text(800), "serviceRevision.summary");
  return value;
}

export function validateProcessStepRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "icon", "title", "text"], "processStepRevision");
  assertField(value.order, order, "processStepRevision.order");
  assertField(value.icon, icon, "processStepRevision.icon");
  assertField(value.title, text(100), "processStepRevision.title");
  assertField(value.text, text(500), "processStepRevision.text");
  return value;
}

export function validateSectionRevisionContent(value) {
  assertNoUnknownFields(value, ["order", "visible"], "sectionRevision");
  assertField(value.order, order, "sectionRevision.order");
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

// WEB-INC-003 (ML-DEVOS-RFC-006 / ML-DEVOS-AS-020 / D-027) addition: the
// stable `projects.id` a create-draft request supplies. Same bounded
// lowercase-hyphenated shape already used throughout this repository's
// entity ids (e.g. "project-fixture", "nav-published"), but with no
// reserved-word list of its own — reserved-word protection lives on `slug`
// (validateProjectSlug above), not on `id`.
export function validateProjectId(id) {
  if (typeof id !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(id)) {
    throw new Error("project id: invalid format");
  }
  return id;
}

// WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029) addition, amended
// by Remediation Cycle 1 (`ML-DEVOS-AS-026` `AS26-F009`): media alt text.
// RFC-007 targets "trimmed 1-300 characters" — the original implementation
// checked `value.trim().length > 0` but returned the raw, untrimmed value,
// so a value with leading/trailing whitespace could be validated yet stored
// untrimmed, disagreeing with what a caller would expect from "trimmed" and
// with `media.alt_text`'s amended `CHECK (alt_text = trim(alt_text) AND
// length(alt_text) BETWEEN 1 AND 300)` (migrations/0003_web_inc_004_media.sql)
// once the value is JS-`trim()`-normalized before that DB check ever runs.
// This now normalizes first and validates/returns the trimmed value, so the
// exact same normalized string is what gets stored and what is echoed back
// in every response (upload, list, preview) — never two different forms of
// the same input.
export function validateAltText(value) {
  if (typeof value !== "string") {
    throw new Error("media alt text: invalid value");
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 300 || hasControlOrAngleBracketChar(trimmed)) {
    throw new Error("media alt text: invalid value");
  }
  return trimmed;
}

// WEB-INC-004 addition: the closed, bounded role enum a project_media
// snapshot entry may declare — mirrors the DB-level
// `CHECK (role IN ('cover', 'gallery'))` on project_media.role.
export const MEDIA_ROLE_VALUES = ["cover", "gallery"];
export function validateMediaRole(value) {
  if (typeof value !== "string" || !MEDIA_ROLE_VALUES.includes(value)) {
    throw new Error("media role: invalid value");
  }
  return value;
}

// WEB-INC-004 addition: the server-generated media id shape — a
// lowercase `crypto.randomUUID()` value (AS23-F008). Unlike
// validateProjectId's lowercase-letter-first pattern, a UUID's first
// character is frequently a digit (any of 0-9a-f), so this validates the
// exact standard UUID shape instead. Used both to sanity-check a
// server-generated id before it is bound into SQL, and to validate a
// project_media snapshot entry's `mediaId` reference — never used to accept
// a client-supplied *new* media id.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function validateMediaId(id) {
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    throw new Error("media id: invalid format");
  }
  return id;
}

// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// addition: journal entry slug/id use the exact same bounded shape as
// `validateProjectSlug`/`validateProjectId` above, plus two journal-specific
// reserved names — `journal` (the public page route) and `api` (the public
// API prefix) — so a journal slug can never collide with a real route
// segment. Mirrors `migrations/0004_web_inc_006_journal.sql`'s
// `journal_entries.slug` CHECK exactly.
export const JOURNAL_RESERVED_SLUGS = [...RESERVED_SLUGS, "journal", "api"];

export function validateJournalSlug(slug) {
  if (typeof slug !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(slug)) {
    throw new Error("journal slug: invalid format");
  }
  if (JOURNAL_RESERVED_SLUGS.includes(slug)) {
    throw new Error("journal slug: reserved slug");
  }
  return slug;
}

export function validateJournalId(id) {
  if (typeof id !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(id)) {
    throw new Error("journal id: invalid format");
  }
  return id;
}

// Journal title/summary follow the exact same "trim first, validate/return
// the trimmed value" pattern as `validateAltText` above (AS26-F009), so the
// same normalized string is what gets stored and what every response
// echoes back — never two different forms of the same input. Bounds match
// `journal_entry_revisions`' own `title`/`summary` CHECK constraints
// exactly (1-160 / 1-800 trimmed characters).
export function validateJournalTitle(value) {
  if (typeof value !== "string") {
    throw new Error("journal title: invalid value");
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 160 || hasControlOrAngleBracketChar(trimmed)) {
    throw new Error("journal title: invalid value");
  }
  return trimmed;
}

export function validateJournalSummary(value) {
  if (typeof value !== "string") {
    throw new Error("journal summary: invalid value");
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 800 || hasControlOrAngleBracketChar(trimmed)) {
    throw new Error("journal summary: invalid value");
  }
  return trimmed;
}

// Journal body is plain text only (RFC-009 "body format ... plain text
// only" — no HTML/Markdown execution/interpolation is ever attempted
// anywhere in this repository, AS28-F006). Line endings are normalized to a
// bare `\n` before any other check runs, so a value built from CRLF/CR
// input is validated (and stored) in the same normalized form the database
// CHECK expects (`instr(body, char(13)) = 0`,
// migrations/0004_web_inc_006_journal.sql). Control characters other than
// `\n`/`\t` and angle brackets are rejected — the same defense-in-depth
// posture as every other text field in this file — and the normalized
// value must not be entirely whitespace.
export function validateJournalBody(value) {
  if (typeof value !== "string") {
    throw new Error("journal body: invalid value");
  }
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (normalized.length < 1 || normalized.length > 20000 || normalized.trim().length === 0) {
    throw new Error("journal body: invalid value");
  }
  for (const ch of normalized) {
    const code = ch.codePointAt(0);
    if ((code <= 0x1f && code !== 0x0a && code !== 0x09) || ch === "<" || ch === ">") {
      throw new Error("journal body: invalid value");
    }
  }
  return normalized;
}
