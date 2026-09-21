# ML-DEVOS-AS-057 — Durable Architect Sync Archive

Status: `CONCLUDED — CHANGES_REQUESTED / RFC-015 REMEDIATION CYCLE 1`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

## Concluding snapshot

```markdown
# Architect Review

Status: `CHANGES_REQUESTED — RFC-015 REMEDIATION CYCLE 1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Builder: Claude  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-057 — RFC-015 Reserved Subsystem Lifecycle Design Review

RFC:
- `ML-DEVOS-RFC-015`

Authority:
- `D-043`

Builder draft commit reviewed:
- `bfb6e5aa87ae52088a7d3891dc8fe9bcfe331eba`

## Scope

### AS57-F001 — PASS — proposal stayed inside D-043 scope

The Builder drafted RFC-015 and updated only normal handoff/state bookkeeping.

No manifest/schema/validator implementation, S3 closure, ADR creation, Sentinel version change, RFC-013 mutation, S4 proposal/implementation, core-rule mutation, product/runtime work, remote resource, deployment, or protected/main merge occurred.

## Direction accepted

The following architecture direction is sound and should be preserved:

- reserved-root lifecycle must evolve beyond the S2 bootstrap-only vocabulary;
- `FOUNDATION_ACTIVE` remains S2-specific;
- `IMPLEMENTED` is descriptive only and must not grant authority;
- repository-local validators/generators are not automatically equivalent to a live Sentinel runtime;
- Closure Preflight belongs inside the existing Stage Gate Review rather than becoming a new phase, Skill, agent, or subsystem;
- version/ADR/RFC/manifest/traceability reconciliation should happen at closure;
- known traceability debt must not be converted into a false zero-findings gate;
- S4 remains separately governed.

## Required remediation

### AS57-F002 — BLOCKER — `closure_ref` must identify a unique closure event, not merely a phase name

RFC-015 currently proposes:

`closure_ref == closure_history[].phase`

This is not sufficiently durable.

A phase name is a category, not a unique closure event. A phase can later receive a corrective/superseding closure record, re-closure, or other history while retaining the same phase label. Multiple `closure_history` entries with `phase: S3` would make the reference ambiguous.

The repository already has a unique durable identifier on every closure-history entry:

`adr`

ADR IDs are sequential and never reused.

#### Required correction

Prefer:

`closure_ref == closure_history[].adr`

For an `IMPLEMENTED` root, the validator must require:

1. non-null `closure_ref`;
2. exactly one matching closure-history entry by `adr`;
3. matched entry's `phase == root.owning_phase`;
4. matched entry has non-empty `decision`, `architect_sync`, and `version`;
5. matched ADR/Decision/Architect-Sync identifiers are structurally valid references under existing conventions.

For `NOT_IMPLEMENTED` and `FOUNDATION_ACTIVE`:
- `closure_ref` may be absent or null;
- it must never point at a closure record.

Do not require rewriting every existing reserved-root entry merely to add `closure_ref: null`; keep the schema evolution backwards-compatible.

This makes the linkage event-specific and fail-closed.

### AS57-F003 — BLOCKER — Closure Preflight traceability rule must distinguish three separate conditions

RFC-015 currently says Closure Preflight requires no new traceability ERROR caused by the closure's edits.

That is directionally correct but incomplete because Traceability V1 also maintains generated derived indexes and its validator separately detects drift.

The current generated indexes are already stale relative to recent governance IDs, so a closure process that only compares semantic ERROR counts can still publish stale derived evidence.

#### Required correction

Closure Preflight must distinguish:

1. **Derived-output currency**
   - regenerate `traceability-index.json` and `TRACEABILITY_INDEX.md` as authorized closure bookkeeping;
   - candidate closure must have no generated-output drift.

2. **Known baseline findings**
   - record the exact pre-closure traceability ERROR fingerprint/set from a named base SHA;
   - pre-existing known errors remain visible and do not become falsely "resolved."

3. **New closure-induced findings**
   - candidate closure must introduce no new unexpected ERROR relative to that base set.

Do not require zero total ERRORs.

The procedure may remain manual/repository-local in V0.1; no new traceability subsystem or CI gate is required.

### AS57-F004 — BLOCKER — version/ADR sequencing is internally inconsistent

RFC-015 correctly classifies itself as `ARCHITECTURE`.

Its Version Impact section then says the implementation is "most likely MINOR" because it adds:
- a new lifecycle state;
- fail-closed manifest semantics;
- a new closure-preflight governance capability.

But rollout step 5 still assumes AS-056's older S3 closure package:

`S3: v1.5.0 → v1.6.0`

Those two positions cannot both remain unresolved.

If RFC-015 implementation itself is a MINOR Sentinel governance-capability change, then after its own closure the active baseline would already be `v1.6.0`; a later independently versioned S3 MINOR closure would then be `v1.7.0`.

Alternatively, Paulo could explicitly approve bundling RFC-015's implemented lifecycle capability and S3's adoption into one `v1.6.0` release boundary — but that must be stated deliberately, with separate ADR provenance for each accepted architecture change if both require ADRs. It cannot be left implicit.

#### Required correction

RFC-015 must propose one coherent sequencing model and explain it.

Architect preference for lowest drift / clearest provenance:

- Skills/Treasury closure ADR first: explicit no-bump at `v1.5.0`;
- RFC-015 implementation receives its own post-implementation ADR and explicit version disposition;
- S3 closure version is calculated from the then-current baseline, not hard-coded from AS-056;
- AS-056's proposed ADR/version numbers are treated as provisional and recomputed at the final closure gate.

Do **not** assign final ADR numbers in RFC-015 unless the live ADR directory is checked at the time the ADR is actually written.

The RFC may recommend whether RFC-015 implementation itself is MINOR or explicit no-bump, but it must support that choice against `VERSIONING_POLICY.md`; silence is not allowed.

### AS57-F005 — BLOCKER — runtime distinction should be semantic, not based on whether invocation is automatic

The proposed `executable_runtime_present` clarification says repository tooling remains non-runtime partly because it is "not wired to any automatic trigger."

That criterion is too brittle.

A deterministic validator could later run automatically in CI and still be a validation tool rather than a stateful Sentinel Task Engine/Orchestrator/runtime subsystem. Conversely, a manually invoked state-mutating engine could still be runtime behavior.

#### Required correction

Define the distinction by behavior/responsibility, not trigger mechanism.

A better rule:

`executable_runtime_present: false`
means the root contains no active Sentinel operational subsystem that:
- owns/persists operational state;
- executes lifecycle/state transitions;
- dispatches or orchestrates actors;
- brokers/enforces capabilities;
- performs autonomous or consequence-bearing operational actions.

Repository-local schemas, validators, generators, and tests may be executable code and may be manually or automatically invoked without, by that fact alone, becoming a Sentinel runtime subsystem.

Keep S3 `false`.

Do not rename the field in this RFC unless a separate migration need is demonstrated.

## Non-blocking observations

### AS57-O001 — proposal is appropriately small

No new closure registry, Skill, phase, agent, or database is proposed.

Preserve that.

### AS57-O002 — manifest_version should remain untouched

No current repository rule gives `manifest_version` semantic bump behavior.

RFC-015 is correct not to invent it.

### AS57-O003 — closure preflight should stay objective where possible

The checklist should test:
- currentness;
- presence/consistency;
- provenance;
- explicit version disposition;
- traceability delta.

Judgment calls remain Architect/Paulo responsibilities.

Do not turn Closure Preflight into a scoring framework.

## Authorized remediation cycle 1

Claude may modify only:

- `devos/changes/rfcs/ML-DEVOS-RFC-015.md`;
- `devos/changes/rfcs/README.md` only if its summary needs correction;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No implementation files are authorized.

## Preserve

Do not reopen:
- need for post-bootstrap reserved-root lifecycle;
- `IMPLEMENTED` as the proposed descriptive state;
- S2-only `FOUNDATION_ACTIVE`;
- Closure Preflight inside Stage Gate Review;
- anti-bloat direction;
- S3 technical approval from AS-055;
- S4 hard gate.

## Return gate

After remediation:
- `TURN: ARCHITECT`;
- `STATUS: READY_FOR_ARCHITECT`;
- `ARCHITECT_ACTION_REQUIRED: YES`;
- `IMPLEMENTER_ACTION_REQUIRED: NO`;
- `CURRENT_REMEDIATION_CYCLE: 1`.

## Verdict

`ML-DEVOS-AS-057: CHANGES_REQUESTED — RFC-015 REMEDIATION CYCLE 1`

```
