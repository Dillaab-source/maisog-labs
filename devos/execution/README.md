# devos/execution/ — S6 Isolated Execution V1 core

`MANIFEST STATUS: NOT_IMPLEMENTED` — `executable_runtime_present: false`. This is implementation-in-progress. It was first built under `D-071` against `ML-DEVOS-RFC-019` as approved by `ML-DEVOS-AS-093`, and is being hardened under `D-074` against the integrity-hardened RFC-019 (`D-073`) as accepted by `ML-DEVOS-AS-101`. All Builder test evidence is `ACTOR_REPORTED` pending independent review. It is **not** closed: there is no `closure_ref` or closure ADR, and Sentinel stays at `v1.8.0`. Closure is separately gated after independent implementation review (`ML-DEVOS-RFC-015` D.1/D.2).

Canonical owning phase: **S6 — Isolated Execution**. Known consuming phases: S7, S8.

## What this is

A repository-local library that proves *where* and *under what conditions* governed work may run. Nothing invokes it unless a caller imports it.

- **Execution Identity and Fencing Checkpoint** (`identity.mjs`). The identity is immutable and digested. The checkpoint holds S4's own revision and advances only by gap-free +1 (§3, §3.1).
- **Dedicated-clone workspaces** (`host.mjs`) under a host-configured `workspace_root` outside every Git tree. It creates non-existent paths safely (§9.1), deletes without following links, and quarantines rather than cleaning into compliance (`paths.mjs`).
- **Environment and credential boundaries.** The environment is built from an allowlist with a deny-set backstop. Instance Git and npm config carries no credentials, and credential files are scanned for by name (`environment.mjs`).
- **One task store per task** (`store.mjs`; §13.2, `D-074`). Every mutable S6 fact for a task — the active-environment slot, create bindings, instance records, permit bindings and statuses, execution-uncertainty reservations, liveness obligations, RTR metadata, prepared external-effect intents and the hash-chained journal (`journal.mjs`) — lives in one crash-atomic envelope under the host state directory. Immutable bodies (permit bodies, Execution Report bodies, RTR bodies) are content-addressed blobs, written and verified before any commit references them. A commit writes a complete temporary envelope, fsyncs it, renames it over the previous one and fsyncs the directory, after a version compare-and-set under the per-task exclusive lock (never stolen). The store opens only on a platform whose replace-atomicity has been proven (`STORE_PROVEN_PLATFORMS`: `linux`); elsewhere it refuses (`ISOLATION_CAPABILITY_MISSING`).
- **One linearization discipline** (`AS95-F001`, §13.2). Every local transition runs through one wrapper (`tx` in `host.mjs`): it takes the task lock once, re-reads the committed state, checks attribution of every `PENDING` record (§7.1.3), applies the transition to a draft, releases the slot iff its holder became non-ACTIVE, and commits one version. The draft rules — legal-transition tables, terminal monotonicity, reservation closure — are in `state.mjs`, which touches no file. External effects (clone, push, S4 transition, deletion) run outside the lock as prepare → effect → reconcile, their outcome decided by observation (§13.3). Quiesce, like claim, re-checks current S4 fencing under the lock before it changes anything (`AS95-F002`).
- **One ACTIVE environment per task** (§13.4). `ACTIVE = lifecycle_can_progress OR unresolved_external_influence`. The slot commits first at create, together with the create binding, the identity and the `CREATING` record, before anything is created on disk. A `QUARANTINED` instance keeps the slot while it has a `CLAIMED` permit whose claim execution-uncertainty reservation is `OPEN`, an `OPEN` liveness obligation, or any open intent or `PENDING` publication. A prepared cleanup is itself influence, so it is prepared only by the slot holder or while the slot is free.
- **Execution uncertainty** (§13.1; `AS99-F001`, `AS100-F001`). Permit status is history and is never rewritten. A claim opens its execution-uncertainty reservation in the claim transaction. A verified report — late ones included — moves the permit to `REPORTED`, supersedes the reservation and registers every reported process group as an `OPEN` liveness obligation in ONE transaction; it never restores or publishes a quarantined instance. `resolveExecution` proves exactly the groups it can by read-only inspection (`PROOF_RESOLVED`). `resolveExecutionByOperator` is the audited override of ONE named claim or obligation (`OPERATOR_RESOLVED`, operator identity, reason, evidence reference, `ACTOR_REPORTED`); it closes nothing else. Time never changes a reservation.
- **Reference model** (`model.mjs`; §13.6). A pure model of the same rules over a bounded world, with invariants I1–I13, the named sequences Q1–Q5b and Mutants A–C. It is test support, not part of the public surface.
- **Publication reservation** (`AS96-F001`, §13.3). The S4 publication transition runs outside the lock, so an unresolved `PENDING` Result Transfer Record is itself a durable reservation on its instance. A `PENDING` record that cannot be attributed (§7.1.3) blocks every lifecycle operation of the task. While it exists, `finishWithoutPublication`, `cleanup`, `adoptRenewal` and `quiesce` fail closed (`RESULT_TRANSFER_UNPROVEN`), and `attach` keeps its guard. `complete` may resume the same reservation, and recovery may resolve it. `ABORTED` is written only for a definitive S4 refusal; a transient S4 failure leaves the record `PENDING`. A commit never restores a quarantined instance. The full per-operation classification is in `host.mjs`.
- **Result Transfer Record and publication** (`rtr.mjs`, `host.mjs`):
  - a write-ahead immutable body;
  - a non-circular `prepublication_provenance_digest`;
  - the single `ACTOR_REPORTED` `evidenceRef` payload;
  - byte-identical S4 replay.

  S6 issues exactly one S4 mutation: the Builder `BUILDING → READY_FOR_QA` transition, as the owner's agent.
- **Independent QA reconstruction** from the committed record's commit, fetched by exact SHA, with a gap-free QA revision chain.
- **Execution Request / Permit / Report contracts** (`permits.mjs`), with these rules:
  - one request mints at most one permit. The permit body is a verified blob first; the request binding, the `ISSUED` status and the `PERMIT_ISSUED` entry then commit in one transaction. A blob no committed binding references is an orphan, never a permit (`AS94-F002`, §13.2);
  - S5 `shell.exec` is checked at issuance **and** again at claim, so live revocation and expiry are honoured. At claim, every final check runs under the per-task S6 lock: S4 fencing (including the permit's pinned checkpoint revision and the role state) first, the fresh S5 recheck last, then `CLAIMED` (`AS94-F001`);
  - an Execution Report must carry every RFC-019 field (timing, exit code or signal, output digests, `terminated`) consistently, and all of them are stored and journaled (`AS94-F004`);
  - the S5 subject must be the S4 owner in the mapped role (`BUILDER` → `Builder`, `QA` → `QA`);
  - a claimed permit never becomes quiescence-safe by expiry.
- **Transport** (`transport.mjs`): policy, ref, lease and provenance logic, with every call gated by an S5 `github` decision. Under `D-071` it accepts **local repository paths only**. Network remotes fail closed as `TRANSPORT_NOT_AUTHORIZED`.
- **Read-only quiescence proof** (`liveness.mjs`): `/proc` on Linux, and a signal-0 existence probe on other POSIX systems.
- **The reason vocabulary** (`vocabulary.mjs`): 30 codes in a fixed precedence order.

## What this is not

- **Not a command executor.** S6 core exposes no `run()`, no `spawn()`, no shell bridge, and no API that executes caller-selected argv (`D-069`). Actor- and tool-chosen commands are data inside Execution Requests. Only a separately authorized **execution driver** would run them, and none exists or is authorized by `D-071`.
  - The only child process S6 core starts is the fixed `git` binary. `git.mjs` exposes a closed set of named Git operations with validated structured parameters (exact SHAs, plain branch refs, absolute paths); each builds its literal argv internally, and the process runner is module-private. No S6 function accepts an argv or command to execute (`AS94-F003`). `git.mjs` is not re-exported from `index.mjs`. Whether even these fixed calls suit a given runtime's safety controls is RFC-019 Unresolved question 8.
- **Not a sandbox.** V1 is L1 + dedicated-clone L2 + L3. It does not contain a deliberately hostile same-user process, and it does not prevent deliberate reads of host credential stores (RFC-019 §1, Residual risks).
- **Not a mutable store handed out.** The host returned by `createExecutionHost()` is closed lifecycle operations and read-only views; it exposes no store, registry, journal append or fault hook, and refuses fault-injection configuration (§13.5). Tests construct hosts through `testing.mjs`, which `index.mjs` never exports.
- **Not authority.** Isolation != Authority. An S5 `ALLOW` is never sufficient (S5 is not argv-aware), and S5 `DENY` always blocks.
- **Not live transport.** It has no standing GitHub authority, uses no credentials, and makes no network writes.
- **Windows:** the path rules are implemented and unit-tested. V1 has no read-only Job Object inspection, so a Windows profile fails closed as `ISOLATION_CAPABILITY_MISSING`.

## Tests

The tests use local bare repositories, temporary S4 stores, a real public S5 `createGateway()` over test policies, an injected fake driver that executes nothing, a closed table of fixed fixture operations with literal argv (`tests/fixtures/execution/drivers.mjs`), and fixed crash workers that SIGKILL themselves at one of a closed set of named steps or task-store persistence points (`crash-worker.mjs`, `store-worker.mjs`). Fixture repositories are built through named helpers in `harness.mjs` whose argv is literal. None of them accepts a caller-supplied command:

- `tests/execution-store.test.mjs` — the transaction-substrate proof (real SIGKILL at every commit persistence point, random-time kills, concurrent writer processes);
- `tests/execution-model.test.mjs` — the reference model: I1–I13 over bounded exhaustive generation, Q1–Q5b, Mutants A–C;
- `tests/execution-slot.test.mjs` — Q1–Q5b on the real host, replayed against the model;
- `tests/execution-crash-matrix.test.mjs` — persistence-point crashes of claim, report, operator resolution, push and cleanup (§18 item 15);
- `tests/execution-core.test.mjs`, `tests/execution-permits.test.mjs`, `tests/execution-lifecycle.test.mjs`, `tests/execution-linearization.test.mjs`, `tests/execution-publication.test.mjs`, `tests/execution-recovery.test.mjs`;
- `tests/execution-mutation.test.mjs` — every guard, including the D-074 mutants, must be killed by a failing assertion.

Crash results are process-crash evidence only: no OS-crash or power-loss durability is claimed (§13.2 "Durability scope").

Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change.
