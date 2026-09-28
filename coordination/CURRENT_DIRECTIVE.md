# Current Directive — RFC-022 initial content drafts and protected preview (D-115)

```yaml
schema_version: 1
directive_id: DIR-WEB-RFC022-CONTENT-DRAFTS-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: 68a614de98290b744a28c4afc43699a94ab384f1
target_turn: CLAUDE
authority_ref: D-115
applicable_review_id: ML-DEVOS-AS-141
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-115 and `ML-DEVOS-AS-141`.

## Objective

Create the five D-115-approved production project drafts through the authenticated admin lifecycle, read them back, revalidate them, and capture protected preview evidence. Nothing is published and the public homepage is unchanged.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; the only `YES` flags are `MUTATION_AUTHORIZED`, `AUDIT_APPEND_AUTHORIZED` and `REMOTE_D1_AUTHORIZED`.
- Production is `862dc45e-9ad7-4324-80ae-912adbb6ce82` @ 100%. `/` serves the D-093 artifact in fallback.
- The Builder can authenticate as Paulo (`paulo.maisog@maisoglabs.com`) through Cloudflare Access on `maisoglabs.com/admin`.

## Governing references

- **T0:** Protocol V2; D-115; live STATE; `ML-DEVOS-AS-141`.
- **T1:** `ML-DEVOS-RFC-022` §5.6, §10.1; D-111 (initial activation, bootstrap); D-106 (admin identity).

## Exact execution scope

Allowed:
- authenticated `POST /admin/api/projects` for exactly the five approved projects (D-115, byte-exact content);
- authenticated reads: `GET /admin/api/content`, `GET /admin/api/projects/:id/preview`, `GET /admin/preview/home`;
- local revalidation of the read-back drafts;
- public unauthenticated GETs of `/`;
- one Protocol V2 Builder return.

Not allowed:
- any project publish, initial activation or activation marker;
- contact/`site_settings` changes;
- direct D1 SQL; bypassing Access; a service token; any Access change;
- deploy; R2; DNS, binding, secret or environment changes; schema or migration; `main` merge;
- V10.1 remediation.

## SENTINEL Sync

- **Authority:** D-115 (Paulo).
- **Context:** AS-141 closed Gate D and opened owner content approval.
- **Capability:** five draft creations through the governed admin.
- **Execution:** only as the authenticated owner identity.
- **Evidence:** stored revision ids, validation, readiness, preview captures.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- The admin lifecycle is reachable only through Cloudflare Access with OTP to Paulo's mailbox. A Builder session without an owner-authenticated browser cannot satisfy the precondition, and every substitute is expressly forbidden. In that case the directive ends at the authentication stop condition.

## Instructions

1. Bootstrap. Check whether this session can authenticate as Paulo through Access.
2. If it cannot, stop: publish the return with the limitation.
3. Otherwise create the five drafts, read them back, revalidate, confirm readiness, capture the preview, and confirm `/` is unchanged.
4. Publish the return.

## Validation and evidence

- The authentication result.
- If executed: project ids and revision ids, validation, readiness, the preview (desktop and mobile), the unchanged `/`, no publication, and no marker.

## Stop conditions

- Authentication as Paulo is not possible.
- Any draft request fails validation, or anything would be published.
- Any step would need a non-authorized action.

## Next action

Publish `H-WEB-RFC022-CONTENT-DRAFTS-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
