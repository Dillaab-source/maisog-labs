// S6 reference state model (ML-DEVOS-RFC-019 §13.6, §18 items 12 and 16;
// ML-DEVOS-AS-099/100/101; D-074).
//
// Checks I1-I13 after every step of every bounded operation sequence, the
// mandatory named sequences Q1-Q5b, and that Mutants A-C are falsified.
import assert from "node:assert/strict";
import { test } from "node:test";

import { explore, initialState, isActive, publishable, run, step } from "../devos/execution/model.mjs";

const DEPTH = Number(process.env.S6_MODEL_DEPTH ?? 14);

// Up to an ATTACHED instance i1 holding the slot.
const ATTACHED = [["create", "i1"], ["create_finish", "i1"], ["attach", "i1"]];
// Q1 prefix: claim, crash before report, recovery quarantine, time advance.
const CLAIM_CRASH = [...ATTACHED, ["issue", "p1"], ["claim", "p1"], ["crash"], ["recover"], ["time_advance"]];

function last(r) {
  return r.trace.at(-1);
}

function assertClean(r) {
  assert.deepEqual(r.violations, [], r.violations.join("\n"));
}

test("Q1: CLAIMED -> crash before report -> recovery quarantine -> second create is BLOCKED", () => {
  const r = run([...CLAIM_CRASH, ["create", "i2"]]);
  assertClean(r);
  assert.equal(last(r).refused, true, "SECOND CREATE BLOCKED");
  assert.equal(r.state.instances.i1.life, "QUARANTINED");
  assert.equal(r.state.permits.p1.claim, "OPEN");
  assert.equal(r.state.slot, "i1");
  assert.ok(isActive(r.state, "i1"));
});

test("Q2: a verified late report registers liveness, keeps the slot, and never restores or publishes", () => {
  const r = run([...CLAIM_CRASH, ["report", "p1"], ["create", "i2"], ["attach", "i1"], ["publish_prepare", "i1"]]);
  assertClean(r);
  assert.equal(r.state.permits.p1.status, "REPORTED");
  assert.equal(r.state.permits.p1.claim, "SUPERSEDED_BY_REPORT");
  assert.equal(r.state.obligations.p1, "OPEN");
  assert.equal(r.state.instances.i1.life, "QUARANTINED");
  assert.equal(publishable(r.state, "i1"), false);
  assert.ok(r.trace.slice(-3).every((t) => t.refused), "create, attach and publication are all refused");
  assert.equal(r.state.slot, "i1");
});

test("Q3: late report -> groups proven terminated -> slot released -> later valid create succeeds", () => {
  const r = run([...CLAIM_CRASH, ["report", "p1"], ["group_exit", "p1"], ["resolve_proof", "p1"], ["create", "i2"]]);
  assertClean(r);
  assert.equal(r.state.obligations.p1, "PROOF_RESOLVED");
  assert.equal(last(r).refused, false, "later create succeeds");
  assert.equal(r.state.slot, "i2");
  assert.equal(r.state.instances.i1.life, "QUARANTINED");
  assert.equal(publishable(r.state, "i1"), false);
});

test("Q4: a live group, or another open reservation, keeps the slot held", () => {
  const alive = run([...CLAIM_CRASH, ["report", "p1"], ["resolve_proof", "p1"], ["create", "i2"]]);
  assertClean(alive);
  assert.ok(alive.trace.slice(-2).every((t) => t.refused));
  assert.equal(alive.state.slot, "i1");

  const other = run([...ATTACHED, ["issue", "p1"], ["issue", "p2"], ["claim", "p1"], ["claim", "p2"], ["crash"], ["recover"],
    ["report", "p1"], ["group_exit", "p1"], ["resolve_proof", "p1"], ["create", "i2"]]);
  assertClean(other);
  assert.equal(other.state.permits.p2.claim, "OPEN");
  assert.equal(last(other).refused, true);
  assert.equal(other.state.slot, "i1");
});

test("Q5: no report -> time advances -> BLOCKED -> exact operator resolution -> slot released -> later create succeeds", () => {
  const blocked = run([...CLAIM_CRASH, ["time_advance"], ["create", "i2"]]);
  assertClean(blocked);
  assert.equal(last(blocked).refused, true, "second create BLOCKED while the reservation is OPEN");
  assert.equal(blocked.state.permits.p1.claim, "OPEN");

  const r = run([["resolve_operator_claim", "p1"], ["create", "i2"]], { from: blocked.state });
  assertClean(r);
  assert.equal(r.trace[0].state.last.op, "OPERATOR_RESOLUTION");
  assert.equal(r.trace[0].state.last.target, "claim:p1");
  assert.equal(r.trace[0].state.last.actor_reported, true);
  assert.equal(r.state.permits.p1.status, "CLAIMED", "historical permit remains CLAIMED");
  assert.equal(r.state.permits.p1.claim, "OPERATOR_RESOLVED");
  assert.equal(r.state.instances.i1.life, "QUARANTINED");
  assert.equal(publishable(r.state, "i1"), false);
  assert.equal(last(r).refused, false, "later valid create succeeds");
  assert.equal(r.state.slot, "i2");
});

test("Q5a: another unresolved reservation keeps the slot held after an exact operator resolution", () => {
  // A second claim.
  const two = run([...ATTACHED, ["issue", "p1"], ["issue", "p2"], ["claim", "p1"], ["claim", "p2"], ["crash"], ["recover"],
    ["resolve_operator_claim", "p1"], ["create", "i2"]]);
  assertClean(two);
  assert.equal(two.state.permits.p1.claim, "OPERATOR_RESOLVED");
  assert.equal(two.state.permits.p2.claim, "OPEN");
  assert.equal(last(two).refused, true);
  assert.equal(two.state.slot, "i1");
  // An open liveness obligation.
  const obl = run([...ATTACHED, ["issue", "p1"], ["issue", "p2"], ["claim", "p1"], ["claim", "p2"], ["crash"], ["recover"],
    ["report", "p2"], ["resolve_operator_claim", "p1"], ["create", "i2"]]);
  assertClean(obl);
  assert.equal(obl.state.obligations.p2, "OPEN");
  assert.equal(last(obl).refused, true);
  assert.equal(obl.state.slot, "i1");
});

test("Q5b: with no resolution the claim reservation stays OPEN and the slot held under every time advance", () => {
  const r = run([...CLAIM_CRASH, ["time_advance"], ["time_advance"], ["expire", "p1"], ["create", "i2"]]);
  assertClean(r);
  assert.equal(r.state.permits.p1.claim, "OPEN");
  assert.equal(r.state.permits.p1.status, "CLAIMED");
  assert.equal(last(r).refused, true);
  assert.equal(r.state.slot, "i1");
});

test("an operator resolution of a non-quarantined instance's claim is refused", () => {
  const r = run([...ATTACHED, ["issue", "p1"], ["claim", "p1"], ["resolve_operator_claim", "p1"]]);
  assertClean(r);
  assert.equal(last(r).refused, true);
});

test(`bounded exhaustive generation (depth ${DEPTH}) finds no violation of I1-I13`, { timeout: 600_000 }, () => {
  const res = explore({ depth: DEPTH });
  assert.deepEqual(res.violations, [], JSON.stringify(res.violations.slice(0, 5), null, 1));
  assert.ok(res.states > 1000, `explored ${res.states} states`);
  console.log(`# model: depth ${DEPTH}, ${res.states} distinct states, ${res.transitions} transitions, 0 violations`);
});

// Falsification (§13.6, §18 items 12 and 16).
test("Mutant A (release on quarantine) violates I1/I11 in Q1", () => {
  const r = run([...CLAIM_CRASH, ["create", "i2"]], { mutant: "A" });
  assert.ok(r.violations.some((v) => /I1: |I11: /.test(v)), r.violations.join("\n"));
  assert.equal(last(r).refused, false, "the mutant lets the second create through");
});

test("Mutant B (audit record without reservation closure) violates I13 and fails Q5", () => {
  const r = run([...CLAIM_CRASH, ["resolve_operator_claim", "p1"], ["create", "i2"]], { mutant: "B" });
  assert.ok(r.violations.some((v) => /I13: OPERATOR_RESOLUTION record for claim:p1 left it OPEN/.test(v)), r.violations.join("\n"));
  assert.notEqual(r.state.permits.p1.claim, "OPERATOR_RESOLVED", "Q5 expected state not reached");
});

test("Mutant C (over-broad resolution) violates I13 and fails Q5a", () => {
  const r = run([...ATTACHED, ["issue", "p1"], ["issue", "p2"], ["claim", "p1"], ["claim", "p2"], ["crash"], ["recover"],
    ["resolve_operator_claim", "p1"], ["create", "i2"]], { mutant: "C" });
  assert.ok(r.violations.some((v) => /I13: resolution of claim:p1 closed claim:p2/.test(v)), r.violations.join("\n"));
});

for (const mutant of ["A", "B", "C"]) {
  test(`bounded exhaustive generation falsifies Mutant ${mutant}`, { timeout: 600_000 }, () => {
    const res = explore({ depth: DEPTH, mutant });
    assert.ok(res.violations.length > 0, `Mutant ${mutant} survived exhaustive generation`);
  });
}

test("the model is pure: a step never mutates its input state", () => {
  const s = initialState();
  const snapshot = JSON.stringify(s);
  step(s, ["create", "i1"]);
  assert.equal(JSON.stringify(s), snapshot);
});
