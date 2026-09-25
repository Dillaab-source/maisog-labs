// Website Redesign V1 (D-076 / ML-DEVOS-AS-104, docs/product/WEBSITE_REDESIGN_V1_PLAN.md):
// the fixed spatial route vocabulary and the pure, DOM-free derivations the
// public shell and app/DesignRuntime.js share. Nothing here accepts a
// selector, CSS, HTML, script or URL from content or from the design API.

// Dispatched on window by app/DesignRuntime.js after it applies a design
// payload; carries no data.
export const DESIGN_APPLIED_EVENT = "maisog:design-applied";

// The four spatial destinations, in their default trigger order. `section`
// is the fixed WEB-INC-007 managed ID each route presents (plan §19);
// Research is deliberately unmanaged (it is the public Journal feature).
export const ROUTES = Object.freeze([
  Object.freeze({ id: "systems", index: "01", label: "Systems", section: "process", slot: 1 }),
  Object.freeze({ id: "projects", index: "02", label: "Projects", section: "projects", slot: 2 }),
  Object.freeze({ id: "research", index: "03", label: "Research", section: null, slot: 3 }),
  Object.freeze({ id: "contact", index: "04", label: "Contact", section: "about", slot: 4 }),
]);

export const ROUTE_IDS = Object.freeze(ROUTES.map(route => route.id));

// Legacy long-scroll anchors that still resolve to their spatial surface.
const LEGACY_ALIASES = Object.freeze({ process: "systems", about: "contact" });

// Resolve a location.hash to a route. No hash, `#home`, or any hash that is
// not a known route means Entry (`route: null`). `canonical` is set only when
// the address bar should be rewritten (a legacy alias).
export function resolveHash(hash) {
  const key = typeof hash === "string" ? hash.replace(/^#/, "") : "";
  if (ROUTE_IDS.includes(key)) return { route: key, canonical: null };
  if (Object.hasOwn(LEGACY_ALIASES, key)) return { route: LEGACY_ALIASES[key], canonical: `#${LEGACY_ALIASES[key]}` };
  return { route: null, canonical: null };
}

// WEB-INC-007 compatibility (plan §19): published section order may only
// permute the three managed route triggers among their own default slots
// (1, 2, 4); Research keeps slot 3. If any of the three lacks a valid
// published order, the default order is kept (fail-safe baseline).
const validOrder = entry => entry && typeof entry === "object" && Number.isSafeInteger(entry.order) && entry.order >= 0 && entry.order <= 20;

export function managedTriggerSlots(sections) {
  const managed = ROUTES.filter(route => route.section);
  const defaults = Object.fromEntries(managed.map(route => [route.section, route.slot]));
  if (!sections || typeof sections !== "object" || !managed.every(route => validOrder(sections[route.section]))) return defaults;
  const slots = managed.map(route => route.slot);
  const ranked = [...managed].sort((a, b) => sections[a.section].order - sections[b.section].order || a.slot - b.slot);
  return Object.fromEntries(ranked.map((route, position) => [route.section, slots[position]]));
}

// Systems relationships are derived only from published project content: a
// project relates to a discipline when its category or one of its stack tags
// exactly names one of that discipline's terms; two disciplines connect only
// through a project related to both. Nothing is inferred beyond that.
const norm = value => String(value).trim().toUpperCase();

export function relatedProjects(discipline, projects) {
  const terms = new Set(discipline.terms.map(norm));
  if (!terms.size) return [];
  return projects.filter(project => [project.category, ...project.stack].some(value => terms.has(norm(value))));
}

export function disciplineGraph(disciplines, projects) {
  const related = Object.fromEntries(disciplines.map(d => [d.id, relatedProjects(d, projects).map(p => p.id)]));
  const edges = [];
  for (let i = 0; i < disciplines.length; i += 1) {
    for (let j = i + 1; j < disciplines.length; j += 1) {
      const a = disciplines[i].id;
      const b = disciplines[j].id;
      const via = related[a].filter(id => related[b].includes(id));
      if (via.length) edges.push({ a, b, via });
    }
  }
  const nodes = disciplines.map(d => ({
    id: d.id,
    label: d.label,
    text: d.text,
    projects: related[d.id],
    connections: edges.filter(e => e.a === d.id || e.b === d.id).map(e => ({ id: e.a === d.id ? e.b : e.a, via: e.via })),
  }));
  return { nodes, edges };
}

// The effective public motion mode (plan §15). `off` wins over everything:
// the user's prefers-reduced-motion, WEB-INC-007 always-reduced, or the
// published `off` animation preset.
export function motionMode({ prefersReduced, reducedMotionMode, animation }) {
  if (prefersReduced || reducedMotionMode === "always-reduced" || animation === "off") return "off";
  if (animation === "minimal") return "minimal";
  return "calm";
}
