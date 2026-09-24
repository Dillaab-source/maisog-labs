// S6 execution transport (ML-DEVOS-RFC-019 §8.1 -- AS86-F004; D-071).
//
// Host-side Git fetch/push of the instance's own task branch. Every call needs
//   MAY -- a recorded transport_authorization_ref, and
//   CAN -- an S5 `github` CapabilityDecision of ALLOW for that exact call.
// Neither implies the other.
//
// D-071 boundary: no standing real GitHub transport authority exists for S6.
// This implementation accepts only a LOCAL repository path as its remote (for
// example a temporary bare repository). Any network or scp-style remote fails
// closed as TRANSPORT_NOT_AUTHORIZED until a separate Paulo decision exists.
import path from "node:path";

import { tryGit } from "./git.mjs";
import { HEX40, fail } from "./vocabulary.mjs";

const OPAQUE = /^[A-Za-z0-9._:-]{1,128}$/;

export function remoteProblem(remote) {
  if (typeof remote !== "string" || remote.length === 0) return "no remote configured";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(remote)) return "network/URL remotes are not authorized for S6 (D-071)";
  if (/^[^/\\]+@[^:]+:/.test(remote) || /^[^/\\:]{2,}:/.test(remote)) return "scp-style remotes are not authorized for S6 (D-071)";
  if (!path.isAbsolute(remote)) return "the local remote path must be absolute";
  return null;
}

// Exactly the instance's own task branch; never force, delete or tag.
export function pushRefProblem({ ref, taskBranch, newSha, force = false }) {
  if (force) return "force push is denied";
  if (newSha === null || newSha === undefined || newSha === "") return "ref deletion is denied";
  if (!HEX40.test(newSha)) return "push source must be an exact commit";
  if (typeof ref !== "string" || ref.startsWith("refs/tags/")) return "tags are denied";
  if (ref !== `refs/heads/${taskBranch}`) return `only refs/heads/${taskBranch} may be pushed`;
  return null;
}

export function createTransport({ project, remote, authorizationRef, gateway, policyVersion, environment = "local", onDecision = () => {} }) {
  const slug = String(project).toLowerCase();

  function authorize() {
    if (typeof authorizationRef !== "string" || !OPAQUE.test(authorizationRef)) fail("TRANSPORT_NOT_AUTHORIZED", "no recorded transport_authorization_ref");
    const p = remoteProblem(remote);
    if (p) fail("TRANSPORT_NOT_AUTHORIZED", p);
  }

  // One S5 decision per call, never cached.
  function decide(action, resource) {
    const adapter = gateway?.github;
    if (!adapter || typeof adapter.request !== "function") fail("CAPABILITY_DENIED", "no S5 github adapter is available (no decision)");
    let r;
    try {
      r = adapter.request({ project, provider: "github", action, resource, environment, policy_version: policyVersion });
    } catch (err) {
      fail("CAPABILITY_DENIED", `S5 trusted source unavailable: ${err.message}`);
    }
    const d = r.decision;
    const record = { provider: "github", action, resource, outcome: d.outcome, denial_reason: d.denial_reason, descriptor_id: d.descriptor_id, policy_version: d.policy_version };
    onDecision(record);
    if (d.outcome !== "ALLOW") fail("CAPABILITY_DENIED", `S5 denied ${action} ${resource}: ${d.denial_reason}`);
    return record;
  }

  function lsRemote(ref, env) {
    authorize();
    decide("git.ls_remote", `${slug}:${ref}`);
    const out = tryGit(["ls-remote", "--refs", "--", remote, ref], { env });
    if (out === null) fail("BASE_UNAVAILABLE", `cannot read ${ref} from the remote`);
    const line = out.split("\n").find((l) => l.endsWith(`\t${ref}`));
    return line ? line.split("\t")[0] : null;
  }

  function clone(target, env) {
    authorize();
    decide("git.fetch", slug);
    if (tryGit(["clone", "--quiet", "--no-local", "--no-hardlinks", "--no-checkout", "--", remote, target], { env }) === null) fail("BASE_UNAVAILABLE", "clone from the remote failed");
  }

  function fetchSha(repo, sha, env) {
    authorize();
    if (!HEX40.test(sha ?? "")) fail("MALFORMED_REQUEST", "fetch requires an exact commit");
    decide("git.fetch", slug);
    if (tryGit(["fetch", "--quiet", "--no-tags", "origin", sha], { cwd: repo, env }) === null) fail("BASE_UNAVAILABLE", `commit ${sha} is not fetchable from the remote`);
    if (tryGit(["cat-file", "-e", `${sha}^{commit}`], { cwd: repo, env }) === null) fail("BASE_UNAVAILABLE", `commit ${sha} missing after fetch`);
  }

  // Non-force push with an explicit lease: the remote ref must be absent
  // (expectedOld null) or equal expectedOld, and the new commit must descend
  // from expectedOld -- the lease is used purely as compare-and-swap.
  function push(repo, { ref, taskBranch, newSha, expectedOld = null, force = false }, env) {
    authorize();
    const p = pushRefProblem({ ref, taskBranch, newSha, force });
    if (p) fail("TRANSPORT_NOT_AUTHORIZED", p);
    if (expectedOld !== null) {
      if (!HEX40.test(expectedOld)) fail("MALFORMED_REQUEST", "expected lease value must be an exact commit");
      if (tryGit(["merge-base", "--is-ancestor", expectedOld, newSha], { cwd: repo, env }) === null) fail("TRANSPORT_NOT_AUTHORIZED", "non-fast-forward update would be a force push");
    }
    decide("git.push", `${slug}:${ref}`);
    if (tryGit(["push", "--porcelain", "--no-verify", `--force-with-lease=${ref}:${expectedOld ?? ""}`, "origin", `${newSha}:${ref}`], { cwd: repo, env }) === null) {
      fail("BRANCH_COLLISION", `push lease on ${ref} was rejected`);
    }
    const now = lsRemote(ref, env);
    if (now !== newSha) fail("BRANCH_COLLISION", `remote ${ref} is ${now}, expected ${newSha}`);
    return newSha;
  }

  return Object.freeze({ authorize, lsRemote, clone, fetchSha, push });
}
