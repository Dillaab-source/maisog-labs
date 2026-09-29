# Current Handoff — RFC-022 recruiter-friendly project copy (D-124)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-CONTENT-COPY-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: 5943f779610a529ec71abc646b73d40ed3277426
review_target_commit: 5943f779610a529ec71abc646b73d40ed3277426
applicable_review_id: ML-DEVOS-AS-148
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence classes:
- **`OWNER_REPORTED`:** the execution of `d124-copy.js`, run once by Paulo in the owner-authenticated `https://maisoglabs.com/admin` session.
- **`ACTOR_REPORTED`:** the Builder's read-only production D1 `SELECT`s (every query `rows_written: 0`, `changed_db: false`), Cloudflare GETs, local validator runs and public HTTP GETs.

The Builder performed **no write**. It cannot authenticate through Cloudflare Access, and did not bypass it.

## Objective

Complete `DIR-WEB-RFC022-CONTENT-COPY-0001` (D-124): replace the public-facing copy of the five unpublished D-115 project drafts with the exact recruiter-friendly D-124 copy, through the authenticated admin lifecycle, and verify it read-only. Nothing is published or activated.

## Result

**The five drafts now store exactly the canonical D-124 content (SHA-256 `8c76c749409521f9311be8c78e9f49de3e4b43ea7ca05e5d3baf5590bcd1beab`).**
- Only `category`, `summary`, `v10.tagline` and `v10.flow` changed.
- Every validator passes, and `initialReleaseReadiness()` is `true`.
- None is published and no activation marker exists; public `/` is unchanged.

| Project | New draft revision id | Revision number | Previous draft revision | Order | Published |
|---|---|---|---|---|---|
| `project-clinicflow` | **7** | 3 | 2 | 1 | `null` |
| `project-eternal-eggs` | **8** | 2 | 3 | 2 | `null` |
| `project-sentinel-devos` | **9** | 2 | 4 | 3 | `null` |
| `project-su` | **10** | 2 | 5 | 4 | `null` |
| `project-maisog-kilat` | **11** | 2 | 6 | 5 | `null` |

All five revisions have `created_by` `cf-access:f2cab460-7d02-5201-abb1-272a3f3f7114` (Paulo's Access identity) and were created at 2026-09-29T22:13:09.810Z–22:13:13.898Z. Revisions 2–6 are kept unchanged as history.

## History of this cycle

1. **D-124** (published at `5943f77`): activation deferred; copy-only revision authorized. The Builder validated the copy with the production validators and checked the V10.1 desktop layout locally.
2. **Script:** the Builder generated `d124-copy.js` (SHA-256 `f58781ae693b883df7140a0966fa821f908b0b59ce38a7166ed642f61dbe50f5`) and dry-ran it against the real Worker admin code on a local D1 that reproduced production's history. The dry-run stored content hashed to `8c76c749…`, and a second run stopped at the pointer check.
3. **404 investigation** (read-only, at Paulo's STOP): the reported 404 was `GET /admin.` (trailing period). That path is outside the protected Worker-first paths, so the static asset 404 page answered. `/admin` and `/admin/preview/home` were not failing, and no change was needed.
4. **Script review:** Paulo asked for the complete script verbatim for Architect inspection; it was supplied unchanged.
5. **Execution:** Paulo ran the script once in the authenticated `/admin` session. The Builder then verified read-only (below).

## Tests and evidence

### Script execution (`OWNER_REPORTED`)

Paulo reports that the script completed. The production audit trail corroborates exactly five successful authenticated draft updates and nothing else:

| Audit id | Occurred at (UTC) | Action | Entity | Revision | Result |
|---|---|---|---|---|---|
| 11 | 22:13:09.992Z | `project_update_draft` | `project-clinicflow` | 7 | success |
| 12 | 22:13:11.022Z | `project_update_draft` | `project-eternal-eggs` | 8 | success |
| 13 | 22:13:12.047Z | `project_update_draft` | `project-sentinel-devos` | 9 | success |
| 14 | 22:13:13.067Z | `project_update_draft` | `project-su` | 10 | success |
| 15 | 22:13:14.080Z | `project_update_draft` | `project-maisog-kilat` | 11 | success |

Every row's actor is `cf-access:f2cab460-…`. There is no publish, activation or failure row.

### Production read-back (`ACTOR_REPORTED`, read-only, 22:20:09Z–22:21:44Z)

- **Pointers:** all five are `published_revision_id: null`, with drafts 7/8/9/10/11 as above. They remain drafts; the admin lifecycle reports `state: draft` when `draft_revision_id` is set and nothing is published.
- **Canonical match:**
  - The five draft revisions were mapped into the D-124 shape (`id`, `slug`, `order`, `category`, `title`, `summary`, `stack`, `accent`, `icon`, `featured`, and `v10` = `tagline`, `status`, `disciplines`, `flow`). The SHA-256 was computed inside the Cloudflare connector, so no value was transcribed.
  - Result: compact JSON SHA-256 **`8c76c749409521f9311be8c78e9f49de3e4b43ea7ca05e5d3baf5590bcd1beab`**. This is byte-identical to the canonical D-124 JSON in `brain/DECISION_LOG.md` § D-124, which was re-hashed from the committed log.
- **Only authorized fields changed:**
  - The previous drafts (revisions 2–6), mapped the same way, hash to `e45a56ca…`, the canonical D-115.
  - Field-by-field, each project changed exactly `category`, `summary`, `v10.tagline` and `v10.flow`.
  - Unchanged on all five: `id`, `slug`, `title`, `order`, `stack`, `accent`, `icon`, `featured` (true), `v10.status` (Sentinel / DevOS `Active`, others empty) and `v10.disciplines`, including their order.
- **Validators** (production modules, on the committed D-124 JSON, whose bytes are identical to the stored content): `validateProjectId`, `validateProjectSlug` and `validateProjectRevisionContent` pass 5/5; `validateProjectsGroup` passes; **`initialReleaseReadiness()` → `true`**.
- **Counts:**
  - `projects` 5; `project_revisions` 11 (max id 11); **published 0**; `project_media` 0;
  - **`homepage_initial_activation` markers 0**;
  - `site_settings` 0 and `site_settings_revisions` 0 (contact untouched);
  - `audit_log` 15 rows (max id 15).
- **Public `/`** (22:21Z): 200, 20,857 bytes, SHA-256 `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`. This is the raw V10.1 artifact with no `ml-published` span; drafts never reach `/`.
- **Production unchanged:**
  - active `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` @ 100% on deployment `b0f11606…`, with 10 deployments listed (no new one);
  - Access application `b80acca4…` `updated_at 2026-09-28T20:47:05Z`, single policy `62653faa…`;
  - D1 23 tables.

### Desktop layout of the new copy (local, pre-execution)

Headless Chromium rendered V10.1 locally with the exact D-124 copy spliced through the unchanged bridge:
- **1440×900:** all five projects fit, with no clipping, truncation or overflow; 0 console errors.
- **1280×720:** the Projects panel scrolls vertically. It already did with the D-115 copy (716–738 px of content in a 619 px panel); the D-124 copy is 738–796 px. Nothing is clipped, and there is no horizontal overflow.

The protected production preview `/admin/preview/home` is Paulo's step (Access); Paulo will inspect it before authorizing activation.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-CONTENT-COPY-0001.{md,provenance.json}` (byte-for-byte, unchanged since issue at `5943f77`) and the index row.
- **Unchanged:** `coordination/OPERATIVE_OBLIGATIONS.md`; all application code, `public/`, `app/`, `worker/`, configuration.
- **Outside this commit:** the five production draft revisions 7–11 and audit rows 11–15, written by Paulo's authenticated session.

## Unresolved findings and limitations

- **Presentation notes (informational, no change made):**
  - V10.1 renders discipline tags, not `stack`;
  - the category (`kind`) appears only in the Systems panel's "Used in projects" list;
  - the recruiter-visible copy on the Projects panel is the tagline, summary and flow.
- **Protected preview:** not viewed by the Builder (Access). `OWNER_REPORTED` if Paulo supplies it.
- **Script location:** `d124-copy.js` lives in the Builder session's scratchpad and in the attachment and chat copy given to Paulo; it is not committed. Its SHA-256 is recorded above and in the directive archive context.
- **Next steps not started:**
  - initial activation (`POST /admin/api/projects/initial-activation`, AS132-F002) needs separate Paulo authorization;
  - contact-email publication, mobile, `og:image` and the robots.txt content-signals follow-up remain separate.
- **Publication attempt keys:** D-124 was issued with `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-124`. The local ledger was not edited.
- **Carried forward:**
  - AS132-F002 applies at initial activation (readiness `true`); AS132-F003 remains open;
  - the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- Production D1 `45b87574-e573-4e0f-9bb6-fbba2df29523`: `projects`, `project_revisions` ids 2–11, `audit_log` ids 11–15.
- Canonical content: `brain/DECISION_LOG.md` § D-124 (`8c76c749…`) and § D-115 (`e45a56ca…`).
- Active Worker `8fd31f47-a65d-4f57-83f1-17a1e0cd8043` (deployment `b0f11606-80e3-4980-b617-e76bbacbf57c`); Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`.

## Governing references

- **T0:** Protocol V2; D-124; `ML-DEVOS-AS-148`.
- **T1:** D-115; D-117/D-118/D-119 (owner-executed authenticated console channel); `ML-DEVOS-RFC-022` §5.6, §10.1.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-CONTENT-COPY-0001.md`.

## Next action

The Architect reviews this return under a new immutable `ML-DEVOS-AS-NNN`. D-124 asked for routing to Paulo; the Protocol V2 checker requires a Builder return to route to the Architect, and Paulo chose that path. The Architect then routes the initial-activation decision to Paulo, who inspects `/admin/preview/home` first. Activation, publication and contact email each need separate authorization.
