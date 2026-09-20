# Architect Review

Status: `AUTHORIZED_IMPLEMENTATION — SKILLS FOUNDATION V0.1 + PORTABLE KNOWLEDGE TREASURY`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Builder: Claude  
Working branch: `governance/maisoglabs-v0.1`

---

# Skills Foundation V0.1 Implementation Handoff

Authority:
- `ML-DEVOS-RFC-014 — ACCEPTED`
- `ML-DEVOS-AS-050 — ARCHITECT_APPROVED`
- `D-042 — Paulo architecture acceptance + implementation authorization`

## Objective

Implement the smallest faithful V0.1 of the accepted Skills Foundation and Portable Knowledge Treasury architecture without creating new authority, runtime orchestration, remote capability, or provider-specific drift.

## Authorized outputs

### A. Four canonical Skills under `.agents/skills/`

Implement exactly:

1. Governance / Traceability Audit
2. Architect Review / Sync
3. Implementation Handoff
4. Project Orientation / State Recovery

Each Skill must:
- use `SKILL.md`;
- keep activation/routing + core procedure compact;
- point to authoritative repository sources instead of copying them wholesale;
- state activation and non-activation conditions;
- state inputs/context;
- state outputs;
- state stop/escalation conditions;
- state governance dependencies;
- state mutation/capability posture;
- preserve the positive and near-miss negative eval intent from RFC-014;
- never imply the Skill grants authority.

No fifth Knowledge Capture Skill is authorized.

### B. Claude Code bridge

Create one `.claude/skills/` exposure bridge for the same four canonical Skills.

Requirements:
- canonical source remains `.agents/skills/`;
- no independently authored provider copy;
- use a deterministic generated bridge or equivalently non-diverging mechanism;
- if a generated copy is used, provide a deterministic sync/check mechanism and a test that detects drift;
- if the chosen mechanism is not reliable in this repository's Windows/Git environment, STOP and return to Architect instead of introducing fragile synchronization.

### C. Skill evals / validation

Add focused repository-local validation proving at minimum:
- all four Skills have valid metadata/frontmatter;
- referenced authoritative source paths exist;
- activation/non-activation cases are represented;
- smallest-sufficient routing cases are represented;
- Architect Review respects `TURN`;
- Project Orientation does not over-activate when context is already sufficient;
- a Skill cannot override `AUTHORIZED_SCOPE`;
- no Skill contains a credential/tool-permission grant or independently grants mutation authority;
- Claude bridge cannot silently diverge from canonical payload.

Implementation may add a small deterministic validator/test helper if needed.

Do not build an S4/S5 routing engine.

### D. Portable Knowledge Treasury procedure

Create a lightweight manual governed procedure, preferably:

`brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md`

unless Builder grounding identifies a clearly stronger existing canonical procedure location.

It must implement the accepted workflow:

`RAW EXPERIENCE → CANDIDATE INSIGHT → REUSE THRESHOLD → CANONICAL-DESTINATION-FIRST SEARCH → DEDUPLICATE → CLASSIFY TYPE + DISCLOSURE → REQUIRED APPROVAL → PERSIST → TRACE → REUSE`

It must preserve:
- `CANDIDATE INSIGHT != ACCEPTED DURABLE KNOWLEDGE`;
- outcomes `DUPLICATE / UPDATE / EVIDENCE_ONLY / NEW / SUPERSEDES`;
- provider-neutral source/provenance;
- public/private safeguards;
- no full-chat archival requirement;
- anti-bloat bias;
- reuse/application target;
- STOP/DEFER behavior for unresolved sensitive storage.

No automation that scrapes ChatGPT, Claude, Codex, or account histories is authorized.

### E. Knowledge / Principles canonical record

Create:

`brain/KNOWLEDGE_PRINCIPLES.md`

unless grounding finds an already-existing canonical equivalent.

Purpose:
- residual reusable engineering lessons only;
- not Governance;
- not current STATE;
- not ADR/RFC;
- not evidence/test results;
- not Journal/public copy;
- not secret storage.

Keep the record lightweight.

Do not invent a new formal ID namespace or extend Traceability V1 merely to support this file in V0.1 unless a pre-existing convention already applies cleanly. If a new namespace appears necessary, STOP and return to Architect.

Do not bulk-import historical chats.

### F. Minimal orientation/routing integration

Builder may make narrowly necessary updates to:
- `AGENTS.md`;
- `CLAUDE.md`;
- `brain/00_HOME.md`;
- closely related existing routing/onboarding documentation;

only to expose:
- the `SKILL CHECK` convention;
- canonical Skill location;
- Treasury procedure location;
- authority precedence.

Do not duplicate full Skill or governance bodies into those files.

## Allowed file areas

- `.agents/skills/**`
- `.claude/skills/**`
- `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md`
- `brain/KNOWLEDGE_PRINCIPLES.md`
- focused Skills/Treasury tests and deterministic local helper(s)
- `AGENTS.md`
- `CLAUDE.md`
- `brain/00_HOME.md`
- normal implementation handoff/state/bookkeeping
- `devos/devos-manifest.json` only if an existing manifest field cleanly supports recording the accepted Skill root without schema invention; otherwise leave unchanged and report the gap.

## Explicitly prohibited

No:
- fifth Knowledge Capture Skill;
- independently authored duplicate provider Skills;
- external Skill installation;
- executable external Skill adoption;
- new provider account integration;
- chat scraping/import;
- giant chat archive;
- new database/service;
- S11 memory system;
- S3 implementation during this cycle;
- S4+;
- S5 Capability Gateway;
- product/runtime/public-site mutation;
- remote D1/R2;
- credentials/secrets in Git;
- deployment;
- protected/main merge;
- `RISK-WEB-013` closure.

## Required evidence

Builder handoff must provide:
- exact base/result SHA;
- exact changed-file list;
- exact canonical Skill paths;
- exact Claude bridge strategy;
- proof bridge cannot diverge silently;
- per-Skill activation/non-activation mapping;
- source-reference existence validation;
- focused validator/eval results;
- full existing test-suite sanity result if practical;
- Treasury procedure review against RFC-014 T2–T13;
- confirmation no chat/provider account was scraped/imported;
- confirmation no secrets/credentials were added;
- confirmation no S3/S4+/S5/runtime/remote/deploy/main work occurred;
- limitations/open questions.

## Return gate

After implementation:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

Builder must not self-accept the implementation.

## Sequencing after closure

S3 remains paused during this cycle.

If this V0.1 implementation is independently accepted by Architect with no new blocker, D-042 pre-authorizes the Architect to reopen S3 under preserved `D-037 / ML-DEVOS-AS-038` authority without another Paulo approval.
