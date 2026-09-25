// S6 task store (ML-DEVOS-RFC-019 §13.2; D-074).
//
// One crash-atomic state envelope per task plus a content-addressed blob
// directory. Every mutable S6 fact for a task lives in the envelope and
// changes only by one local transaction:
//   - all or nothing: a commit writes a complete temporary envelope, fsyncs
//     it, renames it over the previous envelope and fsyncs the directory, so a
//     process crash leaves either the old or the new committed state;
//   - one writer, versioned: writers serialize under the per-task exclusive
//     lock (never stolen), and each commit carries base version + 1 after a
//     compare-and-set against the envelope re-read under that lock;
//   - immutable bodies are blobs named by their SHA-256, written, fsynced and
//     re-verified before any transaction may reference them.
//
// Replace-atomicity is relied on only on platforms where it has been proven
// (§13.2 "Proof first"; tests/execution-store.test.mjs). Elsewhere the store
// refuses to open rather than quietly degrade.
//
// This module is internal: index.mjs never exports it, and no value returned
// by the production host exposes it (§13.5).
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { lifecycle } from "../state/kernel.mjs";
import { canonicalJson, sha256 } from "./digest.mjs";
import { HEX64, fail } from "./vocabulary.mjs";

export const STORE_FORMAT = "sentinel-s6-task-store/1";
export const ENVELOPE = "envelope.json";
export const STORE_PROVEN_PLATFORMS = Object.freeze(["linux"]);

const TMP_ENVELOPE = /^\.envelope\.[0-9a-f]{16}\.tmp$/;
const TMP_BLOB = /^\.[0-9a-f]{64}\.[0-9a-f]{16}\.tmp$/;

// A fresh task's committed state. Everything the host records for the task
// lives under these keys (§13.2 "The boundary").
export function emptyTaskState() {
  return {
    slot: null,
    creates: {},
    attempts: {},
    instances: {},
    permits: {},
    bindings: {},
    rtr: {},
    intents: {},
    journal: {},
  };
}

function deepFreeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v)) deepFreeze(v[k]);
  }
  return v;
}

function fsyncDir(dir) {
  const fd = fs.openSync(dir, "r");
  try {
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function writeFully(fd, buf) {
  let off = 0;
  while (off < buf.length) off += fs.writeSync(fd, buf, off, buf.length - off);
}

export class TaskStore {
  // `hooks` is test-only fault injection (§13.5): only testing.mjs passes it.
  constructor(stateDir, { platform = process.platform, hooks = null } = {}) {
    if (!STORE_PROVEN_PLATFORMS.includes(platform)) {
      fail("ISOLATION_CAPABILITY_MISSING", `S6 task-store replace-atomicity is not proven on platform ${platform}`);
    }
    if (typeof stateDir !== "string" || !path.isAbsolute(stateDir)) fail("MALFORMED_REQUEST", "task store requires an absolute state directory");
    this.root = path.join(stateDir, "tasks");
    this.hooks = hooks;
  }

  point(name, ctx) {
    this.hooks?.(name, ctx);
  }

  taskDir(taskId, { create = true } = {}) {
    if (!lifecycle.isValidTaskId(taskId)) fail("MALFORMED_REQUEST", `invalid task_id ${taskId}`);
    const d = path.join(this.root, taskId);
    if (create) fs.mkdirSync(path.join(d, "blobs"), { recursive: true });
    return d;
  }

  listTasks() {
    return fs.existsSync(this.root) ? fs.readdirSync(this.root).filter((t) => lifecycle.isValidTaskId(t)).sort() : [];
  }

  // ------------------------------------------------------------ envelope
  // The committed state as a deep-frozen snapshot. An absent envelope is the
  // empty state at version 0. Any unreadable or inconsistent envelope blocks
  // the task (§15 recovery step 1): nothing is repaired by inference.
  read(taskId) {
    const file = path.join(this.taskDir(taskId, { create: false }), ENVELOPE);
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") return deepFreeze({ version: 0, state: emptyTaskState() });
      fail("ISOLATION_UNPROVABLE", `task store for ${taskId} cannot be read (${err.code})`);
    }
    let env;
    try {
      env = JSON.parse(text);
    } catch {
      fail("ISOLATION_UNPROVABLE", `task store envelope for ${taskId} is not JSON`);
    }
    const ok = env && env.format === STORE_FORMAT && env.task_id === taskId && Number.isSafeInteger(env.version) && env.version > 0
      && env.state && typeof env.state === "object" && HEX64.test(env.state_digest ?? "")
      && sha256(canonicalJson(env.state)) === env.state_digest;
    if (!ok) fail("ISOLATION_UNPROVABLE", `task store envelope for ${taskId} is inconsistent`);
    return deepFreeze({ version: env.version, state: env.state });
  }

  // Per-task exclusive lock (exclusive create). A held lock is waited on for
  // at most `waitMs`, then fails closed. It is never stolen (§13.2 rule 2).
  async withLock(taskId, fn, { waitMs = 0 } = {}) {
    const lock = path.join(this.taskDir(taskId), "lock");
    const deadline = Date.now() + waitMs;
    let fd;
    for (;;) {
      try {
        fd = fs.openSync(lock, "wx", 0o600);
        break;
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
        if (Date.now() >= deadline) fail("ISOLATION_UNPROVABLE", `S6 task store lock for ${taskId} is held (no automatic stealing)`);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }
    fs.closeSync(fd);
    try {
      return await fn();
    } finally {
      fs.rmSync(lock, { force: true });
    }
  }

  // Writes `state` as version `baseVersion + 1`. The caller must hold the
  // task lock; the compare-and-set re-reads the committed version first.
  commit(taskId, baseVersion, draft) {
    const state = JSON.parse(JSON.stringify(draft));
    const dir = this.taskDir(taskId);
    const current = this.read(taskId).version;
    if (current !== baseVersion) fail("ISOLATION_UNPROVABLE", `task store compare-and-set refused for ${taskId} (base ${baseVersion}, current ${current})`);
    for (const n of fs.readdirSync(dir)) if (TMP_ENVELOPE.test(n)) fs.rmSync(path.join(dir, n), { force: true });
    const version = baseVersion + 1;
    const bytes = Buffer.from(`${JSON.stringify({ format: STORE_FORMAT, task_id: taskId, version, state, state_digest: sha256(canonicalJson(state)) })}\n`);
    const tmp = path.join(dir, `.envelope.${randomBytes(8).toString("hex")}.tmp`);
    const fd = fs.openSync(tmp, "wx", 0o600);
    try {
      writeFully(fd, bytes);
      this.point("envelope:written", { taskId, version });
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    this.point("envelope:synced", { taskId, version });
    fs.renameSync(tmp, path.join(dir, ENVELOPE));
    this.point("envelope:renamed", { taskId, version });
    fsyncDir(dir);
    this.point("envelope:committed", { taskId, version });
    return version;
  }

  // One logical local transition (§13.2). `fn` receives a mutable draft of the
  // committed state and the base version; its checks run under the lock,
  // immediately before the commit that depends on them. It must not perform an
  // external effect (§13.2 rule 6). If `fn` throws, nothing is committed. If it
  // leaves the draft unchanged, nothing is written.
  async transact(taskId, fn, { waitMs = 0 } = {}) {
    return this.withLock(taskId, async () => {
      const { version, state } = this.read(taskId);
      const draft = structuredClone(state);
      const before = canonicalJson(draft);
      const result = await fn(draft, { version });
      if (canonicalJson(draft) !== before) this.commit(taskId, version, draft);
      return result;
    }, { waitMs });
  }

  // ------------------------------------------------------------ blobs
  blobPath(taskId, digest) {
    if (!HEX64.test(digest ?? "")) fail("MALFORMED_REQUEST", "invalid blob digest");
    return path.join(this.taskDir(taskId), "blobs", digest);
  }

  // Content-addressed, immutable, idempotent. Returns the digest only after
  // the bytes are complete, fsynced, published under their digest and
  // re-verified (§13.2 rule 4).
  putBlob(taskId, data) {
    const bytes = Buffer.isBuffer(data) ? data : Buffer.from(String(data), "utf8");
    const digest = sha256(bytes);
    const final = this.blobPath(taskId, digest);
    const dir = path.dirname(final);
    if (!fs.existsSync(final)) {
      for (const n of fs.readdirSync(dir)) if (TMP_BLOB.test(n) && n.startsWith(`.${digest}.`)) fs.rmSync(path.join(dir, n), { force: true });
      const tmp = path.join(dir, `.${digest}.${randomBytes(8).toString("hex")}.tmp`);
      const fd = fs.openSync(tmp, "wx", 0o600);
      try {
        writeFully(fd, bytes);
        this.point("blob:written", { taskId, digest });
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      try {
        fs.linkSync(tmp, final);
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
      } finally {
        fs.rmSync(tmp, { force: true });
      }
      this.point("blob:linked", { taskId, digest });
      fsyncDir(dir);
    }
    this.readBlob(taskId, digest);
    return digest;
  }

  // The verified bytes, or a fail-closed error. `code` lets RTR callers report
  // RESULT_TRANSFER_UNPROVEN instead of the generic code (§13.2 rule 4).
  readBlob(taskId, digest, { code = "ISOLATION_UNPROVABLE" } = {}) {
    let bytes;
    try {
      bytes = fs.readFileSync(this.blobPath(taskId, digest));
    } catch {
      fail(code, `blob ${digest} is missing`);
    }
    if (sha256(bytes) !== digest) fail(code, `blob ${digest} does not match its digest`);
    return bytes;
  }

  listBlobs(taskId) {
    const d = path.join(this.taskDir(taskId), "blobs");
    return fs.readdirSync(d).filter((n) => HEX64.test(n)).sort();
  }
}
