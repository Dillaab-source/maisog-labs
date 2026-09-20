import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildTraceabilityReport,
  serializeReportJson,
  renderMarkdown,
  listScannedFiles,
  listDurableReferenceFiles,
} from "../devos/governance/traceability/generate-traceability.mjs";

// Sentinel Traceability V1 (ML-DEVOS-RFC-012 / ML-DEVOS-AS-037 / D-036) —
// focused tests against small synthetic temp-directory fixtures, never the
// real repository, so a change to real governance content can never make
// this suite flaky and this suite can never depend on real-repo state.

function makeFixtureRepo(prefix, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const [relPath, content] of Object.entries(files)) {
    const absPath = path.join(root, relPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content);
  }
  return root;
}

function baseConfig(overrides = {}) {
  return {
    scan: {
      includeDirs: ["docs", "records"],
      includeRootFiles: [],
      includeExtensions: [".md", ".txt"],
      excludePaths: [],
    },
    idFamilies: [
      {
        family: "FIX",
        pattern: "FIX-\\d{3}",
        canonical: { type: "file", dir: "records", extension: ".md" },
      },
    ],
    historicalExceptions: [],
    ...overrides,
  };
}

test("missing reference is reported as an ERROR when not a historical exception", () => {
  const root = makeFixtureRepo("traceability-missing-", {
    "records/FIX-001.md": "# FIX-001\n",
    "docs/notes.md": "See FIX-001 and also FIX-002 for background.\n",
  });
  const report = buildTraceabilityReport(root, baseConfig());

  assert.equal(report.summary.errorCount, 1);
  assert.equal(report.summary.warningCount, 0);
  const [error] = report.errors;
  assert.equal(error.kind, "missing-canonical-target");
  assert.equal(error.id, "FIX-002");
  assert.equal(error.sites.length, 1);
  assert.equal(error.sites[0].file, "docs/notes.md");
});

test("duplicate canonical definition is reported as an ERROR", () => {
  const root = makeFixtureRepo("traceability-duplicate-", {
    "records/FIX-001.md": "# FIX-001\n",
    "docs/notes.md": "References FIX-001.\n",
  });
  // Force a second canonical definition site for FIX-001 via a heading-type
  // family pointed at a file containing the id twice on different lines.
  const config = baseConfig({
    idFamilies: [
      {
        family: "FIX",
        pattern: "FIX-\\d{3}",
        canonical: { type: "heading", file: "docs/log.md", headingPattern: "^### (FIX-\\d{3})\\b" },
      },
    ],
  });
  fs.writeFileSync(
    path.join(root, "docs/log.md"),
    "### FIX-001 first\n\nbody\n\n### FIX-001 second\n\nbody\n"
  );

  const report = buildTraceabilityReport(root, config);

  assert.equal(report.summary.errorCount, 1);
  const [error] = report.errors;
  assert.equal(error.kind, "duplicate-canonical-definition");
  assert.equal(error.id, "FIX-001");
  assert.equal(error.sites.length, 2);
});

test("two consecutive generation runs against unchanged fixture state produce byte-identical output", () => {
  const root = makeFixtureRepo("traceability-determinism-", {
    "records/FIX-001.md": "# FIX-001\n",
    "records/FIX-002.md": "# FIX-002\n",
    "docs/a.md": "FIX-001 appears here.\n",
    "docs/b.md": "FIX-002 appears here, and FIX-001 again.\n",
  });
  const config = baseConfig();

  const reportA = buildTraceabilityReport(root, config);
  const reportB = buildTraceabilityReport(root, config);

  assert.equal(serializeReportJson(reportA), serializeReportJson(reportB));
  assert.equal(renderMarkdown(reportA), renderMarkdown(reportB));
});

test("an exact intentional non-reference occurrence becomes a visible WARNING, not a hard missing-target ERROR (AS39-F008)", () => {
  const root = makeFixtureRepo("traceability-refexception-", {
    "docs/notes.md": "Do not create FIX-042 from this discussion.\n",
  });
  const config = baseConfig({
    referenceExceptions: [
      {
        family: "FIX",
        id: "FIX-042",
        file: "docs/notes.md",
        linePattern: "Do not create FIX-042 from this discussion\\.",
        reason: "Test fixture: an explicit negated/hypothetical mention.",
      },
    ],
  });

  const report = buildTraceabilityReport(root, config);

  assert.equal(report.summary.errorCount, 0);
  const warning = report.warnings.find(w => w.id === "FIX-042");
  assert.ok(warning, "FIX-042 must appear as a warning, not be silently dropped");
  assert.equal(warning.kind, "intentional-noncanonical-mention");
  assert.equal(warning.sites.length, 1);
  assert.equal(warning.sites[0].file, "docs/notes.md");
});

test("a second genuine reference to the same missing id still produces an ERROR alongside the exempted WARNING", () => {
  const root = makeFixtureRepo("traceability-refexception-partial-", {
    "docs/notes.md": "Do not create FIX-042 from this discussion.\n",
    "docs/elsewhere.md": "See FIX-042 for the real requirement.\n",
  });
  const config = baseConfig({
    referenceExceptions: [
      {
        family: "FIX",
        id: "FIX-042",
        file: "docs/notes.md",
        linePattern: "Do not create FIX-042 from this discussion\\.",
        reason: "Test fixture: an explicit negated/hypothetical mention.",
      },
    ],
  });

  const report = buildTraceabilityReport(root, config);

  assert.equal(report.summary.errorCount, 1);
  const error = report.errors.find(e => e.id === "FIX-042");
  assert.ok(error, "the genuine unresolved reference in docs/elsewhere.md must still be an ERROR");
  assert.equal(error.kind, "missing-canonical-target");
  assert.equal(error.sites.length, 1);
  assert.equal(error.sites[0].file, "docs/elsewhere.md");

  const warning = report.warnings.find(w => w.id === "FIX-042");
  assert.ok(warning, "the exempted site must still appear as a visible WARNING");
  assert.equal(warning.sites.length, 1);
  assert.equal(warning.sites[0].file, "docs/notes.md");
});

test("a referenceException scoped to one id does not suppress an unrelated id's genuine missing-target ERROR", () => {
  const root = makeFixtureRepo("traceability-refexception-unrelated-", {
    "docs/notes.md": "Do not create FIX-042 from this discussion.\n",
    "docs/other.md": "FIX-043 is referenced here with no exception configured.\n",
  });
  const config = baseConfig({
    referenceExceptions: [
      {
        family: "FIX",
        id: "FIX-042",
        file: "docs/notes.md",
        linePattern: "Do not create FIX-042 from this discussion\\.",
        reason: "Test fixture: an explicit negated/hypothetical mention.",
      },
    ],
  });

  const report = buildTraceabilityReport(root, config);

  const fix043Error = report.errors.find(e => e.id === "FIX-043");
  assert.ok(fix043Error, "FIX-043 must be reported as a normal missing-canonical-target ERROR, unaffected by FIX-042's exception");
  assert.equal(fix043Error.kind, "missing-canonical-target");

  const fix043Warning = report.warnings.find(w => w.id === "FIX-043");
  assert.equal(fix043Warning, undefined, "FIX-043 must not receive any exception-derived warning");
});

test("an explicit historical exception downgrades a missing target to a visible WARNING, not a silently suppressed one", () => {
  const root = makeFixtureRepo("traceability-exception-", {
    "records/FIX-001.md": "# FIX-001\n",
    "docs/notes.md": "Legacy reference to FIX-999 predates current archiving discipline.\n",
  });
  const config = baseConfig({
    historicalExceptions: [{ id: "FIX-999", reason: "Pre-dates archiving discipline; test fixture." }],
  });

  const report = buildTraceabilityReport(root, config);

  assert.equal(report.summary.errorCount, 0);
  const warning = report.warnings.find(w => w.id === "FIX-999");
  assert.ok(warning, "FIX-999 must still appear, as a warning, not be silently dropped");
  assert.equal(warning.kind, "historical-exception-missing-canonical-record");
  assert.match(warning.reason, /archiving discipline/);
});

test("a canonical definition with no inbound reference elsewhere is an orphan WARNING, not an ERROR", () => {
  const root = makeFixtureRepo("traceability-orphan-", {
    "records/FIX-001.md": "# FIX-001\n",
  });
  const report = buildTraceabilityReport(root, baseConfig());

  assert.equal(report.summary.errorCount, 0);
  assert.equal(report.summary.warningCount, 1);
  assert.equal(report.warnings[0].kind, "orphan-no-inbound-reference");
  assert.equal(report.warnings[0].id, "FIX-001");
});

test("generated report and Markdown are explicitly marked non-authoritative", () => {
  const root = makeFixtureRepo("traceability-authority-", {
    "records/FIX-001.md": "# FIX-001\n",
    "docs/notes.md": "FIX-001.\n",
  });
  const report = buildTraceabilityReport(root, baseConfig());

  assert.equal(report.nonAuthoritative, true);
  assert.match(report.authorityStatement, /never overrides/);
  assert.match(renderMarkdown(report), /Derived — Non-Authoritative/);
});

test("scan respects excludePaths and includeExtensions", () => {
  const root = makeFixtureRepo("traceability-scan-", {
    "records/FIX-001.md": "# FIX-001\n",
    "docs/included.md": "FIX-001 referenced here.\n",
    "docs/ignored.log": "FIX-001 in a non-included extension.\n",
    "docs/excluded.md": "FIX-001 in an explicitly excluded file.\n",
  });
  const config = baseConfig({
    scan: {
      includeDirs: ["docs", "records"],
      includeRootFiles: [],
      includeExtensions: [".md"],
      excludePaths: ["docs/excluded.md"],
    },
  });

  const scanned = listScannedFiles(root, config);
  assert.ok(scanned.includes("docs/included.md"));
  assert.ok(!scanned.includes("docs/ignored.log"));
  assert.ok(!scanned.includes("docs/excluded.md"));
});

// ML-DEVOS-AS-040 / AS40-F001: rolling working/turn surfaces (a live
// coordination handoff/review/state document) must not feed hard
// missing-canonical-target detection, to avoid a self-referential feedback
// loop between this tool's own review process and its own findings.

test("a missing id mentioned only on an excluded rolling/tooling surface does not create a hard ERROR", () => {
  const root = makeFixtureRepo("traceability-workingsurface-excluded-only-", {
    "coordination/STATE.md": "Discussing the still-open FIX-999 finding.\n",
  });
  const config = baseConfig({
    scan: {
      includeDirs: ["docs", "records", "coordination"],
      includeRootFiles: [],
      includeExtensions: [".md", ".txt"],
      excludePaths: [],
      workingSurfaceExcludePaths: ["coordination/"],
    },
  });

  const report = buildTraceabilityReport(root, config);

  assert.equal(report.summary.errorCount, 0, "a mention only on an excluded working surface must not become a hard ERROR");
  assert.equal(report.errors.find(e => e.id === "FIX-999"), undefined);
});

test("the same missing id referenced on a durable included surface still creates an ERROR", () => {
  const root = makeFixtureRepo("traceability-workingsurface-durable-still-errors-", {
    "coordination/STATE.md": "Discussing the still-open FIX-999 finding.\n",
    "docs/spec.md": "The real requirement is FIX-999.\n",
  });
  const config = baseConfig({
    scan: {
      includeDirs: ["docs", "records", "coordination"],
      includeRootFiles: [],
      includeExtensions: [".md", ".txt"],
      excludePaths: [],
      workingSurfaceExcludePaths: ["coordination/"],
    },
  });

  const report = buildTraceabilityReport(root, config);

  const error = report.errors.find(e => e.id === "FIX-999");
  assert.ok(error, "a genuine reference on a durable (non-excluded) surface must still produce an ERROR");
  assert.equal(error.kind, "missing-canonical-target");
  assert.equal(error.sites.length, 1);
  assert.equal(error.sites[0].file, "docs/spec.md");
});

test("canonical definition discovery still works even when the reference scan excludes working/tooling surfaces", () => {
  const root = makeFixtureRepo("traceability-workingsurface-definitions-unaffected-", {
    "records/FIX-001.md": "# FIX-001\n",
    "coordination/STATE.md": "FIX-001 is mentioned only here, on an excluded surface.\n",
  });
  const config = baseConfig({
    scan: {
      includeDirs: ["docs", "records", "coordination"],
      includeRootFiles: [],
      includeExtensions: [".md", ".txt"],
      excludePaths: [],
      workingSurfaceExcludePaths: ["coordination/"],
    },
  });

  const report = buildTraceabilityReport(root, config);

  const family = report.idFamilies.find(f => f.family === "FIX");
  assert.equal(family.definitionCount, 1, "canonical definition discovery must be unaffected by working-surface exclusion");
  const entry = family.ids.find(i => i.id === "FIX-001");
  assert.equal(entry.definitionSites.length, 1);
  assert.equal(entry.definitionSites[0].file, "records/FIX-001.md");
  // Its only mention is on the excluded surface, so it correctly has zero
  // durable inbound references and surfaces as an orphan warning rather
  // than being hidden or miscounted.
  assert.equal(entry.inboundReferenceCount, 0);
  const orphan = report.warnings.find(w => w.id === "FIX-001" && w.kind === "orphan-no-inbound-reference");
  assert.ok(orphan);
});

test("listDurableReferenceFiles filters by working-surface path prefix", () => {
  const scanned = ["coordination/STATE.md", "docs/spec.md", "devos/governance/traceability/README.md", "worker/index.mjs"];
  const config = { scan: { workingSurfaceExcludePaths: ["coordination/", "devos/governance/traceability/"] } };

  const durable = listDurableReferenceFiles(scanned, config);

  assert.deepEqual(durable, ["docs/spec.md", "worker/index.mjs"]);
});
