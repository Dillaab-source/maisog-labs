# devos/execution/ — S6 Isolated Execution V1 core

`MANIFEST STATUS: NOT_IMPLEMENTED` — `executable_runtime_present: false`. This is implementation-in-progress under `D-071`, against `ML-DEVOS-RFC-019` as amended under `D-069`/`D-070` and approved by `ML-DEVOS-AS-093`. It is **not** closed: there is no `closure_ref` or closure ADR, and Sentinel stays at `v1.8.0`. Closure is separately gated after independent implementation review (`ML-DEVOS-RFC-015` D.1/D.2).

Canonical owning phase: **S6 — Isolated Execution**. Known consuming phases: S7, S8.

## What this is

A repository-local library that proves *where* and *under what conditions* governed work may run. Nothing invokes it unless a caller imports it.

- **Execution Identity and Fencing Checkpoint** (`identity.mjs`). The identity is immutable and digested. The checkpoint holds S4's own revision and advances only by gap-free +1 (§3, §3.1).
- **Dedicated-clone workspaces** (`host.mjs`) under a host-configured `workspace_root` outside every Git tree. It creates non-existent paths safely (§9.1), deletes without following links, and quarantines rather than cleaning into compliance (`paths.mjs`).
- **Environment and credential boundaries.** The environment is built from an allowlist with a deny-set backstop. Instance Git and npm config carries no credentials, and credential files are scanned for by name (`environment.mjs`).
- **Registry and hash-chained journal** (`registry.mjs`, `journal.mjs`) under the host state directory.
- **One linearization discipline** (`AS95-F001`). Every mutation of permit status, instance records and RTR status runs under the per-task S6 lock, after re-reading the authoritative state. External effects (clone, push, S4 transition) run outside the lock, and their outcomes are committed under it. Behind the lock, the registry enforces version compare-and-set and legal-transition tables, so a stale write fails closed and a terminal state (`REVOKED`, `EXPIRED_UNCLAIMED`, `REPORTED`, `QUARANTINED`, `CLEANED`) is never resurrected. Journal appends take a leaf append lock. Quiesce, like claim, re-checks current S4 fencing under the lock before it changes anything (`AS95-F002`).
- **Publication reservation** (`AS96-F001`). The S4 publication transition runs outside the lock, so an unresolved `PENDING` Result Transfer Record is itself a durable reservation on its instance. While it exists, `finishWithoutPublication`, `cleanup`, `adoptRenewal` and `quiesce` fail closed (`RESULT_TRANSFER_UNPROVEN`), and `attach` keeps its guard. `complete` may resume the same reservation, and recovery may resolve it. `ABORTED` is written only for a definitive S4 refusal; a transient S4 failure leaves the record `PENDING`. A commit never restores a quarantined instance. The full per-operation classification is in `host.mjs`.
- **Result Transfer Record and publication** (`rtr.mjs`, `host.mjs`):
  - a write-ahead immutable body;
  - a non-circular `prepublication_provenance_digest`;
  - the single `ACTOR_REPORTED` `evidenceRef` payload;
  - byte-identical S4 replay.

  S6 issues exactly one S4 mutation: the Builder `BUILDING → READY_FOR_QA` transition, as the owner's agent.
- **Independent QA reconstruction** from the committed record's commit, fetched by exact SHA, with a gap-free QA revision chain.
- **Execution Request / Permit / Report contracts** (`permits.mjs`), with these rules:
  - one request mints at most one permit. The request binding, which carries the complete permit body, is published atomically as the only commit point; the body file, status and journal entry are derived from it and rebuilt after a crash. A permit file that no binding names is an orphan, never a permit (`AS94-F002`);
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
- **Not authority.** Isolation != Authority. An S5 `ALLOW` is never sufficient (S5 is not argv-aware), and S5 `DENY` always blocks.
- **Not live transport.** It has no standing GitHub authority, uses no credentials, and makes no network writes.
- **Windows:** the path rules are implemented and unit-tested. V1 has no read-only Job Object inspection, so a Windows profile fails closed as `ISOLATION_CAPABILITY_MISSING`.

## Tests

The tests use local bare repositories, temporary S4 stores, a real public S5 `createGateway()` over test policies, an injected fake driver that executes nothing, a closed table of fixed fixture operations with literal argv (`tests/fixtures/execution/drivers.mjs`), and a fixed crash worker that SIGKILLs itself at one of a closed set of named steps (`tests/fixtures/execution/crash-worker.mjs`). Fixture repositories are built through named helpers in `harness.mjs` whose argv is literal. None of them accepts a caller-supplied command:

- `tests/execution-core.test.mjs`;
- `tests/execution-permits.test.mjs`;
- `tests/execution-lifecycle.test.mjs`;
- `tests/execution-recovery.test.mjs`;
- `tests/execution-mutation.test.mjs`.

Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change.
