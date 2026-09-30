# RFCs

Filed RFCs live here as `ML-DEVOS-RFC-<NNN>.md`, using `../../templates/RFC_TEMPLATE.md`. Numbering is sequential starting at `001`, never reused. See `../../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §3 for what an RFC is (and is not) evidence of.

## Lifecycle projection

This table is the **single maintained projection of current RFC lifecycle status** (`ML-DEVOS-RFC-023` BC-10, `D-127`). It is subordinate: Decisions (`brain/DECISION_LOG.md`), ADRs (`../adrs/`) and immutable Architect Sync records (`../architect-syncs/`) establish authority and history, and win over this table wherever they differ. RFC bodies carry no mutable lifecycle prose; each carries the one canonical line:

```
Status: See `devos/changes/rfcs/README.md` for the current lifecycle projection; Decisions and ADRs remain authoritative.
```

- **Status vocabulary** (from the RFC template): `DRAFT`, `UNDER_ARCHITECT_SYNC`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`.
- **Acceptance is not implementation** (policy §3). Implementation and closure are shown by an ADR in the authority refs, not by the status value.
- **One row per RFC file.** The authority refs cell lists IDs only, oldest first.

| RFC | Title | Class | Status | Authority refs |
|---|---|---|---|---|
| ML-DEVOS-RFC-001 | S2 DevOS Repository Foundation | ARCHITECTURE | ACCEPTED | D-015; ML-DEVOS-AS-006; D-016; ML-DEVOS-AS-007; D-017; ML-DEVOS-ADR-002 |
| ML-DEVOS-RFC-002 | MaisogLabs WEB-INC-001 Authentication Boundary | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-011; D-023 |
| ML-DEVOS-RFC-003 | MaisogLabs WEB-INC-005 D1 Revision Substrate and Current-Content Migration | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-013; D-024; ML-DEVOS-ADR-003 |
| ML-DEVOS-RFC-004 | MaisogLabs WEB-INC-002 Protected Read-Only Admin Dashboard | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-015; D-025; ML-DEVOS-ADR-004 |
| ML-DEVOS-RFC-005 | MaisogLabs WEB-INC-008 Append-Only Audit Substrate | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-017; D-026; ML-DEVOS-ADR-005 |
| ML-DEVOS-RFC-006 | MaisogLabs WEB-INC-003 Project Mutation Capability | CAPABILITY | ACCEPTED | ML-DEVOS-AS-020; D-027 |
| ML-DEVOS-RFC-007 | MaisogLabs WEB-INC-004 Local Media Subsystem | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-023; D-029; ML-DEVOS-ADR-007 |
| ML-DEVOS-RFC-008 | Sentinel Risk Escalation Rules | CORE_POLICY | ACCEPTED | ML-DEVOS-AS-024; ML-DEVOS-AS-025; D-028; ML-DEVOS-ADR-006 |
| ML-DEVOS-RFC-009 | MaisogLabs WEB-INC-006 Local Journal Subsystem | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-028; D-031; ML-DEVOS-AS-029; ML-DEVOS-ADR-008 |
| ML-DEVOS-RFC-010 | MaisogLabs WEB-INC-007 Theme / Design Controls | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-030; D-032; ML-DEVOS-AS-033; ML-DEVOS-ADR-009; ML-DEVOS-AS-118; D-089 |
| ML-DEVOS-RFC-011 | MaisogLabs Production Release Readiness Gate | LOCAL_RULE | ACCEPTED | ML-DEVOS-AS-034; D-034; ML-DEVOS-AS-035 |
| ML-DEVOS-RFC-012 | Static Traceability Graph and Integrity Validator | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-037; D-036; ML-DEVOS-AS-041; ML-DEVOS-ADR-010 |
| ML-DEVOS-RFC-013 | S3 Typed Task Contracts | ARCHITECTURE | ACCEPTED | D-046; ML-DEVOS-ADR-013 |
| ML-DEVOS-RFC-014 | MaisogLabs Skills Foundation V0.1 Discovery (incorporating Portable Knowledge Treasury) | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-050; D-042; D-046; ML-DEVOS-ADR-011 |
| ML-DEVOS-RFC-015 | Reserved Subsystem Lifecycle and Closure Reconciliation | ARCHITECTURE | ACCEPTED | D-043; ML-DEVOS-AS-059; D-044; D-045; D-046; ML-DEVOS-ADR-012; ML-DEVOS-ADR-013 |
| ML-DEVOS-RFC-016 | S4 State Machine Kernel | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-066; D-051; ML-DEVOS-ADR-014 |
| ML-DEVOS-RFC-017 | S5 Capability & Permission Gateway | ARCHITECTURE | ACCEPTED | D-058; ML-DEVOS-AS-077; D-063; ML-DEVOS-AS-083; D-065; ML-DEVOS-ADR-015 |
| ML-DEVOS-RFC-018 | SENTINEL Context Plane Bootstrap V0 | ARCHITECTURE | ACCEPTED | D-061; ML-DEVOS-AS-078; D-062; ML-DEVOS-AS-079; ML-DEVOS-AS-080; ML-DEVOS-AS-081 |
| ML-DEVOS-RFC-019 | Sentinel S6 Isolated Execution | ARCHITECTURE | ACCEPTED | D-066; ML-DEVOS-AS-086; ML-DEVOS-AS-087; ML-DEVOS-AS-088; D-067; ML-DEVOS-AS-089; D-068; D-069; ML-DEVOS-AS-093; D-071; D-073; ML-DEVOS-AS-099; ML-DEVOS-AS-101; D-074; ML-DEVOS-AS-103; D-075 |
| ML-DEVOS-RFC-020 | Canonical Directive Transport / Context Bootstrap V2 | ARCHITECTURE | ACCEPTED | ML-DEVOS-AS-108; D-079; ML-DEVOS-AS-110; D-080; D-081 |
| ML-DEVOS-RFC-021 | V10 Canonical Visual Baseline | ARCHITECTURE | ACCEPTED | D-088; ML-DEVOS-AS-117; ML-DEVOS-AS-118; D-089 |
| ML-DEVOS-RFC-022 | V10 Published Content Bridge | ARCHITECTURE | ACCEPTED | D-104; ML-DEVOS-AS-131; D-105; ML-DEVOS-AS-132 |
| ML-DEVOS-RFC-023 | Context Bootstrap V2.1 — Governance-Efficiency Policy Amendment to Protocol V2 | CORE_POLICY | ACCEPTED | ML-DEVOS-AS-151; ML-DEVOS-AS-152; ML-DEVOS-AS-153; D-127 |

## Projection notes

Qualifiers that the status value alone cannot carry. Each is traceable to the refs in its row.

- **RFC-010:** narrowly superseded by RFC-021 only where it fixed the V3/soft-geometry baseline, composition and default-parity target; every other RFC-010 invariant is preserved (`ML-DEVOS-AS-118` / `D-089`).
- **RFC-018 / RFC-020:** implemented as the live coordination protocol. RFC-018 is the V1 kernel (activated by `D-062` Stage B); RFC-020 is Protocol V2 (activated by `D-080`). Neither has an ADR.
- **RFC-019:** S6 core implemented under `D-074` and accepted by `ML-DEVOS-AS-103`, then parked at that boundary by `D-075`. Parking is not closure: no ADR; `D-068` stays suspended (`OBL-024`–`OBL-026`).
- **RFC-021 / RFC-022:** acceptance granted no implementation authority. RFC-022 is subject to AS132-F001/F002 (`ML-DEVOS-AS-132`).
- **RFC-023:** adopted by `D-127`, Cycle A (policy / document / record migration) only. The BC-10 validator checks and the BC-12 attempt-ledger change are Cycle B and need a separate owner decision. No Authorized Work Envelope has been granted. Class `CORE_POLICY` is the Builder's projection (the accepted design text states no class), for Architect confirmation.

No RFC had been filed as of S1 — the RFC/ADR system did not exist yet at that point (`D-012`/`ML-DEVOS-AS-003`'s pre-RFC bootstrap principle). `ML-DEVOS-RFC-001` is the first RFC actually filed under the system S1 built.
