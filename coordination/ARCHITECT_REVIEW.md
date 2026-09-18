# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-006 — S2 Repository Foundation RFC Review

Cycle: `SENTINEL-S2-REPOSITORY-FOUNDATION-PROPOSAL`
Review mode: `ARCHITECTURE SYNC / PRE-APPROVAL REVIEW`
Reviewed RFC commit: `410d1de1ebfd33eff2d1d5b33fb7baf7140d693a`
RFC: `ML-DEVOS-RFC-001`
Target baseline: Sentinel governance-capability baseline `v1.3.0`

## Overall assessment

The S2 direction is compatible with the frozen S0 architecture and active S1 Governance Kernel: static repository foundation, empty project registry, reserved later-phase roots, no project onboarding, no website migration, and no runtime subsystem implementation are the correct boundaries.

Before Paulo implementation approval, several synchronization ambiguities should be removed so the foundation cannot become a second source of truth or accidentally imply later-phase implementation.

## Findings

### S2-F001 — REQUIRED — separate architecture baseline from active capability baseline

The proposed manifest currently says it will record a single "Sentinel baseline/version identity." That is ambiguous because Sentinel now has:

- frozen architecture baseline `ML-DEVOS-ARCH-001 / v1.2.0`;
- active governance-capability baseline `v1.3.0`.

**Required correction:** the manifest must represent these separately. It must never imply that the frozen S0 architecture document was rewritten to v1.3.0.

### S2-F002 — REQUIRED — define source-of-truth precedence explicitly

The manifest must be descriptive metadata, not a competing authority source.

**Required correction:** define precedence explicitly:

`Frozen Architecture + Active Governance Kernel + Decisions/ADRs/Durable Architect Syncs > DevOS manifest > project registry index`.

The manifest may summarize or reference higher-authority records, never redefine them.

### S2-F003 — REQUIRED — project registry must be an index, not project state/memory

The RFC correctly keeps the registry empty in S2, but its future role is not precise enough.

**Required correction:** specify that `projects/registry.json` indexes governed projects and points to the authoritative project repository/overlay. It must not duplicate or become authoritative for project requirements, risks, capabilities, task state, evidence, or local governance.

Future entry invariants must include unique `project_id`, repository/overlay locator, onboarding decision reference, and no `ACTIVE` entry without onboarding authorization.

### S2-F004 — REQUIRED — validator requirement is internally inconsistent

The RFC says S2 **may** add validators, but the acceptance criteria require that the manifest and registry "validate against their declared schema."

**Required correction:** choose one model. Architect recommendation: make deterministic static validation of both S2 JSON artifacts mandatory for S2 closure. Validation remains static only and does not become runtime enforcement.

For S2 specifically, the registry validator must also prove the registry is empty at closure.

### S2-F005 — REQUIRED — distinguish subsystem ownership from consumption

The reserved-root map assigns `devos/evidence/` to `S7/S9`. Multiple "owners" are ambiguous.

**Required correction:** each reserved root needs one canonical owning phase plus optional consuming phases. Example:

- `evidence/` owner: S7; consumer: S9;
- `contracts/` owner: S3;
- `state/` owner: S4;
- `capabilities/` owner: S5;
- `orchestration/` owner: S8;
- `memory/` owner: S11.

This avoids later phases believing they may redefine the same root.

### S2-F006 — REQUIRED — synchronize top-level projects/ semantics with frozen topology

The frozen topology describes top-level `projects/` as registry/metadata/overlay material, not product-source relocation.

**Required correction:** explicitly define:

- `projects/registry.json` = canonical Sentinel project index;
- future `projects/<project>/` content, if ever introduced, is metadata/overlay material only unless a separately authorized migration says otherwise;
- independent product repositories remain first-class and are not mirrored into this monorepo by S2.

### S2-F007 — REQUIRED — acceptance criteria should verify "placeholder ≠ implementation"

The RFC states this principle in prose but it should be testable at the stage gate.

**Required correction:** add acceptance evidence that every reserved root is marked `NOT IMPLEMENTED`, no executable later-phase code exists in those roots, and the manifest records `executable_runtime_present: false` (or equivalent).

### S2-F008 — PASS — non-destructive website boundary

The RFC correctly prohibits website migration, source moves, product onboarding, `.devos/` overlay creation, deployment, protected/main merge, and S3+ implementation.

Preserve this exactly.

### S2-F009 — PASS — proposed version class

`v1.3.0 → v1.4.0 MINOR` is a reasonable proposed version class if S2 is eventually implemented and accepted.

It remains proposal-only until final closure.

## Verdict

`ML-DEVOS-AS-006: CHANGES_REQUESTED — RFC REFINEMENT REQUIRED BEFORE PAULO IMPLEMENTATION APPROVAL`

S2 implementation is **not approved**.

The RFC may be refined within the already-authorized Architect proposal scope. No Builder implementation work is authorized.

## Required RFC synchronization edits

Before returning to Paulo, update `ML-DEVOS-RFC-001` to:

1. separate architecture v1.2.0 from active capability baseline v1.3.0;
2. define source-of-truth precedence;
3. define the project registry as an index only;
4. make static manifest/registry validation mandatory for S2 closure;
5. make registry emptiness an S2 closure invariant;
6. give each reserved root one owner phase and optional consumer phases;
7. clarify top-level `projects/` semantics;
8. add explicit placeholder-vs-implementation acceptance checks.

After those edits, Architect should perform a short re-review and only then route the S2 implementation decision to Paulo.
