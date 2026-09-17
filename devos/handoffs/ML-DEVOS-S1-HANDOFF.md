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
