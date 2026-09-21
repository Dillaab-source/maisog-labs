// ML-DEVOS-RFC-016 section D/F / ML-DEVOS-AS-065 -- the local, file-backed
// persistence adapter. Node built-ins only (node:fs, node:path); zero
// third-party dependencies, matching Traceability V1 and S3's precedent.
//
// Two files per task: `<task_id>.json` (the durable record, replaced only via
// write-temp-then-atomic-rename) and `<task_id>.lock` (a pure mutex gate
// created via fs.open(path, "wx") -- POSIX exclusive-create). The lock
// serializes the *entire* read-validate-mutate-persist critical section
// across real concurrent writers, including separate OS processes -- not
// merely two calls interleaving in one JS event loop.
//
// Orphaned-lock recovery is fail-closed, never automatic (AS65-F001's
// remaining blocker, closed in remediation cycle 2): this module never
// inspects a lock file's age to decide whether to steal it. On EEXIST it
// always throws LockHeldError; recovery is exclusively the separate,
// explicitly-invoked forceClearLock() operator/admin action.

import { promises as fs } from "node:fs";
import path from "node:path";
import { isValidTaskId } from "./lifecycle.mjs";
import { validate as validateTaskState } from "./validate-task-state.mjs";

export class LockHeldError extends Error {
  constructor(taskId, lockInfo) {
    super(`LOCK_HELD: task '${taskId}' has an existing lock`);
    this.code = "LOCK_HELD";
    this.taskId = taskId;
    this.lockInfo = lockInfo;
  }
}

export class CorruptRecordError extends Error {
  constructor(taskId, cause, errors) {
    const detail = errors && errors.length ? ` -- structural errors: ${errors.join("; ")}` : "";
    super(`CORRUPT_RECORD: task '${taskId}' state file is not valid JSON or fails structural validation${detail}`);
    this.code = "CORRUPT_RECORD";
    this.taskId = taskId;
    this.cause = cause || null;
    this.errors = errors || [];
  }
}

// S4I-F004: one canonical task-id assertion, applied at the exact point every
// task-id-derived filesystem path is constructed -- the choke point every
// public kernel operation eventually funnels through (withTaskLock,
// readRecordSafe, forceClearLock). A rejected task_id throws before
// `path.join` ever runs with it, so a malformed/path-like id (lowercase,
// containing "/" or "..", empty, too short) never influences filesystem path
// resolution and never creates or deletes anything outside the task-store
// directory.
export class InvalidTaskIdError extends Error {
  constructor(taskId) {
    super(`INVALID_TASK_ID: ${JSON.stringify(taskId)} does not match the required task_id shape (^[A-Z][A-Z0-9_-]*$, length >= 3)`);
    this.code = "INVALID_TASK_ID";
    this.taskId = taskId;
  }
}

function assertValidTaskId(taskId) {
  if (!isValidTaskId(taskId)) throw new InvalidTaskIdError(taskId);
}

function taskFilePath(dir, taskId) {
  assertValidTaskId(taskId);
  return path.join(dir, `${taskId}.json`);
}

function lockFilePath(dir, taskId) {
  assertValidTaskId(taskId);
  return path.join(dir, `${taskId}.lock`);
}

async function acquireLock(dir, taskId, holder, operation) {
  const lockPath = lockFilePath(dir, taskId);
  const payload = JSON.stringify({
    holder,
    operation,
    acquired_at: new Date().toISOString(),
    task_id: taskId,
    pid: process.pid,
  });
  let handle;
  try {
    handle = await fs.open(lockPath, "wx");
    await handle.writeFile(payload, "utf8");
  } catch (err) {
    if (err.code === "EEXIST") {
      let lockInfo = null;
      try {
        lockInfo = JSON.parse(await fs.readFile(lockPath, "utf8"));
      } catch {
        // Best-effort diagnostic read only -- an unreadable/corrupt lock file
        // still counts as held; it never causes a fall-through to stealing it.
      }
      throw new LockHeldError(taskId, lockInfo);
    }
    throw err;
  } finally {
    if (handle) await handle.close();
  }
}

async function releaseLockFile(dir, taskId) {
  try {
    await fs.unlink(lockFilePath(dir, taskId));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

/**
 * forceClearLock -- the explicit, out-of-band operator/admin maintenance
 * action (ML-DEVOS-RFC-016 section D). Never called by any kernel operation
 * itself; the kernel-level authorization gate (task-policy.mjs's
 * forceClearAuthorizedOperators) is enforced by the caller in kernel.mjs
 * before this function ever runs. This function itself enforces only the
 * structural provenance requirements D-050 named.
 */
export async function forceClearLock(dir, taskId, { operator, authorizationRef, reason, confirmedNoWriterRemains }) {
  if (!operator || !authorizationRef || !reason) {
    throw new Error("force_clear_lock requires operator, authorizationRef, and reason");
  }
  if (confirmedNoWriterRemains !== true) {
    throw new Error("force_clear_lock requires explicit confirmedNoWriterRemains: true");
  }
  await releaseLockFile(dir, taskId);
  return {
    cleared: true,
    taskId,
    operator,
    authorizationRef,
    reason,
    clearedAt: new Date().toISOString(),
  };
}

async function readRecordRaw(dir, taskId) {
  const filePath = taskFilePath(dir, taskId);
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  let record;
  try {
    record = JSON.parse(raw);
  } catch (err) {
    throw new CorruptRecordError(taskId, err);
  }
  // S4I-F003: RFC-016 requires corrupted on-disk state to be detected at load
  // time by structural/schema validation, not merely by JSON.parse -- a
  // syntactically valid but structurally invalid record (wrong state enum,
  // missing field, softened disclaimer, etc.) must fail exactly like a
  // torn/invalid-JSON file: scoped to this one task_id, never silently
  // returned to a caller.
  const errors = [];
  if (!validateTaskState(record, errors)) {
    throw new CorruptRecordError(taskId, null, errors);
  }
  return record;
}

/**
 * readRecordSafe -- a plain, lock-free read. Safe without acquiring the
 * mutex because a fully-renamed JSON file is always structurally complete
 * (write-temp-then-atomic-rename never exposes a torn file to a reader), so
 * ordinary reads (get_state, sweep_expired_leases) need no serialization.
 */
export async function readRecordSafe(dir, taskId) {
  return readRecordRaw(dir, taskId);
}

async function writeRecordAtomic(dir, taskId, record) {
  const filePath = taskFilePath(dir, taskId);
  // S4I-F003 defense-in-depth: validate immediately before persistence too,
  // not only on load -- a kernel-logic bug that assembled a malformed record
  // must never itself become the source of a future load-time corruption
  // finding; it fails loudly here, before ever touching disk.
  const errors = [];
  if (!validateTaskState(record, errors)) {
    throw new CorruptRecordError(taskId, null, errors);
  }
  const tmpPath = path.join(dir, `${taskId}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
  await fs.writeFile(tmpPath, JSON.stringify(record, null, 2), "utf8");
  await fs.rename(tmpPath, filePath);
}

/**
 * withTaskLock -- the exact atomic critical section ML-DEVOS-RFC-016 section D
 * specifies: acquire lock -> read -> (caller validates/mutates) -> write-temp
 * -> atomic rename -> release lock, in a finally so the lock is always
 * released whether the callback succeeds or throws. A crash between the read
 * and the rename leaves the persisted `<task_id>.json` untouched (the rename
 * either fully completes or never starts) -- at worst an orphaned lock file,
 * never a partially-applied state record.
 *
 * `fn(currentRecordOrNull)` must return `{ result, newRecord }`, where
 * `newRecord` is the record to persist, or `null`/`undefined` to signal a
 * safe no-op (an idempotent replay, or release()'s already-unowned case) that
 * must not write anything.
 */
export async function withTaskLock(dir, taskId, holder, operation, fn) {
  await fs.mkdir(dir, { recursive: true });
  await acquireLock(dir, taskId, holder, operation);
  try {
    const current = await readRecordRaw(dir, taskId);
    const outcome = await fn(current);
    if (outcome && outcome.newRecord) {
      await writeRecordAtomic(dir, taskId, outcome.newRecord);
    }
    return outcome ? outcome.result : undefined;
  } finally {
    await releaseLockFile(dir, taskId);
  }
}

/**
 * listTaskIds -- enumerates task_ids that have a durable `<task_id>.json`
 * record in `dir`, ignoring `.lock` files and any leftover `.tmp` files from
 * an interrupted write (a stray `.tmp` file is never mistaken for a
 * committed record).
 */
export async function listTaskIds(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  return entries
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length));
}
