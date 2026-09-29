# Decision Log

Chronological record of governance-relevant decisions. Newest entries at the bottom. Each entry cites the deciding role and the evidence/commit it rests on.

---

### D-001 — Adopt MaisogLabs Governance v0.1 for the website pilot

- **Decided by:** Paulo (Product / Risk Owner)
- **Date/context:** Governance plan authored and merged to `governance/maisoglabs-v0.1` (`f7bb45b`, `docs(governance): add MaisogLabs governance and admin-first plan`).
- **Decision:** Adopt `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` as the governing plan for this repository's website/admin work, with Paulo as Product/Risk Owner, ChatGPT as Architect, and Claude as Implementer.

### D-002 — Record legacy baseline SHA

- **Decided by:** Governance plan (Paulo-approved) / confirmed by Claude in Phase 0
- **Decision:** `887849283ee9cd16e8d60b937bac95b1c85bf3d9` (`main` HEAD, "Add validated Phase 2 content layer") is the legacy baseline. Governance is prospective from this SHA; earlier history is not retroactively governed.
- **Evidence:** `git merge-base HEAD origin/governance/maisoglabs-v0.1` = this SHA; `git rev-parse main` = this SHA (verified in Phase 0 handoff and unchanged as of Phase 1).

### D-003 — Approve Phase 0 (Repository Reconnaissance Only)

- **Decided by:** Paulo
- **Decision:** Authorize Claude to perform repository reconnaissance only; no functional, deployment, or `main`-merge changes.
- **Evidence:** `CLAUDE.md` "Current authorized scope" section at the time; `coordination/STATE.md` `CYCLE_ID: PHASE-0-RECON`.

### D-004 — Close Phase 0 stage gate

- **Decided by:** ChatGPT (Architect), Stage Gate Review
- **Decision:** `PHASE 0 STAGE GATE: APPROVED`. Reconnaissance was complete and accurate; no application code changed; handoff and turn-state mechanics functioned correctly. Verdict explicitly did not approve any functional implementation and required Paulo authorization before Phase 1.
- **Evidence:** `coordination/ARCHITECT_REVIEW.md` (reviewed handoff SHA `2e97bf65423daad59348b98860f6bf7ebaec4215`).

### D-005 — Approve Phase 1 (Governance Bootstrap Only)

- **Decided by:** Paulo
- **Decision:** Authorize Claude to perform governance bootstrap only (create `brain/*`, extend `AGENTS.md`, reconcile the deployment-wording contradiction, inventory legacy branches, preserve the existing content boundary). No admin implementation, authentication, D1/R2, public redesign, deployment, or `main` merge is authorized.
- **Evidence:** `CLAUDE.md` "Current authorized scope: PHASE 1 — GOVERNANCE BOOTSTRAP ONLY. Paulo has explicitly approved this phase."; `coordination/STATE.md` `CYCLE_ID: PHASE-1-GOVERNANCE-BOOTSTRAP`, `AUTHORIZED_SCOPE: PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY`.

### D-006 — Reconcile deployment-wording contradiction (documentation only)

- **Decision authority:** Paulo-approved Phase 1 scope item A, acting on Architect finding F-003
- **Implemented/recorded by:** Claude (Implementer)
- **Decision:** `AGENTS.md` and `README.md` are updated to describe the stack as a static export served via a Cloudflare Worker asset-only deployment through Wrangler, matching `docs/ARCHITECTURE.md` and `wrangler.jsonc`, rather than "Cloudflare Pages." No infrastructure, build command, or deployment target was changed — this is a documentation correction only.
- **Evidence:** This commit's diff to `AGENTS.md` and `README.md`; no diff to `wrangler.jsonc`, `next.config.mjs`, or `package.json` scripts.

### D-007 — Preserve the existing content boundary as the governed baseline

- **Decision authority:** Paulo-approved Phase 1 scope item C, acting on Architect finding F-002
- **Implemented/recorded by:** Claude (Implementer)
- **Decision:** The existing `data/site.js → lib/content/local.mjs → lib/content/schema.mjs → lib/content/public.mjs → app/page.js` boundary is recorded as the governed content architecture in `PROJECT_GOVERNANCE.md`. Future Admin/CMS work must preserve it or replace it only through a new, explicitly recorded decision in this log — not silently.
- **Evidence:** `brain/PROJECT_GOVERNANCE.md` § "Current storage model"; no changes made to `lib/content/*` or `data/site.js` in this cycle.

### D-008 — Classify non-governance branches without inspection or merge

- **Decision authority:** Paulo-approved Phase 1 scope item B, acting on Architect finding F-004
- **Implemented/recorded by:** Claude (Implementer)
- **Decision:** The eight known non-governance remote branches (`admin-v1`, `codex/link-eternal-eggs-dashboard`, `design-v2`, `master-plan-v1`, `redesign/immersive-bridge-v2`, `website-v3.1`, `website-v3.1.1`, `website-v3.1.2`) are recorded in `PROJECT_GOVERNANCE.md` as `UNINSPECTED LEGACY/EXPERIMENTAL`, from Git metadata only. None were opened, reviewed, or merged. `admin-v1` specifically is not reused merely because it exists.
- **Evidence:** `brain/PROJECT_GOVERNANCE.md` § "Legacy / non-governance branch inventory"; `git log -1` output per branch recorded in the same section.

### D-009 — Correct governance-map and test-ledger overstatements (Phase 1 remediation cycle 1)

- **Decision authority:** Architect Stage Gate Review, `PHASE 1 STAGE GATE: NOT APPROVED — CHANGES REQUESTED` (findings F1-003, F1-004, F1-005)
- **Implemented/recorded by:** Claude (Implementer)
- **Decision:** `brain/GOVERNANCE_MAP.md`'s aggregate `WEB-REQ-001`…`008` row is replaced with eight individually evidenced rows; `WEB-REQ-004` is explicitly recorded `NOT STARTED` (no Admin-managed editing exists). `brain/TEST_LEDGER.md`'s `TEST-ADM-006` is corrected from `PASS` to `NOT IMPLEMENTED`, since no Admin/write boundary exists to exercise it; the existing, genuinely passing content-schema tests remain recorded separately as content-layer evidence. D-006–D-008 above are reworded to separate decision authority (Paulo/Architect) from implementation (Claude).
- **Evidence:** `coordination/ARCHITECT_REVIEW.md` (handoff SHA `61783e678c32736e45a941e95e44f595941c1623` reviewed); this commit's diff to `brain/GOVERNANCE_MAP.md`, `brain/TEST_LEDGER.md`, and `brain/DECISION_LOG.md`.

### D-010 — Authorize SENTINEL S0 Architecture Freeze and adopt Architecture Sync decisions K-1…K-7

- **Decided by:** Paulo (Product / Risk Owner), following Architect Sync `ML-DEVOS-AS-001`.
- **Decision:** Proceed with `MaisogLabs DevOS v1.2.0 — SENTINEL` architecture freeze under `ML-DEVOS-ARCH-001` and implementation roadmap `ML-DEVOS-SIP-001`, limited to S0 architecture/governance documentation and bootstrap only. No DevOS runtime/control-plane implementation is authorized.
- **K-1 — Repository topology:** Sentinel core will live in a separate repository, target name `Dillaab-source/maisoglabs-devos`. Product repositories remain separate and later receive lightweight `.devos/` project overlays.
- **K-2 — Scope relationship:** Sentinel is the cross-project meta-system intended to govern MaisogLabs Website and future projects such as PUSAKAL and ClinicFlow; it is not merely a website subsystem.
- **K-3 — State model:** Sentinel will use namespaced per-project/per-task state. The existing `coordination/STATE.md` remains authoritative for the website pilot until explicit migration; it must not become a single global DevOS turn-lock. During bootstrap only, this file may carry the authorization needed to create/freeze the initial Sentinel artifacts.
- **K-4 — Role reconciliation:** The universal Sentinel target is five actors — Paulo, Architect, Builder, QA, Independent Reviewer — plus system mechanisms such as Evidence Gate, Policy Engine, Task Engine, Orchestrator, Capability Gateway, CI, and GitHub Rules. Evidence Gate is not a human/agent authority role and cannot accept risk or invent scope.
- **K-5 — Audit trail:** This authorization and the S0 decisions are version-controlled here as the bootstrap audit record. After the first approved Sentinel freeze commit exists in `maisoglabs-devos`, that repository becomes the authoritative Sentinel source of truth.
- **K-6 — QA/Evidence Gate timing:** S0 defines their contracts and boundaries only. QA automation, CI, rulesets, and Evidence Gate implementation are reserved for later explicitly authorized Sentinel phases.
- **K-7 — Bootstrap authority:** Before the first Sentinel repository baseline exists, Paulo's explicit authorization + approved Architect Sync `ML-DEVOS-AS-001` + the frozen S0 documents constitute bootstrap authority. After the first approved freeze commit, conversational architecture cannot silently supersede the repository baseline.
- **Additional freeze corrections adopted:** Evidence provenance will be provider-independent (`ACTOR_REPORTED`, `INDEPENDENTLY_INSPECTED`, `INDEPENDENTLY_REPRODUCED`, `CI_ATTESTED`, `RUNTIME_OBSERVED`); PR/CI/reviewer evidence feeds the Evidence Gate; skills/tools belong to the Capability subsystem rather than Governance; Memory, task state, run history, and Evidence Store remain distinct; Sentinel supports bounded Paulo-defined delegation for pre-authorized low-risk work while architecture/security/risk/governance/deployment gates remain human-controlled as specified.
- **S0 scope authorized now:** prepare and version-control the architecture freeze documents only, create/bootstrap the separate Sentinel repository if the authenticated environment permits, and return the freeze commit for Architect review. No website/admin implementation, no DevOS executable control-plane code, no CI/ruleset enforcement, no production deployment, no merge to the website `main`, and no migration of the website pilot are authorized.
- **Evidence:** Paulo approval in conversation after `ML-DEVOS-AS-001`; Phase 1 website governance had already closed at branch commit `f7fac89697a36ec48d1850bbdc65320c559a284a` before this authorization.

### D-011 — Amend Sentinel topology: repurpose `maisog-labs` as the Sentinel monorepo

- **Decided by:** Paulo (Product / Risk Owner), after the S0 repository-creation blocker and Architect review.
- **Decision:** Repurpose the existing `Dillaab-source/maisog-labs` repository as the canonical Sentinel/DevOS monorepo instead of creating a separate `Dillaab-source/maisoglabs-devos` repository.
- **Supersedes:** D-010 `K-1` only, plus any AS0-001 wording that required a separate Sentinel-core repository.
- **Does not supersede:** D-010 `K-2` through `K-7`, evidence-provenance rules, actor/system-mechanism separation, namespaced state, bounded delegation, or the S0 documentation-only scope.
- **Repurpose invariant:** This is a governance/repository-purpose change, not a destructive rewrite. Existing website code, history, content, tests, deployment configuration, and working governance artifacts remain preserved during S0. No application/runtime file may be moved, deleted, or rewritten merely to make the repository look like a monorepo.
- **Canonical S0 target structure:** Sentinel documentation may now be version-controlled under `devos/` in this repository. A future explicitly authorized migration may introduce `projects/maisoglabs-website/.devos/` and may reorganize application code, but S0 does not authorize that migration.
- **Source of truth amendment:** After the S0 freeze artifacts are committed here and independently Architect-approved, `Dillaab-source/maisog-labs` becomes the authoritative Sentinel source of truth. `brain/` and `coordination/` remain bootstrap/legacy governance surfaces until an explicit later migration or retirement decision.
- **Authorization created by this decision:** Claude may commit only the eight S0 freeze documentation artifacts into the `devos/` documentation structure, update the implementer handoff/state, and return to the Architect. No DevOS runtime implementation, CI/ruleset work, website/admin change, deployment, website `main` merge, or application migration is authorized.
- **Evidence:** Paulo clarified "Repurpose" after initially saying "overwrite"; Architect Sync amendment `AS0-001A` records the accepted monorepo topology and preserves non-destructive migration invariants.


### D-012 — Adopt Sentinel future-change governance and authorize S1 Governance Kernel

- **Decided by:** Paulo (Product / Risk Owner), following external research review and Architect Sync `ML-DEVOS-AS-003`.
- **Decision:** Adopt the Sentinel future-change governance model defined by `ML-DEVOS-AS-003` and authorize `S1 — Governance Kernel` only.
- **Change classes adopted:** `PATCH`, `LOCAL_RULE`, `CORE_POLICY`, `CAPABILITY`, `ARCHITECTURE`, `CONSTITUTIONAL`, `WAIVER`, and `PROJECT_ONBOARDING`.
- **Change-record model adopted:** keep RFC, Architect Sync, authorization/decision, implementation, and ADR as distinct records. An RFC proposes; an ADR records what actually became architecture and why.
- **Governance rule adopted:** frozen architecture is evolvable but may change only through explicit, versioned, attributable, reviewed repository changes. Conversation alone cannot silently supersede the repository baseline.
- **Overlay rule adopted:** project overlays may strengthen or narrow core policy but may not silently weaken constitutional/core Sentinel rules.
- **Human-gate rule adopted:** use risk-based human gates. Paulo may explicitly pre-authorize bounded low-risk actions; constitutional/architecture/security/trust-boundary/material-risk/governance-authority changes remain Paulo-gated, and production deployment remains Paulo-gated unless Paulo explicitly changes that policy.
- **Capability rule adopted:** adding a tool/connector does not grant universal authority. Capability onboarding must specify role, project/scope, permission level, secrets, sensitive operations, and evidence/audit expectations.
- **Decision Packet requirement adopted:** future sensitive approvals should bind to the concrete intended operation (action/tool/target/payload or hash/current state/expected state change/risk/policy revision/evidence/rollback or compensation/idempotency/approver/decision metadata) rather than only an agent-written summary.
- **Policy representation direction adopted:** S1 may define human-readable policy plus machine-readable static rule/registry records and a Governance Bundle manifest specification. Cryptographic signing, distribution, runtime Policy Engine behavior, and enforcement are not S1 work.
- **Versioning direction adopted:** patch/minor/major architecture intent is recorded; an actual architecture version bump must be explicit and repository-recorded rather than inferred from conversation.
- **S1 authorized outputs:** formalize the Governance Kernel under `devos/`, including change-classification policy, rule registry/model, RFC/ADR/waiver templates, capability-change proposal template, project-onboarding template, Decision Packet specification/template, Governance Bundle manifest specification, version/provenance policy, and traceability from the frozen S0 constitution into the rule registry.
- **Explicitly not authorized in S1:** Policy Engine runtime, Task Engine runtime, Orchestrator, Evidence Gate runtime, Capability Gateway runtime, CI/workflows, GitHub rulesets/branch protection, website/admin changes, project migration, production deployment, protected-branch/`main` merge, or S2+ implementation.
- **Evidence:** S0 was Architect-approved in `coordination/ARCHITECT_REVIEW.md` via `ML-DEVOS-AS-002`; `ML-DEVOS-AS-003` records the compatible future-change governance architecture; Paulo then said “Okay let’s do it.”

### D-013 — Approve S1 Governance Kernel activation and Sentinel v1.3.0 version closure

- **Decided by:** Paulo (Product / Risk Owner), following Architect Sync `ML-DEVOS-AS-004`'s technical stage-gate approval (`SENTINEL S1 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`) and the Architect's explicit routing of the activation/version-closure decision to Paulo.
- **Decision (verbatim, as given):** "I approve Sentinel S1 activation and version closure. Authorize: 1. adoption of the S1 Governance Kernel as the active Sentinel governance-capability baseline; 2. activation of CORE-008, CORE-009, CORE-016, CORE-017, and CORE-018; 3. the Sentinel version transition from v1.2.0 to v1.3.0; 4. creation of the first durable ADR recording the S1 Governance Kernel and bootstrap transition; 5. documentation/static-governance closure updates required to record the activated version and rule state. This approval does NOT authorize S2 or any later phase. DEPLOY_AUTHORIZED remains NO. MAIN_MERGE_AUTHORIZED remains NO."
- **Adopted:** the S1 Governance Kernel (change classes, rule registry, RFC/ADR/waiver system, Decision Packet specification, Governance Bundle specification, versioning policy) becomes the active Sentinel governance-capability baseline.
- **Activated:** `CORE-008`, `CORE-009`, `CORE-016`, `CORE-017`, `CORE-018` transition from `PROPOSED` to `ACTIVE`, with `effective_version: "1.3.0"` and `proposed_effective_version: null`. Recorded in `devos/governance/rules/core-rules.json` and the first durable ADR `ML-DEVOS-ADR-001`.
- **Version transition:** Sentinel's active governance-capability baseline moves from `v1.2.0` to `v1.3.0` (`MINOR`, per `devos/governance/specifications/VERSIONING_POLICY.md`). This does **not** change the frozen S0 architecture document (`devos/architecture/ML-DEVOS-ARCH-001.md`), which retains its own historical `v1.2.0` title/identity as the S0 baseline it documents; `v1.3.0` describes the Sentinel *governance-capability* baseline layered on top via S1, not a rewrite of the frozen S0 architecture generation.
- **ADR created:** `devos/changes/adrs/ML-DEVOS-ADR-001.md` — the first durable ADR, recording the S1 Governance Kernel's adoption and the pre-RFC bootstrap transition (`D-012`/`ML-DEVOS-AS-003` preceded the RFC/ADR system's own existence).
- **Explicitly NOT authorized by this decision:** S2 or any later Sentinel phase; any Policy/Task Engine, Orchestrator, Evidence Gate, or Capability Gateway runtime; CI/workflows; GitHub rulesets/branch-protection changes; website/admin implementation; project migration; production deployment; protected-branch/`main` merge. `DEPLOY_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` remain `NO`.
- **Evidence:** `coordination/ARCHITECT_REVIEW.md` `ML-DEVOS-AS-004` final verdict (`ARCHITECT_APPROVED`, reviewed commit `df9675cbc2baac398071dc77ba6c4728cf54d2d5`) and its "Paulo gate required for S1 activation / v1.3.0 closure" section; Paulo's approval message, quoted above; this commit's diff implementing items 1–5.


### D-014 — Confirm D-013 provenance and final S1 closure authority

- **Decided by:** Paulo (Product / Risk Owner), in direct response to `ML-DEVOS-AS-005`'s provenance gate.
- **Decision (verbatim):** "I confirm D-013 exactly as recorded in brain/DECISION_LOG.md. I approve: - S1 Governance Kernel activation; - CORE-008, CORE-009, CORE-016, CORE-017, and CORE-018 activation; - the v1.2.0 → v1.3.0 transition; - ML-DEVOS-ADR-001; - the documentation-only S1 closure. This does not authorize S2, deployment, or main merge."
- **Effect:** Confirms that `D-013` accurately records Paulo's intended S1 activation/version-closure authority. This resolves `ML-DEVOS-AS-005` finding C-005; no rollback or content remediation of the S1 activation commit is required.
- **Scope boundary:** This confirmation does not authorize S2 or any later phase, production deployment, protected/main merge, runtime enforcement implementation, CI/rulesets, website/admin work, or project migration.
- **Evidence:** Paulo's explicit confirmation in the Architect Sync conversation after `ML-DEVOS-AS-005` requested provenance confirmation.


### D-015 — Authorize initiation of S2 DevOS Repository Foundation proposal

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision:** Authorize the next Sentinel phase process for **S2 — DevOS Repository Foundation** to begin under the active v1.3.0 Governance Kernel.
- **Classification:** `ARCHITECTURE` change, because S2 establishes the concrete DevOS core/project-registry foundation and repository structure that later Sentinel subsystems will build on.
- **Authorization scope now:** proposal/design process only — create the S2 RFC, define scope/non-goals/topology/acceptance criteria/migration constraints, then return it for Architect Sync. This decision does **not** skip the active `RFC → Architect Sync → Decision → Implementation → ADR` path.
- **Implementation gate:** S2 implementation is **not yet authorized**. After the RFC is reviewed through Architect Sync, Paulo must issue a second explicit implementation decision if the proposal is approved.
- **Explicitly not authorized:** S3 or later phases; runtime Policy/Task/Evidence/Capability engines beyond whatever repository-foundation scaffolding the approved S2 RFC later permits; CI/workflows; GitHub rulesets/branch protection; website/admin implementation; project migration; production deployment; protected/main merge.
- **Evidence:** Paulo said “authorize” immediately after S1 closed and the live state required a new explicit Paulo authorization before any S2 work.


### D-016 — Authorize S2 DevOS Repository Foundation implementation

- **Decided by:** Paulo (Product / Risk Owner), after Architect Sync `ML-DEVOS-AS-006` approved `ML-DEVOS-RFC-001` for implementation consideration.
- **Decision:** Authorize Claude / Builder to implement **S2 — DevOS Repository Foundation** exactly within the accepted scope of `ML-DEVOS-RFC-001` as reviewed by `ML-DEVOS-AS-006`.
- **Authorized implementation scope:** static DevOS foundation manifest + schema; reserved subsystem roots with README-only `NOT IMPLEMENTED` boundaries; empty `projects/registry.json` + schema; deterministic zero-dependency static validators for manifest/registry; S2 handoff/coordination/provenance updates.
- **Required architecture invariants:** preserve separate frozen architecture baseline `ML-DEVOS-ARCH-001 / v1.2.0` and active governance-capability baseline `v1.3.0`; preserve source-of-truth precedence; keep project registry an index only; keep registry empty through S2 closure; one canonical owner phase per reserved root; no executable later-phase subsystem code in S2.
- **Builder boundary:** Claude implements. Architect does not implement S2. Builder returns a commit/handoff for independent Architect comparison against this authorization, `ML-DEVOS-RFC-001`, and `ML-DEVOS-AS-006`.
- **Explicitly not authorized:** S3 or later phases; project onboarding; product `.devos/` overlays; website migration or product-source relocation; Task/Policy/Capability/Orchestrator/Evidence runtime; CI/workflows; GitHub rulesets/branch protection; production deployment; protected/main merge.
- **Version disposition:** `v1.3.0 → v1.4.0 MINOR` remains proposed only until implementation is independently reviewed and S2 is explicitly closed.
- **Review rule:** before any Architect verdict on Builder output, Architect must pull the live Sentinel Architecture Sync/state and compare the Builder output/diff against the approved RFC, current sync, and authorized scope.
- **Evidence:** Paulo said “ok approved” after reviewing the Architect-approved S2 RFC package and additionally instructed that Architect should always pull Sentinel Architecture Sync and compare outputs before review.


### D-017 — Approve S2 closure and Sentinel v1.4.0 version transition

- **Decided by:** Paulo (Product / Risk Owner), following Architect Sync `ML-DEVOS-AS-007` and its verdict `SENTINEL S2 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`.
- **Decision (verbatim):** "I approve Sentinel S2 closure. Authorize: - adoption of the S2 DevOS Repository Foundation into the active Sentinel baseline; - creation of the durable S2 ADR; - the v1.3.0 → v1.4.0 MINOR transition; - documentation/static-governance closure updates marking S2 closed. This does not authorize S3 or any later phase, project onboarding, website migration, runtime engines, CI/workflows, GitHub rulesets, deployment, or main merge."
- **Authorized closure work:** Claude / Builder may perform documentation/static-governance closure only: create the durable S2 ADR, update version/baseline records from v1.3.0 to v1.4.0 as authorized, archive/register the concluded S2 Architect Sync as appropriate, update S2 handoff/coordination records, and record S2 as closed.
- **Builder boundary:** Claude performs the closure implementation. Architect does not implement the S2 closure. After Builder handoff, Architect must pull live Sentinel state/sync and compare the exact closure diff against D-017, ML-DEVOS-RFC-001, ML-DEVOS-AS-006, ML-DEVOS-AS-007, and the authorized closure scope before issuing a final closure verdict.
- **Explicitly not authorized:** S3 or later phases; project onboarding; product `.devos/` overlays; website migration or product-source relocation; runtime Policy/Task/Capability/Orchestrator/Evidence engines; CI/workflows; GitHub rulesets/branch protection; production deployment; protected/main merge.
- **Evidence:** Paulo's explicit closure approval after the S2 technical stage gate passed.


### D-018 — Authorize legacy Architect Sync provenance audit

- **Decided by:** Paulo (Product / Risk Owner), after S2 closed at Sentinel governance-capability baseline `v1.4.0`.
- **Decision:** Authorize an Architect-led audit of legacy durable Architect Sync archives `ML-DEVOS-AS-001`, `ML-DEVOS-AS-002`, and `ML-DEVOS-AS-004` for historical/verbatim provenance accuracy.
- **Authorized scope:** read the live Sentinel state and current Architecture Sync; compare each legacy archive against its cited historical `coordination/ARCHITECT_REVIEW.md` Git snapshot(s); classify any mismatch; record an Architect Sync audit verdict and recommended remediation.
- **Not authorized by this decision:** rewriting/remediating the legacy archive files themselves; S3 proposal or implementation; runtime work; project onboarding; website migration; CI/workflows; GitHub rulesets; deployment; protected/main merge.
- **Role boundary:** this audit is Architect-owned review/governance work. If archive remediation is required, Builder implementation requires a subsequent explicit authorization and must return for independent Architect verification.
- **Standing review rule:** live Sentinel state/Architecture Sync and exact Git evidence must be pulled before verdicts; conversational recollection is not sufficient evidence.
- **Evidence:** Paulo explicitly said `Approve legacy audit first.`


### D-019 — Authorize legacy Architect Sync archive remediation

- **Decided by:** Paulo (Product / Risk Owner), following `ML-DEVOS-AS-009` audit verdict `AUDIT COMPLETE — REMEDIATION REQUIRED`.
- **Decision:** Authorize Claude / Builder to remediate the legacy durable Architect Sync archives `ML-DEVOS-AS-001`, `ML-DEVOS-AS-002`, and `ML-DEVOS-AS-004` so their historical/verbatim provenance claims become repository-truthful.
- **Authorized files:** `devos/changes/architect-syncs/ML-DEVOS-AS-001.md`; `devos/changes/architect-syncs/ML-DEVOS-AS-002.md`; `devos/changes/architect-syncs/ML-DEVOS-AS-004.md`; `devos/changes/architect-syncs/README.md`; and normal Builder handoff/state records.
- **Required remediation method:** retrieve the cited historical `coordination/ARCHITECT_REVIEW.md` snapshots from Git; preserve each historical snapshot byte-for-byte inside clearly identified fenced blocks; keep any explanatory metadata or summaries outside those verbatim blocks; mechanically verify exact reproduction against the cited Git SHAs; preserve historical decisions/verdicts and S0/S1/S2 architecture semantics.
- **AS-004 requirement:** preserve the full multi-cycle provenance. Preferred implementation is to archive all historical AS-004 review snapshots used across the initial review and remediation cycles as separate byte-exact fenced snapshots rather than collapsing them into a paraphrased summary.
- **Builder boundary:** Claude implements this remediation. The Architect does not rewrite the archive artifacts and will independently pull live state/history and verify the exact Builder diff before issuing a closure verdict.
- **Explicitly not authorized:** S3 proposal or implementation; project onboarding; product `.devos/` overlays; website migration; runtime Policy/Task/Capability/Orchestrator/Evidence engines; CI/workflows; GitHub rulesets/branch protection; production deployment; protected/main merge; changes to the underlying historical decisions themselves.
- **Evidence:** Paulo explicitly said `Approve legacy archive remediation.`


### D-020 — Record MaisogLabs Product Build Pack direction

- **Decided by:** Paulo (Product / Risk Owner), after reviewing the existing MaisogLabs documentation against current AI-assisted software-development practices.
- **Decision:** Record a future MaisogLabs product-specification layer that consolidates product intent without duplicating or weakening Sentinel/DevOS governance.
- **Target product-document set:** `docs/product/PRD.md`; `docs/product/TECHNICAL_DESIGN.md`; `docs/product/UI_UX_SPEC.md`; `docs/product/APP_FLOW.md`; `docs/product/DATA_BACKEND_SPEC.md`; `docs/product/BUILD_PLAN.md`.
- **Reuse rule:** existing authoritative material should be referenced/consolidated rather than copied blindly. Sentinel architecture/governance remains authoritative for scope, authority, evidence, change control, and review.
- **Priority gaps:** `APP_FLOW.md` and `DATA_BACKEND_SPEC.md` are the first genuinely missing product artifacts to formalize. The other documents should primarily consolidate/reference existing requirements, architecture, design, and implementation-plan material.
- **Working lifecycle recorded:** `Product Spec → Architect consistency check → acceptance criteria → dependency-ordered bounded tasks → Claude implementation increment → tests/evidence → Architect independent review → next increment`.
- **Boundary:** this record is a planning decision only. It does **not** authorize creation of the six files yet, website/admin/backend implementation, S3 proposal or implementation, project onboarding, runtime work, deployment, or main merge.
- **Sequencing:** formal implementation of this Product Build Pack should be opened as a separate governed change after the active legacy-archive remediation is independently closed, so it does not contaminate the current remediation diff or Sentinel phase gates.
- **Evidence:** Paulo explicitly said, `Okay let’s put that into record`, referring to the Product Build Pack and spec-to-build workflow described immediately beforehand.


### D-021 — Authorize MaisogLabs Product Build Pack documentation implementation

- **Decided by:** Paulo (Product / Risk Owner), following `D-020`.
- **Decision:** Authorize Claude / Builder to create the MaisogLabs Product Build Pack documentation layer only.
- **Authorized outputs:** `docs/product/PRD.md`; `docs/product/TECHNICAL_DESIGN.md`; `docs/product/UI_UX_SPEC.md`; `docs/product/APP_FLOW.md`; `docs/product/DATA_BACKEND_SPEC.md`; `docs/product/BUILD_PLAN.md`; and normal handoff/state records.
- **Reuse rule:** consolidate/reference existing repository truth rather than duplicating or silently superseding it. Existing Sentinel/DevOS architecture, decisions, ADRs, Architect Syncs, website governance, brand/design artifacts, content schema, and implementation plans remain authoritative in their own domains.
- **Priority requirements:** `APP_FLOW.md` must provide the clearest current product/user/admin flow map; `DATA_BACKEND_SPEC.md` must define the future backend/data contract at design/spec level only, including entities, relationships, draft/published state, auditability, media/storage boundaries, validation, security constraints, and migration considerations from the current static content model.
- **Build-plan rule:** `BUILD_PLAN.md` must decompose future implementation into dependency-ordered, bounded increments that can each be independently reviewed. It must not itself authorize those implementation increments.
- **Lifecycle to encode:** `Product Spec → Architect consistency check → acceptance criteria → dependency-ordered bounded tasks → Claude implementation increment → tests/evidence → Architect independent review → next increment`.
- **Builder boundary:** this is documentation/specification implementation only. Claude must not implement website/admin/backend/runtime functionality, database migrations, Cloudflare resources, project onboarding, or S3 work.
- **Explicitly not authorized:** S3 proposal or implementation; application/runtime code changes; admin/backend implementation; D1/R2/API provisioning; project onboarding; project registry population; product `.devos/` overlays; CI/workflows; GitHub rulesets/branch protection; production deployment; protected/main merge.
- **Review rule:** after Builder handoff, the Architect must pull live Sentinel state and compare the exact Builder diff against D-020, D-021, the existing website/product documents, and current Sentinel architecture/governance before issuing a verdict.
- **Evidence:** Paulo explicitly replied `approved` after being told that D-020 remained planning-only and required separate authorization before `docs/product/*` implementation.


### D-022 — Record cross-project reusable-pattern and skill direction

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision:** Record a future MaisogLabs process for extracting lessons from real builds, validating them across projects, and promoting only proven reusable patterns into templates, skills, or shared modules.
- **Promotion pipeline:** `Observed lesson → Generalizable pattern candidate → Reproduced in another project → Validated pattern → Repeatable procedure with defined inputs/outputs/checks → Skill candidate → Evaluation → Promoted reusable skill`.
- **Layer separation:** keep project knowledge, lessons, patterns, templates, agent skills, and reusable executable modules distinct. A project-specific fact must not be treated as a universal skill.
- **Promotion rule:** a one-off lesson is not enough. Promotion requires clear preconditions, boundaries, portability, evidence from another context, and success/failure checks where practical.
- **Context rule:** reusable skills should stay small and task-scoped. Canonical project truth remains in project/repository documents; reusable skills reference that truth rather than duplicating it.
- **Sentinel relationship:** Sentinel remains authoritative for scope, change classification, evidence, review, and human gates. Reusable patterns/skills are subordinate capabilities, not a second governance authority.
- **Cross-project intent:** patterns may be learned from MaisogLabs, ClinicFlow, PUSAKAL, n8n workflows, websites, bots, and later projects, but reuse must preserve each target project's own constraints.
- **Initial candidate areas:** repository grounding; change classification; bounded Builder handoff; independent diff review; source-of-truth checks; dependency-order validation; current-vs-proposed claim checks; draft/published boundary review; webhook recovery/idempotency; structured-output normalization; evidence classification.
- **Planning-only boundary:** this records direction only. It does not authorize creation of a pattern library, skill files, runtime loaders, Sentinel-core changes, S3 work, project onboarding, application implementation, CI, deployment, or protected/main merge.
- **Future governance:** any implementation of this system must first be classified under the active Sentinel change policy and follow the required stronger path if it affects Sentinel capabilities or architecture.
- **Evidence:** Paulo explicitly said `okay put that into record` after reviewing the cross-project learning and skill-promotion model.


### D-023 — Authorize WEB-INC-001 authentication-boundary implementation

- **Decided by:** Paulo (Product / Risk Owner), after the Product Build Pack closed and after the Architect classified/reviewed the next dependency-ordered increment through `ML-DEVOS-RFC-002` and `ML-DEVOS-AS-011`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-001 — Admin authentication boundary`** exactly within the accepted scope of `ML-DEVOS-RFC-002`, subject to every binding constraint in `ML-DEVOS-AS-011`.
- **Change class:** `ARCHITECTURE` — the increment introduces the first server-executed request boundary and a new authentication trust boundary into the currently asset-only MaisogLabs website deployment.
- **Authorized repository implementation scope:**
  - add a bounded Worker entrypoint/auth helper for protected admin paths;
  - update `wrangler.jsonc` for a Worker script + Assets binding + selective Worker-first routing for `/admin` and `/admin/*` only;
  - add a minimal static `/admin` placeholder/shell solely to exercise the auth boundary;
  - add only the dependency/dependencies actually required for maintained JWT verification and deterministic tests;
  - add focused authentication/security tests;
  - update architecture/product-tech/risk/test traceability only where needed to record what was actually implemented;
  - update normal Builder handoff/state records.
- **Required authentication behavior:** protected admin paths fail closed unless the Worker server-side validates the Cloudflare Access assertion for the expected issuer/team and application audience. Missing, malformed, expired, untrusted, or wrong-audience assertions must not receive the admin asset.
- **Required evidence before Architect approval:**
  - exact Builder diff;
  - build succeeds;
  - missing-token rejection;
  - malformed-token rejection;
  - expired-token rejection;
  - wrong-audience rejection;
  - correctly signed deterministic test-token acceptance;
  - ordinary public routes remain asset-first / unaffected by the protected-path middleware;
  - no production secret, private key, administrator identity, or real Access credential is committed.
- **Test constraint:** local/deterministic auth tests must use test keys/JWKS and test issuer/audience values; they must not depend on production Cloudflare identity configuration.
- **Builder boundary:** Claude implements. Architect does not implement the product/runtime change and must independently inspect the exact commit and reproduce deterministic auth tests where practical before issuing a verdict.
- **External Cloudflare boundary:** this decision does **not** authorize creating/modifying a production Cloudflare Access application, Access policy, identity-provider setting, secret, custom-domain production route, or any other live Cloudflare security resource. A real Access configuration change requires a separate concrete Decision Packet and explicit Paulo authorization.
- **Explicitly not authorized:** `WEB-INC-005` or any later `WEB-INC-*`; D1; R2; protected editorial reads; admin dashboard data; project/journal CRUD; content mutation; audit-log persistence; theme/design controls; S3 or later Sentinel phases; project onboarding; product `.devos/` overlay; CI/workflows; GitHub rulesets/branch protection; production deployment; protected/main merge.
- **Deployment gate:** `DEPLOY_AUTHORIZED: NO`.
- **Main-merge gate:** `MAIN_MERGE_AUTHORIZED: NO`.
- **Review rule:** after Builder handoff, the Architect must pull the live branch/state and compare the exact implementation diff against `ML-DEVOS-RFC-002`, `ML-DEVOS-AS-011`, this decision, and the verified Product Build Pack before issuing PASS / CHANGES_REQUESTED.
- **Evidence of Paulo authority:** Paulo explicitly instructed, `Proceed with authorizations`, after the Product Build Pack closed with the live state requiring a new Paulo decision before implementation. This decision applies that instruction to the next dependency-ordered increment only; it is not blanket authorization for later increments.


### D-024 — Authorize WEB-INC-005 D1 revision-substrate implementation

- **Decided by:** Paulo (Product / Risk Owner), after `WEB-INC-001` closed and after the Architect classified/reviewed the next dependency-ordered increment through `ML-DEVOS-RFC-003` and `ML-DEVOS-AS-013`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-005 — Current-content storage/revision substrate + migration`** exactly within the accepted scope of `ML-DEVOS-RFC-003`, subject to every binding constraint in `ML-DEVOS-AS-013`.
- **Change class:** `ARCHITECTURE` — the increment introduces D1 as the first persistent product data subsystem and creates the revision/pointer architecture that later protected reads and mutations depend on, while explicitly evolving D-007's governed content-boundary decision.
- **Authorized repository implementation scope:**
  - add only the 14 WEB-INC-005-owned logical entity/revision tables defined by RFC-003 and the Product Build Pack;
  - add migration SQL and local-only D1 configuration/tooling;
  - add deterministic current-content seed/migration tooling;
  - add bounded server-side D1 data-access/projection modules;
  - add D1 migration/parity/integrity/state-isolation tests;
  - update architecture/data/product/governance/test documentation only to record what actually became implemented;
  - update normal Builder handoff/state records.
- **Staged-migration rule:** `data/site.js → schema.mjs → public.mjs → local.mjs → app/page.js` remains the authoritative public build path during this increment. D1 is introduced in parallel and must prove parity. No public-read cutover, deletion, or retirement of `data/site.js` is authorized.
- **Authorized table set only:** `site_settings`, `site_settings_revisions`, `navigation`, `navigation_revisions`, `foundations`, `foundation_revisions`, `projects`, `project_revisions`, `services`, `service_revisions`, `process_steps`, `process_step_revisions`, `sections`, `section_revisions`.
- **Explicitly excluded tables/capabilities:** no `audit_log`; no media/project_media; no journal tables; no theme tables; no admin identity/session table; no admin dashboard; no HTTP editorial-read route; no CRUD/publish/unpublish API.
- **Data-model constraints:** base rows remain identity + immutable creation metadata + revision pointers only; project slug is immutable identity metadata; editable/public-affecting values live on revision rows; lifecycle is pointer-derived; a published/draft pointer must not successfully reference another entity's revision.
- **Migration/provenance rule:** imported current content uses deterministic textual migration provenance (for example `migration:web-inc-005`) rather than inventing a persistent identity table. Existing migration provenance must not later be silently rewritten.
- **Required migration behavior:** published, draft, and archived source states map to the pointer model exactly as specified; sections `home`, `projects`, `process`, and `about` are bootstrapped as published/visible current-site section revisions; `main-content` is not a managed section.
- **Required repeat-run behavior:** migration/seed execution must be deterministic and must not silently duplicate revisions or corrupt pointers. The chosen no-op/upsert/refusal strategy must be documented and tested on a second run.
- **Required parity evidence:** the D1 reconstructed published current-content projection must deep-equal the current `projectPublishedContent(siteContent)` result, including all current domains such as `services`; the extra sections substrate is verified separately and must not be injected into the legacy parity projection.
- **Required negative/integrity evidence:** draft isolation, archived preservation with null pointers, published pointer mapping, draft reorder not changing published order, cross-entity pointer rejection, project slug uniqueness/reserved-slug enforcement, revision-number uniqueness, and foreign-key/integrity behavior.
- **Builder boundary:** Claude implements. Architect does not implement the product/runtime change and must independently inspect the exact commit, migration SQL, table inventory, data-access code, and test/evidence outputs before issuing a verdict.
- **Local-only D1 authority:** local Wrangler/D1 simulation, local migration apply, local seed, and local query/testing are authorized. Every D1 command used as implementation evidence must be local-only.
- **Remote Cloudflare boundary:** this decision does **not** authorize `wrangler d1 create`, remote D1 migration/query/import/export, a real production D1 database ID, remote binding mutation, production Cloudflare Access changes, or any other live Cloudflare resource change.
- **Explicitly not authorized:** `WEB-INC-002` or any later `WEB-INC-*`; public D1 cutover; content mutation; D1-backed public rendering; R2; deployment; protected/main merge; Sentinel S3 or later; CI/workflows; GitHub rulesets; project onboarding/product `.devos/`.
- **Remote-D1 gate:** `REMOTE_D1_AUTHORIZED: NO`.
- **Deployment gate:** `DEPLOY_AUTHORIZED: NO`.
- **Main-merge gate:** `MAIN_MERGE_AUTHORIZED: NO`.
- **Review rule:** after Builder handoff, the Architect must pull the live branch/state and compare the exact implementation diff against `ML-DEVOS-RFC-003`, `ML-DEVOS-AS-013`, this decision, D-007, and the verified Product Build Pack before issuing PASS / CHANGES_REQUESTED.
- **Evidence of Paulo authority:** Paulo explicitly instructed, `Proceed with WEB-INC-005 authorization.`, after `WEB-INC-001` closed and the live state required a new Paulo decision. This decision applies only to WEB-INC-005 and is not blanket authorization for later increments or remote Cloudflare operations.


### D-025 — Authorize WEB-INC-002 protected read-only admin dashboard implementation

- **Decided by:** Paulo (Product / Risk Owner), after `WEB-INC-005` closed and after the Architect classified/reviewed the next dependency-ordered increment through `ML-DEVOS-RFC-004` and `ML-DEVOS-AS-015`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-002 — Secure authenticated read-only dashboard`** exactly within the accepted scope of `ML-DEVOS-RFC-004`, subject to every binding constraint in `ML-DEVOS-AS-015`.
- **Change class:** `ARCHITECTURE` — this increment creates the first authenticated HTTP composition from the accepted WEB-INC-001 Access/JWT trust boundary into the accepted WEB-INC-005 D1 subsystem and defines the protected editorial-read contract.
- **Authorized protected endpoint:** exactly `GET /admin/api/dashboard`. No other editorial data endpoint is authorized.
- **Authentication ordering:** all protected routing/data access remains subordinate to WEB-INC-001. Required order: `VALIDATE AUTH CONFIG → VERIFY ACCESS ASSERTION → ROUTE/METHOD DISPATCH → D1 READ`. Invalid auth/config must cause zero dashboard-handler/D1 invocation.
- **Authorized data scope:** bounded status projection for current-content domains only — `site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, `sections`.
- **Authorized response fields:** stable ID; project slug where applicable; derived pointer state (`published`, `draft`, `published_with_draft`, `archived`); published/draft revision IDs; bounded display label; sections-only order/visibility summary. The serializer must be allowlist-based.
- **Explicitly excluded response data:** full content copy, email addresses, raw revision rows, migration provenance/`created_by`, Access/JWT claims, SQL/schema internals, and any non-allowlisted field.
- **Read-only rule:** no `INSERT`, `UPDATE`, `DELETE`, `REPLACE`, DDL, migration execution, arbitrary SQL, or storage mutation may be reachable from the dashboard path. Non-GET methods must fail with `405` after valid authentication and without dashboard D1 invocation.
- **UI scope:** upgrade the authenticated `/admin` placeholder into a read-only dashboard shell showing bounded lifecycle/status information only. No create/edit/save/delete/publish/unpublish/upload/theme/journal/audit mutation control is authorized.
- **Error/cache rules:** protected responses must be `Cache-Control: no-store`; dashboard JSON must use explicit JSON content type and `X-Content-Type-Options: nosniff`; missing DB after valid auth → generic `503`; D1 read failure after valid auth → generic `500`; authenticated unknown `/admin/api/*` → protected `404`; no raw internal error leakage and no permissive CORS.
- **Identity boundary:** reuse WEB-INC-001 per-request JWT verification only. No application session cookie, persistent identity/session table, user/admin table, role/permission table, claim display, or browser storage of identity claims is authorized.
- **Schema boundary:** the accepted 14-table WEB-INC-005 schema remains unchanged. If Builder believes a schema change is required, Builder must stop and return for Architect review rather than expanding scope.
- **Public-site boundary:** `data/site.js → schema.mjs → public.mjs → local.mjs → app/page.js` remains the public content path. No public D1 cutover or retirement of `data/site.js` is authorized.
- **Local-only D1 authority:** local Wrangler/D1 use and local seeded dashboard smoke tests are authorized. No remote D1 creation/query/migration/import/export, real `database_id`, or `remote: true` binding is authorized.
- **Builder boundary:** Claude implements. Architect must independently inspect the exact implementation diff, authentication ordering, route/method dispatch, allowlisted serializer, D1 query shape, UI/client imports, cache/error handling, and scope before issuing a verdict.
- **Required evidence:** all acceptance evidence enumerated in `ML-DEVOS-AS-015` `AS15-F015`, including auth-negative zero-D1 invocation, bounded serializer leakage tests, lifecycle fixtures, method rejection, protected 404/500/503 behavior, no-store/nosniff, no mutation controls/client D1 imports, existing test suites, build, local-only Wrangler smoke, dry-run/config validation, secret scan, and exact changed-file provenance.
- **Explicitly not authorized:** `WEB-INC-008` or any later `WEB-INC-*`; audit substrate; content mutation; project CRUD; publish/unpublish; media/R2; journal; theme/design controls; persistent sessions/identity/roles; arbitrary/raw draft export; public D1 cutover; production Cloudflare Access configuration; deployment; protected/main merge; Sentinel S3 or later; CI/workflows/rulesets; project onboarding/product `.devos/`.
- **Remote-D1 gate:** `REMOTE_D1_AUTHORIZED: NO`.
- **Mutation gate:** `MUTATION_AUTHORIZED: NO`.
- **Deployment gate:** `DEPLOY_AUTHORIZED: NO`.
- **Main-merge gate:** `MAIN_MERGE_AUTHORIZED: NO`.
- **Review rule:** after Builder handoff, the Architect must pull live branch/state and compare the exact implementation diff against `ML-DEVOS-RFC-004`, `ML-DEVOS-AS-015`, this decision, WEB-INC-001 accepted auth behavior, `ML-DEVOS-ADR-003`, and the verified Product Build Pack before PASS / CHANGES_REQUESTED.
- **Evidence of Paulo authority:** Paulo explicitly instructed, `Proceed with WEB-INC-002 authorization.`, after WEB-INC-005 was closed and the live state required a new Paulo decision. This decision applies only to WEB-INC-002 and is not blanket authority for writes, later increments, remote Cloudflare resources, deployment, or main merge.


### D-026 — Authorize WEB-INC-008 append-only audit substrate implementation

- **Decided by:** Paulo (Product / Risk Owner), after WEB-INC-002 closed and after the Architect grounded/classified/reviewed the next dependency-ordered increment through `ML-DEVOS-RFC-005` and `ML-DEVOS-AS-017`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-008 — Append-Only Audit Substrate`** exactly within `ML-DEVOS-RFC-005`, subject to every binding constraint `AS17-F001` through `AS17-F017` in `ML-DEVOS-AS-017`.
- **Change class:** `ARCHITECTURE` — grounded elevation from the Product Build Pack's tentative `CAPABILITY` classification because this increment expands the accepted product schema from 14 to 15 tables, introduces the first persistent application-side D1 write primitive, establishes append-only history semantics, and evolves the storage architecture recorded by ADR-003.
- **Authorized schema change:** add exactly one product table, `audit_log`, via a new ordered migration such as `migrations/0002_web_inc_008_audit_log.sql`. `migrations/0001_web_inc_005_init.sql` must remain unchanged.
- **Authorized audit primitive:** a bounded server-only append operation such as `appendAuditEvent(db, event)`, with fixed SQL, complete validation, server-owned timestamp, and propagated storage failure.
- **Append-only invariant:** no application update/delete helper for audit rows; direct database UPDATE and DELETE against `audit_log` must be rejected by a database-level control such as triggers or an equivalently strong mechanism.
- **Authorized audit fields:** immutable DB ID; server-owned `occurred_at`; opaque trusted-server `actor`; validated `action`; validated `entity_type`; `entity_id`; nullable `revision_id`; `result` exactly `success` or `failure`.
- **Sensitive-data prohibition:** do not persist JWTs, Access assertion tokens, credentials, secrets, raw request bodies, full content snapshots, raw stack traces, SQL error strings, or arbitrary metadata blobs.
- **Failure semantics:** a future/business operation represented as failed must persist `result: failure`. If the audit INSERT itself fails, the audit writer must reject/throw and must not report success; no recursive self-auditing requirement exists.
- **Identity boundary:** `actor` is an opaque trusted-server reference only. No persistent application session, admin/user table, role/permission table, browser identity storage, or final editorial identity-binding mechanism is authorized.
- **WEB-INC-002 boundary:** do not alter the current read-only dashboard contract, add audit history to `GET /admin/api/dashboard`, create an audit API/UI, or add any new admin API route.
- **Local-only authority:** local D1 migrations/tests and local Wrangler simulation are authorized for this increment only.
- **Audit-write gate:** `AUDIT_APPEND_AUTHORIZED: YES` for this bounded WEB-INC-008 implementation only.
- **Editorial mutation gate:** `MUTATION_AUTHORIZED: NO`. No project/content create/edit/save/delete/publish/unpublish or other editorial mutation is authorized.
- **Explicitly not authorized:** `WEB-INC-003` or any later `WEB-INC-*`; remote/production D1 creation/query/migration/import/export; real `database_id`; `remote: true`; production Cloudflare Access changes; public D1 cutover; media/R2; journal; theme/design mutation; deployment; protected/main merge; Sentinel S3+; CI/workflows/rulesets.
- **Review rule:** after Builder handoff, the Architect must live-check the branch/state and independently inspect the exact implementation diff against `ML-DEVOS-RFC-005`, `ML-DEVOS-AS-017`, this decision, ADR-003/ADR-004, the accepted WEB-INC-001/005/002 behavior, and the verified Product Build Pack before PASS / CHANGES_REQUESTED.
- **Post-review requirement:** because this is `ARCHITECTURE`, accepted implementation requires a post-review ADR before cycle closure.
- **Evidence of Paulo authority:** Paulo explicitly instructed: `Proceed with WEB-INC-008 authorization. Authorize Claude to implement WEB-INC-008 — Append-Only Audit Substrate exactly within ML-DEVOS-RFC-005 and all binding constraints in ML-DEVOS-AS-017. No editorial/content mutation, WEB-INC-003, remote D1, deployment, public D1 cutover, or protected/main merge is authorized.`


### D-027 — Authorize WEB-INC-003 project mutation capability implementation

- **Decided by:** Paulo (Product / Risk Owner), after WEB-INC-008 closed and after the Architect grounded/classified/reviewed the next dependency-ordered increment through `ML-DEVOS-RFC-006` and `ML-DEVOS-AS-020`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-003 — Project Mutation Capability`** exactly within `ML-DEVOS-RFC-006`, subject to every binding constraint `AS20-F001` through `AS20-F020` in `ML-DEVOS-AS-020`.
- **Change class:** `CAPABILITY` — a new sensitive authenticated editorial write capability composed from already accepted auth, revision-storage, read-dashboard, and audit architectures.
- **Authorized mutation scope:** projects only — create draft, replace/edit draft by creating a new immutable revision, protected draft preview, publish, and unpublish.
- **Authorized protected routes only:**
  - `POST /admin/api/projects`
  - `PUT /admin/api/projects/:id/draft`
  - `GET /admin/api/projects/:id/preview`
  - `POST /admin/api/projects/:id/publish`
  - `POST /admin/api/projects/:id/unpublish`
- **Mutation identity requirement:** valid Cloudflare Access authentication plus a bounded non-empty verified Access `sub`; service-token-style empty-sub identity is not mutation-authorized.
- **Request-hardening requirement:** mutating requests must be same-origin, JSON, body-size bounded, no permissive CORS, and protected responses remain no-store/nosniff.
- **Immutable revision requirement:** editing creates a new `project_revisions` row; no existing revision content row may be updated in place; slug is immutable after creation.
- **Concurrency requirement:** existing-project mutation requests must carry expected published/draft pointer state; stale state must fail with bounded `409` and no mutation.
- **Publish requirement:** fully revalidate persisted draft; atomically promote exact draft to published, clear draft pointer, preserve history, and append exactly one `project_publish / success` audit event.
- **Unpublish requirement:** atomically clear published pointer, preserve revision history and any separate draft pointer, and append exactly one `project_unpublish / success` audit event.
- **Atomicity requirement:** every successful state-changing mutation and its success audit event must commit as one local D1 transaction/batch; forced audit failure must prevent business-state commit.
- **Revision-ID stop condition:** Builder must not rely on undocumented/race-prone revision-ID allocation or modify schema to satisfy atomicity. If the current integer-autoincrement schema cannot safely support the required atomic semantics using documented local D1 behavior, Builder must stop and return to Architect.
- **Failure-audit semantics:** bounded authenticated business failures should append `result: failure` when audit storage remains available; storage failure must never produce a success response.
- **Audit allowlist:** only `project_create_draft`, `project_update_draft`, `project_publish`, `project_unpublish` for entity type `project`.
- **Schema gate:** exactly 15 product tables remain; no migration/schema change is authorized.
- **Public-source invariant:** `D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE`; public rendering remains on `data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js`.
- **Local-only authority:** local D1 mutation tests, local Worker/Wrangler simulation, local route/rollback tests, build/test/dry-run only.
- **Mutation gate:** `MUTATION_AUTHORIZED: YES` for this exact WEB-INC-003 project mutation capability only.
- **Audit gate:** audit append is authorized only as required inside this exact WEB-INC-003 mutation implementation; it does not grant generic audit-write authority.
- **Explicitly not authorized:** project delete; slug rename; mutation of any other content domain; schema changes; media/R2; journal; theme/design; persistent session/role database; audit UI/API; remote/production D1; production Cloudflare Access changes; public D1 cutover; deployment; protected/main merge; later WEB-INC work; Sentinel S3+; CI/workflows/rulesets.
- **Review rule:** after Builder handoff, the Architect must live-check the branch and independently inspect the exact implementation diff against `ML-DEVOS-RFC-006`, `ML-DEVOS-AS-020`, this decision, ADR-003/004/005, and accepted WEB-INC-001/005/002/008 behavior before PASS / CHANGES_REQUESTED.
- **Evidence of Paulo authority:** Paulo explicitly instructed: `Proceed with WEB-INC-003 implementation authorization. Authorize Claude to implement WEB-INC-003 — Project Mutation Capability exactly within ML-DEVOS-RFC-006 and every binding constraint in ML-DEVOS-AS-020. Authorize only the bounded local/repository project create-draft, edit-draft, protected preview, publish, and unpublish capability. No project delete, schema change, other content-domain mutation, media/R2, journal, theme/design controls, remote D1, public D1 cutover, production deployment, protected/main merge, later WEB-INC work, or Sentinel S3+ is authorized.`


### D-028 — Activate Sentinel risk escalation rules and v1.5.0 governance-capability update

- **Decided by:** Paulo (Product / Risk Owner), after the broad 2026 governance review and `ML-DEVOS-RFC-008` / `ML-DEVOS-AS-024`.
- **Decision:** Save, record, and implement the good governance changes now while keeping the larger unimplemented Sentinel plan explicitly on record.
- **Authorized rules:** activate exactly:
  - `CORE-019 — Remote Resource Authority Must Be Explicitly Scoped`
  - `CORE-020 — Evidence Sufficiency Escalates With Consequence`
  - `CORE-021 — First Protected-Main / Production Operation Triggers Technical-Protection Review`
- **Version decision:** apply the backwards-compatible governance-capability transition `v1.4.0 → v1.5.0`.
- **Frozen architecture:** `ML-DEVOS-ARCH-001 / v1.2.0` remains unchanged.
- **No constitutional change:** actor authority, source-of-truth precedence, `CAPABILITY != AUTHORITY`, Builder self-certification prohibition, and Paulo's final authority remain unchanged.
- **Explicitly unimplemented / not authorized:** S3 Typed Task Contracts; S4 State Machine Kernel; S5 Capability & Permission Gateway; S6 isolated execution; S7 Evidence & QA Plane; S8 Orchestrator; S9 executable Evidence Gate; S10 full GitHub Enforcement; S11 Memory & Observability; S12–S14; CI workflows; GitHub rulesets; Policy/Task Engine; capability broker; automated credential issuance/revocation; telemetry pipeline.
- **WEB-INC-004 separation:** this governance change does not authorize WEB-INC-004 implementation and must not widen any R2/D1/deploy/main-merge gate.
- **Evidence of Paulo authority:** Paulo instructed: `Save, record and implement good changes to now keep unplemneted plan on the records.`


### D-029 — Authorize WEB-INC-004 local media subsystem implementation

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-RFC-007` and `ML-DEVOS-AS-023`, under Sentinel governance-capability baseline `v1.5.0`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-004 — Local Media Subsystem`** exactly within RFC-007 and every binding finding `AS23-F001` through `AS23-F018`.
- **Authorized implementation scope:**
  - add `media` and `project_media` only;
  - add ordered migration `migrations/0003_web_inc_004_media.sql` only;
  - use locally simulated R2 only;
  - add `POST /admin/api/media` validated upload;
  - add `GET /admin/api/media` protected metadata list;
  - extend existing project create/edit with optional complete media snapshots for the new revision;
  - preserve inheritance when media selection is omitted on edit;
  - extend exact-draft preview with bounded media metadata;
  - add required audit integration and local tests.
- **Upload constraints:** JPEG/PNG/WebP only; SVG/arbitrary files/archives/remote URL import forbidden; 5 MiB actual-byte limit; declared type must match validated file signature; server generates media ID and storage key.
- **Immutability:** media public-affecting fields and existing `project_media` rows are immutable after creation; replacement means new media/new revision snapshot, never in-place public-affecting mutation.
- **Cross-store consistency:** local R2 write precedes D1 media-row + success-audit batch; D1 failure after object write must attempt compensating object deletion; no success response or success audit on failure.
- **Project atomicity:** new project revision + project_media snapshot + draft pointer transition + existing project success audit must remain one D1 atomic batch; WEB-INC-003 stale-write guard remains binding.
- **Schema target:** exactly 17 product tables; migrations 0001/0002 remain byte-identical.
- **Local-only authority:** local D1/R2/Wrangler simulation, tests, build, config/dry-run/secret checks only.
- **Authorized gates:** `MEDIA_MUTATION_AUTHORIZED: YES`, `MUTATION_AUTHORIZED: YES` only as required for this exact media/project-revision integration, and `AUDIT_APPEND_AUTHORIZED: YES` only for this exact implementation.
- **Explicitly not authorized:** real/remote R2; `remote: true`; remote D1; public bucket/custom domain; public media route; D1/R2 public cutover; media delete/update endpoint; journal/journal_media; theme/design; production Access changes; deployment; protected/main merge; later WEB-INC; Sentinel S3+; CI/rulesets/Task Engine/Capability Gateway/Orchestrator.
- **CORE-019 note:** local R2 simulation does not activate the real remote-resource gate because it cannot touch a real remote resource.
- **CORE-020 evidence note:** Builder runtime evidence remains `ACTOR_REPORTED`; Architect must independently inspect the exact diff and required evidence before acceptance.
- **Evidence of Paulo authority:** Paulo instructed: `Okay let’s keep that on record and let’s proceed with the build keep Only the goods ones.`


### D-030 — Authorize queued UI-PATCH-001 soft geometry pass

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision:** Authorize `UI-PATCH-001 — Soft Geometry Pass` as the next presentation-only product patch after WEB-INC-004 closes.
- **Intent:** keep the approved V3 cinematic composition but make the interface softer, calmer, more premium, and less sharp/HUD-like.
- **Primary implementation surface:** `app/globals.css`; minimal component/class-name edits only if strictly necessary.
- **Authorized visual changes:** softer corner-radius hierarchy, rounder CTAs, gentler panel borders/shadows, more breathing room, softer dividers/frames, restrained motion and typography-spacing adjustments.
- **Preserve:** orbital identity, cinematic background, public content/data source, responsive hierarchy, reduced-motion behavior, current routing and composition.
- **Explicitly not authorized:** WEB-INC-007 theme system, theme tables, admin design controls, free-form CSS/JS, content rewrite, logo redesign, route/API/auth/data/Worker/D1/R2 changes, dependency changes, remote resources, deployment, or protected/main merge.
- **Sequencing rule:** this patch is authorized now but must not begin until WEB-INC-004 remediation is Architect-accepted and that cycle is closed. `coordination/STATE.md` remains authoritative for the active turn.
- **Implementation brief:** `docs/product/UI_PATCH_001_SOFT_GEOMETRY.md`.
- **Evidence of Paulo authority:** Paulo instructed: `Okay proceed` after approving the softer design direction.


### D-031 — Authorize WEB-INC-006 local Journal implementation

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-RFC-009` and `ML-DEVOS-AS-028`, under Sentinel governance-capability baseline `v1.5.0`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-006 — Local Journal Subsystem`** exactly within RFC-009 and AS28-F001 through AS28-F016.
- **Authorized schema:** add exactly `journal_entries`, `journal_entry_revisions`, and `journal_media` via `migrations/0004_web_inc_006_journal.sql`; target exactly 20 product tables; migrations 0001–0003 remain byte-identical.
- **Authorized admin lifecycle:** create draft, edit draft, preview, publish, unpublish only; no delete, generic mutation, or slug rename.
- **Authorized public read boundary:** GET-only `/api/journal` and `/api/journal/:slug`, published-pointer-only, plus a static `/journal` shell. No other public Worker-first route is authorized.
- **Body format:** escaped/plain text only for this increment; no Markdown/HTML/rich-text execution.
- **Media:** revision-scoped `journal_media` snapshots referencing active existing media only; no public media-object serving.
- **Audit:** add only `journal_create_draft`, `journal_edit_draft`, `journal_publish`, `journal_unpublish`.
- **Local-only authority:** D1/R2 local simulation, repository changes, tests, build, local Wrangler smoke, dry-run/config checks.
- **Explicitly not authorized:** remote D1/R2, production resource provisioning, public R2 object routes, homepage/project D1 cutover, deployment, protected/main merge, WEB-INC-007, Sentinel S3+, CI/rulesets/Capability Gateway/Task Engine/Orchestrator.
- **Evidence class:** Builder test/runtime claims remain `ACTOR_REPORTED` until independent Architect review.
- **Evidence of Paulo authority:** Paulo explicitly replied `Authorized` twice while WEB-INC-006 Journal was identified as the next active increment.


### D-032 — Authorize WEB-INC-007 Theme / Design Controls implementation

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-RFC-010` and `ML-DEVOS-AS-030`, under Sentinel governance-capability baseline `v1.5.0`.
- **Decision:** Authorize Claude / Builder to implement **`WEB-INC-007 — Theme / Design Controls`** exactly within RFC-010 and AS30-F001 through AS30-F016.
- **Authorized schema:** add exactly `theme_settings` and `theme_settings_revisions` via `migrations/0005_web_inc_007_theme.sql`; target exactly 22 product tables; migrations 0001–0004 remain byte-identical.
- **Authorized section controls:** reuse existing `sections`/`section_revisions` for visibility/order of exactly `home`, `projects`, `process`, `about`.
- **Authorized admin design routes:** bounded design status, preview, theme draft edit/publish, fixed-section draft edit/publish only.
- **Authorized public read boundary:** exactly GET-only `/api/design`, published-only, positive allowlist, fail-safe to the static V3 + UI-PATCH-001 baseline.
- **Authorized public runtime:** fixed mappings/data attributes/bounded numeric CSS variables only; no server-provided CSS/JS/HTML execution.
- **Design input boundary:** fixed enums/presets and bounded integer ranges only. No arbitrary CSS, JS, HTML, color strings, font/image URLs, selectors, class names, custom-property names, R2 keys, or uploaded hero-object serving.
- **Admin UI:** a bounded authenticated design-control UI may be added using selects/toggles/range controls and explicit Save Draft / Preview / Publish feedback.
- **Audit:** only `theme_edit_draft`, `theme_publish`, `section_design_edit_draft`, `section_design_publish`.
- **Local-only authority:** D1/R2 local simulation, repository changes, tests, build, local Wrangler smoke, visual evidence, dry-run/config checks.
- **Explicitly not authorized:** remote D1/R2, production resource provisioning, public R2 object serving, arbitrary visual-code editor, general CMS expansion, homepage/project D1 content cutover, SSR conversion, deployment, protected/main merge, Sentinel S3+, CI/rulesets/Capability Gateway/Task Engine/Orchestrator.
- **Evidence class:** Builder test/runtime/CLI/visual claims remain `ACTOR_REPORTED` until independent Architect review.
- **Evidence of Paulo authority:** Paulo instructed `Okay proceed` after WEB-INC-006 closure/document reconciliation, with WEB-INC-007 identified as the sole remaining core increment.


### D-033 — Require screenshot-reference design workflow for WEB-INC-007

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision:** WEB-INC-007 must support a reference-driven design workflow in which Paulo can upload a UI screenshot to ChatGPT, the Architect converts it into a structured bounded design plan, and Claude applies the plan through the authenticated MaisogLabs design controls/APIs.
- **Required flow:** `REFERENCE → ARCHITECT ANALYSIS → CONTROL MAPPING → DRAFT → PREVIEW → PAULO REVIEW → PUBLISH`.
- **Architect responsibility:** classify requested visual traits as `DIRECT MATCH`, `APPROXIMATION`, or `GAP` against the approved WEB-INC-007 control vocabulary.
- **Builder/application responsibility:** apply only mapped approved controls; never bypass the admin/control layer with direct SQL, arbitrary CSS/JS/HTML, or silent source-code edits.
- **Runtime architecture:** no embedded LLM/image-analysis service is required inside MaisogLabs. Screenshot analysis remains external/Architect-side; MaisogLabs stores only validated design settings.
- **Gap rule:** if a reference requires a capability outside WEB-INC-007, stop at preview/analysis and propose a separate bounded design change.
- **Third-party hygiene:** references may inspire layout/spacing/hierarchy/style relationships, but third-party logos, proprietary copy, unique illustrations, photography, or trademark identity are not to be copied without rights.
- **Authority unchanged:** no new table, route, remote resource, deployment, main merge, or Sentinel S3+ authority is created.
- **Evidence of Paulo authority:** Paulo stated that the system should let him upload a UI screenshot here, have ChatGPT analyze and plan it, and have Claude apply the edit through the admin portal.


### D-034 — Authorize WEB-REL-001 Production Release Readiness assessment

- **Decided by:** Paulo (Product / Risk Owner), after core WEB roadmap closure.
- **Decision:** Authorize Claude / Builder to perform the assessment-only work defined in `docs/release/WEB_REL_001_PRODUCTION_READINESS.md` and `ML-DEVOS-RFC-011`.
- **Purpose:** prepare the first governed production release decision packet after local/repository core completion.
- **Authorized work:** repository inspection, local/read-only checks, dry-run packaging checks, local migrations/smoke, release diff inventory, current-state doc reconciliation, GitHub protection/CI recommendation, exact future Cloudflare resource-scope recommendation, rollback plan, post-deploy verification plan.
- **Explicitly not authorized:** ruleset/branch-protection mutation, GitHub Actions activation, main merge/direct push, remote D1/R2, Access production config, credential creation/storage, deploy, DNS/domain change, public R2 serving, production data write, homepage/projects D1 cutover, new product feature, Sentinel S3+.
- **Evidence of Paulo authority:** Paulo instructed `Proceed` immediately after core WEB roadmap completion.


### D-035 — Adopt MaisogLabs V3 Design Governance

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision:** Adopt `brand/V3/DESIGN_GOVERNANCE.md` as the project-level design governance Local Rule for future MaisogLabs public/admin UI work.
- **Core rule:** a new feature must look like MaisogLabs before it looks like the feature it is adding.
- **Binding hierarchy:** Brand V3 identity/composition/tokens remain higher authority; DESIGN-GOV-001 governs how new UI extends them.
- **Required design layers:** foundations → reusable components → patterns → exceptions/gaps.
- **Screenshot workflow:** reference → analyze → map → draft → visual preview → review → publish. Traits are classified DIRECT MATCH / APPROXIMATION / GAP.
- **Chronicle direction:** “MaisogLabs Chronicle — Cinematic Engineering Timeline,” consistent with V3 dark/cobalt atmosphere, soft geometry, glass panels, existing typography/motion, and bounded design controls.
- **Admin direction:** admin should feel like MaisogLabs operating software—same design foundations, but optimized for clarity/density rather than full cinematic presentation.
- **No-go:** no arbitrary CSS/JS/HTML design input, no unrelated palette/type system, no silent one-off visual language, no copied third-party identity, no reduced-motion override.
- **Authority:** documentation/design-governance only; no runtime implementation, merge, deploy, remote resource, or production authority is created.
- **Evidence of Paulo authority:** Paulo explicitly instructed “okay lets do that” after reviewing the proposed design-governance direction.


### D-036 — Authorize Sentinel Traceability V1 implementation

- **Decided by:** Paulo (Product / Risk Owner), after the traceability-health review and broad external/practitioner research, with architecture bounded by `ML-DEVOS-RFC-012` and `ML-DEVOS-AS-037`.
- **Decision:** Authorize Claude / Builder to implement the repository-only Sentinel Traceability V1 graph/index + validator.
- **Purpose:** make existing governance records self-checking without creating a second manual source of truth.
- **Authorized scope:** a static traceability subsystem under `devos/governance/traceability/`, focused tests, derived JSON/Markdown indexes, and normal governance/handoff records.
- **Required behavior:** discover canonical governance IDs from existing source records; extract references; validate missing targets and duplicate canonical definitions; produce deterministic derived indexes; distinguish blocking structural errors from non-blocking warnings/legacy exceptions; report baseline findings without auto-remediation.
- **Source-of-truth rule:** generated traceability output is derived/non-authoritative and may never override frozen architecture, active governance, Decisions, ADRs, durable Architect Syncs, requirements, risks, tests, or implementation evidence.
- **Explicit boundaries:** no S3 Typed Task Contracts; no S7 Evidence Store/QA Plane; no S9 Evidence Gate; no Policy/Task Engine, Capability Gateway, Orchestrator, CI/rulesets, product runtime change, project onboarding, remote resource, deployment, protected/main merge, or automatic authority/status mutation.
- **No auto-fix authority:** discovered gaps are reported and routed into separate governed cleanup/remediation cycles; Builder may not rewrite unrelated historical records merely to satisfy the validator.
- **Version:** no Sentinel version bump is authorized during implementation. Version impact is reconsidered only after implementation review and ADR.
- **Evidence:** Paulo instructed `okay do that` after explicitly discussing the Master Traceability Index / graph + validator direction and asking to proceed.


### D-037 — Authorize S3 Typed Task Contracts after Traceability V1 closure

- **Decided by:** Paulo (Product / Risk Owner), following the frozen Sentinel roadmap and `ML-DEVOS-RFC-013` / `ML-DEVOS-AS-038`.
- **Decision:** Authorize S3 — Typed Task Contracts as the next Sentinel implementation phase, **queued behind** completion and independent closure of `SENTINEL-TRACEABILITY-V1`.
- **Authorized S3 scope once activated:** machine-readable Task Contract specification/schema; semantic validation against active evidence policy; bounded valid/invalid examples; focused tests; normal governance/handoff records.
- **Contract purpose:** describe already-authorized task scope, acceptance criteria, intended claims, and required evidence provenance. A valid Task Contract does not itself grant authority or certify success.
- **Evidence policy:** reuse the existing five provenance classes and remain compatible with `CORE-016`, `CORE-017`, `CORE-018`, and `CORE-020`.
- **Explicitly not authorized:** S4 State Machine Kernel; S5 Capability Gateway; S6 isolation; S7 Evidence/QA Plane; S8 Orchestrator; S9 Evidence Gate; S10 rulesets/CI enforcement; S11–S14; product runtime changes; project onboarding; remote/cloud resources; credentials; protected/main merge; deployment; production writes; Sentinel version bump.
- **Sequencing rule:** while `coordination/STATE.md` remains `TURN: CLAUDE` for `SENTINEL-TRACEABILITY-V1`, S3 implementation must not begin. After Traceability V1 closes, Architect may activate S3 without requiring Paulo to repeat this already-recorded phase authorization.
- **Evidence of Paulo authority:** Paulo instructed `proceed to the next phase`.


### D-038 — Reprioritize S3 behind MaisogLabs Skills Foundation V0.1 discovery

- **Decided by:** Paulo (Product / Risk Owner), after broad external research across current Agent Skills implementations, open/community conventions, security guidance, and practitioner discussion, and after confirming the live S3 implementation branch has no implementation commits beyond activation.
- **Decision:** Pause S3 — Typed Task Contracts as `PAUSED / QUEUED — AUTHORITY PRESERVED`, and make `MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY` the immediate active Sentinel initiative.
- **Reasoning:** interruption cost is effectively zero because no S3 implementation has landed; Agent Skills has matured into a cross-provider ecosystem; provider discovery paths and adapter behavior are not uniform; external/community skills expand the agent trust surface; Skills Foundation may introduce non-authoritative procedure/skill references that should be understood before S3's task-contract schema is frozen.
- **S3 authority preserved:** `ML-DEVOS-RFC-013`, `ML-DEVOS-AS-038`, and `D-037` remain valid and are neither deleted, superseded, nor weakened. No S3 implementation work is authorized while the discovery cycle is active.
- **Active discovery scope:** inspect existing reusable procedures and current provider skill conventions; create a bounded Skills Foundation discovery RFC; propose the smallest coherent initial skill set; analyze overlap; propose canonical location/provider-adapter strategy; design lightweight SKILL CHECK routing; design external-skill security and evaluation architecture; integrate with existing Sentinel traceability; report decisions requiring Paulo/Architect review.
- **Governance rule:** `GOVERNANCE > SKILLS`; current authorization outranks skill capability; `Capability != Authority`; a skill, task contract, prompt, plugin, or connected tool never grants authority on its own.
- **No implementation authority:** this decision does not authorize executable skill adapters, scripts that mutate project/runtime state, S5 Capability Gateway, product/runtime changes, remote resources, credentials, deployment, main merge, or any weakening of Sentinel governance.
- **Return gate:** discovery returns to Architect for independent review before any Skills Foundation implementation or S3 resume decision is activated.


### D-039 — Integrate Portable Knowledge Treasury discovery into Skills Foundation V0.1

- **Decided by:** Paulo (Product / Risk Owner), during `MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY` Remediation Cycle 1.
- **Decision:** Integrate the `MAISOGLABS PORTABLE KNOWLEDGE TREASURY` directive into the active Skills Foundation discovery as an architecture/discovery requirement only. Do not create a parallel governance system, chat archive, memory subsystem, or executable capture mechanism in this cycle.
- **Core principle:** AI accounts/sessions are laboratories; the governed repository is the durable treasury. ChatGPT/Claude/Codex/provider memory may support continuity but must never be the sole canonical source for important MaisogLabs knowledge.
- **Classification requirement:** valuable durable discoveries must first be classified as one of: repeatable procedure → Skill; authority/rule/boundary → Governance; architecture choice → RFC/ADR/Architecture; current project state → Brain/STATE; reusable engineering lesson → Knowledge/Principle; evidence/experiment result → Evidence/Test Ledger; public-safe realization → Journal candidate; sensitive implementation detail → private repository documentation.
- **Capture rule:** do not document every conversation. Capture only material with durable reusable value, after deduplication against existing canonical repository sources.
- **Treasury workflow to evaluate:** raw conversation/implementation experience → candidate insight → deduplicate → classify → public/private filter → choose canonical destination → governance/human approval where required → persist → add traceability where useful → future reuse.
- **Knowledge Capture status:** unresolved by design. Discovery must determine whether Knowledge Capture should be (a) a standalone Skill, (b) composition of existing Skills, or (c) another lightweight governed procedure. No option is pre-authorized for implementation.
- **Portability requirement:** the design must support insights originating from ChatGPT, Claude, Codex, implementation handoffs, Architect reviews, research, test failures, incidents, postmortems, and project journals without treating any provider export format as canonical.
- **Public/private principle:** `PUBLISH THE INSIGHT; PROTECT THE IMPLEMENTATION DETAIL.` Secrets, credentials, private endpoints, exploit-enabling security detail, sensitive infrastructure, personal/private information, and confidential implementation details must not be exposed merely because the underlying lesson is reusable.
- **Provenance direction:** where useful, durable knowledge should be able to record source type, project, date, why it matters, confidence/evidence class, canonical destination, and supersession relationships without retaining entire chats unnecessarily.
- **Compounding objective:** `BUILD → EXPERIENCE → REVIEW → CAPTURE → CLASSIFY → TEST → REUSE → IMPROVE`.
- **No implementation authority:** this decision does not authorize a giant chat archive, account-history scraping/import, a new `devos/memory`/knowledge runtime, S11 Memory & Telemetry, executable capture automation, external account access, public publishing, provider-memory synchronization, S3 implementation, remote resources, deployment, or main merge.
- **Return gate:** the revised Skills Foundation RFC/handoff must include the full treasury discovery outputs and return to Architect for review before any Skills implementation or S3 resume decision.


### D-040 — Strengthen Skills Foundation / Knowledge Treasury discovery with research-informed safeguards

- **Decided by:** Paulo (Product / Risk Owner), after a broad external review of current Agent Skills implementations, provider discovery conventions, supply-chain/security guidance, docs-as-code/ADR practice, lessons-learned systems, postmortem practice, and practitioner reports.
- **Decision:** Keep S3 paused and strengthen the active `MAISOGLABS_SKILLS_FOUNDATION_V0_1_DISCOVERY` remediation before RFC-014 is accepted. The Portable Knowledge Treasury remains part of the same discovery cycle and must be designed as a selective classification/deduplication/routing discipline rather than a giant knowledge store.
- **Treasury architecture direction:** Treasury owns the process for identifying, classifying, deduplicating, filtering, routing, and tracing durable insight. It does not become the canonical owner of governance, ADRs, Brain/STATE, Evidence, Skills, Journal, or sensitive implementation records.
- **Capture threshold:** candidate knowledge should be persisted only when it has durable reuse value, such as preventing repeated failure, changing future work, preserving non-obvious rationale, materially improving security/risk understanding, reducing future research/discovery cost, or enabling reconstruction of why the system is in its current form.
- **Candidate boundary:** `CANDIDATE INSIGHT != ACCEPTED DURABLE KNOWLEDGE`. AI inference or session conclusions are not promoted to durable truth merely because an agent stated them.
- **Two-axis classification:** discovery must separate (a) knowledge type/destination and (b) disclosure class. A reusable lesson may be public-safe while its implementation detail remains internal/restricted/secret.
- **Dedup direction:** identify the expected canonical destination first, search there and related records, then classify the outcome as `DUPLICATE`, `UPDATE`, `EVIDENCE_ONLY`, `NEW`, or `SUPERSEDES`. Avoid repository-wide undifferentiated dumping/search as the primary model.
- **Knowledge Capture direction:** current research favors a lightweight governed Treasury procedure first, not an immediate standalone Knowledge Capture Skill. A future Skill may wrap it only after the workflow is authoritative, repeatable, and evaluated. RFC-014 may recommend otherwise only with stronger repository evidence.
- **Skill-size direction:** use progressive disclosure. `SKILL.md` should carry routing/core procedure; deeper material belongs in `references/`; executable helpers only where justified; evals remain separate. Avoid instruction bloat.
- **Initial-skill direction:** the current four high-confidence procedures remain the default V0.1 candidate set unless remediation finds stronger evidence: Governance/Traceability Audit; Architect Review/Sync; Implementation Handoff; Project Orientation/State Recovery.
- **Canonical-location direction:** current ecosystem evidence strengthens `.agents/skills/` as a portability candidate, but no location is frozen by this decision. RFC-014 must complete the AS42-F003 provider-compatibility matrix and either recommend one architecture with evidence or return `PAULO DECISION REQUIRED`.
- **External-skill lifecycle:** external-skill provenance must include source/version or commit and should support `adopted_at`, `last_reviewed`, compatibility context, and revalidation triggers such as upstream update, provider/tool major change, security advisory, failed eval, or unexpected behavior. Trust is version/context-sensitive, not permanent.
- **Usefulness principle:** retained knowledge should identify where it is expected to improve future behavior when practical (skill/checklist/test/risk control/design guideline/onboarding/journal/etc.). Treasury success should be measured by reuse and avoided duplication/failure, not by number of notes/files/skills captured.
- **No implementation authority:** this decision does not authorize skill directories, Treasury implementation, transcript ingestion, account-history scraping, S11, S3 resumption, provider adapters, external-skill installation, remote resources, deployment, or main merge.
- **Return gate:** Claude must incorporate D-038, D-039, AS-042, AS-043, and this decision into the remediated RFC-014/handoff and return to Architect.


### D-041 — Change MaisogLabs repository visibility to private and revise Treasury disclosure assumptions

- **Decided / performed by:** Paulo (Product / Risk Owner).
- **Verified state:** GitHub reports `Dillaab-source/maisog-labs` with `private: true` and `visibility: private`.
- **Decision impact:** the active Skills Foundation / Portable Knowledge Treasury discovery may treat this repository as a private repository boundary for appropriate INTERNAL and RESTRICTED documentation, subject to record-specific access/sensitivity rules.
- **Important limit:** repository privacy does **not** make Git a secrets vault. Credentials, tokens, private keys, secret values, and other material that should not live in version control remain prohibited from repository persistence and must use the appropriate secret/configuration mechanism instead.
- **Historical limit:** changing visibility to private does not retroactively guarantee confidentiality for material that may have existed while the repository was public. Previously committed sensitive material, if any is discovered, must be treated as potentially exposed and handled under the appropriate incident/credential-rotation process rather than assumed safe because visibility changed.
- **RISK-WEB-013:** the visibility change materially affects its premise and makes it eligible for a separate reassessment; this decision does not silently close or rewrite that existing risk record inside the Skills discovery cycle.
- **No additional implementation authority:** no Skill implementation, Treasury automation, provider adapter, S3 resumption, deployment, remote-resource mutation, or main merge is authorized by this visibility change.


### D-042 — Accept RFC-014 and authorize Skills Foundation V0.1 + Portable Knowledge Treasury implementation

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** Paulo explicitly stated `approved proceed` after `ML-DEVOS-AS-050` returned RFC-014 as `ARCHITECT_APPROVED — PAULO DECISION REQUIRED`.
- **Architecture acceptance:** Accept `ML-DEVOS-RFC-014` as the governing architecture for MaisogLabs Skills Foundation V0.1 and the Portable Knowledge Treasury, exactly as independently accepted by `ML-DEVOS-AS-050`.
- **Canonical Skill payload:** Accept `.agents/skills/` as the canonical repository Skill location.
- **Claude Code exposure:** Authorize exactly one non-diverging Claude Code bridge under `.claude/skills/`. It must be derived from the canonical `.agents/skills/` payload by a deterministic mechanism or an equivalently non-diverging link. No provider-facing path may become a separately authored source of truth.
- **Initial V0.1 Skill set:** Authorize implementation of exactly four Skills:
  1. Governance / Traceability Audit;
  2. Architect Review / Sync;
  3. Implementation Handoff;
  4. Project Orientation / State Recovery.
- **Skill authority boundary:** Skills remain non-authoritative procedure wrappers. `GOVERNANCE > SKILLS`, `CURRENT AUTHORIZATION > SKILL CAPABILITY`, and `CAPABILITY != AUTHORITY` remain binding.
- **Treasury direction:** Accept `TREASURY = LIGHTWEIGHT GOVERNED PROCEDURE` for V0.1. Knowledge Capture is not a standalone V0.1 Skill.
- **Knowledge / Principles destination:** Authorize one lightweight canonical repository record for residual reusable engineering lessons that do not correctly belong in Governance, ADR/RFC/Architecture, Brain/STATE, Evidence/Test Ledger, Journal, or private implementation documentation. The implementation should use `brain/KNOWLEDGE_PRINCIPLES.md` unless an already-existing canonical path is discovered during Builder grounding; no new database, service, or traceability namespace is authorized.
- **Public/private handling:** Preserve `D-041`, `ML-DEVOS-AS-047`, and `ML-DEVOS-AS-048`. INTERNAL/RESTRICTED repository persistence requires accepted access controls, Git suitability, and an authorized canonical destination. SECRET/version-control-prohibited material never goes to Git.
- **RISK-WEB-013:** Do not close or rewrite it in this implementation. Queue a separate governed reassessment after this cycle; automated public/private routing remains out of scope for V0.1.
- **Implementation authorization:** Authorize Claude to implement the bounded V0.1 repository artifacts, routing/evals, deterministic Claude bridge, manual Treasury procedure, Knowledge/Principles record, focused validation/tests, and the minimum routing/orientation documentation required to make the accepted design usable.
- **No parallel S3 build:** S3 remains paused during this Builder cycle so only one implementation track is active.
- **Sequential S3 authorization:** Once this Skills/Treasury V0.1 implementation returns from Claude and is independently accepted by the Architect, the Architect may reopen the already-approved S3 Typed Task Contracts implementation under preserved `D-037` / `ML-DEVOS-AS-038` authority **without another Paulo approval**, provided no new architecture/security blocker is discovered. This is sequential authorization, not concurrent implementation.
- **Still prohibited:** S4+, S5 Capability Gateway, external-skill installation, provider account scraping/import, chat-history archive/import, S11 memory machinery, secrets/credentials in Git, remote resources, deployment, public cutover, protected/main merge, or unrelated product/runtime changes.


### D-043 — Authorize closure-drift hardening proposal and natural improvement surfacing

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** Paulo instructed: `Put this into record somewhere please proceed and future suggestions should also come out naturally` after the S3 closure discrepancy analysis and broad external validation.
- **Decision:** Preserve the S3 technical approval, do **not** close S3 yet, and authorize a narrowly scoped architecture proposal to resolve the missing reserved-subsystem lifecycle semantics before S3 closure.
- **Proposal authorized:** create `ML-DEVOS-RFC-015 — Reserved Subsystem Lifecycle and Closure Reconciliation`.
- **RFC-015 must cover only:** reserved-root lifecycle semantics needed to move an owning phase from `NOT_IMPLEMENTED` to a governance-closed implemented state; the special S2 `FOUNDATION_ACTIVE` case; fail-closed closure-evidence requirements; the meaning of `executable_runtime_present` so repository-local validators/tooling are not confused with Sentinel runtime/orchestration/enforcement; closure-preflight integration with Architect Sync; and the minimum traceability/version/ADR/manifest reconciliation required at phase closure.
- **Anti-bloat direction:** Closure Preflight is part of the existing Architect Review / Sync procedure, not a new Sentinel phase, agent, database, or standalone Skill.
- **Natural-suggestion rule:** future Architect/Builder reviews may surface non-binding improvement suggestions at natural lifecycle checkpoints (implementation review, closure, incident, repeated friction, or proven reuse opportunity). Suggestions do not become authority merely because an agent proposes them; they must be classified through the Knowledge Treasury / applicable change class and promoted only when durable value and governance requirements justify it.
- **Current S3 status:** `ML-DEVOS-AS-055` technical approval remains valid. S3 closure/version/manifest mutation remains blocked pending RFC-015 review and a later explicit closure decision.
- **No implementation authority from this decision:** do not change manifest schema/status, capability baseline, ADR numbering, RFC-013 closure status, traceability outputs, S4 state, runtime/product code, remote resources, deployment, or protected/main.
- **Return gate:** RFC-015 draft returns to Architect review before Paulo is asked to approve any manifest lifecycle implementation or S3 closure package.


### D-044 — Accept RFC-015 reserved-subsystem lifecycle and closure-reconciliation architecture

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** Paulo explicitly stated `Ok approved` after `ML-DEVOS-AS-059` returned `ARCHITECT_APPROVED — RFC-015 DESIGN ACCEPTED / PAULO DECISION REQUIRED`.
- **Decision:** Accept `ML-DEVOS-RFC-015 — Reserved Subsystem Lifecycle and Closure Reconciliation` as the approved architecture/design.
- **Accepted design:** `IMPLEMENTED` reserved-root lifecycle state; S2-only `FOUNDATION_ACTIVE`; ADR-keyed, phase-checked fail-closed `closure_ref`; behavior-based `executable_runtime_present` semantics; D.1 Pre-decision Closure Preflight; D.2 Post-decision Closure Verification; traceability generated-output currency + named-baseline + new-error delta; explicit version disposition; no invented `manifest_version` semantics; no new phase/Skill/agent/database/closure registry.
- **Preserved S3 state:** `ML-DEVOS-AS-055` technical approval remains valid. S3 closure remains blocked until RFC-015 is separately implemented, independently accepted/closed, and a later explicit S3 closure decision is made.
- **Implementation authority:** **NOT GRANTED by this decision.** A separate Paulo implementation authorization is required before mutation of the manifest schema, manifest validator, Architect Sync procedure, or focused tests.
- **Version authority:** no Sentinel capability-baseline transition is authorized by this decision.
- **S4:** remains wholly unauthorized.
- **Still prohibited:** RFC-015 implementation, manifest/schema/validator mutation, Architect Sync procedure mutation, ADR creation, Sentinel version bump, S3 closure, RFC-013 closure mutation, traceability closure regeneration, S4 proposal/implementation, core-rule mutation, product/runtime mutation, remote resources, deployment, and protected/main merge.


### D-045 — Authorize RFC-015 implementation and lock return-to-roadmap / coordinated-closure direction

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After the overall Sentinel direction review, Paulo explicitly stated: `Yes authorized put this into record and should come up in the future`.
- **Implementation authorization:** Authorize the bounded implementation of `ML-DEVOS-RFC-015 — Reserved Subsystem Lifecycle and Closure Reconciliation`, exactly as design-accepted by `ML-DEVOS-AS-059` / `D-044`.
- **Authorized implementation surfaces:** `devos/schemas/devos-manifest.schema.json`; `devos/schemas/validate-devos-manifest.mjs`; focused repository-local tests under `tests/*.test.mjs`; `brain/protocols/ARCHITECT_SYNC.md`; and only narrowly necessary documentation / coordination bookkeeping.
- **Implementation requirements:** add the descriptive `IMPLEMENTED` reserved-root status; add optional ADR-keyed `closure_ref`; enforce fail-closed `closure_ref ↔ closure_history` matching + owning-phase consistency; preserve S2-only `FOUNDATION_ACTIVE`; clarify `executable_runtime_present` by operational responsibility rather than invocation mechanism; add D.1 Pre-decision Closure Preflight and D.2 Post-decision Closure Verification to the existing Stage Gate Review; add focused tests for backwards compatibility, invalid/dangling/ambiguous/mismatched closure references, S2 foundation invariants, and no-authority semantics.
- **No manifest instance mutation yet:** this implementation cycle may evolve the schema/validator/procedure, but must not yet set `devos/contracts/` to `IMPLEMENTED`, append the S3 closure-history entry, close RFC-013, create closure ADRs, or change the active Sentinel capability baseline.
- **Roadmap bias:** RFC-015 is the last planned governance-hardening detour before returning to the original Sentinel capability roadmap. After RFC-015 implementation and the pending coordinated closure pass, the default next candidate is S4 State Machine Kernel. Further foundation/governance hardening should be triggered by a concrete defect, incident, repeated friction, security finding, or durable reuse need — not by a generic desire to make governance more complete.
- **Preferred later release boundary:** if RFC-015 implementation is independently accepted and no new blocker appears, prepare one coordinated closure/release package in which:
  - Skills Foundation V0.1 + Portable Knowledge Treasury receives an explicit no-bump ADR/disposition;
  - RFC-015 receives its own ADR;
  - S3 Typed Task Contracts receives its own ADR;
  - RFC-015 + S3 adoption are proposed together under one explicit Sentinel `v1.6.0` release boundary rather than two automatic consecutive MINOR bumps.
- **Provenance rule:** one release/version boundary may contain multiple separately reasoned architecture decisions; each retains separate ADR provenance. `one release != one ADR`.
- **Closure/version authority still withheld:** this decision does **not** itself authorize the eventual `v1.6.0` transition, S3 closure, ADR creation, manifest instance closure edits, RFC-013 closure status mutation, or S4 start. Those remain subject to the RFC-015 post-implementation Architect review and a later explicit Paulo closure decision using the D.1/D.2 closure process.
- **S3:** `ML-DEVOS-AS-055` technical approval remains preserved.
- **S4:** remains unauthorized.
- **Still prohibited:** core-rule mutation, product/runtime mutation, remote/cloud resources, credentials, deployment, production writes, protected/main merge, S4+ implementation, or unrelated governance expansion.


### D-046 — Authorize coordinated Sentinel v1.6.0 closure package

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** Paulo explicitly stated `Okay approved` after `ML-DEVOS-AS-061` returned `D.1 PRE-DECISION CLOSURE PREFLIGHT — PASS / PAULO CLOSURE DECISION REQUIRED`.
- **Decision:** Approve the bounded coordinated closure package exactly as defined by `ML-DEVOS-AS-061`.
- **Authorized closure components:**
  1. close Skills Foundation V0.1 + Portable Knowledge Treasury with its own ADR and explicit **NO SENTINEL CAPABILITY-BASELINE BUMP**, effective baseline remaining `v1.5.0`;
  2. close RFC-015 with its own ADR;
  3. close S3 Typed Task Contracts with its own ADR;
  4. adopt RFC-015 + S3 together under one explicit Sentinel `v1.5.0 → v1.6.0` release boundary;
  5. update the live DevOS manifest so `devos/contracts/` becomes `IMPLEMENTED`, carries an ADR-keyed S3 `closure_ref`, remains `executable_runtime_present: false`, and the active Sentinel capability baseline becomes `v1.6.0`;
  6. append RFC-015 and S3 closure-history entries without altering prior history;
  7. normalize RFC-013/RFC-014/RFC-015 closure status/provenance, including the D-037 implementation-authority vs D-042 sequential-reopening distinction;
  8. update `VERSIONING_POLICY.md` for the coordinated v1.6.0 release;
  9. regenerate Traceability V1 derived outputs and preserve the preflight baseline/new-error discipline;
  10. return the completed closure to Architect D.2 Post-decision Closure Verification.
- **Single release / multiple ADR rule:** this authorization deliberately uses one `v1.6.0` release boundary while preserving separate ADR provenance for Skills/Treasury, RFC-015, and S3. `one release != one ADR`.
- **ADR allocation:** no ADR number was reserved by the preflight. At the moment of closure execution, Builder must inspect the live ADR directory and allocate the next three sequential never-reused IDs. Preflight observed the ceiling at `ML-DEVOS-ADR-010`; expected IDs are therefore `011`–`013` only if no intervening ADR now exists.
- **Execution-base rule:** Builder must pull the exact post-D-046 branch HEAD before mutation, record that SHA, compare it with preflight evidence baseline `f9995565860d3f6a33ef96070ac88eb3953303ba`, and confirm that only expected preflight/decision/coordination bookkeeping differs. Any substantive unexpected drift stops the closure and returns to Architect.
- **Traceability fail-closed rule:** before mutation, rerun the traceability validator at the execution-base SHA. Expected preflight fingerprint is `CORE-022`, forward references to `ML-DEVOS-ADR-011` / `ML-DEVOS-ADR-012`, and `WEB-REQ-009` as Builder-reported at AS-061. Any unexpected difference must stop closure. After closure, regenerate JSON/Markdown derived indexes, preserve unresolved baseline findings unless independently resolved, and introduce no new unexpected ERROR.
- **Manifest baseline pointer:** for this coordinated release, the manifest's single `sentinel_capability_baseline.adr` pointer uses the ordered final adoption / release-closing S3 ADR; the separate RFC-015 ADR remains co-effective at `v1.6.0` and is preserved in closure history.
- **S4:** remains **UNAUTHORIZED**. Successful v1.6.0 closure does not itself authorize S4; S4 State Machine Kernel is only the default next proposal candidate after D.2 verification.
- **Still prohibited:** core-rule mutation, unrelated governance expansion, product/runtime mutation, remote/cloud resource changes, credentials, deployment, production writes, protected/main merge, or S4+ implementation.


### D-047 — Authorize bidirectional Sentinel agent handoff bridge and visible handoff logs

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After Sentinel v1.6.0 D.2 closure, Paulo explicitly approved completing the reverse ChatGPT → Claude event bridge before S4 and requested that handoff logs always be displayed in ChatGPT for inspection.
- **Decision:** Authorize a bounded automation-infrastructure setup that makes Builder wake-up event-driven while preserving `coordination/STATE.md` as the sole turn/authorization authority.
- **Authorized design:**
  1. GitHub push activity on `governance/maisoglabs-v0.1` may wake a Claude Code GitHub Actions runner.
  2. The runner MUST gate before Claude execution on live `TURN: CLAUDE` AND `IMPLEMENTER_ACTION_REQUIRED: YES`.
  3. If the gate is false, Claude MUST NOT run and the workflow must make no repository mutation.
  4. If the gate is true, Claude may perform only the live `AUTHORIZED_SCOPE`, must read the existing repository instructions / Architect handoff, and must obey all live prohibitions.
  5. Claude must return control through the existing `coordination/STATE.md` protocol; it must not invent authority, merge PR #10, deploy, or expand scope.
  6. Claude execution evidence must be written to the existing Implementer handoff/evidence surfaces so the ChatGPT PR #10 wake-up task can display a compact handoff log to Paulo.
  7. ChatGPT qualifying Architect handoffs must always surface a visible compact log in chat; successful handoffs are not silent.
- **Authentication rule:** Anthropic credentials must never be committed to Git. Authentication must use GitHub Actions secrets or an approved short-lived identity mechanism. Secret values must not be printed in logs.
- **Least-privilege rule:** workflow permissions and Claude tools must be bounded to the Builder role; no deployment, remote-resource, protected/main merge, secret-management, or later-phase authority is granted.
- **S4:** remains unauthorized. This bridge is infrastructure setup only and does not itself start S4.
- **Activation condition:** the reverse bridge is not considered operational until an end-to-end test proves that a real `TURN: CLAUDE` handoff wakes Claude, Claude respects the live scope, returns `TURN: ARCHITECT`, and the existing ChatGPT event task detects the return.


### D-048 — Authorize S4 State Machine Kernel proposal with audit

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** Paulo stated: `okay proceed with the build remeber audit`, following the recommendation to review the S4 proposal scope before authorizing implementation.
- **Bounded interpretation:** proceed with the next governed build step: S4 discovery/design proposal and audit. This records proposal authority only; it does not claim approval of an unwritten design or bypass the ARCHITECTURE-class review/implementation gate.
- **Prerequisites inspected:** coordinated v1.6.0 closure accepted by ML-DEVOS-AS-063; D-047 bridge activation accepted by ML-DEVOS-AS-064 at `ceebf557ab2eff79b89e080230c46e8b2921ee78`; S3 is IMPLEMENTED, S4 remains NOT_IMPLEMENTED in the live manifest.
- **Authorized Builder work:** file the next sequential RFC for S4 State Machine Kernel; define lifecycle transitions, ownership, locks/leases, retry/timeout/idempotency semantics, S3 integration, local persistence/concurrency/recovery alternatives, test plan, risks and traceability. Update only the RFC index, derived traceability indexes and Builder coordination evidence required for this proposal.
- **Architect bookkeeping:** preserve ML-DEVOS-AS-064 verbatim in its durable archive and index before replacing the rolling review; record this decision and bounded brief; reproduce the audit and regenerate derived outputs for these changes; activate the Builder turn on the governance branch.
- **Audit requirement:** exact before/after ERROR fingerprints, full validator output and exit code, generated-index currency, diff whitelist and evidence provenance. Known pre-existing missing-target errors CORE-022 and WEB-REQ-009 remain disclosed, not fabricated away. No unexpected new ERROR is acceptable.
- **Return gate:** Architect reviews the proposed design and audit before any S4 implementation authorization. A later Paulo decision must authorize implementation of the reviewed design.
- **Prohibited:** S4 executable implementation or live state storage; S5+; changes to frozen architecture, core rules, manifest, capability baseline, version or ADRs; product/runtime changes; coordination bridge/workflow edits; remote resources or credentials; deployment/production writes; protected/main merge; PR #10 merge or auto-merge. Existing bootstrap coordination remains authoritative.


### D-049 — Authorize one S4 stale-lock micro-remediation and lean Builder mode

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** Paulo explicitly stated: `approved one micro remediation`.
- **Decision:** Authorize exactly one additional bounded design-remediation pass for `ML-DEVOS-RFC-016`, solely to close the remaining AS65-F001 stale-lock safety issue identified after remediation HEAD `cead2405e0147967bb89391c4d772d0579d94009`.
- **Remediation cap:** raise `MAX_REMEDIATION_CYCLES` from `1` to `2` for this S4 proposal cycle only. `CURRENT_REMEDIATION_CYCLE` becomes `2`. This is not a general change to Architect Sync policy and grants no further autonomous cycles.
- **Exact required delta:** remove automatic age-based stale-lock stealing from the proposed V1 persistence design; ordinary mutation must fail closed when a lock is held or suspected orphaned; define an explicit operator/admin recovery boundary after confirming no active writer remains; update only the directly affected crash/recovery/concurrency test-plan and mapping text.
- **Preserve closed findings:** AS65-F002, AS65-F003, AS65-F004, and the previously closed clarifications must remain closed and must not be redesigned or expanded.
- **Builder efficiency rule:** this turn and subsequent bounded Builder turns use **LEAN / DELTA-ONLY** mode. Claude reads `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md`, and the exact authorized mutation files first; additional files are read only when an active finding specifically requires a cited source. No whole-history reread, narrative restatement, unrelated cleanup, or broad test pass.
- **Authorized files:** `devos/changes/rfcs/ML-DEVOS-RFC-016.md`; traceability derived outputs only if changed by required regeneration; `coordination/IMPLEMENTER_HANDOFF.md`; `coordination/STATE.md`.
- **Return gate:** return to Architect review with `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `CURRENT_REMEDIATION_CYCLE: 2`, `MAX_REMEDIATION_CYCLES: 2`, and all mutation/remote/deploy/main prohibition flags still `NO`.
- **Not authorized:** executable S4 implementation or live task-state storage; edits to frozen architecture, CORE rules, S3 schema/validator, manifest, version records, ADRs, workflows, product/runtime code; S5+; credentials or remote resources; deployment/production writes; protected/main merge; PR #10 merge/auto-merge.
- **Implementation gate unchanged:** successful completion of this micro-remediation still returns only to Architect design review. A separate later Paulo decision is required before any S4 implementation.


### D-050 — Authorize bounded S4 State Machine Kernel implementation

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After the final Architect stage-gate approval of `ML-DEVOS-RFC-016`, Paulo stated: `ok go`.
- **Decision:** Authorize one bounded implementation cycle for the Architect-approved S4 State Machine Kernel design in `ML-DEVOS-RFC-016`. This is implementation authority only; S4 closure, manifest activation, capability-baseline/version transition, ADR creation, S5+, deployment, remote resources, and protected/main merge remain separately gated.
- **Lifecycle adoption:** Explicitly adopt `FAILED` and `ABANDONED` as additive S4 lifecycle terminal states for this implementation. Their eventual frozen-architecture/closure recording is deferred to the later S4 closure package and must not be treated as completed merely because implementation is authorized.
- **V1 Task Policy scope:** one per-project S4 Task Policy for `Dillaab-source/maisog-labs`.
- **Retry ceilings:** `build = 2`, `qa = 2`, `review = 2`. These values mean a maximum retry_count of two retry loops after the initial attempt for each class; the next failure at/over the ceiling follows RFC-016's fail-closed escalation path rather than starting another autonomous loop. These are S4 task-policy values and are not derived from `coordination/STATE.md`.
- **Orphan-lock recovery authority:** ordinary kernel mutations must never auto-clear a held lock. `force_clear_lock` (or equivalent) is a separate local maintenance capability. Paulo is the only default authorized operator for V1. Any other operator/admin requires a separate explicit Paulo delegation Decision. Every invocation must require and record operator identity, authorization reference, reason, and an affirmative confirmation that no writer remains. This maintenance capability grants no task-transition, merge, deployment, remote-resource, credential, or risk-acceptance authority.
- **Authorized implementation surfaces:** files under `devos/state/` required by RFC-016's implementation mapping; focused S4 tests under `tests/`; only narrowly necessary S4 implementation documentation inside `devos/state/`; deterministic traceability regeneration; `coordination/IMPLEMENTER_HANDOFF.md`; `coordination/STATE.md`.
- **Expected implementation shape:** task-state schema/validator; pure transition function; local JSON persistence adapter; exclusive-create task lock; revision/fencing semantics; claim/renew/release/transition/get_state/sweep_expired_leases operations; bounded transition provenance; per-project Task Policy injection using the values above; fail-closed orphan-lock handling; separately gated force-clear maintenance path; focused concurrent-writer, stale-revision, handoff, idempotency, retry, deterministic-clock, corruption/restart/orphan-lock, evidence-class-label, and non-authority tests described by RFC-016.
- **Implementation evidence:** Builder execution is `ACTOR_REPORTED` until Architect independently reproduces the focused S4 test suite. No implementation claim may be upgraded solely from Builder narrative.
- **Manifest/closure rule:** `devos/devos-manifest.json`, Sentinel capability baseline, version records, ADRs, and S4 closure status remain unchanged during this implementation cycle. Successful implementation returns to Architect review first; closure/version/manifest changes require a later D.1/D.2 closure package and explicit Paulo decision.
- **LEAN / DELTA-ONLY rule:** Builder reads live `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md`, `ML-DEVOS-RFC-016.md`, and the exact implementation surfaces needed. Broader history is read only when a specific implementation requirement requires it. No unrelated cleanup or broad application test pass.
- **Return gate:** after implementation and focused tests, return `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, with implementation evidence, exact changed files, test output, traceability result, and all remote/deploy/main prohibitions preserved.


### D-051 — Authorize S4 State Machine Kernel closure and v1.7.0 adoption

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After ML-DEVOS-AS-066 accepted the final S4 implementation and ML-DEVOS-AS-067 D.1 preflight passed, Paulo stated: `Ok move forward and onwards`.
- **Decision:** Authorize the bounded S4 closure package exactly as preflighted by ML-DEVOS-AS-067. This closes/adopts S4 only; it does not authorize S5, Skills V0.2, website product mutation, remote/cloud resources, deployment, production writes, or protected/main merge.
- **Closure ADR:** allocate the live-next sequential ADR, `ML-DEVOS-ADR-014`, and use it as S4's manifest `closure_ref`.
- **Manifest:** `devos/state/` moves from `NOT_IMPLEMENTED` to `IMPLEMENTED`; `closure_ref: ML-DEVOS-ADR-014`; `executable_runtime_present: false`. Top-level runtime flag remains false.
- **Release:** adopt Sentinel capability baseline `v1.7.0`, a MINOR transition from `v1.6.0`, with `ML-DEVOS-ADR-014` as the active baseline ADR and this Decision as its decision reference.
- **Frozen lifecycle amendment:** explicitly authorize the narrow ML-DEVOS-ARCH-001 §10 additive reconciliation already substantively adopted in D-050: record `FAILED` and `ABANDONED` as S4 terminal lifecycle states, with no outgoing transitions and new-task recovery semantics. The frozen architecture identity remains `ML-DEVOS-ARCH-001 / v1.2.0 / FROZEN`; no actor/source-of-truth/CORE rule meaning changes.
- **RFC / README reconciliation:** mark RFC-016 `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-014 / D-051`, update its index description, and update devos/state/README.md to mirror the manifest closure truth.
- **Closure history:** append S4 closure at 2026-09-21 / v1.7.0 / ADR-014 / D-051 / ML-DEVOS-AS-066.
- **Evidence honesty:** preserve AS-066's evidence classification. Builder's complete focused-suite execution remains ACTOR_REPORTED; Architect's source/diff review is INDEPENDENTLY_INSPECTED and critical remediation invariants were independently spot-executed. Do not claim a full Architect rerun that did not occur.
- **Implementation corrections to record:** expectedRevision replaces recomputed from_state in transition replay identity; NOT_CURRENT_OWNER and REVISION_CONFLICT remain distinct diagnostics; claim's explicit API omits presented revision despite RFC-016's broader prose and this discrepancy must be recorded rather than hidden.
- **Traceability:** preflight baseline is exactly CORE-022 + WEB-REQ-009, 2 errors / 14 warnings. Regenerate derived outputs and introduce no new unexpected ERROR; never suppress the baseline to manufacture zero.
- **D.2 return gate:** Builder returns closure package to Architect for Post-decision Closure Verification before S4 is treated as fully closed in the workflow or any S5 proposal begins.
- **LEAN / DELTA-ONLY:** closure Builder reads only live STATE, Architect closure brief, AS-067 as needed, accepted S4 closure source records, and files on the closure whitelist. No full-history reread or unrelated cleanup.


### D-052 — Authorize WEB-REL-001 Gate A: minimal CI and main technical protection

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After S4 fully closed at ML-DEVOS-AS-068 and the repository's existing WEB-REL-001 readiness packet identified the exact next production-readiness gates, Paulo stated: `Okay next`.
- **Decision:** Authorize **Gate A only** from `docs/release/WEB_REL_001_READINESS_REPORT.md`: create/activate the minimal GitHub CI workflow and configure the minimum technical protection for `main`. This is a release-safety/protection step, not a merge, Cloudflare resource, production-data, or deployment authorization.
- **CI scope:** create exactly one workflow under `.github/workflows/ci.yml` implementing the readiness report's minimal design:
  1. trigger on pull requests targeting `main`;
  2. trigger on pushes to `governance/maisoglabs-v0.1`;
  3. use Node.js 22;
  4. run `npm ci`;
  5. run `npm test`;
  6. run `npm run build`;
  7. no deploy command, Wrangler mutation, Cloudflare credential, D1/R2/Access secret, artifact publication, or production write.
- **First-run gate:** push the workflow only to the governed branch first and observe at least one completed green run. Record the exact live status-check/check-run context GitHub reports. Do not guess or hardcode the required-status context before it has existed successfully.
- **Main protection scope:** after the successful observed CI run, configure a GitHub ruleset targeting exactly `main` with the minimum WEB-REL-001 protections:
  - require pull request before merge;
  - block direct ordinary merge paths that bypass the PR requirement;
  - block force pushes/non-fast-forward updates;
  - block branch deletion;
  - require the exact observed CI status check before merge;
  - required approving-review count remains zero while the repository is single-owner; do not fabricate a reviewer;
  - any bypass capability must be limited to the repository owner/admin as narrowly as GitHub supports.
- **Fail-closed configuration rule:** if the available GitHub identity/tool cannot inspect or mutate rulesets with sufficient administration permission, do not weaken the design or silently substitute legacy protection. Stop and report the exact blocker for Paulo/Architect disposition.
- **Verification required:** live GitHub evidence after mutation must show (a) workflow exists on governed branch, (b) at least one completed green run for the workflow, (c) main ruleset/protection is active, (d) required status check name matches the observed live check context, and (e) `main` itself has not been merged/pushed by this gate.
- **Traceability:** preserve the known traceability debt `CORE-022` + `WEB-REQ-009`; no new unexpected hard ERROR may be introduced by the repository-side CI file/coordination changes.
- **Still prohibited:** opening/merging the governance→main PR; any direct push to `main`; remote D1/R2 creation or mutation; Cloudflare Access setup; Worker deployment; DNS/domain mutation; production data writes; website public-source cutover; new product features; Sentinel S5+; Skills V0.2 implementation; PR #10 merge.
- **Return gate:** after Gate A implementation/evidence, return `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for independent review. Gate B (opening the governance→main PR) remains a separate later Paulo decision.


### D-053 — Authorize public repository visibility for Gate A completion

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After ML-DEVOS-AS-069 independently verified Gate A CI and surfaced GitHub's private-repository protection plan blocker, Paulo stated: `ok public`.
- **Decision:** Explicitly authorize changing repository `Dillaab-source/maisog-labs` from **private** to **public** solely to unblock GitHub Free repository rulesets / protected-main controls required by WEB-REL-001 Gate A.
- **Disclosure acknowledgment:** This is a material visibility change. Once executed, repository source code, governance records, historical decisions, Architect Syncs, project documentation, and Git history become publicly accessible unless GitHub or the repository contents themselves provide otherwise. This authorization is explicit and is not inferred from any prior Gate A decision.
- **Post-visibility protection requirement:** Immediately after public visibility is confirmed, configure the original D-052 / ML-DEVOS-AS-069 minimum `main` protection:
  - require pull request before merge;
  - required approving reviews = 0 while single-owner;
  - block force pushes / non-fast-forward updates;
  - block branch deletion;
  - require the already-observed live CI context `test-and-build`;
  - owner/admin bypass only as narrowly as GitHub supports.
- **Fail-closed sequencing:** Do not open Gate B / governance→main PR until both public visibility and the `main` protection/ruleset are independently confirmed active.
- **Still prohibited:** direct push/merge to `main`; governance→main PR opening before protection confirmation; remote D1/R2; Cloudflare Access production configuration; Worker deployment; DNS/domain changes; production data writes; public-source cutover; S5+; Skills V0.2; PR #10 merge.
- **Tooling limitation:** The connected GitHub tool available to ChatGPT can write repository contents but does not expose repository-visibility mutation or ruleset/branch-protection administration. Those admin-setting mutations must be completed through an authorized GitHub admin surface, then independently re-checked before Gate A can close.


### D-054 — Authorize WEB-REL-001 Gate B draft/review PR to main

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After ML-DEVOS-AS-070 closed Gate A with public visibility, green CI, and active `main-protection`, Paulo stated: `Okay proceed`.
- **Decision:** Authorize Gate B only: open exactly one **draft/review pull request** from `governance/maisoglabs-v0.1` to `main`, allow the required `test-and-build` check to run on that PR, inspect the complete release diff and GitHub mergeability/protection state, and return the result for Architect review.
- **No merge authority:** This decision does **not** authorize merging the PR. `MAIN_MERGE_AUTHORIZED` remains `NO`. A separate Gate C / Paulo decision is required before any merge to `main`.
- **Review requirements:** verify the PR head/base, exact head SHA, full change inventory at release level, CI result, ruleset enforcement, mergeability, unresolved conversations if any, and that no unrelated/new scope was introduced after Gate A closure.
- **Still prohibited:** direct push to `main`; merge/auto-merge; remote D1/R2 creation or mutation; production Cloudflare Access setup; Worker deployment; DNS/domain mutation; production data writes; public D1 cutover; S5+; Skills V0.2; PR #10 merge.
- **Return gate:** Gate B may be marked review-complete only after the draft PR exists and `test-and-build` reports its live result. If review is clean, route a separate Gate C merge decision to Paulo. If not clean, do not merge and return the smallest bounded remediation.


### D-055 — Accept automatic non-production Cloudflare PR previews as Gate B review evidence

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After ML-DEVOS-AS-071 identified that opening Gate B PR #12 automatically triggered the repository's pre-existing Cloudflare Workers Git integration, Paulo selected `A`.
- **Decision:** Accept automatic **non-production Cloudflare PR/branch preview versions** created by the existing Git integration as permitted review evidence for Gate B and future governed review pull requests.
- **Boundary:** This decision does **not** authorize production promotion, production Worker deployment, custom-domain/DNS mutation, remote D1/R2 mutation, production Cloudflare Access changes, or production data writes. Preview versions and production deployment remain distinct.
- **Governance interpretation:** Prior Gate B wording prohibiting deployment is clarified prospectively to prohibit **production deployment/promotion** while allowing automatically generated non-production preview versions that are isolated from the active production deployment.
- **Gate B disposition:** GB-F001 is accepted/closed under this owner policy. PR #12 may complete Gate B review once its current/final review head remains governance-only after ML-DEVOS-AS-071/D-055 bookkeeping and the required `test-and-build` check is green.
- **Gate C remains separate:** No merge authority is granted. `MAIN_MERGE_AUTHORIZED` remains `NO` until a later explicit Paulo Gate C decision.


### D-056 — Authorize WEB-REL-001 Gate C merge of PR #12 into main

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After D-055 / ML-DEVOS-AS-072 closed Gate B and the final live pre-merge checks confirmed PR #12 remains clean, protected, mergeable, and green, Paulo stated: `Proceed`.
- **Decision:** Authorize merging **exactly PR #12** from `governance/maisoglabs-v0.1` into `main`.
- **Merge method:** normal GitHub merge commit, preserving the governed commit history and traceability.
- **Expected base before merge:** `887849283ee9cd16e8d60b937bac95b1c85bf3d9`.
- **Pre-authorization reviewed head:** `60c9d940e73182acd42dfc38e9aa7011a61e3f8c`.
- **Final-head rule:** because recording D-056 and Gate C state advances the PR head, the merge is authorized only if the then-current PR head differs from the reviewed head solely by Gate C governance/coordination bookkeeping and the required `test-and-build` check is green on that exact final head.
- **Protection rule:** ruleset `main-protection` must remain active and continue to require PR flow plus `test-and-build`, while blocking deletion and non-fast-forward/force-push updates.
- **Merge safety:** use the exact current PR head SHA as the expected-head guard when invoking the merge. If the PR head moves again, the authorization pauses until the new delta and CI are re-verified.
- **Scope after merge:** this decision authorizes the GitHub merge only. It does **not** authorize production Worker promotion/deployment, remote D1/R2 creation or mutation, production Cloudflare Access changes, DNS/domain mutation, production data writes, public D1 cutover, S5+, Skills V0.2, or PR #10 merge.
- **Post-merge verification required:** confirm PR #12 reports merged, `main` advances to the merge result, the governed release tree is represented on `main`, and no prohibited Cloudflare/remote action was intentionally initiated as part of the merge command.


### D-057 — Decouple main merge from Cloudflare production deployment

- **Decided by:** Paulo (Product / Risk Owner), delegating the choice to Architect with the instruction: `Chosee what is nescesary`.
- **Architect selection:** Option B.
- **Decision:** Restore a strict separation between source-control integration and production release. Merging an approved pull request into `main` must **not by itself authorize or trigger a Cloudflare production deployment**.
- **Reason:** GC-F001 proved the current Git integration couples two materially different risk events: accepting governed code into `main`, and changing the live production Worker. Sentinel governance requires those to remain independently reviewable and independently authorizable.
- **Required remediation:** Disable or alter the Cloudflare production Git build/deploy behavior so future `main` merges do not automatically deploy to production. Non-production PR/branch previews remain permitted under D-055.
- **Future release model:** `review PR -> merge gate -> main -> separate production deploy gate -> runtime verification`.
- **Current production version:** No rollback is authorized merely because the coupling was discovered. The already-created Cloudflare version `a28ee2e9-a9a0-4528-b89f-07e0c827be2b` remains in place unless later runtime verification shows a concrete reason to roll back and Paulo separately authorizes it.
- **Fail closed:** Do not open the next production release gate until the main-to-production auto-deploy coupling is independently verified as disabled or otherwise separated.
- **Still prohibited:** additional production deploy/rollback, remote D1/R2 changes, production Access changes, DNS/domain mutation, production data writes, public D1 cutover, S5+, Skills V0.2, PR #10 merge.

### D-058 — Authorize Sentinel S5 Capability & Permission Gateway proposal

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After D-057 remediation closed at 100% health, Paulo instructed: `so proceed to next phase`, with standing authorization for the remaining bounded actions in this session.
- **Decision:** Authorize the next sequential Sentinel phase, **S5 — Capability & Permission Gateway**, for discovery, architecture proposal, and audit only. Allocate `ML-DEVOS-RFC-017` as the next RFC.
- **Proposal objective:** define a provider-neutral, default-deny capability registry/gateway that describes what an actor can technically invoke while preserving the frozen rule that Capability is not Authority. The proposal must cover scoped actor/role/project/tool/action permissions, credential and secret-reference requirements without secret values, sensitive-operation gates, denial semantics, audit/evidence outputs, adapter boundaries, and composition with S3 Task Contracts and S4 Task State.
- **Required design analysis:** threat model and trust boundaries; capability descriptor/schema; request/evaluation/decision contract; fail-closed behavior for missing, stale, malformed, or ambiguous policy; governance-authority separation; revocation and expiry; least privilege; deterministic evaluation; idempotency/retry implications; local persistence/configuration options; test plan; implementation mapping; risks and traceability.
- **No implementation authority:** no executable S5 gateway, enforcement runtime, credential integration, live secret access, manifest status change, ADR, Sentinel version change, or frozen-architecture mutation is authorized by this decision. Implementation requires later Architect approval and a separate Paulo decision.
- **Authorized files:** `devos/changes/rfcs/ML-DEVOS-RFC-017.md`; `devos/changes/rfcs/README.md`; deterministic traceability outputs only if regeneration changes them; `coordination/IMPLEMENTER_HANDOFF.md`; `coordination/STATE.md`.
- **Evidence and audit:** report exact changed files, test/validator commands, exit codes, and before/after traceability fingerprints. Preserve and disclose the known `CORE-022` and `WEB-REQ-009` traceability errors; introduce no unexpected hard ERROR and do not suppress existing debt.
- **LEAN / DELTA-ONLY:** Builder reads the live state, current Architect brief, frozen architecture sections governing actors/mechanisms/capability-vs-authority, S3/S4 accepted contracts, the S5 reserved-root README, RFC template/policy, and directly necessary traceability sources. No broad history reread or unrelated cleanup.
- **Return gate:** Builder returns `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, with the proposal and audit evidence. Architect reviews the design before any S5 implementation authority can be considered.
- **Still prohibited:** S5 executable implementation; S6+; Skills V0.2; product/runtime changes; remote D1/R2; Cloudflare Access, DNS, domains, deployment or rollback; production-data writes; public D1 cutover; protected/main merge; PR #10 merge or auto-merge.

### D-059 — Reassign S5 RFC-017 remediation Cycle 1 from Claude to Codex Builder

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** Claude reported 97% weekly usage consumption with reset not until Thursday. Paulo then instructed Codex: `ur turn`.
- **Decision:** Reassign only the already-authorized `ML-DEVOS-AS-075` remediation Cycle 1 Builder work from Claude to Codex. The scope, five findings, authorized files, remediation counter, and hard boundaries remain unchanged.
- **Role integrity:** Codex acts as Builder for this remediation and must not approve its own work. After pushing the bounded correction and audit evidence, control returns to `TURN: ARCHITECT`; the final stage-gate review must be performed from a fresh Architect context.
- **Authorized work:** correct exactly `AS75-F001` through `AS75-F005` in `ML-DEVOS-RFC-017`; update its README summary only if needed; regenerate deterministic traceability outputs; append Implementer evidence; update coordination state.
- **Still prohibited:** executable S5 implementation; S6+; Skills V0.2; application/product/runtime changes; live credentials or secrets; S3/S4 mutation; manifest/ADR/version/frozen-architecture/CORE-rule mutation; remote D1/R2; Cloudflare Access/DNS/domain/deployment/rollback changes; production-data writes; public D1 cutover; protected/main merge; PR #10 merge or auto-merge.

### D-060 — Queue SENTINEL Context Plane V1 as a future cross-cutting architecture initiative

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After reviewing current context-engineering research and the proposed MaisogLabs Context Plane architecture, Paulo stated: `Agree let’s put that into record and plan carefully let us also be adoptable for future innovation`.
- **Decision:** Adopt `docs/SENTINEL_CONTEXT_PLANE_V1_PLAN.md` as the durable queued planning record for a future provider-neutral SENTINEL Context Plane. The initiative is intended to reduce unnecessary model context/token use while preserving governance quality, traceability, owner control, and evidence integrity.
- **Architecture direction:** separate Authority, Context, Capability, Execution, and Evidence planes; use a small stable context kernel, turn manifests, progressive context/tool discovery, provenance/trust labels, machine context receipts, context-debt measurement, and repository-state recovery. Context is a working set; repository/evidence remain durable truth.
- **Future-innovation rule:** the design must use versioned interfaces and adapters so new models, providers, multimodal inputs, native caching/compaction/tool discovery, retrieval methods, and future project profiles can be adopted without redefining governance authority or coupling SENTINEL to one vendor.
- **Optimization rule:** preserve historical evidence but do not require historical material to be preloaded by default. Any later migration away from the accumulated `coordination/IMPLEMENTER_HANDOFF.md` startup dependency must preserve provenance and be separately reviewed.
- **No implementation authority:** this decision queues and records the architecture direction only. It does not authorize protocol migration, `CLAUDE.md`/`AGENTS.md` rewrites, new context scripts, runtime enforcement, S5 implementation, S6+, deployment, remote resources, production writes, or main merge.
- **Sequencing:** the current S5 RFC-017 Architect re-review remains the live turn and must complete first. A separate Paulo authorization is required to start a bounded Context Plane discovery/design cycle.
- **Adaptability:** Context Plane V1 must be treated as an evolvable platform contract. New techniques are introduced through measured, reversible experiments and shadow trials rather than silently replacing the active path.

### D-061 — Prioritize SENTINEL Context Plane Bootstrap V0 before S5 implementation

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After a fresh GPT-6 Astra adversarial review of the proposed Context Plane bootstrap, Paulo instructed: `Ok go on`.
- **Decision:** Prioritize the corrected, bounded **SENTINEL Context Plane Bootstrap V0** before executable S5 implementation. Allocate `ML-DEVOS-RFC-018` for the Bootstrap V0 architecture proposal. This refines the queued D-060 direction without activating the broader Context Plane program.
- **Accepted review corrections:** V0 is a small repository turn/coordination protocol, not a new operational platform. It must provide snapshot-consistent reads, pre-publication revalidation/conflict detection, an explicit STATE↔CURRENT_HANDOFF identity relationship, preservation of still-operative requirements, coherent migration of all active readers/writers, authority-vs-freshness separation, and durable preservation of rolling records.
- **Initial supported governed participants:** local Claude Builder and GitHub-connected ChatGPT Architect may receive full V0 governed-write support only when their safe freshness/publication semantics are demonstrated. Other/future providers remain read-only/advisory until separately demonstrated.
- **Bookkeeping repair authorized:** recover `ML-DEVOS-AS-075`, `ML-DEVOS-AS-076`, and `ML-DEVOS-AS-077` from exact Git-history snapshots; index them durably; regenerate traceability in the next executable validation step. Do not reconstruct their contents from conversational memory.
- **Design-only authority:** filing/indexing RFC-018 and preparing it for independent review are authorized. No CURRENT_HANDOFF cutover, provider-bootstrap rewrite, checker implementation, protocol migration, S5 executable code, S6+, remote resource, deployment, production write, or main merge is authorized by D-061.
- **S5 sequencing:** RFC-017 remains Architect-approved but implementation-paused. After Bootstrap V0 design review, Paulo separately decides Bootstrap implementation. After implementation/failure tests/independent review, Paulo separately decides S5 implementation; S5 is intended as Bootstrap Trial #1.
- **Independent review:** RFC-018 must receive a fresh independent architecture review before any implementation decision. Prefer a fresh Astra or equivalently independent Architect context; the authoring context must not self-approve it.
- **Preservation:** D-060 and `docs/SENTINEL_CONTEXT_PLANE_V1_PLAN.md` remain historical planning records and are not silently rewritten to pretend they contained the refined Bootstrap V0 semantics from inception.

### D-062 — Authorize bounded SENTINEL Context Plane Bootstrap V0 implementation

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After the final independent Architect stage-gate approval of `ML-DEVOS-RFC-018`, Paulo stated: `Authorized proceed`.
- **Decision:** Authorize bounded implementation of the Architect-approved **SENTINEL Context Plane Bootstrap V0** design in `ML-DEVOS-RFC-018`. This is Bootstrap implementation authority only. It does not authorize Context Plane CP-4+, S5 executable implementation, S6+, Model Router V0 implementation, remote resources, credentials, deployment, production writes, or protected/main merge.
- **Safety sequencing:** Implementation is split into two lean substeps under this one decision because RFC-018 requires the operative-obligation carry-forward inventory to receive independent Architect review **before** the live cutover, while the reader/writer migration itself must activate atomically.
- **Stage A — PRE-CUTOVER implementation, authorized immediately:** capture the bounded baseline; implement the inactive repository-native Bootstrap protocol/checker and focused tests; create the bounded candidate operative-obligation inventory; create deterministic handoff-archive/index scaffolding; regenerate traceability if changed; append Stage-A evidence to the still-active legacy Implementer Handoff; return to Architect for a pre-cutover review. Stage A must not activate CURRENT_HANDOFF routing or migrate active readers/writers.
- **Stage A mutation surfaces:** `brain/protocols/CONTEXT_BOOTSTRAP.md`; `scripts/check-context-bootstrap.mjs`; `tests/context-bootstrap.test.mjs`; `coordination/OPERATIVE_OBLIGATIONS.md`; `coordination/archive/handoffs/README.md` and only directly necessary inert archive scaffolding; deterministic traceability outputs if regeneration changes them; `coordination/IMPLEMENTER_HANDOFF.md`; `coordination/STATE.md`. A narrowly necessary supporting fixture under `tests/fixtures/` is permitted only for RFC-018 failure cases.
- **Stage A non-mutation boundary:** no `CURRENT_HANDOFF.md`; no root `AGENTS.md`/`CLAUDE.md` change; no active coordination-protocol, Architect-Sync, orientation, project-governance, handoff-format, canonical-skill, provider-bridge, or other reader/writer migration; no freeze/cutover of the legacy handoff yet.
- **Intermediate Architect gate:** Architect must independently review the candidate obligation inventory, checker contract, focused failure tests, baseline evidence, and pre-cutover implementation. If the candidate remains within RFC-018, Architect may route Stage B under this same D-062 authority without another Paulo decision. A material architecture/scope expansion routes back to Paulo.
- **Stage B — ATOMIC ACTIVATION, conditionally authorized after that Architect pass:** perform one exact-tip atomic cutover that creates/activates `coordination/CURRENT_HANDOFF.md`, adds the protocol-version marker, finalizes the reviewed obligation inventory, freezes `coordination/IMPLEMENTER_HANDOFF.md` byte-for-byte and removes it from mandatory startup/future append paths, coherently migrates every active reader/writer named by RFC-018, updates canonical skills first and regenerates provider bridges, runs the required live/failure checks, and returns to Architect for final implementation review.
- **Stage B required reader/writer surfaces, once Architect opens it:** root `AGENTS.md`; root `CLAUDE.md`; `coordination/README.md`; `coordination/STATE.md`; new `coordination/CURRENT_HANDOFF.md`; `coordination/OPERATIVE_OBLIGATIONS.md`; handoff archive/index surfaces; `brain/00_HOME.md`; `brain/PROJECT_GOVERNANCE.md`; `brain/ARCHITECT_HANDOFF.md`; `brain/protocols/ARCHITECT_SYNC.md`; `brain/protocols/CONTEXT_BOOTSTRAP.md`; canonical `.agents/skills/architect-review-sync/`, `.agents/skills/implementation-handoff/`, `.agents/skills/project-orientation-state-recovery/`; regenerated matching `.claude/skills/` bridges; `scripts/check-context-bootstrap.mjs`; directly relevant tests; deterministic traceability outputs if changed. Historical references are not rewritten merely because they mention the legacy path.
- **Locked protocol semantics:** preserve `MAX_PUBLICATION_ATTEMPTS = 3`; exact-snapshot reads; exact-tip conflict-detecting publication; mandatory read-back reconciliation for ambiguous publication results; machine-readable `handoff_id`/`cycle_id`/`review_target_commit`/`applicable_review_id` binding; unconditional outgoing rolling-record preservation; independently reviewed obligation carry-forward; provenance does not create authority; protocol-version mismatch fails closed; rollback is forward recovery from fresh state.
- **Failure tests:** execute the RFC-018 required set, including the 20 independent-review additions and the three final-cycle additions. Authority/prompt-injection cases require behavioral/procedural evaluation and may not be claimed proven by string matching alone.
- **Evidence posture:** Builder execution remains `ACTOR_REPORTED` until Architect independently verifies repository state and reproduces or otherwise independently checks the relevant deterministic behavior. Baseline/pilot context measurements must distinguish measured bytes/reads from estimated or provider-reported token usage.
- **LEAN / DELTA-ONLY:** repository state is durable memory. Builder reads live STATE, the current Architect review, RFC-018, and exact authorized Stage-A surfaces first; additional history is retrieved only for a concrete unresolved requirement.
- **Return gates:** Stage A returns `TURN: ARCHITECT` for pre-cutover review. Stage B, once opened by Architect under D-062, returns `TURN: ARCHITECT` for final implementation review. A separate later Paulo decision is still required before S5 executable implementation.
- **Queued Model Router:** SENTINEL Model Router V0 remains a post-Bootstrap/S5-pilot candidate only. D-062 grants it no design-cycle or implementation authority.



### D-063 — Authorize bounded Sentinel S5 Capability & Permission Gateway implementation as Bootstrap Trial #1

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After `ML-DEVOS-AS-081` independently accepted SENTINEL Context Bootstrap V0 and routed the repository to `TURN: PAULO` / `PAULO_DECISION_REQUIRED`, Paulo's already-recorded explicit owner instruction for the next S5 gate was: `Yes let’s goo`.
- **Decision:** Authorize bounded implementation of the Architect-approved `ML-DEVOS-RFC-017` — **S5 Capability & Permission Gateway V1** — as **Context Bootstrap V0 Trial #1**. Final design approval is `ML-DEVOS-AS-077`. This is S5 implementation authority only.
- **Required editorial reconciliation:** implement the `ML-DEVOS-AS-077` non-blocking descriptor-expiry correction so ordinary policy supersession means a descriptor is **“not grantable to new attempts after supersession”** and does not retroactively invalidate an already-pinned in-flight attempt. Emergency revocation remains controlled by the separate live revocation list.
- **Authorized implementation mapping:** implement only the RFC-017 V1 gateway surface, including the planned capability schemas, strictly required request/policy structural artifacts, zero-third-party-dependency policy validator, pure evaluator, the bounded five provider adapters (`shell`, `github`, `cloudflare`, `mcp`, `browser`), bounded valid/invalid fixtures, focused tests, directly necessary documentation/index changes, deterministic traceability outputs if changed, and the required coordination/evidence records.
- **Required semantics:** preserve Capability != Authority; default deny; branded trusted `subjectContext` and `evaluationContext`; structurally separate untrusted request intent; raw `evaluate()` not exposed as the untrusted caller surface; provider-specific canonicalization; deterministic resource matching; policy-version pinning; live revocation override; expiry against trusted evaluation time; the canonical RFC-017 §4 denial vocabulary; credential class/availability only and never secret values; a pure deterministic CapabilityDecision; separately constructed AuditEnvelope; no widening of closed S3/S4 interfaces.
- **Bootstrap Trial #1 measurements:** collect `OBL-009` measurements where actually observable: startup/context volume, initial reads, historical reads, duplicate reads, wrong-turn attempts, stale-publication rejections, false blocking, missed obligations, rework, and scope violations. Do not invent measurements.
- **Evidence discipline:** Builder execution remains `ACTOR_REPORTED` until independently checked by the Architect. Preserve and disclose existing traceability debt `CORE-022` and `WEB-REQ-009`; introduce no new unexpected hard-error fingerprint and do not suppress known debt.
- **Still prohibited:** S3/S4 integration or wiring; S6+; Context Plane CP-4+; Model Router V0; dynamic plugin discovery; external/live policy service; credentials or secret values; remote D1/R2; Cloudflare production mutation; Access/DNS/domain mutation; deployment or rollback; production-data writes; public D1 cutover; protected/main merge; PR #10 merge or auto-merge.
- **Publication boundary:** this D-063 decision/routing transaction must itself publish under Context Bootstrap V0 exact-tip conflict detection. It does not implement any S5 executable file.
- **Builder route:** after this decision is durably published, route `TURN: CLAUDE`, `STATUS: AUTHORIZED`, `AUTHORIZED_SCOPE: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_IMPLEMENTATION_ONLY`, `IMPLEMENTER_ACTION_REQUIRED: YES`. `CURRENT_HANDOFF` remains `NONE` until the Builder completes the bounded implementation and returns a new Builder→Architect handoff.
- **Return gate:** after bounded S5 implementation and evidence collection, Builder creates the next CURRENT_HANDOFF and returns `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for independent implementation review. No later phase is implied.


### D-064 — Authorize S5 D.1 pre-decision closure preflight only

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After `ML-DEVOS-AS-083` technically accepted S5 Capability & Permission Gateway V1 and routed `TURN: PAULO` / `PAULO_DECISION_REQUIRED`, Paulo explicitly stated: `ok proceed authorized`.
- **Decision:** Proceed to the repository's existing **D.1 Pre-decision Closure Preflight** for S5 only.
- **Authority granted:** the Architect may inspect the live S5 closure inputs and publish the bounded D.1 preflight review/package for Paulo's later closure decision.
- **Required D.1 scope:** name the exact base SHA; inspect current RFC status, manifest entry, closure history, rolling coordination surfaces, active Sentinel baseline and version policy; define the proposed RFC status change; define the proposed `devos/capabilities/` manifest transition to `IMPLEMENTED` with an ADR-keyed `closure_ref`; define the proposed S5 closure-history entry; identify the proposed ADR provenance; state an explicit version disposition; record the pre-closure traceability ERROR fingerprint; verify bounded closure scope; and confirm no later-phase authority is implied.
- **Current baseline facts to verify, not assume:** Sentinel active capability baseline is presently `v1.7.0`; `devos/capabilities/` is presently `NOT_IMPLEMENTED`; S5 implementation was technically accepted by `ML-DEVOS-AS-083`.
- **No closure mutation authority:** D-064 does **not** authorize changing `devos/devos-manifest.json`, creating the final closure ADR, changing RFC-017's final closure status, appending closure history, changing the active Sentinel version, or performing any D.2 post-decision closure mutation.
- **No later-phase authority:** S6+, CP-4+, Model Router V0, S3/S4 integration/wiring, remote D1/R2, Cloudflare production mutation, deployment/rollback, production writes, protected/main merge, and PR #10 merge/auto-merge remain unauthorized.
- **Return gate:** Architect publishes the D.1 preflight under the next unused immutable Architect Sync ID and routes back to `TURN: PAULO` / `PAULO_DECISION_REQUIRED` for the actual closure/version decision. No Builder implementation turn is authorized by D-064.


### D-065 — Authorize S5 Capability & Permission Gateway closure and v1.8.0 adoption

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After `ML-DEVOS-AS-084` returned `PASS — S5 CLOSURE PACKAGE READY FOR PAULO DECISION`, Paulo explicitly stated: `proceed authorized`.
- **Decision:** Authorize the exact bounded S5 closure package preflighted by `ML-DEVOS-AS-084`. This closes/adopts S5 only after the Builder executes the package and the Architect passes mandatory D.2 post-decision verification. It does not authorize S6+, Context Plane CP-4+, Model Router V0, S3/S4 runtime integration, deployment, remote resources, production writes, protected/main merge, or PR #10 merge.
- **Closure ADR:** allocate `ML-DEVOS-ADR-015` as the S5 closure ADR and manifest `closure_ref`.
- **Manifest root:** `devos/capabilities/` moves from `NOT_IMPLEMENTED` to `IMPLEMENTED`; `closure_ref: ML-DEVOS-ADR-015`; `executable_runtime_present: false`. The false runtime flag is intentional: S5 is an implemented repository-local decision library but is not wired as a live operational enforcement service.
- **Sentinel release:** adopt capability baseline `v1.8.0`, a MINOR transition from `v1.7.0`, with `ML-DEVOS-ADR-015` as the active baseline ADR and D-065 as its decision reference.
- **Baseline metadata:** update the manifest's descriptive current-baseline text consistently to v1.8.0; manifest `manifest_version` remains exactly `"1"`; update `updated_at` to `2026-09-24`.
- **Closure history:** append exactly one S5 closure entry at `2026-09-24 / v1.8.0 / ML-DEVOS-ADR-015 / D-065 / ML-DEVOS-AS-083`, with a concise note recording the repository-local Capability & Permission Gateway, in-process branded trusted-context boundary, provider-specific canonicalization, and no live enforcing runtime.
- **RFC closure:** change only RFC-017's status/provenance closure reconciliation to `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-015 / D-065`; preserve its design/proposal history. Update the RFC index description only as needed to stop claiming S5 is proposal-only/unimplemented.
- **Capability README reconciliation:** update `devos/capabilities/README.md` to reflect manifest IMPLEMENTED / independent acceptance / closure truth while preserving the documented non-authority and residual trust limitations.
- **ADR-015 provenance:** record RFC-017; AS-077 design approval; D-063 implementation authorization / Bootstrap Trial #1; original implementation commit `d589a16b8256232edd029593d653335913619125`; AS-082 findings AS82-F001 / AS82-F002; remediation commit `06b5bef3d1e495db95cd52508ea8fc8ed9d7242e`; AS-083 technical acceptance; D-065 closure; the minter-acquisition bypass and remediation; platform-aware shell canonicalization remediation; Capability != Authority; accepted in-process/non-cryptographic residual limits; no S3/S4/live-runtime wiring; evidence classification; v1.8.0 consequence; and known CORE-022 / WEB-REQ-009 debt.
- **Version policy:** update `VERSIONING_POLICY.md` so v1.8.0 is the current Sentinel capability baseline and record the explicit S5 MINOR closure chain. No frozen-architecture identity/version change is authorized or required.
- **Manifest regression test:** update `tests/devos-manifest.test.mjs` narrowly so S3/ADR-013, S4/ADR-014, and S5/ADR-015 are the implemented reserved roots, with all remaining later roots still NOT_IMPLEMENTED except `devos/schemas/` FOUNDATION_ACTIVE. Preserve the dynamic source-of-truth/current-baseline consistency check.
- **Traceability:** regenerate deterministic traceability outputs. The D.1 baseline fingerprint is exactly two known errors — `CORE-022` and `WEB-REQ-009` — with 14 warnings. Preserve those findings unless separately and legitimately resolved; introduce no new unexpected ERROR and never suppress them to manufacture zero.
- **Closure mutation whitelist:** `brain/DECISION_LOG.md` (this D-065 decision only); `devos/changes/adrs/ML-DEVOS-ADR-015.md`; `devos/changes/adrs/README.md`; `devos/changes/rfcs/ML-DEVOS-RFC-017.md`; `devos/changes/rfcs/README.md`; `devos/capabilities/README.md`; `devos/devos-manifest.json`; `devos/governance/specifications/VERSIONING_POLICY.md`; `tests/devos-manifest.test.mjs`; deterministic traceability outputs; and only normal Context Bootstrap coordination/handoff/archive evidence required by this closure turn.
- **No implementation-source mutation:** S5 implementation source is already technically accepted. The closure turn must not change evaluator, adapters, schemas, capability policy logic, focused S5 implementation tests, S3/S4 interfaces, or manifest schema/validator behavior. If a factual incompatibility is discovered, fail closed and return to Architect rather than silently widening scope.
- **Evidence honesty:** preserve `ML-DEVOS-AS-083` evidence classification. Builder full-suite execution remains ACTOR_REPORTED unless independently reproduced; Architect source/diff/security inspection remains independently inspected. Do not upgrade evidence merely because closure succeeds.
- **D.2 return gate:** Builder must return the completed closure package to Architect for D.2 Post-decision Closure Verification. S5 is not treated as fully closed in the governed workflow until D.2 passes.
- **LEAN / DELTA-ONLY:** Builder reads live STATE, ML-DEVOS-AS-084, D-065, and the exact closure whitelist; broader history only when a concrete closure requirement requires it.
- **Still prohibited:** S3/S4 integration or wiring; S6+; S7+ implementation; CP-4+; Model Router V0; dynamic plugin discovery; credentials/secrets; remote D1/R2; Cloudflare Access/DNS/domain/deployment/rollback/production mutation; production-data writes; public D1 cutover; protected/main merge; PR #10 merge or auto-merge.
### D-066 — Authorize Sentinel S6 Isolated Execution proposal

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After `ML-DEVOS-AS-085` passed S5 D.2 and the repository routed `TURN: PAULO` / `PAULO_DECISION_REQUIRED`, Paulo explicitly stated: `yes proceed`.
- **Decision:** Authorize the next sequential Sentinel phase, **S6 — Isolated Execution**, for discovery, architecture proposal, and audit only. Allocate `ML-DEVOS-RFC-019` as the next RFC.
- **Roadmap basis:** `ML-DEVOS-SIP-001` defines S6 as task-scoped branch/worktree/sandbox isolation for Builder and QA work. This decision advances that roadmap gate only; it does not declare S6 implemented.
- **Change class:** `ARCHITECTURE`. The proposal requires independent Architect review and a later explicit Paulo implementation decision before executable S6 behavior may be introduced.
- **Proposal objective:** define a provider-neutral isolation boundary that prevents one governed task, Builder session, or QA run from silently mutating or contaminating another task's working state while preserving independent QA execution and explicit repository/task identity.
- **Required design analysis:** define the isolation threat model; task → repository/base-ref/branch/worktree/sandbox identity; clean-base and freshness rules; writable/read-only boundaries; path/symlink/escape handling; process/environment isolation expectations; dependency/cache handling; secret/credential non-copy rules; untracked-file and dirty-tree handling; concurrent-task collision behavior; lifecycle create/claim/use/renew/cleanup/recovery; crash/orphan recovery; stale branch/worktree handling; idempotency and retries; Windows/POSIX portability; evidence/provenance requirements; deterministic failure modes; rollback/cleanup semantics; and the testing/mutation/failure-injection plan.
- **Required composition analysis:** S6 must consume S3 Task Contract scope by reference without redefining S3; use S4 task ownership/lease/fencing semantics rather than creating a second task state machine; consume S5 CapabilityDecision outcomes without treating Capability as Authority; and preserve TB-4 so QA executes independently rather than reusing the Builder's mutable execution environment.
- **Canonical-home question:** RFC-019 must explicitly propose and justify S6's canonical repository/runtime location because the current S2 manifest has no dedicated S6 reserved subsystem root. The proposal may recommend a future root or integration surface, but this decision does **not** authorize creating executable S6 directories, changing the manifest, or changing reserved-root ownership.
- **Security boundary:** the proposal must distinguish repository/worktree isolation from stronger OS/container/VM sandboxing and state exactly what V1 can and cannot contain. It must fail closed where the environment cannot prove the required isolation property. No claim of security isolation may exceed the actual mechanism proposed.
- **No implementation authority:** no executable S6 isolation engine, branch/worktree manager, sandbox runner, filesystem guard, container/VM integration, S3/S4/S5 runtime wiring, new executable reserved root, manifest-status change, closure ADR, Sentinel version change, or frozen-architecture mutation is authorized by D-066.
- **Authorized proposal files:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md`; `devos/changes/rfcs/README.md`; deterministic traceability outputs only if regeneration changes them; and normal Context Bootstrap coordination/handoff evidence needed to return the proposal for review.
- **Evidence and audit:** report exact changed files, validation/test commands and exit codes, and before/after traceability fingerprints. Preserve and disclose the known `CORE-022` and `WEB-REQ-009` traceability errors unless separately and legitimately resolved; introduce no unexpected hard ERROR and do not suppress debt to manufacture zero.
- **LEAN / DELTA-ONLY:** Builder reads live STATE, D-066, `ML-DEVOS-SIP-001`'s S6 row/rules, relevant frozen architecture/trust-boundary sections, accepted S3/S4/S5 public contracts only as needed for composition, the RFC template/change policy, Context Bootstrap V0 publication rules, and operative obligations. Broader history only when a concrete S6 design question requires it.
- **Return gate:** Builder publishes the bounded RFC-019 proposal and a new CURRENT_HANDOFF, then returns `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES` for independent S6 architecture review under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-085`.
- **Still prohibited:** S6 executable implementation; S7+; Context Plane CP-4+; Model Router V0; S5 runtime wiring; dynamic plugin discovery; credentials/secrets; remote D1/R2; Cloudflare Access/DNS/domain/deployment/rollback/production mutation; production-data writes; public D1 cutover; protected/main merge; PR #10 merge or auto-merge.

### D-067 — Authorize one exceptional S6 RFC-019 remediation cycle for AS88-F001

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After `ML-DEVOS-AS-088` routed S6 to `TURN: PAULO` because the normal 2-of-2 remediation budget was exhausted, Paulo instructed: `ok do the recomendation but before execution think again`. The Architect then rechecked the live Context Bootstrap authority fields, the RFC-019 Result Transfer Record/publication ordering, the S4 payload/idempotency contract, and the prior owner-decision publication pattern before executing this decision.
- **Decision:** Continue S6 with exactly one exceptional, narrowly bounded **Remediation Cycle 3** for `AS88-F001` only. For this S6 design cycle only, raise `MAX_REMEDIATION_CYCLES` from `2` to `3` and set `CURRENT_REMEDIATION_CYCLE` to `3`. This is a one-cycle owner override, not a change to the normal remediation budget or a precedent for later phases.
- **Required correction:** remove the circular publication-provenance dependency in `ML-DEVOS-RFC-019`. The preferred design is to replace the payload's current self-referential `provenance_digest` with a non-circular value such as `prepublication_provenance_digest`, defined as the hash-chained journal head immediately **before** the PENDING Result Transfer Record is appended.
- **Required construction order:** (1) compute the pre-PENDING journal head; (2) build and serialize the already-accepted Builder publication `evidenceRef` using that fixed digest; (3) write the PENDING RTR containing those exact serialized bytes; (4) append/hash the PENDING entry normally; (5) if proof of the PENDING record itself is needed, record a separate `pending_record_digest` or later journal head **outside** the publication payload. No cryptographic fixed-point/self-hash construction is authorized.
- **Must preserve:** `evidenceClass: "ACTOR_REPORTED"`; the accepted Result Transfer Record/S4 publication model; byte/content-identical replay binding; S4 unchanged; S7 not implemented early; independent QA separation; MAY/CAN/ISOLATED separation; existing AS86/AS87 findings remain closed.
- **Authorized proposal surfaces only:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md`; `devos/changes/rfcs/README.md` only if directly necessary; deterministic traceability outputs if regeneration changes them; and normal Context Bootstrap `coordination/STATE.md` / `coordination/CURRENT_HANDOFF.md` evidence required to return the turn.
- **Required verification:** demonstrate in the RFC/test plan that the payload can be constructed deterministically without containing a hash over itself; that the prepublication digest is computed before the PENDING RTR; that the PENDING record can then be hashed normally; that crash-recovery replay still reuses the identical stored `evidenceRef`; and that mutation/corruption fails closed as `RESULT_TRANSFER_UNPROVEN` or the existing bounded failure vocabulary.
- **Return gate:** Builder returns `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, with a fresh CURRENT_HANDOFF for final independent S6 design review. Architect must not treat D-067 as implementation authority.
- **No implementation authority:** no executable S6 engine, `devos/execution/` root creation, manifest change, S3/S4/S5 implementation/interface mutation, S5 runtime wiring, transport authorization, S7+, CP-4+, Model Router, credentials/secrets, remote D1/R2, deployment, production mutation, protected/main merge, or PR #10 merge/auto-merge is authorized.
- **Traceability/evidence:** preserve the known `CORE-022` and `WEB-REQ-009` traceability debt unless separately and legitimately resolved; introduce no new unexpected hard ERROR and do not suppress existing debt.

### D-068 — Authorize bounded Sentinel S6 Isolated Execution V1 implementation

- **Decided by:** Paulo (Product / Risk Owner).
- **Decision input:** After `ML-DEVOS-AS-089` independently ARCHITECT_APPROVED `ML-DEVOS-RFC-019` and routed `TURN: PAULO / PAULO_DECISION_REQUIRED`, Paulo explicitly stated: `yes proceed`.
- **Decision:** Authorize one bounded implementation cycle for **S6 — Isolated Execution V1** exactly as designed by `ML-DEVOS-RFC-019` and accepted by `ML-DEVOS-AS-089`. This is implementation authority only; it is not S6 closure, deployment, production authority, S7 authority, or a standing remote-operation grant.
- **New implementation cycle:** route to `CYCLE_ID: SENTINEL_S6_ISOLATED_EXECUTION_IMPLEMENTATION`, `TURN: CLAUDE`, remediation counter reset to `0 / 2`. Claude remains Builder; ChatGPT remains independent Architect reviewer; Paulo remains Product/Risk Owner.
- **Canonical root reservation:** authorize creation of `devos/execution/` as the S6 canonical home and authorize the matching manifest architecture bookkeeping entry exactly as proposed by RFC-019:
  `{ "path": "devos/execution/", "owning_phase": "S6", "consuming_phases": ["S7", "S8"], "status": "NOT_IMPLEMENTED", "executable_runtime_present": false }`.
  No `closure_ref` is added during implementation. `NOT_IMPLEMENTED` must remain until S6 is built, independently reviewed, and separately closed by a later Paulo decision. No manifest schema change is authorized or required.
- **Authorized S6 implementation surface:** under `devos/execution/`, implement only the RFC-019 V1 subsystem: Execution Identity/Fencing Checkpoint structures; platform profile detection; deterministic reason vocabulary/precedence; instance registry and hash-chained journal; non-circular Result Transfer Record and publication payload; dedicated-clone workspace lifecycle; path creation/containment and cleanup guards; environment/HOME/tmp/config/cache construction; process supervision/quiesce hooks; create/validate/attach/use/renew/complete/cleanup/recovery lifecycle host library; isolation provenance; and directly necessary schemas/specification/README support.
- **Authorized tests/fixtures:** focused `tests/execution-*.test.mjs` and narrowly necessary execution fixtures under `tests/fixtures/`; update `tests/devos-manifest.test.mjs` only as necessary to recognize the new S6 `NOT_IMPLEMENTED` reserved root. No unrelated test cleanup.
- **S3 consumption boundary:** S6 may consume validated S3 Task Contract scope and references by existing public/file contract surfaces only. No S3 schema, validator, semantics, contract field, or implementation change is authorized.
- **S4 integration authority:** authorize S6 code to consume the existing public S4 `getState` surface, accept caller-supplied successful `claim`/`renew` result objects, and issue the RFC-019 Builder publication `BUILDING -> READY_FOR_QA` `transition` with the accepted Result Transfer Record/evidence payload. S4 implementation, lifecycle tables, persistence, schemas and public interfaces must remain byte-unchanged. During this implementation cycle, S4 transition execution is limited to focused tests using temporary isolated task stores; no live governance/product task is to be advanced by the new S6 subsystem.
- **S5 integration authority:** authorize S6 to consume the existing S5 gateway through its public static gateway/adapters for the RFC-019 V1 needs only: `shell` decisions for actor/tool-selected commands and `github` decisions for transport operations. No S5 evaluator, minter, policy schema, provider adapter, denial code, or interface mutation is authorized. No other provider is added.
- **Transport handling:** implement the exact RFC-019 transport policy boundary, ref restrictions, lease behavior, provenance and `transport_authorization_ref` requirement. **No standing real GitHub transport authority is granted to the S6 subsystem by D-068.** Implementation/failure tests must use temporary local bare Git repositories or deterministic synthetic/mocked provider results and may not use live credentials or cause S6-managed network writes. A separate Paulo pilot/closure decision is required before the new subsystem may perform real remote Git fetch/push as an S6 action. Normal Context Bootstrap publication of the Builder's governed implementation commit is not an S6 runtime transport trial and remains governed by the existing repository protocol.
- **Credential boundary:** no real secret values, tokens, SSH keys, credential helpers, cloud credentials or secret-shaped fixtures. S6 must prove that task instances receive no credential-bearing environment/config; tests use clearly fake canaries.
- **Isolation strength:** implement V1 as L1 + dedicated-clone L2 + L3 environment/process/filesystem policy. Do not claim L4, hostile-process containment, container/VM sandboxing, or security isolation beyond RFC-019.
- **Required verification:** implement the full RFC-019 §18 failure-injection/mutation strategy as far as the available host permits, including every deterministic reason code and precedence, fencing/stale-owner behavior, S4 publication/replay, non-circular RTR provenance, QA independence, path/symlink/junction escape behavior, process/quiesce failures, environment/secret canaries, transport/ref denial, crash/orphan/quarantine recovery, and mutation tests. Use real Git/filesystems/processes for behavior tests rather than prose-only fixtures.
- **Platform evidence honesty:** run the real platform matrix actually available. POSIX and Windows-specific logic must both be covered by deterministic unit/model tests where possible; a platform that was not genuinely executed must be reported `NOT RUN`, never PASS. A later closure may remain blocked pending required independent Windows/POSIX reproduction.
- **Full regression:** run the complete repository test suite, manifest validator, capability-policy validator, task-contract validator, rules/waiver validators, skills bridge checks, `git diff --check`, and deterministic traceability generation/validation. Preserve the known `CORE-022` and `WEB-REQ-009` traceability errors unless separately and legitimately resolved; introduce no unexpected hard ERROR.
- **Evidence classification:** Builder execution is `ACTOR_REPORTED` until independently inspected/reproduced. Do not label S6's own provenance stronger than `ACTOR_REPORTED`; no `RUNTIME_OBSERVED` claim applies.
- **Implementation mutation whitelist:** `devos/execution/**`; `devos/devos-manifest.json` only for the S6 NOT_IMPLEMENTED reserved-root entry and `updated_at` if required; `tests/execution-*.test.mjs`; narrowly necessary `tests/fixtures/**`; `tests/devos-manifest.test.mjs`; `devos/changes/rfcs/ML-DEVOS-RFC-019.md` and `devos/changes/rfcs/README.md` only for factual implementation provenance/status wording that does not claim closure; deterministic traceability outputs; and normal Context Bootstrap coordination/handoff evidence. No manifest schema/validator mutation unless a concrete incompatibility is discovered and separately returned to Architect/Paulo rather than silently widened.
- **Version / closure disposition:** Sentinel capability baseline remains exactly **v1.8.0** during implementation. No closure ADR, `IMPLEMENTED` manifest status, `closure_ref`, closure-history entry, baseline/version bump, or final RFC closure is authorized. After technical implementation review, S6 follows the existing D.1 preflight -> Paulo closure decision -> D.2 post-decision verification lifecycle. A future S6 closure is expected to evaluate a MINOR transition but no version is preselected here.
- **Return gate:** Builder publishes one coherent bounded implementation/handoff and returns `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, with exact changed files, tests/exit codes, platform matrix, mutation/failure evidence, traceability fingerprint, residual limitations, and no self-approval. Architect performs independent source/security/interface review before any closure or live transport decision.
- **Still prohibited:** S7+ implementation; S8 orchestration; S9 evidence gate; CP-4+; Model Router; dynamic plugin discovery; changes to S3/S4/S5 implementation/interfaces; live S6 remote transport; credentials/secrets; remote D1/R2; Cloudflare Access/DNS/domain/deployment/rollback/production mutation; production-data writes; public D1 cutover; protected/main merge; PR #10 merge/auto-merge; automatic stale-branch deletion; L4/container/VM work.

### D-069 — Suspend S6 V1 implementation and authorize execution-boundary design amendment

- **Decided by:** Paulo (Product / Risk Owner), after the Architect's advisory diagnosis of the D-068 implementation safety block.
- **Decision:** Suspend further executable implementation under D-068 at the current safe point and authorize one bounded architecture/design amendment to `ML-DEVOS-RFC-019` only. The amendment must separate S6 execution identity/isolation/control from actual actor- or tool-chosen command execution.
- **Reason:** During the authorized D-068 implementation, the Builder reported that its session safety control blocked the generic command-running surface (`run()` -> process spawn) as an RCE surface. The blocked behavior is not incidental: RFC-019 currently states that S6 executes actor/tool-chosen commands, records them, supervises their process tree, and uses S5 `shell` decisions per command. Governance authorization does not override provider/runtime safety controls, and the block therefore exposes a real architecture seam that must be resolved rather than bypassed.
- **Preserve, do not publish, the local draft:** the Builder's existing uncommitted/unpushed S6 draft may be kept locally as evidence/work product. It must not be deleted, staged, committed, pushed, or used to bypass the safety block while this amendment is active. If a clean worktree is needed for the documentation amendment, it must be based on the authoritative governed tip and must not import the blocked draft.
- **Required architectural direction:** S6 V1 remains the owner of execution identity, dedicated-clone/workspace isolation, environment construction and validation, S4-derived fencing, path confinement, journal/RTR/provenance, cleanliness and scope validation, quiescence requirements, completion/publication control, and independent-QA reconstruction. S6 core must not expose a generic `run(arbitraryCommand)` / raw actor-command `spawn()` primitive.
- **Execution-driver separation:** actual actor/tool-selected command execution becomes a distinct execution-driver boundary. The amended RFC must define how a separately authorized driver receives an already-authorized execution request, runs only within an S6-proven workspace/environment, and returns process/result/provenance evidence to S6. The driver must not become a new source of MAY authority, S4 ownership, S5 policy evaluation, or S6 identity.
- **S5 relationship:** the amendment must preserve S5's existing role as CAN authority. Actor/tool-chosen command execution still requires the applicable S5 `shell` decision, but S6 core consumes the decision/evidence boundary rather than itself becoming a generic command executor. No S5 implementation/interface mutation is authorized.
- **Testing direction:** the amendment must specify how S6 core can be tested with fixed deterministic commands, injected/fake drivers, or other bounded local fixtures without requiring a generic arbitrary-command execution API. Any later real execution-driver implementation requires separate review and explicit Paulo authorization.
- **Safety rule:** no permission expansion, alternate execution route, wrapper, subprocess indirection, or other mechanism may be introduced merely to defeat or weaken a provider/runtime safety control. A safety block is a stop signal and architecture input, not an obstacle to route around.
- **Authorized repository mutation for this cycle:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md`; `devos/changes/rfcs/README.md` only if needed for factual proposal/status indexing; deterministic traceability outputs if the RFC delta requires regeneration; and normal `coordination/STATE.md` / `coordination/CURRENT_HANDOFF.md` return records. No executable S6 file, manifest entry, schema/runtime file, S3/S4/S5 source/interface, test implementation, ADR, closure record, or version baseline may be changed.
- **D-068 disposition:** D-068 is **suspended**, not treated as successfully completed. Its executable implementation authority may not be resumed merely because the RFC text is edited. After the amended RFC returns, the Architect must independently review the design; any resumed S6 implementation requires a fresh explicit Paulo implementation decision bound to the amended design.
- **Return gate:** Claude / Builder performs only the bounded RFC amendment, publishes a fresh CURRENT_HANDOFF, and returns `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for independent architecture review. Builder evidence remains `ACTOR_REPORTED` where applicable and the Builder does not self-approve the amendment.
- **Hard boundaries:** no S6 executable implementation; no generic command-execution implementation; no bypass of the safety control; no manifest/root status change; no S6 closure; no Sentinel version bump; no S7+; no live S6 remote transport; no credentials; no remote D1/R2; no Cloudflare production mutation; no protected/main merge; no PR #10 merge.
- **Evidence of Paulo authority:** after the Architect explained the execution-boundary correction and stated that proceeding required explicit owner approval of the "S6 execution-boundary amendment," Paulo replied `ok`. This decision records that approval narrowly; it is not blanket authority for implementation beyond the design-amendment scope above.

### D-070 — Authorize exceptional AS92-F001-only S6 design micro-remediation

- **Decided by:** Paulo (Product / Risk Owner), following Architect Sync `ML-DEVOS-AS-092`.
- **Decision:** Authorize exactly one exceptional micro-remediation beyond the ordinary 2-of-2 remediation cap, limited solely to `AS92-F001` in `ML-DEVOS-RFC-019`.
- **Reason for exception:** `ML-DEVOS-AS-092` closed `AS91-F001` and preserved `AS90-F001`–`F003` as closed, but identified one narrow identity/capability binding defect after the ordinary remediation budget was exhausted: the trusted S5 subject used for shell capability decisions is not explicitly bound to the S6 instance's immutable Execution Identity `owner` / `role`.
- **Required correction only:** define the V1 role mapping `BUILDER -> Builder` and `QA -> QA`; at permit issuance require the trusted S5 subject `actor_id` to equal `ExecutionIdentity.owner` and `actor_role` to equal the mapped `ExecutionIdentity.role`; bind those non-secret subject fields inspectably into the immutable permit/audit record; at claim-time recheck compare the fresh trusted S5 subject against the same immutable S6 identity / stored subject binding; fail closed as `CAPABILITY_DENIED` on mismatch; add focused design tests for wrong actor ID, wrong role, claim-time identity drift, and correct Builder/QA mapping.
- **Preservation rule:** do not reopen or weaken `AS90-F001`, `AS90-F002`, `AS90-F003`, `AS91-F001`, or the accepted D-069 execution-driver separation. Do not alter S5 semantics or interfaces, add argv to S5, or redesign S4/S5/S6.
- **Cycle rule:** this creates one exceptional remediation cycle, recorded as Cycle 3 of 3 for this amendment. No further remediation cycle is implied or authorized. If a blocker remains after the corresponding Architect re-review, route to Paulo again rather than extending the budget.
- **Authorized repository writes:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md`; `devos/changes/rfcs/README.md` only if factual status/index wording requires it; deterministic traceability outputs; and normal `coordination/STATE.md` / `coordination/CURRENT_HANDOFF.md` return records.
- **Local draft boundary:** the unpublished D-068 implementation draft remains local, uncommitted and unpushed. It must not be imported, staged, committed, executed further, or used to bypass any safety control during this design remediation.
- **D-068 disposition:** remains suspended. This decision does not resume S6 executable implementation and does not authorize a real execution driver.
- **Return gate:** Claude / Builder corrects only `AS92-F001`, publishes a fresh handoff, and returns `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for final independent re-review.
- **Hard boundaries:** no safety-control bypass; no S6 executable implementation; no generic command-execution implementation; no real execution-driver implementation; no manifest/root mutation; no S3/S4/S5 implementation/interface mutation; no S6 closure; no Sentinel version bump; no S7+; no live S6 remote transport or credentials; no remote D1/R2; no Cloudflare production/deployment mutation; no protected/main merge; no PR #10 merge.
- **Evidence of Paulo authority:** Paulo explicitly stated, `Authorize exceptional AS92-F001 micro-remediation.`

### D-071 — Authorize bounded S6-core implementation against AS-093-approved RFC-019

- **Decided by:** Paulo (Product / Risk Owner), following final Architect approval `ML-DEVOS-AS-093`.
- **Decision:** Authorize one fresh bounded implementation cycle for the **S6 core only**, against the `D-069` / `D-070` amended `ML-DEVOS-RFC-019` as approved by `ML-DEVOS-AS-093`.
- **Supersession / relation to D-068:** `D-068` remains suspended and is not revived. This decision is the new implementation authority and must be interpreted only against the AS-093-approved amended design.
- **Core boundary:** S6 core may implement execution identity; fencing checkpoint adoption/verification; dedicated-clone workspace lifecycle; platform/path/environment validation; registry/journal/hash-chain; Result Transfer Record; transport-policy/ref/lease/provenance logic; permit/request/report schemas and lifecycle; request idempotency; S5 issuance and claim-time checks; S5-subject-to-S6-owner/role binding; quiescence proof; completion/publication control; QA reconstruction; cleanup/recovery; reason vocabulary/precedence; and supporting documentation/tests required by RFC-019.
- **No generic executor:** S6 core MUST NOT expose or implement a generic `run(arbitraryCommand)`, caller-supplied `spawn()`, shell-command bridge, or any equivalent actor/tool-chosen command-execution primitive.
- **Real execution driver excluded:** no real execution driver that runs actor- or tool-chosen commands is authorized. Such a driver still requires its own reviewed design and a separate explicit Paulo implementation decision.
- **Permitted test mechanism only:** focused tests may use an injected fake driver that executes nothing, plus bounded fixed deterministic fixture operations with literal checked-in behavior exactly as RFC-019 allows. Test fixtures must not accept caller-supplied command strings/argv and must not be generalized into an execution driver. If any provider/runtime safety control blocks even a bounded test operation, stop and return to Architect/Paulo; do not broaden permissions or route around the block.
- **S5/S4 boundary:** consume only existing accepted public S4/S5 interfaces. No S3/S4/S5 source, schema, interface, policy semantics, evaluator/minter, lifecycle or persistence mutation is authorized. S5 remains CAN authority, not argv authority. S4 remains the task-state/fencing authority.
- **Manifest/root authorization:** create the canonical `devos/execution/` S6 root and add the already-approved manifest entry only as `status: "NOT_IMPLEMENTED"`, `executable_runtime_present: false`, with no `closure_ref`. This does not close S6.
- **Implementation evidence:** Builder evidence remains `ACTOR_REPORTED` until independent review. Windows/macOS/Linux claims must reflect actual execution; unrun platform cases must be reported as NOT RUN, never inferred as PASS.
- **Required validation:** implement the applicable RFC-019 §18 tests for the S6 core boundary, including identity/fencing, path/TOCTOU fail-closed behavior, environment stripping, permit lifecycle/idempotency, S5 request binding, claim-time live revocation/expiry, subject-owner/role binding, RTR replay/non-circular provenance, cleanup/recovery, transport denials, QA reconstruction, and mutation/failure cases that can be exercised without a real generic execution driver. Run full repository regressions/validators/traceability and report exact exit codes.
- **Remote transport:** design/implement the S6 transport logic and policy checks only with local bare repositories or synthetic/mocked provider results. No standing real GitHub transport authority, live S6 network write, real credential use, protected ref mutation, force push, delete, tag, PR setting or repository-setting mutation is authorized.
- **Authorized repository writes:** `devos/execution/**`; the one S6 `devos/devos-manifest.json` root entry and narrowly necessary `tests/devos-manifest.test.mjs` update; `tests/execution-*.test.mjs`; narrowly necessary `tests/fixtures/**`; RFC-019 / RFC index only for factual implementation-status/provenance notes that do not claim closure; deterministic traceability outputs; and normal coordination/handoff records.
- **Version/closure rule:** Sentinel remains `v1.8.0`. Do not set S6 to `IMPLEMENTED`, do not add `closure_ref`, do not create a closure ADR/history entry, and do not bump the Sentinel version. Those remain post-implementation/post-review owner-gated work.
- **Return gate:** after the bounded implementation, Claude / Builder publishes a fresh handoff and returns `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for independent implementation review. Include changed files, exact test/validator exit codes, platform matrix, failure/mutation evidence, traceability result, residual limitations, and explicit confirmation that no real execution driver or live remote transport was introduced.
- **Hard boundaries:** no safety-control bypass; no real generic execution driver; no S7+; no S8/S9; no Model Router; no CP-4+; no dynamic plugin discovery; no remote D1/R2; no Cloudflare production/deployment mutation; no production-data writes; no public D1 cutover; no protected/main merge; no PR #10 merge/auto-merge; no L4/container/VM implementation; no automatic stale-branch deletion.
- **Evidence of Paulo authority:** Paulo explicitly stated, `Authorize bounded S6-core implementation against the AS-093-approved amended RFC-019, excluding any real generic execution driver.`

### D-072 — Authorize exceptional AS96-F001-only S6 implementation micro-remediation

- **Decided by:** Paulo (Product / Risk Owner), following Architect Sync `ML-DEVOS-AS-096`.
- **Decision:** Authorize exactly one exceptional micro-remediation beyond the ordinary 2-of-2 S6 implementation remediation cap, limited solely to `AS96-F001`.
- **Reason for exception:** `ML-DEVOS-AS-096` independently closed `AS95-F001` and `AS95-F002` and preserved all previously closed AS94 findings, but identified one narrow publication-transaction reservation defect after the ordinary remediation budget was exhausted: an unresolved `PENDING` Result Transfer Record does not yet reserve the local instance lifecycle against incompatible terminal operations while the external S4 publication transition is in flight.
- **Required correction only:** treat an unresolved PENDING RTR for an instance as an active durable publication reservation; block `finishWithoutPublication()` and `cleanup()` from crossing that reservation; inspect every other mutable local lifecycle operation and explicitly classify it as allowed or blocked while PENDING; preserve crash recovery / `resolvePending()`; preserve quarantine semantics; keep the external S4 transition outside the S6 task lock; add deterministic publication-vs-finish/cleanup interleaving tests, ABORTED/COMMITTED recovery tests and a mutation test that proves removal of the reservation guard is detected.
- **Preservation rule:** do not reopen or weaken AS94-F001/F002/F003/F004, AS95-F001/F002, D-069 execution-driver separation, D-070 S5 subject binding, D-071 implementation boundaries, permit lifecycle/idempotency, claim-time S5 freshness, shared local linearization/CAS, quiesce fencing, RTR non-circular provenance, or the existing S4/S5 public contracts.
- **Transaction rule:** the correction must preserve the write-ahead protocol `QUIESCED -> PENDING RTR -> external S4 transition -> COMMITTED/ABORTED RTR`. Do not hold the local S6 task lock across the external S4 transition merely to suppress the race. The durable PENDING record is the reservation boundary.
- **Cycle rule:** this creates one exceptional remediation cycle, recorded as Cycle 3 of 3 for the current S6 implementation cycle. No further remediation cycle is implied or authorized. If a blocker remains after the corresponding Architect re-review, route to Paulo again rather than extending the budget.
- **Authorized repository writes:** `devos/execution/**`; `tests/execution-*.test.mjs`; narrowly necessary `tests/fixtures/execution/**`; deterministic traceability outputs if required; `ML-DEVOS-RFC-019.md` / `devos/execution/README.md` only for factual remediation notes with no architecture redesign; and normal `coordination/STATE.md` / `coordination/CURRENT_HANDOFF.md` return records.
- **Manifest / closure boundary:** do not change the S6 manifest entry. S6 remains `NOT_IMPLEMENTED`, `executable_runtime_present: false`, with no `closure_ref`. Sentinel remains `v1.8.0`.
- **S4/S5 boundary:** no S3/S4/S5 source, schema, interface, policy, evaluator/minter, persistence or lifecycle mutation is authorized.
- **Execution boundary:** no real generic execution driver, no generic command-execution primitive, no live S6 remote transport, and no real credential use are authorized.
- **Return gate:** Claude / Builder corrects only `AS96-F001`, publishes a fresh handoff, and returns `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for final independent re-review. The handoff must include the explicit PENDING-operation classification, deterministic interleaving evidence, exact test/validator exit codes, traceability result, and confirmation that all closed AS94/AS95 findings remain preserved.
- **Hard boundaries:** no safety-control bypass; no permission expansion; no S6 closure/version bump; no S7+; no S8/S9; no CP-4+; no Model Router; no dynamic plugin discovery; no remote D1/R2; no Cloudflare production/deployment mutation; no production-data writes; no public D1 cutover; no protected/main merge; no PR #10 merge/auto-merge; no automatic stale-branch deletion; no L4/container/VM implementation.
- **Evidence of Paulo authority:** Paulo explicitly stated, `Authorize exceptional AS96-F001-only S6 implementation micro-remediation.`

### D-073 — Authorize S6 Integrity Hardening architecture-planning cycle with SU evidence review

- **Decided by:** Paulo (Product / Risk Owner), after the broader Architect Sync reassessment following `ML-DEVOS-AS-097`.
- **Decision:** Do not authorize another implementation-only micro-remediation. Pause S6 implementation and authorize one bounded **architecture-planning / RFC-019 hardening amendment cycle** to consolidate the newly discovered crash-consistency, concurrency, provenance and public-capability-boundary findings into design invariants before any further Builder implementation.
- **SU requirement:** planning must invoke the SU evidence-first research method as an advisory research input. SU must test, not merely confirm, the proposed direction against current public evidence and established systems practice, including durable transactions/write-ahead recovery, crash consistency, idempotency, linearizability/serialization, state-machine safety, provenance/audit integrity, external-effect replay, and fault-injection methodology. Research evidence does not grant authority and does not override repository architecture.
- **Primary architecture questions:** (1) authoritative durable truth / transaction model for instance, permit, RTR, journal and external effects; (2) explicit S6 instance-concurrency invariant rather than relying on S4 to imply uniqueness; (3) production public-vs-internal capability surface, including mutable registry exposure; (4) exact S6 Isolation Provenance boundary versus S7 Evidence/QA responsibilities; (5) systematic crash/fault matrix and recovery semantics.
- **Current implementation disposition:** the existing S6 core at the current branch remains evidence/work product. It is not deleted, not closed, not marked IMPLEMENTED, and not treated as rejected wholesale. Previously closed AS94/AS95 findings remain closed unless the amendment explicitly demonstrates an architectural conflict requiring a separately reviewed change.
- **AS97-F001 disposition:** retained as an implementation finding and input to the hardening amendment; no standalone AS97 implementation patch is authorized during planning.
- **Authorized writes:** `devos/changes/rfcs/ML-DEVOS-RFC-019.md`; `devos/changes/rfcs/README.md` only if factual status/index wording requires it; a durable Architect Sync / planning record under `devos/changes/architect-syncs/`; `brain/KNOWLEDGE_PRINCIPLES.md` only for deduplicated engineering lessons that pass the existing Treasury procedure; deterministic traceability outputs if the RFC delta requires regeneration; and normal `coordination/STATE.md` / `coordination/ARCHITECT_REVIEW.md` / `coordination/CURRENT_HANDOFF.md` records.
- **No implementation authority:** no `devos/execution/**` source/test mutation is authorized in this planning cycle; no new execution driver; no S3/S4/S5 mutation; no S7 implementation; no manifest/root/closure/version mutation.
- **Return gate:** Architect completes SU-grounded planning and publishes an RFC-019 hardening proposal plus Architect planning verdict identifying which findings are implementation defects, which are design amendments, which are S7 responsibilities, and the exact future implementation gate. Any resumed implementation requires a fresh explicit Paulo decision after independent review of the amended design.
- **Anti-bloat rule:** the amendment must fix classes of failure, not add open-ended governance. It must define an exit condition back to capability delivery and preserve the frozen S0 roadmap unless a real conflict requires a separately classified architecture amendment.
- **Evidence of Paulo authority:** Paulo instructed, `Proceed invoke su during planing`, after the Architect recommended a bounded RFC-019 architecture-hardening amendment instead of another isolated implementation patch.

### D-074 — Authorize bounded S6-core integrity-hardening implementation against AS-101-approved RFC-019

- **Decided by:** Paulo (Product / Risk Owner), following final Architect design approval `ML-DEVOS-AS-101` and the SU pre-implementation falsification pass.
- **Decision:** Authorize one fresh bounded implementation cycle for the authoritative tracked S6 core against the D-073 integrity-hardened `ML-DEVOS-RFC-019` as accepted by `ML-DEVOS-AS-101`.
- **Relation to earlier implementation authority:** D-071 and D-072 do not supply authority for this new hardened implementation. D-068 remains suspended and is not revived. D-074 is the fresh implementation authority bound specifically to the AS-101-approved design.
- **Implementation target:** harden the authoritative tracked `devos/execution/**` subsystem against RFC-019 §13.2–§13.6 and §18. The existing tracked S6 implementation is work product to be corrected; its existence does not prove conformance.
- **Transaction-substrate gate:** implementation must begin by proving the selected per-task transaction substrate can satisfy RFC-019's required atomic semantics on the actually supported target platform/profile. The preferred V1 candidate is the crash-atomic per-task envelope plus immutable content-addressed blobs. If the required replace-atomicity cannot be demonstrated, STOP and return for a separately governed storage-backend decision. Do not silently revert to independently mutable files and do not silently substitute SQLite.
- **Reference-model requirement:** implement the bounded pure reference model early and require I1–I13, Q1–Q5b and Mutants A–C. Runtime behavior selected for replay must agree with the reference model.
- **Core hardening scope:** implement the accepted local transaction boundary; prepare → effect → reconcile external-effect model; one-ACTIVE-environment-per-task slot; publication and other reservations; claim execution-uncertainty reservations; per-group liveness obligations; exact-target operator resolution; atomic late-report handoff from claim uncertainty to liveness obligations; fail-closed PENDING attribution; private mutable-store boundary; deterministic Isolation Provenance projection; recovery semantics; crash/interleaving matrix; and directly necessary source/tests.
- **Historical claim rule:** historical permit status and unresolved execution influence are separate facts. A `CLAIMED` permit reserves the task slot only while its exact claim execution-uncertainty reservation remains `OPEN`.
- **Exact-target resolution rule:** proof and operator resolution close only explicitly named reservations. Operator resolution remains `ACTOR_REPORTED`, not proof. It must not restore, un-quarantine or make an instance publishable.
- **No generic executor:** S6 core MUST NOT implement or expose `run(arbitraryCommand)`, arbitrary caller-supplied `spawn()`, a shell bridge, generic argv execution, or an equivalent command-execution primitive.
- **Real execution driver excluded:** no real execution driver is authorized. Testing may use only injected fake drivers that execute nothing and fixed deterministic checked-in fixtures allowed by RFC-019.
- **Authoritative-source rule:** the suspended or untracked local D-068 draft is not authoritative implementation input. Do not stage, commit, push, import or merge it merely because it exists locally.
- **S3/S4/S5 boundary:** consume existing accepted public S4/S5 interfaces only. No S3/S4/S5 implementation, schema, policy, evaluator, persistence or lifecycle mutation is authorized.
- **S7 boundary:** no Evidence Store, Evidence Packet, evidence-sufficiency or S7 implementation work is authorized.
- **Authorized repository writes:** `devos/execution/**`; directly necessary `tests/execution-*.test.mjs`; narrowly necessary `tests/fixtures/execution/**`; RFC-019 / S6 README only for factual implementation-status/provenance notes with no architecture redesign or closure claim; deterministic traceability outputs; and normal coordination/handoff records.
- **Manifest rule:** preserve the existing S6 manifest status as `NOT_IMPLEMENTED`, `executable_runtime_present: false`, with no `closure_ref`, unless a purely mechanical correction is required to keep the existing accepted entry consistent. This decision does not authorize S6 closure.
- **Required validation:** execute the applicable RFC-019 §18 tests, bounded reference-model generation/replay, persistence-point crash/interleaving tests, mutation tests including Mutants A–C, full repository regressions and validators, and report exact exit codes. Platform claims must reflect actual execution; unexecuted platforms must be reported `NOT RUN`.
- **Evidence classification:** Builder-generated implementation/test evidence remains `ACTOR_REPORTED` pending independent Architect inspection/reproduction.
- **Stop condition:** implementation difficulty alone does not reopen architecture. Return for architecture/backend decision only if evidence shows the accepted design cannot satisfy an invariant or the selected transaction substrate cannot meet the required semantics.
- **Return gate:** after the bounded implementation, publish a fresh CURRENT_HANDOFF and return `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for independent implementation review.
- **Hard boundaries:** no real execution driver; no generic command executor; no safety-control bypass; no S7+; no S8/S9; no CP-4+; no Model Router; no dynamic plugin discovery; no remote D1/R2; no production deployment; no production-data writes; no public D1 cutover; no protected/main merge; no PR #10 merge/auto-merge; no automatic stale-branch deletion; no L4/container/VM implementation; no S6 closure/version bump.
- **Evidence of Paulo authority:** after `ML-DEVOS-AS-101` was prepared with the explicit recommendation that Paulo authorize one bounded S6-core hardening implementation, Paulo explicitly replied `authorized`.

### D-075 — Park S6 at AS-103 boundary and authorize bounded MaisogLabs website-redesign planning cycle

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-103` independently accepted the D-074 hardened S6 core and routed the next-gate decision to Paulo.
- **S6 disposition:** Park S6 at the `ML-DEVOS-AS-103` accepted hardened-core boundary. Parking is not closure and does not change the S6 manifest/root state, Sentinel version, or any outstanding S6 obligation.
- **Preserved S6 state:** S6 remains `NOT_IMPLEMENTED`, `executable_runtime_present: false`, with no `closure_ref`; Sentinel remains `v1.8.0`.
- **Preserved S6 carry-forward:** O1 remains open (hardened TaskStore atomicity evidence currently established only for the tested Linux profile; macOS and Windows remain unproven/refused). O2 remains open (unattributable `PENDING` publication fails closed but exceptional audited operator-recovery semantics remain incomplete). The real execution driver remains unimplemented and unauthorized. None of these is waived or resolved by parking S6.
- **D-074 disposition:** D-074 implementation authority is complete and is not standing authority for further S6 work.
- **New cycle:** Open one bounded MaisogLabs public-website redesign **planning / design-governance cycle**.
- **Change class:** Treat this cycle as a proposed `BRAND / COMPOSITION CHANGE` under `brand/V3/DESIGN_GOVERNANCE.md`, because the work may materially recompose the homepage. This decision authorizes the planning and design proposal, not the implementation of that proposal.
- **Design objective:** Re-evaluate the current MaisogLabs public website as a complete first-visit experience and produce a stronger, clearer, more coherent composition while preserving the recognizable MaisogLabs identity and engineering character.
- **Design baseline:** Start from the live Brand V3 sources, including `brand/V3/README.md`, `brand/V3/DESIGN_MAP.md`, `brand/V3/guidelines/V3_DIRECTION.md`, design tokens, `DESIGN-GOV-001`, and `docs/product/DESIGN_REFERENCE_WORKFLOW.md`. Existing design is evidence/baseline, not an instruction that every current composition decision must survive.
- **Identity boundary:** The canonical orbital MaisogLabs identity/logo remains locked. D-075 does not authorize a logo redesign, new logo system, new typography family, or replacement brand identity.
- **Visual direction:** Preserve the established target character: cinematic, modern, calm, premium, engineered and soft-edged; technology/systems should remain dominant, with restrained classical architectural and space/exploration influence. Avoid generic SaaS, gaming-HUD overload, neon cyberpunk, generic AI-brain/robot imagery and decorative complexity that weakens clarity.
- **Design Panel requirement:** The Architect must conduct the redesign through a structured multi-perspective Design Panel. At minimum the review must include: Brand / Art Direction, Information Architecture / UX, Interaction / Motion, Frontend Feasibility, Responsive / Accessibility, Independent Critic, and Layperson / First-Time Visitor perspectives. Panel roles are advisory; Paulo remains Product / Risk Owner and the Architect owns synthesis/review.
- **Independent Critic requirement:** The critic must actively challenge consensus, identify gimmicks, unnecessary complexity, weak copy, over-attachment to existing composition, poor hierarchy, weak interaction logic and visual decisions that are merely polished rather than genuinely strong.
- **First-Time Visitor requirement:** The layperson review must test whether a new visitor can understand, without prior MaisogLabs context: what MaisogLabs is, who is behind it, what is being built, what can be interacted with, why the projects matter, and what technical/brand language means.
- **Required current-state audit:** Inspect the actual current public homepage and directly relevant source surfaces, including `app/page.js`, `app/globals.css`, relevant public components, Brand V3 assets and WEB-INC-007 design controls. Distinguish current strengths, current failures and technical constraints.
- **Required design outputs:** Produce a bounded Website Redesign V1 proposal containing: first-visit narrative; information hierarchy; section architecture; desktop composition; mobile/narrow composition; navigation/header treatment; hero treatment; project presentation; process/about/footer treatment; interaction/motion direction; responsive behavior; accessibility/readability requirements; asset requirements; and implementation acceptance criteria.
- **Reference mapping:** Where screenshots or external references are used, classify each relevant characteristic as `DIRECT MATCH`, `APPROXIMATION`, or `GAP` under `DESIGN_REFERENCE_WORKFLOW.md`. References are analysis input, not authority and not executable styling instructions.
- **WEB-INC-007 boundary:** Existing WEB-INC-007 controls may be reused where sufficient. A design GAP must not silently become arbitrary source-code mutation, raw D1 styling, free-form CSS/HTML/JS, or a hidden new runtime control. Source-code expansion must be explicitly listed in the final implementation proposal.
- **Asset rule:** Any new MaisogLabs visual/image asset proposed or generated for the redesign must be treated as an individual asset tied to one explicit section/purpose. Do not use collage sheets as production assets. Decorative imagery must not contain baked-in UI or essential copy.
- **Content rule:** The planning cycle may recommend copy/content changes needed for first-visit clarity, but it does not authorize editorial/content mutation.
- **Architecture rule:** This cycle may identify components, layout patterns, presets or asset changes required by the redesign, but it must not alter application architecture, authentication, D1 schemas, admin mutation semantics or Sentinel governance merely for visual convenience.
- **Planning write scope:** Architect planning may create/update only directly necessary design proposal/review artifacts under `docs/product/`, Architect coordination/sync records, and deterministic traceability outputs if required. Existing Brand V3 source-of-truth files should be treated as read-only during planning unless a later explicit Paulo decision approves their replacement/amendment.
- **No implementation authority:** No `app/**`, `components/**`, `public/**`, `worker/**`, migration, D1, admin runtime, production design setting, or website implementation mutation is authorized by D-075.
- **No publication/deployment authority:** No public website publish, Cloudflare production deployment, production D1 mutation, remote R2 mutation, DNS/Access change, protected/main merge or PR #10 merge is authorized.
- **Return gate:** The Architect must return a coherent Website Redesign V1 proposal and verdict to Paulo. The proposal must clearly separate: (1) design decisions recommended for acceptance; (2) changes expressible through existing WEB-INC-007 controls; (3) source-code/component GAPs requiring implementation authority; (4) asset-generation needs; (5) risks and unresolved choices; and (6) the exact bounded future implementation scope.
- **Implementation gate:** Claude / Builder receives no website implementation turn until Paulo explicitly approves the resulting design proposal and publishes a separate implementation decision.
- **S6 isolation:** No S6, S7, execution-driver, O1/O2, manifest, closure or Sentinel-version work is authorized in this website cycle.
- **Evidence of Paulo authority:** After `ML-DEVOS-AS-103` routed the next-gate decision to Paulo, Paulo explicitly stated: `Authorize parking S6 at the AS-103 accepted hardened-core boundary and open a new bounded MaisogLabs website redesign cycle.`

### D-076 — Authorize bounded Website Redesign V1 implementation against ML-DEVOS-AS-104

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-104` approved the Website Redesign V1 Design Panel proposal and routed the implementation decision to Paulo.
- **Decision:** Authorize one bounded implementation cycle for `docs/product/WEBSITE_REDESIGN_V1_PLAN.md` exactly as accepted by `ML-DEVOS-AS-104`.
- **Implementation objective:** Replace the current long-scroll MaisogLabs homepage with the approved spatial Website Redesign V1: one persistent Entry environment with bounded `Systems`, `Projects`, `Research`, and `Contact` work surfaces.
- **Reference rule:** The Claude v10 design remains the primary implementation reference but is not a byte-for-byte specification. `ML-DEVOS-AS-104` and `docs/product/WEBSITE_REDESIGN_V1_PLAN.md` control where the reference differs from the repository, Brand V3, accessibility requirements, factual content, or governance boundaries.
- **Brand rule:** Preserve the canonical MaisogLabs orbital identity. This decision authorizes the AS-104 composition change, not a new logo, new brand identity, new palette, or new typography family.
- **Hero composition authorization:** Authorize implementation of the AS-104 spatial hero composition using the approved Claude design asset `plate-hero-v4.png` when the supplied source asset is available. This intentionally supersedes the previous V3.1 website placement map for the public homepage composition only; the directly affected Brand V3 composition documents must be updated in the same implementation cycle.
- **Canonical motion authorization:** Authorize use of the supplied Claude-design `logo-mark.mp4` and its supplied still/poster fallback only for the Entry/hero canonical-mark treatment, provided the Builder uses the supplied reference bytes and does not redraw, regenerate, or reinterpret the identity. The wide lockup animation is not authorized or required.
- **Static identity rule:** Existing canonical repository SVG brand assets remain the authoritative static identity/fallback. Motion does not replace the canonical static mark.
- **Media paths:** New Website Redesign V1 media may be added only under bounded public paths dedicated to this redesign, preferably `public/images/website-redesign-v1/**` for the environmental plate and `public/brand/website-redesign-v1/**` for canonical mark motion/poster assets. Do not add unrelated media.
- **Missing-media rule:** If an approved supplied media file is unavailable, do not generate or substitute a new visual. Continue using the existing canonical static identity/fallback where possible and report the missing media as `MEDIA_GAP` in the Builder handoff.
- **Entry requirement:** Entry must identify MaisogLabs clearly to a first-time visitor. The public message may use the approved plain-language formulation: `MaisogLabs is Paulo Maisog's independent technology lab, building practical AI automation, research systems, software, and security-focused experiments.` Minor copy tightening is allowed only when it preserves that meaning and does not introduce new factual claims.
- **Primary navigation:** Implement exactly the public destinations `Systems`, `Projects`, `Research`, and `Contact`. Secondary numeric labels such as `00 / Entry` may remain presentational metadata.
- **Spatial routing:** Implement the AS-104 hash-addressable model for `#systems`, `#projects`, `#research`, and `#contact`; no hash means Entry. Browser Back/Forward, Escape-to-Entry, wordmark-to-Entry, focus entry, focus return, keyboard navigation, and safe direct-hash behavior are part of the authorized implementation.
- **Systems vocabulary:** The approved Website Redesign V1 discipline vocabulary is `AI`, `Automation`, `Research`, `Security`, `Systems`, and `Architecture`.
- **Systems integrity:** The Builder may implement the visual relationship model, but must not invent project dependencies, implementation status, system dependencies, metrics, or technical evidence merely to populate the diagram. Any project relationship shown must be traceable to approved public content or an explicitly encoded presentation taxonomy that does not masquerade as system evidence.
- **Projects rule:** The Projects surface must use the repository's approved project content as the factual baseline. Existing titles, summaries, categories, stacks and publication state may be reused. New project facts, statuses, external URLs, measurements, implementation claims or technologies must not be fabricated.
- **Project-flow rule:** A system-flow figure may appear only when its stages are explicitly supported by approved project/process content. Otherwise omit the figure or use an honest neutral unavailable state. Do not infer hidden implementation architecture.
- **Research rule:** The Research surface must consume only real published Journal data through the existing public read-only Journal endpoints. Do not hard-code the Claude prototype's research titles, dates, descriptions or thumbnails as production facts.
- **Journal boundary:** Reuse the current public Journal API and existing `/journal` experience. No new journal database, D1 schema, mutation path or publication mechanism is authorized.
- **Contact rule:** Use the repository-approved public contact email from validated public content. The prototype/reference email must not override repository content. `Copy address` is authorized as a local browser interaction.
- **Typography rule:** Do not introduce Montserrat or another new brand font. Preserve the existing Brand V3 typography roles: approved editorial/display role, Inter/UI sans role, and approved technical mono role.
- **Responsive rule:** Mobile must be designed explicitly rather than shrinking desktop. Implement a compact brand/header plus one clear menu control that exposes Systems / Projects / Research / Contact as touch-accessible destinations.
- **Accessibility rule:** Preserve or improve the current skip path and implement visible focus, semantic navigation, route headings, `aria-current` / `aria-pressed` where applicable, keyboard operation, Escape behavior, deterministic focus entry/return, no hover-only meaning, reduced-motion behavior, appropriate decorative hiding and practical touch targets.
- **Motion rule:** Motion must be calm, state-explanatory and compatible with WEB-INC-007. `minimal`, `off` and `prefers-reduced-motion` states must suppress nonessential continuous motion.
- **Media-lifecycle rule:** When a major work surface is open, nonessential Entry video, pointer parallax and animation-frame work must pause. Relevant media must also pause when the document becomes hidden.
- **WEB-INC-007 preservation:** Existing bounded design-control semantics remain intact. No arbitrary CSS/JS/HTML, selector, asset URL, color, font URL or generic styling capability may be introduced.
- **Managed-section mapping:** Preserve the existing backend-managed section IDs and map them presentation-side only as accepted by AS-104: `home -> Entry`, `projects -> Projects`, `process -> Systems`, `about -> Contact`. Research remains outside the managed four-section visibility/order contract.
- **Hidden-route behavior:** A managed route hidden by published WEB-INC-007 state must hide both its navigation trigger and corresponding surface. Direct navigation to a hidden managed hash must fail safely to Entry.
- **Order behavior:** Existing managed section order may control only the corresponding managed route-trigger order. Do not widen backend semantics.
- **No D1 migration:** The redesign must not require or introduce any D1 schema change or migration.
- **Local static-content authorization:** `data/site.js` and `lib/content/schema.mjs` may be changed only where directly necessary for the AS-104 spatial presentation and validated content structure. Existing factual public content remains the source. Presentation-specific structured fields may be added when they carry approved information, but must not become a path for prototype facts or arbitrary UI code.
- **Content copy authorization:** The Builder may perform directly necessary public copy changes required by the approved first-visit narrative, route labels, spatial presentation and removal/repositioning of Process/About copy. This is bounded to AS-104 Website Redesign V1 and does not grant general editorial mutation authority.
- **Canonical-logo correction:** `components/Logo.js` may be modified only if necessary to use the existing canonical orbital identity correctly in the redesigned public presentation. Do not invent a replacement signature/mark.
- **Authorized public code writes:** `app/page.js`, `app/globals.css`, `app/DesignRuntime.js`, `components/site/**`, and `components/Logo.js` only where directly necessary.
- **Authorized local content writes:** `data/site.js`, `lib/content/schema.mjs`, and directly necessary content tests only.
- **Authorized Brand/design documentation writes:** `brand/V3/DESIGN_MAP.md`, `brand/V3/ASSET_MAP.json`, `brand/V3/guidelines/V3_DIRECTION.md`, and `docs/product/UI_UX_SPEC.md`, only to align the repository source of truth with the AS-104-approved spatial composition.
- **Authorized public media writes:** only the approved Website Redesign V1 hero plate, canonical mark motion file, and canonical mark poster/fallback under bounded public paths.
- **Authorized test writes:** directly necessary `tests/*.test.mjs` files for Website Redesign V1 behavior, DesignRuntime compatibility, content/schema validation, and regression protection.
- **Visual-evidence authorization:** the Builder may add bounded visual-review evidence only under `docs/product/evidence/website-redesign-v1/**`. This path may contain desktop/mobile screenshots and a small evidence manifest/readme only. It must not become a general artifact dump.
- **Evidence-source rule:** screenshots must come from the actual implemented local site, not from the Claude design reference or manually composited mockups.
- **No new package dependency by default:** do not add framework, animation, state-management or visual dependencies merely to reproduce the prototype. Prefer existing React/CSS/browser APIs. If the accepted design cannot reasonably be implemented without a new dependency, STOP and return that exact dependency need for review instead of silently adding it.
- **Implementation approach:** prefer a client-side spatial shell/component under `components/site/**` mounted by the existing public page rather than changing backend/request architecture. Keep the public content/data boundaries simple.
- **No architecture expansion:** do not create a generic plugin system, generic visual scene engine, new API gateway, new admin capability, new content backend or new execution/runtime architecture for this redesign.
- **No Worker/auth change:** no `worker/**`, Cloudflare Access/authentication, admin authorization or public API-security behavior may be modified.
- **No remote-resource authority:** no remote D1 write, remote R2 write, DNS mutation, Access mutation or other Cloudflare resource mutation is authorized.
- **No deployment authority:** implementation and local validation are authorized, but production deployment, production publish/cutover and public website activation are not.
- **No S6/S7 authority:** S6 remains parked at `ML-DEVOS-AS-103`. O1, O2 and the separately governed real execution-driver boundary remain unchanged. No S6/S7/Sentinel work is authorized.
- **D-068 rule:** the suspended local D-068 draft remains non-authoritative and must not be staged, committed, pushed, imported or otherwise touched by this website cycle.
- **Required validation:** run `npm test`, `npm run build`, `git diff --check`, the applicable repository/context validators, and any directly necessary focused tests. Record exact commands and exit codes.
- **Required desktop evidence:** capture the actual implementation for Entry, Systems, Projects, Research and Contact.
- **Required mobile evidence:** capture the actual implementation for Entry/menu, Systems, Projects, Research and Contact.
- **Required interaction evidence:** verify direct hash routing, Entry return, Escape, browser Back, browser Forward, route keyboard navigation, Systems keyboard selection, Projects keyboard selection, focus entry, focus return, hidden managed routes, Copy address, and Journal loading/empty/error/success behavior.
- **Required motion evidence:** verify normal/calm, WEB-INC-007 minimal, WEB-INC-007 off, `prefers-reduced-motion`, open-surface media pause and hidden-document media pause.
- **Required content-integrity review:** explicitly confirm no prototype-only research entry/date, status, metric, stack, URL, project flow, contact address or unsupported technical claim became public content.
- **Evidence classification:** Builder implementation/test/visual claims remain `ACTOR_REPORTED` until independently reviewed by the Architect.
- **Reasoning guidance:** use high reasoning for the initial implementation decomposition, responsive/accessibility design, WEB-INC-007 compatibility and pre-handoff self-review. Mechanical asset copying and straightforward CSS/code edits do not need architecture re-analysis. Invoke SU only if implementation exposes a genuinely new architecture/reliability question; SU is not required for ordinary UI execution.
- **Stop condition:** implementation difficulty does not authorize scope expansion. If a required behavior cannot be achieved within the accepted frontend/content boundary, STOP and return the exact blocker rather than widening backend, dependency or design-control capability.
- **Return gate:** after implementation and validation, publish a fresh Builder handoff and route `TURN: ARCHITECT` / `STATUS: READY_FOR_ARCHITECT` for independent Website Redesign V1 review.
- **Expected handoff identity:** use `H-WEB-REDESIGN-V1-IMPL-0001` unless repository protocol mechanically requires a different unused deterministic ID.
- **Review selector:** the future Builder handoff should identify the published D-076 owner-transition SHA as its review/implementation base and `ML-DEVOS-AS-104` as the applicable design review.
- **Hard boundaries:** no production deploy; no production publish/cutover; no remote D1/R2; no migration; no Worker/auth change; no arbitrary styling surface; no new font family; no logo redesign; no generic scene engine; no unsupported public facts; no S6/S7; no protected/main merge; no PR #10 merge or auto-merge.
- **Evidence of Paulo authority:** after the AS-104 Website Redesign V1 proposal was presented for implementation approval, Paulo explicitly replied `ok authorized`. That approval was intentionally held until AS-104 was mechanically published. AS-104 is now live and routes the implementation decision to Paulo; D-076 formalizes that already-expressed owner approval.

### D-077 — Authorize Spatial Design Controls V2 planning for the accepted spatial website
- **Decided by:** Paulo (Product / Risk Owner), after Website Redesign V1 reached Architect acceptance and after a read-only SENTINEL Architecture Sync plus SU advisory/falsification pass examined the relationship between the new spatial website composition and the existing WEB-INC-007 admin design controls.
- **Decision:** Authorize one bounded architecture/design-control planning cycle named `Spatial Design Controls V2`.
- **Planning objective:** Define how the MaisogLabs admin portal should control the accepted spatial website without becoming an unrestricted page builder.
- **Core architecture to preserve:** The public spatial composition remains source-controlled/code-owned. Admin controls may alter only explicit validated presentation/configuration parameters. Public factual content remains governed by its existing content sources. Publication remains an explicit owner-controlled action.
- **Spatial website vocabulary:** The accepted public composition is `Entry -> Systems / Projects / Research / Contact`.
- **Current WEB-INC-007 vocabulary:** The existing managed section IDs remain `home`, `projects`, `process`, `about`, currently mapped presentation-side to `Entry`, `Projects`, `Systems`, `Contact`. Research remains outside the managed four-section visibility/order contract.
- **Primary planning question:** Determine whether the admin portal can present spatially correct user-facing labels and controls while preserving the existing fixed backend IDs and data contract, and identify any genuine capability gaps that require later implementation authority.
- **Admin usability target:** Paulo should be able to understand and modify bounded presentation choices without needing to remember that legacy names such as `process` currently represent the spatial `Systems` surface.
- **Control ownership model:** The plan must explicitly classify website concerns into: `CODE-OWNED STRUCTURE`, `ADMIN-EDITABLE PRESENTATION`, `CONTENT-OWNED FACTS`, and `OWNER-GATED PUBLICATION`.
- **Code-owned structure examples:** spatial route architecture, component hierarchy, responsive composition model, accessibility semantics, route/focus/history behavior, structural Systems/Projects/Research/Contact components, and other behavior whose arbitrary mutation could break the site.
- **Admin-editable presentation examples to evaluate:** approved hero/background presets, panel/glass treatment, density, typography role/scale, accent preset, overlay intensity, panel opacity, border intensity, radius scale, motion/reduced-motion mode, project rail behavior, Journal card behavior, fixed surface visibility and fixed route-trigger order.
- **No assumption of expansion:** Existing WEB-INC-007 controls must be reused where sufficient. A planning GAP is not automatically a new control.
- **Legacy-label planning:** Evaluate a UI-only/admin-presentation alias layer such that the admin may display `Entry`, `Systems`, `Projects`, and `Contact` while the underlying fixed backend identifiers remain `home`, `process`, `projects`, and `about` if preserving those IDs is the lower-risk design.
- **Research boundary:** Do not add Research to the managed section contract merely for visual symmetry. The Architect must identify an actual product/design need, implementation impact and safety implications before recommending any Research visibility/order control.
- **Reference-driven workflow:** Preserve the existing `REFERENCE -> ANALYZE -> MAP -> DRAFT -> PREVIEW -> REVIEW -> PUBLISH` model and the `DIRECT MATCH / APPROXIMATION / GAP` classification.
- **Draft-first requirement:** Admin-controlled design application remains Draft -> authenticated Preview -> Paulo review -> Publish. A successful preview is not automatic publication authority.
- **Free-form builder prohibition:** The planning cycle must not recommend arbitrary CSS, arbitrary HTML, arbitrary JS, arbitrary selectors, arbitrary component code, arbitrary asset/font URLs, unrestricted XY positioning, unrestricted drag/drop layout mutation, or general-purpose component creation as a default V2 capability.
- **Visual-editor distinction:** A future richer visual editor may be considered only as a separately governed capability with explicit need/evidence; it must not be smuggled into V2 planning through ordinary design-control changes.
- **Security/safety requirement:** The plan must preserve fail-closed validation, fixed allowed values/ranges, authenticated draft/preview/publish semantics, revision/conflict handling and the current separation between client UI, authenticated admin API and public runtime projection.
- **Data/storage requirement:** Determine whether each proposed V2 improvement requires zero schema change, presentation-only aliases, additional bounded enums/ranges, or new stored state. Prefer zero-schema solutions where they meet the product requirement. Do not authorize a migration from planning alone.
- **Preview requirement:** Evaluate how the admin portal should make the actual spatial website preview understandable: Entry, Systems, Projects, Research and Contact should be reviewable in their real responsive composition rather than through an abstract settings-only screen.
- **Mobile requirement:** V2 planning must consider admin usability on narrow screens as well as desktop, but it need not reproduce the public site's cinematic composition inside the admin settings form.
- **Accessibility requirement:** Admin controls must remain keyboard-accessible, labelled, explicit about state, and must not expose settings capable of silently defeating public reduced-motion or essential content readability constraints.
- **Brand requirement:** Preserve Brand V3 and the canonical orbital identity. Admin design controls must not become a path for logo replacement or unbounded brand mutation.
- **Evidence requirement:** For every proposed V2 control, record: user need; current capability; DIRECT MATCH / APPROXIMATION / GAP; storage/API effect; public-runtime effect; security/governance impact; responsive/accessibility impact; preview behavior; and acceptance evidence.
- **Design Panel requirement:** The Architect should include at minimum Product/Admin UX, Frontend Architecture, Design Systems, Security/Capability Boundary, Accessibility/Responsive, Independent Critic and Layperson/Admin perspectives.
- **SU role:** SU may be used as advisory falsification/research support for architecture tradeoffs. SU has no authorization or governance authority.
- **Expected planning artifact:** Produce `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md` or an equivalently explicit V2 planning artifact.
- **Required final plan sections:** current-state audit; ownership model; existing-control mapping; admin vocabulary/alias proposal; proposed V2 control catalog; Research disposition; preview workflow; data/API/storage impact; security boundaries; responsive/accessibility; migration/dependency assessment; phased implementation boundary; test/evidence plan; unresolved choices; exact future implementation scope.
- **Planning writes only:** Planning may write directly necessary proposal/review/Architect-sync/coordination artifacts. No production/admin/runtime implementation mutation is authorized.
- **No implementation authority:** Do not modify `app/admin/**`, `app/DesignRuntime.js`, `worker/**`, D1 schema/data, migrations, public-site components, design settings, media, or production resources from D-077.
- **No deployment authority:** No production deployment, public cutover, remote D1/R2 mutation, protected/main merge or PR #10 merge is authorized.
- **S6 isolation:** S6 remains parked at ML-DEVOS-AS-103. No S6/S7/Sentinel execution work is authorized.
- **Return gate:** The Architect must return the Spatial Design Controls V2 proposal to Paulo. Claude receives no V2 implementation turn until Paulo separately authorizes a bounded implementation scope after reviewing that proposal.
- **Evidence of Paulo authority:** After the read-only SENTINEL Architecture Sync and SU advisory result recommended preserving the code-owned spatial canvas while opening a separate bounded Spatial Design Controls V2 planning cycle, Paulo explicitly stated: `Ok do it`.

### D-078 — Authorize Canonical Directive / Agent Transport protocol planning

- **Decided by:** Paulo (Product / Risk Owner), after AS-107 was published and the repository returned to `TURN: PAULO`.
- **Decision:** Authorize one bounded architecture/governance planning cycle for a repository-native Architect/Owner-to-Builder directive transport, provisionally named `CURRENT_DIRECTIVE.md`.
- **Problem being solved:** Large Architect instructions copied through chat can lose Markdown structure, code fences, bullets or byte identity, creating avoidable ambiguity and token cost. The repository should carry the current executable instruction packet so Claude can read exact bytes directly from the authoritative Git state instead of reconstructing a large prompt from chat.
- **Core principle:** A directive is a transport/context artifact, not an authority artifact. It may point to authority; it may never create, enlarge or override authority.
- **Authority remains separate:** `coordination/STATE.md`, Product / Risk Owner decisions, immutable Architect Syncs, governing RFCs/specifications and action-specific flags remain the sources that determine what work is allowed.
- **Transport direction:** The planned surface is Architect/Owner -> Builder. The existing `coordination/CURRENT_HANDOFF.md` remains Builder -> Architect evidence/reporting unless a later approved design explicitly changes that model.
- **Required planning question:** Determine whether the new directive mechanism requires a protocol-version bump from Context Bootstrap `PROTOCOL_VERSION: 1` to a new protocol version, or whether a backward-compatible extension can provide equivalent stale-session and mixed-snapshot protection. Do not assume either answer without analysis.
- **Freshness requirement:** Any future directive must be read from the same exact authoritative snapshot as STATE and the other governed inputs. A stale or mixed-snapshot directive must fail closed.
- **Binding requirement:** The plan must define mechanical identity binding between STATE and the selected directive. At minimum evaluate fields such as directive identity, cycle, source/base commit, target role, applicable authority/review references and lifecycle state. Final fields are an architecture decision, not pre-authorized by this decision.
- **No authority by prose:** The directive body must not be allowed to override `AUTHORIZED_SCOPE`, TURN, action-specific flags, owner decisions, or governing review/decision chains even if its prose claims otherwise.
- **Rolling preservation:** Evaluate whether every outgoing directive must be archived byte-for-byte with source commit/blob provenance and a deterministic archive location, consistent with existing handoff/review preservation discipline.
- **Checker requirement:** The plan must define repository-native mechanical checks for directive freshness, identity binding, immutability/reuse, outgoing preservation, exact-tip publication and stale-session behavior. A checker proves only mechanically knowable facts and never proves human authority or semantic correctness.
- **SENTINEL requirement:** Every governed directive/handoff cycle must include a fresh SENTINEL architecture/context sync appropriate to the turn before execution. SENTINEL checks authority, freshness, capability boundaries, unresolved obligations, protected surfaces and contradictions with current repository state.
- **SU requirement:** Every governed directive/handoff cycle must include an SU advisory contradiction/falsification check. SU remains advisory only and grants no authority.
- **Adaptive SU mode:** The default SU mode should be a bounded low-cost contradiction check. Escalate to deeper research/multi-source evaluation only when the task crosses defined triggers such as architecture changes, security/capability expansion, consequential external action, unresolved evidence conflict, high uncertainty, or a contradiction that cannot be resolved from repository evidence alone.
- **Token-efficiency objective:** The design should minimize repeated chat/context payloads by making the repository directive delta-based. It should point to exact governing artifacts rather than restating large historical context already available in Git.
- **Minimum directive content to evaluate:** Objective; exact scope; preconditions; authoritative references; instructions; validation/evidence requirements; SENTINEL Sync result; SU contradiction result/mode; unresolved contradictions; stop conditions; next action.
- **Fail-closed contradiction rule:** If SENTINEL or SU finds an unresolved authority conflict, stale target, capability expansion, or material contradiction, the directive must route to a stop/review state rather than silently executing.
- **No automatic deep research:** Mandatory SU invocation does not mean mandatory open-web research on every mechanical turn. The planning cycle must define escalation thresholds to avoid unnecessary token/cost consumption.
- **Provider neutrality:** The protocol should describe roles and repository contracts, not depend on Claude/ChatGPT brand identity. Current role assignments may still be documented separately.
- **Skills impact:** Evaluate required changes to canonical `.agents/skills/**` sources first and deterministic regeneration of `.claude/skills/**`; generated bridges must never become independently edited authority surfaces.
- **Bootstrap impact:** Evaluate changes required in `brain/protocols/CONTEXT_BOOTSTRAP.md`, `brain/protocols/ARCHITECT_SYNC.md`, `coordination/README.md`, startup/orientation guidance, checker/tests and role-specific skills. Do not implement any of them in this planning cycle.
- **V2A disposition:** `SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT` remains Architect-approved under AS-107 but its owner implementation decision is deferred while D-078 planning is active. D-078 does not reject or modify the AS-107 plan.
- **S6 isolation:** S6 remains parked at ML-DEVOS-AS-103. O1/O2, the real execution-driver boundary and suspended D-068 local draft remain untouched.
- **No implementation authority:** D-078 authorizes planning/design only. It does not authorize creation of `coordination/CURRENT_DIRECTIVE.md`, checker changes, protocol-version changes, skill changes, production/admin/site implementation, migration, deployment, remote D1/R2, protected/main merge or PR #10 merge.
- **Expected planning artifact:** Produce a bounded protocol plan/RFC proposal for Canonical Directive / Agent Transport including current-state audit, threat/contradiction model, authority/context/capability separation, directive schema, STATE binding, lifecycle/archive rules, SENTINEL/SU rules, adaptive escalation, protocol-version/cutover analysis, checker/test plan, migration/rollback plan, token-cost considerations and exact future implementation scope.
- **Return gate:** The Architect must route the completed D-078 proposal back to Paulo for a separate implementation/cutover decision. No Builder protocol implementation begins from D-078 alone.
- **Evidence of Paulo authority:** After the Architect explained that the permanent solution should be a governed GitHub `CURRENT_DIRECTIVE.md` transport with mandatory SENTINEL sync and adaptive SU contradiction checks, and that it should be opened only after AS-107 was live, Paulo explicitly replied `Ok proceed`.
### D-079 — Authorize RFC-020 Stage A dual-version Canonical Directive protocol implementation

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-108` accepted `ML-DEVOS-RFC-020` and routed the repository to Paulo for the Stage A implementation decision.
- **Decision:** Authorize one bounded Builder implementation cycle for `RFC-020 Stage A — Dual-version Canonical Directive protocol implementation`.
- **Owner authorization:** Paulo explicitly stated: `Authorize RFC-020 Stage A dual-version implementation.`
- **Implementation base:** The authorized cycle starts from the exact live tip at the owner transition's parent. The owner-transition publisher must fresh-bootstrap and bind the transition to that exact tip.
- **Live protocol during Stage A:** `PROTOCOL_VERSION: 1` remains active throughout Stage A implementation and Builder handoff. Stage A must not activate Protocol V2.
- **Primary objective:** Implement and test the repository-side V2 directive protocol machinery while preserving full V1 behavior, so the Architect can independently review V2 readiness before any separate activation decision.
- **Architecture source:** Implement only the architecture approved in `ML-DEVOS-RFC-020` / `ML-DEVOS-AS-108`.
- **New transport under construction:** `coordination/CURRENT_DIRECTIVE.md` may be added only as RFC-020 scaffolding/template/support. It is not an ACTIVE execution packet under live V1 and must not be selected by live STATE during Stage A.
- **No live selector activation:** Do not add active V2 directive selector fields to the live Protocol V1 STATE. Do not route a live Builder turn through CURRENT_DIRECTIVE during Stage A.
- **V1 non-regression requirement:** Existing Context Bootstrap V1 behavior, handoff/review routing, exact-tip publication, archive preservation, obligation carry-forward and stale-session checks must continue to function and pass their existing tests.
- **Dual-version checker requirement:** Extend the Context Bootstrap checker to understand both V1 and V2 fixtures/semantics without changing the live repository protocol marker from 1.
- **Directive mechanics to implement/test:** fixed header/schema; STATE-selector model for V2 fixtures; exact field binding; issue-parent binding; target-turn binding; fixed authority/review references; required sections; SENTINEL/SU fixed vocabularies; BLOCKED fail-closed behavior; immutable directive identity; outgoing directive archival/provenance; duplicate-ID changed-byte rejection; Builder-return directive deselection/archive plus CURRENT_HANDOFF selection; Architect-remediation handoff deselection plus new directive selection.
- **SENTINEL semantics:** Implement only the mechanical/protocol representation required by RFC-020. A checker validates shape/coherence only; it must not claim to prove the quality of SENTINEL reasoning.
- **SU semantics:** Implement only the fixed `BOUNDED_CONTRADICTION` / `ESCALATED_RESEARCH` representation and dispositions specified by RFC-020. SU remains advisory and grants no authority. The checker validates vocabulary and BLOCKED routing only.
- **Protocol-version safety:** Add tests proving V1 snapshots remain valid and V2 stale-session/protocol-mismatch behavior fails closed. Do not perform the actual `1 -> 2` live cutover.
- **Canonical Skills:** Update canonical `.agents/skills/**` first where directly required by RFC-020, then regenerate `.claude/skills/**` deterministically. Do not independently hand-edit generated bridge files.
- **Bootstrap/read-order goal:** Refactor startup/orientation guidance only as necessary to support the dual-mode model and the future small V2 startup path. During live V1, do not remove safety-critical V1 reads in a way that breaks current sessions.
- **Token-efficiency measurement:** Measure the post-Stage-A declared ordinary Builder startup/read set and compare it with RFC-020's `85,625 bytes` planning baseline. Record the actual result. The target is at least 50% reduction for the future ordinary V2 Builder path without removing safety-critical checks. Failure to hit the target is evidence to review, not authority to weaken safety.
- **Implementation-detail freedom:** Claude may resolve RFC-020's listed implementation-detail questions only within the accepted architecture, including exact `DIR-` ID format, archive-index mechanics, parser-helper reuse, typical directive byte-budget guidance and whether a dedicated canonical directive Skill is simpler than extending existing Skills.
- **Allowed implementation paths:** Directly necessary changes are authorized in:
  - `brain/protocols/CONTEXT_BOOTSTRAP.md`
  - `brain/protocols/ARCHITECT_SYNC.md`
  - `coordination/README.md`
  - `coordination/CURRENT_DIRECTIVE.md` scaffolding/template only
  - `coordination/archive/directives/**`
  - `scripts/check-context-bootstrap.mjs`
  - `tests/context-bootstrap.test.mjs`
  - directly necessary coordination/protocol test files
  - `.agents/skills/project-orientation-state-recovery/**`
  - `.agents/skills/implementation-handoff/**`
  - `.agents/skills/architect-review-sync/**`
  - one new canonical directive-related Skill only if justified by the implementation
  - deterministically regenerated `.claude/skills/**` counterparts
  - `CLAUDE.md`
  - `AGENTS.md`
  - `brain/00_HOME.md`
  - `brain/PROJECT_GOVERNANCE.md` only if directly necessary to keep the protocol map accurate
  - `devos/changes/rfcs/ML-DEVOS-RFC-020.md` only for Stage A implementation-status/provenance wording consistent with the still-unactivated design
  - directly necessary governed coordination, handoff, archive, evidence and test-ledger records.
- **Required Stage A tests:** Implement and run the complete RFC-020 §24 test set, including V1 non-regression, V2 directive selector/header mismatches, issue-parent/target/authority/review validation, duplicate ID rejection, required-section checks, SENTINEL/SU vocabulary and BLOCKED behavior, archive/provenance checks, Builder return/remediation transitions, stale-session mismatch, exact-tip publication preservation, deterministic skill-bridge generation and startup-read measurement.
- **Validation:** Run at minimum the focused Context Bootstrap/protocol tests, full applicable repository tests, skill tests, `git diff --check`, applicable governance/manifest/task/rules/waiver validators, deterministic bridge generation/verification and any other directly necessary repository-native validation required by changed files. Run `npm run build` only if the changed documentation/config/bootstrap surfaces make it applicable; if not run, state why.
- **Evidence classification:** Builder test/results are `ACTOR_REPORTED` until independently inspected/reproduced by the Architect. Do not self-upgrade Builder evidence to Architect-verified.
- **Return gate:** On completion, publish one normal V1 Builder handoff through `coordination/CURRENT_HANDOFF.md`, routed to `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, with `PROTOCOL_VERSION: 1`.
- **Handoff requirements:** State exact base/result SHAs, changed files, tests/evidence, V1 non-regression evidence, V2 fixture evidence, directive archive/identity evidence, stale-session evidence, generated-bridge equivalence, startup-byte before/after measurement, unresolved implementation choices/limitations and explicit confirmation that V2 was not activated.
- **No Stage B authority:** Stage A implementation and even later Architect acceptance do not authorize Protocol V2 activation. A separate Paulo Stage B activation decision is mandatory.
- **Product isolation:** Do not modify website/admin/product/runtime implementation, content, media, D1/R2 resources, migrations or deployment configuration.
- **V2A disposition:** Spatial Design Controls V2A remains Architect-approved under AS-107 but stays deferred during this protocol Stage A cycle.
- **S6 isolation:** S6 remains parked at ML-DEVOS-AS-103. O1/O2 remain open. The real execution driver remains unauthorized. The suspended D-068 local draft remains untracked and must not be touched, staged, committed, imported or pushed.
- **Deployment boundary:** No deployment, public cutover, remote D1/R2 mutation, protected/main merge or PR #10 merge is authorized.
- **Scope expansion:** If Stage A appears to require a product/runtime file or a protocol semantic not present in RFC-020, stop and return the gap; do not silently widen implementation.

### D-080 — Authorize RFC-020 Stage B atomic Context Bootstrap V2 activation

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-110` accepted RFC-020 Stage A and routed the repository to Paulo (`TURN: PAULO`) for the Stage B activation decision at `783b03253536a0fdada54fc10571d503915f5c6a`.
- **Owner authorization (verbatim, given in the Builder session):** "I, Paulo T. Maisog, Product/Risk Owner, authorize RFC-020 Stage B — atomic Protocol V2 activation against the currently reviewed Stage A handoff established by ML-DEVOS-AS-110. Scope is limited strictly to the Stage B atomic activation defined by RFC-020 and its approved transition contract. Authorized: Protocol V2 activation and only the state/evidence updates required to complete that atomic transition. Not authorized: unrelated remediation, scope expansion, Stage C or later work, new protocol features, opportunistic refactoring, or any action outside RFC-020 Stage B. After the atomic transition, verify the resulting repository state, protocol version, required invariants/checksums, and governance evidence; publish the bounded handoff record; then STOP and return TURN to Architect/Paulo as prescribed by the protocol. Decision: AUTHORIZED."
- **Recording provenance:** Paulo supplied the text above in chat, not as an exact-byte package. The Builder recorded it verbatim in this entry, in the same atomic activation commit, as the publisher. This entry proves provenance, not authority beyond Paulo's words.
- **Transition contract:** `ML-DEVOS-RFC-020` §21 Stage B and the `ML-DEVOS-AS-110` "Stage B recommendation". One atomic governed commit:
  - changes `PROTOCOL_VERSION: 1 -> 2`;
  - adds the V2 directive selector fields to live STATE, with `CURRENT_DIRECTIVE: NONE` and empty values;
  - updates active bootstrap wording/status to V2 where required;
  - contains no product/admin/site/runtime change;
  - routes to a non-Builder gate;
  - is published with `--protocol-cutover 1->2 --session-protocol 1`.
- **Routing:** `TURN: ARCHITECT` to independently verify the activation, with the bounded Builder activation record selected as `CURRENT_HANDOFF`. The first real V2 directive may be issued only after that verification.
- **Not authorized:** the first real directive, Spatial Design Controls V2A, Stage C or later work, new protocol features, checker/test changes, product/admin/site/runtime/media/D1/R2/migration/deployment work, S6/S7 work, D-068 mutation, protected/main merge, and PR #10 merge.
- **Rollback:** only by forward recovery under a separate owner decision (RFC-020 §22), never by a branch rewind.

### D-081 — Authorize RFC-020 Stage B status-consistency micro-remediation

- **Decided by:** Paulo (Product / Risk Owner), after the `D-080` activation commit `08458a289a922e5ef77aaee448879e00b5660f2f` routed the repository to `TURN: ARCHITECT` for activation verification.
- **Owner authorization (verbatim, given in the Builder session):** "Authorize exceptional RFC-020 Stage B status-consistency micro-remediation. Scope is limited strictly to correcting stale current-status wording introduced or left inconsistent by the D-080 Protocol V2 activation, principally the top-level status/authority wording in brain/protocols/CONTEXT_BOOTSTRAP.md. Inspect RFC-020's live status header only to determine whether it is intended as mutable current status; update it only if required for consistency with the already-active D-080 Stage B state. Do not change protocol behavior, checker logic, tests, directive mechanics, product/runtime code, V2A, S6/S7, D-068, deployment, D1/R2, migrations, protected/main, or any unrelated file. Preserve PROTOCOL_VERSION: 2 and CURRENT_DIRECTIVE: NONE. Publish the smallest atomic remediation, record evidence, route back to TURN: ARCHITECT, and stop. No first real V2 directive is authorized by this remediation."
- **Recording provenance:** Paulo supplied the text in chat. The Builder recorded it verbatim in the same atomic remediation commit, as publisher. This entry proves provenance, not authority beyond Paulo's words.
- **Exceptional routing:** the remediation is published while live `TURN` is `ARCHITECT`, on this owner authorization, and routes back to `TURN: ARCHITECT`.

### D-082 — Authorize Spatial Design Controls V2A — Admin UX Alignment (first Protocol V2 Builder task)

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-111` verified the Protocol V2 activation and routed the repository to Paulo (`TURN: PAULO`) at `030ba0e095cf117aeda260ce4d75745378fe032e`.
- **Owner authorization:** Paulo supplied it in the Builder session, not as an exact-byte package, and the Builder recorded it in this entry as publisher. Its operative terms are quoted verbatim below. This entry proves provenance, not authority beyond Paulo's words.
- **Decision (verbatim):** "Authorize SPATIAL DESIGN CONTROLS V2A — ADMIN UX ALIGNMENT as the first real Protocol V2 Builder task." "This authorization is limited to the V2A implementation scope already approved by ML-DEVOS-AS-107." "Decision: AUTHORIZED."
- **Controlling chain:** `ML-DEVOS-AS-107`, `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md`, `ML-DEVOS-AS-111`, `ML-DEVOS-RFC-020`.
- **Authorized implementation paths:**
  - `app/admin/DesignControls.js`
  - directly necessary V2-focused test file(s)
  - `docs/product/DESIGN_REFERENCE_WORKFLOW.md`
  - `docs/product/UI_UX_SPEC.md`
  - normal coordination, directive, handoff, archive and evidence files required by Protocol V2
- **Objective:** Align the existing Design Controls admin UX with the accepted spatial website model without creating new backend capability.
  - Preserve backend identifiers `home`, `process`, `projects`, `about`, and present them as Entry, Systems, Projects, Contact.
  - Preserve the existing bounded theme fields, enum values, numeric ranges, APIs, validation, stale-write protection, draft/publish semantics and public-runtime mappings.
- **Spatial Preview shortcuts,** using the existing authenticated preview mechanism:
  - Entry `/?design-preview=1`
  - Systems `/?design-preview=1#systems`
  - Projects `/?design-preview=1#projects`
  - Research `/?design-preview=1#research`
  - Contact `/?design-preview=1#contact`
  - Journal `/journal?design-preview=1`
- **Research:** preview-only, not added to the managed visibility/order contract.
- **Order controls:**
  - Entry order is not exposed as a meaningful editable navigation-order control.
  - Systems, Projects and Contact may continue using the existing bounded order mechanism.
- **Lifecycle wording:** clearly distinguish Draft, Preview, Publish and Deployment. Publish means activation of design settings only; it does not authorize code deployment or content publication.
- **Hard boundaries (not modified or authorized):**
  - **Code:** `app/DesignRuntime.js`, `components/site/**`, Worker code, D1 code or schema, migrations, API shape, public-site source.
  - **Content and identity:** media, Brand identity, factual/content editing.
  - **New inputs or fields:** new theme fields; arbitrary CSS/HTML/JavaScript/selectors/URLs/remote assets; custom fonts; custom classes; arbitrary colors; XY/free-form positioning.
  - **New structure:** component definitions, route definitions, drag/drop as a new capability, a new preview endpoint, an iframe/editor runtime.
  - **Other work:** V2B, S6/S7, D-068.
  - **Release actions:** deployment, public cutover, remote D1/R2 mutation, protected/main merge, PR #10 merge or auto-merge.
- **Held positions:** S6 remains parked at `ML-DEVOS-AS-103`. O1 and O2 remain open. D-068 remains suspended and untouched.
- **Protocol V2:** this is the first real Protocol V2 Builder task.
  - Its directive is issued only after a fresh SENTINEL sync and SU contradiction check.
  - The directive is not authority. Effective scope is the intersection of STATE, this decision, `ML-DEVOS-AS-107`, the approved V2A plan and the directive.
- **Required validation:**
  - focused V2A tests, full `npm test`, `npm run build`, `git diff --check` and applicable repository validators;
  - exact changed-file scope;
  - desktop and narrow/mobile admin evidence, and fixed Spatial Preview link evidence;
  - verification that no arbitrary-input capability was introduced;
  - confirmation that Worker, D1, DesignRuntime and migrations are unchanged.
- **Return:** one normal Protocol V2 Builder return commit carries:
  - the implementation and evidence;
  - `CURRENT_HANDOFF`;
  - the outgoing directive archived byte-for-byte with provenance;
  - `CURRENT_DIRECTIVE: NONE` with cleared selector fields;
  - `TURN: ARCHITECT`.
- **No deployment is authorized.**

### D-083 — Authorize WEB release-readiness / release-scope review after AS-112 (planning and inspection only)

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-112` accepted Spatial Design Controls V2A and routed the repository to Paulo at `2cdbf4468d500163f84ab9a06c5232b6614f34b8`.
- **Owner authorization:** Paulo supplied it in the Builder session, and the Builder recorded it here as publisher. The operative terms are quoted verbatim. This entry proves provenance, not authority beyond Paulo's words.
- **Decision (verbatim):** "Authorize a bounded MaisogLabs WEB RELEASE READINESS / RELEASE-SCOPE REVIEW after AS-112. This is a planning and inspection gate only." "Decision: AUTHORIZED FOR RELEASE-READINESS / RELEASE-SCOPE REVIEW ONLY."
- **Stated state:**
  - governance tip `2cdbf4468d500163f84ab9a06c5232b6614f34b8`;
  - main tip `882ad253b5dbec06b209d1ee1a2a54b21b392e2e`;
  - `PROTOCOL_VERSION: 2`.
- **Objective:** determine the safest bounded release path for the accepted current website state.
  - Compare `main` against `governance/maisoglabs-v0.1`.
  - Classify the accumulated diff into:
    1. public website / admin / product release changes;
    2. supporting tests/docs;
    3. governance / Context Bootstrap / Protocol V2 records;
    4. SENTINEL / S6 / DevOS implementation or research artifacts;
    5. evidence/archive files;
    6. anything that should not be in a production-facing release merge.
  - Answer the key question without assuming either outcome: a direct `governance/maisoglabs-v0.1 -> main` merge, or a bounded website-release branch.
- **Required inspection:**
  - PR #12 / WEB-REL-001, D-054–D-057, OBL-017, OBL-018, AS-112, and Website Redesign V1 and V2A acceptance;
  - a fresh SENTINEL sync;
  - SU bounded contradiction on:
    - S6 or experimental capability inclusion;
    - missing accepted website changes;
    - governance/history dependencies;
    - release-branch divergence and maintenance;
    - unintended Cloudflare/build/deployment effects;
    - the merge ≠ deploy assumption.
- **Required output:**
  - the exact main and governance SHAs;
  - the release candidate scope, with included and excluded files/categories;
  - whether a fresh release PR is required;
  - the required CI/build checks;
  - the merge-gate, deployment-gate and runtime-verification requirements;
  - rollback considerations;
  - any unresolved blocker.
- **Not authorized:**
  - merge, main merge authority or deployment;
  - production mutation, remote D1/R2 mutation or Cloudflare production mutation;
  - product/runtime implementation changes;
  - V2B.
- **Held positions:** PR #10 remains DO NOT MERGE. S6 remains parked at `ML-DEVOS-AS-103`. O1/O2 remain open. D-068 remains suspended and untouched.
- **Protocol:** use Protocol V2. If implementation or release mutation is required after planning, stop and return to Paulo for a separate explicit decision.

### D-084 — Authorize WEB-REL-002 Gate B: release PR review only

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-113` accepted the WEB-REL-002 direct governance→main release shape and routed the repository to Paulo at `7e2bbe2148e2112b58979401308216cceb631091`. Main was `882ad253b5dbec06b209d1ee1a2a54b21b392e2e`.
- **Owner authorization:** Paulo supplied it in the Builder session, and the Builder recorded it here as publisher. The operative terms are quoted verbatim. This entry proves provenance, not authority beyond Paulo's words.
- **Decision (verbatim):** "Authorize Gate B only for WEB-REL-002. Open exactly one fresh pull request: governance/maisoglabs-v0.1 → main." "Decision: AUTHORIZED — WEB-REL-002 GATE B RELEASE PR REVIEW ONLY."
- **Allowed:**
  - recording this decision;
  - the Protocol V2 directive/coordination transition;
  - opening the WEB-REL-002 release PR;
  - automatic non-production Cloudflare PR previews (D-055);
  - GitHub CI / `test-and-build`;
  - read-only inspection of the final PR diff, checks, mergeability and main-protection state.
- **S5/S6 acknowledgement (verbatim):** "I acknowledge that the direct governance→main release shape includes repository-only S5/S6 and DevOS history. Their presence in the repository or eventual presence on main does NOT: activate S6; authorize S6 execution; authorize a real execution driver; authorize remote transport; grant deployment or production authority; make S5/S6 part of the website runtime merely by being stored in the repository." S6 remains parked at `ML-DEVOS-AS-103`. O1/O2 remain open. D-068 remains suspended and untouched.
- **Gate B requirements:**
  - a fresh V2 bootstrap;
  - this decision and a bounded directive;
  - one fresh PR;
  - recorded: the PR number, exact base SHA, initial and final head SHAs, full release diff, mergeability, unresolved conversations, and main-protection/ruleset state;
  - `test-and-build` (`npm ci`, `npm test`, `npm run build`) green on the exact final PR head, re-checked if bookkeeping advances the head;
  - confirmation that the PR still represents the AS-113 shape, that PR #7 is not folded in, and that PR #10 remains DO NOT MERGE;
  - a return to the Architect for independent Gate B review.
- **Not authorized:**
  - merging the PR (`MAIN_MERGE_AUTHORIZED` remains NO);
  - deployment, Cloudflare production promotion, or production rollback;
  - remote D1/R2, Access or DNS/domain mutation;
  - production-data writes or public D1 cutover;
  - V2B, S6/S7 resumption, or D-068 mutation;
  - merging PR #7, or merging/auto-merging PR #10;
  - force-pushing main.
- **Gate C:** remains a separate Paulo decision. Before any Gate C merge, the Cloudflare production-build configuration and the current active production Version ID must be freshly verified.

### D-085 — Authorize WEB-REL-002 Gate C: protected PR #13 merge without production promotion

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-114` accepted WEB-REL-002 Gate B and routed the repository to Paulo at `7e911f3480eae7df9777140d4850398ba90a32ca`.
- **Owner authorization (verbatim from the current session):** "Continue WEB-REL-002 Gate C under Paulo's already-granted authorization."
- **Recording provenance:** Paulo supplied the authorization and the complete Gate C operating constraints in chat. The Builder records them here as publisher. This entry proves provenance, not authority beyond Paulo's words.
- **Bound inputs:** pre-directive repository/PR head `7e911f3480eae7df9777140d4850398ba90a32ca`; main `882ad253b5dbec06b209d1ee1a2a54b21b392e2e`; controlling review `ML-DEVOS-AS-114`; active production Version `a28ee2e9-a9a0-4528-b89f-07e0c827be2b` at 100%.
- **Fresh Cloudflare production evidence:** the authenticated live Workers Builds configuration for `maisog-labs` is linked to GitHub `Dillaab-source/maisog-labs`, production branch `main`; production and non-production deploy commands are exactly `npx wrangler versions upload`; the production trigger includes `main` and all paths; non-production includes all branches except `main`; previews are disabled. This command uploads a Worker version and does not promote active traffic.
- **Authorized actions:** record this decision; issue the bounded Protocol V2 Gate C directive; transition PR #13 from draft to ready; after the directive-issue head passes exact-head CI and all fresh rechecks, merge PR #13 through the normal protected GitHub PR path using a merge commit and exact expected-head guard; observe the resulting Workers build/version and verify the active production Version ID is unchanged; publish the Protocol V2 return.
- **Conditional merge rule:** the directive-issue commit advances the PR head. Before merge, require successful `test-and-build` on that new exact head, clean mergeability, unchanged main, unchanged release scope, intact `main-protection`, and a fresh unchanged pre-merge active Version baseline. Any further head movement requires a full recheck.
- **Protection rule:** use the normal protected PR path. The existing RepositoryRole pull-request bypass capability must not be used. No force push, auto-merge, squash or rebase merge.
- **Production invariant:** the post-merge active Version ID must equal the fresh pre-merge active Version ID. A new uploaded version may be produced but must remain inactive. If active production changes, classify a release-governance incident and stop without rollback, deployment, promotion or repair.
- **Held positions:** S6 remains parked at `ML-DEVOS-AS-103`; O1/O2 remain open; D-068 remains suspended and untouched; PR #7 is not merged or folded into WEB-REL-002; PR #10 remains DO NOT MERGE; repository presence of S5/S6 grants no runtime authority.
- **Not authorized:** production deployment or promotion; rollback; D1/R2/Access/DNS/domain mutation; production-data writes; public D1 cutover; product/runtime implementation; V2B; S6/S7 resumption; D-068 mutation; PR #7 or PR #10 merge; ruleset bypass; force push to main. Gate D remains a separate Paulo decision.
- **Return:** on success, archive/deselect the Gate C directive byte-for-byte, publish the exact evidence handoff, reset every action flag to NO and route to `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.

### D-086 — Authorize WEB-REL-002 Gate D: exact production promotion and runtime verification

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-115` accepted Gate C and routed the repository to Paulo at `edd4bce5fa9fa07b28237b893c078ebbd234ba2b`.
- **Owner authorization (verbatim from the current session):** "AUTHORIZED — WEB-REL-002 GATE D PRODUCTION PROMOTION OF EXACT VERSION `a667fc09-12d1-4fde-a75d-5d660729baa3`, WITH MEDIA_GAP ACCEPTED FOR THIS RELEASE AND POST-PROMOTION RUNTIME VERIFICATION REQUIRED."
- **Recording provenance:** Paulo supplied the authorization and bounded Gate D constraints in chat. The Builder records them here as publisher. This entry proves provenance, not authority beyond Paulo's words.
- **Bound release identity:** main `aebc881e8890c00090d714602591138a045bd3b0`; successful Workers build `19ecd52a-b178-47dd-8d23-64b5590a61ef`; exact target Worker Version `a667fc09-12d1-4fde-a75d-5d660729baa3` for Worker `maisog-labs`; controlling review `ML-DEVOS-AS-115`.
- **Fresh pre-directive production baseline:** authenticated Cloudflare API read at `2026-09-26T03:16:25.206Z` found deployment `e51d40d4-a063-47c5-a46f-70beeee4c03e` serving `a28ee2e9-a9a0-4528-b89f-07e0c827be2b` at 100%. The target was deployable and inactive. A second fresh read is mandatory immediately before promotion.
- **MEDIA_GAP disposition:** ACCEPT FOR WEB-REL-002. `plate-hero-v4.png`, `logo-mark.mp4` and the logo-mark poster/fallback are deferred and do not block this release. Existing static MaisogLabs environment and canonical static SVG identity assets are accepted. No new media may be generated, added, substituted, uploaded or integrated under this decision.
- **Authorized actions:** record this decision; issue one bounded Protocol V2 Gate D directive; after all exact preconditions pass, create one normal Cloudflare deployment assigning 100% production traffic to exactly `a667fc09-12d1-4fde-a75d-5d660729baa3`; immediately verify the active deployment; perform bounded, read-only public runtime verification; publish the Protocol V2 return.
- **Failure rule:** any identity ambiguity, unexpected pre-promotion production change, unsafe promotion condition, incorrect post-promotion active version, or material runtime defect causes an immediate stop. No automatic rollback, old-version promotion, hotfix or repair is authorized.
- **Not authorized:** rebuild or version upload; any other version promotion; website/Worker code change; media mutation; D1/R2/Access/DNS/domain/secrets/environment-variable mutation; production-data writes; public D1 cutover; rollback; V2B; S6/S7 resumption; D-068 mutation; PR #7 or PR #10 merge; force push; main alteration.
- **Held positions:** S6 remains parked at `ML-DEVOS-AS-103`. O1/O2 remain open. D-068 remains suspended.
- **Return:** on success, archive/deselect the directive byte-for-byte, publish exact promotion and runtime evidence, reset every action flag to NO, and route to `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.

### D-087 — Authorize MaisogLabs V10 Visual Parity + Admin Architecture Planning

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-116` routed the repository to Paulo with the known Gate D API incident temporarily accepted.
- **Owner authorization:** Paulo supplied it in the Builder session, and the Builder recorded it here as publisher. The operative terms are quoted verbatim. This entry proves provenance, not authority beyond Paulo's words.
- **Decision (verbatim title):** "Authorize MaisogLabs V10 Visual Parity + Admin Architecture Planning". "THIS IS PLANNING ONLY."
- **Source of truth (verbatim):** "V10 IS THE WEBSITE DESIGN TARGET."
  - Package `Maisog Labs website design.zip`, SHA-256 `79f0a455967b808780cde89c2dcde821c7d7d99e7700ee60dc7aba4cb9c61c2a` (owner-reported; its 202 entries were committed by Paulo at `98a26e2d05f1056806994ea80716ed84960e3e39` under `design-references/claude-v10/`).
  - Primary artifact `Maisog Labs Home v10.dc.html`, SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`.
  - Earlier versions are historical references only. The package `CLAUDE.md` and Design Panel files are design context, not governance authority.
- **Authorized:**
  - repository inspection and local V10 artifact inspection;
  - local read-only rendering/screenshots and difference analysis;
  - architecture planning and admin capability mapping;
  - SU evidence analysis and SENTINEL execution planning;
  - Design Panel review;
  - planning/coordination documentation, limited to one primary artifact, `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`, plus Protocol V2 records.
- **Required analysis:**
  - resolve explicitly the conflict between RFC-010 (V3 composition / V3 + soft-geometry fail-safe baseline) and V10, and reconcile the V2A plan;
  - formalize "CODE OWNS V10. ADMIN OPERATES V10. CONTENT PROVIDES FACTS. SENTINEL GOVERNS AUTHORITY/EXECUTION", with a fail-safe that remains V10 without D1;
  - produce the exact V10 contract and asset hashes, a current→V10 parity matrix, an admin-control matrix and a deterministic visual-acceptance method;
  - keep API-incident diagnosis a separate, read-only-first sub-plan;
  - include a Design Panel review, with Independent Critic and Layperson passes;
  - propose increments (candidates: V10-A, V10-B, API-DIAG, API-FIX, V10-RELEASE) as planning only.
- **NOT authorized:**
  - application implementation, public-site source modification, or admin implementation;
  - Worker modification;
  - D1 mutation or migration, or R2 mutation;
  - media integration into the repository;
  - Access, DNS/domain or environment/secret mutation;
  - main merge, deployment, production promotion or rollback;
  - a PR #7 or PR #10 merge;
  - V2B implementation, S6/S7 or D-068.
- **Return:** handoff `H-WEB-V10-PLAN-0001`, routed to the Architect, with all action flags NO.

### D-088 — Approve V10 content/routing decisions and authorize RFC-021 drafting only

- **Decided by:** Paulo (Product / Risk Owner), after `ML-DEVOS-AS-117` approved the V10 plan for owner decision at governance tip `fb4f2121cff9eaee3c9fd27ef2a2ab50cd76e6a7`.
- **Recording provenance:** Paulo supplied the decisions and bounded RFC authorization explicitly in the current session. The Builder records them here as mechanical publisher. This entry proves provenance, not authority beyond Paulo's words.
- **Project content:** publish all eight unique projects: Sentinel/DevOS; SU; ClinicFlow; Maisog Kilat; Maisog Guild; Automation Hub; Cybersecurity Lab; Experimental Projects. ClinicFlow appears once. Eventual public copy must remain factual, plain-language, and content-source-backed; prototype copy is not approved merely because it appears in V10.
- **Contact:** use `paulo.maisog@maisoglabs.com`.
- **Research routing:** `#journal` is canonical; `#research` is a compatibility alias to the same Research/Journal surface; new links use `#journal`.
- **Approved mobile divergences:** D1 replaces clipped narrow-screen navigation with an accessible compact/mobile navigation model; D2 fixes overlapping Systems diagram labels at narrow widths. Both must appear in the future divergence register.
- **Runtime safeguard:** accept AS-117's requirement that runtime mapping, not only the admin UI, normalizes and clamps surface opacity to `80..90` and border intensity to `10..25`, prevents stale persisted or direct API values within RFC-010's older ranges from drifting canonical V10, and ignores removed-from-UI fields.
- **Authorized scope:** draft `ML-DEVOS-RFC-021 — V10 Canonical Visual Baseline` and update its RFC index, plus the normal Protocol V2 coordination, directive-archive, and handoff evidence needed for return. This is documentation and architecture drafting only.
- **Required RFC-021 relationship:** supersede RFC-010 only where RFC-010 fixes the V3/soft-geometry visual baseline, composition, and default-parity target. Preserve RFC-010's authentication, positive allowlists, stale-write protection, immutable revisions, draft/preview/publish lifecycle, public published-only projection, and prohibition on arbitrary CSS, HTML, JavaScript, URLs, and asset inputs. Preserve V2A as historical accepted work and establish V10 as the static fail-safe baseline.
- **Required RFC-021 inputs:** incorporate the eight-project decision, contact email, `#journal`/`#research` routing, approved D1/D2 fixes, and runtime-enforced opacity/border ranges.
- **Separate track:** API-DIAG remains separate and unauthorized by this decision.
- **Not authorized:** RFC acceptance; V10-A or V10-B implementation; application, admin, Worker, migration, package, public runtime, media, or Cloudflare configuration changes; API diagnosis/fix; D1/R2/Access/DNS/domain/secret/environment mutation; main merge; deployment, promotion, rollback; PR #7 or PR #10 merge; V2B; S6/S7; D-068.
- **Directive:** issue `DIR-WEB-V10-RFC021-0001` with scope `D088_V10_RFC021_DRAFT_ONLY`, routed to Claude. Every action-specific authorization flag remains NO.

### D-089 — Accept ML-DEVOS-RFC-021 V10 Canonical Visual Baseline

- **Decided by:** Paulo (Product / Risk Owner), at the owner gate opened by `ML-DEVOS-AS-118` on governance tip `c7fc14d7debdd7bdb45c994d5fbaba57ed3ef906`.
- **Owner authorization:** Paulo instructed "proceeed" in the current session after the repository reported RFC-021 ready for his separate acceptance decision. Under the exact live scope `AS118_RFC021_PAULO_ACCEPTANCE_DECISION_ONLY`, this records acceptance of RFC-021 only and does not infer implementation authority.
- **Decision:** accept `ML-DEVOS-RFC-021 — V10 Canonical Visual Baseline` as the governing architecture for the next V10 work, exactly as independently approved by `ML-DEVOS-AS-118` with verdict `READY TO COMMIT: YES WITH FOLLOW-UP`.
- **Accepted architecture:** V10 is the static, code-owned fail-safe baseline; RFC-010 is superseded only for its V3/soft-geometry visual baseline, composition, and default-parity target; RFC-010 security, allowlist, revision, lifecycle, and published-only invariants remain in force; V2A remains historical accepted work.
- **Accepted owner inputs:** eight unique projects with ClinicFlow once and factual/content-source-backed copy; contact `paulo.maisog@maisoglabs.com`; canonical `#journal` with `#research` compatibility alias; approved D1/D2 mobile corrections; runtime-enforced opacity `80..90` and border intensity `10..25`; removed controls ignored by runtime.
- **Binding follow-up:** `AS118-F001` remains a future implementation-acceptance requirement. Before a V10 implementation can be accepted, its contract and tests must lock the exact overlay input-to-opacity mapping, V10-exact point, monotonicity, invalid fallback, and boundaries. `AS118-F002` is a non-blocking immutable-handoff navigation note; the RFC text is correct.
- **No implementation authority:** this decision does not authorize V10-A, V10-B, media integration, API-DIAG/API-FIX, application/admin/Worker/runtime changes, migrations, packages, D1/R2/Access/DNS/domain/secret/environment actions, main merge, deployment, promotion, rollback, PR #7/#10 merge, V2B, S6/S7, or D-068.
- **Next gate:** any V10-A or V10-B implementation requires a new explicit Paulo decision and a new bounded Protocol V2 directive. All action-specific flags remain NO.

### D-090 — Authorize V10-A public visual-baseline implementation only

- **Decided by:** Paulo (Product / Risk Owner), after D-089 accepted RFC-021 and the live state routed the next bounded V10 decision to him.
- **Owner authorization:** Paulo instructed "so next proceed", "ur turn", and then confirmed that the agent had previously been able to perform this work directly. The Builder records those instructions here as mechanical publisher. This entry proves provenance and applies the instruction only to the next dependency-ordered increment, V10-A; it is not blanket authority for later V10 work.
- **Decision:** authorize the Builder to implement **V10-A only**: the public V10 static fail-safe baseline defined by accepted `ML-DEVOS-RFC-021`, including the approved eight-project content, contact address, canonical/alias routing, D1/D2 mobile corrections, fixed local media and self-hosted font integration, bounded public design-runtime mapping, deterministic tests, and local visual-parity evidence.
- **Exact allowed implementation surfaces:** `app/layout.js`, `app/page.js`, `app/globals.css`, `app/DesignRuntime.js`; `components/site/**`; `data/site.js`; `lib/content/schema.mjs`; `lib/design/**`; `public/v10/**`; V10-focused files under `tests/**`; the V10 product contract/evidence files under `docs/product/**`; and the normal Protocol V2 coordination, directive archive/provenance/index, and Builder handoff records required for the return.
- **Media authority:** `MEDIA_MUTATION_AUTHORIZED: YES` only for copying fixed, allowlisted V10 source assets from `design-references/claude-v10/**` into `public/v10/**`, adding self-hosted font files with source/license records, and producing source-identified optimized derivatives when useful. Reference bytes remain unchanged. No R2 or remote-media mutation is authorized.
- **Runtime authority:** `MUTATION_AUTHORIZED: YES` only for the listed public application, content, design-mapping, test, and documentation surfaces. Runtime must keep V10 as the static baseline when `/api/design` fails; ignore removed presentation fields; clamp panel opacity to `80..90`, border intensity to `10..25`, and radius scale to `80..120`; map fixed animation modes; and satisfy AS118-F001 by locking the overlay mapping, V10-exact point, monotonicity, invalid fallback, and boundaries in contract and tests.
- **Content and routing:** publish exactly the eight approved unique projects (Sentinel/DevOS, SU, ClinicFlow, Maisog Kilat, Maisog Guild, Automation Hub, Cybersecurity Lab, Experimental Projects), with ClinicFlow once and factual plain-language copy. Use `paulo.maisog@maisoglabs.com`. New links use `#journal`; `#research` remains a compatibility alias to the same surface. D1 accessible compact/mobile navigation and D2 narrow Systems-label correction are required and documented divergences.
- **Required validation:** focused V10 tests, full `npm test`, `npm run build`, `git diff --check`, asset/source hash manifest verification, and local desktop plus narrow/mobile visual evidence against the approved V10 reference. Remote or production behavior must not be claimed from local evidence.
- **Return:** one normal Protocol V2 Builder return commit carries the implementation and evidence, archives/deselects the outgoing directive byte-for-byte with provenance, clears the live directive selectors, and routes to the Architect for independent review.
- **Explicitly not authorized:** V10-B admin remapping; API-DIAG or API-FIX; Worker or migration changes; package or lockfile changes; D1, R2, Access, DNS/domain, secret, environment, or production-data action; theme publication; main merge; PR #7 or PR #10 merge; deployment, promotion, rollback; V2B; S6/S7; or D-068.
- **Directive:** issue `DIR-WEB-V10-A-0001` with scope `D090_V10_A_PUBLIC_BASELINE_IMPLEMENTATION_ONLY`, routed to the Builder. Remote-resource, deployment, audit, and main-merge flags remain `NO`.

### D-091 — Authorize AS-119 V10-A remediation cycle 1 only

- **Decided by:** Paulo (Product / Risk Owner), at the owner gate opened by `ML-DEVOS-AS-119` on governance tip `3a4b75901032e4b3bdc798dd07572cdc692bb443`.
- **Owner authorization:** Paulo explicitly stated, "I authorize AS-119 remediation cycle 1 within the recommended bounded scope." This entry records that exact bounded authorization and does not infer authority beyond the four corrective items in AS-119.
- **Decision:** authorize V10-A remediation cycle 1 only, with `ML-DEVOS-AS-119` as the controlling review and D-090/RFC-021 as the underlying implementation architecture.
- **Exact corrective scope:** consolidate the required V10 rules into `app/globals.css`, remove the V10 stylesheet import from `app/layout.js`, and delete `app/v10.css`; remove fixed Journal-entry imagery from `components/site/ResearchSurface.js` without adding any backend or media-serving route; add the missing D-090/RFC-021 deterministic tests; and complete the required local visual, accessibility, parity, divergence, and runtime-network evidence.
- **Exact allowed surfaces:** `app/layout.js`; `app/globals.css`; deletion of `app/v10.css`; `components/site/ResearchSurface.js`; V10-focused files under `tests/**`; `docs/product/V10_IMPLEMENTATION_CONTRACT.md`; `docs/product/V10_DIVERGENCE_REGISTER.md`; `docs/product/evidence/v10/**`; and normal Protocol V2 coordination, directive archive/provenance/index, and Builder handoff records required for the return.
- **Validation:** run focused V10 checks, content/D1 compatibility checks, full `npm test`, `npm run build`, `git diff --check`, asset/evidence hash verification, the complete RFC-021 screenshot matrix, fixed-timestamp and Still-mode comparison, pinned-reference/per-pixel comparison, contrast and automated accessibility audit, and runtime-network assertion. If the full suite remains non-green for out-of-scope pre-existing failures, preserve the exact failure evidence and stop for Architect/owner disposition rather than modifying unrelated surfaces.
- **Mutation authority:** `MUTATION_AUTHORIZED: YES` only for the exact corrective surfaces above. `MEDIA_MUTATION_AUTHORIZED: NO`; no new or replaced media is authorized.
- **Explicitly not authorized:** any other application or documentation cleanup; README/ARCHITECTURE/comment modernization; V10-B; API-DIAG or API-FIX; Worker, migration, package, lockfile, D1, R2, Access, DNS/domain, secret, environment, production-data, theme-publication, main-merge, deployment, promotion, rollback, PR #7 or PR #10 merge, V2B, S6/S7, or D-068 work.
- **Return:** one Protocol V2 Builder return archives and deselects the directive, records exact changed files and evidence, clears action flags, and routes to the Architect for independent re-review under a new Sync ID.
- **Directive:** issue `DIR-WEB-V10-A-REM1-0001` with scope `D091_V10_A_REMEDIATION_CYCLE_1_ONLY`, routed to Claude/Builder. All remote, audit, deploy, and main-merge flags remain `NO`.

### D-092 — Authorize the V10 controlled clean replacement of the public website presentation

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `146f645390fd24099426c3cb8ab8a511eafb12db`, while `H-WEB-V10-A-REM1-0001` awaited Architect re-review under `ML-DEVOS-AS-119`. Published by Claude/Builder as the mechanical publisher of Paulo's instruction; committed text proves provenance, not authority.
- **Owner instruction (summary of the session message):** stop incrementally repairing the current website presentation and use the approved V10 website design/package as the new implementation baseline, as a CONTROLLED CLEAN REPLACEMENT: replace the website application/presentation layer with V10 as faithfully as possible while preserving required backend/runtime infrastructure; create a recoverable snapshot first; remove obsolete frontend code superseded by V10; avoid hybridizing with the old design; classify each backend/API as required, replaced, unused or uncertain; test locally and on a Cloudflare preview/staging deployment; run an SU adversarial pass; stop before production promotion.
- **Owner answers recorded in the same session:** (1) Claude publishes this decision; (2) content: **V10 layout and interactions, D-088 facts** — the eight owner-approved projects (ClinicFlow once), `paulo.maisog@maisoglabs.com`, `#journal` canonical with `#research` as alias, and real published Journal entries from `/api/journal` in place of V10's placeholder notes; every resulting difference is documented; (3) preview: this cloud session cannot reach Cloudflare, so the preview is produced by the existing Workers Builds non-production branch build (`npx wrangler versions upload`, no promotion; D-055 / `ML-DEVOS-AS-074`) and verified by Paulo from an authenticated session.
- **Supersession:** this decision supersedes the pending Architect re-review of `H-WEB-V10-A-REM1-0001` (archived unreviewed as evidence) and the incremental V10-A remediation path. For the public homepage it supersedes RFC-021's bounded `/api/design` public variation layer (§7) and D-090's component structure: the public page no longer consumes `/api/design`. RFC-010/RFC-021 server-side invariants (authentication, allowlists, stale-write protection, immutable revisions, published-only projection, arbitrary-input prohibition) are untouched because no Worker or admin code changes. This architectural consequence requires Architect review.
- **Rollback point:** branch `snapshot/pre-v10-clean-replacement` at `146f645390fd24099426c3cb8ab8a511eafb12db` (a tag push was refused by the session proxy).
- **Allowed surfaces:** `app/page.js`, `app/layout.js`, `app/globals.css`, deletion of `app/DesignRuntime.js`; `app/journal/page.js` and a new `app/journal/**` stylesheet only to relocate the prior stylesheet so it loads on `/journal` alone; deletion/replacement of `components/site/**`; new `components/v10/**`; deletion of `lib/design/**`; V10 content additions in `data/site.js` and `lib/content/schema.mjs` (the `siteContent` document and its D1 parity stay unchanged); tests for the replaced frontend under `tests/**` (obsolete suites for deleted code removed, new V10 suites added); `docs/product/V10_*.md` and `docs/product/evidence/v10/**`; and normal Protocol V2 coordination records.
- **Preserved (not authorized to change):** `worker/**`, `migrations/**`, `wrangler.jsonc`, `package.json`, `package-lock.json`, `app/admin/**`, `public/**` (reuse only), `.github/**`, governance/SENTINEL/DevOS records, D1/R2 data and bindings, secrets, Access, DNS, Cloudflare configuration.
- **Mutation authority:** `MUTATION_AUTHORIZED: YES` for the allowed surfaces only. `MEDIA_MUTATION_AUTHORIZED: NO`.
- **Deployment:** `DEPLOY_AUTHORIZED: NO`. A governance-branch push produces a non-production Workers Builds preview version with a preview URL; that is the authorized preview path. Production promotion, traffic shift, rollback, main merge, D1/R2/Access/DNS/secret/environment action, and any destructive Cloudflare change are not authorized.
- **Explicitly not authorized:** deleting D1 databases or production data; rewriting governance history; S6/S7; D-068; V2B; V10-B admin remapping; API-DIAG/API-FIX; PR #7 or PR #10 merge; protected-branch bypass.
- **Return:** one Protocol V2 Builder return with the replacement, evidence, backend/API classification, SU adversarial pass, preview identity, and the exact production promotion operation, routed to the Architect.
- **Directive:** issue `DIR-WEB-V10-CLEAN-0001` with scope `D092_V10_CLEAN_REPLACEMENT_PREVIEW_ONLY`, routed to Claude/Builder.

### D-093 — Serve the published Design System artifact byte-for-byte as the homepage (preview only)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `3a8bb779ddb7ecf6daca2655f0844986c3b81aa8`, while `H-WEB-V10-CLEAN-0001` awaited Architect review. Published by Claude/Builder as the mechanical publisher of Paulo's instruction (same route Paulo selected for D-092); committed text proves provenance, not authority.
- **Artifact:** `Maisog Labs Design System.zip` (SHA-256 `3ff9fbbaaf40f61fc9b82babafac4e33e9cdc5b723ed78157ef1b2068da6ead2`), containing exactly one file, `publish/index.html` (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`): a self-unpacking Claude Design bundle with embedded React/ReactDOM (development builds), Babel standalone, the MaisogLabs Design System component bundle, the website UI kit and its fonts.
- **Owner instruction (summary):** do not rebuild, recreate in React, translate into V10 components, or approximate the logo, motion or interactions; the exact published artifact must become the public homepage `/`, preserved byte-for-byte and never manually edited, with its SHA-256 recorded; adapt the environment around it (build placement at `out/index.html` after the normal Next.js export; relative media paths served from the existing approved V10 assets). Keep `/journal`, `/admin`, `/api/journal*`, the admin APIs, Worker routing, Access, D1/R2 configuration and existing public assets working. Supersedes the Architect's pending Design System reconciliation-analysis request and the pending review of `H-WEB-V10-CLEAN-0001` (archived unreviewed as evidence).
- **Recorded consequences (not resolvable without editing the artifact):** the homepage shows the artifact's own content — five projects (not the eight D-088 projects), `Sentinel / DevOS` spelling, contact `maisog36@gmail.com` (not `paulo.maisog@maisoglabs.com`), three hardcoded placeholder Research notes with category filters (not real Journal entries), no `#research`/`#process`/`#about` aliases, and no compact mobile navigation. It runs React development builds and in-browser Babel shipped inside the artifact, which supersedes RFC-021 R2 ("no Babel / CDN React") for the homepage only; no network CDN is used. These supersede D-088 content and D-092 D1/N1 for `/` by owner instruction and require Architect review.
- **Rollback point:** `3a8bb779ddb7ecf6daca2655f0844986c3b81aa8` (the D-092 V10 homepage) and branch `snapshot/pre-v10-clean-replacement` (`146f645`).
- **Allowed surfaces:** `public/index.html` (the artifact, byte-identical); byte-identical copies of existing `public/v10/assets/**` files at the artifact's expected `public/assets/**` paths; deletion of `app/page.js`, `components/v10/**`, and the now-unused `v10Content`/`validateV10Content` in `data/site.js`/`lib/content/schema.mjs` with their suite `tests/v10-home.test.mjs`; a new homepage-artifact test; `design-references/maisoglabs-design-system/**` (the uploaded ZIP and a provenance README); `docs/product/**` homepage contract/evidence; Protocol V2 coordination records.
- **Preserved:** `worker/**`, `migrations/**`, `wrangler.jsonc`, `package*.json`, `app/admin/**`, `app/journal/**`, `app/layout.js`, `app/globals.css`, existing `public/**` files, `.github/**`, governance/SENTINEL/DevOS records, D1/R2 data and bindings, Access, DNS, secrets.
- **Flags:** `MUTATION_AUTHORIZED: YES` for the allowed surfaces only; `MEDIA_MUTATION_AUTHORIZED: NO` (media are copied, not created or altered); `DEPLOY_AUTHORIZED: NO`. The governance-branch push produces the existing non-production Workers Builds preview version; production promotion, main merge, remote D1/R2, Access/DNS/secret changes, S6/S7 and D-068 remain unauthorized.
- **Directive:** issue `DIR-WEB-HOMEPAGE-ARTIFACT-0001` with scope `D093_HOMEPAGE_ARTIFACT_PREVIEW_ONLY`, routed to Claude/Builder.

### D-094 — Authorize D-093 homepage Gate C protected main merge without production promotion

- **Decided by:** Paulo (Product / Risk Owner).
- **Owner authorization provenance:** Paulo authorized the release sequence and explicitly selected the Architect-side publication route for the D-093 Gate C transition. The present owner request directs publication of this bounded decision and transition.
- **Bound implementation candidate:** `f2c13aa3dbc65b3829f1a8f64437a929392369a5`.
- **Bound canonical homepage artifact SHA-256:** `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- **Main baseline at authorization/review:** `aebc881e8890c00090d714602591138a045bd3b0`.
- **Owner runtime evidence:** Paulo opened the non-production Workers preview in a normal browser and confirmed the shipped logo animation and site motion operate correctly.
- **Fresh Cloudflare configuration evidence:** Paulo inspected the live Cloudflare dashboard read-only and confirmed production branch `main`, Version command `npx wrangler versions upload`, non-production branch builds enabled, and root directory `/`. No Cloudflare setting was changed.
- **Authorized Gate C actions only:** record this decision; publish the Architect D-093 acceptance and bounded Gate C directive; create one fresh `governance/maisoglabs-v0.1 -> main` release PR; perform fresh read-only release-state checks; require exact-final-head Linux CI; merge through the normal protected GitHub PR path with a normal merge commit; observe the resulting main Workers Build/version upload; verify production traffic remains on the exact pre-merge active version; publish the Builder return.
- **Not authorized:** `wrangler versions deploy`; production promotion or traffic shift; rollback; direct push to main; force push; squash/rebase/auto-merge; protection bypass; website/runtime or Design System artifact modification; Claude Design's later Research-scroll artifact; D1/R2/Access/DNS/domain/secrets/environment mutation; production-data writes; S6/S7; D-068; PR #7 merge; PR #10 merge.
- **Gate D:** remains separately Paulo-gated.

### D-095 — Authorize D-093 Gate D exact production promotion

- **Decided by:** Paulo (Product / Risk Owner), after explicitly authorizing D-093 Gate D in the current session. Claude Code’s auto-mode permission classifier blocked Claude from committing the authority transition, so Paulo manually committed the prepared governance candidate for Protocol V2 validation and publication.
- **Bound identities:** controlling Gate C review `ML-DEVOS-AS-121`; coordination sync `ML-DEVOS-AS-122`; `main` release `7d22a96d10b5e24f5296795c2b049f77093386c3`; Workers Build `8abe1ba1-4b7d-45d3-84b8-97f2beea8cfe` (Architect-verified from GitHub check run `108500903744`); target Worker Version `f473c170-b39c-4d7b-85ad-a99c5208d539`; current production / rollback target `a667fc09-12d1-4fde-a75d-5d660729baa3 @ 100%` (freshly read by the Builder at 2026-09-27T00:04:26Z).
- **Authorized promotion (exactly one):** `npx wrangler versions deploy f473c170-b39c-4d7b-85ad-a99c5208d539@100% --yes`, only after fresh pre-deploy verification that every bound identity is unchanged and production is still `a667fc09-12d1-4fde-a75d-5d660729baa3 @ 100%`, with no traffic split, deployment drift or intervening promotion. Any discrepancy stops the operation without deployment.
- **Conditional rollback (exactly one):** `npx wrangler versions deploy a667fc09-12d1-4fde-a75d-5d660729baa3@100% --yes`, only if the promotion succeeds and post-promotion verification identifies a new material failure caused by this Gate D release. The existing AS-116 Journal/API incident does not qualify and must not be fixed in this operation. No other version may be deployed.
- **Not authorized:** `wrangler deploy`; any new version upload; gradual or split traffic; routes/triggers, DNS/domain, Access, secrets, environment variables, bindings, D1, R2, migrations or production-data changes; website/runtime/product changes; `main` changes; PR #7 or PR #10 action; S6/S7; D-068 or the held draft under `devos/execution/` and `tests/fixtures/execution/`.
- **Flags:** `DEPLOY_AUTHORIZED: YES` for this exact operation only; every other action flag `NO`.
- **Return:** one Protocol V2 Builder return with the pre-deploy active version, exact command and result, post-deploy active version and percentage, bounded production verification, rollback status and evidence, and confirmation that no unrelated resource was touched; deploy authority and all action flags reset to `NO`; routed to the Architect for independent Gate D closure review.
- **Directive:** issue `DIR-WEB-D093-GATE-D-0001` (cycle `MAISOGLABS_WEB_D093_GATE_D`, scope `D095_D093_GATE_D_PRODUCTION_PROMOTION_ONLY`, applicable review `ML-DEVOS-AS-121`), routed to Claude/Builder.

### D-096 — Authorize AS-116 production API incident Stage A diagnosis and repository/local remediation only

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `eaf174811042d9da73137193c2888dabfa5614fb` (D-093 closed by `ML-DEVOS-AS-123`). Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Incident:** AS-116 (`ML-DEVOS-AS-116`): production `GET /api/design` and `GET /api/journal` return HTTP 500 / Worker Error 1101. Root cause unresolved.
- **Architect lead (not a proven root cause):** both public handlers use `env.DB` and return 503 when it is absent, yet production returns 1101/500; checked-in `wrangler.jsonc` declares D1 binding `DB` with database name `maisog-labs-web-inc-005-local`, `remote: false` and no production `database_id`. The production D1 binding/runtime path is a prime suspect. It must be proven against Cloudflare evidence, distinguishing an absent binding from a bound database with missing/incompatible schema or another runtime exception.
- **Authorized objective:** determine the root cause of both failures; if the root cause can be corrected entirely in repository/local scope, prepare and test that remediation.
- **Authorized actions:** Protocol V2 bootstrap and publication; read-only inspection of Worker/version configuration, bindings visible through Wrangler, deployment/version metadata, D1 database metadata/listing, and production logs/errors where available read-only; read-only production HTTP reproduction of the two endpoints; repository Worker/D1 code, migrations/schema and tests; local D1/Worker reproduction; repository/local changes for a bounded fix only if the root cause is demonstrated; local tests/builds; one Builder handoff with the root cause (or strongest proven cause), evidence, the exact proposed production change if any, and risk/rollback requirements.
- **Not authorized:** creating, deleting, migrating, writing to, querying with `--remote`, or altering any remote D1 database; production D1 data changes; production binding changes; Cloudflare routes, DNS, Access, secrets, environment variables or R2 changes; deploying or promoting any Worker version (`wrangler deploy`, `wrangler versions deploy`) or a manual `wrangler versions upload` (the existing Workers Builds non-production branch build triggered by a governance-branch push uploads an inactive version and is not a promotion); `main` mutation; merging any PR; PR #7 or PR #10; S6/S7; D-068. Creating a new production database merely because the repository config is local-only is explicitly not a fix.
- **Flags:** `MUTATION_AUTHORIZED: YES` for repository/local changes only; `REMOTE_D1_AUTHORIZED`, `REMOTE_R2_AUTHORIZED`, `MEDIA_MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED`, `DEPLOY_AUTHORIZED` and `MAIN_MERGE_AUTHORIZED` stay `NO`.
- **Escalation:** any production repair requiring a D1 binding/resource/configuration change returns to Paulo with the exact resource, exact intended change, and rollback plan before execution.
- **Directive:** issue `DIR-WEB-AS116-STAGE-A-0001` (cycle `MAISOGLABS_WEB_AS116_STAGE_A`, scope `D096_AS116_STAGE_A_DIAGNOSIS_LOCAL_REMEDIATION_ONLY`, applicable review `ML-DEVOS-AS-123`), routed to Claude/Builder.

### D-097 — Authorize AS-116 Stage B exact production D1 migration repair

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `84b5f2b2b2c4bc2ad5ee94541daf961419ef601d`, after `ML-DEVOS-AS-124` accepted the AS-116 Stage A root cause. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:** `main` `7d22a96d10b5e24f5296795c2b049f77093386c3`; production Worker version `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100%; production D1 `maisog-labs-web-inc-005-local` (`45b87574-e573-4e0f-9bb6-fbba2df29523`), bound to the active version as `DB`.
- **Authorized resource (only):** D1 `maisog-labs-web-inc-005-local` / `45b87574-e573-4e0f-9bb6-fbba2df29523`. No other D1 database.
- **Authorized migration (only):** the repository's existing canonical `migrations/0001_web_inc_005_init.sql`, `0002_web_inc_008_audit_log.sql`, `0003_web_inc_004_media.sql`, `0004_web_inc_006_journal.sql`, `0005_web_inc_007_theme.sql`, applied with exactly `npx wrangler d1 migrations apply maisog-labs-web-inc-005-local --remote`. No migration may be created or edited; no arbitrary remote SQL; no additional seeding; no journal content change; no theme data beyond what `0005` canonically seeds.
- **Pre-migration checks:** fresh bootstrap; governance tip equals the published D-097 transition; `main` and the active version unchanged; the active version's `DB` binding still `45b87574-e573-4e0f-9bb6-fbba2df29523`; D1 metadata still `maisog-labs-web-inc-005-local` / `45b87574-e573-4e0f-9bb6-fbba2df29523`; working tree clean; `stash@{0}` untouched; no intervening deployment or binding change. Any difference stops the operation without modifying D1.
- **Mandatory recovery bookmark:** `npx wrangler d1 time-travel info maisog-labs-web-inc-005-local --json` immediately before migration; the returned bookmark is the only authorized rollback target.
- **Conditional rollback (exactly one):** `npx wrangler d1 time-travel restore maisog-labs-web-inc-005-local --bookmark=<PRE_MIGRATION_BOOKMARK>`, only if the migration causes a new material failure; not for cosmetic issues, the `-local` name, deferred hardening or unrelated incidents. After any restore, verify the captured state and stop.
- **Verification:** `/api/journal` → 200 with an empty published-entry collection; `/api/design` → 200 with the seeded default theme; `/` → 200 with the D-093 homepage unchanged; `/journal` reachable; `/admin` keeps its Access behavior; active version still `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100%.
- **Not authorized:** Worker deploy, version upload, promotion or traffic shift; new or deleted D1; remote R2 mutation; Access, DNS, secret, environment or binding changes; runtime/product code change; `wrangler deploy`; `wrangler versions deploy`; `main` mutation or merge; PR #7 or PR #10; S6/S7; D-068; renaming or replacing the database. `remote: false` comments, explicit resource pinning, R2 review and 503 hardening belong to a separate post-incident hardening cycle.
- **Flags:** `REMOTE_D1_AUTHORIZED: YES` for this exact operation only; every other action flag `NO`.
- **Return:** one Protocol V2 Builder return with the pre-migration bookmark, exact command and output, migrations applied, post-migration API evidence, active version confirmation and confirmation that no unrelated remote resource was touched; `REMOTE_D1_AUTHORIZED` reset to `NO`; routed to the Architect.
- **Directive:** issue `DIR-WEB-AS116-STAGE-B-0001` (cycle `MAISOGLABS_WEB_AS116_STAGE_B`, scope `D097_AS116_STAGE_B_PRODUCTION_D1_MIGRATION_ONLY`, applicable review `ML-DEVOS-AS-124`), routed to Claude/Builder.

### D-098 — Authorize AS-116 post-incident Cloudflare binding/config/error hardening

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `b0a7af9622ce8eb8efbe487a27f7f5920d103b81`, after `ML-DEVOS-AS-125` closed AS-116. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:** `main` `7d22a96d10b5e24f5296795c2b049f77093386c3`; production Worker version `f473c170-b39c-4d7b-85ad-a99c5208d539`; production D1 `maisog-labs-web-inc-005-local` (`45b87574-e573-4e0f-9bb6-fbba2df29523`); production R2 bucket `maisog-labs-web-inc-004-local`.
- **Authorized (repository/local only):**
  1. In `wrangler.jsonc`, keep the `DB` binding's `database_name` `maisog-labs-web-inc-005-local` and add `database_id` `45b87574-e573-4e0f-9bb6-fbba2df29523`.
  2. Correct the false claims that `remote: false` means a binding "can never" target production. The comments must say that `remote: false` governs local-development binding behavior only; that deployed Worker bindings reference real Cloudflare resources; that the production D1 identity is pinned by `database_id`; and that any remote D1 CLI mutation still needs separate governance authority.
  3. Document the `MEDIA` R2 binding accurately. It is identified by `bucket_name` alone (`maisog-labs-web-inc-004-local`); no invented bucket-ID field. Correct the claim that `remote: false` stops the deployed Worker binding the real bucket.
  4. In `worker/public/journal.mjs` and `worker/public/design.mjs`, a missing `DB` still returns 503. D1 query, schema or runtime failures must return a controlled JSON 503 that leaks no SQL, table name, binding or resource ID, stack trace or exception detail. The 200/404/405 behavior and the published-data visibility rules must not change.
  5. Bounded tests: missing DB → 503; a bound DB that throws → controlled 503; a valid migrated DB → the existing successful responses; unknown Journal slug → 404; unsupported methods → 405; no internal details in error bodies. Optionally, a configuration test that the `DB` binding carries the exact `database_id`. Run the full test suite and the production build locally.
- **Not authorized:** any remote D1 query or write, migration or Time Travel restore; any R2 read or write; Worker version upload, deploy or promotion; Cloudflare binding change; Access, DNS, secret or environment change; creating, deleting or renaming any Cloudflare resource (including the `-local` names); a preview D1 database; `main` merge; PR #7 or PR #10; S6/S7; D-068.
- **Flags:** `MUTATION_AUTHORIZED: YES` for repository/local changes within this scope only. Every remote, deploy and other action flag is `NO`.
- **Return:** one Protocol V2 Builder return listing the files changed, the exact config change, test/build results and the 503 behavior evidence, and confirming that no remote Cloudflare resource was touched and `main` is unchanged. Every flag is reset to `NO` and the return is routed to the Architect. S6 stays parked until the Architect accepts this cycle.
- **Directive:** issue `DIR-WEB-AS116-HARDENING-0001` (cycle `MAISOGLABS_WEB_AS116_HARDENING`, scope `D098_AS116_POST_INCIDENT_HARDENING_REPOSITORY_ONLY`, applicable review `ML-DEVOS-AS-125`), routed to Claude/Builder.

### D-099 — Authorize D-098 Hardening Gate C Protected Main Release

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `d2ed608139265dc58e75963e01634726fd7b2254`, after `ML-DEVOS-AS-126` accepted the D-098 hardening. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:** `main` `7d22a96d10b5e24f5296795c2b049f77093386c3`; expected active production `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100%; D-093 homepage SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- **Authorized (Gate C only):**
  - one fresh protected PR from `governance/maisoglabs-v0.1` to `main`, with its final head pinned to the published D-099 transition head;
  - exact-final-head `test-and-build` CI SUCCESS, plus the Cloudflare Workers check if it runs;
  - local `npm test`, `npm run build` and `git diff --check`, and the homepage hash;
  - `PRE_MERGE_ACTIVE_VERSION_ID` recorded;
  - one normal merge-commit merge with the expected head pinned;
  - the `main` Workers Build observed, with its inactive version upload recorded;
  - `POST_MERGE_ACTIVE_VERSION_ID` equal to `PRE_MERGE_ACTIVE_VERSION_ID`, still at 100%.
- **Release content:** the eight AS-126-accepted files (`wrangler.jsonc`, `worker/public/journal.mjs`, `worker/public/design.mjs`, `scripts/d1-migrate.mjs`, `docs/ARCHITECTURE.md`, `tests/cloudflare-bindings-config.test.mjs`, `tests/worker-public-journal.test.mjs`, `tests/worker-public-design.test.mjs`), plus the governance/audit records accumulated since the last `main` release. No `migrations/**`, homepage artifact, `package.json`, lockfile, Access, DNS, secret or production-data change.
- **Production readings:** the Builder's cloud session cannot reach Cloudflare. The pre- and post-merge active-version readings are therefore supplied by Paulo from the dashboard and classed `OWNER_REPORTED`, as at D-094 Gate C.
- **Not authorized:** Gate D; `wrangler versions deploy`; promotion; traffic change; rollback; D1 migration, remote SQL or Time Travel; R2 mutation; Cloudflare binding, Access, DNS, secret or environment change; creating, deleting or renaming resources; squash, rebase, direct push, force, auto-merge or protection bypass; PR #7; PR #10; S6/S7; D-068.
- **Flags:** `MAIN_MERGE_AUTHORIZED: YES` for this exact Gate C only; every other action flag `NO`.
- **Return:** Builder return `H-WEB-D098-GATE-C-0001` with the D-099 publication SHA, PR number, base and head, CI, merge commit, release diff, Workers Build ID, new version ID, pre and post active version, proof that pre equals post, and proof that no Gate D command ran. `MAIN_MERGE_AUTHORIZED` is reset to `NO` and the return is routed to the Architect.
- **Directive:** issue `DIR-WEB-D098-GATE-C-0001` (cycle `MAISOGLABS_WEB_D098_GATE_C`, scope `D099_D098_GATE_C_PROTECTED_MAIN_RELEASE_ONLY`, applicable review `ML-DEVOS-AS-126`), routed to Claude/Builder.

### D-100 — Authorize D-098 Hardening Gate D Production Promotion

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `cb9d2da9869cfdad780d120678e238a9e5036587`, after `ML-DEVOS-AS-127` accepted and closed the D-099 Gate C. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:** `main` `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`; `main` Workers Build `e2a2d328-76d0-4361-816e-3b74c0c7b5c7` (check run `108607242213`, Architect-verified in AS-127); candidate Version `53137101-afb8-456c-ab83-d8b7b934df01`; current production and rollback target `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100%.
- **Pre-promotion checks:**
  - fresh bootstrap selecting this directive;
  - governance, `main`, build and candidate identities unchanged, with no newer `main` release;
  - a read-only smoke test of `https://53137101-maisog-labs.paulomaisog284.workers.dev`: `/` 200 serving the D-093 artifact, `/api/journal` and `/api/design` healthy, no 1101;
  - a fresh read of active production immediately before promotion (`PRE_GATE_D_ACTIVE_VERSION_ID`), which must be exactly `f473c170-b39c-4d7b-85ad-a99c5208d539` at 100%. The Gate C reading may not be reused; if the executor cannot read it directly, Paulo supplies one fresh dashboard reading (`OWNER_REPORTED`).

  Any difference, split, ambiguity or unhealthy candidate stops the operation without promotion.
- **Authorized promotion (exactly one, run once):** `npx wrangler versions deploy 53137101-afb8-456c-ab83-d8b7b934df01@100% --yes`. No force, no second version, no split, no `wrangler deploy`, no version upload.
- **Post-promotion verification (read-only):**
  - active deployment exactly `53137101-afb8-456c-ab83-d8b7b934df01` at 100%, with its Deployment ID recorded;
  - `https://maisoglabs.com/` 200 with the D-093 artifact unchanged;
  - `/api/journal` 200 (empty collection unless content changed separately);
  - `/api/design` 200;
  - `/journal` 200;
  - `/admin` protection and redirect behavior unchanged.

  D1 must not be damaged or un-migrated to test the 503 path.
- **Conditional rollback (exactly one):** only if this promotion causes a new material production failure (homepage unavailable or materially broken, healthy APIs failing, widespread Worker exceptions or a binding failure attributable to `53137101…`). Command: `npx wrangler rollback f473c170-b39c-4d7b-85ad-a99c5208d539 --message "D-100 rollback: newly caused Gate D production failure"`. After it, require `f473c170…` at 100%, re-run the checks and stop; no further promotion. No rollback for accepted cosmetic differences, empty Journal content, `-local` names, pre-existing issues or evidence limits.
- **Executor capability:** the Builder's cloud session has no Cloudflare network access or credential. The smoke test, production reads, promotion, verification and any rollback must run from an environment with authenticated Cloudflare access, as for D-095 and D-097 (Paulo's local clone). The authority and the return are published through Protocol V2 as usual.
- **Not authorized:** any version upload; code, repository or runtime change; `main` merge; D1 query, write, migration or restore; R2 read, write or mutation; binding, Access, DNS, secret or environment change; creating, deleting or renaming resources; PR #7; PR #10; S6/S7; D-068.
- **Flags:** `DEPLOY_AUTHORIZED: YES` for this exact promotion and conditional rollback only; every other action flag `NO`.
- **Return:** Builder return `H-WEB-D098-GATE-D-0001` with the D-100 publication SHA, pre-deploy active version, candidate, exact command, Deployment ID, post-deploy active version, production HTTP evidence, rollback status, and confirmation that no unrelated resource was touched. `DEPLOY_AUTHORIZED` is reset to `NO` and the return is routed to the Architect. S6 does not start automatically.
- **Directive:** issue `DIR-WEB-D098-GATE-D-0001` (cycle `MAISOGLABS_WEB_D098_GATE_D`, scope `D100_D098_GATE_D_PRODUCTION_PROMOTION_ONLY`, applicable review `ML-DEVOS-AS-127`), routed to Claude/Builder.

### D-101 — Amend D-100 execution path: Gate D promotion through the Cloudflare MCP/API connector

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `964f330e0fa27c1307bedaf7e13a4bde561dee51`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Nature:** a bounded amendment to D-100 that changes only the execution path. It does not broaden the authorized effect. D-100 and `DIR-WEB-D098-GATE-D-0001` remain controlling in every other respect.
- **Amendment:** the currently authenticated Claude Code cloud Builder session may run the already-authorized D-100 promotion through the official Cloudflare MCP/API connector, using the minimum Workers API operation that creates a deployment of exactly `53137101-afb8-456c-ab83-d8b7b934df01` at 100%. This replaces the locally run `npx wrangler versions deploy …` path. The single conditional D-100 rollback may likewise be run through the connector, as a deployment of exactly `f473c170-b39c-4d7b-85ad-a99c5208d539` at 100%, under the unchanged D-100 failure conditions.
- **Bound identities (unchanged):** candidate `53137101-afb8-456c-ab83-d8b7b934df01`; 100% production traffic; current production and rollback target `f473c170-b39c-4d7b-85ad-a99c5208d539`; `main` `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`; one promotion attempt; at most one conditional rollback.
- **Fresh pre-execution checks:**
  1. STATE still selects `DIR-WEB-D098-GATE-D-0001`;
  2. `main` is still `6e14077…`;
  3. active production is exactly `f473c170…` at 100%;
  4. the candidate `53137101…` is healthy;
  5. no newer authorized `main` release replaces it.

  Any difference means stop without promotion and return to Paulo and the Architect.
- **Connector authority:** limited to the read operations these checks need, plus that single deployment-creation call and the conditional rollback. Broader connector capabilities are capability only, not authority.
- **Not authorized:** version upload; deploying another version; traffic splitting; `wrangler deploy`; D1 or R2 access or mutation; DNS, Access, secret, environment or binding changes; creating, deleting or renaming any Worker, Pages project or resource; repository, runtime or code changes beyond the mechanical governance publications for this decision and the Gate D return; PR #7; PR #10; S6/S7; D-068.
- **Inventory findings:** the unrelated Cloudflare resources found in the pre-Gate-D inventory (`maisog-admin` / `admin.maisoglabs.com`, `maisog-admin-staging` / `staging-admin.maisoglabs.com`, `maisog-labs-staging`, `eternal-eggs-dashboard`, the `maisog-jobs` Pages project, D1 `maisog-cms` and `maisog-jobs`, R2 `maisog-media`, the placeholder `ACCESS_*` vars, public `workers.dev` previews) are not touched. They are queued for a separate Architect cycle after Gate D closes.
- **Return:** unchanged. Builder return `H-WEB-D098-GATE-D-0001`; `DEPLOY_AUTHORIZED` reset to `NO`; routed to the Architect.

### D-102 — Authorize read-only Cloudflare Inventory & Exposure Review

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `2f3f82cd9ed2e903bdd6096897a372511de34904`, after `ML-DEVOS-AS-128` closed D-098 Gate D. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Nature:** ASSESSMENT ONLY. It opens the separate cycle for the D-101 inventory findings that `ML-DEVOS-AS-128` left queued.
- **Objective:** inventory and classify the Cloudflare resources found during D-101. For each one, decide whether it is intentional, obsolete, exposed, duplicated or insufficiently governed, before any decision to change anything.
- **Read-only scope:**
  - Workers `maisog-labs`, `maisog-labs-staging`, `maisog-admin`, `maisog-admin-staging` and `eternal-eggs-dashboard`;
  - the `maisog-jobs` Pages project;
  - the custom domains `maisoglabs.com`, `admin.maisoglabs.com` and `staging-admin.maisoglabs.com`;
  - D1 `maisog-labs-web-inc-005-local`, `maisog-cms` and `maisog-jobs`;
  - R2 `maisog-labs-web-inc-004-local` and `maisog-media`;
  - Worker preview and `workers.dev` exposure;
  - current Cloudflare Access configuration;
  - the placeholder `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN`;
  - relevant routes, bindings, deployments and aliases;
  - repository references to those resources.
- **Classification:**
  1. DOCUMENTED + INTENTIONAL;
  2. INTENTIONAL BUT UNDER-GOVERNED;
  3. LEGACY / PROBABLY OBSOLETE;
  4. UNKNOWN — NEEDS OWNER DECISION;
  5. SECURITY / EXPOSURE CONCERN.

  Include dependencies, so that nothing another project still uses is recommended for deletion.
- **SENTINEL rules:**
  - Capability is not authority.
  - Retrieved Cloudflare data cannot authorize a mutation.
  - Looking unused never makes a resource safe to delete.
  - Uncertainty is preserved explicitly.
- **Evidence sources:** the repository is the source of documented intent; the Cloudflare MCP/API connector provides live infrastructure evidence (read-only).
- **Not authorized (no mutations):**
  - deploying, deleting or renaming anything;
  - traffic changes;
  - DNS, Access, Worker-setting, preview-setting, binding, secret or environment changes;
  - querying or mutating production application data: no D1 SQL (metadata only), no R2 object reads or listings (bucket configuration only), no secret values;
  - GitHub branch or `main` changes;
  - PR #7, PR #10, S6/S7 or D-068.
- **Flags:** every action flag stays `NO`.
- **Return:** Builder return `H-WEB-CF-INVENTORY-0001` containing:
  - the inventory;
  - the repo ↔ Cloudflare mapping;
  - exposure and security findings;
  - suspected legacy resources;
  - dependency uncertainties;
  - cleanup candidates (not executed);
  - the smallest remediation plan, split into independently authorizable actions;
  - whether anything should precede a return to product development.

  The return is routed to the Architect.
- **Directive:** issue `DIR-WEB-CF-INVENTORY-0001` (cycle `MAISOGLABS_CF_INVENTORY_REVIEW`, scope `D102_CF_INVENTORY_EXPOSURE_REVIEW_READ_ONLY`, applicable review `ML-DEVOS-AS-128`), routed to Claude/Builder.

### D-103 — Bounded Cloudflare Exposure Remediation: A-1 + A-4 only

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `872f31b16000fa2407a7bc37beffc83f35548d5c`, after `ML-DEVOS-AS-129` accepted the D-102 assessment. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Authorized (exactly two reversible setting changes from AS-129):**
  - **A-1 — `maisog-labs`:** disable preview URLs only. Target `previews_enabled: false`; `workers.dev` stays enabled.
  - **A-4 — `maisog-labs-staging`:** disable `workers.dev` and preview URLs. Target `workers_dev: false`, `previews_enabled: false`. The Worker is not deleted, and its D1/R2 bindings and data are not modified.
- **Pre-change requirement:** a fresh read after publication must show `maisog-labs` previews enabled, and `maisog-labs-staging` with `workers.dev` and previews enabled. Any material difference from the AS-129 assessment stops the cycle without change.
- **Verification:**
  - the `maisog-labs` custom domain is still configured;
  - the active production deployment/version is unchanged;
  - `https://maisoglabs.com/` is healthy (read-only probe);
  - no D1/R2 binding changed;
  - no deployment, version or traffic operation occurred;
  - `maisog-labs-staging` still exists, with its public `workers.dev` and preview exposure disabled.
- **Conditional rollback:**
  - If A-1 unexpectedly disrupts `maisoglabs.com` production, restore only the exact prior A-1 preview setting and stop.
  - If A-4 causes an unexpected material dependency failure directly attributable to disabling these endpoints, restore only the exact prior A-4 settings and stop.
  - Rollback never justifies altering any other resource.
- **Not authorized:**
  - A-2, A-3, A-5, A-6, A-7, A-8 and A-9;
  - disabling `maisog-labs` `workers.dev`;
  - changing Workers Builds triggers;
  - Access, n8n or DNS changes;
  - deployment or traffic changes, or a version upload;
  - Worker deletion or rename;
  - D1 SQL or migration, or R2 object access or mutation;
  - binding, secret or environment changes;
  - `main` changes;
  - PR #7, PR #10, S6/S7, D-068;
  - `devos/execution/`, `tests/fixtures/execution/`, `stash@{0}`.
- **Flags:** `MUTATION_AUTHORIZED: YES` for exactly A-1 and A-4 (and their conditional rollback); every other action flag `NO`.
- **Return:** Builder return `H-WEB-CF-EXPOSURE-REMEDIATION-0001` with the D-103 publication SHA, exact pre-change settings, exact operations, exact post-change settings, production health, the unchanged active deployment, confirmation that nothing else changed, and rollback status. `MUTATION_AUTHORIZED` is reset to `NO` and the return is routed to the Architect. A-3, A-6, S6, admin work and ClinicFlow do not start automatically.
- **Directive:** issue `DIR-WEB-CF-EXPOSURE-REMEDIATION-0001` (cycle `MAISOGLABS_CF_EXPOSURE_REMEDIATION`, scope `D103_CF_EXPOSURE_REMEDIATION_A1_A4_ONLY`, applicable review `ML-DEVOS-AS-129`), routed to Claude/Builder.

### D-104 — Authorize V10 Admin Content Bridge Architecture Planning

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `65288c7c9c412506826ca72912a8f32d816c95a1`, after `ML-DEVOS-AS-130` closed the immediate Cloudflare exposure remediation and routed the next product priority to Paulo. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Nature:** PLANNING / ARCHITECTURE ONLY.
- **Why:** D-093 made `public/index.html` (production SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`) the asset-first static homepage and removed `app/page.js`. The existing admin/project mutation APIs therefore do not reach the homepage. An admin editor is only useful with an explicit, bounded publication bridge from managed content to the D-093 homepage. Earlier V10 plan assumptions that the homepage renders through `app/page.js` / `data/site.js` are superseded by D-093. The earlier plan remains evidence and design intent.
- **Objective:** a repository-grounded architecture for a V10 Admin Content Editor plus a Public Content Bridge, under the rule "CODE OWNS THE V10 DESIGN. ADMIN OWNS APPROVED CONTENT FIELDS." The admin never gains arbitrary HTML, CSS, JS, selector, asset-path, script or free-form layout capability.
- **Required outputs:**
  - `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md`, covering the 20 planning sections Paulo specified;
  - `devos/changes/rfcs/ML-DEVOS-RFC-022.md` ("V10 Published Content Bridge"), status `DRAFT`, not accepted.

  The work compares:
  - a static artifact with a bounded runtime `/api/site-content` read;
  - request-time HTML rewriting;
  - a return to React;
  - rebuild/deploy on publish;
  - runtime hydration.

  It also carries a bounded SENTINEL sync and an SU contradiction check.
- **Allowed:** repository reads; documentation and plan creation; the RFC-022 draft; D-104 governance records; local read-only analysis or testing needed to understand the artifact.
- **Not authorized:**
  - changing `public/index.html`, admin UI, Worker routes, migrations or schema, or any application/runtime code;
  - Cloudflare changes; remote D1/R2 reads or writes;
  - deployment; `main` merge; production change;
  - A-2, A-3, A-5, A-6, A-7, A-8, A-9;
  - S6/S7; PR #7; PR #10; D-068.
- **Flags:** every action flag stays `NO`.
- **Return:** Builder return `H-WEB-V10-CONTENT-BRIDGE-PLAN-0001`, routed to the Architect. RFC-022 implementation does not start automatically.
- **Directive:** issue `DIR-WEB-V10-CONTENT-BRIDGE-PLAN-0001` (cycle `MAISOGLABS_WEB_V10_CONTENT_BRIDGE_PLAN`, scope `D104_V10_ADMIN_CONTENT_BRIDGE_PLANNING_ONLY`, applicable review `ML-DEVOS-AS-130`), routed to Claude/Builder.

### D-105 — RFC-022 owner decisions (Q1–Q5), D-093 served-byte amendment, and RFC-022 amendment authority

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `716b9b74658a3c40c147ce60f1b674e25068d45e`, under `ML-DEVOS-AS-131`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Q1 — D-093 amendment:**
  - `public/index.html` stays immutable and byte-identical to the approved artifact (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`).
  - The served `/` response may differ from the artifact **only** by the bounded, validated RFC-022 content-bridge span, and only when published content exists.
  - Every other D-093 requirement is unchanged, including the byte-identical served response whenever no bridge span is inserted.
  - The amendment takes effect for implementation only once RFC-022 is accepted and an implementation is separately authorized.
- **Q2 — routing:** the RFC-022 architecture may make exact `/` Worker-first, with `env.ASSETS.fetch(request)` as the fail-safe fallback. No other ordinary asset route is included. The residual dependency of `/` on Worker execution (AS-131) is accepted as an explicit risk.
- **Q3 — facts:**
  - The initial homepage project set, in order: ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat.
  - Preferred public email: `paulo.maisog@maisoglabs.com`, once its deliverability is confirmed. Until that check passes, the currently verified working address is retained.
- **Q4:** Tier 2 / artifact v2, About, and new CTA or design changes are deferred. Tier 1 is completed first.
- **Q5:** no `/api/site-content` initially; the Journal → Research bridge (CB-6) is deferred.
- **Authorized:** amendment of `devos/changes/rfcs/ML-DEVOS-RFC-022.md` to incorporate Q1–Q5 and the AS-131 findings, returned for final Architect review only. RFC-022 stays `DRAFT` until the Architect accepts it.
- **Not authorized:**
  - CB-1 through CB-7; any implementation or migration;
  - changes to `public/index.html`, the homepage artifact contract, runtime, admin UI, Worker routes or config;
  - Cloudflare mutation; remote D1/R2; deployment; `main` merge;
  - A-3, A-6; S6/S7; PR #7; PR #10; D-068.
- **Flags:** every action flag stays `NO`.
- **Return:** Builder return `H-WEB-RFC022-AMEND-0001`, routed to the Architect.
- **Directive:** issue `DIR-WEB-RFC022-AMEND-0001` (cycle `MAISOGLABS_WEB_RFC022_AMENDMENT`, scope `D105_RFC022_AMENDMENT_ONLY`, applicable review `ML-DEVOS-AS-131`), routed to Claude/Builder.

### D-106 — Authorize RFC-022 Tier 1 Admin Content Bridge implementation (CB-1..CB-5, repository/local only)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `c0eb486e576a843bda94b5a6465bfa9e0f98eb63`, under `ML-DEVOS-AS-132`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Authorized:** implement CB-1 through CB-5 together, repository and local only, exactly under `ML-DEVOS-RFC-022`, `ML-DEVOS-AS-132` and `D-105`:
  - the MLData content bridge;
  - migration `0006` with the four approved V10 project fields;
  - the extended project draft → preview → publish lifecycle;
  - a bounded contact-email draft → preview → publish lifecycle;
  - a usable `/admin` Content UI;
  - the protected homepage draft preview;
  - the exact `/` Worker-first published-content bridge;
  - the RFC-022 / AS-132 tests and local browser evidence.

  Local D1 migrations and tests are allowed.
- **Binding requirements:**
  - `public/index.html` is not modified; its SHA-256 stays `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`;
  - every RFC-022 requirement and the twelve AS-131 tests;
  - AS132-F001 (transformed-response identity and caching) as a mandatory implementation condition;
  - AS132-F002 stays a release gate: Eternal Eggs production copy and email-verification status are not invented.
- **Canonical admin login identity (from D-106 onward):** `paulo.maisog@maisoglabs.com`.
  - This is separate from the publicly displayed email.
  - The governed Worker does not hard-code an admin email; the login allowlist is configured in Cloudflare Access.
  - The later production Access/admin wiring step must configure this identity.
  - Any retained admin implementation with an application-level `ADMIN_EMAIL` or equivalent pin must use the same address.
  - This is not authorization to modify Cloudflare Access or the legacy Admin V1 Workers now.
- **Flags:** `MUTATION_AUTHORIZED: YES` and `AUDIT_APPEND_AUTHORIZED: YES` for this implementation only. `REMOTE_D1`, `REMOTE_R2`, `MEDIA_MUTATION`, `DEPLOY` and `MAIN_MERGE` stay `NO`.
- **Not authorized:**
  - CB-R; remote D1/R2; Cloudflare configuration or Access policy changes;
  - production content publication; deployment; `main` merge;
  - `/api/site-content`; the Journal bridge; Tier 2; About/CTA redesign; project deletion;
  - S6/S7; A-3/A-6; PR #7; PR #10; D-068.
- **Publication discipline (AS132-F003 open):** every publication manually inspects STATE and the changed-file set in addition to `--check-only`.
- **Return:** Builder return `H-WEB-RFC022-TIER1-IMPL-0001`; all flags reset to `NO`; routed to the Architect. The production release does not start automatically.
- **Directive:** issue `DIR-WEB-RFC022-TIER1-IMPL-0001` (cycle `MAISOGLABS_WEB_RFC022_TIER1_IMPL`, scope `D106_RFC022_TIER1_LOCAL_IMPLEMENTATION_ONLY`, applicable review `ML-DEVOS-AS-132`), routed to Claude/Builder.

### D-107 — Authorize AS-133 remediation cycle 1 (AS133-F001 only, repository/local only)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `f31996832b014555b982b84cad9e0137d4fc6064`, when relaying the Architect's `ML-DEVOS-AS-133` (`CHANGES_REQUESTED`). Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Authorized:** one bounded remediation of AS133-F001 under `ML-DEVOS-RFC-022`, `ML-DEVOS-AS-132`, `ML-DEVOS-AS-133`, D-105 and D-106:
  - keep the exact D-105 five-project/order check (AS132-F002) as a CB-R release-readiness check, with its helper/status preserved;
  - stop gating normal public bridge rendering on those five names, so that any valid published project group of 1..5 renders through `/`;
  - add the AS-133 regression evidence;
  - adjust admin wording/status only if needed to distinguish release readiness from runtime bridge validity.
- **Binding requirements:**
  - no new table, migration field, runtime activation flag, API or architecture change;
  - `public/index.html` is unchanged (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`);
  - AS132-F002 remains a mandatory release condition, to be proven at CB-R.
- **Flags:** `MUTATION_AUTHORIZED: YES` for this remediation only. `AUDIT_APPEND_AUTHORIZED`, `REMOTE_D1`, `REMOTE_R2`, `MEDIA_MUTATION`, `DEPLOY` and `MAIN_MERGE` stay `NO`.
- **Not authorized:** anything outside AS133-F001, including:
  - CB-R; production, remote D1/R2, Cloudflare, Access or DNS actions;
  - production content; deployment; `main` merge.
- **Remediation cycle:** `CURRENT_REMEDIATION_CYCLE: 1` of `MAX_REMEDIATION_CYCLES: 2`.
- **Directive:** issue `DIR-WEB-RFC022-TIER1-REM1-0001` (cycle `MAISOGLABS_WEB_RFC022_TIER1_IMPL`, scope `D107_AS133_F001_REMEDIATION_CYCLE_1_ONLY`, applicable review `ML-DEVOS-AS-133`), routed to Claude/Builder. The Builder returns to the Architect on completion.

### D-108 — Open the RFC-022 CB-R release cycle: Stage 1 readiness only (no Gate C)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `b2b88c7b4bca0c3d92b62d4054c06b8ab0f419d9`, after `ML-DEVOS-AS-134` accepted the RFC-022 Tier 1 implementation. Paulo narrowed the request to "Readiness only. Do not execute Gate C yet." Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **New cycle:** `MAISOGLABS_WEB_RFC022_CBR`. `CURRENT_REMEDIATION_CYCLE` resets to 0.
- **Authorized (CB-R Stage 1, readiness only):**
  - open one fresh `governance/maisoglabs-v0.1 → main` release PR and observe exact-head CI;
  - read-only release-state checks: `main`, the release diff, CI on the exact head;
  - read-only production D1 inspection (SELECT/PRAGMA only) through the Cloudflare MCP connector, as at D-102: applied migrations, the `0006` schema state, published project and contact state;
  - AS132-F002 initial-five release readiness against real production content;
  - whether Eternal Eggs production copy exists;
  - whether deliverability of `paulo.maisog@maisoglabs.com` has been confirmed.
- **Content rule:** a missing content prerequisite is reported as `NOT READY`. No content is invented or published.
- **Flags:** every action flag stays `NO`, including `MAIN_MERGE_AUTHORIZED` and `REMOTE_D1_AUTHORIZED`. A read-only inspection needs no write flag (D-102 precedent).
- **Not authorized:**
  - Gate C itself (the `main` merge), which remains a separate Paulo authorization after readiness is accepted;
  - remote migration `0006`; any D1 write; content publication;
  - Cloudflare, Access or DNS changes; deployment; Gate D; production promotion;
  - PR #7 or PR #10 action; S6/S7; D-068; A-3/A-6.
- **Return:** Stage 1 readiness evidence goes to the Architect/Paulo; all flags `NO`; then stop.
- **Directive:** issue `DIR-WEB-RFC022-CBR-S1-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D108_RFC022_CBR_STAGE1_READINESS_ONLY`, applicable review `ML-DEVOS-AS-134`), routed to Claude/Builder.

### D-109 — Authorize RFC-022 Gate C: protected merge of PR #16 without production promotion

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `52026f7806f92e867737599fc4e5992e2ae6e8ef`, after `ML-DEVOS-AS-135` accepted the CB-R Stage 1 readiness evidence. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:**
  - PR `Dillaab-source/maisog-labs#16` (`governance/maisoglabs-v0.1 → main`);
  - reviewed head `52026f7806f92e867737599fc4e5992e2ae6e8ef`;
  - `main` `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`;
  - expected active production `53137101-afb8-456c-ab83-d8b7b934df01` @ 100% (as read at Stage 1);
  - homepage SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- **Authorized (Gate C only):**
  - publish the bounded Gate C directive;
  - mark PR #16 ready for review;
  - require fresh `test-and-build` SUCCESS on the new exact final head, because this D-109 publication advances the PR head;
  - re-check clean mergeability, unchanged `main`, the release scope (the final head differs from the reviewed head only by D-109 coordination records) and the homepage hash;
  - record a fresh `PRE_MERGE_ACTIVE_VERSION_ID`;
  - merge PR #16 through the normal protected GitHub PR path, with a normal merge commit and the exact expected head pinned;
  - observe the resulting `main` Workers Build and version upload;
  - verify that `POST_MERGE_ACTIVE_VERSION_ID` equals `PRE_MERGE_ACTIVE_VERSION_ID`, still at 100%;
  - publish the Gate C return to the Architect.
- **Production readings:** taken read-only through the Cloudflare MCP/API connector in the Builder session (`ACTOR_REPORTED`), as at the D-108 Stage 1.
- **Not authorized:**
  - production promotion or Gate D; `wrangler versions deploy`; any traffic change or rollback;
  - remote D1 migration `0006`; any production D1 write; content publication; R2 mutation;
  - Cloudflare binding, Access, DNS, secret or environment changes;
  - direct push to `main`, force push, squash, rebase, auto-merge or protection bypass;
  - PR #7 or PR #10 action; S6/S7; D-068; A-3/A-6.
- **Flags:** `MAIN_MERGE_AUTHORIZED: YES` for this exact Gate C only. Every other action flag stays `NO`.
- **Return:** Builder return `H-WEB-RFC022-GATE-C-0001` recording:
  - the D-109 publication SHA; the PR number, base and final head; CI on the final head;
  - the merge commit; the release diff;
  - the Workers Build ID and new version ID;
  - the pre- and post-merge active version and proof that they are equal;
  - proof that no Gate D command ran.

  Every action flag is then reset to `NO` and the return is routed to the Architect.
- **Directive:** issue `DIR-WEB-RFC022-GATE-C-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D109_RFC022_GATE_C_PROTECTED_MAIN_MERGE_ONLY`, applicable review `ML-DEVOS-AS-135`), routed to Claude/Builder.

### D-110 — Authorize RFC-022 CB-R production D1 migration `0006` only (owner-executed)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `1296c505e7b592d7fabe4cfcfa5f5bd91efb48d2`, after `ML-DEVOS-AS-136` accepted Gate C and recommended remote production migration `0006` only. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Execution path (owner-executed):** the Builder's cloud session has no Wrangler authentication. Paulo runs the migration from Paulo's own locally authenticated Wrangler session (independently verified by Paulo, with D1 write permission). The Builder does not run the migration. It performs the read-only pre- and post-migration verification through the Cloudflare MCP/API connector and publishes the return.
- **Bound identities:**
  - production D1 `maisog-labs-web-inc-005-local` / `45b87574-e573-4e0f-9bb6-fbba2df29523`, bound as `DB`;
  - `main` `fda42e04d18b960d8212d49616f96b657a5c6bf3`;
  - expected active production `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%;
  - `migrations/0006_rfc022_v10_project_fields.sql`, blob `45da6f6c6452e4c55a656927ca970218d071eae0`, identical on `main` and the governance branch.
- **Pre-publication readings (read-only, Cloudflare connector, `ACTOR_REPORTED`):**
  - `d1_migrations` lists exactly `0001`–`0005`; `0006` is absent;
  - `project_revisions` has 13 columns, none of `tagline`, `status`, `disciplines_json`, `flow_json`;
  - row counts: `theme_settings` 1 and `theme_settings_revisions` 1; every other content, revision, media, journal, `site_settings` and `audit_log` table 0;
  - latest deployment: `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.
- **Authorized (only):**
  - Paulo runs, from a checkout of `main` or of the D-110 governance transition: `npx wrangler d1 time-travel info maisog-labs-web-inc-005-local --json`, to record the pre-migration bookmark (read-only);
  - Paulo runs `npx wrangler d1 migrations list maisog-labs-web-inc-005-local --remote` (read-only), which must list only `0006_rfc022_v10_project_fields.sql` as pending;
  - Paulo runs exactly one `npx wrangler d1 migrations apply maisog-labs-web-inc-005-local --remote`, approving only after the prompt lists `0006_rfc022_v10_project_fields.sql` alone on that database;
  - the Builder independently verifies production D1 read-only through the Cloudflare connector and publishes the return.
- **Not authorized:**
  - any migration other than `0006`; creating or editing any migration; arbitrary remote SQL (`d1 execute --remote`);
  - Time Travel restore or any other rollback (a restore needs a separate Paulo decision);
  - `site_settings` initialization; project, content or revision writes; content publication; email publication;
  - Gate D; `wrangler deploy`; `wrangler versions deploy`; version upload; promotion; traffic change;
  - R2, Access, DNS, binding, secret or environment changes; creating, deleting or renaming any Cloudflare resource;
  - any `main` merge; PR #7 or PR #10; S6/S7; D-068; A-3/A-6.
- **Flags:** `REMOTE_D1_AUTHORIZED: YES` for this exact migration only. Every other action flag stays `NO`.
- **Return:** Builder return `H-WEB-RFC022-CBR-D1-0006-0001` recording:
  - the D-110 publication SHA; Paulo's reported bookmark, command and output (`OWNER_REPORTED`);
  - Builder read-only verification (`ACTOR_REPORTED`): `d1_migrations` lists `0001`–`0006`; `project_revisions` has all four new columns; row counts unchanged from the readings above; the active version is still `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.

  `REMOTE_D1_AUTHORIZED` and every action flag are then reset to `NO` and the return is routed to the Architect.
- **Directive:** issue `DIR-WEB-RFC022-CBR-D1-0006-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D110_RFC022_CBR_PRODUCTION_D1_0006_ONLY`, applicable review `ML-DEVOS-AS-136`), routed to Claude/Builder.

### D-111 — Authorize one bounded repository/local remediation of AS137-F001 and AS137-F002

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `df5b4e153e8c0ff21be2fbc10b6521b1ed8d69ef`, in the same message that relayed `ML-DEVOS-AS-137`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:** `main` `fda42e04d18b960d8212d49616f96b657a5c6bf3`; production D1 `45b87574-e573-4e0f-9bb6-fbba2df29523` at migrations `0001`–`0006`; active production `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.
- **Authorized (one remediation cycle, repository/local only):**
  1. **Initial project activation (AS137-F001).**
     - Implement the smallest initial-only atomic activation capability.
     - Before initial activation, an individual homepage-project publish must not be able to create a partial first homepage activation.
     - The initial activation operation requires exactly ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat, in that order, complete and valid.
     - It publishes all five in one atomic D1 operation with audit evidence, preserving expected-pointer guards.
     - After initial activation, the accepted AS133 behavior is preserved: public runtime renders any valid 1..5 published projects.
     - Use a durable existing substrate (such as bounded audit/state evidence) rather than a permanent runtime five-project gate, unless the implementation proves another smaller design is safer.
  2. **`site_settings` bootstrap.** Remove the manual production-seed dependency for first contact use. The first contact-draft creation safely initializes the `site_settings` parent state when absent, atomically and with stale-write and audit protections. It never publishes an email automatically.
  3. **Access configuration (AS137-F002).** Read the existing `maisoglabs.com/admin` Access application read-only. Use its exact current non-secret `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` values, replacing only the inert placeholders for the governed `maisog-labs` Worker. No change to the Access application, policy, allowed identity, DNS or Cloudflare account configuration.
  4. **Release semantics.** Narrowly update RFC-022 / release documentation so that Gate D may activate the code while there is still no valid published bridge payload, because public `/` remains the approved artifact. AS132-F002 stays mandatory before the first project bridge activation, not as a precondition for making the admin/bootstrap code reachable. The exact-five initial activation requirement is not weakened.
  5. **Tests** proving:
     - zero published projects → public artifact fallback;
     - one or four individual project publishes cannot create first activation;
     - the exact five initial projects activate atomically;
     - a failed initial activation leaves zero published homepage projects;
     - after a successful initial activation, normal 1..5 behavior remains;
     - the `site_settings` first-draft bootstrap is atomic and does not publish;
     - stale or conflicting bootstrap attempts fail safely;
     - the Access placeholders are gone and fail-closed authentication behavior remains;
     - the existing RFC-022 tests and the full suite stay green.
- **Not authorized:**
  - any production D1 write; content creation or publication in production; production email change;
  - Gate D; deployment or promotion;
  - Cloudflare Access mutation; DNS, R2, secret or environment mutation;
  - another `main` merge; PR #7 or PR #10 action;
  - a new planning RFC, unless an implementation-blocking architectural issue is discovered.
- **Flags:** `MUTATION_AUTHORIZED: YES` for repository/local changes within this scope only. Every remote, deploy and other action flag stays `NO`. Read-only Cloudflare API reads (the Access application) need no flag.
- **Return:** one Protocol V2 Builder return with the files changed, the design chosen for initial activation and bootstrap, the Access values' provenance, test and build results, and confirmation that no remote resource was mutated. Every flag is then reset to `NO` and the return is routed to the Architect.
- **Directive:** issue `DIR-WEB-RFC022-CBR-REM1-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D111_RFC022_CBR_AS137_REMEDIATION_REPOSITORY_ONLY`, applicable review `ML-DEVOS-AS-137`), routed to Claude/Builder.

### D-112 — Authorize RFC-022 Gate C for the accepted D-111 remediation, without production promotion

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `9abb5f61cd6d18ca836cfc254df7a8236cc105ae`, in the same message that relayed `ML-DEVOS-AS-138`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:**
  - reviewed implementation `fde97b6d4be4cc427cde682bd27182f8e328e93d..9abb5f61cd6d18ca836cfc254df7a8236cc105ae` (AS-138);
  - `main` `fda42e04d18b960d8212d49616f96b657a5c6bf3`;
  - expected active production `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%;
  - homepage SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`;
  - Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b` (`maisoglabs.com/admin`); D-106 identity `paulo.maisog@maisoglabs.com`.
- **Authorized (Gate C only):**
  - open one fresh `governance/maisoglabs-v0.1 → main` release PR, bound to the D-111 remediation accepted by AS-138;
  - because this AS-138/D-112 publication advances the branch head, require fresh `test-and-build` SUCCESS on the exact final PR head;
  - verify clean mergeability, unchanged `main` and the unchanged `public/index.html` hash;
  - perform the read-only AS138-F001 Access policy identity check and record the result;
  - record `PRE_MERGE_ACTIVE_VERSION_ID` immediately before the merge;
  - merge through the normal protected GitHub PR path, with a normal merge commit and the exact expected head pinned;
  - observe the resulting Workers Build and version upload;
  - verify that `POST_MERGE_ACTIVE_VERSION_ID` equals `PRE_MERGE_ACTIVE_VERSION_ID`;
  - publish the Gate C return to the Architect.
- **AS138-F001 outcome:** a mismatch does not block Gate C. It is recorded in the return as Gate D NOT READY, and a separate Paulo authorization is required before any Access policy change.
- **Production readings:** read-only through the Cloudflare MCP/API connector in the Builder session (`ACTOR_REPORTED`), as at D-109.
- **Not authorized:**
  - Gate D; `wrangler versions deploy`; production promotion or traffic shift;
  - any production D1 write; project/content creation or publication; `site_settings` production mutation; email publication;
  - Cloudflare Access policy mutation; DNS, R2, binding, secret or environment mutation;
  - direct push to `main`, force push, squash, rebase, auto-merge or protection bypass;
  - PR #7 or PR #10 action.
- **Flags:** `MAIN_MERGE_AUTHORIZED: YES` for this exact Gate C only. Every other action flag stays `NO`.
- **Return:** Builder return `H-WEB-RFC022-GATE-C-0002` recording:
  - the D-112 publication SHA; the PR number, base and final head; CI on the final head;
  - the merge commit; the release diff; the homepage hash;
  - the AS138-F001 policy identity result;
  - the Workers Build ID and new version ID;
  - the pre- and post-merge active version and proof that they are equal;
  - proof that no Gate D command ran.

  Every action flag is then reset to `NO` and the return is routed to the Architect.
- **Directive:** issue `DIR-WEB-RFC022-GATE-C-0002` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D112_RFC022_GATE_C_PROTECTED_MAIN_MERGE_ONLY`, applicable review `ML-DEVOS-AS-138`), routed to Claude/Builder.

### D-113 — Authorize one bounded Cloudflare Access remediation: align `maisoglabs.com/admin` with the D-106 identity

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `7555f48809e40abaeea3ddca084d53b4fff1e846`, in the same message that relayed `ML-DEVOS-AS-139`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **D-106 unchanged:** the canonical admin identity remains `paulo.maisog@maisoglabs.com`.
- **Bound identities:**
  - Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b` (`maisoglabs.com/admin`, `maisoglabs.com/admin/*`), AUD `ef44d36e676be36eedb87d5378b8f3fd1ed40cc34505b7261a990c166a0cea22`, team domain `jolly-disk-0469.cloudflareaccess.com`;
  - its current policy `460d0315-1e4b-414a-8845-c656f1f04c79` ("Maisog Labs Admin V1 — Canonical Administrator", reusable);
  - `main` `405375998392e936b71181de387ae395b7d46e40`; active production `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.
- **Before mutation (read-only):**
  1. read the application and its attached policies;
  2. determine whether policy `460d0315…` is referenced by any other Access application;
  3. record the application's AUD, team domain, identity providers (OTP), session settings and protected paths, all of which must be preserved.
- **Mutation rule:**
  - **Not shared:** update only that policy's allowed email identity to `paulo.maisog@maisoglabs.com`.
  - **Shared:** do not edit the shared policy. Create a dedicated allow policy for this application using only `paulo.maisog@maisoglabs.com`, attach it to this application in place of the shared one, and leave every other application and reusable policy unchanged.
- **Post-change verification:**
  - the application still protects exactly `/admin` and `/admin/*`;
  - the team domain and AUD are unchanged;
  - the allowed identity for this application is exactly `paulo.maisog@maisoglabs.com`;
  - no other application's policy changed;
  - the production Worker version and traffic are unchanged; no Worker deploy or Gate D occurred.
- **Authorized:** only the minimal Cloudflare Access policy mutation above; read-only verification before and after; governance publication of the result.
- **Not authorized:**
  - Gate D; Worker deployment, promotion or traffic change;
  - D1, R2, content, `site_settings` or email mutation;
  - DNS changes; binding, secret or environment changes;
  - another `main` merge; PR #7 or PR #10 action.
- **Flags:** `MUTATION_AUTHORIZED: YES` for exactly this Access policy mutation (D-103 precedent for a bounded Cloudflare configuration change). Every other action flag stays `NO`.
- **Return:** Builder return `H-WEB-RFC022-CBR-ACCESS-0001` with the D-113 publication SHA, the exact pre-change state, whether the policy was shared, the exact operation, the exact post-change state and the verification above. Every flag is then reset to `NO` and the return is routed to the Architect.
- **Directive:** issue `DIR-WEB-RFC022-CBR-ACCESS-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D113_RFC022_CBR_ACCESS_IDENTITY_ALIGNMENT_ONLY`, applicable review `ML-DEVOS-AS-139`), routed to Claude/Builder.

### D-114 — Authorize RFC-022 Gate D: one bounded production promotion of the exact `main` candidate

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `c24f8882586a5a2cdb25b7dc8bbfbd7b6e54fe72`, in the same message that relayed `ML-DEVOS-AS-140`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound identities:**
  - `main` `405375998392e936b71181de387ae395b7d46e40`; `main` Workers Build `ded31be5-394e-4674-95d9-88d904e784aa`;
  - candidate version `862dc45e-9ad7-4324-80ae-912adbb6ce82`;
  - current production and rollback target `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%;
  - Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`; Access policy `62653faa-4c3c-4b96-a53f-7545f79dbd43`; canonical admin identity `paulo.maisog@maisoglabs.com`;
  - homepage artifact SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- **Pre-promotion gate (fresh reads; any mismatch, traffic split or ambiguity stops without promoting, with no automatic repair):**
  1. STATE selects the D-114 Gate D directive.
  2. `main` is still exactly `40537599…`, not superseded by a newer authorized release.
  3. The candidate `862dc45e…` exists, is inactive, was produced from the accepted `main` release, and carries `ACCESS_TEAM_DOMAIN` `jolly-disk-0469.cloudflareaccess.com`, `ACCESS_AUD` `ef44d36e676be36eedb87d5378b8f3fd1ed40cc34505b7261a990c166a0cea22`, `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523`, `MEDIA` → `maisog-labs-web-inc-004-local`, and `ASSETS`.
  4. Access application `b80acca4…` still protects only `maisoglabs.com/admin` and `/admin/*`, with the same AUD, team domain and OTP IdP, using policy `62653faa…`, which allows exactly `paulo.maisog@maisoglabs.com`.
  5. A fresh active-production read immediately before promotion shows exactly `53137101…` @ 100%. Record `PRE_GATE_D_ACTIVE_VERSION_ID` and the deployment id.
- **Pre-promotion baseline (RFC-022 §7 test 11):** a bounded sample of `GET /` (preferably ≥ 20), with median and p95 where supported. Also actual Worker CPU-time evidence for the active version from read-only Workers analytics/logging if available. No content mutation for measurement; no invented figures. If CPU evidence is unavailable, record the limitation; that alone authorizes no other deployment method or observability change.
- **Authorized promotion:** exactly one production deployment assigning `862dc45e…` @ 100%, by the minimum official Cloudflare Workers deployment operation. The Wrangler equivalent is exactly `npx wrangler versions deploy 862dc45e-9ad7-4324-80ae-912adbb6ce82@100% --yes`, run once. No traffic or canary split, second candidate, version upload, `wrangler deploy`, rebuild or `main` merge.
- **Post-promotion verification (read-only):**
  1. active production is exactly `862dc45e…` @ 100%; record the new deployment id;
  2. `GET https://maisoglabs.com/` returns 200 and, with no homepage projects or contact published, still serves the approved D-093 artifact, not blank or materially broken;
  3. `/api/journal`, `/api/design` and `/journal` stay healthy under their contracts;
  4. `/admin` stays protected by Cloudflare Access (no weakening or bypass);
  5. no production content or D1 state changed;
  6. no new Worker exception or binding failure attributable to the candidate.
- **Post-promotion measurement (RFC-022 §7 test 11):** repeat the same `GET /` sample while still in artifact fallback. Obtain actual Worker CPU-time evidence for `862dc45e…` from read-only analytics/logging. Record the sample/window, latency statistics, CPU statistics, source, and the old/new comparison. If CPU evidence is unavailable, do not fabricate it: report test 11 as still incomplete and leave the healthy candidate deployed unless a rollback condition holds. No observability configuration mutation.
- **Conditional rollback (at most one):**
  - **When:** only for a new material production failure attributable to `862dc45e…`: homepage unavailable or materially broken; previously healthy public APIs failing; widespread new Worker exceptions; an Access/Worker binding failure preventing the governed admin path; or a production binding failure caused by the candidate.
  - **How:** roll back to `53137101…` @ 100%. The Wrangler equivalent is `npx wrangler rollback 53137101-afb8-456c-ab83-d8b7b934df01 --message "D-114 rollback: newly caused RFC-022 Gate D production failure"`. Then verify, rerun the health checks and stop, with no second promotion.
  - **Not a rollback reason:** absent project content, the homepage remaining the D-093 artifact, an empty Journal, unavailable CPU/latency evidence, cosmetic or pre-existing issues, or the historical `-local` resource names.
- **Not authorized:**
  - project draft creation or publication; initial homepage activation;
  - `site_settings` or content mutation; public contact-email publication;
  - D1 query, write, migration or restore; R2 mutation;
  - Access mutation; DNS change; secret, environment or binding change;
  - version upload; another `main` merge;
  - PR #7 or PR #10 action; S6/S7; D-068.
- **Flags:** `DEPLOY_AUTHORIZED: YES` for this exact Gate D (and its one conditional rollback). Every other action-specific flag stays `NO`.
- **Return:** one Gate D return `H-WEB-RFC022-GATE-D-0001` containing:
  - the D-114 publication SHA, the `main` SHA, the candidate and previous version ids, and the pre-Gate-D active version and deployment;
  - the exact deployment operation, the new deployment id, and the post-Gate-D active version and allocation;
  - the HTTP smoke results and the Access re-check;
  - the test 11 evidence or explicit limitation;
  - the rollback status;
  - confirmation that no content, D1, R2, Access, DNS, binding, secret or `main` mutation occurred.

  Then `DEPLOY_AUTHORIZED` and every flag are reset to `NO`; `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`; the directive is archived and deselected.
- **Directive:** issue `DIR-WEB-RFC022-GATE-D-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D114_RFC022_GATE_D_PRODUCTION_PROMOTION_ONLY`, applicable review `ML-DEVOS-AS-140`), routed to Claude/Builder.

### D-115 — Approve the initial five-project homepage content; authorize production drafts and protected preview only

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `68a614de98290b744a28c4afc43699a94ab384f1`, under `ML-DEVOS-AS-141` scope `RFC022_INITIAL_CONTENT_OWNER_APPROVAL_ONLY`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Context:** Paulo reports that a comprehensive live-site review found launch blockers, and recommends saving invisible drafts first, then completing a bounded V10.1 remediation before public activation. The review itself is not recorded in this repository.
- **Approved content (exact):**
  - order: 1 ClinicFlow, 2 Eternal Eggs, 3 Sentinel / DevOS, 4 SU, 5 Maisog Kilat;
  - discipline map: 0 AI, 1 Automation, 2 Research, 3 Security, 4 Systems, 5 Architecture.

  The admin project fields are below. Kind = `category`, description = `summary`, the homepage fields are under `v10`, and the flow stages are listed in order:

```json
[
  {
    "id": "project-clinicflow",
    "slug": "clinicflow",
    "order": 1,
    "category": "Clinic automation",
    "title": "ClinicFlow",
    "summary": "ClinicFlow is an AI-assisted clinic automation prototype for handling patient conversations, appointment intake, scheduling, reminders and staff handoff through one structured workflow.",
    "stack": [
      "n8n",
      "LLM",
      "Webhooks",
      "Calendar"
    ],
    "accent": "gold",
    "icon": "automation",
    "featured": true,
    "v10": {
      "tagline": "AI-assisted booking and workflow automation for dental clinics.",
      "status": "",
      "disciplines": [
        0,
        1,
        4,
        3
      ],
      "flow": [
        "Patient starts a conversation",
        "Request is structured and validated",
        "Appointment workflow is coordinated",
        "Staff review and remain in control"
      ]
    }
  },
  {
    "id": "project-eternal-eggs",
    "slug": "eternal-eggs",
    "order": 2,
    "category": "Conversational ordering",
    "title": "Eternal Eggs",
    "summary": "Eternal Eggs is a conversational ordering system in development that turns customer messages into structured orders with quantity checks, totals, delivery details and duplicate protection.",
    "stack": [
      "Cloudflare Workers",
      "Durable Objects",
      "D1",
      "LLM"
    ],
    "accent": "violet",
    "icon": "automation",
    "featured": true,
    "v10": {
      "tagline": "A conversational ordering system built around real customer orders.",
      "status": "",
      "disciplines": [
        0,
        1,
        4
      ],
      "flow": [
        "Customer sends an order",
        "Order details are extracted and checked",
        "Total and delivery details are confirmed",
        "A person receives the structured order"
      ]
    }
  },
  {
    "id": "project-sentinel-devos",
    "slug": "sentinel-devos",
    "order": 3,
    "category": "AI operating system",
    "title": "Sentinel / DevOS",
    "summary": "Sentinel / DevOS is the active governance system used inside MaisogLabs to coordinate AI-assisted software work, including scope, implementation, evidence and human review.",
    "stack": [
      "Governance",
      "Architecture",
      "Evidence",
      "AI"
    ],
    "accent": "blue",
    "icon": "systems",
    "featured": true,
    "v10": {
      "tagline": "A governed system for coordinating human and AI software development.",
      "status": "Active",
      "disciplines": [
        0,
        2,
        1,
        5,
        3
      ],
      "flow": [
        "Work begins from an explicit decision",
        "Scope and architecture are defined",
        "Implementation produces evidence",
        "A person reviews and authorizes the next step"
      ]
    }
  },
  {
    "id": "project-su",
    "slug": "su",
    "order": 4,
    "category": "Research engine",
    "title": "SU",
    "summary": "SU is an experimental evidence-first research system for gathering sources, tracing claims, searching for contradictions and reviewing conclusions against the evidence behind them.",
    "stack": [
      "Research",
      "Evidence",
      "Review",
      "AI"
    ],
    "accent": "violet",
    "icon": "lab",
    "featured": true,
    "v10": {
      "tagline": "An evidence-first research engine built to challenge its own conclusions.",
      "status": "",
      "disciplines": [
        2,
        0,
        5
      ],
      "flow": [
        "Sources are collected",
        "Claims and evidence are mapped",
        "Contradictions are actively tested",
        "A person reviews the supported conclusion"
      ]
    }
  },
  {
    "id": "project-maisog-kilat",
    "slug": "maisog-kilat",
    "order": 5,
    "category": "Strategy validation",
    "title": "Maisog Kilat",
    "summary": "Maisog Kilat is a research environment for developing and backtesting trading strategies against market data under explicit risk controls. It is not presented as a proven trading product.",
    "stack": [
      "Research",
      "Backtesting",
      "Risk Controls",
      "Market Data"
    ],
    "accent": "blue",
    "icon": "lab",
    "featured": true,
    "v10": {
      "tagline": "Algorithmic trading research with deterministic testing and risk controls.",
      "status": "",
      "disciplines": [
        2,
        0,
        4,
        5
      ],
      "flow": [
        "A strategy hypothesis is defined",
        "It is tested against market data",
        "Results and risk are measured",
        "A person decides whether it proceeds"
      ]
    }
  }
]
```

  The Builder validated this content locally, before publication, with the production validators:
  - each `id`, `slug` and revision passes `validateProjectId` / `validateProjectSlug` / `validateProjectRevisionContent`;
  - the group passes `validateProjectsGroup`;
  - `initialReleaseReadiness` returns `true`.
- **Authorized (only):**
  1. record this approval;
  2. create exactly these five production project drafts through the existing authenticated admin project lifecycle (`POST /admin/api/projects`), using its immutable revision, stale-pointer and atomic audit mechanisms;
  3. read back the exact stored drafts;
  4. revalidate all five with the production validators and confirm `initialReleaseReadiness()` is `true`;
  5. generate the protected homepage preview (`/admin/preview/home`) and capture desktop and mobile evidence for Architect/Paulo review;
  6. verify that public `/` stays in artifact fallback and no project content becomes public.
- **Authentication stop condition:** the drafts must be created through the authenticated admin lifecycle as Paulo via Cloudflare Access. If this session cannot authenticate correctly, the Builder stops, returns the limitation to the Architect, and must not:
  - bypass authentication;
  - substitute direct D1 SQL;
  - invent a service token;
  - weaken Access.
- **Not authorized:**
  - any project publish; initial homepage activation; a `homepage_initial_activation` marker; public homepage content activation;
  - contact/`site_settings` mutation; contact-email publication;
  - deployment or traffic change;
  - R2, Access, DNS, binding, secret or environment change;
  - schema or migration change; `main` merge;
  - PR #7 or PR #10; S6/S7; D-068;
  - V10.1 remediation.
- **Flags:** for this operation only, `MUTATION_AUTHORIZED: YES`, `AUDIT_APPEND_AUTHORIZED: YES` and `REMOTE_D1_AUTHORIZED: YES`. Every other action-specific flag stays `NO`.
- **Return:** Builder handoff `H-WEB-RFC022-CONTENT-DRAFTS-0001` recording:
  - the D-115 publication SHA; project ids and revision ids;
  - validation results and the `initialReleaseReadiness` result;
  - the protected preview evidence;
  - confirmation that public `/` is unchanged, no project was published and no activation marker was created.

  Or, if the stop condition applies, the authentication limitation. Every flag is then reset to `NO`, with `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.
- **Directive:** issue `DIR-WEB-RFC022-CONTENT-DRAFTS-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D115_RFC022_INITIAL_CONTENT_DRAFTS_AND_PREVIEW_ONLY`, applicable review `ML-DEVOS-AS-141`), routed to Claude/Builder.

### D-116 — Execute the D-115 drafts only through an owner-authenticated interactive browser session

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `4e363fbf595db5b9fa20e408fa7a241f53686165`, in the same message that relayed `ML-DEVOS-AS-142`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Content:** exactly the five projects approved in D-115 (the canonical JSON in D-115), with no editorial changes.
- **Required execution path:**
  1. open `https://maisoglabs.com/admin` in an interactive browser session visible to Paulo;
  2. stop at Cloudflare Access authentication;
  3. Paulo personally completes authentication for `paulo.maisog@maisoglabs.com`. The Builder never retrieves, requests, stores or bypasses the OTP;
  4. resume only after Paulo confirms that the authenticated admin UI is loaded;
  5. create exactly the five D-115 drafts through the existing admin lifecycle;
  6. make no editorial changes to the approved content;
  7. read back and validate the saved drafts;
  8. confirm `initialReleaseReadiness()` remains `true`;
  9. open `/admin/preview/home` and capture desktop preview evidence;
  10. confirm public `/` is unchanged;
  11. stop.
- **Deferred by Paulo:** mobile preview and remediation. Not required for this step.
- **No browser available:** if no owner-visible interactive browser is available, the Builder publishes D-116 and stops. Execution then continues in a browser-enabled Claude session.
- **Flags:** `MUTATION_AUTHORIZED: YES`, `AUDIT_APPEND_AUTHORIZED: YES`, `REMOTE_D1_AUTHORIZED: YES`, for this operation only. Every other action-specific flag stays `NO`.
- **Not authorized:**
  - project publication; initial homepage activation; a `homepage_initial_activation` marker;
  - contact/`site_settings` mutation; deployment;
  - Access mutation; direct production D1 SQL as an admin substitute; service-token creation;
  - R2; schema or migration changes; `main` merge;
  - V10.1 implementation.
- **Return:** Builder handoff `H-WEB-RFC022-CONTENT-DRAFTS-0002` recording:
  - the D-116 publication SHA; the project ids and revision ids;
  - validation and the `initialReleaseReadiness` result;
  - desktop preview evidence;
  - confirmation that public `/` is unchanged, no project was published and no activation marker was created.

  Every flag is then reset to `NO` and the return is routed to the Architect.
- **Directive:** issue `DIR-WEB-RFC022-CONTENT-DRAFTS-0002` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D116_RFC022_CONTENT_DRAFTS_OWNER_BROWSER_ONLY`, applicable review `ML-DEVOS-AS-142`), routed to Claude/Builder.

### D-117 — Amend D-116: owner-executed browser-console POST of the exact D-115 drafts

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `c69be77cd3577a0c0c717b5643ff0d78a3ee156d`, after the Builder reported that the admin UI cannot carry the exact D-115 values. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Why:**
  - Builder-run browser execution under D-116 is unavailable.
  - The admin UI's new-project form has no `stack`, `accent` or `icon` inputs; it saves `[]`, `blue` and `lab`.
  - The form also sorts disciplines ascending, and the homepage renders discipline tags in stored order.
  - So D-115 cannot be entered exactly through the UI. D-116 forbids approximation.
- **Amendment:**
  - The D-116 execution path becomes owner-executed.
  - Paulo, already authenticated through Cloudflare Access as `paulo.maisog@maisoglabs.com` in his own browser, runs one browser-console script on `https://maisoglabs.com/admin`.
  - The script POSTs the exact canonical D-115 JSON to the existing authenticated admin endpoint `POST /admin/api/projects`, one request per project, in the D-105 order.
  - This is allowed only because it uses the same production admin lifecycle and API the UI uses.
- **Verified live contract** (the code at `main` `405375998392e936b71181de387ae395b7d46e40`, identical to the governance branch):
  - post-Access `sub` required; same-origin `Origin`; JSON; ≤ 32 KiB;
  - `validateProjectId`, `validateProjectSlug` and `validateProjectRevisionContent` (discipline order preserved);
  - no expected pointers for create; a duplicate id or slug gives 409 with nothing written;
  - one atomic batch: `projects` row, immutable `project_revisions` revision 1 with the V10 columns, `draft_revision_id`, and a `project_create_draft` success audit row;
  - `published_revision_id` stays null; the response is 201 with the draft revision id.
- **Script:**
  - generated by the Builder from the canonical D-115 JSON committed in this log (compact JSON SHA-256 `e45a56ca8a5d96fc8a0484da857dbd8d3b783a936181d875b05bb756bab6e90c`); script SHA-256 `dbe453f69da6c53049b9c49d4f654e1ded1ccf77b2b371bcff9dd6a24a210d6e`;
  - it aborts unless run on `https://maisoglabs.com/admin`, if initial activation is already done, or if any of the five ids already exists;
  - it stops at the first non-201;
  - it makes no publish, activation, contact or other call.
- **Requirements:**
  - exactly the D-115 canonical values: `id`, `slug`, `order`, `category`, `title`, `summary`, `stack`, `accent`, `icon`, `featured`, and every `v10` field, including discipline order;
  - no direct D1 SQL; no service token; no Access change;
  - no publication; no initial homepage activation; no `homepage_initial_activation` marker;
  - no contact/`site_settings` mutation; no deployment; no V10.1 changes.
- **After Paulo reports the result:**
  - the Builder, read-only, reads back all five drafts and compares every stored field with D-115;
  - it validates them with the production validators and confirms `initialReleaseReadiness()` is `true`;
  - it confirms none is published, no activation marker exists, and public `/` is unchanged;
  - the protected `/admin/preview/home` inspection may be `OWNER_REPORTED`; mobile stays deferred.

  Then the Builder returns to the Architect and stops.
- **Flags:** unchanged from D-116 (`MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED` and `REMOTE_D1_AUTHORIZED` `YES` for this operation only). The Builder itself creates no drafts and performs only read-only verification.
- **Directive:** `DIR-WEB-RFC022-CONTENT-DRAFTS-0002` stays selected, with its execution path amended by D-117 (as D-101 amended D-100). The return is `H-WEB-RFC022-CONTENT-DRAFTS-0002`.

### D-118 — Amend D-117: correct the UI-made ClinicFlow draft by PUT; create the other four by POST

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `e0ad72d7f15dd86a1daed793709c9f5e09ae6544`, after the Builder's read-only ClinicFlow diagnostic. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Diagnostic (accepted by Paulo):**
  - Paulo created only `project-clinicflow`, through the admin UI: revision 1, `created_by cf-access:f2cab460-…`, published `null`, draft `1`.
  - 7 of 14 fields differ from D-115: `title` `clinicflow` (should be `ClinicFlow`); `order` 3 (1); `stack` `[]`; `accent` `blue` (`gold`); `icon` `lab` (`automation`); `featured` false (true); `v10.disciplines` `[0,1,3,4]` (`[0,1,4,3]`).
  - `id`, `slug`, `category`, `summary`, `v10.tagline`, `v10.status` and `v10.flow` match.
  - No activation marker. Public `/` is unchanged.
- **Authorized (only):**
  1. correct the existing ClinicFlow draft through the authenticated draft-edit lifecycle `PUT /admin/api/projects/project-clinicflow/draft`, creating a new immutable revision exactly equal to canonical D-115, with expected pointers `expectedPublishedRevisionId: null`, `expectedDraftRevisionId: 1`. Stop if they no longer match;
  2. create Eternal Eggs, Sentinel / DevOS, SU and Maisog Kilat with authenticated `POST /admin/api/projects`, exactly as in D-115;
  3. both in one owner-executed browser-console script that replaces the D-117 script, stops on the first unexpected response, and never publishes or activates;
  4. after Paulo runs it, read-only verification of all five: field-by-field comparison with D-115, the production validators, `validateProjectsGroup`, `initialReleaseReadiness() == true`, `published_revision_id` null for all, no `homepage_initial_activation` marker, public `/` unchanged.
- **Verified live PUT contract** (the code at `main` `405375998392e936b71181de387ae395b7d46e40`, identical to the governance branch):
  - post-Access `sub` required; same-origin `Origin`; JSON; ≤ 32 KiB;
  - the project must exist (else 404);
  - `expectedPublishedRevisionId` and `expectedDraftRevisionId` are required (null or a positive integer; else 400) and must equal the live pointers (else 409);
  - the body carries `order`, `category`, `title`, `summary`, `stack`, `accent`, `icon`, `featured` and `v10` (`id`/`slug` are not accepted and stay unchanged). An omitted `media` inherits the source revision's snapshot (none for ClinicFlow);
  - `validateProjectRevisionContent`, with discipline order preserved;
  - one atomic batch: a new immutable `project_revisions` row (next revision number), a draft-pointer UPDATE guarded at commit time on both expected pointers, and a `project_update_draft` success audit row. Revision 1 is not modified;
  - `published_revision_id` is never touched;
  - the response is 200 `{ id, slug, state, publishedRevisionId, draftRevisionId, revisionId }`.
- **Script:**
  - generated from the canonical D-115 JSON (compact SHA-256 `e45a56ca8a5d96fc8a0484da857dbd8d3b783a936181d875b05bb756bab6e90c`); script SHA-256 `35b059d6a1cc82dee756b50ed52405f101c0a9d6b37f65aca55d62ebb7bb8f16`;
  - pre-checks: on `maisoglabs.com/admin`; initial activation not done; ClinicFlow pointers exactly published `null` / draft `1`; the other four ids absent;
  - then one PUT, which must give 200, `state: draft`, published `null` and an advanced draft pointer, and four POSTs, each 201, `draft`, published `null`;
  - it stops on the first unexpected response.
- **Local dry run (Builder, Miniflare D1, real admin handlers; not production):**
  - from a reproduced UI-made ClinicFlow revision 1, the script produced ClinicFlow revision 2 and four new drafts;
  - 0 field differences against canonical D-115 across all five; validators, `validateProjectsGroup` and `initialReleaseReadiness` all pass;
  - 0 published, 0 markers; one success audit row per operation;
  - a re-run stops at the pointer pre-check.
- **Not authorized:**
  - deleting or recreating ClinicFlow;
  - project publication; homepage activation; an activation marker;
  - contact/`site_settings` changes; deployment;
  - direct D1 SQL; a service token; Access changes; R2; schema or migrations;
  - `main` merge; V10.1 changes.
- **Flags and directive:** unchanged. `DIR-WEB-RFC022-CONTENT-DRAFTS-0002` stays selected and open until all five exact drafts are verified. The Builder performs no write. The return is `H-WEB-RFC022-CONTENT-DRAFTS-0002`.

### D-119 — Amend D-118 execution channel: Work/browser operator may execute the exact replacement script

- **Decided by:** Paulo (Product / Risk Owner), in the ChatGPT Work session continuing from `Verify Gate C Handoff`, on authoritative governance tip `f4a63c4850e2d925c1dd90319f9648e56e3d7169`. Published by Work as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Amendment only:** Work/browser operator may execute, on Paulo's behalf in the owner-authenticated `https://maisoglabs.com/admin` browser session, the already-issued D-118 replacement browser-console script whose SHA-256 is `35b059d6a1cc82dee756b50ed52405f101c0a9d6b37f65aca55d62ebb7bb8f16`.
- **Exact-script requirement:** do not change, regenerate, broaden or reinterpret the script. If the authenticated admin session is unavailable, stop for Paulo to authenticate personally; Work must not request, retrieve, record, handle or bypass the OTP. If the script stops or any response differs from the D-118 contract, stop immediately, report the exact output and do not rerun blindly.
- **Unchanged content, verification and boundaries:** D-115 remains canonical without editorial change. D-118's PUT/POST sequence, expected pointers, read-only verification, desktop protected-preview evidence and mobile deferral remain unchanged. No project publication, initial homepage activation or marker, contact/`site_settings` mutation, deployment, Access/DNS/binding/secret/environment change, R2, schema or migration change, direct D1 SQL, service token, `main` or PR #7/#10 action, S6/S7, D-068 or V10.1 work is authorized.
- **Flags and directive:** unchanged. Only `MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED` and `REMOTE_D1_AUTHORIZED` remain `YES` for this operation. `DIR-WEB-RFC022-CONTENT-DRAFTS-0002` stays selected and open until the five exact drafts are verified. On success, publish the bounded Builder/Architect handoff, reset every action-specific authorization flag to `NO`, route to the Architect and stop.

### D-120 — Authorize a bounded V10.1 desktop remediation candidate only

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `e2e6d243b21ad90f81ac5f9db376f2dc4fc8ef83`, in the same message that relayed `ML-DEVOS-AS-144`. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Nature:** one reviewable V10.1 candidate that preserves the approved V10 visual identity while addressing the remaining desktop launch issues from the live review. It is not a redesign, not a production deployment and not project activation.
- **Source of truth:** the current approved V10 source and the current production implementation.
- **Preserve:**
  - the celestial and Roman/classical identity; the logo and brand system; the desktop composition;
  - the Systems experience; the Projects experience; the five D-115 projects; project navigation;
  - the motion style, except where production hardening requires an equivalent implementation;
  - RFC-022 content ownership boundaries.
- **Mobile:** explicitly deferred by Paulo. Not in scope: mobile navigation, selector rails, hero contrast, touch targets, nested scrolling. Mobile findings do not block this desktop candidate.
- **Bounded fixes:**
  1. **Research: remove dead affordances.**
     - Keep the working Research / Build / Thoughts filters.
     - Article cards stop being links, and nothing navigates to `#`.
     - Remove the dead "More notes" link.
     - Make clear these are previews or notes in preparation. Preferred treatment: the heading "Research Previews", and the non-interactive text "Notes in preparation" instead of "More notes →".
     - No fake article pages; no invented publications.
  2. **Contact: desktop polish only.**
     - Preserve the email data source and lifecycle.
     - Do not publish `paulo.maisog@maisoglabs.com`; do not change `site_settings`.
     - Fix desktop email wrapping so the address cannot break awkwardly before its final character.
     - Preserve the Contact composition and style.
     - Domain-email publication remains a separate owner decision after deliverability confirmation.
  3. **Document / accessibility basics,** where compatible with the V10 artifact pipeline, without redesigning sections:
     - `html lang="en-PH"`;
     - a real `main` landmark around the primary content; coherent heading order;
     - meta description; canonical; basic Open Graph and Twitter metadata;
     - preserved `:focus-visible`.

     If the self-unpacking mechanism removes metadata after document replacement, document that and address it in item 5 rather than adding metadata that disappears at runtime.
  4. **SEO static basics:** if indexing is intended and it needs no architecture expansion, a minimal `sitemap.xml` for the current public site and a useful, non-misleading `robots.txt`. No CMS, sitemap service or backend.
  5. **Production runtime hardening (feasibility, then implement if bounded).**
     - **Observed:** about 1.97 MB of initial HTML; client-side self-unpacking; development React/runtime; in-browser Babel; a transient blank state on reload.
     - **Approach:** investigate the actual source/build pipeline first.
     - **Preferred outcome:**
       - precompiled production JS and the production React runtime;
       - no browser-side Babel and no unnecessary client-side unpacking;
       - equivalent V10 rendering and interaction;
       - fingerprintable, cacheable assets where practical.
     - **Stop rule:** if it would require replatforming V10, replacing the visual system, rewriting the application architecture, materially changing RFC-022, breaking the MLData content seam, or a large new build system, stop that subtask and report it as deferred technical debt with the smallest future path.
  6. **Asset / caching quick wins,** only if trivial and safe:
     - identify oversized desktop assets;
     - enable long-lived immutable caching for fingerprinted static assets where the architecture supports it;
     - no recompression or re-authoring that risks visible quality loss.
- **RFC-022 / artifact safety:**
  - The D-093 artifact (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`) remains canonical and production-authoritative; it is not silently replaced.
  - Any candidate reports:
    - its artifact SHA-256;
    - whether its MLData seam stays RFC-022-compatible;
    - whether the bridge offset/hash constants would need updating;
    - whether the worker/bridge tests need changes;
    - whether serving it requires a new deployment.
  - A new artifact stays a review candidate, never production-authoritative under D-120.
- **Project content:** ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU and Maisog Kilat are not modified. No D-115 copy change, no new project revision, no publication, no homepage activation.
- **Authorized:** repository-local V10.1 candidate work only:
  - source changes; candidate build output;
  - local/headless-browser tests; screenshots and evidence;
  - documentation of the required artifact/bridge migration;
  - ordinary implementation commits on the working implementation branch.
- **Not authorized:**
  - production project publication; `POST /admin/api/projects/initial-activation`; a `homepage_initial_activation` marker;
  - production D1 mutation; `site_settings`/contact mutation; public email publication;
  - production deployment or traffic change;
  - Cloudflare Access, DNS, binding, secret or environment mutation; R2 mutation; production schema or migrations;
  - `main` merge; Gate C; PR #7 or #10; S6/S7; D-068.
- **Test / review target:**
  - viewports: 1440×900 and 1280×720;
  - checks:
    - entry/landing renders; Systems works; all five Projects render and navigate;
    - Research filters work and Research has no dead links;
    - Contact works visually; keyboard focus is visible;
    - no new console errors; no desktop horizontal overflow; project content is unchanged;
    - RFC-022 MLData compatibility is explicitly assessed.

  If hardening is implemented, report before/after: initial HTML size, in-browser Babel, the development React warning, self-unpacking, and any obvious load/render regression.
- **Flags:** `MUTATION_AUTHORIZED: YES` for repository-local candidate work only. Every production action flag stays `NO`.
- **Return:** Builder return `H-WEB-V101-DESKTOP-CANDIDATE-0001` with:
  1. exact files changed;
  2. the candidate commit SHA;
  3. the candidate artifact SHA if one exists;
  4. screenshots at 1440×900 and 1280×720;
  5. test results;
  6. Research behavior before and after;
  7. document/SEO changes;
  8. the contact wrapping result;
  9. the runtime-hardening result, `IMPLEMENTED` or `DEFERRED` with the reason;
  10. the RFC-022 bridge compatibility assessment;
  11. the exact steps to promote V10.1 later.

  Then `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, every flag `NO`.
- **Directive:** issue `DIR-WEB-V101-DESKTOP-CANDIDATE-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D120_V101_DESKTOP_CANDIDATE_REPOSITORY_ONLY`, applicable review `ML-DEVOS-AS-144`), routed to Claude/Builder.

### D-121 — Authorize bounded V10.1 promotion preparation (repository only)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `ae0419f73398cd43c140be0a4f76e6cb199f6d5b`, after `ML-DEVOS-AS-145` accepted the V10.1 desktop candidate. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Exact accepted artifact:** `candidates/v10.1/site/index.html`, SHA-256 `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`. The accepted candidate bytes are immutable for this operation: they are not rebuilt or regenerated in any way that changes the artifact.
- **Authorized scope:** one bounded repository promotion-preparation change that atomically:
  1. replaces `public/index.html` with the exact accepted candidate bytes;
  2. adds the accepted `/v101/` fingerprinted assets;
  3. adds the accepted `robots.txt`, `sitemap.xml` and `_headers`;
  4. updates the RFC-022 bridge constants to match the promoted artifact: `ARTIFACT_SHA256 = 220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`, `ARTIFACT_LENGTH = 20857`, `INSERTION_OFFSET = 20116`;
  5. updates all affected homepage-artifact and RFC-022 bridge tests in the same commit.

  The artifact replacement, all three bridge values and the affected tests are one atomic governed change. Partial replacement is prohibited (`ML-DEVOS-AS-145` mandatory promotion invariant).
- **Required verification:** the complete repository test suite and build. Locally/headlessly:
  - the promoted homepage artifact stays byte-identical to the accepted SHA-256;
  - RFC-022 injects successfully against the new artifact;
  - the five D-115 projects render in the approved order: ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat;
  - project copy and data are unchanged;
  - entry, Systems, Projects, Research and Contact remain functional; Research filters work and no dead `href="#"` links return;
  - keyboard focus stays visible; no desktop horizontal overflow; no new console errors;
  - the candidate's document metadata and static SEO files remain intact.
- **Not authorized:** Gate C; `main` merge; Gate D; production deployment or traffic change; production D1 or R2 mutation; project publication; initial homepage activation or a `homepage_initial_activation` marker; contact or `site_settings` mutation; contact-email publication; Access, DNS, binding, secret or environment mutation; schema or migration changes; mobile remediation; `og:image`; unrelated cleanup, refactoring or architecture expansion; PR #7 or PR #10 action; S6/S7; D-068.
- **Flags:** `MUTATION_AUTHORIZED: YES` for this repository-local change only. Every production, deployment and merge flag stays `NO`.
- **Return:** `H-WEB-V101-PROMOTION-PREP-0001` with:
  1. the exact promotion-preparation commit SHA;
  2. the complete changed-file set;
  3. the SHA-256 of `public/index.html`;
  4. the artifact length and insertion offset;
  5. the exact RFC-022 bridge constant values;
  6. complete test and build results;
  7. browser/bridge verification results;
  8. confirmation that D-115 project content is unchanged;
  9. confirmation that no production mutation, merge or deployment occurred;
  10. any limitations or newly discovered findings.

  Then `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, every flag `NO`. Stop after the return.
- **Directive:** issue `DIR-WEB-V101-PROMOTION-PREP-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D121_V101_PROMOTION_PREPARATION_REPOSITORY_ONLY`, applicable review `ML-DEVOS-AS-145`), routed to Claude/Builder.

### D-122 — Authorize V10.1 Gate C (protected `main` merge only)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `a9351c660ae4911c5f0536285560cb2c42befa65`, after `ML-DEVOS-AS-146` accepted the D-121 promotion preparation. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Bound anchors:**
  - reviewed implementation `49984e74bdc4109f431bdc24248f7a9bb000dcff`;
  - AS-146 publication `a9351c660ae4911c5f0536285560cb2c42befa65`;
  - expected `main` `405375998392e936b71181de387ae395b7d46e40`;
  - accepted homepage SHA-256 `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`, length `20857`, RFC-022 insertion offset `20116`.
- **Final Gate C head:** publishing D-122 and its directive is the only permitted governance-branch advancement after `a9351c6` before Gate C. That publication commit is `FINAL_GATE_C_HEAD`; its exact full SHA is recorded in the return. It contains only the governance/state/directive records needed to publish D-122: no application code, `public/`, tests, bridge behavior, runtime configuration, project content or production state. After it is recorded, any movement of `governance/maisoglabs-v0.1` invalidates this authorization and requires stopping for review.
- **Authorized action:** open exactly one fresh release PR `governance/maisoglabs-v0.1 → main`. Do not use or modify PR #10.
- **Before merge, verify:**
  - `main` is still exactly `405375998392e936b71181de387ae395b7d46e40`;
  - the PR head is exactly `FINAL_GATE_C_HEAD`;
  - the changes after `49984e7` are governance-only AS-146 and D-122 publication records;
  - `public/index.html` still has SHA-256 `220ce809…`;
  - the bridge values remain SHA `220ce809…`, length `20857`, offset `20116`;
  - the fresh PR is cleanly mergeable;
  - the active `main-protection` ruleset remains applicable;
  - `test-and-build` succeeds on the exact `FINAL_GATE_C_HEAD`;
  - the final changed-file set is manually inspected under AS132-F003;
  - the active production Worker version is recorded immediately before the merge.

  If any bound value differs, stop without merging.
- **Merge:** `MAIN_MERGE_AUTHORIZED: YES` for this exact Gate C only. Merge through the normal protected GitHub pull-request path with a normal merge commit pinned to `FINAL_GATE_C_HEAD`. No direct push, force push, squash, rebase, auto-merge or protection/ruleset bypass.
- **After merge, record:** the PR number; the final PR head; the CI result; the merge commit SHA and both parents; the resulting `main` SHA; the homepage artifact identity; the resulting Workers Build/version if Git integration uploads one; the active production version immediately before and after the merge. The active production version must remain unchanged. If Gate C unexpectedly changes production traffic, stop and report it without remediation.
- **Not authorized:** Gate D; deployment or traffic shift; `wrangler versions deploy`; production D1/R2 mutation; project publication or initial activation; contact or `site_settings` mutation; email publication; Access/DNS/binding/secret/environment changes; migrations/schema changes; mobile remediation; `og:image`; PR #7 or PR #10 action; unrelated cleanup; S6/S7; D-068.
- **Flags:** every authorization flag except the bounded `MAIN_MERGE_AUTHORIZED` stays `NO`.
- **Return:** Builder return `H-WEB-V101-GATE-C-0001` with the complete merge and CI evidence; every action flag reset to `NO`; `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`. Then stop. Gate D remains a separate Paulo authorization.
- **Directive:** issue `DIR-WEB-V101-GATE-C-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D122_V101_GATE_C_PROTECTED_MAIN_MERGE_ONLY`, applicable review `ML-DEVOS-AS-146`), routed to Claude/Builder.

### D-123 — Authorize V10.1 Gate D (one bounded production promotion)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `8d9b1227a74ffae8d03bbc833db2ab1143a208d5`, after `ML-DEVOS-AS-147` accepted V10.1 Gate C. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Authorized operation:** exactly one deployment of the existing Cloudflare Worker version `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` at 100% of production traffic. The Wrangler equivalent is `npx wrangler versions deploy 8fd31f47-a65d-4f57-83f1-17a1e0cd8043@100% --yes`, run once only. Rollback target: `862dc45e-9ad7-4324-80ae-912adbb6ce82`.
- **Preflight, read-only and immediately before deployment:**
  - `main` is still exactly `97ca982c9e8f1e306aaa8c8a5198f43f8e00629e`;
  - the candidate `8fd31f47…` still exists and is inactive;
  - it was produced by Workers Build `4eae04e3-02f3-4094-86bc-abc5f69b14d2`;
  - its expected `ASSETS`, `DB`, `MEDIA`, Access team domain and AUD bindings/config remain intact;
  - production is still exactly `862dc45e…` at 100%, with no traffic split;
  - `/admin` remains protected by the existing Cloudflare Access configuration.

  Any mismatch or ambiguity: STOP without deploying.
- **Do not:** rebuild; upload another version; use `wrangler deploy`; deploy a newer `main`; create a canary or traffic split; publish projects; activate the five D-115 drafts; create `homepage_initial_activation`; publish the contact email; mutate `site_settings`; mutate D1/R2; change Access, DNS, bindings, secrets or environment; merge anything else.
- **Expected live state:**
  - active production is `8fd31f47…` at 100%;
  - `/` returns 200 and serves V10.1 (artifact `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`);
  - `/v101/assets/` loads;
  - browser Babel and the old self-unpacking runtime are no longer served;
  - Systems, Research, Contact and navigation remain usable;
  - `/api/journal`, `/api/design` and `/journal` remain healthy;
  - `/admin` remains Access-protected.

  The five project drafts remaining absent from the public homepage is expected; do not publish them during Gate D and do not roll back because they are absent.
- **Conditional rollback:** at most one rollback to `862dc45e…` @ 100%, only if V10.1 causes a new material production failure. Qualifying failures: homepage unavailable or materially broken; major existing public APIs fail; new widespread Worker exceptions; the Access/admin path fails because of this release; required production bindings fail. Not for: unpublished projects being absent; unavailable CPU metrics; deferred mobile issues; deferred `og:image`; known test-browser video-codec limitations; pre-existing issues.
- **Flags:** `DEPLOY_AUTHORIZED: YES`. All other action flags remain `NO`.
- **Return:** Builder return `H-WEB-V101-GATE-D-0001` reporting:
  - the pre-deploy active version and deployment; the exact deployment operation; the new deployment ID;
  - the post-deploy active version and traffic allocation;
  - the live `/` result; the `/v101/` asset result; live functional smoke-test results; API/admin health;
  - any Worker exception or binding failure; rollback status;
  - confirmation that no project/contact publication or D1/R2/Access/config mutation occurred.

  Then `DEPLOY_AUTHORIZED: NO`, `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`. Then stop. Project activation remains a separate later decision.
- **Directive:** issue `DIR-WEB-V101-GATE-D-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D123_V101_GATE_D_PRODUCTION_PROMOTION_ONLY`, applicable review `ML-DEVOS-AS-147`), routed to Claude/Builder.

### D-124 — Defer initial activation; authorize recruiter-friendly project copy revision (drafts only)

- **Decided by:** Paulo (Product / Risk Owner), in the Builder session on governance tip `69cf99d042007eea535154d2bffb199ffff473cd`, after `ML-DEVOS-AS-148` accepted V10.1 Gate D. Published by Claude/Builder as mechanical publisher of Paulo's decision; committed text proves provenance, not authority.
- **Decision:** initial homepage project activation is **not** authorized yet. Before activation, revise only the public-facing copy of the existing five approved project drafts, so a recruiter or first-time visitor can quickly understand what each project is, what problem it addresses, what was built and what technical capability it demonstrates.
- **Copy-only refinement.** Project identities, order, technical stack, underlying project scope and architecture are unchanged. No project may be added, removed or reordered. Exact order: 1 ClinicFlow, 2 Eternal Eggs, 3 Sentinel / DevOS, 4 SU, 5 Maisog Kilat.
- **Exact revised content.** Only `category`, `summary`, `v10.tagline` and `v10.flow` change on each project. `id`, `slug`, `order`, `title`, `stack`, `accent`, `icon`, `featured`, `v10.status` (Sentinel / DevOS stays `Active`) and `v10.disciplines` are carried unchanged from D-115. Compact JSON SHA-256 `8c76c749409521f9311be8c78e9f49de3e4b43ea7ca05e5d3baf5590bcd1beab` (D-115: `e45a56ca…`):

```json
[
  {
    "id": "project-clinicflow",
    "slug": "clinicflow",
    "order": 1,
    "category": "AI Workflow Automation",
    "title": "ClinicFlow",
    "summary": "ClinicFlow is an AI-assisted clinic automation prototype I built to handle patient conversations, collect appointment details, coordinate scheduling and hand requests to staff through a structured workflow.",
    "stack": [
      "n8n",
      "LLM",
      "Webhooks",
      "Calendar"
    ],
    "accent": "gold",
    "icon": "automation",
    "featured": true,
    "v10": {
      "tagline": "AI-assisted clinic receptionist and appointment workflow automation.",
      "status": "",
      "disciplines": [
        0,
        1,
        4,
        3
      ],
      "flow": [
        "Patient starts a conversation",
        "Appointment details are captured and validated",
        "Booking and scheduling are coordinated",
        "Staff review the request and remain in control"
      ]
    }
  },
  {
    "id": "project-eternal-eggs",
    "slug": "eternal-eggs",
    "order": 2,
    "category": "AI Ordering Automation",
    "title": "Eternal Eggs",
    "summary": "Eternal Eggs is a conversational ordering system in development that turns customer chat messages into structured orders, checks quantities and details, calculates totals and helps prevent the same order from being processed twice.",
    "stack": [
      "Cloudflare Workers",
      "Durable Objects",
      "D1",
      "LLM"
    ],
    "accent": "violet",
    "icon": "automation",
    "featured": true,
    "v10": {
      "tagline": "A conversational ordering system that turns customer messages into structured orders.",
      "status": "",
      "disciplines": [
        0,
        1,
        4
      ],
      "flow": [
        "Customer sends an order by chat",
        "Order details are extracted and validated",
        "Quantity, total and delivery details are confirmed",
        "Staff receive a structured order for processing"
      ]
    }
  },
  {
    "id": "project-sentinel-devos",
    "slug": "sentinel-devos",
    "order": 3,
    "category": "AI Development Governance",
    "title": "Sentinel / DevOS",
    "summary": "Sentinel / DevOS is a governance and coordination system I use inside MaisogLabs to manage AI-assisted software development with defined scope, implementation steps, testing evidence and human approval.",
    "stack": [
      "Governance",
      "Architecture",
      "Evidence",
      "AI"
    ],
    "accent": "blue",
    "icon": "systems",
    "featured": true,
    "v10": {
      "tagline": "A system for managing AI-assisted software development with clear scope, testing and human approval.",
      "status": "Active",
      "disciplines": [
        0,
        2,
        1,
        5,
        3
      ],
      "flow": [
        "Work begins from an approved objective",
        "Scope and technical boundaries are defined",
        "Implementation produces testable evidence",
        "A person reviews the result and authorizes what happens next"
      ]
    }
  },
  {
    "id": "project-su",
    "slug": "su",
    "order": 4,
    "category": "AI Research & Verification",
    "title": "SU",
    "summary": "SU is an experimental AI research system I am developing to gather sources, trace claims, search for conflicting evidence and check whether conclusions are supported by the available evidence.",
    "stack": [
      "Research",
      "Evidence",
      "Review",
      "AI"
    ],
    "accent": "violet",
    "icon": "lab",
    "featured": true,
    "v10": {
      "tagline": "An AI research workflow for gathering sources, checking claims and testing conclusions against evidence.",
      "status": "",
      "disciplines": [
        2,
        0,
        5
      ],
      "flow": [
        "Relevant sources are gathered",
        "Claims are linked to supporting evidence",
        "Conflicting evidence is actively searched for",
        "A person reviews the evidence-backed conclusion"
      ]
    }
  },
  {
    "id": "project-maisog-kilat",
    "slug": "maisog-kilat",
    "order": 5,
    "category": "Algorithmic Trading Research",
    "title": "Maisog Kilat",
    "summary": "Maisog Kilat is an experimental trading research environment I built to develop and backtest algorithmic strategies against market data under explicit risk controls before considering any live use.",
    "stack": [
      "Research",
      "Backtesting",
      "Risk Controls",
      "Market Data"
    ],
    "accent": "blue",
    "icon": "lab",
    "featured": true,
    "v10": {
      "tagline": "A controlled environment for developing and backtesting trading strategies with explicit risk rules.",
      "status": "",
      "disciplines": [
        2,
        0,
        4,
        5
      ],
      "flow": [
        "A trading strategy hypothesis is defined",
        "The strategy is backtested against market data",
        "Performance and risk are measured",
        "Results are reviewed before any next step"
      ]
    }
  }
]
```

- **Authorized scope:**
  1. update the existing five unpublished production drafts with the exact copy above;
  2. create immutable revisions through the existing authenticated project lifecycle;
  3. preserve project IDs, slugs, order, stack, accent, icon, featured state and all other fields unless explicitly changed above;
  4. validate all five through the production validators;
  5. confirm `initialReleaseReadiness()` remains `true`;
  6. generate one protected V10.1 homepage preview;
  7. verify the resulting copy fits the existing desktop layout without overflow or truncation;
  8. return the preview and validation result for final owner approval.
- **Not authorized:** publishing any project; initial homepage activation; a `homepage_initial_activation` marker; modifying V10.1; any deployment; any merge; contact-email publication; `site_settings` changes; robots.txt or Cloudflare content-signal changes; any D1 change except through the existing authenticated project revision lifecycle for these five draft revisions; R2, Access, DNS, binding, secret or environment changes; mobile remediation; `og:image`; PR #7 or PR #10 action; unrelated cleanup.
- **Flags**, for this bounded draft-copy revision only: `MUTATION_AUTHORIZED: YES`, `AUDIT_APPEND_AUTHORIZED: YES`, `REMOTE_D1_AUTHORIZED: YES`. Every other action-specific flag stays `NO`.
- **Return:** Builder return `H-WEB-RFC022-CONTENT-COPY-0001` with:
  - the five new revision IDs;
  - the exact before/after public-facing copy;
  - production validator results; the `initialReleaseReadiness()` result;
  - protected V10.1 preview evidence;
  - confirmation that none of the projects are published and that public `/` is unchanged;
  - any copy overflow or presentation issue.

  Then every action flag is reset to `NO`, with `TURN: PAULO`, `STATUS: PAULO_DECISION_REQUIRED`, `AUTHORIZED_SCOPE: RFC022_INITIAL_PROJECT_ACTIVATION_DECISION_ONLY`. Then stop.
- **Directive:** issue `DIR-WEB-RFC022-CONTENT-COPY-0001` (cycle `MAISOGLABS_WEB_RFC022_CBR`, scope `D124_RFC022_PROJECT_COPY_DRAFT_REVISION_ONLY`, applicable review `ML-DEVOS-AS-148`), routed to Claude/Builder.
