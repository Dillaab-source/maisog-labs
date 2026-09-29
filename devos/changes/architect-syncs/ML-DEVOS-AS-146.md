# Architect Review — V10.1 promotion preparation (D-121)

Architect Sync: ML-DEVOS-AS-146
Status: ACCEPTED — V10.1 PROMOTION PREPARATION
Cycle: MAISOGLABS_WEB_RFC022_CBR
Authority: D-121 / ML-DEVOS-AS-145
Prior review: ML-DEVOS-AS-145
Reviewed handoff: H-WEB-V101-PROMOTION-PREP-0001
Reviewed commit: 49984e74bdc4109f431bdc24248f7a9bb000dcff
Input D-121 publication: ab1720fd5d8dedd18b284d11ad14d9ad6eadd545
Main: 405375998392e936b71181de387ae395b7d46e40
Protocol: PROTOCOL_VERSION 2

Provenance: this is the Architect's verdict, relayed by Paulo and published mechanically by Claude/Builder. The Builder did not author this review. Committed text proves provenance, not authority.

## Verdict

ACCEPTED.

The D-121 V10.1 promotion-preparation change satisfies the mandatory AS-145 atomic-promotion invariant. No remediation cycle is required. D-121 is satisfied and closed.

## Architect verification

1. **Atomicity — PASS.** `ab1720fd5d8dedd18b284d11ad14d9ad6eadd545..49984e74bdc4109f431bdc24248f7a9bb000dcff` contains exactly one commit. That commit contains together:
   - the accepted V10.1 homepage artifact;
   - the `/v101/` fingerprinted assets;
   - `robots.txt`; `sitemap.xml`; `_headers`;
   - all three RFC-022 artifact identity values;
   - the affected homepage, bridge and candidate tests;
   - the bounded governance return.

   The prohibited partial-artifact promotion did not occur.
2. **Exact accepted artifact — PASS.** `public/index.html` and `candidates/v10.1/site/index.html` resolve to the same Git blob. Accepted identity remains:
   - SHA-256: `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`;
   - length: `20857`;
   - insertion offset: `20116`.

   The promoted SEO files also resolve byte-identically to their accepted candidate counterparts. Representative promoted runtime assets independently checked by the Architect likewise resolve to the same Git blobs as their accepted candidate copies.
3. **RFC-022 artifact binding — PASS.** `worker/bridge/inject.mjs` pins:
   - `ARTIFACT_SHA256 = 220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`;
   - `ARTIFACT_LENGTH = 20857`;
   - `INSERTION_OFFSET = 20116`.

   The artifact and bridge constants therefore describe the same accepted bytes. The bridge mechanism itself was not widened.
4. **Test changes — PASS.** The test changes preserve rather than weaken the important invariants:
   - D-093 ZIP provenance remains pinned;
   - the promoted artifact must equal the accepted candidate;
   - fingerprinted assets must exist and correspond to their fingerprints;
   - the RFC-022 hook is exercised against the promoted page's actual MLData script;
   - the candidate test binds promoted files and bridge constants back to the accepted candidate.

   Reported execution evidence remains: `npm test` 958/958 pass; build green; local Chromium verification PASS at 1440×900 and 1280×720. Runtime/browser execution remains `ACTOR_REPORTED`, local. Architect acceptance does not reclassify it as independent production evidence.
5. **Scope and production boundary — PASS.** No production mutation occurred. No `main` merge; Gate D; Worker deployment; traffic change; production D1/R2 mutation; project publication or activation; contact or `site_settings` mutation; Access/DNS/binding/secret/environment mutation; schema/migration change; mobile remediation.

   `main` remains `405375998392e936b71181de387ae395b7d46e40`. The governance branch is `49984e74bdc4109f431bdc24248f7a9bb000dcff`. Production therefore remains on the previously deployed V10 release until separately authorized Gate C and Gate D operations occur.

## Non-blocking findings

1. `scripts/build-v101-candidate.mjs` now fails safely because its V10 source is no longer `public/index.html`. This is acceptable and preferable to silently regenerating the accepted artifact. Repairing the historical build path is separate follow-up work.
2. The stale descriptive comment in `worker/bridge/payload.mjs` is documentation debt only and does not affect runtime behavior.
3. Firefox, WebKit, real-device and live-D1 browser verification remain absent. These were not D-121 requirements and do not block Gate C.
4. Mobile and `og:image` remain deferred.
5. The pre-existing traceability errors/DRIFT remain carried forward; D-121 introduced no new traceability finding.

## Gate C readiness

The repository change is ready for a separately authorized Gate C.

- Gate C must use a fresh release pull request from `governance/maisoglabs-v0.1` to `main`, and must bind the exact reviewed head `49984e74bdc4109f431bdc24248f7a9bb000dcff`.
- Do not use PR #10. PR #10 remains the Sentinel handoff channel and must not be merged.
- The current `main-protection` ruleset requires the pull-request merge path and a successful `test-and-build`. Gate C must therefore require fresh CI success on the exact final PR head and clean mergeability before merging.
- Any head movement invalidates the Gate C binding and requires stopping for review.
- Gate C remains merge-only. It must not deploy or shift production traffic.

## Governance disposition

No remediation directive is issued. Archive `H-WEB-V101-PROMOTION-PREP-0001` and clear Architect-review routing. All action flags remain `NO`.

The next owner decision is whether to authorize Gate C for exact reviewed head `49984e74bdc4109f431bdc24248f7a9bb000dcff` against the current `main` `405375998392e936b71181de387ae395b7d46e40`. Gate D / deployment remains separate and is not authorized by AS-146.

## Transition

Route:

TURN: PAULO

STATUS: PAULO_DECISION_REQUIRED

AUTHORIZED_SCOPE: V101_GATE_C_DECISION_ONLY
