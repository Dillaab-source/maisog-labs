# ML-DEVOS-AS-046 — Durable Architect Sync Archive

Status: `CONCLUDED — CHANGES_REQUESTED / REMEDIATION CYCLE 2 SCOPE AMENDMENT`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

## Concluding snapshot

```markdown
# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 DISCOVERY REMEDIATION CYCLE 2 (SUPPLEMENTAL)`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-046 — Supplemental Skills Foundation / Treasury Review

This sync supplements, and does not erase, `ML-DEVOS-AS-045`.

Active blockers are now:
- `AS45-F007` — provider compatibility/evidence correction;
- `AS46-F001` — restricted/secret routing is unsafe in the current public repository;
- `AS46-F002` — per-skill contracts and routing/evaluation safeguards are incomplete.

The branch was verified unchanged since `aa60512f478d1d73f056160451cf8a781bd41581` before this amendment, so widening the remediation scope does not interrupt Builder work already in progress.

## AS46-F001 — BLOCKER — restricted/secret routing cannot target the current repository

Independent GitHub repository inspection confirms:

- repository: `Dillaab-source/maisog-labs`;
- visibility: `public`;
- `private: false`.

RFC-014 currently describes sensitive implementation detail as belonging in "private repository documentation" / ordinary non-public-surfaced repository locations.

That is not a valid privacy boundary for this repository.

A path that is not rendered by the public website can still be publicly readable from a public GitHub repository.

This is exactly the kind of false-confidence failure already represented by `RISK-WEB-013`.

### Required correction

The RFC must distinguish disclosure class from storage authorization.

At minimum:

**PUBLIC_SAFE**
- may be eligible for the public repository / Journal after normal record-specific approval.

**INTERNAL**
- must not be assumed safe in this public repository;
- requires an explicitly authorized destination whose access properties are known.

**RESTRICTED / SECRET**
- must never be written to this public repository;
- must never be embedded in a public Skill, public RFC, public Journal entry, generated index, or ordinary public-repo documentation;
- if no approved private canonical destination exists, the correct outcome is `STOP / DEFER PERSISTENCE`, not "put it in a hidden folder";
- a sanitized PUBLIC_SAFE insight may be persisted separately only if the sensitive implementation detail is removed.

The discovery may propose future destination requirements, but it must not create a private repository, secret store, or new storage system in this cycle.

### Required eval additions

Add Treasury cases proving:
1. a `RESTRICTED` candidate is not persisted anywhere in the current public repository;
2. a `SECRET` candidate stops before persistence when no approved private destination exists;
3. a sensitive experience can produce a separate sanitized `PUBLIC_SAFE` lesson without carrying the restricted detail;
4. a "not served by the website" path is not treated as private merely because it is not rendered publicly.

## AS46-F002 — BLOCKER — four proposed Skills lack complete discovery contracts

The original Skills directive required every proposed Skill to define:
- what it does;
- activation conditions;
- non-activation conditions;
- inputs;
- authoritative sources;
- procedure;
- output;
- stop/escalation conditions;
- governance dependencies.

The revised RFC names the four Skills and gives partial trigger/evaluation examples, but it does not yet provide a complete, inspectable contract for each.

### Required per-skill contract

For each of the four V0.1 candidates, add a compact table or equivalent containing:

1. Skill name
2. Purpose / output
3. Activate when
4. Do not activate when
5. Required inputs/context
6. Authoritative sources
7. Core procedure summary
8. Stop / escalation conditions
9. Governance dependencies
10. Mutation / capability note
11. Positive activation eval
12. Near-miss negative eval

Do not duplicate full authoritative procedures inside RFC-014.

## AS46-F003 — REQUIRED ROUTING SAFEGUARD — make SKILL CHECK sequence explicit

The RFC currently calls SKILL CHECK a documentary convention and states "narrower wins," but the discovery architecture needs an explicit routing order so future provider implementations do not each invent one.

Define a provider-neutral documentary sequence equivalent to:

1. read current `coordination/STATE.md` / authoritative task context when working inside a governed MaisogLabs project;
2. determine whether the user/task request is already sufficiently scoped;
3. discover candidate Skills from metadata only;
4. apply activation and non-activation conditions;
5. choose the **smallest sufficient non-conflicting set**;
6. verify current authorization before any mutating or consequence-bearing step;
7. load full `SKILL.md` only for selected Skills;
8. load deeper references/scripts only when needed;
9. if a Skill conflicts with current governance/authority, stop and surface the conflict;
10. after execution, produce the Skill's defined output/evidence without upgrading status beyond the evidence actually obtained.

This remains documentary/procedural design only—no S4/S5 routing engine is authorized.

### Required routing evals

Include at minimum:
- two Skills match → narrower/smallest sufficient set wins;
- broad Project Orientation does not fire when current context is already sufficient;
- Architect Review does not bypass TURN/authority rules because the request text sounds like a review;
- a Skill exists and the tool is available, but live scope forbids the action → stop;
- a selected Skill's source procedure changed/superseded → Skill must not silently rely on stale copied instructions.

## AS46-F004 — PASS — supplemental AS-043 archival gap is Architect bookkeeping, not Builder remediation

`ML-DEVOS-AS-043.md` was missing from the durable Architect Sync archive.

The Architect is correcting that bookkeeping directly from the historical rolling-review snapshot at:
`eb5194cdbb5bbd6fbdc250e66ec90a972e1e9fd2`.

Claude is not asked to reconstruct or paraphrase this archive.

The Architect Sync index is also being updated to include the recent AS-042 through AS-046 records.

## Preserve prior accepted discovery findings

Do not reopen without new evidence:
- four-skill candidate set;
- Treasury as a lightweight governed routing procedure, not a standalone Skill yet;
- consequence-sensitive external-skill tiers;
- progressive disclosure;
- capture threshold;
- candidate-vs-accepted boundary;
- canonical-destination-first dedup;
- provenance/revalidation;
- anti-bloat metrics;
- S3 remains paused/queued with authority preserved.

## Authorized Remediation Cycle 2 files for Claude

Claude may modify only:
- `devos/changes/rfcs/ML-DEVOS-RFC-014.md`;
- `devos/changes/rfcs/README.md` if its summary changes;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

Required changes now cover:
1. AS45-F007 provider matrix/evidence;
2. AS46-F001 public-repository disclosure/storage boundary;
3. AS46-F002 complete per-skill contracts;
4. AS46-F003 explicit SKILL CHECK routing + routing evals.

## Hard boundaries

No:
- actual Skill implementation;
- Skill/provider-adapter directories;
- Treasury implementation;
- private-repository creation;
- secret-store creation;
- chat-history import/archive;
- provider-memory synchronization;
- S3 implementation/resumption;
- S4+ / S5 capability machinery;
- product/runtime/public-site changes;
- remote resources;
- credentials;
- deployment;
- main merge;
- external-skill installation/execution.

## Verdict

`ML-DEVOS-AS-046: CHANGES_REQUESTED — REMEDIATION CYCLE 2 SCOPE AMENDED`

Return to Architect after all AS45-F007 and AS46-F001/F002/F003 corrections are complete.

```
