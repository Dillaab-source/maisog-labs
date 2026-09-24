// S5 Capability & Permission Gateway V1 -- public entry point
// (ML-DEVOS-RFC-017; ML-DEVOS-AS-077; D-063).
//
// Callers get adapter wrappers from createGateway(); each wrapper's
// request(requestIntent) is the only way to obtain a decision with trusted
// subject/evaluation contexts. The raw five-argument evaluate() core is
// deliberately NOT re-exported here (RFC-017 §3, §9).
//
// Capability != Authority (CORE-002, CORE-008): every decision carries the
// fixed non-authority disclaimer. This library is not wired into S3, S4, or
// any runtime path; nothing invokes it unless a caller imports it.

export { createGateway, GatewayConfigurationError } from "./adapters/index.mjs";
export { TrustedSourceUnavailableError } from "./adapters/common.mjs";
export { createAuditEnvelope, AuditEnvelopeError } from "./audit.mjs";
export { validateCapabilityPolicy, PolicyValidationError } from "./validate-capability-policy.mjs";
export {
  ACTOR_ROLES,
  CONSEQUENCE_TIERS,
  DENIAL_REASONS,
  ENVIRONMENTS,
  EVIDENCE_CLASSES,
  NON_AUTHORITY_DISCLAIMER,
  PROVIDERS,
} from "./vocabulary.mjs";
