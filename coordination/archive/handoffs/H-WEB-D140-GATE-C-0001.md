# Builder Handoff — D-140 Gate C protected merge

```yaml
schema_version: 1
handoff_id: H-WEB-D140-GATE-C-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
input_base_commit: 0674445d716e4f9b22b3dd73ebd1a699aa1c834e
review_target_commit: 0674445d716e4f9b22b3dd73ebd1a699aa1c834e
applicable_review_id: ML-DEVOS-AS-168
```

This handoff records Gate C execution evidence. Routing and authority are in coordination/STATE.md. Evidence below is actor-reported from repository, GitHub API/connector and local checker observations; no production/runtime verification is claimed.

## Objective

Execute DIR-WEB-D140-GATE-C-0001 under Owner Decision D-141: review the exact authorized source head through the required GitHub PR checks and protections, merge by the normal protected PR path, and return evidence for independent Architect review. Stop before Gate D.

## Result

**Gate C completed.** PR #22 merged through GitHub's normal pull request merge operation as a merge commit, with the authorized head pinned. No production deployment, remote migration, D1/R2 mutation, Worker promotion, or Cloudflare configuration change was performed.

| Evidence | Observed value |
|---|---|
| Starting governance tip / D-141 publication head | 0674445d716e4f9b22b3dd73ebd1a699aa1c834e |
| Owner Decision / directive | D-141 / DIR-WEB-D140-GATE-C-0001 |
| Accepted Architect review / implementation | ML-DEVOS-AS-168 / d0bf93ee6951279180c97e5d4a10635be6c68339 |
| PR | [#22](https://github.com/Dillaab-source/maisog-labs/pull/22), governance/maisoglabs-v0.1 → main |
| Exact reviewed PR head | 0674445d716e4f9b22b3dd73ebd1a699aa1c834e |
| main base immediately before merge | 7d494d012588f513e5e4db3453abb21da5f149bb |
| Active protection | Ruleset 23740878 main-protection, active on refs/heads/main; pull request required; 0 fixed approvals; required status test-and-build (integration 15368); deletion and non-fast-forward prohibited |
| Required exact-head CI | test-and-build: success, PR run 37422431585 (job 112134545822), completed 2026-10-06T06:14:38Z; head was exactly 0674445d716e4f9b22b3dd73ebd1a699aa1c834e |
| Additional exact-head checks | Push-triggered test-and-build run 37422153381: success. Workers Builds: maisog-labs: success (not a production promotion) |
| Review/mergeability | PR was open, non-draft, targeted main; GitHub reported mergeable: true, mergeable_state: clean; no reviews or unresolved review threads; ruleset required 0 fixed approvals |
| Merge operation | GitHub PR merge endpoint, merge_method: merge, expected head pinned to 0674445d716e4f9b22b3dd73ebd1a699aa1c834e |
| Merge commit and parents | d7d30e7c1d0a894e628fab82dbd8ed380cc878af, parents 7d494d012588f513e5e4db3453abb21da5f149bb and 0674445d716e4f9b22b3dd73ebd1a699aa1c834e |
| Resulting main / PR status | main at d7d30e7c1d0a894e628fab82dbd8ed380cc878af; PR merged at 2026-10-06T06:17:00Z |
| D-140 implementation present | Merge commit has the exact D-141 source commit as its second parent; accepted implementation d0bf93ee6951279180c97e5d4a10635be6c68339 is included in that history |

The active ruleset listed a repository-role bypass actor with pull-request scope. The operation used the standard merge action and did not request an administrator override or bypass. No fixed approval requirement was configured; GitHub reported a clean merge state after the required check passed.

## Tests and evidence

- Fresh Protocol V2 status check passed at exact governance tip 0674445d716e4f9b22b3dd73ebd1a699aa1c834e.
- GitHub's required test-and-build check completed successfully on the exact final PR head. The accepted implementation's earlier Architect-recorded CI run 37419973994 is preserved in AS-168; this handoff relies on the fresh D-141-head run for Gate C.
- The PR changed-file API returned the complete 52-path set listed below. The changes comprise the accepted D-140 feature, its generated assets and tests, and associated governance records. No unrelated product area was present in that list.
- The local repository history shows d0bf93ee6951279180c97e5d4a10635be6c68339 is included before D-141's publication head. AS-168 independently accepted F001/F002; this Gate C did not alter their implementation.
- GitHub confirmed the normal merge commit, both parents, closed/merged PR state and resulting main SHA.
- No post-merge production runtime verification was performed or required for Gate C.

## Complete PR changed-file set

- app/admin/ContentClient.js
- brain/DECISION_LOG.md
- candidates/v10.1/README.md
- candidates/v10.1/build-report.json
- candidates/v10.1/evidence/harness/serve.mjs
- candidates/v10.1/site/index.html
- candidates/v10.1/site/v101/assets/projects.238cd7b2b5fa.js
- candidates/v10.1/site/v101/assets/projects.f30288d8da5f.js
- coordination/ARCHITECT_REVIEW.md
- coordination/CURRENT_DIRECTIVE.md
- coordination/CURRENT_HANDOFF.md
- coordination/STATE.md
- coordination/archive/directives/DIR-CLINICFLOW-D139-GATE-D-0001.md
- coordination/archive/directives/DIR-CLINICFLOW-D139-GATE-D-0001.provenance.json
- coordination/archive/directives/DIR-WEB-PROJECT-CASE-STUDY-CTA-0001.md
- coordination/archive/directives/DIR-WEB-PROJECT-CASE-STUDY-CTA-0001.provenance.json
- coordination/archive/directives/DIR-WEB-PROJECT-CASE-STUDY-CTA-REM1-0001.md
- coordination/archive/directives/DIR-WEB-PROJECT-CASE-STUDY-CTA-REM1-0001.provenance.json
- coordination/archive/directives/README.md
- coordination/archive/handoffs/H-CLINICFLOW-D138-GATE-C-0001.md
- coordination/archive/handoffs/H-CLINICFLOW-D138-GATE-C-0001.provenance.json
- coordination/archive/handoffs/H-CLINICFLOW-D139-GATE-D-0001.md
- coordination/archive/handoffs/H-CLINICFLOW-D139-GATE-D-0001.provenance.json
- coordination/archive/handoffs/H-WEB-D140-CASE-STUDY-CTA-0001.md
- coordination/archive/handoffs/H-WEB-D140-CASE-STUDY-CTA-0001.provenance.json
- coordination/archive/handoffs/H-WEB-D140-CASE-STUDY-CTA-REM1-0001.md
- coordination/archive/handoffs/H-WEB-D140-CASE-STUDY-CTA-REM1-0001.provenance.json
- coordination/archive/handoffs/README.md
- devos/changes/architect-syncs/ML-DEVOS-AS-165.md
- devos/changes/architect-syncs/ML-DEVOS-AS-166.md
- devos/changes/architect-syncs/ML-DEVOS-AS-167.md
- devos/changes/architect-syncs/ML-DEVOS-AS-168.md
- devos/changes/architect-syncs/README.md
- migrations/0007_project_revisions_case_study_enabled.sql
- public/index.html
- public/v101/assets/projects.238cd7b2b5fa.js
- public/v101/assets/projects.f30288d8da5f.js
- scripts/build-v101-candidate.mjs
- tests/homepage-artifact.test.mjs
- tests/project-case-study.test.mjs
- tests/rfc022-bridge.test.mjs
- tests/v101-candidate.test.mjs
- tests/worker-admin-projects.test.mjs
- tests/worker-rfc022-content.test.mjs
- worker/admin/projects.mjs
- worker/bridge/inject.mjs
- worker/bridge/payload.mjs
- worker/bridge/snapshot.mjs
- worker/d1/projects.mjs
- worker/d1/schema.mjs
- worker/d1/validate.mjs
- worker/projects/case-studies.mjs

## Changed files

This governance return changes only the coordination handoff/state and the required byte-exact outgoing directive archive with provenance/index entry. It makes no product, test, migration, deployment, or runtime change. The governance publication SHA will be reported after exact-tip CAS publication.

## Unresolved findings and limitations

- This Gate C return does not claim that the case-study CTA is active in production or that migration 0007 has been applied remotely.
- GitHub showed a successful Workers Builds status on the PR head. No Worker version promotion or deployment was requested or performed.
- No production runtime, remote D1/R2, DNS, Access, secret, binding, or Cloudflare configuration verification was performed.
- This handoff awaits independent Architect review. All Gate C and production action flags are reset to NO in STATE.

## Governing references

- Owner Decision D-141 and DIR-WEB-D140-GATE-C-0001.
- ML-DEVOS-AS-168, which accepts the D-140 implementation and F001/F002 remediation.
- coordination/OPERATIVE_OBLIGATIONS.md, including the separately gated production release obligation OBL-017.
- Protocol V2: brain/protocols/CONTEXT_BOOTSTRAP.md; Architect routing: brain/protocols/ARCHITECT_SYNC.md; BC-4: ML-DEVOS-RFC-023.

## Evidence locations

- PR #22: https://github.com/Dillaab-source/maisog-labs/pull/22
- Required CI run: https://github.com/Dillaab-source/maisog-labs/actions/runs/37422431585
- Active ruleset: 23740878 main-protection.
- Merge commit: d7d30e7c1d0a894e628fab82dbd8ed380cc878af, parents recorded above.
- Accepted implementation: d0bf93ee6951279180c97e5d4a10635be6c68339.
- Governance publication: parent/tip 0674445d716e4f9b22b3dd73ebd1a699aa1c834e; resulting SHA will be reported after publication.

## Next action

The Architect independently reviews this D-140 Gate C evidence and records the next governed disposition. No Gate D, deployment, remote migration, or production action is requested or authorized by this handoff.
