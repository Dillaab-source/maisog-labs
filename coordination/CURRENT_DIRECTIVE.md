# Current Directive — D-115 drafts through an owner-authenticated browser (D-116)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-CONTENT-DRAFTS-0002
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 4e363fbf595db5b9fa20e408fa7a241f53686165
target_turn: CLAUDE
authority_ref: D-116
applicable_review_id: ML-DEVOS-AS-142
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-116, D-115 (content) and `ML-DEVOS-AS-142`.

## Objective

Create exactly the five D-115-approved production project drafts through the admin UI, in an interactive browser session that Paulo can see and authenticates himself. Read them back and validate them; capture desktop preview evidence. Nothing is published.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; the only `YES` flags are `MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED` and `REMOTE_D1_AUTHORIZED`.
- **The executing Claude session has an owner-visible interactive browser** (the Claude desktop browser pane, computer-use on Paulo's machine, or Claude in Chrome). A headless browser that Paulo cannot see does not qualify.
- Production is `862dc45e-9ad7-4324-80ae-912adbb6ce82` @ 100%. `/` serves the D-093 artifact (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`). D1 has 0 projects.

## Governing references

- **T0:** Protocol V2; D-116; D-115 (the canonical content JSON); live STATE; `ML-DEVOS-AS-142`.
- **T1:** `ML-DEVOS-RFC-022` §5.6; D-111; D-106.

## Exact execution scope

Allowed:
- open `https://maisoglabs.com/admin` in the owner-visible browser and stop at the Access login;
- after Paulo confirms the authenticated admin UI is loaded: create the five drafts in the admin UI with the exact D-115 values, in the D-105 order;
- authenticated reads (`/admin/api/content`, `/admin/api/projects/:id/preview`, `/admin/preview/home`);
- a read-only production D1 read-back of the five drafts;
- local revalidation (production validators, `initialReleaseReadiness`);
- a desktop screenshot of `/admin/preview/home`;
- an unauthenticated GET of public `/`;
- one Protocol V2 Builder return.

Not allowed:
- retrieving, requesting, storing or bypassing the OTP; any other identity;
- publish, "Activate initial homepage projects", or any activation marker;
- contact/`site_settings` changes;
- direct D1 writes; a service token; any Access change;
- deploy; R2; schema or migration; `main` merge;
- V10.1 work; mobile preview (deferred).

## SENTINEL Sync

- **Authority:** D-116 (Paulo), for the content approved in D-115.
- **Context:** AS-142 accepted the D-115 authentication stop.
- **Capability:** five drafts, as the owner identity only.
- **Execution:** the owner authenticates and the Builder types only the approved values.
- **Evidence:** revision ids, validation, readiness, the desktop preview, the unchanged `/`.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **UI coverage:** the admin form must be able to carry every D-115 field (`id`, `slug`, `order`, `category`, `title`, `summary`, `stack`, `accent`, `icon`, `featured`, `v10`). If any value cannot be entered exactly through the UI, stop and report rather than approximate.
- **No activation click:** the Projects tab shows an "Activate initial homepage projects" button once all five drafts exist. Clicking it is forbidden under D-116.

## Instructions

1. Bootstrap. Confirm an owner-visible interactive browser is available; if not, stop.
2. Open `/admin` and stop at Access. Wait for Paulo's confirmation.
3. Create the five drafts exactly. Read them back and validate them. Check readiness. Capture the desktop preview. Confirm `/` is unchanged.
4. Publish the return.

## Validation and evidence

- Project ids and draft revision ids; the read-back field comparison against D-115.
- Validation and `initialReleaseReadiness` results.
- The desktop preview screenshot.
- `/` SHA-256; D1 counts: 5 projects, 0 published, 0 activation markers.

## Stop conditions

- No owner-visible browser; authentication not confirmed by Paulo.
- The UI cannot carry an exact D-115 value; a save fails or produces a different stored value.
- Anything would be published or activated; any non-authorized action.

## Next action

Publish `H-WEB-RFC022-CONTENT-DRAFTS-0002`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
