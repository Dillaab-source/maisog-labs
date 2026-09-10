# Architecture

## Overview
Maisog Labs is a statically exported Next.js portfolio deployed to Cloudflare Pages. The redesigned homepage uses one persistent cinematic visual world with floating editorial content, swipeable project cards, an orbital process system, and an administration route for content updates.

## Runtime flow
Visitor → Cloudflare Pages → statically generated Next.js site.

There is no database or server-side application dependency in the current version.

## Content model
Editable public content lives in `data/site.json`. Page components consume this JSON rather than hard-coding the main portfolio copy.

The `/admin/` route provides a field-based content editor. Publishing uses the GitHub Contents API from the administrator's browser to commit updates to `data/site.json` on the `main` branch. The connected Cloudflare deployment can then rebuild the public site from that commit.

### Admin publishing security
- Do not store a GitHub token in the repository, source code, or environment committed to Git.
- The current admin editor asks the administrator for a fine-grained GitHub token at publish time.
- Scope the token to this repository only and grant only `Contents: Read and write` permissions.
- The browser editor clears the token from React state after a successful publish and does not intentionally persist it to local storage.
- A future production-hardening step should replace manual token entry with a secure authentication/OAuth or Cloudflare Worker boundary.

## Experience architecture
- `app/page.js` owns the immersive homepage composition.
- `components/ProjectRail.js` owns horizontal drag/swipe project navigation.
- `components/AdminStudio.js` owns field-based content editing and publishing.
- `app/admin/page.js` exposes the administration route.
- `data/site.json` is the canonical editable content source.
- `public/` should own final production imagery when the hero art and project assets are finalized.

## Planned evolution
Future features may add:
- A protected Cloudflare Worker admin API and authentication layer.
- Cloudflare R2 or another managed media store for direct image uploads.
- Draft/preview/publish states instead of immediate Git commits.
- Reordering and adding/removing project cards from the admin portal.
- Claude/OpenAI API access through server-side code only.
- n8n webhooks for automations.
- Supabase/PostgreSQL or Cloudflare D1 if persistent application data becomes necessary.
- MCP tools for agent integrations.

## Boundaries
- `app/` owns routing and page composition.
- `components/` owns reusable presentation and interaction units.
- `data/` owns structured editable content.
- `public/` owns static assets.
- `docs/` owns human/AI-maintainer documentation.

## Security baseline
- Never expose provider API keys in browser code.
- Never commit `.env` files or secrets.
- Validate inputs at any future Worker/API boundary.
- Use least-privilege credentials for external services.
- Keep administrative publishing credentials short-lived and repository-scoped.

## Deployment contract
The current Cloudflare Pages deployment expects:
- Build command: `npm run build`
- Output directory: `out`
- Next.js static export enabled in `next.config.mjs`

If a future feature requires server-side rendering or dynamic routes that cannot be statically exported, document the change here before modifying deployment infrastructure.
