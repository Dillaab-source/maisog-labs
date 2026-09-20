# Knowledge / Principles Ledger

Authority: `ML-DEVOS-RFC-014` (ACCEPTED) / `ML-DEVOS-AS-050` (ARCHITECT_APPROVED) / `D-042`.

## Purpose

This is the residual canonical destination for **reusable engineering lessons** discovered through the `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md` procedure that do not correctly belong anywhere else:

- **not Governance** (a rule/authority/boundary — those go through `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`'s RFC/Decision path);
- **not current STATE** (`coordination/STATE.md` / other `brain/*.md` status tables);
- **not ADR/RFC** (an architecture choice — `devos/changes/adrs/` / `devos/changes/rfcs/`);
- **not evidence/test results** (`brain/TEST_LEDGER.md` / `brain/RISK_REGISTER.md`);
- **not Journal/public copy** (the public Journal, `WEB-INC-006`, via its own publish approval);
- **not secret storage** (credentials/tokens/keys never belong here or anywhere in Git — see `PORTABLE_KNOWLEDGE_TREASURY.md` §5).

Only a lesson that genuinely has no other home lands here. This ledger is deliberately narrow — most durable insight already has a better-fitting destination (see the Treasury protocol's destination table), and this file is not meant to grow large.

## No new ID namespace (`ML-DEVOS-AS-050` constraint)

This ledger does not invent a new formal ID scheme or extend Sentinel Traceability V1 in V0.1. Entries are referenced by their table row (date + short title) until/unless a future, separately authorized change finds a pre-existing convention that applies cleanly.

## Entry format

Each row should carry, per `PORTABLE_KNOWLEDGE_TREASURY.md` §8's provenance model:

| Field | Meaning |
|---|---|
| Date | When the lesson was captured |
| Lesson | The reusable insight itself, stated concretely |
| Source / context | Which cycle, session, or AI (ChatGPT/Claude/Codex/other) it came from |
| Why it matters | Which durable-value reason applied (§1 of the Treasury protocol) |
| Confidence / evidence class | Reusing the existing 5-class `devos/governance/EVIDENCE_PROVENANCE_MODEL.md` — no sixth class is invented |
| Expected reuse | Where this is expected to help next (skill improvement / checklist / test / risk control / design guideline / onboarding / research shortcut / other) |
| Related IDs | Any related requirement/risk/decision/skill/RFC id |
| Supersedes / superseded by | Reusing the same field convention already used by `core-rules.json` rule records and the ADR template |

## Ledger

| Date | Lesson | Source / context | Why it matters | Confidence | Expected reuse | Related IDs | Supersedes |
|---|---|---|---|---|---|---|---|

No entries yet. This file is created empty at V0.1 implementation time — per `ML-DEVOS-AS-050`'s explicit "do not bulk-import historical chats" instruction, no retroactive backfill of prior-session lessons is performed here. Future entries are added only through the governed Treasury procedure, one durable-value-qualifying lesson at a time.
