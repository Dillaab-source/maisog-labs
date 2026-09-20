# devos/state/ — S4 State Machine Kernel

`MANIFEST STATUS: IMPLEMENTED` — `closure_ref: ML-DEVOS-ADR-014`, `executable_runtime_present: false` (see below)

Canonical owning phase: **S4 — State Machine Kernel**

Known consuming phase(s): none declared yet. A future S8 Orchestrator is the most plausible future caller; none exists today.

## Implementation truth

Implementation authorized by `D-050` (following design acceptance `ML-DEVOS-RFC-016` / `ML-DEVOS-AS-065`), accepted by `ML-DEVOS-AS-066`, and closed by `ML-DEVOS-ADR-014` / `D-051` exists in this directory:

- `task-state.schema.json` — structural schema for a Task Engine State record.
- `lifecycle.mjs` — pure, deterministic transition-table logic (no I/O).
- `task-policy.mjs` — the explicit, `D-050`-locked S4 Task Policy (retry ceilings `build=2`/`qa=2`/`review=2`; force-clear-lock authorized operators). Never derived from `coordination/STATE.md`.
- `store.mjs` — the local file-backed persistence/locking adapter (`fs.open(path, "wx")` exclusive-create lock; write-temp-then-atomic-rename; fail-closed orphaned-lock handling — no automatic age-based lock stealing).
- `kernel.mjs` — the public operations: `createTask`, `claim`, `renew`, `release`, `transition`, `getState`, `sweepExpiredLeases`, `forceClearLock`.
- `validate-task-state.mjs` — the structural validator.

Focused tests live at `tests/state-lifecycle.test.mjs`, `tests/state-kernel.test.mjs`, and `tests/state-concurrency.test.mjs` (the last using real, separate OS processes to exercise the exclusive-lock primitive, not simulated concurrency).

## Closure status

S4 is closed. `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path is `status: "IMPLEMENTED"`, `closure_ref: "ML-DEVOS-ADR-014"`, `executable_runtime_present: false`, following the exact D.1 Pre-decision Closure Preflight (`ML-DEVOS-AS-067`, `PASS`) / D.2 Post-decision Closure Verification procedure `ML-DEVOS-RFC-015` established.

`executable_runtime_present: false` is a descriptive, behavior-based statement, not a claim that the code is inert or untested: it means no active operational Sentinel runtime service, scheduler, or dispatcher currently invokes this library. Nothing in this directory is wired into any live orchestration, dispatch, or CI path — it is a library any future caller (most plausibly a future S8 Orchestrator) would import explicitly; it is not itself running anywhere. This closure does not itself authorize S5, S8, or any later phase.

## Boundary, unchanged from before this cycle

This directory remains the canonical home for authoritative task-lifecycle state, ownership, locks/leases, and retry/timeout/idempotency records — reserved by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`). Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change, not an edit to this file.

See `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path for the authoritative machine-readable lifecycle-status record; this README is its human-readable mirror and does not itself confer or claim any status the manifest does not also record.
