# Maisog Labs

Maisog Labs is Paulo Maisog's portfolio and experimental studio for automation, AI systems, and practical digital projects.

The current branch contains the V4 public foundation: a cinematic human–AI background, accessible floating content panels, and a local content layer. The header uses a provisional Signature Fusion lockup that can be replaced without changing page composition.

## Stack

- Next.js App Router
- React
- Static export
- Cloudflare Pages

## Repository structure

```text
maisog-labs/
├─ app/                 # Routes and page composition
│  ├─ globals.css
│  ├─ layout.js
│  └─ page.js
├─ components/          # Reusable UI components
│  └─ Logo.js
├─ data/                # Structured editable content
│  └─ site.js
├─ docs/                # Architecture and maintenance docs
│  ├─ ARCHITECTURE.md
│  └─ CONTENT.md
├─ public/              # Static assets; add project images here over time
├─ AGENTS.md            # Instructions for AI coding agents
├─ next.config.mjs
├─ package.json
└─ README.md
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

Content contract checks: `npm test`. Public pages consume the validated build-time adapter in `lib/content/local.mjs`; edit the source document in `data/site.js`. See `docs/CONTENT.md` for publishing-state semantics and privacy limitations.

The project uses a static export. The generated site is written to:

```text
out
```

## Cloudflare Pages

Use:

```text
Build command: npm run build
Output directory: out
```

## Where to edit things

- Portfolio/project content: `data/site.js`
- Reusable UI: `components/`
- Page composition/routes: `app/`
- Styling: `app/globals.css`
- Architecture/deployment decisions: `docs/ARCHITECTURE.md`
- Content conventions and assets: `docs/CONTENT.md`
- Version history and rollback references: `docs/CHANGE_LEDGER.md`
- AI-agent instructions: `AGENTS.md`

## Before the final V4 release

- Replace the provisional signature bitmap with the approved production vector.
- Confirm the final logo spacing at small header and favicon sizes.
- Replace placeholder project and social links.
- Confirm the contact email.
- Run `npm run build` and test desktop/mobile layouts.

## Future architecture

Do not add a database or server layer until a feature actually requires one. Planned integrations such as Claude/OpenAI, n8n, MCP, or a database should use secure server-side boundaries such as Cloudflare Workers. Never commit API keys or secrets.
