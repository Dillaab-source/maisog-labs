# Directive Archive (Protocol V2)

This is the immutable byte-exact archive of every outgoing `coordination/CURRENT_DIRECTIVE.md` (`ML-DEVOS-RFC-020` §16). It was added as Stage A scaffolding under `D-079`. Protocol V2 is active since `D-080`; no directive has been published or archived yet.

**Entries:**
- `<directive_id>.md`: the exact outgoing bytes.
- `<directive_id>.provenance.json`: the directive ID, cycle ID, source path, publication commit, source blob, archive blob and SHA-256.

**Rules:**
- Entries are immutable. A directive ID that already exists with different bytes fails closed (`DUPLICATE_ID_DIFFERENT_BYTES` / `ARCHIVE_ID_CONFLICT`).
- The transition that deselects or replaces a directive must add its entry in the same commit, unless the exact bytes are already archived. The checker enforces this (`OUTGOING_DIRECTIVE_NOT_PRESERVED`, `DIRECTIVE_PROVENANCE_MISMATCH`, `DIRECTIVE_ARCHIVE_INDEX_MISSING`).
- `archiveDirective()` in `scripts/check-context-bootstrap.mjs` writes the entry and its provenance, and appends the index row below.

## Index

| ID | Cycle | Publication commit | Source blob |
|---|---|---|---|
| DIR-SPATIAL-DESIGN-V2A-0001 | MAISOGLABS_SPATIAL_DESIGN_CONTROLS_V2A_IMPLEMENTATION | 29733fc14dc1f6203e69e4da09889a27a940c9b9 | 6ef6ed735757cd466fe60e366d77a67784e28db2 |
