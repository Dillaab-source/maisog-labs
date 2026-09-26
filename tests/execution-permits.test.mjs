// S6 Execution Request / Permit / Report lifecycle tests (ML-DEVOS-RFC-019
// §13.1; AS90-F001..F003, AS91-F001, AS92-F001; D-071).
//
// A real public S5 createGateway() decides every shell.exec; the fake driver
// executes nothing. The only process started is fixture/internal Git.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { claim, release, renew } from "../devos/state/kernel.mjs";
import { argvDigest } from "../devos/execution/index.mjs";
import { FIXED_OPERATIONS, fakeDriver } from "./fixtures/execution/drivers.mjs";
import { POLICY_VERSION, cleanupWorld, gatewayFor, journalOf, makeWorld, policyFor, taskLockPath } from "./fixtures/execution/harness.mjs";

const codeOf = async (p) => {
  try {
    await p;
  } catch (e) {
    return e.code ?? `UNCODED:${e.message}`;
  }
  return "NO_ERROR";
};

const ARGV = [...FIXED_OPERATIONS.WRITE_FEATURE.argv];
const req = (rec, over = {}) => ({ instance_id: rec.instance_id, request_id: "req-1", argv: [...ARGV], checkpoint_revision: rec.checkpoint.current_revision, ...over });

async function attachedWorld(opts = {}) {
  const w = await makeWorld(opts);
  const h = w.host(opts.hostOver ?? {});
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  return { w, h, rec };
}

function journalTypes(w, rec) {
  return journalOf(w, rec).map((e) => e.type);
}

test("exact replay returns the same permit without an S5 call; conflicting replay fails; one request -> one permit", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const first = await h.requestPermit(req(rec));
    assert.equal(first.replay, false);
    assert.equal(first.state, "ISSUED");
    assert.equal(first.permit.argv_digest, argvDigest(ARGV));
    assert.equal(first.permit.single_use, true);
    const callsBefore = w.builderTrust.state.calls;
    const again = await h.requestPermit(req(rec));
    assert.equal(again.replay, true);
    assert.equal(again.permit_id, first.permit_id);
    assert.equal(w.builderTrust.state.calls, callsBefore, "an exact replay makes no S5 call");
    assert.equal(await codeOf(h.requestPermit(req(rec, { argv: [...FIXED_OPERATIONS.WRITE_SECOND.argv] }))), "MALFORMED_REQUEST");
    assert.equal(h.inspect.listPermits(w.taskId).length, 1);
    // A non-current checkpoint is refused before S5 is consulted.
    assert.equal(await codeOf(h.requestPermit(req(rec, { request_id: "req-2", checkpoint_revision: rec.checkpoint.current_revision + 1 }))), "FENCING_REVISION_MISMATCH");
    // Malformed requests (unknown field, empty argv, bad id) fail closed.
    assert.equal(await codeOf(h.requestPermit({ ...req(rec, { request_id: "req-3" }), shell: true })), "MALFORMED_REQUEST");
    assert.equal(await codeOf(h.requestPermit(req(rec, { request_id: "req-4", argv: [] }))), "MALFORMED_REQUEST");
    assert.equal(await codeOf(h.requestPermit(req(rec, { request_id: "bad id" }))), "MALFORMED_REQUEST");
  } finally {
    cleanupWorld(w);
  }
});

test("concurrent identical requests mint at most one permit (in-process race; losers replay or fail closed)", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => h.requestPermit(req(rec, { request_id: "race" }))));
    const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const bad = results.filter((r) => r.status === "rejected").map((r) => r.reason.code);
    assert.ok(ok.length >= 1);
    assert.equal(new Set(ok.map((r) => r.permit_id)).size, 1, "every successful caller sees the same permit");
    assert.ok(bad.every((c) => c === "ISOLATION_UNPROVABLE"), `losers fail closed: ${bad}`);
    assert.equal(h.inspect.listPermits(w.taskId).length, 1);
  } finally {
    cleanupWorld(w);
  }
});

test("an ISSUED permit expires unclaimed; a CLAIMED permit never becomes safe by expiry (AS90-F001)", async () => {
  let offset = 0;
  const { w, h, rec } = await attachedWorld({ hostOver: { clock: () => Date.now() + offset, claimWindowMs: 1000 } });
  try {
    const d = fakeDriver(h);
    const a = await h.requestPermit(req(rec, { request_id: "exp-a" }));
    offset = 2000;
    assert.equal(await codeOf(d.claim(a.permit_id, req(rec, { request_id: "exp-a" }))), "ISOLATION_UNPROVABLE");
    assert.equal(h.inspect.getPermitStatus(w.taskId, a.permit_id).state, "EXPIRED_UNCLAIMED");
    const b = await h.requestPermit(req(rec, { request_id: "exp-b" }));
    await d.claim(b.permit_id, req(rec, { request_id: "exp-b" }));
    offset = 10 * 60 * 1000 - 1000; // far past the claim window, inside the S4 lease
    assert.equal(await codeOf(h.quiesce(rec.instance_id)), "QUIESCE_UNPROVEN");
    assert.equal(h.inspect.getPermitStatus(w.taskId, b.permit_id).state, "CLAIMED", "time never moves a claimed permit");
    await d.report(b.permit, req(rec, { request_id: "exp-b" }));
    assert.equal((await h.quiesce(rec.instance_id)).state, "QUIESCED");
  } finally {
    cleanupWorld(w);
  }
});

test("single use: replay-then-claim claims once; argv or request_id mismatch at claim fails closed", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const d = fakeDriver(h);
    const p = await h.requestPermit(req(rec));
    const replayed = await h.requestPermit(req(rec));
    assert.equal(await codeOf(d.claim(replayed.permit_id, req(rec, { argv: ["s6-fixture", "write", "src/other.txt"] }))), "ISOLATION_UNPROVABLE");
    assert.equal(await codeOf(d.claim(replayed.permit_id, req(rec, { request_id: "someone-else" }))), "ISOLATION_UNPROVABLE");
    const claimed = await d.claim(replayed.permit_id, req(rec));
    assert.equal(claimed.permit.permit_id, p.permit_id);
    assert.equal(claimed.cwd, path.join(w.dirs.workspace, "Dillaab-source__maisog-labs", w.taskId, rec.instance_id, "repo"));
    assert.equal(await codeOf(d.claim(p.permit_id, req(rec))), "ISOLATION_UNPROVABLE", "a permit is claimable once");
    // A replay after the claim returns the stored permit, never a fresh one.
    const later = await h.requestPermit(req(rec));
    assert.equal(later.permit_id, p.permit_id);
    assert.equal(later.state, "CLAIMED");
  } finally {
    cleanupWorld(w);
  }
});

test("claim-time S5 recheck honours live revocation and trusted-source failure; the permit is invalidated (AS91-F001)", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const d = fakeDriver(h);
    const a = await h.requestPermit(req(rec, { request_id: "rv" }));
    w.builderTrust.state.revoked = ["S6-B-EXEC"];
    assert.equal(await codeOf(d.claim(a.permit_id, req(rec, { request_id: "rv" }))), "CAPABILITY_DENIED");
    const s = h.inspect.getPermitStatus(w.taskId, a.permit_id);
    assert.equal(s.state, "REVOKED");
    assert.equal(s.revocation_reason, "CAPABILITY_INVALIDATED");
    assert.equal(await codeOf(d.claim(a.permit_id, req(rec, { request_id: "rv" }))), "ISOLATION_UNPROVABLE");
    w.builderTrust.state.revoked = [];
    // Revoked at issuance -> no permit at all.
    w.builderTrust.state.revoked = ["S6-B-EXEC"];
    assert.equal(await codeOf(h.requestPermit(req(rec, { request_id: "rv2" }))), "CAPABILITY_DENIED");
    w.builderTrust.state.revoked = [];
    for (const src of ["revocations", "clock", "identity"]) {
      const p = await h.requestPermit(req(rec, { request_id: `ts-${src}` }));
      w.builderTrust.state.failSource = src;
      assert.equal(await codeOf(d.claim(p.permit_id, req(rec, { request_id: `ts-${src}` }))), "CAPABILITY_DENIED", src);
      w.builderTrust.state.failSource = null;
      assert.equal(h.inspect.getPermitStatus(w.taskId, p.permit_id).revocation_reason, "CAPABILITY_INVALIDATED");
    }
    assert.ok(journalTypes(w, rec).includes("CLAIM_S5_CHECK"));
  } finally {
    cleanupWorld(w);
  }
});

test("claim-time S5 recheck honours descriptor expiry and policy supersession under the pinned version", async () => {
  const w = await makeWorld();
  try {
    const root = fs.realpathSync(w.dirs.workspace);
    const expiring = [policyFor(root, { expiry: "2026-09-24T13:00:00Z" })];
    const h = w.host({ gateway: gatewayFor(w.dirs.workspace, w.builderTrust, { policies: expiring }) });
    const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
    await h.attach(rec.instance_id, { actorId: w.builder });
    const d = fakeDriver(h);
    const a = await h.requestPermit(req(rec, { request_id: "ex" }));
    w.builderTrust.state.nowIso = "2026-09-24T14:00:00Z";
    assert.equal(await codeOf(d.claim(a.permit_id, req(rec, { request_id: "ex" }))), "CAPABILITY_DENIED");
    w.builderTrust.state.nowIso = "2026-09-24T12:00:00Z";
    // Supersession: a restarted host whose gateway carries only a newer policy
    // version. The permit pins s6-test.1, so the claim finds no decision.
    const b = await h.requestPermit(req(rec, { request_id: "sup" }));
    const superseded = w.host({ gateway: gatewayFor(w.dirs.workspace, w.builderTrust, { policies: [policyFor(root, { version: "s6-test.2" })] }) });
    assert.equal(b.permit.s5_request_intent.policy_version, POLICY_VERSION);
    assert.equal(await codeOf(fakeDriver(superseded).claim(b.permit_id, req(rec, { request_id: "sup" }))), "CAPABILITY_DENIED");
    assert.equal(h.inspect.getPermitStatus(w.taskId, b.permit_id).revocation_reason, "CAPABILITY_INVALIDATED");
  } finally {
    cleanupWorld(w);
  }
});

test("S5 subject must be the S4 owner in the mapped role, at issuance and at claim (AS92-F001)", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const d = fakeDriver(h);
    const t = w.builderTrust.state;
    t.actorId = "intruder";
    assert.equal(await codeOf(h.requestPermit(req(rec, { request_id: "s1" }))), "CAPABILITY_DENIED");
    t.actorId = w.builder;
    t.actorRole = "QA"; // QA descriptors also allow shell.exec: the ALLOW is real, the role is wrong
    assert.equal(await codeOf(h.requestPermit(req(rec, { request_id: "s2" }))), "CAPABILITY_DENIED");
    t.actorRole = "Builder";
    const p = await h.requestPermit(req(rec, { request_id: "s3" }));
    assert.deepEqual(p.permit.s5_subject_binding, { actor_id: w.builder, actor_role: "Builder" });
    // Drift between issuance and claim.
    t.actorId = "builder-2";
    assert.equal(await codeOf(d.claim(p.permit_id, req(rec, { request_id: "s3" }))), "CAPABILITY_DENIED");
    t.actorId = w.builder;
    const q = await h.requestPermit(req(rec, { request_id: "s4" }));
    t.actorRole = "QA";
    assert.equal(await codeOf(d.claim(q.permit_id, req(rec, { request_id: "s4" }))), "CAPABILITY_DENIED");
    t.actorRole = "Builder";
    const r = await h.requestPermit(req(rec, { request_id: "s5" }));
    assert.equal((await d.claim(r.permit_id, req(rec, { request_id: "s5" }))).permit.permit_id, r.permit_id);
  } finally {
    cleanupWorld(w);
  }
});

test("a substituted or forged S5 ALLOW never mints or claims a permit (AS90-F003)", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const good = await h.requestPermit(req(rec, { request_id: "genuine" }));
    const presented = (over = {}) => ({
      request_intent: { ...good.permit.s5_request_intent, ...(over.intent ?? {}) },
      subject_context: { actor_role: "Builder", actor_id: w.builder, credential_class: null, credential_available: false, attestation_ref: "x", ...(over.subject ?? {}) },
      evaluation_context: {},
    });
    const allow = { outcome: "ALLOW", denial_reason: null, descriptor_id: "S6-B-EXEC", policy_version: POLICY_VERSION, non_authority_disclaimer: "x" };
    const forged = (result) => w.host({ gateway: { shell: { request: () => result } } });
    const cases = {
      "no presentation": { decision: allow },
      "other resource": { decision: allow, presented: presented({ intent: { resource: "/elsewhere/repo" } }) },
      "other project": { decision: allow, presented: presented({ intent: { project: "someone/else" } }) },
      "extra axis": { decision: allow, presented: { ...presented(), request_intent: { ...presented().request_intent, argv: "rm -rf /" } } },
      "other subject": { decision: allow, presented: presented({ subject: { actor_id: "intruder" } }) },
      "version skew": { decision: { ...allow, policy_version: "s6-test.9" }, presented: presented() },
      "deny": { decision: { ...allow, outcome: "DENY", denial_reason: "NO_MATCH" }, presented: presented() },
    };
    for (const [name, result] of Object.entries(cases)) {
      assert.equal(await codeOf(forged(result).requestPermit(req(rec, { request_id: `f-${name.replaceAll(" ", "-")}` }))), "CAPABILITY_DENIED", name);
    }
    // At claim: a descriptor different from the one bound at issuance.
    const swapped = forged({ decision: { ...allow, descriptor_id: "S6-Q-EXEC" }, presented: presented() });
    assert.equal(await codeOf(fakeDriver(swapped).claim(good.permit_id, req(rec, { request_id: "genuine" }))), "CAPABILITY_DENIED");
    assert.equal(h.inspect.listPermits(w.taskId).length, 1, "no forged decision minted a permit");
  } finally {
    cleanupWorld(w);
  }
});

test("claim re-checks S4 fencing: a checkpoint the instance never adopted fails the claim", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const p = await h.requestPermit(req(rec));
    await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
    assert.equal(await codeOf(fakeDriver(h).claim(p.permit_id, req(rec))), "FENCING_REVISION_MISMATCH");
  } finally {
    cleanupWorld(w);
  }
});

test("reports must match a CLAIMED permit exactly; a late report after quarantine is evidence only", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const d = fakeDriver(h);
    const issued = await h.requestPermit(req(rec, { request_id: "rep-0" }));
    assert.equal(await codeOf(d.report(issued.permit, req(rec, { request_id: "rep-0" }))), "ISOLATION_UNPROVABLE", "no report for an unclaimed permit");
    const p = await h.requestPermit(req(rec, { request_id: "rep-1" }));
    await d.claim(p.permit_id, req(rec, { request_id: "rep-1" }));
    const r = req(rec, { request_id: "rep-1" });
    assert.equal(await codeOf(d.report(p.permit, r, { argv_digest: "f".repeat(64) })), "ISOLATION_UNPROVABLE");
    assert.equal(await codeOf(d.report(p.permit, r, { environment_digest: "f".repeat(64) })), "ISOLATION_UNPROVABLE");
    assert.equal(await codeOf(d.report(p.permit, r, { process_groups: [1] })), "ISOLATION_UNPROVABLE");
    assert.equal(await codeOf(d.report(p.permit, r, { argv: ARGV })), "ISOLATION_UNPROVABLE", "reports carry digests, never argv");
    assert.deepEqual(await d.report(p.permit, r), { recorded: true, quarantined: false });
    assert.equal(await codeOf(d.report(p.permit, r)), "ISOLATION_UNPROVABLE", "one report per permit");

    // Claimed, then the host "crashes" before any report: recovery quarantines.
    const c = await h.requestPermit(req(rec, { request_id: "crash" }));
    await d.claim(c.permit_id, req(rec, { request_id: "crash" }));
    const restarted = w.host();
    const out = await restarted.recover();
    assert.deepEqual(out.quarantined, [rec.instance_id]);
    const q = restarted.inspect.findInstance(rec.instance_id);
    assert.equal(q.state, "QUARANTINED");
    assert.equal(q.quarantine_reason, "QUIESCE_UNPROVEN");
    assert.deepEqual(await fakeDriver(restarted).report(c.permit, req(rec, { request_id: "crash" })), { recorded: true, quarantined: true });
    assert.equal(restarted.inspect.findInstance(rec.instance_id).state, "QUARANTINED", "a late report never un-quarantines");
    assert.ok(journalTypes(w, rec).includes("LATE_REPORT"));
    assert.equal((await restarted.validateInstance(rec.instance_id)).reason, "INSTANCE_STALE");
  } finally {
    cleanupWorld(w);
  }
});

test("an unexplained change (no permit, no report) is DIRTY_WORKTREE; a reported change is accepted", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const repo = path.join(w.dirs.workspace, "Dillaab-source__maisog-labs", w.taskId, rec.instance_id, "repo");
    const d = fakeDriver(h);
    const p = await h.requestPermit(req(rec, { request_id: "explained" }));
    const claimed = await d.claim(p.permit_id, req(rec, { request_id: "explained" }));
    fs.writeFileSync(path.join(claimed.cwd, "src", "explained.txt"), "ok\n");
    await d.report(p.permit, req(rec, { request_id: "explained" }));
    assert.equal((await h.validateInstance(rec.instance_id)).outcome, "PROVEN");
    fs.writeFileSync(path.join(repo, "src", "unexplained.txt"), "sneaky\n");
    const v = await h.validateInstance(rec.instance_id);
    assert.equal(v.outcome, "FAILED");
    assert.equal(v.reason, "DIRTY_WORKTREE");
    assert.equal(await codeOf(h.requestPermit(req(rec, { request_id: "after-dirty" }))), "DIRTY_WORKTREE");
  } finally {
    cleanupWorld(w);
  }
});

test("permits are issued only to an ATTACHED instance; quiesce revokes ISSUED permits (QUIESCE)", async () => {
  const w = await makeWorld();
  try {
    const h = w.host();
    const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
    assert.equal(await codeOf(h.requestPermit(req(rec))), "INSTANCE_STALE");
    assert.equal(await codeOf(h.attach(rec.instance_id, { actorId: "not-the-owner" })), "OWNER_MISMATCH");
    await h.attach(rec.instance_id, { actorId: w.builder });
    const p = await h.requestPermit(req(rec));
    await h.quiesce(rec.instance_id);
    const s = h.inspect.getPermitStatus(w.taskId, p.permit_id);
    assert.equal(s.state, "REVOKED");
    assert.equal(s.revocation_reason, "QUIESCE");
    assert.equal(await codeOf(fakeDriver(h).claim(p.permit_id, req(rec))), "ISOLATION_UNPROVABLE");
  } finally {
    cleanupWorld(w);
  }
});

test("a verified report is stored and journaled with every RFC-019 field; a rejected report changes nothing (AS94-F004)", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const d = fakeDriver(h);
    const r = req(rec, { request_id: "full" });
    const p = await h.requestPermit(r);
    await d.claim(p.permit_id, r);
    // Contradictory / incomplete reports are refused and the permit stays CLAIMED.
    for (const over of [{ ended_at: null }, { exit_code: null }, { signal: "SIGKILL" }, { started_at: "2026-09-24T12:00:03Z" }, { stdout_digest: "nope" }]) {
      assert.equal(await codeOf(d.report(p.permit, r, over)), "ISOLATION_UNPROVABLE", JSON.stringify(over));
      assert.equal(h.inspect.getPermitStatus(w.taskId, p.permit_id).state, "CLAIMED");
    }
    const partial = d.reportFor(p.permit, r);
    delete partial.started_at;
    assert.equal(await codeOf(h.recordReport(partial)), "ISOLATION_UNPROVABLE", "a report missing started_at");
    assert.equal(await codeOf(h.quiesce(rec.instance_id)), "QUIESCE_UNPROVEN", "no verified report yet");
    const full = d.reportFor(p.permit, r, { exit_code: null, signal: "SIGTERM" });
    await h.recordReport(full);
    const stored = h.inspect.getPermitStatus(w.taskId, p.permit_id);
    assert.equal(stored.state, "REPORTED");
    for (const k of ["argv_digest", "environment_digest", "process_groups", "started_at", "ended_at", "exit_code", "signal", "stdout_digest", "stderr_digest", "terminated"]) {
      assert.deepEqual(stored.report[k], full[k], `stored ${k}`);
    }
    const entry = journalOf(w, rec).find((e) => e.type === "REPORT");
    for (const k of ["started_at", "ended_at", "exit_code", "signal", "stdout_digest", "stderr_digest", "report_digest"]) assert.ok(Object.hasOwn(entry.data, k), `journaled ${k}`);
    assert.equal(entry.data.signal, "SIGTERM");
    assert.equal(entry.data.report_digest, stored.report.report_digest);
    assert.equal(h.provenance(rec.instance_id).execution_reports[0].started_at, full.started_at);
    assert.equal((await h.quiesce(rec.instance_id)).state, "QUIESCED");
  } finally {
    cleanupWorld(w);
  }
});

// ---------------------------------------------------------------- AS94-F001
// Deterministic claim races: another S6 operation holds the per-task lock
// while S4 or S5 changes; the claim is provably waiting on that lock when the
// change happens. The stale earlier view must never become CLAIMED.
const lockPath = (w) => taskLockPath(w);

async function claimWhileLockHeld(w, h, rec, rid, mutate) {
  const d = fakeDriver(h);
  const r = req(rec, { request_id: rid });
  const p = await h.requestPermit(r);
  fs.writeFileSync(lockPath(w), ""); // another S6 operation holds the task lock
  let settled = false;
  const pending = d.claim(p.permit_id, r).finally(() => { settled = true; });
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(settled, false, "the claim is waiting on the S6 task lock");
  await mutate();
  fs.rmSync(lockPath(w));
  return { p, code: await codeOf(pending) };
}

test("claim race: S4 revision moves while the claim waits on the task lock -> never CLAIMED, permit revoked STALE (AS94-F001)", async () => {
  const { w, h, rec } = await attachedWorld({ hostOver: { lockWaitMs: 5000 } });
  try {
    const { p, code } = await claimWhileLockHeld(w, h, rec, "race-s4", () => renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 }));
    assert.equal(code, "FENCING_REVISION_MISMATCH");
    const s = h.inspect.getPermitStatus(w.taskId, p.permit_id);
    assert.equal(s.state, "REVOKED");
    assert.equal(s.revocation_reason, "STALE");
    assert.ok(!journalTypes(w, rec).includes("PERMIT_CLAIMED"));
  } finally {
    cleanupWorld(w);
  }
});

test("claim race: S4 ownership changes while the claim waits -> never CLAIMED (AS94-F001)", async () => {
  const { w, h, rec } = await attachedWorld({ hostOver: { lockWaitMs: 5000 } });
  try {
    const { p, code } = await claimWhileLockHeld(w, h, rec, "race-owner", async () => {
      const released = await release({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision });
      assert.ok(released, "the builder released the task");
      await claim({ dir: w.dirs.s4, taskId: w.taskId, actorId: "builder-2", leaseDurationMs: 600000 });
    });
    assert.equal(code, "OWNER_MISMATCH");
    assert.notEqual(h.inspect.getPermitStatus(w.taskId, p.permit_id).state, "CLAIMED");
  } finally {
    cleanupWorld(w);
  }
});

test("claim race: S4 lease expires while the claim waits -> LEASE_EXPIRED, never CLAIMED (AS94-F001)", async () => {
  let offset = 0;
  const { w, h, rec } = await attachedWorld({ hostOver: { lockWaitMs: 5000, claimWindowMs: 24 * 3600 * 1000, clock: () => Date.now() + offset } });
  try {
    const { p, code } = await claimWhileLockHeld(w, h, rec, "race-lease", () => {
      offset = 3600 * 1000; // the host's trusted clock passes the S4 lease expiry
    });
    assert.equal(code, "LEASE_EXPIRED");
    assert.equal(h.inspect.getPermitStatus(w.taskId, p.permit_id).state, "REVOKED");
  } finally {
    cleanupWorld(w);
  }
});

test("claim race: live S5 revocation lands while the claim waits -> never CLAIMED, CAPABILITY_INVALIDATED (AS94-F001)", async () => {
  const { w, h, rec } = await attachedWorld({ hostOver: { lockWaitMs: 5000 } });
  try {
    const { p, code } = await claimWhileLockHeld(w, h, rec, "race-s5", () => {
      w.builderTrust.state.revoked = ["S6-B-EXEC"];
    });
    assert.equal(code, "CAPABILITY_DENIED");
    const s = h.inspect.getPermitStatus(w.taskId, p.permit_id);
    assert.equal(s.state, "REVOKED");
    assert.equal(s.revocation_reason, "CAPABILITY_INVALIDATED");
  } finally {
    cleanupWorld(w);
  }
});

test("claim race: S5 descriptor expiry passes while the claim waits -> never CLAIMED (AS94-F001)", async () => {
  const w = await makeWorld();
  try {
    const root = fs.realpathSync(w.dirs.workspace);
    const h = w.host({ lockWaitMs: 5000, gateway: gatewayFor(w.dirs.workspace, w.builderTrust, { policies: [policyFor(root, { expiry: "2026-09-24T13:00:00Z" })] }) });
    const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
    await h.attach(rec.instance_id, { actorId: w.builder });
    const { p, code } = await claimWhileLockHeld(w, h, rec, "race-expiry", () => {
      w.builderTrust.state.nowIso = "2026-09-24T14:00:00Z";
    });
    assert.equal(code, "CAPABILITY_DENIED");
    assert.equal(h.inspect.getPermitStatus(w.taskId, p.permit_id).revocation_reason, "CAPABILITY_INVALIDATED");
  } finally {
    cleanupWorld(w);
  }
});

test("claim race control: with no change during the wait the claim succeeds after the lock is released; a lock never released fails closed and the permit stays ISSUED", async () => {
  const { w, h, rec } = await attachedWorld({ hostOver: { lockWaitMs: 5000 } });
  try {
    const { p, code } = await claimWhileLockHeld(w, h, rec, "race-none", () => undefined);
    assert.equal(code, "NO_ERROR");
    assert.equal(h.inspect.getPermitStatus(w.taskId, p.permit_id).state, "CLAIMED");
    const short = w.host({ lockWaitMs: 200 });
    const r = req(rec, { request_id: "never-released" });
    const q = await short.requestPermit(r);
    fs.writeFileSync(lockPath(w), "");
    assert.equal(await codeOf(fakeDriver(short).claim(q.permit_id, r)), "ISOLATION_UNPROVABLE");
    assert.ok(fs.existsSync(lockPath(w)), "the lock is never stolen");
    fs.rmSync(lockPath(w));
    assert.equal(short.inspect.getPermitStatus(w.taskId, q.permit_id).state, "ISSUED");
  } finally {
    cleanupWorld(w);
  }
});

test("a permit pinned to an older checkpoint cannot be claimed after renewal adoption (AS94-F001)", async () => {
  const { w, h, rec } = await attachedWorld();
  try {
    const r = req(rec, { request_id: "old-rev" });
    const p = await h.requestPermit(r);
    const r1 = await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
    await h.adoptRenewal(rec.instance_id, { result: r1 });
    assert.equal(await codeOf(fakeDriver(h).claim(p.permit_id, r)), "FENCING_REVISION_MISMATCH");
    assert.equal(h.inspect.getPermitStatus(w.taskId, p.permit_id).revocation_reason, "STALE");
  } finally {
    cleanupWorld(w);
  }
});
