// Dependency-free content contract. All object fields are required; extras are rejected.
const text = (max = 500) => value => typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[<>\u0000-\u001f]/u.test(value);
const choice = (...values) => value => values.includes(value);
const id = value => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const email = value => typeof value === "string" && value.length <= 254 && /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
const canonical = value => {
  try {
    const url = new URL(value);
    return typeof value === "string" && value.length <= 2048 && url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && !/[\s\\]/u.test(value);
  } catch { return false; }
};
const href = value => typeof value === "string" && (
  ["#home", "#projects", "#process", "#about"].includes(value) ||
  (value.startsWith("mailto:") && email(value.slice(7)))
);
const icon = choice("foundation", "experience", "systems", "security", "automation", "lab", "contact", "arrow");
const state = choice("draft", "published", "archived");
const record = { id, order: value => Number.isSafeInteger(value) && value >= 0 && value <= 10000, state };
const action = { label: text(100), href };
const lines = value => Array.isArray(value) && value.length === 2 && value.every(text(120));
const schema = {
  meta: {
    schemaVersion: choice("1.0.0"), contentVersion: text(80), state,
    locale: choice("en-PH"),
    updatedAt: value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
  },
  site: { name: text(100), location: text(160), timezone: text(30), tagline: text(200) },
  seo: { title: text(160), description: text(320), canonicalUrl: canonical },
  navigation: [{ ...record, ...action }],
  hero: { eyebrow: text(160), title: lines, description: text(800), primaryAction: action, secondaryAction: action, bridgeLabel: text(100), bridgeStatement: text(500) },
  foundations: [{ ...record, ...action, icon, text: text(160) }],
  projects: [{ ...record, slug: id, category: text(100), title: text(160), summary: text(800), stack: [text(60)], accent: choice("gold", "blue", "red", "violet"), icon, projectUrl: value => value === undefined || canonical(value), featured: value => typeof value === "boolean" }],
  services: [{ ...record, title: text(160), summary: text(800) }],
  process: { kicker: text(160), title: text(200), steps: [{ ...record, icon, title: text(100), text: text(500) }] },
  about: { kicker: text(100), title: lines, body: text(3000), quote: text(800), quoteAttribution: text(160) },
  contact: { email, callToAction: text(160), headerLabel: text(100) },
  projectSection: { kicker: text(100), title: text(200), description: text(800), emptyMessage: text(300) },
  footer: { statement: text(200), copyright: text(160) },
};

export function validateContent(document) {
  const errors = [];
  const ids = new Set();
  function visit(value, rule, path) {
    if (typeof rule === "function") {
      if (!rule(value)) errors.push(`${path}: invalid value`);
    } else if (Array.isArray(rule)) {
      if (!Array.isArray(value) || value.length > 100) { errors.push(`${path}: expected array of at most 100 entries`); return; }
      value.forEach((entry, index) => visit(entry, rule[0], `${path}[${index}]`));
    } else {
      if (!value || typeof value !== "object" || Array.isArray(value)) { errors.push(`${path}: expected object`); return; }
      for (const key of Object.keys(value)) if (!Object.hasOwn(rule, key)) errors.push(`${path}.${key}: unknown field`);
      for (const [key, field] of Object.entries(rule)) visit(value[key], field, `${path}.${key}`);
      if (Object.hasOwn(rule, "id") && typeof value.id === "string") {
        if (ids.has(value.id)) errors.push(`${path}.id: duplicate identifier`);
        ids.add(value.id);
      }
    }
  }
  visit(document, schema, "content");
  if (Array.isArray(document?.projects)) {
    const slugs = new Set(["home", "projects", "process", "about", "main-content"]);
    for (const project of document.projects) {
      if (slugs.has(project?.slug)) errors.push("content.projects: duplicate or reserved slug");
      slugs.add(project?.slug);
    }
  }
  if (errors.length) throw new Error(`Invalid content:\n${errors.join("\n")}`);
  return document;
}
