# Current Handoff — S6 Core, Exceptional Micro-Remediation (AS96-F001, D-072)

```yaml
schema_version: 1
handoff_id: H-S6-CORE-IMPL-REM3-0001
cycle_id: SENTINEL_S6_CORE_IMPLEMENTATION
input_base_commit: eb79c40a1cbb5ac5fddd3171e040ad66ebba3ad5
review_target_commit: eb79c40a1cbb5ac5fddd3171e040ad66ebba3ad5
applicable_review_id: ML-DEVOS-AS-096
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. This is not S6 closure: the manifest entry is unchanged, and Sentinel stays at `v1.8.0`.

## Objective

Correct only `AS96-F001` under `D-072`'s single exceptional micro-remediation (scope `SENTINEL_S6_CORE_IMPLEMENTATION_AS96_EXCEPTIONAL_MICRO_REMEDIATION_ONLY`, cycle 3 of 3).

**The invariant:** once an RTR is `PENDING`, no local lifecycle transition can contradict the eventual `COMMITTED`/`ABORTED` result. The approved write-ahead protocol is unchanged, and the external S4 transition stays **outside** the S6 task lock. The durable `PENDING` RTR is the reservation boundary.

Provenance:
- Bootstrapped from the authoritative tip `eb79c40` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). The tip was re-fetched before verification and was unchanged.
- The work was done in the clean worktree, fast-forwarded to `eb79c40`. The outgoing `H-S6-CORE-IMPL-REM2-0001` was archived byte-identical by the Architect (verified with `cmp`).
- The suspended `D-068` draft stays untracked in the primary checkout; it was not touched.
- No safety control blocked anything, and no permission was expanded.
- **No real execution driver and no live S6 remote transport** was added. Transport remains local bare repositories only, with no credentials and no network writes.

## The correction

1. **Reservation.** `pendingPublications(record)` returns the unresolved `PENDING` RTRs whose body names this Builder identity. `assertNoPendingPublicationLocked(record, operation)`, checked under the task lock and **first** (before any state check), fails closed with the existing code `RESULT_TRANSFER_UNPROVEN`. The reservation is released only when the RTR becomes `COMMITTED` or `ABORTED`.
2. **`ABORTED` only on a definitive S4 refusal.** This is needed for the invariant.
   - The problem: `publish()` previously mapped **every** S4 error to `ABORTED`, including `LOCK_HELD`, S4's immediate lock-contention error. When `recover()` resolves a `PENDING` RTR while the original publisher is still in flight (both hold the same stored bytes and idempotency key), one of them can hit `LOCK_HELD` and write `ABORTED` while the other's S4 transition commits. S4 would then say `READY_FOR_QA` while the local record says `ABORTED`: exactly the contradiction AS96-F001 prohibits.
   - The fix: `ABORTED` is written only for `NOT_CURRENT_OWNER`, `REVISION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `ILLEGAL_TRANSITION` and `TASK_NOT_FOUND`. These are S4 refusals made on the record under S4's own lock. Idempotency is checked first, so an already-applied transfer replays rather than being refused.
   - Any other error leaves the RTR `PENDING`, journals `TRANSITION_UNRESOLVED`, and fails `RESULT_TRANSFER_UNPROVEN` for exactly-once resolution later.
   - The `ABORTED` write is idempotent (only from `PENDING`). `COMMITTED` stays idempotent, and `ABORTED`/`COMMITTED` monotonicity is unchanged.
3. **Everything else is unchanged:** the S4 transition stays outside the lock, the stored RTR bytes are replayed exactly, `publish()`/`resolvePending()` crash recovery works as before, and an S4-accepted publication still commits its RTR on a quarantined instance without restoring it.

## PENDING-operation classification

This is also documented in `host.mjs`'s publication-reservation section.

| Operation | While a `PENDING` reservation exists | Why |
|---|---|---|
| `finishWithoutPublication` | **BLOCKED** (`RESULT_TRANSFER_UNPROVEN`) | would record "finished without publication" against a publication that may commit |
| `cleanup` | **BLOCKED** (`RESULT_TRANSFER_UNPROVEN`), even when `QUARANTINED` | would clean an instance whose publication may still commit |
| `adoptRenewal` | **BLOCKED** (`RESULT_TRANSFER_UNPROVEN`) | the `PENDING` transfer id derives from the checkpoint; moving it would let a retried `complete` mint a second, different `PENDING` record |
| `quiesce` | **BLOCKED** (`RESULT_TRANSFER_UNPROVEN`; also state-blocked) | explicit guard |
| `attach` | **BLOCKED** — existing guard kept, existing code `INSTANCE_STALE` | preserved as instructed |
| `complete` | ALLOWED | resumes the **same** reservation: same transfer id, stored bytes replayed |
| `publish` / `recover` → `resolvePending` | ALLOWED | they resolve the reservation; S4 idempotency converges concurrent resolvers |
| quarantine (by `recover`, create failure) | ALLOWED | safety-monotonic; a later `COMMITTED` never restores the instance |
| stale flag (`validateInstance`, abort) | ALLOWED | observation only |
| permit replay / derived-artifact materialization | ALLOWED | no lifecycle change |
| `requestPermit` (mint), `claimPermit` | UNREACHABLE | require `ATTACHED`; the instance is `QUIESCED` |
| `recordReport` | UNREACHABLE | needs a `CLAIMED` permit; `complete` refuses to write `PENDING` while any is `CLAIMED` |
| `createInstance` | UNAFFECTED | creates a different record; a second Builder `PENDING` at the same revision is already refused by `complete` |

**ABORTED disposition** (explicit, deterministic):
- The reservation is released. The journal records `RTR_ABORTED` with `disposition: STALE_UNPUBLISHED`, and the instance is marked stale. The pushed branch is stale transport residue.
- **Via `complete()`:** the instance stays stale `QUIESCED`. `attach`/`complete` refuse; `finishWithoutPublication` → `COMPLETED`, then `cleanup` → `CLEANED`.
- **Via `recover()`:** its instance pass then quarantines the stale instance (`INSTANCE_STALE`), and `cleanup` → `CLEANED`.

**Before `PENDING`**, e.g. a finish that wins after the push but before the RTR: `complete` then refuses to write `PENDING` (`QUIESCE_UNPROVEN`), and S4 is untouched. The pushed branch is stale, unpublished transport residue, as AS-096 accepts.

## Changed files

Diff against base `eb79c40a1cbb5ac5fddd3171e040ad66ebba3ad5`:
- **`devos/execution/`:** `host.mjs` (reservation section, guards, definitive-only `ABORTED`); `README.md` (factual note).
- **Tests:** new `tests/execution-publication.test.mjs`; `tests/execution-mutation.test.mjs` (6 new mutants).
- **RFC:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md` gets one factual sentence, with no design change.
- **Traceability:** `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`, regenerated.
- **Coordination:** `coordination/STATE.md` and `coordination/CURRENT_HANDOFF.md`.

Not changed: `devos/devos-manifest.json` (verified unchanged), `registry.mjs`, `journal.mjs`, any fixture, any S3/S4/S5 source, interface, schema or policy, and any ADR, closure record or version.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session in the clean worktree: Node `v22.22.2`, git `2.43.0`, Linux `6.18.44` x86_64.

| Check | Result | Exit |
|---|---|---|
| `node --test tests/execution-core.test.mjs` | 25/25 | 0 |
| `node --test tests/execution-permits.test.mjs` | 20/20 | 0 |
| `node --test tests/execution-lifecycle.test.mjs` | 43/43 | 0 |
| `node --test tests/execution-recovery.test.mjs` | 24/24 | 0 |
| `node --test tests/execution-linearization.test.mjs` | 17/17 | 0 |
| `node --test tests/execution-publication.test.mjs` (new) | 10/10; repeated 5× standalone, 10/10 each | 0 |
| `node --test tests/execution-mutation.test.mjs` | 39/39 (37 mutants killed + anchor check + control); also 39/39 on a second run | 0 |
| `npm test` | 784 tests, 784 pass, 0 fail (606 non-S6 + 178 S6) | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | all 13 example files as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | 4/4 OK | 0 |
| `git diff --check` (including new files) | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | see below | 1 |

**Traceability.**
- **Base `eb79c40`:** 400 files / 2 errors / 15 warnings / 313 definitions / `DRIFT` (stale generated index at base).
- **After:** 401 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / **14** warnings / 313 definitions / `No drift`. It exits `1`, the convention while any ERROR exists. The only change is that `orphan-no-inbound-reference D-072` cleared, because RFC-019 now cites `D-072`. No finding was added.

**Deterministic interleavings** (`execution-publication`). The competitor starts in a hook at `after-pending` or `after-push`, and the test asserts the S6 task lock is **not** held at that moment, which proves the reservation, not the lock, blocks it.
- `PENDING` → competing `finishWithoutPublication` refused (`RESULT_TRANSFER_UNPROVEN`) → publication resolves exactly once: RTR `COMMITTED`, instance `COMPLETED`, exactly one S4 `READY_FOR_QA` transition, no `FINISHED_WITHOUT_PUBLICATION` entry.
- `PENDING` → competing `cleanup` refused by the reservation, before the state check; nothing deleted; after `COMMITTED`, cleanup succeeds.
- Before `PENDING` (at `after-push`) → the finish wins; `complete` then refuses to write `PENDING`; no RTR, no S4 transition; the branch is stale residue.

**Classification coverage** (a durable `PENDING` left by a publisher that died after `RTR_PENDING`):
- blocked: finish, cleanup, `adoptRenewal`, quiesce, attach (each refused, with the instance record byte-identical afterwards);
- unreachable: mint, claim, report;
- allowed: permit replay, validation (`PROVEN`), and `complete` (resumes the same transfer id; one RTR; one S4 transition). After `COMMITTED`: finish is state-refused and cleanup succeeds.

**ABORTED:**
- via `recover()`: renewal → definitive `REVISION_CONFLICT` → `ABORTED` → instance `QUARANTINED` (`INSTANCE_STALE`), S4 still `BUILDING`, a second `recover()` a no-op, then cleanup;
- via `complete()`: stale `QUIESCED`, attach and complete refused, finish then cleanup allowed.

**Transient S4 failure:** with the S4 lock held, recover gives `UNPROVEN`, the RTR stays `PENDING` (`TRANSITION_UNRESOLVED` journaled), and finish is still refused. After the S4 lock is released, recover → `COMMITTED` exactly once.

**Quarantine never restored:** while `PENDING` and S4 is busy, the instance directory disappears and recover quarantines it (`MISSING_DIRECTORY`). After S4 frees up, recover commits the RTR, the instance **stays** `QUARANTINED` with its original reason, and it is then cleanable.

**COMMITTED idempotent:** after a crash following the S4 transition, recover commits. A second recover finds nothing, a repeated `complete` is refused, the `COMMITTED` status is byte-identical, and there is exactly one transition.

**Concurrent resolvers:** the in-flight publisher and `recover()` race on the same `PENDING` record. In every observed order the result is one S4 transition, RTR `COMMITTED`, never `RTR_ABORTED`, and instance `COMPLETED`. If the losing side left it unresolved, a later recover commits it.

**Mutation (AS96 additions, each killed by a failing assertion):**
- M32: whole reservation removed;
- M33: finish guard removed;
- M34: cleanup guard removed;
- M35: renewal guard removed;
- M36: transient S4 error writes `ABORTED`;
- M37: a commit restores a quarantined instance.

M01–M31 are still killed.

**AS94/AS95 preserved.** Every AS94 test (claim lock placement and races, crash-atomic minting, closed Git/fixture operations, complete Execution Report) and every AS95 test (linearization interleavings, CAS/transition guards, quiesce fencing) passes unchanged, and M01–M31 are still killed. No lock, CAS, transition-table, permit, report or Git code was changed.

## Platform matrix

| Platform | Status |
|---|---|
| Linux x86_64 (kernel 6.18.44, Node v22.22.2, git 2.43.0) | **RUN** — all results above |
| macOS | **NOT RUN** |
| Windows | **NOT RUN**. V1 fails closed `ISOLATION_CAPABILITY_MISSING` by design. |

## Unresolved findings and limitations

- **A permanently unresolvable `PENDING` blocks the instance forever,** for example when the RTR body or its journal adjacency was tampered with and recovery reports `UNPROVEN`. Finish, cleanup and renewal adoption stay refused, fail-closed by design; an operator decision is required.
- **The set of definitive S4 errors is fixed** to the S4 kernel's record-based refusals. A future S4 code would default to "unresolved" (fail closed, `PENDING` kept), never to `ABORTED`.
- **The concurrent-resolver test asserts an invariant, not a single ordering.** The S4 lock decides which resolver wins, and both orders were observed to satisfy it across repeated runs.
- **Unchanged from earlier handoffs:** the residual deletion race; the trusted host and host-held RTR; lock-file based cross-process serialization; RFC-019 Unresolved questions 1–8; the Builder's reading of the report `terminated` semantics.
- **Remediation is exhausted.** This was the only exceptional cycle (3 of 3). Per STATE, any further blocker routes to Paulo, and no cycle 4 is requested.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged. None is closed.

## Governing references

- Authority: `D-072` (exceptional micro-remediation); `D-071`; `D-070`; `D-069`; `D-068` (suspended); `D-066`.
- Reviews: `ML-DEVOS-AS-096` (live), `ML-DEVOS-AS-095`, `ML-DEVOS-AS-094`, `ML-DEVOS-AS-093`.
- Design: `ML-DEVOS-RFC-019` (§7.1 write-ahead publication). Closure mechanism: `ML-DEVOS-RFC-015`. S4: `ML-DEVOS-ADR-014`. S5: `ML-DEVOS-ADR-015`.
- Protocol: `ML-DEVOS-RFC-018`.

## Evidence locations

- The commit diff against `eb79c40a1cbb5ac5fddd3171e040ad66ebba3ad5`.
- `devos/execution/host.mjs`: the publication-reservation section and its classification, and `publish()`'s definitive-rejection handling.
- `tests/execution-publication.test.mjs`; `tests/execution-mutation.test.mjs` (M32–M37).

## Next action

The Architect independently re-reviews `AS96-F001` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-096`, and archives `H-S6-CORE-IMPL-REM3-0001` if its routing deselects this handoff. Any further blocker routes to Paulo; no cycle 4 is authorized or requested. S6 closure and the queued pre-S7 readiness checkpoint remain separately owner-gated. No further Builder action is authorized.
