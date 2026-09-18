# Architect Syncs (durable archive)

Introduced in S1 remediation cycle 1 (`S1-F008`). `coordination/ARCHITECT_REVIEW.md` is the rolling, current-turn Architect working surface — it is overwritten/replaced each review cycle and is **not** a durable historical record by itself. This directory is that durable record.

Once an Architect Sync concludes, its content is copied here, verbatim, as `ML-DEVOS-AS-<NNN>.md`, using `../../templates/ARCHITECT_SYNC_TEMPLATE.md`. Numbering matches the sync IDs already established in `coordination/ARCHITECT_REVIEW.md`'s history (`ML-DEVOS-AS-001`, `ML-DEVOS-AS-002`, `ML-DEVOS-AS-003`, ...).

## Current contents

- `ML-DEVOS-AS-001.md` — backfilled in S1 remediation cycle 2 (`S1-F008`), from actual Git history at `571146a06cba1ddc996fd68cd25a68fa4544c5ec` (original findings) and `ce53eceb4a8da38f09f971c8fb20b4b618552010` (the `AS0-001A` amendment).
- `ML-DEVOS-AS-002.md` — backfilled in S1 remediation cycle 2 (`S1-F008`), from actual Git history at `5962c978e363745d8bbea8b39b3aff7ae0711329` (full initial `S0-F001`…`S0-F008` findings) and `af76cc7b3e6188caa5d2881f7dccb41511f5cd05` (final S0 closure/approval).
- `ML-DEVOS-AS-003.md` — archived in S1 remediation cycle 1, from the exact live `coordination/ARCHITECT_REVIEW.md` content at archival time.
- `ML-DEVOS-AS-004.md` — archived at S1 closure (`D-013`, `ML-DEVOS-ADR-001`), spanning the initial S1 review and all three remediation cycles under one continuous sync ID, concluding `SENTINEL S1 TECHNICAL STAGE GATE: ARCHITECT_APPROVED`.
- `ML-DEVOS-AS-005.md` — final S1 activation/v1.3.0 closure verification. Initially paused on D-013 human-approval provenance, then closed `ARCHITECT_APPROVED` after Paulo directly confirmed D-013; confirmation is recorded as `D-014`.
- `ML-DEVOS-AS-006.md` — archived at S2 closure (`D-017`), spanning the initial `ML-DEVOS-RFC-001` review (`CHANGES_REQUESTED`, findings `S2-F001`…`S2-F007`) and the final RFC approval (`ARCHITECT_APPROVED — PAULO S2 IMPLEMENTATION DECISION REQUIRED`) under one continuous sync ID.
- `ML-DEVOS-AS-007.md` — archived at S2 closure (`D-017`), the S2 implementation review concluding `SENTINEL S2 TECHNICAL STAGE GATE: ARCHITECT_APPROVED` and routing the closure/`v1.4.0` decision to Paulo.

## Backfill gap — CLOSED (S1-F008, remediation cycle 2)

Remediation cycle 1 disclosed that `ML-DEVOS-AS-001`/`AS-002`'s full original findings text was not archived, believing the rolling `coordination/ARCHITECT_REVIEW.md` file had permanently moved past their full original text. The Architect's cycle-2 review (`ML-DEVOS-AS-004`) correctly identified that this belief was factually wrong: Git history preserves every prior version of that file regardless of how many times it has since been overwritten. This cycle retrieved the exact historical content with `git show <SHA>:coordination/ARCHITECT_REVIEW.md` against the commits cited above — not reconstructed from conversational memory — and archived it as `ML-DEVOS-AS-001.md`/`ML-DEVOS-AS-002.md`. No backfill gap remains for these two syncs.

## Rule

A durable sync record, once written, is not silently rewritten. A later correction is a new sync or an explicit, separately recorded amendment — never an in-place edit that erases what a past sync actually said (`CORE-011`).
