# Architect Review — SENTINEL Context Plane Bootstrap V0 Stage A

Architect Sync: ML-DEVOS-AS-079
Status: CHANGES_REQUESTED
Review mode: INDEPENDENT PRE-CUTOVER IMPLEMENTATION REVIEW
Cycle: SENTINEL_CONTEXT_PLANE_BOOTSTRAP_V0_IMPLEMENTATION
Authority: D-062
Reviewed snapshot: 02169f4008689365ab67dee4f27c2f2b729f3d78
Reviewed Builder input base: 93a66b7fd5c0815f7e950768de9292c46779b420
Target design: ML-DEVOS-RFC-018
Implementation stage: Stage A — PRE-CUTOVER
Remediation cycle requested: 1 of 2

## Verdict

STAGE A DIRECTION: ACCEPTED
STAGE A SCOPE COMPLIANCE: PASS
STAGE A BASELINE: ACCEPTED AS BUILDER-REPORTED BASELINE
STAGE A OBLIGATION INVENTORY: ACCEPTED AS A CANDIDATE, SUBJECT TO THE TWO CHECKER FIXES BELOW
STAGE B ACTIVATION: NOT YET OPEN

The Stage-A implementation is materially on the correct path and remains pre-cutover. No CURRENT_HANDOFF is active, the legacy handoff is still the operative path, and no reader/writer migration has occurred.

Two load-bearing checker defects must be corrected before the protocol may activate. One review-identity policy is also resolved here so Stage B has an unambiguous migration rule.

## Independent publication / scope verification

The Builder result is exactly one commit ahead of the authorized D-062 base and directly parented to it:

- base: `93a66b7fd5c0815f7e950768de9292c46779b420`
- result: `02169f4008689365ab67dee4f27c2f2b729f3d78`

Changed files are confined to the D-062 Stage-A surface:
- `brain/protocols/CONTEXT_BOOTSTRAP.md`
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/OPERATIVE_OBLIGATIONS.md`
- `coordination/STATE.md`
- `coordination/archive/handoffs/README.md`
- deterministic traceability outputs
- `scripts/check-context-bootstrap.mjs`
- `tests/context-bootstrap.test.mjs`

No CURRENT_HANDOFF was created. No AGENTS/CLAUDE/active protocol/skill/provider-bridge migration occurred. No S5/S6+, product/runtime, credential, remote-resource, deployment, production, protected/main, or PR #10 mutation occurred.

The Builder's command/test results remain ACTOR_REPORTED. Source, branch ancestry, changed-file scope, protocol text, obligation inventory, archive scaffold, and key checker logic were independently inspected.

## Accepted Stage-A results

### Baseline

Accept `CBV0-BASELINE-PRE-1` as the Builder-reported pre-cutover baseline for later comparison:

- CLAUDE.md declared mandatory startup set: 11 files / 579,438 bytes;
- brain/00_HOME.md declared read order: 16 files / 348,694 bytes;
- union: 20 files / 876,890 bytes;
- legacy IMPLEMENTER_HANDOFF: 515,669 bytes / 3,969 lines / 63 history sections;
- 7 duplicated startup reads across the two lists;
- 10 operative instruction surfaces still referencing the legacy handoff.

Token figures remain estimates, not provider-reported usage.

### Candidate obligation inventory

The candidate inventory is sufficiently grounded for continued pre-cutover work. It captures:
- S5 pause/separate owner gate;
- Stage-B migration obligations;
- post-cutover measurement and rollback obligations;
- participant publication demonstrations;
- queued Model Router / CP-4+ non-authority;
- known traceability debt;
- production-release / PR #10 gates;
- open website risks and tests.

The inventory remains non-authoritative navigation. Its transition semantics must be tightened by AS79-F002 below.

### Archive scaffold

The deterministic CURRENT_HANDOFF archive layout is acceptable:
- immutable byte-exact payload;
- deterministic ID-derived path;
- source commit/blob + SHA-256 sidecar;
- collision fails closed;
- archive and replacement belong in one candidate transition.

## AS79-F001 — BLOCKER — publication path is not exact-old-value CAS

The checker currently performs:

1. `ls-remote` to verify the current tip equals `expectedParent`;
2. then a plain fast-forward `git push`.

That closes the common "remote advanced" race because a descendant advancement causes non-fast-forward rejection, but it does **not** satisfy RFC-018's exact expected-tip publication contract under all ref movements.

If the remote ref is moved backward to an ancestor after the last `ls-remote` and before the push, the stale candidate can still be a valid fast-forward from that rewound ref and the plain push can succeed even though the remote no longer equals `expectedParent`.

This is not merely theoretical in the current repository: the governance branch is not itself a server-side CAS lease, and RFC-018 explicitly requires the publication call itself to reject when the current ref is not the expected value.

### Required remediation

For the Git-native adapter, implement an **explicit expected-old-value lease** on the exact branch ref.

Recommended mechanism:

`git push --force-with-lease=refs/heads/<branch>:<expectedParent> ... <candidate>:refs/heads/<branch>`

Important constraint: this is used only as an expected-old-value compare-and-swap guard. The checker must continue to prove before the push that:
- the candidate has exactly one parent;
- that parent equals `expectedParent`.

Therefore the permitted update remains a fast-forward child of the exact expected tip; the lease must never be used to authorize a non-fast-forward history rewrite.

Add a real git failure test:
- final prepublication read sees T;
- remote is then deliberately rewound to an ancestor of T;
- candidate remains direct child of T;
- publication must fail because the lease expected T, even though an ordinary plain push would otherwise be a fast-forward from the rewound ref.

Update the protocol text so the previously disclosed "remote rewind" gap is no longer an accepted limitation.

## AS79-F002 — BLOCKER — unresolved obligation meaning can be silently rewritten

`checkObligationCarryForward()` currently guarantees that an unresolved OBL ID remains present, but it does not verify that the obligation text and authoritative source remain the same.

A later transition could therefore keep `OBL-001` while changing its meaning/source and still pass. That violates RFC-018 B018-04's requirement to preserve each unresolved obligation unless it is explicitly closed or superseded.

### Required remediation

For each previously `OPEN` or `DEFERRED` row:

- if the next row remains `OPEN` or `DEFERRED`, require the obligation text and authoritative-source cells to remain byte-for-byte identical;
- if the next row becomes `CLOSED` or `SUPERSEDED`, require a non-empty closure/supersession reference;
- disappearing unresolved IDs remain a hard failure;
- existing CLOSED/SUPERSEDED historical rows may follow the RFC's bounded active-index policy, but must not be used to erase still-operative obligations.

Add explicit tests for:
- same OBL ID, changed obligation text → reject;
- same OBL ID, changed authoritative source → reject;
- unresolved → CLOSED/SUPERSEDED with citation → accept;
- unresolved → CLOSED/SUPERSEDED without citation → reject.

Do not turn this into a resolver or semantic inference engine.

## AS79-R001 — review identity policy resolved for Stage B

OBL-008 correctly discovered that pre-cutover `ML-DEVOS-AS-078` was reused across several changing rolling-review contents. That historical behavior predates activation of the immutable-ID rule and must not continue after cutover.

Architect resolution for Bootstrap V0:

> **Every published ARCHITECT_REVIEW revision after V0 activation gets a new immutable ML-DEVOS-AS-NNN identifier.**

Rules:
- do not reuse one Architect Sync ID for changed review bytes;
- archive the outgoing review under its own immutable ID before/atomically with replacement;
- the replacement review mints the next available immutable AS ID;
- `APPLICABLE_REVIEW_ID` points only to that immutable published review ID;
- no revision suffix/sub-ID scheme is introduced in V0;
- historical AS-078 remains preserved as-is; do not rewrite history.

This is an implementation choice within RFC-018's already-approved immutable review-ID contract, not an architecture expansion.

During remediation:
- update `CONTEXT_BOOTSTRAP.md` to state this rule;
- update OBL-008 to record that the **decision** is resolved by AS-079 while the Stage-B migration work remains carried by the existing Stage-B migration obligation or a new explicitly linked implementation obligation;
- do not rewrite old AS-078 content.

## Actor-reported verification disposition

The reported 44/44 focused tests, mutation checks, 544/544 full suite, baseline output, and traceability runs are useful evidence but remain ACTOR_REPORTED.

The focused test file does contain direct coverage for:
- identity mismatch;
- stale review identity;
- exact review target;
- duplicate handoff IDs;
- omitted obligations;
- concurrent publishers;
- timeout/read-back reconciliation;
- retry exhaustion;
- stale-session protocol version;
- archive collision;
- rollback fixture behavior.

However AS79-F001 and AS79-F002 demonstrate that passing tests did not yet cover two required adversarial cases.

## Remediation Cycle 1 — PRE-CUTOVER ONLY

Correct only AS79-F001, AS79-F002, and AS79-R001.

Authorized files:
- `scripts/check-context-bootstrap.mjs`;
- `tests/context-bootstrap.test.mjs`;
- `brain/protocols/CONTEXT_BOOTSTRAP.md`;
- `coordination/OPERATIVE_OBLIGATIONS.md`;
- `coordination/IMPLEMENTER_HANDOFF.md` for remediation evidence;
- `coordination/STATE.md`;
- deterministic traceability outputs only if regeneration changes them.

Do not create CURRENT_HANDOFF.
Do not activate PROTOCOL_VERSION.
Do not migrate readers/writers.
Do not edit AGENTS.md / CLAUDE.md / active coordination protocol / canonical skills / provider bridges.
Do not begin Stage B.
Do not implement S5, CP-4+, or Model Router.

## Return gate

After the bounded remediation:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- AUTHORIZED_SCOPE: RFC018_BOOTSTRAP_V0_PRECUTOVER_REMEDIATION_REVIEW_ONLY
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO
- CURRENT_REMEDIATION_CYCLE: 1
- MAX_REMEDIATION_CYCLES: 2

Return exact changed files, exact tests/checks and exit codes, traceability fingerprint if run, and no unrelated cleanup.

If this remediation closes the two blockers, Architect may open Stage B under D-062 without another Paulo decision.

## Hard boundaries

All D-062 prohibitions remain in force:
- no Stage B activation;
- no CURRENT_HANDOFF;
- no S5/S6+;
- no CP-4+;
- no Model Router implementation;
- no credentials/remote D1/R2;
- no Cloudflare/DNS/deploy/production/rollback mutation;
- no public D1 cutover;
- no protected/main merge;
- no PR #10 merge or auto-merge.
