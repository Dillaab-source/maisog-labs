// S5 Capability & Permission Gateway V1 (ML-DEVOS-RFC-017 / ML-DEVOS-AS-077 /
// D-063) -- the closed V1 vocabularies. Every other module imports these;
// nothing restates them. Pure data, no I/O.

// RFC-017 §4: the one canonical denial-reason vocabulary. No other code exists.
export const DENIAL_REASONS = Object.freeze([
  "UNTRUSTED_SUBJECT_CONTEXT",
  "UNTRUSTED_EVALUATION_CONTEXT",
  "UNKNOWN_ACTOR_ROLE",
  "UNKNOWN_PROVIDER",
  "UNKNOWN_ACTION",
  "UNKNOWN_PROJECT",
  "UNKNOWN_ENVIRONMENT",
  "RESOURCE_SCOPE_MISMATCH",
  "POLICY_VERSION_MISMATCH",
  "AMBIGUOUS_POLICY_MATCH",
  "EXPIRED",
  "REVOKED",
  "CREDENTIAL_REQUIREMENT_UNSATISFIED",
  "MALFORMED_REQUEST",
]);

// ML-DEVOS-ARCH-001 §3: the five frozen actor roles.
export const ACTOR_ROLES = Object.freeze(["Paulo", "Architect", "Builder", "QA", "Independent Reviewer"]);

// RFC-017 §9: exactly five V1 adapters. `future` is reserved, never usable.
export const PROVIDERS = Object.freeze(["shell", "github", "cloudflare", "mcp", "browser"]);
export const RESERVED_PROVIDERS = Object.freeze(["future"]);

// RFC-017 §2: environment axis (mirrors CORE-019).
export const ENVIRONMENTS = Object.freeze(["local", "ci", "staging", "production"]);

// RFC-017 §2: consequence_tier reuses core-rules.json's risk vocabulary exactly.
export const CONSEQUENCE_TIERS = Object.freeze(["low", "medium", "high", "highest"]);

// ML-DEVOS-ARCH-001 §6: evidence provenance classes (AuditEnvelope, RFC-017 §12).
export const EVIDENCE_CLASSES = Object.freeze([
  "ACTOR_REPORTED",
  "INDEPENDENTLY_INSPECTED",
  "INDEPENDENTLY_REPRODUCED",
  "CI_ATTESTED",
  "RUNTIME_OBSERVED",
]);

// RFC-017 §5: fixed, non-reword-able non-authority disclaimer on every decision.
export const NON_AUTHORITY_DISCLAIMER =
  "This capability decision describes only what is technically permitted under the pinned policy version presented to it. " +
  "It does not itself grant governance authority, certify that an action should happen, accept risk, or satisfy any merge, " +
  "deployment, or production-write approval requirement (CORE-001, CORE-002, CORE-008). An ALLOW decision from a " +
  "Governance-authorized actor is necessary but never sufficient for a sensitive operation (§8); a DENY decision blocks " +
  "the action regardless of any governance authorization that may otherwise exist.";

// RFC-017 §8: named sensitive-operation categories. A descriptor for any of
// these actions must be authored at consequence_tier high/highest; the policy
// validator enforces this at load time only -- evaluate() never re-checks it.
// V1 registry, extended only by a governed change.
export const SENSITIVE_ACTIONS = Object.freeze({
  shell: Object.freeze({
    "shell.rm_recursive": "destructive",
    "shell.exec_privileged": "destructive",
  }),
  github: Object.freeze({
    "pr.merge": "protected-branch/main merge",
    "git.push_force": "destructive",
    "branch.delete": "destructive",
    "repo.delete": "destructive",
    "secret.put": "credential/secret management",
    "secret.delete": "credential/secret management",
    "ruleset.update": "protected-branch/main merge",
  }),
  cloudflare: Object.freeze({
    "worker.deploy": "deployment/production-write",
    "worker.rollback": "deployment/production-write",
    "d1.migrate": "remote-resource mutation",
    "d1.write": "remote-resource mutation",
    "r2.write": "remote-resource mutation",
    "r2.delete": "remote-resource mutation",
    "access.update": "remote-resource mutation",
    "dns.update": "remote-resource mutation",
    "secret.put": "credential/secret management",
    "secret.rotate": "credential/secret management",
    "secret.delete": "credential/secret management",
  }),
  mcp: Object.freeze({}),
  browser: Object.freeze({}),
});

// RFC-017 §8 "protected-branch/main merge": a github push/merge whose scope
// can reach the protected default branch is sensitive regardless of action name.
export const PROTECTED_REF_SUFFIX = ":refs/heads/main";

export const DESCRIPTOR_ID_PATTERN = /^[A-Z][A-Z0-9_-]*$/; // S4 isValidTaskId() shape, reused
export const ACTION_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
export const CREDENTIAL_CLASS_PATTERN = /^[a-z][a-z0-9_]*$/;
export const POLICY_VERSION_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
// S3's `project` shape reused exactly (task-contract.schema.json: string,
// minLength 1). `*` is legal only in a descriptor (Sentinel-wide scope).
export function isProjectString(value) {
  return typeof value === "string" && value.length >= 1;
}
export const OPAQUE_REF_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
// Strict UTC instant: no offsets, no local times, no ambiguity.
export const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

export function parseInstant(value) {
  if (typeof value !== "string" || !INSTANT_PATTERN.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function isDescriptorId(value) {
  return typeof value === "string" && value.length >= 3 && DESCRIPTOR_ID_PATTERN.test(value);
}
