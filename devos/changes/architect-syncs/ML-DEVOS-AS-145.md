# Architect Review — V10.1 desktop candidate (D-120)

Architect Sync: ML-DEVOS-AS-145
Status: ACCEPTED — V10.1 DESKTOP CANDIDATE
Cycle: MAISOGLABS_WEB_RFC022_CBR
Authority: D-120 / ML-DEVOS-AS-144
Prior review: ML-DEVOS-AS-144
Reviewed handoff: H-WEB-V101-DESKTOP-CANDIDATE-0001
Reviewed return commit: 67b1d026f03d2ade1a1a621d1bb0310f10a64f96
Candidate artifact: `candidates/v10.1/site/index.html`
Candidate SHA-256: `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`
Main: 405375998392e936b71181de387ae395b7d46e40
Protocol: PROTOCOL_VERSION 2

Provenance: this is the Architect's verdict, relayed by Paulo and published mechanically by Claude/Builder. The Builder did not author this review. Committed text proves provenance, not authority.

## Verdict

ACCEPTED.

The D-120 V10.1 desktop remediation candidate is accepted with no blocking findings and no remediation cycle required. D-120 is satisfied and closed.

## Accepted findings

1. **Scope compliance — PASS.**
   - Research dead affordances were removed as authorized.
   - Contact changes are presentation-only; no email or `site_settings` mutation occurred.
   - Document/accessibility and static SEO work remain within D-120.
   - Runtime hardening remained bounded and did not replatform V10.
   - Fingerprinted-asset caching is appropriately scoped.
2. **Canonical-artifact boundary — PASS.**
   - `public/index.html` remains the D-093 canonical artifact with SHA-256 `2417f7e5…`.
   - Production Worker/bridge constants remain unchanged.
   - No production deployment, D1/R2 mutation, activation, publication, Access/DNS/config mutation, Gate C or `main` merge occurred.
3. **Runtime hardening — PASS.**
   - Browser-side Babel and the self-unpacking wrapper are removed from the candidate.
   - React/ReactDOM use the production 18.3.1 runtime.
   - JSX is precompiled.
   - The candidate is materially smaller while preserving the V10 experience.
   - The committed candidate is deterministic under the reported build environment.
4. **Desktop functional evidence — PASS at the authorized evidence level.**
   - Reported full suite: 958/958.
   - Reported Next build: green.
   - Headless Chromium checks at 1440×900 and 1280×720 cover entry, Systems, five-project navigation, Research filters, Contact, keyboard focus, overflow, metadata and console behavior.
   - Runtime/browser execution evidence remains `ACTOR_REPORTED`, local. Architect acceptance does not reclassify it as independently reproduced runtime evidence.
5. **RFC-022 compatibility — PASS WITH RELEASE CONDITION.**
   - The MLData/content seam remains compatible.
   - The candidate keeps a script-free head and provides a deterministic insertion point.
   - The current bridge constants intentionally continue to pin V10.

## Mandatory promotion invariant

The candidate artifact, `ARTIFACT_SHA256`, `ARTIFACT_LENGTH`, `INSERTION_OFFSET`, and affected artifact/bridge tests must be changed atomically in the same governed promotion change. Replacing the homepage artifact alone is prohibited.

## Non-blocking notes

- esbuild 0.28.1 is supplied transitively through the locked Wrangler dependency rather than as a direct dependency. This does not block acceptance because the candidate itself is content-addressed and committed. Promotion should use the exact accepted candidate bytes. A later rebuild under a different toolchain must not silently redefine the accepted artifact.
- Mobile remains explicitly deferred.
- Additional Firefox/WebKit/real-device coverage is useful future evidence but was not required by D-120 and does not block this desktop candidate.
- `og:image` remains deferred until an image is explicitly approved.
- Existing AS132-F002 / AS132-F003 obligations remain unchanged.

## Governance disposition

No remediation directive is issued. Do not promote V10.1 under D-120.

Do not:
- replace `public/index.html`;
- change the bridge constants;
- merge to `main`;
- perform Gate C or Gate D;
- deploy;
- publish or activate projects;
- mutate contact or `site_settings`;
- perform mobile remediation.

All action-specific authorization flags remain `NO`.

## Next owner decision

Whether to promote the exact accepted candidate SHA-256 `220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc`.

If Paulo authorizes promotion, the next bounded directive must bind that exact artifact and require the artifact replacement + RFC-022 constants + affected tests to move atomically before Gate C. Deployment/Gate D remains a separate authorization unless Paulo explicitly includes it.

## Transition

Archive `H-WEB-V101-DESKTOP-CANDIDATE-0001` and clear review routing. No implementation or production mutation is authorized by AS-145.

Route:

TURN: PAULO

STATUS: PAULO_DECISION_REQUIRED

AUTHORIZED_SCOPE: V101_DESKTOP_PROMOTION_DECISION_ONLY
