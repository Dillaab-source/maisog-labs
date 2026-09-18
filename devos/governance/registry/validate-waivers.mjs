#!/usr/bin/env node
// Static structural + semantic validator for devos/changes/waivers/*.json waiver
// instances. Introduced in S1 remediation cycle 1 (S1-F003): the waiver template
// claimed a validator enforced mandatory expiry, but no such validator existed --
// validate-rules.mjs only ever scanned devos/governance/rules/, never
// devos/changes/waivers/. This script closes that gap honestly rather than
// leaving the false claim in place.
//
// S1-F003 (remediation cycle 2): two gaps the Architect found in cycle 1 are
// closed here:
//   1. A waiver record did not structurally bind to the target rule's own
//      required authority -- an arbitrary non-empty `approver` string passed even
//      against a CONSTITUTIONAL/CORE_POLICY-class rule. This version cross-checks
//      the target rule's `authority.paulo_approval_required` /
//      `authority.architect_sync_required` fields and requires the corresponding
//      `paulo_decision_ref` / `architect_sync_ref` field to be present and
//      non-empty on the waiver record when the target rule demands it.
//   2. `expires_at` was checked only for ordering against `issued_at`; an `ACTIVE`
//      waiver whose expiry date had already passed was not rejected. This version
//      makes expiry authoritative: status text alone can never keep an expired
//      waiver in effect.
//
// S1-F004 (remediation cycle 2): `loadRuleIndex()` previously swallowed a broken
// rule registry with a bare `catch {}` and continued with whatever partially
// parsed (or an empty index). This version is fail-closed: if any rule registry
// file cannot be parsed as valid JSON, or does not have a top-level array `rules`
// field, waiver validation ABORTS with a non-zero exit and reports the parse
// failure -- it does not proceed with a partial or empty index.
//
// S1-F004 (remediation cycle 3, FINAL): the cycle-1/2 versions of this validator
// only checked a subset of waiver-record.schema.json -- required-field presence,
// expiry ordering/authority, and the two enum fields -- while
// devos/changes/waivers/README.md claimed every waiver record "conforms to
// waiver-record.schema.json" and "is actually validated" by this script. That
// claim was not true: a waiver could carry an unknown extra property, a
// malformed `waiver_id`/`rule_waived`, an empty `scope`/`reason`/`approver`/
// `compensating_controls`, a non-YYYY-MM-DD date, a non-array or wrongly-typed
// `evidence`, or a present-but-invalid `paulo_decision_ref`/`architect_sync_ref`
// and still pass. This version enforces the full declared static shape --
// pattern, non-empty-string, date-shape, array/enum-membership, and
// additionalProperties constraints -- so the validator's claims and the
// schema's declared shape do not silently diverge, matching the same standard
// already applied to validate-rules.mjs in cycle 2 (S1-F004).
//
// This is a governance-data lint tool only. Zero third-party dependencies, not
// wired into CI or any git hook. Run manually:
//
//   node devos/governance/registry/validate-waivers.mjs
//
// WHAT THIS VALIDATOR PROVES:
//   - Every waiver file parses as valid JSON (fail-closed).
//   - Every waiver record has exactly the fields waiver-record.schema.json
//     requires/allows -- `additionalProperties: false` is enforced; an unknown
//     field is a hard failure.
//   - `waiver_id` matches `^ML-DEVOS-WAIVER-[0-9]{3}$`; `rule_waived` matches
//     `^[A-Z][A-Z0-9]*-[0-9]{3}$` (in addition to the existence/waivable checks
//     below, which are semantic, not shape, checks).
//   - `scope`, `reason`, `approver`, `compensating_controls` are non-empty
//     strings (`minLength: 1`).
//   - `issued_at`/`expires_at` are exact `YYYY-MM-DD` date strings.
//   - `evidence` is an array whose every member is one of `ACTOR_REPORTED`,
//     `INDEPENDENTLY_INSPECTED`, `INDEPENDENTLY_REPRODUCED`, `CI_ATTESTED`,
//     `RUNTIME_OBSERVED`.
//   - `risk`/`status` use only allowed enum values.
//   - `paulo_decision_ref`/`architect_sync_ref`, if present at all (whether or
//     not the target rule's authority makes them mandatory), satisfy the
//     schema's `type: string, minLength: 1` constraint -- a present-but-empty
//     or non-string reference field is rejected even when not itself required.
//   - `expires_at` is present and strictly after `issued_at` -- no permanent or
//     backdated-to-never-expire waivers are possible.
//   - `expires_at` is authoritative over `status`: an `ACTIVE` waiver whose
//     expiry date has already passed (relative to wall-clock time when this
//     script is run) is rejected, regardless of what `status` claims (S1-F003).
//   - `rule_waived` references a rule_id that actually exists in the current
//     core rule registry (../rules/*.json), and this check is fail-closed: if
//     the rule registry itself cannot be parsed, validation aborts rather than
//     silently treating every reference as unresolvable or skipping the check
//     (S1-F004).
//   - The referenced rule's `waivable` field is `true` -- a waiver against a
//     rule marked `waivable: false` is rejected outright (S1-F003).
//   - The waiver structurally binds to the referenced rule's own authority
//     requirements: `paulo_decision_ref` is required (non-empty) when the rule's
//     `authority.paulo_approval_required` is true; `architect_sync_ref` is
//     required (non-empty) when the rule's `authority.architect_sync_required`
//     is true (S1-F003).
//
// WHAT THIS VALIDATOR DOES NOT PROVE:
//   - It does not check that `compensating_controls` actually mitigate the risk
//     -- that is Architect/Paulo judgment.
//   - It does not check that `approver`, `paulo_decision_ref`, or
//     `architect_sync_ref` refer to a REAL, genuine decision/sync record --  it
//     only checks that the required reference field is present, non-empty, and
//     correctly typed when the target rule's authority demands it (or, if
//     present without being required, that it is still correctly typed).
//     Verifying the cited record actually exists and says what the waiver
//     claims is a human/process check.
//   - It does not flip `status` to `EXPIRED` in the file itself once `expires_at`
//     passes -- it only refuses to treat a past-expiry `ACTIVE` waiver as valid
//     on this run. Updating the stored `status` remains a manual (or future,
//     separately authorized) act.
//   - It does not check `issued_at`/`expires_at` are real calendar dates (e.g.
//     `2026-02-30`) beyond the `YYYY-MM-DD` shape -- `Date` parsing is used only
//     for the ordering/expiry comparisons, not as a calendar-validity check.
//   - It enforces nothing at runtime.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WAIVERS_DIR = path.join(HERE, "..", "..", "changes", "waivers");
const RULES_DIR = path.join(HERE, "..", "rules");

const RISKS = new Set(["low", "medium", "high", "highest"]);
const STATUSES = new Set(["ACTIVE", "EXPIRED", "REVOKED"]);
const EVIDENCE_CLASSES = new Set(["ACTOR_REPORTED", "INDEPENDENTLY_INSPECTED", "INDEPENDENTLY_REPRODUCED", "CI_ATTESTED", "RUNTIME_OBSERVED"]);
const REQUIRED_FIELDS = [
  "waiver_id", "rule_waived", "scope", "reason", "risk", "approver",
  "issued_at", "expires_at", "compensating_controls", "evidence", "status",
];
const ALLOWED_FIELDS = new Set([
  ...REQUIRED_FIELDS, "paulo_decision_ref", "architect_sync_ref",
]);

const WAIVER_ID_RE = /^ML-DEVOS-WAIVER-[0-9]{3}$/;
const RULE_ID_RE = /^[A-Z][A-Z0-9]*-[0-9]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

// S1-F004: fail-closed. Throws (never silently returns a partial/empty index)
// if any registry file is missing a valid, array-shaped top-level `rules` field.
function loadRuleIndex() {
  const index = new Map(); // rule_id -> { waivable, authority }
  if (!existsSync(RULES_DIR)) {
    throw new Error(`rule registry directory not found at ${RULES_DIR}`);
  }
  const files = readdirSync(RULES_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const full = path.join(RULES_DIR, file);
    let doc;
    try {
      doc = JSON.parse(readFileSync(full, "utf8"));
    } catch (e) {
      throw new Error(`rule registry '${full}' failed to parse: ${e.message}`);
    }
    if (!isPlainObject(doc) || !Array.isArray(doc.rules)) {
      throw new Error(`rule registry '${full}' has no valid top-level 'rules' array`);
    }
    for (const rule of doc.rules) {
      if (rule && rule.rule_id) {
        index.set(rule.rule_id, {
          waivable: rule.waivable === true,
          authority: isPlainObject(rule.authority) ? rule.authority : {},
        });
      }
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
  if (!isPlainObject(waiver)) {
    return [`${path.basename(filePath)}: waiver record must be an object`];
  }

  const errors = [];
  const label = waiver.waiver_id || path.basename(filePath);

  // additionalProperties: false.
  for (const key of Object.keys(waiver)) {
    if (!ALLOWED_FIELDS.has(key)) errors.push(`${label}: unknown field '${key}' (additionalProperties: false)`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(waiver, field)) errors.push(`${label}: missing required field '${field}'`);
  }

  if (Object.hasOwn(waiver, "waiver_id") && !WAIVER_ID_RE.test(String(waiver.waiver_id))) {
    errors.push(`${label}: waiver_id '${waiver.waiver_id}' does not match ^ML-DEVOS-WAIVER-[0-9]{3}$`);
  }
  if (Object.hasOwn(waiver, "rule_waived") && !RULE_ID_RE.test(String(waiver.rule_waived))) {
    errors.push(`${label}: rule_waived '${waiver.rule_waived}' does not match ^[A-Z][A-Z0-9]*-[0-9]{3}$`);
  }
  for (const field of ["scope", "reason", "approver", "compensating_controls"]) {
    if (Object.hasOwn(waiver, field) && !isNonEmptyString(waiver[field])) {
      errors.push(`${label}: '${field}' must be a non-empty string`);
    }
  }

  if (Object.hasOwn(waiver, "risk") && !RISKS.has(waiver.risk)) errors.push(`${label}: invalid risk '${waiver.risk}'`);
  if (Object.hasOwn(waiver, "status") && !STATUSES.has(waiver.status)) errors.push(`${label}: invalid status '${waiver.status}'`);

  for (const field of ["issued_at", "expires_at"]) {
    if (Object.hasOwn(waiver, field) && (typeof waiver[field] !== "string" || !DATE_RE.test(waiver[field]))) {
      errors.push(`${label}: '${field}' must be a YYYY-MM-DD date string (found '${waiver[field]}')`);
    }
  }

  if (Object.hasOwn(waiver, "evidence")) {
    if (!Array.isArray(waiver.evidence)) {
      errors.push(`${label}: 'evidence' must be an array`);
    } else {
      for (const ev of waiver.evidence) {
        if (!EVIDENCE_CLASSES.has(ev)) errors.push(`${label}: invalid evidence class '${ev}' in 'evidence'`);
      }
    }
  }

  // Optional approval-reference fields: if present at all, must satisfy the
  // schema's type/minLength -- independent of whether the target rule's
  // authority makes them mandatory (checked separately below).
  for (const field of ["paulo_decision_ref", "architect_sync_ref"]) {
    if (Object.hasOwn(waiver, field) && !isNonEmptyString(waiver[field])) {
      errors.push(`${label}: '${field}', if present, must be a non-empty string`);
    }
  }

  let expiryHasPassed = false;
  const validExpiresAt = typeof waiver.expires_at === "string" && DATE_RE.test(waiver.expires_at);
  const validIssuedAt = typeof waiver.issued_at === "string" && DATE_RE.test(waiver.issued_at);
  if (!waiver.expires_at) {
    errors.push(`${label}: MANDATORY expires_at is missing -- no permanent silent exceptions are allowed`);
  } else if (validExpiresAt) {
    if (validIssuedAt && !(new Date(waiver.expires_at) > new Date(waiver.issued_at))) {
      errors.push(`${label}: expires_at ('${waiver.expires_at}') must be strictly after issued_at ('${waiver.issued_at}')`);
    }
    expiryHasPassed = new Date(waiver.expires_at).getTime() <= Date.now();
  }

  // S1-F003 (cycle 2): expiry is authoritative over status text.
  if (expiryHasPassed && waiver.status === "ACTIVE") {
    errors.push(`${label}: expires_at ('${waiver.expires_at}') has passed but status is still 'ACTIVE' -- expiry is authoritative; this waiver is not in effect and its status must be updated to 'EXPIRED'`);
  }

  if (waiver.rule_waived && RULE_ID_RE.test(String(waiver.rule_waived))) {
    const target = ruleIndex.get(waiver.rule_waived);
    if (!target) {
      errors.push(`${label}: rule_waived '${waiver.rule_waived}' does not exist in the current rule registry`);
    } else {
      if (!target.waivable) {
        errors.push(`${label}: rule_waived '${waiver.rule_waived}' is marked waivable: false -- it cannot be the target of a waiver (S1-F003)`);
      }
      // S1-F003 (cycle 2): bind the waiver to the target rule's own authority.
      if (target.authority.paulo_approval_required === true) {
        if (!isNonEmptyString(waiver.paulo_decision_ref)) {
          errors.push(`${label}: rule_waived '${waiver.rule_waived}' requires authority.paulo_approval_required -- 'paulo_decision_ref' must be present and non-empty`);
        }
      }
      if (target.authority.architect_sync_required === true) {
        if (!isNonEmptyString(waiver.architect_sync_ref)) {
          errors.push(`${label}: rule_waived '${waiver.rule_waived}' requires authority.architect_sync_required -- 'architect_sync_ref' must be present and non-empty`);
        }
      }
    }
  }
  return errors;
}

function main() {
  let ruleIndex;
  try {
    ruleIndex = loadRuleIndex();
  } catch (e) {
    // S1-F004: fail-closed -- a broken/unreadable rule registry aborts waiver
    // validation entirely rather than silently proceeding with a partial index.
    console.log(`FATAL: cannot validate waivers -- the rule registry this validator depends on is broken:`);
    console.log(`  ${e.message}`);
    console.log(`\nFAIL: waiver validation aborted (rule registry dependency failure).`);
    process.exit(1);
  }

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
