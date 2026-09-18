# Implementer Handoff

Status: `READY_FOR_ARCHITECT` (see `coordination/STATE.md`)

Branch: `governance/maisoglabs-v0.1`

---

## Cycle / Change ID

`MAISOGLABS-WEB-INC-005-D1-SUBSTRATE` — **AUTHORIZED IMPLEMENTATION**

Authority chain: `ML-DEVOS-RFC-003` → `ML-DEVOS-AS-013` (`ARCHITECT_APPROVED — WEB-INC-005 RFC-003 COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`) → `D-024` (Paulo: "Proceed with WEB-INC-005 authorization.").

## Objective

Implement the current-content D1 entity/revision substrate and deterministic local migration/parity/integrity tooling described by `ML-DEVOS-RFC-003` and bound by every `ML-DEVOS-AS-013` finding, while preserving `data/site.js → lib/content/schema.mjs → lib/content/public.mjs → lib/content/local.mjs → app/page.js` as the sole authoritative public build path. No public cutover, no remote/production D1, no deployment, no `main` merge.

## Branch / commit state

- Base SHA (pulled and fast-forwarded before any file was touched, confirmed by `git rev-parse HEAD`): `7122c9d9887e5801a9c3ec03285db7273f1529c8` — matches exactly the SHA the request required.
- Read in full before any edit, per the request's own required-reading list: `coordination/STATE.md`, `coordination/ARCHITECT_REVIEW.md` (`ML-DEVOS-AS-013`, all 14 findings AS13-F001–F014), `devos/changes/rfcs/ML-DEVOS-RFC-003.md` (all 14 proposed-decision sections), `devos/changes/architect-syncs/ML-DEVOS-AS-013.md` (durable archive — confirmed byte-identical in substance to the rolling review, `CONCLUDED — ARCHITECT_APPROVED`), `brain/DECISION_LOG.md` `D-024`, `docs/product/DATA_BACKEND_SPEC.md`, `docs/product/BUILD_PLAN.md`.
- Resulting Builder commit: recorded below after commit (see "Commit" at the end of this handoff).

## Exact changed-file list — 17 files

**New (7):**
- `migrations/0001_web_inc_005_init.sql` — DDL for the exactly-14 authorized tables
- `worker/d1/schema.mjs` — migration-SQL loader, `applySchema`, `listProductTables`, `AUTHORIZED_TABLE_NAMES`
- `worker/d1/validate.mjs` — D1-scoped field-by-field content validators (AS13-F004)
- `worker/d1/migrate.mjs` — deterministic migration/seed logic (AS13-F009)
- `worker/d1/repository.mjs` — bounded server-side data-access/reconstruction functions (AS13-F012, F010)
- `scripts/d1-migrate.mjs` — local-only Node CLI entry point for migration evidence
- `tests/d1-migration.test.mjs` — 12 D1 substrate tests

**Modified (10, documentation/config only):**
- `wrangler.jsonc` — added the local-only `d1_databases` binding
- `brain/GOVERNANCE_MAP.md` — new WEB-INC-005 substrate row; `WEB-REQ-004` evidence corrected to distinguish substrate existence from admin-managed editing
- `brain/IMPLEMENTATION_STATUS.md` — split "Persistent storage (D1/R2)" into D1 (`IMPLEMENTED`, local-only) and R2 (`NOT STARTED`); extended explicit non-claims
- `brain/PROJECT_GOVERNANCE.md` — "Current storage model" and "Current restrictions" updated to record the local D1 substrate without upgrading it to public/authoritative
- `brain/RISK_REGISTER.md` — `RISK-WEB-015` → `MITIGATED` (local substrate); `RISK-WEB-007`, `RISK-WEB-004`, `RISK-WEB-013` evidence/scope extended, no status silently upgraded beyond what's evidenced
- `brain/TEST_LEDGER.md` — 12 new test rows, `TEST-DATA-001` → `PASS` (local-only), new "`WEB-INC-005` command evidence" section, updated `npm test` totals
- `docs/ARCHITECTURE.md` — "Planned evolution", "Boundaries", "Phase 2 content boundary" updated to record the local D1 substrate without contradicting the still-database-free runtime request path
- `docs/product/PRD.md` — "Current vs. target state" D1/R2 row split, D1 now `IMPLEMENTED` (local-only)
- `docs/product/BUILD_PLAN.md` — WEB-INC-005 catalog entry: added "Implementation status" line
- `docs/product/DATA_BACKEND_SPEC.md` — added a `WEB-INC-005 implementation note` marking exactly which entity/revision pairs are now `IMPLEMENTED`

**Not touched, exactly as required:** `app/`, `components/`, `data/`, `lib/`, `public/`, `next.config.mjs`, `package.json`, `package-lock.json`, `worker/index.mjs`, `worker/auth.mjs`, `tests/content.test.mjs`, `tests/worker-auth.test.mjs`, `docs/product/TECHNICAL_DESIGN.md`, any `devos/` file, `brain/00_HOME.md`, `brain/DECISION_LOG.md`, `brain/protocols/`, `.github/`. Confirmed by `git diff --stat -- app/ components/ data/ lib/ public/ next.config.mjs package.json package-lock.json worker/index.mjs worker/auth.mjs tests/content.test.mjs tests/worker-auth.test.mjs` returning empty, and `git status --short` showing exactly the 17 paths above.

No new dependency was added (`package.json`/`package-lock.json` unchanged) — `wrangler`'s own `getPlatformProxy`/`unstable_splitSqlQuery` exports (already a devDependency) provide the local D1 simulation and multi-statement SQL execution; no ORM was used, per `ML-DEVOS-AS-013`'s "No ORM is required or preferred."

## Exact 14-table inventory

`site_settings`, `site_settings_revisions`, `navigation`, `navigation_revisions`, `foundations`, `foundation_revisions`, `projects`, `project_revisions`, `services`, `service_revisions`, `process_steps`, `process_step_revisions`, `sections`, `section_revisions` — exactly the `ML-DEVOS-RFC-003`/`ML-DEVOS-AS-013`/`D-024` list, in the same order. Proven three independent ways:

1. `tests/d1-migration.test.mjs` — "schema migration creates exactly the 14 authorized tables" (`worker/d1/schema.mjs`'s `listProductTables` vs. `AUTHORIZED_TABLE_NAMES`, sorted).
2. `npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"` — returned exactly the 14 tables plus Wrangler's own `d1_migrations` bookkeeping table and the SQLite/D1-internal `_cf_METADATA`/`sqlite_sequence`, all excluded from the product-table count by the same convention `listProductTables` applies.
3. `node scripts/d1-migrate.mjs` — prints `Product tables (14): ...` and confirms the sorted set equals `AUTHORIZED_TABLE_NAMES`.

No other product table was created.

## Migration design

### Base-entity rule and cross-entity pointer integrity (AS13-F003)

Every base/logical entity table (`site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, `sections`) carries only `id`, immutable `created_at`, an immutable `slug` (projects only), and the two nullable revision pointers — no `order`, visibility, lifecycle flag, or mutable content.

`AS13-F003` requires that a pointer must never successfully reference a revision belonging to a different entity, and that this be enforced (not merely hoped for) at the database or data-access layer, with a negative test. This is enforced as a genuine **SQLite composite foreign key**:

```sql
FOREIGN KEY (id, published_revision_id) REFERENCES project_revisions (project_id, id)
FOREIGN KEY (id, draft_revision_id)     REFERENCES project_revisions (project_id, id)
```

with `UNIQUE (project_id, id)` on the revisions table to make it a valid FK target. This makes cross-entity assignment a database-level impossibility, not just an application check: the referenced revision's own `project_id` column must equal the base row's `id`, or SQLite rejects the write with `SQLITE_CONSTRAINT_FOREIGNKEY`. Verified directly by the "a base-entity pointer cannot successfully reference another entity's revision" test, and by manual `wrangler d1 execute --local` probing during development (see command log below).

`revision-number uniqueness per entity` (AS13-F011) is enforced by `UNIQUE (project_id, revision_number)` (and the equivalent for every other entity). `PRAGMA foreign_keys = ON;` is set at the top of the migration and D1 enforces it (confirmed empirically — D1/Miniflare's local SQLite enables FK enforcement).

The `order` content field is stored as `sort_order` on each `_revisions` table (`order` is a reserved SQL keyword); `worker/d1/repository.mjs` maps it back to `order` on read.

### `site_settings_revisions` typing (AS13-F004)

Every current singleton domain (`site`, `seo`, `hero`, `process` header, `about`, `contact`, `projectSection`, `footer`, plus `meta`'s `schemaVersion`/`contentVersion`/`locale`/`updatedAt`) is a named, individually-typed column — 34 explicit columns, not one JSON blob. The four naturally-nested substructures (`hero.title`, `hero.primaryAction`, `hero.secondaryAction`, `about.title`) are stored as small JSON text columns, but `worker/d1/validate.mjs`'s `validateSiteSettingsContent` validates every one of them field by field (mirroring `lib/content/schema.mjs`'s `text`/`lines`/`action`/`email`/`canonical` predicates) and rejects any unknown field at any nesting level before a write is attempted — this is the "direct validation successor to `lib/content/schema.mjs`" `AS13-F004` requires. `lib/content/schema.mjs` itself was not imported into this validator (to avoid coupling D1-specific validation to the legacy schema's exact object shape), but `worker/d1/migrate.mjs` does import and call the legacy `validateContent()` directly on the raw source document as its first gate, so both validators run.

### Migration-state mapping

- `published` source record → revision created, `published_revision_id` set, `draft_revision_id` left null.
- `draft` source record → revision created, `draft_revision_id` set, `published_revision_id` left null.
- `archived` source record → revision created and preserved; both pointers left null.

Verified by "published/draft/archived source fixtures map to the correct pointer state" against a constructed fixture (the real `data/site.js` is currently 100% published, so this fixture is required to exercise all three branches — exactly as `ML-DEVOS-AS-013` `AS13-F011` anticipated).

### Sections bootstrap (AS13-F005)

`home` (order 1), `projects` (order 2), `process` (order 3), `about` (order 4) — all created published/visible via the same `upsertEntity` path, with `main-content` never created as a row. Verified separately from the legacy parity projection by "sections substrate is bootstrapped separately and is not part of the legacy parity projection", which also asserts the reconstructed legacy projection object has no `sections` key.

### Migration provenance (AS13-F007)

Every migrated/bootstrapped revision's `created_by` is the literal string `migration:web-inc-005` (`worker/d1/migrate.mjs`'s `MIGRATION_PROVENANCE`). No admin identity/session table was created.

## Repeat-run / determinism behavior (AS13-F009)

`worker/d1/migrate.mjs`'s `upsertEntity` implements exactly this contract, atomically per entity (all statements for one entity in a single `db.batch()` call, including the pointer-set via a same-batch subquery, so a failure leaves no partial write for that entity):

- **Entity does not yet exist** → create entity row + revision 1 + pointer, atomically. Reported as `created`.
- **Entity exists, and every content column plus the publish/draft state already matches the intended target exactly** → no write is attempted. Reported as `noop`.
- **Entity exists, and content or publish/draft state differs from the intended target** → `Error` thrown with a message beginning `WEB-INC-005 migration refusal:`, and no write is attempted for that entity (the check-then-decide happens entirely before any statement is prepared).

Evidence:
- `node scripts/d1-migrate.mjs` fresh run: 23 entities created, 0 no-op.
- `node scripts/d1-migrate.mjs` second run against the same local state: 0 entities created, 23 no-op — identical entity/revision/pointer set (row-for-row `dumpAllRows` deep-equal in the test suite).
- "migration refuses to overwrite an entity whose stored content differs from the intended target, with no partial write" test: mutates one fixture field and re-runs; asserts the thrown error and that every table's rows are byte-identical (`assert.deepEqual`) before and after the rejected attempt.

## Parity evidence (AS13-F010)

`worker/d1/repository.mjs`'s `reconstructPublishedLegacyProjection(db)` reads only `published_revision_id` pointers (never draft) across `site_settings`, `navigation`, `foundations`, `projects`, `services`, `process_steps`, and reassembles the exact legacy shape (`meta` without `state`, `site`, `seo`, `navigation[]`, `hero`, `foundations[]`, `projects[]`, `services[]`, `process.{kicker,title,steps[]}`, `about`, `contact`, `footer`, `projectSection`), sorting each collection by `order` then `id` — the same rule `lib/content/public.mjs`'s `projectPublishedContent` uses.

Test: `assert.deepEqual(await reconstructPublishedLegacyProjection(db), projectPublishedContent(siteContent))` after a fresh migration of the real `data/site.js` — **passes**, covering every current domain including `services` (not currently rendered by `app/page.js`, but present in the parity object exactly as `projectPublishedContent` produces it). `sections` is never added to this object and is asserted absent (`!Object.hasOwn(legacyProjection, "sections")`).

## Integrity/negative-path evidence (AS13-F011, RFC-003 §13)

All of the following are dedicated passing tests in `tests/d1-migration.test.mjs`:

- Draft reorder does not affect the published projection/order (an out-of-band `draft_revision_id` reorder is invisible to `readPublishedCollection`, visible only to the explicitly-named `readDraftCollectionForTrustedServerCode`).
- Cross-entity pointer rejection (composite FK, `SQLITE_CONSTRAINT_FOREIGNKEY`).
- Project slug uniqueness (`UNIQUE` constraint) and reserved-slug rejection, enforced **both** at the database layer (`CHECK (slug NOT IN (...))`) and by the JS `validateProjectSlug` unit-level check.
- Revision-number uniqueness per entity (`UNIQUE (entity_id, revision_number)`).
- A revision row referencing a non-existent base entity fails safely (`SQLITE_CONSTRAINT_FOREIGNKEY` on the plain `entity_id` FK).

## Server-only boundary (AS13-F012)

`worker/d1/*` is never imported by `app/`, `worker/index.mjs`, or any client component — confirmed by the protected-path diff above (`worker/index.mjs` unmodified) and by inspection (no `import` of `worker/d1/*` exists anywhere outside `scripts/d1-migrate.mjs` and `tests/d1-migration.test.mjs`). `readDraftCollectionForTrustedServerCode`/`readDraftSiteSettingsForTrustedServerCode` are named distinctly from the published-read functions precisely so a future caller must deliberately opt in; there is no HTTP route, dashboard, CRUD, or publish/unpublish handler anywhere in this diff.

## Public behavior invariant (AS13-F001, F013)

`app/page.js` and `lib/content/local.mjs` are byte-identical to the base commit (confirmed by the empty `git diff --stat` above). `data/site.js` was not deleted, retired, or modified. `npm run build` produces the same three routes (`/`, `/_not-found`, `/admin`) as before this cycle. No implementation step required a public cutover; none was performed.

## Local-only D1 evidence (AS13-F008) — full command log

Every command below is `--local` or performs no resource mutation at all (`--dry-run`); none used `--remote`. `wrangler.jsonc`'s `d1_databases` entry has **no `database_id`** (not required by Wrangler's config schema) and explicit `"remote": false`.

| Command | Result |
|---|---|
| `npx wrangler deploy --dry-run` | Succeeded; binding table lists `env.DB (maisog-labs-web-inc-005-local) — D1 Database` alongside the existing `env.ASSETS`/`env.ACCESS_*` bindings; "--dry-run: exiting now." — no resource created or modified |
| `npx wrangler d1 migrations list DB --local` | `Resource location: local`; lists `0001_web_inc_005_init.sql` as pending |
| `npx wrangler d1 migrations apply DB --local` | `Resource location: local`; "16 commands executed successfully"; `0001_web_inc_005_init.sql` applied (`✅`) |
| `npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master ..."` | Returned exactly the 14 authorized tables + `d1_migrations`/`_cf_METADATA`/`sqlite_sequence` |
| `node scripts/d1-migrate.mjs` (fresh) | 23 created, 0 no-op |
| `node scripts/d1-migrate.mjs` (second run) | 0 created, 23 no-op |
| `npm test` | 69 passed, 0 failed |
| `npm run build` | Succeeded, unchanged routes |
| Secret/config scan | `grep` for `process.env`, PEM/private-key markers, secret/token/credential/account-id keyword patterns across `worker/`, `migrations/`, `scripts/`, `tests/worker-auth.test.mjs`, `tests/d1-migration.test.mjs`, `wrangler.jsonc` — no matches beyond explanatory comments and an unrelated `url.password` property-name check; no `.env*` files found |

`getPlatformProxy` (used by `scripts/d1-migrate.mjs` and `tests/d1-migration.test.mjs` for the D1 binding used in Node-side tooling/tests) is called with `remoteBindings: false` explicitly, in addition to the binding's own `remote: false` — there is no configuration path in this diff by which any of the above could reach a real Cloudflare D1 resource.

## Explicit confirmations

- **No remote Cloudflare D1 resource was created or modified.** No `wrangler d1 create` was run; every D1 command above is `--local` or non-mutating (`--dry-run`); `wrangler.jsonc` has no `database_id` and `"remote": false`.
- **Public rendering still reads `data/site.js`.** `app/page.js`, `lib/content/local.mjs`, `lib/content/public.mjs`, `lib/content/schema.mjs`, and `data/site.js` are byte-identical to the base commit; `npm run build` output is unchanged.
- **No later `WEB-INC-*` work began.** No dashboard, session/editorial read, mutation/publish/unpublish handler, media/R2, journal, theme-settings, or `audit_log` code exists anywhere in this diff.

## Known limitations

- This is a **local-only** revision substrate. It has not been exercised against a real Cloudflare D1 database, and Miniflare's local D1 simulation, while SQLite-compatible, is not a guarantee of exact production D1 edge behavior (the same caveat `WEB-INC-001`'s local `wrangler dev` evidence already carries for Worker routing).
- The real `data/site.js` content is entirely `published` today, so the published/draft/archived state-mapping tests use a constructed fixture rather than the live document — this is unavoidable given the current content's actual state and is exactly what `ML-DEVOS-AS-013` `AS13-F011` anticipated ("Because the live source is currently published, Builder must add controlled migration fixtures").
- `site_settings_revisions`' four JSON substructure columns (`hero_title_json`, `hero_primary_action_json`, `hero_secondary_action_json`, `about_title_json`) are validated field-by-field in JS before every write, but are not additionally constrained by SQLite `CHECK` expressions (SQLite's JSON functions could add a defense-in-depth layer here; not attempted this increment, since the JS validation path is exercised on every write in this codebase and no other write path exists).
- No admin/mutation code calls any of `worker/d1/*` yet (by design — that's `WEB-INC-002`/`WEB-INC-003` and later); this increment cannot itself demonstrate the substrate working under real concurrent/authenticated admin usage, only under the deterministic migration/test harness.
- This evidence is entirely implementer-reported (`ACTOR_REPORTED`) until the Architect independently reproduces or inspects it, per the standing evidence-class rule.

## Paulo-level decisions

None required by this cycle. `D-024` already supplied the complete authorization this implementation operates under.

## Commit

Files above are committed to `governance/maisoglabs-v0.1` (and mirrored to the session branch `claude/phase-0-governance-scope-w8o3jp`) as a single commit on top of base `7122c9d9887e5801a9c3ec03285db7273f1529c8`. See the branch's `git log` for the exact commit SHA, also recorded in `coordination/STATE.md`'s `LAST_IMPLEMENTER_HANDOFF_SHA`.
