# Current Directive — V10.1 Gate D (D-123)

```yaml
schema_version: 1
directive_id: DIR-WEB-V101-GATE-D-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 8d9b1227a74ffae8d03bbc833db2ab1143a208d5
target_turn: CLAUDE
authority_ref: D-123
applicable_review_id: ML-DEVOS-AS-147
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-123 and `ML-DEVOS-AS-147`.

## Objective

Promote the exact existing Worker version `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` (V10.1, from `main` `97ca982c…`, Workers Build `4eae04e3…`) to 100% of production in one deployment, verify it read-only, and roll back to `862dc45e-9ad7-4324-80ae-912adbb6ce82` only on a new material failure V10.1 causes.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `DEPLOY_AUTHORIZED` is the only `YES` flag.
- The D-123 preflight passes in full, read fresh immediately before the deployment.

## Governing references

- **T0:** Protocol V2; D-123; live STATE; `ML-DEVOS-AS-147` (Gate D readiness, separation, fallback state, post checks).
- **T1:** D-114 / `H-WEB-RFC022-GATE-D-0001` (Gate D precedent); `ML-DEVOS-RFC-022` §5.4, §7 test 11; `OBL-017`.

## Exact execution scope

Allowed:
- read-only GitHub and Cloudflare reads (versions, builds, deployments, Access application and policies, GraphQL analytics);
- exactly one `POST /accounts/{id}/workers/scripts/maisog-labs/deployments` with `8fd31f47…` @ 100% (the equivalent of `wrangler versions deploy 8fd31f47…@100% --yes`), run once;
- at most one conditional rollback deployment to `862dc45e…` @ 100%, under the D-123 rollback rule only;
- unauthenticated public HTTP GETs and a headless-browser smoke test against the live site;
- one Protocol V2 Builder return.

Not allowed:
- rebuild; version upload; `wrangler deploy`; a newer `main`; canary or traffic split; a second candidate;
- project publication or activation; `homepage_initial_activation`; contact-email publication; `site_settings` mutation; D1/R2 mutation;
- Access, DNS, binding, secret or environment change; any merge;
- rollback for absent unpublished projects, unavailable CPU metrics, deferred mobile or `og:image`, the test-browser video codec, or pre-existing issues.

## SENTINEL Sync

- **Authority:** D-123 (Paulo).
- **Context:** AS-147 accepted Gate C and named the exact candidate and rollback target.
- **Capability:** one production deployment operation (plus one conditional rollback).
- **Execution:** fresh preflight → one deployment → read-only verification.
- **Evidence:** pre/post versions and deployment IDs, HTTP and browser smoke, analytics, rollback status.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **Live site vs project activation:** V10.1 goes live without the D-115 projects. With nothing published, `/` serves the raw V10.1 artifact, and the homepage shows the artifact's own built-in project data. Expected; not a rollback condition. Activation stays a separate decision (AS132-F002 unconsumed).
- **Wrangler vs connector:** Wrangler is not authenticated in the Builder container. The D-114 precedent uses the identical Cloudflare API deployment call through the connector.

## Instructions

1. Bootstrap. Run the full preflight; stop on any mismatch.
2. Take a pre-deploy latency baseline.
3. Re-read production and deploy `8fd31f47…` @ 100% once.
4. Verify the live state (HTTP, `/v101/` assets, browser smoke, APIs, `/admin`, analytics); roll back only under the D-123 rule.
5. Publish the return.

## Validation and evidence

The D-123 return list.

## Stop conditions

- Any preflight mismatch or ambiguity.
- An unexpected result of the deployment call.

## Next action

Publish `H-WEB-V101-GATE-D-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
