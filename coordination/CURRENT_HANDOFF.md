# Current Handoff — RFC-019 AS99-F001 Remediation (D-073, AS-099)

```yaml
schema_version: 1
handoff_id: H-S6-INTEGRITY-RFC-REM1-0001
cycle_id: SENTINEL_S6_INTEGRITY_HARDENING_RFC
input_base_commit: 05cd039ca30c03a0f6aab953ef3677a8a3d11b68
review_target_commit: 05cd039ca30c03a0f6aab953ef3677a8a3d11b68
applicable_review_id: ML-DEVOS-AS-099
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. It is design only; S6 implementation stays paused.

## Objective

Remediate `AS99-F001` only, under scope `D073_AS99_F001_RFC019_DESIGN_REMEDIATION_ONLY`. RFC-019 let a `QUARANTINED` instance release the task's active-environment slot whenever it held no `PENDING` publication. A `CLAIMED`, unreported execution therefore stopped reserving the slot at recovery quarantine, although its termination was unproven. The correction makes unresolved execution keep the slot. It does not reopen the S6 architecture.

Provenance:
- Bootstrapped from the authoritative tip `05cd039` (STATE `TURN: CLAUDE` / `STATUS: CHANGES_REQUESTED`, the scope above). The tip was re-fetched before publication.
- Inputs read: STATE; `ML-DEVOS-AS-099`; the full current RFC-019; `brain/protocols/CONTEXT_BOOTSTRAP.md`; `coordination/OPERATIVE_OBLIGATIONS.md`.
- The work was done in the clean worktree. The suspended `D-068` draft in the primary checkout was not touched.

## AS-099 requirement → RFC section map

| AS-099 requirement | Where in RFC-019 |
|---|---|
| `ACTIVE = lifecycle_can_progress OR unresolved_external_influence`; `QUARANTINED` is not evidence that execution stopped | **§13.4** *ACTIVE* (the formula, with the two terms defined as separate task-store facts) and *Release* (release only when the lifecycle cannot progress **and** no unresolved influence remains; entering `QUARANTINED`, time, expiry or restart never release it). Also summary decision 13. |
| A quarantined instance with a `CLAIMED`, unreported permit keeps the slot | §13.1 *Recovery* and the permit-lifecycle `CLAIMED` row; §15 recovery step 4; §14 row 19 wording (still `WORKTREE_COLLISION`; no new code). |
| Late verified report: registers liveness, never restores, un-quarantines or makes publishable | §13.1 new *Late report after quarantine* bullet; §13 *record* row (`LATE_REPORT` in the same step-5 transaction). |
| Release requires proven termination and no other reservation, or audited operator resolution; time is never proof | §13.1 new *Clearing execution uncertainty* (the closed *resolve* operation: *Proof* → `EXECUTION_RESOLVED`; *Audited operator resolution* → `OPERATOR_RESOLUTION`, operator-attested, `ACTOR_REPORTED`, clears execution uncertainty only). §13.5 lists *resolve*. §15 step 4 sub-bullet (recovery may attempt the read-only proof, never infers). Residual risk 18. |
| Review all §13.3 reservations so the rule is about unresolved influence, not publication | §13.3 new *Reservations and the active slot* paragraph (every open reservation, `CLAIMED` permit and unproven liveness obligation holds the slot, whatever the lifecycle state); new *unproven liveness obligation* row in the blocking table; the `CLAIMED` row's allowed resolutions; the create row explains why an `INCOMPLETE_CREATE` quarantine can release (a `CREATING` instance never held a permit, push or publication). §13 *cleanup* row: no unresolved influence. §15 retries: the same reason. |
| Reference model represents unresolved influence independently of lifecycle | §13.6 model scope (per-instance facts; ACTIVE derived by the §13.4 formula; `QUARANTINED` is never defined as inactive; late report, *resolve*, operator resolution and trusted-time advance as steps). I1 now uses the §13.4 definition. New **I11** (no new environment while a prior one, even `QUARANTINED`, retains unresolved influence) and **I12** (uncertainty clears only by committed proof or audited operator resolution; a late report never changes a quarantined instance's lifecycle or publishability). |
| Model sequences: `CLAIMED` → crash → quarantine → second create **BLOCKED**; late report → liveness → termination → cleared → slot released → later create succeeds; no report → slot stays | §13.6 new mandatory sequences **Q1** (second create blocked, including after `claim_deadline`), **Q2** (late report alone still blocks), **Q3** (proof releases; later valid create succeeds; first instance stays unpublishable), **Q4** (live group or other reservation keeps it held), **Q5** (no report or proof: held indefinitely; only audited operator resolution releases). §18 item 16: Q1–Q5 must be both generated and replayed. |
| Crash/interleaving matrix: claim → crash → quarantine → slot-release decision → concurrent/new create | §18 item 15: a new row with the forbidden outcome *"a new ACTIVE environment while the earlier claimed execution remains unresolved"*. The recovery and report rows gain slot forbidden outcomes. New *resolve (proof)* and *resolve (operator)* rows. The create row no longer forbids a slot held by a quarantined instance; it now covers only the `INCOMPLETE_CREATE` case. The race list adds create versus recovery quarantine, late report and *resolve*. Invariant checks are I1–I12. |
| Mutation / falsification | §18 item 12: a mutant releasing `active_instance_id` merely because an instance becomes `QUARANTINED` must fail a test and the model (Q1). So must one that clears uncertainty on a late report, expiry or time alone. §13.6: that mutant must violate I1 or I11 in Q1. §18 item 14: a new fake-driver test bullet. |

**Other directly necessary text:**
- the header status line and a new *Integrity-hardening remediation cycle 1* note listing the changed places;
- the *Architect Sync requirement*, which now names the next Sync after `ML-DEVOS-AS-099`.

**Design choice reversed.** The previous handoff's design choice 1 ("a `QUARANTINED` instance is ACTIVE only while it holds a `PENDING` publication") is withdrawn. It is exactly what `AS99-F001` rejected.

**Design choices the Architect should check:**
1. **The closed *resolve* operation.** Uncertainty is cleared by a new closed operation, *resolve*, listed in §13.5, rather than as a side effect of *record* or *cleanup*. It never changes lifecycle state; `QUARANTINED` still moves only to `CLEANED` (I2).
2. **Audited operator resolution.** It clears only execution uncertainty, is recorded as operator-attested (`ACTOR_REPORTED`) and never as proof, and never clears another reservation. Who may perform it is left to the existing "explicit, authorized operator action" wording, the same as stale-lock removal (§15). No new authority model is designed.
3. **Where release is still allowed.** An `INCOMPLETE_CREATE` quarantine and a failed create attempt still release the slot at quarantine, because they cannot hold any other unresolved influence.
4. **No new reason code.** A create blocked by a quarantined holder stays `WORKTREE_COLLISION` (row 19 wording only).

**Preserved (not reopened):**
- every other `D-073` / AS-098 A–J design decision, except wording changed solely to make `AS99-F001` coherent;
- the `D-069` driver separation;
- the `AS90`–`AS98` properties.

## Changed files

Diff against base `05cd039ca30c03a0f6aab953ef3677a8a3d11b68`:
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`: the remediation above.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`: regenerated. The base carried `DRIFT` from the AS-099 transition.
- `coordination/STATE.md`: the return gate.
- `coordination/CURRENT_HANDOFF.md`: this file. It replaces the deselected `H-S6-INTEGRITY-RFC-DRAFT-0001`, whose exact bytes were already archived by the AS-099 transition (`coordination/archive/handoffs/H-S6-INTEGRITY-RFC-DRAFT-0001.md`, blob `71212ef…`).

`devos/changes/rfcs/README.md` is unchanged: no factual change was required.

**No executable file changed.** No file under `devos/execution/**`, no test, no fixture, no S3/S4/S5 source, interface or schema, no manifest, ADR, version or S7 file.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session in the clean worktree.

| Check | Result | Exit |
|---|---|---|
| `npm test` | 784 tests, 784 pass, 0 fail (no code changed) | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | all example files as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | all bridges OK | 0 |
| `git diff --check` | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | see below | 1 |

**Traceability.**
- **Base `05cd039`:** 410 files, 2 errors, 14 warnings, `DRIFT`.
- **After:** 410 files, **2** errors (`CORE-022`, `WEB-REQ-009`: known debt, preserved and not suppressed), **14** warnings, `No drift`. It exits `1`, the convention while any ERROR exists. The ERROR/WARNING set is identical to the base.

No reference model or crash matrix exists in code. Q1–Q5 and the matrix rows are design requirements for a future authorized implementation, not executed evidence.

## Unresolved findings and limitations

- **Design only.** The implementation at `1bf18ef` predates both the `D-073` model and this correction. Any implementation needs a fresh Paulo decision after Architect review.
- **Availability cost disclosed.** A driver that never reports, or groups that cannot be proven terminated, block new environments for the task until *resolve* succeeds or an operator resolves them. Operator resolution is attested, not proven, so a dishonest operator can release a slot while execution continues (Residual risk 18).
- **Liveness proof strength unchanged.** The read-only inspection is the existing §13.1 step 6 method. Its platform limits, such as process-group ID reuse and Windows Job Object visibility, are not re-opened here. A failed or ambiguous proof keeps the slot held.
- **Carried forward, unchanged:**
  - RFC-019 Unresolved questions 1–10;
  - the backend-atomicity question (UQ 9);
  - the S7 Input Integrity design input;
  - every `coordination/OPERATIVE_OBLIGATIONS.md` row, none closed.

## Governing references

- Authority: `D-073` (design only); `D-072`, `D-071` (implementation history); `D-069`; `D-066`.
- Reviews: `ML-DEVOS-AS-099` (controlling), `ML-DEVOS-AS-098`, `ML-DEVOS-AS-097`.
- Design: `ML-DEVOS-RFC-019`. Protocol: `ML-DEVOS-RFC-018`. Closure mechanism: `ML-DEVOS-RFC-015`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `05cd039ca30c03a0f6aab953ef3677a8a3d11b68`.
- RFC-019:
  - the header remediation note;
  - §13 *record* and *cleanup* rows;
  - §13.1 *Recovery*, *Late report after quarantine* and *Clearing execution uncertainty*;
  - §13.3 *Reservations and the active slot*;
  - §13.4 *ACTIVE* and *Release*;
  - §13.5;
  - §13.6 (I1, I11, I12, Q1–Q5);
  - §14 row 19;
  - §15 step 4;
  - §18 items 12, 14, 15 and 16;
  - summary decision 13;
  - Residual risk 18.

## Next action

The Architect independently reviews this `AS99-F001` remediation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-099`. Any S6 implementation requires a fresh Paulo decision after that review. No further Builder action is authorized.
