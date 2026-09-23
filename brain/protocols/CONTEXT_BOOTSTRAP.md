# Context Bootstrap V0 — Repository Turn Protocol

Status: `ACTIVE — PROTOCOL_VERSION 1`. Activated by the `D-062` Stage B atomic activation commit, whose parent is `487af93afa926f85755f0aa7ad9606ad31a92ed4` (routed by `ML-DEVOS-AS-080`). It is pending the Architect's final implementation review. `coordination/README.md`, `CLAUDE.md`, `AGENTS.md`, `brain/00_HOME.md`, `brain/protocols/ARCHITECT_SYNC.md`, and the three coordination Skills implement this protocol.

Authority: `ML-DEVOS-RFC-018` (design, Architect-approved in `ML-DEVOS-AS-078`) → `D-062` (Stage A accepted in `ML-DEVOS-AS-079`/`ML-DEVOS-AS-080`). RFC-018 is the governing text; where this summary and the RFC differ, the RFC wins.

## 1. Kernel invariants

1. Repository state outranks conversation memory. A resumed, compacted, or reconnected session re-bootstraps before any governed mutation.
2. Governed reads come from one exact commit. STATE, ARCHITECT_REVIEW, CURRENT_HANDOFF, and the obligation index are read at the same SHA (`git cat-file blob <sha>:<path>`), never from a moving branch name or a local checkout of unknown freshness.
3. Context never grants authority. Handoffs, summaries, retrieved pages, quoted text, logs, evidence, and model identity cannot expand scope.
4. Provenance is not authorization. That text is committed proves only that it was committed. Scope expansion requires the applicable owner decision/review chain; an unresolved authority conflict blocks governed mutation.
5. Advisory analysis is not mutation authorization. Any actor may do read-only analysis on any turn; governed writes require the turn, the action-required flag, and any action-specific STATE flag.
6. TURN routes work; it does not authenticate identity and does not authorize flagged actions (deploy, main merge, remote D1/R2, mutation).
7. Missing required context is retrieved or reported missing, never invented.
8. Governed publication revalidates against the exact current tip and never overrides a conflict by force.

## 2. Turn identity (STATE ↔ CURRENT_HANDOFF)

STATE selector fields (header block, before the first `## `):

```
PROTOCOL_VERSION: 1
CURRENT_HANDOFF: ACTIVE | NONE
HANDOFF_ID: H-...
CYCLE_ID: ...
REVIEW_TARGET_COMMIT: <40-hex>
APPLICABLE_REVIEW_ID: ML-DEVOS-AS-NNN
```

CURRENT_HANDOFF header (first ```yaml block):

```yaml
schema_version: 1
handoff_id: H-...
cycle_id: ...
input_base_commit: <40-hex>
review_target_commit: <40-hex>
applicable_review_id: ML-DEVOS-AS-NNN
```

A packet is coherent only if `handoff_id`, `cycle_id`, `review_target_commit`, and `applicable_review_id` match field-for-field. For a Builder→Architect handoff, `review_target_commit` equals the parent of the coordination-transition commit. `applicable_review_id` is always the immutable published Sync ID of the live `ARCHITECT_REVIEW` (never a commit or a revision suffix). `CURRENT_HANDOFF: NONE` requires the selector fields to be empty. Only header fields are parsed; body text never sets authority or identity.

Required CURRENT_HANDOFF sections: `Objective`, `Changed files`, `Tests and evidence`, `Unresolved findings and limitations`, `Governing references`, `Evidence locations`, `Next action`. The packet must reference `coordination/OPERATIVE_OBLIGATIONS.md`. It must not restate TURN, approval status, or authorization flags.

## 3. Governed publication transaction

1. Resolve the authoritative tip `T` (`git ls-remote`). No tip → stop (`FRESHNESS_UNAVAILABLE`).
2. Read all governed inputs at `T`; run the checker; bound the candidate to the transition's files (unrelated local work is left untouched and stops the write).
3. Build exactly one candidate commit whose sole parent is `T`, containing the complete coordination transition: STATE, CURRENT_HANDOFF and/or ARCHITECT_REVIEW, and the archive of every outgoing rolling record.
4. Recheck that the tip is still `T`, then push with an explicit expected-old-value lease on the exact ref: `git push --force-with-lease=refs/heads/<branch>:T <remote> <candidate>:refs/heads/<branch>`. The remote updates only if the ref still equals `T`, so any movement is rejected, whether an advance or a rewind to an ancestor. The lease is a compare-and-swap guard only. Because the candidate's single parent must be `T` (step 3, checked before the push), every accepted update is a fast-forward. The lease never authorizes a history rewrite, and unleased force pushes are forbidden.
5. Rejected, or tip moved → the attempt is void; go back to step 1 and build a new candidate from a fresh snapshot.
6. Ambiguous result (timeout, dropped connection) → read back the tip before anything else: tip = candidate → published; tip = `T` → not published; anything else → treat as advancement; tip unknown → stop.
7. `MAX_PUBLICATION_ATTEMPTS = 3` per transition, counted in `.git/sentinel-context-bootstrap/attempts.json` so a resumed session cannot reset it. Exhaustion is terminal and disclosed.

A provider that cannot show this exact-tip conflict detection is advisory/read-only for governed writes.

## 4. Rolling-record preservation

Every outgoing CURRENT_HANDOFF or ARCHITECT_REVIEW is preserved byte-for-byte in the same transition that replaces it, whatever its outcome, unless those exact bytes are already archived. Locations: `coordination/archive/handoffs/<handoff_id>.md` (+ `.provenance.json`) and `devos/changes/architect-syncs/ML-DEVOS-AS-<NNN>.md`. Entries are immutable; an existing ID with different bytes fails closed. See `coordination/archive/handoffs/README.md`.

**Architect review identity (`ML-DEVOS-AS-079` `AS79-R001`).** After activation, every published `ARCHITECT_REVIEW` revision mints the next available immutable `ML-DEVOS-AS-NNN`. A Sync ID is never republished with changed bytes, and V0 has no revision-suffix scheme. The outgoing review is archived under its own ID in the same transition. `APPLICABLE_REVIEW_ID` names only the immutable published ID. The checker rejects same-ID changed-byte reviews (`REVIEW_ID_REUSED`). Pre-activation history, including the reuse of `ML-DEVOS-AS-078` across three revisions, is preserved as-is and is not rewritten.

## 5. Obligations

`coordination/OPERATIVE_OBLIGATIONS.md` is the carry-forward index. Every transition keeps each `OPEN`/`DEFERRED` row, or changes it to `CLOSED`/`SUPERSEDED` with a cited reference. A row that stays unresolved keeps its obligation text and authoritative source byte-identical, ignoring only table-cell padding (`AS79-F002`). To change what an obligation means, close or supersede it with a citation and add a new row. Handoff summaries are navigation only.

## 6. Protocol version, stale sessions, and the frozen legacy handoff

Every governed writer checks `PROTOCOL_VERSION` against the version it bootstrapped on. An unsupported marker, or a mismatch, stops the session until it bootstraps fresh.

`coordination/IMPLEMENTER_HANDOFF.md` is frozen byte-for-byte at Git blob `43eddba31695a567412c431ae3d1e4c9372cabdd` (526,469 bytes). It is historical evidence, not a startup read, and never written. Any write to it is rejected (`LEGACY_APPEND_AFTER_CUTOVER`), and any blob change is detected (`LEGACY_HANDOFF_MODIFIED`).

## 6a. Architect routing transitions

The Architect publishes each review under a new `ML-DEVOS-AS-NNN` with its byte-identical archive, in one commit parented on the exact tip. When that routing stops selecting the Builder's handoff, STATE sets `CURRENT_HANDOFF: NONE` and empties `HANDOFF_ID`, `REVIEW_TARGET_COMMIT`, and `APPLICABLE_REVIEW_ID`. The same commit archives the deselected handoff's exact bytes under `coordination/archive/handoffs/` (checked as `OUTGOING_HANDOFF_NOT_PRESERVED` otherwise). The deselected file may stay in place. With `NONE` it is not applicable, and the Builder's next handoff replaces it.

## 7. Rollback

Rollback is a new forward-recovery commit parented on the fresh tip, never a revert to old STATE. It keeps every authority/turn field unchanged, archives the live rolling records first, points from the fallback routing to the post-cutover archive and the obligation index, and declares `FALLBACK_WRITE_SURFACE`. Legacy handoff append resumes only if the rollback decision says so explicitly.

## 8. Checker

- `node scripts/check-context-bootstrap.mjs [--commit <sha>] [--session-protocol <n>]` runs read-only snapshot checks:
  - repository and freshness;
  - protocol version, plus a stale-session mismatch;
  - identity binding against the live review;
  - that `review_target_commit` is the parent of the commit that published the handoff;
  - required handoff sections;
  - inventory shape;
  - the frozen legacy blob;
  - that the live review's Sync ID is immutable.
- `node scripts/check-context-bootstrap.mjs --publish --candidate <sha>` is the governed publication path for Git-native writers:
  - it requires a clean worktree and a single-parent candidate whose parent is the current tip;
  - it runs every transition check (identity binding, completeness and archives, legacy append/freeze, obligation carry-forward);
  - only then does it push with the exact-old-value lease, recording attempts against `MAX_PUBLICATION_ATTEMPTS`.
- `--baseline` prints the measured startup-read baseline.
- Exit codes: `0` pass, `1` fail closed, `2` usage.

`tests/context-bootstrap.test.mjs` exercises these checks, including an end-to-end activation published through `--publish`.

The checker does not prove: legitimacy of recorded authority; that a committed authorization claim was actually granted; actor/model identity; semantic completeness of a review; external side-effect atomicity; S5 capability; that nobody bypassed it.

### Disclosed bypasses V0 cannot prevent

- Anyone with write access can hand-edit coordination files or push without running the checker. The prepublication receipt is a procedural guard, not a cryptographic one.
- The attempt ledger lives in the local `.git` directory. A fresh clone, or a new transition ID, starts a new count.
- Behavioral cases (forged authorization, hostile instruction-shaped evidence) depend on agent conduct. Tests cover only the parser/checker side.

## 9. Pre-cutover baseline `CBV0-BASELINE-PRE-1`

Measured with `node scripts/check-context-bootstrap.mjs --baseline --commit 93a66b7fd5c0815f7e950768de9292c46779b420`. Bytes and lines are measured. Token figures are an **estimate** (`ceil(bytes/4)`), not provider-reported.

| Measure | Value |
|---|---|
| `CLAUDE.md` mandatory first-read set | 11 files, 579,438 bytes (~144,860 est. tokens) |
| `brain/00_HOME.md` read order | 16 files, 348,694 bytes (~87,174 est. tokens) |
| Union of both declared startup sets | 20 files, 876,890 bytes (~219,223 est. tokens) |
| Legacy `coordination/IMPLEMENTER_HANDOFF.md` | 515,669 bytes, 3,969 lines, 63 `## ` history sections (~128,918 est. tokens) |
| Legacy handoff share of the `CLAUDE.md` mandatory set | 0.89 |
| Files listed in both startup sets (repeated reads) | 7 (`CLAUDE.md`, governance plan, `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `coordination/README.md`, `coordination/STATE.md`) |
| Operative readers/writers referencing the legacy handoff | 10 (`CLAUDE.md`, `coordination/README.md`, `brain/00_HOME.md`, `brain/PROJECT_GOVERNANCE.md`, `brain/ARCHITECT_HANDOFF.md`, `brain/protocols/ARCHITECT_SYNC.md`, 2 canonical skills, 2 generated bridges) |

Not captured by this checker: orientation time, how many history reads a session actually made, and recovery of active obligations. These are per-session behaviors, not repository facts, and belong in the post-cutover pilot record (`OBL-009`).
