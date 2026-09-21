# Canonical Skill payload

Authority: `ML-DEVOS-RFC-014` (ACCEPTED) / `ML-DEVOS-AS-050` (ARCHITECT_APPROVED) / `D-042`.

This directory is the **single canonical source** for every MaisogLabs/Sentinel Skill. Per `D-042`'s accepted architecture, `.agents/skills/` is the canonical repository Skill location — supported natively by OpenAI Codex CLI, GitHub Copilot, and Gemini CLI (see `devos/changes/rfcs/ML-DEVOS-RFC-014.md` §3/§7 for the evidence basis). Claude Code does not natively read this path; `.claude/skills/` carries a deterministically generated, non-diverging bridge — see `scripts/generate-claude-skills-bridge.mjs` and `scripts/validate-claude-skills-bridge.mjs`. **Never hand-edit anything under `.claude/skills/`** — it is entirely regenerated from here.

## SKILL CHECK

Before re-deriving a repeatable procedure from scattered repository files, check whether a matching Skill already exists here.

## Current Skills (exactly 4 — no fifth is authorized in V0.1)

- `governance-traceability-audit/` — run the deterministic referential-integrity check.
- `architect-review-sync/` — conduct an Architect Sync review (gated by `coordination/STATE.md`'s `TURN` field).
- `implementation-handoff/` — produce a complete Implementer Handoff.
- `project-orientation-state-recovery/` — re-establish current governance context.

Each Skill is a thin, non-authoritative wrapper around an already-proven repository procedure — never a new grant of authority, tool access, or credential (`CORE-002`, `CORE-008`). `GOVERNANCE > SKILLS`; `CURRENT AUTHORIZATION > SKILL CAPABILITY`; `CAPABILITY != AUTHORITY`.

A fifth "Knowledge Capture" Skill is explicitly **not** authorized for V0.1 — see `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md` for where that function lives instead (a manual governed procedure, not a Skill, per `ML-DEVOS-AS-044` §F / `D-042`).
