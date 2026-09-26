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
| DIR-WEB-RELEASE-READINESS-0001 | MAISOGLABS_WEB_RELEASE_READINESS_REVIEW | 0a35d7731c962a929f89c9d603d573c4f7960079 | d994e5fe203d6f63cf54fe79ec7306dbf018bd3e |
| DIR-WEB-REL-002-GATE-B-0001 | MAISOGLABS_WEB_REL_002_GATE_B | 4a41ebb493603ff5c2185cf25d0b4e0b3c04102e | 5948bf07905c0e8dfd11ab05a0f41f595c7e6968 |
| DIR-WEB-REL-002-GATE-C-0001 | MAISOGLABS_WEB_REL_002_GATE_C | 7ee431258f0be71bd1590d194a059054922aad89 | c95198a1b8ee200fdf515a477b8aa04f8115276f |
| DIR-WEB-REL-002-GATE-D-0001 | MAISOGLABS_WEB_REL_002_GATE_D | 06a9ac674d462c6ad51d771d12a3b49da3ec3cae | 8e046b44b88884676b3966af1f5593c5d9024855 |
| DIR-WEB-V10-PLAN-0001 | MAISOGLABS_WEB_V10_PLANNING | 7ec56d117e215c300cf3f55ce328e7075a23286e | 6e1e9ae5616b6de44ffc41fa3e24fe8cec115034 |
