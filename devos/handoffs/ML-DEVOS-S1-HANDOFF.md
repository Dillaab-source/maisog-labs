# ML-DEVOS S1 Governance Kernel Handoff

Cycle: `SENTINEL-S1-GOVERNANCE-KERNEL`

## 1. Exact base and candidate commit SHA

- **Base SHA:** `396310b` (`docs(sync): authorize Sentinel S1 governance kernel`), pulled and fast-forwarded before any file was touched.
- **Candidate commit SHA:** reported in `coordination/IMPLEMENTER_HANDOFF.md` and to Paulo directly, since this file is part of that same commit.

## 2. Every file created/modified

All new, under `devos/`:

**Change policy (human-readable):**
1. `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` — the eight change classes, their authority/risk/sync/gate/evidence/delegation/scope/record-type matrix; the RFC/Sync/Decision/Implementation/ADR separation; the change lifecycle; versioning summary.

**Rule registry (machine-readable, static):**
2. `devos/governance/registry/RULE_RECORD_SCHEMA.md` — human-readable field spec.
3. `devos/governance/registry/rule-record.schema.json` — JSON Schema.
4. `devos/governance/registry/validate-rules.mjs` — standalone, zero-dependency static structural validator (not wired into CI/git hooks; run manually).
5. `devos/governance/rules/core-rules.yaml` — 15 constitutional/core rules extracted from frozen S0, unweakened.
6. `devos/governance/rules/README.md`.

**Specifications:**
7. `devos/governance/bundles/GOVERNANCE_BUNDLE_SPEC.md`.
8. `devos/governance/specifications/DECISION_PACKET_SPEC.md`.
9. `devos/governance/specifications/decision-packet.schema.json`.
10. `devos/governance/specifications/CAPABILITY_CHANGE_SPEC.md`.
11. `devos/governance/specifications/PROJECT_ONBOARDING_SPEC.md`.
12. `devos/governance/specifications/VERSIONING_POLICY.md`.

**Templates:**
13. `devos/templates/RFC_TEMPLATE.md`
14. `devos/templates/ADR_TEMPLATE.md`
15. `devos/templates/WAIVER_TEMPLATE.md`
16. `devos/templates/CAPABILITY_CHANGE_TEMPLATE.md`
17. `devos/templates/PROJECT_ONBOARDING_TEMPLATE.md`
18. `devos/templates/DECISION_PACKET_TEMPLATE.md`

**Change record homes (empty, with usage READMEs):**
19. `devos/changes/rfcs/README.md`
20. `devos/changes/adrs/README.md`
21. `devos/changes/waivers/README.md`

22. `devos/handoffs/ML-DEVOS-S1-HANDOFF.md` (this file).

**Not modified:** every S0 artifact (`devos/architecture/ML-DEVOS-ARCH-001.md`, `devos/plans/ML-DEVOS-SIP-001.md`, `devos/governance/{ROLE_RESPONSIBILITY_MATRIX,TRUST_BOUNDARIES,EVIDENCE_PROVENANCE_MODEL,REPOSITORY_OVERLAY_TOPOLOGY,BOOTSTRAP_SOURCE_OF_TRUTH}.md`, `devos/handoffs/ML-DEVOS-S0-HANDOFF.md`), `coordination/ARCHITECT_REVIEW.md` (never overwritten by Claude), and every application/runtime/deployment/configuration file.

## 3. Mapping to D-012 / ML-DEVOS-AS-003

| D-012 / AS-003 item | Delivered as |
|---|---|
| Change classes (8) | `CHANGE_GOVERNANCE_POLICY.md` §1 |
| RFC/Sync/Decision/Implementation/ADR separation | `CHANGE_GOVERNANCE_POLICY.md` §3 |
| Rule registry with stable IDs, scope, risk, status, authority, applicability, evidence, exceptions, provenance, version, supersession | `RULE_RECORD_SCHEMA.md`, `rule-record.schema.json`, `core-rules.yaml` |
| RFC template | `templates/RFC_TEMPLATE.md`, `changes/rfcs/README.md` |
| ADR template | `templates/ADR_TEMPLATE.md`, `changes/adrs/README.md` |
| Expiring waiver template | `templates/WAIVER_TEMPLATE.md`, `changes/waivers/README.md` |
| Capability-change proposal template | `templates/CAPABILITY_CHANGE_TEMPLATE.md`, `specifications/CAPABILITY_CHANGE_SPEC.md` |
| Project-onboarding template | `templates/PROJECT_ONBOARDING_TEMPLATE.md`, `specifications/PROJECT_ONBOARDING_SPEC.md` |
| Decision Packet spec/template | `specifications/DECISION_PACKET_SPEC.md`, `decision-packet.schema.json`, `templates/DECISION_PACKET_TEMPLATE.md` |
| Governance Bundle manifest spec (design only) | `bundles/GOVERNANCE_BUNDLE_SPEC.md` |
| Version/provenance policy | `specifications/VERSIONING_POLICY.md` |
| Constitutional/core rule extraction, unweakened | `rules/core-rules.yaml` (§4 below) |
| Traceability from frozen S0 into the registry | Every `core-rules.yaml` entry's `introduced_by`/`decision_id` cites its exact S0 source |
| Risk-based human gates | `CHANGE_GOVERNANCE_POLICY.md` §1–2; `core-rules.yaml` `CORE-012` |
| Overlay strengthen/narrow-not-weaken rule | `PROJECT_ONBOARDING_SPEC.md`; `core-rules.yaml` `CORE-009` |

## 4. Constitutional rules extracted from S0 (human-readable vs. machine-readable)

**Human-readable policy** (prose, in `CHANGE_GOVERNANCE_POLICY.md` and the frozen `ML-DEVOS-ARCH-001.md` itself) states these rules in narrative form, with reasoning and cross-references.

**Machine-readable static records** (`devos/governance/rules/core-rules.yaml`, conforming to `rule-record.schema.json`) restate the same 15 rules as structured YAML — `CORE-001` through `CORE-015`, listed with full descriptions and provenance in that file. Each entry's `description` is a direct quote or close paraphrase of its cited S0 source; none changes meaning. `adr_id: null` on every entry is intentional and explained in the registry file's own header comment: the ADR system did not exist until this S1 cycle, so no S0 rule has one yet — they remain `ACTIVE` and binding regardless.

## 5. Confirmation: no rule was weakened

Every `core-rules.yaml` entry's `introduced_by` field cites the exact `ML-DEVOS-ARCH-001` section, `AS0-*`/`S0-F*` finding, or `D-01*` decision it was extracted from. A side-by-side check (performed manually this cycle, `ACTOR_REPORTED` evidence) confirms each `description` matches its source's substance. No rule's `class`, `risk`, or `authority` fields were set weaker than what the source implies — if anything, several (e.g. `CORE-001`, `CORE-003`, `CORE-004`, `CORE-007`, `CORE-009` through `CORE-012`) are marked `class: CONSTITUTIONAL`, `risk: highest`, with both `architect_sync_required` and `paulo_approval_required` set `true`, which is at least as strict as their S0 treatment, never looser.

## 6. Confirmation: no runtime engine or enforcement was implemented

- `validate-rules.mjs` is the only executable code added. It is a standalone Node script (zero dependencies, no `package.json` change), performs only static structural validation of YAML rule files (schema shape, enum validity, duplicate IDs, dangling `supersedes` references, mandatory waiver expiry), and is invoked only by manual `node` execution — it is not referenced by any git hook, CI configuration, or `package.json` script.
- No Policy Engine, Task Engine, Orchestrator, Evidence Gate, or Capability Gateway exists as runtime code anywhere in this reviewed repository (confirmed by `find` — no new executable beyond the one validator script, no `.github/workflows` directory).
- No `.devos/` overlay, no `projects/` directory, and no actual RFC/ADR/waiver instance was filed — only their templates and the empty directories that will hold them.
- `git diff --name-only 396310b..HEAD` (recorded after commit) shows only `devos/**` additions plus the two coordination files — no application/runtime/deployment/configuration path.

**Validator test evidence (this cycle, `ACTOR_REPORTED`):**
```
$ node devos/governance/registry/validate-rules.mjs
core-rules.yaml: 15 rule(s) parsed
  OK — no structural issues found.
PASS: 0 error(s) across 1 file(s).
```
Also verified the validator actually catches defects (not just passes silently) by running it against a deliberately broken temporary registry (outside this repository, in the session scratchpad, never committed) containing an invalid class, a dangling `supersedes` reference, a duplicate `rule_id`, and a `WAIVER`-class rule missing `expires_at` — all four were correctly reported, then the temporary file was deleted.

## 7. Proposed version bump — not applied

See `devos/governance/specifications/VERSIONING_POLICY.md`'s own "S1's own version assessment" section: introducing the Governance Kernel is assessed as a backwards-compatible **MINOR** change (proposed `1.2.0` → `1.3.0`), because it adds governance capability without changing any existing constitutional rule's meaning or the actor model. **This bump is not applied** — `core-rules.yaml` still records `effective_version: "1.2.0"` throughout, and no file anywhere in this commit declares Sentinel's overall version as `1.3.0`. Whether to actually apply it is a Paulo/Architect decision at S1's closure, not something this handoff decides unilaterally.

## 8. Known limitations

- `requirements.yaml`/`risks.yaml`/`capabilities.yaml` field-level schemas (referenced by `PROJECT_ONBOARDING_SPEC.md`) are described at the purpose level, not given their own JSON Schema files — deferred to a later S1.x/S2 cycle, consistent with `D-012`'s S1 scope naming the onboarding *template* and *specification*, not every constituent file's full schema.
- `overlay.yaml`'s "may not weaken core rules" constraint is enforced only by Architect review in S1 — no automated check exists (would require a Policy Engine, explicitly out of scope).
- The Governance Bundle spec is intentionally unimplemented beyond its manifest shape — no bundle instance, hash, or signature exists.
- This handoff's own claims (§5, §6) are `ACTOR_REPORTED` evidence until the Architect independently inspects them.

## 9. Architect review request

Requested review mode: `STAGE GATE REVIEW / SENTINEL ARCHITECTURE SYNC`. Requesting the Architect:

1. Confirm the 15 `core-rules.yaml` entries are faithful, unweakened extractions of their cited S0 sources.
2. Confirm the eight change classes and their authority/gate matrix in `CHANGE_GOVERNANCE_POLICY.md` accurately implement `ML-DEVOS-AS-003`.
3. Confirm no runtime enforcement, engine, or later-phase subsystem was introduced.
4. Assess the proposed `1.2.0` → `1.3.0` MINOR version bump (§7) and decide whether to apply it now or defer.
5. Issue a verdict: `SENTINEL S1 STAGE GATE: APPROVED` or remediation required.

---

# Remediation Cycle 1

The Architect's Stage Gate Review of the candidate above (`28a110b532e202431b7371134943a5b7f385e62b`) returned `SENTINEL S1 STAGE GATE: NOT APPROVED — CHANGES REQUESTED (CYCLE 1)`, with nine findings `S1-F001`…`S1-F009` (seven blockers, two required corrections). This section documents their remediation. Everything above this line is the original cycle-0 candidate record, left unedited as accurate history — including its now-superseded references to `core-rules.yaml` (the canonical registry format changed to JSON this cycle, per `S1-F004`; see below).

## Compared against

`28a110b532e202431b7371134943a5b7f385e62b` (the reviewed candidate). Base for this remediation cycle: `396310b1dd9e5919233c0e720a835c50ee6c49f9` fast-forwarded, then the Architect's own review commits pulled in before any file was edited.

## Finding → exact changed file/section mapping

| Finding | Severity | Files changed | What changed |
|---|---|---|---|
| **S1-F001** | Blocker | `devos/governance/rules/core-rules.json` (all rules); `devos/governance/registry/RULE_RECORD_SCHEMA.md` (new "Class-level minimum authority/risk invariants" table); `devos/governance/registry/validate-rules.mjs` (new `CLASS_MINIMUMS` check) | `CORE-005`, `CORE-006`, `CORE-013`, `CORE-014` (`paulo_approval_required` false→true) and `CORE-015` (`paulo_approval_required` false→true, `risk` medium→high) corrected upward to their class floor. Validator now mechanically rejects any future rule below its class minimum. |
| **S1-F002** | Blocker | `devos/governance/rules/core-rules.json` (`CORE-003`, `CORE-005`, `CORE-006`, `CORE-007`, `CORE-012`, and new `CORE-016`/`CORE-017`/`CORE-018`); `devos/architecture/ML-DEVOS-ARCH-001.md` — **not touched** (S0 frozen architecture is out of S1's authorized scope; the evidence-model correction lives entirely in the S1 registry/schema layer, not in the frozen document); `devos/governance/registry/rule-record.schema.json` (new `requires.evidence_note` field) | `CORE-006`'s "all five evidence classes required" removed, replaced with an explicit claim-specific note. `CORE-007` redefined as definitional-only (no evidence requirement beyond confirming the distinction); split into `CORE-016` (MAIN — merge-eligibility evidence only), `CORE-017` (DEPLOYED — deployment-execution evidence only), `CORE-018` (VERIFIED — `RUNTIME_OBSERVED` only). `CORE-012` no longer requires `RUNTIME_OBSERVED` at the proposal stage (moved to `CORE-018`). `CORE-003`/`CORE-005` evidence trimmed to a baseline with an `evidence_note` clarifying stronger evidence applies only to executable/runtime claims. |
| **S1-F003** | Blocker | New: `devos/governance/registry/waiver-record.schema.json`, `devos/governance/registry/validate-waivers.mjs`; modified: `devos/templates/WAIVER_TEMPLATE.md`, `devos/changes/waivers/README.md`, `devos/governance/registry/rule-record.schema.json` (new `waivable` field, required on every rule), `devos/governance/rules/core-rules.json` (every rule now carries an explicit `waivable: true/false`) | Built the waiver validator that never existed (the prior template's claim that one did was false). It enforces mandatory, valid `expires_at` and rejects any waiver targeting a rule marked `waivable: false`. Waivers are now filed as a `.json` (validated) + `.md` (narrative) pair, not YAML embedded in Markdown. |
| **S1-F004** | Blocker | Deleted `devos/governance/rules/core-rules.yaml`; new `devos/governance/rules/core-rules.json`; rewritten `devos/governance/registry/validate-rules.mjs`; updated `devos/governance/registry/rule-record.schema.json`, `devos/governance/registry/RULE_RECORD_SCHEMA.md`, `devos/governance/rules/README.md` | Replaced the hand-rolled, incomplete YAML subset parser with native `JSON.parse` (fail-closed by construction — a syntax error stops everything, nothing is silently skipped). Verified: a deliberately malformed JSON test file was correctly rejected with an exact parse error and location (see §4 below). The `additionalProperties`/`expires_at` contradiction is resolved by design — waivers are no longer part of this schema at all; they have their own (`waiver-record.schema.json`). |
| **S1-F005** | Blocker | `devos/governance/specifications/PROJECT_ONBOARDING_SPEC.md` (`narrows` definition, `local_rules` path); `devos/templates/RFC_TEMPLATE.md` (affected-rules wording) | `narrows` redefined as restricting the *project's own* permitted actions, never reducing where a Sentinel-wide rule applies. Fixed the wrong relative path (`../../rules/` → `../rules/`, also updated `.yaml`→`.json`). RFC template no longer claims a core-rule RFC must be "strengthening or clarifying, never weakening" — a fully authorized `CONSTITUTIONAL`-class RFC may propose a substantive change; what's forbidden is reaching it through a lower-authority path. |
| **S1-F006** | Blocker | `devos/governance/specifications/decision-packet.schema.json`; `devos/templates/DECISION_PACKET_TEMPLATE.md`; `devos/governance/specifications/DECISION_PACKET_SPEC.md` | `payload`/`payload_hash` now mutually exclusive (`oneOf`), with a required `payload_hash_algorithm` when hashed. `decided_at` conditionally required via `if`/`then`/`else` (absent while `PENDING`, required once `APPROVED`/`REJECTED` — never a literal `null`). `evidence_refs` conditionally required (min 1 item) when `risk_class` is `high`/`highest`. |
| **S1-F007** | Blocker | `devos/governance/rules/core-rules.json` (`CORE-008`, `CORE-009` status/version fields; new `CORE-016`/`017`/`018` likewise); `devos/governance/registry/rule-record.schema.json` (new `proposed_effective_version` field, `effective_version` now nullable); `devos/governance/registry/validate-rules.mjs` (new status/version consistency check); `devos/governance/registry/RULE_RECORD_SCHEMA.md` | `CORE-008`/`CORE-009` (genuinely S1-introduced, per `D-012`/`AS-003`) changed from `status: ACTIVE, effective_version: "1.2.0"` to `status: PROPOSED, effective_version: null, proposed_effective_version: "1.3.0"`. All thirteen genuinely S0-origin rules remain `ACTIVE`/`1.2.0`, unchanged. `CORE-012`'s `decision_id` corrected from `D-012` to `D-010` (its substance predates `D-012`; `D-012` reaffirms rather than introduces it). S0 provenance was not rewritten anywhere. |
| **S1-F008** | Required | New: `devos/changes/architect-syncs/` (`README.md`, `ML-DEVOS-AS-003.md`), `devos/templates/ARCHITECT_SYNC_TEMPLATE.md`; modified: `devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §3 | Created the durable per-change Architect Sync home and template. Archived `ML-DEVOS-AS-003` verbatim from the current live `coordination/ARCHITECT_REVIEW.md`. **Disclosed, not silently omitted:** `ML-DEVOS-AS-001`/`AS-002`'s full original findings text is not archived, because the rolling file had already moved past it by the time this mechanism was built — reconstructing from conversational memory would not be independently verifiable and was deliberately not attempted (see `devos/changes/architect-syncs/README.md`'s "Known backfill gap"). |
| **S1-F009** | Required | This file; `coordination/IMPLEMENTER_HANDOFF.md` | The prior cycle's file count was corrected: **22** `devos/` files changed relative to base `396310b`, not 21 (this handoff's own §2 said "21 new files" in two places — an off-by-one in the prose, not the file list itself, which was already fully and correctly enumerated at 22 items). `LAST_IMPLEMENTER_HANDOFF_SHA` bookkeeping was already corrected by the Architect's own state update to `28a110b...` — no further action needed there. |

Additionally, one relative-path bug not assigned its own finding ID was caught and fixed during this remediation's own verification pass: `CHANGE_GOVERNANCE_POLICY.md`'s `WAIVER` row referenced a malformed path (`../specifications/../../templates/WAIVER_TEMPLATE.md`) that would not resolve; corrected to `../../templates/WAIVER_TEMPLATE.md`.

## Retained static validators — what each proves and does not prove

| Validator | Proves | Does NOT prove |
|---|---|---|
| `validate-rules.mjs` | Every rule file is valid JSON (fail-closed); every rule has all required fields, correctly typed; enum fields use only allowed values; no duplicate `rule_id`; every `supersedes` resolves; every rule meets its class's minimum authority/risk (S1-F001); `status`/`effective_version`/`proposed_effective_version` are mutually consistent (S1-F007). | That a rule's prose accurately reflects its cited source (human/Architect judgment); anything about project-scoped rule files beyond the same structural checks; anything about waiver instances (separate validator); any runtime behavior — it enforces nothing, it only lints static files on manual invocation. |
| `validate-waivers.mjs` (new, S1-F003) | Every waiver instance is valid JSON (fail-closed); all required fields present; `expires_at` is present and strictly after `issued_at`; `rule_waived` exists in the current rule registry and is `waivable: true`; enum fields valid. | That `compensating_controls` actually mitigate the risk (human/Architect judgment); that `approver` truly holds sufficient authority (process, not automatable from static text alone); it does not flip `status` to `EXPIRED` automatically when the date passes — that remains manual in S1. |

**Evidence this cycle (`ACTOR_REPORTED`, this cycle's own commands):**

```
$ node devos/governance/registry/validate-rules.mjs
core-rules.json: 18 rule(s) parsed
  OK — no structural or class-minimum issues found.
PASS: 0 error(s) across 1 file(s).

$ node devos/governance/registry/validate-waivers.mjs
No waiver instance files (*.json) found in .../devos/changes/waivers. This is expected -- no waiver has been filed as of this cycle.
```

Also verified (in the session scratchpad, never committed, then deleted): the rules validator correctly rejects 9 distinct injected defects (invalid evidence class, dangling `supersedes`, risk below class minimum, missing `paulo_approval_required` floor, non-null `proposed_effective_version` on an `ACTIVE` rule, duplicate `rule_id`, non-boolean `waivable`, and both `PROPOSED`/version-field mismatches) and fails closed on syntactically malformed JSON with an exact error location; the waivers validator correctly rejects a waiver against a `waivable: false` rule and a waiver whose `expires_at` precedes its `issued_at`.

## Confirmations requested by this cycle's instructions

- **S0-origin rules remain effective from 1.2.0:** confirmed — `CORE-001`–`CORE-007`, `CORE-010`–`CORE-015` all carry `status: "ACTIVE"`, `effective_version: "1.2.0"`, `proposed_effective_version: null`.
- **S1-origin rules remain candidate/pending until S1 approval:** confirmed — `CORE-008`, `CORE-009`, `CORE-016`, `CORE-017`, `CORE-018` all carry `status: "PROPOSED"`, `effective_version: null`, `proposed_effective_version: "1.3.0"`.
- **No S0 rule was weakened:** confirmed — every authority/risk correction in this cycle moved a field *up* (stricter) to meet its class minimum; none was relaxed. No rule's `description` or `applies_when` substance was narrowed in a way that reduces what it actually requires (the evidence-field changes for `S1-F002` correct *false over-claims* of universal evidence, they do not remove any genuine requirement — see the per-rule `evidence_note` fields for the honest, narrower-but-accurate replacement).
- **v1.3.0 remains proposed but unapplied:** confirmed — no file anywhere in this commit declares the overall Sentinel governance/architecture version as `1.3.0`; `devos/governance/specifications/VERSIONING_POLICY.md`'s own assessment section is unchanged from the prior cycle (still describes the bump as proposed, pending Paulo/Architect decision at closure).

## Confirm: only authorized paths changed

`git diff --name-only 28a110b..HEAD` (recorded in `coordination/IMPLEMENTER_HANDOFF.md`) is limited to `devos/**` plus `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. No application/runtime/deployment/configuration path, `.github/` directory, `.devos/` overlay, or `projects/` directory exists anywhere in the diff. No S0 frozen architecture file (`devos/architecture/ML-DEVOS-ARCH-001.md`, `devos/plans/ML-DEVOS-SIP-001.md`) was touched. No S2+ work was performed.

## Known limitations carried into this cycle

- `ML-DEVOS-AS-001`/`AS-002`'s full text remains unarchived (disclosed above, `S1-F008`).
- `requirements.yaml`/`risks.yaml`/`capabilities.yaml` (project onboarding) remain undeschematized, as in the original candidate — not part of any `S1-F001`…`S1-F009` finding.
- `overlay.yaml`'s "may not weaken core rules" constraint is still checked only by Architect review, not mechanically — automating it would require a Policy Engine, explicitly out of scope.
- This remediation's own claims are `ACTOR_REPORTED` until the Architect independently inspects them.

## Architect review request

Requested review mode: `STAGE GATE REVIEW / SENTINEL ARCHITECTURE SYNC`. Requesting the Architect independently verify each `S1-F001`…`S1-F009` resolution against the mapping table above, re-run both validators, and issue a verdict.
