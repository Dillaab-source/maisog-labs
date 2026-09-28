# Architect Review — Cloudflare Inventory & Exposure Assessment

Architect Sync: ML-DEVOS-AS-129
Status: ARCHITECT_APPROVED — D-102 ASSESSMENT ACCEPTED WITH ARCHITECT AMENDMENTS / OWNER REMEDIATION DECISION REQUIRED
Cycle: MAISOGLABS_CF_INVENTORY_REVIEW
Authority: D-102
Prior review: ML-DEVOS-AS-128
Reviewed handoff: H-WEB-CF-INVENTORY-0001
Reviewed return: abd96b5ff7c3f754f9fab5b1d7853a03842d07eb
Report: docs/security/CF_INVENTORY_EXPOSURE_REVIEW.md
Protocol: PROTOCOL_VERSION 2

## Verdict

D-102 assessment: ACCEPTED

Builder remediation: NOT REQUIRED

Cloudflare mutation: NOT AUTHORIZED

Owner remediation decision: REQUIRED

The assessment provides sufficient evidence to route bounded remediation choices to Paulo without another research cycle.

## Architect independent verification

The Architect independently verified:

- governance tip: `abd96b5ff7c3f754f9fab5b1d7853a03842d07eb`;
- main: `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`;
- D-102 publication: `9e8c9f5006f0654eac7c139a41ef4d21b71a5f34`;
- the Builder return is exactly one commit after D-102;
- the return diff is limited to:
  - `docs/security/CF_INVENTORY_EXPOSURE_REVIEW.md`;
  - `coordination/CURRENT_HANDOFF.md`;
  - `coordination/STATE.md`;
  - the archived directive;
  - the directive provenance;
  - the directive archive index;
- the archived directive is byte-identical to the executed directive: `1b7ceb17b01e023a5103c2d6883bba5c5b176b83`;
- the directive is deselected;
- every action-specific flag is NO.

## Scope review

The Builder's discovery and read-only inspection of the `n8n.maisoglabs.com` Cloudflare Tunnel is accepted as in-scope.

`DIR-WEB-CF-INVENTORY-0001` explicitly authorized "any directly related resource discovered on the way". The tunnel was discovered through the authorized DNS/resource inventory.

No authority breach occurred.

## Evidence classification

The Architect independently verified:

- repository state;
- return integrity;
- archive integrity;
- governance routing.

All Cloudflare connector observations remain `ACTOR_REPORTED`. The Architect has no authenticated Cloudflare read path in this review environment and therefore does not relabel those observations as independently reproduced.

This evidence limitation does not require remediation of the assessment.

## Finding disposition

**F-1 — HIGH / ACCEPTED WITH PRECISION AMENDMENT**

The material risk is that unreviewed branch code can be uploaded as a publicly executable preview while carrying production D1/R2 bindings.

The review does NOT conclude that the existing preview URL itself bypasses `/admin` authentication. The Builder observed the Worker failing closed for an unauthenticated `/admin` request.

The governance/data-boundary risk nevertheless remains HIGH, because branch execution can bypass the normal reviewed Gate C/Gate D path.

**F-2 — HIGH / ACCEPTED**

Staging admin is reported to share the production CMS D1/R2 resources. This is an isolation and integrity concern.

No migration or rebinding is authorized by this review.

**F-3 — MEDIUM / ACCEPTED WITH EVIDENCE QUALIFICATION**

Configuration and deployed-bundle evidence establish a public CMS-read mechanism.

Whether meaningful, unpublished or sensitive content is currently exposed was not established, because D1 content was deliberately not queried.

Treat the exposure mechanism as established and the current data impact as unverified.

**F-4 — LOW / ACCEPTED**

Staging diagnostic mode is a bounded information-exposure concern.

**F-5 — MEDIUM LATENT / ACCEPTED**

The n8n tunnel is currently reported down. If retained, it should receive an explicit access boundary before being brought back online.

**F-6 — INFO / ACCEPTED**

The governed apex `/admin` remains fail-closed but non-functional while a separate pre-governance admin remains operational.

Resolving the canonical admin is a later product/infrastructure decision, not immediate security remediation.

**F-7 — UNVERIFIED / PRESERVE**

Do not classify `maisog-jobs` or `eternal-eggs-dashboard` as unsafe merely because they are publicly reachable. Their intended visibility and content must be established first.

**F-8 — OWNER CONFIRMATION**

Paulo must confirm the Access allow-listed email privately. Do not write the email into this public repository.

## Remediation priority

Architect priority:

1. A-1 — disable `maisog-labs` preview URLs.
2. A-4 — disable `maisog-labs-staging` `workers.dev` and previews.
3. A-3 — remove or narrowly restrict the non-main Workers Builds trigger.
4. A-6 — if n8n is retained, establish an Access boundary before the tunnel is next brought online.

A-2, A-5 and A-7 are bounded follow-ups.

A-8 and A-9 are deferred structural work and MUST NOT block the return to product development after the immediate exposure reductions.

No deletion of `maisog-cms`, `maisog-media`, Admin V1, jobs or Eternal Eggs resources is authorized.

## Product-development boundary

Do not allow this assessment to become an open-ended infrastructure program.

After the immediate reversible exposure reductions are owner-authorized and completed, return to the existing product priorities.

The larger canonical-admin and staging-isolation work may proceed separately.

## SENTINEL

- Authority: CLEAR / CONSUMED
- Context: CLEAR
- Capability: CLEAR / NO MUTATION AUTHORITY
- Execution: CLEAR — READ ONLY
- Evidence: CLEAR WITH ACTOR_REPORTED CLOUDFLARE CLASSIFICATION
- Risk: OPEN FINDINGS / OWNER DECISION REQUIRED

Disposition: SENTINEL: CLEAR_WITH_ACTIONS

## SU contradiction review

CLEAR_WITH_NOTES

No contradiction justifies rejecting the assessment or opening a Builder remediation cycle.

Important preserved uncertainties:

- the actual content of `maisog-cms` / `maisog-media`;
- current usage of legacy/staging resources;
- the actual data impact of F-3;
- the intended role of the jobs and Eternal Eggs public resources;
- whether n8n is still intended to be self-hosted.

## Transition

Archive and deselect `H-WEB-CF-INVENTORY-0001`.

Route:

TURN: PAULO

STATUS: PAULO_DECISION_REQUIRED

PAULO_DECISION_REQUIRED: YES

ARCHITECT_ACTION_REQUIRED: NO

IMPLEMENTER_ACTION_REQUIRED: NO

No current handoff.

No current directive.

Every action-specific authorization flag remains NO.

The owner-decision scope is limited to the Cloudflare exposure remediation choices.

The next owner decision may authorize bounded A-1/A-4 remediation, with A-3/A-6 either separately or as explicitly enumerated bounded actions.

No remediation is authorized merely by AS-129.

Do not start S6/S7. Do not touch D-068, PR #7 or PR #10.
