# Current Directive — D-129 homepage copy (two strings)

```yaml
schema_version: 1
directive_id: DIR-WEB-D129-HOMEPAGE-COPY-0001
cycle_id: MAISOGLABS_WEB_D129_HOMEPAGE_COPY
issue_parent_commit: bffd020d1b2357b161fd0ee6b924b2f93d06edc2
target_turn: CLAUDE
authority_ref: D-129
applicable_review_id: ML-DEVOS-AS-156
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-129 and `ML-DEVOS-AS-156`. Claude/Builder prepared it as mechanical publisher of D-129, as for D-125, D-127 and D-128.

## Objective

Apply exactly the two D-129 homepage copy edits at the canonical V10.1 source level, regenerate the derived assets through the existing V10.1 build path, verify the result on desktop (1440×900, 1280×720), and return a repository-local candidate. No merge or deploy.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; every action flag is `NO`.
- Read-only discovery at `bffd020`, before issue:
  - The rendered Entry view is `public/v101/assets/entry.7995859f655d.js`. `design-system.c349f854986d.js` carries an earlier duplicate `window.Entry`, which `entry.js` overwrites at load.
  - Both strings are code-owned literals (no D1/admin/`site_settings` ownership).
  - V10.1 is defined by `scripts/build-v101-candidate.mjs`: the canonical V10 artifact (SHA-256 `2417f7e5…`, recoverable byte-exact at `f2c13aa:public/index.html`) plus exact-match patches.
  - `public/` holds byte copies of `candidates/v10.1/site/`.

## Governing references

- **T0:** D-129; live STATE; `ML-DEVOS-AS-156`.
- **T1:** D-126 (still in force except for the two strings); D-120/D-121 and `candidates/v10.1/README.md` (build path); `ML-DEVOS-RFC-022`, `worker/bridge/inject.mjs`; `ML-DEVOS-AS-150` (a homepage copy change needs a new fingerprinted entry asset, index reference, `ARTIFACT_SHA256`, affected tests, atomic consistency); `OBL-023`.

## Exact execution scope

Allowed:
- **Source.** `scripts/build-v101-candidate.mjs`: two new exact-match patches in the Entry panel patch, plus the minimal input change needed to read the pinned V10 artifact, whose SHA-256 is still verified.
- **Build outputs.** Regenerate `candidates/v10.1/site/` and `build-report.json` with the locked toolchain (`npm ci`, esbuild 0.28.1), then promote byte copies to `public/`. Only direct build outputs of the two edits may change: the new entry asset, the index reference and the resulting hashes.
- **Pinned constants that follow mechanically from the new index hash.** `worker/bridge/inject.mjs` `ARTIFACT_SHA256`; the pinned hash in `tests/homepage-artifact.test.mjs` and `tests/v101-candidate.test.mjs`; the `candidates/v10.1/README.md` table.
- **Evidence.** Screenshots and a browser report under `candidates/v10.1/evidence/d129/`.
- One Protocol V2 Builder return.

Not allowed: editing a hashed bundle by hand; the parked prototype; the `design-system` duplicate or any other string (including the closing "Humanity orbits higher."); bridge logic, `INSERTION_OFFSET`, the data script or project payload; D1/R2; merge/PR merge; deploy; mobile; Tier 2; governance.

## SENTINEL Sync

- **Authority:** D-129 (Paulo), after `ML-DEVOS-AS-156`.
- **Context:** V2.1 is frozen; D-126 parked homepage copy, and D-129 lifts that deferral for two strings only.
- **Capability:** repository build, local static serving and headless Chromium. No Cloudflare, D1 or production access is used.
- **Evidence:** determinism check (rebuild without the new patches reproduces the current bytes), diffs, hashes, tests, screenshots.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **D-126 vs D-129:** resolved by D-129's narrow supersession.
- **"Only direct build outputs" vs the pinned hash constants:** RFC-022 pins the served index bytes; AS-150 anticipated this. The constant and pin updates are mechanical, not bridge architecture. If `INSERTION_OFFSET`, the data script or bridge logic would need to change, stop and return to the Architect.

## Instructions

1. Bootstrap. Install the locked dependencies.
2. Prove the build path: rebuild from the pinned V10 artifact without the new patches, and confirm it is byte-identical to the current `candidates/v10.1/site/` and `public/`.
3. Add the two patches; rebuild; promote; update the pinned constants.
4. Run the tests; serve locally; verify the 13 D-129 desktop checks at 1440×900 and 1280×720, with screenshots, both raw and with the bridge splice.
5. Publish the return.

## Validation and evidence

D-129 § Desktop verification and § Return in full.

## Stop conditions

- The strings are not source-owned.
- The build path does not reproduce the current bytes.
- Any change beyond the entry asset, its index reference and the derived hashes and pins.
- The copy does not fit cleanly on desktop.
- A substantive RFC-022 change would be needed.

## Next action

Publish `H-WEB-D129-HOMEPAGE-COPY-0001`. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.
