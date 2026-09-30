# Architect Review — Context Bootstrap V2.1 proposal, revision 2 (design only)

Architect Sync: ML-DEVOS-AS-152
Status: CHANGES_REQUESTED — THREE NARROW CORRECTIONS ONLY
Cycle: V2.1 design review (owner-requested advisory; no governed cycle)
Authority: advisory design review requested by Paulo while live STATE was `TURN: PAULO` at `4e8a4789e2289477b6bf10076f86a36b1e1a04d3`
Prior review: ML-DEVOS-AS-151
Reviewed artifact: V2.1 proposal revision 2 (Builder chat output; not persisted in the repository)
Next review: ML-DEVOS-AS-153
Protocol: PROTOCOL_VERSION 2

Provenance: this is the Architect's review of V2.1 proposal revision 2. It was delivered in the Architect review conversation and relayed by Paulo into the Builder session in chat. It was **never previously published to the repository**. It is durably persisted now, under `D-127` (review record preservation), from that earlier conversation. The Sync ID was assigned at persistence by the Builder as mechanical publisher, not by the Architect. The Builder did not author this review. Committed text proves provenance, not authority.

Fidelity: the review text below is reproduced verbatim as the Builder received it, complete, with no relay gaps observed. Nothing was reconstructed, reworded or added. The finding IDs `AS-R2-F001`–`AS-R2-F003` are the Architect's own labels and are kept as written.

## Review text (verbatim as relayed)

````text
ARCHITECT REVIEW — V2.1 PROPOSAL REVISION 2

Verdict:

CHANGES_REQUESTED — THREE NARROW CORRECTIONS ONLY.

Do not redesign the proposal.
Do not implement anything.
No governed write is authorized.

I independently inspected the live repository at:

4e8a4789e2289477b6bf10076f86a36b1e1a04d3

The major Revision 2 direction is accepted:

- Authorized Work Envelope;
- Adaptive SENTINEL / SU;
- existing evidence escalation rather than a new evidence system;
- Constructive Dissent;
- Author != Publisher;
- Existing-Capability-First;
- Knowledge Treasury reuse;
- CLAUDE.md slimming;
- Thin STATE;
- RFC lifecycle projection;
- Thin obligations in the existing file;
- archive retention unchanged;
- Protocol remains PROTOCOL_VERSION 2;
- attempt-ledger repair.

Do not reopen those decisions except where the corrections below require precision.

==================================================
AS-R2-F001 — ENVELOPE BUDGET MUST NOT REPURPOSE THE REMEDIATION COUNTER
==================================================

Revision 2 currently says every envelope continuation consumes one unit of:

CURRENT_REMEDIATION_CYCLE / MAX_REMEDIATION_CYCLES

That is not accepted.

Those fields retain their existing remediation-loop meaning.

Required Revision 3 semantics:

1. An Authorized Work Envelope contains a finite ORDERED LIST of exact named continuation steps.

Example conceptual shape:

Step 1 — implement bounded local candidate
Step 2 — remediate accepted review findings
Step 3 — run bounded local verification

2. The number of listed steps is the envelope's progression budget.

No new STATE field or counter is introduced.

3. The Architect may route directly only to the NEXT UNUSED named step when:
- that exact step is explicitly listed in the owner Decision;
- all authority/action flags required by that step are already valid;
- no re-entry trigger has fired;
- the preceding step has been accepted.

4. Successful progression from one named envelope step to the next does NOT increment CURRENT_REMEDIATION_CYCLE.

5. Remediation inside an envelope step uses the existing remediation counter exactly as today.

6. If remediation would exceed MAX_REMEDIATION_CYCLES:
return to Paulo.

7. No skipping, repeating, inserting or reordering envelope steps without a new Paulo decision.

8. When the finite named list is exhausted:
return to Paulo unless the final step explicitly ends the cycle.

This preserves the existing STATE schema and the existing remediation semantics while still reducing unnecessary owner gates.

==================================================
AS-R2-F002 — DEFINE THE RFC STATUS POINTER EXACTLY
==================================================

BC-10 says RFC bodies stop carrying mutable lifecycle prose and instead carry a fixed pointer.

Revision 3 must define the exact canonical Status line.

Use one fixed form, for example:

Status: See `devos/changes/rfcs/README.md` for the current lifecycle projection; Decisions and ADRs remain authoritative.

You may improve punctuation, but Revision 3 must choose ONE exact byte form.

Then specify:

- every RFC-001…RFC-022 body receives exactly that fixed Status line during migration;
- RFC-023 uses it from creation;
- the RFC index is a subordinate lifecycle projection only;
- Decisions / ADRs / immutable Architect records remain authority/history;
- the traceability validator rejects any RFC body Status line that differs from the exact fixed pointer;
- tests cover missing index row, extra index row, duplicate row, stale projection and mutable/noncanonical RFC body status.

The live repository independently confirms that the current RFC directory has RFC-001 through RFC-022 and the current README projection omits exactly RFC-011 and RFC-020.

==================================================
AS-R2-F003 — ATTEMPT LIMIT CLAIM MUST MATCH THE DISCLOSED FRESH-CLONE BYPASS
==================================================

Keep the originParent + continue_on chain design.

But do not describe MAX_PUBLICATION_ATTEMPTS = 3 as globally unbypassable.

Revision 3 must say precisely:

- the maximum is hard within one persistent attempt-ledger lineage;
- a new process sharing that ledger cannot reset it;
- a BRANCH_ADVANCED rebuilt candidate follows the same logical publication chain through continue_on;
- NOT_PUBLISHED remains on the same chain;
- UNKNOWN_OUTCOME remains stop/read-back behavior;
- PUBLISHED terminates that chain;
- a later legitimate transition starts a fresh chain;
- the already-disclosed fresh-clone / fresh-ledger bypass remains a procedural limitation and is not claimed as mechanically prevented.

Add/retain tests for:

1. sequential legitimate publications with no handoff do not falsely exhaust;
2. three BRANCH_ADVANCED attempts across rebuilt candidates exhaust the same logical chain;
3. NOT_PUBLISHED counts against the same chain;
4. UNKNOWN_OUTCOME behavior is unchanged;
5. another process sharing the same ledger cannot reset the count;
6. --transition-id still works;
7. old-format keys are inert;
8. after PUBLISHED terminates a chain, the next legitimate transition receives a fresh chain and does not inherit the old count.

==================================================
ARCHITECT DECISIONS ON THE TWO OPEN QUESTIONS
==================================================

Q1 — RFC-023 or RFC-020 amendment?

Decision:
USE NEW ML-DEVOS-RFC-023.

Reason:
V2.1 reaches beyond RFC-020 directive transport into:
- routing policy;
- evidence discipline;
- startup context;
- STATE body policy;
- obligation presentation;
- RFC lifecycle projection;
- publication-attempt bookkeeping.

RFC-020 remains historical authority for V2 directive transport.
RFC-023 is an additive policy/efficiency amendment to Protocol V2.

Q2 — Should envelope steps and remediation share MAX_REMEDIATION_CYCLES?

Decision:
NO.

Envelope progression uses the finite ordered step list in the owner Decision.

CURRENT_REMEDIATION_CYCLE / MAX_REMEDIATION_CYCLES remain remediation-only.

No new STATE field is added.

==================================================
REVISION 3 OUTPUT
==================================================

Return a self-contained Revision 3 that incorporates only these corrections.

Preserve the strong parts of Revision 2.

Include:

- corrected root causes;
- disposition table;
- final BC-1 through BC-12;
- exact RFC status-pointer text;
- corrected attempt-ledger semantics;
- RFC-023 decision;
- exact minimal file-amendment set;
- migration compatibility;
- tests;
- measurable success criteria.

Still design only.

Do not:
- edit the repository;
- publish an RFC;
- record an owner adoption Decision;
- implement checker changes;
- change STATE;
- touch production;
- touch S6/S7.

Return Revision 3 to the Architect for final review.
````
