// WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029) local media
// subsystem D1 helpers.
//
// This module owns every SQL statement the media capability needs against
// the new, additive `media` / `project_media` tables
// (migrations/0003_web_inc_004_media.sql). It mirrors worker/d1/projects.mjs's
// conventions: statement-array builders for a caller to run inside one
// db.batch() call, and the same subquery-correlation pattern (keyed on
// project_revisions' existing UNIQUE (project_id, revision_number)
// constraint) to attach project_media rows to a brand-new revision whose
// autoincrement id is not yet known in JS (AS20-F010, reused here for
// AS23-F013).
import { validateMediaId, validateAltText, validateMediaRole, order as validateOrder } from "./validate.mjs";
import { ALLOWED_MEDIA_CONTENT_TYPES, MAX_MEDIA_BYTES } from "../media/signature.mjs";
import { buildAuditAppendStatement } from "./audit.mjs";

// Positive metadata projection only (AS23-F011, AS23-F014): storage_key and
// uploaded_by are never selected by any of the read helpers below — nothing
// in this increment serves raw media bytes or needs to expose the uploader
// identity or the internal object-store path outside this module.
const MEDIA_METADATA_COLUMNS = "id, content_type, size_bytes, alt_text, uploaded_at";

function mediaRowToMetadata(row) {
  return {
    id: row.id,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    altText: row.alt_text,
    uploadedAt: row.uploaded_at,
  };
}

// Read-only existence check used by the upload route before it ever writes
// anything (e.g. to reject a collided server-generated id/key up front).
// Not part of the public metadata boundary — reads every column since it is
// only used internally by the write path.
export async function readMediaRow(db, id) {
  return db.prepare("SELECT * FROM media WHERE id = ?").bind(id).first();
}

// AS23-F012: "referenced media must exist and be active." Returns only the
// rows that actually exist and are active, as a positive metadata
// projection — the caller compares the returned set against the requested
// id list to detect any missing/inactive reference.
export async function readActiveMediaRowsByIds(db, ids) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const result = await db
    .prepare(`SELECT ${MEDIA_METADATA_COLUMNS} FROM media WHERE state = 'active' AND id IN (${placeholders})`)
    .bind(...ids)
    .all();
  return result.results.map(mediaRowToMetadata);
}

// GET /admin/api/media (AS23-F011): authenticated read-only, positive
// metadata projection, newest first.
export async function listActiveMedia(db) {
  const result = await db.prepare(`SELECT ${MEDIA_METADATA_COLUMNS} FROM media WHERE state = 'active' ORDER BY uploaded_at DESC, id DESC`).all();
  return result.results.map(mediaRowToMetadata);
}

// Builds the full upload statement set: one new immutable `media` row and
// one `media_upload` / success audit row — both meant to run as a single
// db.batch() call, in the same D1 batch as required by AS23-F009/F010. The
// media id is already known (server-generated before this call, AS23-F008),
// so no subquery correlation is needed here — unlike project_revisions'
// autoincrement id, this is a plain literal bind.
export function buildMediaUploadBatch(db, { id, storageKey, contentType, sizeBytes, altText, uploadedAt, uploadedBy, actor }) {
  const validId = validateMediaId(id);
  const validAltText = validateAltText(altText);
  if (!ALLOWED_MEDIA_CONTENT_TYPES.includes(contentType)) {
    throw new Error("media content type: invalid value");
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_MEDIA_BYTES) {
    throw new Error("media size: invalid value");
  }
  if (typeof storageKey !== "string" || storageKey.length === 0 || storageKey.length > 200) {
    throw new Error("media storage key: invalid value");
  }

  return [
    db
      .prepare("INSERT INTO media (id, storage_key, content_type, size_bytes, alt_text, uploaded_at, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(validId, storageKey, contentType, sizeBytes, validAltText, uploadedAt, uploadedBy),
    buildAuditAppendStatement(db, {
      actor,
      action: "media_upload",
      entityType: "media",
      entityId: validId,
      revisionId: null,
      result: "success",
    }),
  ];
}

// AS23-F012 "inherit when edit omits media selection": reads the exact
// current snapshot of a source revision's project_media rows, positionally
// ordered, as {mediaId, role, order} entries ready to be re-inserted as the
// new revision's own snapshot.
export async function readProjectMediaSnapshot(db, projectRevisionId) {
  const result = await db
    .prepare("SELECT media_id, role, sort_order FROM project_media WHERE project_revision_id = ? ORDER BY sort_order, id")
    .bind(projectRevisionId)
    .all();
  return result.results.map(row => ({ mediaId: row.media_id, role: row.role, order: row.sort_order }));
}

// Validates a caller-supplied (or inherited) complete media snapshot list
// for a new revision (AS23-F012): each entry is exactly {mediaId, role,
// order}. Two independent duplicate checks are enforced, mirroring the two
// independent UNIQUE constraints on `project_media`
// (migrations/0003_web_inc_004_media.sql):
//
// - no (mediaId, role) pair may repeat — the same media item cannot occupy
//   the same role twice in one snapshot (the original AS23-F012 check);
// - no (role, order) pair may repeat — two *different* media items cannot
//   both claim the same display slot in one snapshot (Remediation Cycle 1,
//   `ML-DEVOS-AS-026` `AS26-F010`: the original implementation only checked
//   the first case, so two different media rows could both be inserted as
//   e.g. `role: 'gallery', order: 0`, and the database had no constraint to
//   catch it either).
//
// Both are database-backed as well (`UNIQUE (project_revision_id, media_id,
// role)` and `UNIQUE (project_revision_id, role, sort_order)`), so this is a
// fail-fast, clear-error duplicate of the DB-level guarantee, not the only
// place either is enforced.
export function validateMediaSnapshotEntries(entries) {
  if (!Array.isArray(entries) || entries.length > 50) {
    throw new Error("media snapshot: expected a bounded list of entries");
  }
  const seenAssociations = new Set();
  const seenSlots = new Set();
  return entries.map(entry => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("media snapshot entry: expected object");
    }
    for (const key of Object.keys(entry)) {
      if (!["mediaId", "role", "order"].includes(key)) {
        throw new Error(`media snapshot entry.${key}: unknown field`);
      }
    }
    const mediaId = validateMediaId(entry.mediaId);
    const role = validateMediaRole(entry.role);
    if (!validateOrder(entry.order)) {
      throw new Error("media snapshot entry.order: invalid value");
    }
    const associationKey = `${mediaId}:${role}`;
    if (seenAssociations.has(associationKey)) {
      throw new Error("media snapshot: duplicate (mediaId, role) entry");
    }
    seenAssociations.add(associationKey);
    const slotKey = `${role}:${entry.order}`;
    if (seenSlots.has(slotKey)) {
      throw new Error("media snapshot: duplicate (role, order) slot");
    }
    seenSlots.add(slotKey);
    return { mediaId, role, order: entry.order };
  });
}

// Builds the project_media INSERT statements for a brand-new revision
// (AS23-F005, AS23-F013). `projectId`/`revisionNumber` — not a raw
// project_revision_id — because at the point this batch is assembled, the
// new project_revisions row has not been inserted yet and its autoincrement
// id is unknown in JS; each statement resolves it via the same
// same-transaction subquery pattern worker/d1/audit.mjs's
// buildProjectRevisionAuditStatement already uses, keyed on
// project_revisions' existing UNIQUE (project_id, revision_number)
// constraint.
export function buildProjectMediaInsertStatements(db, { projectId, revisionNumber, entries }) {
  return entries.map(entry =>
    db
      .prepare(
        "INSERT INTO project_media (project_revision_id, media_id, role, sort_order) " +
          "VALUES ((SELECT id FROM project_revisions WHERE project_id = ? AND revision_number = ?), ?, ?, ?)"
      )
      .bind(projectId, revisionNumber, entry.mediaId, entry.role, entry.order)
  );
}
