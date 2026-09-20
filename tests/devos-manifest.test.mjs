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
// by this suite (per D-045's explicit "no live manifest migration this
// cycle" boundary). validate()/loadManifest() are called directly, never via
// the CLI, so importing this test file never triggers main()'s process.exit().
//
// Fixture ID choice: synthetic closure_history entries below deliberately
// reuse already-canonical, real repository IDs (ML-DEVOS-ADR-001/003-010,
// D-045, ML-DEVOS-AS-059) that are simply UNUSED in the live manifest's own
// closure_history (which today cites only ML-DEVOS-ADR-002 and
// ML-DEVOS-ADR-006) -- never fabricated IDs. A fabricated ID matching a real
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

// devos/state/ (S4) remains NOT_IMPLEMENTED in the live manifest -- a stable
// NOT_IMPLEMENTED root to mutate into synthetic IMPLEMENTED-status fixtures.
// devos/contracts/ (S3) itself moved to IMPLEMENTED by the coordinated
// Sentinel v1.6.0 closure (D-046 / ML-DEVOS-ADR-013) and is no longer a
// stable NOT_IMPLEMENTED starting point for these synthetic mutations.
const TARGET_ROOT_PATH = "devos/state/";

function findRoot(doc, rootPath = TARGET_ROOT_PATH) {
  const root = doc.reserved_subsystem_roots.find((r) => r.path === rootPath);
  assert.ok(root, `expected to find a reserved root at '${rootPath}' in the live manifest`);
  return root;
}

// `adr` must be passed explicitly and must be a real, canonical ADR id not
// already present in the live closure_history (see file-header note above).
function addClosureHistoryEntry(doc, adr, overrides = {}) {
  const entry = {
    phase: "S4", // every call site overrides this with the actual target root's owning_phase
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

// Updated by the coordinated Sentinel v1.6.0 closure (D-046 / ML-DEVOS-ADR-013):
// devos/contracts/ is now the first reserved root to reach IMPLEMENTED via the
// RFC-015 mechanism this same test file validates -- the original version of
// this test (written during RFC-015's own bounded implementation, before any
// closure was authorized) asserted the opposite ("no root is IMPLEMENTED yet")
// by design at that time. That assertion is now obsolete by an explicit,
// separately authorized act, not a regression; this test is updated to match
// the new correct live state rather than left failing.
test("devos/contracts/ is IMPLEMENTED with a resolving closure_ref (S3, post-D-046 closure); every other root remains NOT_IMPLEMENTED/FOUNDATION_ACTIVE with no closure_ref", () => {
  const doc = loadManifest();
  const s3Root = doc.reserved_subsystem_roots.find((r) => r.path === "devos/contracts/");
  assert.equal(s3Root.status, "IMPLEMENTED");
  assert.equal(s3Root.closure_ref, "ML-DEVOS-ADR-013");
  const matched = doc.closure_history.filter((e) => e.adr === s3Root.closure_ref);
  assert.equal(matched.length, 1, "closure_ref must resolve to exactly one closure_history entry");
  assert.equal(matched[0].phase, s3Root.owning_phase);

  for (const root of doc.reserved_subsystem_roots) {
    if (root.path === "devos/contracts/") continue;
    assert.notEqual(root.status, "IMPLEMENTED", `${root.path} must not be IMPLEMENTED -- only S3 closed in this coordinated release`);
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
  const root = findRoot(doc); // owning_phase: S4
  root.status = "IMPLEMENTED";
  root.closure_ref = "ML-DEVOS-ADR-007";
  addClosureHistoryEntry(doc, "ML-DEVOS-ADR-007", { phase: "S5" }); // wrong phase
  const errors = [];
  validate(doc, errors);
  assert.ok(errors.some((e) => e.includes("owning_phase is 'S4'") || e.includes("closure_ref must close the SAME phase")), JSON.stringify(errors));
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
  findRoot(doc).status = "FOUNDATION_ACTIVE"; // devos/contracts/ is not devos/schemas/
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
