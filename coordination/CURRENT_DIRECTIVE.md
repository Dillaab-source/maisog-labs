# Current Directive — RFC-022 Tier 1 Implementation (D-106)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-TIER1-IMPL-0001
cycle_id: MAISOGLABS_WEB_RFC022_TIER1_IMPL
issue_parent_commit: c0eb486e576a843bda94b5a6465bfa9e0f98eb63
target_turn: CLAUDE
authority_ref: D-106
applicable_review_id: ML-DEVOS-AS-132
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-106, `ML-DEVOS-RFC-022` and `ML-DEVOS-AS-132`.

## Objective

Implement RFC-022 Tier 1, CB-1 through CB-5, in the repository with local evidence only:
- the bridge;
- migration `0006`;
- the extended project lifecycle;
- the contact-email lifecycle;
- the admin Content UI;
- the protected homepage preview;
- exact `/` wiring;
- tests and browser evidence.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MUTATION_AUTHORIZED` and `AUDIT_APPEND_AUTHORIZED` are the only `YES` flags.
- `main` is `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- `public/index.html` SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

## Governing references

- **T0:** Protocol V2; D-106; live STATE; `ML-DEVOS-RFC-022`; `ML-DEVOS-AS-132`.
- **T1:** D-105; `ML-DEVOS-AS-131`; `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md`; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed:
- repository code, tests and docs for CB-1..CB-5 per RFC-022 §10;
- local D1 migrations and tests;
- a local build and local browser evidence;
- one Protocol V2 Builder return.

Not allowed:
- modifying `public/index.html` or `public/assets/**`;
- CB-R; remote D1/R2; Cloudflare, Access or DNS changes;
- production content; deployment; `main`;
- `/api/site-content`; the Journal bridge; Tier 2; About/CTA; project deletion;
- S6/S7, A-3/A-6, PR #7, PR #10, D-068, `devos/execution/`, `tests/fixtures/execution/`.

## SENTINEL Sync

- **Authority:** D-106 (Paulo).
- **Context:** RFC-022 accepted in AS-132.
- **Capability:** repository mutation and local audit writes only.
- **Execution:** CB-1..CB-5 in one return.
- **Evidence:** the tests listed in RFC-022 §7 plus AS132-F001.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- AS132-F002 is a release gate, not an implementation gate. No project copy or email status is invented.
- The admin identity requirement (`paulo.maisog@maisoglabs.com`) applies at the future Access wiring step and to any retained application-level email pin. The governed Worker has none.

## Instructions

1. Bootstrap.
2. Implement CB-1..CB-5.
3. Run the local tests, build, migrations and browser evidence.
4. Publish the return.

## Validation and evidence

- the RFC-022 §7 tests;
- AS132-F001 header and cache tests;
- the artifact SHA;
- local migration results;
- browser evidence;
- CPU and latency where measurable.

## Stop conditions

- A required change falls outside scope.
- The artifact would need to change.
- Any remote or production action would be needed.

## Next action

Publish `H-WEB-RFC022-TIER1-IMPL-0001`. Reset every flag to `NO` and route `TURN: ARCHITECT`.
