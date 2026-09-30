# Architect Review — RFC-023 / V2.1 Cycle A (D-127)

Architect Sync: ML-DEVOS-AS-154
Status: CHANGES_REQUESTED — ONE MICRO-REMEDIATION ONLY
Cycle: MAISOGLABS_DEVOS_RFC023_V21
Authority: D-127 / ML-DEVOS-AS-153
Prior review: ML-DEVOS-AS-153
Reviewed handoff: H-DEVOS-RFC023-CYCLE-A-0001
Return commit: 0e6711b089a52a160102c1c0cba6a7a67abf30fa
Protocol: PROTOCOL_VERSION 2

Provenance: this is the Architect's review, authored in the Architect review conversation and relayed by Paulo into the Builder session. The Architect assigned the Sync ID `ML-DEVOS-AS-154`. Claude/Builder publishes it as **mechanical publisher only**, under `ML-DEVOS-RFC-023` BC-4, while `OBL-012` remains open. The Builder did not author, edit, reinterpret or approve this review; the text below is reproduced verbatim as received. Committed text proves provenance, not authority.

## Review text (verbatim as relayed)

````text
ARCHITECT REVIEW — RFC-023 / V2.1 CYCLE A

Review target:
0e6711b089a52a160102c1c0cba6a7a67abf30fa

Verdict:

CHANGES_REQUESTED — ONE MICRO-REMEDIATION ONLY.

Cycle A is otherwise accepted.

Do NOT reopen RFC-023 design.
Do NOT begin Cycle B.
Do NOT touch production.
Do NOT broaden scope.

==================================================
AS-154-F001 — AUTHOR != PUBLISHER POLICY IS NOT
CONSISTENTLY PROPAGATED TO OPERATIVE INSTRUCTIONS
==================================================

The accepted V2.1 policy says:

Until an Architect execution channel satisfies OBL-012, the Architect
authors review bytes and the Builder (or Paulo) may mechanically publish
those bytes unchanged through the CAS publication path.

The current Cycle A repository contains conflicting operational wording.

1. CLAUDE.md now says:

   "Until an Architect channel satisfies OBL-012, the Builder may
   publish Architect-authored bytes unchanged (Author ≠ Publisher)."

   But later it still says governed writes require:

   TURN: CLAUDE
   IMPLEMENTER_ACTION_REQUIRED: YES

   without distinguishing Builder-authored governed work from
   BC-4 mechanical publication.

2. .agents/skills/architect-review-sync/SKILL.md was not updated.

   It still instructs that a provider without CAS is advisory/read-only
   and "must not publish", which conflicts with BC-4's explicit
   mechanical-publisher path.

D-127 expressly authorized canonical Skill updates where a Skill
restates amended policy.

This is an in-scope Cycle A omission.

==================================================
EXACT REMEDIATION
==================================================

Make the smallest possible correction.

A. CLAUDE.md

Clarify the write gate so it means:

- Builder-authored governed implementation/routing work requires
  TURN: CLAUDE and IMPLEMENTER_ACTION_REQUIRED: YES.

- Exception: under ML-DEVOS-RFC-023 BC-4, while OBL-012 remains open,
  the Builder may act only as mechanical publisher of Architect-authored
  review/routing bytes on an Architect turn when:
    * the Architect authored the exact bytes;
    * the Builder makes no semantic edits;
    * the publication is within the live Architect routing authority;
    * exact-tip CAS/checker publication is used;
    * publication is explicitly identified as mechanical transport,
      not Builder review authority.

This exception grants no authority to author, alter or approve the review.

B. brain/protocols/ARCHITECT_SYNC.md

In the Turn Protocol section, reconcile any wording that still implies
the Architect must personally perform the repository publication.

Use the BC-4 distinction:

Architect = author/reviewer.
Publisher = Architect if OBL-012 is satisfied; otherwise Builder or Paulo
may mechanically publish the exact Architect-authored bytes unchanged.

Do not alter the substantive BC-4 contract.

C. .agents/skills/architect-review-sync/SKILL.md

Update only the portions that restate publication mechanics.

The Skill must say:

- the Architect authors the review and routing decision;
- lack of an Architect CAS channel does NOT invalidate the review;
- while OBL-012 remains open, Builder or Paulo may mechanically publish
  the exact Architect-authored candidate under BC-4;
- the mechanical publisher may not edit, reinterpret, approve, or
  widen authority;
- exact-tip CAS remains mandatory;
- if neither Architect nor an authorized mechanical publisher can
  provide CAS, stop.

Preserve:
- TURN: ARCHITECT as the review-activation gate;
- independent review requirements;
- immutable AS IDs;
- archive requirements;
- SENTINEL/SU requirements;
- owner re-entry rules.

D. Generated bridge

Because the canonical Skill changes, regenerate the .claude/skills bridge
using the existing generator.

Never hand-edit the generated bridge.

==================================================
DO NOT CHANGE
==================================================

Do not modify:

- ML-DEVOS-RFC-023;
- RFC lifecycle mappings;
- OPERATIVE_OBLIGATIONS other than normal carry-forward;
- status lines;
- attempt-ledger implementation;
- traceability validator;
- scripts/check-context-bootstrap.mjs;
- Cycle B tests;
- product or website files;
- production resources.

Do not fix unrelated stale wording in this remediation.

The obligations ≤5 KB measurable target miss is accepted as disclosed
and is NOT a blocker for Cycle A.

The following Cycle A judgments are ACCEPTED and must not be reopened:

- RFC-018 / RFC-019 / RFC-020 -> ACCEPTED projection;
- "IMPLEMENTED AND CLOSED" RFCs -> ACCEPTED with ADR references;
- RFC-023 class CORE_POLICY;
- OBL-024 = DEFERRED;
- current STATE held-position line;
- Phase-1 CLAUDE.md history pointer;
- AS-151 relay-gap provenance;
- AS-151/152/153 persistence IDs.

==================================================
ROUTING
==================================================

Publish this Architect review as new immutable:

ML-DEVOS-AS-154

The Builder acts only as mechanical publisher of the Architect-authored
review bytes under RFC-023 BC-4.

Route one remediation cycle:

CURRENT_REMEDIATION_CYCLE: 1

TURN: CLAUDE
STATUS: CHANGES_REQUESTED

Issue one new bounded directive for AS-154-F001 only.

After remediation:

- run the Skills bridge generator/validator;
- run tests/skills.test.mjs;
- run the Context Bootstrap suites;
- inspect the exact changed-file set manually under OBL-023;
- confirm no Cycle B file changed.

Return:

TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT

Then STOP.

No Paulo decision is required for this remediation because it remains
inside D-127 Cycle A and the existing remediation cap.
````
