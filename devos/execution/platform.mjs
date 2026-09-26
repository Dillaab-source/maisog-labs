// S6 platform profile (ML-DEVOS-RFC-019 §16, §13.1).
//
// S6 core never starts, signals or tears down actor/tool processes; it only
// PROVES that reported process groups are empty, by read-only inspection
// (§13.1 step 6). The profile records which proof is available:
//   linux  -> "proc"     (/proc scan; zombies are not survivors)
//   darwin -> "signal0"  (process.kill(-pgid, 0) probe; sends no signal)
//   win32  -> "none"     (V1 implements no read-only Job Object inspection)
// A profile with no liveness proof fails closed as ISOLATION_CAPABILITY_MISSING.
import fs from "node:fs";
import path from "node:path";

export const MIN_GIT = Object.freeze([2, 40, 0]);
const SUPPORTED_OS = new Set(["linux", "darwin", "win32"]);

export function parseGitVersion(text) {
  const m = /git version (\d+)\.(\d+)(?:\.(\d+))?/.exec(text ?? "");
  return m ? [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)] : null;
}

function versionAtLeast(v, min) {
  for (let i = 0; i < 3; i += 1) if (v[i] !== min[i]) return v[i] > min[i];
  return true;
}

function probeCaseSensitive(dir) {
  const probe = fs.mkdtempSync(path.join(dir, ".s6-case-"));
  try {
    fs.writeFileSync(path.join(probe, "a"), "");
    return !fs.existsSync(path.join(probe, "A"));
  } finally {
    fs.rmSync(probe, { recursive: true, force: true });
  }
}

function probeSymlinks(dir) {
  const probe = fs.mkdtempSync(path.join(dir, ".s6-link-"));
  try {
    fs.symlinkSync("target", path.join(probe, "l"));
    return true;
  } catch {
    return false;
  } finally {
    fs.rmSync(probe, { recursive: true, force: true });
  }
}

export function livenessProofFor(os) {
  if (os === "linux" && fs.existsSync("/proc/self/stat")) return "proc";
  if (os === "linux" || os === "darwin") return "signal0";
  return "none";
}

// `gitVersionText` is the output of the fixed internal `git --version` call
// (git.mjs); `probeDir` must be the canonical workspace root.
export function detectPlatformProfile({ probeDir, gitVersionText }) {
  const os = process.platform;
  const git = parseGitVersion(gitVersionText);
  return Object.freeze({
    os,
    git_version: git ? git.join(".") : null,
    case_sensitive: probeDir ? probeCaseSensitive(probeDir) : null,
    symlinks: probeDir ? probeSymlinks(probeDir) : null,
    liveness_proof: livenessProofFor(os),
  });
}

// §16 / §14: failing codes for a profile (the caller applies precedence).
// `probed: false` means no valid workspace root existed to probe; the
// filesystem-probe fields are then not judged (the root failure is reported
// instead of a misleading capability failure).
export function profileFailures(profile, { probed = true } = {}) {
  if (!profile || !SUPPORTED_OS.has(profile.os)) return ["ISOLATION_PLATFORM_UNSUPPORTED"];
  const codes = [];
  const git = parseGitVersion(`git version ${profile.git_version ?? ""}`);
  if (!git || !versionAtLeast(git, MIN_GIT)) codes.push("ISOLATION_CAPABILITY_MISSING");
  if (profile.liveness_proof !== "proc" && profile.liveness_proof !== "signal0") codes.push("ISOLATION_CAPABILITY_MISSING");
  if (probed && typeof profile.case_sensitive !== "boolean") codes.push("ISOLATION_CAPABILITY_MISSING");
  return codes;
}
