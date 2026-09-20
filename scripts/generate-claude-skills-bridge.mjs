// MaisogLabs Skills Foundation V0.1 (ML-DEVOS-RFC-014 / ML-DEVOS-AS-050 / D-042) —
// deterministic Claude Code exposure bridge generator.
//
// Canonical Skill payload lives under .agents/skills/**/SKILL.md (D-042's
// accepted canonical location). Claude Code discovers Skills only from
// .claude/skills/**/SKILL.md (per RFC-014 §7's evidence table — Claude Code
// does not natively read .agents/skills/). Rather than an actual git
// symlink (unreliable on Windows checkouts without symlink support
// enabled, per AS-050's explicit "if the chosen mechanism is not reliable
// in this repository's Windows/Git environment, STOP" instruction), this
// generator produces a deterministic, byte-for-byte-reproducible copy of
// each canonical SKILL.md under .claude/skills/. This is never an
// independently authored provider copy: every regeneration overwrites the
// bridge from the canonical file, and validate-claude-skills-bridge.mjs
// (below) detects any manual edit to the bridge as drift.
//
// AS51-F005: the bridge content is the canonical file's bytes exactly, with
// no banner or notice prepended. Anthropic's official Claude Code Skills
// documentation requires YAML frontmatter at byte 0 of SKILL.md
// (https://code.claude.com/docs/en/skills, checked 2026-09-20); a leading
// HTML-comment banner (this generator's first design) breaks that
// requirement even though it still passed this generator's own byte-diff
// drift test. Generated status is documented here and in the canonical
// `.agents/skills/README.md`, never inside a SKILL.md payload itself
// (AS52-F003: no separate .claude/skills/README.md artifact).
//
// Determinism: no timestamp, PID, or random value is ever written; the
// skill list is sorted; two consecutive runs against unchanged canonical
// content produce byte-identical bridge files.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..");
export const CANONICAL_ROOT = path.join(REPO_ROOT, ".agents", "skills");
export const BRIDGE_ROOT = path.join(REPO_ROOT, ".claude", "skills");

export function listCanonicalSkillNames(canonicalRoot = CANONICAL_ROOT) {
  if (!fs.existsSync(canonicalRoot)) return [];
  return fs
    .readdirSync(canonicalRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(canonicalRoot, entry.name, "SKILL.md")))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function renderBridgeContent(canonicalContent) {
  // AS51-F005: byte-for-byte identical to canonical — no banner, no
  // prepended content. Frontmatter must start at byte 0 for Claude Code to
  // parse the Skill; see the module header comment above and
  // .agents/skills/README.md for the generated-status notice instead.
  return canonicalContent;
}

export function buildBridgeFiles(repoRoot = REPO_ROOT) {
  const canonicalRoot = path.join(repoRoot, ".agents", "skills");
  const names = listCanonicalSkillNames(canonicalRoot);
  const files = [];
  for (const name of names) {
    const canonicalAbsPath = path.join(canonicalRoot, name, "SKILL.md");
    const canonicalRelPath = path.join(".agents", "skills", name, "SKILL.md").split(path.sep).join("/");
    const canonicalContent = fs.readFileSync(canonicalAbsPath, "utf8");
    const bridgeRelPath = path.join(".claude", "skills", name, "SKILL.md").split(path.sep).join("/");
    files.push({
      name,
      canonicalRelPath,
      bridgeRelPath,
      content: renderBridgeContent(canonicalContent),
    });
  }
  return files;
}

function main() {
  const files = buildBridgeFiles();
  for (const file of files) {
    const absPath = path.join(REPO_ROOT, file.bridgeRelPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, file.content);
  }
  console.log(`Wrote ${files.length} bridge file(s) under .claude/skills/: ${files.map(f => f.name).join(", ")}`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
