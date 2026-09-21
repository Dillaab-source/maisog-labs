// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// bounded journal mutation D1 helpers.
//
// This module owns every SQL statement the journal mutation capability
// needs against the new, additive `journal_entries` / `journal_entry_revisions`
// tables (migrations/0004_web_inc_006_journal.sql). It mirrors
// worker/d1/projects.mjs's conventions exactly: statement-array builders
// for `worker/admin/journal.mjs` to run via one `db.batch()` call per
// mutation, the same commit-time stale-write guard technique, and the same
// subquery-correlation pattern (reused here for journal_media too, via
// worker/d1/media.mjs's buildJournalMediaInsertStatements) to attach rows
// to a brand-new revision whose autoincrement id is not yet known in JS
// (AS20-F010, reused here for AS28-F008/F009).
import { validateJournalId, validateJournalSlug, validateJournalTitle, validateJournalSummary, validateJournalBody } from "./validate.mjs";
import { buildJournalRevisionAuditStatement, buildAuditAppendStatement } from "./audit.mjs";
import { buildJournalMediaInsertStatements } from "./media.mjs";

const JOURNAL_REVISION_FIELDS = ["title", "summary", "body"];

// Strict allowlist validator mirroring validateProjectRevisionContent's
// shape, but for journal's three content fields. Each field is normalized
// (trimmed/line-ending-normalized) by its own validator and the normalized
// value is what gets returned/stored — never the raw input.
export function validateJournalRevisionContent(fields) {
  if (fields === null || typeof fields !== "object" || Array.isArray(fields)) {
    throw new Error("journal revision: expected object");
  }
  for (const key of Object.keys(fields)) {
    if (!JOURNAL_REVISION_FIELDS.includes(key)) {
      throw new Error(`journal revision.${key}: unknown field`);
    }
  }
  return {
    title: validateJournalTitle(fields.title),
    summary: validateJournalSummary(fields.summary),
    body: validateJournalBody(fields.body),
  };
}

export function revisionRowToDomainFields(row) {
  return { title: row.title, summary: row.summary, body: row.body };
}

// Plain read-only lookup used by every mutation route to check existence
// and current pointer state before building any statement. Never itself
// mutates.
export async function readJournalEntryForMutation(db, id) {
  return db.prepare("SELECT id, slug, published_revision_id, draft_revision_id FROM journal_entries WHERE id = ?").bind(id).first();
}

export async function readJournalEntryRevisionRow(db, revisionId) {
  return db.prepare("SELECT * FROM journal_entry_revisions WHERE id = ?").bind(revisionId).first();
}

async function nextRevisionNumber(db, journalEntryId) {
  const row = await db
    .prepare("SELECT COALESCE(MAX(revision_number), 0) AS maxRevisionNumber FROM journal_entry_revisions WHERE journal_entry_id = ?")
    .bind(journalEntryId)
    .first();
  return row.maxRevisionNumber + 1;
}

// Commit-time stale-write guard (AS28-F009, "retain commit-time stale-write
// protection"): the exact same poison-via-existing-CHECK-constraint
// technique accepted for projects (worker/d1/projects.mjs,
// stalePointerGuardedSlugAssignment, ML-DEVOS-AS-021 AS21-F007). When the
// guard condition is false, `slug` evaluates to the literal `'journal'`,
// which `journal_entries.slug`'s own CHECK
// (migrations/0004_web_inc_006_journal.sql) already forbids — the UPDATE
// itself fails and, because db.batch() is one transaction, every other
// statement in the same batch rolls back with it. A validated journal
// entry's slug can never legitimately be `'journal'`
// (validateJournalSlug rejects reserved slugs at create time), so the
// guard-holds branch never collides with the poison value.
function journalStalePointerGuardedSlugAssignment() {
  return "CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? THEN slug ELSE 'journal' END";
}

// Builds the full create-draft statement set: one new `journal_entries`
// base row, one new immutable `journal_entry_revisions` row (revision_number
// 1), that new revision's journal_media snapshot inserts (empty when
// `mediaEntries` is empty), the pointer update that sets draft_revision_id
// (published_revision_id stays null), and one success audit row — all
// statements meant to run as a single db.batch() call.
export function buildCreateDraftBatch(db, { id, slug, fields, createdAt, createdBy, actor, mediaEntries = [] }) {
  const validId = validateJournalId(id);
  const validSlug = validateJournalSlug(slug);
  const validFields = validateJournalRevisionContent(fields);

  return [
    db.prepare("INSERT INTO journal_entries (id, slug, created_at) VALUES (?, ?, ?)").bind(validId, validSlug, createdAt),
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, created_at, created_by) " +
          "VALUES (?, 1, ?, ?, ?, ?, ?)"
      )
      .bind(validId, validFields.title, validFields.summary, validFields.body, createdAt, createdBy),
    ...buildJournalMediaInsertStatements(db, { journalEntryId: validId, revisionNumber: 1, entries: mediaEntries }),
    db
      .prepare(
        "UPDATE journal_entries SET draft_revision_id = (SELECT id FROM journal_entry_revisions WHERE journal_entry_id = ? AND revision_number = 1) WHERE id = ?"
      )
      .bind(validId, validId),
    buildJournalRevisionAuditStatement(db, {
      actor,
      action: "journal_create_draft",
      entityId: validId,
      journalEntryId: validId,
      revisionNumber: 1,
      result: "success",
    }),
  ];
}

// Builds the full edit-draft statement set: one new immutable
// journal_entry_revisions row (the next revision_number for this entry),
// that new revision's journal_media snapshot inserts, the pointer update
// that moves only draft_revision_id (guarded per above), and one success
// audit row. Never touches published_revision_id and never UPDATEs an
// existing revision row's content, or any prior revision's journal_media
// rows.
export async function buildEditDraftBatch(
  db,
  { id, fields, createdAt, createdBy, actor, expectedPublishedRevisionId, expectedDraftRevisionId, mediaEntries = [] }
) {
  const validFields = validateJournalRevisionContent(fields);
  const revisionNumber = await nextRevisionNumber(db, id);

  return [
    db
      .prepare(
        "INSERT INTO journal_entry_revisions (journal_entry_id, revision_number, title, summary, body, created_at, created_by) " +
          "VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(id, revisionNumber, validFields.title, validFields.summary, validFields.body, createdAt, createdBy),
    ...buildJournalMediaInsertStatements(db, { journalEntryId: id, revisionNumber, entries: mediaEntries }),
    db
      .prepare(
        "UPDATE journal_entries SET " +
          "draft_revision_id = (SELECT id FROM journal_entry_revisions WHERE journal_entry_id = ? AND revision_number = ?), " +
          `slug = ${journalStalePointerGuardedSlugAssignment()} ` +
          "WHERE id = ?"
      )
      .bind(id, revisionNumber, expectedPublishedRevisionId, expectedDraftRevisionId, id),
    buildJournalRevisionAuditStatement(db, {
      actor,
      action: "journal_edit_draft",
      entityId: id,
      journalEntryId: id,
      revisionNumber,
      result: "success",
    }),
  ];
}

// Publish (RFC-009 "Publish"): the draft revision's id is already known
// from the caller's pre-read. Statement order matches the RFC exactly:
// (1) set published_at if and only if currently null — a plain `WHERE
// published_at IS NULL` guard, since a given revision id can only ever
// reach this transition once (draft_revision_id is always cleared by this
// same batch, so a once-published revision can never become "the draft"
// again); (2)+(3) move published_revision_id and clear draft_revision_id
// in one guarded UPDATE; (4) success audit. The prior published revision
// row is never touched.
export function buildPublishBatch(db, { id, draftRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, actor }) {
  return [
    db
      .prepare("UPDATE journal_entry_revisions SET published_at = ? WHERE id = ? AND published_at IS NULL")
      .bind(new Date().toISOString(), draftRevisionId),
    db
      .prepare(
        "UPDATE journal_entries SET " +
          "published_revision_id = ?, " +
          "draft_revision_id = NULL, " +
          `slug = ${journalStalePointerGuardedSlugAssignment()} ` +
          "WHERE id = ?"
      )
      .bind(draftRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, id),
    buildAuditAppendStatement(db, {
      actor,
      action: "journal_publish",
      entityType: "journal_entry",
      entityId: id,
      revisionId: draftRevisionId,
      result: "success",
    }),
  ];
}

// Unpublish (RFC-009 "Unpublish"): the published revision row (including
// its already-set published_at) is preserved untouched — only the pointer
// is cleared.
export function buildUnpublishBatch(db, { id, publishedRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, actor }) {
  return [
    db
      .prepare(
        "UPDATE journal_entries SET " + "published_revision_id = NULL, " + `slug = ${journalStalePointerGuardedSlugAssignment()} ` + "WHERE id = ?"
      )
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, id),
    buildAuditAppendStatement(db, {
      actor,
      action: "journal_unpublish",
      entityType: "journal_entry",
      entityId: id,
      revisionId: publishedRevisionId,
      result: "success",
    }),
  ];
}
