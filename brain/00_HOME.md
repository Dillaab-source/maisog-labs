# MaisogLabs Governance — Home

This is the entry point for MAISOGLABS GOVERNANCE v0.1, piloted on the MaisogLabs website repository (`Dillaab-source/maisog-labs`).

Governance is prospective from the recorded baseline SHA (see `PROJECT_GOVERNANCE.md`). It does not retroactively certify or re-litigate historical commits made before that baseline; legacy work is documented when it is touched, not re-authored.

## Read order for a new agent or reviewer

1. `CLAUDE.md` (repo root) — current authorized scope and the Implementer/Architect/turn protocol.
2. `coordination/README.md` — the coordination-channel mechanics.
3. `coordination/STATE.md` — the live, machine-readable turn signal. Always read this before doing any work.
4. This file, then:
   - `PROJECT_GOVERNANCE.md` — roles, baseline, current architecture/storage/admin status, restrictions, legacy branch inventory.
   - `GOVERNANCE_MAP.md` — the traceability model and current requirement status.
   - `IMPLEMENTATION_STATUS.md` — current status of each major system area.
   - `RISK_REGISTER.md` — seeded risk register.
   - `TEST_LEDGER.md` — seeded test ledger, evidence-class labeled.
   - `DECISION_LOG.md` — chronological record of governance-relevant decisions.
   - `ARCHITECT_HANDOFF.md` — the reusable handoff report format.
   - `protocols/ARCHITECT_SYNC.md` — the Architect Sync review protocol and modes.
5. `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` — the full approved plan these documents implement.
6. `docs/ARCHITECTURE.md`, `AGENTS.md`, `README.md` — current, non-governance-specific engineering documentation. These remain the canonical source for *how the code works*; `brain/` is the canonical source for *what is authorized, what is proven, and who decided it*.

## Skill check and Knowledge Treasury (`ML-DEVOS-RFC-014` / `ML-DEVOS-AS-050` / `D-042`)

**SKILL CHECK:** before re-deriving a repeatable procedure from scattered files, check `.agents/skills/` (the canonical Skill location — see its own `README.md`) for a matching Skill first. Currently: Governance/Traceability Audit, Architect Review/Sync, Implementation Handoff, Project Orientation/State Recovery.

**Knowledge Treasury:** a durable, reusable engineering lesson discovered in a session belongs in the repository, not only in AI-provider memory (`AI ACCOUNTS / CHATS = LABORATORIES`, `GOVERNED REPOSITORY = DURABLE TREASURY`). Route it through `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md` before persisting anything.

**Authority precedence, unchanged by either of the above:** `GOVERNANCE > SKILLS`; `CURRENT AUTHORIZATION > SKILL CAPABILITY`; `CAPABILITY != AUTHORITY`. A Skill or a Treasury entry never grants authority, overrides `coordination/STATE.md`'s live `AUTHORIZED_SCOPE`, or substitutes for a required Paulo/Architect gate.

## Roles (summary — see `PROJECT_GOVERNANCE.md` for authority detail)

- **Paulo** — Product / Risk Owner. Approves phase transitions and accepted risk.
- **ChatGPT** — Architect / Independent Reviewer. Reviews repository evidence independently; writes `coordination/ARCHITECT_REVIEW.md`.
- **Claude** — Implementer. Inspects repository reality, implements only currently authorized work, writes `coordination/IMPLEMENTER_HANDOFF.md`.
- Source of truth: the repository, its tests, and runtime/deployment evidence — never agent claims alone.

## Current phase

**Always read live `coordination/STATE.md` for the current `CYCLE_ID`/`TURN`/`STATUS`/`AUTHORIZED_SCOPE`** — never infer current scope from this file or `CLAUDE.md`. Any phase/scope statement elsewhere in this file or in `CLAUDE.md` (including references to `PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY`) is historical provenance from an earlier cycle, not current authorization, unless live `STATE.md` corroborates it (`ML-DEVOS-AS-051` `AS51-F007`). The Skills Foundation pilot (`ML-DEVOS-RFC-014`) is one of several cycles that followed Phase 1; consult `coordination/STATE.md` and `brain/DECISION_LOG.md` for the full sequence.
