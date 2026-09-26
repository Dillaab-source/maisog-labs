# Architect Review — MaisogLabs V10 Visual Parity + Admin Architecture Plan

Architect Sync: ML-DEVOS-AS-117
Status: ARCHITECT_APPROVED — V10 VISUAL PARITY + ADMIN ARCHITECTURE PLAN READY FOR OWNER DECISION, WITH RUNTIME-ENFORCED V10 RANGE REQUIREMENT
Cycle: MAISOGLABS_WEB_V10_PLANNING
Authority: D-087
Prior review: ML-DEVOS-AS-116
Reviewed handoff: H-WEB-V10-PLAN-0001
Reviewed exact governance tip: dd9cf32d316d90c7c655c394f11fe94cf051a144
Reviewed planning base: 7ec56d117e215c300cf3f55ce328e7075a23286e
Main baseline: aebc881e8890c00090d714602591138a045bd3b0
Protocol: PROTOCOL_VERSION 2
Review mode: CHANGE REVIEW

## Verdict

`ARCHITECT_APPROVED — V10 VISUAL PARITY + ADMIN ARCHITECTURE PLAN READY FOR OWNER DECISION, WITH RUNTIME-ENFORCED V10 RANGE REQUIREMENT`

The D-087 planning return is coherent, bounded, and ready for Paulo's decisions. Implementation remains **NOT AUTHORIZED**.

## SENTINEL sync

| Plane | Architect finding |
|---|---|
| Authority | D-087 authorized planning only. The Builder stayed within that boundary. |
| Context | The review used one exact snapshot, `dd9cf32d316d90c7c655c394f11fe94cf051a144`, after the mandatory Context Bootstrap check passed. |
| Capability | Repository and local artifact reads were sufficient. No Cloudflare, D1, R2, Access, DNS, domain, secret, environment, merge, deployment, promotion, rollback, media-integration, or runtime mutation capability was exercised. |
| Execution | The return contains the requested plan and Protocol V2 bookkeeping only. |
| Evidence | Repository bytes and Git facts below are independently verified. Builder screenshots and rendering observations remain `ACTOR_REPORTED`. |

## Exact-snapshot evidence

- The plan contains all 20 numbered required sections.
- `design-references/claude-v10/source/Maisog Labs Home v10.dc.html` hashes to `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`.
- Every asset listed in plan §3.1 matches the repository byte hash and byte count:
  - `plate-hero-v4.png`: `afb05bc4ccb5cfd00577e20c236670cb4769faca8e046816822ba341ba5c4ec4`, 2,407,344 bytes;
  - `logo-mark.mp4`: `ac6124585dc489d88f38ac57a2b8729863486c78b51e59a64ec8ab0734225ed4`, 3,736,250 bytes;
  - `logo-mark-poster.png`: `931e2fc037832c27b084bcca0df5a683c9c28376ac78b77cbbe24db8ecd9c851`, 373,851 bytes;
  - `plate-aqueduct-v4.png`: `285ac4b3b2f4be7033bfc3e3b32f7d6b0397aca9f197702c780f071f2fe21928`, 2,593,327 bytes;
  - `favicon.svg`: `b34acfe1395e080c2d551982d6e5c550171b6b877ec535de4f4dc60ae3676d04`, 8,384 bytes;
  - `icons/01-ai.svg`: `380672cca0e810d1f213dd1150f587c210e5937f22260c9563c8fccfd6e9537d`, 11,492 bytes;
  - `icons/02-automation.svg`: `7ca3b747160b5734e15a8a53a071cc1347efb96f90e4c7b455bdf903e147df6c`, 13,232 bytes;
  - `icons/03-security.svg`: `c1e5481fdbb6086ec71d579e30da5a8bd5d2b8f749bfcb11f6b01bb47a95bb95`, 11,080 bytes;
  - `icons/04-research.svg`: `ea27af84196270fd74df9880c95879a44f49533c73959f89a7361bc7d560316f`, 11,175 bytes;
  - `icons/05-systems.svg`: `be8373dc0c2d9618fbeeb0b91555416ef249c38ae036ebbdf81eed8d30f3e05d`, 12,472 bytes;
  - `icons/08-strategy.svg`: `2b55c4fd582a6064a48fc5e226874175047f0483f1016f9a02d7908d6f9b1b8a`, 11,668 bytes.
- The archived `DIR-WEB-V10-PLAN-0001` and the outgoing live directive have the same Git blob, `6e1e9ae5616b6de44ffc41fa3e24fe8cec115034`, and are byte-identical.
- The exact diff `7ec56d117e215c300cf3f55ce328e7075a23286e..dd9cf32d316d90c7c655c394f11fe94cf051a144` changes only the planning handoff/state, directive archive/provenance/index, and the V10 plan.
- That return changes no `app/**`, `components/**`, `data/**`, `lib/**`, `worker/**`, `migrations/**`, `public/**`, `.github/workflows/**`, `wrangler.jsonc`, `package.json`, `package-lock.json`, or `next.config.mjs` content.
- `git diff --check` passes for the exact reviewed diff.
- `origin/main` remains `aebc881e8890c00090d714602591138a045bd3b0`.

## Required RFC-021 and implementation acceptance condition

The plan's tighter V10 admin ranges must be enforced by the **runtime mapping**, not merely by the admin client.

RFC-021 and every later V10 implementation acceptance packet must require all of the following:

1. `panelOpacityPct` is normalized and clamped at runtime to the approved V10-centred range `80..90`.
2. `borderIntensityPct` is normalized and clamped at runtime to `10..25`.
3. Stale persisted values and direct API submissions that remain legal under RFC-010's older server ranges cannot drift the canonical V10 presentation outside those tighter ranges.
4. Fields removed from the admin UI remain ignored by the runtime mapping, including stale persisted values.
5. Tests cover both stale stored values and direct API-shaped values at and beyond the V10 boundaries.

This is an architecture and acceptance requirement. It grants no authority to modify runtime, admin, API, schema, or Worker code now.

## Architecture findings

- RFC-021 is the correct immutable mechanism for making V10 the static fail-safe visual baseline while superseding RFC-010 only where RFC-010 fixes the V3/soft-geometry visual baseline, composition, and default-parity target.
- RFC-010's authentication, positive allowlists, stale-write protection, immutable revisions, draft/preview/publish lifecycle, public published-only projection, and prohibition on arbitrary CSS, HTML, JavaScript, URLs, and asset inputs must remain intact.
- V2A remains historical accepted work and is not retroactively redefined.
- V10 source markup, CDN runtime, placeholder facts, and free-text props are design evidence, not runtime authority.
- The static V10 baseline must survive `/api/design` failure without D1.
- API-DIAG remains a separate, unauthorized track.

## SU contradiction check

Mode: `BOUNDED_CONTRADICTION`.

- The V10 artifact conflicts with RFC-010's V3/soft-geometry composition and baseline clauses; RFC-021 must explicitly and narrowly supersede those clauses.
- The V10 prototype's Google Fonts and free-text `plateVideo` mechanism conflict with the accepted no-remote/no-arbitrary-input rules; production must use source-controlled assets and fixed mappings.
- Prototype project copy and contact facts are not automatically approved content.
- Strict mobile pixel parity would reproduce the clipped navigation and Systems label collision; any correction requires an owner-approved divergence register.
- No contradiction justifies combining API diagnosis/fix, media integration, or implementation into RFC-021 drafting.

## Evidence classification

The Architect independently reproduced repository hashes, byte identity, Git scope, `main`, and `git diff --check`.

The Builder's screenshots, browser dimensions, font fallback, no-overflow observation, clipped-nav observation, overlapping-label observation, and local-render description were not independently reproduced in this review. They remain `ACTOR_REPORTED` and may inform planning but are not upgraded to Architect-verified evidence.

## Operative obligations and boundaries

Every unresolved row in `coordination/OPERATIVE_OBLIGATIONS.md` is preserved. In particular:

- S6 remains parked at `ML-DEVOS-AS-103`;
- O1 and O2 remain open;
- D-068 remains suspended and untouched;
- PR #7 and PR #10 remain unmerged;
- V2B, S6, and S7 remain unauthorized;
- the production API incident remains open and temporarily accepted under AS-116.

## Transition

This transition publishes this review and its byte-identical immutable archive; archives and deselects `H-WEB-V10-PLAN-0001` byte-for-byte with provenance; clears handoff selectors; keeps `CURRENT_DIRECTIVE: NONE`; routes to Paulo; and keeps every action-specific authorization flag `NO`.

## Not authorized

No RFC-021 drafting, V10-A/V10-B implementation, API diagnosis/fix, application or Worker change, migration, media integration, Cloudflare/resource mutation, main merge, deployment, promotion, rollback, or production action is authorized by AS-117.

## Routing

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: AS117_V10_PLAN_PAULO_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`
