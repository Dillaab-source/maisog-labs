# MaisogLabs Agent Coordination State

CYCLE_ID: SENTINEL_CONTEXT_PLANE_BOOTSTRAP_V0_IMPLEMENTATION
TURN: CLAUDE
STATUS: AUTHORIZED_IMPLEMENTATION
AUTHORIZED_SCOPE: RFC018_BOOTSTRAP_V0_ATOMIC_ACTIVATION_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: NO
AUDIT_APPEND_AUTHORIZED: NO
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-062 authorizes bounded implementation of Architect-approved ML-DEVOS-RFC-018.

ML-DEVOS-AS-080 closes the Stage-A pre-cutover remediation blockers and opens Stage B atomic activation under that same D-062 authority.

This state authorizes Stage B activation only.

S5 executable implementation remains paused and unauthorized.
Context Plane CP-4+ remains unauthorized.
SENTINEL Model Router V0 remains queued post-pilot only and unauthorized.

## Stage B objective — ONE ATOMIC ACTIVATION

Perform one coordinated cutover from the legacy handoff protocol to Context Bootstrap V0.

Start from one exact authoritative snapshot. Build one candidate commit directly parented to the exact revalidated tip. Do not perform a rolling/file-by-file activation.

The activation commit must:
- add `PROTOCOL_VERSION: 1`;
- create/activate `coordination/CURRENT_HANDOFF.md`;
- set matching STATE/CURRENT_HANDOFF identity fields;
- bind `APPLICABLE_REVIEW_ID` to `ML-DEVOS-AS-080`;
- bind `REVIEW_TARGET_COMMIT` to the activation commit's exact parent;
- return TURN to ARCHITECT for final implementation review;
- activate the reviewed operative-obligation index;
- freeze the legacy IMPLEMENTER_HANDOFF byte-for-byte and remove active startup/future-append dependencies on it;
- migrate every active reader/writer named by RFC-018 coherently;
- update canonical skills first and regenerate provider bridges;
- preserve exact-tip/CAS, immutable review-ID, archive, stale-session, obligation, and rollback semantics.

## Read first

1. this `coordination/STATE.md`;
2. `coordination/ARCHITECT_REVIEW.md` (ML-DEVOS-AS-080);
3. `devos/changes/rfcs/ML-DEVOS-RFC-018.md`;
4. `brain/protocols/CONTEXT_BOOTSTRAP.md`;
5. `coordination/OPERATIVE_OBLIGATIONS.md`;
6. only the exact Stage-B reader/writer surfaces named below.

Do not preload the historical IMPLEMENTER_HANDOFF. It is now evidence to freeze, not the active context source. Read its blob identity/size only as needed to prove byte-for-byte preservation.

## Authorized Stage-B surfaces

- AGENTS.md
- CLAUDE.md
- coordination/README.md
- coordination/STATE.md
- new coordination/CURRENT_HANDOFF.md
- coordination/OPERATIVE_OBLIGATIONS.md
- coordination/archive/handoffs/** only as required by the V0 protocol
- brain/00_HOME.md
- brain/PROJECT_GOVERNANCE.md
- brain/ARCHITECT_HANDOFF.md
- brain/protocols/ARCHITECT_SYNC.md
- brain/protocols/CONTEXT_BOOTSTRAP.md
- .agents/skills/architect-review-sync/**
- .agents/skills/implementation-handoff/**
- .agents/skills/project-orientation-state-recovery/**
- regenerated matching .claude/skills/** bridge files only
- scripts/check-context-bootstrap.mjs
- tests/context-bootstrap.test.mjs
- tests/skills.test.mjs and directly necessary context/coordination tests only
- deterministic traceability outputs only if regeneration changes them

Do NOT edit coordination/IMPLEMENTER_HANDOFF.md. Its pre-cutover bytes are frozen.

## Required machine-readable activation state

The activation commit must return:

- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `AUTHORIZED_SCOPE: RFC018_BOOTSTRAP_V0_FINAL_IMPLEMENTATION_REVIEW_ONLY`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`
- `PAULO_DECISION_REQUIRED: NO`
- `PROTOCOL_VERSION: 1`
- `CURRENT_HANDOFF: ACTIVE`
- `HANDOFF_ID: <new immutable H-*>`
- `REVIEW_TARGET_COMMIT: <exact activation parent>`
- `APPLICABLE_REVIEW_ID: ML-DEVOS-AS-080`
- all remote/deploy/main flags NO

CURRENT_HANDOFF must carry the matching tuple and required sections from CONTEXT_BOOTSTRAP.md.

## Migration reconciliations

Resolve only the already-approved inputs:
- remove mandatory legacy-handoff reads/writes;
- role semantics over provider-name identity where needed;
- allow advisory read-only analysis without granting mutation authority;
- provenance != authority wording;
- live remediation cap consistency;
- remove/fix nonexistent STATE-protocol references;
- historicalize D-060's old live-cycle wording;
- implement OBL-022 immutable review IDs in Architect writer surfaces.

## Verification and publication

Run the focused Context Bootstrap tests, relevant skills/coordination tests, bridge validator/generator as required, checker at the candidate snapshot, traceability if needed, and prove the legacy handoff blob is byte-identical before/after.

Publish only with the exact-tip V0 publication contract. If the provider cannot perform the required exact-old-value lease/CAS, stop and leave the candidate unpublished.

## Return gate

After successful atomic publication, stop with:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- scope `RFC018_BOOTSTRAP_V0_FINAL_IMPLEMENTATION_REVIEW_ONLY`
- protocol active;
- CURRENT_HANDOFF active;
- exact evidence in CURRENT_HANDOFF only;
- legacy IMPLEMENTER_HANDOFF unchanged;
- no further Builder action.

## Hard boundaries

No S5 implementation.
No S6+.
No CP-4+.
No Model Router implementation.
No application/product runtime.
No credentials.
No remote D1/R2.
No Cloudflare Access/DNS/domain/deployment/rollback/production mutation.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.

All remote/deploy/main flags remain NO.
