# AGENTS.md

This repository is the source for the Maisog Labs portfolio website.

## Project goals
- Keep the site fast, accessible, and easy to maintain.
- Preserve the premium editorial visual direction: neutral palette, serif display typography, strong spacing, architectural imagery, and the orbital motif.
- Prefer simple, understandable code over unnecessary abstractions.

## Stack
- Next.js App Router
- React
- Static export for Cloudflare Pages

## Repository map
- `app/` — routes and page composition.
- `components/` — reusable UI components.
- `data/` — editable content and project metadata.
- `public/` — local static assets such as portraits, logos, project screenshots, and icons.
- `docs/` — architecture, content, deployment, and maintenance notes.

## Editing rules
1. Keep content separate from layout when practical. Update `data/site.js` for project metadata and reusable site text.
2. Reusable UI belongs in `components/`; route-specific composition belongs in `app/`.
3. Prefer local assets in `public/` for production rather than long-term dependence on remote stock URLs.
4. Do not place API keys, tokens, secrets, or private data in the repo. Use environment variables and Cloudflare secrets for future integrations.
5. Keep static export compatibility unless a documented architecture decision changes hosting.
6. Before major changes, update `docs/ARCHITECTURE.md` if the structure or deployment model changes.
7. Keep commits focused and use clear messages.

## Validation checklist
- `npm install`
- `npm run build`
- Confirm the static export completes successfully.
- Check desktop and mobile layouts.
- Check navigation links and email links.
- Confirm no secrets or personal data were accidentally committed.

## AI-agent guidance
- Read `README.md`, this file, and `docs/ARCHITECTURE.md` before making broad changes.
- Inspect existing components and data modules before creating duplicates.
- Make the smallest coherent change that satisfies the task.
- Explain architectural changes in the commit or PR description.
