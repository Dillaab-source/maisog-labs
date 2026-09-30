# ML-DEVOS-RFC-023: Context Bootstrap V2.1 — Governance-Efficiency Policy Amendment to Protocol V2

Status: See `devos/changes/rfcs/README.md` for the current lifecycle projection; Decisions and ADRs remain authoritative.

## Provenance

- **Design text:** the "Design text" section below is V2.1 proposal revision 3 as the Builder wrote it in the Builder session and as the Architect reviewed it in `ML-DEVOS-AS-153` (`ACCEPTED FOR OWNER ADOPTION DECISION`). It was filed here under `D-127`.
- **Review trail:** `ML-DEVOS-AS-151` (revision 1, `CHANGES_REQUESTED`) → `ML-DEVOS-AS-152` (revision 2, `CHANGES_REQUESTED`) → `ML-DEVOS-AS-153` (revision 3, accepted). All three were persisted under `D-127` from the relayed review conversation; none was repository-published before `D-127`.
- **Revisions not persisted:** revision 1 was not available in the Builder session that filed this RFC and is not recoverable here. Revision 2 exists only in that session's transcript. Neither is reproduced.
- **Transcription:** the design text is reproduced verbatim, with one structural change: every Markdown heading is demoted by one level (`#` → `###`, `##` → `####`), so that it nests under this RFC's own headings. Its preface ("Answering", "Basis", "Writes", "Evidence class", "What changed since revision 2") describes the chat revision at the time it was written. It is kept as written and is not current status.
- **Open consequence resolved:** the closing note of revision 3 asked the Architect to confirm BC-1 point 6. `ML-DEVOS-AS-153` confirmed it as written: no per-step reset of `CURRENT_REMEDIATION_CYCLE`, so one envelope shares the remediation budget. `D-127` adopted it ("shared remediation budget across an envelope unless Paulo later decides otherwise").
- **Carrier:** `ML-DEVOS-AS-152` Q1 decided that V2.1 is carried by a new RFC. `ML-DEVOS-RFC-020` remains the historical authority for Protocol V2 directive transport; this RFC is an additive policy / efficiency amendment to Protocol V2. "V2.1" is a human-facing name only: `PROTOCOL_VERSION` stays `2`, and there is no machine-readable amendment selector.
- **Scope of adoption:** `D-127` adopts BC-1 through BC-12 only. It does not adopt the other `D-126` governance learnings, which remain pending the separate SU + Architect consolidated retrospective.
- **Implementation split:** `D-127` authorizes Cycle A (policy / document / record migration) only. The checker and attempt-ledger changes (BC-12) and the RFC-projection validator checks (BC-10) are Cycle B and need a separate owner decision. Where each part currently stands is projected in the RFC index, not here.

## Design text (V2.1 revision 3, verbatim; headings demoted one level)

### V2.1 proposal, revision 3 (design only)

**Answering:** the Architect's review of revision 2 (CHANGES_REQUESTED: AS-R2-F001, F002, F003, plus decisions on Q1 and Q2).
**Basis:** `governance/maisoglabs-v0.1` at `4e8a4789`, re-fetched for this revision; the tip has not moved. STATE still reads `TURN: PAULO` and `PROTOCOL_VERSION: 2`.
**Writes:** none. Nothing edited, published, recorded as a Decision or implemented. STATE, production and S6/S7 were not touched.
**Evidence class:** Builder-inspected, which makes it actor-reported.

**What changed since revision 2:** BC-1 (F001), BC-10 (F002), and BC-12 and the test list (F003); Q1 and Q2 are applied as the Architect decided. Everything else is carried over unchanged.

Two new facts from re-inspection feed F002:
- Each of RFC-001 through RFC-022 has exactly one line beginning `Status:`. It is always line 3, and line 4 is always blank. So the migration is a clean single-line replacement.
- `devos/templates/RFC_TEMPLATE.md:10` also carries a `Status:` line: `` Status: `DRAFT` | `UNDER_ARCHITECT_SYNC` | `ACCEPTED` | `REJECTED` | `SUPERSEDED` ``. It has to join the amendment set.

---

#### 1. Root causes (unchanged from revision 2)

**R1: owner relay load.** No Architect execution channel has yet met the governed-write/CAS requirement in OBL-012 (OPEN). So every verdict reaches the branch through a Paulo relay, and the Builder publishes it. V2.1 reduces how many verdicts need Paulo as *decision-maker*. The publication path does not change.

**R2: independent verification drift.** `ARCHITECT_SYNC.md` already requires independent verification (line 20, and line 92: an independent SENTINEL sync on every handoff). The failure is operational drift: Paulo was asked to relay repository facts before the Architect had used up its own read capability. V2.1 strengthens how the existing rule is carried out. The drift is the Architect's characterization; I have not counted instances in the repository.

**R3: the attempt-ledger key counts transitions, not attempts.**
- The default key is `${CYCLE_ID}:${HANDOFF_ID||'NONE'}:${TURN}` (`scripts/check-context-bootstrap.mjs:1442`).
- 18 of the last 60 STATE revisions share the key `MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE`.
- D-112 was recorded as attempt 3 with zero failed pushes.
- D-113 through D-125 each needed a manual `--transition-id` override (13 overrides).

**R4: RFC lifecycle status drifts across several mutable places.**
- RFC-020's body still reads "PENDING ARCHITECT ACTIVATION VERIFICATION", although V2 directives have been issued since.
- RFC-018's body reads `DRAFT`, although its protocol is active.
- The RFC index omits exactly RFC-011 and RFC-020 (the Architect independently confirmed this).
- D-081 took an owner decision only to correct stale status wording.

**R5: files loaded every turn carry history.**

| File | Size | History / narrative portion |
|---|---|---|
| `CLAUDE.md` | 12,456 B | 7,791 B is superseded Phase 1 text (lines 68–281) |
| STATE | 2,975 B | 2,253 B is body narrative |
| `OPERATIVE_OBLIGATIONS.md` | 7,480 B | its 9 CLOSED rows total 3,036 B |

**Not a root cause: archive retention.** Archives are cold unless someone retrieves them, and OBL-016 shows the harm of losing them.

---

#### 2. Disposition table

| # | Element | Rev 3 disposition |
|---|---|---|
| 1 | Thesis: owner interactions fall sharply, zero safety regressions | KEEP |
| 2 | Authorized Work Envelope | **REVISED (F001).** A finite ordered step list is the progression budget; the remediation counter stays remediation-only |
| 3 | Adaptive SENTINEL/SU | KEEP |
| 4 | Evidence escalation | KEEP (rev 2): applies CORE-020; no new evidence system |
| 5 | Constructive Dissent | KEEP |
| 6 | Author ≠ Publisher | KEEP |
| 7 | Existing-Capability-First | KEEP (carries the R2 remedy) |
| 8 | Knowledge Treasury reuse | KEEP |
| 9 | `CLAUDE.md` slimming | KEEP |
| 10 | Thin STATE | KEEP (rev 2): no new fields; STATE-only obligations move to the index first |
| 11 | RFC lifecycle projection | **REVISED (F002).** One exact status line; the template is included; the validator rejects any other status line |
| 12 | Attempt-ledger repair | **REVISED (F003).** Hard only within one ledger lineage; the fresh-clone bypass stays disclosed |
| 13 | Thin obligations (existing file) | KEEP (rev 2) |
| 14 | Archive reduction | WITHDRAWN; retention unchanged |
| 15 | Version bump / `PROTOCOL_AMENDMENT` | WITHDRAWN; stays `PROTOCOL_VERSION: 2` |
| 16 | Carrier document | **DECIDED (Q1): new `ML-DEVOS-RFC-023`.** It is an additive policy/efficiency amendment to Protocol V2; RFC-020 remains the historical authority for V2 directive transport |
| 17 | Envelope/remediation budget sharing | **DECIDED (Q2): not shared** |

---

#### 3. Behavioral contract (final BC-1 to BC-12)

**BC-1 Authorized Work Envelope (F001).**

1. **What the envelope Decision contains.** Paulo grants an envelope by Decision. The Decision contains a finite, ordered list of named steps, `S1 … Sn`. For each step it gives:
   - the exact scope;
   - the action flags the step needs;
   - its acceptance criterion.

   It also states any extra re-entry triggers, and whether `Sn` ends the cycle.
2. **Budget.** `n` is the progression budget. No new STATE field or counter is added.
3. **Step 1.** `S1` is routed exactly as any Paulo-authorized directive is routed today.
4. **Routing to the next step.** The Architect may route directly only to the **next unused** step `S(k+1)`, and only when all of these hold:
   - (a) that exact step is listed in the owner Decision;
   - (b) every authority/action flag it needs is already valid in live STATE. The Architect never sets or widens a flag;
   - (c) no re-entry trigger has fired;
   - (d) `Sk` has been accepted, in the same AS that performs the routing.
5. **How a step is identified, with no schema change.**
   - The directive's existing `authority_ref` names the envelope Decision.
   - Its existing `Governing references` section names the step, as `Envelope step: D-NNN S<k> of <n>`.
   - The routing AS states which step it accepted and which step it routes.
   - "Next unused" is determined from the AS records and the directive archive entries that cite that Decision.
6. **Progression and the remediation counter.** Moving from one accepted step to the next does not increment `CURRENT_REMEDIATION_CYCLE`, and it does not reset it. No reset rule is documented today, and V2.1 adds none.
7. **Remediation inside a step.** It works exactly as today: `CHANGES_REQUESTED` produces a new AS and a new `DIR-` for the same `Sk`, and increments the counter. If remediation would exceed `MAX_REMEDIATION_CYCLES`, the turn returns to Paulo.
8. **No reordering.** Skipping, repeating, inserting or reordering steps needs a new Paulo decision. Remediating the current step is not a repeat; re-routing a step that was already accepted is.
9. **End of the list.** After `Sn` is accepted, the turn returns to Paulo, unless `Sn` explicitly ends the cycle, in which case the acceptance closes the cycle as that step states.
10. **Re-entry triggers (minimum):**
    - any flag change is needed;
    - production, remote, deploy, `main`, Access/DNS/secret, or schema scope;
    - an ESCALATED item (BC-2);
    - `BLOCKED`;
    - the remediation cap would be exceeded;
    - an SU contradiction, or ambiguity in the step's text;
    - an unresolved dissent on a consequential claim;
    - a new risk or a risk-status upgrade;
    - any deviation from the listed step.
11. **Default.** With no envelope Decision, behavior is identical to today.

**BC-2 Evidence escalation (applies CORE-020 in RFC-008).**
- STANDARD is the default.
- ESCALATED applies when unavailable independent evidence is material to a consequential acceptance claim and repository/source inspection cannot provide sufficient confidence.
- "Consequential" means CORE-020's third bullet (remote or production writes, destructive operations, credential or security changes, public cutovers), plus any `VERIFIED` or `DEPLOYED` claim.
- Actor-reported ordinary test execution stays STANDARD when its limitation is explicit.
- The ban on silently upgrading evidence classes is unchanged (`ARCHITECT_SYNC.md:102`).

**BC-3 Existing-Capability-First.**
- The Architect uses its own read capability (exact commit, files, diffs) before requesting a Paulo relay.
- Each relay request states why that capability was not enough: runtime or production observation, owner intent, or governed publication (OBL-012).
- The Builder checks existing Skills, scripts and records before proposing a new mechanism.

**BC-4 Author ≠ Publisher.**
- Until an Architect channel satisfies OBL-012, the Architect authors review bytes, and the Builder (or Paulo) publishes them unchanged through CAS.
- The publisher attests that the bytes are identical to what the Architect authored. Publishing is not endorsement, and the publisher may not edit.

**BC-5 Adaptive SENTINEL/SU.** Unchanged: `BOUNDED_CONTRADICTION` by default; the RFC-020 §12 triggers escalate to `ESCALATED_RESEARCH`; depth scales with consequence.

**BC-6 Constructive Dissent.**
- Any role may record a dissent, with evidence.
- A dissent alone does not block.
- An unresolved dissent on a consequential claim is a re-entry trigger.

**BC-7 Knowledge Treasury reuse.**
- Lessons are routed through `PORTABLE_KNOWLEDGE_TREASURY.md`; there is no new store.
- The D-126 learnings are not adopted here; they stay reserved for the retrospective.

**BC-8 Archive retention: unchanged.** Byte-for-byte preservation of handoffs, directives and Architect Syncs continues under CONTEXT_BOOTSTRAP §4, §6a and §10. Any future reduction needs its own measured proposal.

**BC-9 Thin STATE.**
- The header schema and the parser are unchanged.
- The body target is 800 B or less:
  - the current AS and its verdict (one line);
  - the authorizing Decision;
  - the next transition (one line).
- The body does not restate prohibitions that the flags, `AUTHORIZED_SCOPE` or the cited Decision already cover.
- Any open item that exists only in STATE prose becomes an obligation row before it leaves the body.

**BC-10 RFC lifecycle projection (F002).**
- Decisions and ADRs establish authority and history. The RFC index is the single maintained projection of current RFC lifecycle status. RFC bodies stop carrying mutable lifecycle prose.
- **Canonical status line.** One exact byte form: ASCII, no trailing whitespace, LF-terminated.

  ```
  Status: See `devos/changes/rfcs/README.md` for the current lifecycle projection; Decisions and ADRs remain authoritative.
  ```
- **Where it goes:**
  - In every RFC body, it is line 3: line 1 is the H1 title, line 2 and line 4 are blank.
  - No other line in the body begins with `Status:`.
  - RFC-001 through RFC-022 each receive exactly this line in the migration.
  - RFC-023 carries it from creation.
  - `RFC_TEMPLATE.md` carries it too.
- **The index.**
  - Its header declares that it is a subordinate lifecycle projection only. Decisions, ADRs and immutable Architect Sync records remain authority and history.
  - It has one table row per RFC: RFC, title, class, current status, authority refs.
  - The status value comes from the template's existing vocabulary: `DRAFT`, `UNDER_ARCHITECT_SYNC`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`. No new vocabulary is added.
  - Implementation or closure is shown by an ADR in the authority refs, consistent with policy §3: an accepted RFC is not evidence of implementation.
- **Validator** (the existing `validate-traceability.mjs`):

  | Check | Result |
  |---|---|
  | An RFC file with no index row | ERROR |
  | An index row with no RFC file | ERROR |
  | Duplicate index row | ERROR |
  | Status value outside the vocabulary | ERROR |
  | Unresolved authority ref | ERROR |
  | A body `Status:` line that is missing, not byte-identical to the canonical line, or not at line 3 | ERROR |
  | Any second body line beginning `Status:` | ERROR |
  | A Decision/ADR/AS cites an RFC and is newer than every ref in that RFC's row | WARNING, `RFC_STATUS_PROJECTION_STALE` (a heuristic, so not an error) |

**BC-11 Thin obligations.**
- One file, two sections:
  - OPEN/DEFERRED first; this is the always-loaded set;
  - CLOSED/SUPERSEDED next, as five-cell stubs. A stub keeps its ID, authoritative source, disposition and closure reference; the obligation cell becomes `—`.
- There is no new file:
  - Git history is not a reliable discovery path in shallow clones, including this one.
  - Removing rows would take their IDs out of `DUPLICATE_OBLIGATION_ID` checking.

**BC-12 Attempt ledger (F003).**
- **Key.** `${CYCLE_ID}:${originParent}:${targetTurn}`, where `originParent` is the parent of the chain's first attempt.
- **Scope of the limit.** `MAX_PUBLICATION_ATTEMPTS = 3` is hard **within one persistent attempt-ledger lineage**, meaning one `.git/sentinel-context-bootstrap/attempts.json`:
  - A new process sharing that ledger cannot reset the count.
  - A candidate rebuilt after `BRANCH_ADVANCED` stays on the same logical publication chain. The ended entry records `continue_on: <read-back tip>`. A later attempt parented on that tip, with the same `CYCLE_ID` and target turn, continues the entry's count.
  - A `NOT_PUBLISHED` retry has the same parent, so it stays on the same chain.
- **Unchanged behavior.**
  - `UNKNOWN_OUTCOME` keeps today's read-back-then-stop behavior exactly ("stop, do not retry").
  - `reconcile()` is unchanged.
- **Chain end.** `PUBLISHED` terminates the chain. A later legitimate transition starts a fresh chain, because no entry lists its parent as `continue_on`, and it does not inherit the old count.
- **Compatibility.** The `--transition-id` override is kept. Old-format keys are inert.
- **Disclosed limitation, not prevented.** A fresh clone or a fresh ledger starts a new lineage. That bypass stays procedural and disclosed in CONTEXT_BOOTSTRAP §8 ("Disclosed bypasses V0 cannot prevent"). V2.1 does not claim to prevent it mechanically.

---

#### 4. Exact minimal file-amendment set (for later adoption)

**Governance records**

| # | File | Change |
|---|---|---|
| 1 | `devos/changes/rfcs/ML-DEVOS-RFC-023.md` | **New.** This design, as finally accepted, carrying the canonical status line from creation |
| 2 | `brain/DECISION_LOG.md` | Paulo's adoption Decision |
| 3 | `devos/changes/architect-syncs/ML-DEVOS-AS-NNN.md` | The Architect's acceptance (Architect-authored, Builder-published) |

**Policy text (cycle A)**

| # | File | Change |
|---|---|---|
| 4 | `brain/protocols/ARCHITECT_SYNC.md` | BC-1, BC-2, BC-3, BC-4, BC-6 |
| 5 | `brain/protocols/CONTEXT_BOOTSTRAP.md` | §3 item 7 and the §8 bypass line (BC-12); §5 (BC-11); the STATE body rule (BC-9) |
| 6 | `CLAUDE.md` | Delete lines 68–281 and replace them with a one-line pointer; trim the V1 read set |
| 7 | `.agents/skills/architect-review-sync/`, `.agents/skills/implementation-handoff/` | **Only if** they restate text being amended; then regenerate `.claude/skills/` with the generator script |

**Records (cycle A)**

| # | File | Change |
|---|---|---|
| 8 | `coordination/OPERATIVE_OBLIGATIONS.md` | New rows for AS132-F003, O1/O2 and "S6 parked at AS-103". These exist only in STATE prose today; the index has 0 matches for them. Then reorder the file and compact the closed rows |
| 9 | `devos/changes/rfcs/README.md` | Rewrite into the projection table with the subordination header |
| 10 | `devos/changes/rfcs/ML-DEVOS-RFC-001…022.md` | Line 3 of each file replaced with the canonical line (22 one-line edits) |
| 11 | `devos/templates/RFC_TEMPLATE.md` | Line 10 replaced with the canonical line. The vocabulary moves to the index header |

**Code and tests (cycle B)**

| # | File | Change |
|---|---|---|
| 12 | `scripts/check-context-bootstrap.mjs` | Default key and `continue_on` chain in `AttemptLedger`, `publishCandidate` and the publish path |
| 13 | `tests/context-bootstrap.test.mjs` | The 8 ledger tests in §6 |
| 14 | `devos/governance/traceability/validate-traceability.mjs` | The BC-10 checks |
| 15 | `tests/traceability.test.mjs` | The BC-10 tests in §6 |

**Not amended:**
- STATE schema; `PROTOCOL_VERSION`;
- CAS and the publish path, apart from the ledger key;
- `MAX_PUBLICATION_ATTEMPTS`;
- the directive header, its required sections, and handoff identity;
- archives;
- authorization flags;
- remediation-counter semantics;
- source-of-truth precedence documents;
- RFC-020's content, apart from its line-3 status line.

**No standalone STATE write.** BC-9 applies at the next routine governed transition.

---

#### 5. Migration compatibility

- **Protocol and parser.** No STATE, directive-header or directive-section change, and `PROTOCOL_VERSION` stays 2. Existing tests must pass unchanged on each migration candidate.
- **Envelope is inert by default.** With no envelope Decision, routing is identical to today. Step identification uses only the existing `authority_ref` and the existing `Governing references` section.
- **Obligations.** Carry-forward (`:731–753`) enforces only unresolved rows, so compacted CLOSED stubs pass it and every ID stays visible to the duplicate check. To be proven with `--check-only`. The rows for AS132-F003, O1/O2 and S6-parked must land in or before the first thinned-STATE transition.
- **RFC status lines.**
  - The replacement is mechanical and uniform: line 3 in all 22 files.
  - Every ID cited in a replaced line is carried into that RFC's index row, so no reference is lost.
  - The cycle-A handoff lists, for each RFC, the old status line and the status it maps to, for Architect review. Example: RFC-019/020's "ARCHITECT-APPROVED PROPOSAL…" has to map to a template value.
  - The validator does not parse RFC status today (its only "status" mention is a comment at `:15`), so the edits cannot break it before cycle B lands.
- **Ledger.** Old-format keys stay in local ledgers and go inert; the new keys contain a 40-hex SHA and cannot collide with them. The override is kept. The fresh-lineage bypass is unchanged and disclosed.
- **Archives.** Untouched.
- **Rollback.** Forward-recovery commits restore the policy text and the ledger code. No protocol cutover is involved.
- **Timing.** Live STATE is `TURN: PAULO` with no directive selected, which is a clean adoption boundary.

---

#### 6. Tests

**Attempt ledger** (`tests/context-bootstrap.test.mjs`, on a hermetic fixture):
1. Sequential legitimate publications in one cycle, with no handoff, do not falsely exhaust. This is the D-112 regression.
2. Three `BRANCH_ADVANCED` attempts across rebuilt candidates and separate invocations exhaust the same logical chain. The fourth is refused with `PUBLICATION_ATTEMPTS_EXHAUSTED`.
3. A `NOT_PUBLISHED` retry counts against the same chain.
4. `UNKNOWN_OUTCOME` return code and stop behavior are byte-for-byte unchanged.
5. Another process sharing the same ledger cannot reset the count.
6. `--transition-id` still works.
7. Old-format keys in an existing ledger are inert.
8. After `PUBLISHED` terminates a chain, the next legitimate transition gets a fresh chain and does not inherit the old count.

**RFC projection** (`tests/traceability.test.mjs`):

| # | Case | Expected |
|---|---|---|
| 1 | Missing index row | ERROR |
| 2 | Extra index row | ERROR |
| 3 | Duplicate row | ERROR |
| 4 | Stale projection | WARNING `RFC_STATUS_PROJECTION_STALE` |
| 5 | Noncanonical body status: any byte difference, including trailing whitespace | ERROR |
| 6 | Body status missing, or not at line 3 | ERROR |
| 7 | Second `Status:` line | ERROR |
| 8 | Status value outside the vocabulary | ERROR |
| 9 | Unresolved authority ref | ERROR |
| 10 | Positive case: the fully migrated tree | 0 findings |

**Migration checks:**
- `--check-only` passes on each candidate.
- The existing context-bootstrap, V2 and traceability suites pass unchanged, apart from the added cases.

---

#### 7. Measurable success criteria

**Window:** the first 10 governed transitions after adoption, or 2 cycles, whichever is longer.

**Baseline:** computed from full, non-shallow history of `MAISOGLABS_WEB_RFC022_CBR`. This clone is shallow, so it cannot be computed here.

| ID | Metric | Target |
|---|---|---|
| M1 | Owner-routing transitions per accepted Builder step, in envelope-covered work | ≥ 50% below baseline |
| M2 | Safety regressions: unauthorized flag change, out-of-scope write, production action without a Decision, `OBLIGATION_DROPPED`, missing archive, `REVIEW_ID_REUSED`, **a skipped, repeated or reordered envelope step** | **0. Any one suspends the envelope and returns to Paulo** |
| M3 | False exhaustions within a ledger lineage, and manual `--transition-id` overrides | 0 (baseline: 13 overrides) |
| M4 | Relay requests for facts the repository can answer | 0; every relay cites BC-3's reason |
| M5 | RFC validator ERRORs; owner decisions made only to fix status wording | 0 (baseline: D-081) |
| M6 | Size of files loaded every turn, at a fixed commit | `CLAUDE.md` ≤ 4.7 KB; STATE body ≤ 0.8 KB; obligations ≤ 5 KB |
| M7 | Escalation calibration | Every ESCALATED item names a consequential claim; ordinary actor-reported tests stay STANDARD with their limitation stated |
| M8 | Archive completeness | 100% |
| M9 | Remediation-counter integrity | `CURRENT_REMEDIATION_CYCLE` changes only on remediation, never on envelope progression |

---

**One consequence for the Architect to confirm or correct:** because progression neither increments nor resets the remediation counter (BC-1 point 6), one `MAX_REMEDIATION_CYCLES` limit covers remediation across the whole envelope until Paulo resets it. I believe that follows directly from "exactly as today", but it is the one place where the correction's wording leaves room for a different reading.
