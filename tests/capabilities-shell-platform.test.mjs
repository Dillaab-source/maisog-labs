// S5 V1 shell canonicalization -- platform regression for ML-DEVOS-AS-082
// AS82-F002. The CI host is not Windows, so the Windows behavior is proven by
// running the production resolver (resolveShellPath / canonicalizeShellResource)
// with node:path's win32 implementation over an in-memory filesystem that
// models Windows semantics: case-insensitive lookup, true-case realpath,
// symlinks, dangling links. Real-filesystem POSIX behavior stays covered in
// tests/capabilities-gateway.test.mjs; POSIX pure cases are repeated here.

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { canonicalize, isCanonical } from "../devos/capabilities/canonical.mjs";
import {
  canonicalizeShellResource,
  canonicalRoots,
  resolveShellPath,
  toCanonicalShellPath,
} from "../devos/capabilities/adapters/shell.mjs";
import { validateCapabilityPolicy } from "../devos/capabilities/validate-capability-policy.mjs";

// ----------------------------------------------------------- fake Windows fs

function winFs(entries) {
  const w = path.win32;
  const table = new Map(); // lowercase native path -> { real, type, target }
  for (const [p, spec] of Object.entries(entries)) {
    const real = w.normalize(p);
    table.set(real.toLowerCase(), { real, ...spec });
  }
  const enoent = (p) => Object.assign(new Error(`ENOENT: ${p}`), { code: "ENOENT" });
  // Like Windows, a rooted path without a drive ("\\repo") resolves against
  // the current drive, modeled here as C:.
  const currentDrive = (root) => (root === "\\" ? "C:\\" : root);
  function realpathSync(p, depth = 0) {
    if (depth > 16) throw Object.assign(new Error("ELOOP"), { code: "ELOOP" });
    const root = currentDrive(w.parse(p).root);
    p = root + p.slice(w.parse(p).root.length);
    const rootEntry = table.get(w.normalize(root).toLowerCase());
    if (!rootEntry) throw enoent(p);
    let current = rootEntry.real;
    for (const seg of p.slice(root.length).split("\\").filter(Boolean)) {
      if (seg === ".") continue;
      if (seg === "..") { current = w.dirname(current); continue; }
      const e = table.get(w.join(current, seg).toLowerCase());
      if (!e) throw enoent(p);
      current = e.type === "symlink" ? realpathSync(e.target, depth + 1) : e.real;
    }
    return current;
  }
  return {
    realpathSync,
    lstatSync(p) {
      const e = table.get(w.normalize(p).toLowerCase());
      if (!e) throw enoent(p);
      return { isSymbolicLink: () => e.type === "symlink" };
    },
  };
}

const W = { pathImpl: path.win32 };
const fsW = winFs({
  "C:\\": { type: "dir" },
  "C:\\repo": { type: "dir" },
  "C:\\repo\\src": { type: "dir" },
  "C:\\repo\\src\\a.txt": { type: "file" },
  "C:\\repo\\srclink": { type: "symlink", target: "C:\\repo\\src" },
  "C:\\repo\\escape": { type: "symlink", target: "C:\\outside" },
  "C:\\repo\\dangling": { type: "symlink", target: "C:\\missing-target" },
  "C:\\outside": { type: "dir" },
  "\\\\srv\\share\\": { type: "dir" },
  "\\\\srv\\share\\repo": { type: "dir" },
  "\\\\srv\\share\\repo\\doc.md": { type: "file" },
});
const ROOTS = canonicalRoots(["C:\\repo", "\\\\srv\\share\\repo"], { ...W, fsImpl: fsW });
const shellW = (raw) => canonicalizeShellResource(raw, ROOTS, { ...W, fsImpl: fsW });

// ------------------------------------------------------ pure canonical form

test("canonical shell form: Windows drive and UNC absolute paths normalize to '/' form", () => {
  const c = (raw) => canonicalize("shell", raw);
  assert.deepEqual(c("C:\\repo\\file.txt"), { ok: true, value: "C:/repo/file.txt" });
  assert.deepEqual(c("c:/repo/file.txt"), { ok: true, value: "C:/repo/file.txt" });
  assert.deepEqual(c("C:\\repo\\sub\\..\\.\\file.txt"), { ok: true, value: "C:/repo/file.txt" });
  assert.deepEqual(c("C:\\"), { ok: true, value: "C:/" });
  assert.deepEqual(c("C:\\repo\\"), { ok: true, value: "C:/repo" });
  assert.deepEqual(c("\\\\srv\\share\\a\\b"), { ok: true, value: "//srv/share/a/b" });
  for (const bad of ["C:repo\\x", "\\repo\\x", "repo\\x", "\\\\srv", "relative/p", "C:"]) {
    assert.equal(c(bad).ok, false, bad);
  }
});

test("canonical shell form: POSIX behavior is unchanged", () => {
  const c = (raw) => canonicalize("shell", raw);
  assert.deepEqual(c("/srv/repo/a/../b/./c"), { ok: true, value: "/srv/repo/b/c" });
  assert.deepEqual(c("/"), { ok: true, value: "/" });
  assert.deepEqual(c("/srv/repo/"), { ok: true, value: "/srv/repo" });
  assert.equal(c("srv/repo").ok, false);
  assert.equal(c("/srv/a\\b").ok, false, "on POSIX a backslash is not a separator; fail closed");
  assert.equal(isCanonical("shell", "/srv/repo/a"), true);
  assert.equal(isCanonical("shell", "C:/repo/a"), true);
  assert.equal(isCanonical("shell", "C:\\repo\\a"), false);
});

test("toCanonicalShellPath: native separators converted only on Windows", () => {
  assert.equal(toCanonicalShellPath("C:\\Repo\\A.txt", path.win32), "C:/Repo/A.txt");
  assert.equal(toCanonicalShellPath("d:\\x", path.win32), "D:/x");
  assert.equal(toCanonicalShellPath("\\\\srv\\share\\x", path.win32), "//srv/share/x");
  assert.equal(toCanonicalShellPath("/srv/x", path.posix), "/srv/x");
  assert.equal(toCanonicalShellPath("/srv/a\\b", path.posix), null);
});

// ------------------------------------------- Windows resolution + confinement

test("Windows: absolute drive paths resolve, with either separator and any drive/case, to canonical '/' form", () => {
  assert.deepEqual(shellW("C:\\repo\\src\\a.txt"), { ok: true, value: "C:/repo/src/a.txt" });
  assert.deepEqual(shellW("c:/repo/src/a.txt"), { ok: true, value: "C:/repo/src/a.txt" });
  assert.deepEqual(shellW("C:\\REPO\\SRC\\A.TXT"), { ok: true, value: "C:/repo/src/a.txt" }); // true case from realpath
  assert.deepEqual(shellW("C:\\repo\\src\\.\\..\\src\\a.txt"), { ok: true, value: "C:/repo/src/a.txt" });
});

test("Windows: symlinks and '..' follow OS semantics (link/.. = parent of the link target)", () => {
  assert.deepEqual(shellW("C:\\repo\\srclink\\a.txt"), { ok: true, value: "C:/repo/src/a.txt" });
  assert.deepEqual(shellW("C:\\repo\\srclink\\..\\new.txt"), { ok: true, value: "C:/repo/new.txt" });
});

test("Windows: escaping, dangling, and non-absolute forms fail closed", () => {
  assert.equal(shellW("C:\\repo\\escape\\secret.txt").ok, false); // symlink out of root
  assert.equal(shellW("C:\\repo\\..\\outside\\x").ok, false); // traversal out of root
  assert.equal(shellW("C:\\outside\\x").ok, false); // absolute but outside every root
  assert.equal(shellW("C:\\repo\\dangling\\x").ok, false); // dangling symlink
  assert.equal(shellW("D:\\repo\\x").ok, false); // drive does not exist
  for (const bad of ["\\repo\\src\\a.txt", "C:repo\\src", "repo\\src", "", "C:\\repo\\a\u0000b"]) {
    assert.equal(shellW(bad).ok, false, JSON.stringify(bad));
  }
});

test("Windows: not-yet-existing tails are kept literally inside the root", () => {
  assert.deepEqual(shellW("C:\\repo\\new\\deeper\\file.txt"), { ok: true, value: "C:/repo/new/deeper/file.txt" });
  assert.deepEqual(shellW("C:\\repo\\new\\..\\src\\a.txt"), { ok: true, value: "C:/repo/src/a.txt" });
  assert.equal(shellW("C:\\repo\\new\\..\\..\\outside\\x").ok, false);
});

test("Windows: UNC roots are confined the same way", () => {
  assert.deepEqual(shellW("\\\\srv\\share\\repo\\doc.md"), { ok: true, value: "//srv/share/repo/doc.md" });
  assert.equal(shellW("\\\\srv\\share\\other\\doc.md").ok, false);
});

test("root confinement is segment-aware: C:/repo does not contain C:/repository", () => {
  const fs2 = winFs({ "C:\\": { type: "dir" }, "C:\\repo": { type: "dir" }, "C:\\repository": { type: "dir" } });
  const roots = canonicalRoots(["C:\\repo"], { ...W, fsImpl: fs2 });
  assert.equal(canonicalizeShellResource("C:\\repository\\x", roots, { ...W, fsImpl: fs2 }).ok, false);
  const driveRoot = canonicalRoots(["C:\\"], { ...W, fsImpl: fs2 });
  assert.deepEqual(driveRoot, ["C:/"]);
  assert.equal(canonicalizeShellResource("C:\\repository\\x", driveRoot, { ...W, fsImpl: fs2 }).ok, true);
});

test("POSIX pure resolution: Windows-form paths are not absolute on a POSIX host", () => {
  assert.equal(resolveShellPath("C:\\repo\\x", { pathImpl: path.posix }), null);
  assert.equal(resolveShellPath("relative/x", { pathImpl: path.posix }), null);
});

test("policies may name Windows resources only in canonical '/' form", () => {
  const d = (scope) => ({ policy_version: "w1", descriptors: [{
    descriptor_id: "SH-WIN", actor_role: "Builder", project: "Dillaab-source/maisog-labs", provider: "shell", action: "fs.read",
    resource_scope: scope, environment: "local", expiry: null, credential_requirement: { required: false, credential_class: null }, consequence_tier: "low",
  }] });
  assert.equal(validateCapabilityPolicy(d(["C:/repo/*"])).ok, true);
  assert.equal(validateCapabilityPolicy(d(["//srv/share/repo/*"])).ok, true);
  assert.equal(validateCapabilityPolicy(d(["C:\\repo\\*"])).ok, false);
  assert.equal(validateCapabilityPolicy(d(["c:/repo/*"])).ok, false); // drive letter must be canonical upper case
});
