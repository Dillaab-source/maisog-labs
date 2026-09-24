// S6 environment, config and credential boundaries (ML-DEVOS-RFC-019 §6, §10,
// §12).
//
// The instance environment is built from empty -- never inherited then
// filtered. The deny set is a backstop proving the allowlist did not regress.
// S6 core only CONSTRUCTS and VERIFIES this environment; it hands it, as data,
// to a separately authorized execution driver in an Execution Permit (§13.1).
import fs from "node:fs";
import path from "node:path";

import { canonicalJson, sha256 } from "./digest.mjs";
import { isWithin, toCanonical } from "./paths.mjs";

const DENY_NAME = [
  /TOKEN/i, /SECRET/i, /PASSWORD/i, /PASSWD/i, /_KEY$/i, /^AWS_/i, /^CLOUDFLARE_/i, /^CF_API/i, /^GH_/i,
  /^GITHUB_/i, /^NPM_TOKEN$/i, /^NODE_AUTH_TOKEN$/i, /^SSH_AUTH_SOCK$/i, /^GIT_ASKPASS$/i, /^SSH_ASKPASS$/i,
  /^GIT_SSH$/i, /^GIT_SSH_COMMAND$/i, /^GCM_/i, /^NODE_OPTIONS$/i, /^LD_PRELOAD$/i, /^LD_LIBRARY_PATH$/i,
  /^DYLD_/i, /^BASH_ENV$/i, /^ENV$/i, /^PYTHONSTARTUP$/i, /^GIT_CONFIG_PARAMETERS$/i, /^GIT_CONFIG_COUNT$/i,
];

export function instancePaths(instanceNative) {
  const config = path.join(instanceNative, "config");
  return {
    root: instanceNative,
    repo: path.join(instanceNative, "repo"),
    home: path.join(instanceNative, "home"),
    tmp: path.join(instanceNative, "tmp"),
    cache: path.join(instanceNative, "cache"),
    config,
    hooks: path.join(config, "hooks"),
    gitconfig: path.join(config, "gitconfig"),
    npmrc: path.join(config, "npmrc"),
  };
}

export function buildInstanceEnvironment({ paths, toolchainPath, windows = process.platform === "win32", windowsSystemEnv = {} }) {
  const env = {
    PATH: toolchainPath.join(windows ? ";" : ":"),
    HOME: paths.home,
    TMPDIR: paths.tmp,
    TMP: paths.tmp,
    TEMP: paths.tmp,
    XDG_CONFIG_HOME: path.join(paths.home, ".config"),
    XDG_CACHE_HOME: path.join(paths.home, ".cache"),
    XDG_DATA_HOME: path.join(paths.home, ".local", "share"),
    GIT_CONFIG_GLOBAL: paths.gitconfig,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
    npm_config_cache: path.join(paths.cache, "npm"),
    npm_config_userconfig: paths.npmrc,
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    TZ: "UTC",
    CI: "true",
  };
  if (windows) {
    env.USERPROFILE = paths.home;
    for (const k of ["SystemRoot", "ComSpec", "PATHEXT", "WINDIR"]) if (windowsSystemEnv[k]) env[k] = windowsSystemEnv[k];
  }
  return env;
}

// Names and value hashes only -- never values (§10, §17).
export function environmentDigest(env) {
  return sha256(canonicalJson(Object.fromEntries(Object.entries(env).map(([k, v]) => [k, sha256(String(v))]))));
}

export function environmentFailures(env, { windows = process.platform === "win32", instanceRoot = null, toolchainPath = [] } = {}) {
  const codes = new Set();
  const seen = new Set();
  for (const [name, value] of Object.entries(env)) {
    const folded = windows ? name.toUpperCase() : name;
    if (seen.has(folded)) codes.add("ENV_POLICY_VIOLATION");
    seen.add(folded);
    if (DENY_NAME.some((re) => re.test(name))) codes.add("ENV_POLICY_VIOLATION");
    if (/_proxy$/i.test(name) && /\/\/[^/@]*@/.test(String(value))) codes.add("ENV_POLICY_VIOLATION");
  }
  const pathValue = env.PATH ?? "";
  for (const e of pathValue.split(windows ? ";" : ":")) {
    if (e === "" || e === "." || !path.isAbsolute(e)) codes.add("ENV_POLICY_VIOLATION");
    if (instanceRoot) {
      const c = toCanonical(e, { windows });
      if (c !== null && isWithin(c, instanceRoot, { caseInsensitive: windows })) codes.add("ENV_POLICY_VIOLATION");
    }
  }
  if (toolchainPath.length && pathValue !== toolchainPath.join(windows ? ";" : ":")) codes.add("ENV_POLICY_VIOLATION");
  return [...codes];
}

export function instanceGitConfig({ hooksDir }) {
  const q = (s) => s.replaceAll("\\", "/");
  return [
    "[user]", "\tname = Sentinel S6 Instance", "\temail = s6-instance@invalid",
    "[core]", `\thooksPath = ${q(hooksDir)}`,
    "[commit]", "\tgpgsign = false",
    "[tag]", "\tgpgsign = false",
    "",
  ].join("\n");
}

export function instanceNpmrc({ cacheDir }) {
  return `cache=${cacheDir.replaceAll("\\", "/")}\n`;
}

// §6: repository-local config keys allowed in an instance clone.
const ALLOWED_LOCAL_KEYS = [
  /^core\.repositoryformatversion$/, /^core\.filemode$/, /^core\.bare$/, /^core\.logallrefupdates$/,
  /^core\.autocrlf$/, /^core\.symlinks$/, /^core\.ignorecase$/, /^core\.precomposeunicode$/,
  /^remote\.origin\.url$/, /^remote\.origin\.fetch$/, /^branch\.[^=]+\.(remote|merge)$/, /^extensions\.objectformat$/,
];

export function localConfigFailures(configLines, { expectedRemoteUrl }) {
  const codes = new Set();
  for (const line of configLines) {
    const i = line.indexOf("=");
    const key = (i < 0 ? line : line.slice(0, i)).toLowerCase();
    const value = i < 0 ? "" : line.slice(i + 1);
    if (!ALLOWED_LOCAL_KEYS.some((re) => re.test(key))) codes.add("ENV_POLICY_VIOLATION");
    if (key === "remote.origin.url" && (/\/\/[^/@]*@/.test(value) || value !== expectedRemoteUrl)) codes.add("REPOSITORY_MISMATCH");
  }
  return [...codes];
}

// §12 pre-use scan by file NAME (never content-scanning tracked files).
const CREDENTIAL_NAMES = [/^\.git-credentials$/, /^id_(rsa|dsa|ecdsa|ed25519)(_sk)?$/, /\.pem$/i, /\.key$/i, /^\.netrc$/, /^_netrc$/];

export function scanCredentialFiles(root, { tracked = new Set(), skipDirs = new Set([".git"]) } = {}) {
  const hits = [];
  const walk = (dir, rel) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of entries) {
      const r = rel ? `${rel}/${d.name}` : d.name;
      if (d.isSymbolicLink()) continue; // never followed
      if (d.isDirectory()) {
        if (!skipDirs.has(d.name)) walk(path.join(dir, d.name), r);
        continue;
      }
      if (!d.isFile()) continue;
      if (CREDENTIAL_NAMES.some((re) => re.test(d.name))) hits.push(r);
      else if (/^\.env(\..*)?$/.test(d.name) && !tracked.has(r)) hits.push(r);
      else if (d.name === ".npmrc" || d.name === "npmrc") {
        try {
          if (/_authToken|_auth\s*=|_password/i.test(fs.readFileSync(path.join(dir, d.name), "utf8"))) hits.push(r);
        } catch {
          hits.push(r);
        }
      }
    }
  };
  walk(root, "");
  return hits;
}
