# Current Handoff — RFC-019 AS100-F001 Final Remediation (D-073, AS-100)

```yaml
schema_version: 1
handoff_id: H-S6-INTEGRITY-RFC-REM2-0001
cycle_id: SENTINEL_S6_INTEGRITY_HARDENING_RFC
input_base_commit: 2ce699928219cacc438b55c7c890691e01a38d44
review_target_commit: 2ce699928219cacc438b55c7c890691e01a38d44
applicable_review_id: ML-DEVOS-AS-100
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. It is design only; S6 implementation stays paused. It is remediation cycle 2 of 2.

## Objective

Remediate `AS100-F001` only, under scope `D073_AS100_F001_RFC019_FINAL_DESIGN_REMEDIATION_ONLY`.

RFC-019 counted every `CLAIMED` permit with no verified report as unresolved influence. It also let an audited operator resolution release the slot while that permit stayed `CLAIMED`. Those two rules conflicted.

The correction separates the **historical permit status** from a per-claim **execution-uncertainty reservation**. It does not reopen anything `ML-DEVOS-AS-100` accepted.

Provenance:
- Bootstrapped from the authoritative tip `2ce6999`, read fresh after the AS-100 publication (STATE `TURN: CLAUDE` / `CHANGES_REQUESTED`, the scope above, cycle 2).
- Inputs read: STATE; `ML-DEVOS-AS-100`; the current RFC-019.
- The work was done in the clean worktree. The suspended `D-068` draft in the primary checkout was not touched.

## AS-100 requirement → RFC section map

| AS-100 requirement | Where in RFC-019 |
|---|---|
| Keep the historical permit state; represent execution uncertainty as a separate fact | **§13.1** new *Execution-uncertainty reservations* table: a per-claim reservation and a per-group liveness obligation. Each is `OPEN` until closed by one named resolution, and closed values are terminal. The permit status is history and is never rewritten. The claim reservation is opened in the claim transaction (step 3). |
| ACTIVE: a `CLAIMED` permit whose reservation remains `OPEN` | **§13.4**: the unresolved-influence list says "a `CLAIMED` permit whose claim execution-uncertainty reservation is still `OPEN`" and an `OPEN` obligation. A permit that stays `CLAIMED` after `OPERATOR_RESOLVED` no longer counts. *Release* is derived from the facts at that version, never from a resolution record. §13.3 reservation rows and the slot paragraph use the same terms. |
| Late report: atomic, no gap | §13.1 step 5 and *Late report after quarantine*: one transaction does `CLAIMED → REPORTED`, sets the claim reservation to `SUPERSEDED_BY_REPORT`, and registers every reported group as an `OPEN` obligation. The instance stays `QUARANTINED` and unpublishable. §13.3 driver-execution row; §15 step 4. |
| Proof resolves only what it proves | §13.1 *Proof*: exactly the proven obligations become `PROOF_RESOLVED`, and unproven ones stay `OPEN`. Proof never closes a claim reservation. Quiesce (step 6) records its proven obligations the same way. §15 step 4 sub-bullet. |
| Audited operator resolution: exact target, required record, attestation only, closes nothing else | §13.1 *Audited operator resolution*: one named target (a claim by `permit_id`, or one obligation), plus operator identity, reason, evidence reference and `ACTOR_REPORTED`. It sets that target to `OPERATOR_RESOLVED` in the same transaction, and a record that doesn't close its target cannot commit. The permit stays `CLAIMED`/`REPORTED`. It never touches another claim, obligation or §13.3 reservation, and never restores, un-quarantines or publishes. It is allowed only on a `QUARANTINED` instance. |
| Reference model: independent facts; I11 kept; I12 clarified or a minimal invariant added | §13.6 model scope lists the six facts (permit lifecycle, claim reservation, obligations, other reservations, instance lifecycle, slot). The model never infers a reservation from permit status or a release from a record. **I11** is unchanged. **I12** is clarified: uncertainty is carried by the reservations, and each closes only by its named path. New **I13** (exact-target, bounded resolution): a committed `OPERATOR_RESOLUTION` has its target `OPERATOR_RESOLVED` in the same version, and the slot is released only when the derived unresolved set is empty. |
| Q5 sequence | §13.6 **Q5** rewritten to the AS-100 sequence, including the blocked create before resolution and success after it with the permit still `CLAIMED`. New **Q5a** (another reservation open → slot held) and **Q5b** (no resolution → held under any time advance). |
| Mutants A, B, C | §13.6: Mutant A (release on quarantine → I1/I11 in Q1), Mutant B (record without closure → I13, fails Q5), Mutant C (over-broad resolution → I13, fails Q5a). §18 item 12 adds B, C, a status-rewriting mutant and a gap-in-report mutant. §18 item 16 requires the model run to show all three. |
| Crash matrix / acceptance | §18 item 15: the *resolve (proof)* and *resolve (operator)* rows are restated with exact targets and the Mutant B/C forbidden outcomes. Invariant checks now cover I1–I13. §18 item 14: a new fake-driver test bullet for operator resolution of an unreported claim, including the second-claim and incomplete-record cases. |

**Also updated:** the header gains a *remediation cycle 2* note. Summary decision 13, Residual risk 18 and the *Architect Sync requirement* are updated.

**Design choices the Architect should check:**
1. **Reservation values.** The claim reservation closes as `SUPERSEDED_BY_REPORT` (the report path) or `OPERATOR_RESOLVED`. There is no `PROOF_RESOLVED` for a claim, because an unreported claim has no known process group to prove. `PROOF_RESOLVED` applies per liveness obligation. The names follow AS-100's "names are not mandatory"; the separation is what matters.
2. **Operator resolution can target one liveness obligation.** This is a separately named target, per AS-100's "unless they are the exact separately authorized target". It is needed so that a group from a late report that can never be proven dead has an audited exit.
3. **Operator resolution only on a `QUARANTINED` instance.** It therefore can never enable quiesce, completion or publication. The quiesce and completion preconditions ("no permit is `CLAIMED` without a verified report") are unchanged, because on a non-quarantined instance a `CLAIMED` permit's reservation is necessarily `OPEN`.
4. **§13.2 not edited.** The reservations are defined as part of the permit's transactional metadata in the task store, which §13.2 already lists as "permit statuses". I left §13.2 untouched because it is outside AS-100's authorized surfaces. If the Architect wants its list extended by name, that is a one-line cross-reference.

## Changed files

Diff against base `2ce699928219cacc438b55c7c890691e01a38d44`:
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`: the remediation above.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`: regenerated. The base carried `DRIFT` from the AS-100 transition.
- `coordination/STATE.md`: the return gate.
- `coordination/CURRENT_HANDOFF.md`: this file. It replaces the deselected `H-S6-INTEGRITY-RFC-REM1-0001`, whose exact bytes the AS-100 transition already archived (`coordination/archive/handoffs/H-S6-INTEGRITY-RFC-REM1-0001.md`, blob `1618dcc…`).

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
- **Base `2ce6999`:** 413 files, 2 errors, 14 warnings, `DRIFT`.
- **After:** 413 files, **2** errors (`CORE-022`, `WEB-REQ-009`: known debt, preserved and not suppressed), **14** warnings, `No drift`. It exits `1`, the convention while any ERROR exists. The ERROR/WARNING set is identical to the base.

No reference model, crash matrix or mutant exists in code. Q1–Q5b, I11–I13 and Mutants A–C are design requirements for a future authorized implementation, not executed evidence.

## Unresolved findings and limitations

- **Design only.** The implementation at `1bf18ef` predates the `D-073` model and both remediation cycles. Any implementation needs a fresh Paulo decision after Architect review.
- **This was the last remediation cycle.** If the Architect finds `AS100-F001` unresolved, no autonomous third cycle is authorized, and the route goes to a Paulo decision (`ML-DEVOS-AS-100` *Remediation cap*).
- **Operator resolution is attestation.** A dishonest or mistaken operator can still release a slot while execution continues. It is bounded to one named target and recorded as `ACTOR_REPORTED` (Residual risk 18).
- **Liveness proof strength unchanged.** The step 6 inspection's platform limits are not reopened. An ambiguous proof keeps its obligation `OPEN`.
- **Carried forward, unchanged:**
  - RFC-019 Unresolved questions 1–10;
  - the S7 Input Integrity design input;
  - every `coordination/OPERATIVE_OBLIGATIONS.md` row, none closed.

## Governing references

- Authority: `D-073` (design only); `D-072`, `D-071` (implementation history); `D-069`; `D-066`.
- Reviews: `ML-DEVOS-AS-100` (controlling), `ML-DEVOS-AS-099`, `ML-DEVOS-AS-098`.
- Design: `ML-DEVOS-RFC-019`. Protocol: `ML-DEVOS-RFC-018`. Closure mechanism: `ML-DEVOS-RFC-015`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `2ce699928219cacc438b55c7c890691e01a38d44`.
- RFC-019:
  - the header *remediation cycle 2* note;
  - §13.1: flow steps 3, 5 and 6; the permit-lifecycle table and bullets; *Execution-uncertainty reservations*; *Clearing execution uncertainty*;
  - §13.3: the driver-execution row, the reservation rows, and *Reservations and the active slot*;
  - §13.4 *ACTIVE* and *Release*;
  - §13.6: model scope, I12, I13, Q5/Q5a/Q5b, Mutants A–C;
  - §15 step 4;
  - §18 items 12, 14, 15 and 16;
  - summary decision 13;
  - Residual risk 18;
  - the Architect Sync requirement.

## Next action

The Architect independently reviews this final `AS100-F001` remediation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-100`. Any S6 implementation requires a fresh Paulo decision after that review. No further Builder action is authorized.
