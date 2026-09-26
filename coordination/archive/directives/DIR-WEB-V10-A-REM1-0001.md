# Current Directive — V10-A Remediation Cycle 1

```yaml
schema_version: 1
directive_id: DIR-WEB-V10-A-REM1-0001
cycle_id: MAISOGLABS_WEB_V10_A
issue_parent_commit: 3a4b75901032e4b3bdc798dd07572cdc692bb443
target_turn: CLAUDE
authority_ref: D-091
applicable_review_id: ML-DEVOS-AS-119
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-091, D-090, accepted RFC-021, ML-DEVOS-AS-119, and this directive.

## Objective

Complete V10-A remediation cycle 1 by correcting the exact-scope violation, removing non-authoritative Research thumbnails, filling the missing deterministic tests, and producing the complete local RFC-021 acceptance evidence required by AS-119.

## Preconditions

- Bootstrap Protocol V2 from the exact tip that publishes this directive.
- Confirm D-091, D-090, RFC-021, ML-DEVOS-AS-119, this directive ID, and scope `D091_V10_A_REMEDIATION_CYCLE_1_ONLY` are selected together.
- Confirm `CURRENT_REMEDIATION_CYCLE: 1`, `MUTATION_AUTHORIZED: YES`, and every other action-specific authorization flag is `NO`.
- Confirm `main` remains `aebc881e8890c00090d714602591138a045bd3b0`.
- Stop on any stale tip, protocol mismatch, changed main baseline, scope ambiguity, or missing governing record.

## Governing references

- **T0:** Protocol V2; D-091; D-090; accepted `ML-DEVOS-RFC-021`; live STATE hard boundaries.
- **T1:** `ML-DEVOS-AS-119`, findings AS119-F001 through AS119-F004; `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`; `coordination/OPERATIVE_OBLIGATIONS.md`.
- **T2:** current V10 implementation and tests; `docs/product/V10_IMPLEMENTATION_CONTRACT.md`; `docs/product/V10_DIVERGENCE_REGISTER.md`; `docs/product/evidence/v10/**`; pinned V10 reference assets.
- **T3:** only for a named unresolved corrective question, with the reason and evidence classification recorded.

## Exact execution scope

Allowed Builder surfaces:

- `app/layout.js`: remove only the `app/v10.css` import and make directly required consolidation adjustments;
- `app/globals.css`: receive the required V10 rules;
- `app/v10.css`: deletion only;
- `components/site/ResearchSurface.js`: remove fixed local plate imagery from Journal entries without adding replacement media or a serving route;
- V10-focused files under `tests/**`, limited to closing AS119-F004's missing cases;
- `docs/product/V10_IMPLEMENTATION_CONTRACT.md`, `docs/product/V10_DIVERGENCE_REGISTER.md`, and `docs/product/evidence/v10/**`, limited to the acceptance evidence required by AS-119;
- normal Protocol V2 coordination, directive archive/provenance/index, and Builder handoff records for the return.

Required corrections:

1. Move required V10 rules into `app/globals.css`, remove the import, and delete `app/v10.css`.
2. Remove fixed Journal-entry plate thumbnails; do not create a backend, API, D1, R2, or public object-serving path.
3. Add deterministic coverage for the complete F1 404/500/malformed/invalid matrix, all listed clamp inputs, every allowed and unknown ignored-field value, and monotonicity at each integer from 40 through 85.
4. Complete the RFC-021 evidence matrix for Entry and every panel at 1440×900 and 390×844; Still and fixed-timestamp Full modes; pinned-reference side-by-side and per-pixel threshold comparison; divergence register; contrast and automated accessibility audit with zero serious/critical findings; and runtime-network assertion.

No other source, documentation, governance, test, workflow, dependency, or generated-output surface is authorized.

## SENTINEL Sync

Fresh snapshot: `3a4b75901032e4b3bdc798dd07572cdc692bb443`, confirmed as the authoritative remote tip before this directive transition. The mandatory Protocol V2 bootstrap passed.

**Authority:** Paulo explicitly authorized AS-119 remediation cycle 1. D-091 records the authorization without widening D-090 beyond the named corrections.

**Context:** AS-119 is the controlling independent review. The prior Builder handoff and directive are archived evidence, not current authority.

**Capability:** only bounded local repository mutation and local validation/evidence capture are required. Remote resources, production systems, merge, deploy, API diagnosis, and service/data mutation are not authorized.

**Execution:** one corrective implementation pass and one Protocol V2 return. No adjacent cleanup may be mixed into the cycle.

**Evidence:** return exact base/result commits, changed files, test/build results, screenshot/audit/network artifacts and hashes, comparison results, and explicit actor-reported versus independently reproducible classifications.

Disposition: `CLEAR`.

## SU Contradiction Check

Mode: `BOUNDED_CONTRADICTION`. Disposition: `CLEAR_WITH_NOTES`.

1. D-090 did not originally list `app/v10.css`; D-091 prospectively authorizes its deletion only and does not retroactively redefine D-090.
2. Research images must come from real Journal media, but no public media-serving route is authorized; therefore thumbnails are removed rather than substituted.
3. Required visual evidence is broader than the existing three screenshots; all named views, modes, audits, and comparisons must be recorded.
4. Focused checks passing does not substitute for the required full suite. Out-of-scope failures are preserved and escalated, not repaired under this directive.
5. README/ARCHITECTURE/comment staleness is known but excluded from this cycle.

## Instructions

1. Re-bootstrap and read D-091, D-090, RFC-021, AS-119, obligations, the V10 contract/divergence/evidence records, and the exact affected implementation/tests from one snapshot.
2. Make only the exact corrective edits listed above; preserve current behavior outside those findings.
3. Extend deterministic tests for every AS119-F004 gap without modifying unrelated failing suites or harnesses.
4. Generate the complete local RFC-021 evidence matrix, using a fixed timestamp for Full mode and recording viewport, mode, route/panel, comparison method, threshold, result, and hashes.
5. Run the focused checks, content/D1 compatibility checks, full suite, production build, diff check, hashes, accessibility audit, and runtime-network assertion.
6. If a required check cannot pass without an unlisted edit, stop and record the exact blocker; do not broaden scope.
7. Publish one Protocol V2 Builder return, archive/deselect this directive byte-for-byte with provenance, clear mutation flags and selectors, and route to the Architect.

## Validation and evidence

- `git diff --check` passes.
- Focused V10 checks and content/D1 compatibility checks pass.
- `npm run build` passes.
- Full `npm test` passes in the supported environment; if it does not, the return includes exact failures and proof that no unrelated repair was attempted.
- Tests cover every AS119-F004 case explicitly.
- The complete RFC-021 desktop/mobile, Still/fixed-Full, parity, divergence, accessibility, contrast, and network evidence is present and hash-verifiable.
- No fixed substitute Journal imagery or new media/backend path is introduced.
- No unlisted surface or prohibited local/remote capability is touched.
- The Protocol V2 publish checker passes in check-only mode before compare-and-swap publication.

## Stop conditions

Stop if correction requires an unlisted source, test, documentation, workflow, package, backend, API, Worker, migration, remote-resource, production, merge, or deploy change; if the required evidence cannot be produced locally; if main changes; or if freshness, protocol, or publication checks fail.

Do not broaden scope to resolve full-suite failures outside the named V10 tests.

## Next action

Claude/Builder performs remediation cycle 1 and returns through a newly minted handoff, expected `H-WEB-V10-A-REM1-0001`, with exact implementation and evidence. The return sets `CURRENT_DIRECTIVE: NONE`, clears directive selectors and all action flags, and routes to `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, with `CURRENT_REMEDIATION_CYCLE: 1` retained.

Then stop. Architect acceptance, further remediation, V10-B, API work, main merge, and deployment remain separate governed decisions.
