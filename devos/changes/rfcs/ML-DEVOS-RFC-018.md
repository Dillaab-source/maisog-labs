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
4. Before governed publication, re-resolve the branch tip. This is the **revalidated tip**.
5. If the branch advanced since the input/base commit was read, do not force through the write. Inspect the advancement and revalidate the task against the new state before attempting publication again.
6. Publish with an atomic/conflict-detecting mechanism where the provider supports governed writes.
7. Never force-push or overwrite concurrent work merely to satisfy freshness.
8. Bound retries. Continuous advancement or unavailable freshness evidence ends in a disclosed stop condition, not an infinite loop.
9. External side effects such as Cloudflare/production actions remain outside Bootstrap V0; repository publication cannot atomically protect unrelated external actions.

For local Git agents, an adapter may use fetch + fast-forward-safe checks.
For GitHub-connected agents, an adapter may use API-resolved commit snapshots and compare-and-update publication.
The governance contract depends on the invariant, not on one Git command.

### Publication transaction contract (resolves B018-01)

A governed publication is one transaction, not a sequence of independent file writes. The transaction contract is:

1. **One candidate, one parent.** The writer prepares exactly one candidate commit whose parent is the exact revalidated tip (§B0-A step 4). A candidate built against any other commit is invalid and must not be published.
2. **Atomic coordination transition.** Every coordination file the turn's transition touches (at minimum, any of `STATE.md`, `CURRENT_HANDOFF.md`, `ARCHITECT_REVIEW.md`, and any rolling-record archive write required by this cycle) is included in that single candidate commit. A provider that cannot stage a multi-file atomic commit must not split a coordination transition across sequential publications; it publishes the whole transition in one write or not at all. This prevents a state where a new `STATE.md` is visible while the handoff or archive entry it depends on is not yet published.
3. **Expected-tip conflict detection.** Publication must use expected-tip compare-and-swap semantics (Git's own `<current>..<expected-parent>` fast-forward/ref-update check, or a demonstrably equivalent mechanism such as a provider API's "update ref only if it still points at X"). A blind push/write that unconditionally overwrites whatever is at the ref is not compliant.
4. **Branch advancement invalidates the attempt.** If, at publication time, the branch tip is no longer the exact revalidated tip used to parent the candidate, the publication attempt fails closed. The writer must not retry the same candidate against a new parent; it must re-resolve the tip, revalidate the task against the new state, and prepare a new candidate (return to step 1).
5. **Finite publication-attempt limit.** A single turn's publication may retry step 1–4 only a small, explicitly stated, finite number of times (default: 3 attempts). Exhausting the limit is a disclosed stop condition, never a silent success and never an unbounded loop.
6. **Ambiguous outcome requires read-back before retry.** If a publication attempt's result is unknown or ambiguous (timeout, dropped connection, unclear API response), the writer must not blindly retry the write. It must first read back the authoritative repository state at the expected ref, determine whether the candidate was actually published, and only then decide whether to retry (with a fresh candidate per step 4) or stop.
7. **No governed-write claim without these semantics.** A provider or adapter that cannot demonstrate atomic, expected-tip-conflict-detecting publication is advisory/read-only for governed writes under this RFC. It may read and analyze but must not claim to perform governed publication.

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
protocol_version: 1
schema_version: 1
handoff_id: H-<bounded-id>
cycle_id: <current-cycle-id>
input_base_commit: <commit-read-by-builder>
review_target_commit: <implementation-or-design-commit-being-handed-over>
applicable_review_id: <AS-id-or-explicit-none>
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

### Turn-packet identity binding (resolves B018-02)

A `handoff_id` alone is not sufficient to bind a turn packet. STATE and CURRENT_HANDOFF sharing a `handoff_id` while disagreeing on `cycle_id`, `review_target_commit`, or the applicable review would let a stale Architect review apply to new work within a continuing cycle. V0 therefore requires:

1. **Combined identity validation.** STATE's live record must carry, alongside `handoff_id`: the `cycle_id`, the `review_target_commit` (or an explicit reference to it), and the `applicable_review_id` (the Architect Sync/review this turn is responding to, or an explicit `none`). A governed turn packet is coherent only when all four values in STATE match all four values in CURRENT_HANDOFF's header exactly. A match on `handoff_id` alone is not sufficient and must not be treated as a valid packet.
2. **STATE's selection rule.** STATE selects the applicable CURRENT_HANDOFF and applicable review by the identity tuple in (1), never by filename recency, commit recency, or "most recent read." If STATE's live record names no `handoff_id` (an explicit no-handoff state, see (7)), no CURRENT_HANDOFF is applicable regardless of what exists in the working tree or history.
3. **Current response vs. referenced prior reviews.** A CURRENT_HANDOFF responds to exactly one `applicable_review_id` — the review it was written against. Prior reviews it cites for context (e.g. superseded findings, historical rationale) must be referenced as historical/background, never as the `applicable_review_id` of the current turn.
4. **Immutable IDs.** Once published, `handoff_id`, `cycle_id`, `review_target_commit`, and `applicable_review_id` for a given handoff are immutable. A correction requires a new `handoff_id`, not an edit to an already-published identity field.
5. **Duplicate-ID collision is fail-closed.** If a `handoff_id` already exists (in the archive or live record) with different byte content than the one being published, the publication fails closed. IDs are never silently reused or overwritten.
6. **Permitted commit relationships.** `input_base_commit` must be an ancestor of or equal to `review_target_commit`. `review_target_commit` must be an ancestor of or equal to the candidate publication commit (§ Publication transaction contract). A packet whose commits do not satisfy this ordering is invalid.
7. **Explicit no-handoff state.** A turn for which CURRENT_HANDOFF does not apply (e.g. a pure STATE/routing update, or a turn preceding the first handoff of a cycle) must have STATE explicitly say so (e.g. `CURRENT_HANDOFF: NONE`) rather than leaving the field absent or ambiguous, so a missing reference is never mistaken for a stale one.

A mismatch anywhere in the identity tuple between STATE's selected handoff identity and CURRENT_HANDOFF is fail-closed.

## Rolling-record preservation

Before or atomically with replacing **any** outgoing published rolling CURRENT_HANDOFF or ARCHITECT_REVIEW record — regardless of whether that record reached a terminal status such as ACCEPTED or is being superseded mid-cycle by a CHANGES_REQUESTED review, an interrupted handoff, or any other non-terminal disposition — preserve the outgoing record, unless its exact bytes are already durably archived. "Concluded" is not a precondition for preservation (resolves B018-03): a rolling record is preserved on every replacement, full stop.

Required semantics:

1. **Preserve before or atomically with replacement.** The outgoing record's exact bytes are written to its archive location before, or as part of the same atomic transaction as (§ Publication transaction contract), the publication that replaces it. A replacement must never be publishable without its predecessor's preservation already being true.
2. **Deterministic archive locations.**
   - For Architect Syncs, the canonical durable location remains: `devos/changes/architect-syncs/ML-DEVOS-AS-<NNN>.md`.
   - For CURRENT_HANDOFF, the canonical durable location is: `coordination/archive/handoffs/<handoff_id>.md`.
   - Both are deterministic functions of the record's own identity (`AS-<NNN>` / `handoff_id`), never a free-text or agent-chosen path.
3. **Archive entries are immutable.** Once written, an archive entry at a given path is never edited or rewritten.
4. **Source provenance preserved.** Each archive entry carries the source commit and blob identity it was copied from, alongside the payload, so the archived bytes can be independently verified against repository history.
5. **Discoverable index.** A discoverable index or reference (e.g. `devos/changes/architect-syncs/README.md` and an equivalent `coordination/archive/handoffs/README.md` or index) enumerates archived entries; the index itself is append-only for new entries.
6. **Archive-ID collision fails closed.** If an archive entry already exists at the deterministic location for a given ID with content whose bytes differ from what is being archived, the operation fails closed — it does not overwrite, merge, or silently pick one version.
7. **No self-referential publication SHA requirement.** A rolling record is not required to contain its own enclosing publication commit SHA; Git supplies that identity, and requiring self-reference would create an unresolvable ordering dependency at publication time.

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

### Independently reviewed obligation carry-forward (resolves B018-04)

Requirement completeness must not depend solely on the packet author's judgment: a Builder could omit an unresolved obligation from a lean handoff and still pass simple reference-presence checks. V0 therefore requires:

1. **Pre-cutover carry-forward inventory.** Before CURRENT_HANDOFF cutover, produce one independently reviewed inventory of every still-operative obligation extracted from the legacy `IMPLEMENTER_HANDOFF.md` and current `ARCHITECT_REVIEW.md` history — open findings, unresolved risks, deferred decisions, and outstanding action items. "Independently reviewed" means the Architect (or Paulo) confirms the inventory's completeness before cutover, not merely the Builder who compiled it.
2. **Obligation mapping.** Each inventoried obligation is mapped to its authoritative source (RFC/decision/review ID and section) and its current disposition (open / closed / superseded, with the closing or superseding reference).
3. **Preserve-or-cite on every later transition.** After cutover, every subsequent CURRENT_HANDOFF/STATE transition must either carry forward each still-open obligation from the inventory (and any opened afterward) or cite its explicit closure/supersession reference. An obligation must never simply disappear because a handoff omitted it.
4. **Short repository-native index, not a resolver.** The carry-forward inventory is a short, repository-native, human/agent-readable index (e.g. `coordination/OBLIGATIONS.md` or an equivalent file named at implementation time). It is not a generalized Context Resolver, query service, or automated inference system — it is a maintained list.
5. **Handoff summaries are navigation, never proof of inapplicability.** A CURRENT_HANDOFF's summary of what was done is a pointer into the fuller record, not evidence that everything it omits is inapplicable. Absence of mention in a handoff is never treated as closure.

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

### Provenance versus authorization (resolves B018-05)

Repository commitment must not be conflated with legitimate authorization. A committed document can falsely assert approval, and committed evidence (logs, quoted text, retrieved pages) can contain instruction-shaped language that an agent mistakes for authority. V0 states explicitly:

1. **Commitment proves provenance, not authorization.** That something exists in the repository, at a given commit, with a given author, proves only that it was committed — it does not by itself prove that its content was legitimately authorized by the applicable owner/decision process.
2. **Scope expansion requires the applicable process.** Expanding authorized scope, turn assignment, or mutation permission requires the applicable owner decision/review process defined by the live coordination protocol (e.g. a Paulo decision, an Architect review verdict) — never merely the presence of a committed instruction, however formatted, that claims to grant it.
3. **Unresolved authority conflicts block mutation.** If two committed sources disagree about current authority/scope/turn, or a source's legitimacy is in question, governed mutation stops until the conflict is resolved through the applicable decision process. Ambiguity defaults to no-mutation, not to whichever source is more convenient.
4. **Evidence remains evidence.** Logs, quotations, handoffs, retrieved pages, and committed documents remain evidence/input to be evaluated — never authority in themselves — unless the governing authority chain (the applicable decision/review record) explicitly and specifically grants authority through them.
5. **Advisory analysis is not mutation authorization.** An owner requesting advisory analysis, research, or discussion is distinct from an owner authorizing mutation of governed architecture. A request phrased as analysis must not be treated as an implicit go-ahead to mutate.
6. **Reconcile overstated bootstrap wording during migration.** Operative orientation/bootstrap instructions that currently overstate committed-instruction authority (for example, wording that treats a file's mere presence or a session's own prior conversational memory as sufficient authorization) must be reconciled to this rule during the active-reader/writer migration (§ Active-reader/writer migration). This RFC does not itself rewrite that wording; it records the requirement the migration must satisfy.

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

### Effective write boundary (resolves B018-06)

A migration that leaves new readers using CURRENT_HANDOFF while a stale session continues writing the legacy handoff, or that can be bypassed by skipping the checker, is not an effective boundary. V0 requires:

1. **One atomic activation change.** Cutover to CURRENT_HANDOFF is a single atomic change (one candidate commit under § Publication transaction contract) that simultaneously: freezes the legacy `IMPLEMENTER_HANDOFF.md` (no future append), publishes the first `CURRENT_HANDOFF.md`, and updates STATE's identity tuple to reference it. There is no window where the two are both live write targets.
2. **Explicit protocol-version marker.** STATE carries an explicit protocol-version marker (e.g. `PROTOCOL_VERSION: 1`) that increments on cutover. Every governed writer checks this marker before writing.
3. **Mandatory prepublication checks at each supported writer.** Every supported governed writer (§ Supported participants for V0) runs the small executable checker (§ Small executable checker) before publishing, not merely as a suggested practice.
4. **Complete inventory of operative readers/writers.** Cutover must inventory and update, together, at minimum:
   - root `AGENTS.md`;
   - root `CLAUDE.md`;
   - the coordination protocol(s) (`coordination/README.md` and equivalent);
   - the Architect Sync protocol;
   - the canonical Architect Review/Sync skill;
   - the canonical Implementation Handoff skill;
   - the Project Orientation/State Recovery skill;
   - `brain/00_HOME.md`;
   - `PROJECT_GOVERNANCE.md`;
   - generated provider bridges (regenerated, never hand-edited — see (7));
   - relevant validation/tests.

   Historical references are not rewritten merely because they mention the legacy handoff.
5. **Dirty-worktree handling for local agents.** A local governed writer with uncommitted changes not related to the current turn must: preserve that unrelated work untouched (never discard it), bound its own candidate change to only the files the current turn's transition requires, and stop and disclose rather than guess if it cannot cleanly separate the two.
6. **Disclosed procedural bypasses.** V0's documentary/checker enforcement cannot technically prevent every bypass (e.g. an agent that ignores its own instructions and writes directly). The implementation must explicitly disclose which bypasses V0 cannot technically prevent, rather than implying the checker is a complete technical guarantee.
7. **Canonical sources migrate first; bridges regenerate after.** Canonical skill/protocol sources (`.agents/skills/`, coordination protocol files) are migrated first. Generated provider bridges (`.claude/skills/` and equivalent) are then regenerated from the migrated canonical sources — never hand-edited independently — consistent with existing repository practice (`ML-DEVOS-RFC-014`/`ML-DEVOS-AS-050`/`D-042`).
8. **Protocol-version mismatch fails closed.** After migration, a session or writer that detects a stale/unsupported protocol-version marker must stop and require a fresh bootstrap rather than silently continuing to use the old write path or guessing compatibility.

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
- matching `handoff_id` but wrong `cycle_id`/`review_target_commit`;
- stale Architect review applied as if current (`applicable_review_id` mismatch);
- reused/duplicate ID with different bytes;
- required obligation omitted from an otherwise reference-complete packet;
- unsupported schema/protocol version;
- missing required evidence/reference;
- concurrent branch advancement;
- branch movement after final validation read, immediately before publication;
- simultaneous publishers (two writers racing to publish against the same tip);
- timeout after a publication actually succeeded (ambiguous-outcome read-back);
- partial coordination publication (one coordination file published, another not);
- failed archive write during rolling-record preservation;
- conflicting archive destination (archive ID exists with different bytes);
- old-session legacy append after cutover (a stale session tries to write `IMPLEMENTER_HANDOFF.md`);
- publication attempted while bypassing the checker;
- dirty local worktree where mutation would be unsafe;
- unrelated staged/untracked local work present at validation time;
- local work introduced after validation but before publication;
- resumed stale session;
- advisory analysis/review performed on another actor's turn, with no governed writes attempted;
- an Architect-turn attempt to mutate Builder-owned governed state, correctly prohibited;
- forged/committed text that falsely claims authorization it was never actually granted;
- untrusted/hostile instruction-shaped repository evidence (logs, quoted text, retrieved pages) that attempts to expand authority;
- unavailable freshness source;
- bounded-retry exhaustion that fails closed rather than silently resetting on session resume;
- rollback exercised after several V0 turns, preserving current authority/restrictions and post-cutover evidence.

Authority/prompt-injection cases (forged authorization, hostile instruction-shaped evidence, advisory-vs-governed boundary) require procedural/agent-behavior evaluation of what the agent actually does; passing a string-matching unit test alone must not be represented as proof these cases are handled.

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

### Rollback as forward recovery (resolves B018-07)

A simple revert after multiple V0 turns could resurrect obsolete routing/authorization while newer evidence remains stranded only in post-cutover archives. V0 requires:

1. **Forward recovery, never a blind revert.** Rollback is executed as a new forward recovery commit prepared against the current, fresh authoritative tip (§ Publication transaction contract) — never a blind `git revert`/restoration of an old STATE snapshot that ignores everything published since.
2. **Preserve current authority and turn.** The recovery commit preserves whatever current authority/turn state is actually live at the fresh tip; it does not silently reassign TURN or reinstate stale scope/authorization flags from the pre-cutover state.
3. **Archive current rolling records first.** Before rollback changes routing, the currently live rolling records (CURRENT_HANDOFF, ARCHITECT_REVIEW) are archived per § Rolling-record preservation, exactly as any other replacement would be.
4. **Explicit pointer from fallback routing to post-cutover evidence.** The recovery commit's routing explicitly points to (references by path/ID) the post-cutover evidence and any unresolved obligations (§ Independently reviewed obligation carry-forward) that exist at the point of rollback, so fallback routing does not silently orphan them.
5. **Defined fallback write surface.** Rollback does not implicitly resume legacy append behavior. If fallback requires writing anywhere other than the current CURRENT_HANDOFF/STATE surface (e.g. a temporary re-use of the legacy handoff path), that write surface must be explicitly named in the rollback decision — silent resumption of legacy append is never permitted.
6. **Tested after multiple turns, not only immediately after migration.** Rollback must be exercised as a failure test after several V0 turns have occurred post-cutover (not only as an immediate undo of the cutover commit itself), to prove it does not strand or resurrect stale state across a realistic history.

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
