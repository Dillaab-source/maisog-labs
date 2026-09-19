# Architect Review

Status: `ARCHITECT_APPROVED — WEB-INC-004 REMEDIATION CLOSED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-027 — WEB-INC-004 Final Remediation Review

Cycle: `MAISOGLABS-WEB-INC-004-MEDIA-SUBSYSTEM`

Authority chain:

`ML-DEVOS-RFC-007 → ML-DEVOS-AS-023 → D-029 → implementation ca6a93b → ML-DEVOS-AS-026 → remediation 681fc90 → ML-DEVOS-AS-027`

Remediation base:
- `7c7e6d35c43c2e16b18d53a65c8acf06c7c3df41`

Remediation implementation:
- `681fc90dc42239c2bd5866af1c6a0d430212416a`

Remediation handoff/state:
- `3edfa51b25b8f87757eaac7096e7b2829c81e009`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.5.0`

## Independent review performed

The Architect independently inspected:

- exact remediation commit separation;
- amended `migrations/0003_web_inc_004_media.sql`;
- media-state DDL;
- DB alt-text constraint;
- JS alt-text normalization and API use;
- project-media duplicate association and duplicate slot enforcement;
- focused state/alt-text/slot regression source;
- unchanged scope boundaries through compare metadata.

Builder runtime/test/CLI results remain `ACTOR_REPORTED`.

## Findings

### AS27-F001 — PASS — remediation scope stayed bounded

The remediation commit changes exactly six files:

- `migrations/0003_web_inc_004_media.sql`
- `worker/admin/media.mjs`
- `worker/d1/media.mjs`
- `worker/d1/validate.mjs`
- `tests/worker-admin-media.test.mjs`
- `tests/worker-admin-projects.test.mjs`

No new route, table, migration number, binding, public path, journal/theme work, deployment, or Sentinel phase was added.

### AS27-F002 — PASS — AS26-F008 media-state domain fixed

The media table now enforces exactly:

`state IN ('active', 'archived')`

with default:

`active`

The immutable-field trigger intentionally excludes `state`, allowing a future separately authorized state-only transition without allowing mutation of public-affecting media metadata.

No archive HTTP endpoint exists.

Focused regression source covers:
- default active;
- active → archived;
- invalid state rejection.

`AS26-F008: CLOSED`

### AS27-F003 — PASS — AS26-F009 alt-text normalization/storage invariant fixed

Application behavior now:

1. decodes the alt-text header;
2. runs `validateAltText`;
3. normalizes with JS `.trim()`;
4. rejects empty, >300-character, control-character, and angle-bracket values;
5. stores and returns the same normalized string.

Database behavior now requires:

`alt_text = trim(alt_text)`

and:

`length(alt_text) BETWEEN 1 AND 300`

This independently rejects empty, ASCII-space-only, padded-ASCII-space, and over-limit persisted values.

Focused source covers:
- empty;
- whitespace-only API input;
- exactly 300;
- over 300;
- API normalization;
- direct DB empty/space-only/untrimmed/length rejection.

`AS26-F009: CLOSED`

### AS27-L001 — ACCEPTED LIMITATION — SQLite trim is narrower than JS trim

SQLite's default `trim()` removes ASCII space rather than every JS/Unicode whitespace category.

Therefore a hypothetical direct SQL writer could construct some non-space-whitespace edge cases that the DB CHECK alone does not normalize identically to JS.

This is accepted for WEB-INC-004 because:

- AS26-F009 explicitly required the DB to **at minimum** reject empty/space-only and >300 values;
- every authorized media-write path in this repository passes through stricter JS normalization and control-character rejection first;
- no direct-SQL media mutation capability or archive API is authorized;
- fixing full Unicode whitespace equivalence at SQLite level would add complexity disproportionate to the current local-only capability.

If a future direct database writer is introduced, this limitation must be revisited.

### AS27-F004 — PASS — AS26-F010 duplicate slot protection fixed at both layers

Application validation now independently tracks:

- duplicate association: `(mediaId, role)`;
- duplicate display slot: `(role, order)`.

Database DDL preserves:

`UNIQUE (project_revision_id, media_id, role)`

and adds:

`UNIQUE (project_revision_id, role, sort_order)`

so two different media rows cannot occupy the same role/order slot within one revision.

Focused source proves:
- duplicate association rejection;
- duplicate role/order slot rejection;
- distinct valid slots succeed;
- direct DB duplicate-slot insertion is rejected.

`AS26-F010: CLOSED`

### AS27-F005 — PASS — original WEB-INC-004 architecture remains intact

The remediation does not alter:

- local R2/D1 boundary;
- R2 → D1 compensation design;
- project-revision snapshot atomicity;
- stale-write protection;
- exact-draft preview behavior;
- public static-source boundary;
- auth/origin/type/size validation;
- immutable historical media/junction semantics.

### AS27-F006 — PASS — migration handling is appropriate pre-acceptance

RFC/AS-026 explicitly required amending `0003_web_inc_004_media.sql` in place because the migration is local-only, pre-acceptance, and undeployed.

No `0004` was introduced.

Compare evidence shows `0001`/`0002` were not changed by remediation.

### AS27-F007 — ACCEPTED ACTOR_REPORTED runtime evidence

Claude reports:

- media tests: `33/33`;
- project tests: `63/63`;
- full suite: `209/209`;
- build success;
- amended migrations applied to a fresh local D1 database;
- exactly 17 product tables;
- dry-run bindings unchanged;
- no `remote: true`;
- secret/config scan clean.

These remain `ACTOR_REPORTED`, not silently upgraded.

For this local-only repository architecture increment, independent source/diff inspection plus bounded actor-reported local runtime evidence is sufficient under CORE-020.

## Final verdict

`ML-DEVOS-AS-027: ARCHITECT_APPROVED — WEB-INC-004 LOCAL MEDIA SUBSYSTEM ACCEPTED / REMEDIATION CLOSED`

All AS-026 blocking findings are closed.

Known limitation retained:
- `AS27-L001` — SQLite default trim is narrower than JS trim for hypothetical direct-SQL edge cases.

## Post-acceptance requirement

Because WEB-INC-004 is `ARCHITECTURE`, create a durable ADR before final cycle closure.

No remote R2/D1, deployment, public cutover, protected/main merge, later WEB-INC, or Sentinel S3+ authority is created by this acceptance.
