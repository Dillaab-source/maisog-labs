# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_WEB_HOMEPAGE_ARTIFACT
TURN: CLAUDE
STATUS: AUTHORIZED
AUTHORIZED_SCOPE: D093_HOMEPAGE_ARTIFACT_PREVIEW_ONLY
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
DIRECTIVE_ID: DIR-WEB-HOMEPAGE-ARTIFACT-0001
DIRECTIVE_ISSUE_PARENT: 3a8bb779ddb7ecf6daca2655f0844986c3b81aa8
DIRECTIVE_AUTHORITY_REF: D-093
DIRECTIVE_APPLICABLE_REVIEW_ID: ML-DEVOS-AS-119
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-093 records Paulo's explicit instruction to serve the published Design System artifact (`publish/index.html`, SHA-256 `2417f7e5…9f9`) byte-for-byte as the homepage, preview only. It supersedes the pending review of `H-WEB-V10-CLEAN-0001` (archived unreviewed) and the Architect's Design System reconciliation-analysis request.

Rollback points: `3a8bb779ddb7ecf6daca2655f0844986c3b81aa8` (D-092 homepage) and branch `snapshot/pre-v10-clean-replacement` (`146f645`).

## Selected directive

`DIR-WEB-HOMEPAGE-ARTIFACT-0001` is transport, not authority. Effective scope is the intersection of this STATE, D-093 and the directive.

## Builder scope

Place the artifact byte-identically as the homepage, map its expected media to byte-identical copies of the approved V10 assets, remove only the superseded homepage code, verify locally, and push the return so the existing Workers Builds branch build produces a non-production preview.

## Hard boundaries

The artifact is never edited. No `worker/**`, `migrations/**`, `wrangler.jsonc`, `package*.json`, `app/admin/**`, `app/journal/**` or existing `public/**` mutation. No production promotion, traffic shift, rollback, main merge, D1/R2/Access/DNS/secret/environment action, destructive Cloudflare change, or production-data action.

No PR #7 or PR #10 merge. No V2B, V10-B, API-DIAG/API-FIX. No S6/S7. No D-068.

S6 remains parked at ML-DEVOS-AS-103. O1 and O2 remain open.

Only bounded repository mutation is authorized. Every other action-specific flag is `NO`.

## Next transition

Claude/Builder performs the integration, archives and deselects the directive, clears action flags, and routes `H-WEB-HOMEPAGE-ARTIFACT-0001` to the Architect. Production promotion is a separate owner decision.
