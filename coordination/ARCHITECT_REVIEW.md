# Architect Review

Status: `CHANGES_REQUESTED — SENTINEL-TRACEABILITY-V1 REMEDIATION CYCLE 2`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-040 — Sentinel Traceability V1 Remediation Review 2

Authority chain:
- `ML-DEVOS-RFC-012`
- `ML-DEVOS-AS-037`
- `D-036`
- prior review `ML-DEVOS-AS-039`

## Remediation Cycle 1 result

The Builder correctly implemented a narrowly scoped `referenceExceptions` mechanism.

Independent inspection confirms the original source occurrence:

`docs/SENTINEL_REVIEW_NOTES.md: Do not create CORE-022 from these findings.`

is now classified as:

`WARNING intentional-noncanonical-mention`

rather than a hard missing-target error.

The new tests also correctly prove that the exception is site-specific rather than a global suppression.

## New finding

### AS40-F001 — BLOCKER — rolling/tooling surfaces are being treated as durable semantic references

The current report still produces hard missing-target errors for:

- `CORE-022` from `coordination/ARCHITECT_REVIEW.md`, `coordination/IMPLEMENTER_HANDOFF.md`, and `coordination/STATE.md`;
- `ML-DEVOS-AS-039` from the still-open rolling review/handoff/state and from Traceability V1's own implementation documentation.

These are not equivalent to durable repository references.

`coordination/` is a rolling working/turn surface. Its contents necessarily discuss unresolved IDs, proposed IDs, current findings, and open Architect Sync IDs before those records become durable archives.

Likewise, the Traceability V1 subsystem's own README/source/config necessarily discusses the IDs and exception mechanisms it is analyzing.

Using either surface as a hard referential-integrity source creates a feedback loop:

`finding → review text mentions finding → scanner reads review → new finding`

That makes the validator partly self-referential and can create false-positive growth even when the underlying durable repository is unchanged.

## Required remediation

Separate **durable reference surfaces** from **rolling/tooling surfaces**.

### Required behavior

1. Hard `missing-canonical-target` ERRORs must be derived only from durable/product/source/test/governance surfaces intended to carry lasting semantic references.

2. The following must not contribute hard missing-target references in V1:
   - `coordination/` rolling working files;
   - `devos/governance/traceability/` itself, including README/source/config/generated output;
   - the traceability-focused test file if it contains implementation-discussion IDs.

3. This may be implemented through bounded scan exclusions/prefixes or an equivalent simple mechanism.

4. Do **not** globally suppress any ID.

5. Keep canonical-definition discovery unchanged.

6. Keep the exact site-specific intentional-non-reference mechanism from Remediation Cycle 1.

7. Add focused tests proving:
   - a missing ID mentioned only on an excluded rolling/tooling surface does not create a hard ERROR;
   - the same missing ID referenced on a durable included surface still creates ERROR;
   - canonical definition discovery still works even when the reference scan excludes working/tooling surfaces.

8. Regenerate the real repository index.

## Expected post-remediation baseline

If no additional mechanism defects emerge:

- `CORE-022` should remain only as the one explicit intentional-noncanonical WARNING from `docs/SENTINEL_REVIEW_NOTES.md`;
- the open `ML-DEVOS-AS-039` / current review bookkeeping should no longer appear as a missing-target ERROR merely because the durable archive does not exist yet;
- `WEB-REQ-009` should remain the genuine hard ERROR because it is referenced across durable product/runtime/test/RFC/ADR surfaces outside coordination;
- historical exceptions `ML-DEVOS-AS-008` and `ML-DEVOS-AS-009` remain visible warnings;
- any real durable orphan warnings discovered by the corrected scan remain visible.

## Architectural rationale

Traceability V1 is a durable-reference integrity checker, not a parser for every string appearing in temporary working conversation mirrors.

The repository already distinguishes:
- rolling current-turn coordination;
- durable Architect Sync archive;
- Decisions;
- ADRs;
- requirements;
- risks;
- tests;
- implementation/source artifacts.

The validator should respect that distinction.

## Non-scope

Do not:
- repair `WEB-REQ-009`;
- create `CORE-022`;
- fabricate/archive an Architect Sync before its review actually concludes;
- begin S3;
- modify product runtime;
- add CI/rulesets;
- touch remote resources;
- deploy;
- merge to main;
- bump Sentinel version.

## Verdict

`ML-DEVOS-AS-040: CHANGES_REQUESTED — REMEDIATION CYCLE 2`

Single blocker:
`AS40-F001`.

Traceability V1 may close after this boundary correction if the remaining hard errors represent genuine durable repository gaps rather than scanner self-reference.
