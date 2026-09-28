# Architect Review — RFC-022 V10 Published Content Bridge

Architect Sync: ML-DEVOS-AS-132
Status: ARCHITECT_APPROVED — RFC-022 ACCEPTED / READY FOR OWNER IMPLEMENTATION DECISION
Cycle: MAISOGLABS_WEB_RFC022_AMENDMENT
Authority: D-105
Prior review: ML-DEVOS-AS-131
Reviewed handoff: H-WEB-RFC022-AMEND-0001
D-105 publication: 678f038181665159781cf308664c8f48c16f16b1
Reviewed return: 250a0f219a44a5a93ac1061de5c7bc621b434109
Main: 6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4
Protocol: PROTOCOL_VERSION 2

## Verdict

| Item | Disposition |
|---|---|
| ML-DEVOS-RFC-022 — V10 Published Content Bridge | ACCEPTED |
| Architecture | APPROVED |
| Builder remediation | NOT REQUIRED |
| Implementation | NOT AUTHORIZED |
| Production release | NOT AUTHORIZED |

The D-105 owner decisions resolve the open architectural questions from ML-DEVOS-AS-131.

## Accepted architecture

The accepted Tier 1 architecture is:

authenticated admin lifecycle
→ typed D1 revision substrate
→ published pointers only
→ exact `/` Worker-first
→ bounded MLData bridge
→ immutable D-093 artifact presentation.

The governing rule remains: CODE OWNS V10 DESIGN. ADMIN OWNS APPROVED CONTENT FIELDS.

The public artifact remains immutable: `public/index.html`, SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

D-105 narrowly supersedes only D-093's requirement that every successful served `/` response always equal those bytes.
- When valid published content exists, the served response may differ only by the RFC-022-defined bridge span.
- Otherwise the original artifact response is used.

## Accepted Tier 1

Tier 1 may manage:
- homepage project facts;
- homepage project ordering and inclusion, within the bounded project model;
- exactly four flow stages per included project;
- a validated contact email.

Initial owner-selected homepage projects:
1. ClinicFlow
2. Eternal Eggs
3. Sentinel / DevOS
4. SU
5. Maisog Kilat

Tier 2 remains deferred. No About section, new CTA, new structural panel, Journal bridge or `/api/site-content` is included.

## Storage acceptance

Accepted in principle:
- reuse `project_revisions`;
- reuse the project draft / preview / publish lifecycle;
- reuse stale-pointer protection;
- reuse the append-only audit;
- reuse `site_settings_revisions.contact_email`;
- no second CMS;
- no homepage snapshot table.

The proposed migration fields are architecturally accepted for a future authorized implementation: `tagline`, `status`, `disciplines_json`, `flow_json`.

This review does not authorize migration creation or application.

## AS132-F001 — Dynamic response identity and caching

**Mandatory implementation requirement.**

Once a response body is modified by the RFC-022 bridge, the implementation MUST NOT blindly preserve body-specific identity or encoding metadata belonging to the original artifact.

The transformed response must explicitly handle, remove or recompute as appropriate:
- `Content-Length`;
- `Content-Encoding`;
- `ETag`;
- other body-identity validators affected by the transformation.

Further requirements:
- The implementation must preserve appropriate security and content headers.
- The dynamic-response cache policy must prevent an injected body from being incorrectly reused as the immutable artifact, or from surviving publication changes under an artifact-only validator.
- A simple, conservative no-cache / revalidation contract is acceptable for Tier 1.
- The untouched fallback from `env.ASSETS.fetch(request)` should remain untouched.
- Tests must cover this response-header boundary.

Disposition: MANDATORY IMPLEMENTATION CONDITION. Not an RFC rejection.

## AS132-F002 — Initial five-project activation

D-105 selects five specific initial homepage projects. RFC-022's general payload capability permits 1..5 projects. These are compatible only with an explicit initial release gate.

Before the project bridge is first enabled in production, all five D-105 projects must exist in their intended order with complete, published, valid Tier 1 fields:
1. ClinicFlow
2. Eternal Eggs
3. Sentinel / DevOS
4. SU
5. Maisog Kilat

Until that initial activation condition passes, public `/` must retain the artifact's project data.

After initial activation, RFC-022's bounded 1..5 capability may operate normally through the governed admin lifecycle.

Disposition: MANDATORY RELEASE CONDITION.

No new schema flag is required solely for this condition, unless implementation evidence proves one necessary.

## AS132-F003 — Protocol V2 checker gap

The Builder reports that the Protocol V2 check-only path accepted an AS-131 publication candidate that lacked its required STATE transition.

That is a governance-validator defect. It did not corrupt the actual AS-131 or D-105 state, and it does not invalidate RFC-022.

Disposition: NON-BLOCKING GOVERNANCE FOLLOW-UP.

Until repaired:
- do not treat `--check-only` alone as proof that a transition is complete;
- every owner, Architect or Builder publication must explicitly inspect the candidate STATE transition and changed-file set before compare-and-swap publication.

Do not silently fix the checker during RFC-022 product implementation unless separately authorized.

## Content readiness versus implementation readiness

The following do NOT block repository implementation of CB-1 through CB-5:
- missing approved Eternal Eggs V10 copy;
- unconfirmed deliverability of `paulo.maisog@maisoglabs.com`.

They DO block the corresponding production content activation.
- Eternal Eggs content must be provided before AS132-F002 can pass.
- The preferred email must not be published until Paulo confirms its deliverability. Otherwise the currently confirmed working address remains in use.

Do not invent either fact.

## Implementation requirements

Future implementation evidence must include the twelve RFC-022 / AS-131 tests plus AS132-F001. At minimum, prove:
- the artifact SHA is unchanged;
- untouched fallback body identity;
- D1 failure and timeout fallback;
- span-only body transformation;
- safe JSON and script encoding;
- no draft leakage;
- stale-write atomicity;
- project-count validation;
- four flow stages;
- a browser render without a blank page or console errors;
- Worker CPU and latency measurement;
- existing artifact tests remain green;
- transformed-response header and cache correctness.

## RFC status

Update `devos/changes/rfcs/ML-DEVOS-RFC-022.md` from `Status: DRAFT` to an accepted status identifying ML-DEVOS-AS-132.

Do not alter the normative RFC body except for the minimal status and acceptance metadata necessary to record acceptance. Update its RFC index row accordingly. No implementation changes.

## SENTINEL

- Authority: CLEAR / D-105 CONSUMED
- Context: CLEAR
- Capability: CLEAR / IMPLEMENTATION NOT AUTHORIZED
- Execution: CLEAR — ARCHITECTURE ACCEPTANCE ONLY
- Evidence: CLEAR_WITH_NOTES
- Risk: BOUNDED — IMPLEMENTATION AND RELEASE GATES REMAIN

Disposition: SENTINEL: CLEAR

## SU disposition

CLEAR_WITH_NOTES

No remaining contradiction requires another architecture cycle. The remaining risks are testable implementation and release concerns, rather than unresolved architecture choices.

## Governance integrity

Independently verified:
- D-105: `678f038181665159781cf308664c8f48c16f16b1`;
- Builder return: `250a0f219a44a5a93ac1061de5c7bc621b434109`;
- the return is exactly one commit after D-105;
- `main`: `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`;
- directive source/archive blob: `2089eeaabdb357eb86f79ba64cf2d65a9acb56d1`;
- every current action-specific authorization flag: NO.

## Transition

Archive and deselect `H-WEB-RFC022-AMEND-0001`.

Route:

TURN: PAULO

STATUS: PAULO_DECISION_REQUIRED

PAULO_DECISION_REQUIRED: YES

ARCHITECT_ACTION_REQUIRED: NO

IMPLEMENTER_ACTION_REQUIRED: NO

No current handoff.

No current directive.

Every action-specific authorization flag remains NO.

Next-decision scope: `AS132_RFC022_IMPLEMENTATION_OWNER_DECISION_ONLY`.

- No CB implementation begins automatically.
- No migration, Cloudflare mutation, remote D1/R2 operation, `main` merge or deployment.
- Do not start A-3/A-6 or S6/S7, and do not touch PR #7, PR #10 or D-068.
