// S6 hash-chained journal (ML-DEVOS-RFC-019 §7.1.2, §17 -- AS88-F001).
//
//   head_0 = SHA-256("s6-journal-v1\n" + identity_digest)
//   head_n = SHA-256(head_{n-1} + SHA-256(e_n))      (hex strings concatenated)
//
// Entries are appended, never rewritten; each records prev_head. It lives under
// the host state directory, outside every instance root. Tamper-evident, not
// tamper-proof (Residual risks 5).
import fs from "node:fs";
import path from "node:path";

import { sha256 } from "./digest.mjs";
import { HEX64, fail } from "./vocabulary.mjs";

export function genesisHead(identityDigest) {
  if (!HEX64.test(identityDigest ?? "")) fail("MALFORMED_REQUEST", "identity digest required for the journal genesis");
  return sha256(`s6-journal-v1\n${identityDigest}`);
}

export function nextHead(prevHead, entryBytes) {
  return sha256(prevHead + sha256(entryBytes));
}

// Replays from genesis; throws ISOLATION_UNPROVABLE on any break.
export function replayJournal(lines, identityDigest) {
  let head = genesisHead(identityDigest);
  const entries = [];
  lines.forEach((bytes, i) => {
    let entry;
    try {
      entry = JSON.parse(bytes);
    } catch {
      fail("ISOLATION_UNPROVABLE", `journal entry ${i} is not JSON`);
    }
    if (entry.seq !== i) fail("ISOLATION_UNPROVABLE", `journal entry ${i} is out of sequence`);
    if (entry.prev_head !== head) fail("ISOLATION_UNPROVABLE", `journal hash chain breaks at entry ${i}`);
    head = nextHead(head, bytes);
    entries.push({ bytes, entry, head });
  });
  return { head, entries };
}

const APPEND_LOCK_WAIT_MS = 2000;
const SLEEP = new Int32Array(new SharedArrayBuffer(4));

export class Journal {
  constructor(filePath, identityDigest, clock) {
    this.filePath = filePath;
    this.identityDigest = identityDigest;
    this.clock = clock;
  }

  lines() {
    if (!fs.existsSync(this.filePath)) return [];
    const text = fs.readFileSync(this.filePath, "utf8");
    return text.length === 0 ? [] : text.replace(/\n$/, "").split("\n");
  }

  replay() {
    return replayJournal(this.lines(), this.identityDigest);
  }

  head() {
    return this.replay().head;
  }

  // Fixed member order: seq, type, at, data, prev_head. Appends are serialized
  // by a leaf append lock (never held while acquiring anything else), so two
  // writers can never both extend the same head (AS95-F001). A held append
  // lock is waited on briefly, then fails closed; it is never stolen.
  append(type, data = {}) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const lock = `${this.filePath}.lock`;
    const deadline = Date.now() + APPEND_LOCK_WAIT_MS;
    for (;;) {
      try {
        fs.closeSync(fs.openSync(lock, "wx", 0o600));
        break;
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
        if (Date.now() >= deadline) fail("ISOLATION_UNPROVABLE", "journal append lock is held (no automatic stealing)");
        Atomics.wait(SLEEP, 0, 0, 5);
      }
    }
    try {
      return this.appendHeld(type, data);
    } finally {
      fs.rmSync(lock, { force: true });
    }
  }

  appendHeld(type, data) {
    const { head, entries } = this.replay();
    const entry = { seq: entries.length, type, at: new Date(this.clock()).toISOString(), data, prev_head: head };
    const bytes = JSON.stringify(entry);
    const fd = fs.openSync(this.filePath, "a", 0o600);
    try {
      fs.writeSync(fd, `${bytes}\n`);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    return { entry, bytes, head: nextHead(head, bytes) };
  }
}
