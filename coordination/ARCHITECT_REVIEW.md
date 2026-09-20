# Architect Builder Brief — S4 State Machine Kernel Proposal

Status: AUTHORIZED PROPOSAL / AUDIT ONLY
Authority: D-048 (Paulo). Branch: governance/maisoglabs-v0.1.
Input HEAD: ceebf557ab2eff79b89e080230c46e8b2921ee78.
CYCLE_ID: SENTINEL_S4_STATE_MACHINE_PROPOSAL

## Prerequisites and scope audit

ML-DEVOS-AS-063 accepted coordinated v1.6.0 closure; ML-DEVOS-AS-064 accepted D-047 bridge activation. The latter rolling review is archived verbatim in devos/changes/architect-syncs/ML-DEVOS-AS-064.md as part of this handoff. The manifest records S3 IMPLEMENTED and S4 NOT_IMPLEMENTED; no S4 code exists in its reserved root. D-045 identifies S4 as the next roadmap candidate. D-048 now authorizes the proposal step only.

This is an authorization/handoff brief, not self-approval of an S4 design. Architect Review/Sync will run on the Builder's returned proposal. The frozen S0 roadmap is historical sequencing, not current phase status; use decisions, closure records and manifest for current status.

## Objective

Produce one small, implementation-ready ARCHITECTURE-class RFC for S4 State Machine Kernel, using devos/templates/RFC_TEMPLATE.md. Inspect the live RFC ceiling before allocation; at input HEAD it is 015, so the next is 016 only if still unused. Do not write executable implementation.

## Required reads

CLAUDE.md and its required instructions; AGENTS.md; live STATE.md; this brief; D-048; ML-DEVOS-ARCH-001 sections 3–11; ML-DEVOS-SIP-001 S4; devos/state/README.md; devos/devos-manifest.json; devos/contracts/TASK_CONTRACT_SPEC.md, task-contract.schema.json and validate-task-contract.mjs; devos/governance/rules/core-rules.json; EVIDENCE_PROVENANCE_MODEL.md; TRUST_BOUNDARIES.md; change-policy/CHANGE_GOVERNANCE_POLICY.md; specifications/VERSIONING_POLICY.md; brain/protocols/ARCHITECT_SYNC.md; traceability/README.md and the applicable canonical .agents/skills/.

## Proposal acceptance criteria

1. Define the smallest authoritative task-state kernel, with a precise transition table grounded in frozen lifecycle section 10. Name command inputs, state fields, guards, ownership and rejected transitions. Distinguish task state from the existing coordination turn file, memory, run history and evidence store. No migration of live coordination is authorized.
2. Reference validated S3 contracts without duplicating their schema or treating a contract/state field as an authority grant. Preserve claim-specific evidence classes and MAIN != DEPLOYED != VERIFIED. Define the boundary for externally attested later-phase states without implementing S5 permission enforcement, S7 evidence storage, S8 orchestration, S9 acceptance or S13 deployment.
3. Specify single-owner claims, lease expiry/renewal, stale-owner fencing, expected-revision checks, atomic update boundaries and concurrent claimant conflicts. Expiry alone must not let an old owner overwrite a new owner. Define clock assumptions and deterministic time injection for tests.
4. Specify idempotency scope/key/request binding, replay vs conflicting reuse, durable retry counters/ceilings, timeout handling, failure/recovery transitions and human escalation. Reuse existing policy; do not invent new retry authority. Discuss crash-before/after-persist, partial writes, corruption, restart, duplicate delivery and safe recovery.
5. Compare minimal local persistence choices and recommend one justified by atomicity, portability and recovery. Bound future files/dependencies and operational limits; no remote database or live store now. Clearly distinguish a pure transition function from the future operational state subsystem and propose honest manifest/version/closure consequences for later approval.
6. Provide Requirement -> Design -> planned Implementation -> planned Test -> required Evidence -> Status mappings inside the RFC, with exact repository source references and meaningful negative/race/restart tests. Mark all future code/tests NOT_IMPLEMENTED or PLANNED; no invented PASS evidence.
7. Include alternatives, risks, security/trust boundaries, rollout/rollback, compatibility, proposed version disposition and unresolved Paulo decisions. Freeze no new policy and grant no authority via the proposal. Avoid unrelated governance hardening.

## Exact Builder write whitelist

- One next-sequential RFC under devos/changes/rfcs/.
- devos/changes/rfcs/README.md: only add the new proposal entry.
- devos/governance/traceability/traceability-index.json and TRACEABILITY_INDEX.md: deterministic regeneration only.
- coordination/IMPLEMENTER_HANDOFF.md: append this cycle's evidence and compact BUILDER HANDOFF LOG.
- coordination/STATE.md: exact return gate below, or BLOCKED with the reason if work cannot complete safely.

Read-only inspection elsewhere is allowed. Do not edit this Architect brief, decisions, archives, tests, schemas, validators, frozen roadmap/architecture, devos/state/, manifest, ADRs, version, core rules, product, workflow, credentials or remote resources. Never merge PR #10, main or protected branches; no deployment/production activity.

## Audit and verification required

- Record exact execution HEAD and clean/dirty working-tree state. Read live gate before action; stop for unexpected concurrent scope changes.
- Before edits run node devos/governance/traceability/validate-traceability.mjs. Expected ERROR fingerprint: missing-canonical-target CORE CORE-022 and WEB-REQ WEB-REQ-009. These are existing debt, not S4 blockers by themselves. Report full literal output/exit code and every warning; investigate unexpected differences without altering policy or fabricating records.
- After proposal and handoff edits, run node devos/governance/traceability/generate-traceability.mjs, then the validator. Require no drift and no new ERROR; exit 1 remains expected for the two disclosed baseline errors and is not an all-green audit.
- Verify exact diff whitelist, resolving links/IDs and honest status/evidence labels. Compare manifests/core/runtime/workflow paths to execution base: unchanged. No application build is needed for a proposal-only diff.
- Do not reuse prior test counts as new execution evidence. Label Builder execution ACTOR_REPORTED until independently checked.

## Return gate and handoff

Append scope, input/result commit provenance, changed files, mappings, commands/results, full audit findings, risks, unresolved questions and compact BUILDER HANDOFF LOG. Include next actor ARCHITECT. Commit proposal, indexes and coordination together to governance/maisoglabs-v0.1; no force push. Reconfirm live HEAD before pushing; stop/reassess concurrent work.

Return STATE to:
- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- AUTHORIZED_SCOPE: S4_STATE_MACHINE_PROPOSAL_REVIEW_ONLY
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO

Retain all prohibition flags NO and remediation limits. Then stop. Independent design review comes before separate Paulo implementation approval.

## Architect audit baseline — independently reproduced

250 relevant text blobs were materialized and Git-blob-hash verified against input HEAD, covering the configured traceability scan. Read-only validator output (exit 1):

```text
Scanned 247 files across 12 ID families.
Errors: 2  Warnings: 16  Total canonical definitions: 249
ERROR [missing-canonical-target] CORE CORE-022: CORE-022 is referenced but has no canonical record in CORE's configured canonical source.
ERROR [missing-canonical-target] WEB-REQ WEB-REQ-009: WEB-REQ-009 is referenced but has no canonical record in WEB-REQ's configured canonical source.
WARNING [intentional-noncanonical-mention] CORE CORE-022: CORE-022 at this site is an intentional non-reference mention, not a missing canonical target (not silently suppressed).
WARNING [orphan-no-inbound-reference] D D-001: D-001 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-002: D-002 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-003: D-003 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-004: D-004 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-005: D-005 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-009: D-009 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-022: D-022 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-030: D-030 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-035: D-035 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-047: D-047 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [historical-exception-missing-canonical-record] ML-DEVOS-AS ML-DEVOS-AS-008: ML-DEVOS-AS-008 is referenced but has no canonical record; explicit historical exception (not silently suppressed).
WARNING [historical-exception-missing-canonical-record] ML-DEVOS-AS ML-DEVOS-AS-009: ML-DEVOS-AS-009 is referenced but has no canonical record; explicit historical exception (not silently suppressed).
WARNING [orphan-no-inbound-reference] WEB-SEC WEB-SEC-006: WEB-SEC-006 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] WEB-SEC WEB-SEC-007: WEB-SEC-007 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] WEB-SEC WEB-SEC-008: WEB-SEC-008 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
DRIFT: on-disk generated index does not match a fresh generation run — run generate-traceability.mjs to regenerate.
```

The initial drift is disclosed. Archiving the concluded bridge review supplies durable provenance for D-047; derived-index regeneration is explicitly bounded bookkeeping under D-048, not a rewrite of either existing error's source. Full post-bookkeeping audit output is appended below before publication.

## Post-bookkeeping audit — independently reproduced

Validator exit: 1 (the two known errors remain). No drift and no new ERROR. D-047 orphan warning is replaced by the new D-048 proposal-authorization orphan warning; the pending RFC will provide its durable inbound reference.

```text
Scanned 248 files across 12 ID families.
Errors: 2  Warnings: 16  Total canonical definitions: 251
ERROR [missing-canonical-target] CORE CORE-022: CORE-022 is referenced but has no canonical record in CORE's configured canonical source.
ERROR [missing-canonical-target] WEB-REQ WEB-REQ-009: WEB-REQ-009 is referenced but has no canonical record in WEB-REQ's configured canonical source.
WARNING [intentional-noncanonical-mention] CORE CORE-022: CORE-022 at this site is an intentional non-reference mention, not a missing canonical target (not silently suppressed).
WARNING [orphan-no-inbound-reference] D D-001: D-001 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-002: D-002 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-003: D-003 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-004: D-004 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-005: D-005 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-009: D-009 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-022: D-022 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-030: D-030 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-035: D-035 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] D D-048: D-048 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [historical-exception-missing-canonical-record] ML-DEVOS-AS ML-DEVOS-AS-008: ML-DEVOS-AS-008 is referenced but has no canonical record; explicit historical exception (not silently suppressed).
WARNING [historical-exception-missing-canonical-record] ML-DEVOS-AS ML-DEVOS-AS-009: ML-DEVOS-AS-009 is referenced but has no canonical record; explicit historical exception (not silently suppressed).
WARNING [orphan-no-inbound-reference] WEB-SEC WEB-SEC-006: WEB-SEC-006 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] WEB-SEC WEB-SEC-007: WEB-SEC-007 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
WARNING [orphan-no-inbound-reference] WEB-SEC WEB-SEC-008: WEB-SEC-008 is canonically defined but has no inbound reference anywhere else in the durable scanned surface.
No drift: on-disk generated index matches a fresh generation run.
```
