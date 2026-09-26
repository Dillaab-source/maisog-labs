# Current Directive — WEB-REL-002 Gate D: Exact Production Promotion and Runtime Verification

```yaml
schema_version: 1
directive_id: DIR-WEB-REL-002-GATE-D-0001
cycle_id: MAISOGLABS_WEB_REL_002_GATE_D
issue_parent_commit: edd4bce5fa9fa07b28237b893c078ebbd234ba2b
target_turn: CLAUDE
authority_ref: D-086
applicable_review_id: ML-DEVOS-AS-115
sentinel_disposition: CLEAR
su_mode: ESCALATED_RESEARCH
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, `D-086`, `ML-DEVOS-AS-115` and this directive.

## Objective

Promote exactly Worker Version `a667fc09-12d1-4fde-a75d-5d660729baa3` to 100% production traffic for `maisog-labs`, immediately verify the active deployment, then perform bounded read-only production runtime verification.

## Preconditions

- Protocol V2 passes at exact issue parent `edd4bce5fa9fa07b28237b893c078ebbd234ba2b`.
- `main` remains `aebc881e8890c00090d714602591138a045bd3b0`.
- Successful main build `19ecd52a-b178-47dd-8d23-64b5590a61ef` produced target Version `a667fc09-12d1-4fde-a75d-5d660729baa3`.
- No newer main release supersedes the target.
- The target remains deployable and inactive.
- Immediately before promotion, freshly read the active deployment and require it to be unchanged from the recorded baseline. Any unexpected production change is a stop condition.

## Governing references

- Owner authority: `D-086`.
- Controlling review: `ML-DEVOS-AS-115`.
- Release merge: `aebc881e8890c00090d714602591138a045bd3b0`.
- Protocol: `ML-DEVOS-RFC-020` and `brain/protocols/CONTEXT_BOOTSTRAP.md`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`, especially OBL-017 and OBL-018.

## Exact execution scope

**Allowed:**

- decision/directive and return coordination commits on `governance/maisoglabs-v0.1`;
- authenticated read-only GitHub, Cloudflare and public-runtime checks;
- one normal Cloudflare deployment assigning 100% traffic to exactly `a667fc09-12d1-4fde-a75d-5d660729baa3`;
- read-only verification of Entry, Systems, Projects, Research, Contact, Journal, 404, admin fail-closed, design API baseline, Journal API, navigation/history, desktop/mobile layout and absence of unintended public S5/S6 exposure.

**Not allowed:**

- rebuild, upload, code change, main alteration, or another version promotion;
- rollback, hotfix or repair;
- D1, R2, Access, DNS/domain, secret, environment-variable or production-data mutation;
- admin publishing, design mutation, authentication bypass, public D1 cutover;
- media generation, addition, substitution, upload or integration;
- V2B, S6/S7 resumption, D-068 mutation, or action on PR #7/#10.

## SENTINEL Sync

Fresh evidence before directive issue:

- authoritative governance tip `edd4bce5fa9fa07b28237b893c078ebbd234ba2b`: `TURN: PAULO`, `STATUS: ARCHITECT_APPROVED`, Protocol V2, AS-115 controlling, no directive/handoff, every action flag NO;
- `D-086` was unused;
- fetched `origin/main` is exactly `aebc881e8890c00090d714602591138a045bd3b0`;
- Workers build `19ecd52a-b178-47dd-8d23-64b5590a61ef` succeeded from branch `main` at that exact commit using `npx wrangler versions upload`;
- target `a667fc09-12d1-4fde-a75d-5d660729baa3` is deployable Version 730, created `2026-09-26T02:16:32.836963Z`, alias `main`, triggered by `version_upload`;
- later Versions 731 and 732 are governance-branch uploads, not newer main releases;
- at `2026-09-26T03:16:25.206Z` active deployment `e51d40d4-a063-47c5-a46f-70beeee4c03e` served `a28ee2e9-a9a0-4528-b89f-07e0c827be2b` at 100%; the target was inactive.

MEDIA_GAP is accepted for this release. `plate-hero-v4.png`, `logo-mark.mp4` and the logo-mark poster/fallback are deferred. The existing static environment and canonical static SVG identity assets are accepted.

Disposition: `CLEAR`.

## SU Contradiction Check

Mode `ESCALATED_RESEARCH` because this directive changes production traffic.

Disposition `CLEAR_WITH_NOTES`:

1. `DEPLOY_AUTHORIZED` is necessary but applies only to the exact one-version, 100% deployment named above.
2. The promotion is not a rebuild or upload and must not change bindings, routes, secrets, data stores or configuration.
3. Runtime checks are read-only. Admin must fail closed; no bypass or mutation is permitted.
4. A material defect or wrong active version stops the cycle. No rollback or repair follows without a separate owner decision.
5. Accepted MEDIA_GAP items remain deferred and cannot silently become implementation work.

## Instructions

1. Publish this directive as one Protocol V2 commit directly parented on the issue parent.
2. Re-bootstrap on its exact tip and verify the delta is only decision/directive/state bookkeeping.
3. Re-fetch `main` and re-read the build/version provenance. Require all bound identities unchanged.
4. Immediately before promotion, re-read production deployment state and record deployment ID, active Version, traffic and observation timestamp. Require the target inactive.
5. Create exactly one normal Cloudflare deployment with strategy `percentage` and one version allocation: target `a667fc09-12d1-4fde-a75d-5d660729baa3` at 100%. Do not set `force`.
6. Immediately re-read deployment state. Require the target active at 100%; otherwise classify a release-governance incident and stop without rollback.
7. Perform the authorized read-only runtime checks. Do not publish, mutate design, bypass authentication or write content.
8. On any material defect, stop and record exact evidence. Do not repair.
9. On success, publish the Protocol V2 return described below.

## Validation and evidence

- Exact Git remote SHAs and Cloudflare Workers Builds provenance.
- Cloudflare version/deployment API reads immediately before and after promotion.
- Returned deployment ID and timestamp.
- Public HTTP/API status and bounded browser evidence for required surfaces, navigation/history and desktop/mobile layout.
- Negative checks for admin fail-closed, unintended S5/S6 exposure and obvious unrelated resource side effects.
- Protocol V2 checker before directive and return publications.

## Stop conditions

- governance/main/version/build identity drift or ambiguity;
- unexpected active production change before promotion;
- target no longer deployable or already active;
- promotion requires force, rebuild, upload or unrelated mutation;
- returned or freshly read active Version differs from the target at 100%;
- material runtime defect;
- any required forbidden action, stale tip, checker failure or publication conflict.

## Next action

On success, archive this directive byte-for-byte with provenance and publish `H-WEB-REL-002-GATE-D-0001` with exact promotion and runtime evidence. Deselect `CURRENT_DIRECTIVE`, clear its selectors, reset every action flag to NO, and route `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT`. Then stop.
