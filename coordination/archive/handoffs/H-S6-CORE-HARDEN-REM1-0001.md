# Current Handoff — AS102-F001 Expiry-Journal Remediation (D-074, AS-102)

```yaml
schema_version: 1
handoff_id: H-S6-CORE-HARDEN-REM1-0001
cycle_id: SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION
input_base_commit: 37a4ff9140680b98d84e438604a0d69e89dabccf
review_target_commit: 37a4ff9140680b98d84e438604a0d69e89dabccf
applicable_review_id: ML-DEVOS-AS-102
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. All results are `ACTOR_REPORTED`. It is remediation cycle 1 of 2.

## Objective

Correct only `AS102-F001`, under scope `D074_AS102_F001_S6_EXPIRY_JOURNAL_REMEDIATION_ONLY`. Lazy expiry committed `ISSUED -> EXPIRED_UNCLAIMED` with no justifying journal entry, violating RFC-019 §13.6 I5 and disagreeing with the reference model's explicit `expire` transition.

Provenance:
- Starting SHA: `37a4ff9140680b98d84e438604a0d69e89dabccf`. That is the `ML-DEVOS-AS-102` publication, parented on the reviewed implementation `f725207`.
- The ending SHA is the commit that publishes this handoff. Its sole parent is the starting SHA.
- Fresh Context Bootstrap from `37a4ff9` before any change.
- The suspended `D-068` local draft was not touched, staged, committed or imported.

## The correction

`persistExpiries` in `devos/execution/host.mjs` runs inside the one transaction wrapper. For every `ISSUED` permit whose claim deadline has passed, it now:
- moves the permit to `EXPIRED_UNCLAIMED` (terminal, as before);
- appends a `PERMIT_EXPIRED` entry to the owning instance's journal in the **same draft, hence the same task-store commit**. The entry carries `permit_id`, `permit_digest`, `reason: "CLAIM_DEADLINE_PASSED"` and the deterministic `claim_deadline`.

Several permits expiring in one transaction each get their own entry. Nothing else changed:
- lazy-expiry semantics are unchanged;
- `CLAIMED` permits never expire;
- claim execution-uncertainty reservations are untouched;
- no separate expiry file exists;
- no other behaviour changed.

## Required focused evidence

| AS-102 item | Test | Result |
|---|---|---|
| **E1** expired attempted claim | `tests/execution-expiry.test.mjs` "E1": the claim fails closed (`ISOLATION_UNPROVABLE`), exactly one commit (`version + 1`), permit `EXPIRED_UNCLAIMED`, exactly one `PERMIT_EXPIRED` entry for that permit with the exact fields, the journal replays from genesis (head verifies), and a later transaction writes no second event | pass |
| E1 (several permits) | "E1b": two permits expiring in one transaction each get their own entry in that transaction | pass |
| **E2** model/runtime correspondence | "E2": the model's `issue -> expire` commits `EXPIRED_UNCLAIMED` with an `EXPIRE` record in the same version; the runtime commits `EXPIRED_UNCLAIMED` with its `PERMIT_EXPIRED` entry; the model is unchanged | pass |
| **E3** no effect on `CLAIMED` | "E3": past the deadline, after later transactions, a `CLAIMED` permit stays `CLAIMED`, its reservation stays `OPEN`, and no expiry event is written for it | pass |
| **E4** falsification | `tests/execution-mutation.test.mjs` new mutant **M49-expiry-without-journal-evidence** (removes only the `PERMIT_EXPIRED` write) is killed by E1 with a failing assertion | killed |

`M03-claimed-permit-expires` was re-anchored to the rewritten expiry loop. It protects the same property, and it is still killed.

## Changed files

Diff against `37a4ff9140680b98d84e438604a0d69e89dabccf`:
- `devos/execution/host.mjs`: `persistExpiries` only.
- `tests/execution-expiry.test.mjs`: new, E1/E1b/E2/E3.
- `tests/execution-mutation.test.mjs`: M49 added; M03 re-anchored.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`: regenerated. The base carried `DRIFT` from the AS-102 transition.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-CORE-HARDEN-0001` bytes were already archived by the AS-102 transition.

Not changed: the S6 README (no factual statement needed updating), RFC-019, the manifest, and any S3/S4/S5/S7+ file.

## Tests and evidence

| Check | Result | Exit |
|---|---|---|
| Focused expiry tests (`execution-expiry`) | 4/4 | 0 |
| S6 suites | store 21/21, model 16/16, slot 10/10, crash-matrix 8/8, expiry 4/4, core 26/26, permits 20/20, lifecycle 43/43, linearization 17/17, publication 10/10, recovery 20/20 — every suite exit 0 | 0 |
| Mutation suite (anchor check + control + 49 mutants) | 51/51: anchor check and control pass; all 49 mutants (M01–M49) killed by a failing assertion | 0 |
| `npm test` (whole repository) | 852 tests, 852 pass, 0 fail | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | all example files as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | all bridges OK | 0 |
| `git diff --check` | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | base `37a4ff9`: 2 errors, 14 warnings, `DRIFT`; after: 428 files, **2** errors (`CORE-022`, `WEB-REQ-009`, known debt), **14** warnings, `No drift`; ERROR/WARNING set identical to the base | 1 |

Platform: Linux x86_64, ext4, Node v22.22.2. darwin and win32 are **NOT RUN**, unchanged.

## Carry-forward, not changed

- **O1 (platform):** unchanged. Linux is the only task-store platform with atomicity evidence; darwin and win32 remain `NOT RUN` and refused; `STORE_PROVEN_PLATFORMS` is untouched. No macOS/Windows conformance is claimed.
- **O2 (unattributable `PENDING`):** unchanged. The task-wide fail-closed block stands; no operator-recovery semantics were invented.
- **Real execution driver / generic executor:** none introduced. The only process S6 core starts is still the fixed internal `git` runner, and the core source-level test is unchanged and passing.

## Unresolved findings and limitations

- **Carry-forward items:** O1 and O2 as above; both are S6 integrated-stage/closure concerns.
- **Disclosed D-074 limitations remain as stated in the archived `H-S6-CORE-HARDEN-0001`:**
  - process-crash durability only;
  - no measured envelope size bound;
  - operator resolution is attestation;
  - L3 same-user risks;
  - bounded model.
- **Carried forward:** every `coordination/OPERATIVE_OBLIGATIONS.md` row, none closed. RFC-019 Unresolved questions 1–10.

## Governing references

- Authority: `D-074`; `D-073` (design); `D-069`.
- Reviews: `ML-DEVOS-AS-102` (controlling), `ML-DEVOS-AS-101`.
- Design: `ML-DEVOS-RFC-019` §13.1, §13.6 I5. Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `37a4ff9140680b98d84e438604a0d69e89dabccf`.
- `devos/execution/host.mjs` `persistExpiries`; `tests/execution-expiry.test.mjs`; `tests/execution-mutation.test.mjs` (M49, M03).
- The archived implementation handoff `coordination/archive/handoffs/H-S6-CORE-HARDEN-0001.md`.

## Next action

The Architect independently reviews this AS102-F001 remediation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-102`. No further Builder action is authorized.
