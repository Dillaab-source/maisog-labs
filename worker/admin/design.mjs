// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032, screenshot-
// reference addendum ML-DEVOS-AS-031 / D-033) bounded design mutation route
// dispatcher.
//
// Invoked ONLY as a sub-dispatch of `worker/admin/dashboard.mjs`'s
// `handleAdminDispatch`, which itself runs only after `worker/auth.mjs`'s
// WEB-INC-001 Cloudflare Access verification has already succeeded — no
// branch here re-checks identity, and none of them can be reached before
// that verification. Exposes exactly the six routes RFC-010 authorizes and
// nothing else: no delete, no generic key/value route, no free-form theme
// token route, no CSS/JS/HTML endpoint, no media upload through this route
// family.
//
// This module mirrors worker/admin/journal.mjs's exact request-hardening
// and stale-write-protection conventions. Its bounded body reader and
// request/pointer helpers are a deliberately separate, self-contained copy
// rather than a shared import, the same design choice already made for
// worker/admin/media.mjs and worker/admin/journal.mjs.
import { jsonResponse } from "./dashboard.mjs";
import {
  readThemeForMutation,
  readThemeRevisionRow,
  revisionRowToDomainFields as themeRevisionRowToDomainFields,
  buildEditDraftBatch as buildThemeEditDraftBatch,
  buildPublishBatch as buildThemePublishBatch,
} from "../d1/theme.mjs";
import {
  readSectionForMutation,
  readSectionRevisionRow,
  revisionRowToDomainFields as sectionRevisionRowToDomainFields,
  buildEditDraftBatch as buildSectionEditDraftBatch,
  buildPublishBatch as buildSectionPublishBatch,
} from "../d1/section_design.mjs";
import {
  validateThemeRevisionContent,
  validateSectionDesignContent,
  validateManagedSectionId,
  MANAGED_SECTION_IDS,
  HERO_BACKGROUND_PRESET_VALUES,
  CARD_STYLE_PRESET_VALUES,
  LAYOUT_DENSITY_PRESET_VALUES,
  TYPOGRAPHY_PRESET_VALUES,
  HEADING_SCALE_PRESET_VALUES,
  PANEL_PRESET_VALUES,
  ANIMATION_PRESET_VALUES,
  REDUCED_MOTION_MODE_VALUES,
  PROJECT_RAIL_MODE_VALUES,
  JOURNAL_CARD_MODE_VALUES,
  ACCENT_PRESET_VALUES,
} from "../d1/validate.mjs";
import { appendAuditEvent } from "../d1/audit.mjs";

const DESIGN_ROOT_PATH = "/admin/api/design";
const DESIGN_PREVIEW_PATH = "/admin/api/design/preview";
const THEME_DRAFT_PATH = "/admin/api/design/theme/draft";
const THEME_PUBLISH_PATH = "/admin/api/design/theme/publish";
const SECTION_SUBROUTE_PATTERN = /^\/admin\/api\/design\/sections\/([^/]+)\/(draft|publish)$/;

// Same-origin + JSON + bounded body (mirrors AS20-F004/AS28's convention).
// A theme control object has exactly 15 short fixed-vocabulary fields plus
// two pointer integers — nowhere near this budget — but the same firm,
// explicit bound is applied rather than "whatever the runtime allows".
const MAX_DESIGN_MUTATION_BODY_BYTES = 8 * 1024;

export function isDesignApiPath(pathname) {
  return pathname === DESIGN_ROOT_PATH || pathname.startsWith(`${DESIGN_ROOT_PATH}/`);
}

// Fixed server constants describing the allowed vocabulary/ranges — RFC-010
// "GET status ... allowed preset/range metadata may be returned from fixed
// server constants" and the screenshot-reference workflow's requirement
// that "control names/options/ranges must be deterministic and inspectable"
// (ML-DEVOS-AS-031). Never derived from a database read.
const ALLOWED_VALUES = {
  heroBackgroundPreset: HERO_BACKGROUND_PRESET_VALUES,
  cardStylePreset: CARD_STYLE_PRESET_VALUES,
  layoutDensityPreset: LAYOUT_DENSITY_PRESET_VALUES,
  typographyPreset: TYPOGRAPHY_PRESET_VALUES,
  headingScalePreset: HEADING_SCALE_PRESET_VALUES,
  panelPreset: PANEL_PRESET_VALUES,
  animationPreset: ANIMATION_PRESET_VALUES,
  reducedMotionMode: REDUCED_MOTION_MODE_VALUES,
  projectRailMode: PROJECT_RAIL_MODE_VALUES,
  journalCardMode: JOURNAL_CARD_MODE_VALUES,
  accentPreset: ACCENT_PRESET_VALUES,
};
const ALLOWED_RANGES = {
  overlayIntensity: { min: 40, max: 85 },
  panelOpacityPct: { min: 55, max: 90 },
  borderIntensityPct: { min: 10, max: 45 },
  radiusScalePct: { min: 80, max: 120 },
};

function deriveLifecycleState(publishedRevisionId, draftRevisionId) {
  const hasPublished = publishedRevisionId !== null && publishedRevisionId !== undefined;
  const hasDraft = draftRevisionId !== null && draftRevisionId !== undefined;
  if (hasPublished && hasDraft) return "published_with_draft";
  if (hasPublished) return "published";
  if (hasDraft) return "draft";
  return "archived";
}

function auditActor(sub) {
  return `cf-access:${sub}`;
}

async function tryAppendFailureAudit(db, { actor, action, entityType, entityId, revisionId = null }) {
  try {
    await appendAuditEvent(db, { actor, action, entityType, entityId, revisionId, result: "failure" });
  } catch {
    // Storage failure while recording a failure audit must never make the
    // original request look successful, and must never itself crash the
    // response path.
  }
}

// Byte-accurate bounded body reader — a deliberately separate copy of the
// same technique already accepted for projects/media/journal.
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

  const { tooLarge, bytes } = await readBoundedBodyBytes(request, MAX_DESIGN_MUTATION_BODY_BYTES);
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

async function classifyMutationBatchFailure(db, readCurrent, expected) {
  try {
    const current = await readCurrent(db);
    if (current && pointersMatch(current, expected)) {
      return 500;
    }
    return 409;
  } catch {
    return 500;
  }
}

// RFC-010 evidence #9 "unknown-field rejection": the request body must
// contain only the exact allowed key set. Every handler below extracts
// named fields explicitly (never a raw body pass-through), so without this
// guard an unrecognized extra key would simply be silently ignored rather
// than rejected — this makes it an explicit 400 instead.
const POINTER_KEYS = ["expectedPublishedRevisionId", "expectedDraftRevisionId"];
const THEME_DRAFT_KEYS = [...Object.keys(ALLOWED_VALUES), ...Object.keys(ALLOWED_RANGES), ...POINTER_KEYS];
const SECTION_DRAFT_KEYS = ["order", "visible", ...POINTER_KEYS];

function hasOnlyAllowedKeys(body, allowedKeys) {
  return Object.keys(body).every(key => allowedKeys.includes(key));
}

function pointerStatus(row) {
  return {
    state: deriveLifecycleState(row.published_revision_id, row.draft_revision_id),
    publishedRevisionId: row.published_revision_id ?? null,
    draftRevisionId: row.draft_revision_id ?? null,
  };
}

// ---- GET /admin/api/design ----
async function handleStatus({ db }) {
  const themeRow = await readThemeForMutation(db);
  const [themePublished, themeDraft] = await Promise.all([
    themeRow?.published_revision_id ? readThemeRevisionRow(db, themeRow.published_revision_id) : null,
    themeRow?.draft_revision_id ? readThemeRevisionRow(db, themeRow.draft_revision_id) : null,
  ]);

  const sections = {};
  for (const id of MANAGED_SECTION_IDS) {
    const row = await readSectionForMutation(db, id);
    if (!row) {
      sections[id] = null;
      continue;
    }
    const [published, draft] = await Promise.all([
      row.published_revision_id ? readSectionRevisionRow(db, row.published_revision_id) : null,
      row.draft_revision_id ? readSectionRevisionRow(db, row.draft_revision_id) : null,
    ]);
    sections[id] = {
      id,
      ...pointerStatus(row),
      published: published ? sectionRevisionRowToDomainFields(published) : null,
      draft: draft ? sectionRevisionRowToDomainFields(draft) : null,
    };
  }

  return jsonResponse(200, {
    theme: themeRow
      ? {
          ...pointerStatus(themeRow),
          published: themePublished ? themeRevisionRowToDomainFields(themePublished) : null,
          draft: themeDraft ? themeRevisionRowToDomainFields(themeDraft) : null,
        }
      : null,
    sections,
    allowedValues: ALLOWED_VALUES,
    allowedRanges: ALLOWED_RANGES,
  });
}

// ---- GET /admin/api/design/preview ----
// RFC-010 "Preview": "current draft theme revision plus current draft/
// published section design states needed for preview." Interpreted as "what
// the site would show if published right now" for both theme and each
// section — draft-if-present, else published — since a screenshot-reference
// session commonly adjusts only a subset of controls (e.g. only sections) in
// a given draft cycle, and a preview must remain useful even when the other
// half has no pending draft of its own. Draft content is never reachable
// through the public API (AS30-F005) — this route requires the same
// Access-authenticated dispatch path as every other route in this file.
async function handlePreview({ db }) {
  const themeRow = await readThemeForMutation(db);
  const themeRevisionId = themeRow?.draft_revision_id ?? themeRow?.published_revision_id ?? null;
  const themeRevision = themeRevisionId ? await readThemeRevisionRow(db, themeRevisionId) : null;

  const sections = {};
  for (const id of MANAGED_SECTION_IDS) {
    const row = await readSectionForMutation(db, id);
    const revisionId = row?.draft_revision_id ?? row?.published_revision_id ?? null;
    const revision = revisionId ? await readSectionRevisionRow(db, revisionId) : null;
    sections[id] = revision ? { id, ...sectionRevisionRowToDomainFields(revision) } : null;
  }

  return jsonResponse(200, {
    theme: themeRevision ? themeRevisionRowToDomainFields(themeRevision) : null,
    sections,
  });
}

// ---- PUT /admin/api/design/theme/draft ----
async function handleThemeEditDraft({ request, url, db, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  if (!hasOnlyAllowedKeys(body, THEME_DRAFT_KEYS)) {
    await tryAppendFailureAudit(db, { actor, action: "theme_edit_draft", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const row = await readThemeForMutation(db);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "theme_edit_draft", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "theme_edit_draft", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "theme_edit_draft", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(409, { error: "Conflict" });
  }

  let fields;
  try {
    fields = validateThemeRevisionContent({
      heroBackgroundPreset: body.heroBackgroundPreset,
      cardStylePreset: body.cardStylePreset,
      layoutDensityPreset: body.layoutDensityPreset,
      typographyPreset: body.typographyPreset,
      headingScalePreset: body.headingScalePreset,
      overlayIntensity: body.overlayIntensity,
      panelPreset: body.panelPreset,
      animationPreset: body.animationPreset,
      reducedMotionMode: body.reducedMotionMode,
      projectRailMode: body.projectRailMode,
      journalCardMode: body.journalCardMode,
      accentPreset: body.accentPreset,
      panelOpacityPct: body.panelOpacityPct,
      borderIntensityPct: body.borderIntensityPct,
      radiusScalePct: body.radiusScalePct,
    });
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "theme_edit_draft", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const createdAt = new Date().toISOString();
  try {
    const statements = await buildThemeEditDraftBatch(db, {
      fields,
      createdAt,
      createdBy: actor,
      actor,
      expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
      expectedDraftRevisionId: expected.expectedDraftRevisionId,
    });
    await db.batch(statements);
  } catch {
    const status = await classifyMutationBatchFailure(db, readThemeForMutation, expected);
    await tryAppendFailureAudit(db, { actor, action: "theme_edit_draft", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readThemeForMutation(db);
  return jsonResponse(200, { id: "default", ...pointerStatus(updated) });
}

// ---- POST /admin/api/design/theme/publish ----
async function handleThemePublish({ request, url, db, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  if (!hasOnlyAllowedKeys(body, POINTER_KEYS)) {
    await tryAppendFailureAudit(db, { actor, action: "theme_publish", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const row = await readThemeForMutation(db);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "theme_publish", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "theme_publish", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "theme_publish", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(409, { error: "Conflict" });
  }
  if (row.draft_revision_id === null || row.draft_revision_id === undefined) {
    await tryAppendFailureAudit(db, { actor, action: "theme_publish", entityType: "theme_settings", entityId: "default" });
    return jsonResponse(409, { error: "Conflict" });
  }

  // RFC-010 "Publish": full server-side revalidation of the exact persisted
  // draft before promoting it — never trust that a prior write remains valid
  // without re-checking.
  const revisionRow = await readThemeRevisionRow(db, row.draft_revision_id);
  try {
    if (!revisionRow) throw new Error("draft revision row missing");
    validateThemeRevisionContent(themeRevisionRowToDomainFields(revisionRow));
  } catch {
    await tryAppendFailureAudit(db, {
      actor,
      action: "theme_publish",
      entityType: "theme_settings",
      entityId: "default",
      revisionId: row.draft_revision_id,
    });
    return jsonResponse(500, { error: "Internal Server Error" });
  }

  try {
    await db.batch(
      buildThemePublishBatch(db, {
        draftRevisionId: row.draft_revision_id,
        expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
        expectedDraftRevisionId: expected.expectedDraftRevisionId,
        actor,
      })
    );
  } catch {
    const status = await classifyMutationBatchFailure(db, readThemeForMutation, expected);
    await tryAppendFailureAudit(db, {
      actor,
      action: "theme_publish",
      entityType: "theme_settings",
      entityId: "default",
      revisionId: row.draft_revision_id,
    });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readThemeForMutation(db);
  return jsonResponse(200, { id: "default", ...pointerStatus(updated) });
}

// ---- PUT /admin/api/design/sections/:id/draft ----
async function handleSectionEditDraft({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  let validId;
  try {
    validId = validateManagedSectionId(id);
  } catch {
    return jsonResponse(404, { error: "Not Found" });
  }

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  if (!hasOnlyAllowedKeys(body, SECTION_DRAFT_KEYS)) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_edit_draft", entityType: "section", entityId: validId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const row = await readSectionForMutation(db, validId);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_edit_draft", entityType: "section", entityId: validId });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_edit_draft", entityType: "section", entityId: validId });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_edit_draft", entityType: "section", entityId: validId });
    return jsonResponse(409, { error: "Conflict" });
  }

  let fields;
  try {
    fields = validateSectionDesignContent({ order: body.order, visible: body.visible });
  } catch {
    await tryAppendFailureAudit(db, { actor, action: "section_design_edit_draft", entityType: "section", entityId: validId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const createdAt = new Date().toISOString();
  try {
    const statements = await buildSectionEditDraftBatch(db, {
      id: validId,
      fields,
      createdAt,
      createdBy: actor,
      actor,
      expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
      expectedDraftRevisionId: expected.expectedDraftRevisionId,
    });
    await db.batch(statements);
  } catch {
    const status = await classifyMutationBatchFailure(db, db2 => readSectionForMutation(db2, validId), expected);
    await tryAppendFailureAudit(db, { actor, action: "section_design_edit_draft", entityType: "section", entityId: validId });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readSectionForMutation(db, validId);
  return jsonResponse(200, { id: validId, ...pointerStatus(updated) });
}

// ---- POST /admin/api/design/sections/:id/publish ----
async function handleSectionPublish({ request, url, db, sub, id }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });

  let validId;
  try {
    validId = validateManagedSectionId(id);
  } catch {
    return jsonResponse(404, { error: "Not Found" });
  }

  const parsed = await readAndValidateMutationRequest(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);

  if (!hasOnlyAllowedKeys(body, POINTER_KEYS)) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_publish", entityType: "section", entityId: validId });
    return jsonResponse(400, { error: "Validation failed" });
  }

  const row = await readSectionForMutation(db, validId);
  if (!row) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_publish", entityType: "section", entityId: validId });
    return jsonResponse(404, { error: "Not Found" });
  }

  const expected = readExpectedPointers(body);
  if (!expected) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_publish", entityType: "section", entityId: validId });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_publish", entityType: "section", entityId: validId });
    return jsonResponse(409, { error: "Conflict" });
  }
  if (row.draft_revision_id === null || row.draft_revision_id === undefined) {
    await tryAppendFailureAudit(db, { actor, action: "section_design_publish", entityType: "section", entityId: validId });
    return jsonResponse(409, { error: "Conflict" });
  }

  const revisionRow = await readSectionRevisionRow(db, row.draft_revision_id);
  try {
    if (!revisionRow) throw new Error("draft revision row missing");
    validateSectionDesignContent(sectionRevisionRowToDomainFields(revisionRow));
  } catch {
    await tryAppendFailureAudit(db, {
      actor,
      action: "section_design_publish",
      entityType: "section",
      entityId: validId,
      revisionId: row.draft_revision_id,
    });
    return jsonResponse(500, { error: "Internal Server Error" });
  }

  try {
    await db.batch(
      buildSectionPublishBatch(db, {
        id: validId,
        draftRevisionId: row.draft_revision_id,
        expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
        expectedDraftRevisionId: expected.expectedDraftRevisionId,
        actor,
      })
    );
  } catch {
    const status = await classifyMutationBatchFailure(db, db2 => readSectionForMutation(db2, validId), expected);
    await tryAppendFailureAudit(db, {
      actor,
      action: "section_design_publish",
      entityType: "section",
      entityId: validId,
      revisionId: row.draft_revision_id,
    });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }

  const updated = await readSectionForMutation(db, validId);
  return jsonResponse(200, { id: validId, ...pointerStatus(updated) });
}

// The single entry point invoked by worker/admin/dashboard.mjs for every
// `/admin/api/design` / `/admin/api/design/*` path. Route/method
// classification happens before the `!db` check: an unsupported sub-route
// or wrong method never requires a DB binding at all.
export async function handleDesignDispatch({ request, url, db, sub }) {
  const pathname = url.pathname;

  if (pathname === DESIGN_ROOT_PATH) {
    if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleStatus({ db });
  }

  if (pathname === DESIGN_PREVIEW_PATH) {
    if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handlePreview({ db });
  }

  if (pathname === THEME_DRAFT_PATH) {
    if (request.method !== "PUT") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleThemeEditDraft({ request, url, db, sub });
  }

  if (pathname === THEME_PUBLISH_PATH) {
    if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
    if (!db) return jsonResponse(503, { error: "Service Unavailable" });
    return handleThemePublish({ request, url, db, sub });
  }

  const match = pathname.match(SECTION_SUBROUTE_PATTERN);
  if (match) {
    const [, id, action] = match;
    if (action === "draft") {
      if (request.method !== "PUT") return jsonResponse(405, { error: "Method Not Allowed" });
      if (!db) return jsonResponse(503, { error: "Service Unavailable" });
      return handleSectionEditDraft({ request, url, db, sub, id });
    }
    if (action === "publish") {
      if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
      if (!db) return jsonResponse(503, { error: "Service Unavailable" });
      return handleSectionPublish({ request, url, db, sub, id });
    }
  }

  // No delete, no generic mutation route — anything else under
  // /admin/api/design/* is protected 404.
  return jsonResponse(404, { error: "Not Found" });
}
