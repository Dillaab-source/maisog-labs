# Architect Review — WEB-REL-002 Release-Scope Architecture Review

Architect Sync: ML-DEVOS-AS-113
Status: ARCHITECT_APPROVED — WEB-REL-002 DIRECT GOVERNANCE→MAIN RELEASE SHAPE ACCEPTED; RELEASE ACTIONS REMAIN OWNER-GATED
Review mode: RELEASE REVIEW (scope/shape only)
Cycle: MAISOGLABS_WEB_RELEASE_READINESS_REVIEW
Authority: D-083
Reviewed live Builder return: 613fc8f59a81c4f287f25e3f48846562c611b6b7
Reviewed handoff: H-WEB-RELEASE-READINESS-0001
Release artifact: docs/release/WEB_REL_002_RELEASE_SCOPE_REVIEW.md
Controlling prior review: ML-DEVOS-AS-112
Live protocol: PROTOCOL_VERSION 2

Publication provenance: Paulo relayed the Architect's verdict and findings in the Builder session as a structured instruction, not as an exact-byte file package. The Builder transcribed them into this review without adding findings of its own, and published it as mechanical publisher. The verdict is the Architect's. The Builder does not self-approve.

## Verdict

`ARCHITECT_APPROVED — WEB-REL-002 DIRECT GOVERNANCE→MAIN RELEASE SHAPE ACCEPTED; RELEASE ACTIONS REMAIN OWNER-GATED`

## Independent repository findings

The Architect independently verified these references:

| Reference | SHA |
|---|---|
| `main` | `882ad253b5dbec06b209d1ee1a2a54b21b392e2e` |
| Accepted AS-112 governance content | `2cdbf4468d500163f84ab9a06c5232b6614f34b8` |
| Release-review Builder tip | `613fc8f59a81c4f287f25e3f48846562c611b6b7` |
| main/governance merge base | `3262dbad4b2e18998586e125b1d34702211862c1` |

It also verified that:
- main is one merge commit off the governance ancestry;
- main's released content tree corresponds to the earlier governance release content;
- the accepted release delta contains 261 files;
- `devos/execution/**` contributes 24 repository files;
- `devos/capabilities/**` contributes 33 repository files.

**Unchanged paths.** The Architect independently confirmed that the accepted main→AS-112 release delta contains no changes under:
- `worker/**`
- `migrations/**`
- `wrangler.jsonc`
- `package.json`
- `package-lock.json`
- `.github/workflows/**`
- `public/**`
- `next.config.mjs`

**Production-facing surface.** The production-facing website/admin source delta is the identified 13-file surface:
- `app/page.js`
- `app/globals.css`
- `app/DesignRuntime.js`
- `app/admin/DesignControls.js`
- `components/site/SpatialShell.js`
- `components/site/SystemsSurface.js`
- `components/site/ProjectsSurface.js`
- `components/site/ResearchSurface.js`
- `components/site/ContactSurface.js`
- `components/site/useListKeys.js`
- `components/site/routes.mjs`
- `data/site.js`
- `lib/content/schema.mjs`

## Release shape finding

Option A is accepted: a fresh direct `governance/maisoglabs-v0.1 -> main` release PR.

Do not create a selective website-release branch unless a later concrete blocker invalidates the direct-merge approach.

The Architect accepts these reasons:
- it preserves the already-reviewed governance tree and history;
- it avoids manually reconstructing the accepted website change set;
- it keeps acceptance/governance records with the source they govern;
- it avoids long-term main/governance divergence;
- it preserves the existing release pattern established by WEB-REL-001;
- repository-only S5/S6 material does not itself grant runtime or governance authority.

## S5/S6 on main

S5/S6 repository content being present on main does NOT:
- activate S6;
- authorize S6 execution;
- authorize a real execution driver;
- authorize remote transport;
- grant production authority;
- make S5/S6 part of the website Worker runtime merely by being stored in the repository.

S6 remains parked at ML-DEVOS-AS-103. O1 and O2 remain open. D-068 remains suspended and untouched.

Paulo must explicitly acknowledge that this repository-only S5/S6 history is included when authorizing Gate B / Gate C.

## Cloudflare qualification

The Builder's statements about current production admin/design behaviour and Cloudflare configuration are partly derived from source and configuration. They are not a fresh observation of live Cloudflare production state.

ML-DEVOS-AS-074 previously verified that production Git builds use `npx wrangler versions upload`, and that merge and production promotion were decoupled under D-057. That external configuration can drift. Therefore:
- it is NOT a blocker to release-scope acceptance;
- it is NOT a blocker to opening Gate B;
- it IS a mandatory Gate C precondition to freshly re-verify the Cloudflare production build command and the current active Version ID before any merge.

## PR #7 and PR #10

The Architect independently confirmed that PR #7 is still open and targets main. It is unrelated to WEB-REL-002 and must not be merged or folded into this release merely because it exists.

PR #10 remains DO NOT MERGE.

## Evidence classification

**Architect independently inspected:**
- live STATE;
- `H-WEB-RELEASE-READINESS-0001`;
- the D-083 directive, archive and provenance;
- `WEB_REL_002_RELEASE_SCOPE_REVIEW.md`;
- the main/governance ancestry;
- the exact 261-file GitHub diff;
- the unchanged production configuration/code categories listed above;
- the CI workflow;
- ML-DEVOS-AS-074;
- D-054 through D-057;
- PR #7 state.

**Remains ACTOR_REPORTED:**
- `npm test` 919/919;
- `npm run build`;
- the 40-file `out/` scan;
- the Builder's local Worker import-graph walk;
- local worktree state;
- the untracked D-068 statement.

These limitations do not block release-shape acceptance.

## Gates

AS-113 authorizes no release mutation. The accepted sequence is below.

### Gate B

- Needs a separate Paulo authorization.
- Open one fresh `governance/maisoglabs-v0.1 -> main` release PR.
- D-055 non-production preview behaviour is allowed.
- `test-and-build` must be green on the exact final PR head.
- Inspect the full final release diff.
- Verify main-protection and the ruleset.
- No merge.

### Gate C

- Needs a separate Paulo authorization after the Gate B Architect review.
- Freshly verify the Cloudflare production-build configuration.
- Record the current active production Version ID.
- Merge only the exact authorized/pinned PR head, as a normal merge commit.
- Confirm the uploaded Worker version, if the Git integration builds.
- Confirm the active production Version ID did not change automatically.

### Gate D

- Needs a separate Paulo production-promotion authorization.
- The exact uploaded Version ID must be named.
- The MEDIA_GAP must receive an explicit Paulo disposition before public promotion.

### Runtime verification

A separate governed verification after promotion, covering:
- Entry, Systems, Projects, Research, Contact and Journal;
- admin fail-closed behaviour;
- design API baseline behaviour;
- Journal API behaviour;
- 404 behaviour;
- the active Version ID;
- confirmation that no unintended D1/R2/Access/DNS mutation occurred.

## Rollback

There are two separate rollback concepts:
- **Runtime rollback:** a separately authorized Cloudflare promotion back to the previously known-good Version ID.
- **Source rollback:** a normal revert PR against main.

Never force-push main.

## Transition

This transition:
- publishes this review and its byte-identical immutable archive;
- archives and deselects `H-WEB-RELEASE-READINESS-0001`;
- keeps `PROTOCOL_VERSION: 2`, `CURRENT_DIRECTIVE: NONE` and `CURRENT_HANDOFF: NONE`, with all selector fields empty;
- keeps every action-specific authorization flag `NO`.

## Not authorized

Do NOT:
- open the release PR;
- merge anything;
- deploy anything;
- promote a Cloudflare version;
- mutate D1, R2, Access or DNS;
- start V2B;
- resume S6/S7;
- touch D-068;
- merge PR #7;
- merge PR #10.

## Routing

`TURN: PAULO`

`STATUS: ARCHITECT_APPROVED`

`AUTHORIZED_SCOPE: AS113_WEB_REL_002_RELEASE_SHAPE_ACCEPTED_PAULO_GATE_B_DECISION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: NO`

`PAULO_DECISION_REQUIRED: YES`
