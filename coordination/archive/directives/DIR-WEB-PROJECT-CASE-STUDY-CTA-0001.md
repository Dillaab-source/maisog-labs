# Current Directive — Reusable project case-study CTA implementation (D-140)

```yaml
schema_version: 1
directive_id: DIR-WEB-PROJECT-CASE-STUDY-CTA-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
issue_parent_commit: 7628958f618c497d14e73d707edc368844c0426c
target_turn: CLAUDE
authority_ref: D-140
applicable_review_id: ML-DEVOS-AS-166
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

## Objective

Implement one reusable, code-owned homepage project case-study CTA capability. ClinicFlow is the only initially registered destination and may be enabled by a revisioned admin checkbox. The exact public label is VIEW CASE STUDY → and its destination is derived as /projects/{project.slug}. Return validated implementation and preview evidence to Architect.

## Preconditions

- STATE selects this directive and D-140; protocol remains V2.
- Fresh governance branch tip equals the parent used to publish this directive.
- Main baseline inspected for this task is 7d494d012588f513e5e4db3453abb21da5f149bb; do not merge or deploy it.
- Current migrations end at 0006; the authorized local migration is the next additive migration, 0007.
- Existing route app/projects/clinicflow/page.js exists. Initial code-owned registry contains only clinicflow.
- No production D1 call or remote migration is permitted. Main merge and deployment remain NO.
- AS-166 closes D-139 only; D-140 is the separate authority for this cycle. Do not infer any authority from AS-166.

## Governing references

- D-140, live STATE, and ML-DEVOS-AS-166 as the current immutable review identity.
- RFC-022 bridge, current project revision lifecycle, migration 0006, and V10.1 artifact contract/builder.
- brain/protocols/CONTEXT_BOOTSTRAP.md and brain/protocols/ARCHITECT_SYNC.md.
- The authorized implementation and adversarial acceptance matrix in Paulo's D-140 Owner decision.

## Exact execution scope

Allowed:
- One dependency-free shared, code-owned case-study slug registry with bounded helpers; initially only clinicflow.
- Local additive migration 0007 on project_revisions: INTEGER NOT NULL DEFAULT 0 CHECK (case_study_enabled IN (0,1)).
- Revision domain, normalization, strict validation, create/edit persistence and inheritance for the boolean.
- Protected admin checkbox only for registered slugs, with read-only derived destination; unregistered projects show unavailable state.
- Public/draft RFC-022 bridge fields limited to slug and caseStudyEnabled; validate before use and preserve whole-project-group fallback behavior.
- Deterministic V10.1 builder exact-match ProjectsPanel patch; regenerate fingerprinted candidate/public assets and only required identity, build-report and test references.
- Focused local tests, npm test, npm run build, local or protected preview, desktop/narrow visual and functional checks, evidence, and one Builder handoff.

Forbidden:
- Any URL input, external destination, arbitrary caller href, HTML/JS destination override, or unregistered enabled slug.
- Applying migration remotely; any production D1/R2, Cloudflare, DNS, Access, binding, secret or environment mutation.
- Main/PR merge, deployment, traffic change, Gate C, ClinicFlow runtime/workflow, n8n, Meta, Google, Protocol V2.2, or unrelated redesign.
- Editing a fingerprinted V10.1 minified file as the source of truth.

## SENTINEL Sync

Disposition: CLEAR.

The bounded design keeps behavior/routes code-owned and stores only a boolean in the existing revision lifecycle. Destination construction is gated by a shared slug allowlist plus existing slug validation. The admin displays the derived destination but cannot edit it. Draft, preview and publish pointers remain authoritative. Existing revisions and old Worker reads default/ignore the additive column safely; deploy ordering is migration first, new Worker second. Production resources remain out of scope.

## SU Contradiction Check

Mode: BOUNDED_CONTRADICTION.
Disposition: CLEAR_WITH_NOTES.

Plan tests/reasoning for:
- arbitrary https URL, javascript: URL, ../ traversal, malformed slug, and unknown fields;
- unregistered slug with enabled=true through a direct API request;
- draft-enabled/published-disabled, later disable, and publish transitions;
- project rename and stable base-row slug identity;
- missing registered route and missing registry entry;
- stale draft/publish pointers;
- old Worker after the additive migration, and the new Worker before it;
- malformed/stale bridge payload and all-or-nothing safe fallback;
- accidental CTA on neighboring projects;
- mobile overflow, keyboard focus, real anchor navigation and no pager/selector interference.

Compatibility decision to verify and document: keep BRIDGE_SCHEMA_VERSION 1 if slug and caseStudyEnabled are additive optional project properties, the new bridge strictly validates them, and the existing hook safely ignores them. If inspection or tests show v1 cannot preserve old-hook fallback behavior, stop and report before changing the version or widening scope.

## Instructions

1. Build the shared case-study registry; route helpers must only return /projects/<slug> for a valid registered slug. Add a repository structural test that every registered slug has app/projects/<slug>/page.js.
2. Add migration 0007 with default-off checked storage. Existing rows/revisions must read false.
3. Carry caseStudyEnabled through the existing v10 project revision shape and migration-aware read/write mapping. API/domain input must be strictly boolean. Reject enabled=true when the owning projects.slug is not registered, including create and edit API paths. Text-only edits inherit the source revision value. Keep pointer guards and atomic publish behavior.
4. Extend admin with “Show case study button” only for registered projects and read-only “Destination: /projects/clinicflow”. Unregistered projects show the unavailable message. Saving remains draft-only; protected preview consumes draft pointers; public reads published pointers only.
5. Add only project.slug and caseStudyEnabled to the bounded bridge. Snapshot SQL reads p.slug. Validate both and the complete project group; server bridge/hook never accept or construct caller URLs. Preserve fail-closed fallback and decide/document the schema version per SU above.
6. Use scripts/build-v101-candidate.mjs as the source mechanism. Add an exact-match patch to ProjectsPanel. Render a semantic, keyboard-focusable real anchor only for a validated enabled registered project; label exactly VIEW CASE STUDY →. Do not make the whole card clickable. Missing fields in static data mean no CTA. Preserve unrelated asset bytes and update only generated references/report/identity required by the builder.
7. Test migration locally: old rows false; old-shaped revision safe; new writes store 0/1; omitted boolean inherits; old Worker explicit writes/reads tolerate the column; new Worker before migration fails closed/no CTA; no production D1 call.
8. Add deterministic cases for all items 1–20 in the Owner decision test matrix, covering registry/route, URL rejection, default/validation, lifecycle and preview/public differences, bridge validation/fallback, exact label/href, non-enabled projects, asset fingerprint, dead href scan, pager and selector.
9. Record old/new Projects fingerprint, old/new homepage SHA-256, byte length and insertion offset. If index identity changes, update bridge ARTIFACT_SHA256, ARTIFACT_LENGTH, INSERTION_OFFSET and tests atomically; do not change insertion behavior.
10. Run the focused tests, full npm test, and npm run build. Do not dismiss failures. Attribute any pre-existing unrelated failure with evidence.
11. Verify at 1440x900 and 390x844 or equivalent: enabled ClinicFlow draft CTA exact label/href, clean layout, no overflow, pager/list use and visible keyboard focus; another project has no CTA; link navigates to /projects/clinicflow; disabled published simulation has no CTA. Use local/protected preview only.
12. Inspect complete changed paths and exact diff. If work outside the authorized categories is needed, stop.
13. Publish one Builder handoff via fresh exact-tip local Protocol V2 checker/CAS. Archive and preserve rolling records as required, set TURN: ARCHITECT and STATUS: READY_FOR_ARCHITECT, and keep every action flag NO. Do not reuse connector-native D-139 exception.
14. Stop after the handoff. No Gate C, merge, remote migration or deploy.

## Validation and evidence

Report the migration and migration-order compatibility; server-side rejection tests for unregistered enabled slugs; revision inheritance/publish behavior; bridge schema decision and fallback; exact current and generated asset fingerprints plus artifact identities; focused/full test and build results; desktop and narrow evidence; exact href navigation; disabled and neighboring-project results; complete changed-file inventory; and confirmation production D1 and all production resources stayed untouched.

## Stop conditions

Stop on any ambiguous governance tip, checker or CAS failure; scope expansion; need for a production/remote write; a missing /projects/<slug> route; inability to enforce the server-side registry; incompatible old/new Worker migration behavior; bridge behavior that cannot fail closed; preview/publish lifecycle bypass; unbounded URL input; unrelated test failure that cannot be isolated; or responsive/accessibility regression that requires redesign. Do not merge, deploy, run a remote migration, or route to Gate C.

## Next action

After implementation and required evidence pass, publish one complete Builder handoff, reset all action flags to NO, route to Architect for review, and stop.
