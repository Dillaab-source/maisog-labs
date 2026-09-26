# Architect Review — ML-DEVOS-RFC-021 V10 Canonical Visual Baseline

Architect Sync: ML-DEVOS-AS-118
Status: ARCHITECT_APPROVED — RFC-021 READY FOR PAULO ACCEPTANCE DECISION
Cycle: MAISOGLABS_WEB_V10_RFC021_DRAFT
Authority: D-088
Prior review: ML-DEVOS-AS-117
Reviewed handoff: H-WEB-V10-RFC021-0001
Reviewed exact governance tip: c7b9409b5353d397e17f4e730e66a2e7ffacabcf
Reviewed drafting base: 4c436a8a1f8768ea2fdbf377ef22f9717ccfb810
Main baseline: aebc881e8890c00090d714602591138a045bd3b0
Protocol: PROTOCOL_VERSION 2
Review mode: CHANGE REVIEW

## Verdict

`READY TO COMMIT: YES WITH FOLLOW-UP`

RFC-021 is architecturally coherent, satisfies D-088 and AS-117, stays inside drafting-only authority, and is ready for Paulo's separate acceptance decision. This review does not accept the RFC on Paulo's behalf and grants no implementation authority.

## SENTINEL sync

| Plane | Architect finding |
|---|---|
| Authority | D-088 authorized RFC-021 drafting only. The Builder stayed within that boundary. |
| Context | The review used one exact snapshot, `c7b9409b5353d397e17f4e730e66a2e7ffacabcf`, after the mandatory Protocol V2 bootstrap passed. |
| Capability | Only repository and local artifact reads were needed. No application, Cloudflare, D1, R2, Access, DNS, domain, secret, environment, media, merge, deployment, promotion, rollback, or API-diagnosis capability was exercised. |
| Execution | The return adds the RFC draft and index row plus Protocol V2 bookkeeping only. |
| Evidence | Repository bytes, Git scope, RFC-010 anchors, migration values, directive archival identity, and main were independently checked. |

## Exact-snapshot evidence

- RFC Git-object SHA-256: `9e3fb60d7e652ade4573616b05e7329de1cdebc1e37b9d5d66b4ad7c7a5b16e7`; 254 lines.
- The exact diff `4c436a8a1f8768ea2fdbf377ef22f9717ccfb810..c7b9409b5353d397e17f4e730e66a2e7ffacabcf` changes only:
  - `devos/changes/rfcs/ML-DEVOS-RFC-021.md`;
  - `devos/changes/rfcs/README.md`;
  - `coordination/CURRENT_HANDOFF.md`;
  - `coordination/STATE.md`;
  - the `DIR-WEB-V10-RFC021-0001` archive, provenance, and directive index.
- No `app/**`, `components/**`, `data/**`, `lib/**`, `worker/**`, `migrations/**`, `public/**`, `.github/workflows/**`, `wrangler.jsonc`, `package.json`, `package-lock.json`, or `next.config.mjs` content changed.
- `git diff --check` passes.
- `origin/main` remains `aebc881e8890c00090d714602591138a045bd3b0`.
- The directive archive and the exact outgoing directive share Git blob `f7ae75b9d21049668271f9e9128836d6dd51c6d3`.
- Migration 0005 independently confirms stored ranges `55..90` and `10..45`, and the seeded values `74/25`.
- The RFC-010 V3/soft-geometry anchors listed as S1–S7 are present in RFC-010 and are narrowly superseded rather than rewritten.

## D-088 and AS-117 compliance

RFC-021 correctly:

1. establishes V10 as the static, code-owned fail-safe baseline that does not depend on D1 or `/api/design`;
2. limits RFC-010 supersession to the V3/soft-geometry baseline, composition, and default-parity clauses;
3. preserves authentication, positive allowlists, stale-write protection, immutable revisions, draft/preview/publish lifecycle, published-only projection, and arbitrary-input prohibitions;
4. preserves V2A as historical accepted work;
5. records the eight unique projects with ClinicFlow once and requires factual, plain-language, content-source-backed copy;
6. records `paulo.maisog@maisoglabs.com`;
7. makes `#journal` canonical and `#research` a compatibility alias for the same surface;
8. records D1 accessible compact/mobile navigation and D2 narrow Systems-label correction as pre-approved divergences;
9. requires runtime normalization/clamping of opacity to `80..90` and border intensity to `10..25`, including stale persisted and direct API-shaped values;
10. requires removed-from-UI fields to have no runtime effect;
11. keeps API-DIAG separate and unauthorized;
12. grants no V10-A or V10-B implementation authority.

## Architecture and security findings

- The supersession mechanism respects accepted-RFC immutability and avoids silently reinterpreting RFC-010.
- Runtime clamping is correctly independent of the admin client and server persistence range.
- Invalid numeric inputs fail to V10 canonical values; older valid stored values are bounded before visual effect.
- Removed controls remain valid stored data but cannot redefine the public presentation.
- Fixed local mappings, source-controlled assets, self-hosted fonts, no remote runtime dependencies, and no arbitrary CSS/HTML/JavaScript/URL/asset inputs preserve the existing security model.
- The disclosed seeded 74/25 consequence is accurate: it becomes 80/25 under the proposed mapping, while API failure renders exact static V10. A later 90/16 theme publication remains a separate owner-authorized action.
- The visual-parity method, divergence register, accessibility evidence, and explicit future implementation tests are adequate acceptance gates.

## SU contradiction check

Mode: `BOUNDED_CONTRADICTION`.

- RFC-010's accepted V3 baseline conflicts with V10; S1–S7 resolve only that conflict.
- V10 prototype runtime, remote fonts, free-text media props, and placeholder content remain evidence rather than production authority.
- Wider persisted server ranges do not weaken the V10 range because runtime normalization is mandatory for published, preview, stale, and direct API-shaped values.
- D1/D2 intentionally diverge from defective narrow-screen prototype behavior and are explicitly owner-approved.
- API-DIAG, media integration, V10-A, and V10-B remain separate work.

Disposition: `CLEAR_WITH_NOTES`.

## Follow-up findings

- **AS118-F001 — implementation acceptance:** RFC §7.2 requires the V10-exact overlay point to be documented but does not name its numeric value. Before any V10 implementation can be accepted, its bounded implementation contract and tests must lock the exact overlay input-to-opacity mapping, including the V10-exact point, monotonicity, invalid fallback, and range boundaries. This creates no authority to implement now.
- **AS118-F002 — handoff pointer only:** the handoff maps the AS-117 range tests to RFC §13 items 4–5; the actual clamp table is item 3 and ignored-field test is item 4. The RFC text itself is correct, so this evidence-navigation error is non-blocking and the immutable handoff is not rewritten.
- The missing RFC-020 index row predates this cycle and remains outside D-088 scope.

## Evidence classification

The RFC bytes, diff scope, anchors, migration values, archive identity, and main SHA above are Architect-verified repository evidence.

Builder claims about its own drafting process and publication remain `ACTOR_REPORTED` unless independently reproduced. No browser rendering or production behavior was part of this documentation-only return.

## Operative obligations and boundaries

Every unresolved row in `coordination/OPERATIVE_OBLIGATIONS.md` is preserved. S6 remains parked at ML-DEVOS-AS-103; O1 and O2 remain open; D-068 remains suspended; PR #7 and PR #10 remain unmerged; V2B, S6, and S7 remain unauthorized; and the known API incident remains open and temporarily accepted under AS-116.

## Transition

This transition:

- publishes ML-DEVOS-AS-118 and its byte-identical immutable archive;
- archives and deselects `H-WEB-V10-RFC021-0001` byte-for-byte with provenance;
- keeps `CURRENT_DIRECTIVE: NONE` and clears all directive selectors;
- clears all handoff selectors;
- routes to `TURN: PAULO`, `STATUS: ARCHITECT_APPROVED`;
- keeps every action-specific authorization flag `NO`.

## Not authorized

RFC acceptance, V10-A/V10-B implementation, API diagnosis/fix, application/admin/Worker/runtime changes, migrations, packages, media integration, Cloudflare/resource mutation, main merge, deployment, promotion, rollback, or any other production action.

## Routing

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: AS118_RFC021_PAULO_ACCEPTANCE_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`
