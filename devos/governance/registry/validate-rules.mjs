#!/usr/bin/env node
// Static structural validator for devos/governance/rules/*.yaml rule registries.
//
// This is a governance-data lint tool only. It performs no runtime policy
// enforcement, is not wired into any CI/git hook, and is not invoked
// automatically by anything. Run manually:
//
//   node devos/governance/registry/validate-rules.mjs
//
// Zero third-party dependencies (Node builtins only), so it introduces no
// package.json change and no new dependency surface.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.join(HERE, "..", "rules");

const CLASSES = new Set(["PATCH", "LOCAL_RULE", "CORE_POLICY", "CAPABILITY", "ARCHITECTURE", "CONSTITUTIONAL", "WAIVER", "PROJECT_ONBOARDING"]);
const SCOPES = new Set(["sentinel-wide", "project"]);
const RISKS = new Set(["low", "medium", "high", "highest"]);
const STATUSES = new Set(["ACTIVE", "SUPERSEDED", "WAIVED", "PROPOSED", "REJECTED"]);
const REQUIRED_FIELDS = [
  "rule_id", "title", "description", "class", "scope", "project", "risk",
  "status", "authority", "applies_when", "introduced_by", "decision_id",
  "adr_id", "effective_version", "supersedes", "created_at", "updated_at",
];

function parseYamlRules(text) {
  // Minimal, dependency-free YAML subset parser for this file's own shape only:
  // a top-level `rules:` list of flat-ish mapping objects with scalars,
  // one nested `authority:`/`requires:` object, and one flow-sequence field
  // (`exceptions`, `requires.evidence`). This is NOT a general YAML parser.
  const lines = text.split("\n");
  const rules = [];
  let current = null;
  let inAuthority = false;
  let inRequires = false;

  const stripQuotes = (v) => v.replace(/^"(.*)"$/, "$1").trim();
  const parseFlowArray = (v) => {
    const inner = v.trim().replace(/^\[/, "").replace(/\]$/, "");
    if (!inner.trim()) return [];
    return inner.split(",").map((s) => stripQuotes(s.trim()));
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (/^\s*-\s*rule_id:/.test(line)) {
      if (current) rules.push(current);
      current = { authority: {}, requires: {} };
      inAuthority = false;
      inRequires = false;
      const v = line.split(":").slice(1).join(":").trim();
      current.rule_id = stripQuotes(v);
      continue;
    }
    if (!current) continue;
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch[1].length;
    const trimmed = line.trim();

    if (trimmed === "authority:") { inAuthority = true; inRequires = false; continue; }
    if (trimmed === "requires:") { inRequires = true; inAuthority = false; continue; }
    if (indent <= 4 && /^[a-z_]+:/.test(trimmed) && trimmed !== "authority:" && trimmed !== "requires:") {
      inAuthority = false;
      inRequires = false;
    }

    const kv = trimmed.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) {
      // Continuation line of a folded (`>`) scalar, or list item under exceptions/evidence — skip for structural validation.
      continue;
    }
    const [, key, rawVal] = kv;
    let val = rawVal.trim();

    if (val === ">" || val === "" || val === "|") {
      if (!inAuthority && !inRequires && (key === "description")) current[key] = "(folded scalar — content not structurally validated)";
      continue;
    }
    if (val.startsWith("[")) {
      const arr = parseFlowArray(val);
      if (inRequires) current.requires[key] = arr;
      else current[key] = arr;
      continue;
    }
    if (val === "null") val = null;
    else if (val === "true") val = true;
    else if (val === "false") val = false;
    else val = stripQuotes(val);

    if (inAuthority) current.authority[key] = val;
    else if (inRequires) current.requires[key] = val;
    else current[key] = val;
  }
  if (current) rules.push(current);
  return rules;
}

function validateRegistry(filePath) {
  const text = readFileSync(filePath, "utf8");
  const rules = parseYamlRules(text);
  const errors = [];
  const seenIds = new Set();
  const allIds = new Set(rules.map((r) => r.rule_id));

  for (const rule of rules) {
    const label = rule.rule_id || "(missing rule_id)";
    for (const field of REQUIRED_FIELDS) {
      if (field === "authority") {
        if (!rule.authority || typeof rule.authority !== "object") errors.push(`${label}: missing authority object`);
        continue;
      }
      if (!(field in rule)) errors.push(`${label}: missing required field '${field}'`);
    }
    if (!rule.rule_id) errors.push("(unknown): missing rule_id");
    else if (seenIds.has(rule.rule_id)) errors.push(`${rule.rule_id}: duplicate rule_id`);
    else seenIds.add(rule.rule_id);

    if (rule.class && !CLASSES.has(rule.class)) errors.push(`${label}: invalid class '${rule.class}'`);
    if (rule.scope && !SCOPES.has(rule.scope)) errors.push(`${label}: invalid scope '${rule.scope}'`);
    if (rule.risk && !RISKS.has(rule.risk)) errors.push(`${label}: invalid risk '${rule.risk}'`);
    if (rule.status && !STATUSES.has(rule.status)) errors.push(`${label}: invalid status '${rule.status}'`);

    if (rule.supersedes && rule.supersedes !== null && !allIds.has(rule.supersedes)) {
      errors.push(`${label}: supersedes references unknown rule_id '${rule.supersedes}'`);
    }
    if (rule.class === "WAIVER" && !rule.expires_at) {
      errors.push(`${label}: WAIVER-class rule missing mandatory expires_at`);
    }
  }
  return { rules, errors };
}

function main() {
  const files = readdirSync(RULES_DIR).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  if (files.length === 0) {
    console.log(`No rule registry files found in ${RULES_DIR}`);
    process.exit(0);
  }
  let totalErrors = 0;
  for (const file of files) {
    const full = path.join(RULES_DIR, file);
    const { rules, errors } = validateRegistry(full);
    console.log(`\n${file}: ${rules.length} rule(s) parsed`);
    if (errors.length === 0) {
      console.log("  OK — no structural issues found.");
    } else {
      totalErrors += errors.length;
      for (const e of errors) console.log(`  ERROR: ${e}`);
    }
  }
  console.log(`\n${totalErrors === 0 ? "PASS" : "FAIL"}: ${totalErrors} error(s) across ${files.length} file(s).`);
  process.exit(totalErrors === 0 ? 0 : 1);
}

main();
