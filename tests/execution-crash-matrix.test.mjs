// S6 persistence-point crash and interleaving matrix (ML-DEVOS-RFC-019 §18
// item 15; §13.2, §13.3, §13.6; D-074).
//
// For each mutating operation not already covered by the store, recovery and
// publication suites, a REAL child process is SIGKILLed at every persistence
// point of the operation -- before its commit (task-store envelope synced, not
// yet renamed), after it (renamed), and at its external-effect boundary -- then
// a fresh host recovers. After every crash the committed state is checked
// against the §13.6 invariants and the operation's forbidden outcomes.
// Results are process-crash evidence only (§13.2 "Durability scope").
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { isActive, unresolvedInfluence } from "../devos/execution/state.mjs";
import { fakeDriver, runFixed } from "./fixtures/execution/drivers.mjs";
import { cleanupWorld, envelopeOf, makeWorld, taskLockPath } from "./fixtures/execution/harness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CRASH_WORKER = path.join(HERE, "fixtures", "execution", "crash-worker.mjs");
const WRITE = ["s6-fixture", "write", "src/feature.txt"];
const PGID = 515151;

async function withWorld(fn) {
  const w = await makeWorld();
  try {
    return await fn(w);
  } finally {
    cleanupWorld(w);
  }
}

function sigkillWorker(w, spec) {
  const full = { dirs: w.dirs, builder: w.builder, contractRef: w.contractRef, contractPath: w.contractPath, anchor: w.anchor, ...spec };
  return spawnSync(process.execPath, [CRASH_WORKER, JSON.stringify(full)], { encoding: "utf8", timeout: 60000 });
}

// The operator action after a crash inside a transaction: the killed process's
// lock is never stolen by S6.
function clearLockIfHeld(w) {
  if (fs.existsSync(taskLockPath(w))) fs.rmSync(taskLockPath(w));
}

// §13.6 invariants over the committed envelope (I1, I3, I9, I12, I13).
function assertInvariants(w) {
  const { state: st } = envelopeOf(w);
  const active = Object.keys(st.instances).filter((i) => isActive(st, i));
  assert.ok(active.length <= 1, `I1: ACTIVE ${active.join(",")}`);
  for (const i of active) assert.equal(st.slot?.instance_id, i, `I1: ACTIVE ${i} holds the slot`);
  for (const [id, p] of Object.entries(st.permits)) {
    if (p.state === "CLAIMED") assert.ok(["OPEN", "OPERATOR_RESOLVED"].includes(p.claim_reservation), `I12: CLAIMED ${id} is ${p.claim_reservation}`);
    if (p.state === "REPORTED") {
      assert.equal(p.claim_reservation, "SUPERSEDED_BY_REPORT", `I12: REPORTED ${id}`);
      for (const g of p.report.process_groups) assert.ok(p.obligations[String(g)], `I3: REPORTED ${id} without obligation for group ${g}`);
    }
    if (st.instances[p.instance_id].state === "QUIESCED") assert.ok(!["ISSUED", "CLAIMED"].includes(p.state), `I9: ${id}`);
  }
  for (const [i, lines] of Object.entries(st.journal)) {
    for (const e of lines.map((l) => JSON.parse(l)).filter((x) => x.type === "OPERATOR_RESOLUTION")) {
      const [kind, pid, g] = e.data.target.split(":");
      const closed = kind === "claim" ? st.permits[pid].claim_reservation === "OPERATOR_RESOLVED" : st.permits[pid].obligations[g].state === "OPERATOR_RESOLVED";
      assert.ok(closed, `I13: ${i} has an OPERATOR_RESOLUTION record whose target ${e.data.target} is not closed`);
    }
  }
  return st;
}

async function attached(w) {
  const h = w.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  return { h, rec };
}

async function issued(w, h, rec, requestId = "m-1") {
  const request = { instance_id: rec.instance_id, request_id: requestId, argv: [...WRITE], checkpoint_revision: rec.checkpoint.current_revision };
  const p = await h.requestPermit(request);
  return { request, permitId: p.permit_id, permit: p.permit };
}

const POINTS = ["envelope:synced", "envelope:renamed"];

for (const point of POINTS) {
  test(`claim: SIGKILL at ${point} -> ISSUED, or CLAIMED with its OPEN reservation; recovery keeps the slot`, () => withWorld(async (w) => {
    const { h, rec } = await attached(w);
    const { request, permitId } = await issued(w, h, rec);
    const r = sigkillWorker(w, { op: "claim", crashAt: point, permitId, request });
    assert.equal(r.signal, "SIGKILL", r.stderr);
    clearLockIfHeld(w);
    let st = assertInvariants(w);
    const committed = point === "envelope:renamed";
    assert.equal(st.permits[permitId].state, committed ? "CLAIMED" : "ISSUED");
    assert.equal(st.permits[permitId].claim_reservation, committed ? "OPEN" : "NONE", "CLAIMED and its reservation commit together");
    const report = await w.host().recover();
    st = assertInvariants(w);
    if (committed) {
      assert.deepEqual(report.quarantined, [rec.instance_id]);
      assert.equal(st.slot.instance_id, rec.instance_id, "execution-uncertain: the slot stays held");
    } else {
      assert.equal(st.instances[rec.instance_id].state, "ATTACHED", "nothing was claimed; nothing to quarantine");
    }
  }));

  test(`late report: SIGKILL at ${point} -> never a closed claim without its obligations (§13.1 step 5)`, () => withWorld(async (w) => {
    const { h, rec } = await attached(w);
    const { request, permitId, permit } = await issued(w, h, rec);
    await fakeDriver(h).claim(permitId, request);
    await w.host().recover(); // crash before report -> QUARANTINED
    const report = fakeDriver(h).reportFor(permit, request, { process_groups: [PGID], terminated: false, ended_at: null, exit_code: null });
    const r = sigkillWorker(w, { op: "report", crashAt: point, report });
    assert.equal(r.signal, "SIGKILL", r.stderr);
    clearLockIfHeld(w);
    const st = assertInvariants(w);
    const p = st.permits[permitId];
    if (point === "envelope:renamed") {
      assert.deepEqual([p.state, p.claim_reservation, p.obligations[PGID].state], ["REPORTED", "SUPERSEDED_BY_REPORT", "OPEN"]);
    } else {
      assert.deepEqual([p.state, p.claim_reservation, Object.keys(p.obligations).length], ["CLAIMED", "OPEN", 0]);
    }
    assert.equal(st.instances[rec.instance_id].state, "QUARANTINED", "a late report never restores");
    assert.equal(st.slot.instance_id, rec.instance_id, "either way the slot stays held");
    assert.ok(unresolvedInfluence(st, rec.instance_id).length > 0);
  }));

  test(`operator resolution: SIGKILL at ${point} -> no record without its closed target, nothing else closed`, () => withWorld(async (w) => {
    const { h, rec } = await attached(w);
    const a = await issued(w, h, rec, "a");
    const b = await issued(w, h, rec, "b");
    await fakeDriver(h).claim(a.permitId, a.request);
    await fakeDriver(h).claim(b.permitId, b.request);
    await w.host().recover();
    const resolution = { target: { kind: "claim", permitId: a.permitId }, operatorId: "op-1", reason: "driver host rebooted", evidenceRef: "ops:1" };
    const r = sigkillWorker(w, { op: "operator", crashAt: point, instanceId: rec.instance_id, resolution });
    assert.equal(r.signal, "SIGKILL", r.stderr);
    clearLockIfHeld(w);
    const st = assertInvariants(w);
    assert.equal(st.permits[a.permitId].claim_reservation, point === "envelope:renamed" ? "OPERATOR_RESOLVED" : "OPEN");
    assert.equal(st.permits[b.permitId].claim_reservation, "OPEN", "claim B untouched");
    assert.equal(st.permits[a.permitId].state, "CLAIMED", "history never rewritten");
    assert.equal(st.slot.instance_id, rec.instance_id, "claim B still reserves the slot");
  }));
}

test("push: SIGKILL after the push intent commits -> recovery reconciles by observing the remote; one publication on retry", () => withWorld(async (w) => {
  const { h, rec } = await attached(w);
  let n = 0;
  for (const op of ["WRITE_FEATURE", "STAGE_ALL", "COMMIT"]) await runFixed(h, { instanceId: rec.instance_id, checkpointRevision: rec.checkpoint.current_revision, requestId: `r${n++}`, op });
  await h.quiesce(rec.instance_id);
  const r = sigkillWorker(w, { op: "complete", crashAt: "after-push-intent", instanceId: rec.instance_id });
  assert.equal(r.signal, "SIGKILL", r.stderr);
  assert.equal(fs.existsSync(taskLockPath(w)), false, "the effect boundary is outside the lock");
  let st = assertInvariants(w);
  assert.equal(st.intents[rec.instance_id].push.status, "OPEN", "the intent is an open reservation");
  const h2 = w.host();
  // The retry resumes the SAME push intent (same target) and publishes once.
  const out = await h2.complete(rec.instance_id, { actorId: w.builder });
  assert.match(out.transfer_id, /^[0-9a-f]{64}$/);
  const rep = await h2.recover();
  st = assertInvariants(w);
  assert.notEqual(st.intents[rec.instance_id].push.status, "OPEN", `reconciled: ${JSON.stringify(rep.reconciled)}`);
  const s4 = await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId });
  assert.equal(s4.state, "READY_FOR_QA", "exactly one publication");
  assert.equal(Object.values(st.rtr).filter((x) => x.status === "COMMITTED").length, 1);
}));

test("cleanup: SIGKILL after the cleanup intent commits -> recovery reconciles by observing the proven root; never adopts", () => withWorld(async (w) => {
  const { h, rec } = await attached(w);
  await h.quiesce(rec.instance_id);
  await h.finishWithoutPublication(rec.instance_id);
  const r = sigkillWorker(w, { op: "cleanup", crashAt: "after-cleanup-intent", instanceId: rec.instance_id });
  assert.equal(r.signal, "SIGKILL", r.stderr);
  let st = assertInvariants(w);
  assert.equal(st.intents[rec.instance_id].cleanup.status, "OPEN");
  assert.equal(st.slot.instance_id, rec.instance_id, "a prepared cleanup holds the slot");
  const rep = await w.host().recover();
  st = assertInvariants(w);
  assert.deepEqual(rep.reconciled.map((x) => [x.effect, x.outcome]), [["cleanup", "FAILED"]], "the root is still present: residue, never success");
  assert.equal(st.instances[rec.instance_id].state, "QUARANTINED");
  assert.equal(st.slot, null);
  // A fresh cleanup of the quarantined instance completes.
  assert.equal((await w.host().cleanup(rec.instance_id)).state, "CLEANED");
  assertInvariants(w);
}));
