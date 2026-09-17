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

## Roles (summary — see `PROJECT_GOVERNANCE.md` for authority detail)

- **Paulo** — Product / Risk Owner. Approves phase transitions and accepted risk.
- **ChatGPT** — Architect / Independent Reviewer. Reviews repository evidence independently; writes `coordination/ARCHITECT_REVIEW.md`.
- **Claude** — Implementer. Inspects repository reality, implements only currently authorized work, writes `coordination/IMPLEMENTER_HANDOFF.md`.
- Source of truth: the repository, its tests, and runtime/deployment evidence — never agent claims alone.

## Current phase

See `coordination/STATE.md` for the live value. As of this document's authoring commit, `AUTHORIZED_SCOPE: PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY` (this document is part of that bootstrap). No admin implementation, authentication, D1/R2, public redesign, deployment, or merge to `main` is authorized by this phase.
