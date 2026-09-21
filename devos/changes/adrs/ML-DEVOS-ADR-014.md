# ADR-014: Adopt Sentinel S4 State Machine Kernel

Status: `ACCEPTED`

Related RFC:
- `ML-DEVOS-RFC-016`

Architect Syncs:
- `ML-DEVOS-AS-065` — design stage gate (`ARCHITECT_APPROVED`), after two remediation cycles closing `AS65-F001`–`AS65-F004`
- `ML-DEVOS-AS-066` — S4 implementation stage gate, `ARCHITECT_APPROVED — IMPLEMENTATION ACCEPTED / CLOSURE DECISION REQUIRED`, one remediation cycle (`S4I-F001`–`S4I-F005`) closed
- `ML-DEVOS-AS-067` — D.1 Pre-decision Closure Preflight, `PASS`

Paulo decisions:
- `D-048` — S4 proposal/audit authorization only
- `D-049` — one additional design micro-remediation (`AS65-F001` stale-lock safety)
- `D-050` — bounded S4 implementation authorization, including the locked V1 Task Policy and orphan-lock recovery boundary
- `D-051` — S4 closure and `v1.7.0` adoption authorization, exactly as preflighted by `ML-DEVOS-AS-067`

Implementation range:
- final independently accepted implementation head: `72cd84a8fedb581306c023ee88e1b0f1c4d5293c`

Effective version:
- Sentinel governance-capability baseline: `v1.7.0` (this ADR is the active baseline ADR for this transition)
- frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`

## Decision

Sentinel adopts the S4 State Machine Kernel as active, implemented architecture:

- `devos/state/task-state.schema.json` — structural schema for a Task Engine State record;
- `devos/state/lifecycle.mjs` — the pure, deterministic transition-table logic (no I/O), implementing `ML-DEVOS-ARCH-001` §10's frozen lifecycle plus the two additive terminal states `FAILED`/`ABANDONED` adopted by `D-050`;
- `devos/state/task-policy.mjs` — the explicit, `D-050`-locked S4 Task Policy: retry ceilings `build=2` / `qa=2` / `review=2`, and `force_clear_lock` authorized operators (`Paulo` is the only default V1 operator; any other operator requires a separate explicit Paulo delegation decision). Task Policy values are never derived from `coordination/STATE.md`;
- `devos/state/store.mjs` — the local file-backed persistence/locking adapter: one JSON record file plus one `wx`-exclusive-create lock file per task, write-temp-then-atomic-rename persistence, and fail-closed orphaned-lock handling (ordinary mutation never auto-clears a held lock, regardless of age; only the separately gated `force_clear_lock` maintenance path may recover a confirmed orphan);
- `devos/state/kernel.mjs` — the public operations: `createTask`, `claim`, `renew`, `release`, `transition`, `getState`, `sweepExpiredLeases`, `forceClearLock`;
- `devos/state/validate-task-state.mjs` — the structural validator, run both immediately after load and immediately before persistence;
- focused tests: `tests/state-lifecycle.test.mjs`, `tests/state-kernel.test.mjs`, `tests/state-concurrency.test.mjs` (the last using real, separate OS processes to exercise the exclusive-lock primitive).

The reserved root `devos/state/` moves to `status: IMPLEMENTED` in `devos/devos-manifest.json`, with `closure_ref` naming this ADR, `executable_runtime_present` remaining `false`.

S4 is a pure, deterministic, file-backed task-lifecycle library — not an active scheduler, orchestrator, evidence store, or permission gateway. It never decides whether a QA result passed, whether a reviewer should approve, or whether evidence is sufficient; it enforces only the shape of legal progress, exactly as `ML-DEVOS-RFC-016` proposed.

## Context

`ML-DEVOS-RFC-016` proposed the S4 design under `D-048`'s proposal/audit-only authorization. Two Architect remediation cycles closed four load-bearing design blockers (`AS65-F001`–`AS65-F004`) plus four clarifications; a further Paulo-authorized micro-remediation (`D-049`) replaced an unsafe automatic age-based stale-lock-stealing design with fail-closed, operator-driven orphaned-lock recovery. `ML-DEVOS-AS-065` gave final design stage-gate approval.

`D-050` authorized one bounded implementation cycle at the accepted design, locking the V1 Task Policy retry ceilings and the orphan-lock recovery/force-clear boundary as explicit Paulo decisions rather than Builder inventions. Implementation proceeded through one remediation cycle, closing five findings (`S4I-F001`–`S4I-F005`): missing transition-table guards on `decisionRef`/`evidenceRef`-gated edges; a `QA → BUILDING` ownership-handoff gap corrected by moving to exact handoff-edge matching (`isHandoffEdge(from, to)`) rather than destination-only matching; missing persistence-boundary structural validation (now run at both load and pre-persistence); missing `task_id` path-safety enforcement (`^[A-Z][A-Z0-9_-]*$`, minimum length 3, enforced before any task-derived filesystem path is constructed); and incomplete lock diagnostic metadata (now including `holder`, `operation`, `acquired_at`, `task_id`, `pid`). `ML-DEVOS-AS-066` gave final implementation stage-gate approval at head `72cd84a8fedb581306c023ee88e1b0f1c4d5293c`, formally accepting two implementation-discovered corrections (see "Accepted implementation-discovered corrections" below) and naming five items this closure ADR must record explicitly. `ML-DEVOS-AS-067`'s D.1 Pre-decision Closure Preflight confirmed the resulting closure package was internally consistent and bounded before Paulo's `D-051` closure authorization.

## Alternatives considered

See `ML-DEVOS-RFC-016`'s own "Alternatives considered": extending `coordination/STATE.md` itself to carry per-task fields (rejected — conflates the bootstrap turn-lock surface with per-task state, and would require migrating live coordination); building the full Task Engine (S4 + S8 orchestration + S9 acceptance) as one large phase (rejected — collapses three phases the frozen roadmap deliberately separates); adopting an existing open-source workflow/state-machine library (rejected for V1 — third-party dependency and surface mismatch for a kernel deliberately scoped to "smallest"); event-sourced persistence as the primary model (rejected for V1 — more moving parts than the smallest kernel needs; retained as a plausible future S11 evolution); an active timeout daemon instead of a passive `sweepExpiredLeases` query (rejected for V1 — that is the Orchestrator's, S8's, job); relying on atomic rename alone with no separate mutex primitive, and reading the task-retry ceiling live from `coordination/STATE.md`'s `MAX_REMEDIATION_CYCLES` (both rejected on Architect design review, `AS65-F001`/`AS65-F003`, and corrected in the accepted design this ADR adopts).

## Rationale

A pure, deterministic transition function plus a minimal local persistence adapter gives Sentinel an authoritative, fail-closed record of task stage, ownership, and idempotent-replay safety without prematurely building S5's permission enforcement, S7's evidence storage, S8's orchestration, or S9's evidence-sufficiency judgment. Referencing S3 Task Contracts by `contract_ref` rather than duplicating their schema keeps the two subsystems' distinct questions ("what is authorized" vs. "what stage is it in and is this transition legal") from being conflated, exactly as `ML-DEVOS-RFC-013` anticipated.

## Consequences

This adoption gives Sentinel a real, testable task-lifecycle kernel: single-owner claims with lease/fencing semantics, idempotent request handling via a persisted idempotency-key ledger (with `release`'s documented stronger-reason no-persisted-key exception), durable per-transition-class retry counters enforcing the `D-050`-locked ceilings, and fail-closed orphaned-lock recovery that never silently allows two writers to believe they each hold the same task.

It does not implement capability/tool/credential enforcement (S5); sandbox/worktree execution (S6); evidence artifact storage or QA execution (S7); orchestration/agent dispatch (S8); Evidence Gate acceptance/sufficiency logic (S9); CI/rulesets/protected-main enforcement (S10); telemetry/memory (S11); project overlays (S12); release/runtime verification machinery (S13); or the end-to-end production pilot (S14). `devos/state/`'s `executable_runtime_present` remains `false`: the kernel is a library any future caller (most plausibly a future S8 Orchestrator) would import and call directly; no active operational Sentinel runtime service, scheduler, or dispatcher currently invokes it. This is the same behavior-based `executable_runtime_present` test `ML-DEVOS-RFC-015` established and `ML-DEVOS-ADR-013` already applied to `devos/contracts/`.

### Accepted implementation-discovered corrections

Two corrections were discovered during implementation, reviewed, and accepted by `ML-DEVOS-AS-066` rather than silently folded into the design's history:

- **Transition idempotency binding.** `ML-DEVOS-RFC-016`'s design named `owner_generation`/fencing and `expected_revision`/optimistic-concurrency as related but separate concerns, and implied a replay-identity binding that could include a recomputed `from_state`. The accepted implementation instead binds replay identity to the caller's presented `expectedRevision`, together with `toState` and material reference hashes — recomputing `from_state` after a successful transition would make a true replay appear conflicting because persisted state has already advanced, whereas `expectedRevision` identifies the caller's intended source record version precisely. This is a correction the implementation discovered was necessary for correctness, not a design defect papered over.
- **Owner vs. revision diagnostics.** The implementation returns `NOT_CURRENT_OWNER` and `REVISION_CONFLICT` as two distinct failure codes rather than one combined diagnostic. This improves caller diagnosability without weakening fencing: either failure still rejects the mutation outright inside the same lock-held critical section.

### Documented, not silently reconciled, discrepancy

`ML-DEVOS-RFC-016`'s prose states that every mutating request presents a `revision`. The implemented `claim()` operation's explicit signature (`claim(task_id, actor_id, lease_duration, idempotency_key)`) does not accept one, because a fresh claim has no prior revision for the caller to present — the kernel instead checks internally that no current owner exists or the current lease has expired. This is recorded here as a wording/API discrepancy between the RFC's general statement and `claim()`'s necessarily different signature, not resolved by rewriting the RFC's already-closed text.

### Evidence classification

Per `ML-DEVOS-AS-066`: Builder's complete focused-suite execution (`state-lifecycle` 18/18, `state-kernel` 21/21, `state-concurrency` 2/2 across 5 repeated runs, `devos-manifest` spot check 22/22) remains `ACTOR_REPORTED` — it was not independently re-executed in full by the Architect, whose sandbox cannot clone this private repository (no outbound DNS/network access). The Architect's review of the changed source, tests, diff, and governance boundaries is `INDEPENDENTLY_INSPECTED`, and the highest-risk remediated invariants (missing-reference transitions failing closed, handoff-edge classification, path-safety rejection before path construction, scoped structural-corruption handling, lock diagnostic metadata completeness) received independent executable spot checks that passed. No `RUNTIME_OBSERVED` evidence exists or is claimed — S4 makes no production/runtime claim.

## Version consequence

This is a backwards-compatible new Sentinel governance capability — the first implemented typed, persistent task-lifecycle kernel (state vocabulary, transition table, ownership/lease/fencing model, idempotency/retry model, local persistence adapter). It does not change the actor model, the source-of-truth rule, or any existing `CORE-*` rule's meaning. Per `VERSIONING_POLICY.md`'s MINOR criterion and `ML-DEVOS-AS-067`'s version-disposition finding:

`v1.6.0 → v1.7.0`

`devos/devos-manifest.json`'s `sentinel_capability_baseline` names this ADR and `D-051` as this transition's baseline pointer. No `CORE-*` rule changes. The frozen S0 architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`, unchanged. `manifest_version` remains exactly `"1"`.

## Frozen-architecture amendment provenance

`D-050` explicitly adopted `FAILED` and `ABANDONED` as additive S4 lifecycle terminal states at implementation-authorization time, deferring their durable frozen-architecture reconciliation to this closure. `D-051` explicitly authorizes that reconciliation. This ADR's adoption is accompanied by a narrow, additive amendment to `ML-DEVOS-ARCH-001` §10 recording:

- `FAILED` as an unrecoverable terminal path from the bounded S4 failure states (an unrecoverable build/QA/review failure, or a retry ceiling breach per the `D-050`-locked Task Policy);
- `ABANDONED` as an explicit Architect/Paulo-authorized terminal cancellation path — never self-issued by a task's current Builder owner alone;
- both are terminal: no outgoing transition exists from either, or from `VERIFIED`; recovery from a failed or abandoned task means opening a new task whose Task Contract references the closed task's `task_id`, never mutating the closed record.

This amendment does not change `ML-DEVOS-ARCH-001`'s identity (`ML-DEVOS-ARCH-001`), version (`1.2.0`), status (`FROZEN`), actor model, or source-of-truth rule. It is an explicitly governed, cited addition to frozen content, per `CHANGE_GOVERNANCE_POLICY.md`'s rule that a genuine addition to frozen content proceeds through that content's own class and authority level — traceable to `ML-DEVOS-RFC-016 → ML-DEVOS-AS-065 → D-050 → ML-DEVOS-AS-066 → ML-DEVOS-AS-067 → D-051 → ML-DEVOS-ADR-014`.

## Explicitly not implemented

This ADR does not implement or authorize:

- S5 Capability & Permission Gateway, S6 isolation, S7 Evidence/QA Plane, S8 Orchestrator, S9 Evidence Gate, S10 CI/rulesets, S11–S14;
- any `CORE-*` rule change;
- product/runtime changes, remote resources, credentials, deployment, protected/main merge, or production writes;
- a Sentinel `manifest_version` semantic change (`manifest_version` remains exactly `"1"`).

`S5` remains wholly unauthorized. This ADR's adoption, `devos/state/`'s `IMPLEMENTED` status, and the `v1.7.0` transition are not, individually or together, S5 authority. The kernel accepts a bare `actor_id` string for `claim`/`transition` calls and performs no general actor permission check; it stores only opaque `evidence_ref` references without retrieving or judging their sufficiency; it never dispatches actors or decides when work should start; and `DEPLOYED`/`VERIFIED` remain descriptive kernel states with no actual deployment or runtime-check mechanism behind them.

## Supersession

Supersedes: none.

Fulfills, without redefining ownership of, the `devos/state/` reserved root established by **S2 — DevOS Repository Foundation** (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`).

Superseded by: none as of acceptance.

## Related RFC

`ML-DEVOS-RFC-016` — status updated to `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-014 / D-051` by this ADR's adoption; its proposal text is preserved unedited.

## Architect Sync

`ML-DEVOS-AS-065` (design stage gate, `ARCHITECT_APPROVED`), `ML-DEVOS-AS-066` (implementation stage gate, `ARCHITECT_APPROVED — IMPLEMENTATION ACCEPTED`), `ML-DEVOS-AS-067` (D.1 Pre-decision Closure Preflight, `PASS`).

## Paulo decision

`D-048` authorized the S4 proposal/audit step. `D-049` authorized one additional design micro-remediation. `D-050` authorized bounded implementation, locking the V1 Task Policy and orphan-lock recovery/force-clear boundary. `D-051` authorized this closure package and the `v1.7.0` adoption, exactly as preflighted by `ML-DEVOS-AS-067`.

## Implementation evidence

Final accepted implementation head `72cd84a8fedb581306c023ee88e1b0f1c4d5293c`, reviewed and given final implementation stage-gate approval by `ML-DEVOS-AS-066`. Evidence class: `INDEPENDENTLY_INSPECTED` for the changed source/diff/governance boundaries, with independent executable spot checks passing on the highest-risk remediated invariants; `ACTOR_REPORTED` for Builder's complete focused-suite execution counts, which the Architect's sandbox could not independently re-execute in full (no outbound network access to clone this private repository). No `RUNTIME_OBSERVED` evidence exists or is claimed.

## Effective version

`v1.7.0`. Frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`.

## Supersedes / superseded by

Supersedes: none. Superseded by: none as of acceptance.
