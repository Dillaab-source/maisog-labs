# Current Handoff — S6 Core Implementation, Remediation Cycle 1 (AS-094)

```yaml
schema_version: 1
handoff_id: H-S6-CORE-IMPL-REM1-0001
cycle_id: SENTINEL_S6_CORE_IMPLEMENTATION
input_base_commit: a91c509ce3e16aef02e76f873f8893159a3eda71
review_target_commit: a91c509ce3e16aef02e76f873f8893159a3eda71
applicable_review_id: ML-DEVOS-AS-094
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. This is not S6 closure: the manifest entry is unchanged (`NOT_IMPLEMENTED`, `executable_runtime_present: false`, no `closure_ref`), and Sentinel stays at `v1.8.0`.

## Objective

Correct only `AS94-F001` through `AS94-F004`, under scope `SENTINEL_S6_CORE_IMPLEMENTATION_AS094_REMEDIATION_CYCLE_1_ONLY` (cycle 1 of 2). Every property that AS-094 marked accepted is preserved.

Provenance:
- Bootstrapped from the authoritative tip `a91c509` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). The tip was re-fetched before verification and was unchanged.
- The work was done in the clean worktree, fast-forwarded to `a91c509`. The outgoing `H-S6-CORE-IMPL-0001` was archived byte-identical by the Architect (verified with `cmp`).
- The suspended `D-068` draft stays untracked in the primary checkout; it was not touched.
- No safety control blocked anything, and no permission was expanded. No real execution driver, live remote transport or credential was introduced.

## Changes by finding

### AS94-F001 — claim linearization (`host.mjs`, `registry.mjs`)

- `claimPermit()` now does **all** final work inside `registry.withTaskLock()`. Before the lock it only validates the request shape and reads the record's task id.
- Under the lock, in order, with no lock wait or unrelated work in between:
  1. Re-read the record, the request binding, the permit status and the body.
  2. Read S4 **now** and re-check fencing (owner, revision, lease), plus two new checks: the permit's **pinned** `checkpoint_revision` must equal the current checkpoint, and S4's state must be the role's state.
  3. Run the fresh S5 recheck **last**.
  4. Write `CLAIMED` and journal the accepted check.
- **S4 failure** → the permit is `REVOKED` / `STALE` and journaled `CLAIM_REFUSED`, with the lowest-ranked fencing code.
- **S5 failure** → the permit is `REVOKED` / `CAPABILITY_INVALIDATED`, as before.
- This changes existing behaviour in one respect: before, a fencing failure at claim left the permit `ISSUED`; now it is terminally non-executable. The pinned-revision check also closes a gap where a permit issued before a renewal could have been claimed after that renewal was adopted.
- `withTaskLock(taskId, fn, { waitMs })` gains an optional bounded wait (host config `lockWaitMs`, default `0`, meaning fail closed immediately, as before). It polls every 10 ms and **never steals** a lock.

### AS94-F002 — crash-recoverable permit minting (`host.mjs`, `registry.mjs`, `paths.mjs`)

- **The request binding is now the single source of truth and the only commit point.** It carries the complete permit body bytes, `permit_digest`, deadline and issue time. It is written **first** with the new `publishFileExclusive()`: complete fsynced temp file, then `link()` (EEXIST-exclusive, never partial), then a best-effort directory fsync.
- **Derived artifacts.** The body file, the initial `ISSUED` status and the `PERMIT_ISSUED` journal entry are derived idempotently by `materialize()`. An existing body must be byte-identical, an existing status is kept, and the journal entry is appended only if absent.
- **Any crash** either left nothing durable, so a retry mints the one permit, or left the binding, so a retry replays that same `permit_id` and finishes the missing derived steps under the lock.
- **Permits are enumerated from bindings.** A body or status file that no binding names is an **orphan**:
  - it is not listed as a permit;
  - it is not claimable or reportable;
  - `recover()` reports it (`orphan_permits`) and never adopts it.
- **Bindings are integrity-checked** on every read. They must be complete JSON, the body must hash to `permit_digest`, and the body must name the same permit, instance, request, argv digest and checkpoint. Otherwise the result is `ISOLATION_UNPROVABLE`.
- **Fault-injection points:** `permit-before-binding`, `permit-after-binding`, `permit-after-body`, `permit-after-status`, `permit-after-journal`.

### AS94-F003 — no argv-taking execution helpers (`git.mjs`, `transport.mjs`, `host.mjs`, fixtures)

- **`git.mjs` no longer exports `git(args)` / `tryGit(args)`.** It exports a closed set of named operations with validated structured parameters (exact SHAs, plain `refs/heads/` refs, S6 task-branch names, absolute paths); invalid parameters give `MALFORMED_REQUEST`. The runner (`run`, `succeeds`) is module-private, and each operation builds its literal argv:
  - `gitVersion`, `lsRemoteRef`, `headSha`, `treeOf`, `hasCommit`, `isAncestor`, `currentBranch`;
  - `trackedFiles`, `localConfigLines`, `statusEntries`, `changedFiles`;
  - `cloneNoCheckout`, `fetchCommit`, `checkoutDetached`, `createTaskBranch`, `pushWithLease`.
- **The harness no longer exports `fixtureGit(args, opts)`.** Its runner `fixtureRun` is module-private and always called with literal argv. The tests use named helpers: `remoteRefSha`, `headOf`, `headCommitText`, `createRemoteBranch`, `forceMoveRemoteBranch`, `advanceRemoteMain`, `plantHooksPathConfig`, `resetToOrphanOfBase`.
- The fixed fixture-driver table, the crash worker (closed operation and crash-point sets, now including the permit steps) and the mutation runner are unchanged in kind. The crash worker's `permit` operation submits the request as **data**; it never executes it.
- **New source-level proofs** (`tests/execution-core.test.mjs`):
  1. Every exported function or class of every S6-core module plus `harness.mjs`/`drivers.mjs` (>40 checked) is imported and inspected. None takes a rest parameter or an argv/command-shaped parameter, top-level or destructured. The one allowed exception is `argvDigest(argv)`, which only hashes data; its module is proven to import no process API.
  2. The runners are module-private.
  3. Every runner call site passes a literal argv head.
  4. Every direct process start in S6 core and the fixtures matches a short allowlist of fixed literal forms.
  5. `git`/`tryGit`/`run`/`succeeds`/`fixtureGit`/`fixtureRun` are not exported.

### AS94-F004 — complete Execution Report (`permits.mjs`, `execution-report.schema.json`, `host.mjs`, `drivers.mjs`)

- All 12 RFC-019 fields are **required** (null where allowed): `permit_id`, `instance_id`, `argv_digest`, `environment_digest`, `process_groups`, `started_at`, `ended_at`, `exit_code`, `signal`, `stdout_digest`, `stderr_digest`, `terminated`. Unknown fields are refused.
- **Types:**
  - strict UTC instants (rollover dates rejected);
  - `exit_code` an integer 0..255 or null;
  - `signal` `SIG[A-Z0-9]+` or null;
  - output digests hex64 or null;
  - process groups unique integers > 1.
- **Consistency** (the Builder's reading of the RFC, applied fail-closed):
  - `terminated: true` needs `ended_at` ≥ `started_at` and **exactly one** of `exit_code` / `signal`;
  - `terminated: false` needs `ended_at`, `exit_code` and `signal` all null, and at least one live process group.
- **Durable evidence.** `reportEvidence()` stores **every** field except the two keying ids, plus a canonical `report_digest`, in the permit status and in the `REPORT` / `LATE_REPORT` journal entries. `started_at`, `ended_at` and `signal` are no longer dropped.
- **Schema.** The JSON schema was rewritten to match. The consistency rules use draft-07 `if`/`then`/`else`, and a test proves the schema's field list, nullability and conditionals agree with the runtime contract.
- **Fixture reports:**
  - the fixed driver sends real timestamps with `stdout`/`stderr` digests honestly `null` (output not captured);
  - the fake driver sends deterministic synthetic values;
  - the long-lived-child report is `terminated: false`.

## Changed files

Diff against base `a91c509ce3e16aef02e76f873f8893159a3eda71`:
- **`devos/execution/`:** `git.mjs`, `transport.mjs`, `host.mjs`, `registry.mjs`, `paths.mjs`, `permits.mjs`, `execution-report.schema.json`, `README.md`.
- **Tests:** `tests/execution-{core,permits,recovery,lifecycle,mutation}.test.mjs`. `lifecycle` changed only to use the named fixture helpers.
- **Fixtures:** `tests/fixtures/execution/{harness,drivers,crash-worker}.mjs`.
- **RFC:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md` gets one factual sentence on AS-094 remediation, with no design change. `devos/changes/rfcs/README.md` was not changed.
- **Traceability:** `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`, regenerated.
- **Coordination:** `coordination/STATE.md` and `coordination/CURRENT_HANDOFF.md`.

Not changed: `devos/devos-manifest.json` (verified unchanged), `tests/devos-manifest.test.mjs`, any S3/S4/S5 source, interface, schema or policy, and any ADR, closure record or version.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session in the clean worktree: Node `v22.22.2`, git `2.43.0`, Linux `6.18.44` x86_64.

| Check | Result | Exit |
|---|---|---|
| `node --test tests/execution-core.test.mjs` | 25/25 | 0 |
| `node --test tests/execution-permits.test.mjs` | 20/20 | 0 |
| `node --test tests/execution-lifecycle.test.mjs` | 43/43 | 0 |
| `node --test tests/execution-recovery.test.mjs` | 24/24 | 0 |
| `node --test tests/execution-mutation.test.mjs` | 25/25 (23 mutants killed + anchor check + control) | 0 |
| `npm test` | 743 tests, 743 pass, 0 fail (606 non-S6 + 137 S6) | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | 13/13 example files as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | 4/4 OK | 0 |
| `git diff --check` (including new files) | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | see below | 1 |

**Traceability.**
- **Base `a91c509`:** 393 files / 2 errors / 14 warnings / 310 definitions / `DRIFT` (the Architect's commit left the generated index stale).
- **After:** 393 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / **14** warnings / 310 definitions / `No drift`. It exits `1`, the convention while any ERROR exists. The ERROR/WARNING set is identical to the base.

**New focused evidence required by STATE:**
- **Claim race with task-lock contention + S4 mutation** (`execution-permits`). A test holds the S6 task lock, starts a claim (`lockWaitMs: 5000`), asserts the claim is still pending (waiting), mutates S4, then releases the lock:
  - S4 revision moves (`renew`) → `FENCING_REVISION_MISMATCH`, permit `REVOKED`/`STALE`, no `PERMIT_CLAIMED`;
  - ownership changes (release + claim by `builder-2`) → `OWNER_MISMATCH`;
  - the lease expires on the host's trusted clock → `LEASE_EXPIRED`.
- **Claim race with live S5 change** (same harness):
  - live revocation → `CAPABILITY_DENIED`, `REVOKED`/`CAPABILITY_INVALIDATED`;
  - descriptor expiry passing on S5's trusted clock → `CAPABILITY_DENIED`.
- **Race controls:**
  - no change during the wait → `CLAIMED` after release;
  - a never-released lock → `ISOLATION_UNPROVABLE`, the lock is not stolen, and the permit stays `ISSUED`;
  - a permit pinned to a pre-renewal checkpoint → `FENCING_REVISION_MISMATCH`/`STALE` after adoption.
- **Permit-minting crash at every durable sub-step** (`execution-recovery`), for each of `permit-before-binding`, `-after-binding`, `-after-body`, `-after-status`, `-after-journal`, run two ways:
  - a thrown fault;
  - a **real SIGKILL** of a fixed worker process. The killed worker's lock is not stolen: a retry fails closed until the operator removes it. The one exception is a fully materialized permit, whose replay is a pure read.

  After recovery or retry: exactly **1** binding, **1** body, **1** status and **1** `PERMIT_ISSUED` entry, and **0** leftover temp files. Every response names the same `permit_id`: the pre-crash one whenever the binding had been published. The permit then claims normally.
- **Orphans and tampering:**
  - orphan body/status (even one marked `CLAIMED`) → not claimable, not reportable, absent from provenance, reported by `recover()` as `orphan_permits`;
  - a tampered or torn binding → `ISOLATION_UNPROVABLE` on replay and claim.
- **Source-level proof of no argv-executing export:** see AS94-F003 above. Two mutants that re-add a generic `git(args)` export and a `fixtureGit(args)` helper are both killed.
- **Report contract:**
  - 6 positive cases;
  - 12 missing-field cases (one per field) and 31 malformed or contradictory cases, including unknown field, rollover date, local-time offset, ended-before-started, both or neither of code/signal while terminated, running with `ended_at`/code/signal, running with no groups, and bad digests;
  - the schema/runtime agreement test;
  - an integration test: rejected reports leave the permit `CLAIMED` and quiesce blocked, and the verified report's every field is in the stored status and the `REPORT` journal entry (with `report_digest`) and in provenance.
- **Mutation (AS94 additions, each killed by a failing assertion):**
  - M16: no S4 fencing under the claim lock;
  - M17: binding written after the derived files;
  - M18: claim accepts orphan permits;
  - M19: generic `git(args)` export;
  - M20: generic `fixtureGit` helper;
  - M21: timing/signal dropped from evidence;
  - M22: no chronology check;
  - M23: no exit/signal exclusivity.

  M01–M15 are still killed.

## Platform matrix

| Platform | Status |
|---|---|
| Linux x86_64 (kernel 6.18.44, Node v22.22.2, git 2.43.0) | **RUN** — all results above |
| macOS | **NOT RUN** |
| Windows | **NOT RUN**. V1 fails closed `ISOLATION_CAPABILITY_MISSING` by design. `publishFileExclusive` uses hard links (supported on NTFS), not exercised on Windows. |

## Unresolved findings and limitations

- **The race tests are deterministic, not exhaustive.** They inject S4/S5 changes while the claim is proven to be waiting on the S6 lock. Between the S4 read and the S5 call *inside* the lock, S4/S5 can still change externally; that is inherent, is the freshness model AS-094 accepted, and S4 publication remains linearized at S4 `transition`.
- **A killed process leaves its S6 lock.** Recovery then needs the explicit operator lock removal (by design: no automatic stealing). The recovery tests do exactly that.
- **Directory fsync after publish is best-effort.** On a platform without directory fsync, a power loss (not a process crash) could lose a just-published binding. A retry would then mint afresh, and that is safe because nothing derived from the lost binding exists.
- **Report semantics.** The `terminated` consistency rules are the Builder's strict reading of RFC-019 §13.1, which lists the fields but not their relationships. The Architect may prefer different null rules for unterminated reports.
- **Fixture output digests are null.** The fixed fixture operations do not capture output; the fake driver covers the non-null digest paths.
- **Unchanged from the previous handoff:** the residual deletion race (no `unlinkat` in Node); the trusted host and host-held RTR; RFC-019 Unresolved questions 1–8.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged. None is closed.

## Governing references

- Authority: `D-071` (with `ML-DEVOS-AS-094` remediation routing); `D-070`; `D-069`; `D-068` (suspended); `D-066`.
- Reviews: `ML-DEVOS-AS-094` (live), `ML-DEVOS-AS-093`.
- Design: `ML-DEVOS-RFC-019`. Closure mechanism: `ML-DEVOS-RFC-015`. S5: `ML-DEVOS-RFC-017`/`ML-DEVOS-ADR-015`. S4: `ML-DEVOS-ADR-014`.
- Protocol: `ML-DEVOS-RFC-018`.

## Evidence locations

- The commit diff against `a91c509ce3e16aef02e76f873f8893159a3eda71`.
- `devos/execution/{host,registry,paths,git,permits}.mjs` and `execution-report.schema.json`.
- `tests/execution-*.test.mjs` (the AS94 sections are marked) and `tests/fixtures/execution/`.

## Next action

The Architect independently re-reviews `AS94-F001`–`F004` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-094`, and archives `H-S6-CORE-IMPL-REM1-0001` if its routing deselects this handoff. S6 closure remains separately gated and is not requested. No further Builder action is authorized.
