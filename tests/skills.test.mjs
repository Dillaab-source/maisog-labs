import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, listCanonicalSkillNames, buildBridgeFiles } from "../scripts/generate-claude-skills-bridge.mjs";
import { checkBridgeDrift } from "../scripts/validate-claude-skills-bridge.mjs";

// MaisogLabs Skills Foundation V0.1 (ML-DEVOS-RFC-014 / ML-DEVOS-AS-050 / D-042) —
// focused, repository-local validation for the 4 canonical Skills and their
// deterministic Claude Code bridge. No S4/S5 routing engine exists, so these
// tests validate the Skills as documentary/procedural artifacts — exactly
// what they are designed to be — rather than simulating runtime routing.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT_LOCAL = path.resolve(__dirname, "..");
const CANONICAL_ROOT = path.join(REPO_ROOT_LOCAL, ".agents", "skills");

const EXPECTED_SKILLS = [
  "governance-traceability-audit",
  "architect-review-sync",
  "implementation-handoff",
  "project-orientation-state-recovery",
];

function readSkill(name) {
  return fs.readFileSync(path.join(CANONICAL_ROOT, name, "SKILL.md"), "utf8");
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "SKILL.md must start with a --- frontmatter block");
  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) frontmatter[kv[1]] = kv[2].trim();
  }
  return frontmatter;
}

test("exactly the 4 authorized canonical skills exist, no fifth", () => {
  const names = listCanonicalSkillNames(CANONICAL_ROOT);
  assert.deepEqual(names, [...EXPECTED_SKILLS].sort((a, b) => a.localeCompare(b)));
});

for (const name of EXPECTED_SKILLS) {
  test(`${name}: valid frontmatter with name and description`, () => {
    const content = readSkill(name);
    const fm = parseFrontmatter(content);
    assert.equal(fm.name, name);
    assert.ok(fm.description && fm.description.length > 0, "description must be non-empty");
    assert.ok(fm.description.length <= 1536, "description should respect the documented combined-length budget");
  });

  test(`${name}: states activation and non-activation conditions`, () => {
    const content = readSkill(name);
    assert.match(content, /## Activate when/);
    assert.match(content, /## Do not activate when/);
  });

  test(`${name}: states required fields from the RFC-014 discovery contract`, () => {
    const content = readSkill(name);
    for (const heading of [
      "## Required inputs",
      "## Authoritative sources",
      "## Procedure",
      "## Output",
      "## Stop / escalation conditions",
      "## Governance dependencies",
      "## Mutation / capability posture",
    ]) {
      assert.match(content, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${name} must contain heading ${heading}`);
    }
  });

  test(`${name}: never implies the skill grants authority`, () => {
    const content = readSkill(name).toLowerCase();
    assert.ok(
      content.includes("capability != authority") || content.includes("no capability grant") || content.includes("never grants") || content.includes("never itself grants"),
      `${name} must explicitly disclaim granting authority`
    );
  });

  test(`${name}: contains no credential/tool-permission grant`, () => {
    const content = readSkill(name);
    // No allowed-tools/disallowed-tools/hooks frontmatter fields, and no
    // literal secret-shaped tokens anywhere in the body.
    const fm = parseFrontmatter(content);
    assert.equal(fm["allowed-tools"], undefined);
    assert.equal(fm["disallowed-tools"], undefined);
    assert.equal(fm["hooks"], undefined);
    assert.doesNotMatch(content, /\b(api[_-]?key|password|secret[_-]?key|private[_-]?key|token=)\b/i);
  });

  test(`${name}: mutation/capability posture never claims to override AUTHORIZED_SCOPE`, () => {
    const content = readSkill(name);
    assert.doesNotMatch(content, /override(s)?\s+AUTHORIZED_SCOPE/i);
    // Every skill must either be explicitly read-only, or explicitly bound
    // its writes to normal coordination bookkeeping files only.
    assert.match(content, /(Read-only\.|Writes only to `coordination\/)/);
  });

  test(`${name}: every authoritative source path referenced actually exists`, () => {
    const content = readSkill(name);
    const backtickPaths = [...content.matchAll(/`([a-zA-Z0-9_.\/-]+\/[a-zA-Z0-9_.-]+\.(?:md|mjs|json))`/g)].map(m => m[1]);
    const candidatePaths = backtickPaths.filter(p => !p.startsWith(".agents/skills/") && !p.startsWith(".claude/skills/") && !p.includes("skills.test.mjs"));
    assert.ok(candidatePaths.length > 0, `${name} should reference at least one authoritative source path`);
    for (const relPath of candidatePaths) {
      const absPath = path.join(REPO_ROOT_LOCAL, relPath);
      assert.ok(fs.existsSync(absPath), `${name} references ${relPath}, which must exist on disk`);
    }
  });
}

test("architect-review-sync: activation is explicitly gated by live TURN, not request wording", () => {
  const content = readSkill("architect-review-sync");
  assert.match(content, /TURN.*ARCHITECT/s);
  assert.match(content, /even if the request text/i);
});

test("project-orientation-state-recovery: non-activation prevents over-activation when context is already sufficient", () => {
  const content = readSkill("project-orientation-state-recovery");
  assert.match(content, /already has current, task-relevant context loaded/);
});

test("governance-traceability-audit vs architect-review-sync: smallest-sufficient routing is documented (distinct, non-overlapping triggers)", () => {
  const audit = readSkill("governance-traceability-audit");
  const review = readSkill("architect-review-sync");
  // The audit skill must explicitly distinguish itself from a general review.
  assert.match(audit, /Architect Review \/ Sync.*different Skill/s);
  // The review skill must gate on TURN, never on keyword/topic overlap with audit's trigger.
  assert.doesNotMatch(review, /check governance integrity|run the validator/i);
});

test("Claude Code bridge: generated content is byte-for-byte identical to canonical payload (no banner) for all 4 skills", () => {
  const files = buildBridgeFiles(REPO_ROOT_LOCAL);
  assert.equal(files.length, 4);
  for (const file of files) {
    const canonicalContent = fs.readFileSync(path.join(REPO_ROOT_LOCAL, file.canonicalRelPath), "utf8");
    assert.equal(file.content, canonicalContent, `${file.name}: bridge content must equal canonical content exactly, no banner/prefix`);
  }
});

// AS51-F005: independently parse each *generated Claude bridge file on disk*
// (not the canonical .agents file) to prove real, provider-format validity —
// frontmatter must start at byte 0, since a leading banner would still pass
// a byte-diff drift check while breaking Claude Code's own Skill parsing.
for (const name of EXPECTED_SKILLS) {
  test(`${name}: on-disk Claude bridge SKILL.md begins with parsable YAML frontmatter at byte 0`, () => {
    const bridgeAbsPath = path.join(REPO_ROOT_LOCAL, ".claude", "skills", name, "SKILL.md");
    const bridgeContent = fs.readFileSync(bridgeAbsPath, "utf8");
    assert.ok(bridgeContent.startsWith("---\n"), `${name}: bridge SKILL.md must begin with "---" at byte 0`);
    const bridgeFm = parseFrontmatter(bridgeContent);
    const canonicalFm = parseFrontmatter(readSkill(name));
    assert.equal(bridgeFm.name, canonicalFm.name, `${name}: bridge frontmatter name must equal canonical`);
    assert.equal(bridgeFm.description, canonicalFm.description, `${name}: bridge frontmatter description must equal canonical`);
    assert.equal(bridgeFm.name, name);
  });
}

test("Claude Code bridge: on-disk bridge currently has no drift from canonical payload", () => {
  const { ok, results } = checkBridgeDrift(REPO_ROOT_LOCAL);
  assert.ok(ok, `bridge drift detected: ${JSON.stringify(results.filter(r => r.missing || r.drifted))}`);
});

test("Claude Code bridge: two consecutive generations produce byte-identical output (determinism)", () => {
  const runA = buildBridgeFiles(REPO_ROOT_LOCAL);
  const runB = buildBridgeFiles(REPO_ROOT_LOCAL);
  assert.deepEqual(runA, runB);
});

test("Claude Code bridge: a hand-edit to an on-disk bridge file is detected as drift (injection test, not just designed)", () => {
  const bridgeAbsPath = path.join(REPO_ROOT_LOCAL, ".claude", "skills", "architect-review-sync", "SKILL.md");
  const original = fs.readFileSync(bridgeAbsPath, "utf8");
  try {
    fs.writeFileSync(bridgeAbsPath, original + "\nmanual edit that must be detected as drift\n");
    const { ok, results } = checkBridgeDrift(REPO_ROOT_LOCAL);
    assert.equal(ok, false, "drift must be detected after a hand-edit");
    const driftedEntry = results.find(r => r.name === "architect-review-sync");
    assert.ok(driftedEntry.drifted, "the hand-edited file specifically must be flagged as drifted");
  } finally {
    // Restore exact original bytes regardless of assertion outcome, so this
    // test never leaves the working tree dirty for other tests or a commit.
    fs.writeFileSync(bridgeAbsPath, original);
  }
  const { ok: okAfterRestore } = checkBridgeDrift(REPO_ROOT_LOCAL);
  assert.ok(okAfterRestore, "drift must clear once the exact original content is restored");
});
