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
