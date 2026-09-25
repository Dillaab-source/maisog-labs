# Current Handoff — Website Redesign V1 Remediation Cycle 1 (D-076, AS-105)

```yaml
schema_version: 1
handoff_id: H-WEB-REDESIGN-V1-REM1-0001
cycle_id: MAISOGLABS_WEBSITE_REDESIGN_V1_IMPLEMENTATION
input_base_commit: 64a6ad01b3fdc6f86d6d18652099c38abadd0ac6
review_target_commit: 64a6ad01b3fdc6f86d6d18652099c38abadd0ac6
applicable_review_id: ML-DEVOS-AS-105
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation. Every result is `ACTOR_REPORTED`. This is remediation cycle 1 of 2.

## Objective

Correct only the two `ML-DEVOS-AS-105` findings, under scope `D076_AS105_WEBSITE_REDESIGN_V1_REMEDIATION_CYCLE_1_ONLY`:
- `AS105-F001`: evidence-directory scope;
- `AS105-F002`: route-aware skip link.

No other redesign, content, Brand, media or architecture change was made.

Provenance:
- **Starting SHA:** `64a6ad01b3fdc6f86d6d18652099c38abadd0ac6`, the published AS-105 transition. It was published from the verbatim supplied package, and its parent is the implementation tip `c93d7de`.
- **Remediation tip:** the commit that publishes this handoff. Its sole parent is the starting SHA, and it carries the remediation, this handoff and the STATE return gate together.
- **Bootstrap:** a fresh Context Bootstrap from `64a6ad0` before any change.
- **D-068:** the suspended local draft was not touched, staged, committed or imported.

## AS105-F001 — evidence-directory scope (disposition: CORRECTED)

- **Removed from the tracked repository:**
  - `docs/product/evidence/website-redesign-v1/capture-harness.mjs`;
  - `docs/product/evidence/website-redesign-v1/interaction-motion-results.json`.
- **Not relocated:** neither file was moved to any other repository path.
- **README reduced and corrected** (`docs/product/evidence/website-redesign-v1/README.md`). It now states:
  - the browser checks are `ACTOR_REPORTED`;
  - the screenshots are actual local implementation screenshots;
  - the Research screenshots use labelled local fixtures;
  - the harness source and result JSON are not committed.
- **README no longer claims** that a committed harness or results file exists, and it no longer gives re-run instructions against one.
- **What the tracked directory now holds:** the 11 unchanged implementation screenshots and the README.
- **Harness status:** a local, untracked harness was used for this cycle's browser validation.

## AS105-F002 — route-aware skip link (disposition: CORRECTED)

`components/site/SpatialShell.js`:
- **Fixed helper:** `skipTargetFor(route)` returns `surface-<route>-title` only when `route` is in the fixed `ROUTE_IDS` vocabulary, and `main-content` otherwise.
- **Link target:** the skip link's `href` is `#${skipTargetFor(route)}`.
  - **Entry:** keeps the native in-page link to `#main-content`.
  - **Open surface:** the click (or Enter) handler focuses that surface's existing `tabIndex=-1` heading and prevents the default hash change. Changing the hash would otherwise mean Entry.
- **Never inert Entry:** the skip link never targets the inert, `aria-hidden` Entry while a surface is open.
- **Scope:** no new selector capability, route or navigation system was added.

`tests/website-redesign.test.mjs` adds one focused regression test. It extracts the dependency-free `skipTargetFor` from the JSX source and exercises it with the real `ROUTES` and `resolveHash`:
- Entry and non-route hashes give `main-content`;
- every route gives `surface-<route>-title`, never `main-content`;
- hostile non-route values fall back to Entry;
- it asserts that the rendered link, the heading ids / `tabIndex` and the no-hash-change focus handler use the same fixed vocabulary.

**Falsification:** a mutant `skipTargetFor` that always returns `"main-content"` makes this test fail (10 pass, 1 fail). With the code restored, all 11 pass.

`docs/product/UI_UX_SPEC.md`: the one accessibility statement was corrected to describe the route-aware skip link.

## Changed files

Diff against `64a6ad01b3fdc6f86d6d18652099c38abadd0ac6`:
- **Code and tests:** `components/site/SpatialShell.js`, `tests/website-redesign.test.mjs`.
- **Docs:** `docs/product/UI_UX_SPEC.md` (one statement), `docs/product/evidence/website-redesign-v1/README.md`.
- **Deleted:** `docs/product/evidence/website-redesign-v1/capture-harness.mjs`, `docs/product/evidence/website-redesign-v1/interaction-motion-results.json`.
- **Coordination:** `coordination/CURRENT_HANDOFF.md` (this file) and `coordination/STATE.md` (header routing and selector fields only). The outgoing `H-WEB-REDESIGN-V1-IMPL-0001` was archived byte-for-byte by the AS-105 transition.

Nothing else changed:
- no media, including no `public/**` change;
- no other Website Redesign file;
- no dependency, Worker, D1, migration, S6/S7 or D-068 change.

## Tests and evidence

| Command | Result | Exit |
|---|---|---|
| `node --test tests/website-redesign.test.mjs` | 11/11 (10 existing + the AS105-F002 regression) | 0 |
| `npm test` | 863 tests, 863 pass, 0 fail | 0 |
| `npm run build` | compiled; static pages `/`, `/journal`, `/admin`, `/_not-found` | 0 |
| `git diff --check` | clean | 0 |
| `node devos/schemas/validate-devos-manifest.mjs` | `PASS: 0 error(s)` | 0 |
| `node devos/capabilities/validate-capability-policy.mjs` | all examples as expected | 0 |
| `node devos/contracts/validate-task-contract.mjs` | `PASS: 15/15` | 0 |
| `node devos/governance/registry/validate-rules.mjs` | `PASS: 0 error(s)` | 0 |
| `node devos/governance/registry/validate-waivers.mjs` | no waiver files (expected) | 0 |
| `node scripts/validate-claude-skills-bridge.mjs` | all bridges OK | 0 |
| `node devos/governance/traceability/validate-traceability.mjs` | 2 errors (`CORE-022`, `WEB-REQ-009`), 14 warnings, `DRIFT`. The ERROR/WARNING set is identical to the AS-105 base `64a6ad0`. The index was not regenerated (outside the authorized paths; unchanged traceability-debt disclosure) | 1 |
| Local untracked browser harness against the built `out/` | 76/76 (the previous 72 plus 4 skip-link checks) | 0 |

Platform: Linux x86_64, Node v22.22.2, Chromium 141.0.7390.37, Playwright 1.56.1 (environment-global; no repository dependency).

### Browser skip-link evidence (ACTOR_REPORTED)

In each case the harness pressed Tab from the document start, confirmed the focus was on `.skip-link`, and pressed Enter:

| Case | `href` | Resulting focus / state | Pass |
|---|---|---|---|
| Entry, desktop 1440×900 | `#main-content` | hash `#main-content`; `main#main-content` visible, not `inert`, not `aria-hidden`; no surface open | ✓ |
| Open surface, desktop (`#systems`) | `#surface-systems-title` | focus on `surface-systems-title`, visible, with no `inert`, `aria-hidden` or `hidden` ancestor; hash stays `#systems`; Systems stays open | ✓ |
| Open surface, mobile 390×844 (`#contact`) | `#surface-contact-title` | focus on `surface-contact-title`, visible, with no hidden ancestor; hash stays `#contact`; Contact stays open | ✓ |
| Entry, mobile | `#main-content` | as on desktop Entry | ✓ |

All 72 earlier interaction, keyboard, focus, mobile, WEB-INC-007, Journal, motion, overflow, runtime and `/journal` regression checks still pass on the remediated build.

## Unresolved findings and limitations

- `AS105-F001` and `AS105-F002`: corrected (above). No finding is knowingly left open.
- **MEDIA_GAP (unchanged):**
  - `plate-hero-v4.png`, `logo-mark.mp4` and the poster are still not installed;
  - the existing static environment and canonical SVGs are still used;
  - no media was generated or altered (`MEDIA_MUTATION_AUTHORIZED: NO`).
- **Traceability debt (unchanged):** `CORE-022` and `WEB-REQ-009`, plus the pre-existing index `DRIFT`. Regeneration is not authorized.
- **Skip-link test method:** the regression test verifies `skipTargetFor` by extracting its source, because the shell is a JSX client component. It also asserts the wiring by source inspection. The runtime behaviour is covered by the ACTOR_REPORTED browser check.
- **Carried forward unchanged:** the remaining limitations disclosed in the archived `H-WEB-REDESIGN-V1-IMPL-0001`:
  - visual fidelity to v10 is unverified;
  - the spatial copy is local static only;
  - Tab order versus reordered triggers;
  - no no-JS route fallback;
  - unused legacy components and content fields;
  - header icon legibility;
  - no automated accessibility audit;
  - Chromium-only headless evidence with fixture Journal states.
- **Obligations:** every `coordination/OPERATIVE_OBLIGATIONS.md` row is carried forward, none closed. S6 remains parked at `ML-DEVOS-AS-103`.

## Evidence locations

- The commit diff against `64a6ad01b3fdc6f86d6d18652099c38abadd0ac6`.
- `components/site/SpatialShell.js` (`skipTargetFor`, `onSkip`, the skip-link element).
- `tests/website-redesign.test.mjs` (the AS105-F002 regression test).
- `docs/product/evidence/website-redesign-v1/README.md` and `screenshots/`.
- `docs/product/UI_UX_SPEC.md` (Accessibility — Website Redesign V1).
- The archived previous handoff: `coordination/archive/handoffs/H-WEB-REDESIGN-V1-IMPL-0001.md`.

## Governing references

- **Authority:** `D-076`.
- **Review:** `ML-DEVOS-AS-105` (controlling), `ML-DEVOS-AS-104`.
- **Plan:** `docs/product/WEBSITE_REDESIGN_V1_PLAN.md`.
- **Protocol:** `brain/protocols/CONTEXT_BOOTSTRAP.md`.

## Next action

The Architect independently reviews this remediation under the next unused immutable Architect Sync ID after `ML-DEVOS-AS-105`. No further Builder action is authorized. Deployment remains unauthorized.
