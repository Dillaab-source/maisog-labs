# Architect Syncs (durable archive)

Introduced in S1 remediation cycle 1 (`S1-F008`). `coordination/ARCHITECT_REVIEW.md` is the rolling, current-turn Architect working surface — it is overwritten/replaced each review cycle and is **not** a durable historical record by itself. This directory is that durable record.

Once an Architect Sync concludes, its content is copied here, verbatim, as `ML-DEVOS-AS-<NNN>.md`, using `../../templates/ARCHITECT_SYNC_TEMPLATE.md`. Numbering matches the sync IDs already established in `coordination/ARCHITECT_REVIEW.md`'s history (`ML-DEVOS-AS-001`, `ML-DEVOS-AS-002`, `ML-DEVOS-AS-003`, ...).

## Current contents

- `ML-DEVOS-AS-003.md` — archived this cycle, from the exact live `coordination/ARCHITECT_REVIEW.md` content at archival time.

## Known backfill gap

`ML-DEVOS-AS-001`'s findings (`AS0-001`…`AS0-012`, amendment `AS0-001A`) and `ML-DEVOS-AS-002`'s full original findings (`S0-F001`…`S0-F008`) are **not** archived here. By the time this mechanism was created, the rolling `coordination/ARCHITECT_REVIEW.md` file had already moved past their full original text — only summary closure statements remain live in that file. This gap is disclosed rather than filled by reconstructing the missing text from conversational memory, which would not be independently verifiable against the current repository. If the full original text of AS-001/AS-002 is still available in the Architect's own records, backfilling these two files is a reasonable `PATCH`-class follow-up for a future cycle; it is not treated as required for this cycle's stage gate, since `S1-F008` asked for the durable-archive *mechanism* to exist, which it now does, with `ML-DEVOS-AS-003` as its first real (and completely verifiable) entry.

## Rule

A durable sync record, once written, is not silently rewritten. A later correction is a new sync or an explicit, separately recorded amendment — never an in-place edit that erases what a past sync actually said (`CORE-011`).
