// RFC-022 (ML-DEVOS-AS-132, D-105/D-106): reads the bridge snapshot from the
// existing D1 revision substrate. No snapshot table: published pointers are
// the published state, and one db.batch() gives a consistent read.
//
// Homepage eligibility (Tier 1): a project revision is a homepage candidate
// only if it is featured AND carries all four V10 fields (migration 0006).
// Legacy featured revisions without V10 fields (for example the seeded
// data/site.js projects) are ignored, never blocked and never partially used.
//
// Contact email: only a site_settings revision created through the governed
// admin lifecycle (created_by = "cf-access:<sub>") can feed the bridge. The
// migration-seeded revision (data/site.js) therefore never publishes an email
// that Paulo has not deliberately published (D-105 Q3 deliverability rule).
import { MAX_HOMEPAGE_PROJECTS, validateV10ProjectFields } from "./payload.mjs";

const ADMIN_ACTOR_PREFIX = "cf-access:";

function projectsSql(pointer) {
  return (
    "SELECT p.slug, r.title, r.category, r.summary, r.tagline, r.status, r.disciplines_json, r.flow_json, r.case_study_enabled " +
    "FROM projects p JOIN project_revisions r ON r.id = " +
    pointer +
    " AND r.project_id = p.id " +
    "WHERE r.featured = 1 AND r.tagline IS NOT NULL AND r.status IS NOT NULL AND r.disciplines_json IS NOT NULL AND r.flow_json IS NOT NULL " +
    "ORDER BY r.sort_order ASC, p.id ASC LIMIT " +
    (MAX_HOMEPAGE_PROJECTS + 1)
  );
}

function siteSql(pointer) {
  return (
    "SELECT r.contact_email, r.created_by FROM site_settings s JOIN site_settings_revisions r ON r.id = " +
    pointer +
    " AND r.site_settings_id = s.id WHERE s.id = 'default'"
  );
}

function rowToProject(row) {
  if (row.case_study_enabled !== 0 && row.case_study_enabled !== 1) throw new Error("case study flag: invalid stored value");
  const v10 = validateV10ProjectFields({
    tagline: row.tagline,
    status: row.status,
    disciplines: JSON.parse(row.disciplines_json),
    flow: JSON.parse(row.flow_json),
    caseStudyEnabled: row.case_study_enabled === 1,
  });
  return { name: row.title, kind: row.category, slug: row.slug, description: row.summary, ...v10 };
}

// mode "published": published pointers only (public `/`).
// mode "draft": draft pointer when present, else published (authenticated
// /admin/preview/home only).
export async function readBridgeSnapshot(db, { mode = "published" } = {}) {
  const projectPointer = mode === "draft" ? "COALESCE(p.draft_revision_id, p.published_revision_id)" : "p.published_revision_id";
  const sitePointer = mode === "draft" ? "COALESCE(s.draft_revision_id, s.published_revision_id)" : "s.published_revision_id";
  const [projectsResult, siteResult] = await db.batch([db.prepare(projectsSql(projectPointer)), db.prepare(siteSql(sitePointer))]);

  let projects = null;
  const projectRows = projectsResult?.results ?? [];
  if (projectRows.length > 0) {
    try {
      projects = projectRows.map(rowToProject);
    } catch {
      projects = []; // a malformed stored row invalidates the whole group
    }
  }

  let email = null;
  const siteRow = siteResult?.results?.[0];
  if (siteRow && typeof siteRow.created_by === "string" && siteRow.created_by.startsWith(ADMIN_ACTOR_PREFIX)) {
    email = siteRow.contact_email;
  }
  return { projects, email };
}

// Count of published homepage-eligible projects, excluding one project id.
export async function countPublishedHomepageProjects(db, { excludeProjectId }) {
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS n FROM projects p JOIN project_revisions r ON r.id = p.published_revision_id AND r.project_id = p.id " +
        "WHERE r.featured = 1 AND r.tagline IS NOT NULL AND r.status IS NOT NULL AND r.disciplines_json IS NOT NULL AND r.flow_json IS NOT NULL AND p.id != ?"
    )
    .bind(excludeProjectId)
    .first();
  return row?.n ?? 0;
}
