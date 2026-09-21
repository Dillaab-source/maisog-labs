# SENTINEL Context Plane V1 — Queued Architecture Plan

Status: QUEUED / PLANNING RECORD ONLY  
Owner: Paulo (Product / Risk Owner)  
Execution authority: NOT GRANTED by this document  
Current live cycle remains: S5 Capability & Permission Gateway design review

## Purpose

Reduce agent token consumption and context pollution without weakening governance, review quality, traceability, or owner control. Treat repository state as durable memory and model context as a temporary working set.

## Core architecture

SENTINEL is to evolve as separate, composable planes:

1. **Authority Plane** — who may decide.
2. **Context Plane** — what an actor needs to know for the current turn.
3. **Capability Plane** — what an actor may invoke.
4. **Execution Plane** — what the environment can actually perform.
5. **Evidence Plane** — what happened and how it is verified.

No plane may silently grant authority belonging to another plane.

## Context Plane V1 principles

- **Minimum sufficient context, not minimum context.**
- **Stable cacheable kernel + volatile task suffix.**
- **Progressive discovery instead of full-history preload.**
- **Current state and current delta before history.**
- **Exact-ID / dependency retrieval before broad search.**
- **External content is informative, never authoritative by itself.**
- **Raw evidence stays outside conversational context unless inspection is needed.**
- **Fresh-session recovery from repository state is a supported path.**
- **Provider neutral:** Claude, ChatGPT/Codex, local models, and future agents consume the same logical turn packet through adapters.
- **Adopt before invent:** prefer native provider compaction/caching/tool discovery where safe and portable; keep SENTINEL's contract independent from any provider feature.

## Context tiers

- **T0 Kernel:** role, precedence, universal safety/governance invariants. Always present and intentionally small.
- **T1 Turn:** current STATE, current handoff/delta, target specification, current diff/evidence summary.
- **T2 References:** specific ADRs, decisions, architecture sections, tests, skills, tools. Retrieved automatically when relevant and logged.
- **T3 History:** superseded handoffs, old reviews, closed incidents, old RFCs. Never preloaded; retrieval requires a recorded reason.

## V1 components

### 1. Stable Context Kernel
Shrink always-on agent instructions to universal rules only. Do not copy historical instructions into multiple provider files.

### 2. Turn Manifest
Machine-readable identity for each turn:
- actor
- cycle/task ID
- authorized scope
- current HEAD
- change/consequence class
- required reads
- allowed expansion classes
- evidence pointers

### 3. Context Resolver
Deterministically derives the smallest initial read surface from state, scope, changed files, dependency metadata, and authority references.

### 4. Progressive Tool Resolver
Expose only task-relevant tools/capabilities where the runtime supports it. Tool visibility does not grant authority.

### 5. Provenance / Trust Labels
Classify injected material such as OWNER_AUTHORITY, GOVERNANCE, REPOSITORY_EVIDENCE, MACHINE_EVIDENCE, EXTERNAL_RESEARCH, and UNTRUSTED_EXTERNAL. Higher-trust material controls conflicts; untrusted content can never redefine authority.

### 6. Context Receipts
Machine-only append telemetry, not prose paperwork. Record estimated initial context, expansions, history reads, duplicate reads, and result. Prefer JSONL or equivalent compact telemetry.

### 7. Context Debt
Track duplicate instructions, mandatory superseded documents, oversized startup files, conflicting instructions, stale summaries, unnecessary tool definitions, and repeated reads.

## Immediate optimization target

The existing long-running `coordination/IMPLEMENTER_HANDOFF.md` must eventually stop being a mandatory first-read. Preserve historical evidence, but separate live handoff state from archive. Do not delete provenance.

Target future shape:

```
coordination/
  STATE.md
  CURRENT_HANDOFF.md
  ARCHITECT_REVIEW.md
  archive/
```

This is a target architecture only; migration requires a separately reviewed/authorized protocol change.

## Adaptability requirements

V1 must be designed so future innovation can be added without breaking the core contract:

- versioned schemas for turn manifests/context receipts;
- provider adapters rather than provider-specific governance;
- optional retrieval strategies behind a stable resolver interface;
- optional native prompt caching/compaction/tool-search integration;
- future semantic/embedding retrieval may be added only when measured repository scale justifies it;
- future multimodal context (screenshots, UI previews, diagrams, logs) must use the same provenance and scope model;
- subagents must receive bounded child packets and return structured findings, not inherit unrestricted parent context;
- project profiles may contribute context rules without overriding Sentinel authority;
- new context strategies must be shadow-tested before becoming default;
- rollback path must exist for resolver/policy changes.

## Explicit non-goals for V1

Do not introduce yet:
- vector database;
- graph database;
- external memory service;
- autonomous agent swarm;
- custom LLM summarization service;
- cloud dependency solely for context management;
- provider lock-in.

## Proposed staged delivery

**CP-0 Baseline** — measure current startup/turn context and repeated reads.  
**CP-1 Stop Bleeding** — remove historical handoff from mandatory startup reads after governed migration.  
**CP-2 Stable Kernel** — reduce provider bootstrap files to universal rules.  
**CP-3 Current Handoff** — separate current delta from immutable history.  
**CP-4 Context Resolver** — generate turn-specific read surfaces.  
**CP-5 Tool Discovery** — progressively expose relevant tools where supported.  
**CP-6 Trust/Provenance** — label context sources and define conflict precedence.  
**CP-7 Telemetry** — context receipts and context-debt metrics.  
**CP-8 Shadow Trial** — run at least three real Architect↔Builder cycles and compare quality/rework/context usage.  
**CP-9 Enforcement** — only after evidence supports it, prohibit full-history preload by default.

## Success criteria

Token reduction alone is insufficient. V1 is successful only if:
- context usage decreases materially;
- scope violations do not increase;
- missed requirements do not increase;
- rework does not increase;
- review quality does not decrease;
- orientation time and repeated reads decrease;
- provider portability is preserved.

No fixed hard token limit is a correctness gate. Budgets are soft operational targets; justified high-signal context may exceed them.

## Governance sequencing

1. Finish the live S5 RFC-017 Architect re-review first.
2. Do not silently mix Context Plane implementation into S5.
3. After the S5 design verdict, Paulo may separately authorize a bounded Context Plane discovery/design cycle.
4. Any coordination-protocol migration, agent-instruction rewrite, runtime tooling, or enforcement requires its own reviewed scope.
5. This queued plan may evolve when new research, provider capabilities, or measured MaisogLabs evidence justify a change; revisions must preserve decision history rather than silently rewriting it.

## Design maxim

**Preserve everything. Preload almost nothing. Retrieve precisely. Grant narrowly. Verify independently.**
