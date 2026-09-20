// ML-DEVOS-RFC-016 / ML-DEVOS-AS-065 / D-050 -- the S4 State Machine Kernel's
// public operations: createTask, claim, renew, release, transition,
// getState, sweepExpiredLeases, forceClearLock. Composes the pure transition
// logic in lifecycle.mjs, the explicit Task Policy in task-policy.mjs, and
// the file-backed persistence/locking adapter in store.mjs.
//
// This is a pure, deterministic transition-function library, not an active
// scheduler, orchestrator, evidence store, or permission gateway (RFC-016
// section A/H). It never decides whether evidence is *sufficient*, only
// whether a required evidence-reference class-label is *present* on the six
// named transitions; it never dispatches actors or times anything out on its
// own; and it never itself claims merge/deployment/production authority --
// see authority_disclaimer on every record.

import * as store from "./store.mjs";
import * as lifecycle from "./lifecycle.mjs";
import { TASK_POLICY } from "./task-policy.mjs";

export { LockHeldError, CorruptRecordError } from "./store.mjs";

function nowMs(now) {
  return typeof now === "function" ? now() : typeof now === "number" ? now : Date.now();
}

function taskError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function notFound(taskId) {
  return taskError("TASK_NOT_FOUND", `Task '${taskId}' does not exist`);
}

// Kept as two distinct checks/errors (not one combined "owner-or-revision"
// throw) so a real caller's diagnostic message is honest about which fact
// actually failed -- a fencing failure after a handoff clears ownership
// looks identical to a genuine stale-revision race if the two are conflated,
// which made an early implementation pass of this file's own test suite
// briefly misdiagnose "not the current owner after a handoff" as a same-
// numbered "revision conflict."
function notCurrentOwner(taskId, actorId, currentOwner) {
  return taskError(
    "NOT_CURRENT_OWNER",
    `Task '${taskId}': actor '${actorId}' is not the current owner ('${currentOwner}') -- it may have already been handed off, released, or superseded`,
  );
}

function revisionConflict(taskId, expected, actual) {
  return taskError(
    "REVISION_CONFLICT",
    `Task '${taskId}': presented revision ${expected} does not match current revision ${actual} (stale caller)`,
  );
}

function checkOwnerAndRevision(taskId, record, actorId, expectedRevision) {
  if (record.owner !== actorId) throw notCurrentOwner(taskId, actorId, record.owner);
  if (record.revision !== expectedRevision) throw revisionConflict(taskId, expectedRevision, record.revision);
}

function stableStringify(value) {
  // Deterministic-enough structural equality for idempotency-key binding
  // comparison and evidence_ref content hashing. Not a cryptographic hash --
  // this kernel only needs equality, not collision-resistance, for a
  // repository-local, non-adversarial, single-project V1 store.
  return JSON.stringify(value === undefined ? null : value);
}

function newTaskRecord(taskId, contractRef) {
  return {
    task_id: taskId,
    contract_ref: contractRef,
    state: "CREATED",
    owner: null,
    revision: 0,
    lease_expires_at: null,
    retry_counts: { build: 0, qa: 0, review: 0 },
    idempotency_ledger: {},
    history: [],
    authority_disclaimer: lifecycle.AUTHORITY_DISCLAIMER,
  };
}

const MAX_HISTORY_ENTRIES = 200;

function appendHistory(record, entry) {
  record.history.push(entry);
  if (record.history.length > MAX_HISTORY_ENTRIES) {
    record.history.splice(0, record.history.length - MAX_HISTORY_ENTRIES);
  }
}

/**
 * checkIdempotency -- shared replay/conflict logic for claim/renew/transition.
 * release() deliberately does not use this ledger; see release() below for
 * its documented already-unowned no-op exception instead (RFC-016 section E).
 */
function checkIdempotency(record, operationClass, idempotencyKey, binding) {
  if (!idempotencyKey) return { replay: false };
  const ledger = record.idempotency_ledger[operationClass];
  const existing = ledger && ledger[idempotencyKey];
  if (!existing) return { replay: false };
  if (existing.bindingHash === stableStringify(binding)) {
    return { replay: true, result: existing.result };
  }
  throw taskError(
    "IDEMPOTENCY_CONFLICT",
    `Conflicting idempotency-key reuse for ${operationClass}:${idempotencyKey} (request parameters differ from the original)`,
  );
}

function recordIdempotency(record, operationClass, idempotencyKey, binding, result) {
  if (!idempotencyKey) return;
  if (!record.idempotency_ledger[operationClass]) record.idempotency_ledger[operationClass] = {};
  record.idempotency_ledger[operationClass][idempotencyKey] = {
    bindingHash: stableStringify(binding),
    result,
  };
}

/**
 * createTask -- the "(none) -> CREATED" step of RFC-016's transition table:
 * registers a task against its S3 Task Contract reference. Idempotent when
 * retried with the same contract_ref; rejected as a conflict if a caller
 * tries to re-register the same task_id against a different contract_ref.
 */
export async function createTask({ dir, taskId, contractRef }) {
  // S4I-F004: reject an empty/invalid contract_ref before ever acquiring the
  // lock or touching the filesystem -- task_id's own shape is asserted by
  // store.mjs's taskFilePath/lockFilePath choke point (InvalidTaskIdError).
  if (typeof contractRef !== "string" || contractRef.length < 1) {
    throw taskError("INVALID_CONTRACT_REF", "createTask requires a non-empty string contract_ref");
  }
  return store.withTaskLock(dir, taskId, "SYSTEM", "create", async (current) => {
    if (current) {
      if (current.contract_ref === contractRef) {
        return { result: { taskId, state: current.state, revision: current.revision }, newRecord: null };
      }
      throw taskError("TASK_ALREADY_EXISTS", `Task '${taskId}' already exists with a different contract_ref`);
    }
    const record = newTaskRecord(taskId, contractRef);
    appendHistory(record, { type: "create", at: Date.now(), revision: record.revision });
    return { result: { taskId, state: record.state, revision: record.revision }, newRecord: record };
  });
}

/**
 * claim -- single-owner claim (RFC-016 section D). Succeeds only if the task
 * is unowned or its lease has expired at the presented `now`.
 */
export async function claim({ dir, taskId, actorId, leaseDurationMs, idempotencyKey, now }) {
  return store.withTaskLock(dir, taskId, actorId, "claim", async (current) => {
    if (!current) throw notFound(taskId);
    const record = current;
    const binding = { actorId, leaseDurationMs };
    const replay = checkIdempotency(record, "claim", idempotencyKey, binding);
    if (replay.replay) return { result: replay.result, newRecord: null };

    const t = nowMs(now);
    const claimable = record.owner == null || (record.lease_expires_at != null && record.lease_expires_at <= t);
    if (!claimable) {
      throw taskError("CLAIM_CONFLICT", `Task '${taskId}' is already claimed and its lease has not expired`);
    }

    record.owner = actorId;
    record.lease_expires_at = t + leaseDurationMs;
    record.revision += 1;
    appendHistory(record, { type: "claim", actorId, at: t, revision: record.revision });

    const result = {
      taskId,
      state: record.state,
      owner: record.owner,
      revision: record.revision,
      lease_expires_at: record.lease_expires_at,
    };
    recordIdempotency(record, "claim", idempotencyKey, binding, result);
    return { result, newRecord: record };
  });
}

/**
 * renew -- extends the current owner's lease. Fencing-guarded: the presented
 * actorId/revision must match the persisted record exactly.
 */
export async function renew({ dir, taskId, actorId, expectedRevision, newLeaseDurationMs, idempotencyKey, now }) {
  return store.withTaskLock(dir, taskId, actorId, "renew", async (current) => {
    if (!current) throw notFound(taskId);
    const record = current;
    const binding = { actorId, expectedRevision, newLeaseDurationMs };
    const replay = checkIdempotency(record, "renew", idempotencyKey, binding);
    if (replay.replay) return { result: replay.result, newRecord: null };

    checkOwnerAndRevision(taskId, record, actorId, expectedRevision);

    const t = nowMs(now);
    record.lease_expires_at = t + newLeaseDurationMs;
    record.revision += 1;
    appendHistory(record, { type: "renew", actorId, at: t, revision: record.revision });

    const result = {
      taskId,
      state: record.state,
      owner: record.owner,
      revision: record.revision,
      lease_expires_at: record.lease_expires_at,
    };
    recordIdempotency(record, "renew", idempotencyKey, binding, result);
    return { result, newRecord: record };
  });
}

/**
 * release -- clears ownership without changing state. Documented
 * already-unowned no-op exception (RFC-016 section E): if the task is
 * already unowned, release() always succeeds as a safe replay regardless of
 * the presented revision, since the caller's intent is already satisfied and
 * no further mutation occurs. If owned by someone else, it is a genuine
 * conflict, never silently treated as a safe replay.
 */
export async function release({ dir, taskId, actorId, expectedRevision }) {
  return store.withTaskLock(dir, taskId, actorId, "release", async (current) => {
    if (!current) throw notFound(taskId);
    const record = current;

    if (record.owner == null) {
      return {
        result: { taskId, state: record.state, owner: null, revision: record.revision },
        newRecord: null,
      };
    }

    checkOwnerAndRevision(taskId, record, actorId, expectedRevision);

    record.owner = null;
    record.lease_expires_at = null;
    record.revision += 1;
    appendHistory(record, { type: "release", actorId, at: Date.now(), revision: record.revision });

    return {
      result: { taskId, state: record.state, owner: null, revision: record.revision },
      newRecord: record,
    };
  });
}

/**
 * transition -- the core state-mutation operation. Validates structural
 * legality via lifecycle.checkTransition (never coordination/STATE.md-derived
 * policy), applies retry-counter increments, commits the new state, and --
 * for a designated handoff destination -- atomically clears owner/lease in
 * the same write, fencing the outgoing owner via the revision bump alone.
 */
export async function transition({
  dir,
  taskId,
  actorId,
  requesterRole,
  expectedRevision,
  toState,
  idempotencyKey,
  evidenceRef,
  explicitFailureFlag,
  explicitAmbiguityFlag,
  decisionRef,
  now,
}) {
  return store.withTaskLock(dir, taskId, actorId, "transition", async (current) => {
    if (!current) throw notFound(taskId);
    const record = current;
    const fromState = record.state;

    // Implementation note (deviation from RFC-016 section E's literal binding
    // list, flagged for Architect review): the RFC named `from_state` as part
    // of this binding. `from_state` derived from the *current* persisted
    // record is not stable across a replay, though -- by the time a retry
    // arrives, the original successful call has already advanced the
    // record's state, so recomputing `fromState` fresh on the replay attempt
    // would spuriously disagree with the binding stored at the original
    // call's time, turning every genuine identical-key replay into a false
    // IDEMPOTENCY_CONFLICT. `expectedRevision` already uniquely pins the
    // exact record version the caller intended to act on -- strictly more
    // precise than a bare state name -- so it alone suffices as the
    // "from-state" component of this binding; `from_state` is dropped here.
    // S4I-F001 remediation: decisionRef is now potentially material to the
    // transition's own legality (REVIEW->APPROVED, REVIEW->CHANGES_REQUESTED,
    // PAULO_DECISION_REQUIRED->BUILDING, and every ->ABANDONED edge), so it
    // must be bound into the idempotency comparison exactly like evidenceRef
    // already was -- reusing one idempotency key with a different decision
    // reference must conflict, never silently replay the first decision.
    const binding = {
      toState,
      expectedRevision,
      evidenceRefHash: evidenceRef ? stableStringify(evidenceRef) : null,
      decisionRefHash: decisionRef ? stableStringify(decisionRef) : null,
    };
    const replay = checkIdempotency(record, "transition", idempotencyKey, binding);
    if (replay.replay) return { result: replay.result, newRecord: null };

    checkOwnerAndRevision(taskId, record, actorId, expectedRevision);

    const check = lifecycle.checkTransition({
      from: fromState,
      to: toState,
      requesterRole,
      evidenceRef,
      decisionRef,
      retryCounts: record.retry_counts,
      retryCeilings: TASK_POLICY.retryCeilings,
      explicitFailureFlag,
      explicitAmbiguityFlag,
    });
    if (!check.ok) {
      throw taskError("ILLEGAL_TRANSITION", check.reason);
    }

    const t = nowMs(now);
    const increments = lifecycle.retryIncrementsFor(fromState, toState);
    record.retry_counts.build += increments.build;
    record.retry_counts.qa += increments.qa;
    record.retry_counts.review += increments.review;

    record.state = toState;
    record.revision += 1;

    // S4I-F002 remediation: the clearing decision is per exact (from, to)
    // edge, not per destination name -- QA->BUILDING is a genuine cross-role
    // handoff (QA sending a defect back to a Builder who must claim fresh),
    // while CHANGES_REQUESTED->BUILDING and PAULO_DECISION_REQUIRED->BUILDING
    // legitimately retain the actor that transition itself just routed to.
    if (lifecycle.isHandoffEdge(fromState, toState)) {
      record.owner = null;
      record.lease_expires_at = null;
    }

    appendHistory(record, {
      type: "transition",
      from: fromState,
      to: toState,
      actorId,
      at: t,
      revision: record.revision,
      evidenceRef: evidenceRef || null,
      decisionRef: decisionRef || null,
    });

    const result = { taskId, state: record.state, owner: record.owner, revision: record.revision };
    recordIdempotency(record, "transition", idempotencyKey, binding, result);
    return { result, newRecord: record };
  });
}

/**
 * getState -- read-only. Never acquires the lock (see store.readRecordSafe).
 */
export async function getState({ dir, taskId }) {
  const record = await store.readRecordSafe(dir, taskId);
  if (!record) return null;
  return {
    taskId,
    contract_ref: record.contract_ref,
    state: record.state,
    owner: record.owner,
    revision: record.revision,
    lease_expires_at: record.lease_expires_at,
    retry_counts: { ...record.retry_counts },
    authority_disclaimer: record.authority_disclaimer,
  };
}

/**
 * sweepExpiredLeases -- a passive, read-only query a future Orchestrator (S8)
 * may poll. Never itself triggers any transition or timeout action (RFC-016
 * section E's deliberately passive timeout-handling boundary).
 */
export async function sweepExpiredLeases({ dir, now }) {
  const taskIds = await store.listTaskIds(dir);
  const t = nowMs(now);
  const expired = [];
  for (const taskId of taskIds) {
    const record = await store.readRecordSafe(dir, taskId);
    if (record && record.owner != null && record.lease_expires_at != null && record.lease_expires_at <= t) {
      expired.push({ taskId, owner: record.owner, lease_expires_at: record.lease_expires_at });
    }
  }
  return expired;
}

/**
 * forceClearLock -- the separate, out-of-band operator/admin maintenance
 * action (RFC-016 section D; D-050's explicit authorization). This is NOT an
 * ordinary kernel mutation: it is never called by claim/renew/release/
 * transition, and it enforces D-050's operator/provenance conditions before
 * delegating to store.forceClearLock's structural requirements.
 */
export async function forceClearLock({ dir, taskId, operator, authorizationRef, reason, confirmedNoWriterRemains }) {
  if (!TASK_POLICY.forceClearAuthorizedOperators.includes(operator)) {
    throw taskError(
      "FORCE_CLEAR_UNAUTHORIZED",
      `Operator '${operator}' is not an authorized force-clear operator for ${TASK_POLICY.project}; a separate Paulo delegation Decision is required`,
    );
  }
  return store.forceClearLock(dir, taskId, { operator, authorizationRef, reason, confirmedNoWriterRemains });
}

export { TASK_POLICY } from "./task-policy.mjs";
export * as lifecycle from "./lifecycle.mjs";
