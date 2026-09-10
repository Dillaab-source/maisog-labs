# Architecture

## Overview
Maisog Labs is currently a statically exported Next.js portfolio deployed to Cloudflare Pages.

## Runtime flow
Visitor → Cloudflare Pages → statically generated Next.js site.

There is no database and no server-side application dependency in V1.

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
