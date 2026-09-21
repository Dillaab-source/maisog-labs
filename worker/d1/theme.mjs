// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032) bounded theme
// mutation D1 helpers.
//
// This module owns every SQL statement the theme mutation capability needs
// against the new, additive `theme_settings` / `theme_settings_revisions`
// tables (migrations/0005_web_inc_007_theme.sql). It mirrors
// worker/d1/journal.mjs's/worker/d1/projects.mjs's conventions: statement-
// array builders for a caller (worker/admin/design.mjs) to run inside one
// db.batch() call, and the same subquery-correlation pattern (keyed on
// theme_settings_revisions' UNIQUE (theme_settings_id, revision_number)
// constraint) to resolve a brand-new revision's not-yet-known autoincrement
// id within the same batch (AS20-F010).
//
// Only two mutation routes exist for theme per RFC-010 ("Admin API"): edit
// draft and publish. There is no create route (the singleton is
// deterministically bootstrapped by the migration itself, never by an admin
// request) and no unpublish route.
//
// Commit-time stale-write enforcement uses a new adaptation of the
// established "poison an existing constraint on guard failure" technique
// (AS21-F007's stalePointerGuardedSlugAssignment, reused unmodified by
// journal's journalStalePointerGuardedSlugAssignment): `theme_settings` has
// no extra mutable column like `projects.slug`/`journal_entries.slug` to
// poison via a CHECK. Instead this guard poisons the very pointer column
// being written, using the already-existing composite foreign key
// (`FOREIGN KEY (id, draft_revision_id) REFERENCES theme_settings_revisions
// (theme_settings_id, id)`, migrations/0005_web_inc_007_theme.sql) as the
// constraint that trips: `-1` can never be a valid
// `theme_settings_revisions.id` (an AUTOINCREMENT column, always >= 1), so
// writing it when the guard condition is false fails the FK check for the
// whole UPDATE statement, and D1's `db.batch()` is one transaction, so every
// other statement in the same batch (the new revision INSERT, the success
// audit) rolls back too — exactly the same all-or-nothing guarantee as the
// CHECK-based poison, just anchored to a different already-existing
// constraint. Empirically validated against a real local D1 instance before
// being relied on here (see coordination/IMPLEMENTER_HANDOFF.md for the
// exact command log) — a true no-op (matching pointers) succeeds, and a
// stale/mismatched pointer pair fails the entire batch, leaving the row
// exactly as it was.
import { validateThemeRevisionContent } from "./validate.mjs";
import { buildThemeRevisionAuditStatement, buildAuditAppendStatement } from "./audit.mjs";

const THEME_ID = "default";

function themeRevisionColumns(fields) {
  return {
    hero_background_preset: fields.heroBackgroundPreset,
    card_style_preset: fields.cardStylePreset,
    layout_density_preset: fields.layoutDensityPreset,
    typography_preset: fields.typographyPreset,
    heading_scale_preset: fields.headingScalePreset,
    overlay_intensity: fields.overlayIntensity,
    panel_preset: fields.panelPreset,
    animation_preset: fields.animationPreset,
    reduced_motion_mode: fields.reducedMotionMode,
    project_rail_mode: fields.projectRailMode,
    journal_card_mode: fields.journalCardMode,
    accent_preset: fields.accentPreset,
    panel_opacity_pct: fields.panelOpacityPct,
    border_intensity_pct: fields.borderIntensityPct,
    radius_scale_pct: fields.radiusScalePct,
  };
}

export function revisionRowToDomainFields(row) {
  return {
    heroBackgroundPreset: row.hero_background_preset,
    cardStylePreset: row.card_style_preset,
    layoutDensityPreset: row.layout_density_preset,
    typographyPreset: row.typography_preset,
    headingScalePreset: row.heading_scale_preset,
    overlayIntensity: row.overlay_intensity,
    panelPreset: row.panel_preset,
    animationPreset: row.animation_preset,
    reducedMotionMode: row.reduced_motion_mode,
    projectRailMode: row.project_rail_mode,
    journalCardMode: row.journal_card_mode,
    accentPreset: row.accent_preset,
    panelOpacityPct: row.panel_opacity_pct,
    borderIntensityPct: row.border_intensity_pct,
    radiusScalePct: row.radius_scale_pct,
  };
}

// Plain read-only lookup of the one theme singleton row. Never mutates.
export async function readThemeForMutation(db) {
  return db.prepare("SELECT id, published_revision_id, draft_revision_id FROM theme_settings WHERE id = ?").bind(THEME_ID).first();
}

export async function readThemeRevisionRow(db, revisionId) {
  return db.prepare("SELECT * FROM theme_settings_revisions WHERE id = ?").bind(revisionId).first();
}

async function nextRevisionNumber(db) {
  const row = await db
    .prepare("SELECT COALESCE(MAX(revision_number), 0) AS maxRevisionNumber FROM theme_settings_revisions WHERE theme_settings_id = ?")
    .bind(THEME_ID)
    .first();
  return row.maxRevisionNumber + 1;
}

// See module header for why -1 (never a valid theme_settings_revisions.id)
// is the poison value here rather than a CHECK-constrained sibling column.
const POISON_REVISION_ID = -1;

// Builds the edit-draft statement set: one new immutable
// theme_settings_revisions row (the next revision_number for the singleton),
// the pointer update that moves only draft_revision_id (FK-poison guarded),
// and one success audit row. Never touches published_revision_id and never
// UPDATEs an existing revision row (AS30-F005).
export async function buildEditDraftBatch(db, { fields, createdAt, createdBy, actor, expectedPublishedRevisionId, expectedDraftRevisionId }) {
  const validFields = validateThemeRevisionContent(fields);
  const revisionColumns = themeRevisionColumns(validFields);
  const revisionColumnNames = Object.keys(revisionColumns);
  const revisionValues = Object.values(revisionColumns);
  const revisionNumber = await nextRevisionNumber(db);

  return [
    db
      .prepare(
        `INSERT INTO theme_settings_revisions (theme_settings_id, revision_number, ${revisionColumnNames.join(", ")}, created_at, created_by) ` +
          `VALUES (?, ?, ${revisionColumnNames.map(() => "?").join(", ")}, ?, ?)`
      )
      .bind(THEME_ID, revisionNumber, ...revisionValues, createdAt, createdBy),
    db
      .prepare(
        "UPDATE theme_settings SET draft_revision_id = " +
          "CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? " +
          "THEN (SELECT id FROM theme_settings_revisions WHERE theme_settings_id = ? AND revision_number = ?) " +
          `ELSE ${POISON_REVISION_ID} END ` +
          "WHERE id = ?"
      )
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, THEME_ID, revisionNumber, THEME_ID),
    buildThemeRevisionAuditStatement(db, {
      actor,
      action: "theme_edit_draft",
      entityId: THEME_ID,
      themeSettingsId: THEME_ID,
      revisionNumber,
      result: "success",
    }),
  ];
}

// Publish: the draft revision already exists and its id is already known
// from the caller's pre-read (AS20-F007 precedent), so no subquery
// correlation/revision-number lookup is needed — buildAuditAppendStatement's
// plain literal revisionId is sufficient, exactly like
// worker/d1/projects.mjs's/worker/d1/journal.mjs's buildPublishBatch. The
// pointer UPDATE is FK-poison guarded exactly as edit's is above, this time
// poisoning published_revision_id (the column receiving a real, non-null
// value on the guard-true branch) — draft_revision_id is unconditionally
// cleared to NULL in the same statement, which is harmless if the statement
// as a whole is about to be rejected by the poisoned published_revision_id's
// FK violation, since a single UPDATE statement's column changes commit or
// roll back together.
export function buildPublishBatch(db, { draftRevisionId, expectedPublishedRevisionId, expectedDraftRevisionId, actor }) {
  return [
    db
      .prepare(
        "UPDATE theme_settings SET " +
          `published_revision_id = CASE WHEN published_revision_id IS ? AND draft_revision_id IS ? THEN ? ELSE ${POISON_REVISION_ID} END, ` +
          "draft_revision_id = NULL " +
          "WHERE id = ?"
      )
      .bind(expectedPublishedRevisionId, expectedDraftRevisionId, draftRevisionId, THEME_ID),
    buildAuditAppendStatement(db, {
      actor,
      action: "theme_publish",
      entityType: "theme_settings",
      entityId: THEME_ID,
      revisionId: draftRevisionId,
      result: "success",
    }),
  ];
}
