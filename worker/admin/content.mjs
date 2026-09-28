// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-105/D-106): authenticated admin surface
// for the V10 published-content bridge.
//
// Reached only through worker/auth.mjs's post-authentication `dispatch`
// (Access JWT verified first; `sub` bounded). Routes:
//   GET  /admin/api/content                   editing view (published + draft)
//   PUT  /admin/api/content/contact/draft     contact-email draft
//   POST /admin/api/content/contact/publish   contact-email publish
//   GET  /admin/preview/home                  homepage with DRAFT content
//
// Project content keeps using the existing /admin/api/projects lifecycle. This
// module never adds generic mutation reach: the only write is the bounded
// contact email, same-origin, JSON, size-bounded, expected-pointer guarded,
// with its success audit row committed atomically. D-111: on a database with
// no site_settings row, the first contact draft also creates that row
// (drafted, never published) in the same transaction.
import { jsonResponse } from "./dashboard.mjs";
import { appendAuditEvent } from "../d1/audit.mjs";
import { revisionRowToDomainFields, isInitialHomepageActivationDone } from "../d1/projects.mjs";
import { canonicalSiteSettingsRevisionColumns } from "../d1/migrate.mjs";
import { siteContent } from "../../data/site.js";
import {
  SITE_SETTINGS_ID,
  readSiteSettingsForMutation,
  readSiteSettingsRevisionRow,
  buildContactDraftBatch,
  buildContactPublishBatch,
  buildContactBootstrapBatch,
  validateContactEmail,
} from "../d1/site.mjs";
import { readBridgeSnapshot, countPublishedHomepageProjects } from "../bridge/snapshot.mjs";
import {
  buildBridgePayload,
  initialReleaseReadiness,
  validateProjectsGroup,
  INITIAL_ACTIVATION_PROJECT_NAMES,
  MAX_HOMEPAGE_PROJECTS,
} from "../bridge/payload.mjs";
import { isApprovedArtifact, spliceArtifact, buildTransformedResponse } from "../bridge/inject.mjs";

const CONTENT_ROOT = "/admin/api/content";
const CONTACT_DRAFT_PATH = "/admin/api/content/contact/draft";
const CONTACT_PUBLISH_PATH = "/admin/api/content/contact/publish";
export const HOME_PREVIEW_PATH = "/admin/preview/home";
const MAX_BODY_BYTES = 4 * 1024;
const ADMIN_ACTOR_PREFIX = "cf-access:";

export function isContentApiPath(pathname) {
  return pathname === CONTENT_ROOT || pathname.startsWith(`${CONTENT_ROOT}/`);
}

export function isHomePreviewPath(pathname) {
  return pathname === HOME_PREVIEW_PATH;
}

function auditActor(sub) {
  return `${ADMIN_ACTOR_PREFIX}${sub}`;
}

async function tryAppendFailureAudit(db, { actor, action, revisionId = null }) {
  try {
    await appendAuditEvent(db, { actor, action, entityType: "site_settings", entityId: SITE_SETTINGS_ID, revisionId, result: "failure" });
  } catch {
    // A storage failure while recording a failure audit never changes the response.
  }
}

async function readBoundedJson(request, url) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== url.origin) return { error: jsonResponse(403, { error: "Forbidden" }) };
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return { error: jsonResponse(415, { error: "Unsupported Media Type" }) };
  const declared = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { error: jsonResponse(413, { error: "Payload Too Large" }) };
  // Streaming cap, so an undeclared oversized body is never buffered in full.
  const chunks = [];
  let total = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        return { error: jsonResponse(413, { error: "Payload Too Large" }) };
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let body;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return { error: jsonResponse(400, { error: "Malformed JSON body" }) };
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) return { error: jsonResponse(400, { error: "Malformed JSON body" }) };
  return { body };
}

const isPointer = value => value === null || (Number.isSafeInteger(value) && value >= 1);

function readExpectedPointers(body) {
  if (!("expectedPublishedRevisionId" in body) || !("expectedDraftRevisionId" in body)) return null;
  const { expectedPublishedRevisionId, expectedDraftRevisionId } = body;
  if (!isPointer(expectedPublishedRevisionId) || !isPointer(expectedDraftRevisionId)) return null;
  return { expectedPublishedRevisionId, expectedDraftRevisionId };
}

function pointersMatch(row, expected) {
  return (row.published_revision_id ?? null) === expected.expectedPublishedRevisionId && (row.draft_revision_id ?? null) === expected.expectedDraftRevisionId;
}

async function projectEditingView(db) {
  const rows = (await db.prepare("SELECT id, slug, published_revision_id, draft_revision_id FROM projects ORDER BY id").all()).results ?? [];
  const view = [];
  for (const row of rows) {
    const read = async revisionId => {
      if (revisionId === null || revisionId === undefined) return null;
      const revision = await db.prepare("SELECT * FROM project_revisions WHERE id = ?").bind(revisionId).first();
      return revision ? revisionRowToDomainFields(revision) : null;
    };
    view.push({
      id: row.id,
      slug: row.slug,
      publishedRevisionId: row.published_revision_id ?? null,
      draftRevisionId: row.draft_revision_id ?? null,
      published: await read(row.published_revision_id),
      draft: await read(row.draft_revision_id),
    });
  }
  return view;
}

async function contactEditingView(db) {
  const row = await readSiteSettingsForMutation(db);
  // D-111: not initialized yet. The first contact draft (sent with both
  // expected pointers null) initializes it.
  if (!row) return { initialized: false, publishedRevisionId: null, draftRevisionId: null, published: null, draft: null };
  const read = async revisionId => {
    if (revisionId === null || revisionId === undefined) return null;
    const revision = await readSiteSettingsRevisionRow(db, revisionId);
    if (!revision) return null;
    return { email: revision.contact_email, setThroughAdmin: typeof revision.created_by === "string" && revision.created_by.startsWith(ADMIN_ACTOR_PREFIX) };
  };
  return {
    initialized: true,
    publishedRevisionId: row.published_revision_id ?? null,
    draftRevisionId: row.draft_revision_id ?? null,
    published: await read(row.published_revision_id),
    draft: await read(row.draft_revision_id),
  };
}

// Homepage status from published pointers. `live` is what public `/` shows
// now (runtime bridge validity). `releaseReadiness` is the separate CB-R check
// for the first production release (AS132-F002); it never gates `live`
// (AS133-F001).
async function homepageStatus(db) {
  const snapshot = await readBridgeSnapshot(db, { mode: "published" });
  let projectsValid = false;
  if (snapshot.projects !== null) {
    try {
      validateProjectsGroup(snapshot.projects);
      projectsValid = true;
    } catch {
      projectsValid = false;
    }
  }
  const payload = buildBridgePayload({ projects: snapshot.projects, email: snapshot.email });
  return {
    maxProjects: MAX_HOMEPAGE_PROJECTS,
    publishedEligibleProjects: await countPublishedHomepageProjects(db, { excludeProjectId: "" }),
    projectsGroupValid: projectsValid,
    releaseReadiness: { check: "AS132-F002", requiredNames: [...INITIAL_ACTIVATION_PROJECT_NAMES], ready: snapshot.projects !== null && initialReleaseReadiness(snapshot.projects) },
    // D-111 (AS137-F001): whether the D-105 five have been activated together.
    // Until then homepage projects can only be published through initial activation.
    initialActivation: { done: await isInitialHomepageActivationDone(db) },
    live: { projects: Boolean(payload?.projects), contact: Boolean(payload?.contact) },
  };
}

async function handleContentView({ db }) {
  try {
    return jsonResponse(200, {
      projects: await projectEditingView(db),
      contact: await contactEditingView(db),
      homepage: await homepageStatus(db),
    });
  } catch {
    return jsonResponse(500, { error: "Internal Server Error" });
  }
}

async function handleContactDraft({ request, url, db, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });
  const parsed = await readBoundedJson(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);
  const action = "site_settings_contact_update_draft";

  const row = await readSiteSettingsForMutation(db);
  const expected = readExpectedPointers(body);
  let email;
  try {
    if (!expected) throw new Error("pointers");
    email = validateContactEmail(body.email);
    if (Object.keys(body).some(key => !["email", "expectedPublishedRevisionId", "expectedDraftRevisionId"].includes(key))) throw new Error("fields");
  } catch {
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!row) return handleContactBootstrap({ db, actor, action, email, expected });
  if (!pointersMatch(row, expected)) {
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(409, { error: "Conflict" });
  }
  const baseRevisionId = row.draft_revision_id ?? row.published_revision_id;
  const baseRow = baseRevisionId === null || baseRevisionId === undefined ? null : await readSiteSettingsRevisionRow(db, baseRevisionId);
  if (!baseRow) {
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(409, { error: "Conflict", reason: "SITE_SETTINGS_NOT_INITIALIZED" });
  }

  try {
    const statements = await buildContactDraftBatch(db, {
      baseRow,
      email,
      createdAt: new Date().toISOString(),
      createdBy: actor,
      actor,
      expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
      expectedDraftRevisionId: expected.expectedDraftRevisionId,
    });
    await db.batch(statements);
  } catch {
    const current = await readSiteSettingsForMutation(db).catch(() => null);
    const status = current && !pointersMatch(current, expected) ? 409 : 500;
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }
  return jsonResponse(200, { contact: await contactEditingView(db) });
}

// D-111: first contact draft when no site_settings row exists. The caller
// must state the uninitialized pointer state explicitly (both null). The new
// revision starts from the canonical data/site.js content, replaces only the
// contact email, and is left as a draft.
async function handleContactBootstrap({ db, actor, action, email, expected }) {
  if (expected.expectedPublishedRevisionId !== null || expected.expectedDraftRevisionId !== null) {
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(409, { error: "Conflict" });
  }
  try {
    const createdAt = new Date().toISOString();
    await db.batch(
      buildContactBootstrapBatch(db, { baseColumns: canonicalSiteSettingsRevisionColumns(siteContent), email, createdAt, createdBy: actor, actor })
    );
  } catch {
    // Rolled back as a whole. If the row exists now, another request
    // initialized it first: a stale write, 409.
    const current = await readSiteSettingsForMutation(db).catch(() => undefined);
    const status = current ? 409 : 500;
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }
  return jsonResponse(200, { contact: await contactEditingView(db) });
}

// Publishing requires an explicit owner attestation that the address's
// deliverability is confirmed (D-105 Q3, AS-132). The system cannot verify
// deliverability; the attestation makes the publication deliberate and
// audited.
async function handleContactPublish({ request, url, db, sub }) {
  if (!sub) return jsonResponse(403, { error: "Forbidden" });
  const parsed = await readBoundedJson(request, url);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const actor = auditActor(sub);
  const action = "site_settings_contact_publish";

  const row = await readSiteSettingsForMutation(db);
  const expected = readExpectedPointers(body);
  if (!row || !expected || body.confirmDeliverability !== true) {
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(400, { error: "Validation failed" });
  }
  if (!pointersMatch(row, expected) || row.draft_revision_id === null || row.draft_revision_id === undefined) {
    await tryAppendFailureAudit(db, { actor, action });
    return jsonResponse(409, { error: "Conflict" });
  }
  const draftRow = await readSiteSettingsRevisionRow(db, row.draft_revision_id);
  try {
    if (!draftRow) throw new Error("draft missing");
    validateContactEmail(draftRow.contact_email);
  } catch {
    await tryAppendFailureAudit(db, { actor, action, revisionId: row.draft_revision_id });
    return jsonResponse(500, { error: "Internal Server Error" });
  }
  try {
    await db.batch(
      buildContactPublishBatch(db, {
        draftRevisionId: row.draft_revision_id,
        expectedPublishedRevisionId: expected.expectedPublishedRevisionId,
        expectedDraftRevisionId: expected.expectedDraftRevisionId,
        actor,
      })
    );
  } catch {
    const current = await readSiteSettingsForMutation(db).catch(() => null);
    const status = current && !pointersMatch(current, expected) ? 409 : 500;
    await tryAppendFailureAudit(db, { actor, action, revisionId: row.draft_revision_id });
    return jsonResponse(status, { error: status === 409 ? "Conflict" : "Internal Server Error" });
  }
  return jsonResponse(200, { contact: await contactEditingView(db) });
}

export async function handleContentDispatch({ request, url, db, sub }) {
  const { pathname } = url;
  if (pathname === CONTENT_ROOT) {
    if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
    return handleContentView({ db });
  }
  if (pathname === CONTACT_DRAFT_PATH) {
    if (request.method !== "PUT") return jsonResponse(405, { error: "Method Not Allowed" });
    return handleContactDraft({ request, url, db, sub });
  }
  if (pathname === CONTACT_PUBLISH_PATH) {
    if (request.method !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });
    return handleContactPublish({ request, url, db, sub });
  }
  return jsonResponse(404, { error: "Not Found" });
}

// GET /admin/preview/home — the artifact with DRAFT content (falling back per
// entity to published). The initial activation gate is not applied here, so
// content can be reviewed before all five projects are ready; the content
// view reports whether the public homepage would show it. Protected by the
// same Access boundary as every /admin path; worker/auth.mjs adds no-store.
export async function handleHomePreview({ request, url, assets, db }) {
  if (request.method !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });
  const original = await assets.fetch(new Request(new URL("/", url), { method: "GET" }));
  try {
    const snapshot = await readBridgeSnapshot(db, { mode: "draft" });
    const payload = buildBridgePayload({ projects: snapshot.projects, email: snapshot.email });
    if (!payload || original.status !== 200) return original;
    const bytes = new Uint8Array(await original.clone().arrayBuffer());
    if (!(await isApprovedArtifact(bytes))) return original;
    return buildTransformedResponse(original, spliceArtifact(bytes, payload));
  } catch {
    return original;
  }
}
