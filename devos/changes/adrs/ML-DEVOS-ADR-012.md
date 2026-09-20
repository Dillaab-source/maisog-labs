# ADR-012: Adopt Reserved Subsystem Lifecycle and Closure Reconciliation (RFC-015)

Status: `ACCEPTED`

Related RFC:
- `ML-DEVOS-RFC-015`

Architect Syncs:
- `ML-DEVOS-AS-057` — remediation cycle 1 (event-specific ADR-keyed `closure_ref`, traceability generated-output-currency/baseline/new-error separation, coherent version/ADR sequencing, behavior-based runtime distinction)
- `ML-DEVOS-AS-058` — remediation cycle 2 (pre/post-decision Closure Preflight split)
- `ML-DEVOS-AS-059` — `ARCHITECT_APPROVED — RFC-015 DESIGN ACCEPTED`
- `ML-DEVOS-AS-060` — `ARCHITECT_APPROVED — RFC-015 IMPLEMENTATION ACCEPTED`
- `ML-DEVOS-AS-061` — D.1 Pre-decision Closure Preflight, `PASS`, over this coordinated closure

Paulo decisions:
- `D-043` — proposal/review cycle authorization
- `D-044` — design acceptance
- `D-045` — bounded implementation authorization
- `D-046` — coordinated closure authorization (this ADR's creation)

Implementation evidence:
- implementation head: `745d890d8d0c293141a34488540c2964c55a874d`

Effective version:
- Sentinel governance-capability baseline: `v1.6.0` (co-effective with `ML-DEVOS-ADR-013`'s S3 adoption under one coordinated release boundary; see "Version consequence" below)
- frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`

## Decision

Sentinel adopts the reserved-subsystem lifecycle and closure-reconciliation mechanism proposed by `ML-DEVOS-RFC-015`:

1. a third `reserved_subsystem_roots[].status` value, `IMPLEMENTED`, alongside the S2-bootstrap-only `NOT_IMPLEMENTED`/`FOUNDATION_ACTIVE` vocabulary — descriptive only, granting no authority (`CORE-001`, `CORE-002`);
2. a fail-closed `closure_ref` field: for `IMPLEMENTED`, a non-null `ML-DEVOS-ADR-NNN` reference that must resolve, uniquely by `adr` (never by the reusable `phase` label), to exactly one `closure_history` entry whose `phase` matches the root's own `owning_phase` and whose `decision`/`architect_sync`/`version` are all structurally valid; absent/null for `NOT_IMPLEMENTED`/`FOUNDATION_ACTIVE`;
3. `S2`-only `FOUNDATION_ACTIVE`, now enforced by path as well as by count;
4. behavior-based `executable_runtime_present` semantics: `false` means no active Sentinel operational subsystem owns/persists state, executes lifecycle/state transitions, dispatches/orchestrates actors, brokers/enforces capabilities, or performs autonomous/consequence-bearing action — never determined by whether a repository-local schema/validator/generator happens to be invoked manually or automatically (including from CI);
5. the D.1 Pre-decision Closure Preflight and D.2 Post-decision Closure Verification checklists, added to the existing Stage Gate Review mode in `brain/protocols/ARCHITECT_SYNC.md` — two moments of one gate, introducing no new phase, Skill, agent, database, or record type.

## Context

Before this cycle, Sentinel's reserved-root lifecycle vocabulary could represent only "not yet implemented" and the one S2-owned foundation state — there was no way to represent, or to fail-closed verify, that a reserved root's owning phase had actually closed. This gap surfaced concretely when S3 Typed Task Contracts reached technical stage-gate approval (`ML-DEVOS-AS-055`) and its proposed closure package could not be expressed in the existing schema. A follow-up discrepancy review (`ML-DEVOS-AS-056`) found this alongside related provenance drift (a stale RFC status banner, a misattributed authorization citation, missing closure ADR/version disposition, a stale rolling-handoff header) — all instances of one underlying gap in how Sentinel represents and verifies phase closure.

`ML-DEVOS-RFC-015` proposed the fix. Design review required two remediation cycles (`AS-057`: correcting the proposed `closure_ref` to match a unique closure event by `adr` rather than the reusable `phase` label, splitting the traceability check into generated-output currency / named-baseline / new-error conditions, resolving an internally inconsistent version/ADR sequencing model, and replacing an invocation-based `executable_runtime_present` distinction with a behavior-based one; `AS-058`: splitting a single closure-checklist concept into explicit pre-decision and post-decision moments once the review found some checklist items demanded facts that could not exist before Paulo's decision) before `ML-DEVOS-AS-059` approved the final design. `D-044` accepted it; `D-045` authorized bounded implementation (schema, validator, focused tests, `ARCHITECT_SYNC.md` procedure text only — no live manifest mutation); `ML-DEVOS-AS-060` accepted that implementation. `ML-DEVOS-AS-061` then ran the newly implemented D.1 checklist over the proposed coordinated closure itself — the first real use of the mechanism this ADR adopts — and passed it, after which `D-046` authorized this coordinated closure.

## Alternatives considered

See `ML-DEVOS-RFC-015`'s own "Alternatives considered": a hand-edited status outside the schema's enum (rejected — reintroduces the exact unvalidated drift the manifest exists to prevent); a separate "Phase Closure Registry" distinct from the manifest (rejected — duplicates structures the manifest already owns); a new "Closure Review" phase/Skill (rejected, per `D-043`'s explicit anti-bloat direction); requiring the traceability validator to reach zero findings before any closure (rejected — would either stall closures on unrelated pre-existing debt or pressure silent suppression of known findings).

## Rationale

Reusing the manifest's existing `reserved_subsystem_roots`/`closure_history` structures, and matching `closure_ref` by the already-unique, never-reused `adr` identifier rather than the reusable `phase` label, closes the exact gap `ML-DEVOS-AS-056` found without inventing a second closure-tracking mechanism. Splitting Closure Preflight into pre-decision and post-decision moments of the same Stage Gate Review — rather than either a single checklist demanding not-yet-existing facts, or two new review types — keeps the mechanism proportionate to what it replaces (a discrepancy review that cost a full extra cycle) without adding governance surface area.

## Consequences

This adoption makes every future phase closure (S4 through S14, and any other `ARCHITECTURE`-class reserved root) representable and fail-closed-verifiable in the manifest, and gives the Architect a standing pre-decision/post-decision checklist that would have caught `ML-DEVOS-AS-056`'s exact findings before they required a dedicated review cycle. It makes it harder to close a phase without a genuine ADR/Decision/Architect-Sync chain, since a bare status edit is now schema-invalid.

It does not, by itself, make any future closure easier to *approve* — Paulo's decision remains required for every closure, and `IMPLEMENTED` status never confers standing authority for its owning phase to act further. This ADR's own adoption is the first exercise of the mechanism it defines (this coordinated closure's own D.1 preflight, `ML-DEVOS-AS-061`); its D.2 Post-decision Closure Verification step is exercised separately, after this closure lands.

## Version consequence

This is a backwards-compatible new governance capability — an additive schema enum value, an additive optional field, and an additive procedural checklist, none of which changes any existing rule's meaning or any actor's existing authority. Per `VERSIONING_POLICY.md`'s MINOR criterion, and per this RFC's own "Version impact" analysis (`AS57-F004`'s corrected sequencing model), this is assessed as `MINOR`.

Per `D-046`'s explicit single-release/multiple-ADR rule, this `MINOR` capability is **deliberately co-released** with S3 Typed Task Contracts (`ML-DEVOS-ADR-013`) under one coordinated Sentinel release boundary:

`v1.5.0 → v1.6.0`

Both ADRs are independently effective at `v1.6.0`; `devos/devos-manifest.json`'s single `sentinel_capability_baseline.adr` pointer names the ordered, release-closing S3 ADR (`ML-DEVOS-ADR-013`) as the baseline record, while this ADR remains separately, durably recorded in `closure_history` as co-effective at the same version — `one release != one ADR`, per `D-046`.

The frozen S0 architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`, unchanged.

## Explicitly not implemented

This ADR does not implement or authorize:

- S3 Typed Task Contracts' own adoption (recorded separately in `ML-DEVOS-ADR-013`, though co-released at the same version boundary);
- a Sentinel `manifest_version` semantic change (`manifest_version` remains exactly `"1"`, untouched);
- S4 State Machine Kernel, S5 Capability Gateway, S6 isolation, S7 Evidence/QA Plane, S8 Orchestrator, S9 Evidence Gate, S10 CI/rulesets, S11–S14;
- any `CORE-*` rule change;
- product/runtime changes, remote resources, credentials, deployment, or protected/main merge.

## Supersession

Supersedes: none.

Extends `ML-DEVOS-RFC-001`'s manifest design and `reserved_root_invariant` (unchanged, not superseded) and the existing Architect Sync procedure (`ML-DEVOS-AS-003`).

Superseded by: none as of acceptance.

## Related RFC

`ML-DEVOS-RFC-015` — status updated to `IMPLEMENTED AND CLOSED` by this ADR's adoption; its proposal text is preserved unedited.

## Architect Sync

`ML-DEVOS-AS-057`, `ML-DEVOS-AS-058` (remediation cycles), `ML-DEVOS-AS-059` (design acceptance), `ML-DEVOS-AS-060` (implementation acceptance), `ML-DEVOS-AS-061` (this coordinated closure's own D.1 preflight, `PASS`).

## Paulo decision

`D-043`/`D-044`/`D-045` authorized the proposal, design, and implementation stages respectively. `D-046` authorized this coordinated closure, including this ADR's creation.

## Implementation evidence

Implementation head `745d890d8d0c293141a34488540c2964c55a874d`, reviewed and accepted by `ML-DEVOS-AS-060`. Evidence class: `INDEPENDENTLY_INSPECTED` for the schema/validator/procedure diff the Architect reviewed directly; `ACTOR_REPORTED` for Builder-run test counts (`tests/devos-manifest.test.mjs`, 22/22) not independently re-executed by the Architect.

## Effective version

`v1.6.0`, co-effective with `ML-DEVOS-ADR-013` under one coordinated release boundary. Frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0`.

## Supersedes / superseded by

Supersedes: none. Superseded by: none as of acceptance.
