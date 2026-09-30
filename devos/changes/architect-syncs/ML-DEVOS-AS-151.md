# Architect Review — Context Bootstrap V2.1 proposal, revision 1 (design only)

Architect Sync: ML-DEVOS-AS-151
Status: CHANGES_REQUESTED — V2.1 DESIGN ONLY
Cycle: V2.1 design review (owner-requested advisory; no governed cycle)
Authority: advisory design review requested by Paulo while live STATE was `TURN: PAULO` at `4e8a4789e2289477b6bf10076f86a36b1e1a04d3`
Prior review: ML-DEVOS-AS-150 (last previously published review; unrelated)
Reviewed artifact: V2.1 proposal revision 1 (Builder chat output; not in the repository)
Next review: ML-DEVOS-AS-152
Protocol: PROTOCOL_VERSION 2

Provenance: this is the Architect's review of V2.1 proposal revision 1. It was delivered in the Architect review conversation and relayed by Paulo into the Builder session in chat. It was **never previously published to the repository**. It is durably persisted now, under `D-127` (review record preservation), from that earlier conversation. The Sync ID was assigned at persistence by the Builder as mechanical publisher, not by the Architect. The Builder did not author this review. Committed text proves provenance, not authority.

Fidelity:
- The review text below is reproduced verbatim as the Builder received it. Nothing was reconstructed, reworded or added.
- **Relay gaps:** the relayed text contains three `Pasted text` markers. At each, the relaying client elided a pasted quotation. The elided content is not recoverable in the Builder session and was not reconstructed. The markers are kept verbatim.
- Paulo confirmed in the Builder session (2026-09-30) that the three closing paragraphs ("The strongest part…", "The biggest part I reject…", "I also agree…") are the Architect's, and chose to persist the review as relayed with these gaps disclosed.
- The review was relayed twice with identical text (the first transmission was interrupted). One copy is persisted.
- Revision 1 itself (the reviewed artifact) was not available in the Builder session and is not persisted.

## Review text (verbatim as relayed)

````text
Architect review: CHANGES_REQUESTED — V2.1 design only.
The proposal is directionally accepted, but revise the design before any adoption or implementation.
Preserve the overall thesis and Authorized Work Envelope. The following corrections are required:

1. Do not weaken archive retention in V2.1.
The proposal currently suggests dropping separate archive copies for LIGHT/non-consequential transitions and relying on Git history. Keep the existing handoff/directive/Architect-Sync preservation behavior unchanged for this amendment.
Archive storage is not the primary token cost because it is cold unless retrieved, and MaisogLabs has already experienced missing durable review archives. Simplifying this now introduces historical/provenance risk for little immediate benefit.
Archive-retention reduction may be evaluated separately later if measurements justify it.
2. Correct R1 and R2 terminology.
Do not state that the Architect has “no write channel” as an architectural fact. The accurate finding is:
`No Architect execution channel has yet satisfied the governed-write/CAS requirement in OBL-012.`
Likewise, Independent Verification is already required by `ARCHITECT_SYNC.md`. The problem is operational drift / failure to exhaust that capability before requesting Paulo relay, not absence of the rule.
V2.1 should strengthen execution of the existing rule, not pretend to introduce it.
3. Do not make any unverified evidence automatically ESCALATED.
The current proposal escalates whenever the Architect cannot upgrade an evidence class. That is too broad and would make ordinary Builder test results ESCALATED almost every time.
Replace it with:
`ESCALATED when unavailable independent evidence is material to a consequential acceptance claim and repository/source inspection cannot provide sufficient confidence.`
Actor-reported ordinary test execution may remain STANDARD when its limitation is explicit and the consequence does not require reproduction.
4. Do not add CURRENT_RECORD or other new STATE fields merely to make STATE thinner.
Reuse the existing STATE header fields (`AUTHORIZED_SCOPE`, selectors, flags, TURN/status). Make the body short and refer to the applicable Decision/Review.
The objective is fewer fields and less narrative, not a new mini-schema.
5. Refine lifecycle-status ownership.
`devos/changes/rfcs/README.md` may become the canonical current RFC status index, but it must remain subordinate to Decisions/ADRs and the established source-of-truth precedence.
Do not silently elevate a README above Decisions/ADRs.
The intended rule should be:
`Decisions/ADRs establish authority/history; the RFC index is the single maintained projection of current RFC lifecycle status; RFC bodies stop carrying mutable lifecycle prose.`
The validator should detect drift between that projection and its authoritative references.
6. Keep `PROTOCOL_VERSION: 2`. Do not add a `PROTOCOL_AMENDMENT` STATE field.
With archive semantics preserved, STATE schema unchanged, CAS unchanged, directive/handoff identity unchanged, and authority semantics unchanged, this can be a backward-compatible V2 policy amendment.
“V2.1” may be the human-facing amendment name recorded by Decision/RFC; it does not need another machine-readable STATE selector.
If subsequent design introduces an incompatible parser/schema requirement, reconsider the version then.
7. Authorized Work Envelope: ACCEPT with one clarification.
Architect may route directly to another pre-authorized Builder step only when that exact continuation is explicitly inside Paulo's envelope, all required action flags are already valid for it, the remediation/work budget remains available, and no owner re-entry trigger occurred.
Otherwise acceptance returns to Paulo.
8. Keep the proposed attempt-ledger fix, but verify implementation semantics before adoption.
`CYCLE:<parent-tip-sha>:<target-turn>` is directionally correct because retry exhaustion should bind to one publication attempt against one authoritative parent.
Preserve the hard maximum of 3 and existing ambiguous-outcome/read-back behavior.
9. Thin obligations: ACCEPT.
OPEN/DEFERRED should be the always-loaded set. Closed history should remain discoverable. Determine whether the existing repository/history already provides sufficient discovery before introducing `obligations-closed.md`; do not create a new file merely because the draft proposed one.
10. Keep these parts substantially unchanged:
Authorized Work Envelope; Adaptive SENTINEL/SU; Constructive Dissent; Author ≠ Publisher; Existing-Capability-First; Knowledge Treasury reuse; `CLAUDE.md` slimming; thin STATE; lifecycle-status deduplication; attempt-key repair.

Then return V2.1 proposal revision 2 only with:

* corrected root-cause statements;
* revised disposition table;
* revised behavioral contract;
* exact minimal file-amendment set;
* migration compatibility;
* measurable success criteria.

Do not implement, commit, publish, change STATE, resume S6/S7, or touch production.
The strongest part of Claude's proposal is the Authorized Work Envelope. It reuses the remediation budget rather than introducing another control mechanism, and it defines concrete owner re-entry conditions. Pasted text I want that to survive revision.
The biggest part I reject is reducing archival guarantees right now. Claude proposes that Git history alone become the archive for LIGHT transitions. Pasted text That saves almost no working context because those archives aren't normally loaded, while weakening a mechanism we built specifically after losing durable review records. That's the sort of simplification that looks efficient on paper but removes robustness without attacking the actual token bottleneck.
I also agree with the proposal's measurable target: owner interactions should fall sharply while safety regressions remain zero. Pasted text That's how we should judge V2.1 after implementation—not by how many rules we delete.
````
