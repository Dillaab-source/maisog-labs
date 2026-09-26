# Current Handoff — S6 RFC-019 Remediation Cycle 2 (AS-087)

```yaml
schema_version: 1
handoff_id: H-S6-RFC019-REM2-0001
cycle_id: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
input_base_commit: 7e9c55af0d16227984b2a1ff388eb9ec8c92b344
review_target_commit: 7e9c55af0d16227984b2a1ff388eb9ec8c92b344
applicable_review_id: ML-DEVOS-AS-087
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. RFC-019 remains `DRAFT`.

## Objective

Correct exactly `AS87-F001` in `ML-DEVOS-RFC-019` under scope `SENTINEL_S6_ISOLATED_EXECUTION_DESIGN_REMEDIATION_CYCLE_2_ONLY`: Remediation Cycle 2 of 2, the final allowed cycle, under authority `D-066`. This is design work only.

The Builder publication `BUILDING → READY_FOR_QA` call must carry an `evidenceRef` that satisfies S4's existing evidence-class guard, and crash-recovery replay must use an identical `evidenceRef` binding.

Provenance: bootstrapped fresh in this session from the authoritative tip `7e9c55a`, which carried STATE `TURN: CLAUDE` / `STATUS: CHANGES_REQUESTED` / `CURRENT_REMEDIATION_CYCLE: 2`. Reads followed LEAN / DELTA-ONLY:
- STATE and `ML-DEVOS-AS-087`;
- RFC-019 §7.1;
- S4 `lifecycle.mjs` (`EVIDENCE_GUARDS`, `checkTransition`);
- S4 `kernel.mjs` (`transition` idempotency binding via `stableStringify` = `JSON.stringify`).

## Changed files

Diff against base `7e9c55af0d16227984b2a1ff388eb9ec8c92b344`:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`:
  - the status banner and a Cycle 2 remediation note;
  - new §7.1.1, the single Builder publication `evidenceRef` payload contract;
  - §7.1 steps 2, 3 and 5;
  - the §13 *complete* row;
  - §18 item 9 (payload tests);
  - summary decision 2.
- `devos/changes/rfcs/README.md` — the RFC-019 entry now names Cycle 2 and the payload contract. This was directly necessary so the index describes one payload contract.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-RFC019-REM1-0001` was already archived byte-identical by the Architect in `7e9c55a`.

Not changed, verified empty against the base:
- S3/S4/S5 source, schemas and interfaces;
- the manifest; ADRs; `brain/`; `tests/`; `scripts/`;
- every product, runtime and deploy surface.

No `devos/execution/` exists.

## Remediation (AS87-F001)

- **§7.1.1 defines one exact payload.** It has nine members, in a fixed order:
  1. `evidenceClass: "ACTOR_REPORTED"`, always this literal. S6's isolation proof does not upgrade it; independent QA and S7/S9 stay separate.
  2. `ref: "s6-rtr:<transfer_id>"`
  3. `s6_transfer_id`
  4. `result_commit_sha`
  5. `result_tree_sha`
  6. `base_sha`
  7. `identity_digest`
  8. `provenance_digest` (the journal head up to the `PENDING` record)
  9. `remote_ref`

  The payload has no other members, string values only, lowercase hex, and no secrets, host paths or environment values.
- **Byte-identical replay.** S4 binds idempotency to `JSON.stringify(evidenceRef)`, which depends on member order. So S6:
  - builds the payload once;
  - stores its exact serialized bytes and SHA-256 in the `PENDING` Result Transfer Record before the first attempt;
  - derives the `evidenceRef` for every attempt, first or replay, only by `JSON.parse` of those bytes, never by rebuilding from the record's fields;
  - checks the round-trip and the digest before each call. A mismatch is `RESULT_TRANSFER_UNPROVEN`, and no call is made.
- **The call itself (§7.1 step 3)** is now fully specified: `toState: "READY_FOR_QA"`, `expectedRevision = pre_revision`, `idempotencyKey = transfer_id`, `evidenceRef` = the stored payload, and no `decisionRef` or failure/ambiguity flag.
- **Recovery (§7.1 step 5):**
  - S4 replays the original success → the record commits.
  - `IDEMPOTENCY_CONFLICT`, or an owner or revision mismatch → the record aborts.
  - Missing or corrupt stored bytes → `RESULT_TRANSFER_UNPROVEN`, and the record waits for an explicit, audited operator resolution. It is never inferred.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session.

- **S4 contract probe.** This is a scratch script outside the repository that imports the real, unmodified `devos/state/kernel.mjs` against a temporary directory. Nothing from it is committed. It drives a task through `CREATED → PLANNING → READY_FOR_BUILD → BUILDING` (revision 5):
  - (A) `evidenceRef` without `evidenceClass` → `ILLEGAL_TRANSITION`, with the guard message listing the five classes;
  - (B) the §7.1.1 payload, via `JSON.parse` of the stored bytes → `READY_FOR_QA`, owner `null`, revision 6 (exactly +1);
  - (C) replay with the same key and the same stored bytes, after success → S4 returns the recorded result unchanged (revision 6);
  - (D) replay with the same members in reversed order → `IDEMPOTENCY_CONFLICT`;
  - `JSON.stringify(JSON.parse(bytes)) === bytes` → true.

  This supports the §7.1.1 contract and the need for byte-identical replay. It is Builder-run, not independently reproduced.
- **Traceability, base `7e9c55a`** (separate detached worktree, removed afterwards): 342 files / 2 errors (`CORE-022`, `WEB-REQ-009`) / 14 warnings / 298 definitions, `DRIFT`. The drift comes from Architect-published coordination and archive files added after the last regeneration. The committed index at the base reads 339 files / 2 errors / 14 warnings.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 342 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / 14 warnings / 298 definitions, `No drift`, exit `1` (the convention while any ERROR exists). The warning set is identical to the base.
- **Full suite:** `npm test` → 606 tests, 606 pass, 0 fail.
- **Validators:**
  - manifest → `PASS: 0 error(s)`;
  - capability-policy → exit `0`;
  - task-contract → exit `0`;
  - rules → exit `0`;
  - waivers → exit `0`;
  - skills bridge → 4/4 OK.
- **`git diff --check`:** clean.
- **No executable S6 in the diff:** the diff is Markdown plus regenerated traceability only.

## Unresolved findings and limitations

- This was the final remediation cycle (2 of 2). If the re-review still finds a blocker, the next routing is the Architect's and Paulo's to decide.
- The probe covers the S4 contract only. No S6 code exists, so the rest of §18 remains a plan for a future authorized implementation.
- The RFC-019 residual risks and open questions (Q1, Q3–Q6) are unchanged.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged, including `OBL-010`, `OBL-011`, `OBL-012`, `OBL-015`, `OBL-017` and `OBL-018`. This turn closes none.

## Governing references

- Authority: `D-066`.
- Review: `ML-DEVOS-AS-087` (`AS87-F001`); prior reviews `ML-DEVOS-AS-086` and `ML-DEVOS-AS-085`.
- Design under review: `ML-DEVOS-RFC-019`.
- S4: `ML-DEVOS-ADR-014` (`devos/state/lifecycle.mjs`, `devos/state/kernel.mjs`, unchanged).
- Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `7e9c55af0d16227984b2a1ff388eb9ec8c92b344`.
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`, §7.1 and §7.1.1.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect re-reviews `ML-DEVOS-RFC-019` against `AS87-F001` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-087`, and archives `H-S6-RFC019-REM2-0001` if its routing deselects this handoff.

No S6 implementation, root reservation, manifest change, S5 runtime use, S4 publication-transition use or transport authorization is granted. No further Builder action is authorized.
