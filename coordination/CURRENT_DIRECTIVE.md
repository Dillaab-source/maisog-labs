# Current Directive — Cloudflare Inventory & Exposure Review (read-only)

```yaml
schema_version: 1
directive_id: DIR-WEB-CF-INVENTORY-0001
cycle_id: MAISOGLABS_CF_INVENTORY_REVIEW
issue_parent_commit: 2f3f82cd9ed2e903bdd6096897a372511de34904
target_turn: CLAUDE
authority_ref: D-102
applicable_review_id: ML-DEVOS-AS-128
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-102 and `ML-DEVOS-AS-128`.

## Objective

Carry out the D-102 assessment. Inventory and classify, read-only, the Cloudflare resources found during D-101, and map them against repository intent. Produce findings and a remediation proposal. Execute nothing.

## Preconditions

- Protocol V2 bootstrap passes, STATE selects this directive, and every action flag is `NO`.
- `main` is still `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- The Cloudflare MCP/API connector is available for read (`GET`) calls.

## Governing references

- **T0:** Protocol V2; D-102; live STATE; `ML-DEVOS-AS-128`.
- **T1:** D-101 (inventory findings); `wrangler.jsonc`; `worker/`; `docs/ARCHITECTURE.md`; `brain/PROJECT_GOVERNANCE.md`; `brain/RISK_REGISTER.md`; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed:
- Cloudflare `GET` reads of configuration and metadata:
  - Workers: scripts, settings, bindings (names and types only), routes, custom domains, `workers.dev` and preview settings, deployments, versions;
  - the Pages project;
  - D1 database metadata;
  - R2 bucket configuration (public access, custom domains, CORS);
  - Access applications and policies;
  - zone DNS records for `maisoglabs.com`;
- unauthenticated HTTP `GET` / `HEAD` probes of public hostnames, to observe exposure;
- repository reads;
- one Protocol V2 Builder return.

Not allowed:
- any Cloudflare `POST` / `PUT` / `PATCH` / `DELETE`;
- D1 SQL of any kind;
- R2 object listing, reads or writes;
- reading secret values;
- authenticated requests to any application;
- any deploy, deletion, rename, or traffic, DNS, Access, setting, binding, secret or environment change;
- code or `main` changes;
- PR #7, PR #10, S6/S7, D-068.

## SENTINEL Sync

- **Authority:** D-102 (Paulo), assessment only.
- **Context:** Gate D closed at `ML-DEVOS-AS-128`; production is `53137101…` @ 100%.
- **Capability:** the connector can write, but that capability is not authority. Only `GET` is used.
- **Execution:** single read-only pass.
- **Evidence:** `ACTOR_REPORTED` Cloudflare reads and HTTP probes.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.

- Only `maisog-labs` and its D1/R2 bindings are documented in the repository. The other resources are known only from D-101 inventory notes, so repository intent for them may simply be absent. Absence is not evidence of obsolescence.
- If any finding looks urgent, it is reported. It is not acted on.

## Instructions

1. Bootstrap fresh.
2. Read the Cloudflare configuration for every in-scope resource, and any directly related resource discovered on the way.
3. Probe public exposure with unauthenticated requests.
4. Map to repository references.
5. Classify, identify dependencies, and draft the remediation plan as independently authorizable actions.
6. Publish the return.

## Validation and evidence

- the inventory table with IDs;
- the evidence behind each classification;
- the exposure probes (URL, status, redirect target);
- uncertainties stated explicitly;
- confirmation that only `GET` calls were made.

## Stop conditions

- Stop if any step would require a non-`GET` Cloudflare call, SQL, R2 object access, a secret value or authentication.
- Report a finding that looks urgent; do not remediate it.

## Next action

Publish the Builder return `H-WEB-CF-INVENTORY-0001`. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`.
