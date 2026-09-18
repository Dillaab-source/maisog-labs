# devos/orchestration/ — Reserved (S8)

`STATUS: NOT IMPLEMENTED`

Canonical owning phase: **S8 — Orchestrator MVP**

Known consuming phase(s): none declared yet.

Reserved by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`) as the canonical future home for bounded coordination logic between Architect, Builder, QA, and Independent Reviewer. No executable subsystem, orchestration logic, or runtime coordination code exists in this directory as of S2 — this README, and the boundary it declares, is the only content S2 places here.

This directory's existence does not mean an Orchestrator is implemented. It means only that when S8 is separately proposed (its own RFC), reviewed (Architect Sync), and authorized (Paulo decision), this is where its artifacts belong. Per `CORE-004`, an Orchestrator (like the Evidence Gate) would remain a system mechanism, never an authority actor, once it is eventually built — this reservation does not pre-decide that design, only its future location. See `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path (`owning_phase: "S8"`, `status: "NOT_IMPLEMENTED"`, `executable_runtime_present: false`) — the manifest is the authoritative machine-readable record of this boundary; this README is its human-readable mirror.

Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change, not an edit to this file.
