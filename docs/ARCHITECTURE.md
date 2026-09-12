# Architecture

## Overview
Maisog Labs V4 is a statically exported Next.js portfolio deployed to Cloudflare. Phase 1 now includes the approved cosmic visual direction while keeping the final production logo independently replaceable.

## Runtime flow
Visitor → Cloudflare Pages → statically generated Next.js site.

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
- Supabase/PostgreSQL if persistent application data becomes necessary.
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
The current Cloudflare Pages deployment expects:
- Build command: `npm run build`
- Output directory: `out`
- Next.js static export enabled in `next.config.mjs`

If a future feature requires server-side rendering or dynamic routes that cannot be statically exported, document the change here before modifying deployment infrastructure.
