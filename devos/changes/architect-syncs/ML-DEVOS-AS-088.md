# Architect Review — SENTINEL S6 Isolated Execution Design Final Re-Review

Architect Sync: ML-DEVOS-AS-088
Status: CHANGES_REQUESTED — REMEDIATION BUDGET EXHAUSTED / PAULO DECISION REQUIRED
Review mode: ARCHITECTURE FINAL RE-REVIEW
Cycle: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
Authority: D-066
Reviewed remediation commit: a56a76e8d28a3960734c93734fd8dbc3e715e554
Reviewed remediation parent: 7e9c55af0d16227984b2a1ff388eb9ec8c92b344
Target RFC: ML-DEVOS-RFC-019
Prior review: ML-DEVOS-AS-087
Remediation cycle: 2 of 2 — exhausted

## Verdict

RFC-019 DIRECTION: ACCEPTABLE
RFC-019 DESIGN: NOT YET APPROVED
AS87-F001: CLOSED
AS86-F001: CLOSED
AS86-F002: CLOSED
AS86-F003: CLOSED
AS86-F004: CLOSED
New blocker: AS88-F001
Automatic remediation budget: EXHAUSTED
Next authority: PAULO DECISION REQUIRED

S6 executable implementation: NOT AUTHORIZED
devos/execution root reservation: NOT AUTHORIZED
Manifest mutation: NOT AUTHORIZED
S5 runtime wiring / transport authorization: NOT AUTHORIZED
S7+: NOT AUTHORIZED
Deployment / production mutation / protected-main merge / PR #10 merge: NOT AUTHORIZED

Cycle 2 correctly fixes the S4 publication payload. During final design review, however,
one independent provenance-definition defect remains: the publication payload contains
a digest whose defined input includes the PENDING record that stores that same payload.
That creates a self-referential hash dependency with no defined construction.

Because this is already remediation cycle 2 of 2, the Architect does not open a third
cycle unilaterally. Paulo must decide whether to authorize one narrowly bounded
additional design correction, revise the remediation ceiling, redesign the provenance
field, or stop S6.

## Independent review basis

The Architect independently inspected authoritative commit
`a56a76e8d28a3960734c93734fd8dbc3e715e554`, its exact parent, its bounded six-file
design-only delta, RFC-019 §§7.1/7.1.1/17, the real S4 transition/evidence/idempotency
implementation, and the committed traceability index.

The changed surface remains bounded to RFC-019, its RFC index entry, deterministic
traceability outputs, CURRENT_HANDOFF and STATE. No executable S6 source, S3/S4/S5
implementation or interface mutation, manifest/root reservation, product/runtime
change, deployment surface, protected/main merge, or later-phase implementation was
introduced.

Committed traceability before this Architect publication is:
342 scanned files / 2 errors / 14 warnings / 298 canonical definitions.
The error fingerprint remains exactly CORE-022 and WEB-REQ-009.

## AS87-F001 — CLOSED

RFC-019 now defines one explicit Builder publication `evidenceRef` contract.

It correctly includes:

- `evidenceClass: "ACTOR_REPORTED"`;
- an S6 Result Transfer Record reference;
- result/base/tree identity and provenance fields;
- no secret, credential, host path or environment value.

It stores the serialized payload before the first S4 call and re-parses those same
stored bytes for crash-recovery replay. This matches S4's actual implementation:

- `BUILDING -> READY_FOR_QA` requires a valid `evidenceRef.evidenceClass`;
- `ACTOR_REPORTED` is an allowed class;
- S4's transition idempotency binding hashes `JSON.stringify(evidenceRef)`;
- replay is checked before owner/revision validation, allowing the original successful
  result to be returned after state advancement when the binding is identical.

The Builder does not over-claim isolation as independent evidence. Independent QA and
future S7/S9 remain separate.

## AS88-F001 — BLOCKER — publication provenance digest is self-referential

RFC-019 §7.1 says:

1. build the publication `evidenceRef`;
2. write the PENDING Result Transfer Record;
3. that PENDING record stores the exact serialized publication `evidenceRef`.

RFC-019 §7.1.1 defines member 8 of that same `evidenceRef` as:

`provenance_digest` = the hash-chained journal head **up to and including the PENDING
RTR entry**.

Those rules are circular.

The PENDING RTR entry contains the serialized `evidenceRef`.
The `evidenceRef` contains `provenance_digest`.
But `provenance_digest` is defined as a hash over the journal that already includes
that PENDING RTR entry and therefore already includes `provenance_digest`.

There is no deterministic ordinary SHA-256 construction for this dependency unless the
RFC defines a special canonical placeholder/fixed-point scheme, which it does not.
The Builder's S4 scratch probe does not exercise this problem: it can supply any
preselected 64-hex provenance string and therefore proves only that S4 accepts the
payload shape, not that S6 can actually construct the payload from its own journal
rules.

This is an executable design blocker because the publication payload must exist before
the PENDING record can be written and before S4 is called.

### Narrow correction available for owner decision

The smallest correction is to break the cycle rather than invent a cryptographic
fixed-point protocol.

A future authorized remediation could define member 8 as, for example:

- `prepublication_provenance_digest`: the journal head immediately **before** the
  PENDING RTR entry is appended;

then:

1. compute that pre-PENDING journal head;
2. build and serialize the evidenceRef with that fixed digest;
3. write the PENDING RTR containing the serialized payload;
4. append/hash the PENDING entry normally;
5. optionally record a separate `pending_record_digest` or later journal head outside
   the payload if proof of the PENDING record itself is desired.

Equivalent non-circular designs are acceptable, but the payload may not contain a hash
defined over a record that itself contains that payload unless a complete deterministic
construction is explicitly specified and justified.

Any correction must preserve:

- AS87-F001's `evidenceClass: "ACTOR_REPORTED"`;
- byte/content-identical S4 replay binding;
- S4 unchanged;
- S7 not implemented early;
- no stronger evidence-class claim.

## Final status of prior findings

- AS86-F001: CLOSED — immutable identity and mutable S4 fencing checkpoint are separated.
- AS86-F002: CLOSED — Result Transfer Record replaces the nonexistent S4 evidence read path.
- AS86-F003: CLOSED — non-existent-tail filesystem creation is explicitly bounded.
- AS86-F004: CLOSED — task scope, execution transport and S5 boundaries are separated.
- AS87-F001: CLOSED — S4 evidence-class/idempotency payload contract now matches implementation.
- AS88-F001: OPEN BLOCKER — self-referential provenance digest.

## Evidence disposition

INDEPENDENTLY_INSPECTED:

- authoritative remediation commit and exact parent;
- bounded changed-file surface;
- final §7.1/§7.1.1 publication payload;
- S4 evidence guard and idempotency ordering/binding;
- §17 provenance/journal definition;
- traceability fingerprint;
- live routing/handoff identity.

ACTOR_REPORTED:

- Builder S4 scratch probe;
- Builder 606/606 full-suite execution;
- validators and traceability regeneration;
- platform/tool versions.

No RUNTIME_OBSERVED evidence is claimed.

## Paulo decision requested

The Architect recommends, if S6 is to continue, authorizing **one exceptional narrowly
bounded design-remediation cycle** solely for AS88-F001.

That authorization should permit only:

- RFC-019 provenance/payload wording necessary to remove the circular digest;
- directly necessary RFC index text;
- deterministic traceability outputs;
- normal Context Bootstrap coordination/handoff evidence.

It should not permit executable S6 implementation or reopen already-closed S3/S4/S5
interfaces.

Paulo may instead decline, redesign more broadly, or stop S6. The Architect does not
make that owner decision.

## Routing

This review deselects `H-S6-RFC019-REM2-0001` and archives it byte-for-byte with
provenance.

The same publication:

- publishes immutable `ML-DEVOS-AS-088`;
- sets CURRENT_HANDOFF NONE and clears selectors;
- routes TURN: PAULO;
- sets STATUS: PAULO_DECISION_REQUIRED;
- keeps CURRENT_REMEDIATION_CYCLE: 2 / MAX_REMEDIATION_CYCLES: 2;
- sets PAULO_DECISION_REQUIRED: YES;
- keeps every remote/deploy/main/mutation flag NO.

No additional remediation or implementation is authorized by AS-088 itself.
