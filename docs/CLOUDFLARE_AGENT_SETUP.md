# Cloudflare Agent Setup for Maisog Labs

This project is already a Cloudflare Workers project and includes `wrangler.jsonc` plus Wrangler in `devDependencies`. The preferred AI-agent setup follows Cloudflare's current OpenAI Codex guide.

## Preferred agent path: OpenAI Codex

1. Open Codex from the repository root (the directory containing `wrangler.jsonc`).
2. In Codex, open `/plugins` and install the **Cloudflare** plugin.
   - This installs Cloudflare Skills.
   - It also registers Cloudflare MCP servers for live Cloudflare API access.
3. The first time a Cloudflare MCP tool needs account access, complete the Cloudflare OAuth flow in the browser and grant only the permissions needed for the task.
4. Verify the connection with:
   - `codex mcp list`
   - `/mcp` inside the Codex TUI
5. If the bundled plugin is unavailable, add the Cloudflare Code Mode MCP server manually:
   - `codex mcp add cloudflare --url https://mcp.cloudflare.com/mcp`

## Useful official MCP endpoints

- Cloudflare API / Code Mode: `https://mcp.cloudflare.com/mcp`
- Documentation: `https://docs.mcp.cloudflare.com/mcp`
- Workers Builds: `https://builds.mcp.cloudflare.com/mcp`
- Observability: `https://observability.mcp.cloudflare.com/mcp`
- Workers Bindings: `https://bindings.mcp.cloudflare.com/mcp`

Use the broad Cloudflare API MCP for platform operations such as DNS, WAF, D1, R2, Workers, and Zero Trust. Use the focused servers when build or observability context is the primary task.

## Wrangler

Wrangler remains the preferred tool for local development, deployments, migrations, and Workers-specific commands. Common project commands are already defined in `package.json`:

```sh
npm run build
npm run deploy
```

For account/resource work, prefer OAuth through the official Cloudflare MCP plugin rather than placing API tokens in repository files.

## Security rules

- Never commit Cloudflare API tokens, OAuth tokens, account secrets, Access service tokens, or application secrets.
- Use least-privilege OAuth permissions.
- Keep production changes behind the Maisog Labs workflow: plan -> panel review -> implementation -> local test -> preview -> approval -> merge/deploy.
- Prefer preview/branch deployments for changes that can affect public traffic.
- Use Cloudflare secrets/bindings for sensitive runtime values.
- Treat DNS, custom-domain, Access policy, WAF, D1 migration, R2 deletion, and production deployment changes as privileged operations that require explicit review.

## Current Maisog Labs Cloudflare context

- Worker/project name: `maisog-labs`
- Deployment model: static Next.js export served by Cloudflare Workers assets
- Build command: `npm run build`
- Production deploy command: `wrangler deploy`
- Non-production branch builds are used for preview before production merge.

## Authoritative references

- Agent setup: https://developers.cloudflare.com/agent-setup/
- Codex setup: https://developers.cloudflare.com/agent-setup/codex/
- Docs for agents: https://developers.cloudflare.com/docs-for-agents/

Re-check the live Cloudflare setup guide before changing MCP or agent configuration because Cloudflare's agent tooling evolves quickly.
