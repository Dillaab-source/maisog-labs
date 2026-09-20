# ML-DEVOS-AS-039 — Durable Architect Sync Archive

Status: `CONCLUDED — CHANGES_REQUESTED / REMEDIATION CYCLE 1`

Canonical rolling source at conclusion:
- `coordination/ARCHITECT_REVIEW.md`

## Concluding snapshot

```markdown
# Architect Review

Status: `CHANGES_REQUESTED — SENTINEL-TRACEABILITY-V1 REMEDIATION CYCLE 1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-039 — Sentinel Traceability V1 Implementation Review

Authority chain:
- `ML-DEVOS-RFC-012`
- `ML-DEVOS-AS-037`
- `D-036`

Reviewed implementation base:
`affd2693f29ebac450e707e7b43140f9b36f09b8`

The governance branch is exactly one implementation commit ahead of that base for this Builder handoff.

## Scope inspection

PASS.

The implementation changed only:
- seven new files under `devos/governance/traceability/`;
- `tests/traceability.test.mjs`;
- normal Builder handoff/state bookkeeping.

No existing governance source record, runtime/application code, rule registry, migration, product schema, CI/ruleset, remote resource, deployment target, or `main` content was modified.

## Findings

### AS39-F001 — PASS — source-of-truth hierarchy preserved

Generated output is explicitly marked derived/non-authoritative in JSON, Markdown, and README.

The implementation does not override or rewrite canonical governance records.

### AS39-F002 — PASS — deterministic derived output design

The generator contains no time/random/process-derived output and sorts scanned files/findings/IDs before serialization.

Builder-reported two-run SHA/diff evidence is consistent with the implementation design.

### AS39-F003 — PASS — duplicate and missing-target detection are structurally bounded

Canonical-definition discovery is configured by ID family and existing authoritative surfaces rather than a second manually maintained relationship matrix.

### AS39-F004 — PASS — historical exceptions remain visible

`ML-DEVOS-AS-008` and `ML-DEVOS-AS-009` are not silently suppressed; they remain explicit warning-class findings with rationale.

### AS39-F005 — PASS — no S3/S7/S9 boundary breach

The implementation:
- does not define Task Contracts;
- does not store evidence packets or run QA;
- does not decide task acceptance, merge eligibility, deployment, or authority.

### AS39-F006 — PASS — focused tests cover the required core mechanisms

The focused suite covers:
- missing target;
- duplicate canonical definition;
- deterministic generation;
- historical exception visibility;
- orphan warning;
- non-authoritative marking;
- scan filtering.

Builder reports `7/7` focused tests and `345/345` full tests.

### AS39-F007 — PASS — WEB-REQ-009 is a genuine repository traceability gap

The generated finding for `WEB-REQ-009` is valid.

Independent inspection confirms:
- the canonical legacy Website Governance/Admin Plan defines `WEB-REQ-001` through `WEB-REQ-008`;
- `WEB-REQ-009` is nevertheless referenced broadly across the accepted Journal implementation, tests, RFC/AS/ADR, product docs, and runtime source.

This is not a generator defect.

It must remain reported and must **not** be silently fixed inside Traceability V1. A separate governed requirement-reconciliation change may address it after this implementation closes.

### AS39-F008 — BLOCKER — CORE-022 is an intentional non-reference mention, not a missing canonical target

The generator currently reports:

`ERROR [missing-canonical-target] CORE CORE-022`

from:
`docs/SENTINEL_REVIEW_NOTES.md`

Independent inspection of the exact source context shows:

`Do not create CORE-022 from these findings.`

The source intentionally asserts that no `CORE-022` record should exist.

Therefore this occurrence is **not a semantic cross-reference to a required canonical target**. Treating it as a hard missing-target ERROR is a false positive.

This matters because V1's stated purpose is referential-integrity checking. A negated/hypothetical identifier mention must not be indistinguishable from an actual durable reference.

## Required remediation

Builder must make one bounded parser/config enhancement that preserves visibility without converting this intentional non-reference mention into a hard missing-target error.

Preferred shape:

1. Add a small explicit configuration construct such as `intentionalNonReferences` / `referenceExceptions`.
2. Each entry must be narrowly scoped by:
   - ID;
   - exact file;
   - bounded line/context pattern;
   - human-readable reason.
3. A matched occurrence must remain visible as a WARNING such as:
   `intentional-noncanonical-mention`.
4. It must **not** globally suppress the ID. If the same ID appears elsewhere as a genuine unresolved reference, those other occurrences must still produce a missing-target ERROR.
5. Add focused tests proving:
   - an exact intentional non-reference occurrence becomes a visible WARNING;
   - a second genuine reference to the same missing ID still produces ERROR;
   - unrelated mentions are not suppressed.
6. Regenerate the real repository indexes.

For the current repository, the exact intentional occurrence is:
- ID: `CORE-022`
- file: `docs/SENTINEL_REVIEW_NOTES.md`
- context: the explicit conclusion `Do not create CORE-022 from these findings.`

## Expected post-remediation baseline

If no other defects emerge:
- `CORE-022` should move from ERROR to explicit intentional-non-reference WARNING;
- `WEB-REQ-009` should remain the one genuine ERROR;
- existing historical/orphan warnings remain visible unless the corrected parsing naturally changes counts.

The validator is allowed to exit non-zero because a genuine repository-content traceability ERROR remains. Traceability V1 can still be Architect-accepted if the validator accurately reports that external gap and its own implementation is correct.

## Non-scope during remediation

Do not:
- create `CORE-022`;
- add/fix `WEB-REQ-009`;
- rewrite historical RFC/AS/ADR/Decision content;
- begin S3 implementation;
- add CI/rulesets;
- change runtime/application code;
- change Sentinel version;
- touch remote resources;
- deploy;
- merge to `main`.

## Verdict

`ML-DEVOS-AS-039: CHANGES_REQUESTED — REMEDIATION CYCLE 1`

Single implementation blocker:
`AS39-F008`.

All other inspected Traceability V1 architecture/scope properties pass this review.

```
