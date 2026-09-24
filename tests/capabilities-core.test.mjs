// S5 Capability & Permission Gateway V1 -- focused tests of the INTERNAL pure
// core (ML-DEVOS-RFC-017 §2-§6, §11, §12; D-063).
//
// node:test runs each file in its own process. This file claims the brand
// minters itself (it never imports the adapters), so it can hand GENUINE
// branded contexts to evaluate() and exercise every step directly. The last
// test proves that this early claim makes the real adapter registry fail
// closed on import.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registerAdapters, RegistrySealedError, snapshot } from "../devos/capabilities/trusted-context.mjs";
import { evaluate } from "../devos/capabilities/evaluate.mjs";
import { loadCapabilityPolicy, PolicyValidationError, validateCapabilityPolicy } from "../devos/capabilities/validate-capability-policy.mjs";
import { DENIAL_REASONS, NON_AUTHORITY_DISCLAIMER } from "../devos/capabilities/vocabulary.mjs";
import { createAuditEnvelope, AuditEnvelopeError } from "../devos/capabilities/audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = path.join(ROOT, "devos", "capabilities", "examples");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(EXAMPLES, rel), "utf8"));

const minters = registerAdapters((m) => m);
const P = "Dillaab-source/maisog-labs";
const T0 = "2026-09-24T12:00:00.000Z";

function subject(over = {}, adapter = "github") {
  return minters[adapter].subject({
    actor_role: "Builder", actor_id: "builder-1", credential_class: "github_pat_scoped",
    credential_available: true, attestation_ref: "job-1", ...over,
  });
}
const when = (time = T0, adapter = "github") => minters[adapter].evaluation({ time });

function D(over = {}) {
  return {
    descriptor_id: "GH-FEATURE", actor_role: "Builder", project: P, provider: "github", action: "git.push",
    resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/*"], environment: "local", expiry: null,
    credential_requirement: { required: false, credential_class: null }, consequence_tier: "low", ...over,
  };
}
const policyOf = (descriptors, policy_version = "v1") => loadCapabilityPolicy({ policy_version, descriptors });
function intent(over = {}) {
  return {
    project: P, provider: "github", action: "git.push", resource: "dillaab-source/maisog-labs:refs/heads/feature/x",
    environment: "local", policy_version: "v1", ...over,
  };
}
const run = (pol, over = {}, { s = subject(), e = when(), rev = [] } = {}) => evaluate(s, intent(over), pol, rev, e);
const reason = (d) => d.denial_reason;

// ------------------------------------------------ every canonical denial code

test("the canonical denial vocabulary is exactly the RFC-017 §4 enum", () => {
  assert.deepEqual([...DENIAL_REASONS], [
    "UNTRUSTED_SUBJECT_CONTEXT", "UNTRUSTED_EVALUATION_CONTEXT", "UNKNOWN_ACTOR_ROLE", "UNKNOWN_PROVIDER",
    "UNKNOWN_ACTION", "UNKNOWN_PROJECT", "UNKNOWN_ENVIRONMENT", "RESOURCE_SCOPE_MISMATCH", "POLICY_VERSION_MISMATCH",
    "AMBIGUOUS_POLICY_MATCH", "EXPIRED", "REVOKED", "CREDENTIAL_REQUIREMENT_UNSATISFIED", "MALFORMED_REQUEST",
  ]);
});

test("UNTRUSTED_SUBJECT_CONTEXT: missing, malformed, and perfectly shaped hand-built literals are mechanically rejected", () => {
  const pol = policyOf([D()]);
  const literal = { actor_role: "Builder", actor_id: "builder-1", credential_class: "github_pat_scoped", credential_available: true, attested_by: "github", attestation_ref: "job-1" };
  for (const s of [undefined, null, {}, literal, Object.freeze({ ...literal }), snapshot(subject())]) {
    assert.equal(reason(evaluate(s, intent(), pol, [], when())), "UNTRUSTED_SUBJECT_CONTEXT");
  }
  // A genuine context whose attested_by was tampered with is no longer trusted.
  assert.throws(() => { subject().attested_by = "shell"; }, TypeError); // frozen
});

test("UNTRUSTED_EVALUATION_CONTEXT: hand-built or replayed-snapshot times are rejected; a subject brand is not an evaluation brand", () => {
  const pol = policyOf([D()]);
  for (const e of [undefined, { time: T0 }, snapshot(when()), subject()]) {
    assert.equal(reason(evaluate(subject(), intent(), pol, [], e)), "UNTRUSTED_EVALUATION_CONTEXT");
  }
  assert.equal(reason(evaluate(when(), intent(), pol, [], when())), "UNTRUSTED_SUBJECT_CONTEXT");
});

test("UNKNOWN_ACTOR_ROLE / UNKNOWN_PROVIDER / UNKNOWN_ENVIRONMENT / UNKNOWN_PROJECT / UNKNOWN_ACTION", () => {
  const pol = policyOf([D()]);
  assert.equal(reason(run(pol, {}, { s: subject({ actor_role: "Orchestrator" }) })), "UNKNOWN_ACTOR_ROLE");
  assert.equal(reason(run(pol, { provider: "future" })), "UNKNOWN_PROVIDER");
  assert.equal(reason(run(pol, { provider: "n8n" })), "UNKNOWN_PROVIDER");
  assert.equal(reason(run(pol, { environment: "prod" })), "UNKNOWN_ENVIRONMENT");
  assert.equal(reason(run(pol, { project: "someone/else" })), "UNKNOWN_PROJECT");
  assert.equal(reason(run(pol, { action: "git.push_force" })), "UNKNOWN_ACTION");
});

test("RESOURCE_SCOPE_MISMATCH: an overly broad-looking pattern is still bounded to what it literally matches", () => {
  const pol = policyOf([D()]);
  assert.equal(reason(run(pol, { resource: "dillaab-source/maisog-labs:refs/heads/main" })), "RESOURCE_SCOPE_MISMATCH");
  // "P/*" requires at least one segment beyond the stem.
  assert.equal(reason(run(pol, { resource: "dillaab-source/maisog-labs:refs/heads/feature" })), "RESOURCE_SCOPE_MISMATCH");
  assert.equal(reason(run(pol, { resource: "dillaab-source/maisog-labs:refs/heads/featurex/y" })), "RESOURCE_SCOPE_MISMATCH");
});

test("POLICY_VERSION_MISMATCH: pinned version differs, or the presented policy was never loaded/validated", () => {
  const pol = policyOf([D()]);
  assert.equal(reason(run(pol, { policy_version: "v2" })), "POLICY_VERSION_MISMATCH");
  const unloaded = { policy_version: "v1", descriptors: [D({ resource_scope: ["*"] })] };
  assert.equal(reason(run(unloaded)), "POLICY_VERSION_MISMATCH");
  assert.equal(reason(run(null)), "POLICY_VERSION_MISMATCH");
});

test("AMBIGUOUS_POLICY_MATCH: a top-rank tie denies even when tier and credential requirement agree", () => {
  const pol = policyOf([D({ descriptor_id: "GH-A" }), D({ descriptor_id: "GH-B" })]);
  assert.equal(reason(run(pol)), "AMBIGUOUS_POLICY_MATCH");
  const exactTie = policyOf([
    D({ descriptor_id: "GH-A", resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/x"] }),
    D({ descriptor_id: "GH-B", resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/x", "*"], consequence_tier: "high" }), // "*" reaches main (§8)
  ]);
  assert.equal(reason(run(exactTie)), "AMBIGUOUS_POLICY_MATCH");
});

test("EXPIRED at exactly the expiry instant and one tick past; valid one tick before", () => {
  const pol = policyOf([D({ expiry: T0 })]);
  assert.equal(run(pol, {}, { e: when("2026-09-24T11:59:59.999Z") }).outcome, "ALLOW");
  assert.equal(reason(run(pol, {}, { e: when(T0) })), "EXPIRED");
  assert.equal(reason(run(pol, {}, { e: when("2026-09-24T12:00:00.001Z") })), "EXPIRED");
});

test("requestIntent cannot carry any time-bearing (or any extra) field to influence expiry", () => {
  const pol = policyOf([D({ expiry: T0 })]);
  for (const extra of [{ time: "2020-01-01T00:00:00Z" }, { evaluation_time: "2020-01-01T00:00:00Z" }, { now: 0 }, { actor_role: "Paulo" }]) {
    assert.equal(reason(run(pol, extra, { e: when("2027-01-01T00:00:00Z") })), "MALFORMED_REQUEST");
  }
});

test("REVOKED: live revocation overrides a still-valid pinned policy version", () => {
  const v1 = policyOf([D({ descriptor_id: "GH-OLD" })], "v1");
  assert.equal(run(v1).outcome, "ALLOW");
  assert.equal(reason(run(v1, {}, { rev: ["GH-OLD"] })), "REVOKED");
  assert.equal(run(v1, {}, { rev: ["SOMETHING-ELSE"] }).outcome, "ALLOW");
});

test("CREDENTIAL_REQUIREMENT_UNSATISFIED: satisfied vs unavailable vs wrong class", () => {
  const pol = policyOf([D({ credential_requirement: { required: true, credential_class: "github_pat_scoped" } })]);
  assert.equal(run(pol).outcome, "ALLOW");
  assert.equal(reason(run(pol, {}, { s: subject({ credential_available: false }) })), "CREDENTIAL_REQUIREMENT_UNSATISFIED");
  assert.equal(reason(run(pol, {}, { s: subject({ credential_class: "cloudflare_api_token" }) })), "CREDENTIAL_REQUIREMENT_UNSATISFIED");
  assert.equal(reason(run(pol, {}, { s: subject({ credential_class: null, credential_available: true }) })), "CREDENTIAL_REQUIREMENT_UNSATISFIED");
});

test("MALFORMED_REQUEST: structural defects, non-canonical resource presented to the core, bad revocation list", () => {
  const pol = policyOf([D()]);
  assert.equal(reason(evaluate(subject(), null, pol, [], when())), "MALFORMED_REQUEST");
  assert.equal(reason(run(pol, { resource: "" })), "MALFORMED_REQUEST");
  assert.equal(reason(run(pol, { project: "*" })), "MALFORMED_REQUEST");
  // The core never canonicalizes: an un-normalized value is rejected, not fixed.
  assert.equal(reason(run(pol, { resource: "Dillaab-Source/Maisog-Labs:refs/heads/feature/x" })), "MALFORMED_REQUEST");
  assert.equal(reason(run(pol, {}, { rev: "GH-FEATURE" })), "MALFORMED_REQUEST");
  assert.equal(reason(run(pol, {}, { rev: [42] })), "MALFORMED_REQUEST");
});

test("every one of the 14 codes is produced by at least one case above (coverage guard)", () => {
  const pol = policyOf([D({ credential_requirement: { required: true, credential_class: "github_pat_scoped" }, expiry: T0 })]);
  const tie = policyOf([D({ descriptor_id: "GH-A" }), D({ descriptor_id: "GH-B" })]);
  const seen = new Set([
    reason(evaluate({}, intent(), pol, [], when())),
    reason(evaluate(subject(), intent(), pol, [], {})),
    reason(run(pol, {}, { s: subject({ actor_role: "Nobody" }) })),
    reason(run(pol, { provider: "n8n" })),
    reason(run(pol, { action: "x.y" })),
    reason(run(pol, { project: "a/b" })),
    reason(run(pol, { environment: "moon" })),
    reason(run(pol, { resource: "dillaab-source/maisog-labs:refs/tags/v1" })),
    reason(run(pol, { policy_version: "v9" })),
    reason(run(tie)),
    reason(run(pol, {}, { e: when(T0) })),
    reason(run(pol, {}, { e: when("2026-01-01T00:00:00Z"), rev: ["GH-FEATURE"] })),
    reason(run(pol, {}, { e: when("2026-01-01T00:00:00Z"), s: subject({ credential_available: false }) })),
    reason(run(pol, { extra: "x" })),
  ]);
  assert.deepEqual([...seen].sort(), [...DENIAL_REASONS].sort());
});

// ------------------------------------------------------ precedence (§2)

test("precedence: exact literal > longer prefix > shorter prefix > bare *, and exact project > project *", () => {
  const pol = policyOf([
    D({ descriptor_id: "ANY", resource_scope: ["*"], consequence_tier: "high" }), // "*" reaches main (§8)
    D({ descriptor_id: "SHORT", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/*"] }),
    D({ descriptor_id: "LONG", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/x/*"] }),
    D({ descriptor_id: "EXACT", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/x/hotfix"] }),
    D({ descriptor_id: "WIDE-PROJECT", project: "*", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/x/hotfix"] }),
  ]);
  const idFor = (ref) => run(pol, { resource: `dillaab-source/maisog-labs:refs/heads/${ref}` }).descriptor_id;
  assert.equal(idFor("release/x/hotfix"), "EXACT");
  assert.equal(idFor("release/x/other"), "LONG");
  assert.equal(idFor("release/y"), "SHORT");
  assert.equal(idFor("anything"), "ANY");
  // Project specificity outranks resource specificity.
  const projectFirst = policyOf([
    D({ descriptor_id: "EXACT-PROJECT-ANY", resource_scope: ["*"], consequence_tier: "high" }),
    D({ descriptor_id: "STAR-PROJECT-EXACT", project: "*", resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/x"] }),
  ]);
  assert.equal(run(projectFirst).descriptor_id, "EXACT-PROJECT-ANY");
});

// ------------------------------------------ pinning / supersession (§6, D-063)

test("supersession: a descriptor absent from a newer version is not grantable to new attempts, but an attempt pinned to the older version keeps it until expiry or revocation", () => {
  const v1 = loadCapabilityPolicy(readJson("valid/pinning-v1.policy.json"));
  const v2 = loadCapabilityPolicy(readJson("valid/pinning-v2.policy.json"));
  const legacy = { resource: "dillaab-source/maisog-labs:refs/heads/legacy/a" };
  // In-flight attempt pinned to v1: not retroactively invalidated.
  assert.equal(run(v1, { ...legacy, policy_version: v1.policy_version }).descriptor_id, "GH-PUSH-LEGACY");
  // New attempt pinned to v2: not grantable after supersession.
  assert.equal(reason(run(v2, { ...legacy, policy_version: v2.policy_version })), "RESOURCE_SCOPE_MISMATCH");
  // Emergency path: live revocation still reaches the v1-pinned attempt.
  assert.equal(reason(run(v1, { ...legacy, policy_version: v1.policy_version }, { rev: ["GH-PUSH-LEGACY"] })), "REVOKED");
});

// ---------------------------------------------- tier rule is load-time only (§8)

test("sensitive tier: under-classification fails at policy load, and evaluate() never consults consequence_tier", () => {
  const mainMerge = D({ descriptor_id: "GH-MERGE", action: "pr.merge", resource_scope: ["dillaab-source/maisog-labs:refs/heads/main"] });
  assert.throws(() => policyOf([mainMerge]), (e) => e instanceof PolicyValidationError && e.errors.some((m) => m.includes("RFC-017 §8")));
  for (const scope of [["*"], ["dillaab-source/*"], ["dillaab-source/maisog-labs:refs/heads/*"]]) {
    const r = validateCapabilityPolicy({ policy_version: "v1", descriptors: [D({ action: "git.push", resource_scope: scope })] });
    assert.equal(r.ok, false, `push scope ${scope} can reach main and must be high/highest`);
  }
  const high = policyOf([{ ...mainMerge, consequence_tier: "high" }]);
  const d = run(high, { action: "pr.merge", resource: "dillaab-source/maisog-labs:refs/heads/main" });
  assert.equal(d.outcome, "ALLOW");
  assert.equal("consequence_tier" in d, false);
  const src = fs.readFileSync(path.join(ROOT, "devos/capabilities/evaluate.mjs"), "utf8");
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ""), /consequence_tier|SENSITIVE_ACTIONS/);
});

// ---------------------------------------------------- purity + envelope (§11, §12)

test("purity: identical arguments give byte-identical decisions; no clock, randomness, id or timestamp", () => {
  const pol = policyOf([D({ expiry: "2027-01-01T00:00:00Z" })]);
  const s = subject();
  const e = when();
  const realNow = Date.now;
  const realRandom = Math.random;
  const RealDate = globalThis.Date;
  Date.now = () => { throw new Error("evaluate() must not read the clock"); };
  Math.random = () => { throw new Error("evaluate() must not use randomness"); };
  try {
    const a = evaluate(s, intent(), pol, [], e);
    const b = evaluate(s, intent(), pol, [], e);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.ok(Object.isFrozen(a));
    assert.deepEqual(Object.keys(a).sort(), ["denial_reason", "descriptor_id", "non_authority_disclaimer", "outcome", "policy_version"]);
  } finally {
    Date.now = realNow;
    Math.random = realRandom;
    globalThis.Date = RealDate;
  }
  const src = fs.readFileSync(path.join(ROOT, "devos/capabilities/evaluate.mjs"), "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Date\.now|new Date\(|Math\.random|randomUUID|process\.hrtime|performance\.now|node:fs|fetch\(/);
});

test("envelope: separately constructed, caller-supplied id/timestamp/provenance; two envelopes around one decision differ; evaluation time is independent of envelope timestamp", () => {
  const pol = policyOf([D()]);
  const s = subject();
  const e = when("2026-09-24T12:00:00Z");
  const decision = evaluate(s, intent(), pol, [], e);
  const base = { decision, subjectContext: snapshot(s), requestIntent: intent(), evaluationContext: snapshot(e), consequenceTier: "low", evidenceProvenance: "ACTOR_REPORTED" };
  const one = createAuditEnvelope({ ...base, eventId: "evt-1", timestamp: "2026-09-24T12:00:05Z" });
  const two = createAuditEnvelope({ ...base, eventId: "evt-2", timestamp: "2026-09-24T12:07:00Z" });
  assert.equal(one.decision, two.decision);
  assert.notEqual(one.event_id, two.event_id);
  assert.notEqual(one.timestamp, two.timestamp);
  assert.notEqual(one.timestamp, one.evaluation_context.time);
  for (const missing of ["eventId", "timestamp", "evidenceProvenance"]) {
    assert.throws(() => createAuditEnvelope({ ...base, eventId: "x", timestamp: "2026-09-24T12:00:05Z", [missing]: undefined }), AuditEnvelopeError);
  }
  assert.throws(() => createAuditEnvelope({ ...base, eventId: "x", timestamp: "2026-09-24T12:00:05Z", evidenceProvenance: "TRUST_ME" }), AuditEnvelopeError);
  const tampered = { ...decision, non_authority_disclaimer: "ALLOW means approved." };
  assert.throws(() => createAuditEnvelope({ ...base, eventId: "x", timestamp: "2026-09-24T12:00:05Z", decision: tampered }), AuditEnvelopeError);
});

test("ALLOW carries descriptor_id, pinned policy_version, and the unweakened disclaimer; so does every DENY", () => {
  const pol = policyOf([D()]);
  const allow = run(pol);
  assert.deepEqual(allow, { outcome: "ALLOW", denial_reason: null, descriptor_id: "GH-FEATURE", policy_version: "v1", non_authority_disclaimer: NON_AUTHORITY_DISCLAIMER });
  assert.equal(run(pol, { action: "x.y" }).non_authority_disclaimer, NON_AUTHORITY_DISCLAIMER);
  assert.match(NON_AUTHORITY_DISCLAIMER, /does not itself grant governance authority/);
});

// ------------------------------------------------------------- no secrets (§7)

test("no secret values: the validator and envelope reject secret-shaped strings (built at runtime, never committed)", () => {
  const fake = ["gh", "p_", "A1b2C3d4E5f6G7h8I9j0K1l2M3n4o5p6q7r8"].join("");
  const r = validateCapabilityPolicy({ policy_version: "v1", descriptors: [D({ credential_requirement: { required: true, credential_class: fake } })] });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => m.includes("looks like a secret")));
  const pol = policyOf([D()]);
  const d = run(pol);
  assert.throws(() => createAuditEnvelope({ decision: d, subjectContext: { actor_id: fake }, requestIntent: intent(), evaluationContext: { time: T0 }, consequenceTier: null, eventId: "e", timestamp: T0, evidenceProvenance: "ACTOR_REPORTED" }), AuditEnvelopeError);
});

// ------------------------------------------------- registry sealing (§3, §9)

test("an early foreign claim of the minters makes the real adapter registry fail closed on import", async () => {
  assert.throws(() => registerAdapters((m) => m), RegistrySealedError);
  await assert.rejects(import("../devos/capabilities/adapters/index.mjs"), RegistrySealedError);
});
