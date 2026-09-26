// S6 Isolated Execution V1 core -- closed vocabularies (ML-DEVOS-RFC-019 §1,
// §13.1, §14, §17; ML-DEVOS-AS-093; D-071).
//
// Isolation != Authority: nothing in this directory grants governance
// authority (CORE-001), and an S5 ALLOW consumed here never becomes one
// (CORE-002, CORE-008). V1 is L1 + dedicated-clone L2 + L3 only; it does not
// contain a deliberately hostile same-user process and is not a sandbox. S6
// core exposes no command-execution primitive (D-069, §13.1).

// RFC-019 §14: the 30 reason codes in their fixed precedence order. The
// lowest-ranked failing check wins.
export const REASON_CODES = Object.freeze([
  "MALFORMED_REQUEST",
  "ISOLATION_PLATFORM_UNSUPPORTED",
  "ISOLATION_CAPABILITY_MISSING",
  "WORKSPACE_ROOT_INVALID",
  "TASK_CONTRACT_MISMATCH",
  "ISOLATION_PROFILE_INSUFFICIENT",
  "REPOSITORY_MISMATCH",
  "OWNER_MISMATCH",
  "FENCING_REVISION_MISMATCH",
  "LEASE_EXPIRED",
  "INSTANCE_STALE",
  "QA_INDEPENDENCE_VIOLATION",
  "RESULT_TRANSFER_UNPROVEN",
  "TRANSPORT_NOT_AUTHORIZED",
  "CAPABILITY_DENIED",
  "BASE_UNAVAILABLE",
  "BASE_SHA_MISMATCH",
  "BASE_ADVANCED",
  "WORKTREE_COLLISION",
  "BRANCH_COLLISION",
  "PATH_ESCAPE",
  "UNRESOLVED_LINK",
  "ENV_POLICY_VIOLATION",
  "SECRET_MATERIAL_DETECTED",
  "DIRTY_WORKTREE",
  "UNEXPECTED_UNTRACKED",
  "SCOPE_VIOLATION",
  "QUIESCE_UNPROVEN",
  "CLEANUP_CONTAMINATION_RISK",
  "ISOLATION_UNPROVABLE",
]);

const RANK = new Map(REASON_CODES.map((code, i) => [code, i]));

export function rankOf(code) {
  const r = RANK.get(code);
  if (r === undefined) throw new TypeError(`unknown S6 reason code ${code}`);
  return r;
}

// Deterministic precedence: the lowest-ranked code among all failing checks.
export function selectReason(codes) {
  let best = null;
  for (const c of codes) if (best === null || rankOf(c) < rankOf(best)) best = c;
  return best;
}

export class ExecutionError extends Error {
  constructor(code, detail) {
    rankOf(code); // an unknown code is a programming error, never a new category
    super(`${code}: ${detail}`);
    this.name = "ExecutionError";
    this.code = code;
    this.detail = detail;
  }
}

export function fail(code, detail) {
  throw new ExecutionError(code, detail);
}

export const ROLES = Object.freeze(["BUILDER", "QA"]);
export const ROLE_STATE = Object.freeze({ BUILDER: "BUILDING", QA: "QA" });

// RFC-019 §13.1 (AS92-F001): the one canonical, total V1 mapping from the S6
// role to the S5 actor_role. Anything else does not map and fails closed.
const S5_ROLE = Object.freeze({ BUILDER: "Builder", QA: "QA" });
export function canonicalS5Role(s6Role) {
  return Object.prototype.hasOwnProperty.call(S5_ROLE, s6Role) ? S5_ROLE[s6Role] : null;
}

export const ISOLATION_LEVEL = "L3";
export const EVIDENCE_CLASS = "ACTOR_REPORTED";

// Environment lifecycle (§13). Environment states only -- never task states.
export const INSTANCE_STATES = Object.freeze([
  "CREATING", "READY", "ATTACHED", "QUIESCED", "COMPLETED", "CLEANED", "QUARANTINED",
]);

export const RTR_STATUSES = Object.freeze(["PENDING", "COMMITTED", "ABORTED"]);

// Permit lifecycle (§13.1, AS90-F001). A permit record, subordinate to S4.
export const PERMIT_STATES = Object.freeze(["ISSUED", "EXPIRED_UNCLAIMED", "REVOKED", "CLAIMED", "REPORTED"]);
export const REVOCATION_REASONS = Object.freeze(["QUIESCE", "CLEANUP", "QUARANTINE", "STALE", "CAPABILITY_INVALIDATED"]);

// RFC-019 §17 fixed disclaimer, carried by every provenance record.
export const NON_AUTHORITY_DISCLAIMER =
  "This isolation record describes the execution environment an S6 host observed. It is not authority, not a capability grant, and not acceptance of any result. Isolation level L3 does not contain a deliberately hostile process.";

export const HEX40 = /^[0-9a-f]{40}$/;
export const HEX64 = /^[0-9a-f]{64}$/;
export const ID128 = /^[0-9a-f]{32}$/;
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
