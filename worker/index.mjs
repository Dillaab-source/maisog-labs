// WEB-INC-001 Worker entrypoint. Referenced by wrangler.jsonc's "main".
// Only /admin and /admin/* are routed here (assets.run_worker_first) — every
// other request never reaches this file and is served asset-first by Wrangler.
//
// Required non-secret runtime bindings (configured outside tracked source):
//   ACCESS_TEAM_DOMAIN — e.g. "your-team.cloudflareaccess.com"
//   ACCESS_AUD         — the Access application audience (AUD) tag
// No secret, private key, or administrator identity is read or stored here.
import { createRemoteJWKSet } from "jose";
import { handleRequest } from "./auth.mjs";

let cachedJWKS;
let cachedTeamDomain;

function getJWKS(teamDomain) {
  if (!cachedJWKS || cachedTeamDomain !== teamDomain) {
    cachedJWKS = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    cachedTeamDomain = teamDomain;
  }
  return cachedJWKS;
}

export default {
  async fetch(request, env) {
    return handleRequest(request, {
      assets: env.ASSETS,
      jwks: getJWKS(env.ACCESS_TEAM_DOMAIN),
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
      audience: env.ACCESS_AUD,
    });
  },
};
