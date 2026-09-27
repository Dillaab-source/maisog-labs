# Current Directive — AS-116 Post-Incident Cloudflare Binding/Config/Error Hardening

```yaml
schema_version: 1
directive_id: DIR-WEB-AS116-HARDENING-0001
cycle_id: MAISOGLABS_WEB_AS116_HARDENING
issue_parent_commit: b0a7af9622ce8eb8efbe487a27f7f5920d103b81
target_turn: CLAUDE
authority_ref: D-098
applicable_review_id: ML-DEVOS-AS-125
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-098 and `ML-DEVOS-AS-125`.

## Objective

Close the configuration and error-handling hardening that AS-124 and AS-125 deferred. This covers four things: pinning the production D1 identity in `wrangler.jsonc`; correcting the false `remote: false` documentation for D1 and R2; making the public Journal and Design APIs fail with a controlled 503 instead of Worker Error 1101; and proving this with local tests. All of it is repository/local work only.

## Preconditions

- Protocol V2 bootstrap passes, and STATE selects this directive with only `MUTATION_AUTHORIZED: YES`.
- `main` is `7d22a96d10b5e24f5296795c2b049f77093386c3`.
- The worktree is clean apart from the held, untouched D-068 draft (`devos/execution/`, `tests/fixtures/execution/`).

## Governing references

- **T0:** Protocol V2; D-098; live STATE; `ML-DEVOS-AS-125`.
- **T1:** `ML-DEVOS-AS-124` and `ML-DEVOS-AS-116`; `coordination/archive/handoffs/H-WEB-AS116-STAGE-A-0001.md` and `H-WEB-AS116-STAGE-B-0001.md`; `wrangler.jsonc`; `worker/public/*.mjs`; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed files:
- `wrangler.jsonc`: the `DB` `database_id` pin, plus corrected D1/R2 comments.
- `scripts/d1-migrate.mjs`: header comment only.
- `docs/ARCHITECTURE.md`: the D1/R2/Cloudflare-resource statements only.
- `worker/public/journal.mjs` and `worker/public/design.mjs`: controlled 503 on D1 failure.
- `tests/worker-public-journal.test.mjs` and `tests/worker-public-design.test.mjs`.
- A new `tests/cloudflare-bindings-config.test.mjs`.
- One Protocol V2 Builder return.

Allowed actions: local tests and the local production build.

Not allowed: any remote Cloudflare call (D1, R2, Workers, Access, DNS); migrations; Time Travel; version upload, deploy or promotion; binding changes in Cloudflare; secrets or environment; renaming, creating or deleting resources; a preview D1; a bucket-ID field; changes to published-data visibility; any other runtime or product file; `main`; PR #7; PR #10; S6/S7; D-068.

## SENTINEL Sync

- **Authority:** D-098 (Paulo).
- **Context:** production D1 and R2 identities are recorded in D-098; AS-116 is closed by AS-125.
- **Capability:** repository/local mutation only; every remote flag is `NO`.
- **Execution:** one bounded implementation pass, then a return.
- **Evidence:** diff, tests, build.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.

- Pinning `database_id` changes what a future deploy binds only if the ID differs from the one production already uses. It equals the active binding (`45b87574…`), so this is a no-op for production. Nothing is deployed in this cycle.
- `remote: false` stays, because it still correctly keeps local development and tests local.
- R2 has no ID field; `bucket_name` is its identity.

## Instructions

1. Bootstrap fresh and verify the preconditions.
2. Edit `wrangler.jsonc` and the documentation as scoped.
3. Wrap D1 access in both public handlers so that any throw returns `{"error":"Service Unavailable"}` with status 503. Route and method classification must still run before any D1 access.
4. Add the tests; run `npm test` and `npm run build`.
5. Publish the return.

## Validation and evidence

Diff limited to the allowed files; full test suite and build results; 503, 404 and 405 behavior tests; the config regression test. Builder evidence is `ACTOR_REPORTED`.

## Stop conditions

Stop if any change would require a remote Cloudflare call, a file outside the scope, a visibility-rule change, or a Wrangler schema field that does not exist.

## Next action

Publish one Protocol V2 Builder return. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`.
