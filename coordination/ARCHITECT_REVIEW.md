# Architect Review

Status: `DISCOVERY AUTHORIZED — MAISOGLABS SKILLS FOUNDATION V0.1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# Skills Foundation V0.1 — Discovery / Architecture Handoff

Authority:
- Paulo priority directive;
- `D-038`.

## Governing principles

`GOVERNANCE > SKILLS`

`CURRENT AUTHORIZATION > SKILL CAPABILITY`

`CAPABILITY != AUTHORITY`

Skills never grant or alter:
- authorized scope;
- tool permissions;
- credentials;
- deployment rights;
- protected/main merge authority;
- risk acceptance;
- architecture authority;
- frozen/baseline status.

Before any future mutating skill executes, the live state must be read and the requested action must be within `AUTHORIZED_SCOPE`. If not: stop, report the scope conflict, and do not mutate.

## S3 disposition

S3 — Typed Task Contracts is now:

`PAUSED / QUEUED — AUTHORITY PRESERVED`

Preserve unchanged:
- `ML-DEVOS-RFC-013`;
- `ML-DEVOS-AS-038`;
- `D-037`.

No S3 implementation is authorized during this discovery cycle.

Live repository inspection before this transition confirmed:
- governance branch had zero implementation commits after S3 activation;
- `devos/contracts/` contained only its pre-existing README;
- pausing therefore creates no abandoned implementation diff.

## Discovery objective

Determine the smallest coherent, provider-portable, governance-safe MaisogLabs Skill System without building executable skills yet.

## Existing reusable procedures that MUST be inspected before proposing skills

At minimum:
- `AGENTS.md`;
- `CLAUDE.md`;
- `brain/00_HOME.md`;
- `brain/protocols/ARCHITECT_SYNC.md`;
- `brain/ARCHITECT_HANDOFF.md`;
- `brain/GOVERNANCE_MAP.md`;
- `brain/IMPLEMENTATION_STATUS.md`;
- `brain/RISK_REGISTER.md`;
- `brain/TEST_LEDGER.md`;
- `coordination/`;
- `devos/templates/`;
- `devos/handoffs/`;
- `devos/governance/`;
- `devos/governance/traceability/`;
- release-readiness and design-governance records;
- research/documentation/public-private procedures and reusable checklists.

Do not duplicate an existing procedure merely to rename it a skill.

## External/provider skill conventions to compare

Discovery must consider current, evidence-backed conventions such as:
- canonical `SKILL.md` plus optional `references/`, `scripts/`, `assets/`, `evals/`;
- progressive disclosure;
- activation/exclusion metadata;
- provider exposure paths such as `.agents/skills/`, `.claude/skills/`, `.github/skills/`, `.codex/skills/` where supported;
- one canonical source of truth rather than provider-specific independent copies.

No provider-adapter directory is authorized to be created in this cycle.

## RFC

Use the next repository RFC ID:
`ML-DEVOS-RFC-014 — MaisogLabs Skills Foundation V0.1 Discovery`

Classify the proposal based on actual findings. The default expectation is `ARCHITECTURE` because the system is cross-cutting, but do not force that classification if repository evidence supports a different one.

The RFC must answer:
1. concrete problem Skills Foundation solves;
2. definition boundary:
   - repeatable procedure → Skill;
   - rule/authority/boundary → Governance;
   - project state → Brain/State;
   - architecture choice → ADR/Architecture;
   - reusable lesson → Knowledge/Principle;
   - technical permission/capability → S5/future technical control;
3. canonical skill location;
4. SKILL CHECK discovery/routing behavior;
5. provider adapter/exposure strategy;
6. smallest coherent initial skill set;
7. overlap/trigger-conflict analysis;
8. external/community skill trust policy;
9. evaluation architecture;
10. progressive disclosure model;
11. traceability integration;
12. relationship to S3 and whether any narrow S3 amendment is actually needed before S3 resumes.

## Candidate areas — not predetermined skill count

Evaluate, merge, split, reject, or replace as evidence supports:
- Architect Review;
- Governance / Traceability Audit;
- Implementation Handoff;
- Project Health;
- Project-State Recovery;
- Research Before Architectural Decisions;
- Knowledge / Realization Capture;
- Public / Private Information Classification.

Every proposed skill must define:
- what it does;
- activation conditions;
- non-activation conditions;
- inputs;
- authoritative sources;
- procedure;
- output;
- stop/escalation conditions;
- governance dependencies.

Avoid overlapping activation triggers.

## External skill security

Default:
`FOUND ONLINE != TRUSTED`

Any proposed adoption process must include:
- instruction review;
- scripts/dependencies review;
- overlap check;
- security/permission assessment;
- provenance/version/pinning strategy;
- required authorization.

Do not install or execute an external/community skill merely because it was discovered.

## Evaluation requirements

At minimum design cases for:
- correct activation;
- missed/incorrect activation;
- overlapping skills;
- governance conflict;
- capability without authority;
- unauthorized scope;
- frozen baseline protection;
- public/private boundary;
- unrelated open-risk handling;
- missing Paulo decision;
- external-skill trust boundary;
- two skills partially matching where only the smallest sufficient set should activate.

## Traceability

Do not create a second traceability system.

Use the existing Sentinel chain conceptually:

`NEED → RFC → ARCHITECT REVIEW → PAULO DECISION → SKILL DEFINITION → EVALUATION → IMPLEMENTATION → EVIDENCE`

Traceability V1 remains the existing integrity mechanism.

## Authorized files/changes

Discovery may create/update only:
- `devos/changes/rfcs/ML-DEVOS-RFC-014.md`;
- normal RFC index/bookkeeping;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`;
- bounded discovery notes only if necessary and clearly non-authoritative.

Do not create `devos/skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`, or `.github/skills/` yet.

## Explicitly not authorized

No:
- executable skill implementation;
- provider-specific skill adapters;
- S3 implementation;
- S4+ mechanisms;
- S5 Capability Gateway;
- product/runtime changes;
- public website changes;
- remote/cloud resources;
- credentials;
- deployment;
- main merge;
- governance weakening;
- frozen-rule mutation;
- automatic installation/execution of external skills.

## Return format

When discovery is complete, Builder must return:
- EXISTING REUSABLE PROCEDURES FOUND
- DUPLICATION / OVERLAP ANALYSIS
- PROPOSED SKILL ARCHITECTURE
- PROPOSED CANONICAL LOCATION
- PROPOSED INITIAL SKILLS
- PROCEDURES NOT CONVERTED TO SKILLS
- SKILL CHECK ROUTING MODEL
- PROVIDER ADAPTER STRATEGY
- GOVERNANCE INTEGRATION
- EXTERNAL SKILL SECURITY MODEL
- EVALUATION STRATEGY
- TRACEABILITY UPDATES
- S3 PAUSE / QUEUE RECORD
- FILES CREATED
- FILES MODIFIED
- OPEN QUESTIONS
- PAULO DECISIONS REQUIRED
- READY FOR ARCHITECT REVIEW

Then set:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

Builder must not self-authorize Skills implementation or S3 resumption.
