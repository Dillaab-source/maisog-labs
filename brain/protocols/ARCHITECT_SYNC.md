# Architect Sync Protocol

This formalizes the review flow from `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` §19, aligned with the live mechanism in `coordination/` (`STATE.md`, `CURRENT_HANDOFF.md`, `ARCHITECT_REVIEW.md`, `OPERATIVE_OBLIGATIONS.md`) under the Context Bootstrap V0 protocol (`brain/protocols/CONTEXT_BOOTSTRAP.md`).

## Review flow

```
Repository state
  → Governance requirements
  → Governance Map
  → Implementation
  → Tests
  → Evidence
  → Git diff
  → Security/risk review
  → Contradictions
  → Verdict
```

The Architect inspects repository reality independently at every step. The Builder's handoff (`coordination/CURRENT_HANDOFF.md`, selected by STATE's identity tuple) is an input, never proof by itself. `coordination/IMPLEMENTER_HANDOFF.md` is frozen pre-V0 history.

## Review modes

1. **CHANGE REVIEW** — scoped to the current change/cycle only.
2. **STAGE GATE REVIEW** — broader review of a full development stage (e.g. closing Phase 0, closing Phase 1) before the next phase may be authorized.
3. **RELEASE REVIEW** — evidence-based readiness assessment for production release.
4. **SECURITY REVIEW** — focused review of security boundaries (auth, input validation, secrets, injection surfaces).

## Stage Gate Review — Closure Preflight and Closure Verification

Added by `ML-DEVOS-RFC-015` / `ML-DEVOS-AS-059` / `D-044` / `D-045`. When a `STAGE GATE REVIEW` is specifically asked to approve a **phase closure package** (a request to move a reserved root from `NOT_IMPLEMENTED` toward `IMPLEMENTED` in `devos/devos-manifest.json`, or an equivalent architecture-level closure), it includes two checklists at two distinct moments of the *same* gate — not a new phase, Skill, agent, database, or record type. Both produce findings inside the same `coordination/ARCHITECT_REVIEW.md` / durable `ML-DEVOS-AS-<NNN>` archive this protocol already uses; neither introduces a new file location.

A `STAGE GATE REVIEW` not requesting a phase closure is unaffected — these checklists add no overhead to ordinary implementation reviews.

### D.1 Pre-decision Closure Preflight

Runs when the closure package is proposed, **before** it reaches Paulo. Checks the *proposed* package only — never a fact that only Paulo's later decision can create:

1. the candidate implementation has already passed its own independent technical review (e.g. a prior `STAGE GATE REVIEW: ARCHITECT_APPROVED`);
2. the exact base SHA the closure diff is proposed against is named;
3. current RFC-status/manifest/rolling-handoff state is inspected and every stale surface found is listed explicitly;
4. the proposed RFC-status edit is stated exactly;
5. the proposed manifest edit (`status: IMPLEMENTED` + `closure_ref`) is stated — `closure_ref` may name the ADR closure intends to produce even before that ADR exists, since this item checks the proposal's shape, not its final resolution (D.2's job);
6. the proposed `closure_history` entry shape is complete, though final `adr`/`decision`/`architect_sync` identifiers may remain unresolved pending authorization;
7. the proposed ADR's content/provenance (which RFC/Architect-Sync(s)/Decision(s) it will cite) is identified, correctly distinguishing "authorized implementation" from any later "authorized reopening";
8. version disposition (bump or explicit no-bump) is stated and checked against `devos/governance/specifications/VERSIONING_POLICY.md`'s PATCH/MINOR/MAJOR criteria;
9. the pre-closure traceability `ERROR` finding set (by rule ID + subject ID) at the named base SHA is recorded as the baseline fingerprint D.2 will compare against;
10. the proposed diff is bounded to what the closure package claims;
11. the proposal does not, explicitly or by omission, treat this closure as authorizing any later phase.

### D.2 Post-decision Closure Verification

Runs **after** Paulo authorizes the closure and the bounded closure implementation is committed. Checks the *actual* repository state, never a proposed value:

1. the final RFC status banner reads the actual accepted/closed outcome;
2. the final ADR exists under `devos/changes/adrs/`;
3. the final Decision exists in `brain/DECISION_LOG.md`;
4. the manifest `closure_ref` resolves to exactly one `closure_history` entry by `adr`;
5. that matched entry's `phase` equals the root's `owning_phase`;
6. `sentinel_capability_baseline` and the new `closure_history` entry agree on ADR/Decision/version;
7. the rolling handoff header and any "current phase" wording (`brain/00_HOME.md`, `CLAUDE.md`) are current;
8. traceability derived outputs (`devos/governance/traceability/traceability-index.json`/`TRACEABILITY_INDEX.md`) have been regenerated and show no drift;
9. every `ERROR` in D.1's recorded baseline is still identifiable, unless separately resolved with its own evidence;
10. no `ERROR` absent from that baseline was newly introduced by the closure;
11. no next-phase authority was silently introduced by the closure commit.

Neither checklist requires the overall traceability `ERROR` count to reach zero — items 9/10 concern the *delta* from the named baseline only; pre-existing, previously disclosed findings remain a separately tracked debt item, not a closure blocker.

## Verdict rules

A `CHANGE REVIEW` may return:

- `READY TO COMMIT: YES`
- `READY TO COMMIT: NO`
- `READY TO COMMIT: YES WITH FOLLOW-UP`

`READY TO COMMIT: YES` means no unresolved blocker introduced by, materially affecting, or required for the specific change under review remains unresolved. It does **not** mean the whole project has zero unresolved risk — pre-existing, unrelated risk (see `RISK_REGISTER.md`) does not block an unrelated documentation or scoped change.

`STAGE GATE REVIEW`, `RELEASE REVIEW`, and `SECURITY REVIEW` must state a verdict appropriate to their explicitly declared broader scope (e.g. `PHASE N STAGE GATE: APPROVED` / `NOT APPROVED`, as used for Phase 0's closure).

## Turn protocol (mechanical layer)

`coordination/STATE.md` is the machine-readable turn signal. Its header fields (before the first `## `) are the authoritative field list; `brain/protocols/CONTEXT_BOOTSTRAP.md` §2 defines the V0 selector fields (`PROTOCOL_VERSION`, `CURRENT_HANDOFF`, `HANDOFF_ID`, `REVIEW_TARGET_COMMIT`, `APPLICABLE_REVIEW_ID`). This protocol document only records the intent:

- Every governed read uses one exact commit; every governed write is one candidate commit parented on the exact tip, published with exact-old-value compare-and-swap.
- The Builder (`TURN: CLAUDE` is the role token) makes governed writes only when `TURN: CLAUDE` and `IMPLEMENTER_ACTION_REQUIRED: YES`, and hands off by publishing `CURRENT_HANDOFF.md` together with the matching STATE selector tuple and `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` in one commit.
- The Architect reviews independently and publishes the review under a **new immutable `ML-DEVOS-AS-NNN`** (never reusing an ID with changed bytes; `AS79-R001`), with its byte-identical archive in `devos/changes/architect-syncs/`, in one commit that sets the state to one of `CHANGES_REQUESTED` (`TURN: CLAUDE`), `ARCHITECT_APPROVED` (`TURN: PAULO` when a gate applies), `PAULO_DECISION_REQUIRED` (`TURN: PAULO`), or `BLOCKED`. When that routing stops selecting the Builder's handoff (`CURRENT_HANDOFF: NONE`, selectors empty), the same commit archives the handoff's exact bytes under `coordination/archive/handoffs/`.
- Owner-requested advisory, read-only analysis is permitted on any turn and writes nothing governed.
- Only Paulo can authorize a new phase, deployment, or a `main` merge — an `ARCHITECT_APPROVED` stage-gate verdict is a recommendation, not an authorization. Committed text proves provenance, not authority.

## Remediation loop cap

Autonomous remediation cycles are capped at the live value of `MAX_REMEDIATION_CYCLES` in `coordination/STATE.md` (no fixed number is restated here). If the cap would be exceeded without approval, the state moves to `PAULO_DECISION_REQUIRED` and both agents stop autonomous looping. Paulo may explicitly raise the cap; neither agent may raise it unilaterally.

## Evidence discipline

Every claim in a review or handoff is one of: implementer-reported, Architect-reproduced, or production/runtime evidence (see `TEST_LEDGER.md`). A review must state which class each piece of evidence it relies on belongs to, and must not silently upgrade implementer-reported evidence to Architect-reproduced just because it inspected the surrounding code — reproduction means actually running or independently verifying the same check.
