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
import {
  validateRfcProjection,
  RFC_CANONICAL_STATUS_LINE,
} from "../devos/governance/traceability/validate-traceability.mjs";

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

// ---------------------------------------------------------------------------
// ML-DEVOS-RFC-023 BC-10 (D-128): RFC lifecycle-projection checks, against
// small synthetic fixtures only.

const CANONICAL = "Status: See `devos/changes/rfcs/README.md` for the current lifecycle projection; Decisions and ADRs remain authoritative.";

function rfcBody(id, statusLines = [CANONICAL], extra = "") {
  return [`# ${id}: Fixture`, "", ...statusLines, "", "Body text.", extra].join("\n");
}

function rfcIndex(rows) {
  return [
    "# RFCs", "", "| RFC | Title | Class | Status | Authority refs |", "|---|---|---|---|---|",
    ...rows.map(([id, status, refs]) => `| ${id} | Fixture | ARCHITECTURE | ${status} | ${refs} |`), "",
  ].join("\n");
}

function projectionFixture(overrides = {}) {
  return makeFixtureRepo("trace-rfc-", {
    "devos/changes/rfcs/ML-DEVOS-RFC-001.md": rfcBody("ML-DEVOS-RFC-001"),
    "devos/changes/rfcs/ML-DEVOS-RFC-002.md": rfcBody("ML-DEVOS-RFC-002"),
    "devos/changes/rfcs/README.md": rfcIndex([
      ["ML-DEVOS-RFC-001", "ACCEPTED", "D-001; ML-DEVOS-AS-001; ML-DEVOS-ADR-001"],
      ["ML-DEVOS-RFC-002", "DRAFT", "D-002"],
    ]),
    "brain/DECISION_LOG.md": "# Decisions\n\n### D-001 — Accept\n\nAccepts ML-DEVOS-RFC-001.\n\n### D-002 — Draft\n\nAuthorizes drafting ML-DEVOS-RFC-002.\n",
    "devos/changes/architect-syncs/ML-DEVOS-AS-001.md": "Architect Sync: ML-DEVOS-AS-001\n\nApproves ML-DEVOS-RFC-001.\n",
    "devos/changes/architect-syncs/README.md": "Mentions ML-DEVOS-RFC-001 but is not a Sync record.\n",
    "devos/changes/adrs/ML-DEVOS-ADR-001.md": "# ML-DEVOS-ADR-001\n\nCloses ML-DEVOS-RFC-001.\n",
    ...overrides,
  });
}

const codes = (list) => list.map((f) => `${f.code}:${f.rfc}`).sort();

test("BC-10: the validator's canonical Status line is byte-identical to the D-128 text", () => {
  assert.equal(RFC_CANONICAL_STATUS_LINE, CANONICAL);
});

test("BC-10 (10): a fully migrated valid fixture has zero RFC-projection findings", () => {
  const r = validateRfcProjection(projectionFixture());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.rfcCount, 2);
  assert.equal(r.rowCount, 2);
});

test("BC-10 (1): an RFC file with no index row is an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/README.md": rfcIndex([["ML-DEVOS-RFC-001", "ACCEPTED", "D-001"]]),
  }));
  assert.deepEqual(codes(r.errors), ["RFC_INDEX_ROW_MISSING:ML-DEVOS-RFC-002"]);
});

test("BC-10 (2): an index row for a nonexistent RFC is an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/README.md": rfcIndex([
      ["ML-DEVOS-RFC-001", "ACCEPTED", "D-001"],
      ["ML-DEVOS-RFC-002", "DRAFT", "D-002"],
      ["ML-DEVOS-RFC-003", "DRAFT", "D-002"],
    ]),
  }));
  assert.deepEqual(codes(r.errors), ["RFC_INDEX_ROW_ORPHAN:ML-DEVOS-RFC-003"]);
});

test("BC-10 (3): a duplicate RFC row is an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/README.md": rfcIndex([
      ["ML-DEVOS-RFC-001", "ACCEPTED", "D-001"],
      ["ML-DEVOS-RFC-002", "DRAFT", "D-002"],
      ["ML-DEVOS-RFC-002", "ACCEPTED", "D-002"],
    ]),
  }));
  assert.deepEqual(codes(r.errors), ["RFC_INDEX_ROW_DUPLICATE:ML-DEVOS-RFC-002"]);
});

test("BC-10 (4): a newer citing Decision / ADR / Architect Sync is a WARNING RFC_STATUS_PROJECTION_STALE, never an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "brain/DECISION_LOG.md": "# Decisions\n\n### D-001 — Accept\n\nAccepts ML-DEVOS-RFC-001.\n\n### D-002 — Draft\n\nAuthorizes drafting ML-DEVOS-RFC-002.\n\n### D-003 — Later\n\nSupersedes part of ML-DEVOS-RFC-001.\n",
    "devos/changes/architect-syncs/ML-DEVOS-AS-002.md": "Architect Sync: ML-DEVOS-AS-002\n\nReviews ML-DEVOS-RFC-001 again.\n",
  }));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(codes(r.warnings), ["RFC_STATUS_PROJECTION_STALE:ML-DEVOS-RFC-001"]);
  assert.match(r.warnings[0].message, /D-003/);
  assert.match(r.warnings[0].message, /ML-DEVOS-AS-002/);
});

test("BC-10 (5): noncanonical body Status bytes (old lifecycle prose, trailing whitespace, CR) are ERRORs", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/ML-DEVOS-RFC-001.md": rfcBody("ML-DEVOS-RFC-001", ["Status: `ACCEPTED` — accepted by D-001."]),
    "devos/changes/rfcs/ML-DEVOS-RFC-002.md": rfcBody("ML-DEVOS-RFC-002", [`${CANONICAL} `]),
  }));
  assert.deepEqual(codes(r.errors), ["RFC_BODY_STATUS_NONCANONICAL:ML-DEVOS-RFC-001", "RFC_BODY_STATUS_NONCANONICAL:ML-DEVOS-RFC-002"]);
  const crlf = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/ML-DEVOS-RFC-002.md": rfcBody("ML-DEVOS-RFC-002").replace(/\n/g, "\r\n"),
  }));
  assert.deepEqual(codes(crlf.errors), ["RFC_BODY_STATUS_MISSING_OR_MISPLACED:ML-DEVOS-RFC-002"]);
});

test("BC-10 (6): a missing Status line, or one not at line 3, is an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/ML-DEVOS-RFC-001.md": rfcBody("ML-DEVOS-RFC-001", ["No status here."]),
    "devos/changes/rfcs/ML-DEVOS-RFC-002.md": ["# ML-DEVOS-RFC-002: Fixture", "", "Intro.", "", CANONICAL, ""].join("\n"),
  }));
  assert.deepEqual(codes(r.errors), ["RFC_BODY_STATUS_MISSING_OR_MISPLACED:ML-DEVOS-RFC-001", "RFC_BODY_STATUS_MISSING_OR_MISPLACED:ML-DEVOS-RFC-002"]);
});

test("BC-10 (7): a second Status line is an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/ML-DEVOS-RFC-001.md": rfcBody("ML-DEVOS-RFC-001", [CANONICAL], "\nStatus: `IMPLEMENTED`\n"),
  }));
  assert.deepEqual(codes(r.errors), ["RFC_BODY_STATUS_DUPLICATE:ML-DEVOS-RFC-001"]);
});

test("BC-10 (8): a lifecycle status outside the vocabulary is an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/README.md": rfcIndex([
      ["ML-DEVOS-RFC-001", "IMPLEMENTED AND CLOSED", "D-001"],
      ["ML-DEVOS-RFC-002", "`DRAFT`", "D-002"],
    ]),
  }));
  assert.deepEqual(codes(r.errors), ["RFC_STATUS_VOCABULARY:ML-DEVOS-RFC-001"]);
});

test("BC-10 (9): an unresolved authority ref is an ERROR", () => {
  const r = validateRfcProjection(projectionFixture({
    "devos/changes/rfcs/README.md": rfcIndex([
      ["ML-DEVOS-RFC-001", "ACCEPTED", "D-001; D-099; ML-DEVOS-AS-050"],
      ["ML-DEVOS-RFC-002", "DRAFT", "PR #7"],
    ]),
  }));
  assert.deepEqual(codes(r.errors), [
    "RFC_AUTHORITY_REF_UNRESOLVED:ML-DEVOS-RFC-001",
    "RFC_AUTHORITY_REF_UNRESOLVED:ML-DEVOS-RFC-001",
    "RFC_AUTHORITY_REF_UNRESOLVED:ML-DEVOS-RFC-002",
  ]);
});
