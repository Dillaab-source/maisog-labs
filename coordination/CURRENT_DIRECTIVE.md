# Current Directive — RFC-022 CB-R production D1 migration 0006 (D-110)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-CBR-D1-0006-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 1296c505e7b592d7fabe4cfcfa5f5bd91efb48d2
target_turn: CLAUDE
authority_ref: D-110
applicable_review_id: ML-DEVOS-AS-136
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-110 and `ML-DEVOS-AS-136`.

## Objective

Apply production D1 migration `0006` only, executed by Paulo from Paulo's locally authenticated Wrangler session. The Builder independently verifies the result read-only and returns to the Architect.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `REMOTE_D1_AUTHORIZED` is the only `YES` flag.
- `main` is `fda42e04d18b960d8212d49616f96b657a5c6bf3`.
- Production D1 is `maisog-labs-web-inc-005-local` / `45b87574-e573-4e0f-9bb6-fbba2df29523`. `d1_migrations` lists exactly `0001`–`0005`.
- `project_revisions` has none of `tagline`, `status`, `disciplines_json`, `flow_json`.
- The active production version is `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.
- `migrations/0006_rfc022_v10_project_fields.sql` is blob `45da6f6c6452e4c55a656927ca970218d071eae0`.

## Governing references

- **T0:** Protocol V2; D-110; live STATE; `ML-DEVOS-AS-136`.
- **T1:** `ML-DEVOS-RFC-022` §10 (CB-R); D-106; D-097 (remote migration precedent); `migrations/0006_rfc022_v10_project_fields.sql`.

## Exact execution scope

Owner-executed (Paulo, local Wrangler), from a checkout of `main` or of the D-110 transition:
1. `npx wrangler d1 time-travel info maisog-labs-web-inc-005-local --json` — record the bookmark (read-only).
2. `npx wrangler d1 migrations list maisog-labs-web-inc-005-local --remote` — must list only `0006_rfc022_v10_project_fields.sql` (read-only).
3. `npx wrangler d1 migrations apply maisog-labs-web-inc-005-local --remote` — exactly once; approve only if the prompt lists `0006_rfc022_v10_project_fields.sql` alone.

Builder-executed:
- read-only Cloudflare connector reads (D1 metadata, `d1_migrations`, `pragma_table_info`, row counts, Worker deployments);
- one Protocol V2 Builder return on `governance/maisoglabs-v0.1`.

Not allowed:
- the Builder running any migration or remote D1 write;
- any migration other than `0006`; editing migrations; `d1 execute --remote`; Time Travel restore;
- `site_settings` initialization; project/content writes or publication; email publication;
- Gate D; deploy; version upload; promotion; traffic change;
- R2, Access, DNS, binding, secret or environment changes;
- any `main` merge; PR #7 or PR #10.

## SENTINEL Sync

- **Authority:** D-110 (Paulo).
- **Context:** AS-136 accepted Gate C and recommended remote `0006` only.
- **Capability:** one remote migration of one database, owner-executed.
- **Execution:** Paulo runs it; the Builder only verifies.
- **Evidence:** Paulo's command output (`OWNER_REPORTED`); Builder connector reads (`ACTOR_REPORTED`).

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- The executor (Paulo) is not the Builder that publishes the return. The Builder must not treat the migration as applied on Paulo's report alone; it verifies production D1 through the connector first.
- `0006` only adds four nullable columns. Existing rows stay valid, and the active version `53137101…` does not read them.
- A Time Travel restore is not authorized here. A new material failure stops the cycle and returns to Paulo.

## Instructions

1. Publish D-110, then return the exact commands to Paulo and stop.
2. On Paulo's report: re-bootstrap, then verify read-only through the connector.
3. Publish the return.

## Validation and evidence

- The D-110 publication SHA.
- Paulo's bookmark, command and output.
- `d1_migrations` lists `0001`–`0006`.
- `project_revisions` has `tagline`, `status`, `disciplines_json`, `flow_json`.
- Row counts unchanged: `theme_settings` 1, `theme_settings_revisions` 1, every other content table 0.
- The active version is still `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.

## Stop conditions

- Any precondition or identity differs.
- Wrangler targets another database, or lists anything other than `0006` as pending.
- Post-migration verification fails, or row counts or the active version changed. Stop and report, without remediating.
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-RFC022-CBR-D1-0006-0001`. Archive and deselect this directive, reset `REMOTE_D1_AUTHORIZED` and every flag to `NO`, and route `TURN: ARCHITECT`.
