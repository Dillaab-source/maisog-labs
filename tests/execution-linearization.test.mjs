// S6 lifecycle linearization tests (ML-DEVOS-RFC-019 §8, §13.1, §15;
// AS95-F001, AS95-F002; D-071).
//
// Every competing permit/instance mutation runs under the one per-task S6
// lock. These tests interleave operations deterministically: a test hook that
// runs while one operation HOLDS the lock starts a competing operation, which
// must wait (lockWaitMs) and then act on freshly re-read state. The registry's
// version compare-and-set and transition tables are exercised directly too.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { claim, release, renew } from "../devos/state/kernel.mjs";
import { FIXED_OPERATIONS, fakeDriver } from "./fixtures/execution/drivers.mjs";
import { cleanupWorld, journalOf, makeWorld, taskLockPath } from "./fixtures/execution/harness.mjs";

const codeOf = async (p) => {
  try {
    await p;
  } catch (e) {
    return e.code ?? `UNCODED:${e.message}`;
  }
  return "NO_ERROR";
};
const ARGV = [...FIXED_OPERATIONS.WRITE_FEATURE.argv];
const req = (rec, rid) => ({ instance_id: rec.instance_id, request_id: rid, argv: [...ARGV], checkpoint_revision: rec.checkpoint.current_revision });
const journal = (w, rec) => journalOf(w, rec);
const types = (w, rec) => journal(w, rec).map((e) => e.type);

// A host whose hook, on reaching `at` (inside that operation's locked
// section), starts `competitor()` once. The competitor's promise is exposed.
function interleave(w, at, extra = {}) {
  const box = { competitor: null, started: null, fired: false, lockHeldAtStart: null };
  const host = w.host({
    lockWaitMs: 5000,
    ...extra,
    faults: {
      onStep: (name) => {
        if (name === at && box.competitor && !box.fired) {
          box.fired = true;
          // Proof the competitor starts while the S6 task lock is really held.
          box.lockHeldAtStart = fs.existsSync(taskLockPath(w));
          box.started = box.competitor().then(() => "NO_ERROR", (e) => e.code ?? `UNCODED:${e.message}`);
        }
      },
    },
  });
  return { host, box };
}

async function attachedWith(w, host) {
  const rec = await host.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await host.attach(rec.instance_id, { actorId: w.builder });
  return rec;
}

async function withWorld(fn) {
  const w = await makeWorld();
  try {
    return await fn(w);
  } finally {
    cleanupWorld(w);
  }
}

// ---------------------------------------------------------------- claim vs quiesce
test("claim holds the lock, quiesce competes: claim wins, quiesce then fails QUIESCE_UNPROVEN; the permit stays CLAIMED (AS95-F001)", () => withWorld(async (w) => {
  const { host, box } = interleave(w, "claim-locked");
  const rec = await attachedWith(w, host);
  const r = req(rec, "cq-1");
  const p = await host.requestPermit(r);
  box.competitor = () => host.quiesce(rec.instance_id);
  const claimed = await codeOf(host.claimPermit({ permitId: p.permit_id, request: r }));
  assert.equal(claimed, "NO_ERROR");
  assert.equal(await box.started, "QUIESCE_UNPROVEN");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  assert.equal(host.inspect.getPermitStatus(w.taskId, p.permit_id).state, "CLAIMED");
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "ATTACHED");
}));

test("quiesce holds the lock, claim competes: quiesce revokes first, the claim then fails; REVOKED is never resurrected to CLAIMED (AS95-F001)", () => withWorld(async (w) => {
  const { host, box } = interleave(w, "quiesce-locked");
  const rec = await attachedWith(w, host);
  const r = req(rec, "qc-1");
  const p = await host.requestPermit(r);
  box.competitor = () => host.claimPermit({ permitId: p.permit_id, request: r });
  const q = await host.quiesce(rec.instance_id);
  assert.equal(q.state, "QUIESCED");
  assert.equal(await box.started, "ISOLATION_UNPROVABLE");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  const s = host.inspect.getPermitStatus(w.taskId, p.permit_id);
  assert.equal(s.state, "REVOKED");
  assert.equal(s.revocation_reason, "QUIESCE");
  assert.ok(!types(w, rec).includes("PERMIT_CLAIMED"));
}));

test("with no lock wait, simultaneous claim and quiesce serialize by failing closed (lock held), never by interleaving", () => withWorld(async (w) => {
  const { host, box } = interleave(w, "claim-locked", { lockWaitMs: 0 });
  const rec = await attachedWith(w, host);
  const r = req(rec, "nowait");
  const p = await host.requestPermit(r);
  box.competitor = () => host.quiesce(rec.instance_id);
  assert.equal(await codeOf(host.claimPermit({ permitId: p.permit_id, request: r })), "NO_ERROR");
  assert.equal(await box.started, "ISOLATION_UNPROVABLE", "the competitor found the lock held and failed closed");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "ATTACHED");
}));

// ---------------------------------------------------------------- claim vs expiry / replay
test("expiry at the claim deadline: replay reads EXPIRED without writing; the locked claim persists EXPIRED; a clock step back cannot revive it (AS95-F001)", () => withWorld(async (w) => {
  let offset = 0;
  const host = w.host({ clock: () => Date.now() + offset, claimWindowMs: 60 * 1000 });
  const rec = await attachedWith(w, host);
  const r = req(rec, "exp-1");
  const p = await host.requestPermit(r);
  offset = 61 * 1000;
  const replay = await host.requestPermit(r);
  assert.equal(replay.state, "EXPIRED_UNCLAIMED", "a replay past the deadline reads as expired");
  assert.equal(host.inspect.getPermitStatus(w.taskId, p.permit_id).state, "ISSUED", "a read path never writes permit state");
  assert.equal(await codeOf(host.claimPermit({ permitId: p.permit_id, request: r })), "ISOLATION_UNPROVABLE");
  assert.equal(host.inspect.getPermitStatus(w.taskId, p.permit_id).state, "EXPIRED_UNCLAIMED", "the locked claim persisted the expiry");
  offset = 0;
  assert.equal(await codeOf(host.claimPermit({ permitId: p.permit_id, request: r })), "ISOLATION_UNPROVABLE", "terminal: a clock step back cannot revive it");
  // Claimed just before the deadline: time never moves a CLAIMED permit.
  const r2 = req(rec, "exp-2");
  const p2 = await host.requestPermit(r2);
  offset = 59 * 1000;
  await host.claimPermit({ permitId: p2.permit_id, request: r2 });
  offset = 10 * 60 * 1000 - 1000;
  assert.equal((await host.requestPermit(r2)).state, "CLAIMED");
}));

// ---------------------------------------------------------------- claim vs quarantine / recovery
test("claim holds the lock, recovery competes: recovery then quarantines on the CLAIMED permit; the claim is not undone (AS95-F001)", () => withWorld(async (w) => {
  const { host, box } = interleave(w, "claim-locked");
  const rec = await attachedWith(w, host);
  const r = req(rec, "cr-1");
  const p = await host.requestPermit(r);
  box.competitor = () => w.host({ lockWaitMs: 5000 }).recover();
  assert.equal(await codeOf(host.claimPermit({ permitId: p.permit_id, request: r })), "NO_ERROR");
  assert.equal(await box.started, "NO_ERROR");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  const inst = host.inspect.findInstance(rec.instance_id);
  assert.equal(inst.state, "QUARANTINED");
  assert.equal(inst.quarantine_reason, "QUIESCE_UNPROVEN");
  assert.equal(host.inspect.getPermitStatus(w.taskId, p.permit_id).state, "CLAIMED");
}));

test("recovery holds the lock and quarantines a stale instance, claim competes: the revoked permit is never claimed (AS95-F001)", () => withWorld(async (w) => {
  const base = w.host({ lockWaitMs: 5000 });
  const rec = await attachedWith(w, base);
  const r = req(rec, "rc-1");
  const p = await base.requestPermit(r);
  await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
  const { host: recovering, box } = interleave(w, "recover-locked");
  box.competitor = () => base.claimPermit({ permitId: p.permit_id, request: r });
  const report = await recovering.recover();
  assert.deepEqual(report.stale, [rec.instance_id]);
  assert.equal(await box.started, "ISOLATION_UNPROVABLE");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  const s = base.inspect.getPermitStatus(w.taskId, p.permit_id);
  assert.equal(s.state, "REVOKED");
  assert.equal(s.revocation_reason, "QUARANTINE");
  assert.equal(base.inspect.findInstance(rec.instance_id).state, "QUARANTINED");
}));

// ---------------------------------------------------------------- report vs quarantine / recovery
test("recovery holds the lock and quarantines, a report competes: the report is late evidence only; QUARANTINED stands (AS95-F001)", () => withWorld(async (w) => {
  const base = w.host({ lockWaitMs: 5000 });
  const rec = await attachedWith(w, base);
  const d = fakeDriver(base);
  const r = req(rec, "rq-1");
  const p = await base.requestPermit(r);
  await d.claim(p.permit_id, r);
  const before = base.inspect.findInstance(rec.instance_id);
  const { host: recovering, box } = interleave(w, "recover-locked");
  box.competitor = () => d.report(p.permit, r, { process_groups: [424242], exit_code: null, signal: "SIGTERM" });
  await recovering.recover();
  assert.equal(await box.started, "NO_ERROR");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  const after = base.inspect.findInstance(rec.instance_id);
  assert.equal(after.state, "QUARANTINED");
  assert.equal(after.quarantine_reason, "QUIESCE_UNPROVEN");
  assert.deepEqual(after.reported_pgids, before.reported_pgids, "a late report never updates the quarantined record");
  assert.equal(base.inspect.getPermitStatus(w.taskId, p.permit_id).state, "REPORTED");
  assert.ok(types(w, rec).includes("LATE_REPORT"));
  assert.ok(!types(w, rec).includes("REPORT"));
}));

test("a report holds the lock, recovery competes: the report lands first, recovery then sees no uncertain permit and does not quarantine (AS95-F001)", () => withWorld(async (w) => {
  const { host, box } = interleave(w, "report-locked");
  const rec = await attachedWith(w, host);
  const d = fakeDriver(host);
  const r = req(rec, "rr-1");
  const p = await host.requestPermit(r);
  await d.claim(p.permit_id, r);
  box.competitor = () => w.host({ lockWaitMs: 5000 }).recover();
  assert.deepEqual(await d.report(p.permit, r), { recorded: true, quarantined: false });
  assert.equal(await box.started, "NO_ERROR");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "ATTACHED");
  assert.equal(host.inspect.getPermitStatus(w.taskId, p.permit_id).state, "REPORTED");
}));

// ---------------------------------------------------------------- quiesce vs report
test("a report holds the lock, quiesce competes: quiesce then succeeds on the reported state (AS95-F001)", () => withWorld(async (w) => {
  const { host, box } = interleave(w, "report-locked");
  const rec = await attachedWith(w, host);
  const d = fakeDriver(host);
  const r = req(rec, "rp-1");
  const p = await host.requestPermit(r);
  await d.claim(p.permit_id, r);
  box.competitor = () => host.quiesce(rec.instance_id);
  await d.report(p.permit, r);
  assert.equal(await box.started, "NO_ERROR");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "QUIESCED");
}));

test("quiesce holds the lock, a report competes: quiesce fails on the CLAIMED permit, then the report lands normally (AS95-F001)", () => withWorld(async (w) => {
  const { host, box } = interleave(w, "quiesce-locked");
  const rec = await attachedWith(w, host);
  const d = fakeDriver(host);
  const r = req(rec, "qp-1");
  const p = await host.requestPermit(r);
  await d.claim(p.permit_id, r);
  box.competitor = () => d.report(p.permit, r);
  assert.equal(await codeOf(host.quiesce(rec.instance_id)), "QUIESCE_UNPROVEN");
  assert.equal(await box.started, "NO_ERROR");
  assert.equal(box.lockHeldAtStart, true, "the competitor started while the lock was held");
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "ATTACHED");
  assert.equal(host.inspect.getPermitStatus(w.taskId, p.permit_id).state, "REPORTED");
  assert.equal((await host.quiesce(rec.instance_id)).state, "QUIESCED");
}));

// ---------------------------------------------------------------- task-store guards
// The task store is the only place S6 state is written (§13.2). A write built
// from a stale snapshot is refused by the version compare-and-set, and the
// transition tables refuse illegal or terminal-state-reversing changes, so no
// stale view can resurrect a terminal state (AS95-F001).
test("stale or illegal writes are refused by version CAS and transition tables; terminal states are monotonic (AS95-F001)", () => withWorld(async (w) => {
  const host = w.host();
  const rec = await attachedWith(w, host);
  const r = req(rec, "g-1");
  const p = await host.requestPermit(r);
  const staleVersion = host.inspect.version(w.taskId);
  const staleState = host.inspect.snapshot(w.taskId);
  await host.quiesce(rec.instance_id); // revokes the permit, QUIESCED
  // A snapshot taken before quiesce can never be committed over the newer state.
  await host.inspect.store.withLock(w.taskId, async () => {
    assert.throws(() => host.inspect.store.commit(w.taskId, staleVersion, staleState), (e) => e.code === "ISOLATION_UNPROVABLE" && /compare-and-set/.test(e.message));
  });
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "QUIESCED");
  assert.equal(host.inspect.getPermitStatus(w.taskId, p.permit_id).state, "REVOKED");
  // Even on the current state, the transition tables refuse illegal moves.
  const { setLife, setPermitState, setRtrStatus, closeClaimReservation, closeObligation } = await import("../devos/execution/state.mjs");
  const permit = host.inspect.getPermitStatus(w.taskId, p.permit_id);
  assert.throws(() => setPermitState(permit, "CLAIMED"), (e) => e.code === "ISOLATION_UNPROVABLE", "REVOKED -> CLAIMED");
  assert.throws(() => setPermitState({ state: "CLAIMED" }, "ISSUED"), (e) => e.code === "ISOLATION_UNPROVABLE", "history is never rewritten");
  assert.throws(() => setLife({ state: "QUARANTINED" }, "ATTACHED"), (e) => e.code === "ISOLATION_UNPROVABLE", "QUARANTINED only moves to CLEANED");
  assert.throws(() => setLife({ state: "CLEANED" }, "QUARANTINED"), (e) => e.code === "ISOLATION_UNPROVABLE");
  assert.throws(() => setLife({ state: "COMPLETED" }, "ATTACHED"), (e) => e.code === "ISOLATION_UNPROVABLE");
  assert.throws(() => setRtrStatus({ status: "ABORTED" }, "COMMITTED"), (e) => e.code === "ISOLATION_UNPROVABLE");
  // Closed execution-uncertainty reservations never reopen (§13.1, I2, I12).
  assert.throws(() => closeClaimReservation({ claim_reservation: "OPERATOR_RESOLVED" }, "SUPERSEDED_BY_REPORT"), (e) => e.code === "ISOLATION_UNPROVABLE");
  assert.throws(() => closeClaimReservation({ claim_reservation: "OPEN" }, "OPEN"), (e) => e.code === "ISOLATION_UNPROVABLE");
  assert.throws(() => closeObligation({ state: "PROOF_RESOLVED" }, "OPERATOR_RESOLVED"), (e) => e.code === "ISOLATION_UNPROVABLE");
  // COMPLETED can never go back to ATTACHED through the host either.
  await w.host().finishWithoutPublication(rec.instance_id);
  assert.equal(await codeOf(host.attach(rec.instance_id, { actorId: w.builder })), "INSTANCE_STALE");
  assert.equal(host.inspect.findInstance(rec.instance_id).state, "COMPLETED");
}));

// ---------------------------------------------------------------- AS95-F002 quiesce fencing
async function quiesceAfter(mutate, hostOver = {}) {
  return withWorld(async (w) => {
    const host = w.host(hostOver);
    const rec = await attachedWith(w, host);
    const r = req(rec, "qf-1");
    const p = await host.requestPermit(r);
    await mutate(w, rec, hostOver);
    const code = await codeOf(host.quiesce(rec.instance_id));
    const inst = host.inspect.findInstance(rec.instance_id);
    return {
      code, state: inst.state, stale: inst.stale, permit: host.inspect.getPermitStatus(w.taskId, p.permit_id).state,
      journal: types(w, rec),
    };
  });
}

test("quiesce after an S4 owner change fails OWNER_MISMATCH before touching anything (AS95-F002)", async () => {
  const out = await quiesceAfter(async (w, rec) => {
    await release({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision });
    await claim({ dir: w.dirs.s4, taskId: w.taskId, actorId: "builder-2", leaseDurationMs: 600000 });
  });
  assert.equal(out.code, "OWNER_MISMATCH");
  assert.equal(out.state, "ATTACHED", "not represented as quiesced");
  assert.equal(out.stale, true);
  assert.equal(out.permit, "ISSUED", "no revocation happened before the fencing check");
  assert.ok(out.journal.includes("QUIESCE_REFUSED"));
  assert.ok(!out.journal.includes("QUIESCE"));
});

test("quiesce after an S4 revision advance fails FENCING_REVISION_MISMATCH (AS95-F002)", async () => {
  const out = await quiesceAfter((w, rec) => renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 }));
  assert.equal(out.code, "FENCING_REVISION_MISMATCH");
  assert.equal(out.state, "ATTACHED");
  assert.equal(out.stale, true);
  assert.equal(out.permit, "ISSUED");
});

test("quiesce after S4 lease expiry fails LEASE_EXPIRED (AS95-F002)", async () => {
  const shared = { offset: 0 };
  const out = await quiesceAfter(() => {
    shared.offset = 3600 * 1000;
  }, { clock: () => Date.now() + shared.offset, claimWindowMs: 24 * 3600 * 1000 });
  assert.equal(out.code, "LEASE_EXPIRED");
  assert.equal(out.state, "ATTACHED");
  assert.equal(out.stale, false, "an expired lease alone is not stale; renewal is still possible");
  assert.equal(out.permit, "ISSUED");
});

test("quiesce after a real S4 role-state change (the owner published outside S6) fails closed (AS95-F002)", async () => {
  const out = await quiesceAfter(async (w, rec) => {
    await w.s4.transition({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, requesterRole: "BUILDER", expectedRevision: rec.checkpoint.current_revision, toState: "READY_FOR_QA", evidenceRef: { evidenceClass: "ACTOR_REPORTED", ref: "outside-s6" } });
  });
  assert.equal(out.code, "OWNER_MISMATCH", "READY_FOR_QA hands off: owner cleared and revision advanced");
  assert.equal(out.state, "ATTACHED");
  assert.equal(out.permit, "ISSUED");
});

test("quiesce with only the S4 role state changed (synthetic S4 record) fails INSTANCE_STALE (AS95-F002)", async () => {
  const out = await quiesceAfter((w) => {
    const f = path.join(w.dirs.s4, `${w.taskId}.json`);
    const record = JSON.parse(fs.readFileSync(f, "utf8"));
    record.state = "QA"; // owner, revision and lease untouched
    fs.writeFileSync(f, JSON.stringify(record, null, 2));
  });
  assert.equal(out.code, "INSTANCE_STALE");
  assert.equal(out.state, "ATTACHED");
  assert.equal(out.permit, "ISSUED");
});

// ---------------------------------------------------------------- source-level discipline
test("every S6 state write in the host goes through the one transaction wrapper (AS95-F001, §13.2)", () => {
  const src = fs.readFileSync(new URL("../devos/execution/host.mjs", import.meta.url), "utf8");
  // Exactly one place opens a task-store transaction, and it is tx().
  const opens = [...src.matchAll(/store\.transact\(/g)];
  assert.equal(opens.length, 1, "exactly one place opens a task-store transaction");
  assert.match(src.slice(src.lastIndexOf("function ", opens[0].index), opens[0].index), /^function tx\(/, "and it is tx()");
  // Nothing bypasses it: no raw commit, lock or envelope/journal file write.
  for (const forbidden of [/store\.commit\(/, /store\.withLock\(/, /\bRegistry\b/, /\bJournal\b/, /writeFileSync\(/, /appendFileSync\(/, /renameSync\(/]) {
    assert.doesNotMatch(src, forbidden, `host.mjs must not use ${forbidden}`);
  }
  // The journal, permit, RTR, slot and intent mutators only exist in state.mjs
  // and operate on a transaction draft (`st`).
  const state = fs.readFileSync(new URL("../devos/execution/state.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(state, /from "node:fs"/, "state.mjs never touches the filesystem");
});
