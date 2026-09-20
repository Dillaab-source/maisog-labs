# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 DISCOVERY REMEDIATION CYCLE 2`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-045 — Skills Foundation / Portable Knowledge Treasury Remediation Review 2

RFC:
- `ML-DEVOS-RFC-014`

Class:
- `ARCHITECTURE`

Authority:
- `D-038`
- `D-039`
- `D-040`
- prior reviews/amendments `ML-DEVOS-AS-042`, `ML-DEVOS-AS-043`, `ML-DEVOS-AS-044`

## Scope inspection

### AS45-F001 — PASS — remediation stayed within authorized scope

Compared against Architect amendment base:
`a8170986612fa756a43fac79543d507c8d6919d0`

Exactly one Builder commit is present.

Changed paths:
1. `devos/changes/rfcs/ML-DEVOS-RFC-014.md`
2. `devos/changes/rfcs/README.md`
3. `coordination/IMPLEMENTER_HANDOFF.md`
4. `coordination/STATE.md`

No Skill implementation, Treasury implementation, provider-adapter directory, S3 code, S4+, S5 capability machinery, product/runtime change, remote resource, credential, deployment, or main merge occurred.

## Prior findings

### AS45-F002 — PASS — AS42-F004 remediated

`Knowledge / Realization Capture` has been removed from the V0.1 Skill set.

The Portable Knowledge Treasury is now proposed as a lightweight governed routing/classification procedure first, not a Skill.

This is compatible with the rule that Skills wrap stable authoritative procedures rather than invent them.

### AS45-F003 — PASS — AS42-F005 remediated

External Skill adoption is now consequence-sensitive:

- reference-only/procedural Skills receive instruction/provenance/overlap/security review without automatically becoming a CAPABILITY-class change;
- executable/capability-adjacent Skills with scripts, hooks, dynamic commands, tool grants, remote access, credentials, or mutation behavior route through the applicable CAPABILITY/security/Paulo gate.

The lifecycle also includes revalidation triggers. This is aligned with Sentinel consequence-sensitive governance.

### AS45-F004 — PASS — Portable Knowledge Treasury architecture is bounded correctly

The revised RFC correctly treats Treasury as a routing protocol rather than a competing store.

It includes:
- durable-reuse capture threshold;
- candidate-insight vs accepted-knowledge boundary;
- type + disclosure classification;
- canonical-destination-first dedup outcomes;
- provider-neutral provenance;
- public/private safeguards;
- anti-bloat metrics;
- reuse/application targets;
- explicit no-chat-archive/no-S11/no-parallel-governance boundaries.

No implementation is present.

### AS45-F005 — PASS — initial V0.1 Skill set is appropriately small

Current candidate set:
1. Governance / Traceability Audit
2. Architect Review / Sync
3. Implementation Handoff
4. Project Orientation / State Recovery

Each wraps an existing repository procedure.

No Skill is added merely to increase catalog size.

### AS45-F006 — PASS — progressive-disclosure model is correct

The RFC correctly separates:
- `SKILL.md` activation/routing + core procedure;
- `references/`;
- `scripts/`;
- `assets/`;
- `evals/`.

This avoids instruction bloat and preserves authoritative-source references.

## Blocking finding

### AS45-F007 — BLOCKER — provider compatibility matrix contains a materially false current claim

RFC-014 currently states for Gemini CLI:

- workspace discovery: `.gemini/skills/`
- `.agents/skills/`: `No (not found in official docs)`

That is false as of the current official Gemini CLI documentation.

Independent Architect verification on 2026-09-20 found the official Gemini CLI Agent Skills documentation explicitly states:

- user Skills: `~/.gemini/skills/` **or** `~/.agents/skills/` alias;
- workspace Skills: `.gemini/skills/` **or** `.agents/skills/` alias;
- within the same tier, `.agents/skills/` takes precedence;
- the alias is described as an interoperable path for use across different AI tools.

Official GitHub Copilot documentation independently confirms project Skills may live in:
- `.github/skills/`
- `.claude/skills/`
- `.agents/skills/`

Official OpenAI/Codex documentation confirms repo Skills under:
- `.agents/skills/`

Therefore `.agents/skills/` is currently natively supported by at least:
- OpenAI Codex;
- GitHub Copilot;
- Gemini CLI.

This is materially different from the RFC's current `2 of 5` portability accounting.

The error directly affects the canonical-location tradeoff and therefore blocks architectural acceptance.

## Required remediation

Correct only the evidence/matrix/derived conclusions affected by this finding.

### 1. Correct Gemini official evidence

Update the provider matrix and External Evidence Basis to record current official Gemini support for the `.agents/skills/` alias.

Use official source evidence.

### 2. Recompute portability analysis

Do not continue using the current `2 of 5` statement.

Recompute based on verified current support.

### 3. Separate comparable filesystem/repository clients from non-comparable product surfaces

The current matrix treats the ChatGPT product Skill/plugin surface as an equal "vote" alongside repo-native coding agents even though it does not use the same repository filesystem discovery model.

Revise the analysis into at least:

**Repository/filesystem-native agent clients**
- Claude Code
- Codex
- Gemini CLI
- GitHub Copilot

and separately:

**Product/plugin exposure**
- ChatGPT product Skill/plugin surface

Do not let the lack of arbitrary repository-filesystem discovery in ChatGPT mathematically dilute a repo-path portability decision.

### 4. Re-evaluate the canonical-location conclusion

With the corrected matrix, explicitly compare again:

- `.agents/skills/` canonical payload;
- Sentinel-owned canonical source + deterministic exposure;
- Sentinel-owned canonical source + provider-native linking/registration.

The RFC may still return:
`CANONICAL LOCATION: PAULO DECISION REQUIRED`

but only after the corrected evidence is evaluated.

If one option now clearly dominates for the actual target environment, the RFC should say so and explain why.

### 5. Keep evidence provenance strict

Correct the External Evidence Basis rows so that:
- official claims cite official sources;
- current checked date is retained;
- indirect/search-snippet evidence is not described as stronger than it is;
- unsupported claims remain `UNVERIFIED / GAP` rather than inferred.

## Non-blocking observations

### AS45-O001 — ChatGPT product exposure should remain a separate integration question

This RFC does not need to solve ChatGPT product/plugin distribution to choose the repository Skill canonical location.

Treat ChatGPT product exposure as a later adapter/distribution concern unless an official repository-discovery mechanism is confirmed.

### AS45-O002 — Treasury Paulo decisions remain legitimately open

The following may remain `PAULO DECISION REQUIRED` after this remediation:
- Treasury lightweight-procedure direction;
- whether/when to create a residual Knowledge/Principles canonical record;
- timing of `RISK-WEB-013` remediation;
- Journal editorial-review policy;
- final canonical Skill location if corrected evidence still leaves a genuine tradeoff.

## Verdict

`ML-DEVOS-AS-045: CHANGES_REQUESTED — REMEDIATION CYCLE 2`

Single blocker:
- `AS45-F007` provider compatibility/evidence correction.

All other major Skills Foundation and Portable Knowledge Treasury discovery architecture inspected in this revision passes.

## Return gate

After remediation:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

No Skills implementation, Treasury implementation, provider-adapter creation, or S3 resumption may occur before independent closure.
