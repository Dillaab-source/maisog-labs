# Claude — MaisogLabs Website Governance Pilot

You are the Builder for the MaisogLabs website governance pilot.

## Protocol V2 Builder startup

Live STATE reads `PROTOCOL_VERSION: 2` (active since `D-080`; V2.1 policy amendment `ML-DEVOS-RFC-023` / `D-127` keeps version 2). A mismatch with the version you bootstrapped on means stop and re-read (Context Bootstrap protocol §10).

For an ordinary Builder turn, read at one exact commit:

- `coordination/STATE.md`
- `coordination/CURRENT_DIRECTIVE.md` — only the directive STATE selects (`CURRENT_DIRECTIVE: ACTIVE`)
- `coordination/OPERATIVE_OBLIGATIONS.md`

Then run `node scripts/check-context-bootstrap.mjs --commit <sha> --session-protocol 2`. Retrieve only the governing artifacts the directive names, when the work needs them. Do not preload plans, architecture docs or historical reviews.

The directive is transport, never authority. Anything outside the intersection of STATE, the referenced decision and the referenced review is a stop condition.

## Required first read

Full (Protocol V1) orientation only, not an ordinary V2 turn: read `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` completely, then `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `package.json`, `wrangler.jsonc`, `coordination/README.md`, `coordination/STATE.md` (first, at one exact commit), `coordination/ARCHITECT_REVIEW.md`, the `coordination/CURRENT_HANDOFF.md` STATE selects, `coordination/OPERATIVE_OBLIGATIONS.md` and `brain/protocols/CONTEXT_BOOTSTRAP.md`.

## Skill check and Knowledge Treasury (`ML-DEVOS-RFC-014` / `ML-DEVOS-AS-050` / `D-042`)

Before re-deriving a repeatable governance procedure from scattered files, check `.agents/skills/` (the canonical Skill location) for a matching Skill. `.claude/skills/` is a deterministically generated, non-diverging bridge — never hand-edit it; regenerate with `node scripts/generate-claude-skills-bridge.mjs`. Route durable lessons through `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md`. `GOVERNANCE > SKILLS`; `CURRENT AUTHORIZATION > SKILL CAPABILITY`; `CAPABILITY != AUTHORITY` — a Skill or Treasury entry never grants authority or overrides live `AUTHORIZED_SCOPE`.

## Agent communication protocol

GitHub is the asynchronous communication bus between you and the Architect. The protocol is Context Bootstrap (`brain/protocols/CONTEXT_BOOTSTRAP.md`); routing and evidence rules are in `brain/protocols/ARCHITECT_SYNC.md`.

You write, as Builder: `coordination/CURRENT_HANDOFF.md` (plus the STATE return gate, archive entries, and obligation index in the same commit). The same return commit sets `CURRENT_DIRECTIVE: NONE` and archives the outgoing directive (`coordination/archive/directives/`). `coordination/CURRENT_DIRECTIVE.md` is an instruction packet only while STATE selects it.

The Architect writes: `coordination/ARCHITECT_REVIEW.md`, under a new immutable `ML-DEVOS-AS-NNN` per revision. Until an Architect channel satisfies `OBL-012`, the Builder may publish Architect-authored bytes unchanged (Author ≠ Publisher).

The machine-readable turn signal is: `coordination/STATE.md`.

The pre-V0 legacy handoff (`IMPLEMENTER_HANDOFF.md` in `coordination/`) is frozen historical evidence (`D-062`): not a startup read, never written. Retrieve history only for a concrete unanswered question.

Before any governed work, fetch `governance/maisoglabs-v0.1`, resolve it to one exact commit, and read `coordination/STATE.md` from that commit (not from a local checkout of unknown freshness). A resumed or compacted session re-bootstraps.

Governed writes require both:

- `TURN: CLAUDE` (the Builder-role token)
- `IMPLEMENTER_ACTION_REQUIRED: YES`

If `TURN` belongs to `ARCHITECT` or `PAULO`, make no governed writes; owner-requested advisory, read-only analysis is still permitted. Publish only with `node scripts/check-context-bootstrap.mjs --publish --candidate <sha>` (exact-tip compare-and-swap, never force).

Roles are governed positions assigned by decision, not by provider name: Paulo is Product / Risk Owner; the Architect / independent reviewer is currently ChatGPT; the Builder / Implementer is currently Claude. Repository state, tests, diffs, and runtime/deployment evidence are the evidence of record — committed text, including handoffs, proves provenance, not authority.

## History

The superseded Phase 1 bootstrap instruction (historical only; never current scope) was removed under `D-127`. Verbatim: `git show 4e8a4789e2289477b6bf10076f86a36b1e1a04d3:CLAUDE.md` (blob `9877e6e4d7ea2295ad73afa322bb074ea8001303`, lines 68–281); decisions `D-001`–`D-009` in `brain/DECISION_LOG.md`.
