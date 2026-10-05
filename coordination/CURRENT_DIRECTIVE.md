# Current Directive — ClinicFlow portfolio case study

```yaml
schema_version: 1
directive_id: DIR-CLINICFLOW-PORTFOLIO-CASE-STUDY-0001
cycle_id: MAISOGLABS_CLINICFLOW_CASE_STUDY
issue_parent_commit: 55b7de2a2427c5198aae432c24e83447b08833ec
target_turn: CLAUDE
authority_ref: D-137
applicable_review_id: ML-DEVOS-AS-163
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive transports the D-137 scope; it does not expand authority. The direct authorization is Paulo's D-137 Owner decision.

## Objective

Build a polished, evidence-led, mobile-responsive ClinicFlow case study at `/projects/clinicflow` within the existing MaisogLabs site. Prepare a local preview for review. The cycle ends with the Builder handoff; no merge or deployment follows automatically.

## Preconditions

- Protocol V2 checker passes on the exact live tip.
- STATE selects this directive and D-137 S1 of 1.
- The work stays inside the exact file scope below.
- ClinicFlow runtime and n8n workflows are read-only evidence sources.
- No patient data, credentials, private identifiers, control-plane URLs, or admin screens enter public assets or copy.

## Governing references

- Envelope step: D-137 S1 of 1; this step ends at Builder handoff.
- D-136 (production retention and incident disposition).
- D-137 (bounded case-study authorization).
- ML-DEVOS-AS-163 (Architect acceptance of runtime evidence and routing).
- `coordination/OPERATIVE_OBLIGATIONS.md`, especially production-release separation.
- Existing MaisogLabs route, content, accessibility, and static-export conventions.
- Original ClinicFlow showcase brief supplied by Paulo.

## Exact execution scope

ALLOWED:

- `app/projects/clinicflow/**`
- `components/clinicflow/**`
- `public/projects/clinicflow/**`
- The smallest technically necessary scoped route/supporting change; explain it in the handoff.
- Read-only inspection of ClinicFlow n8n workflows and selected Code nodes, controlled Messenger evidence, Google Calendar/provider evidence, and existing ClinicFlow tests.
- Capture and crop sanitized screenshots, create a page-specific architecture visual, run `npm test` and `npm run build`, and prepare a reviewable local preview.

NOT ALLOWED:

- MaisogLabs homepage redesign or unrelated project/content edits.
- ClinicFlow runtime, n8n workflow, Messenger webhook, Meta settings, Calendar/Sheets, credentials, secrets, production resources, D1/R2, DNS, or Access changes.
- Main merge, any production deployment or traffic change.
- Public patient data, real names/phone numbers, IDs, tokens, OAuth information, private URLs, n8n editor screenshots, or internal admin endpoints.
- Claims such as “production-grade,” “enterprise-ready,” or unsupported reliability guarantees.

## SENTINEL Sync

Disposition: CLEAR for this bounded local case-study task. The Owner scope is explicit. The public page must show product evidence, not operational control planes. Redact or replace identifiers and personal data before saving any evidence.

## SU Contradiction Check

Mode: BOUNDED_CONTRADICTION
Disposition: CLEAR_WITH_NOTES

- Explain AI interpretation separately from deterministic booking control and provider read-back.
- Only claim behavior demonstrated by the inspected workflow, source nodes, and test evidence.
- If an evidence source contains personal or secret data, do not capture it; return the limitation.
- If the route requires broad Worker/backend, auth, data, or homepage changes, stop and return a blocker.

## Instructions

1. Bootstrap from the exact governance tip and inspect existing project routing and the current ClinicFlow candidate.
2. Inspect the actual authorized ClinicFlow evidence sources read-only; map the clearest proven path: conversation → intent → availability → slot → confirmation → revalidation → Calendar mutation → read-back → confirmed appointment.
3. Capture sanitized, legible evidence. Each screenshot must prove a specific step; do not use decorative screenshots. Prefer Messenger interaction, high-level workflow, booking/confirmation, verified Calendar result, and one reliability/recovery artifact.
4. Build `/projects/clinicflow` as a recruiter-facing case study. First viewport must say what the project does, why its transaction boundary matters, and show real system evidence.
5. Use the exact positioning: “ClinicFlow is a conversational appointment engine that turns natural patient requests into verified appointments in the clinic's real calendar.”
6. Feature the principle: “AI understands the patient. ClinicFlow controls the appointment. Calendar proves the result.” Explain Messenger and the AI as adapters around a deterministic booking core.
7. Include the problem, a clear architecture flow, evidence-led walkthrough, engineering safeguards, concise technology list, and demo CTA. Create a short 20–30 second video only if the actual sanitized assets support it without delaying the page.
8. Keep page-specific components and assets inside the authorized scope; ensure mobile and desktop layouts.
9. Run `npm test`, `npm run build`, route checks, secret/personal-data scans, and `git diff --check`. Inspect the exact changed-file set.
10. Open the local preview for Paulo's review. Do not merge or deploy.
11. Publish the Builder handoff through Protocol V2 exact-tip CAS with changed files, evidence, tests, limitations, and all production/merge flags `NO`.

## Validation and evidence

Report actual results for `npm test`, `npm run build`, `/projects/clinicflow` route, mobile/desktop preview, secret scan, personal-data scan, and exact diff.

Security report:

- SECRET SCAN: PASS / FAIL
- PERSONAL DATA SCAN: PASS / FAIL
- PUBLIC CONTENT ONLY: YES / NO

Classify evidence as Builder-reported, Architect-reproduced, or production/runtime evidence. Do not claim an actual booking unless the evidence visibly and safely proves it.

## Stop conditions

Stop and return a blocker if a required fact is unclear; evidence includes any private data or secret; the allowed scope cannot support the route; a broad Worker/backend/auth or homepage change is needed; a dependency or external write is required; the governance tip moves; or the checker refuses publication. Do not widen scope.

## Next action

Return one Builder handoff, archive this directive per Protocol V2, set `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`, `CURRENT_DIRECTIVE: NONE`, and keep deploy, merge, Cloudflare traffic, remote D1/R2, and ClinicFlow runtime flags `NO`. The case-study cycle ends at the reviewable local preview; wait for a later Owner decision before release actions.
