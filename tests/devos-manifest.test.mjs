import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, loadManifest, MANIFEST_PATH } from "../devos/schemas/validate-devos-manifest.mjs";

// ML-DEVOS-RFC-015 / ML-DEVOS-AS-059 / D-044 / D-045 -- focused validation of
// the reserved-root lifecycle extension (IMPLEMENTED status, fail-closed
// closure_ref, behavior-based executable_runtime_present, FOUNDATION_ACTIVE
// path restriction) added to devos/schemas/validate-devos-manifest.mjs.
//
// Every fixture here is a deep-cloned, in-memory copy of the live manifest,
// mutated per test case -- devos/devos-manifest.json itself is never written
// by this suite. (Historical note: D-045's "no live manifest migration this
// cycle" boundary applied only to RFC-015's own bounded implementation cycle,
// which is what this test file was originally written for; the coordinated
// Sentinel v1.6.0 closure, D-046/ML-DEVOS-ADR-013, later did migrate the live
// instance -- see the "devos/contracts/ is IMPLEMENTED..." test below, which
// asserts that closure's actual result. This suite still never writes to the
// live manifest itself; it only reads it via loadManifest() and mutates
// in-memory clones.) validate()/loadManifest() are called directly, never via
// the CLI, so importing this test file never triggers main()'s process.exit().
//
// Fixture ID choice: synthetic closure_history entries below deliberately
// reuse already-canonical, real repository ADR IDs that are simply UNUSED in
// the live manifest's own closure_history at the time of writing (not
// hard-coded here as a specific list, since that list grows at every future
// closure -- check devos/devos-manifest.json's closure_history directly for
// the current set) -- never fabricated IDs. A fabricated ID matching a real
// governance-ID family's shape would be picked up
// by devos/governance/traceability/validate-traceability.mjs as a new
// missing-canonical-target ERROR the moment this file exists on disk, since
// that scanner reads all of tests/ (excepting only tests/traceability.test.mjs,
// per its own config comment) -- reusing real, unused IDs keeps this suite's
// traceability impact at zero (deliberately not spelling out a fabricated
// example ID digit-for-digit even in this comment, for the same reason).
// "Dangling"/"ambiguous" scenarios are tested by
// pointing at a real ADR that simply isn't linked from any closure_history
// entry, or by linking one real ADR from two entries -- both are exactly the
// conditions the validator is meant to catch, without inventing a phantom ID.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(REPO_ROOT, "devos", "schemas", "devos-manifest.schema.json");

function cloneManifest() {
  return JSON.parse(JSON.stringify(loadManifest()));
}

// devos/orchestration/ (S8) remains NOT_IMPLEMENTED in the live manifest -- a
// stable NOT_IMPLEMENTED root to mutate into synthetic IMPLEMENTED-status
// fixtures. devos/contracts/ (S3) moved to IMPLEMENTED at the coordinated
// Sentinel v1.6.0 closure (D-046 / ML-DEVOS-ADR-013), and devos/state/ (S4)
// moved to IMPLEMENTED at the S4 closure (D-051 / ML-DEVOS-ADR-014) -- neither
// remains a stable NOT_IMPLEMENTED starting point for these synthetic
// mutations. devos/orchestration/'s owning S8 phase has no implementation or
// closure authority of any kind, making it the next stable choice.
const TARGET_ROOT_PATH = "devos/orchestration/";

function findRoot(doc, rootPath = TARGET_ROOT_PATH) {
  const root = doc.reserved_subsystem_roots.find((r) => r.path === rootPath);
  assert.ok(root, `expected to find a reserved root at '${rootPath}' in the live manifest`);
  return root;
}

// `adr` must be passed explicitly and must be a real, canonical ADR id not
// already present in the live closure_history (see file-header note above).
function addClosureHistoryEntry(doc, adr, overrides = {}) {
  const entry = {
    phase: "S8", // every call site overrides this with the actual target root's owning_phase
    closed_at: "2026-09-20",
    version: "1.6.0",
    adr,
    decision: "D-045",
    architect_sync: "ML-DEVOS-AS-059",
    note: "Synthetic fixture closure entry for RFC-015 focused tests.",
    ...overrides,
  };
  doc.closure_history.push(entry);
  return entry;
}

test("the live devos-manifest.json remains valid under the extended schema/validator (backwards compatibility)", () => {
  const doc = loadManifest();
  const errors = [];
  validate(doc, errors);
  assert.deepEqual(errors, [], `live manifest must validate cleanly with zero errors; got: ${JSON.stringify(errors)}`);
});

// D2-F002 (S4 closure D.2 verification): the manifest's descriptive
// source_of_truth_precedence text names the current Sentinel capability
// baseline as a human-readable string ("... currently vX.Y.Z)"), separate
// from the machine-readable sentinel_capability_baseline.version field the
// validator actually checks. Nothing previously asserted the two agree, so a
// closure that bumped one without the other (as this S4 closure initially
// did, bumping sentinel_capability_baseline.version to 1.7.0 while leaving
// this descriptive string at v1.6.0) went undetected. This assertion is
// intentionally dynamic -- it derives the expected version from the live
// manifest's own sentinel_capability_baseline.version rather than hardcoding
// "v1.7.0", so a future MINOR/MAJOR closure that repeats this drift fails
// here immediately instead of leaving the manifest internally inconsistent.
test("source_of_truth_precedence's descriptive Sentinel capability baseline version matches sentinel_capability_baseline.version", () => {
  const doc = loadManifest();
  const currentVersion = `v${doc.sentinel_capability_baseline.version}`;
  const precedenceLine = doc.source_of_truth_precedence.find((line) =>
    line.includes("Sentinel capability baseline")
  );
  assert.ok(precedenceLine, "expected a source_of_truth_precedence entry describing the Sentinel capability baseline");
  assert.ok(
    precedenceLine.includes(currentVersion),
    `source_of_truth_precedence entry '${precedenceLine}' must contain the current baseline version '${currentVersion}' (from sentinel_capability_baseline.version)`
  );
});

// Updated by the coordinated Sentinel v1.6.0 closure (D-046 / ML-DEVOS-ADR-013)
// and again by the S4 closure (D-051 / ML-DEVOS-ADR-014): devos/contracts/
// (S3) and devos/state/ (S4) are now the two reserved roots that have reached
// IMPLEMENTED via the RFC-015 mechanism this same test file validates -- the
// original version of this test (written during RFC-015's own bounded
// implementation, before any closure was authorized) asserted the opposite
// ("no root is IMPLEMENTED yet") by design at that time. Each assertion above
// became obsolete by its own explicit, separately authorized closure act, not
// a regression; this test is updated to match the new correct live state
// rather than left failing.
test("devos/contracts/ (S3) and devos/state/ (S4) are IMPLEMENTED with resolving closure_refs; every other root remains NOT_IMPLEMENTED/FOUNDATION_ACTIVE with no closure_ref", () => {
  const doc = loadManifest();
  const implementedRoots = [
    { path: "devos/contracts/", closure_ref: "ML-DEVOS-ADR-013" },
    { path: "devos/state/", closure_ref: "ML-DEVOS-ADR-014" },
  ];

  for (const expected of implementedRoots) {
    const root = doc.reserved_subsystem_roots.find((r) => r.path === expected.path);
    assert.equal(root.status, "IMPLEMENTED");
    assert.equal(root.closure_ref, expected.closure_ref);
    const matched = doc.closure_history.filter((e) => e.adr === root.closure_ref);
    assert.equal(matched.length, 1, "closure_ref must resolve to exactly one closure_history entry");
    assert.equal(matched[0].phase, root.owning_phase);
  }

  const implementedPaths = new Set(implementedRoots.map((r) => r.path));
  for (const root of doc.reserved_subsystem_roots) {
    if (implementedPaths.has(root.path)) continue;
    assert.notEqual(root.status, "IMPLEMENTED", `${root.path} must not be IMPLEMENTED -- only S3/S4 closed as of this release`);
    assert.ok(!Object.hasOwn(root, "closure_ref") || root.closure_ref === null, `${root.path} must not carry a non-null closure_ref`);
  }
});

test("IMPLEMENTED status without closure_ref fails", () => {
  const doc = cloneManifest();
  findRoot(doc).status = "IMPLEMENTED";
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("requires a non-null 'closure_ref'")), JSON.stringify(errors));
});

test("IMPLEMENTED status with closure_ref explicitly null fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = null;
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("requires a non-null 'closure_ref'")), JSON.stringify(errors));
});

test("a dangling closure_ref (a real ADR never linked from any closure_history entry) fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-004"; // real ADR, but not present in closure_history
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("does not resolve to any manifest.closure_history entry")), JSON.stringify(errors));
});

test("a closure_ref matching more than one closure_history entry (ambiguous) fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-005";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-005", { phase: root.owning_phase });
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-005", { phase: root.owning_phase, note: "A second, duplicate-ADR entry." });
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("resolves to 2 manifest.closure_history entries")), JSON.stringify(errors));
});

test("a closure_ref resolving to the WRONG owning phase fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc); // owning_phase: S8
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-007";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-007", { phase: "S5" }); // wrong phase
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("owning_phase is 'S8'") || e.includes("closure_ref must close the SAME phase")), JSON.stringify(errors));
});

test("a malformed closure_ref (not matching ML-DEVOS-ADR-NNN) fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ADR-011"; // missing the ML-DEVOS- prefix
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("must be a string matching the ML-DEVOS-ADR-NNN convention")), JSON.stringify(errors));
});

test("a matched closure_history entry with a malformed decision ID fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-008";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-008", { phase: root.owning_phase, decision: "decision-46" });
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("does not match the repository's D-NNN convention")), JSON.stringify(errors));
});

test("a matched closure_history entry with a malformed architect_sync ID fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-009";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-009", { phase: root.owning_phase, architect_sync: "AS-60" });
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("does not match the repository's ML-DEVOS-AS-NNN convention")), JSON.stringify(errors));
});

test("a matched closure_history entry missing decision/architect_sync/version fails on all three", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-010";
  // additionalProperties: false forbids omitting required closure_history
  // fields structurally, so exercise the semantic check with empty strings
  // (still "missing" in the non-empty-string sense this check enforces).
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-010", { phase: root.owning_phase, decision: "", architect_sync: "", version: "" });
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("missing a non-empty 'decision'")), JSON.stringify(errors));
  assert.ok(errors.some((e) => e.includes("missing a non-empty 'architect_sync'")), JSON.stringify(errors));
  assert.ok(errors.some((e) => e.includes("missing or invalid 'version'")), JSON.stringify(errors));
});

test("NOT_IMPLEMENTED root with a non-null closure_ref fails", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  assert.equal(root.status, "NOT_IMPLEMENTED");
  root.closure_ref = "ML-DEVOS-ADR-001";
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("'closure_ref' must be absent or null when status is 'NOT_IMPLEMENTED'")), JSON.stringify(errors));
});

test("FOUNDATION_ACTIVE root with a non-null closure_ref fails", () => {
  const doc = cloneManifest();
  const schemasRoot = findRoot(doc, "devos/schemas/");
  assert.equal(schemasRoot.status, "FOUNDATION_ACTIVE");
  schemasRoot.closure_ref = "ML-DEVOS-ADR-001";
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("'closure_ref' must be absent or null when status is 'FOUNDATION_ACTIVE'")), JSON.stringify(errors));
});

test("only devos/schemas/ may be FOUNDATION_ACTIVE: a second root claiming it fails", () => {
  const doc = cloneManifest();
  findRoot(doc).status = "FOUNDATION_ACTIVE"; // devos/orchestration/ is not devos/schemas/
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes(`only 'devos/schemas/' may be FOUNDATION_ACTIVE`)), JSON.stringify(errors));
});

test("a valid synthetic IMPLEMENTED root with a correctly matching closure_history entry passes", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-001";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-001", { phase: root.owning_phase });
  const errors = [];
  validate(doc, errors);
  assert.deepEqual(errors, [], `expected a fully valid IMPLEMENTED fixture to pass; got: ${JSON.stringify(errors)}`);
});

test("IMPLEMENTED status does not force executable_runtime_present to true (the two fields are independent)", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-003";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-003", { phase: root.owning_phase });
  // executable_runtime_present remains false (its live value) throughout.
  assert.equal(root.executable_runtime_present, false);
  const errors = [];
  validate(doc, errors);
  assert.deepEqual(errors, []);
});

test("executable_runtime_present must still be exactly false even for an IMPLEMENTED root (S2-F007 unaffected by RFC-015)", () => {
  const doc = cloneManifest();
  const root = findRoot(doc);
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-003";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-003", { phase: root.owning_phase });
  root.executable_runtime_present = true;
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("'executable_runtime_present' must be exactly false")), JSON.stringify(errors));
});

test("schema description states IMPLEMENTED grants no authority", () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const statusDescription = schema.properties.reserved_subsystem_roots.items.properties.status.description;
  assert.match(statusDescription, /grants no authority/i);
});

test("schema description states executable_runtime_present is defined by responsibility, not invocation method", () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const runtimeDescription = schema.properties.reserved_subsystem_roots.items.properties.executable_runtime_present.description;
  assert.match(runtimeDescription, /invoked manually or automatically/i);
  assert.match(runtimeDescription, /without becoming a Sentinel runtime subsystem/i);
});

test("the validator's exported API never exposes an accept/approve/certify-style function", () => {
  const exported = ["validate", "loadManifest", "MANIFEST_PATH"];
  for (const name of exported) {
    assert.doesNotMatch(name, /accept|approve|certify/i, `exported name '${name}' must not imply authority/acceptance`);
  }
});

test("the schema declares closure_ref as optional (not in the reserved-root required list)", () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const required = schema.properties.reserved_subsystem_roots.items.required;
  assert.ok(!required.includes("closure_ref"), "closure_ref must remain optional for backwards compatibility with pre-RFC-015 roots");
  assert.ok(Object.hasOwn(schema.properties.reserved_subsystem_roots.items.properties, "closure_ref"), "closure_ref must still be declared as an allowed property");
});

test("the schema's status enum is exactly the three RFC-015 lifecycle values, no more, no fewer", () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const statusEnum = schema.properties.reserved_subsystem_roots.items.properties.status.enum;
  assert.deepEqual(new Set(statusEnum), new Set(["NOT_IMPLEMENTED", "FOUNDATION_ACTIVE", "IMPLEMENTED"]));
});
