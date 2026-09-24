// S5 V1 `shell` adapter (ML-DEVOS-RFC-017 §9). Canonical resource: an
// absolute POSIX path with "."/".." and symlink components resolved by the
// adapter, confined to the host's expected roots.
//
// Resolution walks the path segment by segment with OS semantics: each
// existing component is passed through fs.realpathSync, so "link/.." means
// "the parent of the link's target", exactly as the kernel resolves it -- not
// a lexical collapse. A component that exists but cannot be resolved (a
// dangling symlink) rejects the whole path; a not-yet-existing tail is kept
// as literal segments. The result must lie inside an expected root.
// Anything unresolvable -> MALFORMED_REQUEST, never partially normalized.
// The adapter only resolves paths; it never executes anything.

import fs from "node:fs";
import path from "node:path";
import { canonicalize } from "../canonical.mjs";
import { makeAdapter } from "./common.mjs";

function resolveWithOsSemantics(absolute) {
  let current = "/";
  for (const seg of absolute.split("/").filter(Boolean)) {
    if (seg === ".") continue;
    if (seg === "..") {
      current = path.posix.dirname(current);
      continue;
    }
    const next = path.posix.join(current, seg);
    let exists = true;
    try {
      fs.lstatSync(next);
    } catch {
      exists = false;
    }
    if (!exists) {
      current = next;
      continue;
    }
    try {
      current = fs.realpathSync(next);
    } catch {
      return null; // exists but unresolvable, e.g. a dangling symlink
    }
  }
  return current;
}

export function createShellAdapter({ minter, host, policies }) {
  const roots = (host.shellRoots ?? []).map((r) => fs.realpathSync(r));
  return makeAdapter({
    provider: "shell",
    minter,
    host,
    policies,
    canonicalizeResource(raw) {
      const syntactic = canonicalize("shell", raw); // absolute, "/" separators, no control chars
      if (!syntactic.ok) return syntactic;
      const real = resolveWithOsSemantics(raw.replaceAll("\\", "/"));
      if (real === null) return { ok: false, reason: "path cannot be resolved to an absolute, traversal-free form" };
      if (!roots.some((root) => real === root || real.startsWith(`${root}/`))) {
        return { ok: false, reason: "path escapes every expected root" };
      }
      const final = canonicalize("shell", real);
      return final.ok && final.value === real ? final : { ok: false, reason: "resolved path is not canonical" };
    },
  });
}
