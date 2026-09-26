// S6 crash recovery tests (ML-DEVOS-RFC-019 §7.1 write-ahead lifecycle, §15,
// §18; D-071). Crashes are injected either by a throwing fault hook or by a
// REAL SIGKILL of a fixed crash-worker process at a named step.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renew } from "../devos/state/kernel.mjs";
import { runFixed } from "./fixtures/execution/drivers.mjs";
import { cleanupWorld, envelopeOf, gatewayFor, journalOf, makeWorld, qaClaimChain, taskLockPath, trustedHost } from "./fixtures/execution/harness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CRASH_WORKER = path.join(HERE, "fixtures", "execution", "crash-worker.mjs");
const SLUG = "Dillaab-source__maisog-labs";

const codeOf = async (p) => {
  try {
    await p;
  } catch (e) {
    return e.code ?? `UNCODED:${e.message}`;
  }
  return "NO_ERROR";
};
const s4Record = (w) => JSON.parse(fs.readFileSync(path.join(w.dirs.s4, `${w.taskId}.json`), "utf8"));
const readyForQaTransitions = (w) => s4Record(w).history.filter((e) => e.type === "transition" && e.to === "READY_FOR_QA");

async function withWorld(fn) {
  const w = await makeWorld();
  try {
    return await fn(w);
  } finally {
    cleanupWorld(w);
  }
}

// A quiesced Builder instance with one committed change, ready to complete.
async function readyToComplete(w, over = {}) {
  const h = w.host(over);
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  let n = 0;
  for (const op of ["WRITE_FEATURE", "STAGE_ALL", "COMMIT"]) await runFixed(h, { instanceId: rec.instance_id, checkpointRevision: rec.checkpoint.current_revision, requestId: `r${n++}`, op });
  await h.quiesce(rec.instance_id);
  return { h, rec };
}

const crash = (at) => ({ faults: { onStep: (name) => { if (name === at) throw new Error(`injected crash at ${at}`); } } });

function sigkillWorker(w, spec) {
  const full = { dirs: w.dirs, builder: w.builder, contractRef: w.contractRef, contractPath: w.contractPath, anchor: w.anchor, ...spec };
  return spawnSync(process.execPath, [CRASH_WORKER, JSON.stringify(full)], { encoding: "utf8", timeout: 60000 });
}

test("crash after push, before the record: nothing is PENDING; a retry publishes exactly once", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w, crash("after-push"));
  const h1 = w.host(crash("after-push"));
  assert.match(await codeOf(h1.complete(rec.instance_id, { actorId: w.builder })), /UNCODED|ISOLATION_UNPROVABLE/);
  const h2 = w.host();
  const report = await h2.recover();
  assert.deepEqual(report.pending, []);
  assert.equal(h2.inspect.listRtr(w.taskId).length, 0);
  const out = await h2.complete(rec.instance_id, { actorId: w.builder });
  assert.equal(h2.inspect.getRtrStatus(w.taskId, out.transfer_id).status, "COMMITTED");
  assert.equal(readyForQaTransitions(w).length, 1);
}));

test("crash after RTR_PENDING, before S4: recovery replays the stored bytes and commits", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  assert.match(await codeOf(w.host(crash("after-pending")).complete(rec.instance_id, { actorId: w.builder })), /UNCODED|ISOLATION_UNPROVABLE/);
  const h2 = w.host();
  const [pending] = h2.inspect.listRtr(w.taskId);
  assert.equal(pending.status.status, "PENDING");
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
  const report = await h2.recover();
  assert.deepEqual(report.pending.map((p) => p.outcome), ["COMMITTED"]);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "READY_FOR_QA");
  const body = JSON.parse(h2.inspect.readRtrBody(w.taskId, pending.transfer_id));
  assert.equal(JSON.stringify(readyForQaTransitions(w)[0].evidenceRef), body.publication_evidence_ref_json);
}));

test("crash after the S4 transition, before COMMITTED: S4's idempotent replay with the SAME bytes reconciles", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  assert.match(await codeOf(w.host(crash("after-transition")).complete(rec.instance_id, { actorId: w.builder })), /UNCODED|ISOLATION_UNPROVABLE/);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "READY_FOR_QA");
  const h2 = w.host();
  assert.equal(h2.inspect.listRtr(w.taskId)[0].status.status, "PENDING");
  const report = await h2.recover();
  assert.deepEqual(report.pending.map((p) => p.outcome), ["COMMITTED"]);
  assert.equal(readyForQaTransitions(w).length, 1, "the replay did not create a second transition");
  // QA can reconstruct from the reconciled record.
  const chain = await qaClaimChain(w, "qa-1");
  const qa = await w.host({ gateway: gatewayFor(w.dirs.workspace, trustedHost({ actorId: "qa-1", actorRole: "QA" })) }).createInstance({ role: "QA", qaChain: chain });
  assert.equal(qa.state, "READY");
}));

// §7.1.3: a PENDING record that cannot be attributed is never replayed and
// blocks every lifecycle operation of the task; nothing repairs it by inference.
async function assertTaskBlocked(w, rec) {
  const h2 = w.host();
  const report = await h2.recover();
  assert.deepEqual(report.pending, []);
  assert.deepEqual(report.blocked, [{ task_id: w.taskId, code: "RESULT_TRANSFER_UNPROVEN" }]);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
  assert.equal(await codeOf(h2.finishWithoutPublication(rec.instance_id)), "RESULT_TRANSFER_UNPROVEN");
  assert.equal(await codeOf(h2.createInstance({ role: "BUILDER", claimResult: w.anchor })), "RESULT_TRANSFER_UNPROVEN");
}

test("a PENDING record whose body was altered is never replayed and blocks the task (§7.1.3)", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  await codeOf(w.host(crash("after-pending")).complete(rec.instance_id, { actorId: w.builder }));
  const [pending] = w.host().inspect.listRtr(w.taskId);
  const f = path.join(w.dirs.state, "tasks", w.taskId, "blobs", pending.status.rtr_digest);
  const bytes = fs.readFileSync(f, "utf8");
  const body = JSON.parse(bytes);
  fs.writeFileSync(f, bytes.replace(body.result_tree_sha, "0".repeat(40)));
  await assertTaskBlocked(w, rec);
}));

test("a PENDING record whose journal adjacency was broken is never replayed and blocks the task (§7.1.3)", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  await codeOf(w.host(crash("after-pending")).complete(rec.instance_id, { actorId: w.builder }));
  await w.host().inspect.corrupt(w.taskId, (d) => {
    d.journal[rec.instance_id] = d.journal[rec.instance_id].filter((l) => JSON.parse(l).type !== "RTR_PENDING");
  });
  await assertTaskBlocked(w, rec);
}));

for (const at of ["after-push", "after-pending", "after-transition"]) {
  test(`REAL SIGKILL of the publishing process at ${at}; a fresh host recovers to exactly one publication`, () => withWorld(async (w) => {
    const { rec } = await readyToComplete(w);
    const r = sigkillWorker(w, { op: "complete", crashAt: at, instanceId: rec.instance_id });
    assert.equal(r.signal, "SIGKILL", `worker must die by SIGKILL (status ${r.status}, stderr ${r.stderr})`);
    const h2 = w.host();
    await h2.recover();
    if (at === "after-push") {
      assert.equal(h2.inspect.listRtr(w.taskId).length, 0);
      await h2.complete(rec.instance_id, { actorId: w.builder });
    }
    assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "READY_FOR_QA");
    const rtr = h2.inspect.listRtr(w.taskId);
    assert.equal(rtr.length, 1);
    assert.equal(rtr[0].status.status, "COMMITTED");
    assert.equal(readyForQaTransitions(w).length, 1);
    const body = JSON.parse(h2.inspect.readRtrBody(w.taskId, rtr[0].transfer_id));
    assert.equal(JSON.stringify(readyForQaTransitions(w)[0].evidenceRef), body.publication_evidence_ref_json);
    assert.equal(fs.existsSync(taskLockPath(w)), false, "no S6 lock left behind");
  }));
}

test("REAL SIGKILL during create leaves CREATING; recovery quarantines it (INCOMPLETE_CREATE), never adopts", () => withWorld(async (w) => {
  const r = sigkillWorker(w, { op: "create", crashAt: "after-create-begin" });
  assert.equal(r.signal, "SIGKILL", `worker must die by SIGKILL (status ${r.status}, stderr ${r.stderr})`);
  const h = w.host();
  const [rec] = h.inspect.listInstances(w.taskId);
  assert.equal(rec.state, "CREATING");
  const report = await h.recover();
  assert.deepEqual(report.quarantined, [rec.instance_id]);
  const after = h.inspect.findInstance(rec.instance_id);
  assert.equal(after.state, "QUARANTINED");
  assert.equal(after.quarantine_reason, "INCOMPLETE_CREATE");
  assert.equal((await h.validateInstance(rec.instance_id)).outcome, "FAILED");
  assert.equal((await h.cleanup(rec.instance_id)).state, "CLEANED");
}));

test("orphan directories are reported and quarantined, never adopted or deleted; a missing directory is quarantined", () => withWorld(async (w) => {
  const h = w.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  const orphan = path.join(w.dirs.workspace, SLUG, w.taskId, "f".repeat(32));
  fs.mkdirSync(path.join(orphan, "repo"), { recursive: true });
  fs.rmSync(path.join(w.dirs.workspace, SLUG, w.taskId, rec.instance_id), { recursive: true });
  const report = await h.recover();
  assert.deepEqual(report.orphans, [`${w.taskId}/${"f".repeat(32)}`]);
  assert.ok(fs.existsSync(orphan), "an orphan is never deleted by recovery");
  assert.equal(h.inspect.findInstance("f".repeat(32)), null, "an orphan is never adopted");
  assert.equal(h.inspect.findInstance(rec.instance_id).quarantine_reason, "MISSING_DIRECTORY");
}));

test("a held S6 registry lock fails closed and is never stolen automatically", () => withWorld(async (w) => {
  const h = w.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  const lock = taskLockPath(w);
  fs.writeFileSync(lock, "");
  const old = new Date(Date.now() - 24 * 3600 * 1000);
  fs.utimesSync(lock, old, old);
  const req = { instance_id: rec.instance_id, request_id: "l1", argv: ["s6-fixture", "write", "src/feature.txt"], checkpoint_revision: rec.checkpoint.current_revision };
  assert.equal(await codeOf(h.requestPermit(req)), "ISOLATION_UNPROVABLE");
  assert.ok(fs.existsSync(lock), "an old lock is not stolen");
  assert.equal(h.inspect.listPermits(w.taskId).length, 0);
  fs.rmSync(lock); // explicit operator action
  assert.equal((await h.requestPermit(req)).state, "ISSUED");
}));

test("a stale instance (S4 moved on) is quarantined by recovery, and its ISSUED permits are revoked", () => withWorld(async (w) => {
  const h = w.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  const p = await h.requestPermit({ instance_id: rec.instance_id, request_id: "s1", argv: ["x"], checkpoint_revision: rec.checkpoint.current_revision });
  // S4 moves on without the instance adopting the new revision.
  await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
  const report = await w.host().recover();
  assert.deepEqual(report.stale, [rec.instance_id]);
  const s = h.inspect.getPermitStatus(w.taskId, p.permit_id);
  assert.equal(s.state, "REVOKED");
  assert.equal(s.revocation_reason, "QUARANTINE");
}));

// ---------------------------------------------------------------- AS94-F002
// Permit minting (§13.1 step 2, §13.2): the body is a verified blob first; the
// binding, the ISSUED status and the PERMIT_ISSUED entry then commit in ONE
// transaction. A crash before that commit leaves at most an orphan blob, so a
// retry mints exactly one permit; a crash after it leaves the complete permit,
// so a retry replays it. The envelope points exercise a real SIGKILL inside the
// commit itself.
const PERMIT_STEPS = ["permit-after-blob", "permit-after-commit"];
const COMMIT_POINTS = ["envelope:synced", "envelope:renamed"];
const WRITE_ARGV = ["s6-fixture", "write", "src/feature.txt"];

async function attached(w) {
  const h = w.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  return { h, rec, request: { instance_id: rec.instance_id, request_id: "mint-1", argv: [...WRITE_ARGV], checkpoint_revision: rec.checkpoint.current_revision } };
}

function mintingCensus(w, rec, permitId) {
  const st = envelopeOf(w).state;
  const journal = journalOf(w, rec);
  return {
    bindings: Object.keys(st.bindings).length,
    permits: Object.keys(st.permits).length,
    issued: journal.filter((e) => e.type === "PERMIT_ISSUED" && (!permitId || e.data.permit_id === permitId)).length,
  };
}

async function assertSinglePermitAfterRecovery(w, h, rec, request, crashedPermitId, committed) {
  const first = await h.requestPermit(request);
  if (committed) {
    assert.equal(first.permit_id, crashedPermitId, "the retry returns the permit committed before the crash");
    assert.equal(first.replay, true);
  } else {
    assert.equal(first.replay, false, "nothing was committed: the retry mints the one permit");
  }
  const again = await h.requestPermit(request);
  assert.equal(again.permit_id, first.permit_id, "every replay returns the same permit");
  assert.deepEqual(mintingCensus(w, rec, first.permit_id), { bindings: 1, permits: 1, issued: 1 });
  const claimed = await h.claimPermit({ permitId: first.permit_id, request });
  assert.equal(claimed.permit.permit_id, first.permit_id);
  return first.permit_id;
}

for (const step of PERMIT_STEPS) {
  test(`permit minting fault at ${step}: retry yields exactly one binding and one permit (AS94-F002)`, () => withWorld(async (w) => {
    const { rec, request } = await attached(w);
    let crashedPermitId = null;
    const faulty = w.host({ faults: { onStep: (name, ctx) => { if (name === step) { crashedPermitId = ctx.permitId; throw new Error(`injected fault at ${step}`); } } } });
    assert.match(await (async () => { try { await faulty.requestPermit(request); return "NO_ERROR"; } catch (e) { return e.code ?? "UNCODED"; } })(), /UNCODED/);
    assert.ok(crashedPermitId);
    const committed = step === "permit-after-commit";
    assert.equal(mintingCensus(w, rec).bindings, committed ? 1 : 0, "binding, status and entry commit together");
    await assertSinglePermitAfterRecovery(w, w.host(), rec, request, crashedPermitId, committed);
  }));

  test(`REAL SIGKILL during permit minting at ${step}: retry yields one permit (AS94-F002)`, () => withWorld(async (w) => {
    const { rec, request } = await attached(w);
    const r = sigkillWorker(w, { op: "permit", crashAt: step, request });
    assert.equal(r.signal, "SIGKILL", `worker must die by SIGKILL (status ${r.status}, stderr ${r.stderr})`);
    assert.equal(fs.existsSync(taskLockPath(w)), false, "the step runs outside the task lock");
    const committed = step === "permit-after-commit";
    const ids = Object.keys(envelopeOf(w).state.permits);
    assert.equal(ids.length, committed ? 1 : 0);
    await assertSinglePermitAfterRecovery(w, w.host(), rec, request, ids[0] ?? null, committed);
  }));
}

for (const point of COMMIT_POINTS) {
  test(`REAL SIGKILL inside the permit commit at ${point}: old or new state, then exactly one permit (§13.2, AS94-F002)`, () => withWorld(async (w) => {
    const { rec, request } = await attached(w);
    const r = sigkillWorker(w, { op: "permit", crashAt: point, request });
    assert.equal(r.signal, "SIGKILL", `worker must die by SIGKILL (status ${r.status}, stderr ${r.stderr})`);
    const h = w.host();
    assert.ok(fs.existsSync(taskLockPath(w)), "the killed process left its lock");
    const committed = point === "envelope:renamed";
    const ids = Object.keys(envelopeOf(w).state.permits);
    assert.equal(ids.length, committed ? 1 : 0, "the commit is all or nothing");
    if (committed) assert.equal((await h.requestPermit(request)).replay, true, "a committed permit replays without the lock");
    else assert.equal(await codeOf(h.requestPermit(request)), "ISOLATION_UNPROVABLE", "a held lock is never stolen");
    fs.rmSync(taskLockPath(w)); // explicit operator action
    await assertSinglePermitAfterRecovery(w, h, rec, request, ids[0] ?? null, committed);
  }));
}

test("an orphan permit blob (no committed binding) is never a permit: not claimable, not reportable, reported by recovery (AS94-F002, §13.2)", () => withWorld(async (w) => {
  const { h, rec, request } = await attached(w);
  const real = await h.requestPermit(request);
  const orphanId = "e".repeat(32);
  const orphanDigest = h.inspect.store.putBlob(w.taskId, JSON.stringify({ ...real.permit, permit_id: orphanId }));
  assert.equal(await codeOf(h.claimPermit({ permitId: orphanId, request })), "ISOLATION_UNPROVABLE");
  const { fakeDriver } = await import("./fixtures/execution/drivers.mjs");
  assert.equal(await codeOf(fakeDriver(h).report({ ...real.permit, permit_id: orphanId }, request)), "ISOLATION_UNPROVABLE");
  assert.deepEqual(h.provenance(rec.instance_id).permits.map((p) => p.permit_id), [real.permit_id], "only committed permits are permits");
  const report = await w.host().recover();
  assert.ok(report.orphan_blobs.includes(`${w.taskId}/${orphanDigest}`));
}));

test("a tampered permit body or committed binding fails closed on replay and claim (AS94-F002, §13.2 rule 4)", () => withWorld(async (w) => {
  const { h, request } = await attached(w);
  const real = await h.requestPermit(request);
  const digest = h.inspect.getPermitStatus(w.taskId, real.permit_id).permit_digest;
  const blob = path.join(w.dirs.state, "tasks", w.taskId, "blobs", digest);
  const bytes = fs.readFileSync(blob, "utf8");
  fs.writeFileSync(blob, bytes.replace(real.permit.argv_digest, "0".repeat(64)));
  assert.equal(await codeOf(h.requestPermit(request)), "ISOLATION_UNPROVABLE");
  assert.equal(await codeOf(h.claimPermit({ permitId: real.permit_id, request })), "ISOLATION_UNPROVABLE");
  fs.writeFileSync(blob, bytes);
  await h.inspect.corrupt(w.taskId, (d) => { d.permits[real.permit_id].permit_digest = "f".repeat(64); });
  assert.equal(await codeOf(h.requestPermit(request)), "ISOLATION_UNPROVABLE");
  const env = path.join(w.dirs.state, "tasks", w.taskId, "envelope.json");
  fs.writeFileSync(env, "{ torn");
  assert.equal(await codeOf(h.requestPermit(request)), "ISOLATION_UNPROVABLE");
}));
