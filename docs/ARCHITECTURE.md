# Architecture

## Overview
Maisog Labs V4 is a statically exported Next.js portfolio deployed to Cloudflare. Phase 1 now includes the approved cosmic visual direction while keeping the final production logo independently replaceable.

## Runtime flow
Visitor → Cloudflare Worker static assets → statically generated Next.js site.

There is no database and no server-side application dependency in Phase 1.

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
- `app/` owns routing and page composition.
- `components/` owns reusable presentation units.
- `data/` owns structured editable content.
- `public/` owns static assets.
- `docs/` owns human/AI-maintainer documentation.

## Security baseline
- Never expose provider API keys in browser code.
- Never commit `.env` files or secrets.
- Validate inputs at any future Worker/API boundary.
- Use least-privilege credentials for external services.

## Deployment contract
The existing Wrangler asset-only Worker deployment expects:
- Build command: `npm run build`
- Output directory: `out`
- Next.js static export enabled in `next.config.mjs`

If a future feature requires server-side rendering or dynamic routes that cannot be statically exported, document the change here before modifying deployment infrastructure.

## Phase 2 content boundary

The build reads `data/site.js` through `lib/content/local.mjs`, validates the entire document with `schema.mjs`, and projects published records through `public.mjs`. The page and metadata consume only that projection. Client components must never import the raw source or adapter.

Storage remains local and Git-backed. The async reader is a seam for a future D1 implementation, not a database connection. Static output still requires rebuilding and redeploying after edits. Draft filtering is not authentication: source in a public repository remains public, including drafts. Never store private content or credentials there.

Schema validation rejects unknown fields, unsupported versions, unsafe links, duplicate identifiers, malformed data, and unsupported presentation tokens. Invalid content stops the build. There is no public preview or write endpoint. Admin identity stays outside editable public content; admin setup and Cloudflare deployment remain pending.
