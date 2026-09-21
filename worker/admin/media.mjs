// WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029) bounded local
// media route dispatcher.
//
// Invoked ONLY as a sub-dispatch of `worker/admin/dashboard.mjs`'s
// `handleAdminDispatch`, which itself runs only after `worker/auth.mjs`'s
// WEB-INC-001 Cloudflare Access verification has already succeeded — no
// branch here re-checks identity. Exposes exactly the two routes AS23-F006/
// F011 authorize and nothing else: no generic upload endpoint, no media
// update/delete route.
//
// Required boundary for the mutating route (AS23-F006):
// VALID ACCESS -> BOUNDED SUBJECT -> SAME ORIGIN -> MEDIA VALIDATION ->
// LOCAL R2/D1 WRITE.
import { jsonResponse } from "./dashboard.mjs";
import { detectImageContentType, ALLOWED_MEDIA_CONTENT_TYPES, EXTENSION_FOR_CONTENT_TYPE, MAX_MEDIA_BYTES } from "../media/signature.mjs";
import { listActiveMedia, buildMediaUploadBatch } from "../d1/media.mjs";
import { appendAuditEvent } from "../d1/audit.mjs";
import { validateAltText } from "../d1/validate.mjs";

export const MEDIA_UPLOAD_PATH = "/admin/api/media";
const ALT_TEXT_HEADER = "X-Media-Alt-Text";

export function isMediaApiPath(pathname) {
  return pathname === MEDIA_UPLOAD_PATH;
}

function auditActor(sub) {
  return `cf-access:${sub}`;
}

// Deliberately not shared with worker/admin/projects.mjs's
// readBoundedBodyBytes: the two request bodies mean different things (a
// JSON mutation payload vs. a raw binary object), and keeping this
// implementation separate avoids any risk of regressing the already
// Architect-reviewed AS21-F009 byte-accurate JSON body budget. Same
// technique — a real byte budget enforced while streaming, with an early
// Content-Length reject — applied to a raw binary body instead.
async function readBoundedMediaBodyBytes(request, maxBytes) {
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength !== null) {
    const parsed = Number(declaredLength);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      return { tooLarge: true };
    }
  }

  if (!request.body) {
    return { bytes: new Uint8Array(0) };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return { tooLarge: true };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes };
}

async function tryAppendFailureAudit(db, { actor, entityId }) {
  try {
    await appendAuditEvent(db, { actor, action: "media_upload", entityType: "media", entityId, revisionId: null, result: "failure" });
  } catch {
    // Never let a failure-audit storage error surface to the caller or
    // change the response already decided (mirrors worker/admin/projects.mjs).
  }
}

// POST /admin/api/media (AS23-F006/F007/F008/F009/F010).
async function handleUpload({ request, url, db, media, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const origin = request.headers.get("Origin");
  if (!origin || origin !== url.origin) {
    return jsonResponse(403, { error: "Forbidden" });
  }

  const declaredContentType = (request.headers.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_MEDIA_CONTENT_TYPES.includes(declaredContentType)) {
    return jsonResponse(415, { error: "Unsupported Media Type" });
  }

  // Remediation Cycle 1 (`ML-DEVOS-AS-026` `AS26-F009`): normalize (trim)
  // and validate the alt text here, once, immediately after decoding —
  // `altText` from this point on is always the exact same trimmed string
  // that `buildMediaUploadBatch` stores and this handler echoes back, never
  // two different forms of the same input.
  const rawAltTextHeader = request.headers.get(ALT_TEXT_HEADER);
  let altText;
  try {
    if (rawAltTextHeader === null) throw new Error("missing alt text header");
    altText = validateAltText(decodeURIComponent(rawAltTextHeader));
  } catch {
    return jsonResponse(400, { error: "Validation failed" });
  }

  const { tooLarge, bytes } = await readBoundedMediaBodyBytes(request, MAX_MEDIA_BYTES);
  if (tooLarge) {
    return jsonResponse(413, { error: "Payload Too Large" });
  }
  if (!bytes || bytes.byteLength === 0) {
    return jsonResponse(400, { error: "Validation failed" });
  }

  // Do not trust Content-Type alone (AS23-F007): the declared type must
  // match the body's own bounded file signature, or the upload is rejected.
  // This also rejects SVG and any other unsupported/arbitrary content by
  // construction, since detectImageContentType never returns a match for it.
  const detectedContentType = detectImageContentType(bytes);
  if (!detectedContentType || detectedContentType !== declaredContentType) {
    return jsonResponse(400, { error: "Validation failed" });
  }

  const actor = auditActor(sub);
  const id = crypto.randomUUID();
  const extension = EXTENSION_FOR_CONTENT_TYPE[detectedContentType];
  const storageKey = `media/${id}.${extension}`;
  const uploadedAt = new Date().toISOString();

  let statements;
  try {
    statements = buildMediaUploadBatch(db, {
      id,
      storageKey,
      contentType: detectedContentType,
      sizeBytes: bytes.byteLength,
      altText,
      uploadedAt,
      uploadedBy: actor,
      actor,
    });
  } catch {
    return jsonResponse(400, { error: "Validation failed" });
  }

  // AS23-F009 ordering: write the object to local R2 before any D1 write.
  try {
    await media.put(storageKey, bytes, { httpMetadata: { contentType: detectedContentType } });
  } catch {
    // Object write failed: no D1 success state is ever attempted.
    await tryAppendFailureAudit(db, { actor, entityId: id });
    return jsonResponse(500, { error: "Internal Server Error" });
  }

  try {
    await db.batch(statements);
  } catch {
    // Object write succeeded but the D1 batch failed: attempt a
    // compensating delete of the just-created object (AS23-F009). Its own
    // failure still results in overall request failure — an orphaned R2
    // object with no D1 media row is a documented operational limitation
    // (coordination/IMPLEMENTER_HANDOFF.md), never fabricated D1 consistency.
    await media.delete(storageKey).catch(() => {});
    await tryAppendFailureAudit(db, { actor, entityId: id });
    return jsonResponse(500, { error: "Internal Server Error" });
  }

  return jsonResponse(201, {
    id,
    contentType: detectedContentType,
    sizeBytes: bytes.byteLength,
    altText,
    uploadedAt,
  });
}

// GET /admin/api/media (AS23-F011): authenticated read-only, positive
// metadata projection.
async function handleList({ db }) {
  const rows = await listActiveMedia(db);
  return jsonResponse(200, { media: rows });
}

// The single entry point invoked by worker/admin/dashboard.mjs for the
// `/admin/api/media` path. Route/method classification happens before any
// binding-presence check (mirrors AS21-F010): an unsupported method never
// requires a DB/R2 binding at all.
export async function handleMediaDispatch({ request, url, db, media, sub }) {
  if (url.pathname !== MEDIA_UPLOAD_PATH) {
    return jsonResponse(404, { error: "Not Found" });
  }

  if (request.method === "GET") {
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleList({ db });
  }

  if (request.method === "POST") {
    if (!db || !media) return jsonResponse(503, { error: "Service Unavailable" });
    return handleUpload({ request, url, db, media, sub });
  }

  return jsonResponse(405, { error: "Method Not Allowed" });
}
