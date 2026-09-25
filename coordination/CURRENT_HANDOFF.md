# Current Handoff — RFC-020 Stage A Remediation Cycle 1 (D-079, AS-109)

```yaml
schema_version: 1
handoff_id: H-RFC020-STAGE-A-REM1-0001
cycle_id: MAISOGLABS_CANONICAL_DIRECTIVE_PROTOCOL_STAGE_A_IMPLEMENTATION
input_base_commit: e76a197459aae57643cc5fade3a718ec35821978
review_target_commit: e76a197459aae57643cc5fade3a718ec35821978
applicable_review_id: ML-DEVOS-AS-109
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result below is `ACTOR_REPORTED`. This is remediation cycle 1 of 2, returned through the Protocol V1 handoff mechanism.

## Objective

Correct only `AS109-F001` and `AS109-F002`, under scope `D079_AS109_RFC020_STAGE_A_REMEDIATION_CYCLE_1_ONLY`. No unrelated cleanup was done.

Provenance:
- **Remediation base:** `e76a197459aae57643cc5fade3a718ec35821978`, the published AS-109 transition. Its sole parent is the reviewed Stage A tip `547a7ac`.
- **Result SHA:** the commit that publishes this handoff. Its sole parent is the base, and it carries the fixes, the tests, this handoff and the STATE return gate in one commit.
- **Bootstrap:** a fresh Context Bootstrap from `e76a197`, then I read AS-109 from that tip.
- **D-068:** the suspended local draft (`devos/execution/`, `tests/fixtures/execution/` in the primary checkout) was not touched, staged, committed or pushed.

**Confirmations:**
- **Live protocol remains V1.** Live STATE stays `PROTOCOL_VERSION: 1`, and no live directive selector exists.
- **CURRENT_DIRECTIVE is not a live selector.** `coordination/CURRENT_DIRECTIVE.md` is unchanged, inert scaffolding.
- **No other mutation.** No product, admin, site or runtime code changed, and there was no media, D1/R2, migration, deployment, S6/S7, Stage B or V2A work.

## AS109-F001 — cutover session evidence (disposition: CORRECTED)

`scripts/check-context-bootstrap.mjs`:
- **`runPublish()`** now treats every *actual* `PROTOCOL_VERSION` change as a cutover, whether or not a declaration was given. For such a publication:
  - the candidate-side session check is skipped;
  - the new `checkCutoverSession(before, sessionProtocolVersion)` runs.
- **`checkCutoverSession()`** requires `--session-protocol`; a missing or empty value gives `PROTOCOL_CUTOVER_SESSION_REQUIRED`.
- **Binding to the parent.** The session value must equal the parent's protocol; a different value gives `STALE_SESSION_PROTOCOL`, through the existing stale-session behaviour.
- **Declaration.** `checkProtocolTransition()` still separately requires the matching `--protocol-cutover <from>-><to>`.
- **Result.** A cutover now passes only with **both** the correct declaration and `--session-protocol <from>`, for 1→2 activation and 2→1 forward recovery alike.
- **Non-cutover transitions are unchanged.** The optional session value is still bound to the candidate.
- **Wording.** The usage text and `brain/protocols/CONTEXT_BOOTSTRAP.md` §8/§10 command wording were updated to name both mandatory flags.

## AS109-F002 — fence-aware, unambiguous directive sections (disposition: CORRECTED)

`scripts/check-context-bootstrap.mjs`:
- **New `directiveHeadings(text)`.** It collects level-2 headings in document order and skips everything inside fenced code blocks. Fences are ``` ``` ``` or `~~~`, CommonMark-style: a fence closes only on the same character, with at least the opening length and nothing after it but whitespace.
- **`checkDirectiveSections()`** counts real headings. Each of the ten RFC-020 sections must appear exactly once:
  - an absent section (including one that appears only inside a fence) gives `MISSING_DIRECTIVE_SECTION`;
  - a repeated section gives `DUPLICATE_DIRECTIVE_SECTION`, with the count in the detail.
- **Section names** are preserved exactly.
- **V1 handoff parsing is unchanged.** The CURRENT_HANDOFF required-section check keeps its original parser (`headingsOf`). I chose a directive-specific parser deliberately, so V1 handoff behaviour cannot shift. The existing V1 section tests pass unchanged.
- **Wording.** The §10 wording states the exactly-once, outside-fence rule.

## Changed files

Diff against `e76a197459aae57643cc5fade3a718ec35821978`:
- `scripts/check-context-bootstrap.mjs`: F001, F002 and the usage text.
- `tests/context-bootstrap-v2.test.mjs`: the new F001/F002 tests; existing tests are unchanged.
- `brain/protocols/CONTEXT_BOOTSTRAP.md`: the §8/§10 cutover command and section-rule wording.
- `coordination/CURRENT_HANDOFF.md` (this file) and `coordination/STATE.md` (header return-gate fields only). The outgoing `H-RFC020-STAGE-A-0001` bytes were already archived by the AS-109 transition.

Not changed:
- `tests/context-bootstrap.test.mjs` (not needed);
- `devos/changes/rfcs/ML-DEVOS-RFC-020.md` (its status wording remains truthful);
- Skills, `CLAUDE.md`, `AGENTS.md`, `coordination/CURRENT_DIRECTIVE.md`;
- `coordination/OPERATIVE_OBLIGATIONS.md` (every row carried forward);
- all product and runtime files.

## Tests and evidence

| Command | Result | Exit |
|---|---|---|
| `node --test tests/context-bootstrap-v2.test.mjs` (RFC-020 V2 suite with the new AS-109 tests) | 46/46 | 0 |
| `node --test tests/context-bootstrap.test.mjs` (V1 regression) | 56/56 | 0 |
| `node --test tests/skills.test.mjs` | 40/40 | 0 |
| `npm test` (whole repository) | 909 tests, 909 pass, 0 fail | 0 |
| `git diff --check` | clean | 0 |
| manifest / capability-policy / task-contract / rules / waivers / skills-bridge validators | all pass | 0 each |
| `validate-traceability.mjs` | 2 errors (`CORE-022`, `WEB-REQ-009`) and 14 warnings. The ERROR/WARNING set is identical to the base `e76a197`, the DRIFT is pre-existing, and the index was not regenerated | 1 |
| `check-context-bootstrap --publish --check-only` on this candidate | exit 0 (recorded at publication) | 0 |
| `npm run build` | not run: no product or build input changed | n/a |

Platform: Linux x86_64, Node v22.22.2.

**F001 tests** (`tests/context-bootstrap-v2.test.mjs`). The cutover cases publish end to end in hermetic repositories. The "no session" cases are real publish attempts, not `--check-only`, and prove the tip is unchanged.

| Case | Expected | Result |
|---|---|---|
| declared `1->2`, no session protocol | `PROTOCOL_CUTOVER_SESSION_REQUIRED`, `NOT_ATTEMPTED`, nothing pushed | pass |
| declared `2->1`, no session protocol | `PROTOCOL_CUTOVER_SESSION_REQUIRED`, `NOT_ATTEMPTED`, nothing pushed | pass |
| `1->2` with session `2` | `STALE_SESSION_PROTOCOL`, nothing pushed | pass |
| `2->1` with session `1` | `STALE_SESSION_PROTOCOL`, nothing pushed | pass |
| `1->2` with session `1` and the correct declaration | `PROTOCOL_CUTOVER_SESSION_BOUND` + `PROTOCOL_CUTOVER_DECLARED`; check-only passes and the real publish lands | pass |
| `2->1` with session `2` and the correct declaration | same as above, landing | pass |
| a version change with correct session evidence but no declaration | `PROTOCOL_CUTOVER_UNDECLARED` | pass |
| unit tests for `checkCutoverSession` (missing, empty, mismatched, bound, both directions) | as specified | pass |

The existing exact-tip, stale-session and Stage-B-shaped activation tests all still pass.

**F002 tests:**

| Case | Expected | Result |
|---|---|---|
| all ten unique real headings, including with an extra non-required heading and fenced examples of required headings | `DIRECTIVE_SECTIONS_PRESENT` / `DIRECTIVE_BOUND` | pass |
| a duplicate real `## Instructions` | `DUPLICATE_DIRECTIVE_SECTION` (`Instructions x2`), also through `checkDirectiveBinding` | pass |
| a duplicate real `## Stop conditions` | `DUPLICATE_DIRECTIVE_SECTION` (`Stop conditions x2`) | pass |
| a required heading only inside a fence (```` ``` ````, ```` ```` ````, `~~~`; for Instructions, Stop conditions and Objective) | `MISSING_DIRECTIVE_SECTION` | pass |
| a nested or shorter inner fence, or a different fence character, does not close the block early | `MISSING_DIRECTIVE_SECTION` | pass |
| `directiveHeadings` keeps order, skips fences and ignores `###` headings | `['A', 'B']` | pass |

**Falsification.** I ran the new test file against the pre-remediation checker from `e76a197`, with stub exports so it would load. 10 of the 13 new tests failed. Those were every missing-session, positive-cutover, duplicate-section and fenced-section case. With the fix restored, all 46 pass.

The three new tests that pass on the old code are the two "target-version session" stale checks and the undeclared-change check. The existing stale-session and declaration paths already caught those; the gap was the missing session value.

## Unresolved findings and limitations

- **Findings:** `AS109-F001` and `AS109-F002` are corrected. No finding is knowingly left open.
- **Fence recognition** follows the CommonMark rules for backtick and tilde fences. Indented code blocks (4+ spaces) are not treated as fences, so a `## ` line at column 0 is always a heading unless it sits inside a fence. This matches how the parser reads a directive: headings must start at column 0.
- **The V1 handoff section check** intentionally still uses the original `Set`-based parser, as the review permitted. Whether V1 handoffs should get the same strictness is a separate question that was not changed here.
- **Still Builder-reported:** the numbers from the Stage A handoff stand as reported and remain ACTOR_REPORTED: the startup-read figures, bridge determinism and the V1 startup growth of about 7.7 KB.
- **Unchanged:** traceability debt and DRIFT, not regenerated. Every `coordination/OPERATIVE_OBLIGATIONS.md` row is carried forward. S6 remains parked at `ML-DEVOS-AS-103`, and V2A remains deferred.

## Evidence locations

- The commit diff against `e76a197459aae57643cc5fade3a718ec35821978`.
- `scripts/check-context-bootstrap.mjs`: `checkCutoverSession`, `directiveHeadings`, `checkDirectiveSections`, and the `runPublish` version-change block.
- `tests/context-bootstrap-v2.test.mjs`: the sections headed "AS109-F001 cutover session" and "AS109-F002 directive sections".
- `brain/protocols/CONTEXT_BOOTSTRAP.md` §8 and §10.

## Governing references

- **Authority:** `D-079`.
- **Review:** `ML-DEVOS-AS-109` (controlling), `ML-DEVOS-AS-108`.
- **Design:** `ML-DEVOS-RFC-020`.
- **Protocol:** `brain/protocols/CONTEXT_BOOTSTRAP.md`.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect independently reviews this remediation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-109`. Protocol V2 activation (Stage B) still needs a separate Paulo decision. No further Builder action is authorized.
