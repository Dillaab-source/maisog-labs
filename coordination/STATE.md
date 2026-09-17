# MaisogLabs Agent Coordination State

CYCLE_ID: SENTINEL-S1-GOVERNANCE-KERNEL
TURN: CLAUDE
STATUS: WAITING_FOR_IMPLEMENTER
AUTHORIZED_SCOPE: SENTINEL_S1_GOVERNANCE_KERNEL_ONLY
ARCHITECT_ACTION_REQUIRED: NO
IMPLEMENTER_ACTION_REQUIRED: YES
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: 6e817add0e3b18d1612fcb86af96c2c269b6d58c
LAST_ARCHITECT_REVIEWED_SHA: 6e817add0e3b18d1612fcb86af96c2c269b6d58c
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Current baseline

S0 Architecture Freeze is closed and Architect-approved.

Authoritative architecture:
- `devos/architecture/ML-DEVOS-ARCH-001.md`
- `devos/plans/ML-DEVOS-SIP-001.md`

Relevant Architect Syncs:
- `ML-DEVOS-AS-002` — S0 closure and architecture corrections
- `ML-DEVOS-AS-003` — future-change governance architecture

Relevant Paulo decision:
- `D-012` — adopt AS-003 and authorize S1 Governance Kernel

## S1 objective

Formalize the reusable Sentinel Governance Kernel so future changes are classified, attributable, reviewable, and progressively machine-readable without implementing runtime enforcement yet.

## Authorized S1 outputs

Claude may create or modify documentation/static governance-data artifacts under `devos/` needed to define:

1. change classification:
   - PATCH
   - LOCAL_RULE
   - CORE_POLICY
   - CAPABILITY
   - ARCHITECTURE
   - CONSTITUTIONAL
   - WAIVER
   - PROJECT_ONBOARDING

2. RFC / Architect Sync / authorization / implementation / ADR separation;

3. rule-registry and rule-record format with stable IDs, scope, risk, status, authority, applicability, evidence requirements, exception policy, provenance, version, and supersession metadata;

4. RFC template;

5. ADR template;

6. expiring waiver template;

7. capability-change proposal template;

8. project-onboarding template;

9. Decision Packet specification/template for sensitive human approvals;

10. Governance Bundle manifest specification, including version/revision/integrity metadata as a future-facing design only;

11. semantic version/provenance policy for architecture/governance changes;

12. constitutional/core rule extraction from the frozen S0 architecture into a static registry without weakening or silently rewriting those rules;

13. S1 handoff and traceability mapping back to D-012 / AS-003 / the frozen S0 architecture.

Static YAML/JSON/Markdown governance records are allowed. Deterministic parse/lint checks for those static records are allowed only if they do not implement policy enforcement or later-phase engines.

## Binding rules

- Repository state is authoritative.
- Project overlays may strengthen/narrow core rules but may not silently weaken constitutional/core rules.
- Capability != Authority.
- No actor or mechanism may invent delegation.
- Sensitive human approvals should bind to the concrete intended action via a Decision Packet, not only an agent-written summary.
- Risk-based gates should avoid making Paulo approve routine low-risk actions where explicit bounded pre-authorization exists.
- Architecture, constitutional, security/trust-boundary, material-risk, governance-authority changes remain Paulo-gated.
- Production deployment remains Paulo-gated unless Paulo explicitly changes that policy.

## Explicitly prohibited in S1

- no Policy Engine runtime
- no Task Engine runtime
- no Orchestrator
- no Evidence Gate runtime
- no Capability Gateway runtime
- no CI/workflow implementation
- no GitHub ruleset/branch-protection changes
- no website/admin implementation
- no application/runtime migration
- no production deployment
- no merge to protected branch / website `main`
- no S2+ implementation
- no silent architecture version bump
- no weakening of frozen S0 constitutional/core rules

## Required handoff

When S1 candidate artifacts are complete, Claude must:

1. report the exact base and candidate commit SHA;
2. list every created/modified file;
3. map every artifact to D-012 and ML-DEVOS-AS-003;
4. distinguish human-readable policy from machine-readable static records;
5. show that no runtime enforcement or later-phase subsystem was implemented;
6. identify any proposed version bump rather than applying one silently;
7. update `coordination/IMPLEMENTER_HANDOFF.md`;
8. set `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`, `IMPLEMENTER_ACTION_REQUIRED: NO`;
9. stop for independent Architect review.

## Current gate

`S1 — GOVERNANCE KERNEL` is authorized. No later Sentinel phase is authorized.
