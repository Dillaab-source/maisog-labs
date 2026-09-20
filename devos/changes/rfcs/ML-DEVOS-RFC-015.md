# ML-DEVOS-RFC-015: Reserved Subsystem Lifecycle and Closure Reconciliation

Status: `DRAFT`

Proposed change class: `ARCHITECTURE`

Sentinel phase: none owned — this is a correction to the S2 DevOS Repository Foundation's manifest schema (`ML-DEVOS-RFC-001`) and to the existing Architect Sync procedure (`ML-DEVOS-AS-003`), not a new numbered phase.

Authority: `D-043` (Paulo — authorize this proposal cycle only; no implementation authority is granted by that decision or by this RFC).

## Problem

`devos/devos-manifest.json`'s `reserved_subsystem_roots` schema (`devos/schemas/devos-manifest.schema.json`) currently allows exactly two `status` values: `NOT_IMPLEMENTED` and `FOUNDATION_ACTIVE`. `FOUNDATION_ACTIVE` is explicitly reserved for the S2-owned `devos/schemas/` root alone. There is no legal value representing "this reserved root's owning phase has been implemented and governance-closed."

This gap was not theoretical: it surfaced as a real blocker. S3 Typed Task Contracts (`ML-DEVOS-RFC-013`) was implemented, technically stage-gate approved (`ML-DEVOS-AS-055`), and its closure package proposed setting `devos/contracts/` to an implemented status — a status the schema cannot express. A follow-up discrepancy review (`ML-DEVOS-AS-056`) found this alongside four related closure-provenance defects: a stale `DRAFT` status banner left on an implemented RFC, an authorization citation that named the wrong Decision ID for "who authorized implementation" versus "who authorized reopening," an architecture RFC's implementation lacking its own closure ADR and explicit version disposition, and a stale header on the rolling handoff file. None of these are S3-specific. They are instances of one underlying gap: **Sentinel has no lifecycle model for what happens to a reserved root, its owning RFC, its manifest entry, and its version/ADR record when a phase is actually implemented and closed** — only for what happens before that point (`NOT_IMPLEMENTED`) and for the one root S2 itself populates (`FOUNDATION_ACTIVE`).

Left unaddressed, every future phase closure (S4 through S14, and any other `ARCHITECTURE`-class root) will rediscover the same gap, and closure reviews will keep finding the same class of provenance drift after the fact instead of catching it before a Paulo closure decision is requested.

## Motivation

Sentinel's own operating principle is that governance-significant status changes must be explicit, reviewed, and never silent (`devos/governance/specifications/VERSIONING_POLICY.md`'s binding rule). A reserved-root status field that cannot represent "implemented" forces one of two bad outcomes: either closure is blocked indefinitely on a schema that predates the first real closure it needs to handle, or someone edits the manifest by hand outside the schema's own enum, which is exactly the kind of silent, unvalidated drift the manifest exists to prevent.

Equally, `ML-DEVOS-AS-056`'s four provenance findings (stale RFC status, an ADR/Decision citation naming the wrong ID, a missing closure ADR + version disposition, a stale handoff header) all share a root cause: nothing in the existing Architect Sync procedure explicitly checks whether these five surfaces — RFC status banner, manifest reserved-root entry, ADR, version baseline, rolling handoff header — agree with each other and with what was actually decided, before a closure decision is put to Paulo. Catching this class of drift after implementation, during a dedicated discrepancy review, cost an extra full review cycle (`AS-056`) that a lightweight preflight check inside the *existing* Architect Sync procedure would have caught for free.

If this RFC is not accepted, every future phase closure remains individually exposed to the same two problems: an unrepresentable status, and undetected cross-record drift.

## Proposed change

Two additive, backwards-compatible changes, both governance/schema-level only:

### A. A third reserved-root lifecycle status: `IMPLEMENTED`

Extend `devos/schemas/devos-manifest.schema.json`'s `reserved_subsystem_roots[].status` enum from:

```json
"enum": ["NOT_IMPLEMENTED", "FOUNDATION_ACTIVE"]
```

to:

```json
"enum": ["NOT_IMPLEMENTED", "FOUNDATION_ACTIVE", "IMPLEMENTED"]
```

`IMPLEMENTED` means: the owning phase's bounded repository capability described in its own accepted RFC has been built, independently reviewed, and closed under an explicit Paulo decision. It carries no other meaning. Specifically, `IMPLEMENTED` does **not** mean:

- the root's owning phase now has standing authority to act beyond what its closing RFC/ADR describes (`CORE-001`, `CORE-002` — a status field is data, never a delegation);
- the capability is deployed, running, or observed in production (`CORE-007`/`CORE-016`/`CORE-017`/`CORE-018`'s MAIN/DEPLOYED/VERIFIED distinctions are untouched by this field);
- any later phase is now authorized — `reserved_root_invariant`'s existing text ("no reserved root may contain executable implementation... until that phase is itself separately proposed, reviewed, and authorized") is unchanged and continues to gate every phase not yet closed.

`FOUNDATION_ACTIVE` remains permanently reserved for `devos/schemas/` alone; this RFC does not touch its meaning or eligibility. `NOT_IMPLEMENTED` remains the default and required status for every reserved root whose owning phase has not closed.

### B. A fail-closed link between `IMPLEMENTED` and durable closure evidence, not a bare flag

A status field alone is not evidence — it is exactly as trustworthy as whoever last edited the JSON file. To make `IMPLEMENTED` fail closed rather than become a second place drift can hide, each `reserved_subsystem_roots[]` entry gains one new, optional field:

```json
"closure_ref": { "type": ["string", "null"] }
```

`closure_ref` identifies **a unique closure event, not a phase category** (`ML-DEVOS-AS-057` `AS57-F002`): a `phase` value like `"S3"` is a label, not an identifier — a phase can legitimately receive a corrective/superseding closure record or a re-closure later while keeping the same `phase` label, so matching on `phase` alone would become ambiguous the moment more than one `closure_history` entry shares it. Every `closure_history` entry already carries `adr`, and ADR IDs are sequential and never reused (`devos/changes/adrs/`'s existing numbering convention), so `closure_ref` matches by `adr`, not by `phase`:

```json
"closure_ref": "ML-DEVOS-ADR-006"
```

Binding rule, enforced by `devos/schemas/validate-devos-manifest.mjs` (extended, not replaced). For a root with `status: IMPLEMENTED`, the validator must require **all** of:

1. `closure_ref` is non-null;
2. `closure_ref` matches the `adr` field of **exactly one** entry in `closure_history` (zero matches or more than one is a failure — a dangling or ambiguous reference is never tolerated);
3. that matched entry's `phase` field equals this root's own `owning_phase` (a `closure_ref` that resolves to a real ADR closing a *different* phase is still wrong — the reference must be event-specific **and** phase-correct);
4. that matched entry has non-empty `decision`, `architect_sync`, and `version` fields — all three are already required by the existing `closure_history` item schema (`devos/schemas/devos-manifest.schema.json` already lists `architect_sync` in that item's `required` array alongside `phase`/`closed_at`/`version`/`adr`/`decision`/`note`); this RFC's contribution is requiring the `IMPLEMENTED`-status validator to actually check that the *matched* entry satisfies them, not merely that some entry somewhere does;
5. `closure_ref`, and the `adr`/`decision`/`architect_sync` values it resolves to, are each structurally valid references under the repository's existing ID conventions (`ML-DEVOS-ADR-NNN`, `D-NNN`, `ML-DEVOS-AS-NNN` respectively) — not merely non-empty strings.

For `NOT_IMPLEMENTED` and `FOUNDATION_ACTIVE`: `closure_ref` must be absent or `null`, and must never point at a `closure_history` entry (a root that has not closed cannot cite a closure event). No existing `reserved_subsystem_roots[]` entry needs to be rewritten merely to add `closure_ref: null` — it is optional and its absence means the same as an explicit `null`, so this remains backwards-compatible with every current entry.

This means a root cannot become `IMPLEMENTED` by a bare status edit: it requires one specific, unambiguous, phase-matched `closure_history` entry to exist, carrying a real ADR, Decision, and Architect Sync citation. The status and its evidence cannot silently diverge or point at the wrong phase's closure, because the validator checks the full link on every run, not merely at the moment of the edit.

### C. `executable_runtime_present` — clarified meaning, not changed value

`AS-056` surfaced a real ambiguity: does S3 having a JSON Schema, a specification, a deterministic Node validator (`devos/contracts/validate-task-contract.mjs`), and examples/tests mean `devos/contracts/` now has "executable runtime present"? No — and this RFC proposes making that explicit in the schema's own field description rather than leaving it to institutional memory:

> `executable_runtime_present: false` means the root contains no active Sentinel operational subsystem that: owns or persists operational state; executes lifecycle/state transitions; dispatches or orchestrates actors; brokers or enforces capabilities; or performs autonomous or consequence-bearing operational actions. `executable_runtime_present: true` would mean at least one of those responsibilities is genuinely present — e.g. a Task Engine performing state transitions (S4), an Orchestrator dispatching agents (S8), a Capability Gateway enforcing tool access at runtime (S5).
>
> Repository-local schemas, specifications, deterministic validators, generators, and their tests may be executable code, and may be invoked manually or automatically (including from CI), without becoming a Sentinel runtime subsystem by that fact alone. **The distinction is what the code is responsible for, never how or when it happens to be invoked** (`ML-DEVOS-AS-057` `AS57-F005`): a validator that only checks or transforms a file already on disk, holding no operational state and making no consequence-bearing decision, remains non-runtime whether a human runs it once by hand or a future CI pipeline runs it on every commit. Conversely, invoking something manually does not make it non-runtime if what it actually does is own state, execute lifecycle transitions, or dispatch other actors.

A reserved root may therefore legitimately reach `status: IMPLEMENTED` while `executable_runtime_present` remains `false` indefinitely, exactly as S3 does under this proposal, until some later phase's own separately authorized implementation genuinely adds one of the responsibilities above.

This is a documentation/description clarification only — the field's type (`boolean`), its name, and every existing value (`false` everywhere in the current manifest) are unchanged. This RFC does not propose renaming the field.

### D. A lightweight Closure Preflight inside the existing Architect Sync procedure — two moments of one gate, not two new records

`brain/protocols/ARCHITECT_SYNC.md` already defines named review modes (Change Review, Stage Gate Review, Release Review, Security Review). This RFC adds one bounded closure-checklist concept — **Closure Preflight** — to a **Stage Gate Review specifically when that review is asked to approve a phase closure package** (i.e. a request to move a reserved root from `NOT_IMPLEMENTED` toward `IMPLEMENTED`, or an equivalent architecture-level closure). It is explicitly:

- **not** a new Sentinel phase, numbered stage, agent, database, or standalone Skill;
- **not** a new file location or new record type — its output is simply additional findings inside the same `coordination/ARCHITECT_REVIEW.md` / durable `ML-DEVOS-AS-<NNN>` archive the Stage Gate Review already produces.

A single checklist that tries to check both "is this a sound closure proposal" and "did the closure actually land correctly" in one pass conflates two different moments (`ML-DEVOS-AS-058` `AS58-F005`): some facts (a final ADR ID, a final `closure_history` entry, a post-closure traceability regeneration) genuinely cannot exist until *after* Paulo has authorized the closure and the bounded closure implementation has written them. A checklist item demanding those facts *before* the Paulo decision would force either pre-writing authoritative closure records ahead of authorization, or accepting placeholders as if they were final evidence — both recreate exactly the authority/status drift this RFC exists to prevent. Closure Preflight is therefore one concept expressed as **two checklist moments inside the existing Stage Gate / Architect Sync lifecycle**, not two new phases, Skills, agents, or record types:

#### D.1 Pre-decision Closure Preflight — checks the *proposed* package, before it reaches Paulo

Run once, when a Stage Gate Review is asked to approve a closure package, before that package is presented to Paulo for the closure decision. It validates the proposal, never facts that only Paulo's later decision can create:

1. **Implementation review status** — has the candidate implementation already passed its own independent technical review (e.g. S3's `ML-DEVOS-AS-055` technical stage-gate approval)? Closure Preflight is not a substitute for that review; it presupposes it already happened.
2. **Base SHA named exactly** — the closure package cites the exact commit the closure diff is proposed against.
3. **Current-state inspection** — the owning RFC's `Status:` banner, the relevant manifest entry, and the rolling `coordination/IMPLEMENTER_HANDOFF.md` header are read as they stand *today*, and every stale surface found is listed explicitly (this is where `AS56-F002`/`F003`/`F006`-class drift gets caught before, not after, implementation).
4. **Proposed RFC-status edit is defined** — what the `Status:` banner will read after closure, stated exactly, not left implicit.
5. **Proposed manifest edit is defined** — the proposed `status: IMPLEMENTED` and `closure_ref` value for the relevant root are stated; `closure_ref` may name the *ADR that closure intends to produce* even though that ADR does not exist yet, since this item checks the proposal's shape, not its final resolution (that is D.2's job).
6. **Proposed `closure_history` entry shape is complete** — every field the schema requires (`phase`, `closed_at`, `version`, `adr`, `decision`, `architect_sync`, `note`) is accounted for in the proposal; the exact final `adr`/`decision`/`architect_sync` identifiers may remain unresolved pending Paulo's authorization, since ADR/Decision numbers are assigned against the live directory at the moment each is actually written (see "Version impact"), not invented in advance.
7. **Proposed ADR content/provenance is identified** — which RFC, Architect Sync(s), and Decision(s) the future ADR will cite, and specifically that it names the correct Decision for "authorized implementation" versus any later "authorized reopening" rather than conflating them (`AS56-F003`'s exact defect).
8. **Version disposition is explicit** — bump or explicit no-bump, with the rationale checked against `VERSIONING_POLICY.md`'s PATCH/MINOR/MAJOR criteria, never left as a silent omission (`AS56-F004`'s exact defect).
9. **Traceability baseline recorded** — the exact pre-closure `ERROR`-level finding set (by rule ID + subject ID, not a bare count) from `node devos/governance/traceability/validate-traceability.mjs`, run at the named base SHA from item 2, is recorded in the review — this is the fingerprint D.2 will compare against, not itself a pass/fail gate.
10. **Diff is bounded** — the proposed closure touches only what the closure package claims it touches.
11. **Next phase remains unauthorized** — the proposal does not, explicitly or by omission, treat this closure as authorizing any later phase.

None of these items requires a final ADR/Decision ID, a regenerated traceability index, or any other fact that can only exist after Paulo's decision and the closure implementation itself.

#### D.2 Post-decision Closure Verification — checks the *actual* repository state, after closure lands

Run once, after Paulo has authorized the closure and the bounded closure implementation has been committed. It verifies what actually happened, not what was proposed:

1. **Final RFC status is correct** — the `Status:` banner now reads the actual accepted/closed outcome.
2. **Final ADR exists** and is durable under `devos/changes/adrs/`.
3. **Final Decision exists** in `brain/DECISION_LOG.md`.
4. **Manifest `closure_ref` resolves** to exactly one `closure_history` entry by `adr`, per §"Proposed change" B's fail-closed rule.
5. **Matched `phase` equals the root's `owning_phase`.**
6. **Version baseline and `closure_history` agree** — `sentinel_capability_baseline` and the new `closure_history` entry cite the same ADR/Decision/version.
7. **Rolling handoff/current-state wording is current** — `coordination/IMPLEMENTER_HANDOFF.md`'s header and any "current phase" wording in `brain/00_HOME.md`/`CLAUDE.md` accurately reflect the now-closed state.
8. **Traceability derived outputs are current** — `traceability-index.json`/`TRACEABILITY_INDEX.md` have been regenerated and show no drift against a fresh run.
9. **Baseline findings remain visible** — every `ERROR` recorded in D.1's item 9 is still identifiable in the post-closure run, unless it was separately resolved with its own evidence (never silently "cleared" by the closure).
10. **No new closure-induced `ERROR`** — the post-closure run introduces no `ERROR` absent from D.1's recorded baseline set.
11. **No next-phase authority was silently introduced** by the closure commit.

None of the eleven items requires the overall traceability `ERROR` count to reach zero — items 9/10 are about the *delta* from the named baseline, exactly as `AS57-F003` established, never a zero-findings bar; pre-existing, previously disclosed findings remain a separately tracked debt item, not a closure blocker (`ML-DEVOS-AS-056`'s own explicit non-requirement).

Both D.1 and D.2 remain Architect review steps inside the existing Stage Gate Review / durable `ML-DEVOS-AS-<NNN>` archive mechanism — pre-decision is an Architect finding/checklist produced before the Paulo gate; post-decision is an Architect verification of the authorized closure mutation. Neither introduces a new phase, Skill, agent, database, or record type. This procedure is manual and repository-local in V0.1: a human/Architect runs each checklist by hand at the appropriate moment, not a new automated subsystem, scheduled job, or CI gate.

A Stage Gate Review not requesting a phase closure runs exactly as it does today — Closure Preflight/Verification adds no overhead to ordinary implementation reviews, only to closure requests, and only at the two moments (before and after the Paulo decision) where each half's checks actually make sense.

## Scope

This RFC covers only:

- the manifest schema's reserved-root lifecycle vocabulary (`IMPLEMENTED` status, `closure_ref` field) and its validator enforcement;
- the `executable_runtime_present` field's documented meaning (no value change);
- the Closure Preflight (pre-decision) and Closure Verification (post-decision) checklists as additions to the existing Stage Gate Review mode.

It is repository-governance/schema-level only. It affects `Dillaab-source/maisog-labs`'s own DevOS layer; it proposes no product/application-repository change.

## Non-goals

This RFC does **not**:

- implement the lifecycle change itself — no edit to `devos/devos-manifest.json`, `devos/schemas/devos-manifest.schema.json`, or `devos/schemas/validate-devos-manifest.mjs` is made by this RFC; it is a proposal only, per its authorizing Decision `D-043`;
- close S3, set `devos/contracts/`'s status, create any closure ADR for Skills/Treasury V0.1 or S3 (this RFC assigns no ADR numbers — see "Version impact"), or perform any part of `ML-DEVOS-AS-056`'s corrected closure package — those remain a separate, later Paulo decision and separate bounded implementation cycle, gated on this RFC's own acceptance first;
- mutate `ML-DEVOS-RFC-013`'s status banner or any other document's provenance wording — those are closure-implementation actions, not part of this proposal;
- bump `manifest_version` (currently `1`) or redefine its semantics; this RFC's changes are additive schema evolution, the same category of change `manifest_version` was never intended to gate (nothing in the manifest's own schema ties `manifest_version` to `reserved_subsystem_roots` shape changes, and this RFC does not invent that linkage);
- change `sentinel_capability_baseline` or bump the Sentinel version — any version transition remains a separate, later, explicitly-decided act per `VERSIONING_POLICY.md`'s binding rule, assessed when (and if) a specific closure is actually authorized;
- create a new Sentinel phase, Skill, agent, or database;
- authorize S4 proposal or implementation, or any phase beyond S3's already-preserved technical approval;
- change any `CORE-*` rule;
- touch product/runtime code, remote resources, credentials, deployment, or protected/main merge.

## Affected components

Primary (if this RFC is accepted and later separately implemented):

- `devos/schemas/devos-manifest.schema.json` — additive enum value, additive `closure_ref` field, clarified `executable_runtime_present` description.
- `devos/schemas/validate-devos-manifest.mjs` — additive cross-reference check (`closure_ref` ↔ `closure_history`).
- `brain/protocols/ARCHITECT_SYNC.md` — additive Closure Preflight (pre-decision) and Closure Verification (post-decision) checklists under Stage Gate Review.

Supporting governance records only, as this and any later closure cycle requires: RFC/Architect Sync/Decision/ADR records under `devos/changes/`.

No product code, database schema, or `devos/contracts/` content is affected by this RFC itself.

## Affected rules

No `CORE-*` rule is added, modified, or superseded. This RFC operates entirely at the manifest-schema and Architect-Sync-procedure level, both already governed by `ML-DEVOS-RFC-001`/`ML-DEVOS-AS-003` respectively; it evolves their declared shape/checklist without changing any `CORE-*` rule's `applies_when`, evidence requirement, or authority.

## Alternatives considered

### 1. Leave the manifest schema as-is; close S3 with a hand-edited status outside the enum

Rejected. This is exactly the silent, unvalidated drift the manifest and its validator exist to prevent — the validator would either need to be bypassed or would correctly reject the file, and either way "the schema says something the validator can't check" becomes a standing, repeated problem for every future closure, not just S3's.

### 2. A new, separate "Phase Closure Registry" file/subsystem, distinct from the manifest

Rejected. The manifest already owns `reserved_subsystem_roots` and `closure_history`; adding a status value and one cross-reference field to structures that already exist is smaller and less risky than introducing a second closure-tracking mechanism that would need its own schema, validator, and reconciliation logic against the manifest it would inevitably duplicate.

### 3. A new "Closure Review" Sentinel phase or dedicated Skill

Rejected, explicitly, per `D-043`'s anti-bloat direction. Closure Preflight/Verification is a pair of checklists inside a review mode Sentinel already has (Stage Gate Review) — a pre-decision and a post-decision moment of the *same* gate, not two new phases, agents, or Skills, per `ML-DEVOS-AS-058`'s explicit instruction not to create two new record types for the two moments. This mirrors the same discipline `ML-DEVOS-RFC-014` applied when it rejected a fifth "Knowledge Capture" Skill in favor of a lightweight governed procedure.

### 4. Require the traceability validator to report zero findings before any closure

Rejected. `ML-DEVOS-AS-056` was explicit that known, previously disclosed traceability debt should not become a false blocker on unrelated closures. Requiring zero findings would either stall every future closure on unrelated pre-existing debt or create pressure to silently suppress/downgrade known findings to get to zero — the worse outcome. Scoping the check to "no *new* finding introduced by this closure" catches real regressions without inventing a false gate.

## Risks

### The new status becomes a rubber stamp

Mitigation: the `closure_ref` fail-closed link means `IMPLEMENTED` cannot be set without a resolvable `closure_history` entry carrying `adr`/`decision`/`version` — a bare status edit alone is invalid, not merely discouraged.

### Closure Preflight/Verification becomes governance overhead on every review

Mitigation: both checklists trigger only when a Stage Gate Review is specifically being asked to approve (pre-decision) or has just authorized (post-decision) a *closure* package, not on every implementation review — explicitly stated in the proposed change above.

### Pre-decision and post-decision checks blur back into one pass, recreating `AS58-F005`'s exact defect

Mitigation: D.1 and D.2 are stated as textually separate checklists with disjoint item sets — D.1 never asks for a fact that requires Paulo's decision to exist, and D.2 never substitutes a "proposed" value for a "final" one. Both lists are enumerated explicitly in the proposed change above precisely so a future reader cannot silently re-merge them.

### Someone infers `IMPLEMENTED` grants standing authority for the phase to act further

Mitigation: this RFC's own text and the schema field's description both state explicitly that the status is descriptive only (`CORE-001`/`CORE-002`); no enforcement mechanism reads this field to grant capability, and none is proposed here.

### Scope creep into redefining `executable_runtime_present`'s value for existing roots

Mitigation: this RFC changes only the field's documented meaning, not any existing value — every reserved root's `executable_runtime_present` remains `false`, unchanged by this proposal.

## Migration impact

None required for any existing reserved root. `NOT_IMPLEMENTED` and `FOUNDATION_ACTIVE` remain valid values requiring no edit; `closure_ref: null` is the correct (and, if adopted, likely default/implicit) value for every current entry, since none is yet `IMPLEMENTED`. No existing `closure_history` entry needs to change shape — the new check only reads fields that schema already requires there.

## Security / trust impact

No new trust boundary. This RFC does not touch `devos/governance/TRUST_BOUNDARIES.md`'s subject matter — no new actor, credential, tool grant, or capability is introduced. `Capability != Authority` is explicitly restated, not weakened: a status field describing that a phase closed is categorically different from a grant of capability to act, and this RFC is explicit that it introduces no such grant.

## Evidence requirements

Acceptance of this RFC (design-level, not implementation) should require:

- `INDEPENDENTLY_INSPECTED` review confirming the proposed schema/validator/procedure changes are additive and backwards-compatible (no existing manifest entry becomes invalid under the new schema);
- confirmation that the `closure_ref` ↔ `closure_history` fail-closed relationship is sound (i.e. genuinely cannot be satisfied by a bare status edit);
- confirmation that the traceability checks correctly separate derived-output currency, preserved-baseline findings, and new-closure-induced findings (per `AS57-F003`) rather than collapsing them into a single ERROR-count comparison or requiring an unachievable zero-findings bar;
- confirmation that D.1 (pre-decision) never requires a fact that only Paulo's later decision can create, and that D.2 (post-decision) never substitutes a proposed value for a final one (per `AS58-F005`);
- confirmation that no `CORE-*` rule, product code, or S3+ authority is touched.

If/when this RFC is separately accepted and its schema/validator/procedure changes are implemented, that implementation's own acceptance requires ordinary `Builder-reported` + `Architect-independently-reproduced` evidence over the actual schema/validator diff and tests — not covered by this proposal's own evidence bar.

## Rollout

1. This RFC is reviewed via Architect Sync.
2. If findings require remediation, the Builder remediates only this RFC's text, within the remediation-cycle cap, exactly as any other RFC remediation.
3. Paulo records an explicit design-acceptance decision (accept / reject / request changes) — separate from, and prior to, any decision to actually implement the schema/validator/procedure changes.
4. Only after that acceptance may a separate, bounded implementation cycle be authorized (its own Decision) to: edit `devos/schemas/devos-manifest.schema.json` and `devos/schemas/validate-devos-manifest.mjs`, add their own focused tests, and update `brain/protocols/ARCHITECT_SYNC.md`.
5. RFC-015's own implementation closes first, under its own ADR and its own version transition computed at that time (see "Version impact" above) — this closure is independent of, and does not wait for, S3's.
6. Only after RFC-015's implementation is itself independently reviewed, accepted, and closed may a *further*, separate Paulo decision authorize the actual S3 closure package (`ML-DEVOS-AS-056`'s corrected closure items: `devos/contracts/` → `IMPLEMENTED` with a `closure_ref` resolving to that closure's own ADR, RFC-013 status normalization, S3 README authority correction, handoff header normalization, and S3's own version transition computed from the baseline current at that later moment) using the now-implemented lifecycle mechanism.
7. S4 remains a wholly separate, later proposal, unaffected by and not advanced by any step above.

## Rollback

If this RFC is rejected or its later implementation needs to be reverted: revert the schema/validator/procedure diff. No reserved root will yet carry `status: IMPLEMENTED` or a non-null `closure_ref` at that point (since this RFC explicitly defers all actual closure work), so rollback carries no data-migration burden — every manifest entry simply continues using the values it already has today.

## Compatibility

Compatible with:

- the frozen S0 architecture (`ML-DEVOS-ARCH-001`) — untouched;
- `ML-DEVOS-RFC-001`'s manifest design and `reserved_root_invariant` — extended, not superseded;
- the active evidence provenance model and `CORE-016`/`017`/`018`/`020` — untouched, and explicitly not the subject of this RFC;
- `ML-DEVOS-AS-055`'s preserved S3 technical stage-gate approval — this RFC does not reopen or affect that approval;
- `ML-DEVOS-AS-056`'s discrepancy findings — this RFC is the proposed resolution path for `AS56-F001` (manifest lifecycle gap) and provides the procedural mechanism (Closure Preflight/Verification) that would have caught `AS56-F002`/`F003`/`F006` before they required a dedicated discrepancy review; `AS56-F004`'s no-bump/ADR-011 debt for Skills/Treasury V0.1 remains a separate closure-implementation action this RFC does not itself perform; this RFC's own "Version impact" section supersedes `AS56-F005`'s provisional `v1.5.0 → v1.6.0` transition for S3, and both `AS56-F004`'s and `AS56-F005`'s provisional ADR-number assumptions, with a live-computed sequencing model instead.

Incompatible with any interpretation that a reserved root's `IMPLEMENTED` status, once set, grants standing authority beyond what its closing RFC/ADR/Decision chain actually describes.

## Version impact

This RFC's own design/proposal stage bumps no version, exactly as `ML-DEVOS-RFC-013` and `ML-DEVOS-RFC-014` bumped none at their own discovery stage. This RFC does, however, take a firm position on its **implementation's** version impact rather than leaving it silent (`ML-DEVOS-AS-057` `AS57-F004`):

**Recommendation: RFC-015's implementation, if separately authorized, is `MINOR`.** Against `VERSIONING_POLICY.md`'s criteria: it is not `PATCH` (it adds real, enforceable new schema behavior — a new enum value with fail-closed validator semantics, not a mere clarification); it is not `MAJOR` (nothing about the actor model, the source-of-truth rule, or what "frozen" means changes); it is a backwards-compatible new governance capability (a third reserved-root lifecycle status, a fail-closed closure-evidence linkage field, and the Closure Preflight/Verification checklist pair) that changes no existing rule's meaning and grants no actor new authority — squarely `MINOR` per the policy's own definition.

**Sequencing relative to other pending closures** — this replaces the AS-056-inherited assumption that S3's closure would apply a `v1.5.0 → v1.6.0` transition and leaves nothing implicit:

- **Skills Foundation V0.1 + Portable Knowledge Treasury closure** (`ML-DEVOS-AS-056`'s recommended explicit no-bump disposition) is independent of this RFC and does not need to land first or in any particular order relative to it.
- **RFC-015's own implementation closure**, being `MINOR` per the recommendation above, receives its own post-implementation ADR and its own explicit version transition — computed from whatever Sentinel capability baseline is *actually current at the moment that closure is written*, not assumed today. If the baseline is still `v1.5.0` when RFC-015 closes, its transition is `v1.5.0 → v1.6.0`; if some other MINOR change has landed first, it is computed from that later baseline instead.
- **S3's closure**, if authorized after RFC-015's implementation has already closed, computes its *own* independently-justified `MINOR` transition from *whatever baseline is then current* — which would already reflect RFC-015's bump. It is not, and this RFC does not assume it is, also `v1.5.0 → v1.6.0`; two independent MINOR changes cannot both be the same transition, and this RFC's job is to say so explicitly rather than let both proposals silently claim the same version number.
- `ML-DEVOS-AS-056`'s originally proposed ADR numbers for the Skills/Treasury and S3 closures are **provisional, not fixed**, and this RFC assigns no ADR number of its own for any closure, including its own — every closure ADR is numbered by checking the live `devos/changes/adrs/` directory at the moment that ADR is actually written, per the repository's existing sequential/never-reused convention. Nothing in this RFC should be read as reserving `ML-DEVOS-ADR-011`, `ML-DEVOS-ADR-012`, or any other specific number for any of these closures in advance.
- If Paulo instead prefers to bundle RFC-015's implemented capability and S3's adoption into a single release boundary rather than sequencing them as two independent MINOR transitions, that is a legitimate alternative — but it must be a deliberate, explicitly recorded decision at the time, with separate ADR provenance for each accepted architecture change if both still require their own ADR, never inferred from silence.

No version bump is authorized by this RFC itself.

## Architect Sync requirement

Yes — `ARCHITECTURE` class, per the change-class table in `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §1.

## Paulo decision requirement

Yes. `D-043` already authorized this proposal cycle specifically (draft and Architect Sync review of RFC-015 itself). A **separate**, later Paulo decision is required before any implementation of the schema/validator/procedure changes this RFC proposes, and a **further**, separate Paulo decision is required before the actual S3 (or any other phase's) closure package is executed using the resulting mechanism — this RFC's acceptance authorizes none of those later steps by itself.
