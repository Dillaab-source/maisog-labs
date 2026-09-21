# Architect Review — Sentinel S5 Capability & Permission Gateway

Architect Sync: ML-DEVOS-AS-075
Status: CHANGES_REQUESTED
Review mode: ARCHITECTURE STAGE GATE
Cycle: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_PROPOSAL
Authority: D-058
Reviewed proposal HEAD: e72e29de0e3445cb639f30062622c82d1316a379
Target RFC: ML-DEVOS-RFC-017
Remediation cycle: 1 of 2

## Verdict

RFC-017 DIRECTION: ACCEPTED
RFC-017 IMPLEMENTATION READINESS: CHANGES_REQUESTED
SCOPE COMPLIANCE: PASS
TRACEABILITY AUDIT: PASS WITH KNOWN BASELINE
S5 IMPLEMENTATION: NOT AUTHORIZED

The proposal correctly preserves the frozen Governance MAY / Capability CAN separation, defaults unknown capability axes to DENY, keeps secrets out of policy, avoids modifying S3/S4, and remains proposal-only. Five bounded design defects must be closed before implementation authority can be considered.

## Independent evidence

The live branch returned:

- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- proposal commit: e72e29de0e3445cb639f30062622c82d1316a379
- RFC blob: bca746d5f6f6a1e83110c5975582fa3a5cb21620

The proposal commit changed only the authorized surfaces:

- devos/changes/rfcs/ML-DEVOS-RFC-017.md
- devos/changes/rfcs/README.md
- devos/governance/traceability/TRACEABILITY_INDEX.md
- devos/governance/traceability/traceability-index.json
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

Builder audit remains ACTOR_REPORTED:

- generation: 271 files / 2 errors / 14 warnings
- validation exit: 1 because the known ERROR baseline remains
- ERROR fingerprint: CORE-022 + WEB-REQ-009
- unexpected new hard ERROR: none

## AS75-F001 — caller-forgeable subject and credential assertions

RFC-017 lets the request carry `actor_role` and lets the caller supply `credential_available: true/false`. Its threat model then states that role spoofing is out of scope and that the evaluator trusts the supplied role. A caller could therefore claim `actor_role: Paulo` and a required credential class without any trusted provenance and receive ALLOW.

That is not merely authentication being deferred. It makes the proposed CAN decision structurally dependent on self-asserted capability facts.

Required remediation:

1. Define a trusted subject/context boundary separate from untrusted request intent.
2. Specify which registered host or adapter may attest actor role and credential-class availability.
3. Include attestation source/issuer and exact credential class without any secret value.
4. DENY when the trusted subject/context is absent, malformed, mismatched, or produced by an unregistered source.
5. Keep actual identity authentication and credential-value validation out of S5 if desired, but state precisely what trusted assertion S5 requires and what external boundary is responsible for producing it.

## AS75-F002 — consequence-tier gate is undefined and risks authority conflation

The decision flow includes a consequence-tier gate and the denial code `CONSEQUENCE_TIER_GATE_UNSATISFIED`, but the request and descriptor contracts define no technical input that can satisfy that gate. Section 8 defines only a structural minimum classification for sensitive operations.

If the missing gate is intended to represent human approval or risk acceptance, S5 would be evaluating MAY inside the CAN mechanism, contradicting the RFC's central boundary. If it is a technical-protection prerequisite, the prerequisite is not specified.

Required remediation:

- Keep the sensitive-operation category floor as a policy-validation rule.
- Either remove `CONSEQUENCE_TIER_GATE_UNSATISFIED` from capability evaluation, or define a strictly technical, trusted, machine-checkable precondition with its input, source, validation, and denial semantics.
- Do not model Paulo approval, governance authorization, evidence sufficiency, or risk acceptance as a capability-gateway input.

## AS75-F003 — active-policy freshness and attempt binding contradict each other

The pure API is `evaluate(request, policy)`, but stale-version handling compares the request with a separate concept of the currently loaded active version. That trusted active-version source is absent from the function contract.

The RFC also requires one policy version to remain bound to a task/attempt, while separately requiring every stale caller to fetch the new active version and retry. After a policy changes, those rules cannot both hold for the same attempt.

Required remediation:

1. Define the immutable policy-version identifier and the trusted active-policy snapshot/pointer supplied to evaluation.
2. Decide whether an in-flight attempt is pinned to its original policy or is invalidated when active policy changes.
3. If invalidated, specify that the attempt must stop and restart/rebind rather than silently retry under a new policy.
4. If pinned, define how emergency revocation overrides a pinned grant without permitting removed capabilities to remain usable.
5. Make the resulting evaluation deterministic from its complete explicit inputs.

## AS75-F004 — resource matching and multi-match behavior are nondeterministic

The RFC leaves the `resource_scope` grammar unresolved even though resource matching is central to ALLOW/DENY. It also denies multiple matches only when selected fields differ. Two matching descriptors with the same consequence and credential requirements can still have different IDs or scopes, while ALLOW promises one exact `descriptor_id`.

Project `*`, resource wildcards, exact matches, and overlapping patterns have no defined precedence or normalization.

Required remediation:

- Select and specify the bounded V1 resource grammar now.
- Define canonical normalization and escaping for every V1 provider adapter.
- Define exact-versus-wildcard precedence and project-`*` behavior.
- Define a deterministic multiple-match rule. The safest V1 rule is DENY whenever more than one descriptor matches unless the RFC defines an unambiguous canonical selection rule.
- Add tests for overlap, equivalent normalized resources, wildcard boundaries, traversal/encoding cases, and multiple matching IDs.

## AS75-F005 — pure evaluation conflicts with audit-event generation

RFC-017 calls `evaluate()` pure and side-effect-free, then says every call produces an audit event containing `event_id` and `timestamp`. Event-ID generation and caller-dependent provenance are not defined as evaluator inputs. If generated internally, identical calls are no longer pure; if supplied or wrapped externally, the API description is incomplete.

The event's provenance also cannot be inferred merely because the evaluator ran. Provenance describes how evidence was produced and observed.

Required remediation:

1. Separate the deterministic decision result from the audit-event envelope, or make every event-varying value an explicit input.
2. Define who assigns `event_id`, timestamp, and evidence provenance.
3. Ensure a retried identical decision remains deterministic while each attempt may still receive a distinct audit event.
4. Preserve the honest V1 boundary: event construction may be returned in-process, while durable storage and stronger attestation remain later-phase concerns.

## Required Cycle 1 delta

Modify only:

- devos/changes/rfcs/ML-DEVOS-RFC-017.md
- devos/changes/rfcs/README.md, only if its summary must change
- deterministic traceability outputs, only through regeneration
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

Preserve all accepted design direction and avoid unrelated rewriting.

Return with:

- each AS75 finding mapped to exact corrected RFC sections;
- exact changed files;
- validation commands and exit codes;
- before/after traceability counts and ERROR fingerprints;
- TURN: ARCHITECT;
- STATUS: READY_FOR_ARCHITECT;
- CURRENT_REMEDIATION_CYCLE: 1.

## Hard boundaries

No executable S5 implementation.
No S6+.
No Skills V0.2.
No application/product/runtime change.
No live credential or secret access.
No S3/S4 schema or implementation change.
No manifest, ADR, version, frozen-architecture, or CORE-rule mutation.
No remote D1/R2.
No Cloudflare Access, DNS, domain, deployment, or rollback change.
No production-data write.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.
