# Current Directive — AS-133 Remediation Cycle 1 (D-107)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-TIER1-REM1-0001
cycle_id: MAISOGLABS_WEB_RFC022_TIER1_IMPL
issue_parent_commit: f31996832b014555b982b84cad9e0137d4fc6064
target_turn: CLAUDE
authority_ref: D-107
applicable_review_id: ML-DEVOS-AS-133
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-107 and `ML-DEVOS-AS-133`, within `ML-DEVOS-RFC-022`, `ML-DEVOS-AS-132` and D-106.

## Objective

Remediate AS133-F001:
- AS132-F002's exact D-105 five-project/order check becomes a CB-R release-readiness check only;
- normal public `/` bridge rendering accepts any valid published RFC-022 project group of 1..5.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MUTATION_AUTHORIZED` is the only `YES` flag.
- `public/index.html` SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.
- The reviewed return is `f31996832b014555b982b84cad9e0137d4fc6064`.

## Governing references

- **T0:** Protocol V2; D-107; live STATE; `ML-DEVOS-AS-133`.
- **T1:** D-106; D-105; `ML-DEVOS-RFC-022`; `ML-DEVOS-AS-132` (AS132-F001, AS132-F002); the archived `H-WEB-RFC022-TIER1-IMPL-0001`.

## Exact execution scope

Allowed:
- `worker/public/home.mjs`: stop applying the five-name gate to public rendering.
- `worker/bridge/payload.mjs`: keep the D-105 helper and its names; public/preview payload building must not require them.
- `worker/admin/content.mjs`, `app/admin/ContentClient.js`: status and wording only, to distinguish release readiness from runtime bridge validity.
- RFC-022 tests, evidence scripts and evidence docs; directly affected contract/architecture wording.
- A local build and local tests; one Protocol V2 Builder return.

Not allowed:
- a new table, migration, migration field, runtime activation flag, API or architecture change;
- `public/index.html` or `public/assets/**`;
- CB-R; production, remote D1/R2, Cloudflare, Access or DNS actions; production content; deployment; `main`;
- anything outside AS133-F001.

## SENTINEL Sync

- **Authority:** D-107 (Paulo), under AS-133.
- **Context:** the AS-133 finding is narrow and names the exact behavior.
- **Capability:** repository mutation only.
- **Execution:** one bounded remediation.
- **Evidence:** the AS-133 regression items 1–5.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- AS132-F002 ("until the initial activation condition passes, public `/` must retain the artifact's project data") and AS133-F001 (no permanent runtime gate) reconcile as follows:
  - the pre-activation guarantee is carried by the CB-R release-readiness check before the first production release;
  - it is not carried by a runtime flag, because D-107 forbids one.
- AS132-F002 stays a mandatory release condition.

## Instructions

1. Bootstrap.
2. Remove the runtime five-name gate from public `/`. Keep the D-105 helper and expose it as release readiness.
3. Add the AS-133 regression tests 1–5. Update the admin status wording if needed.
4. Run: full `npm test`, `npm run build`, the RFC-022 evidence scripts and `git diff --check`.
5. Publish the return.

## Validation and evidence

- AS-133 items 1–5.
- The existing artifact-fallback, draft-isolation, max-five and AS132-F001 tests still pass.
- The artifact SHA is unchanged.

## Stop conditions

- The fix would need a runtime flag, schema or API change.
- The artifact would need to change.
- Any remote or production action would be needed.

## Next action

Publish the remediation handoff. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
