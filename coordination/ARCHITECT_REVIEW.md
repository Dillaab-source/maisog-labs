# Architect Review — SENTINEL Context Plane Bootstrap V0

Architect Sync: ML-DEVOS-AS-078
Status: CHANGES_REQUESTED
Review mode: INDEPENDENT ARCHITECTURE STAGE GATE — REMEDIATION CYCLE 1 RE-REVIEW
Cycle: SENTINEL_CONTEXT_PLANE_BOOTSTRAP_V0_PROPOSAL
Authority: D-061
Reviewed snapshot: 960a01195624097178c3c84449aa7cb36a48bdcc
Target RFC: ML-DEVOS-RFC-018
Remediation cycle reviewed: 1 of 2
Remediation cycle requested: 2 of 2

## Verdict

RFC-018 DIRECTION: ACCEPTED
RFC-018 REMEDIATION CYCLE 1: SUBSTANTIALLY CORRECT
RFC-018 IMPLEMENTATION READINESS: CHANGES_REQUESTED
BOOTSTRAP IMPLEMENTATION: NOT AUTHORIZED
S5 IMPLEMENTATION: NOT AUTHORIZED

The Cycle 1 delta stayed inside the authorized design-remediation boundary and materially resolves the original review. B018-03 through B018-07 are closed. B018-01 is closed except for one exact-constant correction. B018-02 remains partially open because the RFC now requires machine validation of the applicable review identity but does not include that identity in the machine-readable CURRENT_HANDOFF header, and its permitted review-target relation is still broad enough to bind a stale target.

Only the two micro-remediations below are requested. Do not reopen any already-closed architecture area and do not begin implementation.

## Independent scope/delta verification

Reviewed base: `1ec52997f0d4f6ef98a15d33086c2c820166d503`
Reviewed result: `960a01195624097178c3c84449aa7cb36a48bdcc`

Observed result:
- exactly one Builder commit over the authorized base;
- changed files are limited to:
  - `devos/changes/rfcs/ML-DEVOS-RFC-018.md`;
  - `coordination/IMPLEMENTER_HANDOFF.md`;
  - `coordination/STATE.md`;
  - deterministic traceability outputs;
- no AGENTS.md / CLAUDE.md / skill / protocol / bridge migration;
- no CURRENT_HANDOFF creation;
- no checker/runtime implementation;
- no S5 implementation;
- no application/runtime/deployment/remote-resource mutation.

The Builder's execution/traceability command results remain ACTOR_REPORTED. Repository structure, commit parentage, changed-file boundary, and RFC text were independently inspected through GitHub.

## Original findings disposition

### B018-01 — Exact-tip atomic publication

Status: MOSTLY CLOSED; one exact-value correction required.

Closed:
- one candidate commit directly parented to the exact revalidated tip;
- complete coordination transition in one atomic candidate commit;
- mandatory expected-tip / compare-and-swap semantics;
- branch advancement invalidates the attempt and requires a fresh coherent snapshot;
- ambiguous write outcome requires authoritative read-back before retry;
- providers lacking the required publication primitive are advisory/read-only.

Remaining issue:
The RFC says V0 uses a "small integer (e.g. 3)" for the publication-attempt limit and leaves the exact number to implementation. The original finding required the publication contract itself to define a finite limit. A protocol constant cannot remain an example if independent writers must behave consistently.

Required Cycle 2 correction:
- define one exact V0 constant in the RFC, recommended:
  `MAX_PUBLICATION_ATTEMPTS = 3`;
- state that exhaustion is terminal for that governed publication attempt/session until a fresh bootstrap/new authorized attempt; it must not silently reset through resume.

### B018-02 — Complete turn-packet identity binding

Status: PARTIALLY CLOSED; one binding correction required.

Closed:
- joint binding concept for handoff/cycle/target/review;
- STATE explicitly selects current handoff and applicable review;
- immutable IDs;
- duplicate-ID/different-bytes rejection;
- explicit no-handoff state;
- input-base/target ancestry constraints.

Remaining issue 1 — machine-readable schema mismatch:
The RFC requires the checker to validate `handoff_id + cycle_id + review_target_commit + applicable-review identity`, but the CURRENT_HANDOFF minimum machine-readable header currently contains only:

`schema_version`
`handoff_id`
`cycle_id`
`input_base_commit`
`review_target_commit`

There is no machine-readable `applicable_review_id` (or equivalent exact field). A prose/body reference cannot reliably satisfy the mechanical tuple the checker is required to validate.

Remaining issue 2 — stale target still permitted:
The RFC currently allows `review_target_commit` to be any reachable commit at or after `input_base_commit`. That still permits a coherent-looking handoff to target an older commit while newer work is already at the branch tip.

Required Cycle 2 correction:
1. Add an explicit machine-readable applicable-review field to CURRENT_HANDOFF, e.g.
   `applicable_review_id: ML-DEVOS-AS-<NNN>`
   (or an explicitly defined rolling-review identity form where a durable ID is not yet available).
2. Define the corresponding explicit STATE field(s) so the tuple is mechanically comparable rather than inferred from prose.
3. For a Builder → Architect handoff transition, define:
   `review_target_commit == exact revalidated branch tip immediately before the atomic coordination-transition commit`.
   Therefore the atomic coordination-transition commit is directly parented to the exact commit the Architect is being asked to review. This avoids self-reference while preventing a stale review target.
4. Preserve the explicit no-handoff case for turns where that relationship does not apply.
5. Update the checker contract/failure tests only as necessary to reflect these exact semantics; do not broaden the checker.

### B018-03 — Rolling-record preservation

Status: CLOSED.

The revised RFC now makes preservation outcome-independent, gives deterministic archive locations, makes archived entries immutable, preserves source commit/blob provenance, requires discoverability, rejects archive-ID reuse with different bytes, and avoids self-referential publication SHA requirements.

### B018-04 — Operative-obligation carry-forward

Status: CLOSED.

The revised RFC requires a bounded independently reviewed carry-forward inventory at cutover, maps obligations to authoritative sources/dispositions, requires explicit preservation or closure/supersession, and keeps the artifact repository-native rather than creating a resolver service.

### B018-05 — Provenance versus authorization

Status: CLOSED.

The RFC now explicitly states that repository commitment proves provenance/existence rather than legitimate authorization, requires authority-chain tracing for scope expansion, blocks mutation on unresolved authority conflict, keeps evidence/instruction-shaped content non-authoritative by default, and distinguishes advisory analysis from governed mutation.

### B018-06 — Atomic reader/writer cutover

Status: CLOSED.

The RFC now defines one atomic activation, an explicit protocol-version marker, mandatory writer prepublication checks, the complete operative reader/writer inventory, dirty-worktree handling, disclosed procedural bypasses, canonical-skills-first migration, and stale-session stop/rebootstrap behavior.

### B018-07 — Forward rollback

Status: CLOSED.

Rollback is now a fresh forward-recovery publication rather than blind STATE restoration, preserves current authority/turn, archives outgoing rolling records, points fallback routing to post-cutover evidence/open obligations, requires an explicit fallback write surface, and requires multi-turn rollback testing.

## Failure-test review

The 20 exact additional cases from the original independent review are now present. The RFC also correctly states that forged-authorization / instruction-shaped-evidence cases require behavioral/procedural evaluation rather than being "proved" by string matching alone.

Cycle 2 may adjust only tests directly affected by the two corrections above:
- machine-readable applicable-review mismatch;
- stale review target despite otherwise valid ancestry;
- exact publication-attempt exhaustion behavior.

Do not add unrelated test architecture.

## Non-blocking implementation inputs — NOT Cycle 2 work

The later implementation review may consider the recent external/SU findings already discussed with Paulo:
- a compact turn fingerprint derived from the bound tuple;
- minimal context receipts;
- deterministic mandatory context plus bounded adaptive expansion.

These are not blockers to RFC-018 approval, are not authorized by this review, and must not be mixed into Cycle 2 unless separately required by the corrected RFC.

## Required Remediation Cycle 2 delta — FINAL CYCLE

Modify only:
- `devos/changes/rfcs/ML-DEVOS-RFC-018.md`;
- `devos/changes/rfcs/README.md` only if its summary becomes inaccurate;
- `coordination/IMPLEMENTER_HANDOFF.md` for Cycle 2 evidence;
- `coordination/STATE.md`;
- deterministic traceability outputs only if explicitly regenerated and changed.

Correct only:
1. exact publication-attempt constant/exhaustion semantics;
2. fully machine-readable applicable-review binding plus exact non-stale `review_target_commit` relationship.

Return with:
- exact changed files;
- exact section mapping for the two corrections;
- commands/checks and exit codes actually run;
- traceability fingerprint only if regenerated;
- `TURN: ARCHITECT`;
- `STATUS: READY_FOR_ARCHITECT`;
- `CURRENT_REMEDIATION_CYCLE: 2`;
- `MAX_REMEDIATION_CYCLES: 2`.

There is no Cycle 3. If a material blocker remains after Cycle 2, route it to Paulo rather than silently extending remediation.

## Hard boundaries

No Bootstrap V0 implementation.
No CURRENT_HANDOFF creation or cutover.
No AGENTS.md / CLAUDE.md / skill / protocol / bridge migration.
No checker/runtime implementation.
No executable S5 implementation.
No S6+.
No application/product runtime change.
No live credential or secret access.
No S3/S4 mutation.
No manifest, ADR, Sentinel-version, frozen-architecture, or CORE-rule mutation.
No remote D1/R2.
No Cloudflare Access, DNS, domain, deployment, or rollback mutation.
No production-data write.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.
