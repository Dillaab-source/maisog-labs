# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_WEB_V10_CLEAN
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: D092_V10_CLEAN_REPLACEMENT_PREVIEW_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2
PROTOCOL_VERSION: 2
CURRENT_HANDOFF: NONE
HANDOFF_ID:
REVIEW_TARGET_COMMIT:
APPLICABLE_REVIEW_ID:
CURRENT_DIRECTIVE: ACTIVE
DIRECTIVE_ID: DIR-WEB-V10-CLEAN-0001
DIRECTIVE_ISSUE_PARENT: 146f645390fd24099426c3cb8ab8a511eafb12db
DIRECTIVE_AUTHORITY_REF: D-092
DIRECTIVE_APPLICABLE_REVIEW_ID: ML-DEVOS-AS-119
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-092 records Paulo's explicit instruction to replace the public website presentation with V10 as a controlled clean replacement, with V10 layout/interactions and D-088 facts. It supersedes the pending Architect re-review of `H-WEB-V10-A-REM1-0001`, which is archived unreviewed as evidence.

Rollback point: branch `snapshot/pre-v10-clean-replacement` at `146f645390fd24099426c3cb8ab8a511eafb12db`.

## Selected directive

`DIR-WEB-V10-CLEAN-0001` is transport, not authority. Effective scope is the intersection of this STATE, D-092, D-088 and the directive.

## Builder scope

Replace the public homepage presentation with a faithful V10 implementation, remove superseded frontend code and its obsolete tests, keep `/journal` and `/admin` working, verify locally, and push the return so the existing Workers Builds branch build produces a non-production preview version.

## Hard boundaries

No `worker/**`, `migrations/**`, `wrangler.jsonc`, `package*.json`, `app/admin/**` or `public/**` mutation. No production promotion, traffic shift, rollback, main merge, D1/R2/Access/DNS/secret/environment action, destructive Cloudflare change, D1 or production-data deletion, or governance-history rewrite.

No PR #7 or PR #10 merge. No V2B, V10-B, API-DIAG/API-FIX. No S6/S7. No D-068.

S6 remains parked at ML-DEVOS-AS-103. O1 and O2 remain open.

Only bounded repository mutation is authorized. Every other action-specific flag is `NO`.

## Next transition

Claude/Builder performs the replacement, archives and deselects the directive, clears action flags, and routes `H-WEB-V10-CLEAN-0001` to the Architect. Production promotion is a separate owner decision.
