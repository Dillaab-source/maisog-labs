# Current Handoff — RFC-022 CB-R production D1 migration 0006 (D-110)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-CBR-D1-0006-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: c727700f37275f136f525520972da89752f93bcf
review_target_commit: c727700f37275f136f525520972da89752f93bcf
applicable_review_id: ML-DEVOS-AS-136
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence classes:
- **`OWNER_REPORTED`:** Paulo's local Wrangler bookmark, command and output. The Builder did not see this output directly.
- **`ACTOR_REPORTED`:** the Builder's own Cloudflare MCP/API connector reads in this session. Every one was read-only: D1 `SELECT`/`pragma` and HTTP `GET` only.

## Objective

Execute `DIR-WEB-RFC022-CBR-D1-0006-0001` (D-110): apply production D1 migration `0006` only, owner-executed, and independently verify the result.

## Result

**Migration `0006` applied to production D1 and independently verified. Existing data and production traffic unchanged.**

| Item | Value |
|---|---|
| D-110 publication | `c727700f37275f136f525520972da89752f93bcf` (parent `1296c505…`, the AS-136 tip) |
| Database | `maisog-labs-web-inc-005-local` / `45b87574-e573-4e0f-9bb6-fbba2df29523` |
| Executor | Paulo, from a locally authenticated Wrangler session. The Builder ran no migration and made no D1 write. |
| Pre-migration bookmark | `00000173-00000000-000050f4-6cab41e7205b23306c18fe609d33a7cc` (`OWNER_REPORTED`) |
| `0006` applied at | `2026-09-28 19:50:34` UTC, per production `d1_migrations` |
| Active version before and after | `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%, deployment `3bf053d6-56b8-4412-a96a-a587588f8521`. Unchanged. |

## Tests and evidence

### Owner-executed migration (`OWNER_REPORTED`)

- `npx wrangler d1 time-travel info maisog-labs-web-inc-005-local --json` returned bookmark `00000173-00000000-000050f4-6cab41e7205b23306c18fe609d33a7cc`.
- `npx wrangler d1 migrations list maisog-labs-web-inc-005-local --remote` showed exactly one pending migration: `0006_rfc022_v10_project_fields.sql`.
- `npx wrangler d1 migrations apply maisog-labs-web-inc-005-local --remote` reported:
  - remote database `maisog-labs-web-inc-005-local`, ID `45b87574-e573-4e0f-9bb6-fbba2df29523`;
  - exactly one migration applied: `0006_rfc022_v10_project_fields.sql` → SUCCESS;
  - 5 commands executed.

### Pre-migration production readings (`ACTOR_REPORTED`, before D-110 publication)

- D1 metadata: name `maisog-labs-web-inc-005-local`, version `production`, 23 tables (Cloudflare's count), file size 278528.
- `d1_migrations`: exactly `0001`–`0005`, applied 2026-09-27 02:16:51–55.
- `project_revisions`: 13 columns (`id` … `created_by`); none of `tagline`, `status`, `disciplines_json`, `flow_json`.
- Row counts: `theme_settings` 1, `theme_settings_revisions` 1. These 20 tables had 0 rows each: `audit_log`, `foundations`, `foundation_revisions`, `journal_entries`, `journal_entry_revisions`, `journal_media`, `media`, `navigation`, `navigation_revisions`, `process_steps`, `process_step_revisions`, `project_media`, `projects`, `project_revisions`, `sections`, `section_revisions`, `services`, `service_revisions`, `site_settings`, `site_settings_revisions`.
- Latest deployment: `3bf053d6…` (created 2026-09-28T07:21:06Z), `53137101…` @ 100%.

### Post-migration verification (`ACTOR_REPORTED`)

Read after Paulo's report, on governance tip `c727700…` (Protocol V2 bootstrap `ok: true`; `main` still `fda42e04d18b960d8212d49616f96b657a5c6bf3`).

- **Migrations:** `d1_migrations` has 6 rows: `0001`–`0005` (unchanged timestamps) and `0006_rfc022_v10_project_fields.sql` @ `2026-09-28 19:50:34`. **PASS**
- **Columns:** `project_revisions` has 17 columns. The 13 original columns are unchanged; the new ones are `tagline` (cid 13), `status` (14), `disciplines_json` (15), `flow_json` (16), all `TEXT`, nullable, no default. **PASS**
- **Constraints:** the stored DDL carries the `0006` CHECK constraints verbatim: `tagline` trimmed, length 1–160; `status` in (`''`, `'Active'`). **PASS**
- **Row counts:** identical to the pre-migration readings: `theme_settings` 1, `theme_settings_revisions` 1, all 20 other tables 0 (including `site_settings`, `site_settings_revisions` and `audit_log`). `sqlite_master` table count is 25, as before. **PASS**
- **Size:** file size 278528 → 282624 bytes (+4096, one page), consistent with the DDL change alone.
- **Traffic:** the latest deployment is still `3bf053d6…` from 07:21:06Z. `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%. **PASS**
- **Bindings:** the active version's bindings are `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN` (plain text), `ASSETS`, `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523`, and `MEDIA` → R2 `maisog-labs-web-inc-004-local`. They are as expected. **PASS**

### No other production change

- **Not done:** the Builder ran no migration, remote SQL write, Time Travel restore, `site_settings` initialization, project/content write or publication, email publication, deploy, `wrangler versions deploy`, promotion or traffic change. Nor did it change R2, Access, DNS, bindings, secrets or environment, or merge anything to `main`.
- **Automatic uploads.** Three inactive non-production versions were uploaded today by Workers Builds (`workers/triggered_by: version_upload`), each about a minute after a git push:
  - `07656f90…` (#818, 19:25:53Z, alias `governance-maisoglabs-v0-1`), after the AS-136 publication `1296c50` (19:24:50Z);
  - `4e4d3f58…` (#819, 19:44:00Z, alias `governance-maisoglabs-v0-1`), after the D-110 publication `c727700` (19:43:07Z);
  - `bdea7046…` (#820, 19:44:44Z, alias `claude-rfc-022-cb-r-migration-0gx6b9`), after the Builder's push of its session branch.

  None was deployed. The deployments list is unchanged.
- **Not proven by this Builder:** the absence of Access, DNS or R2 changes made outside the Worker/D1 surfaces read here. Those surfaces were not inspected. No action in this cycle targeted them.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-CBR-D1-0006-0001.{md,provenance.json}` (byte-for-byte, blob `8bd92aa…`) and the index row.
- **Unchanged:** `coordination/OPERATIVE_OBLIGATIONS.md`. The outgoing `H-WEB-RFC022-GATE-C-0001` was already archived at AS-136.
- **Outside this commit:** production D1 schema (`0006`), owner-executed. No product, test or migration file change.

## Unresolved findings and limitations

- **Evidence split.** Migration execution is `OWNER_REPORTED`; the Builder saw only its effect, not the Wrangler output. The resulting state is `ACTOR_REPORTED`, and none of it is Architect-reproduced.
- **Recovery.** The bookmark `00000173-00000000-000050f4-6cab41e7205b23306c18fe609d33a7cc` is `OWNER_REPORTED`; the Builder did not read it back. Any restore needs a separate Paulo decision.
- **Activation prerequisites (AS-135) remaining:** production project content (including approved Eternal Eggs copy), `site_settings` initialization, and confirmed email deliverability. Production `0006` is now satisfied. RFC-022 §7 test 11 still needs production measurements.
- **Gate D not ready.** Gate D / promotion of the RFC-022 `main` version `6ca2ddfe…` remains separately gated. Schema is no longer a blocker, but the activation prerequisites above still are.
- **Session-branch preview.** The Builder's session branch push created a preview upload (`bdea7046…`). It is harmless and inactive, but future returns should avoid pushing extra branches that trigger uploads.
- **Carried forward:** AS132-F003 remains open; the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- D1 `45b87574-e573-4e0f-9bb6-fbba2df29523`: `d1_migrations`, `pragma_table_info('project_revisions')`, `sqlite_master`.
- Worker `maisog-labs`: deployment `3bf053d6-56b8-4412-a96a-a587588f8521`; active version `53137101-afb8-456c-ab83-d8b7b934df01`; inactive uploads `07656f90…`, `4e4d3f58…`, `bdea7046…`.
- Account: `fb7234ae9117baf1481ab3b169a9824a`.

## Governing references

- **T0:** Protocol V2; D-110; `ML-DEVOS-AS-136`.
- **T1:** `ML-DEVOS-RFC-022` §10 (CB-R); D-106; D-097 (remote migration precedent); `migrations/0006_rfc022_v10_project_fields.sql`.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-CBR-D1-0006-0001.md`.

## Next action

The Architect reviews the `0006` return. `site_settings` initialization, project content, email publication, Gate D and promotion each need separate Paulo authorization.
