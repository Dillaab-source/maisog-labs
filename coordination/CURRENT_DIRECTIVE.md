# Current Directive — RFC-022 Gate D production promotion (D-114)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-GATE-D-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: c24f8882586a5a2cdb25b7dc8bbfbd7b6e54fe72
target_turn: CLAUDE
authority_ref: D-114
applicable_review_id: ML-DEVOS-AS-140
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-114 and `ML-DEVOS-AS-140`.

## Objective

Promote the exact already-built `main` candidate `862dc45e-9ad7-4324-80ae-912adbb6ce82` to 100% of production in one deployment. Verify health and Access, collect RFC-022 §7 test 11 evidence, and roll back once only on a new material failure the candidate caused.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `DEPLOY_AUTHORIZED` is the only `YES` flag.
- `main` is `405375998392e936b71181de387ae395b7d46e40` (Workers Build `ded31be5…`).
- The candidate `862dc45e…` is inactive and carries the expected Access vars and `DB` / `MEDIA` / `ASSETS` bindings.
- Access application `b80acca4…` protects only `/admin` and `/admin/*` and uses policy `62653faa…` → `paulo.maisog@maisoglabs.com`.
- Active production is exactly `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.

## Governing references

- **T0:** Protocol V2; D-114; live STATE; `ML-DEVOS-AS-140`.
- **T1:** `ML-DEVOS-RFC-022` §5.4, §7 test 11, §10.1; D-100/D-101 (Gate D precedent); D-112/AS-139 (Gate C).

## Exact execution scope

Allowed:
- read-only Cloudflare reads (versions, deployments, Access, Workers analytics/observability);
- public HTTP GETs of `/`, `/api/journal`, `/api/design`, `/journal` and `/admin` (unauthenticated);
- exactly one deployment `862dc45e…` @ 100% (connector `POST …/workers/scripts/maisog-labs/deployments`, or `npx wrangler versions deploy 862dc45e-9ad7-4324-80ae-912adbb6ce82@100% --yes`);
- at most one conditional rollback to `53137101…` @ 100%;
- one Protocol V2 Builder return.

Not allowed:
- a traffic or canary split; a second candidate; version upload; `wrangler deploy`; rebuild;
- D1 query/write/migration/restore; R2; content, `site_settings` or email changes;
- Access, DNS, binding, secret, environment or observability changes;
- `main` merge; PR #7 or PR #10; S6/S7; D-068.

## SENTINEL Sync

- **Authority:** D-114 (Paulo).
- **Context:** AS-140 accepted the Access alignment and declared Gate D ready.
- **Capability:** one deployment plus one conditional rollback.
- **Execution:** fresh gate, baseline, promote, verify, measure.
- **Evidence:** pre and post deployment ids, HTTP smoke, Access re-check, test 11 figures or a stated limitation.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- After promotion `/` is Worker-first, but with no published bridge content it must return the artifact bytes (RFC-022 §5.4 fallback). A changed body on `/` is a failure signal, not an expected change.
- `/admin` goes from a Worker-side 401 (placeholder config) to Access-protected with real config. An unauthenticated probe must be intercepted by Access (redirect to the team domain), never reach the admin UI.
- CPU evidence depends on what the analytics API exposes. Its absence is a reported limitation, not a rollback reason.

## Instructions

1. Bootstrap. Run the pre-promotion gate; any mismatch stops.
2. Collect the baseline.
3. Deploy once.
4. Verify; collect the post-promotion measurement.
5. Roll back only on a qualifying failure.
6. Publish the return.

## Validation and evidence

- `PRE_GATE_D` and `POST_GATE_D` active version, allocation and deployment id.
- The exact operation performed.
- HTTP status and body identity for `/`; API and page health; the `/admin` Access behavior.
- Latency samples (median, p95); CPU statistics and source, or the limitation.
- Rollback status.

## Stop conditions

- Any pre-promotion gate mismatch.
- The deployment result is anything other than exactly `862dc45e…` @ 100%.
- A qualifying failure after promotion: roll back once, verify, stop.
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-RFC022-GATE-D-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
