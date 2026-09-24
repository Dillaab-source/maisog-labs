// S6 host registry (ML-DEVOS-RFC-019 §7.1, §13, §13.1, §15).
//
// Under the host state directory, outside every instance root and Git tree.
// Same proven patterns as S4 (exclusive-create lock, write-temp-then-atomic-
// rename, no age-based lock stealing), in S6's own storage.
import fs from "node:fs";
import path from "node:path";

import { lifecycle } from "../state/kernel.mjs";
import { sha256 } from "./digest.mjs";
import { createFileExclusive, publishFileExclusive, writeAtomic } from "./paths.mjs";
import { HEX64, ID128, fail } from "./vocabulary.mjs";

export class Registry {
  constructor(stateDir) {
    this.stateDir = stateDir;
  }

  dir(...parts) {
    const d = path.join(this.stateDir, ...parts);
    fs.mkdirSync(d, { recursive: true });
    return d;
  }

  taskDir(taskId, ...sub) {
    if (!lifecycle.isValidTaskId(taskId)) fail("MALFORMED_REQUEST", `invalid task_id ${taskId}`);
    return this.dir("registry", taskId, ...sub);
  }

  journalPath(instanceId) {
    if (!ID128.test(instanceId ?? "")) fail("MALFORMED_REQUEST", "invalid instance_id");
    return path.join(this.dir("journal"), `${instanceId}.jsonl`);
  }

  // Per-task mutex. A held lock is waited on for at most `waitMs` (default:
  // not at all), then fails closed; a lock is NEVER stolen -- removing a stale
  // lock is an explicit, authorized operator action.
  async withTaskLock(taskId, fn, { waitMs = 0 } = {}) {
    const lock = path.join(this.taskDir(taskId), "lock");
    const deadline = Date.now() + waitMs;
    let fd;
    for (;;) {
      try {
        fd = fs.openSync(lock, "wx", 0o600);
        break;
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
        if (Date.now() >= deadline) fail("ISOLATION_UNPROVABLE", `S6 registry lock for ${taskId} is held (no automatic stealing)`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    fs.closeSync(fd);
    try {
      return await fn();
    } finally {
      fs.rmSync(lock, { force: true });
    }
  }

  readJson(file) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  }

  writeJson(dir, name, value) {
    writeAtomic({ native: dir }, name, `${JSON.stringify(value, null, 2)}\n`);
  }

  // ------------------------------------------------------------ instances
  getInstance(taskId, instanceId) {
    if (!ID128.test(instanceId ?? "")) fail("MALFORMED_REQUEST", "invalid instance_id");
    return this.readJson(path.join(this.taskDir(taskId, "instances"), `${instanceId}.json`));
  }

  putInstance(record) {
    this.writeJson(this.taskDir(record.task_id, "instances"), `${record.instance_id}.json`, record);
  }

  listTasks() {
    const d = path.join(this.stateDir, "registry");
    return fs.existsSync(d) ? fs.readdirSync(d).filter((t) => lifecycle.isValidTaskId(t)) : [];
  }

  listInstances(taskId) {
    const d = this.taskDir(taskId, "instances");
    return fs.readdirSync(d).filter((n) => /^[0-9a-f]{32}\.json$/.test(n)).map((n) => this.readJson(path.join(d, n)));
  }

  findInstance(instanceId) {
    if (!ID128.test(instanceId ?? "")) return null;
    for (const t of this.listTasks()) {
      const r = this.getInstance(t, instanceId);
      if (r) return r;
    }
    return null;
  }

  // ------------------------------------------------------------ RTR
  writeRtrBody(taskId, transferId, bytes) {
    if (!HEX64.test(transferId)) fail("MALFORMED_REQUEST", "invalid transfer_id");
    createFileExclusive({ native: this.taskDir(taskId, "rtr") }, `${transferId}.body.json`, bytes, { existsCode: "RESULT_TRANSFER_UNPROVEN" });
  }

  readRtrBody(taskId, transferId) {
    const f = path.join(this.taskDir(taskId, "rtr"), `${transferId}.body.json`);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
  }

  putRtrStatus(taskId, transferId, status) {
    this.writeJson(this.taskDir(taskId, "rtr"), `${transferId}.status.json`, status);
  }

  getRtrStatus(taskId, transferId) {
    return this.readJson(path.join(this.taskDir(taskId, "rtr"), `${transferId}.status.json`));
  }

  listRtr(taskId) {
    const d = this.taskDir(taskId, "rtr");
    return fs.readdirSync(d)
      .filter((n) => /^[0-9a-f]{64}\.status\.json$/.test(n))
      .map((n) => ({ transfer_id: n.slice(0, 64), status: this.readJson(path.join(d, n)) }));
  }

  // ------------------------------------------------------------ permits (§13.1)
  // Request binding (AS94-F002): the ONE source of truth for a permit. One
  // immutable record per (instance_id, request_id), published atomically and
  // exclusively as the FIRST durable step of minting. It carries the complete
  // permit body bytes, so the permit body file, its initial status and its
  // journal entry are derived artifacts that can always be reconstructed. A
  // permit file with no binding naming it is an orphan and is never a permit.
  bindingFile(taskId, instanceId, requestId) {
    return path.join(this.taskDir(taskId, "request-bindings"), `${sha256(`${instanceId}\n${requestId}`)}.json`);
  }

  readBinding(taskId, instanceId, requestId) {
    const f = this.bindingFile(taskId, instanceId, requestId);
    if (!fs.existsSync(f)) return null;
    return parseBinding(fs.readFileSync(f, "utf8"), f);
  }

  writeBinding(taskId, instanceId, requestId, binding) {
    const f = this.bindingFile(taskId, instanceId, requestId);
    publishFileExclusive({ native: path.dirname(f) }, path.basename(f), `${JSON.stringify(binding)}\n`, { existsCode: "MALFORMED_REQUEST" });
  }

  listBindings(taskId) {
    const d = this.taskDir(taskId, "request-bindings");
    return fs.readdirSync(d).filter((n) => /^[0-9a-f]{64}\.json$/.test(n)).map((n) => parseBinding(fs.readFileSync(path.join(d, n), "utf8"), n));
  }

  // Idempotent derived write: absent -> publish; present -> must be identical.
  writePermitBody(taskId, permitId, bytes) {
    if (!ID128.test(permitId)) fail("MALFORMED_REQUEST", "invalid permit_id");
    const existing = this.readPermitBody(taskId, permitId);
    if (existing !== null) {
      if (existing !== bytes) fail("ISOLATION_UNPROVABLE", `permit body ${permitId} differs from its binding`);
      return;
    }
    publishFileExclusive({ native: this.taskDir(taskId, "permits") }, `${permitId}.body.json`, bytes, { existsCode: "ISOLATION_UNPROVABLE" });
  }

  readPermitBody(taskId, permitId) {
    if (!ID128.test(permitId ?? "")) return null;
    const f = path.join(this.taskDir(taskId, "permits"), `${permitId}.body.json`);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
  }

  putPermitStatus(taskId, permitId, status) {
    this.writeJson(this.taskDir(taskId, "permits"), `${permitId}.status.json`, status);
  }

  getPermitStatus(taskId, permitId) {
    if (!ID128.test(permitId ?? "")) return null;
    return this.readJson(path.join(this.taskDir(taskId, "permits"), `${permitId}.status.json`));
  }

  listPermits(taskId) {
    const d = this.taskDir(taskId, "permits");
    return fs.readdirSync(d)
      .filter((n) => /^[0-9a-f]{32}\.status\.json$/.test(n))
      .map((n) => ({ permit_id: n.slice(0, 32), status: this.readJson(path.join(d, n)) }));
  }

  keyFile(taskId, kind, key) {
    return path.join(this.taskDir(taskId, kind), `${sha256(key)}.json`);
  }
}

// A binding is valid only if it is complete and self-consistent: its permit
// body hashes to its permit_digest and names the same permit, instance and
// request. Anything else fails closed.
const BINDING_FIELDS = [
  "instance_id", "request_id", "checkpoint_revision", "argv_digest", "cwd", "environment_digest", "permit_id", "permit_digest",
  "permit_body", "claim_deadline_ms", "issued_at_ms",
];

function parseBinding(text, where) {
  let b;
  try {
    b = JSON.parse(text);
  } catch {
    fail("ISOLATION_UNPROVABLE", `request binding ${where} is not JSON`);
  }
  const ok = b && typeof b === "object" && BINDING_FIELDS.every((k) => Object.hasOwn(b, k))
    && ID128.test(b.permit_id ?? "") && ID128.test(b.instance_id ?? "") && HEX64.test(b.permit_digest ?? "")
    && typeof b.permit_body === "string" && sha256(b.permit_body) === b.permit_digest
    && Number.isFinite(b.claim_deadline_ms) && Number.isFinite(b.issued_at_ms);
  if (!ok) fail("ISOLATION_UNPROVABLE", `request binding ${where} is incomplete or inconsistent`);
  let body;
  try {
    body = JSON.parse(b.permit_body);
  } catch {
    fail("ISOLATION_UNPROVABLE", `request binding ${where} carries a non-JSON permit body`);
  }
  if (body.permit_id !== b.permit_id || body.instance_id !== b.instance_id || body.request_id !== b.request_id
    || body.argv_digest !== b.argv_digest || body.checkpoint_revision !== b.checkpoint_revision) {
    fail("ISOLATION_UNPROVABLE", `request binding ${where} does not match its permit body`);
  }
  return b;
}
