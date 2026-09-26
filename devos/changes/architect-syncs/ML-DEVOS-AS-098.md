# Architect Planning Sync — SENTINEL S6 Integrity Hardening

Architect Sync: ML-DEVOS-AS-098
Status: PLANNING COMPLETE — RFC-019 HARDENING AMENDMENT AUTHORIZED FOR BUILDER DRAFT
Review mode: ARCHITECTURE PLANNING / SU EVIDENCE REVIEW
Cycle: SENTINEL_S6_INTEGRITY_HARDENING_PLANNING
Authority: D-073
Planning base: 68968789bfa36f47a53179e3ed51d5d16e758203
Implementation under review: NONE — implementation remains paused
Target design: ML-DEVOS-RFC-019
Sentinel baseline: v1.8.0

## Verdict

Do not continue the AS97-only implementation-remediation chain.

The post-AS097 defects form a common architecture class: S6 currently has several
independently durable local records plus external effects, but no single explicit
transaction model that says which facts commit together, which external effects are
prepared before execution, and how recovery proves the result after a crash.

The smallest coherent correction is an RFC-019 integrity-hardening amendment. It must
preserve S6/S7/S8 boundaries and return to capability delivery after the class of defect
is corrected.

No S6 implementation, real execution driver, S7 work, manifest closure or version bump
is authorized by this planning review.

## SU evidence-first planning result

This planning pass used the SU evidence-first method as an advisory input: search for
supporting and contradicting evidence, prefer primary/major technical sources, preserve
limitations, and do not treat research consensus as authority.

### Evidence that supports the direction

1. **Atomic local commit is preferable to hand-coordinated multi-file mutation.**
   SQLite's atomic-commit/WAL documentation is a mature demonstration that application
   state intended to commit together should have one transactional commit boundary and
   explicit recovery semantics. It also shows that durability claims depend on actual
   synchronization mode and platform assumptions rather than on rename/write folklore.

2. **External side effects create a dual-write problem.**
   AWS Prescriptive Guidance and Azure Architecture Center both describe the
   transactional-outbox pattern: commit local state plus the intent/event atomically,
   perform the external effect separately, then make downstream handling idempotent.
   S6 has the same shape for Git push, S4 publication and destructive cleanup even
   though it is not a microservice.

3. **Concurrency needs an explicit linearization point.**
   Herlihy and Wing's linearizability model requires concurrent operations to behave as
   if each takes effect atomically at some point between invocation and response.
   S6 should therefore identify the local commit/linearization point for every
   lifecycle transition rather than relying on informal lock placement alone.

4. **Retries need a durable operation identity.**
   Stripe's documented idempotency behavior illustrates the useful properties:
   one logical key, parameter-consistency checking, stored/replayable result, and safe
   concurrent/retry behavior.

5. **Crash testing should be systematic at persistence points.**
   OSDI'18 CrashMonkey/B3 showed that bounded black-box crash testing at persistence
   points can expose subtle crash-consistency bugs with small workloads. S6's own RFC
   already requires crash injection; the current implementation/test matrix is simply
   incomplete.

6. **Subtle concurrency defects are often design defects.**
   AWS's published TLA+ experience reports that deep review, stress and fault injection
   are necessary but can still miss rare concurrent/fault-tolerant design errors.
   For S6, use a small executable/reference state model plus bounded interleaving tests
   now; full TLA+ is optional future escalation, not a new mandatory subsystem.

### Evidence that constrains / rejects overreach

1. **Do not adopt full event sourcing merely for auditability.**
   Azure's event-sourcing guidance explicitly warns that it adds substantial storage,
   concurrency, schema-evolution and operational complexity and is inappropriate when
   traditional transactional state management is sufficient. S6 needs an atomic
   transaction history, not an event-sourced application architecture.

2. **Do not mandate SQLite in the architecture yet.**
   SQLite itself is technically suitable for same-host, single-writer transactional
   state; WAL has explicit same-host constraints and durability settings. But the
   repository currently carries no database dependency, and Node's built-in
   `node:sqlite` API is still experimental/release-candidate depending on the
   supported Node line. The RFC should specify required transaction semantics, not a
   premature library dependency. A single crash-atomic task-state envelope plus
   immutable write-before-reference blobs is a valid V1 implementation candidate;
   SQLite remains a future/alternate backend if it proves simpler and portable.

### Research sources

Primary / major sources consulted:

- SQLite, "Atomic Commit In SQLite": https://sqlite.org/atomiccommit.html
- SQLite, "Write-Ahead Logging": https://sqlite.org/wal.html
- SQLite, PRAGMA synchronous documentation: https://sqlite.org/pragma.html
- Herlihy & Wing, "Linearizability: A Correctness Condition for Concurrent Objects":
  https://cs.brown.edu/people/mph/HerlihyW90/p463-herlihy.pdf
- AWS Prescriptive Guidance, Transactional Outbox pattern:
  https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
- Microsoft Azure Architecture Center, Transactional Outbox:
  https://learn.microsoft.com/azure/architecture/databases/guide/transactional-outbox-cosmos
- Microsoft Azure Architecture Center, Event Sourcing pattern:
  https://learn.microsoft.com/azure/architecture/patterns/event-sourcing
- Stripe API Reference, Idempotent requests:
  https://docs.stripe.com/api/idempotent_requests
- Mohan et al., OSDI'18, "Finding Crash-Consistency Bugs with Bounded Black-Box Crash Testing":
  https://www.usenix.org/conference/osdi18/presentation/mohan
- Newcombe et al., "Use of Formal Methods at Amazon Web Services":
  https://lamport.azurewebsites.net/tla/formal-methods-amazon.pdf
- Node.js SQLite API documentation:
  https://nodejs.org/api/sqlite.html

## Architecture requirements for the RFC-019 hardening amendment

### A. One local transactional truth boundary

RFC-019 must define one per-task **S6 local transaction boundary**.

A logical local transition that changes any combination of:

- instance lifecycle/checkpoint state;
- permit state;
- request/create idempotency bindings;
- registered process/liveness obligations;
- Result Transfer Record metadata/status;
- lifecycle/audit journal entries;
- prepared external-effect intents;

MUST commit those mutable facts as one atomic unit.

It is no longer acceptable for required safety facts to be persisted as independent
mutable files in an order where a crash can expose only a prefix of the transition.

The design must be storage-technology-neutral but semantically strict:

- one committed before-image or after-image, never a partially committed logical
  transition;
- monotonic version/CAS under the per-task writer discipline;
- journal/event evidence required to justify a state transition commits in the same
  transaction as that state transition;
- immutable large bodies may live outside the mutable transaction only when they are
  written and integrity-verified **before** the transaction references them;
- an unreferenced immutable blob after a crash is harmless orphan evidence and never an
  authoritative object;
- independently mutable body/status/journal files are prohibited unless a proven
  transaction substrate makes them one commit.

The RFC may describe a single crash-atomic per-task state envelope plus
content-addressed immutable blobs as the minimal V1 candidate. It must not mandate a
SQLite dependency. If implementation cannot prove the envelope's required semantics on
the supported platform matrix, stop and return for a backend decision rather than
quietly recreating multi-file dual writes.

### B. Prepare → effect → reconcile for non-atomic external effects

Any operation that crosses the local transaction boundary must follow:

`PREPARE DURABLE INTENT -> PERFORM EXTERNAL EFFECT -> RECONCILE BY OBSERVATION/IDEMPOTENCY -> COMMIT OUTCOME`.

The task lock/transaction MUST NOT be held across an external call merely to pretend the
systems are atomically coupled.

For each effect the RFC must define exact recovery semantics:

- **Git push:** the prepared intent stores exact expected remote SHA/null, exact target
  ref and exact target SHA. On recovery: remote==target means the effect already
  succeeded; remote==expected permits exact retry; any other remote value is a
  conflict/stale-unpublished outcome. A timeout alone never proves failure or success.
- **S4 publication:** preserve the existing transfer_id/idempotency-key and byte-identical
  evidenceRef replay. PENDING remains the durable reservation until proven COMMITTED or
  definitively ABORTED.
- **Cleanup:** commit a cleanup intent before deletion. After crash, absence of the
  exact proven instance root may reconcile to success; residue, identity substitution
  or ambiguous path state fails closed/quarantines.
- **Workspace create/clone:** reserve the logical active-instance slot and instance ID
  before filesystem effects. A crash cannot allow a second logical create to mint a
  second active environment silently.

### C. Explicit S6 instance-concurrency invariant

Remove the current false implication that S4 single ownership by itself guarantees S6
instance uniqueness.

V1 invariant:

**At most one ACTIVE S6 environment exists for a task at a time.**

ACTIVE includes every nonterminal environment that can still influence execution or
publication (at minimum CREATING, READY, ATTACHED and QUIESCED, including unresolved
publication reservation).

The local transaction store owns this invariant independently of S4.

Create must have a durable logical binding/slot as its first committed local point.
Concurrent or retried creates for the same logical S4 anchor must either replay the
same instance/outcome or fail with one deterministic conflict; they may never mint two
active environments.

Terminal/quarantined history remains preserved and does not disappear merely because a
new later S4 authority legitimately creates a fresh instance.

### D. Atomic Execution Report / liveness registration

For a valid report, the following must be one local transaction:

- `CLAIMED -> REPORTED`;
- immutable Execution Report reference/digest;
- report fields required by RFC-019;
- every reported process group / liveness obligation;
- tree snapshot/checkpoint derived at record time;
- REPORT journal evidence.

If the immutable report body is written but the transaction does not commit, the permit
remains CLAIMED and therefore blocks quiescence. A crash must never leave REPORTED while
dropping the process groups that quiescence is required to prove dead.

Late reports may add evidence after quarantine but must not restore or rewrite a
terminal instance state.

### E. PENDING RTR attribution must be fail-closed

Retain AS97-F001 in the amended design.

A PENDING record can be classified as belonging to another instance only after its
immutable identity is proven:

- body exists and parses;
- body digest matches the committed metadata;
- transfer/task binding matches;
- required journal adjacency/integrity proof succeeds.

If attribution cannot be proven, task-scoped lifecycle progress is blocked as
`RESULT_TRANSFER_UNPROVEN`; uncertainty never makes the reservation disappear.

RTR body publication into authoritative metadata must itself obey requirement A so a
crash cannot leave a body/status/journal prefix that recovery cannot classify.

### F. Mutable storage is not a public S6 capability

The production host API must not return a mutable registry/store object.

Public S6 core surface is closed operations plus bounded read-only inspection/provenance
views. Raw mutation primitives remain module-private behind the task transaction API.
Test-only corruption/fault fixtures live under the test boundary and are not reachable
through the production export.

This applies the same capability-minimization principle that removed generic argv-taking
Git helpers.

### G. Isolation Provenance boundary versus S7

S6 owns facts needed to substantiate **ISOLATED** and its own execution/publication
history. S7 owns evidence packets, Evidence Store behavior, deterministic QA execution,
evidence sufficiency evaluation and later consumption/gating.

RFC-019 §17 must therefore define Isolation Provenance as a **deterministic projection**
of committed S6 transaction history plus proven immutable bodies, not a second mutable
source of truth.

The projection must include the S6-owned facts required by the existing design:

- immutable Execution Identity/digest and checkpoint history;
- S3 contract reference/digest consumed by S6;
- S4 observations used for fencing;
- platform/isolation profile;
- environment/config/lockfile/cache digests where applicable;
- S5 capability decisions consumed;
- permit lifecycle and verified execution reports;
- registered liveness/process-group obligations and quiescence result;
- transport calls with ref/before/after SHA and authorization reference;
- result commit/tree/base;
- RTR/publication status and replay outcome;
- QA source-transfer identity where applicable;
- ordered lifecycle/audit history;
- final S6 environment state/outcome/reason;
- `evidence_class: ACTOR_REPORTED` and the non-authority disclaimer.

S6 does NOT own:

- S7 Evidence Store;
- cross-actor Evidence Packets;
- independent QA's evidence classification;
- evidence-sufficiency judgment;
- S9 Evidence Gate acceptance;
- general input-integrity policy beyond recording the source/build facts S6 itself
  observes.

The planned pre-S7 Input Integrity requirement remains queued for S7 design.

### H. S4 receipt trust boundary must be explicit

RFC-019 must state that presented S4 claim/renew/QA-chain results are accepted only from
the trusted control-plane caller boundary, never from task/actor-controlled payloads.

S6 may cross-check them with public S4 getState as the current design allows, but V1
does not invent signed S4 receipts or read S4 internal history.

If cryptographically/verifiably untrusted receipt ingestion is later required, that is
a separate S4/S8 architecture change.

### I. Complete crash/interleaving matrix

RFC-019 §18 must be rewritten from representative crash tests to a systematic matrix.

For every mutating operation, enumerate:

`PRE-STATE -> LOCAL COMMIT POINT(S) -> EXTERNAL EFFECT IF ANY -> RECONCILIATION -> POST-STATE`.

At every persistence/effect boundary:

- injected exception test;
- real process SIGKILL where executable;
- restart/recovery;
- invariant check;
- forbidden-outcome assertion;
- mutation/falsification test for the controlling guard.

At minimum cover:

- create slot reservation and every create persistence point;
- permit issuance/claim;
- report/liveness registration;
- renew/checkpoint;
- quiesce;
- Git push prepare/effect/reconcile;
- RTR body/PENDING/S4 transition/COMMITTED|ABORTED;
- finish-without-publication;
- cleanup prepare/delete/reconcile;
- recovery/quarantine;
- concurrent duplicate create;
- all previously discovered claim/quiesce/report/publication races.

Application-process crash evidence must not be mislabeled as proof of OS/power-loss
durability. Any stronger durability claim requires the relevant backend/platform
settings and actual evidence.

### J. Lightweight design-model check, not a new subsystem

Before implementation, maintain a small pure/reference state model for:

- legal instance transitions;
- legal permit transitions;
- RTR transitions;
- active-instance uniqueness;
- publication reservation;
- prepared external effects.

Use bounded exhaustive operation/interleaving generation against that model for the
critical pairs. This is inspired by formal-method/fault-testing evidence but intentionally
stops short of introducing TLA+ as a required Sentinel subsystem.

Escalate to a formal TLA+/model-checking artifact only if the amended state model still
cannot be reviewed or exhaustively bounded with the in-repo approach.

## Classification of the post-AS097 sweep

### RFC/design amendment blockers

- no explicit atomic local transaction boundary;
- false S4=>S6 instance-uniqueness assumption;
- no general prepare/effect/reconcile rule;
- public mutable-registry capability leak;
- incomplete state/evidence atomicity model;
- incomplete crash matrix;
- unclear S6 provenance vs S7 boundary.

### Implementation defects carried into the amended design

- AS97-F001 PENDING attribution fail-open;
- report status can commit before PGID/liveness registration;
- Git push can succeed before local pushed-state persistence and fail replay;
- RTR body/status/journal partial durability;
- create binding can be written too late for crash/concurrent idempotency;
- cleanup deletion can succeed before CLEANED state is recoverably committed;
- state->journal split writes can leave semantically unexplained state.

### Boundary clarification / accepted-current limitation, not an S4 rewrite

- caller-presented S4 receipts are trusted-control-plane inputs in V1;
- no signed receipt or S4 history API is introduced by this amendment.

### Explicitly S7-owned, not S6 hardening

- Evidence Store;
- structured cross-actor Evidence Packets;
- deterministic QA evidence execution/collection;
- general Input Integrity Record and fitness judgment;
- evidence sufficiency / gate consumption.

## Phase sequencing after amendment

The intended path is:

1. Builder drafts the RFC-019 amendment only.
2. Architect independently reviews that amended design.
3. Paulo explicitly decides whether to authorize one bounded S6-core hardening
   implementation.
4. Builder implements the accepted transaction/crash model.
5. Architect independently reviews the hardened core.
6. A separate execution-driver design/authorization occurs under D-069's standing
   separation.
7. S6 integrated Stage Gate determines whether the frozen S6 outcome is actually met.
8. Only then use RFC-015 Closure Preflight/Paulo closure/Closure Verification.
9. Run the short pre-S7 readiness checkpoint already identified.
10. Begin S7 design/implementation only under its own authority.

Core acceptance alone does not silently set S6 IMPLEMENTED while no real driver exists.

## Builder task — RFC amendment only

Claude is authorized to amend **only the design/proposal** according to this review.

No `devos/execution/**` code or test mutation.

The amended RFC must be internally coherent, not merely append this review verbatim.
Update the affected normative sections (§3/§7/§8/§13/§15/§17/§18/§20 and directly
necessary cross-references/reason codes) so earlier contradictory text is removed or
explicitly superseded.

The RFC must include an alternatives section comparing:

1. current independently mutable multi-file registry — reject;
2. single crash-atomic per-task transaction envelope + immutable blobs — preferred
   minimal V1 candidate;
3. embedded SQLite transactional store — viable alternative/fallback, not mandated;
4. full event sourcing — reject for V1 complexity.

The amendment must state an implementation exit condition: once the accepted transaction
model, crash matrix, API boundary and provenance boundary pass independent review, stop
architecture hardening and return to the S6 capability roadmap.

## Recommended Claude setting

Paulo should manually select **High / Extended Thinking** for the RFC drafting turn.

Reasoning mode:
**transaction/crash-consistency architecture + adversarial invariant design**

Primary lenses:
- atomic commit boundaries;
- external-effect dual writes;
- idempotency and reconciliation;
- linearization/concurrency;
- fail-closed evidence integrity;
- public capability minimization;
- S6/S7 phase boundaries;
- anti-bloat / exit criteria.

The prompt cannot change Claude's thinking setting; Paulo selects it manually.
