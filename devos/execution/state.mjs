// S6 task-state rules over one task-store draft (ML-DEVOS-RFC-019 §7.1, §13,
// §13.1-§13.4; ML-DEVOS-AS-099/100/101; D-074).
//
// Every function here reads or mutates the draft of ONE local transaction
// (store.mjs). Nothing here touches the filesystem except verified blob reads,
// so a write can only become durable through a commit. This replaces the
// earlier multi-file registry (§13.2 "What this section supersedes").
import { sha256 } from "./digest.mjs";
import { genesisHead, nextHead, replayJournal } from "./journal.mjs";
import { ID128, fail } from "./vocabulary.mjs";

// Legal lifecycle transitions (same-state rewrites carry non-state updates).
// QUARANTINED only moves to CLEANED; CLEANED is terminal (§13.6 I2).
const INSTANCE_NEXT = Object.freeze({
  CREATING: ["CREATING", "READY", "QUARANTINED"],
  READY: ["READY", "ATTACHED", "QUIESCED", "QUARANTINED"],
  ATTACHED: ["ATTACHED", "QUIESCED", "QUARANTINED"],
  QUIESCED: ["QUIESCED", "ATTACHED", "COMPLETED", "QUARANTINED"],
  COMPLETED: ["COMPLETED", "CLEANED", "QUARANTINED"],
  QUARANTINED: ["QUARANTINED", "CLEANED"],
  CLEANED: [],
});
// Permit status is history (§13.1): REPORTED, EXPIRED_UNCLAIMED and REVOKED are
// terminal, and a CLAIMED permit only ever becomes REPORTED.
const PERMIT_NEXT = Object.freeze({
  ISSUED: ["CLAIMED", "EXPIRED_UNCLAIMED", "REVOKED"],
  CLAIMED: ["REPORTED"],
  REPORTED: [],
  EXPIRED_UNCLAIMED: [],
  REVOKED: [],
});
const RTR_NEXT = Object.freeze({ PENDING: ["COMMITTED", "ABORTED"], COMMITTED: [], ABORTED: [] });
// Execution-uncertainty reservations (§13.1, AS100-F001): OPEN until closed by
// exactly one named resolution; every closed value is terminal.
const CLAIM_CLOSED = new Set(["SUPERSEDED_BY_REPORT", "OPERATOR_RESOLVED"]);
const OBLIGATION_CLOSED = new Set(["PROOF_RESOLVED", "OPERATOR_RESOLVED"]);

export const PROGRESSING = new Set(["CREATING", "READY", "ATTACHED", "QUIESCED"]);

// ------------------------------------------------------------ instances
export function getInstance(st, instanceId) {
  if (!ID128.test(instanceId ?? "")) fail("MALFORMED_REQUEST", "invalid instance_id");
  return st.instances[instanceId] ?? null;
}

export function requireInstance(st, instanceId) {
  const r = getInstance(st, instanceId);
  if (!r) fail("MALFORMED_REQUEST", `unknown instance ${instanceId}`);
  return r;
}

export function setLife(record, next) {
  if (!(INSTANCE_NEXT[record.state] ?? []).includes(next)) fail("ISOLATION_UNPROVABLE", `illegal instance transition ${record.state} -> ${next}`);
  record.state = next;
}

export function listInstances(st) {
  return Object.values(st.instances);
}

// ------------------------------------------------------------ journal (§7.1.2)
// The hash chain is unchanged; its entries now commit inside the task store in
// the same transaction as the state they justify (§13.2 rule 3).
export function appendJournal(st, record, type, data, now) {
  const lines = st.journal[record.instance_id] ?? (st.journal[record.instance_id] = []);
  const head = replayJournal(lines, record.identity_digest).head;
  const entry = { seq: lines.length, type, at: new Date(now).toISOString(), data, prev_head: head };
  const bytes = JSON.stringify(entry);
  lines.push(bytes);
  return { entry, bytes, head: nextHead(head, bytes) };
}

export function replay(st, record) {
  return replayJournal(st.journal[record.instance_id] ?? [], record.identity_digest);
}

export function journalHead(st, record) {
  const lines = st.journal[record.instance_id] ?? [];
  return lines.length ? replay(st, record).head : genesisHead(record.identity_digest);
}

// ------------------------------------------------------------ permits (§13.1)
export const bindingKey = (instanceId, requestId) => sha256(`${instanceId}\n${requestId}`);

export function permitsOf(st, instanceId) {
  return Object.entries(st.permits).filter(([, p]) => p.instance_id === instanceId).map(([permitId, p]) => ({ permit_id: permitId, ...p }));
}

export function setPermitState(permit, next) {
  if (!(PERMIT_NEXT[permit.state] ?? []).includes(next)) fail("ISOLATION_UNPROVABLE", `illegal permit transition ${permit.state} -> ${next}`);
  permit.state = next;
}

export function closeClaimReservation(permit, value) {
  if (permit.claim_reservation !== "OPEN" || !CLAIM_CLOSED.has(value)) fail("ISOLATION_UNPROVABLE", `claim reservation cannot move ${permit.claim_reservation} -> ${value}`);
  permit.claim_reservation = value;
}

export function closeObligation(obligation, value) {
  if (obligation.state !== "OPEN" || !OBLIGATION_CLOSED.has(value)) fail("ISOLATION_UNPROVABLE", `liveness obligation cannot move ${obligation.state} -> ${value}`);
  obligation.state = value;
}

// Lazy expiry: an ISSUED permit past its claim deadline READS as
// EXPIRED_UNCLAIMED; the transition is persisted by the next transaction that
// touches it. Time never moves a CLAIMED permit, and never changes a
// reservation (AS90-F001, AS100-F001).
export function effectivePermitState(permit, now) {
  return permit.state === "ISSUED" && now >= permit.claim_deadline_ms ? "EXPIRED_UNCLAIMED" : permit.state;
}

export function openObligations(st, instanceId) {
  const out = [];
  for (const p of permitsOf(st, instanceId)) {
    for (const [pgid, o] of Object.entries(p.obligations)) if (o.state === "OPEN") out.push({ permit_id: p.permit_id, pgid: Number(pgid) });
  }
  return out;
}

// ------------------------------------------------------------ RTR metadata
export function setRtrStatus(rtr, next) {
  if (!(RTR_NEXT[rtr.status] ?? []).includes(next)) fail("ISOLATION_UNPROVABLE", `illegal RTR transition ${rtr.status} -> ${next}`);
  rtr.status = next;
}

export function pendingRtr(st) {
  return Object.entries(st.rtr).filter(([, r]) => r.status === "PENDING").map(([transferId, r]) => ({ transfer_id: transferId, ...r }));
}

// ------------------------------------------------------------ active slot (§13.4)
// unresolved_external_influence: every fact below keeps the instance ACTIVE,
// whatever its lifecycle state, QUARANTINED and COMPLETED included.
export function unresolvedInfluence(st, instanceId) {
  const r = st.instances[instanceId];
  const out = [];
  if (r.create === "OPEN") out.push("create");
  const intents = st.intents[instanceId] ?? {};
  if (intents.push?.status === "OPEN") out.push("push");
  if (intents.cleanup?.status === "OPEN") out.push("cleanup");
  for (const x of pendingRtr(st)) if (x.instance_id === instanceId) out.push(`publication:${x.transfer_id}`);
  for (const p of permitsOf(st, instanceId)) {
    if (p.state === "CLAIMED" && p.claim_reservation === "OPEN") out.push(`claim:${p.permit_id}`);
    for (const [pgid, o] of Object.entries(p.obligations)) if (o.state === "OPEN") out.push(`obligation:${p.permit_id}:${pgid}`);
  }
  return out;
}

export function isActive(st, instanceId) {
  return PROGRESSING.has(st.instances[instanceId].state) || unresolvedInfluence(st, instanceId).length > 0;
}

// Run at the end of EVERY transaction: the slot is released in the same commit
// that made its holder non-ACTIVE, and never otherwise. Release is derived from
// the committed facts, never from a record of a resolution (§13.4, I13).
export function releaseSlotIfInactive(st, now) {
  const holder = st.slot?.instance_id;
  if (!holder || isActive(st, holder)) return null;
  st.slot = null;
  appendJournal(st, st.instances[holder], "SLOT_RELEASED", { instance_state: st.instances[holder].state }, now);
  return holder;
}

// Every other instance of the task must be non-ACTIVE before a new slot commits
// (§13.4; §13.6 I1, I11).
export function assertSlotFreeFor(st, instanceId) {
  if (st.slot && st.slot.instance_id !== instanceId) {
    const holder = st.instances[st.slot.instance_id];
    const why = unresolvedInfluence(st, holder.instance_id);
    fail("WORKTREE_COLLISION", `the task's active-environment slot is held by ${holder.instance_id} (${holder.state}${why.length ? `; unresolved: ${why.join(", ")}` : ""})`);
  }
  for (const other of listInstances(st)) {
    if (other.instance_id !== instanceId && isActive(st, other.instance_id)) fail("WORKTREE_COLLISION", `instance ${other.instance_id} is still ACTIVE`);
  }
}
