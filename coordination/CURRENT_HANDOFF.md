# Current Handoff — MaisogLabs V10-A Public Visual Baseline

```yaml
schema_version: 1
handoff_id: H-WEB-V10-A-0001
cycle_id: MAISOGLABS_WEB_V10_A
input_base_commit: 2986489cecf4b78f42953313686513cb06cdc69d
review_target_commit: 2986489cecf4b78f42953313686513cb06cdc69d
applicable_review_id: ML-DEVOS-AS-118
```

This handoff is evidence, not authority. The Builder does not self-approve, and all implementation and visual evidence reported here is `ACTOR_REPORTED` unless a narrower classification is stated.

## Objective

Deliver the D-090 / RFC-021 V10-A public static visual baseline under `DIR-WEB-V10-A-0001`: the approved V10 composition, fixed local media and self-hosted fonts, eight-project content, canonical routing, bounded design-runtime mapping, accessibility corrections D1/D2, tests, and local visual evidence. No admin, backend, production, or deployment work is included.

## Changed files

- Public composition and runtime: `app/layout.js`, `app/globals.css`, `app/v10.css`, `app/DesignRuntime.js`, `components/site/**`, `data/site.js`, `lib/content/schema.mjs`, `lib/design/**`.
- Fixed runtime media and self-hosted fonts: `public/v10/**`, including `public/v10/ASSET_MANIFEST.md` and the retained OFL license texts.
- V10 contract and disclosure: `docs/product/V10_IMPLEMENTATION_CONTRACT.md`, `docs/product/V10_DIVERGENCE_REGISTER.md`.
- Local visual evidence: `docs/product/evidence/v10/**`.
- Focused checks: `tests/content.test.mjs`, `tests/design-overlay.test.mjs`, `tests/website-redesign.test.mjs`, `tests/v10-baseline.test.mjs`, `tests/v10-theme.test.mjs`.
- Protocol return: `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`, and `coordination/archive/directives/DIR-WEB-V10-A-0001.{md,provenance.json}` plus its index row.

No Worker, migration, package, lockfile, admin, Cloudflare, D1, R2, Access, DNS, main-branch, PR #7, PR #10, S6/S7, or D-068 file or state was changed.

## Tests and evidence

- `npm run build`: PASS. The static export produced `/`, `/admin`, and `/journal`.
- Focused V10/design/routing tests: PASS, 35/35.
- Content and D1 compatibility tests: PASS, 46/46.
- `git diff --check`: PASS.
- Desktop and compact views were inspected interactively; Entry, Systems, Projects, Research/Journal, Contact, compact menu, canonical routes, and the mail link were exercised.
- Three local screenshots and their SHA-256 hashes are recorded in `docs/product/evidence/v10/README.md`.
- The approved source-media hashes and font sources/licenses are recorded in `public/v10/ASSET_MANIFEST.md`.
- The outgoing directive is archived byte-for-byte as blob `5ca116d7e64df5eb3c88f6fbac0bc140969b7e62`.

## Unresolved findings and limitations

- Full `npm test` was attempted but is not green on this Windows host. Failures are outside the V10-A surfaces and include the repository's fail-closed S6 Windows isolation checks, child fixtures that launch with an empty environment and cannot locate `git`, and existing skill-frontmatter/bridge assertions. No prohibited S6, governance-skill, Worker, migration, package, or lockfile change was made to bypass them. The V10-focused, content/D1 compatibility, and build gates above pass.
- The local static server does not run the separate Worker/D1 Journal API; Research correctly displayed its explicit load-error state during local static-only inspection. This is not production verification and does not diagnose or repair the separately held API incident.
- D1–D5 are deliberate, accepted differences from prototype mechanics/content and are disclosed in `docs/product/V10_DIVERGENCE_REGISTER.md`.
- V10-B admin work, API diagnosis/fix, theme publication, production verification, merge, and deployment remain separate and unauthorized.
- Every unresolved row in `coordination/OPERATIVE_OBLIGATIONS.md` remains carried forward unchanged. S6 remains parked at ML-DEVOS-AS-103; O1 and O2 remain open.

## Governing references

- Authority: D-090.
- Architecture: accepted `ML-DEVOS-RFC-021`.
- Controlling review: `ML-DEVOS-AS-118`, including mandatory finding AS118-F001.
- Directive: `DIR-WEB-V10-A-0001` (archived and deselected by this return).
- Product plan: `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- `docs/product/V10_IMPLEMENTATION_CONTRACT.md`.
- `docs/product/V10_DIVERGENCE_REGISTER.md`.
- `docs/product/evidence/v10/README.md` and the three PNG captures beside it.
- `public/v10/ASSET_MANIFEST.md` and `public/v10/**`.
- `tests/v10-baseline.test.mjs`, `tests/v10-theme.test.mjs`, `tests/design-overlay.test.mjs`, `tests/website-redesign.test.mjs`, `tests/content.test.mjs`, and `tests/d1-migration.test.mjs`.
- `coordination/archive/directives/DIR-WEB-V10-A-0001.md` and its provenance record.

## Next action

The Architect independently reviews this V10-A result under the next unused immutable Architect Sync ID after ML-DEVOS-AS-118. Acceptance, V10-B, API work, theme publication, main merge, deployment, and production verification require separate governed transitions.
