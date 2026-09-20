#!/usr/bin/env node
// S3 Typed Task Contracts (ML-DEVOS-RFC-013 / ML-DEVOS-AS-038 / D-042) --
// structural + semantic validator for devos/contracts/**/*.contract.json instances.
//
// Mirrors the existing devos/governance/registry/validate-rules.mjs pattern:
// zero third-party dependencies (Node builtins only), a hand-rolled structural
// check against task-contract.schema.json's declared shape (additionalProperties,
// required fields, enums, patterns), plus semantic checks this schema format
// cannot express as cross-field constraints.
//
// WHAT THIS VALIDATOR PROVES:
//   - The instance matches task-contract.schema.json's declared shape exactly
//     (unknown fields, missing required fields, wrong types/enums/patterns are
//     all hard failures).
//   - A `MAIN` claim is compatible with CORE-016: its evidence requirement
//     cannot be satisfied by ACTOR_REPORTED alone, offers a real path to
//     satisfy it via INDEPENDENTLY_REPRODUCED or CI_ATTESTED, and never makes
//     RUNTIME_OBSERVED an unconditional (`all_of`) requirement -- RFC-013 is
//     explicit that RUNTIME_OBSERVED must not be required merely for a MAIN
//     claim, since it cannot exist before deployment.
//   - A `DEPLOYED` claim is compatible with CORE-017: it offers a real path to
//     satisfy it via ACTOR_REPORTED or CI_ATTESTED, and never makes
//     RUNTIME_OBSERVED an unconditional requirement (that belongs to VERIFIED).
//   - A `VERIFIED` claim is compatible with CORE-018: RUNTIME_OBSERVED is an
//     unconditional (`all_of`) requirement -- no weaker substitute is accepted.
//   - A consequence-sensitive contract (any of the five scope flags is true)
//     is compatible with CORE-020: no non-lifecycle claim's (i.e. not MAIN/
//     DEPLOYED/VERIFIED, which CORE-016/017/018 already fully govern -- CORE-020
//     is explicit that those rules "remain authoritative for those exact
//     claims") evidence requirement may be satisfied by ACTOR_REPORTED alone.
//   - Every claim's evidence requirement is non-trivial (at least one of
//     `all_of`/`any_of` is non-empty) -- an empty requirement would be
//     meaningless and would trivially satisfy every other check above.
//
// WHAT THIS VALIDATOR DOES NOT PROVE (S3 non-goals, ML-DEVOS-RFC-013):
//   - It does not inspect any actually-produced evidence artifact.
//   - It does not decide whether a task is accepted, complete, merged, or
//     deployed -- that is an Architect/Paulo judgment this validator never
//     makes and never implies.
//   - It does not verify that `authorization_references`/`requirement_references`/
//     `risk_references`/`design_references` actually resolve to real governance
//     records -- that is Architect/human review, same limitation
//     validate-rules.mjs discloses for its own citation fields.
//   - It grants no tool access, credential, remote-resource access, merge
//     approval, deployment approval, or risk acceptance, regardless of result
//     (CORE-001, CORE-002; the fixed `authority_disclaimer` field says this in
//     every instance). A `PASS` from this file is a structural/semantic
//     validity result only -- never a task-acceptance result.
//
// Not wired into any CI/git hook; not invoked automatically. Run manually:
//   node devos/contracts/validate-task-contract.mjs <path-to-contract.json> [...more]
//   node devos/contracts/validate-task-contract.mjs   (with no args: validates every
//     devos/contracts/examples/**/*.contract.json fixture and reports pass/fail
//     against its own valid/ or invalid/ directory placement)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const CONTRACTS_ROOT = HERE;
export const EXAMPLES_ROOT = path.join(HERE, "examples");

export const EVIDENCE_CLASSES = new Set([
  "ACTOR_REPORTED",
  "INDEPENDENTLY_INSPECTED",
  "INDEPENDENTLY_REPRODUCED",
  "CI_ATTESTED",
  "RUNTIME_OBSERVED",
]);

const CHANGE_CLASSES = new Set([
  "PATCH", "LOCAL_RULE", "CORE_POLICY", "CAPABILITY", "ARCHITECTURE", "CONSTITUTIONAL", "WAIVER", "PROJECT_ONBOARDING",
]);

const CLAIM_KINDS = new Set([
  "DOCUMENTATION_CORRECTNESS", "IMPLEMENTATION_PRESENT", "TESTED_BEHAVIOR", "SECURITY_OR_TRUST_BOUNDARY", "MAIN", "DEPLOYED", "VERIFIED",
]);

export const AUTHORITY_DISCLAIMER =
  "This Task Contract describes already-authorized scope. It does not itself grant authority, tool access, credentials, remote-resource access, merge approval, deployment approval, or risk acceptance (CORE-001, CORE-002). Satisfying this contract's acceptance criteria and evidence requirements does not certify task success or accept the task; that judgment belongs to the Architect/Paulo review that consumes this contract's evidence, not to the contract or its validator.";

const TOP_LEVEL_FIELDS = new Set([
  "contract_schema_version", "task_id", "title", "project", "change_class",
  "authorization_references", "requirement_references", "risk_references",
  "design_references", "scope", "acceptance_criteria", "claims", "authority_disclaimer",
]);
const REQUIRED_TOP_LEVEL_FIELDS = [
  "contract_schema_version", "task_id", "title", "project", "change_class",
  "authorization_references", "scope", "acceptance_criteria", "claims", "authority_disclaimer",
];
const SCOPE_FIELDS = new Set([
  "allowed_paths", "prohibited_paths", "prohibited_actions",
  "remote_resources_involved", "protected_main_or_deploy_in_scope",
  "production_write_in_scope", "credential_or_security_in_scope", "destructive_actions_in_scope",
]);
const REQUIRED_SCOPE_FIELDS = [
  "allowed_paths", "remote_resources_involved", "protected_main_or_deploy_in_scope",
  "production_write_in_scope", "credential_or_security_in_scope", "destructive_actions_in_scope",
];
const CONSEQUENCE_FLAGS = [
  "remote_resources_involved", "protected_main_or_deploy_in_scope",
  "production_write_in_scope", "credential_or_security_in_scope", "destructive_actions_in_scope",
];

const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const TASK_ID_RE = /^[A-Z][A-Z0-9_-]*$/;
const CRITERION_ID_RE = /^AC-[0-9]+$/;
const CLAIM_ID_RE = /^CLAIM-[0-9]+$/;

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}
function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function validateEvidenceArray(arr, label, fieldPath, errors) {
  if (!Array.isArray(arr)) {
    errors.push(`${label}: '${fieldPath}' must be an array`);
    return;
  }
  for (const ev of arr) {
    if (!EVIDENCE_CLASSES.has(ev)) errors.push(`${label}: invalid evidence class '${ev}' in '${fieldPath}'`);
  }
}

// ---------------------------------------------------------------------------
// Structural validation (mirrors task-contract.schema.json's declared shape).
// ---------------------------------------------------------------------------
export function validateContractSchema(contract) {
  const errors = [];
  const label = (contract && contract.task_id) || "(missing task_id)";

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ["contract must be a JSON object"] };
  }

  for (const key of Object.keys(contract)) {
    if (!TOP_LEVEL_FIELDS.has(key)) errors.push(`${label}: unknown field '${key}' (additionalProperties: false)`);
  }
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!Object.hasOwn(contract, field)) errors.push(`${label}: missing required field '${field}'`);
  }

  if (Object.hasOwn(contract, "contract_schema_version") && (typeof contract.contract_schema_version !== "string" || !SEMVER_RE.test(contract.contract_schema_version))) {
    errors.push(`${label}: 'contract_schema_version' must be a MAJOR.MINOR.PATCH semver string`);
  }
  if (Object.hasOwn(contract, "task_id") && (typeof contract.task_id !== "string" || contract.task_id.length < 3 || !TASK_ID_RE.test(contract.task_id))) {
    errors.push(`${label}: 'task_id' must match ^[A-Z][A-Z0-9_-]*$ and be at least 3 characters`);
  }
  for (const field of ["title", "project"]) {
    if (Object.hasOwn(contract, field) && !isNonEmptyString(contract[field])) errors.push(`${label}: '${field}' must be a non-empty string`);
  }
  if (Object.hasOwn(contract, "change_class") && !CHANGE_CLASSES.has(contract.change_class)) {
    errors.push(`${label}: invalid change_class '${contract.change_class}'`);
  }
  if (Object.hasOwn(contract, "authorization_references")) {
    if (!Array.isArray(contract.authorization_references) || contract.authorization_references.length === 0 || !isStringArray(contract.authorization_references)) {
      errors.push(`${label}: 'authorization_references' must be a non-empty array of strings`);
    }
  }
  for (const field of ["requirement_references", "risk_references", "design_references"]) {
    if (Object.hasOwn(contract, field) && !isStringArray(contract[field])) {
      errors.push(`${label}: '${field}' must be an array of strings`);
    }
  }

  // scope
  if (!isPlainObject(contract.scope)) {
    errors.push(`${label}: 'scope' must be an object`);
  } else {
    for (const key of Object.keys(contract.scope)) {
      if (!SCOPE_FIELDS.has(key)) errors.push(`${label}: unknown field 'scope.${key}' (additionalProperties: false)`);
    }
    for (const field of REQUIRED_SCOPE_FIELDS) {
      if (!Object.hasOwn(contract.scope, field)) errors.push(`${label}: missing required field 'scope.${field}'`);
    }
    if (Object.hasOwn(contract.scope, "allowed_paths") && (!Array.isArray(contract.scope.allowed_paths) || contract.scope.allowed_paths.length === 0 || !isStringArray(contract.scope.allowed_paths))) {
      errors.push(`${label}: 'scope.allowed_paths' must be a non-empty array of strings`);
    }
    for (const field of ["prohibited_paths", "prohibited_actions"]) {
      if (Object.hasOwn(contract.scope, field) && !isStringArray(contract.scope[field])) {
        errors.push(`${label}: 'scope.${field}' must be an array of strings`);
      }
    }
    for (const field of CONSEQUENCE_FLAGS) {
      if (Object.hasOwn(contract.scope, field) && typeof contract.scope[field] !== "boolean") {
        errors.push(`${label}: 'scope.${field}' must be boolean`);
      }
    }
  }

  // acceptance_criteria
  if (!Array.isArray(contract.acceptance_criteria) || contract.acceptance_criteria.length === 0) {
    errors.push(`${label}: 'acceptance_criteria' must be a non-empty array`);
  } else {
    const seenAc = new Set();
    for (const ac of contract.acceptance_criteria) {
      if (!isPlainObject(ac)) { errors.push(`${label}: each acceptance_criteria entry must be an object`); continue; }
      for (const key of Object.keys(ac)) {
        if (key !== "criterion_id" && key !== "statement") errors.push(`${label}: unknown field 'acceptance_criteria[].${key}'`);
      }
      if (typeof ac.criterion_id !== "string" || !CRITERION_ID_RE.test(ac.criterion_id)) {
        errors.push(`${label}: acceptance criterion_id '${ac.criterion_id}' must match ^AC-[0-9]+$`);
      } else if (seenAc.has(ac.criterion_id)) {
        errors.push(`${label}: duplicate acceptance criterion_id '${ac.criterion_id}'`);
      } else {
        seenAc.add(ac.criterion_id);
      }
      if (!isNonEmptyString(ac.statement)) errors.push(`${label}: acceptance criterion '${ac.criterion_id}' must have a non-empty statement`);
    }
  }

  // claims
  if (!Array.isArray(contract.claims) || contract.claims.length === 0) {
    errors.push(`${label}: 'claims' must be a non-empty array`);
  } else {
    const seenClaim = new Set();
    for (const claim of contract.claims) {
      if (!isPlainObject(claim)) { errors.push(`${label}: each claims entry must be an object`); continue; }
      for (const key of Object.keys(claim)) {
        if (!["claim_id", "claim_kind", "statement", "evidence"].includes(key)) errors.push(`${label}: unknown field 'claims[].${key}'`);
      }
      if (typeof claim.claim_id !== "string" || !CLAIM_ID_RE.test(claim.claim_id)) {
        errors.push(`${label}: claim_id '${claim.claim_id}' must match ^CLAIM-[0-9]+$`);
      } else if (seenClaim.has(claim.claim_id)) {
        errors.push(`${label}: duplicate claim_id '${claim.claim_id}'`);
      } else {
        seenClaim.add(claim.claim_id);
      }
      if (!CLAIM_KINDS.has(claim.claim_kind)) errors.push(`${label}: invalid claim_kind '${claim.claim_kind}' for '${claim.claim_id}'`);
      if (!isNonEmptyString(claim.statement)) errors.push(`${label}: claim '${claim.claim_id}' must have a non-empty statement`);
      if (!isPlainObject(claim.evidence)) {
        errors.push(`${label}: claim '${claim.claim_id}' must have an 'evidence' object`);
      } else {
        for (const key of Object.keys(claim.evidence)) {
          if (key !== "all_of" && key !== "any_of") errors.push(`${label}: unknown field 'claims[].evidence.${key}'`);
        }
        if (!Object.hasOwn(claim.evidence, "all_of")) errors.push(`${label}: claim '${claim.claim_id}' evidence missing 'all_of'`);
        else validateEvidenceArray(claim.evidence.all_of, label, `claims[${claim.claim_id}].evidence.all_of`, errors);
        if (!Object.hasOwn(claim.evidence, "any_of")) errors.push(`${label}: claim '${claim.claim_id}' evidence missing 'any_of'`);
        else validateEvidenceArray(claim.evidence.any_of, label, `claims[${claim.claim_id}].evidence.any_of`, errors);
      }
    }
  }

  // authority_disclaimer must match the fixed const exactly -- no instance may
  // soften, omit, or reword the non-authority boundary (AS38-F002).
  if (Object.hasOwn(contract, "authority_disclaimer") && contract.authority_disclaimer !== AUTHORITY_DISCLAIMER) {
    errors.push(`${label}: 'authority_disclaimer' must equal the fixed disclaimer text exactly (no instance may reword it)`);
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Semantic validation: CORE-016 (MAIN), CORE-017 (DEPLOYED), CORE-018
// (VERIFIED), CORE-020 (consequence-sensitive escalation). These are
// cross-field/policy constraints task-contract.schema.json cannot express.
// ---------------------------------------------------------------------------

// True if providing ONLY the evidence classes in `allowedSet` would satisfy
// this evidence requirement (all_of is a subset of allowedSet, and any_of is
// either empty or intersects allowedSet). Used to detect "can this claim be
// closed using nothing but the weak class" -- the fail-closed question both
// CORE-016 and CORE-020 ask.
function canCloseWithOnly(evidence, allowedSet) {
  const allOf = evidence.all_of || [];
  const anyOf = evidence.any_of || [];
  const allOfSubset = allOf.every((e) => allowedSet.has(e));
  const anyOfSatisfied = anyOf.length === 0 || anyOf.some((e) => allowedSet.has(e));
  return allOfSubset && anyOfSatisfied;
}

function includesSomewhere(evidence, cls) {
  return (evidence.all_of || []).includes(cls) || (evidence.any_of || []).includes(cls);
}

const ACTOR_REPORTED_ONLY = new Set(["ACTOR_REPORTED"]);

function validateMainClaim(claim, label, errors) {
  const ev = claim.evidence;
  if (canCloseWithOnly(ev, ACTOR_REPORTED_ONLY)) {
    errors.push(`${label}: claim '${claim.claim_id}' (MAIN) violates CORE-016 -- its evidence requirement can be closed using ACTOR_REPORTED alone; CORE-016 requires INDEPENDENTLY_REPRODUCED or CI_ATTESTED`);
  }
  if (!includesSomewhere(ev, "INDEPENDENTLY_REPRODUCED") && !includesSomewhere(ev, "CI_ATTESTED")) {
    errors.push(`${label}: claim '${claim.claim_id}' (MAIN) violates CORE-016 -- evidence must offer a path to INDEPENDENTLY_REPRODUCED or CI_ATTESTED`);
  }
  if ((ev.all_of || []).includes("RUNTIME_OBSERVED")) {
    errors.push(`${label}: claim '${claim.claim_id}' (MAIN) violates ML-DEVOS-RFC-013 -- RUNTIME_OBSERVED must not be required (all_of) merely for a MAIN claim; it cannot exist before deployment`);
  }
}

function validateDeployedClaim(claim, label, errors) {
  const ev = claim.evidence;
  if (!includesSomewhere(ev, "ACTOR_REPORTED") && !includesSomewhere(ev, "CI_ATTESTED")) {
    errors.push(`${label}: claim '${claim.claim_id}' (DEPLOYED) violates CORE-017 -- evidence must offer a path to ACTOR_REPORTED or CI_ATTESTED`);
  }
  if ((ev.all_of || []).includes("RUNTIME_OBSERVED")) {
    errors.push(`${label}: claim '${claim.claim_id}' (DEPLOYED) violates CORE-017 -- RUNTIME_OBSERVED belongs to the VERIFIED claim (CORE-018), not DEPLOYED; deployment evidence must not be silently treated as runtime verification`);
  }
}

function validateVerifiedClaim(claim, label, errors) {
  const ev = claim.evidence;
  if (!(ev.all_of || []).includes("RUNTIME_OBSERVED")) {
    errors.push(`${label}: claim '${claim.claim_id}' (VERIFIED) violates CORE-018 -- RUNTIME_OBSERVED must be an unconditional (all_of) requirement; no weaker evidence class satisfies a VERIFIED claim`);
  }
}

export function validateContractSemantics(contract) {
  const errors = [];
  const label = (contract && contract.task_id) || "(missing task_id)";
  if (!isPlainObject(contract) || !isPlainObject(contract.scope) || !Array.isArray(contract.claims)) {
    // Structural validation already reports this; semantic checks need a
    // well-shaped contract to run against.
    return { ok: false, errors: [`${label}: cannot run semantic checks against a structurally invalid contract`] };
  }

  const consequenceSensitive = CONSEQUENCE_FLAGS.some((f) => contract.scope[f] === true);

  for (const claim of contract.claims) {
    if (!isPlainObject(claim) || !isPlainObject(claim.evidence)) continue; // structural check already flags this

    if (!(claim.evidence.all_of || []).length && !(claim.evidence.any_of || []).length) {
      errors.push(`${label}: claim '${claim.claim_id}' has an empty evidence requirement (both all_of and any_of are empty) -- meaningless and trivially satisfies no closure discipline`);
      continue;
    }

    if (claim.claim_kind === "MAIN") validateMainClaim(claim, label, errors);
    if (claim.claim_kind === "DEPLOYED") validateDeployedClaim(claim, label, errors);
    if (claim.claim_kind === "VERIFIED") validateVerifiedClaim(claim, label, errors);

    // CORE-020: a consequence-sensitive contract must not let a claim close
    // solely on ACTOR_REPORTED -- EXCEPT for MAIN/DEPLOYED/VERIFIED claims,
    // where CORE-020's own text is explicit that "existing MAIN, DEPLOYED,
    // and VERIFIED evidence rules remain authoritative for those exact
    // claims" (i.e. CORE-016/017/018 above already govern them fully; CORE-017
    // deliberately allows ACTOR_REPORTED for DEPLOYED even here, so CORE-020
    // must not re-restrict it). CORE-020 reaches every OTHER claim kind
    // (IMPLEMENTATION_PRESENT, DOCUMENTATION_CORRECTNESS, TESTED_BEHAVIOR,
    // SECURITY_OR_TRUST_BOUNDARY) once the contract itself is consequence-sensitive.
    const hasOwnLifecycleRule = claim.claim_kind === "MAIN" || claim.claim_kind === "DEPLOYED" || claim.claim_kind === "VERIFIED";
    if (consequenceSensitive && !hasOwnLifecycleRule && canCloseWithOnly(claim.evidence, ACTOR_REPORTED_ONLY)) {
      errors.push(`${label}: claim '${claim.claim_id}' violates CORE-020 -- this contract is consequence-sensitive (remote/production/credential/destructive scope flag set), so no non-lifecycle claim may close solely on ACTOR_REPORTED evidence`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Combined validation. This function's `ok: true` result means "structurally
// and semantically valid as a Task Contract" -- it is never a task-acceptance
// result and grants no authority (see AUTHORITY_DISCLAIMER above).
// ---------------------------------------------------------------------------
export function validateTaskContract(contract) {
  const structural = validateContractSchema(contract);
  if (!structural.ok) return { ok: false, errors: structural.errors };
  const semantic = validateContractSemantics(contract);
  return { ok: structural.ok && semantic.ok, errors: [...structural.errors, ...semantic.errors] };
}

export function loadContract(filePath) {
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw); // fail-closed: throws on malformed JSON, no silent skipping
}

function walkExampleFiles(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkExampleFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".contract.json")) out.push(full);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  let failures = 0;
  let total = 0;

  if (args.length > 0) {
    for (const filePath of args) {
      total++;
      let contract;
      try {
        contract = loadContract(filePath);
      } catch (e) {
        console.log(`FAIL ${filePath}: (parse error) ${e.message}`);
        failures++;
        continue;
      }
      const { ok, errors } = validateTaskContract(contract);
      if (ok) {
        console.log(`PASS ${filePath}`);
      } else {
        failures++;
        console.log(`FAIL ${filePath}`);
        for (const e of errors) console.log(`  ERROR: ${e}`);
      }
    }
  } else {
    // No args: validate every bundled example against its own directory's
    // expectation (valid/ must pass, invalid/ must fail).
    const validFiles = walkExampleFiles(path.join(EXAMPLES_ROOT, "valid"));
    const invalidFiles = walkExampleFiles(path.join(EXAMPLES_ROOT, "invalid"));

    for (const filePath of validFiles) {
      total++;
      const { ok, errors } = validateTaskContract(loadContract(filePath));
      if (ok) {
        console.log(`PASS (expected valid)   ${filePath}`);
      } else {
        failures++;
        console.log(`FAIL (expected valid)   ${filePath}`);
        for (const e of errors) console.log(`  ERROR: ${e}`);
      }
    }
    for (const filePath of invalidFiles) {
      total++;
      const { ok, errors } = validateTaskContract(loadContract(filePath));
      if (!ok) {
        console.log(`PASS (expected invalid) ${filePath} -- correctly rejected:`);
        for (const e of errors) console.log(`  ${e}`);
      } else {
        failures++;
        console.log(`FAIL (expected invalid) ${filePath} -- was incorrectly accepted`);
      }
    }
  }

  console.log(`\n${failures === 0 ? "PASS" : "FAIL"}: ${total - failures}/${total} contract(s) behaved as expected.`);
  process.exit(failures === 0 ? 0 : 1);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
