// ML-DEVOS-RFC-016 / ML-DEVOS-AS-065 -- real, multi-process concurrency tests
// for the S4 State Machine Kernel's exclusive-lock primitive. Per the
// Architect Builder Brief: "Use real child processes or worker threads for
// the concurrent writer test; two sequential calls in one event loop do not
// satisfy the race requirement" -- these tests spawn genuine separate OS
// processes via node:child_process, never simulate concurrency with
// sequential awaits.

import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as kernel from "../devos/state/kernel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.join(__dirname, "fixtures", "state-claim-worker.mjs");

function freshDir() {
  return fsp.mkdtemp(path.join(os.tmpdir(), "s4-concurrency-test-"));
}

function runWorker(dir, taskId, actorId, leaseDurationMs, delayMs = 0) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [WORKER, dir, taskId, actorId, String(leaseDurationMs), String(delayMs)],
      { timeout: 15_000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`worker failed: ${err.message}\nstdout=${stdout}\nstderr=${stderr}`));
        try {
          resolve(JSON.parse(stdout.trim().split("\n").pop()));
        } catch (parseErr) {
          reject(new Error(`worker produced non-JSON output: ${stdout}\nstderr=${stderr}\n${parseErr.message}`));
        }
      },
    );
  });
}

test("two real concurrent OS-level processes racing claim() on the same unclaimed task: exactly one wins", async () => {
  const dir = await freshDir();
  const taskId = "S4CT-RACE-001";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-RACE-1" });

  const [a, b] = await Promise.all([
    runWorker(dir, taskId, "process-A", 60_000, 0),
    runWorker(dir, taskId, "process-B", 60_000, 0),
  ]);

  const results = [a, b];
  const winners = results.filter((r) => r.ok === true);
  const losers = results.filter((r) => r.ok === false);

  assert.equal(winners.length, 1, `exactly one process must win the claim race, got: ${JSON.stringify(results)}`);
  assert.equal(losers.length, 1);
  assert.ok(
    losers[0].code === "LOCK_HELD" || losers[0].code === "CLAIM_CONFLICT",
    `the losing process must receive an explicit conflict, never a silent no-op; got code=${losers[0].code}`,
  );

  const finalState = await kernel.getState({ dir, taskId });
  assert.equal(finalState.owner, winners[0].actorId);
  assert.equal(finalState.revision, 1, "exactly one successful claim must have committed -- no double-apply");
});

test("real concurrent contention against an orphaned lock never lets two processes both win", async () => {
  const dir = await freshDir();
  const taskId = "S4CT-RACE-ORPHAN";
  await kernel.createTask({ dir, taskId, contractRef: "CONTRACT-RACE-2" });

  // Simulate an orphaned lock (as if a prior writer crashed while holding it),
  // deliberately ancient, before either real process starts.
  await fsp.writeFile(
    path.join(dir, `${taskId}.lock`),
    JSON.stringify({ holder: "long-dead-writer", operation: "transition", acquired_at: new Date(0).toISOString(), pid: 1 }),
    "utf8",
  );

  const [a, b] = await Promise.all([
    runWorker(dir, taskId, "process-C", 60_000, 0),
    runWorker(dir, taskId, "process-D", 60_000, 0),
  ]);

  // Neither process may succeed -- the lock is fail-closed regardless of age,
  // and regardless of how many real processes contend for it concurrently.
  assert.equal(a.ok, false);
  assert.equal(b.ok, false);
  assert.equal(a.code, "LOCK_HELD");
  assert.equal(b.code, "LOCK_HELD");

  const finalState = await kernel.getState({ dir, taskId });
  assert.equal(finalState.owner, null, "no process may have stolen the orphaned lock");
  assert.equal(finalState.revision, 0, "no mutation may have occurred while the lock was orphaned");
});
