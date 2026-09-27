# Current Directive — AS-116 Stage B Production D1 Migration Repair

```yaml
schema_version: 1
directive_id: DIR-WEB-AS116-STAGE-B-0001
cycle_id: MAISOGLABS_WEB_AS116_STAGE_B
issue_parent_commit: 84b5f2b2b2c4bc2ad5ee94541daf961419ef601d
target_turn: CLAUDE
authority_ref: D-097
applicable_review_id: ML-DEVOS-AS-124
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-097 and `ML-DEVOS-AS-124`.

## Objective

Repair AS-116 by applying the repository's existing migrations `0001`–`0005` to production D1 `maisog-labs-web-inc-005-local` (`45b87574-e573-4e0f-9bb6-fbba2df29523`), the database already bound as `DB` to active version `f473c170-b39c-4d7b-85ad-a99c5208d539`, and verify `/api/journal` and `/api/design` recover. No Worker deployment.

## Preconditions

Immediately before any remote write:

- Protocol V2 bootstrap passes; governance tip equals the published D-097 transition; STATE selects this directive with only `REMOTE_D1_AUTHORIZED: YES`.
- `main` is `7d22a96d10b5e24f5296795c2b049f77093386c3`; active production is `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100%, with no intervening deployment.
- The active version's `DB` binding is `45b87574-e573-4e0f-9bb6-fbba2df29523`; D1 metadata shows `maisog-labs-web-inc-005-local` / `45b87574-e573-4e0f-9bb6-fbba2df29523`.
- `migrations/0001`–`0005` are unchanged from the published tip.
- Working tree clean; `stash@{0}` untouched.

## Governing references

- **T0:** Protocol V2; D-097; live STATE; `ML-DEVOS-AS-124`.
- **T1:** `ML-DEVOS-AS-116`; `coordination/archive/handoffs/H-WEB-AS116-STAGE-A-0001.md`; `migrations/*.sql`; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed: read-only Cloudflare reads (deployments, versions, `d1 list`/`info`, `d1 time-travel info`); exactly one `npx wrangler d1 migrations apply maisog-labs-web-inc-005-local --remote` applying only `0001`–`0005`; public HTTP verification; at most one conditional `npx wrangler d1 time-travel restore maisog-labs-web-inc-005-local --bookmark=<PRE_MIGRATION_BOOKMARK>`; one Protocol V2 Builder return.

Not allowed: any other D1 database; creating/editing migrations; arbitrary remote SQL; extra seeding; journal content or non-canonical theme changes; Worker deploy/upload/promotion; binding, R2, Access, DNS, secret or environment changes; runtime/product code; `main`; PR #7; PR #10; S6/S7; D-068; renaming or replacing the database.

## SENTINEL Sync

**Authority:** D-097 (Paulo). **Context:** root cause accepted by AS-124; resource and migrations bound. **Capability:** one remote D1 migration of one database plus one conditional Time Travel restore; `REMOTE_D1_AUTHORIZED` grants nothing else. **Execution:** single pass with fresh identity checks and a recorded bookmark. **Evidence:** bookmark, command output, API responses, active version. Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`. The config says `remote: false` with no `database_id`; if Wrangler would resolve, create or target any database other than `45b87574-e573-4e0f-9bb6-fbba2df29523`, or list migrations other than `0001`–`0005`, stop before applying. The `-local` name and config hardening are deferred, not repaired here.

## Instructions

1. Bootstrap fresh; verify every precondition.
2. Run `npx wrangler d1 time-travel info maisog-labs-web-inc-005-local --json`; record the bookmark exactly.
3. Run `npx wrangler d1 migrations apply maisog-labs-web-inc-005-local --remote`; confirm the target database and that the pending list is exactly `0001`–`0005` before approving.
4. Verify `/api/journal` (200, empty entries), `/api/design` (200, seeded theme), `/` (200, D-093 artifact), `/journal`, `/admin` (unchanged Access behavior), and the active version.
5. Only on a new material failure caused by the migration: restore to the recorded bookmark, verify, and stop.

## Validation and evidence

Pre-migration bookmark; exact command and output; migrations applied; post-migration HTTP evidence; active version before and after; D1 metadata after; confirmation that no other remote resource was touched. Builder evidence is `ACTOR_REPORTED`.

## Stop conditions

Stop without modifying D1 if any precondition or identity differs, the bookmark cannot be captured, or Wrangler targets or proposes anything other than migrations `0001`–`0005` on `45b87574-e573-4e0f-9bb6-fbba2df29523`. After migration, take no action beyond verification and the single conditional restore.

## Next action

Publish one Protocol V2 Builder return, archive and deselect this directive, reset `REMOTE_D1_AUTHORIZED` and every action flag to `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`.
