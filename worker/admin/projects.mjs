// WEB-INC-003 (ML-DEVOS-RFC-006 / ML-DEVOS-AS-020 / D-027) bounded project
// mutation route dispatcher.
//
// Invoked ONLY as a sub-dispatch of `worker/admin/dashboard.mjs`'s
// `handleAdminDispatch`, which itself runs only after `worker/auth.mjs`'s
// WEB-INC-001 Cloudflare Access verification has already succeeded
// (AS15-F002/AS20-F003) — no branch here re-checks identity, and none of
// them can be reached before that verification. Exposes exactly the five
// routes AS20-F002 authorizes and nothing else: no project delete, no
// generic mutation API, no other content-domain mutation.
import { jsonResponse } from "./dashboard.mjs";
import { validateProjectId, validateProjectSlug, validateProjectRevisionContent } from "../d1/validate.mjs";
import { appendAuditEvent } from "../d1/audit.mjs";
import {
  readProjectForMutation,
  readProjectRevisionRow,
  revisionRowToDomainFields,
  buildCreateDraftBatch,
  buildEditDraftBatch,
  buildPublishBatch,
  buildUnpublishBatch,
  buildInitialActivationBatch,
  isHomepageEligible,
  isInitialHomepageActivationDone,
  INITIAL_ACTIVATION_AUDIT_ACTION,
  INITIAL_ACTIVATION_ENTITY_TYPE,
  INITIAL_ACTIVATION_ENTITY_ID,
} from "../d1/projects.mjs";
import { countPublishedHomepageProjects } from "../bridge/snapshot.mjs";
import { MAX_HOMEPAGE_PROJECTS, INITIAL_ACTIVATION_PROJECT_NAMES, initialReleaseReadiness } from "../bridge/payload.mjs";
import { validateMediaSnapshotEntries, readActiveMediaRowsByIds, readProjectMediaSnapshot } from "../d1/media.mjs";
import { validateCaseStudyEnabled } from "../projects/case-studies.mjs";

const PROJECTS_ROOT_PATH = "/admin/api/projects";
// D-111 (AS137-F001): the one initial homepage activation route. A single
// path segment, so it can never collide with /admin/api/projects/:id/:action.
const INITIAL_ACTIVATION_PATH = "/admin/api/projects/initial-activation";
const PROJECT_SUBROUTE_PATTERN = /^\/admin\/api\/projects\/([^/]+)\/(draft|preview|publish|unpublish)$/;

// Same-origin + JSON + bounded body (AS20-F004). 32 KiB is generous for a
// single project record (the largest legacy field, about.body, is bounded
// to 3000 chars elsewhere in this repository) while still being a firm,
// explicit bound rather than "whatever the runtime allows".
const MAX_MUTATION_BODY_BYTES = 32 * 1024;

export function isProjectsApiPath(pathname) {
  return pathname === PROJECTS_ROOT_PATH || pathname.startsWith(`${PROJECTS_ROOT_PATH}/`);
}

function deriveLifecycleState(publishedRevisionId, draftRevisionId) {
  const hasPublished = publishedRevisionId !== null && publishedRevisionId !== undefined;
  const hasDraft = draftRevisionId !== null && draftRevisionId !== undefined;
  if (hasPublished && hasDraft) return "published_with_draft";
  if (hasPublished) return "published";
  if (hasDraft) return "draft";
  return "archived";
}

// Positive-allowlist mutation response (RFC-006 "Response boundary"): only
// bounded status fields, never a raw D1 row.
function projectStatusResponse(row, { revisionId } = {}) {
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

// A bounded, printable, non-secret opaque actor reference derived only from
// the verified Access subject (D-026/D-027 identity boundary) — never the
// full JWT, email, or claims object.
function auditActor(sub) {
  return `cf-access:${sub}`;
}

// Best-effort failure audit (AS20-F011): attempted only when D1 remains
// available and a safe bounded entity reference exists. Its own failure
// must never surface to the caller or change the response already decided
// — it is swallowed, exactly like WEB-INC-002's dashboard error handling
// never leaks the underlying cause.
async function tryAppendFailureAudit(db, { actor, action, entityId, revisionId = null }) {
  try {
    await appendAuditEvent(db, { actor, action, entityType: "project", entityId, revisionId, result: "failure" });
  } catch {
    // Storage failure while recording a failure audit must never make the
    // original request look successful, and must never itself crash the
    // response path (AS20-F011).
  }
}

function safeEntityIdOrUnassigned(id) {
  try {
    return validateProjectId(id);
  } catch {
    // RFC-006 "Audit actions": a bounded sentinel is used only when a
    // rejected create request cannot yield a safe project id.
    return "unassigned";
  }
}

// WEB-INC-003 Remediation Cycle 1 (ML-DEVOS-AS-021 AS21-F009): reads the
// request body under a real byte budget rather than a JavaScript string
// character count. `String.prototype.length` counts UTF-16 code units, not
// UTF-8 bytes — a body built from multibyte characters (e.g. CJK, each 3
// bytes in UTF-8 but 1 UTF-16 code unit) can be far larger in bytes than
// its `.length` suggests, letting it slip past a character-counted check
// while still exceeding the real budget once re-encoded. This reads the
// body as a byte stream, counting real bytes as they arrive and aborting
// the moment the budget is exceeded — no multibyte content can bypass the
// limit, and an oversized body is never fully buffered into memory.
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

// AS20-F004: same-origin Origin, JSON content type, bounded body. Applied
// to every mutating (non-GET) route before any D1 access. Returns the
// parsed JSON body on success, or a Response to return immediately on
// failure.
async function readAndValidateMutationRequest(request, url) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== url.origin) {
    return { error: jsonResponse(403, { error: "Forbidden" }) };
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { error: jsonResponse(415, { error: "Unsupported Media Type" }) };
  }

  const { tooLarge, bytes } = await readBoundedBodyBytes(request, MAX_MUTATION_BODY_BYTES);
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

// expectedPublishedRevisionId/expectedDraftRevisionId must both be present
// (null or a positive safe integer) — the caller must state its expected
// pointer state explicitly, never assume it (AS20-F006).
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

// WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029) addition
// (AS23-F012): "referenced media must exist and be active." Validates the
// shape of a caller-supplied media snapshot, then independently confirms
// every referenced media id actually resolves to an active row — a
// mismatched count means at least one id was missing or inactive, which is
// reported as a plain validation failure rather than left to surface as a
// raw D1 foreign-key batch failure.
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

// AS23-F012: "if edit omits media selection, copy/inherit the source
// revision's associations so text-only edits don't silently drop media."
// The source revision is the project's current draft if one exists,
// otherwise its current published revision — the same revision an edit
// request is itself built on top of.
async function inheritedMediaEntries(db, expected) {
  const sourceRevisionId = expected.expectedDraftRevisionId ?? expected.expectedPublishedRevisionId;
  if (sourceRevisionId === null || sourceRevisionId === undefined) return [];
  return readProjectMediaSnapshot(db, sourceRevisionId);
}

// WEB-INC-003 Remediation Cycle 1 (ML-DEVOS-AS-021 AS21-F007): after a
// rejected edit/publish/unpublish batch, the commit-time guard in
// worker/d1/projects.mjs (see stalePointerGuardedSlugAssignment) is the
// only thing that can have caused it via a poisoned `slug` CHECK
// violation, and only when the row's live pointers no longer matched the
// request's expected values at execution time. Because the whole
// transaction rolled back, re-reading the row now returns exactly the
// state it was in immediately before this attempt — so comparing that
// state against the same `expected` values distinguishes "the guard fired
// (stale) → 409" from "some other storage failure → 500" without needing
// to inspect the driver's error message.
// RFC-022 Tier 1: the source revision's V10 group (draft, else published),
// or undefined when the schema/revision has none.
async function inheritedV10Fields(db, expected) {
  const sourceRevisionId = expected.expectedDraftRevisionId ?? expected.expectedPublishedRevisionId;
  if (sourceRevisionId === null) return undefined;
  const row = await readProjectRevisionRow(db, sourceRevisionId);
  if (!row) return undefined;
  const { v10 } = revisionRowToDomainFields(row);
  return v10 === null || v10 === undefined ? undefined : v10;
}

async function classifyMutationBatchFailure(db, id, expected) {
  try {
    const current = await readProjectForMutation(db, id);
    if (current && pointersMatch(current, expected)) {
      return 500;
    }
    return 409;
  } catch {
    return 500;
  }
}

// POST /admin/api/projects — create draft (AS20-F002, AS20-F005).
async function handleCreateDraft({ request, url, db, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;

  const rawId = typeof body.id === "string" ? body.id : null;
  const auditEntityId = rawId ? safeEntityIdOrUnassigned(rawId) : "unassigned";

  let validId;
  let validSlug;
  let fields;
  try {
    validId = validateProjectId(body.id);
    validSlug = validateProjectSlug(body.slug);
    fields = validateProjectRevisionContent({
      order: body.order,
      category: body.category,
      title: body.title,
      summary: body.summary,
      stack: body.stack,
      accent: body.accent,
      icon: body.icon,
      featured: body.featured,
      v10: body.v10,
    });
    validateCaseStudyEnabled(validSlug, fields.v10?.caseStudyEnabled ?? false);
  } catch {
    await tryAppendFailureAudit(db, { actor: auditActor(sub), action: "project_create_draft", entityId: auditEntityId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const actor = auditActor(sub);

  // AS23-F012: create has no prior revision to inherit from, so an omitted
  // `media` field simply means an empty snapshot — never an implicit copy
  // of anything.
  let mediaEntries;
  try {
    mediaEntries = "media" in body ? await resolveMediaSnapshotEntries(db, body.media) : [];
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "project_create_draft", entityId: auditEntityId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const createdAt = new Date().toISOString();

  let statements;
  try {
    statements = buildCreateDraftBatch(db, { id: validId, slug: validSlug, fields, createdAt, createdBy: actor, actor, mediaEntries });
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "project_create_draft", entityId: validId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  try {
    await db.batch(statements);
  } catch {
    // A UNIQUE/PRIMARY KEY conflict (duplicate id/slug) or any other D1
    // failure aborts the whole batch — no partial project/revision row and
    // no false-success audit row was written (AS20-F009). Record a
    // separate failure audit for this rejected attempt now that the
    // failed transaction has rolled back (AS20-F011).
    await tryAppendFailureAudit(db, { actor, action: "project_create_draft", entityId: validId });
    return jsonResponse(409, { error: "Conflict" });
  }

  const row = await readProjectForMutation(db, validId);
  return jsonResponse(201, projectStatusResponse(row, { revisionId: row.draft_revision_id }));
}

// PUT /admin/api/projects/:id/draft — edit draft (AS20-F005, AS20-F006).
async function handleEditDraft({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  const row = await readProjectForMutation(db, id);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "project_update_draft", entityId: safeEntityIdOrUnassigned(id) });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "project_update_draft", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "project_update_draft", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  let fields;
  try {
    // RFC-022 Tier 1: an explicit `v10` (object or null) replaces the V10
    // group; omitting it inherits the source revision's V10 group, so a
    // legacy-shaped edit never silently drops homepage content (same rule as
    // media, AS23-F012).
    const v10 = "v10" in body ? body.v10 : await inheritedV10Fields(db, expected);
    fields = validateProjectRevisionContent({
      order: body.order,
      category: body.category,
      title: body.title,
      summary: body.summary,
      stack: body.stack,
      accent: body.accent,
      icon: body.icon,
      featured: body.featured,
      v10,
    });
    validateCaseStudyEnabled(row.slug, fields.v10?.caseStudyEnabled ?? false);
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "project_update_draft", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }

  // AS23-F012: an explicit `media` field is the complete replacement
  // snapshot for the new revision; omitting the field entirely inherits the
  // source revision's associations so a text-only edit never silently drops
  // media.
  let mediaEntries;
  try {
    mediaEntries = "media" in body ? await resolveMediaSnapshotEntries(db, body.media) : await inheritedMediaEntries(db, expected);
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "project_update_draft", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const createdAt = new Date().toISOString();
  let statements;
  try {
    statements = await buildEditDraftBatch(db, {
      id,
      slug: row.slug,
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
    // classifyMutationBatchFailure distinguishes them (AS21-F007). Either
    // way the transaction rolled back: no partial revision row, no pointer
    // change, no success audit row survives.
    const status = await classifyMutationBatchFailure(db, id, expected);
    await tryAppendFailureAudit(db, { actor, action: "project_update_draft", entityId: id });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readProjectForMutation(db, id);
  return jsonResponse(200, projectStatusResponse(updated, { revisionId: updated.draft_revision_id }));
}

// AS23-F014: exact-draft media metadata only — never a fallback to the
// published revision's associations. Joins the draft's project_media
// snapshot (mediaId/role/order) against the bounded, positive media
// metadata projection; never exposes raw bucket/object credentials or a
// storage key.
async function draftMediaPreview(db, draftRevisionId) {
  const snapshot = await readProjectMediaSnapshot(db, draftRevisionId);
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

// GET /admin/api/projects/:id/preview — read-only, draft-only (AS20-F014,
// AS23-F014).
async function handlePreview({ db, id }) {
  const row = await readProjectForMutation(db, id);
  if (!row || row.draft_revision_id === null || row.draft_revision_id === undefined) {
    return jsonResponse(404, { error: "Not Found" });
  }
  const revisionRow = await readProjectRevisionRow(db, row.draft_revision_id);
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

// POST /admin/api/projects/:id/publish — publish (AS20-F007).
async function handlePublish({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  const row = await readProjectForMutation(db, id);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: safeEntityIdOrUnassigned(id) });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  if (row.draft_revision_id === null || row.draft_revision_id === undefined) {
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  // Full server-side revalidation of the exact persisted draft before
  // promoting it (AS20-F007) — never trust that a prior write remains
  // valid without re-checking.
  const revisionRow = await readProjectRevisionRow(db, row.draft_revision_id);
  let draftFields;
  try {
    if (!revisionRow) throw new Error("draft revision row missing");
    draftFields = validateProjectRevisionContent(revisionRowToDomainFields(revisionRow));
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: id, revisionId: row.draft_revision_id });
    return jsonResponse(500, { error: "Internal Server Error" });
  }

  // RFC-022 Tier 1 (ML-DEVOS-AS-132 test 8): publishing a homepage-eligible
  // revision is rejected before publication when five other projects are
  // already published homepage-eligible. The same bound is re-checked at
  // commit time inside the guarded UPDATE.
  const homepageEligible = isHomepageEligible(draftFields);
  // D-111 (AS137-F001): before initial activation, a homepage-eligible
  // revision can only be published together with the other four D-105
  // projects, through POST /admin/api/projects/initial-activation. Re-checked
  // at commit time inside the guarded UPDATE.
  if (homepageEligible && !(await isInitialHomepageActivationDone(db))) {
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: id, revisionId: row.draft_revision_id });
    return jsonResponse(409, { error: "Conflict", reason: "INITIAL_ACTIVATION_REQUIRED" });
  }
  if (homepageEligible && (await countPublishedHomepageProjects(db, { excludeProjectId: id })) >= MAX_HOMEPAGE_PROJECTS) {
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: id, revisionId: row.draft_revision_id });
    return jsonResponse(409, { error: "Conflict", reason: "HOMEPAGE_LIMIT" });
  }

  try {
    await db.batch(
      buildPublishBatch(db, {
        id,
        draftRevisionId: row.draft_revision_id,
        expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
        expectedDraftRevisionId: expected.expectedDraftRevisionId,
        actor,
        homepageLimit: homepageEligible ? MAX_HOMEPAGE_PROJECTS : null,
      })
    );
  } catch {
    // Commit-time stale-write guard fired, or some other storage failure —
    // classifyMutationBatchFailure distinguishes them (AS21-F007). A
    // concurrent publish that filled the homepage between the pre-check and
    // the commit is also a 409 (RFC-022 Tier 1).
    let status = await classifyMutationBatchFailure(db, id, expected);
    if (
      status === 500 &&
      homepageEligible &&
      ((await countPublishedHomepageProjects(db, { excludeProjectId: id })) >= MAX_HOMEPAGE_PROJECTS || !(await isInitialHomepageActivationDone(db)))
    ) {
      status = 409;
    }
    await tryAppendFailureAudit(db, { actor, action: "project_publish", entityId: id, revisionId: row.draft_revision_id });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readProjectForMutation(db, id);
  return jsonResponse(200, projectStatusResponse(updated, { revisionId: updated.published_revision_id }));
}

// POST /admin/api/projects/:id/unpublish — unpublish (AS20-F008).
async function handleUnpublish({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  const row = await readProjectForMutation(db, id);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "project_unpublish", entityId: safeEntityIdOrUnassigned(id) });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "project_unpublish", entityId: id });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "project_unpublish", entityId: id });
    return jsonResponse(409, { error: "Conflict" });
  }

  if (row.published_revision_id === null || row.published_revision_id === undefined) {
    await tryAppendFailureAudit(db, { actor, action: "project_unpublish", entityId: id });
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
    // Commit-time stale-write guard fired, or some other storage failure —
    // classifyMutationBatchFailure distinguishes them (AS21-F007).
    const status = await classifyMutationBatchFailure(db, id, expected);
    await tryAppendFailureAudit(db, { actor, action: "project_unpublish", entityId: id, revisionId: row.published_revision_id });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readProjectForMutation(db, id);
  return jsonResponse(200, projectStatusResponse(updated, { revisionId: row.published_revision_id }));
}

// D-111 (AS137-F001) failure audit for the initial activation route. Same
// best-effort rule as tryAppendFailureAudit; `result: "failure"` rows never
// count as the activation marker.
async function tryAppendInitialActivationFailureAudit(db, actor) {
  try {
    await appendAuditEvent(db, {
      actor,
      action: INITIAL_ACTIVATION_AUDIT_ACTION,
      entityType: INITIAL_ACTIVATION_ENTITY_TYPE,
      entityId: INITIAL_ACTIVATION_ENTITY_ID,
      revisionId: null,
      result: "failure",
    });
  } catch {
    // Never changes the response already decided (AS20-F011).
  }
}

const INITIAL_ACTIVATION_ENTRY_KEYS = ["id", "expectedPublishedRevisionId", "expectedDraftRevisionId"];

// Body: { projects: [{ id, expectedPublishedRevisionId, expectedDraftRevisionId }] },
// exactly five entries in the D-105 order. Returns the normalized entries or null.
function readInitialActivationEntries(body) {
  if (Object.keys(body).length !== 1 || !Array.isArray(body.projects)) return null;
  if (body.projects.length !== INITIAL_ACTIVATION_PROJECT_NAMES.length) return null;
  const entries = [];
  for (const raw of body.projects) {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
    const keys = Object.keys(raw);
    if (keys.length !== INITIAL_ACTIVATION_ENTRY_KEYS.length || !INITIAL_ACTIVATION_ENTRY_KEYS.every(key => keys.includes(key))) return null;
    const expected = readExpectedPointers(raw);
    if (!expected) return null;
    let id;
    try {
      id = validateProjectId(raw.id);
    } catch {
      return null;
    }
    entries.push({ id, ...expected });
  }
  if (new Set(entries.map(entry => entry.id)).size !== entries.length) return null;
  return entries;
}

// Public `/` orders published homepage projects by sort_order, then id
// (worker/bridge/snapshot.mjs). The request order must equal that order, so
// the homepage shows the five exactly in the D-105 order.
function isRenderedInRequestOrder(prepared) {
  const sorted = [...prepared].sort((a, b) => a.fields.order - b.fields.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return sorted.every((entry, index) => entry === prepared[index]);
}

// POST /admin/api/projects/initial-activation — D-111 (AS137-F001).
//
// Publishes the D-105 initial five (ClinicFlow, Eternal Eggs, Sentinel /
// DevOS, SU, Maisog Kilat) in one atomic D1 transaction, once. Preconditions,
// checked on the pre-read and again at commit time by the batch guards:
// initial activation has not happened; no project is published
// homepage-eligible; every entry's pointers equal the caller's expected
// values. Each draft is revalidated from storage, must be homepage-eligible,
// and the five together must be exactly the D-105 set, complete and valid,
// rendering in that order. Anything else publishes nothing.
async function handleInitialActivation({ request, url, db, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const actor = auditActor(sub);

  const entries = readInitialActivationEntries(parsed.body);
  if (!entries) {
    await tryAppendInitialActivationFailureAudit(db, actor);
    return jsonResponse(400, { error: "Validation failed" });
  }

  const conflict = async reason => {
    await tryAppendInitialActivationFailureAudit(db, actor);
    return jsonResponse(409, { error: "Conflict", reason });
  };
  if (await isInitialHomepageActivationDone(db)) return conflict("INITIAL_ACTIVATION_ALREADY_DONE");
  if ((await countPublishedHomepageProjects(db, { excludeProjectId: "" })) !== 0) return conflict("HOMEPAGE_NOT_EMPTY");

  const prepared = [];
  for (const entry of entries) {
    const row = await readProjectForMutation(db, entry.id);
    if (!row || !pointersMatch(row, entry)) return conflict(undefined);
    if (row.draft_revision_id === null || row.draft_revision_id === undefined) return conflict("DRAFT_REQUIRED");
    const revisionRow = await readProjectRevisionRow(db, row.draft_revision_id);
    let fields;
    try {
      if (!revisionRow) throw new Error("draft revision row missing");
      fields = validateProjectRevisionContent(revisionRowToDomainFields(revisionRow));
    } catch {
      await tryAppendInitialActivationFailureAudit(db, actor);
      return jsonResponse(500, { error: "Internal Server Error" });
    }
    if (!isHomepageEligible(fields)) return conflict("NOT_HOMEPAGE_ELIGIBLE");
    prepared.push({ ...entry, slug: row.slug, draftRevisionId: row.draft_revision_id, fields });
  }

  const group = prepared.map(({ fields, slug }) => ({ name: fields.title, kind: fields.category, slug, description: fields.summary, ...fields.v10 }));
  if (!initialReleaseReadiness(group) || !isRenderedInRequestOrder(prepared)) {
    await tryAppendInitialActivationFailureAudit(db, actor);
    return jsonResponse(400, { error: "Validation failed", reason: "INITIAL_SET_MISMATCH" });
  }

  try {
    await db.batch(buildInitialActivationBatch(db, { entries: prepared, actor }));
  } catch {
    // The whole transaction rolled back: nothing was published and no
    // success audit row or activation marker exists. A concurrent change to
    // any of the five, a concurrent activation, or a concurrent homepage
    // publish is a 409; anything else is a storage failure.
    let status = 500;
    try {
      if (await isInitialHomepageActivationDone(db)) status = 409;
      else if ((await countPublishedHomepageProjects(db, { excludeProjectId: "" })) !== 0) status = 409;
      else {
        for (const entry of prepared) {
          const current = await readProjectForMutation(db, entry.id);
          if (!current || !pointersMatch(current, entry)) status = 409;
        }
      }
    } catch {
      status = 500;
    }
    await tryAppendInitialActivationFailureAudit(db, actor);
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const projects = [];
  for (const entry of prepared) {
    const updated = await readProjectForMutation(db, entry.id);
    projects.push(projectStatusResponse(updated, { revisionId: updated.published_revision_id }));
  }
  return jsonResponse(200, { initialActivation: { done: true }, projects });
}

// The single entry point invoked by worker/admin/dashboard.mjs for every
// `/admin/api/projects` / `/admin/api/projects/*` path. Unrecognized method
// or sub-route combinations fail closed to 405/404 with zero D1 access
// (AS20-F002) — never falls through to a broader/generic mutation path.
//
// WEB-INC-003 Remediation Cycle 1 (ML-DEVOS-AS-021 AS21-F010): route/method
// classification happens *before* the `!db` check, not after — an
// unsupported sub-route or wrong method never requires a DB binding at
// all, so it must return 404/405 even when DB is absent. Only a route+
// method combination this dispatcher actually recognizes and would call
// into D1 for checks `!db` and returns 503 when it's missing.
export async function handleProjectsDispatch({ request, url, db, sub }) {
  const pathname = url.pathname;

  if (pathname === PROJECTS_ROOT_PATH) {
    if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleCreateDraft({ request, url, db, sub });
  }

  if (pathname === INITIAL_ACTIVATION_PATH) {
    if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleInitialActivation({ request, url, db, sub });
  }

  const match = pathname.match(PROJECT_SUBROUTE_PATTERN);
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

  // No project delete route, no generic mutation route — anything else
  // under /admin/api/projects/* is protected 404 (AS20-F002).
  return jsonResponse(404, { error: "Not Found" });
}
