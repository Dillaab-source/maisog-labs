# Architect Syncs (durable archive)

Introduced in S1 remediation cycle 1 (`S1-F008`). `coordination/ARCHITECT_REVIEW.md` is the rolling, current-turn Architect working surface — it is overwritten/replaced each review cycle and is **not** a durable historical record by itself. This directory is that durable record.

Once an Architect Sync concludes, its content is copied here, verbatim, as `ML-DEVOS-AS-<NNN>.md`, using `../../templates/ARCHITECT_SYNC_TEMPLATE.md`. Numbering matches the sync IDs already established in `coordination/ARCHITECT_REVIEW.md`'s history (`ML-DEVOS-AS-001`, `ML-DEVOS-AS-002`, `ML-DEVOS-AS-003`, ...).

## Current contents

- `ML-DEVOS-AS-001.md` — backfilled in S1 remediation cycle 2 (`S1-F008`), from actual Git history at `571146a06cba1ddc996fd68cd25a68fa4544c5ec` (original findings) and `ce53eceb4a8da38f09f971c8fb20b4b618552010` (the `AS0-001A` amendment).
- `ML-DEVOS-AS-002.md` — backfilled in S1 remediation cycle 2 (`S1-F008`), from actual Git history at `5962c978e363745d8bbea8b39b3aff7ae0711329` (full initial `S0-F001`…`S0-F008` findings) and `af76cc7b3e6188caa5d2881f7dccb41511f5cd05` (final S0 closure/approval).
- `ML-DEVOS-AS-003.md` — archived in S1 remediation cycle 1, from the exact live `coordination/ARCHITECT_REVIEW.md` content at archival time.
- `ML-DEVOS-AS-004.md` — archived at S1 closure (`D-013`, `ML-DEVOS-ADR-001`), spanning the initial S1 review and all three remediation cycles under one continuous sync ID, concluding `SENTINEL S1 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`.
- `ML-DEVOS-AS-005.md` — final S1 activation/v1.3.0 closure verification. Initially paused on D-013 human-approval provenance, then closed `ARCHITECT_APPROVED` after Paulo directly confirmed D-013; confirmation is recorded as `D-014`.
- `ML-DEVOS-AS-006.md` — rebuilt in S2 closure remediation cycle 1 (`S2-C005`). Reproduces the full, byte-for-byte content of `coordination/ARCHITECT_REVIEW.md` at `b613c62` (initial review, `CHANGES_REQUESTED`, findings `S2-F001`…`S2-F007`) and `f6ee953` (final review, `ARCHITECT_APPROVED — PAULO S2 IMPLEMENTATION DECISION REQUIRED`), each inside its own fenced block with no heading-level changes or paraphrasing. Mechanically verified this cycle: extracting each fenced block and diffing against `git show <SHA>:coordination/ARCHITECT_REVIEW.md` returns no difference.
- `ML-DEVOS-AS-007.md` — rebuilt in S2 closure remediation cycle 1 (`S2-C005`). Reproduces the full, byte-for-byte content of `coordination/ARCHITECT_REVIEW.md` at `69ba513` (concluding `SENTINEL S2 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`, unchanged through `7b83ef0`) inside a fenced block. Mechanically verified the same way.

## Backfill gap — CLOSED (S1-F008, remediation cycle 2)

Remediation cycle 1 disclosed that `ML-DEVOS-AS-001`/`AS-002`'s full original findings text was not archived, believing the rolling `coordination/ARCHITECT_REVIEW.md` file had permanently moved past their full original text. The Architect's cycle-2 review (`ML-DEVOS-AS-004`) correctly identified that this belief was factually wrong: Git history preserves every prior version of that file regardless of how many times it has since been overwritten. This cycle retrieved the exact historical content with `git show <SHA>:coordination/ARCHITECT_REVIEW.md` against the commits cited above — not reconstructed from conversational memory — and archived it as `ML-DEVOS-AS-001.md`/`ML-DEVOS-AS-002.md`. No backfill gap remains for these two syncs.

## Known open item — legacy "verbatim" claims not yet re-verified (disclosed, out of this cycle's scope)

S2 closure remediation cycle 1 (`S2-C005`) found that `ML-DEVOS-AS-006.md` and `ML-DEVOS-AS-007.md` claimed verbatim preservation while actually containing a restructured narrative summary, and corrected them to genuine byte-for-byte fenced reproductions, mechanically verified by extraction-and-diff against the cited Git snapshots (see above). `ML-DEVOS-AS-001.md`, `ML-DEVOS-AS-002.md`, and `ML-DEVOS-AS-004.md` make the same style of "verbatim" claim, using the same restructured-narrative-with-"Part N"-headers pattern that turned out to be false for AS-006/AS-007 — they have **not** been re-verified against their cited historical snapshots in this cycle, since the Architect's `S2-C005` finding and this cycle's authorized remediation scope named only `ML-DEVOS-AS-006`/`ML-DEVOS-AS-007`. Whether the same defect applies to `ML-DEVOS-AS-001`/`002`/`004` is disclosed as an open question, not asserted either way, and is not remediated by this cycle.

## Rule

A durable sync record, once written, is not silently rewritten. A later correction is a new sync or an explicit, separately recorded amendment — never an in-place edit that erases what a past sync actually said (`CORE-011`).
