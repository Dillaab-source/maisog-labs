// Sentinel Traceability V1 (ML-DEVOS-RFC-012 / ML-DEVOS-AS-037 / D-036) —
// deterministic static traceability graph generator.
//
// This module discovers canonical governance-record definitions from
// existing authoritative surfaces (never a second manually maintained
// matrix, AS37-F003), extracts every textual reference to a durable
// governance ID across a bounded set of repository files, and computes
// structural-integrity findings: ERROR for a missing canonical target or a
// duplicate canonical definition, WARNING for a canonical record with no
// inbound reference elsewhere or an explicitly configured historical
// exception (AS37-F004/F005).
//
// Every exported function here is pure and read-only over the filesystem —
// it never writes, mutates, or grants authority over anything (AS37-F008,
// RFC-012 "Security / trust impact"). The two CLI-only side effects (writing
// the generated JSON/Markdown index files) live in main() at the bottom,
// which only runs when this file is executed directly — tests and
// validate-traceability.mjs import the pure functions above it without
// triggering any file write.
//
// Determinism (AS37-F001's "malformed/nondeterministic" ERROR class): no
// wall-clock timestamp, process id, random value, or unsorted filesystem
// iteration order ever reaches the generated output. Every array is sorted
// before serialization; two consecutive runs against unchanged repository
// state must therefore produce byte-identical output.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
export const CONFIG_PATH = path.join(__dirname, "traceability.config.json");
export const INDEX_JSON_PATH = path.join(__dirname, "traceability-index.json");
export const INDEX_MARKDOWN_PATH = path.join(__dirname, "TRACEABILITY_INDEX.md");

export function loadConfig(configPath = CONFIG_PATH) {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function normalizeRelPath(repoRoot, absPath) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

function isExcluded(relPath, excludePaths) {
  return excludePaths.includes(relPath);
}

// Deterministic, sorted, recursive file listing under repoRoot/dir whose
// extension is in includeExtensions, honoring excludePaths (relative to
// repoRoot). Never follows symlinks (readdir default), never touches
// dotdirs (node_modules/.git/.next/.wrangler* are simply not in
// includeDirs at all, so they are never walked in the first place).
function listFilesRecursive(repoRoot, startDir, includeExtensions, excludePaths) {
  const results = [];
  const absStart = path.join(repoRoot, startDir);
  if (!fs.existsSync(absStart)) return results;

  function walk(absDir) {
    const entries = fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absPath = path.join(absDir, entry.name);
      const relPath = normalizeRelPath(repoRoot, absPath);
      if (isExcluded(relPath, excludePaths)) continue;
      if (entry.isDirectory()) {
        walk(absPath);
      } else if (entry.isFile() && includeExtensions.includes(path.extname(entry.name))) {
        results.push(relPath);
      }
    }
  }
  walk(absStart);
  return results.sort();
}

export function listScannedFiles(repoRoot, config) {
  const { includeDirs, includeRootFiles, includeExtensions, excludePaths } = config.scan;
  const files = [];
  for (const dir of includeDirs) {
    files.push(...listFilesRecursive(repoRoot, dir, includeExtensions, excludePaths));
  }
  for (const rootFile of includeRootFiles) {
    const absPath = path.join(repoRoot, rootFile);
    if (fs.existsSync(absPath) && !isExcluded(rootFile, excludePaths)) {
      files.push(rootFile);
    }
  }
  return [...new Set(files)].sort();
}

function readLines(repoRoot, relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8").split("\n");
}

// --- Canonical-definition discovery, one strategy per config "type" ---

function discoverFileDefinitions(repoRoot, family, canonical) {
  const definitions = new Map(); // id -> [{file, line}]
  const absDir = path.join(repoRoot, canonical.dir);
  if (!fs.existsSync(absDir)) return definitions;
  const pattern = new RegExp(`^${family.pattern}$`);
  const entries = fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name) !== canonical.extension) continue;
    const id = path.basename(entry.name, canonical.extension);
    if (!pattern.test(id)) continue; // e.g. README.md sitting alongside RFC files
    const relPath = normalizeRelPath(repoRoot, path.join(absDir, entry.name));
    const list = definitions.get(id) ?? [];
    list.push({ file: relPath, line: 1 });
    definitions.set(id, list);
  }
  return definitions;
}

function discoverPatternLineDefinitions(repoRoot, canonical, linePattern) {
  const definitions = new Map();
  if (!fs.existsSync(path.join(repoRoot, canonical.file))) return definitions;
  const lines = readLines(repoRoot, canonical.file);
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(linePattern);
    if (!match) continue;
    const id = match[1];
    const list = definitions.get(id) ?? [];
    list.push({ file: canonical.file, line: i + 1 });
    definitions.set(id, list);
  }
  return definitions;
}

function discoverJsonArrayFieldDefinitions(repoRoot, canonical) {
  const definitions = new Map();
  const absPath = path.join(repoRoot, canonical.file);
  if (!fs.existsSync(absPath)) return definitions;
  const data = JSON.parse(fs.readFileSync(absPath, "utf8"));
  const array = data[canonical.arrayField];
  if (!Array.isArray(array)) return definitions;
  array.forEach((item, index) => {
    const id = item?.[canonical.idField];
    if (typeof id !== "string") return;
    const list = definitions.get(id) ?? [];
    list.push({ file: canonical.file, line: index + 1 }); // "line" here is the array index (1-based) — JSON has no line-accurate cheap mapping without a full parser; documented in README
    definitions.set(id, list);
  });
  return definitions;
}

function discoverDefinitionsForFamily(repoRoot, family) {
  const { canonical } = family;
  switch (canonical.type) {
    case "file":
      return discoverFileDefinitions(repoRoot, family, canonical);
    case "heading":
      return discoverPatternLineDefinitions(repoRoot, canonical, new RegExp(canonical.headingPattern));
    case "table-row":
      return discoverPatternLineDefinitions(repoRoot, canonical, new RegExp(canonical.rowPattern));
    case "line-start":
      return discoverPatternLineDefinitions(repoRoot, canonical, new RegExp(canonical.linePattern));
    case "json-array-field":
      return discoverJsonArrayFieldDefinitions(repoRoot, canonical);
    default:
      throw new Error(`traceability config: unknown canonical.type "${canonical.type}" for family ${family.family}`);
  }
}

// --- Reference extraction (every textual occurrence of any family's ID pattern, across every scanned file) ---

function extractReferencesForFamily(repoRoot, family, scannedFiles) {
  const occurrences = new Map(); // id -> [{file, line}]
  const globalPattern = new RegExp(family.pattern, "g");
  for (const relPath of scannedFiles) {
    const lines = readLines(repoRoot, relPath);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      let match;
      globalPattern.lastIndex = 0;
      while ((match = globalPattern.exec(line)) !== null) {
        const id = match[0];
        const list = occurrences.get(id) ?? [];
        list.push({ file: relPath, line: i + 1 });
        occurrences.set(id, list);
        if (match.index === globalPattern.lastIndex) globalPattern.lastIndex += 1; // guard against zero-width match loops
      }
    }
  }
  return occurrences;
}

function sortLocationList(list) {
  return [...list].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

function locationsEqual(a, b) {
  return a.file === b.file && a.line === b.line;
}

// --- Report assembly ---

export function buildTraceabilityReport(repoRoot = REPO_ROOT, config = loadConfig()) {
  const scannedFiles = listScannedFiles(repoRoot, config);
  const historicalExceptionMap = new Map(config.historicalExceptions.map(entry => [entry.id, entry.reason]));

  const families = [];
  const errors = [];
  const warnings = [];

  for (const family of [...config.idFamilies].sort((a, b) => a.family.localeCompare(b.family))) {
    const definitions = discoverDefinitionsForFamily(repoRoot, family);
    const references = extractReferencesForFamily(repoRoot, family, scannedFiles);

    // Duplicate canonical definition — ERROR.
    const definitionIds = [...definitions.keys()].sort();
    for (const id of definitionIds) {
      const sites = sortLocationList(definitions.get(id));
      if (sites.length > 1) {
        errors.push({
          kind: "duplicate-canonical-definition",
          family: family.family,
          id,
          sites,
          message: `${id} has ${sites.length} canonical definitions; exactly one is required.`,
        });
      }
    }

    // Missing canonical target for a reference — ERROR, unless the id is an
    // explicitly configured historical exception (then WARNING, AS37-F005).
    const referencedIds = [...references.keys()].sort();
    for (const id of referencedIds) {
      if (definitions.has(id)) continue;
      const sites = sortLocationList(references.get(id));
      if (historicalExceptionMap.has(id)) {
        warnings.push({
          kind: "historical-exception-missing-canonical-record",
          family: family.family,
          id,
          sites,
          reason: historicalExceptionMap.get(id),
          message: `${id} is referenced but has no canonical record; explicit historical exception (not silently suppressed).`,
        });
      } else {
        errors.push({
          kind: "missing-canonical-target",
          family: family.family,
          id,
          sites,
          message: `${id} is referenced but has no canonical record in ${family.family}'s configured canonical source.`,
        });
      }
    }

    // Orphan — a canonical definition with no reference anywhere else —
    // WARNING (AS37-F004: potential orphans remain warnings in V1).
    const idEntries = [];
    for (const id of definitionIds) {
      const definitionSites = sortLocationList(definitions.get(id));
      const allOccurrences = sortLocationList(references.get(id) ?? []);
      const inbound = allOccurrences.filter(occ => !definitionSites.some(def => locationsEqual(def, occ)));
      if (inbound.length === 0) {
        warnings.push({
          kind: "orphan-no-inbound-reference",
          family: family.family,
          id,
          sites: definitionSites,
          message: `${id} is canonically defined but has no inbound reference anywhere else in the scanned surface.`,
        });
      }
      idEntries.push({
        id,
        definitionSites,
        occurrenceCount: allOccurrences.length,
        inboundReferenceCount: inbound.length,
      });
    }

    families.push({
      family: family.family,
      pattern: family.pattern,
      canonicalType: family.canonical.type,
      canonicalSource:
        family.canonical.type === "file"
          ? family.canonical.dir
          : family.canonical.file,
      definitionCount: definitionIds.length,
      ids: idEntries,
    });
  }

  errors.sort((a, b) => a.family.localeCompare(b.family) || a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind));
  warnings.sort((a, b) => a.family.localeCompare(b.family) || a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind));

  return {
    schemaVersion: "1",
    nonAuthoritative: true,
    authorityStatement:
      "This file is derived, non-authoritative traceability evidence generated by devos/governance/traceability/generate-traceability.mjs (ML-DEVOS-RFC-012 / ML-DEVOS-AS-037 / D-036). It never overrides the frozen architecture, active governance kernel, brain/DECISION_LOG.md, ADRs, durable Architect Syncs, or any requirement/risk/test source record it summarizes.",
    scannedFileCount: scannedFiles.length,
    idFamilies: families,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      totalDefinitions: families.reduce((sum, f) => sum + f.definitionCount, 0),
    },
    errors,
    warnings,
  };
}

// --- Deterministic JSON serialization (stable key order, no timestamps) ---

export function serializeReportJson(report) {
  return JSON.stringify(report, null, 2) + "\n";
}

// --- Human-readable Markdown rendering (pure function of the same report) ---

export function renderMarkdown(report) {
  const lines = [];
  lines.push("# Traceability Index (Derived — Non-Authoritative)");
  lines.push("");
  lines.push(
    "This file is generated by `devos/governance/traceability/generate-traceability.mjs`. It is derived evidence/navigation only and is never a source of authority — see `README.md` in this directory and `ML-DEVOS-RFC-012` / `ML-DEVOS-AS-037` / `D-036`. Do not hand-edit; regenerate instead."
  );
  lines.push("");
  lines.push(`Scanned files: ${report.scannedFileCount}`);
  lines.push("");
  lines.push(`**Errors: ${report.summary.errorCount}** &nbsp;&nbsp; **Warnings: ${report.summary.warningCount}** &nbsp;&nbsp; Total canonical definitions: ${report.summary.totalDefinitions}`);
  lines.push("");

  lines.push("## Errors");
  lines.push("");
  if (report.errors.length === 0) {
    lines.push("None.");
  } else {
    for (const error of report.errors) {
      lines.push(`- **${error.kind}** (\`${error.family}\`, \`${error.id}\`): ${error.message}`);
      for (const site of error.sites) {
        lines.push(`  - ${site.file}:${site.line}`);
      }
    }
  }
  lines.push("");

  lines.push("## Warnings");
  lines.push("");
  if (report.warnings.length === 0) {
    lines.push("None.");
  } else {
    for (const warning of report.warnings) {
      const reasonSuffix = warning.reason ? ` — ${warning.reason}` : "";
      lines.push(`- **${warning.kind}** (\`${warning.family}\`, \`${warning.id}\`): ${warning.message}${reasonSuffix}`);
      for (const site of warning.sites) {
        lines.push(`  - ${site.file}:${site.line}`);
      }
    }
  }
  lines.push("");

  lines.push("## ID families");
  lines.push("");
  for (const family of report.idFamilies) {
    lines.push(`### \`${family.family}\` (${family.definitionCount} defined, canonical source: \`${family.canonicalSource}\`)`);
    lines.push("");
    if (family.ids.length === 0) {
      lines.push("No canonical definitions found.");
    } else {
      lines.push("| ID | Defining location | Occurrences | Inbound references |");
      lines.push("|---|---|---|---|");
      for (const entry of family.ids) {
        const defLocation = entry.definitionSites.map(site => `${site.file}:${site.line}`).join("; ");
        lines.push(`| \`${entry.id}\` | ${defLocation} | ${entry.occurrenceCount} | ${entry.inboundReferenceCount} |`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const config = loadConfig();
  const report = buildTraceabilityReport(REPO_ROOT, config);
  fs.writeFileSync(INDEX_JSON_PATH, serializeReportJson(report));
  fs.writeFileSync(INDEX_MARKDOWN_PATH, renderMarkdown(report));
  console.log(`Wrote ${normalizeRelPath(REPO_ROOT, INDEX_JSON_PATH)} and ${normalizeRelPath(REPO_ROOT, INDEX_MARKDOWN_PATH)}`);
  console.log(`Scanned ${report.scannedFileCount} files. Errors: ${report.summary.errorCount}. Warnings: ${report.summary.warningCount}.`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}
