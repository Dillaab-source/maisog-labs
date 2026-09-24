// S6 lifecycle tests: create -> attach -> permit/claim/report -> quiesce ->
// complete -> QA reconstruction -> cleanup, and the full §14 reason-code
// matrix (ML-DEVOS-RFC-019 §3-§17, §18; D-071).
//
// Local bare remote, temporary S4 store, real public S5 createGateway(). Work
// inside instances is performed only by the closed fixed-operation fixture
// table; S6 core itself executes nothing but its internal fixed git calls.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { renew } from "../devos/state/kernel.mjs";
import { PAYLOAD_MEMBERS, REASON_CODES } from "../devos/execution/index.mjs";
import { createDirChain, verifiedBase } from "../devos/execution/paths.mjs";
import { fakeDriver, runFixed, terminateFixtureGroups } from "./fixtures/execution/drivers.mjs";
import {
  advanceRemoteMain, cleanupWorld, createRemoteBranch, forceMoveRemoteBranch, gatewayFor, headCommitText, headOf, makeWorld, plantHooksPathConfig,
  qaClaimChain, remoteRefSha, resetToOrphanOfBase, trustedHost,
} from "./fixtures/execution/harness.mjs";

const SLUG = "Dillaab-source__maisog-labs";
const codeOf = async (p) => {
  try {
    await (typeof p === "function" ? p() : p);
  } catch (e) {
    return e.code ?? `UNCODED:${e.message}`;
  }
  return "NO_ERROR";
};
const instRoot = (w, rec) => path.join(w.dirs.workspace, SLUG, w.taskId, rec.instance_id);
const repoOf = (w, rec) => path.join(instRoot(w, rec), "repo");
const s4Record = (w) => JSON.parse(fs.readFileSync(path.join(w.dirs.s4, `${w.taskId}.json`), "utf8"));
const journalEntries = (w, rec) => fs.readFileSync(path.join(w.dirs.state, "journal", `${rec.instance_id}.jsonl`), "utf8").trim().split("\n").map((l) => JSON.parse(l));

async function withWorld(opts, fn) {
  const w = await makeWorld(opts);
  try {
    return await fn(w);
  } finally {
    cleanupWorld(w);
  }
}

async function created(w, over = {}) {
  const h = w.host(over);
  const rec = await h.createInstance({ role: "BUILDER", claimResult: w.anchor });
  await h.attach(rec.instance_id, { actorId: w.builder });
  return { h, rec };
}

async function build(h, rec, ops = ["WRITE_FEATURE", "STAGE_ALL", "COMMIT"]) {
  let n = 0;
  for (const op of ops) await runFixed(h, { instanceId: rec.instance_id, checkpointRevision: rec.checkpoint.current_revision, requestId: `op-${n++}-${op}`, op });
}

async function published(w) {
  const { h, rec } = await created(w);
  await build(h, rec);
  await h.quiesce(rec.instance_id);
  const out = await h.complete(rec.instance_id, { actorId: w.builder });
  return { h, rec, out };
}

function qaHost(w, actorId = "qa-1", actorRole = "QA", over = {}) {
  const trust = trustedHost({ actorId, actorRole });
  return { trust, hq: w.host({ gateway: gatewayFor(w.dirs.workspace, trust), ...over }) };
}

// =========================================================================== happy path
test("Builder happy path: publication replays the stored ACTOR_REPORTED evidenceRef bytes into S4 (§7.1, §7.1.1)", () => withWorld({}, async (w) => {
  const { h, rec, out } = await published(w);
  const s4 = await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId });
  assert.equal(s4.state, "READY_FOR_QA");
  assert.equal(s4.owner, null);
  assert.equal(s4.revision, rec.checkpoint.current_revision + 1);
  assert.equal(out.post_revision, s4.revision);

  const bodyBytes = h.registry.readRtrBody(w.taskId, out.transfer_id);
  const body = JSON.parse(bodyBytes);
  const last = s4Record(w).history.at(-1);
  assert.equal(last.type, "transition");
  assert.equal(last.to, "READY_FOR_QA");
  assert.equal(JSON.stringify(last.evidenceRef), body.publication_evidence_ref_json, "S4 holds exactly the stored bytes");
  assert.deepEqual(Object.keys(last.evidenceRef), [...PAYLOAD_MEMBERS]);
  assert.equal(last.evidenceRef.evidenceClass, "ACTOR_REPORTED");
  assert.equal(last.evidenceRef.result_commit_sha, out.result_commit_sha);
  assert.equal(last.evidenceRef.base_sha, w.baseSha);
  assert.equal(h.registry.getRtrStatus(w.taskId, out.transfer_id).status, "COMMITTED");

  // Non-circular: the prepublication digest is the journal head immediately
  // before RTR_PENDING, and nothing was interleaved.
  const entries = journalEntries(w, rec);
  const pending = entries.findIndex((e) => e.type === "RTR_PENDING");
  assert.equal(entries[pending].prev_head, last.evidenceRef.prepublication_provenance_digest);
  assert.equal(entries[pending - 1].type, "PUSH_VERIFIED");

  // The remote task branch holds the result; main is untouched.
  assert.equal(remoteRefSha(w, `refs/heads/${rec.identity.task_branch}`), out.result_commit_sha);
  assert.equal(remoteRefSha(w, "refs/heads/main"), w.baseSha);

  const prov = h.provenance(rec.instance_id);
  assert.equal(prov.evidence_class, "ACTOR_REPORTED");
  assert.match(prov.non_authority_disclaimer, /not/i);
  assert.equal(prov.isolation_level, "L3");
  assert.deepEqual(prov.result_transfer_records, [{ transfer_id: out.transfer_id, status: "COMMITTED" }]);
  assert.equal(prov.execution_reports.length, 3);
  assert.equal(prov.claim_s5_checks.length, 3);
  assert.ok(prov.capability_decisions.some((d) => d.action === "git.push" || JSON.stringify(d).includes("git.push")));
  assert.equal((await h.cleanup(rec.instance_id)).state, "CLEANED");
  assert.equal(fs.existsSync(instRoot(w, rec)), false);
  assert.equal(fs.readFileSync(path.join(w.dirs.outside, "SENTINEL.txt"), "utf8"), "must survive\n");
}));

test("instance environment excludes host credential canaries; instance commits are unsigned and use the instance identity (§6, §10, §12)", () => withWorld({}, async (w) => {
  const canaries = { GITHUB_TOKEN: "canary-gh", GH_TOKEN: "canary-gh2", NPM_TOKEN: "canary-npm", AWS_SECRET_ACCESS_KEY: "canary-aws", SSH_AUTH_SOCK: "/canary.sock", GIT_DIR: "/canary-git-dir", GIT_SSH_COMMAND: "canary-ssh" };
  const saved = Object.fromEntries(Object.keys(canaries).map((k) => [k, process.env[k]]));
  Object.assign(process.env, canaries);
  try {
    const { h, rec } = await created(w);
    const r = await runFixed(h, { instanceId: rec.instance_id, checkpointRevision: rec.checkpoint.current_revision, requestId: "env-1", op: "WRITE_FEATURE" });
    const values = Object.values(r.environment).join("\n");
    for (const [k, v] of Object.entries(canaries)) {
      assert.equal(r.environment[k], undefined, k);
      assert.ok(!values.includes(v), `${k} value leaked`);
    }
    assert.equal(r.environment.HOME, path.join(instRoot(w, rec), "home"));
    assert.equal(r.environment.GIT_CONFIG_NOSYSTEM, "1");
    await build(h, rec, ["STAGE_ALL", "COMMIT"]);
    const commit = headCommitText(w, repoOf(w, rec));
    assert.doesNotMatch(commit, /^gpgsig/m, "unsigned");
    assert.match(commit, /^author Sentinel S6 Instance <s6-instance@invalid>/m);
    assert.deepEqual(fs.readdirSync(path.join(instRoot(w, rec), "config", "hooks")), [], "no hooks installed");
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}));

// =========================================================================== QA
test("QA reconstructs independently from the committed record's exact commit; it publishes nothing (§7.1 step 6)", () => withWorld({}, async (w) => {
  const { out } = await published(w);
  const chain = await qaClaimChain(w, "qa-1");
  const { hq, trust } = qaHost(w);
  const qa = await hq.createInstance({ role: "QA", qaChain: chain });
  assert.equal(qa.identity.base_sha, out.result_commit_sha);
  assert.equal(qa.identity.base_ref, `s6-rtr:${out.transfer_id}`);
  assert.match(qa.identity.task_branch, /\/qa\/[0-9a-f]{32}$/);
  assert.equal(qa.qa_source_transfer_id, out.transfer_id);
  assert.equal(fs.readFileSync(path.join(repoOf(w, qa), "src", "feature.txt"), "utf8"), "fixture feature\n");
  await hq.attach(qa.instance_id, { actorId: "qa-1" });
  // QA's own subject binding: the QA role maps to S5 "QA"; Builder is refused.
  trust.state.actorRole = "Builder";
  assert.equal(await codeOf(hq.requestPermit({ instance_id: qa.instance_id, request_id: "qa-r", argv: ["s6-fixture", "write", "src/feature.txt"], checkpoint_revision: qa.checkpoint.current_revision })), "CAPABILITY_DENIED");
  trust.state.actorRole = "QA";
  const child = await runFixed(hq, { instanceId: qa.instance_id, checkpointRevision: qa.checkpoint.current_revision, requestId: "qa-1", op: "START_LONG_LIVED_CHILD" });
  try {
    assert.equal(await codeOf(hq.quiesce(qa.instance_id)), "QUIESCE_UNPROVEN", "a live reported group blocks quiescence");
  } finally {
    terminateFixtureGroups(child.processGroups);
  }
  await hq.quiesce(qa.instance_id);
  assert.equal(await codeOf(hq.complete(qa.instance_id, { actorId: "qa-1" })), "MALFORMED_REQUEST", "QA never publishes");
  const before = (await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).revision;
  await hq.finishWithoutPublication(qa.instance_id);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).revision, before, "no S4 mutation by QA");
  assert.equal((await hq.cleanup(qa.instance_id)).state, "CLEANED");
}));

test("QA reconstruction pins the recorded SHA even after the remote task branch is moved", () => withWorld({}, async (w) => {
  const { rec, out } = await published(w);
  forceMoveRemoteBranch(w, w.baseSha, `refs/heads/${rec.identity.task_branch}`);
  const chain = await qaClaimChain(w, "qa-1");
  const qa = await qaHost(w).hq.createInstance({ role: "QA", qaChain: chain });
  assert.equal(qa.identity.base_sha, out.result_commit_sha);
  assert.equal(headOf(w, repoOf(w, qa)), out.result_commit_sha);
}));

test("QA source proof: gapped chain, self-review, altered record body all fail closed", () => withWorld({}, async (w) => {
  const { h, out } = await published(w);
  const chain = await qaClaimChain(w, "qa-1");
  const { hq } = qaHost(w);
  assert.equal(await codeOf(hq.createInstance({ role: "QA", qaChain: [chain[0]] })), "FENCING_REVISION_MISMATCH", "an incomplete chain's anchor is not current S4");
  assert.equal(await codeOf(hq.createInstance({ role: "QA", qaChain: [{ ...chain[0], revision: chain[0].revision - 1 }, chain[1]] })), "RESULT_TRANSFER_UNPROVEN");
  assert.equal(await codeOf(hq.createInstance({ role: "QA", qaChain: [{ ...chain[0], owner: "qa-2" }, chain[1]] })), "RESULT_TRANSFER_UNPROVEN", "a chain with a foreign mutation");
  assert.equal(await codeOf(hq.createInstance({ role: "QA", qaChain: [chain[0], { ...chain[1], revision: chain[1].revision + 1 }] })), "FENCING_REVISION_MISMATCH");
  const bodyFile = path.join(w.dirs.state, "registry", w.taskId, "rtr", `${out.transfer_id}.body.json`);
  const bytes = fs.readFileSync(bodyFile, "utf8");
  fs.writeFileSync(bodyFile, bytes.replace(out.result_commit_sha, "0".repeat(40)));
  assert.equal(await codeOf(hq.createInstance({ role: "QA", qaChain: chain })), "RESULT_TRANSFER_UNPROVEN");
  fs.writeFileSync(bodyFile, bytes);
  assert.equal(h.registry.readRtrBody(w.taskId, out.transfer_id), bytes);
}));

test("QA independence: the Builder that produced the result cannot QA it", () => withWorld({}, async (w) => {
  await published(w);
  const chain = await qaClaimChain(w, w.builder);
  const { hq } = qaHost(w, w.builder, "QA");
  assert.equal(await codeOf(hq.createInstance({ role: "QA", qaChain: chain })), "QA_INDEPENDENCE_VIOLATION");
}));

// =========================================================================== fencing
test("fencing checkpoint: gap-free renewal adoption; permits bind the current revision; a gap is INSTANCE_STALE", () => withWorld({}, async (w) => {
  const { h, rec } = await created(w);
  const r1 = await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
  const cp = await h.adoptRenewal(rec.instance_id, { result: r1 });
  assert.equal(cp.current_revision, rec.checkpoint.current_revision + 1);
  const req = (rid, rev) => ({ instance_id: rec.instance_id, request_id: rid, argv: ["s6-fixture", "write", "src/feature.txt"], checkpoint_revision: rev });
  assert.equal(await codeOf(h.requestPermit(req("old", rec.checkpoint.current_revision))), "FENCING_REVISION_MISMATCH");
  assert.equal((await h.requestPermit(req("new", cp.current_revision))).state, "ISSUED");
  const r2 = await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: cp.current_revision, newLeaseDurationMs: 600000 });
  const r3 = await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: r2.revision, newLeaseDurationMs: 600000 });
  assert.equal(await codeOf(h.adoptRenewal(rec.instance_id, { result: r3 })), "INSTANCE_STALE");
  assert.equal(h.registry.findInstance(rec.instance_id).stale, true);
  assert.equal((await h.validateInstance(rec.instance_id)).reason, "FENCING_REVISION_MISMATCH");
}));

test("a publication transition rejected by S4 aborts the record: ABORTED / STALE_UNPUBLISHED, no S4 change", () => withWorld({}, async (w) => {
  const h0 = w.host();
  const rec = await h0.createInstance({ role: "BUILDER", claimResult: w.anchor });
  const h = w.host({
    faults: {
      onStep: (name) => {
        if (name === "after-pending") return renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
        return undefined;
      },
    },
  });
  await h.attach(rec.instance_id, { actorId: w.builder });
  await build(h, rec);
  await h.quiesce(rec.instance_id);
  const code = await codeOf(h.complete(rec.instance_id, { actorId: w.builder }));
  const s4 = await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId });
  assert.equal(s4.state, "BUILDING", "S4 never moved to READY_FOR_QA");
  assert.equal(code, "FENCING_REVISION_MISMATCH");
  const [r] = h.registry.listRtr(w.taskId);
  assert.equal(r.status.status, "ABORTED");
  const aborted = journalEntries(w, rec).find((e) => e.type === "RTR_ABORTED");
  assert.equal(aborted.data.disposition, "STALE_UNPUBLISHED");
  assert.equal(h.registry.findInstance(rec.instance_id).stale, true);
}));

// =========================================================================== precedence
test("validation reports ALL failing checks and selects the lowest-ranked code (§14)", () => withWorld({}, async (w) => {
  const { h, rec } = await created(w);
  fs.writeFileSync(path.join(repoOf(w, rec), "src", "unexplained.txt"), "x\n");
  fs.writeFileSync(path.join(instRoot(w, rec), "home", ".git-credentials"), "https://u:p@example.invalid\n");
  plantHooksPathConfig(w, repoOf(w, rec));
  const v = await h.validateInstance(rec.instance_id);
  assert.equal(v.reason, "ENV_POLICY_VIOLATION");
  for (const c of ["ENV_POLICY_VIOLATION", "SECRET_MATERIAL_DETECTED", "DIRTY_WORKTREE"]) assert.ok(v.codes.includes(c), c);
  await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
  const v2 = await h.validateInstance(rec.instance_id);
  assert.equal(v2.reason, "FENCING_REVISION_MISMATCH");
  assert.ok(v2.codes.includes("DIRTY_WORKTREE"));
}));

// =========================================================================== reason-code matrix
// Every one of the 30 codes is produced by a concrete scenario. All but one
// run through the public host API; WORKTREE_COLLISION (a 128-bit instance id
// collision) is forced at the path-creation layer the host uses.
const PROFILE = { git_version: "2.45.0", case_sensitive: true, symlinks: true };
const MATRIX = {
  MALFORMED_REQUEST: (w) => w.host().createInstance({ role: "ADMIN", claimResult: w.anchor }),
  ISOLATION_PLATFORM_UNSUPPORTED: (w) => w.host({ platformProfile: { ...PROFILE, os: "aix", liveness_proof: "none" } }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  ISOLATION_CAPABILITY_MISSING: (w) => w.host({ platformProfile: { ...PROFILE, os: "win32", case_sensitive: false, liveness_proof: "none" } }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  WORKSPACE_ROOT_INVALID: (w) => w.host({ workspaceRoot: w.dirs.seed }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  TASK_CONTRACT_MISMATCH: (w) => w.host({ resolveContract: () => { throw new Error("gone"); } }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  ISOLATION_PROFILE_INSUFFICIENT: { world: { contractOverrides: { scope: { remote_resources_involved: true }, claims: [{ claim_id: "CLAIM-1", claim_kind: "IMPLEMENTATION_PRESENT", statement: "Present.", evidence: { all_of: ["ACTOR_REPORTED", "INDEPENDENTLY_INSPECTED"], any_of: [] } }] } }, run: (w) => w.host().createInstance({ role: "BUILDER", claimResult: w.anchor }) },
  REPOSITORY_MISMATCH: (w) => w.host({ repository: "github.com/someone/else" }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  OWNER_MISMATCH: (w) => w.host().createInstance({ role: "BUILDER", claimResult: { ...w.anchor, owner: "not-the-owner" } }),
  FENCING_REVISION_MISMATCH: (w) => w.host().createInstance({ role: "BUILDER", claimResult: { ...w.anchor, revision: w.anchor.revision - 1 } }),
  LEASE_EXPIRED: (w) => w.host({ clock: () => Date.now() + 3600 * 1000 }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  INSTANCE_STALE: async (w) => {
    const { h, rec } = await created(w);
    const r1 = await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
    const r2 = await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: r1.revision, newLeaseDurationMs: 600000 });
    return h.adoptRenewal(rec.instance_id, { result: r2 });
  },
  QA_INDEPENDENCE_VIOLATION: async (w) => {
    await published(w);
    return qaHost(w, w.builder).hq.createInstance({ role: "QA", qaChain: await qaClaimChain(w, w.builder) });
  },
  RESULT_TRANSFER_UNPROVEN: async (w) => {
    await published(w);
    // A chain whose first link claims to start one revision too early: the
    // anchor is current, but no COMMITTED record sits at the claimed origin.
    const [c, t] = await qaClaimChain(w, "qa-1");
    return qaHost(w).hq.createInstance({ role: "QA", qaChain: [{ ...c, revision: c.revision - 1 }, t] });
  },
  TRANSPORT_NOT_AUTHORIZED: (w) => w.host({ remote: "https://example.invalid/maisog-labs.git" }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  CAPABILITY_DENIED: (w) => {
    w.builderTrust.state.revoked = ["S6-B-LS"];
    return w.host().createInstance({ role: "BUILDER", claimResult: w.anchor });
  },
  BASE_UNAVAILABLE: (w) => w.host({ baseRef: "refs/heads/does-not-exist" }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  BASE_SHA_MISMATCH: async (w) => {
    const { h, rec } = await created(w);
    const repo = repoOf(w, rec);
    resetToOrphanOfBase(w, repo);
    const v = await h.validateInstance(rec.instance_id);
    assert.ok(v.codes.includes("DIRTY_WORKTREE"), "the snapshot also changed; precedence picks the base failure");
    return h.requestPermit({ instance_id: rec.instance_id, request_id: "x", argv: ["x"], checkpoint_revision: rec.checkpoint.current_revision });
  },
  BASE_ADVANCED: async (w) => {
    const { h, rec } = await created(w);
    await build(h, rec);
    await h.quiesce(rec.instance_id);
    advanceRemoteMain(w);
    return h.complete(rec.instance_id, { actorId: w.builder });
  },
  WORKTREE_COLLISION: (w) => {
    const base = verifiedBase(fs.realpathSync(w.dirs.workspace));
    createDirChain(base, ["same-id"], { exclusiveLast: true });
    createDirChain(base, ["same-id"], { exclusiveLast: true });
  },
  BRANCH_COLLISION: (w) => w.host({
    faults: {
      onStep: (name, ctx) => {
        if (name === "after-create-begin") createRemoteBranch(w, w.baseSha, `refs/heads/${ctx.record.identity.task_branch}`);
      },
    },
  }).createInstance({ role: "BUILDER", claimResult: w.anchor }),
  PATH_ESCAPE: (w) => {
    fs.symlinkSync(w.dirs.outside, path.join(w.dirs.workspace, SLUG));
    return w.host().createInstance({ role: "BUILDER", claimResult: w.anchor });
  },
  UNRESOLVED_LINK: (w) => {
    fs.symlinkSync(path.join(w.dirs.top, "nowhere"), path.join(w.dirs.workspace, SLUG));
    return w.host().createInstance({ role: "BUILDER", claimResult: w.anchor });
  },
  ENV_POLICY_VIOLATION: async (w) => {
    const { h, rec } = await created(w);
    plantHooksPathConfig(w, repoOf(w, rec));
    return h.attach(rec.instance_id, { actorId: w.builder });
  },
  SECRET_MATERIAL_DETECTED: async (w) => {
    const { h, rec } = await created(w);
    fs.writeFileSync(path.join(instRoot(w, rec), "home", "id_ed25519"), "not really a key\n");
    return h.attach(rec.instance_id, { actorId: w.builder });
  },
  DIRTY_WORKTREE: async (w) => {
    const { h, rec } = await created(w);
    fs.writeFileSync(path.join(repoOf(w, rec), "src", "sneaky.txt"), "x\n");
    return h.attach(rec.instance_id, { actorId: w.builder });
  },
  UNEXPECTED_UNTRACKED: async (w) => {
    const { h, rec } = await created(w);
    await build(h, rec, ["WRITE_FEATURE", "STAGE_ALL", "COMMIT", "WRITE_IGNORED_LOG"]);
    await h.quiesce(rec.instance_id);
    return h.complete(rec.instance_id, { actorId: w.builder });
  },
  SCOPE_VIOLATION: async (w) => {
    const { h, rec } = await created(w);
    await build(h, rec, ["WRITE_OUT_OF_SCOPE", "STAGE_ALL", "COMMIT"]);
    await h.quiesce(rec.instance_id);
    return h.complete(rec.instance_id, { actorId: w.builder });
  },
  QUIESCE_UNPROVEN: async (w) => {
    const { h, rec } = await created(w);
    await build(h, rec);
    return h.complete(rec.instance_id, { actorId: w.builder });
  },
  CLEANUP_CONTAMINATION_RISK: async (w) => {
    const failing = { ...fs, unlinkSync: () => { throw Object.assign(new Error("EBUSY"), { code: "EBUSY" }); } };
    const { h, rec } = await created(w, { cleanupFs: failing });
    await h.quiesce(rec.instance_id);
    await h.finishWithoutPublication(rec.instance_id);
    try {
      return await h.cleanup(rec.instance_id);
    } finally {
      assert.equal(h.registry.findInstance(rec.instance_id).state, "QUARANTINED");
      assert.equal(fs.readFileSync(path.join(w.dirs.outside, "SENTINEL.txt"), "utf8"), "must survive\n");
    }
  },
  ISOLATION_UNPROVABLE: async (w) => {
    const { h, rec } = await created(w);
    const f = path.join(w.dirs.state, "journal", `${rec.instance_id}.jsonl`);
    const lines = fs.readFileSync(f, "utf8").split("\n");
    const e = JSON.parse(lines[1]);
    e.data = { tampered: true };
    lines[1] = JSON.stringify(e);
    fs.writeFileSync(f, lines.join("\n"));
    return h.attach(rec.instance_id, { actorId: w.builder });
  },
};

test("reason-code matrix: the scenario table covers all 30 codes exactly", () => {
  assert.deepEqual(Object.keys(MATRIX).sort(), [...REASON_CODES].sort());
});

for (const code of REASON_CODES) {
  test(`reason code ${code} (rank ${REASON_CODES.indexOf(code)}) is produced by its scenario`, async () => {
    const entry = MATRIX[code];
    const run = typeof entry === "function" ? entry : entry.run;
    await withWorld(typeof entry === "function" ? {} : entry.world, async (w) => {
      assert.equal(await codeOf(() => run(w)), code);
    });
  });
}

test("scope: prohibited paths inside an allowed prefix are refused; nothing is pushed on failure", () => withWorld({}, async (w) => {
  const { h, rec } = await created(w);
  await build(h, rec, ["WRITE_PROHIBITED", "STAGE_ALL", "COMMIT"]);
  await h.quiesce(rec.instance_id);
  assert.equal(await codeOf(h.complete(rec.instance_id, { actorId: w.builder })), "SCOPE_VIOLATION");
  assert.equal(remoteRefSha(w, `refs/heads/${rec.identity.task_branch}`), null, "no push happened");
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
}));

test("transport: a denied push is CAPABILITY_DENIED and leaves S4 and the remote untouched", () => withWorld({}, async (w) => {
  const root = fs.realpathSync(w.dirs.workspace);
  const { policyFor } = await import("./fixtures/execution/harness.mjs");
  const { h, rec } = await created(w, { gateway: gatewayFor(w.dirs.workspace, w.builderTrust, { policies: [policyFor(root, { denyPush: true })] }) });
  await build(h, rec);
  await h.quiesce(rec.instance_id);
  assert.equal(await codeOf(h.complete(rec.instance_id, { actorId: w.builder })), "CAPABILITY_DENIED");
  assert.equal(remoteRefSha(w, `refs/heads/${rec.identity.task_branch}`), null);
  assert.equal((await w.s4.getState({ dir: w.dirs.s4, taskId: w.taskId })).state, "BUILDING");
  assert.equal(h.registry.listRtr(w.taskId).length, 0);
}));

test("a quarantined instance cannot be attached, permitted, or completed; only cleaned up", () => withWorld({}, async (w) => {
  const { h, rec } = await created(w);
  fs.writeFileSync(path.join(repoOf(w, rec), "src", "sneaky.txt"), "x\n");
  const restarted = w.host();
  await renew({ dir: w.dirs.s4, taskId: w.taskId, actorId: w.builder, expectedRevision: rec.checkpoint.current_revision, newLeaseDurationMs: 600000 });
  const report = await restarted.recover();
  assert.deepEqual(report.stale, [rec.instance_id]);
  assert.equal(restarted.registry.findInstance(rec.instance_id).state, "QUARANTINED");
  assert.equal(await codeOf(restarted.attach(rec.instance_id, { actorId: w.builder })), "FENCING_REVISION_MISMATCH");
  assert.equal(await codeOf(restarted.complete(rec.instance_id, { actorId: w.builder })), "QUIESCE_UNPROVEN");
  assert.equal((await restarted.cleanup(rec.instance_id)).state, "CLEANED");
}));
