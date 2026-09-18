# devos/memory/ — Reserved (S11)

`STATUS: NOT IMPLEMENTED`

Canonical owning phase: **S11 — Memory & Observability**

Known consuming phase(s): none declared yet.

Reserved by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`) as the canonical future home for the separated Architectural Memory, Project Memory, and Run History stores, plus task/run health and telemetry. No executable subsystem, storage engine, or observability code exists in this directory as of S2 — this README, and the boundary it declares, is the only content S2 places here.

This directory's existence does not mean a Memory & Observability subsystem is implemented. It means only that when S11 is separately proposed (its own RFC), reviewed (Architect Sync), and authorized (Paulo decision), this is where its artifacts belong. The frozen S0 architecture's distinction between Architectural Memory, Project Memory, Run History, Task Engine State, and the Evidence Store as separate stores/concepts remains binding and is not altered by this reservation. See `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path (`owning_phase: "S11"`, `status: "NOT_IMPLEMENTED"`, `executable_runtime_present: false`) — the manifest is the authoritative machine-readable record of this boundary; this README is its human-readable mirror.

Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change, not an edit to this file.
