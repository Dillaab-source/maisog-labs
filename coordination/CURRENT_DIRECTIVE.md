# Current Directive — RFC-022 Amendment (D-105)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-AMEND-0001
cycle_id: MAISOGLABS_WEB_RFC022_AMENDMENT
issue_parent_commit: 716b9b74658a3c40c147ce60f1b674e25068d45e
target_turn: CLAUDE
authority_ref: D-105
applicable_review_id: ML-DEVOS-AS-131
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-105 and `ML-DEVOS-AS-131`.

## Objective

Amend `devos/changes/rfcs/ML-DEVOS-RFC-022.md` to incorporate:
- Paulo's D-105 decisions Q1–Q5;
- the AS-131 findings (the D-093 served-byte amendment; the Worker-execution dependency precision; the Tier 1 scope; deferrals; no public API; the twelve acceptance tests).

Return it for final Architect review. RFC-022 stays `DRAFT`.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; every action flag is `NO`.
- `main` is `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- `public/index.html` SHA-256 is `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

## Governing references

- **T0:** Protocol V2; D-105; live STATE; `ML-DEVOS-AS-131`.
- **T1:** D-104; D-093; `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md` (accepted planning basis); `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed:
- editing `devos/changes/rfcs/ML-DEVOS-RFC-022.md`, and its row in `devos/changes/rfcs/README.md`;
- repository reads;
- one Protocol V2 Builder return.

Not allowed:
- any other file change, including the accepted plan, `HOMEPAGE_ARTIFACT_CONTRACT.md`, `public/**`, `app/**`, `worker/**`, `migrations/**`, tests and config;
- CB-1..CB-7;
- Cloudflare; remote D1/R2; deployment; `main`;
- A-3, A-6, S6/S7, PR #7, PR #10, D-068.

## SENTINEL Sync

- **Authority:** D-105 (Paulo), amendment of a DRAFT RFC only.
- **Context:** AS-131 accepted the plan, and the owner answered Q1–Q5.
- **Capability:** documentation only.
- **Execution:** single pass.
- **Evidence:** the diff of RFC-022.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- Eternal Eggs is not in the artifact's `MLData`, and no approved Eternal Eggs copy exists in the repository. The RFC must not invent content: facts are entered through the admin lifecycle later.
- Email deliverability is an owner-attested precondition that the system cannot verify.

## Instructions

1. Bootstrap.
2. Amend RFC-022 to incorporate D-105 and AS-131.
3. Keep `DRAFT`.
4. Publish the return.

## Validation and evidence

- the RFC diff;
- the traceability validator has no new errors;
- the artifact SHA is unchanged.

## Stop conditions

Stop if the amendment would require a change outside RFC-022 and its index row.

## Next action

Publish `H-WEB-RFC022-AMEND-0001`. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`.
