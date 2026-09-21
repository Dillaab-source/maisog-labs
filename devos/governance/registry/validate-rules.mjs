#!/usr/bin/env node
// Static structural + semantic validator for devos/governance/rules/*.json rule registries.
//
// S1-F004 correction: the prior YAML representation used a hand-rolled, incomplete
// parser that silently skipped unsupported syntax. The registry is now JSON, read with
// the native, fail-closed `JSON.parse` -- any syntax error throws immediately and
// loudly, with no silent skipping possible.
//
// S1-F004 (remediation cycle 2): the prior version of THIS validator claimed to check
// "all required fields present, correctly typed" but actually left most of
// rule-record.schema.json's field-level constraints unenforced (regex patterns,
// minLength, nested object shapes, additionalProperties, date/semver formats, a
// missing/non-array top-level `rules`). This version enforces the schema's declared
// constraints directly against every rule record, field by field, so the validator's
// claims and the schema's declared shape do not silently diverge again.
//
// This is a governance-data lint tool only. It performs no runtime policy
// enforcement, is not wired into any CI/git hook, and is not invoked
// automatically by anything. Run manually:
//
//   node devos/governance/registry/validate-rules.mjs
//
// Zero third-party dependencies (Node builtins only) -- no package.json change,
// no new dependency surface.
//
// WHAT THIS VALIDATOR PROVES (see also the handoff's explicit "proves / does not
// prove" table):
//   - The registry file is a JSON object whose top-level `rules` field exists and is
//     an array (a missing/non-array `rules` is now a hard failure, not a silent
//     empty-list pass -- S1-F004).
//   - Every rule record has exactly the fields required/allowed by
//     rule-record.schema.json (`additionalProperties: false` is enforced -- an
//     unknown field is now a hard failure).
//   - Every field's type, and where declared, its regex pattern / minLength /
//     enum / date or semver format, matches the schema exactly: `rule_id`
//     (`^[A-Z][A-Z0-9]*-[0-9]{3}$`), `title`/`description`/`applies_when`/
//     `introduced_by` (non-empty string), `class`/`scope`/`risk`/`status`/evidence
//     enums, `authority` (object with exactly `owner`/`architect_sync_required`/
//     `paulo_approval_required`, correctly typed), `project`/`decision_id`/`adr_id`
//     (string or null), `effective_version`/`proposed_effective_version` (null or
//     `MAJOR.MINOR.PATCH`), `created_at`/`updated_at` (`YYYY-MM-DD`), `waivable`
//     (boolean), `supersedes` (string or null), `requires` (object with exactly
//     `evidence`/`evidence_note`/`qa`/`independent_review`/`evidence_gate`, each
//     correctly typed; `requires.evidence` is an object with exactly `all_of`/
//     `any_of`, each an array of valid evidence-class enum values -- S1-F002).
//   - `scope`/`project` are mutually consistent: `sentinel-wide` requires
//     `project: null`; `project` scope requires a non-null `project` string.
//   - No two rules in the same file share a rule_id.
//   - Every non-null `supersedes` value points at a rule_id that actually exists.
//   - Every rule's authority/risk metadata meets or exceeds its class's minimum
//     (S1-F001) -- never below, only at-or-above is accepted.
//   - status/effective_version/proposed_effective_version are mutually consistent
//     (S1-F007): PROPOSED rules have effective_version: null and a non-null
//     proposed_effective_version; ACTIVE/SUPERSEDED/WAIVED/REJECTED rules have a
//     non-null effective_version and a null proposed_effective_version.
//
// WHAT THIS VALIDATOR DOES NOT PROVE:
//   - It does not check whether a rule's prose `description` accurately reflects
//     its cited S0/AS0/D-0NN source -- that is Architect/human review.
//   - It does not check cross-file consistency against project-scoped rule files,
//     against actual waiver instances (see validate-waivers.mjs for that), or
//     against the human-readable CHANGE_GOVERNANCE_POLICY.md prose.
//   - It does not enforce anything at runtime -- it is a one-shot, manually
//     invoked lint pass over static files, nothing more.
//   - It does not verify that `introduced_by`/`decision_id` citations actually
//     exist in brain/DECISION_LOG.md or coordination/ARCHITECT_REVIEW.md -- it
//     only checks that the fields are present and correctly typed/formatted.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.join(HERE, "..", "rules");

const CLASSES = new Set(["PATCH", "LOCAL_RULE", "CORE_POLICY", "CAPABILITY", "ARCHITECTURE", "CONSTITUTIONAL", "WAIVER", "PROJECT_ONBOARDING"]);
const SCOPES = new Set(["sentinel-wide", "project"]);
const RISKS = ["low", "medium", "high", "highest"]; // ordered, index = rank
const RISK_RANK = Object.fromEntries(RISKS.map((r, i) => [r, i]));
const STATUSES = new Set(["ACTIVE", "SUPERSEDED", "WAIVED", "PROPOSED", "REJECTED"]);
const EVIDENCE_CLASSES = new Set(["ACTOR_REPORTED", "INDEPENDENTLY_INSPECTED", "INDEPENDENTLY_REPRODUCED", "CI_ATTESTED", "RUNTIME_OBSERVED"]);

const RULE_ID_RE = /^[A-Z][A-Z0-9]*-[0-9]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;

// S1-F001: class-level MINIMUM authority/risk invariants. A rule may be stricter
// (higher risk rank, more `true` flags) than its class minimum; it may never be
// weaker. These floors are derived from devos/governance/change-policy/
// CHANGE_GOVERNANCE_POLICY.md §1's authority/risk columns.
const CLASS_MINIMUMS = {
  PATCH:              { minRisk: "low",    architect_sync_required: false, paulo_approval_required: false },
  LOCAL_RULE:         { minRisk: "low",    architect_sync_required: false, paulo_approval_required: false },
  CORE_POLICY:        { minRisk: "medium", architect_sync_required: true,  paulo_approval_required: true },
  CAPABILITY:         { minRisk: "medium", architect_sync_required: false, paulo_approval_required: true },
  ARCHITECTURE:       { minRisk: "high",   architect_sync_required: true,  paulo_approval_required: true },
  CONSTITUTIONAL:     { minRisk: "highest",architect_sync_required: true,  paulo_approval_required: true },
  WAIVER:             { minRisk: "low",    architect_sync_required: false, paulo_approval_required: true },
  PROJECT_ONBOARDING: { minRisk: "medium", architect_sync_required: true,  paulo_approval_required: true },
};

const TOP_LEVEL_FIELDS = new Set([
  "rule_id", "title", "description", "class", "scope", "project", "risk",
  "status", "authority", "applies_when", "waivable", "requires", "exceptions",
  "introduced_by", "decision_id", "adr_id", "effective_version",
  "proposed_effective_version", "supersedes", "created_at", "updated_at",
]);
const REQUIRED_FIELDS = [
  "rule_id", "title", "description", "class", "scope", "project", "risk",
  "status", "authority", "applies_when", "waivable", "introduced_by",
  "decision_id", "adr_id", "effective_version", "proposed_effective_version",
  "supersedes", "created_at", "updated_at",
];
const AUTHORITY_FIELDS = new Set(["owner", "architect_sync_required", "paulo_approval_required"]);
const REQUIRES_FIELDS = new Set(["evidence", "evidence_note", "qa", "independent_review", "evidence_gate"]);
const EVIDENCE_FIELDS = new Set(["all_of", "any_of"]);

function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
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

function validateRule(rule, label, allIds, errors) {
  // additionalProperties: false at the top level.
  for (const key of Object.keys(rule)) {
    if (!TOP_LEVEL_FIELDS.has(key)) errors.push(`${label}: unknown field '${key}' (additionalProperties: false)`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(rule, field)) errors.push(`${label}: missing required field '${field}'`);
  }

  if (rule.rule_id !== undefined && !RULE_ID_RE.test(String(rule.rule_id))) {
    errors.push(`${label}: rule_id '${rule.rule_id}' does not match ^[A-Z][A-Z0-9]*-[0-9]{3}$`);
  }
  for (const field of ["title", "description", "applies_when", "introduced_by"]) {
    if (Object.hasOwn(rule, field) && !isNonEmptyString(rule[field])) {
      errors.push(`${label}: '${field}' must be a non-empty string`);
    }
  }

  if (rule.class !== undefined && !CLASSES.has(rule.class)) errors.push(`${label}: invalid class '${rule.class}'`);
  if (rule.scope !== undefined && !SCOPES.has(rule.scope)) errors.push(`${label}: invalid scope '${rule.scope}'`);
  if (rule.risk !== undefined && !(rule.risk in RISK_RANK)) errors.push(`${label}: invalid risk '${rule.risk}'`);
  if (rule.status !== undefined && !STATUSES.has(rule.status)) errors.push(`${label}: invalid status '${rule.status}'`);

  // project / scope consistency.
  if (Object.hasOwn(rule, "project")) {
    if (rule.project !== null && typeof rule.project !== "string") errors.push(`${label}: 'project' must be a string or null`);
    if (rule.scope === "sentinel-wide" && rule.project !== null) errors.push(`${label}: scope 'sentinel-wide' requires project: null (found '${rule.project}')`);
    if (rule.scope === "project" && (rule.project === null || rule.project === undefined || rule.project === "")) {
      errors.push(`${label}: scope 'project' requires a non-null, non-empty project`);
    }
  }

  if (typeof rule.waivable !== "boolean") errors.push(`${label}: 'waivable' must be boolean`);

  // authority object.
  if (!isPlainObject(rule.authority)) {
    errors.push(`${label}: missing/invalid authority object`);
  } else {
    for (const key of Object.keys(rule.authority)) {
      if (!AUTHORITY_FIELDS.has(key)) errors.push(`${label}: unknown field 'authority.${key}' (additionalProperties: false)`);
    }
    if (!isNonEmptyString(rule.authority.owner)) errors.push(`${label}: 'authority.owner' must be a non-empty string`);
    if (typeof rule.authority.architect_sync_required !== "boolean") errors.push(`${label}: 'authority.architect_sync_required' must be boolean`);
    if (typeof rule.authority.paulo_approval_required !== "boolean") errors.push(`${label}: 'authority.paulo_approval_required' must be boolean`);
  }

  // requires object (optional at top level, but if present must conform).
  if (Object.hasOwn(rule, "requires")) {
    if (!isPlainObject(rule.requires)) {
      errors.push(`${label}: 'requires' must be an object`);
    } else {
      for (const key of Object.keys(rule.requires)) {
        if (!REQUIRES_FIELDS.has(key)) errors.push(`${label}: unknown field 'requires.${key}' (additionalProperties: false)`);
      }
      if (Object.hasOwn(rule.requires, "evidence")) {
        const ev = rule.requires.evidence;
        if (!isPlainObject(ev)) {
          errors.push(`${label}: 'requires.evidence' must be an object with 'all_of'/'any_of' (S1-F002)`);
        } else {
          for (const key of Object.keys(ev)) {
            if (!EVIDENCE_FIELDS.has(key)) errors.push(`${label}: unknown field 'requires.evidence.${key}' (additionalProperties: false)`);
          }
          if (!Object.hasOwn(ev, "all_of")) errors.push(`${label}: 'requires.evidence.all_of' is required`);
          else validateEvidenceArray(ev.all_of, label, "requires.evidence.all_of", errors);
          if (!Object.hasOwn(ev, "any_of")) errors.push(`${label}: 'requires.evidence.any_of' is required`);
          else validateEvidenceArray(ev.any_of, label, "requires.evidence.any_of", errors);
        }
      }
      if (Object.hasOwn(rule.requires, "evidence_note") && typeof rule.requires.evidence_note !== "string") {
        errors.push(`${label}: 'requires.evidence_note' must be a string`);
      }
      for (const field of ["qa", "independent_review", "evidence_gate"]) {
        if (Object.hasOwn(rule.requires, field) && typeof rule.requires[field] !== "boolean") {
          errors.push(`${label}: 'requires.${field}' must be boolean`);
        }
      }
    }
  }

  if (Object.hasOwn(rule, "exceptions")) {
    if (!Array.isArray(rule.exceptions) || rule.exceptions.some((e) => typeof e !== "string")) {
      errors.push(`${label}: 'exceptions' must be an array of strings`);
    }
  }

  for (const field of ["decision_id", "adr_id", "supersedes"]) {
    if (Object.hasOwn(rule, field) && rule[field] !== null && typeof rule[field] !== "string") {
      errors.push(`${label}: '${field}' must be a string or null`);
    }
  }

  for (const field of ["effective_version", "proposed_effective_version"]) {
    if (Object.hasOwn(rule, field) && rule[field] !== null) {
      if (typeof rule[field] !== "string" || !SEMVER_RE.test(rule[field])) {
        errors.push(`${label}: '${field}' must be null or a MAJOR.MINOR.PATCH semver string (found '${rule[field]}')`);
      }
    }
  }

  for (const field of ["created_at", "updated_at"]) {
    if (Object.hasOwn(rule, field) && (typeof rule[field] !== "string" || !DATE_RE.test(rule[field]))) {
      errors.push(`${label}: '${field}' must be a YYYY-MM-DD date string (found '${rule[field]}')`);
    }
  }

  if (rule.rule_id) {
    if (allIds.__seen.has(rule.rule_id)) errors.push(`${rule.rule_id}: duplicate rule_id`);
    else allIds.__seen.add(rule.rule_id);
  } else {
    errors.push("(unknown): missing rule_id");
  }

  if (rule.supersedes && !allIds.has(rule.supersedes)) {
    errors.push(`${label}: supersedes references unknown rule_id '${rule.supersedes}'`);
  }

  // S1-F001: class-level minimum authority/risk invariant check.
  if (rule.class && rule.class in CLASS_MINIMUMS && isPlainObject(rule.authority)) {
    const floor = CLASS_MINIMUMS[rule.class];
    if (rule.risk in RISK_RANK && RISK_RANK[rule.risk] < RISK_RANK[floor.minRisk]) {
      errors.push(`${label}: risk '${rule.risk}' is below the ${rule.class} class minimum '${floor.minRisk}'`);
    }
    if (floor.architect_sync_required && rule.authority.architect_sync_required !== true) {
      errors.push(`${label}: authority.architect_sync_required must be true for class ${rule.class} (class minimum)`);
    }
    if (floor.paulo_approval_required && rule.authority.paulo_approval_required !== true) {
      errors.push(`${label}: authority.paulo_approval_required must be true for class ${rule.class} (class minimum)`);
    }
  }

  // S1-F007: status vs. version-field consistency.
  if (rule.status === "PROPOSED") {
    if (rule.effective_version !== null) errors.push(`${label}: status PROPOSED requires effective_version: null (found '${rule.effective_version}')`);
    if (!rule.proposed_effective_version) errors.push(`${label}: status PROPOSED requires a non-null proposed_effective_version`);
  } else if (["ACTIVE", "SUPERSEDED", "WAIVED", "REJECTED"].includes(rule.status)) {
    if (!rule.effective_version) errors.push(`${label}: status ${rule.status} requires a non-null effective_version`);
    if (rule.proposed_effective_version !== null && rule.proposed_effective_version !== undefined) {
      errors.push(`${label}: status ${rule.status} must have proposed_effective_version: null (found '${rule.proposed_effective_version}')`);
    }
  }
}

function validateRegistry(filePath) {
  const raw = readFileSync(filePath, "utf8");
  let doc;
  try {
    doc = JSON.parse(raw); // fail-closed: throws on any malformed JSON, no silent skipping
  } catch (e) {
    return { rules: [], errors: [`(parse error) ${filePath}: ${e.message}`] };
  }

  // S1-F004 (cycle 2): a missing or non-array top-level `rules` is now a hard
  // failure, not a silent empty-list pass.
  if (!isPlainObject(doc) || !Object.hasOwn(doc, "rules") || !Array.isArray(doc.rules)) {
    return { rules: [], errors: [`${filePath}: top-level 'rules' field must exist and be an array`] };
  }

  const rules = doc.rules;
  const errors = [];
  const allIds = new Set(rules.map((r) => r && r.rule_id).filter(Boolean));
  allIds.__seen = new Set();

  for (const rule of rules) {
    const label = (rule && rule.rule_id) || "(missing rule_id)";
    if (!isPlainObject(rule)) {
      errors.push(`${label}: rule entry must be an object`);
      continue;
    }
    validateRule(rule, label, allIds, errors);
  }
  return { rules, errors };
}

function main() {
  const files = readdirSync(RULES_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log(`No rule registry files found in ${RULES_DIR}`);
    process.exit(0);
  }
  let totalErrors = 0;
  for (const file of files) {
    const full = path.join(RULES_DIR, file);
    const { rules, errors } = validateRegistry(full);
    console.log(`\n${file}: ${rules.length} rule(s) parsed`);
    if (errors.length === 0) {
      console.log("  OK — no structural or class-minimum issues found.");
    } else {
      totalErrors += errors.length;
      for (const e of errors) console.log(`  ERROR: ${e}`);
    }
  }
  console.log(`\n${totalErrors === 0 ? "PASS" : "FAIL"}: ${totalErrors} error(s) across ${files.length} file(s).`);
  process.exit(totalErrors === 0 ? 0 : 1);
}

main();
