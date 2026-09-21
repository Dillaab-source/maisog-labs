# ML-DEVOS-AS-050 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED / PAULO DECISION REQUIRED`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — RFC-014 DISCOVERY ARCHITECTURE ACCEPTED / PAULO DECISION REQUIRED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-050 — Skills Foundation V0.1 / Portable Knowledge Treasury Final Discovery Review

RFC:
- `ML-DEVOS-RFC-014`

Builder commit reviewed:
- latest Remediation Cycle 3 commit on `governance/maisoglabs-v0.1`

Class:
- `ARCHITECTURE`

Authority chain:
- `D-038`
- `D-039`
- `D-040`
- `D-041`
- `ML-DEVOS-AS-042` through `ML-DEVOS-AS-049`

## Scope

### AS50-F001 — PASS — Cycle 3 stayed within the final bounded remediation

Cycle 3 changed only:
- `devos/changes/rfcs/ML-DEVOS-RFC-014.md`;
- `devos/changes/rfcs/README.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No Skill payload, Skill/provider directory, Treasury implementation, S3 code, S4+/S5 machinery, product/runtime code, remote resource, credential, deployment, or main merge was created.

## Final cleanup findings

### AS50-F002 — PASS — AS49-F006 closed

The top-level classification table no longer treats a non-public-surfaced repository path as a sufficient privacy boundary.

Sensitive implementation detail now routes conditionally under T10 / `ML-DEVOS-AS-048`:
- accepted classification;
- accepted access controls;
- Git suitability;
- authorized canonical destination.

Otherwise:
`STOP / DEFER PERSISTENCE`

`SECRET` / version-control-prohibited material remains excluded from Git.

`RISK-WEB-013` remains open pending separate governed reassessment after `D-041`; this RFC does not silently close it.

### AS50-F003 — PASS — AS49-F007 closed

The External Evidence Basis now records current official OpenAI Skills documentation rather than claiming no official ChatGPT Skills source exists.

The architectural distinction remains correct:
- ChatGPT supports Skills through product/plugin surfaces;
- Codex documents repository-local `.agents/skills/` discovery;
- no cited official evidence establishes arbitrary repository-path scanning by ChatGPT equivalent to Codex.

Therefore ChatGPT remains a separate distribution/integration surface rather than a fifth vote in the repository-path denominator.

### AS50-F004 — PASS — AS49-F008 closed

Cross-references are normalized:
- repository visibility correction → `D-041 / ML-DEVOS-AS-047`;
- access-control clarification/canonicalization → `ML-DEVOS-AS-048`;
- Gemini correction → `AS45-F007` / Cycle 2 remediation.

Historical Architect Sync archives were not rewritten.

## Architecture accepted

### AS50-F005 — PASS — Skill/Governance/Authority boundary

Binding principles remain:

`GOVERNANCE > SKILLS`

`CURRENT AUTHORIZATION > SKILL CAPABILITY`

`CAPABILITY != AUTHORITY`

A Skill is a thin, non-authoritative wrapper around an already-authoritative repeatable procedure.

A Skill never grants:
- scope;
- credentials;
- tool permission;
- remote-resource authority;
- deployment;
- merge;
- risk acceptance;
- architecture authority.

### AS50-F006 — PASS — initial V0.1 Skill set is coherent and bounded

Accepted architecture candidate set:

1. Governance / Traceability Audit
2. Architect Review / Sync
3. Implementation Handoff
4. Project Orientation / State Recovery

Each has:
- purpose/output;
- activation/non-activation;
- required context;
- authoritative sources;
- core procedure;
- stop/escalation;
- governance dependencies;
- mutation/capability note;
- positive and near-miss evals.

Knowledge Capture is not included as a fifth Skill.

### AS50-F007 — PASS — canonical location recommendation is evidence-backed

RFC-014 recommends:

`.agents/skills/`

as the canonical Skill payload location, with one non-diverging Claude Code exposure bridge.

Current evidence supports native `.agents/skills/` discovery for:
- Codex;
- GitHub Copilot;
- Gemini CLI.

Claude Code remains the bridge target.

No provider path may contain independently authored diverging Skill content.

This is an Architect recommendation, not implementation authority. Paulo's explicit ARCHITECTURE decision remains required.

### AS50-F008 — PASS — SKILL CHECK routing architecture is bounded

The 10-step provider-neutral routing model is accepted as documentary/procedural design.

Key invariants:
- metadata-first discovery;
- activation and non-activation conditions;
- smallest sufficient non-conflicting Skill set;
- live authority check before consequence-bearing actions;
- progressive disclosure;
- stop on governance conflict;
- no evidence/status overclaiming.

No S4/S5 runtime router is created.

### AS50-F009 — PASS — external Skill trust model is consequence-sensitive

Accepted architecture:
- reference-only/procedural external Skills → provenance, inspection, overlap check, pinning/review;
- executable/capability-adjacent Skills → applicable capability/security/Paulo gate.

Lifecycle includes revalidation triggers.

`FOUND ONLINE != TRUSTED`

`PREVIOUSLY REVIEWED != TRUSTED FOREVER`

### AS50-F010 — PASS — Portable Knowledge Treasury architecture is coherent

Accepted discovery architecture:

`AI ACCOUNTS / CHATS = LABORATORIES`

`GOVERNED REPOSITORY = DURABLE TREASURY`

Treasury is a selective routing/classification discipline, not a competing store.

Flow:
`RAW EXPERIENCE → CANDIDATE INSIGHT → DEDUPLICATE → CLASSIFY → DISCLOSURE FILTER → CANONICAL DESTINATION → REQUIRED APPROVAL → PERSIST → TRACE → REUSE`

It preserves:
- durable-reuse threshold;
- candidate insight != accepted durable knowledge;
- type + disclosure classification;
- canonical-destination-first dedup;
- DUPLICATE / UPDATE / EVIDENCE_ONLY / NEW / SUPERSEDES outcomes;
- provider-neutral provenance;
- public/private safeguards;
- anti-bloat metrics;
- reuse/application targets.

### AS50-F011 — PASS — Knowledge Capture direction

Architect accepts the RFC's V0.1 direction:

`TREASURY = LIGHTWEIGHT GOVERNED PROCEDURE`

not:

`KNOWLEDGE CAPTURE = STANDALONE SKILL`

A future Skill may wrap that procedure only after it is authoritative, repeatable, and evaluated.

### AS50-F012 — PASS — S3 relationship remains clean

Skills/Treasury discovery did not identify a mandatory S3 authority-model change.

S3 remains:
`PAUSED / QUEUED — AUTHORITY PRESERVED`

Preserved:
- `ML-DEVOS-RFC-013`;
- `ML-DEVOS-AS-038`;
- `D-037`.

No S3 implementation is resumed by this review.

## Open Product / Risk Owner decisions

Architecture review is complete, but RFC-014 is still `DRAFT` and implementation is not authorized.

Paulo must decide explicitly on the architecture before any Builder implementation cycle opens.

### Decision A — RFC-014 architecture acceptance

Accept or reject the Skills Foundation V0.1 + Portable Knowledge Treasury architecture as reviewed in AS-050.

### Decision B — canonical Skill payload

Architect recommendation:
`.agents/skills/` canonical payload
+ one non-diverging Claude Code bridge.

### Decision C — Knowledge Capture/Treasury V0.1 direction

Architect recommendation:
lightweight governed Treasury procedure first; no standalone Knowledge Capture Skill in V0.1.

### Decision D — residual Knowledge/Principles canonical record

RFC-014 identifies a residual class of reusable engineering lessons that has no existing canonical record type.

Decision remains whether/when to authorize a lightweight canonical Knowledge/Principles record and under what governed change.

This is not required to approve the rest of RFC-014 if Paulo chooses to defer it.

### Decision E — RISK-WEB-013 reassessment

Repository visibility changed under `D-041`.

A separate governed reassessment is required before changing the risk's status.

This may be scheduled independently and does not need to block architecture acceptance if Paulo keeps automated public/private routing out of scope.

### Decision F — implementation authorization

Even after architecture acceptance, a separate explicit implementation authorization is required before:
- creating `.agents/skills/`;
- creating any Claude bridge;
- writing the four Skill payloads;
- creating/operationalizing the Treasury procedure;
- creating a Knowledge/Principles record;
- resuming S3.

## Verdict

`ML-DEVOS-AS-050: ARCHITECT_APPROVED — RFC-014 SKILLS FOUNDATION V0.1 / PORTABLE KNOWLEDGE TREASURY DISCOVERY ARCHITECTURE ACCEPTED — PAULO DECISION REQUIRED`

This verdict approves architectural compatibility only.

It grants no implementation, S3 resumption, remote-resource, deployment, main-merge, secret-storage, or external-Skill installation authority.

```
