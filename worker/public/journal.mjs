// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// bounded public journal read API.
//
// This module is invoked ONLY for the exact `/api/journal` /
// `/api/journal/*` paths, classified by `worker/auth.mjs`'s `handleRequest`
// BEFORE the Access-authenticated admin dispatch path even runs
// (AS28-F010) — it never checks, and never needs, a Cloudflare Access
// assertion, and nothing here is reachable from any other path. It exposes
// exactly two routes, both GET, both read-only:
//
//   GET /api/journal          — published-only index, newest-published-first
//   GET /api/journal/:slug    — published-only detail, by immutable slug
//
// Every read here follows only `journal_entries.published_revision_id` —
// `draft_revision_id` is never inspected, so a draft-only or unpublished
// entry, or a historical (previously-published) revision, can never be
// returned (AS28-F004). Every response is a positive-allowlist projection:
// no storage key, uploaded_by, draft revision id, audit data, or
// Worker/config/resource identifier is ever selected, let alone returned.
const PUBLIC_JOURNAL_ROOT_PATH = "/api/journal";
const PUBLIC_JOURNAL_DETAIL_PATTERN = /^\/api\/journal\/([^/]+)$/;

export function isPublicJournalApiPath(pathname) {
  return pathname === PUBLIC_JOURNAL_ROOT_PATH || pathname.startsWith(`${PUBLIC_JOURNAL_ROOT_PATH}/`);
}

// Deliberately not shared with worker/admin/dashboard.mjs's jsonResponse:
// the public and admin dispatch modules stay fully independent (AS28-F010
// — public routes must never inherit anything from the admin path, not
// even a shared response helper), and public responses are never wrapped
// in the admin-only `Cache-Control: no-store` requirement (AS15-F008 is
// scoped to protected paths only).
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Positive metadata projection only — media id, content type, alt text,
// role, order. No storage key, no uploaded_by (RFC-009 "Public API").
const PUBLIC_JOURNAL_MEDIA_COLUMNS = "jm.media_id AS media_id, m.content_type AS content_type, m.alt_text AS alt_text, jm.role AS role, jm.sort_order AS sort_order";

async function readPublicMediaForRevisions(db, revisionIds) {
  if (revisionIds.length === 0) return new Map();
  const placeholders = revisionIds.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT jm.journal_entry_revision_id AS revision_id, ${PUBLIC_JOURNAL_MEDIA_COLUMNS} ` +
        "FROM journal_media jm " +
        "JOIN media m ON m.id = jm.media_id " +
        `WHERE jm.journal_entry_revision_id IN (${placeholders}) ` +
        "ORDER BY jm.sort_order, jm.id"
    )
    .bind(...revisionIds)
    .all();
  const byRevision = new Map();
  for (const row of result.results) {
    const list = byRevision.get(row.revision_id) ?? [];
    list.push({ id: row.media_id, contentType: row.content_type, altText: row.alt_text, role: row.role, order: row.sort_order });
    byRevision.set(row.revision_id, list);
  }
  return byRevision;
}

// GET /api/journal (RFC-009 "Public API", WEB-REQ-009): published entries
// only, newest-published-first, with a deterministic tie-break
// (published_at DESC, revision id DESC — revision ids are monotonic and
// unique, so no two entries can tie ambiguously).
async function handleIndex({ db }) {
  const result = await db
    .prepare(
      "SELECT je.slug AS slug, jer.id AS revision_id, jer.title AS title, jer.summary AS summary, jer.published_at AS published_at " +
        "FROM journal_entries je " +
        "JOIN journal_entry_revisions jer ON jer.id = je.published_revision_id AND jer.journal_entry_id = je.id " +
        "WHERE je.published_revision_id IS NOT NULL " +
        "ORDER BY jer.published_at DESC, jer.id DESC"
    )
    .all();

  const revisionIds = result.results.map(row => row.revision_id);
  const mediaByRevision = await readPublicMediaForRevisions(db, revisionIds);

  const entries = result.results.map(row => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: row.published_at,
    media: mediaByRevision.get(row.revision_id) ?? [],
  }));
  return jsonResponse(200, { entries });
}

// GET /api/journal/:slug: resolves exactly the current published_revision_id
// for that slug — never draft_revision_id, never any other historical
// revision (AS28-F004). A missing entry, an entry with no published
// revision, or an unknown slug are all indistinguishable 404s.
async function handleDetail({ db, slug }) {
  const entryRow = await db
    .prepare("SELECT id, slug, published_revision_id FROM journal_entries WHERE slug = ?")
    .bind(slug)
    .first();
  if (!entryRow || entryRow.published_revision_id === null || entryRow.published_revision_id === undefined) {
    return jsonResponse(404, { error: "Not Found" });
  }

  const revisionRow = await db
    .prepare("SELECT id, title, summary, body, published_at FROM journal_entry_revisions WHERE id = ? AND journal_entry_id = ?")
    .bind(entryRow.published_revision_id, entryRow.id)
    .first();
  if (!revisionRow) {
    return jsonResponse(404, { error: "Not Found" });
  }

  const mediaByRevision = await readPublicMediaForRevisions(db, [revisionRow.id]);
  return jsonResponse(200, {
    slug: entryRow.slug,
    title: revisionRow.title,
    summary: revisionRow.summary,
    body: revisionRow.body,
    publishedAt: revisionRow.published_at,
    media: mediaByRevision.get(revisionRow.id) ?? [],
  });
}

// The single entry point for the two exact public routes. Route/method
// classification happens before any D1 access — an unsupported method or
// unrecognized sub-path never touches the database.
export async function handlePublicJournalDispatch({ request, url, db }) {
  const pathname = url.pathname;

  if (pathname === PUBLIC_JOURNAL_ROOT_PATH) {
    if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleIndex({ db });
  }

  const match = pathname.match(PUBLIC_JOURNAL_DETAIL_PATTERN);
  if (match) {
    if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleDetail({ db, slug: match[1] });
  }

  // No other public journal sub-path exists.
  return jsonResponse(404, { error: "Not Found" });
}
