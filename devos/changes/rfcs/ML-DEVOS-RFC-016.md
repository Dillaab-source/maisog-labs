# ML-DEVOS-RFC-016: S4 State Machine Kernel

Status: `DRAFT`

Proposed change class: `ARCHITECTURE`

Sentinel phase:
- `S4 — State Machine Kernel`

Authority chain: `D-048` (Paulo) authorized this proposal/audit step only, following `ML-DEVOS-AS-063`'s acceptance of the coordinated `v1.6.0` closure and `ML-DEVOS-AS-064`'s acceptance of the `D-047` bidirectional handoff bridge activation. This RFC is itself the Architect Sync input for S4; it grants no authority and authorizes no implementation. The Architect's `STAGE GATE REVIEW` of the original submission (`CHANGES_REQUESTED`) found four load-bearing design blockers (`AS65-F001`–`AS65-F004`) plus four non-blocking clarifications; remediation cycle 1 closed `AS65-F002`–`F004` and all clarifications, leaving one remaining safety blocker in `AS65-F001` (unsafe age-based stale-lock stealing). `D-049` (Paulo) authorized exactly one additional micro-remediation pass, raising `MAX_REMEDIATION_CYCLES` to `2` for this cycle only, scoped solely to replacing automatic stale-lock stealing with fail-closed, operator-driven orphaned-lock recovery — addressed in this revision's §D. (That review's own durable archive, once concluded, will carry the `ML-DEVOS-AS` sync identifier `coordination/ARCHITECT_REVIEW.md` currently assigns it — not cited here by that full identifier ahead of its own durable archive existing, consistent with how every prior Architect Sync in this repository has been cited only after `devos/changes/architect-syncs/` records it.)

## Problem

`ML-DEVOS-ARCH-001` §10 freezes a conceptual task lifecycle (`CREATED → PLANNING → READY_FOR_BUILD → BUILDING → READY_FOR_QA → QA → READY_FOR_REVIEW → REVIEW → {CHANGES_REQUESTED, PAULO_DECISION_REQUIRED, APPROVED} → MERGE_READY → MERGED → RELEASE_READY → DEPLOYED → VERIFIED`) and states plainly that "exact implementation of this lifecycle belongs to later, separately authorized phases... the state-machine kernel is S4." `ML-DEVOS-SIP-001` names S4's intended implementation outcome as "the authoritative task lifecycle/state machine: ownership, locks/leases, retries, timeouts, idempotency," and `devos/state/README.md` reserves `devos/state/` as its future home, currently `NOT_IMPLEMENTED`.

No such mechanism exists anywhere in this repository today. Every task's actual "current stage" is tracked only informally: `coordination/STATE.md`'s `TURN`/`STATUS`/`AUTHORIZED_SCOPE` fields track the *bootstrap coordination turn* (whose turn it is to act next between Paulo/Architect/Claude), not a per-task lifecycle state; `MAX_REMEDIATION_CYCLES`/`CURRENT_REMEDIATION_CYCLE` are a manually incremented prose convention, not an enforced counter; there is no ownership/lease concept preventing two actors from believing they each independently own the same unit of work; there is no idempotency mechanism protecting a transition from being silently re-applied on retry or duplicate delivery. S3 Typed Task Contracts (`ML-DEVOS-RFC-013`) deliberately built the typed *description* of a task's authorized scope and evidence requirements while explicitly excluding all of this ("no state transitions, locks, leases, retries, timeouts, or idempotency machinery exist here — that is S4").

Left unaddressed, Sentinel has a way to describe what a task is authorized to do (S3) but no authoritative, fail-closed record of what stage any given task is actually in, who currently owns it, or whether a given transition request is a legitimate first application or an unsafe replay/race.

## Motivation

As Sentinel's own task volume and the number of actors (Builder, QA, Architect, future Orchestrator dispatch) grows, informal prose tracking of task stage does not scale and does not fail closed: a stale or duplicated instruction, a network retry, or two actors both believing they hold a task can silently corrupt governance-significant state with no structural mechanism to detect or reject it. `ML-DEVOS-ARCH-001` §10 and §11 already name this as a frozen target ("Task Engine State" as one of five explicitly separated memory stores; the lifecycle diagram as accepted target architecture) — S4 is what turns that accepted intent into an actual, reviewable design.

If this RFC is not accepted, S4 remains unauthorized and every future task continues to rely entirely on prose coordination discipline (`coordination/STATE.md`, human diligence) with no fail-closed backstop against a stale-owner overwrite, a silently re-applied transition, or an unbounded retry loop.

## Proposed change

This RFC proposes the design only. Per `D-048`'s explicit authorization, **no executable implementation, schema file, or live task-state storage is created by this RFC** — every artifact named below is a planned deliverable of a future, separately authorized S4 implementation cycle, not a file this cycle writes.

### A. Scope of the kernel — what S4 is and is not

The S4 State Machine Kernel is proposed as **a pure, deterministic transition function plus a minimal local persistence adapter** — not an active scheduler, not an orchestrator, not an evidence store, not a permission gateway. Concretely, the kernel:

- **is**: a library exposing `claim`, `renew`, `release`, `transition`, `get_state`, and `sweep_expired_leases` operations over a single task's state record, enforcing (1) only legal state-to-state transitions, (2) single-owner claims with lease/fencing semantics, (3) idempotent request handling, and (4) durable, bounded retry counters.
- **is not**: a decision-maker. It never decides *whether* a QA result passed, *whether* a reviewer should approve, or *whether* evidence is sufficient — those remain human/Architect judgment calls (or, in a later phase, S9's Evidence Gate) that call the kernel's `transition` operation once the decision is already made elsewhere. The kernel enforces the shape of legal progress, not the substance of any individual decision.
- **is not** an active timer/daemon. It never autonomously moves a task to a new state on a wall-clock trigger; `sweep_expired_leases` is a passive read a future Orchestrator (S8) may poll, never something S4 itself runs on a schedule.

This distinction matters because it bounds S4 sharply against the later phases named in `ML-DEVOS-SIP-001`, satisfying this RFC's own non-goals (below) without requiring their prior existence.

### B. Task state vs. every other memory boundary (`ML-DEVOS-ARCH-001` §11)

The kernel's own record — **Task Engine State** — is explicitly scoped to exactly: `state` (current lifecycle value), `owner`, `revision` (the single unified fencing/concurrency token — see §D's remediation note on why this RFC merges what an earlier draft split into `owner_generation`/`expected_revision`), `lease_expires_at`, per-transition-class `retry_count`s, and a bounded internal transition history (see "Persistence" below). It is **not**:

- `coordination/STATE.md` — that file remains the bootstrap **turn-lock** signal between Paulo/Architect/Claude at the repository level; it is not a per-task state record and this RFC does not migrate, replace, or read/write it. **No migration of live coordination is authorized or proposed.** This boundary is load-bearing, not incidental: §E below specifically does **not** derive any S4 runtime policy value (such as a retry ceiling) from `coordination/STATE.md`, precisely because doing so would create a hidden runtime dependency from the new kernel back into a temporary, manually-edited bootstrap file whose fields (e.g. `MAX_REMEDIATION_CYCLES`) exist to bound Architect-remediation cycles, not task-execution retries, and can change for reasons entirely unrelated to any given task.
- Architectural Memory (ADRs/decisions/supersession) — task state records no architectural rationale, only mechanical progress.
- Project Memory (requirements/stable facts/risk history) — unaffected.
- Run History (agent/task execution, commands, failures, cost/timing) — the kernel's bounded internal transition log records *state transitions* (from/to/actor/timestamp/evidence-reference/idempotency-key/`revision`) because a transition log is definitionally part of what "current stage" means; it is strictly bounded to that state-change provenance and never records command output, tool invocations, or cost/timing telemetry, which remain Run History's domain and are explicitly out of scope here. A future S11 Memory & Observability phase may relocate or supplement this without changing the kernel's public transition-function interface (flagged as an open question below).
- Evidence Store — the kernel stores only an `evidence_ref` (an opaque reference string/ID) on transitions that require one; it never stores, validates, or interprets the evidence artifact itself. That is S7 (storage) and S3's existing `validate-task-contract.mjs` / a future S9 Evidence Gate (sufficiency judgment).

### C. State vocabulary and transition table

The kernel's state vocabulary is exactly the frozen `ML-DEVOS-ARCH-001` §10 lifecycle, **plus two additive terminal states** this RFC proposes: `FAILED` and `ABANDONED`. §10's diagram has no terminal exit for a task that fails unrecoverably or is deliberately cancelled — without one, a kernel enforcing "no skipped transitions" would have no legal way to close such a task at all. This is flagged explicitly under "Affected rules" below as a proposed additive amendment to a `FROZEN` document, requiring the Architect's explicit sign-off rather than being treated as self-evidently in scope. **Remediation note (clarification 3):** an Architect Sync recommendation that these two states are reasonable design candidates is not itself their adoption — final adoption of any amendment to `ML-DEVOS-ARCH-001` still requires the normal `ARCHITECTURE`-class Paulo gate before implementation, exactly as this RFC's own "Unresolved questions" section already states. `ML-DEVOS-ARCH-001` itself is not edited by this RFC or by this remediation.

**States:** `CREATED`, `PLANNING`, `READY_FOR_BUILD`, `BUILDING`, `READY_FOR_QA`, `QA`, `READY_FOR_REVIEW`, `REVIEW`, `CHANGES_REQUESTED`, `PAULO_DECISION_REQUIRED`, `APPROVED`, `MERGE_READY`, `MERGED`, `RELEASE_READY`, `DEPLOYED`, `VERIFIED`, `FAILED` *(proposed addition)*, `ABANDONED` *(proposed addition)*.

**Transition table** (`from → to`, guard, permitted requester):

| From | To | Guard | Requester |
|---|---|---|---|
| — | `CREATED` | task registered with a valid S3 Task Contract reference | task-initiating actor |
| `CREATED` | `PLANNING` | none (unconditional first step) | any actor holding a fresh claim |
| `PLANNING` | `READY_FOR_BUILD` | a design/plan artifact reference is attached | current owner |
| `READY_FOR_BUILD` | `BUILDING` | requester holds an active claim (see lease model) | Builder |
| `BUILDING` | `READY_FOR_QA` | `evidence_ref` present (at minimum `ACTOR_REPORTED`) | current owner (Builder) |
| `BUILDING` | `FAILED` | explicit unrecoverable-failure report, or build-stage `retry_count` ≥ ceiling | current owner, or kernel on ceiling breach |
| `READY_FOR_QA` | `QA` | requester acquires claim | QA actor |
| `QA` | `READY_FOR_REVIEW` | `evidence_ref` present, guaranteeing `INDEPENDENTLY_REPRODUCED` (`CORE-014`) | current owner (QA) |
| `QA` | `BUILDING` | QA reports failure; `qa_retry_count` < ceiling | current owner (QA) |
| `QA` | `FAILED` | `qa_retry_count` ≥ ceiling | kernel on ceiling breach |
| `READY_FOR_REVIEW` | `REVIEW` | requester acquires claim | Independent Reviewer / Architect |
| `REVIEW` | `CHANGES_REQUESTED` | reviewer decision recorded | current owner (Reviewer) |
| `REVIEW` | `PAULO_DECISION_REQUIRED` | reviewer/Architect flags ambiguity, or `review_retry_count` ≥ ceiling | current owner, or kernel on ceiling breach |
| `REVIEW` | `APPROVED` | reviewer decision recorded | current owner (Reviewer) |
| `CHANGES_REQUESTED` | `BUILDING` | re-claim; `review_retry_count` incremented | Builder |
| `PAULO_DECISION_REQUIRED` | `BUILDING` | a Paulo decision reference is attached, routing back | actor named by the decision |
| `PAULO_DECISION_REQUIRED` | `ABANDONED` | a Paulo decision reference is attached, declining | Paulo (decision-reference required) |
| `APPROVED` | `MERGE_READY` | `evidence_ref` present, guaranteeing `INDEPENDENTLY_REPRODUCED` or `CI_ATTESTED` (`CORE-016`) | current owner |
| `MERGE_READY` | `MERGED` | merge event `evidence_ref` present (`CORE-016`); Paulo-gate evidence per `CORE-012` where policy requires it | current owner |
| `MERGED` | `RELEASE_READY` | release criteria reference attached | current owner |
| `RELEASE_READY` | `DEPLOYED` | `evidence_ref` present, guaranteeing `ACTOR_REPORTED` or `CI_ATTESTED` (`CORE-017`) | current owner |
| `DEPLOYED` | `VERIFIED` | `evidence_ref` present, **unconditionally** `RUNTIME_OBSERVED` (`CORE-018`) | current owner |
| any non-terminal state | `ABANDONED` | explicit cancellation reference; **never** self-issued by the current Builder owner alone — requires Architect or Paulo reference | Architect or Paulo only |

**Explicitly rejected transitions** (a non-exhaustive but illustrative set the implementation's negative tests must cover):

- Any transition skipping an intermediate state (e.g. `CREATED → MERGED`, `BUILDING → VERIFIED`) — the kernel enforces the table above as the *only* legal adjacency; there is no generic "jump forward" operation.
- `FAILED → *` and `ABANDONED → *` — both terminal, no outgoing transition. Recovering from a failed/abandoned task means opening a **new** task whose Task Contract references the closed task's `task_id`, never mutating the closed record — this preserves the traceability model (`ML-DEVOS-ARCH-001` §8) instead of silently erasing failure history.
- `VERIFIED → *` — terminal.
- A transition whose evidence guard is not met (e.g. `MERGE_READY → MERGED` without any `evidence_ref`, or a `DEPLOYED → VERIFIED` request whose `evidence_ref` is only tagged `ACTOR_REPORTED`) — rejected exactly as `validate-task-contract.mjs` already rejects a structurally non-guaranteeing evidence declaration for the analogous claim kind; the kernel does not re-implement that validator, it simply refuses to record the transition without the *presence* of a correctly classed reference (see "Relationship to S3", below, for the exact division of responsibility).
- Any state-non-terminal `→ ABANDONED` requested by an actor other than Architect/Paulo — rejected; a Builder cannot abandon its own task to hide failed work (it can only report `FAILED`, which is visible and terminal, never silently discarded).

### D. Ownership, leases, and fencing

**Remediation note (`AS65-F001`/`AS65-F002`):** an earlier draft of this RFC claimed that write-temp-then-atomic-rename alone serialized concurrent claimants and made a fencing comparison atomic with the replacement. Architect review correctly identified that atomic rename protects only readers from torn files — it does **not** serialize two concurrent read-modify-write cycles: two processes can both read revision `N`, both compute `N+1`, and both successfully rename a valid replacement file, with the later rename silently overwriting the earlier accepted claim. It also identified that several transitions handing a task from one role to another (`BUILDING → READY_FOR_QA`, `QA → READY_FOR_REVIEW`, `REVIEW → CHANGES_REQUESTED`) did not actually clear ownership, so the next actor would have to wait out the full lease duration before it could claim a task that was, in intent, already handed off. Both defects are corrected below with a concrete, testable mechanism rather than a restated intention.

**Unified concurrency token (`revision`).** The earlier draft's separate `owner_generation` (fencing) and `expected_revision` (optimistic-concurrency) fields are merged into one field, `revision`: a monotonically increasing integer, starting at `0` when a task is `CREATED`, incremented by exactly `1` on **every** successful mutating operation (`claim`, `renew`, `release`, or `transition`) — whether or not that operation changed who owns the task. Every mutating request must present the `revision` it last observed; the kernel's atomic critical section (below) checks the presented value against the persisted one and rejects on any mismatch, then persists `revision + 1` together with the rest of the update. One token, one check, no ambiguity about which of two counters a given caller should present.

**A real local mutual-exclusion primitive, not rename-only atomicity.** Each task's on-disk representation is two files: `<task_id>.json` (the durable record, replaced only via write-temp-then-atomic-rename, which remains correct for what it actually guarantees — no reader ever observes a torn/partial record) and `<task_id>.lock` (a pure mutex gate, created via `fs.open(path, 'wx')` — POSIX exclusive-create, which fails with `EEXIST` if another writer already holds it). This exclusive-create is the genuine, OS-guaranteed atomic primitive the fencing property actually depends on — unlike atomic rename, it serializes the *entire* read-validate-mutate-persist sequence across real concurrent writers, including separate OS processes, not merely two calls happening to interleave within one JS event loop.

**Exact atomic boundary.** A mutating operation's critical section is exactly:
1. attempt `fs.open('<task_id>.lock', 'wx')`; on `EEXIST`, see "Orphaned-lock recovery is fail-closed, never automatic" below;
2. once the lock is held, read the current persisted `<task_id>.json` record (`state`, `owner`, `revision`, `lease_expires_at`, retry counters, idempotency ledger);
3. validate preconditions: presented `revision` matches; the requested transition is legal per §C's table; the idempotency key, if any, is checked per §E;
4. compute the new record (new `state`/`owner`/`lease_expires_at`/`revision + 1`/retry counters/idempotency entry/history append) entirely in memory — the old file is not touched yet;
5. write the new record to a temp file and atomically rename it over `<task_id>.json`;
6. delete `<task_id>.lock`, releasing the mutex (in a `finally`, so the lock is released whether step 2–5 succeeded or threw).

If any of steps 2–5 throws, step 6 still runs and the persisted `<task_id>.json` is byte-identical to before the operation began (step 5 is the only step that touches it, and it either fully completes or never starts) — a crash between steps 2–5 leaves at worst an orphaned lock file, never a partially-applied state record.

**Orphaned-lock recovery is fail-closed, never automatic.** **Remediation note (`AS65-F001`, remaining blocker from cycle 1):** an earlier revision of this section allowed a writer to automatically break a lock whose recorded `acquired_at` was older than a fixed staleness ceiling, then immediately re-create it. Architect review correctly identified this as unsafe for an authoritative state kernel: a legitimate holder can be paused longer than any fixed ceiling (a scheduler stall, a GC pause, a debugger, a slow filesystem) while still alive, and time age alone is not proof the original holder is dead. If a second writer unlinks and re-creates the lock while the first is merely paused, both can end up believing they hold the exclusive critical section, and both may write — silently violating the single-authoritative-writer invariant this whole design exists to guarantee. **V1 therefore never auto-unlinks a held lock, regardless of its age:**
- `<task_id>.lock`'s content still records diagnostic metadata — at minimum `{holder: actor_id, acquired_at: timestamp, task_id, operation}` — sufficient for a human operator to inspect a suspected orphan, but this metadata is read-only diagnostic information, never itself a trigger for automatic recovery.
- A writer that fails to acquire the lock (`EEXIST`) during ordinary task mutation does **not** inspect `acquired_at` to decide whether to steal it. It returns a deterministic `LOCK_HELD` (or, if the caller supplies context suggesting a suspected orphan, `LOCK_RECOVERY_REQUIRED`) result immediately and performs no mutation. This is a normal, expected result under contention or a stalled writer — not an exception the kernel tries to route around on its own.
- Recovery of a **genuinely** orphaned lock is an explicit **operator/admin maintenance action**, entirely outside the kernel's ordinary public operation surface (§A's `claim`/`renew`/`release`/`transition`/`get_state`/`sweep_expired_leases`) — for example a separate, deliberately-out-of-band `force_clear_lock(task_id, operator_confirmation)` action that a human invokes only after independently confirming, out of band (checking the actual process/host that acquired the lock, its logs, its liveness), that no writer remains. This action is never called by the kernel itself, never triggered by age, and never part of the normal claim/transition retry path.
- **Documented availability trade-off:** a crashed-but-unremoved-lock writer can temporarily block ordinary mutation of that one task until an operator intervenes. This is a deliberate choice, not an oversight: Sentinel prefers a visible, diagnosable stopped task over two concurrent authoritative writers silently corrupting state — exactly the correctness property `AS65-F001`'s original finding, and this remaining blocker, both exist to protect. This trade-off is scoped to a single task (one lock file per task, §F) and does not stall any other task.

**Single-owner claim.** At most one active owner per task at any time. `claim(task_id, actor_id, lease_duration, idempotency_key)` succeeds, inside the critical section above, only if no current owner exists or the current lease has expired (`lease_expires_at < now`); on success it persists the new `owner`, a fresh `lease_expires_at`, and `revision + 1` in the one atomic write.

**Expiry does not by itself invalidate a superseding claim's protection.** This is the specific race this RFC must close: expiry alone gates whether a *new* claim is permitted — it does **not** retroactively let a since-superseded old owner overwrite a newer owner's work. Because every mutating call must present the `revision` it believes current, and because that comparison now happens **inside** the same lock-held critical section as the persist step (not as a separate, raceable check-then-write), an old owner whose lease has expired — even one with a skewed clock still believing it holds the lease — can never succeed a write once a new claimant's `claim` has incremented `revision`: its presented `revision` is stale the moment it tries to acquire the lock after the new claim has already committed, and the comparison in step 3 rejects it outright.

**Concurrent claimant conflict.** Two actors racing to claim the same expired lease both attempt `fs.open('<task_id>.lock', 'wx')`; the OS guarantees exactly one `open` call succeeds. The loser never enters the critical section at all — it receives an explicit conflict result (never a silent no-op or a merged partial claim) and must re-fetch current state before retrying. This is the property the implementation's negative tests must exercise with two real concurrent writers (real child processes or worker threads — see "Implementation mapping," item 3), not two sequential calls inside one process.

**Ownership handoff clears the lease atomically.** A transition whose **destination** state is one of `READY_FOR_BUILD`, `READY_FOR_QA`, `READY_FOR_REVIEW`, `CHANGES_REQUESTED`, or `PAULO_DECISION_REQUIRED` is a designated **handoff transition**: as part of the same atomic write that commits the new `state` (step 4–5 above), the kernel also clears `owner` to `null` and sets `lease_expires_at` to the transition's own commit timestamp (already-expired), and — because this is itself a mutating write — `revision` still increments exactly once. This closes both halves of `AS65-F002`: (a) the *next* actor can `claim()` the task immediately, with no wait for real-time lease expiry, because `claim()`'s existing "no owner or lease expired" guard is now immediately satisfied; and (b) the *outgoing* owner is immediately fenced from any further mutating call, because its last-observed `revision` is now stale the instant the handoff transition commits — it does not need to wait for a new claimant to show up to lose its standing. All other transitions (same-owner continuations, e.g. `PLANNING → READY_FOR_BUILD` performed by the same actor that will itself claim `BUILDING`, or `CREATED → PLANNING`) preserve the current `owner`/`lease_expires_at` unchanged, incrementing only `revision`.

**`renew(task_id, actor_id, revision, new_lease_duration, idempotency_key)`** extends `lease_expires_at` only if the presented `actor_id`/`revision` matches the persisted record inside the same critical section; it persists `revision + 1` like any other mutation.

**`release(task_id, actor_id, revision, idempotency_key)`** clears ownership without changing `state`, fencing-guarded exactly like `renew`; see §E for its specific idempotent-replay rule.

**Clock assumptions.** The kernel takes time as an injectable parameter (`now()`, passed into every lease-aware operation) rather than reading the system clock internally, so tests can deterministically advance or fix time to exercise expiry and race conditions without real sleeps. This design assumes a single, trusted, monotonic clock for lease arithmetic within one persistence process — it does **not** solve multi-process/distributed clock-skew tolerance, which is explicitly out of scope and named as a disclosed limitation (S4's assumed deployment shape is a single local process/service, consistent with "no remote database or live store now").

### E. Idempotency, retries, timeouts, and recovery

**Remediation note (`AS65-F003`/`AS65-F004`):** an earlier draft scoped idempotency to `claim`/`transition` only, leaving `renew`/`release` undefined despite both being mutating operations, and proposed reading `coordination/STATE.md`'s `MAX_REMEDIATION_CYCLES` live as the task-retry ceiling. Architect review correctly identified both as defects: the first leaves a lost-acknowledgement race around `renew`/`release` with ambiguous recovery behavior; the second creates a hidden runtime dependency from the new kernel back into a bootstrap turn-lock file whose cap governs a different kind of cycle (Architect-remediation reviews) for a different reason, and which can change for reasons having nothing to do with any given task. Both are corrected below.

**Every public operation, classified:**

| Operation | Read-only or mutating | Idempotency treatment |
|---|---|---|
| `claim(task_id, actor_id, lease_duration, idempotency_key)` | Mutating | Persisted idempotency-key ledger (below) |
| `renew(task_id, actor_id, revision, new_lease_duration, idempotency_key)` | Mutating | Persisted idempotency-key ledger (below) |
| `release(task_id, actor_id, revision, idempotency_key)` | Mutating | Documented stronger-reason exception (below) — no persisted key required, but the operation is still proven safely repeatable |
| `transition(task_id, from_state, to_state, revision, idempotency_key, evidence_ref)` | Mutating | Persisted idempotency-key ledger (below) |
| `get_state(task_id)` | Read-only | None needed — no side effect to replay-protect |
| `sweep_expired_leases()` | Read-only | None needed |

**Idempotency-key ledger and request binding (`claim`/`renew`/`transition`).** Each of these carries a caller-supplied `idempotency_key`, scoped to `(task_id, operation_class)`. The record's bounded internal history (§B) retains, per key, the exact request-binding fields that must match for a retry to count as a safe replay rather than a conflicting reuse:
- `claim`: binding = `(actor_id, lease_duration)`.
- `renew`: binding = `(actor_id, revision presented, new_lease_duration)`.
- `transition`: binding = `(from_state, to_state, revision presented, evidence_ref content hash)`.

If the kernel finds a persisted ledger entry for the same `idempotency_key` under the same `(task_id, operation_class)` with **identical** binding fields, it returns the previously committed result without re-applying the operation — the safe case (a network retry after a successful-but-unacknowledged write). If it finds the same key with **differing** binding fields, this is a conflicting reuse and is rejected outright as a client error; the kernel never silently overwrites a prior committed result with a different one under the same key.

**`release`'s documented stronger-reason exception.** `release` does not require a persisted idempotency-key ledger entry, for a specific, checkable reason: its only effect is clearing ownership, and "the task is already unowned" is itself a safe, distinguishable terminal condition. Precisely:
- if the presented `actor_id`/`revision` matches the persisted record's current owner/`revision`, `release` proceeds normally (clears `owner`/`lease_expires_at`, persists `revision + 1`);
- if the task is **already unowned** (`owner` is `null`) at the time `release` is called, it returns success as a no-op **without** re-checking the presented `revision` — this is the safe replay case (the caller's intent, "I no longer want to own this," is already satisfied, and no further mutation occurs);
- if the task is owned by someone **else** with a **different** `revision` than presented, `release` is rejected as a genuine conflict — the caller no longer holds the task, and silently succeeding would mask a real problem rather than safely replaying anything.
This gives `release` well-defined, fully specified idempotent-replay behavior without a second persisted-ledger mechanism, per the Architect's explicit allowance to "document a stronger reason why an operation is safely repeatable without a persisted idempotency record."

**Retry ceiling is an explicit S4 policy input, never read from `coordination/STATE.md`.** Per-transition-class counters (`build_retry_count`, `qa_retry_count`, `review_retry_count`) persist across process restarts, exactly as before. What changes is where the ceiling they compare against comes from: it is **not** read live from `coordination/STATE.md`'s `MAX_REMEDIATION_CYCLES` or any other bootstrap coordination field. Instead, this RFC proposes a dedicated, versioned **Task Policy** input — a small, explicit configuration record supplied to the kernel at initialization (e.g. `{ retry_ceiling: { build: N, qa: N, review: N }, lock_staleness_ms: N }`), whose own numeric values are set by an explicit Paulo decision recorded in `brain/DECISION_LOG.md` at S4 implementation-authorization time, not inherited from an unrelated, currently-`1`-for-this-cycle bootstrap field and not invented by the Builder. **This RFC deliberately leaves the actual ceiling numbers unresolved** — no existing canonical (non-bootstrap-turn-lock) rule currently supplies a task-execution retry ceiling, so choosing one is itself a policy decision belonging to a future Paulo authorization, not to this design proposal (see "Unresolved questions," below). The fail-closed escalation *behavior* is unchanged: exceeding whatever ceiling Paulo eventually sets still forces a transition to `FAILED` or `PAULO_DECISION_REQUIRED` (see the transition table) rather than looping silently or indefinitely.
- **Timeout handling is deliberately passive.** The kernel is a pure transition function, not a scheduler (§A above). It never autonomously times out and transitions a task on a wall-clock trigger. It instead exposes `sweep_expired_leases()`, a read-only query a future Orchestrator (S8) may poll, which reports tasks whose lease has expired — the *decision* of what to do about a stalled task (re-claim it, escalate it, mark it failed) belongs to whatever later phase actually schedules that check, not to S4 itself. This boundary is flagged as an open question for Architect review below, since a stricter design could instead give S4 itself an explicit "declare stale" operation with its own guard.
- **Human escalation.** `PAULO_DECISION_REQUIRED` exists precisely to route ambiguous outcomes (a reviewer's explicit flag, or a retry ceiling exceeded in a way that might warrant Paulo raising the cap rather than failing the task) to a human — a task-policy-scoped analogue of the same escalation shape `ARCHITECT_SYNC.md` already uses for Architect-remediation cycles, without actually depending on that file's live value.
- **Crash-before-persist.** If an actor crashes before the kernel's write commits, no state change is observable (the lock-guarded atomic-rename write, §D, ensures there is no partially-applied write) — the caller's retry, using the same `idempotency_key` (or, for `release`, relying on its documented no-op exception), is always safe because nothing was ever recorded as committed.
- **Crash-after-persist (before acknowledgment).** The write is durable; the caller's retry finds the already-committed record and receives the identical result (the replay case above) — the caller never needs to know whether its original request actually landed on the far side of the crash.
- **Partial writes / corruption.** The chosen persistence approach (§F) guarantees that a single task's state update is all-or-nothing — no torn/half-written record is ever observable by a reader. A corrupted on-disk record is detected at load time (structural/schema validation) and surfaces as an explicit, scoped error for that one `task_id` — never a silent default to some assumed state, and never a crash of the whole kernel process.
- **Restart.** The kernel holds no state only in memory; a full process restart simply re-opens the persistence layer and reads whatever was last durably committed. If the restarting process is itself the prior lock-holder resuming after a pause (not a crash), it retains no special claim to the lock it left behind and must re-acquire it through the normal `EEXIST` path like any other writer. An actually orphaned `.lock` file (§D) is never auto-reclaimed on restart — it surfaces via the same `LOCK_HELD`/`LOCK_RECOVERY_REQUIRED` result and awaits explicit operator recovery, exactly as during normal operation. There is no separate "in-flight transition" concept that needs its own recovery procedure beyond re-reading current state — this is a stated design constraint, not an incidental property.
- **Duplicate delivery.** Exactly the case the idempotency-key ledger (or `release`'s documented exception) exists to solve.

### F. Persistence — comparison and recommendation

Four options were compared:

| Option | Concurrency safety | Portability | Recovery simplicity | Dependency cost | Fit for "smallest kernel" |
|---|---|---|---|---|---|
| **1. One local JSON file per task, `wx`-exclusive lock file guarding a write-temp-then-atomic-rename critical section (§D)** | Real — the `fs.open(path, 'wx')` exclusive-create is an OS-guaranteed mutex serializing the entire read-validate-mutate-persist sequence across real concurrent writers; atomic rename separately guarantees no reader ever observes a torn file | High — Node built-ins only (`node:fs`), no external service | Medium — restart = re-open the store; a stray `.tmp` file is ignored; an orphaned `.lock` file is deliberately **not** auto-reclaimed (§D) and instead blocks that one task's ordinary mutation until an explicit operator/admin action clears it — a disclosed availability trade-off, not a gap | Zero third-party dependencies | Best fit |
| **2. Embedded SQLite (via a third-party driver, or Node's experimental built-in `node:sqlite`)** | Real ACID transactions, well-understood WAL crash recovery | Medium — an extra binary/dependency, or a still-experimental Node built-in | Medium — more moving parts than a flat file for this record's small size/shape | Non-zero (or experimental-API risk) | Overkill for V1; a valid future evolution if task volume/query complexity later demands it |
| **3. Local append-only event log (event-sourced)** | Atomic appends are simple, but still need the same kind of exclusive-write serialization as option 1 to avoid two appenders racing | High | Lower — reading "current state" requires replaying the log or maintaining a snapshot alongside it | Zero third-party dependencies | More complexity than the *smallest* kernel needs; naturally suits a later S11 Memory & Observability enhancement instead |
| **4. Remote database (D1/Postgres/etc.)** | N/A | N/A | N/A | Requires `REMOTE_D1_AUTHORIZED`/`CORE-019` scoping that has never been granted for S4 | **Excluded** — explicitly prohibited by `D-048` ("no S4... live task storage") and by every observed `coordination/STATE.md` `REMOTE_D1_AUTHORIZED: NO` across this engagement |

**Recommendation: option 1** — one local JSON file per task, plus one `.lock` file per task providing a genuine OS-level mutual-exclusion primitive around the exact critical section §D defines, zero third-party dependencies (Node built-ins only: `node:fs`, `node:crypto` for idempotency-key hashing). This continues the same dependency-light posture Sentinel already established for Traceability V1 (`AS37-F010`) and S3's task-contract validator ("zero third-party deps"), keeps the corruption blast radius to a single task (one file pair, not one shared file for every task), and keeps the kernel small enough to match "the smallest authoritative task-state kernel" the acceptance criteria ask for — while, unlike the earlier draft, actually providing the serialization the design's own correctness properties depend on rather than relying on atomic rename to do work it cannot do alone.

The task's bounded internal transition history (§B) is proposed to live as an array *inside* that same per-task file, rather than a separate log file — this keeps the "one file per task" property while still recording enough of "what happened" to distinguish current-state from history, with an explicit note that a future S11 phase may relocate this into a dedicated Run History store without changing the kernel's public interface.

**Bounds, explicitly stated rather than silently assumed:**
- One file per task (never one shared file for all tasks), to avoid lock contention across unrelated tasks and to keep any single corruption scoped to one task.
- Zero third-party npm dependencies for the kernel itself.
- This file-per-task local design is explicitly **not** intended to scale past the low task volumes typical of a single-repository governance pilot; a future phase must revisit persistence (very plausibly option 2 or a real Task Engine backing store) if Sentinel's task volume or cross-project concurrency later demands it. This bound is disclosed now, not discovered later as a surprise limitation.

**Distinguishing the pure transition function from the future operational subsystem.** This RFC proposes the *pure transition function plus a reference file-backed persistence adapter behind a narrow interface* (`load(task_id)`, `atomic_write(task_id, record)`), not a running service. A future S8 Orchestrator, or any other actual dispatcher, would import this library and call its operations directly — S4 itself never listens on a port, never runs as a daemon, and is not itself "the operational state subsystem" in the sense `ML-DEVOS-ARCH-001` §4 uses for system mechanisms like the Task Engine or Orchestrator. This RFC's kernel is the *deterministic core* such a future subsystem would be built on, not the subsystem itself.

**Honest manifest/version/closure consequences, proposed for later approval — not enacted by this RFC:**
- A future, separately authorized S4 implementation cycle would move `devos/state/`'s `reserved_subsystem_roots` entry from `NOT_IMPLEMENTED` toward `IMPLEMENTED`, following the exact D.1 Pre-decision Closure Preflight / D.2 Post-decision Closure Verification procedure `ML-DEVOS-RFC-015` already established (`brain/protocols/ARCHITECT_SYNC.md`).
- That closure would require its own `closure_ref`-bearing ADR, exactly as S3's `ML-DEVOS-ADR-013` did.
- Per `devos/governance/specifications/VERSIONING_POLICY.md`'s `MINOR` criterion, a successful S4 implementation would very plausibly be assessed `MINOR` (a new, backwards-compatible subsystem; no existing rule's meaning changes; no actor's authority changes) — the same reasoning already applied to S3 and RFC-015's `v1.6.0` closure. This RFC does not itself claim or apply any version bump.
- `devos/state/README.md`'s `NOT IMPLEMENTED` banner is unchanged by this RFC — it is a proposal artifact only.

### G. Relationship to S3 Typed Task Contracts — no duplication, no authority leakage

The kernel references, but never duplicates, an S3 Task Contract:

- Each task-state record carries a `contract_ref` (the contract's `task_id`), not a copy of the contract's `scope`/`claims`/`evidence` fields. The Task Contract (S3) answers **what is authorized and what evidence a claim requires**; the State Kernel (S4) answers **what stage the task is in, who owns it, and whether a requested transition is structurally legal, unowned-conflict-free, and non-duplicated**. These are deliberately different questions, exactly as `ML-DEVOS-RFC-013`'s own "What a Task Contract is not" section anticipates ("no state transitions, locks, leases, retries, timeouts, or idempotency machinery exist here — that is S4").
- **Remediation note (clarification 1):** an earlier draft miscounted this as "five" transitions while its own table gated six; corrected here. The **six** transitions gated by an evidence guard in the table above (`BUILDING → READY_FOR_QA`, `QA → READY_FOR_REVIEW`, `APPROVED → MERGE_READY`, `MERGE_READY → MERGED`, `RELEASE_READY → DEPLOYED`, and `DEPLOYED → VERIFIED`) require the caller to supply an `evidence_ref` whose *declared* class the kernel checks only for **presence and label**, never for actual sufficiency or content — sufficiency judgment belongs entirely to S3's `validate-task-contract.mjs` (already implemented) and, until a future S9 Evidence Gate exists, to human Architect/Paulo review, exactly as `TASK_CONTRACT_SPEC.md` already states ("It never inspects any actually-produced evidence artifact and never decides whether a task is complete, accepted, merged, or deployed"). The kernel adopts the identical guarantee-check semantics S3 already established (`AS54-F003`: a required class must be *guaranteed* on every satisfiable path, not merely offered as one option among several) for its own evidence-presence gate, rather than inventing a second, incompatible evidence-combination rule.
- `MAIN != DEPLOYED != VERIFIED` (`CORE-007`) is preserved exactly: the kernel's `MERGE_READY`/`MERGED` states correspond to the `MAIN` claim kind (`CORE-016`), `RELEASE_READY`/`DEPLOYED` to the `DEPLOYED` claim kind (`CORE-017`), and `VERIFIED` to the `VERIFIED` claim kind (`CORE-018`) — the kernel enforces that a task cannot reach a later state's evidence gate using an earlier state's weaker evidence, but it does this by requiring the caller to name which claim/evidence class the transition satisfies, not by re-deriving or reinterpreting `CORE-016`/`017`/`018` itself.
- **No authority leakage.** A task record reaching `MERGED`/`DEPLOYED`/`VERIFIED` in the kernel's own state field is a **descriptive fact about the kernel's tracked progress**, not a merge/deployment/production authorization by itself — exactly the same non-authority posture the S3 schema's fixed `authority_disclaimer` already states for Task Contracts, and this RFC proposes an equivalent fixed disclaimer field on every task-state record for the same reason (`CORE-001`, `CORE-002`).

### H. Boundary for later phases — what remains explicitly unimplemented

- **S5 Capability & Permission Gateway.** The kernel accepts a bare `actor_id` string for `claim`/`transition` calls. It performs **no** authorization check on whether that actor is permitted to hold this task or perform this transition — that judgment remains entirely procedural/manual, exactly as it is today, until S5 exists and is separately authorized to enforce it technically.
- **S7 Evidence & QA Plane.** The kernel stores only an opaque `evidence_ref`; it never stores, retrieves, or validates the evidence artifact itself.
- **S8 Orchestrator.** The kernel never dispatches actors to a task or decides when work should start; it is a passive library any future orchestrator would call, never one that calls out.
- **S9 Evidence Gate.** The kernel never decides whether evidence is *sufficient*, only whether the required reference is *present* on the specific transitions the table above names. The actual "is this good enough to progress" judgment remains an Architect/Paulo call until S9 exists.
- **S13 Release & Runtime Verification.** `RELEASE_READY → DEPLOYED → VERIFIED` exist in the state vocabulary because they exist in the frozen §10 diagram, but the kernel implements no actual deployment or runtime-check mechanism — it only accepts a caller-supplied evidence reference for those two transitions.

## Scope

This RFC proposes the S4 design only: state vocabulary and transition table, ownership/lease/fencing model, idempotency/retry/timeout/recovery model, and a persistence recommendation with explicit bounds. It affects `Dillaab-source/maisog-labs` only (no other project is registered under Sentinel — `projects/registry.json` remains `EMPTY`).

## Non-goals

This RFC does **not**:

- write any executable implementation, schema file, or test file (`D-048`'s explicit authorization boundary — this cycle is proposal/audit only);
- create or mutate any live task-state storage;
- implement S5 permission enforcement, S6 isolated execution, S7 evidence storage/QA execution, S8 orchestration/dispatch, S9 Evidence Gate acceptance logic, S10 CI/rulesets, S11 memory/observability stores, S12 project overlays, S13 release/runtime verification, or S14 the production pilot;
- change any `CORE-*` rule's meaning, any actor's authority, `manifest_version`, the Sentinel capability baseline version, or any ADR;
- migrate, replace, or write to `coordination/STATE.md`, `coordination/IMPLEMENTER_HANDOFF.md`, or `coordination/ARCHITECT_REVIEW.md`'s turn-lock mechanism;
- create remote/cloud resources, change product/runtime code, deploy, or merge to `main`;
- authorize any later phase or itself constitute S4 implementation authorization.

## Affected components

Primary (future implementation only, not created by this RFC): `devos/state/`.

Referenced, unmodified: `devos/contracts/` (S3 schema/validator, read-only reference), `devos/governance/rules/core-rules.json` (`CORE-001/002/006/007/012/014/016/017/018/020`, read-only reference). `coordination/STATE.md` is explicitly **not** a referenced runtime dependency of this design (§B, §E) — it is read only as bootstrap governance context during this proposal cycle itself, never by the kernel at runtime.

Supporting governance records only: this RFC; its Architect Sync; a future Decision (including the future, separate S4 Task Policy decision §E defers to Paulo); a future implementation cycle; a future closure ADR.

## Affected rules

**No `CORE-*` rule is added, modified, or superseded by this RFC.** S4's design consumes `CORE-001`, `CORE-002`, `CORE-006`, `CORE-007`, `CORE-012`, `CORE-014`, `CORE-016`, `CORE-017`, `CORE-018`, and `CORE-020` exactly as currently written, and must validate any future implementation against them unchanged.

**One `ARCHITECTURE`-class item requires explicit confirmation**, not assumed by this proposal: this RFC's proposed addition of two terminal states (`FAILED`, `ABANDONED`) to `ML-DEVOS-ARCH-001` §10's frozen lifecycle diagram. §10 is part of a document whose status is `FROZEN`; per `CHANGE_GOVERNANCE_POLICY.md`, a genuine addition to frozen content must proceed through that content's own class and authority level — which this RFC, being itself `ARCHITECTURE`-class with the required Architect Sync and Paulo gate, does. This is flagged explicitly (see "Unresolved questions" below) rather than treated as self-evidently in scope, since `ML-DEVOS-ARCH-001` is a different document than `ML-DEVOS-SIP-001` and this RFC's authority chain traces to the SIP-001 S4 roadmap entry, not to a prior RFC that touched ARCH-001 directly.

## Alternatives considered

### 1. Extend `coordination/STATE.md` itself to carry per-task fields

Rejected. `coordination/STATE.md` is the bootstrap **turn-lock** surface between three human/agent roles, not a per-task record; overloading it with N tasks' worth of state fields would conflate two different questions (whose turn is it vs. what stage is task T in) and risks exactly the kind of memory-boundary conflation `ML-DEVOS-ARCH-001` §11 warns against. It would also require migrating live coordination, which `D-048` and this RFC's own scope both explicitly prohibit.

### 2. Build the full Task Engine (S4 + S8 orchestration + S9 acceptance) as one large phase

Rejected. This would collapse three phases the frozen `ML-DEVOS-SIP-001` roadmap deliberately separates, expand this proposal's authorized scope well beyond "state machine kernel," and repeat the mistake `ML-DEVOS-RFC-013`'s own alternatives-considered section already rejected for S3 ("would collapse S3 into S4/S8/S9").

### 3. Adopt an existing open-source workflow/state-machine library (e.g. XState, a job-queue framework)

Rejected for V1. Pulling in a general-purpose state-machine or job-queue library would add a third-party dependency and a much larger surface (most such libraries assume a live process/server model, retries-with-backoff policy of their own invention, or a specific persistence backend) for a kernel this RFC deliberately scopes to "smallest." Revisiting this remains open if a future phase's needs outgrow the local file-backed design — not rejected forever, rejected for this proposal's bounded scope.

### 4. Event-sourced persistence as the primary (not internal-history) design

Considered and rejected as the *primary* persistence model for V1 (more moving parts than the smallest kernel needs — reading "current state" requires log replay or a maintained snapshot) but retained as a plausible S11 Memory & Observability evolution; see "Persistence" above.

### 5. Give the kernel an active timeout daemon instead of a passive `sweep_expired_leases()` query

Considered. Rejected for V1 because an active daemon is exactly the Orchestrator's (S8) job and would make S4 an active system mechanism rather than a pure library, contradicting the "smallest kernel" / "distinguish transition function from operational subsystem" goals. Flagged as an open question below in case the Architect judges this boundary too permissive (e.g., a stalled task with an expired lease and no orchestrator yet running could sit unnoticed).

### 6. Rely on atomic rename alone, with no separate mutex primitive (an earlier draft's design)

Rejected on Architect review (`AS65-F001`) and not retained even as a considered-and-rejected alternative in good standing: atomic rename correctly protects readers from torn files, but does not serialize two concurrent read-modify-write cycles, so relying on it alone allows a later commit to silently overwrite an earlier one that a stale `revision` check would have caught if the comparison and the persist had been atomic together. §D's `wx`-exclusive lock file corrects this by making the entire read-validate-mutate-persist sequence a genuine critical section. This alternative is recorded here specifically so the correction is traceable, not silently absorbed into the design as if the flaw never existed.

### 7. Read the task-retry ceiling live from `coordination/STATE.md`'s `MAX_REMEDIATION_CYCLES` (an earlier draft's design)

Rejected on Architect review (`AS65-F003`) for the same reason recorded here as it was found: `coordination/STATE.md` is a bootstrap turn-lock/remediation-control file, not stable S4 task policy, and its cap bounds a different kind of cycle (Architect-remediation reviews) for a different reason. Reading it live would make task-retry behavior change whenever an unrelated Architect review cycle's cap changed. §E instead proposes an explicit, separately-decided S4 Task Policy input.

## Risks

### Over-scoping into later phases
Mitigation: the explicit non-goals list and the "boundary for later phases" section (§H) name exactly what S5/S7/S8/S9/S13 are still solely responsible for; any future implementation review should re-check the diff against this list.

### The kernel becomes a de facto Evidence Gate
Mitigation: the kernel checks only evidence-reference *presence and class label* on named transitions, never sufficiency or content — exactly mirroring `CORE-004`'s "Evidence Gate is not an authority actor" posture and S3's own "It is not an Evidence Gate" statement.

### Stale-owner overwrite despite lease expiry
Mitigation: the unified `revision` token compared and persisted **inside** the same `wx`-exclusive-lock-guarded critical section (§D) is specifically constructed so expiry alone can never let a superseded owner's write land, and so two real concurrent writers — not just two calls in one JS event loop — cannot both succeed against the same starting revision; this is the single most safety-critical property of the whole design and should receive the most scrutiny in Architect review and, later, in test coverage with real concurrent processes.

### Ownership handoff still stalls at a role boundary
Mitigation: the designated-handoff-transition rule (§D) atomically clears `owner`/`lease_expires_at` on every transition into `READY_FOR_BUILD`/`READY_FOR_QA`/`READY_FOR_REVIEW`/`CHANGES_REQUESTED`/`PAULO_DECISION_REQUIRED`, so the next role can claim immediately rather than waiting out a lease that was never meant to still apply; the same write also fences the outgoing owner via the `revision` bump.

### Retry-ceiling policy left unresolved
Mitigation: explicitly named as an open Paulo decision (§E) rather than silently defaulted to a number or inherited from an unrelated bootstrap file; the fail-closed escalation *behavior* (ceiling exceeded → `FAILED`/`PAULO_DECISION_REQUIRED`) does not depend on knowing the number in advance, only on the mechanism existing.

### A crashed writer's orphaned lock blocks its one task until an operator intervenes
Mitigation: this is a deliberate, disclosed availability trade-off (§D), not an oversight — an earlier, automatic age-based lock-stealing design was rejected on Architect review because it could let a merely-paused-but-alive writer and a lock-stealing writer both enter the critical section, silently violating the single-authoritative-writer invariant. Fail-closed blocking of one task is judged strictly safer than that outcome; the blast radius is scoped to the one affected task (one lock file per task), and diagnostic metadata on the lock file supports fast operator recovery.

### Two terminal states added to a frozen document
Mitigation: flagged explicitly under "Affected rules" and "Unresolved questions" for deliberate Architect sign-off rather than silently assumed.

### Persistence choice proves insufficient at scale
Mitigation: explicitly bounded and disclosed in §F ("not intended to scale past the low task volumes typical of a single-repository governance pilot"), with SQLite named as the fallback evolution rather than discovered as a surprise later.

## Migration impact

None. No live task-state data exists to migrate (nothing has ever tracked per-task lifecycle state in this repository). No existing file, schema, or record is modified by this RFC.

## Security / trust impact

No new trust boundary is created or granted. The kernel's `actor_id` field is a bare, unauthenticated string in this design — S4 explicitly defers actual identity/permission enforcement to S5 (`Capability != Authority`, `CORE-002`, `TRUST_BOUNDARIES.md` TB-7), exactly as every other current Sentinel mechanism does during this bootstrap window. The kernel introduces no capability, credential, or remote-resource access of any kind (`CORE-008`, `CORE-019` are both inapplicable — no remote/cloud action is proposed).

## Evidence requirements

A future S4 implementation's acceptance should require, at minimum:

- `INDEPENDENTLY_INSPECTED` review of the transition-table/schema/persistence-adapter source against this RFC's design;
- Builder-reported (`ACTOR_REPORTED`) focused test execution covering, at minimum, the negative/race/restart cases named in the "Implementation mapping" table below;
- independent inspection that the evidence-presence gate on `MAIN`/`DEPLOYED`/`VERIFIED`-analogous transitions is compatible with `CORE-016`/`017`/`018`/`020`, using the same guarantee-check method S3's own validator already established;
- proof (by test, independently inspected) that an expired-but-unfenced write is rejected — the single most safety-critical property named above;
- proof that the kernel never itself claims merge/deployment/production authority;
- proof that S5/S7/S8/S9/S13 mechanisms remain absent from the implementation.

No production/runtime evidence is required for this repository-local, non-remote subsystem.

## Rollout

1. This RFC undergoes Architect Sync review (`STAGE GATE REVIEW`, `ARCHITECTURE`-class).
2. If findings require remediation, a bounded remediation cycle addresses them, capped at `MAX_REMEDIATION_CYCLES` per the existing protocol.
3. Architect issues a design verdict (`ARCHITECT_APPROVED` or equivalent).
4. Paulo records a separate, explicit implementation-authorization Decision — this RFC's acceptance does not itself authorize implementation, exactly as `ML-DEVOS-RFC-013`'s own rollout kept design acceptance and implementation authorization as separate steps.
5. Only then does a Builder implement the schema/library/persistence-adapter/tests this RFC describes, under its own bounded write-whitelist.
6. Architect independently reviews the implementation.
7. After acceptance, a closure ADR is written and the version-disposition question (§F) is resolved by Paulo, following the exact D.1/D.2 Closure Preflight/Verification procedure.
8. Only after S4 closes may S5 be proposed.

## Rollback

Because this RFC creates no file and no live state, "rollback" at this stage means simply not accepting the design — there is nothing to revert. For a future implementation, rollback would mean reverting the implementation commit(s) and restoring `devos/state/` to its current `NOT_IMPLEMENTED` reserved-root state, with no live task-state data requiring migration back (none would yet exist outside the newly-introduced subsystem's own local files).

## Compatibility

Compatible with: the frozen `ML-DEVOS-ARCH-001` §10/§11 (subject to the explicit two-terminal-state addition flagged above), the active S3 Task Contract mechanism (referenced, not duplicated), `CORE-001/002/006/007/012/014/016/017/018/020` (all consumed unchanged), and Traceability V1 (which may index this RFC's and any future implementation's governance IDs without owning their semantics). This design introduces no runtime dependency on `coordination/STATE.md` or its `MAX_REMEDIATION_CYCLES` field (corrected per `AS65-F003`; see §E).

Incompatible with any future implementation that: stores or interprets evidence content itself (would duplicate S7/S9), performs its own actor-permission checks (would duplicate/pre-empt S5), autonomously dispatches actors (would duplicate S8), or treats a task reaching `MERGED`/`DEPLOYED`/`VERIFIED` in kernel state as itself a merge/deployment/production authorization.

## Version impact

Per `devos/governance/specifications/VERSIONING_POLICY.md`: **no version impact from this RFC itself.** This RFC is a design proposal only; it changes no existing rule's meaning, grants no authority, and creates no capability. A future, separately authorized S4 *implementation* would very plausibly be assessed `MINOR` (new backwards-compatible subsystem, no existing rule's meaning changes) — see §F's "Honest manifest/version/closure consequences" — but that assessment and its version bump belong to that future closure's own Decision/ADR, not to this proposal.

## Architect Sync requirement

Yes — `ARCHITECTURE` class, and an explicit named phase in the frozen `ML-DEVOS-SIP-001` roadmap. Per `D-048`'s authorization, this cycle's Architect Sync reviews the design and audit only; it does not itself authorize implementation.

## Paulo decision requirement

Yes, separately, for implementation authorization — exactly as `ML-DEVOS-RFC-013`'s own rollout kept design acceptance (`D-044`-equivalent) and implementation authorization (`D-045`-equivalent) as two distinct Decisions for S3. `D-048` authorized this proposal/audit step only and explicitly states: "A later Paulo decision must authorize implementation of the reviewed design."

## Implementation mapping (Requirement → Design → Implementation → Test → Evidence → Status)

All rows below are `NOT STARTED`; no code, schema, or test file exists yet. This table records the *planned* shape only, per `D-048`'s explicit "no fabricated PASS evidence" requirement.

| # | Requirement | Design (this RFC, §) | Planned implementation | Planned test | Required evidence class | Status |
|---|---|---|---|---|---|---|
| 1 | `ML-DEVOS-SIP-001` S4 row; `ML-DEVOS-ARCH-001` §10 | State vocabulary + transition table (§C) | `devos/state/task-state.schema.json`, a pure `applyTransition(state, event)` function | Table-driven test asserting every legal transition succeeds and every illustrative rejected transition (skip-ahead, terminal-state exit, missing evidence guard) is refused | `INDEPENDENTLY_INSPECTED` (design); `ACTOR_REPORTED` then `INDEPENDENTLY_REPRODUCED` (future implementation) | `NOT STARTED` |
| 2 | `ML-DEVOS-ARCH-001` §11 (Task Engine State boundary) | Task-state field shape excludes Run History/Evidence Store/coordination-turn content (§B) | Field-shape validator (schema `additionalProperties: false`, mirroring S3's convention) | Negative test: a record carrying a Run-History-shaped field (e.g. raw command output) is rejected structurally | `INDEPENDENTLY_INSPECTED` | `NOT STARTED` |
| 3 | Single-owner claim, real fencing | `wx`-exclusive lock file guarding the atomic critical section; unified `revision` token (§D) | `devos/state/lease.mjs` | **Race test using two real concurrent OS-level writers** (`node:child_process` or `node:worker_threads` — explicitly not two calls in one event loop, per `AS65-F001`): two processes attempt `claim()` against one expired lease simultaneously — assert exactly one wins, the loser gets an explicit conflict (never a silent no-op), and a post-hoc read shows exactly one incremented `revision` | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` | `NOT STARTED` |
| 4 | Expiry must not let an old owner overwrite a new owner | `revision` compare-and-swap performed inside the lock-held critical section, independent of clock state (§D) | Same as #3 | **Race/negative test with real concurrent writers**: simulate an old owner presenting a stale `revision` after a new claimant has superseded it (via injected clock) — assert the stale write is rejected even though the old owner's local view still shows itself as "within lease" | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` (this is the single highest-priority test in the whole implementation) | `NOT STARTED` |
| 4a | Ownership handoff does not deadlock, and fences the outgoing owner | Designated-handoff-transition rule atomically clearing `owner`/`lease_expires_at` and bumping `revision` (§D) | Same as #3 | **Positive test**: immediately after `BUILDING → READY_FOR_QA` (and likewise `QA → READY_FOR_REVIEW`, `REVIEW → CHANGES_REQUESTED`), a different actor's `claim()` succeeds with no wait for real-time lease expiry. **Negative test**: the prior owner's subsequent `renew()`/`transition()` call, presenting its pre-handoff `revision`, is rejected as stale | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` | `NOT STARTED` |
| 5 | Idempotent `claim`/`renew`/`transition` | Idempotency-key ledger and per-operation request binding (§E) | Idempotency-key lookup path shared by `claim`/`renew`/`transition` | Test per operation: identical retried request returns identical cached result (no double-apply, `revision`/`retry_count` unchanged); a request differing in its bound fields under the same key is rejected | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` | `NOT STARTED` |
| 5a | Idempotent `release` without a persisted key | `release`'s documented already-unowned no-op exception (§E) | `release()`'s ownership-check branch | Test: `release()` called twice in a row succeeds both times with no error on the second call; a `release()` presenting a stale `revision` against a task now owned by someone else is rejected as a genuine conflict, not silently treated as a safe replay | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` | `NOT STARTED` |
| 6 | Bounded, durable retries, decoupled from bootstrap coordination | Explicit S4 Task Policy retry-ceiling input, never read from `coordination/STATE.md` (§E) | Retry-counter increment/ceiling-check path, reading only the injected Task Policy | Test: ceiling-exceeded forces `FAILED`/`PAULO_DECISION_REQUIRED`, never an unbounded loop. **Negative test**: changing `coordination/STATE.md`'s `MAX_REMEDIATION_CYCLES` between two kernel calls has no effect on kernel behavior, proving the absence of the rejected runtime dependency (`AS65-F003`) | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` | `NOT STARTED` |
| 7 | Deterministic clock injection | Injectable `now()` (§D) | `now` parameter threaded through every lease-aware call | Test: identical scenario run with two different injected clock sequences produces deterministic, reproducible results with no real-time sleep | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` | `NOT STARTED` |
| 8 | Crash-safe persistence and mutual exclusion | `wx`-exclusive lock file plus write-temp-then-atomic-rename, with fail-closed orphaned-lock handling (§D, §F) | `devos/state/store.mjs` file-backed adapter | **Restart/corruption test**: simulate a leftover `.tmp` file from a crash mid-write — assert the loader ignores it and returns only the last successfully renamed record; simulate a corrupted final file — assert a scoped, explicit error for that one `task_id`, not a process crash. **Orphaned-lock test (`AS65-F001`, remaining blocker)**: simulate an existing `.lock` file of any age, including one far older than any plausible operation duration — assert ordinary mutation *never* auto-unlinks it and instead returns a deterministic `LOCK_HELD`/`LOCK_RECOVERY_REQUIRED` result every time, with no age-based branch in the code path; separately assert the distinct, explicitly-invoked `force_clear_lock` operator action successfully clears a lock when called directly | `ACTOR_REPORTED` → `INDEPENDENTLY_REPRODUCED` | `NOT STARTED` |
| 9 | No evidence-sufficiency judgment inside the kernel | Presence/class-label-only evidence gate (§G) | Evidence-reference presence check on the six named transitions | Test: a transition with a present but wrong-class `evidence_ref` (e.g. `ACTOR_REPORTED` presented for `DEPLOYED → VERIFIED`) is rejected on class-label grounds alone, without the kernel inspecting the referenced artifact's content (it has none to inspect) | `INDEPENDENTLY_INSPECTED` | `NOT STARTED` |
| 10 | No authority leakage | Fixed non-authority disclaimer field, mirroring S3's `authority_disclaimer` (§G) | Schema `const` field | Test mirroring S3's `reworded-authority-disclaimer` fixture: the field cannot be softened or omitted | `INDEPENDENTLY_INSPECTED` | `NOT STARTED` |
| 11 | Reserved-root closure eligibility | D.1/D.2 Closure Preflight/Verification procedure (§F) | N/A — governance record only | N/A | `INDEPENDENTLY_INSPECTED` of the closure package, once proposed | `NOT STARTED` |

## Unresolved questions for Architect / Paulo

1. Does adding `FAILED`/`ABANDONED` as two additive terminal states to `ML-DEVOS-ARCH-001` §10's frozen diagram require its own explicit sign-off as an amendment to that specific frozen document (distinct from this RFC's own `ARCHITECTURE`-class approval), or does this RFC's approval suffice? This RFC takes no position and defers the answer to Architect review.
2. Is the "passive `sweep_expired_leases()` query, no active timeout daemon" boundary (§E, §H) the right cut between S4 and S8, or should S4 itself own an explicit "declare stale" operation rather than leaving expired-but-unswept tasks silently invisible until an orchestrator exists to poll them?
3. §E now proposes an explicit S4 Task Policy input for the per-transition-class retry ceiling, with its numeric values left for a future, separate Paulo decision rather than reused from `coordination/STATE.md` or invented by this proposal (correcting `AS65-F003`). Does the Architect agree this input should be scoped per-project (all tasks in `Dillaab-source/maisog-labs` share one ceiling set) or per-task-contract (each S3 contract may specify its own)? (§D's orphaned-lock recovery is now explicitly operator-driven and fail-closed rather than age-based, per the cycle-2 remediation below, so it no longer has a staleness-ceiling value to scope here.)
5. §D's fail-closed orphaned-lock recovery (cycle 2 remediation) leaves the exact shape of the operator/admin `force_clear_lock`-style recovery action to a future implementation. Should this RFC specify that action's authorization requirements now (e.g. which role may invoke it, whether it requires a Decision reference), or is that appropriately deferred to the implementation cycle as an operational detail rather than an architectural one?
4. Is the proposed per-task-file-with-internal-history persistence shape (§F) an acceptable "Task Engine State" boundary against future Run History (§B), or would the Architect prefer the transition history split into a separate file/store now, even at V1, to avoid a later migration?

This RFC grants no authority, freezes no new policy on its own, and authorizes no implementation. It records a design for a future, separately gated Paulo decision, exactly as `D-048` requires.
