#!/usr/bin/env node
// Helper script for tests/state-concurrency.test.mjs. Runs as a real, separate
// OS process (not a call inside the parent's event loop) attempting exactly
// one kernel.claim() against a given task, then prints a single JSON line to
// stdout describing the outcome. ML-DEVOS-RFC-016's brief is explicit that
// "two sequential calls in one event loop do not satisfy the race
// requirement" -- this script exists so the test can spawn two real
// processes racing each other.

import * as kernel from "../../devos/state/kernel.mjs";

const [, , dir, taskId, actorId, leaseDurationMs, delayMs] = process.argv;

async function main() {
  if (delayMs && Number(delayMs) > 0) {
    await new Promise((resolve) => setTimeout(resolve, Number(delayMs)));
  }
  try {
    const result = await kernel.claim({
      dir,
      taskId,
      actorId,
      leaseDurationMs: Number(leaseDurationMs),
    });
    process.stdout.write(JSON.stringify({ ok: true, actorId, result }) + "\n");
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, actorId, code: err.code || null, message: err.message }) + "\n");
  }
}

main();
