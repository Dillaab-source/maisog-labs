// WEB-INC-003 (ML-DEVOS-RFC-006 / ML-DEVOS-AS-020 / D-027) bounded project
// mutation D1 helpers.
//
// This module owns every SQL statement the project mutation capability
// needs against the existing, unmodified `projects` / `project_revisions`
// tables (migrations/0001_web_inc_005_init.sql — byte-unchanged by this
// increment). It builds statement arrays for `worker/admin/projects.mjs` to
// run via one `db.batch()` call per mutation, so a successful business
// state transition and its audit event commit atomically (AS20-F009).
//
// Revision-ID correlation (AS20-F010): create/edit each insert a new
// project_revisions row whose autoincrement id is not known in JS until
// after the INSERT runs. This module never relies on
// last_insert_rowid()/connection-local state or id preallocation to bridge
// that gap — it uses the same safe, already-accepted strategy as
// worker/d1/migrate.mjs: a same-transaction SELECT subquery keyed on
// project_revisions' UNIQUE (project_id, revision_number) constraint, which
// a later statement in the same db.batch() can resolve once the INSERT
// before it has run.
//
// Commit-time stale-write enforcement (AS21-F007, remediation cycle 1): see
// stalePointerGuardedSlugAssignment() below for how edit/publish/unpublish
// enforce expectedPublishedRevisionId/expectedDraftRevisionId inside the
// same atomic batch as the mutation, not only via the handler's pre-read.
import { validateProjectId, validateProjectSlug, validateProjectRevisionContent } from "./validate.mjs";
import { buildProjectRevisionAuditStatement, buildAuditAppendStatement } from "./audit.mjs";
import { buildProjectMediaInsertStatements } from "./media.mjs";

function projectRevisionColumns(fields) {
  return {
    sort_order: fields.order,
    category: fields.category,
    title: fields.title,
    summary: fields.summary,
    stack_json: JSON.stringify(fields.stack),
    accent: fields.accent,
    icon: fields.icon,
    featured: fields.featured ? 1 : 0,
  };
}

export function revisionRowToDomainFields(row) {
  return {
    order: row.sort_order,
    category: row.category,
    title: row.title,
    summary: row.summary,
    stack: JSON.parse(row.stack_json),
    accent: row.accent,
    icon: row.icon,
    featured: Boolean(row.featured),
  };
}

// Plain read-only lookup used by every mutation route to check existence
// and current pointer state before building any statement. Never itself
// mutates.
export async function readProjectForMutation(db, id) {
  return db
    .prepare("SELECT id, slug, published_revision_id, draft_revision_id FROM projects WHERE id = ?")
    .bind(id)
    .first();
}

export async function readProjectRevisionRow(db, revisionId) {
  return db.prepare("SELECT * FROM project_revisions WHERE id = ?").bind(revisionId).first();
}

async function nextRevisionNumber(db, projectId) {
  const row = await db
    .prepare("SELECT COALESCE(MAX(revision_number), 0) AS maxRevisionNumber FROM project_revisions WHERE project_id = ?")
    .bind(projectId)
    .first();
  return row.maxRevisionNumber + 1;
}

// Builds the full create-draft statement set: one new `projects` base row,
// one new immutable `project_revisions` row (revision_number 1), that new
// revision's `project_media` snapshot inserts (WEB-INC-004, AS23-F013 —
// empty when `mediaEntries` is empty), the pointer update that sets
// draft_revision_id (published_revision_id stays null), and one success
// audit row — all statements meant to run as a single db.batch() call
// (AS20-F005, AS20-F009, AS23-F013).
export function buildCreateDraftBatch(db, { id, slug, fields, createdAt, createdBy, actor, mediaEntries = [] }) {
  const validId = validateProjectId(id);
  const validSlug = validateProjectSlug(slug);
  validateProjectRevisionContent(fields);
  const revisionColumns = projectRevisionColumns(fields);
  const revisionColumnNames = Object.keys(revisionColumns);
  const revisionValues = Object.values(revisionColumns);

  return [
    db.prepare("INSERT INTO projects (id, slug, created_at) VALUES (?, ?, ?)").bind(validId, validSlug, createdAt),
    db
      .prepare(
        `INSERT INTO project_revisions (project_id, revision_number, ${revisionColumnNames.join(", ")}, created_at, created_by) ` +
          `VALUES (?, 1, ${revisionColumnNames.map(() => "?").join(", ")}, ?, ?)`
      )
      .bind(validId, ...revisionValues, createdAt, createdBy),
    ...buildProjectMediaInsertStatements(db, { projectId: validId, revisionNumber: 1, entries: mediaEntries }),
    db
      .prepare(
        "UPDATE projects SET draft_revision_id = (SELECT id FROM project_revisions WHERE project_id = ? AND revision_number = 1) WHERE id = ?"
      )
      .bind(validId, validId),
    buildProjectRevisionAuditStatement(db, {
      actor,
      action: "project_create_draft",
      entityId: validId,
      projectId: validId,
      revisionNumber: 1,
      result: "success",
    }),
  ];
}

// WEB-INC-003 Remediation Cycle 1 (ML-DEVOS-AS-021 AS21-F007): commit-time
// stale-write guard for edit/publish/unpublish.
//
// A pre-read-only stale check has a TOCTOU window: a competing pointer
// change can commit after the handler's pre-read but before this batch
// executes, letting a stale request silently overwrite a newer decision.
// The fix enforces the expected published/draft pointer state *inside* the
// same pointer UPDATE statement that performs the mutation, evaluated
// against the row's live value at the exact moment that statement runs —
// not the handler's earlier snapshot.
//
// The guard is a self-referential CASE: when the guard condition is false,
// every mutated column (including `slug`) evaluates to its own current
// value — a true no-op — except `slug`, which evaluates to the literal
// `'home'`. `projects.slug` already carries
// `CHECK (slug NOT IN ('home', 'projects', 'process', 'about',
// 'main-content'))` (migrations/0001_web_inc_005_init.sql, unmodified by
// this remediation), so writing `'home'` unconditionally violates that
// existing constraint and the UPDATE statement itself fails. Because
// `db.batch()` is one transaction, that failure rolls back every other
// statement in the same batch — the new revision INSERT (edit) and the
// success audit INSERT never commit either. This is "a bounded SQL/D1
// precondition/guard compatible with the existing schema" per AS-021: it
// adds no column, table, or trigger, and both branches of every CASE are
// exhaustive (guard holds → real value; guard fails → unchanged value,
// with `slug`'s false branch being the one already-forbidden constant that
// deliberately trips the constraint). A validated project's `slug` can
// never legitimately be `'home'` (validateProjectSlug rejects reserved
// slugs at create time), so the true branch never collides with the
// poison value.
//
// After a rejected batch, the caller (`worker/admin/projects.mjs`) re-reads
// the row and compares it against the same expected values to distinguish
// "guard fired (stale) → 409" from "some other storage failure → 500",
// since the transaction's rollback leaves the row exactly as it was before
// the attempt either way.
function stalePointerGuardedSlugAssignment() {
  return "CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? THEN slug ELSE 'home' END";
}

// Builds the full edit-draft statement set: one new immutable
// project_revisions row (the next revision_number for this project), that
// new revision's project_media snapshot inserts (WEB-INC-004, AS23-F013),
// the pointer update that moves only draft_revision_id (guarded per above),
// and one success audit row. Never touches published_revision_id and never
// UPDATEs an existing revision row's content, or any prior revision's
// project_media rows (AS20-F005, AS23-F005).
export async function buildEditDraftBatch(
  db,
  { id, fields, createdAt, createdBy, actor, expectedPublishedRevisionId, expectedDraftRevisionId, mediaEntries = [] }
) {
  validateProjectRevisionContent(fields);
  const revisionColumns = projectRevisionColumns(fields);
  const revisionColumnNames = Object.keys(revisionColumns);
  const revisionValues = Object.values(revisionColumns);
  const revisionNumber = await nextRevisionNumber(db, id);

  return [
    db
      .prepare(
        `INSERT INTO project_revisions (project_id, revision_number, ${revisionColumnNames.join(", ")}, created_at, created_by) ` +
          `VALUES (?, ?, ${revisionColumnNames.map(() => "?").join(", ")}, ?, ?)`
      )
      .bind(id, revisionNumber, ...revisionValues, createdAt, createdBy),
    ...buildProjectMediaInsertStatements(db, { projectId: id, revisionNumber, entries: mediaEntries }),
    db
      .prepare(
        "UPDATE projects SET " +
          "draft_revision_id = (SELECT id FROM project_revisions WHERE project_id = ? AND revision_number = ?), " +
          `slug = ${stalePointerGuardedSlugAssignment()} ` +
          "WHERE id = ?"
      )
      .bind(id, revisionNumber, expectedPublishedRevisionId, expectedDraftRevisionId, id),
    buildProjectRevisionAuditStatement(db, {
      actor,
      action: "project_update_draft",
      entityId: id,
      projectId: id,
      revisionNumber,
      result: "success",
    }),
  ];
}

// Publish: the draft revision already exists and its id is already known
// from the caller's pre-read, so no subquery correlation is needed here —
// buildAuditAppendStatement's plain literal revisionId is sufficient
// (AS20-F007). The pointer UPDATE is guarded exactly as edit's is above.
export function buildPublishBatch(db, { id, draftRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, actor }) {
  return [
    db
      .prepare(
        "UPDATE projects SET " +
          "published_revision_id = ?, " +
          "draft_revision_id = NULL, " +
          `slug = ${stalePointerGuardedSlugAssignment()} ` +
          "WHERE id = ?"
      )
      .bind(draftRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, id),
    buildAuditAppendStatement(db, {
      actor,
      action: "project_publish",
      entityType: "project",
      entityId: id,
      revisionId: draftRevisionId,
      result: "success",
    }),
  ];
}

// Unpublish: the published revision row is preserved untouched (only the
// pointer is cleared); its id is already known from the caller's pre-read
// (AS20-F008). The pointer UPDATE is guarded exactly as edit's/publish's is
// above.
export function buildUnpublishBatch(db, { id, publishedRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, actor }) {
  return [
    db
      .prepare("UPDATE projects SET " + "published_revision_id = NULL, " + `slug = ${stalePointerGuardedSlugAssignment()} ` + "WHERE id = ?")
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, id),
    buildAuditAppendStatement(db, {
      actor,
      action: "project_unpublish",
      entityType: "project",
      entityId: id,
      revisionId: publishedRevisionId,
      result: "success",
    }),
  ];
}
