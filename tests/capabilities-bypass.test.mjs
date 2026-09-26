// S5 V1 adversarial regression for ML-DEVOS-AS-082 AS82-F001: an early or
// foreign same-process caller must not be able to obtain usable genuine
// trusted-context minters and manufacture a trusted direct-core decision.
//
// Each scenario runs in a FRESH child process so the hostile code genuinely
// loads first, before any legitimate gateway code. The probe harvests every
// export of every production module under devos/capabilities/, calls every
// exported function with capturing arguments, collects anything minter-shaped
// from return values, captured callbacks, and host callbacks, then tries to
// mint contexts and obtain an ALLOW from the raw evaluate() core under a
// maximally permissive loaded policy. Any ALLOW from the raw core is a bypass.
//
// No production hook is used or required: the probe only uses what an
// ordinary caller can import.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PROBE = String.raw`
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.S5_ROOT;
const cap = path.join(root, "devos", "capabilities");
const scenario = process.env.S5_SCENARIO;
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".mjs") && files.push(path.join(d, e.name)));
walk(cap);
// The hostile caller imports the brand module FIRST, then everything else.
files.sort((a, b) => (a.endsWith("trusted-context.mjs") ? -1 : b.endsWith("trusted-context.mjs") ? 1 : a.localeCompare(b)));

const found = new Set();   // minter-shaped objects
const branded = new Set(); // objects that might be genuine contexts
const seen = new WeakSet();
function harvest(v, depth = 0) {
  if (v === null || (typeof v !== "object" && typeof v !== "function") || depth > 4 || seen.has(v)) return;
  seen.add(v);
  if (typeof v.subject === "function" && typeof v.evaluation === "function") found.add(v);
  if (typeof v === "object" && ("actor_role" in v || "time" in v)) branded.add(v);
  for (const k of Object.getOwnPropertyNames(v)) {
    let x;
    try { x = v[k]; } catch { continue; }
    harvest(x, depth + 1);
  }
}
const capture = (...args) => { args.forEach((a) => harvest(a)); return args[0]; };

if (scenario === "late-intrinsic-patch") {
  // Loaded later than the brand module, the hostile caller patches the
  // intrinsics the brand path uses, hoping to intercept genuine contexts.
  // (Patching BEFORE the brand module loads is the disclosed in-process
  // residual risk and is not what this scenario claims to cover.)
}

function exercise(m) {
  for (const [name, exp] of Object.entries(m)) {
    harvest(exp);
    if (typeof exp !== "function" || /^[A-Z]/.test(name)) continue;
    for (const args of [[capture], [capture, capture], [{}], []]) {
      try { harvest(exp(...args)); } catch { /* ignore */ }
    }
  }
}

// Import one module at a time and immediately exercise its exports, so the
// brand module's surface is probed BEFORE any legitimate registry loads.
const mods = {};
for (const f of files) {
  try { mods[f] = await import(pathToFileURL(f).href); } catch (e) { mods[f] = { __error: String(e) }; }
  if (scenario === "early-harvest") exercise(mods[f]);
}

if (scenario === "late-intrinsic-patch") {
  const wmSet = WeakMap.prototype.set, wmGet = WeakMap.prototype.get, wmHas = WeakMap.prototype.has;
  WeakMap.prototype.set = function (k, v) { harvest(k); harvest(v); return wmSet.call(this, k, v); };
  WeakMap.prototype.get = function (k) { harvest(k); return wmGet.call(this, k); };
  WeakMap.prototype.has = function (k) { harvest(k); return wmHas.call(this, k); };
  const freeze = Object.freeze, keys = Object.keys, apply = Reflect.apply;
  Object.freeze = (o) => { harvest(o); return freeze(o); };
  Object.keys = (o) => { harvest(o); return keys(o); };
  Reflect.apply = (f, t, a) => { harvest(t); a.forEach((x) => harvest(x)); return apply(f, t, a); };
}

for (const m of Object.values(mods)) exercise(m);

// Build a gateway with a hostile host whose callbacks try to capture
// everything they are given or can reach through "this".
const entry = Object.values(mods).find((m) => typeof m.createGateway === "function");
const loader = Object.values(mods).find((m) => typeof m.loadCapabilityPolicy === "function");
const evaluateMod = Object.values(mods).find((m) => typeof m.evaluate === "function");
const permissive = {
  policy_version: "open-1",
  descriptors: ["github"].map((provider) => ({
    descriptor_id: "OPEN-ALL", actor_role: "Builder", project: "*", provider, action: "repo.read",
    resource_scope: ["*"], environment: "local", expiry: null,
    credential_requirement: { required: false, credential_class: null }, consequence_tier: "low",
  })),
};
if (entry) {
  const host = {
    subject() { harvest(this); harvest(arguments); return { actor_role: "Builder", actor_id: "x", credential_class: null, credential_available: false, attestation_ref: "x" }; },
    now() { harvest(this); harvest(arguments); return "2026-09-24T00:00:00Z"; },
    revocations() { harvest(this); harvest(arguments); return []; },
  };
  try {
    const gw = entry.createGateway({ policies: [permissive], hosts: { github: host } });
    harvest(gw);
    const r = gw.github.request({ project: "a/b", provider: "github", action: "repo.read", resource: "a/b", environment: "local", policy_version: "open-1" });
    harvest(r);
    if (r.decision.outcome !== "ALLOW") { console.log("GATEWAY_BROKEN " + r.decision.denial_reason); process.exit(3); }
  } catch (e) { console.log("GATEWAY_BROKEN " + e); process.exit(3); }
}

// Attempt the direct-core forgery with anything obtained.
const policy = loader.loadCapabilityPolicy(permissive);
const intent = { project: "a/b", provider: "github", action: "repo.read", resource: "a/b", environment: "local", policy_version: "open-1" };
let bypass = 0;
for (const m of found) {
  try {
    const s = m.subject({ actor_role: "Builder", actor_id: "forger", credential_class: null, credential_available: false, attestation_ref: "forged" });
    const e = m.evaluation({ time: "2026-09-24T00:00:00Z" });
    if (evaluateMod.evaluate(s, intent, policy, [], e).outcome === "ALLOW") bypass += 1;
  } catch { /* not usable */ }
}
const candidates = [...branded];
for (const s of candidates) for (const e of candidates) {
  try { if (evaluateMod.evaluate(s, intent, policy, [], e).outcome === "ALLOW") bypass += 1; } catch { /* ignore */ }
}
// Any single genuine context reaching the caller is a leak, even if it could
// not yet be paired into an ALLOW.
const verifier = Object.values(mods).find((m) => typeof m.isTrustedSubjectContext === "function");
const leaked = candidates.filter((c) => verifier.isTrustedSubjectContext(c) || verifier.isTrustedEvaluationContext(c)).length;
console.log(JSON.stringify({ minters: found.size, bypass, leaked }));
process.exit(bypass > 0 || leaked > 0 ? 2 : 0);
`;

function probe(scenario) {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", PROBE], {
    cwd: ROOT, env: { ...process.env, S5_ROOT: ROOT, S5_SCENARIO: scenario }, encoding: "utf8", timeout: 60000,
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}`.trim() };
}

test("AS82-F001: an early foreign caller harvesting every production export cannot obtain usable minters or a trusted direct-core ALLOW", () => {
  const r = probe("early-harvest");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /"minters":0,"bypass":0,"leaked":0/);
});

test("AS82-F001: late-patched intrinsics (WeakMap, Object.freeze/keys, Reflect.apply) and hostile host callbacks leak nothing usable", () => {
  const r = probe("late-intrinsic-patch");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /"bypass":0,"leaked":0/);
});
