# Current Handoff — Bootstrap V0 Stage B Atomic Activation

```yaml
schema_version: 1
handoff_id: H-CBV0-0001
cycle_id: SENTINEL_CONTEXT_PLANE_BOOTSTRAP_V0_IMPLEMENTATION
input_base_commit: 487af93afa926f85755f0aa7ad9606ad31a92ed4
review_target_commit: 487af93afa926f85755f0aa7ad9606ad31a92ed4
applicable_review_id: ML-DEVOS-AS-080
```

This handoff is evidence, not authority. Routing, turn, scope, and flags live only in `coordination/STATE.md`.

## Objective

`D-062` Stage B, routed by `ML-DEVOS-AS-080`: one atomic activation of Context Bootstrap V0 in a single commit parented on the exact tip `487af93afa926f85755f0aa7ad9606ad31a92ed4`. The commit:

- adds `PROTOCOL_VERSION: 1` and the matching selector tuple to STATE;
- activates this CURRENT_HANDOFF and the reviewed obligation index;
- freezes `coordination/IMPLEMENTER_HANDOFF.md`;
- migrates every operative reader/writer named by RFC-018, canonical skills first and bridges regenerated;
- implements `OBL-022` (immutable review IDs) in the Architect-side writers;
- returns the turn to the Architect for the final implementation review.

## Changed files

Protocol activation:
- `coordination/STATE.md` — `PROTOCOL_VERSION: 1`; `CURRENT_HANDOFF: ACTIVE`, `HANDOFF_ID: H-CBV0-0001`, `REVIEW_TARGET_COMMIT: 487af93…`, `APPLICABLE_REVIEW_ID: ML-DEVOS-AS-080`; return gate `TURN: ARCHITECT` / `READY_FOR_ARCHITECT` / `RFC018_BOOTSTRAP_V0_FINAL_IMPLEMENTATION_REVIEW_ONLY`; all remote/deploy/main flags `NO`.
- `coordination/CURRENT_HANDOFF.md` (new) — this file.
- `coordination/OPERATIVE_OBLIGATIONS.md` — status `ACTIVE`; no row changed.
- `coordination/archive/handoffs/README.md` — status `ACTIVE`; no entries (there is no outgoing handoff at activation).
- `brain/protocols/CONTEXT_BOOTSTRAP.md` — status `ACTIVE`; frozen-blob rule (§6); Architect routing/deselect-archive rule (§6a); checker CLI incl. `--publish`/`--check-only` (§8).

Reader/writer migration:
- `CLAUDE.md` — the mandatory read set drops the legacy handoff and adds STATE (exact commit), CURRENT_HANDOFF, the obligation index, and the protocol. The Builder writes CURRENT_HANDOFF. The page now covers exact-tip bootstrap, stale-protocol stop, governed-vs-advisory gating, role-over-provider semantics, and provenance ≠ authority. The historical section notes that its handoff path, `3` cap, and file lists are superseded.
- `AGENTS.md` — one V0 bullet: STATE first, own-turn writes, advisory allowed, roles by decision, provenance ≠ authority, frozen legacy handoff.
- `coordination/README.md` — rewritten for V0: role positions, file/owner table with the frozen legacy blob, publication cycle, turn gating incl. advisory mode, CAS requirement. Review modes, verdict rules, and evidence rule are unchanged.
- `brain/00_HOME.md` — the mandatory read order is now the V0 packet; the registers moved to "Reference records". Roles are stated by position. `D-060`/Context Plane plan "current live cycle" wording is marked historical (`OBL-005`).
- `brain/PROJECT_GOVERNANCE.md` — roles table: "Assigned holder", with the Builder writing CURRENT_HANDOFF and the Architect minting a new Sync ID per revision; role-over-provider note.
- `brain/ARCHITECT_HANDOFF.md` — field meanings now map onto CURRENT_HANDOFF's required sections; the legacy file is frozen.
- `brain/protocols/ARCHITECT_SYNC.md` — the handoff input is CURRENT_HANDOFF. The Turn protocol section replaces the nonexistent STATE "State protocol" reference with the STATE header plus the protocol's §2. It adds exact-tip CAS publication, immutable new Sync ID per revision (`OBL-022`), deselect-archive, and advisory mode. The remediation cap now points at the live STATE value instead of `3`.
- `.agents/skills/architect-review-sync/SKILL.md`, `.agents/skills/implementation-handoff/SKILL.md`, `.agents/skills/project-orientation-state-recovery/SKILL.md` — canonical skills migrated first. They now cover the V0 inputs and outputs, the new Sync ID per revision, the deselect-archive rule, and CURRENT_HANDOFF authoring and publication via `--publish`. Orientation now reads from an exact snapshot, with a protocol-version check, provenance ≠ authority, and advisory mode.
- `.claude/skills/{architect-review-sync,implementation-handoff,project-orientation-state-recovery}/SKILL.md` — regenerated with `node scripts/generate-claude-skills-bridge.mjs`, never hand-edited.

Checker/tests:
- `scripts/check-context-bootstrap.mjs`:
  - `FROZEN_LEGACY_HANDOFF_BLOB` + `checkLegacyFrozen`;
  - `checkReviewTargetAtSnapshot` (the target is the parent of the commit that published the handoff);
  - active-mode snapshot checks (identity against the live review, packet sections, inventory, frozen blob, live Sync-ID immutability);
  - ACTIVE→NONE deselect requires an archive, with the duplicate-ID check limited to actual file replacement (a bug found by the new test);
  - `--publish` (clean worktree, single-parent candidate on the current tip, all transition checks, then the leased push with the attempt ledger) and `--check-only`.
- `tests/context-bootstrap.test.mjs` — +6 tests:
  - deselect archive;
  - frozen blob;
  - end-to-end activation through `--check-only` then `--publish` on a real bare remote, then status incl. a stale-session stop;
  - activation that also appends to the legacy file is refused, with no push;
  - a wrong review target or a stale parent is refused, with no push;
  - no protocol marker means no governed publication.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.

Not changed: `coordination/IMPLEMENTER_HANDOFF.md`, `coordination/ARCHITECT_REVIEW.md` (live `ML-DEVOS-AS-080`, byte-identical to its archive), `tests/skills.test.mjs`, and any product/runtime file.

## Tests and evidence

All results are ACTOR_REPORTED. Commands were run on the candidate tree at input base `487af93`, with dependencies installed via `npm ci` from the lockfile.

- `node --test tests/context-bootstrap.test.mjs tests/skills.test.mjs` → 96 tests, 96 pass, 0 fail (56 Context Bootstrap + 40 skills). Exit `0`.
- `node scripts/generate-claude-skills-bridge.mjs` → wrote 4 bridges, exit `0`. `node scripts/validate-claude-skills-bridge.mjs` → all 4 `OK … matches its canonical source`, exit `0`.
- `npm test` → 556 tests, 556 pass, 0 fail. Exit `0`.
- Traceability:
  - At base `487af93` the validator reported 284 files / 2 errors / 14 warnings / 285 definitions, with pre-existing DRIFT.
  - After this change, `generate-traceability.mjs` exited `0`, and `validate-traceability.mjs` reported 285 files / 2 errors (`CORE-022`, `WEB-REQ-009` — known debt, no new fingerprint) / 14 warnings / 285 definitions, `No drift`, exit `1` (the established convention while any ERROR exists).
- Frozen legacy handoff: `git rev-parse 487af93:coordination/IMPLEMENTER_HANDOFF.md` = `43eddba31695a567412c431ae3d1e4c9372cabdd` (526,469 bytes). Candidate blob: `43eddba31695a567412c431ae3d1e4c9372cabdd`, identical. The file is not in the changed-file set.
- Checker on the pre-final candidate `d4664dc9acf420a84b813692ddde4c311320dc55`. It has the same parent, and its content differs from the final activation commit only in this handoff's evidence text and the regenerated traceability index.
  - `--publish --check-only --candidate d4664dc…` → exit `0`, `CHECK_ONLY`. Checks passed: `REPOSITORY_OK`, `EXPECTED_TIP_MATCHES`, `WORKTREE_BOUNDED`, `PROTOCOL_VERSION_SUPPORTED`, `IDENTITY_BOUND` (review target = transition parent; applicable review = live `ML-DEVOS-AS-080`), `PACKET_REFERENCES_PRESENT`, `TRANSITION_COMPLETE`, `LEGACY_UNTOUCHED`, `LEGACY_HANDOFF_FROZEN`, `OBLIGATIONS_CARRIED_FORWARD`.
  - `--commit <pre-final candidate> --session-protocol 1` → every V0 check passes (`PROTOCOL_VERSION_SUPPORTED`, `IDENTITY_BOUND`, `REVIEW_TARGET_IS_PUBLICATION_PARENT`, `PACKET_REFERENCES_PRESENT`, `OBLIGATION_INVENTORY_WELL_FORMED`, `LEGACY_HANDOFF_FROZEN`, `LIVE_REVIEW_ID_IMMUTABLE`). The only failure is the expected `STALE_SNAPSHOT`, because an unpublished candidate is not yet the tip.
  - The same `--check-only` run is repeated on the final commit immediately before `--publish`, which reruns every check itself.
- Post-cutover startup read set (`--baseline` at `d4664dc…`; bytes measured, tokens estimated as bytes/4), compared with `CBV0-BASELINE-PRE-1`:
  - `CLAUDE.md` mandatory set: 11 files / 579,438 B → 13 files / 96,387 B (~24,097 est. tokens; −83% bytes).
  - `brain/00_HOME.md` read order: 16 files / 348,694 B → 9 files / 66,898 B.
  - Union of both sets: 20 files / 876,890 B → 14 files / 101,031 B (~25,258 est. tokens; −88% bytes).
  - The legacy handoff is mandatory in: `CLAUDE.md` → none.
  - Files repeated across both sets: 7 → 8.
  - Files that still mention the legacy handoff: 13. All such mentions label it frozen/historical, apart from the superseded Phase-1 section of `CLAUDE.md`.
  - These are repository measurements, not per-session behavior (`OBL-009`).
  - A first candidate (`e0c0538…`) had the "frozen" note inside `CLAUDE.md`'s required-read section, which the measurement counted as mandatory. The note was moved out before this candidate.
- Legacy-handoff references in operative readers: every remaining mention labels the file frozen/historical. `CLAUDE.md`'s preserved Phase-1 section still names it as the historical instruction, and is marked superseded.

## Unresolved findings and limitations

- **Governed publication:** this commit is published only via `node scripts/check-context-bootstrap.mjs --publish --candidate <sha>`, which uses exact-old-value CAS against `governance/maisoglabs-v0.1`. If the executing environment cannot do that, the candidate stays advisory and unpublished, per `ML-DEVOS-AS-080`.
- The Architect-side writer (GitHub-connected) has not yet demonstrated CAS publication (`OBL-012`). Until it does, it is advisory/read-only for governed writes under the protocol it now documents.
- `OBL-003`, `OBL-004`, `OBL-005`, and `OBL-022` are implemented by this commit but deliberately left `OPEN`. Closing them requires the Architect's independent acceptance, not Builder self-certification.
- Remaining controls are procedural:
  - the prepublication receipt is not cryptographic;
  - the attempt ledger is per-clone;
  - direct hand-edits or pushes outside the checker cannot be prevented (`CONTEXT_BOOTSTRAP.md` §8).
- Forged-authorization and hostile-evidence cases are covered only mechanically (`OBL-011`).
- Rollback has been exercised on fixtures, not on real V0 turns (`OBL-010`).
- `docs/SENTINEL_CONTEXT_PLANE_V1_PLAN.md` and `brain/DECISION_LOG.md` were outside the authorized surfaces. Their historical "live cycle" wording is historicalized from the operative entrypoints (`brain/00_HOME.md`, `CONTEXT_BOOTSTRAP.md`) rather than edited in place.

## Governing references

- Design: `ML-DEVOS-RFC-018`.
- Authority: `D-062`.
- Applicable review: `ML-DEVOS-AS-080`. Stage A reviews: `ML-DEVOS-AS-079`, `ML-DEVOS-AS-080`.
- Protocol: `brain/protocols/CONTEXT_BOOTSTRAP.md`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md` (`OBL-001`–`OBL-022`; row content unchanged by activation).

## Evidence locations

- The activation commit's diff against `487af93afa926f85755f0aa7ad9606ad31a92ed4`.
- `tests/context-bootstrap.test.mjs`, `tests/skills.test.mjs`, `scripts/check-context-bootstrap.mjs`.
- `node scripts/check-context-bootstrap.mjs --commit <activation sha> --session-protocol 1` reproduces the snapshot checks.
- `devos/governance/traceability/TRACEABILITY_INDEX.md`.
- Frozen history: `coordination/IMPLEMENTER_HANDOFF.md` at blob `43eddba31695a567412c431ae3d1e4c9372cabdd`.

## Next action

Architect: a `STAGE GATE REVIEW` (final implementation review) of Bootstrap V0 under `D-062`, published under the next unused immutable Sync ID after `ML-DEVOS-AS-080`. If that routing deselects this handoff, archive `H-CBV0-0001` in the same commit. No further Builder action is authorized.
