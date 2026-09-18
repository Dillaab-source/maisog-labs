# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-004 — S1 Governance Kernel Remediation Review

Cycle: `SENTINEL-S1-GOVERNANCE-KERNEL`
Review mode: `STAGE GATE REVIEW / SENTINEL ARCHITECTURE SYNC`
Reviewed remediation commit: `c2ba03745467d310c2b6c1bb59acfca916a72d69`
Prior reviewed remediation: `65c02a44e54618b70b23417f11802fb8fca148a4`
Current remediation cycle reviewed: `2`

## Scope

Independent re-review of the S1 Governance Kernel after remediation cycle 2.

This review does not authorize S2, runtime Policy/Task/Evidence/Capability engines, CI/workflows, GitHub rulesets, website/admin changes, project migration, protected-branch/main merge, production deployment, or activation of Sentinel v1.3.0.

## Evidence independently inspected

The Architect independently inspected:

- live branch HEAD `c2ba03745467d310c2b6c1bb59acfca916a72d69`;
- Git compare `65c02a44...` → `c2ba0374...`;
- Builder-owned compare `c3ae9dc5...` → `c2ba0374...`;
- `coordination/STATE.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `devos/governance/registry/rule-record.schema.json`;
- `devos/governance/registry/validate-rules.mjs`;
- `devos/governance/rules/core-rules.json`;
- `devos/governance/registry/waiver-record.schema.json`;
- `devos/governance/registry/validate-waivers.mjs`;
- waiver documentation/template;
- Decision Packet schema/specification;
- `VERSIONING_POLICY.md`;
- durable `ML-DEVOS-AS-001.md` / `ML-DEVOS-AS-002.md` backfills and archive README;
- frozen S0 evidence/provenance model for compatibility.

The Builder commit is GitHub-signature verified. The Builder-owned commit `c3ae9dc5...` → `c2ba0374...` changes exactly 17 authorized files: 15 under `devos/**` plus `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`. No frozen S0 architecture file, application/runtime/deployment/configuration file, CI workflow, ruleset, website/admin file, or S2+ implementation is in that Builder-owned diff.

The Architect independently parsed the current 18-rule registry and reproduced the key static invariants relevant to this review: explicit `all_of`/`any_of` evidence shape, S0/S1 version-state separation, and class-level authority/risk floors.

## Finding disposition

### S1-F001 — RESOLVED

Class-level authority/risk floors remain correctly represented. Cycle 2 did not weaken them.

### S1-F002 — RESOLVED

Evidence combination semantics are now machine-unambiguous:

- `all_of` = every listed evidence class is required;
- `any_of` = at least one listed evidence class is sufficient for that OR-set.

`CORE-016` and `CORE-017` use `any_of` consistently with their policy text. `CORE-018` retains `all_of: [RUNTIME_OBSERVED]` for VERIFIED. Runtime evidence is not reintroduced as a precondition to merge.

### S1-F003 — RESOLVED

Waiver authority/expiry semantics now satisfy the architectural requirement:

- a target rule must exist and be `waivable: true`;
- a target requiring Paulo approval requires a non-empty `paulo_decision_ref`;
- a target requiring Architect Sync requires a non-empty `architect_sync_ref`;
- an expired waiver cannot remain valid merely because stored status still says `ACTIVE`.

The validator is not expected to prove that a cited human approval is genuine; presence/structure is the S1 static responsibility.

### S1-F004 — PARTIALLY RESOLVED — FINAL BLOCKER

The rule-registry side is materially corrected. `validate-rules.mjs` now performs fail-closed JSON parsing and enforces the declared rule-record shape closely enough for S1, including field allowlists, required fields, nested object types, rule-ID pattern, evidence shape, enums, scope/project consistency, semver/date shape, class floors, and version/status consistency.

The waiver side is **still not equivalent to its declared schema**.

`devos/changes/waivers/README.md` says the JSON waiver record conforms to `waiver-record.schema.json` and is actually validated by `validate-waivers.mjs`. But the current validator only validates a subset of that schema. It does not currently enforce, among other declared constraints:

- `additionalProperties: false`;
- `waiver_id` pattern `^ML-DEVOS-WAIVER-[0-9]{3}$`;
- `rule_waived` pattern;
- non-empty string constraints for `scope`, `reason`, `approver`, and `compensating_controls`;
- exact date-format constraints for `issued_at` / `expires_at`;
- that `evidence` is an array containing only valid evidence-class enum values;
- type/minLength constraints on optional approval-reference fields when present outside a condition that makes them required.

Therefore a waiver can violate the declared machine-readable schema and still pass the claimed validator.

**Required correction:** make `validate-waivers.mjs` enforce the full declared S1 waiver-record shape (or equivalently narrow the schema/docs, but the preferred correction is full validation). Keep the already-correct cross-record authority checks, expiry-authoritative behavior, and fail-closed rule-registry dependency.

At minimum, cycle 3 must make the waiver validator reject every record that violates any `waiver-record.schema.json` field/type/pattern/enum/additional-property constraint.

### S1-F005 — RESOLVED

Project-overlay non-weakening and RFC authority-path semantics remain correct and untouched.

### S1-F006 — RESOLVED

The Decision Packet exact-payload branch now forbids both `payload_hash` and orphaned `payload_hash_algorithm`. The hashed branch still requires both hash and declared algorithm and forbids exact payload.

### S1-F007 — RESOLVED FOR ARCHITECTURE; FINAL ACTIVATION STILL REQUIRES PAULO

The versioning policy now accurately distinguishes:

- thirteen S0-origin rules: `ACTIVE`, effective `1.2.0`;
- five S1-origin rules: `PROPOSED`, no effective version yet, proposed `1.3.0`.

It also explicitly records S1 as the bootstrap transition into the RFC/ADR system:

- `D-012` + `ML-DEVOS-AS-003` are the pre-RFC authorization/design records;
- final S1 closure must create the first durable ADR and explicit `1.2.0 → 1.3.0` transition record;
- the proposed CORE_POLICY rules do not self-activate from Architect approval alone.

This is architecturally correct. **Do not create the closure ADR, activate S1 rules, or apply v1.3.0 during remediation cycle 3.** If the last technical blocker closes, the Architect will route final activation/version closure to Paulo.

### S1-F008 — RESOLVED

Durable AS-001 and AS-002 records are now backfilled from repository-verifiable Git history, not conversational memory.

The repository records the exact historical sources:

- AS-001 original findings: `571146a06cba1ddc996fd68cd25a68fa4544c5ec`;
- AS0-001A amendment: `ce53eceb4a8da38f09f971c8fb20b4b618552010`;
- AS-002 initial findings: `5962c978e363745d8bbea8b39b3aff7ae0711329`;
- S0 final closure context: `af76cc7b3e6188caa5d2881f7dccb41511f5cd05`.

The durable records contain the expected AS0-001…AS0-012 / AS0-001A and S0-F001…S0-F008 / final approval provenance.

### S1-F009 — PARTIALLY RESOLVED — REQUIRED BOOKKEEPING CORRECTION

The historical `28a110b...` → `65c02a4...` counts are now correctly stated.

The Builder-owned cycle-2 commit count is also correct when measured from its actual parent:

`c3ae9dc54c88cf1136c846dcb896980853347c0d` → `c2ba03745467d310c2b6c1bb59acfca916a72d69`

= **17 files total: 15 `devos/**` files + 2 Builder-owned coordination files**.

However, the handoff later says:

> `git diff --name-status 65c02a4..HEAD` is limited to `devos/**` plus `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`

That is factually false for the full review-cycle range. The independent compare `65c02a4...` → `c2ba0374...` contains **18 files**, because it also includes the Architect-owned `coordination/ARCHITECT_REVIEW.md` update between those commits.

**Required correction:** distinguish the two ranges explicitly:

- full review-cycle range `65c02a4...` → `c2ba0374...`: 18 files, including Architect-owned `coordination/ARCHITECT_REVIEW.md`;
- Builder-owned remediation commit `c3ae9dc5...` → `c2ba0374...`: 17 authorized files and no Architect-review modification by Claude.

This is provenance bookkeeping, not a substantive governance-model blocker.

## Coordination bookkeeping

At the Builder commit, `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` is correct, but `LAST_IMPLEMENTER_HANDOFF_SHA` necessarily still points to the prior reviewed SHA because the commit cannot self-reference its own SHA.

This Architect state update will normalize both reviewed/handoff SHA fields to:

`c2ba03745467d310c2b6c1bb59acfca916a72d69`.

## Version disposition

The accepted version class remains:

`1.2.0 → 1.3.0 MINOR`

It remains **proposed and inactive**.

No S1-origin rule may be activated and no v1.3.0 closure artifact may be created during cycle 3. Final activation remains a Paulo gate after Architect technical approval.

## Verdict

`SENTINEL S1 STAGE GATE: NOT APPROVED — FINAL REMEDIATION REQUIRED (CYCLE 3)`

Cycle 2 resolves the architecture/provenance issues. One substantive blocker remains: waiver validator/schema equivalence. One small bookkeeping correction remains under S1-F009.

Cycle 3 is the final allowed remediation cycle under the current bootstrap protocol.

## Authorized remediation scope — cycle 3

Claude may modify only:

- `devos/governance/registry/validate-waivers.mjs`;
- `devos/governance/registry/waiver-record.schema.json` only if needed to keep validator/schema wording exactly aligned;
- `devos/changes/waivers/README.md` and `devos/templates/WAIVER_TEMPLATE.md` only if needed for truthful validator documentation;
- `devos/handoffs/ML-DEVOS-S1-HANDOFF.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

No other S1 artifact needs substantive modification.

## Required next handoff

Claude must:

1. fully align `validate-waivers.mjs` with the declared `waiver-record.schema.json` static shape;
2. preserve the already-correct waiver authority-reference, expiry, unwaivable-target, and dependency-fail-closed checks;
3. correct S1-F009 range/count wording by separating the full Architect+Builder review range from the Builder-owned commit range;
4. compare Builder-owned changes against the Architect-return commit produced after this review, not against a range that includes Architect-owned writes;
5. rerun the waiver validator against:
   - current real repository state;
   - malformed JSON;
   - unknown extra property;
   - malformed waiver ID;
   - malformed rule ID;
   - empty required strings;
   - invalid date shapes;
   - invalid evidence array/evidence class;
   - missing conditional Paulo/Architect refs;
   - expired ACTIVE waiver;
   - malformed dependency rule registry;
6. state exactly what the validator proves and does not prove;
7. keep all S1-origin rules PROPOSED and v1.3.0 unapplied;
8. set `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `CURRENT_REMEDIATION_CYCLE: 3`;
9. keep `DEPLOY_AUTHORIZED: NO`, `MAIN_MERGE_AUTHORIZED: NO`;
10. stop.

If cycle 3 closes cleanly, the Architect will issue the technical S1 approval, archive the concluded AS-004 record, and route the explicit S1/v1.3.0 activation/closure decision to Paulo.

## Current Architecture Sync status

`ML-DEVOS-AS-004: CHANGES_REQUESTED — FINAL REMEDIATION CYCLE`

Do not archive AS-004 yet. It is not concluded until the final cycle-3 re-review.
