# Current Handoff — S6 Core Implementation (D-071)

```yaml
schema_version: 1
handoff_id: H-S6-CORE-IMPL-0001
cycle_id: SENTINEL_S6_CORE_IMPLEMENTATION
input_base_commit: db73a73fab022405d0882ec75f4f40a97cc5adea
review_target_commit: db73a73fab022405d0882ec75f4f40a97cc5adea
applicable_review_id: ML-DEVOS-AS-093
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. This is implementation in progress, not S6 closure: the manifest root is `NOT_IMPLEMENTED`, there is no `closure_ref`, and Sentinel stays at `v1.8.0`.

## Objective

Implement the bounded S6 core under `D-071` (scope `SENTINEL_S6_CORE_IMPLEMENTATION_D071_ONLY`, cycle 0 of 2), against `ML-DEVOS-RFC-019` as amended under `D-069`/`D-070` and approved by `ML-DEVOS-AS-093`. There is no generic executor and no real execution driver.

Provenance:
- Bootstrapped from the authoritative tip `db73a73` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). The tip was re-fetched and re-read before bookkeeping, and was unchanged.
- The work was written fresh in a clean worktree from `db73a73`. The suspended `D-068` draft stays untracked, uncommitted and unpushed in the primary checkout. It was not imported, altered or executed.
- No permission was expanded, and no safety control blocked or was worked around. Every bounded fixture operation ran normally.

## Changed files

Diff against base `db73a73fab022405d0882ec75f4f40a97cc5adea`.

**New: `devos/execution/`**
- **`vocabulary.mjs`:** the 30 ordered reason codes and precedence; roles; `canonicalS5Role` (BUILDER→Builder, QA→QA); the permit, RTR and instance state sets; the non-authority disclaimer.
- **`digest.mjs`:** `sha256` and canonical JSON.
- **`identity.mjs`:** the immutable Execution Identity and its digest, and the deterministic task-branch name. The Fencing Checkpoint advances only by a verified gap-free +1 (otherwise `INSTANCE_STALE`) and carries the S4 fencing checks.
- **`platform.mjs`:** platform profile detection and `profileFailures`. Windows V1 has no read-only liveness proof, so it fails `ISOLATION_CAPABILITY_MISSING`.
- **`paths.mjs`:**
  - segment rules and canonical forms;
  - the verified creation chain (§9.1) and exclusive file creation;
  - no-follow deletion that re-verifies every ancestor's identity immediately before each read or removal.
- **`journal.mjs`:** the hash-chained journal (`head_0`/`head_n` per §7.1.2) and replay with tamper detection.
- **`rtr.mjs`:**
  - the Result Transfer Record body;
  - the 9-member `ACTOR_REPORTED` payload;
  - stored-bytes `evidenceRef` with digest and round-trip checks;
  - RTR_PENDING adjacency proof.
- **`environment.mjs`:**
  - the allowlist environment with a deny-set backstop;
  - instance git/npm config with no credentials, unsigned commits and an empty hooks directory;
  - the local-config allowlist and the credential-name scan.
- **`git.mjs`:** the only `child_process` importer. It uses the fixed binary `"git"`, is not exported, and builds argv internally from literal subcommands.
- **`transport.mjs`:**
  - local-path remotes only, so network remotes fail `TRANSPORT_NOT_AUTHORIZED`;
  - own task branch only; no force, delete or tag;
  - `--force-with-lease` with a fast-forward check and read-back;
  - an S5 `github` decision on every call.
- **`liveness.mjs`:** a read-only group-liveness proof (`/proc` or signal-0). It never signals.
- **`registry.mjs`:** the host registry, with an exclusive lock that is never stolen, atomic writes, exclusive RTR and permit bodies, and exclusive request bindings.
- **`permits.mjs`:**
  - request and report contracts; `argv_digest`;
  - S5 issuance and claim verification (canonical intent, descriptor/policy pin, `s5_subject_binding`);
  - the immutable permit body.
- **`host.mjs`:** `createExecutionHost`, covering:
  - create, validate, attach and renewal adoption;
  - permit request, claim and report;
  - quiesce, complete (publication), finish without publication, and cleanup;
  - recover and provenance.

  It has no `run`/`spawn`/shell API.
- **`index.mjs`:** the public exports (no git runner, no execution verb).
- **`README.md`:** status and boundaries.
- **Five schemas:** `execution-identity`, `execution-request`, `execution-permit`, `execution-report`, `publication-evidence-ref` (`.schema.json`).

**New: tests and fixtures**
- `tests/execution-{core,permits,lifecycle,recovery,mutation}.test.mjs`.
- `tests/fixtures/execution/`:
  - `harness.mjs`: local bare remote, temporary S4 store, real public S5 `createGateway()`, controllable trusted host;
  - `drivers.mjs`: a fake driver that executes nothing, and a **closed** fixed-operation table with literal argv;
  - `long-lived-child.mjs`: a fixed idle process;
  - `crash-worker.mjs`: a fixed worker that SIGKILLs itself at one of a closed set of named steps.

**Modified**
- `devos/devos-manifest.json`: exactly the approved root entry `{ "path": "devos/execution/", "owning_phase": "S6", "consuming_phases": ["S7","S8"], "status": "NOT_IMPLEMENTED", "executable_runtime_present": false }`, inserted after the S5 root. There is no `closure_ref` and no version change. `tests/devos-manifest.test.mjs` was **not** changed, because it passes as is.
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`: one factual *Implementation status (`D-071`)* paragraph. There is no design change and no closure claim.
- `devos/changes/rfcs/README.md`: one factual sentence on the RFC-019 entry.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`: regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S6-EXECBOUNDARY-REM3-0001` was already archived byte-identical by the Architect (verified with `cmp`).

Not changed: any S3/S4/S5 source, interface, schema or policy semantics; any ADR, closure record or version; any other subsystem.

## Execution boundary (D-069 / D-071)

- **S6 core** exposes no `run()`, `spawn()`, shell bridge or caller-argv executor. `tests/execution-core.test.mjs` asserts these properties from the source:
  - no public export starts with an execution verb;
  - `git.mjs` is the only `child_process` importer and is not exported;
  - it uses a fixed `GIT_BINARY = "git"` and has no `spawn`/`exec(`/`shell: true`;
  - no module sends signals.
- **Actor/tool commands are data.** An Execution Request's argv is bound only by `argv_digest`, and S6 never executes it.
- **Test-only processes:**
  - the fixed fixture operations (literal `git add -A`, `git commit` with a literal message, and `node long-lived-child.mjs`), looked up by name from a closed table;
  - the crash worker (closed operation and crash-point sets);
  - `node --test` on this repository's own test files inside a temporary copy (mutation suite).

  None accepts a caller-supplied command.
- **Disclosed for review:** `harness.fixtureGit(args, opts)` is a test-*setup* helper. It has a fixed `git` binary, is used only to build and inspect fixture repositories, and is called with literal subcommands from checked-in tests. It is not reachable from S6 core or from either driver. The Builder judges it outside the "driver" prohibition, but it does accept args. If the Architect disagrees, it can be narrowed to a closed table.
- **No real execution driver** and no live S6 remote transport were introduced. All transport ran against local bare repositories, with no credentials and no network writes.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session in the clean worktree, run with Node `v22.22.2` and git `2.43.0` on Linux `6.18.44` x86_64.

| Check | Result | Exit |
|---|---|---|
| `node --test tests/execution-core.test.mjs` | 21/21 pass | 0 |
| `node --test tests/execution-permits.test.mjs` | 12/12 pass | 0 |
| `node --test tests/execution-lifecycle.test.mjs` | 43/43 pass | 0 |
| `node --test tests/execution-recovery.test.mjs` | 12/12 pass | 0 |
| `node --test tests/execution-mutation.test.mjs` | 17/17 pass (15 mutants killed, plus anchor check and control) | 0 |
| `npm test` | 711 tests, 711 pass, 0 fail (606 existing + 105 new) | 0 |
| `node --test tests/devos-manifest.test.mjs` | 23/23 pass (unchanged file) | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | all 13 example files behaved as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | 4/4 OK | 0 |
| `git diff --check` (including new files) | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | see below | 1 |

**Traceability.**
- **Base `db73a73`:** 360 files / 2 errors / 15 warnings / 309 definitions / `DRIFT`.
- **After:** 390 files / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / **14** warnings / 309 definitions / `No drift`. It exits `1`, the convention while any ERROR exists.
- The only warning change is that `orphan-no-inbound-reference D-071` cleared. No warning was added.

**Coverage against RFC-019 §18 and D-071's required evidence:**
- **Permits (§13.1):**
  - exact replay with no S5 call; conflicting replay → `MALFORMED_REQUEST`; one request → one permit;
  - an 8-way concurrent same-`request_id` race (**in-process**) mints one permit, and the losers replay or fail closed;
  - `ISSUED` → `EXPIRED_UNCLAIMED`; a `CLAIMED` permit never becomes safe by time, blocks quiesce, and is released only by a verified report;
  - single use; argv and `request_id` mismatch at claim;
  - claim-time S5 recheck: live revocation, descriptor expiry, policy supersession under the pinned version, and trusted-source failure (revocations, clock, identity). Each leaves the permit `REVOKED`/`CAPABILITY_INVALIDATED`;
  - subject binding: wrong `actor_id`, and wrong `actor_role` with a real `ALLOW`, at issuance and at claim; `BUILDER`→`Builder` and `QA`→`QA` succeed;
  - seven forged/substituted `ALLOW` shapes, plus a descriptor swap at claim → `CAPABILITY_DENIED`, with no permit minted;
  - fencing re-checked at claim;
  - report mismatches (argv/env digest, pgid, extra field, second report, report for an unclaimed permit);
  - claimed-then-crash → recovery quarantines with `QUIESCE_UNPROVEN`; a late report is evidence only and never un-quarantines;
  - an unexplained change → `DIRTY_WORKTREE`, while a reported change is accepted.
- **Lifecycle:**
  - the happy path. S4 history holds **exactly** the stored `evidenceRef` bytes: the 9 members in order, `ACTOR_REPORTED`.
  - the non-circular prepublication digest equals `RTR_PENDING.prev_head`, with `PUSH_VERIFIED` immediately before it. The remote task branch holds the result, and `main` is untouched.
  - provenance outputs; cleanup; the outside sentinel survives.
  - host credential canaries are absent from the instance environment; instance commits are unsigned, carry the instance author, and no hooks exist.
  - QA reconstruction from the committed record's exact SHA, even after the remote task branch is force-moved. QA subject role binding; a live reported group blocks quiesce; QA cannot publish; `finishWithoutPublication` makes no S4 change.
  - QA source proof: incomplete chain (fencing), gapped origin, foreign mutation, altered body, self-review.
  - gap-free checkpoint adoption.
  - S4 rejection after `PENDING` → RTR `ABORTED`, journal `RTR_ABORTED`/`STALE_UNPUBLISHED`, instance stale, and S4 still `BUILDING`.
  - multi-failure validation selects the lowest rank.
- **Reason-code matrix:** all 30 codes are produced, one scenario each. Twenty-nine run through the public host API. `WORKTREE_COLLISION`, a 128-bit instance-id collision, is forced at the path-creation layer the host uses.
- **Also covered:** prohibited path inside an allowed prefix (no push); denied push (`CAPABILITY_DENIED`, no push, no RTR, S4 unchanged); quarantined-instance restrictions.
- **Recovery:**
  - thrown crashes after push, after `PENDING` and after the S4 transition all reconcile to exactly one `READY_FOR_QA` transition. After-transition replay uses S4 idempotency with the same bytes;
  - an altered body and broken journal adjacency are never replayed;
  - **real SIGKILL** of a publishing process at `after-push`, `after-pending` and `after-transition` → a fresh host recovers to exactly one publication, and no S6 lock is left;
  - real SIGKILL during create → `CREATING` → quarantined `INCOMPLETE_CREATE`, never adopted;
  - orphan directories are reported and never adopted or deleted; a missing directory is quarantined;
  - a held (24h-old) lock is never stolen;
  - a stale instance is quarantined, and its `ISSUED` permits are revoked (`QUARANTINE`).
- **Core:**
  - vocabulary and precedence; role mapping; identity and checkpoint;
  - path segments and canonical forms; verified creation and link detection;
  - no-follow deletion (absolute, relative, looping and dangling links; TOCTOU directory swap; injected unlink failure);
  - journal tamper; payload and adjacency;
  - environment deny/PATH/case-duplicate rules; config allowlist; credential scan;
  - transport policy; platform profiles; liveness;
  - issuance and claim verification; request/report contracts; schemas match the builders.
- **Mutation (15 mutants, each killed by a failing assertion; the unmutated control passes):**
  - removing the claim-time S5 recheck;
  - removing the subject-role binding;
  - letting a claimed permit expire;
  - quiesce ignoring claimed permits;
  - unchecked report digests;
  - a wrong prepublication digest;
  - an upgraded evidence class;
  - no fencing-revision check;
  - no QA independence;
  - no scope check;
  - an inherited host environment;
  - network transport allowed;
  - an unchecked journal chain;
  - inverted precedence;
  - deletion following substituted directories.

**Defects found and fixed during this cycle** (by the Builder's own tests, before handoff):
1. **No-follow deletion TOCTOU.** A directory swapped for a link after it was listed could route a path-based unlink outside the tree, and the test's outside sentinel was deleted. Now every ancestor is re-verified (not a link, same dev/ino) before each read, unlink or rmdir, and substitution → `CLEANUP_CONTAMINATION_RISK`. Mutant M15 guards it.
2. **Misleading platform code on an invalid root.** The filesystem probe ran with no directory and reported `ISOLATION_CAPABILITY_MISSING` instead of `WORKSPACE_ROOT_INVALID`. The probe now runs, and is cached, only inside a valid root; with an invalid root only the probe-independent checks apply.
3. **Fault hooks were not awaited.** The test-only `faults.onStep` hooks were not awaited (an async hook raced the S4 lock). They are now awaited.

## Platform matrix (honest)

| Platform | Status |
|---|---|
| Linux x86_64 (kernel 6.18.44, Node v22.22.2, git 2.43.0, `/proc` liveness) | **RUN** — all results above |
| macOS (signal-0 liveness) | **NOT RUN** |
| Windows | **NOT RUN**. By design V1 fails closed `ISOLATION_CAPABILITY_MISSING` (no read-only Job Object inspection); the Windows path rules are unit-tested on Linux only. |

## Unresolved findings and limitations

- **Concurrency evidence is in-process only.** Cross-process mutual exclusion rests on the exclusive-create registry lock, which fails closed and is never stolen. It was tested as held-lock behavior, not with a multi-process race.
- **Residual deletion race.** Node exposes no `unlinkat`/`openat`, so a race narrower than one `lstat`/`unlink` pair remains after ancestor re-verification. This is disclosed in the `paths.mjs` comment and falls under RFC-019's residual risks.
- **The S6 host is trusted**, and the RTR is host-held (RFC-019 residual risks 8 and 9). The S5 subject binding trusts the S5 host's attested subject.
- **Torn journal tail.** Each journal append is fsynced, and registry and RTR bodies are written atomically or exclusively. A host crash in the middle of a single append could still leave a torn last line; replay then fails closed (`ISOLATION_UNPROVABLE`) and does not repair it. That case was not separately fault-injected.
- **`harness.fixtureGit`**: see *Execution boundary* above.
- **Open RFC-019 Unresolved questions 1–8 are unchanged**, including question 7 (where the driver lives) and question 8 (whether fixed internal git calls suit a runtime's safety controls). No safety control objected to them in this session.
- **Obligations:** every `coordination/OPERATIVE_OBLIGATIONS.md` row is carried forward unchanged. None is closed by `D-071`.

## Governing references

- Authority: `D-071`; `D-070`; `D-069`; `D-068` (suspended, not revived); `D-066`.
- Reviews: `ML-DEVOS-AS-093` (approval of the amended design), `ML-DEVOS-AS-092`, `ML-DEVOS-AS-091`, `ML-DEVOS-AS-090`, `ML-DEVOS-AS-089`.
- Design: `ML-DEVOS-RFC-019`. Closure mechanism: `ML-DEVOS-RFC-015` (D.1/D.2). S5: `ML-DEVOS-RFC-017`/`ML-DEVOS-ADR-015`. S4: `ML-DEVOS-ADR-014`. S3: `ML-DEVOS-ADR-013`.
- Protocol: `ML-DEVOS-RFC-018`.

## Evidence locations

- The commit diff against `db73a73fab022405d0882ec75f4f40a97cc5adea`.
- `devos/execution/` (sources, schemas, README) and `tests/execution-*.test.mjs` with `tests/fixtures/execution/`.
- `devos/devos-manifest.json` (S6 root entry).
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.

## Next action

The Architect independently inspects and reproduces this implementation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-093`, and archives `H-S6-CORE-IMPL-0001` if its routing deselects this handoff. S6 closure (`IMPLEMENTED`, `closure_ref`, closure ADR, version) remains separately gated and is not requested here. No further Builder action is authorized.
