// S6 Result Transfer Record and Builder publication evidenceRef
// (ML-DEVOS-RFC-019 §7.1, §7.1.1, §7.1.2 -- AS86-F002, AS87-F001, AS88-F001).
//
// The RTR is S6's own write-ahead mapping from a governed Builder handoff to
// the exact commit it delivered. Not an evidence store (S7 is future work), not
// a task state machine. Its body is immutable; status lives in a status part.
import { sha256 } from "./digest.mjs";
import { EVIDENCE_CLASS, HEX40, HEX64, fail } from "./vocabulary.mjs";

export function transferIdOf(identityDigest, resultCommitSha, preRevision) {
  return sha256(`${identityDigest}\n${resultCommitSha}\n${preRevision}`);
}

// §7.1.1: exactly nine members, in exactly this order, strings only.
export const PAYLOAD_MEMBERS = Object.freeze([
  "evidenceClass", "ref", "s6_transfer_id", "result_commit_sha", "result_tree_sha", "base_sha",
  "identity_digest", "prepublication_provenance_digest", "remote_ref",
]);

export function buildPublicationPayload({ transferId, resultCommitSha, resultTreeSha, baseSha, identityDigest, prepublicationProvenanceDigest, remoteRef }) {
  const bad = [];
  if (!HEX64.test(transferId ?? "")) bad.push("transfer_id");
  if (!HEX40.test(resultCommitSha ?? "")) bad.push("result_commit_sha");
  if (!HEX40.test(resultTreeSha ?? "")) bad.push("result_tree_sha");
  if (!HEX40.test(baseSha ?? "")) bad.push("base_sha");
  if (!HEX64.test(identityDigest ?? "")) bad.push("identity_digest");
  if (!HEX64.test(prepublicationProvenanceDigest ?? "")) bad.push("prepublication_provenance_digest");
  if (typeof remoteRef !== "string" || !/^refs\/heads\/sentinel\/s6\/[A-Z][A-Z0-9_-]*\/builder\/[0-9a-f]{32}$/.test(remoteRef)) bad.push("remote_ref");
  if (bad.length) fail("MALFORMED_REQUEST", `publication payload fields invalid: ${bad.join(", ")}`);
  return {
    evidenceClass: EVIDENCE_CLASS, // never upgraded by isolation proof
    ref: `s6-rtr:${transferId}`,
    s6_transfer_id: transferId,
    result_commit_sha: resultCommitSha,
    result_tree_sha: resultTreeSha,
    base_sha: baseSha,
    identity_digest: identityDigest,
    prepublication_provenance_digest: prepublicationProvenanceDigest,
    remote_ref: remoteRef,
  };
}

// Immutable body, fixed member order. rtr_digest = SHA-256 of these bytes.
export function buildRtrBody({ transferId, taskId, builderIdentityDigest, owner, preRevision, payload }) {
  const payloadJson = JSON.stringify(payload);
  return JSON.stringify({
    transfer_id: transferId,
    task_id: taskId,
    builder_identity_digest: builderIdentityDigest,
    owner,
    pre_revision: preRevision,
    result_commit_sha: payload.result_commit_sha,
    result_tree_sha: payload.result_tree_sha,
    base_sha: payload.base_sha,
    remote_ref: payload.remote_ref,
    prepublication_provenance_digest: payload.prepublication_provenance_digest,
    publication_evidence_ref_json: payloadJson,
    publication_evidence_ref_digest: sha256(payloadJson),
  });
}

// §7.1.1: the evidenceRef for every S4 attempt -- first or replay -- is only
// ever JSON.parse of the stored bytes, after digest and round-trip checks.
export function storedEvidenceRef(bodyBytes) {
  let body;
  try {
    body = JSON.parse(bodyBytes);
  } catch {
    fail("RESULT_TRANSFER_UNPROVEN", "RTR body is not JSON");
  }
  const bytes = body?.publication_evidence_ref_json;
  if (typeof bytes !== "string") fail("RESULT_TRANSFER_UNPROVEN", "stored publication evidenceRef bytes are missing");
  if (sha256(bytes) !== body.publication_evidence_ref_digest) fail("RESULT_TRANSFER_UNPROVEN", "stored publication evidenceRef digest mismatch");
  let parsed;
  try {
    parsed = JSON.parse(bytes);
  } catch {
    fail("RESULT_TRANSFER_UNPROVEN", "stored publication evidenceRef is not JSON");
  }
  if (JSON.stringify(parsed) !== bytes) fail("RESULT_TRANSFER_UNPROVEN", "stored publication evidenceRef does not round-trip");
  const keys = Object.keys(parsed);
  if (keys.length !== PAYLOAD_MEMBERS.length || keys.some((k, i) => k !== PAYLOAD_MEMBERS[i])) {
    fail("RESULT_TRANSFER_UNPROVEN", "stored publication evidenceRef members are not the §7.1.1 contract");
  }
  if (parsed.evidenceClass !== EVIDENCE_CLASS) fail("RESULT_TRANSFER_UNPROVEN", "publication evidenceClass is not ACTOR_REPORTED");
  if (parsed.s6_transfer_id !== body.transfer_id) fail("RESULT_TRANSFER_UNPROVEN", "payload transfer id does not match the record");
  return { body, evidenceRef: parsed };
}

// §7.1.2 adjacency proof.
export function verifyAdjacency(journalEntries, transferId, bodyBytes) {
  const { evidenceRef } = storedEvidenceRef(bodyBytes);
  const pending = journalEntries.filter((e) => e.entry.type === "RTR_PENDING" && e.entry.data?.transfer_id === transferId);
  if (pending.length !== 1) fail("RESULT_TRANSFER_UNPROVEN", `expected exactly one RTR_PENDING entry, found ${pending.length}`);
  const e = pending[0].entry;
  if (e.prev_head !== evidenceRef.prepublication_provenance_digest) fail("RESULT_TRANSFER_UNPROVEN", "RTR_PENDING prev_head differs from the payload's prepublication digest");
  if (e.data.rtr_digest !== sha256(bodyBytes)) fail("RESULT_TRANSFER_UNPROVEN", "rtr_digest does not cover the stored immutable body");
  return { pendingHead: pending[0].head, evidenceRef };
}
