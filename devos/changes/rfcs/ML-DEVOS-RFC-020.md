# ML-DEVOS-RFC-020: Canonical Directive Transport / Context Bootstrap V2

Status: `ARCHITECT-APPROVED PROPOSAL (ML-DEVOS-AS-108) — STAGE A IMPLEMENTED UNDER D-079, PENDING ARCHITECT REVIEW; PROTOCOL V2 NOT ACTIVATED`

Stage A implementation provenance (added under `D-079`):
- Dual-version checker support, the inert `coordination/CURRENT_DIRECTIVE.md` scaffolding, the directive archive, tests, protocol documentation and Skills were implemented while live STATE remained `PROTOCOL_VERSION: 1`.
- Stage A implementation evidence is Builder-reported and awaits independent Architect review.
- Protocol V2 activation (Stage B, §21) still requires a separate Paulo decision.
- The text below is the approved proposal, unchanged.

Proposed change class: `ARCHITECTURE`

Authority:
- `D-078` authorizes this planning/design cycle only.
- `ML-DEVOS-AS-108` is the independent Architect review of this proposal.
- No implementation, protocol cutover, deployment, product mutation, S6/S7 work or remote-resource mutation is authorized by this RFC.

Repository-grounded planning tip:

`1ea92e3798dfa2401dfcf95077f4d1fe896bccc8`

## 1. Problem

MaisogLabs has a safe Builder-to-Architect handoff surface (`coordination/CURRENT_HANDOFF.md`) but no equally bounded repository-native Owner/Architect-to-Builder instruction surface.

Large execution briefs are therefore often transported through chat.

That has produced two avoidable problems:

1. exact formatting can be lost in transit, including Markdown fences, bullets and file boundaries;
2. repeated large prompts consume context even when most governing information already exists in the repository.

The solution must not turn an instruction file into a new authority source.

The repository already separates:

- authority;
- context;
- capability;
- execution;
- evidence.

The new mechanism must preserve that separation.

## 2. Decision

Introduce a repository-native rolling directive:

`coordination/CURRENT_DIRECTIVE.md`

Its role is:

`Owner / Architect -> Builder exact execution packet`

The existing:

`coordination/CURRENT_HANDOFF.md`

remains:

`Builder -> Architect evidence/report packet`

`CURRENT_DIRECTIVE.md` is transport/context only.

It may reference authority.

It may never grant, widen, replace or override authority.

## 3. Protocol-version decision

The directive mechanism requires:

`PROTOCOL_VERSION: 2`

at activation.

This is not a cosmetic version bump.

V1 readers are not required to:

- read `CURRENT_DIRECTIVE.md`;
- validate a directive selector;
- archive outgoing directives;
- reject Builder turns without an active directive.

If the repository added those requirements while leaving:

`PROTOCOL_VERSION: 1`

a stale V1 session could correctly believe it understands the active protocol while silently ignoring a now-mandatory execution packet.

That defeats the existing stale-session protection.

Therefore the V2 cutover is intentionally incompatible at the turn-protocol level and must advertise that incompatibility through the protocol marker.

Until the separately authorized activation commit:

`PROTOCOL_VERSION` remains `1`.

## 4. Authority / context / capability separation

### Authority plane

Authority remains in:

- Product / Risk Owner decisions;
- `coordination/STATE.md`;
- immutable Architect Syncs;
- governing RFCs/specifications;
- action-specific authorization flags.

### Context / transport plane

The current execution brief lives in:

- `coordination/CURRENT_DIRECTIVE.md`.

It is selected by STATE.

### Evidence plane

Builder evidence continues through:

- `coordination/CURRENT_HANDOFF.md`;
- test/runtime evidence;
- immutable archives.

### Capability / execution plane

Technical ability to execute an action never implies authority to perform it.

The directive does not create capability.

The presence of a tool does not create authority.

A directive that conflicts with live authority fails closed.

## 5. V2 STATE selector

V2 extends the STATE header with:

```text
CURRENT_DIRECTIVE: ACTIVE | NONE
DIRECTIVE_ID: DIR-...
DIRECTIVE_ISSUE_PARENT: <40-hex>
DIRECTIVE_AUTHORITY_REF: D-...
DIRECTIVE_APPLICABLE_REVIEW_ID: ML-DEVOS-AS-NNN
```

Rules:

1. `CURRENT_DIRECTIVE: ACTIVE` is permitted only when the live turn is a governed Builder execution turn:
   - `TURN: CLAUDE`;
   - `IMPLEMENTER_ACTION_REQUIRED: YES`.
2. A Builder mutation turn under V2 without an ACTIVE directive is fail-closed.
3. `CURRENT_DIRECTIVE: NONE` requires all four directive selector values to be empty.
4. `TURN: ARCHITECT` and `TURN: PAULO` require `CURRENT_DIRECTIVE: NONE`.
5. The existing handoff selector remains independent:
   - a Builder execution turn selects a directive;
   - an Architect review turn may select a handoff;
   - normal V2 operation never selects both simultaneously.
6. The initial V2 proposal does not rename the existing TURN tokens. Provider-neutral role semantics are documented, but a separate role-token migration is outside RFC-020.

## 6. CURRENT_DIRECTIVE machine header

A directive begins with one YAML header:

```yaml
schema_version: 1
directive_id: DIR-<bounded-id>
cycle_id: <cycle-id>
issue_parent_commit: <40-hex>
target_turn: CLAUDE
authority_ref: D-<NNN>
applicable_review_id: ML-DEVOS-AS-<NNN>
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR
```

Allowed shapes:

- `directive_id`: immutable bounded identifier beginning `DIR-`;
- `cycle_id`: exact live STATE cycle;
- `issue_parent_commit`: exact sole parent of the commit that first publishes these directive bytes;
- `target_turn`: `CLAUDE` in the initial V2 implementation;
- `authority_ref`: one primary Product / Risk Owner decision ID;
- `applicable_review_id`: one immutable Architect Sync ID;
- `sentinel_disposition`: `CLEAR` or `BLOCKED`;
- `su_mode`: `BOUNDED_CONTRADICTION` or `ESCALATED_RESEARCH`;
- `su_disposition`: `CLEAR`, `CLEAR_WITH_NOTES` or `BLOCKED`.

The checker verifies syntax, identity binding and allowed values.

It does not prove that the recorded SENTINEL/SU analysis was semantically correct.

## 7. Directive identity binding

STATE and CURRENT_DIRECTIVE form one tuple:

- `directive_id`;
- `cycle_id`;
- `issue_parent_commit`;
- `authority_ref`;
- `applicable_review_id`.

The checker also requires:

`CURRENT_DIRECTIVE.target_turn == STATE.TURN`.

A mismatch in any element fails closed.

### Publication-parent binding

`issue_parent_commit` must equal the sole parent of the commit that first publishes the selected CURRENT_DIRECTIVE bytes.

The directive does not store its own publication commit SHA, avoiding self-reference.

Git supplies the publication commit identity.

The current authoritative tip containing the selected directive is the Builder's execution base.

## 8. Authority references

`authority_ref` is a pointer, not an authorization claim that the checker invents.

The V2 checker may verify mechanically that:

- the named `D-NNN` identifier exists in the decision log at the same snapshot;
- the named Architect Sync exists as the live review or immutable archive;
- the directive's cycle/selector agrees with STATE.

The checker must not claim that:

- the human decision was legitimate;
- the directive body is a correct interpretation of the decision;
- a model/provider identity proves a project role.

Those remain semantic/governance review questions.

## 9. Required directive sections

Every ACTIVE directive must contain:

1. `## Objective`
2. `## Preconditions`
3. `## Governing references`
4. `## Exact execution scope`
5. `## SENTINEL Sync`
6. `## SU Contradiction Check`
7. `## Instructions`
8. `## Validation and evidence`
9. `## Stop conditions`
10. `## Next action`

The directive is delta-based.

It should reference governing artifacts rather than re-copying large specifications.

## 10. Scope intersection rule

The directive's prose is never allowed to widen authority.

Effective execution scope is the intersection of:

1. live STATE authorization;
2. applicable owner decision;
3. applicable Architect review/specification;
4. directive instructions.

If the directive asks for anything outside the first three, the Builder stops and reports the contradiction.

No "most recent prose wins" rule exists.

## 11. SENTINEL requirement

Every governed Builder directive is issued only after a fresh SENTINEL sync at one exact repository snapshot.

The directive records the sync in its required section.

At minimum the sync covers:

- authoritative tip;
- live cycle/turn/status/scope;
- applicable authority chain;
- action-specific flags;
- operative obligations;
- protected boundaries;
- intended changed-file/capability surface;
- contradiction with existing repository state;
- protocol-version/stale-session risk.

`sentinel_disposition: BLOCKED` may not be routed to an ACTIVE Builder directive.

### Builder return boundary

Before returning a CURRENT_HANDOFF, the Builder runs the repository mechanical context/checker validation and reports its results.

The receiving Architect then performs a new independent SENTINEL sync before accepting or remediating the handoff.

Thus both directions of every governed work cycle are checked without pretending the Builder can self-certify independent Architect evidence.

## 12. SU requirement

Every governed execution cycle receives an SU advisory contradiction/falsification check before the Builder directive is activated.

SU never grants authority.

### Default mode

`BOUNDED_CONTRADICTION`

Use repository evidence first.

Challenge at least:

- hidden scope expansion;
- duplicate/redundant capability;
- contradiction with current decisions/specifications;
- unnecessary complexity;
- missing stop condition;
- evidence that does not support the planned claim.

### Escalated mode

Use:

`ESCALATED_RESEARCH`

when one or more triggers are present:

- architecture/protocol/schema change;
- security/auth/capability-boundary widening;
- production/deployment or other high-consequence external action;
- destructive/irreversible operation;
- unresolved authority/evidence conflict;
- material uncertainty not answerable from repository evidence;
- a claim that depends on current external evidence;
- explicit owner request for deeper research/falsification.

Escalation may use multi-source public research or additional independent-model evaluation where available.

It is not mandatory for ordinary mechanical publication or bounded implementation when repository evidence is sufficient.

`su_disposition: BLOCKED` may not be routed to an ACTIVE Builder directive.

## 13. Why SU/SENTINEL results are not authority

The header fields:

- `sentinel_disposition`;
- `su_mode`;
- `su_disposition`

are provenance/status claims attached to the directive.

They do not authorize work.

The checker validates only:

- that the fields exist;
- that their values are from the fixed vocabulary;
- that an ACTIVE directive is not marked BLOCKED.

It cannot prove the quality of the underlying reasoning.

Authority remains external to these fields.

## 14. Directive lifecycle

### Issue

An authorized Owner/Architect transition may publish a new directive and route:

`TURN: CLAUDE`

only if the directive:

- is complete;
- is bound to the exact issue parent;
- references existing authority/review;
- records clear SENTINEL/SU dispositions;
- passes the V2 checker.

### Execute

The Builder:

1. resolves one exact authoritative tip;
2. reads STATE;
3. reads the selected CURRENT_DIRECTIVE from that same tip;
4. runs the checker;
5. retrieves the exact governing references named by the directive only as needed;
6. executes only the bounded scope.

### Return

The Builder's atomic return commit:

- publishes the implementation/evidence;
- publishes CURRENT_HANDOFF;
- sets `TURN: ARCHITECT`;
- sets `CURRENT_DIRECTIVE: NONE`;
- clears directive selector fields;
- archives the outgoing directive byte-for-byte with provenance;
- carries obligations forward.

### Remediation

If the Architect returns bounded remediation:

- mint a new Architect Sync;
- mint a new directive ID;
- publish the remediation directive and STATE `TURN: CLAUDE` atomically;
- archive/deselect the outgoing handoff as required by the existing protocol.

A prior directive ID is never reused with changed bytes.

## 15. Paulo-originated work

Paulo's decision remains the authority artifact.

CURRENT_DIRECTIVE is the execution transport derived from that decision and the applicable Architect review/plan.

The initial V2 design does not create a second "owner directive" authority type.

An owner transition may include a directive in the same atomic commit when:

- Paulo has explicitly authorized the bounded work;
- the directive references that decision;
- the directive is already fully specified by an accepted plan/review;
- all V2 checks pass.

Otherwise the owner transition routes to the Architect to prepare the directive.

In both cases, the directive is transport, not the decision itself.

## 16. Rolling preservation

Every outgoing published directive is preserved unconditionally when it stops being selected, unless its exact bytes are already archived.

Canonical archive:

`coordination/archive/directives/<directive_id>.md`

Provenance:

`coordination/archive/directives/<directive_id>.provenance.json`

The provenance record contains at minimum:

- directive ID;
- publication commit SHA;
- source blob SHA;
- archive blob SHA;
- cycle ID.

Archive entries are immutable.

A duplicate directive ID with different bytes fails closed.

Maintain a discoverable directive archive index.

## 17. V2 checker requirements

Extend `scripts/check-context-bootstrap.mjs` to understand both V1 and V2 during migration.

For V2 it validates at minimum:

- supported protocol version;
- STATE directive-selector shape;
- ACTIVE/NONE legality versus TURN/action-required flags;
- CURRENT_DIRECTIVE header parse;
- field-for-field selector/header binding;
- target-turn equality;
- exact directive publication-parent binding;
- primary authority reference existence;
- applicable immutable review existence;
- required directive sections;
- fixed SENTINEL/SU vocabulary;
- no ACTIVE directive carrying a BLOCKED disposition;
- duplicate-ID changed-byte rejection;
- outgoing directive preservation;
- archive provenance;
- single-parent exact-tip candidate publication;
- existing handoff/review/obligation invariants;
- protocol-version mismatch stop behavior.

The checker explicitly does not prove:

- human authority legitimacy;
- reasoning quality;
- semantic completeness;
- model identity;
- SU independence;
- deployment/external side-effect atomicity.

## 18. V2 transition invariants

Under active V2:

### Builder turn

Required:

- `TURN: CLAUDE`
- `IMPLEMENTER_ACTION_REQUIRED: YES`
- `CURRENT_DIRECTIVE: ACTIVE`
- `CURRENT_HANDOFF: NONE`

### Architect review turn

Required:

- `TURN: ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `CURRENT_DIRECTIVE: NONE`
- `CURRENT_HANDOFF: ACTIVE` when reviewing Builder work, or `NONE` for a pure planning/review turn.

### Paulo decision turn

Required:

- `TURN: PAULO`
- `CURRENT_DIRECTIVE: NONE`
- `CURRENT_HANDOFF: NONE`

unless a separately specified transition is atomically routing out of the Paulo turn.

These invariants prevent CURRENT_DIRECTIVE from becoming a parallel state machine.

## 19. Token/context efficiency

At planning tip `1ea92e3798dfa2401dfcf95077f4d1fe896bccc8`, the files explicitly listed by current `CLAUDE.md` as mandatory first reads, excluding the conditional CURRENT_HANDOFF, total approximately:

`85,625 bytes`

before any task-specific design/RFC files are retrieved.

V2 should change startup behavior from broad preload to small bootstrap + just-in-time retrieval.

### Normal V2 Builder startup target

Read initially:

1. thin provider/role bootstrap guidance;
2. `coordination/STATE.md`;
3. selected `coordination/CURRENT_DIRECTIVE.md`;
4. `coordination/OPERATIVE_OBLIGATIONS.md`;
5. run Context Bootstrap checker.

Then retrieve only governing artifacts named by the directive that are actually required for execution.

Do not preload the full website governance plan, architecture documentation, historical reviews or unrelated specifications merely because they exist.

### Acceptance metric

Before V2 activation, measure actual mandatory startup bytes after implementation.

Target:

at least `50%` reduction from the current 85,625-byte declared baseline for an ordinary Builder turn, while retaining all required safety/authority checks.

Failure to reach 50% is not permission to remove safety-critical context; it is a signal to inspect remaining redundant startup requirements.

## 20. External research grounding

Advisory external evidence used during D-078 planning supports the design direction:

- Anthropic, *Effective context engineering for AI agents* (2025): context is finite; prefer a small high-signal context and just-in-time retrieval using lightweight identifiers such as file paths.
- Anthropic, *Effective harnesses for long-running agents* (2025): long-running agents benefit from durable artifacts that bridge otherwise independent sessions.
- OpenAI, *Orchestration and handoffs*: handoffs are explicit control-transfer mechanisms; short concrete handoff descriptions improve routing clarity.
- OpenAI, *Agent definitions*: downstream agent work benefits from short concrete handoff descriptions and structured/typed outputs.
- Semantic Versioning 2.0.0: incompatible interface changes require a major/version boundary; RFC-020 applies that compatibility principle to the repository protocol marker.
- Git `--force-with-lease=<ref>:<expect>` documents exact expected-value ref protection, matching the existing Context Bootstrap compare-and-swap publication model.
- OWASP Input Validation guidance recommends positive allowlists for fixed structured input vocabularies, consistent with fixed directive header enums.

These sources are advisory evidence, not MaisogLabs authority.

## 21. Implementation staging

A V2 cutover must not be performed in one unreviewed leap.

### Stage A — Dual-version implementation under live Protocol V1

A future owner decision may authorize implementation of V2 support while live STATE remains:

`PROTOCOL_VERSION: 1`

Stage A may implement:

- RFC-020 status updates required by the cycle;
- `coordination/CURRENT_DIRECTIVE.md` format/support scaffolding, but no ACTIVE V2 directive;
- directive archive directory/index/provenance format;
- dual-version checker support;
- context-bootstrap tests for V1 and V2 fixtures;
- protocol documentation;
- coordination README;
- canonical `.agents/skills/**`;
- deterministic regeneration of `.claude/skills/**`;
- thin/dual-mode `CLAUDE.md`, `AGENTS.md` and orientation guidance;
- directly necessary tests/validators.

Stage A must preserve current V1 behavior until independently reviewed.

No production/product capability is part of Stage A.

### Stage A review gate

Architect independently reviews:

- V1 non-regression;
- V2 synthetic/fixture behavior;
- directive identity and archive enforcement;
- stale-session behavior;
- required section enforcement;
- SENTINEL/SU field semantics;
- token/read-set measurements;
- generated bridge equivalence.

Stage A acceptance does not activate V2.

### Stage B — Atomic activation

Requires a separate Paulo activation decision after Stage A acceptance.

One atomic governed activation commit:

- changes `PROTOCOL_VERSION: 1 -> 2`;
- adds the V2 directive selector fields to live STATE with `CURRENT_DIRECTIVE: NONE`;
- updates active bootstrap wording/status to V2 where required;
- contains no unrelated product implementation.

Activation should route to a non-Builder gate (`TURN: PAULO` or `TURN: ARCHITECT`) so no task depends on a directive in the same moment the protocol changes.

The first real V2 Builder directive occurs only after successful activation verification.

## 22. Rollback / forward recovery

V2 rollback is never a branch rewind.

If activation proves defective:

1. stop Builder mutation;
2. route to Paulo through an explicit owner rollback decision;
3. archive any selected directive before deselection;
4. publish a new forward-recovery commit;
5. restore V1 only when the owner decision explicitly authorizes that compatibility rollback;
6. set `CURRENT_DIRECTIVE: NONE`;
7. clear all directive selector fields;
8. preserve all V2 archive/evidence history.

Do not silently let a V1 reader consume a V2 STATE.

If the version marker cannot be interpreted, fail closed.

## 23. Threat / contradiction model

The design explicitly addresses:

### T1 — Chat transport corruption

Mitigation: exact Git bytes are the execution packet.

### T2 — Stale session ignores directive

Mitigation: Protocol V2 marker and mismatch stop.

### T3 — Directive claims more authority than STATE

Mitigation: authority/context separation and scope-intersection rule.

### T4 — Old directive reused after state advances

Mitigation: STATE selector, immutable ID and exact snapshot binding.

### T5 — Directive overwritten without history

Mitigation: unconditional archive + provenance.

### T6 — Fake PASS labels

Mitigation: documented evidence class; checker verifies shape only; Architect remains responsible for semantic review.

### T7 — Excessive SU token usage

Mitigation: bounded contradiction default with explicit escalation triggers.

### T8 — SU or SENTINEL treated as authority

Mitigation: explicit advisory/context classification.

### T9 — Two competing work packets

Mitigation: normal V2 state never selects CURRENT_DIRECTIVE and CURRENT_HANDOFF simultaneously.

### T10 — Protocol implementation breaks V1 before cutover

Mitigation: dual-version Stage A and independent review before Stage B.

### T11 — Generated Claude skills diverge

Mitigation: `.agents/skills/**` canonical-first, generated bridge regenerated and compared.

### T12 — Context cost simply moves into the directive

Mitigation: delta-based directive and measured startup-byte acceptance target.

## 24. Tests required

Future Stage A must add tests for at least:

1. V1 snapshots continue to pass unchanged;
2. V2 Builder turn without ACTIVE directive fails;
3. ACTIVE directive on non-Builder turn fails;
4. ACTIVE directive with `IMPLEMENTER_ACTION_REQUIRED: NO` fails;
5. NONE with non-empty selector fails;
6. selector/header directive ID mismatch fails;
7. cycle mismatch fails;
8. issue-parent mismatch fails;
9. target-turn mismatch fails;
10. missing authority reference fails;
11. missing applicable review fails;
12. duplicate directive ID with different bytes fails;
13. missing required section fails;
14. invalid SENTINEL disposition fails;
15. invalid SU mode/disposition fails;
16. BLOCKED directive cannot route to Builder;
17. outgoing directive not archived fails;
18. archive byte mismatch fails;
19. archive provenance mismatch fails;
20. Builder return can atomically deselect/archive directive and select CURRENT_HANDOFF;
21. remediation can atomically deselect handoff and select a new directive;
22. protocol mismatch causes stale-session stop;
23. exact-tip publication behavior remains intact;
24. canonical skill bridge regeneration is deterministic;
25. declared startup-read baseline is measured before/after.

## 25. Exact future implementation boundary

A future owner Stage A implementation decision may authorize only directly necessary changes in:

- `brain/protocols/CONTEXT_BOOTSTRAP.md`
- `brain/protocols/ARCHITECT_SYNC.md`
- `coordination/README.md`
- `coordination/CURRENT_DIRECTIVE.md` scaffolding/template only
- `coordination/archive/directives/**`
- `scripts/check-context-bootstrap.mjs`
- `tests/context-bootstrap.test.mjs`
- directly necessary coordination/protocol tests
- `.agents/skills/project-orientation-state-recovery/**`
- `.agents/skills/implementation-handoff/**`
- `.agents/skills/architect-review-sync/**`
- a new canonical directive-related Skill only if the final Stage A design demonstrates it is simpler than extending the existing skills
- deterministically generated `.claude/skills/**` counterparts
- `CLAUDE.md`
- `AGENTS.md`
- `brain/00_HOME.md`
- `brain/PROJECT_GOVERNANCE.md` only if directly necessary to keep the protocol map accurate
- RFC/Architect-Sync/decision/coordination records required by the governed cycle.

No product/runtime/site/admin code is part of the protocol implementation.

No:

- S6/S7;
- D-068;
- D1/R2;
- migration;
- deployment;
- public cutover;
- protected/main merge;
- PR #10 merge.

is authorized by this proposal.

## 26. Open implementation questions

The following are implementation-detail questions to resolve in Stage A without changing the architecture:

1. exact directive ID formatting beyond the `DIR-` prefix;
2. whether the directive archive index is generated or manually maintained by the transition code;
3. whether directive required-section checks share parser helpers with CURRENT_HANDOFF or remain separate;
4. exact byte-budget target for a typical directive, beyond the delta-based rule;
5. whether a dedicated canonical Skill reduces or increases duplication versus extending the three existing coordination Skills.

None of these changes the V2 authority model.

## 27. Architect recommendation

`APPROVE RFC-020 FOR PAULO STAGE-A IMPLEMENTATION DECISION`

Recommended sequence:

`D-079 Stage A implementation authorization`

-> `Builder dual-version implementation under PROTOCOL_VERSION 1`

-> `Architect independent Stage A review`

-> `Paulo Stage B activation decision`

-> `atomic PROTOCOL_VERSION 2 activation`

-> `fresh verification`

-> first real `CURRENT_DIRECTIVE` Builder turn.

Spatial Design Controls V2A remains deferred during this protocol work and can resume after the protocol cutover decision is resolved.
