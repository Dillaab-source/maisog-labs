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
import path from "node:path";
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

// ---------------------------------------------------------------------------
// ML-DEVOS-RFC-023 BC-10 (D-128) — RFC lifecycle-projection checks.
//
// devos/changes/rfcs/README.md is the single maintained *projection* of
// current RFC lifecycle status. It is subordinate: Decisions, ADRs and
// immutable Architect Sync records remain authority and history, and these
// checks never treat the projection as authoritative. They only verify that
// the projection is structurally complete, that every reference in it
// resolves, and that RFC bodies carry no mutable lifecycle prose.
// Pure and read-only; independent of the generated traceability index.
export const RFC_CANONICAL_STATUS_LINE =
  "Status: See `devos/changes/rfcs/README.md` for the current lifecycle projection; Decisions and ADRs remain authoritative.";
export const RFC_LIFECYCLE_STATUSES = Object.freeze(["DRAFT", "UNDER_ARCHITECT_SYNC", "ACCEPTED", "REJECTED", "SUPERSEDED"]);

const RFC_DIR = "devos/changes/rfcs";
const RFC_INDEX = `${RFC_DIR}/README.md`;
const DECISION_LOG = "brain/DECISION_LOG.md";
const ADR_DIR = "devos/changes/adrs";
const SYNC_DIR = "devos/changes/architect-syncs";
const RFC_FILE_RE = /^(ML-DEVOS-RFC-\d{3})\.md$/;
const RFC_ROW_RE = /^\|\s*(ML-DEVOS-RFC-\d{3})\s*\|/;
const RFC_ID_RE = /ML-DEVOS-RFC-\d{3}/g;
const REF_FAMILIES = [
  { family: "D", re: /^D-(\d{3,})$/ },
  { family: "ML-DEVOS-ADR", re: /^ML-DEVOS-ADR-(\d{3,})$/ },
  { family: "ML-DEVOS-AS", re: /^ML-DEVOS-AS-(\d{3,})$/ },
];

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

function listIds(dir, re) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((name) => re.exec(name)?.[1]).filter(Boolean).sort();
}

function refFamily(ref) {
  for (const { family, re } of REF_FAMILIES) {
    const m = re.exec(ref);
    if (m) return { family, number: Number(m[1]) };
  }
  return null;
}

// The authority records that can cite an RFC, each as { ref, family, number, text }.
function authorityRecords(repoRoot) {
  const records = [];
  const log = readIfExists(path.join(repoRoot, DECISION_LOG));
  if (log) {
    const sections = log.split(/^(?=### D-\d{3,}\b)/m);
    for (const section of sections) {
      const m = /^### (D-(\d{3,}))\b/.exec(section);
      if (m) records.push({ ref: m[1], family: "D", number: Number(m[2]), text: section });
    }
  }
  for (const [dir, family, re] of [
    [ADR_DIR, "ML-DEVOS-ADR", /^(ML-DEVOS-ADR-(\d{3,}))\.md$/],
    [SYNC_DIR, "ML-DEVOS-AS", /^(ML-DEVOS-AS-(\d{3,}))\.md$/],
  ]) {
    const abs = path.join(repoRoot, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      const m = re.exec(name);
      if (m) records.push({ ref: m[1], family, number: Number(m[2]), text: fs.readFileSync(path.join(abs, name), "utf8") });
    }
  }
  return records;
}

export function validateRfcProjection(repoRoot = REPO_ROOT) {
  const errors = [];
  const warnings = [];
  const finding = (list, code, rfc, message) => list.push({ code, rfc, message });

  const rfcIds = listIds(path.join(repoRoot, RFC_DIR), RFC_FILE_RE);
  const records = authorityRecords(repoRoot);
  const known = new Set(records.map((r) => r.ref));

  // Body status line: exactly one `Status:` line, byte-identical, at line 3,
  // between a blank line 2 and a blank line 4.
  for (const id of rfcIds) {
    const lines = fs.readFileSync(path.join(repoRoot, RFC_DIR, `${id}.md`), "utf8").split("\n");
    const statusLines = lines.map((line, i) => ({ line, n: i + 1 })).filter(({ line }) => line.startsWith("Status:"));
    const atThree = lines[2] ?? "";
    if (statusLines.length === 0 || !atThree.startsWith("Status:") || lines[1] !== "" || (lines[3] ?? "") !== "") {
      finding(errors, "RFC_BODY_STATUS_MISSING_OR_MISPLACED", id,
        `${id} must carry the canonical Status line at line 3, between blank lines 2 and 4 (Status lines found at: ${statusLines.map((s) => s.n).join(", ") || "none"}).`);
    } else if (atThree !== RFC_CANONICAL_STATUS_LINE) {
      finding(errors, "RFC_BODY_STATUS_NONCANONICAL", id, `${id} line 3 is not byte-identical to the canonical Status line (mutable lifecycle prose, trailing whitespace or CR).`);
    }
    if (statusLines.length > 1) {
      finding(errors, "RFC_BODY_STATUS_DUPLICATE", id, `${id} has ${statusLines.length} lines beginning "Status:" (lines ${statusLines.map((s) => s.n).join(", ")}); only line 3 may.`);
    }
  }

  // Projection rows.
  const index = readIfExists(path.join(repoRoot, RFC_INDEX));
  const rows = new Map();
  if (index == null) {
    finding(errors, "RFC_INDEX_MISSING", RFC_INDEX, `${RFC_INDEX} is missing.`);
  } else {
    for (const line of index.split("\n")) {
      const m = RFC_ROW_RE.exec(line);
      if (!m) continue;
      const id = m[1];
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (rows.has(id)) {
        finding(errors, "RFC_INDEX_ROW_DUPLICATE", id, `${id} has more than one projection row.`);
        continue;
      }
      const status = (cells[3] ?? "").replace(/`/g, "");
      const refs = (cells[4] ?? "").split(";").map((r) => r.replace(/`/g, "").trim()).filter(Boolean);
      rows.set(id, { status, refs });
    }
  }
  for (const id of rfcIds) {
    if (index != null && !rows.has(id)) finding(errors, "RFC_INDEX_ROW_MISSING", id, `${id} has no row in ${RFC_INDEX}.`);
  }
  for (const [id, row] of rows) {
    if (!rfcIds.includes(id)) finding(errors, "RFC_INDEX_ROW_ORPHAN", id, `${RFC_INDEX} has a row for ${id}, but no ${RFC_DIR}/${id}.md exists.`);
    if (!RFC_LIFECYCLE_STATUSES.includes(row.status)) {
      finding(errors, "RFC_STATUS_VOCABULARY", id, `${id} status "${row.status}" is not one of ${RFC_LIFECYCLE_STATUSES.join(", ")}.`);
    }
    if (row.refs.length === 0) finding(errors, "RFC_AUTHORITY_REF_UNRESOLVED", id, `${id} row lists no authority refs.`);
    for (const ref of row.refs) {
      if (!refFamily(ref) || !known.has(ref)) {
        finding(errors, "RFC_AUTHORITY_REF_UNRESOLVED", id, `${id} authority ref "${ref}" does not resolve to a Decision heading, ADR or Architect Sync record.`);
      }
    }

    // Heuristic (WARNING only): a Decision / ADR / Architect Sync citing this
    // RFC that is newer than every ref of the same family in the row. Only
    // families present in the row are compared; numbering is per family.
    const maxByFamily = new Map();
    for (const ref of row.refs) {
      const f = refFamily(ref);
      if (f) maxByFamily.set(f.family, Math.max(maxByFamily.get(f.family) ?? 0, f.number));
    }
    const newer = records.filter((r) => maxByFamily.has(r.family) && r.number > maxByFamily.get(r.family)
      && (r.text.match(RFC_ID_RE) ?? []).includes(id));
    if (newer.length) {
      finding(warnings, "RFC_STATUS_PROJECTION_STALE", id,
        `${id} is cited by ${newer.map((r) => r.ref).join(", ")}, newer than every same-family ref in its projection row; the projection may be stale (heuristic).`);
    }
  }
  return { errors, warnings, rfcCount: rfcIds.length, rowCount: rows.size };
}

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
    rfcProjection: validateRfcProjection(repoRoot),
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

  const rfc = result.rfcProjection;
  console.log(`RFC lifecycle projection (ML-DEVOS-RFC-023 BC-10): ${rfc.rfcCount} RFC files, ${rfc.rowCount} rows. Errors: ${rfc.errors.length}  Warnings: ${rfc.warnings.length}`);
  for (const error of rfc.errors) {
    console.log(`ERROR [${error.code}] ${error.rfc}: ${error.message}`);
  }
  for (const warning of rfc.warnings) {
    console.log(`WARNING [${warning.code}] ${warning.rfc}: ${warning.message}`);
  }

  if (!result.ok || rfc.errors.length) {
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
