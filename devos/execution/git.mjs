// S6 internal fixed Git operations (ML-DEVOS-RFC-019 §6, §8.1; AS94-F003).
//
// This is the ONLY module in S6 core that starts a child process, and it is
// not part of the public surface (index.mjs does not export it). It exports a
// CLOSED set of named Git operations. Each takes structured, validated
// parameters (exact SHAs, validated ref/branch names, absolute paths) and
// builds its literal subcommand/option argv internally. The process-starting
// runner is module-private and nothing here accepts an argv array or a
// command string. The binary is fixed to `git` and there is no shell. Whether
// even these fixed calls suit a given runtime's safety controls is RFC-019
// Unresolved question 8.
import { execFileSync } from "node:child_process";
import path from "node:path";

import { fail } from "./vocabulary.mjs";

const GIT_BINARY = "git";
const SHA = /^[0-9a-f]{40}$/;
const BRANCH_REF = /^refs\/heads\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const TASK_BRANCH = /^sentinel\/s6\/[A-Z][A-Z0-9_-]*\/(builder|qa)\/[0-9a-f]{32}$/;

export class GitError extends Error {
  constructor(op, err) {
    super(`git ${op} failed: ${String(err?.stderr ?? err?.message ?? err).trim().split("\n")[0]}`);
    this.name = "GitError";
    this.status = err?.status ?? null;
  }
}

function sha(v, name) {
  if (typeof v !== "string" || !SHA.test(v)) fail("MALFORMED_REQUEST", `${name} must be an exact 40-hex commit`);
  return v;
}

function branchRef(v) {
  if (typeof v !== "string" || !BRANCH_REF.test(v) || v.includes("..") || v.endsWith("/") || v.endsWith(".lock")) fail("MALFORMED_REQUEST", "ref must be a plain refs/heads/ name");
  return v;
}

function absPath(v, name) {
  if (typeof v !== "string" || v.length === 0 || v.includes("\u0000") || !path.isAbsolute(v) || v.startsWith("-")) fail("MALFORMED_REQUEST", `${name} must be an absolute path`);
  return v;
}

// Module-private: never exported, only called below with literal argv heads.
function run(op, argv, { cwd, env }) {
  try {
    return execFileSync(GIT_BINARY, argv, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true }).replace(/\n$/, "");
  } catch (err) {
    throw new GitError(op, err);
  }
}

function succeeds(op, argv, opts) {
  try {
    run(op, argv, opts);
    return true;
  } catch (err) {
    if (err instanceof GitError) return false;
    throw err;
  }
}

const lines0 = (out) => out.split("\0").filter(Boolean);

// ---------------------------------------------------------------- read-only
export function gitVersion(env) {
  try {
    return run("version", ["--version"], { env });
  } catch {
    return null;
  }
}

// Returns the full ls-remote output for one exact ref, or null on failure.
export function lsRemoteRef(remote, ref, env) {
  absPath(remote, "remote");
  branchRef(ref);
  try {
    return run("ls-remote", ["ls-remote", "--refs", "--", remote, ref], { env });
  } catch (err) {
    if (err instanceof GitError) return null;
    throw err;
  }
}

export function headSha(repo, env) {
  absPath(repo, "repo");
  try {
    return run("rev-parse", ["rev-parse", "--verify", "--quiet", "HEAD^{commit}"], { cwd: repo, env });
  } catch (err) {
    if (err instanceof GitError) return null;
    throw err;
  }
}

export function treeOf(repo, commit, env) {
  absPath(repo, "repo");
  return run("rev-parse", ["rev-parse", "--verify", `${sha(commit, "commit")}^{tree}`], { cwd: repo, env });
}

export function hasCommit(repo, commit, env) {
  absPath(repo, "repo");
  return succeeds("cat-file", ["cat-file", "-e", `${sha(commit, "commit")}^{commit}`], { cwd: repo, env });
}

// `descendant` is an exact commit, or the literal "HEAD" of this repository.
export function isAncestor(repo, ancestor, descendant, env) {
  absPath(repo, "repo");
  const d = descendant === "HEAD" ? "HEAD" : sha(descendant, "descendant");
  return succeeds("merge-base", ["merge-base", "--is-ancestor", sha(ancestor, "ancestor"), d], { cwd: repo, env });
}

export function currentBranch(repo, env) {
  absPath(repo, "repo");
  return run("symbolic-ref", ["symbolic-ref", "--short", "HEAD"], { cwd: repo, env });
}

export function trackedFiles(repo, env) {
  absPath(repo, "repo");
  return lines0(run("ls-files", ["ls-files", "-z"], { cwd: repo, env }));
}

// The repository-local config file only (never global/system).
export function localConfigLines(repo, env) {
  absPath(repo, "repo");
  return run("config", ["config", "--file", path.join(repo, ".git", "config"), "--list"], { env }).split("\n").filter(Boolean);
}

export function statusEntries(repo, env) {
  absPath(repo, "repo");
  return lines0(run("status", ["status", "--porcelain=v2", "--untracked-files=all", "--ignored=matching", "-z"], { cwd: repo, env }));
}

export function changedFiles(repo, base, head, env) {
  absPath(repo, "repo");
  return lines0(run("diff", ["diff", "--name-only", "--no-renames", "-z", `${sha(base, "base")}..${sha(head, "head")}`], { cwd: repo, env }));
}

// ---------------------------------------------------------------- instance-local writes
export function cloneNoCheckout(remote, target, env) {
  return succeeds("clone", ["clone", "--quiet", "--no-local", "--no-hardlinks", "--no-checkout", "--", absPath(remote, "remote"), absPath(target, "target")], { env });
}

export function fetchCommit(repo, commit, env) {
  absPath(repo, "repo");
  return succeeds("fetch", ["fetch", "--quiet", "--no-tags", "origin", sha(commit, "commit")], { cwd: repo, env });
}

export function checkoutDetached(repo, commit, env) {
  absPath(repo, "repo");
  return succeeds("checkout", ["checkout", "--quiet", "--detach", sha(commit, "commit")], { cwd: repo, env });
}

export function createTaskBranch(repo, branch, env) {
  absPath(repo, "repo");
  if (typeof branch !== "string" || !TASK_BRANCH.test(branch)) fail("MALFORMED_REQUEST", "branch must be an S6 task branch name");
  return succeeds("switch", ["switch", "--quiet", "-c", branch], { cwd: repo, env });
}

// Non-force push of an exact commit to one plain branch ref, with an explicit
// lease (absent when expectedOld is null). No force, delete or tag form exists.
export function pushWithLease(repo, ref, newSha, expectedOld, env) {
  absPath(repo, "repo");
  branchRef(ref);
  sha(newSha, "newSha");
  if (expectedOld !== null) sha(expectedOld, "expectedOld");
  return succeeds("push", ["push", "--porcelain", "--no-verify", `--force-with-lease=${ref}:${expectedOld ?? ""}`, "origin", `${newSha}:${ref}`], { cwd: repo, env });
}
