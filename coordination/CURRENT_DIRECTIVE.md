# Current Directive — RFC-022 CB-R Access identity alignment (D-113)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-CBR-ACCESS-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 7555f48809e40abaeea3ddca084d53b4fff1e846
target_turn: CLAUDE
authority_ref: D-113
applicable_review_id: ML-DEVOS-AS-139
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-113 and `ML-DEVOS-AS-139`.

## Objective

Make the `maisoglabs.com/admin` Access application allow exactly the D-106 identity `paulo.maisog@maisoglabs.com`, with the minimal policy mutation, and change nothing else.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MUTATION_AUTHORIZED` is the only `YES` flag.
- Application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b` exists with domain `maisoglabs.com/admin` and AUD `ef44d36e…0cea22`; the team domain is `jolly-disk-0469.cloudflareaccess.com`.
- Its only policy is `460d0315-1e4b-414a-8845-c656f1f04c79` (reusable).
- Active production is `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%.

## Governing references

- **T0:** Protocol V2; D-113; live STATE; `ML-DEVOS-AS-139`.
- **T1:** AS138-F001 (`ML-DEVOS-AS-138`); D-106 (canonical admin identity); D-103 (bounded Cloudflare configuration change precedent).

## Exact execution scope

Allowed:
- read-only Access reads: applications, their policies, reusable policies, identity providers, organization;
- read-only Worker deployment reads;
- exactly one of:
  - **not shared:** a PUT on reusable policy `460d0315…` changing only its `include` to the single email `paulo.maisog@maisoglabs.com`;
  - **shared:** creating one dedicated allow policy (include only that email) and updating application `b80acca4…` so its `policies` list references the dedicated policy instead of the shared one, with every other application field unchanged;
- one Protocol V2 Builder return.

Not allowed:
- editing a shared reusable policy; editing any other application or policy;
- changing the application's domain, destinations, AUD, identity providers, session duration or other settings;
- Gate D; Worker deploy, upload, promotion or traffic change;
- D1, R2, content, `site_settings`, email, DNS, binding, secret or environment changes;
- `main` merge; PR #7 or PR #10.

## SENTINEL Sync

- **Authority:** D-113 (Paulo).
- **Context:** AS-139 confirmed AS138-F001; D-106 is unchanged.
- **Capability:** one Access policy mutation.
- **Execution:** read, decide shared or not, mutate once, verify.
- **Evidence:** the pre- and post-change application and policy state, and the unchanged Worker deployment.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- The policy is marked `reusable`, which means it can be shared, not that it is. The shared/not-shared branch must be decided from a read of every Access application's policy references, not from the flag.
- An application update request may require resending the full application object. If so, every field other than `policies` must be sent back exactly as read, and verified unchanged afterwards.

## Instructions

1. Bootstrap. Record the full pre-change application object, the policy, and every application's policy references.
2. Apply the one mutation the rule selects.
3. Verify the post-change state and the unchanged Worker deployment.
4. Publish the return.

## Validation and evidence

- Pre- and post-change: the application's domain, self-hosted domains, destinations, AUD, allowed IdPs, session duration and policy ids.
- The allowed identity for this application after the change.
- Every other application's policy references, before and after.
- The active Worker deployment before and after.

## Stop conditions

- Any precondition differs (application, AUD, domain or policy set).
- The API would change any field other than the targeted policy identity or policy reference.
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-RFC022-CBR-ACCESS-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
