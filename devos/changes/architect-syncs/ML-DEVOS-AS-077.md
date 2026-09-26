# Architect Review — Sentinel S5 Capability & Permission Gateway

Architect Sync: ML-DEVOS-AS-077
Status: ARCHITECT_APPROVED — PAULO IMPLEMENTATION DECISION REQUIRED
Review mode: ARCHITECTURE STAGE GATE — FINAL DESIGN RE-REVIEW
Cycle: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_PROPOSAL
Authority: D-058
Reviewed input base: e22837fff5f3bf4c9ce1fc57f65d5bff3df3d75e
Reviewed branch delta: exactly one commit ahead of that base
Target RFC: ML-DEVOS-RFC-017
Reviewed RFC blob: b3e25b12f7d6531ad9697039acf4d107a69ddfe7
Remediation cycle: 2 of 2

## Verdict

RFC-017 DIRECTION: ACCEPTED
RFC-017 DESIGN: ARCHITECT_APPROVED
RFC-017 IMPLEMENTATION READINESS: READY FOR PAULO DECISION
S5 IMPLEMENTATION: NOT YET AUTHORIZED
SCOPE COMPLIANCE: PASS
TRACEABILITY: PASS FOR RFC DELTA / PRE-EXISTING BOOKKEEPING GAP DISCLOSED

All four AS76 remediation findings are closed. No third autonomous remediation cycle is opened.

## Independent review evidence

Architect independently inspected:

- live coordination/STATE.md;
- the current Cycle 2 implementer handoff;
- the current RFC-017 design, including §§2–4, §6, §9, §§11–12, evidence requirements, threat model, test plan, and implementation mapping;
- the branch delta from e22837f to the current branch;
- the regenerated traceability index.

The branch is exactly one commit ahead of e22837f and the changed-file surface is bounded to:

- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md
- devos/changes/rfcs/ML-DEVOS-RFC-017.md
- devos/governance/traceability/TRACEABILITY_INDEX.md
- devos/governance/traceability/traceability-index.json

No product/runtime/S3/S4/manifest/ADR/version/frozen-architecture/remote/deploy/main surface is in the Cycle 2 delta.

Builder command execution remains ACTOR_REPORTED. Architect independently inspected the resulting repository artifacts and traceability output.

## AS76-F001 — CLOSED

The prior purity/clock contradiction is resolved.

The evaluator is now explicitly:

`evaluate(subjectContext, requestIntent, policy, revocationList, evaluationContext)`

and decision time is contained in the trusted, branded `evaluationContext.time` input. RFC-017 consistently states that the evaluator performs no ambient wall-clock read. Expiry is evaluated against that explicit decision-time input, while the later AuditEnvelope timestamp remains a separate non-pure audit fact.

This makes the RFC's determinism claim coherent: byte-identical five-argument inputs produce byte-identical decisions.

## AS76-F002 — CLOSED FOR V1 DESIGN

The trusted-context boundary is now mechanical rather than merely conventional.

RFC-017 distinguishes:

1. untrusted external request intent;
2. adapter/host-derived trusted subject and evaluation facts;
3. the internal pure evaluator inputs.

Registered adapter wrappers are the sole public invocation surfaces. They internally construct branded `subjectContext` and `evaluationContext`; the raw evaluator rejects unbranded values and is not the caller-facing API.

The RFC correctly preserves one residual trust assumption: a compromised or buggy registered adapter can still lie about what it attests. That is explicitly disclosed rather than falsely claimed closed. V1 does not require cryptographic attestation; the implementation must choose and justify a concrete module/process brand mechanism and prove that arbitrary external object literals cannot mint it.

## AS76-F003 — CLOSED

The core matcher no longer applies a universal normalization/decoding algorithm.

Canonicalization is now delegated to explicit provider-adapter contracts for:

- shell/filesystem resources;
- GitHub resources;
- Cloudflare opaque identifiers;
- MCP resource URIs;
- browser URLs.

The core compares only already-canonical strings. Each adapter has a fail-closed rejection rule, and the test plan includes provider-specific negative cases. This closes the prior cross-domain ambiguity without introducing provider-specific authority into the core evaluator.

## AS76-F004 — CLOSED

Section 4 is now the single canonical denial-reason vocabulary.

The enum is stated once and the rest of the RFC references that canonical source instead of maintaining divergent copies. The evaluator, schema, implementation mapping, and tests therefore have one bounded machine vocabulary to implement.

## Prior AS75 disposition

- AS75-F001 — CLOSED through the Cycle 2 trusted adapter-wrapper/brand boundary.
- AS75-F002 — CLOSED in Cycle 1.
- AS75-F003 — CLOSED in Cycle 1.
- AS75-F004 — CLOSED through Cycle 2 provider-specific canonicalization contracts plus deterministic matching precedence.
- AS75-F005 — CLOSED through the pure decision / separate AuditEnvelope contract and explicit decision-time input.

## Non-blocking design note — descriptor expiry wording

The descriptor table still contains one sentence saying a null-expiry descriptor “expires functionally” when its containing policy version is superseded and no successor exists. The operative §6 semantics are more precise: an in-flight attempt remains pinned to its original immutable policy and is affected by normal supersession only for new attempts; emergency revocation is handled through the separate live revocation list.

This is an editorial consistency note, not a remaining design blocker, because:

- `evaluate()` has no ambient active-policy lookup and therefore cannot retroactively invalidate a pinned attempt on ordinary supersession;
- §6, §11, the threat model, and tests consistently define the intended behavior.

If Paulo authorizes implementation, the implementation brief should include a one-line RFC wording reconciliation so the descriptor table says “not grantable to new attempts after supersession” rather than implying retroactive invalidation of pinned attempts. This does not require a third design-remediation cycle.

## Traceability disposition

The regenerated index reports:

- 272 scanned files
- 3 errors
- 16 warnings
- 276 canonical definitions

The three ERROR fingerprints are:

- CORE-022 — pre-existing known debt
- WEB-REQ-009 — pre-existing known debt
- ML-DEVOS-AS-075 — missing durable Architect Sync archive

Architect independently confirmed the AS-075 finding is not introduced by the RFC-017 Cycle 2 delta. It comes from D-059 referencing ML-DEVOS-AS-075 while no canonical archive file currently exists under devos/changes/architect-syncs/.

This is a governance-bookkeeping gap, not an RFC-017 architecture defect. Because Cycle 2 is the remediation cap, no unauthorized Cycle 3 is opened. Before or together with any S5 implementation authorization, Paulo should authorize the smallest bounded archival/traceability reconciliation needed to create the missing durable Architect Sync record(s) from Git history and regenerate traceability honestly.

Do not suppress the finding or fabricate a zero-error state.

## Implementation readiness boundaries

Architect approval means only that RFC-017 is sufficiently specified for Paulo to decide whether to authorize a bounded S5 implementation.

It does not itself authorize:

- executable S5 code;
- integration into S3/S4;
- live credentials/secrets;
- remote resources;
- deployment/rollback;
- production writes;
- main merge;
- S6+;
- Context Plane implementation.

A future S5 implementation must still prove the RFC's required tests and evidence, including the brand boundary, provider-specific canonicalization, deterministic expiry/pinning/revocation behavior, canonical denial codes, no secret-value leakage, and no widening of closed S3/S4 interfaces.

## Paulo decision requested

Paulo may now decide whether to authorize:

1. a bounded S5 implementation cycle matching RFC-017; and
2. a bounded Architect-Sync archive/traceability bookkeeping reconciliation for the missing AS-075 canonical target, preferably before implementation evidence is treated as clean.

D-060 / SENTINEL Context Plane V1 remains a separate queued initiative and is not activated by this verdict.

## Hard boundaries

Until Paulo decides:

- no executable S5 implementation;
- no S6+;
- no Context Plane implementation or coordination-protocol migration;
- no product/runtime change;
- no live credential or secret access;
- no S3/S4 mutation;
- no manifest/ADR/version/frozen-architecture/CORE-rule mutation;
- no remote D1/R2;
- no Cloudflare Access/DNS/domain/deployment/rollback;
- no production-data write;
- no public D1 cutover;
- no protected/main merge;
- no PR #10 merge or auto-merge.
