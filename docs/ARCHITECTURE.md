# Architecture

## Overview
Maisog Labs V4 is a statically exported Next.js portfolio deployed to Cloudflare. The current foundation is deliberately minimal while the final brand and logo are undecided.

## Runtime flow
Visitor → Cloudflare Pages → statically generated Next.js site.

There is no database and no server-side application dependency in Phase 1.

## V4 foundation presentation layer

1. `app/page.js` contains only the minimal public composition.
2. `app/globals.css` provides a small responsive design baseline without imagery or animation.
3. `data/site.js` remains the local source for reusable public content until a later CMS phase.
4. The header uses a temporary text wordmark. A final logo must be approved before a graphic brand asset is integrated.

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
