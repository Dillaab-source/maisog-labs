// S5 V1 `shell` adapter (ML-DEVOS-RFC-017 §9; platform-aware per
// ML-DEVOS-AS-082 AS82-F002). Canonical resource: an absolute path with
// "."/".." and symlink components resolved under the HOST OS's own path
// semantics, confined to the host's expected roots, and emitted with "/"
// separators (canonical.mjs `shell` contract: /posix, C:/drive, //unc/share).
//
// Resolution walks the native path segment by segment: each existing
// component is passed through realpath, so "link/.." means "the parent of the
// link's target", exactly as the OS resolves it -- not a lexical collapse. A
// component that exists but cannot be resolved (a dangling symlink) rejects
// the whole path; a not-yet-existing tail is kept as literal segments
// (nothing below a missing component can be a symlink). The result must lie
// inside an expected root. Anything unresolvable -> MALFORMED_REQUEST, never
// partially normalized. The adapter only resolves paths; it never executes.
//
// resolveShellPath()/toCanonicalShellPath() take the path implementation and
// filesystem as parameters so the same algorithm can be exercised under
// Windows semantics on a non-Windows host; the adapter itself always uses the
// host's native `path` and real `fs`.

import fs from "node:fs";
import path from "node:path";
import { canonicalize } from "../canonical.mjs";
import { makeAdapter } from "./common.mjs";

const WIN_ROOT = /^(?:[A-Za-z]:\\|\\\\[^\\]+\\[^\\]+\\?)$/; // C:\  or  \\server\share\

// Native absolute path -> canonical "/" form, or null.
export function toCanonicalShellPath(nativePath, pathImpl = path) {
  if (typeof nativePath !== "string") return null;
  const slashed = pathImpl.sep === "\\" ? nativePath.replaceAll("\\", "/") : nativePath;
  const r = canonicalize("shell", slashed);
  return r.ok ? r.value : null;
}

// Resolve `raw` under the host OS semantics of `pathImpl`, using `fsImpl`'s
// lstatSync/realpathSync. Returns the resolved NATIVE path, or null.
export function resolveShellPath(raw, { pathImpl = path, fsImpl = fs } = {}) {
  if (typeof raw !== "string" || raw.length === 0 || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  const windows = pathImpl.sep === "\\";
  // Accept either separator on Windows; on POSIX "\" is an ordinary filename
  // character and is left alone (and later rejected by the canonical check).
  const native = windows ? raw.replaceAll("/", "\\") : raw;
  if (!pathImpl.isAbsolute(native)) return null;
  const { root } = pathImpl.parse(native);
  if (windows && !WIN_ROOT.test(root)) return null; // "\repo" (no drive) or drive-relative
  let current;
  try {
    current = fsImpl.realpathSync(root);
  } catch {
    return null;
  }
  for (const seg of native.slice(root.length).split(pathImpl.sep).filter(Boolean)) {
    if (seg === ".") continue;
    if (seg === "..") {
      current = pathImpl.dirname(current);
      continue;
    }
    const next = pathImpl.join(current, seg);
    let exists = true;
    try {
      fsImpl.lstatSync(next);
    } catch {
      exists = false;
    }
    if (!exists) {
      current = next;
      continue;
    }
    try {
      current = fsImpl.realpathSync(next);
    } catch {
      return null; // exists but unresolvable, e.g. a dangling symlink
    }
  }
  return current;
}

export function isWithinRoot(canonicalPath, canonicalRoot) {
  const prefix = canonicalRoot.endsWith("/") ? canonicalRoot : `${canonicalRoot}/`;
  return canonicalPath === canonicalRoot || canonicalPath.startsWith(prefix);
}

// Full contract: resolve natively, canonicalize to "/" form, confine to roots.
export function canonicalizeShellResource(raw, roots, { pathImpl = path, fsImpl = fs } = {}) {
  const real = resolveShellPath(raw, { pathImpl, fsImpl });
  if (real === null) return { ok: false, reason: "path cannot be resolved to an absolute, traversal-free form" };
  const canonical = toCanonicalShellPath(real, pathImpl);
  if (canonical === null) return { ok: false, reason: "resolved path is not canonical" };
  if (!roots.some((root) => isWithinRoot(canonical, root))) return { ok: false, reason: "path escapes every expected root" };
  return { ok: true, value: canonical };
}

// Host roots are resolved and canonicalized once, at gateway construction.
export function canonicalRoots(shellRoots, { pathImpl = path, fsImpl = fs } = {}) {
  return (shellRoots ?? []).map((r) => {
    const canonical = toCanonicalShellPath(fsImpl.realpathSync(r), pathImpl);
    if (canonical === null) throw new Error(`shell root ${r} is not an absolute canonical path`);
    return canonical;
  });
}

export function createShellAdapter({ minter, host, policies }) {
  const roots = canonicalRoots(host.shellRoots);
  return makeAdapter({
    provider: "shell",
    minter,
    host,
    policies,
    canonicalizeResource: (raw) => canonicalizeShellResource(raw, roots),
  });
}
