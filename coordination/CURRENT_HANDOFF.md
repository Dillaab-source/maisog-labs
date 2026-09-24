# Current Handoff — S6 Execution-Boundary Amendment, Remediation Cycle 1 (AS-090)

```yaml
schema_version: 1
handoff_id: H-S6-EXECBOUNDARY-REM1-0001
cycle_id: SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT
input_base_commit: a0936ec09e9cd5aa3b2e8dda6f0ba05d58af6eaf
review_target_commit: a0936ec09e9cd5aa3b2e8dda6f0ba05d58af6eaf
applicable_review_id: ML-DEVOS-AS-090
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. `D-068` stays suspended.

## Objective

Correct only `AS90-F001`, `AS90-F002` and `AS90-F003` in the `D-069` amendment of `ML-DEVOS-RFC-019` (scope `SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT_AS090_REMEDIATION_CYCLE_1_ONLY`, cycle 1 of 2). This is design only. The accepted `D-069` separation is not reopened.

Provenance:
- Bootstrapped fresh in this session from the authoritative tip `a0936ec` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). Reads: STATE, `ML-DEVOS-AS-090`, RFC-019 §13.1 and its dependents.
- Work was done in a clean worktree from `a0936ec`. The Builder's preserved `D-068` draft stays untracked, uncommitted and unpushed in the primary checkout. It was not imported, altered or executed.
- No permission was expanded, and no safety control was worked around.

## Changed files

Diff against base `a0936ec09e9cd5aa3b2e8dda6f0ba05d58af6eaf`:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`:
  - **AS90-F001, permit lifecycle** (§13.1): a new state table.
    - `ISSUED` → `EXPIRED_UNCLAIMED` or `REVOKED` (both terminal and harmless), or → `CLAIMED` → `REPORTED`.
    - `claim_deadline` bounds claiming only. **Time never moves a permit out of `CLAIMED`.**
    - A claimed permit with no verified report is execution-uncertain and blocks quiesce and completion (`QUIESCE_UNPROVEN`).
    - Quiesce first revokes every `ISSUED` permit.
    - A late report is accepted only while the host has not gone through recovery. Recovery quarantines the instance (reason `QUIESCE_UNPROVEN`), and a later report does not un-quarantine it.
    - Unclaimed expiry is harmless.
    - §15 crash recovery gains the matching bullet.
  - **AS90-F002, request binding** (§13.1):
    - Each `(instance_id, request_id)` gets one immutable binding record (`checkpoint_revision`, `argv_digest`, `cwd`, `environment_digest`, `permit_id`), created by exclusive create under the per-task lock in the same step as the permit. `permit_id` is generated once, as a random value.
    - Exact replay returns the stored permit and its state, with no new S5 call. Conflicting reuse is `MALFORMED_REQUEST`.
    - After a terminal or uncertain state, a new attempt needs a new `request_id`.
    - Nothing is minted before a verified `ALLOW`. Crash retry resolves by exact replay.
  - **AS90-F003, S5 binding** (§13.1, §8 `shell` bullet, §8.1 row, the `D-069` note sentence, summary decision 10):
    - The RFC states explicitly that S5 V1 is not argv-aware. `shell.exec` `ALLOW` gates the capability at S5's canonical request axes only; argv exactness is S6's `argv_digest`. Command-content-aware policy is named as a future, separately governed S5 change.
    - The permit's immutable body (`permit_digest`) now stores the adapter's canonical `presented.request_intent` verbatim, plus its digest, a presented-snapshot digest, and the decision fields, next to `argv_digest`.
    - S6 verifies the presented intent against the expected axes (provider, action, the instance's canonical `repo/`, project, environment, policy version). A substituted or mismatched `ALLOW` is `CAPABILITY_DENIED`.
    - S6 obtains decisions only from its own adapter call and never accepts a caller- or driver-supplied decision.
    - Claim and report re-verify `permit_digest`.
  - **Consequential updates:** the §13 *permit*, *record* and *quiesce* rows; the §13.1 records table (permit body plus status part), flow steps 2, 3, 5 and 6, and the reason-code mapping (still 30 codes); the test fixtures; §18 item 14 with focused tests for claimed-then-crash, claimed-then-expiry, unclaimed-expiry, exact, conflicting and after-crash replay, concurrent same-`request_id`, and substituted-`ALLOW`; residual risk 13 (S5 not argv-aware); and the cycle-1 note under the status banner.
- `devos/changes/rfcs/README.md` — the RFC-019 entry's permit wording, made precise for F003.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-EXECBOUNDARY-0001` was already archived byte-identical by the Architect.

Not changed: no executable S6 source; no `devos/execution/`; no driver; no `tests/execution-*`; no manifest; no schema or runtime file; no S3/S4/S5 source or interface; no ADR, closure or version change.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session, in the clean worktree.

- **Traceability, base `a0936ec`:** 351 files / 2 errors (`CORE-022`, `WEB-REQ-009`) / 14 warnings / 304 definitions, `DRIFT`.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 351 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / 14 warnings (identical to the base) / 304 definitions, `No drift`, exit `1` (the convention while any ERROR exists).
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

The new §18 item 14 tests are design-level requirements for a future implementation. None is executed here.

## Unresolved findings and limitations

- **Two behaviours are design commitments, not yet demonstrated.** Late-report acceptance before recovery and quarantine after recovery are a deliberate fail-closed simplification. The concurrent same-`request_id` guarantee depends on the per-task registry lock plus exclusive create. Neither has an implementation to exercise.
- **Residual risk 13** (new): S5 `shell` is not argv-aware, so command appropriateness rests on MAY and task scope, with S6 binding and auditing the exact argv.
- **Open questions 7 and 8 are unchanged:** where a real driver lives, and whether S6 core's fixed internal Git subprocess calls are acceptable under the runtime's safety controls.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged, including `OBL-010`, `OBL-011`, `OBL-012`, `OBL-015`, `OBL-017` and `OBL-018`. None is closed.

## Governing references

- Authority: `D-069`; `D-068` (suspended); `D-066`.
- Reviews: `ML-DEVOS-AS-090` (findings `AS90-F001`–`AS90-F003`, live review), `ML-DEVOS-AS-089`.
- Design: `ML-DEVOS-RFC-019`.
- S5: `ML-DEVOS-ADR-015`, unchanged. S4: `ML-DEVOS-ADR-014`, unchanged.
- Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `a0936ec09e9cd5aa3b2e8dda6f0ba05d58af6eaf`.
- RFC-019 §13.1: the permit lifecycle, request binding and S5 binding subsections, and §18 item 14.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect re-reviews `AS90-F001`–`AS90-F003` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-090`, and archives `H-S6-EXECBOUNDARY-REM1-0001` if its routing deselects this handoff. This was remediation cycle 1 of 2.

`D-068` does not resume. Any executable S6 work needs an Architect-approved design and a fresh Paulo decision. No further Builder action is authorized.
