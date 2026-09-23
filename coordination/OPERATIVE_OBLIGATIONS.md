# Operative Obligations — Carry-Forward Inventory

Status: `CANDIDATE — PENDING INDEPENDENT ARCHITECT REVIEW` (D-062 Stage A). Not active routing.

Authority: `ML-DEVOS-RFC-018` § "Independently reviewed carry-forward inventory at cutover" (`B018-04`), `D-062`.

This is an index into authoritative records, never a substitute for them and never a grant of authority. Each row names the record that owns the obligation; read that record for the requirement itself. Dispositions: `OPEN`, `DEFERRED` (unresolved, parked to a named later step), `CLOSED`, `SUPERSEDED`. Rules (checked by `scripts/check-context-bootstrap.mjs`): an `OPEN`/`DEFERRED` row may leave only by becoming `CLOSED`/`SUPERSEDED` with a cited closure reference; a handoff that does not mention a row is not evidence the row no longer applies.

Compiled by the Builder at `93a66b7fd5c0815f7e950768de9292c46779b420` from: live `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-078`, final and its earlier rolling publications at `8ff64f0`/`c614708`), `ML-DEVOS-RFC-018`, `brain/DECISION_LOG.md` (`D-057`–`D-062`), `ML-DEVOS-AS-074`/`AS-077`, `brain/RISK_REGISTER.md`, `brain/TEST_LEDGER.md`, and the traceability validator. Per LEAN mode the historical `coordination/IMPLEMENTER_HANDOFF.md` was **not** swept; completeness against it is exactly what the independent review must judge.

| ID | Obligation | Authoritative source | Disposition | Closure / supersession |
|---|---|---|---|---|
| OBL-001 | S5 executable implementation stays paused until a separate Paulo decision after Bootstrap V0 is independently accepted. | `D-061`; `D-062`; `ML-DEVOS-AS-078` | OPEN | — |
| OBL-002 | Include the one-line RFC-017 descriptor-expiry wording reconciliation ("not grantable to new attempts after supersession") in any S5 implementation brief. | `ML-DEVOS-AS-077` § Non-blocking design note | DEFERRED | — |
| OBL-003 | Bootstrap Stage B atomic activation (CURRENT_HANDOFF, protocol-version marker, legacy freeze, coherent reader/writer migration) only after Architect accepts Stage A and routes it. | `D-062` Stage B | OPEN | — |
| OBL-004 | Reconcile the named migration inputs during Stage B: legacy handoff read/write requirements, provider names encoded as role holders, request-independent TURN gating that blocks advisory analysis, wording that overstates committed content as authority, stale remediation cap `3` vs live `2`, reference to an absent STATE "State protocol" section. | `ML-DEVOS-RFC-018` § Known migration inputs; `B018-05` item 6 | OPEN | — |
| OBL-005 | Operative entrypoints must treat `D-060`'s former "current live cycle" wording as historical. | `ML-DEVOS-AS-078` as published at `8ff64f0`, Non-blocking improvement 3 | OPEN | — |
| OBL-006 | Soft CURRENT_HANDOFF size target with reference-based overflow; never drop obligations to meet size. | `ML-DEVOS-AS-078` at `8ff64f0`, Non-blocking improvement 1 | DEFERRED | — |
| OBL-007 | Version the baseline so before/after comparisons stay meaningful. Stage A candidate: `CBV0-BASELINE-PRE-1` (Builder-reported, not yet accepted). | `ML-DEVOS-AS-078` at `8ff64f0`, Non-blocking improvement 2; `ML-DEVOS-RFC-018` § Baseline | OPEN | — |
| OBL-008 | Review-ID reuse across rolling publications: `ML-DEVOS-AS-078` was published with three different contents under one ID (blobs `3605f2f…`, `b363e05…`, `db991cd…`); only the final is archived. Under RFC-018's immutable-ID / duplicate-ID-fails-closed rules this pattern would be rejected. Stage B must decide how successive rolling reviews are identified (new Sync ID per publication, or an explicit revision identity) before activation. | `ML-DEVOS-RFC-018` `B018-02` item 5, `B018-03` items 1/6; observed Git history | OPEN | — |
| OBL-009 | Post-cutover measurements during S5 Trial #1 (context volume, initial reads, history reads, duplicate reads, wrong-turn attempts, stale-publication rejections, false blocking, missed obligations, rework, scope violations). | `ML-DEVOS-RFC-018` § Baseline and measurements | OPEN | — |
| OBL-010 | Rollback verified after several **real** V0 turns (Stage A exercises it only on a hermetic fixture). | `ML-DEVOS-RFC-018` § Rollback item 6 | OPEN | — |
| OBL-011 | Behavioral/procedural evaluation of forged-committed-authorization and hostile instruction-shaped evidence cases; string/parser tests are not proof. | `ML-DEVOS-RFC-018` § Failure tests; `D-062` Failure tests | OPEN | — |
| OBL-012 | Each supported participant (local Claude Builder; GitHub-connected ChatGPT Architect) demonstrates exact-tip conflict-detecting publication before receiving governed-write support; others stay advisory/read-only. | `ML-DEVOS-RFC-018` § Supported participants; `B018-01` item 7 | OPEN | — |
| OBL-013 | SENTINEL Model Router V0 remains a queued post-Bootstrap/S5-pilot candidate with no authority. | `ML-DEVOS-AS-078` § Post-Bootstrap candidate; `D-062` | DEFERRED | — |
| OBL-014 | Context Plane V1 / CP-4+ remains queued; revisit only if trial evidence justifies it. | `D-060`; `ML-DEVOS-RFC-018` § Sequencing step 10 | DEFERRED | — |
| OBL-015 | Traceability debt: `CORE-022` and `WEB-REQ-009` are referenced without canonical records. | `devos/governance/traceability/validate-traceability.mjs`; `ML-DEVOS-AS-077` § Traceability disposition | OPEN | — |
| OBL-016 | Missing durable archive for `ML-DEVOS-AS-075` (and 076/077). | `ML-DEVOS-AS-077` § Traceability disposition | CLOSED | `D-061` archive repair; `devos/changes/architect-syncs/ML-DEVOS-AS-075.md` |
| OBL-017 | Production release stays separately gated: `review PR -> merge gate -> main -> separate production deploy gate -> runtime verification`; no deploy, remote D1/R2, Access, DNS, production-data write, or public D1 cutover without separate authorization. | `D-057`; `ML-DEVOS-AS-074` | OPEN | — |
| OBL-018 | PR #10 must not be merged or auto-merged without separate authorization. | `D-057` Still prohibited; live `coordination/STATE.md` | OPEN | — |
| OBL-019 | Website risks still `OPEN`/`NOT STARTED`: `RISK-WEB-001`, `RISK-WEB-003`, `RISK-WEB-005`, `RISK-WEB-009`, `RISK-WEB-010`, `RISK-WEB-013`. | `brain/RISK_REGISTER.md` | OPEN | — |
| OBL-020 | Risks recorded `MITIGATED`/`IMPLEMENTED` but not independently `VERIFIED`: `RISK-WEB-002`, `-004`, `-006`, `-007`, `-008`, `-011`, `-012`, `-014`, `-015`. | `brain/RISK_REGISTER.md` | OPEN | — |
| OBL-021 | Tests still `NOT IMPLEMENTED`: `TEST-WEB-001`, `TEST-WEB-002`, `TEST-WEB-003`, `TEST-DEP-001`, `TEST-DEP-002`. | `brain/TEST_LEDGER.md` | OPEN | — |
