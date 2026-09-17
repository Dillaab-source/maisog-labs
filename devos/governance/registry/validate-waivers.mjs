#!/usr/bin/env node
// Static structural + semantic validator for devos/changes/waivers/*.json waiver
// instances. Introduced in S1 remediation cycle 1 (S1-F003): the waiver template
// claimed a validator enforced mandatory expiry, but no such validator existed --
// validate-rules.mjs only ever scanned devos/governance/rules/, never
// devos/changes/waivers/. This script closes that gap honestly rather than
// leaving the false claim in place.
//
// This is a governance-data lint tool only. Zero third-party dependencies, not
// wired into CI or any git hook. Run manually:
//
//   node devos/governance/registry/validate-waivers.mjs
//
// WHAT THIS VALIDATOR PROVES:
//   - Every waiver file parses as valid JSON (fail-closed).
//   - Every waiver record has all fields required by waiver-record.schema.json.
//   - `expires_at` is present and strictly after `issued_at` -- no permanent or
//     backdated-to-never-expire waivers are possible.
//   - `rule_waived` references a rule_id that actually exists in the current
//     core rule registry (../rules/*.json).
//   - The referenced rule's `waivable` field is `true` -- a waiver against a
//     rule marked `waivable: false` is rejected outright (S1-F003).
//   - `risk`/`status` use only allowed enum values.
//
// WHAT THIS VALIDATOR DOES NOT PROVE:
//   - It does not check that `compensating_controls` actually mitigate the risk
//     -- that is Architect/Paulo judgment.
//   - It does not check that `approver` is actually authorized at the target
//     rule's authority level -- that is a human/process check, not automatable
//     from static text alone in S1.
//   - It does not expire a waiver automatically -- flipping `status` to
//     `EXPIRED` once `expires_at` passes is a manual (or future, separately
//     authorized) act, not performed by this script.
//   - It enforces nothing at runtime.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WAIVERS_DIR = path.join(HERE, "..", "..", "changes", "waivers");
const RULES_DIR = path.join(HERE, "..", "rules");

const RISKS = new Set(["low", "medium", "high", "highest"]);
const STATUSES = new Set(["ACTIVE", "EXPIRED", "REVOKED"]);
const REQUIRED_FIELDS = [
  "waiver_id", "rule_waived", "scope", "reason", "risk", "approver",
  "issued_at", "expires_at", "compensating_controls", "evidence", "status",
];

function loadRuleIndex() {
  const index = new Map(); // rule_id -> { waivable }
  if (!existsSync(RULES_DIR)) return index;
  for (const file of readdirSync(RULES_DIR).filter((f) => f.endsWith(".json"))) {
    try {
      const doc = JSON.parse(readFileSync(path.join(RULES_DIR, file), "utf8"));
      for (const rule of doc.rules || []) {
        if (rule && rule.rule_id) index.set(rule.rule_id, { waivable: rule.waivable === true });
      }
    } catch {
      // A broken rule registry is validate-rules.mjs's problem to report; this
      // script simply can't cross-check against it and proceeds with what parsed.
    }
  }
  return index;
}

function validateWaiverFile(filePath, ruleIndex) {
  const raw = readFileSync(filePath, "utf8");
  let waiver;
  try {
    waiver = JSON.parse(raw);
  } catch (e) {
    return [`(parse error) ${filePath}: ${e.message}`];
  }
  const errors = [];
  const label = waiver.waiver_id || path.basename(filePath);

  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(waiver, field)) errors.push(`${label}: missing required field '${field}'`);
  }
  if (waiver.risk && !RISKS.has(waiver.risk)) errors.push(`${label}: invalid risk '${waiver.risk}'`);
  if (waiver.status && !STATUSES.has(waiver.status)) errors.push(`${label}: invalid status '${waiver.status}'`);

  if (!waiver.expires_at) {
    errors.push(`${label}: MANDATORY expires_at is missing -- no permanent silent exceptions are allowed`);
  } else if (waiver.issued_at && !(new Date(waiver.expires_at) > new Date(waiver.issued_at))) {
    errors.push(`${label}: expires_at ('${waiver.expires_at}') must be strictly after issued_at ('${waiver.issued_at}')`);
  }

  if (waiver.rule_waived) {
    const target = ruleIndex.get(waiver.rule_waived);
    if (!target) {
      errors.push(`${label}: rule_waived '${waiver.rule_waived}' does not exist in the current rule registry`);
    } else if (!target.waivable) {
      errors.push(`${label}: rule_waived '${waiver.rule_waived}' is marked waivable: false -- it cannot be the target of a waiver (S1-F003)`);
    }
  }
  return errors;
}

function main() {
  const ruleIndex = loadRuleIndex();
  if (!existsSync(WAIVERS_DIR)) {
    console.log(`No waivers directory found at ${WAIVERS_DIR}`);
    process.exit(0);
  }
  const files = readdirSync(WAIVERS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log(`No waiver instance files (*.json) found in ${WAIVERS_DIR}. This is expected -- no waiver has been filed as of this cycle.`);
    process.exit(0);
  }
  let totalErrors = 0;
  for (const file of files) {
    const errors = validateWaiverFile(path.join(WAIVERS_DIR, file), ruleIndex);
    console.log(`\n${file}:`);
    if (errors.length === 0) console.log("  OK — no structural issues found.");
    else { totalErrors += errors.length; for (const e of errors) console.log(`  ERROR: ${e}`); }
  }
  console.log(`\n${totalErrors === 0 ? "PASS" : "FAIL"}: ${totalErrors} error(s) across ${files.length} file(s).`);
  process.exit(totalErrors === 0 ? 0 : 1);
}

main();
