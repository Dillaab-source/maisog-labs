# Current Handoff — S6 Core Implementation, Final Remediation Cycle 2 (AS-095)

```yaml
schema_version: 1
handoff_id: H-S6-CORE-IMPL-REM2-0001
cycle_id: SENTINEL_S6_CORE_IMPLEMENTATION
input_base_commit: 8e9982f6cb2925ff0364436addc7b026f834ac60
review_target_commit: 8e9982f6cb2925ff0364436addc7b026f834ac60
applicable_review_id: ML-DEVOS-AS-095
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. This is not S6 closure: the manifest entry is unchanged, and Sentinel stays at `v1.8.0`.

## Objective

Correct only `AS95-F001` and `AS95-F002`, under scope `SENTINEL_S6_CORE_IMPLEMENTATION_AS095_FINAL_REMEDIATION_CYCLE_2_ONLY` (cycle 2 of 2, the final ordinary cycle). All `AS94` corrections and every previously accepted S6 property are preserved.

Provenance:
- Bootstrapped from the authoritative tip `8e9982f` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). The tip was re-fetched before verification and was unchanged.
- The work was done in the clean worktree, fast-forwarded to `8e9982f`. The outgoing `H-S6-CORE-IMPL-REM1-0001` was archived byte-identical by the Architect (verified with `cmp`).
- The suspended `D-068` draft stays untracked in the primary checkout; it was not touched.
- No safety control blocked anything, and no permission was expanded. No real execution driver, live remote transport or credential was introduced.

## AS95-F001 — one linearization discipline

**The rule** is documented at the top of `host.mjs`'s linearization section, with a per-operation table:
- **Every mutation** of permit status, instance records and RTR status runs inside `locked(taskId, fn)`, the per-task S6 registry lock.
- **Re-read first.** Each locked section re-reads the authoritative record and status (`freshLocked`) immediately before its transition. A pre-lock record is never saved.
- **External effects stay outside.** Clone, push and the S4 transition run outside the lock; their outcomes are committed under it.
- **No nested-lock deadlocks.** Public operations take the lock exactly once. Private helpers (`saveLocked`, `markStaleLocked`, `quarantineLocked`, `revokeIssuedLocked`, `putStatusLocked`, `materializeLocked`, `freshLocked`) assert that the current async chain holds it, tracked with `AsyncLocalStorage`. Re-acquisition is a fail-closed programming error (`ISOLATION_UNPROVABLE`), not a deadlock.
- **One lock call site.** `registry.withTaskLock` is called from exactly one place, `locked()`. A source-level test asserts this, and that every `registry.put{Instance,PermitStatus,RtrStatus}` call sits in a lock-asserting or locked function.

**Operations now locked with a re-read**, in addition to claim and minting:
- `quiesce`, `recordReport`, `attach`, `adoptRenewal`;
- `finishWithoutPublication`, `cleanup`;
- the stale flag written by `validateInstance`;
- the `CREATING` save, `READY` commit and failure quarantine in `createInstance`;
- `complete`'s `pushed_sha` commit and its RTR `PENDING` section, which now also re-checks under the lock that the instance is `QUIESCED`, has no `CLAIMED` permit, and its tree is unchanged;
- `publish`'s `ABORTED`/`COMMITTED` commit;
- `recover`'s per-instance decisions (lock contention is reported as `skipped`, not a crash).

**Pure expiry.** Lazy `ISSUED → EXPIRED_UNCLAIMED` is now a pure read-time derivation: replay and read paths never write permit state. The expiry is persisted only by locked paths (claim, revocation sweeps).

**Monotonic terminal states** (defence in depth, `registry.mjs`):
- **Instance records** carry a `version`. `putInstance` requires the version it read (compare-and-set) and a legal transition. `QUARANTINED` moves only to `CLEANED`; `CLEANED` is terminal.
- **Permit status** likewise: `ISSUED` → `CLAIMED` | `EXPIRED_UNCLAIMED` | `REVOKED`; `CLAIMED` → `REPORTED`; everything else is terminal.
- **RTR status:** `PENDING` → `COMMITTED` | `ABORTED`; `COMMITTED` is idempotent with the same post revision; `ABORTED` is terminal.
- A stale or illegal write is refused (`ISOLATION_UNPROVABLE`), so `REVOKED`/`EXPIRED` → `CLAIMED` and a stale `ATTACHED` over a newer state are impossible even if a lock were missed.

**Other rules:**
- **Late reports.** A report for a `CLAIMED` permit on a non-`ATTACHED` (e.g. `QUARANTINED`) instance is recorded as `REPORTED` plus `LATE_REPORT` journal evidence only. The instance record is never rewritten.
- **Quarantine.** `quarantineLocked` never rewrites an already `QUARANTINED`/`CLEANED` record, so the first reason stands.
- **Publication.** A publish that finds the instance `QUARANTINED` commits the RTR, because S4 holds the result, but leaves the instance quarantined.
- **Attach** refuses while a `PENDING` publication exists for the instance.
- **Journal** appends take a leaf append lock (never held while acquiring anything else; bounded wait, never stolen), so two writers can never extend the same head.
- **Hooks.** Test fault hooks run outside the lock's async context (`lockScope.exit`), so an operation started from a hook truly competes for the lock. There are new in-lock observation points: `claim-locked`, `quiesce-locked`, `report-locked`, `recover-locked`.

## AS95-F002 — quiesce fencing

- Inside the same locked transaction, `quiesce` re-reads the instance and calls `currentFencing()`, which reads current S4 and applies the existing `fencingFailures` (owner, revision, lease **and** role state). This happens **before** revoking permits or committing `QUIESCED`.
- On failure: the existing lowest-ranked code; the stale flag for owner/revision/role-state failures (not for lease expiry alone); a `QUIESCE_REFUSED` journal entry. No permit is revoked and the instance is not represented as quiesced.
- No new reason code or S4 interface.
- `attach` and `claimPermit` use the same `currentFencing()`. Claim additionally checks the permit's pinned checkpoint, as before.
- Correction to my own cycle-1 code: `fencingFailures` already checked role state, so the extra role-state push added in cycle 1 was redundant and has been removed. Behaviour is unchanged.

## Changed files

Diff against base `8e9982f6cb2925ff0364436addc7b026f834ac60`:
- **`devos/execution/`:** `host.mjs`, `registry.mjs`, `journal.mjs`, `README.md` (factual linearization note).
- **Tests:** new `tests/execution-linearization.test.mjs`; `tests/execution-mutation.test.mjs` (8 new mutants, 3 anchors re-pointed to the restructured code).
- **RFC:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md` gets one factual sentence, with no design change.
- **Traceability:** `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`, regenerated.
- **Coordination:** `coordination/STATE.md` and `coordination/CURRENT_HANDOFF.md`.

Not changed: `devos/devos-manifest.json` (verified unchanged), any S3/S4/S5 source, interface, schema or policy, any fixture, and any ADR, closure record or version.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session in the clean worktree: Node `v22.22.2`, git `2.43.0`, Linux `6.18.44` x86_64.

| Check | Result | Exit |
|---|---|---|
| `node --test tests/execution-core.test.mjs` | 25/25 | 0 |
| `node --test tests/execution-permits.test.mjs` | 20/20 | 0 |
| `node --test tests/execution-lifecycle.test.mjs` | 43/43 | 0 |
| `node --test tests/execution-recovery.test.mjs` | 24/24 | 0 |
| `node --test tests/execution-linearization.test.mjs` (new) | 17/17 | 0 |
| `node --test tests/execution-mutation.test.mjs` | 33/33 (31 mutants killed + anchor check + control) | 0 |
| `npm test` | 768 tests, 768 pass, 0 fail (606 non-S6 + 162 S6) | 0 |
| manifest / capability-policy / task-contract / rules / waivers / skills-bridge validators | all pass (13/13 policy examples, 15/15 contracts, 4/4 bridge) | 0 each |
| `git diff --check` (including new files) | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | see below | 1 |

**Traceability.**
- **Base `8e9982f`:** 396 files / 2 errors / 14 warnings / 311 definitions / `DRIFT` (stale generated index at base).
- **After:** 397 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / **14** warnings / 311 definitions / `No drift`. It exits `1`, the convention while any ERROR exists. The ERROR/WARNING set is identical to the base.

**Required focused tests** (`execution-linearization`). Each interleaving is deterministic: a hook runs inside one operation's locked section and starts the competitor there, the test asserts the lock file **exists** at that moment, and the competitor waits (`lockWaitMs`) and then acts on re-read state.
- **Claim vs quiesce:**
  - claim holds → quiesce then `QUIESCE_UNPROVEN`; permit stays `CLAIMED`;
  - quiesce holds → permit `REVOKED`/`QUIESCE`, instance `QUIESCED`, the competing claim `ISOLATION_UNPROVABLE`, no `PERMIT_CLAIMED`;
  - with no lock wait, the competitor fails closed (lock held) rather than interleaving.
- **Claim vs expiry/replay at the deadline:**
  - replay past the deadline reads `EXPIRED_UNCLAIMED` while the stored status stays `ISSUED` (no read-path write);
  - the locked claim persists `EXPIRED_UNCLAIMED`, and a clock step back cannot revive it;
  - a permit claimed just before the deadline stays `CLAIMED` long after.
- **Claim vs quarantine/recovery:**
  - claim holds → recovery then quarantines `QUIESCE_UNPROVEN`, and the claim is not undone;
  - recovery holds (stale instance) → permit `REVOKED`/`QUARANTINE`, the competing claim fails.
- **Report vs recovery/quarantine:**
  - recovery holds and quarantines → the competing report is `REPORTED` + `LATE_REPORT` only; `QUARANTINED` and `reported_pgids` are unchanged; no `REPORT` entry;
  - report holds → recovery then sees no uncertain permit and does not quarantine.
- **Quiesce vs report:**
  - report holds → quiesce then succeeds;
  - quiesce holds → quiesce fails `QUIESCE_UNPROVEN` on the `CLAIMED` permit, the report then lands, and quiesce then succeeds.
- **Registry guards:**
  - a stale pre-quiesce status cannot write `CLAIMED` over `REVOKED`;
  - `REVOKED` → `CLAIMED` is refused even at the current version;
  - a stale `ATTACHED` record cannot overwrite a newer `QUIESCED` one (CAS alone; the transition itself is legal);
  - a stale pre-claim status cannot write `REPORTED` (CAS alone);
  - `COMPLETED` → `ATTACHED` is refused.
- **Quiesce fencing (AS95-F002).** A permit is issued first, then S4 changes, then quiesce:
  - owner change (release + claim by `builder-2`) → `OWNER_MISMATCH`, stale, instance still `ATTACHED`, permit still `ISSUED`, `QUIESCE_REFUSED` and no `QUIESCE` entry;
  - revision advance → `FENCING_REVISION_MISMATCH`;
  - lease expiry → `LEASE_EXPIRED`, not marked stale;
  - real role-state change (the owner publishes to `READY_FOR_QA` outside S6) → `OWNER_MISMATCH`;
  - synthetic S4 record with **only** the state changed → `INSTANCE_STALE`.
- **Source discipline:** described under AS95-F001 above.
- **Mutation (AS95 additions, each killed):**
  - M24: no shared task lock;
  - M25: no permit version CAS;
  - M26: no instance version CAS;
  - M27: permit terminal states not monotonic;
  - M28: quiesce without S4 fencing;
  - M29: no S4 role-state check;
  - M30: claim does not persist expiry;
  - M31: a late report rewrites a quarantined instance.

  M01–M23 are still killed.
- **Mutation flake investigated.** One standalone run showed M24 surviving: its original killer test was timing-dependent (without a lock, the claim-first interleaving can still produce the same observable outcome). Fix: every interleave test now asserts the lock is held when the competitor starts, and M24's killer is the no-wait test, which requires a held lock. Three consecutive mutation runs then passed 33/33, plus the final verification run.

## Platform matrix

| Platform | Status |
|---|---|
| Linux x86_64 (kernel 6.18.44, Node v22.22.2, git 2.43.0) | **RUN** — all results above |
| macOS | **NOT RUN** |
| Windows | **NOT RUN**. V1 fails closed `ISOLATION_CAPABILITY_MISSING` by design. |

## Unresolved findings and limitations

- **Cross-process serialization rests on the lock file.** The registry lock and the journal append lock are exclusive-create files. The interleaving tests run in one process (two hosts sharing one state directory); the real-SIGKILL tests from cycle 1 cover the cross-process crash side.
- **Lock contention fails closed.** With the default `lockWaitMs: 0`, a contended operation fails closed immediately (`ISOLATION_UNPROVABLE`) and the caller retries; a bounded wait is available.
- **Locks are held across some slow work.** `quiesce` and `cleanup` hold the task lock while proving liveness (up to `quiesceDeadlineMs`) and, for cleanup, while deleting. Competing operations wait or fail closed meanwhile.
- **A killed process leaves its locks** (task or journal). Recovery requires the explicit operator removal, by design.
- **Clock monotonicity.** Pure read-time expiry derivation assumes the host clock, like the S4 lease. Once a locked path persists `EXPIRED_UNCLAIMED` it is terminal regardless of the clock.
- **Inside the lock, S4/S5 are external.** They can still change between the S6 read and the write; that is the accepted freshness model, and S4 publication stays linearized at S4 `transition`.
- **Unchanged from the previous handoff:** the residual deletion race; the trusted host and host-held RTR; RFC-019 Unresolved questions 1–8; the Builder's reading of the report `terminated` semantics.
- **The ordinary remediation budget is now exhausted (2 of 2).** Per STATE, any further blocker routes to Paulo.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged. None is closed.

## Governing references

- Authority: `D-071` (with `ML-DEVOS-AS-095` remediation routing); `D-070`; `D-069`; `D-068` (suspended); `D-066`.
- Reviews: `ML-DEVOS-AS-095` (live), `ML-DEVOS-AS-094`, `ML-DEVOS-AS-093`.
- Design: `ML-DEVOS-RFC-019`. Closure mechanism: `ML-DEVOS-RFC-015`. S5: `ML-DEVOS-RFC-017`/`ML-DEVOS-ADR-015`. S4: `ML-DEVOS-ADR-014`.
- Protocol: `ML-DEVOS-RFC-018`.

## Evidence locations

- The commit diff against `8e9982f6cb2925ff0364436addc7b026f834ac60`.
- `devos/execution/host.mjs` (linearization section and table), `registry.mjs` (transition tables and CAS), `journal.mjs` (append lock).
- `tests/execution-linearization.test.mjs`; `tests/execution-mutation.test.mjs` (M24–M31).

## Next action

The Architect independently re-reviews `AS95-F001`/`F002` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-095`, and archives `H-S6-CORE-IMPL-REM2-0001` if its routing deselects this handoff. Any further blocker routes to Paulo; no third cycle is requested. S6 closure remains separately gated. No further Builder action is authorized.
