# Current Handoff — RFC-022 initial project activation (D-125)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-INITIAL-ACTIVATION-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: 16670b78275134a48f5aeafef17fbf6f118023a5
review_target_commit: 16670b78275134a48f5aeafef17fbf6f118023a5
applicable_review_id: ML-DEVOS-AS-149
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence classes:
- **`OWNER_REPORTED`:** Paulo's review of `/admin/preview/home`; the execution of `d125-activate.js` in the owner-authenticated `/admin` session, and its console table.
- **`ACTOR_REPORTED`:**
  - the Builder's read-only production D1 `SELECT`s (every query `rows_written: 0`); Cloudflare GETs and GraphQL analytics;
  - public HTTP GETs; a headless-browser smoke test of the live site.

The Builder performed **no write**. It cannot authenticate through Cloudflare Access and did not bypass it.

## Objective

Execute `DIR-WEB-RFC022-INITIAL-ACTIVATION-0001` (D-125):
- the one atomic RFC-022 initial activation of exactly ClinicFlow 7, Eternal Eggs 8, Sentinel / DevOS 9, SU 10 and Maisog Kilat 11;
- live verification;
- then record and prepare the recruiter homepage copy follow-up for Architect review.

## Result

**Initial activation complete. The live homepage renders the five recruiter-ready projects through RFC-022. AS132-F002 is consumed. Everything else is unchanged.**

| Project | Published revision | Order | Draft |
|---|---|---|---|
| ClinicFlow | **7** | 1 | `null` |
| Eternal Eggs | **8** | 2 | `null` |
| Sentinel / DevOS | **9** | 3 | `null` |
| SU | **10** | 4 | `null` |
| Maisog Kilat | **11** | 5 | `null` |

The recruiter homepage copy follow-up is recorded below with exact files, strings and a release assessment. Its local screenshots and test/build were **not produced**: this session's permission classifier blocked local edits to product files (see Limitations).

## Tests and evidence

### Fresh preflight (read-only, 22:42:16Z, before the script was issued) — all PASS

- **Pointers:** drafts 7/8/9/10/11 current; `published_revision_id` null for all five.
- **Counts:** 0 published; 0 `homepage_initial_activation` markers; 11 revisions; 15 audit rows; `site_settings` 0.
- **Readiness:** the current drafts hash to `8c76c749…`, the canonical D-124 content that passes the production validators and `initialReleaseReadiness()` (`true`).
- **Public `/`:** 200, 20,857 bytes, `220ce809…`, no `ml-published` span (artifact fallback).

### Script and dry run

- **Script:** `d125-activate.js` (SHA-256 `ef11f9920bdbb3a1a0ae280d981c6326e1c7b92351859943d0674045c9e5ba17`). It pre-checks the content view (activation not done, pointers exactly `null`/7–11). It then sends exactly one `POST /admin/api/projects/initial-activation` with the five entries in rendered order and expected pointers, and stops on any response other than 200 with all five published at 7–11.
- **Dry run:** against the real Worker admin code and `handlePublicHome`, on a local D1 reproducing production's history (revisions 1–11):
  - 7–11 were published in one call, with 1 marker;
  - public `/` carried ClinicFlow | Eternal Eggs | Sentinel / DevOS | SU | Maisog Kilat, with no contact;
  - a second run stopped ("initial activation already done").

### Execution (`OWNER_REPORTED`)

Paulo ran the script once. The console table showed five rows: `state: "published"`, `publishedRevisionId` 7, 8, 9, 10, 11 and `draftRevisionId: null`, in the order ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU, Maisog Kilat.

### Production read-back (`ACTOR_REPORTED`, read-only, 23:15:05Z)

- **Pointers:** published 7/8/9/10/11; drafts null.
- **Published content:** ordered by `sort_order` it is 1 ClinicFlow (rev 7), 2 Eternal Eggs (8), 3 Sentinel / DevOS (9), 4 SU (10), 5 Maisog Kilat (11). Mapped to the D-124 shape (hash computed in the connector), it is **`8c76c749…`**, the exact accepted copy.
- **Counts:**
  - published **5**; `homepage_initial_activation` markers (success) **exactly 1** (1 row of any result);
  - `project_revisions` 11 (no new revision); `project_media` 0;
  - `site_settings` 0, `site_settings_revisions` 0 (no contact change);
  - `audit_log` 21.
- **Audit:** rows 16–21 are exactly the one atomic batch, all at `2026-09-29T23:12:41.521Z`, actor `cf-access:f2cab460-…` (Paulo):
  - 16–20: `project_publish` of ClinicFlow 7, Eternal Eggs 8, Sentinel / DevOS 9, SU 10, Maisog Kilat 11, all `success`;
  - 21: `homepage_initial_activation` / `homepage` / `home`, `success`.

  There is no failure row and no other action.

### Live homepage (`ACTOR_REPORTED`, 23:15Z)

- **`GET /`:** 200, 26,020 bytes, `content-type: text/html`, `cache-control: no-store` (the transformed response).
  - The RFC-022 span starts at byte **20,116** (5,163 bytes).
  - With the span removed, the bytes are exactly the accepted V10.1 artifact: 20,857 bytes, SHA-256 `220ce809…`.
  - The island is `schemaVersion: 1` with keys `schemaVersion, projects` only (**no `contact`**). It holds ClinicFlow (AI Workflow Automation), Eternal Eggs (AI Ordering Automation), Sentinel / DevOS (AI Development Governance, `Active`), SU (AI Research & Verification) and Maisog Kilat (Algorithmic Trading Research), with the D-124 taglines.
- **Headless browser smoke** at 1440×900 and 1280×720, against the live site through a local relay that fetches with `curl` (TLS verified) because Playwright's Chromium does not trust the egress proxy CA:
  - `MLData.PROJ`, the Projects list and 5× pager are ClinicFlow → Eternal Eggs → Sentinel / DevOS → SU → Maisog Kilat. Each pane shows the D-124 tagline and summary.
  - **Eternal Eggs replaces Maisog Guild**: "Guild" appears nowhere, including the Systems panel.
  - Systems, Projects, Research (filters Research / Build / Thoughts / All → 1 / 1 / 1 / 3, `aria-pressed`), Contact and Escape-to-entry all work.
  - 0 `href="#"`; focus visible; no horizontal overflow; 0 console errors or warnings; production React; no Babel.
  - The only failed request is `/assets/video/logo-mark.mp4`: Playwright-Chromium lacks the H.264 codec, as before.
  - Contact shows the artifact's own address, so no email publication.
- **Other paths:** `/api/journal` 200 JSON; `/api/design` 200 JSON; `/journal` 200; `/admin` and `/admin/api/content` 302 to Access; `/robots.txt`, `/sitemap.xml` and `/v101/assets/*` 200.
- **Worker health:** since 23:12Z, 9 invocations on `8fd31f47…`, all `success`, **0 errors** (CPU p50 5.1 ms, p99 13.3 ms; the bridged path now includes the artifact digest and splice).

### Production unchanged

- Active `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` @ 100% on deployment `b0f11606…` (10 deployments, no new one).
- Access application `b80acca4…` `updated_at 2026-09-28T20:47:05Z`.
- No deployment, code, design, R2, Access, DNS, binding, robots.txt, mobile or `og:image` change; no contact email.

## Recruiter homepage follow-up (D-125) — recorded and prepared as a proposal only

**Objective:** make the V10.1 landing page immediately understandable to a recruiter. Only two visible text regions change; the visual system, logo, animation, composition, navigation, typography, layout and "IDEAS IN ORBIT" stay.

### Where the text lives

Both regions are compiled into the V10.1 entry panel, `public/v101/assets/entry.7995859f655d.js`, from the V10 `Entry` component:
- **Lower-left intro:** a single `<p>` with `maxWidth: 400`, `paddingLeft: 20`, a left rule, `fontSize: clamp(16px,1.25vw,18px)`, `lineHeight: 1.55`, color `#E4EAFB`.
- **Lower-right:** an `aria-hidden` column of three `<span>`s, uppercased by CSS, with the existing letter-spacing and left rule.

They are code/artifact-owned. The RFC-022 bridge carries only projects and contact email, so no admin or bridge path can change them.

### Exact before → after

| Region | Before | After |
|---|---|---|
| Lower-left intro | `The independent technology laboratory of Paulo Maisog, building AI automation, research systems, and experimental software.` | first line **`Paulo Maisog — AI Automation & Technical Systems Builder`**, then **`Building practical AI workflows, cloud automation, and technical systems for real-world business processes.`** |
| Lower-right (3 spans) | `Humanity` / `Orbits` / `Higher` (rendered `HUMANITY / ORBITS / HIGHER`) | `AI` / `Automation` / `Systems` (rendered `AI / AUTOMATION / SYSTEMS`) |

**Proposed minimal markup for the intro.** The same `<p>`, with its style unchanged, whose children become:
- a block `<span>` for the name line, with `display: block`, `marginBottom: 6`, `color: #F8FAFF`, `fontWeight: 500`;
- then the sentence, as plain text.

That is the only new styling, to separate the two lines inside the existing rule. It is proposed for Architect/owner judgement.

The Contact panel's closing heading "Humanity / orbits higher." is a different element and is **not** in scope.

### Exact files that would change (smallest implementation)

1. **`public/v101/assets/entry.7995859f655d.js` → a new `entry.<sha12>.js`.** The same minified file with only the two string edits. The fingerprint must change: `/v101/assets/*` is served `immutable` for one year, so keeping the old name would leave returning visitors on cached old text.
2. **`public/index.html`:** one `<script src>` reference, to the new entry fingerprint. Same length, so `ARTIFACT_LENGTH` 20,857 and `INSERTION_OFFSET` 20,116 are unchanged. **The SHA-256 changes.**
3. **`worker/bridge/inject.mjs`:** `ARTIFACT_SHA256` to the new artifact hash. The AS-145 atomic-promotion invariant applies: without it the bridge fails closed and `/` loses the published projects.
4. **Tests:** `tests/homepage-artifact.test.mjs` (pinned hash) and `tests/v101-candidate.test.mjs` (the promoted-equals-candidate check). Either accept a new candidate record, or compare with the entry file excepted.
5. **Optional, for reproducibility:** `scripts/build-v101-candidate.mjs` `patchEntry`, recording the same two source-level edits. It currently fails safely against `public/` (AS-146 finding 1).

### Does it truly need a new Worker version/release? — **Yes.**

- The text is inside a static asset that the Worker's `ASSETS` binding serves. A new asset file and a new `index.html` can only reach production through a new Worker version upload.
- The bridge hash constant also has to change in the same version. Production code cannot change without that.
- So the path is: an atomic change (artifact + asset + constant + tests) → Gate C (`main` merge, Workers Build uploads an inactive version) → Gate D (deploy).
- The published projects in D1 are unaffected: the same bridge re-renders them into the new artifact.
- There is no content-only path: the admin/bridge schema has no homepage-intro field, and adding one is the architecture expansion D-125 rules out.

### Not produced (blocked)

- 1440×900 / 1280×720 screenshots of the proposed copy;
- the no-clipping/awkward-wrapping confirmation;
- the test/build result.

A local, uncommitted edit of the entry asset in this session was refused by the session's permission classifier ("Modify Shared Resources"), both through a scratch `git worktree` and directly in the working tree. The Builder did not work around it. These three items need Paulo to allow that local edit (or an explicit bounded authorization); then they can be produced without committing or deploying anything.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-INITIAL-ACTIVATION-0001.{md,provenance.json}` (byte-for-byte, unchanged since issue at `16670b7`) and the index row.
- **Unchanged:** `coordination/OPERATIVE_OBLIGATIONS.md`; all application code, `public/`, `worker/`, tests and configuration.
- **Outside this commit:** the production activation (published pointers 7–11, audit rows 16–21), performed by Paulo's authenticated session.

## Unresolved findings and limitations

- **Homepage follow-up evidence blocked** (above). Only the written proposal is returned.
- **Live-evidence method:** the browser smoke used the verified-TLS curl relay; there was no real-device, Firefox or WebKit check.
- **Bridged CPU:** p50 5.1 ms / p99 13.3 ms over 9 sampled invocations (includes the artifact digest). A small sample, adaptively sampled; recorded as evidence, not a threshold.
- **Remaining separate decisions:** contact-email publication; the homepage copy follow-up release (Gate C/D); mobile; `og:image`; the robots.txt content-signals follow-up; the AS-146 build-script and `payload.mjs` comment debt.
- **Publication attempt keys:** D-125 was issued with `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-125`. The local ledger was not edited.
- **Carried forward:**
  - AS132-F002 is **consumed** by this activation (exactly the D-105 set, atomically, once);
  - AS132-F003 remains open;
  - the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- **Production D1** `45b87574-e573-4e0f-9bb6-fbba2df29523`: `projects`; `project_revisions` 7–11; `audit_log` 16–21.
- **Live:** `https://maisoglabs.com/` (bridged); active Worker `8fd31f47-a65d-4f57-83f1-17a1e0cd8043`, deployment `b0f11606-80e3-4980-b617-e76bbacbf57c`.
- **Canonical content:** `brain/DECISION_LOG.md` § D-124 (`8c76c749…`); decision § D-125.
- **Scripts:** `d125-activate.js` (`ef11f992…`), in the Builder session scratchpad and delivered to Paulo; not committed.

## Governing references

- **T0:** Protocol V2; D-125; `ML-DEVOS-AS-149`.
- **T1:** D-111 (`POST /admin/api/projects/initial-activation`); AS132-F002; D-124; AS-145 (atomic promotion invariant, for the follow-up); `ML-DEVOS-RFC-022` §5.4, §10.1.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-INITIAL-ACTIVATION-0001.md`.

## Next action

The Architect reviews the activation return and the homepage copy follow-up proposal under a new immutable `ML-DEVOS-AS-NNN`. The follow-up's screenshots and test/build need Paulo to allow the local product-file edit; its release needs separate authorization (atomic change, Gate C, Gate D).
