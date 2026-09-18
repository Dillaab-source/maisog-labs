# devos/state/ — Reserved (S4)

`STATUS: NOT IMPLEMENTED`

Canonical owning phase: **S4 — State Machine Kernel**

Known consuming phase(s): none declared yet.

Reserved by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`) as the canonical future home for authoritative task-lifecycle state, ownership, locks/leases, and retry/timeout/idempotency records. No executable subsystem, state machine, or state record exists in this directory as of S2 — this README, and the boundary it declares, is the only content S2 places here.

This directory's existence does not mean a State Machine Kernel is implemented. It means only that when S4 is separately proposed (its own RFC), reviewed (Architect Sync), and authorized (Paulo decision), this is where its artifacts belong. See `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path (`owning_phase: "S4"`, `status: "NOT_IMPLEMENTED"`, `executable_runtime_present: false`) — the manifest is the authoritative machine-readable record of this boundary; this README is its human-readable mirror.

Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change, not an edit to this file.
