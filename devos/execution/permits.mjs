// S6 Execution Request / Permit / Report contracts (ML-DEVOS-RFC-019 §13.1;
// AS90-F001..F003, AS91-F001, AS92-F001; D-071).
//
// Pure helpers: no I/O, no process creation. S6 core issues permits and
// verifies reports; it never executes a request's argv. S5 is not argv-aware:
// a `shell.exec` ALLOW gates the capability at S5's canonical request axes, and
// the exact command is bound only by S6's argv_digest.
import { canonicalJson, sha256 } from "./digest.mjs";
import { ExecutionError, HEX64, ID128, REQUEST_ID_PATTERN, canonicalS5Role, fail } from "./vocabulary.mjs";

export const INTENT_AXES = Object.freeze(["project", "provider", "action", "resource", "environment", "policy_version"]);

export function validateRequest(request) {
  const r = request ?? {};
  const bad = [];
  if (!ID128.test(r.instance_id ?? "")) bad.push("instance_id");
  if (typeof r.request_id !== "string" || !REQUEST_ID_PATTERN.test(r.request_id)) bad.push("request_id");
  if (!Array.isArray(r.argv) || r.argv.length === 0 || r.argv.some((a) => typeof a !== "string" || a.includes("\u0000"))) bad.push("argv");
  if (!Number.isInteger(r.checkpoint_revision) || r.checkpoint_revision < 1) bad.push("checkpoint_revision");
  const extra = Object.keys(r).filter((k) => !["instance_id", "request_id", "argv", "checkpoint_revision"].includes(k));
  if (extra.length) bad.push(`unknown fields ${extra.join(",")}`);
  if (bad.length) fail("MALFORMED_REQUEST", `execution request invalid: ${bad.join("; ")}`);
  return r;
}

// The canonical argv JSON is JSON.stringify of the string array itself.
export function argvDigest(argv) {
  return sha256(JSON.stringify(argv));
}

export function expectedShellIntent({ project, repoCanonical, environment, policyVersion }) {
  return { project, provider: "shell", action: "shell.exec", resource: repoCanonical, environment, policy_version: policyVersion };
}

const pickAxes = (intent) => Object.fromEntries(INTENT_AXES.map((k) => [k, intent?.[k]]));

// AS92-F001: the S5 subject must be the instance's S4 owner in the mapped role.
function subjectFailure(subject, identity) {
  const role = canonicalS5Role(identity.role);
  if (role === null) return "S6 role does not map to an S5 role";
  if (!subject || subject.actor_id !== identity.owner) return "S5 subject actor_id is not the instance owner";
  if (subject.actor_role !== role) return `S5 subject actor_role is not ${role}`;
  return null;
}

// Calls the public S5 adapter; any trusted-source failure is "no decision".
export function requestShellDecision(gateway, intent) {
  const adapter = gateway?.shell;
  if (!adapter || typeof adapter.request !== "function") fail("CAPABILITY_DENIED", "no S5 shell adapter is available (no decision)");
  try {
    return adapter.request({ ...intent });
  } catch (err) {
    throw new ExecutionError("CAPABILITY_DENIED", `S5 trusted source unavailable: ${err.message}`);
  }
}

// AS90-F003 + AS92-F001: verify an issuance-time adapter result. Returns the
// fields the immutable permit body binds.
export function verifyIssuanceResult(result, { expectedIntent, identity }) {
  const d = result?.decision;
  const p = result?.presented;
  if (!d || d.outcome !== "ALLOW") fail("CAPABILITY_DENIED", `S5 denied shell.exec: ${d?.denial_reason ?? "no decision"}`);
  if (!p || canonicalJson(pickAxes(p.request_intent)) !== canonicalJson(pickAxes(expectedIntent))) fail("CAPABILITY_DENIED", "S5 presented intent does not match the expected canonical axes");
  if (Object.keys(p.request_intent).some((k) => !INTENT_AXES.includes(k))) fail("CAPABILITY_DENIED", "S5 presented intent carries unexpected axes");
  if (d.policy_version !== p.request_intent.policy_version) fail("CAPABILITY_DENIED", "S5 decision policy_version differs from the intent's");
  const sf = subjectFailure(p.subject_context, identity);
  if (sf) fail("CAPABILITY_DENIED", sf);
  return {
    s5_request_intent: pickAxes(p.request_intent),
    s5_request_intent_digest: sha256(canonicalJson(pickAxes(p.request_intent))),
    s5_presented_digest: sha256(canonicalJson({ request_intent: p.request_intent, subject_context: p.subject_context, evaluation_context: p.evaluation_context })),
    s5_subject_binding: { actor_id: p.subject_context.actor_id, actor_role: p.subject_context.actor_role },
    s5_decision: {
      outcome: d.outcome, denial_reason: d.denial_reason, descriptor_id: d.descriptor_id, policy_version: d.policy_version, non_authority_disclaimer: d.non_authority_disclaimer,
    },
    s5_consequence_tier: result.consequence_tier ?? null,
  };
}

// AS91-F001 + AS92-F001: verify the claim-time fresh result against the stored
// binding AND the immutable Execution Identity (direct field comparison).
export function verifyClaimResult(result, { permit, identity }) {
  const d = result?.decision;
  const p = result?.presented;
  if (!d || d.outcome !== "ALLOW") fail("CAPABILITY_DENIED", `claim-time S5 check denied: ${d?.denial_reason ?? "no decision"}`);
  if (!p || canonicalJson(pickAxes(p.request_intent)) !== canonicalJson(permit.s5_request_intent)) fail("CAPABILITY_DENIED", "claim-time presented intent differs from the pinned binding");
  if (d.descriptor_id !== permit.s5_decision.descriptor_id || d.policy_version !== permit.s5_decision.policy_version) fail("CAPABILITY_DENIED", "claim-time descriptor or policy version differs from issuance");
  const sf = subjectFailure(p.subject_context, identity);
  if (sf) fail("CAPABILITY_DENIED", `claim-time ${sf}`);
  if (p.subject_context.actor_id !== permit.s5_subject_binding.actor_id || p.subject_context.actor_role !== permit.s5_subject_binding.actor_role) {
    fail("CAPABILITY_DENIED", "claim-time subject differs from the stored issuance subject binding");
  }
  return { outcome: d.outcome, descriptor_id: d.descriptor_id, policy_version: d.policy_version, presented_intent_digest: sha256(canonicalJson(pickAxes(p.request_intent))) };
}

// Immutable permit body, fixed member order; permit_digest = SHA-256(bytes).
export function buildPermitBody(f) {
  return JSON.stringify({
    permit_id: f.permitId,
    instance_id: f.instanceId,
    request_id: f.requestId,
    identity_digest: f.identityDigest,
    checkpoint_revision: f.checkpointRevision,
    argv_digest: f.argvDigest,
    cwd: f.cwd,
    environment_digest: f.environmentDigest,
    s5_request_intent: f.s5.s5_request_intent,
    s5_request_intent_digest: f.s5.s5_request_intent_digest,
    s5_presented_digest: f.s5.s5_presented_digest,
    s5_subject_binding: f.s5.s5_subject_binding,
    s5_decision: f.s5.s5_decision,
    s5_consequence_tier: f.s5.s5_consequence_tier,
    issued_at: f.issuedAt,
    claim_deadline: f.claimDeadline,
    single_use: true,
  });
}

export function parsePermitBody(bytes, expectedDigest) {
  if (typeof bytes !== "string" || !HEX64.test(expectedDigest ?? "") || sha256(bytes) !== expectedDigest) {
    fail("ISOLATION_UNPROVABLE", "permit body does not hash to its recorded permit_digest");
  }
  return JSON.parse(bytes);
}

// RFC-019 §13.1 Execution Report (AS94-F004). Every field is required (null
// where the contract allows it) and validated; contradictory combinations fail
// closed. `terminated` states whether every reported process group has ended:
//   - true:  ended_at is an instant not before started_at, and exactly one of
//            exit_code (0..255) / signal ("SIG...") is set;
//   - false: ended_at, exit_code and signal are null, and at least one live
//            process group is reported (it must be proven gone by quiesce).
export const REPORT_FIELDS = Object.freeze([
  "permit_id", "instance_id", "argv_digest", "environment_digest", "process_groups", "started_at", "ended_at",
  "exit_code", "signal", "stdout_digest", "stderr_digest", "terminated",
]);
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/;
const SIGNAL = /^SIG[A-Z0-9]{1,15}$/;

// Milliseconds for a strict UTC instant, or null (rejects rollover dates).
export function instantMs(v) {
  const m = typeof v === "string" ? INSTANT.exec(v) : null;
  if (!m) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const same = d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() + 1 === Number(m[2]) && d.getUTCDate() === Number(m[3])
    && d.getUTCHours() === Number(m[4]) && d.getUTCMinutes() === Number(m[5]) && d.getUTCSeconds() === Number(m[6]);
  return same ? t : null;
}

export function validateReport(report) {
  const r = report ?? {};
  const bad = [];
  if (typeof report !== "object" || report === null || Array.isArray(report)) fail("ISOLATION_UNPROVABLE", "execution report invalid: not an object");
  const missing = REPORT_FIELDS.filter((k) => !Object.hasOwn(r, k));
  if (missing.length) bad.push(`missing ${missing.join(",")}`);
  const extra = Object.keys(r).filter((k) => !REPORT_FIELDS.includes(k));
  if (extra.length) bad.push(`unknown fields ${extra.join(",")}`);
  if (!ID128.test(r.permit_id ?? "")) bad.push("permit_id");
  if (!ID128.test(r.instance_id ?? "")) bad.push("instance_id");
  if (!HEX64.test(r.argv_digest ?? "")) bad.push("argv_digest");
  if (!HEX64.test(r.environment_digest ?? "")) bad.push("environment_digest");
  if (!Array.isArray(r.process_groups) || r.process_groups.some((g) => !Number.isInteger(g) || g <= 1) || new Set(r.process_groups).size !== r.process_groups.length) bad.push("process_groups");
  const started = instantMs(r.started_at);
  if (started === null) bad.push("started_at");
  const ended = r.ended_at === null ? null : instantMs(r.ended_at);
  if (r.ended_at !== null && ended === null) bad.push("ended_at");
  if (r.exit_code !== null && !(Number.isInteger(r.exit_code) && r.exit_code >= 0 && r.exit_code <= 255)) bad.push("exit_code");
  if (r.signal !== null && !(typeof r.signal === "string" && SIGNAL.test(r.signal))) bad.push("signal");
  for (const k of ["stdout_digest", "stderr_digest"]) if (r[k] !== null && !HEX64.test(r[k] ?? "")) bad.push(k);
  if (typeof r.terminated !== "boolean") bad.push("terminated");
  if (r.terminated === true) {
    if (r.ended_at === null) bad.push("terminated report without ended_at");
    if (started !== null && ended !== null && ended < started) bad.push("ended_at before started_at");
    if ((r.exit_code === null) === (r.signal === null)) bad.push("terminated report needs exactly one of exit_code / signal");
  } else if (r.terminated === false) {
    if (r.ended_at !== null || r.exit_code !== null || r.signal !== null) bad.push("unterminated report cannot carry ended_at / exit_code / signal");
    if (Array.isArray(r.process_groups) && r.process_groups.length === 0) bad.push("unterminated report must name its live process groups");
  }
  if (bad.length) fail("ISOLATION_UNPROVABLE", `execution report invalid: ${bad.join("; ")}`);
  return r;
}

// The durable evidence form of a verified report: every contract field except
// the two identifiers (which key the record), plus its canonical digest.
export function reportEvidence(report) {
  const evidence = Object.fromEntries(REPORT_FIELDS.filter((k) => k !== "permit_id" && k !== "instance_id").map((k) => [k, report[k]]));
  return { ...evidence, report_digest: sha256(canonicalJson(evidence)) };
}
