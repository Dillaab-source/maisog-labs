# Current Handoff — RFC-022 initial content drafts (D-116 / D-117 / D-118 / D-119)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-CONTENT-DRAFTS-0002
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: 8e18b355ba90b5a35b40630193b1599335c49d30
review_target_commit: 8e18b355ba90b5a35b40630193b1599335c49d30
applicable_review_id: ML-DEVOS-AS-142
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve.

Evidence classes:
- **`OWNER_REPORTED`:** the D-118 script execution and its console output (run in Paulo's owner-authenticated admin session, under D-119's channel).
- **`ACTOR_REPORTED`:** the Builder's read-only production D1 `SELECT`s, local validation, and public HTTP GETs.

The Builder performed **no write**.

## Objective

Complete `DIR-WEB-RFC022-CONTENT-DRAFTS-0002`, as amended by D-117, D-118 and D-119:
- the five D-115-approved production project drafts exist exactly as approved, created through the authenticated admin lifecycle;
- nothing is published or activated;
- read-only verification.

## Result

**All five drafts are stored exactly as canonical D-115: 0 field differences. They validate, and `initialReleaseReadiness()` is `true`. None is published. No activation marker exists. Public `/` is unchanged.**

| Project | Draft revision id | Revision number | Order | Published |
|---|---|---|---|---|
| `project-clinicflow` | 2 | 2 (revision 1 kept as history) | 1 | `null` |
| `project-eternal-eggs` | 3 | 1 | 2 | `null` |
| `project-sentinel-devos` | 4 | 1 | 3 | `null` |
| `project-su` | 5 | 1 | 4 | `null` |
| `project-maisog-kilat` | 6 | 1 | 5 | `null` |

All five revisions have `created_by` `cf-access:f2cab460-7d02-5201-abb1-272a3f3f7114` (Paulo's Access identity), created 2026-09-29T14:10:56.977Z–14:10:58.712Z.

## History of this cycle

1. **D-115:** content approved; the Builder's authentication stop (`H-WEB-RFC022-CONTENT-DRAFTS-0001`, accepted by AS-142).
2. **D-116:** owner-authenticated browser path; no Builder browser was available.
3. **D-117:** owner-executed console POST of the exact D-115 JSON. The Builder had found that the admin UI cannot carry `stack`/`accent`/`icon` and sorts disciplines.
4. **Diagnostic:** Paulo first created only ClinicFlow, through the UI (revision 1, 2026-09-28T22:21:02Z). A read-only check found 7 of 14 fields differed from D-115.
5. **D-118:** replacement script (SHA-256 `35b059d6a1cc82dee756b50ed52405f101c0a9d6b37f65aca55d62ebb7bb8f16`): PUT ClinicFlow (expected pointers `null`/`1`), then POST the other four. Dry-run locally before issue.
6. **D-119** (published by Paulo's ChatGPT Work session at `8e18b35`): a Work/browser operator may execute that exact script in Paulo's owner-authenticated session. Nothing else changed.

## Tests and evidence

### Script execution (`OWNER_REPORTED`)

| Step | Status | State | draftRevisionId | publishedRevisionId |
|---|---|---|---|---|
| PUT project-clinicflow | 200 | draft | 2 | null |
| POST project-eternal-eggs | 201 | draft | 3 | null |
| POST project-sentinel-devos | 201 | draft | 4 | null |
| POST project-su | 201 | draft | 5 | null |
| POST project-maisog-kilat | 201 | draft | 6 | null |

Closing message: `D-118: ClinicFlow corrected and four drafts created. Nothing published.`

### Production read-back (`ACTOR_REPORTED`, read-only, 2026-09-29T14:37:59Z–14:38:15Z)

- **Field-by-field comparison:**
  - The five stored draft revisions were read through the Cloudflare D1 query API (`rows_written: 0`, `changed_db: false`).
  - Each was mapped into the D-115 shape: `id`, `slug`, `order`=`sort_order`, `category`, `title`, `summary`, `stack`, `accent`, `icon`, `featured`, and `v10` = `tagline`, `status`, `disciplines`, `flow`.
  - The compact JSON of that mapping has SHA-256 **`e45a56ca8a5d96fc8a0484da857dbd8d3b783a936181d875b05bb756bab6e90c`**, byte-identical to the canonical D-115 compact JSON recorded in D-117 and D-118.
  - **0 field differences across all five projects.** This includes every order-sensitive value: disciplines `[0,1,4,3]`, `[0,1,4]`, `[0,2,1,5,3]`, `[2,0,5]`, `[2,0,4,5]`; flow order; stack order.
- **Validators** (production modules, on those identical bytes):
  - `validateProjectId`, `validateProjectSlug` and `validateProjectRevisionContent` pass 5/5;
  - `validateProjectsGroup` passes;
  - **`initialReleaseReadiness()` → `true`**.
- **Counts:**
  - `projects` 5; **published 0** (`published_revision_id` null for all five);
  - `project_revisions` 6; `project_media` 0;
  - **`homepage_initial_activation` markers 0**;
  - `site_settings` 0 and `site_settings_revisions` 0 (contact untouched);
  - `audit_log` 10 rows, max id 10.
- **Audit trail:**
  - rows 1–4: failure-only rows from Paulo's earlier UI attempts (2026-09-28), with no state change. Row 1 is `section_design_edit_draft` on section `projects`.
  - row 5: `project_create_draft` ClinicFlow revision 1 (UI).
  - rows 6–10: exactly the D-118 script: `project_update_draft` ClinicFlow revision id 2, then `project_create_draft` for the four (revision ids 3–6), all `success`.
- **Public `/`** (2026-09-29T14:38:27Z): 200, SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`, the unchanged D-093 artifact. Drafts never reach `/`.
- **`/admin/preview/home` unauthenticated:** 302 to Cloudflare Access (protected).

### Not performed by the Builder

- No project draft, edit or publish; no initial activation or marker.
- No contact/`site_settings` change; no deploy.
- No Access, DNS, R2, binding, secret, environment or schema change.
- No direct D1 write; no `main` merge.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-CONTENT-DRAFTS-0002.{md,provenance.json}` (byte-for-byte; unchanged since issue at `c69be77`) and the index row.
- **Unchanged:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Unresolved findings and limitations

- **Desktop protected preview:** not captured by the Builder. It needs Paulo's authenticated browser, so it is `OWNER_REPORTED` if Paulo supplies it. Mobile is deferred by Paulo.
- **Preview content:** all five drafts are featured and homepage-eligible, so `/admin/preview/home` (draft mode) should render them in the D-105 order. The initial activation panel should show all five as "draft saved".
- **Next steps not started:**
  - initial activation (`POST /admin/api/projects/initial-activation`) and any publication need separate Paulo authorization;
  - Paulo's live-site review recommends a bounded V10.1 remediation before public activation.
- **Tooling note:** during verification the dedicated D1 query tool returned internal errors on row reads. The read-back used the Cloudflare D1 query API through the general Cloudflare connector, which is equally read-only (`rows_written: 0`).
- **Publication attempt keys:** D-115 through D-118 were issued with explicit `--transition-id …:D-11x`. The local ledger was never edited.
- **Carried forward:**
  - AS132-F002 applies at initial activation (readiness now `true`);
  - AS132-F003 remains open;
  - the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- Production D1 `45b87574-e573-4e0f-9bb6-fbba2df29523`: `projects`, `project_revisions` ids 1–6, `audit_log` ids 1–10.
- Canonical content: `brain/DECISION_LOG.md` § D-115. Scripts: D-117 (`dbe453f6…`, not used) and D-118 (`35b059d6…`, executed).
- Active Worker `862dc45e-9ad7-4324-80ae-912adbb6ce82`; Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`.

## Governing references

- **T0:** Protocol V2; D-116 as amended by D-117, D-118 and D-119; D-115 (content); `ML-DEVOS-AS-142`.
- **T1:** `ML-DEVOS-RFC-022` §5.6, §10.1; D-111; D-106.
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-CONTENT-DRAFTS-0002.md`.

## Next action

The Architect reviews the content-drafts return. Initial activation, publication, contact email and V10.1 each need separate Paulo authorization.
