# Current Directive — D-140 bounded remediation (F001/F002)

```yaml
schema_version: 1
directive_id: DIR-WEB-PROJECT-CASE-STUDY-CTA-REM1-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
issue_parent_commit: 05da7b800018ae3fc38c37e61766bc3dfea4faf1
target_turn: CLAUDE
authority_ref: D-140
applicable_review_id: ML-DEVOS-AS-167
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

## Objective

Resolve only Architect findings F001 and F002 from ML-DEVOS-AS-167 against the D-140 implementation. Return the corrected implementation and complete evidence to the Architect in one bounded pass.

## Preconditions

- The live governance selector authorizes this directive under D-140 and remediation cycle 2 of 2.
- The reviewed implementation is `edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca`; verify the checkout and branch before editing.
- Preserve the existing shared code-owned registry and server-side project restrictions.
- Production/release flags remain NO. Do not merge, deploy, run remote migrations, or mutate Cloudflare resources.

## Governing references

- D-140 and `DIR-WEB-PROJECT-CASE-STUDY-CTA-0001`.
- ML-DEVOS-AS-167, findings F001 and F002.
- `coordination/STATE.md`, `coordination/OPERATIVE_OBLIGATIONS.md`, and Protocol V2 (`brain/protocols/CONTEXT_BOOTSTRAP.md`).
- The deterministic V10.1 candidate builder and shared case-study registry.

## Exact execution scope

- Remove the `clinicflow`-specific CTA condition in `scripts/build-v101-candidate.mjs`; render for any valid, enabled, server-approved registered case-study project.
- In `worker/bridge/inject.mjs`, independently validate bounded slug shape, strict boolean `caseStudyEnabled`, and approved registry membership for enabled slugs before applying the project group.
- Preserve whole-group fallback for malformed or unregistered enabled payload values.
- Reuse the shared code-owned registry; do not create a separately maintained allowlist, URL field, destination override, or caller-controlled URL.
- Add the directed regression coverage: a hypothetical second registered case study and malformed bridge payloads.
- Regenerate fingerprinted assets and artifact identity using the existing deterministic builder; update only artifacts and tests required by these corrections.
- Complete test/build and desktop/mobile evidence, inspect the exact diff, and return one Builder handoff to Architect.

## SENTINEL Sync

Disposition: CLEAR_WITH_NOTES, as recorded by the Architect. This route carries only F001/F002 into the existing D-140 scope. Keep all production and release authorization flags NO.

## SU Contradiction Check

Mode: BOUNDED_CONTRADICTION. The Architect identified exactly two required corrections: hard-coded ClinicFlow rendering and insufficient independent bridge validation / allowlist-drift risk. Address both with regression evidence. This disposition is not a third finding or permission to expand scope.

## Instructions

1. Inspect current shared registry, builder patch, bridge hook, and related tests before editing.
2. Make the ProjectsPanel decision generic over validated enabled registry members; preserve CTA label, derived route, server-side restrictions, and no-CTA behavior for disabled projects.
3. Validate each bridge project's slug and strict boolean independently at the hook boundary. Enabled slugs must be present in the code-owned registry. Any malformed group, including enabled unregistered values, must use the existing whole-group fallback. Do not accept arbitrary URL/destination data.
4. Add focused tests for a second hypothetical registered case-study slug and malformed slug/boolean/registry cases, including whole-group fallback.
5. Run the deterministic asset builder, complete test suite, and build. Verify desktop and mobile/narrow behavior and inspect all changed paths.
6. Publish no product data or production state. Return the corrected candidate and evidence to Architect under Protocol V2, with all production/release flags NO.

## Validation and evidence

Record new implementation commit SHA(s); regression cases and outcomes; deterministic asset names, hashes, and artifact identity; complete test-suite and build results; desktop and mobile/narrow preview observations; full changed-file inventory; and confirmation that the code uses the shared registry and whole-group fallback. Distinguish test or preview evidence by how it was obtained. Do not claim unrun checks passed.

## Stop conditions

Stop if the live branch or D-140 authority is ambiguous; a required correction needs schema/admin/API/product-scope expansion; the shared registry cannot be reused without an independent allowlist; whole-group fallback cannot be preserved; the remediation limit would be exceeded; checker/CAS fails; or a production, remote D1/R2, Cloudflare, main-merge, deploy, or Protocol V2.2 action appears necessary. Do not start another remediation cycle autonomously.

## Next action

After this single bounded remediation, publish a complete Builder handoff and return to `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, with every production and release authorization flag set to NO. Stop for independent review.
