# Current Handoff — AS-116 Post-Incident Cloudflare Binding/Config/Error Hardening (D-098)

```yaml
schema_version: 1
handoff_id: H-WEB-AS116-HARDENING-0001
cycle_id: MAISOGLABS_WEB_AS116_HARDENING
input_base_commit: 199db5b2404aad192699de367472369b02fb87c7
review_target_commit: 199db5b2404aad192699de367472369b02fb87c7
applicable_review_id: ML-DEVOS-AS-125
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Every result here is `ACTOR_REPORTED`: it was produced in the Builder's cloud session, which has no Cloudflare network access or credential and made no Cloudflare call.

## Objective

Execute `DIR-WEB-AS116-HARDENING-0001` (D-098). This closes the hardening that AS-124 and AS-125 deferred, as repository/local changes only:
- pin the production D1 identity;
- correct the false `remote: false` documentation for D1 and R2;
- make the public Journal and Design APIs return a controlled 503 on D1 failure instead of Worker Error 1101;
- prove all of it with local tests and a build.

## Result

| Item | Value |
|---|---|
| Publication chain | AS-125 at `b0a7af9622ce8eb8efbe487a27f7f5920d103b81` → D-098 and directive at `199db5b2404aad192699de367472369b02fb87c7` → this return |
| Config change | `wrangler.jsonc` `d1_databases[0]` gains `"database_id": "45b87574-e573-4e0f-9bb6-fbba2df29523"`. `binding`, `database_name`, `migrations_dir` and `remote: false` are unchanged. `r2_buckets` is unchanged apart from its comment. |
| Public D1 failure | Any throw from a D1 read in `/api/journal`, `/api/journal/:slug` or `/api/design` now returns 503 `{"error":"Service Unavailable"}`, the same body as a missing binding. A fixed, detail-free line is logged with `console.error`. |
| Tests | `npm test`: 914 pass, 0 fail (exit 0) |
| Build | `npm run build`: exit 0; `out/index.html` SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` (D-093 artifact unchanged) |
| Remote Cloudflare | none touched |

## Changed files

- `wrangler.jsonc`:
  - adds the `DB` `database_id`;
  - replaces the D1 and R2 comments that said `remote: false` meant the binding "can never" target production. The new comments say `remote: false` governs local development only, a deployed Worker binds the real resource, D1 identity is pinned by `database_id`, R2 is identified by `bucket_name` alone (Wrangler has no bucket-ID field), the `-local` suffixes are historical, and any remote D1/R2 action needs separate governance authority.
- `scripts/d1-migrate.mjs`: header comment only. It no longer says "no database_id", and it explains that the pin does not make the local script remote.
- `docs/ARCHITECTURE.md`: the D1, R2 and "tracked Cloudflare resource configuration" statements now match the above. The false "no production bucket provisioning" bullet is removed.
- `worker/public/journal.mjs`: adds `serviceUnavailable()` and `readOrUnavailable()`, which wrap the index and detail reads. Route and method classification, the missing-DB 503, the 404s and the published-only queries are unchanged.
- `worker/public/design.mjs`: wraps `handleGet` in `try`/`catch` → 503. Everything else is unchanged.
- `tests/worker-public-journal.test.mjs` and `tests/worker-public-design.test.mjs`: new D-098 tests (below).
- `tests/cloudflare-bindings-config.test.mjs` (new): reads `wrangler.jsonc` through Wrangler's own `unstable_readConfig`, with no Cloudflare call, and asserts the exact D1 binding (including `database_id`) and the R2 binding (no ID field).
- Protocol return:
  - `coordination/CURRENT_HANDOFF.md`;
  - `coordination/STATE.md`;
  - `coordination/archive/directives/DIR-WEB-AS116-HARDENING-0001.{md,provenance.json}`, byte-identical to the executed directive (blob `35eb94f7f20ff2636cda3c3c8f35dfb80112dbb2`), plus its index row.

No other runtime, product, migration, package, lockfile, Worker entry, admin, homepage or workflow file changed.

## Tests and evidence

New D-098 tests. Existing tests already covered a missing DB → 503 on all three routes, an unknown slug → 404, and other methods → 405 with zero D1 access.

| Test | Journal | Design |
|---|---|---|
| A bound DB whose queries throw (the message embeds `no such table`, `SQLITE_ERROR` and the D1 ID) → 503, exact `{"error":"Service Unavailable"}` JSON body, no leak marker in the body, logged line free of detail | ✅ index + detail | ✅ |
| A real local Miniflare D1 with no schema applied (the AS-116 unmigrated condition) → controlled 503 | ✅ index + detail | ✅ |
| A migrated DB still returns 200 (`{"entries":[]}` / `{theme, sections}`); unknown slug → 404; POST/DELETE → 405 | ✅ | ✅ (200, 405) |
| Config: exact `DB` binding with `database_id`; `MEDIA` has `bucket_name` only | ✅ | ✅ |

Leak markers checked in every 503 body: `SQL`, `sqlite`, `no such table`, table names, `D1_`, `45b87574`, `stack`, `at `.

**Regression proof:** with the previous `worker/public/*.mjs` restored temporarily, the four new failure tests fail (31 pass, 4 fail). With the change, all 37 tests in the three files pass.

Commands (all local):
- `node --test tests/worker-public-journal.test.mjs tests/worker-public-design.test.mjs tests/cloudflare-bindings-config.test.mjs` → 37/37;
- `npm test` → 914/914;
- `npm run build` → exit 0;
- `git diff --check` → clean.

The local tests use `getPlatformProxy({ remoteBindings: false })` with `remote: false`. Adding `database_id` does not make them remote.

## Unresolved findings and limitations

1. **Not deployed:** production keeps the old handlers until a separately authorized release carries this change, meaning a `main` merge (Gate C-style) and a promotion (Gate D-style). Until then, a D1 failure in production would still surface as 1101.
2. **No-op pin for production:** the pinned `database_id` equals the database the active version `f473c170-b39c-4d7b-85ad-a99c5208d539` already binds, according to the Stage B handoff (`ACTOR_REPORTED`). This session could not re-read the Cloudflare binding.
3. **Names left unchanged:** the `-local` resource names stay as they are, as D-098 directs. Renaming would need its own decision.
4. **R2 has no ID pin:** it cannot have one; its identity is `bucket_name` and its binding is untouched.
5. **Historical records untouched:** earlier RFC/ADR text that says `remote: false` (RFC-009, RFC-010, ADR-008, ADR-009) is immutable and was not edited. `docs/ARCHITECTURE.md` and `wrangler.jsonc` now carry the correct current description.
6. Carried forward: S6 parked at ML-DEVOS-AS-103 until this cycle is accepted; O1 and O2 open; D-068 held; PR #7 and PR #10 untouched.

## Evidence locations

- The diff of this return commit against `199db5b2404aad192699de367472369b02fb87c7`.
- The tests listed above; `wrangler.jsonc`; `worker/public/journal.mjs`; `worker/public/design.mjs`.
- `coordination/archive/directives/DIR-WEB-AS116-HARDENING-0001.md`.

## Governing references

- **Authority:** D-098.
- **Directive:** DIR-WEB-AS116-HARDENING-0001 (archived).
- **Reviews:** ML-DEVOS-AS-125 (AS-116 closure), ML-DEVOS-AS-124 (deferred hardening), ML-DEVOS-AS-116 (incident).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews this return under the next unused immutable Architect Sync ID after ML-DEVOS-AS-125. No remote, deploy, merge or promotion action is authorized. Shipping this hardening to production needs separate owner authority.
