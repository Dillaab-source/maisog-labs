# Maisog Labs — Architecture Audit V1

Audit date: 2026-09-12
Scope: repository state only
Branch: `master-plan-v1`

This file records verified repository facts and known drift. It intentionally does not claim live Cloudflare account state.

## Verified repository facts

1. The public application uses Next.js App Router and React.
2. `next.config.mjs` currently uses `output: "export"` and unoptimized images.
3. The generated static output directory is `out`.
4. `package.json` currently contains a `wrangler deploy` script.
5. `wrangler.jsonc` currently serves `./out` as static assets and has no D1 or R2 binding configured.
6. The current committed dependency baseline includes Next.js 15.5.2, React 19.1.0, React DOM 19.1.0, and Wrangler ^4.35.0.
7. No `package-lock.json` was present when Master Plan V1 was established.
8. `main` does not contain the Admin V1 route.
9. The existing `admin-v1` branch contains a preview-only `/admin` interface and its admin architecture document; it does not yet contain the secure persistence/API implementation described by the Master Plan.
10. The original `.gitignore` excluded `.env` patterns but did not exclude `.dev.vars` patterns. The `master-plan-v1` branch now corrects this without changing runtime behavior.

## Documented architecture drift

### Deployment terminology

Existing documentation refers to Cloudflare Pages while the repository also contains Wrangler deployment/static-assets configuration. Master Plan V1 chooses Cloudflare Workers Static Assets plus Worker API functionality as the planned direction, while keeping the frontend statically exported where practical.

Action:
- Do not rewrite production deployment configuration from the work phone/session.
- Verify the actual current Cloudflare deployment from the controlled PC first.
- After verification, update README/ARCHITECTURE documentation and deployment configuration together so documentation matches reality.

### Dependency baseline

The current dependency baseline must be re-evaluated against official security advisories and supported releases at implementation time.

Action:
- Do not perform dependency upgrades without a local build/test environment.
- At home, upgrade on a non-production branch, create/commit the lockfile, run a clean install/build, and record exact versions/results in the change log.

### Authentication/infrastructure state

Repository documentation describes intended Cloudflare Access, D1, R2, and future MCP behavior, but repository files cannot prove the live account configuration.

Unverified until the home/Cloudflare session:
- exact Access application routes
- exact Access allow/bypass policies
- MFA status
- Access audience/issuer values
- D1 resource existence/configuration
- R2 resource existence/configuration
- current production Worker/routes/bindings

No implementation should convert these assumptions into trusted runtime behavior until they are verified from the account.

## Audit conclusion

No runtime/deployment change is required from the current remote/work session.

The correct immediate action is governance/documentation preparation only, followed by live-account verification and local build validation from the controlled PC.