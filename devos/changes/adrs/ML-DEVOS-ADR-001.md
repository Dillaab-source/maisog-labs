# ADR-001: Adopt the S1 Governance Kernel and close the v1.2.0 → v1.3.0 transition

Status: `ACCEPTED`

Related RFC: `none — retroactively documenting a pre-S1 decision`. The S1 Governance Kernel — including the RFC/ADR system this ADR is itself the first instance of — was authorized and built before that system existed to route proposals through. `D-012`/`ML-DEVOS-AS-003` are the pre-RFC bootstrap authorization/design records, exactly as `devos/governance/specifications/VERSIONING_POLICY.md`'s "S1 bootstrap transition" section anticipated.
Architect Sync: `ML-DEVOS-AS-004` (three remediation cycles; final verdict `SENTINEL S1 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`)
Paulo decision: `D-013` (`brain/DECISION_LOG.md`)
Implementation evidence: `28a110b532e202431b7371134943a5b7f385e62b` (initial S1 candidate), `65c02a44e54618b70b23417f11802fb8fca148a4` (remediation cycle 1), `c2ba03745467d310c2b6c1bb59acfca916a72d69` (remediation cycle 2), `df9675cbc2baac398071dc77ba6c4728cf54d2d5` (remediation cycle 3, final) — `INDEPENDENTLY_INSPECTED` by the Architect at each cycle, per `coordination/ARCHITECT_REVIEW.md`'s `ML-DEVOS-AS-004` findings; the validator command output demonstrating static-shape enforcement remains `ACTOR_REPORTED` (the Architect inspected the validator implementations and test matrix rather than independently executing them in a separate runtime — see `ML-DEVOS-AS-004`'s "Validator evidence disposition").
Effective version: `1.3.0`

## Decision

The S1 Governance Kernel is the active Sentinel governance-capability baseline. Its static artifacts under `devos/governance/`, `devos/templates/`, `devos/changes/`, and the rule registry `devos/governance/rules/core-rules.json` are adopted, not merely proposed. The five S1-origin rules — `CORE-008`, `CORE-009`, `CORE-016`, `CORE-017`, `CORE-018` — are `ACTIVE` as of `effective_version: "1.3.0"`. Sentinel's governance-capability baseline transitions from `v1.2.0` to `v1.3.0`.

This decision does not activate, imply, or pre-authorize any later Sentinel phase (S2+), any runtime enforcement mechanism, or any application/deployment/CI change. It closes S1 as a documentation/static-governance milestone only.

## Context

S0 froze `ML-DEVOS-ARCH-001` (the constitutional architecture) and `ML-DEVOS-SIP-001` (the roadmap) at `v1.2.0`, establishing thirteen constitutional/core rules and the five-actor model. `D-012`, acting on `ML-DEVOS-AS-003`, authorized a follow-on `S1 — Governance Kernel` cycle to formalize how Sentinel itself may change after S0: eight change classes, a machine-readable rule registry, RFC/ADR/waiver templates, a Decision Packet specification, a Governance Bundle specification, and a versioning policy — explicitly as static, non-runtime artifacts, with no Policy/Task Engine, Orchestrator, Evidence Gate, or Capability Gateway implementation.

S1 went through an initial candidate and three Architect-reviewed remediation cycles:

- Cycle 0 (`28a110b`): initial candidate, returned `NOT APPROVED — CHANGES REQUESTED (CYCLE 1)` with nine findings `S1-F001`…`S1-F009`.
- Cycle 1 (`65c02a4`): resolved the largest conceptual problems (class-minimum authority/risk floors, evidence-model incoherence, a nonexistent waiver validator, an unreliable YAML parser, incorrect overlay-weakening wording, Decision Packet payload ambiguity, misrepresented rule provenance, an undisclosed Architect Sync history gap, an off-by-one file count). Returned `NOT APPROVED — CHANGES REQUESTED (CYCLE 2)` — two findings (`S1-F001`, `S1-F005`) resolved, seven partially resolved with specific remaining gaps.
- Cycle 2 (`c2ba037`): closed the remaining architecture/provenance issues (explicit evidence AND/OR semantics, waiver authority-reference binding and authoritative expiry, fail-closed validators, a tightened Decision Packet schema, a corrected versioning policy with an explicit bootstrap-transition section, a real Git-history backfill of `ML-DEVOS-AS-001`/`ML-DEVOS-AS-002`). Returned `NOT APPROVED — FINAL REMEDIATION REQUIRED (CYCLE 3)` — one substantive blocker remained (waiver validator/schema equivalence) plus a bookkeeping wording correction.
- Cycle 3 (`df9675c`, final): closed the last technical blocker (`validate-waivers.mjs` now enforces the complete declared `waiver-record.schema.json` shape) and corrected the file-count wording. Returned `SENTINEL S1 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`.

The Architect's approval explicitly did not itself activate the five S1-origin rules, apply `v1.3.0`, or create a closure ADR — per `VERSIONING_POLICY.md`'s bootstrap-transition section, `CORE-016`/`CORE-017`/`CORE-018` are themselves `CORE_POLICY`-class and therefore require their own class's Paulo gate to activate, separate from and later than Architect technical approval. The Architect routed exactly that decision to Paulo, who approved it (`D-013`), authorizing this ADR.

## Alternatives considered

- **Leave the five S1-origin rules `PROPOSED` indefinitely.** Rejected: an Architect-approved, three-cycle-hardened governance kernel that never actually takes effect provides no real governance capability — it would remain permanently aspirational documentation, contradicting the purpose of building it.
- **Apply `v1.3.0` and activate the rules without a durable ADR.** Rejected: `CHANGE_GOVERNANCE_POLICY.md` §3 and `VERSIONING_POLICY.md`'s binding rule both require that a version bump never happen silently and that material changes preserve an ADR recording what changed and why. Skipping the ADR would repeat exactly the "misrepresent unapproved governance as already-effective" pattern `S1-F007` corrected.
- **Retroactively write a full `CONSTITUTIONAL`-class RFC before this ADR.** Rejected: the RFC system is itself part of what S1 built: requiring an RFC to have preceded S1's own authorization would be circular. `D-012`/`ML-DEVOS-AS-003` are the accepted pre-RFC bootstrap authorization/design records for exactly this reason, matching how `D-010`/`AS0-*` served the same bootstrap role for the S0 freeze. A future `CONSTITUTIONAL`-class change to Sentinel governance, from this point forward, does go through the full RFC → Architect Sync → Decision → Implementation → ADR path this ADR itself helps establish.
- **Fold rule activation into a broader S2 authorization.** Rejected: Paulo's decision and the Architect's routing both explicitly separate S1 closure from any S2 authorization — conflating them would let S1 closure quietly imply S2 scope it was never reviewed for.

## Rationale

Given the alternatives above, closing S1 now — with the rules activated, the version transition applied, and a durable ADR recording it — is the only option consistent with `CORE-006` ("a claim of implemented ... requires a cited evidence class ... never silently upgraded") and `CORE-011` ("conversation cannot silently supersede the frozen baseline"): the governance kernel has been independently reviewed across three cycles, every technical finding is resolved, and Paulo — the designated Product/Risk Owner — has explicitly authorized exactly this closure in the form the Architect requested. Deferring further would leave a fully-reviewed capability inert for no articulated reason, while proceeding without this ADR would violate the very versioning discipline S1 exists to enforce.

## Consequences

**This makes possible / easier:**
- `CORE-016`, `CORE-017`, `CORE-018` are now binding stage-specific evidence rules (`MAIN`/`DEPLOYED`/`VERIFIED` claims each have an explicit, non-ambiguous evidence requirement) rather than merely proposed text.
- `CORE-008` (capability onboarding requires explicit role/scope authorization) and `CORE-009` (project overlays cannot silently weaken core rules) are now active constraints on any future capability or project-onboarding proposal.
- Future governance changes have a real, adopted RFC → Architect Sync → Decision → ADR path to follow, with this ADR as the first working example of that path's output shape.
- Waivers, Decision Packets, and the rule registry are now validated against a schema that is itself part of an adopted (not merely candidate) governance baseline.

**This makes harder / does not solve:**
- None of this is runtime-enforced. A Builder, Architect, or future automated agent can still violate any of these now-active rules; only human/process discipline and manual validator runs catch it, exactly as before activation. Activation changes the rules' authority status, not their enforceability.
- The waiver/Decision Packet validators still cannot verify that a cited `approver`/`paulo_decision_ref`/`architect_sync_ref` is genuine — only that it is present and correctly shaped. Activation does not close this gap; it remains explicitly disclosed, as it was pre-activation.
- `requirements.yaml`/`risks.yaml`/`capabilities.yaml` field-level schemas (for project onboarding) remain unspecified beyond the purpose level — a pre-existing, disclosed limitation this ADR does not resolve.
- This ADR does not authorize, and must not be read as implying authorization for, any Policy/Task Engine, Orchestrator, Evidence Gate, Capability Gateway, CI/workflow, GitHub ruleset, website/admin change, project migration, deployment, or protected-branch/`main` merge. S2 remains a wholly separate, not-yet-requested authorization.

## Related RFC

None. See "Alternatives considered" above for why a retroactive RFC was rejected, and `devos/governance/specifications/VERSIONING_POLICY.md`'s "S1 bootstrap transition into the RFC/ADR system" section for the standing policy this follows.

## Architect Sync

`ML-DEVOS-AS-004` (archived durably at `devos/changes/architect-syncs/ML-DEVOS-AS-004.md`). Final verdict: `SENTINEL S1 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`, with all nine `S1-F001`…`S1-F009` findings resolved across three remediation cycles.

## Paulo decision

`D-013` (`brain/DECISION_LOG.md`) — explicit approval of S1 activation and v1.3.0 version closure, quoted verbatim in that entry.

## Implementation evidence

- `28a110b532e202431b7371134943a5b7f385e62b` — initial S1 candidate (`ACTOR_REPORTED`, Architect-`INDEPENDENTLY_INSPECTED`).
- `65c02a44e54618b70b23417f11802fb8fca148a4` — remediation cycle 1 (`ACTOR_REPORTED`, Architect-`INDEPENDENTLY_INSPECTED`).
- `c2ba03745467d310c2b6c1bb59acfca916a72d69` — remediation cycle 2 (`ACTOR_REPORTED`, Architect-`INDEPENDENTLY_INSPECTED`).
- `df9675cbc2baac398071dc77ba6c4728cf54d2d5` — remediation cycle 3, final, Architect-approved (`ACTOR_REPORTED` for validator execution output; `INDEPENDENTLY_INSPECTED` for implementation/schema alignment, per `ML-DEVOS-AS-004`'s "Validator evidence disposition").
- This ADR's own commit — activates `CORE-008`/`CORE-009`/`CORE-016`/`CORE-017`/`CORE-018` in `devos/governance/rules/core-rules.json` and records the `v1.3.0` transition. `ACTOR_REPORTED` until independently inspected by the Architect.

No `RUNTIME_OBSERVED` or `CI_ATTESTED` evidence is claimed anywhere in this ADR — S1 is a static documentation/governance-data cycle with no deployed runtime and no CI, and none is claimed.

## Effective version

`1.3.0` — the Sentinel governance-capability baseline, as of this ADR. This is distinct from, and does not alter, the frozen S0 architecture document `devos/architecture/ML-DEVOS-ARCH-001.md`, whose own title/identity as "MaisogLabs DevOS v1.2.0 — SENTINEL" remains its permanent, unedited historical name — `v1.3.0` describes the governance-capability layer S1 added on top of that unchanged S0 baseline, not a rewrite of the S0 baseline's own generation number.

## Supersedes / superseded by

Supersedes: none — this is the first ADR in the repository (`adr_id: null` was correct and expected for every rule before this point, per `devos/governance/rules/README.md` and `ADR_TEMPLATE.md`'s own header comment).
Superseded by: none, as of this cycle.
