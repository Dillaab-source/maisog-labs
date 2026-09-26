# Current Directive — V10 Controlled Clean Replacement

```yaml
schema_version: 1
directive_id: DIR-WEB-V10-CLEAN-0001
cycle_id: MAISOGLABS_WEB_V10_CLEAN
issue_parent_commit: 146f645390fd24099426c3cb8ab8a511eafb12db
target_turn: CLAUDE
authority_ref: D-092
applicable_review_id: ML-DEVOS-AS-119
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-092, D-088, and this directive.

## Objective

Replace the public website presentation with a faithful implementation of the V10 reference (`design-references/claude-v10/source/Maisog Labs Home v10.dc.html`, SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`) carrying the D-088 facts, preserve all backend/runtime infrastructure, verify locally, and obtain a non-production Cloudflare preview through the existing Workers Builds branch build.

## Preconditions

- Protocol V2 bootstrap from the exact tip that publishes this directive.
- D-092, this directive ID and scope `D092_V10_CLEAN_REPLACEMENT_PREVIEW_ONLY` are selected together; `MUTATION_AUTHORIZED: YES`; every other action flag `NO`.
- Rollback branch `snapshot/pre-v10-clean-replacement` resolves to `146f645390fd24099426c3cb8ab8a511eafb12db`.
- `main` remains `aebc881e8890c00090d714602591138a045bd3b0`.

## Governing references

- **T0:** Protocol V2; D-092; D-088; live STATE.
- **T1:** the V10 reference and its asset hashes; `ML-DEVOS-RFC-021` (server-side invariants retained); `coordination/OPERATIVE_OBLIGATIONS.md`.
- **T2:** current `app/**`, `components/site/**`, `lib/**`, `data/site.js`, `worker/**` (read-only), `wrangler.jsonc` (read-only).

## Exact execution scope

Only the D-092 allowed surfaces. No `worker/**`, `migrations/**`, `wrangler.jsonc`, `package*.json`, `app/admin/**`, `public/**` mutation, `.github/**`, or governance-history change.

## SENTINEL Sync

**Authority:** Paulo's explicit D-092 instruction. **Context:** the pending AS-119 re-review is superseded; its handoff is archived as evidence. **Capability:** local repository mutation, local build/test/browser verification, and a branch push that triggers a non-production Workers Builds preview. **Execution:** one implementation pass, one Protocol V2 return. **Evidence:** exact SHAs, changed files, test/build output, parity captures against V10, preview identity from the Workers Builds check run. Disposition `CLEAR`.

## SU Contradiction Check

Mode `BOUNDED_CONTRADICTION`, disposition `CLEAR_WITH_NOTES`:

1. V10 hardcodes five projects, `maisog36@gmail.com` and placeholder notes; D-088 facts win by owner answer, so these content areas intentionally differ from V10.
2. V10 has no API use; the public page stops calling `/api/design`, which changes RFC-021 §7 for the public page and needs Architect review.
3. This session cannot reach Cloudflare or the preview URL; preview verification is owner-run and must be reported as such.
4. The production `/api/journal` 500/1101 incident (AS-116) remains; the Research panel must fail safe inside the V10 layout.

## Instructions

1. Port the V10 template and component logic into a React client component without the `dc` runtime, Babel or CDN React; self-host fonts; reuse the hashed `public/v10/**` assets.
2. Replace the homepage, remove superseded frontend code and its obsolete tests, keep `/journal` and `/admin` working.
3. Classify every backend/API surface as required / replaced / unused / uncertain.
4. Verify: tests, build, Workers-runtime local check where possible, desktop/mobile parity against V10, interactions, console errors, network, accessibility.
5. SU adversarial pass.
6. Publish one Protocol V2 return; the push produces the preview build. Stop before production promotion.

## Validation and evidence

- `npm test`, `npm run build`, `git diff --check` pass.
- Parity captures against the pinned V10 reference at 1440×900 and 390×844 with residual differences listed.
- No uncaught page errors; no external runtime requests.
- Preview version ID/URL recorded from the Workers Builds check run once it completes.

## Stop conditions

Stop on any need to change a preserved surface, any destructive or production action, stale tip, or failed checker.

## Next action

Claude/Builder performs the replacement and returns `H-WEB-V10-CLEAN-0001` to the Architect with all action flags `NO`. Production promotion remains a separate owner decision.
