// S5 Capability & Permission Gateway V1 -- the INTERNAL pure decision core
// (ML-DEVOS-RFC-017 §3, §4, §6, §11; ML-DEVOS-AS-077; D-063).
//
// evaluate(subjectContext, requestIntent, policy, revocationList, evaluationContext)
//
// This is not the caller-facing API. External callers use an adapter's
// request() wrapper (adapters/, via devos/capabilities/index.mjs), which alone
// can construct the branded trusted contexts. A direct caller holding only
// hand-built objects is mechanically denied at step (a).
//
// Purity: the result is a function of the five explicit arguments only. No
// clock read, no randomness, no I/O, no mutation, no id/timestamp generation.
// Brand and loaded-policy checks are identity lookups on the arguments
// themselves. The returned CapabilityDecision is frozen and contains nothing
// that can differ between two identical calls (RFC-017 §12).
//
// Capability != Authority: an ALLOW answers only "can this technically
// happen under the pinned policy"; it never answers "may it" (§5).

import { isCanonical } from "./canonical.mjs";
import { isTrustedEvaluationContext, isTrustedSubjectContext } from "./trusted-context.mjs";
import { isLoadedPolicy } from "./validate-capability-policy.mjs";
import {
  ACTION_PATTERN,
  ACTOR_ROLES,
  ENVIRONMENTS,
  NON_AUTHORITY_DISCLAIMER,
  OPAQUE_REF_PATTERN,
  POLICY_VERSION_PATTERN,
  PROVIDERS,
  isProjectString,
  parseInstant,
} from "./vocabulary.mjs";

const REQUEST_KEYS = ["project", "provider", "action", "resource", "environment", "policy_version"];
const OPTIONAL_REQUEST_KEYS = ["contract_ref", "task_id"];

function decision(outcome, { denialReason = null, descriptorId = null, policyVersion = null } = {}) {
  return Object.freeze({
    outcome,
    denial_reason: denialReason,
    descriptor_id: descriptorId,
    policy_version: policyVersion,
    non_authority_disclaimer: NON_AUTHORITY_DISCLAIMER,
  });
}

// Shared by adapters for boundary denials (e.g. MALFORMED_REQUEST before the
// core matcher); same shape and vocabulary as evaluate()'s own denials.
export function denyDecision(denialReason, policyVersion = null, descriptorId = null) {
  return decision("DENY", { denialReason, descriptorId, policyVersion });
}

// Untrusted request intent: exact shape, no time-bearing or extra field.
export function isWellFormedRequestIntent(r) {
  if (r === null || typeof r !== "object" || Array.isArray(r)) return false;
  const keys = Object.keys(r);
  if (keys.some((k) => !REQUEST_KEYS.includes(k) && !OPTIONAL_REQUEST_KEYS.includes(k))) return false;
  if (REQUEST_KEYS.some((k) => typeof r[k] !== "string" || r[k].length === 0)) return false;
  if (!isProjectString(r.project) || r.project === "*") return false;
  if (!ACTION_PATTERN.test(r.action) || !POLICY_VERSION_PATTERN.test(r.policy_version)) return false;
  return OPTIONAL_REQUEST_KEYS.every((k) => r[k] === undefined || (typeof r[k] === "string" && OPAQUE_REF_PATTERN.test(r[k])));
}

// RFC-017 §2 matching over already-canonical strings. Returns the resource
// specificity [class, stem length] of the best matching pattern, or null.
function resourceSpecificity(patterns, resource) {
  let best = null;
  for (const p of patterns) {
    let score = null;
    if (p === "*") score = [0, 0];
    else if (p.endsWith("/*")) {
      const stem = p.slice(0, -2);
      if (resource.startsWith(`${stem}/`) && resource.length > stem.length + 1) score = [1, stem.length];
    } else if (p === resource) score = [2, p.length];
    if (score && (!best || compare(score, best) > 0)) best = score;
  }
  return best;
}

function compare(a, b) {
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

export function evaluate(subjectContext, requestIntent, policy, revocationList, evaluationContext) {
  // (a) trusted-argument brand + structural validation.
  if (!isTrustedSubjectContext(subjectContext)) return denyDecision("UNTRUSTED_SUBJECT_CONTEXT");
  if (!isTrustedEvaluationContext(evaluationContext)) return denyDecision("UNTRUSTED_EVALUATION_CONTEXT");

  const pinned = requestIntent && typeof requestIntent.policy_version === "string" ? requestIntent.policy_version : null;
  if (!isWellFormedRequestIntent(requestIntent)) return denyDecision("MALFORMED_REQUEST", pinned);
  if (!Array.isArray(revocationList) || revocationList.some((id) => typeof id !== "string")) {
    return denyDecision("MALFORMED_REQUEST", pinned);
  }

  // (b) the presented policy must be a loaded, validated document whose own
  // version equals the attempt's pinned version -- never "whatever is current".
  if (!isLoadedPolicy(policy) || policy.policy_version !== requestIntent.policy_version) {
    return denyDecision("POLICY_VERSION_MISMATCH", pinned);
  }

  // (c) descriptor lookup; every unknown axis fails closed.
  const { actor_role: role } = subjectContext;
  const { project, provider, action, resource, environment } = requestIntent;
  if (!ACTOR_ROLES.includes(role)) return denyDecision("UNKNOWN_ACTOR_ROLE", pinned);
  if (!PROVIDERS.includes(provider)) return denyDecision("UNKNOWN_PROVIDER", pinned);
  if (!ENVIRONMENTS.includes(environment)) return denyDecision("UNKNOWN_ENVIRONMENT", pinned);
  const axis = policy.descriptors.filter((d) => d.actor_role === role && d.provider === provider && d.environment === environment);
  const inProject = axis.filter((d) => d.project === project || d.project === "*");
  if (inProject.length === 0) return denyDecision("UNKNOWN_PROJECT", pinned);
  const forAction = inProject.filter((d) => d.action === action);
  if (forAction.length === 0) return denyDecision("UNKNOWN_ACTION", pinned);

  // The core matcher never canonicalizes; a non-canonical value is rejected.
  if (!isCanonical(provider, resource)) return denyDecision("MALFORMED_REQUEST", pinned);

  // (d) resource-scope match + deterministic precedence; any top tie is ambiguous.
  const ranked = [];
  for (const d of forAction) {
    const res = resourceSpecificity(d.resource_scope, resource);
    if (res) ranked.push({ d, rank: [d.project === "*" ? 0 : 1, ...res] });
  }
  if (ranked.length === 0) return denyDecision("RESOURCE_SCOPE_MISMATCH", pinned);
  ranked.sort((x, y) => compare(y.rank, x.rank));
  if (ranked.length > 1 && compare(ranked[0].rank, ranked[1].rank) === 0) return denyDecision("AMBIGUOUS_POLICY_MATCH", pinned);
  const matched = ranked[0].d;
  const id = matched.descriptor_id;

  // (e) expiry against the trusted evaluation time. At the expiry instant the
  // descriptor is no longer valid.
  if (matched.expiry !== null && parseInstant(evaluationContext.time) >= parseInstant(matched.expiry)) {
    return denyDecision("EXPIRED", pinned, id);
  }

  // (f) live revocation overrides policy-version pinning.
  if (revocationList.includes(id)) return denyDecision("REVOKED", pinned, id);

  // (g) credential requirement: class-level attestation only, never a value.
  const need = matched.credential_requirement;
  if (need.required && !(subjectContext.credential_available === true && subjectContext.credential_class === need.credential_class)) {
    return denyDecision("CREDENTIAL_REQUIREMENT_UNSATISFIED", pinned, id);
  }

  return decision("ALLOW", { descriptorId: id, policyVersion: pinned });
}
