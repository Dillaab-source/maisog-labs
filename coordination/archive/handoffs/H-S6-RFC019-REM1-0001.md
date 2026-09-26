# Current Handoff — S6 RFC-019 Remediation Cycle 1 (AS-086)

```yaml
schema_version: 1
handoff_id: H-S6-RFC019-REM1-0001
cycle_id: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
input_base_commit: 4d8b403168e6c4f3425a3219bf9fb79e8deb192c
review_target_commit: 4d8b403168e6c4f3425a3219bf9fb79e8deb192c
applicable_review_id: ML-DEVOS-AS-086
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. RFC-019 remains `DRAFT`.

## Objective

Remediate exactly `AS86-F001`–`AS86-F004` in `ML-DEVOS-RFC-019` under scope `SENTINEL_S6_ISOLATED_EXECUTION_DESIGN_REMEDIATION_CYCLE_1_ONLY` (Remediation Cycle 1 of 2, authority `D-066`). This is design work only.

Provenance: bootstrapped fresh in this session from the authoritative tip `4d8b403`, which carried STATE `TURN: CLAUDE` / `STATUS: CHANGES_REQUESTED` / `IMPLEMENTER_ACTION_REQUIRED: YES`. Reads followed LEAN / DELTA-ONLY:
- STATE and `ML-DEVOS-AS-086`;
- RFC-019;
- S4 `kernel.mjs` (`getState`, `claim`/`renew`/`transition` revision increments and results);
- the S5 shell adapter's `resolveShellPath`/`isWithinRoot`, the S5 github adapter's resource form, and its sensitive actions;
- the S3 scope-flag definitions.

## Changed files

Diff against base `4d8b403168e6c4f3425a3219bf9fb79e8deb192c`:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md` — the remediation (see below).
- `devos/changes/rfcs/README.md` — the RFC-019 entry. This was directly necessary: the entry's "reconstructs from the S4-recorded commit" was the F002 defect, and the code count changed.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-RFC019-0001` was already archived byte-identical by the Architect in `4d8b403`.

Not changed, verified empty against the base:
- S3/S4/S5 source, schemas and interfaces;
- the manifest and `devos/schemas/`;
- ADRs, `brain/`, `tests/`, `scripts/`;
- every product, runtime and deploy surface.

No `devos/execution/` exists.

## Remediation, by finding

- **AS86-F001 — identity vs fencing** (§3, §3.1).
  - The identity no longer contains a mutable revision. It keeps `owner` and a birth-fact `anchor_revision`, and it drops the accumulating S5 decisions (now journaled).
  - A new mutable **Fencing Checkpoint** holds `current_revision`, and only S4 ever produces that value (no second counter). It advances only when the owner hands over an S4 `claim`/`renew` result for the same task and owner with `revision == current_revision + 1`, confirmed immediately by `getState()`.
  - The exactly-one step relies on S4's per-mutation increment, which I verified in `kernel.mjs`. It proves no intervening mutation occurred.
  - Any gap, foreign or backward result, or unexplained advance is `INSTANCE_STALE`, permanently. A same-owner re-claim after an intervening mutation counts as a gap.
  - Fencing and publication use `current_revision`. The idempotency and retry keys use `anchor_revision`.
- **AS86-F002 — no S4 evidence read path** (§7, §7.1).
  - The RFC now states that `getState()` exposes neither `evidenceRef` nor history, and that S6 never reads S4 persistence.
  - A new S6-owned **Result Transfer Record** is written ahead as `PENDING`. The S6 host then issues the single publication `transition` (`BUILDING → READY_FOR_QA`) as the owner's agent, with `idempotencyKey = transfer_id`. The record becomes `COMMITTED` only after the transition succeeds and a `getState()` proof passes. The soundness argument is that S4's transition table allows exactly one mutation from (`BUILDING`, O, R) to (`READY_FOR_QA`, no owner, R+1).
  - Crash recovery re-issues the same keyed transition, so S4's idempotency ledger replays or rejects it. A rejection sets `ABORTED`, and the branch becomes `STALE_UNPUBLISHED`.
  - QA uses a record only if the QA actor's own S4 results form a gap-free chain from `post_revision` to the current revision. That rules out a later rebuild round or a rival handoff. QA then fetches by exact SHA and checks the tree hash.
  - The record is not S7 and not a task state machine. An additive S4 read interface is named as a separate future dependency, not assumed.
  - A new code: `RESULT_TRANSFER_UNPROVEN`.
- **AS86-F003 — creating non-existent paths** (§9, §9.1).
  - The existing-path rules are now scoped to existing paths.
  - The new creation algorithm:
    1. validate each literal tail segment before any filesystem call (`..`, separators, control characters, `:`/ADS, trailing dot or space, device names, 8.3 shapes, length, NFC; drive-relative and namespace forms rejected);
    2. canonicalize the nearest existing ancestor, verify it is inside `workspace_root` and not a link, and record its identity (`dev`/`ino`);
    3. create one segment at a time: a checked `EEXIST` is allowed only for shared intermediates, the final directory is created exclusively (`WORKTREE_COLLISION`), and files use `wx`;
    4. re-resolve and revalidate immediately after each creation (`fstat` vs `lstat`);
    5. revalidate the whole chain before use and before each write;
    6. fail closed on unverifiable races (`ISOLATION_UNPROVABLE`);
    7. clone only into a verified empty `repo/`;
    8. keep creation and deletion rules distinct.
  - S5 principles are reused without change. The RFC notes that S5's lexical tail handling is fine for an S5 decision but not for S6 creation.
- **AS86-F004 — the transport flag and the S5 boundary** (§8, §8.1). Former open question 2 is resolved:
  - Host-side fetch and push of the instance's own task branch is **execution transport**, not task `remote_resources_involved`. The RFC justifies this from S3 flag semantics and `CORE-020`, without changing S3. `remote_resources_involved: true` stays a V1 refusal.
  - Transport is still a real remote write, so it requires an explicit transport authorization stating every `CORE-019` element. The RFC gives the table: one repository; only the instance's own `sentinel/s6/...` ref; non-force push with a lease; no protected, base or other refs, deletion, tags or PRs; host-side credential class; revocation; audit.
  - Transport outside that scope, or without a recorded authorization, is `TRANSPORT_NOT_AUTHORIZED`.
  - The S5 claim is narrowed to an explicit table. `github` decisions are needed for remote Git calls and `shell` decisions for actor- or tool-chosen commands. S6 host internals and S4 calls are not claimed to be S5-covered.
  - MAY, CAN and ISOLATED stay separate, and credentials stay host-side. The disclosed L3 residual (T8) is kept.
  - The wiring disclosure now says the implementation decision must authorize S5 consumption, the S4 publication-transition use, and the transport scope.
- **Consequential updates:**
  - §13 lifecycle rows; the §14 codes (now 30: two new codes, three rows clarified); §15 recovery and idempotency;
  - §17 provenance fields; §18 tests (items 8–12);
  - the summary decisions; three new residual risks; open questions 2 (resolved) and 6 (reworded);
  - the T12 threat row.
- **Editorial:** corrected dangling references (`§21`/`§22` → the named Residual risks / Unresolved questions sections; §4.3's `§8 complete` → `§13`). A remediation note sits under the status banner.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session.

- **Traceability, base `4d8b403`** (validated in a separate detached worktree of the untouched base, then removed): 339 files / 2 errors (`CORE-022`, `WEB-REQ-009`) / 14 warnings / 297 definitions, `DRIFT`. The drift is because the Architect's publication added scanned coordination and archive files after the last regeneration. The committed index at the base reads 336 files / 2 errors / 14 warnings / 296 definitions.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 339 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / 14 warnings / 297 definitions, `No drift`, exit `1` (the convention while any ERROR exists). The warning set is line-identical to the base. No new ID-family reference was introduced: the RFC cites no future ADR, AS or Decision ID.
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

- **The remediation is design text only.** Its soundness arguments are Builder reasoning over the inspected S4/S5 source, not executed tests. In particular:
  - S4's increment-by-exactly-one per mutation;
  - the uniqueness of the (`BUILDING`, O, R) → (`READY_FOR_QA`, no owner, R+1) mutation;
  - S4 idempotency replay for crash recovery.

  The Architect should independently confirm them against `devos/state/`.
- **New residual risks:** the Result Transfer Record is host-held and cannot be cross-checked against S4's stored `evidenceRef` without a future S4 read interface; crash recovery depends on S4 idempotency-ledger retention; the transport authorization is a standing remote-write grant while it is active.
- **Remaining open questions:** Q1 (S3 base pin), Q3 (linked-worktree hardening), Q4 (registry egress), Q5 (dedicated OS user), Q6 (durable home for the record and provenance, and the optional S4 read interface).
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged, including `OBL-010`, `OBL-011`, `OBL-012`, `OBL-015`, `OBL-017` and `OBL-018`. This turn closes none.

## Governing references

- Authority: `D-066`.
- Review: `ML-DEVOS-AS-086` (findings `AS86-F001`–`AS86-F004`); the prior review is `ML-DEVOS-AS-085`.
- Design under review: `ML-DEVOS-RFC-019`.
- Composes with: `ML-DEVOS-ADR-013` (S3), `ML-DEVOS-ADR-014` (S4), `ML-DEVOS-ADR-015` (S5).
- Rules: `CORE-019`, `CORE-020`.
- Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `4d8b403168e6c4f3425a3219bf9fb79e8deb192c`.
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`, §3.1, §7.1, §8.1 and §9.1.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect re-reviews `ML-DEVOS-RFC-019` against `AS86-F001`–`AS86-F004` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-086`, and archives `H-S6-RFC019-REM1-0001` if its routing deselects this handoff. This was Remediation Cycle 1 of 2.

No S6 implementation, root reservation, manifest change, S5 runtime use, S4 publication-transition use or transport authorization is granted. No further Builder action is authorized.
