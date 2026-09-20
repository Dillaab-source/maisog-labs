# Portable Knowledge Treasury Protocol

Authority: `ML-DEVOS-RFC-014` (ACCEPTED) / `ML-DEVOS-AS-050` (ARCHITECT_APPROVED) / `D-039` / `D-040` / `D-041` / `D-042`.

Status: `V0.1 — MANUAL GOVERNED PROCEDURE`. This is a documentary discipline, not a Skill, not a database, not an automated pipeline. `AS-043`/`AS-044`/`D-042` explicitly direct that Knowledge Capture is a lightweight governed procedure in V0.1, not a standalone Skill — it may compose the `governance-traceability-audit` and `project-orientation-state-recovery` Skills as steps, but is not itself packaged as a Skill.

## Core principle

`AI ACCOUNTS / CHATS = LABORATORIES`

`GOVERNED REPOSITORY = DURABLE TREASURY`

Provider memory (ChatGPT, Claude, Codex, or any other) may assist continuity within a session, but is never the sole canonical source for anything MaisogLabs actually needs to remember. This protocol exists to route durable insight from a conversation into an already-existing canonical repository record — it never becomes a second, competing store for content another record type already owns.

## Governed workflow

```
RAW EXPERIENCE
  → CANDIDATE INSIGHT
  → REUSE THRESHOLD
  → CANONICAL-DESTINATION-FIRST SEARCH
  → DEDUPLICATE
  → CLASSIFY TYPE + DISCLOSURE
  → REQUIRED APPROVAL
  → PERSIST
  → TRACE
  → REUSE
```

### 1. Raw experience → candidate insight

Not every conversation item is a candidate. An item becomes a candidate insight only if it has at least one durable-value reason:

- likely recurrence;
- prevents a repeated failure;
- changes future engineering/review behavior;
- explains a non-obvious design decision;
- reduces future research/discovery/context-recovery cost;
- materially changes security/risk understanding;
- is needed to reconstruct why the system exists in its current form.

Low-value conversational exhaust is never captured. If no durable-value reason applies, stop here.

### 2. `CANDIDATE INSIGHT != ACCEPTED DURABLE KNOWLEDGE`

An agent inference, research snippet, or session conclusion never becomes durable truth solely because it was stated. Low-risk lessons (no governance/architecture/security/material-risk weight) may use a lightweight acceptance step. Governance/architecture/security/material-risk-shaped candidates continue to require the same evidence and approval `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` and `devos/governance/EVIDENCE_PROVENANCE_MODEL.md` already require for that record type — this protocol adds a front door, it never lowers the bar behind it.

### 3. Classify — two independent axes, never conflated

**Type / destination:**

| Type | Canonical destination |
|---|---|
| `PROCEDURE` | A Skill candidate — see `.agents/skills/README.md` and the four existing canonical Skills; a new Skill still requires its own governed proposal, this protocol does not create one |
| `GOVERNANCE` | The RFC/Decision path — `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` |
| `ARCHITECTURE` | `devos/changes/rfcs/` / `devos/changes/adrs/` |
| `STATE` | `coordination/STATE.md` / `brain/*.md` (current project state — never this protocol's own persistence) |
| `PRINCIPLE / ENGINEERING LESSON` | `brain/KNOWLEDGE_PRINCIPLES.md` — the one residual destination this protocol may write to directly |
| `EVIDENCE` | `brain/TEST_LEDGER.md` / `brain/RISK_REGISTER.md` |
| `PUBLIC REALIZATION` | The public Journal (`app/journal/`, `worker/public/journal.mjs`, `WEB-INC-006`) via its own normal publish approval — never this protocol bypassing that approval |
| `PRIVATE IMPLEMENTATION DETAIL` | This repository's own storage, **conditionally** — see the disclosure/storage rules below; never a blanket "just put it somewhere private" |

**Disclosure** (independent of type — a lesson can be public-safe while its implementation detail is not):

`PUBLIC_SAFE` · `INTERNAL` · `RESTRICTED` · `SECRET / DO NOT PLACE IN ORDINARY TREASURY CONTENT`

### 4. Canonical-destination-first search and deduplication

Never search the whole repository as an undifferentiated pool. After classifying Type:

1. Infer the expected canonical destination from the Type axis (table above).
2. Search that destination and related cross-references — reuse the existing `governance-traceability-audit` Skill / `devos/governance/traceability/` generated index for ID cross-referencing; never build a second traceability system.
3. Choose exactly one outcome:
   - `DUPLICATE` — an equivalent record already exists; no new record is created.
   - `UPDATE` — the active canonical record's type permits mutation (e.g. a `brain/*.md` status table) and is updated in place.
   - `EVIDENCE_ONLY` — new evidence is attached/referenced against an existing insight, rather than duplicating the insight itself.
   - `NEW` — a new canonical record is created through that record type's own normal governed path (RFC, Decision, Risk Register row, `brain/KNOWLEDGE_PRINCIPLES.md` entry, etc.) — never a Treasury-specific shortcut around that path.
   - `SUPERSEDES` — a new current record is created and the prior one is marked superseded, preserving history rather than silently rewriting it — required wherever the destination's own record type is immutable/append-only once accepted (e.g. an accepted ADR).

### 5. Disclosure/storage rules (`D-041`, `ML-DEVOS-AS-047`, `ML-DEVOS-AS-048`)

This repository is currently private (independently verified: `Dillaab-source/maisog-labs`, `visibility: private`). Private visibility changes the storage question but never the disclosure question, and never retroactively cures any material that may have been exposed during the repository's prior public period.

- **`PUBLIC_SAFE`** — may route to the public Journal only through its normal record-specific publishing approval; may also simply exist in this private repository where its canonical record type belongs here.
- **`INTERNAL`** — may persist in this repository only when its canonical record type genuinely belongs here; being stored here never means it is automatically published.
- **`RESTRICTED`** — may persist in this repository **only when all of the following hold**: the material is appropriate for version-controlled documentation; current repository access controls are an accepted audience boundary for this specific material; it contains no credentials/secret values/private keys; and its canonical destination genuinely belongs in this repository. **If any condition is missing or uncertain: `STOP / DEFER PERSISTENCE`** — route to an explicitly approved non-Git private/secret destination when one exists; never "hide it in a folder" as a substitute for that approval.
- **`SECRET` / version-control-prohibited** — passwords, API tokens, private keys, secret values, credentials, recovery codes, or equivalent — **never** committed to Git, regardless of visibility.
- A path not rendered by any public surface (e.g. not served by the website) is **never**, by itself, treated as an access boundary — "not rendered" and "access-controlled" are not the same property.
- If sensitive material from the repository's prior public period is ever discovered, treat it as potentially exposed and follow the appropriate incident/credential-rotation process — never assume it is safe merely because visibility later changed.

`RISK-WEB-013` (draft/private content exposure in a public Git history) remains open. This protocol does not close it, does not rewrite its status, and must not be represented as having resolved it — repository-level publicness requires its own separate governed reassessment.

### 6. Required approval

A candidate requiring governance/Paulo approval (per its Type's own normal path) stops before persistence. Silence is never treated as approval.

### 7. Persist

Write to the destination the classification (§3) and dedup outcome (§4) actually selected — never to a new, Treasury-owned file for content another record type already owns. The only destination this protocol writes to directly is `brain/KNOWLEDGE_PRINCIPLES.md`, for the residual `PRINCIPLE / ENGINEERING LESSON` case.

### 8. Trace

Where useful, a retained record should carry:

- source type (which AI/session/process it came from);
- source/project context;
- date;
- why it matters (which §1 durable-value reason applied);
- confidence/evidence class — reuse the existing 5-class `devos/governance/EVIDENCE_PROVENANCE_MODEL.md`; no sixth class is invented;
- canonical destination;
- related requirement/risk/decision/skill IDs where applicable;
- `supersedes` / `superseded_by` — reuse the same field convention already used by `core-rules.json` rule records and the ADR template; no new mechanism;
- an **expected reuse/application target** where practical (skill improvement, checklist, test/eval, risk control, design guideline, onboarding/orientation, research shortcut/reference, public Journal realization, or another explicit future behavior).

Full-chat retention is never required merely to satisfy provenance. A candidate with no plausible reuse/application and no reconstruction value is biased toward *not* being captured at all.

### 9. Reuse

The point of persistence is future reuse — by a future session, a future Skill improvement, a future checklist, or a future test. A record that is never consulted again has not achieved this protocol's purpose regardless of how carefully it was classified.

## Provider portability

The durable normalized unit is the **retained insight/record**, never a provider-specific conversation dump. The same classification and destination logic applies identically regardless of whether the candidate originated from ChatGPT, Claude, Codex, an implementation handoff, an Architect review, research, a test failure, an incident/postmortem, or a project journal entry. No provider transcript/export format is ever treated as canonical.

## Anti-bloat metrics

Success is **not** measured by: number of chat snippets captured, number of knowledge files, number of installed Skills, or raw archive size. Better signals: a duplicate record avoided; an existing canonical record reused instead of re-derived; a lesson reused elsewhere; a repeated failure prevented; a Skill/checklist/test actually improved by a captured lesson; context-recovery time reduced; research effort avoided; stale/superseded knowledge correctly retired.

## Explicit non-scope

This protocol does not authorize, and V0.1 does not implement:

- a giant chat archive;
- scraping/importing personal account histories;
- an automatic transcript-ingestion pipeline;
- treating provider memory as authoritative;
- a parallel governance system;
- a parallel traceability/indexing system;
- `devos/memory/` runtime behavior or S11 machinery;
- a new knowledge database or service;
- publishing private implementation material;
- accessing external provider accounts to collect chats;
- resolving `RISK-WEB-013`.

## Evaluation cases (design intent — see `tests/skills.test.mjs`/`tests/knowledge-principles.test.mjs` for any executable form)

1. **Duplicate insight** — an existing canonical lesson is found; no competing copy is created (`DUPLICATE`).
2. **New evidence, same insight** — evidence attached/referenced rather than the principle duplicated (`EVIDENCE_ONLY`).
3. **Procedure masquerading as lesson** — classified `PROCEDURE`, routed to a Skill candidate, not Knowledge.
4. **Governance rule masquerading as lesson** — classified `GOVERNANCE`, routed to the RFC/Decision path.
5. **Current state masquerading as durable knowledge** — classified `STATE`, kept in Brain/STATE, not treasury content.
6. **Sensitive implementation detail with a public-safe lesson** — the private detail stays `RESTRICTED`/`SECRET`; only the sanitized insight is produced as `PUBLIC_SAFE`.
7. **Provider portability** — an equivalent insight from ChatGPT, Claude, or Codex normalizes to the identical classification and destination.
8. **Low-value chat noise** — not captured (fails §1's threshold).
9. **Superseded insight** — history preserved (`SUPERSEDES`), never two competing current truths.
10. **Missing approval** — a candidate requiring governance/Paulo approval stops before persistence.
11. **`INTERNAL`, controls accepted** — routes to the correct canonical record; never automatically published.
12. **`RESTRICTED`, Git-appropriate, controls accepted** — routes to an approved destination.
13. **`RESTRICTED`, Git-inappropriate or controls unaccepted/unknown** — `STOP / DEFER PERSISTENCE`.
14. **`SECRET`/credential item** — never persisted to Git regardless of visibility.
15. **Historical-public-period sensitive finding** — classified as potentially exposed and escalated, never assumed safe because the repository is now private.

## Relationship to Skills

This protocol may compose the `project-orientation-state-recovery` Skill (to establish current context) and the `governance-traceability-audit` Skill (to check existing cross-references) as steps within itself. It is not itself packaged as a Skill in V0.1 (`ML-DEVOS-AS-042` `AS42-F004`, `ML-DEVOS-AS-044` §F) — the workflow above is documented procedure, not an authoritative repeatable task a Skill could safely wrap yet. A future Skill may wrap this protocol once it has actually been used, proven repeatable, and evaluated.
