// S6 Isolated Execution V1 core -- lifecycle host library (ML-DEVOS-RFC-019
// §3-§17, §13.1-§13.6; ML-DEVOS-AS-093, ML-DEVOS-AS-101; D-071, D-074).
//
// create -> validate -> attach -> permit/claim/report -> quiesce -> complete
// -> cleanup, plus QA creation, recovery, quarantine and resolution of
// execution uncertainty. Environment states, never task states: S4 remains the
// only task state machine and the fencing authority. S6 issues exactly one S4
// mutation -- the Builder publication BUILDING -> READY_FOR_QA transition, as
// the owner's agent -- and only when the owner requests complete().
//
// Integrity hardening (D-073 design, D-074 implementation):
//   - every mutable S6 fact for a task lives in ONE task store and changes only
//     by one local transaction (store.mjs, state.mjs; §13.2);
//   - every external effect is prepare -> effect -> reconcile -> commit
//     outcome, with the lock never held across the effect (§13.3);
//   - at most one ACTIVE environment per task, owned by S6's own slot and
//     derived from lifecycle AND unresolved external influence (§13.4);
//   - permit history is separate from the claim execution-uncertainty
//     reservation and the per-group liveness obligations (§13.1, AS100-F001).
//
// S6 core exposes NO command-execution primitive (D-069). Actor/tool commands
// are data inside Execution Requests; a separately authorized execution
// driver (not part of S6, not authorized) would run them under a single-use
// Execution Permit and report back. S6 only issues permits, checks S5 at
// issuance and again at claim, verifies reports, and PROVES quiescence by
// read-only inspection. Isolation != Authority.
import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import path from "node:path";

import { validateTaskContract } from "../contracts/validate-task-contract.mjs";
import { getState, transition } from "../state/kernel.mjs";
import { canonicalJson, sha256 } from "./digest.mjs";
import {
  buildInstanceEnvironment, environmentDigest, environmentFailures, instanceGitConfig, instanceNpmrc, instancePaths,
  localConfigFailures, scanCredentialFiles,
} from "./environment.mjs";
import {
  changedFiles, checkoutDetached, createTaskBranch, currentBranch, gitVersion, headSha, isAncestor, localConfigLines, statusEntries, trackedFiles, treeOf,
} from "./git.mjs";
import {
  adoptS4Result, buildExecutionIdentity, fencingFailures, identityDigest, initialCheckpoint, newId128, taskBranchName,
} from "./identity.mjs";
import { replayJournal } from "./journal.mjs";
import { createLivenessInspector, proveGroupsEmpty } from "./liveness.mjs";
import {
  createDirChain, createFileExclusive, isWithin, removeTreeNoFollow, toCanonical, verifiedBase, verifyChain,
} from "./paths.mjs";
import {
  argvDigest, buildPermitBody, expectedShellIntent, parsePermitBody, reportEvidence, requestShellDecision, validateReport, validateRequest,
  verifyClaimResult, verifyIssuanceResult,
} from "./permits.mjs";
import { detectPlatformProfile, profileFailures } from "./platform.mjs";
import { buildPublicationPayload, buildRtrBody, storedEvidenceRef, transferIdOf, verifyAdjacency } from "./rtr.mjs";
import {
  PROGRESSING, appendJournal, assertSlotFreeFor, bindingKey, closeClaimReservation, closeObligation, effectivePermitState, getInstance,
  isActive, journalHead, listInstances, openObligations, pendingRtr, permitsOf, releaseSlotIfInactive, replay, requireInstance, setLife,
  setPermitState, setRtrStatus, unresolvedInfluence,
} from "./state.mjs";
import { TaskStore } from "./store.mjs";
import { createTransport } from "./transport.mjs";
import {
  EVIDENCE_CLASS, ExecutionError, HEX40, ID128, ISOLATION_LEVEL, NON_AUTHORITY_DISCLAIMER, ROLES, fail, selectReason,
} from "./vocabulary.mjs";

const CONSEQUENCE_FLAGS = [
  "remote_resources_involved", "protected_main_or_deploy_in_scope", "production_write_in_scope",
  "credential_or_security_in_scope", "destructive_actions_in_scope",
];

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

// S4 errors that are a definitive, record-based refusal of the publication
// transition (§13.3 "Definitive S4 refusals"). Any other error leaves the
// reservation open.
const DEFINITIVE_S4_REJECTIONS = new Set(["NOT_CURRENT_OWNER", "REVISION_CONFLICT", "IDEMPOTENCY_CONFLICT", "ILLEGAL_TRANSITION", "TASK_NOT_FOUND"]);

function kernelCode(err) {
  switch (err?.code) {
    case "NOT_CURRENT_OWNER": return "OWNER_MISMATCH";
    case "REVISION_CONFLICT": return "FENCING_REVISION_MISMATCH";
    case "IDEMPOTENCY_CONFLICT": return "RESULT_TRANSFER_UNPROVEN";
    default: return "INSTANCE_STALE";
  }
}

const STALE_CODES = ["OWNER_MISMATCH", "FENCING_REVISION_MISMATCH", "INSTANCE_STALE"];

// A transaction that must commit what it recorded (a revocation, a stale flag,
// a refusal entry) and then report failure returns this; the wrapper commits
// first and throws after.
class CommitThenFail {
  constructor(code, detail) {
    this.error = new ExecutionError(code, detail);
  }
}
const failAfterCommit = (code, detail) => new CommitThenFail(code, detail);

// `internals` is test-only construction (testing.mjs): fault hooks and store
// hooks. The production export (index.mjs) never passes it (§13.5).
export function buildExecutionHost(config, internals = null) {
  const cfg = { environment: "local", ignoredOutputAllowlist: [], maxCreateAttempts: 2, claimWindowMs: 5 * 60 * 1000, lockWaitMs: 0, clock: Date.now, ...config };
  for (const k of ["workspaceRoot", "hostStateDir", "project", "repository", "remote", "baseRef", "s4Dir", "policyVersion"]) {
    if (typeof cfg[k] !== "string" || cfg[k].length === 0) fail("MALFORMED_REQUEST", `host configuration ${k} is required`);
  }
  if (typeof cfg.resolveContract !== "function") fail("MALFORMED_REQUEST", "host configuration resolveContract() is required");
  if (!Array.isArray(cfg.toolchainPath) || cfg.toolchainPath.length === 0) fail("MALFORMED_REQUEST", "host configuration toolchainPath is required");

  const windows = process.platform === "win32";
  const pathOpts = { windows };
  const clock = () => cfg.clock();
  const store = new TaskStore(path.resolve(cfg.hostStateDir), { hooks: internals?.storeHooks ?? null });
  // Test fault hooks are external observers: they run OUTSIDE any lock scope,
  // so an operation a hook starts competes for the task lock like any other.
  const lockScope = new AsyncLocalStorage();
  const step = async (name, ctx) => lockScope.exit(() => internals?.faults?.onStep?.(name, ctx));
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
    const detected = detectPlatformProfile({ probeDir, gitVersionText: gitVersion(bootEnv()) });
    if (probeDir) profile = detected;
    return detected;
  }
  function platformCodes(root) {
    if (cfg.platformProfile || root.codes.length === 0) return profileFailures(platformProfile());
    return profileFailures(platformProfile(), { probed: false });
  }
  const inspector = () => cfg.livenessInspector ?? createLivenessInspector(platformProfile().liveness_proof);

  // ------------------------------------------------------------ helpers
  const instEntry = (record) => record.chain?.find((c) => c.canonical === record.identity.workspace_path);
  const pathsFor = (record) => instancePaths(instEntry(record)?.native ?? "");
  const envFor = (p) => buildInstanceEnvironment({ paths: p, toolchainPath: cfg.toolchainPath, windows, windowsSystemEnv: cfg.windowsSystemEnv ?? {} });
  const repoCanonical = (record) => `${record.identity.workspace_path}/repo`;
  const journal = (st, record, type, data = {}) => appendJournal(st, record, type, data, clock());

  // S5 decisions the transport obtains are collected and committed with the
  // next transaction for that instance (never written on their own).
  function transportWith(collector) {
    return createTransport({
      project: cfg.project, remote: cfg.remote, authorizationRef: cfg.transportAuthorizationRef, gateway: cfg.gateway,
      policyVersion: cfg.policyVersion, environment: cfg.environment, onDecision: (d) => collector?.push(d),
    });
  }
  function flushDecisions(st, record, collector) {
    for (const d of collector.splice(0)) journal(st, record, "S5_DECISION", d);
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

  const treeSnapshot = (repo, env) => sha256(`${headSha(repo, env) ?? ""}\n${statusEntries(repo, env).join("\0")}`);

  // ------------------------------------------------------------ transactions (§13.2)
  // ONE rule orders every local transition: `tx(taskId, fn)` takes the per-task
  // store lock once, hands `fn` a draft of the committed state re-read under
  // that lock, and commits the draft as one version (compare-and-set). Before
  // `fn`, every PENDING publication must be attributable (§7.1.3); after `fn`,
  // the slot is released iff its holder became non-ACTIVE (§13.4). Nested
  // acquisition fails closed instead of deadlocking. External effects (clone,
  // push, S4 transition, deletion) never run inside `fn`.
  function tx(taskId, fn, { requireAttributable = true } = {}) {
    if (lockScope.getStore()?.has(taskId)) fail("ISOLATION_UNPROVABLE", `nested acquisition of the S6 task lock for ${taskId}`);
    const held = new Set([...(lockScope.getStore() ?? []), taskId]);
    return store.transact(taskId, (st) => lockScope.run(held, async () => {
      if (requireAttributable) assertAttributable(taskId, st);
      persistExpiries(st);
      const out = await fn(st);
      releaseSlotIfInactive(st, clock());
      return out;
    }), { waitMs: cfg.lockWaitMs }).then((out) => {
      if (out instanceof CommitThenFail) throw out.error;
      return out;
    });
  }

  // ISSUED permits past their claim deadline become EXPIRED_UNCLAIMED in the
  // next transaction of their task (lazy expiry, now committed; AS90-F001).
  function persistExpiries(st) {
    const now = clock();
    for (const p of Object.values(st.permits)) if (effectivePermitState(p, now) === "EXPIRED_UNCLAIMED" && p.state === "ISSUED") setPermitState(p, "EXPIRED_UNCLAIMED");
  }

  // Read-only snapshot views (frozen copies).
  function snapshot(taskId) {
    return store.read(taskId).state;
  }
  function locate(instanceId) {
    if (!ID128.test(instanceId ?? "")) fail("MALFORMED_REQUEST", "invalid instance_id");
    for (const taskId of store.listTasks()) {
      const r = snapshot(taskId).instances[instanceId];
      if (r) return { taskId, record: r };
    }
    fail("MALFORMED_REQUEST", `unknown instance ${instanceId}`);
  }
  const loadRecord = (instanceId) => locate(instanceId).record;

  // ------------------------------------------------------------ §7.1.3 attribution
  // A PENDING record belongs to an instance only after all four proofs. If any
  // cannot be made, EVERY lifecycle-mutating operation on EVERY instance of the
  // task fails closed with RESULT_TRANSFER_UNPROVEN.
  function attribution(taskId, st, pending) {
    const bytes = store.readBlob(taskId, pending.rtr_digest, { code: "RESULT_TRANSFER_UNPROVEN" }).toString("utf8");
    let body;
    try {
      body = JSON.parse(bytes);
    } catch {
      fail("RESULT_TRANSFER_UNPROVEN", `PENDING record ${pending.transfer_id} body does not parse`);
    }
    const owner = st.instances[pending.instance_id];
    if (!owner || body.transfer_id !== pending.transfer_id || body.task_id !== taskId || body.builder_identity_digest !== pending.builder_identity_digest
      || owner.identity_digest !== pending.builder_identity_digest) {
      fail("RESULT_TRANSFER_UNPROVEN", `PENDING record ${pending.transfer_id} cannot be attributed`);
    }
    verifyAdjacency(replay(st, owner).entries, pending.transfer_id, bytes);
    return { owner, bytes, body };
  }

  function assertAttributable(taskId, st) {
    for (const p of pendingRtr(st)) {
      try {
        attribution(taskId, st, p);
      } catch (e) {
        fail("RESULT_TRANSFER_UNPROVEN", `task ${taskId} is blocked: ${e.detail ?? e.message}`);
      }
    }
  }

  function pendingPublicationsOf(st, record) {
    return pendingRtr(st).filter((p) => p.instance_id === record.instance_id).map((p) => p.transfer_id);
  }
  function assertNoPendingPublication(st, record, operation) {
    const pending = pendingPublicationsOf(st, record);
    if (pending.length) fail("RESULT_TRANSFER_UNPROVEN", `${operation} refused: publication ${pending[0]} is PENDING (reserved until COMMITTED or ABORTED)`);
  }

  function markStale(st, record, reason) {
    if (record.stale || !PROGRESSING.has(record.state)) return;
    record.stale = true;
    record.stale_reason = reason;
    journal(st, record, "STALE", { reason });
  }

  function revokeIssued(st, record, reason) {
    for (const p of permitsOf(st, record.instance_id)) {
      const live = st.permits[p.permit_id];
      if (live.state === "ISSUED") {
        setPermitState(live, "REVOKED");
        live.revocation_reason = reason;
        journal(st, record, "PERMIT_REVOKED", { permit_id: p.permit_id, reason });
      }
    }
  }

  // Terminal for execution: an already QUARANTINED (or CLEANED) record is never
  // rewritten, so the first quarantine reason stands. Quarantine resolves no
  // reservation and never releases the slot by itself (§13.4, AS99-F001).
  function quarantine(st, record, reason) {
    if (record.state === "QUARANTINED" || record.state === "CLEANED") return;
    setLife(record, "QUARANTINED");
    record.quarantine_reason = reason;
    journal(st, record, "QUARANTINE", { reason, unresolved: unresolvedInfluence(st, record.instance_id) });
    revokeIssued(st, record, "QUARANTINE");
  }

  async function currentFencing(record) {
    const observed = await getState({ dir: cfg.s4Dir, taskId: record.task_id });
    return fencingFailures(record.identity, record.checkpoint, observed, clock());
  }

  // QA source proof (§7.1 step 6).
  function proveQaSource(taskId, qaChain, observed) {
    if (!Array.isArray(qaChain) || qaChain.length < 2) fail("RESULT_TRANSFER_UNPROVEN", "QA must present its claim and READY_FOR_QA->QA results");
    const qaActor = qaChain[0].owner;
    const start = qaChain[0].revision - 1;
    const st = snapshot(taskId);
    const matches = Object.entries(st.rtr).filter(([, r]) => r.status === "COMMITTED" && r.post_revision === start);
    if (matches.length !== 1) fail("RESULT_TRANSFER_UNPROVEN", `expected exactly one COMMITTED record at revision ${start}, found ${matches.length}`);
    qaChain.forEach((r, i) => {
      if (r.taskId !== taskId || r.owner !== qaActor || r.revision !== start + 1 + i) fail("RESULT_TRANSFER_UNPROVEN", "QA revision chain is gapped or contains a non-QA mutation");
    });
    const last = qaChain[qaChain.length - 1];
    if (observed.revision !== last.revision || observed.owner !== qaActor || observed.state !== "QA") fail("RESULT_TRANSFER_UNPROVEN", "S4 no longer matches the presented QA chain");
    const bodyBytes = store.readBlob(taskId, matches[0][1].rtr_digest, { code: "RESULT_TRANSFER_UNPROVEN" }).toString("utf8");
    const { body } = storedEvidenceRef(bodyBytes);
    if (body.transfer_id !== matches[0][0]) fail("RESULT_TRANSFER_UNPROVEN", "committed record body names another transfer");
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

    const binding = `${taskId}\n${role}\n${anchor.owner}\n${anchor.revision}`;
    const keyHash = idempotencyKey === null ? null : sha256(String(idempotencyKey));
    const replayCreate = async (prior) => {
      if (prior.binding !== binding) fail("MALFORMED_REQUEST", "idempotency key reused with different bindings");
      const v = await validateInstance(prior.instance_id);
      if (v.outcome !== "PROVEN") fail(v.reason, "replayed instance no longer validates");
      return loadRecord(prior.instance_id);
    };
    if (keyHash !== null) {
      const prior = snapshot(taskId).creates?.[keyHash];
      if (prior) return replayCreate(prior);
    }
    const attemptsKey = sha256(binding);
    const attempts = snapshot(taskId).attempts?.[attemptsKey] ?? { count: 0, last_code: null };
    if (attempts.count >= cfg.maxCreateAttempts) fail(attempts.last_code ?? "ISOLATION_UNPROVABLE", "environment creation attempts exhausted");
    transportWith(null).authorize();

    const decisions = [];
    const baseSha = role === "QA" ? qaBody.result_commit_sha : transportWith(decisions).lsRemote(cfg.baseRef, bootEnv());
    if (!baseSha || !HEX40.test(baseSha)) fail("BASE_UNAVAILABLE", `base ${cfg.baseRef} cannot be resolved on the remote`);

    // PREPARE (§13.3, §13.4): the slot, the create binding, the identity and the
    // CREATING record commit together, BEFORE anything is created on disk. The
    // workspace path is fixed here from the verified base.
    const instanceId = newId128();
    const taskBranch = taskBranchName(taskId, role, instanceId);
    const base = verifiedBase(root.native, pathOpts);
    const workspacePath = [base.canonical.replace(/\/$/, ""), slug, taskId, instanceId].join("/");
    const identity = buildExecutionIdentity({
      project: cfg.project, repository: cfg.repository, task_id: taskId, contract_ref: observed.contract_ref, contract_digest: contractDigest,
      role, owner: anchor.owner, anchor_revision: anchor.revision, base_ref: role === "QA" ? `s6-rtr:${qaBody.transfer_id}` : cfg.baseRef,
      base_sha: baseSha, task_branch: taskBranch, instance_id: instanceId, workspace_path: workspacePath, platform_profile: platformProfile(),
    });
    let raced = null;
    await tx(taskId, (st) => {
      if (keyHash !== null && st.creates[keyHash]) {
        raced = st.creates[keyHash];
        return;
      }
      const a = st.attempts[attemptsKey] ?? { count: 0, last_code: null };
      if (a.count >= cfg.maxCreateAttempts) fail(a.last_code ?? "ISOLATION_UNPROVABLE", "environment creation attempts exhausted");
      assertSlotFreeFor(st, instanceId);
      const record = {
        task_id: taskId, instance_id: instanceId, identity, identity_digest: identityDigest(identity),
        checkpoint: initialCheckpoint({ ...anchor }, "claim"), state: "CREATING", create: "OPEN", chain: null,
        tree_snapshot: null, pushed_sha: null, stale: false, stale_reason: null, quarantine_reason: null,
        qa_source_transfer_id: qaBody?.transfer_id ?? null,
      };
      st.instances[instanceId] = record;
      st.slot = { instance_id: instanceId, create_key: keyHash };
      if (keyHash !== null) st.creates[keyHash] = { binding, instance_id: instanceId };
      journal(st, record, "CREATE_BEGIN", { identity_digest: record.identity_digest, platform_profile: identity.platform_profile });
      flushDecisions(st, record, decisions);
    });
    if (raced) return replayCreate(raced);
    await step("after-create-begin", { instanceId, record: structuredClone(loadRecord(instanceId)) });

    // EFFECT (outside the lock), then RECONCILE by re-verification.
    let chain = null;
    try {
      const parentChain = createDirChain(base, [slug, taskId], pathOpts);
      const inst = createDirChain(parentChain[parentChain.length - 1], [instanceId], { ...pathOpts, exclusiveLast: true })[1];
      if (inst.canonical !== workspacePath) fail("ISOLATION_UNPROVABLE", "created instance directory is not the prepared workspace path");
      const subs = ["repo", "home", "tmp", "cache", "config"].map((s) => createDirChain(inst, [s], pathOpts)[1]);
      const hooks = createDirChain(subs[4], ["hooks"], pathOpts)[1];
      chain = [...parentChain, inst, ...subs, hooks];
      const p = instancePaths(inst.native);
      createFileExclusive(subs[4], "gitconfig", instanceGitConfig({ hooksDir: p.hooks }));
      createFileExclusive(subs[4], "npmrc", instanceNpmrc({ cacheDir: path.join(p.cache, "npm") }));
      const env = envFor(p);
      failWith(environmentFailures(env, { windows, instanceRoot: inst.canonical, toolchainPath: cfg.toolchainPath }), "instance environment");

      const t = transportWith(decisions);
      if (t.lsRemote(`refs/heads/${taskBranch}`, env) !== null) fail("BRANCH_COLLISION", `${taskBranch} already exists on the remote`);
      t.clone(p.repo, env);
      t.fetchSha(p.repo, baseSha, env);
      if (!checkoutDetached(p.repo, baseSha, env)) fail("BASE_UNAVAILABLE", "cannot check out the base commit");
      if (!createTaskBranch(p.repo, taskBranch, env)) fail("BRANCH_COLLISION", `cannot create ${taskBranch} locally`);
      if (headSha(p.repo, env) !== baseSha) fail("BASE_SHA_MISMATCH", "HEAD is not the pinned base");
      if (role === "QA") {
        if (treeOf(p.repo, baseSha, env) !== qaBody.result_tree_sha) fail("RESULT_TRANSFER_UNPROVEN", "fetched tree differs from the recorded result tree");
        if (!isAncestor(p.repo, qaBody.base_sha, baseSha, env)) fail("BASE_SHA_MISMATCH", "recorded base is not an ancestor of the result");
      }
      verifyChain(chain, pathOpts);
      const tracked = new Set(trackedFiles(p.repo, env).map((f) => `repo/${f}`));
      failWith([
        ...localConfigFailures(localConfigLines(p.repo, env), { expectedRemoteUrl: cfg.remote }),
        ...(statusEntries(p.repo, env).length ? ["DIRTY_WORKTREE"] : []),
        ...(scanCredentialFiles(inst.native, { tracked }).length ? ["SECRET_MATERIAL_DETECTED"] : []),
      ], "post-clone verification");
      const snapshotHash = treeSnapshot(p.repo, env);
      // COMMIT OUTCOME.
      return await tx(taskId, (st) => {
        const fresh = requireInstance(st, instanceId);
        // Recovery may have quarantined a slow CREATING instance meanwhile.
        if (fresh.state !== "CREATING") fail("INSTANCE_STALE", `instance became ${fresh.state} during creation`);
        fresh.chain = chain;
        fresh.tree_snapshot = snapshotHash;
        fresh.create = "DONE";
        setLife(fresh, "READY");
        journal(st, fresh, "READY", { base_sha: baseSha, task_branch: taskBranch, tree_snapshot: snapshotHash });
        flushDecisions(st, fresh, decisions);
        return structuredClone(fresh);
      });
    } catch (err) {
      const code = err instanceof ExecutionError ? err.code : "ISOLATION_UNPROVABLE";
      try {
        await tx(taskId, (st) => {
          const a = st.attempts[attemptsKey] ?? { count: 0, last_code: null };
          st.attempts[attemptsKey] = { count: a.count + 1, last_code: code };
          const record = getInstance(st, instanceId);
          if (record?.state === "CREATING") {
            record.chain = chain ?? record.chain;
            record.create = "DONE";
            quarantine(st, record, code);
            flushDecisions(st, record, decisions);
          }
        }, { requireAttributable: false });
      } catch {
        // lock unavailable: a CREATING record is quarantined by recover()
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
    let st;
    try {
      const at = locate(instanceId);
      record = at.record;
      st = snapshot(at.taskId);
    } catch {
      return { outcome: "FAILED", reason: "MALFORMED_REQUEST", codes: ["MALFORMED_REQUEST"] };
    }
    const codes = [];
    const push = (...c) => codes.push(...c);
    const root = rootState();
    push(...platformCodes(root), ...root.codes);
    if (record.stale || !PROGRESSING.has(record.state) || record.state === "CREATING") push("INSTANCE_STALE");
    if (identityDigest(record.identity) !== record.identity_digest) push("ISOLATION_UNPROVABLE");
    try {
      replay(st, record);
    } catch {
      push("ISOLATION_UNPROVABLE");
    }
    try {
      verifyChain(record.chain ?? [], pathOpts);
      if (!instEntry(record)) push("ISOLATION_UNPROVABLE");
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
      push(...localConfigFailures(localConfigLines(p.repo, env), { expectedRemoteUrl: cfg.remote }));
      if (currentBranch(p.repo, env) !== record.identity.task_branch) push("INSTANCE_STALE");
      if (!isAncestor(p.repo, record.identity.base_sha, "HEAD", env)) push("BASE_SHA_MISMATCH");
      const tracked = new Set(trackedFiles(p.repo, env).map((f) => `repo/${f}`));
      if (scanCredentialFiles(p.root, { tracked, skipDirs: new Set([".git", "node_modules"]) }).length) push("SECRET_MATERIAL_DETECTED");
      if (treeSnapshot(p.repo, env) !== record.tree_snapshot) push("DIRTY_WORKTREE");
    } catch (e) {
      push(e instanceof ExecutionError ? e.code : "ISOLATION_UNPROVABLE");
    }
    const reason = selectReason(codes);
    if (reason && STALE_CODES.includes(reason) && PROGRESSING.has(record.state) && !record.stale) {
      try {
        await tx(record.task_id, (s) => markStale(s, requireInstance(s, instanceId), reason), { requireAttributable: false });
      } catch {
        // lock unavailable: the failed validation still fails closed
      }
    }
    return reason ? { outcome: "FAILED", reason, codes: [...new Set(codes)] } : { outcome: "PROVEN", reason: null, codes: [] };
  }

  async function requireProven(instanceId) {
    const v = await validateInstance(instanceId);
    if (v.outcome !== "PROVEN") fail(v.reason, `validation failed: ${v.codes.join(", ")}`);
    return loadRecord(instanceId);
  }

  // =================================================================== attach
  async function attach(instanceId, { actorId } = {}) {
    const pre = await requireProven(instanceId);
    return tx(pre.task_id, async (st) => {
      const record = requireInstance(st, instanceId);
      if (actorId !== record.identity.owner) fail("OWNER_MISMATCH", "only the identity owner may attach");
      if (record.stale || !["READY", "QUIESCED"].includes(record.state)) fail("INSTANCE_STALE", `cannot attach from ${record.state}`);
      if (pendingPublicationsOf(st, record).length) fail("INSTANCE_STALE", "a publication for this instance is in progress");
      failWith(await currentFencing(record), "S4 fencing at attach");
      setLife(record, "ATTACHED");
      journal(st, record, "ATTACH", { actor: actorId });
      return structuredClone(record);
    });
  }

  // ===================================================== renew (checkpoint)
  async function adoptRenewal(instanceId, { result, adoptedFrom = "renew" } = {}) {
    const pre = loadRecord(instanceId);
    return tx(pre.task_id, async (st) => {
      const record = requireInstance(st, instanceId);
      assertNoPendingPublication(st, record, "adoptRenewal");
      if (!PROGRESSING.has(record.state)) fail("INSTANCE_STALE", `cannot adopt a checkpoint in ${record.state}`);
      const observed = await getState({ dir: cfg.s4Dir, taskId: record.task_id });
      try {
        record.checkpoint = adoptS4Result(record.checkpoint, record.identity, result, adoptedFrom, observed);
      } catch (e) {
        if (e instanceof ExecutionError && e.code === "INSTANCE_STALE") {
          markStale(st, record, e.detail);
          return failAfterCommit(e.code, e.detail);
        }
        throw e;
      }
      journal(st, record, "CHECKPOINT", { current_revision: record.checkpoint.current_revision, adopted_from: adoptedFrom });
      return structuredClone(record.checkpoint);
    });
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

  function permitBody(taskId, permit) {
    return parsePermitBody(store.readBlob(taskId, permit.permit_digest).toString("utf8"), permit.permit_digest);
  }

  function permitView(taskId, permitId, permit) {
    return {
      permit_id: permitId,
      state: effectivePermitState(permit, clock()),
      revocation_reason: permit.revocation_reason ?? null,
      permit: permitBody(taskId, permit),
      report: permit.report ?? null,
      claim_reservation: permit.claim_reservation,
      obligations: structuredClone(permit.obligations),
    };
  }

  function replayPermit(taskId, record, permitId, want) {
    const permit = snapshot(taskId).permits[permitId];
    if (!sameBinding(permit, want)) fail("MALFORMED_REQUEST", "request_id reused with a different binding");
    if (permit.instance_id !== record.instance_id) fail("ISOLATION_UNPROVABLE", "binding names another instance");
    return { replay: true, ...permitView(taskId, permitId, permit) };
  }

  // Request -> (exact replay | conflict | validate + S5 at issuance -> permit).
  // The permit body is a verified blob first; the binding, the ISSUED status
  // and the PERMIT_ISSUED entry then commit in ONE transaction (§13.1 step 2).
  // A crash before that commit leaves only an orphan blob, so a retry mints the
  // one permit; a crash after it leaves the permit, so a retry replays it.
  async function requestPermit(request) {
    validateRequest(request);
    const { taskId, record } = locate(request.instance_id);
    const want = bindingOf(record, request);
    const key = bindingKey(record.instance_id, request.request_id);
    const prior = snapshot(taskId).bindings[key];
    if (prior) return replayPermit(taskId, record, prior, want);
    if (record.state !== "ATTACHED") fail("INSTANCE_STALE", "permits are issued only for an attached instance");
    await requireProven(record.instance_id);
    if (request.checkpoint_revision !== record.checkpoint.current_revision) fail("FENCING_REVISION_MISMATCH", "request checkpoint_revision is not the current fencing checkpoint");
    const intent = expectedShellIntent({ project: cfg.project, repoCanonical: repoCanonical(record), environment: cfg.environment, policyVersion: cfg.policyVersion });
    let s5;
    try {
      s5 = verifyIssuanceResult(requestShellDecision(cfg.gateway, intent), { expectedIntent: intent, identity: record.identity });
    } catch (e) {
      await tx(taskId, (st) => journal(st, requireInstance(st, record.instance_id), "PERMIT_DENIED", { request_id: request.request_id, code: e.code ?? "CAPABILITY_DENIED" }));
      throw e;
    }
    const permitId = newId128();
    const now = clock();
    const bytes = buildPermitBody({
      permitId, instanceId: record.instance_id, requestId: request.request_id, identityDigest: record.identity_digest,
      checkpointRevision: request.checkpoint_revision, argvDigest: want.argv_digest, cwd: want.cwd, environmentDigest: want.environment_digest,
      s5, issuedAt: new Date(now).toISOString(), claimDeadline: new Date(now + cfg.claimWindowMs).toISOString(),
    });
    const digest = store.putBlob(taskId, bytes);
    await step("permit-after-blob", { permitId });
    let racedId = null;
    await tx(taskId, (st) => {
      racedId = st.bindings[key] ?? null;
      if (racedId) return;
      // Re-read: a quiesce/quarantine/renewal may have landed since validation.
      const fresh = requireInstance(st, record.instance_id);
      if (fresh.stale || fresh.state !== "ATTACHED") fail("INSTANCE_STALE", `instance is ${fresh.state}, not ATTACHED`);
      if (request.checkpoint_revision !== fresh.checkpoint.current_revision) fail("FENCING_REVISION_MISMATCH", "the fencing checkpoint moved before issuance");
      st.permits[permitId] = {
        instance_id: record.instance_id, request_id: request.request_id, ...want, permit_digest: digest,
        claim_deadline_ms: now + cfg.claimWindowMs, issued_at_ms: now, state: "ISSUED", revocation_reason: null,
        claim_reservation: "NONE", claimed_at: null, report: null, report_digest: null, obligations: {},
      };
      st.bindings[key] = permitId;
      journal(st, fresh, "PERMIT_ISSUED", { permit_id: permitId, permit_digest: digest, request_id: request.request_id });
    });
    await step("permit-after-commit", { permitId });
    if (racedId) return replayPermit(taskId, record, racedId, want);
    return { replay: false, ...permitView(taskId, permitId, snapshot(taskId).permits[permitId]) };
  }

  // The driver claims (AS94-F001). Every final check runs under the task lock,
  // against the committed state re-read there, in this order:
  //   1. binding, permit status and body;
  //   2. S4 fencing, role state, lease and pinned revision -> revoke (STALE);
  //   3. the fresh S5 recheck, LAST -> revoke (CAPABILITY_INVALIDATED);
  //   4. commit CLAIMED with its OPEN claim execution-uncertainty reservation.
  async function claimPermit({ permitId, request } = {}) {
    validateRequest(request);
    const pre = loadRecord(request.instance_id);
    return tx(pre.task_id, async (st) => {
      await step("claim-locked", { permitId });
      const record = requireInstance(st, request.instance_id);
      const boundId = st.bindings[bindingKey(record.instance_id, request.request_id)];
      if (!boundId || boundId !== permitId) fail("ISOLATION_UNPROVABLE", "no request binding names this permit (orphan or unknown permit)");
      const live = st.permits[permitId];
      const permit = permitBody(record.task_id, live);
      if (live.state !== "ISSUED") return failAfterCommit("ISOLATION_UNPROVABLE", `permit is ${live.state}, not ISSUED`);
      if (permit.request_id !== request.request_id || permit.argv_digest !== argvDigest(request.argv)) fail("ISOLATION_UNPROVABLE", "claim does not match the permitted request");
      if (record.stale || record.state !== "ATTACHED") fail("INSTANCE_STALE", "instance is not attached");
      const revoke = (reason, code, detail) => {
        setPermitState(live, "REVOKED");
        live.revocation_reason = reason;
        journal(st, record, "CLAIM_REFUSED", { permit_id: permitId, permit_digest: live.permit_digest, reason, code, detail });
      };
      const f = await currentFencing(record);
      if (permit.checkpoint_revision !== record.checkpoint.current_revision) f.push("FENCING_REVISION_MISMATCH");
      if (f.length) {
        const code = selectReason(f);
        revoke("STALE", code, "S4 fencing at claim");
        return failAfterCommit(code, `S4 fencing at claim: ${[...new Set(f)].join(", ")}`);
      }
      let check;
      try {
        check = verifyClaimResult(requestShellDecision(cfg.gateway, permit.s5_request_intent), { permit, identity: record.identity });
      } catch (e) {
        const err = e instanceof ExecutionError ? e : new ExecutionError("CAPABILITY_DENIED", String(e.message));
        revoke("CAPABILITY_INVALIDATED", err.code, err.detail ?? String(err.message));
        journal(st, record, "CLAIM_S5_CHECK", { permit_id: permitId, permit_digest: live.permit_digest, outcome: "DENIED", code: err.code, detail: err.detail ?? String(err.message) });
        return failAfterCommit(err.code, err.detail ?? String(err.message));
      }
      setPermitState(live, "CLAIMED");
      live.claim_reservation = "OPEN";
      live.claimed_at = new Date(clock()).toISOString();
      journal(st, record, "CLAIM_S5_CHECK", { permit_id: permitId, permit_digest: live.permit_digest, outcome: "ALLOW", ...check });
      journal(st, record, "PERMIT_CLAIMED", { permit_id: permitId, permit_digest: live.permit_digest });
      return { permit, cwd: pathsFor(record).repo, environment: envFor(pathsFor(record)) };
    });
  }

  // The verified report (§13.1 step 5), including a late report after
  // quarantine: ONE transaction moves the permit CLAIMED -> REPORTED, moves its
  // claim reservation OPEN -> SUPERSEDED_BY_REPORT, and registers every
  // reported process group as an OPEN liveness obligation. No committed state
  // has the claim reservation closed without those obligations. A late report
  // never changes a QUARANTINED instance's lifecycle state or publishability.
  async function recordReport(report) {
    validateReport(report);
    const pre = loadRecord(report.instance_id);
    const reportDigest = store.putBlob(pre.task_id, canonicalJson(report));
    return tx(pre.task_id, async (st) => {
      await step("report-locked", { permitId: report.permit_id });
      const record = requireInstance(st, report.instance_id);
      const live = ID128.test(report.permit_id ?? "") ? st.permits[report.permit_id] : null;
      if (!live || live.instance_id !== record.instance_id) fail("ISOLATION_UNPROVABLE", "report for an unknown permit");
      const permit = permitBody(record.task_id, live);
      if (st.bindings[bindingKey(record.instance_id, permit.request_id)] !== report.permit_id) fail("ISOLATION_UNPROVABLE", "report for a permit no request binding names (orphan)");
      if (live.state !== "CLAIMED") fail("ISOLATION_UNPROVABLE", `report for a permit that is ${live.state}, not CLAIMED`);
      if (live.claim_reservation !== "OPEN") fail("ISOLATION_UNPROVABLE", `the claim reservation is already ${live.claim_reservation}; the report is not recorded`);
      if (report.argv_digest !== permit.argv_digest || report.environment_digest !== permit.environment_digest) fail("ISOLATION_UNPROVABLE", "report digests do not match the permit");
      const summary = reportEvidence(report); // every RFC-019 report field, durably (AS94-F004)
      setPermitState(live, "REPORTED");
      closeClaimReservation(live, "SUPERSEDED_BY_REPORT");
      live.report = summary;
      live.report_digest = reportDigest;
      for (const g of report.process_groups) live.obligations[String(g)] = { state: "OPEN", resolution: null };
      if (record.state !== "ATTACHED") {
        journal(st, record, "LATE_REPORT", { permit_id: report.permit_id, instance_state: record.state, report_digest: reportDigest, ...summary });
        return { recorded: true, quarantined: record.state === "QUARANTINED" };
      }
      const p = pathsFor(record);
      record.tree_snapshot = treeSnapshot(p.repo, envFor(p));
      journal(st, record, "REPORT", { permit_id: report.permit_id, permit_digest: live.permit_digest, report_digest: reportDigest, ...summary, tree_snapshot: record.tree_snapshot });
      return { recorded: true, quarantined: false };
    });
  }

  // ================================================================== quiesce
  // One transaction (AS95-F001/F002, §13.1 step 6): S4 fencing before any change;
  // no claim reservation may be OPEN; every OPEN liveness obligation is proven
  // empty by read-only inspection; then the revocation of every ISSUED permit,
  // the proven obligations (PROOF_RESOLVED), the snapshot and QUIESCED commit
  // together.
  async function quiesce(instanceId) {
    const pre = loadRecord(instanceId);
    return tx(pre.task_id, async (st) => {
      await step("quiesce-locked", { instanceId });
      const record = requireInstance(st, instanceId);
      assertNoPendingPublication(st, record, "quiesce");
      if (record.stale || !["ATTACHED", "READY"].includes(record.state)) fail("INSTANCE_STALE", `cannot quiesce from ${record.state}`);
      const f = await currentFencing(record);
      if (f.length) {
        const code = selectReason(f);
        if (STALE_CODES.includes(code)) markStale(st, record, code);
        journal(st, record, "QUIESCE_REFUSED", { codes: [...new Set(f)] });
        return failAfterCommit(code, `S4 fencing at quiesce: ${[...new Set(f)].join(", ")}`);
      }
      const claimed = permitsOf(st, instanceId).filter((p) => p.state === "CLAIMED" && p.claim_reservation === "OPEN");
      if (claimed.length) {
        journal(st, record, "QUIESCE_FAILED", { claimed_unreported: claimed.map((p) => p.permit_id) });
        return failAfterCommit("QUIESCE_UNPROVEN", "a claimed permit has no verified report (execution uncertain)");
      }
      const open = openObligations(st, instanceId);
      const q = await proveGroupsEmpty(open.map((o) => o.pgid), { inspector: inspector(), deadlineMs: cfg.quiesceDeadlineMs ?? 2000 });
      if (!q.proven) {
        journal(st, record, "QUIESCE_FAILED", { survivors: q.survivors });
        return failAfterCommit("QUIESCE_UNPROVEN", `reported process groups still alive: ${q.survivors.join(", ")}`);
      }
      for (const o of open) closeObligation(st.permits[o.permit_id].obligations[String(o.pgid)], "PROOF_RESOLVED");
      revokeIssued(st, record, "QUIESCE");
      const p = pathsFor(record);
      record.tree_snapshot = treeSnapshot(p.repo, envFor(p));
      setLife(record, "QUIESCED");
      journal(st, record, "QUIESCE", { tree_snapshot: record.tree_snapshot, proven_groups: open.map((o) => o.pgid) });
      return structuredClone(record);
    });
  }

  // ======================================================= publication core
  async function publish(taskId, instanceId, bodyBytes, transferId) {
    const { evidenceRef, body } = storedEvidenceRef(bodyBytes);
    const record = loadRecord(instanceId);
    await tx(taskId, (st) => journal(st, requireInstance(st, instanceId), "TRANSITION_ATTEMPT", { transfer_id: transferId, expected_revision: body.pre_revision }));
    let result;
    try {
      result = await transition({
        dir: cfg.s4Dir, taskId, actorId: record.identity.owner, requesterRole: "BUILDER",
        expectedRevision: body.pre_revision, toState: "READY_FOR_QA", idempotencyKey: transferId,
        evidenceRef, // JSON.parse of the stored bytes -- never rebuilt from fields (§7.1.1)
      });
    } catch (err) {
      // ABORTED only for a DEFINITIVE S4 refusal; anything else proves nothing
      // about the outcome and leaves the reservation PENDING (§13.3).
      if (!DEFINITIVE_S4_REJECTIONS.has(err?.code)) {
        try {
          await tx(taskId, (st) => journal(st, requireInstance(st, instanceId), "TRANSITION_UNRESOLVED", { transfer_id: transferId, code: err?.code ?? "error" }));
        } catch {
          // the reservation stays PENDING either way
        }
        fail("RESULT_TRANSFER_UNPROVEN", `S4 transition outcome unknown (${err?.code ?? err?.message}); publication stays PENDING`);
      }
      const code = kernelCode(err);
      await tx(taskId, (st) => {
        const meta = st.rtr[transferId];
        if (meta?.status !== "PENDING") return;
        setRtrStatus(meta, "ABORTED");
        meta.reason = err.code;
        const fresh = requireInstance(st, instanceId);
        // The reservation is released and the pushed branch is stale,
        // unpublished transport residue; the instance may only finish without
        // publication and then be cleaned (or be quarantined).
        journal(st, fresh, "RTR_ABORTED", { transfer_id: transferId, reason: err.code, remote_ref: evidenceRef.remote_ref, disposition: "STALE_UNPUBLISHED" });
        markStale(st, fresh, code);
      });
      fail(code, `S4 rejected the publication transition: ${err.code}`);
    }
    await step("after-transition", { instanceId, record: structuredClone(loadRecord(instanceId)), transferId });
    const post = body.pre_revision + 1;
    const observed = await getState({ dir: cfg.s4Dir, taskId });
    const ok = result.revision === post && result.state === "READY_FOR_QA" && result.owner === null
      && observed && (observed.revision === post ? observed.state === "READY_FOR_QA" && observed.owner === null : observed.revision > post);
    if (!ok) fail("RESULT_TRANSFER_UNPROVEN", "publication transition could not be proven against S4");
    await tx(taskId, (st) => {
      const meta = st.rtr[transferId];
      if (meta.status === "COMMITTED") return;
      setRtrStatus(meta, "COMMITTED");
      meta.post_revision = post;
      const fresh = requireInstance(st, instanceId);
      journal(st, fresh, "RTR_COMMITTED", { transfer_id: transferId, post_revision: post });
      // Only a QUIESCED instance moves to COMPLETED; a QUARANTINED one is never
      // restored.
      if (fresh.state === "QUIESCED") setLife(fresh, "COMPLETED");
    });
    return { transfer_id: transferId, post_revision: post, result_commit_sha: body.result_commit_sha };
  }

  // Push as prepare -> effect -> reconcile (§13.3): the intent commits first;
  // the push runs outside the lock; the outcome is decided only by reading the
  // remote ref.
  async function pushTaskBranch(record, p, env, head, decisions) {
    const ref = `refs/heads/${record.identity.task_branch}`;
    const taskId = record.task_id;
    await tx(taskId, (st) => {
      const fresh = requireInstance(st, record.instance_id);
      if (fresh.state !== "QUIESCED") fail("QUIESCE_UNPROVEN", `instance became ${fresh.state} during completion`);
      const intents = st.intents[fresh.instance_id] ?? (st.intents[fresh.instance_id] = {});
      if (intents.push?.status === "OPEN") {
        if (intents.push.target_sha !== head) fail("ISOLATION_UNPROVABLE", "another push intent for this instance is unreconciled");
        return;
      }
      intents.push = { status: "OPEN", ref, expected_remote_sha: fresh.pushed_sha, target_sha: head };
      journal(st, fresh, "PUSH_INTENT", { ref, expected_remote_sha: fresh.pushed_sha, target_sha: head });
      flushDecisions(st, fresh, decisions);
    });
    await step("after-push-intent", { instanceId: record.instance_id });
    const t = transportWith(decisions);
    let effectError = null;
    try {
      t.push(p.repo, { ref, taskBranch: record.identity.task_branch, newSha: head, expectedOld: record.pushed_sha }, env);
    } catch (e) {
      effectError = e;
    }
    await step("after-push", { instanceId: record.instance_id, record: structuredClone(record) });
    let observed;
    try {
      observed = t.lsRemote(ref, env);
    } catch (e) {
      throw effectError ?? e; // unobserved: the intent stays OPEN for reconciliation
    }
    await reconcilePush(taskId, record.instance_id, observed, decisions);
    if (observed !== head) throw effectError ?? new ExecutionError("BRANCH_COLLISION", `remote ${ref} is ${observed}, expected ${head}`);
    return ref;
  }

  // Reconciles an OPEN push intent against an observed remote value.
  async function reconcilePush(taskId, instanceId, observed, decisions = []) {
    return tx(taskId, (st) => {
      const record = requireInstance(st, instanceId);
      const intent = st.intents[instanceId]?.push;
      if (intent?.status !== "OPEN") return null;
      flushDecisions(st, record, decisions); // the decisions precede the outcome they led to
      if (observed === intent.target_sha) {
        intent.status = "DONE";
        record.pushed_sha = intent.target_sha;
        journal(st, record, "PUSH_VERIFIED", { ref: intent.ref, sha: intent.target_sha });
      } else if (observed === intent.expected_remote_sha) {
        intent.status = "NOT_APPLIED"; // observed: the remote still holds the expected value
        journal(st, record, "PUSH_NOT_APPLIED", { ref: intent.ref, observed });
      } else {
        intent.status = "CONFLICT";
        journal(st, record, "PUSH_CONFLICT", { ref: intent.ref, observed, disposition: "STALE_UNPUBLISHED" });
      }
      return intent.status;
    });
  }

  // ================================================================= complete
  async function complete(instanceId, { actorId } = {}) {
    const { taskId, record: pre } = locate(instanceId);
    if (pre.identity.role !== "BUILDER") fail("MALFORMED_REQUEST", "only a Builder instance publishes");
    if (pre.state !== "QUIESCED") fail("QUIESCE_UNPROVEN", "complete requires a quiesced instance");
    if (actorId !== pre.identity.owner) fail("OWNER_MISMATCH", "only the identity owner may complete");
    if (permitsOf(snapshot(taskId), instanceId).some((p) => p.state === "CLAIMED")) fail("QUIESCE_UNPROVEN", "a claimed permit has no verified report");
    const record = await requireProven(instanceId);
    const p = pathsFor(record);
    const env = envFor(p);
    const decisions = [];
    const t = transportWith(decisions);
    const baseNow = t.lsRemote(cfg.baseRef, env);
    if (baseNow === null) fail("BASE_UNAVAILABLE", "base ref vanished from the remote");
    if (baseNow !== record.identity.base_sha) fail("BASE_ADVANCED", `base advanced to ${baseNow}`);
    const head = headSha(p.repo, env);
    if (head === null) fail("ISOLATION_UNPROVABLE", "instance repository has no HEAD commit");
    if (!isAncestor(p.repo, record.identity.base_sha, head, env)) fail("BASE_SHA_MISMATCH", "result is not a descendant of the base");
    const codes = [];
    for (const e of statusEntries(p.repo, env)) {
      if (e.startsWith("! ")) {
        const f = e.slice(2);
        if (!cfg.ignoredOutputAllowlist.some((a) => (a.endsWith("/") ? f.startsWith(a) : f === a))) codes.push("UNEXPECTED_UNTRACKED");
      } else {
        codes.push("DIRTY_WORKTREE");
      }
    }
    const changed = changedFiles(p.repo, record.identity.base_sha, head, env);
    codes.push(...scopeFailures(changed, resolveContract(record.identity.contract_ref).contract.scope));
    failWith(codes, "completion checks");

    const ref = await pushTaskBranch(record, p, env, head, decisions);
    const tree = treeOf(p.repo, head, env);
    const preRevision = record.checkpoint.current_revision;
    const transferId = transferIdOf(record.identity_digest, head, preRevision);
    // PREPARE the publication (§7.1 step 5, §7.1.2 order, §13.3): under the
    // lock, the body blob is written and verified, then its metadata, PENDING
    // status and RTR_PENDING entry commit in one transaction.
    const bodyBytes = await tx(taskId, (st) => {
      const existing = st.rtr[transferId];
      if (existing) return store.readBlob(taskId, existing.rtr_digest, { code: "RESULT_TRANSFER_UNPROVEN" }).toString("utf8");
      const fresh = requireInstance(st, instanceId);
      if (fresh.state !== "QUIESCED") fail("QUIESCE_UNPROVEN", `instance became ${fresh.state} during completion`);
      if (permitsOf(st, instanceId).some((x) => x.state === "CLAIMED")) fail("QUIESCE_UNPROVEN", "a claimed permit appeared during completion");
      if (treeSnapshot(p.repo, env) !== fresh.tree_snapshot) fail("DIRTY_WORKTREE", "the worktree changed during completion");
      if (pendingRtr(st).some((r) => r.pre_revision === preRevision)) fail("RESULT_TRANSFER_UNPROVEN", "another PENDING record exists for this revision");
      const prepub = journalHead(st, fresh); // (1)
      const payload = buildPublicationPayload({
        transferId, resultCommitSha: head, resultTreeSha: tree, baseSha: record.identity.base_sha, identityDigest: record.identity_digest,
        prepublicationProvenanceDigest: prepub, remoteRef: ref,
      }); // (2)
      const bytes = buildRtrBody({ transferId, taskId, builderIdentityDigest: record.identity_digest, owner: record.identity.owner, preRevision, payload });
      const rtrDigest = store.putBlob(taskId, bytes); // (3) verified blob before the commit that references it
      st.rtr[transferId] = {
        status: "PENDING", rtr_digest: rtrDigest, builder_identity_digest: record.identity_digest, instance_id: instanceId,
        pre_revision: preRevision, post_revision: null, reason: null,
      };
      journal(st, fresh, "RTR_PENDING", { transfer_id: transferId, rtr_digest: rtrDigest }); // (4)
      return bytes;
    });
    await step("after-pending", { instanceId, record: structuredClone(loadRecord(instanceId)), transferId });
    verifyAdjacency(replay(snapshot(taskId), loadRecord(instanceId)).entries, transferId, bodyBytes);
    return publish(taskId, instanceId, bodyBytes, transferId);
  }

  // A QA instance (or a Builder abandoning) ends here: no S4 mutation, no push.
  async function finishWithoutPublication(instanceId) {
    const pre = loadRecord(instanceId);
    return tx(pre.task_id, (st) => {
      const record = requireInstance(st, instanceId);
      assertNoPendingPublication(st, record, "finishWithoutPublication");
      if (record.state !== "QUIESCED") fail("QUIESCE_UNPROVEN", "finish requires a quiesced instance");
      setLife(record, "COMPLETED");
      journal(st, record, "FINISHED_WITHOUT_PUBLICATION", {});
      return structuredClone(record);
    });
  }

  // ================================================================== cleanup
  // Prepare -> effect -> reconcile (§13.3). The cleanup intent carries the
  // proven root identity. A prepared cleanup is unresolved influence, so it is
  // prepared only by the slot holder or while the slot is free, and then holds
  // the slot until reconciled (§13.4, I1; see tests/execution-model.test.mjs).
  async function cleanup(instanceId) {
    const pre = loadRecord(instanceId);
    const taskId = pre.task_id;
    const prepared = await tx(taskId, (st) => {
      const record = requireInstance(st, instanceId);
      assertNoPendingPublication(st, record, "cleanup");
      if (!["COMPLETED", "QUARANTINED"].includes(record.state)) fail("INSTANCE_STALE", `cleanup requires COMPLETED or QUARANTINED, not ${record.state}`);
      const intents = st.intents[instanceId] ?? (st.intents[instanceId] = {});
      if (intents.cleanup?.status === "OPEN") return { inst: intents.cleanup.root, resumed: true };
      revokeIssued(st, record, "CLEANUP");
      const why = unresolvedInfluence(st, instanceId);
      if (why.some((w) => w.startsWith("claim:") || w.startsWith("obligation:"))) fail("QUIESCE_UNPROVEN", `cannot clean up while execution is unresolved (${why.join(", ")})`);
      if (why.length) fail("ISOLATION_UNPROVABLE", `cannot clean up while ${why.join(", ")} is unreconciled`);
      if (st.slot && st.slot.instance_id !== instanceId) fail("WORKTREE_COLLISION", `the task's active-environment slot is held by ${st.slot.instance_id}`);
      const inst = instEntry(record);
      if (!inst) {
        // A create interrupted after its prepare commit recorded no directory
        // chain. If the prepared workspace path is absent, there is nothing to
        // delete and absence is the observation; anything present there cannot
        // be proven to be this instance's own and is never deleted.
        const root = rootState();
        let present = true;
        if (root.native) {
          try {
            fs.lstatSync(path.join(root.native, slug, record.task_id, record.instance_id));
          } catch (e) {
            present = e.code !== "ENOENT";
          }
        }
        if (present) {
          quarantine(st, record, "CLEANUP_CONTAMINATION_RISK");
          return failAfterCommit("CLEANUP_CONTAMINATION_RISK", "instance root is not recorded; nothing was deleted");
        }
        setLife(record, "CLEANED");
        journal(st, record, "CLEANED", { nothing_created: true });
        return { cleaned: true };
      }
      try {
        verifyChain(record.chain.slice(0, record.chain.indexOf(inst) + 1), pathOpts);
      } catch {
        quarantine(st, record, "CLEANUP_CONTAMINATION_RISK");
        return failAfterCommit("CLEANUP_CONTAMINATION_RISK", "instance directory was substituted; nothing was deleted");
      }
      intents.cleanup = { status: "OPEN", root: inst };
      st.slot = st.slot ?? { instance_id: instanceId, create_key: null };
      journal(st, record, "CLEANUP_INTENT", { root: inst.canonical });
      return { inst, resumed: false };
    });
    if (prepared.cleaned) return loadRecord(instanceId);
    await step("after-cleanup-intent", { instanceId });
    let result;
    try {
      result = removeTreeNoFollow(prepared.inst.native, { fsImpl: cfg.cleanupFs ?? fs, windows });
    } catch (e) {
      result = { ok: false, residue: [String(e.message)] };
    }
    const outcome = await reconcileCleanup(taskId, instanceId, result);
    if (outcome !== "CLEANED") fail("CLEANUP_CONTAMINATION_RISK", `cleanup left ${result.residue?.length ?? "unknown"} entries`);
    return loadRecord(instanceId);
  }

  // Decides the cleanup outcome by observing the exact proven root.
  async function reconcileCleanup(taskId, instanceId, result = null) {
    return tx(taskId, (st) => {
      const record = requireInstance(st, instanceId);
      const intent = st.intents[instanceId]?.cleanup;
      if (intent?.status !== "OPEN") return record.state === "CLEANED" ? "CLEANED" : null;
      const absent = !fs.existsSync(intent.root.native);
      if (absent && result?.ok !== false) {
        intent.status = "DONE";
        setLife(record, "CLEANED");
        journal(st, record, "CLEANED", {});
        return "CLEANED";
      }
      intent.status = "FAILED";
      journal(st, record, "CLEANUP_FAILED", { residue: result?.residue?.length ?? null });
      if (record.state === "COMPLETED") quarantine(st, record, "CLEANUP_CONTAMINATION_RISK");
      else if (record.state === "QUARANTINED") record.quarantine_reason = record.quarantine_reason ?? "CLEANUP_CONTAMINATION_RISK";
      return "FAILED";
    });
  }

  // ======================================================== resolve (§13.1)
  // Clearing execution uncertainty on a QUARANTINED instance. Neither path
  // changes lifecycle state or historical permit status, restores or
  // un-quarantines the instance, or makes it publishable. Each closes ONLY the
  // reservations it names (AS100-F001; §13.6 I12, I13).
  //
  // Proof: read-only inspection of each OPEN liveness obligation; exactly the
  // groups proven empty become PROOF_RESOLVED. A claim reservation is never
  // closed by proof: an unreported claim has no known group to prove.
  async function resolveExecution(instanceId) {
    const pre = loadRecord(instanceId);
    return tx(pre.task_id, (st) => {
      const record = requireInstance(st, instanceId);
      if (record.state !== "QUARANTINED") fail("INSTANCE_STALE", `resolve applies only to a QUARANTINED instance, not ${record.state}`);
      const ins = inspector();
      const proven = [];
      const remaining = [];
      for (const o of openObligations(st, instanceId)) {
        if (ins.groupAlive(o.pgid)) remaining.push(o);
        else {
          closeObligation(st.permits[o.permit_id].obligations[String(o.pgid)], "PROOF_RESOLVED");
          proven.push(o);
        }
      }
      if (proven.length) journal(st, record, "EXECUTION_RESOLVED", { proven, remaining });
      return { proven, remaining, unresolved: unresolvedInfluence(st, instanceId) };
    });
  }

  // Audited operator resolution: an explicit override of ONE named target (a
  // claim reservation by permit_id, or one liveness obligation by permit_id and
  // process group), recorded with the operator identity, reason, evidence
  // reference and ACTOR_REPORTED class. Attestation, never proof.
  async function resolveExecutionByOperator(instanceId, { target, operatorId, reason, evidenceRef } = {}) {
    for (const [k, v] of [["operatorId", operatorId], ["reason", reason], ["evidenceRef", evidenceRef]]) {
      if (typeof v !== "string" || v.trim().length === 0) fail("MALFORMED_REQUEST", `operator resolution requires ${k}`);
    }
    if (!target || !["claim", "obligation"].includes(target.kind) || !ID128.test(target.permitId ?? "")
      || (target.kind === "obligation" && !Number.isInteger(target.pgid))) fail("MALFORMED_REQUEST", "operator resolution requires one exact target");
    const pre = loadRecord(instanceId);
    return tx(pre.task_id, (st) => {
      const record = requireInstance(st, instanceId);
      if (record.state !== "QUARANTINED") fail("INSTANCE_STALE", `operator resolution applies only to a QUARANTINED instance, not ${record.state}`);
      const permit = st.permits[target.permitId];
      if (!permit || permit.instance_id !== instanceId) fail("ISOLATION_UNPROVABLE", "operator resolution names a permit of another instance or no permit");
      const resolution = { operator_id: operatorId, reason, evidence_ref: evidenceRef, evidence_class: EVIDENCE_CLASS, at: new Date(clock()).toISOString() };
      let label;
      if (target.kind === "claim") {
        if (permit.state !== "CLAIMED" || permit.claim_reservation !== "OPEN") fail("ISOLATION_UNPROVABLE", `claim reservation of ${target.permitId} is not OPEN`);
        closeClaimReservation(permit, "OPERATOR_RESOLVED");
        permit.claim_resolution = resolution;
        label = `claim:${target.permitId}`;
      } else {
        const o = permit.obligations[String(target.pgid)];
        if (o?.state !== "OPEN") fail("ISOLATION_UNPROVABLE", `liveness obligation ${target.permitId}:${target.pgid} is not OPEN`);
        closeObligation(o, "OPERATOR_RESOLVED");
        o.resolution = resolution;
        label = `obligation:${target.permitId}:${target.pgid}`;
      }
      journal(st, record, "OPERATOR_RESOLUTION", { target: label, ...resolution });
      return { target: label, permit_state: permit.state, unresolved: unresolvedInfluence(st, instanceId) };
    });
  }

  // ================================================================= recovery
  async function resolvePending(taskId, transferId) {
    try {
      const st = snapshot(taskId);
      const meta = st.rtr[transferId];
      const { bytes } = attribution(taskId, st, { transfer_id: transferId, ...meta });
      const out = await publish(taskId, meta.instance_id, bytes, transferId);
      return { transfer_id: transferId, outcome: "COMMITTED", post_revision: out.post_revision };
    } catch (e) {
      const s = snapshot(taskId).rtr[transferId];
      return { transfer_id: transferId, outcome: s?.status === "ABORTED" ? "ABORTED" : "UNPROVEN", code: e instanceof ExecutionError ? e.code : "RESULT_TRANSFER_UNPROVEN" };
    }
  }

  // §15: per task, in order -- store readable; PENDING publications
  // (attribution first); prepared intents; claimed-but-unreported permits;
  // CREATING; live instances; orphans. Every step commits through §13.2 and
  // nothing is repaired or adopted by inference.
  async function recover() {
    const report = { pending: [], stale: [], quarantined: [], reconciled: [], resolved: [], orphans: [], orphan_blobs: [], blocked: [], skipped: [] };
    for (const taskId of store.listTasks()) {
      let st;
      try {
        st = snapshot(taskId);
      } catch (e) {
        report.blocked.push({ task_id: taskId, code: e instanceof ExecutionError ? e.code : "ISOLATION_UNPROVABLE" });
        continue;
      }
      try {
        assertAttributable(taskId, st);
      } catch (e) {
        report.blocked.push({ task_id: taskId, code: e.code });
        continue;
      }
      for (const p of pendingRtr(st)) report.pending.push(await resolvePending(taskId, p.transfer_id));
      // Prepared intents, reconciled by observation.
      for (const [instanceId, intents] of Object.entries(snapshot(taskId).intents)) {
        try {
          if (intents.push?.status === "OPEN") {
            const record = loadRecord(instanceId);
            const decisions = [];
            const observed = transportWith(decisions).lsRemote(intents.push.ref, envFor(pathsFor(record)));
            report.reconciled.push({ instance_id: instanceId, effect: "push", outcome: await reconcilePush(taskId, instanceId, observed, decisions) });
          }
          if (intents.cleanup?.status === "OPEN") report.reconciled.push({ instance_id: instanceId, effect: "cleanup", outcome: await reconcileCleanup(taskId, instanceId) });
        } catch (e) {
          report.skipped.push({ instance_id: instanceId, code: e instanceof ExecutionError ? e.code : "ISOLATION_UNPROVABLE" });
        }
      }
      for (const listed of listInstances(snapshot(taskId))) {
        try {
          await tx(taskId, async (s) => {
            await step("recover-locked", { instanceId: listed.instance_id });
            const record = requireInstance(s, listed.instance_id); // re-read under the lock
            if (record.state === "QUARANTINED") {
              // Execution uncertainty after quarantine: attempt the read-only
              // proof only; never infer (§15 step 4).
              const ins = inspector();
              const proven = [];
              for (const o of openObligations(s, record.instance_id)) {
                if (!ins.groupAlive(o.pgid)) {
                  closeObligation(s.permits[o.permit_id].obligations[String(o.pgid)], "PROOF_RESOLVED");
                  proven.push(o);
                }
              }
              if (proven.length) {
                journal(s, record, "EXECUTION_RESOLVED", { proven, remaining: openObligations(s, record.instance_id) });
                report.resolved.push(record.instance_id);
              }
              return;
            }
            if (!PROGRESSING.has(record.state)) return;
            const inst = instEntry(record);
            if (record.state === "CREATING") {
              record.create = "DONE";
              quarantine(s, record, "INCOMPLETE_CREATE");
              report.quarantined.push(record.instance_id);
              return;
            }
            if (!inst || !fs.existsSync(inst.native)) {
              quarantine(s, record, "MISSING_DIRECTORY");
              report.quarantined.push(record.instance_id);
              return;
            }
            // AS90-F001 / AS99-F001: a claimed permit whose claim reservation
            // is OPEN is execution-uncertain. The instance is quarantined, the
            // permit stays CLAIMED with its reservation OPEN, and the instance
            // KEEPS the slot. Elapsed time is never evidence of termination.
            if (permitsOf(s, record.instance_id).some((p) => p.state === "CLAIMED" && p.claim_reservation === "OPEN")) {
              quarantine(s, record, "QUIESCE_UNPROVEN");
              report.quarantined.push(record.instance_id);
              return;
            }
            const observed = await getState({ dir: cfg.s4Dir, taskId });
            const f = fencingFailures(record.identity, record.checkpoint, observed, clock()).filter((c) => c !== "LEASE_EXPIRED");
            if (f.length || record.stale) {
              markStale(s, record, selectReason(f) ?? record.stale_reason);
              quarantine(s, record, "INSTANCE_STALE");
              report.stale.push(record.instance_id);
            } else {
              revokeIssued(s, record, "STALE");
            }
          });
        } catch (e) {
          report.skipped.push({ instance_id: listed.instance_id, code: e instanceof ExecutionError ? e.code : "ISOLATION_UNPROVABLE" });
        }
      }
      // Blobs no committed state references are orphan evidence, reported.
      const s = snapshot(taskId);
      const referenced = new Set([
        ...Object.values(s.permits).flatMap((p) => [p.permit_digest, p.report_digest].filter(Boolean)),
        ...Object.values(s.rtr).map((r) => r.rtr_digest),
      ]);
      for (const b of store.listBlobs(taskId)) if (!referenced.has(b)) report.orphan_blobs.push(`${taskId}/${b}`);
    }
    // Orphans: directories with no task-store record are reported, never
    // adopted, even if their contents look correct.
    const root = rootState();
    const projectDir = root.native ? path.join(root.native, slug) : null;
    if (projectDir && fs.existsSync(projectDir)) {
      for (const taskId of fs.readdirSync(projectDir)) {
        const tdir = path.join(projectDir, taskId);
        if (!fs.lstatSync(tdir).isDirectory()) continue;
        let known = {};
        try {
          known = snapshot(taskId).instances;
        } catch {
          known = {};
        }
        for (const id of fs.readdirSync(tdir)) if (!known[id]) report.orphans.push(`${taskId}/${id}`);
      }
    }
    return report;
  }

  // =============================================================== provenance
  // A deterministic projection of committed history plus proven blobs (§17).
  function provenance(instanceId) {
    const { taskId, record } = locate(instanceId);
    const st = snapshot(taskId);
    const { head, entries } = replayJournal(st.journal[instanceId] ?? [], record.identity_digest);
    const of = (type) => entries.filter((e) => e.entry.type === type).map((e) => e.entry.data);
    const rtr = Object.entries(st.rtr).filter(([, r]) => r.instance_id === instanceId).map(([id, r]) => ({ transfer_id: id, status: r.status }));
    return structuredClone({
      identity: record.identity,
      identity_digest: record.identity_digest,
      isolation_level: ISOLATION_LEVEL,
      platform_profile: record.identity.platform_profile,
      checkpoint_history: of("CHECKPOINT"),
      transport_authorization_ref: cfg.transportAuthorizationRef ?? null,
      capability_decisions: of("S5_DECISION"),
      permits: permitsOf(st, instanceId).map((p) => ({
        permit_id: p.permit_id, state: effectivePermitState(p, clock()), revocation_reason: p.revocation_reason ?? null,
        claim_reservation: p.claim_reservation, claim_resolution: p.claim_resolution ?? null, obligations: p.obligations,
      })),
      claim_s5_checks: of("CLAIM_S5_CHECK"),
      execution_reports: [...of("REPORT"), ...of("LATE_REPORT")],
      operator_resolutions: of("OPERATOR_RESOLUTION"),
      result_transfer_records: rtr,
      qa_source_transfer_id: record.qa_source_transfer_id,
      holds_task_slot: st.slot?.instance_id === instanceId,
      active: isActive(st, instanceId),
      unresolved_influence: unresolvedInfluence(st, instanceId),
      journal_head: head,
      journal_length: entries.length,
      state: record.state,
      quarantine_reason: record.quarantine_reason,
      evidence_class: EVIDENCE_CLASS,
      non_authority_disclaimer: NON_AUTHORITY_DISCLAIMER,
    });
  }

  // A read-only copy of one instance record (§13.5 status view).
  function instanceStatus(instanceId) {
    return structuredClone(loadRecord(instanceId));
  }

  const host = Object.freeze({
    createInstance, validateInstance, attach, adoptRenewal, requestPermit, claimPermit, recordReport, quiesce, complete,
    finishWithoutPublication, cleanup, recover, resolveExecution, resolveExecutionByOperator, provenance, instanceStatus, platformProfile,
  });
  return { host, store, snapshot, locate };
}

// Production construction (§13.5): closed operations and read-only views only.
// It accepts no fault-injection or store hook and returns no store object.
export function createExecutionHost(config) {
  if (config && typeof config === "object" && ("faults" in config || "storeHooks" in config)) {
    fail("MALFORMED_REQUEST", "fault injection is not part of the production S6 host");
  }
  return buildExecutionHost(config, null).host;
}
