// Fixed crash fixture for S6 recovery tests (ML-DEVOS-RFC-019 §15, §18;
// D-071). It takes no command: only a JSON world spec, one operation from a
// closed set, and one crash point from a closed set. At the crash point it
// SIGKILLs ITSELF, so no finally/catch handler of the host library runs.
import fs from "node:fs";

import { createExecutionHost } from "../../../devos/execution/index.mjs";
import { POLICY_VERSION, PROJECT, REPOSITORY, TOOLCHAIN, TRANSPORT_REF, gatewayFor, trustedHost } from "./harness.mjs";

const OPERATIONS = new Set(["create", "complete", "permit"]);
const CRASH_POINTS = new Set([
  "after-create-begin", "after-push", "after-pending", "after-transition",
  "permit-before-binding", "permit-after-binding", "permit-after-body", "permit-after-status", "permit-after-journal",
]);

const spec = JSON.parse(process.argv[2]);
if (!OPERATIONS.has(spec.op) || !CRASH_POINTS.has(spec.crashAt)) {
  process.stderr.write("crash-worker: operation or crash point outside the fixed set\n");
  process.exit(2);
}

const trust = trustedHost({ actorId: spec.builder, actorRole: "Builder" });
const host = createExecutionHost({
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
  faults: {
    onStep: (name) => {
      if (name === spec.crashAt) process.kill(process.pid, "SIGKILL");
    },
  },
});

// "permit" submits the spec's Execution Request as DATA (it is never executed).
if (spec.op === "create") await host.createInstance({ role: "BUILDER", claimResult: spec.anchor });
else if (spec.op === "permit") await host.requestPermit(spec.request);
else await host.complete(spec.instanceId, { actorId: spec.builder });
process.stderr.write("crash-worker: crash point was never reached\n");
process.exit(3);
