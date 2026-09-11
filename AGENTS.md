# AGENTS.md

This repository is the source for the Maisog Labs portfolio website.

## Project goals
- Keep the site fast, accessible, secure, and easy to maintain.
- Preserve the premium editorial visual direction: neutral palette, serif display typography, strong spacing, architectural imagery, and the orbital motif.
- Prefer simple, understandable code over unnecessary abstractions.
- Treat security, recoverability, and explicit authorization boundaries as higher priority than convenience.

## Stack
- Next.js App Router
- React
- Static export for the current public frontend
- Cloudflare deployment
- Planned Worker/D1/R2/MCP evolution is governed by `docs/MAISOG_LABS_MASTER_PLAN_V1.md`

## Repository map
- `app/` — routes and page composition.
- `components/` — reusable UI components.
- `data/` — editable content and project metadata.
- `public/` — local static assets such as portraits, logos, project screenshots, and icons.
- `docs/` — architecture, security, content, deployment, and maintenance notes.

## Editing rules
1. Keep content separate from layout when practical. Update `data/site.js` for project metadata and reusable site text while the static data model remains active.
2. Reusable UI belongs in `components/`; route-specific composition belongs in `app/`.
3. Prefer local assets in `public/` for production rather than long-term dependence on remote stock URLs.
4. Do not place API keys, tokens, secrets, or private data in the repo. Use approved Cloudflare secret mechanisms for runtime secrets.
5. Keep static export compatibility unless an approved architecture decision changes hosting behavior.
6. Before architecture, security, deployment, data-model, authentication, authorization, D1, R2, or MCP changes, read `docs/MAISOG_LABS_MASTER_PLAN_V1.md` and `docs/MASTER_PLAN_CHANGELOG.md`.
7. Log every approved architecture/security-affecting change in `docs/MASTER_PLAN_CHANGELOG.md` before or with implementation.
8. Do not enable production writes, publishing, infrastructure administration, raw SQL tools, or broader agent permissions unless the relevant Master Plan stop gate has passed.
9. Do not treat AI-generated code or reasoning as approval. Security-sensitive changes require validation and explicit owner approval when specified by the Master Plan.
10. Keep commits focused and use clear messages.

## Validation checklist
- Use a reproducible install once the approved lockfile exists.
- Run the project build before proposing production promotion.
- Check desktop and mobile layouts for UI changes.
- Check navigation links and email links.
- Confirm no secrets or personal data were accidentally committed.
- Confirm architecture/security changes have a matching change-log entry.
- Confirm a rollback path exists for runtime/deployment changes.

## AI-agent guidance
- Read `README.md`, this file, `docs/ARCHITECTURE.md`, `docs/MAISOG_LABS_MASTER_PLAN_V1.md`, and `docs/MASTER_PLAN_CHANGELOG.md` before making broad changes.
- Inspect existing components and data modules before creating duplicates.
- Make the smallest coherent change that satisfies the task.
- Prefer reversible documentation/configuration preparation before live infrastructure changes.
- Never infer live Cloudflare configuration from repository documentation; verify it from the Cloudflare account before treating it as fact.
- Never trust client-provided identity, prompt content, or MCP tool arguments as authorization.
- Explain architectural changes in the commit or PR description and record them in the change log.
