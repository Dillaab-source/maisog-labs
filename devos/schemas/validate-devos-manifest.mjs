#!/usr/bin/env node
// Static structural + semantic validator for devos/devos-manifest.json.
//
// Introduced in S2 -- DevOS Repository Foundation (ML-DEVOS-RFC-001,
// ML-DEVOS-AS-006, D-016). Extended by ML-DEVOS-RFC-015 / ML-DEVOS-AS-059 /
// D-044 / D-045 to add the post-bootstrap reserved-root lifecycle state
// IMPLEMENTED and its fail-closed closure_ref linkage, without changing any
// S2-era check. This is a governance-data lint tool only. It performs no
// runtime policy enforcement, is not wired into any CI/git hook, and is not
// invoked automatically by anything. Run manually:
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
//     owning_phase (never an array -- S2-F005), a status of NOT_IMPLEMENTED,
//     FOUNDATION_ACTIVE, or IMPLEMENTED (ML-DEVOS-RFC-015), and
//     executable_runtime_present === false (S2-F007 / RFC acceptance
//     criteria 4-5 -- unaffected by RFC-015's clarified, behavior-based
//     meaning of that field, since no root has genuinely added live
//     execution yet).
//   - No two reserved_subsystem_roots entries declare the same path.
//   - Only devos/schemas/ may be FOUNDATION_ACTIVE, checked both by path and
//     by count; every other declared root must be NOT_IMPLEMENTED or,
//     once closed, IMPLEMENTED.
//   - A root with status IMPLEMENTED has a non-null closure_ref matching the
//     ML-DEVOS-ADR-NNN convention that resolves to EXACTLY ONE
//     closure_history entry by that entry's own `adr` field (never by
//     `phase`, a reusable label -- ML-DEVOS-AS-057 AS57-F002); that matched
//     entry's `phase` equals the root's own `owning_phase`; and that matched
//     entry's `decision`/`architect_sync`/`version` are all present and
//     match the repository's existing ID/semver conventions. A root with
//     status NOT_IMPLEMENTED or FOUNDATION_ACTIVE has closure_ref absent or
//     null, never a live reference. This is a fail-closed check: a bare
//     status edit, a dangling reference, an ambiguous (multiply-matching)
//     reference, or a reference resolving to the wrong phase's closure are
//     all hard failures, not warnings.
//   - project_registry.role is exactly "index only" and project_registry.
//     status is EMPTY -- this is the standing pre-onboarding invariant
//     (ML-DEVOS-RFC-001 acceptance criterion 7; reaffirmed at S2 closure,
//     D-017/ML-DEVOS-ADR-002), not a condition scoped to "while S2 is the
//     active phase." POPULATED is schema-legal only once a specific,
//     separately authorized PROJECT_ONBOARDING decision permits it; until
//     then this validator flags POPULATED as a hard error regardless of
//     which Sentinel phase is current -- see the script's
//     REGISTRY_MUST_BE_EMPTY_UNTIL_ONBOARDING constant (S2-C006 correction;
//     renamed from S2_CLOSURE_REQUIRES_EMPTY_REGISTRY, which read as if the
//     invariant lapsed once S2 closed).
//   - Top-level executable_runtime_present === false.
//   - provenance cites all four of rfc/architect_sync/proposal_decision/
//     implementation_decision as non-empty strings.
//   - closure_history is an array; every entry has exactly the required
//     fields (phase/closed_at/version/adr/decision/architect_sync/note),
//     each non-empty/correctly typed, closed_at a YYYY-MM-DD date, and
//     version a semver string (added at S2 closure, D-017/ML-DEVOS-ADR-002).
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
//   - That a root's IMPLEMENTED status or resolvable closure_ref grants that
//     root's owning phase any authority, deployment/runtime verification, or
//     standing to authorize a later phase (CORE-001, CORE-002; ML-DEVOS-RFC-015).
//     A PASS from this file is a structural/semantic validity result about
//     the manifest's own shape only -- never a task-acceptance, closure-
//     correctness-in-substance, or authority result. Whether the cited ADR/
//     Decision/Architect Sync actually say what the manifest claims remains
//     Architect/human cross-reference review, same limitation already
//     disclosed above for the S2-era provenance fields.
//   - That any repository-local schema, validator, or generator being
//     executable, or being invoked manually vs. automatically (including
//     from CI), by itself changes executable_runtime_present's correct
//     value -- that field's meaning is behavior-based (does the root own
//     operational state, execute lifecycle transitions, dispatch actors,
//     broker capabilities, or take autonomous/consequence-bearing action),
//     never invocation-based (ML-DEVOS-AS-057 AS57-F005 / ML-DEVOS-AS-058
//     AS58-F004); this validator's own existence and manual/CI invocability
//     is itself a worked example of tooling that stays non-runtime.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const MANIFEST_PATH = path.join(HERE, "..", "devos-manifest.json");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
// ML-DEVOS-RFC-015 / ML-DEVOS-AS-059 / D-044 / D-045: IMPLEMENTED added as a
// third reserved-root lifecycle status alongside the S2-bootstrap-only
// NOT_IMPLEMENTED/FOUNDATION_ACTIVE vocabulary.
const ROOT_STATUSES = new Set(["NOT_IMPLEMENTED", "FOUNDATION_ACTIVE", "IMPLEMENTED"]);
const BASELINE_STATUSES = new Set(["ACTIVE", "SUPERSEDED"]);
const REGISTRY_STATUSES = new Set(["EMPTY", "POPULATED"]);
const SURFACE_STATUSES = new Set(["ACTIVE", "RETIRED"]);
// Structural ID conventions already established elsewhere in this repository
// (devos/changes/adrs/, brain/DECISION_LOG.md, devos/changes/architect-syncs/):
// three-digit, zero-padded, sequential, never-reused identifiers.
const ADR_ID_RE = /^ML-DEVOS-ADR-[0-9]{3}$/;
const DECISION_ID_RE = /^D-[0-9]{3}$/;
const ARCHITECT_SYNC_ID_RE = /^ML-DEVOS-AS-[0-9]{3}$/;
// ML-DEVOS-RFC-015: only devos/schemas/ may ever be FOUNDATION_ACTIVE -- it is
// the one root S2 itself owns and populates as repository foundation.
const FOUNDATION_ACTIVE_PATH = "devos/schemas/";

// ML-DEVOS-RFC-001 established, and D-017/ML-DEVOS-ADR-002 reaffirmed at S2
// closure, that the project registry remains empty until a separately
// authorized PROJECT_ONBOARDING decision permits population. This is a
// standing invariant layered on top of the schema (which permits POPULATED
// once such a decision exists) -- it is deliberately hardcoded here, not a
// flag, because no PROJECT_ONBOARDING decision has occurred. Renamed from
// S2_CLOSURE_REQUIRES_EMPTY_REGISTRY (S2-C006): the invariant was never
// scoped to "while S2 is active," and the old name read as if it lapsed
// once S2 closed.
const REGISTRY_MUST_BE_EMPTY_UNTIL_ONBOARDING = true;

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
  "closure_history", "created_at", "updated_at",
]);
const CLOSURE_ENTRY_FIELDS = new Set(["phase", "closed_at", "version", "adr", "decision", "architect_sync", "note"]);
const ARCH_BASELINE_FIELDS = new Set(["id", "version", "status", "document"]);
const CAP_BASELINE_FIELDS = new Set(["version", "status", "adr", "decision", "document"]);
const ROOT_FIELDS = new Set(["path", "owning_phase", "consuming_phases", "status", "closure_ref", "executable_runtime_present"]);
// closure_ref is deliberately excluded: it is optional (ML-DEVOS-RFC-015),
// and its absence is backwards compatible with every root that predates it.
const REQUIRED_ROOT_FIELDS = new Set(["path", "owning_phase", "consuming_phases", "status", "executable_runtime_present"]);
const REGISTRY_FIELDS = new Set(["location", "schema", "role", "status", "note"]);
const SURFACE_FIELDS = new Set(["path", "status", "note"]);
const PROVENANCE_FIELDS = new Set(["rfc", "architect_sync", "proposal_decision", "implementation_decision"]);

function checkAdditionalProps(obj, allowed, label, errors) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`${label}: unknown field '${key}' (additionalProperties: false)`);
  }
}

// ML-DEVOS-RFC-015 / ML-DEVOS-AS-059 / D-044 / D-045 (AS57-F002 corrected
// design): a reserved root's IMPLEMENTED status is fail-closed only if
// closure_ref names a UNIQUE closure event -- matched by the closure_history
// entry's `adr` (sequential, never reused), never by its `phase` (a reusable
// category label a later corrective/re-closure could share). This function
// checks that link is sound; it never itself certifies the closure is
// correct in substance, and it never grants the root's owning phase any
// authority -- IMPLEMENTED is descriptive data, not a delegation (CORE-001,
// CORE-002).
function validateClosureRef(root, label, closureHistory, errors) {
  const hasClosureRef = Object.hasOwn(root, "closure_ref");
  const closureRef = root.closure_ref;

  if (root.status !== "IMPLEMENTED") {
    // NOT_IMPLEMENTED / FOUNDATION_ACTIVE: a root that has not closed cannot
    // cite a closure event. Absence is fine; an explicit non-null value is not.
    if (hasClosureRef && closureRef !== null) {
      errors.push(`${label}: 'closure_ref' must be absent or null when status is '${root.status}' -- a root that has not closed cannot cite a closure event`);
    }
    return;
  }

  if (!hasClosureRef || closureRef === null) {
    errors.push(`${label}: status IMPLEMENTED requires a non-null 'closure_ref' -- a bare status edit is never sufficient evidence of closure`);
    return;
  }
  if (typeof closureRef !== "string" || !ADR_ID_RE.test(closureRef)) {
    errors.push(`${label}: 'closure_ref' must be a string matching the ML-DEVOS-ADR-NNN convention (found '${closureRef}')`);
    return;
  }
  if (!Array.isArray(closureHistory)) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) cannot be resolved because manifest.closure_history is missing or invalid`);
    return;
  }

  const matches = closureHistory.filter((entry) => isPlainObject(entry) && entry.adr === closureRef);
  if (matches.length === 0) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) does not resolve to any manifest.closure_history entry -- a dangling closure reference is never valid`);
    return;
  }
  if (matches.length > 1) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) resolves to ${matches.length} manifest.closure_history entries -- an ADR reference must be unique; an ambiguous closure linkage is never valid`);
    return;
  }

  const matched = matches[0];
  if (matched.phase !== root.owning_phase) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) resolves to a closure_history entry for phase '${matched.phase}', but this root's owning_phase is '${root.owning_phase}' -- closure_ref must close the SAME phase that owns this root`);
  }
  if (!isNonEmptyString(matched.decision)) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) resolves to a closure_history entry missing a non-empty 'decision'`);
  } else if (!DECISION_ID_RE.test(matched.decision)) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) resolves to a closure_history entry whose 'decision' ('${matched.decision}') does not match the repository's D-NNN convention`);
  }
  if (!isNonEmptyString(matched.architect_sync)) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) resolves to a closure_history entry missing a non-empty 'architect_sync'`);
  } else if (!ARCHITECT_SYNC_ID_RE.test(matched.architect_sync)) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) resolves to a closure_history entry whose 'architect_sync' ('${matched.architect_sync}') does not match the repository's ML-DEVOS-AS-NNN convention`);
  }
  if (typeof matched.version !== "string" || !SEMVER_RE.test(matched.version)) {
    errors.push(`${label}: 'closure_ref' (${closureRef}) resolves to a closure_history entry with a missing or invalid 'version'`);
  }
}

export function validate(doc, errors) {
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
      // closure_ref (ML-DEVOS-RFC-015) is optional -- absence is backwards
      // compatible with every root that existed before this field, so it is
      // deliberately excluded from this required-field check.
      for (const field of REQUIRED_ROOT_FIELDS) {
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
      if (!ROOT_STATUSES.has(root.status)) {
        errors.push(`${label}: invalid status '${root.status}' (must be NOT_IMPLEMENTED, FOUNDATION_ACTIVE, or IMPLEMENTED)`);
      } else {
        if (root.status === "FOUNDATION_ACTIVE") {
          foundationActiveCount += 1;
          // ML-DEVOS-RFC-015: preserve the existing invariant explicitly by
          // path, not merely by count -- a second root could otherwise claim
          // FOUNDATION_ACTIVE the moment devos/schemas/ itself became
          // something else, without ever tripping the ">1" check below.
          if (root.path !== FOUNDATION_ACTIVE_PATH) {
            errors.push(`${label}: only '${FOUNDATION_ACTIVE_PATH}' may be FOUNDATION_ACTIVE -- every other reserved root belongs to a later phase and must be NOT_IMPLEMENTED or, once closed, IMPLEMENTED`);
          }
        }
        validateClosureRef(root, label, doc.closure_history, errors);
      }
      if (root.executable_runtime_present !== false) {
        errors.push(`${label}: 'executable_runtime_present' must be exactly false -- no reserved root may contain live executable Sentinel runtime behavior yet (S2-F007; see the schema field's description for the exact behavior-based boundary, ML-DEVOS-RFC-015)`);
      }
    }
    if (foundationActiveCount > 1) {
      errors.push(`manifest.reserved_subsystem_roots: at most one root may be FOUNDATION_ACTIVE (found ${foundationActiveCount}) -- only devos/schemas/ is S2-owned foundation; every other reserved root belongs to a later phase`);
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
    else if (REGISTRY_MUST_BE_EMPTY_UNTIL_ONBOARDING && pr.status !== "EMPTY") {
      errors.push(`manifest.project_registry.status: must remain 'EMPTY' until a separately authorized PROJECT_ONBOARDING decision permits population (found '${pr.status}') -- not asserted here`);
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

  // closure_history
  const closures = doc.closure_history;
  if (!Array.isArray(closures)) {
    errors.push("manifest.closure_history: must be an array");
  } else {
    for (const [i, entry] of closures.entries()) {
      const label = `manifest.closure_history[${i}]${entry && entry.phase ? ` (${entry.phase})` : ""}`;
      if (!isPlainObject(entry)) { errors.push(`${label}: must be an object`); continue; }
      checkAdditionalProps(entry, CLOSURE_ENTRY_FIELDS, label, errors);
      for (const field of CLOSURE_ENTRY_FIELDS) {
        if (!Object.hasOwn(entry, field)) errors.push(`${label}: missing required field '${field}'`);
      }
      for (const field of ["phase", "adr", "decision", "architect_sync", "note"]) {
        if (Object.hasOwn(entry, field) && !isNonEmptyString(entry[field])) errors.push(`${label}: '${field}' must be a non-empty string`);
      }
      if (Object.hasOwn(entry, "closed_at") && (typeof entry.closed_at !== "string" || !DATE_RE.test(entry.closed_at))) {
        errors.push(`${label}: 'closed_at' must be a YYYY-MM-DD date string (found '${entry.closed_at}')`);
      }
      if (Object.hasOwn(entry, "version") && (typeof entry.version !== "string" || !SEMVER_RE.test(entry.version))) {
        errors.push(`${label}: 'version' must be a MAJOR.MINOR.PATCH semver string (found '${entry.version}')`);
      }
    }
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

// Exported so tests can validate synthetic fixtures without ever touching
// the live devos-manifest.json, and so a test can load-and-clone the live
// manifest to prove it remains valid under the extended schema.
export function loadManifest(manifestPath = MANIFEST_PATH) {
  const raw = readFileSync(manifestPath, "utf8");
  return JSON.parse(raw); // fail-closed: throws on any malformed JSON
}

function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.log(`No manifest found at ${MANIFEST_PATH}`);
    process.exit(1);
  }
  let doc;
  try {
    doc = loadManifest();
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

// ML-DEVOS-RFC-015 implementation: guard direct-run so this module can be
// imported by tests (which call validate()/loadManifest() directly) without
// main() eagerly reading the live manifest and calling process.exit() as a
// side effect of the import -- the same pattern already established by
// devos/contracts/validate-task-contract.mjs and
// scripts/generate-claude-skills-bridge.mjs.
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
