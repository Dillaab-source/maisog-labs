# Contributing to Maisog Labs

Thanks for helping improve the project.

## Before making changes

1. Read `README.md`.
2. Read `AGENTS.md` if you are using an AI coding assistant.
3. Read `docs/ARCHITECTURE.md` before changing structure, hosting, or integrations.
4. Keep changes small and focused.

## Code organization

- Routes and page composition: `app/`
- Reusable UI: `components/`
- Structured content: `data/`
- Static assets: `public/`
- Architecture and maintenance docs: `docs/`

## Commit style

Use short, descriptive commit messages, for example:

- `Add ClinicFlow project page`
- `Refine mobile hero spacing`
- `Document Cloudflare deployment`

Avoid mixing unrelated changes in the same commit.

## Pull request checklist

- The change has a clear purpose.
- `npm run build` succeeds.
- Desktop and mobile layouts were checked.
- No API keys, credentials, or private data were added.
- Documentation was updated if architecture or editing conventions changed.
