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

Binding rule, enforced by `devos/schemas/validate-devos-manifest.mjs` (extended, not replaced):

- `closure_ref` **must be `null`** when `status` is `NOT_IMPLEMENTED` or `FOUNDATION_ACTIVE`.
- `closure_ref` **must be a non-null string, and must exactly match the `phase` field of some entry in the manifest's own `closure_history` array**, when `status` is `IMPLEMENTED`.
- The validator resolves `closure_ref` against `closure_history` and confirms that matched entry itself has non-empty `adr`, `decision`, and `version` fields (the existing `closure_history` schema already requires this; the new check is that a claimed `IMPLEMENTED` root actually points at one).
- A `closure_ref` that does not resolve to any `closure_history` entry, or resolves to one missing `adr`/`decision`/`version`, is a **hard validator failure** — the manifest is invalid, not merely "flagged."

This means a root cannot become `IMPLEMENTED` by a bare status edit: it requires a corresponding, already-schema-required `closure_history` entry to exist, which itself requires an ADR and a Decision ID to have been filled in. The status and its evidence cannot silently diverge, because the validator checks the link on every run, not merely at the moment of the edit.

### C. `executable_runtime_present` — clarified meaning, not changed value

`AS-056` surfaced a real ambiguity: does S3 having a JSON Schema, a specification, a deterministic Node validator (`devos/contracts/validate-task-contract.mjs`), and examples/tests mean `devos/contracts/` now has "executable runtime present"? No — and this RFC proposes making that explicit in the schema's own field description rather than leaving it to institutional memory:

> `executable_runtime_present` means a live, autonomously operating Sentinel subsystem exists and executes against real state — e.g. a Task Engine performing state transitions (S4), an Orchestrator dispatching agents (S8), a Capability Gateway enforcing tool access at runtime (S5). It is `false` for a phase whose closed deliverable is repository-local, statically invoked tooling: a JSON Schema, a specification document, a deterministic validator/generator script run manually or by a human/agent choosing to run it, and their tests. Such tooling holds no state between invocations, is not wired to any automatic trigger (no CI, no hook, no scheduler), and does not itself decide or execute anything — it only checks or transforms a file already on disk when invoked. A reserved root may therefore legitimately reach `status: IMPLEMENTED` while `executable_runtime_present` remains `false` indefinitely, exactly as S3 does under this proposal, until some later phase's own separately authorized implementation genuinely adds live execution.

This is a documentation/description clarification only — the field's type (`boolean`) and every existing value (`false` everywhere in the current manifest) are unchanged.

### D. A lightweight Closure Preflight inside the existing Architect Sync procedure

`brain/protocols/ARCHITECT_SYNC.md` already defines named review modes (Change Review, Stage Gate Review, Release Review, Security Review). This RFC adds one bounded checklist — **Closure Preflight** — as a required sub-step of a **Stage Gate Review specifically when that review is being asked to approve a phase closure package** (i.e. a request to move a reserved root from `NOT_IMPLEMENTED` toward `IMPLEMENTED`, or an equivalent architecture-level closure). It is explicitly:

- **not** a new Sentinel phase, numbered stage, agent, database, or standalone Skill;
- **not** a new file location or new record type — its output is simply additional findings inside the same `coordination/ARCHITECT_REVIEW.md` / durable `ML-DEVOS-AS-<NNN>` archive the Stage Gate Review already produces;
- a fixed, small checklist, run once per closure request, checking exactly these five surfaces for mutual agreement before a closure package reaches Paulo:

  1. **RFC status banner** — does the owning RFC's `Status:` line reflect the actual outcome (not a stale `DRAFT`/`QUEUED` left over from before implementation)?
  2. **Manifest** — if closure proposes `status: IMPLEMENTED`, does the entry (or the proposed edit) carry a `closure_ref` that will resolve, and does a corresponding `closure_history` entry (or its proposed addition) exist with `adr`/`decision`/`version` filled in?
  3. **ADR** — does a durable ADR exist (or is one proposed in the same closure package) citing the correct RFC, Architect Sync, and Decision IDs — and, per `AS56-F003`'s exact defect, does it name the correct Decision for "authorized implementation" versus any later "authorized reopening," rather than conflating them?
  4. **Version** — does the proposed version disposition (bump or explicit no-bump) match `VERSIONING_POLICY.md`'s PATCH/MINOR/MAJOR criteria, and is a no-bump decision recorded explicitly rather than left as a silent omission (`AS56-F004`'s exact defect)?
  5. **Rolling handoff header** — does `coordination/IMPLEMENTER_HANDOFF.md`'s top banner accurately name the current/closing cycle, without deleting or rewriting prior history below it?

  Traceability is checked as its own item, but scoped correctly (see Non-goals/§6 below): the Closure Preflight requires that `node devos/governance/traceability/validate-traceability.mjs` introduces **no new** `ERROR`-level finding caused by *this closure's own* edits. It does not require the traceability suite to report zero findings overall — pre-existing, previously disclosed findings remain a separately tracked debt item, not a closure blocker, consistent with `ML-DEVOS-AS-056`'s own explicit non-requirement.

A Stage Gate Review not requesting a phase closure runs exactly as it does today — Closure Preflight adds no overhead to ordinary implementation reviews, only to closure requests.

## Scope

This RFC covers only:

- the manifest schema's reserved-root lifecycle vocabulary (`IMPLEMENTED` status, `closure_ref` field) and its validator enforcement;
- the `executable_runtime_present` field's documented meaning (no value change);
- the Closure Preflight checklist as an addition to the existing Stage Gate Review mode.

It is repository-governance/schema-level only. It affects `Dillaab-source/maisog-labs`'s own DevOS layer; it proposes no product/application-repository change.

## Non-goals

This RFC does **not**:

- implement the lifecycle change itself — no edit to `devos/devos-manifest.json`, `devos/schemas/devos-manifest.schema.json`, or `devos/schemas/validate-devos-manifest.mjs` is made by this RFC; it is a proposal only, per its authorizing Decision `D-043`;
- close S3, set `devos/contracts/`'s status, create `ML-DEVOS-ADR-011` or `ML-DEVOS-ADR-012`, or perform any part of `ML-DEVOS-AS-056`'s corrected closure package — those remain a separate, later Paulo decision and separate bounded implementation cycle, gated on this RFC's own acceptance first;
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
- `brain/protocols/ARCHITECT_SYNC.md` — additive Closure Preflight checklist under Stage Gate Review.

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

Rejected, explicitly, per `D-043`'s anti-bloat direction. Closure Preflight is a checklist inside a review mode Sentinel already has (Stage Gate Review), not a new phase, agent, or Skill. This mirrors the same discipline `ML-DEVOS-RFC-014` applied when it rejected a fifth "Knowledge Capture" Skill in favor of a lightweight governed procedure.

### 4. Require the traceability validator to report zero findings before any closure

Rejected. `ML-DEVOS-AS-056` was explicit that known, previously disclosed traceability debt should not become a false blocker on unrelated closures. Requiring zero findings would either stall every future closure on unrelated pre-existing debt or create pressure to silently suppress/downgrade known findings to get to zero — the worse outcome. Scoping the check to "no *new* finding introduced by this closure" catches real regressions without inventing a false gate.

## Risks

### The new status becomes a rubber stamp

Mitigation: the `closure_ref` fail-closed link means `IMPLEMENTED` cannot be set without a resolvable `closure_history` entry carrying `adr`/`decision`/`version` — a bare status edit alone is invalid, not merely discouraged.

### Closure Preflight becomes governance overhead on every review

Mitigation: it triggers only when a Stage Gate Review is specifically being asked to approve a *closure* package, not on every implementation review — explicitly stated in the proposed change above.

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
- confirmation that Closure Preflight's traceability item correctly distinguishes new-vs-pre-existing findings rather than requiring an unachievable zero-findings bar;
- confirmation that no `CORE-*` rule, product code, or S3+ authority is touched.

If/when this RFC is separately accepted and its schema/validator/procedure changes are implemented, that implementation's own acceptance requires ordinary `Builder-reported` + `Architect-independently-reproduced` evidence over the actual schema/validator diff and tests — not covered by this proposal's own evidence bar.

## Rollout

1. This RFC is reviewed via Architect Sync.
2. If findings require remediation, the Builder remediates only this RFC's text, within the remediation-cycle cap, exactly as any other RFC remediation.
3. Paulo records an explicit design-acceptance decision (accept / reject / request changes) — separate from, and prior to, any decision to actually implement the schema/validator/procedure changes.
4. Only after that acceptance may a separate, bounded implementation cycle be authorized (its own Decision) to: edit `devos/schemas/devos-manifest.schema.json` and `devos/schemas/validate-devos-manifest.mjs`, add their own focused tests, and update `brain/protocols/ARCHITECT_SYNC.md`.
5. Only after that implementation is itself independently reviewed and accepted may a *further*, separate Paulo decision authorize the actual S3 closure package (`ML-DEVOS-AS-056`'s corrected closure items: `devos/contracts/` → `IMPLEMENTED`, `ML-DEVOS-ADR-011`/`ML-DEVOS-ADR-012`, RFC-013 status normalization, S3 README authority correction, handoff header normalization, and the `v1.5.0 → v1.6.0` version transition) using the now-implemented lifecycle mechanism.
6. S4 remains a wholly separate, later proposal, unaffected by and not advanced by any step above.

## Rollback

If this RFC is rejected or its later implementation needs to be reverted: revert the schema/validator/procedure diff. No reserved root will yet carry `status: IMPLEMENTED` or a non-null `closure_ref` at that point (since this RFC explicitly defers all actual closure work), so rollback carries no data-migration burden — every manifest entry simply continues using the values it already has today.

## Compatibility

Compatible with:

- the frozen S0 architecture (`ML-DEVOS-ARCH-001`) — untouched;
- `ML-DEVOS-RFC-001`'s manifest design and `reserved_root_invariant` — extended, not superseded;
- the active evidence provenance model and `CORE-016`/`017`/`018`/`020` — untouched, and explicitly not the subject of this RFC;
- `ML-DEVOS-AS-055`'s preserved S3 technical stage-gate approval — this RFC does not reopen or affect that approval;
- `ML-DEVOS-AS-056`'s discrepancy findings — this RFC is the proposed resolution path for `AS56-F001` (manifest lifecycle gap) and provides the procedural mechanism (Closure Preflight) that would have caught `AS56-F002`/`F003`/`F006` before they required a dedicated discrepancy review; `AS56-F004`'s ADR-011/no-bump debt remains a separate closure-implementation action this RFC does not itself perform.

Incompatible with any interpretation that a reserved root's `IMPLEMENTED` status, once set, grants standing authority beyond what its closing RFC/ADR/Decision chain actually describes.

## Version impact

This RFC itself proposes no Sentinel version transition. Per the same pattern `ML-DEVOS-RFC-013` and `ML-DEVOS-RFC-014` used at their own discovery stage: version impact of the *implementation* (if later separately authorized) would be assessed at that time, against `VERSIONING_POLICY.md`'s PATCH/MINOR/MAJOR criteria — most likely `MINOR` (a backwards-compatible new governance capability: an additive enum value, an additive optional field, and an additive procedural checklist, none of which changes any existing rule's meaning or any actor's existing authority). No version bump is authorized by this RFC.

## Architect Sync requirement

Yes — `ARCHITECTURE` class, per the change-class table in `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §1.

## Paulo decision requirement

Yes. `D-043` already authorized this proposal cycle specifically (draft and Architect Sync review of RFC-015 itself). A **separate**, later Paulo decision is required before any implementation of the schema/validator/procedure changes this RFC proposes, and a **further**, separate Paulo decision is required before the actual S3 (or any other phase's) closure package is executed using the resulting mechanism — this RFC's acceptance authorizes none of those later steps by itself.
