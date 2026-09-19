// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032) bounded public
// design read API.
//
// This module is invoked ONLY for the exact `/api/design` path — never a
// wildcard (RFC-010 "Worker routing": "No wildcard /api/design/* route is
// authorized") — classified by `worker/auth.mjs`'s `handleRequest` BEFORE
// the Access-authenticated admin dispatch path even runs, exactly like
// public Journal routing (AS28-F010 precedent). It never checks, and never
// needs, a Cloudflare Access assertion.
//
// GET /api/design — published-only, positive-allowlist, read-only. Follows
// only `theme_settings.published_revision_id` and each managed section's
// `published_revision_id` — `draft_revision_id` is never inspected for
// either, so a draft-only theme/section state can never be returned
// (AS30-F005). Never returns draft pointers, draft revisions, created_by,
// audit data, internal database ids, raw CSS/JS/HTML, storage keys, or
// resource/binding configuration.
const PUBLIC_DESIGN_PATH = "/api/design";

export function isPublicDesignApiPath(pathname) {
  return pathname === PUBLIC_DESIGN_PATH;
}

// Deliberately not shared with worker/admin/dashboard.mjs's jsonResponse or
// worker/public/journal.mjs's — each public/admin dispatch module stays
// fully independent (AS28-F010's "public routes must never inherit
// anything from the admin path" extended consistently to a second public
// module).
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const MANAGED_SECTION_IDS = ["home", "projects", "process", "about"];

// Positive-allowlist projection of a published theme revision row — exactly
// the 15 DESIGN-*-owned fields, nothing else (no id, no created_at/by).
function publicThemeFields(row) {
  return {
    heroBackgroundPreset: row.hero_background_preset,
    cardStylePreset: row.card_style_preset,
    layoutDensityPreset: row.layout_density_preset,
    typographyPreset: row.typography_preset,
    headingScalePreset: row.heading_scale_preset,
    overlayIntensity: row.overlay_intensity,
    panelPreset: row.panel_preset,
    animationPreset: row.animation_preset,
    reducedMotionMode: row.reduced_motion_mode,
    projectRailMode: row.project_rail_mode,
    journalCardMode: row.journal_card_mode,
    accentPreset: row.accent_preset,
    panelOpacityPct: row.panel_opacity_pct,
    borderIntensityPct: row.border_intensity_pct,
    radiusScalePct: row.radius_scale_pct,
  };
}

async function readPublishedTheme(db) {
  const row = await db
    .prepare(
      "SELECT r.* FROM theme_settings t " +
        "JOIN theme_settings_revisions r ON r.id = t.published_revision_id AND r.theme_settings_id = t.id " +
        "WHERE t.id = 'default' AND t.published_revision_id IS NOT NULL"
    )
    .first();
  return row ? publicThemeFields(row) : null;
}

async function readPublishedSections(db) {
  const placeholders = MANAGED_SECTION_IDS.map(() => "?").join(", ");
  const result = await db
    .prepare(
      "SELECT s.id AS id, r.sort_order AS sort_order, r.visible AS visible " +
        "FROM sections s " +
        "JOIN section_revisions r ON r.id = s.published_revision_id AND r.section_id = s.id " +
        `WHERE s.id IN (${placeholders}) AND s.published_revision_id IS NOT NULL`
    )
    .bind(...MANAGED_SECTION_IDS)
    .all();
  const byId = new Map(result.results.map(row => [row.id, { order: row.sort_order, visible: Boolean(row.visible) }]));
  const sections = {};
  for (const id of MANAGED_SECTION_IDS) {
    sections[id] = byId.get(id) ?? null;
  }
  return sections;
}

// GET /api/design (RFC-010 "Public design API"): the currently published
// theme values plus published section visibility/order for exactly
// home/projects/process/about. If no valid published theme exists, `theme`
// is null and the public runtime (app/DesignRuntime.js) falls back to the
// static V3 + soft-geometry baseline (AS30-F007) — this is not a 404/500,
// since "no theme yet" is a valid (if unexpected, given the migration
// bootstrap) response shape a resilient client must already handle.
async function handleGet({ db }) {
  const [theme, sections] = await Promise.all([readPublishedTheme(db), readPublishedSections(db)]);
  return jsonResponse(200, { theme, sections });
}

// The single entry point for the one exact public route. Route/method
// classification happens before any D1 access — an unsupported method
// never touches the database. Any other path is never routed here at all
// (worker/auth.mjs's isPublicDesignApiPath is an exact match, not a
// prefix), so it falls through to ordinary asset/404 handling.
export async function handlePublicDesignDispatch({ request, db }) {
  if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
  if (!db) return jsonResponse(503, { error: "Service Unavailable" });
  return handleGet({ db });
}
