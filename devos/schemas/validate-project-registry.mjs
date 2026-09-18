#!/usr/bin/env node
// Static structural + semantic validator for projects/registry.json.
//
// Introduced in S2 -- DevOS Repository Foundation (ML-DEVOS-RFC-001,
// ML-DEVOS-AS-006, D-016). This is a governance-data lint tool only. It
// performs no runtime policy enforcement, is not wired into any CI/git hook,
// and is not invoked automatically by anything. Run manually:
//
//   node devos/schemas/validate-project-registry.mjs
//
// Zero third-party dependencies (Node builtins only).
//
// WHAT THIS VALIDATOR PROVES:
//   - projects/registry.json is valid JSON (fail-closed).
//   - The document has exactly the fields project-registry.schema.json
//     requires/allows (additionalProperties: false enforced at the top
//     level and on every project entry and its 'overlay' sub-object).
//   - schema_version is exactly "1".
//   - projects is an array.
//   - S2 CLOSURE INVARIANT (ML-DEVOS-RFC-001 acceptance criterion 7): as of
//     S2, projects MUST be empty. A non-empty registry is a hard failure
//     here regardless of whether each entry is otherwise well-formed --
//     this is deliberately hardcoded, not a flag, because no
//     PROJECT_ONBOARDING decision has occurred or is authorized in S2.
//     Lifting this requires a future, separately authorized change to this
//     validator (and the manifest's project_registry.status field), not a
//     runtime toggle.
//   - For any project entry present (which S2 itself never produces, but
//     the schema and this validator still check in case one is ever added
//     out of process): project_id is a non-empty string and globally
//     unique within the registry; repository/owner are non-empty strings;
//     status is a valid enum; overlay is an object with a non-empty
//     location and a valid mode; onboarding_decision_id/onboarding_adr_id
//     are string-or-null; and an ACTIVE entry has a non-empty
//     onboarding_decision_id (never null/empty) -- per the RFC's "no ACTIVE
//     project without an onboarding decision reference" invariant.
//
// WHAT THIS VALIDATOR DOES NOT PROVE:
//   - That a cited onboarding_decision_id/onboarding_adr_id actually exists
//     in brain/DECISION_LOG.md or devos/changes/adrs/ -- human/Architect
//     cross-reference review, not automatable from this file alone.
//   - That a project's repository locator or overlay location is reachable
//     or genuine.
//   - Anything about the project's own governance, task state, evidence, or
//     memory -- this registry is an index only; those live in the project's
//     own repository/overlay, never here (see projects/README.md).
//   - Any runtime behavior. It enforces nothing; it is a manual, one-shot
//     lint pass over a static file.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(HERE, "..", "..", "projects", "registry.json");

// S2 (ML-DEVOS-RFC-001) requires the project registry to remain empty
// through S2 closure -- see this script's header comment.
const S2_CLOSURE_REQUIRES_EMPTY_REGISTRY = true;

const STATUSES = new Set(["PROPOSED", "ACTIVE", "SUSPENDED", "RETIRED"]);
const OVERLAY_MODES = new Set(["in-repo-overlay", "external-devos-overlay"]);

const TOP_FIELDS = new Set(["schema_version", "projects"]);
const ENTRY_FIELDS = new Set([
  "project_id", "repository", "owner", "status", "overlay",
  "onboarding_decision_id", "onboarding_adr_id",
]);
const OVERLAY_FIELDS = new Set(["location", "mode"]);

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}
function checkAdditionalProps(obj, allowed, label, errors) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`${label}: unknown field '${key}' (additionalProperties: false)`);
  }
}

function validateEntry(entry, index, seenIds, errors) {
  const label = `projects[${index}]${entry && entry.project_id ? ` (${entry.project_id})` : ""}`;
  if (!isPlainObject(entry)) {
    errors.push(`${label}: must be an object`);
    return;
  }
  checkAdditionalProps(entry, ENTRY_FIELDS, label, errors);
  for (const field of ENTRY_FIELDS) {
    if (!Object.hasOwn(entry, field)) errors.push(`${label}: missing required field '${field}'`);
  }

  if (!isNonEmptyString(entry.project_id)) {
    errors.push(`${label}: 'project_id' must be a non-empty string`);
  } else {
    if (seenIds.has(entry.project_id)) errors.push(`${label}: duplicate project_id '${entry.project_id}' -- must be globally unique within the registry`);
    seenIds.add(entry.project_id);
  }
  for (const field of ["repository", "owner"]) {
    if (!isNonEmptyString(entry[field])) errors.push(`${label}: '${field}' must be a non-empty string`);
  }
  if (!STATUSES.has(entry.status)) errors.push(`${label}: invalid status '${entry.status}'`);

  if (!isPlainObject(entry.overlay)) {
    errors.push(`${label}: 'overlay' must be an object`);
  } else {
    checkAdditionalProps(entry.overlay, OVERLAY_FIELDS, `${label}.overlay`, errors);
    if (!isNonEmptyString(entry.overlay.location)) errors.push(`${label}.overlay.location: must be a non-empty string`);
    if (!OVERLAY_MODES.has(entry.overlay.mode)) errors.push(`${label}.overlay.mode: invalid mode '${entry.overlay.mode}'`);
  }

  for (const field of ["onboarding_decision_id", "onboarding_adr_id"]) {
    if (Object.hasOwn(entry, field) && entry[field] !== null && typeof entry[field] !== "string") {
      errors.push(`${label}.${field}: must be a string or null`);
    }
  }

  // RFC future registry-entry invariant: no ACTIVE project without an
  // onboarding decision reference.
  if (entry.status === "ACTIVE" && !isNonEmptyString(entry.onboarding_decision_id)) {
    errors.push(`${label}: status 'ACTIVE' requires a non-null, non-empty 'onboarding_decision_id'`);
  }
}

function validate(doc, errors) {
  if (!isPlainObject(doc)) {
    errors.push("registry: top-level document must be an object");
    return;
  }
  checkAdditionalProps(doc, TOP_FIELDS, "registry", errors);
  for (const field of TOP_FIELDS) {
    if (!Object.hasOwn(doc, field)) errors.push(`registry: missing required field '${field}'`);
  }
  if (Object.hasOwn(doc, "schema_version") && doc.schema_version !== "1") {
    errors.push(`registry.schema_version: must be exactly '1' (found '${doc.schema_version}')`);
  }
  if (!Array.isArray(doc.projects)) {
    errors.push("registry.projects: must be an array");
    return;
  }

  // S2 closure invariant: the registry must be empty.
  if (S2_CLOSURE_REQUIRES_EMPTY_REGISTRY && doc.projects.length > 0) {
    errors.push(`registry.projects: must be empty during S2 (found ${doc.projects.length} entr${doc.projects.length === 1 ? "y" : "ies"}) -- registering a project requires a later, separately authorized PROJECT_ONBOARDING decision (ML-DEVOS-RFC-001 acceptance criterion 7)`);
  }

  const seenIds = new Set();
  doc.projects.forEach((entry, i) => validateEntry(entry, i, seenIds, errors));
}

function main() {
  if (!existsSync(REGISTRY_PATH)) {
    console.log(`No project registry found at ${REGISTRY_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(REGISTRY_PATH, "utf8");
  let doc;
  try {
    doc = JSON.parse(raw); // fail-closed: throws on any malformed JSON
  } catch (e) {
    console.log(`(parse error) ${REGISTRY_PATH}: ${e.message}`);
    console.log("\nFAIL: 1 error(s) across 1 file(s).");
    process.exit(1);
  }
  const errors = [];
  validate(doc, errors);
  console.log(`registry.json: ${Array.isArray(doc.projects) ? doc.projects.length : "?"} project entr${doc.projects && doc.projects.length === 1 ? "y" : "ies"} parsed`);
  if (errors.length === 0) {
    console.log("  OK — no structural or semantic issues found. Registry is empty, as required during S2.");
  } else {
    for (const e of errors) console.log(`  ERROR: ${e}`);
  }
  console.log(`\n${errors.length === 0 ? "PASS" : "FAIL"}: ${errors.length} error(s) across 1 file(s).`);
  process.exit(errors.length === 0 ? 0 : 1);
}

main();
