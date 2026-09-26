# Current Handoff — S6-Core Integrity-Hardening Implementation (D-074, AS-101)

```yaml
schema_version: 1
handoff_id: H-S6-CORE-HARDEN-0001
cycle_id: SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION
input_base_commit: 3f0fdafa62b4c58b42ef6da3e425c1afdfbcddaa
review_target_commit: 3f0fdafa62b4c58b42ef6da3e425c1afdfbcddaa
applicable_review_id: ML-DEVOS-AS-101
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this implementation. Every result below is `ACTOR_REPORTED` pending independent Architect inspection and reproduction.

## Objective

Harden the authoritative tracked S6 core (`devos/execution/**`) against `ML-DEVOS-RFC-019` §13.2–§13.6 and §18, as accepted by `ML-DEVOS-AS-101`, under `D-074` (scope `SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION_D074_ONLY`, remediation cycle 0).

Provenance:
- Bootstrapped from the authoritative tip `3f0fdaf` after publishing, in order, `ML-DEVOS-AS-101` (`210bf97`) and the `D-074` owner transition (`3f0fdaf`).
- Implementation starting SHA: `3f0fdafa62b4c58b42ef6da3e425c1afdfbcddaa`. The ending SHA is the commit that publishes this handoff (its sole parent is the starting SHA; see the publication report).
- The work was done in the clean worktree. The suspended `D-068` local draft in the primary checkout was **not** staged, committed, pushed, imported or used: no file of this change is byte-identical to any draft file, and the primary checkout's untracked directories are unchanged.

## Mandatory first gate — transaction substrate (D-074, §13.2 "Proof first")

The preferred V1 store was built and proven **before** any broad refactoring (`devos/execution/store.mjs`):
- one crash-atomic envelope per task: write a complete temporary file, fsync it, rename it over the previous envelope, fsync the directory;
- a per-task exclusive lock that is never stolen, and a version compare-and-set re-read under it;
- a verified state digest; content-addressed blobs, written, fsynced and re-verified before any commit references them.

| Proof (`tests/execution-store.test.mjs`, real child processes) | Result |
|---|---|
| SIGKILL at each commit persistence point (`envelope:written`, `:synced`, `:renamed`, `:committed`) × envelope sizes 0 B / 64 KiB / 1 MiB (12 cases) | Always exactly the last acknowledged version (before the rename) or its successor (from the rename on); never torn, mixed or lost |
| 40 random-time SIGKILLs of a continuous 200 KB-envelope writer | Every committed state was an acknowledged state or its successor |
| 4 concurrent writer processes × 25 increments | 100/100, no lost update |
| SIGKILL during a 2 MB blob write (after write; after link) | Never a partial or mismatched blob at its digest name |
| Corrupted, truncated, foreign-task, foreign-format or version-0 envelope | Blocks the task (`ISOLATION_UNPROVABLE`); nothing repaired |
| Held lock | Never stolen; fails closed |

**Platform matrix:**

| Platform | Result |
|---|---|
| Linux x86_64, kernel 6.18, ext4, Node v22.22.2 | **RUN — proven** (process-crash) |
| darwin | **NOT RUN** — the store refuses to open (`ISOLATION_CAPABILITY_MISSING`) |
| win32 | **NOT RUN** — the store refuses to open |

The store therefore relies on replace-atomicity only where it was proven (`STORE_PROVEN_PLATFORMS = ["linux"]`). This **narrows** the previously declared supported platforms. Power-loss / OS-crash durability is **not** claimed (§13.2 "Durability scope"). No SQLite and no multi-file fallback were introduced.

## What changed (implementation)

- **Task store** (`store.mjs`) and **draft-state rules** (`state.mjs`, no filesystem access):
  - every mutable S6 fact commits through one transaction per logical transition;
  - the old multi-file `registry.mjs` is **deleted**, and the file-appending `Journal` class is removed;
  - the journal hash chain is unchanged and now commits inside the envelope with the state it justifies.
- **One transaction wrapper** (`tx` in `host.mjs`). It is the only caller of `store.transact`. It:
  - runs the §7.1.3 attribution check first;
  - persists lazy expiry;
  - releases the slot only when the facts make the holder non-ACTIVE;
  - supports commit-then-fail for revocations and stale flags.
- **Prepare → effect → reconcile** for external effects:
  - *create* commits slot + create binding + identity + `CREATING` before anything touches disk;
  - *push* commits an intent, and its outcome is decided by reading the remote ref (`DONE` / `NOT_APPLIED` / `CONFLICT`);
  - *publication* writes the RTR body blob, then commits metadata + `PENDING` + `RTR_PENDING` together;
  - *cleanup* commits an intent carrying the proven root, and its outcome is decided by observing that root.
- **Active slot:** `ACTIVE = lifecycle_can_progress OR unresolved_external_influence`, derived in `state.mjs`. A second or concurrent create is `WORKTREE_COLLISION`.
- **Execution uncertainty (AS99/AS100):**
  - a claim reservation is opened in the claim transaction;
  - a verified (late) report moves the permit to `REPORTED`, sets the reservation to `SUPERSEDED_BY_REPORT` and registers `OPEN` obligations, all in one transaction;
  - `resolveExecution` proves exactly the dead groups;
  - `resolveExecutionByOperator` closes one named claim or obligation (operator, reason, evidence reference, `ACTOR_REPORTED`);
  - quarantine and time close nothing.
- **Permit minting:** the body blob is written first, then binding + `ISSUED` + `PERMIT_ISSUED` commit in one transaction.
- **Closed public surface (§13.5):**
  - `createExecutionHost()` returns 17 closed operations and read-only views, and refuses `faults`/`storeHooks`;
  - the previous host exposed `registry` and accepted `faults`; both are removed;
  - test-only construction is `testing.mjs`, which `index.mjs` never exports.
- **Reference model** (`model.mjs`): pure; its six facts are independent; I1–I13, Q1–Q5b, Mutants A–C.
- **Recovery (§15):**
  - the store must be readable;
  - `PENDING` records are proved attributable before replay, and an unattributable one blocks the task;
  - intents are reconciled by observation;
  - a `CLAIMED` permit with an `OPEN` reservation → quarantine, **slot kept**;
  - an interrupted `CREATING` → quarantine;
  - live instances are re-fenced;
  - orphan directories and unreferenced blobs are reported, never adopted.
- **Provenance** is a deterministic projection of committed history. It adds reservations, operator resolutions, slot and ACTIVE status.

## Implementation decisions the Architect should check

1. **A prepared cleanup takes or requires the slot.** The reference model found it: a cleanup intent is §13.3 unresolved influence and so makes its instance ACTIVE. Cleaning an old quarantined instance while a newer instance holds the slot would therefore make two ACTIVE environments (I1). Cleanup is prepared only by the slot holder or while the slot is free (else `WORKTREE_COLLISION`). Cost: residue of an old instance waits until the task slot is free. RFC-019's cleanup preconditions do not name this; it follows from §13.4/I1 and is disclosed, not a design change.
2. **Create interrupted before any directory exists.** If the prepared workspace path is absent, cleanup marks the record `CLEANED` (`nothing_created`); anything present there without a recorded chain is never deleted.
3. **A report after an operator resolution is refused** (`ISOLATION_UNPROVABLE`): the claim reservation is terminal. Accepting it would re-open influence on an instance whose slot may already be reused (I1).
4. **Push intent outcome `NOT_APPLIED`** when the remote still holds the expected value after the push call returned. The same observation is applied at recovery. A surviving same-user `git` process could still update the instance-scoped branch later; that branch is never consumed without a `COMMITTED` RTR (see limitations).
5. **Operator authorization** is outside S6: whoever holds the host object can call `resolveExecutionByOperator`, the same model as stale-lock removal. The record is `ACTOR_REPORTED`.
6. **No operator path for an unattributable `PENDING` record** was built. The task stays blocked (§7.1.3); the RFC names an operator resolution but does not specify it.

## Tests and evidence

All `ACTOR_REPORTED`, fresh from this session in the clean worktree on the Linux profile above.

| Check | Result | Exit |
|---|---|---|
| Transaction-substrate proof (`execution-store`) | 21/21 | 0 |
| Reference model (`execution-model`): bounded exhaustive generation, depth 14 | 50,032 distinct states, 120,722 transitions, **0 violations** of I1–I13; Q1–Q5b pass; Mutants A, B, C each falsified by generation and by named sequence; 16/16 tests | 0 |
| Reference model, deeper spot run (not in the suite) | depth 16: 112,056 states, 288,448 transitions, 0 violations | 0 |
| Runtime replay against the model (`execution-slot`): Q1–Q5b on the real host, same outcomes as the model; concurrent creates; cleanup/slot rule | 10/10 | 0 |
| Persistence-point crash matrix (`execution-crash-matrix`): real SIGKILL inside claim, late-report and operator-resolution commits (synced vs renamed); after push intent; after cleanup intent; I1/I3/I9/I12/I13 checked after every crash | 8/8 | 0 |
| Recovery (`execution-recovery`): publication SIGKILL at after-push/after-pending/after-transition; create SIGKILL; permit minting faults and real SIGKILL at blob, commit and inside the commit; tampered/unattributable `PENDING` blocks the task | 20/20 | 0 |
| Mutation (`execution-mutation`): anchor check + unmutated control + **48 mutants**, including runtime Mutant A (M38), B (M39), C (M40), late-report gap (M41), proof without inspection (M42), attribution skipped (M43), slot check skipped (M44), journal entry dropped (M45), non-derived release (M46), unverified blob (M47), unchecked envelope digest (M48), no store CAS (M25), no task lock (M24) | 50/50: every mutant killed by a failing assertion | 0 |
| `npm test` (whole repository) | 847 tests, 847 pass, 0 fail | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | all example files as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | all bridges OK | 0 |
| `git diff --check` | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | see below | 1 |

Per-suite results (`node --test` per file):

| Suite | Tests | Pass | Fail | Exit |
|---|---|---|---|---|
| `execution-store` | 21 | 21 | 0 | 0 |
| `execution-model` | 16 | 16 | 0 | 0 |
| `execution-slot` | 10 | 10 | 0 | 0 |
| `execution-crash-matrix` | 8 | 8 | 0 | 0 |
| `execution-core` | 26 | 26 | 0 | 0 |
| `execution-permits` | 20 | 20 | 0 | 0 |
| `execution-lifecycle` | 43 | 43 | 0 | 0 |
| `execution-linearization` | 17 | 17 | 0 | 0 |
| `execution-publication` | 10 | 10 | 0 | 0 |
| `execution-recovery` | 20 | 20 | 0 | 0 |
| `execution-mutation` | 50 | 50 | 0 | 0 |

**Traceability.**
- **Base `3f0fdaf`:** 416 files, 2 errors, 14 warnings, `DRIFT` (the AS-101 and D-074 transitions did not regenerate).
- **After:** 424 files, **2** errors, **14** warnings, `No drift`. The two errors are the known `CORE-022` / `WEB-REQ-009` debt, preserved and not suppressed. The validator exits `1` while any ERROR exists. The ERROR/WARNING set is identical to the base.

**No real driver, no generic executor.**
- The only process S6 core starts is still the fixed internal `git` runner (the core source-level test asserts `child_process` is imported only by `git.mjs`).
- No export accepts an argv or command; S6 core signals no process.
- Tests use the injected fake driver (executes nothing) and the closed fixed-fixture table.
- The crash workers accept only closed operation and point sets.

## Changed files

Diff against base `3f0fdafa62b4c58b42ef6da3e425c1afdfbcddaa`:
- **Added:**
  - `devos/execution/store.mjs`, `state.mjs`, `model.mjs`, `testing.mjs`;
  - `tests/execution-store.test.mjs`, `tests/execution-model.test.mjs`, `tests/execution-slot.test.mjs`, `tests/execution-crash-matrix.test.mjs`;
  - `tests/fixtures/execution/store-worker.mjs`.
- **Deleted:** `devos/execution/registry.mjs`.
- **Modified:**
  - `devos/execution/host.mjs`, `journal.mjs`, `index.mjs`, `README.md`;
  - `tests/execution-core.test.mjs`, `-lifecycle`, `-linearization`, `-mutation`, `-permits`, `-publication`, `-recovery`;
  - `tests/fixtures/execution/crash-worker.mjs`, `harness.mjs`.
- **Status note:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md` gains one factual implementation-status sentence; no design text changed.
- **Regenerated:** `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`.
- **Coordination:**
  - `coordination/STATE.md` (return gate);
  - `coordination/CURRENT_HANDOFF.md` (this file; the outgoing `H-S6-INTEGRITY-RFC-REM2-0001` bytes were already archived by the AS-101 transition).

**Not changed:** the DevOS manifest (S6 stays `NOT_IMPLEMENTED`, `executable_runtime_present: false`, no `closure_ref`), any S3/S4/S5 source, interface or schema, any S7+ file, the version (Sentinel `v1.8.0`), any ADR.

## Unresolved findings and limitations

- **Platform:** only Linux (ext4) is proven and supported by the store. darwin and win32 are `NOT RUN` and refused. Windows was already refused by the liveness profile.
- **Durability:** process-crash only. No OS-crash or power-loss claim.
- **Envelope cost:** each commit rewrites the whole envelope. A measured size bound was not established in this cycle. RFC-019 names exceeding such a bound as a reason to return for a backend decision (Residual risk 15, Unresolved question 9).
- **L3 and same-user risk:**
  - a surviving same-user `git` push, or an unreported process, is not contained (Residual risks 1, 12);
  - a `NOT_APPLIED` push intent could in principle be overtaken by such a process on the instance-scoped branch;
  - that branch is never consumed without a `COMMITTED` record.
- **Operator resolution is attestation, not proof** (Residual risk 18). S6 does not authenticate the operator.
- **Unattributable `PENDING` record:** blocks the task with no built operator path (decision 6).
- **Bounded model:** exhausts a small world (one task, two instances, two permits, one publication), not every state (Residual risk 19).
- **Real execution driver:** none exists or is authorized (`D-069`). S6 capability is not complete without one; S6 is not `IMPLEMENTED`.
- **Carried forward, unchanged:** RFC-019 Unresolved questions 1–10, and every `coordination/OPERATIVE_OBLIGATIONS.md` row, none closed.

## Governing references

- Authority: `D-074` (this cycle); `D-073` (design); `D-069`; `D-066`. `D-068` suspended; `D-071`/`D-072` supply no authority here.
- Reviews: `ML-DEVOS-AS-101` (controlling), `ML-DEVOS-AS-100`, `ML-DEVOS-AS-099`, `ML-DEVOS-AS-098`.
- Design: `ML-DEVOS-RFC-019`. Protocol: `ML-DEVOS-RFC-018`. Closure mechanism: `ML-DEVOS-RFC-015`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `3f0fdafa62b4c58b42ef6da3e425c1afdfbcddaa`.
- Substrate: `devos/execution/store.mjs`; `tests/execution-store.test.mjs`; `tests/fixtures/execution/store-worker.mjs`.
- Model: `devos/execution/model.mjs`; `tests/execution-model.test.mjs`.
- Runtime replay and slot: `tests/execution-slot.test.mjs`.
- Crash matrix: `tests/execution-crash-matrix.test.mjs`; `tests/execution-recovery.test.mjs`.
- Mutations: `tests/execution-mutation.test.mjs` (M38–M48 are the D-074 additions).
- Surface: `devos/execution/index.mjs`, `testing.mjs`; `tests/execution-core.test.mjs` ("production surface exposes no mutable store…").

## Next action

The Architect independently reviews this implementation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-101`, inspecting source and independently reproducing the security-adjacent tests where feasible. No closure, manifest status or version change is requested. No further Builder action is authorized.
