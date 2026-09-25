# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_STAGE_A_IMPLEMENTATION
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
AUTHORIZED_SCOPE: D079_RFC020_STAGE_A_DUAL_VERSION_IMPLEMENTATION_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2
PROTOCOL_VERSION: 1
CURRENT_HANDOFF: ACTIVE
HANDOFF_ID: H-RFC020-STAGE-A-0001
REVIEW_TARGET_COMMIT: ce2829ab766c29d8c2fd846ec5dc763834a8a4f3
APPLICABLE_REVIEW_ID: ML-DEVOS-AS-108
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: YES
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-079 is the controlling Product / Risk Owner implementation authorization.

ML-DEVOS-RFC-020 is the Architect-approved Canonical Directive / Context Bootstrap V2 architecture proposal.

ML-DEVOS-AS-108 is the controlling Architect design review for Stage A.

## Current objective

Implement:

`RFC-020 STAGE A — DUAL-VERSION CANONICAL DIRECTIVE PROTOCOL IMPLEMENTATION`

while the live repository remains:

`PROTOCOL_VERSION: 1`

Stage A builds and tests V2 support.

Stage A does not activate V2.

## Stage A architecture

Implement only the RFC-020 architecture.

The future transport pair is:

- CURRENT_DIRECTIVE: Owner/Architect -> Builder execution context
- CURRENT_HANDOFF: Builder -> Architect evidence/report

Authority remains separate from both.

CURRENT_DIRECTIVE is not authority.

## Live V1 boundary

During Stage A:

- live STATE remains Protocol Version 1;
- no live CURRENT_DIRECTIVE selector is activated;
- CURRENT_DIRECTIVE scaffolding/template may exist only as V2 support;
- Builder return uses the existing V1 CURRENT_HANDOFF protocol;
- the Stage A handoff returns to the Architect under Protocol Version 1.

Do not perform the `1 -> 2` cutover.

## Authorized implementation paths

Directly necessary changes are permitted only in:

- brain/protocols/CONTEXT_BOOTSTRAP.md
- brain/protocols/ARCHITECT_SYNC.md
- coordination/README.md
- coordination/CURRENT_DIRECTIVE.md scaffolding/template only
- coordination/archive/directives/**
- scripts/check-context-bootstrap.mjs
- tests/context-bootstrap.test.mjs
- directly necessary coordination/protocol test files
- .agents/skills/project-orientation-state-recovery/**
- .agents/skills/implementation-handoff/**
- .agents/skills/architect-review-sync/**
- one new canonical directive-related Skill only if justified
- deterministically generated .claude/skills/** counterparts
- CLAUDE.md
- AGENTS.md
- brain/00_HOME.md
- brain/PROJECT_GOVERNANCE.md only if directly necessary
- devos/changes/rfcs/ML-DEVOS-RFC-020.md only for truthful Stage A implementation-status/provenance wording
- directly necessary governed coordination/handoff/archive/evidence/test-ledger records.

No other implementation path is authorized.

## Required capabilities to implement/test

At minimum:

1. V1 behavior remains unchanged and passing.
2. V2 Builder state requires ACTIVE CURRENT_DIRECTIVE.
3. ACTIVE directive on a non-Builder turn fails.
4. ACTIVE directive with IMPLEMENTER_ACTION_REQUIRED:NO fails.
5. NONE plus non-empty directive selector fails.
6. STATE/header directive ID mismatch fails.
7. cycle mismatch fails.
8. issue-parent mismatch fails.
9. target-turn mismatch fails.
10. missing authority reference fails.
11. missing applicable review fails.
12. duplicate directive ID with changed bytes fails.
13. missing directive required section fails.
14. invalid SENTINEL disposition fails.
15. invalid SU mode/disposition fails.
16. BLOCKED directive cannot route to Builder.
17. outgoing directive not archived fails.
18. archive byte mismatch fails.
19. archive provenance mismatch fails.
20. Builder return can atomically deselect/archive directive and select CURRENT_HANDOFF.
21. remediation can atomically deselect handoff and select a new directive.
22. protocol mismatch causes stale-session stop.
23. exact-tip publication remains intact.
24. canonical skill bridge generation remains deterministic.
25. startup/read baseline is measured before/after.

## SENTINEL / SU semantics

Implement the fixed mechanical representation from RFC-020.

Do not encode SENTINEL or SU as authority.

Default SU mode in the future protocol is:

`BOUNDED_CONTRADICTION`

Escalated mode is:

`ESCALATED_RESEARCH`

The checker validates fixed vocabulary/coherence only.

It does not prove reasoning quality.

## Token-efficiency evidence

RFC-020 planning baseline:

approximately `85,625 bytes`

for the currently declared ordinary Claude mandatory startup set excluding conditional CURRENT_HANDOFF.

Measure the Stage A result for the future ordinary V2 Builder path.

Target:

at least 50% reduction without deleting safety-critical checks.

Record the actual result whether or not the target is met.

## Canonical/generated skill rule

Modify `.agents/skills/**` canonical sources first.

Regenerate `.claude/skills/**`.

Do not hand-edit generated bridges independently.

Verify equivalence/determinism.

## Required validation

Run all directly applicable tests/checks, including:

- RFC-020 focused Context Bootstrap tests;
- existing Context Bootstrap V1 regression tests;
- skill tests;
- full applicable repository test suite;
- git diff --check;
- applicable governance/manifest/task/rules/waiver validators;
- deterministic skill bridge regeneration/check;
- startup-read measurement.

If build is not applicable because no product/runtime source changed, disclose that rather than fabricating build evidence.

## Return gate

When Stage A implementation is complete:

publish a normal Protocol V1 Builder handoff.

Route to:

TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
PROTOCOL_VERSION: 1

Select the new CURRENT_HANDOFF using the existing V1 identity tuple.

The handoff must reference:

`coordination/OPERATIVE_OBLIGATIONS.md`

and include every required V1 handoff section.

## Required handoff evidence

Report:

- exact implementation base SHA;
- exact result/return-transition SHA;
- exact changed files;
- focused and full test results;
- V1 non-regression evidence;
- V2 fixture/negative-test evidence;
- directive identity/archive/provenance evidence;
- protocol mismatch/stale-session evidence;
- exact-tip publication regression evidence;
- skill bridge generation/equivalence;
- startup/read bytes before and after;
- unresolved findings or implementation choices;
- confirmation V2 remains unactivated;
- confirmation CURRENT_DIRECTIVE was not used as a live V1 execution selector;
- confirmation no product/admin/site/runtime mutation;
- confirmation S6 and D-068 remained untouched.

Builder evidence remains ACTOR_REPORTED.

## Stage B gate

Protocol V2 activation requires:

1. completed Stage A implementation;
2. independent Architect Stage A review;
3. separate Paulo Stage B activation authorization.

No Stage A artifact can bypass that gate.

## V2A disposition

Spatial Design Controls V2A remains deferred during this cycle.

Do not implement it.

## S6 parked boundary

S6 remains parked at ML-DEVOS-AS-103.

O1 and O2 remain open.

The real execution driver remains unauthorized.

The D-068 local draft remains suspended, untracked and untouchable.

## Hard boundaries

No Protocol V2 activation.
No live CURRENT_DIRECTIVE selection.
No product/admin/site/runtime implementation.
No media mutation.
No D1/R2 mutation.
No migration.
No deployment.
No public cutover.
No S6/S7 work.
No touching/staging/committing/pushing D-068.
No protected/main merge.
No PR #10 merge or auto-merge.

All non-repository/external action flags remain NO.
