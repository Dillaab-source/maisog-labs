# Architect Review — Sentinel S5 Capability & Permission Gateway

Architect Sync: ML-DEVOS-AS-076
Status: CHANGES_REQUESTED
Review mode: ARCHITECTURE STAGE GATE — REMEDIATION CYCLE 1 RE-REVIEW
Cycle: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_PROPOSAL
Authority: D-058
Current branch HEAD inspected: c3bd11d252ec0850943a09e7ef5d251f1cd64c66
Target RFC: ML-DEVOS-RFC-017
Reviewed RFC blob: 1e4330e5e36ad7425a589e2febd4b502f7c61866
Remediation cycle requested next: 2 of 2

## Verdict

RFC-017 DIRECTION: ACCEPTED
RFC-017 IMPLEMENTATION READINESS: CHANGES_REQUESTED
SCOPE COMPLIANCE OF S5 REMEDIATION: PASS
S5 IMPLEMENTATION: NOT AUTHORIZED

The Cycle 1 remediation materially improves the proposal and fully closes AS75-F002 and AS75-F003. The audit-envelope part of AS75-F005 is also corrected. However, implementation readiness remains blocked by four bounded design defects. Two are incomplete closures of prior findings; one is a newly exposed purity contradiction; one is a contract-consistency defect that would otherwise make implementation/tests ambiguous.

The later D-060 / SENTINEL Context Plane planning records are explicitly outside this S5 review. They were owner-approved after the remediation and do not count as Builder scope drift. Builder traceability counts from Cycle 1 therefore remain evidence about the remediation head, not a claim that current HEAD has been revalidated after D-060.

## Prior finding disposition

- AS75-F001 — PARTIALLY CLOSED. Trusted and untrusted structures are now separated, but source authenticity is still only asserted by a forgeable string/convention.
- AS75-F002 — CLOSED. Consequence tier is now policy-validation-only and no longer a MAY-inside-CAN evaluation gate.
- AS75-F003 — CLOSED FOR S5 DESIGN. Policy pinning and a separately supplied live revocation list now resolve the original contradiction. Freshness enforcement remains correctly identified as an integration responsibility.
- AS75-F004 — PARTIALLY CLOSED. Match precedence is deterministic, but provider-specific canonicalization remains under-specified.
- AS75-F005 — AUDIT ENVELOPE PORTION CLOSED. Decision/envelope separation is sound, but the expiry clock now contradicts the RFC's stronger purity claim and must be corrected as AS76-F001 below.

## AS76-F001 — four-argument purity contradicts the injected clock

RFC-017 states that:

- `evaluate(subjectContext, requestIntent, policy, revocationList)` is pure over exactly four explicit arguments;
- byte-identical calls return byte-identical decisions;
- descriptor expiry is evaluated at decision time;
- time is obtained through an injectable `now()`.

Those statements cannot all be true simultaneously. If `now()` is not one of the explicit decision inputs, two calls with byte-identical four arguments can cross an expiry boundary and return different results. An injected callback/closure is still external state from the perspective of the four-argument pure function.

Required remediation:

1. Make decision time an explicit trusted value in the deterministic input contract, or add an explicit evaluation-context argument containing that value.
2. Do not accept an untrusted caller-controlled timestamp that could be backdated to bypass expiry.
3. Remove every claim that the function is pure over exactly four inputs unless all decision-varying values are actually contained in those inputs.
4. Update §3, §6, §11, §12, required-design-decision table, tests, and implementation mapping consistently.
5. Preserve the audit-envelope separation: audit timestamp/event ID remain outside the pure decision and are not substitutes for the trusted evaluation-time input.

## AS76-F002 — trusted subject origin is still forgeable by construction

Cycle 1 correctly moved role and credential assertions out of untrusted `requestIntent` into `subjectContext`, and added `attested_by`. But `evaluate()` can only check that `attested_by` contains the name of a registered adapter/host. A caller can still construct:

`{ actor_role: "Paulo", credential_available: true, attested_by: "github", ... }`

and the evaluator has no mechanical way to distinguish that object from one actually produced by the registered GitHub adapter. The RFC itself acknowledges this misuse case.

That means the original caller-forgery risk is reduced by convention, but not yet closed as an implementation-ready trust boundary.

Required remediation:

1. Define the mechanical boundary that prevents arbitrary request callers from supplying raw trusted subject assertions directly.
2. The minimal V1 solution may be a trusted host/adapter wrapper that constructs the subject context internally and is the only public invocation path to the evaluator; an opaque/branded attestation handle is also acceptable if simpler to verify.
3. Clearly distinguish:
   - untrusted external caller input;
   - adapter/host-authenticated subject facts;
   - the internal pure evaluator input.
4. State what the evaluator itself validates versus what the trusted wrapper guarantees.
5. Keep actual identity-provider authentication and secret-value validation out of S5 if desired; the requirement is provenance of the assertion, not expansion into a full auth system.

No cryptographic attestation system is required for V1 unless the design chooses one. A process/module boundary is sufficient if its trust assumptions and bypass limitations are explicit and testable.

## AS76-F003 — one universal resource canonicalization rule is not sufficient for five provider classes

RFC-017 now defines deterministic match precedence, which is good. But it assigns the same canonicalization recipe — Unicode NFC, one percent-decode pass, trailing-slash handling — to shell paths, GitHub resources, Cloudflare identifiers, MCP resources, and browser targets.

These are not equivalent resource domains. Examples:

- shell/filesystem resources require path and traversal semantics, and may involve platform/symlink behavior;
- browser resources are URLs with scheme/host/default-port/path/query semantics;
- GitHub resources include repositories, refs and API-native identifiers;
- Cloudflare and MCP can contain opaque IDs/URIs where decoding or path assumptions may be invalid.

A generic percent-decoding rule can itself change the identity of an opaque resource. The test plan mentions traversal and encoding cases, but the design does not define what each adapter's canonical resource form actually is.

Required remediation:

1. Keep the core matcher provider-neutral, but move canonicalization responsibility to explicit per-adapter contracts.
2. For each V1 adapter, define the canonical resource shape/category it emits and the normalization/rejection rules relevant to that provider.
3. The core evaluator must compare already-canonical values; it must not apply provider-specific URL/filesystem decoding itself.
4. Define wildcard matching only over the canonical string/identifier form the adapter contract emits.
5. Keep fail-closed behavior when an adapter cannot safely canonicalize a resource.

The RFC does not need an exhaustive API catalog. It does need enough adapter contract to make the V1 matching algorithm deterministic and non-lossy.

## AS76-F004 — denial-reason vocabulary is internally inconsistent

§3 says every DENY uses a bounded V1 vocabulary and then enumerates:

- EXPIRED
- REVOKED
- RESOURCE_SCOPE_MISMATCH
- AMBIGUOUS_POLICY_MATCH
- CREDENTIAL_REQUIREMENT_UNSATISFIED
- UNTRUSTED_SUBJECT_CONTEXT
- POLICY_VERSION_MISMATCH
- MALFORMED_REQUEST

But §4 additionally uses:

- UNKNOWN_ACTOR_ROLE
- UNKNOWN_PROVIDER
- UNKNOWN_ACTION
- UNKNOWN_PROJECT
- UNKNOWN_ENVIRONMENT

This leaves the implementation/schema/test enum ambiguous.

Required remediation:

1. Define one canonical denial-reason enum in one section.
2. Make §3, §4, schemas/implementation mapping, and test plan reference that one vocabulary.
3. Do not use prose such as "table plus" where the exact machine vocabulary can be stated once and referenced.

## Required Cycle 2 delta

LEAN / DELTA-ONLY. Modify only what is necessary to close AS76-F001..F004:

- devos/changes/rfcs/ML-DEVOS-RFC-017.md
- devos/changes/rfcs/README.md only if its summary becomes inaccurate
- deterministic traceability outputs only through normal regeneration
- coordination/IMPLEMENTER_HANDOFF.md
- coordination/STATE.md

Do not modify D-060 or the queued Context Plane planning record during this S5 remediation.

Return with:

- exact AS76 finding-to-section mapping;
- exact changed files;
- validator/traceability evidence and exit codes;
- before/after ERROR fingerprint;
- CURRENT_REMEDIATION_CYCLE: 2;
- TURN: ARCHITECT;
- STATUS: READY_FOR_ARCHITECT.

## Hard boundaries

No executable S5 implementation.
No S6+.
No Context Plane implementation or protocol migration.
No Skills V0.2.
No application/product/runtime change.
No live credential or secret access.
No S3/S4 schema or implementation change.
No manifest, ADR, Sentinel-version, frozen-architecture, or CORE-rule mutation.
No remote D1/R2.
No Cloudflare Access, DNS, domain, deployment, or rollback change.
No production-data write.
No public D1 cutover.
No protected/main merge.
No PR #10 merge or auto-merge.

## Cycle-cap rule

This is remediation Cycle 2 of 2. If the returned design still has an implementation-readiness blocker, do not start a third autonomous remediation cycle. Route the unresolved issue to Paulo for disposition under the existing remediation-cap rule.
