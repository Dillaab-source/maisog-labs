// S6 Isolated Execution V1 core -- lifecycle host library (ML-DEVOS-RFC-019
// §3-§17, §13.1; ML-DEVOS-AS-093; D-071).
//
// create -> validate -> attach -> permit/claim/report -> quiesce -> complete
// -> cleanup, plus QA creation, recovery and quarantine. Environment states,
// never task states: S4 remains the only task state machine and the fencing
// authority. S6 issues exactly one S4 mutation -- the Builder publication
// BUILDING -> READY_FOR_QA transition, as the owner's agent -- and only when
// the owner requests complete().
//
// S6 core exposes NO command-execution primitive (D-069). Actor/tool commands
// are data inside Execution Requests; a separately authorized execution
// driver (not part of S6, not authorized by D-071) would run them under a
// single-use Execution Permit and report back. S6 only issues permits, checks
// S5 at issuance and again at claim, verifies reports, and PROVES quiescence
// by read-only inspection.
//
// MAY / CAN / ISOLATED stay separate: governance authority is consumed by
// reference, S5 decisions are consumed verbatim (S5 is not argv-aware), and
// isolation is this library's own proof. Isolation != Authority.
import fs from "node:fs";
import path from "node:path";

import { validateTaskContract } from "../contracts/validate-task-contract.mjs";
import { getState, transition } from "../state/kernel.mjs";
import { sha256 } from "./digest.mjs";
import {
  buildInstanceEnvironment, environmentDigest, environmentFailures, instanceGitConfig, instanceNpmrc, instancePaths,
  localConfigFailures, scanCredentialFiles,
} from "./environment.mjs";
import { git, statusEntries, tryGit } from "./git.mjs";
import {
  adoptS4Result, buildExecutionIdentity, fencingFailures, identityDigest, initialCheckpoint, newId128, taskBranchName,
} from "./identity.mjs";
import { Journal } from "./journal.mjs";
import { createLivenessInspector, proveGroupsEmpty } from "./liveness.mjs";
import {
  createDirChain, createFileExclusive, isWithin, removeTreeNoFollow, toCanonical, verifiedBase, verifyChain,
} from "./paths.mjs";
import {
  argvDigest, buildPermitBody, expectedShellIntent, parsePermitBody, requestShellDecision, validateReport, validateRequest,
  verifyClaimResult, verifyIssuanceResult,
} from "./permits.mjs";
import { detectPlatformProfile, profileFailures } from "./platform.mjs";
import { Registry } from "./registry.mjs";
import { buildPublicationPayload, buildRtrBody, storedEvidenceRef, transferIdOf, verifyAdjacency } from "./rtr.mjs";
import { createTransport } from "./transport.mjs";
import {
  EVIDENCE_CLASS, ExecutionError, HEX40, ISOLATION_LEVEL, NON_AUTHORITY_DISCLAIMER, ROLES, fail, selectReason,
} from "./vocabulary.mjs";

const CONSEQUENCE_FLAGS = [
  "remote_resources_involved", "protected_main_or_deploy_in_scope", "production_write_in_scope",
  "credential_or_security_in_scope", "destructive_actions_in_scope",
];
const LIVE_STATES = new Set(["CREATING", "READY", "ATTACHED", "QUIESCED"]);

function failWith(codes, detail) {
  const code = selectReason(codes);
  if (code) fail(code, detail ?? codes.join(", "));
}

function insideGitTree(dir) {
  for (let d = dir; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, ".git"))) return true;
    if (path.dirname(d) === d) return false;
  }
}

// S3 scope by reference: "dir/" is a prefix; any other entry matches exactly or
// as a directory. Glob characters cannot be interpreted safely -> fail closed.
export function pathInScope(file, entries) {
  return (entries ?? []).some((e) => {
    if (/[*?[\]]/.test(e)) return false;
    return e.endsWith("/") ? file.startsWith(e) : file === e || file.startsWith(`${e}/`);
  });
}

export function scopeFailures(files, scope) {
  if ((scope?.allowed_paths ?? []).some((e) => /[*?[\]]/.test(e))) return ["SCOPE_VIOLATION"];
  for (const f of files) {
    if (!pathInScope(f, scope.allowed_paths) || pathInScope(f, scope.prohibited_paths)) return ["SCOPE_VIOLATION"];
  }
  return [];
}

function kernelCode(err) {
  switch (err?.code) {
    case "NOT_CURRENT_OWNER": return "OWNER_MISMATCH";
    case "REVISION_CONFLICT": return "FENCING_REVISION_MISMATCH";
    case "IDEMPOTENCY_CONFLICT": return "RESULT_TRANSFER_UNPROVEN";
    default: return "INSTANCE_STALE";
  }
}

export function createExecutionHost(config) {
  const cfg = { environment: "local", ignoredOutputAllowlist: [], maxCreateAttempts: 2, claimWindowMs: 5 * 60 * 1000, clock: Date.now, ...config };
  for (const k of ["workspaceRoot", "hostStateDir", "project", "repository", "remote", "baseRef", "s4Dir", "policyVersion"]) {
    if (typeof cfg[k] !== "string" || cfg[k].length === 0) fail("MALFORMED_REQUEST", `host configuration ${k} is required`);
  }
  if (typeof cfg.resolveContract !== "function") fail("MALFORMED_REQUEST", "host configuration resolveContract() is required");
  if (!Array.isArray(cfg.toolchainPath) || cfg.toolchainPath.length === 0) fail("MALFORMED_REQUEST", "host configuration toolchainPath is required");

  const windows = process.platform === "win32";
  const pathOpts = { windows };
  const clock = () => cfg.clock();
  const step = async (name, ctx) => cfg.faults?.onStep?.(name, ctx);
  const registry = new Registry(cfg.hostStateDir);
  const slug = cfg.project.replaceAll("/", "__");
  const bootEnv = () => ({ PATH: cfg.toolchainPath.join(windows ? ";" : ":"), GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: windows ? "NUL" : "/dev/null", GIT_TERMINAL_PROMPT: "0", HOME: cfg.hostStateDir });

  // ------------------------------------------------------------ workspace root
  function rootState() {
    let real;
    try {
      real = fs.realpathSync.native(cfg.workspaceRoot);
    } catch {
      return { codes: ["WORKSPACE_ROOT_INVALID"] };
    }
    const canonical = toCanonical(real, pathOpts);
    let stateCanonical = null;
    try {
      stateCanonical = toCanonical(fs.realpathSync.native(cfg.hostStateDir), pathOpts);
    } catch {
      stateCanonical = null;
    }
    const bad = canonical === null || !path.isAbsolute(cfg.workspaceRoot) || toCanonical(cfg.workspaceRoot, pathOpts) !== canonical
      || !fs.statSync(real).isDirectory() || insideGitTree(real)
      || (stateCanonical && (isWithin(stateCanonical, canonical, pathOpts) || isWithin(canonical, stateCanonical, pathOpts)));
    return bad ? { codes: ["WORKSPACE_ROOT_INVALID"] } : { codes: [], native: real, canonical };
  }

  // The filesystem probe runs only inside a valid workspace root, and only a
  // probed profile is cached.
  let profile = cfg.platformProfile ?? null;
  function platformProfile() {
    if (profile) return profile;
    const probeDir = rootState().native;
    const detected = detectPlatformProfile({ probeDir, gitVersionText: tryGit(["--version"], { env: bootEnv() }) });
    if (probeDir) profile = detected;
    return detected;
  }
  function platformCodes(root) {
    if (cfg.platformProfile || root.codes.length === 0) return profileFailures(platformProfile());
    return profileFailures(platformProfile(), { probed: false });
  }
  const inspector = () => cfg.livenessInspector ?? createLivenessInspector(platformProfile().liveness_proof);

  // ------------------------------------------------------------ helpers
  const journalOf = (record) => new Journal(registry.journalPath(record.instance_id), record.identity_digest, clock);
  const instEntry = (record) => record.chain.find((c) => c.canonical === record.identity.workspace_path);
  const pathsFor = (record) => instancePaths(instEntry(record)?.native ?? "");
  const envFor = (p) => buildInstanceEnvironment({ paths: p, toolchainPath: cfg.toolchainPath, windows, windowsSystemEnv: cfg.windowsSystemEnv ?? {} });
  const repoCanonical = (record) => `${record.identity.workspace_path}/repo`;

  function transportFor(journal) {
    return createTransport({
      project: cfg.project, remote: cfg.remote, authorizationRef: cfg.transportAuthorizationRef, gateway: cfg.gateway,
      policyVersion: cfg.policyVersion, environment: cfg.environment, onDecision: (d) => journal?.append("S5_DECISION", d),
    });
  }

  function resolveContract(contractRef) {
    let bytes;
    try {
      bytes = cfg.resolveContract(contractRef);
    } catch {
      fail("TASK_CONTRACT_MISMATCH", `contract ${contractRef} cannot be resolved`);
    }
    if (typeof bytes !== "string") fail("TASK_CONTRACT_MISMATCH", "contract bytes unavailable");
    let contract;
    try {
      contract = JSON.parse(bytes);
    } catch {
      fail("TASK_CONTRACT_MISMATCH", "contract is not JSON");
    }
    const v = validateTaskContract(contract);
    if (!v.ok) fail("TASK_CONTRACT_MISMATCH", `S3 validation failed: ${v.errors[0]}`);
    return { contract, digest: sha256(bytes) };
  }

  const treeSnapshot = (repo, env) => sha256(`${tryGit(["rev-parse", "HEAD"], { cwd: repo, env }) ?? ""}\n${statusEntries(repo, env).join("\0")}`);
  const save = (record) => {
    registry.putInstance(record);
    return record;
  };

  function loadRecord(instanceId) {
    const r = registry.findInstance(instanceId);
    if (!r || !r.identity) fail("MALFORMED_REQUEST", `unknown instance ${instanceId}`);
    return r;
  }

  function markStale(record, reason) {
    if (record.stale) return;
    record.stale = true;
    record.stale_reason = reason;
    save(record);
    try {
      journalOf(record).append("STALE", { reason });
    } catch {
      // the stale flag stands on its own
    }
  }

  function quarantine(record, reason) {
    record.state = "QUARANTINED";
    record.quarantine_reason = reason;
    save(record);
    try {
      journalOf(record).append("QUARANTINE", { reason });
    } catch {
      // the quarantine flag stands on its own
    }
    revokeIssued(record, "QUARANTINE");
  }

  // ------------------------------------------------------------ permit status
  function permitsOf(record) {
    return registry.listPermits(record.task_id).filter((p) => p.status?.instance_id === record.instance_id);
  }

  // Lazy expiry: an ISSUED permit past its claim deadline is EXPIRED_UNCLAIMED.
  // Time NEVER moves a CLAIMED permit anywhere (AS90-F001).
  function currentPermitStatus(taskId, permitId) {
    const s = registry.getPermitStatus(taskId, permitId);
    if (s && s.state === "ISSUED" && clock() >= s.claim_deadline_ms) {
      const next = { ...s, state: "EXPIRED_UNCLAIMED", updated_at: new Date(clock()).toISOString() };
      registry.putPermitStatus(taskId, permitId, next);
      return next;
    }
    return s;
  }

  function revokeIssued(record, reason) {
    for (const { permit_id: id } of permitsOf(record)) {
      const s = currentPermitStatus(record.task_id, id);
      if (s?.state === "ISSUED") {
        registry.putPermitStatus(record.task_id, id, { ...s, state: "REVOKED", revocation_reason: reason, updated_at: new Date(clock()).toISOString() });
        try {
          journalOf(record).append("PERMIT_REVOKED", { permit_id: id, reason });
        } catch {
          // revocation stands on its own
        }
      }
    }
  }

  // QA source proof (§7.1 step 6).
  function proveQaSource(taskId, qaChain, observed) {
    if (!Array.isArray(qaChain) || qaChain.length < 2) fail("RESULT_TRANSFER_UNPROVEN", "QA must present its claim and READY_FOR_QA->QA results");
    const qaActor = qaChain[0].owner;
    const start = qaChain[0].revision - 1;
    const matches = registry.listRtr(taskId).filter((r) => r.status?.status === "COMMITTED" && r.status.post_revision === start);
    if (matches.length !== 1) fail("RESULT_TRANSFER_UNPROVEN", `expected exactly one COMMITTED record at revision ${start}, found ${matches.length}`);
    qaChain.forEach((r, i) => {
      if (r.taskId !== taskId || r.owner !== qaActor || r.revision !== start + 1 + i) fail("RESULT_TRANSFER_UNPROVEN", "QA revision chain is gapped or contains a non-QA mutation");
    });
    const last = qaChain[qaChain.length - 1];
    if (observed.revision !== last.revision || observed.owner !== qaActor || observed.state !== "QA") fail("RESULT_TRANSFER_UNPROVEN", "S4 no longer matches the presented QA chain");
    const bodyBytes = registry.readRtrBody(taskId, matches[0].transfer_id);
    if (!bodyBytes || sha256(bodyBytes) !== matches[0].status.rtr_digest) fail("RESULT_TRANSFER_UNPROVEN", "committed record body is missing or altered");
    const { body } = storedEvidenceRef(bodyBytes);
    if (body.owner === qaActor) fail("QA_INDEPENDENCE_VIOLATION", "the QA actor is the Builder that produced the result");
    return body;
  }

  // =================================================================== create
  async function createInstance({ role, claimResult, qaChain = null, idempotencyKey = null } = {}) {
    if (!ROLES.includes(role)) fail("MALFORMED_REQUEST", "role must be BUILDER or QA");
    const anchor = role === "QA" ? qaChain?.[qaChain.length - 1] : claimResult;
    if (!anchor || typeof anchor !== "object" || typeof anchor.owner !== "string" || !Number.isInteger(anchor.revision)) fail("MALFORMED_REQUEST", "a successful S4 claim/renew result is required");
    const root = rootState();
    failWith([...platformCodes(root), ...root.codes], "platform profile / workspace root");

    const taskId = anchor.taskId;
    const observed = await getState({ dir: cfg.s4Dir, taskId });
    if (!observed) fail("TASK_CONTRACT_MISMATCH", `no S4 record for ${taskId}`);
    const { contract, digest: contractDigest } = resolveContract(observed.contract_ref);
    if (contract.task_id !== taskId || contract.project !== cfg.project) fail("TASK_CONTRACT_MISMATCH", "contract task_id/project differ from the S4 task / configured project");
    if (CONSEQUENCE_FLAGS.some((f) => contract.scope[f] === true)) fail("ISOLATION_PROFILE_INSUFFICIENT", "V1 (L3) refuses contracts with any consequence flag true");
    if (!cfg.repository.toLowerCase().endsWith(`/${cfg.project.toLowerCase()}`)) fail("REPOSITORY_MISMATCH", "configured repository is not the contract project");
    failWith(fencingFailures({ owner: anchor.owner, role }, { current_revision: anchor.revision }, observed, clock()), "S4 fencing at create");
    const qaBody = role === "QA" ? proveQaSource(taskId, qaChain, observed) : null;

    const bindingKey = `${taskId}\n${role}\n${anchor.owner}\n${anchor.revision}`;
    if (idempotencyKey !== null) {
      const prior = registry.readJson(registry.keyFile(taskId, "create-keys", idempotencyKey));
      if (prior) {
        if (prior.binding !== bindingKey) fail("MALFORMED_REQUEST", "idempotency key reused with different bindings");
        const v = await validateInstance(prior.instance_id);
        if (v.outcome !== "PROVEN") fail(v.reason, "replayed instance no longer validates");
        return loadRecord(prior.instance_id);
      }
    }
    const attemptsFile = registry.keyFile(taskId, "attempts", bindingKey);
    const attempts = registry.readJson(attemptsFile) ?? { count: 0, last_code: null };
    if (attempts.count >= cfg.maxCreateAttempts) fail(attempts.last_code ?? "ISOLATION_UNPROVABLE", "environment creation attempts exhausted");
    transportFor(null).authorize();

    const pending = [];
    const baseSha = role === "QA" ? qaBody.result_commit_sha : createTransport({
      project: cfg.project, remote: cfg.remote, authorizationRef: cfg.transportAuthorizationRef, gateway: cfg.gateway,
      policyVersion: cfg.policyVersion, environment: cfg.environment, onDecision: (d) => pending.push(d),
    }).lsRemote(cfg.baseRef, bootEnv());
    if (!baseSha || !HEX40.test(baseSha)) fail("BASE_UNAVAILABLE", `base ${cfg.baseRef} cannot be resolved on the remote`);

    const instanceId = newId128();
    const taskBranch = taskBranchName(taskId, role, instanceId);
    let chain = null;
    let record = null;
    try {
      const base = verifiedBase(root.native, pathOpts);
      const parentChain = createDirChain(base, [slug, taskId], pathOpts);
      const inst = createDirChain(parentChain[parentChain.length - 1], [instanceId], { ...pathOpts, exclusiveLast: true })[1];
      const subs = ["repo", "home", "tmp", "cache", "config"].map((s) => createDirChain(inst, [s], pathOpts)[1]);
      const hooks = createDirChain(subs[4], ["hooks"], pathOpts)[1];
      chain = [...parentChain, inst, ...subs, hooks];
      const p = instancePaths(inst.native);
      createFileExclusive(subs[4], "gitconfig", instanceGitConfig({ hooksDir: p.hooks }));
      createFileExclusive(subs[4], "npmrc", instanceNpmrc({ cacheDir: path.join(p.cache, "npm") }));
      const env = envFor(p);
      failWith(environmentFailures(env, { windows, instanceRoot: inst.canonical, toolchainPath: cfg.toolchainPath }), "instance environment");

      const identity = buildExecutionIdentity({
        project: cfg.project, repository: cfg.repository, task_id: taskId, contract_ref: observed.contract_ref, contract_digest: contractDigest,
        role, owner: anchor.owner, anchor_revision: anchor.revision, base_ref: role === "QA" ? `s6-rtr:${qaBody.transfer_id}` : cfg.baseRef,
        base_sha: baseSha, task_branch: taskBranch, instance_id: instanceId, workspace_path: inst.canonical, platform_profile: platformProfile(),
      });
      record = {
        task_id: taskId, instance_id: instanceId, identity, identity_digest: identityDigest(identity),
        checkpoint: initialCheckpoint({ ...anchor }, "claim"), state: "CREATING", chain, reported_pgids: [],
        tree_snapshot: null, pushed_sha: null, stale: false, stale_reason: null, quarantine_reason: null,
        qa_source_transfer_id: qaBody?.transfer_id ?? null,
      };
      save(record);
      const journal = journalOf(record);
      journal.append("CREATE_BEGIN", { identity_digest: record.identity_digest, platform_profile: identity.platform_profile });
      for (const d of pending) journal.append("S5_DECISION", d);
      await step("after-create-begin", { record });

      const t = transportFor(journal);
      if (t.lsRemote(`refs/heads/${taskBranch}`, env) !== null) fail("BRANCH_COLLISION", `${taskBranch} already exists on the remote`);
      t.clone(p.repo, env);
      t.fetchSha(p.repo, baseSha, env);
      if (tryGit(["checkout", "--quiet", "--detach", baseSha], { cwd: p.repo, env }) === null) fail("BASE_UNAVAILABLE", "cannot check out the base commit");
      if (tryGit(["switch", "--quiet", "-c", taskBranch], { cwd: p.repo, env }) === null) fail("BRANCH_COLLISION", `cannot create ${taskBranch} locally`);
      if (git(["rev-parse", "HEAD"], { cwd: p.repo, env }) !== baseSha) fail("BASE_SHA_MISMATCH", "HEAD is not the pinned base");
      if (role === "QA") {
        if (git(["rev-parse", `${baseSha}^{tree}`], { cwd: p.repo, env }) !== qaBody.result_tree_sha) fail("RESULT_TRANSFER_UNPROVEN", "fetched tree differs from the recorded result tree");
        if (tryGit(["merge-base", "--is-ancestor", qaBody.base_sha, baseSha], { cwd: p.repo, env }) === null) fail("BASE_SHA_MISMATCH", "recorded base is not an ancestor of the result");
      }
      verifyChain(chain, pathOpts);
      const tracked = new Set(git(["ls-files", "-z"], { cwd: p.repo, env }).split("\0").filter(Boolean).map((f) => `repo/${f}`));
      failWith([
        ...localConfigFailures(git(["config", "--file", path.join(p.repo, ".git", "config"), "--list"], { env }).split("\n").filter(Boolean), { expectedRemoteUrl: cfg.remote }),
        ...(statusEntries(p.repo, env).length ? ["DIRTY_WORKTREE"] : []),
        ...(scanCredentialFiles(inst.native, { tracked }).length ? ["SECRET_MATERIAL_DETECTED"] : []),
      ], "post-clone verification");
      record.tree_snapshot = treeSnapshot(p.repo, env);
      record.state = "READY";
      save(record);
      journal.append("READY", { base_sha: baseSha, task_branch: taskBranch, tree_snapshot: record.tree_snapshot });
      if (idempotencyKey !== null) {
        const kf = registry.keyFile(taskId, "create-keys", idempotencyKey);
        registry.writeJson(path.dirname(kf), path.basename(kf), { binding: bindingKey, instance_id: instanceId });
      }
      return record;
    } catch (err) {
      const code = err instanceof ExecutionError ? err.code : "ISOLATION_UNPROVABLE";
      if (chain || record) {
        attempts.count += 1;
        attempts.last_code = code;
        registry.writeJson(path.dirname(attemptsFile), path.basename(attemptsFile), attempts);
        if (record) quarantine(record, code);
      }
      if (err instanceof ExecutionError) throw err;
      throw new ExecutionError("ISOLATION_UNPROVABLE", String(err.message));
    }
  }

  // ================================================================= validate
  // Every check runs every time, so the reported code is the lowest-ranked of
  // ALL failing checks (§14).
  async function validateInstance(instanceId) {
    let record;
    try {
      record = loadRecord(instanceId);
    } catch {
      return { outcome: "FAILED", reason: "MALFORMED_REQUEST", codes: ["MALFORMED_REQUEST"] };
    }
    const codes = [];
    const push = (...c) => codes.push(...c);
    const root = rootState();
    push(...platformCodes(root), ...root.codes);
    if (record.stale || !LIVE_STATES.has(record.state)) push("INSTANCE_STALE");
    if (identityDigest(record.identity) !== record.identity_digest) push("ISOLATION_UNPROVABLE");
    try {
      journalOf(record).replay();
    } catch {
      push("ISOLATION_UNPROVABLE");
    }
    try {
      verifyChain(record.chain, pathOpts);
    } catch (e) {
      push(e.code ?? "ISOLATION_UNPROVABLE");
    }
    const observed = await getState({ dir: cfg.s4Dir, taskId: record.task_id });
    push(...fencingFailures(record.identity, record.checkpoint, observed, clock()));
    try {
      const { contract, digest } = resolveContract(record.identity.contract_ref);
      if (digest !== record.identity.contract_digest || contract.task_id !== record.task_id) push("TASK_CONTRACT_MISMATCH");
    } catch (e) {
      push(e.code ?? "TASK_CONTRACT_MISMATCH");
    }
    const p = pathsFor(record);
    const env = envFor(p);
    push(...environmentFailures(env, { windows, instanceRoot: record.identity.workspace_path, toolchainPath: cfg.toolchainPath }));
    try {
      push(...localConfigFailures(git(["config", "--file", path.join(p.repo, ".git", "config"), "--list"], { env }).split("\n").filter(Boolean), { expectedRemoteUrl: cfg.remote }));
      if (git(["symbolic-ref", "--short", "HEAD"], { cwd: p.repo, env }) !== record.identity.task_branch) push("INSTANCE_STALE");
      if (tryGit(["merge-base", "--is-ancestor", record.identity.base_sha, "HEAD"], { cwd: p.repo, env }) === null) push("BASE_SHA_MISMATCH");
      const tracked = new Set(git(["ls-files", "-z"], { cwd: p.repo, env }).split("\0").filter(Boolean).map((f) => `repo/${f}`));
      if (scanCredentialFiles(p.root, { tracked, skipDirs: new Set([".git", "node_modules"]) }).length) push("SECRET_MATERIAL_DETECTED");
      if (treeSnapshot(p.repo, env) !== record.tree_snapshot) push("DIRTY_WORKTREE");
    } catch (e) {
      push(e instanceof ExecutionError ? e.code : "ISOLATION_UNPROVABLE");
    }
    const reason = selectReason(codes);
    if (reason && ["OWNER_MISMATCH", "FENCING_REVISION_MISMATCH", "INSTANCE_STALE"].includes(reason) && LIVE_STATES.has(record.state)) markStale(record, reason);
    return reason ? { outcome: "FAILED", reason, codes: [...new Set(codes)] } : { outcome: "PROVEN", reason: null, codes: [] };
  }

  async function requireProven(instanceId) {
    const v = await validateInstance(instanceId);
    if (v.outcome !== "PROVEN") fail(v.reason, `validation failed: ${v.codes.join(", ")}`);
    return loadRecord(instanceId);
  }

  // =================================================================== attach
  async function attach(instanceId, { actorId } = {}) {
    const record = await requireProven(instanceId);
    if (actorId !== record.identity.owner) fail("OWNER_MISMATCH", "only the identity owner may attach");
    if (!["READY", "QUIESCED"].includes(record.state)) fail("INSTANCE_STALE", `cannot attach from ${record.state}`);
    record.state = "ATTACHED";
    save(record);
    journalOf(record).append("ATTACH", { actor: actorId });
    return record;
  }

  // ===================================================== renew (checkpoint)
  async function adoptRenewal(instanceId, { result, adoptedFrom = "renew" } = {}) {
    const record = loadRecord(instanceId);
    const observed = await getState({ dir: cfg.s4Dir, taskId: record.task_id });
    try {
      record.checkpoint = adoptS4Result(record.checkpoint, record.identity, result, adoptedFrom, observed);
    } catch (e) {
      if (e instanceof ExecutionError && e.code === "INSTANCE_STALE") markStale(record, e.detail);
      throw e;
    }
    save(record);
    journalOf(record).append("CHECKPOINT", { current_revision: record.checkpoint.current_revision, adopted_from: adoptedFrom });
    return record.checkpoint;
  }

  // ============================================================ permits (§13.1)
  function bindingOf(record, request) {
    const p = pathsFor(record);
    return {
      checkpoint_revision: request.checkpoint_revision,
      argv_digest: argvDigest(request.argv),
      cwd: repoCanonical(record),
      environment_digest: environmentDigest(envFor(p)),
    };
  }

  const sameBinding = (a, b) => ["checkpoint_revision", "argv_digest", "cwd", "environment_digest"].every((k) => a[k] === b[k]);

  function permitView(record, permitId) {
    const status = currentPermitStatus(record.task_id, permitId);
    const permit = parsePermitBody(registry.readPermitBody(record.task_id, permitId), status?.permit_digest);
    return { permit_id: permitId, state: status.state, revocation_reason: status.revocation_reason ?? null, permit, report: status.report ?? null };
  }

  // Request -> (exact replay | conflict | validate + S5 at issuance -> permit).
  async function requestPermit(request) {
    validateRequest(request);
    const record = loadRecord(request.instance_id);
    const want = bindingOf(record, request);
    const prior = registry.readBinding(record.task_id, record.instance_id, request.request_id);
    if (prior) {
      if (!sameBinding(prior, want)) fail("MALFORMED_REQUEST", "request_id reused with a different binding");
      return { replay: true, ...permitView(record, prior.permit_id) }; // no S5 call, no new permit
    }
    if (record.state !== "ATTACHED") fail("INSTANCE_STALE", "permits are issued only for an attached instance");
    await requireProven(record.instance_id);
    if (request.checkpoint_revision !== record.checkpoint.current_revision) fail("FENCING_REVISION_MISMATCH", "request checkpoint_revision is not the current fencing checkpoint");
    const intent = expectedShellIntent({ project: cfg.project, repoCanonical: repoCanonical(record), environment: cfg.environment, policyVersion: cfg.policyVersion });
    const journal = journalOf(record);
    let s5;
    try {
      s5 = verifyIssuanceResult(requestShellDecision(cfg.gateway, intent), { expectedIntent: intent, identity: record.identity });
    } catch (e) {
      journal.append("PERMIT_DENIED", { request_id: request.request_id, code: e.code ?? "CAPABILITY_DENIED" });
      throw e;
    }
    return registry.withTaskLock(record.task_id, async () => {
      const raced = registry.readBinding(record.task_id, record.instance_id, request.request_id);
      if (raced) {
        if (!sameBinding(raced, want)) fail("MALFORMED_REQUEST", "request_id reused with a different binding");
        return { replay: true, ...permitView(record, raced.permit_id) };
      }
      const permitId = newId128();
      const now = clock();
      const bytes = buildPermitBody({
        permitId, instanceId: record.instance_id, requestId: request.request_id, identityDigest: record.identity_digest,
        checkpointRevision: request.checkpoint_revision, argvDigest: want.argv_digest, cwd: want.cwd, environmentDigest: want.environment_digest,
        s5, issuedAt: new Date(now).toISOString(), claimDeadline: new Date(now + cfg.claimWindowMs).toISOString(),
      });
      const permitDigest = sha256(bytes);
      registry.writePermitBody(record.task_id, permitId, bytes);
      registry.putPermitStatus(record.task_id, permitId, {
        instance_id: record.instance_id, state: "ISSUED", revocation_reason: null, permit_digest: permitDigest,
        claim_deadline_ms: now + cfg.claimWindowMs, updated_at: new Date(now).toISOString(),
      });
      registry.writeBinding(record.task_id, record.instance_id, request.request_id, { ...want, permit_id: permitId, permit_digest: permitDigest });
      journal.append("PERMIT_ISSUED", { permit_id: permitId, permit_digest: permitDigest, request_id: request.request_id });
      await step("after-permit-issued", { permitId });
      return { replay: false, ...permitView(record, permitId) };
    });
  }

  // The driver claims: every check, then (last) the fresh S5 recheck.
  async function claimPermit({ permitId, request } = {}) {
    validateRequest(request);
    const record = loadRecord(request.instance_id);
    const status = currentPermitStatus(record.task_id, permitId);
    if (!status || status.instance_id !== record.instance_id) fail("ISOLATION_UNPROVABLE", "unknown permit for this instance");
    const permit = parsePermitBody(registry.readPermitBody(record.task_id, permitId), status.permit_digest);
    if (status.state !== "ISSUED") fail("ISOLATION_UNPROVABLE", `permit is ${status.state}, not ISSUED`);
    if (permit.request_id !== request.request_id || permit.argv_digest !== argvDigest(request.argv)) fail("ISOLATION_UNPROVABLE", "claim does not match the permitted request");
    const observed = await getState({ dir: cfg.s4Dir, taskId: record.task_id });
    const f = fencingFailures(record.identity, record.checkpoint, observed, clock());
    if (f.length) failWith(f, "S4 fencing at claim");
    if (record.stale || record.state !== "ATTACHED") fail("INSTANCE_STALE", "instance is not attached");
    const journal = journalOf(record);
    const invalidate = (e) => {
      registry.putPermitStatus(record.task_id, permitId, { ...status, state: "REVOKED", revocation_reason: "CAPABILITY_INVALIDATED", updated_at: new Date(clock()).toISOString() });
      journal.append("CLAIM_S5_CHECK", { permit_id: permitId, permit_digest: status.permit_digest, outcome: "DENIED", code: e.code ?? "CAPABILITY_DENIED", detail: e.detail ?? String(e.message) });
      throw e instanceof ExecutionError ? e : new ExecutionError("CAPABILITY_DENIED", String(e.message));
    };
    let check;
    try {
      check = verifyClaimResult(requestShellDecision(cfg.gateway, permit.s5_request_intent), { permit, identity: record.identity });
    } catch (e) {
      invalidate(e);
    }
    return registry.withTaskLock(record.task_id, async () => {
      const again = registry.getPermitStatus(record.task_id, permitId);
      if (again.state !== "ISSUED") fail("ISOLATION_UNPROVABLE", `permit became ${again.state} before claim`);
      registry.putPermitStatus(record.task_id, permitId, { ...again, state: "CLAIMED", claimed_at: new Date(clock()).toISOString(), updated_at: new Date(clock()).toISOString() });
      journal.append("CLAIM_S5_CHECK", { permit_id: permitId, permit_digest: status.permit_digest, outcome: "ALLOW", ...check });
      journal.append("PERMIT_CLAIMED", { permit_id: permitId, permit_digest: status.permit_digest });
      return { permit, cwd: pathsFor(record).repo, environment: envFor(pathsFor(record)) };
    });
  }

  async function recordReport(report) {
    validateReport(report);
    const record = loadRecord(report.instance_id);
    const status = registry.getPermitStatus(record.task_id, report.permit_id);
    if (!status || status.instance_id !== record.instance_id) fail("ISOLATION_UNPROVABLE", "report for an unknown permit");
    const permit = parsePermitBody(registry.readPermitBody(record.task_id, report.permit_id), status.permit_digest);
    if (status.state !== "CLAIMED") fail("ISOLATION_UNPROVABLE", `report for a permit that is ${status.state}, not CLAIMED`);
    if (report.argv_digest !== permit.argv_digest || report.environment_digest !== permit.environment_digest) fail("ISOLATION_UNPROVABLE", "report digests do not match the permit");
    const summary = { process_groups: report.process_groups, exit_code: report.exit_code ?? null, terminated: report.terminated, stdout_digest: report.stdout_digest ?? null, stderr_digest: report.stderr_digest ?? null };
    registry.putPermitStatus(record.task_id, report.permit_id, { ...status, state: "REPORTED", report: summary, updated_at: new Date(clock()).toISOString() });
    const journal = journalOf(record);
    if (record.state === "QUARANTINED") {
      journal.append("LATE_REPORT", { permit_id: report.permit_id, ...summary }); // evidence only; never un-quarantines
      return { recorded: true, quarantined: true };
    }
    record.reported_pgids = [...new Set([...record.reported_pgids, ...report.process_groups])];
    const p = pathsFor(record);
    record.tree_snapshot = treeSnapshot(p.repo, envFor(p));
    save(record);
    journal.append("REPORT", { permit_id: report.permit_id, permit_digest: status.permit_digest, ...summary, tree_snapshot: record.tree_snapshot });
    return { recorded: true, quarantined: false };
  }

  // ================================================================== quiesce
  async function quiesce(instanceId) {
    const record = loadRecord(instanceId);
    if (!["ATTACHED", "READY"].includes(record.state)) fail("INSTANCE_STALE", `cannot quiesce from ${record.state}`);
    revokeIssued(record, "QUIESCE");
    const claimed = permitsOf(record).filter((p) => currentPermitStatus(record.task_id, p.permit_id)?.state === "CLAIMED");
    if (claimed.length) {
      journalOf(record).append("QUIESCE_FAILED", { claimed_unreported: claimed.map((p) => p.permit_id) });
      fail("QUIESCE_UNPROVEN", "a claimed permit has no verified report (execution uncertain)");
    }
    const q = await proveGroupsEmpty(record.reported_pgids, { inspector: inspector(), deadlineMs: cfg.quiesceDeadlineMs ?? 2000 });
    if (!q.proven) {
      journalOf(record).append("QUIESCE_FAILED", { survivors: q.survivors });
      fail("QUIESCE_UNPROVEN", `reported process groups still alive: ${q.survivors.join(", ")}`);
    }
    const p = pathsFor(record);
    record.tree_snapshot = treeSnapshot(p.repo, envFor(p));
    record.state = "QUIESCED";
    save(record);
    journalOf(record).append("QUIESCE", { tree_snapshot: record.tree_snapshot, proven_groups: record.reported_pgids });
    return record;
  }

  // ========================================================= publication core
  async function publish(record, bodyBytes, transferId) {
    const { evidenceRef, body } = storedEvidenceRef(bodyBytes);
    const journal = journalOf(record);
    journal.append("TRANSITION_ATTEMPT", { transfer_id: transferId, expected_revision: body.pre_revision });
    let result;
    try {
      result = await transition({
        dir: cfg.s4Dir, taskId: record.task_id, actorId: record.identity.owner, requesterRole: "BUILDER",
        expectedRevision: body.pre_revision, toState: "READY_FOR_QA", idempotencyKey: transferId,
        evidenceRef, // JSON.parse of the stored bytes -- never rebuilt from fields (§7.1.1)
      });
    } catch (err) {
      const code = kernelCode(err);
      registry.putRtrStatus(record.task_id, transferId, { status: "ABORTED", post_revision: null, rtr_digest: sha256(bodyBytes), reason: err.code ?? String(err.message) });
      journal.append("RTR_ABORTED", { transfer_id: transferId, reason: err.code ?? "error", remote_ref: evidenceRef.remote_ref, disposition: "STALE_UNPUBLISHED" });
      markStale(record, code);
      fail(code, `S4 rejected the publication transition: ${err.code ?? err.message}`);
    }
    await step("after-transition", { record, transferId });
    const post = body.pre_revision + 1;
    const observed = await getState({ dir: cfg.s4Dir, taskId: record.task_id });
    const ok = result.revision === post && result.state === "READY_FOR_QA" && result.owner === null
      && observed && (observed.revision === post ? observed.state === "READY_FOR_QA" && observed.owner === null : observed.revision > post);
    if (!ok) fail("RESULT_TRANSFER_UNPROVEN", "publication transition could not be proven against S4");
    registry.putRtrStatus(record.task_id, transferId, { status: "COMMITTED", post_revision: post, rtr_digest: sha256(bodyBytes), reason: null });
    journal.append("RTR_COMMITTED", { transfer_id: transferId, post_revision: post });
    record.state = "COMPLETED";
    save(record);
    return { transfer_id: transferId, post_revision: post, result_commit_sha: body.result_commit_sha };
  }

  // ================================================================= complete
  async function complete(instanceId, { actorId } = {}) {
    const pre = loadRecord(instanceId);
    if (pre.identity.role !== "BUILDER") fail("MALFORMED_REQUEST", "only a Builder instance publishes");
    if (pre.state !== "QUIESCED") fail("QUIESCE_UNPROVEN", "complete requires a quiesced instance");
    if (actorId !== pre.identity.owner) fail("OWNER_MISMATCH", "only the identity owner may complete");
    if (permitsOf(pre).some((p) => currentPermitStatus(pre.task_id, p.permit_id)?.state === "CLAIMED")) fail("QUIESCE_UNPROVEN", "a claimed permit has no verified report");
    const record = await requireProven(instanceId);
    const p = pathsFor(record);
    const env = envFor(p);
    const journal = journalOf(record);
    const t = transportFor(journal);
    const baseNow = t.lsRemote(cfg.baseRef, env);
    if (baseNow === null) fail("BASE_UNAVAILABLE", "base ref vanished from the remote");
    if (baseNow !== record.identity.base_sha) fail("BASE_ADVANCED", `base advanced to ${baseNow}`);
    const head = git(["rev-parse", "HEAD"], { cwd: p.repo, env });
    if (tryGit(["merge-base", "--is-ancestor", record.identity.base_sha, head], { cwd: p.repo, env }) === null) fail("BASE_SHA_MISMATCH", "result is not a descendant of the base");
    const codes = [];
    for (const e of statusEntries(p.repo, env)) {
      if (e.startsWith("! ")) {
        const f = e.slice(2);
        if (!cfg.ignoredOutputAllowlist.some((a) => (a.endsWith("/") ? f.startsWith(a) : f === a))) codes.push("UNEXPECTED_UNTRACKED");
      } else {
        codes.push("DIRTY_WORKTREE");
      }
    }
    const changed = git(["diff", "--name-only", "--no-renames", "-z", `${record.identity.base_sha}..${head}`], { cwd: p.repo, env }).split("\0").filter(Boolean);
    codes.push(...scopeFailures(changed, resolveContract(record.identity.contract_ref).contract.scope));
    failWith(codes, "completion checks");

    const ref = `refs/heads/${record.identity.task_branch}`;
    t.push(p.repo, { ref, taskBranch: record.identity.task_branch, newSha: head, expectedOld: record.pushed_sha }, env);
    record.pushed_sha = head;
    save(record);
    journal.append("PUSH_VERIFIED", { ref, sha: head });
    await step("after-push", { record });

    const tree = git(["rev-parse", `${head}^{tree}`], { cwd: p.repo, env });
    const preRevision = record.checkpoint.current_revision;
    const transferId = transferIdOf(record.identity_digest, head, preRevision);
    const bodyBytes = await registry.withTaskLock(record.task_id, async () => {
      const existing = registry.readRtrBody(record.task_id, transferId);
      if (existing) return existing; // crash-retry of the same transfer: reuse the stored bytes
      for (const r of registry.listRtr(record.task_id)) {
        if (r.status?.status === "PENDING" && JSON.parse(registry.readRtrBody(record.task_id, r.transfer_id)).pre_revision === preRevision) {
          fail("RESULT_TRANSFER_UNPROVEN", "another PENDING record exists for this revision");
        }
      }
      // §7.1.2 construction order, under the lock, no interleaved append:
      const prepub = journal.head(); // (1)
      const payload = buildPublicationPayload({
        transferId, resultCommitSha: head, resultTreeSha: tree, baseSha: record.identity.base_sha, identityDigest: record.identity_digest,
        prepublicationProvenanceDigest: prepub, remoteRef: ref,
      }); // (2)
      const bytes = buildRtrBody({ transferId, taskId: record.task_id, builderIdentityDigest: record.identity_digest, owner: record.identity.owner, preRevision, payload });
      registry.writeRtrBody(record.task_id, transferId, bytes); // (3)
      registry.putRtrStatus(record.task_id, transferId, { status: "PENDING", post_revision: null, rtr_digest: sha256(bytes), reason: null });
      journal.append("RTR_PENDING", { transfer_id: transferId, rtr_digest: sha256(bytes) }); // (4)
      return bytes;
    });
    await step("after-pending", { record, transferId });
    verifyAdjacency(journal.replay().entries, transferId, bodyBytes);
    return publish(loadRecord(instanceId), bodyBytes, transferId);
  }

  // A QA instance (or a Builder abandoning) ends here: no S4 mutation, no push.
  async function finishWithoutPublication(instanceId) {
    const record = loadRecord(instanceId);
    if (record.state !== "QUIESCED") fail("QUIESCE_UNPROVEN", "finish requires a quiesced instance");
    record.state = "COMPLETED";
    save(record);
    journalOf(record).append("FINISHED_WITHOUT_PUBLICATION", {});
    return record;
  }

  // ================================================================== cleanup
  async function cleanup(instanceId) {
    const record = loadRecord(instanceId);
    if (!["COMPLETED", "QUARANTINED"].includes(record.state)) fail("INSTANCE_STALE", `cleanup requires COMPLETED or QUARANTINED, not ${record.state}`);
    revokeIssued(record, "CLEANUP");
    if (permitsOf(record).some((p) => currentPermitStatus(record.task_id, p.permit_id)?.state === "CLAIMED")) {
      fail("QUIESCE_UNPROVEN", "cannot clean up while a claimed permit is execution-uncertain");
    }
    const q = await proveGroupsEmpty(record.reported_pgids, { inspector: inspector(), deadlineMs: cfg.quiesceDeadlineMs ?? 2000 });
    if (!q.proven) fail("QUIESCE_UNPROVEN", "cannot clean up while reported process groups are alive");
    const inst = instEntry(record);
    try {
      verifyChain(record.chain.slice(0, record.chain.indexOf(inst) + 1), pathOpts);
    } catch {
      quarantine(record, "CLEANUP_CONTAMINATION_RISK");
      fail("CLEANUP_CONTAMINATION_RISK", "instance directory was substituted; nothing was deleted");
    }
    let result;
    try {
      result = removeTreeNoFollow(inst.native, { fsImpl: cfg.cleanupFs ?? fs, windows });
    } catch (e) {
      result = { ok: false, residue: [String(e.message)] };
    }
    if (!result.ok) {
      quarantine(record, "CLEANUP_CONTAMINATION_RISK");
      journalOf(record).append("CLEANUP_FAILED", { residue: result.residue.length });
      fail("CLEANUP_CONTAMINATION_RISK", `cleanup left ${result.residue.length} entries`);
    }
    record.state = "CLEANED";
    save(record);
    journalOf(record).append("CLEANED", {});
    return record;
  }

  // ================================================================= recovery
  async function resolvePending(taskId, transferId) {
    const bodyBytes = registry.readRtrBody(taskId, transferId);
    try {
      if (!bodyBytes) fail("RESULT_TRANSFER_UNPROVEN", "record body missing");
      const body = JSON.parse(bodyBytes);
      const record = registry.listInstances(taskId).find((r) => r.identity_digest === body.builder_identity_digest);
      if (!record) fail("RESULT_TRANSFER_UNPROVEN", "no Builder instance for the record");
      verifyAdjacency(journalOf(record).replay().entries, transferId, bodyBytes);
      if (registry.getRtrStatus(taskId, transferId)?.rtr_digest !== sha256(bodyBytes)) fail("RESULT_TRANSFER_UNPROVEN", "status digest does not match the body");
      const out = await publish(record, bodyBytes, transferId);
      return { transfer_id: transferId, outcome: "COMMITTED", post_revision: out.post_revision };
    } catch (e) {
      const s = registry.getRtrStatus(taskId, transferId);
      return { transfer_id: transferId, outcome: s?.status === "ABORTED" ? "ABORTED" : "UNPROVEN", code: e instanceof ExecutionError ? e.code : "RESULT_TRANSFER_UNPROVEN" };
    }
  }

  async function recover() {
    const report = { pending: [], stale: [], quarantined: [], orphans: [] };
    for (const taskId of registry.listTasks()) {
      for (const { transfer_id: id, status } of registry.listRtr(taskId)) {
        if (status?.status === "PENDING") report.pending.push(await resolvePending(taskId, id));
      }
      for (const record of registry.listInstances(taskId)) {
        if (!record?.identity || !LIVE_STATES.has(record.state)) continue;
        const inst = instEntry(record);
        if (record.state === "CREATING" || !inst || !fs.existsSync(inst.native)) {
          quarantine(record, record.state === "CREATING" ? "INCOMPLETE_CREATE" : "MISSING_DIRECTORY");
          report.quarantined.push(record.instance_id);
          continue;
        }
        // AS90-F001: a claimed permit with no verified report is execution-
        // uncertain; recovery never infers termination from elapsed time.
        if (permitsOf(record).some((p) => currentPermitStatus(taskId, p.permit_id)?.state === "CLAIMED")) {
          quarantine(record, "QUIESCE_UNPROVEN");
          report.quarantined.push(record.instance_id);
          continue;
        }
        const observed = await getState({ dir: cfg.s4Dir, taskId });
        const f = fencingFailures(record.identity, record.checkpoint, observed, clock()).filter((c) => c !== "LEASE_EXPIRED");
        if (f.length || record.stale) {
          markStale(record, selectReason(f) ?? record.stale_reason);
          quarantine(record, "INSTANCE_STALE");
          report.stale.push(record.instance_id);
        } else {
          revokeIssued(record, "STALE");
        }
      }
    }
    // Orphans: directories with no registry record are quarantined and
    // reported, never adopted.
    const root = rootState();
    const projectDir = root.native ? path.join(root.native, slug) : null;
    if (projectDir && fs.existsSync(projectDir)) {
      for (const taskId of fs.readdirSync(projectDir)) {
        const tdir = path.join(projectDir, taskId);
        if (!fs.lstatSync(tdir).isDirectory()) continue;
        for (const id of fs.readdirSync(tdir)) {
          if (registry.findInstance(id)) continue;
          report.orphans.push(`${taskId}/${id}`);
          const qdir = registry.dir("orphans");
          fs.writeFileSync(path.join(qdir, `${taskId}__${id}.json`), `${JSON.stringify({ path: path.join(tdir, id), state: "QUARANTINED", adopted: false })}\n`);
        }
      }
    }
    return report;
  }

  // =============================================================== provenance
  function provenance(instanceId) {
    const record = loadRecord(instanceId);
    const { head, entries } = journalOf(record).replay();
    const of = (type) => entries.filter((e) => e.entry.type === type).map((e) => e.entry.data);
    const rtr = record.identity.role === "BUILDER"
      ? registry.listRtr(record.task_id).filter((r) => {
        const b = registry.readRtrBody(record.task_id, r.transfer_id);
        return b && JSON.parse(b).builder_identity_digest === record.identity_digest;
      }).map((r) => ({ transfer_id: r.transfer_id, status: r.status.status }))
      : [];
    return {
      identity: record.identity,
      identity_digest: record.identity_digest,
      isolation_level: ISOLATION_LEVEL,
      platform_profile: record.identity.platform_profile,
      checkpoint_history: of("CHECKPOINT"),
      transport_authorization_ref: cfg.transportAuthorizationRef ?? null,
      capability_decisions: of("S5_DECISION"),
      permits: permitsOf(record).map((p) => ({ permit_id: p.permit_id, state: p.status.state, revocation_reason: p.status.revocation_reason ?? null })),
      claim_s5_checks: of("CLAIM_S5_CHECK"),
      execution_reports: of("REPORT"),
      result_transfer_records: rtr,
      qa_source_transfer_id: record.qa_source_transfer_id,
      journal_head: head,
      journal_length: entries.length,
      state: record.state,
      quarantine_reason: record.quarantine_reason,
      evidence_class: EVIDENCE_CLASS,
      non_authority_disclaimer: NON_AUTHORITY_DISCLAIMER,
    };
  }

  return Object.freeze({
    createInstance, validateInstance, attach, adoptRenewal, requestPermit, claimPermit, recordReport, quiesce, complete,
    finishWithoutPublication, cleanup, recover, provenance, platformProfile, registry,
  });
}
