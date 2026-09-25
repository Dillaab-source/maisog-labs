// S6 lazy permit expiry commits its justifying evidence (ML-DEVOS-RFC-019
// §13.1 permit lifecycle, §13.6 I5; ML-DEVOS-AS-102 AS102-F001; D-074).
//
// An ISSUED permit past its claim deadline becomes EXPIRED_UNCLAIMED in the next
// transaction of its task. That transition and a PERMIT_EXPIRED entry for the
// exact permit must commit in the same task-store version, as the reference
// model's explicit `expire` transition does. Time never moves a CLAIMED permit.
import assert from "node:assert/strict";
import { test } from "node:test";

import { replayJournal } from "../devos/execution/journal.mjs";
import { run as modelRun } from "../devos/execution/model.mjs";
import { fakeDriver } from "./fixtures/execution/drivers.mjs";
import { cleanupWorld, envelopeOf, makeWorld } from "./fixtures/execution/harness.mjs";

const WRITE = ["s6-fixture", "write", "src/feature.txt"];
const WINDOW_MS = 1000;

const codeOf = async (p) => {
  try {
    await p;
  } catch (e) {
    return e.code ?? `UNCODED:${e.message}`;
  }
  return "NO_ERROR";
};

async function withAttached(fn) {
  const w = await makeWorld({});
  const time = { offset: 0 };
  try {
    const h = w.host({ clock: () => Date.now() + time.offset, claimWindowMs: WINDOW_MS });
    const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
    await h.attach(rec.instance_id, { actorId: w.builder });
    return await fn({ w, h, rec, time });
  } finally {
    cleanupWorld(w);
  }
}

const request = (rec, id) => ({ instance_id: rec.instance_id, request_id: id, argv: [...WRITE], checkpoint_revision: rec.checkpoint.current_revision });

// The committed journal of one instance, verified from genesis.
function committedJournal(w, rec) {
  const env = envelopeOf(w);
  const { entries } = replayJournal(env.state.journal[rec.instance_id], rec.identity_digest); // throws on any chain break
  return { version: env.version, state: env.state, entries: entries.map((e) => e.entry) };
}
const expiredEntries = (j, permitId) => j.entries.filter((e) => e.type === "PERMIT_EXPIRED" && e.data.permit_id === permitId);

test("E1: an expired attempted claim fails closed and commits EXPIRED_UNCLAIMED together with its PERMIT_EXPIRED evidence", () => withAttached(async ({ w, h, rec, time }) => {
  const r = request(rec, "e1");
  const p = await h.requestPermit(r);
  const before = committedJournal(w, rec);
  assert.equal(before.state.permits[p.permit_id].state, "ISSUED");
  assert.deepEqual(expiredEntries(before, p.permit_id), []);

  time.offset = WINDOW_MS + 60_000;
  assert.equal(await codeOf(h.claimPermit({ permitId: p.permit_id, request: r })), "ISOLATION_UNPROVABLE", "fails closed as designed");

  const after = committedJournal(w, rec); // the journal head verifies
  assert.equal(after.version, before.version + 1, "exactly one commit");
  assert.equal(after.state.permits[p.permit_id].state, "EXPIRED_UNCLAIMED");
  const ev = expiredEntries(after, p.permit_id);
  assert.equal(ev.length, 1, "the expiry evidence is in the same committed version as the state");
  assert.deepEqual(ev[0].data, {
    permit_id: p.permit_id, permit_digest: after.state.permits[p.permit_id].permit_digest, reason: "CLAIM_DEADLINE_PASSED",
    claim_deadline: new Date(after.state.permits[p.permit_id].claim_deadline_ms).toISOString(),
  });
  assert.equal(after.entries.length, before.entries.length + 1, "the expiry entry is the only new evidence");
  // A later transaction does not expire it again or write a second event.
  await h.recover();
  assert.equal(expiredEntries(committedJournal(w, rec), p.permit_id).length, 1);
}));

test("E1b: every permit that expires in one transaction gets its own evidence in that transaction", () => withAttached(async ({ w, h, rec, time }) => {
  const a = await h.requestPermit(request(rec, "a"));
  const b = await h.requestPermit(request(rec, "b"));
  const before = committedJournal(w, rec);
  time.offset = WINDOW_MS + 60_000;
  await h.recover(); // any transaction of the task persists lazy expiry
  const after = committedJournal(w, rec);
  for (const p of [a, b]) {
    assert.equal(after.state.permits[p.permit_id].state, "EXPIRED_UNCLAIMED");
    assert.equal(expiredEntries(after, p.permit_id).length, 1);
  }
  const fresh = after.entries.slice(before.entries.length).filter((e) => e.type === "PERMIT_EXPIRED");
  assert.equal(fresh.length, 2);
}));

test("E2: the runtime expiry corresponds to the reference model's explicit `expire` transition with committed evidence", () => withAttached(async ({ w, h, rec, time }) => {
  const m = modelRun([["create", "i1"], ["create_finish", "i1"], ["attach", "i1"], ["issue", "p1"], ["expire", "p1"]]);
  assert.deepEqual(m.violations, []);
  const last = m.trace.at(-1).state;
  assert.equal(last.permits.p1.status, "EXPIRED_UNCLAIMED");
  assert.deepEqual([last.last.op, last.last.target], ["EXPIRE", "p1"]);
  assert.equal(last.last.version, last.version, "model: state and evidence in the same version");

  const p = await h.requestPermit(request(rec, "e2"));
  const v0 = committedJournal(w, rec).version;
  time.offset = WINDOW_MS + 60_000;
  await h.recover();
  const after = committedJournal(w, rec);
  assert.equal(after.state.permits[p.permit_id].state, last.permits.p1.status);
  assert.equal(expiredEntries(after, p.permit_id).length, 1, "runtime: evidence committed with the state");
  assert.ok(after.version > v0);
  assert.equal(after.state.permits[p.permit_id].claim_reservation, "NONE", "an unclaimed permit never had a reservation");
}));

test("E3: time past the deadline never moves a CLAIMED permit, never changes its reservation, and writes no expiry event", () => withAttached(async ({ w, h, rec, time }) => {
  const r = request(rec, "e3");
  const p = await h.requestPermit(r);
  await fakeDriver(h).claim(p.permit_id, r);
  time.offset = WINDOW_MS + 60_000;
  await h.requestPermit(request(rec, "e3-other")); // a later transaction of the task
  await h.recover();
  const j = committedJournal(w, rec);
  assert.equal(j.state.permits[p.permit_id].state, "CLAIMED");
  assert.equal(j.state.permits[p.permit_id].claim_reservation, "OPEN");
  assert.deepEqual(expiredEntries(j, p.permit_id), [], "no false expiry event");
}));
