# Builder Handoff — D-140 F001/F002 bounded remediation

```yaml
schema_version: 1
handoff_id: H-WEB-D140-CASE-STUDY-CTA-REM1-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
input_base_commit: d0bf93ee6951279180c97e5d4a10635be6c68339
review_target_commit: d0bf93ee6951279180c97e5d4a10635be6c68339
applicable_review_id: ML-DEVOS-AS-167
```

This handoff records implementation evidence. Routing and authority remain in `coordination/STATE.md`.

## Objective

Return D-140 remediation cycle 2 for independent Architect review. Address only AS-167 F001 and F002. No main merge, deployment, remote migration, or production mutation occurred.

## Changed files

Implementation commit `d0bf93ee6951279180c97e5d4a10635be6c68339` changed:
- `candidates/v10.1/README.md`
- `candidates/v10.1/build-report.json`
- `candidates/v10.1/site/index.html`
- `candidates/v10.1/site/v101/assets/projects.05aad04529b5.js` (removed)
- `candidates/v10.1/site/v101/assets/projects.238cd7b2b5fa.js` (added)
- `public/index.html`
- `public/v101/assets/projects.05aad04529b5.js` (removed)
- `public/v101/assets/projects.238cd7b2b5fa.js` (added)
- `scripts/build-v101-candidate.mjs`
- `tests/homepage-artifact.test.mjs`
- `tests/rfc022-bridge.test.mjs`
- `tests/v101-candidate.test.mjs`
- `worker/bridge/inject.mjs`

The Builder return publication will also update `coordination/CURRENT_HANDOFF.md` and `coordination/STATE.md`, and archive the outgoing directive with provenance/index updates.

## Tests and evidence

- Governance: AS-167 and `DIR-WEB-PROJECT-CASE-STUDY-CTA-REM1-0001` were published by Protocol V2 exact-tip CAS at `cf085b4ac5b25c4acd6adc1fab0132386a6cef82`. The implementation commit is its single child and was published by the checker’s exact-tip CAS. Remediation cycle is 2 of 2.
- F001: the deterministic ProjectsPanel patch no longer compares `cp.slug` to `clinicflow`; it renders the existing semantic CTA for a true enabled flag and string slug. The browser bridge validates server-published data before it reaches the panel.
- F002: the browser hook derives its approved slug list from `worker/projects/case-studies.mjs`. It independently enforces bounded slug syntax (1–80 characters, lowercase leading letter and lowercase alphanumeric/hyphen remainder), a strict boolean `caseStudyEnabled`, and shared-registry membership for enabled slugs. Invalid values preserve the existing whole-project-group fallback. No URL/destination field or override is accepted.
- Regression coverage: focused bridge, project case-study, artifact, and candidate tests passed 33/33. The bridge test accepts a hypothetical second registry-approved slug and rejects malformed/overlong slugs, non-boolean values, and an enabled unregistered slug; a bad member in a multi-project group leaves the full prior group intact. The candidate test asserts no ClinicFlow-only condition in the generated ProjectsPanel bundle.
- `npm run build`: passed; static output includes `/admin`, `/journal`, and `/projects/clinicflow`.
- Full `npm test`: completed with exit code 1. Failures are in unchanged Windows-sensitive DevOS process/filesystem/Git fixture tests and skill-frontmatter checks that assume LF bytes. The new bridge and artifact tests passed. No changed file belongs to those failing subsystems.
- Desktop preview, 1440×900: ClinicFlow panel and `VIEW CASE STUDY →` are visible; href is `/projects/clinicflow`; project selector/pager remain available; document width equals viewport width.
- Narrow preview, 390×844: CTA is legible and fits between tags and flow figure; document width and client width are both 390. Existing top navigation clipping remains visible at this width.
- Functional preview: clicking the CTA loaded `/projects/clinicflow` from the local harness. Eternal Eggs has no CTA. The disabled ClinicFlow preview has no CTA.
- Artifact identity: homepage SHA-256 `7598a6c87fcdf7a80533dea697fc59d19e5400af59f6cd722297c373563fc283`, 20,857 bytes; bridge insertion offset remains 20,116. Projects asset `projects.238cd7b2b5fa.js`, SHA-256 `238cd7b2b5fa9a02f6d909f959ccbbd99ea05077de0c82915f0d336de950fad4`, 4,832 bytes; previous D-140 asset was `projects.05aad04529b5.js`, 4,830 bytes. Candidate and `public/` copies match byte-for-byte.
- No source outside F001/F002 and the required generated asset identity was changed. Production D1/R2, Cloudflare, DNS, Access, secrets, bindings, ClinicFlow runtime/workflows, main, PRs, and deployment were untouched.

## Unresolved findings and limitations

- Full `npm test` is not green in this Windows environment for the unrelated failures listed above. Architect should retain this evidence limitation; the supplied CI success applies to the pre-remediation implementation commit.
- Narrow preview retains the existing clipped top navigation; the CTA itself introduces no horizontal document overflow.
- This is a local implementation candidate only. No production preview, migration, release, merge, or deployment was performed.
- D-140 remediation cycle 2 of 2 is consumed. Any further remediation requires the applicable Owner authorization; do not autonomously start another cycle.

## Governing references

- D-140 and `DIR-WEB-PROJECT-CASE-STUDY-CTA-0001`.
- `ML-DEVOS-AS-167`, findings F001 and F002.
- `coordination/OPERATIVE_OBLIGATIONS.md`, including OBL-017, OBL-019–021, and OBL-023–026.
- Protocol V2: `brain/protocols/CONTEXT_BOOTSTRAP.md` and `brain/protocols/ARCHITECT_SYNC.md`.

## Evidence locations

- Implementation diff: `d0bf93ee6951279180c97e5d4a10635be6c68339` on `governance/maisoglabs-v0.1`.
- Deterministic build report and assets: `candidates/v10.1/build-report.json`, `candidates/v10.1/site/`, and matching `public/` files.
- Bridge regression and artifact checks: `tests/rfc022-bridge.test.mjs`, `tests/project-case-study.test.mjs`, `tests/homepage-artifact.test.mjs`, and `tests/v101-candidate.test.mjs`.
- Local desktop and narrow previews were reproduced using `candidates/v10.1/evidence/harness/serve.mjs` and the Codex in-app browser.

## Next action

The Architect independently reviews implementation commit `d0bf93ee6951279180c97e5d4a10635be6c68339`, the stated evidence, and the full-suite limitation, then records a new immutable Sync. No further Builder remediation is authorized autonomously. Keep all production and release flags NO.
