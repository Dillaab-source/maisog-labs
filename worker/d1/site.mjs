// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-105/D-106): bounded contact-email
// lifecycle on the existing, unmodified site_settings / site_settings_revisions
// tables (migrations/0001). No schema change.
//
// A contact draft is a new immutable site_settings_revisions row that copies
// every column of its base revision (the current draft, else the published
// revision) and replaces only `contact_email`. The singleton row id is
// 'default'. Stale-write protection uses the theme-lifecycle pattern
// (worker/d1/theme.mjs): the guarded pointer UPDATE writes the poison value -1
// on a pointer mismatch, which violates the composite foreign key and rolls
// back the whole batch, including the success audit row.
import { buildSiteSettingsRevisionAuditStatement, buildAuditAppendStatement } from "./audit.mjs";
import { isValidBridgeEmail } from "../bridge/payload.mjs";

export const SITE_SETTINGS_ID = "default";
const POISON_REVISION_ID = -1;
const NON_COPIED_COLUMNS = new Set(["id", "site_settings_id", "revision_number", "contact_email", "created_at", "created_by"]);

export function readSiteSettingsForMutation(db) {
  return db.prepare("SELECT id, published_revision_id, draft_revision_id FROM site_settings WHERE id = ?").bind(SITE_SETTINGS_ID).first();
}

export function readSiteSettingsRevisionRow(db, revisionId) {
  return db.prepare("SELECT * FROM site_settings_revisions WHERE id = ? AND site_settings_id = ?").bind(revisionId, SITE_SETTINGS_ID).first();
}

async function nextRevisionNumber(db) {
  const row = await db
    .prepare("SELECT COALESCE(MAX(revision_number), 0) AS maxRevisionNumber FROM site_settings_revisions WHERE site_settings_id = ?")
    .bind(SITE_SETTINGS_ID)
    .first();
  return row.maxRevisionNumber + 1;
}

export function validateContactEmail(value) {
  if (!isValidBridgeEmail(value)) throw new Error("contact email: invalid value");
  return value;
}

// baseRow: the full revision row to copy (draft, else published).
export async function buildContactDraftBatch(db, { baseRow, email, createdAt, createdBy, actor, expectedPublishedRevisionId, expectedDraftRevisionId }) {
  const validEmail = validateContactEmail(email);
  const copied = Object.entries(baseRow).filter(([column]) => !NON_COPIED_COLUMNS.has(column));
  const columnNames = [...copied.map(([column]) => column), "contact_email"];
  const values = [...copied.map(([, value]) => value), validEmail];
  const revisionNumber = await nextRevisionNumber(db);

  return [
    db
      .prepare(
        `INSERT INTO site_settings_revisions (site_settings_id, revision_number, ${columnNames.join(", ")}, created_at, created_by) ` +
          `VALUES (?, ?, ${columnNames.map(() => "?").join(", ")}, ?, ?)`
      )
      .bind(SITE_SETTINGS_ID, revisionNumber, ...values, createdAt, createdBy),
    db
      .prepare(
        "UPDATE site_settings SET draft_revision_id = " +
          "CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? " +
          "THEN (SELECT id FROM site_settings_revisions WHERE site_settings_id = ? AND revision_number = ?) " +
          `ELSE ${POISON_REVISION_ID} END ` +
          "WHERE id = ?"
      )
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, SITE_SETTINGS_ID, revisionNumber, SITE_SETTINGS_ID),
    buildSiteSettingsRevisionAuditStatement(db, {
      actor,
      action: "site_settings_contact_update_draft",
      entityId: SITE_SETTINGS_ID,
      siteSettingsId: SITE_SETTINGS_ID,
      revisionNumber,
      result: "success",
    }),
  ];
}

export function buildContactPublishBatch(db, { draftRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, actor }) {
  return [
    db
      .prepare(
        "UPDATE site_settings SET " +
          `published_revision_id = CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? THEN ? ELSE ${POISON_REVISION_ID} END, ` +
          "draft_revision_id = NULL " +
          "WHERE id = ?"
      )
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, draftRevisionId, SITE_SETTINGS_ID),
    buildAuditAppendStatement(db, {
      actor,
      action: "site_settings_contact_publish",
      entityType: "site_settings",
      entityId: SITE_SETTINGS_ID,
      revisionId: draftRevisionId,
      result: "success",
    }),
  ];
}
