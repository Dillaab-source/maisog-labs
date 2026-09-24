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
import { cleanupWorld, gatewayFor, makeWorld, qaClaimChain, trustedHost } from "./fixtures/execution/harness.mjs";

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
  assert.equal(h2.registry.listRtr(w.taskId).length, 0);
  const out = await h2.complete(rec.instance_id, { actorId: w.builder });
  assert.equal(h2.registry.getRtrStatus(w.taskId, out.transfer_id).status, "COMMITTED");
  assert.equal(readyForQaTransitions(w).length, 1);
}));

test("crash after RTR_PENDING, before S4: recovery replays the stored bytes and commits", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  assert.match(await codeOf(w.host(crash("after-pending")).complete(rec.instance_id, { actorId: w.builder })), /UNCODED|ISOLATION_UNPROVABLE/);
  const h2 = w.host();
  const [pending] = h2.registry.listRtr(w.taskId);
  assert.equal(pending.status.status, "PENDING");
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
  const report = await h2.recover();
  assert.deepEqual(report.pending.map((p) => p.outcome), ["COMMITTED"]);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "READY_FOR_QA");
  const body = JSON.parse(h2.registry.readRtrBody(w.taskId, pending.transfer_id));
  assert.equal(JSON.stringify(readyForQaTransitions(w)[0].evidenceRef), body.publication_evidence_ref_json);
}));

test("crash after the S4 transition, before COMMITTED: S4's idempotent replay with the SAME bytes reconciles", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  assert.match(await codeOf(w.host(crash("after-transition")).complete(rec.instance_id, { actorId: w.builder })), /UNCODED|ISOLATION_UNPROVABLE/);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "READY_FOR_QA");
  const h2 = w.host();
  assert.equal(h2.registry.listRtr(w.taskId)[0].status.status, "PENDING");
  const report = await h2.recover();
  assert.deepEqual(report.pending.map((p) => p.outcome), ["COMMITTED"]);
  assert.equal(readyForQaTransitions(w).length, 1, "the replay did not create a second transition");
  // QA can reconstruct from the reconciled record.
  const chain = await qaClaimChain(w, "qa-1");
  const qa = await w.host({ gateway: gatewayFor(w.dirs.workspace, trustedHost({ actorId: "qa-1", actorRole: "QA" })) }).createInstance({ role: "QA", qaChain: chain });
  assert.equal(qa.state, "READY");
}));

test("a PENDING record whose body was altered is never replayed (UNPROVEN, S4 untouched)", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  await codeOf(w.host(crash("after-pending")).complete(rec.instance_id, { actorId: w.builder }));
  const h2 = w.host();
  const [pending] = h2.registry.listRtr(w.taskId);
  const f = path.join(w.dirs.state, "registry", w.taskId, "rtr", `${pending.transfer_id}.body.json`);
  const bytes = fs.readFileSync(f, "utf8");
  const body = JSON.parse(bytes);
  fs.writeFileSync(f, bytes.replace(body.result_tree_sha, "0".repeat(40)));
  const report = await h2.recover();
  assert.deepEqual(report.pending.map((p) => [p.outcome, p.code]), [["UNPROVEN", "RESULT_TRANSFER_UNPROVEN"]]);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
}));

test("a PENDING record whose journal adjacency was broken is never replayed", () => withWorld(async (w) => {
  const { rec } = await readyToComplete(w);
  await codeOf(w.host(crash("after-pending")).complete(rec.instance_id, { actorId: w.builder }));
  const jf = path.join(w.dirs.state, "journal", `${rec.instance_id}.jsonl`);
  const lines = fs.readFileSync(jf, "utf8").trim().split("\n");
  fs.writeFileSync(jf, `${lines.slice(0, -1).join("\n")}\n`); // drop RTR_PENDING
  const report = await w.host().recover();
  assert.equal(report.pending[0].outcome, "UNPROVEN");
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
}));

for (const at of ["after-push", "after-pending", "after-transition"]) {
  test(`REAL SIGKILL of the publishing process at ${at}; a fresh host recovers to exactly one publication`, () => withWorld(async (w) => {
    const { rec } = await readyToComplete(w);
    const r = sigkillWorker(w, { op: "complete", crashAt: at, instanceId: rec.instance_id });
    assert.equal(r.signal, "SIGKILL", `worker must die by SIGKILL (status ${r.status}, stderr ${r.stderr})`);
    const h2 = w.host();
    await h2.recover();
    if (at === "after-push") {
      assert.equal(h2.registry.listRtr(w.taskId).length, 0);
      await h2.complete(rec.instance_id, { actorId: w.builder });
    }
    assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "READY_FOR_QA");
    const rtr = h2.registry.listRtr(w.taskId);
    assert.equal(rtr.length, 1);
    assert.equal(rtr[0].status.status, "COMMITTED");
    assert.equal(readyForQaTransitions(w).length, 1);
    const body = JSON.parse(h2.registry.readRtrBody(w.taskId, rtr[0].transfer_id));
    assert.equal(JSON.stringify(readyForQaTransitions(w)[0].evidenceRef), body.publication_evidence_ref_json);
    assert.equal(fs.existsSync(path.join(w.dirs.state, "registry", w.taskId, "lock")), false, "no S6 lock left behind");
  }));
}

test("REAL SIGKILL during create leaves CREATING; recovery quarantines it (INCOMPLETE_CREATE), never adopts", () => withWorld(async (w) => {
  const r = sigkillWorker(w, { op: "create", crashAt: "after-create-begin" });
  assert.equal(r.signal, "SIGKILL", `worker must die by SIGKILL (status ${r.status}, stderr ${r.stderr})`);
  const h = w.host();
  const [rec] = h.registry.listInstances(w.taskId);
  assert.equal(rec.state, "CREATING");
  const report = await h.recover();
  assert.deepEqual(report.quarantined, [rec.instance_id]);
  const after = h.registry.findInstance(rec.instance_id);
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
  assert.equal(h.registry.findInstance("f".repeat(32)), null, "an orphan is never adopted");
  assert.equal(h.registry.findInstance(rec.instance_id).quarantine_reason, "MISSING_DIRECTORY");
}));

test("a held S6 registry lock fails closed and is never stolen automatically", () => withWorld(async (w) => {
  const h = w.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  const lock = path.join(w.dirs.state, "registry", w.taskId, "lock");
  fs.writeFileSync(lock, "");
  const old = new Date(Date.now() - 24 * 3600 * 1000);
  fs.utimesSync(lock, old, old);
  const req = { instance_id: rec.instance_id, request_id: "l1", argv: ["s6-fixture", "write", "src/feature.txt"], checkpoint_revision: rec.checkpoint.current_revision };
  assert.equal(await codeOf(h.requestPermit(req)), "ISOLATION_UNPROVABLE");
  assert.ok(fs.existsSync(lock), "an old lock is not stolen");
  assert.equal(h.registry.listPermits(w.taskId).length, 0);
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
  const s = h.registry.getPermitStatus(w.taskId, p.permit_id);
  assert.equal(s.state, "REVOKED");
  assert.equal(s.revocation_reason, "QUARANTINE");
}));

// ---------------------------------------------------------------- AS94-F002
// Permit minting crashes at every durable sub-step. After any crash, retrying
// the same request_id yields exactly one binding and one permit, and every
// successful response names the same permit_id.
const PERMIT_STEPS = ["permit-before-binding", "permit-after-binding", "permit-after-body", "permit-after-status", "permit-after-journal"];
const WRITE_ARGV = ["s6-fixture", "write", "src/feature.txt"];

async function attached(w) {
  const h = w.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  return { h, rec, request: { instance_id: rec.instance_id, request_id: "mint-1", argv: [...WRITE_ARGV], checkpoint_revision: rec.checkpoint.current_revision } };
}

function mintingCensus(w, rec, permitId) {
  const reg = path.join(w.dirs.state, "registry", w.taskId);
  const list = (d) => (fs.existsSync(path.join(reg, d)) ? fs.readdirSync(path.join(reg, d)).filter((n) => !n.startsWith(".")) : []);
  const journal = fs.readFileSync(path.join(w.dirs.state, "journal", `${rec.instance_id}.jsonl`), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  return {
    bindings: list("request-bindings").length,
    bodies: list("permits").filter((n) => n.endsWith(".body.json")).length,
    statuses: list("permits").filter((n) => n.endsWith(".status.json")).length,
    issued: journal.filter((e) => e.type === "PERMIT_ISSUED" && (!permitId || e.data.permit_id === permitId)).length,
    temps: ["request-bindings", "permits"].flatMap((d) => (fs.existsSync(path.join(reg, d)) ? fs.readdirSync(path.join(reg, d)) : [])).filter((n) => n.startsWith(".")).length,
  };
}

async function assertSinglePermitAfterRecovery(w, h, rec, request, crashedPermitId, step) {
  const first = await h.requestPermit(request);
  if (step !== "permit-before-binding") {
    assert.equal(first.permit_id, crashedPermitId, `${step}: the retry returns the permit minted before the crash`);
    assert.equal(first.replay, true);
  }
  const again = await h.requestPermit(request);
  assert.equal(again.permit_id, first.permit_id, "every replay returns the same permit");
  assert.deepEqual(mintingCensus(w, rec, first.permit_id), { bindings: 1, bodies: 1, statuses: 1, issued: 1, temps: 0 });
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
    const census = mintingCensus(w, rec);
    assert.equal(census.bindings, step === "permit-before-binding" ? 0 : 1, "the binding is the first durable commit point");
    await assertSinglePermitAfterRecovery(w, w.host(), rec, request, crashedPermitId, step);
  }));

  test(`REAL SIGKILL during permit minting at ${step}: after the operator clears the lock, retry yields one permit (AS94-F002)`, () => withWorld(async (w) => {
    const { rec, request } = await attached(w);
    const r = sigkillWorker(w, { op: "permit", crashAt: step, request });
    assert.equal(r.signal, "SIGKILL", `worker must die by SIGKILL (status ${r.status}, stderr ${r.stderr})`);
    const h = w.host();
    const lock = path.join(w.dirs.state, "registry", w.taskId, "lock");
    assert.ok(fs.existsSync(lock), "the killed process left its lock");
    if (step === "permit-after-journal") {
      // Fully materialized: the replay is a pure read and needs no lock.
      assert.equal((await h.requestPermit(request)).replay, true);
    } else {
      // Anything left to (re)build needs the lock, which is never stolen.
      assert.equal(await codeOf(h.requestPermit(request)), "ISOLATION_UNPROVABLE", "a held lock is never stolen");
    }
    fs.rmSync(lock); // explicit operator action
    const bindingFile = fs.readdirSync(path.join(w.dirs.state, "registry", w.taskId, "request-bindings")).filter((n) => !n.startsWith("."));
    const crashedPermitId = bindingFile.length ? JSON.parse(fs.readFileSync(path.join(w.dirs.state, "registry", w.taskId, "request-bindings", bindingFile[0]), "utf8")).permit_id : null;
    assert.equal(crashedPermitId === null, step === "permit-before-binding");
    // A leftover private temp file (killed mid-publish) is never read as a binding.
    await assertSinglePermitAfterRecovery(w, h, rec, request, crashedPermitId, step);
  }));
}

test("orphan permit files (no binding) are never permits: not claimable, not reportable, reported by recovery (AS94-F002)", () => withWorld(async (w) => {
  const { h, rec, request } = await attached(w);
  const real = await h.requestPermit(request);
  const dir = path.join(w.dirs.state, "registry", w.taskId, "permits");
  const orphanId = "e".repeat(32);
  fs.copyFileSync(path.join(dir, `${real.permit_id}.body.json`), path.join(dir, `${orphanId}.body.json`));
  const status = JSON.parse(fs.readFileSync(path.join(dir, `${real.permit_id}.status.json`), "utf8"));
  fs.writeFileSync(path.join(dir, `${orphanId}.status.json`), JSON.stringify({ ...status, state: "CLAIMED" }));
  assert.equal(await codeOf(h.claimPermit({ permitId: orphanId, request })), "ISOLATION_UNPROVABLE");
  const { fakeDriver } = await import("./fixtures/execution/drivers.mjs");
  assert.equal(await codeOf(fakeDriver(h).report({ ...real.permit, permit_id: orphanId }, request)), "ISOLATION_UNPROVABLE");
  assert.deepEqual(h.provenance(rec.instance_id).permits.map((p) => p.permit_id), [real.permit_id], "only bound permits are permits");
  const report = await w.host().recover();
  assert.deepEqual(report.orphan_permits, [`${w.taskId}/${orphanId}`]);
}));

test("a tampered or inconsistent binding fails closed on replay and claim (AS94-F002)", () => withWorld(async (w) => {
  const { h, request } = await attached(w);
  const real = await h.requestPermit(request);
  const bdir = path.join(w.dirs.state, "registry", w.taskId, "request-bindings");
  const [name] = fs.readdirSync(bdir);
  const b = JSON.parse(fs.readFileSync(path.join(bdir, name), "utf8"));
  fs.writeFileSync(path.join(bdir, name), JSON.stringify({ ...b, permit_body: b.permit_body.replace(b.argv_digest, "0".repeat(64)) }));
  assert.equal(await codeOf(h.requestPermit(request)), "ISOLATION_UNPROVABLE");
  assert.equal(await codeOf(h.claimPermit({ permitId: real.permit_id, request })), "ISOLATION_UNPROVABLE");
  fs.writeFileSync(path.join(bdir, name), "{ torn");
  assert.equal(await codeOf(h.requestPermit(request)), "ISOLATION_UNPROVABLE");
}));
