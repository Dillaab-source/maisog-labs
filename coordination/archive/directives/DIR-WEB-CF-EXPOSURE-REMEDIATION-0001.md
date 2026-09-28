# Current Directive — Cloudflare Exposure Remediation A-1 + A-4

```yaml
schema_version: 1
directive_id: DIR-WEB-CF-EXPOSURE-REMEDIATION-0001
cycle_id: MAISOGLABS_CF_EXPOSURE_REMEDIATION
issue_parent_commit: 872f31b16000fa2407a7bc37beffc83f35548d5c
target_turn: CLAUDE
authority_ref: D-103
applicable_review_id: ML-DEVOS-AS-129
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-103 and `ML-DEVOS-AS-129`.

## Objective

Execute exactly two reversible exposure reductions from AS-129:

- **A-1:** disable `maisog-labs` preview URLs.
- **A-4:** disable `maisog-labs-staging` `workers.dev` and preview URLs.

Verify, then return.

## Preconditions

- Protocol V2 bootstrap passes on the published D-103 tip; STATE selects this directive; `MUTATION_AUTHORIZED: YES` is the only `YES` flag.
- `main` is still `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- A fresh read shows:
  - `maisog-labs`: `enabled: true`, `previews_enabled: true`;
  - `maisog-labs-staging`: `enabled: true`, `previews_enabled: true`.
- Active production is still `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%, and the custom domain `maisoglabs.com` is bound to `maisog-labs`.

## Governing references

- **T0:** Protocol V2; D-103; live STATE; `ML-DEVOS-AS-129`.
- **T1:** D-102; `docs/security/CF_INVENTORY_EXPOSURE_REVIEW.md` (A-1, A-4, F-1, F-3); `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed:
- Cloudflare `GET` reads needed for the pre-read, verification and evidence: script subdomain settings, settings/bindings, deployments, custom domains.
- **A-1:** exactly one `POST /accounts/{account}/workers/scripts/maisog-labs/subdomain` with body `{"enabled": true, "previews_enabled": false}`. The API requires `enabled`; `true` re-asserts its current, unchanged value.
- **A-4:** exactly one `POST /accounts/{account}/workers/scripts/maisog-labs-staging/subdomain` with body `{"enabled": false, "previews_enabled": false}`.
- A read-only HTTP probe of `https://maisoglabs.com/`.
- **Conditional rollback:** one `POST` of the exact prior body per action, only on the D-103 failure conditions.
- One Protocol V2 Builder return.

Not allowed:
- any other Cloudflare write, including `DELETE …/subdomain`;
- disabling `maisog-labs` `workers.dev`;
- A-2, A-3, A-5, A-6, A-7, A-8, A-9;
- Builds triggers, Access, n8n or DNS changes;
- deployment, traffic or version changes;
- Worker deletion or rename;
- D1/R2 data access; binding, secret or environment changes;
- `main`, PR #7, PR #10, S6/S7, D-068, `devos/execution/`, `tests/fixtures/execution/`, `stash@{0}`.

## SENTINEL Sync

- **Authority:** D-103 (Paulo).
- **Context:** AS-129 accepted the assessment and prioritized A-1 and A-4.
- **Capability:** the connector can make any Cloudflare write, but capability is not authority; only the two subdomain `POST`s are allowed.
- **Execution:** fresh pre-read, then two single operations, each with an immediate read-back.
- **Evidence:** pre and post settings, operation responses, production checks.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.

- The API's required `enabled` field means A-1's request carries `enabled: true`. This is not a `workers.dev` change, provided the pre-read shows `true`. If the pre-read shows otherwise, stop.
- Disabling `maisog-labs` previews ends public version-preview URLs, including the preview host used for past Gate smoke tests. This is an accepted consequence (AS-129).
- The session network allowlist may prevent probing the disabled hosts. Post-state evidence is then the API read-back.

## Instructions

1. Bootstrap from the published tip and verify the preconditions.
2. Record the pre-change settings.
3. Run A-1, then read back.
4. Run A-4, then read back.
5. Verify production and bindings.
6. Roll back only on the defined conditions.
7. Publish the return.

## Validation and evidence

- pre-change and post-change subdomain settings for both Workers;
- exact requests and responses;
- active deployment before and after;
- custom domain and bindings before and after;
- `maisoglabs.com` health;
- rollback status.

## Stop conditions

- Any precondition differs, or a setting already differs materially from AS-129: stop without change.
- A read-back does not show the target state: stop and report; do not retry with other operations.
- Any unrelated setting changed: stop and report.

## Next action

Publish `H-WEB-CF-EXPOSURE-REMEDIATION-0001`. Archive and deselect this directive, reset `MUTATION_AUTHORIZED` to `NO`, and route `TURN: ARCHITECT`.
