# Current Directive — RFC-022 CB-R AS-137 remediation (D-111)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-CBR-REM1-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: df5b4e153e8c0ff21be2fbc10b6521b1ed8d69ef
target_turn: CLAUDE
authority_ref: D-111
applicable_review_id: ML-DEVOS-AS-137
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-111 and `ML-DEVOS-AS-137`.

## Objective

Remediate AS137-F001 (initial five-project activation) and AS137-F002 (Access placeholders) in the repository, together with the `site_settings` first-draft bootstrap and the narrow release-semantics update D-111 names.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MUTATION_AUTHORIZED` is the only `YES` flag.
- `main` is `fda42e04d18b960d8212d49616f96b657a5c6bf3`.
- Production D1 is at `0001`–`0006`; active production is `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%. Both are context only; neither is touched.

## Governing references

- **T0:** Protocol V2; D-111; live STATE; `ML-DEVOS-AS-137`.
- **T1:** `ML-DEVOS-RFC-022`; D-105 (initial set and order); D-106; D-107 / `ML-DEVOS-AS-133` (AS133-F001: no permanent five-project runtime gate); `ML-DEVOS-AS-132` (AS132-F002).

## Exact execution scope

Allowed:
- repository code, tests and documentation changes for the five D-111 items;
- local tests, local D1 and local builds;
- read-only Cloudflare API reads of the existing `maisoglabs.com/admin` Access application;
- one Protocol V2 Builder return on `governance/maisoglabs-v0.1`.

Not allowed:
- any production D1 write; production content creation or publication; production email change;
- Gate D; deploy; version upload by hand; promotion;
- Access application or policy mutation; DNS, R2, secret or environment mutation;
- new migrations, unless the implementation proves one is the smallest safe design (then stop and report instead of adding it);
- `main` merge; PR #7 or PR #10;
- a new planning RFC, unless an implementation-blocking architectural issue is found.

## SENTINEL Sync

- **Authority:** D-111 (Paulo).
- **Context:** AS-137 accepted `0006` and named two release blockers.
- **Capability:** repository/local mutation only.
- **Execution:** one bounded remediation cycle.
- **Evidence:** test and build output, the diff, and the provenance of the Access values.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- "Prevent partial first activation" and "no permanent five-project runtime gate" must both hold. The guard belongs on the admin write path before the first activation, and must switch off durably once initial activation has happened. The public read path keeps accepting any valid 1..5.
- The Access values are non-secret configuration, but they come from production. Only read them; never change the Access application.

## Instructions

1. Bootstrap.
2. Implement items 1–4 of D-111, keeping to the smallest safe design.
3. Add the tests D-111 requires; run the full suite and the production build.
4. Publish the return.

## Validation and evidence

- The files changed and the design chosen for initial activation and bootstrap.
- The source of the Access values (read-only API call) and the exact values used.
- Full test suite and build results.
- Confirmation that no remote resource was mutated and `main` is unchanged.

## Stop conditions

- The smallest safe design needs a schema migration, a new table, or a public-runtime gate.
- The Access application cannot be read, or its values are ambiguous (more than one candidate application).
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-RFC022-CBR-REM1-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
