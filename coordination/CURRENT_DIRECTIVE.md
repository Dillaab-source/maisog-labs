# D-142 Gate D — Exact production migration and Worker release

```yaml
schema_version: 1
directive_id: DIR-WEB-D142-GATE-D-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
issue_parent_commit: 65a09335dd82ccd1f8cae6949b8fbb34581a624e
target_turn: CLAUDE
authority_ref: D-142
applicable_review_id: ML-DEVOS-AS-169
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive transports D-142 authority; it does not extend it. Stop if the published STATE flags or any pinned value differ.

## Objective

Apply production D1 migration 0007 once if absent, verify it, promote exactly Worker version cd018d5e-eb3d-4e01-9697-9550f0cc618e to 100%, perform bounded verification, and return one evidence-complete handoff to the Architect. A single rollback to 5368e6c8-7cb4-4a0c-b2da-70f65bb8023f at 100% is permitted only for a new material failure attributable to this promotion.

## Preconditions

- Fresh Protocol V2 checks and publication read-back pass. STATE selects this directive, REMOTE_D1_AUTHORIZED is YES and DEPLOY_AUTHORIZED is YES; all other action flags are NO.
- main remains exactly d7d30e7c1d0a894e628fab82dbd8ed380cc878af, accepted under ML-DEVOS-AS-169.
- Worker candidate is version cd018d5e-eb3d-4e01-9697-9550f0cc618e (#949), deployable and absent from all production deployments. Cloudflare Builds lookup for this exact version returns successful build ffbc9945-7e0d-4a8a-b532-17ab4c8204dc, branch main, source SHA d7d30e7c1d0a894e628fab82dbd8ed380cc878af, npm run build, and npx wrangler versions upload.
- Latest production deployment is e6f47552-39aa-41ba-9aa7-4842bbf7cf43: version 5368e6c8-7cb4-4a0c-b2da-70f65bb8023f at 100%, with no split. This version is the only conditional rollback target.
- Exact D1 target is account fb7234ae9117baf1481ab3b169a9824a, database maisog-labs-web-inc-005-local, UUID 45b87574-e573-4e0f-9bb6-fbba2df29523, also used by candidate and baseline DB bindings. Candidate and baseline runtime settings and bindings match.
- Read-only schema/history checks show migration 0006 present and 0007 absent. Immediately recheck all pinned values before each write. If 0007 is already exactly applied, verify it and skip it; any partial, malformed or conflicting schema stops the release.

## Governing references

- Owner authority: D-142; Architect acceptance: ML-DEVOS-AS-169; Gate C closure: D-141.
- Accepted main: d7d30e7c1d0a894e628fab82dbd8ed380cc878af; candidate build/version and deployment baseline listed above.
- Protocol V2: brain/protocols/CONTEXT_BOOTSTRAP.md; action obligations: coordination/OPERATIVE_OBLIGATIONS.md and OBL-017.
- Migration source: migrations/0007_project_revisions_case_study_enabled.sql.

## Exact execution scope

Allowed operations:

- Read-only GitHub, Cloudflare, D1, public HTTP and Worker observability checks.
- If and only if 0007 is absent, apply exactly ALTER TABLE project_revisions ADD COLUMN case_study_enabled INTEGER NOT NULL DEFAULT 0 CHECK (case_study_enabled IN (0, 1)); and insert its exact filename 0007_project_revisions_case_study_enabled.sql into d1_migrations. No other SQL or database change is authorized.
- After migration verification, create exactly one production deployment with strategy percentage and versions: [{ "version_id": "cd018d5e-eb3d-4e01-9697-9550f0cc618e", "percentage": 100 }].
- At most one conditional deployment to 5368e6c8-7cb4-4a0c-b2da-70f65bb8023f at 100%, only as defined above.
- One Protocol V2 Builder return.

No rebuild/upload, other version, split/canary, source/PR/main change, D1 mutation outside 0007 and its history row, R2 operation, configuration/binding/secret/Access/DNS/route change, content publication, workflow change, hotfix or unrelated production operation.

## SENTINEL Sync

Disposition: CLEAR.

Fresh checks verified the exact accepted source, deployable inactive version, successful associated build, current 100% deployment, exact production database, absent migration, and matching candidate/baseline configuration. Migration-before-deployment preserves compatibility; the old Worker remains active during the additive D1 change. Only the exact D1 migration and exact Worker deployment are authorized.

## SU Contradiction Check

Mode: BOUNDED_CONTRADICTION.

Disposition: CLEAR_WITH_NOTES.

Checked for stale governance or main, wrong source/version, unsuccessful or mismatched build provenance, active/split candidate, changed bindings/database, absent 0006, already/partially applied 0007, unsafe ordering, ambiguous rollback, or need for any excluded operation. Local Wrangler authentication is expired, so use the connected Cloudflare API for only the authorized migration and deployment if needed; do not login, alter credentials, or substitute an unpinned target. If the API cannot apply and verify the migration safely, stop before deployment. Public verification must independently check routes and Access rather than treat crawler inaccessibility as success.

## Instructions

1. Confirm the governance publication and run the Protocol V2 checker. Re-read exact main, candidate/build association and deployability, current deployment/allocation, D1 identity, migration history, and matching runtime configuration.
2. Capture read-only pre-migration schema, project/revision/content counts and the existing published project data needed for before/after comparison.
3. If 0007 is absent, apply only its exact SQL and matching migration-history row. Read back migration history and schema constraints/default immediately. Verify existing rows remain accessible, every old row defaults to disabled, and the captured published content/counts are unchanged. Verify the active Worker continues to serve the baseline site. If any check fails, stop and do not deploy.
4. Immediately revalidate governance authorization, source main, candidate/build, current deployment/version at 100%, rollback target and configuration. Promote the exact candidate once to 100%; read back deployment ID and allocation.
5. Verify homepage and ClinicFlow case-study routes, homepage content/selector/pager/navigation, privacy/terms/data-deletion pages, Access protection on /admin, D1-backed read operations, default-off behavior, and bounded Worker errors/exceptions. Compare public content to the captured baseline; make no content edits.
6. If a new material production failure attributable to the release occurs, perform at most one rollback to the pinned baseline at 100%, verify recovery, and stop. Leave additive migration 0007 intact if compatibility was established. Do not hotfix, substitute a version or apply destructive rollback.
7. Publish one evidence-complete Builder handoff, archive this directive byte-for-byte with provenance/index, reset every action flag to NO, and route to the Architect. Stop; do not claim Gate D acceptance.

## Validation and evidence

Record the starting governance SHA, D-142/directive IDs and publication SHA; before/after migration ledger, schema, default values, counts and published-content comparison; exact account/database identity; exact build and source provenance; previous and resulting deployment IDs, versions and percentages; public-route and Access responses; bounded Worker exception/error observation; rollback disposition; complete list of production mutations; and every unavailable check. Separate directly observed Cloudflare/API results, Builder-performed checks and derived conclusions.

## Stop conditions

Stop before any mutation if governance read-back fails; a flag, exact main, candidate, build/source, database, migration state, current deployment/allocation, rollback target or configuration differs; 0007 is malformed or partially applied; migration cannot be safely recorded and verified; the active Worker fails after migration; or any unapproved operation is required. After promotion, use the single rollback only for a material attributable failure. After rollback, verification failure or ambiguity, stop all writes and report.

## Next action

Return one Gate D Builder handoff for independent Architect review with all action flags NO. Gate D acceptance and any future release action remain with the Architect and Paulo.
