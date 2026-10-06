# Current Directive — D-139 ClinicFlow case-study Gate D production promotion only

```yaml
schema_version: 1
directive_id: DIR-CLINICFLOW-D139-GATE-D-0001
cycle_id: MAISOGLABS_CLINICFLOW_CASE_STUDY
issue_parent_commit: 8d3a8c67d1ff76cd08fde074ce0cc2ddd39b467f
target_turn: CLAUDE
authority_ref: D-139
applicable_review_id: ML-DEVOS-AS-165
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-139, and ML-DEVOS-AS-165.

## Objective

Promote exactly Worker version 5368e6c8-7cb4-4a0c-b2da-70f65bb8023f to 100% of production traffic exactly once, after the immediate pre-deploy checks pass. Verify production and return. At most one conditional rollback to 5d315120-2647-46c0-a146-64d2a86eaec1 at 100% is authorized only for a new material production failure attributable to this release.

## Preconditions

- Governance publication read-back confirms this directive is selected, D-139 exists, DEPLOY_AUTHORIZED: YES, and every other action flag is NO.
- main is exactly 7d494d012588f513e5e4db3453abb21da5f149bb.
- The exact target is 5368e6c8-7cb4-4a0c-b2da-70f65bb8023f, inactive and deployable; successful Workers Build eddc11b5-49d0-496f-88ba-f4c6a3623ce2 binds it to that exact main commit and its output includes /projects/clinicflow.
- The fresh pre-deploy baseline is deployment 71e7bc54-a5bb-453d-81d2-44eb8e08a6bc, version 5d315120-2647-46c0-a146-64d2a86eaec1 at 100%, with no split.
- Candidate and baseline configuration/bindings match, including the existing D1 UUID and R2 bucket; no configuration or resource change is needed.
- The Protocol V2 connector-native publication read-back succeeds before any production mutation.

## Governing references

- D-139; live STATE; ML-DEVOS-AS-165.
- D-138 and ML-DEVOS-AS-164 (accepted Gate C); OBL-017; Protocol V2 in brain/protocols/CONTEXT_BOOTSTRAP.md and brain/protocols/ARCHITECT_SYNC.md.
- Cloudflare Workers Build eddc11b5-49d0-496f-88ba-f4c6a3623ce2 and the exact target/baseline version and deployment records.

## Exact execution scope

Allowed:
- Cloudflare GET reads and public HTTP GET verification.
- Exactly one Cloudflare Worker deployment API promotion with strategy: "percentage" and versions: [{version_id: "5368e6c8-7cb4-4a0c-b2da-70f65bb8023f", percentage: 100}].
- At most one conditional rollback using the same mechanism to 5d315120-2647-46c0-a146-64d2a86eaec1 at 100%.
- One Protocol V2 Builder return.

Not allowed: rebuild, upload, another version, canary/split, wrangler deploy, route/trigger changes, main/PR changes, DNS, D1/R2, Access, bindings, secrets, environment changes, n8n, Meta, Google Calendar/Sheets, unrelated website changes, or hotfix.

## SENTINEL Sync

- Authority: Paulo's D-139 after ML-DEVOS-AS-165 accepted D-138.
- Context: exact main, target, inactive status, 100% rollback baseline, and matching configuration/bindings were freshly re-read.
- Capability: connector-native exact-tip GitHub CAS publication; Cloudflare API supports a single exact-version promotion.
- Scope: promote once, verify, conditionally rollback once only on qualifying attributable failure, and return.
- Evidence: governance CAS/read-back; deployment/version records; public route and compliance-page GETs; Access boundary response; bounded Worker error/exception inspection.
- No unrelated mutation is needed.

Disposition: CLEAR.

## SU Contradiction Check

Mode: BOUNDED_CONTRADICTION.

Checked: stale governance/main; wrong or active target; build provenance mismatch; missing ClinicFlow route; production drift or split; required rebuild/upload; binding/config mismatch; unrelated DNS/D1/R2/Access/secret/environment/n8n/Meta/Google mutation; rollback ambiguity; and unguarded governance publication.

Disposition: CLEAR_WITH_NOTES. The local Git origin cannot resolve GitHub and the local checker cannot validate the remote snapshot. Paulo explicitly authorizes this one connector-native publication path, which preserves a single-parent candidate and exact expected-tip ref-update CAS; no unguarded update is permitted. Any CAS rejection or post-publication read-back mismatch stops the release before deployment.

## Instructions

1. Confirm the published D-139 and directive by reading the governance branch after the expected-tip CAS.
2. Immediately re-read main, deployments, target version/deployability/inactivity, build provenance, and candidate/baseline configuration. Stop if anything moved or became ambiguous.
3. Promote the exact target once to 100%; do not rebuild or upload.
4. Verify all items below using read-only checks.
5. If and only if a qualifying new material failure attributable to this release appears, perform the one authorized rollback to the pinned baseline at 100%, verify recovery, and stop. Do not hotfix.
6. Publish one Builder return through exact-tip CAS; archive this directive byte-for-byte with its provenance and index row; reset all action flags to NO and route to the Architect.

## Validation and evidence

Record:
- resulting deployment ID, active Worker version, and allocation; confirm no split;
- https://maisoglabs.com/ and https://maisoglabs.com/projects/clinicflow success;
- accepted positioning: “ClinicFlow is a conversational appointment engine that turns natural patient requests into verified appointments in the clinic's real calendar.”;
- principle: “AI understands the patient. ClinicFlow controls the appointment. Calendar proves the result.”;
- architecture/evidence section and /projects/clinicflow/clinicflow-architecture.svg load;
- bounded main navigation smoke;
- /clinicflow/privacy, /clinicflow/data-deletion, and /clinicflow/terms remain available;
- /admin remains behind the existing Access protection boundary;
- Worker exceptions and binding health;
- no D1/R2/DNS/Access/secret/configuration or n8n/Meta/Google mutation;
- rollback status and recovery verification, if applicable.

Do not claim production availability before successful verification.

## Stop conditions

Stop before promotion on any publication/CAS/read-back issue; any changed main, target, baseline, allocation, provenance, or configuration; candidate activation or split; missing route; or need for any unapproved mutation. After promotion, rollback only for a qualifying new material attributable failure, then verify recovery and stop. No unrelated action or forward fix is authorized.

## Next action

After verification or the authorized rollback, publish H-CLINICFLOW-D139-GATE-D-0001, archive and deselect this directive, reset all action flags to NO, and route to TURN: ARCHITECT, STATUS: READY_FOR_ARCHITECT, AUTHORIZED_SCOPE: D139_GATE_D_ARCHITECT_REVIEW_ONLY.
