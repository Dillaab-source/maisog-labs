# MaisogLabs Agent Coordination State

CYCLE_ID: PHASE-1-GOVERNANCE-BOOTSTRAP
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
AUTHORIZED_SCOPE: PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: 2e97bf65423daad59348b98860f6bf7ebaec4215
LAST_ARCHITECT_REVIEWED_SHA: 2e97bf65423daad59348b98860f6bf7ebaec4215
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## State protocol

This file is the machine-readable turn signal for the MaisogLabs Claude ↔ Architect workflow.

Allowed primary states:

- `WAITING_FOR_IMPLEMENTER` — Claude owns the next action.
- `READY_FOR_ARCHITECT` — Claude has committed/pushed a handoff; Architect owns the next action.
- `ARCHITECT_REVIEWING` — Architect review is in progress.
- `CHANGES_REQUESTED` — Architect completed review and Claude owns remediation.
- `ARCHITECT_APPROVED` — review passed for the scoped change; no further implementation may begin unless the currently authorized scope already permits it or Paulo authorizes the next gate.
- `PAULO_DECISION_REQUIRED` — stop; Paulo must decide before either agent proceeds materially.
- `BLOCKED` — stop; blocker must be resolved explicitly.

## Current authorization

Paulo approved progression to **Phase 1 — Governance Bootstrap**.

Claude may perform only the governance-bootstrap work described in `CLAUDE.md` and the governance plan.

No Admin implementation, public-site redesign, production deployment, or merge to `main` is authorized.

## Claude handoff rule

When Phase 1 bootstrap is complete, Claude must:

1. Update `coordination/IMPLEMENTER_HANDOFF.md` with factual evidence for this cycle.
2. Change this file to:
   - `TURN: ARCHITECT`
   - `STATUS: READY_FOR_ARCHITECT`
   - `ARCHITECT_ACTION_REQUIRED: YES`
   - `IMPLEMENTER_ACTION_REQUIRED: NO`
3. Record the exact branch HEAD used for the handoff in the handoff evidence.
4. Commit and push the handoff and state update to `governance/maisoglabs-v0.1`.
5. Stop.

## Architect review rule

When `STATUS: READY_FOR_ARCHITECT`, the Architect independently reviews the governance bootstrap and writes `coordination/ARCHITECT_REVIEW.md`.

After review, the Architect updates this file to one of:

- `CHANGES_REQUESTED` with `TURN: CLAUDE`, or
- `ARCHITECT_APPROVED` with `TURN: PAULO` when a Paulo gate is required, or
- `PAULO_DECISION_REQUIRED` with `TURN: PAULO`, or
- `BLOCKED` with the appropriate owner.

## Loop guard

Automatic remediation cycles are capped at `MAX_REMEDIATION_CYCLES`.

If the cap is reached without approval, set:

`STATUS: PAULO_DECISION_REQUIRED`

Do not continue an autonomous implementation/review loop beyond the cap.

## Current gate

Phase 1 governance bootstrap is authorized. Functional website/Admin implementation remains prohibited until a later Paulo-approved phase.
