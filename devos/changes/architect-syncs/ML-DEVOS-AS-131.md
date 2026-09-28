# Architect Review — V10 Admin Content Bridge Planning

Architect Sync: ML-DEVOS-AS-131
Status: ARCHITECT_APPROVED — D-104 PLAN ACCEPTED / RFC-022 OWNER AMENDMENT REQUIRED
Cycle: MAISOGLABS_WEB_V10_CONTENT_BRIDGE_PLAN
Authority: D-104
Prior review: ML-DEVOS-AS-130
Reviewed handoff: H-WEB-V10-CONTENT-BRIDGE-PLAN-0001
Reviewed return: f867524acb45383c6b48680f7b240f000575bcd0
Main: 6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4
Protocol: PROTOCOL_VERSION 2

## Verdict

| Item | Disposition |
|---|---|
| D-104 planning work | ACCEPTED |
| `V10_ADMIN_CONTENT_BRIDGE_PLAN.md` | ACCEPTED AS PLANNING BASIS |
| RFC-022 | NOT YET ACCEPTED |
| Builder remediation | NOT REQUIRED |
| Owner decision | REQUIRED |

## Key Architect finding — D-093 semantics

The D-093 contract is unambiguous.

- `docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md` states that `public/index.html` is the Design System artifact byte-for-byte and is never edited.
- More importantly, `DIR-WEB-HOMEPAGE-ARTIFACT-0001` explicitly required: "Serve publish/index.html … byte-for-byte as the public homepage /."
- The accepted D-093 evidence also verified that the bytes served by the local Worker runtime at `/` matched the artifact.

Therefore the proposed MLData bridge is NOT merely an implementation of D-093. When published content exists, it changes the bytes served at `/`. That requires an explicit owner amendment or supersession of the D-093 served-byte rule.

This is not a defect in the D-104 plan. The Builder correctly identified Q1 as an unresolved owner decision.

## Architecture assessment

Subject to that owner amendment, the proposed MLData-seam bridge is architecturally sound and preferred over the alternatives assessed. Reasons:

- `public/index.html` remains immutable;
- no rebuild or deployment is needed for ordinary copy edits;
- the bridge acts before the artifact renders, avoiding a post-render content flash;
- content remains typed and allowlisted;
- the hook is code-owned rather than admin-controlled;
- project and site-settings revision infrastructure can be reused;
- public failures can return the original artifact;
- no second CMS or generic mutation capability is introduced.

## Important precision

The future architecture may claim: "D1 failure does not make homepage content availability depend on D1."

It MUST NOT claim: "the homepage has no new runtime dependency."

Once exact `/` becomes Worker-first, the homepage depends on successful Worker execution. The implementation must therefore:
- contain the strongest practical fail-safe around the exact `/` dispatch;
- preserve `env.ASSETS.fetch(request)` as the fallback response.

A Worker or platform failure that occurs before the application fallback executes cannot be represented as equivalent to asset-first service. That residual risk must stay explicit.

## Tier disposition

**Tier 1 — ACCEPTABLE FOR FUTURE IMPLEMENTATION:**
- homepage projects;
- exactly 1–5 featured projects;
- exactly four flow stages per project;
- a validated contact email.

**Tier 2 — DEFER:**
- hero/entry introduction;
- navigation labels;
- section captions and headings;
- contact heading, body and button wording.

These require a revised, owner-approved artifact that exposes those values through the content seam.

**Design additions — DEFER.** Do not add:
- an About section;
- new CTA buttons;
- new homepage structural panels.

Those are design changes, not ordinary content management.

## Storage disposition

Reuse is approved in principle. Preferred:
- existing `project_revisions`;
- the existing project draft/preview/publish lifecycle;
- existing stale-write protection;
- the existing append-only audit;
- existing `site_settings_revisions`.

The proposed migration adding `tagline`, `status`, `disciplines_json` and `flow_json` is reasonable as a draft architecture decision. It is NOT authorized or accepted for implementation until RFC-022 is accepted.

No second CMS and no homepage snapshot table.

## Public API

Do NOT add `/api/site-content` in the initial implementation. There is currently no second consumer requiring it.

The homepage bridge may read the published revision substrate internally. A public API can be proposed later if a concrete consumer appears.

## Journal / Research

Do not include Journal → Research `NOTES` bridging in the initial implementation. Keep CB-6 deferred.

## Testing requirements carried into RFC-022

Any implementation acceptance must prove:

1. the canonical `public/index.html` SHA remains `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`;
2. the no-published-content response is byte-identical to the artifact;
3. the D1 error/timeout response is byte-identical to the artifact;
4. an injected response differs only by the explicitly bounded bridge span;
5. malformed or hostile data cannot become HTML/JS/CSS/URL execution;
6. drafts never reach public `/`;
7. stale mutations fail without partial publication;
8. more than five homepage projects is rejected before publication;
9. each project has exactly four flow stages;
10. the browser render has no console error or blank-page failure;
11. `/` Worker CPU and latency are measured before release;
12. the existing D-093 artifact hash tests continue to pass.

## Owner decisions routed to Paulo

The Architect recommends:

**Q1 — YES, explicitly amend D-093.**
- Preserve canonical artifact-file immutability and byte identity.
- Supersede only the requirement that every successful public `/` response must always equal the artifact byte-for-byte.
- Permit a dynamic response to differ only by an RFC-022-defined, validated content-bridge span when published content is available.

**Q2 — YES.** Exact `/` may become Worker-first, subject to implementation evidence and release gating. No other ordinary asset route should become Worker-first because of RFC-022.

**Q3.** Recommended recruiter-facing homepage set:
1. ClinicFlow
2. Eternal Eggs
3. Sentinel / DevOS
4. SU
5. Maisog Kilat

Maisog Guild remains available elsewhere but is not one of the five homepage slots initially.

Preferred public email: `paulo.maisog@maisoglabs.com`, provided its receive/deliverability path is confirmed before publication. Otherwise retain the currently confirmed working address until that test passes.

**Q4 — DEFER** Tier 2 / artifact v2. First complete Tier 1. Do not add About or new CTA structure in RFC-022 Tier 1.

**Q5 — NO** `/api/site-content` initially. DEFER Journal → Research bridging.

## RFC-022 status

Keep `Status: DRAFT`. Do not implement RFC-022 yet.

After Paulo records the Q1–Q5 decisions, RFC-022 may be amended to incorporate them and returned for final Architect acceptance.

## Governance verification

The Architect independently verified:

- D-104 publication: `b7d0284c1853eae5887a6fdc6148987c68895345`;
- Builder return: `f867524acb45383c6b48680f7b240f000575bcd0`;
- the return is exactly one commit after D-104;
- `main` remains `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`;
- directive source/archive blob identity: `cef980331b94eb0e5314597e8d7da8d7b771f932`;
- every action-specific authorization flag is NO.

No runtime, product or Cloudflare mutation occurred.

## SENTINEL

- Authority: CLEAR / CONSUMED
- Context: CLEAR WITH D-093 SUPERSESSION REQUIRED
- Capability: CLEAR / NO IMPLEMENTATION AUTHORITY
- Execution: CLEAR — PLANNING ONLY
- Evidence: CLEAR WITH BUILDER-REPORTED ARTIFACT ANALYSIS
- Risk: BOUNDED / OWNER DECISION REQUIRED

Disposition: SENTINEL: CLEAR_WITH_ACTIONS

## Transition

Archive and deselect `H-WEB-V10-CONTENT-BRIDGE-PLAN-0001`.

Route:

TURN: PAULO

STATUS: PAULO_DECISION_REQUIRED

PAULO_DECISION_REQUIRED: YES

ARCHITECT_ACTION_REQUIRED: NO

IMPLEMENTER_ACTION_REQUIRED: NO

No current handoff.

No current directive.

Every action-specific authorization flag remains NO.

Owner-decision scope: `AS131_RFC022_OWNER_DECISIONS_ONLY`.

- Do not begin CB-1 through CB-7.
- Do not mutate RFC-022 except through a subsequent owner-authorized planning/amendment transition.
- Do not start S6/S7 or A-3/A-6, and do not touch PR #7, PR #10 or D-068.
