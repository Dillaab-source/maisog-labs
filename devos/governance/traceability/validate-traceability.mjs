// Sentinel Traceability V1 (ML-DEVOS-RFC-012 / ML-DEVOS-AS-037 / D-036) —
// referential-integrity validator.
//
// This CLI regenerates the traceability report in-memory from the same
// pure functions the generator uses, then:
//   1. reports the ERROR/WARNING counts and every finding;
//   2. detects drift — a generated file on disk that does not match what a
//      fresh generation run would produce right now (AS37-F001's "malformed
//      generated output" failure mode: a stale index masquerading as
//      current evidence);
//   3. exits non-zero if any ERROR exists or if drift is detected.
//
// It never writes anything (AS37-F008: a validator may report integrity
// errors, it may not decide merge/deploy eligibility, accept risk, change
// status, or grant authority — and it does not mutate repository files to
// "fix" drift either; regenerate explicitly via generate-traceability.mjs).
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import {
  REPO_ROOT,
  INDEX_JSON_PATH,
  INDEX_MARKDOWN_PATH,
  loadConfig,
  buildTraceabilityReport,
  serializeReportJson,
  renderMarkdown,
} from "./generate-traceability.mjs";

export function validate(repoRoot = REPO_ROOT) {
  const config = loadConfig();
  const report = buildTraceabilityReport(repoRoot, config);
  const freshJson = serializeReportJson(report);
  const freshMarkdown = renderMarkdown(report);

  const onDiskJson = fs.existsSync(INDEX_JSON_PATH) ? fs.readFileSync(INDEX_JSON_PATH, "utf8") : null;
  const onDiskMarkdown = fs.existsSync(INDEX_MARKDOWN_PATH) ? fs.readFileSync(INDEX_MARKDOWN_PATH, "utf8") : null;

  const jsonDrift = onDiskJson !== freshJson;
  const markdownDrift = onDiskMarkdown !== freshMarkdown;

  return {
    report,
    drift: {
      jsonDrift,
      markdownDrift,
      jsonMissing: onDiskJson === null,
      markdownMissing: onDiskMarkdown === null,
    },
    ok: report.summary.errorCount === 0 && !jsonDrift && !markdownDrift,
  };
}

function main() {
  const result = validate();
  const { report, drift } = result;

  console.log(`Scanned ${report.scannedFileCount} files across ${report.idFamilies.length} ID families.`);
  console.log(`Errors: ${report.summary.errorCount}  Warnings: ${report.summary.warningCount}  Total canonical definitions: ${report.summary.totalDefinitions}`);

  for (const error of report.errors) {
    console.log(`ERROR [${error.kind}] ${error.family} ${error.id}: ${error.message}`);
  }
  for (const warning of report.warnings) {
    console.log(`WARNING [${warning.kind}] ${warning.family} ${warning.id}: ${warning.message}`);
  }

  if (drift.jsonMissing || drift.markdownMissing) {
    console.log("DRIFT: generated index file(s) missing — run generate-traceability.mjs.");
  } else if (drift.jsonDrift || drift.markdownDrift) {
    console.log("DRIFT: on-disk generated index does not match a fresh generation run — run generate-traceability.mjs to regenerate.");
  } else {
    console.log("No drift: on-disk generated index matches a fresh generation run.");
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
