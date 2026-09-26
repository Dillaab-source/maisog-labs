# Current Handoff — S6 Execution-Boundary Amendment, Exceptional Micro-Remediation (AS92-F001, D-070)

```yaml
schema_version: 1
handoff_id: H-S6-EXECBOUNDARY-REM3-0001
cycle_id: SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT
input_base_commit: 23df1033b32c181ba2fb1085db7fae93026447a2
review_target_commit: 23df1033b32c181ba2fb1085db7fae93026447a2
applicable_review_id: ML-DEVOS-AS-092
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. `D-068` stays suspended.

## Objective

Correct only `AS92-F001` in the `D-069` amendment of `ML-DEVOS-RFC-019`, under `D-070`'s single exceptional micro-remediation (scope `SENTINEL_S6_EXECUTION_BOUNDARY_AS92_F001_EXCEPTIONAL_MICRO_REMEDIATION_D070_ONLY`, cycle 3 of 3). This is design only. The S5 subject must be bound to the S6 Execution Identity's owner and role.

Provenance:
- Bootstrapped fresh in this session from the authoritative tip `23df103` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). Reads: STATE (`D-070` scope), `ML-DEVOS-AS-092` `AS92-F001`, RFC-019 §13.1.
- Work was done in a clean worktree from `23df103`. The Builder's preserved `D-068` draft stays untracked, uncommitted and unpushed in the primary checkout. It was not imported, altered or executed.
- No permission was expanded, and no safety control was worked around.

## Changed files

Diff against base `23df1033b32c181ba2fb1085db7fae93026447a2`:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md` (§13.1 and directly dependent text only):
  - **Canonical V1 role mapping:** S6 `BUILDER` → S5 `Builder`, S6 `QA` → S5 `QA`. The mapping is fixed and total; anything else fails closed.
  - ***Verification before a permit*.** After the public S5 adapter returns, and before accepting its `ALLOW`:
    - `presented.subject_context.actor_id == ExecutionIdentity.owner`;
    - `presented.subject_context.actor_role == canonicalRole(ExecutionIdentity.role)`.

    A mismatch is `CAPABILITY_DENIED`, with no request binding and no permit.
  - **Permit record.** The immutable body gains `s5_subject_binding` (`actor_id`, `actor_role`), two non-secret fields stored in the clear for field-level comparison. It does not rely only on `s5_presented_digest`. *What the permit stores* is updated to match.
  - **Claim-time recheck.** The fresh `actor_id`/`actor_role` are compared directly against **both** the Execution Identity (owner, mapped role) **and** the stored `s5_subject_binding`. Drift is `CAPABILITY_DENIED` and prevents execution. The `AS91-F001` revocation and expiry freshness semantics are unchanged.
  - **What stays S5's.** `credential_class`, `credential_available`, `attestation_ref` and trusted time remain S5-owned fresh trusted context: not copied, not treated as identity, no S5 field added, no secrets.
  - **Also updated:** the reason-code mapping (subject mismatch → `CAPABILITY_DENIED`, still 30 codes); §18 item 14, with seven new design tests (wrong `actor_id` and wrong `actor_role` at issuance → denied, no permit; correct `BUILDER`→`Builder` and `QA`→`QA` → issued; claim-time `actor_id` and `actor_role` drift → denied; `AS91-F001` intact); summary decision 10; and the cycle-3 note.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-EXECBOUNDARY-REM2-0001` was already archived byte-identical by the Architect.

`devos/changes/rfcs/README.md` was not changed; it stays accurate.

Not reopened or changed:
- `AS90-F001`–`F003`, `AS91-F001`, the `D-069` separation, the permit lifecycle, request idempotency, the RTR, quiescence, S4 fencing, and S5 semantics.
- No executable S6 source, driver, `devos/execution/`, `tests/execution-*`, manifest, schema or runtime file.
- No S3/S4/S5 source or interface, and no ADR, closure or version change.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session, in the clean worktree.

- **Traceability, base `23df103`:** 357 files / 2 errors (`CORE-022`, `WEB-REQ-009`) / 15 warnings / 307 definitions, `DRIFT`.
- **Traceability, after:** `generate-traceability.mjs` exits `0`. `validate-traceability.mjs` reports 357 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / **14** warnings / 307 definitions, `No drift`, exit `1` (the convention while any ERROR exists).
  - The only warning change is that `orphan-no-inbound-reference D-070` cleared, because RFC-019 now cites `D-070`. No warning was added.
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

The new identity-binding tests are design-level requirements; none is executed here.

## Unresolved findings and limitations

- **No cycles remain.** This was the final authorized cycle (3 of 3, `D-070`). Per `D-070`, any further blocker routes to Paulo, and no fourth cycle is opened.
- **Role mapping is V1 only.** It covers exactly `BUILDER` and `QA`. Any future S6 role would need an explicit, separately reviewed mapping extension.
- **Trusted subject assumption.** The binding trusts the S5 host's attested subject, exactly as S5 does; this is residual risk 8/11 territory. It makes S6 reject a trusted-but-wrong subject; it does not authenticate identity beyond S5's trust model.
- **Open questions 7 and 8 are unchanged.**
- **Obligations:** all `coordination/OPERATIVE_OBLIGATIONS.md` rows are carried forward unchanged, including `OBL-010`, `OBL-011`, `OBL-012`, `OBL-015`, `OBL-017` and `OBL-018`. None is closed.

## Governing references

- Authority: `D-070` (exceptional micro-remediation); `D-069`; `D-068` (suspended); `D-066`.
- Reviews: `ML-DEVOS-AS-092` (`AS92-F001`, live review), `ML-DEVOS-AS-091`, `ML-DEVOS-AS-090`, `ML-DEVOS-AS-089`.
- Design: `ML-DEVOS-RFC-019`. S5: `ML-DEVOS-RFC-017`, `ML-DEVOS-ADR-015` (unchanged). S4: `ML-DEVOS-ADR-014`.
- Protocol: `ML-DEVOS-RFC-018`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `23df1033b32c181ba2fb1085db7fae93026447a2`.
- RFC-019 §13.1: the permit record, *Verification before a permit* (subject binding), and the claim-time recheck; §18 item 14.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect performs the final independent re-review of `AS92-F001` under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-092`, and archives `H-S6-EXECBOUNDARY-REM3-0001` if its routing deselects this handoff. Any further blocker routes to Paulo.

`D-068` does not resume. Executable S6 work needs an Architect-approved design and a fresh Paulo decision. No further Builder action is authorized.
