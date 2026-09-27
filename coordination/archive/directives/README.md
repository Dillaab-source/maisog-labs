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
| DIR-WEB-V10-RFC021-0001 | MAISOGLABS_WEB_V10_RFC021_DRAFT | 4c436a8a1f8768ea2fdbf377ef22f9717ccfb810 | f7ae75b9d21049668271f9e9128836d6dd51c6d3 |
| DIR-WEB-V10-A-0001 | MAISOGLABS_WEB_V10_A | 2986489cecf4b78f42953313686513cb06cdc69d | 5ca116d7e64df5eb3c88f6fbac0bc140969b7e62 |
| DIR-WEB-V10-A-REM1-0001 | MAISOGLABS_WEB_V10_A | 114d97905352b9a9424811c6905e59ef620c712c | fd1e7c1ddd28d97270874a057a7dbcf3f6225088 |
| DIR-WEB-V10-CLEAN-0001 | MAISOGLABS_WEB_V10_CLEAN | 8dd34c8b09d0ad6ef15fbafc0096dc8c9bccfe64 | 509c5f0ac6db4fa5078bacb1155a5b7bf0687928 |
| DIR-WEB-HOMEPAGE-ARTIFACT-0001 | MAISOGLABS_WEB_HOMEPAGE_ARTIFACT | c4703e66e27871ab47ac7f33a92e9c11a8e157ca | e8eef2840231c40d4d283448959fc792bb384b5d |
| DIR-WEB-D093-GATE-C-0001 | MAISOGLABS_WEB_D093_GATE_C | 753493afb9ce71f856365eedf58bc699e2b5b7f5 | f14b384941e5b07ae921fb0d705297e9d9d6562a |
| DIR-WEB-D093-GATE-D-0001 | MAISOGLABS_WEB_D093_GATE_D | afe9703bc78ad9b7cbcd5842d17a5a18c1248ab1 | c498bb33ae3fabe11310878932cbd240f50b87b8 |
| DIR-WEB-AS116-STAGE-A-0001 | MAISOGLABS_WEB_AS116_STAGE_A | d7dc7a46672e7ce150d879f8244110328f23df67 | 87572a628970e8dc2503dc1aab17e2b6ee2e7501 |
| DIR-WEB-AS116-STAGE-B-0001 | MAISOGLABS_WEB_AS116_STAGE_B | 90895d2e3b6fa53c2074d0a756a16a4ab2f61493 | 7d6557281f95d7b8b0fc2c82bd282abf2151642d |
| DIR-WEB-AS116-HARDENING-0001 | MAISOGLABS_WEB_AS116_HARDENING | 199db5b2404aad192699de367472369b02fb87c7 | 35eb94f7f20ff2636cda3c3c8f35dfb80112dbb2 |
