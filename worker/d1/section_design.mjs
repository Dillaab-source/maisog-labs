// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032) bounded section
// design (visibility/order) mutation D1 helpers.
//
// RFC-010 requires DESIGN-002/003 (section visibility/order) to reuse the
// existing, unmodified `sections` / `section_revisions` tables
// (migrations/0001_web_inc_005_init.sql) rather than duplicating that state
// inside theme_settings_revisions. Those tables were bootstrap-only before
// this increment (AS13-F005) — no admin mutation route existed for them
// until now. This module owns every SQL statement the new bounded mutation
// capability needs against them, restricted to exactly the four fixed
// managed section ids (`validateManagedSectionId`, worker/d1/validate.mjs);
// no section create/delete/rename capability is added.
//
// Statement-array builders mirror worker/d1/theme.mjs's/worker/d1/journal.mjs's
// conventions exactly, including the same subquery-correlation pattern
// (keyed on section_revisions' existing UNIQUE (section_id, revision_number)
// constraint) and the same FK-poison commit-time stale-write guard
// technique — reusing `sections`'/`section_revisions`' own pre-existing
// composite foreign key as the constraint that trips on a stale/mismatched
// expected-pointer pair, exactly as worker/d1/theme.mjs does for
// theme_settings. This is a pure query-level technique: it adds no column,
// table, or trigger to the pre-existing `sections`/`section_revisions`
// schema (migrations 0001-0004 remain byte-identical), and was empirically
// validated against a real local D1 instance before being relied on here
// (see coordination/IMPLEMENTER_HANDOFF.md for the exact command log).
//
// Only two mutation routes exist per section per RFC-010 ("Admin API"):
// edit draft and publish. There is no create, delete, or unpublish route —
// the four rows already exist from the WEB-INC-005 bootstrap
// (worker/d1/migrate.mjs's SECTION_BOOTSTRAP) before this increment ever
// runs.
import { validateManagedSectionId, validateSectionDesignContent } from "./validate.mjs";
import { buildSectionRevisionAuditStatement, buildAuditAppendStatement } from "./audit.mjs";

function sectionRevisionColumns(fields) {
  return { sort_order: fields.order, visible: fields.visible ? 1 : 0 };
}

export function revisionRowToDomainFields(row) {
  return { order: row.sort_order, visible: Boolean(row.visible) };
}

// Plain read-only lookup used by every mutation route. Never mutates. `id`
// must already be one of the four managed section ids by the time this is
// called (the caller validates via validateManagedSectionId first).
export async function readSectionForMutation(db, id) {
  return db.prepare("SELECT id, published_revision_id, draft_revision_id FROM sections WHERE id = ?").bind(id).first();
}

export async function readSectionRevisionRow(db, revisionId) {
  return db.prepare("SELECT * FROM section_revisions WHERE id = ?").bind(revisionId).first();
}

async function nextRevisionNumber(db, sectionId) {
  const row = await db
    .prepare("SELECT COALESCE(MAX(revision_number), 0) AS maxRevisionNumber FROM section_revisions WHERE section_id = ?")
    .bind(sectionId)
    .first();
  return row.maxRevisionNumber + 1;
}

// See worker/d1/theme.mjs's module header for the full rationale: -1 can
// never be a valid section_revisions.id (AUTOINCREMENT, always >= 1), so
// writing it when the guard condition is false trips the pre-existing
// composite foreign key and rolls back the whole db.batch() transaction.
const POISON_REVISION_ID = -1;

// Builds the edit-draft statement set: one new immutable section_revisions
// row (the next revision_number for this section), the pointer update that
// moves only draft_revision_id (FK-poison guarded), and one success audit
// row. Never touches published_revision_id and never UPDATEs an existing
// revision row.
export async function buildEditDraftBatch(db, { id, fields, createdAt, createdBy, actor, expectedPublishedRevisionId, expectedDraftRevisionId }) {
  const validId = validateManagedSectionId(id);
  const validFields = validateSectionDesignContent(fields);
  const revisionColumns = sectionRevisionColumns(validFields);
  const revisionColumnNames = Object.keys(revisionColumns);
  const revisionValues = Object.values(revisionColumns);
  const revisionNumber = await nextRevisionNumber(db, validId);

  return [
    db
      .prepare(
        `INSERT INTO section_revisions (section_id, revision_number, ${revisionColumnNames.join(", ")}, created_at, created_by) ` +
          `VALUES (?, ?, ${revisionColumnNames.map(() => "?").join(", ")}, ?, ?)`
      )
      .bind(validId, revisionNumber, ...revisionValues, createdAt, createdBy),
    db
      .prepare(
        "UPDATE sections SET draft_revision_id = " +
          "CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? " +
          "THEN (SELECT id FROM section_revisions WHERE section_id = ? AND revision_number = ?) " +
          `ELSE ${POISON_REVISION_ID} END ` +
          "WHERE id = ?"
      )
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, validId, revisionNumber, validId),
    buildSectionRevisionAuditStatement(db, {
      actor,
      action: "section_design_edit_draft",
      entityId: validId,
      sectionId: validId,
      revisionNumber,
      result: "success",
    }),
  ];
}

// Publish: the draft revision already exists and its id is already known
// from the caller's pre-read, so no subquery correlation is needed —
// buildAuditAppendStatement's plain literal revisionId is sufficient. The
// pointer UPDATE is FK-poison guarded exactly as edit's is above.
export function buildPublishBatch(db, { id, draftRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, actor }) {
  const validId = validateManagedSectionId(id);
  return [
    db
      .prepare(
        "UPDATE sections SET " +
          `published_revision_id = CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? THEN ? ELSE ${POISON_REVISION_ID} END, ` +
          "draft_revision_id = NULL " +
          "WHERE id = ?"
      )
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, draftRevisionId, validId),
    buildAuditAppendStatement(db, {
      actor,
      action: "section_design_publish",
      entityType: "section",
      entityId: validId,
      revisionId: draftRevisionId,
      result: "success",
    }),
  ];
}
