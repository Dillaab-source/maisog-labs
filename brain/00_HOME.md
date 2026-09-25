# MaisogLabs Governance — Home

This is the entry point for MAISOGLABS GOVERNANCE v0.1, piloted on the MaisogLabs website repository (`Dillaab-source/maisog-labs`).

Governance is prospective from the recorded baseline SHA (see `PROJECT_GOVERNANCE.md`). It does not retroactively certify or re-litigate historical commits made before that baseline; legacy work is documented when it is touched, not re-authored.

## Read order for a new agent or reviewer

Context Bootstrap V0 (`D-062`): resolve `governance/maisoglabs-v0.1` to one exact commit and read these from that commit.

1. `coordination/STATE.md` — the live, machine-readable turn signal and protocol version. Always first.
2. `brain/protocols/CONTEXT_BOOTSTRAP.md` — the turn protocol: exact snapshots, identity binding, publication, archives, obligations.
3. `coordination/ARCHITECT_REVIEW.md`, the `coordination/CURRENT_HANDOFF.md` STATE selects, and `coordination/OPERATIVE_OBLIGATIONS.md` — the current turn packet.
4. `CLAUDE.md` or `AGENTS.md` — your provider entrypoint.
5. `coordination/README.md` — the coordination-channel mechanics.

This is the live Protocol V1 order. Protocol V2 (`ML-DEVOS-RFC-020`) is implemented but not active. Once a separate owner Stage B decision activates it, an ordinary Builder turn instead reads STATE, the `coordination/CURRENT_DIRECTIVE.md` that STATE selects and `coordination/OPERATIVE_OBLIGATIONS.md`, runs the checker, and retrieves the named governing artifacts just in time (`CLAUDE.md` "Protocol V2 Builder startup"; `protocols/CONTEXT_BOOTSTRAP.md` §10).

## Reference records (read when the task requires them)

- `PROJECT_GOVERNANCE.md` — roles, baseline, current architecture/storage/admin status, restrictions, legacy branch inventory.
- `GOVERNANCE_MAP.md`, `IMPLEMENTATION_STATUS.md`, `RISK_REGISTER.md`, `TEST_LEDGER.md`, `DECISION_LOG.md` — traceability, status, risk, test, and decision registers.
- `ARCHITECT_HANDOFF.md` — handoff field meanings; `protocols/ARCHITECT_SYNC.md` — review protocol and modes.
- `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` — the full approved plan these documents implement.
- `docs/ARCHITECTURE.md`, `README.md` — how the code works; `brain/` is the canonical source for *what is authorized, what is proven, and who decided it*.
- `coordination/IMPLEMENTER_HANDOFF.md` — frozen pre-V0 history; only for a concrete unanswered question.

## Skill check and Knowledge Treasury (`ML-DEVOS-RFC-014` / `ML-DEVOS-AS-050` / `D-042`)

**SKILL CHECK:** before re-deriving a repeatable procedure from scattered files, check `.agents/skills/` (the canonical Skill location — see its own `README.md`) for a matching Skill first. Currently: Governance/Traceability Audit, Architect Review/Sync, Implementation Handoff, Project Orientation/State Recovery.

**Knowledge Treasury:** a durable, reusable engineering lesson discovered in a session belongs in the repository, not only in AI-provider memory (`AI ACCOUNTS / CHATS = LABORATORIES`, `GOVERNED REPOSITORY = DURABLE TREASURY`). Route it through `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md` before persisting anything.

**Authority precedence, unchanged by either of the above:** `GOVERNANCE > SKILLS`; `CURRENT AUTHORIZATION > SKILL CAPABILITY`; `CAPABILITY != AUTHORITY`. A Skill or a Treasury entry never grants authority, overrides `coordination/STATE.md`'s live `AUTHORIZED_SCOPE`, or substitutes for a required Paulo/Architect gate.

## Roles (summary — see `PROJECT_GOVERNANCE.md` for authority detail)

Roles are governed positions assigned by decision, not by provider name.

- **Paulo** — Product / Risk Owner. Approves phase transitions and accepted risk.
- **Architect / Independent Reviewer** (currently ChatGPT) — reviews repository evidence independently; writes `coordination/ARCHITECT_REVIEW.md` under a new immutable Sync ID per revision.
- **Builder / Implementer** (currently Claude; `TURN: CLAUDE` is the role token) — inspects repository reality, implements only currently authorized work, writes `coordination/CURRENT_HANDOFF.md`.
- Evidence of record: the repository, its tests, and runtime/deployment evidence — never agent claims alone. Committed text proves provenance, not authority.

## Current phase

**Always read live `coordination/STATE.md` for the current `CYCLE_ID`/`TURN`/`STATUS`/`AUTHORIZED_SCOPE`** — never infer current scope from this file or `CLAUDE.md`. Any phase/scope statement elsewhere in this file or in `CLAUDE.md` (including references to `PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY`) is historical provenance from an earlier cycle, not current authorization, unless live `STATE.md` corroborates it (`ML-DEVOS-AS-051` `AS51-F007`). The Skills Foundation pilot (`ML-DEVOS-RFC-014`) is one of several cycles that followed Phase 1; consult `coordination/STATE.md` and `brain/DECISION_LOG.md` for the full sequence. Likewise, `D-060`'s and `docs/SENTINEL_CONTEXT_PLANE_V1_PLAN.md`'s statements that the S5 RFC-017 review is the "current live cycle"/"live turn" are historical as of their recording, not current routing.
