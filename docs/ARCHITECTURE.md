# Architecture

## Overview
Maisog Labs V4 is a statically exported Next.js portfolio deployed to Cloudflare. Phase 1 now includes the approved cosmic visual direction while keeping the final production logo independently replaceable.

## Runtime flow
Ordinary public routes: visitor → Cloudflare Worker static assets (asset-first) → statically generated Next.js site, unchanged by `WEB-INC-001`.

`/admin` and `/admin/*` only: visitor → Worker (`worker/index.mjs`, routed via `wrangler.jsonc`'s `assets.run_worker_first`) → server-side Cloudflare Access assertion verification (`worker/auth.mjs`, using `jose`) → on success, the same Assets binding serves the static admin placeholder; on failure, `401 Unauthorized` with no asset served. This is the only server-executed request path in the current deployment; no other route touches the Worker script.

There is still no database and no persistent server-side application dependency. `WEB-INC-001` adds an authentication boundary only — no content read/write, no session storage.

## V4 foundation presentation layer

1. `app/page.js` composes the public homepage, project rail, process, about, and contact paths.
2. `app/globals.css` owns the responsive Lunar Tech presentation, background layering, glass panels, and reduced-motion behavior.
3. `data/site.js` remains the local source for reusable public content until a later CMS phase.
4. `components/Logo.js` contains the replaceable 4B-style header lockup. Its signature source is provisional until the final vector is approved.
5. `components/ProjectRail.js` is the only client component; the rest of the page remains statically rendered.
6. The clean cinematic artwork is a local optimized WebP asset. The original infographic is not used as a page background.

## Planned evolution
Future features may add:
- Cloudflare Worker endpoints for secure server-side integrations.
- Claude/OpenAI API access through server-side code only.
- n8n webhooks for automations.
- D1 for structured content and audit history, after server-side authorization is established.
- R2 for media, after the content and authorization boundaries are tested.
- MCP tools for agent integrations.

## Boundaries
- `app/` owns routing and page composition (including the `app/admin/page.js` authentication-boundary placeholder — not a content-editing surface).
- `components/` owns reusable presentation units.
- `data/` owns structured editable content.
- `public/` owns static assets.
- `docs/` owns human/AI-maintainer documentation.
- `worker/` owns the server-executed authentication boundary for `/admin`/`/admin/*` only (`WEB-INC-001`, `ML-DEVOS-RFC-002`). It performs no content mutation and no database access.

## Security baseline
- Never expose provider API keys in browser code.
- Never commit `.env` files or secrets.
- Validate inputs at any future Worker/API boundary.
- Use least-privilege credentials for external services.

## Deployment contract
The Wrangler deployment expects:
- Build command: `npm run build`
- Output directory: `out`
- Next.js static export enabled in `next.config.mjs`
- Worker entrypoint: `worker/index.mjs` (`wrangler.jsonc`'s `main`), selectively routed only for `/admin` and `/admin/*` via `assets.run_worker_first` — every other route remains asset-first, exactly as before `WEB-INC-001`.
- Non-secret runtime vars `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` are placeholders in `wrangler.jsonc`; real values are set outside tracked source and only after a separately authorized production Cloudflare Access application exists (`ML-DEVOS-RFC-002` §§3–4, `ML-DEVOS-AS-011` `AS11-F003`). No production deployment or Cloudflare Access configuration is authorized by this increment.

If a future feature requires server-side rendering or dynamic routes that cannot be statically exported, document the change here before modifying deployment infrastructure.

## Phase 2 content boundary

The build reads `data/site.js` through `lib/content/local.mjs`, validates the entire document with `schema.mjs`, and projects published records through `public.mjs`. The page and metadata consume only that projection. Client components must never import the raw source or adapter.

Storage remains local and Git-backed. The async reader is a seam for a future D1 implementation, not a database connection. Static output still requires rebuilding and redeploying after edits. Draft filtering is not authentication: source in a public repository remains public, including drafts. Never store private content or credentials there.

Schema validation rejects unknown fields, unsupported versions, unsafe links, duplicate identifiers, malformed data, and unsupported presentation tokens. Invalid content stops the build. There is no public preview or write endpoint. Admin identity stays outside editable public content; admin setup and Cloudflare deployment remain pending.
