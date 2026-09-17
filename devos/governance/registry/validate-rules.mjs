#!/usr/bin/env node
// Static structural + semantic validator for devos/governance/rules/*.json rule registries.
//
// S1-F004 correction: the prior version used a hand-rolled, incomplete YAML subset
// parser that silently skipped unsupported syntax. This version reads the canonical
// JSON registry with the native, fail-closed `JSON.parse` -- any syntax error throws
// immediately and loudly, with no silent skipping possible.
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
//   - Every rule file parses as valid JSON (fail-closed: a syntax error stops
//     everything with a non-zero exit, nothing is silently skipped).
//   - Every rule record has all fields required by rule-record.schema.json.
//   - Every enum-valued field (class/scope/risk/status/evidence) uses only an
//     allowed value.
//   - No two rules in the same file share a rule_id.
//   - Every non-null `supersedes` value points at a rule_id that actually exists.
//   - Every rule's authority/risk metadata meets or exceeds its class's minimum
//     (S1-F001) -- never below, only at-or-above is accepted.
//   - status/effective_version/proposed_effective_version are mutually consistent
//     (S1-F007): PROPOSED rules have effective_version: null and a non-null
//     proposed_effective_version; ACTIVE/SUPERSEDED/WAIVED/REJECTED rules have a
//     non-null effective_version and a null proposed_effective_version.
//   - `waivable` is present and boolean on every rule (S1-F003).
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
//     only checks that the fields are present and correctly typed.

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

const REQUIRED_FIELDS = [
  "rule_id", "title", "description", "class", "scope", "project", "risk",
  "status", "authority", "applies_when", "waivable", "introduced_by",
  "decision_id", "adr_id", "effective_version", "proposed_effective_version",
  "supersedes", "created_at", "updated_at",
];

function validateRegistry(filePath) {
  const raw = readFileSync(filePath, "utf8");
  let doc;
  try {
    doc = JSON.parse(raw); // fail-closed: throws on any malformed JSON, no silent skipping
  } catch (e) {
    return { rules: [], errors: [`(parse error) ${filePath}: ${e.message}`] };
  }
  const rules = Array.isArray(doc.rules) ? doc.rules : [];
  const errors = [];
  const seenIds = new Set();
  const allIds = new Set(rules.map((r) => r && r.rule_id).filter(Boolean));

  for (const rule of rules) {
    const label = (rule && rule.rule_id) || "(missing rule_id)";

    for (const field of REQUIRED_FIELDS) {
      if (field === "authority") {
        if (!rule.authority || typeof rule.authority !== "object") errors.push(`${label}: missing authority object`);
        continue;
      }
      if (!Object.hasOwn(rule, field)) errors.push(`${label}: missing required field '${field}'`);
    }

    if (!rule.rule_id) errors.push("(unknown): missing rule_id");
    else if (seenIds.has(rule.rule_id)) errors.push(`${rule.rule_id}: duplicate rule_id`);
    else seenIds.add(rule.rule_id);

    if (rule.class && !CLASSES.has(rule.class)) errors.push(`${label}: invalid class '${rule.class}'`);
    if (rule.scope && !SCOPES.has(rule.scope)) errors.push(`${label}: invalid scope '${rule.scope}'`);
    if (rule.risk && !(rule.risk in RISK_RANK)) errors.push(`${label}: invalid risk '${rule.risk}'`);
    if (rule.status && !STATUSES.has(rule.status)) errors.push(`${label}: invalid status '${rule.status}'`);
    if (typeof rule.waivable !== "boolean") errors.push(`${label}: 'waivable' must be boolean`);

    if (rule.requires && Array.isArray(rule.requires.evidence)) {
      for (const ev of rule.requires.evidence) {
        if (!EVIDENCE_CLASSES.has(ev)) errors.push(`${label}: invalid evidence class '${ev}' in requires.evidence`);
      }
    }

    if (rule.supersedes && !allIds.has(rule.supersedes)) {
      errors.push(`${label}: supersedes references unknown rule_id '${rule.supersedes}'`);
    }

    // S1-F001: class-level minimum authority/risk invariant check.
    if (rule.class && rule.class in CLASS_MINIMUMS && rule.authority) {
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
