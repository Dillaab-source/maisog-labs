# Architect Review — SENTINEL S6 D-074 Hardened-Core Implementation

Architect Sync: ML-DEVOS-AS-102
Status: CHANGES_REQUESTED — BOUNDED IMPLEMENTATION REMEDIATION
Review mode: INDEPENDENT IMPLEMENTATION REVIEW
Cycle: SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION
Authority: D-074 / ML-DEVOS-AS-101
Reviewed coordination tip: f725207bc1308b5d13d3810c22361271bcbf7d33
Reviewed handoff: H-S6-CORE-HARDEN-0001
Implementation base: 3f0fdafa62b4c58b42ef6da3e425c1afdfbcddaa
Target design: ML-DEVOS-RFC-019
Sentinel baseline: v1.8.0
Current remediation cycle: 1 of 2

## Verdict

`CHANGES_REQUESTED — BOUNDED IMPLEMENTATION REMEDIATION`

The D-074 implementation substantially conforms to the AS-101-accepted hardened architecture.

The Architect independently inspected:

- exact commit ancestry and changed-file scope;
- the per-task TaskStore transaction wrapper;
- lock and compare-and-set behavior;
- content-addressed blob publication;
- ACTIVE / active-slot derivation;
- claim execution-uncertainty reservations;
- late-report supersession;
- exact-target proof/operator resolution;
- public production surface;
- reference-model structure;
- PENDING attribution behavior;
- the Builder-disclosed implementation decisions.

The async local transaction path is coherent: `TaskStore.transact()` awaits its transaction callback under the per-task lock before committing the envelope.

AS99-F001 and AS100-F001 remain correctly represented in the inspected implementation.

One direct RFC invariant violation remains.

`AS102-F001` is blocking.

No new architecture-hardening round is required.

## AS102-F001 — lazy permit expiry commits a lifecycle transition without its justifying journal evidence

RFC-019 §13.6 I5 requires:

`Every committed lifecycle change has its justifying journal entry in the same committed version.`

The reference model follows that rule.

Its explicit permit-expiry transition performs the equivalent of:

`ISSUED -> EXPIRED_UNCLAIMED`

and commits an:

`EXPIRE`

journal/model entry in that same transition.

The runtime does not.

In `devos/execution/host.mjs`, the transaction wrapper invokes `persistExpiries(st)` before the requested operation.

`persistExpiries(st)` currently performs the equivalent of:

`setPermitState(p, "EXPIRED_UNCLAIMED")`

for every expired unclaimed `ISSUED` permit.

It writes no corresponding journal entry.

This is not merely theoretical.

On an attempted claim of an expired permit:

1. `persistExpiries()` changes the permit to `EXPIRED_UNCLAIMED`;
2. `claimPermit()` observes that it is no longer `ISSUED`;
3. it returns `failAfterCommit(...)`;
4. the transaction therefore intentionally commits the expiry before surfacing the failure.

The resulting committed state contains the lifecycle transition, but no journal entry justifying that expiry.

The existing permit-expiry test verifies only that the resulting state is `EXPIRED_UNCLAIMED`.

It does not verify the journal/provenance evidence.

Therefore:

- runtime behavior violates I5;
- runtime behavior disagrees with the reference model's expiry transition;
- the existing test suite does not cover that equivalence.

## Required correction

Correct only AS102-F001.

When an `ISSUED` permit becomes `EXPIRED_UNCLAIMED`, the same local transaction must append explicit justifying journal evidence for that permit.

A suitable event is:

`PERMIT_EXPIRED`

or a semantically equivalent existing vocabulary if one already exists.

The event must identify at least:

- `permit_id`;
- the expiration fact / reason;
- directly necessary deterministic expiry metadata such as the claim deadline where appropriate.

The permit-state transition and its journal evidence must be in the same TaskStore commit.

If multiple permits expire in one transaction, every transitioned permit must have corresponding evidence.

Do not create a separately mutable expiry log.

Do not weaken lazy-expiry semantics.

Do not make trusted time move a `CLAIMED` permit out of `CLAIMED`.

Do not change claim-reservation semantics.

## Required focused evidence

Add or strengthen tests proving at minimum:

### E1 — expired attempted claim

Issue a permit.

Advance trusted time beyond its claim deadline.

Attempt to claim it.

The operation must fail closed as currently designed.

After the commit:

- permit state is `EXPIRED_UNCLAIMED`;
- the owning instance's committed journal contains the expiry event for that exact permit;
- the journal head verifies;
- the expiry evidence and state are from the same committed TaskStore version / transition.

### E2 — model/runtime correspondence

The runtime expiry outcome must correspond to the reference model's explicit:

`expire`

transition with committed journal evidence.

The model does not need redesign.

### E3 — no effect on CLAIMED

Advance time beyond the deadline of an already `CLAIMED` permit.

It remains `CLAIMED`.

Its execution-uncertainty reservation remains unchanged.

No false expiry event is written for that permit.

### E4 — mutation/falsification

Add the minimum focused mutation or equivalent negative test showing that removal of the expiry-journal write is detected.

The test must fail if runtime expiry once again changes state without the evidence required by I5.

## Accepted implementation areas

Do not reopen the following merely for this remediation:

- one per-task TaskStore transaction boundary;
- TaskStore async callback awaiting;
- compare-and-set / one-writer discipline;
- immutable blob publication;
- prepare -> effect -> reconcile structure;
- one ACTIVE environment per task;
- AS99/AS100 execution-uncertainty semantics;
- late-report atomic supersession;
- exact-target claim / obligation resolution;
- Q1-Q5b architecture;
- Mutants A-C;
- closed production surface;
- deterministic S6 provenance projection;
- S6/S7 ownership boundary;
- D-069 real-driver separation.

## Carry-forward observation O1 — platform proof is Linux-only

The Builder supplied process-crash evidence for:

`Linux x86_64 / ext4`

only.

`darwin` and `win32` are `NOT RUN`, and the new store refuses them with `ISOLATION_CAPABILITY_MISSING`.

This is fail-closed and is not an AS102-F001 remediation item.

However, RFC-019 §16 still declares Linux/macOS/Windows V1 profiles, while §13.2 requires the chosen envelope backend's required atomicity to be proven before relying on it.

Therefore the current evidence establishes a Linux-profile hardened implementation only.

No S6 integrated Stage Gate or closure may claim macOS/Windows conformance from this evidence.

Before closure, either:

- obtain the required platform evidence; or
- make a separately governed platform/backend design decision.

The Builder must not modify platform scope during AS102-F001 remediation.

## Carry-forward observation O2 — unattributable PENDING recovery escape is incomplete

RFC-019 §7.1.3 correctly requires an unattributable `PENDING` publication to block lifecycle mutation task-wide.

The implementation does that fail-closed.

The Builder also correctly disclosed that no explicit operator-recovery path for such an unattributable `PENDING` record was implemented.

RFC-019 says that, after fail-closed attribution, an explicit audited operator resolution remains possible, but it does not fully specify the transition/storage semantics for that exceptional recovery operation.

This omission does not weaken fail-closed safety in the current implementation, so it is not bundled into AS102-F001.

It remains an open S6 integrated-stage/closure concern.

Do not invent its semantics during the bounded AS102-F001 remediation.

## Evidence disposition

The Architect independently inspected source and design correspondence.

The following Builder claims remain `ACTOR_REPORTED` because this review session did not independently execute them:

- transaction-substrate SIGKILL results;
- 50,032-state / 120,722-transition bounded-model run;
- depth-16 spot run;
- runtime Q1-Q5b replay;
- crash matrix;
- 48-mutant results;
- 847/847 full test result;
- validator exit codes.

Inspection does not silently upgrade those claims to `INDEPENDENTLY_REPRODUCED`.

The source-level AS102-F001 finding does not depend on those reported results.

## Scope

AS102-F001 remediation may modify only directly necessary:

- `devos/execution/host.mjs`;
- directly necessary journal/state helper code under `devos/execution/**` if required;
- directly necessary `tests/execution-*.test.mjs`;
- narrowly necessary fixed execution test fixtures;
- factual S6 README wording if required;
- deterministic traceability outputs if source references require regeneration;
- normal coordination STATE / CURRENT_HANDOFF return records.

No RFC architecture amendment is authorized.

No platform-support redesign is authorized.

No unattributable-PENDING recovery redesign is authorized.

## Return gate

After AS102-F001 is corrected:

TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 1
MAX_REMEDIATION_CYCLES: 2

Return a fresh bounded handoff with:

- exact starting and ending SHA;
- exact changed files;
- focused expiry-journal tests;
- mutation/falsification result;
- full relevant S6 regression result;
- repository regressions/validators;
- confirmation that O1 and O2 were not silently changed;
- confirmation no real execution driver or generic executor was introduced.

## Hard boundaries

No architecture redesign.
No real execution driver.
No generic command executor.
No S3/S4/S5 implementation mutation.
No S7+.
No S8/S9.
No CP-4+.
No Model Router.
No dynamic plugin discovery.
No remote D1/R2.
No production deployment.
No manifest closure.
No Sentinel version bump.
No protected/main merge.
No PR #10 merge or auto-merge.
No platform-scope rewrite in this remediation.

The suspended D-068 draft remains untouched.

## Routing

Route one bounded implementation-remediation cycle:

`TURN: CLAUDE`

`STATUS: CHANGES_REQUESTED`

`AUTHORIZED_SCOPE: D074_AS102_F001_S6_EXPIRY_JOURNAL_REMEDIATION_ONLY`

`ARCHITECT_ACTION_REQUIRED: NO`

`IMPLEMENTER_ACTION_REQUIRED: YES`

`PAULO_DECISION_REQUIRED: NO`

`CURRENT_REMEDIATION_CYCLE: 1`

`MAX_REMEDIATION_CYCLES: 2`

`CURRENT_HANDOFF: NONE`

All action-specific mutation / remote / deployment / main-merge flags remain `NO`.
