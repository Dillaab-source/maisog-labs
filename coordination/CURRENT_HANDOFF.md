# Current Handoff — RFC-023 / V2.1 Cycle B (D-128)

```yaml
schema_version: 1
handoff_id: H-DEVOS-RFC023-CYCLE-B-0001
cycle_id: MAISOGLABS_DEVOS_RFC023_V21_CYCLE_B
input_base_commit: 140f58710de6067e0102967a5a1ff6e8ed4ce6e5
review_target_commit: 140f58710de6067e0102967a5a1ff6e8ed4ce6e5
applicable_review_id: ML-DEVOS-AS-155
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result below is `ACTOR_REPORTED` (Builder-run, cloud container, hermetic fixtures); none is Architect-reproduced.

## Objective

Under `DIR-DEVOS-RFC023-CYCLE-B-0001` (D-128), implement `ML-DEVOS-RFC-023` BC-12 (the attempt-ledger logical publication chain) and BC-10 (the RFC lifecycle-projection checks) with their tests, and apply the AS-155 §6a one-sentence reconciliation. No other change.

## Changed files

**Issue commit `140f587` (parent `1e5a8a5`):** `brain/DECISION_LOG.md` (D-128: structured entry plus verbatim owner text), `coordination/CURRENT_DIRECTIVE.md`, `coordination/STATE.md`. New cycle; `CURRENT_REMEDIATION_CYCLE: 0`.

**This return commit:**
- `scripts/check-context-bootstrap.mjs` (B1):
  - **`AttemptLedger`:** `record(…, chain)` stores chain metadata when an entry is created. New `chainKey({cycleId, parent, targetTurn})` and `settle(key, {code, continueOn})`.
  - **`publishCandidate`:** accepts `chain` and settles every counted attempt. On the push-rejection path it now also reads back the tip to record `continue_on`; the returned code is unchanged.
  - **New exported `publicationKey()`**, used by `runPublish`: an explicit `--transition-id` is a flat counter, otherwise the key is the chain key.
  - Unchanged: `MAX_PUBLICATION_ATTEMPTS = 3`, `reconcile()`, `publishWithRetries()`.
- `tests/context-bootstrap.test.mjs`: 9 new tests (BC-12 cases 1–8 plus the chain boundary).
- `devos/governance/traceability/validate-traceability.mjs` (B2): new exported pure `validateRfcProjection(root)` with its constants, reported by `validate()` and the CLI. It is separate from the generator report, so the generated index and `generate-traceability.mjs` are untouched.
- `tests/traceability.test.mjs`: 11 new tests (BC-10 cases 1–10 plus a byte check of the canonical line against the D-128 text).
- `brain/protocols/CONTEXT_BOOTSTRAP.md` (B3): §6a, one sentence. The Architect authors; publication is by the Architect once `OBL-012` is satisfied, otherwise mechanically by the Builder or Paulo, with the exact bytes, through CAS (BC-4).
- Directive archive (entry, provenance, index row); STATE; this handoff.

**Not changed:** `tests/context-bootstrap-v2.test.mjs` (not needed), `generate-traceability.mjs`, generated traceability output, `coordination/OPERATIVE_OBLIGATIONS.md` (carried forward unchanged), the RFC index and bodies, the local ledger file, and product, production or website files.

## Tests and evidence

**Suites (after / before):**

| Suite | After | Before |
|---|---|---|
| `context-bootstrap` | 65/65 | 56 |
| `context-bootstrap-v2` | 46/46 | unchanged |
| `traceability` | 25/25 | 14 |
| `skills` | 40/40 | — |
| Full `npm test` | 643/655 | — |

The 12 full-suite failures are the same dependency-only files as in Cycle A (`Cannot find package 'wrangler'`/`'jose'`: Worker/D1 suites, no `node_modules` in this container).

**BC-12 (`tests/context-bootstrap.test.mjs`, real hermetic git):**

| Case | Result |
|---|---|
| (1) D-112 regression | Four sequential PUBLISHED transitions in one cycle, no handoff, target CLAUDE: four distinct chain keys, each attempt 1. Same scenario with the pre-Cycle-B key `CYCLE_B:NONE:CLAUDE` → `PUBLISHED, PUBLISHED, PUBLISHED, PUBLICATION_ATTEMPTS_EXHAUSTED`. |
| (2) three BRANCH_ADVANCED | Across rebuilt candidates and fresh `AttemptLedger` instances: the same key, attempts 1/2/3, `continue_on` = the rival tip. The fourth attempt is refused with `PUBLICATION_ATTEMPTS_EXHAUSTED`, 0 pushes. |
| (3) NOT_PUBLISHED | Two NOT_PUBLISHED retries on the same key (attempt 2), then PUBLISHED as attempt 3 on that key. |
| (4) UNKNOWN_OUTCOME | 1 push; entry `last_result: UNKNOWN_OUTCOME`, `continue_on: null`, not terminated. `publishWithRetries` also stops after 1 push. |
| (5) separate process | A separate `node` process reading the same ledger resolves the same key with `attempts: 2`; the next attempt is 3. |
| (6) `--transition-id` | `publicationKey` returns the override with no chain; the entry has no `chain` field. |
| (7) old-format key | A pre-seeded old-format key with attempts 3 is byte-unchanged and still exhausted. The new default key differs and publishes as attempt 1. |
| (8) PUBLISHED | Terminates the chain (`terminated: true`, `continue_on: null`); the next transition gets a new key, attempt 1. |
| Boundary | `continue_on` is followed only for the exact parent + CYCLE_ID + target turn. A different parent, turn or cycle, or a terminated chain, gives a fresh key. |

**Ledger entry shape and example chain** (scratch run with the real module on a hermetic remote; hashes shortened):

```
attempt 1: parent=f04abf6… key=CYCLE_B:f04abf6…:ARCHITECT -> BRANCH_ADVANCED (attempt 1)
attempt 2: parent=21c4337… key=CYCLE_B:f04abf6…:ARCHITECT -> PUBLISHED (attempt 2)   # continued via continue_on=21c4337…
attempt 3: parent=44faf3e… key=CYCLE_B:44faf3e…:ARCHITECT -> PUBLISHED (attempt 1)   # fresh chain after PUBLISHED
"CYCLE_B:f04abf6…:ARCHITECT": { "attempts": 2, "outcomes": ["started","started"],
  "chain": { "cycle_id": "CYCLE_B", "origin_parent": "f04abf6…", "target_turn": "ARCHITECT",
             "continue_on": null, "terminated": true }, "last_result": "PUBLISHED" }
```

**BC-10 (`tests/traceability.test.mjs`, temp-directory fixtures):**

| Case | Result |
|---|---|
| (1) | `RFC_INDEX_ROW_MISSING` |
| (2) | `RFC_INDEX_ROW_ORPHAN` |
| (3) | `RFC_INDEX_ROW_DUPLICATE` |
| (4) | WARNING `RFC_STATUS_PROJECTION_STALE` (newer D-003 and AS-002), no errors |
| (5) | `RFC_BODY_STATUS_NONCANONICAL` for old prose and for a trailing space. A CRLF body reports `RFC_BODY_STATUS_MISSING_OR_MISPLACED` (the CR breaks blank line 2 first); still an ERROR. |
| (6) | `RFC_BODY_STATUS_MISSING_OR_MISPLACED` (missing; at line 5) |
| (7) | `RFC_BODY_STATUS_DUPLICATE` |
| (8) | `RFC_STATUS_VOCABULARY` |
| (9) | `RFC_AUTHORITY_REF_UNRESOLVED` (`D-099`, `ML-DEVOS-AS-050`, `PR #7`) |
| (10) | Valid fixture: 0 errors, 0 warnings |

**Live tree, RFC projection:** 23 RFC files, 23 rows, **0 errors**, 16 heuristic `RFC_STATUS_PROJECTION_STALE` warnings: RFC-001–007, 013–017 and 020–023. Examples:
- RFC-023 is cited by D-128, AS-154 and AS-155.
- RFC-020 is cited by D-082, AS-111 and AS-112.
- RFC-022 is cited by D-106 and D-107.

**Global traceability, Cycle A baseline → after:**
- Errors 3 → 3 (`CORE-022`, `D-000`, `WEB-REQ-009`).
- Warnings 13 → 13 (identical list).
- Generated-index `DRIFT` is pre-existing and was not regenerated.
- A transient `D-999` error from my own test fixture was caught and removed before commit.

**Checker:** issue candidate `140f587` passed `--check-only`, published (attempt 1), and the post-publish bootstrap passed. This return candidate: `--check-only` with every check ok before `--publish`. It is the first real publication under BC-12; its default key is `MAISOGLABS_DEVOS_RFC023_V21_CYCLE_B:140f5871…:ARCHITECT`.

**Manual changed-file inspection (`OBL-023`):** this return touches exactly the 5 B1–B3 files, `coordination/STATE.md`, this handoff, and the directive archive (entry, provenance, index README). No `generate-traceability.mjs`, index, RFC, obligation, product or workflow file is in the diff.

## Unresolved findings and limitations

1. **The stale heuristic is noisy on history.** It compares numbers only within families already present in a row, because Decision and Sync numbering are independent sequences. Many of the 16 live warnings come from later records that cite an RFC in passing. Some may be real projection lag worth a later index update, for example RFC-023's row not yet listing D-128/AS-154/AS-155, RFC-020 vs D-082, RFC-021 vs D-090, RFC-022 vs D-106/D-107. D-128 does not authorize editing `devos/changes/rfcs/README.md`, so the index is unchanged.
2. **Chain ambiguity (conservative).** While a chain is unfinished, a genuinely different transition built on exactly its `continue_on` tip, with the same CYCLE_ID and target turn, is counted on that chain. The design gives no mechanical way to tell it from a rebuild; `--transition-id` remains the explicit escape. It over-counts; it never under-counts.
3. **Additive behavior.** The push-rejection path makes one extra read-back to record `continue_on` (same return code). Ledger entries gain `last_result`, and chain entries gain a `chain` object. Existing entries are never rewritten, except that an entry used again gets its `last_result` updated.
4. **Lineage-scoped limit.** The fresh-clone / fresh-ledger bypass is unchanged and disclosed (§8). A fresh cloud container starts a new ledger lineage.
5. **Validator wiring.** BC-10 runs in the traceability validator CLI and `validate()`, not in the Context Bootstrap checker. RFC-projection errors now also set the validator's non-zero exit. The CLI was already non-zero from the pre-existing baseline errors and drift.
6. **Stale self-expiring wording.** `CONTEXT_BOOTSTRAP.md` §3 item 7 still describes the old default key "until … Cycle B implements BC-12". That sentence is self-expiring and was left untouched under D-128's §6a-only limit.

## Governing references

D-128; `ML-DEVOS-AS-155`; `ML-DEVOS-RFC-023` BC-4, BC-10, BC-12, §6; `DIR-DEVOS-RFC023-CYCLE-B-0001` (archived); `coordination/OPERATIVE_OBLIGATIONS.md` (`OBL-023`).

## Evidence locations

- Diffs: `git diff 1e5a8a5 140f587` (issue) and `git diff 140f587 <return commit>` (implementation).
- Commands: `node --test tests/context-bootstrap.test.mjs tests/context-bootstrap-v2.test.mjs tests/traceability.test.mjs tests/skills.test.mjs`; `node devos/governance/traceability/validate-traceability.mjs`; `node scripts/check-context-bootstrap.mjs --commit <sha> --session-protocol 2`.

## Next action

Architect review of Cycle B against D-128 and `ML-DEVOS-RFC-023` BC-10/BC-12. If Cycle B is accepted with no blocker, D-128 treats V2.1 as frozen, and product work (ClinicFlow) is the intended next priority.
