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
