-- D-140: revisioned, default-off case-study CTA toggle. This is additive so
-- old Worker inserts omit the column and continue to receive the safe default.
-- Apply to a database before deploying Worker code that reads/writes it.
ALTER TABLE project_revisions ADD COLUMN case_study_enabled INTEGER NOT NULL DEFAULT 0 CHECK (case_study_enabled IN (0, 1));
