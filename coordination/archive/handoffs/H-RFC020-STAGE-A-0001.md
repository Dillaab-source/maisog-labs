# Current Handoff — RFC-020 Stage A Dual-Version Canonical Directive Protocol (D-079, AS-108)

```yaml
schema_version: 1
handoff_id: H-RFC020-STAGE-A-0001
cycle_id: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_STAGE_A_IMPLEMENTATION
input_base_commit: ce2829ab766c29d8c2fd846ec5dc763834a8a4f3
review_target_commit: ce2829ab766c29d8c2fd846ec5dc763834a8a4f3
applicable_review_id: ML-DEVOS-AS-108
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result below is `ACTOR_REPORTED`. It is returned through the existing **Protocol V1** handoff mechanism.

## Objective

Implement RFC-020 Stage A, the dual-version Canonical Directive protocol, under `D079_RFC020_STAGE_A_DUAL_VERSION_IMPLEMENTATION_ONLY`. The aim is to build and test the Protocol V2 `CURRENT_DIRECTIVE` machinery while live STATE stays `PROTOCOL_VERSION: 1`.

Provenance:
- **Implementation base:** `ce2829ab766c29d8c2fd846ec5dc763834a8a4f3`, the published D-079 owner transition. Its sole parent is `257bdc7` (AS-108/RFC-020).
- **Result / return-transition SHA:** the commit that publishes this handoff. Its sole parent is the base, and it carries the implementation, this handoff and the STATE return gate in one commit.
- **Bootstrap:** a fresh Context Bootstrap from `ce2829a`. I read the STATE body, D-079, RFC-020 and AS-108 before any change.
- **D-068:** the suspended local draft (`devos/execution/`, `tests/fixtures/execution/` in the primary checkout) was not touched, staged, committed, imported or pushed.

**Confirmations:**
- **Protocol V2 remains unactivated.** Live STATE stays `PROTOCOL_VERSION: 1` and has no directive selector.
- **CURRENT_DIRECTIVE is not a live V1 selector.** It was never used as a V1 execution selector. The new `coordination/CURRENT_DIRECTIVE.md` is inert scaffolding: its format example sits in a `text` fence, so it can never parse as a directive. The checker now refuses directive selector fields in any V1 STATE.
- **No product mutation.** No product, admin, site or runtime file changed. There was no media, content, D1/R2, migration, deployment, S6/S7 or V2A work.

## What was implemented

**Dual-version checker** (`scripts/check-context-bootstrap.mjs`):
- **Protocol versions.** `SUPPORTED_PROTOCOL_VERSIONS = [1, 2]`. V1 behaviour is unchanged.
- **Under V1:** the `DIRECTIVE_SELECTOR_UNDER_V1` rule refuses any `CURRENT_DIRECTIVE`/`DIRECTIVE_*` STATE field. That guarantees the directive cannot become a live V1 selector.
- **V2 selector legality** (`checkDirectiveSelector`):
  - ACTIVE only on a Builder execution turn;
  - a V2 Builder turn without a directive fails;
  - NONE requires empty values;
  - never directive and handoff together (T9);
  - a Paulo turn selects no handoff;
  - an incomplete selector fails.
- **Directive binding** (`checkDirectiveBinding`):
  - the header is a positive allowlist with required fields and schema version;
  - the `DIR-` ID format;
  - fixed vocabularies for `target_turn`, `sentinel_disposition`, `su_mode` and `su_disposition`;
  - `BLOCKED` is refused;
  - field-for-field STATE binding, and `target_turn == TURN`;
  - `issue_parent_commit` equals the parent of the publishing commit, both at publication and at a snapshot;
  - `authority_ref` must exist as a `### D-NNN` heading;
  - the review must be the live review or an archive;
  - all ten required sections must be present.
- **Transition checks** (`checkDirectiveTransition`):
  - partial transitions in both directions;
  - in-place and archive-level duplicate-ID changed-byte rejection;
  - outgoing-directive byte archive;
  - provenance (directive ID, cycle, publication commit, source and archive blobs);
  - an index row.
- **`archiveDirective()`:** writes the entry, the provenance and the index row. It is immutable and conflict-refusing.
- **Protocol-transition guard** (`checkProtocolTransition`). This is a Stage A implementation choice for review:
  - any change of `PROTOCOL_VERSION` between defined versions must be declared with `--protocol-cutover <from>-><to>`;
  - a 1->2 activation must carry `CURRENT_DIRECTIVE: NONE` and route to a non-Builder gate;
  - a declared cutover checks the session protocol against the parent's version.
- **Status and publish wiring** for all of the above.
- **Measurement:** `--baseline` also measures the declared V2 Builder startup set.
- **Disclosure:** `NOT_PROVEN` now also states that the quality and independence of SENTINEL/SU are not proven.

**Scaffolding:**
- `coordination/CURRENT_DIRECTIVE.md`: an inert template.
- `coordination/archive/directives/README.md`: the archive rules and an empty index.

**Docs and startup:**
- `brain/protocols/CONTEXT_BOOTSTRAP.md`: a compact §10, plus checker/status notes.
- Short V2 notes in `brain/protocols/ARCHITECT_SYNC.md`, `coordination/README.md`, `CLAUDE.md`, `AGENTS.md` and `brain/00_HOME.md`.
- `CLAUDE.md` keeps the live V1 "Required first read" set unchanged and adds a separate, clearly inactive "Protocol V2 Builder startup" set.
- `devos/changes/rfcs/ML-DEVOS-RFC-020.md`: Stage A status and provenance wording only. The proposal body is unchanged.

**Skills:**
- Canonical `.agents/skills/` updated first: `project-orientation-state-recovery`, `implementation-handoff` and `architect-review-sync` each gained V2-only paragraphs.
- `.claude/skills/**` was regenerated with `node scripts/generate-claude-skills-bridge.mjs`.
- No new Skill was added.

**RFC-020 §26 implementation-detail choices:**
1. **Directive IDs** use `DIR-` plus `[A-Za-z0-9][A-Za-z0-9._-]{0,63}`, matching the handoff ID form.
2. **The archive index** is maintained by the transition helper `archiveDirective()`, and the checker requires its row.
3. **Required-section checks** share one heading parser (`headingsOf`) with CURRENT_HANDOFF. The header parser is also shared (`parseYamlHeader`).
4. **Typical directive budget:** about 8 KiB (`DIRECTIVE_BYTE_BUDGET`). This is guidance used in the measurement and is not enforced.
5. **No dedicated Skill.** Extending the three existing coordination Skills was simpler, and `tests/skills.test.mjs` pins exactly four Skills.

## Changed files

Diff against `ce2829ab766c29d8c2fd846ec5dc763834a8a4f3`:
- **Checker:** `scripts/check-context-bootstrap.mjs` (+471).
- **Tests:**
  - `tests/context-bootstrap-v2.test.mjs` (new, 33 tests);
  - `tests/context-bootstrap.test.mjs` (one assertion updated; see the limitations section).
- **Scaffolding:** `coordination/CURRENT_DIRECTIVE.md` (new, inert), `coordination/archive/directives/README.md` (new).
- **Protocol docs:** `brain/protocols/CONTEXT_BOOTSTRAP.md`, `brain/protocols/ARCHITECT_SYNC.md`, `coordination/README.md`.
- **Startup files:** `CLAUDE.md`, `AGENTS.md`, `brain/00_HOME.md`.
- **Skills:** `.agents/skills/{architect-review-sync,implementation-handoff,project-orientation-state-recovery}/SKILL.md`, and the three regenerated `.claude/skills/**` counterparts.
- **RFC:** `devos/changes/rfcs/ML-DEVOS-RFC-020.md` (status and provenance wording only).
- **Coordination:** `coordination/CURRENT_HANDOFF.md` (this file) and `coordination/STATE.md` (header return-gate fields only). The outgoing `H-WEB-REDESIGN-V1-REM1-0001` bytes were already archived by the AS-106 transition.

Not changed:
- `coordination/OPERATIVE_OBLIGATIONS.md`, where every row is carried forward unchanged;
- `brain/PROJECT_GOVERNANCE.md`, where no protocol-map change was needed;
- `brain/DECISION_LOG.md`;
- every product, admin, site or runtime file;
- `package.json` and the lockfile;
- `wrangler.jsonc`;
- migrations;
- S6/S7;
- D-068.

## Tests and evidence

| Command | Result | Exit |
|---|---|---|
| `node --test tests/context-bootstrap-v2.test.mjs` (RFC-020 §24) | 33/33 | 0 |
| `node --test tests/context-bootstrap.test.mjs` (V1 regression) | 56/56 | 0 |
| `node --test tests/skills.test.mjs` | 40/40 | 0 |
| `npm test` (whole repository) | 896 tests, 896 pass, 0 fail | 0 |
| `git diff --check` | clean | 0 |
| `validate-devos-manifest.mjs` / `validate-capability-policy.mjs` / `validate-task-contract.mjs` / `validate-rules.mjs` / `validate-waivers.mjs` | PASS / as expected / 15/15 / PASS / no waivers | 0 each |
| `validate-claude-skills-bridge.mjs` and regeneration | all 4 bridges OK; regenerating twice leaves the tree unchanged | 0 |
| `validate-traceability.mjs` | 2 errors (`CORE-022`, `WEB-REQ-009`), 14 warnings and `DRIFT`. The ERROR/WARNING set is identical to the base `ce2829a`, and the DRIFT is pre-existing. The index was not regenerated because `devos/governance/traceability/**` is outside the D-079 paths | 1 |
| `check-context-bootstrap --publish --check-only` on this candidate | exit 0 (recorded at publication) | 0 |
| `npm run build` | **not run**: no product, runtime or build input changed; only protocol scripts, tests and docs did | n/a |

Platform: Linux x86_64, Node v22.22.2.

**RFC-020 §24 coverage** (`tests/context-bootstrap-v2.test.mjs`; each item is asserted by checker code):
- **1:** V1 unchanged. There is also the whole unmodified V1 suite apart from one assertion. Directive fields in a V1 STATE are refused, and a V1 transition is not directive-checked.
- **2–5:** selector legality.
- **6–9:** ID, cycle, issue-parent and target-turn mismatches.
- **10–11:** missing or unknown authority and review.
- **12:** duplicate ID with changed bytes, in place, against the archive, and in `archiveDirective`.
- **13:** each of the ten sections, removed one at a time.
- **14–15:** SENTINEL/SU vocabulary.
- **16:** BLOCKED on either disposition.
- **17–19:** missing archive, byte mismatch, provenance mismatch or absence, and a missing index row.
- **20:** Builder return, both pure and end-to-end:
  - a directive is issued, published through the CLI, and its status is checked;
  - the Builder return archives it with `archiveDirective()`, selects the handoff, publishes and passes its status check;
  - dropping the archive is refused before any push.
- **21:** end-to-end remediation: a new review, the handoff archived, and a new directive DIR-2 published. Reusing archived DIR-1 with changed bytes is refused.
- **22:** a stale V1 session against V2 is refused in both status and publish; undeclared, declared and invalid cutovers are covered.
- **23:** exact-tip CAS under V2, where an advanced branch gives `BRANCH_ADVANCED` and `NOT_ATTEMPTED`. The 12 existing V1 publication tests also still pass.
- **24:** bridge determinism, no drift, and V2 content in all three Skills.
- **25:** startup measurement, on a fixture and on the real tree.

A Stage-B-shaped activation passes check-only only when declared. A directive smuggled into the activation commit is refused.

**Startup-read measurement.** Bytes are measured; token figures are estimates at bytes/4. The live V1 baseline figures are at base `ce2829a`.

| Set | Files | Bytes |
|---|---|---|
| V1 `CLAUDE.md` mandatory set, incl. the conditional CURRENT_HANDOFF | 13 | 98,427 |
| V1 set excluding CURRENT_HANDOFF, before Stage A | 12 | 88,856 |
| V1 set excluding CURRENT_HANDOFF, after Stage A (still live) | 12 | 96,493 |
| RFC-020 §19 planning baseline (at `1ea92e3`) | — | 85,625 |
| **Declared V2 Builder startup**: `CLAUDE.md`, STATE, CURRENT_DIRECTIVE, OBLIGATIONS | 4 | **30,535 (−64.3% vs 85,625)** |
| The same set with an 8 KiB budget-sized directive in place of the template | 4 | **35,776 (−58.2%)** |

The ≥50% target is met for the future V2 path, and no safety check was removed. The V2 path still reads STATE, the directive and the obligations, and runs the checker. `CLAUDE.md` alone is 12,418 bytes, most of it the preserved historical Phase 1 provenance.

## Unresolved findings and limitations

1. **The live V1 startup set grew by 7,637 bytes (+8.6%).** The growth comes from the §10 protocol text in `CONTEXT_BOOTSTRAP.md`, a V1 required read, plus the dual-mode notes in `CLAUDE.md` and `coordination/README.md`. I condensed §10 after measuring a first draft at about +10.5 KB. This is a real cost to every V1 session until Stage B, and the Architect may want it trimmed further or moved.
2. **One existing V1 test assertion changed.** `tests/context-bootstrap.test.mjs` previously asserted `PROTOCOL_VERSION: 2` is unsupported. That assertion now uses `3`, and asserts `2` is supported. This is the single intended behaviour change D-079 authorizes; every other V1 assertion is unchanged.
3. **The protocol-cutover declaration flag is my implementation choice.** `--protocol-cutover` is not named in RFC-020. It turns §21's "one atomic governed activation under a separate decision" and the §22 rollback rule into a mechanical refusal of undeclared version changes. Like the prepublication receipt, it is a procedural guard, not proof of authority. It needs Architect confirmation that it stays within RFC-020.
4. **The checker cannot prove the reasoning behind the fields.** It validates the shape and vocabulary of the SENTINEL/SU fields and the existence of the authority and review. It does not prove reasoning quality, SU independence or decision legitimacy (see the `NOT_PROVEN` entry).
5. **No real V2 directive exists.** All V2 evidence comes from synthetic fixtures and hermetic repositories. The real-tree startup measurement uses the inert template for the directive bytes, and the budget-sized row shows the realistic case.
6. **Traceability debt and DRIFT are unchanged and were not regenerated.** `brain/TEST_LEDGER.md` was not updated; the focused suites are listed here instead.
7. **Carried forward:** every `coordination/OPERATIVE_OBLIGATIONS.md` row, none closed. S6 remains parked at `ML-DEVOS-AS-103`, with O1 and O2 open. Spatial Design Controls V2A remains deferred (AS-107).

## Evidence locations

- The commit diff against `ce2829ab766c29d8c2fd846ec5dc763834a8a4f3`.
- `scripts/check-context-bootstrap.mjs`, in the section headed "RFC-020 Protocol V2 directive checks", and in `runPublish` / `activeSnapshotChecks` / `measureBaseline`.
- `tests/context-bootstrap-v2.test.mjs` (§24 items are named in the test titles) and `tests/context-bootstrap.test.mjs`.
- `coordination/CURRENT_DIRECTIVE.md` and `coordination/archive/directives/README.md`.
- `brain/protocols/CONTEXT_BOOTSTRAP.md` §10, and `CLAUDE.md` "Protocol V2 Builder startup".
- Measurement: `node scripts/check-context-bootstrap.mjs --baseline --commit <sha>`, fields `claude_md_mandatory_excluding_conditional_handoff` and `v2_builder_startup`.

## Governing references

- **Authority:** `D-079`.
- **Design:** `ML-DEVOS-RFC-020`.
- **Review:** `ML-DEVOS-AS-108`.
- **Protocol:** `ML-DEVOS-RFC-018` and `brain/protocols/CONTEXT_BOOTSTRAP.md`.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect independently reviews Stage A under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-108`. The review covers V1 non-regression, V2 fixture behaviour, directive identity and archive enforcement, stale-session behaviour, section enforcement, SENTINEL/SU field semantics, the startup measurements and bridge equivalence.

Protocol V2 activation (Stage B) needs a separate Paulo decision. No further Builder action is authorized.
