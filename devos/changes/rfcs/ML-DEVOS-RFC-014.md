# RFC-014: MaisogLabs Skills Foundation V0.1 Discovery (incorporating Portable Knowledge Treasury)

Status: `DRAFT`

Proposed change class (see `../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §1): `ARCHITECTURE`

Authority for this discovery cycle: Paulo priority directive `D-038` (Skills Foundation), `D-039` (Portable Knowledge Treasury integrated into the same cycle), `D-040` (research-informed safeguards). Architect review chain: `ML-DEVOS-AS-042` (`CHANGES_REQUESTED`, 4 blockers), `ML-DEVOS-AS-043` (Treasury discovery amendment), `ML-DEVOS-AS-044` (research-informed refinement amendment). This revision remediates all `AS42` blockers and integrates all `AS43`/`AS44` requirements into a single returned proposal, per `coordination/STATE.md`'s Remediation Cycle 1.

## Problem

Sentinel already contains many genuinely repeatable procedures — an Architect Sync review pipeline, an Implementation Handoff format, a fully-implemented Traceability Audit, a Design Governance contribution checklist, a Release Readiness assessment — but each lives in a different file, in a different shape, discoverable only by already knowing where to look. `brain/00_HOME.md` exists specifically to compensate for this: it is a manually maintained "read these N files in this order" list, because there is no smaller, named, activation-triggered entry point into any one procedure. Every new agent/session pays this rediscovery cost from scratch.

Separately, "Agent Skills" — a `SKILL.md`-based packaging convention for exactly this kind of repeatable procedure — has become a genuine, officially-documented cross-provider convention since Sentinel's S0 baseline. **Evidence basis below (§ "External evidence basis") is the authoritative source for every provider claim in this RFC; no provider-support claim elsewhere in this document should be read as established unless it is backed by that table.** Sentinel has no policy for whether or how to adopt this pattern, no boundary distinguishing "a reusable procedure" from "a rule," "an authorization," "a decision," or "a capability grant," and no security posture for the fact that Agent Skills are now also distributed as third-party/community packages — an expanding, largely unaudited instruction-and-tool-permission supply chain.

Third, this discovery was expanded (`D-039`/`ML-DEVOS-AS-043`) to cover a related, adjacent problem: durable engineering knowledge currently accumulates inconsistently across AI conversations (ChatGPT, Claude, Codex sessions) and repository records, with no single governed discipline for deciding what is worth keeping, where it belongs, and how to avoid it becoming either lost (trapped in a provider's private chat history) or duplicated (re-derived independently by every future session).

## Motivation

Left unaddressed, three failure modes are live:

1. **Rediscovery cost keeps compounding.** Every cycle in this repository's own history (this discovery cycle included) begins by re-reading a scattered set of files to reconstruct "how do I do X." `00_HOME.md`'s existence is itself evidence this has already become a maintenance burden.
2. **An ungoverned Skills adoption is worse than none.** If a future actor starts writing skill files ad hoc, without a prior boundary, a skill's mere existence and repeated use could start to function as de facto authorization — precisely the failure `CORE-002` ("Capability != Authority") and `CORE-008` ("Installed capability does not grant authority") already exist to prevent for tools and credentials, but which has never been stated for *procedure packaging* specifically.
3. **Provider memory is not durable, and ad hoc note-taking is not governed.** `D-039`'s core principle — `AI ACCOUNTS / CHATS = LABORATORIES`, `GOVERNED REPOSITORY = DURABLE TREASURY` — states plainly that a chat session's own memory can never be the sole record of something MaisogLabs actually needs to remember, but nothing today defines *how* a real insight gets from a conversation into this repository's already-existing durable records without becoming duplicate, competing, or ungoverned truth.

If this RFC is not accepted, Sentinel either continues paying the rediscovery cost indefinitely, or some future actor adopts Skills or ad hoc knowledge capture without the governance boundaries this RFC exists to establish first — the specific risk `D-038`/`D-039`/`D-040` were each written to avoid.

## Proposed change

This RFC proposes, **as a design only**: (a) a definition boundary distinguishing a Skill from every other Sentinel record type; (b) an evidence-gated canonical-location/provider-exposure analysis (not a premature freeze); (c) a non-mechanical SKILL CHECK routing convention with a progressive-disclosure content principle; (d) a smallest coherent initial 4-skill set derived from actual repository content; (e) a consequence-sensitive external-skill security and lifecycle model; (f) an evaluation architecture; and (g) a full Portable Knowledge Treasury discovery answering all 14 required outputs. No skill file, no canonical or provider-adapter directory, and no Treasury implementation is created by this RFC. Implementation of either subsystem is a separate, later-authorized Builder cycle.

### 1. Concrete problem this solves

See Problem/Motivation above. Concretely: reduce the cost of reusing an already-proven Sentinel procedure from "re-read several files across `brain/`, `devos/`, `coordination/`" to "invoke one named, activation-scoped Skill that points at those same authoritative files" — and give durable engineering insight one governed path into an existing canonical record, instead of either staying trapped in a chat or being duplicated ad hoc — without ever letting either mechanism become a second, competing source of truth.

### 2. Definition boundary

| Kind of thing | Belongs to | Stays exactly where it is today |
|---|---|---|
| A repeatable, already-authorized *procedure* (steps to follow, given inputs, to produce a defined output) | **Skill** | N/A — this is the new category |
| A rule, an authority boundary, a trust boundary | **Governance** (`devos/governance/rules/core-rules.json`, `TRUST_BOUNDARIES.md`, `CHANGE_GOVERNANCE_POLICY.md`) | Unchanged; a Skill may *read* these, never restate or override them |
| Current project/repository state, turn, or authorization | **Brain / State** (`coordination/STATE.md`, `brain/*.md`) | Unchanged; every mutating Skill must read live state before acting |
| A cross-cutting architecture choice and its rationale | **ADR / Architecture** (`devos/changes/adrs/`, `devos/architecture/`) | Unchanged |
| A reusable engineering lesson or discovered gap that isn't itself an authorization | **Knowledge / Principle** | Currently has **no dedicated canonical file** (confirmed by the Treasury survey, § below) — this RFC proposes *routing* such items through the Portable Knowledge Treasury discipline (§ below), which may recommend a new lightweight canonical file at implementation time; this RFC does **not** create one, and does **not** propose a Skill to invent this procedure (`AS42-F004`) |
| Evidence / experiment / test result | **Evidence repository / Test Ledger** (`brain/TEST_LEDGER.md`, `brain/RISK_REGISTER.md`) | Unchanged — this destination already exists |
| A public-safe realization | **Journal** (the already-shipped public Journal capability, `WEB-INC-006`: `app/journal/`, `worker/public/journal.mjs`) | Unchanged — this destination already exists; the Treasury routes to it, never replaces it |
| Sensitive implementation detail | **Private repository documentation** (ordinary non-public-surfaced repository locations) | Unchanged; explicitly does **not** claim to resolve `RISK-WEB-013` (repository-level publicness remains a separate, open, architectural risk — see Risks) |
| A technical permission/capability grant (tool access, credential, remote resource) | **S5 Capability Gateway / future technical control** | Unchanged, unimplemented; a Skill may *describe* which capabilities a procedure typically needs, but never *grants* them (`CORE-002`, `CORE-008`) |

A Skill is therefore always a **thin, non-authoritative wrapper around an already-authoritative procedure**, structurally identical in spirit to how Traceability V1's generated index is a derived, non-authoritative view over already-authoritative governance records (`ML-DEVOS-AS-037` `AS37-F002`). The Portable Knowledge Treasury (§ below) is, by the same logic, a *routing discipline* over these same destinations — never a competing store. Nothing in this table creates a new grant of authority. (`AS42-F002`: independently confirmed sound.)

### 3. Canonical skill location and provider exposure — evidence-gated, not frozen

`AS42-F003`/`AS44-I` require these two decisions to be resolved together, using an evidence-backed compatibility matrix, and forbid freezing either "from preference." The matrix below reflects only what the "External evidence basis" table (§ below) actually supports.

**What the evidence shows:**

| Target | Native discovery path (per official evidence) | Reads `.agents/skills/` natively? | Reads `devos/skills/` (or any arbitrary repo-owned path) natively? |
|---|---|---|---|
| Claude / Claude Code | `.claude/skills/<name>/SKILL.md` (enterprise/personal/project/nested/plugin scope) | No (no such path documented) | No |
| OpenAI Codex CLI | `.agents/skills/` (repo), `$HOME/.agents/skills` (personal) | **Yes — native/primary** | No |
| GitHub Copilot | `.github/skills`, `.claude/skills`, **or** `.agents/skills` (project); `~/.copilot/skills` or `~/.agents/skills` (personal) | **Yes — one of three accepted paths** | No |
| Gemini CLI | `.gemini/skills/` (workspace), `~/.gemini/skills/` (user) | No (not found in official docs) | No |
| ChatGPT product skill surface | Product/plugin-based skill exposure, not a repository filesystem path | No | No |

**Assessment of the three required options:**

1. **`.agents/skills/` as canonical payload where supported.** Native for 2 of 5 targets (Codex, Copilot). Still requires an adapter/copy for Claude Code and Gemini CLI, and cannot reach the ChatGPT product surface at all (no option reaches it — that target is not filesystem-based). *Duplication/drift risk:* moderate — still need adapters for 2 targets. *Governance traceability:* weaker — a path named for one ecosystem's convention rather than a Sentinel-owned root is a less natural fit for `devos/`'s existing "one governed subsystem root per concern" pattern. *Portability:* strong for exactly the 2 covered targets. *Maintenance cost:* low if only Codex/Copilot matter; otherwise same as option 2.
2. **`devos/skills/` as canonical source + generated/thin provider exposure.** Native for 0 of 5 targets — every target needs a bridge. *Duplication/drift risk:* fully mitigated only if the bridge is deterministic/regenerated (analogous to how Traceability V1 solved a structurally similar "generated output must never drift from source" problem) rather than hand-maintained. *Symlink/platform risk:* real on Windows/some CI environments without symlink support if symlinks are chosen as the bridge mechanism; a generated-copy script avoids this at the cost of a regeneration step. *Governance traceability:* strongest — exactly one file is ever the subject of RFC/Architect Sync/Decision review, consistent with the existing `devos/governance/`, `devos/changes/`, `devos/templates/` pattern. *Portability:* requires implementation-time work for every target, but is uniform (no target is privileged over another). *Compatibility with current Sentinel topology:* strongest — `devos/skills/` would be one more reserved subsystem root exactly like the existing reserved-but-unimplemented `devos/contracts/`, `devos/state/`, etc.
3. **`devos/skills/` as governance canonical source + provider-native linking/registration without duplicated content.** Same governance-traceability strength as option 2, with the specific bridging mechanism (symlink vs. generated copy vs. plugin/marketplace manifest) left open rather than presumed — this is really option 2 with its implementation detail deliberately deferred rather than pre-decided.

**Conclusion — per `AS44-I`, evidence is genuinely mixed and no option cleanly dominates once all five targets are honestly weighed:**

`.agents/skills/` has real, evidence-backed, current multi-provider traction (2 of 5 targets natively, both are CLI-based coding agents, arguably the most relevant class for a governance-tooling repository) — `AS44-I`'s instruction to treat it as "a serious canonical-payload candidate" is honored above, not dismissed. But it does not reach Claude Code, Gemini CLI, or the ChatGPT product surface, and a Sentinel-owned `devos/skills/` root better matches this repository's own existing governance-traceability pattern and reaches every target uniformly (at the cost of needing a bridge for all of them, not just three).

**This RFC therefore does not freeze a canonical location. Per `AS44-I`'s explicit fallback: `CANONICAL LOCATION: PAULO DECISION REQUIRED`, with the tradeoffs above as the deciding input.** Whichever option Paulo selects, one constraint is proposed as fixed regardless: **no provider directory may ever hold independently-authored, diverging content** — every provider-facing path must be either the canonical file itself, a symlink to it, or a deterministically regenerated copy of it, never a second hand-maintained original.

No directory (canonical or provider-adapter) is created by this remediation, per the hard boundary.

### 4. SKILL CHECK discovery/routing behavior and progressive disclosure (`AS44-G`)

No new technical enforcement mechanism is proposed (no S4/S5 machinery). Each provider's own runtime already performs progressive-disclosure discovery natively (per the evidence basis: name+description loaded at session start, full body loaded only on activation match, capped frontmatter length where documented). "SKILL CHECK" in this proposal is a **documentary convention**, not code: before re-deriving a procedure from scattered files, an agent checks whether the canonical skill location (once decided, § above) already has a matching skill, exactly as `00_HOME.md`'s read-order list is a documentary convention today.

Per `AS44-G`, every future skill's own internal content must follow the same progressive-disclosure discipline the underlying format already provides for, to avoid instruction bloat:

- `SKILL.md` = activation/routing contract + the core procedure only;
- `references/` = deeper procedural/domain material, loaded only when actually needed;
- `scripts/` = executable helpers, only where justified and separately reviewed (§9 applies to these regardless of whether the skill is internally or externally authored);
- `assets/` = non-executable templates/resources;
- `evals/` = activation/non-activation/behavior test cases (§10).

A future skill that duplicates an entire governance manual inside its own `SKILL.md` body, instead of linking to the authoritative source and keeping the body a thin routing contract, is a design defect under this principle.

### 5. Smallest coherent initial skill set (proposed for a future, separately authorized V0.1 implementation — not built now)

Per `AS42-F004`/`AS44-H`, the initial set is **4 skills**, not 5. Knowledge / Realization Capture is removed entirely from the Skill candidate list (see § "Portable Knowledge Treasury" below for where that function now lives instead).

**Proposed for V0.1 (each wraps an already-existing, already-proven procedure; none is new authority):**

1. **Governance / Traceability Audit** — wraps `devos/governance/traceability/README.md` + `generate-traceability.mjs`/`validate-traceability.mjs`. The single most "skill-ready" procedure in the repository: already deterministic, tested, documented, with defined exit-code semantics.
2. **Architect Review / Sync** — wraps `brain/protocols/ARCHITECT_SYNC.md`'s review-flow pipeline and four review modes, plus `coordination/README.md`'s turn protocol.
3. **Implementation Handoff** — wraps `brain/ARCHITECT_HANDOFF.md`'s exact required field list and the worked `devos/handoffs/*` examples.
4. **Project Orientation / State Recovery** (merged candidate) — wraps `brain/00_HOME.md`'s numbered read-order procedure together with `devos/governance/BOOTSTRAP_SOURCE_OF_TRUTH.md`'s "does a claimed authoritative instruction actually have a corresponding commit" check. The survey found these two candidate areas ("Project-State Recovery" and onboarding) are, in practice, the same procedure nowhere else distinguished — merging them avoids inventing an artificial boundary.

**Evaluated and explicitly not proposed for V0.1 (all confirmed sound, `AS42-F007`):**

- **Project Health** — *rejected as stated.* No general procedure exists anywhere in the repository; the only concrete instance found (`docs/release/WEB_REL_001_*`) is a release-readiness assessment, not a general health concept. A **narrower, already-evidenced "Release Readiness Review" skill**, wrapping the existing `WEB_REL_001_*` brief/report pair, would be a legitimate future V0.2 candidate, but is not included in V0.1.
- **Research Before Architectural Decisions** — *rejected as stated.* The survey found zero existing procedure — only post-hoc narrative phrases in Decision Log entries. Flagged as a future RFC candidate in its own right, not a Skills Foundation deliverable.
- **Public / Private Information Classification** — *rejected as stated, and flagged for a Paulo decision.* `brain/RISK_REGISTER.md` `RISK-WEB-013` already records this as an **unsolved, architectural** risk with status `OPEN despite passing tests`. No skill is proposed here; the underlying risk needs its own governed remediation first.
- **Knowledge / Realization Capture — no longer a Skill candidate at all** (see § "Portable Knowledge Treasury"). Not re-added merely to reach a larger catalog (`AS44-H`).

### 6. Overlap / trigger-conflict analysis

- **Architect Review** vs. **Implementation Handoff**: no overlap by construction — gated by opposite values of `coordination/STATE.md`'s `TURN` field (`ARCHITECT` vs. `CLAUDE`).
- **Governance/Traceability Audit** vs. **Architect Review**: conceptually adjacent (both check integrity) but mechanically distinct — Traceability Audit is a deterministic, explicitly-invoked tool run; Architect Review is a human/agent judgment pipeline. Non-overlapping triggers: Traceability Audit activates on an explicit technical-integrity request ("check traceability," "run the validator"); Architect Review activates on the turn-state condition, not on a keyword match.
- **Project Orientation/State Recovery**: broadest, most generic activation surface ("I don't have context," "new session," "what's the current state") — by design, this is the *only* skill in the initial set with a broad trigger; its non-activation condition (an agent that already has current, task-relevant context loaded) is made explicit precisely to bound this.
- General rule proposed for every future skill: **activation and non-activation conditions must both be stated explicitly**, and where two skills could both plausibly match a request, the narrower-scoped one must be preferred (see Evaluation Strategy, case "two skills partially matching").

### 7. External evidence basis (`AS42-F006`)

Every provider/standard claim used anywhere in this RFC is backed by exactly one row below. No claim elsewhere in this document should be treated as established beyond what its cited row supports. "Date checked" reflects when this evidence was gathered for this remediation cycle.

| Provider / standard | Official source | Source reference | Date checked | Exact claim supported | Confidence |
|---|---|---|---|---|---|
| Agent Skills open standard | `agentskills.io` (spec site, cited via search results, not directly fetched this cycle) | `https://agentskills.io` | 2026-09-20 | `SKILL.md` with YAML frontmatter (`name`, `description`) plus a Markdown body is the portable cross-agent format | OFFICIAL |
| Claude / Claude Code | Anthropic official docs (direct fetch performed this cycle) | `https://code.claude.com/docs/en/skills` | 2026-09-20 | `.claude/skills/<name>/SKILL.md` at enterprise/personal/project/nested/plugin scope, defined priority order; progressive-disclosure model; full frontmatter field table; documented third-party-skill security review guidance | OFFICIAL |
| Anthropic official skills repository | GitHub (direct fetch performed this cycle) | `https://github.com/anthropics/skills` | 2026-09-20 | Reference `SKILL.md` layout/example; explicit disclaimer that no formal versioning or security-review process is documented for community contributions beyond "test thoroughly" | OFFICIAL |
| GitHub Copilot | GitHub official docs ("About agent skills"), verified via search-engine-summarized excerpt of the official page — a direct fetch was attempted this cycle and blocked by this session's network egress policy | `https://docs.github.com/en/copilot/concepts/agents/about-agent-skills` | 2026-09-20 | Project skills discovered from `.github/skills`, `.claude/skills`, **or** `.agents/skills`; personal skills from `~/.copilot/skills` or `~/.agents/skills` | OFFICIAL (source is the official page; verification method for this cycle was indirect, not a direct fetch) |
| Gemini CLI | Google/Gemini CLI official docs, verified via search-engine-summarized excerpt of the official page — a direct fetch was attempted this cycle and blocked by this session's network egress policy | `https://geminicli.com/docs/cli/skills/` | 2026-09-20 | Discovery precedence: built-in < extension skills < user skills (`~/.gemini/skills/`) < workspace skills (`.gemini/skills/`); no `.agents/skills/` alias found in this source | OFFICIAL (source is the official page; verification method for this cycle was indirect, not a direct fetch) |
| OpenAI Codex CLI | OpenAI/`openai/codex` official docs, verified via search-engine-summarized excerpt | `https://developers.openai.com/codex/skills` and `https://github.com/openai/codex/blob/main/docs/skills.md` | 2026-09-20 | Repo skills at `.agents/skills/`; personal skills at `$HOME/.agents/skills`; explicitly distinct from the always-on `AGENTS.md` context file | OFFICIAL |
| ChatGPT product skill exposure | No official source found this cycle distinguishing ChatGPT's own product surface from Codex CLI's filesystem-based discovery | — | 2026-09-20 | **No evidence found** that ChatGPT's product surface performs arbitrary-repository filesystem skill discovery the way the CLI-based agents above do. Treated as a materially different, non-comparable exposure model — a gap, not an asserted fact. | **UNVERIFIED / GAP — explicitly disclosed, not asserted** |
| "Cursor supports Agent Skills" | Community/marketplace summaries only (e.g. aggregator/marketplace repositories); no official Cursor documentation was independently fetched or confirmed this cycle | — | 2026-09-20 | Not used to support any architectural decision in this RFC; mentioned nowhere else in this document as an established fact | COMMUNITY — explicitly not relied upon |
| General cross-provider marketplace/portability narrative | Community aggregator repositories (`netresearch/claude-code-marketplace`, `VoltAgent/awesome-agent-skills`, and similar) | (various GitHub repositories) | 2026-09-20 | General "the format is spreading across many agents" narrative and specific per-provider directory conventions used only where independently corroborated by an official source above | COMMUNITY — labeled as such, used only for context, never as the sole basis for a claim |

### 8. External skill security and lifecycle model (`AS42-F005`, `AS44-J`)

Default posture, unchanged and absolute: **`FOUND ONLINE != TRUSTED`.** Added this cycle, equally absolute: **`PREVIOUSLY REVIEWED != TRUSTED FOREVER`** (`AS44-J`).

`AS42-F005` found the prior draft's blanket rule — "adopting *any* external skill requires the same gate as a capability/tool grant" — over-broad and inconsistent with Sentinel's consequence-sensitive model. This revision replaces it with two tiers:

**REFERENCE-ONLY / PROCEDURAL** — a skill containing only reviewed Markdown instructions, with:
- no scripts;
- no hooks;
- no tool-permission (`allowed-tools`) expansion;
- no remote fetch/write, no dynamic shell-command injection;
- no credential use;
- no mutation authority.

Such a skill is **still untrusted until inspected, pinned/provenanced, overlap-checked, and accepted** under normal Skills/governance review — but does not require the full capability-grant gate, because it cannot itself do anything beyond what the acting session's existing tools already permit.

**CAPABILITY-ADJACENT / EXECUTABLE** — a skill containing scripts, hooks, dynamic commands, tool-permission grants, remote access, credential use, mutation procedures, or equivalent. Such a skill **routes through the relevant `CAPABILITY_CHANGE_SPEC.md`/security/Paulo gate**, exactly as a comparable tool/credential grant would, before adoption.

Mandatory pre-adoption review (both tiers): (1) instruction review — read the full `SKILL.md` body, not just the description; (2) scripts/dependencies/`allowed-tools`/dynamic-injection/hooks/isolation review; (3) overlap check against the existing canonical skill set; (4) security/permission assessment — does its footprint match its stated purpose; (5) provenance/version/pinning — exact source, never "latest."

**Lifecycle / revalidation (`AS44-J`, new this cycle):** where an external skill is adopted, its provenance record should support, in addition to source/version: `adopted_at`; `last_reviewed`; compatibility assumptions (provider/tool versions it was validated against); and an explicit revalidation-due condition. Example revalidation triggers: an upstream skill update; a major provider/client/tool version change; a dependency change; a security advisory; a failed eval; unexpected behavior; a permission/tool-scope change in a new version. No automatic install, execution, or re-trust happens merely because a skill was previously reviewed and time has passed.

### 9. Evaluation architecture

Design (not yet build — `evals/` content is an implementation-time deliverable) cases for each required category, mapped against the 4 proposed V0.1 skills, with both a positive and a near-miss negative case per skill where applicable (`AS42-F009`):

| Skill | Positive case | Negative / near-miss case |
|---|---|---|
| Governance / Traceability Audit | Activates on "check governance integrity" / "run traceability" | Must **not** claim to have resolved `WEB-REQ-009` or any other reported gap merely by running — the tool reports, it does not fix |
| Architect Review / Sync | Activates when `STATE.md TURN == ARCHITECT` | Must **not** activate when `TURN != ARCHITECT`, even if the request text resembles a review request |
| Implementation Handoff | Activates at the end of an authorized `TURN: CLAUDE` cycle, producing the exact `ARCHITECT_HANDOFF.md` field set | Must **not** omit a known limitation or unresolved question to make the handoff look cleaner (the format's own "non-negotiable rule") |
| Project Orientation / State Recovery | Activates on "I don't have context" / new session / "what's the current state" | Must **not** activate (or must yield) when an agent already has current, task-relevant context loaded — the broadest-trigger skill is the one most likely to over-fire |

Cross-cutting cases (apply across the set, not to one skill):

| Case | Requirement |
|---|---|
| Overlapping skills | Where two skills both plausibly match, the narrower-scoped one wins (Traceability Audit over Architect Review for a narrow technical-check request) |
| Governance conflict | A skill's own procedure contradicting a live `STATE.md` restriction must stop and report, not proceed |
| Capability without authority | A skill describing a mutation that `AUTHORIZED_SCOPE` forbids must stop and report, never proceed on skill content alone |
| Unauthorized scope | Skill invoked for scope broader than currently authorized in `STATE.md` |
| Frozen baseline protection | No skill's instructions may claim authority to alter `ML-DEVOS-ARCH-001` content |
| Public/private boundary | Deliberately **not** testable in V0.1 — no skill exists in this area; documented as a known gap, not silently skipped |
| Unrelated open-risk handling | No skill's routine operation may cause `RISK-WEB-013` (or any other open risk) to be marked resolved as a side effect |
| Missing Paulo decision | A skill whose procedure requires a Paulo gate must stop and request it explicitly |
| External-skill trust boundary | An unreviewed (or previously-reviewed-but-stale, per `AS44-J`) external skill must be flagged per §8, never auto-adopted or auto-retrusted |
| Smallest-sufficient-match | Governance/Traceability Audit vs. Architect Review both touch "integrity" — a narrow technical-check request must activate only the former |

### 10. Traceability integration

No second traceability system is created. The existing Sentinel chain is reused conceptually: `NEED → RFC → ARCHITECT REVIEW → PAULO DECISION → SKILL DEFINITION → EVALUATION → IMPLEMENTATION → EVIDENCE`. A concrete, deferred option is noted rather than proposed now: Traceability V1's existing `file`-per-id discovery strategy (already used for RFC/AS/ADR) could, with a config-only addition, cover a future `ML-DEVOS-SKILL-NNN` id family the same way — but assigning durable IDs to skills that don't exist yet would be premature.

### 11. Relationship to S3 (`AS42-F008`)

None needed. `ML-DEVOS-AS-038`'s own finding `AS38-F002` already establishes that a Task Contract "describes scope already authorized elsewhere" and "may never grant tool access." A Skill is exactly one more thing already covered by "scope already authorized elsewhere." S3 remains `PAUSED / QUEUED — AUTHORITY PRESERVED` until this discovery architecture closes.

## Portable Knowledge Treasury (`ML-DEVOS-AS-043` / `ML-DEVOS-AS-044` / `D-039` / `D-040`)

This section answers all 14 required outputs from `AS-043`, refined by `AS-044`'s research-informed safeguards.

### T1. Core principle

`AI ACCOUNTS / CHATS = LABORATORIES`. `GOVERNED REPOSITORY = DURABLE TREASURY`. Provider memory (ChatGPT, Claude, Codex, or any other) may assist continuity within a session but is never the sole canonical source for anything MaisogLabs actually needs to remember.

### T2. The Treasury is a routing protocol, not a store (`AS44-A`)

The Treasury **owns the process** — identify, classify, deduplicate, filter, route, trace — for getting durable insight from raw experience into the correct *already-existing* canonical destination. It explicitly does **not** become a second canonical home for governance, ADRs/RFCs/architecture, current Brain/STATE, Evidence/Test results, Skills, the Journal, or private implementation documentation. Preferred conceptual flow:

`RAW EXPERIENCE → CANDIDATE INSIGHT → DEDUPLICATE → CLASSIFY → DISCLOSURE FILTER → CANONICAL DESTINATION → REQUIRED APPROVAL → PERSIST → TRACE → REUSE`

### T3. Existing-repository treasury-like survey (required output 1)

| File/area | Already durable canonical for | Notes |
|---|---|---|
| `brain/DECISION_LOG.md` | Decisions | Durable, chronological, fixed per-entry shape |
| `devos/changes/rfcs/`, `adrs/`, `architect-syncs/` | Architecture proposals, accepted architecture, review history | Durable, immutable-once-archived (per `CHANGE_GOVERNANCE_POLICY.md` §3's rule that an accepted RFC/ADR is not rewritten) |
| `brain/RISK_REGISTER.md` | Risks | Durable; already the natural home for a risk-shaped "realization" (e.g. `RISK-WEB-013` itself is exactly this pattern in the wild) |
| `brain/TEST_LEDGER.md` | Test/evidence results | Durable; this destination already exists — no gap here |
| `brain/GOVERNANCE_MAP.md`, `brain/IMPLEMENTATION_STATUS.md` | Current requirement/subsystem status | Durable but *state*, not *lesson* — Brain/STATE, not Treasury content |
| `brain/00_HOME.md` | Orientation procedure | Durable, but is itself a procedure (a Skill candidate), not a store of insights |
| `devos/handoffs/` | Worked handoff instances | Durable, historical implementation record |
| `coordination/` (`STATE.md`, `ARCHITECT_REVIEW.md`, `IMPLEMENTER_HANDOFF.md`) | Nothing durable | **Explicitly rolling**, per `D-039`'s own instruction and consistent with Traceability V1's own established durable/rolling distinction (`ML-DEVOS-AS-040`/`AS40-F001`) — content here is a candidate source of raw insight, never itself a canonical destination |
| `devos/governance/traceability/` | Referential integrity, not insight | A mechanism to reuse for ID cross-referencing, never a second traceability system for knowledge itself |
| `docs/release/WEB_REL_001_*` | Release-readiness assessment | The closest existing thing to a postmortem-style durable record; no dedicated incident/postmortem convention exists yet (a gap, not addressed by this RFC) |
| The public Journal (`app/journal/`, `worker/public/journal.mjs`, `WEB-INC-006`) | Public-safe realizations | A real, already-shipped destination — the Treasury's "public realization" route points here, it does not invent a new publishing surface |
| `TRACE-DEBT-001`, `SENTINEL-MIGRATION-DEBT-001`, the architect-syncs README's "Legacy verbatim claims" writeup | An informal, unnamed knowledge-capture convention | Real, recurring, but never formalized as a procedure — exactly the gap `AS42-F004` found and this section resolves differently (not as a Skill) |

**Duplication/fragmentation finding (required output 2):** the repository is *not* short of canonical destinations — Decisions, Risks, Tests, RFC/AS/ADR, and now the Journal all already exist and are already durable. The actual gap is a **front-door triage discipline**: nothing currently decides, for a raw candidate insight, which of these existing destinations it belongs in, checks whether it is already recorded there, and stops fragmentation before it starts. The one genuine content gap (not a process gap) is the **"reusable engineering lesson not tied to one specific decision/risk/test"** case — there is no canonical file for a lesson that doesn't fit Decision Log, Risk Register, Test Ledger, or the RFC/ADR chain.

**What remains Project Brain (required output 3):** unchanged — `brain/*.md` continues to hold current state, requirement tracking, and implementation status exactly as today; the Treasury never becomes a Brain replacement.

**What belongs in Skills (required output 4):** none of the Treasury's own logic. See T5 below — Knowledge Capture is explicitly not a Skill in V0.1.

**What belongs in Governance (required output 5):** nothing new. Rules/boundaries remain exactly where `devos/governance/` already keeps them; the Treasury routes governance-shaped candidates to the existing RFC/Decision path, it does not create a shortcut around it.

**What deserves Knowledge/Principles treatment (required output 6):** the one confirmed gap above — a reusable engineering lesson with no existing destination. This RFC proposes (does not create) a single new, minimal, low-risk canonical file at implementation time — e.g. a `brain/KNOWLEDGE_PRINCIPLES.md`-shaped ledger — as the destination for exactly this residual case, gated by its own appropriate change class (likely `LOCAL_RULE` or a small dedicated `PATCH`/`ARCHITECTURE`-adjacent proposal, to be classified when actually proposed) rather than assumed here.

### T4. Durable-reuse capture threshold (`AS44-B`)

A conversation item is not captured merely because it is interesting. At least one durable-value reason is required:

- likely recurrence;
- prevents a repeated failure;
- changes future engineering/review behavior;
- explains a non-obvious design decision;
- reduces future research/discovery/context-recovery cost;
- materially changes security/risk understanding;
- is needed to reconstruct why the system exists in its current form.

Low-value conversational exhaust remains ephemeral — never persisted.

### T5. Candidate insight vs. accepted durable knowledge (`AS44-C`)

`CANDIDATE INSIGHT != ACCEPTED DURABLE KNOWLEDGE`. An agent inference, research snippet, or session conclusion never becomes durable truth solely because it was stated. Low-risk lessons (e.g. a reusable engineering tip with no governance/security weight) may use a lightweight acceptance step; governance/architecture/security/material-risk-shaped candidates continue to require the same evidence and approval `CHANGE_GOVERNANCE_POLICY.md`/`EVIDENCE_PROVENANCE_MODEL.md` already require for that record type — the Treasury adds a front door, it never lowers the bar behind it.

### T6. Two-axis classification (`AS44-D`)

Classification requires two independent dimensions — never conflated:

**Type / destination** (which existing canonical home, or the one proposed new lightweight ledger, a candidate maps to):
`PROCEDURE` (→ Skill candidate) · `GOVERNANCE` (→ RFC/Decision path) · `ARCHITECTURE` (→ RFC/ADR) · `STATE` (→ Brain/STATE) · `PRINCIPLE / ENGINEERING LESSON` (→ proposed new ledger, T3) · `EVIDENCE` (→ Test Ledger / Risk Register) · `PUBLIC REALIZATION` (→ Journal) · `PRIVATE IMPLEMENTATION DETAIL` (→ ordinary private repository documentation, with the `RISK-WEB-013` caveat below).

**Disclosure** (independent of type — a lesson can be public-safe while its implementation detail is not). No existing repository-wide vocabulary was found for this specific axis, so this RFC adopts `AS44-D`'s proposed default rather than inventing a competing one:
`PUBLIC_SAFE` · `INTERNAL` · `RESTRICTED` · `SECRET / DO NOT PLACE IN ORDINARY TREASURY CONTENT`.

### T7. Canonical-destination-first deduplication (`AS44-E`)

The Treasury does **not** search the whole repository as an undifferentiated pool. After classification (T6), it: (1) infers the expected canonical destination from the Type axis; (2) searches that destination (and related cross-references, reusing Traceability V1's existing generated index rather than building a second one — `D-039`'s explicit instruction); (3) chooses exactly one outcome:

- `DUPLICATE` — an equivalent record already exists; no new record is created;
- `UPDATE` — the active canonical record's type permits mutation (e.g. a `brain/*.md` status table) and is updated in place;
- `EVIDENCE_ONLY` — new evidence is attached/referenced against an existing insight, rather than duplicating the insight itself;
- `NEW` — a new canonical record is created through that record type's own normal governed path (RFC, Decision, Risk Register row, etc. — never a Treasury-specific shortcut);
- `SUPERSEDES` — a new current record is created and the prior one is marked superseded, preserving history rather than silently rewriting it — required wherever the destination's own record type is immutable/append-only once accepted (e.g. an accepted ADR, per `CHANGE_GOVERNANCE_POLICY.md` §3).

### T8. Knowledge Capture — resolved direction (`AS-043` options A/B/C, `AS44-F`)

`AS-043` required evaluating: (A) a standalone Skill, (B) a composed workflow of existing Skills, or (C) a lightweight non-Skill repository procedure.

**Resolved: Option C, converging with B — `V0.1: TREASURY = LIGHTWEIGHT GOVERNED PROCEDURE`, not a standalone Skill**, per `AS44-F`'s explicit research-informed default, and independently consistent with what this discovery itself found: the workflow (T2–T7 above) is still being defined for the first time in this very RFC, and `AS42-F004` already established that a Skill must wrap an *already-authoritative* procedure rather than become the place a new one is invented. Once this Treasury procedure has actually been used, proven repeatable, and evaluated, a *future* Skill may wrap it (at that point it would be a legitimate Skill candidate, exactly like the other four). Until then, the Treasury workflow is documented procedure, not packaged as a Skill — and in practice it *orchestrates* two of the four proposed V0.1 skills (Project Orientation/State Recovery, to establish current context, and Governance/Traceability Audit, to check existing cross-references) as steps within itself, which is the "composition" aspect of Option B without requiring the orchestration itself to be a fifth Skill.

No repository evidence found during this discovery supports overriding this default toward Option A.

### T9. Provider portability (required output 8)

The durable normalized unit is the **retained insight/record**, never a provider-specific conversation dump. The same classification and destination logic (T6–T7) applies identically regardless of whether the candidate originated from ChatGPT, Claude, Codex, an implementation handoff, an Architect review, research, a test failure, an incident/postmortem, or a project journal entry. No provider transcript/export format is ever treated as canonical; full-chat retention is never required for provenance (T10).

### T10. Public/private safeguards (required output 9)

`PUBLISH THE INSIGHT; PROTECT THE IMPLEMENTATION DETAIL.` The disclosure axis (T6) is the mechanism: a `PUBLIC_SAFE`-classified insight may route to the Journal; the same underlying experience's `RESTRICTED`/`SECRET`-classified implementation detail (credentials, private endpoints, exploit-enabling security material, sensitive infrastructure, personal/private information, confidential implementation detail) stays in private repository documentation and is never merged into the public-facing record merely because the lesson itself is reusable. **This discovery does not resolve `RISK-WEB-013`** (repository-level publicness is architectural and remains open) **and must not be read as claiming a future Treasury or Skill automatically solves it** — this is stated explicitly here, not left implicit, per `D-039`'s own requirement.

### T11. Provenance model (required output 11, extended by `AS44-K`)

Where useful, a retained record should be able to carry: source type; source/project context; date; why it matters (which T4 durable-value reason applied); confidence/evidence class (reusing the existing 5-class `EVIDENCE_PROVENANCE_MODEL.md` — no sixth class is invented); canonical destination; related requirement/risk/decision/skill IDs where applicable; `supersedes`/`superseded_by` (reusing the same field convention already used by `core-rules.json` rule records and the ADR template — no new mechanism); and, per `AS44-K`, an **expected reuse/application target** where practical (skill improvement, checklist, test/eval, risk control, design guideline, onboarding/orientation, research shortcut/reference, public Journal realization, or another explicit future behavior). A candidate with no plausible reuse/application and no reconstruction value is biased toward *not* being captured at all (`AS44-K`). Full-chat retention is never required merely to satisfy provenance.

### T12. Minimal treasury evaluation cases (required output 12)

1. **Duplicate insight** — an existing canonical lesson is found; no competing copy is created (`DUPLICATE` outcome).
2. **New evidence, same insight** — new evidence is attached/referenced rather than the principle being duplicated (`EVIDENCE_ONLY` outcome).
3. **Procedure masquerading as lesson** — classified as a Skill candidate (Type = `PROCEDURE`), not routed into Knowledge.
4. **Governance rule masquerading as lesson** — routed to the Governance/RFC path (Type = `GOVERNANCE`), never captured as a standalone "lesson."
5. **Current state masquerading as durable knowledge** — kept in Brain/STATE (Type = `STATE`), not treasury content.
6. **Sensitive implementation detail with a public-safe lesson** — the private detail stays `RESTRICTED`/`SECRET`; only the sanitized reusable insight is produced as `PUBLIC_SAFE`.
7. **Provider portability** — an equivalent insight from ChatGPT, Claude, or Codex normalizes to the identical canonical classification and destination.
8. **Low-value chat noise** — deliberately not captured (fails the T4 threshold).
9. **Superseded insight** — history/supersession preserved (`SUPERSEDES` outcome) rather than two competing current truths existing at once.
10. **Missing approval** — a candidate requiring governance/Paulo approval stops before persistence, never proceeding as if silence were acceptance.

### T13. Anti-bloat metrics (required output — `AS44-L`)

Future Treasury success is explicitly **not** measured by: number of chat snippets captured, number of knowledge files, number of installed skills, or raw archive size. Better signals: a duplicate record avoided; an existing canonical record reused instead of re-derived; a lesson reused by another project; a repeated failure prevented; a skill/checklist/test actually improved by a captured lesson; context-recovery time reduced; research effort avoided; stale/superseded knowledge correctly retired. **No metrics implementation is authorized in this cycle** — this is a future evaluation principle, not a dashboard to build now.

### T14. What NOT to build (required output 13)

Unchanged from `AS-043`, reaffirmed by `AS-044`: no giant chat archive; no scraping/importing personal account histories; no automatic transcript-ingestion pipeline; no treating provider memory as authoritative; no parallel governance system; no parallel traceability/indexing system; no `devos/memory/` runtime behavior or S11 machinery; no new knowledge database; no publishing private implementation material; no accessing external provider accounts to collect chats; no actual Skill implementation; no S3 resumption; no remote resources; no deployment; no `main` merge.

### T15. Paulo decisions required — Treasury-specific (required output 14)

1. Whether to accept Option C/B (lightweight governed procedure, not a Skill) as the Knowledge Capture direction, or direct otherwise.
2. Whether/when to authorize creating the one proposed new lightweight canonical file for the "reusable engineering lesson with no existing destination" residual case (T3), and under what change class.
3. Whether/when to open a dedicated governed remediation for `RISK-WEB-013` (carried over — still blocks any confident automation of the public/private disclosure filter).
4. Whether the eventual Journal-routing step for `PUBLIC_SAFE` candidates needs its own editorial review step beyond what `WEB-INC-006`'s existing publish flow already provides (not evaluated in this discovery — flagged as open).

## Scope

This repository's Sentinel/MaisogLabs governance system: Skills Foundation V0.1 discovery **and** Portable Knowledge Treasury discovery, integrated into one cycle per `D-039`. Both remain discovery/design only. A separate, later-authorized RFC or Builder cycle would be required before any skill file, canonical/provider-adapter directory, or Treasury procedure implementation is created.

## Non-goals

- No skill content, canonical skill directory, or provider-adapter directory is created by this RFC; canonical location is explicitly `PAULO DECISION REQUIRED`, not resolved here.
- No Treasury implementation, chat-history import/archive, transcript-ingestion pipeline, provider-memory synchronization, `devos/memory/`, or S11 machinery.
- Not S3 Typed Task Contracts (remains `PAUSED / QUEUED — AUTHORITY PRESERVED`; this RFC does not resume it).
- Not S4+ state machinery, S5 Capability Gateway, S7 Evidence Store/QA, S9 Evidence Gate.
- Not a general resolution of "Project Health," "Research Before Architectural Decisions," "Public/Private Information Classification," or `RISK-WEB-013` — all evaluated and explicitly deferred with reasons.
- No product/runtime, public-website, remote-resource, credential, deployment, or `main`-merge change.

## Affected components

`devos/changes/rfcs/ML-DEVOS-RFC-014.md` (this file) and normal RFC-index bookkeeping only. No other file is created or modified by this RFC.

## Affected rules

None added, modified, or superseded. This RFC operates entirely within, and is designed to reinforce, `CORE-002` ("Capability != Authority") and `CORE-008` ("Installed capability does not grant authority"): a Skill is a non-authoritative packaging of an already-authorized procedure, and the Treasury is a non-authoritative routing discipline over already-authoritative destinations — neither is a grant of tool access, credentials, or authority.

## Alternatives considered

1. **Status quo (do nothing on either Skills or Treasury).** Rejected: rediscovery cost keeps compounding, and durable insight keeps accumulating ungoverned in provider chat histories that are not MaisogLabs' durable treasury.
2. **Adopt Skills ad hoc, skip governance review.** Rejected: violates `GOVERNANCE > SKILLS`; risks de facto authorization before any boundary exists.
3. **Freeze `devos/skills/` (or `.agents/skills/`) as canonical now, on the strength of preference/convenience.** Rejected this cycle specifically by `AS42-F003`/`AS44-I`: evidence is genuinely mixed across five inspected targets; freezing prematurely would bind an implementation decision to weaker evidence than a short Paulo decision can resolve.
4. **Build Knowledge Capture as a standalone Skill immediately.** Rejected by `AS42-F004`/`AS44-F`: the underlying procedure does not yet exist in authoritative form; a Skill must wrap a stable procedure, not invent one.
5. **Treat all external skills identically regardless of content.** Rejected by `AS42-F005`: inconsistent with Sentinel's consequence-sensitive governance model; a reference-only Markdown skill and an executable/hook-bearing skill are not equivalent risks.
6. **Defer Skills/Treasury entirely until S3 is implemented.** Rejected by `D-038`: interruption cost of pausing S3 now is effectively zero.

## Risks

- **Shadow authorization.** Mitigated: every skill must state authoritative sources and re-read live state before any mutating action (Evaluation Strategy, "capability without authority").
- **Untrusted external supply chain, including stale trust.** Mitigated: §8's two-tier, lifecycle-aware review model; `FOUND ONLINE != TRUSTED` and `PREVIOUSLY REVIEWED != TRUSTED FOREVER`.
- **Overlap/duplicate activation.** Mitigated: explicit non-overlapping-trigger design rule plus dedicated evaluation cases.
- **Skills or Treasury quietly displacing consultation of real authoritative sources.** Mitigated: mandatory "authoritative sources" field; `GOVERNANCE > SKILLS` carried as a standing design principle; the Treasury is explicitly defined as routing, never a competing store (T2).
- **False confidence over `RISK-WEB-013`.** Mitigated by explicit, repeated non-claim (T10; also carried from the original discovery) — neither Skills nor the Treasury may be represented as having solved repository-level publicness.
- **Treasury becoming bloat/noise instead of signal.** Mitigated: the durable-reuse capture threshold (T4), the candidate-vs-accepted boundary (T5), and the anti-bloat metrics principle (T13).

## Migration impact

None for this discovery RFC. If a future implementation cycle is authorized: no existing `brain/` or `devos/governance/` record would be deleted, renamed, or superseded. `devos/devos-manifest.json`'s `reserved_subsystem_roots` would need a new entry once a canonical skill location is actually decided by Paulo (not made by this RFC).

## Security / trust impact

Yes. This RFC directly engages the `Capability != Authority` trust boundary, because a Skill is a packaged procedure description that can sit adjacent to real tool capability, and because the Treasury routes potentially sensitive implementation detail. The core design constraint threaded through this RFC is that neither mechanism grants anything on its own — a Skill may reference (never silently expand) tool permissions the acting session already has, and the Treasury's disclosure axis (T6) is the explicit boundary preventing sensitive detail from reaching a public destination merely because its associated lesson is reusable.

## Evidence requirements

For this discovery RFC: `INDEPENDENTLY_INSPECTED` of this RFC text, the underlying repository survey (Skills and Treasury), and the External Evidence Basis table (§7), all independently reviewable in this commit. No runtime claim is made in this cycle, so no `RUNTIME_OBSERVED`/`CI_ATTESTED` evidence applies. A future V0.1 implementation would require `INDEPENDENTLY_REPRODUCED` evidence that each proposed skill activates/non-activates correctly against its evaluation cases, and that the Treasury procedure's classification/dedup/routing steps behave as designed against its 10 evaluation cases (T12), before either is accepted.

## Rollout

Not applicable to this discovery cycle — no code ships. If accepted, proposed future rollout (contingent on separate implementation authorization): resolve the canonical-location Paulo decision; file the 4 proposed skills, each verified against its evaluation cases, before any provider-adapter directory is created; separately, document and begin using the Treasury workflow as a manual procedure before any future implementation/tooling is considered for it.

## Rollback

Not applicable to this discovery cycle. This RFC file itself follows the normal RFC lifecycle if not accepted; nothing else needs to be undone.

## Compatibility

Compatible with the frozen `ML-DEVOS-ARCH-001` architecture: both Skills and the Treasury are proposed as purely additive, non-authoritative layers, structurally analogous to Traceability V1's derived/non-authoritative index over already-authoritative records. Explicitly **not** compatible with, and forbidden by this RFC's own design constraints: any skill or Treasury outcome whose invocation or presence would substitute for `AUTHORIZED_SCOPE` in `coordination/STATE.md`, or any Treasury persistence that creates a second canonical home for content an existing record type already owns.

## Version impact

`NONE` proposed at this stage. This is a discovery/RFC cycle, not an implementation — no Sentinel capability-baseline version transition is proposed here. If a future implementation is authorized, its own version impact would be assessed at that time, consistent with the precedent Traceability V1 set with its own explicit no-bump decision (`ML-DEVOS-AS-041`).

## Architect Sync requirement

Yes — `ARCHITECTURE` class always requires one. This is the second returned revision of this discovery, following `ML-DEVOS-AS-042` (Remediation Cycle 1, 4 blockers) and integrating `ML-DEVOS-AS-043`/`ML-DEVOS-AS-044`.

## Paulo decision requirement

Yes — `ARCHITECTURE` class always requires an explicit Paulo gate, and this revision surfaces multiple specific decision points rather than one blanket approval: the canonical-location choice (§3), the Knowledge/Principles ledger creation question (T15), the `RISK-WEB-013` remediation timing (T15, carried over), and ultimately whether to authorize a separate V0.1 **implementation** cycle for either Skills or the Treasury (neither is requested or assumed by this discovery).
