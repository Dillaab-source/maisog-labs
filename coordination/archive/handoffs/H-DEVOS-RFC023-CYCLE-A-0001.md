# Current Handoff — RFC-023 / Context Bootstrap V2.1 Cycle A (D-127)

```yaml
schema_version: 1
handoff_id: H-DEVOS-RFC023-CYCLE-A-0001
cycle_id: MAISOGLABS_DEVOS_RFC023_V21
input_base_commit: 25ac69e9453dc75e7fe011b1cebeb45caaacc655
review_target_commit: 25ac69e9453dc75e7fe011b1cebeb45caaacc655
applicable_review_id: ML-DEVOS-AS-153
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every check below is `ACTOR_REPORTED` (Builder-run, in a cloud container with a shallow clone); none is Architect-reproduced.

## Objective

Carry out `D-127` Cycle A under `DIR-DEVOS-RFC023-CYCLE-A-0001`: persist the V2.1 review trail, file `ML-DEVOS-RFC-023`, and migrate the policy text, `CLAUDE.md`, obligations and RFC lifecycle projection. No code, checker, validator, test, STATE-schema, archive-behavior or production change.

## Changed files

**Issue commit `25ac69e` (published, parent `4e8a478`):** `brain/DECISION_LOG.md` (D-127: structured entry plus the verbatim owner text and the owner's AS-151 clarification); `devos/changes/architect-syncs/ML-DEVOS-AS-151.md`, `-152.md`, `-153.md` (new) and the README rows; `coordination/ARCHITECT_REVIEW.md` (now AS-153, byte-identical to its archive); `coordination/CURRENT_DIRECTIVE.md`; `coordination/STATE.md`.

**This return commit:**
- `devos/changes/rfcs/ML-DEVOS-RFC-023.md` — new. Revision 3 verbatim with headings demoted one level, plus a provenance section; canonical Status line from creation.
- `brain/protocols/ARCHITECT_SYNC.md` — new "V2.1 policy amendment" section (BC-1 Envelope, BC-3, BC-4, BC-6); BC-2 escalation added to Evidence discipline.
- `brain/protocols/CONTEXT_BOOTSTRAP.md` — RFC-023 authority line; §2 STATE body (BC-9); §3 item 7 (BC-12 adopted key, with the current checker key stated until Cycle B); §5 presentation (BC-11); §8 bypass line (lineage-scoped limit, disclosed).
- `CLAUDE.md` — superseded Phase 1 text (old lines 68–281) removed and replaced by a History pointer; the V1 read set compressed under the same `## Required first read` heading. That heading is kept because `--baseline` parses it.
- `coordination/OPERATIVE_OBLIGATIONS.md` — `OBL-023` (AS132-F003), `OBL-024` (S6 parked, `DEFERRED`), `OBL-025` (O1) and `OBL-026` (O2) added. OPEN/DEFERRED rows first, byte-identical; the 9 CLOSED rows compacted to five-cell stubs.
- `devos/changes/rfcs/README.md` — rewritten as the subordinate projection: 23 rows, restoring RFC-011 and RFC-020.
- `devos/changes/rfcs/ML-DEVOS-RFC-001…022.md` — line 3 only (22 × 1/1 line diffs).
- `devos/templates/RFC_TEMPLATE.md` — canonical line moved to line 3; vocabulary noted in the comment and the index.
- `coordination/archive/directives/DIR-DEVOS-RFC023-CYCLE-A-0001.md` + `.provenance.json` + index row (`archiveDirective()`); `coordination/STATE.md` (return gate; thin body); this handoff.

**Not changed:** `.agents/skills/` and `.claude/skills/`. No Skill restates a changed policy: the "at most `MAX_PUBLICATION_ATTEMPTS = 3`" line stays true, and no Skill restates routing, escalation, the STATE body or RFC status. Also untouched: `scripts/`, `tests/`, `devos/governance/traceability/`, every product file.

## RFC status mapping (for Architect review)

Old line 3 → projected status (template vocabulary). Full old lines: `git show 25ac69e:devos/changes/rfcs/ML-DEVOS-RFC-NNN.md`. Every ID cited in an old line is carried into that RFC's index row (checked mechanically).

| RFC | Old status line (truncated) | Projected |
|---|---|---|
| RFC-001 | `IMPLEMENTED AND CLOSED` — implemented at `c76bf6a6390581963d2ded2e5db18d96b4a346b4`, te… | ACCEPTED (+ ADR-002) |
| RFC-002–012 | `ACCEPTED` | ACCEPTED |
| RFC-013 | `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-013 / D-046` | ACCEPTED (+ ADR-013) |
| RFC-014 | `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-011 / D-046; explicit no Sentinel capability-base… | ACCEPTED (+ ADR-011) |
| RFC-015 | `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-012 / D-046; co-effective at v1.6.0 with ML-DEVOS… | ACCEPTED (+ ADR-012/013) |
| RFC-016 | `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-014 / D-051` | ACCEPTED (+ ADR-014) |
| RFC-017 | `IMPLEMENTED AND CLOSED — ML-DEVOS-ADR-015 / D-065` | ACCEPTED (+ ADR-015) |
| RFC-018 | `DRAFT` | ACCEPTED — judgment: AS-078 approved; D-062 implemented and activated it |
| RFC-019 | `DRAFT` — proposal. Architect-approved in `ML-DEVOS-AS-089` after Remediation Cycles 1–3… | ACCEPTED — judgment: design accepted by AS-101; core accepted by AS-103; parked by D-075 |
| RFC-020 | `ARCHITECT-APPROVED PROPOSAL (ML-DEVOS-AS-108) — STAGE A ACCEPTED (ML-DEVOS-AS-110); PRO… | ACCEPTED — judgment: V2 active since D-080 |
| RFC-021 | `ACCEPTED` — independently approved by `ML-DEVOS-AS-118` and accepted by Paulo under `D-… | ACCEPTED |
| RFC-022 | `ACCEPTED` — accepted by `ML-DEVOS-AS-132` (final architecture review), after Paulo's ow… | ACCEPTED |
| RFC-023 | (new) | ACCEPTED (AS-151–153; D-127); class `CORE_POLICY` is a Builder projection |

## Tests and evidence

All `ACTOR_REPORTED`:
- **Checker.** Issue candidate `25ac69e`: `--check-only`, then `--publish` → `PUBLISHED`, attempt 1, key `MAISOGLABS_DEVOS_RFC023_V21:NONE:CLAUDE`. Post-publish bootstrap `--commit 25ac69e --session-protocol 2`: all checks ok. This return candidate: `--check-only` with every check ok before `--publish`.
- **Obligations.** `checkObligationCarryForward(25ac69e, candidate)` → `OBLIGATIONS_CARRIED_FORWARD`; 26 rows (13 unresolved carried byte-identical, 4 added, 9 stubs).
- **RFC status lines.** RFC-001…023: each has exactly one `^Status:` line, byte-identical to the canonical line, at line 3, with blank lines 2 and 4. No CRLF. RFC-001…022 diffs are 1/1 lines each.
- **RFC index.** 23 rows = 23 files, no duplicates, statuses within the vocabulary; all 94 authority refs resolve to a `### D-NNN` heading, an AS archive or an ADR file.
- **STATE.** Header field set and order unchanged; `PROTOCOL_VERSION: 2`; body 487 bytes.
- **Traceability validator.**
  - Errors 3 (`CORE-022`, `D-000`, `WEB-REQ-009`), identical to the clean tip `4e8a478`.
  - The issue commit alone showed a transient fourth error (`ML-DEVOS-RFC-023` referenced before creation); it is resolved here.
  - Warnings 14 → 13 (`D-009` now has an inbound reference).
  - Generated-index `DRIFT` is pre-existing at `4e8a478` and was not regenerated.
- **Skills bridge.** `node scripts/validate-claude-skills-bridge.mjs`: all four OK. No regeneration needed.
- **Tests.**
  - Governance suites: `context-bootstrap`, `context-bootstrap-v2`, `traceability` 116/116; `skills` 40/40.
  - Full `npm test`: 623/635. The 12 failing files all fail on `Cannot find package 'wrangler'` / `'jose'` (no `node_modules` in this container): Worker/D1 suites, environment-only, identical before and after. No product file changed.
- **Sizes (M6).** `CLAUDE.md` 12,456 → 4,638 B (target ≤ 4.7 KB met). STATE body 2,253 → 487 B (met). Obligations 7,480 → 7,174 B (target ≤ 5 KB **not met**: the four required new rows offset the stub savings).
- **`--baseline`, `25ac69e` vs this candidate.** The V1 `## Required first read` set is still the same 13 files (106,941 → 96,436 B). The V2 Builder startup set (4 files) went 28,303 → 18,724 B, an estimated 7,076 → 4,681 tokens (`ceil(bytes/4)`). `CURRENT_DIRECTIVE.md` is unchanged between the two commits.
- **AS132-F003 / OBL-023.** The Builder inspected both candidates' STATE transitions and complete changed-file sets manually (lists above). No Cycle B file is in either diff.

## Unresolved findings and limitations

1. **AS-151 relay gaps.** The relayed first review contains three `Pasted text` markers whose quoted content is unrecoverable. The markers are kept verbatim and disclosed, per the owner's clarification recorded in D-127.
2. **AS IDs assigned by the Builder.** `ML-DEVOS-AS-151`–`153` were assigned at persistence by the Builder as mechanical publisher. The reviews had never been repository-published. AS-153 became the live `ARCHITECT_REVIEW.md` so that the directive and this handoff could bind to it.
3. **Revisions 1 and 2 are not persisted.** Revision 1 was unavailable to this session; revision 2 exists only in the Builder session transcript.
4. **Phase 1 text is now only in Git history** (`4e8a478:CLAUDE.md`, blob `9877e6e4…`, lines 68–281). A shallow clone may need a deeper fetch to read it. This deletion was adopted design (§4 item 6); AS51-F007 required only that the text not read as current scope.
5. **Cycle B is not implemented.**
   - The BC-10 validator checks and the BC-12 ledger key do not exist yet.
   - The status lines and index were verified mechanically in this handoff only.
   - The checker still uses the old default key (stated in CONTEXT_BOOTSTRAP §3 item 7).
6. **Mapping judgments** (table above): RFC-018/019/020 → `ACCEPTED`; "IMPLEMENTED AND CLOSED" → `ACCEPTED` with its ADR; RFC-023 class `CORE_POLICY` (the design text states no class).
7. **STATE body held-positions line.** PR #7 and A-3/A-6 are kept in the body. BC-9 drops only prohibitions already covered by the flags, `AUTHORIZED_SCOPE` or the cited Decision, and D-127 and the obligations index cover neither.
8. **OBL-024 is `DEFERRED`** (parked to a separate Paulo decision), not `OPEN`: a Builder judgment.
9. **Possibly stale text, outside Cycle A.** `CONTEXT_BOOTSTRAP.md`'s top status line still says V2 is "pending the Architect's independent activation verification". Not changed, because that edit is outside Cycle A.
10. **Directive authorship.** The directive and its SENTINEL/SU entries were prepared by the Builder as publisher of D-127 (the D-125 precedent), not by the Architect.
11. **Test coverage.** The 12 Worker/D1 test files could not run in this container (missing dependencies).

## Governing references

`D-127`; `ML-DEVOS-AS-153` (with `AS-151`, `AS-152`); `ML-DEVOS-RFC-023`; `DIR-DEVOS-RFC023-CYCLE-A-0001` (archived); `brain/protocols/CONTEXT_BOOTSTRAP.md`; `brain/protocols/ARCHITECT_SYNC.md`; `ML-DEVOS-RFC-008` CORE-020; `ML-DEVOS-AS-132` AS132-F003; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- Diffs: `git diff 4e8a478 25ac69e` (issue) and `git diff 25ac69e <return commit>` (this cycle).
- Old RFC status lines: `git show 25ac69e:devos/changes/rfcs/ML-DEVOS-RFC-NNN.md`, line 3.
- Directive archive: `coordination/archive/directives/DIR-DEVOS-RFC023-CYCLE-A-0001.*`.
- Commands: `node scripts/check-context-bootstrap.mjs --commit <sha> --session-protocol 2`; `node devos/governance/traceability/validate-traceability.mjs`; `node scripts/validate-claude-skills-bridge.mjs`; `node --test tests/context-bootstrap.test.mjs tests/context-bootstrap-v2.test.mjs tests/traceability.test.mjs tests/skills.test.mjs`.

## Next action

Architect review of Cycle A against D-127 and `ML-DEVOS-AS-153`. That includes the mapping judgments (item 6), the held-positions line (item 7) and the Phase 1 removal (item 4). Cycle B needs a separate Paulo decision after that review.
