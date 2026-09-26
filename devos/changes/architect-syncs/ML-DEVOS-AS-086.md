# Architect Review — SENTINEL S6 Isolated Execution Design

Architect Sync: ML-DEVOS-AS-086
Status: CHANGES_REQUESTED — REMEDIATION CYCLE 1
Review mode: ARCHITECTURE STAGE GATE REVIEW
Cycle: SENTINEL_S6_ISOLATED_EXECUTION_DESIGN
Authority: D-066
Reviewed proposal commit: e16105a9de6791f3ba3269b689730b6a6e7cc7b1
Reviewed proposal parent: 2691812326f6c3cf2cdbdfd2129bf823f465e864
Target RFC: ML-DEVOS-RFC-019
Applicable prior live review: ML-DEVOS-AS-085
Remediation cycle: 1 of 2

## Verdict

S6 RFC-019 DESIGN: CHANGES REQUESTED
Scope compliance: PASS
Overall architecture direction: PASS WITH FOUR DESIGN BLOCKERS
Dedicated-clone / L1-L4 isolation model: ACCEPTABLE DIRECTION
Independent QA reconstruction objective: ACCEPTABLE DIRECTION
Canonical-home recommendation `devos/execution/`: ACCEPTABLE DIRECTION, NOT YET AUTHORIZED
S6 executable implementation: NOT AUTHORIZED
Manifest/root reservation: NOT AUTHORIZED
S5 runtime wiring: NOT AUTHORIZED
S7+: NOT AUTHORIZED
CP-4+ / Model Router: NOT AUTHORIZED
Remote D1/R2 / deployment / production mutation: NOT AUTHORIZED
Protected/main merge: NOT AUTHORIZED
PR #10 merge / auto-merge: NOT AUTHORIZED

RFC-019 is a substantial and generally coherent S6 design, but four contradictions cross existing S3/S4/S5 boundaries or make a stated V1 invariant impossible to implement as written. They must be reconciled before architecture approval. No S3/S4/S5 implementation change is requested or authorized by this review.

## Independent review basis

The Architect independently inspected the authoritative snapshot at
`e16105a9de6791f3ba3269b689730b6a6e7cc7b1`.

That commit is directly parented to the D-066 routing base
`2691812326f6c3cf2cdbdfd2129bf823f465e864`.

The changed surface is bounded to RFC-019, its RFC index entry, deterministic
traceability outputs, CURRENT_HANDOFF, and STATE. No S6 executable source,
manifest/root reservation, S3/S4/S5 implementation/interface mutation, product/runtime
code, deployment surface, later-phase implementation, protected/main merge, or PR #10
merge was introduced.

The Architect independently inspected the accepted S3 Task Contract specification,
the implemented S4 kernel/lifecycle public surface, the accepted S5 gateway/adapters,
the frozen trust boundaries, the roadmap, and the committed traceability index.
Builder command execution remains ACTOR_REPORTED where the Architect did not rerun it.

Committed traceability after the proposal is independently inspected as:
336 scanned files / 2 errors / 14 warnings / 296 canonical definitions.
The ERROR fingerprint is exactly the known `CORE-022` and `WEB-REQ-009` debt.
RFC-019 is a canonical definition in the generated index.

## AS86-F001 — BLOCKER — immutable Execution Identity conflicts with S4 lease renewal

RFC-019 §3 makes every Execution Identity field immutable for an instance, includes
`owner_revision` in that identity, and hashes the identity. RFC-019 §8/§13 then lets
the same instance perform S4 `renew` and adopt its returned revision.

S4's accepted unified revision is the fencing/concurrency token and increments on every
successful mutating operation, including `renew`. An ordinary lease renewal therefore
necessarily changes `owner_revision`, contradicting RFC-019's immutable-identity rule.

### Required remediation

Keep S4 unchanged. Split:

1. stable immutable execution-instance identity and digest; from
2. a mutable monotonic current fencing checkpoint / observed S4 revision.

The mutable checkpoint may advance only through a verified successful S4 claim/renew
result for the same owner. Any unexplained revision advance must stale/fence the
instance. Do not introduce a second fencing counter.

## AS86-F002 — BLOCKER — QA source-of-truth flow assumes an S4 API that does not exist

RFC-019 §7 says Builder completion puts result/provenance data in S4 `evidenceRef`
and QA reads `result_commit_sha` from the S4 record through public `getState()`.

The implemented S4 `getState()` returns taskId, contract_ref, state, owner, revision,
lease_expires_at, retry_counts and authority_disclaimer. It does not expose
`evidenceRef`, transition history or the result commit. `transition()` likewise does
not return the stored evidence reference.

S4 internally records evidenceRef, but RFC-019 must compose through accepted public
surfaces rather than reaching into S4 persistence.

### Required remediation

Keep S4 implementation/interface unchanged. Define an S6-owned result-transfer /
provenance mapping that is cross-checked against a successful S4 transition. The
trusted S6 host may, for example, durably journal the pushed result SHA/provenance keyed
to the task/instance/transition attempt, and expose it to QA only after current S4
state/revision proves the handoff succeeded.

The corrected design must ensure:

- Builder prose/local files are not QA's source of truth;
- QA reconstructs from a remote-fetched exact commit;
- stale/orphaned branch data cannot become the accepted handoff;
- S4 remains lifecycle/fencing authority;
- S6 owns only execution/provenance mapping;
- S7 is not implemented early;
- S4 internal history is not treated as a public API.

If an additive S4 read interface is deemed essential, identify it as a separate future
architecture dependency requiring separate authority; do not silently assume it.

## AS86-F003 — BLOCKER — path rule cannot canonicalize a path before creating it

RFC-019 §9 requires every filesystem operation, including create, to first resolve its
target to a fully canonical real path. A path/tail that does not exist cannot be
ordinary-realpath-resolved before creation, while the RFC also relies on exclusive
creation to establish instance uniqueness.

### Required remediation

Specify a non-existent-tail creation algorithm:

- canonicalize/verify the nearest existing ancestor;
- validate every future literal tail segment under the platform profile;
- reject traversal/device/ADS/drive-relative/namespace forms before creation;
- create with exclusive/no-follow semantics where available;
- immediately re-resolve/revalidate after creation;
- fail closed on reparse/symlink/junction substitution or unverifiable races;
- keep deletion no-follow rules distinct from creation rules.

Reuse accepted S5 platform-aware path principles where useful without changing S5.

## AS86-F004 — BLOCKER — S3 remote-resource flag and mandatory Git push are unresolved

RFC-019 §8 refuses every Task Contract whose five S3 consequence flags are not all
false. RFC-019 §13 nevertheless makes a host-side task-branch push part of normal
successful completion, and that remote call is capability-gated through S5 GitHub.

S3 defines `remote_resources_involved` as a required contract scope flag. RFC-019
therefore leaves a load-bearing contradiction unresolved:

- if S6's required GitHub push counts as task remote-resource involvement, a normal S6
  task needs the flag true and V1 rejects it;
- if host-side execution transport is outside that task-scope flag, RFC-019 must define
  and justify that boundary so the contract is not misleading while a governed remote
  write occurs.

RFC-019 leaves this as Q2; it must be decided before approval. The correction must also
narrow the statement that "every real-world action" goes through S5: existing S5 is a
decision library over bounded provider adapters, not an interceptor for every internal
filesystem/journal operation in the trusted S6 host.

### Required remediation

Resolve Q2 and define:

- whether host control-plane Git fetch/push is task `remote_resources_involved` or a
  separately authorized execution-transport action;
- which operations require S5 decisions (e.g. GitHub remote calls and actor/tool shell
  execution);
- which S6 internal bookkeeping/isolation operations are trusted mechanism internals;
- how S3 scope, S5 CAN and governance MAY remain separate;
- how credentials stay host-side and never enter the task instance.

Do not add a new S5 provider or alter S3 semantics.

## Accepted design direction

Subject to those four blockers, retain:

- explicit L1/L2/L3/L4 isolation distinction and honest L3 limits;
- dedicated clone per execution instance;
- no shared Builder/QA workspaces, hardlinks or alternates;
- independent QA reconstruction from a remote-fetched exact commit once F002 is fixed;
- clean-tree proof, no cleaning into compliance, and quarantine semantics;
- S3-by-reference scope consumption;
- S4 ownership/lease/fencing reuse without a second task state machine;
- MAY / CAN / ISOLATED separation;
- fail-closed reason model and bounded environment lifecycle;
- private caches by default and no credential copying into instances;
- Windows/POSIX analysis and explicit TOCTOU residual risk;
- S6 provenance without prematurely implementing S7;
- `devos/execution/` as the reasonable proposed S6 canonical home, while root creation
  and manifest mutation remain separately gated.

## Evidence disposition

INDEPENDENTLY_INSPECTED:
authoritative tip/parent; proposal delta; RFC-019; S3 consequence semantics; S4 renew,
revision, getState/transition result and evidence boundary; S5 adapter/decision boundary;
manifest reserved roots; traceability fingerprint; handoff/routing identity.

ACTOR_REPORTED:
Builder 606/606 suite; validators; traceability regeneration/no-drift; platform/tool
versions.

No RUNTIME_OBSERVED evidence is claimed.

## Carry-forward obligations

No operative obligation is closed. OBL-010, OBL-011, OBL-012, OBL-015, OBL-017 and
OBL-018 remain OPEN; all other OPEN/DEFERRED rows remain governed by
`coordination/OPERATIVE_OBLIGATIONS.md`.

## Routing

Open Remediation Cycle 1 of 2 under D-066 proposal/design authority.

This publication deselects `H-S6-RFC019-0001`, archives it byte-for-byte with
provenance, publishes this review as immutable `ML-DEVOS-AS-086` and the rolling
ARCHITECT_REVIEW, sets CURRENT_HANDOFF NONE, routes TURN CLAUDE /
STATUS CHANGES_REQUESTED / CURRENT_REMEDIATION_CYCLE 1 /
IMPLEMENTER_ACTION_REQUIRED YES, and keeps every remote/deploy/main/mutation flag NO.

Builder remediation is limited to AS86-F001 through AS86-F004 and directly necessary
RFC-index, traceability, coordination and handoff evidence.

After remediation, Builder returns TURN ARCHITECT / READY_FOR_ARCHITECT for independent
re-review.

No S6 executable implementation, root reservation, manifest mutation, S5 runtime
wiring, S7+, CP-4+, Model Router, deployment, remote production mutation,
protected/main merge, or PR #10 merge is authorized.
