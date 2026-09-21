# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS_WEB_OPERATIONAL_BASELINE_POST_MERGE_DECOUPLING
TURN: ARCHITECT
STATUS: ARCHITECT_REVIEW_REQUIRED
AUTHORIZED_SCOPE: CLOUDFLARE_PRODUCTION_GIT_AUTODEPLOY_DECOUPLING_VERIFICATION_AND_REVIEW_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 2
MEDIA_MUTATION_AUTHORIZED: NO
MUTATION_AUTHORIZED: NO
AUDIT_APPEND_AUTHORIZED: YES
REMOTE_R2_AUTHORIZED: NO
REMOTE_D1_AUTHORIZED: NO
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Authority

D-057 selects Option B after GC-F001:
decouple main merge from production deployment.

## Architect authorization

Architect is authorized to append the verified D-057 remediation result
to coordination/ARCHITECT_REVIEW.md and commit that documentation-only
review to governance/maisoglabs-v0.1.

No application-code change, deployment, rollback, merge, D1/R2 mutation,
Access change, DNS/domain change, production-data write, S5+ work,
Skills V0.2 work, or PR #10 merge is authorized.

## Required release architecture

review PR
-> merge gate
-> main
-> separate production deploy gate
-> runtime verification

Non-production PR/branch previews remain permitted under D-055.

## Exact Cloudflare remediation

Use the existing Workers Git integration, but change the production Deploy command so a push/merge to main uploads a version without promoting it to active production.

Cloudflare Worker:
maisog-labs

Dashboard path:
Workers & Pages
-> maisog-labs
-> Settings
-> Build
-> Deploy command

Change:
npx wrangler deploy

To:
npx wrangler versions upload

Save the build settings.

Keep the non-production branch deploy command at:
npx wrangler versions upload

Keep non-production branch builds enabled so governed PR previews remain available.

Do NOT disconnect the Git repository unless the above supported deploy-command separation proves unavailable.

## Why this remediation

Cloudflare Workers Builds normally executes the production deploy command for the production Git branch. Cloudflare documents that changing the deploy command to `npx wrangler versions upload` allows automatic builds to continue while creating versions without promoting them to the active production deployment.

This preserves:
- Git-connected build evidence;
- PR/branch previews;
- automatic compile/test-adjacent build feedback.

It restores:
- explicit production promotion as a separate owner-gated action.

## Verification gate

After saving the Cloudflare setting, Paulo says `ur turn`.

Architect must then verify, using available evidence:
1. future production-branch Git builds are configured to use version upload rather than production deploy;
2. non-production preview builds remain available;
3. current live production version is not rolled back or replaced by the setting change itself;
4. no remote D1/R2/Access/DNS mutation occurred.

If direct Cloudflare configuration evidence cannot be independently read with the connected tool surface, require a screenshot of Settings > Build showing both deploy commands before closing this remediation.

## Current main / production evidence

main:
882ad253b5dbec06b209d1ee1a2a54b21b392e2e

Current known Cloudflare version produced by Gate C auto-deploy:
a28ee2e9-a9a0-4528-b89f-07e0c827be2b

No rollback is authorized by D-057.

## Hard boundaries

No additional production deploy/rollback.
No remote D1/R2.
No production Access mutation.
No DNS/domain mutation.
No production data write.
No public D1 cutover.
No S5+.
No Skills V0.2.
No PR #10 merge.
