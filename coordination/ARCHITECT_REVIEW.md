# Architect Review — ML-DEVOS-RFC-016 S4 State Machine Kernel

Status: PAULO_DECISION_REQUIRED
Review mode: STAGE GATE REVIEW
Cycle: SENTINEL_S4_STATE_MACHINE_PROPOSAL
Reviewed remediation HEAD: cead2405e0147967bb89391c4d772d0579d94009
Prior reviewed proposal: 4e9b6aeacd2977051f08c450eeef966ab43b17c4
Authority: D-048 proposal/audit only. S4 implementation remains unauthorized.

## Independent review result

The bounded remediation materially improved RFC-016.

Closed:
- AS65-F002 — ownership handoff deadlock: CLOSED.
- AS65-F003 — retry policy coupled to coordination/STATE.md: CLOSED.
- AS65-F004 — incomplete mutating-operation idempotency semantics: CLOSED.
- Non-blocking clarification set: CLOSED.

Still open:
- AS65-F001 — persistence/concurrency correctness: PARTIALLY REMEDIATED, ONE SAFETY BLOCKER REMAINS.

## AS65-F001 remaining blocker — unsafe stale-lock stealing

The revised `fs.open(path, 'wx')` exclusive lock correctly serializes normal concurrent writers while the lock remains intact. That fixes the original rename-only race.

However, the proposed stale-lock recovery is not safe enough for an authoritative state kernel:

1. writer A legitimately holds `<task>.lock`;
2. A pauses longer than the configured lock-staleness ceiling (scheduler stall, GC pause, debugger, filesystem delay, or unexpectedly slow I/O) but is still alive;
3. writer B observes the old timestamp, unlinks A's lock, and creates a new lock;
4. A and B can now both execute the supposedly exclusive critical section and both write task state.

The second exclusive-create performed by B does not protect against A because A still believes it owns the now-unlinked inode/file handle. Time age alone is not proof that the original holder is dead.

That violates RFC-016's core invariant: at most one authoritative writer may enter the state mutation critical section.

### Architect recommendation — smallest safe V1

Keep the JSON + exclusive-create design, but make orphaned-lock recovery FAIL CLOSED rather than automatic.

For V1:
- never auto-unlink a held lock merely because its timestamp is old;
- on `EEXIST`, return a deterministic `LOCK_HELD` / `LOCK_RECOVERY_REQUIRED` result;
- record enough diagnostic lock metadata for an operator to inspect the suspected orphan;
- recovery of a genuinely orphaned lock is an explicit operator/admin maintenance action outside ordinary task mutation, performed only after confirming no writer remains;
- document this as a deliberate availability trade-off: a crashed writer may temporarily block that task, but Sentinel must prefer a visible stopped task over two concurrent authoritative writers;
- add a crash/orphan-lock test proving ordinary mutation never steals a lock automatically.

This is a much smaller delta than replacing persistence entirely and preserves the zero-third-party-dependency V1 direction.

SQLite remains a valid later alternative if autonomous multi-process crash recovery becomes important. The current Node built-in SQLite API is still documented by Node as Stability 1.2 / release candidate, so adopting it now would introduce a separate runtime/API maturity decision rather than merely fixing this RFC's concurrency invariant.

## Stage-gate verdict

S4 DESIGN STAGE GATE: NOT YET APPROVED
READY TO IMPLEMENT: NO
PAULO DECISION REQUIRED: YES

Reason: the one authorized remediation cycle is exhausted (`CURRENT_REMEDIATION_CYCLE: 1` of `MAX_REMEDIATION_CYCLES: 1`). Architect will not silently raise the cap.

Recommended Paulo decision:
- authorize exactly one micro-remediation pass;
- raise the remediation ceiling only for this pass;
- scope it solely to replacing automatic stale-lock stealing with fail-closed orphan-lock handling and updating the directly affected RFC tests/mapping text;
- no S4 implementation.

## Standing coordination efficiency rule — LEAN / DELTA-ONLY BUILDER MODE

Paulo explicitly requested that future Claude turns minimize token consumption. This rule applies to the next Builder handoff and should be carried forward in subsequent bounded Builder turns unless Paulo changes it.

Claude reads only:
1. `coordination/STATE.md`;
2. `coordination/ARCHITECT_REVIEW.md`;
3. the exact files authorized for mutation.

Additional repository files are read only when an active finding specifically requires resolving a cited source.

Builder rules:
- do not reread the whole governance/architecture history;
- do not summarize files that were merely read;
- do not restate old decisions or prior-cycle narrative;
- make the smallest coherent delta;
- do not perform unrelated cleanup;
- run only checks required by the changed surface;
- keep `IMPLEMENTER_HANDOFF.md` compact: input HEAD, files changed, findings resolved, commands/checks, blockers, resulting HEAD, next actor;
- commit once where practical;
- stop immediately after the return gate is satisfied.

Architect remains responsible for broad architecture/governance reasoning. Builder is responsible for the bounded delta.

## If Paulo authorizes the recommended micro-remediation

Next Builder scope must be exactly:
- `devos/changes/rfcs/ML-DEVOS-RFC-016.md`;
- traceability derived outputs only if regeneration changes them;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

Required RFC delta only:
- remove automatic age-based lock stealing;
- specify fail-closed orphan-lock behavior and explicit operator recovery boundary;
- update crash/recovery and race tests/mapping accordingly;
- preserve all already-closed AS65 findings without reopening or rewriting unrelated sections.

No executable S4 code, no architecture/core/S3/manifest/version/ADR/workflow/product/remote/deploy/main mutation.
