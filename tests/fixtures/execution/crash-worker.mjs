// Fixed crash fixture for S6 recovery tests (ML-DEVOS-RFC-019 §15, §18;
// D-071). It takes no command: only a JSON world spec, one operation from a
// closed set, and one crash point from a closed set. At the crash point it
// SIGKILLs ITSELF, so no finally/catch handler of the host library runs.
import fs from "node:fs";

import { createTestExecutionHost } from "../../../devos/execution/testing.mjs";
import { POLICY_VERSION, PROJECT, REPOSITORY, TOOLCHAIN, TRANSPORT_REF, gatewayFor, trustedHost } from "./harness.mjs";

const OPERATIONS = new Set(["create", "complete", "permit", "claim", "report", "operator", "cleanup"]);
const CRASH_POINTS = new Set([
  "after-create-begin", "after-push-intent", "after-push", "after-pending", "after-transition", "after-cleanup-intent",
  "permit-after-blob", "permit-after-commit",
  // Task-store persistence points (§13.2): inside the operation's first commit.
  "envelope:synced", "envelope:renamed",
]);

const spec = JSON.parse(process.argv[2]);
if (!OPERATIONS.has(spec.op) || !CRASH_POINTS.has(spec.crashAt)) {
  process.stderr.write("crash-worker: operation or crash point outside the fixed set\n");
  process.exit(2);
}

const trust = trustedHost({ actorId: spec.builder, actorRole: "Builder" });
const kill = (name) => {
  if (name === spec.crashAt) process.kill(process.pid, "SIGKILL");
};
// Test-only construction (§13.5): the production host refuses fault hooks.
const host = createTestExecutionHost({
  workspaceRoot: spec.dirs.workspace,
  hostStateDir: spec.dirs.state,
  project: PROJECT,
  repository: REPOSITORY,
  remote: spec.dirs.remote,
  baseRef: "refs/heads/main",
  transportAuthorizationRef: TRANSPORT_REF,
  gateway: gatewayFor(spec.dirs.workspace, trust),
  policyVersion: POLICY_VERSION,
  s4Dir: spec.dirs.s4,
  resolveContract: (ref) => {
    if (ref !== spec.contractRef) throw new Error("unknown contract");
    return fs.readFileSync(spec.contractPath, "utf8");
  },
  toolchainPath: TOOLCHAIN,
  ignoredOutputAllowlist: ["node_modules/", "build-output/"],
}, { faults: { onStep: kill }, storeHooks: kill });

// "permit"/"claim" submit the spec's Execution Request as DATA (it is never
// executed); "report" submits a synthetic Execution Report; nothing runs.
if (spec.op === "create") await host.createInstance({ role: "BUILDER", claimResult: spec.anchor });
else if (spec.op === "permit") await host.requestPermit(spec.request);
else if (spec.op === "claim") await host.claimPermit({ permitId: spec.permitId, request: spec.request });
else if (spec.op === "report") await host.recordReport(spec.report);
else if (spec.op === "operator") await host.resolveExecutionByOperator(spec.instanceId, spec.resolution);
else if (spec.op === "cleanup") await host.cleanup(spec.instanceId);
else await host.complete(spec.instanceId, { actorId: spec.builder });
process.stderr.write("crash-worker: crash point was never reached\n");
process.exit(3);
