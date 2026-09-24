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
