// S6 mutation checks (ML-DEVOS-RFC-019 §18; D-071). Each mutant removes or
// weakens one safety property in a COPY of the S6 sources; the targeted S6
// tests must then fail. A control run of the unmutated copy must pass, so a
// "killed" mutant is attributable to the mutation alone.
//
// The only process started is `node --test` on this repository's own fixed
// test files, inside a temporary copy.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// file, exact source text (must occur exactly once), replacement, the test
// file and name pattern expected to kill it.
const MUTANTS = [
  {
    id: "M01-no-claim-time-s5-recheck",
    file: "devos/execution/host.mjs",
    from: "check = verifyClaimResult(requestShellDecision(cfg.gateway, permit.s5_request_intent), { permit, identity: record.identity });",
    to: "check = {};",
    tests: "tests/execution-permits.test.mjs",
    pattern: "claim-time S5 recheck honours live revocation",
  },
  {
    id: "M02-no-subject-role-binding",
    file: "devos/execution/permits.mjs",
    from: "  if (subject.actor_role !== role) return `S5 subject actor_role is not ${role}`;",
    to: "",
    tests: "tests/execution-permits.test.mjs",
    pattern: "S5 subject must be the S4 owner",
  },
  {
    id: "M03-claimed-permit-expires",
    file: "devos/execution/host.mjs",
    from: 'if (s && s.state === "ISSUED" && clock() >= s.claim_deadline_ms) {',
    to: 'if (s && (s.state === "ISSUED" || s.state === "CLAIMED") && clock() >= s.claim_deadline_ms) {',
    tests: "tests/execution-permits.test.mjs",
    pattern: "CLAIMED permit never becomes safe by expiry",
  },
  {
    id: "M04-quiesce-ignores-claimed-permits",
    file: "devos/execution/host.mjs",
    from: "    if (claimed.length) {",
    to: "    if (false) {",
    tests: "tests/execution-permits.test.mjs",
    pattern: "CLAIMED permit never becomes safe by expiry",
  },
  {
    id: "M05-report-digests-unchecked",
    file: "devos/execution/host.mjs",
    from: 'if (report.argv_digest !== permit.argv_digest || report.environment_digest !== permit.environment_digest) fail("ISOLATION_UNPROVABLE", "report digests do not match the permit");',
    to: "",
    tests: "tests/execution-permits.test.mjs",
    pattern: "reports must match a CLAIMED permit exactly",
  },
  {
    id: "M06-circular-or-wrong-prepublication-digest",
    file: "devos/execution/host.mjs",
    from: "const prepub = journal.head(); // (1)",
    to: 'const prepub = "0".repeat(64);',
    tests: "tests/execution-lifecycle.test.mjs",
    pattern: "Builder happy path",
  },
  {
    id: "M07-evidence-class-upgraded",
    file: "devos/execution/host.mjs",
    from: "        evidenceRef, // JSON.parse of the stored bytes -- never rebuilt from fields (§7.1.1)",
    to: '        evidenceRef: { ...evidenceRef, evidenceClass: "INDEPENDENTLY_REPRODUCED" },',
    tests: "tests/execution-lifecycle.test.mjs",
    pattern: "Builder happy path",
  },
  {
    id: "M08-no-fencing-revision-check",
    file: "devos/execution/identity.mjs",
    from: '  if (observed.revision !== checkpoint.current_revision) codes.push("FENCING_REVISION_MISMATCH");',
    to: "",
    tests: "tests/execution-lifecycle.test.mjs",
    pattern: "reason code FENCING_REVISION_MISMATCH",
  },
  {
    id: "M09-no-qa-independence",
    file: "devos/execution/host.mjs",
    from: 'if (body.owner === qaActor) fail("QA_INDEPENDENCE_VIOLATION", "the QA actor is the Builder that produced the result");',
    to: "",
    tests: "tests/execution-lifecycle.test.mjs",
    pattern: "QA independence",
  },
  {
    id: "M10-no-scope-check",
    file: "devos/execution/host.mjs",
    from: "export function scopeFailures(files, scope) {",
    to: "export function scopeFailures(files, scope) {\n  return [];",
    tests: "tests/execution-lifecycle.test.mjs",
    pattern: "reason code SCOPE_VIOLATION",
  },
  {
    id: "M11-host-environment-inherited",
    file: "devos/execution/environment.mjs",
    from: "  const env = {\n    PATH: toolchainPath.join",
    to: "  const env = {\n    ...process.env,\n    PATH: toolchainPath.join",
    tests: "tests/execution-lifecycle.test.mjs",
    pattern: "instance environment excludes host credential canaries",
  },
  {
    id: "M12-network-transport-allowed",
    file: "devos/execution/transport.mjs",
    from: '    if (p) fail("TRANSPORT_NOT_AUTHORIZED", p);\n  }',
    to: "  }",
    tests: "tests/execution-lifecycle.test.mjs",
    pattern: "reason code TRANSPORT_NOT_AUTHORIZED",
  },
  {
    id: "M13-journal-chain-unchecked",
    file: "devos/execution/journal.mjs",
    from: '    if (entry.prev_head !== head) fail("ISOLATION_UNPROVABLE", `journal hash chain breaks at entry ${i}`);',
    to: "",
    tests: "tests/execution-core.test.mjs",
    pattern: "journal",
  },
  {
    id: "M14-precedence-inverted",
    file: "devos/execution/vocabulary.mjs",
    from: "if (best === null || rankOf(c) < rankOf(best)) best = c;",
    to: "if (best === null || rankOf(c) > rankOf(best)) best = c;",
    tests: "tests/execution-core.test.mjs",
    pattern: "reason vocabulary",
  },
  {
    id: "M15-deletion-follows-substituted-directories",
    file: "devos/execution/paths.mjs",
    from: "  const verifyAncestors = (ancestors) => {",
    to: "  const verifyAncestors = (ancestors) => {\n    return;",
    tests: "tests/execution-core.test.mjs",
    pattern: "deletion never follows links",
  },
  // ---- AS94 remediation mutants
  {
    id: "M16-no-s4-fencing-under-claim-lock",
    file: "devos/execution/host.mjs",
    from: "      const f = fencingFailures(record.identity, record.checkpoint, observed, clock());\n",
    to: "      const f = [];\n",
    tests: "tests/execution-permits.test.mjs",
    pattern: "claim race: S4 revision moves",
  },
  {
    id: "M17-binding-written-after-derived-files",
    file: "devos/execution/host.mjs",
    from: "      registry.writeBinding(record.task_id, record.instance_id, request.request_id, binding); // the commit point\n      await step(\"permit-after-binding\", { permitId });\n      await materialize(record, binding);",
    to: "      await materialize(record, binding);\n      registry.writeBinding(record.task_id, record.instance_id, request.request_id, binding);\n      await step(\"permit-after-binding\", { permitId });",
    tests: "tests/execution-recovery.test.mjs",
    pattern: "permit minting fault at permit-after-body",
  },
  {
    id: "M18-claim-accepts-orphan-permits",
    file: "devos/execution/host.mjs",
    from: 'if (!binding || binding.permit_id !== permitId) fail("ISOLATION_UNPROVABLE", "no request binding names this permit (orphan or unknown permit)");',
    to: "",
    tests: "tests/execution-recovery.test.mjs",
    pattern: "orphan permit files",
  },
  {
    id: "M19-generic-git-runner-exported",
    file: "devos/execution/git.mjs",
    from: "export function gitVersion(env) {",
    to: "export function git(args, opts) {\n  return run(\"generic\", args, opts);\n}\n\nexport function gitVersion(env) {",
    tests: "tests/execution-core.test.mjs",
    pattern: "no S6-core or fixture export accepts",
  },
  {
    id: "M20-generic-fixture-git-helper",
    file: "tests/fixtures/execution/harness.mjs",
    from: "// The commit a remote branch points at, or null when the ref is absent.",
    to: "export function fixtureGit(args, opts) {\n  return fixtureRun(args, opts);\n}\n\n// The commit a remote branch points at, or null when the ref is absent.",
    tests: "tests/execution-core.test.mjs",
    pattern: "no S6-core or fixture export accepts",
  },
  {
    id: "M21-report-timing-dropped-from-evidence",
    file: "devos/execution/permits.mjs",
    from: 'REPORT_FIELDS.filter((k) => k !== "permit_id" && k !== "instance_id")',
    to: 'REPORT_FIELDS.filter((k) => !["permit_id", "instance_id", "started_at", "ended_at", "signal"].includes(k))',
    tests: "tests/execution-permits.test.mjs",
    pattern: "a verified report is stored and journaled",
  },
  {
    id: "M22-report-chronology-unchecked",
    file: "devos/execution/permits.mjs",
    from: '    if (started !== null && ended !== null && ended < started) bad.push("ended_at before started_at");\n',
    to: "",
    tests: "tests/execution-core.test.mjs",
    pattern: "Execution Report: every RFC field",
  },
  {
    id: "M23-report-exit-signal-combination-unchecked",
    file: "devos/execution/permits.mjs",
    from: '    if ((r.exit_code === null) === (r.signal === null)) bad.push("terminated report needs exactly one of exit_code / signal");\n',
    to: "",
    tests: "tests/execution-core.test.mjs",
    pattern: "Execution Report: every RFC field",
  },
];

function copyTree() {
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), "s6-mutation-"));
  for (const entry of ["devos", "tests", "package.json"]) {
    fs.cpSync(path.join(ROOT, entry), path.join(dst, entry), { recursive: true });
  }
  if (fs.existsSync(path.join(ROOT, "node_modules"))) fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dst, "node_modules"));
  return dst;
}

// The child must not inherit this runner's NODE_TEST_CONTEXT, or it would
// switch to the serialized sub-runner protocol instead of printing TAP.
function runTargeted(dir, testFile, pattern) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ["--test", "--test-reporter=tap", "--test-name-pattern", pattern, testFile], { cwd: dir, env, encoding: "utf8", timeout: 300000 });
}

test("every mutant anchor occurs exactly once in the current sources", () => {
  for (const m of MUTANTS) {
    const src = fs.readFileSync(path.join(ROOT, m.file), "utf8");
    assert.equal(src.split(m.from).length - 1, 1, `${m.id}: anchor must occur exactly once in ${m.file}`);
  }
});

test("control: the unmutated copy passes every targeted selection", () => {
  const dir = copyTree();
  try {
    const selections = [...new Map(MUTANTS.map((m) => [`${m.tests}\n${m.pattern}`, m])).values()];
    for (const m of selections) {
      const r = runTargeted(dir, m.tests, m.pattern);
      assert.equal(r.status, 0, `control failed for ${m.tests} / ${m.pattern}:\n${r.stdout.slice(-2000)}`);
      assert.match(r.stdout, /# pass [1-9]/, `the selection ${m.pattern} ran at least one test`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

for (const m of MUTANTS) {
  test(`mutant ${m.id} is killed by ${path.basename(m.tests)} / "${m.pattern}"`, () => {
    const dir = copyTree();
    try {
      const file = path.join(dir, m.file);
      const src = fs.readFileSync(file, "utf8");
      assert.equal(src.split(m.from).length - 1, 1);
      fs.writeFileSync(file, src.replace(m.from, m.to));
      const r = runTargeted(dir, m.tests, m.pattern);
      assert.notEqual(r.status, 0, `${m.id} SURVIVED:\n${r.stdout.slice(-1500)}`);
      assert.match(r.stdout, /# fail [1-9]/, `${m.id} must be killed by a failing assertion, not a crash`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}
