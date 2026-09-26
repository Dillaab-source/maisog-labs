// S6 reference state model (ML-DEVOS-RFC-019 §13.6, §18 item 16; D-074).
//
// A small, pure model of the hardened S6 core over a bounded world: one task,
// two instances, two permits, one publication. Each operation is one atomic
// local transaction (§13.2) or a world event (a driver effect, an external
// system's reaction, a crash). The model keeps these as INDEPENDENT facts:
//   - permit lifecycle (historical status);
//   - per-claim execution-uncertainty reservation;
//   - per-group liveness obligations;
//   - the other §13.3 reservations (create, push, publication, cleanup);
//   - instance lifecycle;
//   - the active task slot.
// ACTIVE and slot release are DERIVED from those facts (§13.4); nothing infers a
// reservation from permit status or a release from an audit record.
//
// `mutant` selects a deliberately broken rule for falsification (§13.6):
//   "A" release on quarantine, "B" audit record without reservation closure,
//   "C" over-broad operator resolution. The production host has no such
// switch; only this model does.

export const INSTANCES = Object.freeze(["i1", "i2"]);
export const PERMITS = Object.freeze(["p1", "p2"]);
const PROGRESSING = new Set(["CREATING", "READY", "ATTACHED", "QUIESCED"]);
const PERMIT_TERMINAL = new Set(["REPORTED", "REVOKED", "EXPIRED_UNCLAIMED"]);

export function initialState() {
  const instances = {};
  for (const i of INSTANCES) instances[i] = { life: "NONE", create: "NONE", push: "NONE", cleanup: "NONE", stale: false };
  const permits = {};
  for (const p of PERMITS) permits[p] = { inst: null, status: "NONE", claim: "NONE", blob: false, reportBlob: false };
  return {
    host: "UP",
    slot: null,
    instances,
    permits,
    obligations: {},
    groupAlive: {},
    rtr: { inst: null, status: "NONE", attributable: true },
    world: { remotePushed: {}, s4Applied: false, s4Refused: false, time: 0 },
    minted: { creates: {}, permits: {} },
    version: 0,
    last: null,
  };
}

// ------------------------------------------------------------ derivations
export function unresolved(st, i) {
  const out = [];
  const inst = st.instances[i];
  if (inst.create === "OPEN") out.push(`create:${i}`);
  if (inst.push === "OPEN") out.push(`push:${i}`);
  if (inst.cleanup === "OPEN") out.push(`cleanup:${i}`);
  if (st.rtr.inst === i && st.rtr.status === "PENDING") out.push(`publication:${i}`);
  for (const p of PERMITS) {
    const pm = st.permits[p];
    if (pm.inst !== i) continue;
    if (pm.status === "CLAIMED" && pm.claim === "OPEN") out.push(`claim:${p}`);
    if (st.obligations[p] === "OPEN") out.push(`obligation:${p}`);
  }
  return out;
}

export function lifecycleCanProgress(st, i) {
  return PROGRESSING.has(st.instances[i].life);
}

export function isActive(st, i) {
  return lifecycleCanProgress(st, i) || unresolved(st, i).length > 0;
}

export function publishable(st, i) {
  return st.instances[i].life === "QUIESCED" && !st.instances[i].stale;
}

const clone = (v) => structuredClone(v);

// Commit bookkeeping: every local transaction advances the version, records its
// journal entry, and releases the slot iff its holder became non-ACTIVE (§13.4).
function commit(st, entry) {
  st.version += 1;
  st.last = { ...entry, version: st.version };
  if (st.slot !== null && !isActive(st, st.slot)) st.slot = null;
  return st;
}

function revokeIssued(st, i) {
  for (const p of PERMITS) if (st.permits[p].inst === i && st.permits[p].status === "ISSUED") st.permits[p].status = "REVOKED";
}

function quarantine(st, i, mutant) {
  st.instances[i].life = "QUARANTINED";
  revokeIssued(st, i);
  if (mutant === "A" && st.slot === i) st.slot = null;
}

// ------------------------------------------------------------ operations
// Each returns the next state, or null when the operation is refused or not
// enabled in `st`. A refusal changes nothing (fail closed).
export function step(st0, op, { mutant = null } = {}) {
  const [name, arg] = op;
  const st = clone(st0);
  const up = st.host === "UP";
  const inst = arg && st.instances[arg];
  const pm = arg && st.permits[arg];
  // I10: an unattributable PENDING record blocks every lifecycle mutation.
  const blocked = st.rtr.status === "PENDING" && !st.rtr.attributable;
  const lifecycleOps = new Set(["create", "create_finish", "attach", "issue", "claim", "quiesce", "publish_prepare", "finish", "push_prepare", "cleanup_prepare", "quarantine"]);
  if (blocked && lifecycleOps.has(name)) return null;

  switch (name) {
    // ---- local transactions
    case "create": {
      if (!up || inst.life !== "NONE" || st.slot !== null) return null;
      st.slot = arg;
      inst.life = "CREATING";
      inst.create = "OPEN";
      st.minted.creates[arg] = (st.minted.creates[arg] ?? 0) + 1;
      return commit(st, { op: "CREATE", target: arg });
    }
    case "create_finish": {
      if (!up || inst.life !== "CREATING" || inst.create !== "OPEN") return null;
      inst.life = "READY";
      inst.create = "DONE";
      return commit(st, { op: "READY", target: arg });
    }
    case "attach": {
      if (!up || !["READY", "QUIESCED"].includes(inst.life) || inst.stale) return null;
      if (st.rtr.inst === arg && st.rtr.status === "PENDING") return null;
      inst.life = "ATTACHED";
      return commit(st, { op: "ATTACH", target: arg });
    }
    case "issue": {
      const holder = st.slot;
      if (!up || pm.status !== "NONE" || holder === null || st.instances[holder].life !== "ATTACHED") return null;
      pm.inst = holder;
      pm.status = "ISSUED";
      pm.blob = true;
      st.minted.permits[arg] = (st.minted.permits[arg] ?? 0) + 1;
      return commit(st, { op: "PERMIT_ISSUED", target: arg });
    }
    case "claim": {
      if (!up || pm.status !== "ISSUED" || st.instances[pm.inst].life !== "ATTACHED") return null;
      pm.status = "CLAIMED";
      pm.claim = "OPEN";
      st.groupAlive[arg] = true;
      return commit(st, { op: "CLAIM", target: arg });
    }
    case "expire": {
      if (!up || pm.status !== "ISSUED") return null;
      pm.status = "EXPIRED_UNCLAIMED";
      return commit(st, { op: "EXPIRE", target: arg });
    }
    case "report": {
      // The verified report transaction, including a late report after
      // quarantine: one commit moves the permit to REPORTED, supersedes the
      // claim reservation and registers the obligation (§13.1 step 5).
      if (!up || pm.status !== "CLAIMED" || pm.claim !== "OPEN") return null;
      pm.status = "REPORTED";
      pm.claim = "SUPERSEDED_BY_REPORT";
      pm.reportBlob = true;
      st.obligations[arg] = "OPEN";
      return commit(st, { op: st.instances[pm.inst].life === "QUARANTINED" ? "LATE_REPORT" : "REPORT", target: arg });
    }
    case "quiesce": {
      if (!up || inst.life !== "ATTACHED") return null;
      for (const p of PERMITS) {
        const q = st.permits[p];
        if (q.inst !== arg) continue;
        if (q.status === "CLAIMED") return null; // QUIESCE_UNPROVEN
        if (st.obligations[p] === "OPEN" && st.groupAlive[p]) return null; // a live group
      }
      for (const p of PERMITS) if (st.permits[p].inst === arg && st.obligations[p] === "OPEN") st.obligations[p] = "PROOF_RESOLVED";
      revokeIssued(st, arg);
      inst.life = "QUIESCED";
      return commit(st, { op: "QUIESCE", target: arg });
    }
    case "publish_prepare": {
      if (!up || !publishable(st, arg) || st.rtr.status !== "NONE" || inst.push !== "DONE") return null;
      st.rtr = { inst: arg, status: "PENDING", attributable: true };
      return commit(st, { op: "RTR_PENDING", target: arg });
    }
    case "publish_reconcile": {
      if (!up || st.rtr.status !== "PENDING" || !st.rtr.attributable) return null;
      const i = st.rtr.inst;
      if (st.world.s4Applied) {
        st.rtr.status = "COMMITTED";
        if (st.instances[i].life === "QUIESCED") st.instances[i].life = "COMPLETED";
        return commit(st, { op: "RTR_COMMITTED", target: i });
      }
      if (st.world.s4Refused) {
        st.rtr.status = "ABORTED";
        st.instances[i].stale = true;
        return commit(st, { op: "RTR_ABORTED", target: i });
      }
      return null; // unobserved: stays PENDING (a timeout decides nothing)
    }
    case "finish": {
      if (!up || inst.life !== "QUIESCED" || (st.rtr.inst === arg && st.rtr.status === "PENDING") || inst.push === "OPEN") return null;
      inst.life = "COMPLETED";
      return commit(st, { op: "FINISH", target: arg });
    }
    case "push_prepare": {
      if (!up || inst.life !== "QUIESCED" || inst.push !== "NONE") return null;
      inst.push = "OPEN";
      return commit(st, { op: "PUSH_INTENT", target: arg });
    }
    case "push_reconcile": {
      if (!up || inst.push !== "OPEN" || !st.world.remotePushed[arg]) return null;
      inst.push = "DONE";
      return commit(st, { op: "PUSH_VERIFIED", target: arg });
    }
    case "cleanup_prepare": {
      if (!up || !["COMPLETED", "QUARANTINED"].includes(inst.life) || inst.cleanup !== "NONE") return null;
      if (unresolved(st, arg).length > 0) return null;
      // A prepared cleanup is unresolved influence (§13.3), so it makes its
      // instance ACTIVE (§13.4). To keep I1 it is prepared only by the slot
      // holder, or while the slot is free, and then it takes the slot.
      if (st.slot !== null && st.slot !== arg) return null;
      st.slot = arg;
      inst.cleanup = "OPEN";
      return commit(st, { op: "CLEANUP_INTENT", target: arg });
    }
    case "cleanup_reconcile": {
      if (!up || inst.cleanup !== "OPEN") return null;
      inst.cleanup = "DONE";
      inst.life = "CLEANED";
      return commit(st, { op: "CLEANED", target: arg });
    }
    case "quarantine": {
      if (!up || !["READY", "ATTACHED", "QUIESCED", "COMPLETED"].includes(inst.life)) return null;
      quarantine(st, arg, mutant);
      return commit(st, { op: "QUARANTINE", target: arg });
    }
    case "recover": {
      if (up) return null;
      st.host = "UP";
      for (const i of INSTANCES) {
        const x = st.instances[i];
        if (x.life === "CREATING") {
          x.create = "DONE";
          quarantine(st, i, mutant);
        } else if (PROGRESSING.has(x.life) && PERMITS.some((p) => st.permits[p].inst === i && st.permits[p].status === "CLAIMED" && st.permits[p].claim === "OPEN")) {
          quarantine(st, i, mutant);
        }
      }
      return commit(st, { op: "RECOVER", target: null });
    }
    case "resolve_proof": {
      // Proves exactly one group terminated (§13.1 Proof).
      const p = arg;
      if (!up || st.obligations[p] !== "OPEN" || st.instances[st.permits[p].inst].life !== "QUARANTINED" || st.groupAlive[p]) return null;
      st.obligations[p] = "PROOF_RESOLVED";
      return commit(st, { op: "EXECUTION_RESOLVED", target: `obligation:${p}` });
    }
    case "resolve_operator_claim":
    case "resolve_operator_obligation": {
      const p = arg;
      const q = st.permits[p];
      if (!up || !q.inst || st.instances[q.inst].life !== "QUARANTINED") return null;
      const target = name === "resolve_operator_claim" ? `claim:${p}` : `obligation:${p}`;
      if (name === "resolve_operator_claim" ? !(q.status === "CLAIMED" && q.claim === "OPEN") : st.obligations[p] !== "OPEN") return null;
      if (mutant === "B") {
        st.slot = null; // audit record written, reservation left OPEN
        st.version += 1;
        st.last = { op: "OPERATOR_RESOLUTION", target, version: st.version };
        return st;
      }
      if (name === "resolve_operator_claim") q.claim = "OPERATOR_RESOLVED";
      else st.obligations[p] = "OPERATOR_RESOLVED";
      if (mutant === "C") {
        for (const r of PERMITS) {
          if (st.permits[r].claim === "OPEN") st.permits[r].claim = "OPERATOR_RESOLVED";
          if (st.obligations[r] === "OPEN") st.obligations[r] = "OPERATOR_RESOLVED";
        }
        for (const i of INSTANCES) for (const k of ["push", "cleanup", "create"]) if (st.instances[i][k] === "OPEN") st.instances[i][k] = "DONE";
        if (st.rtr.status === "PENDING") st.rtr.status = "ABORTED";
      }
      return commit(st, { op: "OPERATOR_RESOLUTION", target, actor_reported: true });
    }

    // ---- world events (no local commit)
    case "crash": {
      if (!up) return null;
      st.host = "DOWN";
      return st;
    }
    case "time_advance": {
      if (st.world.time >= 2) return null;
      st.world.time += 1;
      return st;
    }
    case "group_exit": {
      if (!st.groupAlive[arg]) return null;
      st.groupAlive[arg] = false;
      return st;
    }
    case "push_effect": {
      if (inst.push !== "OPEN" || st.world.remotePushed[arg]) return null;
      st.world.remotePushed[arg] = true;
      return st;
    }
    case "s4_apply": {
      if (st.rtr.status !== "PENDING" || st.world.s4Applied || st.world.s4Refused) return null;
      st.world.s4Applied = true;
      return st;
    }
    case "s4_refuse": {
      if (st.rtr.status !== "PENDING" || st.world.s4Applied || st.world.s4Refused) return null;
      st.world.s4Refused = true;
      return st;
    }
    case "rtr_corrupt": {
      if (st.rtr.status !== "PENDING" || !st.rtr.attributable) return null;
      st.rtr.attributable = false;
      return st;
    }
    default:
      throw new TypeError(`unknown model operation ${name}`);
  }
}

export const LOCAL_OPS = Object.freeze([
  "create", "create_finish", "attach", "quiesce", "publish_prepare", "finish", "push_prepare", "push_reconcile",
  "cleanup_prepare", "cleanup_reconcile", "quarantine",
]);
export const PERMIT_OPS = Object.freeze([
  "issue", "claim", "expire", "report", "resolve_proof", "resolve_operator_claim", "resolve_operator_obligation", "group_exit",
]);
export const WORLD_OPS = Object.freeze(["crash", "recover", "time_advance", "publish_reconcile", "s4_apply", "s4_refuse", "rtr_corrupt"]);

export function allOps() {
  const ops = [];
  for (const n of LOCAL_OPS) for (const i of INSTANCES) ops.push([n, i]);
  for (const i of INSTANCES) ops.push(["push_effect", i]);
  for (const n of PERMIT_OPS) for (const p of PERMITS) ops.push([n, p]);
  for (const n of WORLD_OPS) ops.push([n]);
  return ops;
}

// ------------------------------------------------------------ invariants
// State invariants (checked after every step) and step invariants (checked
// over each pre -> post pair). Each returns a list of violation labels.
export function checkState(st) {
  const v = [];
  const active = INSTANCES.filter((i) => isActive(st, i));
  if (active.length > 1) v.push("I1: more than one ACTIVE environment");
  for (const i of active) if (st.slot !== i) v.push(`I1: ACTIVE ${i} does not hold the slot`);
  for (const p of PERMITS) {
    const pm = st.permits[p];
    if (pm.status === "REPORTED" && st.obligations[p] === undefined) v.push(`I3: REPORTED ${p} without its obligation`);
    if (pm.status === "REPORTED" && pm.claim === "OPEN") v.push(`I12: REPORTED ${p} with an OPEN claim reservation`);
    if (pm.status !== "NONE" && !pm.blob) v.push(`I6: ${p} references a missing permit body`);
    if (pm.status === "REPORTED" && !pm.reportBlob) v.push(`I6: ${p} references a missing report body`);
    if (pm.status === "CLAIMED" && pm.claim === "NONE") v.push(`I12: CLAIMED ${p} without a claim reservation`);
  }
  for (const i of INSTANCES) {
    if (st.instances[i].life === "QUIESCED") {
      for (const p of PERMITS) if (st.permits[p].inst === i && ["ISSUED", "CLAIMED"].includes(st.permits[p].status)) v.push(`I9: QUIESCED ${i} holds ${st.permits[p].status} ${p}`);
    }
    if (st.world.remotePushed[i] === undefined && st.instances[i].push === "DONE") v.push(`I7: push outcome for ${i} without observation`);
  }
  if (st.rtr.status === "COMMITTED" && !st.world.s4Applied) v.push("I4: COMMITTED without an S4 success");
  if (st.rtr.status === "ABORTED" && !st.world.s4Refused) v.push("I4: ABORTED without a definitive S4 refusal");
  for (const i of INSTANCES) if ((st.minted.creates[i] ?? 0) > 1) v.push(`I8: ${i} minted twice`);
  for (const p of PERMITS) if ((st.minted.permits[p] ?? 0) > 1) v.push(`I8: ${p} minted twice`);
  return v;
}

export function checkStep(pre, post, op) {
  const v = [];
  const [name, arg] = op;
  const committed = post.version !== pre.version;
  // I2: terminal states are monotonic.
  for (const p of PERMITS) {
    const a = pre.permits[p];
    const b = post.permits[p];
    if (PERMIT_TERMINAL.has(a.status) && b.status !== a.status) v.push(`I2: terminal permit ${p} changed`);
    if (a.status === "CLAIMED" && !["CLAIMED", "REPORTED"].includes(b.status)) v.push(`I2: CLAIMED ${p} rewritten to ${b.status}`);
    if (!["NONE", "OPEN"].includes(a.claim) && b.claim !== a.claim) v.push(`I2: closed claim reservation ${p} reopened`);
    const oa = pre.obligations[p];
    if (oa !== undefined && oa !== "OPEN" && post.obligations[p] !== oa) v.push(`I2: closed obligation ${p} reopened`);
  }
  for (const i of INSTANCES) {
    const a = pre.instances[i].life;
    const b = post.instances[i].life;
    if (a === "CLEANED" && b !== "CLEANED") v.push(`I2: CLEANED ${i} changed`);
    if (a === "QUARANTINED" && !["QUARANTINED", "CLEANED"].includes(b)) v.push(`I2: QUARANTINED ${i} moved to ${b}`);
  }
  if (["COMMITTED", "ABORTED"].includes(pre.rtr.status) && post.rtr.status !== pre.rtr.status) v.push("I2: terminal RTR changed");
  // I4: while PENDING, no finish/cleanup of the instance.
  if (pre.rtr.status === "PENDING" && post.rtr.status === "PENDING") {
    const i = pre.rtr.inst;
    if (post.instances[i].life === "COMPLETED" || post.instances[i].cleanup === "OPEN") v.push("I4: finish/cleanup while publication PENDING");
  }
  // I5: a committed change carries its journal entry in the same version.
  if (committed && (!post.last || post.last.version !== post.version)) v.push("I5: committed change without its journal entry");
  const changed = INSTANCES.some((i) => pre.instances[i].life !== post.instances[i].life) || pre.slot !== post.slot
    || PERMITS.some((p) => pre.permits[p].status !== post.permits[p].status || pre.permits[p].claim !== post.permits[p].claim || pre.obligations[p] !== post.obligations[p]);
  if (changed && !committed) v.push("I5: state changed without a commit");
  // I10: an unattributable PENDING record blocks lifecycle mutation.
  if (pre.rtr.status === "PENDING" && !pre.rtr.attributable) {
    if (INSTANCES.some((i) => pre.instances[i].life !== post.instances[i].life && name !== "recover") || (pre.slot !== post.slot && pre.slot === null)) v.push("I10: lifecycle changed while PENDING unattributable");
  }
  // I11: no create while another instance retains unresolved influence.
  if (pre.slot !== post.slot && post.slot !== null) {
    for (const i of INSTANCES) if (i !== post.slot && unresolved(pre, i).length > 0) v.push(`I11: create while ${i} retains ${unresolved(pre, i).join(",")}`);
  }
  // I12: reservations leave OPEN only by their named path.
  for (const p of PERMITS) {
    const a = pre.permits[p];
    const b = post.permits[p];
    if (a.claim === "OPEN" && b.claim !== "OPEN") {
      const viaReport = b.claim === "SUPERSEDED_BY_REPORT" && b.status === "REPORTED" && post.obligations[p] === "OPEN" && name === "report" && arg === p;
      const viaOperator = b.claim === "OPERATOR_RESOLVED" && name === "resolve_operator_claim" && arg === p;
      if (!viaReport && !viaOperator) v.push(`I12/I13: claim ${p} closed by ${name}(${arg ?? ""})`);
    }
    if (pre.obligations[p] === "OPEN" && post.obligations[p] !== "OPEN") {
      const viaProof = post.obligations[p] === "PROOF_RESOLVED" && ((name === "resolve_proof" && arg === p) || (name === "quiesce" && arg === pre.permits[p].inst)) && !pre.groupAlive[p];
      const viaOperator = post.obligations[p] === "OPERATOR_RESOLVED" && name === "resolve_operator_obligation" && arg === p;
      if (!viaProof && !viaOperator) v.push(`I12/I13: obligation ${p} closed by ${name}(${arg ?? ""})`);
    }
    if (name === "report" && arg === p && pre.instances[a.inst ?? "i1"].life === "QUARANTINED" && post.instances[a.inst].life !== "QUARANTINED") v.push("I12: late report changed a QUARANTINED instance");
  }
  // I13: exact-target resolution, and a record never releases on its own.
  if (committed && post.last?.op === "OPERATOR_RESOLUTION") {
    const [kind, p] = post.last.target.split(":");
    const closed = kind === "claim" ? post.permits[p].claim === "OPERATOR_RESOLVED" : post.obligations[p] === "OPERATOR_RESOLVED";
    if (!closed) v.push(`I13: OPERATOR_RESOLUTION record for ${post.last.target} left it OPEN`);
    for (const r of PERMITS) {
      if (!(kind === "claim" && r === p) && pre.permits[r].claim === "OPEN" && post.permits[r].claim !== "OPEN") v.push(`I13: resolution of ${post.last.target} closed claim:${r}`);
      if (!(kind === "obligation" && r === p) && pre.obligations[r] === "OPEN" && post.obligations[r] !== "OPEN") v.push(`I13: resolution of ${post.last.target} closed obligation:${r}`);
    }
    for (const i of INSTANCES) for (const k of ["push", "cleanup", "create"]) if (pre.instances[i][k] === "OPEN" && post.instances[i][k] !== "OPEN") v.push(`I13: resolution of ${post.last.target} closed ${k}:${i}`);
    if (pre.rtr.status === "PENDING" && post.rtr.status !== "PENDING") v.push(`I13: resolution of ${post.last.target} closed the publication`);
  }
  if (pre.slot !== null && post.slot === null && unresolved(post, pre.slot).length > 0) v.push(`I13: slot released while ${pre.slot} retains ${unresolved(post, pre.slot).join(",")}`);
  if (pre.slot !== null && post.slot === null && lifecycleCanProgress(post, pre.slot)) v.push(`I13: slot released while ${pre.slot} can progress`);
  return v;
}

// Runs a sequence; returns the states, per-step outcomes and violations.
export function run(ops, { mutant = null, from = initialState() } = {}) {
  let st = from;
  const trace = [];
  const violations = [];
  for (const op of ops) {
    const next = step(st, op, { mutant });
    if (next === null) {
      trace.push({ op, refused: true, state: st });
      continue;
    }
    for (const x of [...checkStep(st, next, op), ...checkState(next)]) violations.push(`${op.join("(")}${op.length > 1 ? ")" : ""}: ${x}`);
    st = next;
    trace.push({ op, refused: false, state: st });
  }
  return { state: st, trace, violations };
}

// Bounded exhaustive generation: every sequence of up to `depth` operations
// from the initial state, deduplicated by state (version and journal excluded).
export function explore({ depth, mutant = null, limit = 2_000_000 }) {
  const ops = allOps();
  const key = (st) => JSON.stringify({ ...st, version: 0, last: null });
  const seen = new Set([key(initialState())]);
  let frontier = [initialState()];
  const violations = [];
  let transitions = 0;
  for (let d = 0; d < depth && frontier.length; d += 1) {
    const next = [];
    for (const st of frontier) {
      for (const op of ops) {
        const n = step(st, op, { mutant });
        if (n === null) continue;
        transitions += 1;
        const bad = [...checkStep(st, n, op), ...checkState(n)];
        if (bad.length) {
          violations.push({ op, violations: bad });
          if (violations.length > 50) return { states: seen.size, transitions, violations, depthReached: d + 1 };
          continue;
        }
        const k = key(n);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(n);
          if (seen.size > limit) throw new Error(`model exploration exceeded ${limit} states`);
        }
      }
    }
    frontier = next;
  }
  return { states: seen.size, transitions, violations, depthReached: depth };
}
