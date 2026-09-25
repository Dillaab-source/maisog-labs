// S6 active-slot and execution-uncertainty runtime tests, replayed against the
// reference model (ML-DEVOS-RFC-019 §13.1, §13.4, §13.6 Q1-Q5b, §18 items 14
// and 16; ML-DEVOS-AS-099/100/101; D-074).
//
// Each named sequence runs on the REAL host (task store, S4, S5, Git fixture)
// and through the pure model; the observable outcomes must agree. The fake
// driver executes nothing: a process group is a synthetic id whose liveness a
// controllable read-only inspector reports. A crash is a fresh host plus
// recover(), which sees exactly the committed state a restarted process would.
import assert from "node:assert/strict";
import { test } from "node:test";

import { publishable as modelPublishable, run as modelRun } from "../devos/execution/model.mjs";
import { fakeDriver } from "./fixtures/execution/drivers.mjs";
import { cleanupWorld, makeWorld } from "./fixtures/execution/harness.mjs";

const PGID = 424242;
const WRITE = ["s6-fixture", "write", "src/feature.txt"];

const codeOf = async (p) => {
  try {
    await p;
  } catch (e) {
    return e.code ?? `UNCODED:${e.message}`;
  }
  return "NO_ERROR";
};

async function withWorld(fn) {
  const w = await makeWorld({});
  try {
    return await fn(w);
  } finally {
    cleanupWorld(w);
  }
}

// A host whose liveness inspector and clock the test controls.
function controlled(w) {
  const alive = new Set();
  const time = { offset: 0 };
  const over = {
    livenessInspector: { groupAlive: (g) => alive.has(g) },
    clock: () => Date.now() + time.offset,
    quiesceDeadlineMs: 100,
    claimWindowMs: 1000, // so trusted time can pass claim_deadline inside the S4 lease
  };
  return { alive, time, host: () => w.host(over) };
}

async function claimed(w, h, rec, requestId) {
  const request = { instance_id: rec.instance_id, request_id: requestId, argv: [...WRITE], checkpoint_revision: rec.checkpoint.current_revision };
  const issued = await h.requestPermit(request);
  await fakeDriver(h).claim(issued.permit_id, request);
  return { permitId: issued.permit_id, permit: issued.permit, request };
}

// ATTACHED i1 -> n claims -> crash before any report -> recovery quarantine.
async function claimCrashRecover(w, c, n = 1) {
  const h1 = c.host();
  const rec = await h1.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h1.attach(rec.instance_id, { actorId: w.builder });
  const claims = [];
  for (let i = 0; i < n; i += 1) claims.push(await claimed(w, h1, rec, `q-${i}`));
  const h2 = c.host(); // the restarted host
  const report = await h2.recover();
  return { h: h2, rec, claims, report };
}

const secondCreate = (h, w) => codeOf(h.createInstance({ role: "BUILDER", claimResult: w.anchor }));

function lateReport(h, claim) {
  return fakeDriver(h).report(claim.permit, claim.request, { process_groups: [PGID], terminated: false, ended_at: null, exit_code: null });
}

// Model counterparts, with the same op names as tests/execution-model.test.mjs.
const M_ATTACHED = [["create", "i1"], ["create_finish", "i1"], ["attach", "i1"]];
const M_CLAIM_CRASH = [...M_ATTACHED, ["issue", "p1"], ["claim", "p1"], ["crash"], ["recover"]];
const modelOutcome = (ops) => {
  const r = modelRun(ops);
  assert.deepEqual(r.violations, []);
  return { secondCreate: r.trace.at(-1).refused ? "BLOCKED" : "SUCCEEDS", state: r.state };
};

test("Q1 runtime = model: CLAIMED -> crash before report -> recovery quarantine -> second create BLOCKED", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims, report } = await claimCrashRecover(w, c);
  assert.deepEqual(report.quarantined, [rec.instance_id]);
  c.time.offset = 5 * 60 * 1000; // past claim_deadline, inside the 10-minute S4 lease
  const code = await secondCreate(h, w);
  const permit = h.inspect.getPermitStatus(w.taskId, claims[0].permitId);
  const m = modelOutcome([...M_CLAIM_CRASH, ["time_advance"], ["create", "i2"]]);
  assert.equal(m.secondCreate, "BLOCKED");
  assert.equal(code, "WORKTREE_COLLISION", "SECOND CREATE BLOCKED");
  assert.equal(h.inspect.findInstance(rec.instance_id).state, "QUARANTINED");
  assert.equal(permit.state, "CLAIMED");
  assert.equal(permit.claim_reservation, "OPEN");
  assert.equal(permit.claim_reservation, m.state.permits.p1.claim);
  assert.equal(h.inspect.slot(w.taskId).instance_id, rec.instance_id, "the quarantined instance keeps the slot");
  const prov = h.provenance(rec.instance_id);
  assert.equal(prov.active, true);
  assert.deepEqual(prov.unresolved_influence, [`claim:${claims[0].permitId}`]);
}));

test("Q2 runtime = model: a verified late report registers liveness, keeps the slot, never restores or publishes", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims } = await claimCrashRecover(w, c);
  c.alive.add(PGID);
  const out = await lateReport(h, claims[0]);
  assert.equal(out.quarantined, true);
  const permit = h.inspect.getPermitStatus(w.taskId, claims[0].permitId);
  assert.equal(permit.state, "REPORTED");
  assert.equal(permit.claim_reservation, "SUPERSEDED_BY_REPORT");
  assert.deepEqual(Object.keys(permit.obligations), [String(PGID)]);
  assert.equal(permit.obligations[PGID].state, "OPEN");
  const types = h.inspect.journal(rec.instance_id).map((e) => e.type);
  assert.ok(types.includes("LATE_REPORT") && !types.includes("REPORT"));
  const m = modelOutcome([...M_CLAIM_CRASH, ["report", "p1"], ["create", "i2"]]);
  assert.equal(m.secondCreate, "BLOCKED");
  assert.equal(await secondCreate(h, w), "WORKTREE_COLLISION");
  assert.equal(h.inspect.findInstance(rec.instance_id).state, "QUARANTINED");
  assert.equal(modelPublishable(m.state, "i1"), false);
  assert.equal(await codeOf(h.attach(rec.instance_id, { actorId: w.builder })), "INSTANCE_STALE", "never restored");
  assert.equal(await codeOf(h.complete(rec.instance_id, { actorId: w.builder })), "QUIESCE_UNPROVEN", "never publishable");
}));

test("Q3 runtime = model: late report -> group proven terminated -> slot released -> later valid create succeeds", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims } = await claimCrashRecover(w, c);
  c.alive.add(PGID);
  await lateReport(h, claims[0]);
  const stillAlive = await h.resolveExecution(rec.instance_id);
  assert.deepEqual(stillAlive.proven, []);
  assert.equal(await secondCreate(h, w), "WORKTREE_COLLISION");
  c.alive.delete(PGID);
  const res = await h.resolveExecution(rec.instance_id);
  assert.deepEqual(res.proven.map((o) => o.pgid), [PGID]);
  assert.deepEqual(res.unresolved, []);
  assert.equal(h.inspect.getPermitStatus(w.taskId, claims[0].permitId).obligations[PGID].state, "PROOF_RESOLVED");
  assert.equal(h.inspect.slot(w.taskId), null, "slot released in the resolving transaction");
  const m = modelOutcome([...M_CLAIM_CRASH, ["report", "p1"], ["group_exit", "p1"], ["resolve_proof", "p1"], ["create", "i2"]]);
  assert.equal(m.secondCreate, "SUCCEEDS");
  const second = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  assert.equal(second.state, "READY");
  assert.equal(h.inspect.findInstance(rec.instance_id).state, "QUARANTINED", "the first instance stays QUARANTINED");
}));

test("Q4 runtime = model: a live group, or a second open claim, keeps the slot held", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims } = await claimCrashRecover(w, c, 2);
  c.alive.add(PGID);
  await lateReport(h, claims[0]);
  c.alive.delete(PGID);
  await h.resolveExecution(rec.instance_id);
  const m = modelOutcome([...M_ATTACHED, ["issue", "p1"], ["issue", "p2"], ["claim", "p1"], ["claim", "p2"], ["crash"], ["recover"],
    ["report", "p1"], ["group_exit", "p1"], ["resolve_proof", "p1"], ["create", "i2"]]);
  assert.equal(m.secondCreate, "BLOCKED");
  assert.equal(await secondCreate(h, w), "WORKTREE_COLLISION");
  assert.equal(h.inspect.getPermitStatus(w.taskId, claims[1].permitId).claim_reservation, "OPEN");
}));

test("Q5 runtime = model: no report -> time -> BLOCKED -> exact audited operator resolution -> slot released -> later create succeeds", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims } = await claimCrashRecover(w, c);
  c.time.offset = 5 * 60 * 1000; // past claim_deadline, inside the S4 lease
  assert.equal(await secondCreate(h, w), "WORKTREE_COLLISION");
  assert.equal(h.inspect.getPermitStatus(w.taskId, claims[0].permitId).claim_reservation, "OPEN", "time changes no reservation");
  // An incomplete audit record is refused and changes nothing.
  assert.equal(await codeOf(h.resolveExecutionByOperator(rec.instance_id, { target: { kind: "claim", permitId: claims[0].permitId }, operatorId: "op-1", reason: "host rebooted" })), "MALFORMED_REQUEST");
  const out = await h.resolveExecutionByOperator(rec.instance_id, {
    target: { kind: "claim", permitId: claims[0].permitId }, operatorId: "op-1", reason: "driver host rebooted; no process survives", evidenceRef: "ops-ticket:4711",
  });
  assert.deepEqual(out.unresolved, []);
  const permit = h.inspect.getPermitStatus(w.taskId, claims[0].permitId);
  assert.equal(permit.state, "CLAIMED", "historical permit remains CLAIMED");
  assert.equal(permit.claim_reservation, "OPERATOR_RESOLVED");
  assert.equal(permit.claim_resolution.evidence_class, "ACTOR_REPORTED");
  const entry = h.inspect.journal(rec.instance_id).find((e) => e.type === "OPERATOR_RESOLUTION");
  assert.deepEqual([entry.data.target, entry.data.operator_id, entry.data.evidence_ref, entry.data.evidence_class], [`claim:${claims[0].permitId}`, "op-1", "ops-ticket:4711", "ACTOR_REPORTED"]);
  assert.equal(h.inspect.findInstance(rec.instance_id).state, "QUARANTINED");
  assert.equal(h.inspect.slot(w.taskId), null);
  const m = modelOutcome([...M_CLAIM_CRASH, ["time_advance"], ["resolve_operator_claim", "p1"], ["create", "i2"]]);
  assert.equal(m.secondCreate, "SUCCEEDS");
  assert.equal(m.state.permits.p1.status, permit.state);
  assert.equal(m.state.permits.p1.claim, permit.claim_reservation);
  c.time.offset = 0;
  const second = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  assert.equal(second.state, "READY", "later valid create succeeds");
  assert.equal(await codeOf(h.complete(rec.instance_id, { actorId: w.builder })), "QUIESCE_UNPROVEN", "the first instance is never publishable");
}));

test("Q5a runtime = model: the resolution closes only its named target; another claim or obligation keeps the slot", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims } = await claimCrashRecover(w, c, 2);
  await h.resolveExecutionByOperator(rec.instance_id, { target: { kind: "claim", permitId: claims[0].permitId }, operatorId: "op-1", reason: "r", evidenceRef: "e" });
  assert.equal(h.inspect.getPermitStatus(w.taskId, claims[1].permitId).claim_reservation, "OPEN", "claim B untouched");
  const m = modelOutcome([...M_ATTACHED, ["issue", "p1"], ["issue", "p2"], ["claim", "p1"], ["claim", "p2"], ["crash"], ["recover"], ["resolve_operator_claim", "p1"], ["create", "i2"]]);
  assert.equal(m.secondCreate, "BLOCKED");
  assert.equal(await secondCreate(h, w), "WORKTREE_COLLISION");
  // An open liveness obligation is untouched by a claim resolution too.
  c.alive.add(PGID);
  await lateReport(h, claims[1]);
  assert.equal(await codeOf(h.resolveExecutionByOperator(rec.instance_id, { target: { kind: "claim", permitId: claims[1].permitId }, operatorId: "op-1", reason: "r", evidenceRef: "e" })), "ISOLATION_UNPROVABLE", "a superseded claim is not OPEN");
  assert.equal(h.inspect.getPermitStatus(w.taskId, claims[1].permitId).obligations[PGID].state, "OPEN");
  assert.equal(await secondCreate(h, w), "WORKTREE_COLLISION");
  // Resolving exactly that obligation releases the slot.
  await h.resolveExecutionByOperator(rec.instance_id, { target: { kind: "obligation", permitId: claims[1].permitId, pgid: PGID }, operatorId: "op-2", reason: "group unreadable", evidenceRef: "e2" });
  assert.equal(h.inspect.slot(w.taskId), null);
  assert.equal((await h.createInstance({ role: "BUILDER", claimResult: w.anchor })).state, "READY");
}));

test("Q5b runtime = model: with no resolution the reservation stays OPEN across time and repeated recovery", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims } = await claimCrashRecover(w, c);
  // Inside the S4 lease the slot is what blocks the create.
  for (const seconds of [2, 60, 540]) {
    c.time.offset = seconds * 1000;
    await c.host().recover();
    assert.equal(await secondCreate(c.host(), w), "WORKTREE_COLLISION");
  }
  // Far beyond it, S4 fencing blocks first -- and the reservation is still OPEN.
  c.time.offset = 365 * 24 * 3600 * 1000;
  await c.host().recover();
  assert.equal(await secondCreate(c.host(), w), "LEASE_EXPIRED");
  const permit = h.inspect.getPermitStatus(w.taskId, claims[0].permitId);
  assert.equal(permit.state, "CLAIMED");
  assert.equal(permit.claim_reservation, "OPEN");
  const m = modelOutcome([...M_CLAIM_CRASH, ["time_advance"], ["time_advance"], ["recover"], ["create", "i2"]]);
  assert.equal(m.secondCreate, "BLOCKED");
  assert.equal(h.inspect.slot(w.taskId).instance_id, rec.instance_id);
}));

test("operator resolution applies only to a quarantined instance and never to another instance's permit", () => withWorld(async (w) => {
  const c = controlled(w);
  const h = c.host();
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  const cl = await claimed(w, h, rec, "x-1");
  assert.equal(await codeOf(h.resolveExecutionByOperator(rec.instance_id, { target: { kind: "claim", permitId: cl.permitId }, operatorId: "op", reason: "r", evidenceRef: "e" })), "INSTANCE_STALE");
  assert.equal(await codeOf(h.resolveExecution(rec.instance_id)), "INSTANCE_STALE");
  assert.equal(h.inspect.getPermitStatus(w.taskId, cl.permitId).claim_reservation, "OPEN");
}));

test("a second create while the slot is held is WORKTREE_COLLISION; concurrent creates commit exactly one slot (§13.4)", () => withWorld(async (w) => {
  const h = w.host({ lockWaitMs: 5000 });
  const results = await Promise.allSettled([1, 2, 3].map(() => h.createInstance({ role: "BUILDER", claimResult: w.anchor })));
  const ok = results.filter((r) => r.status === "fulfilled");
  assert.equal(ok.length, 1, "exactly one create commits the slot");
  for (const r of results.filter((x) => x.status === "rejected")) assert.equal(r.reason.code, "WORKTREE_COLLISION");
  assert.equal(h.inspect.listInstances(w.taskId).length, 1, "no second environment was minted");
  assert.equal(await secondCreate(h, w), "WORKTREE_COLLISION");
}));

test("a prepared cleanup is influence: an old quarantined instance is cleaned only when the slot is free (§13.4, I1)", () => withWorld(async (w) => {
  const c = controlled(w);
  const { h, rec, claims } = await claimCrashRecover(w, c);
  await h.resolveExecutionByOperator(rec.instance_id, { target: { kind: "claim", permitId: claims[0].permitId }, operatorId: "op", reason: "r", evidenceRef: "e" });
  const second = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  assert.equal(await codeOf(h.cleanup(rec.instance_id)), "WORKTREE_COLLISION", "never two ACTIVE environments");
  await h.attach(second.instance_id, { actorId: w.builder });
  await h.quiesce(second.instance_id);
  await h.finishWithoutPublication(second.instance_id);
  assert.equal((await h.cleanup(rec.instance_id)).state, "CLEANED");
  assert.equal(h.inspect.slot(w.taskId), null);
}));
