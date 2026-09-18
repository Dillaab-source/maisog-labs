#!/usr/bin/env node
// Static structural + semantic validator for devos/devos-manifest.json.
//
// Introduced in S2 -- DevOS Repository Foundation (ML-DEVOS-RFC-001,
// ML-DEVOS-AS-006, D-016). This is a governance-data lint tool only. It
// performs no runtime policy enforcement, is not wired into any CI/git hook,
// and is not invoked automatically by anything. Run manually:
//
//   node devos/schemas/validate-devos-manifest.mjs
//
// Zero third-party dependencies (Node builtins only) -- no package.json
// change, no new dependency surface, matching the pattern already
// established by devos/governance/registry/validate-rules.mjs and
// validate-waivers.mjs.
//
// WHAT THIS VALIDATOR PROVES:
//   - The manifest file is valid JSON (fail-closed: a syntax error stops
//     everything with a non-zero exit, nothing is silently skipped).
//   - The manifest has exactly the fields devos-manifest.schema.json
//     requires/allows at every object level (additionalProperties: false
//     enforced at the top level, and inside architecture_baseline,
//     sentinel_capability_baseline, each reserved_subsystem_roots entry,
//     project_registry, each legacy_bootstrap_surfaces entry, and provenance).
//   - architecture_baseline is exactly { id: "ML-DEVOS-ARCH-001", version:
//     "1.2.0", status: "FROZEN", document: <string> } -- the frozen S0
//     baseline can never silently drift in this manifest (S2-F001).
//   - sentinel_capability_baseline.version is a semver string, status is a
//     valid enum, and it is a DISTINCT object from architecture_baseline
//     (S2-F001) -- the validator checks they are not the same reference and
//     do not share a version string, which would defeat the separation this
//     manifest exists to preserve.
//   - source_of_truth_precedence is a non-empty ordered list, and its first
//     entries textually reference the frozen architecture and the
//     governance kernel/decisions/ADRs/syncs before this manifest is
//     mentioned, and this manifest is mentioned before the project registry
//     (S2-F002) -- a purely positional, textual check, not a semantic proof.
//   - Every reserved_subsystem_roots entry has exactly one non-empty string
//     owning_phase (never an array -- S2-F005), a status of either
//     NOT_IMPLEMENTED or FOUNDATION_ACTIVE, and executable_runtime_present
//     === false (S2-F007 / RFC acceptance criteria 4-5).
//   - No two reserved_subsystem_roots entries declare the same path.
//   - Exactly one reserved root (devos/schemas/) may be FOUNDATION_ACTIVE;
//     every other declared root must be NOT_IMPLEMENTED.
//   - project_registry.role is exactly "index only" and project_registry.
//     status is EMPTY (S2 requires this; POPULATED is schema-legal for a
//     later, separately authorized phase but is flagged as a hard error by
//     this validator while S2 is the active phase -- see the script's
//     S2_CLOSURE_REQUIRES_EMPTY_REGISTRY constant).
//   - Top-level executable_runtime_present === false.
//   - provenance cites all four of rfc/architect_sync/proposal_decision/
//     implementation_decision as non-empty strings.
//   - created_at/updated_at are YYYY-MM-DD date strings.
//
// WHAT THIS VALIDATOR DOES NOT PROVE:
//   - That the cited rfc/architect_sync/decision/adr IDs actually exist and
//     say what this manifest claims -- that is Architect/human cross-
//     reference review, not automatable from this file alone.
//   - That devos/architecture/ML-DEVOS-ARCH-001.md or
//     devos/changes/adrs/ML-DEVOS-ADR-001.md actually contain the content
//     this manifest summarizes -- only that this manifest's own shape is
//     internally consistent.
//   - That every reserved subsystem root's README.md actually exists and
//     states NOT IMPLEMENTED -- that is a separate, disclosed limitation;
//     this script validates devos-manifest.json only, not the filesystem
//     tree of README files (verified manually this cycle instead, see the
//     S2 handoff).
//   - Anything about projects/registry.json's own content beyond this
//     manifest's project_registry.status field -- see
//     validate-project-registry.mjs for that.
//   - Any runtime behavior. It enforces nothing; it is a manual, one-shot
//     lint pass over a static file.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(HERE, "..", "devos-manifest.json");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const ROOT_STATUSES = new Set(["NOT_IMPLEMENTED", "FOUNDATION_ACTIVE"]);
const BASELINE_STATUSES = new Set(["ACTIVE", "SUPERSEDED"]);
const REGISTRY_STATUSES = new Set(["EMPTY", "POPULATED"]);
const SURFACE_STATUSES = new Set(["ACTIVE", "RETIRED"]);

// S2 (ML-DEVOS-RFC-001) requires the project registry to remain empty
// through S2 closure. This is an S2-scope closure invariant layered on top
// of the schema (which permits POPULATED for a later, separately authorized
// phase) -- it is deliberately hardcoded here, not a flag, because no
// PROJECT_ONBOARDING decision has occurred and none is authorized in S2.
const S2_CLOSURE_REQUIRES_EMPTY_REGISTRY = true;

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

const TOP_FIELDS = new Set([
  "manifest_id", "manifest_version", "repository", "devos_root",
  "architecture_baseline", "sentinel_capability_baseline",
  "source_of_truth_precedence", "precedence_statement",
  "reserved_subsystem_roots", "reserved_root_invariant",
  "project_registry", "legacy_bootstrap_surfaces",
  "executable_runtime_present", "prohibition", "provenance",
  "created_at", "updated_at",
]);
const ARCH_BASELINE_FIELDS = new Set(["id", "version", "status", "document"]);
const CAP_BASELINE_FIELDS = new Set(["version", "status", "adr", "decision", "document"]);
const ROOT_FIELDS = new Set(["path", "owning_phase", "consuming_phases", "status", "executable_runtime_present"]);
const REGISTRY_FIELDS = new Set(["location", "schema", "role", "status", "note"]);
const SURFACE_FIELDS = new Set(["path", "status", "note"]);
const PROVENANCE_FIELDS = new Set(["rfc", "architect_sync", "proposal_decision", "implementation_decision"]);

function checkAdditionalProps(obj, allowed, label, errors) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`${label}: unknown field '${key}' (additionalProperties: false)`);
  }
}

function validate(doc, errors) {
  if (!isPlainObject(doc)) {
    errors.push("manifest: top-level document must be an object");
    return;
  }
  checkAdditionalProps(doc, TOP_FIELDS, "manifest", errors);
  for (const field of TOP_FIELDS) {
    if (!Object.hasOwn(doc, field)) errors.push(`manifest: missing required field '${field}'`);
  }

  for (const field of ["manifest_id", "manifest_version", "repository", "devos_root", "precedence_statement", "reserved_root_invariant", "prohibition"]) {
    if (Object.hasOwn(doc, field) && !isNonEmptyString(doc[field])) errors.push(`manifest: '${field}' must be a non-empty string`);
  }

  // architecture_baseline
  const ab = doc.architecture_baseline;
  if (!isPlainObject(ab)) {
    errors.push("manifest.architecture_baseline: must be an object");
  } else {
    checkAdditionalProps(ab, ARCH_BASELINE_FIELDS, "manifest.architecture_baseline", errors);
    if (ab.id !== "ML-DEVOS-ARCH-001") errors.push(`manifest.architecture_baseline.id: must be exactly 'ML-DEVOS-ARCH-001' (found '${ab.id}')`);
    if (ab.version !== "1.2.0") errors.push(`manifest.architecture_baseline.version: must be exactly '1.2.0' -- the frozen S0 baseline (found '${ab.version}')`);
    if (ab.status !== "FROZEN") errors.push(`manifest.architecture_baseline.status: must be exactly 'FROZEN' (found '${ab.status}')`);
    if (!isNonEmptyString(ab.document)) errors.push("manifest.architecture_baseline.document: must be a non-empty string");
  }

  // sentinel_capability_baseline
  const cb = doc.sentinel_capability_baseline;
  if (!isPlainObject(cb)) {
    errors.push("manifest.sentinel_capability_baseline: must be an object");
  } else {
    checkAdditionalProps(cb, CAP_BASELINE_FIELDS, "manifest.sentinel_capability_baseline", errors);
    if (typeof cb.version !== "string" || !SEMVER_RE.test(cb.version)) errors.push(`manifest.sentinel_capability_baseline.version: must be a MAJOR.MINOR.PATCH semver string (found '${cb.version}')`);
    if (!BASELINE_STATUSES.has(cb.status)) errors.push(`manifest.sentinel_capability_baseline.status: invalid status '${cb.status}'`);
    for (const field of ["adr", "decision", "document"]) {
      if (!isNonEmptyString(cb[field])) errors.push(`manifest.sentinel_capability_baseline.${field}: must be a non-empty string`);
    }
  }

  // S2-F001: architecture_baseline and sentinel_capability_baseline must remain distinct.
  if (isPlainObject(ab) && isPlainObject(cb)) {
    if (ab === cb) errors.push("manifest: architecture_baseline and sentinel_capability_baseline must be distinct objects (S2-F001)");
    if (ab.version && cb.version && ab.version === cb.version) {
      errors.push(`manifest: architecture_baseline.version and sentinel_capability_baseline.version must not be equal (found both '${ab.version}') -- S2-F001 requires the frozen architecture and active capability baseline to remain distinct`);
    }
  }

  // source_of_truth_precedence
  const precedence = doc.source_of_truth_precedence;
  if (!Array.isArray(precedence) || precedence.length === 0) {
    errors.push("manifest.source_of_truth_precedence: must be a non-empty array");
  } else {
    for (const [i, entry] of precedence.entries()) {
      if (!isNonEmptyString(entry)) errors.push(`manifest.source_of_truth_precedence[${i}]: must be a non-empty string`);
    }
    // S2-F002: manifest must rank below the frozen architecture/governance
    // kernel/decisions/ADRs/syncs, and above the project registry index.
    const joined = precedence.map(String);
    const manifestIdx = joined.findIndex((s) => /manifest/i.test(s));
    const registryIdx = joined.findIndex((s) => /registry/i.test(s));
    const archIdx = joined.findIndex((s) => /architecture/i.test(s));
    if (manifestIdx === -1) errors.push("manifest.source_of_truth_precedence: no entry references 'manifest' (S2-F002)");
    if (archIdx === -1) errors.push("manifest.source_of_truth_precedence: no entry references 'architecture' (S2-F002)");
    if (manifestIdx !== -1 && archIdx !== -1 && manifestIdx < archIdx) {
      errors.push("manifest.source_of_truth_precedence: the manifest entry must not rank above the frozen architecture entry (S2-F002)");
    }
    if (manifestIdx !== -1 && registryIdx !== -1 && manifestIdx > registryIdx) {
      errors.push("manifest.source_of_truth_precedence: the manifest entry must rank above the project registry entry (S2-F002)");
    }
  }

  // reserved_subsystem_roots
  const roots = doc.reserved_subsystem_roots;
  if (!Array.isArray(roots) || roots.length === 0) {
    errors.push("manifest.reserved_subsystem_roots: must be a non-empty array");
  } else {
    const seenPaths = new Set();
    let foundationActiveCount = 0;
    for (const [i, root] of roots.entries()) {
      const label = `manifest.reserved_subsystem_roots[${i}]${root && root.path ? ` (${root.path})` : ""}`;
      if (!isPlainObject(root)) {
        errors.push(`${label}: must be an object`);
        continue;
      }
      checkAdditionalProps(root, ROOT_FIELDS, label, errors);
      for (const field of ROOT_FIELDS) {
        if (!Object.hasOwn(root, field)) errors.push(`${label}: missing required field '${field}'`);
      }
      if (!isNonEmptyString(root.path)) errors.push(`${label}: 'path' must be a non-empty string`);
      else {
        if (seenPaths.has(root.path)) errors.push(`${label}: duplicate reserved root path '${root.path}'`);
        seenPaths.add(root.path);
      }
      // S2-F005: exactly one owning phase, never an array.
      if (Array.isArray(root.owning_phase)) errors.push(`${label}: 'owning_phase' must be a single string, never an array (S2-F005 -- exactly one canonical owner per root)`);
      else if (!isNonEmptyString(root.owning_phase)) errors.push(`${label}: 'owning_phase' must be a non-empty string`);
      if (!Array.isArray(root.consuming_phases) || root.consuming_phases.some((p) => typeof p !== "string")) {
        errors.push(`${label}: 'consuming_phases' must be an array of strings`);
      }
      if (!ROOT_STATUSES.has(root.status)) errors.push(`${label}: invalid status '${root.status}' (must be NOT_IMPLEMENTED or FOUNDATION_ACTIVE)`);
      else if (root.status === "FOUNDATION_ACTIVE") foundationActiveCount += 1;
      if (root.executable_runtime_present !== false) {
        errors.push(`${label}: 'executable_runtime_present' must be exactly false in S2 -- no reserved root may contain executable later-phase subsystem code (S2-F007)`);
      }
    }
    if (foundationActiveCount > 1) {
      errors.push(`manifest.reserved_subsystem_roots: at most one root may be FOUNDATION_ACTIVE in S2 (found ${foundationActiveCount}) -- only devos/schemas/ is S2-owned foundation; every other reserved root belongs to a later phase and must be NOT_IMPLEMENTED`);
    }
  }

  // project_registry
  const pr = doc.project_registry;
  if (!isPlainObject(pr)) {
    errors.push("manifest.project_registry: must be an object");
  } else {
    checkAdditionalProps(pr, REGISTRY_FIELDS, "manifest.project_registry", errors);
    for (const field of ["location", "schema", "note"]) {
      if (!isNonEmptyString(pr[field])) errors.push(`manifest.project_registry.${field}: must be a non-empty string`);
    }
    if (pr.role !== "index only") errors.push(`manifest.project_registry.role: must be exactly 'index only' (found '${pr.role}')`);
    if (!REGISTRY_STATUSES.has(pr.status)) errors.push(`manifest.project_registry.status: invalid status '${pr.status}'`);
    else if (S2_CLOSURE_REQUIRES_EMPTY_REGISTRY && pr.status !== "EMPTY") {
      errors.push(`manifest.project_registry.status: must be 'EMPTY' during S2 (found '${pr.status}') -- a POPULATED registry requires a later, separately authorized PROJECT_ONBOARDING decision, not asserted here`);
    }
  }

  // legacy_bootstrap_surfaces
  const surfaces = doc.legacy_bootstrap_surfaces;
  if (!Array.isArray(surfaces)) {
    errors.push("manifest.legacy_bootstrap_surfaces: must be an array");
  } else {
    for (const [i, surf] of surfaces.entries()) {
      const label = `manifest.legacy_bootstrap_surfaces[${i}]`;
      if (!isPlainObject(surf)) { errors.push(`${label}: must be an object`); continue; }
      checkAdditionalProps(surf, SURFACE_FIELDS, label, errors);
      for (const field of SURFACE_FIELDS) {
        if (!Object.hasOwn(surf, field)) errors.push(`${label}: missing required field '${field}'`);
      }
      if (!isNonEmptyString(surf.path)) errors.push(`${label}: 'path' must be a non-empty string`);
      if (!SURFACE_STATUSES.has(surf.status)) errors.push(`${label}: invalid status '${surf.status}'`);
      if (!isNonEmptyString(surf.note)) errors.push(`${label}: 'note' must be a non-empty string`);
    }
  }

  // top-level executable_runtime_present
  if (doc.executable_runtime_present !== false) {
    errors.push(`manifest.executable_runtime_present: must be exactly false -- S2 is a static repository foundation only (found '${doc.executable_runtime_present}')`);
  }

  // provenance
  const prov = doc.provenance;
  if (!isPlainObject(prov)) {
    errors.push("manifest.provenance: must be an object");
  } else {
    checkAdditionalProps(prov, PROVENANCE_FIELDS, "manifest.provenance", errors);
    for (const field of PROVENANCE_FIELDS) {
      if (!isNonEmptyString(prov[field])) errors.push(`manifest.provenance.${field}: must be a non-empty string`);
    }
  }

  for (const field of ["created_at", "updated_at"]) {
    if (Object.hasOwn(doc, field) && (typeof doc[field] !== "string" || !DATE_RE.test(doc[field]))) {
      errors.push(`manifest.${field}: must be a YYYY-MM-DD date string (found '${doc[field]}')`);
    }
  }
}

function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.log(`No manifest found at ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(MANIFEST_PATH, "utf8");
  let doc;
  try {
    doc = JSON.parse(raw); // fail-closed: throws on any malformed JSON
  } catch (e) {
    console.log(`(parse error) ${MANIFEST_PATH}: ${e.message}`);
    console.log("\nFAIL: 1 error(s) across 1 file(s).");
    process.exit(1);
  }
  const errors = [];
  validate(doc, errors);
  console.log(`devos-manifest.json: parsed`);
  if (errors.length === 0) {
    console.log("  OK — no structural or semantic issues found.");
  } else {
    for (const e of errors) console.log(`  ERROR: ${e}`);
  }
  console.log(`\n${errors.length === 0 ? "PASS" : "FAIL"}: ${errors.length} error(s) across 1 file(s).`);
  process.exit(errors.length === 0 ? 0 : 1);
}

main();
