# Current Handoff — S6 Execution-Boundary Amendment, Final Remediation Cycle 2 (AS-091)

```yaml
schema_version: 1
handoff_id: H-S6-EXECBOUNDARY-REM2-0001
cycle_id: SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT
input_base_commit: f8c41720fb9514014b0b2a5b55422c37c5a53ccc
review_target_commit: f8c41720fb9514014b0b2a5b55422c37c5a53ccc
applicable_review_id: ML-DEVOS-AS-091
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. `D-068` stays suspended.

## Objective

Correct only `AS91-F001` in the `D-069` amendment of `ML-DEVOS-RFC-019` (scope `SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT_AS091_FINAL_REMEDIATION_CYCLE_2_ONLY`, final cycle 2 of 2). This is design only. An `ISSUED` Execution Permit must not become claimable on the issuance-time S5 `ALLOW` alone.

Provenance:
- Bootstrapped fresh in this session from the authoritative tip `f8c4172` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). Reads: STATE, `ML-DEVOS-AS-091`, RFC-019 §13.1.
- Work was done in a clean worktree from `f8c4172`. The Builder's preserved `D-068` draft stays untracked, uncommitted and unpushed in the primary checkout. It was not imported, altered or executed.
- No permission was expanded, and no safety control was worked around.

## Changed files

Diff against base `f8c41720fb9514014b0b2a5b55422c37c5a53ccc`:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`:
  - **New §13.1 subsection, *Claim-time S5 recheck*.** Immediately before `ISSUED → CLAIMED`, S6 calls the public S5 `shell` adapter again with the permit's stored `s5_request_intent` axes exactly, including the pinned `policy_version`. The adapter supplies fresh trusted time and the live revocation list.
    - Claim proceeds only on a fresh `ALLOW` whose presented intent equals the stored intent, whose `descriptor_id` and `policy_version` equal the stored ones, and whose subject `actor_role`/`actor_id` equal those at issuance.
    - Any `DENY` (including `REVOKED`, `EXPIRED`, `POLICY_VERSION_MISMATCH`), trusted-source failure, or binding mismatch is `CAPABILITY_DENIED`. The permit becomes terminal `REVOKED` with reason `CAPABILITY_INVALIDATED`.
    - The check is journaled as its own entry, bound to `permit_digest`. The immutable permit body is never rewritten.
    - Ordinary policy supersession does not invalidate the pinned attempt (RFC-017 §6).
    - No polling happens after claim.
  - **Consequential updates:**
    - flow step 3 (the fresh S5 check comes last, immediately before the state change, under the per-task lock);
    - the permit-lifecycle `REVOKED` row (now with recorded reasons, including `CAPABILITY_INVALIDATED`);
    - the exact-replay wording (replay has no execution effect; claim is the freshness boundary);
    - the S5-binding "where S6 gets the decision" bullet and the reason-code mapping;
    - the §8 `shell` bullet and the §8.1 row (issuance *and* claim);
    - §18 item 14 (six claim-time recheck tests: revoke → blocked; expiry → blocked; supersession → allowed; replay then claim → fresh check; binding mismatch → blocked; trusted-source unavailable → fail closed);
    - summary decision 10; residual risk 14 (revocation after claim does not interrupt a running command); and the cycle-2 note.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-EXECBOUNDARY-REM1-0001` was already archived byte-identical by the Architect.

`devos/changes/rfcs/README.md` was **not** changed: its entry stays factually accurate.

Not changed:
- `AS90-F001`–`F003` remain as closed; the `D-069` separation is unchanged.
- No executable S6 source, `devos/execution/`, driver, or `tests/execution-*`.
- No manifest, schema or runtime file; no S3/S4/S5 source or interface (no argv added to S5); no ADR, closure or version change.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session, in the clean worktree.

- **Traceability, base `f8c4172`:** 354 files / 2 errors (`CORE-022`, `WEB-REQ-009`) / 14 warnings / 305 definitions, `DRIFT`.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 354 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / 14 warnings (identical to the base) / 305 definitions, `No drift`, exit `1` (the convention while any ERROR exists).
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

The new claim-time tests are design-level requirements; none is executed here.

## Unresolved findings and limitations

- **Final cycle.** This was the final remediation cycle (2 of 2). Per `ML-DEVOS-AS-091`, a further blocker routes to Paulo rather than opening a third cycle.
- **Claim-check race window.** There is a small window between the fresh S5 `ALLOW` and the `CLAIMED` write under the per-task lock. A revocation landing inside it takes effect at the next S5-gated action, consistent with RFC-017's in-flight semantics.
- **Residual risk 14:** a revocation after claim does not interrupt an already-running command.
- **Open questions 7 and 8 are unchanged:** where a real driver lives, and whether S6 core's fixed internal Git subprocess calls are acceptable under the runtime's safety controls.
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged, including `OBL-010`, `OBL-011`, `OBL-012`, `OBL-015`, `OBL-017` and `OBL-018`. None is closed.

## Governing references

- Authority: `D-069`; `D-068` (suspended); `D-066`.
- Reviews: `ML-DEVOS-AS-091` (`AS91-F001`, live review), `ML-DEVOS-AS-090`, `ML-DEVOS-AS-089`.
- Design: `ML-DEVOS-RFC-019`. S5 semantics: `ML-DEVOS-RFC-017` §6, `ML-DEVOS-ADR-015` (unchanged).
- Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `f8c41720fb9514014b0b2a5b55422c37c5a53ccc`.
- RFC-019 §13.1, *Claim-time S5 recheck*, and §18 item 14.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect performs the final re-review of `AS91-F001` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-091`, and archives `H-S6-EXECBOUNDARY-REM2-0001` if its routing deselects this handoff.

`D-068` does not resume. Any executable S6 work needs an Architect-approved design and a fresh Paulo decision. No further Builder action is authorized.
