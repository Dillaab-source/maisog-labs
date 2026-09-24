// S5 Capability & Permission Gateway V1 -- focused tests of the pure core's
// decision semantics (ML-DEVOS-RFC-017 §2-§6, §11, §12; D-063; AS-082).
//
// Since AS82-F001 no module releases a minter, so genuine trusted contexts
// exist only inside adapter wrappers. These tests therefore drive the core
// through the real adapter path, using a configurable trusted host (the
// legitimate createGateway() embedder API -- not a test hook) to control the
// subject facts, the trusted time, and the live revocation list. Hand-built
// contexts are handed to the raw core directly to prove they are rejected.
//
// Not executable through any public path (disclosed, verified by source
// inspection instead): UNKNOWN_PROVIDER, and evaluate()'s unloaded-policy and
// non-canonical-resource guards. Each is reachable only by a holder of
// genuine brands, and no caller can hold one; adapters answer a foreign
// provider name with MALFORMED_REQUEST and always present a loaded policy
// (or none) and an adapter-canonicalized resource.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createGateway } from "../devos/capabilities/index.mjs";
import * as trusted from "../devos/capabilities/trusted-context.mjs";
import { evaluate } from "../devos/capabilities/evaluate.mjs";
import { PolicyValidationError, validateCapabilityPolicy } from "../devos/capabilities/validate-capability-policy.mjs";
import { DENIAL_REASONS, NON_AUTHORITY_DISCLAIMER } from "../devos/capabilities/vocabulary.mjs";
import { createAuditEnvelope, AuditEnvelopeError } from "../devos/capabilities/audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = path.join(ROOT, "devos", "capabilities", "examples");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(EXAMPLES, rel), "utf8"));

const P = "Dillaab-source/maisog-labs";
const T0 = "2026-09-24T12:00:00.000Z";
const SUBJECT = { actor_role: "Builder", actor_id: "builder-1", credential_class: "github_pat_scoped", credential_available: true, attestation_ref: "job-1" };

function D(over = {}) {
  return {
    descriptor_id: "GH-FEATURE", actor_role: "Builder", project: P, provider: "github", action: "git.push",
    resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/*"], environment: "local", expiry: null,
    credential_requirement: { required: false, credential_class: null }, consequence_tier: "low", ...over,
  };
}
const doc = (descriptors, policy_version = "v1") => ({ policy_version, descriptors });
function intent(over = {}) {
  return {
    project: P, provider: "github", action: "git.push", resource: "dillaab-source/maisog-labs:refs/heads/feature/x",
    environment: "local", policy_version: "v1", ...over,
  };
}
// One decision through the real github adapter with a controlled trusted host.
function decide(policies, over = {}, { subject = {}, time = T0, rev = [] } = {}) {
  const gw = createGateway({
    policies: Array.isArray(policies) ? policies : [policies],
    hosts: { github: { subject: () => ({ ...SUBJECT, ...subject }), now: () => time, revocations: () => rev } },
  });
  return gw.github.request(intent(over));
}
const reason = (r) => r.decision.denial_reason;
const genuineSnapshots = () => decide(doc([D()])).presented;

// ------------------------------------------------ every canonical denial code

test("the canonical denial vocabulary is exactly the RFC-017 §4 enum", () => {
  assert.deepEqual([...DENIAL_REASONS], [
    "UNTRUSTED_SUBJECT_CONTEXT", "UNTRUSTED_EVALUATION_CONTEXT", "UNKNOWN_ACTOR_ROLE", "UNKNOWN_PROVIDER",
    "UNKNOWN_ACTION", "UNKNOWN_PROJECT", "UNKNOWN_ENVIRONMENT", "RESOURCE_SCOPE_MISMATCH", "POLICY_VERSION_MISMATCH",
    "AMBIGUOUS_POLICY_MATCH", "EXPIRED", "REVOKED", "CREDENTIAL_REQUIREMENT_UNSATISFIED", "MALFORMED_REQUEST",
  ]);
});

test("UNTRUSTED_SUBJECT_CONTEXT: missing, malformed, perfectly shaped literals, and replayed genuine snapshots are rejected", () => {
  const { subject_context: s, evaluation_context: e, request_intent: i } = genuineSnapshots();
  const literal = { ...SUBJECT, attested_by: "github" };
  for (const bad of [undefined, null, {}, literal, Object.freeze({ ...literal }), s]) {
    assert.equal(evaluate(bad, i, null, [], e).denial_reason, "UNTRUSTED_SUBJECT_CONTEXT");
  }
});

test("UNTRUSTED_EVALUATION_CONTEXT: hand-built or replayed-snapshot times are rejected", () => {
  // The subject must pass step (a) first, and no genuine subject is obtainable,
  // so evaluation-context rejection is proven at the verifier the core calls.
  const { evaluation_context: e } = genuineSnapshots();
  for (const bad of [undefined, null, { time: T0 }, e, Object.freeze({ time: T0 })]) {
    assert.equal(trusted.isTrustedEvaluationContext(bad), false);
  }
  const src = fs.readFileSync(path.join(ROOT, "devos/capabilities/evaluate.mjs"), "utf8");
  assert.match(src, /if \(!isTrustedEvaluationContext\(evaluationContext\)\) return denyDecision\("UNTRUSTED_EVALUATION_CONTEXT"\)/);
});

test("UNKNOWN_ACTOR_ROLE / UNKNOWN_ENVIRONMENT / UNKNOWN_PROJECT / UNKNOWN_ACTION", () => {
  const pol = doc([D()]);
  assert.equal(reason(decide(pol, {}, { subject: { actor_role: "Orchestrator" } })), "UNKNOWN_ACTOR_ROLE");
  assert.equal(reason(decide(pol, { environment: "prod" })), "UNKNOWN_ENVIRONMENT");
  assert.equal(reason(decide(pol, { project: "someone/else" })), "UNKNOWN_PROJECT");
  assert.equal(reason(decide(pol, { action: "git.push_force" })), "UNKNOWN_ACTION");
  // A foreign provider name never reaches the core through an adapter.
  assert.equal(reason(decide(pol, { provider: "n8n" })), "MALFORMED_REQUEST");
});

test("RESOURCE_SCOPE_MISMATCH: an overly broad-looking pattern is still bounded to what it literally matches", () => {
  const pol = doc([D()]);
  assert.equal(reason(decide(pol, { resource: "dillaab-source/maisog-labs:refs/heads/main" })), "RESOURCE_SCOPE_MISMATCH");
  assert.equal(reason(decide(pol, { resource: "dillaab-source/maisog-labs:refs/heads/feature" })), "RESOURCE_SCOPE_MISMATCH");
  assert.equal(reason(decide(pol, { resource: "dillaab-source/maisog-labs:refs/heads/featurex/y" })), "RESOURCE_SCOPE_MISMATCH");
});

test("POLICY_VERSION_MISMATCH: the attempt pins a version the gateway does not hold", () => {
  assert.equal(reason(decide(doc([D()]), { policy_version: "v2" })), "POLICY_VERSION_MISMATCH");
});

test("AMBIGUOUS_POLICY_MATCH: a top-rank tie denies even when tier and credential requirement agree", () => {
  assert.equal(reason(decide(doc([D({ descriptor_id: "GH-A" }), D({ descriptor_id: "GH-B" })]))), "AMBIGUOUS_POLICY_MATCH");
  const exactTie = doc([
    D({ descriptor_id: "GH-A", resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/x"] }),
    D({ descriptor_id: "GH-B", resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/x", "*"], consequence_tier: "high" }), // "*" reaches main (§8)
  ]);
  assert.equal(reason(decide(exactTie)), "AMBIGUOUS_POLICY_MATCH");
});

test("EXPIRED at exactly the expiry instant and one tick past; valid one tick before", () => {
  const pol = doc([D({ expiry: T0 })]);
  assert.equal(decide(pol, {}, { time: "2026-09-24T11:59:59.999Z" }).decision.outcome, "ALLOW");
  assert.equal(reason(decide(pol, {}, { time: T0 })), "EXPIRED");
  assert.equal(reason(decide(pol, {}, { time: "2026-09-24T12:00:00.001Z" })), "EXPIRED");
});

test("requestIntent cannot carry any time-bearing (or any extra) field to influence expiry", () => {
  const pol = doc([D({ expiry: T0 })]);
  for (const extra of [{ time: "2020-01-01T00:00:00Z" }, { evaluation_time: "2020-01-01T00:00:00Z" }, { now: 0 }, { actor_role: "Paulo" }]) {
    assert.equal(reason(decide(pol, extra, { time: "2027-01-01T00:00:00Z" })), "MALFORMED_REQUEST");
  }
});

test("REVOKED: live revocation overrides a still-valid pinned policy version", () => {
  const pol = doc([D({ descriptor_id: "GH-OLD" })]);
  assert.equal(decide(pol).decision.outcome, "ALLOW");
  assert.equal(reason(decide(pol, {}, { rev: ["GH-OLD"] })), "REVOKED");
  assert.equal(decide(pol, {}, { rev: ["SOMETHING-ELSE"] }).decision.outcome, "ALLOW");
});

test("CREDENTIAL_REQUIREMENT_UNSATISFIED: satisfied vs unavailable vs wrong class", () => {
  const pol = doc([D({ credential_requirement: { required: true, credential_class: "github_pat_scoped" } })]);
  assert.equal(decide(pol).decision.outcome, "ALLOW");
  assert.equal(reason(decide(pol, {}, { subject: { credential_available: false } })), "CREDENTIAL_REQUIREMENT_UNSATISFIED");
  assert.equal(reason(decide(pol, {}, { subject: { credential_class: "cloudflare_api_token" } })), "CREDENTIAL_REQUIREMENT_UNSATISFIED");
  assert.equal(reason(decide(pol, {}, { subject: { credential_class: null, credential_available: true } })), "CREDENTIAL_REQUIREMENT_UNSATISFIED");
});

test("MALFORMED_REQUEST: structural defects and malformed revocation entries; adapters canonicalize before the core", () => {
  const pol = doc([D()]);
  const gw = createGateway({ policies: [pol], hosts: { github: { subject: () => SUBJECT, now: () => T0, revocations: () => [] } } });
  assert.equal(gw.github.request(null).decision.denial_reason, "MALFORMED_REQUEST");
  assert.equal(reason(decide(pol, { resource: "" })), "MALFORMED_REQUEST");
  assert.equal(reason(decide(pol, { project: "*" })), "MALFORMED_REQUEST");
  assert.equal(reason(decide(pol, {}, { rev: [42] })), "MALFORMED_REQUEST");
  const r = decide(pol, { resource: "Dillaab-Source/Maisog-Labs:refs/heads/feature/x" });
  assert.equal(r.decision.outcome, "ALLOW");
  assert.equal(r.presented.request_intent.resource, "dillaab-source/maisog-labs:refs/heads/feature/x");
});

test("coverage guard: 13 of the 14 codes are produced through the public path; UNKNOWN_PROVIDER is core-only by construction", () => {
  const pol = doc([D({ credential_requirement: { required: true, credential_class: "github_pat_scoped" }, expiry: T0 })]);
  const tie = doc([D({ descriptor_id: "GH-A" }), D({ descriptor_id: "GH-B" })]);
  const early = "2026-01-01T00:00:00Z";
  const { subject_context: s, request_intent: i } = genuineSnapshots();
  const seen = new Set([
    evaluate({}, i, null, [], {}).denial_reason,
    trusted.isTrustedEvaluationContext({ time: T0 }) ? "unexpected" : "UNTRUSTED_EVALUATION_CONTEXT",
    reason(decide(pol, {}, { subject: { actor_role: "Nobody" }, time: early })),
    reason(decide(pol, { action: "x.y" }, { time: early })),
    reason(decide(pol, { project: "a/b" }, { time: early })),
    reason(decide(pol, { environment: "moon" }, { time: early })),
    reason(decide(pol, { resource: "dillaab-source/maisog-labs:refs/tags/v1" }, { time: early })),
    reason(decide(pol, { policy_version: "v9" }, { time: early })),
    reason(decide(tie)),
    reason(decide(pol, {}, { time: T0 })),
    reason(decide(pol, {}, { time: early, rev: ["GH-FEATURE"] })),
    reason(decide(pol, {}, { time: early, subject: { credential_available: false } })),
    reason(decide(pol, { extra: "x" }, { time: early })),
  ]);
  assert.equal(evaluate(s, i, null, [], {}).denial_reason, "UNTRUSTED_SUBJECT_CONTEXT");
  assert.deepEqual([...seen].sort(), DENIAL_REASONS.filter((c) => c !== "UNKNOWN_PROVIDER").sort());
  const src = fs.readFileSync(path.join(ROOT, "devos/capabilities/evaluate.mjs"), "utf8");
  assert.match(src, /if \(!PROVIDERS\.includes\(provider\)\) return denyDecision\("UNKNOWN_PROVIDER", pinned\)/);
});

// ------------------------------------------------------ precedence (§2)

test("precedence: exact literal > longer prefix > shorter prefix > bare *, and exact project > project *", () => {
  const pol = doc([
    D({ descriptor_id: "ANY", resource_scope: ["*"], consequence_tier: "high" }), // "*" reaches main (§8)
    D({ descriptor_id: "SHORT", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/*"] }),
    D({ descriptor_id: "LONG", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/x/*"] }),
    D({ descriptor_id: "EXACT", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/x/hotfix"] }),
    D({ descriptor_id: "WIDE-PROJECT", project: "*", resource_scope: ["dillaab-source/maisog-labs:refs/heads/release/x/hotfix"] }),
  ]);
  const idFor = (ref) => decide(pol, { resource: `dillaab-source/maisog-labs:refs/heads/${ref}` }).decision.descriptor_id;
  assert.equal(idFor("release/x/hotfix"), "EXACT");
  assert.equal(idFor("release/x/other"), "LONG");
  assert.equal(idFor("release/y"), "SHORT");
  assert.equal(idFor("anything"), "ANY");
  const projectFirst = doc([
    D({ descriptor_id: "EXACT-PROJECT-ANY", resource_scope: ["*"], consequence_tier: "high" }),
    D({ descriptor_id: "STAR-PROJECT-EXACT", project: "*", resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/x"] }),
  ]);
  assert.equal(decide(projectFirst).decision.descriptor_id, "EXACT-PROJECT-ANY");
});

// ------------------------------------------ pinning / supersession (§6, D-063)

test("supersession: a descriptor absent from a newer version is not grantable to new attempts, but an attempt pinned to the older version keeps it until expiry or revocation", () => {
  const v1 = readJson("valid/pinning-v1.policy.json");
  const v2 = readJson("valid/pinning-v2.policy.json");
  const legacy = { resource: "dillaab-source/maisog-labs:refs/heads/legacy/a" };
  assert.equal(decide([v1, v2], { ...legacy, policy_version: v1.policy_version }).decision.descriptor_id, "GH-PUSH-LEGACY");
  assert.equal(reason(decide([v1, v2], { ...legacy, policy_version: v2.policy_version })), "RESOURCE_SCOPE_MISMATCH");
  assert.equal(reason(decide([v1, v2], { ...legacy, policy_version: v1.policy_version }, { rev: ["GH-PUSH-LEGACY"] })), "REVOKED");
});

// ---------------------------------------------- tier rule is load-time only (§8)

test("sensitive tier: under-classification fails at policy load, and evaluate() never consults consequence_tier", () => {
  const mainMerge = D({ descriptor_id: "GH-MERGE", action: "pr.merge", resource_scope: ["dillaab-source/maisog-labs:refs/heads/main"] });
  assert.throws(() => decide(doc([mainMerge])), (e) => e instanceof PolicyValidationError && e.errors.some((m) => m.includes("RFC-017 §8")));
  for (const scope of [["*"], ["dillaab-source/*"], ["dillaab-source/maisog-labs:refs/heads/*"]]) {
    const r = validateCapabilityPolicy(doc([D({ action: "git.push", resource_scope: scope })]));
    assert.equal(r.ok, false, `push scope ${scope} can reach main and must be high/highest`);
  }
  const d = decide(doc([{ ...mainMerge, consequence_tier: "high" }]), { action: "pr.merge", resource: "dillaab-source/maisog-labs:refs/heads/main" }).decision;
  assert.equal(d.outcome, "ALLOW");
  assert.equal("consequence_tier" in d, false);
  const src = fs.readFileSync(path.join(ROOT, "devos/capabilities/evaluate.mjs"), "utf8");
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ""), /consequence_tier|SENSITIVE_ACTIONS/);
});

// ---------------------------------------------------- purity + envelope (§11, §12)

test("purity: identical inputs give byte-identical decisions; no clock or randomness on the decision path", () => {
  const pol = doc([D({ expiry: "2027-01-01T00:00:00Z" })]);
  const gw = createGateway({ policies: [pol], hosts: { github: { subject: () => SUBJECT, now: () => T0, revocations: () => [] } } });
  const realNow = Date.now;
  const realRandom = Math.random;
  Date.now = () => { throw new Error("the decision path must not read the clock"); };
  Math.random = () => { throw new Error("the decision path must not use randomness"); };
  try {
    const a = gw.github.request(intent()).decision;
    const b = gw.github.request(intent()).decision;
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.ok(Object.isFrozen(a));
    assert.deepEqual(Object.keys(a).sort(), ["denial_reason", "descriptor_id", "non_authority_disclaimer", "outcome", "policy_version"]);
  } finally {
    Date.now = realNow;
    Math.random = realRandom;
  }
  const src = fs.readFileSync(path.join(ROOT, "devos/capabilities/evaluate.mjs"), "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Date\.now|new Date\(|Math\.random|randomUUID|process\.hrtime|performance\.now|node:fs|fetch\(/);
});

test("envelope: separately constructed, caller-supplied id/timestamp/provenance; two envelopes around one decision differ; evaluation time is independent of envelope timestamp", () => {
  const r = decide(doc([D()]), {}, { time: "2026-09-24T12:00:00Z" });
  const base = {
    decision: r.decision, subjectContext: r.presented.subject_context, requestIntent: r.presented.request_intent,
    evaluationContext: r.presented.evaluation_context, consequenceTier: r.consequence_tier, evidenceProvenance: "ACTOR_REPORTED",
  };
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
  const tampered = { ...r.decision, non_authority_disclaimer: "ALLOW means approved." };
  assert.throws(() => createAuditEnvelope({ ...base, eventId: "x", timestamp: "2026-09-24T12:00:05Z", decision: tampered }), AuditEnvelopeError);
});

test("ALLOW carries descriptor_id, pinned policy_version, and the unweakened disclaimer; so does every DENY", () => {
  const pol = doc([D()]);
  assert.deepEqual({ ...decide(pol).decision }, { outcome: "ALLOW", denial_reason: null, descriptor_id: "GH-FEATURE", policy_version: "v1", non_authority_disclaimer: NON_AUTHORITY_DISCLAIMER });
  assert.equal(decide(pol, { action: "x.y" }).decision.non_authority_disclaimer, NON_AUTHORITY_DISCLAIMER);
  assert.match(NON_AUTHORITY_DISCLAIMER, /does not itself grant governance authority/);
});

// ------------------------------------------------------------- no secrets (§7)

test("no secret values: the validator and envelope reject secret-shaped strings (built at runtime, never committed)", () => {
  const fake = ["gh", "p_", "A1b2C3d4E5f6G7h8I9j0K1l2M3n4o5p6q7r8"].join("");
  const r = validateCapabilityPolicy(doc([D({ credential_requirement: { required: true, credential_class: fake } })]));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => m.includes("looks like a secret")));
  const ok = decide(doc([D()]));
  assert.throws(() => createAuditEnvelope({ decision: ok.decision, subjectContext: { actor_id: fake }, requestIntent: intent(), evaluationContext: { time: T0 }, consequenceTier: null, eventId: "e", timestamp: T0, evidenceProvenance: "ACTOR_REPORTED" }), AuditEnvelopeError);
});

// ------------------------------------------- no minting surface (AS82-F001)

test("AS82-F001: the brand module exports no minting or registration surface", () => {
  assert.deepEqual(Object.keys(trusted).sort(), [
    "GatewayConfigurationError", "TrustedContextError", "createGateway", "isTrustedEvaluationContext", "isTrustedSubjectContext", "snapshot",
  ]);
  const src = fs.readFileSync(path.join(ROOT, "devos/capabilities/trusted-context.mjs"), "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /export\s+(function|const|let)\s+(makeMinter|registerAdapters|minters?\b)/);
  assert.equal(fs.existsSync(path.join(ROOT, "devos/capabilities/adapters/index.mjs")), false);
});
