# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-004 — S1 Governance Kernel Remediation Review

Cycle: `SENTINEL-S1-GOVERNANCE-KERNEL`
Review mode: `STAGE GATE REVIEW / SENTINEL ARCHITECTURE SYNC`
Reviewed remediation commit: `65c02a44e54618b70b23417f11802fb8fca148a4`
Reviewed prior candidate: `28a110b532e202431b7371134943a5b7f385e62b`
Current remediation cycle reviewed: `1`

## Scope

Independent re-review of the S1 Governance Kernel after remediation of `S1-F001`…`S1-F009`.

This review does not authorize S2, runtime Policy/Task/Evidence/Capability engines, CI/workflows, GitHub rulesets, website/admin changes, project migration, protected-branch/main merge, or production deployment.

## Evidence independently inspected

The Architect independently inspected:

- live branch HEAD at `65c02a44e54618b70b23417f11802fb8fca148a4`;
- Git compare `37bec9e...` → `65c02a4...`;
- Git compare `28a110b...` → `65c02a4...`;
- the canonical rule registry `devos/governance/rules/core-rules.json`;
- rule schema and `validate-rules.mjs`;
- waiver schema, waiver template, waiver README, and `validate-waivers.mjs`;
- Decision Packet spec/schema/template;
- project-onboarding spec and RFC template;
- durable Architect Sync archive/home/template;
- S1 handoff and coordination handoff/state;
- historical repository snapshots of `coordination/ARCHITECT_REVIEW.md` at:
  - `571146a06cba1ddc996fd68cd25a68fa4544c5ec`;
  - `ce53eceb4a8da38f09f971c8fb20b4b618552010`;
  - `5962c978e363745d8bbea8b39b3aff7ae0711329`;
  - `f34b3074a7e63bc2047daee772b0f97dad3d566b`;
  - `af76cc7b3e6188caa5d2881f7dccb41511f5cd05`.

The Builder remediation commit itself is GitHub-signature verified and is one commit on top of the Architect-return state commit `37bec9e...`.

The Architect also independently parsed the current `core-rules.json` and reproduced the class-minimum and status/version checks. All 18 current records satisfy those specific invariants.

## Finding disposition

### S1-F001 — RESOLVED

Class-level authority/risk floors are now explicit and the current 18-rule registry satisfies them.

The previously under-scoped records were corrected upward; no current rule is below its class minimum.

### S1-F002 — PARTIALLY RESOLVED — blocker remains

The impossible pre-deployment `RUNTIME_OBSERVED` dependency was removed, and MAIN / DEPLOYED / VERIFIED are now represented separately.

However, the machine-readable evidence semantics are still ambiguous.

`rule-record.schema.json` describes `requires.evidence` as the minimum evidence class(es) always required. That reads as an **all-of** list.

But:

- `CORE-016` says MAIN eligibility may be demonstrated by reproduced tests **and/or** CI, while its array contains both `INDEPENDENTLY_REPRODUCED` and `CI_ATTESTED`;
- `CORE-017` says deployment may be evidenced by a deploy log **or** a CI-attested deployment step, while its array contains both `ACTOR_REPORTED` and `CI_ATTESTED`.

A future consumer cannot tell whether those arrays mean AND or OR.

**Required correction:** make evidence combination semantics explicit in the static model. For example, use structured fields such as `all_of` / `any_of`, or another unambiguous equivalent. Do not require both CI and independent reproduction when the policy text says either may satisfy the claim.

Keep `CORE-018`'s `RUNTIME_OBSERVED` requirement for VERIFIED.

### S1-F003 — PARTIALLY RESOLVED — blocker remains

The waiver work is materially improved:

- waiver instances now have a real JSON schema;
- `expires_at` is mandatory;
- target rules must exist;
- targets marked `waivable: false` are rejected.

However, the waiver record still does not structurally bind the waiver to the target rule's required authority.

For example, a waiver JSON naming a waivable `CONSTITUTIONAL` or `CORE_POLICY` rule can still contain an arbitrary non-empty `approver` string and pass the validator. The prose says the approver must hold authority equal to the target rule, but the structured record has no required Paulo-decision / Architect-Sync approval references for target rules whose `authority` requires them.

Also, `expires_at` is currently checked only for ordering against `issued_at`. An `ACTIVE` waiver whose expiry date has already passed is not rejected, even though expiry is supposed to end the exception regardless of bookkeeping.

**Required correction:**

1. bind waiver approval evidence to the target rule's authority requirements in the structured record;
2. when the target rule requires Paulo approval, require a non-empty Paulo decision/approval reference;
3. when the target rule requires Architect Sync, require a non-empty Architect Sync reference;
4. make expiry authoritative: an expired waiver cannot remain effective merely because its status text still says `ACTIVE`;
5. the validator need not prove the human approval is genuine, but it must fail if required approval slots are absent.

### S1-F004 — PARTIALLY RESOLVED — blocker remains

Migrating the canonical registry from hand-parsed YAML to JSON was the correct direction. JSON syntax now fails closed.

But `validate-rules.mjs` is still not equivalent to the declared rule schema, despite comments/handoff language saying it proves required fields are correctly typed.

Examples the current validator does not enforce:

- top-level `rules` must exist and be an array; a document without it becomes an empty list and can pass;
- `rule_id` regex;
- `title`, `description`, `applies_when`, owner and citation field types/minimum lengths;
- `authority` nested field types when class floors do not force `true`;
- `requires.qa`, `independent_review`, `evidence_gate` boolean types;
- `additionalProperties: false`;
- project/scope consistency;
- date formats;
- semantic-version formats;
- several other schema constraints.

The waiver validator has the same general issue and additionally catches malformed rule-registry JSON inside `loadRuleIndex()` and silently continues. A waiver validator whose authority depends on the rule registry should fail closed if that registry cannot be parsed.

**Required correction:** either:

- make the static validators fully enforce the declared schemas/semantic invariants they claim to validate; or
- reduce the schemas/claims to exactly what is actually validated.

The preferred result is full deterministic validation of the current static shapes, still without runtime policy enforcement.

At minimum, missing/invalid top-level registry structure and malformed dependency registries must be hard failures.

### S1-F005 — RESOLVED

Project overlays now narrow the project's own permissions/actions, not the reach of Sentinel-wide rules.

The RFC template also correctly allows a fully authorized constitutional change while forbidding lower-authority bypass.

The previously incorrect rule-file relative path is corrected.

### S1-F006 — RESOLVED WITH ONE REQUIRED SCHEMA CLEANUP

The Decision Packet model now correctly provides:

- payload XOR payload hash;
- hash algorithm metadata;
- conditional `decided_at`;
- high/highest-risk evidence binding;
- optional idempotency until execution exists.

One small schema contradiction remains: the exact-`payload` branch forbids `payload_hash` but does not forbid an orphaned `payload_hash_algorithm`.

**Required correction:** when exact `payload` is used, `payload_hash_algorithm` must also be absent. No new runtime behavior is required.

### S1-F007 — PARTIALLY RESOLVED — provenance fixed, closure policy still inconsistent

The registry now correctly distinguishes:

- S0-origin active rules at `1.2.0`;
- S1-origin candidate rules at `PROPOSED`, `effective_version: null`, `proposed_effective_version: 1.3.0`.

That part is correct.

However, `VERSIONING_POLICY.md` still says:

> `core-rules.json` records `effective_version: "1.2.0"` for every rule

which is now false.

The versioning policy also says a MINOR version requires an RFC, Architect Sync, explicit Decision, and ADR. S1 itself was authorized before the RFC/ADR mechanism existed, so the repository needs an explicit bootstrap-transition rule rather than silently violating the policy at the first version bump.

**Required correction:**

- update the stale statement about every rule being effective at 1.2.0;
- state explicitly that S1 is the bootstrap transition into the new RFC/ADR system;
- `D-012` + `ML-DEVOS-AS-003` are the pre-RFC authorization/design records for S1;
- final S1 closure must create the first durable ADR recording the Governance Kernel and the v1.3.0 transition;
- do not activate the proposed S1 rules or apply v1.3.0 during this remediation cycle.

Because `CORE-016`–`CORE-018` are themselves `CORE_POLICY` records, their activation must not bypass the Paulo gate defined by the new class policy. After the Architect stage gate is clean, final activation/version closure should route to Paulo unless an existing explicit decision is demonstrated to cover those exact candidate rules.

### S1-F008 — PARTIALLY RESOLVED — durable mechanism works, backfill claim is factually wrong

The new durable Architect Sync archive/home/template is correct, and `ML-DEVOS-AS-003` is preserved.

However, the repository says AS-001/AS-002 cannot be recovered because the rolling file was overwritten. That is incorrect: Git history preserves prior versions of the rolling file.

The Architect independently recovered repository-verifiable historical content:

- `ML-DEVOS-AS-001` findings are present at `571146a06cba1ddc996fd68cd25a68fa4544c5ec`;
- amendment `AS0-001A` is present at `ce53eceb4a8da38f09f971c8fb20b4b618552010`;
- the full initial `ML-DEVOS-AS-002` findings `S0-F001`…`S0-F008` are present at `5962c978e363745d8bbea8b39b3aff7ae0711329`;
- final S0 closure is preserved at `af76cc7b3e6188caa5d2881f7dccb41511f5cd05`.

**Required correction:** backfill durable `ML-DEVOS-AS-001.md` and `ML-DEVOS-AS-002.md` from those historical repository snapshots, citing the exact source commit(s). Do not reconstruct from conversational memory.

For AS-001, preserve both the original findings and the later AS0-001A amendment with their historical commit provenance.

### S1-F009 — PARTIALLY RESOLVED — bookkeeping still needs correction

The old 21-vs-22 count was corrected conceptually, but the current remediation handoff introduces another inconsistent count:

> `26 files: 1 deleted, 23 modified, 5 new`

Those categories sum to 29, not 26.

The independent compare shows the `devos/**` remediation set is:

- 26 files total;
- 19 modified;
- 6 added;
- 1 removed.

The full `28a110b...` → `65c02a4...` compare contains 29 files because it also includes the three coordination files changed across the intervening Architect/Builder cycle.

Also, the state at the Builder commit still pointed `LAST_IMPLEMENTER_HANDOFF_SHA` at `28a110b...`; this Architect state update corrects the reviewed handoff SHA to `65c02a4...`.

**Required correction:** fix the handoff's file-count breakdown. No additional Builder finding is required for the state SHA after this Architect update.

## Additional observation — no new finding

The remediation remains within S1 static-governance scope. No runtime engine, CI, ruleset, website/admin implementation, project migration, deployment, or S2 work was found in the reviewed diff.

## Version disposition

The previously accepted version class remains:

`1.2.0 → 1.3.0 MINOR`

but it remains **proposed, not active**.

Do not change the overall Sentinel version or activate the S1-proposed rules during remediation cycle 2.

## Verdict

`SENTINEL S1 STAGE GATE: NOT APPROVED — CHANGES REQUESTED (CYCLE 2)`

The first remediation fixed the largest conceptual problems. The remaining blockers are now concentrated in machine-readable semantics and closure provenance: evidence AND/OR semantics, waiver authority/expiry binding, validator/schema equivalence, version-bootstrap closure, and durable historical sync backfill.

## Authorized remediation scope — cycle 2

Claude may modify only S1 Governance Kernel artifacts under `devos/**` plus:

- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

Allowed additions include:

- richer evidence requirement structure;
- waiver approval-reference fields and validator checks;
- stricter fail-closed static validation;
- AS-001/AS-002 durable archive files sourced from Git history;
- version/bootstrap-transition documentation;
- handoff corrections.

No S0 frozen architecture meaning may be changed.

## Required next handoff

Claude must:

1. remediate the remaining portions of `S1-F002`, `S1-F003`, `S1-F004`, `S1-F006`, `S1-F007`, `S1-F008`, and `S1-F009`;
2. preserve resolved `S1-F001` and `S1-F005`;
3. compare against `65c02a44e54618b70b23417f11802fb8fca148a4`;
4. rerun all retained static validators and explicitly state their limits;
5. show the exact historical Git source commit(s) used for AS-001/AS-002 archival backfill;
6. keep v1.3.0 proposed but unapplied;
7. update `coordination/IMPLEMENTER_HANDOFF.md`;
8. set `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `CURRENT_REMEDIATION_CYCLE: 2`;
9. keep `DEPLOY_AUTHORIZED: NO` and `MAIN_MERGE_AUTHORIZED: NO`;
10. stop for re-review.

## Current Architecture Sync status

`ML-DEVOS-AS-004: CHANGES_REQUESTED`

Do not archive AS-004 as a concluded durable record yet. Archive it only once this S1 stage-gate sync reaches a final verdict.
