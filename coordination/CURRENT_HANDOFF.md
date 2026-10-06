# Builder Handoff — D-142 Gate D production release

```yaml
schema_version: 1
handoff_id: H-WEB-D142-GATE-D-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
input_base_commit: 3f703d4d66e40f8466ed0c9f601af74e44542884
review_target_commit: 3f703d4d66e40f8466ed0c9f601af74e44542884
applicable_review_id: ML-DEVOS-AS-169
```

This packet records Builder evidence, not acceptance or authority. D-142 authorized the bounded Gate D operations below. The Architect must review the evidence independently. No action-specific authorization remains active.

## Objective

Execute DIR-WEB-D142-GATE-D-0001 under Owner Decision D-142: apply and verify only additive migration 0007, promote the exact accepted Worker version from main to 100%, perform bounded production verification, and return the evidence for Architect review. Do not enable or publish the ClinicFlow CTA.

## Changed files

The governed return changes only coordination records:

- coordination/CURRENT_HANDOFF.md
- coordination/STATE.md
- coordination/archive/directives/DIR-WEB-D142-GATE-D-0001.md
- coordination/archive/directives/DIR-WEB-D142-GATE-D-0001.provenance.json
- coordination/archive/directives/README.md

Production mutations are separately enumerated under Tests and evidence. No application source, tests, migration file, main, PR, R2 object, DNS record, Access policy, Worker binding, secret, or runtime configuration was changed.

## Tests and evidence

Evidence class: Builder-observed through the GitHub connector, Cloudflare API/D1/Observability connectors, public HTTP GETs, and the existing authenticated in-app browser. Results are actor-reported for independent Architect review.

### Governance and source pins

- Starting authoritative governance tip: 65a09335dd82ccd1f8cae6949b8fbb34581a624e.
- D-142 Owner Decision and bounded directive were published first as governance commit 3f703d4d66e40f8466ed0c9f601af74e44542884, parent 65a09335dd82ccd1f8cae6949b8fbb34581a624e; exact-tip publication read-back and Protocol V2 checker passed.
- Fresh Protocol V2 checker at the active D-142 tip passed. It confirmed the selected and bound directive, exact publication parent, live archived review ML-DEVOS-AS-169, obligation inventory, and frozen legacy handoff.
- Accepted main remained exactly d7d30e7c1d0a894e628fab82dbd8ed380cc878af.
- Cloudflare Workers Build ffbc9945-7e0d-4a8a-b532-17ab4c8204dc succeeded for branch main and source d7d30e7c1d0a894e628fab82dbd8ed380cc878af; build command npm run build, deploy command npx wrangler versions upload.
- Exact candidate: Worker version cd018d5e-eb3d-4e01-9697-9550f0cc618e (#949), associated with that successful build and absent from all 22 deployments before promotion.
- Candidate and previous production version had matching runtime settings and bindings, including D1 UUID 45b87574-e573-4e0f-9bb6-fbba2df29523 and R2 binding maisog-labs-web-inc-004-local.
- D1 identity read-back: account fb7234ae9117baf1481ab3b169a9824a, database maisog-labs-web-inc-005-local, UUID 45b87574-e573-4e0f-9bb6-fbba2df29523.
- Immediately before promotion, the exact current deployment was still e6f47552-39aa-41ba-9aa7-4842bbf7cf43, serving only version 5368e6c8-7cb4-4a0c-b2da-70f65bb8023f at 100%. This remained the pinned rollback target. Migration 0006 was present and migration 0007 had completed successfully.

### Migration 0007

- Before migration, the database had six ledger entries and project_revisions did not have case_study_enabled.
- Applied once on 2026-10-06 at 07:18:40 database time: ALTER TABLE project_revisions ADD COLUMN case_study_enabled INTEGER NOT NULL DEFAULT 0 CHECK (case_study_enabled IN (0, 1)); and inserted exactly 0007_project_revisions_case_study_enabled.sql into d1_migrations.
- Read-back shows migration 0007 recorded after 0006. case_study_enabled is INTEGER NOT NULL DEFAULT 0; the table definition includes CHECK (case_study_enabled IN (0, 1)).
- All 11 existing revisions remain accessible and their prior column values matched the saved pre-migration rows. All 11 default to disabled; enabled count 0; invalid/null values 0.
- Existing counts remained projects 5, revisions 11, project media 0. Published project content and all pre-existing revision fields remained unchanged.
- The then-active Worker continued serving the homepage and /projects/clinicflow with HTTP 200 after the migration and before promotion.

### Worker promotion and production verification

- Immediately before deployment, governance authorization and the exact main, candidate/build association, inactive candidate status, D1 schema/history, active deployment and configuration pins were re-read and matched the directive.
- Created exactly one deployment using the Cloudflare deployment API: deployment 9bc906af-b63f-4c6f-a301-60a84a108725, strategy percentage, exact Worker version cd018d5e-eb3d-4e01-9697-9550f0cc618e at 100%. Read-back confirms it is the latest deployment, with one version and no traffic split.
- After promotion, unauthenticated GETs returned: / 200; /projects/clinicflow 200; /clinicflow/privacy 200; /clinicflow/terms 200; /clinicflow/data-deletion 200; /api/journal 200 JSON; /api/design 200 JSON; /admin 302 to the existing Cloudflare Access boundary. The ClinicFlow case-study page and homepage include ClinicFlow content. With the CTA still disabled, neither response contained VIEW CASE STUDY.
- The existing authenticated browser session opened the production admin dashboard read-only. It showed the five published homepage projects, ClinicFlow published, the ClinicFlow Show case study button checkbox at 0, and destination /projects/clinicflow. No Save, Publish, content, or design control was activated. This verifies the toggle remains OFF and the D1-backed project editor can read its records.
- On the production homepage after promotion, the ClinicFlow project panel and four workflow steps rendered. The project selector/pager moved to Eternal Eggs and back to ClinicFlow; the Projects navigation link reached #projects. No page content was edited.
- A Workers Observability keys lookup for maisog-labs confirmed error and level fields. The bounded query from 2026-10-06 07:20:00Z to 07:36:19Z returned no error events and no level values. This is limited to events available to that query; it does not establish the absence of unlogged errors.
- Read-only post-release D1 verification again showed migration 0007 present, 11 revisions, all disabled, 0 invalid values, 5 projects and 0 project-media rows.

### Complete production mutation inventory

1. Production D1 database 45b87574-e573-4e0f-9bb6-fbba2df29523: one additive ALTER TABLE for migration 0007 and one matching migration-ledger insert.
2. Production Worker maisog-labs: one deployment promoting the pinned version above to 100%.

No rollback was used. No D1/R2 changes beyond the migration and ledger row, content publication, Worker upload/rebuild, split deployment, configuration change, DNS/Access/security change, ClinicFlow workflow change, PR/main change, or other production mutation occurred.

## Unresolved findings and limitations

- Gate D is not declared accepted; independent Architect review remains required.
- The bounded Observability query returned no matching records. It is evidence of no reported error events in that query window, not proof that no unlogged runtime failure occurred.
- The admin check was read-only and confirmed the case-study toggle is OFF. The CTA has not been enabled or published; that requires separate content-publication authorization.
- No forced mobile-device emulation was performed. The requested selector, pager, project navigation, public routes, and authenticated project read were verified in the available browser.
- Local Wrangler authentication was expired; authorized Cloudflare operations used the connected API. No credentials were changed.

## Governing references

- Owner authority: D-142, published in 3f703d4d66e40f8466ed0c9f601af74e44542884.
- Active directive: DIR-WEB-D142-GATE-D-0001, archived byte-for-byte with provenance in this transition.
- Applicable Architect acceptance: ML-DEVOS-AS-169; Gate C closure: D-141.
- Accepted implementation/main: d0bf93ee6951279180c97e5d4a10635be6c68339 in main d7d30e7c1d0a894e628fab82dbd8ed380cc878af.
- Protocol V2: brain/protocols/CONTEXT_BOOTSTRAP.md; Architect Sync: brain/protocols/ARCHITECT_SYNC.md; obligations: coordination/OPERATIVE_OBLIGATIONS.md, including OBL-017.
- Migration source: migrations/0007_project_revisions_case_study_enabled.sql.

## Evidence locations

- Governance decision/directive: brain/DECISION_LOG.md, archived directive and its provenance, directive archive index.
- Checker and exact coordination publication receipts: scripts/check-context-bootstrap.mjs output at D-142 publication and this return.
- Source/build/version/deploy evidence: GitHub main and Cloudflare Build ffbc9945-7e0d-4a8a-b532-17ab4c8204dc, candidate version cd018d5e-eb3d-4e01-9697-9550f0cc618e, prior deployment e6f47552-39aa-41ba-9aa7-4842bbf7cf43, resulting deployment 9bc906af-b63f-4c6f-a301-60a84a108725.
- Database evidence: D1 database UUID 45b87574-e573-4e0f-9bb6-fbba2df29523, migration ledger, PRAGMA table_info(project_revisions), table definition, revision values/counts and saved pre-migration comparison.
- Live evidence: public HTTP GET results, production homepage project navigation, authenticated admin read of published projects and ClinicFlow case-study toggle, and bounded Worker Observability query described above.
- The authorization publication SHA is 3f703d4d66e40f8466ed0c9f601af74e44542884. The exact SHA of this Builder return is its own publication commit and is supplied in the return receipt, since a commit cannot contain its own SHA.

## Next action

Route to the Architect for independent D-142 Gate D review. Keep every action-specific flag NO. Do not claim Gate D acceptance, enable/publish the CTA, or perform any further production operation.
