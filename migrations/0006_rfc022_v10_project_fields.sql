-- RFC-022 Tier 1 (ML-DEVOS-AS-132 / D-105 / D-106): V10 homepage project
-- fields on the existing project revision substrate. No new table, no second
-- CMS, no snapshot table.
--
-- Four nullable columns on project_revisions, justified field by field in
-- docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md §16:
--   tagline          V10 `tag`; distinct from `summary` in length and role.
--   status           V10 status dot; the artifact's vocabulary is '' or 'Active'.
--   disciplines_json V10 discipline indices (0..5, code-owned names); typed
--                    array validated in worker/bridge/payload.mjs. `stack_json`
--                    is a different concept (tech stack) and is not reused.
--   flow_json        exactly four V10 flow stages; stage 4 is the human step.
--
-- Nullable so every existing revision stays valid. A revision carries either
-- all four (validated together) or none. The public bridge only uses featured
-- published revisions whose four fields are all present and valid.
--
-- Local-only in D-106. Applying this to the production database is part of
-- the separately authorized release (CB-R), never implied by this file.

ALTER TABLE project_revisions ADD COLUMN tagline TEXT CHECK (tagline IS NULL OR (tagline = trim(tagline) AND length(tagline) BETWEEN 1 AND 160));
ALTER TABLE project_revisions ADD COLUMN status TEXT CHECK (status IS NULL OR status IN ('', 'Active'));
ALTER TABLE project_revisions ADD COLUMN disciplines_json TEXT;
ALTER TABLE project_revisions ADD COLUMN flow_json TEXT;
