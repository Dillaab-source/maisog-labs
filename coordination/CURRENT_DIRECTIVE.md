# Current Directive — V10.1 promotion preparation (D-121)

```yaml
schema_version: 1
directive_id: DIR-WEB-V101-PROMOTION-PREP-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: ae0419f73398cd43c140be0a4f76e6cb199f6d5b
target_turn: CLAUDE
authority_ref: D-121
applicable_review_id: ML-DEVOS-AS-145
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-121 and `ML-DEVOS-AS-145`.

## Objective

Prepare, in the repository only, the promotion of the exact AS-145-accepted V10.1 desktop candidate (SHA-256 `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`) as one atomic change: artifact, assets, SEO files, RFC-022 bridge constants and affected tests together.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MUTATION_AUTHORIZED` (repository-local) is the only `YES` flag.
- `candidates/v10.1/site/index.html` has SHA-256 `220ce809…`, 20,857 bytes, `</head>` at byte 20,116.
- The five D-115 production drafts stay unchanged and unpublished.

## Governing references

- **T0:** Protocol V2; D-121; live STATE; `ML-DEVOS-AS-145` (mandatory promotion invariant).
- **T1:** `ML-DEVOS-RFC-022` §5.1, §5.2, §5.4; D-120; D-115 (content); `candidates/v10.1/README.md` (promotion steps).

## Exact execution scope

Allowed, in one commit:
- copy the committed candidate bytes (`candidates/v10.1/site/index.html`, `v101/`, `robots.txt`, `sitemap.xml`, `_headers`) into `public/`, without rebuilding;
- set `ARTIFACT_SHA256`, `ARTIFACT_LENGTH` and `INSERTION_OFFSET` in `worker/bridge/inject.mjs` to the D-121 values;
- update the affected homepage-artifact, RFC-022 bridge and candidate tests;
- local test suite, build and headless-browser verification;
- the Protocol V2 Builder return in the same commit.

Not allowed:
- rebuilding or regenerating the candidate; any other artifact bytes;
- Gate C; `main` merge; Gate D; deployment or traffic change;
- any production D1/R2/Access/DNS/binding/secret/environment change; schema or migrations;
- project publication or activation; contact/`site_settings` changes; email publication;
- mobile remediation; `og:image`; unrelated cleanup or refactoring.

## SENTINEL Sync

- **Authority:** D-121 (Paulo).
- **Context:** AS-145 accepted the candidate and set the atomic promotion invariant.
- **Capability:** repository-only promotion preparation.
- **Execution:** copy exact bytes, update constants and tests atomically, verify.
- **Evidence:** commit SHA, changed-file set, hashes, test/build and browser results.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **Promotion vs no deploy:** the repository's `public/index.html` becomes V10.1, while production keeps serving V10 (Worker `862dc45e…`) until a separately authorized Gate C and Gate D. The repository and production intentionally diverge until then.
- **Canonical source:** the D-093 ZIP entry (`2417f7e5…`) stays the V10 design source from which V10.1 is derived; tests must keep that provenance while pinning the promoted bytes.

## Instructions

1. Bootstrap. Verify the candidate bytes against the accepted SHA-256.
2. Copy, update constants and affected tests in one change.
3. Run the full suite, the build and the browser/bridge verification.
4. Publish the return.

## Validation and evidence

The ten return items in D-121.

## Stop conditions

- The candidate bytes do not match `220ce809…`.
- Any required change would alter the artifact, need a production action, or widen scope beyond D-121.

## Next action

Publish `H-WEB-V101-PROMOTION-PREP-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
