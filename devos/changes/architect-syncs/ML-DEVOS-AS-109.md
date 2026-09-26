# Architect Review — RFC-020 Stage A Dual-Version Canonical Directive Protocol

Architect Sync: ML-DEVOS-AS-109
Status: CHANGES_REQUESTED — TWO BOUNDED PROTOCOL-HARDENING FINDINGS
Review mode: CHANGE REVIEW / SECURITY-ADJACENT PROTOCOL REVIEW
Cycle: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_STAGE_A_IMPLEMENTATION
Authority: D-079
Design: ML-DEVOS-RFC-020
Prior design review: ML-DEVOS-AS-108
Reviewed handoff: H-RFC020-STAGE-A-0001
Reviewed implementation base: ce2829ab766c29d8c2fd846ec5dc763834a8a4f3
Reviewed implementation / handoff tip: 547a7ac71c7df3ff3a1e6c6d0858bb85274f5325
Live protocol during review: PROTOCOL_VERSION 1
Protocol V2 activation: NOT AUTHORIZED

## Verdict

`CHANGES_REQUESTED`

RFC-020 Stage A is structurally sound and remains within D-079 scope, but two bounded fail-closed issues must be corrected before the Stage A implementation can be accepted for a Paulo Stage B activation decision.

The findings do not reopen the RFC-020 architecture.

No Protocol V2 activation is authorized.

## SENTINEL Sync

Fresh repository state was inspected at:

`547a7ac71c7df3ff3a1e6c6d0858bb85274f5325`

Verified:

- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `AUTHORIZED_SCOPE: D079_RFC020_STAGE_A_DUAL_VERSION_IMPLEMENTATION_ONLY`
- `PROTOCOL_VERSION: 1`
- `CURRENT_HANDOFF: ACTIVE`
- `HANDOFF_ID: H-RFC020-STAGE-A-0001`
- `REVIEW_TARGET_COMMIT: ce2829ab766c29d8c2fd846ec5dc763834a8a4f3`
- `APPLICABLE_REVIEW_ID: ML-DEVOS-AS-108`
- Protocol V2 remains unactivated.
- CURRENT_DIRECTIVE remains inert under live V1.
- The implementation is exactly one commit over the D-079 base.
- The changed-file set is confined to the D-079 / RFC-020 Stage A protocol surface.
- No product/admin/site/runtime/D1/R2/migration/deployment/S6/S7 path changed.

## SU bounded contradiction check

Mode:

`BOUNDED_CONTRADICTION`

Disposition:

`BLOCKED_PENDING_TWO_BOUNDED_FIXES`

The contradiction pass challenged:

- stale-session behavior at protocol cutover;
- directive structural ambiguity;
- V1/V2 selector separation;
- directive/archive atomicity;
- remediation transition behavior;
- authority/reference existence;
- startup-read measurement;
- generated-skill equivalence.

Two implementation-level contradictions were found.

No additional architecture redesign is required.

## Finding AS109-F001 — protocol cutover does not require session-protocol evidence

Severity:

`BLOCKER BEFORE STAGE B`

Current behavior:

`runPublish()` treats a publication as a cutover when `--protocol-cutover` is present.

During such a cutover it intentionally skips comparing the candidate protocol against `--session-protocol`, then checks the parent protocol only if `--session-protocol` was supplied.

Therefore a caller can run:

`--protocol-cutover 1->2`

or:

`--protocol-cutover 2->1`

without supplying any `--session-protocol` value.

The cutover can still pass the cutover-shape checks.

Why this matters:

RFC-020 uses the protocol-version boundary specifically so a stale session must stop and bootstrap fresh.

The protocol cutover is the point where the publishing session's prior protocol knowledge matters most.

Making the session protocol optional at that transition weakens the stale-session contract.

The exact-tip Git parent remains protected, so this is not a branch-freshness failure.

It is a protocol-session freshness gap.

### Required remediation

For any publication where `PROTOCOL_VERSION` changes:

1. `--protocol-cutover <from>-><to>` remains required.
2. `--session-protocol <from>` must also be required.
3. Missing `--session-protocol` must fail before publication.
4. A supplied session protocol different from the parent's protocol must fail closed through the existing stale-session behavior or an equally explicit cutover-session mismatch code.
5. Correct `--session-protocol <from>` plus the correct cutover declaration may proceed to the remaining checks.
6. This applies to both:
   - `1 -> 2` activation;
   - `2 -> 1` forward-recovery rollback.

Recommended explicit failure vocabulary:

`PROTOCOL_CUTOVER_SESSION_REQUIRED`

The exact code name may differ if the same behavior is expressed clearly and deterministically.

### Required tests

Add focused tests proving:

- declared `1->2` with no session protocol fails before push;
- declared `2->1` with no session protocol fails before push;
- `1->2` with session protocol `2` fails;
- `2->1` with session protocol `1` fails;
- `1->2` with session protocol `1` may pass when all other activation conditions pass;
- `2->1` with session protocol `2` may pass when all other rollback conditions pass.

Preserve all existing exact-tip and stale-session tests.

## Finding AS109-F002 — directive required-section validation accepts ambiguous or fenced duplicates

Severity:

`BLOCKER BEFORE STAGE B`

Current behavior:

`checkDirectiveSections()` obtains level-2 headings through `headingsOf()`.

`headingsOf()` places matches into a `Set`.

Consequences:

1. two real sections named `## Instructions` collapse to one set entry and pass;
2. conflicting duplicate `## Stop conditions` sections also pass;
3. `##` headings appearing inside fenced examples are matched by the current regular expression and can satisfy a required-section presence check even when no real directive section exists outside the fence.

Why this matters:

CURRENT_DIRECTIVE exists specifically to replace ambiguous/corrupted large prompt transport with one exact execution packet.

Allowing duplicate or fence-contained pseudo-sections makes the mechanical completeness check weaker than that purpose.

A directive should not be mechanically accepted when its instruction or stop-condition structure is ambiguous.

### Required remediation

Directive required-section validation must be fence-aware and unambiguous.

For CURRENT_DIRECTIVE:

1. ignore headings occurring inside fenced code blocks;
2. require every RFC-020 required directive section to occur as a real level-2 heading outside a fence;
3. require each required directive section exactly once;
4. reject duplicates with a deterministic failure;
5. preserve the intended section names exactly.

Recommended failure vocabulary:

- `MISSING_DIRECTIVE_SECTION`
- `DUPLICATE_DIRECTIVE_SECTION`

The exact duplicate code name may differ if deterministic and clearly tested.

The Builder may:

- introduce a directive-specific heading parser; or
- safely strengthen the shared heading parser,

provided existing V1 CURRENT_HANDOFF behavior is independently regression-tested and not unintentionally broken.

### Required tests

At minimum:

- duplicate `## Instructions` fails;
- duplicate `## Stop conditions` fails;
- a required heading appearing only inside a fenced code block does not satisfy the requirement;
- all ten unique real headings outside fences pass;
- existing V1 handoff section tests remain passing.

## Findings closed by inspection

The following Stage A concerns did not produce blockers:

### File-scope boundary

PASS.

The implementation diff from D-079 base to the reviewed tip is one commit and touches only the RFC-020 Stage A protocol/coordination/test/skill surfaces authorized by D-079.

### Live V1 separation

PASS.

Live STATE remains `PROTOCOL_VERSION: 1`.

No live directive selector is present.

The V1 checker explicitly rejects directive selector fields.

CURRENT_DIRECTIVE is inert scaffolding under V1.

### V2 selector legality

PASS by source inspection, pending the two findings above.

ACTIVE directive selection is restricted to a Builder execution turn with implementation action required.

Directive and handoff cannot be simultaneously selected in normal V2 state.

### Directive identity and issue-parent binding

PASS by source inspection.

The directive identity tuple is bound field-for-field to STATE.

The publishing-parent relationship is checked both at publication and at snapshot validation.

### Authority/review reference posture

PASS within RFC-020's stated mechanical boundary.

The checker proves existence and syntax only and explicitly does not claim authority legitimacy or semantic correctness.

### Directive archival / provenance

PASS by source inspection.

Outgoing selected directive bytes, provenance and index presence are checked.

Conflicting reuse is rejected.

### Builder return / Architect remediation transition shape

PASS by source inspection.

The Stage A code represents the intended directive -> handoff and handoff -> directive transitions atomically.

### V1 non-regression shape

PASS by source inspection.

The change that moves "unsupported protocol" from version 2 to version 3 is expected under dual-version Stage A.

No other V1 semantic change was identified during inspection.

### `--protocol-cutover` concept

APPROVED IN PRINCIPLE.

The Builder's addition of an explicit cutover declaration is a useful mechanical guard and fits RFC-020's separately gated activation/rollback model.

AS109-F001 concerns only the missing mandatory session-protocol binding at that cutover.

### Startup-read target

SUPPORTED BY IMPLEMENTATION LOGIC.

The measurement code explicitly calculates the future V2 declared startup set and compares it against RFC-020's planning baseline.

Builder-reported numerical results remain ACTOR_REPORTED until reproduced in a runnable local environment.

### Generated Skill bridge

No source-level contradiction found.

Builder-reported bridge determinism remains ACTOR_REPORTED pending runnable reproduction.

## Evidence limitations

The GitHub-connected Architect independently inspected:

- the exact live STATE;
- the selected CURRENT_HANDOFF;
- D-079 / RFC-020 / AS-108 authority chain;
- the one-commit file scope;
- the relevant checker functions;
- the focused V2 test source;
- protocol/startup documentation changes.

The Architect environment in this review does not have a network-capable local clone of the repository, so the Builder's reported:

- 33/33 focused tests;
- 56/56 V1 tests;
- 40/40 skill tests;
- 896/896 full tests;
- validator exits;
- exact startup-byte values

remain `ACTOR_REPORTED`, not independently executed.

The findings above arise from direct source inspection and do not depend on trusting those reported test results.

## Remediation scope

Authorize only remediation of:

- `AS109-F001`;
- `AS109-F002`;

and directly necessary tests/documentation wording that must change because of those fixes.

Expected implementation files are limited to:

- `scripts/check-context-bootstrap.mjs`;
- `tests/context-bootstrap-v2.test.mjs`;
- `tests/context-bootstrap.test.mjs` only if directly necessary for V1 regression coverage;
- `brain/protocols/CONTEXT_BOOTSTRAP.md` only if command/cutover wording must be made exact;
- `devos/changes/rfcs/ML-DEVOS-RFC-020.md` only if truthful Stage A status wording requires adjustment;
- normal V1 handoff/STATE/archive evidence files required by the return transition.

Do not broaden into unrelated cleanup.

Do not reduce or bypass existing tests to make remediation pass.

## Protocol / product boundaries

Keep:

`PROTOCOL_VERSION: 1`

Do not activate Protocol V2.

Do not use CURRENT_DIRECTIVE as a live selector.

Do not begin Spatial Design Controls V2A.

Do not modify product/admin/site/runtime code.

Do not touch media, D1/R2, migrations or deployment.

S6 remains parked.

D-068 remains untouched/untracked.

No protected/main merge.

No PR #10 merge.

## Required remediation evidence

Return through the existing Protocol V1 CURRENT_HANDOFF and report:

1. exact remediation base/result SHAs;
2. exact changed files;
3. focused tests for F001;
4. focused tests for F002;
5. full RFC-020 V2 suite;
6. V1 Context Bootstrap regression suite;
7. skill tests if any skill/doc behavior is affected;
8. full applicable repository suite;
9. git diff --check;
10. applicable validators;
11. confirmation live protocol remains V1;
12. confirmation no live directive selector exists;
13. confirmation no product/runtime/S6/D-068 mutation occurred.

## Routing

Route to:

`TURN: CLAUDE`

`STATUS: CHANGES_REQUESTED`

`AUTHORIZED_SCOPE: D079_AS109_RFC020_STAGE_A_REMEDIATION_CYCLE_1_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: YES`

`PAULO_DECISION_REQUIRED: NO`

`CURRENT_REMEDIATION_CYCLE: 1`

`MAX_REMEDIATION_CYCLES: 2`

`PROTOCOL_VERSION: 1`

Deselect the current Builder handoff:

`CURRENT_HANDOFF: NONE`

with empty:

`HANDOFF_ID`

`REVIEW_TARGET_COMMIT`

`APPLICABLE_REVIEW_ID`

Keep:

`MUTATION_AUTHORIZED: YES`

All external / remote / deployment / main-merge authorization flags remain NO.
