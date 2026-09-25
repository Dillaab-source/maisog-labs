# Architect Review — MaisogLabs Website Redesign V1 Implementation
Architect Sync: ML-DEVOS-AS-105
Status: CHANGES_REQUESTED — REMEDIATION CYCLE 1
Review mode: D-076 WEBSITE REDESIGN V1 IMPLEMENTATION REVIEW
Cycle: MAISOGLABS_WEBSITE_REDESIGN_V1_IMPLEMENTATION
Authority: D-076 / ML-DEVOS-AS-104
Reviewed handoff: H-WEB-REDESIGN-V1-IMPL-0001
Implementation base: 0f3ad64e590d3c68acc21eb139b0316aa9c8a869
Implementation tip: c93d7deae1a09eef0de742e0c78dd64313321d06
Current remediation cycle: 0 of 2
Deployment status: NOT AUTHORIZED
## Verdict
`CHANGES_REQUESTED — REMEDIATION CYCLE 1`
The Website Redesign V1 implementation is structurally close to acceptance.
The Architect independently inspected:
- the exact implementation/base ancestry;
- the complete changed-file inventory;
- the live Builder handoff;
- Context Bootstrap handoff-selector semantics;
- `components/site/SpatialShell.js`;
- route/hash derivation;
- Systems relationship derivation;
- Projects presentation;
- Research public-Journal integration;
- Contact behavior;
- keyboard-selection helper;
- WEB-INC-007 integration in `app/DesignRuntime.js`;
- public page composition;
- spatial local-static content/schema;
- focused Website Redesign tests;
- Brand V3 composition updates;
- evidence-manifest claims.
The implementation remains inside the intended frontend/content architecture.
No backend, D1 schema, migration, Worker/authentication, package dependency, remote-resource or S6/S7 expansion was found.
Two bounded findings block acceptance.
## AS105-F001 — Evidence directory contains unauthorized executable/result artifacts
Status:
`OPEN — REMEDIATION REQUIRED`
D-076 explicitly states that:
`docs/product/evidence/website-redesign-v1/**`
may contain desktop/mobile screenshots and a small evidence manifest/readme only.
The implementation commit additionally contains:
- `docs/product/evidence/website-redesign-v1/capture-harness.mjs`
- `docs/product/evidence/website-redesign-v1/interaction-motion-results.json`
Those artifacts exceed the exact D-076 repository evidence boundary.
The fact that the harness is useful does not expand authority.
### Required remediation
Remove both files from the tracked repository:
- `capture-harness.mjs`
- `interaction-motion-results.json`
Do not relocate them to another repository path.
A local, uncommitted browser harness may be used for Builder validation.
The tracked evidence directory after remediation may contain:
- the existing desktop/mobile screenshots;
- one concise README/manifest describing how the screenshots and actor-reported browser checks were produced.
Update the README so it does not claim a committed harness/results JSON remains available.
The Builder may continue reporting the browser check counts/results in the handoff as:
`ACTOR_REPORTED`
No new package dependency is authorized.
## AS105-F002 — Skip link targets inert/hidden Entry while a spatial surface is open
Status:
`OPEN — REMEDIATION REQUIRED`
`SpatialShell` currently renders:
`Skip to content -> #main-content`
for every route.
But when Systems, Projects, Research or Contact is open, the Entry `<main id="main-content">` is intentionally:
- `aria-hidden`;
- `inert`;
- visually hidden.
Therefore the page's skip link points to content the current route has deliberately removed from interaction/accessibility.
This conflicts with D-076's requirement to preserve or improve the skip path and with the AS-104 route-accessibility contract.
### Required remediation
Make the skip destination route-aware.
Required behavior:
- Entry: skip to `#main-content`;
- Systems: skip to the visible Systems content/heading;
- Projects: skip to the visible Projects content/heading;
- Research: skip to the visible Research content/heading;
- Contact: skip to the visible Contact content/heading.
The existing route headings already have deterministic IDs and `tabIndex=-1`; reuse the existing fixed route vocabulary.
Do not add dynamic arbitrary selectors.
Do not add a second navigation system.
Do not widen the routing architecture.
Add a focused regression test showing the skip target is derived only from the fixed current route and never points at hidden Entry when a surface is open.
Builder browser validation must also exercise the skip link from:
- Entry;
- at least one desktop open surface;
- at least one mobile open surface.
The result remains ACTOR_REPORTED pending Architect review.
## Handoff selector review
No selector defect exists.
Context Bootstrap explicitly defines Builder-to-Architect:
`review_target_commit`
as the **parent of the coordination-transition commit**.
The current value:
`0f3ad64e590d3c68acc21eb139b0316aa9c8a869`
therefore correctly identifies the D-076 base / parent of the implementation-return commit.
No remediation is required for the current handoff identity semantics.
## MEDIA_GAP disposition
The reported MEDIA_GAP is not an AS-105 finding.
D-076 explicitly allowed the Builder to use the existing static fallback if the approved Claude media was unavailable and required the gap to be disclosed.
The repository correctly records that:
- `plate-hero-v4.png` is not installed;
- `logo-mark.mp4` is not installed;
- the poster is not installed;
- the existing static environment and canonical SVG identity are being used instead.
Do not generate a substitute during AS-105 remediation.
Do not alter media during this remediation cycle.
The MEDIA_GAP remains owner-visible for a later preview/publish decision.
## Architecture / content assessment
The following implementation choices are accepted for purposes of this remediation:
- Entry plus Systems / Projects / Research / Contact spatial shell;
- fixed hash vocabulary;
- Browser Back/Forward behavior;
- Escape and wordmark return;
- deterministic route focus logic, subject to AS105-F002;
- explicit mobile MENU model;
- six approved Systems disciplines;
- project relationships derived from an explicit exact-match presentation taxonomy rather than invented system dependency claims;
- Projects using only validated repository project data;
- omission of project status/URL/flow where approved data does not exist;
- Research consuming only the existing read-only Journal API;
- no fallback/fake Research content in production code;
- Contact using the repository-approved contact address;
- local-static `spatialContent` kept outside the legacy/D1 content document;
- no D1 schema change;
- fixed WEB-INC-007 managed-route mapping;
- motion-mode derivation;
- parallax/ambient-motion shutdown on open surfaces or hidden documents;
- Brand V3 documentation explicitly disclosing the current MEDIA_GAP.
No additional implementation blocker was found in the inspected source.
## Evidence classification
The Architect independently inspected repository source and governed records.
Builder execution claims remain `ACTOR_REPORTED`, including:
- `npm test` 862/862;
- focused 10/10;
- `npm run build`;
- `git diff --check`;
- validators;
- browser 72/72;
- motion checks;
- screenshot capture.
The Architect did not independently execute the Builder's local environment.
Binary screenshot appearance is therefore not upgraded to independently reproduced visual evidence in AS-105.
## Traceability
The reported traceability validator failure is unchanged from the D-076 base and concerns pre-existing debt.
AS-105 does not authorize traceability-index regeneration because that surface is outside the D-076 website implementation path.
It is not a Website Redesign V1 remediation finding.
## Remediation scope
Remediation Cycle 1 is limited to:
1. AS105-F001 evidence-directory cleanup;
2. AS105-F002 route-aware skip-link repair;
3. directly necessary focused test updates;
4. one directly necessary correction to the Website Redesign accessibility documentation;
5. concise evidence README correction;
6. normal Builder return handoff / coordination records.
No other visual redesign, content change, Brand change or architecture change is authorized.
## No media mutation
Remediation Cycle 1 does not authorize adding or changing Website Redesign media.
The existing MEDIA_GAP remains unchanged.
## Validation required
Run and report:
- focused Website Redesign tests;
- full `npm test`;
- `npm run build`;
- `git diff --check`;
- applicable Context Bootstrap/repository validators.
Also perform an actor-reported browser check showing the skip link reaches visible content on Entry and open spatial surfaces.
No new dependency.
## Return gate
After both findings are corrected:
create a new immutable Builder handoff:
`H-WEB-REDESIGN-V1-REM1-0001`
Do not reuse:
`H-WEB-REDESIGN-V1-IMPL-0001`.
The new handoff must use:
- the published AS-105 transition SHA as `input_base_commit`;
- the published AS-105 transition SHA as `review_target_commit` when the remediation and return coordination transition are one child commit of AS-105;
- `ML-DEVOS-AS-105` as `applicable_review_id`.
Return:
`TURN: ARCHITECT`
`STATUS: READY_FOR_ARCHITECT`
`CURRENT_REMEDIATION_CYCLE: 1`
No deployment follows automatically.
## S6 / external boundaries
S6 remains parked at ML-DEVOS-AS-103.
Do not modify:
- S6;
- S7;
- O1;
- O2;
- execution-driver work;
- Sentinel version/closure;
- suspended D-068 files.
No:
- production deployment;
- production publish;
- remote D1;
- remote R2;
- Worker/auth change;
- migration;
- protected/main merge;
- PR #10 merge.
## Routing
Route:
`TURN: CLAUDE`
`STATUS: CHANGES_REQUESTED`
`AUTHORIZED_SCOPE: D076_AS105_WEBSITE_REDESIGN_V1_REMEDIATION_CYCLE_1_ONLY`
`ARCHITECT_ACTION_REQUIRED: NO`
`IMPLEMENTER_ACTION_REQUIRED: YES`
`PAULO_DECISION_REQUIRED: NO`
`CURRENT_REMEDIATION_CYCLE: 1`
`MAX_REMEDIATION_CYCLES: 2`
Deselect the current handoff.
Set:
`CURRENT_HANDOFF: NONE`
with empty:
`HANDOFF_ID`
`REVIEW_TARGET_COMMIT`
`APPLICABLE_REVIEW_ID`.
Media mutation is not needed and is disabled for this remediation.
All remote-resource, deployment and main-merge flags remain NO.
