// S6 task store: transaction-substrate proof (ML-DEVOS-RFC-019 §13.2 "Proof
// first", §16, §18 item 15; D-074 mandatory first gate).
//
// The envelope's whole-file replace must be atomic across an S6 host PROCESS
// crash on every supported platform profile before the hardened core relies on
// it. These tests kill a real child process with SIGKILL at every persistence
// point of a commit and at random times, and check that the committed state is
// always exactly the last acknowledged state or its successor, never a torn,
// mixed or lost one. Results are process-crash evidence only; they say nothing
// about OS-crash or power-loss durability (§13.2 "Durability scope").
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalJson, sha256 } from "../devos/execution/digest.mjs";
import { ENVELOPE, STORE_FORMAT, STORE_PROVEN_PLATFORMS, TaskStore } from "../devos/execution/store.mjs";

const WORKER = fileURLToPath(new URL("./fixtures/execution/store-worker.mjs", import.meta.url));
const TASK = "S6-STORE-PROOF";
const ON_PROVEN_PLATFORM = STORE_PROVEN_PLATFORMS.includes(process.platform);

function tmpState() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "s6-store-"));
}

function runWorker(spec) {
  const r = spawnSync(process.execPath, [WORKER, JSON.stringify(spec)], { encoding: "utf8", timeout: 120_000 });
  const acks = r.stdout.split("\n").filter((l) => l.startsWith("ACK ")).map((l) => l.slice(4));
  return { status: r.status, signal: r.signal, acks, stderr: r.stderr };
}

// The committed state must be complete and self-consistent, and exactly the
// last acknowledged version or the one after it.
function assertConsistent(stateDir, lastAcked) {
  const store = new TaskStore(stateDir);
  const { version, state } = store.read(TASK);
  assert.ok(version === lastAcked || version === lastAcked + 1, `version ${version} after last ack ${lastAcked}`);
  if (version > 0) {
    assert.equal(state.instances.counter.seq, version);
    assert.ok(state.instances.counter.pad.startsWith(`${version}:`));
  }
  return version;
}

test("gate 1 runs on a platform whose replace-atomicity it proves", { skip: !ON_PROVEN_PLATFORM && "NOT RUN: platform is not in STORE_PROVEN_PLATFORMS" }, () => {
  assert.deepEqual([...STORE_PROVEN_PLATFORMS], ["linux"]);
  assert.equal(process.platform, "linux");
});

test("store refuses to open on a platform whose atomicity is not proven", () => {
  for (const platform of ["darwin", "win32", "freebsd"]) {
    assert.throws(() => new TaskStore(tmpState(), { platform }), (e) => e.code === "ISOLATION_CAPABILITY_MISSING");
  }
});

test("commit is compare-and-set, all-or-nothing, and writes nothing for an unchanged draft", async () => {
  const dir = tmpState();
  const store = new TaskStore(dir);
  assert.equal(store.read(TASK).version, 0);
  await store.transact(TASK, (d) => { d.instances.a = { n: 1 }; });
  assert.equal(store.read(TASK).version, 1);
  // An unchanged draft commits nothing.
  await store.transact(TASK, () => {});
  assert.equal(store.read(TASK).version, 1);
  // A throwing transaction commits nothing.
  await assert.rejects(store.transact(TASK, (d) => { d.instances.a = { n: 99 }; throw new Error("boom"); }));
  assert.deepEqual(store.read(TASK).state.instances.a, { n: 1 });
  // A stale base version is refused.
  await store.withLock(TASK, async () => {
    assert.throws(() => store.commit(TASK, 0, { ...store.read(TASK).state }), (e) => e.code === "ISOLATION_UNPROVABLE");
  });
  // The snapshot is immutable.
  assert.throws(() => { store.read(TASK).state.instances.a.n = 2; }, TypeError);
});

test("a corrupted, truncated or foreign envelope blocks the task and is never repaired", async () => {
  const dir = tmpState();
  const store = new TaskStore(dir);
  await store.transact(TASK, (d) => { d.instances.a = { n: 1 }; });
  const file = path.join(dir, "tasks", TASK, ENVELOPE);
  const good = fs.readFileSync(file, "utf8");
  const env = JSON.parse(good);
  const cases = [
    good.slice(0, Math.floor(good.length / 2)),
    JSON.stringify({ ...env, state: { ...env.state, slot: "tampered" } }),
    JSON.stringify({ ...env, task_id: "OTHER-TASK" }),
    JSON.stringify({ ...env, format: "other/1" }),
    JSON.stringify({ ...env, version: 0 }),
  ];
  for (const text of cases) {
    fs.writeFileSync(file, text);
    assert.throws(() => store.read(TASK), (e) => e.code === "ISOLATION_UNPROVABLE");
    await assert.rejects(store.transact(TASK, (d) => { d.instances.b = 1; }), (e) => e.code === "ISOLATION_UNPROVABLE");
    assert.equal(fs.readFileSync(file, "utf8"), text, "nothing is repaired by inference");
  }
  assert.equal(env.format, STORE_FORMAT);
  assert.equal(env.state_digest, sha256(canonicalJson(env.state)));
});

test("the task lock is exclusive and never stolen", async () => {
  const dir = tmpState();
  const store = new TaskStore(dir);
  store.taskDir(TASK);
  fs.writeFileSync(path.join(dir, "tasks", TASK, "lock"), "");
  await assert.rejects(store.transact(TASK, (d) => { d.instances.a = 1; }, { waitMs: 50 }), (e) => e.code === "ISOLATION_UNPROVABLE");
  assert.ok(fs.existsSync(path.join(dir, "tasks", TASK, "lock")), "a stale lock is left for the operator");
  assert.equal(store.read(TASK).version, 0);
});

test("blobs are content-addressed, idempotent and verified on every read", () => {
  const dir = tmpState();
  const store = new TaskStore(dir);
  const d = store.putBlob(TASK, "body-1");
  assert.equal(d, sha256("body-1"));
  assert.equal(store.putBlob(TASK, "body-1"), d);
  assert.equal(store.readBlob(TASK, d).toString(), "body-1");
  fs.writeFileSync(store.blobPath(TASK, d), "body-2");
  assert.throws(() => store.readBlob(TASK, d), (e) => e.code === "ISOLATION_UNPROVABLE");
  assert.throws(() => store.readBlob(TASK, d, { code: "RESULT_TRANSFER_UNPROVEN" }), (e) => e.code === "RESULT_TRANSFER_UNPROVEN");
  assert.throws(() => store.readBlob(TASK, sha256("absent")), (e) => e.code === "ISOLATION_UNPROVABLE");
});

// Every persistence point of a commit, at several envelope sizes, under a real
// SIGKILL of the committing process.
const POINTS = ["envelope:written", "envelope:synced", "envelope:renamed", "envelope:committed"];
for (const point of POINTS) {
  for (const padBytes of [0, 65_536, 1_048_576]) {
    test(`SIGKILL at ${point} (pad ${padBytes}) leaves the old or the new committed state`, { skip: !ON_PROVEN_PLATFORM && "NOT RUN" }, () => {
      const dir = tmpState();
      const r = runWorker({ mode: "commit-kill-at", stateDir: dir, taskId: TASK, point, commits: 3, padBytes });
      assert.equal(r.signal, "SIGKILL", r.stderr);
      assert.deepEqual(r.acks, ["1", "2"], "the killed commit was never acknowledged");
      const v = assertConsistent(dir, 2);
      // Before the rename the old state survives; from the rename on, the new.
      assert.equal(v, point === "envelope:written" || point === "envelope:synced" ? 2 : 3);
      // The killed writer's lock is never stolen; removing it is the explicit
      // operator action. The next writer then proceeds normally, and a leftover
      // temp file is an orphan nothing reads.
      assert.ok(fs.existsSync(path.join(dir, "tasks", TASK, "lock")));
      fs.rmSync(path.join(dir, "tasks", TASK, "lock"));
      runWorker({ mode: "commit-kill-at", stateDir: dir, taskId: TASK, commits: 1, padBytes });
      assert.equal(new TaskStore(dir).read(TASK).version, v + 1);
    });
  }
}

test("SIGKILL during a blob write never publishes a partial or mismatched blob", { skip: !ON_PROVEN_PLATFORM && "NOT RUN" }, () => {
  for (const point of ["blob:written", "blob:linked"]) {
    const dir = tmpState();
    const blobText = "b".repeat(2_000_000);
    const r = runWorker({ mode: "blob-kill-at", stateDir: dir, taskId: TASK, point, blobBytes: blobText.length });
    assert.equal(r.signal, "SIGKILL");
    const store = new TaskStore(dir);
    const digest = sha256(blobText);
    if (point === "blob:written") assert.deepEqual(store.listBlobs(TASK), []);
    else assert.equal(store.readBlob(TASK, digest).length, blobText.length);
    assert.equal(store.putBlob(TASK, blobText), digest, "a retry publishes the one blob");
  }
});

test("random-time SIGKILL stress: the envelope is always exactly an acknowledged state or its successor", { skip: !ON_PROVEN_PLATFORM && "NOT RUN", timeout: 300_000 }, async () => {
  const dir = tmpState();
  let lastAcked = 0;
  for (let i = 0; i < 40; i += 1) {
    const child = spawn(process.execPath, [WORKER, JSON.stringify({ mode: "commit-forever", stateDir: dir, taskId: TASK, padBytes: 200_000 })], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (b) => { out += b; });
    const exited = new Promise((resolve) => child.on("exit", resolve));
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.floor(Math.random() * 300)));
    child.kill("SIGKILL");
    await exited;
    const acks = out.split("\n").filter((l) => l.startsWith("ACK ")).map((l) => Number(l.slice(4)));
    if (acks.length) lastAcked = acks.at(-1);
    // A killed child may also have left the task lock; removing it is the
    // explicit operator action this test stands in for.
    fs.rmSync(path.join(dir, "tasks", TASK, "lock"), { force: true });
    lastAcked = assertConsistent(dir, lastAcked);
  }
  assert.ok(lastAcked > 40, `stress made progress (${lastAcked} commits)`);
});

test("concurrent writer processes serialize: no lost update", { skip: !ON_PROVEN_PLATFORM && "NOT RUN", timeout: 120_000 }, async () => {
  const dir = tmpState();
  const writers = ["w1", "w2", "w3", "w4"];
  const runs = writers.map((writer) => new Promise((resolve) => {
    const c = spawn(process.execPath, [WORKER, JSON.stringify({ mode: "increment", stateDir: dir, taskId: TASK, writer, commits: 25 })], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    c.stdout.on("data", (b) => { out += b; });
    c.on("exit", (code) => resolve({ code, out }));
  }));
  for (const r of await Promise.all(runs)) assert.equal(r.code, 0);
  const { version, state } = new TaskStore(dir).read(TASK);
  assert.equal(state.instances.shared.n, 100);
  assert.equal(version, 100);
  for (const w of writers) assert.equal(state.instances.shared.by[w], 25);
});
