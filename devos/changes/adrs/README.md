# ADRs

Accepted ADRs live here as `ML-DEVOS-ADR-<NNN>.md`, using `../../templates/ADR_TEMPLATE.md`. Numbering is sequential starting at `001`, never reused. An ADR is written **after** implementation exists and has been reviewed — it is a record of what became architecture and why, not a design proposal (that's an RFC).

## Current contents

- `ML-DEVOS-ADR-001.md` — the first durable ADR, recording adoption of the S1 Governance Kernel as the active Sentinel governance-capability baseline and the explicit `v1.2.0 → v1.3.0` version transition, per Paulo decision `D-013` and Architect Sync `ML-DEVOS-AS-004`'s final `ARCHITECT_APPROVED` verdict.

The frozen S0 constitutional rules (`../../governance/rules/core-rules.json`, `CORE-001`–`CORE-007`, `CORE-010`–`CORE-015`) predate the ADR system and correctly retain `adr_id: null` — they remain valid and in force at `effective_version: "1.2.0"` without one, per `D-012`/`ML-DEVOS-AS-003`'s pre-RFC bootstrap-authority principle. Only the five S1-origin rules newly activated by `ML-DEVOS-ADR-001` (`CORE-008`, `CORE-009`, `CORE-016`, `CORE-017`, `CORE-018`) carry a non-null `adr_id`.
