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

function fail(message) {
  throw new Error(`invalid audit event: ${message}`);
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

  const { actor, action, entityType, entityId, revisionId, result } = event;

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

  let normalizedRevisionId = null;
  if (revisionId !== undefined && revisionId !== null) {
    if (!Number.isSafeInteger(revisionId) || revisionId < 1) {
      fail("revisionId must be null/undefined or a positive safe integer");
    }
    normalizedRevisionId = revisionId;
  }

  if (typeof result !== "string" || !ALLOWED_RESULTS.has(result)) {
    fail("result must be exactly 'success' or 'failure'");
  }

  return {
    actor,
    action,
    entityType,
    entityId,
    revisionId: normalizedRevisionId,
    result,
  };
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
  const validated = validateAuditEvent(event);
  const occurredAt = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO audit_log (occurred_at, actor, action, entity_type, entity_id, revision_id, result) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      occurredAt,
      validated.actor,
      validated.action,
      validated.entityType,
      validated.entityId,
      validated.revisionId,
      validated.result
    )
    .run();
}
