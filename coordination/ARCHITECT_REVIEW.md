# Architect Review

Status: `PATCH ORDER — READY FOR BUILDER`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# SENTINEL-BASELINE-CLEANUP-001 — Active-baseline metadata cleanup

## Classification

`PATCH` under `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`.

Reason: this cycle corrects stale or contradictory descriptive text only. It does not change any Sentinel rule, actor authority, trust boundary, architecture, capability, phase status, runtime behavior, project onboarding authority, or release/deployment authority.

Per the PATCH row:
- risk: low;
- no RFC required;
- no Architect Sync gate required;
- no new Paulo gate required;
- independent inspection is required before closure.

Paulo has additionally instructed: `proceed with cleanup order with sentinel`.

## Repository grounding inspected before this order

The Architect inspected the live governance branch and confirmed:

- `devos/devos-manifest.json` records `sentinel_capability_baseline.version = 1.5.0`, with `ML-DEVOS-ADR-006` / `D-028`;
- `devos/governance/rules/core-rules.json` correctly records `CORE-019`, `CORE-020`, and `CORE-021` as `ACTIVE` at effective version `1.5.0`;
- `devos/governance/specifications/VERSIONING_POLICY.md` correctly states the current Sentinel governance-capability baseline is `v1.5.0`;
- `projects/registry.json` is still empty;
- `devos/schemas/validate-project-registry.mjs` correctly treats registry emptiness as a standing pre-onboarding invariant, not an S2-only rule;
- the legacy Architect Sync archive remediation authorized by `D-019` is already reflected in the durable archive index and is not part of this cleanup.

## Findings

### SC001-F001 — HARD CONTRADICTION — manifest precedence text still says current baseline is v1.4.0

In `devos/devos-manifest.json`, `source_of_truth_precedence` still contains:

`Active Governance Kernel (Sentinel capability baseline, currently v1.4.0)`

This conflicts with the same manifest's active `sentinel_capability_baseline.version = 1.5.0` and with the active Versioning Policy.

**Required correction:** change only the stale current-version wording to `v1.5.0`.

### SC001-F002 — HARD CONTRADICTION — S2 section describes the manifest's current field as v1.4.0

In `devos/governance/specifications/VERSIONING_POLICY.md`, the S2 closure section says the manifest's `sentinel_capability_baseline` "now records" `1.4.0` / ADR-002 / D-017.

That was true at S2 closure, but it is no longer true after the accepted `v1.5.0` risk-escalation update.

**Required correction:** make this paragraph explicitly historical:
- at S2 closure, the field advanced to `v1.4.0`;
- it later advanced to `v1.5.0` under `D-028` / `ML-DEVOS-ADR-006`;
- `closure_history` preserves the S2 `v1.4.0` event.

Do not alter the historical S2 transition itself.

### SC001-F003 — STALE CURRENT-STATE WORDING — project registry documentation is still framed as "Current state — S2"

`projects/README.md` still labels the live current-state section `Current state — S2` and ends with "no such entry exists or is authorized as of S2."

The validator already contains the corrected standing rule: the registry remains empty **until a separately authorized PROJECT_ONBOARDING decision permits population**, independent of phase closure.

**Required correction:** preserve the historical S2 provenance but rewrite the live-state wording so it states:
- the registry is currently empty;
- no project is currently onboarded/registered;
- emptiness is the standing pre-onboarding invariant until a separately authorized onboarding decision;
- S2 established/reaffirmed the invariant but S2 closure is not the current-time qualifier.

### SC001-F004 — STALE CURRENT-STATE WORDING — manifest project-registry note anchors current emptiness to S2 closure

`devos/devos-manifest.json` currently says "No project has been onboarded as of S2 closure."

That historical statement is true but is stale as active manifest metadata.

**Required correction:** make the note current:
- no project is currently onboarded;
- registry remains empty under the standing pre-onboarding invariant;
- a future entry still requires the active `PROJECT_ONBOARDING` process and explicit Paulo authorization;
- preserve the statement that S2 closure itself granted no onboarding authority.

## Authorized Builder file scope

Substantive cleanup is limited to:

1. `devos/devos-manifest.json`
2. `devos/governance/specifications/VERSIONING_POLICY.md`
3. `projects/README.md`

Normal Builder coordination records may also be updated:

4. `coordination/IMPLEMENTER_HANDOFF.md`
5. `coordination/STATE.md`

No other file is authorized by this PATCH order.

## Explicit non-scope

Do **not** change:

- `devos/governance/rules/core-rules.json`;
- frozen architecture `ML-DEVOS-ARCH-001`;
- any historical Architect Sync archive;
- any historical Decision or ADR;
- S0/S1/S2 semantics;
- `v1.5.0` rule substance;
- project onboarding state or `projects/registry.json`;
- validators except to report an actual contradiction discovered during validation;
- application/runtime code;
- S3–S14 implementation;
- CI/workflows;
- GitHub rulesets/branch protection;
- remote D1/R2/Access resources;
- deployment;
- `main` merge.

No Sentinel version bump is authorized. This is a non-semantic PATCH correction to descriptive metadata, not a `v1.5.1` transition.

## Builder validation required

Before handoff, Builder must:

1. inspect the exact diff and confirm only the authorized files changed;
2. run:
   - `node devos/schemas/validate-devos-manifest.mjs`
   - `node devos/schemas/validate-project-registry.mjs`
3. confirm `sentinel_capability_baseline.version` remains exactly `1.5.0`;
4. confirm `projects/registry.json` remains exactly empty;
5. confirm no active/current statement still says the Sentinel baseline is `v1.4.0`;
6. preserve legitimate historical statements such as `v1.3.0 → v1.4.0` and `v1.4.0 → v1.5.0`;
7. report exact result SHA and literal validation results in `coordination/IMPLEMENTER_HANDOFF.md`.

## Closure route

Builder returns:

- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

The Architect will independently inspect the exact diff and validators before closing the PATCH.

## Architect order

`SENTINEL-BASELINE-CLEANUP-001: READY FOR BUILDER — PATCH SCOPE LOCKED`
