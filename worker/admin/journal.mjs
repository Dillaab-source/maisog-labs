// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// bounded journal mutation route dispatcher.
//
// Invoked ONLY as a sub-dispatch of `worker/admin/dashboard.mjs`'s
// `handleAdminDispatch`, which itself runs only after `worker/auth.mjs`'s
// WEB-INC-001 Cloudflare Access verification has already succeeded
// (AS15-F002/AS20-F003) — no branch here re-checks identity, and none of
// them can be reached before that verification. Exposes exactly the five
// routes AS28-F009 authorizes and nothing else: no journal delete, no
// generic mutation API, no slug rename.
//
// This module mirrors worker/admin/projects.mjs's exact request-hardening
// and stale-write-protection conventions (AS28-F009 "mirror the accepted
// project lifecycle controls"). Its bounded body reader and request/pointer
// helpers are deliberately a separate, self-contained copy rather than a
// shared import — the same design choice already made for
// worker/admin/media.mjs — so nothing here can regress the already-reviewed
// project-mutation code.
import { jsonResponse } from "./dashboard.mjs";
import {
  readJournalEntryForMutation,
  readJournalEntryRevisionRow,
  revisionRowToDomainFields,
  validateJournalRevisionContent,
  buildCreateDraftBatch,
  buildEditDraftBatch,
  buildPublishBatch,
  buildUnpublishBatch,
} from "../d1/journal.mjs";
import { validateJournalId } from "../d1/validate.mjs";
import { appendAuditEvent } from "../d1/audit.mjs";
import { validateMediaSnapshotEntries, readActiveMediaRowsByIds, readJournalMediaSnapshot } from "../d1/media.mjs";

const JOURNAL_ROOT_PATH = "/admin/api/journal";
const JOURNAL_SUBROUTE_PATTERN = /^\/admin\/api\/journal\/([^/]+)\/(draft|preview|publish|unpublish)$/;

// Same-origin + JSON + bounded body (mirrors AS20-F004), sized generously
// for a journal body up to 20,000 characters (worst case 4 bytes/char in
// UTF-8) plus title/summary/media-array overhead, while still being a firm,
// explicit bound rather than "whatever the runtime allows".
const MAX_JOURNAL_MUTATION_BODY_BYTES = 96 * 1024;

export function isJournalApiPath(pathname) {
  return pathname === JOURNAL_ROOT_PATH || pathname.startsWith(`${JOURNAL_ROOT_PATH}/`);
}

function deriveLifecycleState(publishedRevisionId, draftRevisionId) {
  const hasPublished = publishedRevisionId !== null && publishedRevisionId !== undefined;
  const hasDraft = draftRevisionId !== null && draftRevisionId !== undefined;
  if (hasPublished && hasDraft) return "published_with_draft";
  if (hasPublished) return "published";
  if (hasDraft) return "draft";
  return "archived";
}

// Positive-allowlist mutation response: only bounded status fields, never a
// raw D1 row.
function journalStatusResponse(row, { revisionId } = {}) {
  const body = {
    id: row.id,
    slug: row.slug,
    state: deriveLifecycleState(row.published_revision_id, row.draft_revision_id),
    publishedRevisionId: row.published_revision_id ?? null,
    draftRevisionId: row.draft_revision_id ?? null,
  };
  if (revisionId !== undefined) body.revisionId = revisionId;
  return body;
}

function auditActor(sub) {
  return `cf-access:${sub}`;
}

async function tryAppendFailureAudit(db, { actor, action, entityId, revisionId = null }) {
  try {
    await appendAuditEvent(db, { actor, action, entityType: "journal_entry", entityId, revisionId, result: "failure" });
  } catch {
    // Storage failure while recording a failure audit must never make the
    // original request look successful, and must never itself crash the
    // response path.
  }
}

function safeEntityIdOrUnassigned(id) {
  try {
    return validateJournalId(id);
  } catch {
    return "unassigned";
  }
}

// Byte-accurate bounded body reader — a deliberately separate copy of the
// same technique already accepted for projects (AS21-F009) and media, not
// a shared import (see module header).
async function readBoundedBodyBytes(request, maxBytes) {
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

async function readAndValidateMutationRequest(request, url) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== url.origin) {
    return { error: jsonResponse(403, { error: "Forbidden" }) };
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { error: jsonResponse(415, { error: "Unsupported Media Type" }) };
  }

  const { tooLarge, bytes } = await readBoundedBodyBytes(request, MAX_JOURNAL_MUTATION_BODY_BYTES);
  if (tooLarge) {
    return { error: jsonResponse(413, { error: "Payload Too Large" }) };
  }

  let body;
  try {
    const rawBody = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    body = JSON.parse(rawBody);
  } catch {
    return { error: jsonResponse(400, { error: "Malformed JSON body" }) };
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: jsonResponse(400, { error: "Malformed JSON body" }) };
  }

  return { body };
}

function readExpectedPointers(body) {
  const { expectedPublishedRevisionId, expectedDraftRevisionId } = body;
  const isValidPointer = value => value === null || (Number.isSafeInteger(value) && value >= 1);
  if (!("expectedPublishedRevisionId" in body) || !("expectedDraftRevisionId" in body)) {
    return null;
  }
  if (!isValidPointer(expectedPublishedRevisionId) || !isValidPointer(expectedDraftRevisionId)) {
    return null;
  }
  return { expectedPublishedRevisionId, expectedDraftRevisionId };
}

function pointersMatch(row, expected) {
  const currentPublished = row.published_revision_id ?? null;
  const currentDraft = row.draft_revision_id ?? null;
  return currentPublished === expected.expectedPublishedRevisionId && currentDraft === expected.expectedDraftRevisionId;
}

async function classifyMutationBatchFailure(db, id, expected) {
  try {
    const current = await readJournalEntryForMutation(db, id);
    if (current && pointersMatch(current, expected)) {
      return 500;
    }
    return 409;
  } catch {
    return 500;
  }
}

// AS28-F008: "referenced media must exist and be active." Validates the
// shape of a caller-supplied media snapshot, then independently confirms
// every referenced media id actually resolves to an active row.
async function resolveMediaSnapshotEntries(db, rawEntries) {
  const entries = validateMediaSnapshotEntries(rawEntries);
  if (entries.length === 0) return entries;
  const uniqueIds = [...new Set(entries.map(entry => entry.mediaId))];
  const activeRows = await readActiveMediaRowsByIds(db, uniqueIds);
  if (activeRows.length !== uniqueIds.length) {
    throw new Error("media snapshot: one or more referenced media ids are missing or inactive");
  }
  return entries;
}

// "Source revision: existing draft if present; otherwise current published
// revision" (RFC-009 "Edit draft").
async function inheritedMediaEntries(db, expected) {
  const sourceRevisionId = expected.expectedDraftRevisionId ?? expected.expectedPublishedRevisionId;
  if (sourceRevisionId === null || sourceRevisionId === undefined) return [];
  return readJournalMediaSnapshot(db, sourceRevisionId);
}

// POST /admin/api/journal — create draft.
async function handleCreateDraft({ request, url, db, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;

  const rawId = typeof body.id === "string" ? body.id : null;
  const auditEntityId = rawId ? safeEntityIdOrUnassigned(rawId) : "unassigned";
  const actor = auditActor(sub);

  let validId;
  let fields;
  try {
    validId = validateJournalId(body.id);
    fields = validateJournalRevisionContent({ title: body.title, summary: body.summary, body: body.body });
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "journal_create_draft", entityId: auditEntityId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  // RFC-009 "Create draft": create has no prior revision to inherit from,
  // so an omitted `media` field simply means an empty snapshot.
  let mediaEntries;
  try {
    mediaEntries = "media" in body ? await resolveMediaSnapshotEntries(db, body.media) : [];
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "journal_create_draft", entityId: auditEntityId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const createdAt = new Date().toISOString();
  const slug = body.slug;

  let statements;
  try {
    statements = buildCreateDraftBatch(db, { id: validId, slug, fields, createdAt, createdBy: actor, actor, mediaEntries });
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "journal_create_draft", entityId: validId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  try {
    await db.batch(statements);
  } catch {
    // A UNIQUE/PRIMARY KEY conflict (duplicate id/slug) or any other D1
    // failure aborts the whole batch — no partial entry/revision row and
    // no false-success audit row was written.
    await tryAppendFailureAudit(db, { actor, action: "journal_create_draft", entityId: validId });
    return jsonResponse(409, { error: "Conflict" });
  }

  const row = await readJournalEntryForMutation(db, validId);
  return jsonResponse(201, journalStatusResponse(row, { revisionId: row.draft_revision_id }));
}

// PUT /admin/api/journal/:id/draft — edit draft.
async function handleEditDraft({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  const row = await readJournalEntryForMutation(db, id);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "journal_edit_draft", entityId: safeEntityIdOrUnassigned(id) });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "journal_edit_draft", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "journal_edit_draft", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  let fields;
  try {
    fields = validateJournalRevisionContent({ title: body.title, summary: body.summary, body: body.body });
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "journal_edit_draft", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }

  // RFC-009 "Edit draft": an explicit `media` field is the complete
  // replacement snapshot for the new revision; omitting the field entirely
  // inherits the source revision's associations.
  let mediaEntries;
  try {
    mediaEntries = "media" in body ? await resolveMediaSnapshotEntries(db, body.media) : await inheritedMediaEntries(db, expected);
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "journal_edit_draft", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const createdAt = new Date().toISOString();
  let statements;
  try {
    statements = await buildEditDraftBatch(db, {
      id,
      fields,
      createdAt,
      createdBy: actor,
      actor,
      expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
      expectedDraftRevisionId: expected.expectedDraftRevisionId,
      mediaEntries,
    });
    await db.batch(statements);
  } catch {
    // Commit-time stale-write guard fired, or some other storage failure —
    // classifyMutationBatchFailure distinguishes them.
    const status = await classifyMutationBatchFailure(db, id, expected);
    await tryAppendFailureAudit(db, { actor, action: "journal_edit_draft", entityId: id });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readJournalEntryForMutation(db, id);
  return jsonResponse(200, journalStatusResponse(updated, { revisionId: updated.draft_revision_id }));
}

// AS28-F004/RFC-009 "Preview": exact-draft media metadata only.
async function draftMediaPreview(db, draftRevisionId) {
  const snapshot = await readJournalMediaSnapshot(db, draftRevisionId);
  if (snapshot.length === 0) return [];
  const uniqueIds = [...new Set(snapshot.map(entry => entry.mediaId))];
  const activeRows = await readActiveMediaRowsByIds(db, uniqueIds);
  const metadataById = new Map(activeRows.map(row => [row.id, row]));
  return snapshot
    .map(entry => {
      const metadata = metadataById.get(entry.mediaId);
      if (!metadata) return null;
      return { ...metadata, role: entry.role, order: entry.order };
    })
    .filter(entry => entry !== null);
}

// GET /admin/api/journal/:id/preview — read-only, draft-only.
async function handlePreview({ db, id }) {
  const row = await readJournalEntryForMutation(db, id);
  if (!row || row.draft_revision_id === null || row.draft_revision_id === undefined) {
    return jsonResponse(404, { error: "Not Found" });
  }
  const revisionRow = await readJournalEntryRevisionRow(db, row.draft_revision_id);
  if (!revisionRow) {
    return jsonResponse(404, { error: "Not Found" });
  }
  const fields = revisionRowToDomainFields(revisionRow);
  const media = await draftMediaPreview(db, row.draft_revision_id);
  return jsonResponse(200, {
    id: row.id,
    slug: row.slug,
    state: deriveLifecycleState(row.published_revision_id, row.draft_revision_id),
    draftRevisionId: row.draft_revision_id,
    ...fields,
    media,
  });
}

// POST /admin/api/journal/:id/publish.
async function handlePublish({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  const row = await readJournalEntryForMutation(db, id);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "journal_publish", entityId: safeEntityIdOrUnassigned(id) });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "journal_publish", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "journal_publish", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  if (row.draft_revision_id === null || row.draft_revision_id === undefined) {
    await tryAppendFailureAudit(db, { actor, action: "journal_publish", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  // RFC-009 "Publish": full server-side revalidation of the exact persisted
  // draft — content AND referenced media must still be valid/active —
  // before promoting it. Never trust that a prior write remains valid
  // without re-checking.
  const revisionRow = await readJournalEntryRevisionRow(db, row.draft_revision_id);
  try {
    if (!revisionRow) throw new Error("draft revision row missing");
    validateJournalRevisionContent(revisionRowToDomainFields(revisionRow));
    const snapshot = await readJournalMediaSnapshot(db, row.draft_revision_id);
    if (snapshot.length > 0) {
      const uniqueIds = [...new Set(snapshot.map(entry => entry.mediaId))];
      const activeRows = await readActiveMediaRowsByIds(db, uniqueIds);
      if (activeRows.length !== uniqueIds.length) {
        throw new Error("draft media snapshot references missing/inactive media");
      }
    }
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "journal_publish", entityId: id, revisionId: row.draft_revision_id });
    return jsonResponse(500, { error: "Internal Server Error" });
  }

  try {
    await db.batch(
      buildPublishBatch(db, {
        id,
        draftRevisionId: row.draft_revision_id,
        expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
        expectedDraftRevisionId: expected.expectedDraftRevisionId,
        actor,
      })
    );
  } catch {
    const status = await classifyMutationBatchFailure(db, id, expected);
    await tryAppendFailureAudit(db, { actor, action: "journal_publish", entityId: id, revisionId: row.draft_revision_id });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readJournalEntryForMutation(db, id);
  return jsonResponse(200, journalStatusResponse(updated, { revisionId: updated.published_revision_id }));
}

// POST /admin/api/journal/:id/unpublish.
async function handleUnpublish({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  const row = await readJournalEntryForMutation(db, id);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "journal_unpublish", entityId: safeEntityIdOrUnassigned(id) });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "journal_unpublish", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "journal_unpublish", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  if (row.published_revision_id === null || row.published_revision_id === undefined) {
    await tryAppendFailureAudit(db, { actor, action: "journal_unpublish", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  try {
    await db.batch(
      buildUnpublishBatch(db, {
        id,
        publishedRevisionId: row.published_revision_id,
        expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
        expectedDraftRevisionId: expected.expectedDraftRevisionId,
        actor,
      })
    );
  } catch {
    const status = await classifyMutationBatchFailure(db, id, expected);
    await tryAppendFailureAudit(db, { actor, action: "journal_unpublish", entityId: id, revisionId: row.published_revision_id });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readJournalEntryForMutation(db, id);
  return jsonResponse(200, journalStatusResponse(updated, { revisionId: row.published_revision_id }));
}

// The single entry point invoked by worker/admin/dashboard.mjs for every
// `/admin/api/journal` / `/admin/api/journal/*` path. Route/method
// classification happens before the `!db` check (mirrors AS21-F010): an
// unsupported sub-route or wrong method never requires a DB binding at
// all.
export async function handleJournalDispatch({ request, url, db, sub }) {
  const pathname = url.pathname;

  if (pathname === JOURNAL_ROOT_PATH) {
    if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleCreateDraft({ request, url, db, sub });
  }

  const match = pathname.match(JOURNAL_SUBROUTE_PATTERN);
  if (match) {
    const [, id, action] = match;
    if (action === "draft") {
      if (request.method !== "PUT") return jsonResponse(405, { error: "Method Not Allowed" });
      if (!db) return jsonResponse(503, { error: "Service Unavailable" });
      return handleEditDraft({ request, url, db, sub, id });
    }
    if (action === "preview") {
      if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
      if (!db) return jsonResponse(503, { error: "Service Unavailable" });
      return handlePreview({ db, id });
    }
    if (action === "publish") {
      if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
      if (!db) return jsonResponse(503, { error: "Service Unavailable" });
      return handlePublish({ request, url, db, sub, id });
    }
    if (action === "unpublish") {
      if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
      if (!db) return jsonResponse(503, { error: "Service Unavailable" });
      return handleUnpublish({ request, url, db, sub, id });
    }
  }

  // No journal delete route, no generic mutation route — anything else
  // under /admin/api/journal/* is protected 404.
  return jsonResponse(404, { error: "Not Found" });
}
