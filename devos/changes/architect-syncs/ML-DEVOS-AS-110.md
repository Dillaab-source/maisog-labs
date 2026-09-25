# Architect Review — RFC-020 Stage A Remediation Cycle 1

Architect Sync: ML-DEVOS-AS-110
Status: ARCHITECT_APPROVED — RFC-020 STAGE A ACCEPTED; PAULO STAGE B ACTIVATION DECISION REQUIRED
Review mode: CHANGE REVIEW / PROTOCOL STAGE GATE
Cycle: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_STAGE_A_IMPLEMENTATION
Authority: D-079
Design: ML-DEVOS-RFC-020
Prior reviews: ML-DEVOS-AS-108, ML-DEVOS-AS-109
Reviewed handoff: H-RFC020-STAGE-A-REM1-0001
Reviewed remediation base: e76a197459aae57643cc5fade3a718ec35821978
Accepted Stage A tip: 5ac9a0c5679a032a1ef632c49d038b7d958c9a4e
Live protocol: PROTOCOL_VERSION 1
Protocol V2 activation: NOT AUTHORIZED

## Verdict

`ARCHITECT_APPROVED — RFC-020 STAGE A ACCEPTED; PAULO STAGE B ACTIVATION DECISION REQUIRED`

Stage A is accepted at the bounded implementation boundary.

`AS109-F001` is CLOSED.

`AS109-F002` is CLOSED.

No new Stage A blocker was identified.

Protocol V2 remains unactivated.

## SENTINEL Sync

Fresh repository state was inspected at:

`5ac9a0c5679a032a1ef632c49d038b7d958c9a4e`

Verified:

- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `AUTHORIZED_SCOPE: D079_AS109_RFC020_STAGE_A_REMEDIATION_CYCLE_1_ONLY`
- `CURRENT_REMEDIATION_CYCLE: 1`
- `CURRENT_HANDOFF: ACTIVE`
- `HANDOFF_ID: H-RFC020-STAGE-A-REM1-0001`
- `REVIEW_TARGET_COMMIT: e76a197459aae57643cc5fade3a718ec35821978`
- `APPLICABLE_REVIEW_ID: ML-DEVOS-AS-109`
- `PROTOCOL_VERSION: 1`
- no live directive selector exists;
- CURRENT_DIRECTIVE remains inert scaffolding under V1;
- the remediation is exactly one commit over the AS-109 transition;
- changed-file scope is confined to the authorized remediation surface;
- no product/admin/site/runtime/D1/R2/migration/deployment/S6/S7 path changed.

## SU contradiction / falsification result

Mode:

`ESCALATED_RESEARCH`

Disposition:

`CLEAR`

Because this is a protocol/security-adjacent change, the review included an external contradiction check in addition to repository inspection.

Relevant findings:

- CommonMark requires a closing fenced-code delimiter to use the same character as the opener and be at least as long. The remediation parser follows that model for backtick and tilde fences.
- Established versioning practice treats incompatible interface semantics as a version-boundary concern, supporting RFC-020's separate V1 -> V2 activation model rather than silently changing V1 reader expectations.

External evidence is advisory only and grants no MaisogLabs authority.

## AS109-F001 — CLOSED

Required result:

Any actual change of PROTOCOL_VERSION must require:

1. the correct `--protocol-cutover <from>-><to>`;
2. an explicit `--session-protocol <from>` matching the parent's live protocol.

Observed source behavior:

- `runPublish()` derives `versionChanges` from the actual parent and candidate STATE protocol values, not from whether the optional cutover flag happens to be present.
- on every actual protocol change, it invokes `checkCutoverSession(before, opts.sessionProtocolVersion)`;
- an absent/empty session value fails `PROTOCOL_CUTOVER_SESSION_REQUIRED`;
- a mismatched session value passes through `checkProtocolVersion(before, ...)` and fails `STALE_SESSION_PROTOCOL`;
- `checkProtocolTransition()` independently requires the correct declared cutover direction;
- the same mechanism applies to 1 -> 2 and 2 -> 1.

This closes the cutover-session freshness gap identified in AS-109.

## AS109-F002 — CLOSED

Required result:

Directive section validation must:

- ignore pseudo-headings inside fenced code blocks;
- require each required section outside fences;
- require each required section exactly once;
- reject duplicates deterministically;
- preserve V1 handoff behavior.

Observed source behavior:

- `directiveHeadings()` is directive-specific;
- it tracks backtick/tilde fences and ignores content while a fence is open;
- closing fences must use the same marker type and at least the opening length;
- only real column-level `##` headings outside fences are collected;
- `checkDirectiveSections()` counts headings rather than collapsing them into a Set;
- missing sections fail `MISSING_DIRECTIVE_SECTION`;
- repeated required sections fail `DUPLICATE_DIRECTIVE_SECTION`;
- the V1 CURRENT_HANDOFF parser remains unchanged.

This closes the ambiguity/corrupted-packet gap identified in AS-109.

## Stage A acceptance findings

### Live V1 non-regression boundary

ACCEPTED.

The repository remains `PROTOCOL_VERSION: 1`.

V1 rejects directive-selector fields.

CURRENT_DIRECTIVE is inert under V1.

The Stage A return and remediation both used the existing V1 CURRENT_HANDOFF mechanism.

### V2 directive selector / binding design

ACCEPTED FOR STAGE A.

The implemented V2 machinery provides:

- Builder-only ACTIVE directive selection;
- selector/header identity binding;
- exact issue-parent binding;
- authority/reference existence checks;
- required section validation;
- fixed SENTINEL/SU vocabularies;
- BLOCKED refusal;
- immutable directive IDs;
- directive archive/provenance;
- Builder return directive deselection + CURRENT_HANDOFF;
- Architect remediation handoff deselection + new directive;
- protocol mismatch fail-closed behavior.

### Cutover guard

ACCEPTED.

The Builder-added `--protocol-cutover` mechanism remains within RFC-020's intended activation/rollback boundary.

After AS109-F001, it now requires explicit session binding to the parent protocol.

### Startup/context reduction

ACCEPTED AS STAGE-A EVIDENCE WITH EXECUTION LIMITATION.

The implementation measures the future V2 startup set against RFC-020's planning baseline and reports a reduction greater than the 50% target.

The exact numerical results remain Builder-reported because this Architect environment did not independently execute the local test suite.

This limitation does not block Stage B because the measurement mechanism and declared startup set were independently inspected and no contradictory source evidence was found.

### V1 startup growth

NON-BLOCKING.

Stage A increased the current V1 startup set while carrying dual-version documentation.

That cost disappears from the critical Builder path once V2 is activated and the future read set is used.

It is not a reason to weaken V1 safety checks before activation.

### Traceability debt

UNCHANGED / NON-BLOCKING FOR THIS STAGE.

Existing `CORE-022`, `WEB-REQ-009` and prior traceability DRIFT remain pre-existing debt.

No new traceability regression was identified from the bounded Stage A/remediation scope.

## Evidence classification

Builder-reported:

- focused V2 suite results;
- V1 regression suite results;
- skill suite results;
- full npm test results;
- validator exit results;
- startup byte counts;
- bridge regeneration/determinism.

Architect independently inspected:

- live STATE and handoff routing;
- exact Git commit lineage and changed-file scope;
- F001 cutover-session implementation;
- F002 directive-section implementation;
- relevant V2 selector/binding/transition source;
- focused test source;
- Context Bootstrap wording;
- external parsing/versioning evidence used for falsification.

No claim is made that GitHub source inspection equals local test execution.

## Stage B recommendation

The Architect recommends a separate Paulo owner decision to authorize:

`RFC-020 STAGE B — ATOMIC CONTEXT BOOTSTRAP V2 ACTIVATION`

The activation must remain a separate owner-gated transition.

Recommended activation shape:

1. exact fresh bootstrap on the then-live Protocol V1 tip;
2. a dedicated owner decision for Stage B;
3. one atomic governed activation candidate;
4. `PROTOCOL_VERSION: 1 -> 2`;
5. add the V2 directive selector fields to live STATE;
6. set:
   - `CURRENT_DIRECTIVE: NONE`;
   - empty directive selector values;
7. route activation to a non-Builder gate;
8. publish with:
   - `--protocol-cutover 1->2`;
   - `--session-protocol 1`;
9. fresh-bootstrap with session protocol 2 after publication;
10. independently verify V2 status before issuing the first real CURRENT_DIRECTIVE.

The Stage B activation commit must not also perform product/admin/site/runtime implementation.

The first real V2 Builder directive must occur only after activation verification.

## Stage B remains unauthorized

AS-110 does not authorize:

- PROTOCOL_VERSION 2 activation;
- creation/selection of a real directive;
- Spatial Design Controls V2A implementation;
- product/admin/site/runtime mutation;
- D1/R2/migration/deployment;
- S6/S7 work;
- D-068 mutation;
- protected/main merge;
- PR #10 merge.

## V2A disposition

Spatial Design Controls V2A remains Architect-approved under ML-DEVOS-AS-107.

It remains deferred until the protocol cutover decision is resolved.

## S6 / D-068

S6 remains parked at ML-DEVOS-AS-103.

O1 and O2 remain open.

The real execution driver remains unauthorized.

The suspended D-068 local draft remains untouched/untracked.

## Routing

Route to:

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: D079_RFC020_STAGE_A_ACCEPTED_PAULO_STAGE_B_ACTIVATION_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`

`CURRENT_REMEDIATION_CYCLE: 1`

`MAX_REMEDIATION_CYCLES: 2`

`PROTOCOL_VERSION: 1`

`CURRENT_HANDOFF: NONE`

with empty handoff selector fields.

All action-specific mutation / remote / deployment / main-merge flags remain NO.
