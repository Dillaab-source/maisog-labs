# ML-DEVOS-RFC-011: MaisogLabs Production Release Readiness Gate

Status: `UNDER_ARCHITECT_SYNC`

Change class: `LOCAL_RULE`

Project scope:
- MaisogLabs release process only

Phase:
- `WEB-REL-001 — Production Release Readiness`

## Proposal

Adopt the assessment process defined in:

`docs/release/WEB_REL_001_PRODUCTION_READINESS.md`

The project has completed its eight dependency-ordered core WEB increments at repository/local level, but production/release state is materially different:

- `main` remains behind the governed branch;
- no GitHub ruleset or protected branch is currently present;
- no GitHub Actions workflow/check is present;
- Cloudflare Access values are placeholders;
- D1/R2 bindings are local-only;
- no production deployment has been authorized;
- no runtime production verification exists.

Before any main merge or production operation, apply CORE-019/020/021 explicitly.

## Classification rationale

`LOCAL_RULE`.

This RFC does not change Sentinel core policy or application architecture. It defines the project-specific release-readiness procedure required to apply existing Sentinel rules.

Architect Sync is still required because this project-local rule directly operationalizes CORE-019, CORE-020, and CORE-021 at the first release boundary.

## Authority requested

Authorize Claude to perform **assessment-only repository/local work**:

- inspect and document release state;
- run local/read-only/dry-run checks;
- reconcile current-state release documentation;
- create the release-readiness packet;
- recommend GitHub protections and CI design;
- recommend exact later Cloudflare resource scopes;
- produce rollback and runtime-verification plans.

No remote infrastructure, merge, deployment, protection mutation, CI activation, or production write authority is requested.

## Acceptance

Architect approval plus Paulo authorization opens an assessment-only Claude turn.

A separate future decision is required for every real remote/protected-main action.
