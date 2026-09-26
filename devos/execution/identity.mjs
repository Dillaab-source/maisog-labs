// S6 Execution Identity (immutable) and Fencing Checkpoint (mutable,
// S4-derived) -- ML-DEVOS-RFC-019 §3, §3.1 (AS86-F001).
//
// The identity never contains a mutable revision. The checkpoint only ever
// holds revisions S4 itself produced (no second counter) and advances only by
// a verified, gap-free +1 claim/renew result for the same task and owner.
import { randomBytes } from "node:crypto";

import { lifecycle } from "../state/kernel.mjs";
import { canonicalJson, sha256 } from "./digest.mjs";
import { HEX40, HEX64, ID128, ISOLATION_LEVEL, ROLES, ROLE_STATE, fail } from "./vocabulary.mjs";

export const IDENTITY_FIELDS = Object.freeze([
  "project", "repository", "task_id", "contract_ref", "contract_digest", "role", "owner",
  "anchor_revision", "base_ref", "base_sha", "task_branch", "instance_id", "workspace_path",
  "platform_profile", "isolation_level",
]);

export function newId128() {
  return randomBytes(16).toString("hex");
}

// §3: deterministic, lowercase role and id so distinct names cannot fold.
export function taskBranchName(taskId, role, instanceId) {
  if (!lifecycle.isValidTaskId(taskId)) fail("MALFORMED_REQUEST", `invalid task_id ${taskId}`);
  if (!ROLES.includes(role)) fail("MALFORMED_REQUEST", `invalid role ${role}`);
  if (!ID128.test(instanceId)) fail("MALFORMED_REQUEST", "invalid instance_id");
  return `sentinel/s6/${taskId}/${role.toLowerCase()}/${instanceId}`;
}

const nonEmpty = (v) => typeof v === "string" && v.length > 0;

export function buildExecutionIdentity(fields) {
  const f = fields ?? {};
  const bad = [];
  for (const k of ["project", "repository", "contract_ref", "owner", "base_ref", "workspace_path"]) if (!nonEmpty(f[k])) bad.push(k);
  if (!lifecycle.isValidTaskId(f.task_id)) bad.push("task_id");
  if (!HEX64.test(f.contract_digest ?? "")) bad.push("contract_digest");
  if (!ROLES.includes(f.role)) bad.push("role");
  if (!Number.isInteger(f.anchor_revision) || f.anchor_revision < 0) bad.push("anchor_revision");
  if (!HEX40.test(f.base_sha ?? "")) bad.push("base_sha");
  if (!ID128.test(f.instance_id ?? "")) bad.push("instance_id");
  if (f.platform_profile === null || typeof f.platform_profile !== "object") bad.push("platform_profile");
  if (bad.length) fail("MALFORMED_REQUEST", `identity fields invalid: ${bad.join(", ")}`);
  if (f.task_branch !== taskBranchName(f.task_id, f.role, f.instance_id)) fail("MALFORMED_REQUEST", "task_branch is not the deterministic name");
  const identity = {};
  for (const k of IDENTITY_FIELDS) identity[k] = k === "isolation_level" ? ISOLATION_LEVEL : f[k];
  return Object.freeze(identity);
}

export function identityDigest(identity) {
  return sha256(canonicalJson(identity));
}

// ------------------------------------------------------------------ checkpoint

function isS4Result(r) {
  return r !== null && typeof r === "object" && lifecycle.isValidTaskId(r.taskId) && Number.isInteger(r.revision) && r.revision >= 1;
}

export function initialCheckpoint(result, adoptedFrom) {
  if (!isS4Result(result) || !nonEmpty(result.owner)) fail("MALFORMED_REQUEST", "a successful S4 claim/renew result object is required");
  return Object.freeze({ current_revision: result.revision, lease_expires_at: result.lease_expires_at ?? null, adopted_from: adoptedFrom });
}

// §3.1: returns the advanced checkpoint or throws INSTANCE_STALE. `observed`
// is the immediate S4 getState() read taken after the presented result.
export function adoptS4Result(checkpoint, identity, result, adoptedFrom, observed) {
  if (!isS4Result(result) || (adoptedFrom !== "claim" && adoptedFrom !== "renew")) {
    fail("MALFORMED_REQUEST", "a successful S4 claim/renew result object is required");
  }
  if (result.taskId !== identity.task_id) fail("INSTANCE_STALE", "S4 result is for another task");
  if (result.owner !== identity.owner) fail("INSTANCE_STALE", "S4 result is for another owner");
  if (result.revision <= checkpoint.current_revision) fail("INSTANCE_STALE", "S4 result would not advance the checkpoint");
  if (result.revision !== checkpoint.current_revision + 1) {
    fail("INSTANCE_STALE", `revision gap: checkpoint ${checkpoint.current_revision}, result ${result.revision}`);
  }
  if (!observed || observed.owner !== identity.owner || observed.revision !== result.revision) {
    fail("INSTANCE_STALE", "S4 getState() no longer matches the adopted result (a further mutation occurred)");
  }
  return Object.freeze({ current_revision: result.revision, lease_expires_at: result.lease_expires_at ?? null, adopted_from: adoptedFrom });
}

// §8: the S4 checks every mutating S6 step performs, as codes (all failing
// ones; the caller applies precedence). `nowMs` is trusted time.
export function fencingFailures(identity, checkpoint, observed, nowMs) {
  if (!observed) return ["TASK_CONTRACT_MISMATCH"];
  const codes = [];
  if (observed.owner !== identity.owner) codes.push("OWNER_MISMATCH");
  if (observed.revision !== checkpoint.current_revision) codes.push("FENCING_REVISION_MISMATCH");
  if (!(Number.isFinite(observed.lease_expires_at) && observed.lease_expires_at > nowMs)) codes.push("LEASE_EXPIRED");
  if (observed.state !== ROLE_STATE[identity.role]) codes.push("INSTANCE_STALE");
  return codes;
}
