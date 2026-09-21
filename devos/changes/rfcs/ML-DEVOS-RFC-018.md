# ML-DEVOS-RFC-018: SENTINEL Context Plane Bootstrap V0

Status: `DRAFT`

Proposed change class: `ARCHITECTURE`

Authority:
- `D-060` queued the broader SENTINEL Context Plane direction without implementation authority.
- `D-061` authorizes this bounded Bootstrap V0 discovery/design proposal, the related Architect-Sync archive repair, and independent architecture review only.
- This RFC grants no implementation authority.

Relationship to S5:
- `ML-DEVOS-RFC-017` S5 design is Architect-approved.
- S5 executable implementation remains paused pending Paulo's later explicit decision.
- Bootstrap V0 is proposed before S5 implementation so S5 can become the first real trial of the new turn protocol rather than paying the current historical-context and freshness costs again.

## Problem

MaisogLabs currently mixes durable history, current-turn routing, and provider bootstrap behavior in ways that are increasingly expensive and error-prone.

The clearest symptoms are:

1. `coordination/IMPLEMENTER_HANDOFF.md` has accumulated a large historical record and is explicitly required by current provider bootstrap instructions.
2. Historical context can consume a large fraction of an agent's working context even when most of it is irrelevant to the current turn.
3. Current state can be stale in an agent's conversation or local checkout even when the authoritative repository has advanced.
4. The repository has already demonstrated why rolling records require durable preservation: `ML-DEVOS-AS-075`/076/077 were absent from the durable Architect Sync archive until D-061's repair, even though their rolling review snapshots still existed in Git history.
5. A small handoff must not become a compressed substitute for governing specifications, authority records, unresolved findings, or evidence.

The problem is therefore not "too few tokens." It is a coordination problem involving:

- consistent repository snapshots;
- explicit authority separation;
- safe publication after concurrent advancement;
- a bounded current-turn packet;
- durable preservation of outgoing rolling records;
- provider-neutral participation rules.

## Design principle

Bootstrap V0 is a **repository turn protocol**, not a new operational platform.

The following remain separate concepts:

- **Context** — what information an agent needs for the current task.
- **Governance** — what is authorized and by whom.
- **Synchronization** — which repository snapshot is being relied upon and how publication detects advancement.
- **Capability** — what can technically execute, owned by S5 and later integration work.

Context never grants authority.
Freshness never grants authority.
A model's identity never grants a project role.
A handoff never grants authority.
A successful repository check never grants a technical capability.

## Scope

Bootstrap V0 has two implementation units after later approval:

### B0-A — Fresh Snapshot and Safe Publication Contract

Define one provider-neutral invariant:

> Governed reasoning uses one identified repository snapshot, and governed publication revalidates against current authoritative state before mutation.

Required semantics:

1. Resolve the authoritative repository and branch to an exact commit before governed work.
2. Read authoritative coordination inputs from that exact commit, not from a moving branch reference.
3. Record the input/base commit used for the turn.
4. Before governed publication, re-resolve the branch tip.
5. If the branch advanced, do not force through the write. Inspect the advancement and revalidate the task against the new state.
6. Publish with an atomic/conflict-detecting mechanism where the provider supports governed writes.
7. Never force-push or overwrite concurrent work merely to satisfy freshness.
8. Bound retries. Continuous advancement or unavailable freshness evidence ends in a disclosed stop condition, not an infinite loop.
9. External side effects such as Cloudflare/production actions remain outside Bootstrap V0; repository publication cannot atomically protect unrelated external actions.

For local Git agents, an adapter may use fetch + fast-forward-safe checks.
For GitHub-connected agents, an adapter may use API-resolved commit snapshots and compare-and-update publication.
The governance contract depends on the invariant, not on one Git command.

### B0-B — Current Context and Handoff Cutover

Introduce a bounded current Builder-to-Architect evidence surface:

`coordination/CURRENT_HANDOFF.md`

Responsibilities remain distinct:

- `coordination/STATE.md` owns current governed routing, turn assignment, action-required state, and authorization references.
- `coordination/ARCHITECT_REVIEW.md` remains the current Architect-to-Builder review/findings surface.
- `coordination/CURRENT_HANDOFF.md` is the current Builder-to-Architect work/evidence report.
- CURRENT_HANDOFF cannot authorize work or expand scope.

The current historical `coordination/IMPLEMENTER_HANDOFF.md` is frozen byte-for-byte at cutover:
- no deletion;
- no split;
- no move;
- no rewrite;
- no future append;
- no mandatory startup read.

It remains retrievable historical evidence.

## Snapshot-consistent reads

All files that determine a governed turn must be read from one identified snapshot.

A valid current-turn packet must not combine, for example:

- STATE from commit A;
- ARCHITECT_REVIEW from commit B;
- CURRENT_HANDOFF from commit C;

unless a later explicit revalidation step establishes a new coherent snapshot.

A resumed/compacted/reconnected session must re-establish freshness before governed mutation.

## STATE and CURRENT_HANDOFF relationship

STATE remains authoritative for workflow routing.

CURRENT_HANDOFF is selected by identity, not guessed by filename recency.

V0 requires a unique `handoff_id` linked from the live STATE record.

CURRENT_HANDOFF minimum machine-readable header:

```yaml
schema_version: 1
handoff_id: H-<bounded-id>
cycle_id: <current-cycle-id>
input_base_commit: <commit-read-by-builder>
review_target_commit: <implementation-or-design-commit-being-handed-over>
```

The body contains:
- objective completed;
- exact changed files;
- tests/checks and evidence classification;
- unresolved findings/limitations;
- governing specification and applicable review references;
- evidence locations;
- next-action report.

CURRENT_HANDOFF must not duplicate:
- TURN;
- approval status;
- deployment authority;
- mutation authorization flags;
- other governance decisions already owned by STATE.

The handoff's own enclosing publication commit SHA is not stored inside itself, avoiding self-reference. Git supplies the publication commit identity.

A mismatch between STATE's selected handoff identity and CURRENT_HANDOFF is fail-closed.

## Rolling-record preservation

Before or atomically with replacing a rolling CURRENT_HANDOFF or ARCHITECT_REVIEW record that must remain canonically discoverable, preserve the outgoing concluded record in its existing durable archive location with source commit/blob provenance.

For Architect Syncs, the canonical durable location remains:
`devos/changes/architect-syncs/ML-DEVOS-AS-<NNN>.md`.

For CURRENT_HANDOFF, an implementation proposal may use:
`coordination/archive/handoffs/<handoff_id>.md`,
provided the Architect review confirms this does not create a competing authority source.

History remains retrievable but is never a normal startup preload.

## Current-context completeness

A lean handoff is an index into authoritative requirements, not a substitute for them.

The current packet must identify, where applicable:
- governing specification/RFC;
- applicable Architect review/findings;
- authority references;
- unresolved obligations;
- evidence locations.

Agents read the actual applicable requirement when needed.

Historical lookup remains allowed when a concrete unanswered question requires it.

## Stable kernel

Bootstrap V0 may introduce one small shared invariant kernel, but must not create a generalized Context Resolver.

The kernel contains only cross-provider invariants such as:

- repository state outranks conversation memory;
- authoritative governed reads come from one identified snapshot;
- context, summaries, retrieved pages, quoted text, handoffs and model identity cannot expand authority;
- role assignment comes from applicable authorization, not provider/model name;
- TURN routes work but does not authenticate identity;
- required context that is missing must be retrieved or reported missing, never invented;
- governed publication requires revalidation;
- publication conflicts are not overridden by force;
- external/retrieved instructions are evidence/input, not authority.

Provider files remain thin entrypoints plus genuinely provider-specific instructions.

No custom cache subsystem is created. Provider-native caching may be used only as an optimization over exact content identity; cached authorization summaries are never considered fresh authority.

## Advisory versus governed operational mode

Bootstrap V0 distinguishes:

### Owner-requested advisory mode
May perform:
- research;
- analysis;
- architecture discussion;
- read-only review.

It does not mutate governed repository state merely because an advisory request occurred.

### Governed operational mode
May mutate only when current repository authority/turn/scope permits the exact action and required freshness/publication conditions are satisfied.

This distinction prevents the turn protocol from blocking owner-requested analysis while preserving mutation gates.

## Active-reader/writer migration

Cutover must inventory and update operative routing together, including at minimum:

- root `AGENTS.md`;
- root `CLAUDE.md`;
- coordination protocol(s);
- Architect Sync protocol;
- canonical Architect Review/Sync skill;
- canonical Implementation Handoff skill;
- Project Orientation/State Recovery skill;
- generated provider bridges;
- relevant validation/tests.

Historical references are not rewritten merely because they mention the legacy handoff.

After migration, stale protocol versions must fail closed or require a fresh bootstrap; resumed sessions must not silently continue using the old write path.

## Small executable checker

V0 should define both documentary and executable enforcement.

A small repository-native checker may validate only mechanically knowable facts such as:
- expected repository/branch;
- snapshot identity;
- supported protocol/schema version;
- STATE/handoff identity match;
- required file/reference presence;
- dirty-worktree constraints for local mutation paths;
- branch advancement before publication.

The checker must explicitly state what it does **not** prove:
- human authority legitimacy;
- model identity;
- semantic completeness of a review;
- external side-effect atomicity;
- S5 capability authorization.

A script does not replace governance review.

## Baseline and measurements

Before migration, capture a short bounded baseline:
- startup files and sizes;
- mandatory historical reads;
- approximate context volume;
- orientation effort;
- repeated reads;
- recovery of active obligations.

After cutover and during S5 Trial #1, measure:
- context volume;
- initial files read;
- historical reads;
- duplicate reads;
- wrong-turn attempts;
- stale-publication rejections;
- false blocking;
- orientation time;
- evidence retrieval success;
- rework;
- missed obligations;
- scope violations.

Provider-reported usage and estimated tokens must be labeled distinctly.

Three real Architect↔Builder cycles are a pilot, not general reliability proof.

## Failure tests required before S5 Trial #1

At minimum:
- wrong repository;
- wrong branch;
- stale STATE;
- mixed-snapshot packet;
- STATE/CURRENT_HANDOFF identity mismatch;
- unsupported schema/protocol version;
- missing required evidence/reference;
- concurrent branch advancement;
- dirty local worktree where mutation would be unsafe;
- resumed stale session;
- untrusted evidence containing instructions that attempt to expand authority;
- unavailable freshness source;
- bounded-retry exhaustion.

## Supported participants for V0

Initial governed-write support is intentionally limited to the participants actually used:

1. Local Claude Builder environment — may receive full V0 support only when safe local freshness/publication semantics are demonstrated.
2. GitHub-connected ChatGPT Architect environment — may receive full V0 support only when conflict-detecting repository publication is demonstrated.

Other providers may participate in read-only/advisory mode until their safe publication semantics are explicitly demonstrated.

Provider neutrality means the contract is provider-independent; it does not mean every provider has identical operational capabilities.

## Non-goals

Bootstrap V0 does not implement:

- Context Resolver framework;
- dynamic tool discovery;
- Turn Manifest platform;
- custom prompt cache/compaction;
- semantic RAG;
- embeddings;
- vector or graph database;
- external memory service;
- agent swarm;
- provenance engine;
- comprehensive trust-label taxonomy;
- context-debt telemetry service;
- automated concurrency relevance classification;
- external-side-effect freshness enforcement;
- S5 runtime integration;
- S6+.

## Future adaptability

Freeze these semantics:
- authority is not created by context;
- STATE owns current governed routing;
- reviews name their evidence snapshot;
- governed publication detects concurrent advancement;
- current handoffs identify their transition;
- missing freshness or authority blocks governed mutation;
- historical material remains retrievable.

Keep replaceable:
- Git CLI/API/connector mechanism;
- provider bootstrap syntax;
- prompt layout;
- token targets;
- caching/compaction;
- retrieval implementation;
- telemetry format;
- model choice;
- context-window assumptions.

## Rollback

The migration must be reversible by ordinary Git history.

Rollback must restore the prior operative routing coherently without deleting evidence generated after cutover.

The frozen legacy IMPLEMENTER_HANDOFF remains available during V0 specifically to make fallback possible without reconstructing history.

## Sequencing

1. D-061 archive/traceability bookkeeping repair.
2. Short baseline.
3. RFC-018 independent architecture review.
4. Paulo implementation decision for Bootstrap V0.
5. Bounded implementation.
6. Failure-test execution.
7. Independent implementation review.
8. Separate Paulo S5 implementation authorization.
9. S5 implementation becomes Bootstrap Trial #1.
10. Revisit broader Context Plane CP-4+ only if trial evidence justifies it.

## Acceptance criteria

Bootstrap V0 cannot be accepted merely because token use falls.

Required:
- no authority-semantic weakening;
- no increase in scope violations;
- no increase in missed requirements;
- no stale governed publication that should have been rejected;
- no mixed-snapshot turn packet accepted as coherent;
- historical evidence preserved and discoverable;
- legacy handoff removed from mandatory startup and future append paths;
- active readers/writers migrated coherently;
- supported participants demonstrate safe freshness/publication behavior;
- failure tests pass;
- rollback path is verified.

## Implementation authority

None.

This RFC is a design proposal only.
No provider-file rewrite, CURRENT_HANDOFF creation, checker script, protocol migration, S5 executable code, S6+, remote resource, deployment, production write, or main merge is authorized until a later Paulo decision following independent review.
