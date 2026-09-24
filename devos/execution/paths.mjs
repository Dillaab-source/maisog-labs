// S6 path containment, creation and no-follow deletion (ML-DEVOS-RFC-019 §9,
// §9.1 -- AS86-F003).
//
// Canonical form: POSIX "/a/b", Windows drive "C:/a/b", UNC "//server/share/a",
// always "/" separators (the same form S5's shell contract uses; reimplemented
// here so S6 imports no S5 internals). Containment is segment-wise, never a
// string prefix, and case-folded where the profile is case-insensitive.
//
// Disclosed limit (RFC-019 Residual risks 4): Node has no portable openat /
// O_NOFOLLOW for intermediate components. Every creation and deletion step
// re-verifies recorded directory identities immediately before acting and fails
// closed on substitution; the window is narrowed, not eliminated.
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { ExecutionError, fail } from "./vocabulary.mjs";

const WIN_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

// §9.1 step 1: the strict union of POSIX and Windows rules, on every platform.
export function segmentProblem(seg) {
  if (typeof seg !== "string" || seg.length === 0) return "empty segment";
  if (seg === "." || seg === "..") return "dot segment";
  if (/[/\\]/.test(seg)) return "separator in segment";
  if (/[\u0000-\u001f\u007f]/.test(seg)) return "control character";
  if (seg.includes(":")) return "colon (drive or alternate data stream form)";
  if (/[. ]$/.test(seg)) return "trailing dot or space";
  if (WIN_RESERVED.test(seg)) return "reserved Windows device name";
  if (/~\d/.test(seg)) return "8.3 short-name shape";
  if (/[<>"|?*]/.test(seg)) return "character invalid on Windows";
  if (Buffer.byteLength(seg, "utf8") > 255) return "segment too long";
  if (seg.normalize("NFC") !== seg) return "not Unicode NFC";
  return null;
}

export function assertSegments(segments) {
  for (const s of segments) {
    const p = segmentProblem(s);
    if (p) fail("PATH_ESCAPE", `invalid path segment ${JSON.stringify(s)}: ${p}`);
  }
}

export function toCanonical(nativePath, { windows = process.platform === "win32" } = {}) {
  if (typeof nativePath !== "string" || nativePath.length === 0) return null;
  if (/[\u0000-\u001f\u007f]/.test(nativePath)) return null;
  if (windows) {
    if (/^[\\/]{2}[?.][\\/]/.test(nativePath)) return null; // \\?\ and \\.\ namespaces
    const s = nativePath.replaceAll("\\", "/");
    const drive = /^([A-Za-z]):\/(.*)$/.exec(s);
    const unc = /^\/\/([^/]+)\/([^/]+)(\/.*)?$/.exec(s);
    let prefix;
    let rest;
    if (drive) {
      prefix = `${drive[1].toUpperCase()}:`;
      rest = drive[2];
    } else if (unc) {
      prefix = `//${unc[1]}/${unc[2]}`;
      rest = (unc[3] ?? "").slice(1);
    } else {
      return null; // drive-relative, rooted-without-drive, relative
    }
    const segs = rest.split("/").filter(Boolean);
    if (segs.some((x) => x === "." || x === "..")) return null;
    return segs.length ? `${prefix}/${segs.join("/")}` : `${prefix}/`;
  }
  if (!nativePath.startsWith("/")) return null;
  const segs = nativePath.split("/").filter(Boolean);
  if (segs.some((x) => x === "." || x === "..")) return null;
  return `/${segs.join("/")}`;
}

function splitCanonical(c) {
  if (c.startsWith("//")) {
    const [server, share, ...rest] = c.slice(2).split("/");
    return [`//${server}/${share}`, ...rest.filter(Boolean)];
  }
  const drive = /^([A-Z]:)\/(.*)$/.exec(c);
  if (drive) return [drive[1], ...drive[2].split("/").filter(Boolean)];
  return ["", ...c.split("/").filter(Boolean)];
}

// Segment-wise containment: "/ws/a" is never inside "/ws/ab".
export function isWithin(child, root, { caseInsensitive = false, allowEqual = true } = {}) {
  if (typeof child !== "string" || typeof root !== "string") return false;
  const fold = (x) => (caseInsensitive ? x.toLowerCase() : x);
  const c = splitCanonical(child).map(fold);
  const r = splitCanonical(root).map(fold);
  if (c.length < r.length) return false;
  for (let i = 0; i < r.length; i += 1) if (c[i] !== r[i]) return false;
  return allowEqual || c.length > r.length;
}

const identityOf = (st) => ({ dev: st.dev, ino: st.ino });
const sameIdentity = (a, b) => a.dev === b.dev && a.ino === b.ino;
const realpathNative = (p) => fs.realpathSync.native(p);

// Existing-path rules 1/2/4 (§9): dangling/looping links are UNRESOLVED_LINK,
// anything resolving outside `rootCanonical` is PATH_ESCAPE.
export function hostPathFailures(nativePath, rootCanonical, opts = {}) {
  try {
    fs.lstatSync(nativePath);
  } catch {
    return [];
  }
  let real;
  try {
    real = realpathNative(nativePath);
  } catch {
    return ["UNRESOLVED_LINK"];
  }
  const canonical = toCanonical(real, opts);
  if (canonical === null || !isWithin(canonical, rootCanonical, opts)) return ["PATH_ESCAPE"];
  return [];
}

// §9.1 step 2: canonicalize and verify the nearest existing ancestor.
export function verifiedBase(baseNative, opts = {}) {
  let st;
  let real;
  try {
    st = fs.lstatSync(baseNative);
    real = realpathNative(baseNative);
  } catch {
    fail("UNRESOLVED_LINK", `base ${baseNative} cannot be resolved`);
  }
  if (!st.isDirectory() || st.isSymbolicLink()) fail("PATH_ESCAPE", `base ${baseNative} is not a real directory`);
  const canonical = toCanonical(real, opts);
  if (canonical === null || toCanonical(baseNative, opts) !== canonical) fail("PATH_ESCAPE", `base ${baseNative} is not its own canonical real path`);
  return { native: real, canonical, ...identityOf(st) };
}

// §9.1 steps 3-4: one segment at a time (never recursive mkdir), revalidating
// identity and real path immediately after each creation. Shared intermediates
// may pre-exist only as real directories; the last segment may be required to
// be new (exclusive -> WORKTREE_COLLISION).
export function createDirChain(base, segments, { exclusiveLast = false, ...opts } = {}) {
  assertSegments(segments);
  const chain = [base];
  let parent = base;
  segments.forEach((seg, i) => {
    const last = i === segments.length - 1;
    const p = path.join(parent.native, seg);
    try {
      fs.mkdirSync(p);
    } catch (err) {
      if (err.code !== "EEXIST") fail("ISOLATION_UNPROVABLE", `cannot create ${seg}: ${err.code}`);
      if (last && exclusiveLast) fail("WORKTREE_COLLISION", `${p} already exists`);
      const st = fs.lstatSync(p);
      if (st.isSymbolicLink()) {
        let real = null;
        try {
          real = toCanonical(realpathNative(p), opts);
        } catch {
          fail("UNRESOLVED_LINK", `${p} is an unresolvable link`);
        }
        if (real === null || !isWithin(real, base.canonical, opts)) fail("PATH_ESCAPE", `${p} is a link leaving the base`);
        fail("ISOLATION_UNPROVABLE", `${p} is a link, not a real directory`);
      }
      if (!st.isDirectory()) fail("ISOLATION_UNPROVABLE", `${p} exists and is not a directory`);
    }
    const st = fs.lstatSync(p);
    if (!st.isDirectory() || st.isSymbolicLink()) fail("ISOLATION_UNPROVABLE", `${p} was substituted after creation`);
    const expected = `${parent.canonical.replace(/\/$/, "")}/${seg}`;
    if (toCanonical(realpathNative(p), opts) !== expected) fail("ISOLATION_UNPROVABLE", `${p} does not resolve to ${expected}`);
    parent = { native: p, canonical: expected, ...identityOf(st) };
    chain.push(parent);
  });
  return chain;
}

// §9.1 step 5: revalidate a recorded chain before use and before each write.
export function verifyChain(chain, opts = {}) {
  for (const entry of chain) {
    let st;
    let real;
    try {
      st = fs.lstatSync(entry.native);
      real = toCanonical(realpathNative(entry.native), opts);
    } catch {
      fail("ISOLATION_UNPROVABLE", `${entry.native} disappeared or became unresolvable`);
    }
    if (st.isSymbolicLink() || !st.isDirectory()) fail("ISOLATION_UNPROVABLE", `${entry.native} was substituted`);
    if (!sameIdentity(identityOf(st), entry)) fail("ISOLATION_UNPROVABLE", `${entry.native} identity changed`);
    if (real !== entry.canonical) fail("ISOLATION_UNPROVABLE", `${entry.native} real path changed`);
  }
  return true;
}

// §9.1 step 3 (files): O_CREAT|O_EXCL (fails even on a dangling symlink), then
// fstat of the handle must match lstat of the path.
export function createFileExclusive(dirEntry, name, data, { existsCode = "ISOLATION_UNPROVABLE" } = {}) {
  assertSegments([name]);
  const p = path.join(dirEntry.native, name);
  let fd;
  try {
    fd = fs.openSync(p, "wx", 0o600);
  } catch (err) {
    if (err.code === "EEXIST") fail(existsCode, `${p} already exists`);
    fail("ISOLATION_UNPROVABLE", `cannot create ${p}: ${err.code}`);
  }
  try {
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
    const a = fs.fstatSync(fd);
    const b = fs.lstatSync(p);
    if (!b.isFile() || b.isSymbolicLink() || !sameIdentity(identityOf(a), identityOf(b))) fail("ISOLATION_UNPROVABLE", `${p} was substituted after creation`);
  } finally {
    fs.closeSync(fd);
  }
  return p;
}

// Exclusive temp file, then atomic rename (rename replaces a link entry, never
// its target).
export function writeAtomic(dirEntry, name, data) {
  assertSegments([name]);
  const tmp = `.${name}.${randomBytes(6).toString("hex")}.tmp`;
  fs.renameSync(createFileExclusive(dirEntry, tmp, data), path.join(dirEntry.native, name));
}

// Atomic exclusive publish (AS94-F002): the complete, fsynced bytes are
// written to a private temp file and then hard-linked into place. link()
// fails with EEXIST if the name exists, so the final name either does not
// exist or holds the COMPLETE content -- a crash can never leave a partial
// file under the final name, and two writers can never both succeed.
export function publishFileExclusive(dirEntry, name, data, { existsCode = "ISOLATION_UNPROVABLE" } = {}) {
  assertSegments([name]);
  const tmp = createFileExclusive(dirEntry, `.${name}.${randomBytes(6).toString("hex")}.tmp`, data);
  const final = path.join(dirEntry.native, name);
  try {
    fs.linkSync(tmp, final);
  } catch (err) {
    if (err.code === "EEXIST") fail(existsCode, `${final} already exists`);
    fail("ISOLATION_UNPROVABLE", `cannot publish ${final}: ${err.code}`);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  try {
    const dfd = fs.openSync(dirEntry.native, "r");
    try {
      fs.fsyncSync(dfd);
    } finally {
      fs.closeSync(dfd);
    }
  } catch {
    // directory fsync is best-effort (unsupported on some platforms)
  }
  return final;
}

// Existing-path rule 5: deletion never follows links. Each directory's identity
// is recorded when first seen. Immediately before ANY entry is read, unlinked
// or removed, every ancestor directory from the target down is re-checked
// (not a link, same identity), so a directory swapped for a link after it was
// listed can never route a removal outside the tree; any substitution aborts
// with CLEANUP_CONTAMINATION_RISK. Node exposes no unlinkat(), so a residual
// race narrower than one lstat/unlink pair remains (RFC-019 Residual risks).
// `fsImpl` exists so tests can inject failures; it can only make removal fail,
// never widen it.
export function removeTreeNoFollow(targetNative, { fsImpl = fs, windows = process.platform === "win32" } = {}) {
  const residue = [];
  const verifyAncestors = (ancestors) => {
    for (const [dirPath, id] of ancestors) {
      let now;
      try {
        now = fsImpl.lstatSync(dirPath);
      } catch {
        throw new ExecutionError("CLEANUP_CONTAMINATION_RISK", `${dirPath} vanished during cleanup`);
      }
      if (now.isSymbolicLink() || !now.isDirectory() || !sameIdentity(id, identityOf(now))) {
        throw new ExecutionError("CLEANUP_CONTAMINATION_RISK", `${dirPath} was substituted during cleanup`);
      }
    }
  };
  const walk = (p, ancestors) => {
    verifyAncestors(ancestors);
    let st;
    try {
      st = fsImpl.lstatSync(p);
    } catch (err) {
      if (err.code !== "ENOENT") residue.push(p);
      return;
    }
    if (st.isSymbolicLink()) {
      verifyAncestors(ancestors);
      try {
        if (windows) {
          try {
            fsImpl.rmdirSync(p); // a junction is removed as an entry, never recursed into
          } catch {
            fsImpl.unlinkSync(p);
          }
        } else {
          fsImpl.unlinkSync(p);
        }
      } catch {
        residue.push(p);
      }
      return;
    }
    if (st.isDirectory()) {
      const self = [...ancestors, [p, identityOf(st)]];
      let entries = [];
      try {
        entries = fsImpl.readdirSync(p);
      } catch {
        residue.push(p);
        return;
      }
      for (const e of entries) walk(path.join(p, e), self);
      verifyAncestors(self);
      try {
        fsImpl.rmdirSync(p);
      } catch {
        residue.push(p);
      }
      return;
    }
    verifyAncestors(ancestors);
    try {
      fsImpl.unlinkSync(p);
    } catch {
      residue.push(p);
    }
  };
  walk(targetNative, []);
  let gone = false;
  try {
    fs.lstatSync(targetNative);
  } catch {
    gone = true;
  }
  return { ok: residue.length === 0 && gone, residue };
}
