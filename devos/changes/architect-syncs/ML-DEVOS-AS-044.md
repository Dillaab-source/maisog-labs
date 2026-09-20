# ML-DEVOS-AS-044 — Durable Architect Sync Archive

Status: `DISCOVERY REQUIREMENT AMENDMENT — NO IMPLEMENTATION AUTHORIZED`

Authority: `D-040`

## Amendment snapshot

```markdown


---

# ML-DEVOS-AS-044 — Research-Informed Skills / Treasury Discovery Amendment

Status: `DISCOVERY REQUIREMENT ADDED — NO IMPLEMENTATION AUTHORIZED`

Authority:
- `D-040`
- `D-039`
- `D-038`
- active `ML-DEVOS-AS-042` remediation cycle

This amendment refines the current discovery architecture. It does not override any prior blocker or authorize implementation.

## A. Treasury is a routing protocol, not a giant store

RFC-014 must model the Portable Knowledge Treasury primarily as a governed workflow that routes durable insight into the correct existing canonical destination.

The Treasury must not become a second canonical home for:
- governance;
- ADRs/RFCs/architecture;
- current Brain/STATE;
- evidence/test results;
- Skills;
- Journal;
- private implementation documentation.

Preferred conceptual flow:

`RAW EXPERIENCE → CANDIDATE INSIGHT → DEDUPLICATE → CLASSIFY → DISCLOSURE FILTER → CANONICAL DESTINATION → REQUIRED APPROVAL → PERSIST → TRACE → REUSE`

## B. Add a durable-reuse capture threshold

Do not capture a conversation item merely because it is interesting.

The proposed procedure must require at least one durable-value reason such as:
- likely recurrence;
- prevents repeated failure;
- changes future engineering/review behavior;
- explains a non-obvious design decision;
- reduces future research/discovery/context-recovery cost;
- materially changes security/risk understanding;
- is needed to reconstruct why the system exists in its current form.

Low-value conversational exhaust remains ephemeral.

## C. Candidate insight vs accepted durable knowledge

Explicitly distinguish:

`CANDIDATE INSIGHT != ACCEPTED DURABLE KNOWLEDGE`

The design must prevent an agent inference, research snippet, or session conclusion from becoming durable truth solely because it was stated.

For low-risk lessons, acceptance may be lightweight.
For governance/architecture/security/material-risk claims, existing evidence and approval requirements continue to apply.

## D. Two-axis classification

Treasury classification must have two independent dimensions.

### Type / destination
- PROCEDURE
- GOVERNANCE
- ARCHITECTURE
- STATE
- PRINCIPLE / ENGINEERING LESSON
- EVIDENCE
- PUBLIC REALIZATION
- PRIVATE IMPLEMENTATION DETAIL

### Disclosure
At minimum propose a bounded vocabulary equivalent to:
- PUBLIC_SAFE
- INTERNAL
- RESTRICTED
- SECRET / DO NOT PLACE IN ORDINARY TREASURY CONTENT

The final vocabulary may differ if existing repository conventions provide a better fit, but type and disclosure must remain distinct.

## E. Canonical-destination-first deduplication

Do not treat every repository file as equally likely canonical truth.

After classification:
1. infer the expected canonical destination;
2. search that destination first;
3. inspect related records/traceability;
4. choose one outcome:
   - `DUPLICATE` — no new canonical record;
   - `UPDATE` — update active canonical record where its record type permits mutation;
   - `EVIDENCE_ONLY` — attach/reference new evidence rather than duplicate the insight;
   - `NEW` — create a new canonical record through its normal governed path;
   - `SUPERSEDES` — create a new current record and preserve supersession/history rather than silently rewriting immutable history.

The design must respect immutable/append-only history for record types such as accepted ADRs where applicable.

## F. Knowledge Capture default direction

The remediation must evaluate all AS-043 options, but the Architect's current research-informed default is:

`V0.1: TREASURY = LIGHTWEIGHT GOVERNED PROCEDURE`

not:

`V0.1: KNOWLEDGE CAPTURE = STANDALONE SKILL`

Rationale:
- the workflow is still being defined;
- a Skill should wrap a stable authoritative procedure rather than become the place that invents it;
- once the Treasury procedure is proven repeatable, a future Skill may wrap it.

Claude may recommend a different outcome only if repository evidence clearly supports it.

## G. Progressive disclosure / instruction-budget rule

RFC-014 must add a skill-content principle:

- `SKILL.md` = activation/routing contract + core procedure;
- `references/` = deeper procedural/domain knowledge loaded only when needed;
- `scripts/` = executable helpers only when justified and separately reviewed;
- `assets/` = non-executable templates/resources;
- `evals/` = activation/non-activation/behavior tests.

Avoid monolithic Skills that duplicate whole governance manuals.

## H. Initial V0.1 skill-set default

Unless remediation reveals stronger evidence, the smallest coherent initial implementation candidate remains:

1. Governance / Traceability Audit
2. Architect Review / Sync
3. Implementation Handoff
4. Project Orientation / State Recovery

Keep these as procedure wrappers, not authorities.

Do not re-add Knowledge Capture merely to reach a larger catalog.

## I. Canonical-location/provider-exposure decision remains evidence-gated

AS42-F003 remains binding.

The provider matrix must compare the required options, including `.agents/skills/` as a serious canonical-payload candidate due to current cross-provider adoption.

Do not freeze `devos/skills/` or `.agents/skills/` merely from preference.

If evidence remains mixed, return:
`CANONICAL LOCATION: PAULO DECISION REQUIRED`

with clear tradeoffs.

## J. External-skill lifecycle / revalidation

Extend the AS42-F005 consequence-sensitive external-skill model.

Where external skills are adopted in the future, provenance should support:
- source repository/location;
- exact version/tag/commit;
- adoption date;
- last review date;
- compatibility assumptions/provider/tool versions where relevant;
- revalidation trigger or review-due condition.

Example revalidation triggers:
- upstream skill update;
- major provider/client/tool change;
- dependency change;
- security advisory;
- failed eval;
- unexpected behavior;
- permission/tool-scope change.

`FOUND ONLINE != TRUSTED`
and
`PREVIOUSLY REVIEWED != TRUSTED FOREVER`.

## K. Treasury usefulness / reuse target

Where practical, a retained Knowledge/Principle item should identify its expected application:
- skill improvement;
- checklist;
- test/eval;
- risk control;
- design guideline;
- onboarding/orientation;
- research shortcut/reference;
- public Journal realization;
- other explicit future behavior.

If a candidate has no plausible reuse/application and no reconstruction value, the procedure should be biased toward not capturing it.

## L. Metrics anti-bloat rule

Future Treasury success must not be measured primarily by:
- number of chat snippets captured;
- number of knowledge files;
- number of installed skills;
- raw archive size.

Better future signals include:
- duplicate record avoided;
- existing canonical record reused;
- lesson reused by another project;
- repeated failure prevented;
- skill/checklist/test improved;
- context-recovery time reduced;
- research effort avoided;
- stale/superseded knowledge correctly retired.

No metrics implementation is authorized in this cycle.

## M. Required RFC-014 remediation

Claude must integrate:
- all AS42 blockers;
- all AS43 Treasury requirements;
- sections A–L above;
- durable official-source provenance for current provider claims;
- exact open decisions requiring Paulo.

Then return to Architect.

## Explicit non-scope

Unchanged:
- no Skill implementation;
- no Treasury implementation;
- no chat-history import/archive;
- no provider-memory synchronization;
- no S11;
- no S3 implementation/resumption;
- no provider adapter creation;
- no external-skill installation/execution;
- no product/runtime mutation;
- no remote resource;
- no deployment;
- no main merge.

```
