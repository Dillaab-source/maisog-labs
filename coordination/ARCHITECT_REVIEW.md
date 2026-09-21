# Architect Review — SENTINEL Context Plane Bootstrap V0

Architect Sync: ML-DEVOS-AS-078
Status: CHANGES_REQUESTED
Review mode: INDEPENDENT ARCHITECTURE STAGE GATE
Cycle: SENTINEL_CONTEXT_PLANE_BOOTSTRAP_V0_PROPOSAL
Authority: D-061
Reviewed snapshot: e03d833349bd0abf015f20b04200a2f872af9175
Target RFC: ML-DEVOS-RFC-018
Remediation cycle requested: 1 of 2

## Verdict

RFC-018 DIRECTION: ACCEPTED
RFC-018 IMPLEMENTATION READINESS: CHANGES_REQUESTED
BOOTSTRAP IMPLEMENTATION: NOT AUTHORIZED
S5 IMPLEMENTATION: NOT AUTHORIZED

The sequencing remains sound. Bootstrap V0 is still the correct bounded intervention before S5, but seven protocol contracts require precise remediation before implementation can be considered.

This review records the fresh independent Astra review supplied by Paulo. The review was performed against snapshot e03d833349bd0abf015f20b04200a2f872af9175; the branch was independently confirmed unchanged when this review was recorded.

## B018-01 — Publication lacks a precise transaction contract

Affected RFC sections:
- B0-A — Fresh Snapshot and Safe Publication Contract
- Small executable checker

Failure:
A writer can revalidate tip A, another writer can publish B, and the first writer can still publish without proving its candidate is directly based on the revalidated tip. Separate coordination-file writes can also expose a new STATE with an old handoff.

Required remediation:
1. Define one candidate commit directly parented to the exact revalidated tip.
2. Require the complete coordination transition to be published atomically in that candidate commit.
3. Require expected-tip conflict detection, or a demonstrably equivalent compare-and-swap mechanism.
4. Any branch advancement invalidates the publication attempt and requires a new coherent snapshot/revalidation.
5. Define a finite publication-attempt limit.
6. On ambiguous timeout/unknown write outcome, read back authoritative state before retrying.
7. A provider lacking these semantics is advisory/read-only for governed writes.

## B018-02 — handoff_id does not bind the complete turn packet

Affected RFC sections:
- STATE and CURRENT_HANDOFF relationship
- Snapshot-consistent reads

Failure:
STATE and CURRENT_HANDOFF can share a handoff_id while disagreeing on cycle, target, or applicable review. A stale Architect review can be applied to new work within a continuing cycle.

Required remediation:
1. Validate handoff_id, cycle_id, review_target_commit, and applicable review identity together.
2. Define how STATE selects the applicable handoff and review.
3. Distinguish the current response handoff from prior referenced reviews.
4. Make IDs immutable.
5. Reject duplicate IDs with different bytes/content identity.
6. Define permitted input_base_commit / review_target_commit relationships.
7. Define an explicit no-handoff state for turns where CURRENT_HANDOFF does not apply.

## B018-03 — Rolling-record preservation is conditional and underspecified

Affected RFC section:
- Rolling-record preservation

Failure:
A CHANGES_REQUESTED review or interrupted handoff could be overwritten because it is not considered "concluded."

Required remediation:
1. Preserve every outgoing published rolling record before or atomically with replacement, unless its exact bytes are already durably archived.
2. Define deterministic archive locations.
3. Archive entries are immutable.
4. Preserve source commit/blob provenance alongside the payload.
5. Maintain a discoverable index/reference.
6. If an archive ID already exists with different bytes, fail closed.
7. Do not require a rolling record to contain its own publication SHA.

## B018-04 — Requirement completeness depends on the packet author

Affected RFC section:
- Current-context completeness

Failure:
A Builder can omit an unresolved obligation from the lean packet and still satisfy simple reference-presence checks.

Required remediation:
1. Before cutover, create one independently reviewed carry-forward inventory of still-operative obligations.
2. Map each obligation to its authoritative source and current disposition.
3. Later transitions must preserve unresolved obligations or cite explicit closure/supersession.
4. Keep this as a short repository-native index; do not introduce a resolver service.
5. Treat handoff summaries as navigation only, never as proof that omitted requirements are inapplicable.

## B018-05 — Repository provenance is not sufficiently separated from authorization

Affected RFC sections:
- Stable kernel
- Advisory versus governed operational mode
- Small executable checker

Failure:
A committed document can falsely assert approval, or committed evidence can contain instruction-shaped text that an agent mistakes for authority.

Required remediation:
1. State explicitly: repository commitment proves provenance/existence, not legitimate authorization.
2. Scope expansion requires the applicable owner decision/review process, not merely a committed instruction.
3. Unresolved authority conflicts block governed mutation.
4. Logs, evidence, quotations, handoffs, retrieved pages, and committed documents remain evidence/input unless the governing authority chain explicitly grants authority.
5. Owner-requested advisory analysis is distinct from owner authorization to mutate governed architecture.
6. Reconcile operative orientation/bootstrap wording that overstates committed-instruction authority during implementation migration.

## B018-06 — Migration lacks an effective write boundary

Affected RFC sections:
- Active-reader/writer migration
- Small executable checker
- Supported participants for V0

Failure:
New readers can use CURRENT_HANDOFF while a stale session continues writing the legacy handoff or bypasses the checker.

Required remediation:
1. Define one atomic activation change.
2. Introduce an explicit protocol-version marker.
3. Require mandatory prepublication checks at each supported governed writer.
4. Inventory all operative readers/writers, including:
   - AGENTS.md
   - CLAUDE.md
   - coordination protocol
   - Architect Sync protocol
   - Architect Review skill
   - Implementation Handoff skill
   - Orientation/State Recovery skill
   - brain/00_HOME.md
   - PROJECT_GOVERNANCE.md
   - generated provider bridges
   - relevant tests
5. Define dirty-worktree handling for local agents: preserve unrelated work, bound candidate changes, stop on uncertainty.
6. Disclose procedural bypasses V0 cannot technically prevent.
7. Canonical skill sources migrate first; generated bridges are regenerated from canonical sources.
8. Old sessions encountering a protocol-version mismatch must stop and bootstrap fresh.

## B018-07 — Rollback can restore obsolete state or strand new evidence

Affected RFC section:
- Rollback

Failure:
A simple revert after multiple V0 turns can resurrect obsolete routing/authorization while newer evidence remains only in post-cutover archives.

Required remediation:
1. Rollback is a forward recovery commit against a fresh tip, never a blind revert of current STATE.
2. Preserve current authority and turn state.
3. Archive current rolling records before changing routing.
4. Provide an explicit pointer from fallback routing to post-cutover evidence and unresolved obligations.
5. Define the fallback write surface: legacy append must not silently resume unless explicitly specified.
6. Test rollback after multiple V0 turns, not only immediately after migration.

## Existing-governance conflicts to reconcile during implementation design

The independent review identified operative conflicts in:
- CLAUDE.md
- coordination protocol
- Architect Sync protocol
- Architect Review skill
- Orientation/State Recovery skill
- Implementation Handoff skill and handoff format
- brain/00_HOME.md
- PROJECT_GOVERNANCE.md
- canonical skill tests
- generated provider bridges

Important examples:
- legacy handoff read/write requirements;
- provider names encoded as role holders;
- request-independent TURN gating that blocks advisory analysis;
- instructions that overstate committed content as authority;
- a stale remediation-cap statement of 3 where current STATE uses 2;
- references to a "State protocol" section absent from current STATE.

These are migration inputs, not permission to modify them in this design remediation.

## Required failure-test additions

Add exact cases for:
- matching handoff ID but wrong cycle/target;
- stale Architect review;
- reused ID with different bytes;
- required obligation omitted from an otherwise valid packet;
- branch movement after final read;
- simultaneous publishers;
- timeout after successful publication;
- partial coordination publication;
- failed archive write;
- conflicting archive destination;
- old-session legacy append;
- publication bypassing checker;
- unrelated staged/untracked work;
- local work introduced after validation;
- advisory review on another actor's turn with no writes;
- Architect turn where mutation remains prohibited;
- forged committed authorization;
- hostile instruction-shaped repository evidence;
- rollback after several turns preserving current restrictions;
- exhausted publication retries that cannot silently reset through session resume.

Authority/prompt-injection cases require procedural/agent evaluation; string tests alone are insufficient.

## Non-blocking improvements

1. Add a soft CURRENT_HANDOFF size target with reference-based overflow; never drop obligations to satisfy size.
2. Version baseline measurements so before/after comparisons remain meaningful.
3. Preserve D-060 planning history, but operative entrypoints must clearly treat its former "current live cycle" wording as historical.

## Required Remediation Cycle 1 delta

Modify only:
- devos/changes/rfcs/ML-DEVOS-RFC-018.md
- devos/changes/rfcs/README.md only if its summary becomes inaccurate
- coordination/IMPLEMENTER_HANDOFF.md only to record the bounded remediation evidence
- coordination/STATE.md
- deterministic traceability outputs only if regeneration is explicitly run and changes them

Do not implement Bootstrap V0.

Do not modify:
- AGENTS.md
- CLAUDE.md
- canonical skills
- generated bridges
- coordination protocols
- brain/00_HOME.md
- PROJECT_GOVERNANCE.md
- S5/S6+ runtime surfaces

Return with:
- exact B018-01..B018-07 finding-to-section mapping;
- exact changed files;
- any validator/traceability commands and exit codes actually run;
- before/after traceability fingerprint if regenerated;
- TURN: ARCHITECT;
- STATUS: READY_FOR_ARCHITECT;
- CURRENT_REMEDIATION_CYCLE: 1.

## Hard boundaries

No Bootstrap V0 implementation.
No CURRENT_HANDOFF cutover.
No provider/bootstrap/skill/protocol migration.
No checker/runtime implementation.
No executable S5 implementation.
No S6+.
No application/product runtime change.
No live credential/secret access.
No S3/S4 mutation.
No manifest/ADR/version/frozen-architecture/CORE-rule mutation.
No remote D1/R2.
No Cloudflare Access/DNS/domain/deployment/rollback mutation.
No production-data write.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.
