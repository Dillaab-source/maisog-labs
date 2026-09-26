# Current Directive — ML-DEVOS-RFC-021 V10 Canonical Visual Baseline Draft

```yaml
schema_version: 1
directive_id: DIR-WEB-V10-RFC021-0001
cycle_id: MAISOGLABS_WEB_V10_RFC021_DRAFT
issue_parent_commit: fb4f2121cff9eaee3c9fd27ef2a2ab50cd76e6a7
target_turn: CLAUDE
authority_ref: D-088
applicable_review_id: ML-DEVOS-AS-117
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-088, ML-DEVOS-AS-117, and this directive.

## Objective

Draft `ML-DEVOS-RFC-021 — V10 Canonical Visual Baseline` as documentation and architecture only.

The RFC must make V10 the static fail-safe visual baseline; encode Paulo's D-088 content, routing, divergence, and runtime-safeguard decisions; and define its narrow relationship to RFC-010 without authorizing implementation.

## Preconditions

- Bootstrap Protocol V2 from the exact tip that publishes this directive.
- Confirm `D-088`, `ML-DEVOS-AS-117`, this directive ID, and scope `D088_V10_RFC021_DRAFT_ONLY` are selected together.
- Confirm `main` remains `aebc881e8890c00090d714602591138a045bd3b0`.
- Confirm every action-specific authorization flag is `NO`.
- Stop on any stale tip, protocol mismatch, scope ambiguity, or missing governing record.

## Governing references

- **T0:** Protocol V2, D-088, and the hard boundaries in live STATE.
- **T1:** ML-DEVOS-AS-117; `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`; V10 HTML identity `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`; main `aebc881e8890c00090d714602591138a045bd3b0`.
- **T2:** ML-DEVOS-RFC-010; accepted V2A records; `design-references/claude-v10/**`; `coordination/OPERATIVE_OBLIGATIONS.md`; RFC index conventions.
- **T3:** only for a named unresolved drafting question, with the reason and evidence classification recorded.

## Exact execution scope

**Allowed future Builder change surfaces:**

- `devos/changes/rfcs/ML-DEVOS-RFC-021.md`;
- `devos/changes/rfcs/README.md`;
- normal Protocol V2 coordination, directive archive/provenance/index, and handoff evidence required for the return.

**Required RFC content:**

- supersede RFC-010 only where it fixes the V3/soft-geometry visual baseline, composition, and default-parity target;
- preserve RFC-010 authentication, positive allowlists, stale-write protection, immutable revisions, draft/preview/publish lifecycle, public published-only projection, and the prohibition on arbitrary CSS, HTML, JavaScript, URLs, and asset inputs;
- preserve V2A as historical accepted work;
- establish V10 as the static fail-safe baseline;
- publish eight unique projects: Sentinel/DevOS, SU, ClinicFlow, Maisog Kilat, Maisog Guild, Automation Hub, Cybersecurity Lab, and Experimental Projects, with ClinicFlow once and eventual copy factual, plain-language, and content-source-backed;
- use `paulo.maisog@maisoglabs.com`;
- make `#journal` canonical and `#research` a compatibility alias to the same surface, with new links using `#journal`;
- record approved divergence D1 (accessible compact/mobile navigation) and D2 (narrow-width Systems label collision fix) for the future divergence register;
- require runtime normalization/clamping of surface opacity to `80..90` and border intensity to `10..25`, including stale persisted and direct API-shaped values, while removed-from-UI fields remain ignored;
- keep API-DIAG separate and unauthorized;
- grant no V10-A or V10-B implementation authority.

**Not allowed:** any change outside the listed surfaces; application/admin/Worker/runtime code; migrations; packages; public assets or media; Cloudflare/resource access or mutation; implementation, merge, deployment, promotion, rollback, or API diagnosis.

## SENTINEL Sync

Fresh snapshot: `fb4f2121cff9eaee3c9fd27ef2a2ab50cd76e6a7`, confirmed as the authoritative remote tip before this directive transition. The mandatory `--session-protocol 2` bootstrap passed.

**Authority:** D-088 authorizes RFC-021 drafting only. ML-DEVOS-AS-117 is the controlling independent review.

**Context:** AS-117 independently verified the 20-section plan, exact V10 HTML and listed asset hashes, directive archive identity, bounded planning diff, clean `git diff --check`, and unchanged main. Builder rendering observations remain `ACTOR_REPORTED`.

**Capability:** documentation writes on the listed surfaces are available. Runtime, Cloudflare, D1, R2, Access, DNS, domain, secret, environment, media, merge, deploy, promotion, and rollback capabilities are neither required nor authorized.

**Execution:** one RFC draft and one Protocol V2 return. No implementation may be mixed into this cycle.

**Evidence:** the return must identify exact base/result commits, exact changed files, RFC-010 clauses preserved/superseded, D-088 requirements mapped, and validation results.

Disposition: `CLEAR`.

## SU Contradiction Check

Mode: `BOUNDED_CONTRADICTION`. Disposition: `CLEAR_WITH_NOTES`.

1. RFC-010's accepted V3/soft-geometry baseline conflicts with Paulo's V10 target. Resolve this only by explicit, narrow supersession; do not rewrite or broadly invalidate RFC-010.
2. V10 prototype mechanics and copy are not runtime or content authority. Preserve the no-arbitrary-input security model and use D-088's factual content decisions.
3. RFC-010's older server ranges are wider than the accepted V10 visual range. RFC-021 must require runtime normalization/clamping so stale storage or direct API submission cannot drift V10.
4. Removing controls from the UI is insufficient. Runtime mapping must ignore those persisted fields.
5. D1/D2 are approved deliberate mobile corrections, not parity failures to conceal; require them in the future divergence register.
6. API-DIAG and implementation are separable work and are not prerequisites for drafting this RFC.

## Instructions

1. Re-bootstrap and read D-088, AS-117, the plan, RFC-010, V2A references, and obligations from one exact snapshot.
2. Draft only `devos/changes/rfcs/ML-DEVOS-RFC-021.md` and add its index row.
3. Express supersession clause-by-clause and preserve every listed RFC-010 safety/lifecycle invariant.
4. Encode all D-088 content, routing, D1/D2, and runtime-range decisions as normative requirements and future acceptance evidence.
5. Keep API-DIAG, V10-A, and V10-B explicitly unauthorized.
6. Publish one Protocol V2 return handoff, archive/deselect this directive byte-for-byte with provenance, and route to the Architect for independent RFC review.

## Validation and evidence

- `git diff --check` passes.
- The diff contains only the two RFC files and required Protocol V2 return/archive records.
- RFC-021 names every preserved RFC-010 invariant and every narrowly superseded visual-baseline clause.
- All eight projects appear once; ClinicFlow appears once.
- The email and both hash routes are exact.
- D1/D2 and both runtime ranges are explicit and testable.
- The handoff classifies Builder claims as `ACTOR_REPORTED`.
- The Protocol V2 publish checker passes in check-only mode before compare-and-swap publication.

## Stop conditions

Stop if implementation, API diagnosis, media work, production/resource access, an unlisted file, or any mutation flag would be needed; if a required decision is ambiguous; if RFC-010 safety invariants cannot be preserved; or if freshness/protocol/publication checks fail.

Do not broaden scope to resolve an unrelated issue.

## Next action

Claude drafts RFC-021 and returns through a newly minted handoff (expected `H-WEB-V10-RFC021-0001`) with:

- exact base/result evidence;
- the directive archived byte-for-byte with provenance;
- `CURRENT_DIRECTIVE: NONE` and cleared directive selectors;
- `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`;
- every action-specific authorization flag `NO`.

Then stop. RFC acceptance and all implementation remain separate decisions.
