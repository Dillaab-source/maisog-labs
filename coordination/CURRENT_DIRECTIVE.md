# Current Directive — RFC-022 initial project activation (D-125)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-INITIAL-ACTIVATION-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 4bc72aad469f3b38798b3d16f310040b10026199
target_turn: CLAUDE
authority_ref: D-125
applicable_review_id: ML-DEVOS-AS-149
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-125 and `ML-DEVOS-AS-149`.

## Objective

Activate exactly the recruiter-ready drafts (ClinicFlow 7, Eternal Eggs 8, Sentinel / DevOS 9, SU 10, Maisog Kilat 11) through the one existing atomic RFC-022 initial activation, verify the live homepage read-only, and return. Then record and prepare, local only, the D-125 recruiter homepage copy follow-up for Architect review.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; the only `YES` flags are `MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED` and `REMOTE_D1_AUTHORIZED`, for the one activation.
- Fresh read-only checks:
  - drafts 7–11 are current;
  - 0 published;
  - `initialReleaseReadiness()` is `true`;
  - 0 activation markers;
  - public `/` is the raw V10.1 artifact `220ce809…` (fallback, no span).

## Governing references

- **T0:** Protocol V2; D-125; live STATE; `ML-DEVOS-AS-149`.
- **T1:** D-111 (`POST /admin/api/projects/initial-activation`, AS137-F001); AS132-F002; D-124 (content); D-117/D-119 (owner-executed authenticated console channel); `ML-DEVOS-RFC-022` §5.4, §10.1.

## Exact execution scope

Allowed:
- read-only production D1 `SELECT`s, Cloudflare GETs and public HTTP GETs;
- one Builder-generated, locally dry-run console script, run by Paulo in the owner-authenticated `/admin` session. It makes exactly one `POST /admin/api/projects/initial-activation` with the five entries in rendered order and expected pointers `published: null`, `draft: 7/8/9/10/11`. The Builder cannot pass Cloudflare Access and never handles the OTP;
- a live read-only browser/HTTP smoke test after activation;
- after the activation return: local, repository-only preparation of the homepage copy follow-up (no commit to product files without review, no deploy);
- one Protocol V2 Builder return.

Not allowed:
- any other project publish, unpublish or edit; direct D1 SQL writes; service tokens; Access bypass;
- contact email, `site_settings`, deployment, code or design change in production, R2, Access, DNS, bindings, robots.txt, mobile, `og:image`;
- deploying the homepage copy follow-up.

## SENTINEL Sync

- **Authority:** D-125 (Paulo), after the owner preview.
- **Context:** AS-149 accepted the D-124 copy; activation must bind exactly to revisions 7–11.
- **Capability:** one authenticated atomic activation, owner-executed.
- **Execution:** fresh preflight → script → owner run → read-only verification.
- **Evidence:** published pointers, marker, audit, live `/` bridge, smoke test.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **Activation vs homepage copy:** the project copy is admin-owned (RFC-022 bridge). The intro text and the `HUMANITY / ORBITS / HIGHER` lines are code-owned in the V10.1 artifact. They are handled separately: the follow-up needs a new artifact, bridge constants and a governed release.
- **Execution channel:** the endpoint is Access-protected; owner execution under the D-117/D-119 channel.

## Instructions

1. Bootstrap. Run the fresh preflight; stop on any mismatch.
2. Generate the activation script; dry-run it locally against the real Worker code; record its SHA-256.
3. Paulo runs it once; the Builder verifies read-only and smoke-tests the live homepage.
4. Prepare the homepage copy follow-up locally (files, before/after, screenshots, tests/build, release assessment).
5. Publish the return.

## Validation and evidence

The D-125 "after activation" list, plus the follow-up preparation items.

## Stop conditions

- Any precondition mismatch.
- Any unexpected script response.
- Any published pointer or marker state other than exactly the five and exactly one marker.

## Next action

Publish `H-WEB-RFC022-INITIAL-ACTIVATION-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
