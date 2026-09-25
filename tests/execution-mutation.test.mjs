// S6 mutation checks (ML-DEVOS-RFC-019 §18 item 12; D-071, D-074). Each mutant removes or
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
    from: "if (effectivePermitState(p, now) === \"EXPIRED_UNCLAIMED\" && p.state === \"ISSUED\") setPermitState(p, \"EXPIRED_UNCLAIMED\");",
    to: "if ((p.state === \"ISSUED\" || p.state === \"CLAIMED\") && now >= p.claim_deadline_ms) p.state = \"EXPIRED_UNCLAIMED\";",
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
    from: "const prepub = journalHead(st, fresh); // (1)",
    to: "const prepub = \"0\".repeat(64);",
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
    from: "      const f = await currentFencing(record);\n      if (permit.checkpoint_revision",
    to: "      const f = [];\n      if (permit.checkpoint_revision",
    tests: "tests/execution-permits.test.mjs",
    pattern: "claim race: S4 revision moves",
  },
  {
    id: "M17-permit-referenced-before-its-blob-is-written",
    file: "devos/execution/host.mjs",
    from: "const digest = store.putBlob(taskId, bytes);",
    to: "const digest = sha256(bytes);",
    tests: "tests/execution-recovery.test.mjs",
    pattern: "permit minting fault at permit-after-blob",
  },
  {
    id: "M18-claim-accepts-orphan-permits",
    file: "devos/execution/host.mjs",
    from: "if (!boundId || boundId !== permitId) fail(\"ISOLATION_UNPROVABLE\", \"no request binding names this permit (orphan or unknown permit)\");",
    to: "",
    tests: "tests/execution-recovery.test.mjs",
    pattern: "an orphan permit blob",
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
  // ---- AS95 remediation mutants
  {
    id: "M24-no-shared-task-lock",
    file: "devos/execution/store.mjs",
    from: "        fd = fs.openSync(lock, \"wx\", 0o600);\n        break;",
    to: "        fd = fs.openSync(`${lock}.${process.hrtime.bigint()}`, \"wx\", 0o600);\n        break;",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "simultaneous claim and quiesce serialize",
  },
  {
    id: "M25-no-store-version-cas",
    file: "devos/execution/store.mjs",
    from: "    if (current !== baseVersion) fail(\"ISOLATION_UNPROVABLE\", `task store compare-and-set refused for ${taskId} (base ${baseVersion}, current ${current})`);\n",
    to: "",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "stale or illegal writes are refused",
  },
  {
    id: "M26-instance-transitions-unchecked",
    file: "devos/execution/state.mjs",
    from: "  if (!(INSTANCE_NEXT[record.state] ?? []).includes(next)) fail(",
    to: "  if (false) fail(",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "stale or illegal writes are refused",
  },
  {
    id: "M27-permit-terminal-states-not-monotonic",
    file: "devos/execution/state.mjs",
    from: "  if (!(PERMIT_NEXT[permit.state] ?? []).includes(next)) fail(",
    to: "  if (false) fail(",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "stale or illegal writes are refused",
  },
  {
    id: "M28-quiesce-without-s4-fencing",
    file: "devos/execution/host.mjs",
    from: "      const f = await currentFencing(record);\n      if (f.length) {\n        const code = selectReason(f);\n        if (STALE_CODES.includes(code)) markStale(st, record, code);",
    to: "      const f = [];\n      if (f.length) {\n        const code = selectReason(f);\n        if (STALE_CODES.includes(code)) markStale(st, record, code);",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "quiesce after an S4 owner change",
  },
  {
    id: "M29-no-s4-role-state-check",
    file: "devos/execution/identity.mjs",
    from: '  if (observed.state !== ROLE_STATE[identity.role]) codes.push("INSTANCE_STALE");\n',
    to: "",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "quiesce with only the S4 role state changed",
  },
  {
    id: "M30-claim-does-not-persist-expiry",
    file: "devos/execution/host.mjs",
    from: "      persistExpiries(st);\n",
    to: "",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "expiry at the claim deadline",
  },
  {
    id: "M31-late-report-rewrites-quarantined-instance",
    file: "devos/execution/host.mjs",
    from: "      if (record.state !== \"ATTACHED\") {\n        journal(st, record, \"LATE_REPORT\"",
    to: "      if (record.state === \"CLEANED\") {\n        journal(st, record, \"LATE_REPORT\"",
    tests: "tests/execution-linearization.test.mjs",
    pattern: "recovery holds the lock and quarantines, a report competes",
  },
  // ---- AS96 remediation mutants
  {
    id: "M32-no-pending-publication-reservation",
    file: "devos/execution/host.mjs",
    from: "    return pendingRtr(st).filter((p) => p.instance_id === record.instance_id).map((p) => p.transfer_id);",
    to: "    return [];",
    tests: "tests/execution-publication.test.mjs",
    pattern: "competing finishWithoutPublication is refused",
  },
  {
    id: "M33-finish-crosses-pending",
    file: "devos/execution/host.mjs",
    from: "      assertNoPendingPublication(st, record, \"finishWithoutPublication\");\n",
    to: "",
    tests: "tests/execution-publication.test.mjs",
    pattern: "competing finishWithoutPublication is refused",
  },
  {
    id: "M34-cleanup-crosses-pending",
    file: "devos/execution/host.mjs",
    from: "      assertNoPendingPublication(st, record, \"cleanup\");\n",
    to: "",
    tests: "tests/execution-publication.test.mjs",
    pattern: "competing cleanup is refused",
  },
  {
    id: "M35-renewal-crosses-pending",
    file: "devos/execution/host.mjs",
    from: "      assertNoPendingPublication(st, record, \"adoptRenewal\");\n",
    to: "",
    tests: "tests/execution-publication.test.mjs",
    pattern: "classification while a PENDING reservation exists",
  },
  {
    id: "M36-transient-s4-error-aborts",
    file: "devos/execution/host.mjs",
    from: "      if (!DEFINITIVE_S4_REJECTIONS.has(err?.code)) {",
    to: "      if (false) {",
    tests: "tests/execution-publication.test.mjs",
    pattern: "a transient S4 failure",
  },
  {
    id: "M37-publication-restores-quarantine",
    file: "devos/execution/host.mjs",
    from: "      if (fresh.state === \"QUIESCED\") setLife(fresh, \"COMPLETED\");",
    to: "      if (fresh.state === \"QUIESCED\" || fresh.state === \"QUARANTINED\") fresh.state = \"COMPLETED\";",
    tests: "tests/execution-publication.test.mjs",
    pattern: "a quarantined instance is never restored",
  },
  // ---- D-074 integrity-hardening mutants (§13.2-§13.6, §18 item 12; Mutants A-C)
  {
    id: "M38-mutant-A-release-on-quarantine",
    file: "devos/execution/state.mjs",
    from: "  return PROGRESSING.has(st.instances[instanceId].state) || unresolvedInfluence(st, instanceId).length > 0;",
    to: "  return st.instances[instanceId].state !== \"QUARANTINED\" && (PROGRESSING.has(st.instances[instanceId].state) || unresolvedInfluence(st, instanceId).length > 0);",
    tests: "tests/execution-slot.test.mjs",
    pattern: "Q1 runtime",
  },
  {
    id: "M39-mutant-B-audit-record-without-closure",
    file: "devos/execution/host.mjs",
    from: "        closeClaimReservation(permit, \"OPERATOR_RESOLVED\");",
    to: "        st.slot = null;",
    tests: "tests/execution-slot.test.mjs",
    pattern: "Q5 runtime",
  },
  {
    id: "M40-mutant-C-over-broad-resolution",
    file: "devos/execution/host.mjs",
    from: "        closeClaimReservation(permit, \"OPERATOR_RESOLVED\");",
    to: "        for (const q of Object.values(st.permits)) if (q.claim_reservation === \"OPEN\") closeClaimReservation(q, \"OPERATOR_RESOLVED\");",
    tests: "tests/execution-slot.test.mjs",
    pattern: "Q5a runtime",
  },
  {
    id: "M41-late-report-closes-claim-without-obligations",
    file: "devos/execution/host.mjs",
    from: "      for (const g of report.process_groups) live.obligations[String(g)] = { state: \"OPEN\", resolution: null };\n",
    to: "",
    tests: "tests/execution-slot.test.mjs",
    pattern: "Q2 runtime",
  },
  {
    id: "M42-proof-without-inspection",
    file: "devos/execution/host.mjs",
    from: "        if (ins.groupAlive(o.pgid)) remaining.push(o);",
    to: "        if (false) remaining.push(o);",
    tests: "tests/execution-slot.test.mjs",
    pattern: "Q3 runtime",
  },
  {
    id: "M43-unattributable-pending-not-task-blocking",
    file: "devos/execution/host.mjs",
    from: "      if (requireAttributable) assertAttributable(taskId, st);",
    to: "      if (false) assertAttributable(taskId, st);",
    tests: "tests/execution-recovery.test.mjs",
    pattern: "a PENDING record whose body was altered",
  },
  {
    id: "M44-create-without-slot-check",
    file: "devos/execution/host.mjs",
    from: "      assertSlotFreeFor(st, instanceId);\n",
    to: "",
    tests: "tests/execution-slot.test.mjs",
    pattern: "a second create while the slot is held",
  },
  {
    id: "M45-permit-committed-without-journal-entry",
    file: "devos/execution/host.mjs",
    from: "      journal(st, fresh, \"PERMIT_ISSUED\", { permit_id: permitId, permit_digest: digest, request_id: request.request_id });\n",
    to: "",
    tests: "tests/execution-recovery.test.mjs",
    pattern: "permit minting fault at permit-after-commit",
  },
  {
    id: "M46-slot-release-not-derived",
    file: "devos/execution/state.mjs",
    from: "  if (!holder || isActive(st, holder)) return null;",
    to: "  if (!holder) return null;",
    tests: "tests/execution-slot.test.mjs",
    pattern: "Q1 runtime",
  },
  {
    id: "M47-blob-read-unverified",
    file: "devos/execution/store.mjs",
    from: "    if (sha256(bytes) !== digest) fail(code, `blob ${digest} does not match its digest`);\n",
    to: "",
    tests: "tests/execution-store.test.mjs",
    pattern: "blobs are content-addressed",
  },
  {
    id: "M48-envelope-digest-unchecked",
    file: "devos/execution/store.mjs",
    from: "      && sha256(canonicalJson(env.state)) === env.state_digest;",
    to: ";",
    tests: "tests/execution-store.test.mjs",
    pattern: "a corrupted, truncated or foreign envelope",
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
