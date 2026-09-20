// ML-DEVOS-RFC-016 / ML-DEVOS-AS-065 / D-050 -- focused, store-backed tests
// for the S4 State Machine Kernel's public operations (devos/state/kernel.mjs).
// Uses a real temporary directory and real node:fs operations (no mocked
// filesystem) so the crash/corruption/orphaned-lock cases are genuine, not
// simulated in memory. Real multi-process concurrency lives in
// tests/state-concurrency.test.mjs -- these tests are single-process/
// sequential by design, exercising the kernel's logic rather than the OS-level
// mutex race itself.

import test from "node:test";
import assert from "node:assert/strict";
import { promises as fsp } from "node:fs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as kernel from "../devos/state/kernel.mjs";
import { TASK_POLICY } from "../devos/state/task-policy.mjs";
import { LockHeldError, CorruptRecordError, withTaskLock } from "../devos/state/store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function freshDir() {
  return fsp.mkdtemp(path.join(os.tmpdir(), "s4-kernel-test-"));
}

function evidence(evidenceClass) {
  return { ref: "opaque-nonexistent-ref-never-read-by-kernel", evidenceClass };
}

function decision(ref = "D-050") {
  return { ref };
}

test("full happy-path lifecycle through a handoff chain, evidence-guarded", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-HAPPY-001";

  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-1" });
  let s = await kernel.getState({ dir, taskId });
  assert.equal(s.state, "CREATED");
  assert.equal(s.revision, 0);

  const c1 = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 60_000, now: () => 1000 });
  assert.equal(c1.revision, 1);

  const t1 = await kernel.transition({
    dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: 1, toState: "PLANNING", now: () => 1000,
  });
  assert.equal(t1.state, "PLANNING");

  const t2 = await kernel.transition({
    dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: t1.revision, toState: "READY_FOR_BUILD", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 1000,
  });
  assert.equal(t2.owner, null, "READY_FOR_BUILD is itself a handoff destination -- ownership clears here too");

  // Whichever Builder actually does the work claims fresh from READY_FOR_BUILD.
  const c2 = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 60_000, now: () => 1000 });

  const t3 = await kernel.transition({
    dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: c2.revision, toState: "BUILDING", now: () => 1000,
  });

  const t4 = await kernel.transition({
    dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: t3.revision, toState: "READY_FOR_QA",
    evidenceRef: evidence("ACTOR_REPORTED"), now: () => 1000,
  });
  assert.equal(t4.state, "READY_FOR_QA");
  assert.equal(t4.owner, null, "handoff destination must clear ownership atomically");

  s = await kernel.getState({ dir, taskId });
  assert.equal(s.owner, null);
});

test("idempotent claim: identical retry replays; conflicting retry under the same key is rejected", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-IDEM-CLAIM";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-2" });

  const first = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 1000, idempotencyKey: "K1", now: () => 5000 });
  const replay = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 1000, idempotencyKey: "K1", now: () => 9999 });
  assert.deepEqual(replay, first, "identical retry must return the identical cached result, not re-apply");

  await assert.rejects(
    () => kernel.claim({ dir, taskId, actorId: "builder-2", leaseDurationMs: 1000, idempotencyKey: "K1", now: () => 9999 }),
    (err) => err.code === "IDEMPOTENCY_CONFLICT",
  );
});

test("idempotent renew and transition: replay returns cached result, conflicting reuse rejected", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-IDEM-RENEW-TRANSITION";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-3" });
  const c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 1000, now: () => 0 });

  const renew1 = await kernel.renew({ dir, taskId, actorId: "builder-1", expectedRevision: c.revision, newLeaseDurationMs: 2000, idempotencyKey: "RK1", now: () => 500 });
  const renewReplay = await kernel.renew({ dir, taskId, actorId: "builder-1", expectedRevision: c.revision, newLeaseDurationMs: 2000, idempotencyKey: "RK1", now: () => 999999 });
  assert.deepEqual(renewReplay, renew1);
  await assert.rejects(
    () => kernel.renew({ dir, taskId, actorId: "builder-1", expectedRevision: c.revision, newLeaseDurationMs: 999, idempotencyKey: "RK1", now: () => 500 }),
    (err) => err.code === "IDEMPOTENCY_CONFLICT",
  );

  const t1 = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: renew1.revision, toState: "PLANNING", idempotencyKey: "TK1", now: () => 0 });
  const tReplay = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: renew1.revision, toState: "PLANNING", idempotencyKey: "TK1", now: () => 0 });
  assert.deepEqual(tReplay, t1, "identical transition retry must not re-apply (revision must not advance again)");
  await assert.rejects(
    () => kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: renew1.revision, toState: "PLANNING", idempotencyKey: "TK1", now: () => 0, evidenceRef: evidence("ACTOR_REPORTED") }),
    (err) => err.code === "IDEMPOTENCY_CONFLICT",
  );
});

test("release: already-unowned call is a safe no-op replay; stale release against a new owner is a genuine conflict", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-RELEASE";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-4" });
  const c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 1000, now: () => 0 });

  const r1 = await kernel.release({ dir, taskId, actorId: "builder-1", expectedRevision: c.revision });
  assert.equal(r1.owner, null);
  // Calling release() again -- already unowned -- must succeed as a no-op,
  // even though the caller's expectedRevision is now stale.
  const r2 = await kernel.release({ dir, taskId, actorId: "builder-1", expectedRevision: c.revision });
  assert.equal(r2.owner, null);

  // A different actor claims it.
  const c2 = await kernel.claim({ dir, taskId, actorId: "builder-2", leaseDurationMs: 1000, now: () => 0 });
  // The original actor's stale release, presenting an out-of-date revision
  // against a task now genuinely owned by someone else, must be rejected.
  await assert.rejects(
    () => kernel.release({ dir, taskId, actorId: "builder-1", expectedRevision: c.revision }),
    (err) => err.code === "NOT_CURRENT_OWNER",
  );
  // release() by the actual current owner still works.
  const r3 = await kernel.release({ dir, taskId, actorId: "builder-2", expectedRevision: c2.revision });
  assert.equal(r3.owner, null);
});

test("designated handoff transitions clear ownership immediately and fence the outgoing owner (Builder -> QA -> Reviewer -> Builder)", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-HANDOFF-CHAIN";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-5" });

  const cBuilder = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  let s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: cBuilder.revision, toState: "PLANNING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_BUILD", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });
  const cBuilder2 = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: cBuilder2.revision, toState: "BUILDING", now: () => 0 });
  const builderPreHandoffRevision = s.revision;
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_QA", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });
  assert.equal(s.owner, null, "BUILDING -> READY_FOR_QA must clear ownership immediately");

  // QA can claim immediately -- no waiting out builder-1's long lease.
  const cQA = await kernel.claim({ dir, taskId, actorId: "qa-1", leaseDurationMs: 3_600_000, now: () => 1 });
  assert.equal(cQA.owner, "qa-1");

  // The outgoing builder is fenced: it is no longer the current owner.
  await assert.rejects(
    () => kernel.renew({ dir, taskId, actorId: "builder-1", expectedRevision: builderPreHandoffRevision, newLeaseDurationMs: 1000, now: () => 1 }),
    (err) => err.code === "NOT_CURRENT_OWNER",
  );

  s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: cQA.revision, toState: "QA", now: () => 1 });
  s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: s.revision, toState: "READY_FOR_REVIEW", evidenceRef: evidence("INDEPENDENTLY_REPRODUCED"), now: () => 1 });
  assert.equal(s.owner, null, "QA -> READY_FOR_REVIEW must clear ownership immediately");

  const cReviewer = await kernel.claim({ dir, taskId, actorId: "reviewer-1", leaseDurationMs: 3_600_000, now: () => 2 });
  s = await kernel.transition({ dir, taskId, actorId: "reviewer-1", requesterRole: "REVIEWER", expectedRevision: cReviewer.revision, toState: "REVIEW", now: () => 2 });
  const reviewerPreHandoffRevision = s.revision;
  s = await kernel.transition({ dir, taskId, actorId: "reviewer-1", requesterRole: "REVIEWER", expectedRevision: s.revision, toState: "CHANGES_REQUESTED", decisionRef: decision(), now: () => 2 });
  assert.equal(s.owner, null, "REVIEW -> CHANGES_REQUESTED must clear ownership immediately");

  // Builder can re-claim immediately.
  const cBuilder3 = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 3 });
  assert.equal(cBuilder3.owner, "builder-1");

  // The outgoing reviewer is fenced.
  await assert.rejects(
    () => kernel.renew({ dir, taskId, actorId: "reviewer-1", expectedRevision: reviewerPreHandoffRevision, newLeaseDurationMs: 1000, now: () => 3 }),
    (err) => err.code === "NOT_CURRENT_OWNER",
  );
});

test("S4I-F002: QA->BUILDING is an atomic cross-role handoff -- Builder claims immediately, prior QA owner is fenced immediately", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-QA-TO-BUILDING-HANDOFF";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-S4I-F002" });

  let c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  let s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: c.revision, toState: "PLANNING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_BUILD", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });
  c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: c.revision, toState: "BUILDING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_QA", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });

  const cQA = await kernel.claim({ dir, taskId, actorId: "qa-1", leaseDurationMs: 3_600_000, now: () => 1 });
  s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: cQA.revision, toState: "QA", now: () => 1 });
  const qaPreHandoffRevision = s.revision;
  s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: s.revision, toState: "BUILDING", now: () => 1 });

  // Positive: Builder can claim immediately, with no lease-expiry wait and no
  // manual release() step.
  assert.equal(s.owner, null, "QA->BUILDING must clear ownership in the same write");
  const cBuilder2 = await kernel.claim({ dir, taskId, actorId: "builder-2", leaseDurationMs: 3_600_000, now: () => 1 });
  assert.equal(cBuilder2.owner, "builder-2");

  // Negative: the prior QA owner is fenced immediately -- its pre-handoff
  // revision is stale the instant the handoff commits.
  await assert.rejects(
    () => kernel.renew({ dir, taskId, actorId: "qa-1", expectedRevision: qaPreHandoffRevision, newLeaseDurationMs: 1000, now: () => 1 }),
    (err) => err.code === "NOT_CURRENT_OWNER",
  );
});

test("CHANGES_REQUESTED->BUILDING and PAULO_DECISION_REQUIRED->BUILDING are NOT handoffs -- the routed actor keeps ownership", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-NON-HANDOFF-BUILDING";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-NON-HANDOFF" });

  // Drive to REVIEW, then send to CHANGES_REQUESTED, then Builder claims and
  // is re-routed into BUILDING -- that specific re-entry must NOT clear
  // ownership, since Builder is already the actor the transition routed to.
  let c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  let s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: c.revision, toState: "PLANNING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_BUILD", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });
  c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: c.revision, toState: "BUILDING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_QA", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });
  const cQA = await kernel.claim({ dir, taskId, actorId: "qa-1", leaseDurationMs: 3_600_000, now: () => 1 });
  s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: cQA.revision, toState: "QA", now: () => 1 });
  s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: s.revision, toState: "READY_FOR_REVIEW", evidenceRef: evidence("INDEPENDENTLY_REPRODUCED"), now: () => 1 });
  const cReviewer = await kernel.claim({ dir, taskId, actorId: "reviewer-1", leaseDurationMs: 3_600_000, now: () => 2 });
  s = await kernel.transition({ dir, taskId, actorId: "reviewer-1", requesterRole: "REVIEWER", expectedRevision: cReviewer.revision, toState: "REVIEW", now: () => 2 });
  s = await kernel.transition({ dir, taskId, actorId: "reviewer-1", requesterRole: "REVIEWER", expectedRevision: s.revision, toState: "CHANGES_REQUESTED", decisionRef: decision(), now: () => 2 });
  assert.equal(s.owner, null, "REVIEW->CHANGES_REQUESTED is a handoff");

  const cBuilder2 = await kernel.claim({ dir, taskId, actorId: "builder-2", leaseDurationMs: 3_600_000, now: () => 3 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-2", requesterRole: "BUILDER", expectedRevision: cBuilder2.revision, toState: "BUILDING", now: () => 3 });
  assert.equal(s.owner, "builder-2", "CHANGES_REQUESTED->BUILDING must NOT clear ownership -- the routed Builder keeps it");

  // Because ownership was retained, the same actor can transition again
  // without re-claiming.
  const s2 = await kernel.transition({ dir, taskId, actorId: "builder-2", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_QA", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 3 });
  assert.equal(s2.state, "READY_FOR_QA");
});

test("a superseding claim fences a stale-revision caller regardless of that caller's belief it still holds the lease", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-STALE-REVISION";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-6" });

  const cA = await kernel.claim({ dir, taskId, actorId: "actor-A", leaseDurationMs: 10, now: () => 0 });
  // Lease expires at t=10; a new claimant supersedes it once expired.
  const cB = await kernel.claim({ dir, taskId, actorId: "actor-B", leaseDurationMs: 10_000, now: () => 20 });
  assert.equal(cB.owner, "actor-B");
  assert.ok(cB.revision > cA.revision);

  // actor-A, still presenting its original identity/revision, is rejected on
  // any further mutating call -- the fencing property holds even though no
  // handoff-clearing transition occurred, purely via expiry + a superseding
  // claim reassigning ownership.
  await assert.rejects(
    () => kernel.renew({ dir, taskId, actorId: "actor-A", expectedRevision: cA.revision, newLeaseDurationMs: 1000, now: () => 20 }),
    (err) => err.code === "NOT_CURRENT_OWNER",
  );
});

test("retry ceiling 2/2/2 escalates to FAILED once the QA ceiling is reached, matching the locked D-050 policy values", async () => {
  assert.deepEqual(TASK_POLICY.retryCeilings, { build: 2, qa: 2, review: 2 });

  const dir = await freshDir();
  const taskId = "S4KT-RETRY-CEILING";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-7" });
  let owner = "builder-1";
  let c = await kernel.claim({ dir, taskId, actorId: owner, leaseDurationMs: 3_600_000, now: () => 0 });
  let s = await kernel.transition({ dir, taskId, actorId: owner, requesterRole: "BUILDER", expectedRevision: c.revision, toState: "PLANNING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: owner, requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_BUILD", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });
  c = await kernel.claim({ dir, taskId, actorId: owner, leaseDurationMs: 3_600_000, now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: owner, requesterRole: "BUILDER", expectedRevision: c.revision, toState: "BUILDING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: owner, requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_QA", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });

  let t = 1;
  for (let i = 0; i < 2; i++) {
    const cQA = await kernel.claim({ dir, taskId, actorId: "qa-1", leaseDurationMs: 3_600_000, now: () => t++ });
    s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: cQA.revision, toState: "QA", now: () => t++ });
    s = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: s.revision, toState: "BUILDING", now: () => t++ });
    // S4I-F002: QA->BUILDING is now an atomic cross-role handoff edge -- it
    // clears ownership in the same write, so Builder can claim immediately
    // with no manual release() step.
    assert.equal(s.owner, null, "QA->BUILDING must clear ownership atomically");
    const cBuilder = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => t++ });
    s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: cBuilder.revision, toState: "READY_FOR_QA", evidenceRef: evidence("ACTOR_REPORTED"), now: () => t++ });
  }

  const finalState = await kernel.getState({ dir, taskId });
  assert.equal(finalState.retry_counts.qa, 2);

  const cQAFinal = await kernel.claim({ dir, taskId, actorId: "qa-1", leaseDurationMs: 3_600_000, now: () => t++ });
  const sQAFinal = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: cQAFinal.revision, toState: "QA", now: () => t++ });
  await assert.rejects(
    () => kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: sQAFinal.revision, toState: "BUILDING", now: () => t++ }),
    (err) => err.code === "ILLEGAL_TRANSITION",
    "QA->BUILDING must be rejected once the qa retry ceiling (2) is reached -- never an unbounded loop",
  );
  const failedState = await kernel.transition({ dir, taskId, actorId: "qa-1", requesterRole: "QA", expectedRevision: sQAFinal.revision, toState: "FAILED", now: () => t++ });
  assert.equal(failedState.state, "FAILED");
});

test("coordination/STATE.md's MAX_REMEDIATION_CYCLES has no influence on S4 task retry behavior (structural independence check)", async () => {
  // task-policy.mjs is the one module that defines the retry ceiling -- it
  // must contain no I/O of any kind (no fs read, no dynamic import) and no
  // reference at all to the bootstrap file or its field name. kernel.mjs and
  // lifecycle.mjs are allowed to *mention* coordination/STATE.md in prose
  // documentation explaining this very independence (which they do); what
  // must never exist anywhere under devos/state/ is an actual filesystem
  // read of that path.
  const stateDir = path.join(__dirname, "..", "devos", "state");
  const files = fs.readdirSync(stateDir).filter((f) => f.endsWith(".mjs") || f.endsWith(".json"));
  assert.ok(files.length > 0);

  const policyContents = fs.readFileSync(path.join(stateDir, "task-policy.mjs"), "utf8");
  const policyCodeOnly = policyContents
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  assert.ok(
    !/\breadFile|\brequire\(|\bimport\(/.test(policyCodeOnly),
    "task-policy.mjs's actual code (excluding comments) must perform no I/O -- its values are static, not read from any file",
  );

  for (const f of files) {
    const contents = fs.readFileSync(path.join(stateDir, f), "utf8");
    assert.ok(
      !/readFile\w*\s*\(\s*[^)]*coordination/i.test(contents),
      `${f} must never read coordination/STATE.md from disk`,
    );
  }

  // Behavioral half of the same proof: changing what the live coordination
  // file currently says has no bearing on the kernel's own locked ceiling.
  const liveStatePath = path.join(__dirname, "..", "coordination", "STATE.md");
  const liveState = fs.readFileSync(liveStatePath, "utf8");
  assert.ok(/MAX_REMEDIATION_CYCLES:\s*\d+/.test(liveState), "sanity check: the live file still has this field");
  assert.deepEqual(TASK_POLICY.retryCeilings, { build: 2, qa: 2, review: 2 }, "S4's ceiling is fixed by D-050, independent of whatever the live bootstrap file currently says");
});

test("deterministic injected clock: identical scenario replayed with two different fixed clocks produces reproducible, non-time-dependent results", async () => {
  async function runScenario(fixedNow) {
    const dir = await freshDir();
    const taskId = "S4KT-CLOCK";
    await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-8" });
    const c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 5000, now: () => fixedNow });
    return c.lease_expires_at - fixedNow;
  }
  const durationA = await runScenario(1_000_000);
  const durationB = await runScenario(9_999_999);
  assert.equal(durationA, 5000);
  assert.equal(durationB, 5000);
  assert.equal(durationA, durationB, "lease math must be a pure function of the injected clock, not real elapsed time");
});

test("a leftover .tmp file from an interrupted write is ignored, not mistaken for a committed record", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-TMP-LEFTOVER";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-9" });
  const before = await kernel.getState({ dir, taskId });

  // Simulate a crash mid-write: a stray temp file sitting next to the real record.
  await fsp.writeFile(path.join(dir, `${taskId}.99999.123.abcde.tmp`), "{ not valid json, and irrelevant either way", "utf8");

  const after = await kernel.getState({ dir, taskId });
  assert.deepEqual(after, before, "the stray .tmp file must not affect reads of the real committed record");
});

test("a corrupted final record surfaces a scoped error for that one task_id, without crashing other tasks", async () => {
  const dir = await freshDir();
  const goodTaskId = "S4KT-CORRUPT-GOOD";
  const badTaskId = "S4KT-CORRUPT-BAD";
  await kernel.createTask({ dir, taskId: goodTaskId, contractRef: "CONTRACT-10" });
  await kernel.createTask({ dir, taskId: badTaskId, contractRef: "CONTRACT-11" });

  // Corrupt only the bad task's file directly on disk.
  await fsp.writeFile(path.join(dir, `${badTaskId}.json`), "{ this is not valid json", "utf8");

  await assert.rejects(() => kernel.getState({ dir, taskId: badTaskId }), (err) => err instanceof CorruptRecordError);
  const goodState = await kernel.getState({ dir, taskId: goodTaskId });
  assert.equal(goodState.state, "CREATED", "an unrelated task's record must remain readable");
});

test("S4I-F003: syntactically valid but schema-invalid JSON is detected at load time, scoped to that one task", async () => {
  const dir = await freshDir();
  const goodTaskId = "S4KT-SCHEMA-GOOD";
  const badTaskId = "S4KT-SCHEMA-BAD";
  await kernel.createTask({ dir, taskId: goodTaskId, contractRef: "CONTRACT-SCHEMA-GOOD" });
  await kernel.createTask({ dir, taskId: badTaskId, contractRef: "CONTRACT-SCHEMA-BAD" });

  // Valid JSON, but structurally invalid: wrong state enum value and a
  // stray Run-History-shaped field the schema forbids. JSON.parse would
  // happily accept this -- only structural validation catches it.
  const schemaInvalid = {
    task_id: badTaskId,
    contract_ref: "CONTRACT-SCHEMA-BAD",
    state: "NOT_A_REAL_STATE",
    owner: null,
    revision: 0,
    lease_expires_at: null,
    retry_counts: { build: 0, qa: 0, review: 0 },
    idempotency_ledger: {},
    history: [],
    authority_disclaimer: "softened disclaimer text",
    command_output: "this should never be here",
  };
  await fsp.writeFile(path.join(dir, `${badTaskId}.json`), JSON.stringify(schemaInvalid), "utf8");

  await assert.rejects(
    () => kernel.getState({ dir, taskId: badTaskId }),
    (err) => err instanceof CorruptRecordError && err.errors.length > 0,
    "schema-invalid JSON must fail exactly like invalid JSON, carrying the structural errors",
  );

  // Mutation must also refuse to proceed against a schema-invalid record.
  await assert.rejects(
    () => kernel.claim({ dir, taskId: badTaskId, actorId: "builder-1", leaseDurationMs: 1000 }),
    (err) => err instanceof CorruptRecordError,
  );

  const goodState = await kernel.getState({ dir, taskId: goodTaskId });
  assert.equal(goodState.state, "CREATED", "an unrelated task's record must remain readable and mutable");
  const claimed = await kernel.claim({ dir, taskId: goodTaskId, actorId: "builder-1", leaseDurationMs: 1000 });
  assert.equal(claimed.owner, "builder-1");
});

test("an orphaned lock of any age is never auto-stolen; ordinary mutation fails closed with LOCK_HELD", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-ORPHAN-LOCK";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-12" });

  // Simulate an orphaned lock left behind by a crashed writer, with a
  // deliberately ancient timestamp -- age must have zero bearing on whether
  // ordinary mutation is allowed to proceed.
  const ancientLock = {
    holder: "crashed-writer",
    operation: "transition",
    acquired_at: new Date(0).toISOString(),
    pid: 999999,
  };
  await fsp.writeFile(path.join(dir, `${taskId}.lock`), JSON.stringify(ancientLock), "utf8");

  await assert.rejects(
    () => kernel.claim({ dir, taskId, actorId: "new-writer", leaseDurationMs: 1000, now: () => Date.now() }),
    (err) => err instanceof LockHeldError && err.code === "LOCK_HELD",
  );

  // Explicit operator recovery clears it.
  const cleared = await kernel.forceClearLock({
    dir, taskId, operator: "Paulo", authorizationRef: "D-050", reason: "confirmed crashed-writer process is dead", confirmedNoWriterRemains: true,
  });
  assert.equal(cleared.cleared, true);

  const claimed = await kernel.claim({ dir, taskId, actorId: "new-writer", leaseDurationMs: 1000, now: () => Date.now() });
  assert.equal(claimed.owner, "new-writer");
});

test("S4I-F005: the lock diagnostic payload the kernel itself writes includes task_id, per RFC-016's minimum metadata", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-LOCK-METADATA";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-LOCK-METADATA" });

  // Read the real lock file's content from *inside* the critical section --
  // this is the exact payload store.mjs's acquireLock() writes, not a
  // hand-constructed fixture.
  let observedLockContent = null;
  await withTaskLock(dir, taskId, "test-holder", "test-operation", async (current) => {
    observedLockContent = JSON.parse(await fsp.readFile(path.join(dir, `${taskId}.lock`), "utf8"));
    return { result: undefined, newRecord: null };
  });

  assert.equal(observedLockContent.task_id, taskId, "the kernel's own lock payload must carry task_id");
  assert.equal(observedLockContent.holder, "test-holder");
  assert.equal(observedLockContent.operation, "test-operation");
  assert.ok(observedLockContent.acquired_at);
  assert.equal(fs.existsSync(path.join(dir, `${taskId}.lock`)), false, "lock is released after the operation completes");
});

test("force_clear_lock enforces D-050's operator/provenance conditions", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-FORCE-CLEAR-AUTH";
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, `${taskId}.lock`), JSON.stringify({ holder: "x", acquired_at: new Date().toISOString() }), "utf8");

  await assert.rejects(
    () => kernel.forceClearLock({ dir, taskId, operator: "SomeoneElse", authorizationRef: "D-050", reason: "r", confirmedNoWriterRemains: true }),
    (err) => err.code === "FORCE_CLEAR_UNAUTHORIZED",
    "only Paulo is a default-authorized V1 operator",
  );
  await assert.rejects(
    () => kernel.forceClearLock({ dir, taskId, operator: "Paulo", authorizationRef: "", reason: "r", confirmedNoWriterRemains: true }),
  );
  await assert.rejects(
    () => kernel.forceClearLock({ dir, taskId, operator: "Paulo", authorizationRef: "D-050", reason: "r", confirmedNoWriterRemains: false }),
  );
  const ok = await kernel.forceClearLock({ dir, taskId, operator: "Paulo", authorizationRef: "D-050", reason: "confirmed", confirmedNoWriterRemains: true });
  assert.equal(ok.cleared, true);
});

test("evidence-class-label guard rejects on label alone, never by inspecting the (bogus, non-dereferenced) evidence_ref", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-EVIDENCE-LABEL";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-13" });
  let c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  let s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: c.revision, toState: "PLANNING", now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_BUILD", evidenceRef: evidence("ACTOR_REPORTED"), now: () => 0 });
  c = await kernel.claim({ dir, taskId, actorId: "builder-1", leaseDurationMs: 3_600_000, now: () => 0 });
  s = await kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: c.revision, toState: "BUILDING", now: () => 0 });

  // A wrong-class evidence_ref pointing at a path that does not exist on disk
  // must be rejected purely on the class label -- no ENOENT/filesystem error
  // is ever produced, because the kernel never dereferences `ref`.
  await assert.rejects(
    () => kernel.transition({ dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_QA", now: () => 0 }),
    (err) => err.code === "ILLEGAL_TRANSITION",
  );

  const ok = await kernel.transition({
    dir, taskId, actorId: "builder-1", requesterRole: "BUILDER", expectedRevision: s.revision, toState: "READY_FOR_QA",
    evidenceRef: { ref: "/this/path/definitely/does/not/exist/anywhere", evidenceClass: "ACTOR_REPORTED" },
    now: () => 0,
  });
  assert.equal(ok.state, "READY_FOR_QA");
});

test("every task-state record carries the exact, unoverridable fixed non-authority disclaimer", async () => {
  const dir = await freshDir();
  const taskId = "S4KT-DISCLAIMER";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-14" });
  const s = await kernel.getState({ dir, taskId });
  const { AUTHORITY_DISCLAIMER } = await import("../devos/state/lifecycle.mjs");
  assert.equal(s.authority_disclaimer, AUTHORITY_DISCLAIMER);
  // createTask's signature carries no field through which a caller could
  // override it -- there is no override path to test against, by construction.
});

test("S4I-F004: invalid task_id values are rejected before any filesystem path is constructed, and create no file outside the store directory", async () => {
  const dir = await freshDir();
  const invalidIds = [
    "lowercase-id",
    "../../etc/passwd",
    "with/slash",
    "with\\backslash",
    "AB",
    "",
    "1STARTSWITHDIGIT",
  ];

  for (const badId of invalidIds) {
    await assert.rejects(
      () => kernel.createTask({ dir, taskId: badId, contractRef: "CONTRACT-INVALID-ID" }),
      (err) => err.code === "INVALID_TASK_ID",
      `task_id ${JSON.stringify(badId)} must be rejected`,
    );
    await assert.rejects(
      () => kernel.claim({ dir, taskId: badId, actorId: "builder-1", leaseDurationMs: 1000 }),
      (err) => err.code === "INVALID_TASK_ID",
    );
    await assert.rejects(
      () => kernel.getState({ dir, taskId: badId }),
      (err) => err.code === "INVALID_TASK_ID",
    );
  }

  // No file was created in the store directory by any rejected task_id --
  // the assertValidTaskId() check throws before path.join/fs ever runs with
  // the malformed value, so a path-traversal id like "../../etc/passwd"
  // never reaches a filesystem call at all (proven directly: assertValidTaskId
  // rejects it as a pure string-shape check, with no I/O in between).
  const entriesInStore = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  assert.deepEqual(entriesInStore, [], "no file may be created in the store directory by any rejected task_id");
});

test("S4I-F004: createTask rejects an empty or non-string contract_ref before writing", async () => {
  const dir = await freshDir();
  await assert.rejects(
    () => kernel.createTask({ dir, taskId: "S4KT-EMPTY-CONTRACT", contractRef: "" }),
    (err) => err.code === "INVALID_CONTRACT_REF",
  );
  await assert.rejects(
    () => kernel.createTask({ dir, taskId: "S4KT-NULL-CONTRACT", contractRef: null }),
    (err) => err.code === "INVALID_CONTRACT_REF",
  );
  assert.equal(fs.existsSync(path.join(dir, "S4KT-EMPTY-CONTRACT.json")), false);
  assert.equal(fs.existsSync(path.join(dir, "S4KT-NULL-CONTRACT.json")), false);

  // A valid contract_ref still works.
  const ok = await kernel.createTask({ dir, taskId: "S4KT-VALID-CONTRACT", contractRef: "CONTRACT-VALID" });
  assert.equal(ok.state, "CREATED");
});
