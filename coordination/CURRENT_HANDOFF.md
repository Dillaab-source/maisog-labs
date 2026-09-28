# Current Handoff — RFC-022 initial content drafts (D-115): authentication stop

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-CONTENT-DRAFTS-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: cb304f30713e01914d779c008768c6e38e83d797
review_target_commit: cb304f30713e01914d779c008768c6e38e83d797
applicable_review_id: ML-DEVOS-AS-141
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence class `ACTOR_REPORTED`:
- public unauthenticated HTTP GETs;
- one read-only production D1 `SELECT` (counts only), within the D-115 read-back scope;
- local validation.

## Objective

Execute `DIR-WEB-RFC022-CONTENT-DRAFTS-0001` (D-115): create the five approved production project drafts through the authenticated admin lifecycle, read them back, revalidate them, and capture protected preview evidence.

## Result

**STOPPED at the D-115 authentication stop condition. No draft was created. Nothing in production changed.**

This Builder session cannot authenticate as Paulo (`paulo.maisog@maisoglabs.com`) through Cloudflare Access:
- **Access intercepts every admin path.** Unauthenticated `GET https://maisoglabs.com/admin` and `GET /admin/preview/home` both return **302** to the Access login (`jolly-disk-0469.cloudflareaccess.com/cdn-cgi/access/login/maisoglabs.com`). The login `meta` token reports `auth_status: NONE` and `service_token_status: false`.
- **The only allowed identity needs an interactive email code.** Application `b80acca4…` allows exactly `paulo.maisog@maisoglabs.com` through the OTP identity provider. Signing in requires a one-time code delivered to that mailbox.
- **The session has no means to complete that login:**
  - no access to Paulo's mailbox;
  - no browser or computer-use tool attached;
  - no Access credential or cookie in its environment.
- **D-115 forbids every substitute:** bypassing authentication, direct D1 SQL, inventing a service token, and weakening Access. None was attempted.

The D-115 content approval itself is recorded durably in `brain/DECISION_LOG.md` (D-115), including the exact approved JSON.

## Tests and evidence

- **Content validation (local, before publication, production validators):** all five pass:
  - `validateProjectId`, `validateProjectSlug`, `validateProjectRevisionContent`;
  - `validateProjectsGroup` → valid;
  - `initialReleaseReadiness` → **true**;
  - orders are 1–5 in the D-105 order. The content file SHA-256 was `286530730a03e037cf073266588100864821da07b415fbf9ba12796b618d52ce` (a scratch file; the canonical text is the JSON in D-115).
- **Public `/` (2026-09-28T21:53:20Z):** 200, SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`, the unchanged D-093 artifact in fallback.
- **Production D1 read (counts only):** `projects` 0, `project_revisions` 0, `audit_log` 0, `homepage_initial_activation` markers 0, `site_settings` 0. The query reported `changed_db: false` and `rows_written: 0`.
- **Not done:**
  - no project draft, publish, initial activation or marker;
  - no contact or `site_settings` change;
  - no deploy; no R2, Access, DNS, binding, secret, environment or schema change; no `main` merge.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-CONTENT-DRAFTS-0001.{md,provenance.json}` (byte-for-byte) and the index row.
- **Unchanged:** `coordination/OPERATIVE_OBLIGATIONS.md`. The D-115 record itself is in the preceding transition (`cb304f3`).

## Unresolved findings and limitations

- **No path to the authenticated admin from this Builder session.** It is the same class of limitation as D-110, where Wrangler authentication existed only on Paulo's machine. The following options are for Paulo and the Architect; none is proposed as authorized:
  1. **Owner-executed drafts.** Paulo signs in at `https://maisoglabs.com/admin` in his own browser and saves the five drafts with the exact D-115 values (Content → Projects), without publishing or activating. The Builder then verifies read-back read-only through the D1 connector and revalidates locally. The protected preview (`/admin/preview/home`) and its desktop/mobile captures would be Paulo's (`OWNER_REPORTED`), unless a browser session is attached to the Builder.
  2. **Attach an owner-authenticated browser** (for example a desktop Claude session linked to Paulo's computer). This requires Paulo to complete the OTP sign-in. A Builder session with that browser could then drive the admin UI as Paulo.
  3. **A dedicated automation identity** (Access service token plus a policy). This is an Access change and outside D-115; it would need its own decision and security review, because D-106 makes Paulo the only admin identity.
- **Admin UI form fields vs D-115 fields:**
  - `app/admin/ContentClient.js` exposes the V10 fields and saves drafts through the same `POST /admin/api/projects`.
  - It is not re-verified here whether the form lets the owner set every D-115 field exactly (`stack`, `accent`, `icon`, `id`, `slug`). If the owner executes, that check comes first.
- **Publication attempt key:** the D-115 issue was published with `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-115`, as for D-113 and D-114. The local ledger was not edited.
- **Carried forward:**
  - AS132-F002 remains mandatory before the first project bridge activation;
  - AS132-F003 remains open;
  - the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged;
  - V10.1 remediation (per Paulo's live-site review) was not started.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b` (policy `62653faa-4c3c-4b96-a53f-7545f79dbd43`); login endpoint `jolly-disk-0469.cloudflareaccess.com/cdn-cgi/access/login/maisoglabs.com`.
- Production D1 `45b87574-e573-4e0f-9bb6-fbba2df29523` (counts read at 2026-09-28T21:53Z).
- Active Worker `862dc45e-9ad7-4324-80ae-912adbb6ce82`.
- Approved content: `brain/DECISION_LOG.md` § D-115 (publication `cb304f3`).

## Governing references

- **T0:** Protocol V2; D-115; `ML-DEVOS-AS-141`.
- **T1:** `ML-DEVOS-RFC-022` §5.6, §10.1; D-111; D-106; D-110 (owner-executed precedent).
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-CONTENT-DRAFTS-0001.md`.

## Next action

The Architect reviews the authentication stop. Any owner-executed or alternative draft-creation path needs a Paulo decision.
