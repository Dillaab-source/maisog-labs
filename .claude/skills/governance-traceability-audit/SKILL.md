<!--
  GENERATED FILE — DO NOT HAND-EDIT.
  This is a deterministic, non-diverging copy of the canonical Skill payload at:
    .agents/skills/governance-traceability-audit/SKILL.md
  Regenerate with: node scripts/generate-claude-skills-bridge.mjs
  Any manual edit here is detected as drift by scripts/validate-claude-skills-bridge.mjs
  (ML-DEVOS-RFC-014 / ML-DEVOS-AS-050 / D-042).
-->

---
name: governance-traceability-audit
description: Run Sentinel's deterministic referential-integrity check over governance IDs (RFC/AS/ADR/Decision/Risk/Test/requirement references) and report its ERROR/WARNING findings verbatim. Use when asked to check governance integrity, check traceability, run the validator, or verify cross-references are intact.
---

# Governance / Traceability Audit

This Skill is a thin, non-authoritative wrapper around an already-implemented, already-tested repository tool. It never re-implements or restates that tool's logic (`ML-DEVOS-RFC-012` / `ML-DEVOS-AS-037` §"AS37-F002").

## Activate when

- An explicit technical-integrity request: "check governance integrity," "check traceability," "run the validator," "verify cross-references."

## Do not activate when

- The request is a general review/judgment call about whether a change is architecturally sound (that is **Architect Review / Sync**, a different Skill).
- The request asks whether a *specific already-reported* gap has been *fixed* — this tool reports structural integrity, it does not confirm that a named gap was remediated. Answer that from the actual source record instead.

## Required inputs / context

Read-only repository access. No live `coordination/STATE.md` scope check is required beyond confirming this run is read-only (it is — the tool never mutates anything).

## Authoritative sources

- `devos/governance/traceability/README.md` — what the tool does, its finding taxonomy, and its known limitations.
- `devos/governance/traceability/generate-traceability.mjs` — the deterministic generator.
- `devos/governance/traceability/validate-traceability.mjs` — the validator; its exit code is 0 only when no ERROR-class finding exists.

## Procedure

1. Run `node devos/governance/traceability/validate-traceability.mjs` from the repository root.
2. Report the exit code and every ERROR/WARNING line verbatim, exactly as printed — never summarize away a finding.
3. If the on-disk generated index appears stale (the validator reports drift), say so and suggest `node devos/governance/traceability/generate-traceability.mjs` to regenerate — do not silently regenerate as part of "just checking."

## Output

The validator's own literal output (scanned file count, ID family count, ERROR count, WARNING count, and every individual finding line) plus the exit code.

## Stop / escalation conditions

- Never claim a reported ERROR is resolved on the strength of a clean run alone — a clean run only means no *new* structural defect was introduced; whether a previously known gap (e.g. a missing canonical requirement) was actually fixed must be checked against the real source record it names.
- If the validator itself errors out (crashes) rather than reporting findings, stop and report the crash — do not attempt to patch the tool as part of running it.

## Governance dependencies

None beyond read access to the repository. This tool has no authorization dependency of its own; it never grants, checks, or bypasses `AUTHORIZED_SCOPE`.

## Mutation / capability posture

**Read-only.** This Skill never mutates the repository and never grants any tool permission, credential, or capability. Per `CORE-002`/`CORE-008` ("Capability != Authority"), invoking this Skill confers no authority beyond what the acting session already has.

## Evaluation intent (see `tests/skills.test.mjs` for the executable form)

- **Positive:** "Check governance integrity" → runs the validator, reports its output.
- **Near-miss negative:** "Is `WEB-REQ-009` fixed yet?" → must not answer from the validator's mere non-crash; must check the actual source record (`docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`) instead.
