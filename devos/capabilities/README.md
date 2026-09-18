# devos/capabilities/ — Reserved (S5)

`STATUS: NOT IMPLEMENTED`

Canonical owning phase: **S5 — Capability & Permission Gateway**

Known consuming phase(s): none declared yet.

Reserved by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`) as the canonical future home for capability/permission enforcement — scoped role/tool/project permissions, secret/credential requirements, and sensitive-operation gating. No executable subsystem, gateway, or permission-enforcement code exists in this directory as of S2 — this README, and the boundary it declares, is the only content S2 places here.

This directory's existence does not mean a Capability Gateway is implemented. It means only that when S5 is separately proposed (its own RFC), reviewed (Architect Sync), and authorized (Paulo decision), this is where its artifacts belong. `CORE-002` (`Capability != Authority`) and `CORE-008` (installed capability does not grant universal authority) remain binding regardless of whether this directory contains anything — this reservation does not itself grant, imply, or enforce any capability. See `devos/devos-manifest.json`'s `reserved_subsystem_roots` entry for this path (`owning_phase: "S5"`, `status: "NOT_IMPLEMENTED"`, `executable_runtime_present: false`) — the manifest is the authoritative machine-readable record of this boundary; this README is its human-readable mirror.

Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change, not an edit to this file.
