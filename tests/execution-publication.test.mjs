// S6 publication reservation tests (ML-DEVOS-RFC-019 §7.1 write-ahead
// publication; AS96-F001; D-072).
//
// Invariant under test: once an RTR is PENDING, no local lifecycle transition
// can contradict the eventual COMMITTED/ABORTED result. The PENDING record is
// the durable reservation; the external S4 transition stays OUTSIDE the S6
// task lock, so every interleaving below starts its competitor while that
// lock is provably NOT held.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { renew } from "../devos/state/kernel.mjs";
import { fakeDriver, runFixed } from "./fixtures/execution/drivers.mjs";
import { cleanupWorld, journalOf, makeWorld, remoteRefSha, taskLockPath } from "./fixtures/execution/harness.mjs";

const SLUG = "Dillaab-source__maisog-labs";
const codeOf = async (p) => {
  try {
    await p;
  } catch (e) {
    return e.code ?? `UNCODED:${e.message}`;
  }
  return "NO_ERROR";
};
const s4History = (w) => JSON.parse(fs.readFileSync(path.join(w.dirs.s4, `${w.taskId}.json`), "utf8")).history;
const readyForQa = (w) => s4History(w).filter((e) => e.type === "transition" && e.to === "READY_FOR_QA");
const types = (w, rec) => journalOf(w, rec).map((e) => e.type);
const taskLock = (w) => taskLockPath(w);
const rtrs = (h, w) => h.inspect.listRtr(w.taskId);

async function withWorld(fn) {
  const w = await makeWorld();
  try {
    return await fn(w);
  } finally {
    cleanupWorld(w);
  }
}

// A quiesced Builder instance with one committed change.
async function quiesced(w, host) {
  const rec = await host.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await host.attach(rec.instance_id, { actorId: w.builder });
  let n = 0;
  for (const op of ["WRITE_FEATURE", "STAGE_ALL", "COMMIT"]) await runFixed(host, { instanceId: rec.instance_id, checkpointRevision: rec.checkpoint.current_revision, requestId: `p${n++}`, op });
  await host.quiesce(rec.instance_id);
  return rec;
}

// complete() whose hook, at `at`, starts `competitor()` once (outside the lock).
function completingHost(w, at) {
  const box = { competitor: null, started: null, lockHeld: null };
  const host = w.host({
    lockWaitMs: 5000,
    faults: {
      onStep: (name) => {
        if (name === at && box.competitor && !box.started) {
          box.lockHeld = fs.existsSync(taskLock(w));
          box.started = box.competitor().then(() => "NO_ERROR", (e) => e.code ?? `UNCODED:${e.message}`);
        }
      },
    },
  });
  return { host, box };
}

// Leaves a durable PENDING reservation behind (the publisher dies after
// RTR_PENDING, before the S4 transition).
async function pendingLeftBehind(w) {
  const rec = await quiesced(w, w.host());
  const dying = w.host({ faults: { onStep: (name) => { if (name === "after-pending") throw new Error("publisher died after PENDING"); } } });
  assert.match(await codeOf(dying.complete(rec.instance_id, { actorId: w.builder })), /UNCODED|ISOLATION_UNPROVABLE/);
  const [r] = rtrs(dying, w);
  assert.equal(r.status.status, "PENDING");
  assert.equal(fs.existsSync(taskLock(w)), false, "the task lock is not held across the external S4 effect");
  return rec;
}

// ---------------------------------------------------------------- required interleavings
test("PENDING exists (lock released) -> competing finishWithoutPublication is refused -> publication resolves exactly once (AS96-F001)", () => withWorld(async (w) => {
  const { host, box } = completingHost(w, "after-pending");
  const rec = await quiesced(w, host);
  box.competitor = () => w.host({ lockWaitMs: 5000 }).finishWithoutPublication(rec.instance_id);
  const out = await host.complete(rec.instance_id, { actorId: w.builder });
  assert.equal(box.lockHeld, false, "the competitor ran in the unlocked external-effect window");
  assert.equal(await box.started, "RESULT_TRANSFER_UNPROVEN");
  assert.equal(host.inspect.getRtrStatus(w.taskId, out.transfer_id).status, "COMMITTED");
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "COMPLETED");
  assert.equal(readyForQa(w).length, 1);
  assert.ok(!types(w, rec).includes("FINISHED_WITHOUT_PUBLICATION"), "no contradictory local evidence");
}));

test("PENDING exists (lock released) -> competing cleanup is refused by the reservation (AS96-F001)", () => withWorld(async (w) => {
  const { host, box } = completingHost(w, "after-pending");
  const rec = await quiesced(w, host);
  box.competitor = () => w.host({ lockWaitMs: 5000 }).cleanup(rec.instance_id);
  await host.complete(rec.instance_id, { actorId: w.builder });
  assert.equal(box.lockHeld, false);
  assert.equal(await box.started, "RESULT_TRANSFER_UNPROVEN", "refused by the reservation, before any state check");
  assert.ok(fs.existsSync(path.join(w.dirs.workspace, SLUG, w.taskId, rec.instance_id)), "nothing was cleaned");
  assert.equal((await host.cleanup(rec.instance_id)).state, "CLEANED", "after COMMITTED the reservation is released");
}));

test("before PENDING (after the push): a competing finish wins; complete then refuses to write PENDING; S4 untouched (AS96-F001)", () => withWorld(async (w) => {
  const { host, box } = completingHost(w, "after-push");
  const rec = await quiesced(w, host);
  box.competitor = () => w.host({ lockWaitMs: 5000 }).finishWithoutPublication(rec.instance_id);
  assert.equal(await codeOf(host.complete(rec.instance_id, { actorId: w.builder })), "QUIESCE_UNPROVEN");
  assert.equal(await box.started, "NO_ERROR");
  assert.equal(rtrs(host, w).length, 0, "no publication record was written");
  assert.equal(readyForQa(w).length, 0);
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "COMPLETED");
  assert.ok(remoteRefSha(w, `refs/heads/${rec.identity.task_branch}`), "the pushed branch is stale, unpublished transport residue");
}));

// ---------------------------------------------------------------- classification of every operation while PENDING
test("classification while a PENDING reservation exists: blocked, allowed and unreachable operations (AS96-F001)", () => withWorld(async (w) => {
  const rec = await pendingLeftBehind(w);
  const h = w.host();
  const id = rec.instance_id;
  const before = JSON.stringify(h.inspect.findInstance(id));
  // BLOCKED: fail closed without changing anything.
  assert.equal(await codeOf(h.finishWithoutPublication(id)), "RESULT_TRANSFER_UNPROVEN");
  assert.equal(await codeOf(h.cleanup(id)), "RESULT_TRANSFER_UNPROVEN");
  assert.equal(await codeOf(h.adoptRenewal(id, { result: { taskId: w.taskId, owner: w.builder, revision: rec.checkpoint.current_revision + 1, state: "BUILDING" } })), "RESULT_TRANSFER_UNPROVEN");
  assert.equal(await codeOf(h.quiesce(id)), "RESULT_TRANSFER_UNPROVEN");
  assert.equal(await codeOf(h.attach(id, { actorId: w.builder })), "INSTANCE_STALE", "existing attach guard, existing code");
  // UNREACHABLE: state-blocked (the instance is QUIESCED; nothing is CLAIMED).
  const req = { instance_id: id, request_id: "while-pending", argv: ["s6-fixture", "write", "src/feature.txt"], checkpoint_revision: rec.checkpoint.current_revision };
  assert.equal(await codeOf(h.requestPermit(req)), "INSTANCE_STALE");
  const earlier = { instance_id: id, request_id: "p0", argv: ["s6-fixture", "write", "src/feature.txt"], checkpoint_revision: rec.checkpoint.current_revision };
  const replay = await h.requestPermit(earlier); // ALLOWED: replay of an existing binding
  assert.equal(replay.replay, true);
  assert.equal(await codeOf(h.claimPermit({ permitId: replay.permit_id, request: earlier })), "ISOLATION_UNPROVABLE");
  assert.equal(await codeOf(fakeDriver(h).report(replay.permit, earlier)), "ISOLATION_UNPROVABLE");
  assert.equal(JSON.stringify(h.inspect.findInstance(id)), before, "no refused operation changed the instance");
  // ALLOWED: validation (observation only).
  assert.equal((await h.validateInstance(id)).outcome, "PROVEN");
  // ALLOWED: complete() resumes THE SAME reservation (same transfer id).
  const [pending] = rtrs(h, w);
  const out = await h.complete(id, { actorId: w.builder });
  assert.equal(out.transfer_id, pending.transfer_id);
  assert.equal(rtrs(h, w).length, 1);
  assert.equal(readyForQa(w).length, 1);
  // After COMMITTED the reservation is released: cleanup is allowed.
  assert.equal(await codeOf(h.finishWithoutPublication(id)), "QUIESCE_UNPROVEN", "COMPLETED, not QUIESCED");
  assert.equal((await h.cleanup(id)).state, "CLEANED");
}));

// ---------------------------------------------------------------- ABORTED disposition
test("ABORTED via recover(): definitive S4 refusal -> ABORTED, reservation released, instance quarantined, then cleanable (AS96-F001)", () => withWorld(async (w) => {
  const rec = await pendingLeftBehind(w);
  await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
  const h = w.host();
  const report = await h.recover();
  assert.deepEqual(report.pending.map((p) => [p.outcome, p.code]), [["ABORTED", "FENCING_REVISION_MISMATCH"]]);
  const [r] = rtrs(h, w);
  assert.equal(r.status.status, "ABORTED");
  const inst = h.inspect.findInstance(rec.instance_id);
  assert.equal(inst.state, "QUARANTINED");
  assert.equal(inst.quarantine_reason, "INSTANCE_STALE");
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
  assert.equal(readyForQa(w).length, 0);
  assert.deepEqual((await h.recover()).pending, [], "a second recover finds nothing to resolve");
  assert.equal((await h.cleanup(rec.instance_id)).state, "CLEANED");
}));

test("ABORTED via complete(): the stale instance may only finish without publication, then be cleaned; attach/complete refuse (AS96-F001)", () => withWorld(async (w) => {
  const h0 = w.host();
  const rec = await quiesced(w, h0);
  const h = w.host({ faults: { onStep: (name) => (name === "after-pending" ? renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 }) : undefined) } });
  assert.equal(await codeOf(h.complete(rec.instance_id, { actorId: w.builder })), "FENCING_REVISION_MISMATCH");
  assert.equal(rtrs(h, w)[0].status.status, "ABORTED");
  const inst = h.inspect.findInstance(rec.instance_id);
  assert.equal(inst.state, "QUIESCED");
  assert.equal(inst.stale, true);
  assert.ok(types(w, rec).includes("RTR_ABORTED"));
  assert.equal(await codeOf(h0.attach(rec.instance_id, { actorId: w.builder })), "FENCING_REVISION_MISMATCH");
  assert.equal(await codeOf(h0.complete(rec.instance_id, { actorId: w.builder })), "FENCING_REVISION_MISMATCH");
  assert.equal((await h0.finishWithoutPublication(rec.instance_id)).state, "COMPLETED", "consistent with STALE_UNPUBLISHED");
  assert.equal((await h0.cleanup(rec.instance_id)).state, "CLEANED");
  assert.equal(readyForQa(w).length, 0);
}));

// ---------------------------------------------------------------- transient S4 failure keeps the reservation
test("a transient S4 failure (S4 lock held) never writes ABORTED: the RTR stays PENDING and later commits exactly once (AS96-F001)", () => withWorld(async (w) => {
  const rec = await pendingLeftBehind(w);
  const s4Lock = path.join(w.dirs.s4, `${w.taskId}.lock`);
  fs.writeFileSync(s4Lock, JSON.stringify({ holder: "someone-else" }));
  const h = w.host();
  const first = await h.recover();
  assert.deepEqual(first.pending.map((p) => p.outcome), ["UNPROVEN"]);
  assert.equal(rtrs(h, w)[0].status.status, "PENDING", "outcome unknown -> reservation kept");
  assert.ok(types(w, rec).includes("TRANSITION_UNRESOLVED"));
  assert.equal(await codeOf(h.finishWithoutPublication(rec.instance_id)), "RESULT_TRANSFER_UNPROVEN");
  fs.rmSync(s4Lock);
  const second = await h.recover();
  assert.deepEqual(second.pending.map((p) => p.outcome), ["COMMITTED"]);
  assert.equal(readyForQa(w).length, 1);
  assert.equal(h.inspect.findInstance(rec.instance_id).state, "COMPLETED");
}));

// ---------------------------------------------------------------- quarantine is never reversed
test("a quarantined instance is never restored when its PENDING publication later commits (AS96-F001)", () => withWorld(async (w) => {
  const rec = await pendingLeftBehind(w);
  const s4Lock = path.join(w.dirs.s4, `${w.taskId}.lock`);
  const instDir = path.join(w.dirs.workspace, SLUG, w.taskId, rec.instance_id);
  // Publication cannot resolve yet (S4 busy); independently the instance
  // directory disappears, so recovery quarantines it -- allowed while PENDING.
  fs.writeFileSync(s4Lock, "{}");
  fs.renameSync(instDir, `${instDir}.moved`);
  const h = w.host();
  const first = await h.recover();
  assert.deepEqual(first.pending.map((p) => p.outcome), ["UNPROVEN"]);
  assert.deepEqual(first.quarantined, [rec.instance_id]);
  fs.rmSync(s4Lock);
  fs.renameSync(`${instDir}.moved`, instDir);
  const second = await h.recover();
  assert.deepEqual(second.pending.map((p) => p.outcome), ["COMMITTED"], "S4 accepted the publication; the RTR commits");
  const inst = h.inspect.findInstance(rec.instance_id);
  assert.equal(inst.state, "QUARANTINED", "quarantine is not silently reversed");
  assert.equal(inst.quarantine_reason, "MISSING_DIRECTORY");
  assert.equal(readyForQa(w).length, 1);
  assert.equal((await h.cleanup(rec.instance_id)).state, "CLEANED", "released reservation: the quarantined instance can be cleaned");
}));

// ---------------------------------------------------------------- COMMITTED idempotency
test("COMMITTED replay/recovery is idempotent: repeated recover and complete never produce a second transition (AS96-F001)", () => withWorld(async (w) => {
  const rec = await quiesced(w, w.host());
  const dying = w.host({ faults: { onStep: (name) => { if (name === "after-transition") throw new Error("died after S4 accepted"); } } });
  await codeOf(dying.complete(rec.instance_id, { actorId: w.builder }));
  const h = w.host();
  assert.equal(rtrs(h, w)[0].status.status, "PENDING");
  assert.deepEqual((await h.recover()).pending.map((p) => p.outcome), ["COMMITTED"]);
  const committed = rtrs(h, w)[0].status;
  assert.deepEqual((await h.recover()).pending, []);
  assert.equal(await codeOf(h.complete(rec.instance_id, { actorId: w.builder })), "QUIESCE_UNPROVEN");
  assert.deepEqual(rtrs(h, w)[0].status, committed, "COMMITTED record unchanged");
  assert.equal(readyForQa(w).length, 1);
  assert.equal(h.inspect.findInstance(rec.instance_id).state, "COMPLETED");
}));

test("concurrent resolvers of one PENDING record (in-flight publisher + recover) converge: one transition, COMMITTED, never ABORTED (AS96-F001)", () => withWorld(async (w) => {
  const { host, box } = completingHost(w, "after-pending");
  const rec = await quiesced(w, host);
  box.competitor = () => w.host({ lockWaitMs: 5000 }).recover();
  const published = await codeOf(host.complete(rec.instance_id, { actorId: w.builder }));
  const recovered = await box.started;
  assert.ok(["NO_ERROR", "RESULT_TRANSFER_UNPROVEN"].includes(published), published);
  assert.equal(recovered, "NO_ERROR");
  if (rtrs(host, w)[0].status.status === "PENDING") await w.host().recover(); // the loser left it unresolved
  const [r] = rtrs(host, w);
  assert.equal(r.status.status, "COMMITTED");
  assert.equal(readyForQa(w).length, 1);
  assert.ok(!types(w, rec).includes("RTR_ABORTED"));
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "COMPLETED");
}));
