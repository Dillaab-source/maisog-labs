// WEB-INC-008 (ML-DEVOS-RFC-005 / ML-DEVOS-AS-017 / D-026) append-only
// audit substrate writer.
//
// This module is the ONLY code permitted to write to audit_log
// (AS17-F006). It exposes exactly one write primitive, appendAuditEvent,
// which always builds one fixed, parameterized INSERT internally — there
// is no caller-provided SQL/table/column path, and there is no update or
// delete helper of any kind (append-only is enforced again, independently,
// at the database layer by the triggers in
// migrations/0002_web_inc_008_audit_log.sql).
//
// There is no HTTP handler in this file and nothing here is imported by
// any admin API route or client-reachable code path (RFC-005 §5, D-026).

// Bounded, metadata-only field allowlist (AS17-F004). Adding a field here
// is a schema-affecting decision, not a validation tweak — it is
// deliberately not permissive-by-default.
const ALLOWED_EVENT_KEYS = ["actor", "action", "entityType", "entityId", "revisionId", "result"];

// action / entityType share one bounded, lowercase name pattern. Entity
// type names in this repository (e.g. "site_settings", "process_step")
// use underscores, so the pattern allows them alongside hyphens.
const NAME_PATTERN = /^[a-z][a-z0-9_-]{0,79}$/;

// entity_id values come from many different base tables' primary keys
// (e.g. "default", "home", "project-fixture"); this bounds length and
// character set without assuming any single table's id convention.
const ENTITY_ID_PATTERN = /^[a-zA-Z0-9_-]{1,200}$/;

// actor is an opaque, trusted-server-supplied reference only — never a
// JWT, an Access claim, or any other credential/token (D-026 identity
// boundary). The validator cannot prove a caller's intent, but bounding
// length and character set to a short printable-ASCII token rejects the
// long, punctuation-heavy shape of real JWTs/Access assertions by
// construction, alongside every other structural check below.
const ACTOR_PATTERN = /^[\x20-\x7e]{1,100}$/;

const ALLOWED_RESULTS = new Set(["success", "failure"]);

const AUDIT_INSERT_SQL =
  "INSERT INTO audit_log (occurred_at, actor, action, entity_type, entity_id, revision_id, result) VALUES (?, ?, ?, ?, ?, ?, ?)";

// WEB-INC-003 (ML-DEVOS-RFC-006 / ML-DEVOS-AS-020 / D-027) addition: the
// fixed audit INSERT shape above, but with the revision_id column supplied
// via a same-transaction subquery against project_revisions instead of a
// bound literal — see buildProjectRevisionAuditStatement below for why.
const AUDIT_INSERT_WITH_PROJECT_REVISION_LOOKUP_SQL =
  "INSERT INTO audit_log (occurred_at, actor, action, entity_type, entity_id, revision_id, result) " +
  "VALUES (?, ?, ?, ?, ?, (SELECT id FROM project_revisions WHERE project_id = ? AND revision_number = ?), ?)";

function fail(message) {
  throw new Error(`invalid audit event: ${message}`);
}

// Shared field checks used by both validateAuditEvent (below, which also
// validates revisionId) and buildProjectRevisionAuditStatement (which
// supplies revision_id via subquery instead, so it validates every other
// field through this same function but never accepts a revisionId at all).
function validateCoreFields({ actor, action, entityType, entityId, result }) {
  if (typeof actor !== "string" || !ACTOR_PATTERN.test(actor)) {
    fail("actor must be a bounded printable opaque string");
  }
  if (typeof action !== "string" || !NAME_PATTERN.test(action)) {
    fail("action must match the bounded lowercase name pattern");
  }
  if (typeof entityType !== "string" || !NAME_PATTERN.test(entityType)) {
    fail("entityType must match the bounded lowercase name pattern");
  }
  if (typeof entityId !== "string" || !ENTITY_ID_PATTERN.test(entityId)) {
    fail("entityId must be a bounded id string");
  }
  if (typeof result !== "string" || !ALLOWED_RESULTS.has(result)) {
    fail("result must be exactly 'success' or 'failure'");
  }
  return { actor, action, entityType, entityId, result };
}

// Strict allowlist validator: rejects any unknown key and validates every
// known field, returning a normalized object ready to persist. Throws
// (never silently drops/coerces a bad field) on the first violation found.
export function validateAuditEvent(event) {
  if (event === null || typeof event !== "object" || Array.isArray(event)) {
    fail("event must be a plain object");
  }

  for (const key of Object.keys(event)) {
    if (!ALLOWED_EVENT_KEYS.includes(key)) {
      fail(`unknown field '${key}'`);
    }
  }

  const core = validateCoreFields(event);
  const { revisionId } = event;

  let normalizedRevisionId = null;
  if (revisionId !== undefined && revisionId !== null) {
    if (!Number.isSafeInteger(revisionId) || revisionId < 1) {
      fail("revisionId must be null/undefined or a positive safe integer");
    }
    normalizedRevisionId = revisionId;
  }

  return { ...core, revisionId: normalizedRevisionId };
}

// Builds (but does not execute) the fixed, parameterized audit INSERT
// statement for a fully-known event — the same statement appendAuditEvent
// below runs immediately. Returning it unexecuted lets a caller (e.g. a
// WEB-INC-003 publish/unpublish mutation, where the affected revision's id
// is already known from an earlier read) include it in its OWN db.batch()
// call, so a successful business mutation and its success audit event
// commit as one atomic transaction (AS20-F009) rather than as two separate
// D1 calls.
export function buildAuditAppendStatement(db, event) {
  const validated = validateAuditEvent(event);
  const occurredAt = new Date().toISOString();
  return db
    .prepare(AUDIT_INSERT_SQL)
    .bind(
      occurredAt,
      validated.actor,
      validated.action,
      validated.entityType,
      validated.entityId,
      validated.revisionId,
      validated.result
    );
}

// Bounded server-only append primitive (AS17-F006, RFC-005 §5). Validates
// the complete event, generates occurred_at itself (never accepts a
// caller-supplied timestamp), and issues exactly one fixed, parameterized
// INSERT. Any D1-level failure (including a validation failure above)
// propagates by throwing/rejecting — there is no try/catch here that could
// swallow a storage failure and report success instead (D-026 failure
// semantics; a business/admin failure is represented by result: "failure"
// rows persisting normally, which is a distinct case from the audit
// writer's own storage call itself failing).
export async function appendAuditEvent(db, event) {
  await buildAuditAppendStatement(db, event).run();
}

// WEB-INC-003 (ML-DEVOS-RFC-006 / ML-DEVOS-AS-020 / D-027) addition.
//
// project create-draft and edit-draft each insert a brand-new
// project_revisions row inside the same db.batch() transaction that must
// also record that row's id as the audit event's revision_id — but the
// row's autoincrement id is not known in JS until after the INSERT runs,
// and AS20-F010 forbids relying on undocumented connection-local
// last_insert_rowid() behavior or race-prone id preallocation to bridge
// that gap. The safe, already-accepted strategy — identical to
// worker/d1/migrate.mjs's pointer-update pattern, itself accepted under
// ADR-003 — is a same-transaction subquery keyed on project_revisions'
// UNIQUE (project_id, revision_number) constraint: once the revision INSERT
// earlier in the same db.batch() has run, any later statement in that same
// batch can resolve its id via a plain SELECT. This is standard, documented
// SQL transaction visibility, not undocumented driver behavior.
//
// This export is intentionally narrow and hardcoded to project_revisions —
// it is not a generic arbitrary-table/column lookup helper — because that
// is the one correlation this capability needs (AS20-F009's "narrow
// internal prepared audit-statement helper" allowance). Every other field
// is validated exactly as validateAuditEvent would validate it; entityType
// is fixed to "project" by this function, never caller-supplied.
export function buildProjectRevisionAuditStatement(db, { actor, action, entityId, projectId, revisionNumber, result }) {
  const validated = validateCoreFields({ actor, action, entityType: "project", entityId, result });
  if (typeof projectId !== "string" || !ENTITY_ID_PATTERN.test(projectId)) {
    fail("projectId must be a bounded id string");
  }
  if (!Number.isSafeInteger(revisionNumber) || revisionNumber < 1) {
    fail("revisionNumber must be a positive safe integer");
  }
  const occurredAt = new Date().toISOString();
  return db
    .prepare(AUDIT_INSERT_WITH_PROJECT_REVISION_LOOKUP_SQL)
    .bind(
      occurredAt,
      validated.actor,
      validated.action,
      validated.entityType,
      validated.entityId,
      projectId,
      revisionNumber,
      validated.result
    );
}
