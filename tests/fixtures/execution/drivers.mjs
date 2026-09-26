// Test-only execution drivers for S6 core (ML-DEVOS-RFC-019 §13.1; D-071).
//
// Neither driver accepts a caller-supplied command. Both are bounded test
// fixtures, NOT an execution driver implementation:
//   - fakeDriver executes nothing and reports synthetic results;
//   - fixtureDriver performs one of a CLOSED set of fixed operations, each with
//     literal checked-in behaviour. The Execution Request argv for an operation
//     is that operation's own literal constant; the driver looks operations up
//     by name and refuses anything not in the table.
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { argvDigest } from "../../../devos/execution/index.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LONG_LIVED_CHILD = path.join(HERE, "long-lived-child.mjs");
const FEATURE_CONTENT = "fixture feature\n";

// The closed operation table. argv values are literal constants.
export const FIXED_OPERATIONS = Object.freeze({
  WRITE_FEATURE: Object.freeze({ argv: Object.freeze(["s6-fixture", "write", "src/feature.txt"]) }),
  WRITE_SECOND: Object.freeze({ argv: Object.freeze(["s6-fixture", "write", "src/second.txt"]) }),
  WRITE_OUT_OF_SCOPE: Object.freeze({ argv: Object.freeze(["s6-fixture", "write", "README.md"]) }),
  WRITE_PROHIBITED: Object.freeze({ argv: Object.freeze(["s6-fixture", "write", "src/secret-area/x.txt"]) }),
  WRITE_IGNORED_LOG: Object.freeze({ argv: Object.freeze(["s6-fixture", "write", "debug.log"]) }),
  STAGE_ALL: Object.freeze({ argv: Object.freeze(["git", "add", "-A"]) }),
  COMMIT: Object.freeze({ argv: Object.freeze(["git", "commit", "--quiet", "-m", "s6 fixture commit"]) }),
  START_LONG_LIVED_CHILD: Object.freeze({ argv: Object.freeze(["node", "tests/fixtures/execution/long-lived-child.mjs"]) }),
});

const WRITES = {
  WRITE_FEATURE: "src/feature.txt",
  WRITE_SECOND: "src/second.txt",
  WRITE_OUT_OF_SCOPE: "README.md",
  WRITE_PROHIBITED: "src/secret-area/x.txt",
  WRITE_IGNORED_LOG: "debug.log",
};

function perform(op, cwd, env) {
  if (WRITES[op]) {
    const target = path.join(cwd, WRITES[op]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, FEATURE_CONTENT);
    return { process_groups: [], exit_code: 0 };
  }
  if (op === "STAGE_ALL") {
    execFileSync("git", ["add", "-A"], { cwd, env, stdio: "ignore" });
    return { process_groups: [], exit_code: 0 };
  }
  if (op === "COMMIT") {
    execFileSync("git", ["commit", "--quiet", "-m", "s6 fixture commit"], { cwd, env, stdio: "ignore" });
    return { process_groups: [], exit_code: 0 };
  }
  if (op === "START_LONG_LIVED_CHILD") {
    const child = spawn(process.execPath, [LONG_LIVED_CHILD], { cwd, env, detached: true, stdio: "ignore" });
    child.unref();
    return { process_groups: [child.pid], exit_code: null };
  }
  throw new Error(`fixture driver refuses unknown operation ${op}`);
}

// Request -> permit -> claim -> fixed operation -> report. `op` must be a key
// of FIXED_OPERATIONS; nothing else is accepted.
export async function runFixed(host, { instanceId, checkpointRevision, requestId, op }) {
  if (!Object.prototype.hasOwnProperty.call(FIXED_OPERATIONS, op)) throw new Error(`unknown fixed operation ${op}`);
  const request = { instance_id: instanceId, request_id: requestId, argv: [...FIXED_OPERATIONS[op].argv], checkpoint_revision: checkpointRevision };
  const issued = await host.requestPermit(request);
  const claimed = await host.claimPermit({ permitId: issued.permit_id, request });
  const startedAt = new Date().toISOString();
  const out = perform(op, claimed.cwd, claimed.environment);
  const terminated = out.process_groups.length === 0;
  // Complete RFC-019 report. Output is not captured by the fixed operations,
  // so the stdout/stderr digests are honestly null ("not captured").
  const report = {
    permit_id: issued.permit_id,
    instance_id: instanceId,
    argv_digest: argvDigest(request.argv),
    environment_digest: claimed.permit.environment_digest,
    process_groups: out.process_groups,
    started_at: startedAt,
    ended_at: terminated ? new Date().toISOString() : null,
    exit_code: terminated ? out.exit_code : null,
    signal: null,
    stdout_digest: null,
    stderr_digest: null,
    terminated,
  };
  await host.recordReport(report);
  return { permitId: issued.permit_id, request, processGroups: out.process_groups, environment: claimed.environment };
}

// The driver terminates what IT started (S6 core never signals anything).
export function terminateFixtureGroups(groups) {
  for (const g of groups) {
    try {
      process.kill(-g, "SIGKILL");
    } catch {
      // already gone
    }
  }
}

// Deterministic synthetic report values for the fake driver.
export const SYNTHETIC_REPORT = Object.freeze({
  started_at: "2026-09-24T12:00:01.000Z",
  ended_at: "2026-09-24T12:00:02.500Z",
  exit_code: 0,
  signal: null,
  stdout_digest: createHash("sha256").update("synthetic stdout").digest("hex"),
  stderr_digest: createHash("sha256").update("").digest("hex"),
});

// Executes nothing: synthetic claims and complete synthetic reports.
export function fakeDriver(host) {
  return {
    async claim(permitId, request) {
      return host.claimPermit({ permitId, request });
    },
    reportFor(permit, request, over = {}) {
      return {
        permit_id: permit.permit_id, instance_id: request.instance_id, argv_digest: argvDigest(request.argv),
        environment_digest: permit.environment_digest, process_groups: [], ...SYNTHETIC_REPORT, terminated: true, ...over,
      };
    },
    async report(permit, request, over = {}) {
      return host.recordReport(this.reportFor(permit, request, over));
    },
  };
}
