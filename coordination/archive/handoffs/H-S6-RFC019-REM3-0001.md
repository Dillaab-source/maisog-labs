# Current Handoff — S6 RFC-019 Exceptional Remediation Cycle 3 (AS88-F001, D-067)

```yaml
schema_version: 1
handoff_id: H-S6-RFC019-REM3-0001
cycle_id: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
input_base_commit: 5f92140e96b287c7c04f778c07172c246a71805b
review_target_commit: 5f92140e96b287c7c04f778c07172c246a71805b
applicable_review_id: ML-DEVOS-AS-088
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. RFC-019 remains `DRAFT`.

## Objective

Correct exactly `AS88-F001` in `ML-DEVOS-RFC-019`: remove the self-referential publication provenance digest. This runs under `D-067`'s one exceptional cycle, scope `SENTINEL_S6_ISOLATED_EXECUTION_DESIGN_EXCEPTIONAL_REMEDIATION_CYCLE_3_AS88_F001_ONLY` (cycle 3 of 3). This is design work only.

Provenance: bootstrapped fresh in this session from the authoritative tip `5f92140`, which carried STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED` / `IMPLEMENTER_ACTION_REQUIRED: YES`. Reads followed LEAN / DELTA-ONLY: STATE; `ML-DEVOS-AS-088` (`AS88-F001`); `D-067`; RFC-019 §7.1 and §7.1.1.

## Changed files

Diff against base `5f92140e96b287c7c04f778c07172c246a71805b`:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`:
  - the status banner and a Cycle 3 remediation note;
  - the RTR field list, now with an immutable body plus a separate status part;
  - §7.1 steps 2 and 5;
  - §7.1.1 payload member 8;
  - new §7.1.2, the journal chain and the non-circular construction order;
  - §18 item 9 (construction tests).
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-RFC019-REM2-0001` was already archived byte-identical by the Architect.

`devos/changes/rfcs/README.md` was **not** changed: nothing in the entry mentions the digest, so no change was directly necessary.

Not changed, verified empty against the base:
- S3/S4/S5 source, schemas and interfaces;
- the manifest; ADRs; `brain/`; `tests/`; `scripts/`;
- every product, runtime and deploy surface.

No `devos/execution/` exists.

## Remediation (AS88-F001), following D-067's construction order

- **Member 8 renamed and redefined.** Payload member 8 is now `prepublication_provenance_digest`: the journal head immediately **before** the `PENDING` RTR entry is appended, read under the registry lock. Its position in the order is unchanged. It covers the journal through push verification, and never the `PENDING` entry, the payload, or the transition outcome.
- **Journal chain defined (§7.1.2):** `head_0 = SHA-256("s6-journal-v1\n" ‖ identity_digest)`, and `head_n = SHA-256(head_{n-1} ‖ SHA-256(e_n))`. Each entry records `prev_head`, and entries are never rewritten.
- **Construction order,** under the lock with no interleaved appends:
  1. read `head_k`;
  2. build and serialize the payload with that fixed value;
  3. write the RTR's **immutable body** with those exact bytes;
  4. append `e_{k+1} = {type: "RTR_PENDING", transfer_id, rtr_digest, prev_head: head_k}` and hash it normally;
  5. record proof of the `PENDING` record (`rtr_digest`, `head_{k+1}`) only outside the payload and the RTR body.

  The dependencies form one acyclic chain: `head_k → payload → body → rtr_digest → e_{k+1} → head_{k+1}`. No fixed-point or self-hash scheme is used.
- **Immutable body.** `status` and `post_revision` moved to a separate status part of the RTR, and every status change is its own journal entry. That keeps `rtr_digest` valid after the record commits or aborts. This was needed so the proof in step 5 stays checkable.
- **Adjacency check** on recovery and audit: `e_{k+1}.prev_head` must equal the payload value, `rtr_digest` must match the body, and the chain must recompute. A failure is `RESULT_TRANSFER_UNPROVEN`, an existing code; the code count stays 30.
- **Replay unchanged:** it re-parses the stored bytes and never recomputes the digest, so the S4 binding stays byte-identical after further appends.
- **Preserved:**
  - `evidenceClass: "ACTOR_REPORTED"`;
  - the member order and byte-identical replay;
  - S4 unchanged;
  - the RTR/S4 publication model;
  - QA separation;
  - S7 remains future work;
  - AS86/AS87 findings remain closed.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session.

- **Construction probe.** A scratch script outside the repository, not committed, implements §7.1.2 literally against a fixture journal and drives the real, unmodified S4 kernel:
  - `e_{k+1}.prev_head == prepublication_provenance_digest` → true;
  - the payload contains neither `rtr_digest` nor `head_{k+1}` → true;
  - the chain recomputes from `head_0` to `head_{k+1}` → true;
  - rebuilding from the same inputs is byte-identical → true;
  - S4 publish → `READY_FOR_QA`, revision 5 → 6, owner `null`;
  - replay after two further journal appends, with the stored bytes → S4 returns the same recorded result;
  - a corrupted `prev_head` and a mutated body digest are both detected.

  This demonstrates the construction is deterministic and non-circular. It is Builder-run and not independently reproduced, and no S6 code exists.
- **Traceability, base `5f92140`** (separate detached worktree, removed afterwards): 345 files / 2 errors (`CORE-022`, `WEB-REQ-009`) / 14 warnings / 300 definitions, `DRIFT`. The drift comes from Architect-published files; the committed index at the base reads 342 files.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 345 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / 14 warnings / 300 definitions, `No drift`, exit `1` (the convention while any ERROR exists). The warning set is identical to the base.
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

- This is the last authorized remediation cycle (3 of 3, a one-cycle owner override under `D-067`). Any further blocker routes to the Architect and Paulo.
- The journal chain is tamper-evident, not tamper-proof. The residual risk is unchanged: a lying or compromised S6 host is still trusted.
- The RFC-019 open questions (Q1, Q3–Q6) and residual risks are otherwise unchanged.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged, including `OBL-010`, `OBL-011`, `OBL-012`, `OBL-015`, `OBL-017` and `OBL-018`. This turn closes none.

## Governing references

- Authority: `D-067` (exceptional cycle 3) and `D-066` (S6 proposal).
- Review: `ML-DEVOS-AS-088` (`AS88-F001`); prior reviews `ML-DEVOS-AS-087`, `ML-DEVOS-AS-086` and `ML-DEVOS-AS-085`.
- Design under review: `ML-DEVOS-RFC-019`.
- S4: `ML-DEVOS-ADR-014`, unchanged.
- Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `5f92140e96b287c7c04f778c07172c246a71805b`.
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`, §7.1, §7.1.1, §7.1.2 and §18 item 9.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect performs the final independent S6 design review of `ML-DEVOS-RFC-019` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-088`, and archives `H-S6-RFC019-REM3-0001` if its routing deselects this handoff.

`D-067` is not implementation authority. No S6 implementation, root reservation, manifest change, S5 runtime use, S4 publication-transition use or transport authorization is granted. No further Builder action is authorized.
