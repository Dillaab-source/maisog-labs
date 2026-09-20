// ML-DEVOS-RFC-016 / ML-DEVOS-AS-065 / D-050 -- pure, deterministic S4 lifecycle
// transition logic. No I/O, no filesystem, no clock reads: every function here
// is a pure function of its arguments, so it can be unit-tested without a
// store or a real clock. devos/state/kernel.mjs composes this module with
// devos/state/store.mjs (persistence) and devos/state/task-policy.mjs (the
// explicit, never-coordination/STATE.md-derived retry-ceiling input).

export const STATES = Object.freeze([
  "CREATED", "PLANNING", "READY_FOR_BUILD", "BUILDING", "READY_FOR_QA", "QA",
  "READY_FOR_REVIEW", "REVIEW", "CHANGES_REQUESTED", "PAULO_DECISION_REQUIRED",
  "APPROVED", "MERGE_READY", "MERGED", "RELEASE_READY", "DEPLOYED", "VERIFIED",
  "FAILED", "ABANDONED",
]);

export const TERMINAL_STATES = new Set(["FAILED", "ABANDONED", "VERIFIED"]);

// Designated handoff destinations (ML-DEVOS-RFC-016 section D): a transition
// into any of these atomically clears owner/lease as part of the same write
// that commits the new state, so the next role can claim immediately and the
// outgoing owner is fenced out via the revision bump alone.
export const HANDOFF_DESTINATIONS = new Set([
  "READY_FOR_BUILD", "READY_FOR_QA", "READY_FOR_REVIEW",
  "CHANGES_REQUESTED", "PAULO_DECISION_REQUIRED",
]);

export const EVIDENCE_CLASSES = Object.freeze([
  "ACTOR_REPORTED", "INDEPENDENTLY_INSPECTED", "INDEPENDENTLY_REPRODUCED",
  "CI_ATTESTED", "RUNTIME_OBSERVED",
]);

// Plain adjacency, independent of the extra retry-ceiling/role/evidence guards
// below (ML-DEVOS-RFC-016 section C's transition table). ABANDONED is reachable
// from every non-terminal state and is added programmatically, not listed here,
// since it applies uniformly rather than per-row.
const ADJACENCY = new Map([
  ["CREATED", new Set(["PLANNING"])],
  ["PLANNING", new Set(["READY_FOR_BUILD"])],
  ["READY_FOR_BUILD", new Set(["BUILDING"])],
  ["BUILDING", new Set(["READY_FOR_QA", "FAILED"])],
  ["READY_FOR_QA", new Set(["QA"])],
  ["QA", new Set(["READY_FOR_REVIEW", "BUILDING", "FAILED"])],
  ["READY_FOR_REVIEW", new Set(["REVIEW"])],
  ["REVIEW", new Set(["CHANGES_REQUESTED", "PAULO_DECISION_REQUIRED", "APPROVED"])],
  ["CHANGES_REQUESTED", new Set(["BUILDING"])],
  ["PAULO_DECISION_REQUIRED", new Set(["BUILDING", "ABANDONED"])],
  ["APPROVED", new Set(["MERGE_READY"])],
  ["MERGE_READY", new Set(["MERGED"])],
  ["MERGED", new Set(["RELEASE_READY"])],
  ["RELEASE_READY", new Set(["DEPLOYED"])],
  ["DEPLOYED", new Set(["VERIFIED"])],
]);

// Evidence-reference class-label guards (six transitions, corrected from an
// earlier draft's miscount of five -- ML-DEVOS-RFC-016 section G). The kernel
// checks presence and declared class only, never the referenced artifact's
// actual content or sufficiency -- that remains S3's validate-task-contract.mjs
// and, until S9 exists, human Architect/Paulo judgment.
const EVIDENCE_GUARDS = new Map([
  ["BUILDING->READY_FOR_QA", new Set(EVIDENCE_CLASSES)],
  ["QA->READY_FOR_REVIEW", new Set(["INDEPENDENTLY_REPRODUCED"])],
  ["APPROVED->MERGE_READY", new Set(["INDEPENDENTLY_REPRODUCED", "CI_ATTESTED"])],
  ["MERGE_READY->MERGED", new Set(["INDEPENDENTLY_REPRODUCED", "CI_ATTESTED"])],
  ["RELEASE_READY->DEPLOYED", new Set(["ACTOR_REPORTED", "CI_ATTESTED"])],
  ["DEPLOYED->VERIFIED", new Set(["RUNTIME_OBSERVED"])],
]);

// D-050: only the ABANDONED destination is role-gated in this V1 kernel -- a
// Builder must never be able to abandon its own task to hide failed work
// (ML-DEVOS-RFC-016 section C, "Explicitly rejected transitions"). This is a
// structural-legality check the kernel itself owns; it is not the S5
// Capability & Permission Gateway, which governs a broader question (whether
// an actor may hold tools/credentials at all) this kernel never touches.
const ABANDONED_ALLOWED_ROLES = new Set(["ARCHITECT", "PAULO"]);

export const AUTHORITY_DISCLAIMER =
  "This Task Engine State record describes only the kernel's tracked lifecycle progress for a task already authorized elsewhere (its S3 Task Contract, referenced by contract_ref). It does not itself grant authority, tool access, credentials, remote-resource access, merge approval, deployment approval, or risk acceptance (CORE-001, CORE-002). A task reaching MERGED/DEPLOYED/VERIFIED in this record is a descriptive fact about kernel-tracked progress, not a merge/deployment/production authorization by itself.";

export function isKnownState(s) {
  return STATES.includes(s);
}

export function isTerminal(s) {
  return TERMINAL_STATES.has(s);
}

export function isHandoffDestination(s) {
  return HANDOFF_DESTINATIONS.has(s);
}

function isAdjacent(from, to) {
  if (TERMINAL_STATES.has(from)) return false;
  if (to === "ABANDONED") return true;
  const set = ADJACENCY.get(from);
  return !!set && set.has(to);
}

/**
 * Which retry counters a given transition increments, applied only once the
 * transition itself has already been found legal by checkTransition(). Kept
 * as a separate pure function so kernel.mjs can apply the increments as part
 * of the same atomic write that commits the new state.
 */
export function retryIncrementsFor(from, to) {
  const key = `${from}->${to}`;
  const inc = { build: 0, qa: 0, review: 0 };
  if (key === "QA->BUILDING") inc.qa = 1;
  if (key === "CHANGES_REQUESTED->BUILDING") {
    inc.review = 1;
    inc.build = 1;
  }
  if (key === "PAULO_DECISION_REQUIRED->BUILDING") inc.build = 1;
  return inc;
}

/**
 * checkTransition -- the single structural-legality gate. Pure: given the
 * same inputs it always returns the same result. Returns { ok: true } or
 * { ok: false, reason }.
 *
 * retryCeilings must be an explicit S4 Task Policy input (devos/state/task-policy.mjs)
 * -- never read from coordination/STATE.md by this function or any caller of it
 * (ML-DEVOS-RFC-016 section E, correcting AS65-F003).
 */
export function checkTransition({
  from,
  to,
  requesterRole,
  evidenceRef,
  retryCounts,
  retryCeilings,
  explicitFailureFlag = false,
  explicitAmbiguityFlag = false,
}) {
  if (!isKnownState(from)) return { ok: false, reason: `unknown from-state: ${from}` };
  if (!isKnownState(to)) return { ok: false, reason: `unknown to-state: ${to}` };
  if (!isAdjacent(from, to)) return { ok: false, reason: `illegal transition ${from} -> ${to}` };

  if (to === "ABANDONED" && !ABANDONED_ALLOWED_ROLES.has(requesterRole)) {
    return {
      ok: false,
      reason: `ABANDONED may only be requested by ARCHITECT or PAULO, not '${requesterRole}'`,
    };
  }

  const key = `${from}->${to}`;

  if (key === "BUILDING->FAILED") {
    if (!explicitFailureFlag && !(retryCounts.build >= retryCeilings.build)) {
      return {
        ok: false,
        reason: "BUILDING->FAILED requires an explicit failure report or the build retry ceiling to be reached",
      };
    }
  }

  if (key === "QA->BUILDING") {
    if (!(retryCounts.qa < retryCeilings.qa)) {
      return {
        ok: false,
        reason: "QA->BUILDING is unavailable once the qa retry ceiling is reached; use QA->FAILED instead",
      };
    }
  }

  if (key === "QA->FAILED") {
    if (!(retryCounts.qa >= retryCeilings.qa)) {
      return { ok: false, reason: "QA->FAILED is only legal once the qa retry ceiling has been reached" };
    }
  }

  if (key === "REVIEW->PAULO_DECISION_REQUIRED") {
    if (!explicitAmbiguityFlag && !(retryCounts.review >= retryCeilings.review)) {
      return {
        ok: false,
        reason: "REVIEW->PAULO_DECISION_REQUIRED requires an explicit ambiguity flag or the review retry ceiling to be reached",
      };
    }
  }

  if (EVIDENCE_GUARDS.has(key)) {
    const allowed = EVIDENCE_GUARDS.get(key);
    if (!evidenceRef || !evidenceRef.evidenceClass || !allowed.has(evidenceRef.evidenceClass)) {
      return {
        ok: false,
        reason: `${key} requires an evidence_ref whose evidenceClass is one of: ${[...allowed].join(", ")}`,
      };
    }
  }

  return { ok: true };
}
