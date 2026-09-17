# MaisogLabs Agent Coordination State

CYCLE_ID: PHASE-0-RECON
TURN: PAULO
STATUS: ARCHITECT_APPROVED
AUTHORIZED_SCOPE: PHASE_0_RECON_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: YES
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

## Claude handoff rule

When the currently authorized implementation/reconnaissance cycle is complete, Claude must:

1. Update `coordination/IMPLEMENTER_HANDOFF.md` with factual evidence.
2. Change this file to:
   - `TURN: ARCHITECT`
   - `STATUS: READY_FOR_ARCHITECT`
   - `ARCHITECT_ACTION_REQUIRED: YES`
   - `IMPLEMENTER_ACTION_REQUIRED: NO`
3. Commit and push both files together to `governance/maisoglabs-v0.1`.
4. Stop.

The branch HEAD commit created by that push is treated as the implementer handoff SHA even if `LAST_IMPLEMENTER_HANDOFF_SHA` has not yet been back-filled.

## Architect review rule

When `STATUS: READY_FOR_ARCHITECT`, the Architect must independently inspect repository evidence and write `coordination/ARCHITECT_REVIEW.md`.

After review, the Architect updates this file to one of:

- `CHANGES_REQUESTED` with `TURN: CLAUDE`, or
- `ARCHITECT_APPROVED` with `TURN: PAULO` when a Paulo gate is required, or
- `PAULO_DECISION_REQUIRED` with `TURN: PAULO`, or
- `BLOCKED` with the appropriate owner.

The Architect must record the exact implementer branch HEAD SHA it reviewed in `LAST_ARCHITECT_REVIEWED_SHA` or in the Architect review evidence when updating state.

## Loop guard

Automatic remediation cycles are capped at `MAX_REMEDIATION_CYCLES`.

If the cap is reached without approval, set:

`STATUS: PAULO_DECISION_REQUIRED`

Do not continue an autonomous implementation/review loop beyond the cap.

## Current gate

Phase 0 repository reconnaissance is architect-approved. No Phase 1 work may begin until Paulo explicitly approves progression to Governance Bootstrap. No admin implementation, website redesign, production deployment, or merge to `main` is authorized.
