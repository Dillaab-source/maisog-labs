# Current Directive — D-093 Gate D Exact Production Promotion

```yaml
schema_version: 1
directive_id: DIR-WEB-D093-GATE-D-0001
cycle_id: MAISOGLABS_WEB_D093_GATE_D
issue_parent_commit: 63285b70943066c81454e5aac2bec995be08da8a
target_turn: CLAUDE
authority_ref: D-095
applicable_review_id: ML-DEVOS-AS-121
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-095 and `ML-DEVOS-AS-121` (with the `ML-DEVOS-AS-122` coordination sync).

## Objective

Perform D-095 Gate D only: promote Worker Version `f473c170-b39c-4d7b-85ad-a99c5208d539` to production at 100% with exactly one command, verify production read-only, and roll back once to `a667fc09-12d1-4fde-a75d-5d660729baa3 @ 100%` only if the promotion causes a new material failure.

## Preconditions

Freshly, immediately before deployment:

- Protocol V2 bootstrap passes and live STATE selects this directive with `DEPLOY_AUTHORIZED: YES` and every other action flag `NO`.
- `main` is still `7d22a96d10b5e24f5296795c2b049f77093386c3`.
- The successful `main` Workers Build `8abe1ba1-4b7d-45d3-84b8-97f2beea8cfe` still binds Version `f473c170-b39c-4d7b-85ad-a99c5208d539` (GitHub check run `108500903744`, Architect-verified), and that version still exists.
- Active production is exactly `a667fc09-12d1-4fde-a75d-5d660729baa3` at 100%, with no traffic split, deployment drift, candidate identity change or intervening promotion.
- Working tree clean; `stash@{0}` untouched.

## Governing references

- **T0:** Protocol V2; D-095; live STATE; `ML-DEVOS-AS-121`.
- **T1:** `ML-DEVOS-AS-122` (non-authorizing coordination sync); D-093; D-094; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed: read-only Cloudflare deployment/version reads; exactly one `npx wrangler versions deploy f473c170-b39c-4d7b-85ad-a99c5208d539@100% --yes`; bounded read-only production HTTP verification; at most one conditional `npx wrangler versions deploy a667fc09-12d1-4fde-a75d-5d660729baa3@100% --yes`; one Protocol V2 Builder return.

Not allowed: `wrangler deploy`; any version upload; split or gradual traffic; any other version; routes/triggers, DNS/domain, Access, secrets, environment variables, bindings, D1, R2, migrations, production data; website/runtime/product code; `main`; PR #7; PR #10; S6/S7; D-068 or `devos/execution/` / `tests/fixtures/execution/`.

## SENTINEL Sync

**Authority:** D-095 (Paulo). **Context:** `main`, build, target version and rollback target are bound. **Capability:** production promotion of one exact version plus one conditional rollback only; `DEPLOY_AUTHORIZED` does not imply any other Cloudflare action. **Execution:** one pass with fresh pre-deploy checks. **Evidence:** pre/post deployment reads, deployment ID/time, production HTTP checks. Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`. The known AS-116 Journal/API incident is pre-existing and is neither a Gate D failure nor in scope to fix. Any identity drift, traffic split or ambiguous Cloudflare state is a stop condition, not something to repair.

## Instructions

1. Bootstrap fresh; verify every precondition and record the pre-deploy active version and traffic.
2. Run exactly `npx wrangler versions deploy f473c170-b39c-4d7b-85ad-a99c5208d539@100% --yes`.
3. Re-read the active deployment; require exactly `f473c170-b39c-4d7b-85ad-a99c5208d539` at 100%; record deployment ID and time.
4. Run bounded read-only production checks of the homepage (status, served artifact identity, key assets) and confirm no new deployment-caused failure.
5. Only if step 4 shows a new material failure caused by this release: record the evidence, run exactly `npx wrangler versions deploy a667fc09-12d1-4fde-a75d-5d660729baa3@100% --yes`, and verify `a667fc09-12d1-4fde-a75d-5d660729baa3` at 100%.

## Validation and evidence

Pre-deploy active version and percentage; exact command and output; post-deploy active version and percentage; deployment ID/time; production HTTP evidence (homepage status and artifact SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` where retrievable); rollback status and evidence; confirmation that no unrelated resource was touched. Builder evidence is `ACTOR_REPORTED`.

## Stop conditions

Stop without deploying if any precondition fails or any identity differs. After deployment, stop without further action if Cloudflare reports anything other than the exact target at 100%, except the single authorized rollback. Never deploy any other version, repair AS-116, or change configuration.

## Next action

Publish one Protocol V2 Builder return, archive and deselect this directive, reset `DEPLOY_AUTHORIZED` and every action flag to `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES` for independent Gate D closure review.
