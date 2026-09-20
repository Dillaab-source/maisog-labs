# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 DISCOVERY REMEDIATION CYCLE 3 (FINAL CONSISTENCY CLEANUP)`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-049 — Skills Foundation / Portable Knowledge Treasury Cycle 2 Review

RFC:
- `ML-DEVOS-RFC-014`

Builder commit reviewed:
- `3760199959d8cc603b0afcf1cde459a87ecb8465`

Base:
- `5f95e7aea3dca6d33a7bd135df81fef49c1ac832`

Class:
- `ARCHITECTURE`

Authority chain:
- `D-038`
- `D-039`
- `D-040`
- `D-041`
- `ML-DEVOS-AS-042` through `ML-DEVOS-AS-048`

## Scope inspection

### AS49-F001 — PASS — Cycle 2 stayed within authorized scope

The Builder changed exactly the four authorized documentation files:

1. `devos/changes/rfcs/ML-DEVOS-RFC-014.md`
2. `devos/changes/rfcs/README.md`
3. `coordination/IMPLEMENTER_HANDOFF.md`
4. `coordination/STATE.md`

No Skill directory, Skill payload, provider adapter, Treasury implementation, S3 code, S4+/S5 machinery, product/runtime code, remote resource, credential, deployment, or main merge was created.

The reported `352/352` test run remains Builder/actor-reported. Because this remediation changed documentation only and no application/test source, no independent runtime reproduction is required for this architecture review.

## Cycle 2 blockers

### AS49-F002 — PASS — AS45-F007 provider matrix corrected

Independent Architect verification against current official documentation confirms:

- OpenAI Codex reads repository Skills from `.agents/skills/`;
- GitHub Copilot supports project Skills at `.github/skills/`, `.claude/skills/`, or `.agents/skills/`;
- Gemini CLI supports `.agents/skills/` as an official workspace/user alias and gives it precedence over `.gemini/skills/` at the same tier;
- Claude Code documents project Skills at `.claude/skills/` and supports symlinked Skill folders.

Therefore the RFC's corrected repo-native accounting — `.agents/skills/` natively covers Codex, Copilot, and Gemini, leaving Claude Code as the one bridge target — is materially supported by current official evidence.

The recommendation:
`.agents/skills/` canonical payload + one non-diverging Claude Code bridge
is architecturally reasonable and remains subject to Paulo's explicit ARCHITECTURE gate.

### AS49-F003 — PASS — AS46-F002 per-Skill contracts complete

All four V0.1 candidate Skills now define:
- purpose/output;
- activation condition;
- non-activation condition;
- required context;
- authoritative sources;
- core procedure summary;
- stop/escalation behavior;
- governance dependencies;
- mutation/capability note;
- positive activation eval;
- near-miss negative eval.

The contracts remain thin wrappers over authoritative procedures rather than duplicate governance manuals.

### AS49-F004 — PASS — AS46-F003 SKILL CHECK routing complete

The RFC now defines a provider-neutral 10-step documentary routing sequence covering:
- live state/context;
- metadata-only discovery;
- activation/non-activation filtering;
- smallest sufficient non-conflicting set;
- authority check before consequence-bearing action;
- progressive disclosure;
- stop on governance conflict;
- bounded output/evidence claims.

The five required routing evals are present.

No S4/S5 routing engine is introduced.

### AS49-F005 — PASS — AS47/AS48 private-repository disclosure model substantially integrated

T10 and T12 correctly distinguish:
- PUBLIC_SAFE;
- INTERNAL;
- RESTRICTED;
- SECRET/version-control-prohibited material.

They correctly require accepted access controls, Git suitability, and an authorized canonical destination for INTERNAL/RESTRICTED persistence, keep secrets/credentials out of Git, preserve historical-public-exposure caution, and do not silently close `RISK-WEB-013`.

## Final consistency blockers

### AS49-F006 — BLOCKER — top-level classification table still contains the superseded blanket private-repository destination

RFC-014 §2 still contains the row:

`Sensitive implementation detail → Private repository documentation (ordinary non-public-surfaced repository locations) → Unchanged`

That wording predates `D-041` / AS-047 / AS-048 and conflicts with T10's now-correct storage model.

A non-public-surfaced path is not, by itself, an accepted storage boundary, and not every sensitive implementation detail is Git-suitable.

#### Required remediation

Replace that row with a compact conditional destination that points to T10/AS-048, equivalent to:

- sensitive implementation detail → private-repository documentation **only if** classification, accepted access controls, Git suitability, and canonical-destination authorization permit it;
- otherwise `STOP / DEFER PERSISTENCE` or route to an approved non-Git private/secret destination when one exists;
- SECRET/version-control-prohibited material never goes to Git.

Also remove the stale implication that `RISK-WEB-013` is still based on the unchanged public-repository premise. State instead that it remains open pending separate governed reassessment after the repository visibility change.

Do not otherwise redesign the classification model.

### AS49-F007 — BLOCKER — ChatGPT evidence-basis row is now stale

The External Evidence Basis currently says:

`No official source found this cycle distinguishing ChatGPT's own product surface from Codex CLI's filesystem-based discovery`

Current official OpenAI documentation now explicitly documents Skills across ChatGPT and Codex:

- standalone Skills are available in the ChatGPT desktop app, Codex CLI, and IDE extension;
- Skills bundled in plugins are available in Chat and Work across ChatGPT web/desktop/mobile;
- ChatGPT and Codex use progressive disclosure;
- Codex repo-local filesystem discovery is specifically documented under `.agents/skills/`.

This official documentation still does **not** establish arbitrary-repository filesystem scanning by ChatGPT product surfaces, so the RFC's architectural separation remains valid. But the durable evidence table must not say no official ChatGPT Skills source exists.

#### Required remediation

Update the ChatGPT row to cite the current official OpenAI Skills documentation, e.g.:
- `https://developers.openai.com/codex/skills` (currently redirects to the current Build Skills documentation);
- record the supported claim narrowly:
  - ChatGPT supports standalone/plugin-distributed Skills as documented;
  - no official evidence in that source establishes arbitrary repository-path discovery equivalent to Codex's `.agents/skills/`;
  - therefore ChatGPT distribution remains a separate product/plugin integration concern and is not part of the repository-path denominator.

This correction does **not** change the 3-of-4 repository-native portability conclusion.

### AS49-F008 — BLOCKER — two canonical cross-references are stale/misattributed

1. T10 still calls the accepted-access-controls clarification "the `AS-047` amendment."  
   The canonicalized clarification is `ML-DEVOS-AS-048`; AS-047 is the repository-visibility correction.

2. `devos/changes/rfcs/README.md` currently says `ML-DEVOS-AS-045 / AS-047` corrected the materially false Gemini CLI claim.  
   AS-047 is unrelated to Gemini. The correction was required by `AS45-F007` and implemented in Builder Cycle 2.

#### Required remediation

Normalize these references without rewriting historical archives:
- visibility change → `D-041 / ML-DEVOS-AS-047`;
- accepted-access-control clarification/canonicalization → `ML-DEVOS-AS-048`;
- Gemini correction → `AS45-F007` / Cycle 2 remediation (not AS-047).

## Preserve accepted architecture

Cycle 3 is cleanup-only. Do **not** reopen without genuinely new evidence:

- the four-skill V0.1 candidate set;
- `.agents/skills/` as the RFC's recommended canonical payload;
- one non-diverging Claude Code bridge concept;
- provider-neutral SKILL CHECK sequence;
- consequence-sensitive external-skill tiers;
- progressive disclosure;
- Treasury-as-routing/lightweight-procedure direction;
- candidate-vs-accepted knowledge boundary;
- type + disclosure model;
- canonical-destination-first dedup;
- provenance/revalidation;
- Treasury evals/anti-bloat model;
- S3 pause/queued authority.

## Authorized Remediation Cycle 3 files

Claude may modify only:

- `devos/changes/rfcs/ML-DEVOS-RFC-014.md`;
- `devos/changes/rfcs/README.md` if needed;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No other file is required.

## Expected return

Cycle 3 should be a small consistency patch, not a redesign.

After remediation:
- `TURN: ARCHITECT`;
- `STATUS: READY_FOR_ARCHITECT`;
- `ARCHITECT_ACTION_REQUIRED: YES`;
- `IMPLEMENTER_ACTION_REQUIRED: NO`;
- `CURRENT_REMEDIATION_CYCLE: 3`.

If AS49-F006/F007/F008 close cleanly, the next Architect review should decide whether RFC-014 is ready for Paulo's explicit architecture decision gate.

## Hard boundaries

No:
- Skill implementation;
- Skill/provider-adapter directories;
- Treasury implementation;
- S3 resumption/implementation;
- S4+ / S5 machinery;
- secret-store creation;
- credential persistence;
- product/runtime mutation;
- remote resources;
- deployment;
- main merge;
- external-skill installation/execution.

## Verdict

`ML-DEVOS-AS-049: CHANGES_REQUESTED — REMEDIATION CYCLE 3 / FINAL CONSISTENCY CLEANUP`
