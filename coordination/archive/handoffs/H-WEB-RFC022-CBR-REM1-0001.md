# Current Handoff — RFC-022 CB-R AS-137 remediation (D-111)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-CBR-REM1-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: fde97b6d4be4cc427cde682bd27182f8e328e93d
review_target_commit: fde97b6d4be4cc427cde682bd27182f8e328e93d
applicable_review_id: ML-DEVOS-AS-137
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence classes:
- **`ACTOR_REPORTED`, local:** every test, build and bundle result below.
- **`ACTOR_REPORTED`, read-only Cloudflare API:** the source of the Access values (GET only).

Nothing here is production evidence. No remote resource was mutated.

## Objective

Execute `DIR-WEB-RFC022-CBR-REM1-0001` (D-111): remediate AS137-F001 and AS137-F002, add the `site_settings` first-draft bootstrap, and narrowly update the release semantics. Repository/local only.

## Result

**All five D-111 items implemented. Full suite 950/950, build and Worker bundle green.**

The review diff is `fde97b6..` this return commit.

## Design

### 1. Initial project activation (AS137-F001)

- **New route:** `POST /admin/api/projects/initial-activation`, reached only after Access verification, like every `/admin` route.
  - Body: `{ projects: [{ id, expectedPublishedRevisionId, expectedDraftRevisionId }] }`, exactly five entries, no other keys, unique ids.
  - A single path segment, so it cannot collide with `/admin/api/projects/:id/:action`.
- **Pre-read checks (each failure publishes nothing and writes a failure audit):**
  - activation not already done (409 `INITIAL_ACTIVATION_ALREADY_DONE`);
  - no project currently published homepage-eligible (409 `HOMEPAGE_NOT_EMPTY`);
  - each entry's pointers match (409) and a draft exists (409 `DRAFT_REQUIRED`);
  - each draft is revalidated from storage and must be homepage-eligible (409 `NOT_HOMEPAGE_ELIGIBLE`);
  - the five, mapped to bridge projects, pass `initialReleaseReadiness`: exactly ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat, complete and valid, in that order. Their `sort_order`/id ordering must also render in that order (400 `INITIAL_SET_MISMATCH`).
- **One `db.batch()`:**
  - five guarded pointer UPDATEs, then five `project_publish` success audit rows, then one `homepage_initial_activation` success row (`entity_type` `homepage`, `entity_id` `home`);
  - each UPDATE's poisoned-slug guard (the existing AS21-F007 technique) also requires, at commit time, that activation is not done and that exactly `index` other projects are published homepage-eligible;
  - any failed guard rolls back everything: no publication, no audit success row, no marker.
- **Durable marker without a new table or migration:** the `homepage_initial_activation` success row. `audit_log` is append-only at the database layer (migration `0002` triggers abort UPDATE and DELETE), so the marker cannot be removed and the restriction switches off exactly once. Failure rows never count.
- **Individual publish:** a homepage-eligible publish now requires the marker. It is checked on the pre-read (409 `INITIAL_ACTIVATION_REQUIRED`) and again inside the guarded UPDATE. Non-homepage (legacy) publishes and unpublish are unchanged.
- **No permanent runtime gate:** `worker/public/home.mjs` and `worker/bridge/snapshot.mjs` are unchanged. Public `/` still renders any valid published group of 1..5 (AS133-F001), including after unpublishes and later individual publishes.
- **Status:** `GET /admin/api/content` adds `homepage.initialActivation.done`.

### 2. `site_settings` bootstrap

- **Trigger:** `PUT /admin/api/content/contact/draft` on a database with no `site_settings` row, sent with both expected pointers `null`. Non-null pointers → 409.
- **One batch:**
  - INSERT the `default` parent;
  - INSERT revision 1 from `canonicalSiteSettingsRevisionColumns(data/site.js)` (the exact columns the WEB-INC-005 migration writes, now exported from `worker/d1/migrate.mjs`), with only `contact_email` replaced and `created_by` = `cf-access:<sub>`;
  - set only `draft_revision_id` (guarded on both pointers null, poison `-1`);
  - write `site_settings_bootstrap` and `site_settings_contact_update_draft` success audit rows.
- **Never publishes:** `published_revision_id` stays null. The existing attested contact publish (`confirmDeliverability: true`) is still required. The bridge's existing admin-actor email rule is unchanged.
- **Concurrency:** a competing bootstrap fails on the primary key and rolls back the whole batch (409). A later bootstrap still addressed as uninitialized is stale (409).

### 3. Access configuration (AS137-F002)

- **Source:** read-only `GET /accounts/{id}/access/apps` and `/access/organizations`. Exactly one application covers `maisoglabs.com/admin`: `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`, named "maisoglabs.com", self-hosted domains `maisoglabs.com/admin` and `maisoglabs.com/admin/*`. The other two applications are the separate hosts `admin.maisoglabs.com` and `staging-admin.maisoglabs.com`.
- **Values in `wrangler.jsonc`:**
  - `ACCESS_TEAM_DOMAIN` = `jolly-disk-0469.cloudflareaccess.com` (the organization `auth_domain`, bare-host convention of `worker/auth.mjs`);
  - `ACCESS_AUD` = `ef44d36e676be36eedb87d5378b8f3fd1ed40cc34505b7261a990c166a0cea22`.
- **Current production state (read-only):** active version `53137101…` and the inactive `main` version `6ca2ddfe…` both still carry the placeholders. Production `/admin` is fail-closed (401) today. No dashboard override existed to preserve.
- **Unchanged:** the placeholder constants and all fail-closed checks in `worker/auth.mjs`. No Access application, policy, identity, DNS or account change.

### 4. Release semantics

`ML-DEVOS-RFC-022`:
- **§5.6:** documents initial activation and the bootstrap.
- **§9:** the Access risk line.
- **§10 CB-R row and new §10.1:** Gate D may activate the code while no bridge payload exists (public `/` stays the approved artifact). AS132-F002 governs the first project bridge activation, which is the exact-five initial activation; it is not weakened.
- **§11:** a D-111 amendment entry.

`worker/bridge/payload.mjs`'s AS132-F002 comment is updated to match.

### 5. Admin UI (`app/admin/ContentClient.js`)

- **Projects tab:** an "Initial homepage activation" panel, shown until `initialActivation.done`. It lists the five required names with draft status, and one button sends the five entries with their current pointers.
- **Failure messages:** for each new reason code.
- **Contact tab:** no longer refuses when uninitialized; it explains that the first draft sets site settings up.

## Tests and evidence

- **`npm test`:** 950/950 pass (0 fail, 0 skipped). The 942 baseline in this session already included the 4 new Access tests; this cycle adds 8 new D-111 tests, and 4 existing RFC-022 tests were adapted.
- **`npm run build`:** exit 0.
- **`npx wrangler deploy --dry-run --outdir <scratch>`:** bundles (228 KiB), bindings list the real Access values. Local only, no upload.
- **`git diff --check`:** clean.

D-111 requirement → test (`tests/worker-rfc022-content.test.mjs` unless noted):

| Requirement | Test |
|---|---|
| zero published → artifact fallback | "zero published projects is the artifact fallback, before and after activation" (+ existing test 2) |
| one / four individual publishes cannot create first activation | "one or four individual homepage publishes cannot create a first activation"; "the individual publish guard also holds at commit time before activation" |
| exact five activate atomically | "the exact D-105 five activate atomically, once, with audit evidence" (order on `/`, 5 publish rows + marker, audit revision ids, repeat → 409, marker DELETE rejected) |
| failed activation leaves zero published | "failed initial activations publish nothing" (wrong order, duplicate, stale pointer, extra key, wrong name, incomplete project, and a commit-time race on project 5 rolling back projects 1–4); "initial activation refuses a non-empty homepage and non-POST methods" |
| normal 1..5 after activation | "AS133-F001 item 3: after initial activation, any valid published group of 1..5 renders…" (5→1 by unpublish, then a new individual publish); item 4; test 8 (sixth rejected) |
| bootstrap atomic, no publish | "the first contact draft initializes site_settings atomically and does not publish" |
| stale / conflicting bootstrap | "stale or conflicting site_settings bootstrap attempts fail safely" (non-null pointers, invalid email, a commit-time race leaving no revision and no success audit, second bootstrap → 409) |
| Access placeholders gone, fail-closed kept | `tests/cloudflare-bindings-config.test.mjs`: exact values; no `REPLACE_WITH_`; with the real values, missing/garbage/wrong-audience/wrong-issuer/untrusted-key → 401 + no-store, zero asset calls; valid assertion → 200 |

- **Adapted tests:** four existing RFC-022 tests that published homepage projects one by one now use initial activation. Their assertions are kept or strengthened: the first adds a refused lone publish; item 3 now covers every group size 5..1 after activation.
- **Mutation check (local, reverted):** removing the activation batch's pointer guard fails the race test. Removing the marker condition from the individual publish guard fails the commit-time test.

## Changed files

- **Code:**
  - `worker/d1/projects.mjs`: activation marker and batch; the publish guard;
  - `worker/admin/projects.mjs`: route; publish gate;
  - `worker/d1/site.mjs`: bootstrap batch;
  - `worker/admin/content.mjs`: bootstrap path; status;
  - `worker/d1/migrate.mjs`: exported canonical columns, behavior unchanged;
  - `worker/bridge/payload.mjs`: comment only;
  - `app/admin/ContentClient.js`;
  - `wrangler.jsonc`: Access vars and comment.
- **Tests:** `tests/worker-rfc022-content.test.mjs`; `tests/cloudflare-bindings-config.test.mjs`.
- **Docs:** `devos/changes/rfcs/ML-DEVOS-RFC-022.md`.
- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-CBR-REM1-0001.{md,provenance.json}` (byte-for-byte, blob `7a6d454…`) and the index row.
- **Not changed:**
  - `migrations/**`; `worker/public/**`; `worker/bridge/snapshot.mjs`; `worker/bridge/inject.mjs`; `worker/auth.mjs`; `public/index.html`;
  - `coordination/OPERATIVE_OBLIGATIONS.md`.

## Unresolved findings and limitations

- **Nothing deployed.**
  - The Access values and both capabilities reach production only through a separately authorized Gate C (`main` merge) and Gate D. Production `/admin` stays fail-closed until then.
  - The governance push triggers the usual inactive non-production preview upload.
- **Access value provenance:** the Access values were read at a point in time. If the Access application's audience is rotated or the application is replaced before Gate D, `/admin` fails closed (safe) and the values need re-reading.
- **Marker semantics:**
  - Activation is one-way by design. Unpublishing all projects afterwards returns `/` to the artifact but does not re-arm the five-project requirement (AS133-F001).
  - A database seeded by hand with a published homepage-eligible row blocks activation (409 `HOMEPAGE_NOT_EMPTY`) until that row is unpublished.
- **Bootstrap base content:** the first `site_settings` revision copies the canonical `data/site.js` fields. The V10 artifact does not read them (only the email reaches the bridge), so they are inert placeholders for Tier 2.
- **Doc drift:** `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md` and older release reports still describe the Access vars as placeholders. They are historical planning records, left unchanged to keep this cycle narrow.
- **UI evidence:** the UI changes are build-verified only. There is no browser/Playwright run this cycle.
- **Carried forward:**
  - AS132-F003 remains open;
  - traceability: the pre-existing 3 ERRORs and DRIFT are unchanged;
  - the pre-publication D-111 orphan WARNING is resolved by this directive archive.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- Tests: `tests/worker-rfc022-content.test.mjs` (the D-111 section at the end), `tests/cloudflare-bindings-config.test.mjs`.
- Access application (read-only): account `fb7234ae9117baf1481ab3b169a9824a`, app `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`.

## Governing references

- **T0:** Protocol V2; D-111; `ML-DEVOS-AS-137`.
- **T1:** `ML-DEVOS-RFC-022`; D-105; D-106; D-107 / `ML-DEVOS-AS-133`; `ML-DEVOS-AS-132`.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-CBR-REM1-0001.md`.

## Next action

The Architect reviews the D-111 remediation. The following each need separate Paulo authorization:
- Gate C (`main` merge) and Gate D (promotion);
- production content, initial activation and email publication.
