# Current Handoff — RFC-022 Amendment (D-105)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-AMEND-0001
cycle_id: MAISOGLABS_WEB_RFC022_AMENDMENT
input_base_commit: 678f038181665159781cf308664c8f48c16f16b1
review_target_commit: 678f038181665159781cf308664c8f48c16f16b1
applicable_review_id: ML-DEVOS-AS-131
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Evidence is `ACTOR_REPORTED`.

## Objective

Execute `DIR-WEB-RFC022-AMEND-0001` (D-105): amend the `DRAFT` `ML-DEVOS-RFC-022` to incorporate Paulo's owner decisions Q1–Q5 and the `ML-DEVOS-AS-131` findings. Return it for final Architect review.

## Result

**D-105 publication:** `678f038181665159781cf308664c8f48c16f16b1` (parent `716b9b7…`; check-only exit 0, compare-and-swap publish attempt 1).

RFC-022 is amended and stays **`DRAFT`**. The main changes (RFC §11 amendment log):

- **§3 D-093 amendment (Q1):**
  - the file stays immutable and byte-identical;
  - only the "every served `/` equals the artifact" requirement is narrowly superseded;
  - the served response may differ only by the §5.2 bridge span, and only when validated published content exists;
  - `HOMEPAGE_ARTIFACT_CONTRACT.md` is updated at CB-5, not now.
- **§5.4 fail-safe (AS-131 precision):**
  - it states what may be claimed (no D1 dependency for homepage content availability) and what must not be claimed (no new runtime dependency);
  - it records the residual Worker/platform-before-fallback risk as explicit and accepted (Q2), not mitigated.
- **§5.5 routing (Q2):** exact `/` only; no other asset route.
- **§4 initial content (Q3):**
  - ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat;
  - the email preference and its owner-attested deliverability precondition;
  - explicitly no authored copy. Eternal Eggs copy does not exist in the repository, and the all-or-nothing projects group keeps the artifact data until all five are complete.
- **§4 deferrals (Q4/Q5):**
  - Tier 2 / artifact v2, About, CTAs and structural panels;
  - `/api/site-content` removed from the contract (it was previously optional);
  - CB-6 deferred.
- **§6:** the migration is marked as proposed and not authorized before acceptance. No snapshot table, and no second CMS.
- **§7:** the twelve AS-131 acceptance tests, verbatim in substance.
- **§9 risks:** updated with missing Eternal Eggs copy, unconfirmed email deliverability, and the RFC-021 C1 remainder.
- **§10:** increments CB-1..CB-5 and CB-R, each needing its own authority. CB-6 and CB-7 are deferred.

## Changed files

**D-105 publication commit (`678f038`):** `brain/DECISION_LOG.md` (D-105), `coordination/CURRENT_DIRECTIVE.md`, `coordination/STATE.md`.

**This return commit:**
- `devos/changes/rfcs/ML-DEVOS-RFC-022.md`: the amendment.
- `devos/changes/rfcs/README.md`: the RFC-022 index row updated (still DRAFT).
- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to the Architect, directive deselected.
- `coordination/archive/directives/DIR-WEB-RFC022-AMEND-0001.{md,provenance.json}`: byte-identical directive archive, plus its index row.

## Tests and evidence

- **Bootstrap:** before D-105, tip `716b9b7`, `TURN: PAULO`, scope `AS131_RFC022_OWNER_DECISIONS_ONLY`, all flags `NO`, D-105 absent, exit 0. After publication, exit 0 on `678f038`.
- **Diff scope:** only `ML-DEVOS-RFC-022.md` (+141/−72 including the rewrite) and its README row.
- **Traceability validator:** the same three pre-existing errors (`CORE-022`, `WEB-REQ-009`, `D-000`); no new errors.
- **Artifact:** `public/index.html` SHA-256 `2417f7e5…9f9` is unchanged.
- No tests were run beyond these: there is no code change.

## Unresolved findings and limitations

1. **Q3 content prerequisites:** Eternal Eggs has no approved V10 copy, and `paulo.maisog@maisoglabs.com` deliverability is unconfirmed. Both are owner inputs needed before the relevant groups can publish after implementation. The RFC does not invent them.
2. **The "currently verified working address"** is not identified in the repository. The artifact shows `maisog36@gmail.com`, but its verification status is not recorded. The owner should name it at release.
3. **Checker gap (reported at AS-131 publication):** `check-context-bootstrap.mjs --check-only` accepted a review-publication candidate missing its STATE transition. This is not fixed here (out of scope). It is offered as a follow-up.
4. **Carried forward:**
   - AS-129 F-6 (Access placeholders);
   - the AS-130 preview tradeoff;
   - production D1 state unknown;
   - A-3 and A-6 open;
   - S6 parked at ML-DEVOS-AS-103; O1 and O2 open; D-068 held;
   - OBL-015 and OBL-017 unchanged.

## Confirmations

- No change to the accepted plan, `HOMEPAGE_ARTIFACT_CONTRACT.md`, `public/**`, `app/**`, `worker/**`, `migrations/**`, tests or config.
- No CB-1..CB-7 work, no Cloudflare call, no remote D1/R2, no deployment, no `main` change.
- No PR #7, PR #10, S6/S7 or D-068 action.
- RFC-022 remains `DRAFT`.

## Evidence locations

- `devos/changes/rfcs/ML-DEVOS-RFC-022.md` (§3, §4, §5.4, §5.5, §7, §11).
- `brain/DECISION_LOG.md` (D-105).
- `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md` (accepted planning basis, unchanged).
- `coordination/archive/directives/DIR-WEB-RFC022-AMEND-0001.md`.

## Governing references

- **Authority:** D-105.
- **Directive:** DIR-WEB-RFC022-AMEND-0001 (archived).
- **Reviews:** ML-DEVOS-AS-131.
- **Decisions:** D-104, D-093.
- **RFCs:** ML-DEVOS-RFC-022 (DRAFT, amended), ML-DEVOS-RFC-021.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect performs the final review of the amended RFC-022 under the next unused immutable Architect Sync ID after ML-DEVOS-AS-131. Acceptance would still authorize no implementation: CB-1..CB-5 and CB-R each need their own owner decision.
