# Current Directive — Homepage Artifact Integration

```yaml
schema_version: 1
directive_id: DIR-WEB-HOMEPAGE-ARTIFACT-0001
cycle_id: MAISOGLABS_WEB_HOMEPAGE_ARTIFACT
issue_parent_commit: 3a8bb779ddb7ecf6daca2655f0844986c3b81aa8
target_turn: CLAUDE
authority_ref: D-093
applicable_review_id: ML-DEVOS-AS-119
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-093 and this directive.

## Objective

Serve `publish/index.html` from `Maisog Labs Design System.zip` (SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`) byte-for-byte as the public homepage `/`, with its expected media resolving to the existing approved assets, while `/journal`, `/admin`, the Worker APIs and all bindings keep working; verify locally; obtain a non-production preview through the existing Workers Builds branch build.

## Preconditions

- Protocol V2 bootstrap from the tip publishing this directive; D-093, this directive and scope `D093_HOMEPAGE_ARTIFACT_PREVIEW_ONLY` selected together; `MUTATION_AUTHORIZED: YES`, every other action flag `NO`.
- `main` remains `aebc881e8890c00090d714602591138a045bd3b0`.

## Governing references

- **T0:** Protocol V2; D-093; live STATE.
- **T1:** the uploaded ZIP and its single file; D-092 records (superseded for `/`); `coordination/OPERATIVE_OBLIGATIONS.md`.
- **T2:** `app/**`, `public/**`, `wrangler.jsonc` and `worker/**` (read-only).

## Exact execution scope

Only the D-093 allowed surfaces. The artifact file is never edited.

## SENTINEL Sync

**Authority:** Paulo's explicit D-093 instruction. **Context:** the pending D-092 review and the Architect's reconciliation-analysis request are superseded; the D-092 handoff is archived. **Capability:** local repository mutation, local build/test/browser/workerd verification, and a branch push that triggers a non-production preview build. **Execution:** one pass, one Protocol V2 return. **Evidence:** artifact hash before and after build, media mapping hashes, acceptance checks, preview identity. Disposition `CLEAR`.

## SU Contradiction Check

Mode `BOUNDED_CONTRADICTION`, disposition `CLEAR_WITH_NOTES`:

1. The artifact's hardcoded content contradicts D-088 facts; the owner instruction forbids editing it, so the contradiction is recorded, not resolved.
2. The artifact executes in-browser Babel and development React bundled inside itself; this contradicts RFC-021 R2 for `/` and is recorded.
3. The Builder cannot reach Cloudflare or the preview host; preview verification is owner-run.
4. The artifact's media are not inside the ZIP; they must resolve to existing approved assets, and any mismatch must be reported.

## Instructions

1. Place the artifact byte-identically at `public/index.html` and remove the Next.js homepage so the static export copies it to `out/index.html` unchanged.
2. Serve the artifact's expected media paths with byte-identical copies of the approved V10 assets.
3. Remove only the homepage code the artifact supersedes; keep `/journal` and `/admin` untouched.
4. Verify the 15 acceptance checks, run the full suite and build, and check the Worker routes locally.
5. Publish one Protocol V2 return; stop before production promotion.

## Validation and evidence

- Artifact SHA-256 equal in the ZIP, in `public/index.html`, and in `out/index.html` after build.
- `npm test`, `npm run build`, `git diff --check` pass.
- Browser checks for JavaScript execution, logo video playback and crossfade, Full/Calm/Still, orbit motion, panels, mobile, `/journal`, `/admin`, Worker APIs, no external runtime requests.

## Stop conditions

Stop on any need to edit the artifact, change a preserved surface, deploy, promote, merge, or mutate remote resources.

## Next action

Claude/Builder performs the integration and returns `H-WEB-HOMEPAGE-ARTIFACT-0001` to the Architect with all action flags `NO`.
