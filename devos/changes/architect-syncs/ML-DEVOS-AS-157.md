# Architect Review — D-129 homepage copy

Architect Sync: ML-DEVOS-AS-157
Status: READY TO COMMIT: YES — D-129 REPOSITORY CANDIDATE ACCEPTED
Cycle: MAISOGLABS_WEB_D129_HOMEPAGE_COPY
Authority: D-129 / ML-DEVOS-AS-156
Prior review: ML-DEVOS-AS-156
Reviewed handoff: H-WEB-D129-HOMEPAGE-COPY-0001
Return commit: a6cdb11a42ea55cdd8b875ccedff972d6007ea48
Protocol: PROTOCOL_VERSION 2

Provenance: this is the Architect's review, authored in the Architect review conversation and relayed by Paulo into the Builder session. The Architect assigned the Sync ID `ML-DEVOS-AS-157`. Claude/Builder publishes it, and serializes its explicit routing into STATE and the handoff archive, as **mechanical publisher only** under `ML-DEVOS-RFC-023` BC-4 (with the `ML-DEVOS-AS-155` mechanical-packaging clarification). The Builder did not author, edit, reinterpret or approve this review; the text below is reproduced verbatim as received. Committed text proves provenance, not authority.

## Review text (verbatim as relayed)

````text
ARCHITECT REVIEW — D-129 HOMEPAGE COPY

Review target:

a6cdb11a42ea55cdd8b875ccedff972d6007ea48

Architect Sync:

ML-DEVOS-AS-157

Verdict:

READY TO COMMIT: YES

D-129 REPOSITORY CANDIDATE ACCEPTED.

I independently inspected the live repository, STATE, Builder handoff,
changed-file set, canonical source patch, generated Entry asset and
RFC-022 bridge constant changes.

Builder-run browser screenshots and test execution remain
ACTOR_REPORTED evidence.

==================================================
SCOPE — ACCEPTED
==================================================

The implementation remains within D-129.

The two authorized homepage changes are present:

1. Lower-left:

Paulo Maisog — AI Automation & Technical Systems Builder

Building practical AI workflows, cloud automation, and technical systems for real-world business processes.

2. Lower-right:

AI
AUTOMATION
SYSTEMS

No additional homepage copy was changed under D-129.

The separate Contact wording:

"Humanity orbits higher."

was correctly left unchanged because D-129 only authorized the
lower-right Entry stack.

==================================================
SOURCE / BUILD — ACCEPTED
==================================================

The change was made at the canonical V10.1 build-source layer in:

scripts/build-v101-candidate.mjs

The Builder did not make a generated hashed bundle the sole source of
truth.

The explicit pinned-V10 input-path support is accepted as a necessary
bounded build-path adjustment because public/index.html now contains
the previously promoted V10.1 artifact rather than the original D-093
input artifact.

The original D-093 SHA remains verified.

Generated output changed as expected:

entry.7995859f655d.js
->
entry.e184fa740d43.js

Homepage artifact SHA:

220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc
->
f60179dd6f9e71c9f94d72eb66ac4686bb119a9a5dc781d315803f59df4d2fe3

Artifact length remains:

20857

RFC-022 insertion offset remains:

20116

The RFC-022 bridge hash/test pins were updated mechanically to the new
artifact identity.

No substantive project-content bridge behavior changed.

==================================================
PRESERVATION — ACCEPTED
==================================================

The evidence supports preservation of:

- MAISOGLABS wordmark;
- Ideas in Orbit;
- logo / hero system;
- navigation;
- Systems;
- Projects;
- Research;
- Contact;
- five D-115 project records;
- RFC-022 MLData project seam;
- existing desktop visual language.

No D1/R2 mutation occurred.

No project publication occurred.

No merge occurred.

No deployment occurred.

==================================================
DESKTOP EVIDENCE
==================================================

Accept as ACTOR_REPORTED:

1440x900:
- exact new copy present;
- no clipping;
- no horizontal overflow;
- no overlap with logo, wordmark or tagline.

1280x720:
- exact new copy present;
- no clipping;
- no horizontal overflow;
- no overlap with logo, wordmark or tagline.

The lower-left block naturally grows to five rendered lines.

The resulting flex layout moves the centered hero upward approximately:

- 14 px at 1440x900;
- 25 px at 1280x720.

This is a consequence of the authorized copy wrapping, not an
unauthorized layout edit.

It is NOT a technical blocker.

Final aesthetic acceptance of that wrapping belongs to Paulo before
release.

Do not create a remediation cycle merely to reposition the hero.

==================================================
TEST DISPOSITION
==================================================

Accept as ACTOR_REPORTED:

- full npm test: 978/978;
- homepage / bridge focused suites: 45/45;
- RFC projection: 0 errors;
- traceability unchanged from the pre-existing baseline.

No new technical blocker is identified.

==================================================
NON-BLOCKING PROCESS NOTE
==================================================

D-129 produced substantially more screenshot evidence than is normally
necessary for a two-string copy change.

Do not create follow-up work for this.

For future low-risk copy-only work, use proportional evidence rather
than expanding ceremony unless a concrete failure or uncertainty
requires it.

==================================================
VERDICT
==================================================

D-129 implementation:

ACCEPTED.

No remediation cycle required.

Do not alter the candidate further under D-129.

==================================================
ROUTING
==================================================

Publish this review as:

ML-DEVOS-AS-157

Archive the current D-129 handoff normally.

Route:

TURN: PAULO
STATUS: PAULO_DECISION_REQUIRED
AUTHORIZED_SCOPE: D129_ACCEPTED_OWNER_VISUAL_AND_RELEASE_DECISION_ONLY

CURRENT_HANDOFF: NONE
CURRENT_DIRECTIVE: NONE

All action-specific authorization flags remain NO.

No merge is authorized.

No deployment is authorized.

Paulo's next decision is:

1. visually accept or reject the existing D-129 candidate as-is; and
2. if accepted, authorize the normal protected release sequence.

Do not reopen Sentinel / DevOS governance work.

Then STOP.
````
