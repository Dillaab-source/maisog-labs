// WEB-INC-002 (ML-DEVOS-RFC-004 / ML-DEVOS-AS-013 / ML-DEVOS-AS-015 / D-025)
// bounded, read-only admin dashboard route dispatcher.
//
// This module is invoked ONLY as `worker/auth.mjs`'s post-authentication
// `dispatch` callback (see `handleRequest`) — it never runs, and never
// touches `env.DB`, before the WEB-INC-001 Cloudflare Access assertion has
// already been verified (AS15-F002). It exposes exactly one editorial data
// endpoint, `GET /admin/api/dashboard`, and nothing else: no create, edit,
// save, delete, publish/unpublish, upload, audit, or mutation handler of any
// kind exists here or is reachable through it (AS15-F006, AS15-F009).
import {
  readDashboardStatusRows,
  readSiteSettingsStatusRow,
  readJournalDashboardStatusRows,
  readThemeDashboardStatusRow,
} from "../d1/repository.mjs";
import { isProjectsApiPath, handleProjectsDispatch } from "./projects.mjs";
import { isMediaApiPath, handleMediaDispatch } from "./media.mjs";
import { isJournalApiPath, handleJournalDispatch } from "./journal.mjs";
import { isDesignApiPath, handleDesignDispatch } from "./design.mjs";

export const DASHBOARD_PATH = "/admin/api/dashboard";

function isAdminApiPath(pathname) {
  return pathname.startsWith("/admin/api/");
}

// Exported for worker/admin/projects.mjs (WEB-INC-003) to reuse the exact
// same response construction — same headers, same absence of any CORS
// header — rather than duplicating it.
export function jsonResponse(status, body) {
  // `Cache-Control: no-store` is applied uniformly to every protected
  // response by `worker/auth.mjs`'s `handleRequest` wrapper — not repeated
  // here — so there is exactly one place that rule can be forgotten to
  // enforce, not one per handler (AS15-F008).
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      // No CORS header is ever set here. Omission is the control: this
      // endpoint is same-origin only, and adding any
      // `Access-Control-Allow-Origin` value — permissive or not — is
      // explicitly out of scope for this increment.
    },
  });
}

// published pointer only -> published; draft pointer only -> draft; both ->
// published_with_draft; neither -> archived (AS15-F010 / ADR-003). Never a
// stored column — always derived from the two pointer values.
function deriveLifecycleState(publishedRevisionId, draftRevisionId) {
  const hasPublished = publishedRevisionId !== null && publishedRevisionId !== undefined;
  const hasDraft = draftRevisionId !== null && draftRevisionId !== undefined;
  if (hasPublished && hasDraft) return "published_with_draft";
  if (hasPublished) return "published";
  if (hasDraft) return "draft";
  return "archived";
}

// draft label -> published label -> stable id (AS15-F010).
function deriveDisplayLabel(draftLabel, publishedLabel, stableId) {
  if (typeof draftLabel === "string" && draftLabel.length > 0) return draftLabel;
  if (typeof publishedLabel === "string" && publishedLabel.length > 0) return publishedLabel;
  return stableId;
}

// draft value -> published value -> null, used for the sections-only
// order/visible summary (same precedence as the display label).
function pickDraftThenPublished(draftValue, publishedValue) {
  if (draftValue !== null && draftValue !== undefined) return draftValue;
  if (publishedValue !== null && publishedValue !== undefined) return publishedValue;
  return null;
}

// The allowlist serializer (AS15-F004): every field on the returned object
// is explicitly assigned from a named source value. There is no raw-row
// pass-through and no destructuring-with-omission of "everything except a
// few sensitive fields" — a future column added to `navigation_revisions`,
// `project_revisions`, etc. cannot become visible here without an explicit
// code change to this function.
function serializeSiteSettings(row) {
  if (!row) return null;
  return {
    id: row.id,
    state: deriveLifecycleState(row.publishedRevisionId, row.draftRevisionId),
    publishedRevisionId: row.publishedRevisionId,
    draftRevisionId: row.draftRevisionId,
    displayLabel: deriveDisplayLabel(row.draftLabel, row.publishedLabel, row.id),
  };
}

function serializeEntityRow(row, { includeSlug = false, includeSectionSummary = false } = {}) {
  const record = {
    id: row.entity_id,
    state: deriveLifecycleState(row.published_revision_id, row.draft_revision_id),
    publishedRevisionId: row.published_revision_id ?? null,
    draftRevisionId: row.draft_revision_id ?? null,
    displayLabel: deriveDisplayLabel(row.draft_label, row.published_label, row.entity_id),
  };
  if (includeSlug) {
    record.slug = row.slug;
  }
  if (includeSectionSummary) {
    const order = pickDraftThenPublished(row.draft_sort_order, row.published_sort_order);
    const rawVisible = pickDraftThenPublished(row.draft_visible, row.published_visible);
    record.order = order;
    record.visible = rawVisible === null ? null : Boolean(rawVisible);
  }
  return record;
}

// Assembles the exactly-bounded dashboard payload. Every collection read is
// a fixed, read-only projection (worker/d1/repository.mjs) — no arbitrary
// SQL, no caller-controlled table/column selection, no write of any kind.
export async function buildDashboardPayload(db) {
  const [
    siteSettingsRow,
    navigationRows,
    foundationsRows,
    projectsRows,
    servicesRows,
    processStepsRows,
    sectionsRows,
    journalRows,
    themeRow,
  ] = await Promise.all([
    readSiteSettingsStatusRow(db),
    readDashboardStatusRows(db, "navigation"),
    readDashboardStatusRows(db, "foundations"),
    readDashboardStatusRows(db, "projects"),
    readDashboardStatusRows(db, "services"),
    readDashboardStatusRows(db, "processSteps"),
    readDashboardStatusRows(db, "sections"),
    readJournalDashboardStatusRows(db),
    readThemeDashboardStatusRow(db),
  ]);

  return {
    siteSettings: serializeSiteSettings(siteSettingsRow),
    navigation: navigationRows.map(row => serializeEntityRow(row)),
    foundations: foundationsRows.map(row => serializeEntityRow(row)),
    projects: projectsRows.map(row => serializeEntityRow(row, { includeSlug: true })),
    services: servicesRows.map(row => serializeEntityRow(row)),
    processSteps: processStepsRows.map(row => serializeEntityRow(row)),
    sections: sectionsRows.map(row => serializeEntityRow(row, { includeSectionSummary: true })),
    // WEB-INC-006 (AS28-F012): bounded journal lifecycle metadata only —
    // id/slug/state/publishedRevisionId/draftRevisionId/displayLabel, the
    // exact same allowlisted shape every other entity collection above
    // already uses. No summary/body field exists anywhere on this row.
    journal: journalRows.map(row => serializeEntityRow(row, { includeSlug: true })),
    // WEB-INC-007 (RFC-010 "Dashboard integration"): bounded theme lifecycle
    // status only — id/state/publishedRevisionId/draftRevisionId. No preset
    // or numeric DESIGN-* field exists anywhere on this row (see
    // readThemeDashboardStatusRow), so no theme control value can reach the
    // dashboard payload through this path.
    theme: themeRow ? serializeEntityRow(themeRow) : null,
  };
}

// The post-authentication dispatch callback passed to `worker/auth.mjs`'s
// `handleRequest`. By construction this function only ever runs after a
// valid Cloudflare Access assertion has been verified — see `dispatch` in
// `handleRequest` — so every branch below may assume the caller is
// authenticated; none of them re-checks identity.
export async function handleAdminDispatch({ request, url, assets, db, media, sub }) {
  const pathname = url.pathname;

  if (pathname === DASHBOARD_PATH) {
    if (request.method !== "GET") {
      // Zero D1 invocation for any non-GET method (AS15-F006, AS15-F015 #9).
      return jsonResponse(405, { error: "Method Not Allowed" });
    }
    if (!db) {
      // Zero D1 invocation — the binding itself is absent (AS15-F007).
      return jsonResponse(503, { error: "Service Unavailable" });
    }
    try {
      const payload = await buildDashboardPayload(db);
      return jsonResponse(200, payload);
    } catch {
      // Never surface the underlying error message, SQL, or stack trace
      // (AS15-F007) — the caught error is discarded, not inspected.
      return jsonResponse(500, { error: "Internal Server Error" });
    }
  }

  // WEB-INC-003 (ML-DEVOS-RFC-006 / ML-DEVOS-AS-020 / D-027): the only
  // other authenticated editorial routes this repository exposes. Routed
  // here, after the dashboard check above and before the generic
  // "/admin/api/*" 404 fallback below, so the dashboard's exact existing
  // behavior is completely unchanged and no route outside this exact
  // allowlist gains mutation reach.
  if (isProjectsApiPath(pathname)) {
    return handleProjectsDispatch({ request, url, db, sub });
  }

  // WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029): the only other
  // authenticated editorial route this repository exposes. Routed here,
  // after the dashboard/projects checks above and before the generic
  // "/admin/api/*" 404 fallback below, so neither of those existing
  // behaviors changes and no route outside this exact allowlist gains
  // upload/list reach.
  if (isMediaApiPath(pathname)) {
    return handleMediaDispatch({ request, url, db, media, sub });
  }

  // WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031):
  // the only other authenticated editorial routes this repository exposes.
  // Routed here, after the dashboard/projects/media checks above and
  // before the generic "/admin/api/*" 404 fallback below, so none of those
  // existing behaviors changes and no route outside this exact allowlist
  // gains journal mutation reach.
  if (isJournalApiPath(pathname)) {
    return handleJournalDispatch({ request, url, db, sub });
  }

  // WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032): the only other
  // authenticated editorial routes this repository exposes. Routed here,
  // after the dashboard/projects/media/journal checks above and before the
  // generic "/admin/api/*" 404 fallback below, so none of those existing
  // behaviors changes and no route outside this exact allowlist gains
  // design mutation reach.
  if (isDesignApiPath(pathname)) {
    return handleDesignDispatch({ request, url, db, sub });
  }

  if (isAdminApiPath(pathname)) {
    // Any other /admin/api/* path: protected 404, zero D1 query, and never
    // fall through to static asset handling (AS15-F001).
    return jsonResponse(404, { error: "Not Found" });
  }

  // Not an admin API path — serve the protected static admin asset (the
  // dashboard shell HTML/JS) exactly as WEB-INC-001 did before this
  // increment.
  return assets.fetch(request);
}
