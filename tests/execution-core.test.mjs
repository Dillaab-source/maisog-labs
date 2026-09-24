// S6 core unit tests (ML-DEVOS-RFC-019 §3, §7.1.x, §9, §10, §13.1, §14, §16,
// §18; D-071). Pure or filesystem-local; no command execution.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as S6 from "../devos/execution/index.mjs";
import { REASON_CODES, canonicalS5Role, rankOf, selectReason } from "../devos/execution/vocabulary.mjs";
import { adoptS4Result, buildExecutionIdentity, fencingFailures, identityDigest, initialCheckpoint, taskBranchName, IDENTITY_FIELDS } from "../devos/execution/identity.mjs";
import { createDirChain, createFileExclusive, isWithin, removeTreeNoFollow, segmentProblem, toCanonical, verifiedBase, verifyChain } from "../devos/execution/paths.mjs";
import { Journal, genesisHead, replayJournal } from "../devos/execution/journal.mjs";
import { PAYLOAD_MEMBERS, buildPublicationPayload, buildRtrBody, storedEvidenceRef, transferIdOf, verifyAdjacency } from "../devos/execution/rtr.mjs";
import { buildInstanceEnvironment, environmentFailures, instancePaths, localConfigFailures, scanCredentialFiles } from "../devos/execution/environment.mjs";
import { pushRefProblem, remoteProblem } from "../devos/execution/transport.mjs";
import { profileFailures } from "../devos/execution/platform.mjs";
import { proveGroupsEmpty } from "../devos/execution/liveness.mjs";
import { argvDigest, buildPermitBody, validateReport, validateRequest, verifyClaimResult, verifyIssuanceResult } from "../devos/execution/permits.mjs";
import { sha256 } from "../devos/execution/digest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXEC = path.join(ROOT, "devos", "execution");
const code = (fn) => {
  try {
    fn();
  } catch (e) {
    return e.code;
  }
  return "NO_ERROR";
};
const tmp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "s6-core-")));
const H64 = "a".repeat(64);
const H40 = "b".repeat(40);
const ID = "c".repeat(32);

// ------------------------------------------------------------- execution boundary (D-069)
test("S6 core exposes no command-execution primitive (D-069, §13.1, §18 item 14)", () => {
  // The first camelCase word of every public export must not be an execution verb.
  const verbs = new Set(["run", "spawn", "exec", "execute", "shell", "system", "popen", "fork"]);
  for (const k of Object.keys(S6)) assert.ok(!verbs.has(k.match(/^[A-Za-z][a-z]*/)[0].toLowerCase()), `public export ${k}`);
  const files = fs.readdirSync(EXEC).filter((f) => f.endsWith(".mjs"));
  const importers = files.filter((f) => /from "node:child_process"/.test(fs.readFileSync(path.join(EXEC, f), "utf8")));
  assert.deepEqual(importers, ["git.mjs"], "only the fixed internal git runner may start a process");
  const gitSrc = fs.readFileSync(path.join(EXEC, "git.mjs"), "utf8");
  assert.match(gitSrc, /const GIT_BINARY = "git";/);
  assert.match(gitSrc, /execFileSync\(GIT_BINARY,/);
  assert.doesNotMatch(gitSrc, /\bspawn\b|\bexec\(|shell:\s*true/);
  assert.doesNotMatch(fs.readFileSync(path.join(EXEC, "index.mjs"), "utf8"), /git\.mjs/, "the git runner is not public");
  // No S6 core module sends signals to processes.
  for (const f of files) assert.doesNotMatch(fs.readFileSync(path.join(EXEC, f), "utf8"), /process\.kill\([^)]*"SIG/, `${f} must not signal processes`);
});

// ------------------------------------------------------------- vocabulary
test("reason vocabulary: 30 ordered codes, deterministic precedence", () => {
  assert.equal(REASON_CODES.length, 30);
  assert.equal(new Set(REASON_CODES).size, 30);
  assert.equal(REASON_CODES[0], "MALFORMED_REQUEST");
  assert.equal(REASON_CODES[29], "ISOLATION_UNPROVABLE");
  assert.equal(selectReason(["DIRTY_WORKTREE", "FENCING_REVISION_MISMATCH", "ISOLATION_UNPROVABLE"]), "FENCING_REVISION_MISMATCH");
  assert.equal(selectReason(["ISOLATION_UNPROVABLE", "DIRTY_WORKTREE"]), "DIRTY_WORKTREE");
  assert.equal(selectReason([]), null);
  assert.throws(() => rankOf("NEW_CODE"), TypeError);
  assert.throws(() => new S6.ExecutionError("NEW_CODE", "x"), TypeError);
});

test("canonical S6 -> S5 role mapping is fixed and total (AS92-F001)", () => {
  assert.equal(canonicalS5Role("BUILDER"), "Builder");
  assert.equal(canonicalS5Role("QA"), "QA");
  for (const r of ["builder", "Builder", "ARCHITECT", "", undefined, "__proto__", "toString"]) assert.equal(canonicalS5Role(r), null);
});

// ------------------------------------------------------------- identity / checkpoint
const identityFields = () => ({
  project: "P/q", repository: "github.com/P/q", task_id: "TASK-A", contract_ref: "contract:TASK-A", contract_digest: H64, role: "BUILDER",
  owner: "builder-1", anchor_revision: 5, base_ref: "refs/heads/main", base_sha: H40, task_branch: taskBranchName("TASK-A", "BUILDER", ID),
  instance_id: ID, workspace_path: "/ws/x", platform_profile: { os: "linux" },
});

test("Execution Identity is immutable, digested, and has no mutable revision (§3)", () => {
  const id = buildExecutionIdentity(identityFields());
  assert.ok(Object.isFrozen(id));
  assert.deepEqual(Object.keys(id), [...IDENTITY_FIELDS]);
  assert.equal(id.isolation_level, "L3");
  assert.equal(identityDigest(id), identityDigest(buildExecutionIdentity(identityFields())));
  assert.equal(code(() => buildExecutionIdentity({ ...identityFields(), task_branch: "sentinel/s6/TASK-A/builder/other" })), "MALFORMED_REQUEST");
  assert.equal(code(() => buildExecutionIdentity({ ...identityFields(), base_sha: "HEAD" })), "MALFORMED_REQUEST");
  assert.equal(taskBranchName("TASK-A", "QA", ID), `sentinel/s6/TASK-A/qa/${ID}`);
});

test("Fencing Checkpoint advances only by verified gap-free +1 (§3.1, AS86-F001)", () => {
  const id = buildExecutionIdentity(identityFields());
  const cp = initialCheckpoint({ taskId: "TASK-A", owner: "builder-1", revision: 5 }, "claim");
  const next = adoptS4Result(cp, id, { taskId: "TASK-A", owner: "builder-1", revision: 6 }, "renew", { owner: "builder-1", revision: 6 });
  assert.equal(next.current_revision, 6);
  assert.equal(identityDigest(id), identityDigest(buildExecutionIdentity(identityFields())), "renewal leaves the identity digest unchanged");
  const stale = (r, obs) => code(() => adoptS4Result(cp, id, r, "renew", obs));
  assert.equal(stale({ taskId: "TASK-A", owner: "builder-1", revision: 7 }, { owner: "builder-1", revision: 7 }), "INSTANCE_STALE", "gap");
  assert.equal(stale({ taskId: "TASK-A", owner: "other", revision: 6 }, { owner: "other", revision: 6 }), "INSTANCE_STALE", "other owner");
  assert.equal(stale({ taskId: "TASK-B", owner: "builder-1", revision: 6 }, { owner: "builder-1", revision: 6 }), "INSTANCE_STALE", "other task");
  assert.equal(stale({ taskId: "TASK-A", owner: "builder-1", revision: 5 }, { owner: "builder-1", revision: 5 }), "INSTANCE_STALE", "no advance");
  assert.equal(stale({ taskId: "TASK-A", owner: "builder-1", revision: 6 }, { owner: "builder-1", revision: 7 }), "INSTANCE_STALE", "further mutation observed");
  assert.deepEqual(fencingFailures(id, cp, { owner: "x", revision: 9, lease_expires_at: 0, state: "QA" }, 1), ["OWNER_MISMATCH", "FENCING_REVISION_MISMATCH", "LEASE_EXPIRED", "INSTANCE_STALE"]);
  assert.deepEqual(fencingFailures(id, cp, { owner: "builder-1", revision: 5, lease_expires_at: 10, state: "BUILDING" }, 1), []);
});

// ------------------------------------------------------------- paths (§9, §9.1)
test("path segments: every invalid tail form is rejected before any filesystem call (§9.1)", () => {
  for (const bad of ["", ".", "..", "a/b", "a\\b", "a\u0000b", "C:", "file:stream", "name.", "name ", "CON", "nul.txt", "COM1", "LPT9.log", "PROGRA~1", "a<b", "a|b", "x".repeat(256), "e\u0301"]) {
    assert.ok(segmentProblem(bad), `must reject ${JSON.stringify(bad)}`);
  }
  for (const ok of ["TASK-A", "0123abcd", "repo", "Dillaab-source__maisog-labs", "é"]) assert.equal(segmentProblem(ok), null);
});

test("canonical forms (POSIX and Windows-profile model) and segment-wise containment", () => {
  const w = { windows: true };
  assert.equal(toCanonical("C:\\ws\\a", w), "C:/ws/a");
  assert.equal(toCanonical("c:/ws/a/", w), "C:/ws/a");
  assert.equal(toCanonical("\\\\server\\share\\a", w), "//server/share/a");
  for (const bad of ["C:ws", "\\ws", "ws\\a", "\\\\?\\C:\\x", "\\\\.\\pipe\\x", "C:\\ws\\..\\x"]) assert.equal(toCanonical(bad, w), null, bad);
  assert.equal(toCanonical("/ws//a/", { windows: false }), "/ws/a");
  assert.equal(toCanonical("ws/a", { windows: false }), null);
  assert.equal(toCanonical("/ws/../a", { windows: false }), null);
  assert.equal(isWithin("/ws/a", "/ws"), true);
  assert.equal(isWithin("/ws/ab", "/ws/a"), false);
  assert.equal(isWithin("/ws", "/ws", { allowEqual: false }), false);
  assert.equal(isWithin("C:/WS/a", "C:/ws", { caseInsensitive: true }), true);
  assert.equal(isWithin("C:/WS/a", "C:/ws"), false);
});

test("creation: exclusive last segment, pre-existing links detected, substitution after creation detected (§9.1)", () => {
  const dir = tmp();
  const outside = tmp();
  try {
    const base = verifiedBase(dir);
    const chain = createDirChain(base, ["p", "t"]);
    assert.equal(chain.length, 3);
    assert.equal(code(() => createDirChain(chain[2], ["x", "x"], { exclusiveLast: true })), "NO_ERROR");
    assert.equal(code(() => createDirChain(chain[2], ["x"], { exclusiveLast: true })), "WORKTREE_COLLISION");
    fs.symlinkSync(outside, path.join(dir, "out"));
    assert.equal(code(() => createDirChain(base, ["out"])), "PATH_ESCAPE");
    fs.symlinkSync(path.join(dir, "nowhere"), path.join(dir, "dangle"));
    assert.equal(code(() => createDirChain(base, ["dangle"])), "UNRESOLVED_LINK");
    fs.mkdirSync(path.join(dir, "real"));
    fs.symlinkSync(path.join(dir, "real"), path.join(dir, "inlink"));
    assert.equal(code(() => createDirChain(base, ["inlink"])), "ISOLATION_UNPROVABLE", "an in-root link is still not a real directory");
    // substitution after creation: replace a created dir with a link
    const c2 = createDirChain(base, ["sub"]);
    fs.rmdirSync(path.join(dir, "sub"));
    fs.symlinkSync(outside, path.join(dir, "sub"));
    assert.equal(code(() => verifyChain(c2)), "ISOLATION_UNPROVABLE");
    // dangling symlink at a file target: exclusive create fails
    fs.symlinkSync(path.join(outside, "planted"), path.join(dir, "p", "t", "f"));
    assert.equal(code(() => createFileExclusive(chain[2], "f", "x")), "ISOLATION_UNPROVABLE");
    assert.equal(fs.existsSync(path.join(outside, "planted")), false, "no file was written through the link");
    assert.equal(code(() => createDirChain(base, ["a", ".."])), "PATH_ESCAPE");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("deletion never follows links; a TOCTOU directory swap aborts; the outside sentinel survives (§9 rule 5)", () => {
  const dir = tmp();
  const outside = tmp();
  fs.writeFileSync(path.join(outside, "SENTINEL"), "keep");
  try {
    const target = path.join(dir, "inst");
    fs.mkdirSync(path.join(target, "tmp"), { recursive: true });
    fs.symlinkSync(outside, path.join(target, "tmp", "abs-link"));
    fs.symlinkSync("../../..", path.join(target, "tmp", "rel-up"));
    fs.symlinkSync(path.join(target, "tmp", "loop"), path.join(target, "tmp", "loop"));
    fs.symlinkSync(path.join(dir, "none"), path.join(target, "tmp", "dangling"));
    const r = removeTreeNoFollow(target);
    assert.equal(r.ok, true);
    assert.equal(fs.readFileSync(path.join(outside, "SENTINEL"), "utf8"), "keep");
    // TOCTOU: after the walk records a directory, it is swapped for a link.
    const t2 = path.join(dir, "inst2");
    fs.mkdirSync(path.join(t2, "d"), { recursive: true });
    fs.writeFileSync(path.join(t2, "d", "f"), "x");
    const swapping = {
      ...fs,
      lstatSync: (p, ...a) => fs.lstatSync(p, ...a),
      readdirSync: (p, ...a) => {
        const out = fs.readdirSync(p, ...a);
        if (p === path.join(t2, "d")) {
          fs.rmSync(path.join(t2, "d"), { recursive: true });
          fs.symlinkSync(outside, path.join(t2, "d"));
          return ["SENTINEL"];
        }
        return out;
      },
    };
    assert.throws(() => removeTreeNoFollow(t2, { fsImpl: swapping }), (e) => e.code === "CLEANUP_CONTAMINATION_RISK");
    assert.equal(fs.readFileSync(path.join(outside, "SENTINEL"), "utf8"), "keep", "the swap target was never deleted");
    // injected unlink failure leaves residue and reports it
    const t3 = path.join(dir, "inst3");
    fs.mkdirSync(t3);
    fs.writeFileSync(path.join(t3, "f"), "x");
    const failing = { ...fs, unlinkSync: () => { throw Object.assign(new Error("EBUSY"), { code: "EBUSY" }); } };
    const r3 = removeTreeNoFollow(t3, { fsImpl: failing });
    assert.equal(r3.ok, false);
    assert.ok(r3.residue.length >= 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------- journal
test("journal: genesis, chain replay, middle-entry tamper detected (§7.1.2)", () => {
  const dir = tmp();
  try {
    const j = new Journal(path.join(dir, "j.jsonl"), H64, () => 0);
    j.append("A", { n: 1 });
    j.append("B", { n: 2 });
    j.append("C", { n: 3 });
    assert.equal(j.replay().entries.length, 3);
    assert.equal(j.replay().entries[0].entry.prev_head, genesisHead(H64));
    const lines = j.lines();
    lines[1] = lines[1].replace('"n":2', '"n":9');
    assert.equal(code(() => replayJournal(lines, H64)), "ISOLATION_UNPROVABLE");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------- RTR / payload
function builtRecord(dir, { interleave = false } = {}) {
  const j = new Journal(path.join(dir, "j.jsonl"), H64, () => 0);
  for (const t of ["CREATE", "QUIESCE", "PUSH_VERIFIED"]) j.append(t);
  const transferId = transferIdOf(H64, H40, 5);
  const prepub = j.head();
  if (interleave) j.append("INTERLEAVED");
  const payload = buildPublicationPayload({ transferId, resultCommitSha: H40, resultTreeSha: "d".repeat(40), baseSha: "e".repeat(40), identityDigest: H64, prepublicationProvenanceDigest: prepub, remoteRef: `refs/heads/sentinel/s6/TASK-A/builder/${ID}` });
  const body = buildRtrBody({ transferId, taskId: "TASK-A", builderIdentityDigest: H64, owner: "builder-1", preRevision: 5, payload });
  j.append("RTR_PENDING", { transfer_id: transferId, rtr_digest: sha256(body) });
  return { j, transferId, body, payload, prepub };
}

test("publication payload: nine members in fixed order, ACTOR_REPORTED, byte round-trip (§7.1.1)", () => {
  const dir = tmp();
  try {
    const { body, payload, prepub } = builtRecord(dir);
    assert.deepEqual(Object.keys(payload), [...PAYLOAD_MEMBERS]);
    assert.equal(payload.evidenceClass, "ACTOR_REPORTED");
    const { evidenceRef } = storedEvidenceRef(body);
    assert.equal(JSON.stringify(evidenceRef), JSON.parse(body).publication_evidence_ref_json);
    assert.equal(evidenceRef.prepublication_provenance_digest, prepub);
    const tampered = JSON.parse(body);
    tampered.publication_evidence_ref_json = tampered.publication_evidence_ref_json.replace("ACTOR_REPORTED", "INDEPENDENTLY_REPRODUCED");
    assert.equal(code(() => storedEvidenceRef(JSON.stringify(tampered))), "RESULT_TRANSFER_UNPROVEN");
    const reordered = JSON.parse(body);
    const obj = JSON.parse(reordered.publication_evidence_ref_json);
    reordered.publication_evidence_ref_json = JSON.stringify(Object.fromEntries(Object.entries(obj).reverse()));
    reordered.publication_evidence_ref_digest = sha256(reordered.publication_evidence_ref_json);
    assert.equal(code(() => storedEvidenceRef(JSON.stringify(reordered))), "RESULT_TRANSFER_UNPROVEN");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("non-circular construction: prepublication digest is the head before RTR_PENDING; adjacency holds; interleaving fails (§7.1.2)", () => {
  const dir = tmp();
  try {
    const { j, transferId, body, prepub } = builtRecord(dir);
    const { entries } = j.replay();
    assert.ok(!body.includes(entries[entries.length - 1].head), "the payload contains no later head");
    assert.equal(verifyAdjacency(entries, transferId, body).evidenceRef.prepublication_provenance_digest, prepub);
    const mutated = body.replace('"owner":"builder-1"', '"owner":"builder-2"');
    assert.equal(code(() => verifyAdjacency(entries, transferId, mutated)), "RESULT_TRANSFER_UNPROVEN");
    const dir2 = tmp();
    try {
      const bad = builtRecord(dir2, { interleave: true });
      assert.equal(code(() => verifyAdjacency(bad.j.replay().entries, bad.transferId, bad.body)), "RESULT_TRANSFER_UNPROVEN");
    } finally {
      fs.rmSync(dir2, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------- environment / secrets
test("instance environment is built from empty; deny set, case duplicates and PATH rules fail closed (§10)", () => {
  process.env.S6_CANARY_TOKEN = "s6-fake-canary";
  try {
    const p = instancePaths("/ws/inst");
    const env = buildInstanceEnvironment({ paths: p, toolchainPath: ["/usr/bin", "/bin"], windows: false });
    assert.equal(env.S6_CANARY_TOKEN, undefined);
    assert.equal(env.HOME, "/ws/inst/home");
    assert.equal(env.GIT_CONFIG_NOSYSTEM, "1");
    assert.deepEqual(environmentFailures(env, { windows: false, instanceRoot: "/ws/inst", toolchainPath: ["/usr/bin", "/bin"] }), []);
    for (const extra of [{ GITHUB_TOKEN: "x" }, { SSH_AUTH_SOCK: "x" }, { NODE_OPTIONS: "x" }, { LD_PRELOAD: "x" }, { https_proxy: "http://u:p@h" }]) {
      assert.deepEqual(environmentFailures({ ...env, ...extra }, { windows: false }), ["ENV_POLICY_VIOLATION"], JSON.stringify(extra));
    }
    assert.deepEqual(environmentFailures({ ...env, PATH: "/usr/bin::." }, { windows: false }), ["ENV_POLICY_VIOLATION"]);
    assert.deepEqual(environmentFailures({ ...env, PATH: "/ws/inst/home/bin:/usr/bin" }, { windows: false, instanceRoot: "/ws/inst" }), ["ENV_POLICY_VIOLATION"]);
    assert.deepEqual(environmentFailures({ Path: "C:\\bin", PATH: "C:\\bin" }, { windows: true }), ["ENV_POLICY_VIOLATION"], "case-duplicate names on Windows");
  } finally {
    delete process.env.S6_CANARY_TOKEN;
  }
});

test("local git config allowlist and credential-free remote; credential file names detected (§6, §12)", () => {
  assert.deepEqual(localConfigFailures(["core.bare=false", "remote.origin.url=/r.git"], { expectedRemoteUrl: "/r.git" }), []);
  for (const k of ["core.fsmonitor=x", "core.sshcommand=x", "credential.helper=store", "include.path=x", "url.x.insteadof=y", "filter.lfs.clean=x", "core.hookspath=/tmp"]) {
    assert.deepEqual(localConfigFailures([k], { expectedRemoteUrl: "/r.git" }), ["ENV_POLICY_VIOLATION"], k);
  }
  assert.deepEqual(localConfigFailures(["remote.origin.url=https://u:t@h/r"], { expectedRemoteUrl: "https://u:t@h/r" }), ["REPOSITORY_MISMATCH"]);
  const dir = tmp();
  try {
    fs.mkdirSync(path.join(dir, "home"));
    fs.writeFileSync(path.join(dir, "home", ".git-credentials"), "x");
    fs.writeFileSync(path.join(dir, "home", "id_ed25519"), "x");
    fs.writeFileSync(path.join(dir, ".env.local"), "x");
    fs.writeFileSync(path.join(dir, ".npmrc"), "//r/:_authToken=${X}\n");
    fs.writeFileSync(path.join(dir, "ok.txt"), "x");
    assert.deepEqual(scanCredentialFiles(dir).sort(), [".env.local", ".npmrc", "home/.git-credentials", "home/id_ed25519"]);
    assert.deepEqual(scanCredentialFiles(dir, { tracked: new Set([".env.local"]) }).includes(".env.local"), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------- transport policy
test("transport: only local remotes (D-071); only the own task branch; no force/delete/tag (§8.1)", () => {
  assert.equal(remoteProblem("/tmp/r.git"), null);
  for (const r of ["https://github.com/a/b", "ssh://git@h/a", "git@github.com:a/b.git", "host:path", "relative/r.git", ""]) assert.ok(remoteProblem(r), r);
  const tb = `sentinel/s6/TASK-A/builder/${ID}`;
  assert.equal(pushRefProblem({ ref: `refs/heads/${tb}`, taskBranch: tb, newSha: H40 }), null);
  assert.ok(pushRefProblem({ ref: "refs/heads/main", taskBranch: tb, newSha: H40 }));
  assert.ok(pushRefProblem({ ref: `refs/heads/sentinel/s6/TASK-A/builder/${"d".repeat(32)}`, taskBranch: tb, newSha: H40 }));
  assert.ok(pushRefProblem({ ref: `refs/heads/${tb}`, taskBranch: tb, newSha: H40, force: true }));
  assert.ok(pushRefProblem({ ref: `refs/heads/${tb}`, taskBranch: tb, newSha: null }));
  assert.ok(pushRefProblem({ ref: "refs/tags/v1", taskBranch: tb, newSha: H40 }));
});

// ------------------------------------------------------------- platform
test("platform profiles: unsupported OS, missing liveness proof (Windows V1), old Git fail closed (§16)", () => {
  const ok = { os: "linux", git_version: "2.43.0", case_sensitive: true, liveness_proof: "proc" };
  assert.deepEqual(profileFailures(ok), []);
  assert.deepEqual(profileFailures({ ...ok, os: "aix" }), ["ISOLATION_PLATFORM_UNSUPPORTED"]);
  assert.deepEqual(profileFailures({ ...ok, os: "win32", liveness_proof: "none" }), ["ISOLATION_CAPABILITY_MISSING"]);
  assert.deepEqual(profileFailures({ ...ok, git_version: "2.30.1" }), ["ISOLATION_CAPABILITY_MISSING"]);
  assert.deepEqual(profileFailures({ ...ok, case_sensitive: null }), ["ISOLATION_CAPABILITY_MISSING"]);
});

test("liveness proof is read-only and fails closed when absence cannot be proven", async () => {
  assert.equal((await proveGroupsEmpty([4242], { inspector: { groupAlive: () => false } })).proven, true);
  const r = await proveGroupsEmpty([4242], { inspector: { groupAlive: () => true }, deadlineMs: 100 });
  assert.equal(r.proven, false);
  assert.deepEqual(r.survivors, [4242]);
});

// ------------------------------------------------------------- permit contracts (pure)
const shellIntent = { project: "P/q", provider: "shell", action: "shell.exec", resource: "/ws/x/repo", environment: "local", policy_version: "v1" };
const allow = (over = {}) => ({
  decision: { outcome: "ALLOW", denial_reason: null, descriptor_id: "D1", policy_version: "v1", non_authority_disclaimer: "d", ...(over.decision ?? {}) },
  presented: {
    request_intent: { ...shellIntent, ...(over.intent ?? {}) },
    subject_context: { actor_role: "Builder", actor_id: "builder-1", credential_class: null, credential_available: false, attestation_ref: "t", ...(over.subject ?? {}) },
    evaluation_context: { time: "2026-09-24T12:00:00Z" },
  },
  consequence_tier: "low",
});

test("issuance verification binds the canonical S5 intent and the owner/role subject (AS90-F003, AS92-F001)", () => {
  const identity = buildExecutionIdentity(identityFields());
  const ok = verifyIssuanceResult(allow(), { expectedIntent: shellIntent, identity });
  assert.deepEqual(ok.s5_subject_binding, { actor_id: "builder-1", actor_role: "Builder" });
  assert.deepEqual(ok.s5_request_intent, shellIntent);
  const denied = (over) => code(() => verifyIssuanceResult(allow(over), { expectedIntent: shellIntent, identity }));
  assert.equal(denied({ decision: { outcome: "DENY", denial_reason: "REVOKED" } }), "CAPABILITY_DENIED");
  for (const intent of [{ action: "shell.other" }, { resource: "/ws/other/repo" }, { policy_version: "v2" }, { environment: "ci" }, { project: "X/y" }]) {
    assert.equal(denied({ intent }), "CAPABILITY_DENIED", JSON.stringify(intent));
  }
  assert.equal(denied({ subject: { actor_id: "someone-else" } }), "CAPABILITY_DENIED", "wrong actor_id");
  assert.equal(denied({ subject: { actor_role: "QA" } }), "CAPABILITY_DENIED", "wrong actor_role");
  assert.equal(denied({ decision: { policy_version: "v0" } }), "CAPABILITY_DENIED", "decision/intent version mismatch");
});

test("claim verification compares the fresh subject directly to identity AND stored binding (AS91-F001, AS92-F001)", () => {
  const identity = buildExecutionIdentity(identityFields());
  const s5 = verifyIssuanceResult(allow(), { expectedIntent: shellIntent, identity });
  const permit = JSON.parse(buildPermitBody({ permitId: ID, instanceId: ID, requestId: "r", identityDigest: H64, checkpointRevision: 5, argvDigest: H64, cwd: "/ws/x/repo", environmentDigest: H64, s5, issuedAt: "t", claimDeadline: "t" }));
  assert.equal(verifyClaimResult(allow(), { permit, identity }).outcome, "ALLOW");
  const denied = (over) => code(() => verifyClaimResult(allow(over), { permit, identity }));
  assert.equal(denied({ subject: { actor_id: "drift" } }), "CAPABILITY_DENIED");
  assert.equal(denied({ subject: { actor_role: "QA" } }), "CAPABILITY_DENIED");
  assert.equal(denied({ decision: { descriptor_id: "D2" } }), "CAPABILITY_DENIED");
  assert.equal(denied({ decision: { outcome: "DENY", denial_reason: "EXPIRED" } }), "CAPABILITY_DENIED");
  assert.equal(denied({ intent: { resource: "/ws/y/repo" } }), "CAPABILITY_DENIED");
  const drifted = { ...permit, s5_subject_binding: { actor_id: "builder-1", actor_role: "QA" } };
  assert.equal(code(() => verifyClaimResult(allow(), { permit: drifted, identity })), "CAPABILITY_DENIED", "stored binding is checked too");
});

test("request/report contracts are closed; argv is bound by digest only", () => {
  assert.equal(argvDigest(["a", "b"]), sha256('["a","b"]'));
  const req = { instance_id: ID, request_id: "r-1", argv: ["x"], checkpoint_revision: 5 };
  assert.equal(code(() => validateRequest(req)), "NO_ERROR");
  for (const bad of [{ argv: [] }, { argv: "x" }, { argv: ["a\u0000"] }, { request_id: "has space" }, { checkpoint_revision: 0 }, { s5_decision: { outcome: "ALLOW" } }, { env: {} }]) {
    assert.equal(code(() => validateRequest({ ...req, ...bad })), "MALFORMED_REQUEST", JSON.stringify(bad));
  }
  const rep = { permit_id: ID, instance_id: ID, argv_digest: H64, environment_digest: H64, process_groups: [], terminated: true };
  assert.equal(code(() => validateReport(rep)), "NO_ERROR");
  assert.equal(code(() => validateReport({ ...rep, process_groups: [1] })), "ISOLATION_UNPROVABLE");
  assert.equal(code(() => validateReport({ ...rep, extra: 1 })), "ISOLATION_UNPROVABLE");
});

// ------------------------------------------------------------- schemas agree with builders
test("schemas list exactly the fields the builders emit", () => {
  const schema = (n) => JSON.parse(fs.readFileSync(path.join(EXEC, n), "utf8"));
  assert.deepEqual(schema("execution-identity.schema.json").required, [...IDENTITY_FIELDS]);
  assert.deepEqual(schema("publication-evidence-ref.schema.json").required, [...PAYLOAD_MEMBERS]);
  const identity = buildExecutionIdentity(identityFields());
  const s5 = verifyIssuanceResult(allow(), { expectedIntent: shellIntent, identity });
  const body = JSON.parse(buildPermitBody({ permitId: ID, instanceId: ID, requestId: "r", identityDigest: H64, checkpointRevision: 5, argvDigest: H64, cwd: "/c", environmentDigest: H64, s5, issuedAt: "t", claimDeadline: "t" }));
  assert.deepEqual(Object.keys(body), schema("execution-permit.schema.json").required);
  assert.deepEqual(schema("execution-request.schema.json").required, ["instance_id", "request_id", "argv", "checkpoint_revision"]);
});
