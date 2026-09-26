#!/usr/bin/env node
// S5 Capability & Permission Gateway V1 (ML-DEVOS-RFC-017 / ML-DEVOS-AS-077 /
// D-063) -- structural + semantic validator for capability policy documents.
//
// Zero third-party dependencies (Node builtins only), following the S3/S4
// validator precedent: a hand-rolled check against
// capability-policy.schema.json / capability-descriptor.schema.json's declared
// shape, plus the semantic rules JSON Schema cannot express.
//
// WHAT THIS VALIDATOR PROVES (load time only):
//   - exact document/descriptor shape (unknown or missing fields fail);
//   - closed vocabularies (roles, providers -- `future` is reserved and
//     unusable -- environments, tiers);
//   - resource_scope uses only the bounded V1 grammar (exact literal, one
//     trailing "/*", bare "*"), non-empty, and every literal/stem is already
//     canonical under the descriptor's provider contract (canonical.mjs);
//   - credential requirements name a class only, never a value;
//   - RFC-017 §8: a sensitive-operation descriptor is never authored below
//     consequence_tier "high" -- enforced here, never by evaluate();
//   - no string anywhere in the document looks like a secret value.
// A document with any error is rejected whole (RFC-017 Failure modes): no bad
// descriptor is skipped and no partial policy is ever loaded.
//
// WHAT IT DOES NOT PROVE: that a policy is wise, least-privilege in intent, or
// authorized. Loading a policy grants nothing (CORE-002, CORE-008).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isCanonical, isCanonicalPrefixStem } from "./canonical.mjs";
import {
  ACTION_PATTERN,
  ACTOR_ROLES,
  CONSEQUENCE_TIERS,
  CREDENTIAL_CLASS_PATTERN,
  ENVIRONMENTS,
  POLICY_VERSION_PATTERN,
  PROTECTED_REF_SUFFIX,
  PROVIDERS,
  SENSITIVE_ACTIONS,
  isDescriptorId,
  isProjectString,
  parseInstant,
} from "./vocabulary.mjs";

const POLICY_KEYS = ["policy_version", "descriptors"];
const DESCRIPTOR_KEYS = [
  "descriptor_id", "actor_role", "project", "provider", "action", "resource_scope",
  "environment", "expiry", "credential_requirement", "consequence_tier",
];
const CREDENTIAL_KEYS = ["required", "credential_class"];

// Defense in depth: shapes of real secret values that must never appear.
const SECRET_SHAPES = [
  /github_pat_[A-Za-z0-9_]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /xox[abprs]-[A-Za-z0-9-]{10,}/,
  /sk-[A-Za-z0-9]{20,}/,
];

export function looksLikeSecret(value) {
  return typeof value === "string" && SECRET_SHAPES.some((re) => re.test(value));
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function exactKeys(obj, keys, where, errors) {
  for (const k of Object.keys(obj)) if (!keys.includes(k)) errors.push(`${where}: unknown field '${k}'`);
  for (const k of keys) if (!Object.hasOwn(obj, k)) errors.push(`${where}: missing required field '${k}'`);
}

function scanSecrets(value, where, errors) {
  if (typeof value === "string") {
    if (looksLikeSecret(value)) errors.push(`${where}: value looks like a secret; policies carry credential classes only`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanSecrets(v, `${where}[${i}]`, errors));
  } else if (isPlainObject(value)) {
    for (const [k, v] of Object.entries(value)) scanSecrets(v, `${where}.${k}`, errors);
  }
}

// Returns "exact" | "prefix" | "any" or null for a pattern outside the V1 grammar.
export function patternKind(pattern) {
  if (pattern === "*") return "any";
  if (typeof pattern !== "string" || pattern.length === 0) return null;
  const stars = pattern.split("*").length - 1;
  if (stars === 0) return "exact";
  if (stars === 1 && pattern.endsWith("/*") && pattern.length > 2) return "prefix";
  return null;
}

// RFC-017 §8 sensitive-operation classification (load time only).
export function sensitiveCategory(descriptor) {
  const named = SENSITIVE_ACTIONS[descriptor.provider]?.[descriptor.action];
  if (named) return named;
  if (descriptor.provider === "github" && (descriptor.action === "git.push" || descriptor.action === "pr.merge")) {
    const main = PROTECTED_REF_SUFFIX.slice(1); // "refs/heads/main"
    const coversMain = descriptor.resource_scope.some((p) => {
      const kind = patternKind(p);
      if (kind === "any") return true;
      if (kind === "exact") return p.endsWith(PROTECTED_REF_SUFFIX);
      if (kind === "prefix") {
        const stem = p.slice(0, -2);
        const colon = stem.indexOf(":");
        return colon === -1 || main.startsWith(`${stem.slice(colon + 1)}/`);
      }
      return false;
    });
    if (coversMain) return "protected-branch/main merge";
  }
  return null;
}

function validateDescriptor(d, where, errors) {
  if (!isPlainObject(d)) {
    errors.push(`${where}: descriptor must be an object`);
    return;
  }
  exactKeys(d, DESCRIPTOR_KEYS, where, errors);
  if (!isDescriptorId(d.descriptor_id)) errors.push(`${where}.descriptor_id: must match ^[A-Z][A-Z0-9_-]*$ with length >= 3`);
  if (!ACTOR_ROLES.includes(d.actor_role)) errors.push(`${where}.actor_role: must be one of ${ACTOR_ROLES.join(", ")}`);
  if (d.project !== "*" && !isProjectString(d.project)) errors.push(`${where}.project: must be a non-empty project string or "*"`);
  const providerOk = PROVIDERS.includes(d.provider);
  if (!providerOk) errors.push(`${where}.provider: must be a registered V1 adapter (${PROVIDERS.join(", ")}); "future" is reserved`);
  if (typeof d.action !== "string" || !ACTION_PATTERN.test(d.action)) errors.push(`${where}.action: must be a provider-scoped dotted action name`);
  if (!ENVIRONMENTS.includes(d.environment)) errors.push(`${where}.environment: must be one of ${ENVIRONMENTS.join(", ")}`);
  if (d.expiry !== null && parseInstant(d.expiry) === null) errors.push(`${where}.expiry: must be null or a UTC instant (YYYY-MM-DDTHH:MM:SS[.sss]Z)`);
  if (!CONSEQUENCE_TIERS.includes(d.consequence_tier)) errors.push(`${where}.consequence_tier: must be one of ${CONSEQUENCE_TIERS.join(", ")}`);

  if (!Array.isArray(d.resource_scope) || d.resource_scope.length === 0) {
    errors.push(`${where}.resource_scope: must be a non-empty array (unbounded scope must be spelled "*")`);
  } else {
    if (new Set(d.resource_scope).size !== d.resource_scope.length) errors.push(`${where}.resource_scope: duplicate pattern`);
    d.resource_scope.forEach((p, i) => {
      const kind = patternKind(p);
      if (kind === null) errors.push(`${where}.resource_scope[${i}]: outside the V1 grammar (exact literal, one trailing "/*", or bare "*")`);
      else if (providerOk && kind === "exact" && !isCanonical(d.provider, p)) errors.push(`${where}.resource_scope[${i}]: literal is not canonical for provider ${d.provider}`);
      else if (providerOk && kind === "prefix" && !isCanonicalPrefixStem(d.provider, p.slice(0, -2))) errors.push(`${where}.resource_scope[${i}]: prefix stem is not canonical for provider ${d.provider}`);
    });
  }

  const cr = d.credential_requirement;
  if (!isPlainObject(cr)) {
    errors.push(`${where}.credential_requirement: must be an object`);
  } else {
    exactKeys(cr, CREDENTIAL_KEYS, `${where}.credential_requirement`, errors);
    if (typeof cr.required !== "boolean") errors.push(`${where}.credential_requirement.required: must be boolean`);
    if (cr.required === true && (typeof cr.credential_class !== "string" || !CREDENTIAL_CLASS_PATTERN.test(cr.credential_class) || cr.credential_class === "none")) {
      errors.push(`${where}.credential_requirement.credential_class: a required credential must name a class (e.g. github_pat_scoped), never a value`);
    }
    if (cr.required === false && cr.credential_class !== null) errors.push(`${where}.credential_requirement.credential_class: must be null when no credential is required`);
  }

  if (providerOk && Array.isArray(d.resource_scope) && typeof d.action === "string") {
    const category = sensitiveCategory(d);
    if (category && (d.consequence_tier === "low" || d.consequence_tier === "medium")) {
      errors.push(`${where}.consequence_tier: sensitive operation (${category}) must be "high" or "highest" (RFC-017 §8)`);
    }
  }
}

export function validateCapabilityPolicy(doc) {
  const errors = [];
  if (!isPlainObject(doc)) return { ok: false, errors: ["policy: must be a JSON object"] };
  exactKeys(doc, POLICY_KEYS, "policy", errors);
  if (typeof doc.policy_version !== "string" || !POLICY_VERSION_PATTERN.test(doc.policy_version)) {
    errors.push("policy.policy_version: must match ^[a-z0-9][a-z0-9._-]{0,63}$");
  }
  if (!Array.isArray(doc.descriptors) || doc.descriptors.length === 0) {
    errors.push("policy.descriptors: must be a non-empty array");
  } else {
    const ids = new Set();
    doc.descriptors.forEach((d, i) => {
      validateDescriptor(d, `policy.descriptors[${i}]`, errors);
      if (isPlainObject(d) && typeof d.descriptor_id === "string") {
        if (ids.has(d.descriptor_id)) errors.push(`policy.descriptors[${i}].descriptor_id: duplicate ${d.descriptor_id}`);
        ids.add(d.descriptor_id);
      }
    });
  }
  scanSecrets(doc, "policy", errors);
  return { ok: errors.length === 0, errors };
}

// ------------------------------------------------------------ loading

export class PolicyValidationError extends Error {
  constructor(errors) {
    super(`capability policy rejected:\n  ${errors.join("\n  ")}`);
    this.name = "PolicyValidationError";
    this.errors = errors;
  }
}

const loadedPolicies = new WeakSet();

function deepFreeze(v) {
  if (v !== null && typeof v === "object") {
    for (const x of Object.values(v)) deepFreeze(x);
    Object.freeze(v);
  }
  return v;
}

// Validate and return an immutable, loader-registered copy. Throws on any error.
export function loadCapabilityPolicy(doc) {
  const { ok, errors } = validateCapabilityPolicy(doc);
  if (!ok) throw new PolicyValidationError(errors);
  const policy = deepFreeze(structuredClone(doc));
  loadedPolicies.add(policy);
  return policy;
}

export function isLoadedPolicy(value) {
  return value !== null && typeof value === "object" && loadedPolicies.has(value);
}

// ---------------------------------------------------------------- CLI

const HERE = path.dirname(fileURLToPath(import.meta.url));

function listJson(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".policy.json")).sort().map((f) => path.join(dir, f)) : [];
}

export function main(argv = process.argv.slice(2), out = process.stdout) {
  const explicit = argv.length > 0;
  const targets = explicit
    ? argv.map((f) => ({ file: f, expect: true }))
    : [
      ...listJson(path.join(HERE, "examples", "valid")).map((file) => ({ file, expect: true })),
      ...listJson(path.join(HERE, "examples", "invalid")).map((file) => ({ file, expect: false })),
    ];
  let failures = 0;
  for (const { file, expect } of targets) {
    let result;
    try {
      result = validateCapabilityPolicy(JSON.parse(fs.readFileSync(file, "utf8")));
    } catch (err) {
      result = { ok: false, errors: [`unreadable/unparseable: ${err.message}`] };
    }
    const asExpected = result.ok === expect;
    if (!asExpected) failures += 1;
    const rel = path.relative(process.cwd(), file);
    out.write(`${asExpected ? "OK" : "UNEXPECTED"}: ${rel} ${result.ok ? "valid" : `invalid (${result.errors.length} error(s))`}\n`);
    if (!result.ok && (explicit || !asExpected)) for (const e of result.errors) out.write(`    ${e}\n`);
  }
  return failures === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
