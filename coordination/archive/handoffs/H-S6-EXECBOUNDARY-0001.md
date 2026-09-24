# Current Handoff — S6 Execution-Boundary Amendment (RFC-019, D-069)

```yaml
schema_version: 1
handoff_id: H-S6-EXECBOUNDARY-0001
cycle_id: SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT
input_base_commit: e8bdb4241173b9b1f59c3b0d596a500bb79cc40c
review_target_commit: e8bdb4241173b9b1f59c3b0d596a500bb79cc40c
applicable_review_id: ML-DEVOS-AS-089
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this amendment. `D-068` stays suspended and does not resume because of this edit.

## Objective

Perform the single bounded architecture/design amendment to `ML-DEVOS-RFC-019` authorized by `D-069` (scope `SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT_D069_ONLY`). S6 core keeps identity, isolation, environment, fencing, path confinement, journal/RTR/provenance, cleanliness and scope validation, quiescence requirements, publication control and QA reconstruction. It exposes no generic `run(arbitraryCommand)` or raw actor-command `spawn()`. Actor- and tool-chosen command execution becomes a distinct, separately authorized execution-driver boundary.

Provenance:
- **Bootstrap.** Fresh in this session from the authoritative tip `e8bdb42` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED` / `IMPLEMENTER_ACTION_REQUIRED: YES`).
- **Reads.** STATE; `D-069`; `ML-DEVOS-AS-089` (live review id); RFC-019.
- **Clean worktree.** Per `D-069`, the amendment was made in a separate clean worktree created from `e8bdb42`. It does **not** import the Builder's preserved local `D-068` draft.
- **The draft itself** (`devos/execution/`, `tests/fixtures/execution/`) stays untracked, uncommitted and unpushed in the primary checkout. It was not deleted, staged, altered or executed further.
- **No workaround.** No permission was expanded and no safety control was worked around.

## Changed files

Diff against base `e8bdb4241173b9b1f59c3b0d596a500bb79cc40c`, all within the `D-069` authorized writes:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md` — the amendment:
  - **Status banner and amendment note:** records `ML-DEVOS-AS-089` approval, the `D-069` amendment, and the suspension of `D-068`.
  - **New §13.1, execution-driver boundary.** It defines:
    - the Execution Request, Permit and Report records;
    - the request → permit (S5 `shell` gate) → claim → driver execution → report → quiesce flow;
    - what the driver may not be (no MAY, no S4 ownership, no S5 evaluation, no S6 identity);
    - detection of unpermitted activity;
    - the reason-code mapping, with no new code;
    - how S6 core is tested without a generic executor (an injected fake driver plus a closed set of fixed fixture operations);
    - what later authority a real driver needs.
  - **Consequential updates:**
    - §1 L3 row; §2 actors (the S6 host never executes; the execution driver is added);
    - §8 S5 `shell` bullet and wiring disclosure; §8.1 decision table (the `shell` decision is taken at permit issuance; host internals are now permit issuance and report verification plus read-only liveness inspection, not teardown);
    - §10 process tree and per-command record;
    - §13 lifecycle (the *use* row becomes *permit* + *record*; *quiesce* now reads as driver-terminates / S6-proves);
    - §14 rows 3, 28 and 30 (clarified; still 30 codes); §16 process teardown; §17 provenance;
    - §18 items 2, 3 and 4, plus new item 14 (driver-boundary tests, including a source-level check that S6 core has no command-execution primitive);
    - §19 artifacts; summary decision 10; affected components; rollout step 3a; security/trust impact; Paulo decision requirement; residual risks 11–12; unresolved questions 7–8.
- `devos/changes/rfcs/README.md` — the RFC-019 entry, updated factually to AS-089 approval and the D-069 amendment. The old entry stopped at cycle 2.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-RFC019-REM3-0001` was already archived byte-identical by the Architect.

Not changed, verified empty against the base: no executable S6 source; no `devos/execution/`; no `tests/execution-*`; no manifest entry or status; no schema or runtime file; no S3/S4/S5 source or interface; no ADR, closure record or version change.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session, run in the clean worktree at the amended tree, with dependencies from `npm ci`.

- **Traceability, base `e8bdb42`:** 348 files / 2 errors (`CORE-022`, `WEB-REQ-009`) / 15 warnings / 303 definitions, `DRIFT`.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 348 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / **14** warnings / 303 definitions, `No drift`, exit `1` (the convention while any ERROR exists).
  - The only warning change is that `orphan-no-inbound-reference D-069` cleared, because RFC-019 now cites `D-069`. No warning was added.
- **Full suite:** `npm test` → 606 tests, 606 pass, 0 fail.
- **Validators:**
  - manifest → `PASS: 0 error(s)`;
  - capability-policy → exit `0`;
  - task-contract → exit `0`;
  - rules → exit `0`;
  - waivers → exit `0`;
  - skills bridge → 4/4 OK.
- **`git diff --check`:** clean.
- **No executable content:** the diff is Markdown plus regenerated traceability only.

The earlier `D-068` local smoke run (create, commit via the blocked `run()` path, publish, QA, cleanup) remains `ACTOR_REPORTED` Builder evidence about the unpublished draft only. It is not evidence for this amended design.

## Unresolved findings and limitations

- **The amendment is design text only.** Its claims have not been exercised by any implementation. In particular: that S6 core can be fully tested with a fake driver and fixed fixture operations, and that read-only liveness inspection suffices on each platform.
- **Open question 8.** S6 core still contains fixed-argv internal Git subprocess calls (clone, fetch, push with lease, local inspection) that take no caller-supplied argv. Whether those are acceptable under the target runtime's safety controls is not yet established, and the RFC names moving them to a Git library or a transport driver as the fallback.
- **New residual risks:** the driver is trusted to report honestly (11); unpermitted execution is detected through its effects, not prevented (12).
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged, including `OBL-010`, `OBL-011`, `OBL-012`, `OBL-015`, `OBL-017` and `OBL-018`. This turn closes none.

## Governing references

- Authority: `D-069`; `D-068` (suspended); `D-066`, `D-067`.
- Reviews: `ML-DEVOS-AS-089` (design approval, live review), `ML-DEVOS-AS-088`.
- Design: `ML-DEVOS-RFC-019`.
- S5: `ML-DEVOS-ADR-015`. S4: `ML-DEVOS-ADR-014`.
- Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `e8bdb4241173b9b1f59c3b0d596a500bb79cc40c`.
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`, §13.1 and the amendment note.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect independently reviews the amended execution boundary under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-089`, and archives `H-S6-EXECBOUNDARY-0001` if its routing deselects this handoff.

Resuming any executable S6 work needs an Architect-approved amended design and a fresh explicit Paulo implementation decision. A real execution driver needs its own separate authority. No further Builder action is authorized.
