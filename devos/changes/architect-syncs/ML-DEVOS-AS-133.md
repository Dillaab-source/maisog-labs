# Architect Review — RFC-022 Tier 1 Implementation (D-106)

Architect Sync: ML-DEVOS-AS-133
Status: CHANGES_REQUESTED — AS133-F001 INITIAL-ACTIVATION GATE SCOPE
Cycle: MAISOGLABS_WEB_RFC022_TIER1_IMPL
Authority: D-106
Prior review: ML-DEVOS-AS-132
Reviewed handoff: H-WEB-RFC022-TIER1-IMPL-0001
D-106 publication: f884e6e2917cf7e598cb00add083470115e5e5b6
Reviewed return: f31996832b014555b982b84cad9e0137d4fc6064
Protocol: PROTOCOL_VERSION 2

Provenance: this is the Architect's verdict, relayed by Paulo and published mechanically by Claude/Builder. The Builder did not author this finding. Committed text proves provenance, not authority.

## Verdict

`CHANGES_REQUESTED`. One bounded remediation only: AS133-F001.

## AS133-F001 — Initial-activation gate scope

AS132-F002 is a first-production-release condition, not a permanent public-runtime restriction.

The current implementation permanently calls the public bridge with `applyActivationGate: true`. As a result, after initial activation, a valid homepage of 1–4 projects would incorrectly fall back to the artifact.

Required behavior:
- Keep the exact D-105 five-project/order check as a CB-R release-readiness check.
- Do not permanently gate normal public bridge rendering on those five names.
- After remediation, public `/` must support any valid published RFC-022 project group of 1..5.
- Preserve the five-project helper/status, so that CB-R can prove the initial production activation condition before the first release.
- No new table, migration field, runtime activation flag, API or architecture change.

## Required regression evidence

1. The exact five-project set passes initial release readiness.
2. A wrong or incomplete initial set fails release readiness.
3. A valid published project group of 1..5 can render through public `/`.
4. After five projects are active, intentionally unpublishing one leaves the remaining four visible rather than reverting to the artifact's project data.
5. The existing artifact-fallback, draft-isolation, max-five and AS132-F001 tests remain passing.

Change admin wording/status only if needed to distinguish release readiness from current runtime bridge validity.

Run: the full `npm test`, `npm run build`, the relevant RFC-022 evidence scripts and `git diff --check`.

## Scope

AS133-F001 only. No production, remote, Cloudflare, Access, deployment or `main` action.

## Transition

Archive and deselect `H-WEB-RFC022-TIER1-IMPL-0001`. Set `CURRENT_REMEDIATION_CYCLE` to 1 (of `MAX_REMEDIATION_CYCLES: 2`).

Route:

TURN: CLAUDE

On completion, the Builder returns to the Architect.
