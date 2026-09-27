# Current Directive — AS-116 Production API Incident Stage A

```yaml
schema_version: 1
directive_id: DIR-WEB-AS116-STAGE-A-0001
cycle_id: MAISOGLABS_WEB_AS116_STAGE_A
issue_parent_commit: eaf174811042d9da73137193c2888dabfa5614fb
target_turn: CLAUDE
authority_ref: D-096
applicable_review_id: ML-DEVOS-AS-123
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-096 and this directive.

## Objective

Determine the root cause of production `GET /api/design` and `GET /api/journal` returning HTTP 500 / Worker Error 1101 (AS-116). If the root cause can be corrected entirely in repository/local scope, prepare and test that remediation. Otherwise, specify the exact production change for Paulo.

## Preconditions

- Protocol V2 bootstrap passes at the tip publishing this directive; STATE selects it with `MUTATION_AUTHORIZED: YES` and every other action flag `NO`.
- `main` is `7d22a96d10b5e24f5296795c2b049f77093386c3`; active production is `f473c170-b39c-4d7b-85ad-a99c5208d539` @ 100% (read-only confirmation).
- Working tree clean; `stash@{0}` untouched.

## Governing references

- **T0:** Protocol V2; D-096; live STATE.
- **T1:** `ML-DEVOS-AS-116` (incident); `ML-DEVOS-AS-123`; `worker/**`, `migrations/**`, `wrangler.jsonc`, `tests/**`; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed, read-only against Cloudflare: `wrangler whoami`, `deployments status/list`, `versions list/view`, `d1 list`, `d1 info`, `tail` (log observation only), and public HTTP requests to the two endpoints.

Allowed, local: `wrangler dev`/local D1 (`--local` only), repository reads, tests and builds, and repository changes to `worker/**`, `migrations/**`, `tests/**`, `wrangler.jsonc` and incident evidence docs, made only once a root cause is demonstrated.

Not allowed: `d1 execute --remote`, `d1 migrations apply --remote` or any remote D1 create/delete/write/query; production binding, route, DNS, Access, secret, environment or R2 changes; `wrangler deploy`, `wrangler versions deploy`, manual `wrangler versions upload`; `main`; PR merges; PR #7; PR #10; S6/S7; D-068.

## SENTINEL Sync

**Authority:** D-096 (Paulo). **Context:** AS-116 open; D-093 closed. **Capability:** read-only Cloudflare observation plus repository/local mutation only; `MUTATION_AUTHORIZED` grants no remote or production capability. **Execution:** diagnosis, then bounded local remediation only on a demonstrated cause. **Evidence:** HTTP reproduction, Wrangler metadata, logs, local reproduction, tests. Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`. The handlers return 503 when `env.DB` is absent, so 1101/500 is not proof of a missing binding; distinguish absent binding, bound-but-wrong database, missing/incompatible schema, and other runtime exceptions with evidence. Do not create a production database because the checked-in config is local-only.

## Instructions

1. Reproduce both endpoints read-only in production and record status and body.
2. Read the production Worker's bindings and deployment/version metadata (Wrangler, read-only); list D1 databases; observe production errors with `wrangler tail` where possible.
3. Trace the handler code paths and reproduce locally against local D1 in each candidate condition.
4. State the proven root cause, or the strongest proven cause with what remains unproven.
5. If the cause is correctable in repository/local scope, implement the smallest fix with tests; otherwise make no speculative change.
6. Specify any required production change exactly (resource, change, rollback) for Paulo; do not execute it.

## Validation and evidence

Production HTTP reproductions; Wrangler binding/metadata reads; log evidence or its unavailability; local reproductions; `npm test` and `npm run build` results for any change. Builder evidence is `ACTOR_REPORTED`.

## Stop conditions

Stop and report if diagnosis requires any remote D1 query or write, any production binding/configuration change, any deploy/upload, or any action outside the allowed scope.

## Next action

Publish one Protocol V2 Builder return, archive and deselect this directive, reset every action flag to `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`.
