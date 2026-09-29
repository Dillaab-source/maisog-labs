# Current Directive — RFC-022 recruiter-friendly project copy (D-124)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-CONTENT-COPY-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 69cf99d042007eea535154d2bffb199ffff473cd
target_turn: CLAUDE
authority_ref: D-124
applicable_review_id: ML-DEVOS-AS-148
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-124 and `ML-DEVOS-AS-148`.

## Objective

Revise the public-facing copy of the five existing unpublished D-115 project drafts to the exact D-124 content (compact JSON SHA-256 `8c76c749409521f9311be8c78e9f49de3e4b43ea7ca05e5d3baf5590bcd1beab`). Create one new immutable draft revision each through the authenticated admin lifecycle, verify read-only, check the desktop layout, and return for Paulo's final activation decision. Nothing is published or activated.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; the only `YES` flags are `MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED` and `REMOTE_D1_AUTHORIZED`, for these five draft revisions only.
- The five drafts exist, unpublished, with draft revision ids ClinicFlow 2, Eternal Eggs 3, Sentinel / DevOS 4, SU 5, Maisog Kilat 6 (`H-WEB-RFC022-CONTENT-DRAFTS-0002`). No `homepage_initial_activation` marker exists.
- Production serves V10.1 `8fd31f47…` @ 100%; public `/` is the raw artifact `220ce809…`.

## Governing references

- **T0:** Protocol V2; D-124; live STATE; `ML-DEVOS-AS-148`.
- **T1:** D-115 (identities and non-copy fields); D-117/D-118/D-119 (owner-executed authenticated console channel); `ML-DEVOS-RFC-022` §5.6, §10.1; AS132-F002 (unconsumed).

## Exact execution scope

Allowed:
- read-only production D1 `SELECT`s and Cloudflare GETs for verification;
- one Builder-generated, locally dry-run console script. Paulo (or the D-119 Work/browser operator) runs it in Paulo's owner-authenticated `/admin` session. It makes exactly five authenticated `PUT /admin/api/projects/:id/draft` calls, with exact expected pointers (`published: null`; draft 2/3/4/5/6). Each creates one immutable draft revision with the exact D-124 content. This is the existing authenticated lifecycle. The Builder cannot pass Cloudflare Access itself and never handles the OTP;
- local headless layout checks of the exact copy in V10.1 through the unchanged bridge;
- the protected preview `/admin/preview/home`, viewed in Paulo's authenticated session (`OWNER_REPORTED`);
- one Protocol V2 Builder return.

Not allowed:
- any project publish/unpublish; `POST /admin/api/projects/initial-activation`; a `homepage_initial_activation` marker;
- direct D1 SQL writes; service tokens; any Access bypass;
- V10.1, deployment, merge, `site_settings`, contact email, robots.txt/content signals, R2, DNS, bindings, secrets, environment;
- any field change beyond `category`, `summary`, `v10.tagline`, `v10.flow`.

## SENTINEL Sync

- **Authority:** D-124 (Paulo).
- **Context:** AS-148 accepted V10.1 live; initial activation is deferred for recruiter-friendly copy.
- **Capability:** five authenticated draft-revision PUTs, owner-executed.
- **Execution:** script → owner run → read-only verification → layout check.
- **Evidence:** revision ids, before/after copy, validators, readiness, preview, public `/` unchanged.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **"Keep the existing stack" vs display:** the D-124 stacks equal D-115's stored stacks exactly. The V10.1 homepage renders discipline tags, not `stack`. The category (`kind`) appears only in the Systems panel's "Used in projects" list. Recorded as a presentation note; no site change.
- **Execution channel:** D-124 requires the authenticated lifecycle; the Builder cannot authenticate through Cloudflare Access. The D-117/D-119 owner-executed console channel is the existing route. The Builder generates and dry-runs; the owner executes.

## Instructions

1. Bootstrap. Read-only verify the current five drafts and pointers.
2. Generate the D-124 console script and dry-run it locally against the real Worker code; record its SHA-256.
3. Paulo runs it in the authenticated `/admin` session and reports the output.
4. Verify read-only (field-by-field against D-124 canonical, validators, readiness, unpublished, no marker, `/` unchanged); collect preview evidence.
5. Publish the return.

## Validation and evidence

The D-124 return list.

## Stop conditions

- Current pointers differ from `null` / 2–6, or activation is already done.
- Any unexpected response from the script; any published pointer.
- Any stored field differs from the D-124 canonical content.

## Next action

Publish `H-WEB-RFC022-CONTENT-COPY-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: PAULO` (D-124).
