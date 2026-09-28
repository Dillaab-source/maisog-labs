# Current Directive — D-098 Hardening Gate D Production Promotion

```yaml
schema_version: 1
directive_id: DIR-WEB-D098-GATE-D-0001
cycle_id: MAISOGLABS_WEB_D098_GATE_D
issue_parent_commit: cb9d2da9869cfdad780d120678e238a9e5036587
target_turn: CLAUDE
authority_ref: D-100
applicable_review_id: ML-DEVOS-AS-127
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-100 and `ML-DEVOS-AS-127`.

## Objective

Perform D-100 Gate D only. Promote Worker Version `53137101-afb8-456c-ab83-d8b7b934df01`, which carries the D-098 hardening released by D-099 Gate C, to 100% production traffic with exactly one command. Verify production read-only. Roll back once to `f473c170-b39c-4d7b-85ad-a99c5208d539` only if the promotion causes a new material failure.

## Preconditions

Freshly, immediately before promotion:
- Protocol V2 bootstrap passes, and STATE selects this directive with `DEPLOY_AUTHORIZED: YES` and every other flag `NO`.
- The governance tip is the published D-100 transition, and `main` is still `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- The `main` Workers Build `e2a2d328-76d0-4361-816e-3b74c0c7b5c7` still binds candidate `53137101-afb8-456c-ab83-d8b7b934df01`, the candidate still exists, and no newer `main` release has superseded it.
- Read-only candidate smoke test on `https://53137101-maisog-labs.paulomaisog284.workers.dev`: `/` returns 200 and serves the D-093 artifact (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` where retrievable); `/api/journal` and `/api/design` are healthy; no 1101.
- A fresh `PRE_GATE_D_ACTIVE_VERSION_ID` reading is exactly `f473c170-b39c-4d7b-85ad-a99c5208d539` at 100%, with no split. Take it directly if the executor can; otherwise Paulo supplies one fresh dashboard reading (`OWNER_REPORTED`). The Gate C reading may not be reused.
- The worktree is clean apart from the untouched D-068 draft; `stash@{0}` is untouched.

## Governing references

- **T0:** Protocol V2; D-100; live STATE; `ML-DEVOS-AS-127`.
- **T1:** `ML-DEVOS-AS-126`; D-098; D-099; the D-095 Gate D precedent (`coordination/archive/directives/DIR-WEB-D093-GATE-D-0001.md`); `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed:
- read-only Cloudflare deployment and version reads;
- the read-only candidate smoke test;
- exactly one `npx wrangler versions deploy 53137101-afb8-456c-ab83-d8b7b934df01@100% --yes`;
- bounded read-only production HTTP checks;
- at most one conditional `npx wrangler rollback f473c170-b39c-4d7b-85ad-a99c5208d539 --message "D-100 rollback: newly caused Gate D production failure"`;
- one Protocol V2 Builder return.

Not allowed:
- `wrangler deploy` or any version upload;
- any other version, split or gradual traffic, or force;
- D1 or R2 access or mutation;
- binding, Access, DNS, secret or environment changes;
- creating, deleting or renaming resources;
- code, repository or runtime changes;
- `main`, PR #7, PR #10, S6/S7, D-068 or `devos/execution/` / `tests/fixtures/execution/`;
- deliberately damaging D1 to test the 503 path.

## Executor

The Builder's cloud session has no Cloudflare network access or credential. Steps that touch Cloudflare or production HTTP must run from an environment with authenticated Cloudflare access, as for D-095 and D-097 (Paulo's local clone), under this directive and live STATE.

## SENTINEL Sync

- **Authority:** D-100 (Paulo).
- **Context:** `main`, build, candidate and rollback target are bound; the candidate's content was accepted by AS-126 and released by AS-127.
- **Capability:** one promotion plus one conditional rollback; `DEPLOY_AUTHORIZED` implies no other Cloudflare action.
- **Execution:** single pass with fresh pre-deploy checks.
- **Evidence:** smoke test, pre and post reads, deployment ID, production HTTP checks.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.

- The pinned `DB.database_id` equals the database production already binds (`45b87574…`). A binding failure after promotion would contradict that and is a rollback trigger.
- Empty Journal content and the `-local` names are known and are not failures.
- Any identity drift, split or ambiguous Cloudflare state is a stop condition, not something to repair.

## Instructions

1. Bootstrap fresh and verify the identities.
2. Run the candidate smoke test.
3. Take a fresh `PRE_GATE_D_ACTIVE_VERSION_ID` reading.
4. Run the promotion command exactly once, and record its output and the Deployment ID.
5. Re-read the active deployment; it must be `53137101-afb8-456c-ab83-d8b7b934df01` at 100%.
6. Run the production checks: `/`, `/api/journal`, `/api/design`, `/journal`, `/admin`.
7. Only if a new material failure is caused by this promotion: record the evidence, run the single rollback, verify `f473c170…` at 100%, re-check, and stop.

## Validation and evidence

- smoke-test results;
- pre-deploy active version and allocation;
- exact command and output;
- Deployment ID and time;
- post-deploy active version and allocation;
- production HTTP evidence and homepage artifact identity;
- rollback status;
- confirmation that no unrelated resource was touched.

Builder evidence is `ACTOR_REPORTED`; owner dashboard readings are `OWNER_REPORTED`.

## Stop conditions

- Stop without promotion if any precondition fails, the candidate is unhealthy, or production is not the single expected version at 100%.
- After promotion, take no further action unless Cloudflare reports anything other than the exact target at 100%; the only exception is the single authorized rollback.
- Never deploy any other version or change configuration.

## Next action

Publish the Builder return `H-WEB-D098-GATE-D-0001`. Archive and deselect this directive, reset `DEPLOY_AUTHORIZED` and every flag to `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `ARCHITECT_ACTION_REQUIRED: YES`. Do not start S6.
