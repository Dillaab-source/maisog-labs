# Architect Review — MaisogLabs V10-A Public Visual Baseline

Architect Sync: ML-DEVOS-AS-119
Status: PAULO_DECISION_REQUIRED — V10-A ACCEPTANCE BLOCKED
Cycle: MAISOGLABS_WEB_V10_A
Authority: D-090
Prior review: ML-DEVOS-AS-118
Reviewed handoff: H-WEB-V10-A-0001
Reviewed exact governance tip: 9a67a2b2fa53b002ccec6cd11692d843da1dbc87
Implementation base: 2986489cecf4b78f42953313686513cb06cdc69d
Implementation tip: 9a67a2b2fa53b002ccec6cd11692d843da1dbc87
Main baseline: aebc881e8890c00090d714602591138a045bd3b0
Protocol: PROTOCOL_VERSION 2
Review mode: CHANGE REVIEW

## Verdict

`READY TO COMMIT: NO`

The production build, focused V10 checks, content/D1 compatibility, and supplied asset hashes reproduce. Acceptance is nevertheless blocked by an exact D-090 scope violation and incomplete RFC-021 evidence and validation. Correcting the unlisted file requires Paulo's bounded authorization before an implementation directive can be issued.

## SENTINEL sync

| Plane | Result |
| --- | --- |
| Authority | D-090 and RFC-021 remain controlling; no later authority expands the implementation surface. |
| Context | Protocol V2 bootstrap passed at the exact reviewed tip; the handoff is valid evidence but cannot expand scope. |
| Capability | The Builder may not resume until Paulo authorizes a bounded corrective cycle and the Architect issues a new directive. |
| Execution | Build and focused checks reproduce, but the full required validation matrix is not green. |
| Evidence | Asset hashes reproduce; visual, accessibility, parity, and runtime-network evidence are incomplete. |
| Risk | Exact-scope drift, non-authoritative Journal imagery, and unproven acceptance criteria block V10-A acceptance. |

Disposition: `BLOCKED_PENDING_OWNER_DECISION`.

## AS119-F001 — Exact D-090 implementation surface exceeded

D-090 authorized exact app files including `app/layout.js`, `app/page.js`, `app/globals.css`, and `app/DesignRuntime.js`. The implementation added `app/v10.css` and imported it from `app/layout.js`; that file is outside the exact authorized surface.

Recommended correction: move required rules into the already-authorized `app/globals.css`, remove the import, and delete `app/v10.css`. This is prospective corrective authority, not a retroactive redefinition of D-090. Because deletion also touches the unlisted file, Paulo must authorize this bounded cleanup.

## AS119-F002 — RFC-021 visual and accessibility acceptance evidence incomplete

The evidence set contains three screenshots: Entry and Projects at 1440×900, and Systems at 500×900. RFC-021 requires more, including:

- Entry and every panel at 1440×900 and 390×844;
- Still mode and fixed-timestamp Full mode;
- pinned-reference side-by-side evidence and per-pixel comparison against the stated threshold;
- a divergence register;
- contrast evidence and an automated accessibility audit with zero serious or critical findings;
- a runtime network assertion for the accepted surface.

The supplied evidence does not satisfy that acceptance record.

## AS119-F003 — Research imagery contradicts RFC-021 R4

`components/site/ResearchSurface.js` cycles fixed local plate images as Journal-entry thumbnails. RFC-021 R4 requires Research images to come from real Journal media. The current public Journal contract exposes media metadata but no authorized public object-serving route.

For V10-A, omit those thumbnails. Do not expand this correction into backend, API, D1, R2, or production-data work.

## AS119-F004 — Required validation matrix is not satisfied

Independently reproduced:

- production build: pass, including static `/`, `/admin`, and `/journal` output;
- focused V10, theme, overlay, and redesign tests: 25/25 pass;
- content and D1 compatibility tests: 46/46 pass;
- asset and screenshot hashes: match their manifests and source copies.

Not satisfied:

- the full `npm test` command exits non-zero, including Windows-refused S6 checks, child fixtures that cannot find Git under an empty environment, and skill/frontmatter checks;
- the V10 tests do not cover the complete F1 404/500/malformed/invalid matrix, every listed clamp input, every allowed and unknown ignored-field value, or monotonicity for every integer from 40 through 85.

Run the complete suite in the supported Linux/CI environment after the bounded corrections. If it remains non-green for pre-existing issues, return the exact failures for an owner disposition; the Architect cannot convert a required pass into a waiver.

## SU contradiction check

Mode: `BOUNDED_CONTRADICTION`.

- The handoff reports completion, but exact-scope and acceptance requirements are not complete.
- Narrow focused tests passing does not establish the full validation contract.
- Three screenshots do not establish full responsive and mode parity.
- Fixed local assets being safe and hashed does not make them authoritative Journal media.
- Characterizing full-suite failures as pre-existing does not turn a required pass into a pass.

No external research is required for this determination; repository authority and reproduced evidence are sufficient. SU disposition: `BLOCKED`.

## Evidence classification

Reproduced evidence includes the Protocol V2 bootstrap, commit identities, production build, focused V10 tests, content/D1 compatibility tests, repository diffs, file surfaces, and asset/evidence hashes. Browser captures and narrative claims in the handoff are actor-reported unless explicitly listed above as independently reproduced.

## Operative risks and held gates

- The AS-116 production `/api/design` and `/api/journal` 500/1101 incident remains open and separate.
- S6 remains parked at ML-DEVOS-AS-103; O1 and O2 remain open.
- D-068 remains held.
- PR #7 and PR #10 remain unmerged.
- V10-B, V2B, API diagnosis/fix, theme publication, main merge, and deployment remain unauthorized.
- README, ARCHITECTURE, and some comments still describe V3/V4; this is owner-visible follow-up outside D-090, not authority to expand this correction.

All action-specific authorization flags remain `NO`.

## Owner decision required

Recommended decision: authorize remediation cycle 1 only to:

1. consolidate required V10 CSS into `app/globals.css`, remove the import, and delete `app/v10.css`;
2. remove fixed Journal-entry imagery from `components/site/ResearchSurface.js` without adding a backend route;
3. add the missing D-090/RFC-021 tests and complete the visual, accessibility, parity, divergence, and runtime-network evidence;
4. return through a new Protocol V2 Builder handoff for Architect re-review.

No broader implementation, service, data, merge, or deployment authority is implied.

## Transition

AS-119 is published and the reviewed handoff is archived. No implementation directive is issued. The cycle routes to Paulo with remediation cycle 0 retained and all action flags `NO`.

## Routing

- `TURN: PAULO`
- `STATUS: PAULO_DECISION_REQUIRED`
- `AUTHORIZED_SCOPE: AS119_D090_V10_A_CORRECTIVE_SCOPE_DECISION_ONLY`
- `ARCHITECT_ACTION_REQUIRED: NO`
- `IMPLEMENTER_ACTION_REQUIRED: NO`
- `PAULO_DECISION_REQUIRED: YES`
- `CURRENT_HANDOFF: NONE`
- `CURRENT_DIRECTIVE: NONE`
