# Current Handoff — S6 Isolated Execution Proposal (RFC-019, D-066)

```yaml
schema_version: 1
handoff_id: H-S6-RFC019-0001
cycle_id: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
input_base_commit: 2691812326f6c3cf2cdbdfd2129bf823f465e864
review_target_commit: 2691812326f6c3cf2cdbdfd2129bf823f465e864
applicable_review_id: ML-DEVOS-AS-085
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this proposal. RFC-019 is `DRAFT` until the Architect reviews it and Paulo decides.

## Objective

Deliver the design-only S6 proposal authorized by `D-066` (scope `SENTINEL_S6_ISOLATED_EXECUTION_PROPOSAL_ONLY`): `ML-DEVOS-RFC-019 — Sentinel S6 Isolated Execution`, an `ARCHITECTURE`-class RFC, plus its RFC index entry. Nothing executable is created.

Provenance of this turn: the proposal was bootstrapped fresh in this session from the authoritative tip `2691812`, which carried STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED` / `IMPLEMENTER_ACTION_REQUIRED: YES`. Reads followed LEAN / DELTA-ONLY:
- STATE; D-066; the SIP-001 S6 row and roadmap rules; CONTEXT_BOOTSTRAP;
- TRUST_BOUNDARIES; CHANGE_GOVERNANCE_POLICY; the RFC template; OPERATIVE_OBLIGATIONS;
- the manifest's reserved-root entries and schema shape;
- the public S3 contract fields, the S4 kernel's public operations (claim/renew/release/transition/getState, revision fencing, `evidenceRef`), and the S5 decision fields and denial vocabulary.

No broader history was needed.

## Changed files

Diff against base `2691812326f6c3cf2cdbdfd2129bf823f465e864`, all within the D-066 authorized proposal surfaces:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md` (new) — the S6 proposal.
- `devos/changes/rfcs/README.md` — adds the RFC-019 entry.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated, because the new RFC is a canonical definition.
- `coordination/STATE.md` — the return gate. `coordination/CURRENT_HANDOFF.md` — this file.

The outgoing handoff `H-S5-CLOSURE-0001` was already archived byte-identical by the Architect in `2840162`, so no archive write was needed.

Not changed (verified empty against the base):
- `devos/devos-manifest.json`, `devos/schemas/`;
- `devos/contracts/` (S3), `devos/state/` (S4), `devos/capabilities/` (S5);
- `devos/changes/adrs/`, `brain/`, `tests/`, `scripts/`;
- every product, runtime and deploy surface.

No `devos/execution/` or `devos/isolation/` path exists. The Sentinel baseline stays v1.8.0.

## RFC-019 summary

- **Isolation levels.** Four are named separately: L1 Git branch, L2 Git working tree, L3 filesystem/process/environment, L4 OS/container/VM sandbox.
  - V1 = L1 + L2, using a dedicated clone per execution instance (linked worktrees are rejected because they share refs, hooks and config), plus L3.
  - V1 explicitly does not contain a deliberately hostile same-user process, and must not be called a sandbox.
- **Identity.** An immutable Execution Identity binds: project, repository, task_id, contract_ref and contract digest, role, S4 owner and revision (the fencing token), base SHA, the deterministic task branch, a host-generated instance_id, the canonical workspace path, the platform profile, and the consumed S5 decisions. It is re-derived and compared at every step.
- **Freshness.** The base SHA is resolved once and pinned. If the base has advanced at publication, the result is `BASE_ADVANCED`: fail closed, with no automatic rebase or merge.
- **Dirty trees.** Clean-tree proof is required at create, attach and complete. Committed-diff paths are checked against the S3 contract scope by reference. S6 never cleans a tree into compliance; a failing tree is quarantined.
- **Composition.**
  - S3: scope is consumed by reference.
  - S4: S6 has no task state machine. Publication is linearized at S4 `transition` with `expectedRevision`, so a stale instance can never get a result recorded; a Git push alone is not publication.
  - S5: decisions are consumed through the public adapters only. `ALLOW` is never sufficient; `DENY` blocks.
  - MAY, CAN and ISOLATED are three separate conditions, and all must hold.
  - The RFC discloses that implementing S6 means runtime use of S5, which needs explicit authorization.
- **QA (TB-4).** QA reconstructs a fresh instance, as a different actor, from the S4-recorded result commit fetched from the remote. It verifies the tree hash and installs dependencies independently. It never uses the Builder's tree, caches or files.
- **Boundaries.** Path confinement uses canonical real paths, segment-wise prefix comparison and no-follow deletion; Windows junction, alternate-data-stream, device-name and short-name cases are covered; TOCTOU is disclosed. The environment is built from an allowlist with a deny-set backstop. Credentials are never copied: all remote operations run host-side. Caches are private by default, with an optional integrity-verified read-only shared cache.
- **Lifecycle and recovery.** The lifecycle runs create/validate/attach/use/renew/quiesce/complete/cleanup, plus QUARANTINED. Environment retries (at most 2) never touch S4 retry counts. Orphans are quarantined, never adopted. Stale registry locks fail closed.
- **Portability.** POSIX and Windows profiles are specified.
- **Reason model.** 28 ordered, deterministic fail-closed reason codes cover every required case.
- **Provenance and tests.** Provenance is classified `ACTOR_REPORTED` and carries a fixed non-authority disclaimer. The failure-injection and mutation test plan runs on a real-Git, real-process, platform matrix.
- **Canonical home.** The RFC recommends `devos/execution/`, and rejects `devos/isolation/`, a sandbox root, S8's root, and absorption into S3/S4/S5.
  - The future manifest root entry needs no schema or validator change.
  - Adding the root is `ARCHITECTURE`-class and needs separate authorization.
  - No frozen-architecture amendment is expected.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session (Linux; Node v22.22.2; git 2.43.0).

- **Traceability, base `2691812`, fresh validation:** 335 files / **3** errors / 14 warnings / 295 definitions, `DRIFT`. The third error is `missing-canonical-target ML-DEVOS-RFC-019`: D-066 and STATE forward-reference the allocated RFC. The committed index at the base recorded 332 files / 2 errors / 14 warnings / 293 definitions.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 336 files / **2** errors (`CORE-022`, `WEB-REQ-009` — the known debt, preserved and not suppressed) / 14 warnings / 296 definitions, `No drift`, exit `1` (the convention while any ERROR exists). The warning set is line-identical to the base. The RFC-019 forward reference was resolved by filing the RFC. RFC-019 deliberately cites no future ADR, AS or Decision ID.
- **Full suite:** `npm test` → 606 tests, 606 pass, 0 fail, exit `0`.
- **Validators:**
  - `validate-devos-manifest.mjs` → `PASS: 0 error(s)`, exit `0`;
  - `validate-capability-policy.mjs` → exit `0`;
  - `validate-task-contract.mjs` → exit `0`;
  - `validate-rules.mjs` → exit `0`;
  - `validate-waivers.mjs` → exit `0`;
  - `validate-claude-skills-bridge.mjs` → 4/4 OK.
- **`git diff --check`:** clean, exit `0`.
- **No executable S6 in the diff:** the diff contains only Markdown and the regenerated traceability outputs. No `.mjs`/`.js`/`.json` schema, no new directory, and no manifest change.

## Unresolved findings and limitations

- **RFC-019 residual risks** (disclosed in the RFC): a same-user process is not contained at L3; third-party install and test code runs with host privileges; there is no network-egress control; the filesystem TOCTOU window is narrowed but not eliminated; the journal is tamper-evident, not tamper-proof; actor independence is not reasoning independence; orphaned remote branches accumulate; the S6 host itself is trusted.
- **RFC-019 open questions** for the Architect:
  - Q1: a base-SHA pin in S3;
  - Q2: admitting contracts with `remote_resources_involved`;
  - Q3: future linked-worktree hardening;
  - Q4: registry egress governance;
  - Q5: a dedicated-OS-user profile;
  - Q6: where provenance durably lives before S7.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged. That includes `OBL-010`, `OBL-011`, `OBL-012` and `OBL-015` (the `CORE-022`/`WEB-REQ-009` debt), plus the other OPEN and DEFERRED rows. This turn changes no inventory row.

## Governing references

- Authority: `D-066`.
- Last review: `ML-DEVOS-AS-085` (S5 D.2 PASS).
- Roadmap: `ML-DEVOS-SIP-001` S6 row.
- Composes with: `ML-DEVOS-RFC-013` / `ML-DEVOS-ADR-013` (S3), `ML-DEVOS-RFC-016` / `ML-DEVOS-ADR-014` (S4), `ML-DEVOS-RFC-017` / `ML-DEVOS-ADR-015` (S5).
- Protocol: `ML-DEVOS-RFC-018` (Context Bootstrap V0); closure lifecycle `ML-DEVOS-RFC-015`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `2691812326f6c3cf2cdbdfd2129bf823f465e864`.
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`; `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect performs an independent architecture review of `ML-DEVOS-RFC-019` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-085`, and archives `H-S6-RFC019-0001` if its routing deselects this handoff.

Design acceptance and any implementation authorization remain separate Paulo decisions. No S6 implementation, root reservation, manifest change or S5 runtime use is authorized. No further Builder action is authorized.
