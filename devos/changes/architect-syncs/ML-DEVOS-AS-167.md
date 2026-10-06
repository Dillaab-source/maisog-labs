# D-140 Architect Disposition — Bounded Remediation

Architect Sync: ML-DEVOS-AS-167
Status: CHANGES_REQUESTED
Cycle: MAISOGLABS_PROJECT_CASE_STUDY_CTA
Authority: D-140 and DIR-WEB-PROJECT-CASE-STUDY-CTA-0001
Prior review: ML-DEVOS-AS-166
Reviewed handoff: H-WEB-D140-CASE-STUDY-CTA-0001
Review target: edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca
Governance publication parent: 05da7b800018ae3fc38c37e61766bc3dfea4faf1
Protocol: PROTOCOL_VERSION 2

**Repository:** `Dillaab-source/maisog-labs`

**Governance branch:** `governance/maisoglabs-v0.1`

**Last verified governance tip:** `05da7b800018ae3fc38c37e61766bc3dfea4faf1`

**Implementation under review:** `edcba8ee0dd110cc06c4b9fc13e856fe1a9d20ca`

**Verdict:** CHANGES_REQUESTED

**SENTINEL:** CLEAR_WITH_NOTES

**SU:** BOUNDED_CONTRADICTION — TWO REQUIRED CORRECTIONS

### Finding F001 — Generic CTA rendering

`scripts/build-v101-candidate.mjs` currently hard-codes `cp.slug === 'clinicflow'`.

Remove the ClinicFlow-specific rendering condition.

Use generic rendering for any valid, enabled, server-approved case-study project.

Future projects should require registering their case-study route and enabling the admin checkbox, not rewriting the ProjectsPanel.

Preserve the code-owned registry and server-side restrictions.

### Finding F002 — Browser bridge validation

`worker/bridge/inject.mjs` must validate the newly introduced project fields before applying a project group:

- Valid bounded slug.
- Strict boolean `caseStudyEnabled`.
- Enabled slugs must be in the code-owned approved registry.
- Malformed or unregistered enabled values trigger whole-group fallback.
- No arbitrary URLs or destination overrides.

Avoid introducing an independently maintained allowlist that can drift from the shared registry.

### Verified evidence

GitHub Actions CI run `37413022630` passed on the exact implementation commit:

- 989 tests
- 988 passed
- 0 failed
- 1 skipped
- `npm run build` successful

The reported Windows failures are not independent CI failures.

### Execution instructions

1. Fresh Protocol V2 bootstrap and exact-tip verification.
2. Mechanically publish the Architect disposition and an appropriately bounded remediation directive using BC-4 and exact-tip CAS.
3. Route the approved remediation to the Builder under the existing D-140 authority.
4. Fix F001 and F002 only.
5. Add regression tests for a hypothetical second registered case study and malformed bridge payloads.
6. Regenerate fingerprinted assets and artifact identity through the existing deterministic builder.
7. Run the complete test suite, build, and desktop/mobile previews.
8. Return the corrected implementation for Architect review.

No unrelated changes.

**NOT AUTHORIZED:**

- Main merge
- Production deployment
- Remote D1 migration
- R2 or Cloudflare production changes
- Protocol V2.2 changes

Do not exceed the existing remediation limit.

After successful remediation, return:

`TURN: ARCHITECT`

`STATUS: READY_FOR_ARCHITECT`

All production and release authorization flags remain `NO`.

**Priority: finish these two corrections in one bounded pass, then stop.**
