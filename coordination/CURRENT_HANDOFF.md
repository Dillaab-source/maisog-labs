# Current Handoff — AS-116 Production API Incident Stage A (D-096)

```yaml
schema_version: 1
handoff_id: H-WEB-AS116-STAGE-A-0001
cycle_id: MAISOGLABS_WEB_AS116_STAGE_A
input_base_commit: d7dc7a46672e7ce150d879f8244110328f23df67
review_target_commit: d7dc7a46672e7ce150d879f8244110328f23df67
applicable_review_id: ML-DEVOS-AS-123
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result here is `ACTOR_REPORTED`: Cloudflare reads were made read-only with authenticated `wrangler` from Paulo's local clone; production HTTP requests were public GETs.

## Objective

Execute `DIR-WEB-AS116-STAGE-A-0001` (D-096): find the root cause of production `GET /api/design` and `GET /api/journal` HTTP 500 / Worker Error 1101 (AS-116); remediate in repository/local scope only if the cause allows it.

## Result

**Root cause proven. It is not correctable in repository/local scope. No code was changed.**

The production Worker's `DB` binding **is present** and points to a real remote D1 database, `maisog-labs-web-inc-005-local` (`45b87574-e573-4e0f-9bb6-fbba2df29523`), that **has never had the schema migrations applied**. Every public query therefore throws `D1_ERROR: no such table: …`; the handlers do not catch it, and the uncaught exception surfaces as Worker Error 1101 / HTTP 500. The handlers' 503 path is not reached because `env.DB` is defined.

## Evidence

1. **Production reproduction** (2026-09-27, public GET): `/api/design` → 500 `error code: 1101`; `/api/journal` → 500 `error code: 1101`; `/api/journal/does-not-exist` → 500; `/api/journal/` (no D1 access, routed to the non-DB 404) → 404 JSON. The Worker runs; only DB-touching paths fail.
2. **Production bindings** (`wrangler versions view f473c170-b39c-4d7b-85ad-a99c5208d539 --json`, read-only): `d1` `DB` → `45b87574-e573-4e0f-9bb6-fbba2df29523`; `r2_bucket` `MEDIA` → `maisog-labs-web-inc-004-local`; `assets` `ASSETS`; plain-text `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`.
3. **Bound database** (`wrangler d1 list` / `d1 info`, read-only): name `maisog-labs-web-inc-005-local`, created 2026-09-18T16:54:42Z, WNAM, 12.3 kB (consistent with an empty SQLite file), 0 reads/writes reported. `num_tables` reads 0, but that metric is also 0 for `maisog-cms` (139 kB), so it is not relied on.
4. **Production exception logs** (`wrangler tail maisog-labs --format json`, read-only, while issuing one GET each):
   - `/api/journal` → `Error: D1_ERROR: no such table: journal_entries: SQLITE_ERROR`
   - `/api/design` → `Error: D1_ERROR: no such table: theme_settings: SQLITE_ERROR`
5. **Local reproduction** (Miniflare via `getPlatformProxy`, `remoteBindings: false`, throwaway state; scratch script outside the repository):

   | Condition | `/api/journal` | `/api/design` |
   |---|---|---|
   | `DB` absent | 503 | 503 |
   | `DB` bound, unmigrated | throws `no such table: journal_entries` | throws `no such table: sections` (parallel query; production raised `theme_settings` first) |
   | `DB` bound, migrations 0001–0005 applied | 200 `{"entries":[]}` | 200 with the seeded default theme |

   Production matches the "bound, unmigrated" row exactly.

## How the database got there (strongest proven cause)

`wrangler.jsonc` declares `DB` with `database_name: maisog-labs-web-inc-005-local`, `remote: false` and **no `database_id`**; `MEDIA` likewise names `maisog-labs-web-inc-004-local` with `remote: false`. Both remote resources exist in the account with exactly those names, the D1 created on 2026-09-18 (the day `e0304a8` added the binding) and the R2 bucket on 2026-09-19 (the day `ca6a93b` added it). This is consistent with Wrangler 4 automatic resource provisioning creating the named resources on a deploy/upload when no ID is given. `remote: false` affects only local development; it does not stop a deployed Worker binding to a real remote resource. The provisioning event itself (actor and command) is **not directly evidenced**.

**Consequence:** the `wrangler.jsonc` comments stating the D1 binding "can never target a production D1 database under any invocation" (and the equivalent R2 comment) are false for deployed versions. Production `DB` and `MEDIA` are real, auto-created remote resources. The admin path currently fails closed (`/admin` → 302; Access variables are placeholders), so no production write path is known to be reachable, but this should be treated as a finding.

## Changed files

No website, runtime, Worker, migration, configuration or test file changed. This Builder return commit changes only:

- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to `TURN: ARCHITECT`, directive deselected, every action flag `NO`.
- `coordination/archive/directives/DIR-WEB-AS116-STAGE-A-0001.md` and `.provenance.json`: byte-identical archive of the executed directive (blob `87572a628970e8dc2503dc1aab17e2b6ee2e7501`, publication `d7dc7a4`).
- `coordination/archive/directives/README.md`: the archive index row.

## Tests and evidence

- The existing repository suites for these handlers (`tests/worker-public-journal.test.mjs`, `tests/worker-public-design.test.mjs`) already cover the migrated and absent-DB states and passed in this clone earlier in the session; they do not cover "bound but unmigrated".
- No `--remote` D1 command, remote write, binding change, deploy or upload was run.

## Proposed production change (not executed; requires Paulo)

**Option 1 — migrate the currently bound database (smallest change; no Worker deploy):**
- Resource: D1 `maisog-labs-web-inc-005-local` (`45b87574-e573-4e0f-9bb6-fbba2df29523`), the database the active version `f473c170…` already binds.
- Change: apply `migrations/0001`–`0005` (22 tables; 0005 seeds the default theme), e.g. `npx wrangler d1 migrations apply maisog-labs-web-inc-005-local --remote`. The exact command must be verified against `remote: false` in the config before execution.
- Expected result: `/api/journal` → 200 with an empty entry list (no journal content exists); `/api/design` → 200 with the seeded theme. The D-093 homepage artifact does not call either endpoint; `/journal` would show an empty list instead of an error.
- Rollback: record the D1 Time Travel bookmark first (`wrangler d1 time-travel info …`), then restore to it if needed; the database is currently empty, so there is no data at risk.
- Requires: `REMOTE_D1_AUTHORIZED: YES` for exactly this operation.
- Drawback: it entrenches an auto-provisioned database with a `-local` name as the de facto production database.

**Option 2 — deliberate production database (cleaner; larger):** create or choose an intentionally named production D1, apply migrations, pin its `database_id` in `wrangler.jsonc`, and ship through the normal Gate C/Gate D path. Requires remote D1 authority plus main-merge and deploy authority.

**Optional repository hardening (either option):** catch D1 errors in the public handlers and return a JSON 503 instead of an uncaught 1101, with a test for the "bound, unmigrated" state. This does not fix the root cause and was not implemented, because D-096 allows only a demonstrated root-cause fix.

## Unresolved findings and limitations

1. The provisioning event that created the two remote resources is inferred from names and dates, not directly evidenced.
2. The migration command in Option 1 was not dry-run: `wrangler d1 migrations list --remote` would query, and may create a tracking table in, the remote database, which D-096 forbids.
3. Carried forward: S6 parked at ML-DEVOS-AS-103; O1 and O2 open; D-068 held; PR #7 and PR #10 untouched.

## Evidence locations

- Production Worker `maisog-labs`, active version `f473c170-b39c-4d7b-85ad-a99c5208d539` (bindings), D1 `45b87574-e573-4e0f-9bb6-fbba2df29523`.
- `worker/public/journal.mjs`, `worker/public/design.mjs`, `worker/index.mjs`, `wrangler.jsonc`, `migrations/*.sql`.
- `coordination/archive/directives/DIR-WEB-AS116-STAGE-A-0001.md`.

## Governing references

- **Authority:** D-096.
- **Directive:** DIR-WEB-AS116-STAGE-A-0001 (archived).
- **Reviews:** ML-DEVOS-AS-116 (incident), ML-DEVOS-AS-123 (live review).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews this Stage A return under the next unused immutable Architect Sync ID after ML-DEVOS-AS-123. Any production repair (Option 1 or 2) needs a separate Paulo decision naming the exact resource, change and rollback.
