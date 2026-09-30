# Operative Obligations — Carry-Forward Inventory

Status: `ACTIVE` — the Context Bootstrap V0 carry-forward index, activated by the `D-062` Stage B commit. The candidate was reviewed in `ML-DEVOS-AS-079` (accepted as a candidate) and `ML-DEVOS-AS-080` (Stage A gate PASS; activation routed). Row content is unchanged by activation.

Authority: `ML-DEVOS-RFC-018` § "Independently reviewed carry-forward inventory at cutover" (`B018-04`), `D-062`.

This is an index into authoritative records, never a substitute for them and never a grant of authority. Each row names the record that owns the obligation; read that record for the requirement itself. Dispositions: `OPEN`, `DEFERRED` (unresolved, parked to a named later step), `CLOSED`, `SUPERSEDED`. Rules (checked by `scripts/check-context-bootstrap.mjs`): an `OPEN`/`DEFERRED` row may leave only by becoming `CLOSED`/`SUPERSEDED` with a cited closure reference; a handoff that does not mention a row is not evidence the row no longer applies.

Compiled by the Builder at `93a66b7fd5c0815f7e950768de9292c46779b420` from: live `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-078`, final and its earlier rolling publications at `8ff64f0`/`c614708`), `ML-DEVOS-RFC-018`, `brain/DECISION_LOG.md` (`D-057`–`D-062`), `ML-DEVOS-AS-074`/`AS-077`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, and the traceability validator. Per LEAN mode the historical `coordination/IMPLEMENTER_HANDOFF.md` was **not** swept; completeness against it is exactly what the independent review must judge.

Layout (`ML-DEVOS-RFC-023` BC-11): `OPEN`/`DEFERRED` rows first, fully descriptive; `CLOSED`/`SUPERSEDED` rows as stubs whose text is recoverable from the source. Rows are never deleted. `OBL-023`–`OBL-026` came from the STATE body under `D-127`.

## Open and deferred

| ID | Obligation | Authoritative source | Disposition | Closure / supersession |
|---|---|---|---|---|
| OBL-006 | Soft CURRENT_HANDOFF size target with reference-based overflow; never drop obligations to meet size. | `ML-DEVOS-AS-078` at `8ff64f0`, Non-blocking improvement 1 | DEFERRED | — |
| OBL-007 | Version the baseline so before/after comparisons stay meaningful. Stage A candidate: `CBV0-BASELINE-PRE-1` (Builder-reported, not yet accepted). | `ML-DEVOS-AS-078` at `8ff64f0`, Non-blocking improvement 2; `ML-DEVOS-RFC-018` § Baseline | OPEN | — |
| OBL-010 | Rollback verified after several **real** V0 turns (Stage A exercises it only on a hermetic fixture). | `ML-DEVOS-RFC-018` § Rollback item 6 | OPEN | — |
| OBL-011 | Behavioral/procedural evaluation of forged-committed-authorization and hostile instruction-shaped evidence cases; string/parser tests are not proof. | `ML-DEVOS-RFC-018` § Failure tests; `D-062` Failure tests | OPEN | — |
| OBL-012 | Each supported participant (local Claude Builder; GitHub-connected ChatGPT Architect) demonstrates exact-tip conflict-detecting publication before receiving governed-write support; others stay advisory/read-only. | `ML-DEVOS-RFC-018` § Supported participants; `B018-01` item 7 | OPEN | — |
| OBL-013 | SENTINEL Model Router V0 remains a queued post-Bootstrap/S5-pilot candidate with no authority. | `ML-DEVOS-AS-078` § Post-Bootstrap candidate; `D-062` | DEFERRED | — |
| OBL-014 | Context Plane V1 / CP-4+ remains queued; revisit only if trial evidence justifies it. | `D-060`; `ML-DEVOS-RFC-018` § Sequencing step 10 | DEFERRED | — |
| OBL-015 | Traceability debt: `CORE-022` and `WEB-REQ-009` are referenced without canonical records. | `devos/governance/traceability/validate-traceability.mjs`; `ML-DEVOS-AS-077` § Traceability disposition | OPEN | — |
| OBL-017 | Production release stays separately gated: `review PR -> merge gate -> main -> separate production deploy gate -> runtime verification`; no deploy, remote D1/R2, Access, DNS, production-data write, or public D1 cutover without separate authorization. | `D-057`; `ML-DEVOS-AS-074` | OPEN | — |
| OBL-018 | PR #10 must not be merged or auto-merged without separate authorization. | `D-057` Still prohibited; live `coordination/STATE.md` | OPEN | — |
| OBL-019 | Website risks still `OPEN`/`NOT STARTED`: `RISK-WEB-001`, `RISK-WEB-003`, `RISK-WEB-005`, `RISK-WEB-009`, `RISK-WEB-010`, `RISK-WEB-013`. | `brain/RISK_REGISTER.md` | OPEN | — |
| OBL-020 | Risks recorded `MITIGATED`/`IMPLEMENTED` but not independently `VERIFIED`: `RISK-WEB-002`, `-004`, `-006`, `-007`, `-008`, `-011`, `-012`, `-014`, `-015`. | `brain/RISK_REGISTER.md` | OPEN | — |
| OBL-021 | Tests still `NOT IMPLEMENTED`: `TEST-WEB-001`, `TEST-WEB-002`, `TEST-WEB-003`, `TEST-DEP-001`, `TEST-DEP-002`. | `brain/TEST_LEDGER.md` | OPEN | — |
| OBL-023 | Until the Protocol V2 check-only defect is repaired, `--check-only` alone is not proof that a transition is complete: every owner, Architect or Builder publication explicitly inspects the candidate STATE transition and changed-file set before compare-and-swap publication. | `ML-DEVOS-AS-132` § AS132-F003 | OPEN | — |
| OBL-024 | S6 stays parked at the `ML-DEVOS-AS-103` accepted hardened-core boundary. Parking is not closure (S6 stays `NOT_IMPLEMENTED`, no `closure_ref`, Sentinel `v1.8.0`); resuming S6 or starting S7 needs a separate Paulo decision. | `D-075`; `ML-DEVOS-AS-103` | DEFERRED | — |
| OBL-025 | O1: hardened TaskStore replace-atomicity is evidenced only for the tested Linux profile (macOS/Windows `NOT RUN` and refused). No later S6 integrated Stage Gate or closure may claim macOS/Windows conformance without additional evidence or a separately governed platform/backend decision. | `ML-DEVOS-AS-103` § Carry-forward O1; `D-075` | OPEN | — |
| OBL-026 | O2: an unattributable `PENDING` publication fails closed task-wide, but the exceptional audited operator-recovery semantics RFC-019 mentions are not implemented. An S6 integrated-stage / pre-closure concern. | `ML-DEVOS-AS-103` § Carry-forward O2; `D-075` | OPEN | — |

## Closed and superseded (stubs)

| ID | Obligation | Authoritative source | Disposition | Closure / supersession |
|---|---|---|---|---|
| OBL-001 | — | `D-061`; `D-062`; `ML-DEVOS-AS-078` | CLOSED | D-063 |
| OBL-002 | — | `ML-DEVOS-AS-077` § Non-blocking design note | CLOSED | ML-DEVOS-AS-082 |
| OBL-003 | — | `D-062` Stage B | CLOSED | ML-DEVOS-AS-081 |
| OBL-004 | — | `ML-DEVOS-RFC-018` § Known migration inputs; `B018-05` item 6 | CLOSED | ML-DEVOS-AS-081 |
| OBL-005 | — | `ML-DEVOS-AS-078` as published at `8ff64f0`, Non-blocking improvement 3 | CLOSED | ML-DEVOS-AS-081 |
| OBL-008 | — | `ML-DEVOS-RFC-018` `B018-02` item 5, `B018-03` items 1/6; observed Git history | CLOSED | Decision resolved by `ML-DEVOS-AS-079` `AS79-R001` (new immutable Sync ID per published revision); Stage B implementation carried by `OBL-022` |
| OBL-009 | — | `ML-DEVOS-RFC-018` § Baseline and measurements | CLOSED | ML-DEVOS-AS-083 |
| OBL-016 | — | `ML-DEVOS-AS-077` § Traceability disposition | CLOSED | `D-061` archive repair; `devos/changes/architect-syncs/ML-DEVOS-AS-075.md` |
| OBL-022 | — | `ML-DEVOS-AS-079` `AS79-R001`; `D-062` Stage B | CLOSED | ML-DEVOS-AS-081 |
