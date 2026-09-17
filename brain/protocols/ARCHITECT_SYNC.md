# Architect Sync Protocol

This formalizes the review flow from `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §19, aligned with the live mechanism in `coordination/` (`STATE.md`, `IMPLEMENTER_HANDOFF.md`, `ARCHITECT_REVIEW.md`).

## Review flow

```
Repository state
  → Governance requirements
  → Governance Map
  → Implementation
  → Tests
  → Evidence
  → Git diff
  → Security/risk review
  → Contradictions
  → Verdict
```

The Architect inspects repository reality independently at every step. The Implementer's handoff (`coordination/IMPLEMENTER_HANDOFF.md`) is an input, never proof by itself.

## Review modes

1. **CHANGE REVIEW** — scoped to the current change/cycle only.
2. **STAGE GATE REVIEW** — broader review of a full development stage (e.g. closing Phase 0, closing Phase 1) before the next phase may be authorized.
3. **RELEASE REVIEW** — evidence-based readiness assessment for production release.
4. **SECURITY REVIEW** — focused review of security boundaries (auth, input validation, secrets, injection surfaces).

## Verdict rules

A `CHANGE REVIEW` may return:

- `READY TO COMMIT: YES`
- `READY TO COMMIT: NO`
- `READY TO COMMIT: YES WITH FOLLOW-UP`

`READY TO COMMIT: YES` means no unresolved blocker introduced by, materially affecting, or required for the specific change under review remains unresolved. It does **not** mean the whole project has zero unresolved risk — pre-existing, unrelated risk (see `RISK_REGISTER.md`) does not block an unrelated documentation or scoped change.

`STAGE GATE REVIEW`, `RELEASE REVIEW`, and `SECURITY REVIEW` must state a verdict appropriate to their explicitly declared broader scope (e.g. `PHASE N STAGE GATE: APPROVED` / `NOT APPROVED`, as used for Phase 0's closure).

## Turn protocol (mechanical layer)

`coordination/STATE.md` is the machine-readable turn signal. See that file's own "State protocol" section for the authoritative field list; this protocol document only records the intent:

- Claude proceeds only when `TURN: CLAUDE` and `IMPLEMENTER_ACTION_REQUIRED: YES`.
- Claude hands off by updating `IMPLEMENTER_HANDOFF.md`, then setting `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT`, then committing and pushing both together.
- The Architect reviews independently, writes `ARCHITECT_REVIEW.md`, and sets the state to one of `CHANGES_REQUESTED` (`TURN: CLAUDE`), `ARCHITECT_APPROVED` (`TURN: PAULO` when a gate applies), `PAULO_DECISION_REQUIRED` (`TURN: PAULO`), or `BLOCKED`.
- Only Paulo can authorize a new phase, deployment, or a `main` merge — an `ARCHITECT_APPROVED` stage-gate verdict is a recommendation, not an authorization.

## Remediation loop cap

Autonomous remediation cycles are capped at `MAX_REMEDIATION_CYCLES` (currently `3`, per `coordination/STATE.md`). If the cap would be exceeded without approval, the state moves to `PAULO_DECISION_REQUIRED` and both agents stop autonomous looping. Paulo may explicitly raise the cap; neither agent may raise it unilaterally.

## Evidence discipline

Every claim in a review or handoff is one of: implementer-reported, Architect-reproduced, or production/runtime evidence (see `TEST_LEDGER.md`). A review must state which class each piece of evidence it relies on belongs to, and must not silently upgrade implementer-reported evidence to Architect-reproduced just because it inspected the surrounding code — reproduction means actually running or independently verifying the same check.
