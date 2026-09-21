# ADR-009: Adopt the WEB-INC-007 Theme / Design Controls subsystem

Status: `ACCEPTED`

Related:
- `ML-DEVOS-RFC-010`
- `ML-DEVOS-AS-030`
- `D-032`
- `ML-DEVOS-AS-031`
- `D-033`
- `ML-DEVOS-AS-032`
- `ML-DEVOS-AS-033`

Initial implementation:
- `17577838d1007210cd1893fdb71ea8063d764fa8`

Remediation:
- `9773d76641bef0b9f57b94d78087438f4d2ffc15`

## Decision

MaisogLabs adopts the local/repository Theme / Design Controls subsystem with:

- exactly `theme_settings` and `theme_settings_revisions`;
- existing `sections` / `section_revisions` for visibility/order;
- bounded authenticated theme/section draft and publish controls;
- authenticated real visual draft preview;
- published-only `GET /api/design`;
- client-side fixed-mapping design application on static pages;
- bounded preset/enum/range design vocabulary;
- screenshot-reference workflow:
  `REFERENCE → ARCHITECT ANALYSIS → CONTROL MAPPING → DRAFT → VISUAL PREVIEW → PAULO REVIEW → PUBLISH`;
- fail-safe V3 + UI-PATCH-001 baseline;
- no arbitrary CSS/JS/HTML/URLs/selectors/colors/font URLs/R2 keys.

DESIGN-008 overlay intensity uses a two-layer bounded mapping so the full allowed range `40..85` is meaningful while `68` preserves the accepted baseline.

## Resource and release boundary

This ADR does not authorize or claim:

- remote D1;
- remote R2;
- production Cloudflare Access configuration;
- public R2 media-object serving;
- homepage/projects public D1 content cutover;
- SSR conversion;
- deployment;
- protected/main merge;
- production verification.

D1/R2 remain `remote: false`.

## Roadmap consequence

WEB-INC-007 is the eighth and final dependency-ordered core WEB increment.

All eight core WEB increments are architecturally accepted at repository/local level.

Core WEB roadmap status:

`COMPLETE — LOCAL/REPOSITORY`

Production/release work remains a separately governed future phase.

## Sentinel impact

- Frozen architecture remains `ML-DEVOS-ARCH-001 / v1.2.0`.
- Active governance-capability baseline remains `v1.5.0`.
- No Sentinel S3+ capability is created by this ADR.
