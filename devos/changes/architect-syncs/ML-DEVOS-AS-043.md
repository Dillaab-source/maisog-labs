# ML-DEVOS-AS-043 — Durable Architect Sync Archive

Status: `DISCOVERY REQUIREMENT AMENDMENT — NO IMPLEMENTATION AUTHORIZED`

Historical rolling source commit:
- `eb5194cdbb5bbd6fbdc250e66ec90a972e1e9fd2`

## Amendment snapshot

```markdown
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
```
