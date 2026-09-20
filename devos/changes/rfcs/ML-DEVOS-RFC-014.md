# RFC-014: MaisogLabs Skills Foundation V0.1 Discovery

Status: `DRAFT`

Proposed change class (see `../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §1): `ARCHITECTURE`

Authority for this discovery cycle: Paulo priority directive, `D-038`. This RFC is the required discovery deliverable of `MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY` (`coordination/STATE.md` / `coordination/ARCHITECT_REVIEW.md`).

## Problem

Sentinel already contains many genuinely repeatable procedures — an Architect Sync review pipeline, an Implementation Handoff format, a fully-implemented Traceability Audit, a Design Governance contribution checklist, a Release Readiness assessment — but each lives in a different file, in a different shape, discoverable only by already knowing where to look. `brain/00_HOME.md` exists specifically to compensate for this: it is a manually maintained "read these N files in this order" list, because there is no smaller, named, activation-triggered entry point into any one procedure. Every new agent/session pays this rediscovery cost from scratch.

Separately, "Agent Skills" — a `SKILL.md`-based packaging convention for exactly this kind of repeatable procedure — has matured since Sentinel's S0 baseline into a genuine cross-provider open standard (`agentskills.io`), adopted natively by Claude Code, Codex CLI, Cursor, Gemini CLI, and GitHub Copilot, each with its own discovery path (`.claude/skills/`, `.codex/skills/`, `.gemini/skills/`, `.github/`, etc.) but a common core format. Sentinel has no policy for whether or how to adopt this pattern, no boundary distinguishing "a reusable procedure" from "a rule," "an authorization," "a decision," or "a capability grant," and no security posture for the fact that Agent Skills are now also distributed as third-party/community packages — an expanding, largely unaudited instruction-and-tool-permission supply chain.

## Motivation

Left unaddressed, two failure modes are live:

1. **Rediscovery cost keeps compounding.** Every cycle in this repository's own history (this discovery cycle included) begins by re-reading a scattered set of files to reconstruct "how do I do X." `00_HOME.md`'s existence is itself evidence this has already become a maintenance burden.
2. **An ungoverned Skills adoption is worse than none.** If a future actor starts writing `.claude/skills/*.md` files ad hoc, without a prior boundary, a skill's mere existence and repeated use could start to function as de facto authorization — precisely the failure `CORE-002` ("Capability != Authority") and `CORE-008` ("Installed capability does not grant authority") already exist to prevent for tools and credentials, but which has never been stated for *procedure packaging* specifically.

If this RFC is not accepted, Sentinel either continues paying the rediscovery cost indefinitely, or some future actor adopts Skills without the governance boundary this RFC exists to establish first — which is exactly the risk `D-038` was written to avoid ("Skills Foundation may introduce non-authoritative procedure/skill references that should be understood before S3's task-contract schema is frozen").

## Proposed change

This RFC proposes (a) a definition boundary distinguishing a Skill from every other Sentinel record type, (b) a canonical-location and provider-adapter strategy, (c) a non-mechanical SKILL CHECK routing convention, (d) a smallest coherent initial skill set derived from actual repository content (never invented), (e) an external-skill security model, and (f) an evaluation architecture — **as a design only**. No skill file, no `devos/skills/` directory, and no provider-adapter directory is created by this RFC. Implementation is a separate, later-authorized Builder cycle.

### 1. Concrete problem this solves

See Problem/Motivation above. Concretely: reduce the cost of reusing an already-proven Sentinel procedure from "re-read several files across `brain/`, `devos/`, `coordination/`" to "invoke one named, activation-scoped Skill that points at those same authoritative files" — without ever letting the Skill itself become a second, competing source of truth.

### 2. Definition boundary

| Kind of thing | Belongs to | Stays exactly where it is today |
|---|---|---|
| A repeatable, already-authorized *procedure* (steps to follow, given inputs, to produce a defined output) | **Skill** | N/A — this is the new category |
| A rule, an authority boundary, a trust boundary | **Governance** (`devos/governance/rules/core-rules.json`, `TRUST_BOUNDARIES.md`, `CHANGE_GOVERNANCE_POLICY.md`) | Unchanged; a Skill may *read* these, never restate or override them |
| Current project/repository state, turn, or authorization | **Brain / State** (`coordination/STATE.md`, `brain/*.md`) | Unchanged; every mutating Skill must read live state before acting (see §"Governing principles carried into design" below) |
| A cross-cutting architecture choice and its rationale | **ADR / Architecture** (`devos/changes/adrs/`, `devos/architecture/`) | Unchanged |
| A reusable lesson or discovered gap that isn't itself an authorization | **Knowledge / Principle** | Currently has **no dedicated home** (see Discovery Finding 7 below) — this RFC proposes closing that specific gap with one new, narrow Skill, not a new record type |
| A technical permission/capability grant (tool access, credential, remote resource) | **S5 Capability Gateway / future technical control** | Unchanged, unimplemented; a Skill may *describe* which capabilities a procedure typically needs, but never *grants* them (`CORE-002`, `CORE-008`) |

A Skill is therefore always a **thin, non-authoritative wrapper around an already-authoritative procedure**, structurally identical in spirit to how Traceability V1's generated index is a derived, non-authoritative view over already-authoritative governance records (`ML-DEVOS-AS-037` `AS37-F002`). Nothing in this table creates a new grant of authority.

### 3. Canonical skill location

Proposed: **`devos/skills/`** — consistent with the existing `devos/` pattern of a Sentinel-owned subsystem root (alongside `devos/governance/`, `devos/changes/`, `devos/templates/`, `devos/handoffs/`, and the reserved-but-unimplemented `devos/contracts/`, `devos/state/`, etc. named in `devos/devos-manifest.json`). `devos/skills/` is not currently a reserved root; a future implementation RFC would need to register it there, exactly as `devos/contracts/` was registered for S3.

Each skill is authored **once**, at `devos/skills/<skill-name>/SKILL.md`, using the real cross-provider format (YAML frontmatter `name`/`description` at minimum, optional `references/`, `scripts/`, `assets/`, `evals/` per the `agentskills.io` standard and Claude Code's own documented layout). This is the single canonical source; no provider-specific directory is ever independently authored (see §5).

### 4. SKILL CHECK discovery/routing behavior

No new technical enforcement mechanism is proposed (no S4/S5 machinery). Each provider's own runtime already performs progressive-disclosure discovery natively (Claude Code: name+description loaded at session start, full body loaded on activation match against `description`/`when_to_use`, capped combined frontmatter length; equivalent mechanisms exist in Codex/Cursor/Gemini CLI). "SKILL CHECK" in this proposal is a **documentary convention**, not code: before re-deriving a procedure from scattered files, an agent checks whether `devos/skills/` already has a matching skill, exactly as `00_HOME.md`'s read-order list is a documentary convention today. This is proposed to be folded into `00_HOME.md` itself once V0.1 exists (a one-line addition: "check `devos/skills/` for a matching procedure before re-deriving one").

### 5. Provider adapter/exposure strategy — open question, not resolved here

External evidence (see "External conventions inspected" below) shows no single dominant answer: some ecosystems use per-provider directories with independently authored content; others increasingly treat `SKILL.md` itself as the portable artifact and use thin per-provider references (symlinks, or a documented plugin/marketplace manifest) rather than duplicated content. This RFC does **not** decide the mechanical answer and does not create any provider-adapter directory now (`.claude/skills/`, `.codex/skills/`, `.gemini/skills/`, `.github/skills/` are all explicitly out of scope for this cycle). It records the constraint that whichever mechanism is chosen at implementation time, **`devos/skills/` remains the single canonical source of truth** and no provider directory may hold independently-diverging content — flagged as an open question for the Architect Sync / implementation RFC to resolve (see Open Questions in the accompanying handoff).

### 6. Smallest coherent initial skill set (proposed for a future, separately authorized V0.1 implementation — not built now)

Evaluated against the 8 candidate areas named in `coordination/ARCHITECT_REVIEW.md`, using only what the repository survey (see accompanying Implementer Handoff) actually found:

**Proposed for V0.1 (5 skills — each wraps an already-existing, already-proven procedure; none is new authority):**

1. **Governance / Traceability Audit** — wraps `devos/governance/traceability/README.md` + `generate-traceability.mjs`/`validate-traceability.mjs`. The single most "skill-ready" procedure in the repository: already deterministic, tested, documented, with defined exit-code semantics.
2. **Architect Review / Sync** — wraps `brain/protocols/ARCHITECT_SYNC.md`'s review-flow pipeline and four review modes, plus `coordination/README.md`'s turn protocol.
3. **Implementation Handoff** — wraps `brain/ARCHITECT_HANDOFF.md`'s exact required field list and the worked `devos/handoffs/*` examples.
4. **Project Orientation / State Recovery** (merged candidate) — wraps `brain/00_HOME.md`'s numbered read-order procedure together with `devos/governance/BOOTSTRAP_SOURCE_OF_TRUTH.md`'s "does a claimed authoritative instruction actually have a corresponding commit" check. The survey found these two candidate areas ("Project-State Recovery" and onboarding) are, in practice, the same procedure nowhere else distinguished — merging them avoids inventing an artificial boundary.
5. **Knowledge / Realization Capture** (genuinely new, not duplicative) — the survey found a real, recurring, *unnamed* convention already in use (`SENTINEL-MIGRATION-DEBT-001`, `TRACE-DEBT-001`, the architect-syncs README's "Legacy verbatim claims" writeup): when a real gap or inconsistency is discovered but not authorized to fix immediately, it gets a durable `<PREFIX>-DEBT-NNN`/`<PREFIX>-GAP-NNN` id and an inline record, rather than being silently fixed or silently lost. This has never been written down as a procedure. Formalizing it is not "renaming an existing procedure" (explicitly disallowed) — it is naming a real, observed, previously-implicit pattern for the first time, closing Discovery Finding 7's gap directly.

**Evaluated and explicitly not proposed for V0.1:**

- **Project Health** — *rejected as stated.* No general procedure exists anywhere in the repository; the only concrete instance found (`docs/release/WEB_REL_001_*`) is a release-readiness assessment, not a general health concept. Building a skill for an undefined concept would mean inventing the procedure inside a Skill, which is exactly what this RFC's own instruction ("do not duplicate an existing procedure merely to rename it a skill") implies should not happen in the other direction either. Recommendation: if a general "Project Health" skill is wanted later, it needs its own short design pass first (what does "health" mean, concretely, outside a release?) — out of scope here. A **narrower, already-evidenced "Release Readiness Review" skill**, wrapping the existing `WEB_REL_001_*` brief/report pair, would be a legitimate future V0.2 candidate, but is not included in V0.1 to keep the initial set to procedures that are *already* proven in full, not partially.
- **Research Before Architectural Decisions** — *rejected as stated.* The survey found zero existing procedure — only post-hoc narrative phrases in Decision Log entries ("after broad external research"). There is nothing to wrap; writing this skill now would mean fabricating a new procedure inside a Skill file, bypassing the RFC → Architect Sync → Decision path that any new Sentinel procedure is supposed to go through. Flagged as a future RFC candidate in its own right, not a Skills Foundation deliverable.
- **Public / Private Information Classification** — *rejected as stated, and flagged for a Paulo decision.* The repository's own `brain/RISK_REGISTER.md` `RISK-WEB-013` already records this as an **unsolved, architectural** risk (Git-repository-level publicness is not addressed by any content-layer draft/archive filter) with status `OPEN despite passing tests`. Packaging a "classification skill" around this today would risk exactly the false-confidence failure mode this RFC exists to prevent — an agent could report "I ran the classification skill" as if that resolved a risk the repository itself says is unresolved. No skill is proposed here; the underlying risk needs its own governed remediation first.

### 7. Overlap / trigger-conflict analysis

- **Architect Review** vs. **Implementation Handoff**: no overlap by construction — gated by opposite values of `coordination/STATE.md`'s `TURN` field (`ARCHITECT` vs. `CLAUDE`).
- **Governance/Traceability Audit** vs. **Architect Review**: conceptually adjacent (both check integrity) but mechanically distinct — Traceability Audit is a deterministic, explicitly-invoked tool run; Architect Review is a human/agent judgment pipeline. Non-overlapping triggers: Traceability Audit activates on an explicit technical-integrity request ("check traceability," "run the validator"); Architect Review activates on the turn-state condition, not on a keyword match.
- **Project Orientation/State Recovery**: broadest, most generic activation surface ("I don't have context," "new session," "what's the current state") — by design, this is the *only* skill in the initial set with a broad trigger, so it is the one most likely to over-fire; its non-activation condition (an agent that already has current, task-relevant context loaded) is made explicit precisely to bound this.
- **Knowledge/Realization Capture**: narrowest trigger of the five ("a gap was found, no authorization exists to fix it now") — lowest overlap risk.
- General rule proposed for every future skill: **activation and non-activation conditions must both be stated explicitly**, and where two skills could both plausibly match a request, the narrower-scoped one must be preferred (see Evaluation Strategy, case "two skills partially matching").

### 8. External/provider skill conventions inspected (evidence-backed, not asserted from memory alone)

- The Agent Skills format is a genuine open, cross-provider standard (`agentskills.io`): a `SKILL.md` file with YAML frontmatter (`name`, `description` at minimum — both effectively required in practice even where the spec marks them optional) plus a Markdown instruction body, working identically across Claude Code, Codex CLI, Cursor, Gemini CLI, and GitHub Copilot.
- Progressive disclosure is real and specified, not aspirational: name+description loaded at session start (Claude Code caps the combined `description`/`when_to_use` at 1,536 characters); full body loaded only on activation; linked reference files loaded only when actually accessed.
- Provider discovery paths are genuinely non-uniform: Claude Code uses `.claude/skills/<name>/SKILL.md` at enterprise/personal/project/nested/plugin scope with a defined priority order; Codex uses `.agents/skills/`; Gemini CLI uses `.gemini/skills/`; multi-platform plugin packaging increasingly requires dual manifests. No single "one file works everywhere with zero adapter" answer currently exists at the *distribution* layer, even though the *content* format (`SKILL.md` itself) is portable.
- Anthropic's own documented security posture for third-party/community skills is directly applicable here and is reused rather than reinvented in §9 below: review `allowed-tools`, review any dynamic shell-command injection, review `disallowed-tools`, check for isolation (`context: fork`), review any registered hooks — before ever invoking an unfamiliar skill.
- Anthropic's own official skills repository (`github.com/anthropics/skills`) documents *no* formal versioning or security-review process for community contributions beyond "test thoroughly before critical tasks" — i.e., the ecosystem itself has not solved external-skill trust; Sentinel cannot assume it has and must define its own bar (§9).

### 9. External skill security model

Default posture: **`FOUND ONLINE != TRUSTED`.**

No external or community skill is installed or executed merely because it was discovered. Any proposed adoption requires, before use:

1. **Instruction review** — read the full `SKILL.md` body, not just the frontmatter description.
2. **Scripts/dependencies review** — inspect everything under `scripts/`/`assets/`, any `allowed-tools` grant (what commands can it pre-approve without a prompt?), any dynamic shell-command injection (`` !`cmd` `` blocks — what does it fetch or send, and when?), any `hooks` (what does it register for the rest of the session?), any `context: fork` (does it run isolated, or does it see conversation history?).
3. **Overlap check** — does it duplicate or conflict with an existing canonical `devos/skills/` entry?
4. **Security/permission assessment** — does its tool/permission footprint match what its stated purpose actually needs, or does it request materially more?
5. **Provenance/version/pinning** — record exact source (repository, commit or tagged version); never track "latest" silently.
6. **Required authorization** — because a skill can carry `allowed-tools` grants, adopting *any* external skill is treated as capability-adjacent and requires the same review/approval gate `CAPABILITY_CHANGE_SPEC.md` would require for a comparable tool grant. A skill is never self-authorizing.

### 10. Evaluation architecture

At minimum, design (not yet build — `evals/` content is an implementation-time deliverable) cases for each of the 12 categories the authorizing review requires, mapped against the 5 proposed V0.1 skills:

| Case | Concrete instance against the proposed set |
|---|---|
| Correct activation | Governance/Traceability Audit activates on "check governance integrity" / "run traceability" |
| Missed/incorrect activation | Architect Review must **not** activate when `STATE.md TURN != ARCHITECT` |
| Overlapping skills | Project Orientation vs. Architect Review both plausibly match "what's going on here" — the narrower, turn-state-gated one must win when the turn condition is met |
| Governance conflict | A skill's own procedure would contradict a live `STATE.md` restriction (e.g. a `Hard boundaries` entry) — must stop, report the conflict, not proceed |
| Capability without authority | A skill's instructions describe a mutation, but `AUTHORIZED_SCOPE` forbids it — must stop and report, never proceed on skill content alone |
| Unauthorized scope | Skill invoked for scope broader than what is currently authorized in `STATE.md` |
| Frozen baseline protection | No skill's instructions may claim authority to alter `ML-DEVOS-ARCH-001` content |
| Public/private boundary | Deliberately **not** testable in V0.1 — no skill exists in this area; documented as a known gap, not silently skipped |
| Unrelated open-risk handling | No skill's routine operation may cause `RISK-WEB-013` (or any other open risk) to be marked resolved as a side effect |
| Missing Paulo decision | A skill whose procedure requires a Paulo gate must stop and request it explicitly, never proceed as if silence were approval |
| External-skill trust boundary | An unreviewed external skill discovered mid-task must be flagged per §9, never auto-adopted |
| Smallest-sufficient-match | Governance/Traceability Audit vs. Architect Review both touch "integrity" — a narrow technical-check request must activate only the former |

### 11. Traceability integration

No second traceability system is created. The existing Sentinel chain is reused conceptually: `NEED → RFC → ARCHITECT REVIEW → PAULO DECISION → SKILL DEFINITION → EVALUATION → IMPLEMENTATION → EVIDENCE`. A concrete, deferred option is noted rather than proposed now: Traceability V1's existing `file`-per-id discovery strategy (already used for RFC/AS/ADR) could, with a config-only addition, cover a future `ML-DEVOS-SKILL-NNN` id family the same way — but assigning durable IDs to skills that don't exist yet would be premature, so this is recorded as an option for the implementation cycle, not adopted here.

### 12. Relationship to S3 and whether any narrow amendment is needed

None needed. `ML-DEVOS-AS-038`'s own finding `AS38-F002` already establishes that a Task Contract "describes scope already authorized elsewhere" and "may never grant tool access." A Skill is exactly one more thing that is already covered by "scope already authorized elsewhere" — it introduces no new concept S3's existing design would need to accommodate. Recommendation for when S3 resumes (not a required change now): its own worked examples should eventually include one Task Contract whose procedure references a Skill's canonical output format, to demonstrate the layering in practice.

## Scope

This repository's Sentinel/MaisogLabs governance system. This RFC is discovery/design only. A separate, later-authorized RFC or Builder cycle would be required before any skill file, canonical directory, or provider adapter is created.

## Non-goals

- No skill content, `devos/skills/` directory, or provider-adapter directory (`.claude/skills/`, `.codex/skills/`, `.gemini/skills/`, `.github/skills/`) is created by this RFC.
- Not S3 Typed Task Contracts (remains `PAUSED / QUEUED — AUTHORITY PRESERVED` per `D-038`; this RFC does not resume it).
- Not S4+ state machinery, S5 Capability Gateway, S7 Evidence Store/QA, S9 Evidence Gate.
- Not a general resolution of the "Project Health," "Research Before Architectural Decisions," or "Public/Private Information Classification" gaps identified during discovery — this RFC only evaluates whether each becomes a V0.1 skill (all three: no) and records why.
- No product/runtime, public-website, remote-resource, credential, deployment, or `main`-merge change.

## Affected components

`devos/changes/rfcs/ML-DEVOS-RFC-014.md` (this file) and normal RFC-index bookkeeping only. No other file is created or modified by this RFC.

## Affected rules

None added, modified, or superseded. This RFC operates entirely within, and is designed to reinforce, `CORE-002` ("Capability != Authority") and `CORE-008` ("Installed capability does not grant authority"): a Skill is explicitly defined (§2 above) as a non-authoritative packaging of an already-authorized procedure, never a grant of tool access, credentials, or authority.

## Alternatives considered

1. **Status quo (do nothing).** Rejected: rediscovery cost keeps compounding; `00_HOME.md`'s manual read-order list is already a workaround for the problem this RFC addresses directly.
2. **Adopt Skills ad hoc, skip governance review.** Rejected: violates `GOVERNANCE > SKILLS`; risks a skill's repeated use becoming de facto authorization before any boundary exists — the specific failure `D-038` was written to head off.
3. **Design a bespoke Sentinel-only procedure format instead of `SKILL.md`.** Rejected at this stage: `SKILL.md` is now a genuine, evidence-backed, cross-provider open standard; nothing found during discovery requires deviating from it, and doing so would forfeit portability for no identified benefit.
4. **Defer Skills Foundation entirely until S3 is implemented.** Rejected by Paulo's `D-038`: interruption cost of pausing S3 now is effectively zero (no S3 implementation commits exist), and understanding Skills before S3's task-contract schema freezes was the explicit reasoning for reordering.

## Risks

- **Shadow authorization.** A skill's activation logic could start to function as an implicit authorization surface if a mutating skill does not re-check live `STATE.md` before acting. *Mitigation:* every skill definition in scope for V0.1 (§6) and every future skill must state its authoritative sources and must re-read live state before any mutating action — carried into the Evaluation Strategy as a mandatory test case ("capability without authority").
- **Untrusted external supply chain.** Community/third-party skills can carry tool grants, dynamic shell execution, and session-scoped hooks. *Mitigation:* §9's mandatory review-before-adoption model; no auto-install/auto-execute.
- **Overlap/duplicate activation.** Two skills could both match one request, or a broader skill could fire where a narrower one should. *Mitigation:* explicit non-overlapping-trigger design rule (§7) plus a dedicated evaluation case (§10).
- **Skills quietly displacing consultation of real authoritative sources.** Once written, a skill could be treated as "the governance system" instead of a pointer into it. *Mitigation:* every skill's "authoritative sources" field is mandatory, and `GOVERNANCE > SKILLS` is carried as a standing principle into every skill's own design, not just this RFC.

## Migration impact

None for this discovery RFC. If a future implementation cycle is authorized: no existing `brain/` or `devos/governance/` record would be deleted, renamed, or superseded — skills are proposed as thin pointers at existing authoritative sources, never replacements for them. `devos/devos-manifest.json`'s `reserved_subsystem_roots` would need a new `devos/skills/` entry at that time (not made by this RFC).

## Security / trust impact

Yes. This RFC directly engages the `Capability != Authority` trust boundary (`devos/governance/TRUST_BOUNDARIES.md`), because a Skill is, by definition, a packaged procedure description that can sit adjacent to real tool capability. The core design constraint threaded through every section above is that a Skill file itself grants nothing — it may describe a procedure and may reference (never silently expand) whatever tool permissions the acting session already has. External/community skills additionally engage the trust boundary between the agent and third-party instruction sources, addressed in §9.

## Evidence requirements

For this discovery RFC: `INDEPENDENTLY_INSPECTED` of this RFC text and of the underlying repository survey it is based on (a full file-by-file inventory of `AGENTS.md`, `CLAUDE.md`, `brain/*`, `devos/templates/`, `devos/handoffs/`, `devos/governance/*`, `devos/changes/*`, `coordination/*`, `docs/release/*`, and `brand/V3/*` — see the accompanying Implementer Handoff for the full report). No runtime claim is made in this cycle, so no `RUNTIME_OBSERVED`/`CI_ATTESTED` evidence applies. A future V0.1 implementation would require `INDEPENDENTLY_REPRODUCED` evidence that each proposed skill activates and non-activates correctly against its own evaluation cases before being accepted.

## Rollout

Not applicable to this discovery cycle — no code ships. If accepted, the proposed future rollout (contingent on a separate implementation authorization) is: file the 5 proposed skills as plain `SKILL.md` files under `devos/skills/`, each verified against its evaluation cases, before any provider-adapter directory is created.

## Rollback

Not applicable to this discovery cycle. This RFC file itself follows the normal RFC lifecycle (`DRAFT` → `ACCEPTED`/`REJECTED`/`SUPERSEDED`) if not accepted; nothing else needs to be undone.

## Compatibility

Compatible with the frozen `ML-DEVOS-ARCH-001` architecture: Skills are proposed as a purely additive, non-authoritative layer, structurally analogous to Traceability V1's derived/non-authoritative index over already-authoritative records. Explicitly **not** compatible with, and forbidden by this RFC's own design constraints: any skill whose invocation or presence would substitute for `AUTHORIZED_SCOPE` in `coordination/STATE.md`.

## Version impact

`NONE` proposed at this stage. Per `../governance/specifications/VERSIONING_POLICY.md`, this is a discovery/RFC cycle, not an implementation — no Sentinel capability-baseline version transition is proposed here. If a future V0.1 implementation is authorized, its own version impact (most likely `MINOR`, as backward-compatible additive tooling rather than a change to any existing rule's meaning) would be assessed at that time, consistent with the precedent Traceability V1 set with its own explicit no-bump decision (`ML-DEVOS-AS-041`).

## Architect Sync requirement

Yes — `ARCHITECTURE` class always requires one. This discovery cycle's own authorizing `coordination/STATE.md`/`ARCHITECT_REVIEW.md` already anticipates returning to Architect review before any implementation or S3 resumption proceeds.

## Paulo decision requirement

Yes — `ARCHITECTURE` class always requires an explicit Paulo gate. `D-038` already authorized this **discovery**; a separate, explicit, later Paulo decision would be required specifically to authorize **V0.1 implementation**. This RFC does not request or assume that authorization.
