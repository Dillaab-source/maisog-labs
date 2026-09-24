# Architect Review — SENTINEL S5 Capability & Permission Gateway V1 Implementation

Architect Sync: ML-DEVOS-AS-082
Status: CHANGES_REQUESTED — REMEDIATION CYCLE 1
Review mode: SECURITY / IMPLEMENTATION REVIEW
Cycle: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_IMPLEMENTATION
Authority: D-063
Reviewed implementation commit: d589a16b8256232edd029593d653335913619125
Reviewed implementation parent: ce9c0391260ef0ba4620936b1b448e3de8d135cb
Target design: ML-DEVOS-RFC-017
Design approval: ML-DEVOS-AS-077
Applicable prior live review: ML-DEVOS-AS-081
Remediation cycle: 1 of 2

## Verdict

S5 V1 IMPLEMENTATION: CHANGES REQUESTED
Scope compliance: PASS
Architecture direction: PASS WITH TWO IMPLEMENTATION BLOCKERS
AS-077 descriptor-expiry reconciliation: PASS
S3/S4 non-integration boundary: PASS
Known traceability debt preservation: PASS
Manifest closure: NOT AUTHORIZED / correctly still NOT_IMPLEMENTED
S6+: NOT AUTHORIZED
CP-4+: NOT AUTHORIZED
Model Router V0: NOT AUTHORIZED
Remote D1/R2: NOT AUTHORIZED
Deployment / production mutation: NOT AUTHORIZED
Protected/main merge: NOT AUTHORIZED
PR #10 merge / auto-merge: NOT AUTHORIZED

The implementation is close, but two bounded defects materially affect RFC-017's trusted-wrapper and platform-canonicalization contracts. They must be corrected before S5 implementation acceptance.

## Independent review basis

Architect independently inspected the exact authoritative snapshot at
`d589a16b8256232edd029593d653335913619125`.

The implementation is exactly one commit ahead of the D-063 authorization commit
`ce9c0391260ef0ba4620936b1b448e3de8d135cb`.

The changed-file surface is bounded to the authorized S5 implementation, focused tests/fixtures, the required RFC wording reconciliation, traceability outputs, and coordination handoff/state. No S3/S4 integration, manifest closure, product/runtime integration, remote-resource mutation, deployment, main merge, S6+, CP-4+, or Model Router implementation was introduced.

Builder-reported test execution remains ACTOR_REPORTED where the Architect did not execute the command in an equivalent local repository runtime. The Architect independently inspected the implementation and test logic; that inspection is not silently upgraded to reproduced execution evidence.

## AS82-F001 — BLOCKER — trusted-context minters are caller-acquirable

RFC-017 §3/§9 and ML-DEVOS-AS-077 require the trusted `subjectContext` /
`evaluationContext` brand to be mintable only by registered adapter-internal code,
so an arbitrary caller cannot manufacture trusted evaluator inputs.

The current implementation does keep the WeakMap brand itself module-private, but
`devos/capabilities/trusted-context.mjs` publicly exports:

`registerAdapters(factory)`

On its first call this function hands the caller all genuine minters. The repository
has no package `exports` barrier, and the implementation/test code can directly
import both `trusted-context.mjs` and raw `evaluate.mjs`.

Therefore a same-process caller can:

1. import `registerAdapters` before the real adapter registry;
2. call `registerAdapters((m) => m)` and retain genuine minters;
3. mint branded subject/evaluation contexts with caller-selected trusted facts;
4. import the raw evaluator and evaluate with those genuine brands.

The registry then being sealed only causes the legitimate adapter registry to fail
later; it does not revoke the already-released minters or stop the early caller from
using the raw evaluator.

The focused core test itself demonstrates that the generic minter-acquisition path is
usable for direct evaluator testing. The existing hostile-early-claim test checks only
that the later real registry import fails; it does not prove that the early claimant
cannot continue with the minters it already received.

This contradicts the implementation claim that minters are released only to the
static registered adapter set and materially weakens the RFC's arbitrary-caller
forgery closure.

### Required remediation

Keep the existing in-process/non-cryptographic V1 trust model; no redesign or
cryptographic attestation is requested.

Make the production module graph mechanically prevent an ordinary caller from
acquiring a genuine subject/evaluation minter through the generic registration
surface. The five registered adapters may still receive the capability internally,
but there must not be a caller-facing "claim the minters first" path that can then be
combined with raw `evaluate()`.

Add an adversarial regression test for the complete bypass, not only registry
sealing: an early/foreign caller must be unable to obtain usable genuine minters and
then produce a trusted direct-core decision.

Do not expose new test-only production hooks that recreate the same bypass.

## AS82-F002 — BLOCKER — shell canonicalization is POSIX-only, not platform-correct

RFC-017 §9 specifies the shell canonical resource as an absolute filesystem path
whose platform path separator is normalized to `/`, with traversal and symlinks
resolved before comparison.

The implementation is explicitly POSIX-only:

- `canonical.mjs` converts backslashes to `/` and then requires the value to
  start with `/`;
- `shell.mjs` starts resolution at root `/`;
- it uses `path.posix.dirname` / `path.posix.join` for traversal;
- root comparisons mix `fs.realpathSync()` native outputs with a hard-coded
  `/` separator.

A normal Windows absolute path such as `C:\repo\file.txt` becomes
`C:/repo/file.txt` and is rejected because it does not start with `/`.
This does not satisfy the RFC's platform-separator-normalization contract and makes
the shell adapter unusable on a supported local Windows runtime.

### Required remediation

Implement platform-aware absolute-path resolution/confinement while preserving the
same security properties:

- absolute path required;
- traversal and symlink semantics resolved under the host OS;
- path must remain inside an allowed trusted root;
- emitted canonical resource uses `/` separators consistently for policy matching;
- dangling/unresolvable/escaping paths fail closed;
- not-yet-existing tails remain handled deliberately and safely.

Add regression coverage that proves Windows-form absolute paths are normalized
correctly without weakening POSIX behavior. The test strategy may isolate pure
Windows path normalization from filesystem-specific symlink tests if the CI host is
not Windows.

No new provider, remote call, shell execution, S3/S4 integration, or broader
architecture change is authorized.

## Accepted implementation evidence

Subject to the two blockers above, independent source inspection found the following
design mappings present and coherent:

- pure five-argument evaluator with explicit trusted evaluation time;
- canonical 14-code denial vocabulary;
- default-deny matching and deterministic ambiguity handling;
- pinned immutable policy document plus live revocation override;
- credential class/availability only, with no credential value in decisions;
- provider-specific canonicalization split from the pure core;
- public `index.mjs` does not re-export raw `evaluate()`;
- five static provider adapters and no dynamic plugin discovery;
- no S3/S4 wiring;
- separate AuditEnvelope construction;
- AS-077 descriptor-expiry wording now reads "not grantable to new attempts after supersession";
- manifest remains NOT_IMPLEMENTED pending a separate closure gate;
- traceability continues to disclose the known CORE-022 and WEB-REQ-009 debt.

Builder-reported evidence also states 37/37 focused tests and 593/593 full repository
tests passed, with 12/12 mutation guards killed after two test gaps were discovered
and corrected. These execution results remain ACTOR_REPORTED in this review.

## Obligation disposition

Closed by this review:

- OBL-002 — the required AS-077 descriptor-expiry wording reconciliation is present
  in RFC-017 and independently inspected.

Remain unresolved:

- OBL-009 — Trial #1 measurements are useful and recorded, but the trial remains open
  through remediation/final review; do not close it yet.
- OBL-010 — rollback after several real V0 turns.
- OBL-011 — behavioral/procedural forged-authorization and hostile-evidence evaluation.
- OBL-012 — supported-participant exact-tip publication demonstration remains open.
- OBL-015 — CORE-022 / WEB-REQ-009 traceability debt.
- all other OPEN/DEFERRED obligations not explicitly closed by an authoritative record.

The Builder's observation that the CLAUDE.md first-read list and live STATE lean-read
instruction can conflict is retained as Bootstrap Trial evidence under OBL-009. It is
not expanded into unrelated Context Plane implementation work during this S5
remediation.

## Routing

Open Remediation Cycle 1 of the live maximum 2 under the existing D-063 S5 authority.

This publication deselects handoff H-S5-TRIAL1-0001. In the same atomic transition:

- archive that outgoing CURRENT_HANDOFF byte-for-byte with provenance;
- publish this review under new immutable ID ML-DEVOS-AS-082 and byte-identical archive;
- set CURRENT_HANDOFF: NONE and clear the selector tuple;
- set TURN: CLAUDE;
- set STATUS: CHANGES_REQUESTED;
- set CURRENT_REMEDIATION_CYCLE: 1;
- set IMPLEMENTER_ACTION_REQUIRED: YES;
- keep every remote/deploy/main/mutation flag NO.

Builder remediation authority is limited to AS82-F001 and AS82-F002 plus directly
necessary focused tests/documentation/traceability/coordination evidence.

After remediation, Builder must publish a new CURRENT_HANDOFF and return
TURN: ARCHITECT / STATUS: READY_FOR_ARCHITECT for independent review.

No later phase or closure is authorized.
