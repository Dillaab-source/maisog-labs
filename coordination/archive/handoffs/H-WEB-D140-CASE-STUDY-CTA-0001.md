# Builder Handoff — Reusable project case-study CTA

```yaml
schema_version: 1
handoff_id: H-WEB-D140-CASE-STUDY-CTA-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
input_base_commit: edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca
review_target_commit: edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca
applicable_review_id: ML-DEVOS-AS-166
```

This handoff is evidence, not authority. Routing and action flags remain in `coordination/STATE.md`.

## Objective

Return the D-140 implementation of the reusable homepage project case-study CTA for independent Architect review. The feature is implemented and tested locally. Production, main, PR, deployment, Cloudflare resources, and remote D1 were not changed.

## Changed files

Implementation commit `edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca` changed:
- `app/admin/ContentClient.js`
- `candidates/v10.1/README.md`
- `candidates/v10.1/build-report.json`
- `candidates/v10.1/evidence/harness/serve.mjs`
- `candidates/v10.1/site/index.html`
- `candidates/v10.1/site/v101/assets/projects.05aad04529b5.js` (added)
- `candidates/v10.1/site/v101/assets/projects.f30288d8da5f.js` (removed)
- `migrations/0007_project_revisions_case_study_enabled.sql`
- `public/index.html`
- `public/v101/assets/projects.05aad04529b5.js` (added)
- `public/v101/assets/projects.f30288d8da5f.js` (removed)
- `scripts/build-v101-candidate.mjs`
- `tests/homepage-artifact.test.mjs`
- `tests/project-case-study.test.mjs`
- `tests/rfc022-bridge.test.mjs`
- `tests/v101-candidate.test.mjs`
- `tests/worker-admin-projects.test.mjs`
- `tests/worker-rfc022-content.test.mjs`
- `worker/admin/projects.mjs`
- `worker/bridge/inject.mjs`
- `worker/bridge/payload.mjs`
- `worker/bridge/snapshot.mjs`
- `worker/d1/projects.mjs`
- `worker/d1/schema.mjs`
- `worker/d1/validate.mjs`
- `worker/projects/case-studies.mjs`

The exact-tip handoff publication additionally changes `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`, and the outgoing directive archive entry plus its provenance and index. No other implementation category was changed.

## Tests and evidence

- Starting governance tip: `f2a77184a0c83e7861aff1514c158f5f82fd0667`. D-140 is `brain/DECISION_LOG.md` decision D-140; the selected directive is `DIR-WEB-PROJECT-CASE-STUDY-CTA-0001`.
- Implementation commit: `edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca`, one parent `f2a77184a0c83e7861aff1514c158f5f82fd0667`. The repository Protocol V2 checker passed both `--check-only` and exact-tip CAS publication; the ref read back as this commit.
- Registry: dependency-free `worker/projects/case-studies.mjs`; `clinicflow` is the sole registered slug. `caseStudyHref` returns only `/projects/clinicflow` for that slug. A structural test resolves every registered slug to `app/projects/<slug>/page.js`.
- Migration: `0007_project_revisions_case_study_enabled.sql` adds `project_revisions.case_study_enabled INTEGER NOT NULL DEFAULT 0 CHECK (case_study_enabled IN (0,1))`. It is local/test-only. Old-shaped inserts receive `0`; V10 legacy data normalizes to `false`. Release prerequisite: apply migration 0007 remotely before deploying a Worker that reads/writes this column. The prior Worker can omit it on inserts and its explicit selected columns ignore the additive field.
- Admin: protected Projects editor has a checkbox only for registered slugs and a read-only derived destination. It has no URL input. Save remains draft-only; preview reads draft pointers and public payload reads published pointers.
- Server validation: deterministic API integration rejects `caseStudyEnabled: true` for an unregistered slug on both create and draft-edit endpoints, with no additional revision committed. The registered ClinicFlow toggle stores `0/1`, reads as a boolean, and text-only edits inherit it.
- Lifecycle: local D1 integration verifies a disabled public revision with an enabled draft, publish of the enabled draft, a disabled draft while the published CTA remains enabled, and publish of the disablement. Public and preview snapshots follow their existing revision pointers.
- Bridge: RFC-022 schema version remains 1. `slug` and `caseStudyEnabled` are additive project fields; new payload validation enforces slug shape, boolean type, registry membership when enabled, and whole-project-group fallback. No arbitrary URL field is admitted.
- V10.1 artifact: deterministic builder patched the ProjectsPanel with a semantic real anchor and exact `VIEW CASE STUDY →` label. Candidate and `public/` artifacts match. Only the Projects source asset fingerprint changed: `projects.f30288d8da5f.js` → `projects.05aad04529b5.js`; new asset SHA-256 is `05aad04529b588b47e0f7d09246f91ae6bc87678d73e1aec72beaa4116b419c4` (4,830 bytes). Old asset size was 4,458 bytes.
- Homepage identity: old SHA-256 `f60179dd6f9e71c9f94d72eb66ac4686bb119a9a5dc781d315803f59df4d2fe3`, new SHA-256 `98c60c4c6574471fad5ec199fc30f51d60f869af79e365cf500230a837ab3820`; both are 20,857 bytes and the unique outer `</head>` insertion offset remains 20,116. Bridge artifact constants and tests were updated atomically.
- Feature-focused tests: 114 tests passed, 0 failed across `project-case-study`, homepage artifact, V10.1 candidate, RFC-022 bridge, Worker admin projects, and Worker RFC-022 content suites. The Worker admin suite alone also passed 64/64 after the lifecycle/API assertions were strengthened.
- `npm run build`: passed; static output includes `/admin`, `/journal`, and `/projects/clinicflow`.
- Full `npm test`: 989 total, 696 passed, 277 failed. Failures were confined to unchanged DevOS execution fixtures/tests, skill frontmatter tests, and Wrangler/media tests on this Windows sandbox. Recorded causes include the execution fixture's POSIX colon-delimited `PATH` causing `spawnSync git ENOENT`, sandbox-temp rename `EPERM`, and LF-only frontmatter assertions against autocrlf-converted files. No changed file belongs to those failing subsystems. The unrelated failures are disclosed, not treated as passing.
- Desktop preview at 1440×900: ClinicFlow selected; exact CTA and route visible; project selector and pager remained usable; keyboard focus displayed a visible blue outline; document width matched viewport.
- Narrow preview at 390×844: CTA remained readable between the tag row and flow figure; document width/client width remained 390, with no horizontal document overflow or CTA/figure overlap. Eternal Eggs was selected through the pager and had zero CTA links. The project selector remained operable.
- Baseline comparison: the existing top navigation is clipped at 390px because its nav content is wider than the viewport (528px); the same clipping appears in the unchanged local baseline at port 8102. The CTA does not change this nav. No responsive redesign was made.
- Functional navigation: clicking the real anchor reaches `/projects/clinicflow`; the local harness served the route successfully (HTTP 200). The disabled published simulation at port 8107 rendered ClinicFlow with zero CTA links.
- Production D1, R2, Cloudflare, DNS, Access, secrets, bindings, environment, ClinicFlow runtime/workflows, main, PRs, and deployment were untouched. No remote migration or production request was made.

## Unresolved findings and limitations

- The full suite is not green in this Windows sandbox for the unrelated failures itemized above. Those areas were not modified. Architect should retain this limitation when assessing the otherwise passing feature-specific tests.
- The 390px baseline navigation clipping predates this feature and remains visible; the feature's own button and content do not introduce document overflow.
- Local/protected preview evidence is implementer-reported. The test harness models the enabled draft and disabled public payload; no production preview or deployment was used.
- Existing production databases require migration 0007 before new Worker code is deployed. Do not deploy this candidate under D-140.

## Governing references

- D-140 and `DIR-WEB-PROJECT-CASE-STUDY-CTA-0001`.
- `ML-DEVOS-AS-166` (`coordination/ARCHITECT_REVIEW.md`).
- `coordination/OPERATIVE_OBLIGATIONS.md`, including OBL-017, OBL-019–021, and OBL-023–026.
- Protocol V2: `brain/protocols/CONTEXT_BOOTSTRAP.md` and `brain/protocols/ARCHITECT_SYNC.md`.

## Evidence locations

- Implementation and test changes: commit `edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca` on `governance/maisoglabs-v0.1`.
- Desktop, narrow, disabled, neighboring-project, and route previews were reproduced locally by the D-140 harness in `candidates/v10.1/evidence/harness/serve.mjs`.
- Generated artifact identity: `candidates/v10.1/build-report.json` and matching files under `candidates/v10.1/site/` and `public/`.
- Migration: `migrations/0007_project_revisions_case_study_enabled.sql`.

## Next action

The Architect independently re-syncs SENTINEL, performs the bounded SU contradiction review, and reviews the exact implementation commit and the disclosed full-suite/browser limitations. Record the result under the next immutable Architect Sync ID, route the decision to Paulo, and leave deploy, main merge, remote D1/R2, and all other production flags disabled. No Gate C is created by this handoff.
