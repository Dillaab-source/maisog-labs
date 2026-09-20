// MaisogLabs Skills Foundation V0.1 (ML-DEVOS-RFC-014 / ML-DEVOS-AS-050 / D-042) —
// drift detector for the Claude Code exposure bridge.
//
// Regenerates the expected bridge content in-memory from the canonical
// .agents/skills/**/SKILL.md payload and compares it byte-for-byte against
// whatever is actually on disk under .claude/skills/. Never writes
// anything — a validator reports drift, it does not fix it (mirrors the
// existing devos/governance/traceability/validate-traceability.mjs
// pattern). Exits non-zero if any bridge file is missing, stale, or
// contains a manual edit the generator would not have produced.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT, buildBridgeFiles } from "./generate-claude-skills-bridge.mjs";

export function checkBridgeDrift(repoRoot = REPO_ROOT) {
  const expected = buildBridgeFiles(repoRoot);
  const results = expected.map(file => {
    const absPath = path.join(repoRoot, file.bridgeRelPath);
    const onDisk = fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf8") : null;
    return {
      name: file.name,
      bridgeRelPath: file.bridgeRelPath,
      missing: onDisk === null,
      drifted: onDisk !== null && onDisk !== file.content,
    };
  });
  const ok = results.every(r => !r.missing && !r.drifted);
  return { ok, results };
}

function main() {
  const { ok, results } = checkBridgeDrift();
  for (const r of results) {
    if (r.missing) {
      console.log(`MISSING: ${r.bridgeRelPath} — run node scripts/generate-claude-skills-bridge.mjs`);
    } else if (r.drifted) {
      console.log(`DRIFT: ${r.bridgeRelPath} does not match a fresh regeneration from its canonical .agents/skills/ source — run node scripts/generate-claude-skills-bridge.mjs`);
    } else {
      console.log(`OK: ${r.bridgeRelPath} matches its canonical source`);
    }
  }
  if (!ok) {
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
