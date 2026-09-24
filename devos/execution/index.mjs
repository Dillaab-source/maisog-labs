// S6 Isolated Execution V1 core -- public entry (ML-DEVOS-RFC-019; ML-DEVOS-AS-093;
// D-071).
//
// A repository-local library: nothing invokes it unless a caller imports it
// (executable_runtime_present: false). It exposes NO command-execution
// primitive -- no run(), no spawn(), no shell bridge (D-069, §13.1). Isolation !=
// Authority: no export here grants governance authority or creates capability.
export { createExecutionHost, pathInScope, scopeFailures } from "./host.mjs";
export { argvDigest, validateReport, validateRequest } from "./permits.mjs";
export {
  EVIDENCE_CLASS, ExecutionError, INSTANCE_STATES, ISOLATION_LEVEL, NON_AUTHORITY_DISCLAIMER, PERMIT_STATES, REASON_CODES,
  REVOCATION_REASONS, ROLES, canonicalS5Role, rankOf, selectReason,
} from "./vocabulary.mjs";
export { PAYLOAD_MEMBERS } from "./rtr.mjs";
