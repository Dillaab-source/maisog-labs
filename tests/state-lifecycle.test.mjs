// ML-DEVOS-RFC-016 / ML-DEVOS-AS-065 / D-050 -- focused tests for the pure S4
// lifecycle transition logic (devos/state/lifecycle.mjs) and the structural
// task-state validator (devos/state/validate-task-state.mjs). No filesystem,
// no clock, no concurrency here -- see tests/state-kernel.test.mjs and
// tests/state-concurrency.test.mjs for the store-backed and real-concurrent-
// writer coverage the RFC's implementation mapping also requires.

import test from "node:test";
import assert from "node:assert/strict";
import { checkTransition, retryIncrementsFor, AUTHORITY_DISCLAIMER, STATES, isHandoffDestination, isTerminal } from "../devos/state/lifecycle.mjs";
import { validate } from "../devos/state/validate-task-state.mjs";

const CEILINGS = { build: 2, qa: 2, review: 2 };
const ZERO_RETRIES = { build: 0, qa: 0, review: 0 };

function evidence(evidenceClass) {
  return { ref: "opaque-ref-not-inspected", evidenceClass };
}

test("all legal lifecycle transitions succeed with a plausible requester role", () => {
  const legal = [
    { from: "CREATED", to: "PLANNING", requesterRole: "BUILDER" },
    { from: "PLANNING", to: "READY_FOR_BUILD", requesterRole: "BUILDER" },
    { from: "READY_FOR_BUILD", to: "BUILDING", requesterRole: "BUILDER" },
    { from: "BUILDING", to: "READY_FOR_QA", requesterRole: "BUILDER", evidenceRef: evidence("ACTOR_REPORTED") },
    { from: "READY_FOR_QA", to: "QA", requesterRole: "QA" },
    { from: "QA", to: "READY_FOR_REVIEW", requesterRole: "QA", evidenceRef: evidence("INDEPENDENTLY_REPRODUCED") },
    { from: "READY_FOR_REVIEW", to: "REVIEW", requesterRole: "REVIEWER" },
    { from: "REVIEW", to: "APPROVED", requesterRole: "REVIEWER" },
    { from: "REVIEW", to: "CHANGES_REQUESTED", requesterRole: "REVIEWER" },
    { from: "CHANGES_REQUESTED", to: "BUILDING", requesterRole: "BUILDER" },
    { from: "PAULO_DECISION_REQUIRED", to: "BUILDING", requesterRole: "BUILDER" },
    { from: "PAULO_DECISION_REQUIRED", to: "ABANDONED", requesterRole: "PAULO" },
    { from: "APPROVED", to: "MERGE_READY", requesterRole: "REVIEWER", evidenceRef: evidence("CI_ATTESTED") },
    { from: "MERGE_READY", to: "MERGED", requesterRole: "REVIEWER", evidenceRef: evidence("CI_ATTESTED") },
    { from: "MERGED", to: "RELEASE_READY", requesterRole: "REVIEWER" },
    { from: "RELEASE_READY", to: "DEPLOYED", requesterRole: "REVIEWER", evidenceRef: evidence("CI_ATTESTED") },
    { from: "DEPLOYED", to: "VERIFIED", requesterRole: "REVIEWER", evidenceRef: evidence("RUNTIME_OBSERVED") },
    { from: "BUILDING", to: "ABANDONED", requesterRole: "ARCHITECT" },
  ];
  for (const t of legal) {
    const result = checkTransition({ ...t, retryCounts: ZERO_RETRIES, retryCeilings: CEILINGS });
    assert.equal(result.ok, true, `${t.from} -> ${t.to} should be legal: ${result.reason || ""}`);
  }
});

test("illegal skipped transitions are rejected", () => {
  const illegal = [
    ["CREATED", "MERGED"],
    ["BUILDING", "VERIFIED"],
    ["CREATED", "DEPLOYED"],
    ["READY_FOR_BUILD", "READY_FOR_QA"],
  ];
  for (const [from, to] of illegal) {
    const result = checkTransition({ from, to, requesterRole: "BUILDER", retryCounts: ZERO_RETRIES, retryCeilings: CEILINGS });
    assert.equal(result.ok, false, `${from} -> ${to} should be illegal`);
  }
});

test("terminal states have no outgoing transition", () => {
  assert.ok(isTerminal("FAILED"));
  assert.ok(isTerminal("ABANDONED"));
  assert.ok(isTerminal("VERIFIED"));
  for (const terminal of ["FAILED", "ABANDONED", "VERIFIED"]) {
    for (const to of STATES) {
      const result = checkTransition({ from: terminal, to, requesterRole: "PAULO", retryCounts: ZERO_RETRIES, retryCeilings: CEILINGS });
      assert.equal(result.ok, false, `${terminal} -> ${to} must be rejected (terminal)`);
    }
  }
});

test("ABANDONED may only be requested by ARCHITECT or PAULO, never Builder self-abandon", () => {
  const asBuilder = checkTransition({ from: "BUILDING", to: "ABANDONED", requesterRole: "BUILDER", retryCounts: ZERO_RETRIES, retryCeilings: CEILINGS });
  assert.equal(asBuilder.ok, false);
  const asArchitect = checkTransition({ from: "BUILDING", to: "ABANDONED", requesterRole: "ARCHITECT", retryCounts: ZERO_RETRIES, retryCeilings: CEILINGS });
  assert.equal(asArchitect.ok, true);
  const asPaulo = checkTransition({ from: "REVIEW", to: "ABANDONED", requesterRole: "PAULO", retryCounts: ZERO_RETRIES, retryCeilings: CEILINGS });
  assert.equal(asPaulo.ok, true);
});

test("the six evidence-guarded transitions require the correctly classed evidence_ref, label-only", () => {
  const guarded = [
    { from: "BUILDING", to: "READY_FOR_QA", requiredAnyOf: ["ACTOR_REPORTED", "INDEPENDENTLY_INSPECTED", "INDEPENDENTLY_REPRODUCED", "CI_ATTESTED", "RUNTIME_OBSERVED"], wrongClass: null },
    { from: "QA", to: "READY_FOR_REVIEW", requiredAnyOf: ["INDEPENDENTLY_REPRODUCED"], wrongClass: "ACTOR_REPORTED" },
    { from: "APPROVED", to: "MERGE_READY", requiredAnyOf: ["INDEPENDENTLY_REPRODUCED", "CI_ATTESTED"], wrongClass: "ACTOR_REPORTED" },
    { from: "MERGE_READY", to: "MERGED", requiredAnyOf: ["INDEPENDENTLY_REPRODUCED", "CI_ATTESTED"], wrongClass: "ACTOR_REPORTED" },
    { from: "RELEASE_READY", to: "DEPLOYED", requiredAnyOf: ["ACTOR_REPORTED", "CI_ATTESTED"], wrongClass: "INDEPENDENTLY_INSPECTED" },
    { from: "DEPLOYED", to: "VERIFIED", requiredAnyOf: ["RUNTIME_OBSERVED"], wrongClass: "ACTOR_REPORTED" },
  ];
  assert.equal(guarded.length, 6, "exactly six transitions carry an evidence guard (corrected from an earlier five-count)");

  for (const g of guarded) {
    // Missing evidence entirely is rejected.
    const missing = checkTransition({ from: g.from, to: g.to, requesterRole: "BUILDER", retryCounts: ZERO_RETRIES, retryCeilings: CEILINGS });
    assert.equal(missing.ok, false, `${g.from} -> ${g.to} without evidence_ref must be rejected`);

    // Correctly classed evidence is accepted -- for every allowed class.
    for (const cls of g.requiredAnyOf) {
      const ok = checkTransition({
        from: g.from,
        to: g.to,
        requesterRole: "BUILDER",
        evidenceRef: evidence(cls),
        retryCounts: ZERO_RETRIES,
        retryCeilings: CEILINGS,
      });
      assert.equal(ok.ok, true, `${g.from} -> ${g.to} with ${cls} should be accepted`);
    }

    // A wrong-class evidence_ref is rejected purely on the label, and the
    // kernel never inspects the (deliberately bogus, non-existent) `ref`
    // value's actual content to make that determination.
    if (g.wrongClass) {
      const wrong = checkTransition({
        from: g.from,
        to: g.to,
        requesterRole: "BUILDER",
        evidenceRef: evidence(g.wrongClass),
        retryCounts: ZERO_RETRIES,
        retryCeilings: CEILINGS,
      });
      assert.equal(wrong.ok, false, `${g.from} -> ${g.to} with wrong class ${g.wrongClass} should be rejected`);
    }
  }
});

test("designated handoff destinations are exactly the five RFC-016 names", () => {
  const expected = ["READY_FOR_BUILD", "READY_FOR_QA", "READY_FOR_REVIEW", "CHANGES_REQUESTED", "PAULO_DECISION_REQUIRED"];
  for (const s of expected) assert.ok(isHandoffDestination(s), `${s} should be a handoff destination`);
  for (const s of STATES) {
    if (!expected.includes(s)) assert.equal(isHandoffDestination(s), false, `${s} should not be a handoff destination`);
  }
});

test("retry ceiling 2/2/2: QA loop guard and fail-closed escalation", () => {
  // Below ceiling: QA->BUILDING legal, QA->FAILED illegal.
  const below = { build: 0, qa: 1, review: 0 };
  assert.equal(checkTransition({ from: "QA", to: "BUILDING", requesterRole: "QA", retryCounts: below, retryCeilings: CEILINGS }).ok, true);
  assert.equal(checkTransition({ from: "QA", to: "FAILED", requesterRole: "QA", retryCounts: below, retryCeilings: CEILINGS }).ok, false);

  // At ceiling: QA->BUILDING illegal, QA->FAILED legal.
  const atCeiling = { build: 0, qa: 2, review: 0 };
  assert.equal(checkTransition({ from: "QA", to: "BUILDING", requesterRole: "QA", retryCounts: atCeiling, retryCeilings: CEILINGS }).ok, false);
  assert.equal(checkTransition({ from: "QA", to: "FAILED", requesterRole: "QA", retryCounts: atCeiling, retryCeilings: CEILINGS }).ok, true);
});

test("retry ceiling: REVIEW->PAULO_DECISION_REQUIRED requires an ambiguity flag or a reached review ceiling; REVIEW->CHANGES_REQUESTED stays available regardless", () => {
  const below = { build: 0, qa: 0, review: 1 };
  assert.equal(checkTransition({ from: "REVIEW", to: "PAULO_DECISION_REQUIRED", requesterRole: "REVIEWER", retryCounts: below, retryCeilings: CEILINGS }).ok, false);
  assert.equal(
    checkTransition({ from: "REVIEW", to: "PAULO_DECISION_REQUIRED", requesterRole: "REVIEWER", retryCounts: below, retryCeilings: CEILINGS, explicitAmbiguityFlag: true }).ok,
    true,
  );
  const atCeiling = { build: 0, qa: 0, review: 2 };
  assert.equal(checkTransition({ from: "REVIEW", to: "PAULO_DECISION_REQUIRED", requesterRole: "REVIEWER", retryCounts: atCeiling, retryCeilings: CEILINGS }).ok, true);
  // The retry loop back into CHANGES_REQUESTED is never ceiling-gated itself.
  assert.equal(checkTransition({ from: "REVIEW", to: "CHANGES_REQUESTED", requesterRole: "REVIEWER", retryCounts: atCeiling, retryCeilings: CEILINGS }).ok, true);
});

test("retry ceiling: BUILDING->FAILED requires an explicit failure report or a reached build ceiling", () => {
  const below = { build: 1, qa: 0, review: 0 };
  assert.equal(checkTransition({ from: "BUILDING", to: "FAILED", requesterRole: "BUILDER", retryCounts: below, retryCeilings: CEILINGS }).ok, false);
  assert.equal(
    checkTransition({ from: "BUILDING", to: "FAILED", requesterRole: "BUILDER", retryCounts: below, retryCeilings: CEILINGS, explicitFailureFlag: true }).ok,
    true,
  );
  const atCeiling = { build: 2, qa: 0, review: 0 };
  assert.equal(checkTransition({ from: "BUILDING", to: "FAILED", requesterRole: "BUILDER", retryCounts: atCeiling, retryCeilings: CEILINGS }).ok, true);
});

test("retryIncrementsFor increments exactly the documented counters for each loop-back edge", () => {
  assert.deepEqual(retryIncrementsFor("QA", "BUILDING"), { build: 0, qa: 1, review: 0 });
  assert.deepEqual(retryIncrementsFor("CHANGES_REQUESTED", "BUILDING"), { build: 1, qa: 0, review: 1 });
  assert.deepEqual(retryIncrementsFor("PAULO_DECISION_REQUIRED", "BUILDING"), { build: 1, qa: 0, review: 0 });
  assert.deepEqual(retryIncrementsFor("BUILDING", "READY_FOR_QA"), { build: 0, qa: 0, review: 0 });
});

test("validate() accepts a well-formed Task Engine State record", () => {
  const record = {
    task_id: "S4-SAMPLE-CASE-001",
    contract_ref: "SOME-S3-CONTRACT",
    state: "CREATED",
    owner: null,
    revision: 0,
    lease_expires_at: null,
    retry_counts: { build: 0, qa: 0, review: 0 },
    idempotency_ledger: {},
    history: [],
    authority_disclaimer: AUTHORITY_DISCLAIMER,
  };
  const errors = [];
  assert.equal(validate(record, errors), true, JSON.stringify(errors));
});

test("validate() rejects an unknown top-level field (Task Engine State / Run History boundary)", () => {
  const record = {
    task_id: "S4-SAMPLE-CASE-002",
    contract_ref: "SOME-S3-CONTRACT",
    state: "CREATED",
    owner: null,
    revision: 0,
    lease_expires_at: null,
    retry_counts: { build: 0, qa: 0, review: 0 },
    idempotency_ledger: {},
    history: [],
    authority_disclaimer: AUTHORITY_DISCLAIMER,
    command_output: "this looks like Run History telemetry, not Task Engine State",
  };
  const errors = [];
  assert.equal(validate(record, errors), false);
  assert.ok(errors.some((e) => e.includes("unknown top-level field 'command_output'")), JSON.stringify(errors));
});

test("validate() rejects a softened or omitted authority_disclaimer", () => {
  const base = {
    task_id: "S4-SAMPLE-CASE-003",
    contract_ref: "SOME-S3-CONTRACT",
    state: "CREATED",
    owner: null,
    revision: 0,
    lease_expires_at: null,
    retry_counts: { build: 0, qa: 0, review: 0 },
    idempotency_ledger: {},
    history: [],
  };
  const softened = { ...base, authority_disclaimer: "This record grants some limited authority." };
  const errors1 = [];
  assert.equal(validate(softened, errors1), false);
  assert.ok(errors1.some((e) => e.includes("authority_disclaimer")));

  const omitted = { ...base };
  const errors2 = [];
  assert.equal(validate(omitted, errors2), false);
  assert.ok(errors2.some((e) => e.includes("missing required field 'authority_disclaimer'")));
});

test("validate() rejects an unknown state and a malformed task_id", () => {
  const errorsState = [];
  assert.equal(
    validate(
      {
        task_id: "S4-SAMPLE-CASE-004",
        contract_ref: "C",
        state: "NOT_A_REAL_STATE",
        owner: null,
        revision: 0,
        lease_expires_at: null,
        retry_counts: { build: 0, qa: 0, review: 0 },
        idempotency_ledger: {},
        history: [],
        authority_disclaimer: AUTHORITY_DISCLAIMER,
      },
      errorsState,
    ),
    false,
  );

  const errorsId = [];
  assert.equal(
    validate(
      {
        task_id: "lowercase-not-allowed",
        contract_ref: "C",
        state: "CREATED",
        owner: null,
        revision: 0,
        lease_expires_at: null,
        retry_counts: { build: 0, qa: 0, review: 0 },
        idempotency_ledger: {},
        history: [],
        authority_disclaimer: AUTHORITY_DISCLAIMER,
      },
      errorsId,
    ),
    false,
  );
});
