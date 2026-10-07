# D-143 — ClinicFlow homepage case-study CTA activation

```yaml
schema_version: 1
directive_id: DIR-WEB-D143-CLINICFLOW-CTA-ACTIVATION-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
issue_parent_commit: 3dda791a79eb5fbb431fe70520c0040f594511d9
target_turn: CLAUDE
authority_ref: D-143
applicable_review_id: ML-DEVOS-AS-170
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive transports D-143 only. It permits the existing protected admin workflow to publish one ClinicFlow field change. It does not authorize application or Cloudflare changes.

## Objective

Publish the ClinicFlow case-study CTA by changing only the clinicflow project's caseStudyEnabled value from false to true. The existing code-owned UI must render VIEW CASE STUDY → linking to /projects/clinicflow.

## Preconditions

- This directive and its STATE selector are published at the exact current governance tip and read back; a fresh Protocol V2 checker confirms binding to parent 3dda791a79eb5fbb431fe70520c0040f594511d9.
- The production Worker remains exactly version cd018d5e-eb3d-4e01-9697-9550f0cc618e, deployment 9bc906af-b63f-4c6f-a301-60a84a108725, allocated at 100%. Re-read immediately before the content write; any deviation stops execution.
- The existing Cloudflare Access boundary authenticates the operator normally. Do not change or bypass Access.
- Read current published and draft revisions for ClinicFlow and inspect pending drafts across the homepage projects. Published ClinicFlow caseStudyEnabled must be strictly boolean false; there must be no ClinicFlow draft and no unrelated pending draft.
- https://maisoglabs.com/projects/clinicflow is reachable and returns successfully before editing.
- If revisions, current values, pending-draft status, route, deployment, or Access state are ambiguous, stale, or inconsistent, stop before any content write.

## Governing references

- Owner decision: D-143 in brain/DECISION_LOG.md.
- Architect release acceptance: ML-DEVOS-AS-170; D-142 release is closed.
- Protocol V2: brain/protocols/CONTEXT_BOOTSTRAP.md; routing rules: brain/protocols/ARCHITECT_SYNC.md.
- Obligations: coordination/OPERATIVE_OBLIGATIONS.md, including OBL-017.
- Production source boundary: accepted Worker version, deployment and revision lifecycle are pinned in D-143 and this directive.

## Exact execution scope

Permitted:

- Read-only checks of governance, Worker/deployment state, public routes, and protected-admin revision state.
- Through the existing protected Projects admin UI, create one ClinicFlow draft derived from its current published revision, changing only caseStudyEnabled: false -> true.
- Save and preview that draft. Publish only its exact verified revision using the existing revision-pointer and stale-write protections.
- Read back the published revision and perform public homepage/button/destination checks.
- Allow only normal audit events emitted by the existing admin save and publish workflow.

Forbidden: direct D1/SQL/API writes, database edits, browser devtools or forced payloads, arbitrary URL/label fields, edits to any other field/project, draft publication by bulk or moving pointer outside the UI, source changes, deployment, migration, R2, Cloudflare config/bindings/secrets/Access/DNS/routes, or any unrelated production operation.

## SENTINEL Sync

Disposition: CLEAR.

The current AS-170 review closed the production code release but explicitly returned content activation for a separate Paulo decision. D-143 is that new, narrow Owner authority. The accepted implementation already supplies the CTA label and code-derived route. The directive requires exact Worker, deployment, revision and draft-state checks before write. All production/code/config operations outside the existing admin content lifecycle remain excluded.

## SU Contradiction Check

Mode: BOUNDED_CONTRADICTION.

Disposition: CLEAR_WITH_NOTES.

The D-142/AS-170 prohibition on content publication applied before a separate Owner decision; D-143 now supplies that decision. No release or configuration authority is inferred. If the current production state differs from the pins, a pending draft exists, or the admin workflow cannot prove the exact one-field delta, stop and return the evidence without publishing.

## Instructions

1. Re-resolve governance state. Confirm the active D-143 directive and all selectors/flags exactly match. Run the read-only Protocol V2 checker.
2. Verify the live Worker version/deployment/100% allocation using Cloudflare read operations. Verify Access login normally.
3. Read all published/draft state and identify any pending drafts. Stop if any unrelated draft exists, the current published boolean is not false, or ClinicFlow has a draft not identical to published.
4. Verify the case-study route responds successfully.
5. In the protected Projects admin UI, select only ClinicFlow, enable “Show case study button,” and save one draft.
6. Read back the draft and compare its complete content with the current published revision. The only difference must be caseStudyEnabled: false -> true; verify the displayed label is VIEW CASE STUDY → and destination is /projects/clinicflow. If any other field or project differs, do not publish.
7. Open the protected homepage preview for this draft. Verify ClinicFlow panel integrity, exact visible CTA text and destination, desktop and narrow/mobile layout, and unchanged other project panels.
8. Immediately before publishing, re-read the exact draft revision and current published pointer. Publish only that exact revision using the built-in admin control.
9. Read back the published pointer/revision and verify caseStudyEnabled: true. Confirm homepage response, visible CTA and destination route. Capture desktop and narrow/mobile behavior.
10. Publish one evidence-complete Builder handoff to the Architect under Protocol V2, archive this directive byte-for-byte with provenance/index, and reset all action-specific flags to NO. Stop for independent Architect review.

## Validation and evidence

Record the starting governance SHA and D-143 publication SHA; checker result; exact production Worker version, deployment and traffic allocation; Access result; published and draft revision IDs/content before edit; pending-draft inventory; pre-edit route result; exact saved draft ID and full one-field diff; preview desktop/narrow results; exact published revision ID and read-back boolean; public homepage status and observed CTA text/href/click result; other-project unchanged checks; and all limitations. Separate connector/browser observations, Builder reports, and derived conclusions. Record every admin save/publish audit event identifier returned by the app, if shown.

## Stop conditions

Stop before content mutation if governance publication/checker/read-back fails; any D-143 state selector or flag differs; Worker/deployment/allocation differs; Access cannot authenticate normally; current ClinicFlow value is not false; ClinicFlow has an ambiguous or divergent draft; any other pending draft exists; route is inaccessible; or an exact one-field delta cannot be established. After saving a draft, stop without publishing if its full revision differs in any other way, preview is wrong, other project content changes, or the current published pointer moved. Do not retry stale writes by bypassing the UI protections.

## Next action

After successful publication and bounded public verification, return one Builder handoff to the Architect under Protocol V2. No merge, deployment, migration, configuration change, or further content edit is authorized.
