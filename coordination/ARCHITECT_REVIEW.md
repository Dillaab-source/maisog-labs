# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 DISCOVERY REMEDIATION CYCLE 1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-042 — Skills Foundation V0.1 Discovery Review

RFC:
- `ML-DEVOS-RFC-014`

Class:
- `ARCHITECTURE`

Authority:
- `D-038`

## Scope / repository inspection

### AS42-F001 — PASS — discovery stayed within authorized scope

Compared against the Architect handoff base `0c69ba2118b50142a3648bb95cba5fcb359a2b27`.

Exactly one Builder commit is present.

Changed paths:
1. `devos/changes/rfcs/ML-DEVOS-RFC-014.md` — new discovery RFC;
2. `devos/changes/rfcs/README.md` — RFC index;
3. `coordination/IMPLEMENTER_HANDOFF.md` — discovery handoff;
4. `coordination/STATE.md` — return to Architect.

No `devos/skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`, `.gemini/skills/`, or `.github/skills/` directory was created.

No executable skill, S3 implementation, S4+, S5 capability mechanism, runtime/product change, remote resource, credential, deployment, or main merge occurred.

## Architectural findings

### AS42-F002 — PASS — Skill/Governance/State/Architecture/Capability separation is sound

The RFC correctly preserves:
- `GOVERNANCE > SKILLS`;
- `CURRENT AUTHORIZATION > SKILL CAPABILITY`;
- `CAPABILITY != AUTHORITY`.

A Skill is correctly treated as non-authoritative procedural packaging, not as:
- a governance rule;
- a live authorization/state record;
- an ADR;
- a credential/tool permission;
- a risk acceptance;
- merge/deploy authority.

This is compatible with the frozen Sentinel architecture.

### AS42-F003 — BLOCKER — canonical location is being frozen before provider exposure is resolved

The RFC proposes `devos/skills/` as the canonical location while simultaneously leaving provider exposure/adapters as an open question.

Those two decisions are coupled.

Current official provider evidence shows materially different discovery behavior:
- GitHub Copilot accepts project skills from `.github/skills/`, `.claude/skills/`, or `.agents/skills/`;
- Gemini CLI accepts `.gemini/skills/` and the interoperable `.agents/skills/` alias;
- OpenAI describes `SKILL.md` as a portable/open-standard skill playbook;
- ChatGPT's currently installed in-product skills are surfaced through the product/plugin skill system rather than by automatically discovering this repository's arbitrary `devos/skills/` path.

Therefore the RFC must not freeze the canonical repository location independently of the exposure model.

#### Required remediation

Add a compact provider-compatibility matrix for the actual target set:
- Claude / Claude Code;
- OpenAI / Codex;
- ChatGPT product skill exposure where materially relevant;
- Gemini CLI;
- GitHub Copilot;
- any other provider only if current evidence exists.

Compare at minimum:
1. `.agents/skills/` as canonical payload where supported;
2. `devos/skills/` as canonical source + generated/thin provider exposure;
3. `devos/skills/` as governance canonical source + provider-native linking/registration without duplicated content.

For each option, assess:
- native discovery;
- duplication/drift risk;
- symlink/platform risk where relevant;
- governance traceability;
- portability;
- maintenance cost;
- compatibility with current Sentinel topology.

Then either:
- make one architecture recommendation with rationale; or
- leave canonical location explicitly `UNRESOLVED — PAULO DECISION REQUIRED` if evidence does not support a safe choice yet.

Do not create any directory in this remediation.

### AS42-F004 — BLOCKER — Knowledge / Realization Capture violates the RFC's own Skill boundary as currently written

The RFC defines a Skill as a thin wrapper around an already-authoritative repeatable procedure.

It then proposes `Knowledge / Realization Capture` as a V0.1 skill while also stating that the procedure is currently unnamed and has never been formally written down.

Observed recurring behavior is useful evidence for a future procedure, but observation alone does not make that procedure authoritative.

A Skill must not become the place where a new governance/knowledge-record procedure is invented.

#### Required remediation

Choose one:

**Option A — preferred for V0.1 minimalism**
- remove Knowledge / Realization Capture from the initial V0.1 skill set;
- record it as a future candidate requiring its own governed procedure definition first.

**Option B**
- classify and govern the underlying knowledge/debt-capture procedure as its own change before making it a Skill.

Do not implement Option B inside this discovery remediation unless the existing change policy clearly permits doing so without expanding scope. Default to Option A.

This likely reduces the V0.1 initial set from five to four skills:
- Governance / Traceability Audit;
- Architect Review / Sync;
- Implementation Handoff;
- Project Orientation / State Recovery.

### AS42-F005 — BLOCKER — external-skill adoption gate is over-broad

The RFC currently says adopting **any** external skill is capability-adjacent and requires the same gate as a comparable capability/tool grant.

That conflicts with Sentinel's consequence-sensitive governance model and the Product directive's wording `authorization where required`.

An external, reference-only Skill containing only reviewed Markdown instructions is not equivalent in consequence to a Skill containing:
- executable scripts;
- hooks;
- tool allowlists/grants;
- dynamic shell/network operations;
- credential use;
- remote writes;
- destructive or mutating procedures.

#### Required remediation

Define risk tiers or an equivalent consequence-based classification.

Minimum distinction:

**REFERENCE-ONLY / PROCEDURAL**
- no scripts;
- no hooks;
- no tool-permission expansion;
- no remote fetch/write;
- no credentials;
- no mutation authority.
- still untrusted until inspected, pinned/provenanced, overlap-checked, and accepted under the appropriate Skills/governance review.

**CAPABILITY-ADJACENT / EXECUTABLE**
- scripts, hooks, dynamic commands, tool grants, remote access, credentials, mutations, or equivalent.
- route through the relevant CAPABILITY/security/Paulo gate.

`FOUND ONLINE != TRUSTED` remains absolute.
`FOUND ONLINE != AUTOMATIC CAPABILITY CHANGE` should also be true.

### AS42-F006 — BLOCKER — current external ecosystem claims need repository-visible source provenance

The RFC makes time-sensitive claims about current provider support and discovery paths.

Those claims materially affect the architecture, but the RFC does not record the evidence basis in a durable, inspectable form.

#### Required remediation

Add a concise `External evidence basis` section or table to RFC-014 containing:
- provider / standard;
- official source name;
- source URL or durable source reference;
- date checked;
- exact architectural claim supported;
- confidence/status (`OFFICIAL`, `COMMUNITY`, `UNVERIFIED`).

Prefer official documentation for provider-discovery behavior.

Do not state that a provider supports the standard or a path unless the cited evidence supports it.

Community/practitioner evidence may be included for operational pain points, but must be labeled as such.

### AS42-F007 — PASS — rejected candidates are correctly conservative

The decision not to create these V0.1 skills is sound:

- `Project Health`: current repository has reporting artifacts but no sufficiently defined, provider-independent canonical procedure for what the percentage/health model means.
- `Research Before Architectural Decisions`: repeated behavior exists, but no canonical procedure exists yet.
- `Public / Private Information Classification`: the underlying publicness risk remains open; wrapping it as a Skill now could create false confidence.

These remain future candidates, not lost ideas.

### AS42-F008 — PASS — S3 does not currently require an architectural amendment

The Skills discovery has not identified a mandatory S3 schema change.

The existing S3 principle that a Task Contract describes already-authorized scope and grants no capability remains compatible with Skills.

A future S3 example may reference a canonical Skill/procedure once Skills V0.1 exists, but that does not require changing S3's authority model.

S3 remains:
`PAUSED / QUEUED — AUTHORITY PRESERVED`

until this discovery architecture is closed.

### AS42-F009 — PASS — evaluation model is directionally correct

The proposed eval categories cover:
- activation/non-activation;
- overlap;
- governance conflict;
- capability without authority;
- frozen baseline;
- missing Paulo decision;
- unrelated open risk;
- external-skill trust;
- smallest sufficient match.

After the V0.1 skill set is corrected, ensure each remaining skill has both positive and near-miss negative cases.

## Architect conclusion

The discovery is strong and useful. The issues above are architecture-definition issues, not implementation failures.

Required remediation is limited to `ML-DEVOS-RFC-014.md`, the RFC index if its summary changes, and normal coordination handoff/state records.

No implementation is authorized.

## Verdict

`ML-DEVOS-AS-042: CHANGES_REQUESTED — DISCOVERY REMEDIATION CYCLE 1`

Blocking findings:
- `AS42-F003` canonical location/exposure coupling;
- `AS42-F004` Knowledge Capture cannot invent its own procedure through a Skill;
- `AS42-F005` external-skill gate must be consequence-sensitive;
- `AS42-F006` external ecosystem claims require durable source provenance.

All other major discovery boundaries pass.

## Return gate

After remediation:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

No Skills implementation or S3 resumption may occur before independent closure.


---

# ML-DEVOS-AS-043 — Portable Knowledge Treasury Discovery Amendment

Status: `DISCOVERY REQUIREMENT ADDED — NO IMPLEMENTATION AUTHORIZED`

Authority:
- `D-039`
- existing `D-038`
- active `ML-DEVOS-AS-042` remediation cycle

This amendment adds a bounded discovery requirement to the current Skills Foundation remediation. It does not replace or weaken any `AS42-*` finding.

## Core architectural principle

`AI ACCOUNTS / CHATS = LABORATORIES`

`GOVERNED REPOSITORY = DURABLE TREASURY`

Provider memory may assist continuity but may never be the sole canonical source for important MaisogLabs knowledge.

## Required classification before capture

For every candidate durable insight, discovery must preserve this classification boundary:

- repeatable procedure → Skill;
- authority / rule / boundary → Governance;
- architecture decision → RFC / ADR / Architecture;
- current project state → Project Brain / STATE;
- reusable engineering lesson → Knowledge / Principle;
- evidence / experiment result → Evidence repository / Test Ledger;
- public-safe realization → Journal candidate;
- sensitive implementation detail → private repository documentation.

Do not convert every conversation into documentation.

Only durable/reusable value qualifies for treasury capture.

## Required treasury workflow to design

`RAW EXPERIENCE`
→ candidate insight detection
→ search existing canonical sources
→ deduplicate
→ classify
→ public/private filter
→ choose canonical destination
→ required human/governance approval
→ persist
→ trace where useful
→ future reuse

The proposed architecture must reduce fragmentation, not create another competing source of truth.

## Required existing-repository survey

Builder must identify which current files already perform treasury-like functions, including at minimum:
- `brain/DECISION_LOG.md`;
- `brain/GOVERNANCE_MAP.md`;
- `brain/RISK_REGISTER.md`;
- `brain/TEST_LEDGER.md`;
- `brain/IMPLEMENTATION_STATUS.md`;
- `brain/00_HOME.md`;
- `devos/changes/rfcs/`;
- `devos/changes/adrs/`;
- `devos/changes/architect-syncs/`;
- `devos/handoffs/`;
- `coordination/` as rolling/non-durable surfaces;
- `devos/governance/traceability/`;
- release-readiness/postmortem/incident-like records if present;
- Journal/public-realization surfaces;
- any existing debt/gap convention such as `TRACE-DEBT-*` / `SENTINEL-MIGRATION-DEBT-*`.

The survey must distinguish durable canonical records from rolling coordination or duplicated descriptive summaries.

## Knowledge Capture question — explicitly unresolved

Remediation must NOT simply restore `Knowledge / Realization Capture` as a V0.1 Skill.

Instead evaluate three options:

### A. Standalone Skill
Allowed only if an already-authoritative repeatable procedure can be identified or independently governed first.

### B. Composed workflow
Knowledge capture may be an orchestration of existing procedures, e.g. Orientation/State Recovery + Governance/Traceability Audit + classification/deduplication, without becoming its own Skill.

### C. Lightweight repository procedure / knowledge-principles layer
A non-Skill procedure may be more appropriate if the job is primarily classification and canonical persistence rather than repeatable task execution.

The RFC must recommend one option with rationale or mark it `PAULO DECISION REQUIRED` if evidence is insufficient.

## Portability requirement

Do not make any provider transcript/export format canonical.

The architecture must work with insight candidates originating from:
- ChatGPT;
- Claude;
- Codex;
- implementation handoffs;
- Architect reviews;
- research;
- test failures;
- incidents/postmortems;
- project journals.

The durable normalized unit should be the retained insight/record, not a provider-specific conversation dump.

## Deduplication requirement

Before persistence, search existing canonical sources.

The proposal must define:
- search order / candidate canonical surfaces;
- how to determine `already recorded`, `needs update`, `new record`, or `evidence/reference only`;
- how to avoid parallel copies;
- how supersession should work when the prior insight changes.

Do not implement a second traceability or indexing system. Reuse Traceability V1 where appropriate.

## Public/private safeguard requirement

Apply:
`PUBLISH THE INSIGHT; PROTECT THE IMPLEMENTATION DETAIL.`

The architecture must explicitly separate reusable/public-safe lessons from:
- secrets;
- credentials;
- private endpoints;
- exploit-enabling security material;
- sensitive infrastructure;
- personal/private information;
- confidential implementation detail.

This discovery does not resolve `RISK-WEB-013` and must not claim that a future Skill or treasury automatically solves repository-level publicness.

## Provenance model to propose

Where useful, retained knowledge should be able to carry:
- source type;
- source/project context;
- date;
- why it matters;
- confidence/evidence class;
- canonical destination;
- related requirement/risk/decision/skill IDs when applicable;
- `supersedes` / `superseded_by` relationship where relevant.

Do not require full-chat retention merely for provenance.

## Minimal treasury evaluation cases

In addition to AS42's Skills evals, design cases for:

1. **Duplicate insight** — existing canonical lesson is found; no competing copy is created.
2. **New evidence, same insight** — attach/reference evidence rather than duplicate the principle.
3. **Procedure masquerading as lesson** — classify into Skill candidate, not Knowledge.
4. **Governance rule masquerading as lesson** — route to Governance/RFC path.
5. **Current state masquerading as durable knowledge** — keep in Brain/STATE.
6. **Sensitive implementation detail with public-safe lesson** — retain private detail privately while producing only the sanitized reusable insight.
7. **Provider portability** — equivalent insight from ChatGPT/Claude/Codex normalizes to the same canonical classification.
8. **Low-value chat noise** — deliberately do not capture.
9. **Superseded insight** — preserve history/supersession without two current canonical truths.
10. **Missing approval** — candidate requiring governance/Paulo approval stops before persistence.

## Required output additions to RFC-014 / handoff

The remediated discovery must explicitly report:

1. existing treasury-like files/functions;
2. current duplication/fragmentation;
3. what remains Project Brain;
4. what belongs in Skills;
5. what belongs in Governance;
6. what deserves Knowledge/Principles treatment;
7. proposed canonical knowledge-capture architecture;
8. ChatGPT/Claude/Codex portability;
9. public/private safeguards;
10. deduplication;
11. provenance;
12. minimal evals;
13. what NOT to build;
14. Paulo decisions required.

## Explicit non-scope

Do not:
- build a giant chat archive;
- scrape/import personal account histories;
- create an automatic transcript ingestion pipeline;
- make provider memory authoritative;
- create a parallel governance system;
- create a parallel traceability system;
- create `devos/memory/` runtime behavior or S11 machinery;
- create a new knowledge database;
- publish private implementation material;
- access external provider accounts to collect chats;
- implement actual Skills;
- resume S3;
- create remote resources;
- deploy;
- merge to main.

## Relationship to AS42 blockers

All existing AS42 blockers remain binding:
- location/exposure coupling;
- Skill must not invent an unauthoritative procedure;
- consequence-sensitive external-skill trust;
- durable external-source provenance.

This amendment expands the discovery question around Knowledge Capture; it does not override `AS42-F004`.

## Return gate

Same as AS42:
- `TURN: ARCHITECT`;
- `STATUS: READY_FOR_ARCHITECT`;
- `ARCHITECT_ACTION_REQUIRED: YES`;
- `IMPLEMENTER_ACTION_REQUIRED: NO`.

Return the revised proposal for independent Architect review.


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
