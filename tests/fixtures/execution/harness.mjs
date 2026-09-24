// S6 core test harness (ML-DEVOS-RFC-019 §18; D-071).
//
// Everything is local and temporary: a bare Git repository stands in for the
// remote, S4 runs against a temporary task store, and S5 decisions come from a
// real public createGateway() over a test policy with a controllable trusted
// host (subject, clock, live revocation list). No credential, network remote,
// or live governance/product task is involved.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createGateway } from "../../../devos/capabilities/index.mjs";
import { claim, createTask, getState, transition } from "../../../devos/state/kernel.mjs";
import { createExecutionHost } from "../../../devos/execution/index.mjs";

export const PROJECT = "Dillaab-source/maisog-labs";
export const REPOSITORY = "github.com/Dillaab-source/maisog-labs";
export const POLICY_VERSION = "s6-test.1";
export const TRANSPORT_REF = "D-071-TEST-LOCAL-ONLY";
export const TOOLCHAIN = [...new Set([path.dirname(process.execPath), "/usr/local/bin", "/usr/bin", "/bin"])].filter((d) => fs.existsSync(d));
export const T0 = Date.parse("2026-09-24T12:00:00Z");

// Fixture-only Git environment: the host user's global config (signing,
// proxies) never touches fixture repositories.
export function cleanGitEnv(home) {
  return { PATH: TOOLCHAIN.join(":"), HOME: home, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_TERMINAL_PROMPT: "0", LANG: "C.UTF-8" };
}

// Fixture setup only: literal Git subcommands on fixture repositories.
export function fixtureGit(args, opts) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

export function contractFor(taskId, overrides = {}) {
  return {
    contract_schema_version: "1.0.0",
    task_id: taskId,
    title: "S6 isolation test task",
    project: PROJECT,
    change_class: "PATCH",
    authorization_references: ["ML-DEVOS-RFC-019", "D-071"],
    requirement_references: [],
    risk_references: [],
    design_references: [],
    scope: {
      allowed_paths: ["src/", "docs/"],
      prohibited_paths: ["src/secret-area/"],
      prohibited_actions: ["deploy"],
      remote_resources_involved: false,
      protected_main_or_deploy_in_scope: false,
      production_write_in_scope: false,
      credential_or_security_in_scope: false,
      destructive_actions_in_scope: false,
      ...(overrides.scope ?? {}),
    },
    acceptance_criteria: [{ criterion_id: "AC-1", statement: "The change is present." }],
    claims: overrides.claims ?? [{ claim_id: "CLAIM-1", claim_kind: "IMPLEMENTATION_PRESENT", statement: "Present.", evidence: { all_of: ["ACTOR_REPORTED"], any_of: [] } }],
    authority_disclaimer: "This Task Contract describes already-authorized scope. It does not itself grant authority, tool access, credentials, remote-resource access, merge approval, deployment approval, or risk acceptance (CORE-001, CORE-002). Satisfying this contract's acceptance criteria and evidence requirements does not certify task success or accept the task; that judgment belongs to the Architect/Paulo review that consumes this contract's evidence, not to the contract or its validator.",
  };
}

// Test S5 policy: shell.exec under the workspace root for Builder and QA,
// github fetch/ls-remote, and push only to sentinel/s6 task branches.
export function policyFor(workspaceCanonical, { version = POLICY_VERSION, denyPush = false, expiry = null } = {}) {
  const slug = PROJECT.toLowerCase();
  const d = (id, role, provider, action, scope, exp = null) => ({
    descriptor_id: id, actor_role: role, project: PROJECT, provider, action, resource_scope: scope, environment: "local", expiry: exp,
    credential_requirement: { required: false, credential_class: null }, consequence_tier: "low",
  });
  const descriptors = [];
  for (const [r, role] of [["B", "Builder"], ["Q", "QA"]]) {
    descriptors.push(d(`S6-${r}-FETCH`, role, "github", "git.fetch", [slug]));
    descriptors.push(d(`S6-${r}-LS`, role, "github", "git.ls_remote", [`${slug}:refs/heads/*`]));
    descriptors.push(d(`S6-${r}-EXEC`, role, "shell", "shell.exec", [`${workspaceCanonical}/*`], expiry));
  }
  if (!denyPush) descriptors.push(d("S6-B-PUSH", "Builder", "github", "git.push", [`${slug}:refs/heads/sentinel/s6/*`]));
  return { policy_version: version, descriptors };
}

// A controllable trusted S5 host: tests change the subject, the clock or the
// live revocation list, or make a trusted source unavailable.
export function trustedHost(initial) {
  const state = { actorId: initial.actorId, actorRole: initial.actorRole, nowIso: "2026-09-24T12:00:00Z", revoked: [], failSource: null, calls: 0 };
  const host = {
    subject: () => {
      if (state.failSource === "identity") throw new Error("identity source unavailable");
      return { actor_role: state.actorRole, actor_id: state.actorId, credential_class: null, credential_available: false, attestation_ref: "s6-test" };
    },
    now: () => {
      state.calls += 1;
      if (state.failSource === "clock") throw new Error("clock unavailable");
      return state.nowIso;
    },
    revocations: () => {
      if (state.failSource === "revocations") throw new Error("revocation source unavailable");
      return [...state.revoked];
    },
  };
  return { state, host };
}

export function gatewayFor(workspaceNative, trusted, { policies } = {}) {
  const root = fs.realpathSync(workspaceNative);
  return createGateway({
    policies: policies ?? [policyFor(root)],
    hosts: { github: trusted.host, shell: { ...trusted.host, shellRoots: [root] } },
  });
}

// A complete isolated world with a task claimed into BUILDING by `builder`.
export async function makeWorld({ taskId = "S6TEST-TASK", contractOverrides = {}, builder = "builder-1", leaseMs = 600000, policies = null } = {}) {
  const top = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "s6-world-")));
  const dirs = {
    top,
    remote: path.join(top, "remote.git"),
    seed: path.join(top, "seed"),
    workspace: path.join(top, "workspace"),
    state: path.join(top, "host-state"),
    s4: path.join(top, "s4"),
    contracts: path.join(top, "contracts"),
    home: path.join(top, "fixture-home"),
    outside: path.join(top, "outside"),
  };
  for (const d of [dirs.workspace, dirs.state, dirs.s4, dirs.contracts, dirs.home, dirs.outside]) fs.mkdirSync(d);
  fs.writeFileSync(path.join(dirs.outside, "SENTINEL.txt"), "must survive\n");
  const env = cleanGitEnv(dirs.home);
  fixtureGit(["init", "--quiet", "--bare", "--initial-branch=main", dirs.remote], { env });
  fixtureGit(["init", "--quiet", "--initial-branch=main", dirs.seed], { env });
  fs.mkdirSync(path.join(dirs.seed, "src"));
  fs.writeFileSync(path.join(dirs.seed, "src", "app.txt"), "v1\n");
  fs.writeFileSync(path.join(dirs.seed, ".gitignore"), "node_modules/\nbuild-output/\n*.log\n");
  const ci = ["-c", "user.name=Seed", "-c", "user.email=seed@invalid", "-c", "commit.gpgsign=false"];
  fixtureGit(["add", "."], { cwd: dirs.seed, env });
  fixtureGit([...ci, "commit", "--quiet", "-m", "seed"], { cwd: dirs.seed, env });
  fixtureGit(["push", "--quiet", dirs.remote, "HEAD:refs/heads/main"], { cwd: dirs.seed, env });
  const baseSha = fixtureGit(["rev-parse", "HEAD"], { cwd: dirs.seed, env });

  const contractRef = `contract:${taskId}`;
  const contractPath = path.join(dirs.contracts, `${taskId}.json`);
  fs.writeFileSync(contractPath, JSON.stringify(contractFor(taskId, contractOverrides), null, 2));
  await createTask({ dir: dirs.s4, taskId, contractRef });
  const now = Date.now();
  const tr = async (actor, role, to, extra = {}) => transition({ dir: dirs.s4, taskId, actorId: actor, requesterRole: role, expectedRevision: (await getState({ dir: dirs.s4, taskId })).revision, toState: to, now, ...extra });
  await claim({ dir: dirs.s4, taskId, actorId: "planner", leaseDurationMs: leaseMs, now });
  await tr("planner", "BUILDER", "PLANNING");
  await tr("planner", "BUILDER", "READY_FOR_BUILD", { evidenceRef: { ref: "plan:s6-test" } });
  await claim({ dir: dirs.s4, taskId, actorId: builder, leaseDurationMs: leaseMs, now: Date.now() });
  const building = await tr(builder, "BUILDER", "BUILDING");
  const anchor = { ...building, lease_expires_at: (await getState({ dir: dirs.s4, taskId })).lease_expires_at };

  const builderTrust = trustedHost({ actorId: builder, actorRole: "Builder" });
  const hostConfig = (over = {}) => ({
    workspaceRoot: dirs.workspace,
    hostStateDir: dirs.state,
    project: PROJECT,
    repository: REPOSITORY,
    remote: dirs.remote,
    baseRef: "refs/heads/main",
    transportAuthorizationRef: TRANSPORT_REF,
    gateway: gatewayFor(dirs.workspace, builderTrust, { policies }),
    policyVersion: POLICY_VERSION,
    s4Dir: dirs.s4,
    resolveContract: (ref) => {
      if (ref !== contractRef) throw new Error("unknown contract");
      return fs.readFileSync(contractPath, "utf8");
    },
    toolchainPath: TOOLCHAIN,
    ignoredOutputAllowlist: ["node_modules/", "build-output/"],
    quiesceDeadlineMs: 1500,
    ...over,
  });
  return {
    dirs, env, baseSha, taskId, contractRef, contractPath, anchor, builder, ci, builderTrust, hostConfig,
    host: (over) => createExecutionHost(hostConfig(over)),
    s4: { claim, getState, transition },
  };
}

export function cleanupWorld(world) {
  fs.rmSync(world.dirs.top, { recursive: true, force: true });
}

// Moves the S4 task from READY_FOR_QA into QA for `qaActor`; returns the chain.
export async function qaClaimChain(world, qaActor = "qa-1") {
  const { s4, dirs, taskId } = world;
  const c = await s4.claim({ dir: dirs.s4, taskId, actorId: qaActor, leaseDurationMs: 600000 });
  const t = await s4.transition({ dir: dirs.s4, taskId, actorId: qaActor, requesterRole: "QA", expectedRevision: c.revision, toState: "QA" });
  return [c, { ...t, lease_expires_at: c.lease_expires_at }];
}
