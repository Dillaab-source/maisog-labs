# MaisogLabs Agent Coordination State
CYCLE_ID: MAISOGLABS_WEBSITE_REDESIGN_V1_IMPLEMENTATION
TURN: CLAUDE
STATUS: CHANGES_REQUESTED
AUTHORIZED_SCOPE: D076_AS105_WEBSITE_REDESIGN_V1_REMEDIATION_CYCLE_1_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 1
MAX_REMEDIATION_CYCLES: 2
PROTOCOL_VERSION: 1
CURRENT_HANDOFF: NONE
HANDOFF_ID:
REVIEW_TARGET_COMMIT:
APPLICABLE_REVIEW_ID:
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO
## Authority
D-076 remains the controlling Product / Risk Owner implementation authorization.
ML-DEVOS-AS-105 is the controlling Architect implementation review.
ML-DEVOS-AS-104 and:
`docs/product/WEBSITE_REDESIGN_V1_PLAN.md`
remain the accepted design references.
AS-105 does not expand D-076.
## Current objective
Perform only Website Redesign V1 Remediation Cycle 1.
Exactly two findings are open:
- AS105-F001 — evidence-directory scope cleanup;
- AS105-F002 — route-aware skip-link repair.
No other redesign or architecture work is authorized.
## AS105-F001
Remove from the tracked repository:
- docs/product/evidence/website-redesign-v1/capture-harness.mjs
- docs/product/evidence/website-redesign-v1/interaction-motion-results.json
Do not move them elsewhere in the repository.
The evidence directory may retain:
- desktop/mobile implementation screenshots;
- one concise README/manifest.
The README may summarize Builder browser results as ACTOR_REPORTED.
A local untracked harness may be used during validation.
## AS105-F002
Repair the global skip path.
Required fixed behavior:
- Entry -> #main-content
- Systems -> visible Systems heading/content
- Projects -> visible Projects heading/content
- Research -> visible Research heading/content
- Contact -> visible Contact heading/content
Do not target Entry while Entry is inert/aria-hidden.
Use only the existing fixed route vocabulary and IDs.
No arbitrary selector or routing capability.
## Authorized remediation writes
Only directly necessary changes in:
- components/site/SpatialShell.js
- tests/website-redesign.test.mjs
- docs/product/UI_UX_SPEC.md
- docs/product/evidence/website-redesign-v1/README.md
and deletion of:
- docs/product/evidence/website-redesign-v1/capture-harness.mjs
- docs/product/evidence/website-redesign-v1/interaction-motion-results.json
plus normal coordination/handoff/archive records required for the return transition.
Do not modify unrelated Website Redesign files.
## Media
MEDIA_MUTATION_AUTHORIZED is NO for this remediation.
Do not add:
- plate-hero-v4.png;
- logo-mark.mp4;
- poster media;
- replacement media.
The existing MEDIA_GAP remains disclosed and unchanged.
## Validation
Run:
- focused Website Redesign tests;
- full npm test;
- npm run build;
- git diff --check;
- applicable repository/context validators.
Actor-reported browser verification must include:
- Entry skip link;
- desktop open-surface skip link;
- mobile open-surface skip link.
The target must be visible and not inert/aria-hidden.
## Evidence
Do not commit browser harness source or generated machine-result JSON.
The existing implementation screenshots may remain unchanged.
The evidence README must disclose:
- browser checks are ACTOR_REPORTED;
- screenshots are actual local implementation screenshots;
- Research screenshots use labelled local fixtures where applicable;
- the browser harness itself is not committed.
## Return handoff
After both AS-105 findings are corrected, create:
`H-WEB-REDESIGN-V1-REM1-0001`
Do not reuse the previous handoff ID.
The new handoff must identify:
- the published AS-105 SHA as `input_base_commit`;
- the published AS-105 SHA as `review_target_commit` if the remediation/return commit is its direct child;
- `ML-DEVOS-AS-105` as `applicable_review_id`;
- exact remediation tip;
- exact changed files;
- exact test commands and exit codes;
- AS105-F001 disposition;
- AS105-F002 disposition;
- browser skip-link evidence;
- unchanged MEDIA_GAP;
- unchanged traceability-debt disclosure.
Then route:
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 1
CURRENT_HANDOFF: ACTIVE
with matching selector fields.
## S6 parked boundary
S6 remains parked at ML-DEVOS-AS-103.
D-068 remains untouched.
No S6/S7 work is authorized.
## Hard boundaries
No broader website redesign.
No public media mutation.
No new dependency.
No D1/R2 mutation.
No migration.
No Worker/auth change.
No deployment.
No public publish.
No arbitrary CSS/JS/HTML capability.
No logo redesign.
No new typography family.
No S6/S7 work.
No protected/main merge.
No PR #10 merge or auto-merge.
All remote-resource, deployment and main-merge flags remain NO.
