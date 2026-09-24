// S5 V1 per-adapter canonicalization contracts (ML-DEVOS-RFC-017 §2, §9 --
// corrects AS76-F003). Pure, synchronous, no I/O. Each provider defines its
// own canonical resource shape; there is no universal recipe and the core
// matcher never decodes anything. Adapter-side steps that need the host
// environment (shell symlink resolution, Cloudflare reference provenance) live
// in the adapters, on top of these syntactic contracts.
//
// Every function returns { ok: true, value } or { ok: false, reason }.

import path from "node:path";

const CONTROL_OR_SPACE = /[\u0000- \u007f]/;
const ok = (value) => ({ ok: true, value });
const bad = (reason) => ({ ok: false, reason });

// shell: absolute POSIX path, separators normalized to "/", no "."/".."
// segments, no empty segments, no trailing slash (except root). Symlink
// resolution and root confinement are the shell adapter's job.
function shell(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 4096) return bad("not a non-empty path string");
  if (/[\u0000-\u001f\u007f]/.test(raw)) return bad("control character in path");
  const slashed = raw.replaceAll("\\", "/");
  if (!slashed.startsWith("/")) return bad("path is not absolute");
  const normalized = path.posix.normalize(slashed);
  const value = normalized.length > 1 && normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  return ok(value);
}

// github: GitHub's own owner/repo identifier, owner/repo lowercased (GitHub
// treats them case-insensitively), optionally ":<ref-or-path>" kept verbatim
// and checked against git's ref-format rules. No generic decoding.
const GH_OWNER = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;
const GH_REPO = /^[a-z0-9._-]{1,100}$/;
const REF_FORBIDDEN = /[\u0000- \u007f~^:?*[\\]|\.\.|@\{|\/\//;
function github(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 1024) return bad("not a non-empty identifier");
  const colon = raw.indexOf(":");
  const id = colon === -1 ? raw : raw.slice(0, colon);
  const suffix = colon === -1 ? null : raw.slice(colon + 1);
  const parts = id.split("/");
  if (parts.length !== 2) return bad("not owner/repo");
  const [owner, repo] = parts.map((p) => p.toLowerCase());
  if (!GH_OWNER.test(owner)) return bad("malformed owner");
  if (!GH_REPO.test(repo) || repo === "." || repo === "..") return bad("malformed repo");
  if (suffix !== null) {
    if (suffix.length === 0 || REF_FORBIDDEN.test(suffix) || suffix.startsWith("/") || suffix.endsWith("/")
      || suffix.endsWith(".") || suffix.endsWith(".lock") || suffix.split("/").some((s) => s.startsWith("."))) {
      return bad("malformed ref/path");
    }
  }
  return ok(suffix === null ? `${owner}/${repo}` : `${owner}/${repo}:${suffix}`);
}

// cloudflare: opaque identifier used byte-for-byte; no percent-decoding or
// case folding, because decoding an opaque ID can change its meaning.
// Provenance (was it obtained from a genuine Cloudflare reference?) is checked
// by the adapter against its host's trusted reference set.
function cloudflare(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return bad("not a non-empty identifier");
  if (CONTROL_OR_SPACE.test(raw)) return bad("whitespace/control character in opaque identifier");
  return ok(raw);
}

// mcp: RFC 3986 URI as the MCP specification uses for resource URIs. Only
// RFC 3986's own normalizations are applied (lowercase scheme, uppercase
// percent-encoding hex); nothing is decoded.
const URI_CHARS = /^[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/;
function mcp(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return bad("not a non-empty URI");
  const m = /^([A-Za-z][A-Za-z0-9+.-]*):(.+)$/.exec(raw);
  if (!m) return bad("missing URI scheme");
  if (!URI_CHARS.test(raw)) return bad("character outside RFC 3986 URI grammar");
  if (/%(?![0-9A-Fa-f]{2})/.test(raw)) return bad("malformed percent-encoding");
  const rest = m[2].replace(/%[0-9a-f]{2}/gi, (h) => h.toUpperCase());
  return ok(`${m[1].toLowerCase()}:${rest}`);
}

// browser: WHATWG URL Standard normalization; http(s) only; fragment
// excluded; embedded credentials rejected (a URL must never carry a secret).
function browser(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 4096) return bad("not a non-empty URL");
  let u;
  try {
    u = new URL(raw);
  } catch {
    return bad("not a valid WHATWG URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return bad("only http/https URLs are browser resources in V1");
  if (u.username || u.password) return bad("URL carries embedded credentials");
  return ok(`${u.protocol}//${u.host}${u.pathname}${u.search}`);
}

export const CANONICALIZERS = Object.freeze({ shell, github, cloudflare, mcp, browser });

export function canonicalize(provider, raw) {
  const fn = Object.hasOwn(CANONICALIZERS, provider) ? CANONICALIZERS[provider] : null;
  return fn ? fn(raw) : bad(`no canonicalization contract for provider ${String(provider)}`);
}

// A value is canonical iff its provider's contract maps it to itself.
export function isCanonical(provider, value) {
  const r = canonicalize(provider, value);
  return r.ok && r.value === value;
}

// A prefix pattern "P/*" is well-formed iff "P/x" is canonical for the
// provider, i.e. P is a canonical stem any matched resource must start with.
export function isCanonicalPrefixStem(provider, stem) {
  return typeof stem === "string" && stem.length > 0 && isCanonical(provider, `${stem}/x`);
}
