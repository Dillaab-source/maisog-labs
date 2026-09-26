# Current Handoff — RFC-019 Integrity-Hardening Amendment (D-073, AS-098)

```yaml
schema_version: 1
handoff_id: H-S6-INTEGRITY-RFC-DRAFT-0001
cycle_id: SENTINEL_S6_INTEGRITY_HARDENING_RFC
input_base_commit: 82c8d59523094facbc5eb5230ef2e3911a1a5619
review_target_commit: 82c8d59523094facbc5eb5230ef2e3911a1a5619
applicable_review_id: ML-DEVOS-AS-098
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this amendment. It is design only; S6 implementation stays paused.

## Objective

Draft the RFC-019 integrity-hardening amendment required by `ML-DEVOS-AS-098`, under `D-073` (scope `D073_RFC019_INTEGRITY_HARDENING_AMENDMENT_DRAFT_ONLY`). The amendment gives S6 one coherent durable-transaction and crash model before any further implementation. It amends the affected normative sections in place and supersedes the contradictory earlier text; it does not append the review verbatim.

Provenance:
- Bootstrapped from the authoritative tip `82c8d59` (STATE `TURN: CLAUDE` / `STATUS: AUTHORIZED`). The tip was re-fetched before verification and was unchanged.
- Inputs read: STATE; `ML-DEVOS-AS-098`; the inbound planning handoff `H-S6-INTEGRITY-RFC-0001`; the full current RFC-019.
- The work was done in the clean worktree. The suspended `D-068` draft in the primary checkout was not touched.
- No permission was expanded, and no safety control was worked around.

## AS-098 requirement → RFC section map

| AS-098 | Requirement | Where in the amended RFC-019 |
|---|---|---|
| **A** | One local transactional truth boundary | **New §13.2** (task store; six transaction rules; linearization points; durability scope; minimal V1 candidate with a stop-and-return rule; "supersedes" list). Also: §7.1 fields and step 2; §7.1.2 steps 3–4; §9 layout; §13 table and concurrency (*S6 records*); §13.1 steps 2–3 and request binding. |
| **B** | Prepare → effect → reconcile | **New §13.3** (the four-step rule; per-effect table for create/clone, Git push, S4 publication, cleanup and driver execution; open-reservation table generalizing `D-072`; definitive S4 refusal list). Also: §7.1 step 5; §13 *create/complete/cleanup* rows; §15 push and S4 idempotency. |
| **C** | One ACTIVE S6 environment per task | **New §13.4** (definition of ACTIVE, the slot committed first, retry/concurrency, release, history, roles). Also: §2 T10; §8 S4 bullet; §13 *create* row and concurrency bullet; §14 row 19 (`WORKTREE_COLLISION`); §15 create idempotency. |
| **D** | Atomic report / liveness registration | **§13.1 step 5** (one transaction: `CLAIMED → REPORTED`, report reference and fields, every process group as a liveness obligation, tree snapshot, `REPORT` entry; no commit means still `CLAIMED`). Also: §13 *record* row; §13.1 *Recovery* bullet (late report = evidence only); §13.6 I3. |
| **E** | Fail-closed `PENDING` attribution | **New §7.1.3** (four proofs before attribution; task-scoped `RESULT_TRANSFER_UNPROVEN`; why the transaction model removes ordinary-crash prefixes). Also: §14 row 13; §15 recovery step 2; §18 item 9 attribution tests; §13.6 I10. |
| **F** | No mutable store in the public surface | **New §13.5**. Also: §13.1 *What each side may not do*; §18 item 14 source-level test. |
| **G** | Provenance as projection; S7 boundary | **§17 rewritten** (deterministic projection of committed history plus proven blobs; optional derived snapshot; projected fact list; explicit "S6 does not own" list; classification unchanged). Also: Non-goals; Unresolved question 10. |
| **H** | S4 receipt trust boundary | **§3.1** new *Trusted control-plane input* bullet. Also: §8 S4 bullet; §13 *create* row; Residual risk 17. |
| **I** | Complete crash/interleaving matrix | **§18 new item 15** (a `PRE → COMMIT → EFFECT → RECONCILE → POST` table for 14 operations, with forbidden outcomes; per-boundary obligations; process-crash vs power-loss wording). Also: §18 items 2, 3, 9 and 12 updated. |
| **J** | Lightweight reference model | **New §13.6** (model scope; invariants I1–I10; bounded exhaustive generation; replay against the implementation; TLA+ only on need). Also: §18 new item 16. |
| — | Alternatives | **New §20.1** (the four store options with verdicts: multi-file registry rejected; envelope + blobs preferred; SQLite viable fallback, not mandated; event sourcing rejected). |
| — | Exit condition | **New *Integrity-hardening exit condition (anti-bloat)*** section. Also summary decisions 11–15, rollout sequence and Non-goals. |

**Required-section coverage** (AS-098 names §3, §7, §8, §13, §15, §17, §18 and §20):
- §3 → §3.1;
- §7 → §7.1, §7.1.2, §7.1.3;
- §8 → S4 bullets;
- §13 → table, concurrency, §13.1–§13.6;
- §15 → rewritten;
- §17 → rewritten;
- §18 → items 2, 3, 9, 12, 14, 15, 16;
- §20 → §20.1.

**Also updated:** §2 T10; §9 layout; §14 rows 13, 19 and 30 (no new reason code: still 30); the header amendment note; Evidence requirements; Architect Sync and Paulo decision requirements; Residual risks 15–19; Unresolved questions 9–10.

**Contradictions removed.** Each of these was superseded explicitly in §13.2 or rewritten in place:
- the separate RTR body file and "status part";
- "temp-then-rename" RTR writes;
- the "exclusive create in the same step" request binding;
- the per-record registry note;
- "S4 single ownership means at most one instance";
- the S4 publication call "under its registry lock" (§7.1 step 4 now says outside the lock, converging through S4 idempotency);
- "revoke first, then prove" in quiesce (§13.1 step 6 and the permit table now commit revocations with `QUIESCED`).

**Preserved (not reopened):**
- the `D-069` driver separation;
- `AS90-F001`–`F003`, `AS91-F001` and `AS92-F001`;
- the RTR payload contract and the non-circular order (§7.1.1, §7.1.2);
- the `AS94`–`AS96` properties, which are now stated as design rules (claim linearization, crash-atomic minting, closed Git operations, the complete report, one linearization discipline, quiesce fencing, the publication reservation).

**Design choices the Architect should check:**
1. A `QUARANTINED` instance is ACTIVE only while it holds a `PENDING` publication. This matches AS-098's "including unresolved publication reservation" while keeping the existing rule that a quarantined claimed-but-unreported instance does not block a new instance.
2. The active-slot conflict reuses `WORKTREE_COLLISION` rather than adding a 31st reason code.
3. A prepared push and a prepared cleanup block with `ISOLATION_UNPROVABLE`.
4. Quiesce's revocations commit with `QUIESCED` under the lock held across the liveness proof. Previously revocation happened first.

## Changed files

Diff against base `82c8d59523094facbc5eb5230ef2e3911a1a5619`:
- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`: the amendment described above.
- `devos/changes/rfcs/README.md`: one factual sentence on the RFC-019 entry (implementation paused under `D-073`; amended per AS-098; design only).
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}`: regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file, replacing the inbound planning handoff `H-S6-INTEGRITY-RFC-0001`).
- `coordination/archive/handoffs/H-S6-INTEGRITY-RFC-0001.{md,provenance.json}` and the archive `README.md` row: the outgoing inbound handoff archived byte-identical, via the checker's own `archiveHandoff()`.

**No executable S6 or S7 file changed.** No file under `devos/execution/**`, no test, no fixture, no S3/S4/S5 source, interface or schema, no manifest, ADR, version or S7 file.

## Tests and evidence

All results are `ACTOR_REPORTED`, fresh from this session in the clean worktree.

| Check | Result | Exit |
|---|---|---|
| `npm test` | 784 tests, 784 pass, 0 fail (no code changed) | 0 |
| `validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-capability-policy.mjs` | all 13 example files as expected | 0 |
| `validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `validate-waivers.mjs` | no waiver files (expected) | 0 |
| `validate-claude-skills-bridge.mjs` | 4/4 OK | 0 |
| `git diff --check` | clean | 0 |
| `generate-traceability.mjs` | regenerated | 0 |
| `validate-traceability.mjs` | see below | 1 |

**Traceability.**
- **Base `82c8d59`:** 405 files / 2 errors / 14 warnings / 316 definitions / `DRIFT` (stale generated index at base).
- **After:** 407 files (the two new archive files) / **2** errors (`CORE-022`, `WEB-REQ-009` — known debt, preserved and not suppressed) / **14** warnings / 316 definitions / `No drift`. It exits `1`, the convention while any ERROR exists. The ERROR/WARNING set is identical to the base.

## Unresolved findings and limitations

- **Design only.** No transaction store, reference model or crash matrix exists yet in code. The implementation at `1bf18ef` predates this model; its multi-file registry is superseded. Implementation needs a fresh Paulo decision after Architect review.
- **Backend open.** The minimal envelope's whole-file replace-atomicity is unproven on Windows. The RFC requires proof before reliance, and a stop-and-return for a backend decision otherwise (Unresolved question 9). SQLite is documented as the fallback, not mandated.
- **Trusted control plane.** S4 results remain trusted control-plane input; no signed receipts (Residual risk 17).
- **Carried forward, unchanged:** RFC-019 Unresolved questions 1–8; the S7 Input Integrity requirement (an S7 design input); every `coordination/OPERATIVE_OBLIGATIONS.md` row, none closed.

## Governing references

- Authority: `D-073` (design only); `D-072`, `D-071` (implementation history); `D-069`; `D-066`.
- Reviews: `ML-DEVOS-AS-098` (controlling), `ML-DEVOS-AS-097`, `ML-DEVOS-AS-096`, `ML-DEVOS-AS-095`, `ML-DEVOS-AS-094`, `ML-DEVOS-AS-093`.
- Design: `ML-DEVOS-RFC-019`. Closure mechanism: `ML-DEVOS-RFC-015`. Protocol: `ML-DEVOS-RFC-018`.
- Roadmap: `ML-DEVOS-ARCH-001`, `ML-DEVOS-SIP-001`.

## Evidence locations

- The commit diff against `82c8d59523094facbc5eb5230ef2e3911a1a5619`.
- RFC-019: header amendment note; §7.1.3; §13.2–§13.6; §17; §18 items 15–16; §20.1; *Integrity-hardening exit condition*.

## Next action

The Architect independently reviews the amendment under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-098`, and archives this handoff if its routing deselects it. Any implementation requires a fresh Paulo decision after that review. No further Builder action is authorized.
