// S6 internal fixed-binary Git runner (ML-DEVOS-RFC-019 §6, §8.1).
//
// This is the ONLY module in S6 core that starts a child process. It is an
// internal mechanism, not part of the public surface (index.mjs does not export
// it): the binary is fixed to `git`, there is no shell, and every call site in
// S6 core builds its argv from literal Git subcommands plus S6-validated values
// (SHAs, validated ref names, canonical paths). No caller-supplied command or
// argv reaches it. Whether even these fixed calls are acceptable under a given
// runtime's safety controls is RFC-019 Unresolved question 8.
import { execFileSync } from "node:child_process";

const GIT_BINARY = "git";

export class GitError extends Error {
  constructor(args, err) {
    super(`git ${args[0]} failed: ${String(err.stderr ?? err.message).trim().split("\n")[0]}`);
    this.name = "GitError";
    this.status = err.status ?? null;
  }
}

export function git(args, { cwd, env } = {}) {
  try {
    return execFileSync(GIT_BINARY, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true }).replace(/\n$/, "");
  } catch (err) {
    throw new GitError(args, err);
  }
}

export function tryGit(args, opts) {
  try {
    return git(args, opts);
  } catch (err) {
    if (err instanceof GitError) return null;
    throw err;
  }
}

export function statusEntries(repo, env) {
  return git(["status", "--porcelain=v2", "--untracked-files=all", "--ignored=matching", "-z"], { cwd: repo, env }).split("\0").filter(Boolean);
}
